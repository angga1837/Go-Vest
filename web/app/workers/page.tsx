import { createServerClient } from '@/lib/supabase/server';
import { WorkerCard } from '@/components/workers/WorkerCard';

export const revalidate = 0;

async function getWorkersWithLatestTelemetry() {
  const supabase = createServerClient();

  const { data: workers } = await supabase
    .from('workers')
    .select('id, name, role, photo_url, location_label');

  if (!workers) return [];

  const { data: telemetry } = await supabase
    .from('telemetry')
    .select('worker_id, bpm, is_danger, recorded_at')
    .order('recorded_at', { ascending: false });

  const latestByWorker = new Map<string, { bpm: number | null; is_danger: boolean }>();
  for (const row of telemetry ?? []) {
    if (!latestByWorker.has(row.worker_id)) {
      latestByWorker.set(row.worker_id, { bpm: row.bpm, is_danger: row.is_danger });
    }
  }

  return workers.map((worker) => ({
    ...worker,
    latest: latestByWorker.get(worker.id) ?? { bpm: null, is_danger: false },
  }));
}

export default async function WorkersPage() {
  const workers = await getWorkersWithLatestTelemetry();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Workers</h1>
        <p className="text-sm text-ink-500">Klik salah satu pekerja untuk melihat detail lengkap.</p>
      </div>

      {workers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-300 p-10 text-center text-sm text-ink-500">
          Belum ada pekerja terdaftar. Tambahkan lewat tabel `workers` di Supabase.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((worker) => (
            <WorkerCard
              key={worker.id}
              id={worker.id}
              name={worker.name}
              role={worker.role}
              photoUrl={worker.photo_url}
              locationLabel={worker.location_label}
              isDanger={worker.latest.is_danger}
              bpm={worker.latest.bpm}
            />
          ))}
        </div>
      )}
    </div>
  );
}
