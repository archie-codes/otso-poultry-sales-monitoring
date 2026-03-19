"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendPoint = {
  month: string;
  sales: number;
  expenses: number;
};

type FarmPoint = {
  farm: string;
  sales: number;
};

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const compactPesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatPeso(amount: number) {
  return pesoFormatter.format(amount);
}

function formatCompactPeso(amount: number) {
  return compactPesoFormatter.format(amount);
}

export function TrendAreaChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0f766e" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#0f766e" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.24} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="4 4"
            className="stroke-border/60"
          />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => formatCompactPeso(Number(value))}
            className="text-[11px] font-bold text-muted-foreground"
          />
          <Tooltip
            cursor={{ stroke: "rgba(15, 23, 42, 0.08)", strokeWidth: 1 }}
            contentStyle={{
              borderRadius: "18px",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              boxShadow: "0 18px 60px rgba(15, 23, 42, 0.14)",
              backgroundColor: "rgba(255,255,255,0.96)",
            }}
            formatter={(value: number, name: string) => [
              formatPeso(Number(value)),
              name,
            ]}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            name="Expenses"
            stroke="#f97316"
            strokeWidth={2.5}
            fill="url(#expenseGradient)"
          />
          <Area
            type="monotone"
            dataKey="sales"
            name="Sales"
            stroke="#0f766e"
            strokeWidth={3}
            fill="url(#salesGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FarmBarChart({ data }: { data: FarmPoint[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 24, bottom: 0 }}
        >
          <CartesianGrid
            horizontal={false}
            strokeDasharray="4 4"
            className="stroke-border/60"
          />
          <XAxis type="number" hide />
          <YAxis
            dataKey="farm"
            type="category"
            width={100}
            tickLine={false}
            axisLine={false}
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground"
          />
          <Tooltip
            cursor={{ fill: "rgba(15, 118, 110, 0.08)" }}
            contentStyle={{
              borderRadius: "18px",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              boxShadow: "0 18px 60px rgba(15, 23, 42, 0.14)",
              backgroundColor: "rgba(255,255,255,0.96)",
            }}
            formatter={(value: number) => [formatPeso(Number(value)), "Sales"]}
          />
          <Bar
            dataKey="sales"
            radius={[0, 18, 18, 0]}
            fill="#0f766e"
            barSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
