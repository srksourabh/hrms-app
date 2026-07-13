import type { BrandConfig } from "@hrms-app/config/brand";
import { productBrand } from "@hrms-app/config/brand";

interface BrandMarkProps {
  brand?: BrandConfig;
  className?: string;
  priority?: boolean;
}

export function BrandMark({ brand = productBrand, className = "h-11 w-11", priority = false }: BrandMarkProps) {
  return (
    // Tenant logo URLs are configuration data and may be hosted outside Next image domains.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brand.logoUrl}
      alt={`${brand.name} ${brand.nameAr} mark`}
      className={className}
      width={48}
      height={48}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

interface BrandLockupProps extends BrandMarkProps {
  inverse?: boolean;
  showAttribution?: boolean;
  compact?: boolean;
}

export function BrandLockup({
  brand = productBrand,
  className,
  priority,
  inverse = false,
  showAttribution = true,
  compact = false,
}: BrandLockupProps) {
  const primary = inverse ? "text-white" : "text-[#092d23]";
  const secondary = inverse ? "text-emerald-100/65" : "text-slate-500";

  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <BrandMark brand={brand} priority={priority} className={compact ? "h-9 w-9" : "h-11 w-11"} />
      <div className="min-w-0 leading-none">
        <div className={`flex items-baseline gap-2 ${primary}`}>
          <span className={compact ? "text-base font-bold tracking-[-0.03em]" : "text-xl font-bold tracking-[-0.04em]"}>
            {brand.name}
          </span>
          <span className={compact ? "text-sm font-semibold" : "text-lg font-semibold"} dir="rtl">
            {brand.nameAr}
          </span>
        </div>
        {showAttribution && (
          <p className={`mt-1 truncate text-[9px] font-semibold uppercase tracking-[0.13em] ${secondary}`}>
            {brand.attribution}
          </p>
        )}
      </div>
    </div>
  );
}

export function PoweredBy({ brand = productBrand, inverse = false }: Pick<BrandLockupProps, "brand" | "inverse">) {
  return (
    <span className={`text-[10px] font-semibold tracking-[0.08em] ${inverse ? "text-white/45" : "text-slate-400"}`}>
      {brand.attribution}
    </span>
  );
}
