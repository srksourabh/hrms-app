import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ShieldX } from "lucide-react";
import { auth } from "@hrms-app/auth";
import { demoWorkflows } from "@hrms-app/demo";
import { CompanyOnboardingWorkspace } from "~/components/demo/company-onboarding-workspace";
import { OperationalModuleWorkspace } from "~/components/demo/operational-module-workspace";
import { getProductModule } from "~/lib/module-catalog";

interface ModuleDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ModuleDetailPage({ params }: ModuleDetailPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { slug } = await params;
  const productModule = getProductModule(slug);
  const workflow = demoWorkflows[slug];
  if (!productModule || !workflow) notFound();

  const allowed = workflow.allowedRoles.some((role) => role === session.user.role);
  if (!allowed) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <section className="rounded-[30px] border border-rose-200 bg-rose-50 p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-700 shadow-sm"><ShieldX className="h-6 w-6" /></span>
          <h1 className="mt-5 text-2xl font-semibold text-slate-950">This workspace is not available for your role</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Employee sessions are limited to personal self-service records. Company-wide {productModule.name.toLowerCase()} data requires an authorized HR or manager role.</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"><ArrowLeft className="h-4 w-4" /> Return to my workspace</Link>
        </section>
      </div>
    );
  }

  if (slug === "company-onboarding") {
    return <CompanyOnboardingWorkspace userName={session.user.name ?? "HR administrator"} />;
  }

  return <OperationalModuleWorkspace module={productModule} workflow={workflow} userName={session.user.name ?? "Team member"} />;
}
