/* =====================================================================
   wedo. — app/evento/[slug]/page.tsx
   Ruta pública neutra para eventos que no son boda (cumpleaños, XV,
   bautizo…). Sirve exactamente la misma invitación que /boda/[slug].
   ===================================================================== */
export { default, generateMetadata } from "../../boda/[slug]/page";
