/* =====================================================================
   wedo. — app/lib/tipografias.ts
   Catálogo único de tipografías para el editor y el diseñador IA.
   Todas están cargadas en app/layout.tsx (Google Fonts).
   ===================================================================== */

export const TIPOGRAFIAS = [
  { id: "Instrument Serif", estilo: "Editorial · wedo." },
  { id: "Cormorant Garamond", estilo: "Clásica · Elegante" },
  { id: "Playfair Display", estilo: "Editorial · Moderna" },
  { id: "DM Serif Display", estilo: "Geométrica · Limpia" },
  { id: "Bodoni Moda", estilo: "Alta moda · Dramática" },
  { id: "Great Vibes", estilo: "Script · Romántica" },
  { id: "Cinzel", estilo: "Romana · Majestuosa" },
  { id: "Lora", estilo: "Tradicional · Cálida" },
  { id: "Gilda Display", estilo: "Fina · Editorial" },
  { id: "Libre Baskerville", estilo: "Clásica · Legible" },
  { id: "Sacramento", estilo: "Caligráfica · Fluida" },
  { id: "Abril Fatface", estilo: "Display · Impactante" },
  { id: "EB Garamond", estilo: "Literaria · Refinada" },
  { id: "Josefin Serif", estilo: "Geométrica · Delicada" },
  { id: "Italiana", estilo: "Italiana · Estilizada" },
  { id: "Marcellus", estilo: "Romana · Inscripcional" },
  { id: "Yeseva One", estilo: "Display · Retro" },
  { id: "Cardo", estilo: "Académica · Seria" },
  { id: "Tenor Sans", estilo: "Sans · Minimalista" },
  { id: "Crimson Pro", estilo: "Literaria · Moderna" },
  { id: "Montserrat", estilo: "Moderna · Geométrica" },
  { id: "Raleway", estilo: "Moderna · Elegante" },
  { id: "Josefin Sans", estilo: "Geométrica · Fina" },
  { id: "Nunito", estilo: "Amigable · Redondeada" },
  { id: "Outfit", estilo: "Contemporánea · Limpia" },
  { id: "DM Sans", estilo: "Editorial · Sans" },
  { id: "Poppins", estilo: "Popular · Moderna" },
  { id: "Work Sans", estilo: "Funcional · Moderna" },
  { id: "Plus Jakarta Sans", estilo: "Contemporánea · Sharp" },
  { id: "Epilogue", estilo: "Minimalista · Bold" },
  { id: "Pinyon Script", estilo: "Boda · Caligrafía fina" },
  { id: "Allura", estilo: "Boda · Script elegante" },
  { id: "Alex Brush", estilo: "Boda · Pincel delicado" },
  { id: "Tangerine", estilo: "Boda · Cursiva clásica" },
  { id: "Parisienne", estilo: "Boda · Francesa vintage" },
  { id: "Euphoria Script", estilo: "Boda · Caligrafía moderna" },
  { id: "Clicker Script", estilo: "Boda · Plumilla formal" },
  { id: "Mr De Haviland", estilo: "Boda · Copperplate" },
  { id: "The Nautigal", estilo: "Boda · Fluida & trendy" },
  { id: "Italianno", estilo: "Boda · Italiana clásica" },
];

export const TIPOGRAFIA_IDS = TIPOGRAFIAS.map((t) => t.id);

export function esTipografiaValida(id?: string | null): boolean {
  return !!id && TIPOGRAFIA_IDS.includes(id);
}
