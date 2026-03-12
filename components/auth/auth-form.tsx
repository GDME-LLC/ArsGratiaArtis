"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  createBrowserSupabaseClient,
  hasSupabaseBrowserEnv,
} from "@/lib/supabase/client";
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
    title: "Enter the screening room",
    description:
      "Sign in to manage your films, creator profile, and publishing flow.",
    cta: "Log In",
    alternateHref: "/signup",
    alternateLabel: "Need an account?",
    submittingLabel: "Logging In...",
  },
  signup: {
    eyebrow: "Signup",
    title: "Build your creator presence",
    description:
      "Create your ArsGratia account to publish films and shape your cinematic identity.",
    cta: "Create Account",
    alternateHref: "/login",
    alternateLabel: "Already inside?",
    submittingLabel: "Creating Account...",
  },
} as const;

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
  const supabase = createBrowserSupabaseClient();
  const isAuthConfigured = hasSupabaseBrowserEnv();
  const content = contentByMode[mode];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    if (!supabase) {
      setErrors({
        form: "Supabase auth is not configured locally yet. Add env vars to enable sign-in.",
      });
      return;
    }

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrors({ form: error.message });
          return;
        }

        router.push("/dashboard");
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrors({ form: error.message });
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setSuccessMessage("Check your email to confirm your account and finish signing in.");
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleAuth() {
    setErrors({});
    setSuccessMessage("");

    if (!supabase) {
      setErrors({
        form: "Supabase auth is not configured locally yet. Add env vars to enable Google sign-in.",
      });
      return;
    }

    setIsGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrors({ form: error.message });
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md surface-panel cinema-frame p-8 sm:p-10">
      <p className="display-kicker">ArsGratia</p>
      <p className="eyebrow mt-4">{content.eyebrow}</p>
      <h1 className="headline-lg mt-4">{content.title}</h1>
      <p className="body-sm mt-4">{content.description}</p>

      {!isAuthConfigured ? (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          Local startup is available, but auth is disabled until Supabase env vars are set.
        </div>
      ) : null}

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
          <input
            id={`${mode}-password`}
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={cn(
              "h-12 w-full rounded-2xl border bg-white/5 px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-white/[0.07]",
              errors.password ? "border-destructive/70" : "border-white/10",
            )}
            placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
            disabled={isSubmitting || isGoogleLoading}
          />
          {errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : null}
        </div>

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

      <p className="body-sm mt-6">
        {mode === "signup" ? "By creating an account, you enter ArsGratia under " : "Inside ArsGratia, under "}
        <span className="font-medium text-foreground">Ars Gratia Artis</span>.
      </p>

      <Button asChild variant="ghost" size="lg" className="mt-6 w-full">
        <Link href={content.alternateHref}>{content.alternateLabel}</Link>
      </Button>
    </div>
  );
}
