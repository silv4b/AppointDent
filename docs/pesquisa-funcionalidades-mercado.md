# Pesquisa de Funcionalidades — Mercado vs AppointDent

> **Data:** Maio/2026
>
> **Objetivo:** Comparar as funcionalidades oferecidas pelos principais softwares de gestão odontológica do mercado com o que o AppointDent atualmente oferece, identificando lacunas e oportunidades.

---

## 1. Softwares de Referência Analisados

### Mercado Internacional

| Software | Tipo | Diferencial |
|----------|------|-------------|
| **Dentrix** | Legado (desktop/cloud) | Padrão da indústria há décadas, suíte completa |
| **Open Dental** | Open Source | Código aberto, customizável, banco acessível |
| **Eaglesoft** | Legado | Personalização, ferramentas de gestão |
| **Curve Dental** | Cloud-native | 100% nuvem, sem instalação |
| **Adit** | Cloud + AI | Plataforma all-in-one com IA, VoIP, marketing |
| **DentalPrizm** | Cloud-native | Agendamento inteligente + IA, HIPAA |
| **Solutionreach** | Cloud | Foco em comunicação com paciente |

### Mercado Brasileiro

| Software | Tipo | Diferencial |
|----------|------|-------------|
| **Simples Dental** | Cloud | 80+ funcionalidades, Alexa, transcrição por IA |
| **NetDente** | Cloud | Agenda com WhatsApp, retorno automático, monitor de chamadas |
| **Odontiva** | Cloud | Prontuário + odontograma digital, TUSS/CBHPO |
| **Clínica Ideal** | Cloud | Clube de compras, importação automática |
| **Amplimed** | Cloud | Prontuário + teleatendimento |
| **Clinicorp** | Cloud | Gestão financeira, CRM, integrações |

---

## 2. Comparação Detalhada por Categoria

### 2.1 Agendamento e Calendário

| Funcionalidade | Mercado (padrão) | AppointDent | Status |
|---|---|---|---|
| Calendário visual (mês/semana/dia) | ✅ Obrigatório | ✅ 4 views (mês, semana, dia, lista) | Completo |
| Drag & drop para reagendar | ✅ Comum | ✅ Implementado | Completo |
| Redimensionar eventos | ✅ Comum | ✅ Implementado | Completo |
| Código de cores por procedimento | ✅ Obrigatório | ✅ Cor + borda lateral | Completo |
| Filtro por dentista | ✅ Obrigatório | ✅ Dropdown + auto-filtro por role | Completo |
| Sidebar com agendamentos do dia | ✅ Comum | ✅ Passados, atual, futuros + indicator | Completo |
| Mini-calendário para navegação | ✅ Comum | ✅ Mês navegável | Completo |
| Detecção de conflitos de horário | ✅ Obrigatório | ✅ Server-side + exclusão GIST no DB | Completo |
| Agendamento online (paciente) | ✅ Obrigatório | ❌ Não implementado | **Lacuna grave** |
| Confirmação automática via WhatsApp | ✅ Obrigatório no BR | ❌ Não implementado | **Lacuna grave** |
| Lembretes automáticos (SMS/WhatsApp) | ✅ Obrigatório | ❌ Não implementado | **Lacuna grave** |
| Lista de espera / encaixes automáticos | ✅ Comum | ❌ Não implementado | Lacuna |
| Multi-dentista simultâneo | ✅ Obrigatório | ✅ Filtro por dentista + dados reais | Completo |
| Visualização multi-agenda (vários dentistas) | ✅ Comum | ✅ Filtro "Todos os dentistas" | Completo |
| Sala / consultório / ocupação | ✅ Comum | ❌ Não implementado | Lacuna |
| Monitor de chamadas | ✅ Comum no BR | ❌ Não implementado | Lacuna |

### 2.2 Cadastro de Pacientes

| Funcionalidade | Mercado | AppointDent | Status |
|---|---|---|---|
| CRUD completo | ✅ Obrigatório | ✅ Nome, CPF, telefone, nascimento, observações | Completo |
| Busca textual | ✅ Obrigatório | ✅ Nome, CPF, telefone (ilike) | Completo |
| Paginação | ✅ Obrigatório | ✅ 20/50/100, server-side | Completo |
| Cadastro rápido durante agendamento | ✅ Obrigatório | ✅ QuickPatientDialog (nome + telefone) | Completo |
| Histórico de tratamentos | ✅ Obrigatório | ✅ Via anamnese + appointments | Completo |
| Documentos digitais (fotos, raio-x) | ✅ Obrigatório | ❌ Não implementado | **Lacuna grave** |
| Prontuário eletrônico completo | ✅ Obrigatório | ✅ Anamnese + sessões + rich text | Completo |
| Odontograma digital | ✅ Obrigatório no BR | ❌ Não implementado | **Lacuna grave** |
| Assinatura digital de documentos | ✅ Comum no BR | ❌ Não implementado | Lacuna |

