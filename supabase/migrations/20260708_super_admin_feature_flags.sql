-- wedo. — Super admin + feature flags (aplicada al proyecto vía MCP)

-- Quiénes son administradores (solo legible/escribible vía service role)
create table if not exists public.admins (
  user_id uuid primary key,
  email text,
  created_at timestamptz default now()
);
alter table public.admins enable row level security;

-- Funcionalidades que se pueden encender/apagar desde el panel
create table if not exists public.feature_flags (
  key text primary key,
  nombre text not null,
  descripcion text,
  enabled boolean not null default true,
  updated_at timestamptz default now()
);
alter table public.feature_flags enable row level security;
-- lectura pública (la UI oculta features apagadas); escritura solo service role
drop policy if exists "feature_flags_public_read" on public.feature_flags;
create policy "feature_flags_public_read" on public.feature_flags for select using (true);

-- seed: el diseñador IA (funcionalidad de pago)
insert into public.feature_flags (key, nombre, descripcion, enabled)
values ('diseno_ia', 'Diseñador IA', 'Generación de diseños con IA (Anthropic + imágenes). Tiene costo por uso.', true)
on conflict (key) do nothing;

-- admin inicial (confirmado por la dueña). Para agregar otro admin:
-- insert into public.admins (user_id, email) values ('<uuid de auth.users>', '<email>');
insert into public.admins (user_id, email) values
  ('947b95fb-a36e-4bab-b9d3-526545082051', 'desarrollo@aisolutionsgt.com')
on conflict (user_id) do nothing;
