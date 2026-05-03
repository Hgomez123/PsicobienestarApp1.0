import { useEffect, useRef } from "react";

/**
 * Hook de accesibilidad para modales:
 * - Cierra el modal al presionar Escape mientras está abierto.
 * - Devuelve el foco al elemento que estaba activo cuando el modal se abrió,
 *   al cerrarse o desmontarse el modal.
 *
 * Uso: useModalA11y(open, onClose) en el componente que renderiza el modal.
 */
export function useModalA11y(open: boolean, onClose: () => void) {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
      previousFocusRef.current?.focus();
    };
  }, [open]);
}
