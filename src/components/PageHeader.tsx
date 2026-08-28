export default function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  const today = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(
    new Date()
  );
  return (
    <header className="flex justify-between gap-5 items-end mb-7 max-[600px]:block">
      <div>
        <div className="text-[#55765d] tracking-widest text-[11px] font-extrabold">
          {eyebrow}
        </div>
        <h1 className="font-serif text-[clamp(28px,4vw,42px)] mt-1.5 mb-0 text-[#183323]">
          {title}
        </h1>
        <p className="mt-1.5 mb-0 text-[#68776b]">{subtitle}</p>
      </div>
      <div className="text-[13px] text-[#728173] whitespace-nowrap max-[600px]:mt-3">
        {today}
      </div>
    </header>
  );
}
