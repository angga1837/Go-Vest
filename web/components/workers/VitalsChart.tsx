'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type VitalsChartProps = {
  data: { time: string; bpm: number | null; spo2: number | null }[];
};

export function VitalsChart({ data }: VitalsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-ink-500">
        Belum ada data vital sign.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
        <Tooltip />
        <Line type="monotone" dataKey="bpm" stroke="#EF4444" strokeWidth={2} dot={false} name="BPM" />
        <Line type="monotone" dataKey="spo2" stroke="#1E3A5F" strokeWidth={2} dot={false} name="SpO2 (%)" />
      </LineChart>
    </ResponsiveContainer>
  );
}
