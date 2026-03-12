# CondoPart

Plataforma web para gestão colaborativa de alertas de pets em condomínios.

## Visão geral

O **CondoPart** é uma aplicação React + TypeScript voltada para moradores e síndicos. Ela permite criar, acompanhar e resolver alertas de pets, com fluxo de autenticação, feed de atividade e funcionalidades administrativas para gestão do condomínio.

## Principais funcionalidades

- Autenticação de usuários e gerenciamento de perfil.
- Seleção e vínculo de condomínio.
- Criação e acompanhamento de alertas.
- Visualização de detalhes de alertas, comentários e avistamentos.
- Feed consolidado de eventos (comentários e avistamentos).
- Área do síndico com visão operacional da plataforma.
- Página pública para compartilhamento de alerta.

## Stack técnica

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui + Radix UI
- **Estado/Dados:** TanStack Query
- **Backend as a Service:** Supabase (Auth, Database, Realtime, Storage)
- **Mapas e visualização:** Leaflet, Recharts
- **Testes:** Vitest + Testing Library

## Estrutura de rotas

As rotas principais da aplicação incluem:

- `/auth` — autenticação
- `/reset-password` — redefinição de senha
- `/` — dashboard principal (protegida)
- `/create-alert` — criação de alerta (protegida)
- `/alert/:id` — detalhe do alerta (protegida)
- `/feed-preview` — prévia de feed (protegida)
- `/syndic` — área do síndico (protegida)
- `/profile` — perfil do usuário (protegida)
- `/p/alert/:id` — visualização pública de alerta

## Pré-requisitos

- Node.js 18+
- npm 9+

## Configuração de ambiente

Crie um arquivo `.env` na raiz do projeto com as variáveis abaixo:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY
```

> A aplicação valida essas variáveis em runtime e falha na inicialização caso estejam ausentes.

## Como executar localmente

```bash
# 1) Instalar dependências
npm install

# 2) Rodar em desenvolvimento
npm run dev

# 3) Build de produção
npm run build

# 4) Preview da build
npm run preview
```

## Qualidade e validação

```bash
# Lint
npm run lint

# Testes
npm run test

# Verificação TypeScript
npx tsc --noEmit
```

## Convenções do projeto

- Base de código em TypeScript com aliases `@/` para imports internos.
- Componentes e páginas em `src/components` e `src/pages`.
- Integrações Supabase centralizadas em `src/integrations/supabase`.
- Hooks e regras de domínio distribuídos em `src/hooks` e `src/lib`.

## Deploy

O projeto pode ser publicado em qualquer plataforma que suporte aplicações Vite (ex.: Vercel, Netlify), desde que as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estejam configuradas no ambiente de produção.

## Licença

Este repositório não define licença explícita no momento.
