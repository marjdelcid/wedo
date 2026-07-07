/* =====================================================================
   wedo. — app/lib/ai/replicate.ts
   Stub: adaptador de imágenes con Replicate (pendiente de activar).
   Para activarlo: descomentar, configurar REPLICATE_API_TOKEN y exponerlo
   en getImageProvider() (imageProvider.ts) con IMAGE_PROVIDER=replicate.
   ===================================================================== */
// import type { ImageProvider } from "./imageProvider";
//
// export const replicateProvider: ImageProvider = {
//   async generar(prompt: string) {
//     const token = process.env.REPLICATE_API_TOKEN;
//     if (!token) throw new Error("REPLICATE_API_TOKEN no está configurada");
//     const res = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//         Prefer: "wait",
//       },
//       body: JSON.stringify({ input: { prompt, aspect_ratio: "2:3" } }),
//     });
//     if (!res.ok) throw new Error(`Replicate ${res.status}`);
//     const json = await res.json();
//     const url = Array.isArray(json?.output) ? json.output[0] : json?.output;
//     if (!url) throw new Error("Replicate no devolvió imagen");
//     return { url };
//   },
// };

export {};
