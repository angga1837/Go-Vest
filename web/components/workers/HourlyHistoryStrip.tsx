import type { TelemetryHourlyAgg } from '@/lib/types';

export function HourlyHistoryStrip({ history }: { history: TelemetryHourlyAgg[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-ink-500">
        Belum ada histori per jam. Data akan muncul setelah agregasi cron pertama berjalan.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {history.map((h) => {
        const hourLabel = new Date(h.hour_bucket).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const hadDanger = h.danger_event_count > 0;

        return (
          <div
            key={h.id}
            className={`rounded-lg border p-3 text-xs ${
              hadDanger ? 'border-danger-border bg-danger-bg' : 'border-ink-100 bg-white'
            }`}
          >
            <p className="font-mono font-semibold text-ink-900">{hourLabel}</p>
            <p className="mt-1 text-ink-700">BPM: {h.avg_bpm?.toFixed(0) ?? '—'}</p>
            <p className="text-ink-700">SpO2: {h.avg_spo2?.toFixed(0) ?? '—'}%</p>
            <p className="text-ink-700">Gas: {h.avg_gas_value?.toFixed(0) ?? '—'}</p>
            {hadDanger && (
              <p className="mt-1 font-semibold text-danger-text">{h.danger_event_count}x danger</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
