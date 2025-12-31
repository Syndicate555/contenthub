interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
}

export function StatsCard({ icon, label, value, trend }: StatsCardProps) {
  return (
    <div className="bg-card rounded-lg p-4 border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 bg-muted rounded-lg">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {trend && <div className="text-xs text-muted-foreground mt-1">{trend}</div>}
    </div>
  );
}
