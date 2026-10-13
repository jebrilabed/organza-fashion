import { Prisma } from "@/generated/prisma/client";
import { displayVariantOptions } from "@/lib/storefront/format";

export function VariantOptionsDisplay({ options }: { options: Prisma.JsonValue | null }) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
     const str = displayVariantOptions(options);
     return str ? <span>{str}</span> : null;
  }
  const opts = options as Record<string, string | undefined>;
  const color = opts["Color"];
  const colorHex = opts["ColorHex"];
  const size = opts["Size"];
  const colorIsHex = typeof color === 'string' && color.startsWith("#");

  if (!color && !size) {
    const str = displayVariantOptions(options);
    return str ? <span>{str}</span> : null;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      {color && (
        <span className="inline-flex items-center gap-1">
          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: colorHex || (colorIsHex ? color : '#000') }}></span>
          {!colorIsHex && <span>{color}</span>}
        </span>
      )}
      {color && size && <span className="opacity-50">/</span>}
      {size && <span>{size}</span>}
    </span>
  );
}
