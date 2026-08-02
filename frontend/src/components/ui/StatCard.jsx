// Matches the stat-card pattern used across Dashboard/Analytics in the new
// design: icon chip top-right, big number + delta, small mono caption.
export default function StatCard({ icon: Icon, iconBg = "bg-primary/10", iconColor = "text-primary", label, value, delta, deltaPositive = true, caption }) {
  return (
    <div className="bg-surface-container p-padding-card rounded-xl border border-outline-variant hover:border-primary/50 transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <span className="text-on-surface-variant text-label-sm uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`p-2 ${iconBg} rounded-lg`}>
            <Icon size={19} className={iconColor} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-on-surface">{value}</span>
        {delta && (
          <span className={`text-xs font-bold ${deltaPositive ? "text-green-400" : "text-error"}`}>{delta}</span>
        )}
      </div>
      {caption && <p className="text-[11px] text-on-surface-variant mt-2 font-mono">{caption}</p>}
    </div>
  );
}
