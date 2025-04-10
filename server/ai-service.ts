import { QueryResponse, Robot, Zone, Activity, WarehouseOverview } from "@shared/types";
import { openAIService } from "./openai-service";
import { perplexityService } from "./perplexity-service";

// Type for the warehouse data to make code more maintainable
interface WarehouseDataType {
  robots: Robot[];
  zones: Zone[];
  activities: Activity[];
  overview: WarehouseOverview;
  getRobotById: (id: number) => Robot | undefined;
  getZoneById: (id: string) => Zone | undefined;
}

/**
 * Enhanced local NLP engine that doesn't require OpenAI
 * This provides intelligent responses based on warehouse data
 */
class LocalAIEngine {
  // Common patterns for matching different types of queries
  private robotIdPattern = /\b(amr|robot)\s*(\d+)\b/i;
  private zoneIdPattern = /\bzone\s*([a-c])\b/i;
  private maintenancePattern = /\b(maintenance|broken|repair|fix|issue|problem|malfunction)\b/i;
  private batteryPattern = /\b(battery|charging|energy|power|charge|charged)\b/i;
  private statusPattern = /\b(status|state|condition|health|operational|functioning)\b/i;
  private locationPattern = /\b(where|location|position|find|locate|situated|placed|area|coordinate|coordinates)\b/i;
  private efficiencyPattern = /\b(efficiency|performance|productivity|effective|output|throughput|production|optimization)\b/i;
  private overviewPattern = /\b(overview|summary|dashboard|stats|statistics|brief|snapshot|overall|general)\b/i;
  private toolPattern = /\b(tool|equipment|attachment|device|implement|accessory|apparatus|instrument)\b/i;
  private highestPattern = /\b(highest|best|most|top|maximum|peak|leading|superior|optimal|greatest)\b/i;
  private lowestPattern = /\b(lowest|worst|least|bottom|minimum|poorest|weakest|inferior|suboptimal)\b/i;
  private idlePattern = /\b(idle|inactive|available|free|unused|standby|waiting|ready|dormant)\b/i;
  private activePattern = /\b(active|busy|working|engaged|occupied|operating|running|functioning|in use)\b/i;
  private comparePattern = /\b(compare|comparison|versus|vs|contrast|difference|differential|evaluate|against|between)\b/i;
  private allRobotsPattern = /\b(all|every|list|show|display|each|present|total|full|entire)\s+(robots|amrs|machines|units|devices)\b/i;
  private allZonesPattern = /\b(all|every|list|show|display|each|present|total|full|entire)\s+(zones|areas|sections|sectors|regions|locations)\b/i;
  private sortPattern = /\b(sort|order|rank|arrange|categorize|classify|organize|group|sequence|prioritize)\b/i;
  private countPattern = /\b(count|how many|total number|quantity|sum|tally|enumerate|calculate|measure)\b/i;
  private priorityPattern = /\b(priority|important|critical|urgent|crucial|essential|vital|significance|key|main)\b/i;
  private trafficPattern = /\b(traffic|congestion|flow|movement|density|crowded|busy|passage|circulation|transit)\b/i;
  private deploymentPattern = /\b(deploy|assign|send|allocate|dispatch|direct|relocate|move|transfer)\b/i;
  private redistributePattern = /\b(redistribute|reallocate|reassign|balance|equilibrium|even out|rebalance)\b/i;
  private optimizePattern = /\b(optimize|improve|enhance|boost|maximize|augment|upgrade|streamline|refine)\b/i;
  private forecastPattern = /\b(forecast|predict|projection|future|anticipate|estimate|foresee|outlook|prospect)\b/i;
  private trendPattern = /\b(trend|pattern|tendency|direction|progression|development|evolution|course)\b/i;
  private utilizationPattern = /\b(utilization|usage|consumption|employ|use|application|exploitation)\b/i;
  private capacityPattern = /\b(capacity|capability|potential|volume|throughput|output|productivity|yield)\b/i;
  private schedulePattern = /\b(schedule|plan|timetable|agenda|calendar|program|arrangement|itinerary)\b/i;
  
  /**
   * Process a natural language query about warehouse operations
   */
  processQuery(query: string, data: WarehouseDataType): { message: string; response: QueryResponse } {
    // Normalize the query for pattern matching
    const normalizedQuery = query.toLowerCase().trim();
    
    // Check if it's a complex/compound query that needs special handling
    if (this.isComplexQuery(normalizedQuery)) {
      return this.handleComplexQuery(normalizedQuery, data);
    }
    
    // First, look for explicit robot references
    const robotMatch = normalizedQuery.match(this.robotIdPattern);
    if (robotMatch) {
      return this.handleRobotQuery(robotMatch, normalizedQuery, data);
    }
    
    // Look for zone references
    const zoneMatch = normalizedQuery.match(this.zoneIdPattern);
    if (zoneMatch) {
      return this.handleZoneQuery(zoneMatch, normalizedQuery, data);
    }
    
    // Handle deployment and reassignment requests
    if (this.deploymentPattern.test(normalizedQuery) || this.redistributePattern.test(normalizedQuery)) {
      return this.handleDeploymentQuery(normalizedQuery, data);
    }
    
    // Handle optimization-related requests
    if (this.optimizePattern.test(normalizedQuery)) {
      return this.handleOptimizationQuery(normalizedQuery, data);
    }
    
    // Handle forecasting and trend analysis
    if (this.forecastPattern.test(normalizedQuery) || this.trendPattern.test(normalizedQuery)) {
      return this.handleForecastQuery(normalizedQuery, data);
    }
    
    // Handle utilization and capacity planning
    if (this.utilizationPattern.test(normalizedQuery) || this.capacityPattern.test(normalizedQuery)) {
      return this.handleUtilizationQuery(normalizedQuery, data);
    }
    
    // Handle all robots query
    if (this.allRobotsPattern.test(normalizedQuery)) {
      return this.handleAllRobotsQuery(normalizedQuery, data);
    }
    
    // Handle all zones query
    if (this.allZonesPattern.test(normalizedQuery)) {
      return this.handleAllZonesQuery(normalizedQuery, data);
    }
    
    // Handle comparison queries
    if (this.comparePattern.test(normalizedQuery)) {
      return this.handleComparisonQuery(normalizedQuery, data);
    }
    
    // Handle count-related queries
    if (this.countPattern.test(normalizedQuery)) {
      return this.handleCountQuery(normalizedQuery, data);
    }
    
    // Handle priority-related queries
    if (this.priorityPattern.test(normalizedQuery)) {
      return this.handlePriorityQuery(normalizedQuery, data);
    }
    
    // Handle traffic-related queries
    if (this.trafficPattern.test(normalizedQuery)) {
      return this.handleTrafficQuery(normalizedQuery, data);
    }
    
    // Check for warehouse overview queries
    if (this.overviewPattern.test(normalizedQuery)) {
      return this.handleOverviewQuery(normalizedQuery, data);
    }
    
    // Check for efficiency-related queries
    if (this.efficiencyPattern.test(normalizedQuery)) {
      return this.handleEfficiencyQuery(normalizedQuery, data);
    }
    
    // Check for status-related queries
    if (this.statusPattern.test(normalizedQuery)) {
      return this.handleStatusQuery(normalizedQuery, data);
    }
    
    // Check for maintenance-related queries
    if (this.maintenancePattern.test(normalizedQuery)) {
      return this.handleMaintenanceQuery(normalizedQuery, data);
    }
    
    // Check for battery-related queries
    if (this.batteryPattern.test(normalizedQuery)) {
      return this.handleBatteryQuery(normalizedQuery, data);
    }
    
    // Check for location queries
    if (this.locationPattern.test(normalizedQuery)) {
      // If asking about a location without specifying which robot
      if (normalizedQuery.includes("robots") || normalizedQuery.includes("amrs")) {
        return this.handleMultiRobotLocationQuery(normalizedQuery, data);
      }
    }
    
    // Check for scheduling-related queries
    if (this.schedulePattern.test(normalizedQuery)) {
      return this.handleSchedulingQuery(normalizedQuery, data);
    }
    
    // If we can't match any specific patterns, provide a friendly default response
    return {
      message: `I'm not sure how to answer that question. You can ask me about specific AMRs (e.g., "Where is AMR 03?"), zones (e.g., "Show Zone B status"), or general warehouse information like efficiency or maintenance needs. You can also ask to compare robots or zones, see all robots or zones, get counts, or check priority or traffic information. For more complex operations, try asking about optimizing workflows, deploying robots, or forecasting capacity needs.`,
      response: {
        title: 'AI Response',
        data: null,
        type: 'error'
      }
    };
  }
  
