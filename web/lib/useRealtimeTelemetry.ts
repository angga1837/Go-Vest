'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Telemetry } from '@/lib/types';

export function useRealtimeTelemetry(workerId: string, initialData: Telemetry | null) {
  const [latest, setLatest] = useState<Telemetry | null>(initialData);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`telemetry-${workerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry',
          filter: `worker_id=eq.${workerId}`,
        },
        (payload) => {
          setLatest(payload.new as Telemetry);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workerId]);

  return latest;
}
