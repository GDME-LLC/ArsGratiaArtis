import Image from "next/image";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/supabase/auth";

const navItems = [
  { href: "/beyond-cinema", label: "Beyond Cinema" },
  { href: null, label: "Socials" },
  { href: "/manifesto", label: "Manifesto" },
] as const;

function HeaderNavButtons() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {navItems.map((item) =>
        item.href ? (
          <Button key={item.label} asChild variant="ghost" size="default" className="h-10 px-4">
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ) : (
          <Button key={item.label} type="button" variant="ghost" size="default" className="h-10 px-4 opacity-100" disabled>
            {item.label}
          </Button>
        ),
      )}
    </div>
  );
}

export async function SiteHeader() {
  const user = await getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="container-shell py-3 sm:py-4">
        <div className="flex min-h-[4.5rem] items-center justify-between gap-4 sm:min-h-20 sm:gap-6">
          <div className="flex min-w-0 items-center pr-2 sm:pr-0">
            <Link href="/" className="group flex min-w-0 items-center">
              <Image
                src="/brand/arsgratia-logo.png"
                alt="ArsGratia"
                width={320}
                height={80}
                style={{ width: "auto" }}
                className="h-12 w-auto object-contain sm:h-[62px] lg:h-[68px]"
                priority
              />
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <Button asChild className="h-10 px-4 sm:h-11 sm:px-5">
                  <Link href="/upload">Start a Release</Link>
                </Button>
                <LogoutButton />
              </>
            ) : (
              <>
                <Button asChild className="h-10 px-4 sm:h-11 sm:px-5">
                  <Link href="/signup">Become a Creator</Link>
                </Button>
                <Button asChild variant="ghost" className="h-10 px-4 sm:h-11 sm:px-5">
                  <Link href="/login">Login</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 flex justify-start sm:mt-2 sm:justify-center lg:justify-end">
          <HeaderNavButtons />
        </div>
      </div>
    </header>
  );
}
