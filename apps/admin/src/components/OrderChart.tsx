import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
export default function OrderChart({
  data,
}: {
  data: { day: string; orders: number }[];
}) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="volume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#087443" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#087443" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="orders"
            name="Trips"
            stroke="#087443"
            strokeWidth={2}
            fill="url(#volume)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
