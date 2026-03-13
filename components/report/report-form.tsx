"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

type ReportFormProps = {
  targetLabel: string;
  targetValue: string;
};

export function ReportForm({ targetLabel, targetValue }: ReportFormProps) {
  const [details, setDetails] = useState("");
  const [copied, setCopied] = useState(false);

  const reportBody = useMemo(
    () =>
      [
        "ArsGratia report",
        `${targetLabel}: ${targetValue}`,
        "",
        "Details:",
        details || "[add details here]",
      ].join("\n"),
    [details, targetLabel, targetValue],
  );

  async function handleCopy() {
    await navigator.clipboard.writeText(reportBody);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="surface-panel p-6 sm:p-7">
      <p className="display-kicker">Manual Review</p>
      <h2 className="headline-lg mt-3 text-foreground">Share the details clearly</h2>
      <p className="body-sm mt-3">
        Reports in this invite-stage build are reviewed manually. Describe the issue clearly, then copy the report details for review.
      </p>

      <div className="mt-6 rounded-[22px] border border-white/10 bg-white/5 p-5">
        <p className="display-kicker">{targetLabel}</p>
        <p className="title-md mt-3 text-foreground">{targetValue}</p>
      </div>

      <label className="mt-6 grid gap-2">
        <span className="display-kicker text-[0.68rem] text-foreground/85">What needs review</span>
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          className="min-h-40 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-white/[0.07]"
          placeholder="Describe the concern, include context, and note anything urgent."
        />
      </label>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="button" size="lg" onClick={handleCopy}>
          {copied ? "Copied" : "Copy report details"}
        </Button>
        <p className="body-sm">
          Formal moderation flows and policy review should be finalized before any public launch.
        </p>
      </div>
    </div>
  );
}
