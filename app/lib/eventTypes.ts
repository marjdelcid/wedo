/* =====================================================================
   wedo. — app/lib/eventTypes.ts
   Configuración central de tipos de evento.
   Cada tipo define sus pasos de onboarding y campos.
   - Campos SIN `detalle` se guardan en columnas existentes de `parejas`
     (nombre1, nombre2, fecha, lugar, hora, ceremonia, recepcion,
      dresscode, historia).
   - Campos CON `detalle: true` se guardan dentro del jsonb
     `detalles_evento` (edad, tema, organiza, nombre_bebe, etc.).
   Agregar un nuevo tipo de evento = agregar un objeto a EVENT_TYPES.
   ===================================================================== */

export type EventTypeId =
  | "boda"
  | "quince"
  | "cumple_nino"
  | "cumple_adulto"
  | "baby_shower"
  | "despedida"
  | "otro";

export type CampoTipo = "text" | "date" | "textarea";

export interface Campo {
  /** Columna de `parejas` o clave dentro de `detalles_evento` si detalle=true */
  key: string;
  label: string;
  placeholder?: string;
  tipo?: CampoTipo;          // default: "text"
  opcional?: boolean;        // muestra "· opcional"
  medio?: boolean;           // ocupa media fila (ob-grid2)
  requerido?: boolean;       // bloquea "Siguiente" si está vacío
  detalle?: boolean;         // true → guardar en detalles_evento (jsonb)
}

export interface PasoOnboarding {
  kicker: string;
  titulo: string;
  sub: string;
  campos: Campo[];
  /** El último paso muestra "Crear mi página" y permite omitir */
  omitible?: boolean;
}

export interface EventType {
  id: EventTypeId;
  label: string;             // "Boda", "Cumpleaños infantil"…
  emoji: string;
  desc: string;              // descripción corta en el selector
  frasePortada: string;      // default de frase_portada
  /** Genera la base del slug a partir del form */
  slugBase: (form: Record<string, string>) => string;
  pasos: PasoOnboarding[];
}

/* ---------- helpers ---------- */

