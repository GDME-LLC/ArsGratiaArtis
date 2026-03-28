"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);

    try {
      const supabase = createBrowserSupabaseClient();

      if (supabase) {
        await supabase.auth.signOut();
      }

      router.push("/");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="h-9 rounded-full px-3 text-[0.72rem] tracking-[0.08em]"
      onClick={handleLogout}
      disabled={isPending}
    >
      {isPending ? "Logging Out" : "Logout"}
    </Button>
  );
}
