# Controle Ministerial - Recepção | Netlify + Supabase

## O que esta versão possui
- Login real pelo Supabase Auth usando email e senha.
- Cadastro de membros com líder, contato, Instagram, indicação, nascimento, entrada e saída.
- Painel com aniversariantes do mês, próximo aniversário e eventos próximos.
- Aba Líderes com exportação por líder em PDF e Excel.
- Aba Eventos.
- Importação de membros por XLSX.
- Backup online em JSON: Exportar Banco / Importar Banco.
- Exportação geral PDF e Excel em formato paisagem.

## Configuração do Supabase
1. Abra `supabase-config.js`.
2. Cole a URL do projeto e a chave `anon public`.
3. No Supabase, vá em `SQL Editor > New Query`.
4. Cole todo o conteúdo de `supabase_schema.sql`.
5. Clique em `Run`.

## Login
Crie usuários em:
`Supabase > Authentication > Users > Add user`

Depois entre no sistema usando o email completo e a senha criada.

## Netlify
- Build command: deixe vazio
- Publish directory: `.`