  /**
   * Handle robot-specific queries
   */
  private handleRobotQuery(
    match: RegExpMatchArray, 
    query: string, 
    data: WarehouseDataType
  ): { message: string; response: QueryResponse } {
    const robotId = parseInt(match[2]);
    const robot = data.getRobotById(robotId);
    
    if (!robot) {
      return {
        message: `I couldn't find AMR ${robotId} in the system. Please check the ID and try again.`,
        response: {
          title: 'Robot Not Found',
          data: null,
          type: 'error'
        }
      };
    }
    
    // Determine what aspect of the robot the user is asking about
    if (this.locationPattern.test(query)) {
      return {
        message: `AMR ${String(robotId).padStart(2, '0')} is currently located in ${robot.zoneId} at coordinates (${robot.coordinates.x}, ${robot.coordinates.y}).`,
        response: {
          title: `AMR ${String(robotId).padStart(2, '0')} Location`,
          data: robot,
          type: 'robot'
        }
      };
    }
    
    if (this.statusPattern.test(query)) {
      return {
        message: `AMR ${String(robotId).padStart(2, '0')} is currently ${robot.status}. It has a battery level of ${robot.batteryLevel}% and is ${robot.currentTask ? `working on ${robot.currentTask}` : 'not assigned any tasks'}.`,
        response: {
          title: `AMR ${String(robotId).padStart(2, '0')} Status`,
          data: robot,
          type: 'robot'
        }
      };
    }
    
    if (this.batteryPattern.test(query)) {
      const batteryStatus = this.getBatteryStatusDescription(robot.batteryLevel);
      return {
        message: `AMR ${String(robotId).padStart(2, '0')} currently has a battery level of ${robot.batteryLevel}%. ${batteryStatus}`,
        response: {
          title: `AMR ${String(robotId).padStart(2, '0')} Battery`,
          data: robot,
          type: 'robot'
        }
      };
    }
    
    if (this.toolPattern.test(query)) {
      return {
        message: `AMR ${String(robotId).padStart(2, '0')} is currently equipped with the ${robot.currentTool} tool and is ${robot.status === 'active' ? 'actively using it for' : 'assigned to use it for'} ${robot.currentTask}.`,
        response: {
          title: `AMR ${String(robotId).padStart(2, '0')} Equipment`,
          data: robot,
          type: 'robot'
        }
      };
    }
    
    // Default robot response if we don't match any specific aspect
    return {
      message: `AMR ${String(robotId).padStart(2, '0')} is a ${robot.status} robot in ${robot.zoneId}. It has a battery level of ${robot.batteryLevel}% and is currently ${robot.currentTask ? `working on ${robot.currentTask}` : 'not assigned any tasks'}.`,
      response: {
        title: `AMR ${String(robotId).padStart(2, '0')} Information`,
        data: robot,
        type: 'robot'
      }
    };
  }
  
  /**
   * Handle zone-specific queries
   */
  private handleZoneQuery(
    match: RegExpMatchArray, 
    query: string, 
    data: WarehouseDataType
  ): { message: string; response: QueryResponse } {
    const zoneId = `Zone ${match[1].toUpperCase()}`;
    const zone = data.getZoneById(zoneId);
    
    if (!zone) {
      return {
        message: `I couldn't find ${zoneId} in the system. Available zones are Zone A, Zone B, and Zone C.`,
        response: {
          title: 'Zone Not Found',
          data: null,
          type: 'error'
        }
      };
    }
    
    // Robots in the zone
    if (this.robotIdPattern.test(query) || query.includes("robots") || query.includes("amrs")) {
      const zoneRobots = data.robots.filter(r => r.zoneId === zoneId);
      const robotInfo = zoneRobots.length > 0
        ? `There are ${zoneRobots.length} AMRs in this zone: ${zoneRobots.map(r => `AMR ${r.id}`).join(', ')}.`
        : `There are currently no AMRs operating in this zone.`;
      
      return {
        message: `${zoneId} currently has ${zone.robotCount} active AMRs. ${robotInfo} The zone has ${zone.tasksPending} pending tasks and ${zone.tasksCompleted} completed tasks.`,
        response: {
          title: `${zoneId} Robots`,
          data: zone,
          type: 'zone'
        }
      };
    }
    
    // Zone efficiency
    if (this.efficiencyPattern.test(query)) {
      return {
        message: `${zoneId} is currently operating at ${zone.efficiency}% efficiency. This zone has a ${zone.trafficDensity} traffic density and ${zone.tasksPending} pending tasks.`,
        response: {
          title: `${zoneId} Efficiency`,
          data: zone,
          type: 'zone'
        }
      };
    }
    
    // Default zone response
    return {
      message: `${zoneId} is a ${zone.priority} priority zone with ${zone.robotCount} active AMRs. The zone has ${zone.tasksPending} pending tasks, ${zone.tasksCompleted} completed tasks, and is operating at ${zone.efficiency}% efficiency with ${zone.trafficDensity} traffic density.`,
      response: {
        title: `${zoneId} Status`,
        data: zone,
        type: 'zone'
      }
    };
  }
  
  /**
   * Handle warehouse overview queries
   */
  private handleOverviewQuery(
    query: string, 
    data: WarehouseDataType
  ): { message: string; response: QueryResponse } {
    const { overview, robots, zones } = data;
    
    // Get some insightful metrics for the metadata
    const activeCount = robots.filter(r => r.status === 'active').length;
    const idleCount = robots.filter(r => r.status === 'idle').length;
    const chargingCount = robots.filter(r => r.status === 'charging').length;
    const maintenanceCount = robots.filter(r => r.status === 'maintenance').length;
    
    const totalPendingTasks = zones.reduce((sum, zone) => sum + zone.tasksPending, 0);
    const highTrafficZones = zones.filter(z => z.trafficDensity === 'high').length;
    
    // Generate insights based on the data
    const insights = [
      `${overview.activeRobots} out of ${overview.totalRobots} AMRs are currently active`,
      `Overall warehouse efficiency is at ${overview.robotEfficiency}%`,
      `${totalPendingTasks} tasks are currently pending across all zones`,
      `${highTrafficZones} zones have high traffic density`,
      `${maintenanceCount} AMRs are currently in maintenance`
    ];
    
    return {
      message: `The warehouse currently has ${overview.activeRobots} active AMRs out of a total of ${overview.totalRobots}. The overall robot efficiency is ${overview.robotEfficiency}% with ${overview.tasksCompleted} tasks completed today.`,
      response: {
        title: 'Warehouse Overview',
        data: overview,
        type: 'overview',
        metadata: {
          secondaryData: insights,
          chartData: {
            'Active': activeCount,
            'Idle': idleCount,
            'Charging': chargingCount,
            'Maintenance': maintenanceCount
          }
        }
      }
    };
  }
  
  /**
   * Handle efficiency-related queries
   */
  private handleEfficiencyQuery(
    query: string, 
    data: WarehouseDataType
  ): { message: string; response: QueryResponse } {
    const { robots, zones, overview } = data;
    
    // Check if asking about most/least efficient robots
    if (this.highestPattern.test(query) && (query.includes("robot") || query.includes("amr"))) {
      const sortedRobots = [...robots].sort((a, b) => b.efficiency - a.efficiency);
      const topRobot = sortedRobots[0];
      
      return {
        message: `The most efficient robot is AMR ${topRobot.id} with an efficiency rating of ${topRobot.efficiency}%. It's currently ${topRobot.status} in ${topRobot.zoneId}.`,
        response: {
          title: 'Most Efficient Robot',
          data: topRobot,
          type: 'robot'
        }
      };
    }
    
    if (this.lowestPattern.test(query) && (query.includes("robot") || query.includes("amr"))) {
      const sortedRobots = [...robots].sort((a, b) => a.efficiency - b.efficiency);
      const bottomRobot = sortedRobots[0];
      
      return {
        message: `The least efficient robot is AMR ${bottomRobot.id} with an efficiency rating of ${bottomRobot.efficiency}%. It's currently ${bottomRobot.status} in ${bottomRobot.zoneId}.`,
        response: {
          title: 'Least Efficient Robot',
          data: bottomRobot,
          type: 'robot'
        }
      };
    }
    
    // Check if asking about most/least efficient zones
    if (this.highestPattern.test(query) && query.includes("zone")) {
      const sortedZones = [...zones].sort((a, b) => b.efficiency - a.efficiency);
      const topZone = sortedZones[0];
      
      return {
        message: `The most efficient zone is ${topZone.name} with an efficiency rating of ${topZone.efficiency}%. It has ${topZone.robotCount} active AMRs and ${topZone.tasksPending} pending tasks.`,
        response: {
          title: 'Most Efficient Zone',
          data: topZone,
          type: 'zone'
        }
      };
    }
    
    if (this.lowestPattern.test(query) && query.includes("zone")) {
      const sortedZones = [...zones].sort((a, b) => a.efficiency - b.efficiency);
      const bottomZone = sortedZones[0];
      
      return {
        message: `The least efficient zone is ${bottomZone.name} with an efficiency rating of ${bottomZone.efficiency}%. It has ${bottomZone.robotCount} active AMRs and ${bottomZone.tasksPending} pending tasks.`,
        response: {
          title: 'Least Efficient Zone',
          data: bottomZone,
          type: 'zone'
        }
      };
    }
    
    // General efficiency query
    // Sort robots and zones by efficiency
    const sortedRobots = [...robots].sort((a, b) => b.efficiency - a.efficiency);
    const sortedZones = [...zones].sort((a, b) => b.efficiency - a.efficiency);
    
    // Create an efficiency comparison chart
    const topRobots = sortedRobots.slice(0, 5).reduce<Record<string, number>>((result, robot) => {
      result[`AMR ${robot.id}`] = robot.efficiency;
      return result;
    }, {});
    
    const topZones = sortedZones.reduce<Record<string, number>>((result, zone) => {
      result[zone.name] = zone.efficiency;
      return result;
    }, {});
    
    return {
      message: `The overall warehouse efficiency is ${overview.robotEfficiency}%. The most efficient zone is ${sortedZones[0].name} at ${sortedZones[0].efficiency}% and the most efficient AMR is AMR ${sortedRobots[0].id} at ${sortedRobots[0].efficiency}%.`,
      response: {
        title: 'Efficiency Analysis',
        data: sortedRobots,
        type: 'comparison',
        metadata: {
          comparisonType: 'Efficiency',
          metricName: 'Efficiency',
          chartData: {
            ...topRobots,
            ...topZones
          }
        }
      }
    };
  }
  
