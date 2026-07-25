import { BrandLockup } from "~/components/brand/brand-lockup";
import { SaudiBackdrop, SaudiPalmette } from "~/components/saudi/saudi-backdrop";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full" dir="ltr">
      <SaudiBackdrop variant="riyadh" dim className="absolute inset-0" />

      <header className="relative z-10 flex items-center px-6 py-5 sm:px-10">
        <BrandLockup inverse priority />
      </header>

      <main className="relative z-10 grid min-h-[calc(100vh-80px)] w-full grid-cols-1 lg:grid-cols-2">
        <section className="hidden flex-col justify-center px-12 text-white lg:flex lg:px-20">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-[hsl(var(--saudi-gold))]">
            Saudi Arabia | المملكة العربية السعودية
          </p>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight">
            Where heritage meets <br />
            <span className="text-[hsl(var(--saudi-gold))]">modern workforce.</span>
          </h1>
          <p className="mb-10 max-w-md text-lg leading-relaxed text-white/85">
            The HR and payroll portal built for Saudi Arabian companies, designed around Qiwa, Mudad,
            and GOSI workflows.
          </p>

          <SaudiPalmette className="mb-10 h-5 w-40 text-[hsl(var(--saudi-gold))]" />

          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Riyadh", labelAr: "الرياض", desc: "Capital" },
              { label: "Jeddah", labelAr: "جدة", desc: "Coast" },
              { label: "Dammam", labelAr: "الدمام", desc: "East" },
            ].map((city) => (
              <div key={city.label} className="text-white/90">
                <p className="text-2xl font-semibold">{city.label}</p>
                <p className="text-sm text-[hsl(var(--saudi-gold))]">{city.labelAr}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-white/50">{city.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10">
          <LoginForm />
        </section>
      </main>

      <footer className="relative z-10 px-6 pb-4 text-center text-xs text-white/60 sm:px-10">
        {`© ${new Date().getFullYear()} Saudi HRMS Portal | All rights reserved`}
      </footer>
    </div>
  );
}
