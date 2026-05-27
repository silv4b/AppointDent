# Plano de Ação — Próximos Passos

## 1. Fase Crítica (Imediato)

### 1.1 Testes e validação das alterações

- Rodar `npm run build` e corrigir erros de TypeScript
- Testar fluxo completo: login → criar paciente → agendar consulta → arrastar/redimensionar → deletar
- Verificar se os toasts Sonner aparecem em todas as operações CRUD
- Verificar se os skeletons de carregamento são exibidos corretamente

### 1.2 Deploy da migration RLS em produção

- Aplicar `supabase/migrations/00002_role_based_rls.sql` no banco de produção
- Verificar se as policies estão ativas via `supabase/seed.sql` (inserir dados de teste)
- Confirmar que usuários não-admin não conseguem criar/editar dentistas ou procedimentos

### 1.3 Configurar variáveis de ambiente em produção

- Copiar `.env.example` para `.env.production` (ou equivalente na plataforma de deploy)
- Configurar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e demais vars

---

## 2. Fase de Qualidade (Curto Prazo — 1 sprint)

### 2.1 Testes automatizados

- Testes unitários para schemas zod (`src/lib/schemas/index.ts`)
- Testes de integração para server actions (mocking Supabase)
- Testes E2E do fluxo crítico (Cypress ou Playwright)

### 2.2 Logging e monitoramento

- Implementar logging estruturado nas server actions (Pino ou Winston)
- Adicionar telemetria básica (Vercel Analytics ou PostHog)
- Monitorar erros com Sentry ou ferramenta similar

### 2.3 Tratamento de erros global

- Criar `error.tsx` global (Next.js error boundary)
- Adicionar `not-found.tsx` nas rotas principais
- Melhorar o feedback visual de erros nos formulários (mensagens de validação no campo)

---

## 3. Fase de UX (Médio Prazo — 2 sprints)

### 3.1 Melhorias no calendário

- **Lazy loading de pacientes**: search + paginação no Select de paciente (em vez de carregar todos)
- **Indicador visual de conflito** diretamente no calendário (tooltip ou badge no evento)
- **Atalhos de teclado** no calendário: `N` para novo, `Del` para deletar, setas para navegar dias
- **Zoom do calendário**: botão para alternar entre mostrar 8h-18h ou 24h

### 3.2 Melhorias na sidebar

- **Tooltips nos ícones** quando colapsada (mostrar nome da seção ao passar mouse)
- **Badge de quantidade** ao lado de "Passados", "Atual", "Futuros"
- **Clique no dia** no mini-calendário deve rolar suavemente até a sidebar

### 3.3 Responsivo

- Adaptar layout para tablets (sidebar empilhada em vez de lateral)
- Versão mobile básica (drawer no lugar de sidebar, cards no lugar de tabelas)

---

## 4. Fase de Arquitetura (Longo Prazo — 3-4 sprints)

### 4.1 Performance

- **Paginação no servidor**: substituir `getPatients()` sem filtro por busca paginada com search term
- **SWR/React Query**: cache de dados do lado do cliente com invalidação automática
- **Bundle analysis**: identificar e remover dependências pesadas não utilizadas

### 4.2 Segurança avançada

- **Rate limiting no servidor**: mover de in-memory `Map` para Redis ou banco de dados
- **Audit log**: registrar todas as operações CRUD com timestamp e usuário
- **2FA**: adicionar autenticação de dois fatores (via Supabase MFA)

### 4.3 CI/CD

- **Pipeline de CI**: GitHub Actions rodando `npm run build` + `npm run lint` + `npm run typecheck`
- **Testes automáticos**: rodar na PR antes de permitir merge
- **Deploy automatizado**: deploy em staging ao mergear na `main`, produção com tag semântica

### 4.4 Documentação

- Documentar arquitetura geral em `docs/architecture.md`
- Documentar decisões técnicas (ADRs) em `docs/adr/`
- Documentar fluxo de deploy e recovery runbook

---

## 5. Riscos Ativos

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| RLS quebra funcionalidade existente | Alto | Média | Testar exaustivamente antes do deploy; ter rollback pronto |
| Migration não funciona em produção | Alto | Baixa | Testar migration em staging idêntico à produção |
| CSP bloqueia recursos do Supabase | Médio | Baixa | Testar CSP em staging; ajustar `connect-src` se necessário |
| Keyboard navigation ainda bloqueia Base UI | Médio | Baixa | Testar navegação nos 3 selects com as correções aplicadas |
| Rate limiting em memória não escala | Baixo | Média | Migrar para Redis quando houver múltiplos servidores |

---

## Priorização

```text
Imediato (1-2 dias) → Curto Prazo (1 sprint) → Médio Prazo (2 sprints) → Longo Prazo (3-4 sprints)
```

**Próximo passo imediato**: Rodar `npm run build`, corrigir erros, atualizar seed.sql se necessário, e aplicar migration 00002 em produção.
