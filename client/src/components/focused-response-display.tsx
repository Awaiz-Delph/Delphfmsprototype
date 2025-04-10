import { motion } from "framer-motion";
import { X, PanelTop, LayoutGrid, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWarehouse } from "@/context/warehouse-context";
import { useState } from "react";

export default function FocusedResponseDisplay() {
  const { activeData, removeFromActiveData, clearActiveData, queryResponse } = useWarehouse();
  const [layout, setLayout] = useState<'grid' | 'panels'>('panels');
  
  // If no active data, show the query response in standard form
  const showStandardResponse = Object.keys(activeData).length === 0 && queryResponse;
  
  return (
    <div className="flex-1 flex flex-col">
      {/* Controls */}
      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`text-white/60 hover:text-white flex items-center gap-1.5 ${layout === 'panels' ? 'bg-white/10' : ''}`}
            onClick={() => setLayout('panels')}
          >
            <PanelTop className="h-4 w-4" />
            <span>Panels</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`text-white/60 hover:text-white flex items-center gap-1.5 ${layout === 'grid' ? 'bg-white/10' : ''}`}
            onClick={() => setLayout('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Grid</span>
          </Button>
        </div>
        
        <Button 
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white flex items-center gap-1.5 hover:bg-white/10"
          onClick={clearActiveData}
        >
          <RefreshCw className="h-4 w-4" />
          <span>Clear All</span>
        </Button>
      </div>
      
      {/* Display active data */}
      {showStandardResponse ? (
        <StandardResponseDisplay />
      ) : (
        <div className={layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'flex flex-col gap-4'}>
          {Object.entries(activeData).map(([key, item]) => (
            <ResponsePanel 
              key={key} 
              dataKey={key}
              data={item} 
              onRemove={() => removeFromActiveData(key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StandardResponseDisplay() {
  const { queryResponse } = useWarehouse();
  
  if (!queryResponse) return null;
  
  return (
    <motion.div
      className="glass rounded-3xl p-6 relative overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
          <i className="ri-robot-fill text-white"></i>
        </div>
        <div>
          <h3 className="font-display text-lg font-medium">{queryResponse.title}</h3>
        </div>
      </div>
      
      <div className="glass-dark rounded-2xl p-5">
        {queryResponse.type === 'robot' && queryResponse.data && (
          <RobotInfoDisplay 
            robot={queryResponse.data} 
            displayProperties={queryResponse.displayProperties} 
          />
        )}
        
        {queryResponse.type === 'zone' && queryResponse.data && (
          <ZoneInfoDisplay zone={queryResponse.data} />
        )}
        
        {queryResponse.type === 'multi-robot' && queryResponse.data && (
          <MultiRobotDisplay robots={queryResponse.data as any[]} metadata={queryResponse.metadata} />
        )}
        
        {queryResponse.type === 'multi-zone' && queryResponse.data && (
          <MultiZoneDisplay zones={queryResponse.data as any[]} metadata={queryResponse.metadata} />
        )}
        
        {queryResponse.type === 'overview' && queryResponse.data && (
          <OverviewDisplay overview={queryResponse.data as any} metadata={queryResponse.metadata} />
        )}
        
        {queryResponse.type === 'comparison' && queryResponse.data && (
          <ComparisonDisplay data={queryResponse.data} metadata={queryResponse.metadata} />
        )}
        
        {queryResponse.type === 'error' && (
          <ErrorDisplay />
        )}
      </div>
    </motion.div>
  );
}

function ResponsePanel({ dataKey, data, onRemove }: { dataKey: string, data: any, onRemove: () => void }) {
  return (
    <motion.div
      className="glass rounded-xl p-4 relative"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-display text-base font-medium text-white/90">{data.title}</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-full text-white/60 hover:text-white hover:bg-white/10"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="glass-dark rounded-xl p-3">
        {data.type === 'robot' && data.data && (
          <RobotInfoDisplay 
            robot={data.data} 
            displayProperties={data.displayProperties} 
          />
        )}
        
        {data.type === 'zone' && data.data && (
          <ZoneInfoDisplay zone={data.data} />
        )}
        
        {data.type === 'multi-robot' && data.data && (
          <MultiRobotDisplay robots={data.data} metadata={data.metadata} />
        )}
        
        {data.type === 'multi-zone' && data.data && (
          <MultiZoneDisplay zones={data.data} metadata={data.metadata} />
        )}
        
        {data.type === 'overview' && data.data && (
          <OverviewDisplay overview={data.data} metadata={data.metadata} />
        )}
        
        {data.type === 'comparison' && data.data && (
          <ComparisonDisplay data={data.data} metadata={data.metadata} />
        )}
      </div>
    </motion.div>
  );
}

// Import display components from the response-display.tsx file
function RobotInfoDisplay({ robot, displayProperties = [] }: { robot: any, displayProperties?: string[] }) {
  // Helper functions
  const shouldShow = (property: string) => {
    // If no specific properties are requested, show everything
    if (!displayProperties.length) return true;
    // Otherwise only show requested properties
    return displayProperties.includes(property);
  };
  
  // If we're showing map/coordinates only, display a simplified view
  if (displayProperties.length === 1 && displayProperties.includes('coordinates')) {
    return (
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-display text-base text-white/90">AMR {String(robot.id).padStart(2, '0')} Location</h3>
            <p className="text-white/50 text-xs">Currently in {robot.zoneId}</p>
          </div>
        </div>
        
        <div className="glass-dark p-4 rounded-lg mb-3">
          <div className="relative h-32 w-full bg-black/30 rounded-lg overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full">
              {/* Grid lines */}
              <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={`col-${i}`} className="border-r border-white/5"></div>
                ))}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={`row-${i}`} className="border-b border-white/5"></div>
                ))}
              </div>
              
              {/* Robot position */}
              <div 
                className="absolute w-4 h-4 bg-primary rounded-full shadow-glow-primary transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                style={{ 
                  left: `${(robot.coordinates.x / 50) * 100}%`, 
                  top: `${(robot.coordinates.y / 50) * 100}%` 
                }}
              ></div>
              
              {/* Zone indicators */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/40 rounded text-xs text-white/70">
                Zone A
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/40 rounded text-xs text-white/70">
                Zone B
              </div>
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/40 rounded text-xs text-white/70">
                Zone C
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-4 text-sm mt-2">
            <div className="glass px-3 py-1 rounded text-white/90 flex items-center gap-1.5">
              <span className="h-2 w-2 bg-primary rounded-full animate-pulse"></span>
              <span>X: {robot.coordinates.x}m</span>
            </div>
            <div className="glass px-3 py-1 rounded text-white/90 flex items-center gap-1.5">
              <span className="h-2 w-2 bg-primary rounded-full animate-pulse"></span>
              <span>Y: {robot.coordinates.y}m</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If only showing battery level, display a specialized view
  if (displayProperties.length === 1 && displayProperties.includes('batteryLevel')) {
    const batteryLevel = robot.batteryLevel;
    let batteryColor = "bg-green-500";
    let batteryTextColor = "text-green-500";
    
    if (batteryLevel < 20) {
      batteryColor = "bg-red-500";
      batteryTextColor = "text-red-500";
    } else if (batteryLevel < 50) {
      batteryColor = "bg-yellow-500";
      batteryTextColor = "text-yellow-500";
    }
    
    return (
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-display text-base text-white/90">AMR {String(robot.id).padStart(2, '0')} Battery</h3>
          </div>
          <div className={`${batteryTextColor} px-2 py-0.5 rounded-full text-xs bg-opacity-20 ${batteryColor.replace('bg-', 'bg-')}/20`}>
            {batteryLevel < 20 ? 'Critical' : batteryLevel < 50 ? 'Low' : 'Good'}
          </div>
        </div>
        
        <div className="glass-dark p-4 rounded-lg">
          <div className="flex justify-center mb-3">
            <div className="relative w-20 h-36">
              <div className="absolute top-0 left-0 w-20 h-36 border-2 border-white/20 rounded-lg"></div>
              <div className="absolute top-[8%] left-[10%] w-[80%] h-[84%] border-2 border-white/20 rounded-md overflow-hidden">
                <div 
                  className={`absolute bottom-0 left-0 w-full ${batteryColor} transition-all duration-1000 ease-out`} 
                  style={{ height: `${batteryLevel}%` }}
                ></div>
              </div>
              <div className="absolute top-[2%] left-[30%] w-[40%] h-[6%] bg-white/10 rounded-t-md"></div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="flex flex-col items-center">
              <p className="text-4xl font-bold text-white">{batteryLevel}%</p>
              <p className="text-white/50 text-xs mt-1">
                {batteryLevel < 20 ? 'Needs charging immediately' : 
                 batteryLevel < 50 ? 'Should charge soon' : 
                 'Battery level is good'}
              </p>
              {robot.status === 'charging' && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-green-400">
                  <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  <span>Currently charging</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Default view with selective properties
  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-display text-base text-white/90">AMR {String(robot.id).padStart(2, '0')}</h3>
          {shouldShow('zoneId') && <p className="text-white/50 text-xs">Currently in {robot.zoneId}</p>}
        </div>
        {shouldShow('status') && (
          <div className={`px-2 py-0.5 rounded-full text-xs ${
            robot.status === 'active' ? 'bg-green-500/20 text-green-500' : 
            robot.status === 'charging' ? 'bg-blue-500/20 text-blue-500' :
            robot.status === 'maintenance' ? 'bg-red-500/20 text-red-500' : 
            'bg-yellow-500/20 text-yellow-500'
          }`}>
            {robot.status === 'active' ? 'Operational' : robot.status}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        {shouldShow('currentTask') && (
          <div>
            <p className="text-xs text-white/50">Task</p>
            <p className="text-white/90">{robot.currentTask || 'None'}</p>
          </div>
        )}
        
        {shouldShow('batteryLevel') && (
          <div>
            <p className="text-xs text-white/50">Battery</p>
            <p className="text-white/90">{robot.batteryLevel}%</p>
          </div>
        )}
        
        {shouldShow('currentTool') && (
          <div>
            <p className="text-xs text-white/50">Tool</p>
            <p className="text-white/90">{robot.currentTool}</p>
          </div>
        )}
        
        {shouldShow('efficiency') && (
          <div>
            <p className="text-xs text-white/50">Efficiency</p>
            <p className="text-white/90">{robot.efficiency}%</p>
          </div>
        )}
      </div>
      
      {shouldShow('coordinates') && (
        <div className="flex gap-2 text-xs">
          <div className="glass px-2 py-0.5 rounded text-white/70">X: {robot.coordinates.x}m</div>
          <div className="glass px-2 py-0.5 rounded text-white/70">Y: {robot.coordinates.y}m</div>
        </div>
      )}
    </div>
  );
}

function ZoneInfoDisplay({ zone }: { zone: any }) {
  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-display text-base text-white/90">{zone.name}</h3>
          <p className="text-white/50 text-xs">{zone.priority} priority</p>
        </div>
        <div className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
          {zone.robotCount} AMRs
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-white/50">Pending</p>
          <p className="text-white/90">{zone.tasksPending}</p>
        </div>
        <div>
          <p className="text-xs text-white/50">Completed</p>
          <p className="text-white/90">{zone.tasksCompleted}</p>
        </div>
        <div>
          <p className="text-xs text-white/50">Efficiency</p>
          <p className="text-white/90">{zone.efficiency}%</p>
        </div>
        <div>
          <p className="text-xs text-white/50">Traffic</p>
          <p className="text-white/90">{zone.trafficDensity}</p>
        </div>
      </div>
    </div>
  );
}

function MultiRobotDisplay({ robots, metadata }: { robots: any[], metadata?: any }) {
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
        {robots.slice(0, 5).map((robot) => (
          <div key={robot.id} className="glass p-2 rounded-lg">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">AMR {String(robot.id).padStart(2, '0')}</h4>
              <div className={`px-2 py-0.5 rounded-full text-xs 
                ${robot.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                 robot.status === 'charging' ? 'bg-blue-500/20 text-blue-400' :
                 robot.status === 'maintenance' ? 'bg-red-500/20 text-red-400' : 
                 'bg-yellow-500/20 text-yellow-400'}`}>
                {robot.status}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1 text-xs">
              <div>
                <p className="text-white/50">Zone</p>
                <p className="text-white/90">{robot.zoneId}</p>
              </div>
              <div>
                <p className="text-white/50">Battery</p>
                <p className="text-white/90">{robot.batteryLevel}%</p>
              </div>
              <div>
                <p className="text-white/50">Tool</p>
                <p className="text-white/90">{robot.currentTool.split(' ')[0]}</p>
              </div>
              <div>
                <p className="text-white/50">Eff.</p>
                <p className="text-white/90">{robot.efficiency}%</p>
              </div>
            </div>
          </div>
        ))}
        
        {robots.length > 5 && (
          <p className="text-white/50 text-center text-xs mt-1">
            +{robots.length - 5} more AMRs
          </p>
        )}
      </div>
      
      {metadata?.chartData && (
        <div className="mt-3 p-2 glass rounded-lg">
          <h4 className="text-xs font-medium text-white/70 mb-1">By {metadata.metricName || 'Status'}</h4>
          <div className="flex flex-col gap-2">
            {Object.entries(metadata.chartData).map(([key, value]: [string, any]) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-white/70">{key}</span>
                  <span className="text-white/90">{value}</span>
                </div>
                <div className="h-1 rounded-full bg-white/10 relative overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-primary to-secondary" 
                    style={{ width: `${(value / robots.length) * 100}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MultiZoneDisplay({ zones, metadata }: { zones: any[], metadata?: any }) {
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
        {zones.map((zone) => (
          <div key={zone.id} className="glass p-2 rounded-lg">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">{zone.name}</h4>
              <div className={`px-2 py-0.5 rounded-full text-xs 
                ${zone.priority === 'high' ? 'bg-red-500/20 text-red-400' : 
                 zone.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                 'bg-green-500/20 text-green-400'}`}>
                {zone.priority}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1 text-xs">
              <div>
                <p className="text-white/50">AMRs</p>
                <p className="text-white/90">{zone.robotCount}</p>
              </div>
              <div>
                <p className="text-white/50">Tasks</p>
                <p className="text-white/90">{zone.tasksPending}</p>
              </div>
              <div>
                <p className="text-white/50">Done</p>
                <p className="text-white/90">{zone.tasksCompleted}</p>
              </div>
              <div>
                <p className="text-white/50">Eff.</p>
                <p className="text-white/90">{zone.efficiency}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {metadata?.secondaryData && (
        <div className="mt-3 p-2 glass rounded-lg">
          <h4 className="text-xs font-medium text-white/70 mb-1">Analysis</h4>
          <ul className="text-white/80 space-y-1 text-xs">
            {Array.isArray(metadata.secondaryData) && metadata.secondaryData.slice(0, 3).map((item: string, index: number) => (
              <li key={index} className="flex items-start gap-1.5">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function OverviewDisplay({ overview, metadata }: { overview: any, metadata?: any }) {
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="glass p-2 rounded-lg">
          <p className="text-xs text-white/50">Active AMRs</p>
          <div className="flex items-baseline gap-1">
            <p className="text-base font-medium text-white/90">{overview.activeRobots}</p>
            <p className="text-white/50 text-xs">/ {overview.totalRobots}</p>
          </div>
          <div className="h-1 rounded-full bg-white/10 relative overflow-hidden mt-1">
            <div 
              className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-green-400 to-green-500" 
              style={{ width: `${(overview.activeRobots / overview.totalRobots) * 100}%` }} 
            />
          </div>
        </div>
        
        <div className="glass p-2 rounded-lg">
          <p className="text-xs text-white/50">Tasks Completed</p>
          <div className="flex items-baseline gap-1">
            <p className="text-base font-medium text-white/90">{overview.tasksCompleted}</p>
          </div>
        </div>
      </div>
      
      <div className="glass p-2 rounded-lg mb-3">
        <p className="text-xs text-white/50">Overall Efficiency</p>
        <div className="flex justify-between items-center mt-1">
          <p className="text-base font-medium text-white/90">{overview.robotEfficiency}%</p>
          <div className={`px-2 py-0.5 rounded-full text-xs 
            ${overview.robotEfficiency > 80 ? 'bg-green-500/20 text-green-400' : 
            overview.robotEfficiency > 60 ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'}`}>
            {overview.robotEfficiency > 80 ? 'Excellent' : 
            overview.robotEfficiency > 60 ? 'Good' : 
            overview.robotEfficiency > 40 ? 'Average' : 'Needs Improvement'}
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 relative overflow-hidden mt-1">
          <div 
            className={`absolute top-0 left-0 h-full rounded-full ${
              overview.robotEfficiency > 80 ? 'bg-gradient-to-r from-green-400 to-green-500' : 
              overview.robotEfficiency > 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
              'bg-gradient-to-r from-red-400 to-red-500'
            }`}
            style={{ width: `${overview.robotEfficiency}%` }} 
          />
        </div>
      </div>
      
      {metadata?.secondaryData && (
        <div className="glass p-2 rounded-lg">
          <h4 className="text-xs font-medium text-white/70 mb-1">Key Insights</h4>
          <ul className="text-white/80 space-y-1 text-xs">
            {Array.isArray(metadata.secondaryData) ? 
              metadata.secondaryData.slice(0, 3).map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              )) : 
              Object.entries(metadata.secondaryData).slice(0, 3).map(([key, value]: [string, any]) => (
                <li key={key} className="flex items-start gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span>{key}: {value}</span>
                </li>
              ))
            }
          </ul>
        </div>
      )}
    </div>
  );
}

function ComparisonDisplay({ data, metadata }: { data: any, metadata?: any }) {
  // If we don't have the right metadata for comparison, show error
  if (!metadata?.comparisonType || !metadata?.metricName) {
    return <ErrorDisplay />;
  }
  
  return (
    <div className="flex flex-col">
      <div className="glass p-2 rounded-lg">
        <h4 className="text-xs font-medium text-white/70 mb-1">{metadata.comparisonType} by {metadata.metricName}</h4>
        
        {Array.isArray(data) && (
          <div className="flex flex-col gap-2">
            {data.slice(0, 5).map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5">
                    <p className="text-xs text-white/80">
                      {metadata.comparisonType === 'Robot' ? `AMR ${String(item.id).padStart(2, '0')}` : item.name}
                    </p>
                    <p className="text-white/90 text-xs">
                      {typeof item[metadata.metricName.toLowerCase()] === 'number' ? 
                        `${item[metadata.metricName.toLowerCase()]}${metadata.metricName.toLowerCase().includes('level') || metadata.metricName.toLowerCase().includes('efficiency') ? '%' : ''}` : 
                        item[metadata.metricName.toLowerCase()]}
                    </p>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 relative overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-primary to-secondary" 
                      style={{ 
                        width: `${(item[metadata.metricName.toLowerCase()] / Math.max(...data.map((i: any) => i[metadata.metricName.toLowerCase()]))) * 100}%` 
                      }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {metadata?.chartData && (
          <div className="mt-2">
            <div className="flex flex-col gap-2">
              {Object.entries(metadata.chartData).slice(0, 5).map(([key, value]: [string, any]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-white/70">{key}</span>
                    <span className="text-white/90">{value}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 relative overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-primary to-secondary" 
                      style={{ width: `${(Number(value) / Math.max(...Object.values(metadata.chartData).map(v => Number(v)))) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorDisplay() {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="text-white/30 text-2xl mb-2">
        <i className="ri-search-line"></i>
      </div>
      <p className="text-white/70 text-center text-sm max-w-md">
        No specific information available for this query.
      </p>
    </div>
  );
}