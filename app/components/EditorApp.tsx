"use client";
/* =====================================================================
   wedo. — app/components/EditorApp.tsx
   Single-page 3-zone editor (rail · panel · live preview) wired to the
   real Supabase data. Replaces the 6 route-based editor pages; all of
   their functionality (uploads, gifts, RSVP codes, section reorder) is
   preserved here, restyled to the wedo. brand (app-ui.css, .wedo-app).
   ===================================================================== */
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getEventType, getCampo, campoLabel } from "../lib/eventTypes";
import { elegirPareja, setEventoActivoId } from "../lib/eventoActivo";
import { TIPOGRAFIAS } from "../lib/tipografias";
import { generarDisenoIA, DisenoIAError, type DisenoIA } from "../lib/disenoIA";
import { featureEnabled } from "../lib/featureFlags";
import DisenoIAPreview from "./DisenoIAPreview";
import "../app-ui.css";
import "../onboarding-tipos.css"; // spinner .ob-ia-spin del diseñador IA

type Pane = "info" | "diseno" | "regalos" | "invitacion" | "invitados" | "secciones";

// Cada paleta define 4 colores (dots[0] = acento). Se aplican en la
// invitación pública: portada, info-cards de Detalles, RSVP y dress code.
const PALETAS = [
  { id: "rosawedo",   nombre: "Rosa wedo.",     accent: "#E84B8A", bg: "#F7F0E5", dots: ["#E84B8A", "#87A6E8", "#B3C24A", "#EE5A28"] },
  { id: "periwinkle", nombre: "Periwinkle",     accent: "#87A6E8", bg: "#F7F0E5", dots: ["#87A6E8", "#E84B8A", "#B3C24A", "#5E6FB0"] },
  { id: "lima",       nombre: "Lima fresca",    accent: "#B3C24A", bg: "#F7F0E5", dots: ["#B3C24A", "#E84B8A", "#87A6E8", "#7E8C28"] },
  { id: "coral",      nombre: "Coral cálido",   accent: "#EE5A28", bg: "#FDF8F5", dots: ["#EE5A28", "#F3C9C2", "#E84B8A", "#C4562A"] },
  { id: "vino",       nombre: "Vino & crema",   accent: "#5E1E2E", bg: "#F7F0E5", dots: ["#5E1E2E", "#E84B8A", "#C4788A", "#87A6E8"] },
  { id: "champagne",  nombre: "Champagne",      accent: "#8C6D4F", bg: "#FAF8F5", dots: ["#8C6D4F", "#B8964A", "#C4A878", "#7A8B6A"] },
  { id: "jardin",     nombre: "Jardín",         accent: "#4A7C59", bg: "#F4F7F4", dots: ["#4A7C59", "#8BB49A", "#B3C24A", "#C4A878"] },
  { id: "rose",       nombre: "Rosa polvos",    accent: "#A0556A", bg: "#FDF5F6", dots: ["#A0556A", "#D4A0AE", "#E84B8A", "#87A6E8"] },
  { id: "midnight",   nombre: "Noche & Oro",    accent: "#C9A84C", bg: "#141210", dots: ["#C9A84C", "#87A6E8", "#E84B8A", "#B3C24A"] },
  { id: "terracotta", nombre: "Terracotta",     accent: "#C4562A", bg: "#FDF8F5", dots: ["#C4562A", "#E8B49A", "#B8964A", "#87A6E8"] },
  { id: "lavanda",    nombre: "Lavanda",        accent: "#7B6BA8", bg: "#F7F5FF", dots: ["#7B6BA8", "#C4BCDC", "#E84B8A", "#87A6E8"] },
  { id: "azulpolvo",  nombre: "Azul polvos",    accent: "#4A6E8C", bg: "#F3F7FA", dots: ["#4A6E8C", "#8AAEC4", "#87A6E8", "#B3C24A"] },
  { id: "bordeaux",   nombre: "Bordeaux",       accent: "#7A2B3A", bg: "#FDF5F6", dots: ["#7A2B3A", "#C4788A", "#E84B8A", "#B8964A"] },
  { id: "olivo",      nombre: "Olivo & Marfil", accent: "#5C6E3E", bg: "#F8F6EE", dots: ["#5C6E3E", "#A0A870", "#B3C24A", "#C4A878"] },
  { id: "grisperla",  nombre: "Gris perla",     accent: "#5A5A5A", bg: "#F8F8F8", dots: ["#5A5A5A", "#A8A8A8", "#87A6E8", "#E84B8A"] },
  { id: "vinedo",     nombre: "Viñedo",         accent: "#7A2B3A", bg: "#F8F6EE", dots: ["#7A2B3A", "#5C6E3E", "#B8964A", "#C4788A"] },
];


const SECCIONES_META: Record<string, { label: string; desc: string }> = {
  galeria: { label: "Galería de fotos", desc: "Carrusel animado debajo de la foto principal" },
  regalos: { label: "Lista de regalos", desc: "Fondos para contribuir en quetzales" },
  historia: { label: "Historia o mensaje", desc: "Su historia o un mensaje para tus invitados" },
  detalles: { label: "Detalles del evento", desc: "Hora, lugares y dress code" },
  invitacion: { label: "Invitación digital", desc: "Imagen o PDF de su invitación" },
  rsvp: { label: "Confirmación de asistencia", desc: "Los invitados buscan su nombre y confirman" },
  countdown: { label: "Cuenta regresiva", desc: "Días que faltan para el evento" },
};
const DEFAULT_ORDER = ["galeria", "regalos", "historia", "detalles", "invitacion", "rsvp", "countdown"];

const COVER_STYLES = [
  { id: "clasica", label: "Clásica" },
  { id: "minimalista", label: "Minimalista" },
  { id: "fecha", label: "Fecha" },
  { id: "apilada", label: "Apilada" },
  { id: "marco", label: "Marco" },
  { id: "editorial", label: "Editorial" },
];
const ANIM_STYLES = [
  { id: "elegante", tt: "Elegante", td: "Apariciones suaves y lentas, fundidos finos" },
  { id: "sutil", tt: "Sutil", td: "Mínima — casi sin movimiento, muy sobria" },
  { id: "alegre", tt: "Alegre", td: "Rebotes y entradas con energía" },
  { id: "ninguna", tt: "Sin animación", td: "Todo estático, sin movimiento" },
];

const RAIL: { id: Pane; n: string; label: string }[] = [
  { id: "info", n: "i", label: "Información" },
  { id: "diseno", n: "ii", label: "Diseño" },
  { id: "regalos", n: "iii", label: "Regalos" },
  { id: "invitacion", n: "iv", label: "Invitación" },
  { id: "invitados", n: "v", label: "Invitados" },
  { id: "secciones", n: "vi", label: "Secciones" },
];
const fmtMoney = (n: number) => "Q " + (n || 0).toLocaleString("en-US");
const ff = (id: string) => `'${id}', Georgia, serif`;

/* ---------- styled font dropdown ---------- */
function FontSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const sel = TIPOGRAFIAS.find((t) => t.id === value) || TIPOGRAFIAS[0];
  return (
    <div className="fontsel">
      <label>{label}</label>
      <div className="fontsel-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="fn" style={{ fontFamily: ff(sel.id) }}>{sel.id}</span>
        <span className="cv">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="fontsel-menu">
          {TIPOGRAFIAS.map((t) => (
            <div key={t.id} className="fo" onClick={() => { onChange(t.id); setOpen(false); }} style={{ background: t.id === value ? "var(--cream-2)" : undefined }}>
              <span style={{ fontFamily: ff(t.id), fontSize: 19 }}>{t.id}</span>
              <span className="est">{t.estilo}</span>
            </div>
          ))}
        </div>
      )}
      <div className="fontsel-preview">
        <div className="est">{sel.estilo}</div>
        <div className="smp" style={{ fontFamily: ff(sel.id) }}>María &amp; José</div>
      </div>
    </div>
  );
}

