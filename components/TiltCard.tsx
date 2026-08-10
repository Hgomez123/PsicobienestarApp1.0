"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * Tarjeta que se inclina hacia el cursor.
 *
 * Mismo patrón que CursorGlow: el pointermove solo guarda coordenadas y todo
 * el trabajo ocurre en un requestAnimationFrame que se duerme al llegar al
 * reposo. El rect se mide una vez al entrar, no en cada evento — medirlo por
 * evento cuesta un layout y, al incluir el transform ya aplicado,
 * realimentaría su propio cálculo.
 *
 * Con "reducir movimiento" o en pantallas táctiles NO se monta nada: se
 * devuelve el mismo div sin listeners, sin rAF y sin transform.
 *
 * OJO al montarlo: las tarjetas de la landing son .scroll-reveal, que usa
 * transform para revelarse. Este componente debe envolver el contenido
 * VISUAL dentro del elemento con .scroll-reveal, nunca reemplazarlo, o el
 * transform del tilt pisa el del reveal.
 */
export default function TiltCard({ className = "", style, children }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(fine.matches && !reduced.matches);

    update();
    fine.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const MAX = 6; // grados. Más que esto, en una tarjeta con texto, marea.
    const LERP = 0.14;
    const EPS = 0.02; // por debajo de esta fracción de grado no se percibe

    let rect: DOMRect | null = null;
    let destinoX = 0;
    let destinoY = 0;
    let x = 0;
    let y = 0;
    let frame = 0;

    const dibujar = () => {
      x += (destinoX - x) * LERP;
      y += (destinoY - y) * LERP;
      el.style.transform =
        `perspective(900px) rotateX(${x.toFixed(3)}deg) rotateY(${y.toFixed(3)}deg)`;

      if (Math.abs(destinoX - x) < EPS && Math.abs(destinoY - y) < EPS) {
        frame = 0;
        // En reposo el transform vuelve a su valor neutro y se libera la capa.
        if (destinoX === 0 && destinoY === 0) {
          el.style.transform = "";
          el.style.willChange = "";
        }
        return;
      }
      frame = requestAnimationFrame(dibujar);
    };

    const despertar = () => {
      if (!frame) frame = requestAnimationFrame(dibujar);
    };

    const onEnter = () => {
      // will-change solo mientras el efecto está activo: dejarlo puesto en
      // reposo mantiene una capa de composición por tarjeta sin motivo.
      el.style.willChange = "transform";
      rect = el.getBoundingClientRect();
    };

    const onMove = (e: PointerEvent) => {
      // Red por si pointerenter no disparó (el puntero puede quedar encima
      // tras un scroll sin generar el evento).
      if (!rect) rect = el.getBoundingClientRect();
      // -1..1 desde el centro de la tarjeta
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      destinoY = px * 2 * MAX; // mover en X inclina sobre el eje Y
      destinoX = -py * 2 * MAX; // negativo: el borde cercano baja
      despertar();
    };

    const onLeave = () => {
      destinoX = 0;
      destinoY = 0;
      rect = null;
      despertar();
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
      el.style.transform = "";
      el.style.willChange = "";
    };
  }, [enabled]);

  if (!enabled) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={`tilt-card ${className}`} style={style}>
      {children}
    </div>
  );
}
