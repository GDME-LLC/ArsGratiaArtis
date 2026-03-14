"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { NotificationItem } from "@/lib/services/notifications";
import { cn, formatRelativeRelease } from "@/lib/utils";

type NotificationBellProps = {
  notifications: NotificationItem[];
  initialUnreadCount: number;
};

export function NotificationBell({
  notifications,
  initialUnreadCount,
}: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(notifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(notifications);
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount, notifications]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function markRead(ids?: string[]) {
    const response = await fetch("/api/notifications/read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ids && ids.length > 0 ? { ids } : {}),
    });

    if (!response.ok) {
      throw new Error("Unable to update notifications.");
    }
  }

  function applyRead(ids?: string[]) {
    if (!ids || ids.length === 0) {
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      return;
    }

    const idSet = new Set(ids);
    setItems((current) =>
      current.map((item) => (idSet.has(item.id) ? { ...item, read: true } : item)),
    );
    setUnreadCount((current) => Math.max(0, current - ids.length));
  }

  function handleNotificationClick(item: NotificationItem) {
    const unreadIds = item.read ? [] : [item.id];

    startTransition(async () => {
      try {
        if (unreadIds.length > 0) {
          await markRead(unreadIds);
          applyRead(unreadIds);
        }
      } finally {
        setIsOpen(false);
        router.push(item.href);
        router.refresh();
      }
    });
  }

  function handleMarkAllAsRead() {
    const unreadIds = items.filter((item) => !item.read).map((item) => item.id);

    if (unreadIds.length === 0) {
      return;
    }

    startTransition(async () => {
      await markRead();
      applyRead();
      router.refresh();
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:border-white/20 hover:text-foreground"
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-white/10 bg-black/90 shadow-[0_32px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Notifications
              </p>
              <p className="mt-1 text-sm text-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="h-auto px-0 py-0 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:bg-transparent hover:text-foreground"
              onClick={handleMarkAllAsRead}
              disabled={isPending || unreadCount === 0}
            >
              Mark all as read
            </Button>
          </div>

          {items.length > 0 ? (
            <div className="max-h-[26rem] overflow-y-auto">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNotificationClick(item)}
                  className={cn(
                    "flex w-full flex-col items-start gap-2 border-b border-white/10 px-4 py-4 text-left transition hover:bg-white/5",
                    !item.read && "bg-white/[0.03]",
                  )}
                >
                  <div className="flex w-full items-start justify-between gap-4">
                    <p className="text-sm leading-6 text-foreground">{item.message}</p>
                    {!item.read ? (
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {formatRelativeRelease(item.createdAt).replace("Published ", "")}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8">
              <p className="text-sm text-foreground">No notifications yet.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Likes, comments, follows, and editorial selections will appear here.
              </p>
            </div>
          )}

          <div className="border-t border-white/10 px-4 py-3">
            <Link
              href="/dashboard"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
              onClick={() => setIsOpen(false)}
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
