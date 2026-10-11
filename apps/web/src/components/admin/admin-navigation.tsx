"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { adminMessages as messages } from "@/lib/admin/messages";

const links = [
  { href: "/admin", label: messages.ar.dashboard, mark: "⌂" },
  { href: "/admin/products", label: messages.ar.products, mark: "◇" },
  { href: "/admin/categories", label: messages.ar.categories, mark: "▦" },
  { href: "/admin/inventory", label: messages.ar.inventory, mark: "▤" },
  { href: "/admin/orders", label: messages.ar.orders, mark: "▧" },
  { href: "/admin/settings", label: messages.ar.storeSettings, mark: "⚙" },
  { href: "/admin/notifications", label: messages.ar.notifications, mark: "◉" },
];

export function AdminNavigation({ variant, onNavigate }: { variant: "sidebar" | "mobile"; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className={variant === "sidebar" ? "admin-nav" : "admin-mobile-nav"} aria-label={messages.ar.admin}>
      {links.map(({ href, label, mark }) => {
        const current = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return <Link aria-current={current ? "page" : undefined} className={variant === "sidebar" ? `admin-nav__link${current ? " is-current" : ""}` : `admin-mobile-nav__link${current ? " is-current" : ""}`} href={href} key={href} onClick={onNavigate}>
          {variant === "sidebar" && <span aria-hidden="true">{mark}</span>}{label}
        </Link>;
      })}
    </nav>
  );
}

export function AdminMobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="admin-mobile-menu">
      <button
        aria-controls={open ? "admin-mobile-drawer" : undefined}
        aria-expanded={open}
        aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
        className="admin-menu-trigger"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
          {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>
      {open && (
        <div className="admin-mobile-drawer-layer">
          <button aria-label="إغلاق القائمة" className="admin-mobile-drawer-backdrop" onClick={() => setOpen(false)} type="button" />
          <aside aria-label={messages.ar.admin} className="admin-mobile-drawer" id="admin-mobile-drawer">
            <div className="admin-mobile-drawer__header">
              <strong>{messages.ar.admin}</strong>
              <button aria-label="إغلاق القائمة" className="admin-mobile-drawer__close" onClick={() => setOpen(false)} type="button">×</button>
            </div>
            <AdminNavigation onNavigate={() => setOpen(false)} variant="sidebar" />
          </aside>
        </div>
      )}
    </div>
  );
}