### 2.3 Anamnese / Prontuário

| Funcionalidade | Mercado | AppointDent | Status |
|---|---|---|---|
| Questionários de anamnese | ✅ Obrigatório | ✅ Sessões com campos dinâmicos | Completo |
| Rich text nas respostas | ✅ Obrigatório | ✅ TipTap (negrito, itálico, listas) | Completo |
| Exportar para PDF | ✅ Obrigatório | ✅ jsPDF (individual + lote) | Completo |
| Alertas inteligentes por resposta | ✅ Comum no BR | ❌ Não implementado | Lacuna |
| Anamnese vinculada a procedimento | ✅ Comum | ✅ Vinculada a appointment (opcional) | Parcial |
| Templates de anamnese | ✅ Comum | ❌ Não implementado | Lacuna |

### 2.4 Gestão de Dentistas

| Funcionalidade | Mercado | AppointDent | Status |
|---|---|---|---|
| CRUD completo | ✅ Obrigatório | ✅ Nome, especialidade, telefone, email | Completo |
| Busca | ✅ Obrigatório | ✅ ilike em nome, especialidade, tel, email | Completo |
| Paginação | ✅ Obrigatório | ✅ 20/50/100 | Completo |
| Controle de comissões | ✅ Comum no BR | ❌ Não implementado | Lacuna |
| Vínculo com usuário (auth) | ✅ Obrigatório | ✅ profile_id → auth.users | Completo |

### 2.5 Procedimentos

| Funcionalidade | Mercado | AppointDent | Status |
|---|---|---|---|
| CRUD completo | ✅ Obrigatório | ✅ Nome, descrição, duração, valor, cor | Completo |
| Código de cores no calendário | ✅ Obrigatório | ✅ eventPropGetter com cor + borda | Completo |
| Tabela TUSS/CBHPO | ✅ Obrigatório no BR | ❌ Não implementado | **Lacuna grave** |
| Preço por procedimento | ✅ Obrigatório | ✅ Campo valor (R$) | Completo |
| Duração por procedimento | ✅ Obrigatório | ✅ Em minutos, usado no cálculo automático | Completo |

### 2.6 Grade de Horários

| Funcionalidade | Mercado | AppointDent | Status |
|---|---|---|---|
| Cadastro de horários por dentista | ✅ Obrigatório | ✅ Accordion por dentista, dia da semana | Completo |
| Múltiplos horários por dia | ✅ Obrigatório | ✅ CRUD de slots | Completo |
| Bloqueio de horários (folga/férias) | ✅ Obrigatório | ❌ Tabela existe, sem UI | **Lacuna** |
| Feriados e dias não úteis | ✅ Obrigatório | ❌ Não implementado | Lacuna |

### 2.7 Financeiro

| Funcionalidade | Mercado | AppointDent | Status |
|---|---|---|---|
| Controle de contas a receber/pagar | ✅ Obrigatório | ❌ Não implementado | **Lacuna grave** |
| Emissão de boletos | ✅ Comum no BR | ❌ Não implementado | Lacuna |
| Integração com maquininha / PIX | ✅ Comum no BR | ❌ Não implementado | Lacuna |
| Fluxo de caixa | ✅ Obrigatório | ❌ Não implementado | **Lacuna grave** |
| Comissão de dentistas | ✅ Comum no BR | ❌ Não implementado | Lacuna |
| Nota fiscal | ✅ Comum no BR | ❌ Não implementado | Lacuna |
| Gestão de convênios | ✅ Obrigatório no BR | ❌ Não implementado | **Lacuna grave** |

### 2.8 Painel / Dashboard

| Funcionalidade | Mercado | AppointDent | Status |
|---|---|---|---|
| Indicadores (pacientes, consultas) | ✅ Obrigatório | ✅ 4 cards + tabela do dia | Completo |
| Gráficos e relatórios | ✅ Obrigatório | ❌ Não implementado | **Lacuna grave** |
| Faturamento do período | ✅ Obrigatório | ❌ Não implementado | **Lacuna grave** |
| Taxa de absenteísmo (no-show) | ✅ Comum | ❌ Não implementado | Lacuna |
| Lista de aniversariantes | ✅ Comum | ❌ Não implementado | Lacuna |

### 2.9 Comunicação com Paciente

