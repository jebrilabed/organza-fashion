import Link from "next/link";
import Image from "next/image";
import { Locale } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { getPublicSiteData } from "@/lib/seo/site-data";
import { storefrontMessages as messages } from "@/lib/storefront/messages";
import { whatsappUrl } from "@/lib/utils/whatsapp";

export async function StorefrontFooter() {
  const [publicPages, storeData] = await Promise.all([
    prisma.contentPageTranslation.findMany({ where: { locale: Locale.AR, slug: { notIn: ["account", "admin", "api", "assistant", "cart", "categories", "checkout", "design-system", "faq", "login", "orders", "products", "register", "search"] }, contentPage: { isActive: true } }, orderBy: [{ contentPage: { pageKey: "asc" } }], select: { title: true, slug: true, contentPage: { select: { pageKey: true } } } }).catch(() => []),
    getPublicSiteData(),
  ]);
  const hasContactDetails = Boolean(storeData.whatsappNumber || storeData.email || storeData.address || storeData.instagramUrl || storeData.facebookUrl);
  const hasDirectContact = Boolean(storeData.whatsappNumber || storeData.email || storeData.address);
  const hasSocialLinks = Boolean(storeData.instagramUrl || storeData.facebookUrl);
  const hasContactPage = publicPages.some((page) => page.contentPage.pageKey === "contact");

  return (
    <footer className="store-footer">
      <div className="page-container store-footer__inner">
        <div className="store-footer__brand">
          <Link href="/ar" className="store-footer__brand-link">
            <span className="store-footer__logo-mark">
              <Image alt="" height={48} src="/brand/organza-fashion.png" width={48} />
            </span>
            <span className="store-footer__wordmark">{storeData.storeName || messages.ar.brand}</span>
          </Link>
          <p className="store-footer__desc">
            {storeData.storeDescription || "دار أزياء تجمع بين الحرفية الرفيعة والتصميم المعاصر في قطع أنيقة لكل مناسبة."}
          </p>
          {hasDirectContact && (
            <div className="store-footer__contact">
              {storeData.whatsappNumber && (
                <a href={whatsappUrl(storeData.whatsappNumber, `مرحباً، أود الاستفسار عن ${storeData.storeName}`)} target="_blank" rel="noopener noreferrer" dir="ltr" className="store-footer__whatsapp">
                  {storeData.whatsappNumber}
                </a>
              )}
              {storeData.email && <a href={`mailto:${storeData.email}`}>{storeData.email}</a>}
              {storeData.address && <span>{storeData.address}</span>}
            </div>
          )}
          {hasSocialLinks && (
            <nav aria-label="حساباتنا على وسائل التواصل الاجتماعي" className="store-footer__socials">
              {storeData.instagramUrl && (
                <a href={storeData.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="إنستغرام" className="store-footer__social-link">
                  <InstagramIcon /><span>إنستغرام</span>
                </a>
              )}
              {storeData.facebookUrl && (
                <a href={storeData.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="فيسبوك" className="store-footer__social-link">
                  <FacebookIcon /><span>فيسبوك</span>
                </a>
              )}
            </nav>
          )}
        </div>
        <nav aria-label="روابط المتجر" className="store-footer__nav">
          <Link href="/ar">{messages.ar.home}</Link>
          <Link href="/ar/products">{messages.ar.products}</Link>
          {publicPages.map((page) => <Link href={`/ar/${encodeURIComponent(page.slug)}`} key={page.slug}>{page.title}</Link>)}
          {!hasContactPage && hasContactDetails && <Link href="/ar/contact">تواصل معنا</Link>}
          <Link href="/ar/cart">{messages.ar.cart}</Link>
          <Link href="/ar/account">{messages.ar.account}</Link>
        </nav>
        <p className="store-footer__copyright">
          © {new Date().getFullYear()} {storeData.storeName || messages.ar.brand}. جميع الحقوق محفوظة.
        </p>
        <div className="store-footer__credit">
          <p>تنفيذ وتطوير الموقع: <strong>المهندس جبريل عابد</strong></p>
          <a className="store-footer__whatsapp" href={whatsappUrl("+972593478714")} target="_blank" rel="noopener noreferrer" dir="ltr" aria-label="تواصل مع المهندس جبريل عابد عبر واتساب">
            0593478714
          </a>
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="store-footer__social-icon"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.5" cy="6.8" r="1.1" fill="currentColor" /></svg>;
}

function FacebookIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="store-footer__social-icon"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.3v3h2.8v8z" /></svg>;
}
