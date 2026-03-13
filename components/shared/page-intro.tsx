type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="headline-lg mt-3 text-balance">
        {title}
      </h1>
      <p className="body-lg mt-4">
        {description}
      </p>
    </div>
  );
}
