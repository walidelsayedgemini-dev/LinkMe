import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The support line is intentionally obfuscated: the number is stored as a
 * base64 payload and only resolved when a visitor actually opens the chat, so
 * it is never rendered as visible text anywhere on the site.
 */
export { openWhatsApp } from "@/lib/whatsapp";
import { openWhatsApp } from "@/lib/whatsapp";

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.09 3.2 5.07 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.86 9.86 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.13c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.13.82.84-3.05-.2-.31a8.2 8.2 0 0 1-1.26-4.34c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23z" />
    </svg>
  );
}

const POS_KEY = "linkme:wa-pos";

type Pos = { x: number; y: number };

function readPos(): Pos | null {
  try {
    const raw = window.localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Pos;
    if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) return parsed;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Floating WhatsApp shortcut. Users can drag it anywhere on screen — the spot
 * is remembered, and a plain tap still opens the chat.
 */
export function WhatsAppFab({ className }: { className?: string }) {
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ active: false, moved: false, offsetX: 0, offsetY: 0, startX: 0, startY: 0 });
  const ref = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const stored = readPos();
    if (stored) setPos(clamp(stored.x, stored.y));
    const resize = () => setPos(current => {
      if (!current) return null;
      const next = clamp(current.x, current.y);
      try { window.localStorage.setItem(POS_KEY, JSON.stringify(next)); } catch { /* private browser */ }
      return next;
    });
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    return () => { window.removeEventListener("resize", resize); window.removeEventListener("orientationchange", resize); };
  }, []);

  const clamp = (x: number, y: number): Pos => {
    const width = ref.current?.offsetWidth ?? 48;
    const height = ref.current?.offsetHeight ?? 48;
    const maxX = window.innerWidth - width - 8;
    const maxY = window.innerHeight - height - 8;
    return { x: Math.min(Math.max(8, x), Math.max(8, maxX)), y: Math.min(Math.max(8, y), Math.max(8, maxY)) };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = {
      active: true,
      moved: false,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current.active) return;
    const dx = event.clientX - drag.current.startX;
    const dy = event.clientY - drag.current.startY;
    if (!drag.current.moved && Math.hypot(dx, dy) < 6) return;
    drag.current.moved = true;
    setDragging(true);
    setPos(clamp(event.clientX - drag.current.offsetX, event.clientY - drag.current.offsetY));
  };

  const endDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (drag.current.moved) {
      setPos(current => {
        if (current) {
          try {
            window.localStorage.setItem(POS_KEY, JSON.stringify(current));
          } catch {
            // ignore
          }
        }
        return current;
      });
      event.preventDefault();
    }
    drag.current.active = false;
    setDragging(false);
  };

  const style: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y, bottom: "auto", right: "auto" }
    : {};

  return (
    <button
      ref={ref}
      type="button"
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={event => {
        if (drag.current.moved) {
          event.preventDefault();
          drag.current.moved = false;
          return;
        }
        openWhatsApp();
      }}
      title="اسحبني لأي مكان · اضغط للتواصل"
      aria-label="تواصل معنا على واتساب — تقدر تسحبه لأي مكان"
      className={cn(
        "group fixed bottom-24 left-4 z-40 grid size-12 touch-none place-items-center rounded-full bg-[#25D366] text-sm font-semibold text-white shadow-[0_12px_26px_-10px_rgba(37,211,102,0.9)] transition-[transform,box-shadow] duration-200 select-none hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-10px_rgba(37,211,102,0.95)] sm:bottom-6 sm:left-6 sm:flex sm:h-12 sm:w-auto sm:gap-2 sm:ps-3.5 sm:pe-4",
        dragging ? "cursor-grabbing scale-105 shadow-[0_18px_36px_-8px_rgba(37,211,102,0.95)]" : "cursor-grab",
        className,
      )}
    >
      <WhatsAppIcon className="size-6 sm:size-5" />
      <span className="hidden sm:inline">واتساب</span>
      {!dragging && (
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#25D366] ring-2 ring-white">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]" />
        </span>
      )}
    </button>
  );
}
