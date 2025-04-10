import { Robot, Zone, Activity, WarehouseOverview } from "@shared/types";
import { storage } from "./storage";

class WarehouseDataManager {
  robots: Robot[] = [];
  zones: Zone[] = [];
  activities: Activity[] = [];
  overview: WarehouseOverview = {
    activeRobots: 0,
    totalRobots: 0,
    tasksCompleted: 0,
    robotEfficiency: 0,
  };
  
  constructor() {
    this.initializeData();
  }
  
  // Initialize with sample data
  private initializeData() {
    // Create robots
    this.robots = Array.from({ length: 24 }, (_, i) => {
      // Determine random positions within the warehouse floor
      const x = Math.random() * 50;
      const y = Math.random() * 30;
      
      // Determine which zone the robot is in based on position
      let zoneId = "Zone A";
      if (x > 30) {
        zoneId = "Zone B";
      } else if (y > 20) {
        zoneId = "Zone C";
      }
      
      // Random status with mostly active
      const statuses: ("active" | "charging" | "idle" | "maintenance")[] = ["active", "active", "active", "charging", "idle", "maintenance"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Random battery level
      const batteryLevel = Math.floor(Math.random() * 50) + 50; // 50-100%
      
      // Random tasks
      const tasks = ["Pallet Transport", "Inventory Scanning", "Pick and Place", "Delivering Packages", "Box Sorting"];
      const currentTask = tasks[Math.floor(Math.random() * tasks.length)];
      
      // Random tools
      const tools = ["Forklift Attachment", "Scanner Module", "Gripper Arm", "Tote Carrier", "Platform Lift"];
      const currentTool = tools[Math.floor(Math.random() * tools.length)];
      
      // Random efficiency
      const efficiency = Math.floor(Math.random() * 20) + 80; // 80-100%
      
      return {
        id: i + 1,
        name: `AMR ${String(i + 1).padStart(2, '0')}`,
        status,
        zoneId,
        batteryLevel,
        currentTask,
        currentTool,
        efficiency,
        coordinates: { x, y },
      };
    });
    
    // Count active robots for each zone
    const zoneACounts = this.robots.filter(r => r.zoneId === "Zone A" && r.status === "active").length;
    const zoneBCounts = this.robots.filter(r => r.zoneId === "Zone B" && r.status === "active").length;
    const zoneCCounts = this.robots.filter(r => r.zoneId === "Zone C" && r.status === "active").length;
    
    // Create zones
    this.zones = [
      {
        id: "Zone A",
        name: "Zone A",
        priority: "high",
        robotCount: zoneACounts,
        tasksPending: Math.floor(Math.random() * 10) + 5,
        tasksCompleted: Math.floor(Math.random() * 50) + 50,
        efficiency: Math.floor(Math.random() * 10) + 85,
        trafficDensity: "medium",
      },
      {
        id: "Zone B",
        name: "Zone B",
        priority: "medium",
        robotCount: zoneBCounts,
        tasksPending: Math.floor(Math.random() * 10) + 2,
        tasksCompleted: Math.floor(Math.random() * 40) + 40,
        efficiency: Math.floor(Math.random() * 10) + 80,
        trafficDensity: "high",
      },
      {
        id: "Zone C",
        name: "Zone C",
        priority: "low",
        robotCount: zoneCCounts,
        tasksPending: Math.floor(Math.random() * 5) + 1,
        tasksCompleted: Math.floor(Math.random() * 30) + 30,
        efficiency: Math.floor(Math.random() * 10) + 75,
        trafficDensity: "low",
      },
    ];
    
    // Create activities
    const activityTypes = [
      {
        type: 'robot',
        messages: [
          "AMR {id} completed pallet transport",
          "AMR {id} switched to inventory scanner",
          "AMR {id} docked for charging",
          "AMR {id} started maintenance routine",
          "AMR {id} resumed operations"
        ],
        icons: ["robot-line", "tools-line", "battery-charge-line", "settings-line", "play-line"]
      },
      {
        type: 'system',
        messages: [
          "System optimization completed",
          "New firmware update available",
          "Network connectivity restored",
          "Scheduled maintenance completed",
          "Performance metrics updated"
        ],
        icons: ["refresh-line", "download-2-line", "wifi-line", "check-double-line", "line-chart-line"]
      },
      {
        type: 'zone',
        messages: [
          "Zone A priority increased",
          "Zone B traffic density high",
          "Zone C automated inventory completed",
          "New pickup station added to Zone B",
          "Zone A route optimization applied"
        ],
        icons: ["arrow-up-line", "roadmap-line", "checkbox-circle-line", "add-circle-line", "route-line"]
      },
      {
        type: 'user',
        messages: [
          "New task created by Alex",
          "Sarah updated warehouse layout",
          "John approved robot reassignment",
          "Maria scheduled system maintenance",
          "Tom added new delivery priority"
        ],
        icons: ["user-line", "edit-2-line", "user-star-line", "calendar-line", "add-line"]
      }
    ];
    
    // Generate 20 random activities
    this.activities = Array.from({ length: 20 }, (_, i) => {
      const typeIndex = Math.floor(Math.random() * activityTypes.length);
      const activityType = activityTypes[typeIndex];
      
      const messageIndex = Math.floor(Math.random() * activityType.messages.length);
      let message = activityType.messages[messageIndex];
      
      // Replace placeholder with random robot ID if needed
      if (message.includes("{id}")) {
        const randomRobotId = String(Math.floor(Math.random() * 24) + 1).padStart(2, '0');
        message = message.replace("{id}", randomRobotId);
      }
      
      // Create timestamp between now and 3 hours ago
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - Math.floor(Math.random() * 180));
      
      return {
        id: i + 1,
        type: activityType.type as 'robot' | 'system' | 'user' | 'zone',
        iconName: activityType.icons[messageIndex],
        message,
        timestamp,
      };
    });
    
    // Sort activities by timestamp (newest first)
    this.activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Set warehouse overview
    const activeRobots = this.robots.filter(r => r.status === "active").length;
    
    this.overview = {
      activeRobots,
      totalRobots: this.robots.length,
      tasksCompleted: this.zones.reduce((sum, zone) => sum + zone.tasksCompleted, 0),
      robotEfficiency: Math.floor(this.robots.reduce((sum, robot) => sum + robot.efficiency, 0) / this.robots.length),
    };
    
    // Store in memory storage
    storage.setRobots(this.robots);
    storage.setZones(this.zones);
    storage.setActivities(this.activities);
    storage.setOverview(this.overview);
  }
  
