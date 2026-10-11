import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/auth";
import { adminMessages as messages } from "@/lib/admin/messages";
import { Button } from "@/components/ui";
import { AdminMobileMenu, AdminNavigation } from "./admin-navigation";

export function AdminShell({ children, email }: { children: React.ReactNode; email: string | null }) {
  return (
    <div className="admin-shell" dir="rtl">
      <aside className="admin-sidebar" aria-label={messages.ar.admin}>
        <Link className="admin-brand" href="/admin" aria-label={messages.ar.admin}>
          <span className="admin-brand__mark">
            <Image alt="" height={48} src="/brand/organza-fashion.png" width={48} />
          </span>
          <span><strong>{messages.ar.brand}</strong><small>{messages.ar.admin}</small></span>
        </Link>
        <AdminNavigation variant="sidebar" />
        <Link aria-label={messages.ar.openStore} className="ui-button ui-button--outline admin-store-link" href="/ar">
          <StoreIcon /><span>{messages.ar.openStore}</span>
        </Link>
        <div className="admin-sidebar__footer">
          <span className="admin-identity__avatar" aria-hidden="true">{email?.slice(0, 1).toLocaleUpperCase("ar") ?? "م"}</span>
          <span className="admin-identity__text"><strong>{messages.ar.admin}</strong><small dir="ltr">{email ?? ""}</small></span>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/ar/login" }); }}>
            <Button type="submit" variant="ghost" size="small" aria-label={messages.ar.signOut}>↪</Button>
          </form>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-mobile-header">
          <Link href="/admin" aria-label={messages.ar.admin} className="admin-brand admin-brand--compact">
            <span className="admin-brand__mark">
              <Image alt="" height={48} src="/brand/organza-fashion.png" width={48} />
            </span>
          </Link>
          <div className="admin-mobile-header__tools">
            <span className="admin-mobile-identity" dir="ltr">{email ?? ""}</span>
            <Link aria-label={messages.ar.openStore} className="ui-button ui-button--outline admin-store-link admin-store-link--mobile" href="/ar" title={messages.ar.openStore}>
              <StoreIcon /><span>{messages.ar.openStore}</span>
            </Link>
            <AdminMobileMenu />
            <form action={async () => { "use server"; await signOut({ redirectTo: "/ar/login" }); }}>
              <Button type="submit" variant="outline" size="small">{messages.ar.signOut}</Button>
            </form>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

function StoreIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 10.5V20h16v-9.5M3 9l2-5h14l2 5M3 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0M9 20v-6h6v6" /></svg>;
}
