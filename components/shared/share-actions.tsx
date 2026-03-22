"use client";

import { useMemo, useState, type ComponentType, type SVGProps } from "react";
import {
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  Mail,
  Link2,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const COPY_RESET_DELAY_MS = 2000;

type ShareActionsProps = {
  url: string;
  title: string;
  className?: string;
  heading?: string;
};

type ShareIcon = ComponentType<SVGProps<SVGSVGElement>>;

type ShareItem = {
  href: string;
  label: string;
  Icon: ShareIcon;
  external?: boolean;
};

export function ShareActions({ url, title, className, heading = "Share" }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const shareItems = useMemo<ShareItem[]>(() => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedMailBody = encodeURIComponent(`${title}\n\n${url}`);

    return [
      {
        href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        label: "Share on X",
        Icon: Twitter,
        external: true,
      },
      {
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        label: "Share on Facebook",
        Icon: Facebook,
        external: true,
      },
      {
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        label: "Share on LinkedIn",
        Icon: Linkedin,
        external: true,
      },
      {
        href: `mailto:?subject=${encodedTitle}&body=${encodedMailBody}`,
        label: "Share by email",
        Icon: Mail,
      },
    ];
  }, [title, url]);

  function markCopied() {
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPY_RESET_DELAY_MS);
  }

  async function copyLinkToClipboard() {
    await navigator.clipboard.writeText(url);
    markCopied();
  }

  async function handleCopy() {
    try {
      await copyLinkToClipboard();
    } catch {
      setCopied(false);
    }
  }

  async function handleInstagramShare() {
    try {
      await copyLinkToClipboard();
    } catch {
      setCopied(false);
    }

    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  return (
    <div className={className}>
      <p className="display-kicker">{heading}</p>
      <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
        {shareItems.map(({ href, label, Icon, external }) => (
          <Button key={label} asChild variant="ghost" className="h-9 px-2.5 text-foreground/88 sm:h-10 sm:px-3">
            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              aria-label={label}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </a>
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          className="h-9 px-2.5 text-foreground/88 sm:h-10 sm:px-3"
          onClick={handleInstagramShare}
          aria-label="Share to Instagram"
          title="Share to Instagram"
        >
          <Instagram className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 px-2.5 text-foreground/88 sm:h-10 sm:px-3"
          onClick={handleCopy}
          aria-label={copied ? "Link copied" : "Copy link"}
          title={copied ? "Link copied" : "Copy link"}
        >
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
