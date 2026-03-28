import Image from "next/image";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import {
  getUnreadNotificationCount,
  listNotificationsForUser,
} from "@/lib/services/notifications";
import { getUser } from "@/lib/supabase/auth";

const navItems = [
  { href: "/manifesto", label: "Manifesto" },
  { href: "/beyond-cinema", label: "Beyond Cinema" },
  { href: "/resources", label: "Resources" },
];

export async function SiteHeader() {
  const user = await getUser();
  const [notifications, unreadCount] = user
    ? await Promise.all([
        listNotificationsForUser(user.id, 10),
        getUnreadNotificationCount(user.id),
      ])
    : [[], 0];

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

          <nav className="hidden flex-1 items-center justify-center gap-6 lg:gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-3">
            {user ? (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link href="/settings">Creator Studio</Link>
                </Button>
                <NotificationBell notifications={notifications} initialUnreadCount={unreadCount} />
                <LogoutButton />
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="hidden sm:inline-flex">
                  <Link href="/signup">Become a Creator</Link>
                </Button>
                <Button asChild className="sm:hidden">
                  <Link href="/login">Login</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2 md:hidden">
          {user ? (
            <>
              <Button asChild variant="ghost" className="min-w-0 flex-1 px-3 sm:flex-none">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" className="min-w-0 flex-1 px-3 sm:flex-none">
                <Link href="/settings">Creator Studio</Link>
              </Button>
              <Button asChild variant="ghost" className="min-w-0 flex-1 px-3 sm:flex-none">
                <Link href="/">Home</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="min-w-0 flex-1 sm:flex-none">
                <Link href="/manifesto">Manifesto</Link>
              </Button>
              <Button asChild variant="ghost" className="min-w-0 flex-1 sm:flex-none">
                <Link href="/beyond-cinema">Beyond Cinema</Link>
              </Button>
              <Button asChild variant="ghost" className="min-w-0 flex-1 sm:flex-none">
                <Link href="/resources">Resources</Link>
              </Button>
              <Button asChild className="min-w-0 flex-1 sm:flex-none">
                <Link href="/signup">Become a Creator</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
