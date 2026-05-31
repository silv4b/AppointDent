# Inconsistências Identificadas

> Levantamento feito em 31/05/2026 — **TODAS RESOLVIDAS**

## 1. Badge de status — `anamnese/[pacienteId]/client.tsx`

- Usava `bg-muted text-muted-foreground` (cinza genérico) + `shadow-sm`
- **Corrigido:** adicionado `statusColorMap` igual aos demais arquivos, `shadow-sm` removido

---

## 2. Badge de status — `historico/[pacienteId]/client.tsx`

- Usava `<Badge>` do shadcn com variants (`default`/`secondary`/`destructive`/`outline`)
- **Corrigido:** substituído por `<span>` com `bg-*-100 text-*-800` (realizado=green, confirmado=blue, cancelado=red, faltou=orange)

---

## 3. Hook `useLocalStorage` — sem suporte a função updater

- Setter aceitava apenas `(value: T) => void`, causando erro de build com `(prev) => !prev`
- **Corrigido:** setter alterado para `(value: T | ((prev: T) => T)) => void`
- **Corrigido:** tipo de retorno atualizado para refletir a nova assinatura

---

## 4. Email do paciente — faltando em alguns lugares

- Faltava no header da página `anamnese/[pacienteId]` e `historico/[pacienteId]`
- `QuickPatientDialog` retornava apenas `{ id, name }`, sem email
- **Corrigido:**
  - Email adicionado ao header de `anamnese/[pacienteId]` e `historico/[pacienteId]`
  - `quickCreatePatient` agora retorna `{ id, name, email }`
  - `onCreated`/`onPatientCreated` atualizados para incluir email

---

## 5. Badge `import` não utilizado

- `agenda/client.tsx` e `admin/solicitacoes/client.tsx` importavam `<Badge>` sem usar
- **Corrigido:** imports removidos

---

## 6. `meus-procedimentos` — badge com variantes shadcn

- Usava `<Badge variant="default"|"secondary"|"destructive">` em vez do padrão `bg-*-100 text-*-800`
- **Corrigido:** substituído por `<span>` com `STATUS_COLOR` (pending=amber, approved=green, rejected=red)
- Import de `<Badge>` removido

---

## 7. Paginação — default pageSize incorreto

| Arquivo | Era | Corrigido |
|---------|-----|-----------|
| `historico/client.tsx` | 13 | 10 |

---

## 8. Listagens sem paginação

- `minhas-anamneses/client.tsx` — não tinha paginação
- `admin/solicitacoes/client.tsx` — não tinha paginação
- **Corrigido:** paginação adicionada em ambas (pageSize inicial=10)

---

## 9. Sombras removidas globalmente

Todas as classes `shadow-sm`, `shadow-md`, `shadow-lg` removidas dos arquivos de aplicação:

| Arquivo | Shadows removidos |
|---------|------------------|
| `anamnese/[pacienteId]/client.tsx` | `shadow-sm` do card do formulário |
| `anamnese/client.tsx` | `shadow-sm` do link Anamnese |
| `agenda/client.tsx` | `shadow-sm` do grupo de visão + botão ativo |
| `horarios/client.tsx` | `shadow-md`/`shadow-sm` dos cards de dentista |
| `login/page.tsx` | `shadow-lg` do card de login |
| `components/event-tooltip.tsx` | `shadow-lg` do tooltip |
| `components/sidebar.tsx` | `shadow-lg` do hamburger mobile |
| `components/rich-text-editor.tsx` | `shadow-sm` do wrapper |
| `components/crud-page.tsx` | `shadow-sm` do botão Criar |

Restaram apenas nos componentes shadcn/ui (textarea, select, dropdown-menu, sheet) — design system.
