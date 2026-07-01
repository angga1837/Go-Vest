type SummaryCardsProps = {
  totalActive: number;
  inDanger: number;
  avgBpm: number;
};

export function SummaryCards({ totalActive, inDanger, avgBpm }: SummaryCardsProps) {
  const cards = [
    { label: 'Rompi Aktif', value: totalActive, accent: 'text-' },
    {
      label: 'Status Danger',
      value: inDanger,
      accent: inDanger > 0 ? 'text-danger-accent' : 'text-safe-accent',
    },
    { label: 'Rata-rata BPM', value: avgBpm > 0 ? avgBpm.toFixed(0) : '—', accent: 'text-ink-900' },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-ink-100 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{card.label}</p>
          <p className={`mt-2 font-mono text-3xl font-semibold ${card.accent}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
