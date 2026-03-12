import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getUser } from "@/lib/supabase/auth";

export default async function SignupPage() {
  const user = await getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <section className="container-shell py-20">
      <AuthForm mode="signup" />
    </section>
  );
}
