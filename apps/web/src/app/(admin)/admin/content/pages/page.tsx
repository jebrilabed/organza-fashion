import Link from "next/link";
import { Badge, Card, EmptyState, Input } from "@/components/ui";
import { adminMessages as messages } from "@/lib/admin/messages";
import { ADMIN_PAGE_SIZE } from "@/lib/admin/config";
import { Prisma } from "@/generated/prisma/client";
import { requireAdminPage } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";

export default async function ContentPagesList({ searchParams }: { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }) {
  await requireAdminPage();
  const params = await searchParams;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (rawQuery ?? "").trim().slice(0, 100);
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const pageValue = Number.parseInt(rawPage ?? "1", 10);
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const where: Prisma.ContentPageWhereInput = query ? {
      OR: [
        { pageKey: { contains: query, mode: "insensitive" } },
        { translations: { some: { locale: "AR", OR: [
          { title: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
        ] } } },
      ],
    } : {};
  const [total, pages] = await Promise.all([
    prisma.contentPage.count({ where }),
    prisma.contentPage.findMany({
      where,
      orderBy: [{ pageKey: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { translations: { where: { locale: "AR" }, take: 1 } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const pageHref = (target: number) => `/admin/content/pages?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(target > 1 ? { page: String(target) } : {}) })}`;
  return <div className="admin-page">
    <header className="admin-page__header"><div><h1>صفحات المتجر</h1><p>الصفحات العامة والمحتوى التعريفي والسياسات.</p></div><Link className="ui-button ui-button--primary" href="/admin/content/pages/new">إضافة صفحة</Link></header>
    <Card><form className="admin-toolbar" method="get"><Input label="ابحث بالعنوان أو الرابط أو المفتاح" name="q" type="search" defaultValue={query} /><button className="ui-button ui-button--outline" type="submit">بحث</button></form></Card>
    {pages.length ? <>
      <div className="ui-table-wrap"><table className="ui-table"><thead><tr><th>العنوان</th><th>مفتاح الصفحة</th><th>الرابط</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>
      {pages.map((page) => { const translation = page.translations[0]; return <tr key={page.id}>
        <td>{translation?.title ?? page.pageKey}</td><td dir="ltr">{page.pageKey}</td><td dir="ltr">{translation ? `/ar/${translation.slug}` : "لا توجد ترجمة عربية"}</td>
        <td><Badge variant={page.isActive && translation ? "success" : "warning"}>{page.isActive && translation ? "منشورة" : "مسودة"}</Badge></td>
        <td><Link className="ui-button ui-button--ghost ui-button--small" href={`/admin/content/pages/${page.id}`}>تعديل</Link></td>
      </tr>; })}
      </tbody></table></div>
      {totalPages > 1 && <div className="admin-pagination"><p>{messages.ar.page.replace("{page}", String(page)).replace("{pages}", String(totalPages))}</p><div className="admin-pagination__links">{page > 1 && <Link href={pageHref(page - 1)}>→ {messages.ar.previous}</Link>}{page < totalPages && <Link href={pageHref(page + 1)}>{messages.ar.next} ←</Link>}</div></div>}
    </> : <EmptyState title="لا توجد صفحات بعد" description="أنشئ صفحات السياسات ومعلومات المتجر من المحتوى الحالي." action={<Link className="ui-button ui-button--primary" href="/admin/content/pages/new">إضافة صفحة</Link>} />}
  </div>;
}
