const fs = require('fs');

const path = 'apps/web/src/components/storefront/product-variant-selector.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix color swatches styling (replace slate-900 with var(--color-primary))
content = content.replace(
  '"border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 font-semibold shadow"',
  '"border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-secondary)] font-semibold shadow-md ring-2 ring-[var(--color-primary)]/20"'
);

// 2. Hide color hex code text if the name is just a hex code
content = content.replace(
  '<span>{c.name}</span>',
  '<span>{c.name.startsWith(\'#\') ? \'\' : c.name}</span>'
);

// 3. Fix size buttons styling (replace slate-900 with var(--color-primary))
content = content.replace(
  '"border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 font-bold shadow-sm"',
  '"border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-secondary)] font-bold shadow-md ring-2 ring-[var(--color-primary)]/20"'
);

// 4. Update the unselected available color swatch styling to look a bit warmer
content = content.replace(
  '"border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"',
  '"border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)]/30 transition-colors"'
);

// 5. Update the unselected available size styling
content = content.replace(
  '"border-slate-300 bg-white text-slate-800 hover:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"',
  '"border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)]/30 transition-colors"'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated ProductVariantSelector styles.");
