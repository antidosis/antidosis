"use client";

import { useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Loader2, Send, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { mutate } from "swr";

import { ActionProgress } from "@/components/ui/action-progress";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/ui/copy-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { createDirectContractSchema } from "@/lib/schemas";
import type { CreateDirectContractInput } from "@/lib/schemas";

export function DirectContractForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [created, setCreated] = useState<{ id: string; title: string; inviteUrl: string } | null>(
    null
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateDirectContractInput>({
    resolver: zodResolver(createDirectContractSchema),
    defaultValues: { title: "", description: "", terms: "", inviteEmail: undefined },
  });

  async function submit(values: CreateDirectContractInput) {
    try {
      const response = await fetch("/api/v1/contracts/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, inviteEmail: values.inviteEmail || undefined }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast(data.error || "Couldn't create the direct agreement", "error");
        return;
      }
      setCreated({ id: data.contract.id, title: data.contract.title, inviteUrl: data.inviteUrl });
      await mutate("/api/v1/contracts/mine");
      toast("Direct agreement created", "success");
    } catch {
      toast("Couldn't create the agreement — check your connection", "error");
    }
  }

  if (created) {
    return (
      <section className="rounded-lg border border-ok/30 bg-ok/[0.045] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ok/10 text-ok">
            <Check className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-medium text-gold">{created.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-parchment">
              Your direct agreement is ready. Share this private link with the other party. They
              will create an account and verify their mobile before joining the agreement.
            </p>
            <div className="mt-4 break-all rounded-md border border-line bg-inset p-3 font-mono text-xs text-ash">
              {created.inviteUrl}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <CopyLinkButton url={created.inviteUrl} label="Copy private invitation" />
              <Button asChild size="sm" variant="ghost">
                <Link href={`/contracts/${created.id}`}>
                  Open agreement <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onClose}>
                Done
              </Button>
            </div>
            <p className="mt-3 text-xs text-ash">
              The link expires after 30 days and stops working once claimed. You can generate a new
              one from the agreement if needed.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-sun/25 bg-surface/55 p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-sun">
            Direct agreement
          </p>
          <h3 className="mt-1 text-lg font-medium text-gold">Formalise a private arrangement</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ash">
            No public need is posted. You invite one person directly, then negotiate, sign, complete
            and review the agreement together.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close direct agreement form"
          className="rounded p-2 text-ash hover:text-gold"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="direct-title">Agreement title</Label>
          <Input
            id="direct-title"
            {...register("title")}
            placeholder="e.g. Website design for local café"
            className="mt-2 text-base"
          />
          {errors.title && <p className="mt-1 text-xs text-bad">{errors.title.message}</p>}
        </div>
        <div>
          <Label htmlFor="direct-description">Purpose and scope</Label>
          <Textarea
            id="direct-description"
            {...register("description")}
            placeholder="What is being arranged, and what does a completed agreement look like?"
            rows={3}
            className="mt-2 text-base"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-bad">{errors.description.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="direct-terms">Your proposed terms</Label>
          <Textarea
            id="direct-terms"
            {...register("terms")}
            placeholder="Deliverables, payment or reciprocal exchange, timing, location, revisions, responsibilities…"
            rows={5}
            className="mt-2 text-base"
          />
          {errors.terms && <p className="mt-1 text-xs text-bad">{errors.terms.message}</p>}
        </div>
        <div>
          <Label htmlFor="direct-payment">Agreed cash amount in AUD (optional)</Label>
          <Input
            id="direct-payment"
            {...register("paymentAmount", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Leave blank for barter or non-cash exchanges"
            className="mt-2 text-base"
          />
          <p className="mt-1.5 text-xs text-ash">
            Recorded for the agreement and reporting. Payment happens directly between the parties;
            Antidosis never holds the money.
          </p>
          {errors.paymentAmount && (
            <p className="mt-1 text-xs text-bad">{errors.paymentAmount.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="direct-email">Restrict to an email address (optional)</Label>
          <Input
            id="direct-email"
            {...register("inviteEmail")}
            type="email"
            placeholder="person@example.com"
            className="mt-2 text-base"
          />
          <p className="mt-1.5 text-xs text-ash">
            This controls who can claim the link; it does not send an email. You share the link
            yourself.
          </p>
          {errors.inviteEmail && (
            <p className="mt-1 text-xs text-bad">{errors.inviteEmail.message}</p>
          )}
        </div>
        <p className="border-t border-line/60 pt-4 text-xs leading-relaxed text-ash">
          This is a general-purpose agreement tool, not legal advice. You are responsible for
          suitable terms, authority, licensing, insurance, tax and independent legal advice.
        </p>
        <ActionProgress
          active={isSubmitting}
          stages={[
            "Drafting your agreement",
            "Creating the invitation",
            "Preparing the secure link",
          ]}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {isSubmitting ? "Creating…" : "Create private invitation"}
        </Button>
      </form>
    </section>
  );
}
