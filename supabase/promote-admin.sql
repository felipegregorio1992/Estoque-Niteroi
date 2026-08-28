-- ============================================================
-- Promover o primeiro admin.
-- Passo 1: crie um usuario normalmente (Authentication > Users > Add user,
--          ou pela tela de login/signup do app se voce habilitar temporariamente).
-- Passo 2: troque o email abaixo pelo email desse usuario e rode.
-- ============================================================
update public.profiles
set role = 'admin'
where email = 'troque-por-seu-email@exemplo.com';

-- Conferir:
select id, email, role from public.profiles order by created_at;
