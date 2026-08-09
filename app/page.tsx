"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import CursorGlow from "@/components/CursorGlow";
import { useModalA11y } from "@/lib/hooks/useModalA11y";

/* ─── Datos ───────────────────────────────────────────────── */

const navLinks = [
  { label: "Inicio",    href: "#inicio" },
  { label: "Sobre mí", href: "#sobre-mi" },
  { label: "Servicios", href: "#servicios" },
  { label: "Contacto",  href: "#contacto" },
];

/* Antes eran dos bloques con el mismo mensaje: tres "trust pills" en el hero y
   una franja de stats 300px más abajo. Fusionados acá; los cuatro datos reales
   sobreviven, uno por píldora. */
const trustPills = [
  "Colegiada · Col. Psicólogos de Guatemala",
  "Confidencialidad garantizada",
  "Presencial y virtual",
  "Formación especializada",
];

const treatmentTags = [
  { label: "Ansiedad",                      cat: "blue"   },
  { label: "Ataques de pánico",             cat: "blue"   },
  { label: "Angustia",                      cat: "blue"   },
  { label: "Fobias",                        cat: "blue"   },
  { label: "Depresión",                     cat: "purple" },
  { label: "Duelos y pérdidas",             cat: "purple" },
  { label: "Trastorno Bipolar",             cat: "purple" },
  { label: "Ira",                           cat: "purple" },
  { label: "Irritabilidad",                 cat: "purple" },
  { label: "Regulación emocional",          cat: "purple" },
  { label: "Alzheimer · Demencias",         cat: "teal"   },
  { label: "Problemas de memoria",          cat: "teal"   },
  { label: "TDAH",                          cat: "teal"   },
  { label: "Autismo · TEA",                 cat: "teal"   },
  { label: "Autoestima",                    cat: "green"  },
  { label: "Desarrollo personal",           cat: "green"  },
  { label: "Dependencia emocional",         cat: "green"  },
  { label: "Relaciones sociales",           cat: "green"  },
  { label: "Bullying",                      cat: "green"  },
  { label: "Autolesiones",                  cat: "green"  },
  { label: "Estrés Postraumático",          cat: "amber"  },
  { label: "Burnout",                       cat: "amber"  },
  { label: "Estrés y agotamiento",          cat: "amber"  },
  { label: "Enfermedades psicosomáticas",   cat: "slate"  },
  { label: "Enfermedades crónicas",         cat: "slate"  },
  { label: "Cuidados paliativos",           cat: "slate"  },
  { label: "TOC",                           cat: "slate"  },
  { label: "Borderline · TLP",              cat: "slate"  },
  { label: "Trastornos del sueño",          cat: "slate"  },
  { label: "Dificultades del aprendizaje",  cat: "slate"  },
];

const tagColors: Record<string, string> = {
  blue:   "bg-brand-tint text-brand border-brand-line",
  purple: "bg-tag-purple-bg text-tag-purple-fg border-tag-purple-line",
  teal:   "bg-tag-teal-bg text-tag-teal-fg border-tag-teal-line",
  green:  "bg-tag-green-bg text-tag-green-fg border-tag-green-line",
  amber:  "bg-tag-amber-bg text-tag-amber-fg border-tag-amber-line",
  slate:  "bg-slate-50 text-slate-600 border-slate-200",
};

const portalFeatures = [
  "Agenda y consulta tus citas en línea",
  "Recursos y recomendaciones personalizadas",
  "Seguimiento de objetivos terapéuticos",
  "Check-in emocional entre sesiones",
  "Notas clínicas organizadas y accesibles",
  "Disponible desde cualquier dispositivo",
];

const benefits = [
  {
    num: "01",
    title: "Enfoque humano y personalizado",
    description:
      "Cada proceso terapéutico es único. Adapto mi acompañamiento a tu historia, ritmo y necesidades, con escucha genuina y sin juicios.",
  },
  {
    num: "02",
    title: "Formación especializada en neuropsicología",
    description:
      "Licenciada en Psicología Clínica, actualmente en especialización en Neuropsicología. Comprendo la mente desde su base científica y humana.",
  },
  {
    num: "03",
    title: "Acompañamiento continuo entre sesiones",
    description:
      "Tu proceso no termina al salir de consulta. Ofrezco seguimiento real para que nunca sientas que estás solo/a en el camino.",
  },
];

