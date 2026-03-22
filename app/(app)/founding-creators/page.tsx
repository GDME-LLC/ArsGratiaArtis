import { redirect } from "next/navigation";

import { getAdminUser } from "@/lib/admin";

export default async function FoundingCreatorsAdminPage() {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect("/dashboard");
  }

  redirect("/admin/badges");
}
