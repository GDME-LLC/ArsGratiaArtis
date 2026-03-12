import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/constants/site";

export function Hero() {
  return (
    <section className="container-shell pt-16 sm:pt-20 lg:pt-24">
      <div className="surface-panel cinema-frame relative overflow-hidden px-6 py-14 sm:px-10 lg:px-14 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(199,166,106,0.14),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(149,52,80,0.14),transparent_22%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_40%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[radial-gradient(circle_at_center,rgba(199,166,106,0.16),transparent_52%)] lg:block" />
        <div className="absolute left-[8%] top-[14%] h-24 w-24 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[8%] right-[18%] h-28 w-28 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-6 top-6 hidden h-[calc(100%-3rem)] w-[34%] rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 lg:block">
          <div className="flex h-full flex-col justify-between rounded-[18px] border border-white/10 bg-black/25 p-6">
            <div>
              <p className="display-kicker">Creator-First Cinema</p>
              <p className="mt-4 font-serif text-3xl font-semibold leading-tight text-foreground">
                Built for authored work, not platform sameness.
              </p>
            </div>
            <div className="space-y-4 body-sm">
              <div>
                <p className="title-md text-foreground">Publish films with presence</p>
                <p>Dark premium presentation that keeps the frame, voice, and creator in control.</p>
              </div>
              <div>
                <p className="title-md text-foreground">Connect craft to the work</p>
                <p>Link films to tools, references, and process without turning the experience into SaaS furniture.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative max-w-4xl lg:max-w-[58%]">
          <p className="display-kicker">{siteConfig.name}</p>
          <p className="eyebrow mt-4">{siteConfig.motto}</p>
          <h1 className="hero-title mt-6 max-w-4xl text-balance">
            {siteConfig.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl body-lg">{siteConfig.heroDescription}</p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="xl">
              <Link href="/feed">Explore Films</Link>
            </Button>
            <Button asChild size="xl" variant="ghost">
              <Link href="/signup">Become a Creator</Link>
            </Button>
          </div>

          <div className="mt-12 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
            <div className="space-y-2">
              <p className="display-kicker">Films</p>
              <p className="title-md text-foreground">Present the work cinematically</p>
              <p className="body-sm">Upload, stream, and publish films in a frame that feels intentional.</p>
            </div>
            <div className="space-y-2">
              <p className="display-kicker">Creators</p>
              <p className="title-md text-foreground">Own your profile and voice</p>
              <p className="body-sm">Give each creator a home with authorship instead of generic platform chrome.</p>
            </div>
            <div className="space-y-2">
              <p className="display-kicker">Resources</p>
              <p className="title-md text-foreground">Tie process to finished work</p>
              <p className="body-sm">Surface tools and references that deepen how viewers engage with the film.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
