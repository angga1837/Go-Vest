import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { WorkerDetailView } from '@/components/workers/WorkerDetailView';

export const revalidate = 0;

async function getWorkerDetailData(workerId: string) {
  const supabase = createServerClient();

  const { data: worker } = await supabase.from('workers').select('*').eq('id', workerId).single();
  if (!worker) return null;

  // Telemetry terbaru untuk render awal sebelum realtime 
  const { data: latestRows } = await supabase
    .from('telemetry')
    .select('*')
    .eq('worker_id', workerId)
    .order('recorded_at', { ascending: false })
    .limit(1);

  // 50 titik terakhir untuk grafik BPM/SpO2
  const { data: vitalsRows } = await supabase
    .from('telemetry')
    .select('recorded_at, bpm, spo2')
    .eq('worker_id', workerId)
    .order('recorded_at', { ascending: false })
    .limit(50);

  const vitalsHistory = (vitalsRows ?? [])
    .reverse() 
    .map((row) => ({
      time: new Date(row.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      bpm: row.bpm,
      spo2: row.spo2,
    }));

  // 10 jam terakhir dari tabel agregat
  const { data: hourlyRows } = await supabase
    .from('telemetry_hourly_agg')
    .select('*')
    .eq('worker_id', workerId)
    .order('hour_bucket', { ascending: false })
    .limit(10);

  return {
    worker,
    initialTelemetry: latestRows?.[0] ?? null,
    vitalsHistory,
    hourlyHistory: (hourlyRows ?? []).reverse(), // tampilkan dari paling lama ke terbaru
  };
}

export default async function WorkerDetailPage({ params }: { params: Promise<{ workerId: string }> }) {
  const { workerId } = await params;
  const data = await getWorkerDetailData(workerId);

  if (!data) notFound();

  return (
    <WorkerDetailView
      worker={data.worker}
      initialTelemetry={data.initialTelemetry}
      vitalsHistory={data.vitalsHistory}
      hourlyHistory={data.hourlyHistory}
    />
  );
}
