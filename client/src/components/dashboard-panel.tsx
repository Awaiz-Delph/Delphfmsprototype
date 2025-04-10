import { motion } from "framer-motion";
import ResponseDisplay from "./response-display";
import WarehouseMap from "./warehouse-map";
import OptimizationPanel from "./optimization-panel";

export default function DashboardPanel() {
  return (
    <motion.div 
      className="flex-1 flex flex-col gap-6"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResponseDisplay />
        <OptimizationPanel />
      </div>
      <WarehouseMap />
    </motion.div>
  );
}
