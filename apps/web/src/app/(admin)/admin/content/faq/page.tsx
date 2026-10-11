import Link from "next/link";
import { Badge, Card, EmptyState, Input } from "@/components/ui";
import { adminMessages as messages } from "@/lib/admin/messages";
import { ADMIN_PAGE_SIZE } from "@/lib/admin/config";
import { requireAdminPage } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";

export default async function AdminFaqList({ searchParams }: { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }) {
  await requireAdminPage();
  const params = await searchParams;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (rawQuery ?? "").trim().slice(0, 100);
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const pageValue = Number.parseInt(rawPage ?? "1", 10);
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const where = query ? { translations: { some: { locale: "AR" as const, OR: [{ question: { contains: query, mode: "insensitive" as const } }, { answer: { contains: query, mode: "insensitive" as const } }] } } } : {};
  const [total, faqs] = await Promise.all([
    prisma.fAQ.count({ where }),
    prisma.fAQ.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { translations: { where: { locale: "AR" }, take: 1 } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const pageHref = (target: number) => `/admin/content/faq?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(target > 1 ? { page: String(target) } : {}) })}`;
  return <div className="admin-page">
    <header className="admin-page__header"><div><h1>الأسئلة الشائعة</h1><p>تظهر الأسئلة النشطة فقط في صفحة المتجر ويستخدمها مساعد AI.</p></div><Link className="ui-button ui-button--primary" href="/admin/content/faq/new">إضافة سؤال</Link></header>
    <Card><form className="admin-toolbar" method="get"><Input label="ابحث في الأسئلة والإجابات" name="q" type="search" defaultValue={query} /><button className="ui-button ui-button--outline" type="submit">بحث</button></form></Card>
    {faqs.length ? <>
      <div className="ui-table-wrap"><table className="ui-table"><thead><tr><th>السؤال</th><th>الترتيب</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>
      {faqs.map((faq) => <tr key={faq.id}><td>{faq.translations[0]?.question ?? "لا توجد ترجمة عربية"}</td><td>{faq.sortOrder}</td><td><Badge variant={faq.isActive && faq.translations.length ? "success" : "warning"}>{faq.isActive && faq.translations.length ? "منشور" : "مسودة"}</Badge></td><td><Link className="ui-button ui-button--ghost ui-button--small" href={`/admin/content/faq/${faq.id}`}>تعديل</Link></td></tr>)}
      </tbody></table></div>
      {totalPages > 1 && <div className="admin-pagination"><p>{messages.ar.page.replace("{page}", String(page)).replace("{pages}", String(totalPages))}</p><div className="admin-pagination__links">{page > 1 && <Link href={pageHref(page - 1)}>→ {messages.ar.previous}</Link>}{page < totalPages && <Link href={pageHref(page + 1)}>{messages.ar.next} ←</Link>}</div></div>}
    </> : <EmptyState title="لا توجد أسئلة شائعة" description="أضف الأسئلة التي يحتاج إليها عملاء المتجر." action={<Link className="ui-button ui-button--primary" href="/admin/content/faq/new">إضافة سؤال</Link>} />}
  </div>;
}
