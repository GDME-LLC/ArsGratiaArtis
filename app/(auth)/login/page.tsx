import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getUser } from "@/lib/supabase/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const authErrors: Record<string, string> = {
  auth_callback_failed: "Authentication could not be completed. Please try again.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getUser();
  const params = searchParams ? await searchParams : undefined;

  if (user) {
    redirect("/dashboard");
  }

  return (
    <section className="container-shell py-20">
      <AuthForm mode="login" initialError={params?.error ? authErrors[params.error] : undefined} />
    </section>
  );
}
