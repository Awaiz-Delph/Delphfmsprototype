import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { AIMessage, Robot, Zone, Activity, WarehouseOverview, QueryResponse } from '@shared/types';

// Define the context interface
interface WarehouseContextType {
  robots: Robot[];
  zones: Zone[];
  activities: Activity[];
  overview: WarehouseOverview;
  messages: AIMessage[];
  queryResponse: QueryResponse | null;
  isProcessing: boolean;
  isAIFocusMode: boolean;
  setAIFocusMode: (mode: boolean) => void;
  activeData: Record<string, any>; // Store multiple data items for dynamic display
  addToActiveData: (key: string, data: any) => void;
  removeFromActiveData: (key: string) => void;
  clearActiveData: () => void;
  sendQuery: (query: string) => void;
  resetQueryResponse: () => void;
  connectWebsocket: () => void;
}

// Create the context with default values
const WarehouseContext = createContext<WarehouseContextType>({
  robots: [],
  zones: [],
  activities: [],
  overview: {
    activeRobots: 0,
    totalRobots: 0,
    robotUtilization: 0,
    tasksCompleted: 0,
    robotEfficiency: 0,
    batteryLevels: {
      critical: 0,
      low: 0,
      medium: 0,
      high: 0
    },
    zonePerformance: [],
    taskCompletion: {
      total: 0,
      completed: 0,
      pending: 0,
      rate: 0
    },
    alerts: {
      high: 0,
      medium: 0,
      low: 0
    }
  },
  messages: [],
  queryResponse: null,
  isProcessing: false,
  isAIFocusMode: false,
  setAIFocusMode: () => {},
  activeData: {},
  addToActiveData: () => {},
  removeFromActiveData: () => {},
  clearActiveData: () => {},
  sendQuery: () => {},
  resetQueryResponse: () => {},
  connectWebsocket: () => {},
});

