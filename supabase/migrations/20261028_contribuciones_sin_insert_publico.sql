-- wedo. — contribuciones: sin INSERT desde el cliente
-- Cualquiera con la anon key podía insertar contribuciones 'pagado' a cualquier
-- fondo (aparecían como aportes reales en el dashboard). Ahora solo el API las
-- crea con service role: /api/aportes/checkout ('pendiente' o, en modo demo sin
-- llaves, 'pagado') y el webhook de Recurrente las confirma.

drop policy if exists "todos insertan contribuciones" on public.contribuciones;

-- si algo vuelve a insertar sin estado explícito, nace pendiente (nunca pagado)
alter table public.contribuciones alter column estado set default 'pendiente';
