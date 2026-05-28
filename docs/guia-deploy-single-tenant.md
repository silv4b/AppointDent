# Guia de Deploy — AppointDent (Single-Tenant)

> **Data:** Maio/2026
> **Modelo:** Single-tenant — cada clínica/consultório tem seu próprio projeto Supabase e sua própria instância do front-end.
> **Stack:** Next.js 16 + Supabase (Auth + PostgreSQL) + Tailwind CSS v4

---

## Índice

1. [Arquitetura](#1-arquitetura)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Fluxo de deploy para uma nova clínica](#3-fluxo-de-deploy-para-uma-nova-clínica)
4. [Passo 1 — Criar o projeto Supabase](#4-passo-1--criar-o-projeto-supabase)
5. [Passo 2 — Configurar o Supabase Auth](#5-passo-2--configurar-o-supabase-auth)
6. [Passo 3 — Deploy das migrations](#6-passo-3--deploy-das-migrations)
7. [Passo 4 — Configurar Storage (opcional)](#7-passo-4--configurar-storage-opcional)
8. [Passo 5 — Deploy do front-end](#8-passo-5--deploy-do-front-end)
9. [Passo 6 — Configurar variáveis de ambiente](#9-passo-6--configurar-variáveis-de-ambiente)
10. [Passo 7 — Criar primeiro usuário administrador](#10-passo-7--criar-primeiro-usuário-administrador)
11. [Manutenção e backups](#11-manutenção-e-backups)
12. [Checklist de produção](#12-checklist-de-produção)
13. [Solução de problemas](#13-solução-de-problemas)
14. [Automação com scripts](#14-automação-com-scripts)

---

## 1. Arquitetura

```mermaid
flowchart TD
    subgraph "Clínica A"
        A1[Supabase<br/>Projeto A] --> A2[(PostgreSQL A)]
        A3[Vercel/Netlify<br/>Front-end A] --> A1
    end

    subgraph "Clínica B"
        B1[Supabase<br/>Projeto B] --> B2[(PostgreSQL B)]
        B3[Vercel/Netlify<br/>Front-end B] --> B1
    end

    subgraph "Desenvolvedor"
        C[GitHub<br/>appointdent] --> D[supabase/migrations/]
        D --> A1
        D --> B1
    end
```

Cada clínica é completamente isolada:

- **Banco de dados**: projeto Supabase próprio
- **Autenticação**: Auth configurado por projeto
- **Front-end**: instância própria do Next.js (domínio próprio ou subdomínio)
- **Dados**: sem compartilhamento entre tenants

---

## 2. Pré-requisitos

### Contas necessárias

| Serviço | Finalidade | Plano mínimo |
|---------|-----------|--------------|
| [Supabase](https://supabase.com) | Banco + Auth + Storage | Free (2 projetos) ou Pro |
| [Vercel](https://vercel.com) ou [Netlify](https://netlify.com) | Hospedar o Next.js | Free |
| [GitHub](https://github.com) | Código + CI/CD | Free |

### Ferramentas locais (para o desenvolvedor)

- Node.js 20+
- NPM
- Supabase CLI (`npm install supabase@latest --save-dev` — já incluso)
- Git

### Conhecimento necessário

- Terminal básico (PowerShell)
- Next.js build/deploy
- Supabase Dashboard

---

## 3. Fluxo de deploy para uma nova clínica

```
1. Criar projeto Supabase ───────→ Dashboard
2. Configurar Auth (SMTP, URL)  ─→ Dashboard
3. Rodar migrations no projeto  ─→ supabase db push
4. Seeder dados iniciais         ─→ supabase db push --include-seed (opcional)
5. Fazer deploy do front-end    ─→ Vercel / Netlify
6. Configurar env vars no host  ─→ Dashboard do host
7. Criar admin e testar          ─→ /login
```

---

## 4. Passo 1 — Criar o projeto Supabase

### 4.1 Criar no Dashboard

1. Acesse [https://supabase.com/dashboard/projects](https://supabase.com/dashboard/projects)
2. Clique em **New Project**
3. Preencha:

| Campo | Valor |
|-------|-------|
| **Name** | `appointdent-clinica-nome` (ex: `appointdent-sorriso`) |
| **Database Password** | Senha forte (mín 16 chars, guarde em cofre) |
| **Region** | `South America (São Paulo)` para clínicas brasileiras |
| **Pricing Plan** | Free para começar; **Pro** se precisar de backup point-in-time |

1. Aguarde ~2 minutos

### 4.2 Anotar credenciais

Após a criação, vá em **Project Settings → API** e anote:

```
Project Reference (URL):  https://xxxxxxxxxxxxxxx.supabase.co
Project Reference (ID):   xxxxxxxxxxxxxxx
Anon Key:                 eyJhbGciOiJ...
```

> ⚠️ A **Anon Key** é pública e pode ficar no front-end. A **Database Password** é secreta — nunca a compartilhe ou version.

### 4.3 Configurar o DB no Dashboard

No SQL Editor do projeto remoto, execute:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

> A extensão `btree_gist` é necessária para as constraints de exclusão de overlap nos agendamentos.

---

## 5. Passo 2 — Configurar o Supabase Auth

### 5.1 Site URL

Em **Authentication → URL Configuration**:

| Campo | Valor |
|-------|-------|
| **Site URL** | `https://meu-dominio.com.br` (ou URL do Vercel/Netlify) |
| **Redirect URLs** | `https://meu-dominio.com.br/**` |

### 5.2 SMTP (email de verdade)

Por padrão, o Supabase Free envia emails usando o próprio serviço (com taxa limitada e domínio genérico). Para produção, configure um SMTP real:

Em **Authentication → Settings → SMTP Settings**:

| Campo | Valor |
|-------|-------|
| **SMTP Host** | `smtp.sendgrid.net` (ou seu provedor) |
| **SMTP Port** | `587` |
| **SMTP User** | `apikey` |
| **SMTP Password** | sua chave de API |
| **Sender Email** | `naoresponder@meu-dominio.com.br` |
| **Sender Name** | `AppointDent` |

### 5.3 Confirmar email

Recomendado para produção: ativar confirmação de email.

Em **Authentication → Settings → General**:

- **Enable email confirmations**: **ON**

Isso impede que usuários com email inválido acessem o sistema.

### 5.4 Password requirements

Em **Authentication → Settings → General**:

- **Minimum password length**: `8`
- **Password requirements**: `lower_upper_letters_digits`

---

## 6. Passo 3 — Deploy das migrations

Na sua máquina local (ou no CI/CD):

### 6.1 Autenticar CLI

```powershell
supabase login
```

Abre o navegador para autorizar.

### 6.2 Linkar ao projeto remoto

```powershell
supabase link --project-ref xxxxxxxxxxxxxxx
```

Digite a **Database Password** quando solicitado.

### 6.3 Verificar migrations localmente

```powershell
supabase db reset
```

Isso recria o banco local aplicando todas as migrations. Se passar sem erros, prossiga.

### 6.4 Deploy para produção

```powershell
supabase db push
```

O CLI aplica apenas as migrations que ainda não estão no remoto.

### 6.5 Verificar

```powershell
supabase migration list
```

Todas as migrations devem aparecer com `[remote]` (X).

---

## 7. Passo 4 — Configurar Storage (opcional)

Se for usar upload de documentos do paciente:

1. No **Supabase Dashboard → Storage**, crie um bucket `patient-documents`
2. Configure RLS:

```sql
CREATE POLICY "authenticated users can view documents"
  ON storage.objects FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

---

## 8. Passo 5 — Deploy do front-end

O AppointDent é um Next.js App Router. As opções de deploy:

### Opção A: Vercel (recomendada)

1. Faça fork/clone do repositório para sua conta
2. Acesse [https://vercel.com](https://vercel.com)
3. Clique em **Add New → Project**
4. Importe o repositório
5. Configure as variáveis de ambiente (ver [Passo 6](#9-passo-6--configurar-variáveis-de-ambiente))
6. Clique em **Deploy**

O Vercel detecta automaticamente Next.js e usa as configurações padrão.

### Opção B: Netlify

1. Acesse [https://netlify.com](https://netlify.com)
2. **Add new site → Import an existing project**
3. Conecte ao repositório
4. Configure:

| Config | Valor |
|--------|-------|
| **Build command** | `npm run build` |
| **Publish directory** | `.next` |

1. Adicione as variáveis de ambiente
2. **Deploy**

### Opção C: Servidor dedicado (Docker / VPS)

```powershell
# Build local
npm run build

# Iniciar em produção
npm run start
```

Use um process manager como PM2:

```powershell
npm install -g pm2
pm2 start npm --name "appointdent" -- start
pm2 save
```

Configure nginx como reverse proxy com SSL (Let's Encrypt).

### 8.1 CSP para produção

Se o deploy for em domínio diferente do Supabase, a CSP em `next.config.ts` já permite `connect-src 'self' http://127.0.0.1:* https://*.supabase.co`. Para produção com domínio próprio, pode ser necessário adicionar o domínio à CSP:

```ts
connect-src 'self' https://meu-dominio.com.br https://*.supabase.co
```

---

## 9. Passo 6 — Configurar variáveis de ambiente

No provedor de front-end (Vercel/Netlify), configure:

| Variável | Onde encontrar | Exemplo |
|----------|---------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | `https://xxxxxxxxxxxxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → Anon Key | `eyJhbGciOiJ...` |

> O prefixo `NEXT_PUBLIC_` é necessário no Next.js para expor a variável ao cliente.

### No Vercel

**Project Settings → Environment Variables** — adicione ambas.

### No Netlify

**Site configuration → Environment variables** — adicione ambas. Depois faça um novo deploy.

---

## 10. Passo 7 — Criar primeiro usuário administrador

1. Acesse `https://meu-dominio.com.br/login`
2. Clique em **Criar conta**
3. Preencha nome, email e senha
4. Faça login

> O primeiro usuário recebe role `admin` automaticamente via trigger `handle_new_user()`.

### Alternativa: criar pelo Dashboard

No Supabase Dashboard → **Authentication → Users** → **Add User**, crie um usuário com email/senha, depois no **SQL Editor**:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@clinica.com'
);
```

---

## 11. Manutenção e backups

### 11.1 Backup diário automatizado

O Supabase **Pro** faz backup point-in-time automático. No plano **Free**, faça backups manuais periódicos:

Use o script abaixo (salve em `scripts/backup.ps1`):

```powershell
param(
  [Parameter(Mandatory)]
  [string]$ProjectRef,
  [Parameter(Mandatory)]
  [string]$DbPassword
)

$date = Get-Date -Format "yyyy-MM-dd"
$dir = "backups/$ProjectRef/$date"
New-Item -ItemType Directory -Path $dir -Force -ErrorAction SilentlyContinue

# Backup completo
& supabase db dump `
  --db-url "postgresql://postgres:${DbPassword}@db.${ProjectRef}.supabase.co:5432/postgres" `
  -f "$dir/backup-completo.sql"

# Backup schema-only
& supabase db dump `
  --db-url "postgresql://postgres:${DbPassword}@db.${ProjectRef}.supabase.co:5432/postgres" `
  --schema-only `
  -f "$dir/backup-schema.sql"

Write-Output "Backup salvo em: $dir"
```

Agende no Windows Task Scheduler ou cron:

```bash
# cron: todo dia às 3h
0 3 * * * /caminho/scripts/backup.sh "project-ref" "db-password"
```

### 11.2 Restore a partir de backup

```powershell
psql "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres" `
  -f backups/<project-ref>/<data>/backup-completo.sql
```

### 11.3 Aplicar novas migrations

Sempre que houver atualizações no repositório:

```powershell
git pull
supabase link --project-ref <project-ref>
supabase db push
```

### 11.4 Reativar projeto pausado (Free Plan)

O Supabase Free pausa projetos inativos após 7 dias. Para reativar:

1. Acesse o Dashboard do projeto
2. Clique em **Reactivate** no banner no topo
3. Ou faça qualquer requisição à API — o projeto reativa automaticamente

Para evitar pausa, faça um keep-alive (ex: cron job a cada 5 dias):

```bash
curl -s -o /dev/null -w "%{http_code}" https://<project-ref>.supabase.co/rest/v1/
```

---

## 12. Checklist de produção

### Supabase

- [ ] Projeto criado com região `sa-saopaulo`
- [ ] Senha do banco salva em cofre de senhas
- [ ] `btree_gist` extension ativada
- [ ] SMTP configurado para emails transacionais
- [ ] Confirmação de email ativada
- [ ] Site URL e Redirect URLs configurados
- [ ] Migrations aplicadas via `supabase db push`
- [ ] RLS policies verificadas

### Front-end

- [ ] Variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` configuradas
- [ ] Deploy feito no Vercel/Netlify
- [ ] Domínio configurado (DNS + SSL)
- [ ] CSP atualizada com o domínio real
- [ ] Build de produção funciona (`npm run build`)
- [ ] Lint passa (`npm run lint`)

### Testes

- [ ] Login com admin funciona
- [ ] Criação de dentista funciona
- [ ] Criação de paciente funciona
- [ ] Agendamento no calendário funciona
- [ ] Drag & drop funciona
- [ ] Anamnese salva e exporta
- [ ] Tema claro/escuro funciona
- [ ] Sidebar colapsa/persiste
- [ ] Responsivo (mobile) funcional
- [ ] Logout funciona

### Segurança

- [ ] Rate limiting de login (já incluso)
- [ ] CSP configurada
- [ ] Headers de segurança (X-Frame-Options, etc.)
- [ ] RLS ativa em todas as tabelas
- [ ] Zod validation em todas as server actions
- [ ] Senha do banco não está em lugar nenhum do código
- [ ] Backup automático configurado

---

## 13. Solução de problemas

### Erro: `extensions not found` ao rodar migration

```sql
ERROR: extension "btree_gist" does not exist
```

**Solução:** Execute no SQL Editor do Dashboard:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

Depois tente `supabase db push` novamente.

### Erro: `supabase link` não encontra o projeto

```
Error: Cannot find project with ref <id>
```

**Causa:** Project Reference incorreto ou CLI desatualizado.

**Solução:**

1. Verifique o ID em Project Settings → General
2. `npm install supabase@latest`
3. `supabase login` novamente

### Erro: `supabase db push` reclama de sync

```
Remote database has unapplied migrations
```

**Causa:** O banco remoto foi alterado manualmente via SQL Editor.

**Solução:**

```powershell
# Puxa o schema remoto
supabase db pull

# Commit a migration gerada
git add supabase/migrations/
git commit -m "sync: remote schema"

# Agora push funciona
supabase db push
```

### Erro: Login retorna "Invalid login credentials"

**Causa:** Usuário não existe, senha errada, ou confirmação de email pendente.

**Solução:**

1. Confirme que o usuário foi criado em Authentication → Users
2. Verifique se o email está confirmado (se confirmação estiver ativa)
3. Use "Esqueci minha senha" ou crie um novo usuário

### Erro: CSP bloqueia requisições

No console do navegador: `Refused to connect to '...' because it violates CSP`

**Solução:** Atualize a CSP em `next.config.ts` para incluir o domínio do Supabase:

```ts
connect-src 'self' https://meu-projeto.supabase.co
```

### Erro: App não carrega, tela em branco

**Causa:** Variáveis de ambiente não configuradas ou com valor errado.

**Solução:**

1. Verifique se as env vars estão no provedor de deploy
2. Verifique se os valores correspondem ao projeto correto
3. Refaça o deploy

---

## 14. Automação com scripts

### Script completo de provisionamento

Salve como `scripts/provision.ps1`:

```powershell
param(
  [Parameter(Mandatory)]
  [string]$ClinicaName,
  [Parameter(Mandatory)]
  [string]$DbPassword,
  [string]$Region = "sa-saopaulo"
)

# 1. Criar projeto Supabase via API (requer SUPABASE_ACCESS_TOKEN)
Write-Output "Criando projeto Supabase para $ClinicaName..."

$body = @{
  name = "appointdent-$ClinicaName"
  db_pass = $DbPassword
  region = $Region
  plan = "free"
} | ConvertTo-Json

$response = Invoke-RestMethod `
  -Uri "https://api.supabase.com/v1/projects" `
  -Method Post `
  -Headers @{
    "Authorization" = "Bearer $env:SUPABASE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
  } `
  -Body $body

$projectRef = $response.id
Write-Output "Projeto criado: $projectRef"

# 2. Aguardar provisioning
Start-Sleep -Seconds 120

# 3. Ativar btree_gist
Write-Output "Ativando extensão btree_gist..."
$sqlQuery = @{
  query = "CREATE EXTENSION IF NOT EXISTS btree_gist;"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "https://api.supabase.com/v1/projects/$projectRef/database/query" `
  -Method Post `
  -Headers @{
    "Authorization" = "Bearer $env:SUPABASE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
  } `
  -Body $sqlQuery

# 4. Linkar e dar push das migrations
supabase link --project-ref $projectRef
supabase db push

# 5. Retornar as credenciais
Write-Output "=== CREDENCIAIS ==="
Write-Output "Project Ref: $projectRef"
Write-Output "URL: https://${projectRef}.supabase.co"
Write-Output "Anon Key: (ver no Dashboard)"
```

> ⚠️ O script acima requer um **Supabase Access Token** (Settings → API → Access Tokens) e depende do Supabase Management API (beta).

---

## Apêndice A — Atualizando uma instância existente

```powershell
# 1. Puxar últimas mudanças do repositório
git pull origin main

# 2. Linkar ao projeto da clínica
supabase link --project-ref <project-ref>

# 3. Aplicar novas migrations
supabase db push

# 4. Se houver mudanças no front-end, redeploy automático via Vercel/Netlify
```

## Apêndice B — Migrando de local para produção

Se você já desenvolvia localmente com o Supabase local (`supabase start`):

```powershell
# 1. Parar Supabase local (opcional)
supabase stop

# 2. Criar projeto de produção (Passo 1)
# 3. Linkar
supabase link --project-ref <id>

# 4. Push das migrations
supabase db push

# 5. Se quiser levar os dados de teste
supabase db push --include-seed
```

## Apêndice C — Links úteis

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vercel Dashboard](https://vercel.com)
- [Netlify Dashboard](https://netlify.com)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Next.js Deploy Documentation](https://nextjs.org/docs/app/building-your-application/deploying)
- [Guia de Migrations (tutorial-deploy-supabase.md)](./tutorial-deploy-supabase.md)

---

*Documento gerado em 28/05/2026*
