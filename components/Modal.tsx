"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
};

export function Modal({ onClose, children, wide }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  if (!mounted) return null;

  // Rendered in <body> so that ancestors with backdrop-filter/transform
  // (e.g. the sticky header) cannot become the containing block of "fixed".
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className={`max-h-[92dvh] w-full animate-pop overflow-y-auto rounded-3xl border border-white/10 bg-[#1a1233] p-6 shadow-2xl ${
          wide ? "max-w-xl" : "max-w-sm"
        }`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
