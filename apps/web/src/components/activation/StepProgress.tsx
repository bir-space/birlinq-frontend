/** Five-segment progress bar of the activation wizard (A2–A4 designs). */
export function StepProgress({
  current,
  total = 5,
}: {
  current: number;
  total?: number;
}) {
  return (
    <div className="flex gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${
            i < current ? "bg-accent" : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}
