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
    <>
      {navItems.map((item) =>
        item.href ? (
          <Button key={item.label} asChild variant="ghost" className="h-11 px-4">
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ) : (
          <Button key={item.label} type="button" variant="ghost" className="h-11 px-4 opacity-100" disabled>
            {item.label}
          </Button>
        ),
      )}
    </>
  );
}

export async function SiteHeader() {
  const user = await getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="container-shell py-3 sm:py-4">
        <div className="flex min-h-[4.5rem] items-center justify-between gap-3 sm:min-h-20 sm:gap-5 lg:min-h-24">
          <div className="flex min-w-0 flex-1 items-center pr-2 sm:pr-0">
            <Link href="/" className="group flex min-w-0 items-center md:min-w-[280px] lg:min-w-[340px]">
              <Image
                src="/brand/arsgratia-logo.png"
                alt="ArsGratia"
                width={320}
                height={80}
                style={{ width: "auto" }}
                className="h-14 w-auto object-contain sm:h-[68px] lg:h-20"
                priority
              />
            </Link>
          </div>

          <nav className="hidden items-center gap-2 lg:flex">
            <HeaderNavButtons />
          </nav>

          <div className="hidden flex-shrink-0 items-center gap-2 lg:flex">
            {user ? (
              <>
                <Button asChild className="h-11 px-5">
                  <Link href="/upload">Start a Release</Link>
                </Button>
                <LogoutButton />
              </>
            ) : (
              <>
                <Button asChild className="h-11 px-5">
                  <Link href="/signup">Become a Creator</Link>
                </Button>
                <Button asChild variant="ghost" className="h-11 px-5">
                  <Link href="/login">Login</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2 lg:hidden">
          <HeaderNavButtons />
          {user ? (
            <>
              <Button asChild className="min-w-0 flex-1 sm:flex-none">
                <Link href="/upload">Start a Release</Link>
              </Button>
              <LogoutButton />
            </>
          ) : (
            <>
              <Button asChild className="min-w-0 flex-1 sm:flex-none">
                <Link href="/signup">Become a Creator</Link>
              </Button>
              <Button asChild variant="ghost" className="min-w-0 flex-1 sm:flex-none">
                <Link href="/login">Login</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
