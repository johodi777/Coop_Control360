export default function StatsBox({ title, value, icon, trend, className = "" }) {
  return (
    <div className={`bg-panel rounded-xl p-6 border border-panel/50 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-sm">{title}</p>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
      {trend && (
        <p className={`text-sm ${trend > 0 ? "text-green-400" : "text-red-400"}`}>
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </p>
      )}
    </div>
  );
}

