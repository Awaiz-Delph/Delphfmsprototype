import { motion } from "framer-motion";
import { Map } from "lucide-react";
import { useWarehouse } from "@/context/warehouse-context";
import RobotMarker from "./robot-marker";

export default function WarehouseMap() {
  const { robots, queryResponse } = useWarehouse();
  
  // Determine if the map should show details based on query response
  const showDetails = !!queryResponse;
  
  return (
    <motion.div 
      className="glass rounded-3xl p-6 relative flex-1 overflow-hidden min-h-[300px]"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
    >
      <div className="relative h-full">
        <div className="glass-dark rounded-2xl h-full w-full overflow-hidden border border-white/5 relative">
          {!showDetails ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/30 text-5xl">
                <Map className="h-16 w-16" />
              </div>
            </div>
          ) : (
            <motion.div 
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Grid lines for the warehouse */}
              <div className="absolute inset-0">
                <div className="w-full h-full">
                  {/* Vertical grid lines */}
                  {Array.from({ length: 11 }).map((_, i) => (
                    <div key={`vline-${i}`} className={`absolute top-0 bottom-0 left-${i+1}/12 w-px bg-white/5`}></div>
                  ))}
                  
                  {/* Horizontal grid lines */}
                  {Array.from({ length: 11 }).map((_, i) => (
                    <div key={`hline-${i}`} className={`absolute left-0 right-0 top-${i+1}/12 h-px bg-white/5`}></div>
                  ))}
                </div>
              </div>
              
              {/* Zone labels */}
              <div className="absolute top-4 left-4 glass px-2 py-1 rounded text-xs font-medium text-white/70">Zone A</div>
              <div className="absolute top-4 right-4 glass px-2 py-1 rounded text-xs font-medium text-white/70">Zone B</div>
              <div className="absolute bottom-4 left-4 glass px-2 py-1 rounded text-xs font-medium text-white/70">Zone C</div>
              
              {/* Robot markers */}
              {robots.map((robot) => (
                <RobotMarker 
                  key={robot.id} 
                  robot={robot} 
                  isHighlighted={queryResponse?.type === 'robot' && queryResponse.data?.id === robot.id}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
