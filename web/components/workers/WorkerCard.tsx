import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';

type WorkerCardProps = {
  id: string;
  name: string;
  role: string | null;
  photoUrl: string | null;
  locationLabel: string | null;
  isDanger: boolean;
  bpm: number | null;
};

export function WorkerCard({ id, name, role, photoUrl, locationLabel, isDanger, bpm }: WorkerCardProps) {
  return (
    <Link
      href={`/workers/${id}`}
      className={`block rounded-xl border bg-white p-4 transition-shadow hover:shadow-md ${
        isDanger ? 'border-danger-border' : 'border-ink-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 overflow-hidden rounded-full bg-ink-100">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-ink-500">
              {name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <p className="font-medium text-ink-900">{name}</p>
          <p className="text-xs text-ink-500">
            {role ?? 'Pekerja'} &middot; {locationLabel ?? 'Lokasi belum diatur'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <StatusBadge isDanger={isDanger} />
        <span className="font-mono text-sm text-ink-700">
          {bpm && bpm > 0 ? `${bpm} BPM` : '— BPM'}
        </span>
      </div>
    </Link>
  );
}
