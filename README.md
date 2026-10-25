# 👗 Organza Fashion | أورجانزا فاشن

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**منصة تجارة إلكترونية متطورة وشاملة للأزياء الراقية، مصممة باللغة العربية أولاً (Arabic-First RTL) ومدعومة بالذكاء الاصطناعي.**

[الميزات](#-الميزات-والخصائص-الرئيسية) • [المعمارية](#-المعمارية-الهندسية-للنظام) • [التقنيات](#-التقنيات-وحزم-البرمجيات) • [التشغيل المحلي](#-دليل-التثبيت-والتشغيل-المحلي) • [قاعدة البيانات](#-إدارة-قاعدة-البيانات-prisma) • [لوحة التحكم](#-لوحة-تحكم-الإدارة-admin-dashboard) • [المساعد الذكي](#-المساعد-الذكي-ai-shopping-assistant) • [النشر](#-دليل-النشر-في-بيئة-الإنتاج)

</div>

---

## 📖 نظرة عامة على المشروع (Project Overview)

**أورجانزا فاشن (Organza Fashion)** هي منصة تسوق إلكتروني متكاملة وسريعة مخصصة لقطاع الأزياء والموضة الراقية، تم بناؤها وفق أحدث المعايير البرمجية لعام 2026. ترتكز المنصة على معمارية أحادية المستودع (Monorepo) تجمع بين واجهة أمامية فائقة السرعة مبنية بواسطة **Next.js 16** و **React 19** مع واجهة خلفية متينة تعتمد على **PostgreSQL** و **Prisma 7**، بالإضافة إلى خدمة ذكاء اصطناعي مستقلة مبنية بـ **FastAPI** و **LangChain** مدعومة بنماذج **Google Gemini** ومحرك إشعارات موثوق عبر **WhatsApp Cloud API**.

تم تصميم المنصة بالكامل لتدعم اللغة العربية واتجاه العرض من اليمين إلى اليسار (RTL) بطريقة أصيلة، مع دعم التوسع وتعدد اللغات والعملات، وتوفير تجربة تسوق فخمة وسلسة لكل من الزائر المسجل والضيف، بجانب لوحة تحكم إدارية غنية لإدارة المنتجات، المخزون، الطلبات، المحتوى، والعمليات التشغيلية اليومية.

---

## 🏛️ المعمارية الهندسية للنظام (Architecture)

يعتمد المشروع على بنية متماسكة تفصل المسؤوليات وتضمن أعلى مستويات الأداء والأمان:

```mermaid
flowchart TB
    subgraph Client["العميل والمستخدم (Client Layer)"]
        Storefront["واجهة المتجر العربي (Next.js 16 Storefront - RTL)"]
        AdminDashboard["لوحة التحكم الإدارية المحمية (/admin)"]
    end

    subgraph WebCore["تطبيق الويب المركزي (Next.js App Router)"]
        ServerActions["Server Actions & API Routes"]
        AuthModule["نظام الجلسات والمصادقة (Auth.js v5)"]
        PrismaAdapter["Prisma ORM 7 + PgBouncer Adapter"]
        OutboxQueue["طابور الإشعارات (Transactional Outbox)"]
    end

    subgraph Services["الخدمات وقواعد البيانات (Backend & Services)"]
        Postgres[(قاعدة بيانات PostgreSQL)]
        FastAPIService["خدمة الذكاء الاصطناعي (FastAPI Microservice)"]
        GeminiLLM["نماذج Google Gemini"]
        WhatsAppAPI["WhatsApp Cloud API"]
    end

    Storefront --> ServerActions
    AdminDashboard --> ServerActions
    ServerActions --> AuthModule
    ServerActions --> PrismaAdapter
    PrismaAdapter --> Postgres
    ServerActions --> OutboxQueue

    ServerActions <-->|Server-to-Server Internal Token| FastAPIService
    FastAPIService --> GeminiLLM
    OutboxQueue -->|Worker / Cron Dispatcher| WhatsAppAPI
```

---

## ✨ الميزات والخصائص الرئيسية (Key Features)

### 🛍️ 1. واجهة المتجر وتجربة العميل (Storefront)
- **تصميم فاخر باللغة العربية أولاً (Arabic-First RTL)**: تم اعتماد خطوط عربية عصرية ورموز وألوان متناسقة تدعم الاتجاه العربي الأصيل باستخدام خصائص CSS المنطقية (`margin-inline`, `padding-inline`, `border-inline-start`).
- **الصفحة الرئيسية التفاعلية**: بنرات تحفيزية، استعراض مجموعات الأزياء، كاروسيل تحريري (Editorial Carousel)، وقسم المنتجات المميزة وقيم المتجر.
- **كتالوج المنتجات وتصفح الفئات**: فرز متقدم (الأحدث، السعر من الأقل للأعلى/العكس)، تصنيفات فرعية شجرية، وفلترة سريعة مع ترقيم الصفحات (Pagination).
- **عرض تفصيلي غني للمنتج**: معرض صور متقدم مع دعم التكبير والتبديل السلس، ومحدد خيارات ذكي للمقاسات، الألوان، وأنواع الأقمشة مع تحديث فوري للمخزون والسعر ورمز SKU.
- **حالات توفر متقدمة**: دعم المنتجات المتوفرة حالياً، المنتجات قيد الشحن (In-Transit) مع تقدير موعد الوصول، وحالة نفاد الكمية.

### 🛒 2. السلة والدفع وحياة الطلب (Cart & Checkout)
- **سلة التسوق للضيوف والمسجلين**: سلة متزامنة تعمل للزوار غير المسجلين عبر كوكي مشفر وموقع بأمان، مع دمج تلقائي لعناصر السلة فور تسجيل دخول العميل.
- **التحقق من المخزون في الوقت الفعلي**: منع تجاوز الكميات المتاحة والتأكد من توافر المخزون اللحظي لكل SKU.
- **إتمام الطلب المقاوم للتكرار (Idempotent Checkout)**: حماية تامة ضد تكرار إنشاء الطلبات عند ضغط زر الشراء عدة مرات مع توليد مفتاح `idempotencyKey` فريد.
- **طرق دفع مرنة**: الدفع عند الاستلام (Cash on Delivery)، والتحويل البنكي (Bank Transfer) مع إمكانية رفع إيصال الدفع البنكي وتخزينه بأمان لمراجعته من الإدارة.
- **تتبع الطلبات**: تتبع مباشر لحالة الطلب برقم الطلب ورقم الهاتف مع دورة حياة واضحة (`معلق -> مؤكد -> قيد التجهيز -> تم الشحن -> تم التوصيل -> ملغي`).

### 👤 3. حسابات العملاء وإدارة العناوين (Customer Accounts)
- **إدارة الملف الشخصي**: تسجيل الدخول بالهاتف أو البريد، تعديل البيانات الشخصية وحفظ عناوين الشحن المتعددة مع تعيين العنوان الافتراضي.
- **سجل الطلبات**: استعراض كافة الطلبات السابقة وتفاصيل المنتجات المشتراة، والأسعار الملتقطة في وقت الشراء (Snapshot Preservation).
- **نظام طلبات الاستبدال (Exchange Requests)**: نموذج متكامل لطلب استبدال منتج من قبل العميل مع تحديد السبب وتأكيد سياسة المتجر، ومتابعة حالة المراجعة والموافقة من الإدارة.

### 📊 4. لوحة تحكم الإدارة (Admin Dashboard - `/admin`)
- **لوحة مراقبة تشغيلية حية (Executive Dashboard)**: مؤشرات فورية للإيرادات حسب العملة، إجمالي الطلبات مقسمة حسب الحالة، تنبيهات فورية للمنتجات منخفضة المخزون، وسجل النشاط الإداري الأخير.
- **إدارة كتالوج المنتجات**: إضافة وتعديل وحذف وأرشفة المنتجات، الترجمة باللغتين العربية والإنجليزية، إدارة الـ Slug مع توليد تحويلات تلقائية (301 Redirects)، وتحديد أسعار المقارنة (خصومات وتخفيضات).
- **إدارة متغيرات الـ SKU والمخزون**: إضافة الألوان، المقاسات، الأكواد، التحكم الدقيق في المخزون وتحديث الكميات بحماية ضد التضارب (Optimistic Concurrency).
- **إدارة معرض الصور**: رفع وتنظيم الصور عبر الروابط وتعيين ترتيب العرض والنصوص البديلة (Alt Text).
- **إدارة التصنيفات الشجرية (Categories Tree)**: تنظيم الأقسام والتصنيفات الفرعية وأولويات الترتيب مع حماية منع الحذف في حال ارتباط منتجات بالتصنيف.
- **إدارة الطلبات والشحن**: تصفية الطلبات حسب الحالة والتواريخ والعميل، مراجعة وتعديل الحالات، استرجاع المخزون تلقائياً عند الإلغاء، وفحص إيصالات الدفع البنكي.
- **نظام إدارة المحتوى (CMS)**: إدارة الأسئلة الشائعة (FAQ) وتصنيفاتها، وصفحات السياسات والشروط والأحكام (Content Pages) مع كامل حقول تحسين محركات البحث.
- **إعدادات المتجر العامة**: تخصيص اسم المتجر، العملة، أرقام التواصل والواتساب، تكاليف الشحن، وروابط شبكات التواصل الاجتماعي.
- **سجل التدقيق الإداري (Audit Logs)**: تسجيل كل إجراء إداري مع هوية المنفذ وتاريخه لضمان الأمان والمساءلة.

### 🤖 5. المساعد الذكي للتسوق (AI Shopping Assistant)
- **خدمة مستقلة مبنية بـ FastAPI**: تعمل كمعالج منفصل وخفيف الوزن، مما يضمن استمرار المتجر وسرعته حتى لو كانت الخدمة غير مفعلة.
- **مربوطة بـ Google Gemini & LangChain**: ذكاء اصطناعي يفهم استفسارات العملاء باللغة العربية ويقترح منتجات ملائمة ويوضح مواصفات الأزياء.
- **أدوات قراءة آمنة فقط (Read-Only Store Tools)**: لا يملك الذكاء الاصطناعي صلاحيات التعديل في قاعدة البيانات، بل يتصل بنقاط نهاية داخلية مشفرة برمز أمان خادم-إلى-خادم (`AI_INTERNAL_SERVICE_TOKEN`).
- **حفظ المحادثات بأمان**: دعم الدردشة للضيوف برموز عشوائية مشفرة، واستعراض حالة الطلبات للعملاء المسجلين بعد التأكد من صلاحياتهم.

### 📲 6. نظام إشعارات واتساب السحابي (WhatsApp Notifications)
- **نمط صندوق الصادر المالي (Transactional Outbox Pattern)**: يتم تسجيل الإشعار في جدول `notification_outbox` داخل نفس معاملة قاعدة البيانات لضمان عدم ضياع أي إشعار حتى عند انقطاع الشبكة.
- **تكامل رسمي مع WhatsApp Cloud API**: إرسال قوالب رسمية معتمدة عند إنشاء الطلب، تأكيده، تجهيزه، شحنه، وتوصيله.
- **إعادة المحاولة الذكية (Exponential Backoff)**: محرك مجدول يعالج الرسائل المعلقة ويعيد إرسالها تلقائياً مع تسجيل أسباب الخطأ والـ Provider Message ID.

### ⚡ 7. الأداء، محركات البحث والأمان (SEO & Security)
- **SEO متكامل**: عناوين ديناميكية، أوصاف وصفحات وصفحة خريطة الموقع (`/sitemap.xml`) وملف الروبوت (`/robots.txt`) بالعربية، وبيانات هيكلية قياسية Schema.org (Product, Organization, BreadcrumbList).
- **أمان عالي المستوى**:
  - ترويسات أمان قياسية (CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff).
  - تشفير كلمات المرور باستخدام Scrypt / Hashing الآمن.
  - كوكي آمن مشفر (HttpOnly, Secure, SameSite=Lax).
  - منع هجمات CSRF وSQL Injection بفضل Prisma ORM وNext.js Server Actions.

---

## 🛠️ التقنيات وحزم البرمجيات (Tech Stack)

| المجال | التقنية | الاستخدام والوصف |
|---|---|---|
| **Frontend Framework** | **Next.js 16 (App Router)** | إطار العمل الرئيسي لتطبيق الويب، يقدم سرعة خارقة عبر React Server Components. |
| **UI Library** | **React 19** | أحدث إصدار من مكتبة React مع دعم التفاعلية المتقدمة وإدارة الحالات. |
| **Language** | **TypeScript 5.9** | كتابة أكواد آمنة ومنيعة ضد الأخطاء النوعية في كامل المشروع. |
| **Styling** | **Tailwind CSS v4 & Vanilla CSS** | تصميم فاخر، مرن، عالي الأداء مع دعم الرموز المنطقية للاتجاه العربي (RTL). |
| **Database & ORM** | **PostgreSQL & Prisma 7** | تخزين البيانات مع مخطط علاقات قوي ومحكم وترحيلات مهيكلة ودعم تجميع الاتصالات (PgBouncer). |
| **Authentication** | **Auth.js v5 (NextAuth)** | إدارة جلسات المستخدمين والمدراء بأعلى درجات الأمان وحماية المسارات. |
| **AI Microservice** | **FastAPI & Python 3.11+** | خدمة خلفية سريعة ومستقلة لتشغيل المساعد الذكي للتسوق. |
| **AI Framework** | **LangChain & Google Gemini** | معالجة اللغة الطبيعية العربية وربط نموذج الذكاء الاصطناعي بأدوات المتجر. |
| **Messaging & Notifications**| **WhatsApp Cloud API** | إرسال رسائل التحديث اللحظي للعملاء عبر منصة ميتا الرسمية. |
| **Testing** | **Node.js Native Test Runner & Pytest** | اختبارات شاملة لوظائف الأمان، السلة، الدفع، لوحة التحكم، والإشعارات. |

---

## 📁 هيكل المجلدات والمشروع (Project Structure)

```text
Organza-Fashion/
├── apps/
│   ├── web/                          # تطبيق Next.js 16 (المتجر ولوحة التحكم)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (admin)/admin/    # صفحات لوحة التحكم الإدارية المحمية
│   │   │   │   │   ├── products/     # إدارة المنتجات وإضافتها
│   │   │   │   │   ├── categories/   # شجرة الفئات والتصنيفات
│   │   │   │   │   ├── inventory/    # إدارة المخزون وتحديث الأرصدة
│   │   │   │   │   ├── orders/       # متابعة وإدارة الطلبات
│   │   │   │   │   ├── content/      # إدارة صفحات المحتوى والسياسات
│   │   │   │   │   ├── notifications/# سجل إشعارات واتساب وحالات الإرسال
│   │   │   │   │   └── settings/     # إعدادات المتجر وتكاليف الشحن والعملات
│   │   │   │   ├── [locale]/(store)/ # مسارات واجهة المتجر العربي (/ar)
│   │   │   │   │   ├── products/     # استعراض الكتالوج والمنتج بالتفصيل
│   │   │   │   │   ├── cart/         # سلة المشتريات
│   │   │   │   │   ├── checkout/     # صفحة إتمام الطلب والدفع
│   │   │   │   │   ├── orders/       # تتبع ومراجعة تفاصيل الطلب
│   │   │   │   │   ├── account/      # حساب العميل والعناوين والاستبدال
│   │   │   │   │   ├── faq/          # الأسئلة الشائعة
│   │   │   │   │   └── search/       # البحث الحي في المنتجات
│   │   │   │   └── api/              # نقاط النهاية (Internal Tools, Webhooks, Health)
│   │   │   ├── components/
│   │   │   │   ├── admin/            # مكونات لوحة التحكم (الجداول، النماذج، المحررات)
│   │   │   │   ├── storefront/       # مكونات المتجر (الهيدر، الفوتر، البطاقات، السلة)
│   │   │   │   └── ui/               # مكونات واجهة المستخدم المشتركة القابلة لإعادة الاستخدام
│   │   │   ├── lib/                  # دوال النواة (قاعدة البيانات، الأمان، SEO، المدفوعات)
│   │   │   └── styles/               # تنسيقات التصميم والقوالب والخطوط
│   │   ├── tests/                    # حزم الاختبارات الآلية الشاملة
│   │   └── scripts/                  # سكربتات التهيئة مثل إنشاء حساب المدير (Bootstrap)
│   │
│   └── ai/                           # خدمة الذكاء الاصطناعي (FastAPI Microservice)
│       ├── app/
│       │   ├── main.py               # مدخل التطبيق ونقاط النهاية للدردشة والصحة
│       │   ├── chain.py              # منطق LangChain وربط أدوات المتجر
│       │   └── tools.py              # أدوات البحث واستعلام الطلبات عبر الويب
│       ├── tests/                    # اختبارات خدمة الذكاء الاصطناعي بـ Pytest
│       └── Dockerfile                # ملف التحزيم للحاويات ونشر Render
│
├── prisma/                           # قاعدة البيانات
│   ├── schema.prisma                 # مخطط النماذج والعلاقات والفهارس الجزئية
│   └── migrations/                   # سجل ترحيلات قاعدة البيانات التاريخية
│
├── docs/                             # التوثيق التقني المفصل
│   ├── ADMIN_DASHBOARD.md            # دليل لوحة التحكم الإدارية
│   ├── AI_ASSISTANT.md               # دليل المساعد الذكي وربط Gemini
│   ├── AUTHENTICATION.md             # دليل نظام المصادقة والصلاحيات
│   ├── BRAND-RTL-DESIGN-SYSTEM.md    # نظام التصميم وهوية المتجر والعربية
│   ├── DATABASE.md                   # دليل قاعدة البيانات وPgBouncer والاتصالات
│   ├── DEPLOYMENT.md                 # دليل النشر على Vercel و Render
│   ├── ENVIRONMENT.md                # دليل المتغيرات البيئية والأمان
│   ├── ORDERS_AND_CHECKOUT.md        # دليل السلة والدفع وحياة الطلب
│   ├── PERFORMANCE.md                # توثيق الأداء وسرعة التحميل
│   ├── SEO_AND_CONTENT.md            # دليل السيو وإدارة المحتوى والترجمات
│   ├── STORE_CONFIGURATION.md        # دليل إعدادات المتجر وحسابات العملاء
│   └── WHATSAPP_NOTIFICATIONS.md     # دليل تكامل وتفعيل واتساب كلاود
│
├── package.json                      # إدارة حزم الـ Monorepo والأوامر العامة
├── vercel.json                       # إعدادات النشر المتقدمة لمنصة Vercel
└── README.md                         # دليل المشروع الرئيسي
```

---

## 💻 دليل التثبيت والتشغيل المحلي (Installation & Setup)

### 📋 المتطلبات المسبقة (Prerequisites)
- **Node.js**: الإصدار `20.9.0` أو أحدث (يُفضل `Node.js 22 LTS`).
- **Python**: الإصدار `3.11` أو أحدث مع أداة `pip`.
- **قاعدة بيانات PostgreSQL**: قاعدة بيانات مستقلة (مثل Supabase أو Neon أو اتصال محلي).

---

### 1️⃣ تثبيت الاعتماديات (Install Dependencies)

افتح الطرفية (Terminal أو PowerShell) في مجلد المشروع الرئيسي:

```bash
# تثبيت حزم تطبيق الويب ومكتبات الـ Monorepo
npm install

# تثبيت مكتبات خدمة الذكاء الاصطناعي (Python)
python -m pip install -r apps/ai/requirements-dev.txt
```

---

### 2️⃣ ضبط المتغيرات البيئية (Environment Variables)

قم بإنشاء ملفات المتغيرات البيئية بناءً على القوالب المتوفرة:

```powershell
# في نظام ويندوز PowerShell
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item apps/ai/.env.example apps/ai/.env
```

#### 🔹 المتغيرات المطلوبة لتطبيق الويب (`apps/web/.env.local`):

| المتغير | الوصف | مثال / قيمة تجريبية |
|---|---|---|
| `SITE_URL` | رابط الموقع الأساسي (بدون شرطة مائلة في النهاية) | `http://localhost:3000` |
| `DATABASE_URL` | رابط الاتصال بقاعدة PostgreSQL (يدعم موجه الاتصالات PgBouncer عبر المنفذ 6543) | `postgresql://user:pass@host:6543/db?pgbouncer=true` |
| `DIRECT_URL` | رابط الاتصال المباشر لترحيلات Prisma (المنفذ 5432) | `postgresql://user:pass@host:5432/db` |
| `AUTH_SECRET` | مفتاح تشفير الجلسات والكوكيز (32 رمزاً على الأقل) | يمكن توليده عبر `npx auth secret` |
| `AI_SERVICE_URL` | عنوان خدمة الذكاء الاصطناعي | `http://127.0.0.1:8000` |
| `AI_INTERNAL_SERVICE_TOKEN` | رمز أمان مشفر ومشترك يربط الويب بالـ AI (32+ رمز) | أي رمز عشوائي سري متطابق بالجهتين |
| `WHATSAPP_*` | *(اختياري محلياً)* بيانات اعتماد WhatsApp Cloud API | بيانات Meta Developers |

#### 🔹 المتغيرات المطلوبة لخدمة الذكاء الاصطناعي (`apps/ai/.env`):

| المتغير | الوصف | مثال |
|---|---|---|
| `AI_ENVIRONMENT` | بيئة التشغيل | `development` |
| `AI_HOST` & `AI_PORT` | المضيف والمنفذ | `127.0.0.1` و `8000` |
| `AI_INTERNAL_SERVICE_TOKEN` | نفس الرمز السري المضبوط في `apps/web/.env.local` | `YOUR_SECRET_TOKEN_HERE` |
| `AI_WEB_TOOLS_URL` | نقطة نهاية أدوات المتجر التي يقرأ منها الـ AI | `http://127.0.0.1:3000/api/internal/ai/tools` |
| `GEMINI_API_KEY` | مفتاح واجهة برمجة Google Gemini | يُحصل عليه من Google AI Studio |
| `GEMINI_MODEL` | اسم النموذج المفضل | `gemini-1.5-flash` أو `gemini-2.0-flash` |

---

### 3️⃣ إعداد قاعدة البيانات وترحيلات Prisma (Database Setup)

تأكد من وضع روابط قاعدة البيانات في `apps/web/.env.local` ثم نفّذ الأوامر التالية من المجلد الرئيسي:

```bash
# 1. التحقق من صحة مخطط Prisma
npm run db:validate

# 2. توليد عميل Prisma Client
npm run db:generate

# 3. تطبيق الترحيلات على قاعدة البيانات
npm run db:migrate:dev -- --name init_schema
```

---

### 4️⃣ إنشاء حساب المدير الأول (Bootstrap Admin)

لإنشاء حساب مسؤول للوصول للوحة التحكم دون كلمة مرور افتراضية، نفّذ الأمر التالي مع تمرير رقم الهاتف وكلمة المرور في المتغيرات المؤقتة:

```powershell
# نظام Windows PowerShell:
$env:ADMIN_BOOTSTRAP_PHONE="+970590000000"; $env:ADMIN_BOOTSTRAP_PASSWORD="YourSecurePassword123"; npm run auth:bootstrap-admin
```

> 🔒 **ملاحظة أمنية**: يتم حذف المتغيرين من الذاكرة فور انتهاء العملية ولن يتم حفظهما في أي ملف.

---

### 5️⃣ تشغيل المشروع (Run Locally)

افتح طرفيتين مستقلتين:

#### الطرفية الأولى: تشغيل خادم الويب (Next.js):
```bash
npm run dev:web
```
- تصفح المتجر العربي: **`http://localhost:3000/ar`**
- تصفح لوحة التحكم: **`http://localhost:3000/admin`**
- معرض مكونات التصميم: **`http://localhost:3000/ar/design-system`** (يعمل أثناء التطوير فقط)
- فحص صحة التطبيق: **`http://localhost:3000/api/health`**

#### الطرفية الثانية: تشغيل خدمة الذكاء الاصطناعي (FastAPI):
```bash
python -m uvicorn app.main:app --reload --app-dir apps/ai
```
- فحص الجاهزية والاتصال: **`http://localhost:8000/health/ready`**

---

## 🧪 حزمة الاختبارات وفحص الجودة (Testing & Quality)

يحتوي المشروع على حزمة اختبارات شاملة تغطي كافة وظائف المتجر:

```bash
# الفحص اللغوي والأنماط
npm run lint:web

# فحص توافق الأنواع وتكامل TypeScript
npm run typecheck:web

# بناء مشروع الويب للتأكد من خلوه من الأخطاء
npm run build:web

# تنفيذ كافة اختبارات الوظائف الحيوية:
npm run test:auth        # مصادقة المستخدمين والجلسات
npm run test:admin       # صلاحيات ولوحة الإدارة
npm run test:cart        # دورة حياة السلة والكميات
npm run test:checkout    # الدفع، المخزون، ومنع التكرار
npm run test:orders      # سجل الطلبات وتغير الحالات
npm run test:phase11     # لوحة تحكم الإدارة ومؤشرات الأداء
npm run test:phase12     # نظام إشعارات واتساب
npm run test:phase13     # المساعد الذكي وحماية الأدوات
npm run test:phase14     # محركات البحث والبيانات المنظمة
npm run test:phase15     # الأداء وتحسين الموارد
npm run test:phase16     # معايير الأمان والتشفير
npm run test:deployment  # تكوينات النشر والإنتاج

# تشغيل اختبارات بايثون لخدمة الذكاء الاصطناعي:
python -m pytest -c apps/ai/pyproject.toml apps/ai/tests
```

---

## 🚀 دليل النشر السحابي (Production Deployment)

### 1. تطبيق الويب على منصة Vercel:
1. اربط مستودع المشروع بـ **Vercel**.
2. اجعل **Root Directory** هو المجلد الجذري للمشروع (`.`) لأن `package.json` ومجلد `prisma/` متواجدان بالجذر.
3. يتعرف ملف [vercel.json](vercel.json) تلقائياً على إعدادات البناء وتوليد عميل Prisma ثم بناء Next.js.
4. أضف كافة المتغيرات البيئية لبيئة الإنتاج من جدول إعدادات الويب (تأكد من تفعيل `DATABASE_SSL_MODE` و `DIRECT_URL`).

### 2. خدمة الذكاء الاصطناعي على منصة Render (Docker):
1. أنشئ **Web Service** جديدة وحدد مسار البناء (Build Context) كـ `apps/ai` وملف الـ Dockerfile كـ `apps/ai/Dockerfile`.
2. الحاوية مبنية على صورة رسمية لـ Python 3.12 آمنة وتعمل بمستخدم غير جذري (non-root).
3. اضبط مسار فحص الصحة (Health Check Path) على: `/health/live`.
4. اضبط المتغيرات البيئية الخاصة بـ Gemini والرمز السري المشترك `AI_INTERNAL_SERVICE_TOKEN`.

---

## 📚 روابط ومراجع التوثيق التقني (Documentation Index)

للاطلاع على الشروحات المعمارية والتفصيلية لكل جزء في المنصة:

- 📑 [دليل لوحة التحكم وإدارة الكتالوج](docs/ADMIN_DASHBOARD.md)
- 🤖 [دليل المساعد الذكي وتكامل Gemini](docs/AI_ASSISTANT.md)
- 🔐 [دليل الأمان والمصادقة والصلاحيات](docs/AUTHENTICATION.md)
- 🎨 [دليل الهوية البصرية ونظام التصميم ودعم الـ RTL](docs/BRAND-RTL-DESIGN-SYSTEM.md)
- 🗄️ [دليل إعدادات قاعدة البيانات والاتصالات](docs/DATABASE.md)
- 🚀 [دليل النشر والتحقق النهائي للإنتاج](docs/DEPLOYMENT.md)
- ⚙️ [دليل المتغيرات البيئية والتكوين](docs/ENVIRONMENT.md)
- 📦 [دليل الطلبات والدفع وإدارة المخزون](docs/ORDERS_AND_CHECKOUT.md)
- 📈 [دليل الأداء وسرعة الاستجابة](docs/PERFORMANCE.md)
- 🔍 [دليل الـ SEO والبيانات المنظمة والمحتوى](docs/SEO_AND_CONTENT.md)
- 🏪 [دليل إعدادات المتجر وحسابات العملاء](docs/STORE_CONFIGURATION_AND_ACCOUNTS.md)
- 💬 [دليل إشعارات واتساب السحابية و Outbox](docs/WHATSAPP_NOTIFICATIONS.md)

---

<div align="center">

صُنع بإتقان وشغف لتقديم أفضل تجربة تسوق أزياء إلكترونية عربية 🌸

**© 2026 Organza Fashion. جميع الحقوق محفوظة.**

</div>
