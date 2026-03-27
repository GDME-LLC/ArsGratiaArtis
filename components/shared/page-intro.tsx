type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <div className="max-w-2xl" data-reveal="intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="headline-lg mt-2.5 text-balance">{title}</h1>
      <p className="body-lg mt-3.5 max-w-xl">{description}</p>
    </div>
  );
}
