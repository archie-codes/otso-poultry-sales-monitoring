"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatCompactPeso(amount: number) {
  return pesoFormatter.format(amount);
}

// --- 0. DYNAMIC GREETING ---
export function LiveGreeting({ userName }: { userName?: string | null }) {
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const firstName = userName?.split(" ")[0] || "Admin";

  return (
    <h1 className="text-3xl font-black tracking-tight text-foreground">
      {greeting}, {firstName} 👋
    </h1>
  );
}

// --- 0.5. ANIMATED NUMBER COUNTER ---
export function AnimatedCounter({
  value,
  formatType = "number",
}: {
  value: number;
  formatType?: "number" | "compact" | "peso";
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const duration = 1200;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(easeProgress * value);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  if (formatType === "peso") {
    return (
      <>
        {new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
          maximumFractionDigits: 0,
        }).format(count)}
      </>
    );
  } else if (formatType === "compact") {
    return (
      <>
        {new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(count)}
      </>
    );
  } else {
    return (
      <>
        {new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
          count,
        )}
      </>
    );
  }
}

// --- 1. LIVE CLOCK COMPONENT ---
export function LiveClock() {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted)
    return (
      <p className="text-sm font-medium text-muted-foreground mt-1">
        Loading system clock...
      </p>
    );

  return (
    <p className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-widest">
      {format(time, "EEEE, MMMM d, yyyy • hh:mm:ss a")}
    </p>
  );
}

// --- 2. FINANCIAL TREND (AREA CHART) ---
export function FinancialAreaChart({ data }: { data: any[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.5}
          />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            dy={10}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => formatCompactPeso(val)}
            tick={{
              fontSize: 11,
              fill: "hsl(var(--muted-foreground))",
            }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
              boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.1)",
            }}
            formatter={(value: number, name: string) => [
              formatCompactPeso(value),
              name.charAt(0).toUpperCase() + name.slice(1),
            ]}
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorSales)"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="#f43f5e"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorExpenses)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- 3. EXPENSE BREAKDOWN (DONUT CHART) ---
export function ExpenseDonutChart({ data }: { data: any[] }) {
  const COLORS = [
    "#6366f1",
    "#f59e0b",
    "#f43f5e",
    "#10b981",
    "#0ea5e9",
    "#8b5cf6",
    "#64748b",
  ];

  return (
    <div className="h-[220px] w-full flex justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={90}
            paddingAngle={4}
            dataKey="amount"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCompactPeso(value)}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
              boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.1)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- 4. USERS BY ROLE (BAR CHART) ---
export function UserRoleChart({ data }: { data: any[] }) {
  return (
    <div className="h-[120px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        {/* THE FIX: Changed left margin from -20 to 0 so words don't cut off */}
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            horizontal={false}
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.5}
          />
          <XAxis type="number" hide />
          <YAxis
            dataKey="role"
            type="category"
            tickLine={false}
            axisLine={false}
            width={55} // THE FIX: Gave the Y-Axis an explicit width so "OWNER" fits
            tick={{
              fontSize: 10,
              fill: "hsl(var(--muted-foreground))",
              fontWeight: "bold",
            }}
            tickFormatter={(value) => String(value).toUpperCase()}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
              padding: "8px 12px",
            }}
            formatter={(value: number) => [value, "Users"]}
          />
          <Bar
            dataKey="count"
            fill="#0ea5e9"
            radius={[0, 4, 4, 0]}
            barSize={16}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 0 ? "#6366f1" : "#0ea5e9"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
