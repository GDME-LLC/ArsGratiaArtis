import { foundingCreatorBenefits, foundingCreatorMonetizationNote } from "@/lib/constants/founding-creators";

type FoundingCreatorBenefitsProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function FoundingCreatorBenefits({
  title = "Founding Creator Benefits",
  description = "A permanent founding tier for the first 20 creators shaping ArsNeos's beginning.",
  className,
}: FoundingCreatorBenefitsProps) {
  return (
    <aside className={`surface-panel cinema-frame p-6 sm:p-7 ${className ?? ""}`.trim()}>
      <p className="display-kicker">Founding Creator</p>
      <h3 className="title-md mt-3 text-foreground">{title}</h3>
      <p className="body-sm mt-3">{description}</p>

      <ul className="mt-5 grid gap-3 text-sm text-muted-foreground">
        {foundingCreatorBenefits.map((benefit) => (
          <li key={benefit} className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
            {benefit}
          </li>
        ))}
      </ul>

      <p className="body-sm mt-5 text-muted-foreground">{foundingCreatorMonetizationNote}</p>
    </aside>
  );
}
