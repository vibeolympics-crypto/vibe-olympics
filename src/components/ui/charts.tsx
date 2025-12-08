"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type PieLabelRenderProps,
} from "recharts";
import { formatPrice } from "@/lib/utils";

// 차트 색상 팔레트
const COLORS = {
  primary: "#8B5CF6",
  secondary: "#06B6D4",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  violet: "#A78BFA",
  blue: "#3B82F6",
  cyan: "#22D3EE",
  emerald: "#34D399",
  pink: "#EC4899",
};

const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.pink];

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  formatter?: (value: number) => string;
}

// 커스텀 툴팁
const CustomTooltip = ({
  active,
  payload,
  label,
  valuePrefix = "",
  valueSuffix = "",
  formatter,
}: ChartTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-[var(--text-primary)] mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[var(--text-tertiary)]">{entry.name}:</span>
          <span className="font-medium text-[var(--text-primary)]">
            {valuePrefix}
            {formatter ? formatter(entry.value) : entry.value.toLocaleString()}
            {valueSuffix}
          </span>
        </div>
      ))}
    </div>
  );
};

// 수익 라인 차트
interface RevenueChartData {
  date: string;
  revenue: number;
  sales: number;
}

interface RevenueLineChartProps {
  data: RevenueChartData[];
  height?: number;
}

export function RevenueLineChart({ data, height = 300 }: RevenueLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
        <XAxis
          dataKey="date"
          stroke="var(--text-tertiary)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--text-tertiary)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          content={
            <CustomTooltip
              formatter={(value) => formatPrice(value)}
            />
          }
        />
        <Legend
          verticalAlign="top"
          height={36}
          formatter={(value) => (
            <span className="text-sm text-[var(--text-secondary)]">{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          name="수익"
          stroke={COLORS.primary}
          fillOpacity={1}
          fill="url(#colorRevenue)"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="sales"
          name="판매"
          stroke={COLORS.secondary}
          strokeWidth={2}
          dot={false}
          yAxisId={0}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// 판매 막대 차트
interface SalesBarChartData {
  name: string;
  sales: number;
  revenue: number;
}

interface SalesBarChartProps {
  data: SalesBarChartData[];
  height?: number;
}

export function SalesBarChart({ data, height = 300 }: SalesBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
        <XAxis
          dataKey="name"
          stroke="var(--text-tertiary)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--text-tertiary)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={
            <CustomTooltip
              formatter={(value) => value.toLocaleString()}
            />
          }
        />
        <Legend
          verticalAlign="top"
          height={36}
          formatter={(value) => (
            <span className="text-sm text-[var(--text-secondary)]">{value}</span>
          )}
        />
        <Bar
          dataKey="sales"
          name="판매 건수"
          fill={COLORS.primary}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="revenue"
          name="수익 (천원)"
          fill={COLORS.secondary}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 카테고리별 파이 차트
interface CategoryPieData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface CategoryPieChartProps {
  data: CategoryPieData[];
  height?: number;
}

export function CategoryPieChart({ data, height = 300 }: CategoryPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={(props: PieLabelRenderProps) => {
            const { name, percent } = props;
            return `${name || ''} ${(((percent as number) || 0) * 100).toFixed(0)}%`;
          }}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={PIE_COLORS[index % PIE_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const item = payload[0];
            return (
              <div className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg p-3 shadow-lg">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {item.name}
                </p>
                <p className="text-sm text-[var(--text-tertiary)]">
                  {formatPrice(item.value as number)} ({((item.value as number / total) * 100).toFixed(1)}%)
                </p>
              </div>
            );
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span className="text-sm text-[var(--text-secondary)]">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// 조회수/전환율 차트
interface ConversionChartData {
  date: string;
  views: number;
  conversions: number;
  rate: number;
}

interface ConversionChartProps {
  data: ConversionChartData[];
  height?: number;
}

export function ConversionChart({ data, height = 300 }: ConversionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
        <XAxis
          dataKey="date"
          stroke="var(--text-tertiary)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="left"
          stroke="var(--text-tertiary)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="var(--text-tertiary)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          content={
            <CustomTooltip
              formatter={(value) => value.toLocaleString()}
            />
          }
        />
        <Legend
          verticalAlign="top"
          height={36}
          formatter={(value) => (
            <span className="text-sm text-[var(--text-secondary)]">{value}</span>
          )}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="views"
          name="조회수"
          stroke={COLORS.blue}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="conversions"
          name="구매"
          stroke={COLORS.success}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="rate"
          name="전환율"
          stroke={COLORS.warning}
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// 미니 스파크라인 차트
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = COLORS.primary, height = 40 }: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`sparkline-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fillOpacity={1}
          fill={`url(#sparkline-${color})`}
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