  /**
   * Handle status-related queries
   */
  private handleStatusQuery(
    query: string, 
    data: WarehouseDataType
  ): { message: string; response: QueryResponse } {
    const { robots, overview } = data;
    
    // Check if asking about idle robots
    if (this.idlePattern.test(query)) {
      const idleRobots = robots.filter(r => r.status === 'idle');
      
      if (idleRobots.length === 0) {
        return {
          message: `There are currently no idle AMRs in the warehouse. All robots are actively engaged in tasks.`,
          response: {
            title: 'Idle AMRs',
            data: null,
            type: 'error'
          }
        };
      }
      
      // Find the first idle robot to display
      const firstIdleRobot = idleRobots[0];
      
      return {
        message: `There are ${idleRobots.length} idle AMRs in the warehouse. AMR ${firstIdleRobot.id} is currently idle in ${firstIdleRobot.zoneId}.`,
        response: {
          title: 'Idle AMR Status',
          data: firstIdleRobot,
          type: 'robot'
        }
      };
    }
    
    // Check if asking about active robots
    if (this.activePattern.test(query)) {
      const activeRobots = robots.filter(r => r.status === 'active');
      
      if (activeRobots.length === 0) {
        return {
          message: `There are currently no active AMRs in the warehouse. Most robots may be charging or in maintenance.`,
          response: {
            title: 'Active AMRs',
            data: null,
            type: 'error'
          }
        };
      }
      
      // Find the first active robot to display
      const firstActiveRobot = activeRobots[0];
      
      return {
        message: `There are ${activeRobots.length} active AMRs in the warehouse. AMR ${firstActiveRobot.id} is currently active in ${firstActiveRobot.zoneId}, working on ${firstActiveRobot.currentTask}.`,
        response: {
          title: 'Active AMR Status',
          data: firstActiveRobot,
          type: 'robot'
        }
      };
    }
    
    // General status query
    const activeCount = robots.filter(r => r.status === 'active').length;
    const idleCount = robots.filter(r => r.status === 'idle').length;
    const chargingCount = robots.filter(r => r.status === 'charging').length;
    const maintenanceCount = robots.filter(r => r.status === 'maintenance').length;
    
    return {
      message: `The warehouse currently has ${overview.activeRobots} active AMRs out of ${overview.totalRobots} total. ${chargingCount} are charging, ${maintenanceCount} are in maintenance, and ${idleCount} are idle.`,
      response: {
        title: 'AMR Status Overview',
        data: robots,
        type: 'multi-robot',
        metadata: {
          metricName: 'Status Distribution',
          chartData: {
            'Active': activeCount,
            'Idle': idleCount,
            'Charging': chargingCount,
            'Maintenance': maintenanceCount
          }
        }
      }
    };
  }
  
  /**
   * Handle maintenance-related queries
   */
  private handleMaintenanceQuery(
    query: string, 
    data: WarehouseDataType
  ): { message: string; response: QueryResponse } {
    const { robots } = data;
    const maintenanceRobots = robots.filter(r => r.status === 'maintenance');
    
    if (maintenanceRobots.length === 0) {
      return {
        message: `There are currently no AMRs in maintenance. All robots are operational.`,
        response: {
          title: 'Maintenance Status',
          data: null,
          type: 'error'
        }
      };
    }
    
    // Find the first maintenance robot to display
    const firstMaintenanceRobot = maintenanceRobots[0];
    
    return {
      message: `There are ${maintenanceRobots.length} AMRs currently undergoing maintenance. AMR ${firstMaintenanceRobot.id} is in maintenance in ${firstMaintenanceRobot.zoneId}.`,
      response: {
        title: 'Maintenance Status',
        data: firstMaintenanceRobot,
        type: 'robot'
      }
    };
  }
  
  /**
   * Handle battery-related queries
   */
  private handleBatteryQuery(
    query: string, 
    data: WarehouseDataType
  ): { message: string; response: QueryResponse } {
    const { robots } = data;
    
    // Check if asking about low battery robots
    if (this.lowestPattern.test(query)) {
      const sortedByBattery = [...robots].sort((a, b) => a.batteryLevel - b.batteryLevel);
      const lowestBatteryRobot = sortedByBattery[0];
      
      return {
        message: `AMR ${lowestBatteryRobot.id} has the lowest battery at ${lowestBatteryRobot.batteryLevel}%. ${this.getBatteryStatusDescription(lowestBatteryRobot.batteryLevel)}`,
        response: {
          title: 'Lowest Battery AMR',
          data: lowestBatteryRobot,
          type: 'robot'
        }
      };
    }
    
    // Check for charging robots
    if (query.includes("charging")) {
      const chargingRobots = robots.filter(r => r.status === 'charging');
      
      if (chargingRobots.length === 0) {
        return {
          message: `There are currently no AMRs charging. All robots are either active, idle, or in maintenance.`,
          response: {
            title: 'Charging Status',
            data: null,
            type: 'error'
          }
        };
      }
      
      const firstChargingRobot = chargingRobots[0];
      
      return {
        message: `There are ${chargingRobots.length} AMRs currently charging. AMR ${firstChargingRobot.id} is charging in ${firstChargingRobot.zoneId} at ${firstChargingRobot.batteryLevel}%.`,
        response: {
          title: 'Charging Status',
          data: firstChargingRobot,
          type: 'robot'
        }
      };
    }
    
    // General battery information
    const averageBattery = Math.round(robots.reduce((sum, robot) => sum + robot.batteryLevel, 0) / robots.length);
    const criticalBatteryRobots = robots.filter(r => r.batteryLevel < 20).length;
    
    // Sort robots by battery level for the display
    const sortedByBattery = [...robots].sort((a, b) => b.batteryLevel - a.batteryLevel);
    
    // Create battery level distribution chart
    const batteryLevels = {
      'Critical (0-20%)': robots.filter(r => r.batteryLevel < 20).length,
      'Low (20-40%)': robots.filter(r => r.batteryLevel >= 20 && r.batteryLevel < 40).length,
      'Medium (40-60%)': robots.filter(r => r.batteryLevel >= 40 && r.batteryLevel < 60).length,
      'Good (60-80%)': robots.filter(r => r.batteryLevel >= 60 && r.batteryLevel < 80).length,
      'Full (80-100%)': robots.filter(r => r.batteryLevel >= 80).length
    };
    
    return {
      message: `The average battery level across all AMRs is ${averageBattery}%. There are ${criticalBatteryRobots} robots with critical battery levels (below 20%).`,
      response: {
        title: 'Battery Overview',
        data: sortedByBattery,
        type: 'multi-robot',
        metadata: {
          metricName: 'Battery Levels',
          chartData: batteryLevels
        }
      }
    };
  }
  
  /**
   * Handle multi-robot location queries
   */
  private handleMultiRobotLocationQuery(
    query: string, 
    data: WarehouseDataType
  ): { message: string; response: QueryResponse } {
    const { robots, zones } = data;
    
    // Group robots by zone
    const robotsByZone = zones.map(zone => {
      const zoneRobots = robots.filter(r => r.zoneId === zone.id);
      return { zone, robots: zoneRobots };
    });
    
    // Find the zone with the most robots to highlight
    const zoneWithMostRobots = robotsByZone.sort((a, b) => b.robots.length - a.robots.length)[0];
    
    // Create distribution chart data
    const distributionByZone: Record<string, number> = {};
    zones.forEach(zone => {
      distributionByZone[zone.name] = robots.filter(r => r.zoneId === zone.id).length;
    });
    
    return {
      message: `Most AMRs are currently in ${zoneWithMostRobots.zone.name} (${zoneWithMostRobots.robots.length} robots). ${zones.map(z => `${z.name}: ${robots.filter(r => r.zoneId === z.id).length} AMRs`).join(', ')}.`,
      response: {
        title: 'Robot Locations',
        data: robots,
        type: 'multi-robot',
        metadata: {
          metricName: 'Zone Distribution',
          chartData: distributionByZone
        }
      }
    };
  }
  
  /**
   * Determines if a query is complex (contains multiple dimensions)
   */
  private isComplexQuery(query: string): boolean {
    // Count the number of different patterns matched
    let patternCount = 0;
    
    // Check for robot specific identifiers
    if (this.robotIdPattern.test(query)) patternCount++;
    
    // Check for zone specific identifiers
    if (this.zoneIdPattern.test(query)) patternCount++;
    
    // Count other pattern types
    if (this.batteryPattern.test(query)) patternCount++;
    if (this.efficiencyPattern.test(query)) patternCount++;
    if (this.maintenancePattern.test(query)) patternCount++;
    if (this.toolPattern.test(query)) patternCount++;
    if (this.statusPattern.test(query)) patternCount++;
    if (this.priorityPattern.test(query)) patternCount++;
    if (this.trafficPattern.test(query)) patternCount++;
    if (this.comparePattern.test(query)) patternCount++;
    
    // If there are 3 or more patterns, consider it a complex query
    return patternCount >= 3;
  }
  
