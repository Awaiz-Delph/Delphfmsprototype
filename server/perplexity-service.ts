import { Robot, Zone, QueryResponse, Activity } from "@shared/types";

/**
 * This service enhances the AI Assistant capabilities with Perplexity integration
 * for more advanced natural language understanding and contextual responses
 */
export class PerplexityService {
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
            message: `I've located AMR ${String(robotId).padStart(2, '0')}. It's currently in ${robot.zoneId} with a battery level of ${robot.batteryLevel}% and is ${robot.status === 'working' ? 'actively performing' : 'assigned to'} ${robot.currentTask}.`,
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
            message: `${zoneId} currently has ${zone.robotCount} active AMRs with ${zone.currentTasks} pending tasks. The zone efficiency is at ${zone.efficiency}% with ${zone.trafficDensity} traffic density.`,
            response: {
              title: `${zoneId} Status`,
              data: zone,
              type: 'zone'
            }
          };
        }
      }
      
      // For more complex queries, use Perplexity API
      const response = await this.callPerplexityAPI(query, warehouseData);
      
      // Handle the Perplexity response
      if (response) {
        const responseContent = response.choices[0].message.content;
        
        // Determine what data to display based on the AI's recommendation
        // Check for robot data reference in the response
        const robotIdMatch = responseContent.match(/AMR (\d+)|robot (\d+)/i);
        if (robotIdMatch) {
          const robotId = parseInt(robotIdMatch[1] || robotIdMatch[2]);
          const robot = warehouseData.robots.find(r => r.id === robotId);
          
          if (robot) {
            return {
              message: responseContent,
              response: {
                title: `AMR ${String(robotId).padStart(2, '0')} Status`,
                data: robot,
                type: 'robot'
              }
            };
          }
        }
        
        // Check for zone data reference in the response
        const zoneIdMatch = responseContent.match(/Zone ([A-C])/i);
        if (zoneIdMatch) {
          const zoneId = `Zone ${zoneIdMatch[1].toUpperCase()}`;
          const zone = warehouseData.zones.find(z => z.id === zoneId);
          
          if (zone) {
            return {
              message: responseContent,
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
          message: responseContent,
          response: {
            title: 'AI Response',
            data: null,
            type: 'text'
          }
        };
      }
      
      // Fallback if Perplexity API call fails
      return {
        message: "I'm sorry, I couldn't process your query with advanced AI capabilities. Please try asking about specific robots (AMR 1), zones (Zone A), or warehouse metrics.",
        response: {
          title: 'Error',
          data: null,
          type: 'error'
        }
      };
    } catch (error) {
      console.error("Perplexity error:", error);
      
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
      const response = await this.callPerplexityAPI(
        "Based on this warehouse data, suggest 5 specific, actionable optimizations to improve efficiency:",
        warehouseData,
        true
      );

      if (response && response.choices && response.choices[0].message.content) {
        const suggestions = this.extractSuggestionsFromText(response.choices[0].message.content);
        return suggestions.length > 0 ? suggestions : this.getFallbackSuggestions(warehouseData);
      }
      
      return this.getFallbackSuggestions(warehouseData);
    } catch (error) {
      console.error("Perplexity optimization error:", error);
      return this.getFallbackSuggestions(warehouseData);
    }
  }
  
  /**
   * Extract suggestions from the text response
   */
  private extractSuggestionsFromText(text: string): string[] {
    // Try to extract bullet points or numbered items
    const bulletMatches = text.match(/(?:^|\n)[\s-]*([^\n\r]+)/g);
    if (bulletMatches && bulletMatches.length > 0) {
      return bulletMatches
        .map(match => match.replace(/^[\s-]*/, '').trim())
        .filter(item => item.length > 0);
    }
    
    // If no bullet points, split by periods or newlines
    return text
      .split(/[.\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 10 && !item.startsWith('based on') && !item.startsWith('according to'));
  }
  
  /**
   * Get fallback suggestions if the API call fails
   */
  private getFallbackSuggestions(warehouseData: any): string[] {
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

  /**
   * Call the Perplexity API with the query and warehouse data
   */
  private async callPerplexityAPI(query: string, warehouseData: any, isOptimizationQuery = false): Promise<any> {
    // Check if the API key is available
    if (!process.env.PERPLEXITY_API_KEY) {
      console.warn("PERPLEXITY_API_KEY not set, skipping API call");
      return null;
    }
    
    try {
      // Prepare the system message based on the query type
      let systemMessage = isOptimizationQuery 
        ? `You are an AI optimization expert for warehouse automation. Based on the warehouse metrics, suggest 3-5 specific, actionable optimizations to improve efficiency. Focus on practical steps that could be implemented immediately.`
        : `You are the AI assistant for Delphnoid, an advanced warehouse automation system. You help warehouse managers monitor and control Autonomous Mobile Robots (AMRs). Provide concise, specific answers about warehouse operations.
        
        Here is the current warehouse state:
        - Active Robots: ${warehouseData.overview.activeRobots}/${warehouseData.overview.totalRobots}
        - Tasks Completed Today: ${warehouseData.overview.tasksCompleted}
        - Overall Robot Efficiency: ${warehouseData.overview.robotEfficiency}%
        
        Respond in a helpful, informative manner focusing only on warehouse operations.`;
      
      // Prepare the user message based on the query type
      const userMessage = isOptimizationQuery
        ? JSON.stringify({
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
        : query;
      
      // Make the API call
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content: systemMessage
            },
            {
              role: "user",
              content: userMessage
            }
          ],
          temperature: 0.2,
          max_tokens: 500,
          stream: false
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Perplexity API error:', errorData);
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error calling Perplexity API:', error);
      return null;
    }
  }
}

export const perplexityService = new PerplexityService();