const services = [
  {
    tag: "Terapia Individual",
    title: "Un espacio de escucha genuina para ti",
    description:
      "Acompañamiento personalizado para ansiedad, estrés, duelo, autoestima y crecimiento personal. Un entorno seguro donde tú eres el centro y la confidencialidad es absoluta.",
    detail: "Duración: 60 min · Frecuencia: semanal o quincenal",
    image: "/Escucha Activa.jpg",
    alt: "Escucha activa en terapia individual",
  },
  {
    tag: "Sesiones Virtuales",
    title: "La misma calidad, desde cualquier lugar",
    description:
      "Atención psicológica de alto nivel desde donde estés. La misma profundidad y confidencialidad de una sesión presencial, sin límites geográficos ni desplazamientos.",
    detail: "Plataforma segura · Horarios flexibles",
    image: "/Misma calidad Desde.jpg",
    alt: "Sesión virtual con la misma calidad desde cualquier lugar",
  },
  {
    tag: "Atención Presencial",
    title: "Un entorno cálido y profesional en Guatemala",
    description:
      "Sesiones en persona en Psicobienestar-Renovati, zona 10 de Ciudad de Guatemala. Un espacio diseñado para que te sientas cómodo/a y seguro/a desde el primer momento.",
    detail: "Psicobienestar-Renovati · Ciudad de Guatemala",
    image: "/Entorno Calido Y pro.jpg",
    alt: "Entorno cálido y profesional en Guatemala",
  },
];

const credentials = [
  { label: "Formación",       value: "Lic. en Psicología Clínica" },
  { label: "Especialización", value: "Neuropsicología (en curso)" },
  { label: "Colegiada",       value: "Col. Psicólogos de Guatemala" },
  { label: "Centro clínico",  value: "Psicobienestar-Renovati" },
];

/* ─── Componente ───────────────────────────────────────────── */