  /**
   * Handle complex, multi-dimensional queries
   */
  private handleComplexQuery(query: string, data: WarehouseDataType): { message: string; response: QueryResponse } {
    const { robots, zones, overview } = data;
    
    // Example: "Show me the battery levels of AMRs in Zone A with efficiency below 70%"
    if (this.zoneIdPattern.test(query) && this.batteryPattern.test(query) && this.efficiencyPattern.test(query)) {
      const zoneMatch = query.match(this.zoneIdPattern);
      if (zoneMatch) {
        const zoneId = `Zone ${zoneMatch[1].toUpperCase()}`;
        const zone = data.getZoneById(zoneId);
        
        if (!zone) {
          return {
            message: `I couldn't find ${zoneId} in the system.`,
            response: {
              title: 'Zone Not Found',
              data: null,
              type: 'error'
            }
          };
        }
        
        // Check for efficiency threshold
        let efficiencyThreshold = 70; // Default threshold
        const efficiencyMatch = query.match(/(\d+)%/);
        if (efficiencyMatch) {
          efficiencyThreshold = parseInt(efficiencyMatch[1]);
        }
        
        const zoneRobots = robots.filter(r => r.zoneId === zoneId && r.efficiency < efficiencyThreshold);
        
        if (zoneRobots.length === 0) {
          return {
            message: `There are no AMRs in ${zoneId} with efficiency below ${efficiencyThreshold}%.`,
            response: {
              title: `${zoneId} Battery Analysis`,
              data: [],
              type: 'multi-robot'
            }
          };
        }
        
        // Sort by battery level
        const sortedRobots = [...zoneRobots].sort((a, b) => a.batteryLevel - b.batteryLevel);
        
        // Create battery level chart data
        const batteryLevels = sortedRobots.reduce<Record<string, number>>((result, robot) => {
          result[`AMR ${robot.id}`] = robot.batteryLevel;
          return result;
        }, {});
        
        return {
          message: `In ${zoneId}, ${sortedRobots.length} AMRs have efficiency below ${efficiencyThreshold}%. Their battery levels range from ${sortedRobots[0].batteryLevel}% to ${sortedRobots[sortedRobots.length - 1].batteryLevel}%.`,
          response: {
            title: `${zoneId} Low Efficiency AMRs - Battery Analysis`,
            data: sortedRobots,
            type: 'multi-robot',
            metadata: {
              metricName: 'Battery Level',
              chartData: batteryLevels
            }
          }
        };
      }
    }
    
    // Example: "Which robots are using the forklift tool and have a battery below 50%?"
    if (this.toolPattern.test(query) && this.batteryPattern.test(query)) {
      // Extract tool name
      let toolName = "forklift"; // Default tool to search for
      const toolTerms = ["forklift", "gripper", "conveyor", "scanner", "lift", "arm", "vacuum"];
      
      for (const term of toolTerms) {
        if (query.includes(term)) {
          toolName = term;
          break;
        }
      }
      
      // Extract battery threshold
      let batteryThreshold = 50; // Default threshold
      const batteryMatch = query.match(/(\d+)%/);
      if (batteryMatch) {
        batteryThreshold = parseInt(batteryMatch[1]);
      }
      
      // Filter robots
      const matchingRobots = robots.filter(r => 
        r.currentTool.toLowerCase().includes(toolName) && 
        r.batteryLevel < batteryThreshold
      );
      
      if (matchingRobots.length === 0) {
        return {
          message: `No AMRs with the ${toolName} tool have battery levels below ${batteryThreshold}%.`,
          response: {
            title: `${toolName.charAt(0).toUpperCase() + toolName.slice(1)} Tool Users`,
            data: [],
            type: 'multi-robot'
          }
        };
      }
      
      return {
        message: `${matchingRobots.length} AMRs are using the ${toolName} tool and have battery levels below ${batteryThreshold}%: ${matchingRobots.map(r => `AMR ${r.id} (${r.batteryLevel}%)`).join(', ')}.`,
        response: {
          title: `${toolName.charAt(0).toUpperCase() + toolName.slice(1)} Tool Users - Low Battery`,
          data: matchingRobots,
          type: 'multi-robot',
          metadata: {
            metricName: 'Battery Level',
            chartData: matchingRobots.reduce<Record<string, number>>((result, robot) => {
              result[`AMR ${robot.id}`] = robot.batteryLevel;
              return result;
            }, {})
          }
        }
      };
    }
    
    // Example: "Compare the efficiency of Zone A and Zone B for robots using forklift tools"
    if (this.comparePattern.test(query) && this.zoneIdPattern.test(query) && this.efficiencyPattern.test(query)) {
      // Check for specific zones to compare
      const zones = data.zones;
      const zoneIds = zones.map(z => z.id);
      
      // Extract tool name if present
      let toolFilter: string | null = null;
      if (this.toolPattern.test(query)) {
        const toolTerms = ["forklift", "gripper", "conveyor", "scanner", "lift", "arm", "vacuum"];
        for (const term of toolTerms) {
          if (query.includes(term)) {
            toolFilter = term;
            break;
          }
        }
      }
      
      // Calculate efficiency for each zone
      const zoneEfficiencies: Record<string, number> = {};
      const zoneRobotCounts: Record<string, number> = {};
      
      for (const zone of zones) {
        const zoneRobots = robots.filter(r => r.zoneId === zone.id);
        const filteredRobots = toolFilter 
          ? zoneRobots.filter(r => r.currentTool.toLowerCase().includes(toolFilter))
          : zoneRobots;
          
        zoneRobotCounts[zone.name] = filteredRobots.length;
        
        if (filteredRobots.length > 0) {
          const avgEfficiency = filteredRobots.reduce((sum, r) => sum + r.efficiency, 0) / filteredRobots.length;
          zoneEfficiencies[zone.name] = Math.round(avgEfficiency);
        } else {
          zoneEfficiencies[zone.name] = 0;
        }
      }
      
      // Compose the response
      const toolMessage = toolFilter ? ` using ${toolFilter} tools` : '';
      let message = `Zone efficiency comparison for AMRs${toolMessage}:\n`;
      
      for (const [zoneName, efficiency] of Object.entries(zoneEfficiencies)) {
        const robotCount = zoneRobotCounts[zoneName];
        message += `- ${zoneName}: ${efficiency}% efficiency (${robotCount} AMRs${toolMessage})\n`;
      }
      
      return {
        message: message.trim(),
        response: {
          title: `Zone Efficiency Comparison${toolFilter ? ` - ${toolFilter} Tools` : ''}`,
          data: zones,
          type: 'comparison',
          metadata: {
            comparisonType: 'Zone',
            metricName: 'Efficiency',
            chartData: zoneEfficiencies
          }
        }
      };
    }
    
    // Default handler for complex queries
    // Identify the most important concepts in the query
    const hasBattery = this.batteryPattern.test(query);
    const hasEfficiency = this.efficiencyPattern.test(query);
    const hasMaintenance = this.maintenancePattern.test(query);
    const hasZone = this.zoneIdPattern.test(query);
    const hasRobot = this.robotIdPattern.test(query);
    const hasTool = this.toolPattern.test(query);
    const hasStatus = this.statusPattern.test(query);
    
    // Create a comprehensive analysis
    let title = "Comprehensive Analysis";
    let analysisMessage = "Based on your complex query, here's a comprehensive analysis:\n\n";
    
    if (hasZone) {
      const zoneMatch = query.match(this.zoneIdPattern);
      if (zoneMatch) {
        const zoneId = `Zone ${zoneMatch[1].toUpperCase()}`;
        const zone = data.getZoneById(zoneId);
        
        if (zone) {
          title = `${zone.name} Analysis`;
          analysisMessage += `${zone.name} is a ${zone.priority} priority zone with ${zone.robotCount} active AMRs and ${zone.tasksPending} pending tasks.\n\n`;
          
          // Add relevant zone robots
          const zoneRobots = robots.filter(r => r.zoneId === zoneId);
          if (zoneRobots.length > 0) {
            analysisMessage += `AMRs in this zone:\n`;
            zoneRobots.forEach(r => {
              analysisMessage += `- AMR ${r.id}: ${r.status}, ${r.batteryLevel}% battery, using ${r.currentTool} tool\n`;
            });
          }
        }
      }
    } else if (hasRobot) {
      const robotMatch = query.match(this.robotIdPattern);
      if (robotMatch) {
        const robotId = parseInt(robotMatch[2]);
        const robot = data.getRobotById(robotId);
        
        if (robot) {
          title = `AMR ${robot.id} Analysis`;
          analysisMessage += `AMR ${robot.id} is a ${robot.status} robot in ${robot.zoneId} with ${robot.batteryLevel}% battery.\n`;
          analysisMessage += `It's using a ${robot.currentTool} tool and currently ${robot.currentTask ? `working on ${robot.currentTask}` : 'not assigned any tasks'}.\n`;
          analysisMessage += `This robot is operating at ${robot.efficiency}% efficiency.\n\n`;
        }
      }
    } else {
      // General warehouse analysis
      analysisMessage += `Warehouse Overview:\n`;
      analysisMessage += `- ${overview.activeRobots} active AMRs out of ${overview.totalRobots} total\n`;
      analysisMessage += `- Overall efficiency: ${overview.robotEfficiency}%\n`;
      analysisMessage += `- Tasks completed today: ${overview.tasksCompleted}\n\n`;
      
      const highPriorityZones = zones.filter(z => z.priority === 'high');
      if (highPriorityZones.length > 0) {
        analysisMessage += `High Priority Zones: ${highPriorityZones.map(z => z.name).join(', ')}\n`;
      }
      
      if (hasBattery) {
        const lowBatteryRobots = robots.filter(r => r.batteryLevel < 30);
        if (lowBatteryRobots.length > 0) {
          analysisMessage += `\nCritical Battery Levels:\n`;
          lowBatteryRobots.forEach(r => {
            analysisMessage += `- AMR ${r.id}: ${r.batteryLevel}% battery in ${r.zoneId}\n`;
          });
        }
      }
      
      if (hasMaintenance) {
        const maintenanceRobots = robots.filter(r => r.status === 'maintenance');
        if (maintenanceRobots.length > 0) {
          analysisMessage += `\nRobots in Maintenance:\n`;
          maintenanceRobots.forEach(r => {
            analysisMessage += `- AMR ${r.id} in ${r.zoneId}\n`;
          });
        }
      }
    }
    
    // Provide recommendations if efficiency is mentioned
    if (hasEfficiency) {
      analysisMessage += `\nEfficiency Recommendations:\n`;
      analysisMessage += `- Redistribute AMRs from low-task zones to high-priority zones\n`;
      analysisMessage += `- Prioritize charging for AMRs with battery levels between 30-40%\n`;
      analysisMessage += `- Swap tools to match the most common tasks in each zone\n`;
    }
    
    return {
      message: analysisMessage.trim(),
      response: {
        title,
        data: hasZone || hasRobot ? (hasZone ? data.zones : robots) : overview,
        type: hasZone ? 'multi-zone' : (hasRobot ? 'multi-robot' : 'overview'),
        metadata: {
          secondaryData: analysisMessage.split('\n\n')
        }
      }
    };
  }
  
