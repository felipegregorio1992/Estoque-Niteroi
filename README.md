# Estoque Niterói

Controle de estoque da loja de Niterói em **Next.js 14 + Supabase**, pronto para deploy na **Vercel**.

Recursos:

- Login obrigatório; **cadastro de usuários somente pelo administrador** (com gerador de senha forte e confirmação)
- Visão geral com métricas, distribuição por localização e contagens recentes
- **Itens da base:** listagem com busca, filtros (local e "só alertas"), paginação no banco, **criar/editar/excluir** posições e **exportar Excel**
- Consulta por SKU, nova contagem (com PDF comprovante), alertas + lista aleatória, histórico com detalhes por contagem
- Importar base por **Excel** e aplicar contagem por **PDF**
- **Leitor de código de barras** pela câmera (na contagem e na consulta)
- **Limite de alerta por SKU** com padrão global configurável
- Aviso de estoque baixo por **notificação em tela** (sempre) e **e-mail** (opcional, configurável na tela), com **cron diário** opcional na Vercel
- **PWA:** instalável no celular, com cache do app shell
- Validação de entrada com **zod**, **rate limiting** em rotas sensíveis e **testes** (Vitest)

---

## 1. Pré-requisitos

- Node.js 18+ (testado no 24)
- Conta no [Supabase](https://supabase.com) (plano grátis)
- Conta na [Vercel](https://vercel.com) para o deploy
- (Opcional, para e-mail) Conta no [Resend](https://resend.com)

## 2. Criar o projeto no Supabase

1. Crie um novo projeto no painel do Supabase.
2. Vá em **SQL Editor** e rode, nesta ordem:
   - `supabase/schema.sql` — cria tabelas, RLS, triggers e a função `is_admin()`.
   - `supabase/seed.sql` — popula a base com as 1090 posições migradas do sistema antigo.
3. Pegue as chaves em **Project Settings > API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (secreta, só no servidor)

## 3. Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

## 4. Criar o primeiro admin

Como o cadastro é feito só por admin, o primeiro precisa ser criado manualmente:

1. No painel do Supabase: **Authentication > Users > Add user**. Crie um usuário com e-mail e senha e marque como confirmado.
2. Abra `supabase/promote-admin.sql`, troque o e-mail pelo que você acabou de criar e rode no **SQL Editor**.
3. Esse usuário agora é admin e pode criar os demais pela tela **Usuários** do app.

## 5. Rodar localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000, faça login com o admin e explore.

Para regenerar o seed a partir do JSON (`scripts/initial-positions.json`):

```bash
npm run seed
```

## 6. Deploy na Vercel

1. Suba o projeto para um repositório Git (GitHub/GitLab).
2. Na Vercel: **New Project** e importe o repositório.
3. Em **Environment Variables**, adicione as três variáveis do passo 3
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. Deploy. A Vercel detecta o Next.js automaticamente.
5. No Supabase, em **Authentication > URL Configuration**, adicione a URL da Vercel
   em *Site URL* e *Redirect URLs*.

## 7. Configurar o e-mail depois (opcional)

O alerta em tela funciona sem nenhuma configuração. Para o e-mail:

1. Crie uma conta no [Resend](https://resend.com) e **verifique um domínio** (necessário para o remetente).
2. Gere uma **API Key** no Resend.
3. No app, entre como admin e vá em **Configurações**:
   - Marque *Ativar envio por e-mail*.
   - Preencha o *Remetente* (ex.: `Estoque Niterói <alertas@seudominio.com>`).
   - Preencha os *Destinatários* (separados por vírgula).
   - Cole a *Chave da API do Resend* e salve.
4. Use *Testar envio agora* para validar. A chave fica salva no banco e **nunca** é exposta ao navegador.

### Agendar o envio automático (opcional)

Já existe um cron configurado em `vercel.json` que chama `/api/alerts/send` todo dia às 11h UTC.
Para ativá-lo com segurança:

1. Defina a variável de ambiente **`CRON_SECRET`** na Vercel (um valor aleatório forte).
2. A Vercel envia esse segredo automaticamente no header `Authorization: Bearer <CRON_SECRET>`
   ao disparar o cron; a rota valida esse header (via `GET`).
3. O botão *Testar envio agora* na tela de Configurações continua funcionando para admin logado (via `POST`).

Sem `CRON_SECRET` definido, o cron é recusado (401) e apenas o envio manual por admin funciona.

## 8. Rodar os testes e o lint

```bash
npm test       # testes unitários da lógica de estoque (Vitest)
npm run lint   # ESLint (next/core-web-vitals)
```

## 9. PWA

O app inclui `manifest.webmanifest` e um service worker (`public/sw.js`) registrado só em produção.
Em dispositivos compatíveis, dá para "Instalar" o app. O service worker faz cache do app shell
(network-first para navegação, sem cachear chamadas de API/Supabase).

Os ícones em `public/icon-192.png` e `public/icon-512.png` são placeholders sólidos gerados por
`scripts/make-icons.mjs`. Substitua por ícones da marca quando quiser.

---

## Estrutura

```
src/
  app/
    login/                 # tela de login (pública)
    (app)/                 # área autenticada (layout com sidebar)
      page.tsx             # visão geral (métricas + gráficos)
      itens/               # listagem, filtros, paginação, CRUD, exportar Excel
      consultar/           # consulta por SKU (+ leitor de código de barras)
      contagem/            # nova contagem + PDF (+ leitor de código de barras)
      alertas/             # alertas + lista aleatória
      importar/            # Excel + aplicar PDF
      historico/           # contagens aplicadas (com detalhes)
      usuarios/            # admin: gestão de usuários
      configuracoes/       # admin: limites e e-mail
    api/                   # rotas de servidor (users, positions, settings, limits, alerts)
  components/              # Sidebar, PageHeader, Toast, BarcodeScanner, ServiceWorkerRegister
  lib/                     # supabase clients, auth, stock, pdf, email, export, validation, rate-limit, types
supabase/                  # schema.sql, seed.sql, promote-admin.sql
scripts/                   # geração do seed, ícones, verificação de conexão
public/                    # manifest, service worker, ícones PWA
```

## Segurança e validação

- Todas as rotas de API validam o corpo com **zod**.
- `/api/users` (criação) e `/api/alerts/send` têm **rate limiting** por IP.
- A criação de usuário oferece **gerador de senha forte** e exige **confirmação**.
- O service worker nunca cacheia chamadas de API nem dados do Supabase.

## Modelo de dados

- `profiles` — 1 por usuário, com `role` (`user` | `admin`)
- `positions` — estoque por `sku` + `location`, com `min_alert` (limite próprio) e `last_counted_at`
- `count_sessions` — histórico de contagens aplicadas
- `app_settings` — linha única: `default_min_alert`, config de e-mail e `resend_api_key`

### Segurança

- RLS ativo em todas as tabelas.
- `app_settings` (que guarda a chave do Resend) só é lida por admin; usuários comuns
  leem o limite global pela view `settings_public`, sem segredos.
- Criação e remoção de usuários usam a `service_role` **apenas** em rotas de servidor.
- O limite de alerta considera `min_alert` do item ou, se nulo, o `default_min_alert` global.