  // Update robot positions to simulate movement
  updateRobotPositions() {
    this.robots = this.robots.map(robot => {
      // Only move active robots
      if (robot.status === "active") {
        // Random movement within a small radius
        const moveX = (Math.random() - 0.5) * 2;
        const moveY = (Math.random() - 0.5) * 2;
        
        // Ensure robots stay within boundaries
        const newX = Math.max(0, Math.min(50, robot.coordinates.x + moveX));
        const newY = Math.max(0, Math.min(30, robot.coordinates.y + moveY));
        
        // Update zone if robot crosses boundary
        let newZoneId = robot.zoneId;
        if (newX > 30) {
          newZoneId = "Zone B";
        } else if (newY > 20) {
          newZoneId = "Zone C";
        } else {
          newZoneId = "Zone A";
        }
        
        // If zone changed, update robot count for zones
        if (newZoneId !== robot.zoneId) {
          // Decrease old zone count
          const oldZone = this.zones.find(z => z.id === robot.zoneId);
          if (oldZone) {
            oldZone.robotCount--;
          }
          
          // Increase new zone count
          const newZone = this.zones.find(z => z.id === newZoneId);
          if (newZone) {
            newZone.robotCount++;
          }
        }
        
        return {
          ...robot,
          zoneId: newZoneId,
          coordinates: { x: newX, y: newY },
        };
      }
      
      return robot;
    });
    
    // Update storage
    storage.setRobots(this.robots);
    storage.setZones(this.zones);
  }
  
  // Generate a random activity
  generateRandomActivity(): Activity {
    const activityTypes = [
      {
        type: 'robot',
        messages: [
          "AMR {id} completed pallet transport",
          "AMR {id} switched to inventory scanner",
          "AMR {id} docked for charging",
          "AMR {id} resumed operations"
        ],
        icons: ["robot-line", "tools-line", "battery-charge-line", "play-line"]
      },
      {
        type: 'system',
        messages: [
          "System optimization in progress",
          "Network performance optimized",
          "Performance metrics updated"
        ],
        icons: ["refresh-line", "wifi-line", "line-chart-line"]
      },
      {
        type: 'zone',
        messages: [
          "Zone A traffic optimized",
          "Zone B new task assigned",
          "Zone C automated inventory started"
        ],
        icons: ["route-line", "add-circle-line", "checkbox-circle-line"]
      }
    ];
    
    const typeIndex = Math.floor(Math.random() * activityTypes.length);
    const activityType = activityTypes[typeIndex];
    
    const messageIndex = Math.floor(Math.random() * activityType.messages.length);
    let message = activityType.messages[messageIndex];
    
    // Replace placeholder with random robot ID if needed
    if (message.includes("{id}")) {
      const randomRobotId = String(Math.floor(Math.random() * 24) + 1).padStart(2, '0');
      message = message.replace("{id}", randomRobotId);
    }
    
    return {
      id: Date.now(), // Use timestamp as ID for uniqueness
      type: activityType.type as 'robot' | 'system' | 'user' | 'zone',
      iconName: activityType.icons[messageIndex],
      message,
      timestamp: new Date(),
    };
  }
  
  // Get a specific robot by ID
  getRobotById(id: number): Robot | undefined {
    return this.robots.find(robot => robot.id === id);
  }
  
  // Get a specific zone by ID
  getZoneById(id: string): Zone | undefined {
    return this.zones.find(zone => zone.id === id);
  }
}

export const warehouseData = new WarehouseDataManager();
