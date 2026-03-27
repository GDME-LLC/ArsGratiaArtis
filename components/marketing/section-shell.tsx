import { cn } from "@/lib/utils";

type SectionShellProps = {
  children: React.ReactNode;
  className?: string;
  reveal?: boolean;
};

export function SectionShell({ children, className, reveal = true }: SectionShellProps) {
  return (
    <section data-reveal={reveal ? "section" : undefined} className={cn("container-shell public-section-shell", className)}>
      {children}
    </section>
  );
}
