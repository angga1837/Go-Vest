import { createServerClient } from '@/lib/supabase/server';
export async function GET(req: Request) {

  const supabase = createServerClient();
  const { data: workers } = await supabase.from('workers').select('id');

  if (!workers) return Response.json({ success: true, processed: 0 });

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const hourBucket = new Date(Math.floor(Date.now() / 3600000) * 3600000).toISOString();

  let processed = 0;

  for (const worker of workers) {
    const { data: rows } = await supabase
      .from('telemetry')
      .select('bpm, spo2, gas_value, is_danger')
      .eq('worker_id', worker.id)
      .gte('recorded_at', hourAgo);

    if (!rows || rows.length === 0) continue;

    const bpmValues = rows.map((r) => r.bpm).filter((v): v is number => v !== null && v > 0);
    const spo2Values = rows.map((r) => r.spo2).filter((v): v is number => v !== null && v > 0);
    const gasValues = rows.map((r) => r.gas_value).filter((v): v is number => v !== null);

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

    const { error } = await supabase.from('telemetry_hourly_agg').upsert(
      {
        worker_id: worker.id,
        hour_bucket: hourBucket,
        avg_bpm: avg(bpmValues),
        avg_spo2: avg(spo2Values),
        avg_gas_value: avg(gasValues),
        max_gas_value: gasValues.length ? Math.max(...gasValues) : null,
        danger_event_count: rows.filter((r) => r.is_danger).length,
      },
      { onConflict: 'worker_id,hour_bucket' }
    );

    if (!error) processed++;
  }

  return Response.json({ success: true, processed });
}
