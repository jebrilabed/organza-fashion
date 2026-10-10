const fs = require('fs');
const path = 'apps/web/src/components/admin/product-management.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldForm = `    {colors && colors.length > 0 && (
      <form action={assignAction} className="flex items-center justify-between gap-2 mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border border-blue-100 dark:border-slate-700 rounded-xl shadow-sm transition-all hover:shadow-md">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="imageUrl" value={imageUrl} />
        
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
            <span className="text-sm">🎨</span>
          </div>
          
          <div className="flex-1">
            <select 
              name="colorName" 
              defaultValue={assignedColor || ""} 
              onChange={(e) => e.target.form.requestSubmit()} 
              className="w-full text-sm font-medium p-2 border-0 bg-transparent focus:ring-0 cursor-pointer text-slate-700 dark:text-slate-200 outline-none" 
              disabled={assignPending}
            >
              <option value="" className="text-slate-400">-- اختر لوناً للصورة --</option>
              {colors.map(c => <option key={c.name} value={c.name} className="font-semibold">{c.name}</option>)}
            </select>
          </div>
        </div>
        
        {assignPending && (
          <div className="flex items-center justify-center">
            <span className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></span>
          </div>
        )}
      </form>
    )}`;

const newForm = `    {colors && colors.length > 0 && (
      <form action={assignAction} className="flex items-center justify-between gap-2 mb-3 p-3 bg-[var(--color-secondary)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-sm transition-all hover:shadow-md">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="imageUrl" value={imageUrl} />
        
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm border border-[var(--color-border)] text-[var(--color-primary)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
          </div>
          
          <div className="flex-1">
            <select 
              name="colorName" 
              defaultValue={assignedColor || ""} 
              onChange={(e) => e.target.form.requestSubmit()} 
              className="w-full text-sm font-medium p-1 border-0 bg-transparent focus:ring-0 cursor-pointer text-[var(--color-text)] outline-none" 
              disabled={assignPending}
            >
              <option value="" className="text-[var(--color-muted)]">-- اختر لوناً للصورة --</option>
              {colors.map(c => <option key={c.name} value={c.name} className="font-semibold text-[var(--color-primary)]">{c.name}</option>)}
            </select>
          </div>
        </div>
        
        {assignPending && (
          <div className="flex items-center justify-center">
            <span className="animate-spin w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full"></span>
          </div>
        )}
      </form>
    )}`;

content = content.replace(oldForm, newForm);
fs.writeFileSync(path, content, 'utf8');
console.log("Updated ProductManagement styling");
