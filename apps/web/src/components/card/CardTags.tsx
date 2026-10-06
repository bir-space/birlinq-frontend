/** Tags in the theme's three rotating tones. */
export function CardTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag, i) => {
        const tone = (i % 3) + 1;
        return (
          <li
            key={`${tag}-${i}`}
            className="max-w-full truncate rounded-full px-3 py-1.5 text-[13px] font-medium"
            style={{
              backgroundColor: `var(--card-tag-bg-${tone})`,
              color: `var(--card-tag-fg-${tone})`,
            }}
          >
            {tag}
          </li>
        );
      })}
    </ul>
  );
}
