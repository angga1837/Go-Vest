import { createServerClient } from '@/lib/supabase/server';
import { SummaryCards } from '@/components/overview/SummaryCards';
import { LocationDonutChart } from '@/components/overview/LocationDonutChart';

export const revalidate = 0; // selalu fetch data terbaru

async function getOverviewData() {
  const supabase = createServerClient();

  const { data: workers } = await supabase.from('workers').select('id, location_label');

  if (!workers || workers.length === 0) {
    return { totalActive: 0, inDanger: 0, avgBpm: 0, byLocation: {} };
  }

  // Ambil telemetry terbaru per worker_id
  const { data: latestTelemetry } = await supabase
    .from('telemetry')
    .select('worker_id, bpm, is_danger, recorded_at')
    .order('recorded_at', { ascending: false });

  // Kurangi ke satu baris terbaru per worker_id 
  const latestByWorker = new Map<string, { bpm: number | null; is_danger: boolean }>();
  for (const row of latestTelemetry ?? []) {
    if (!latestByWorker.has(row.worker_id)) {
      latestByWorker.set(row.worker_id, { bpm: row.bpm, is_danger: row.is_danger });
    }
  }

  const totalActive = workers.length;
  let inDanger = 0;
  let bpmSum = 0;
  let bpmCount = 0;

  for (const worker of workers) {
    const latest = latestByWorker.get(worker.id);
    if (latest?.is_danger) inDanger++;
    if (latest?.bpm && latest.bpm > 0) {
      bpmSum += latest.bpm;
      bpmCount++;
    }
  }

  const byLocation: Record<string, number> = {};
  for (const worker of workers) {
    const label = worker.location_label ?? 'Belum ditentukan';
    byLocation[label] = (byLocation[label] ?? 0) + 1;
  }

  return {
    totalActive,
    inDanger,
    avgBpm: bpmCount > 0 ? bpmSum / bpmCount : 0,
    byLocation,
  };
}

export default async function OverviewPage() {
  const { totalActive, inDanger, avgBpm, byLocation } = await getOverviewData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Overview</h1>
        <p className="text-sm text-ink-500">Ringkasan kondisi seluruh pekerja saat ini.</p>
      </div>

      <SummaryCards totalActive={totalActive} inDanger={inDanger} avgBpm={avgBpm} />

      <div className="rounded-xl border border-ink-100 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-700">Distribusi Rompi per Lokasi</h2>
        <LocationDonutChart byLocation={byLocation} />
      </div>
    </div>
  );
}
