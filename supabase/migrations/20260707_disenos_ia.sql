-- wedo. — Diseñador IA de invitaciones (aplicada al proyecto vía MCP)
-- Cache de diseños generados + límite de generaciones por pareja.

create table if not exists public.disenos_ia (
  id uuid primary key default gen_random_uuid(),
  tema_normalizado text not null,
  tipo_evento text not null,
  resultado jsonb not null,
  foto_hero text,
  -- quién generó (para limitar en onboarding, donde aún no existe la pareja)
  creado_por uuid,
  created_at timestamptz default now(),
  unique (tema_normalizado, tipo_evento)
);

-- Solo accesible vía service role / API route (RLS sin políticas públicas)
alter table public.disenos_ia enable row level security;

alter table public.parejas
  add column if not exists disenos_ia_usados int not null default 0;
