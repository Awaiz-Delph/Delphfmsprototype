import { motion } from "framer-motion";
import { Robot } from "@shared/types";

interface RobotMarkerProps {
  robot: Robot;
  isHighlighted: boolean;
}

export default function RobotMarker({ robot, isHighlighted }: RobotMarkerProps) {
  // Calculate position based on robot coordinates
  // Normalize the coordinates to a percentage of the container
  const left = `${(robot.coordinates.x / 50) * 100}%`;
  const top = `${(robot.coordinates.y / 30) * 100}%`;
  
  const pulseColor = isHighlighted ? 'bg-primary' : 'bg-gray-400/50';
  
  return (
    <motion.div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ top, left }}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        {isHighlighted && (
          <motion.div 
            className="absolute -inset-4 rounded-full bg-primary opacity-10 animate-pulse-subtle"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.2 }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          />
        )}
        <div className={`w-6 h-6 rounded-full ${isHighlighted ? 'bg-primary' : 'bg-gray-400/80'} flex items-center justify-center text-xs text-white font-medium`}>
          {String(robot.id).padStart(2, '0')}
        </div>
      </div>
    </motion.div>
  );
}
