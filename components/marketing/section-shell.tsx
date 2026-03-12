import { cn } from "@/lib/utils";

type SectionShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionShell({ children, className }: SectionShellProps) {
  return <section className={cn("container-shell", className)}>{children}</section>;
}
