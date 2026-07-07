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
import { TIPOGRAFIAS } from "../lib/tipografias";
import "../app-ui.css";

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
  historia: { label: "Historia de amor", desc: "Cuéntales cómo se conocieron" },
  detalles: { label: "Detalles del evento", desc: "Hora, ceremonia, recepción, dress code" },
  invitacion: { label: "Invitación digital", desc: "Imagen o PDF de su invitación" },
  rsvp: { label: "Confirmación de asistencia", desc: "Los invitados buscan su nombre y confirman" },
  countdown: { label: "Cuenta regresiva", desc: "Días que faltan para la boda" },
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
    rsvp_fecha_limite: "",
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
  const [gForm, setGForm] = useState<any>({ nombre: "", descripcion: "", historia: "", meta: "", foto: "", modo: "libre", chips: [100, 200, 500, 1000], nuevoChip: "", mostrar_progreso: true });
  const [savingGift, setSavingGift] = useState(false);

  // invitados
  const [invitados, setInvitados] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [rsvpCodigo, setRsvpCodigo] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestForm, setGuestForm] = useState({ nombre: "", asientos: "1", grupo: "" });
  const [savingGuest, setSavingGuest] = useState(false);
  const [editCodeId, setEditCodeId] = useState<string | null>(null);
  const [codeVal, setCodeVal] = useState("");

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: p } = await supabase.from("parejas").select("*").eq("user_id", user.id).single();
    if (!p) { router.push("/onboarding"); return; }
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
      rsvp_fecha_limite: p.rsvp_fecha_limite || "",
      invitacion_url: p.invitacion_url || "",
      frase_portada: p.frase_portada ?? getEventType(p.tipo_evento).frasePortada, estilo_portada: p.estilo_portada || "clasica",
      animaciones_estilo: p.animaciones_estilo || "elegante", petalos: !!p.petalos, confeti_regalo: !!p.confeti_regalo,
      std_estilo: p.std_estilo || "c",
      tipo_evento: p.tipo_evento || "boda",
      detalles_evento: (p.detalles_evento && typeof p.detalles_evento === "object") ? p.detalles_evento : {},
    });
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
    setRsvps(r || []);
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
    frase_portada: f.frase_portada, agenda: f.agenda, rsvp_fecha_limite: f.rsvp_fecha_limite || null,
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
    agenda: f.agenda, rsvp_fecha_limite: f.rsvp_fecha_limite || null, std_estilo: f.std_estilo,
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
  function openNewGift() { setEditingGift(null); setGForm({ nombre: "", descripcion: "", historia: "", meta: "", foto: "", modo: "libre", chips: [100, 200, 500, 1000], nuevoChip: "", mostrar_progreso: true }); setShowGiftForm(true); }
  function openEditGift(g: any) {
    setEditingGift(g);
    setGForm({ nombre: g.nombre || "", descripcion: g.descripcion || "", historia: g.historia || "", meta: g.meta?.toString() || "", foto: g.foto || "", modo: g.modo || "libre", chips: g.chips || [100, 200, 500, 1000], nuevoChip: "", mostrar_progreso: g.mostrar_progreso !== false });
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
    const data = { nombre: gForm.nombre, descripcion: gForm.descripcion, historia: gForm.historia, meta: parseFloat(gForm.meta) || 0, foto: gForm.foto || null, modo: gForm.modo, chips: gForm.chips, mostrar_progreso: gForm.mostrar_progreso !== false };
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
  async function addGuest() {
    if (!guestForm.nombre.trim()) return;
    setSavingGuest(true);
    await supabase.from("invitados").insert({ pareja_id: pareja.id, nombre: guestForm.nombre.trim(), asientos: parseInt(guestForm.asientos) || 1, grupo: guestForm.grupo.trim() || null });
    setGuestForm({ nombre: "", asientos: "1", grupo: "" }); setShowGuestForm(false); setSavingGuest(false);
    const { data: inv } = await supabase.from("invitados").select("*").eq("pareja_id", pareja.id).order("grupo").order("nombre");
    setInvitados(inv || []);
  }
  async function deleteGuest(id: string) {
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
  invitados.forEach((i) => { const g = i.grupo || "Sin grupo"; (grupos[g] = grupos[g] || []).push(i); });
  const seccActivas = Object.keys(SECCIONES_META).filter((k) => secciones[k]).length;
  const completeness = (() => {
    let c = 0; const checks = [f.nombre1 && (!campoN2 || f.nombre2), f.fecha, f.foto_hero, fondos.length > 0, invitados.length > 0]; checks.forEach((x) => x && c++); return Math.round((c / checks.length) * 100);
  })();

  async function logout() { await supabase.auth.signOut(); router.push("/"); }

  if (loading) return <div className="wedo-app"><div className="app-loading">Cargando<span style={{ color: "var(--pink)" }}>.</span></div></div>;

  const saveLabel = (which: Pane, base: string) => savingPane === which ? "Guardando…" : savedPane === which ? "¡Guardado!" : base;

  return (
    <div className="wedo-app">
      {/* TOPBAR */}
      <header className="topbar">
        <div className="wrap topbar-in full">
          <Link className="logo" href="/">wedo<span className="dot">.</span></Link>
          <button className="evt-switch" type="button">
            <span className="tag">Evento</span>
            <span>{f.nombre2 ? `${f.nombre1 || "Tu evento"} & ${f.nombre2}` : (f.nombre1 || "Tu evento")} · {evtType.label}</span>
            <span className="chev">▾</span>
          </button>
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
                  <div className="field" style={{ marginBottom: 0 }}><label>Fecha límite para confirmar (RSVP)</label><input className="inp" type="date" value={f.rsvp_fecha_limite || ""} onChange={(e) => setField("rsvp_fecha_limite", e.target.value)} /><p className="hint" style={{ margin: "6px 0 0" }}>Aparece en Detalles como “Confirma tu asistencia antes de…”. Déjalo vacío para ocultarlo.</p></div>
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
                  <p className="hint" style={{ marginTop: 4 }}>Más de 40 tipografías, incluyendo scripts de boda (Pinyon, Allura, Parisienne…).</p>
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
                    <div className="field"><label>Nombre *</label><input className="inp" value={gForm.nombre} onChange={(e) => setGForm((p: any) => ({ ...p, nombre: e.target.value }))} placeholder="Luna de miel, Noche de bodas…" /></div>
                    <div className="field"><label>Descripción corta</label><input className="inp" value={gForm.descripcion} onChange={(e) => setGForm((p: any) => ({ ...p, descripcion: e.target.value }))} placeholder="Una frase inspiradora" /></div>
                    <div className="field"><label>¿Por qué es especial?</label><textarea className="inp area" style={{ minHeight: 70 }} value={gForm.historia} onChange={(e) => setGForm((p: any) => ({ ...p, historia: e.target.value }))} placeholder="Ayúdanos a empezar nuestra vida juntos…" /></div>
                    <div className="field"><label>Tipo de regalo</label></div>
                    <div className="gtypes" style={{ marginTop: -6 }}>
                      <div className={"gtype" + (gForm.modo === "libre" ? " sel" : "")} onClick={() => setGForm((p: any) => ({ ...p, modo: "libre" }))}><div className="tt">Contribución libre</div><div className="td">Los invitados eligen el monto con chips personalizados</div></div>
                      <div className={"gtype" + (gForm.modo === "completo" ? " sel" : "")} onClick={() => setGForm((p: any) => ({ ...p, modo: "completo" }))}><div className="tt">Regalo completo</div><div className="td">Un precio fijo, se marca como "Ya regalado" al comprarse</div></div>
                    </div>
                    <div className="field"><label>{gForm.modo === "completo" ? "Precio en Quetzales *" : "Meta en Quetzales (opcional)"}</label><div className="qwrap"><span className="qsign">Q</span><input className="inp with-q" type="number" value={gForm.meta} onChange={(e) => setGForm((p: any) => ({ ...p, meta: e.target.value }))} placeholder="12000" /></div></div>
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
                  {!showGuestForm && <button className="btn btn-pink btn-sm" onClick={() => setShowGuestForm(true)}>+ Agregar</button>}
                </div>

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

                {invitados.length > 0 && (
                  <div className="istats">
                    <div className="istat i1"><div className="iv">{invitados.length}</div><div className="il">Invitaciones</div></div>
                    <div className="istat i2"><div className="iv">{totalAsientos}</div><div className="il">Asientos</div></div>
                    <div className="istat i3"><div className="iv" style={{ color: "#7e8a30" }}>{confSi}</div><div className="il">Asisten</div></div>
                    <div className="istat i4"><div className="iv" style={{ color: "var(--ink-faint)" }}>{confNo}</div><div className="il">No asisten</div></div>
                  </div>
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
                          <div className={"guest" + (rsvpCodigo ? " has-code" : "")} key={inv.id}>
                            <div className="gi" style={{ background: rsvp?.asistencia === "si" ? "var(--lime)" : rsvp?.asistencia === "no" ? "var(--coral)" : "var(--peri)" }}>{inv.nombre.charAt(0).toUpperCase()}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="gn">{inv.nombre}</div>
                              <div className="gm">{inv.asientos} {inv.asientos === 1 ? "asiento" : "asientos"}{rsvp ? ` · ${(rsvp.acompanantes || 0) + 1} confirman` : " · pendiente"}</div>
                            </div>
                            <span className="gs" style={{ color: rsvp?.asistencia === "si" ? "#7e8a30" : rsvp?.asistencia === "no" ? "var(--coral)" : "var(--peri)" }}>{rsvp ? (rsvp.asistencia === "si" ? "✓ Asiste" : "✕ No asiste") : "Pendiente"}</span>
                            <button className="gx" onClick={() => deleteGuest(inv.id)}>✕</button>
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
        <Link href="/">Inicio</Link>
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
