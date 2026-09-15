"use client";
/* =====================================================================
   wedo. — app/components/Homepage.tsx
   Layered editorial landing. Styles live in globals.css (class-based).
   Pure brand chrome: Instrument Serif + Archivo, pink dot, cream canvas.
   ===================================================================== */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

/* Invitaciones de muestra del home: fallback estático; al montar se leen
   nombres y fotos reales de la base para reflejar los demos al día. */
const DEMOS_BASE = [
  { slug: "demo", emoji: "💍", tipo: "Boda", nombres: "Sofía & Diego", foto: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80" },
  { slug: "demo-bautizo", emoji: "🕊️", tipo: "Bautizo", nombres: "Emilia", foto: "https://images.unsplash.com/photo-1544126592-807ade215a0b?w=800&q=80" },
  { slug: "demo-cumple", emoji: "🎈", tipo: "Cumple infantil", nombres: "Mateo", foto: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80" },
  { slug: "demo-despedida", emoji: "🥂", tipo: "Despedida", nombres: "Valeria", foto: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80" },
];

export default function Homepage() {
  const heroRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const [demoCards, setDemoCards] = useState(DEMOS_BASE);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("parejas").select("slug,nombre1,nombre2,foto_hero").in("slug", DEMOS_BASE.map((d) => d.slug));
        if (data && data.length) {
          setDemoCards(DEMOS_BASE.map((b) => {
            const r: any = data.find((x: any) => x.slug === b.slug);
            return r ? { ...b, nombres: r.nombre2 ? `${r.nombre1} & ${r.nombre2}` : (r.nombre1 || b.nombres), foto: r.foto_hero || b.foto } : b;
          }));
        }
      } catch { /* se queda el fallback */ }
    })();
  }, []);

  /* sticky nav: subtle shadow once the page is scrolled */
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* confetti on the CTAs + pointer parallax on the hero layers */
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const COLORS = ["#E84B8A", "#87A6E8", "#B3C24A", "#EE5A28", "#F3C9C2"];

    function burst(x: number, y: number) {
      if (reduce) return;
      for (let i = 0; i < 18; i++) {
        const c = document.createElement("div");
        c.className = "confetti";
        c.style.background = COLORS[i % COLORS.length];
        if (i % 3 === 0) { c.style.borderRadius = "50%"; c.style.width = "9px"; c.style.height = "9px"; }
        c.style.left = x + "px";
        c.style.top = y + "px";
        document.body.appendChild(c);
        const ang = Math.PI * (0.15 + Math.random() * 0.7) * -1;
        const spread = (Math.random() - 0.5) * 2.2;
        const dist = 90 + Math.random() * 150;
        const dx = Math.cos(ang) * dist * spread * 1.2;
        const dy = Math.sin(ang) * dist - (40 + Math.random() * 60);
        const rot = Math.random() * 720 - 360;
        const dur = 700 + Math.random() * 600;
        c.animate(
          [
            { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
            { transform: `translate(${dx * 0.6}px,${dy}px) rotate(${rot * 0.6}deg)`, opacity: 1, offset: 0.5 },
            { transform: `translate(${dx}px,${dy + 220}px) rotate(${rot}deg)`, opacity: 0 },
          ],
          { duration: dur, easing: "cubic-bezier(.18,.7,.4,1)", fill: "forwards" }
        );
        setTimeout(() => c.remove(), dur + 60);
      }
    }
    function fire(el: HTMLElement) {
      const r = el.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
    }
    const ctas = Array.from(document.querySelectorAll<HTMLAnchorElement>(".js-cta"));
    const offs: Array<() => void> = [];
    ctas.forEach((el) => {
      let last = 0;
      // Burst the brand confetti, then navigate. The confetti is appended to
      // <body> (outside React), so it keeps animating across the route change
      // before self-removing — the burst stays visible on click.
      const onClick = (e: Event) => {
        const href = el.getAttribute("href");
        if (!href) return;
        e.preventDefault();
        fire(el);
        setTimeout(() => router.push(href), 320);
      };
      const onEnter = () => { const t = Date.now(); if (t - last > 900) { last = t; fire(el); } };
      el.addEventListener("click", onClick);
      el.addEventListener("mouseenter", onEnter);
      offs.push(() => { el.removeEventListener("click", onClick); el.removeEventListener("mouseenter", onEnter); });
    });

    const hero = heroRef.current;
    const layers = hero ? Array.from(hero.querySelectorAll<HTMLElement>("[data-depth]")) : [];
    let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
    const fine = window.matchMedia?.("(pointer:fine)").matches;
    function loop() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      layers.forEach((el) => {
        const d = parseFloat(el.getAttribute("data-depth") || "0");
        el.style.transform = `translate3d(${(cx * d / 60).toFixed(2)}px,${(cy * d / 60).toFixed(2)}px,0)`;
      });
      raf = Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1 ? requestAnimationFrame(loop) : 0;
    }
    function onMove(e: PointerEvent) {
      if (!hero) return;
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      ty = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      if (!raf) raf = requestAnimationFrame(loop);
    }
    function onLeave() { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); }
    if (hero && layers.length && !reduce && fine) {
      hero.addEventListener("pointermove", onMove);
      hero.addEventListener("pointerleave", onLeave);
    }
    return () => {
      offs.forEach((f) => f());
      if (hero) { hero.removeEventListener("pointermove", onMove); hero.removeEventListener("pointerleave", onLeave); }
      if (raf) cancelAnimationFrame(raf);
    };
  }, [router]);

  return (
    <>
      {/* NAV */}
      <header className="nav" ref={headerRef}>
        <div className="wrap nav-in">
          <a className="logo brandmark" href="#top">wedo<span className="dot">.</span></a>
          <nav className="nav-r">
            <a className="link-u hide-sm" href="#funciones">Cómo funciona</a>
            <a className="link-u hide-sm" href="#demos">Demos</a>
            <a className="link-u hide-sm" href="#precio">Precio</a>
            <a className="link-u" href="/login">Iniciar sesión</a>
            <a className="btn btn-ink" href="/login" style={{ padding: "10px 18px", fontSize: 14 }}>Crea tu evento</a>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero" ref={heroRef}>
          <div className="stage">
            <span className="blob b-peri" data-depth="22" aria-hidden="true" />
            <span className="blob b-lima" data-depth="34" aria-hidden="true" />
            <span className="blob b-durazno" data-depth="46" aria-hidden="true" />
            <span className="blob b-coral" data-depth="58" aria-hidden="true" />

            <div className="float fl-invite" data-depth="28">
              <div className="k">Nuestra boda</div>
              <div className="n">María <span className="it">&amp;</span> José</div>
              <div className="d">15 · febrero · 2026</div>
              <div className="lg">wedo<span className="dot">.</span></div>
            </div>
            <div className="float chip chip-money" data-depth="64">
              <span className="ck"><span className="d" style={{ background: "var(--lime)" }} />Recibido</span>
              <span className="cv">Q 12,400</span>
            </div>
            <div className="float chip chip-rsvp" data-depth="76">
              <span className="ck"><span className="d" style={{ background: "var(--peri)" }} />RSVP</span>
              <span className="cv">86 <span className="it" style={{ fontSize: 15, opacity: 0.55 }}>confirmados</span></span>
            </div>

            <div className="stage-inner wrap">
              <span className="eyebrow hero-eyebrow anim d1"><span className="d" />Para bodas y toda celebración · Guatemala</span>

              <h1 className="lema">
                <span className="word w-invita">Invita,</span>
                <span className="word w-celebra">celebra,</span>
                <span className="word w-recibe">recibe</span>
              </h1>

              <div className="hero-foot">
                <div className="hero-cta anim d6">
                  <a className="btn btn-pink js-cta" href="/login">Crea tu evento<span className="dotmini" /></a>
                  <a className="link-u" href="#funciones">Ver cómo funciona</a>
                </div>
                <div className="hero-desc anim d7">
                  <p className="sign">Que empiece con un sí<span className="dot">.</span></p>
                  <p className="sub">Invita, gestiona el RSVP y recibe los regalos en efectivo —en quetzales, directo a tu cuenta. Tú decides cómo usarlo.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FUNCTIONS */}
        <section className="funcs" id="funciones">
          <div className="wrap">
            <div className="funcs-head">
              <h2 className="anim">Todo en un solo lugar<span style={{ color: "var(--pink)", fontStyle: "normal" }}>.</span></h2>
              <span className="eyebrow anim d1"><span className="d" />Tres pasos, una página</span>
            </div>
            <div className="fgrid">
              <article className="fcard c1 anim d2">
                <span className="fnum">i</span>
                <div className="ft"><span className="fdot" /><h3>Invita</h3></div>
                <p>Invitaciones digitales con estilo, listas para compartir por WhatsApp o link. Tu evento, con tu cara.</p>
              </article>
              <article className="fcard c2 anim d3">
                <span className="fnum">ii</span>
                <div className="ft"><span className="fdot" /><h3>Confirma</h3></div>
                <p>Gestiona el RSVP sin enredos. Mira quién viene en tiempo real, desde tu teléfono.</p>
              </article>
              <article className="fcard c3 anim d4">
                <span className="fnum">iii</span>
                <div className="ft"><span className="fdot" /><h3>Recibe</h3></div>
                <p>Una lista de regalos en efectivo, en quetzales, directo a tu cuenta. Tú eliges en qué gastarlo.</p>
              </article>
            </div>
          </div>
        </section>

        {/* DEMOS SHOWCASE */}
        <section className="demos" id="demos">
          <div className="wrap">
            <div className="funcs-head">
              <h2 className="anim">Míralas en vivo<span style={{ color: "var(--pink)", fontStyle: "normal" }}>.</span></h2>
              <span className="eyebrow anim d1"><span className="d" />Invitaciones de muestra</span>
            </div>
            <div className="dgrid">
              {demoCards.map((d, i) => (
                <a key={d.slug} className={`demo-card anim d${i + 2}`} href={`/boda/${d.slug}`} target="_blank" rel="noopener">
                  <img src={d.foto} alt="" loading="lazy" />
                  <span className="dc-scrim" aria-hidden="true" />
                  <span className="dc-tag">{d.emoji} {d.tipo}</span>
                  <span className="dc-body"><b>{d.nombres}</b><span>Ver invitación</span></span>
                </a>
              ))}
            </div>
            <p className="pnote anim d6">Son demos de verdad: entra, prueba el RSVP y la mesa de regalos sin pagar nada. Cada una con sus propios colores, tipografías y fotos, igual que será la tuya.</p>
          </div>
        </section>

        {/* MONEY FLOW + DEMO */}
        <section className="flow" id="dinero">
          <div className="wrap">
            <div className="funcs-head">
              <h2 className="anim">Así llega el dinero a tu cuenta<span style={{ color: "var(--pink)", fontStyle: "normal" }}>.</span></h2>
              <span className="eyebrow anim d1"><span className="d" />Tu mesa de regalos</span>
            </div>
            <ol className="fsteps">
              <li className="fstep anim d2">
                <span className="fsnum">1</span>
                <h3>Comparte tu invitación</h3>
                <p>Cada invitado recibe su link por WhatsApp. No necesita app ni crear una cuenta.</p>
              </li>
              <li className="fstep anim d3">
                <span className="fsnum">2</span>
                <h3>Te regalan con tarjeta</h3>
                <p>Eligen un regalo de tu mesa, dejan su dedicatoria y pagan seguro con Visa o Mastercard.</p>
              </li>
              <li className="fstep anim d4">
                <span className="fsnum">3</span>
                <h3>Lo ves al instante</h3>
                <p>Cada aporte aparece en tu panel en tiempo real, con el nombre y el mensaje de quien te lo regaló.</p>
              </li>
              <li className="fstep anim d5">
                <span className="fsnum">4</span>
                <h3>Lo retiras a tu banco</h3>
                <p>Cuando tú quieras, el total llega completo a tu cuenta bancaria, en quetzales.</p>
              </li>
            </ol>
            <div className="flow-cta anim d6">
              <span className="flow-note">¿Quieres verlo funcionando? Arriba tienes cuatro invitaciones de muestra para probar el flujo completo.</span>
            </div>
          </div>
        </section>

        {/* PANEL SHOWCASE */}
        <section className="panelsec" id="panel">
          <div className="wrap">
            <div className="funcs-head">
              <h2 className="anim">Todo tu evento, en un panel<span style={{ color: "var(--pink)", fontStyle: "normal" }}>.</span></h2>
              <span className="eyebrow anim d1"><span className="d" />En tiempo real</span>
            </div>
            <div className="mock anim d2">
              <div className="mock-bar"><span /><span /><span /><b>wedo. · tu panel</b></div>
              <div className="mock-body">
                <div className="mock-stats">
                  <div className="mstat"><span className="mk">Recaudado</span><span className="mv">Q 12,400</span><span className="ms">llega completo a tu cuenta</span></div>
                  <div className="mstat"><span className="mk">Confirmados</span><span className="mv">86</span><span className="ms">de 120 invitados</span></div>
                  <div className="mstat"><span className="mk">Mensajes</span><span className="mv">34</span><span className="ms">dedicatorias recibidas</span></div>
                </div>
                <div className="mock-cols">
                  <div className="mcol">
                    <div className="mh">Últimos regalos</div>
                    <div className="mrow"><span className="mn">Andrea Morales</span><span className="md">Luna de miel</span><span className="mq">Q 500</span></div>
                    <div className="mrow"><span className="mn">Familia Ruiz</span><span className="md">Primera casa</span><span className="mq">Q 1,000</span></div>
                    <div className="mrow"><span className="mn">Luis Herrera</span><span className="md">Cena romántica</span><span className="mq">Q 350</span></div>
                  </div>
                  <div className="mcol">
                    <div className="mh">RSVP recientes</div>
                    <div className="mrow"><span className="mn">Familia Pérez</span><span className="md">💬 ¡Ahí estaremos!</span><span className="mq ok">✓ 4</span></div>
                    <div className="mrow"><span className="mn">Carmen y Luis</span><span className="md">💬 ¡Felicidades!</span><span className="mq ok">✓ 2</span></div>
                    <div className="mrow"><span className="mn">Jorge Castillo</span><span className="md">Sin mensaje</span><span className="mq no">No podrá ir</span></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="pnote anim d3">Así se ve tu panel: cada regalo y cada confirmación aparecen al momento, desde tu teléfono o tu computadora.</p>
          </div>
        </section>

        {/* PRICING */}
        <section className="price" id="precio">
          <div className="wrap">
            <div className="funcs-head">
              <h2 className="anim">Precio claro, sin sorpresas<span style={{ color: "var(--pink)", fontStyle: "normal" }}>.</span></h2>
              <span className="eyebrow anim d1"><span className="d" />Recibes el 100%</span>
            </div>
            <div className="pgrid">
              <article className="pcard anim d2">
                <div className="pk">Crear tu evento</div>
                <div className="pv">Q0</div>
                <p>Invitación digital, RSVP y mesa de regalos incluidos. Sin mensualidades y sin costo por invitado.</p>
              </article>
              <article className="pcard anim d3">
                <div className="pk">Cada aporte</div>
                <div className="pv">Tarifa del invitado</div>
                <p>Al regalar, el invitado suma una pequeña tarifa de servicio que cubre el pago seguro con tarjeta. Siempre la ve antes de pagar.</p>
              </article>
              <article className="pcard destacada anim d4">
                <div className="pk">Para ti</div>
                <div className="pv">El 100%</div>
                <p>Cada quetzal que te regalan llega completo a tu cuenta. Tú decides cómo usarlo.</p>
              </article>
            </div>
            <p className="pnote anim d5">Por ejemplo: si te regalan Q500, tú recibes Q500. El invitado paga Q537, con la tarifa de servicio ya incluida.</p>
          </div>
        </section>

        {/* EVENT TYPES */}
        <section className="events">
          <div className="wrap events-in">
            <span className="lbl">Para celebrar</span>
            <span className="ev serif">Bodas<span className="d" /></span>
            <span className="ev serif">Baby showers<span className="d" /></span>
            <span className="ev serif">Cumpleaños<span className="d" /></span>
            <span className="ev serif">Despedidas<span className="d" /></span>
            <span className="ev serif">y más<span className="d" /></span>
          </div>
        </section>

        {/* CLOSING */}
        <section className="close">
          <div className="wrap">
            <p className="sign-lg">Que empiece<br />con un sí<span className="dot">.</span></p>
            <p>Tu próxima celebración empieza aquí. Crea tu evento gratis en un minuto.</p>
            <a className="btn btn-pink js-cta" href="/login">Crea tu evento<span className="dotmini" /></a>
            <div className="foot">
              <div className="logo">wedo<span className="dot">.</span></div>
              <span>© 2026 wedo. · Guatemala</span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
