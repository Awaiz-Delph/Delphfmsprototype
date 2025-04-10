import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string | number;
  total?: number;
  suffix?: string;
  suffixColor?: string;
  icon: string;
  color: string;
  delay?: number;
}

export default function StatsCard({
  title,
  value,
  total,
  suffix,
  suffixColor = "text-secondary",
  icon,
  color,
  delay = 0
}: StatsCardProps) {
  // Map color names to classes
  const colorMap: Record<string, string> = {
    primary: "bg-primary/20 text-primary",
    secondary: "bg-secondary/20 text-secondary",
    accent: "bg-accent/20 text-accent",
    success: "bg-green-500/20 text-green-500",
    warning: "bg-amber-500/20 text-amber-500",
    error: "bg-red-500/20 text-red-500",
  };

  const colorClass = colorMap[color] || colorMap.primary;

  return (
    <motion.div
      className="p-3 glass-dark rounded-2xl transition-scale hover:shadow-lg hover:shadow-primary/10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.3 }}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-white/50">{title}</p>
          <p className="text-xl font-display font-medium text-white">
            {value}
            {total && <span className="text-secondary text-sm"> / {total}</span>}
            {suffix && <span className={`text-xs ${suffixColor}`}> {suffix}</span>}
          </p>
        </div>
        <div className={`${colorClass} p-2 rounded-lg`}>
          <i className={icon}></i>
        </div>
      </div>
    </motion.div>
  );
}
