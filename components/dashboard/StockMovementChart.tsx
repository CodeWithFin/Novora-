'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/lib/hooks/useDashboard';

export function StockMovementChart() {
  const { data, isLoading, isError, refetch } = useDashboard();

  const chartData = useMemo(() => {
    if (!data?.stockMovement) return [];

    const end = new Date();
    const start = subDays(end, 29);
    const days = eachDayOfInterval({ start, end });

    const byDate = new Map<string, { in: number; out: number }>();
    for (const day of days) {
      byDate.set(format(day, 'yyyy-MM-dd'), { in: 0, out: 0 });
    }

    for (const row of data.stockMovement) {
      const key = row.date.slice(0, 10);
      const entry = byDate.get(key);
      if (!entry) continue;
      if (row.type === 'IN') entry.in += row.total;
      else if (row.type === 'OUT') entry.out += row.total;
    }

    return days.map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const entry = byDate.get(key)!;
      return {
        date: format(day, 'dd MMM'),
        in: entry.in,
        out: entry.out,
      };
    });
  }, [data?.stockMovement]);

  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-danger">
          Failed to load chart.{' '}
          <button type="button" onClick={() => refetch()} className="underline">
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock dance (30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e1e2e" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              stroke="#606078"
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke="#606078" fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#22222e',
                border: '1px solid #2a2a3c',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f4f4f6' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="in"
              name="Stock In"
              stroke="#6366F1"
              fillOpacity={1}
              fill="url(#colorIn)"
            />
            <Area
              type="monotone"
              dataKey="out"
              name="Stock Out"
              stroke="#F59E0B"
              fillOpacity={1}
              fill="url(#colorOut)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