  /**
   * Handle deployment and resource allocation queries
   */
  private handleDeploymentQuery(query: string, data: WarehouseDataType): { message: string; response: QueryResponse } {
    const { robots, zones } = data;
    
    // Check for specific deployment instructions
    if (this.zoneIdPattern.test(query)) {
      const zoneMatch = query.match(this.zoneIdPattern);
      if (zoneMatch) {
        const zoneId = `Zone ${zoneMatch[1].toUpperCase()}`;
        const zone = data.getZoneById(zoneId);
        
        if (!zone) {
          return {
            message: `I couldn't find ${zoneId} in the system.`,
            response: {
              title: 'Zone Not Found',
              data: null,
              type: 'error'
            }
          };
        }
        
        // Check if we need to deploy specific number of robots
        let robotCount = 2; // Default count
        const countMatch = query.match(/(\d+)\s+(robots|amrs)/i);
        if (countMatch) {
          robotCount = parseInt(countMatch[1]);
        }
        
        // Find available robots (idle or in low priority zones)
        const availableRobots = robots.filter(r => 
          r.status === 'idle' || 
          (r.status !== 'maintenance' && r.zoneId !== zoneId && 
            data.getZoneById(r.zoneId)?.priority !== 'high')
        );
        
        if (availableRobots.length === 0) {
          return {
            message: `There are no available AMRs to deploy to ${zoneId}. All AMRs are either in high priority zones or in maintenance.`,
            response: {
              title: `Deployment to ${zoneId}`,
              data: null,
              type: 'error'
            }
          };
        }
        
        // Sort by battery level (highest first) and not currently active
        const sortedRobots = [...availableRobots].sort((a, b) => {
          // Prioritize idle robots
          if (a.status === 'idle' && b.status !== 'idle') return -1;
          if (a.status !== 'idle' && b.status === 'idle') return 1;
          // Then sort by battery level
          return b.batteryLevel - a.batteryLevel;
        });
        
        const deployableRobots = sortedRobots.slice(0, robotCount);
        
        return {
          message: `I can deploy ${deployableRobots.length} AMRs to ${zoneId}: ${deployableRobots.map(r => `AMR ${r.id} (${r.batteryLevel}% battery, currently ${r.status}${r.status !== 'idle' ? ` in ${r.zoneId}` : ''})`).join(', ')}.`,
          response: {
            title: `Deployment Plan for ${zoneId}`,
            data: deployableRobots,
            type: 'multi-robot',
            metadata: {
              secondaryData: [
                `Target zone: ${zoneId} (${zone.priority} priority)`,
                `Current robot count: ${zone.robotCount}`,
                `Pending tasks: ${zone.tasksPending}`,
                `Traffic density: ${zone.trafficDensity}`
              ]
            }
          }
        };
      }
    }
    
    // Handle general redistribution query
    if (this.redistributePattern.test(query)) {
      // Identify high priority zones with high task loads
      const highPriorityZones = zones.filter(z => z.priority === 'high' && z.tasksPending > 5);
      
      // Identify low priority zones with low task loads
      const lowPriorityZones = zones.filter(z => z.priority === 'low' && z.tasksPending < 3);
      
      if (highPriorityZones.length === 0 || lowPriorityZones.length === 0) {
        return {
          message: `There's currently no need for robot redistribution. Zone priorities and task loads are well balanced.`,
          response: {
            title: 'Resource Distribution',
            data: zones,
            type: 'multi-zone'
          }
        };
      }
      
      // Find robots in low priority zones that could be redistributed
      const redistributableRobots: Record<string, Robot[]> = {};
      const targetZones: Record<string, Zone> = {};
      
      for (const lowZone of lowPriorityZones) {
        const zoneRobots = robots.filter(r => r.zoneId === lowZone.id && r.status !== 'maintenance');
        if (zoneRobots.length > 1) { // Keep at least 1 robot per zone
          redistributableRobots[lowZone.id] = zoneRobots.slice(0, zoneRobots.length - 1);
        }
      }
      
      for (const highZone of highPriorityZones) {
        targetZones[highZone.id] = highZone;
      }
      
      // Build redistribution plan
      const redistributionPlan: string[] = [];
      
      for (const [sourceZoneId, sourceRobots] of Object.entries(redistributableRobots)) {
        for (const targetZoneId of Object.keys(targetZones)) {
          for (const robot of sourceRobots) {
            redistributionPlan.push(`Move AMR ${robot.id} from ${sourceZoneId} to ${targetZoneId}`);
            
            // Remove this robot from the list so we don't assign it twice
            sourceRobots.splice(sourceRobots.indexOf(robot), 1);
            
            // Check if target zone has enough robots now
            if (redistributionPlan.filter(plan => plan.includes(targetZoneId)).length >= 2) {
              delete targetZones[targetZoneId];
              break;
            }
            
            if (sourceRobots.length === 0) break;
          }
          if (sourceRobots.length === 0) break;
        }
      }
      
      if (redistributionPlan.length === 0) {
        return {
          message: `After analysis, I don't recommend any robot redistribution at this time. The current allocation is optimal given the task distribution.`,
          response: {
            title: 'Resource Distribution',
            data: zones,
            type: 'multi-zone'
          }
        };
      }
      
      return {
        message: `I recommend the following robot redistribution plan to optimize warehouse operations:\n\n${redistributionPlan.join('\n')}`,
        response: {
          title: 'Robot Redistribution Plan',
          data: zones,
          type: 'multi-zone',
          metadata: {
            secondaryData: redistributionPlan
          }
        }
      };
    }
    
    // Handle general deployment recommendation
    const highTaskZones = [...zones].sort((a, b) => b.tasksPending - a.tasksPending).slice(0, 2);
    const idleRobots = robots.filter(r => r.status === 'idle');
    
    if (idleRobots.length === 0) {
      return {
        message: `There are currently no idle AMRs available for deployment. All robots are actively engaged in tasks.`,
        response: {
          title: 'Deployment Recommendation',
          data: null,
          type: 'error'
        }
      };
    }
    
    if (highTaskZones.length === 0) {
      return {
        message: `All zones currently have balanced task loads. No specific deployment recommendation is needed at this time.`,
        response: {
          title: 'Deployment Recommendation',
          data: zones,
          type: 'multi-zone'
        }
      };
    }
    
    // Create deployment recommendations
    const deploymentPlans: string[] = [];
    
    for (const zone of highTaskZones) {
      const availableRobots = idleRobots.slice(0, 2);
      if (availableRobots.length > 0) {
        availableRobots.forEach(robot => {
          deploymentPlans.push(`Deploy AMR ${robot.id} to ${zone.name} to help with ${zone.tasksPending} pending tasks`);
          // Remove from idle robots list
          idleRobots.splice(idleRobots.indexOf(robot), 1);
        });
      }
      
      if (idleRobots.length === 0) break;
    }
    
    return {
      message: `Based on the current warehouse state, I recommend the following deployments:\n\n${deploymentPlans.join('\n')}`,
      response: {
        title: 'Deployment Recommendations',
        data: highTaskZones,
        type: 'multi-zone',
        metadata: {
          secondaryData: deploymentPlans
        }
      }
    };
  }
  
  /**
   * Handle optimization-related queries
   */
  private handleOptimizationQuery(query: string, data: WarehouseDataType): { message: string; response: QueryResponse } {
    const { robots, zones, overview } = data;
    
    // Identify key optimization areas
    const lowBatteryRobots = robots.filter(r => r.batteryLevel < 30 && r.status !== 'charging');
    const maintenanceRobots = robots.filter(r => r.status === 'maintenance');
    const idleRobots = robots.filter(r => r.status === 'idle');
    const highTrafficZones = zones.filter(z => z.trafficDensity === 'high');
    const highTaskZones = zones.filter(z => z.tasksPending > 5);
    
    // Generate optimization insights
    const optimizations: string[] = [];
    
    if (lowBatteryRobots.length > 0) {
      optimizations.push(`Schedule ${lowBatteryRobots.length} AMRs for charging: ${lowBatteryRobots.map(r => `AMR ${r.id} (${r.batteryLevel}%)`).join(', ')}`);
    }
    
    if (maintenanceRobots.length > 0) {
      optimizations.push(`Prioritize maintenance completion for ${maintenanceRobots.length} AMRs: ${maintenanceRobots.map(r => `AMR ${r.id}`).join(', ')}`);
    }
    
    if (idleRobots.length > 0 && highTaskZones.length > 0) {
      optimizations.push(`Reassign ${Math.min(idleRobots.length, highTaskZones.length)} idle AMRs to high-task zones: ${highTaskZones.map(z => z.name).join(', ')}`);
    }
    
    if (highTrafficZones.length > 0) {
      optimizations.push(`Implement traffic control measures in high traffic zones: ${highTrafficZones.map(z => z.name).join(', ')}`);
    }
    
    // Tool optimization
    const toolCounts: Record<string, number> = {};
    robots.forEach(r => {
      if (!toolCounts[r.currentTool]) {
        toolCounts[r.currentTool] = 0;
      }
      toolCounts[r.currentTool]++;
    });
    
    const toolsToRedistribute = Object.entries(toolCounts)
      .filter(([_, count]) => count > Math.ceil(robots.length / 3))
      .map(([tool]) => tool);
      
    if (toolsToRedistribute.length > 0) {
      optimizations.push(`Redistribute ${toolsToRedistribute.join(', ')} tools more evenly across AMRs`);
    }
    
    // If no specific optimizations were found
    if (optimizations.length === 0) {
      optimizations.push("The warehouse is currently operating at optimal efficiency. Continue to monitor for changes.");
    }
    
    return {
      message: `Here are my optimization recommendations for improving warehouse operations:\n\n${optimizations.join('\n\n')}`,
      response: {
        title: 'Optimization Recommendations',
        data: overview,
        type: 'overview',
        metadata: {
          secondaryData: optimizations
        }
      }
    };
  }
  
