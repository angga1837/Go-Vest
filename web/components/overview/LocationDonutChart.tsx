'use client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type LocationDonutChartProps = {
  byLocation: Record<string, number>;
};

const COLORS = ['#1E3A5F', '#2E5482', '#10B981', '#F59E0B', '#6B7280'];

export function LocationDonutChart({ byLocation }: LocationDonutChartProps) {
  const data = Object.entries(byLocation).map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-ink-500">
        Belum ada data lokasi pekerja.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
