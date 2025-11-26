import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Aportes', value: 400 },
  { name: 'Servicios', value: 300 },
  { name: 'Otros', value: 200 },
];

const COLORS = ['#3A0DFF', '#FF6A32', '#10B981'];

export default function PieChart({ data: customData = data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <Pie
          data={customData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {customData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1A1A22',
            border: '1px solid #3A0DFF',
            borderRadius: '8px',
            color: '#fff',
          }}
        />
        <Legend
          wrapperStyle={{ color: '#9CA3AF' }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

