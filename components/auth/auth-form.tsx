"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
  initialError?: string;
};

type FormErrors = {
  email?: string;
  password?: string;
  form?: string;
};

const contentByMode = {
  login: {
    eyebrow: "Login",
    title: "Return to your release workspace",
    description:
      "Sign in to manage your films, creator page, and publishing tools.",
    cta: "Log In",
    alternateHref: "/signup",
    alternateLabel: "Need an account?",
    submittingLabel: "Logging In...",
    note: "Accounts are open. Creator publishing access is enabled separately so public filmmaker pages can come online with care.",
    action: "login" as const,
  },
  signup: {
    eyebrow: "Join ArsGratia",
    title: "Start your account",
    description:
      "Create your ArsGratia account now. Creator publishing access is enabled in small groups through review or invitation.",
    cta: "Create Account",
    alternateHref: "/login",
    alternateLabel: "Already inside?",
    submittingLabel: "Creating Account...",
    note: "After signup, your account is live. Creator publishing tools may remain off until your access is reviewed.",
    action: "signup" as const,
  },
} as const;

const googleAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(mode: AuthMode, email: string, password: string): FormErrors {
  const errors: FormErrors = {};

  if (!email) {
    errors.email = "Email is required.";
  } else if (!validateEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (mode === "signup" && password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

export function AuthForm({ mode, initialError }: AuthFormProps) {
  const router = useRouter();
  const content = contentByMode[mode];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [errors, setErrors] = useState<FormErrors>(
    initialError ? { form: initialError } : {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(mode, email.trim(), password);
    setErrors(nextErrors);
    setSuccessMessage("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!turnstileToken) {
      setErrors({ form: "Complete the security check and try again." });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          turnstileToken,
        }),
      });

      const payload = (await response.json()) as { error?: string; redirectTo?: string; message?: string };

      if (!response.ok) {
        setErrors({ form: payload.error ?? "Authentication could not be completed." });
        setTurnstileToken("");
        setTurnstileResetKey((current) => current + 1);
        return;
      }

      if (payload.redirectTo) {
        router.push(payload.redirectTo);
        router.refresh();
        return;
      }

      setSuccessMessage(payload.message ?? "Check your email for the next step.");
      setPassword("");
      setTurnstileToken("");
      setTurnstileResetKey((current) => current + 1);
      setShowPassword(false);
    } catch {
      setErrors({ form: "Network error. Please try again." });
      setTurnstileToken("");
      setTurnstileResetKey((current) => current + 1);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleAuth() {
    setErrors({});
    setSuccessMessage("");

    if (!turnstileToken) {
      setErrors({ form: "Complete the security check and try again." });
      return;
    }

    setIsGoogleLoading(true);

    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ turnstileToken, action: content.action }),
      });

      const payload = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !payload.url) {
        setErrors({ form: payload.error ?? "Google sign-in could not be started." });
        setTurnstileToken("");
        setTurnstileResetKey((current) => current + 1);
        setIsGoogleLoading(false);
        return;
      }

      window.location.href = payload.url;
    } catch {
      setErrors({ form: "Network error. Please try again." });
      setTurnstileToken("");
      setTurnstileResetKey((current) => current + 1);
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md surface-panel cinema-frame p-8 sm:p-10">
      <p className="display-kicker">ArsGratia</p>
      <p className="eyebrow mt-4">{content.eyebrow}</p>
      <h1 className="headline-lg mt-4">{content.title}</h1>
      <p className="body-sm mt-4">{content.description}</p>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
        {content.note}
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label className="display-kicker text-[0.68rem] text-foreground/85" htmlFor={`${mode}-email`}>
            Email
          </label>
          <input
            id={`${mode}-email`}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={cn(
              "h-12 w-full rounded-2xl border bg-white/5 px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-white/[0.07]",
              errors.email ? "border-destructive/70" : "border-white/10",
            )}
            placeholder="name@studio.com"
            disabled={isSubmitting || isGoogleLoading}
          />
          {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
        </div>

        <div className="space-y-2">
          <label
            className="display-kicker text-[0.68rem] text-foreground/85"
            htmlFor={`${mode}-password`}
          >
            Password
          </label>
          <div className="relative">
            <input
              id={`${mode}-password`}
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={cn(
                "h-12 w-full rounded-2xl border bg-white/5 px-4 pr-20 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-white/[0.07]",
                errors.password ? "border-destructive/70" : "border-white/10",
              )}
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              disabled={isSubmitting || isGoogleLoading}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.16em] text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setShowPassword((current) => !current)}
              disabled={isSubmitting || isGoogleLoading}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : null}
        </div>

        <TurnstileWidget
          action={content.action}
          onTokenChange={setTurnstileToken}
          resetKey={turnstileResetKey}
        />

        {errors.form ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errors.form}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            {successMessage}
          </div>
        ) : null}

        <Button type="submit" size="xl" className="w-full" disabled={isSubmitting || isGoogleLoading}>
          {isSubmitting ? content.submittingLabel : content.cta}
        </Button>
      </form>

      {googleAuthEnabled ? (
        <>
          <div className="mt-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="display-kicker text-[0.62rem] text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="mt-6 w-full"
            onClick={handleGoogleAuth}
            disabled={isSubmitting || isGoogleLoading}
          >
            {isGoogleLoading ? "Redirecting to Google..." : "Continue with Google"}
          </Button>
        </>
      ) : null}

      <p className="body-sm mt-6">
        {mode === "signup"
          ? "Your account comes online immediately. Publishing access is reviewed separately so new filmmaker pages and releases arrive with intention."
          : "Once you are inside, you can manage your page, releases, and creator access from the dashboard."}
      </p>

      <Button asChild variant="ghost" size="lg" className="mt-6 w-full">
        <Link href={content.alternateHref}>{content.alternateLabel}</Link>
      </Button>
    </div>
  );
}