  /**
   * Handle forecasting and trend analysis queries
   */
  private handleForecastQuery(query: string, data: WarehouseDataType): { message: string; response: QueryResponse } {
    const { robots, zones, overview } = data;
    
    // Create a simple forecast based on current data
    // In a real system, this would use historical data and ML models
    
    const activePercentage = (overview.activeRobots / overview.totalRobots) * 100;
    const averageBatteryLevel = robots.reduce((sum, r) => sum + r.batteryLevel, 0) / robots.length;
    const maintenanceRobots = robots.filter(r => r.status === 'maintenance').length;
    const chargingRobots = robots.filter(r => r.status === 'charging').length;
    
    // Project future states
    const projections: string[] = [];
    
    // Battery projection
    const timeUntilCritical = Math.round((averageBatteryLevel - 20) / 5); // Rough estimate: 5% battery usage per hour
    projections.push(`Based on current battery levels, approximately ${Math.round(robots.length * 0.2)} AMRs will need charging within the next ${timeUntilCritical} hours`);
    
    // Task completion projection
    const avgTasksPerHour = overview.tasksCompleted / 8; // Assuming 8 hours of operation so far
    projections.push(`At the current rate, approximately ${Math.round(avgTasksPerHour * 24)} tasks will be completed in the next 24 hours`);
    
    // Maintenance projection
    if (maintenanceRobots > 0) {
      projections.push(`If maintenance continues at the current rate, ${maintenanceRobots} AMRs will resume operations in approximately 3 hours`);
    }
    
    // Efficiency projection
    const currentEfficiency = overview.robotEfficiency;
    let projectedEfficiency = currentEfficiency;
    
    if (maintenanceRobots > robots.length * 0.1) {
      projectedEfficiency += 5; // Efficiency boost when maintenance completes
    }
    
    if (chargingRobots > robots.length * 0.2) {
      projectedEfficiency += 3; // Efficiency boost when charging completes
    }
    
    if (activePercentage < 70) {
      projectedEfficiency -= 2; // Efficiency decrease with low activity
    }
    
    projections.push(`Warehouse efficiency is projected to ${projectedEfficiency > currentEfficiency ? 'increase' : 'decrease'} to ${projectedEfficiency}% in the next 4 hours`);
    
    // Zone-specific projections
    const highTaskZones = zones.filter(z => z.tasksPending > 5);
    if (highTaskZones.length > 0) {
      const zoneTasks = highTaskZones.reduce((sum, z) => sum + z.tasksPending, 0);
      const zoneRobots = highTaskZones.reduce((sum, z) => sum + z.robotCount, 0);
      const completionTime = Math.ceil(zoneTasks / (zoneRobots * 2)); // Rough estimate: 2 tasks per robot per hour
      
      projections.push(`High-task zones (${highTaskZones.map(z => z.name).join(', ')}) will require approximately ${completionTime} hours to clear current backlog`);
    }
    
    return {
      message: `Based on current warehouse data, here are my projections for the next 24 hours:\n\n${projections.join('\n\n')}`,
      response: {
        title: 'Operational Forecast',
        data: overview,
        type: 'overview',
        metadata: {
          secondaryData: projections
        }
      }
    };
  }
  
  /**
   * Handle utilization and capacity planning queries
   */
  private handleUtilizationQuery(query: string, data: WarehouseDataType): { message: string; response: QueryResponse } {
    const { robots, zones, overview } = data;
    
    // Calculate current utilization metrics
    const robotUtilization = (overview.activeRobots / overview.totalRobots) * 100;
    const zoneUtilization = zones.map(zone => {
      const capacity = zone.priority === 'high' ? 10 : (zone.priority === 'medium' ? 8 : 6);
      return {
        name: zone.name,
        utilization: (zone.robotCount / capacity) * 100,
        capacity
      };
    });
    
    // Tool utilization
    const toolCounts: Record<string, number> = {};
    robots.forEach(r => {
      if (!toolCounts[r.currentTool]) {
        toolCounts[r.currentTool] = 0;
      }
      toolCounts[r.currentTool]++;
    });
    
    // Zone capacity analysis
    const zoneCapacityAnalysis = zoneUtilization.map(z => 
      `${z.name}: ${Math.round(z.utilization)}% utilized (${robots.filter(r => r.zoneId === z.name).length}/${z.capacity} AMRs)`
    );
    
    // Tool utilization analysis
    const toolUtilizationAnalysis = Object.entries(toolCounts).map(([tool, count]) => 
      `${tool}: ${count} AMRs (${Math.round((count / robots.length) * 100)}% of fleet)`
    );
    
    // Calculate capacity for additional tasks
    const availableCapacity = overview.totalRobots - overview.activeRobots;
    const additionalTaskCapacity = availableCapacity * 2; // Rough estimate: 2 tasks per robot
    
    const insights = [
      `Overall AMR utilization: ${Math.round(robotUtilization)}%`,
      `Available capacity: ${availableCapacity} AMRs`,
      `Estimated additional task capacity: ${additionalTaskCapacity} tasks`,
      `Most utilized zone: ${zoneUtilization.sort((a, b) => b.utilization - a.utilization)[0].name}`,
      `Most common tool: ${Object.entries(toolCounts).sort((a, b) => b[1] - a[1])[0][0]}`
    ];
    
    return {
      message: `Current warehouse utilization analysis:\n\n` + 
        `Robot Utilization: ${Math.round(robotUtilization)}% of total fleet\n\n` +
        `Zone Utilization:\n${zoneCapacityAnalysis.join('\n')}\n\n` +
        `Tool Distribution:\n${toolUtilizationAnalysis.join('\n')}\n\n` +
        `The warehouse has capacity for approximately ${additionalTaskCapacity} additional tasks with the current resource allocation.`,
      response: {
        title: 'Utilization & Capacity Analysis',
        data: overview,
        type: 'overview',
        metadata: {
          secondaryData: insights,
          chartData: zoneUtilization.reduce<Record<string, number>>((result, zone) => {
            result[zone.name] = Math.round(zone.utilization);
            return result;
          }, {})
        }
      }
    };
  }
  
  /**
   * Handle scheduling-related queries
   */
  private handleSchedulingQuery(query: string, data: WarehouseDataType): { message: string; response: QueryResponse } {
    const { robots, zones } = data;
    
    // Identify robots that need scheduling
    const lowBatteryRobots = robots.filter(r => r.batteryLevel < 30 && r.status !== 'charging');
    const maintenanceRobots = robots.filter(r => r.status === 'maintenance');
    const idleRobots = robots.filter(r => r.status === 'idle');
    
    // Identify zones with tasks
    const zonesWithTasks = zones.filter(z => z.tasksPending > 0)
      .sort((a, b) => (b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1) - 
                       (a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1) || 
                        b.tasksPending - a.tasksPending);
    
    // Generate schedule recommendations
    const schedule: string[] = [];
    
    // Schedule charging for low battery robots
    if (lowBatteryRobots.length > 0) {
      schedule.push(`Immediate charging: ${lowBatteryRobots.map(r => `AMR ${r.id} (${r.batteryLevel}%)`).join(', ')}`);
    }
    
    // Schedule robots for tasks
    const robotAssignments: Record<string, string[]> = {};
    
    // First attempt to assign idle robots to high priority zones
    let remainingIdleRobots = [...idleRobots];
    
    for (const zone of zonesWithTasks) {
      if (!robotAssignments[zone.name]) {
        robotAssignments[zone.name] = [];
      }
      
      const robotsNeeded = Math.min(zone.tasksPending, remainingIdleRobots.length);
      
      if (robotsNeeded > 0) {
        const assignedRobots = remainingIdleRobots.splice(0, robotsNeeded);
        robotAssignments[zone.name].push(...assignedRobots.map(r => `AMR ${r.id}`));
      }
      
      if (remainingIdleRobots.length === 0) break;
    }
    
    // Create schedule entries for robot assignments
    for (const [zoneName, assignedRobots] of Object.entries(robotAssignments)) {
      if (assignedRobots.length > 0) {
        const zone = zones.find(z => z.name === zoneName);
        if (zone) {
          schedule.push(`Assign ${assignedRobots.join(', ')} to ${zoneName} for ${zone.tasksPending} pending tasks`);
        }
      }
    }
    
    // Schedule maintenance completion
    if (maintenanceRobots.length > 0) {
      schedule.push(`Maintenance completion (estimated 3 hours): ${maintenanceRobots.map(r => `AMR ${r.id}`).join(', ')}`);
    }
    
    // If no specific schedule items were found
    if (schedule.length === 0) {
      schedule.push("No immediate scheduling actions required. All AMRs are appropriately assigned.");
    }
    
    // Create time-based schedule for presentation
    const currentTime = new Date();
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    
    const timeSchedule: string[] = [];
    let timeOffset = 0;
    
    for (const item of schedule) {
      const scheduleTime = new Date(currentTime.getTime() + timeOffset * 60000);
      const scheduleHours = scheduleTime.getHours();
      const scheduleMinutes = scheduleTime.getMinutes();
      
      timeSchedule.push(`${scheduleHours.toString().padStart(2, '0')}:${scheduleMinutes.toString().padStart(2, '0')} - ${item}`);
      
      // Add time offset for next item
      timeOffset += 30; // 30 minutes between schedule items
    }
    
    return {
      message: `Here is the recommended schedule for the next few hours:\n\n${timeSchedule.join('\n\n')}`,
      response: {
        title: 'AMR Schedule Recommendation',
        data: zonesWithTasks,
        type: 'multi-zone',
        metadata: {
          secondaryData: timeSchedule
        }
      }
    };
  }
  
