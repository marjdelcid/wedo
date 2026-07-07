/* =====================================================================
   wedo. — app/lib/ai/fal.ts
   Stub: adaptador de imágenes con fal.ai (pendiente de activar).
   Para activarlo: descomentar, configurar FAL_KEY y exponerlo en
   getImageProvider() (imageProvider.ts) con IMAGE_PROVIDER=fal.
   ===================================================================== */
// import type { ImageProvider } from "./imageProvider";
//
// export const falProvider: ImageProvider = {
//   async generar(prompt: string) {
//     const key = process.env.FAL_KEY;
//     if (!key) throw new Error("FAL_KEY no está configurada");
//     const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
//       method: "POST",
//       headers: { "Content-Type": "application/json", Authorization: `Key ${key}` },
//       body: JSON.stringify({ prompt, image_size: { width: 1024, height: 1536 } }),
//     });
//     if (!res.ok) throw new Error(`fal.ai ${res.status}`);
//     const json = await res.json();
//     const url = json?.images?.[0]?.url;
//     if (!url) throw new Error("fal.ai no devolvió imagen");
//     return { url };
//   },
// };

export {};
