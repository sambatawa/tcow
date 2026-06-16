interface SectionHeaderProps {
  title: string;
  description: string;
}

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1">
        {title}
      </h2>
      <p className="text-sm text-stone-600 dark:text-stone-400">{description}</p>
    </div>
  );
}
