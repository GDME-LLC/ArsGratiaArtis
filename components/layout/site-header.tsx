import Image from "next/image";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/supabase/auth";

const navItems = [
  { href: "/resources", label: "Explore Resources" },
  { href: null, label: "Socials" },
  { href: "/manifesto", label: "Manifesto" },
] as const;

function HeaderNavButtons() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {navItems.map((item) =>
        item.href ? (
          <Button
            key={item.label}
            asChild
            variant="ghost"
            className="h-8 rounded-full px-3 text-[0.72rem] tracking-[0.08em] text-foreground/78 hover:text-foreground"
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ) : (
          <Button
            key={item.label}
            type="button"
            variant="ghost"
            className="h-8 rounded-full px-3 text-[0.72rem] tracking-[0.08em] text-foreground/78 opacity-100"
            disabled
          >
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
    <header className="sticky top-0 z-50 border-b border-white/6 bg-black/8 backdrop-blur-md">
      <div className="container-shell py-1 sm:py-1.5">
        <div className="flex min-h-[3.4rem] items-center justify-between gap-3 sm:min-h-[3.8rem] sm:gap-4">
          <div className="flex min-w-0 items-center gap-3 pr-2 sm:pr-0 lg:gap-5">
            <Link href="/" className="group flex min-w-0 items-center">
              <Image
                src="/brand/ArsNeos-full_logo-white-header.png"
                alt="ArsNeos"
                width={701}
                height={572}
                sizes="(min-width: 1024px) 69px, (min-width: 640px) 59px, 54px"
                style={{ width: "auto" }}
                className="h-11 w-auto object-contain sm:h-12 lg:h-14"
                priority
              />
            </Link>
            <div className="hidden md:flex">
              <HeaderNavButtons />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {user ? (
              <>
                <Button asChild className="h-9 rounded-full px-3.5 text-[0.72rem] tracking-[0.08em] sm:px-4">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <LogoutButton />
              </>
            ) : (
              <>
                <Button asChild className="h-9 rounded-full px-3.5 text-[0.72rem] tracking-[0.08em] sm:px-4">
                  <Link href="/signup">Become a Creator</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="h-9 rounded-full px-3 text-[0.72rem] tracking-[0.08em] sm:px-3.5"
                >
                  <Link href="/login">Login</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-1.5 flex justify-center md:hidden">
          <HeaderNavButtons />
        </div>
      </div>
    </header>
  );
}
