const fs = require('fs');
const path = 'apps/web/src/app/(admin)/admin/actions.ts';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `      } else {
        id = existing.id;
        await tx.product.update({ where: { id }, data: productData });

        for (const translation of translations) {`;

const newCode = `      } else {
        id = existing.id;
        await tx.product.update({ where: { id }, data: productData });
        // Reset default SKUs to avoid unique constraint violation
        await tx.productSku.updateMany({ where: { productId: id }, data: { isDefault: false } });

        for (const translation of translations) {`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success: Replaced oldCode with newCode.");
} else {
  console.log("Error: oldCode not found in actions.ts.");
}