// Provider component
export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [overview, setOverview] = useState<WarehouseOverview>({
    activeRobots: 0,
    totalRobots: 0,
    robotUtilization: 0,
    tasksCompleted: 0,
    robotEfficiency: 0,
    batteryLevels: {
      critical: 0,
      low: 0,
      medium: 0,
      high: 0
    },
    zonePerformance: [],
    taskCompletion: {
      total: 0,
      completed: 0,
      pending: 0,
      rate: 0
    },
    alerts: {
      high: 0,
      medium: 0,
      low: 0
    }
  });
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your Delphnoid AI Assistant. How can I help you with warehouse operations today?",
    },
  ]);
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIFocusMode, setAIFocusMode] = useState(false);
  const [activeData, setActiveData] = useState<Record<string, any>>({});
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  // Functions to manage the active data
  const addToActiveData = useCallback((key: string, data: any) => {
    setActiveData(prev => ({
      ...prev,
      [key]: data
    }));
  }, []);
  
  const removeFromActiveData = useCallback((key: string) => {
    setActiveData(prev => {
      const newData = { ...prev };
      delete newData[key];
      return newData;
    });
  }, []);
  
  const clearActiveData = useCallback(() => {
    setActiveData({});
  }, []);

  // Connect to WebSocket for real-time updates
  const connectWebsocket = useCallback(() => {
    try {
      // Check if we're already in a browser context
      if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        console.log(`Connecting to WebSocket at ${wsUrl}`);
        
        // Use the browser's native WebSocket
        const ws = new window.WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected successfully');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string);
            console.log('WebSocket message received:', data.type);
            
            if (data.type === 'robots') {
              setRobots(data.payload);
            } else if (data.type === 'zones') {
              setZones(data.payload);
            } else if (data.type === 'activities') {
              setActivities(data.payload);
            } else if (data.type === 'overview') {
              setOverview(data.payload);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        ws.onclose = (event) => {
          console.log(`WebSocket disconnected with code: ${event.code}, reason: ${event.reason}`);
          // Attempt to reconnect after a delay
          setTimeout(connectWebsocket, 5000);
        };
        
        setSocket(ws);
        
        return () => {
          ws.close();
        };
      }
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [robotsRes, zonesRes, activitiesRes, overviewRes] = await Promise.all([
          fetch('/api/robots'),
          fetch('/api/zones'),
          fetch('/api/activities'),
          fetch('/api/overview'),
        ]);
        
        const robotsData = await robotsRes.json();
        const zonesData = await zonesRes.json();
        const activitiesData = await activitiesRes.json();
        const overviewData = await overviewRes.json();
        
        setRobots(robotsData);
        setZones(zonesData);
        setActivities(activitiesData);
        setOverview(overviewData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    
    fetchInitialData();
  }, []);

  // Process complex queries with selective display and property handling
  const processComplexQuery = useCallback((query: string) => {
    console.log("Processing complex query:", query);
    
    // Helper to create or update data view with specific properties
    const createOrUpdateDataView = (robotId: number, desiredProperties: string[]) => {
      const robot = robots.find(r => r.id === robotId);
      if (!robot) return;
      
      const dataKey = `robot_${robotId}`;
      const existingData = activeData[dataKey];
      
      // If we already have this robot data, update it, otherwise create new entry
      if (existingData) {
        // Create filtered data with only requested properties
        const filteredData = { ...robot };
        const newData = {
          ...existingData,
          data: filteredData,
          displayProperties: Array.from(new Set([...existingData.displayProperties, ...desiredProperties])),
          title: `AMR ${String(robotId).padStart(2, '0')} Information`
        };
        addToActiveData(dataKey, newData);
      } else {
        // Create new entry with specified properties
        addToActiveData(dataKey, {
          type: 'robot',
          data: robot,
          displayProperties: desiredProperties,
          title: `AMR ${String(robotId).padStart(2, '0')} Information`
        });
      }
    };
    
    // Simplified pattern extraction that focuses on WHAT to show and WHICH robots
    // Extract the first two numbers in the query as potential robot IDs
    const robotIds = Array.from(query.matchAll(/\b(\d+)\b/g)).map(match => parseInt(match[1]));
    
    // Check for battery info request with multiple robots
    if (query.toLowerCase().includes("battery") && robotIds.length >= 2) {
      console.log("Battery comparison for robots:", robotIds);
      for (const robotId of robotIds.slice(0, 2)) { // Process the first two robot IDs
        createOrUpdateDataView(robotId, ['batteryLevel']);
      }
      return `Displaying battery information for AMR ${robotIds[0]} and AMR ${robotIds[1]}.`;
    }
    
    // Check for zone information request
    if (query.toLowerCase().includes("zone") && robotIds.length >= 1) {
      console.log("Zone info for robot:", robotIds[0]);
      createOrUpdateDataView(robotIds[0], ['batteryLevel', 'zoneId']);
      return `Added zone information for AMR ${robotIds[0]}.`;
    }
    
    // Check for analytics comparison between robots
    if ((query.toLowerCase().includes("analytics") || query.toLowerCase().includes("stats")) && robotIds.length >= 2) {
      console.log("Analytics comparison for robots:", robotIds);
      const robot1 = robots.find(r => r.id === robotIds[0]);
      const robot2 = robots.find(r => r.id === robotIds[1]);
    
      if (robot1 && robot2) {
        const comparisonKey = `comparison_${robotIds[0]}_${robotIds[1]}`;
        addToActiveData(comparisonKey, {
          type: 'comparison',
          data: [robot1, robot2],
          metadata: {
            comparisonType: 'analytics',
            chartData: {
              'Efficiency': {
                [robot1.name]: robot1.efficiency,
                [robot2.name]: robot2.efficiency,
              },
              'Battery': {
                [robot1.name]: robot1.batteryLevel,
                [robot2.name]: robot2.batteryLevel,
              }
            }
          },
          title: `Analytics Comparison: AMR ${robotIds[0]} vs AMR ${robotIds[1]}`
        });
      
        return `Showing analytics comparison between AMR ${robotIds[0]} and AMR ${robotIds[1]}.`;
      }
    }
    
    // Check for remove analytics + show map request
    if (query.toLowerCase().includes("remove") && 
        query.toLowerCase().includes("analytics") && 
        query.toLowerCase().includes("map") && 
        robotIds.length >= 1) {
      console.log("Remove analytics and show map for robot:", robotIds[0]);
      
      // Remove analytics data
      Object.keys(activeData).forEach(key => {
        if (key.includes(`comparison`) && key.includes(`${robotIds[0]}`)) {
          removeFromActiveData(key);
        }
      });
      
      // Add map data
      const robot = robots.find(r => r.id === robotIds[0]);
      if (robot) {
        addToActiveData(`map_${robotIds[0]}`, {
          type: 'map',
          data: robot,
          displayProperties: ['coordinates'],
          title: `AMR ${robotIds[0]} Location`
        });
      }
      
      return `Removed analytics and showing map for AMR ${robotIds[0]}.`;
    }
    
    // Legacy detailed patterns for more specific matching when needed
    const showBatteryPattern = /\bbattery\b.*?\b(\d+)\b.*?\b(\d+)\b/i;
    const addZonePattern = /\bzone\b.*?\b(\d+)\b/i;
    const showAllInfoPattern = /\b(all|everything)\b.*?\b(\d+)\b/i;
    const showAnalyticsPattern = /\b(analytics|stats)\b.*?\b(\d+)\b.*?\b(\d+)\b/i;
    const removeAnalyticsPattern = /\b(remove|delete)\b.*?\b(analytics|stats)\b.*?\b(\d+)\b/i;
    const showMapPattern = /\b(map|location)\b.*?\b(\d+)\b/i;
    const addToolInfoPattern = /\b(tool|equipment)\b.*?\b(\d+)\b/i;
    const showEfficiencyPattern = /\b(efficiency|performance)\b.*?\b(\d+)\b/i;
    const compareRobotsPattern = /\bcompare\b.*?\b(\d+)\b.*?\b(\d+)\b/i;
    const trackActivityPattern = /\b(track|monitor)\b.*?\bactivity\b.*?\b(\d+)\b/i;

    // Check for battery information request for two AMRs
    const batteryMatch = query.match(showBatteryPattern);
    if (batteryMatch) {
      console.log('Battery match:', batteryMatch);
      
      // Extract the robot IDs based on the pattern groups
      // With enhanced regex we need to handle different positions
      let robotId1, robotId2;
      
      // First robot ID could be in group 5 (if formatted as AMR X)
      // If not found (NaN), try to find the first number in the query
      robotId1 = parseInt(batteryMatch[5]);
      if (isNaN(robotId1)) {
        // Try to extract the first number from the query
        const firstNumberMatch = query.match(/\b(\d+)\b/);
        if (firstNumberMatch) robotId1 = parseInt(firstNumberMatch[1]);
      }
      
      // Second robot ID could be in group 8 (if formatted as AMR X)
      // If not found, find the second number in the query
      robotId2 = parseInt(batteryMatch[8]);
      if (isNaN(robotId2)) {
        // Extract all numbers from the query and take the second one
        const allNumbers = query.match(/\b(\d+)\b/g);
        if (allNumbers && allNumbers.length >= 2) robotId2 = parseInt(allNumbers[1]);
      }
      
      if (!isNaN(robotId1) && !isNaN(robotId2)) {
        createOrUpdateDataView(robotId1, ['batteryLevel']);
        createOrUpdateDataView(robotId2, ['batteryLevel']);
        return `Displaying battery information for AMR ${robotId1} and AMR ${robotId2}.`;
      }
    }
    
    // Check for adding zone information to existing robot data
    const zoneMatch = query.match(addZonePattern);
    if (zoneMatch) {
      console.log('Zone match:', zoneMatch);
      
      // Extract robot ID - it could be in position 5 with new regex
      let robotId = parseInt(zoneMatch[5]);
      
      // If robotId is not found, try to extract the first number from the query
      if (isNaN(robotId)) {
        const numberMatch = query.match(/\b(\d+)\b/);
        if (numberMatch) robotId = parseInt(numberMatch[1]);
      }
      
      if (!isNaN(robotId)) {
        createOrUpdateDataView(robotId, ['batteryLevel', 'zoneId']);
        return `Added zone information for AMR ${robotId}.`;
      }
    }
    
    // Check for request to show all information about an AMR
    const allInfoMatch = query.match(showAllInfoPattern);
    if (allInfoMatch) {
      console.log('All info match:', allInfoMatch);
      
      // Extract robot ID
      let robotId = parseInt(allInfoMatch[6]);
      
      // If robotId is not found, try to extract the first number from the query
      if (isNaN(robotId)) {
        const numberMatch = query.match(/\b(\d+)\b/);
        if (numberMatch) robotId = parseInt(numberMatch[1]);
      }
      
      if (!isNaN(robotId)) {
        createOrUpdateDataView(robotId, ['batteryLevel', 'zoneId', 'status', 'currentTask', 'currentTool', 'efficiency', 'coordinates']);
        return `Showing all information for AMR ${robotId}.`;
      }
    }
    
    // Check for request to show analytics for two AMRs
    const analyticsMatch = query.match(showAnalyticsPattern);
    if (analyticsMatch) {
      console.log('Analytics match:', analyticsMatch);
      
      // Extract the robot IDs
      let robotId1 = parseInt(analyticsMatch[5]);
      let robotId2 = parseInt(analyticsMatch[8]);
      
      // Handle cases where regex groups might not contain the numbers
      if (isNaN(robotId1) || isNaN(robotId2)) {
        const allNumbers = query.match(/\b(\d+)\b/g);
        if (allNumbers && allNumbers.length >= 2) {
          robotId1 = parseInt(allNumbers[0]);
          robotId2 = parseInt(allNumbers[1]);
        }
      }
      
      // Validate and create the comparison
      if (!isNaN(robotId1) && !isNaN(robotId2)) {
        // Create comparison data for the two robots
        const robot1 = robots.find(r => r.id === robotId1);
        const robot2 = robots.find(r => r.id === robotId2);
      
        if (robot1 && robot2) {
          const comparisonKey = `comparison_${robotId1}_${robotId2}`;
          addToActiveData(comparisonKey, {
            type: 'comparison',
            data: [robot1, robot2],
            metadata: {
              comparisonType: 'analytics',
              chartData: {
                'Efficiency': {
                  [robot1.name]: robot1.efficiency,
                  [robot2.name]: robot2.efficiency,
                },
                'Battery': {
                  [robot1.name]: robot1.batteryLevel,
                  [robot2.name]: robot2.batteryLevel,
                }
              }
            },
            title: `Analytics Comparison: AMR ${robotId1} vs AMR ${robotId2}`
          });
          
          return `Showing analytics comparison between AMR ${robotId1} and AMR ${robotId2}.`;
        }
      }
    }
    
    // Check for request to remove analytics for an AMR and show map
    const removeAnalyticsMatch = query.match(removeAnalyticsPattern);
    const showMapMatch = query.match(showMapPattern);
    
    if (removeAnalyticsMatch && showMapMatch) {
      console.log('Remove analytics match:', removeAnalyticsMatch);
      console.log('Show map match:', showMapMatch);
      
      // Extract robot IDs with better handling for different patterns
      let removeRobotId = parseInt(removeAnalyticsMatch[5]);
      let mapRobotId = parseInt(showMapMatch[5]);
      
      // If IDs weren't found in the expected positions, try to extract them from the query
      const allNumbers = query.match(/\b(\d+)\b/g);
      
      if (isNaN(removeRobotId) && allNumbers && allNumbers.length >= 1) {
        removeRobotId = parseInt(allNumbers[0]);
      }
      
      if (isNaN(mapRobotId) && allNumbers && allNumbers.length >= 1) {
        // If we have multiple numbers, the second is likely the map robot
        // If we only have one number, both operations are on the same robot
        mapRobotId = allNumbers.length >= 2 ? parseInt(allNumbers[1]) : parseInt(allNumbers[0]);
      }
      
      // Remove analytics data
      Object.keys(activeData).forEach(key => {
        if (key.includes(`comparison`) && key.includes(`${removeRobotId}`)) {
          removeFromActiveData(key);
        }
      });
      
      // Add map data
      const robot = robots.find(r => r.id === mapRobotId);
      if (robot) {
        addToActiveData(`map_${mapRobotId}`, {
          type: 'robot',
          data: robot,
          displayProperties: ['coordinates'],
          title: `AMR ${mapRobotId} Location Map`
        });
      }
      
      return `Removed analytics for AMR ${removeRobotId} and showing map for AMR ${mapRobotId}.`;
    }
    
    // Check for tool information request
    const toolMatch = query.match(addToolInfoPattern);
    if (toolMatch) {
      console.log('Tool match:', toolMatch);
      const robotId = parseInt(toolMatch[5]);
      createOrUpdateDataView(robotId, ['currentTool']);
      
      return `Added tool information for AMR ${robotId}.`;
    }
    
    // Check for efficiency request
    const efficiencyMatch = query.match(showEfficiencyPattern);
    if (efficiencyMatch) {
      console.log('Efficiency match:', efficiencyMatch);
      const robotId = parseInt(efficiencyMatch[5]);
      createOrUpdateDataView(robotId, ['efficiency']);
      
      return `Showing efficiency information for AMR ${robotId}.`;
    }
    
    // Check for robot comparison
    const compareMatch = query.match(compareRobotsPattern);
    if (compareMatch) {
      console.log('Compare match:', compareMatch);
      const robotId1 = parseInt(compareMatch[3]);
      const robotId2 = parseInt(compareMatch[6]);
      
      const robot1 = robots.find(r => r.id === robotId1);
      const robot2 = robots.find(r => r.id === robotId2);
      
      if (robot1 && robot2) {
        const comparisonKey = `comparison_${robotId1}_${robotId2}`;
        addToActiveData(comparisonKey, {
          type: 'comparison',
          data: [robot1, robot2],
          metadata: {
            comparisonType: 'full',
            chartData: {
              'Efficiency': {
                [robot1.name]: robot1.efficiency,
                [robot2.name]: robot2.efficiency,
              },
              'Battery': {
                [robot1.name]: robot1.batteryLevel,
                [robot2.name]: robot2.batteryLevel,
              },
              'Tasks Completed': {
                [robot1.name]: Math.floor(Math.random() * 40) + 10,
                [robot2.name]: Math.floor(Math.random() * 40) + 10,
              },
              'Utilization': {
                [robot1.name]: Math.floor(Math.random() * 30) + 60,
                [robot2.name]: Math.floor(Math.random() * 30) + 60,
              }
            }
          },
          title: `Full Comparison: AMR ${robotId1} vs AMR ${robotId2}`
        });
        
        return `Comparing AMR ${robotId1} and AMR ${robotId2}.`;
      }
    }
    
    // New feature: Find idle robots in a specific zone
    const idleRobotsZonePattern = /\b(idle|inactive|available)\s+(robots|amrs)\s+in\s+zone\s+([a-c])\b/i;
    const idleZoneMatch = query.match(idleRobotsZonePattern);
    if (idleZoneMatch) {
      console.log('Idle robots in zone match:', idleZoneMatch);
      const zoneId = `Zone ${idleZoneMatch[3].toUpperCase()}`;
      const zone = zones.find(z => z.id === zoneId);
      
      if (zone) {
        // Find all idle robots in the specified zone
        const idleRobotsInZone = robots.filter(r => r.zoneId === zoneId && r.status === 'idle');
        
        if (idleRobotsInZone.length > 0) {
          const zoneKey = `idle_robots_zone_${zoneId}`;
          addToActiveData(zoneKey, {
            type: 'zone',
            data: zone,
            metadata: {
              robots: idleRobotsInZone,
              type: 'idle'
            },
            title: `Idle Robots in ${zone.name}`
          });
          
          return `Found ${idleRobotsInZone.length} idle robots in ${zone.name}.`;
        } else {
          return `No idle robots found in ${zone.name}.`;
        }
      }
    }
    
    // New feature: Prioritize zone
    const prioritizeZonePattern = /\b(prioritize|priority|urgent|important)\s+zone\s+([a-c])\b/i;
    const prioritizeMatch = query.match(prioritizeZonePattern);
    if (prioritizeMatch) {
      console.log('Prioritize zone match:', prioritizeMatch);
      const zoneId = `Zone ${prioritizeMatch[2].toUpperCase()}`;
      const zone = zones.find(z => z.id === zoneId);
      
      if (zone) {
        // Update zone priority to high
        const updatedZone = {...zone, priority: 'high'};
        
        const zoneKey = `priority_zone_${zoneId}`;
        addToActiveData(zoneKey, {
          type: 'zone',
          data: updatedZone,
          metadata: {
            previousPriority: zone.priority,
            action: 'prioritize'
          },
          title: `Priority Update: ${zone.name}`
        });
        
        return `Updated ${zone.name} priority to HIGH. Robots will be redirected accordingly.`;
      }
    }
    
    // New feature: Resource optimization suggestion
    const optimizePattern = /\b(optimize|improve|enhance|distribute|balance)\s+(resources|robots|amrs|tools)\b/i;
    const optimizeMatch = query.match(optimizePattern);
    if (optimizeMatch) {
      console.log('Optimization match:', optimizeMatch);
      
      // Calculate zone workloads
      const zoneWorkloads = zones.map(zone => {
        const zonesRobots = robots.filter(r => r.zoneId === zone.id);
        const activeRobots = zonesRobots.filter(r => r.status === 'working');
        const idleRobots = zonesRobots.filter(r => r.status === 'idle');
        const lowBatteryRobots = zonesRobots.filter(r => r.batteryLevel < 30);
        
        return {
          zone,
          robotCount: zonesRobots.length,
          activeCount: activeRobots.length,
          idleCount: idleRobots.length,
          lowBatteryCount: lowBatteryRobots.length,
          trafficScore: zone.trafficDensity === 'high' ? 3 : zone.trafficDensity === 'medium' ? 2 : 1,
          priorityScore: zone.priority === 'high' ? 3 : zone.priority === 'medium' ? 2 : 1
        };
      });
      
      // Generate optimization suggestions
      const suggestions = [];
      
      // Add suggestions based on workload analysis
      const highestWorkload = [...zoneWorkloads].sort((a, b) => b.activeCount - a.activeCount)[0];
      const lowestWorkload = [...zoneWorkloads].sort((a, b) => a.activeCount - b.activeCount)[0];
      
      if (highestWorkload.activeCount - lowestWorkload.activeCount >= 3) {
        suggestions.push(`Redistribute ${Math.min(3, Math.floor((highestWorkload.activeCount - lowestWorkload.activeCount) / 2))} robots from ${highestWorkload.zone.name} to ${lowestWorkload.zone.name}.`);
      }
      
      // Battery optimization
      const totalLowBattery = zoneWorkloads.reduce((sum, z) => sum + z.lowBatteryCount, 0);
      if (totalLowBattery > 3) {
        suggestions.push(`Schedule charging rotation for ${totalLowBattery} robots with low battery.`);
      }
      
      // Traffic optimization
      const highTrafficZones = zoneWorkloads.filter(z => z.trafficScore === 3);
      if (highTrafficZones.length > 0) {
        suggestions.push(`Reduce traffic density in ${highTrafficZones.map(z => z.zone.name).join(', ')} by adjusting robot pathfinding.`);
      }
      
      // Generate the optimization data view
      const optimizationKey = `optimization_${Date.now()}`;
      addToActiveData(optimizationKey, {
        type: 'optimization',
        data: {
          zoneWorkloads,
          suggestions
        },
        metadata: {
          timestamp: new Date(),
          type: 'resource'
        },
        title: 'Resource Optimization Recommendations'
      });
      
      return `Generated ${suggestions.length} optimization recommendations for warehouse resources.`;
    }
    
    // Check for activity tracking
    const activityMatch = query.match(trackActivityPattern);
    if (activityMatch) {
      console.log('Activity match:', activityMatch);
      const robotId = parseInt(activityMatch[4]);
      const robot = robots.find(r => r.id === robotId);
      
      if (robot) {
        const robotActivities = activities.filter(a => 
          a.robotName && a.robotName.includes(`AMR ${String(robotId).padStart(2, '0')}`)
        ).slice(0, 5);
        
        addToActiveData(`activities_${robotId}`, {
          type: 'robot',
          data: robot,
          metadata: {
            activities: robotActivities
          },
          displayProperties: ['status', 'currentTask'],
          title: `AMR ${robotId} Activity Tracking`
        });
        
        return `Now tracking activity for AMR ${robotId}.`;
      }
    }
    
    // If we get here, it's not a selective property request
    return null;
  }, [robots, zones, activities, activeData, addToActiveData, removeFromActiveData]);

  // Send query to AI assistant
  const sendQuery = useCallback(async (query: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    // Add user message
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    try {
      // First check if this is a complex/selective property query
      const complexResult = processComplexQuery(query);
      
      if (complexResult) {
        // It's a complex query that we've handled locally
        setAIFocusMode(true);
        
        // Add assistant response
        const assistantMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: complexResult,
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // It's a standard query that we'll send to the backend AI service
        const response = await apiRequest('POST', '/api/query', { query });
        const data = await response.json();
        
        // Add assistant response
        const assistantMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        setQueryResponse(data.response);
      }
    } catch (error) {
      console.error('Error sending query:', error);
      
      // Add error message
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m sorry, I encountered an error processing your request. Please try again.',
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, processComplexQuery, setAIFocusMode]);

  // Reset query response
  const resetQueryResponse = useCallback(() => {
    setQueryResponse(null);
  }, []);

  // Clean up websocket on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  // Update query behavior to enable focus mode automatically
  useEffect(() => {
    if (queryResponse) {
      setAIFocusMode(true);
      
      // Add the query response data to active data if it contains valid data
      if (queryResponse.data) {
        const dataKey = `${queryResponse.type}_${Date.now()}`;
        addToActiveData(dataKey, {
          type: queryResponse.type,
          data: queryResponse.data,
          metadata: queryResponse.metadata,
          title: queryResponse.title
        });
      }
    }
  }, [queryResponse, addToActiveData]);
  
  // Reset focus mode when query response is cleared
  useEffect(() => {
    if (!queryResponse) {
      setAIFocusMode(false);
      clearActiveData();
    }
  }, [queryResponse, clearActiveData]);

  return (
    <WarehouseContext.Provider
      value={{
        robots,
        zones,
        activities,
        overview,
        messages,
        queryResponse,
        isProcessing,
        isAIFocusMode,
        setAIFocusMode,
        activeData,
        addToActiveData,
        removeFromActiveData,
        clearActiveData,
        sendQuery,
        resetQueryResponse,
        connectWebsocket,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
}

// Custom hook to use the context
export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
}