| Funcionalidade | Mercado | AppointDent | Status |
|---|---|---|---|
| Lembretes automáticos (WhatsApp/SMS) | ✅ Obrigatório | ❌ Não implementado | **Lacuna grave** |
| Confirmação de consulta | ✅ Obrigatório | ❌ Não implementado | **Lacuna grave** |
| Campanhas de marketing | ✅ Comum | ❌ Não implementado | Lacuna |
| Disparo em massa | ✅ Comum no BR | ❌ Não implementado | Lacuna |
| Mensagens pós-consulta | ✅ Comum | ❌ Não implementado | Lacuna |
| Recall automático (retorno) | ✅ Obrigatório | ✅ Retorno manual via "Marcar Retorno" | Parcial |

### 2.10 Notificações Internas

| Funcionalidade | Mercado | AppointDent | Status |
|---|---|---|---|
| Notificações in-app (bell) | ✅ Comum | ✅ Backend completo + tabela + RLS | Backend OK |
| Notificações automáticas em eventos | ✅ Obrigatório | ❌ Não integrado às actions | **Lacuna** |
| Marcar como lida / todas lidas | ✅ Obrigatório | ✅ Server actions implementadas | Completo |
| Badge de não lidas | ✅ Obrigatório | ❌ Hardcoded, sem subscription realtime | **Lacuna** |
| Realtime push (tempo real) | ✅ Obrigatório | ✅ Publicação habilitada no DB | Parcial |
| Dropdown com lista de notificações | ✅ Obrigatório | ❌ Não implementado | **Lacuna** |

### 2.11 Segurança e Conformidade

| Funcionalidade | Mercado | AppointDent | Status |
|---|---|---|---|
| Autenticação (email/senha) | ✅ Obrigatório | ✅ Supabase Auth | Completo |
| Rate limiting no login | ✅ Obrigatório | ✅ 5 tentativas/min | Completo |
| Validação de senha forte | ✅ Obrigatório | ✅ 8+ chars, maiúscula + número | Completo |
| RLS (Row Level Security) | ✅ Obrigatório | ✅ Políticas role-based em todas as tabelas | Completo |
| CSP (Content Security Policy) | ✅ Obrigatório | ✅ Configurado no next.config | Completo |
| Criptografia em repouso | ✅ Obrigatório | ✅ Supabase AES-256 | Completo |
| Conformidade LGPD / HIPAA | ✅ Obrigatório | ❌ Não auditado | Lacuna |
| Logs de auditoria | ✅ Comum | ❌ Não implementado | Lacuna |

### 2.12 Experiência do Usuário

| Funcionalidade | Mercado | AppointDent | Status |
|---|---|---|---|
| Tema claro/escuro | ✅ Comum | ✅ next-themes + CSS variables | Completo |
| Design responsivo (mobile) | ✅ Obrigatório | ✅ Sidebar mobile + overlay | Completo |
| Componentes modernos | ✅ Obrigatório | ✅ shadcn/ui, Tailwind v4 | Completo |
| Loading skeletons | ✅ Comum | ✅ Agenda, sidebar, dashboard | Completo |
| Toasts de feedback | ✅ Obrigatório | ✅ sonner (sucesso/erro) | Completo |
| Diálogos de confirmação | ✅ Obrigatório | ✅ ConfirmDialog genérico | Completo |
| Selects com busca | ✅ Comum | ✅ Paciente, dentista, procedimento | Completo |
| Atalhos de teclado | ✅ Comum | ❌ Não implementado | Lacuna |

---

## 3. Resumo de Lacunas por Prioridade

### 🔴 Críticas (impactam diretamente o valor do produto)

| # | Funcionalidade | Justificativa | Esforço estimado |
|---|---|---|---|
| 1 | **Agendamento online (paciente)** | Todas as ferramentas do mercado oferecem; é o mínimo esperado | 2-3 semanas |
| 2 | **Confirmação / lembretes via WhatsApp** | Padrão de mercado no Brasil; reduz no-show em ~40% | 2-4 semanas (depende de API) |
| 3 | **Odontograma digital** | Obrigatório em prontuário odontológico; já temos materiais de referência | 4-6 semanas |
| 4 | **Controle financeiro básico** | Fluxo de caixa e contas a receber são funcionamento básico | 3-4 semanas |
| 5 | **Documentos digitais (uploads)** | Fotos, raio-x, contratos anexados ao paciente | 1-2 semanas |
| 6 | **Gestão de convênios** | Essencial no mercado brasileiro | 3-4 semanas |
| 7 | **Tabela TUSS/CBHPO** | Obrigatório para convênios e orçamentos | 1-2 semanas |
| 8 | **Notificações in-app (UI completa)** | Backend já está pronto; falta dropdown + subscription | 1 semana |
| 9 | **Gráficos e relatórios** | Dashboard atual é só texto; falta visualização de dados | 2-3 semanas |
| 10 | **Bloqueio de horários (UI)** | Tabela já existe no DB; só falta interface | 1 semana |

