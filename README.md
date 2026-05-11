# Controle Ministerial - Recepção | Netlify + Supabase

Esta versão foi preparada para usar banco de dados online no Supabase e hospedagem no Netlify.

## 1. Criar projeto no Supabase

1. Acesse o Supabase e crie um novo projeto.
2. Vá em **SQL Editor**.
3. Abra o arquivo `supabase_schema.sql` deste projeto.
4. Copie todo o conteúdo e clique em **Run**.

## 2. Criar o login inicial

No Supabase:

1. Vá em **Authentication > Users**.
2. Clique em **Add user**.
3. Crie este usuário:

- Email: `marcos@controle.local`
- Password: `marcos321`
- Marque como confirmado, se essa opção aparecer.

No primeiro acesso pelo sistema, será pedido para criar a senha permanente.

## 3. Configurar o arquivo supabase-config.js

No Supabase, vá em:

**Project Settings > API**

Copie:

- Project URL
- anon public key

Cole no arquivo `supabase-config.js`:

```js
const SUPABASE_URL = "SUA_URL";
const SUPABASE_ANON_KEY = "SUA_CHAVE_ANON_PUBLIC";
```

## 4. Jogar no GitHub e Netlify

1. Faça upload dos arquivos no GitHub.
2. No Netlify, clique em **Add new site > Import an existing project**.
3. Selecione o repositório.
4. Como é site estático, o publish directory pode ficar como `.`.
5. Clique em **Deploy**.

## Login inicial

- Usuário: `marcos`
- Senha: `marcos321`

## Observação importante

A chave `anon public` do Supabase pode ficar no frontend. A proteção dos dados é feita pelas políticas RLS criadas no arquivo `supabase_schema.sql`.
