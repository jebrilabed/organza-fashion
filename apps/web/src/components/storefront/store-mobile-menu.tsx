"use client";

import { useRef, type ReactNode } from "react";

export function StoreMobileMenu({ children, label }: { children: ReactNode; label: string }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const closeMenu = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  return (
    <details className="store-mobile-menu" ref={detailsRef}>
      <summary aria-label="فتح القائمة">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        <span>القائمة</span>
      </summary>
      <nav
        aria-label={label}
        className="store-mobile-menu__panel"
        onClick={(event) => {
          const target = event.target;
          if (target instanceof Element && target.closest("a, button")) closeMenu();
        }}
        onSubmit={closeMenu}
      >
        {children}
      </nav>
    </details>
  );
}