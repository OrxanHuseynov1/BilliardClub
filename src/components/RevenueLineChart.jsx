import React from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

const formatChartDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow border text-sm text-gray-700">
        <p className="font-semibold">Tarix: {formatChartDate(label)}</p>
        <p>Gəlir: {payload[0].value.toFixed(2)} ₼</p>
      </div>
    );
  }
  return null;
};

const RevenueLineChart = ({ data }) => {
  const formattedData = data.map(item => ({
    label: item.date, 
    amount: item.revenue 
  }));

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-lg border border-gray-200 mt-6">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} /> 
              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="label" 
            tickFormatter={formatChartDate} 
          />
          <YAxis tickFormatter={(tick) => `${tick} ₼`} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#10B981"
            fill="url(#colorRevenue)"
            strokeWidth={2}
            activeDot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueLineChart;
