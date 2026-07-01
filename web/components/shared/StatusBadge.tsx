export function StatusBadge({ isDanger }: { isDanger: boolean }) {
  if (isDanger) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-bg px-2.5 py-1 text-xs font-semibold text-danger-text">
        <span className="h-1.5 w-1.5 rounded-full bg-danger-accent" />
        Danger
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-safe-bg px-2.5 py-1 text-xs font-semibold text-safe-text">
      <span className="h-1.5 w-1.5 rounded-full bg-safe-accent" />
      Aman
    </span>
  );
}
