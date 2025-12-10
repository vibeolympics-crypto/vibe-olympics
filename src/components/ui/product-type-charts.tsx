"use client";

import {
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
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
} from "recharts";
import { formatPrice } from "@/lib/utils";

// ProductType에 맞는 색상
export const PRODUCT_TYPE_COLORS: Record<string, string> = {
  DIGITAL_PRODUCT: "#8B5CF6", // 보라색
  BOOK: "#F59E0B",            // 주황색
  VIDEO_SERIES: "#EF4444",    // 빨간색
  MUSIC_ALBUM: "#10B981",     // 초록색
};

// ProductType 한글 이름
export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  DIGITAL_PRODUCT: "디지털 상품",
  BOOK: "도서",
  VIDEO_SERIES: "영상 시리즈",
  MUSIC_ALBUM: "음악 앨범",
};

// ProductType별 아이콘
export const PRODUCT_TYPE_ICONS: Record<string, string> = {
  DIGITAL_PRODUCT: "📦",
  BOOK: "📚",
  VIDEO_SERIES: "🎬",
  MUSIC_ALBUM: "🎵",
};

// 커스텀 툴팁
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    payload?: { productType?: string; name?: string };
    dataKey?: string;
    color?: string;
  }>;
  label?: string;
}

const ProductTypeTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-[var(--text-primary)] mb-2">{label}</p>
      {payload.map((entry, index) => {
        const productType = entry.payload?.productType || entry.dataKey || "";
        const labelText = PRODUCT_TYPE_LABELS[productType] || entry.name;
        return (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  PRODUCT_TYPE_COLORS[productType as keyof typeof PRODUCT_TYPE_COLORS] ||
                  entry.color ||
                  "#8B5CF6",
              }}
            />
            <span className="text-[var(--text-tertiary)]">{labelText}:</span>
            <span className="font-medium text-[var(--text-primary)]">
              {typeof entry.value === "number" && entry.value >= 1000
                ? formatPrice(entry.value)
                : entry.value?.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ================================================
// ProductType별 매출 파이 차트
// ================================================
export interface ProductTypeRevenueData {
  productType: string;
  name: string;
  revenue: number;
  sales: number;
  percentage: number;
}

interface ProductTypeRevenuePieChartProps {
  data: ProductTypeRevenueData[];
  height?: number;
  showLabels?: boolean;
}

export function ProductTypeRevenuePieChart({
  data,
  height = 300,
  showLabels = true,
}: ProductTypeRevenuePieChartProps) {
  const total = data.reduce((sum, item) => sum + item.revenue, 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartData = data as any[];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="revenue"
          nameKey="name"
          label={
            showLabels
              ? ({ name, percent }) =>
                  `${PRODUCT_TYPE_ICONS[data.find((d) => d.name === name)?.productType || ""] || ""} ${((percent || 0) * 100).toFixed(0)}%`
              : false
          }
          labelLine={false}
        >
          {data.map((entry) => (
            <Cell
              key={entry.productType}
              fill={PRODUCT_TYPE_COLORS[entry.productType] || "#8B5CF6"}
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const item = payload[0].payload as ProductTypeRevenueData;
            return (
              <div className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg p-3 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span>{PRODUCT_TYPE_ICONS[item.productType] || "📦"}</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {item.name}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-[var(--text-tertiary)]">
                    매출: <span className="text-[var(--text-primary)] font-medium">{formatPrice(item.revenue)}</span>
                  </p>
                  <p className="text-[var(--text-tertiary)]">
                    판매: <span className="text-[var(--text-primary)] font-medium">{item.sales}건</span>
                  </p>
                  <p className="text-[var(--text-tertiary)]">
                    비율: <span className="text-[var(--text-primary)] font-medium">{total > 0 ? ((item.revenue / total) * 100).toFixed(1) : 0}%</span>
                  </p>
                </div>
              </div>
            );
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span className="text-sm text-[var(--text-secondary)]">
              {PRODUCT_TYPE_ICONS[data.find((d) => d.name === value)?.productType || ""] || ""} {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ================================================
// ProductType별 트렌드 라인 차트
// ================================================
export interface ProductTypeTrendData {
  date: string;
  DIGITAL_PRODUCT?: number;
  BOOK?: number;
  VIDEO_SERIES?: number;
  MUSIC_ALBUM?: number;
}

interface ProductTypeTrendChartProps {
  data: ProductTypeTrendData[];
  height?: number;
  metric?: "revenue" | "sales";
}

export function ProductTypeTrendChart({
  data,
  height = 300,
  metric = "revenue",
}: ProductTypeTrendChartProps) {
  const productTypes = ["DIGITAL_PRODUCT", "BOOK", "VIDEO_SERIES", "MUSIC_ALBUM"];
  
  // 데이터가 있는 타입만 필터링
  const activeTypes = productTypes.filter((type) =>
    data.some((d) => (d[type as keyof ProductTypeTrendData] as number) > 0)
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          {activeTypes.map((type) => (
            <linearGradient key={type} id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={PRODUCT_TYPE_COLORS[type as keyof typeof PRODUCT_TYPE_COLORS]}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={PRODUCT_TYPE_COLORS[type as keyof typeof PRODUCT_TYPE_COLORS]}
                stopOpacity={0}
              />
            </linearGradient>
          ))}
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
          tickFormatter={(value) =>
            metric === "revenue" ? `₩${(value / 1000).toFixed(0)}k` : value.toString()
          }
        />
        <Tooltip content={<ProductTypeTooltip />} />
        <Legend
          verticalAlign="top"
          height={36}
          formatter={(value) => (
            <span className="text-sm text-[var(--text-secondary)]">
              {PRODUCT_TYPE_ICONS[value as keyof typeof PRODUCT_TYPE_ICONS] || ""} {PRODUCT_TYPE_LABELS[value] || value}
            </span>
          )}
        />
        {activeTypes.map((type) => (
          <Area
            key={type}
            type="monotone"
            dataKey={type}
            name={type}
            stroke={PRODUCT_TYPE_COLORS[type as keyof typeof PRODUCT_TYPE_COLORS]}
            fillOpacity={1}
            fill={`url(#gradient-${type})`}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ================================================
// ProductType별 비교 막대 차트
// ================================================
export interface ProductTypeComparisonData {
  period: string;
  DIGITAL_PRODUCT: number;
  BOOK: number;
  VIDEO_SERIES: number;
  MUSIC_ALBUM: number;
}

interface ProductTypeBarChartProps {
  data: ProductTypeComparisonData[];
  height?: number;
  stacked?: boolean;
}

export function ProductTypeBarChart({
  data,
  height = 300,
  stacked = false,
}: ProductTypeBarChartProps) {
  const productTypes = ["DIGITAL_PRODUCT", "BOOK", "VIDEO_SERIES", "MUSIC_ALBUM"] as const;
  
  // 데이터가 있는 타입만 표시
  const activeTypes = productTypes.filter((type) =>
    data.some((d) => {
      const value = d[type];
      return typeof value === "number" && value > 0;
    })
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
        <XAxis
          dataKey="period"
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
        <Tooltip content={<ProductTypeTooltip />} />
        <Legend
          verticalAlign="top"
          height={36}
          formatter={(value) => (
            <span className="text-sm text-[var(--text-secondary)]">
              {PRODUCT_TYPE_ICONS[value as keyof typeof PRODUCT_TYPE_ICONS] || ""} {PRODUCT_TYPE_LABELS[value] || value}
            </span>
          )}
        />
        {activeTypes.map((type) => (
          <Bar
            key={type}
            dataKey={type}
            name={type}
            fill={PRODUCT_TYPE_COLORS[type as keyof typeof PRODUCT_TYPE_COLORS]}
            radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
            stackId={stacked ? "stack" : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ================================================
// ProductType별 성과 레이더 차트
// ================================================
export interface ProductTypePerformanceData {
  metric: string;
  DIGITAL_PRODUCT: number;
  BOOK: number;
  VIDEO_SERIES: number;
  MUSIC_ALBUM: number;
  fullMark: number;
}

interface ProductTypeRadarChartProps {
  data: ProductTypePerformanceData[];
  height?: number;
}

export function ProductTypeRadarChart({
  data,
  height = 300,
}: ProductTypeRadarChartProps) {
  const productTypes = ["DIGITAL_PRODUCT", "BOOK", "VIDEO_SERIES", "MUSIC_ALBUM"];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data}>
        <PolarGrid stroke="var(--bg-border)" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          tick={{ fill: "var(--text-tertiary)", fontSize: 10 }}
        />
        {productTypes.map((type) => (
          <Radar
            key={type}
            name={PRODUCT_TYPE_LABELS[type]}
            dataKey={type}
            stroke={PRODUCT_TYPE_COLORS[type as keyof typeof PRODUCT_TYPE_COLORS]}
            fill={PRODUCT_TYPE_COLORS[type as keyof typeof PRODUCT_TYPE_COLORS]}
            fillOpacity={0.2}
          />
        ))}
        <Legend
          formatter={(value) => (
            <span className="text-sm text-[var(--text-secondary)]">{value}</span>
          )}
        />
        <Tooltip content={<ProductTypeTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ================================================
// ProductType별 트리맵 차트
// ================================================
export interface ProductTypeTreemapData {
  name: string;
  productType: string;
  revenue: number;
  sales: number;
  children?: ProductTypeTreemapData[];
}

interface ProductTypeTreemapChartProps {
  data: ProductTypeTreemapData[];
  height?: number;
}

interface TreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  productType?: string;
  revenue?: number;
}

const TreemapContent = ({
  x = 0,
  y = 0,
  width = 0,
  height: h = 0,
  name = "",
  productType = "",
  revenue = 0,
}: TreemapContentProps) => {
  if (width < 50 || h < 30) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={h}
        rx={4}
        fill={
          PRODUCT_TYPE_COLORS[productType as keyof typeof PRODUCT_TYPE_COLORS] ||
          "#8B5CF6"
        }
        fillOpacity={0.85}
        stroke="var(--bg-elevated)"
        strokeWidth={2}
      />
      <text
        x={x + width / 2}
        y={y + h / 2 - 8}
        textAnchor="middle"
        fill="white"
        fontSize={12}
        fontWeight={600}
      >
        {PRODUCT_TYPE_ICONS[productType] || ""} {name.length > 10 ? name.slice(0, 10) + "..." : name}
      </text>
      <text
        x={x + width / 2}
        y={y + h / 2 + 10}
        textAnchor="middle"
        fill="rgba(255,255,255,0.8)"
        fontSize={10}
      >
        {formatPrice(revenue)}
      </text>
    </g>
  );
};

export function ProductTypeTreemapChart({
  data,
  height = 300,
}: ProductTypeTreemapChartProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartData = data as any[];
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Treemap
        data={chartData}
        dataKey="revenue"
        aspectRatio={4 / 3}
        content={<TreemapContent />}
      />
    </ResponsiveContainer>
  );
}

// ================================================
// ProductType 통계 카드
// ================================================
export interface ProductTypeStatCardProps {
  productType: string;
  revenue: number;
  sales: number;
  growth: number;
  viewCount?: number;
  conversionRate?: number;
}

export function ProductTypeStatCard({
  productType,
  revenue,
  sales,
  growth,
  viewCount,
  conversionRate,
}: ProductTypeStatCardProps) {
  const isPositive = growth >= 0;
  const color = PRODUCT_TYPE_COLORS[productType as keyof typeof PRODUCT_TYPE_COLORS] || "#8B5CF6";
  const icon = PRODUCT_TYPE_ICONS[productType as keyof typeof PRODUCT_TYPE_ICONS] || "📦";
  const label = PRODUCT_TYPE_LABELS[productType] || productType;

  return (
    <div
      className="p-4 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-border)] transition-all"
      style={{ borderLeftColor: color, borderLeftWidth: 4 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="font-medium text-[var(--text-primary)]">{label}</span>
        </div>
        <div
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isPositive
              ? "bg-[var(--accent-green)]/10 text-[var(--accent-green)]"
              : "bg-[var(--semantic-error)]/10 text-[var(--semantic-error)]"
          }`}
        >
          {isPositive ? "+" : ""}
          {growth.toFixed(1)}%
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-tertiary)]">매출</span>
          <span className="font-bold text-[var(--text-primary)]">{formatPrice(revenue)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-tertiary)]">판매</span>
          <span className="font-medium text-[var(--text-primary)]">{sales}건</span>
        </div>
        {viewCount !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-tertiary)]">조회수</span>
            <span className="font-medium text-[var(--text-primary)]">{viewCount.toLocaleString()}</span>
          </div>
        )}
        {conversionRate !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-tertiary)]">전환율</span>
            <span className="font-medium text-[var(--text-primary)]">{conversionRate.toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================
// 기간 비교 차트
// ================================================
export interface PeriodComparisonData {
  productType: string;
  name: string;
  current: number;
  previous: number;
  change: number;
}

interface PeriodComparisonChartProps {
  data: PeriodComparisonData[];
  height?: number;
}

export function PeriodComparisonChart({
  data,
  height = 300,
}: PeriodComparisonChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 10, left: 80, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
        <XAxis
          type="number"
          stroke="var(--text-tertiary)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}k`}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="var(--text-tertiary)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={70}
          tick={({ x, y, payload }) => {
            const item = data.find((d) => d.name === payload.value);
            const icon = item
              ? PRODUCT_TYPE_ICONS[item.productType as keyof typeof PRODUCT_TYPE_ICONS]
              : "";
            return (
              <g transform={`translate(${x},${y})`}>
                <text
                  x={0}
                  y={0}
                  dy={4}
                  textAnchor="end"
                  fill="var(--text-tertiary)"
                  fontSize={12}
                >
                  {icon} {payload.value}
                </text>
              </g>
            );
          }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const item = payload[0].payload as PeriodComparisonData;
            return (
              <div className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg p-3 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span>{PRODUCT_TYPE_ICONS[item.productType as keyof typeof PRODUCT_TYPE_ICONS] || "📦"}</span>
                  <span className="font-medium text-[var(--text-primary)]">{item.name}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-[var(--text-tertiary)]">현재: </span>
                    <span className="text-[var(--primary)]">{formatPrice(item.current)}</span>
                  </p>
                  <p>
                    <span className="text-[var(--text-tertiary)]">이전: </span>
                    <span className="text-[var(--text-secondary)]">{formatPrice(item.previous)}</span>
                  </p>
                  <p>
                    <span className="text-[var(--text-tertiary)]">변화: </span>
                    <span
                      className={
                        item.change >= 0
                          ? "text-[var(--accent-green)]"
                          : "text-[var(--semantic-error)]"
                      }
                    >
                      {item.change >= 0 ? "+" : ""}
                      {item.change.toFixed(1)}%
                    </span>
                  </p>
                </div>
              </div>
            );
          }}
        />
        <Bar
          dataKey="current"
          name="현재 기간"
          fill="#8B5CF6"
          radius={[0, 4, 4, 0]}
        />
        <Bar
          dataKey="previous"
          name="이전 기간"
          fill="#64748B"
          radius={[0, 4, 4, 0]}
          fillOpacity={0.5}
        />
        <Legend
          verticalAlign="top"
          height={36}
          formatter={(value) => (
            <span className="text-sm text-[var(--text-secondary)]">{value}</span>
          )}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
