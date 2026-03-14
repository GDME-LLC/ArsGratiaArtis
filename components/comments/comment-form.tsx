"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Button } from "@/components/ui/button";

type CommentFormProps = {
  filmId: string;
  signedIn: boolean;
};

export function CommentForm({ filmId, signedIn }: CommentFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const remaining = 5000 - body.length;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!signedIn) {
      router.push("/login");
      return;
    }

    const trimmedBody = body.trim();

    if (!trimmedBody) {
      setError("Comment cannot be empty.");
      return;
    }

    if (trimmedBody.length > 5000) {
      setError("Comment must be 5000 characters or fewer.");
      return;
    }

    if (!turnstileToken) {
      setError("Complete the security check and try again.");
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch(`/api/films/${filmId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: trimmedBody,
          turnstileToken,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        setError(payload.error ?? "Comment could not be posted.");
        setTurnstileToken("");
        setTurnstileResetKey((current) => current + 1);
        return;
      }

      setBody("");
      setTurnstileToken("");
      setTurnstileResetKey((current) => current + 1);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  if (!signedIn) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
        <p className="body-sm text-muted-foreground">
          Sign in to comment on this film.
        </p>
        <Button asChild size="lg" variant="ghost" className="mt-4">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      className="rounded-[24px] border border-white/10 bg-white/5 p-5"
      onSubmit={handleSubmit}
    >
      <p className="display-kicker">Comment</p>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={5000}
        className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-white/[0.07]"
        placeholder="Add your response to the film..."
      />
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {remaining} characters remaining
      </p>
      <div className="mt-4">
        <TurnstileWidget action="comment" onTokenChange={setTurnstileToken} resetKey={turnstileResetKey} />
      </div>
      {error ? (
        <div className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <div className="mt-4">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  );
}
