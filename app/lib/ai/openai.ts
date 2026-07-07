/* =====================================================================
   wedo. — app/lib/ai/openai.ts
   Adaptador de imágenes con la API de OpenAI (gpt-image-1).
   Requiere OPENAI_API_KEY (solo server-side).
   ===================================================================== */
import type { ImageProvider } from "./imageProvider";

const TIMEOUT_MS = 60_000;

export const openaiProvider: ImageProvider = {
  async generar(prompt: string) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY no está configurada");

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
          size: "1024x1536",
          quality: "medium",
          output_format: "jpeg",
          n: 1,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`OpenAI images ${res.status}: ${detail.slice(0, 300)}`);
      }
      const json = await res.json();
      const b64 = json?.data?.[0]?.b64_json;
      if (!b64) throw new Error("OpenAI no devolvió imagen (b64_json vacío)");
      return { buffer: Buffer.from(b64, "base64") };
    } finally {
      clearTimeout(timer);
    }
  },
};
