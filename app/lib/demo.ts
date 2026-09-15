/* =====================================================================
   wedo. — app/lib/demo.ts
   Invitaciones de muestra del home (una por tipo de evento). En estos
   slugs los pagos y el RSVP solo se simulan: nada se cobra ni se guarda.
   ===================================================================== */

export const DEMO_SLUGS = ["demo", "demo-bautizo", "demo-cumple", "demo-despedida"];

export const esDemo = (slug?: string | null) => !!slug && DEMO_SLUGS.includes(slug);
