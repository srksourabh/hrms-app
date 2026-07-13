"use client";

import { useMemo, useState, type InputHTMLAttributes } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Circle,
  Landmark,
  MapPin,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  WalletCards,
} from "lucide-react";
import {
  activateCompanyOnboarding,
  companyOnboardingFixture,
  companyOnboardingSteps,
  getCompanyOnboardingProgress,
  validateCompanyOnboardingStep,
  type CompanyOnboardingState,
} from "@hrms-app/demo";

interface CompanyOnboardingWorkspaceProps {
  userName: string;
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

function Field({ label, hint, error, className = "", ...props }: FieldProps) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        {...props}
        className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 ${error ? "border-rose-400" : "border-slate-200"} ${className}`}
      />
      {error ? <span className="block text-xs text-rose-700">{error}</span> : hint ? <span className="block text-xs font-normal text-slate-400">{hint}</span> : null}
    </label>
  );
}

const cloneFixture = () => structuredClone(companyOnboardingFixture);

export function CompanyOnboardingWorkspace({ userName }: CompanyOnboardingWorkspaceProps) {
  const [state, setState] = useState<CompanyOnboardingState>(cloneFixture);
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activationReference, setActivationReference] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const currentStep = companyOnboardingSteps[stepIndex]!;
  const progress = useMemo(() => getCompanyOnboardingProgress(state), [state]);

  function updateCompany(patch: Partial<CompanyOnboardingState["company"]>) {
    setState((current) => ({ ...current, company: { ...current.company, ...patch } }));
  }

  function updateCompliance(patch: Partial<CompanyOnboardingState["compliance"]>) {
    setState((current) => ({ ...current, compliance: { ...current.compliance, ...patch } }));
  }

  function updatePayroll(patch: Partial<CompanyOnboardingState["payroll"]>) {
    setState((current) => ({ ...current, payroll: { ...current.payroll, ...patch } }));
  }

  function updateBranch(id: string, patch: Partial<CompanyOnboardingState["locations"]["branches"][number]>) {
    setState((current) => ({
      ...current,
      locations: {
        branches: current.locations.branches.map((branch) =>
          branch.id === id
            ? { ...branch, ...patch }
            : patch.isHeadquarters
              ? { ...branch, isHeadquarters: false }
              : branch,
        ),
      },
    }));
  }

  function addBranch() {
    setState((current) => ({
      ...current,
      locations: {
        branches: [
          ...current.locations.branches,
          {
            id: `branch-${current.locations.branches.length + 1}`,
            name: "New branch",
            city: "Riyadh",
            isHeadquarters: current.locations.branches.length === 0,
            workPattern: "Sunday–Thursday",
          },
        ],
      },
    }));
  }

  function removeBranch(id: string) {
    setState((current) => {
      const branches = current.locations.branches.filter((branch) => branch.id !== id);
      if (branches.length > 0 && !branches.some((branch) => branch.isHeadquarters)) {
        branches[0] = { ...branches[0]!, isHeadquarters: true };
      }
      return { ...current, locations: { branches } };
    });
  }

  function goForward() {
    const nextErrors = validateCompanyOnboardingStep(state, currentStep.id);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setStepIndex((current) => Math.min(current + 1, companyOnboardingSteps.length - 1));
    setNotice(null);
  }

  function activate() {
    const result = activateCompanyOnboarding(state);
    setErrors(validateCompanyOnboardingStep(state, "review"));
    setNotice(result.message);
    if (result.activated) setActivationReference(result.activationReference ?? null);
  }

  function reset() {
    setState(cloneFixture());
    setStepIndex(0);
    setErrors({});
    setActivationReference(null);
    setNotice("Onboarding demo reset to the Rukn Energy fixture.");
  }

  const nextLabels = [
    "Continue to Saudi compliance",
    "Continue to branches and work",
    "Continue to payroll setup",
    "Review company setup",
  ];

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[30px] bg-[#071b14] px-6 py-8 text-white sm:px-9">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_90%_5%,rgba(245,183,48,.35),transparent_25%),radial-gradient(circle_at_5%_100%,rgba(16,185,129,.34),transparent_32%)]" />
        <div className="relative grid gap-8 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200">Operational customer demo</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/55">Fictional Rukn Energy data</span>
            </div>
            <p className="mt-6 text-sm font-semibold text-emerald-300">Administration · تهيئة الشركة</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Set up your Saudi company</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">Configure legal identity, Saudi compliance, operating branches, payroll controls, and allowances before activating an isolated tenant workspace.</p>
          </div>
          <button type="button" onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10">
            Reset fixture <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </section>

      {notice && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
          <div><p>{notice}</p>{activationReference && <p className="mt-1 font-mono text-xs font-semibold">{activationReference}</p>}</div>
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-2xl bg-[#eee9dc] p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600"><span>Onboarding readiness</span><span>{progress}%</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${progress}%` }} /></div>
            <p className="mt-3 text-xs text-slate-500">Step {stepIndex + 1} of {companyOnboardingSteps.length}</p>
          </div>
          <nav aria-label="Company onboarding steps" className="space-y-1">
            {companyOnboardingSteps.map((step, index) => {
              const isCurrent = index === stepIndex;
              const isComplete = Object.keys(validateCompanyOnboardingStep(state, step.id)).length === 0;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => index <= stepIndex && setStepIndex(index)}
                  disabled={index > stepIndex}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${isCurrent ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55"}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isCurrent ? "bg-emerald-500 text-white" : isComplete ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                    {isComplete ? <Check className="h-4 w-4" /> : <Circle className="h-3.5 w-3.5" />}
                  </span>
                  <span><span className="block text-sm font-semibold">{step.label}</span><span className={`block text-[11px] ${isCurrent ? "text-white/50" : "text-slate-400"}`} dir="rtl">{step.labelAr}</span></span>
                </button>
              );
            })}
          </nav>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs leading-5 text-emerald-950">
            <ShieldCheck className="mb-2 h-5 w-5 text-emerald-700" />
            Demo validation mirrors Saudi setup rules. No authority, bank, or production tenant is contacted.
          </div>
        </aside>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{currentStep.labelAr}</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.025em] text-slate-950">{currentStep.label}</h2></div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{stepIndex + 1} / {companyOnboardingSteps.length}</span>
          </div>

          {Object.keys(errors).length > 0 && (
            <div role="alert" className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">Complete the highlighted setup details before continuing.</div>
          )}

          {currentStep.id === "company" && (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="English legal name" value={state.company.legalNameEn} onChange={(event) => updateCompany({ legalNameEn: event.target.value })} error={errors.legalNameEn} />
              <Field label="Arabic legal name" dir="rtl" value={state.company.legalNameAr} onChange={(event) => updateCompany({ legalNameAr: event.target.value })} error={errors.legalNameAr} />
              <Field label="Commercial registration number" inputMode="numeric" value={state.company.crNumber} onChange={(event) => updateCompany({ crNumber: event.target.value })} error={errors.crNumber} hint="10-digit Saudi CR number" />
              <Field label="Unified national number" inputMode="numeric" value={state.company.unifiedNumber} onChange={(event) => updateCompany({ unifiedNumber: event.target.value })} error={errors.unifiedNumber} hint="Starts with 7" />
              <Field label="Primary company activity" value={state.company.industry} onChange={(event) => updateCompany({ industry: event.target.value })} error={errors.industry} className="md:col-span-2" />
            </div>
          )}

          {currentStep.id === "compliance" && (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Nitaqat economic activity" value={state.compliance.nitaqatActivity} onChange={(event) => updateCompliance({ nitaqatActivity: event.target.value })} error={errors.nitaqatActivity} />
              <Field label="GOSI establishment number" inputMode="numeric" value={state.compliance.gosiNumber} onChange={(event) => updateCompliance({ gosiNumber: event.target.value })} error={errors.gosiNumber} />
              <Field label="VAT registration number" inputMode="numeric" value={state.compliance.vatNumber} onChange={(event) => updateCompliance({ vatNumber: event.target.value })} error={errors.vatNumber} />
              <Field label="Saudization target (%)" type="number" min={0} max={100} value={state.compliance.saudizationTarget} onChange={(event) => updateCompliance({ saudizationTarget: Number(event.target.value) })} error={errors.saudizationTarget} />
              <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Demo compliance profile:</strong> High Green target posture at {state.compliance.saudizationTarget}% Saudization. Real Nitaqat classification requires authority data and is not calculated here.</div>
            </div>
          )}

          {currentStep.id === "locations" && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">{state.locations.branches.length} configured branches</p><button type="button" onClick={addBranch} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Add branch</button></div>
              {(errors.branches || errors.headquarters || errors.branchDetails) && <p className="text-sm text-rose-700">{errors.branches ?? errors.headquarters ?? errors.branchDetails}</p>}
              {state.locations.branches.map((branch, index) => (
                <article key={branch.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><MapPin className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-slate-950">Branch {index + 1}</p><p className="text-xs text-slate-400">{branch.isHeadquarters ? "Headquarters" : "Operating location"}</p></div></div><button type="button" onClick={() => removeBranch(branch.id)} aria-label={`Remove ${branch.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button></div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Branch name" value={branch.name} onChange={(event) => updateBranch(branch.id, { name: event.target.value })} />
                    <Field label="City" value={branch.city} onChange={(event) => updateBranch(branch.id, { city: event.target.value })} />
                    <Field label="Work pattern" value={branch.workPattern} onChange={(event) => updateBranch(branch.id, { workPattern: event.target.value })} />
                  </div>
                  <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700"><input type="radio" name="headquarters" checked={branch.isHeadquarters} onChange={() => updateBranch(branch.id, { isHeadquarters: true })} className="h-4 w-4 accent-emerald-700" /> Set as company headquarters</label>
                </article>
              ))}
            </div>
          )}

          {currentStep.id === "payroll" && (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Payroll bank" value={state.payroll.bankName} onChange={(event) => updatePayroll({ bankName: event.target.value })} error={errors.bankName} />
              <Field label="Saudi IBAN" value={state.payroll.iban} onChange={(event) => updatePayroll({ iban: event.target.value.toUpperCase() })} error={errors.iban} />
              <Field label="Payroll day" type="number" min={1} max={28} value={state.payroll.payrollDay} onChange={(event) => updatePayroll({ payrollDay: Number(event.target.value) })} error={errors.payrollDay} />
              <Field label="Default work pattern" value={state.payroll.workWeek} onChange={(event) => updatePayroll({ workWeek: event.target.value })} error={errors.workWeek} />
              <Field label="Housing allowance (% of basic)" type="number" min={0} max={100} value={state.payroll.housingAllowancePercent} onChange={(event) => updatePayroll({ housingAllowancePercent: Number(event.target.value) })} error={errors.housingAllowancePercent} />
              <Field label="Transport allowance (SAR)" type="number" min={0} value={state.payroll.transportAllowance} onChange={(event) => updatePayroll({ transportAllowance: Number(event.target.value) })} error={errors.transportAllowance} />
              <div className="md:col-span-2 grid gap-3 sm:grid-cols-3">
                {[{ icon: Landmark, label: "WPS controls", detail: "Enabled for validation" }, { icon: WalletCards, label: "GOSI rules", detail: "Saudi/non-Saudi rates" }, { icon: ShieldCheck, label: "Tenant isolation", detail: "Schema-per-company" }].map((item) => <div key={item.label} className="rounded-2xl bg-slate-50 p-4"><item.icon className="h-5 w-5 text-emerald-700" /><p className="mt-3 text-sm font-semibold text-slate-900">{item.label}</p><p className="mt-1 text-xs text-slate-500">{item.detail}</p></div>)}
              </div>
            </div>
          )}

          {currentStep.id === "review" && (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-emerald-50 p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Readiness</p><p className="mt-2 text-3xl font-semibold text-emerald-950">{progress}% ready</p></div><div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Branches</p><p className="mt-2 text-3xl font-semibold text-slate-950">{state.locations.branches.length}</p></div><div className="rounded-2xl bg-[#eee9dc] p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Payroll day</p><p className="mt-2 text-3xl font-semibold text-slate-950">{state.payroll.payrollDay}</p></div></div>
              <div className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 p-5"><Building2 className="h-5 w-5 text-emerald-700" /><h3 className="mt-3 font-semibold text-slate-950">{state.company.legalNameEn}</h3><p className="mt-1 text-sm text-slate-500" dir="rtl">{state.company.legalNameAr}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-400">CR</dt><dd className="mt-1 font-semibold">{state.company.crNumber}</dd></div><div><dt className="text-slate-400">Unified no.</dt><dd className="mt-1 font-semibold">{state.company.unifiedNumber}</dd></div></dl></article>
                <article className="rounded-2xl border border-slate-200 p-5"><ShieldCheck className="h-5 w-5 text-emerald-700" /><h3 className="mt-3 font-semibold text-slate-950">Saudi compliance profile</h3><p className="mt-1 text-sm text-slate-500">{state.compliance.nitaqatActivity}</p><p className="mt-4 text-xs text-slate-400">Saudization target</p><p className="mt-1 text-lg font-semibold">{state.compliance.saudizationTarget}%</p></article>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950"><strong>Activation scope:</strong> This records a deterministic demo event only. Production tenant provisioning, bank verification, and government registration remain server-side credentialed operations.</div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={() => { setStepIndex((current) => Math.max(0, current - 1)); setErrors({}); }} disabled={stepIndex === 0} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 disabled:invisible"><ArrowLeft className="h-4 w-4" /> Back</button>
            {currentStep.id === "review" ? (
              <button type="button" onClick={activate} disabled={Boolean(activationReference)} className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800 disabled:bg-emerald-900"><ShieldCheck className="h-4 w-4" /> {activationReference ? "Company workspace activated" : "Activate company workspace"}</button>
            ) : (
              <button type="button" onClick={goForward} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800">{nextLabels[stepIndex]} <ArrowRight className="h-4 w-4" /></button>
            )}
          </div>
        </div>
      </section>

      {activationReference && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Demo audit trail</p><h2 className="mt-1 text-lg font-semibold">Activation by {userName}</h2></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">1 event</span></div><div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"><p className="text-sm font-semibold text-emerald-950">Company workspace activated</p><p className="mt-1 font-mono text-xs text-emerald-800">{activationReference}</p></div></section>
      )}
    </div>
  );
}
