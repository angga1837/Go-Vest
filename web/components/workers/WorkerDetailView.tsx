'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useRealtimeTelemetry } from '@/lib/useRealtimeTelemetry';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { VitalsChart } from '@/components/workers/VitalsChart';
import { HourlyHistoryStrip } from '@/components/workers/HourlyHistoryStrip';
import { ManualAlertButton } from '@/components/workers/ManualAlertButton';
import type { Worker, Telemetry, TelemetryHourlyAgg } from '@/lib/types';

const WorkerMap = dynamic(
  () => import('@/components/workers/WorkerMap').then((m) => m.WorkerMap),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-ink-100" /> }
);

const Orientation3D = dynamic(
  () => import('@/components/workers/Orientation3D').then((m) => m.Orientation3D),
  { ssr: false, loading: () => <div className="h-56 animate-pulse rounded-lg bg-ink-100" /> }
);

type WorkerDetailViewProps = {
  worker: Worker;
  initialTelemetry: Telemetry | null;
  vitalsHistory: { time: string; bpm: number | null; spo2: number | null }[];
  hourlyHistory: TelemetryHourlyAgg[];
};

export function WorkerDetailView({
  worker,
  initialTelemetry,
  vitalsHistory,
  hourlyHistory,
}: WorkerDetailViewProps) {
  const latest = useRealtimeTelemetry(worker.id, initialTelemetry);
  const [chartData, setChartData] = useState(vitalsHistory);

  // Detiap ada data 'latest' baru, dorong ke ujung grafik
  useEffect(() => {
    if (latest && latest.bpm !== null && latest.spo2 !== null) {
      setChartData((prev) => {
        // Format waktu agar sesuai dengan sumbu-X di grafik
        const newTime = new Date(latest.recorded_at).toLocaleTimeString('id-ID', { 
          hour: '2-digit', minute: '2-digit', second: '2-digit' 
        });
        if (prev.length > 0 && prev[prev.length - 1].time === newTime) return prev;
        // potong array agar maksimal 50 titik (tidak lag)
        const updatedChart = [...prev, { time: newTime, bpm: latest.bpm, spo2: latest.spo2 }];
        return updatedChart.slice(-50);
      });
    }
  }, [latest]);

  return (
    <div className="space-y-6">
      {/* Header identitas pekerja */}
      <div className="flex items-start justify-between rounded-xl border border-ink-100 bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-ink-100">
            {worker.photo_url ? (
              <img src={worker.photo_url} alt={worker.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-ink-500">
                {worker.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink-900">{worker.name}</h1>
            <p className="text-sm text-ink-500">
              {worker.role ?? 'Pekerja'} &middot; {worker.location_label ?? 'Lokasi belum diatur'}
            </p>
          </div>
        </div>
        <StatusBadge isDanger={latest?.is_danger ?? false} />
      </div>

      {latest?.is_danger && (
        <div className="rounded-xl border border-danger-border bg-danger-bg p-4 text-sm text-danger-text">
          <span className="font-semibold">{latest.alert_message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Peta lokasi */}
        <div className="rounded-xl border border-ink-100 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink-700">Lokasi GPS</h2>
          <WorkerMap
            lat={latest?.lat ?? 0}
            lon={latest?.lon ?? 0}
            workerName={worker.name}
            gpsFixValid={latest?.gps_fix_valid ?? false}
          />
          {latest?.gps_fix_valid && (
            <p className="mt-2 font-mono text-xs text-ink-500">
              {latest.lat?.toFixed(6)}, {latest.lon?.toFixed(6)}
            </p>
          )}
        </div>

        {/* Orientasi 3D */}
        <div className="rounded-xl border border-ink-100 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink-700">Orientasi Tubuh (Real-time)</h2>
          <Orientation3D roll={latest?.roll ?? 0} pitch={latest?.pitch ?? 0} />
          <p className="mt-2 font-mono text-xs text-ink-500">
            Roll: {latest?.roll?.toFixed(1) ?? '—'}&deg; &middot; Pitch: {latest?.pitch?.toFixed(1) ?? '—'}&deg;
          </p>
        </div>
      </div>

      {/* Data vital angka */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'BPM', value: latest?.bpm },
          { label: 'SpO2', value: latest?.spo2, suffix: '%' },
          { label: 'Kadar Gas', value: latest?.gas_value },
          { label: 'Total G', value: latest?.total_g?.toFixed(2) },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-ink-100 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{item.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-ink-900">
              {item.value ?? '—'}
              {item.suffix ?? ''}
            </p>
          </div>
        ))}
      </div>

      {/* Grafik BPM/SpO2 */}
      <div className="rounded-xl border border-ink-100 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-700">Grafik Vital Sign</h2>
        <VitalsChart data={chartData} /> 
      </div>

      {/* Histori 10 jam */}
      <div className="rounded-xl border border-ink-100 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-700">Histori 10 Jam Terakhir</h2>
        <HourlyHistoryStrip history={hourlyHistory} />
      </div>

      {/* Tombol manual alert */}
      <div className="rounded-xl border border-ink-100 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-700">Backup Manual</h2>
        <p className="mb-3 text-xs text-ink-500">
          Gunakan jika sistem otomatis pada rompi mengalami error namun kondisi pekerja perlu
          dilaporkan segera.
        </p>
        <ManualAlertButton workerId={worker.id} />
      </div>
    </div>
  );
}
