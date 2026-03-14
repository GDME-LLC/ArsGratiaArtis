"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Button } from "@/components/ui/button";

const REPORT_REASONS = [
  "copyright issue",
  "abusive content",
  "spam",
  "impersonation",
  "other",
] as const;

type ReportFormProps = {
  targetLabel: string;
  targetValue: string;
  targetType: "film" | "creator";
  slug?: string;
  handle?: string;
  signedIn: boolean;
};

export function ReportForm({ targetLabel, targetValue, targetType, slug, handle, signedIn }: ReportFormProps) {
  const router = useRouter();
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]>("copyright issue");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!signedIn) {
      router.push("/login");
      return;
    }

    if (!turnstileToken) {
      setError("Complete the security check and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetType,
          slug,
          handle,
          reason,
          details: details.trim() || null,
          turnstileToken,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        setError(payload.error ?? "The report could not be submitted.");
        setTurnstileToken("");
        setTurnstileResetKey((current) => current + 1);
        return;
      }

      setSuccess("Report submitted. ArsGratia will review it manually.");
      setDetails("");
      setTurnstileToken("");
      setTurnstileResetKey((current) => current + 1);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!signedIn) {
    return (
      <div className="surface-panel p-6 sm:p-7">
        <p className="display-kicker">Report</p>
        <h2 className="headline-lg mt-3 text-foreground">Sign in to submit a report</h2>
        <p className="body-sm mt-3">
          Reports are tied to authenticated accounts so ArsGratia can review issues responsibly.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <form className="surface-panel p-6 sm:p-7" onSubmit={handleSubmit}>
      <p className="display-kicker">Report Abuse</p>
      <h2 className="headline-lg mt-3 text-foreground">Share the details clearly</h2>
      <p className="body-sm mt-3">
        Reports are reviewed manually in this invite-stage build. Choose the closest category and add any context that helps the review.
      </p>

      <div className="mt-6 rounded-[22px] border border-white/10 bg-white/5 p-5">
        <p className="display-kicker">{targetLabel}</p>
        <p className="title-md mt-3 text-foreground">{targetValue}</p>
      </div>

      <label className="mt-6 grid gap-2">
        <span className="display-kicker text-[0.68rem] text-foreground/85">Reason</span>
        <select
          value={reason}
          onChange={(event) => setReason(event.target.value as (typeof REPORT_REASONS)[number])}
          className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/60 focus:bg-white/[0.07]"
        >
          {REPORT_REASONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-6 grid gap-2">
        <span className="display-kicker text-[0.68rem] text-foreground/85">What needs review</span>
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          className="min-h-40 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-white/[0.07]"
          placeholder="Describe the concern, include context, and note anything urgent."
        />
      </label>

      <div className="mt-6">
        <TurnstileWidget action="report" onTokenChange={setTurnstileToken} resetKey={turnstileResetKey} />
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {success}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit report"}
        </Button>
        <p className="body-sm">
          Reports are stored for manual review. Urgent legal notices should also be sent by email.
        </p>
      </div>
    </form>
  );
}
