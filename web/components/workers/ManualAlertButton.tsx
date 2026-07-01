'use client';

import { useState } from 'react';

export function ManualAlertButton({ workerId }: { workerId: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleClick() {
    setStatus('sending');
    try {
      const res = await fetch(`/api/workers/${workerId}/manual-alert`, { method: 'POST' });
      if (!res.ok) throw new Error('Gagal');
      setStatus('sent');
      setTimeout(() => setStatus('idle'), 4000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  }

  const labelByStatus: Record<typeof status, string> = {
    idle: 'Kirim Alert Manual (Backup)',
    sending: 'Mengirim perintah ke rompi...',
    sent: 'Perintah terkirim ke device',
    error: 'Gagal — device mungkin offline',
  };

  return (
    <button
      onClick={handleClick}
      disabled={status === 'sending'}
      className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${
        status === 'error'
          ? 'bg-danger-accent'
          : status === 'sent'
          ? 'bg-safe-accent'
          : 'bg-brand hover:bg-brand-light'
      } disabled:opacity-60`}
    >
      {labelByStatus[status]}
    </button>
  );
}