  /**
   * Helper to get a description based on battery level
   */
  private getBatteryStatusDescription(level: number): string {
    if (level < 10) {
      return "The battery is critically low and requires immediate charging.";
    } else if (level < 30) {
      return "The battery is running low and should be charged soon.";
    } else if (level < 60) {
      return "The battery level is moderate.";
    } else if (level < 80) {
      return "The battery level is good.";
    } else {
      return "The battery is nearly full.";
    }
  }

  /**
   * Handle queries for all robots information
   */
  private handleAllRobotsQuery(
    query: string, 
    data: WarehouseDataType
  ): { message: string; response: QueryResponse } {
    const { robots } = data;
    
    // Check if we need to sort robots by a specific attribute
    let sortedRobots = [...robots];
    let sortAttribute = '';
    
    if (this.batteryPattern.test(query)) {
      sortedRobots = sortedRobots.sort((a, b) => b.batteryLevel - a.batteryLevel);
      sortAttribute = 'batteryLevel';
    } else if (this.efficiencyPattern.test(query)) {
      sortedRobots = sortedRobots.sort((a, b) => b.efficiency - a.efficiency);
      sortAttribute = 'efficiency';
    } else if (this.statusPattern.test(query)) {
      // Group by status
      const statusCounts = {
        active: robots.filter(r => r.status === 'active').length,
        idle: robots.filter(r => r.status === 'idle').length,
        charging: robots.filter(r => r.status === 'charging').length,
        maintenance: robots.filter(r => r.status === 'maintenance').length
      };
      
      return {
        message: `There are ${robots.length} AMRs in the warehouse: ${statusCounts.active} active, ${statusCounts.idle} idle, ${statusCounts.charging} charging, and ${statusCounts.maintenance} in maintenance.`,
        response: {
          title: 'All Robots by Status',
          data: sortedRobots,
          type: 'multi-robot',
          metadata: {
            metricName: 'Status',
            chartData: statusCounts
          }
        }
      };
    }
    
    // Return sorted robots with appropriate title
    let title = 'All Robots';
    if (sortAttribute) {
      title = `All Robots by ${sortAttribute.charAt(0).toUpperCase() + sortAttribute.slice(1)}`;
    }
    
    return {
      message: `Here are all ${robots.length} AMRs in the warehouse${sortAttribute ? `, sorted by ${sortAttribute}` : ''}.`,
      response: {
        title,
        data: sortedRobots,
        type: 'multi-robot'
      }
    };
  }
  
  /**
   * Handle queries for all zones information
   */
  private handleAllZonesQuery(
    query: string, 
    data: WarehouseDataType
  ): { message: string; response: QueryResponse } {
    const { zones } = data;
    
    // Check if we need to sort zones by a specific attribute
    let sortedZones = [...zones];
    let sortAttribute = '';
    
    if (this.efficiencyPattern.test(query)) {
      sortedZones = sortedZones.sort((a, b) => b.efficiency - a.efficiency);
      sortAttribute = 'efficiency';
    } else if (this.priorityPattern.test(query)) {
      // Sort by priority (high > medium > low)
      sortedZones = sortedZones.sort((a, b) => {
        const priorityValue = { high: 3, medium: 2, low: 1 };
        return priorityValue[b.priority] - priorityValue[a.priority];
      });
      sortAttribute = 'priority';
    } else if (this.trafficPattern.test(query)) {
      // Sort by traffic density (high > medium > low)
      sortedZones = sortedZones.sort((a, b) => {
        const densityValue = { high: 3, medium: 2, low: 1 };
        return densityValue[b.trafficDensity] - densityValue[a.trafficDensity];
      });
      sortAttribute = 'traffic density';
    }
    
    // Return all zones with appropriate title
    let title = 'All Zones';
    if (sortAttribute) {
      title = `All Zones by ${sortAttribute.charAt(0).toUpperCase() + sortAttribute.slice(1)}`;
    }
    
    return {
      message: `Here are all ${zones.length} zones in the warehouse${sortAttribute ? `, sorted by ${sortAttribute}` : ''}.`,
      response: {
        title,
        data: sortedZones,
        type: 'multi-zone'
      }
    };
  }
  
  /**
   * Handle comparison queries between robots or zones
   */
  private handleComparisonQuery(
    query: string, 
    data: WarehouseDataType
  ): { message: string; response: QueryResponse } {
    const { robots, zones } = data;
    
    // Determine what type of entities we're comparing
    const isRobotComparison = query.includes('robot') || query.includes('amr');
    const isZoneComparison = query.includes('zone');
    
    // Determine which attribute we're comparing
    let attribute = '';
    if (this.batteryPattern.test(query)) {
      attribute = 'batteryLevel';
    } else if (this.efficiencyPattern.test(query)) {
      attribute = 'efficiency';
    } else if (this.statusPattern.test(query)) {
      attribute = 'status';
    } else if (this.toolPattern.test(query)) {
      attribute = 'currentTool';
    } else if (this.priorityPattern.test(query)) {
      attribute = 'priority';
    } else if (this.trafficPattern.test(query)) {
      attribute = 'trafficDensity';
    } else {
      // Default to efficiency if no specific attribute mentioned
      attribute = 'efficiency';
    }
    
    if (isRobotComparison) {
      let sortedRobots = [...robots];
      
      // For numeric attributes, sort in descending order
      if (attribute === 'batteryLevel') {
        sortedRobots = sortedRobots.sort((a, b) => b.batteryLevel - a.batteryLevel);
      } else if (attribute === 'efficiency') {
        sortedRobots = sortedRobots.sort((a, b) => b.efficiency - a.efficiency);
      }
      
      // For status, group by status
      if (attribute === 'status') {
        const statusCounts = {
          active: robots.filter(r => r.status === 'active').length,
          idle: robots.filter(r => r.status === 'idle').length,
          charging: robots.filter(r => r.status === 'charging').length,
          maintenance: robots.filter(r => r.status === 'maintenance').length
        };
        
        return {
          message: `Comparing AMRs by status: ${statusCounts.active} active, ${statusCounts.idle} idle, ${statusCounts.charging} charging, and ${statusCounts.maintenance} in maintenance.`,
          response: {
            title: 'Robot Status Comparison',
            data: sortedRobots,
            type: 'comparison',
            metadata: {
              comparisonType: 'Robot',
              metricName: 'Status',
              chartData: statusCounts
            }
          }
        };
      }
      
      // For tools, group by tool type
      if (attribute === 'currentTool') {
        const toolCounts: Record<string, number> = {};
        robots.forEach(robot => {
          if (!toolCounts[robot.currentTool]) {
            toolCounts[robot.currentTool] = 0;
          }
          toolCounts[robot.currentTool]++;
        });
        
        return {
          message: `Comparing AMRs by current tool: ${Object.entries(toolCounts).map(([tool, count]) => `${count} using ${tool}`).join(', ')}.`,
          response: {
            title: 'Robot Tool Comparison',
            data: sortedRobots,
            type: 'comparison',
            metadata: {
              comparisonType: 'Robot',
              metricName: 'Tool',
              chartData: toolCounts
            }
          }
        };
      }
      
      // For numeric attributes, return sorted list with appropriate title
      const readableAttribute = attribute === 'batteryLevel' ? 'Battery Level' : 'Efficiency';
      const value = attribute === 'batteryLevel' ? 
        sortedRobots[0].batteryLevel : 
        sortedRobots[0].efficiency;
      
      return {
        message: `Comparing AMRs by ${readableAttribute.toLowerCase()}. The highest is AMR ${sortedRobots[0].id} at ${value}${attribute === 'batteryLevel' ? '%' : '% efficiency'}.`,
        response: {
          title: `Robot ${readableAttribute} Comparison`,
          data: sortedRobots,
          type: 'comparison',
          metadata: {
            comparisonType: 'Robot',
            metricName: readableAttribute
          }
        }
      };
      
    } else if (isZoneComparison) {
      let sortedZones = [...zones];
      
      // For numeric attributes, sort in descending order
      if (attribute === 'efficiency') {
        sortedZones = sortedZones.sort((a, b) => b.efficiency - a.efficiency);
      }
      
      // For priority/traffic, group by category
      if (attribute === 'priority' || attribute === 'trafficDensity') {
        const categoryCounts: Record<string, number> = {
          high: 0,
          medium: 0,
          low: 0
        };
        
        if (attribute === 'priority') {
          categoryCounts.high = zones.filter(z => z.priority === 'high').length;
          categoryCounts.medium = zones.filter(z => z.priority === 'medium').length;
          categoryCounts.low = zones.filter(z => z.priority === 'low').length;
        } else { // trafficDensity
          categoryCounts.high = zones.filter(z => z.trafficDensity === 'high').length;
          categoryCounts.medium = zones.filter(z => z.trafficDensity === 'medium').length;
          categoryCounts.low = zones.filter(z => z.trafficDensity === 'low').length;
        }
        
        const readableAttribute = attribute === 'priority' ? 'Priority' : 'Traffic Density';
        return {
          message: `Comparing zones by ${readableAttribute.toLowerCase()}: ${categoryCounts.high} high, ${categoryCounts.medium} medium, and ${categoryCounts.low} low.`,
          response: {
            title: `Zone ${readableAttribute} Comparison`,
            data: sortedZones,
            type: 'comparison',
            metadata: {
              comparisonType: 'Zone',
              metricName: readableAttribute,
              chartData: categoryCounts
            }
          }
        };
      }
      
      // For efficiency, return sorted list with appropriate title
      return {
        message: `Comparing zones by efficiency. The most efficient is ${sortedZones[0].name} at ${sortedZones[0].efficiency}%.`,
        response: {
          title: 'Zone Efficiency Comparison',
          data: sortedZones,
          type: 'comparison',
          metadata: {
            comparisonType: 'Zone',
            metricName: 'Efficiency'
          }
        }
      };
    }
    
    // Default comparison fallback
    return {
      message: `I'm not sure what you want to compare. You can compare robots by battery level, efficiency, status, or tool, or zones by priority, traffic density, or efficiency.`,
      response: {
        title: 'Comparison',
        data: null,
        type: 'error'
      }
    };
  }
  
