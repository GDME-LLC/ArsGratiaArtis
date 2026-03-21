"use client";

import { useMemo, useState, type ComponentType, type SVGProps } from "react";
import {
  Twitter,
  Facebook,
  Linkedin,
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
};

type ShareIcon = ComponentType<SVGProps<SVGSVGElement>>;

type ShareItem = {
  href: string;
  label: string;
  Icon: ShareIcon;
  external?: boolean;
};

function RedditGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="13" r="6.5" />
      <path d="M8.5 11.2c.8-.6 1.9-.9 3.5-.9 1.6 0 2.7.3 3.5.9" />
      <path d="M9.4 15.3c.7.7 1.6 1 2.6 1 1 0 1.9-.3 2.6-1" />
      <circle cx="9.4" cy="13.2" r=".8" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="13.2" r=".8" fill="currentColor" stroke="none" />
      <path d="M14.1 6.8 15 4.3l2.3.6" />
      <path d="M16.2 9.2a2 2 0 1 1 2-3.4" />
    </svg>
  );
}

export function ShareActions({ url, title, className }: ShareActionsProps) {
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
        href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
        label: "Share on Reddit",
        Icon: RedditGlyph,
        external: true,
      },
      {
        href: `mailto:?subject=${encodedTitle}&body=${encodedMailBody}`,
        label: "Share by email",
        Icon: Mail,
      },
    ];
  }, [title, url]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_RESET_DELAY_MS);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={className}>
      <p className="display-kicker">Share</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {shareItems.map(({ href, label, Icon, external }) => (
          <Button key={label} asChild variant="ghost" className="h-10 px-3 text-foreground/88">
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
          className="h-10 px-3 text-foreground/88"
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