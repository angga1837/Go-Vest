'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AlertWithWorkerName } from '@/lib/types';

export function DangerPopup() {
  const [alert, setAlert] = useState<AlertWithWorkerName | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('global-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        async (payload) => {
          const newAlert = payload.new as Omit<AlertWithWorkerName, 'worker_name'>;
          const { data: workerData } = await supabase
            .from('workers')
            .select('name')
            .eq('id', newAlert.worker_id)
            .single();

          setAlert({
            ...newAlert,
            worker_name: workerData?.name ?? 'Pekerja tidak diketahui',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-danger-border bg-white shadow-xl">
        <div className="flex items-center gap-3 rounded-t-2xl bg-danger-bg px-6 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-accent text-xl text-white">
            !
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-danger-text">
              Peringatan Bahaya
            </p>
            <p className="font-mono text-xs text-ink-500">
              {new Date(alert.triggered_at).toLocaleTimeString('id-ID')}
            </p>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-base text-ink-900">
            <span className="font-semibold">{alert.worker_name}</span> — Status: Danger
          </p>
          <p className="mt-1 text-sm text-ink-700">Penyebab: {alert.cause}</p>
          <p className="text-sm text-ink-700">Lokasi: {alert.location_label ?? 'Tidak diketahui'}</p>
        </div>

        <div className="flex gap-2 border-t border-ink-100 px-6 py-4">
          <button
            onClick={() => setAlert(null)}
            className="flex-1 rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100"
          >
            Tutup
          </button>
          <button
            onClick={() => {
              router.push(`/workers/${alert.worker_id}`);
              setAlert(null);
            }}
            className="flex-1 rounded-lg bg-danger-accent px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Lihat Pekerja
          </button>
        </div>
      </div>
    </div>
  );
}
