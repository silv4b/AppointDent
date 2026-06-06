# Checklist de Deploy — AppointDent

## Índice

1. [Fazer backup do banco local](#1-fazer-backup-do-banco-local)
2. [Criar projeto Supabase cloud](#2-criar-projeto-supabase-cloud)
3. [Configurar autenticação no Supabase](#3-configurar-autenticação-no-supabase)
4. [Migrar schema + dados para a nuvem](#4-migrar-schema--dados-para-a-nuvem)
5. [Atualizar .env.local para usar o projeto cloud](#5-atualizar-envlocal-para-usar-o-projeto-cloud)
6. [Configurar variáveis de ambiente no Netlify](#6-configurar-variáveis-de-ambiente-no-netlify)
7. [Atualizar CSP no next.config.ts](#7-atualizar-csp-no-nextconfigts)
8. [Atualizar netlify.toml (se necessário)](#8-atualizar-netlifytoml-se-necessário)
9. [Fazer deploy no Netlify](#9-fazer-deploy-no-netlify)
10. [Configurar URL de redirecionamento no Supabase](#10-configurar-url-de-redirecionamento-no-supabase)
11. [Verificar o deploy](#11-verificar-o-deploy)

---

## 1. Fazer backup do banco local

Antes de qualquer alteração, faça um backup completo do banco local:

```powershell
# No terminal, na raiz do projeto:
$data = Get-Date -Format "yyyy-MM-dd"
$dir = ".db_backups/$data"
New-Item -ItemType Directory -Path $dir -Force

# Backup completo (schema + dados)
npx supabase db dump -f "$dir/backup-completo.sql"

# Backup só do schema (sem dados)
npx supabase db dump --schema-only -f "$dir/backup-schema.sql"
```

Os arquivos serão salvos em `.db_backups/<AAAA-MM-DD>/` (diretório já gitignored).

## 2. Criar projeto Supabase cloud

1. Acesse [supabase.com](https://supabase.com) e faça login.
2. Clique em **New project**.
3. Preencha:
   - **Name**: `appointdent` (ou nome da sua clínica)
   - **Database Password**: gere uma senha forte e **guarde-a** (não será usada no código, mas para acesso direto ao banco)
   - **Region**: escolha a mais próxima dos seus usuários (ex: `South America (São Paulo)`)
   - **Pricing Plan**: comece com o plano **Free** (pode fazer upgrade depois)
4. Clique em **Create new project**.
5. Aguarde a criação do projeto (~2 minutos).

### Anote as credenciais do projeto

Após criar, vá em **Project Settings → API** e anote:

| Campo | Onde usar |
|---|---|
| **Project URL** (ex: `https://abc123.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon public** (ex: `eyJhbGciOiJ...`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Reference ID** (ex: `abc123`) | `npx supabase link --project-ref` |

## 3. Configurar autenticação no Supabase

Acesse **Authentication → Settings** no painel do Supabase e ajuste:

```
- [DESATIVAR] Enable email confirmations
- [DESATIVAR] Enable signups
- [ATIVAR]   Secure email change
- Site URL:    http://localhost:3000   (será alterado após o deploy)
```

### SMTP (opcional, mas recomendado)

Sem SMTP configurado, emails de recuperação de senha não serão enviados. Para configurar:

1. Em **Authentication → Settings → SMTP Settings**, ative **Enable custom SMTP**.
2. Preencha com os dados do seu provedor de email (SendGrid, Resend, etc.).
3. Clique em **Save**.

> **Nota**: Se não configurar SMTP, a recuperação de senha não funcionará. O sistema continuará operando normalmente, mas para redefinir senha será necessário usar o SQL Editor ou a CLI do Supabase.

## 4. Migrar schema + dados para a nuvem

Este é o passo mais importante da migração local → nuvem. Existem duas abordagens:

### Abordagem A — Produção limpa (recomendado para primeiro deploy)

Cria apenas a estrutura do banco, sem os dados de teste do ambiente local.

```bash
# 1. Vincular ao projeto remoto
npx supabase link --project-ref <reference-id>

# 2. Aplicar todas as migrations (cria as tabelas, RLS, triggers, RPCs)
npx supabase db push
```

Depois de aplicar as migrations, crie o usuário admin:

```sql
-- Execute no SQL Editor do Supabase Studio
SELECT criar_admin(
  'admin@meuconsultorio.com',   -- troque pelo email desejado
  'MinhaSenhaForte@123',        -- troque pela senha desejada
  'Administrador'               -- troque pelo nome do admin
);
```

> Após criar o admin, os demais usuários (dentistas, recepcionistas) podem ser cadastrados pela interface do sistema em `/admin/usuarios`.

### Abordagem B — Migrar dados existentes do local

Útil se você já cadastrou pacientes, procedimentos, dentistas etc. no ambiente local e quer levar tudo para a nuvem.

```bash
# 1. Vincular ao projeto remoto
npx supabase link --project-ref <reference-id>

# 2. Aplicar as migrations (apenas schema)
npx supabase db push

# 3. Fazer dump dos dados do banco local (sem schema)
npx supabase db dump --data-only -f .db_backups/dados-locais.sql

# 4. ATENÇÃO: o dump inclui usuários do auth.users com IDs UUID
#    específicos. Se houver conflito com usuários já existentes na nuvem,
#    o restore falhará. Para um projeto recém-criado (sem nenhum usuário),
#    não deve haver conflitos.

# 5. Restaurar os dados no banco remoto
#    Abra o arquivo .db_backups/dados-locais.sql no SQL Editor do
#    Supabase Studio e execute. OU use psql:
#    psql "postgresql://postgres:<db-password>@<host>.supabase.co:5432/postgres" -f .db_backups/dados-locais.sql
```

> **⚠️ Cuidados com a Abordagem B:**
>
> - O dump `--data-only` inclui INSERTs para todas as tabelas, inclusive `auth.users` e `auth.identities`. O Supabase Cloud gerencia essas tabelas internamente — pode haver conflitos.
> - **Alternativa mais segura**: após o `supabase db push`, recrie manualmente apenas os dados de negócio (pacientes, procedimentos, dentistas, horários) pela interface do sistema, em vez de restaurar o dump bruto.
> - Os usuários (auth.users) **não devem** ser restaurados via dump. Crie-os manualmente pela interface em `/admin/usuarios`.

## 5. Atualizar .env.local para usar o projeto cloud

Edite o arquivo `.env.local` na raiz do projeto e substitua as URLs locais pelas do Supabase Cloud:

```env
# Antes (local)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUA_ANON_KEY>

# Depois (cloud)
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...  (anon key do projeto cloud)
```

Após alterar, reinicie o servidor de desenvolvimento:

```powershell
npm run dev
```

Faça um teste rápido: acesse `http://localhost:3000/login`, faça login com o admin criado no passo 4, e verifique se consegue navegar.

### Manter o ambiente local funcional em paralelo (opcional)

Se quiser continuar desenvolvendo com o Supabase local e apenas usar o cloud para produção:

1. **Não** altere o `.env.local` (mantenha apontando para `http://127.0.0.1:54331`).
2. Crie um arquivo `.env.production` com as credenciais cloud para uso em produção.
3. No Netlify, configure as variáveis de ambiente manualmente (passo 5).
4. O Netlify usa as variáveis configuradas na dashboard, não o `.env.local`.

Dessa forma, `npm run dev` continua usando o banco local, e o deploy usa o cloud.

## 6. Configurar variáveis de ambiente no Netlify

No painel do Netlify (**Site settings → Environment variables**), adicione:

| Variável | Valor | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<seu-projeto>.supabase.co` | Encontrado em **Project Settings → API → Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJ...` | Encontrado em **Project Settings → API → anon public** |

**Não** inclua `NEXT_PRIVATE_DB_PASSWORD` — esta variável foi removida por não ser utilizada.

> **Importante**: Marque ambas como **"Available at build time and runtime"** no Netlify.

## 7. Atualizar CSP no next.config.ts

No arquivo `next.config.ts`, altere o `connect-src` no CSP para usar a URL exata do seu projeto Supabase (linha 9):

```typescript
// Antes (genérico, aceita qualquer subdomínio *.supabase.co + localhost):
connect-src 'self' http://127.0.0.1:* https://*.supabase.co

// Depois (URL exata do seu projeto, sem localhost):
connect-src 'self' https://<seu-projeto>.supabase.co
```

> **Importante**: Para desenvolvimento local com Supabase cloud, você pode querer manter ambos:
>
> ```typescript
> connect-src 'self' https://<seu-projeto>.supabase.co
> ```
>
> O `http://127.0.0.1:*` só é necessário se o servidor de desenvolvimento (`localhost:3000`) precisar se conectar a um Supabase rodando localmente em `127.0.0.1:54331`. Se você alterou o `.env.local` para apontar para o cloud, não precisa mais de `http://127.0.0.1:*`.

## 8. Atualizar netlify.toml (se necessário)

Verifique se o arquivo `netlify.toml` existe na raiz do projeto. Se não existir, crie:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "22"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
```

> Nota: O Next.js 16 usa `.next` como pasta de output por padrão. Verifique se `publish` aponta para o diretório correto.

## 9. Fazer deploy no Netlify

### Conectar repositório

1. Acesse [app.netlify.com](https://app.netlify.com).
2. Clique em **Add new site → Import an existing project**.
3. Conecte ao GitHub/GitLab/Bitbucket e selecione o repositório do projeto.
4. Configure:
   - **Branch to deploy**: `main` (ou a branch desejada)
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Environment variables**: adicione as mesmas do passo 6 (se não tiver configurado antes)
5. Clique em **Deploy site**.

### Se preferir deploy via CLI

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Fazer login
ntl login

# Inicializar (primeira vez)
ntl init

# Deploy
ntl deploy --prod
```

## 10. Configurar URL de redirecionamento no Supabase

Após o deploy, você terá a URL do Netlify (ex: `https://appointdent.netlify.app`).

No Supabase Studio, acesse **Authentication → Settings** e atualize:

```
Site URL: https://appointdent.netlify.app
```

Em **Redirect URLs**, adicione:

```
https://appointdent.netlify.app/**
```

Isso garante que o callback de autenticação funcione corretamente após o login.

## 11. Verificar o deploy

### Testes funcionais

1. Acesse a URL do Netlify.
2. Você **deve** ser redirecionado para `/login`.
3. Faça login com o email e senha do admin criado no passo 4.
4. Verifique se consegue:
   - Ver o dashboard
   - Acessar Usuários e criar um novo usuário (dentista, recepcionista)
   - Acessar Pacientes, Procedimentos, Agenda
   - Alterar o próprio perfil
   - Fazer logout

### Verificações de segurança

1. Tente acessar `https://appointdent.netlify.app/agenda` sem estar logado — deve redirecionar para `/login`.
2. Tente acessar a URL de signup do Supabase diretamente (`https://<projeto>.supabase.co/auth/v1/signup`) — deve retornar erro 403 (signups desabilitados).
3. Verifique se o cabeçalho CSP está presente: abra o DevTools → Network → clique em qualquer requisição → Response Headers → `content-security-policy`.

### Resolver problemas comuns

| Problema | Causa provável | Solução |
|---|---|---|
| `401 Unauthorized` nas chamadas à API | `NEXT_PUBLIC_SUPABASE_ANON_KEY` incorreta | Verifique a anon key no Supabase Studio |
| Tela branca ou erro 500 | CSP bloqueando requisição | Verifique se `connect-src` inclui a URL exata do Supabase |
| Erro `Failed to load resource` | URL do Supabase incorreta | Verifique `NEXT_PUBLIC_SUPABASE_URL` |
| Login não redireciona após autenticação | `Site URL` incorreta no Supabase | Ajuste para a URL exata do Netlify |
| Proxy retornando 404 | Netlify.toml com publish incorreto | Altere `publish` para `.next` |
| Erro `relation "public.profiles" does not exist` | Migrations não foram aplicadas | Execute `npx supabase db push` ou cole as migrations no SQL Editor |
| Usuário criado no local não aparece na nuvem | Dados foram migrados apenas no schema, sem os INSERTs | Recrie os usuários pela interface ou use a Abordagem B do passo 4 |
| `AuthApiError: User already registered` | Já existe um usuário com o mesmo email na nuvem | Use um email diferente ou delete o usuário existente pelo Authentication do Supabase |
