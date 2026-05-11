# Controle Ministerial - Recepção (Netlify + Supabase Auth)

## Login
Esta versão usa login real do Supabase Auth. O campo de usuário deve receber o **email completo** criado em:

`Supabase > Authentication > Users`

Exemplo:

- Email: `marcos@casademilagres.com`
- Senha: a senha definida no Supabase

## Configuração obrigatória
Abra `supabase-config.js` e coloque os dados do MESMO projeto onde você criou o usuário:

```js
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "SUA_CHAVE_ANON_PUBLIC";
```

Use a chave **anon public**. Não use `service_role`.

## Banco de dados
No Supabase, vá em `SQL Editor > New Query`, cole o conteúdo de `supabase_schema.sql` e clique em `Run`.

## Se o login não entrar
A nova versão mostra o erro real retornado pelo Supabase. Verifique principalmente:

1. Email completo digitado no login.
2. Senha redefinida no Supabase.
3. Email confirmado em Authentication > Users.
4. `supabase-config.js` apontando para o mesmo projeto onde o usuário foi criado.
5. Arquivo `supabase_schema.sql` executado.
