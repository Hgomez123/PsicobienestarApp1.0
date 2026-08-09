"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Resplandor ambiental que persigue al cursor con retraso.
 *
 * Solo desktop y solo sin "reducir movimiento": en cualquier otro caso el
 * componente no renderiza nada y no registra ningún listener.
 *
 * El pointermove no hace trabajo: solo guarda coordenadas. El dibujo ocurre
 * en un loop de requestAnimationFrame independiente, que además se apaga
 * solo al alcanzar el objetivo y se despierta con el próximo movimiento.
 */
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  // Se re-evalúa en vivo: el usuario puede activar "reducir movimiento"
  // o conectar un mouse sin recargar la página.
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
    const el = glowRef.current;
    if (!el) return;

    // objetivo = cursor real. x/y = lo que se dibuja, que lo persigue.
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let frame = 0;

    const LERP = 0.08; // fracción de acercamiento por frame → ~250ms de lag
    const EPSILON = 0.5; // por debajo de medio píxel ya no se percibe

    const place = () => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };

    const draw = () => {
      x += (targetX - x) * LERP;
      y += (targetY - y) * LERP;
      place();

      // Dormir al llegar. Sin esto quedaría un rAF corriendo para siempre
      // redibujando lo mismo.
      if (Math.abs(targetX - x) < EPSILON && Math.abs(targetY - y) < EPSILON) {
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      el.dataset.live = "true"; // primer movimiento: aparece
      if (!frame) frame = requestAnimationFrame(draw); // despertar
    };

    place(); // posición inicial sin animar
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  return <div ref={glowRef} className="cursor-glow" aria-hidden="true" />;
}