### 🟡 Importantes (diferenciam o produto)

| # | Funcionalidade | Esforço estimado |
|---|---|---|
| 11 | Templates de anamnese | 1-2 semanas |
| 12 | Lista de espera / encaixes automáticos | 2-3 semanas |
| 13 | Controle de comissão de dentistas | 1-2 semanas |
| 14 | Notificações automáticas (appointment CRUD) | 2-3 dias |
| 15 | Campanhas de marketing (aniversário, recall) | 2-3 semanas |
| 16 | Feriados e dias não úteis | 1 semana |
| 17 | Visualização multi-agenda simultânea | 1-2 semanas |
| 18 | Sala / consultório / ocupação | 2-3 semanas |

### 🟢 Diferenciais Competitivos (oportunidades)

| # | Funcionalidade | Esforço estimado |
|---|---|---|
| 19 | Transcrição de consultas por IA (voz) | 3-4 semanas |
| 20 | Assistente por voz (Alexa/Google) | 4-6 semanas |
| 21 | Relatório de absenteísmo e indicadores | 1 semana |
| 22 | Assinatura digital de documentos | 2-3 semanas |
| 23 | Monitor de chamadas (senha/senha) | 2-3 semanas |
| 24 | Integração com Google Calendar/Outlook | 2-3 semanas |
| 25 | Mobile app dedicado | 8-12 semanas |
| 26 | Pagamentos online (PIX, cartão) | 3-4 semanas |

---

## 4. Análise Estratégica

### Pontos Fortes do AppointDent (vs mercado)

1. **Qualidade técnica do código**: Next.js 16, TypeScript, Tailwind v4, shadcn/ui — stack moderna e bem organizada
2. **Detecção de conflitos**: Exclusão GIST no PostgreSQL é mais robusta que a maioria dos concorrentes
3. **Arquitetura de segurança**: RLS, CSP, validação Zod em todas as ações — acima da média do mercado
4. **UX**: Tema escuro/claro, skeletons, toasts, paginação reutilizável — polimento bom para um produto em desenvolvimento
5. **Anamnese dinâmica**: Formulário com campos dinâmicos + rich text é mais flexível que soluções fixas
6. **Persistência de estado**: localStorage para sidebar, visão do calendário — pequeno detalhe que melhora usabilidade
7. **Pronto para notificações**: Backend de notificações + Realtime já existe, falta só a UI

### Fraquezas Críticas

1. **Sem comunicação com paciente**: Nenhum software odontológico moderno sobrevive sem WhatsApp integrado
2. **Sem agendamento online**: Impede que pacientes marquem fora do horário comercial
3. **Sem odontograma**: Funcionalidade base de qualquer prontuário odontológico
4. **Sem financeiro**: Impossível usar em produção sem controle de recebimentos
5. **Notificações incompletas**: Backend pronto mas sem integração nas actions nem UI

### Recomendações de Próximos Passos

**Fase 1 — Curto prazo (1-2 semanas)**

- Finalizar UI de notificações (dropdown + subscription realtime)
- Integrar notificações nas actions de appointment (criar/atualizar/cancelar)
- UI de bloqueio de horários
- Upload de documentos do paciente

**Fase 2 — Médio prazo (3-6 semanas)**

- Agendamento online (link público + seleção de horário real)
- Integração WhatsApp (lembretes + confirmação)
- Odontograma digital
- Controle financeiro básico (contas a receber)

**Fase 3 — Longo prazo (8-16 semanas)**

- Gestão de convênios + TUSS
- Gráficos e relatórios no dashboard
- Campanhas de marketing
- Mobile app / PWA

---

## 5. Fontes da Pesquisa

- Solutionreach — "Best Dental Practice Management Software in 2026"
- Adit — all-in-one AI-powered platform features
- DentalPrizm — smart scheduling and clinical charting
- Simples Dental — 80+ funcionalidades, líder no Brasil
- NetDente — recursos completos de agenda odontológica
- Odontiva — guia de software odontológico
- Clínica Ideal — sistema para consultório odontológico
- Amplimed — software para dentistas
- Open Dental — versão 26.1 release notes
- Curve Dental — best dental practice management software 2026
- DentalX — AI diagnostics and smart scheduling
- DayDream — complete guide 2026

---

*Documento gerado em 28/05/2026*
