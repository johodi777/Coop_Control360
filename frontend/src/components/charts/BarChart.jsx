import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';

const formatCurrencyChart = (value) => {
  if (!value) return '$ 0';
  const millions = value / 1000000;
  if (millions >= 1) {
    return `$ ${millions.toFixed(1).replace('.', ',')}M`;
  }
  return formatCurrency(value);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-panel border border-primary/50 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-1">{label}</p>
        <p className="text-primary">
          {formatCurrencyChart(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function BarChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-400">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1A1A22" />
        <XAxis 
          dataKey="name" 
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => {
            const millions = value / 1000000;
            if (millions >= 1) {
              return `$${millions.toFixed(1)}M`;
            }
            return `$${value / 1000}K`;
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="value" 
          fill="#3A0DFF" 
          radius={[8, 8, 0, 0]}
          name="Aportes"
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

