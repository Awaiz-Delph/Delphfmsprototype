import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import DashboardPanel from "./dashboard-panel";
import ActivityFeed from "./activity-feed";
import AIAssistant from "./ai-assistant";
import FocusedResponseDisplay from "./focused-response-display";
import { useWarehouse } from "@/context/warehouse-context";

export default function WarehouseDashboard() {
  const { isAIFocusMode, setAIFocusMode, queryResponse } = useWarehouse();

  return (
    <motion.div 
      className="flex-1 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {isAIFocusMode ? (
        <motion.div 
          className="flex-1 flex flex-col p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Enhanced AI Response Panel */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-display text-white/90">AI Assistant Response</h1>
            <Button 
              onClick={() => setAIFocusMode(false)}
              className="bg-white/10 hover:bg-white/20 text-white flex items-center gap-2"
            >
              <span>Back to Dashboard</span>
            </Button>
          </div>
          
          {/* This component will be updated to handle multiple data items */}
          <FocusedResponseDisplay />
        </motion.div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row p-4 md:p-6 gap-6">
          <LeftSidebar />
          <DashboardPanel />
          <ActivityFeed />
        </div>
      )}
      
      <AIAssistant />
    </motion.div>
  );
}

function LeftSidebar() {
  const { overview, zones } = useWarehouse();
  
  return (
    <motion.div 
      className="w-full lg:w-64 glass rounded-3xl p-4 flex flex-col gap-4"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div className="flex flex-col">
        <h2 className="font-display text-lg font-medium text-white/80 mb-4">Warehouse Overview</h2>
        <div className="space-y-3">
          <StatsCard 
            title="Active AMRs"
            value={overview.activeRobots}
            total={overview.totalRobots}
            icon="ri-robot-line"
            color="primary"
          />
          
          <StatsCard 
            title="Tasks Completed"
            value={overview.tasksCompleted}
            suffix="today"
            icon="ri-checkbox-circle-line"
            color="secondary"
          />
          
          <StatsCard 
            title="Robot Efficiency"
            value={`${overview.robotEfficiency}%`}
            suffix="▲ 3%"
            suffixColor="text-green-500"
            icon="ri-line-chart-line"
            color="accent"
          />
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="font-display text-sm text-white/60 mb-3">Active Zones</h3>
        <div className="space-y-2">
          {zones.map((zone) => (
            <div key={zone.id} className="flex items-center gap-2 py-2">
              <div className={`w-2 h-2 rounded-full ${
                zone.name === 'Zone A' ? 'bg-primary' :
                zone.name === 'Zone B' ? 'bg-secondary' : 'bg-accent'
              }`}></div>
              <span className="text-white/80">{zone.name}</span>
              <span className="ml-auto text-xs text-white/50">{zone.robotCount} AMRs</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

interface StatsCardProps {
  title: string;
  value: number | string;
  total?: number;
  suffix?: string;
  suffixColor?: string;
  icon: string;
  color: 'primary' | 'secondary' | 'accent';
}

function StatsCard({ title, value, total, suffix, suffixColor = "text-secondary", icon, color }: StatsCardProps) {
  const colorClass = {
    primary: "bg-primary/20 text-primary",
    secondary: "bg-secondary/20 text-secondary",
    accent: "bg-accent/20 text-accent"
  }[color];
  
  return (
    <div className="p-3 glass-dark rounded-2xl transition-scale hover:shadow-lg hover:shadow-primary/10">
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
    </div>
  );
}