  /**
   * Handle count queries for robots, zones, or tasks
   */
  private handleCountQuery(
    query: string, 
    data: WarehouseDataType
  ): { message: string; response: QueryResponse } {
    const { robots, zones, overview } = data;
    
    // Count of robots by status
    if (query.includes('robot') || query.includes('amr')) {
      const activeCount = robots.filter(r => r.status === 'active').length;
      const idleCount = robots.filter(r => r.status === 'idle').length;
      const chargingCount = robots.filter(r => r.status === 'charging').length;
      const maintenanceCount = robots.filter(r => r.status === 'maintenance').length;
      
      return {
        message: `There are ${robots.length} total AMRs in the warehouse: ${activeCount} active, ${idleCount} idle, ${chargingCount} charging, and ${maintenanceCount} in maintenance.`,
        response: {
          title: 'Robot Count',
          data: overview,
          type: 'overview',
          metadata: {
            secondaryData: {
              'Active': activeCount,
              'Idle': idleCount,
              'Charging': chargingCount,
              'Maintenance': maintenanceCount
            }
          }
        }
      };
    }
    
    // Count of zones by priority
    if (query.includes('zone')) {
      const highPriorityCount = zones.filter(z => z.priority === 'high').length;
      const mediumPriorityCount = zones.filter(z => z.priority === 'medium').length;
      const lowPriorityCount = zones.filter(z => z.priority === 'low').length;
      
      return {
        message: `There are ${zones.length} total zones in the warehouse: ${highPriorityCount} high priority, ${mediumPriorityCount} medium priority, and ${lowPriorityCount} low priority.`,
        response: {
          title: 'Zone Count',
          data: zones,
          type: 'multi-zone',
          metadata: {
            chartData: {
              'High Priority': highPriorityCount,
              'Medium Priority': mediumPriorityCount,
              'Low Priority': lowPriorityCount
            }
          }
        }
      };
    }
    
    // Count of tasks
    if (query.includes('task')) {
      const totalPendingTasks = zones.reduce((sum, zone) => sum + zone.tasksPending, 0);
      const totalCompletedTasks = overview.tasksCompleted;
      
      return {
        message: `There are ${totalPendingTasks} pending tasks and ${totalCompletedTasks} completed tasks today across all zones.`,
        response: {
          title: 'Task Count',
          data: overview,
          type: 'overview',
          metadata: {
            secondaryData: {
              'Pending Tasks': totalPendingTasks,
              'Completed Tasks': totalCompletedTasks
            }
          }
        }
      };
    }
    
    // Default count response
    return {
      message: `The warehouse has ${overview.totalRobots} total AMRs (${overview.activeRobots} active) and ${zones.length} zones with a total of ${zones.reduce((sum, zone) => sum + zone.tasksPending, 0)} pending tasks.`,
      response: {
        title: 'Warehouse Count Summary',
        data: overview,
        type: 'overview'
      }
    };
  }
  
  /**
   * Handle priority-related queries
   */
  private handlePriorityQuery(
    query: string, 
    data: WarehouseDataType
  ): { message: string; response: QueryResponse } {
    const { zones } = data;
    
    // High priority zones
    if (this.highestPattern.test(query)) {
      const highPriorityZones = zones.filter(z => z.priority === 'high');
      
      if (highPriorityZones.length === 0) {
        return {
          message: `There are no high priority zones in the warehouse currently.`,
          response: {
            title: 'High Priority Zones',
            data: null,
            type: 'error'
          }
        };
      }
      
      return {
        message: `There are ${highPriorityZones.length} high priority zones: ${highPriorityZones.map(z => z.name).join(', ')}. These zones have a total of ${highPriorityZones.reduce((sum, z) => sum + z.tasksPending, 0)} pending tasks.`,
        response: {
          title: 'High Priority Zones',
          data: highPriorityZones,
          type: 'multi-zone'
        }
      };
    }
    
    // Low priority zones
    if (this.lowestPattern.test(query)) {
      const lowPriorityZones = zones.filter(z => z.priority === 'low');
      
      if (lowPriorityZones.length === 0) {
        return {
          message: `There are no low priority zones in the warehouse currently.`,
          response: {
            title: 'Low Priority Zones',
            data: null,
            type: 'error'
          }
        };
      }
      
      return {
        message: `There are ${lowPriorityZones.length} low priority zones: ${lowPriorityZones.map(z => z.name).join(', ')}. These zones have a total of ${lowPriorityZones.reduce((sum, z) => sum + z.tasksPending, 0)} pending tasks.`,
        response: {
          title: 'Low Priority Zones',
          data: lowPriorityZones,
          type: 'multi-zone'
        }
      };
    }
    
    // All zones by priority
    const highPriorityZones = zones.filter(z => z.priority === 'high');
    const mediumPriorityZones = zones.filter(z => z.priority === 'medium');
    const lowPriorityZones = zones.filter(z => z.priority === 'low');
    
    return {
      message: `The warehouse has ${highPriorityZones.length} high priority zones, ${mediumPriorityZones.length} medium priority zones, and ${lowPriorityZones.length} low priority zones.`,
      response: {
        title: 'Zones by Priority',
        data: zones,
        type: 'multi-zone',
        metadata: {
          metricName: 'Priority',
          chartData: {
            'High': highPriorityZones.length,
            'Medium': mediumPriorityZones.length,
            'Low': lowPriorityZones.length
          }
        }
      }
    };
  }
  
  /**
   * Handle traffic-related queries
   */
  private handleTrafficQuery(
    query: string, 
    data: WarehouseDataType
  ): { message: string; response: QueryResponse } {
    const { zones } = data;
    
    // High traffic zones
    if (this.highestPattern.test(query)) {
      const highTrafficZones = zones.filter(z => z.trafficDensity === 'high');
      
      if (highTrafficZones.length === 0) {
        return {
          message: `There are no high traffic zones in the warehouse currently.`,
          response: {
            title: 'High Traffic Zones',
            data: null,
            type: 'error'
          }
        };
      }
      
      return {
        message: `There are ${highTrafficZones.length} high traffic zones: ${highTrafficZones.map(z => z.name).join(', ')}. These zones might experience congestion with ${highTrafficZones.reduce((sum, z) => sum + z.robotCount, 0)} active robots.`,
        response: {
          title: 'High Traffic Zones',
          data: highTrafficZones,
          type: 'multi-zone'
        }
      };
    }
    
    // Low traffic zones
    if (this.lowestPattern.test(query)) {
      const lowTrafficZones = zones.filter(z => z.trafficDensity === 'low');
      
      if (lowTrafficZones.length === 0) {
        return {
          message: `There are no low traffic zones in the warehouse currently.`,
          response: {
            title: 'Low Traffic Zones',
            data: null,
            type: 'error'
          }
        };
      }
      
      return {
        message: `There are ${lowTrafficZones.length} low traffic zones: ${lowTrafficZones.map(z => z.name).join(', ')}. These zones have good flow with ${lowTrafficZones.reduce((sum, z) => sum + z.robotCount, 0)} active robots.`,
        response: {
          title: 'Low Traffic Zones',
          data: lowTrafficZones,
          type: 'multi-zone'
        }
      };
    }
    
    // All zones by traffic
    const highTrafficZones = zones.filter(z => z.trafficDensity === 'high');
    const mediumTrafficZones = zones.filter(z => z.trafficDensity === 'medium');
    const lowTrafficZones = zones.filter(z => z.trafficDensity === 'low');
    
    return {
      message: `The warehouse has ${highTrafficZones.length} high traffic zones, ${mediumTrafficZones.length} medium traffic zones, and ${lowTrafficZones.length} low traffic zones.`,
      response: {
        title: 'Zones by Traffic',
        data: zones,
        type: 'multi-zone',
        metadata: {
          metricName: 'Traffic Density',
          chartData: {
            'High': highTrafficZones.length,
            'Medium': mediumTrafficZones.length,
            'Low': lowTrafficZones.length
          }
        }
      }
    };
  }
}

// Create a singleton instance
const localAIEngine = new LocalAIEngine();

/**
 * Process a natural language query from the user and generate a response
 * about warehouse data.
 * 
 * This service tries to use OpenAI for enhanced natural language understanding,
 * then falls back to Perplexity, and finally uses a local NLP system when 
 * both external APIs are unavailable.
 */
export async function handleAIQuery(query: string, warehouseData: any): Promise<{
  message: string;
  response: QueryResponse;
}> {
  try {
    // First try to use the OpenAI service for enhanced natural language understanding
    return await openAIService.processWarehouseQuery(query, {
      robots: warehouseData.robots,
      zones: warehouseData.zones,
      activities: warehouseData.activities,
      overview: warehouseData.overview
    });
  } catch (openAIError) {
    console.error("Error in OpenAI query handling, trying Perplexity API:", openAIError);
    
    try {
      // Second, try to use the Perplexity service as a fallback
      return await perplexityService.processWarehouseQuery(query, {
        robots: warehouseData.robots,
        zones: warehouseData.zones,
        activities: warehouseData.activities,
        overview: warehouseData.overview
      });
    } catch (perplexityError) {
      console.error("Error in Perplexity query handling, falling back to local AI:", perplexityError);
      
      // Finally, use the enhanced local AI engine for a natural-language-like experience
      return localAIEngine.processQuery(query, {
        robots: warehouseData.robots,
        zones: warehouseData.zones,
        activities: warehouseData.activities,
        overview: warehouseData.overview,
        getRobotById: warehouseData.getRobotById.bind(warehouseData),
        getZoneById: warehouseData.getZoneById.bind(warehouseData)
      });
    }
  }
}