export function slugify(txt: string) {
  return txt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ---------- pasos reutilizables ---------- */

const pasoMensaje = (sub: string, placeholder: string, label = "Mensaje"): PasoOnboarding => ({
  kicker: "Un mensaje especial",
  titulo: "Un mensaje para tus invitados",
  sub,
  omitible: true,
  campos: [
    { key: "historia", label: `${label}`, tipo: "textarea", opcional: true, placeholder },
  ],
});

/* ---------- catálogo de tipos ---------- */

export const EVENT_TYPES: EventType[] = [
  {
    id: "boda",
    label: "Boda",
    emoji: "💍",
    desc: "Invitación, RSVP y mesa de regalos",
    frasePortada: "Nos casamos",
    slugBase: (f) => `${slugify(f.nombre1 || "")}-y-${slugify(f.nombre2 || "")}`,
    pasos: [
      {
        kicker: "Cuéntanos de su boda",
        titulo: "Los novios",
        sub: "Lo esencial para empezar su página. Podrán editar todo después.",
        campos: [
          { key: "nombre1", label: "Nombre 1", placeholder: "Andrea", medio: true, requerido: true },
          { key: "nombre2", label: "Nombre 2", placeholder: "Diego", medio: true, requerido: true },
          { key: "fecha", label: "Fecha de la boda", tipo: "date", medio: true },
          { key: "lugar", label: "Ciudad", placeholder: "Guatemala City", medio: true },
        ],
      },
      {
        kicker: "Detalles del evento",
        titulo: "El gran día",
        sub: "Los detalles que verán sus invitados en la invitación.",
        omitible: false,
        campos: [
          { key: "hora", label: "Hora de la ceremonia", placeholder: "6:00 PM", medio: true },
          { key: "ceremonia", label: "Lugar de la ceremonia", placeholder: "Catedral Metropolitana", medio: true },
          { key: "recepcion", label: "Lugar de la recepción", placeholder: "Casa Santo Domingo, Antigua" },
          { key: "dresscode", label: "Dress code", opcional: true, placeholder: "Formal de jardín · tonos suaves" },
        ],
      },
      {
        kicker: "Su historia",
        titulo: "Su historia",
        sub: "Cuéntenles a sus invitados cómo se conocieron. Es opcional —pueden agregarla luego.",
        omitible: true,
        campos: [
          { key: "historia", label: "Su historia", tipo: "textarea", opcional: true, placeholder: "Nos conocimos en Antigua hace seis años…" },
        ],
      },
    ],
  },
  {
    id: "quince",
    label: "Quinceañera",
    emoji: "👑",
    desc: "Sus XV años, inolvidables",
    frasePortada: "Mis XV años",
    slugBase: (f) => `xv-${slugify(f.nombre1 || "")}`,
    pasos: [
      {
        kicker: "Cuéntanos de sus XV",
        titulo: "La quinceañera",
        sub: "Lo esencial para empezar su página. Podrán editar todo después.",
        campos: [
          { key: "nombre1", label: "Nombre de la quinceañera", placeholder: "Sofía", requerido: true },
          { key: "fecha", label: "Fecha de la fiesta", tipo: "date", medio: true },
          { key: "lugar", label: "Ciudad", placeholder: "Guatemala City", medio: true },
        ],
      },
      {
        kicker: "Detalles del evento",
        titulo: "La celebración",
        sub: "Los detalles que verán tus invitados en la invitación.",
        campos: [
          { key: "hora", label: "Hora", placeholder: "7:00 PM", medio: true },
          { key: "ceremonia", label: "Misa o ceremonia", opcional: true, placeholder: "Iglesia La Merced", medio: true },
          { key: "recepcion", label: "Lugar de la recepción", placeholder: "Salón Las Margaritas" },
          { key: "dresscode", label: "Dress code", opcional: true, placeholder: "Formal · tonos pastel" },
        ],
      },
      pasoMensaje("Un mensaje que verán tus invitados. Es opcional —puedes agregarlo luego.", "Quiero compartir este día tan especial contigo…"),
    ],
  },
  {
    id: "cumple_nino",
    label: "Cumpleaños infantil",
    emoji: "🎈",
    desc: "Fiesta para los más pequeños",
    frasePortada: "¡Ven a celebrar!",
    slugBase: (f) => `cumple-${slugify(f.nombre1 || "")}`,
    pasos: [
      {
        kicker: "Cuéntanos de la fiesta",
        titulo: "El festejado o festejada",
        sub: "Lo esencial para empezar la página. Podrás editar todo después.",
        campos: [
          { key: "nombre1", label: "Nombre del niño o niña", placeholder: "Mateo", medio: true, requerido: true },
          { key: "edad", label: "Edad que cumple", placeholder: "5", medio: true, detalle: true, opcional: true },
          { key: "fecha", label: "Fecha de la fiesta", tipo: "date", medio: true },
          { key: "lugar", label: "Ciudad", placeholder: "Guatemala City", medio: true },
        ],
      },
      {
        kicker: "Detalles de la fiesta",
        titulo: "La fiesta",
        sub: "Los detalles que verán los invitados y sus papás.",
        campos: [
          { key: "hora", label: "Hora", placeholder: "3:00 PM", medio: true },
          { key: "recepcion", label: "Lugar de la fiesta", placeholder: "Parque Kids Planet", medio: true },
          { key: "tema", label: "Tema de la fiesta", opcional: true, placeholder: "Dinosaurios, princesas, superhéroes…", detalle: true },
        ],
      },
      pasoMensaje("Un mensaje para los invitados y sus papás. Es opcional.", "¡Los esperamos para celebrar juntos!"),
    ],
  },
  {
    id: "cumple_adulto",
    label: "Cumpleaños",
    emoji: "🎉",
    desc: "Una celebración a tu manera",
    frasePortada: "¡Estás invitado!",
    slugBase: (f) => `cumple-${slugify(f.nombre1 || "")}`,
    pasos: [
      {
        kicker: "Cuéntanos de la celebración",
        titulo: "El festejado o festejada",
        sub: "Lo esencial para empezar la página. Podrás editar todo después.",
        campos: [
          { key: "nombre1", label: "Nombre", placeholder: "Carla", medio: true, requerido: true },
          { key: "edad", label: "Edad que cumple", placeholder: "30", medio: true, detalle: true, opcional: true },
          { key: "fecha", label: "Fecha de la celebración", tipo: "date", medio: true },
          { key: "lugar", label: "Ciudad", placeholder: "Guatemala City", medio: true },
        ],
      },
      {
        kicker: "Detalles del evento",
        titulo: "La celebración",
        sub: "Los detalles que verán tus invitados en la invitación.",
        campos: [
          { key: "hora", label: "Hora", placeholder: "8:00 PM", medio: true },
          { key: "recepcion", label: "Lugar de la celebración", placeholder: "Restaurante Kacao, zona 10", medio: true },
          { key: "dresscode", label: "Dress code", opcional: true, placeholder: "Casual elegante" },
        ],
      },
      pasoMensaje("Un mensaje que verán tus invitados. Es opcional.", "¡Acompáñame a celebrar una vuelta más al sol!"),
    ],
  },
  {
    id: "baby_shower",
    label: "Baby shower",
    emoji: "🍼",
    desc: "Bienvenida para el bebé",
    frasePortada: "Baby shower",
    slugBase: (f) => `baby-${slugify(f.nombre1 || "")}`,
    pasos: [
      {
        kicker: "Cuéntanos del baby shower",
        titulo: "La futura mamá",
        sub: "Lo esencial para empezar la página. Podrás editar todo después.",
        campos: [
          { key: "nombre1", label: "Nombre de la mamá (o los papás)", placeholder: "Lucía", requerido: true },
          { key: "nombre_bebe", label: "Nombre del bebé", opcional: true, placeholder: "Emilia", medio: true, detalle: true },
          { key: "fecha", label: "Fecha", tipo: "date", medio: true },
          { key: "lugar", label: "Ciudad", placeholder: "Guatemala City" },
        ],
      },
      {
        kicker: "Detalles del evento",
        titulo: "El baby shower",
        sub: "Los detalles que verán tus invitados en la invitación.",
        campos: [
          { key: "hora", label: "Hora", placeholder: "4:00 PM", medio: true },
          { key: "recepcion", label: "Lugar del baby shower", placeholder: "Jardines de San Isidro", medio: true },
          { key: "tema", label: "Tema o colores", opcional: true, placeholder: "Safari · tonos tierra", detalle: true },
          { key: "organiza", label: "¿Quién organiza?", opcional: true, placeholder: "Las tías de Emilia", detalle: true },
        ],
      },
      pasoMensaje("Un mensaje para los invitados. Es opcional.", "Ayúdanos a darle la bienvenida a nuestro bebé…"),
    ],
  },
  {
    id: "despedida",
    label: "Despedida de soltera",
    emoji: "🥂",
    desc: "La última fiesta de soltera",
    frasePortada: "Despedida de soltera",
    slugBase: (f) => `despedida-${slugify(f.nombre1 || "")}`,
    pasos: [
      {
        kicker: "Cuéntanos de la despedida",
        titulo: "La novia",
        sub: "Lo esencial para empezar la página. Podrás editar todo después.",
        campos: [
          { key: "nombre1", label: "Nombre de la novia", placeholder: "Valeria", requerido: true },
          { key: "fecha", label: "Fecha", tipo: "date", medio: true },
          { key: "lugar", label: "Ciudad", placeholder: "Antigua Guatemala", medio: true },
        ],
      },
      {
        kicker: "Detalles del evento",
        titulo: "La despedida",
        sub: "Los detalles que verán las invitadas.",
        campos: [
          { key: "hora", label: "Hora", placeholder: "6:00 PM", medio: true },
          { key: "recepcion", label: "Lugar de la despedida", placeholder: "Casa en Antigua", medio: true },
          { key: "tema", label: "Tema o dress code", opcional: true, placeholder: "Todas de blanco, la novia de color", detalle: true },
          { key: "organiza", label: "¿Quién organiza?", opcional: true, placeholder: "Las damas de honor", detalle: true },
        ],
      },
      pasoMensaje("Un mensaje para las invitadas. Es opcional.", "¡Vamos a despedir la soltería de Valeria como se debe!"),
    ],
  },
  {
    id: "otro",
    label: "Otra celebración",
    emoji: "✨",
    desc: "Graduación, aniversario, bautizo…",
    frasePortada: "Estás invitado",
    slugBase: (f) => slugify(f.nombre1 || "evento"),
    pasos: [
      {
        kicker: "Cuéntanos de tu evento",
        titulo: "Tu celebración",
        sub: "Lo esencial para empezar la página. Podrás editar todo después.",
        campos: [
          { key: "nombre1", label: "Nombre del evento o festejado", placeholder: "Graduación de Ana", requerido: true },
          { key: "fecha", label: "Fecha", tipo: "date", medio: true },
          { key: "lugar", label: "Ciudad", placeholder: "Guatemala City", medio: true },
        ],
      },
      {
        kicker: "Detalles del evento",
        titulo: "Los detalles",
        sub: "Los detalles que verán tus invitados en la invitación.",
        campos: [
          { key: "hora", label: "Hora", placeholder: "7:00 PM", medio: true },
          { key: "recepcion", label: "Lugar del evento", placeholder: "Hotel Casa Veranda", medio: true },
          { key: "dresscode", label: "Dress code", opcional: true, placeholder: "Formal" },
        ],
      },
      pasoMensaje("Un mensaje que verán tus invitados. Es opcional.", "Nos encantaría que nos acompañes en este día…"),
    ],
  },
];

/** Devuelve la config del tipo; si no existe (registros viejos), asume boda. */
export function getEventType(id?: string | null): EventType {
  return EVENT_TYPES.find((t) => t.id === id) || EVENT_TYPES[0];
}

/** Busca un campo del tipo por key. Es la fuente de verdad para saber si un
 *  campo aplica al tipo (p. ej. nombre2 o ceremonia) y con qué etiqueta —
 *  el editor la usa para ocultar/re-etiquetar sin condicionales por tipo. */
export function getCampo(t: EventType, key: string): Campo | undefined {
  for (const p of t.pasos) {
    const c = p.campos.find((x) => x.key === key);
    if (c) return c;
  }
  return undefined;
}

/** Etiqueta de un campo para el tipo, con fallback. */
export function campoLabel(t: EventType, key: string, fallback: string): string {
  return getCampo(t, key)?.label || fallback;
}

/** Columnas reales de `parejas` — todo lo demás va a detalles_evento */
export const COLUMNAS_PAREJAS = new Set([
  "nombre1", "nombre2", "fecha", "lugar", "hora",
  "ceremonia", "recepcion", "dresscode", "historia",
]);
