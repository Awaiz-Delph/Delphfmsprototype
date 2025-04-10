import { motion } from "framer-motion";
import { useWarehouse } from "@/context/warehouse-context";

export default function ActivityFeed() {
  const { activities } = useWarehouse();

  return (
    <motion.div 
      className="w-full lg:w-72 glass rounded-3xl p-4 flex flex-col gap-4"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.4 }}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-display text-lg font-medium text-white/80">Recent Activities</h2>
        <button className="text-white/50 hover:text-white">
          <i className="ri-more-2-fill"></i>
        </button>
      </div>
      
      <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
        {activities.map((activity) => {
          // Determine the background and text color based on activity type
          let bgColorClass = 'bg-primary/20';
          let textColorClass = 'text-primary';
          
          if (activity.type === 'system') {
            bgColorClass = 'bg-secondary/20';
            textColorClass = 'text-secondary';
          } else if (activity.type === 'user' || activity.type === 'zone') {
            bgColorClass = 'bg-accent/20';
            textColorClass = 'text-accent';
          }
          
          // Format the timestamp
          const timeAgo = formatTimeAgo(activity.timestamp);
          
          return (
            <motion.div 
              key={activity.id}
              className="glass-dark p-3 rounded-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${bgColorClass} flex items-center justify-center ${textColorClass}`}>
                  <i className={`ri-${activity.iconName}`}></i>
                </div>
                <div>
                  <p className="text-sm text-white/90">{activity.message}</p>
                  <p className="text-xs text-white/50">{timeAgo}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  
  return Math.floor(seconds) + " seconds ago";
}
