"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { ArrowLeft, Gift, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@hrms-app/ui";
import { Input } from "@hrms-app/ui";
import { Label } from "@hrms-app/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@hrms-app/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hrms-app/ui";
import { SaudiPalmette } from "~/components/saudi/saudi-backdrop";

const REWARD_TYPES = ["monetary", "non_monetary", "time_off", "gift", "experience", "development", "public_recognition"] as const;

export default function RewardsNewPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("monetary");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [quantity, setQuantity] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  const create = api.retention.reward.create.useMutation({
    onSuccess: async () => {
      await utils.retention.reward.list.invalidate();
      router.push("/retention/rewards");
    },
    onError: (err) => setGlobalError(err.message),
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Reward name is required";
    if (!type) e.type = "Reward type is required";
    const q = Number(quantity);
    if (!quantity || isNaN(q) || q < 0) e.quantity = "Quantity must be a non-negative number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setGlobalError("");
    if (!validate()) return;
    create.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      type: type as any,
      value: value ? Number(value) : undefined,
      currency,
      quantity: Number(quantity),
      isActive,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/retention/rewards"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[hsl(var(--saudi-green))]"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Back to Rewards
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--saudi-gold))] to-amber-600 text-white shadow-sm">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Create Reward</CardTitle>
              <CardDescription>Add a new reward option for employee recognition and redemptions.</CardDescription>
            </div>
          </div>
          <SaudiPalmette className="mt-3 h-3.5 w-28 text-[hsl(var(--saudi-gold))]" />
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 pt-6">
            {globalError && (
              <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <strong>Error:</strong> {globalError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">
                Reward Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((er) => ({ ...er, name: "" })); }}
                placeholder="e.g. SAR 500 Amazon Voucher, Extra Day Off"
                className={errors.name ? "border-rose-400" : ""}
              />
              {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the reward"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type">
                Reward Type <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={type}
                onValueChange={(v) => { setType(v); setErrors((er) => ({ ...er, type: "" })); }}
              >
                <SelectTrigger id="type" className={`w-full ${errors.type ? "border-rose-400" : ""}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REWARD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-rose-600">{errors.type}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="value">Value (Optional)</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v)}>
                  <SelectTrigger id="currency" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quantity">
                  Quantity Available <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => { setQuantity(e.target.value); setErrors((er) => ({ ...er, quantity: "" })); }}
                  placeholder="0"
                  className={errors.quantity ? "border-rose-400" : ""}
                />
                {errors.quantity && <p className="text-xs text-rose-600">{errors.quantity}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[hsl(var(--saudi-green))] focus:ring-[hsl(var(--saudi-green))]"
              />
              <Label htmlFor="isActive" className="text-sm font-normal">
                Reward is active and available for redemption
              </Label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/retention/rewards")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending}
                className="saudi-gradient-primary h-10 px-6 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
              >
                {create.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Create Reward</>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </div>
    </div>
  );
}
