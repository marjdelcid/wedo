/* =====================================================================
   wedo. — app/lib/ai/imageProvider.ts
   Proveedor de imágenes configurable para el diseñador IA.
   Selección por env: IMAGE_PROVIDER=openai (default) | fal | replicate.
   SOLO server-side: las keys jamás llegan al cliente.
   ===================================================================== */
import { openaiProvider } from "./openai";
// import { falProvider } from "./fal";
// import { replicateProvider } from "./replicate";

export interface ImageProvider {
  /** Genera una imagen vertical (portada, ~1024x1536) y devuelve un Buffer o URL temporal */
  generar(prompt: string): Promise<{ buffer?: Buffer; url?: string }>;
}

export function getImageProvider(): ImageProvider {
  const id = (process.env.IMAGE_PROVIDER || "openai").toLowerCase();
  switch (id) {
    case "openai":
      return openaiProvider;
    // case "fal":
    //   return falProvider;
    // case "replicate":
    //   return replicateProvider;
    default:
      return openaiProvider;
  }
}