const WA_NUMBER = "50243123394";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    modalidad: "Terapia individual – Presencial",
    mensaje: "",
  });

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = [
      `Hola, me gustaría agendar una sesión.`,
      ``,
      `*Nombre:* ${formData.nombre}`,
      `*Correo:* ${formData.correo}`,
      `*Modalidad:* ${formData.modalidad}`,
      `*Mensaje:* ${formData.mensaje}`,
    ].join("\n");
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
  }

  useEffect(() => {
    let frame = 0;
    const apply = () => {
      frame = 0;
      // Booleano: solo re-renderiza al cruzar el umbral, no en cada scroll.
      setScrolled(window.scrollY > 50);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const targets = document.querySelectorAll(".scroll-reveal, .stagger-reveal");

    // Sin IntersectionObserver el contenido quedaría en opacity: 0 para
    // siempre. Se muestra todo de una y no se observa nada.
    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("in-view"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in-view");
          // Ya revelado: dejar de observarlo. Antes los 31 elementos seguían
          // observados toda la sesión.
          observer.unobserve(e.target);
        });
      },
      // El margen negativo abajo encoge la zona de disparo: el elemento se
      // revela cuando ya entró de verdad, no cuando asoma un pixel. Por eso
      // el threshold baja a 0: acumular las dos restricciones podría dejar
      // algo sin revelarse nunca.
      { threshold: 0, rootMargin: "0px 0px -12% 0px" }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Escape cierra el menú móvil y devuelve el foco a la hamburguesa.
  useModalA11y(menuOpen, () => setMenuOpen(false));

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-800">

      <a
        href="#inicio"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-xl focus:bg-brand focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Saltar al contenido
      </a>

      {/* Glow ambiental del cursor. Es position: fixed, así que su lugar en
          el árbol no cambia dónde se dibuja; va acá para que exista solo en
          la landing y no en los portales. En touch o con "reducir
          movimiento" el componente no renderiza nada. */}
      <CursorGlow />

      {/* ══════════════════════════════════════
          HEADER
      ══════════════════════════════════════ */}
      <Header
        navLinks={navLinks}
        menuOpen={menuOpen}
        onOpenMenu={() => setMenuOpen(v => !v)}
      />

      {/* ── Botón volver al inicio (móvil, aparece al hacer scroll) ── */}
      {scrolled && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Volver al inicio"
          className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-[0_6px_24px_rgba(30,90,133,0.35)] transition-all duration-300 hover:bg-brand-bright md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
      )}

      {/* ── Menú móvil ── */}
      {/* Overlay oscuro */}
      <div
        className={`mobile-overlay fixed inset-0 z-[59] bg-black/30 backdrop-blur-sm md:hidden ${menuOpen ? "open" : "closed"}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <div
        className={`mobile-menu fixed inset-0 z-[60] flex md:hidden ${menuOpen ? "open" : "closed"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="mobile-panel flex h-full w-full max-w-[340px] ml-auto flex-col bg-white/95 backdrop-blur-2xl shadow-2xl">
          {/* Blobs decorativos */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-30"
              style={{ background: "radial-gradient(circle, rgba(30,90,133,0.35) 0%, transparent 70%)", animation: "mobileBlobA 12s ease-in-out infinite" }}
            />
            <div
              className="absolute -bottom-16 -left-16 h-52 w-52 rounded-full opacity-25"
              style={{ background: "radial-gradient(circle, rgba(111,152,190,0.30) 0%, transparent 70%)", animation: "mobileBlobB 15s ease-in-out infinite" }}
            />
          </div>

          {/* Encabezado */}
          <div className="relative flex items-center justify-between border-b border-slate-100/60 px-6 py-5">
            <Image src="/Logo%20original.svg" alt="Psicobienestar" width={170} height={54} className="logo-img h-12 w-auto object-contain" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm transition-all duration-200 hover:border-brand/30 hover:text-brand hover:shadow-md active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </button>
          </div>

          {/* Saludo */}
          <div className="relative px-6 pt-5 pb-2">
            <p className="text-sm font-medium text-slate-800">Bienvenido/a</p>
            <p className="mt-0.5 text-xs text-slate-600">Explora los servicios de Psicobienestar</p>
          </div>

          {/* Navegación */}
          <nav className="relative flex flex-1 flex-col gap-2 overflow-y-auto px-4 pt-2">
            {navLinks.map(({ label, href }, i) => {
              const icons: Record<string, React.ReactNode> = {
                Inicio: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                ),
                "Sobre mí": (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>
                ),
                Servicios: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
                ),
                Contacto: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                ),
              };
              const iconBgs: Record<string, string> = {
                Inicio: "bg-brand-tint text-brand",
                "Sobre mí": "bg-tag-purple-bg text-tag-purple-fg",
                Servicios: "bg-tag-green-bg text-tag-green-fg",
                Contacto: "bg-tag-amber-bg text-tag-amber-fg",
              };
              return (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="mobile-link group flex items-center gap-3 rounded-2xl border border-transparent px-3.5 py-3.5 text-[15px] font-medium text-slate-700 hover:border-brand/10 hover:bg-brand-tint/60 hover:text-brand hover:shadow-sm active:scale-[0.98]"
                >
                  <span className={`mobile-link-icon ${iconBgs[label] ?? "bg-slate-100 text-slate-600"}`}>
                    {icons[label] ?? null}
                  </span>
                  <span className="flex-1">{label}</span>
                  <span className="mobile-link-arrow bg-brand/10 text-brand">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5l3 3.5-3 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </a>
              );
            })}

            <div className="mobile-divider my-2" />

            <a
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="mobile-link group flex items-center gap-3 rounded-2xl border border-transparent px-3.5 py-3 text-sm text-slate-600 hover:border-brand/10 hover:bg-brand-tint/60 hover:text-brand active:scale-[0.98]"
            >
              <span className="mobile-link-icon bg-slate-100 text-slate-600">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </span>
              <span className="flex-1">Portal del paciente</span>
              <span className="mobile-link-arrow bg-slate-100 text-slate-600">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5l3 3.5-3 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </a>
          </nav>

          {/* CTA */}
          <div className="relative px-5 pb-8 pt-4">
            <a
              href="#contacto"
              onClick={() => setMenuOpen(false)}
              className="btn-glow flex items-center justify-center gap-2 w-full rounded-2xl py-4 text-[15px] font-semibold text-white active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-bright) 100%)" }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="square"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Agendar cita
            </a>
            <p className="mt-3 text-center text-[11px] text-slate-600">
              Consulta presencial y virtual en Guatemala
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          HERO — luminoso, limpio
      ══════════════════════════════════════ */}
      <section id="inicio" className="relative overflow-hidden bg-white">

        {/* Fondo decorativo sutil */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 95% 10%, rgba(30,90,133,0.06) 0%, transparent 65%)," +
              "radial-gradient(ellipse 50% 40% at 5% 90%, rgba(111,152,190,0.07) 0%, transparent 60%)",
          }}
        />

        {/* Grid de puntos muy suave */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(30,90,133,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* Texto hero */}
            <div>
              {/* Badge */}
              <div className="hero-badge inline-flex items-center gap-2.5 rounded-full border border-brand/15 bg-brand-tint px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-brand" />
                Psicología Clínica · Guatemala
              </div>

              {/* Titular */}
              <h1 className="hero-title mt-7 text-5xl font-bold leading-[1.08] tracking-tight text-slate-900 [text-wrap:balance] lg:text-[62px]">
                Tu bienestar emocional{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-muted) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  importa.
                </span>
              </h1>

              {/* Subtítulo */}
              <p className="hero-subtitle mt-6 max-w-lg text-lg leading-8 text-slate-600 [text-wrap:balance]">
                Acompañamiento psicológico profesional, humano y confidencial con la{" "}
                <span className="font-semibold text-slate-700">
                  Lic. María Eugenia Castillo García.
                </span>{" "}
                Da el primer paso hoy.
              </p>

              {/* CTAs */}
              <div className="hero-cta mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#contacto"
                  className="btn-glow inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-bright) 100%)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Agendar primera sesión
                </a>
                <a
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-7 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-brand hover:text-brand"
                >
                  Acceder al portal
                </a>
              </div>

              {/* Trust pills */}
              <div className="hero-stats mt-8 flex flex-wrap gap-2">
                {trustPills.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] font-medium text-slate-600"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="hero-cta mt-3">
                <a href="/doctor-login" className="text-[11px] text-slate-600 underline-offset-4 transition hover:text-slate-600 hover:underline">
                  Acceso para profesionales
                </a>
              </div>
            </div>

            {/* Decoración derecha — visible en móvil y desktop */}
            <div className="hero-cta relative flex items-center justify-center">
              {/* Círculo principal */}
              <div
                className="portal-soft-float relative flex h-[300px] w-[300px] items-center justify-center rounded-full lg:h-[420px] lg:w-[420px]"
                style={{ background: "linear-gradient(145deg, var(--color-brand-tint) 0%, #DCEAF6 100%)" }}
              >
                {/* Cerebro */}
                <span aria-hidden="true" className="select-none text-[6rem] leading-none lg:text-[8rem]">🧠</span>

                {/* Anillo decorativo exterior */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-dashed border-brand-muted/20"
                  style={{ transform: "scale(1.12)" }}
                />
                <div
                  className="absolute inset-0 rounded-full border border-brand/08"
                  style={{ transform: "scale(1.24)" }}
                />
              </div>

              {/* Card flotante — credential */}
              <div
                className="portal-soft-float absolute -bottom-2 -left-4 rounded-[16px] border border-slate-100 bg-white px-4 py-3 shadow-[0_12px_40px_rgba(30,90,133,0.12)] lg:-left-8 lg:rounded-[20px] lg:px-5 lg:py-4"
                style={{ animationDelay: "0.8s" }}
              >
                <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600">Colegiada activa</p>
                <p className="mt-0.5 text-xs font-bold text-brand lg:mt-1 lg:text-sm">Col. Psicólogos · GT</p>
              </div>

              {/* Card flotante — neuropsicología */}
              <div
                className="portal-soft-float absolute -top-3 -right-4 rounded-[16px] bg-brand px-4 py-3 shadow-[0_12px_40px_rgba(30,90,133,0.22)] lg:-top-4 lg:-right-6 lg:rounded-[20px] lg:px-5 lg:py-4"
                style={{ animationDelay: "1.6s" }}
              >
                <p className="text-[9px] font-semibold uppercase tracking-widest text-white/80">Especialización</p>
                <p className="mt-0.5 text-xs font-bold text-white lg:mt-1 lg:text-sm">Neuropsicología</p>
              </div>

              {/* Card flotante — modalidades (solo desktop) */}
              <div
                className="portal-soft-float absolute top-1/2 -right-12 -translate-y-1/2 hidden rounded-[20px] border border-slate-100 bg-white px-4 py-3.5 shadow-[0_10px_30px_rgba(30,90,133,0.10)] lg:block"
                style={{ animationDelay: "2.4s" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Modalidades</p>
                <p className="mt-1 text-sm font-bold text-brand">Virtual · Presencial</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SOBRE MÍ
      ══════════════════════════════════════ */}
      <section id="sobre-mi" className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* Foto */}
            <div className="scroll-reveal slide-left order-2 lg:order-1">
              <div className="relative mx-auto max-w-sm">
                <div
                  className="absolute -inset-6 rounded-[3rem]"
                  style={{ background: "radial-gradient(ellipse at center, rgba(30,90,133,0.08) 0%, transparent 70%)" }}
                />
                <div className="relative aspect-[3/4] overflow-hidden rounded-[2.5rem] shadow-[0_24px_60px_rgba(30,90,133,0.12)]">
                  <Image
                    src="/doctora.jpg"
                    alt="Lic. María Eugenia Castillo García"
                    fill
                    className="object-cover object-[center_25%]"
                    sizes="(max-width: 768px) 90vw, 384px"
                    priority
                  />
                  <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                {/* Badge colegiada */}
                <div className="portal-soft-float absolute -bottom-4 -right-4 rounded-[18px] border border-slate-100 bg-white px-4 py-3 shadow-xl">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-600">Colegiada activa</p>
                  <p className="mt-0.5 text-sm font-bold text-brand">Col. Psicólogos · GT</p>
                </div>
                {/* Badge neuropsicología */}
                <div
                  className="portal-soft-float absolute -top-4 -left-4 rounded-[18px] bg-brand px-4 py-3 shadow-xl"
                  style={{ animationDelay: "1.2s" }}
                >
                  <p className="text-[10px] font-medium uppercase tracking-widest text-white/80">Especialización</p>
                  <p className="mt-0.5 text-sm font-bold text-white">Neuropsicología</p>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="scroll-reveal slide-right order-1 lg:order-2">
              <span className="inline-block rounded-full bg-brand-tint px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
                Sobre mí
              </span>
              <h2 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 [text-wrap:balance] sm:text-5xl">
                Lic. María Eugenia<br className="hidden sm:block" /> Castillo García
              </h2>
              <p className="mt-2 text-base font-medium text-brand-muted-ink">
                Psicóloga Clínica · Psicobienestar-Renovati, Guatemala
              </p>
              <p className="mt-6 text-base leading-8 text-slate-600 [text-wrap:balance]">
                Soy psicóloga clínica colegiada, con formación en psicología clínica y
                actualmente cursando una especialización en Neuropsicología. Mi práctica
                está orientada a ofrecer un acompañamiento genuino, profesional y
                profundamente humano.
              </p>
              <p className="mt-4 text-base leading-8 text-slate-600 [text-wrap:balance]">
                Trabajo en{" "}
                <span className="font-semibold text-slate-800">Psicobienestar-Renovati</span>
                , atendiendo de forma presencial y virtual con la misma dedicación y
                confidencialidad.
              </p>

              {/* Credentials */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                {credentials.map((c, i) => (
                  <div
                    key={i}
                    className="stagger-reveal rounded-[18px] border border-slate-100 bg-slate-50/80 p-4"
                    style={{ "--reveal-i": i } as React.CSSProperties}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">{c.label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{c.value}</p>
                  </div>
                ))}
              </div>

              <a
                href="#contacto"
                className="btn-glow mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-bright) 100%)" }}
              >
                Agendar sesión <span aria-hidden>→</span>
              </a>
            </div>
          </div>

          {/* Beneficios: eran una sección propia con su propia cabecera. Los
              tres argumentos son sobre la doctora, así que viven acá. El
              párrafo de intro se conserva como texto, no como encabezado:
              esta sección ya tiene su h2 y no debe competir. */}
          <div className="mt-14">
            <p className="scroll-reveal mx-auto mb-8 max-w-2xl text-center text-base leading-7 text-slate-600 [text-wrap:balance]">
              Ciencia, calidez y compromiso real con tu proceso de bienestar emocional.
            </p>

            <div className="grid gap-px bg-slate-200 overflow-hidden rounded-[28px] border border-slate-200 md:grid-cols-3">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="stagger-reveal portal-card-hover group flex flex-col bg-white p-8 lg:p-10"
                style={{ "--reveal-i": i } as React.CSSProperties}
              >
                {/* Número grande */}
                <span
                  className="mb-6 block text-[56px] font-bold leading-none tracking-tight transition-colors duration-300 group-hover:text-brand"
                  style={{ color: "#E8F0F7", fontVariantNumeric: "tabular-nums" }}
                >
                  {b.num}
                </span>
                <h3 className="text-lg font-bold leading-snug text-slate-900">{b.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{b.description}</p>
                {/* Línea animada en hover */}
                <div
                  className="mt-6 h-[2px] w-8 rounded-full transition-all duration-500 group-hover:w-full"
                  style={{ background: "linear-gradient(90deg, var(--color-brand), var(--color-brand-muted))" }}
                />
              </div>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SERVICIOS — modalidades en grid
      ══════════════════════════════════════ */}
      <section id="servicios" className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          {/* Header */}
          <div className="scroll-reveal mb-12 text-center">
            <span className="inline-block rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
              Servicios
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 [text-wrap:balance] sm:text-5xl">
              Atención adaptada a ti
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-slate-600 [text-wrap:balance]">
              Cada proceso terapéutico es único. Ofrezco distintas modalidades para
              que encuentres el acompañamiento que mejor se ajuste a tu momento de vida.
            </p>
          </div>

          {/* Grid de modalidades: 1 columna hasta lg, 3 en desktop */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {services.map((s, i) => (
              <div
                key={i}
                style={{ "--reveal-i": i } as React.CSSProperties}
                className="scroll-reveal flex flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-slate-50/60 p-1"
              >
                {/* Visual */}
                <div className="relative aspect-[16/10] overflow-hidden rounded-[28px]">
                  <Image
                    src={s.image}
                    alt={s.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, (max-width: 1279px) 33vw, 400px"
                  />
                </div>

                {/* Texto */}
                <div className="flex flex-1 flex-col px-6 py-7 lg:px-7 lg:py-8">
                  <span className="inline-block self-start rounded-full bg-brand-tint px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
                    {s.tag}
                  </span>
                  <h3 className="mt-4 text-2xl font-bold leading-snug text-slate-900 [text-wrap:balance]">
                    {s.title}
                  </h3>
                  <p className="mt-3 flex-1 text-[15px] leading-7 text-slate-600 [text-wrap:balance]">
                    {s.description}
                  </p>
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-brand-muted-ink">
                    {s.detail}
                  </p>
                  <a
                    href="#contacto"
                    className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-brand transition-all duration-200 hover:gap-3"
                  >
                    Agendar sesión <span aria-hidden>→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ÁREAS + PORTAL + INFO
      ══════════════════════════════════════ */}
      <section className="bg-slate-50/60 py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          {/* Header */}
          <div className="scroll-reveal mb-8 text-center">
            <span className="inline-block rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
              Áreas de acompañamiento
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl [text-wrap:balance]">
              ¿En qué puedo acompañarte?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-slate-600">
              Trabajo con adultos y adultos mayores que atraviesan dificultades emocionales, ofreciendo un espacio seguro, empático y personalizado.
            </p>
          </div>

          {/* Tags de tratamientos */}
          <div className="scroll-reveal mb-10 flex flex-wrap justify-center gap-1.5">
            {treatmentTags.map(({ label, cat }) => (
              <span
                key={label}
                className={`treatment-tag border ${tagColors[cat]}`}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Columnas: Portal + Info */}
          <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">

            {/* ── Portal del Paciente ── */}
            <div className="scroll-reveal slide-left portal-benefit-card flex h-full flex-col">
              {/* Glow decorativo */}
              <div className="portal-benefit-glow" aria-hidden />

              <div className="relative z-10 flex flex-1 flex-col">
                <span className="portal-benefit-badge">Incluido · Exclusivo</span>
                <h3 className="mt-4 text-2xl font-bold text-white lg:text-3xl">
                  Portal del Paciente
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Accede a tu proceso terapéutico de forma digital, segura y desde cualquier dispositivo.
                </p>

                <ul className="mt-5 space-y-2">
                  {portalFeatures.map(feat => (
                    <li key={feat} className="portal-benefit-feature">
                      <span className="portal-benefit-check" aria-hidden>✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Stats / garantías */}
                <div className="mt-7 grid grid-cols-3 gap-2.5">
                  {[
                    { label: "Acceso", value: "24/7" },
                    { label: "Privacidad", value: "100%" },
                    { label: "Dispositivos", value: "Todos" },
                  ].map(stat => (
                    <div key={stat.label} className="portal-benefit-stat">
                      <p className="portal-benefit-stat-value">{stat.value}</p>
                      <p className="portal-benefit-stat-label">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-8">
                  <a href="/login" className="portal-benefit-cta inline-flex items-center gap-2">
                    Acceder al portal
                    <span aria-hidden className="quote-cta-arrow">→</span>
                  </a>
                </div>
              </div>
            </div>

            {/* ── Columna derecha ── */}
            <div className="flex flex-col gap-5">

              {/* Especialidades + Formación */}
              <div className="scroll-reveal slide-right info-benefit-card">
                <p className="info-benefit-label">Especialidades</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Neuropsicología", "Terapia cognitivo conductual", "Cuidados Paliativos", "Geriatría · Gerontología", "Logoterapia"].map(s => (
                    <span key={s} className="specialty-chip">{s}</span>
                  ))}
                </div>

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="info-benefit-label">Formación académica</p>
                  <ul className="mt-3 space-y-2.5">
                    <li className="flex gap-3 text-sm leading-5 text-slate-600">
                      <span className="mt-0.5 shrink-0 text-brand">◆</span>
                      <span>Lic. en Psicología Clínica — Universidad Mariano Gálvez de Guatemala</span>
                    </li>
                    <li className="flex gap-3 text-sm leading-5 text-slate-600">
                      <span className="mt-0.5 shrink-0 text-brand">◆</span>
                      <span>Maestría en Neuropsicología Aplicada <em>(en curso)</em> — Universidad del Valle de Guatemala</span>
                    </li>
                    <li className="flex gap-3 text-sm leading-5 text-slate-600">
                      <span className="mt-0.5 shrink-0">◇</span>
                      <span>N.º Colegiado: <strong className="text-slate-600">17538</strong></span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Tarifa + Ubicación */}
              <div className="scroll-reveal slide-right info-benefit-card">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="info-benefit-label">Tarifa por sesión</p>
                    <p className="mt-1 text-[2.2rem] font-bold tracking-tight text-slate-900">Q 300</p>
                    <p className="mt-0.5 text-xs text-slate-600">Cita previa · horarios flexibles</p>
                  </div>
                  <div className="price-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="3"/>
                      <line x1="2" y1="10" x2="22" y2="10"/>
                    </svg>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-5 flex gap-3">
                  <svg className="mt-0.5 shrink-0 text-brand" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">2da calle 6-24, Edificio RENOVATI</p>
                    <p className="text-xs text-slate-600">Zona 10, Ciudad de Guatemala</p>
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-3 py-1 text-[11px] font-medium text-brand">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-muted" />
                      También disponible en línea
                    </p>
                  </div>
                </div>

                {/* Preview de ubicación + acciones (sin iframe externo) */}
                <div className="mt-5 location-preview">
                  <div className="location-preview-grid" aria-hidden />
                  <div className="location-preview-glow" aria-hidden />
                  <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                    <div className="location-pin">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">Edificio RENOVATI · Zona 10</p>
                    <p className="text-xs text-slate-600">Ciudad de Guatemala</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Edificio+Renovati+Centro+M%C3%A9dico+Empresarial+Zona+10+Guatemala"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="location-action location-action-primary"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                    </svg>
                    Google Maps
                  </a>
                  <a
                    href="https://www.waze.com/ul?q=Edificio%20Renovati%20Centro%20M%C3%A9dico%20Empresarial%20Zona%2010%20Guatemala&navigate=yes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="location-action"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                      <line x1="9" y1="9" x2="9.01" y2="9"/>
                      <line x1="15" y1="9" x2="15.01" y2="9"/>
                    </svg>
                    Waze
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          QUOTE — compacta con stats dinámicos
      ══════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-brand-ink py-14 lg:py-20">

        {/* Glow ambiental sutil */}
        <div className="quote-glow" aria-hidden />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">

            {/* ── Columna izquierda: cita ── */}
            <div className="scroll-reveal slide-left text-center lg:text-left">
              <div className="quote-line mb-7 lg:ml-0" />
              <blockquote>
                <p className="quote-text !text-left-on-lg">
                  "Pedir ayuda no es debilidad.
                  Es el primer paso hacia una vida más plena."
                </p>
              </blockquote>
              <p className="quote-author mt-5">
                — Lic. María Eugenia Castillo García
              </p>
              <div className="mt-6 flex justify-center lg:justify-start">
                <a href="#contacto" className="quote-cta-btn !mt-0">
                  Da el primer paso hoy
                  <span className="quote-cta-arrow" aria-hidden>→</span>
                </a>
              </div>
            </div>

            {/* ── Columna derecha: tarjetas dinámicas ── */}
            <div className="scroll-reveal slide-right grid grid-cols-2 gap-3">

              {/* Pacientes */}
              <div className="quote-stat-card">
                <p className="quote-stat-value">Atención</p>
                <p className="quote-stat-label">Personalizada</p>
              </div>

              {/* Confidencialidad */}
              <div className="quote-stat-card">
                <p className="quote-stat-value">100%</p>
                <p className="quote-stat-label">Confidencialidad garantizada</p>
              </div>

              {/* Estado en vivo */}
              <div className="quote-stat-card quote-stat-card--live">
                <div className="quote-stat-live">
                  <span className="quote-stat-live-dot" />
                  <span className="quote-stat-live-text">Disponible</span>
                </div>
                <p className="quote-stat-value text-[1.1rem]">Agenda</p>
                <p className="quote-stat-label">Consulta disponible · Virtual y presencial</p>
              </div>

              {/* Colegiada */}
              <div className="quote-stat-card">
                <p className="quote-stat-value text-[1.1rem]">Colegiada</p>
                <p className="quote-stat-label">Col. Psicólogos de Guatemala</p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CONTACTO
      ══════════════════════════════════════ */}
      <section id="contacto" className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">

            {/* Info */}
            <div className="scroll-reveal slide-left">
              <span className="inline-block rounded-full bg-brand-tint px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
                Contacto
              </span>
              <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 [text-wrap:balance] sm:text-5xl">
                Da el primer paso hoy
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-600 [text-wrap:balance]">
                Agenda tu primera sesión y comienza tu proceso de bienestar emocional.
                Respondo todos los mensajes con discreción y prontitud.
              </p>

              {/* Info items */}
              <div className="mt-10 space-y-6">
                {[
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
                    label: "Correo electrónico",
                    value: "gt.psicobienestar@gmail.com",
                  },
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>,
                    label: "WhatsApp",
                    value: "4312-3394",
                  },
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                    label: "Ubicación",
                    value: "Edificio Renovati, zona 10, Ciudad de Guatemala",
                  },
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                    label: "Horario",
                    value: "Lunes a viernes · 9:00 AM – 6:00 PM",
                  },
                ].map(({ icon, label, value }, i) => (
                  <div
                    key={label}
                    style={{ "--reveal-i": i } as React.CSSProperties}
                    className="stagger-reveal flex items-start gap-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-brand">
                      {icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">{label}</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA WhatsApp */}
              <div className="mt-10 overflow-hidden rounded-[24px] bg-brand p-6 shadow-[0_16px_40px_rgba(30,90,133,0.22)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">¿Lista/o para comenzar?</p>
                <p className="mt-2 text-lg font-semibold text-white">Primera sesión con 15% de descuento</p>
                <p className="mt-1.5 text-sm leading-6 text-white/75 [text-wrap:balance]">
                  Cuéntame sobre lo que estás viviendo.
                </p>
                <a
                  href="https://wa.me/50243123394"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glow btn-glow--on-dark mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-brand"
                >
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                  Escribir por WhatsApp
                </a>
              </div>

              {/* Nota seguridad */}
              <div className="mt-4 rounded-[18px] border border-slate-100 bg-slate-50 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Nota importante</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 [text-wrap:balance]">
                  Este espacio es de apoyo, no de emergencia. Si estás en crisis, comunícate con los servicios de salud de tu localidad.
                </p>
              </div>
            </div>

            {/* Formulario */}
            <div className="scroll-reveal slide-right">
              <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.05)] lg:p-10">
                <h3 className="text-xl font-bold text-slate-900">Solicitar una cita</h3>
                <p className="mt-1 text-sm text-slate-600">Respondo en menos de 24 horas.</p>

                <form className="mt-8 space-y-4" onSubmit={handleFormSubmit}>
                  <div>
                    <label htmlFor="contacto-nombre" className="mb-1.5 block text-sm font-medium text-slate-600">Nombre completo</label>
                    <input
                      id="contacto-nombre"
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleFormChange}
                      placeholder="Tu nombre"
                      required
                      className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/40"
                    />
                  </div>

                  <div>
                    <label htmlFor="contacto-correo" className="mb-1.5 block text-sm font-medium text-slate-600">Correo electrónico</label>
                    <input
                      id="contacto-correo"
                      type="email"
                      name="correo"
                      value={formData.correo}
                      onChange={handleFormChange}
                      placeholder="tu@correo.com"
                      required
                      className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/40"
                    />
                  </div>

                  <div>
                    <label htmlFor="contacto-modalidad" className="mb-1.5 block text-sm font-medium text-slate-600">Modalidad de preferencia</label>
                    <select
                      id="contacto-modalidad"
                      name="modalidad"
                      value={formData.modalidad}
                      onChange={handleFormChange}
                      className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/40"
                    >
                      <option>Terapia individual – Presencial</option>
                      <option>Terapia individual – Virtual</option>
                      <option>Acompañamiento psicológico</option>
                      <option>No estoy seguro/a, necesito orientación</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contacto-mensaje" className="mb-1.5 block text-sm font-medium text-slate-600">Mensaje</label>
                    <textarea
                      id="contacto-mensaje"
                      rows={4}
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleFormChange}
                      placeholder="Cuéntame brevemente sobre lo que buscas o lo que estás viviendo..."
                      className="w-full resize-none rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/40"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-glow flex w-full items-center justify-center gap-2 rounded-[14px] py-4 text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-bright) 100%)" }}
                  >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                    </svg>
                    Enviar por WhatsApp
                  </button>

                  <p className="text-center text-xs text-slate-600">
                    Tu información es confidencial y nunca será compartida.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer style={{ background: "var(--color-brand-ink)" }}>
        <div
          className="h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(111,152,190,0.30) 40%, rgba(111,152,190,0.20) 60%, transparent 100%)" }}
        />

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[2fr_1fr_1.5fr]">

            {/* Columna Brand */}
            <div>
              <Image
                src="/Logo%20original.svg"
                alt="Psicobienestar"
                width={180}
                height={56}
                className="h-12 w-auto object-contain brightness-0 invert opacity-85"
              />
              <p className="mt-4 max-w-[290px] text-sm leading-7 text-white/75 [text-wrap:balance]">
                Acompañamiento psicológico profesional, humano y confidencial. Presencial y virtual en Guatemala.
              </p>
              <div className="mt-6 flex gap-3">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/gt.psicobienestar?igsh=MW01YW55eWc1d3Z5bA=="
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="group flex h-10 w-10 items-center justify-center rounded-xl border border-pink-400/30 bg-gradient-to-br from-pink-500/20 to-purple-600/20 text-pink-300 shadow-md transition-all duration-300 hover:scale-110 hover:border-pink-400/70 hover:from-pink-500/40 hover:to-purple-600/40 hover:text-pink-200 hover:shadow-pink-500/20"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5"/>
                    <circle cx="12" cy="12" r="4.5"/>
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                </a>
                {/* Facebook */}
                <a
                  href="https://www.facebook.com/profile.php?id=61572835898177"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="group flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/20 text-blue-300 shadow-md transition-all duration-300 hover:scale-110 hover:border-blue-400/70 hover:bg-blue-500/40 hover:text-blue-200 hover:shadow-blue-500/20"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                  </svg>
                </a>
                {/* WhatsApp */}
                <a
                  href="https://wa.me/50243123394"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="group flex h-10 w-10 items-center justify-center rounded-xl border border-green-400/30 bg-green-500/20 text-green-300 shadow-md transition-all duration-300 hover:scale-110 hover:border-green-400/70 hover:bg-green-500/40 hover:text-green-200 hover:shadow-green-500/20"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Columna Links */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted-soft">Links rápidos</p>
              <nav className="mt-5 space-y-3">
                {[
                  { label: "Inicio",           href: "#inicio" },
                  { label: "Servicios",         href: "#servicios" },
                  { label: "Sobre mí",          href: "#sobre-mi" },
                  { label: "Contacto",          href: "#contacto" },
                  { label: "Portal paciente",   href: "/login" },
                ].map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="group flex items-center gap-2 text-sm text-white/75 transition-all duration-200 hover:text-white/85"
                  >
                    <span className="text-brand-muted/0 transition-all duration-200 group-hover:text-brand-muted/70">›</span>
                    {label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Columna Contacto */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted-soft">Información de contacto</p>
              <div className="mt-5 space-y-5">
                {[
                  {
                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
                    label: "Correo",      value: "contacto@psicobienestar.gt",
                  },
                  {
                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                    label: "Ubicación",  value: "Psicobienestar-Renovati, Guatemala",
                  },
                  {
                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                    label: "Horario",    value: "Lun–Vie · 8:00 AM – 6:00 PM",
                  },
                  {
                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>,
                    label: "Modalidades", value: "Presencial · Virtual",
                  },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 text-brand-muted/60">{icon}</span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">{label}</p>
                      <p className="mt-0.5 text-sm text-white/75">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-14 flex flex-col items-center gap-2 border-t border-white/8 pt-7 sm:flex-row sm:justify-between">
            <p className="text-[11px] text-white/70">
              © {new Date().getFullYear()} Psicobienestar · Todos los derechos reservados
            </p>
            <p className="text-[11px] text-white/70">
              Colegiada del Colegio de Psicólogos de Guatemala
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
