import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/auth";
import { getCartCount } from "@/lib/storefront/cart";
import { storefrontMessages as messages } from "@/lib/storefront/messages";
import { phase7Messages } from "@/lib/phase7/messages";

async function storefrontSignOut() {
  "use server";
  await signOut({ redirectTo: "/ar/login" });
}

export async function StorefrontHeader() {
  let count = 0;
  let isSignedIn = false;
  const storeName = messages.ar.brand;
  let accountHref = "/ar/login";
  let accountLabel: string = messages.ar.login;
  try {
    const session = await auth();
    if (session?.user) {
      isSignedIn = true;
      accountHref = "/ar/account";
      accountLabel = messages.ar.account;
      if (session.user.role === "ADMIN") {
        accountHref = "/admin";
        accountLabel = "لوحة التحكم";
      }
    }
  } catch {
    // Session lookup failures use the signed-out navigation state.
  }
  try {
    count = await getCartCount();
  } catch {
    // The page-level error state remains available if database-backed content is offline.
  }
  return (
    <header className="store-header">
      <div className="store-header__announcement">organza fashion <span aria-hidden="true">·</span> أناقة التفاصيل في كل إطلالة</div>
      <div className="page-container store-header__inner">
        <Link href="/ar" className="store-brand" aria-label={`${storeName} — ${messages.ar.home}`}>
          <span className="store-brand__mark">
            <Image alt="" height={60} src="/brand/organza-fashion.png" width={60} />
          </span>
          <span className="store-brand__name">{storeName}</span>
        </Link>
        <nav aria-label={messages.ar.home} className="store-nav store-nav--desktop">
          <Link href="/ar">{messages.ar.home}</Link>
          <Link href="/ar/products">{messages.ar.products}</Link>
          {isSignedIn && <Link href="/ar/orders">{messages.ar.orderHistory}</Link>}
          <form action="/ar/search" className="store-header__search" method="get">
            <input aria-label={messages.ar.search} maxLength={100} name="q" placeholder="ابحثي في التشكيلة" type="search" />
            <button aria-label="بحث" type="submit"><SearchIcon /></button>
          </form>
        </nav>
        <div className="store-header__actions">
          <Link aria-label={accountLabel} className="store-icon-link store-header__account" href={accountHref}>
            <AccountIcon />
            <span>{accountLabel}</span>
          </Link>
          {isSignedIn && <form action={storefrontSignOut} className="store-header__sign-out-form">
            <button className="store-icon-link store-header__sign-out" type="submit">{phase7Messages.ar.signOut}</button>
          </form>}
          <Link aria-label={messages.ar.cartCount.replace("{count}", String(count))} className="store-icon-link store-header__cart" href="/ar/cart">
            <CartIcon />
            <span>{messages.ar.cart}</span>
            <span className="store-cart-count">{count}</span>
          </Link>
          <details className="store-mobile-menu">
            <summary aria-label="فتح القائمة">
              <MenuIcon />
              <span>القائمة</span>
            </summary>
            <nav aria-label={messages.ar.home} className="store-mobile-menu__panel">
              <Link href="/ar">{messages.ar.home}</Link>
              <Link href="/ar/products">{messages.ar.products}</Link>
              {isSignedIn && <Link href="/ar/orders">{messages.ar.orderHistory}</Link>}
              <form action="/ar/search" method="get">
                <input aria-label={messages.ar.search} maxLength={100} name="q" placeholder="ابحثي في التشكيلة" type="search" />
                <button type="submit">بحث</button>
              </form>
              <Link href={accountHref}>{accountLabel}</Link>
              {isSignedIn && <form action={storefrontSignOut} className="store-header__mobile-sign-out">
                <button type="submit">{phase7Messages.ar.signOut}</button>
              </form>}
              {!isSignedIn && <Link href="/ar/register">{messages.ar.register}</Link>}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

function AccountIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.4" /><path d="M4.5 20c.7-3.5 3.2-5.3 7.5-5.3s6.8 1.8 7.5 5.3" /></svg>;
}

function CartIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 1.9-1.4L22 8H6" /><circle cx="9.5" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg>;
}

function MenuIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></svg>;
}
