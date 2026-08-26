export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block size-6 animate-spin rounded-full border-2 border-muted border-t-accent ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}
