# Controle Ministerial - Recepção | Netlify + Supabase

Esta versão usa **login real pelo Supabase Auth**.
Ou seja: qualquer usuário criado em **Authentication > Users** no Supabase consegue entrar usando o próprio email e senha.

## 1. Criar as tabelas no Supabase

1. Acesse o Supabase e entre no seu projeto.
2. Vá em **SQL Editor**.
3. Abra o arquivo `supabase_schema.sql` deste projeto.
4. Copie todo o conteúdo.
5. Cole no SQL Editor e clique em **Run**.

## 2. Configurar a URL e a chave anon public

No Supabase, vá em:

**Project Settings > API**

Copie:

- **Project URL**
- **anon public key**

Cole no arquivo `supabase-config.js`:

```js
const SUPABASE_URL = "SUA_URL_DO_SUPABASE";
const SUPABASE_ANON_KEY = "SUA_CHAVE_ANON_PUBLIC";
```

⚠️ Não use a chave `service_role` no site. Use somente a `anon public`.

## 3. Criar usuários para login

No Supabase, vá em:

**Authentication > Users > Add user**

Crie o usuário com:

- Email: o email que você quiser
- Password: a senha que você quiser
- Marque como confirmado, se aparecer essa opção

Depois acesse o site e faça login com o mesmo email e senha cadastrados no Supabase.

## 4. Publicar no GitHub e Netlify

1. Faça upload dos arquivos no GitHub.
2. No Netlify, clique em **Add new site > Import an existing project**.
3. Selecione o repositório.
4. Como é site estático, deixe:

```txt
Build command: vazio
Publish directory: .
```

5. Clique em **Deploy**.

## Observação importante

Os dados dos membros são protegidos por RLS. Cada usuário logado vê apenas os membros cadastrados por ele.