export default function EditorApp({ initialPane = "diseno" }: { initialPane?: Pane }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pareja, setPareja] = useState<any>(null);
  const [eventos, setEventos] = useState<any[]>([]);
  const [evtMenu, setEvtMenu] = useState(false);
  const [cargaError, setCargaError] = useState(false);
  const [pane, setPane] = useState<Pane>(initialPane);
  const [savedPane, setSavedPane] = useState<Pane | "all" | null>(null);
  const [savingPane, setSavingPane] = useState<Pane | "all" | null>(null);

  // pareja form (info + design + invitacion fields)
  const [f, setF] = useState<any>({
    nombre1: "", nombre2: "", fecha: "", lugar: "", hora: "",
    ceremonia: "", ceremonia_maps: "", recepcion: "", recepcion_maps: "",
    dresscode: "", dresscode_notas: "", dresscode_fotos: [] as string[],
    galeria_fotos: [] as string[], historia: "", musica: "", hashtag: "", fotos_url: "", mensaje_gracias: "",
    foto_hero: "", tipografia: "Cormorant Garamond", tipografia_titulos: "Cormorant Garamond",
    paleta: "rosawedo", hero_oscuridad: 45, color_acento: "#E84B8A", color_fondo: "#F7F0E5", color_superficie: "#FFFFFF",
    paleta_colores: ["#E84B8A", "#87A6E8", "#B3C24A", "#EE5A28"] as string[],
    agenda: [] as { hora: string; evento: string }[],
    rsvp_fecha_limite: "", nota_adultos: "",
    invitacion_url: "",
    frase_portada: "Nos casamos", estilo_portada: "clasica", animaciones_estilo: "elegante", petalos: false, confeti_regalo: false,
    std_estilo: "c",
    tipo_evento: "boda", detalles_evento: {} as Record<string, string>,
  });
  const setField = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const addAgenda = () => setF((p: any) => ({ ...p, agenda: [...(p.agenda || []), { hora: "", evento: "" }] }));
  const updateAgenda = (i: number, k: string, v: string) => setF((p: any) => { const a = [...(p.agenda || [])]; a[i] = { ...a[i], [k]: v }; return { ...p, agenda: a }; });
  const removeAgenda = (i: number) => setF((p: any) => ({ ...p, agenda: (p.agenda || []).filter((_: any, j: number) => j !== i) }));

  // secciones
  const [secciones, setSecciones] = useState<Record<string, boolean>>({ galeria: true, regalos: true, historia: true, detalles: true, invitacion: true, rsvp: true, countdown: true });
  const [orden, setOrden] = useState<string[]>(DEFAULT_ORDER);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // fondos
  const [fondos, setFondos] = useState<any[]>([]);
  const [showGiftForm, setShowGiftForm] = useState(false);
  const [editingGift, setEditingGift] = useState<any>(null);
  const [gForm, setGForm] = useState<any>({ nombre: "", descripcion: "", historia: "", meta: "", foto: "", modo: "libre", chips: [100, 200, 500, 1000], nuevoChip: "", mostrar_progreso: true, cantidad: "1" });
  const [savingGift, setSavingGift] = useState(false);

  // invitados
  const [invitados, setInvitados] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [rsvpCodigo, setRsvpCodigo] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestForm, setGuestForm] = useState({ nombre: "", asientos: "1", grupo: "" });
  const [copiadoToken, setCopiadoToken] = useState("");
  const [savingGuest, setSavingGuest] = useState(false);
  const [editCodeId, setEditCodeId] = useState<string | null>(null);
  const [codeVal, setCodeVal] = useState("");

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // diseñador IA (pane diseno)
  const [iaTema, setIaTema] = useState("");
  const [ia, setIa] = useState<{ loading: boolean; error: string; diseno: DisenoIA | null; aplicado: boolean; restantes: number | null }>({
    loading: false, error: "", diseno: null, aplicado: false, restantes: null,
  });
  const [iaEnabled, setIaEnabled] = useState(true);
  useEffect(() => { featureEnabled("diseno_ia").then(setIaEnabled); }, []);

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    // varios eventos por cuenta: sin .single() (con 2+ filas devolvía null
    // y expulsaba al onboarding); el activo se recuerda en localStorage
    const { data: parejasRows, error: parejasErr } = await supabase.from("parejas")
      .select("*").eq("user_id", user.id).order("created_at", { ascending: true });
    if (parejasErr) { setCargaError(true); return; }
    const p = elegirPareja(parejasRows || []);
    if (!p) { router.push("/onboarding"); return; }
    setEventos(parejasRows || []);
    setPareja(p);
    setF({
      nombre1: p.nombre1 || "", nombre2: p.nombre2 || "", fecha: p.fecha || "", lugar: p.lugar || "", hora: p.hora || "",
      ceremonia: p.ceremonia || "", ceremonia_maps: p.ceremonia_maps || "", recepcion: p.recepcion || "", recepcion_maps: p.recepcion_maps || "",
      dresscode: p.dresscode || "", dresscode_notas: p.dresscode_notas || "",
      dresscode_fotos: Array.isArray(p.dresscode_fotos) ? p.dresscode_fotos : [],
      galeria_fotos: Array.isArray(p.galeria_fotos) ? p.galeria_fotos : [],
      historia: p.historia || "", musica: p.musica || "", hashtag: p.hashtag || "", fotos_url: p.fotos_url || "", mensaje_gracias: p.mensaje_gracias || "",
      foto_hero: p.foto_hero || "", tipografia: p.tipografia || "Cormorant Garamond", tipografia_titulos: p.tipografia_titulos || p.tipografia || "Cormorant Garamond",
      paleta: p.paleta || "rosawedo", hero_oscuridad: p.hero_oscuridad ?? 45,
      color_acento: p.color_acento || "#E84B8A", color_fondo: p.color_fondo || "#F7F0E5", color_superficie: p.color_superficie || "#FFFFFF",
      paleta_colores: (Array.isArray(p.paleta_colores) && p.paleta_colores.length === 4)
        ? p.paleta_colores
        : (PALETAS.find((x) => x.id === (p.paleta || "rosawedo"))?.dots || ["#E84B8A", "#87A6E8", "#B3C24A", "#EE5A28"]),
      agenda: Array.isArray(p.agenda) ? p.agenda : [],
      rsvp_fecha_limite: p.rsvp_fecha_limite || "", nota_adultos: p.nota_adultos || "",
      invitacion_url: p.invitacion_url || "",
      frase_portada: p.frase_portada ?? getEventType(p.tipo_evento).frasePortada, estilo_portada: p.estilo_portada || "clasica",
      animaciones_estilo: p.animaciones_estilo || "elegante", petalos: !!p.petalos, confeti_regalo: !!p.confeti_regalo,
      std_estilo: p.std_estilo || "c",
      tipo_evento: p.tipo_evento || "boda",
      detalles_evento: (p.detalles_evento && typeof p.detalles_evento === "object") ? p.detalles_evento : {},
    });
    setIaTema((p.detalles_evento && p.detalles_evento.tema) || "");
    setIa((s) => ({ ...s, restantes: Math.max(0, 3 - (p.disenos_ia_usados || 0)) }));
    setRsvpCodigo(p.rsvp_codigo_requerido || false);
    if (p.secciones) setSecciones((s) => ({ ...s, ...p.secciones }));
    if (Array.isArray(p.secciones_orden) && p.secciones_orden.length) {
      const saved = p.secciones_orden as string[];
      setOrden([...saved, ...DEFAULT_ORDER.filter((id) => !saved.includes(id))]);
    }
    const { data: fd } = await supabase.from("fondos").select("*").eq("pareja_id", p.id).order("orden");
    setFondos(fd || []);
    const { data: inv } = await supabase.from("invitados").select("*").eq("pareja_id", p.id).order("grupo").order("nombre");
    setInvitados(inv || []);
    const { data: r } = await supabase.from("rsvp").select("*").eq("pareja_id", p.id).order("created_at", { ascending: false });
    // una sola respuesta por invitación (la primera del grupo)
    const vistosRsvp = new Set<string>();
    setRsvps((r || []).slice().reverse().filter((x: any) => {
      if (!x.invitado_id) return true;
      if (vistosRsvp.has(x.invitado_id)) return false;
      vistosRsvp.add(x.invitado_id);
      return true;
    }).reverse());
    setLoading(false);
  }

  async function savePareja(partial: any, which: Pane | "all") {
    if (!pareja) return;
    setSavingPane(which);
    await supabase.from("parejas").update(partial).eq("id", pareja.id);
    setSavingPane(null);
    setSavedPane(which);
    setTimeout(() => setSavedPane((c) => (c === which ? null : c)), 2200);
  }

  const saveInfo = () => savePareja({
    nombre1: f.nombre1, nombre2: f.nombre2, fecha: f.fecha || null, lugar: f.lugar, hora: f.hora,
    ceremonia: f.ceremonia, ceremonia_maps: f.ceremonia_maps, recepcion: f.recepcion, recepcion_maps: f.recepcion_maps,
    dresscode: f.dresscode, dresscode_notas: f.dresscode_notas, dresscode_fotos: f.dresscode_fotos,
    galeria_fotos: f.galeria_fotos, historia: f.historia, musica: f.musica, hashtag: f.hashtag, fotos_url: f.fotos_url, mensaje_gracias: f.mensaje_gracias,
    frase_portada: f.frase_portada, agenda: f.agenda, rsvp_fecha_limite: f.rsvp_fecha_limite || null, nota_adultos: f.nota_adultos,
    detalles_evento: f.detalles_evento || {},
  }, "info");
  const saveDiseno = () => savePareja({
    foto_hero: f.foto_hero || null, tipografia: f.tipografia, tipografia_titulos: f.tipografia_titulos,
    paleta: f.paleta, hero_oscuridad: f.hero_oscuridad, color_acento: f.color_acento, color_fondo: f.color_fondo, color_superficie: f.color_superficie, paleta_colores: f.paleta_colores,
    estilo_portada: f.estilo_portada, animaciones_estilo: f.animaciones_estilo, petalos: f.petalos, confeti_regalo: f.confeti_regalo,
    std_estilo: f.std_estilo,
  }, "diseno");
  const saveInvitacion = () => savePareja({ invitacion_url: f.invitacion_url || null }, "invitacion");
  const saveSecciones = () => savePareja({ secciones, secciones_orden: orden }, "secciones");
  const publishAll = () => savePareja({
    nombre1: f.nombre1, nombre2: f.nombre2, fecha: f.fecha || null, lugar: f.lugar, hora: f.hora,
    ceremonia: f.ceremonia, ceremonia_maps: f.ceremonia_maps, recepcion: f.recepcion, recepcion_maps: f.recepcion_maps,
    dresscode: f.dresscode, dresscode_notas: f.dresscode_notas, dresscode_fotos: f.dresscode_fotos,
    galeria_fotos: f.galeria_fotos, historia: f.historia, musica: f.musica, hashtag: f.hashtag, fotos_url: f.fotos_url, mensaje_gracias: f.mensaje_gracias,
    foto_hero: f.foto_hero || null, tipografia: f.tipografia, tipografia_titulos: f.tipografia_titulos,
    paleta: f.paleta, hero_oscuridad: f.hero_oscuridad, color_acento: f.color_acento, color_fondo: f.color_fondo, color_superficie: f.color_superficie, paleta_colores: f.paleta_colores,
    frase_portada: f.frase_portada, estilo_portada: f.estilo_portada, animaciones_estilo: f.animaciones_estilo, petalos: f.petalos, confeti_regalo: f.confeti_regalo,
    agenda: f.agenda, rsvp_fecha_limite: f.rsvp_fecha_limite || null, nota_adultos: f.nota_adultos, std_estilo: f.std_estilo,
    detalles_evento: f.detalles_evento || {},
    invitacion_url: f.invitacion_url || null, secciones, secciones_orden: orden,
  }, "all");

  // ---- uploads ----
  async function upload(bucket: string, file: File, prefix: string): Promise<string | null> {
    const name = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(name, file);
    if (error) return null;
    return supabase.storage.from(bucket).getPublicUrl(name).data.publicUrl;
  }
  async function onGaleria(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (f.galeria_fotos.length >= 30) break;
      const url = await upload("bodas", file, "galeria");
      if (url) setF((p: any) => ({ ...p, galeria_fotos: [...p.galeria_fotos, url] }));
    }
    e.target.value = "";
  }
  async function onDresscode(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || f.dresscode_fotos.length >= 6) return;
    const url = await upload("bodas", file, "dresscode");
    if (url) setF((p: any) => ({ ...p, dresscode_fotos: [...p.dresscode_fotos, url] }));
    e.target.value = "";
  }
  async function onHero(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await upload("bodas", file, "hero");
    if (url) setField("foto_hero", url);
    e.target.value = "";
  }
  async function onGiftFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await upload("fondos", file, "fondo");
    if (url) setGForm((p: any) => ({ ...p, foto: url }));
    e.target.value = "";
  }
  async function onInvitacion(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await upload("bodas", file, "inv");
    if (url) setField("invitacion_url", url);
    e.target.value = "";
  }
  const pick = (id: string) => fileRefs.current[id]?.click();

  // ---- gifts ----
  function openNewGift() { setEditingGift(null); setGForm({ nombre: "", descripcion: "", historia: "", meta: "", foto: "", modo: "libre", chips: [100, 200, 500, 1000], nuevoChip: "", mostrar_progreso: true, cantidad: "1" }); setShowGiftForm(true); }
  function openEditGift(g: any) {
    setEditingGift(g);
    setGForm({ nombre: g.nombre || "", descripcion: g.descripcion || "", historia: g.historia || "", meta: g.meta?.toString() || "", foto: g.foto || "", modo: g.modo || "libre", chips: g.chips || [100, 200, 500, 1000], nuevoChip: "", mostrar_progreso: g.mostrar_progreso !== false, cantidad: (g.cantidad || 1).toString() });
    setShowGiftForm(true);
  }
  function addChip() {
    const v = parseInt(gForm.nuevoChip);
    if (!v || v <= 0 || gForm.chips.includes(v)) return;
    setGForm((p: any) => ({ ...p, chips: [...p.chips, v].sort((a: number, b: number) => a - b), nuevoChip: "" }));
  }
  async function saveGift() {
    if (!gForm.nombre) return;
    setSavingGift(true);
    const data = { nombre: gForm.nombre, descripcion: gForm.descripcion, historia: gForm.historia, meta: parseFloat(gForm.meta) || 0, foto: gForm.foto || null, modo: gForm.modo, chips: gForm.chips, mostrar_progreso: gForm.mostrar_progreso !== false, cantidad: Math.max(1, parseInt(gForm.cantidad) || 1) };
    if (editingGift) await supabase.from("fondos").update(data).eq("id", editingGift.id);
    else await supabase.from("fondos").insert({ pareja_id: pareja.id, ...data, recaudado: 0, orden: fondos.length, tomado: false });
    setShowGiftForm(false); setEditingGift(null); setSavingGift(false);
    const { data: fd } = await supabase.from("fondos").select("*").eq("pareja_id", pareja.id).order("orden");
    setFondos(fd || []);
  }
  async function deleteGift(id: string) {
    await supabase.from("fondos").delete().eq("id", id);
    setFondos((arr) => arr.filter((x) => x.id !== id));
  }

  // ---- invitados ----
  const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  // tokens legibles para links personales (rafael-del-cid-a1b2 / acompanante-rafael-c3d4)
  const slugifyTok = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const rand4 = () => Math.random().toString(36).slice(2, 6).padEnd(4, "0");
  const [editGuest, setEditGuest] = useState<any>(null);
  const [egNombre, setEgNombre] = useState("");
  const [egMiembros, setEgMiembros] = useState<any[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [importando, setImportando] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [guestQ, setGuestQ] = useState("");
  const [guestFiltro, setGuestFiltro] = useState<"todos" | "si" | "no" | "pend">("todos");
  // confirmación manual: invitación abierta y quiénes asisten (por token)
  const [confGuest, setConfGuest] = useState<any>(null);
  const [confSel, setConfSel] = useState<Record<string, boolean>>({});
  const [confGuardando, setConfGuardando] = useState(false);

  function abrirConfirmar(inv: any) {
    setShowGuestForm(false);
    setEditGuest(null);
    setConfGuest(inv);
    const rsvp = rsvps.find((r: any) => r.invitado_id === inv.id);
    const previos: string[] = Array.isArray(rsvp?.asistentes) ? rsvp.asistentes : [];
    const init: Record<string, boolean> = {};
    (inv.miembros || []).forEach((m: any, i: number) => {
      // preselección: lo ya confirmado; si no hay respuesta, los con nombre
      init[m.token] = rsvp ? previos.includes(m.nombre || "Acompañante") : !!m.nombre || i === 0;
    });
    setConfSel(init);
  }

  /** Guarda la confirmación manual (tuya, como organizadora): crea o
      actualiza la respuesta y marca la invitación. */
  async function guardarConfirmacion(asistencia: "si" | "no") {
    if (!confGuest) return;
    setConfGuardando(true);
    const miembros = confGuest.miembros || [];
    const seleccion = asistencia === "si" ? miembros.filter((m: any) => confSel[m.token]) : [];
    const asistentes = seleccion.map((m: any) => m.nombre || "Acompañante");
    const acompanantes = Math.max(0, asistentes.length - 1);
    const previa = rsvps.find((r: any) => r.invitado_id === confGuest.id);
    let err = null;
    if (previa) {
      ({ error: err } = await supabase.from("rsvp").update({ asistencia, acompanantes, asistentes }).eq("id", previa.id));
    } else {
      ({ error: err } = await supabase.from("rsvp").insert({
        invitado_id: confGuest.id, pareja_id: pareja.id, nombre: confGuest.nombre,
        asistencia, acompanantes, asistentes, mensaje: null, restricciones: null,
      }));
    }
    if (err) { setConfGuardando(false); alert("No pudimos guardar la confirmación. Intenta de nuevo."); return; }
    const { error: err2 } = await supabase.from("invitados").update({ confirmado: true, asistira: asistencia, respondido_por: "Confirmación manual" }).eq("id", confGuest.id);
    if (err2) { setConfGuardando(false); alert("No pudimos guardar la confirmación. Intenta de nuevo."); return; }
    const { data: r } = await supabase.from("rsvp").select("*").eq("pareja_id", pareja.id).order("created_at", { ascending: false });
    const vistosC = new Set<string>();
    setRsvps((r || []).slice().reverse().filter((x: any) => {
      if (!x.invitado_id) return true;
      if (vistosC.has(x.invitado_id)) return false;
      vistosC.add(x.invitado_id);
      return true;
    }).reverse());
    setInvitados((arr) => arr.map((x) => (x.id === confGuest.id ? { ...x, confirmado: true, asistira: asistencia } : x)));
    setConfGuardando(false);
    setConfGuest(null);
  }

  /** Quita la confirmación (vuelve a pendiente). */
  async function quitarConfirmacion() {
    if (!confGuest) return;
    setConfGuardando(true);
    const { error: errDel } = await supabase.from("rsvp").delete().eq("invitado_id", confGuest.id);
    if (errDel) { setConfGuardando(false); alert("No pudimos quitar la confirmación. Intenta de nuevo."); return; }
    await supabase.from("invitados").update({ confirmado: false, asistira: null, respondido_por: null }).eq("id", confGuest.id);
    setRsvps((arr) => arr.filter((r: any) => r.invitado_id !== confGuest.id));
    setInvitados((arr) => arr.map((x) => (x.id === confGuest.id ? { ...x, confirmado: false, asistira: null } : x)));
    setConfGuardando(false);
    setConfGuest(null);
  }

  const [egAbsorbidas, setEgAbsorbidas] = useState<string[]>([]);

  function openEditGuest(inv: any) {
    setShowGuestForm(false);
    setConfGuest(null);
    setEditGuest(inv);
    setEgNombre(inv.nombre || "");
    setEgMiembros((inv.miembros || []).map((m: any) => ({ ...m, nombre: m.nombre || "" })));
    setEgAbsorbidas([]);
  }

  /** Trae los miembros de otra invitación a este grupo (conservan sus links);
      la invitación original se elimina al guardar. */
  function unirInvitacion(id: string) {
    const otra = invitados.find((x: any) => x.id === id);
    if (!otra) return;
    setEgMiembros((arr) => [...arr, ...(otra.miembros || []).map((m: any) => ({ ...m, nombre: m.nombre || "" }))]);
    setEgAbsorbidas((a) => [...a, id]);
  }

  async function saveEditGuest() {
    if (!editGuest || !egNombre.trim() || egMiembros.length === 0) return;
    setSavingEdit(true);
    const miembros = egMiembros.map((m: any, i: number) => {
      const nombre = i === 0 ? egNombre.trim() : ((m.nombre || "").trim() || null);
      // los miembros existentes CONSERVAN su token (los links repartidos siguen vivos);
      // a los nuevos con nombre se les genera token legible
      let token = m.token;
      if (m._nuevo && nombre && i > 0) token = `${slugifyTok(nombre)}-${rand4()}`;
      return { nombre, token };
    });
    await supabase.from("invitados").update({ nombre: egNombre.trim(), asientos: miembros.length, miembros }).eq("id", editGuest.id);
    for (const id of egAbsorbidas) {
      await supabase.from("rsvp").delete().eq("invitado_id", id);
      await supabase.from("invitados").delete().eq("id", id);
    }
    setInvitados((arr) => arr
      .filter((x) => !egAbsorbidas.includes(x.id))
      .map((x) => (x.id === editGuest.id ? { ...x, nombre: egNombre.trim(), asientos: miembros.length, miembros } : x)));
    setSavingEdit(false);
    setEditGuest(null);
  }

  /** CSV (se abre en Excel) con el link personal y el mensaje de WhatsApp por persona. */
  function descargarLinks() {
    const nombres = [pareja?.nombre1, pareja?.nombre2].filter(Boolean).map((n: string) => n.split(" ")[0]).join(" & ");
    const fechaTxt = pareja?.fecha ? new Date(pareja.fecha + "T12:00:00").toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, ".") : "";
    const limite = pareja?.rsvp_fecha_limite ? new Date(pareja.rsvp_fecha_limite + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long" }) : "";
    const evento = (pareja?.tipo_evento || "boda") === "boda" ? "nuestra boda" : "nuestra celebración";
    const filas: string[][] = [["Invitación", "Persona", "Link personal", "Mensaje de WhatsApp"]];
    for (const inv of invitados) {
      for (const m of inv.miembros || []) {
        if (!m.nombre) continue; // los +1 no tienen link: los confirma el principal
        const link = `https://wedo.gifts/boda/${pareja?.slug}?i=${m.token}`;
        const primer = m.nombre.split(" ")[0];
        const msg = `¡Llegó el momento! 🤍\n\nNos hace muchísima ilusión compartir contigo, ${primer}, la invitación a *${evento}*.\nEn el siguiente link encontrarás todos los detalles y podrás confirmar tu asistencia.\n\n${link}\n\n${limite ? `Te pedimos realizar tu *RSVP antes del ${limite}.*\n\n` : ""}¡No podemos esperar para celebrar juntos! ✨\n\n*_${nombres}${fechaTxt ? ` · ${fechaTxt}` : ""}_*`;
        filas.push([inv.nombre, m.nombre, link, msg]);
      }
    }
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = "\ufeff" + filas.map((r) => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "links-rsvp-wedo.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /** Importa invitaciones desde Excel (columnas: Invitado principal · grupo · Plus 1).
      Solo crea las que no existan (por nombre); nunca toca las existentes. */
  async function importarExcel(file: File) {
    setImportando(true);
    setImportMsg("");
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer());
      const hoja = wb.Sheets[wb.SheetNames[0]];
      const filas: any[][] = XLSX.utils.sheet_to_json(hoja, { header: 1 });
      if (!filas.length) throw new Error("vacío");
      // detecta columnas por encabezado (o usa A/B/C)
      const head = (filas[0] || []).map((c: any) => String(c || "").toLowerCase());
      const tieneHeader = head.some((h: string) => h.includes("invitado"));
      const iNombre = Math.max(head.findIndex((h: string) => h.includes("invitado")), 0);
      const iGrupo = head.findIndex((h: string) => h.includes("grupo"));
      const iPlus = head.findIndex((h: string) => h.includes("plus"));
      const norm = (x: string) => x.trim().replace(/\s+/g, " ").toLowerCase();
      const existentes = new Set(invitados.map((i: any) => norm(i.nombre)));
      const nuevos: any[] = [];
      let saltados = 0;
      for (const fila of filas.slice(tieneHeader ? 1 : 0)) {
        const nombre = String(fila[iNombre] || "").trim().replace(/\s+/g, " ");
        if (!nombre) continue;
        if (existentes.has(norm(nombre))) { saltados++; continue; }
        existentes.add(norm(nombre));
        const grupoN = iGrupo >= 0 ? String(fila[iGrupo] || "").trim().replace(/\s+/g, " ") : "";
        const plus1 = iPlus >= 0 ? (parseInt(String(fila[iPlus] || "0")) || 0) : 0;
        const primer = slugifyTok(nombre.split(" ")[0] || "invitado");
        const miembros: any[] = [{ nombre, token: `${slugifyTok(nombre)}-${rand4()}` }];
        if (grupoN) miembros.push({ nombre: grupoN, token: `${slugifyTok(grupoN)}-${rand4()}` });
        for (let k = 0; k < plus1; k++) miembros.push({ nombre: null, token: `acompanante-${primer}-${rand4()}` });
        nuevos.push({ pareja_id: pareja.id, nombre, asientos: miembros.length, grupo: null, confirmado: false, miembros });
      }
      if (nuevos.length) {
        const { error } = await supabase.from("invitados").insert(nuevos);
        if (error) throw error;
        const { data: inv } = await supabase.from("invitados").select("*").eq("pareja_id", pareja.id).order("grupo").order("nombre");
        setInvitados(inv || []);
      }
      setImportMsg(`✓ ${nuevos.length} ${nuevos.length === 1 ? "invitación nueva" : "invitaciones nuevas"}${saltados ? ` · ${saltados} ya existían (sin cambios)` : ""}`);
    } catch {
      setImportMsg("No pude leer el archivo. Usa columnas: Invitado principal · grupo · Plus 1");
    }
    setImportando(false);
  }
  async function addGuest() {
    if (!guestForm.nombre.trim()) return;
    setSavingGuest(true);
    // un miembro con token único por asiento; el token lleva el nombre para que
    // el link sea legible (ej. rafael-del-cid-a1b2 / acompanante-rafael-c3d4)
    const asientosN = Math.max(1, parseInt(guestForm.asientos) || 1);
    const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const rand4 = () => Math.random().toString(36).slice(2, 6).padEnd(4, "0");
    const nombreInv = guestForm.nombre.trim();
    const primer = slugify(nombreInv.split(" ")[0] || "invitado");
    const miembros = Array.from({ length: asientosN }, (_, i) => (
      i === 0
        ? { nombre: nombreInv, token: `${slugify(nombreInv)}-${rand4()}` }
        : { nombre: null, token: `acompanante-${primer}-${rand4()}` }
    ));
    await supabase.from("invitados").insert({ pareja_id: pareja.id, nombre: guestForm.nombre.trim(), asientos: asientosN, grupo: guestForm.grupo.trim() || null, miembros });
    setGuestForm({ nombre: "", asientos: "1", grupo: "" }); setShowGuestForm(false); setSavingGuest(false);
    const { data: inv } = await supabase.from("invitados").select("*").eq("pareja_id", pareja.id).order("grupo").order("nombre");
    setInvitados(inv || []);
  }
  async function deleteGuest(id: string) {
    const inv = invitados.find((x: any) => x.id === id);
    if (!window.confirm(`¿Eliminar la invitación de ${inv?.nombre || "este invitado"}? Se pierde su link y su respuesta RSVP.`)) return;
    await supabase.from("rsvp").delete().eq("invitado_id", id);
    await supabase.from("invitados").delete().eq("id", id);
    setInvitados((arr) => arr.filter((x) => x.id !== id));
  }
  async function toggleRsvpCodigo() {
    const nv = !rsvpCodigo;
    setRsvpCodigo(nv);
    await supabase.from("parejas").update({ rsvp_codigo_requerido: nv }).eq("id", pareja.id);
  }
  async function saveCode(id: string) {
    const code = codeVal.trim().toUpperCase() || null;
    await supabase.from("invitados").update({ codigo: code }).eq("id", id);
    setInvitados((arr) => arr.map((x) => (x.id === id ? { ...x, codigo: code } : x)));
    setEditCodeId(null);
  }
  async function generateAllCodes() {
    const updated = [...invitados];
    for (const inv of updated) {
      if (!inv.codigo) { const c = genCode(); await supabase.from("invitados").update({ codigo: c }).eq("id", inv.id); inv.codigo = c; }
    }
    setInvitados(updated);
  }

  // ---- secciones reorder ----
  function moveSec(from: number, to: number) {
    if (to < 0 || to >= orden.length) return;
    const next = [...orden]; const [it] = next.splice(from, 1); next.splice(to, 0, it); setOrden(next);
  }

  // ---- derived ----
  const slug = pareja?.slug || "";
  const palObj = PALETAS.find((p) => p.id === f.paleta);
  const accent = f.paleta === "personalizado" ? f.color_acento : (palObj?.accent || f.color_acento);

  // diseñador IA
  async function generarIAEditor(nocache: boolean) {
    if (!pareja || ia.loading) return;
    const tema = iaTema.trim();
    if (!tema) return;
    setIa((s) => ({ ...s, loading: true, error: "" }));
    try {
      const d = await generarDisenoIA({ parejaId: pareja.id, tema, tipoEvento: f.tipo_evento, nocache });
      setIa({ loading: false, error: "", diseno: d, aplicado: false, restantes: d.restantes ?? null });
    } catch (e: any) {
      setIa((s) => ({
        ...s,
        loading: false,
        error: e?.message || "No pudimos generar el diseño. Intenta de nuevo.",
        restantes: e instanceof DisenoIAError && typeof e.restantes === "number" ? e.restantes : s.restantes,
      }));
    }
  }
  async function aplicarDisenoIA() {
    const d = ia.diseno;
    if (!d) return;
    setF((p: any) => ({
      ...p,
      paleta: "personalizado", paleta_colores: d.colores, color_acento: d.colores[0],
      tipografia: d.tipografia, tipografia_titulos: d.tipografia_titulos,
      foto_hero: d.foto_hero || p.foto_hero, frase_portada: d.frase_portada,
    }));
    await savePareja({
      paleta: "personalizado", paleta_colores: d.colores, color_acento: d.colores[0],
      tipografia: d.tipografia, tipografia_titulos: d.tipografia_titulos,
      ...(d.foto_hero ? { foto_hero: d.foto_hero } : {}),
      frase_portada: d.frase_portada,
    }, "diseno");
    setIa((s) => ({ ...s, aplicado: true }));
  }

  // tipo de evento — la config (eventTypes.ts) decide qué campos aplican y sus etiquetas
  const evtType = getEventType(f.tipo_evento);
  const esBoda = evtType.id === "boda";
  const campoN2 = getCampo(evtType, "nombre2");
  const campoCer = getCampo(evtType, "ceremonia");
  const campoHist = getCampo(evtType, "historia");
  // campos propios del tipo (detalle:true) → se editan sobre detalles_evento
  const camposDetalle = evtType.pasos.flatMap((p) => p.campos.filter((c) => c.detalle));
  const setDetalle = (k: string, v: string) => setF((p: any) => ({ ...p, detalles_evento: { ...(p.detalles_evento || {}), [k]: v } }));
  const totalAsientos = invitados.reduce((s, i) => s + (i.asientos || 1), 0);
  const confSi = rsvps.filter((r) => r.asistencia === "si").length;
  const confNo = rsvps.filter((r) => r.asistencia === "no").length;
  const asientosConf = rsvps.filter((r) => r.asistencia === "si").reduce((s, r) => s + (r.acompanantes || 0) + 1, 0);
  const grupos: Record<string, any[]> = {};
  const gq = guestQ.trim().toLowerCase();
  const rsvpDe = (i: any) => rsvps.find((r: any) => r.invitado_id === i.id);
  const pasaFiltro = (i: any) => {
    const r = rsvpDe(i);
    if (guestFiltro === "si") return r?.asistencia === "si";
    if (guestFiltro === "no") return !!r && r.asistencia !== "si";
    if (guestFiltro === "pend") return !r;
    return true;
  };
  const invitadosVisibles = invitados.filter((i) => pasaFiltro(i) && (!gq ||
    (i.nombre || "").toLowerCase().includes(gq) ||
    (Array.isArray(i.miembros) && i.miembros.some((m: any) => (m.nombre || "").toLowerCase().includes(gq)))
  ));
  const nConfirmados = invitados.filter((i) => rsvpDe(i)?.asistencia === "si").length;
  const nNoPodran = invitados.filter((i) => { const r = rsvpDe(i); return !!r && r.asistencia !== "si"; }).length;
  const nPendientesInv = invitados.filter((i) => !rsvpDe(i)).length;
  invitadosVisibles.forEach((i) => { const g = i.grupo || "Sin grupo"; (grupos[g] = grupos[g] || []).push(i); });
  const seccActivas = Object.keys(SECCIONES_META).filter((k) => secciones[k]).length;
  const completeness = (() => {
    let c = 0; const checks = [f.nombre1 && (!campoN2 || f.nombre2), f.fecha, f.foto_hero, fondos.length > 0, invitados.length > 0]; checks.forEach((x) => x && c++); return Math.round((c / checks.length) * 100);
  })();

  async function logout() { await supabase.auth.signOut(); router.push("/"); }

  if (cargaError) return (
    <div className="wedo-app"><div className="app-loading" style={{ flexDirection: "column", gap: 16 }}>
      <span>No pudimos cargar tu evento<span style={{ color: "var(--pink)" }}>.</span></span>
      <button className="btn btn-pink btn-sm" onClick={() => window.location.reload()}>Reintentar</button>
    </div></div>
  );
  if (loading) return <div className="wedo-app"><div className="app-loading">Cargando<span style={{ color: "var(--pink)" }}>.</span></div></div>;

  const saveLabel = (which: Pane, base: string) => savingPane === which ? "Guardando…" : savedPane === which ? "¡Guardado!" : base;

  return (
    <div className="wedo-app">
      {/* TOPBAR */}
      <header className="topbar">
        <div className="wrap topbar-in full">
          <Link className="logo" href="/">wedo<span className="dot">.</span></Link>
          <div className="evt-wrap">
            <button className="evt-switch" type="button" onClick={() => setEvtMenu((v) => !v)}>
              <span className="tag">Evento</span>
              <span>{f.nombre2 ? `${f.nombre1 || "Tu evento"} & ${f.nombre2}` : (f.nombre1 || "Tu evento")} · {evtType.label}</span>
              <span className="chev">▾</span>
            </button>
            {evtMenu && (
              <div className="evt-menu">
                {eventos.map((e) => (
                  <button key={e.id} type="button" className={e.id === pareja?.id ? "on" : ""}
                    onClick={() => { setEventoActivoId(e.id); window.location.reload(); }}>
                    {e.nombre2 ? `${e.nombre1} & ${e.nombre2}` : e.nombre1}
                    <span className="tipo">{getEventType(e.tipo_evento).label}</span>
                  </button>
                ))}
                <a className="nuevo" href="/onboarding">＋ Crear otro evento</a>
              </div>
            )}
          </div>
          <div className="topbar-r">
            <span className="saved-tag">
              <span className="bdot" style={{ background: savedPane ? "var(--lime)" : "var(--ink-faint)" }} />
              {savingPane ? "Guardando…" : savedPane ? "Guardado" : "Listo"}
            </span>
            {slug && <a className="btn btn-ghost btn-sm" href={`/boda/${slug}`} target="_blank" rel="noreferrer">Vista previa</a>}
            <button className="btn btn-pink btn-sm" onClick={publishAll} disabled={savingPane === "all"}>{savingPane === "all" ? "Publicando…" : savedPane === "all" ? "¡Publicado!" : "Publicar cambios"}</button>
            <button className="avatar" onClick={logout} title="Cerrar sesión">{(f.nombre1 || "M").charAt(0).toUpperCase()}</button>
          </div>
        </div>
      </header>

      <div className="editor">
        {/* RAIL */}
        <aside className="erail">
          <div className="sec-title">Tu evento</div>
          {RAIL.map((r) => (
            <a key={r.id} className={pane === r.id ? "on" : ""} onClick={() => setPane(r.id)}>
              <span className="n">{r.n}</span>{r.label}
            </a>
          ))}
          <div className="rail-foot">
            <p className="progress-note">Tu invitación está <strong>{completeness}%</strong> lista.</p>
            {slug && <a className="btn btn-ghost btn-sm" href={`/boda/${slug}`} target="_blank" rel="noreferrer" style={{ width: "100%" }}>Ver invitación</a>}
          </div>
        </aside>

        {/* PANEL */}
        <main className="epanel">
          <div className="epanel-inner">

            {/* INFO */}
            {pane === "info" && (
              <Pane num="i" title="Información" desc="Todos los detalles de tu evento. Esto arma tu invitación y sus secciones.">
                <div className="ecard">
                  <div className="ecard-h">{esBoda ? "Los novios" : evtType.pasos[0]?.titulo || "El festejado"}</div>
                  <div className="frow">
                    <div className="field grow"><label>{campoLabel(evtType, "nombre1", "Nombre 1")}</label><input className="inp" value={f.nombre1} onChange={(e) => setField("nombre1", e.target.value)} placeholder={getCampo(evtType, "nombre1")?.placeholder || "Andrea"} /></div>
                    {campoN2 && <div className="field grow"><label>{campoN2.label}</label><input className="inp" value={f.nombre2} onChange={(e) => setField("nombre2", e.target.value)} placeholder={campoN2.placeholder || "Diego"} /></div>}
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}><label>Frase de portada</label><input className="inp" value={f.frase_portada} onChange={(e) => setField("frase_portada", e.target.value)} placeholder={evtType.frasePortada} /><p className="hint" style={{ margin: "6px 0 0" }}>El texto pequeño arriba {esBoda ? "de sus nombres" : "del nombre"} en la invitación (ej. “{evtType.frasePortada}”).</p></div>
                </div>

                <div className="ecard">
                  <div className="ecard-h">Galería de fotos</div>
                  <p className="hint">Aparece como un carrusel debajo de la foto principal. Hasta 30 fotos. Actívala en Secciones.</p>
                  {f.galeria_fotos.length > 0 && (
                    <div className="photo-grid">
                      {f.galeria_fotos.map((url: string, i: number) => (
                        <div className="photo-thumb" key={i}><img src={url} alt="" /><button className="rm" onClick={() => setF((p: any) => ({ ...p, galeria_fotos: p.galeria_fotos.filter((_: any, j: number) => j !== i) }))}>×</button></div>
                      ))}
                    </div>
                  )}
                  {f.galeria_fotos.length < 30 && (
                    <>
                      <input ref={(el) => { fileRefs.current.galeria = el; }} type="file" accept="image/*" multiple onChange={onGaleria} style={{ display: "none" }} />
                      <div className="dropzone" onClick={() => pick("galeria")}><div className="dz-main">+ Agregar fotos ({f.galeria_fotos.length}/30)</div><div className="dz-sub">Puedes seleccionar varias a la vez</div></div>
                    </>
                  )}
                </div>

                {camposDetalle.length > 0 && (
                  <div className="ecard">
                    <div className="ecard-h">Detalles de tu {evtType.label.toLowerCase()}</div>
                    {camposDetalle.map((c, i) => (
                      <div className="field" key={c.key} style={i === camposDetalle.length - 1 ? { marginBottom: 0 } : undefined}>
                        <label>{c.label}</label>
                        <input className="inp" value={(f.detalles_evento || {})[c.key] || ""} onChange={(e) => setDetalle(c.key, e.target.value)} placeholder={c.placeholder} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="ecard">
                  <div className="ecard-h">{esBoda ? "El gran día" : evtType.pasos[1]?.titulo || "La celebración"}</div>
                  <div className="field"><label>Fecha</label><input className="inp" type="date" value={f.fecha || ""} onChange={(e) => setField("fecha", e.target.value)} /></div>
                  <div className="frow">
                    <div className="field grow"><label>Ciudad</label><input className="inp" value={f.lugar} onChange={(e) => setField("lugar", e.target.value)} placeholder="Antigua Guatemala" /></div>
                    <div className="field grow"><label>Hora</label><input className="inp" value={f.hora} onChange={(e) => setField("hora", e.target.value)} placeholder="4:00 PM" /></div>
                  </div>
                  <div className="field"><label>Fecha límite para confirmar (RSVP)</label><input className="inp" type="date" value={f.rsvp_fecha_limite || ""} onChange={(e) => setField("rsvp_fecha_limite", e.target.value)} /><p className="hint" style={{ margin: "6px 0 0" }}>Aparece en Detalles como “Confirma tu asistencia antes de…”. Déjalo vacío para ocultarlo.</p></div>
                  <div className="field" style={{ marginBottom: 0 }}><label>Nota “solo adultos”</label><input className="inp" value={f.nota_adultos} onChange={(e) => setField("nota_adultos", e.target.value)} placeholder="Ceremonia y recepción: solo adultos." /><p className="hint" style={{ margin: "6px 0 0" }}>Aparece como tarjeta en Detalles. Déjala vacía si tu evento admite niños.</p></div>
                </div>

                <div className="ecard">
                  <div className="ecard-h">Agenda del día</div>
                  <p className="hint" style={{ margin: "0 0 12px" }}>El cronograma que verán tus invitados en Detalles (hora + momento).</p>
                  {(f.agenda || []).map((row: { hora: string; evento: string }, i: number) => (
                    <div className="frow" key={i} style={{ alignItems: "flex-end" }}>
                      <div className="field" style={{ width: 120 }}><label>Hora</label><input className="inp" value={row.hora} onChange={(e) => updateAgenda(i, "hora", e.target.value)} placeholder="4:00 PM" /></div>
                      <div className="field grow"><label>Momento</label><input className="inp" value={row.evento} onChange={(e) => updateAgenda(i, "evento", e.target.value)} placeholder="Ceremonia religiosa" /></div>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeAgenda(i)} style={{ marginBottom: 14 }}>Quitar</button>
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-sm" onClick={addAgenda}>+ Agregar momento</button>
                </div>

                <div className="ecard">
                  <div className="ecard-h">Venues</div>
                  {campoCer && (
                    <>
                      <div className="field"><label>{campoCer.label}</label><input className="inp" value={f.ceremonia} onChange={(e) => setField("ceremonia", e.target.value)} placeholder={campoCer.placeholder || "Iglesia La Merced"} /></div>
                      <div className="field"><label>Link de Google Maps — {campoCer.label}</label><input className="inp" value={f.ceremonia_maps} onChange={(e) => setField("ceremonia_maps", e.target.value)} placeholder="https://maps.app.goo.gl/..." /></div>
                      <div className="divline" />
                    </>
                  )}
                  <div className="field"><label>{campoLabel(evtType, "recepcion", "Recepción")}</label><input className="inp" value={f.recepcion} onChange={(e) => setField("recepcion", e.target.value)} placeholder={getCampo(evtType, "recepcion")?.placeholder || "Casa Santo Domingo"} /></div>
                  <div className="field" style={{ marginBottom: 0 }}><label>Link de Google Maps — {campoLabel(evtType, "recepcion", "Recepción")}</label><input className="inp" value={f.recepcion_maps} onChange={(e) => setField("recepcion_maps", e.target.value)} placeholder="https://maps.app.goo.gl/..." /></div>
                </div>

                <div className="ecard">
                  <div className="ecard-h">Dress code</div>
                  <div className="field"><label>Etiqueta de dress code</label><input className="inp" value={f.dresscode} onChange={(e) => setField("dresscode", e.target.value)} placeholder="Formal · tonos tierra" /></div>
                  <div className="field"><label>Cómo nos gustaría que te vistieras</label><textarea className="inp area" value={f.dresscode_notas} onChange={(e) => setField("dresscode_notas", e.target.value)} placeholder="Nos encantaría ver tonos tierra, crema y nude." /><p className="hint" style={{ margin: "6px 0 0" }}>Formato: <code>_cursiva_</code>, <code>**negrita**</code>, <code>* viñeta</code> al inicio de línea, <code>## subtítulo</code>.</p></div>
                  <label className="hint" style={{ fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-faint)", display: "block", marginBottom: 8 }}>Fotos de inspiración (máx. 6)</label>
                  {f.dresscode_fotos.length > 0 && (
                    <div className="photo-grid dc">
                      {f.dresscode_fotos.map((url: string, i: number) => (
                        <div className="photo-thumb" key={i}><img src={url} alt="" /><button className="rm" onClick={() => setF((p: any) => ({ ...p, dresscode_fotos: p.dresscode_fotos.filter((_: any, j: number) => j !== i) }))}>×</button></div>
                      ))}
                    </div>
                  )}
                  {f.dresscode_fotos.length < 6 && (
                    <>
                      <input ref={(el) => { fileRefs.current.dc = el; }} type="file" accept="image/*" onChange={onDresscode} style={{ display: "none" }} />
                      <div className="dropzone" onClick={() => pick("dc")}><div className="dz-main">+ Agregar foto</div></div>
                    </>
                  )}
                </div>

                <div className="ecard">
                  <div className="ecard-h">{esBoda ? "Su historia" : "Mensaje"}</div>
                  <div className="field" style={{ marginBottom: 0 }}><label>{esBoda ? "Cuéntales a sus invitados cómo se conocieron" : "Un mensaje que verán tus invitados"}</label><textarea className="inp area" value={f.historia} onChange={(e) => setField("historia", e.target.value)} placeholder={campoHist?.placeholder || "Nos conocimos en Antigua hace seis años…"} /></div>
                </div>

                <div className="ecard">
                  <div className="ecard-h">Detalles especiales</div>
                  <div className="field"><label>Canción favorita</label><input className="inp" value={f.musica} onChange={(e) => setField("musica", e.target.value)} placeholder="Perfect — Ed Sheeran" /></div>
                  <div className="field"><label>{esBoda ? "Hashtag de la boda" : "Hashtag del evento"}</label><input className="inp" value={f.hashtag} onChange={(e) => setField("hashtag", e.target.value)} placeholder="#MaríayJosé2026" /></div>
                  <div className="field"><label>Link para compartir fotos</label><input className="inp" value={f.fotos_url} onChange={(e) => setField("fotos_url", e.target.value)} placeholder="https://photos.app.goo.gl/... (álbum compartido)" /><p className="hint" style={{ margin: "6px 0 0" }}>Un álbum compartido (Google Fotos, Drive…) para que tus invitados suban y vean fotos.</p></div>
                  <div className="field" style={{ marginBottom: 0 }}><label>Mensaje de agradecimiento a quienes regalan</label><p className="hint">Aparece tras hacer un regalo. Si lo dejas vacío, usamos uno por defecto.</p><textarea className="inp area" style={{ minHeight: 72 }} value={f.mensaje_gracias} onChange={(e) => setField("mensaje_gracias", e.target.value)} placeholder="Con todo nuestro amor, gracias por ser parte de este momento." /></div>
                </div>

                <button className="btn btn-pink btn-sm" onClick={saveInfo} disabled={savingPane === "info"}>{saveLabel("info", "Guardar información")}</button>
              </Pane>
            )}

            {/* DISEÑO */}
            {pane === "diseno" && (
              <Pane num="ii" title="Diseño" desc="Personaliza el look de tu invitación: foto, paleta y tipografías. Estas opciones son para tu evento —no cambian la marca wedo.">
                {iaEnabled && <div className="ecard">
                  <div className="ecard-h">✨ Diseñador IA</div>
                  <p className="hint">Escribe el tema de tu {evtType.label.toLowerCase()} (ej. “dinosaurios”, “safari tonos tierra”) y la IA propone paleta, tipografía, frase y foto de portada.</p>
                  <div className="frow" style={{ alignItems: "flex-end" }}>
                    <div className="field grow" style={{ marginBottom: 0 }}><label>Tema</label><input className="inp" value={iaTema} onChange={(e) => setIaTema(e.target.value)} placeholder="Dinosaurios, jardín encantado, safari…" /></div>
                    <button className="btn btn-ghost btn-sm" style={{ marginBottom: 2 }} onClick={() => generarIAEditor(false)} disabled={ia.loading || !iaTema.trim() || ia.restantes === 0}>
                      {ia.loading ? <><span className="ob-ia-spin" aria-hidden="true" /> Diseñando…</> : "✨ Generar diseño"}
                    </button>
                  </div>
                  {ia.restantes === 0 && !ia.diseno && <p className="hint" style={{ margin: "8px 0 0" }}>Ya usaste tus 3 diseños con IA para este evento. Puedes ajustar todo a mano aquí en Diseño.</p>}
                  {ia.error && (
                    <p className="hint" style={{ margin: "8px 0 0", color: "var(--coral)" }}>
                      {ia.error}{" "}
                      {ia.restantes !== 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => generarIAEditor(false)} disabled={ia.loading}>Reintentar</button>}
                    </p>
                  )}
                  {ia.diseno && (
                    <DisenoIAPreview diseno={ia.diseno}>
                      <button className={"btn btn-sm " + (ia.aplicado ? "btn-ghost" : "btn-pink")} onClick={aplicarDisenoIA} disabled={ia.aplicado || savingPane === "diseno"}>
                        {ia.aplicado ? "✓ Diseño aplicado" : "Usar este diseño"}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => generarIAEditor(true)} disabled={ia.loading || ia.restantes === 0} title={ia.restantes === 0 ? "Ya usaste tus 3 diseños con IA" : undefined}>
                        {ia.loading ? <><span className="ob-ia-spin" aria-hidden="true" /> Diseñando…</> : "Regenerar"}
                      </button>
                      {ia.restantes != null && (
                        <span className="hint" style={{ margin: 0 }}>
                          {ia.restantes === 0 ? "Sin generaciones disponibles" : `${ia.restantes} ${ia.restantes === 1 ? "generación disponible" : "generaciones disponibles"}`}
                        </span>
                      )}
                      {ia.aplicado && (
                        <span className="hint" style={{ margin: 0, flexBasis: "100%" }}>Puedes ajustar colores, tipografía y foto cuando quieras aquí en Diseño.</span>
                      )}
                    </DisenoIAPreview>
                  )}
                </div>}

                <div className="ecard">
                  <div className="ecard-h">Foto de portada</div>
                  <input ref={(el) => { fileRefs.current.hero = el; }} type="file" accept="image/*" onChange={onHero} style={{ display: "none" }} />
                  {f.foto_hero ? (
                    <div>
                      <img src={f.foto_hero} alt="" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 10, marginBottom: 8 }} />
                      <button className="btn btn-ghost btn-sm" onClick={() => pick("hero")}>Cambiar foto</button>
                    </div>
                  ) : (
                    <div className="dropzone big" onClick={() => pick("hero")}><div className="dz-ico">📷</div><div className="dz-main">Subir foto de portada</div><div className="dz-sub">Recomendado: 1600×900px</div></div>
                  )}
                </div>

                <div className="ecard">
                  <div className="ecard-h">Paleta de color</div>
                  <select className="inp" value={f.paleta} onChange={(e) => {
                    const id = e.target.value;
                    if (id === "personalizado") { setField("paleta", "personalizado"); return; }
                    const pal = PALETAS.find((p) => p.id === id);
                    if (pal) setF((p: any) => ({ ...p, paleta: id, color_acento: pal.accent, color_fondo: pal.bg, color_superficie: "#FFFFFF", paleta_colores: pal.dots }));
                  }}>
                    <optgroup label="wedo. — paletas de marca">
                      {PALETAS.slice(0, 5).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </optgroup>
                    <optgroup label="Clásicas">
                      {PALETAS.slice(5).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </optgroup>
                    <option value="personalizado">Personalizado — elige tus colores</option>
                  </select>
                  {palObj && f.paleta !== "personalizado" && (
                    <div className="pal-preview" style={{ background: palObj.bg }}>
                      <span className="pal-dots">{palObj.dots.map((d, i) => <span key={i} style={{ background: d }} />)}</span>
                      <span className="pname">{palObj.nombre}</span>
                      <span className="pacc" style={{ background: palObj.accent }} />
                    </div>
                  )}
                  <p className="hint" style={{ margin: "10px 0 0" }}>Las paletas de marca usan crema, tinta y los acentos de wedo. Las clásicas son para un look más tradicional.</p>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-faint)", margin: "16px 0 12px" }}>{f.paleta === "personalizado" ? "Tus colores" : "Ajuste fino de colores"}</div>
                  {[
                    { l: "Color principal", d: "Nombres, botones, acentos y líneas" },
                    { l: "Color 2", d: "RSVP y la 2ª tarjeta de detalles" },
                    { l: "Color 3", d: "Encabezado de detalles y la 3ª tarjeta" },
                    { l: "Color 4", d: "La 4ª tarjeta de detalles y swatches" },
                  ].map(({ l, d }, i) => (
                    <div className="color-row" key={i}>
                      <input type="color" value={(f.paleta_colores && f.paleta_colores[i]) || "#E84B8A"} onChange={(e) => setF((p: any) => {
                        const cols = [...(p.paleta_colores || ["#E84B8A", "#87A6E8", "#B3C24A", "#EE5A28"])];
                        cols[i] = e.target.value;
                        return { ...p, paleta_colores: cols, paleta: "personalizado", ...(i === 0 ? { color_acento: e.target.value } : {}) };
                      })} />
                      <div className="crinfo"><div className="crlabel">{l}</div><div className="crdesc">{d}</div></div>
                      <span className="crhex">{(f.paleta_colores && f.paleta_colores[i]) || ""}</span>
                    </div>
                  ))}
                </div>

                <div className="ecard">
                  <div className="ecard-h">Tipografía</div>
                  <FontSelect label="Título principal (tus nombres)" value={f.tipografia} onChange={(v) => setField("tipografia", v)} />
                  <FontSelect label="Títulos de secciones y regalos" value={f.tipografia_titulos} onChange={(v) => setField("tipografia_titulos", v)} />
                  <p className="hint" style={{ marginTop: 4 }}>Más de 40 tipografías, incluyendo scripts caligráficos (Pinyon, Allura, Parisienne…).</p>
                </div>

                <div className="ecard">
                  <div className="ecard-h">Oscuridad de la portada</div>
                  <div className="slider-row"><span>Claro</span><input className="slider" type="range" min={0} max={95} value={f.hero_oscuridad} onChange={(e) => setField("hero_oscuridad", parseInt(e.target.value))} /><span>Oscuro</span></div>
                </div>

                <div className="ecard">
                  <div className="ecard-h">Estilo de portada</div>
                  <p className="hint">Cómo se compone la portada con tus nombres, fecha y foto.</p>
                  <div className="cover-grid">
                    {COVER_STYLES.map((c) => (
                      <div key={c.id} className={"cover-opt" + (f.estilo_portada === c.id ? " sel" : "")} onClick={() => setField("estilo_portada", c.id)}>
                        <span style={{ fontFamily: ff(f.tipografia), fontSize: c.id === "fecha" ? 22 : 24, color: "var(--ink)" }}>
                          {c.id === "minimalista" ? "M · J" : c.id === "fecha" ? "15·02" : c.id === "editorial" ? <em>{f.frase_portada || evtType.frasePortada}</em> : "M & J"}
                        </span>
                        <span className="ttl">{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ecard">
                  <div className="ecard-h">Animaciones</div>
                  <p className="hint">El estilo de las microanimaciones al abrir y navegar tu invitación.</p>
                  <div className="gtypes" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {ANIM_STYLES.map((a) => (
                      <div key={a.id} className={"gtype" + (f.animaciones_estilo === a.id ? " sel" : "")} onClick={() => setField("animaciones_estilo", a.id)}>
                        <div className="tt">{a.tt}</div><div className="td">{a.td}</div>
                      </div>
                    ))}
                  </div>
                  <div className="toggle-row" style={{ marginTop: 16 }}><button className={"switch" + (f.petalos ? "" : " off")} onClick={() => setField("petalos", !f.petalos)} />Lluvia de pétalos en la portada</div>
                  <div className="toggle-row" style={{ marginTop: 10 }}><button className={"switch" + (f.confeti_regalo ? "" : " off")} onClick={() => setField("confeti_regalo", !f.confeti_regalo)} />Confeti al hacer un regalo</div>
                </div>

                <div className="ecard">
                  <div className="ecard-h">Save the Date</div>
                  <p className="hint">Pantalla aparte para enviar <strong>antes</strong> de la invitación formal (cuenta regresiva + agregar al calendario). Elige el estilo:</p>
                  <div className="cover-grid">
                    {[
                      { id: "a", label: "Foto", prev: <em>{f.nombre1 || "Andrea"} & {f.nombre2 || "Diego"}</em> },
                      { id: "b", label: "Editorial", prev: <em>Save the date</em> },
                      { id: "c", label: "Letterpress", prev: "TO BE · WED" },
                    ].map((s) => (
                      <div key={s.id} className={"cover-opt" + (f.std_estilo === s.id ? " sel" : "")} onClick={() => setField("std_estilo", s.id)}>
                        <span style={{ fontFamily: ff(f.tipografia), fontSize: 15, color: "var(--ink)" }}>{s.prev}</span>
                        <span className="ttl">{s.label}</span>
                      </div>
                    ))}
                  </div>
                  {pareja?.slug && (
                    <a className="btn btn-ghost btn-sm" href={`/std/${pareja.slug}`} target="_blank" rel="noreferrer" style={{ marginTop: 12, display: "inline-flex" }}>Ver / compartir Save the Date ↗</a>
                  )}
                  <p className="hint" style={{ margin: "8px 0 0" }}>Link para compartir: wedo.gifts/std/{pareja?.slug || "tu-evento"}</p>
                </div>

                <button className="btn btn-pink btn-sm" onClick={saveDiseno} disabled={savingPane === "diseno"}>{saveLabel("diseno", "Guardar diseño")}</button>
              </Pane>
            )}

            {/* REGALOS */}
            {pane === "regalos" && (
              <>
                <div className="epanel-head">
                  <div>
                    <span className="kick"><span className="bdot" />Sección iii</span>
                    <h2 style={{ marginTop: 10 }}>Lista de regalos</h2>
                    <p>Los invitados verán estos regalos en tu página. El dinero llega a tu cuenta en quetzales y tú decides cómo usarlo.</p>
                  </div>
                  {!showGiftForm && <button className="btn btn-pink btn-sm" onClick={openNewGift}>+ Agregar</button>}
                </div>

                {showGiftForm && (
                  <div className="gform">
                    <div style={{ fontFamily: "'Instrument Serif',serif", fontStyle: "italic", fontSize: 22, marginBottom: 14 }}>{editingGift ? "Editar regalo" : "Nuevo regalo"}</div>
                    <div className="field"><label>Nombre *</label><input className="inp" value={gForm.nombre} onChange={(e) => setGForm((p: any) => ({ ...p, nombre: e.target.value }))} placeholder={esBoda ? "Luna de miel, Noche de bodas…" : "Un viaje, una cuenta de ahorros…"} /></div>
                    <div className="field"><label>Descripción corta</label><input className="inp" value={gForm.descripcion} onChange={(e) => setGForm((p: any) => ({ ...p, descripcion: e.target.value }))} placeholder="Una frase inspiradora" /></div>
                    <div className="field"><label>¿Por qué es especial?</label><textarea className="inp area" style={{ minHeight: 70 }} value={gForm.historia} onChange={(e) => setGForm((p: any) => ({ ...p, historia: e.target.value }))} placeholder="Ayúdanos a empezar nuestra vida juntos…" /></div>
                    <div className="field"><label>Tipo de regalo</label></div>
                    <div className="gtypes" style={{ marginTop: -6 }}>
                      <div className={"gtype" + (gForm.modo === "libre" ? " sel" : "")} onClick={() => setGForm((p: any) => ({ ...p, modo: "libre" }))}><div className="tt">Contribución libre</div><div className="td">Los invitados eligen el monto con chips personalizados</div></div>
                      <div className={"gtype" + (gForm.modo === "completo" ? " sel" : "")} onClick={() => setGForm((p: any) => ({ ...p, modo: "completo" }))}><div className="tt">Regalo completo</div><div className="td">Un precio fijo, se marca como "Ya regalado" al comprarse</div></div>
                    </div>
                    <div className="field"><label>{gForm.modo === "completo" ? "Precio en Quetzales *" : "Meta en Quetzales (opcional)"}</label><div className="qwrap"><span className="qsign">Q</span><input className="inp with-q" type="number" value={gForm.meta} onChange={(e) => setGForm((p: any) => ({ ...p, meta: e.target.value }))} placeholder="12000" /></div></div>
                    <div className="field"><label>Cantidad</label><input className="inp" type="number" min={1} max={99} value={gForm.cantidad} onChange={(e) => setGForm((p: any) => ({ ...p, cantidad: e.target.value }))} placeholder="1" /><p className="hint" style={{ margin: "6px 0 0" }}>¿Cuántas veces se puede regalar? Ej. 10 cenitas. {gForm.modo === "completo" ? "Se marca “Ya regalado” al completarse todas." : "La meta total será precio × cantidad."}</p></div>
                    {gForm.modo === "libre" && (
                      <>
                        <div className="field"><label>Chips de monto</label></div>
                        <div className="chips" style={{ marginTop: -6 }}>
                          {gForm.chips.map((c: number) => <span className="chip-amt" key={c}>Q{c.toLocaleString()}<span className="x" onClick={() => setGForm((p: any) => ({ ...p, chips: p.chips.filter((x: number) => x !== c) }))}>×</span></span>)}
                        </div>
                        <div className="field" style={{ flexDirection: "row", gap: 8, alignItems: "stretch" }}>
                          <input className="inp" type="number" value={gForm.nuevoChip} onChange={(e) => setGForm((p: any) => ({ ...p, nuevoChip: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addChip()} placeholder="Otro monto (ej. 150)" />
                          <button className="btn btn-ghost btn-sm" type="button" onClick={addChip}>+ Agregar</button>
                        </div>
                      </>
                    )}
                    {gForm.modo === "libre" && (
                      <div className="toggle-row" style={{ marginBottom: 14 }}><button type="button" className={"switch" + (gForm.mostrar_progreso === false ? " off" : "")} onClick={() => setGForm((p: any) => ({ ...p, mostrar_progreso: !(p.mostrar_progreso !== false) }))} />Mostrar el % recaudado en la invitación</div>
                    )}
                    <div className="field" style={{ marginBottom: 8 }}><label>Foto</label></div>
                    <input ref={(el) => { fileRefs.current.gift = el; }} type="file" accept="image/*" onChange={onGiftFoto} style={{ display: "none" }} />
                    {gForm.foto ? (
                      <div style={{ marginBottom: 8 }}><img src={gForm.foto} alt="" style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 10, marginBottom: 6 }} /><button className="btn btn-ghost btn-sm" onClick={() => pick("gift")}>Cambiar foto</button></div>
                    ) : (
                      <div className="dropzone" onClick={() => pick("gift")} style={{ marginBottom: 4 }}><div className="dz-main">📷 Subir foto</div></div>
                    )}
                    <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setShowGiftForm(false); setEditingGift(null); }}>Cancelar</button>
                      <button className="btn btn-pink btn-sm" onClick={saveGift} disabled={savingGift || !gForm.nombre}>{savingGift ? "Guardando…" : editingGift ? "Guardar cambios" : "Crear regalo"}</button>
                    </div>
                  </div>
                )}

                {fondos.length === 0 && !showGiftForm ? (
                  <div className="empty-note">Aún no tienes regalos. <a onClick={openNewGift} style={{ cursor: "pointer" }}>Crear el primero →</a></div>
                ) : (
                  <div>
                    {fondos.map((g, i) => (
                      <div className={`gift g${(i % 3) + 1}`} key={g.id}>
                        <div className="gico">{(g.nombre || "?").charAt(0).toLowerCase()}</div>
                        <div className="gbody">
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span className="gname">{g.nombre}</span>
                            <span className={"gbadge " + (g.modo === "completo" ? "completo" : "libre")}>{g.modo === "completo" ? "Regalo completo" : "Libre"}</span>
                            {g.tomado && <span className="gbadge tomado">Ya regalado</span>}
                          </div>
                          <div className="gmeta">{g.meta > 0 ? `Meta ${fmtMoney(g.meta)}` : "Sin meta fija"} · Recaudado <strong style={{ color: accent }}>{fmtMoney(g.recaudado)}</strong></div>
                        </div>
                        <div className="gright">
                          <span className="gedit" onClick={() => openEditGift(g)}>Editar</span>
                          <span className="gdel" onClick={() => deleteGift(g.id)}>Eliminar</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* INVITACIÓN */}
            {pane === "invitacion" && (
              <Pane num="iv" title="Invitación digital" desc="Sube tu invitación como imagen o PDF para que tus invitados la vean en tu página.">
                <div className="ecard">
                  <input ref={(el) => { fileRefs.current.inv = el; }} type="file" accept="image/*,.pdf" onChange={onInvitacion} style={{ display: "none" }} />
                  {f.invitacion_url ? (
                    <div>
                      {f.invitacion_url.includes(".pdf")
                        ? <div className="dropzone" style={{ cursor: "default" }}><div className="dz-ico">📄</div><div className="dz-main">Invitación PDF subida</div><a href={f.invitacion_url} target="_blank" rel="noreferrer" style={{ color: "var(--pink)", fontWeight: 600, fontSize: 12 }}>Ver PDF →</a></div>
                        : <img src={f.invitacion_url} alt="" style={{ width: "100%", borderRadius: 10, marginBottom: 10 }} />}
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => pick("inv")}>Cambiar invitación</button>
                    </div>
                  ) : (
                    <div className="dropzone big" onClick={() => pick("inv")}><div className="dz-ico">💌</div><div className="dz-main">Subir invitación</div><div className="dz-sub">Imagen JPG, PNG o PDF</div></div>
                  )}
                </div>
                <button className="btn btn-pink btn-sm" onClick={saveInvitacion} disabled={savingPane === "invitacion"}>{saveLabel("invitacion", "Guardar invitación")}</button>
              </Pane>
            )}

            {/* INVITADOS */}
            {pane === "invitados" && (
              <>
                <div className="epanel-head">
                  <div>
                    <span className="kick"><span className="bdot" />Sección v</span>
                    <h2 style={{ marginTop: 10 }}>Lista de invitados</h2>
                    <p>Agrega a tus invitados con los asientos que les asignas y mira quién confirma.</p>
                  </div>
                  {!showGuestForm && !editGuest && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {invitados.length > 0 && <button className="btn btn-ghost btn-sm" onClick={descargarLinks}>⬇ Links y mensajes</button>}
                      <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
                        {importando ? "Importando…" : "⬆ Importar Excel"}
                        <input type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} disabled={importando}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) importarExcel(f); e.target.value = ""; }} />
                      </label>
                      <button className="btn btn-pink btn-sm" onClick={() => setShowGuestForm(true)}>+ Agregar</button>
                    </div>
                  )}
                </div>
                {importMsg && <p className="hint" style={{ margin: "-6px 0 10px" }}>{importMsg}</p>}
                {invitados.length > 0 && (
                  <input
                    value={guestQ}
                    onChange={(e) => setGuestQ(e.target.value)}
                    placeholder="🔍 Buscar invitado por nombre…"
                    style={{ width: "100%", maxWidth: 360, border: "1.5px solid var(--line)", borderRadius: 100, padding: "10px 16px", fontFamily: "'Archivo',sans-serif", fontSize: 14, background: "#fffdf8", color: "var(--ink)", outline: "none", marginBottom: 14, display: "block" }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--pink)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
                  />
                )}
                {invitados.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                    {([
                      ["todos", `Todos · ${invitados.length}`],
                      ["si", `Confirmados · ${nConfirmados}`],
                      ["no", `No podrán · ${nNoPodran}`],
                      ["pend", `Sin responder · ${nPendientesInv}`],
                    ] as const).map(([k, label]) => (
                      <button key={k} onClick={() => setGuestFiltro(k)}
                        style={{
                          padding: "6px 13px", borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          border: "1px solid " + (guestFiltro === k ? "var(--ink)" : "var(--line)"),
                          background: guestFiltro === k ? "var(--ink)" : "#fffdf8",
                          color: guestFiltro === k ? "#fff" : "var(--ink-soft)",
                          fontFamily: "'Archivo',sans-serif", whiteSpace: "nowrap",
                        }}>{label}</button>
                    ))}
                  </div>
                )}

                <div className="ecard" style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>Código de acceso para RSVP</div>
                      <div className="hint" style={{ margin: "2px 0 0" }}>{rsvpCodigo ? "Activo · Los invitados necesitarán su código para confirmar." : "Opcional · Los invitados confirman sin código."}</div>
                    </div>
                    <button className={"switch" + (rsvpCodigo ? "" : " off")} onClick={toggleRsvpCodigo} />
                  </div>
                  {rsvpCodigo && invitados.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="hint" style={{ margin: 0 }}>{invitados.filter((i) => i.codigo).length} de {invitados.length} invitados con código</span>
                      <button className="btn btn-ghost btn-sm" onClick={generateAllCodes} disabled={invitados.every((i) => i.codigo)}>Generar para todos</button>
                    </div>
                  )}
                </div>

                {showGuestForm && (
                  <div className="gform">
                    <div style={{ fontFamily: "'Instrument Serif',serif", fontStyle: "italic", fontSize: 22, marginBottom: 14 }}>Nuevo invitado</div>
                    <div className="field"><label>Nombre *</label><input className="inp" value={guestForm.nombre} onChange={(e) => setGuestForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Familia García" /></div>
                    <div className="frow">
                      <div className="field grow"><label>Asientos</label><input className="inp" type="number" min={1} max={20} value={guestForm.asientos} onChange={(e) => setGuestForm((p) => ({ ...p, asientos: e.target.value }))} /></div>
                      <div className="field grow"><label>Grupo (opcional)</label><input className="inp" value={guestForm.grupo} onChange={(e) => setGuestForm((p) => ({ ...p, grupo: e.target.value }))} placeholder="Familia, Amigos…" /></div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setShowGuestForm(false); setGuestForm({ nombre: "", asientos: "1", grupo: "" }); }}>Cancelar</button>
                      <button className="btn btn-pink btn-sm" onClick={addGuest} disabled={savingGuest || !guestForm.nombre.trim()}>{savingGuest ? "Guardando…" : "Agregar"}</button>
                    </div>
                  </div>
                )}

                {confGuest && (
                  <div className="gform">
                    <div style={{ fontFamily: "'Instrument Serif',serif", fontStyle: "italic", fontSize: 22, marginBottom: 4 }}>Confirmación manual · {confGuest.nombre}</div>
                    <p className="hint" style={{ margin: "0 0 14px" }}>Marca quiénes asisten (el principal, el grupo o el +1) y guarda. Queda registrada como confirmación manual.</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                      {(confGuest.miembros || []).map((m: any, i: number) => (
                        <button key={m.token} type="button"
                          onClick={() => setConfSel((sel) => ({ ...sel, [m.token]: !sel[m.token] }))}
                          className="btn btn-sm"
                          style={{
                            border: "1.5px solid " + (confSel[m.token] ? "var(--pink)" : "var(--line)"),
                            background: confSel[m.token] ? "#fbe9f1" : "#fffdf8",
                            color: confSel[m.token] ? "var(--pink)" : "var(--ink-soft)",
                            fontWeight: 600,
                          }}>
                          {confSel[m.token] ? "✓ " : ""}{m.nombre || `+1 (por nombrar)`}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setConfGuest(null)}>Cancelar</button>
                      <button className="btn btn-pink btn-sm" disabled={confGuardando || !Object.values(confSel).some(Boolean)} onClick={() => guardarConfirmacion("si")}>{confGuardando ? "Guardando…" : "Confirmar asistencia"}</button>
                      <button className="btn btn-ghost btn-sm" disabled={confGuardando} onClick={() => guardarConfirmacion("no")}>No podrán ir</button>
                      {rsvps.some((r: any) => r.invitado_id === confGuest.id) && (
                        <button className="btn btn-ghost btn-sm" disabled={confGuardando} onClick={quitarConfirmacion} style={{ color: "var(--coral)" }}>Quitar confirmación</button>
                      )}
                    </div>
                  </div>
                )}

                {editGuest && (
                  <div className="gform">
                    <div style={{ fontFamily: "'Instrument Serif',serif", fontStyle: "italic", fontSize: 22, marginBottom: 4 }}>Editar invitación</div>
                    <p className="hint" style={{ margin: "0 0 14px" }}>Los links ya repartidos no cambian. Deja un nombre vacío para un +1 (su invitado lo nombra al confirmar).</p>
                    <div className="field"><label>Invitado principal *</label><input className="inp" value={egNombre} onChange={(e) => setEgNombre(e.target.value)} /></div>
                    <div className="field"><label>Acompañantes</label>
                      {egMiembros.slice(1).map((m: any, k: number) => (
                        <div key={m.token} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                          <input className="inp" style={{ flex: 1 }} value={m.nombre} placeholder="+1 por nombrar…"
                            onChange={(e) => setEgMiembros((arr) => arr.map((x, j) => (j === k + 1 ? { ...x, nombre: e.target.value } : x)))} />
                          <button className="btn btn-ghost btn-sm" style={{ padding: "4px 12px" }} title="Quitar"
                            onClick={() => setEgMiembros((arr) => arr.filter((_, j) => j !== k + 1))}>✕</button>
                        </div>
                      ))}
                      <button className="btn btn-ghost btn-sm" onClick={() => setEgMiembros((arr) => [...arr, { nombre: "", token: `acompanante-${slugifyTok(egNombre.split(" ")[0] || "invitado")}-${rand4()}`, _nuevo: true }])}>+ Agregar acompañante</button>
                    </div>
                    {invitados.filter((x: any) => x.id !== editGuest.id && !x.confirmado && !egAbsorbidas.includes(x.id)).length > 0 && (
                      <div className="field">
                        <label>Unir otra invitación a este grupo</label>
                        <select className="inp" value="" onChange={(e) => { if (e.target.value) unirInvitacion(e.target.value); }}>
                          <option value="">Elegir invitación…</option>
                          {invitados.filter((x: any) => x.id !== editGuest.id && !x.confirmado && !egAbsorbidas.includes(x.id)).map((x: any) => (
                            <option key={x.id} value={x.id}>{x.nombre} ({x.asientos} {x.asientos === 1 ? "asiento" : "asientos"})</option>
                          ))}
                        </select>
                        <p className="hint" style={{ margin: "6px 0 0" }}>Sus miembros pasan a este grupo con sus mismos links; la invitación original se elimina al guardar.</p>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditGuest(null)}>Cancelar</button>
                      <button className="btn btn-pink btn-sm" onClick={saveEditGuest} disabled={savingEdit || !egNombre.trim()}>{savingEdit ? "Guardando…" : "Guardar cambios"}</button>
                    </div>
                  </div>
                )}

                {invitados.length > 0 && (
                  <div className="istats">
                    <div className="istat i1"><div className="iv">{invitados.length}</div><div className="il">Invitaciones</div></div>
                    <div className="istat i2"><div className="iv">{totalAsientos}</div><div className="il">Asientos</div></div>
                    <div className="istat i3"><div className="iv" style={{ color: "#7e8a30" }}>{confSi}</div><div className="il">Asisten</div></div>
                    <div className="istat i4"><div className="iv" style={{ color: "var(--ink-faint)" }}>{confNo}</div><div className="il">No asisten</div></div>
                  </div>
                )}

                {(gq || guestFiltro !== "todos") && invitadosVisibles.length === 0 && (
                  <p className="hint" style={{ margin: 0 }}>{gq ? `Sin resultados para “${guestQ}”.` : "Nadie en este filtro todavía."}</p>
                )}
                {invitados.length === 0 && !showGuestForm ? (
                  <div className="empty-note">Aún no tienes invitados. <a onClick={() => setShowGuestForm(true)} style={{ cursor: "pointer" }}>Agregar el primero →</a></div>
                ) : (
                  Object.entries(grupos).map(([grupo, invs]) => (
                    <div key={grupo}>
                      {Object.keys(grupos).length > 1 && <div className="grupo-label">{grupo}</div>}
                      {invs.map((inv: any) => {
                        const rsvp = rsvps.find((r) => r.invitado_id === inv.id);
                        const editing = editCodeId === inv.id;
                        return (
                          <div className={"guest" + (rsvpCodigo || (Array.isArray(inv.miembros) && inv.miembros.some((m: any) => m.nombre)) ? " has-code" : "")} key={inv.id}>
                            <div className="gi" style={{ background: rsvp?.asistencia === "si" ? "var(--lime)" : rsvp?.asistencia === "no" ? "var(--coral)" : "var(--peri)" }}>{inv.nombre.charAt(0).toUpperCase()}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="gn">{inv.nombre}</div>
                              <div className="gm">{inv.asientos} {inv.asientos === 1 ? "asiento" : "asientos"}{rsvp ? ` · ${(rsvp.acompanantes || 0) + 1} confirman` : " · pendiente"}</div>
                              {Array.isArray(inv.miembros) && inv.miembros.length > 1 && (() => {
                                const nombrados = inv.miembros.filter((m: any) => m.nombre).map((m: any) => m.nombre);
                                const sinNombre = inv.miembros.length - nombrados.length;
                                return (
                                  <div className="gm" style={{ opacity: .8 }}>
                                    {nombrados.join(" · ")}{sinNombre > 0 ? `${nombrados.length ? " · " : ""}${sinNombre} por nombrar` : ""}
                                  </div>
                                );
                              })()}
                            </div>
                            <span className="gs" style={{ color: rsvp?.asistencia === "si" ? "#7e8a30" : rsvp?.asistencia === "no" ? "var(--coral)" : "var(--peri)" }}>{rsvp ? (rsvp.asistencia === "si" ? "✓ Asiste" : "✕ No asiste") : "Pendiente"}</span>
                            <button className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }} onClick={() => abrirConfirmar(inv)}>{rsvp ? "✓ RSVP" : "Confirmar"}</button>
                            <button className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }} onClick={() => openEditGuest(inv)}>Editar</button>
                            <button className="gx" onClick={() => deleteGuest(inv.id)}>✕</button>
                            {Array.isArray(inv.miembros) && inv.miembros.some((m: any) => m.nombre) && (
                              <div className="codebar" style={{ flexWrap: "wrap" }}>
                                <span>Links únicos</span>
                                {/* solo personas con nombre: el +1 no tiene link, lo confirma el principal */}
                                {inv.miembros.filter((m: any) => m.nombre).map((m: any) => (
                                  <button
                                    key={m.token}
                                    className="btn btn-ghost btn-sm"
                                    style={{ padding: "4px 10px", textTransform: "none", letterSpacing: 0 }}
                                    title="Copiar link personalizado"
                                    onClick={() => {
                                      const url = `https://wedo.gifts/boda/${pareja?.slug}?i=${m.token}`;
                                      navigator.clipboard?.writeText(url).then(() => {
                                        setCopiadoToken(m.token);
                                        setTimeout(() => setCopiadoToken(""), 1600);
                                      });
                                    }}
                                  >
                                    {copiadoToken === m.token ? "✓ Copiado" : `⧉ ${m.nombre.split(" ")[0]}`}
                                  </button>
                                ))}
                              </div>
                            )}
                            {rsvpCodigo && (
                              <div className="codebar">
                                <span>Código</span>
                                {editing ? (
                                  <>
                                    <input className="codeinp" value={codeVal} onChange={(e) => setCodeVal(e.target.value.toUpperCase().slice(0, 8))} placeholder="ABC123" />
                                    <button className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }} onClick={() => setCodeVal(genCode())}>Generar</button>
                                    <button className="btn btn-pink btn-sm" style={{ padding: "4px 10px" }} onClick={() => saveCode(inv.id)}>Guardar</button>
                                    <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }} onClick={() => setEditCodeId(null)}>✕</button>
                                  </>
                                ) : (
                                  <>
                                    {inv.codigo ? <span className="code">{inv.codigo}</span> : <span style={{ fontStyle: "italic", textTransform: "none", letterSpacing: 0 }}>Sin código</span>}
                                    <a className="btn btn-ghost btn-sm" style={{ marginLeft: "auto", padding: "4px 10px" }} onClick={() => { setEditCodeId(inv.id); setCodeVal(inv.codigo || ""); }}>{inv.codigo ? "Editar" : "+ Asignar"}</a>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}

                {rsvps.length > 0 && (
                  <div style={{ background: "#e9eecb", border: "1px solid rgba(179,194,74,.4)", borderRadius: 12, padding: "12px 16px", marginTop: 12, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#5f6b1f" }}>
                    {asientosConf} asientos confirmados de {totalAsientos} totales
                  </div>
                )}
              </>
            )}

            {/* SECCIONES */}
            {pane === "secciones" && (
              <Pane num="vi" title="Secciones de tu página" desc="Activa o desactiva secciones y reorganízalas. ⠿ Arrastra para reordenar o usa las flechas.">
                <div className="sec-count"><span className="bdot" />{seccActivas} de {Object.keys(SECCIONES_META).length} secciones activas</div>
                {orden.map((id, i) => {
                  const meta = SECCIONES_META[id]; if (!meta) return null;
                  const active = !!secciones[id];
                  return (
                    <div className={"sec-row" + (active ? "" : " dim")} key={id}
                      draggable onDragStart={() => setDragIndex(i)} onDragOver={(e) => e.preventDefault()}
                      onDrop={() => { if (dragIndex !== null && dragIndex !== i) moveSec(dragIndex, i); setDragIndex(null); }} onDragEnd={() => setDragIndex(null)}>
                      <span className="grip">⠿</span>
                      <span className="sdot" style={{ background: "var(--pink)" }} />
                      <div className="sbody"><div className="stitle">{meta.label}</div><div className="sdesc">{meta.desc}</div></div>
                      <div className="sarrows"><button className="sarrow" onClick={() => moveSec(i, i - 1)}>▲</button><button className="sarrow" onClick={() => moveSec(i, i + 1)}>▼</button></div>
                      <button className={"switch" + (active ? "" : " off")} onClick={() => setSecciones((s) => ({ ...s, [id]: !s[id] }))} />
                    </div>
                  );
                })}
                <button className="btn btn-pink btn-sm" style={{ marginTop: 6 }} onClick={saveSecciones} disabled={savingPane === "secciones"}>{saveLabel("secciones", "Guardar secciones")}</button>
              </Pane>
            )}

          </div>
        </main>

      </div>

      {/* PILL NAV */}
      <nav className="pillnav">
        <Link className="on" href="/editor">Editor<span className="d" /></Link>
        <Link href="/dashboard">Dashboard</Link>
      </nav>
    </div>
  );
}

function Pane({ num, title, desc, children }: { num: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <>
      <div className="epanel-head">
        <div>
          <span className="kick"><span className="bdot" />Sección {num}</span>
          <h2 style={{ marginTop: 10 }}>{title}</h2>
          <p>{desc}</p>
        </div>
      </div>
      {children}
    </>
  );
}
