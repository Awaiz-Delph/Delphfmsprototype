import OpenAI from "openai";
import { Robot, Zone, QueryResponse, Activity } from "@shared/types";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. 
// Do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// This service enhances the AI Assistant capabilities with OpenAI integration
export class OpenAIService {
  /**
   * Process a natural language query about warehouse operations
   * @param query The user's query text
   * @param warehouseData Data about robots, zones, activities, and overview
   */
  async processWarehouseQuery(
    query: string,
    warehouseData: {
      robots: Robot[];
      zones: Zone[];
      activities: Activity[];
      overview: {
        activeRobots: number;
        totalRobots: number;
        tasksCompleted: number;
        robotEfficiency: number;
      };
    }
  ): Promise<{ message: string; response: QueryResponse }> {
    try {
      // First, try to match common patterns for immediate responses
      const normalizedQuery = query.toLowerCase();
      
      // Robot query - direct match
      const robotMatch = normalizedQuery.match(/amr (\d+)|robot (\d+)/i);
      if (robotMatch) {
        const robotId = parseInt(robotMatch[1] || robotMatch[2]);
        const robot = warehouseData.robots.find(r => r.id === robotId);
        
        if (robot) {
          return {
            message: `I've located AMR ${String(robotId).padStart(2, '0')}. It's currently in ${robot.zoneId} with a battery level of ${robot.batteryLevel}% and is ${robot.status === 'active' ? 'actively performing' : 'assigned to'} ${robot.currentTask}.`,
            response: {
              title: `AMR ${String(robotId).padStart(2, '0')} Status`,
              data: robot,
              type: 'robot'
            }
          };
        }
      }
      
      // Zone query - direct match
      const zoneMatch = normalizedQuery.match(/zone ([a-c])/i);
      if (zoneMatch) {
        const zoneId = `Zone ${zoneMatch[1].toUpperCase()}`;
        const zone = warehouseData.zones.find(z => z.id === zoneId);
        
        if (zone) {
          return {
            message: `${zoneId} currently has ${zone.robotCount} active AMRs with ${zone.tasksPending} pending tasks. The zone efficiency is at ${zone.efficiency}% with ${zone.trafficDensity} traffic density.`,
            response: {
              title: `${zoneId} Status`,
              data: zone,
              type: 'zone'
            }
          };
        }
      }
      
      // For more complex queries, use OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are the AI assistant for Delphnoid, an advanced warehouse automation system. 
            You help warehouse managers monitor and control Autonomous Mobile Robots (AMRs).
            Provide concise, specific answers about warehouse operations.
            
            Here is the current warehouse state:
            - Active Robots: ${warehouseData.overview.activeRobots}/${warehouseData.overview.totalRobots}
            - Tasks Completed Today: ${warehouseData.overview.tasksCompleted}
            - Overall Robot Efficiency: ${warehouseData.overview.robotEfficiency}%
            
            Respond in a helpful, informative manner focusing only on warehouse operations.
            If you need to recommend showing data for a specific robot or zone, indicate this in your JSON response.`
          },
          {
            role: "user",
            content: query
          }
        ],
        functions: [
          {
            name: "generate_warehouse_response",
            description: "Generate a response to a warehouse query, optionally with specific data to display",
            parameters: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description: "The text response to the query"
                },
                display_type: {
                  type: "string",
                  enum: ["robot", "zone", "none"],
                  description: "The type of data to display"
                },
                data_id: {
                  type: "string",
                  description: "The ID of the robot or zone to display"
                }
              },
              required: ["message", "display_type"]
            }
          }
        ],
        function_call: { name: "generate_warehouse_response" }
      });
      
      // Extract the function call result
      const functionCall = response.choices[0].message.function_call;
      if (!functionCall || !functionCall.arguments) {
        throw new Error("Invalid response from OpenAI");
      }
      
      const result = JSON.parse(functionCall.arguments);
      
      // Determine what data to display based on the AI's recommendation
      if (result.display_type === "robot") {
        const robotId = parseInt(result.data_id);
        const robot = warehouseData.robots.find(r => r.id === robotId);
        
        if (robot) {
          return {
            message: result.message,
            response: {
              title: `AMR ${String(robotId).padStart(2, '0')} Status`,
              data: robot,
              type: 'robot'
            }
          };
        }
      } else if (result.display_type === "zone") {
        const zoneId = result.data_id;
        const zone = warehouseData.zones.find(z => z.id === zoneId);
        
        if (zone) {
          return {
            message: result.message,
            response: {
              title: `${zoneId} Status`,
              data: zone,
              type: 'zone'
            }
          };
        }
      }
      
      // If no specific data to display or data not found
      return {
        message: result.message,
        response: {
          title: 'AI Response',
          data: null,
          type: 'error'
        }
      };
    } catch (error) {
      console.error("OpenAI error:", error);
      
      // Fallback to basic response
      return {
        message: "I'm sorry, I encountered an error processing your request. Please try again with a specific question about AMR locations, zone activities, or warehouse operations.",
        response: {
          title: 'Error',
          data: null,
          type: 'error'
        }
      };
    }
  }

  /**
   * Generate suggestions for warehouse optimizations
   * @param warehouseData Current warehouse state
   */
  async generateOptimizationSuggestions(warehouseData: any): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI optimization expert for warehouse automation. 
            Based on the current warehouse metrics, suggest 3-5 specific, actionable 
            optimizations to improve efficiency. Focus on practical steps that could 
            be implemented immediately. Format as a JSON array of suggestion strings.`
          },
          {
            role: "user",
            content: JSON.stringify({
              zones: warehouseData.zones,
              overview: warehouseData.overview,
              robotStatuses: warehouseData.robots.map((r: Robot) => ({
                id: r.id,
                status: r.status,
                batteryLevel: r.batteryLevel,
                zoneId: r.zoneId,
                efficiency: r.efficiency
              }))
            })
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        return ["Unable to generate optimization suggestions at this time."];
      }

      try {
        const result = JSON.parse(content);
        return Array.isArray(result.suggestions) ? result.suggestions : [];
      } catch (e) {
        console.error("Error parsing OpenAI JSON response:", e);
        return ["Error generating optimization suggestions."];
      }
    } catch (error) {
      console.error("OpenAI optimization error:", error);
      
      // Provide a set of realistic fallback suggestions based on warehouse data
      const lowBatteryRobots = warehouseData.robots.filter((r: Robot) => r.batteryLevel < 30).length;
      const idleRobots = warehouseData.robots.filter((r: Robot) => r.status === 'idle').length;
      const highTrafficZones = warehouseData.zones.filter((z: Zone) => z.trafficDensity === 'high').map((z: Zone) => z.name);
      
      const fallbackSuggestions = [
        "Redistribute AMRs from low-activity zones to high-demand areas to balance workload and reduce wait times.",
        "Implement dynamic charging schedules based on peak operation hours to maintain optimal fleet availability.",
        "Optimize AMR pathfinding algorithms to reduce cross-zone travel time by 15-20%.",
        "Deploy more versatile tool attachments to reduce the need for tool-switching operations."
      ];
      
      // Add contextual suggestions based on current warehouse state
      if (lowBatteryRobots > 0) {
        fallbackSuggestions.push(`Schedule preventive charging for ${lowBatteryRobots} AMRs below 30% battery to avoid mid-task disruptions.`);
      }
      
      if (idleRobots > 2) {
        fallbackSuggestions.push(`Reassign ${idleRobots} idle AMRs to assist with pending tasks in high-priority zones.`);
      }
      
      if (highTrafficZones.length > 0) {
        fallbackSuggestions.push(`Implement traffic flow optimization in ${highTrafficZones.join(', ')} to reduce congestion and improve throughput.`);
      }
      
      // Return a subset of 5 suggestions maximum
      return fallbackSuggestions.slice(0, 5);
    }
  }
}

export const openAIService = new OpenAIService();