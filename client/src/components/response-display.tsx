import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bot } from "lucide-react";
import { useWarehouse } from "@/context/warehouse-context";

export default function ResponseDisplay() {
  const { queryResponse, resetQueryResponse } = useWarehouse();

  return (
    <motion.div
      className="glass rounded-3xl p-6 relative overflow-hidden h-fit min-h-[300px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex justify-between items-start mb-4">
        <h2 className="font-display text-xl font-medium text-white/90">AI Assistant Response</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white/60 hover:text-white flex items-center gap-1.5 bg-white/5 hover:bg-white/10"
          onClick={resetQueryResponse}
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>
      
      {!queryResponse ? (
        <EmptyState />
      ) : (
        <ResponseContent />
      )}

      {/* Decorative element */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-gradient-to-r from-primary/30 to-secondary/20 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div 
      className="flex flex-col justify-center items-center h-52 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.3 }}
    >
      <div className="text-white/30 text-5xl mb-4">
        <Bot />
      </div>
      <p className="text-white/50 max-w-md">
        Ask a question about warehouse operations or AMR status to see information here
      </p>
    </motion.div>
  );
}

function ResponseContent() {
  const { queryResponse } = useWarehouse();
  
  if (!queryResponse) return null;
  
  return (
    <motion.div
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
          <p className="text-white/50 text-sm">Found relevant information</p>
        </div>
      </div>
      
      <div className="glass-dark rounded-2xl p-5">
        {queryResponse.type === 'robot' && queryResponse.data && (
          <RobotInfoDisplay robot={queryResponse.data} />
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

function RobotInfoDisplay({ robot }: { robot: any }) {
  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-display text-lg text-white/90">AMR {String(robot.id).padStart(2, '0')} Status</h3>
          <p className="text-white/50 text-sm">Currently Active in {robot.zoneId}</p>
        </div>
        <div className="bg-green-500/20 text-green-500 px-2 py-1 rounded-full text-xs">
          {robot.status === 'active' ? 'Operational' : robot.status}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-white/50">Current Task</p>
          <p className="text-white/90">{robot.currentTask}</p>
        </div>
        <div>
          <p className="text-xs text-white/50">Battery Level</p>
          <p className="text-white/90">{robot.batteryLevel}%</p>
        </div>
        <div>
          <p className="text-xs text-white/50">Current Tool</p>
          <p className="text-white/90">{robot.currentTool}</p>
        </div>
        <div>
          <p className="text-xs text-white/50">Efficiency</p>
          <p className="text-white/90">{robot.efficiency}%</p>
        </div>
      </div>
      
      <div className="mt-2">
        <p className="text-xs text-white/50 mb-1">Coordinates</p>
        <div className="flex flex-wrap gap-3">
          <div className="glass px-2 py-1 rounded text-sm flex-shrink-0">X: {robot.coordinates.x}m</div>
          <div className="glass px-2 py-1 rounded text-sm flex-shrink-0">Y: {robot.coordinates.y}m</div>
        </div>
      </div>
    </div>
  );
}

function ZoneInfoDisplay({ zone }: { zone: any }) {
  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-display text-lg text-white/90">{zone.name} Status</h3>
          <p className="text-white/50 text-sm">{zone.priority === 'high' ? 'High' : zone.priority === 'medium' ? 'Medium' : 'Low'} Priority Zone</p>
        </div>
        <div className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs">
          {zone.robotCount} AMRs Active
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-white/50">Tasks Pending</p>
          <p className="text-white/90">{zone.tasksPending}</p>
        </div>
        <div>
          <p className="text-xs text-white/50">Tasks Completed</p>
          <p className="text-white/90">{zone.tasksCompleted} Today</p>
        </div>
        <div>
          <p className="text-xs text-white/50">Zone Efficiency</p>
          <p className="text-white/90">{zone.efficiency}%</p>
        </div>
        <div>
          <p className="text-xs text-white/50">Traffic Density</p>
          <p className="text-white/90">{zone.trafficDensity === 'high' ? 'High' : zone.trafficDensity === 'medium' ? 'Medium' : 'Low'}</p>
        </div>
      </div>
    </div>
  );
}

function MultiRobotDisplay({ robots, metadata }: { robots: any[], metadata?: any }) {
  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-display text-lg text-white/90">Multiple AMRs</h3>
          <p className="text-white/50 text-sm">{robots.length} AMRs found</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar">
        {robots.slice(0, 5).map((robot, index) => (
          <div key={robot.id} className="glass p-3 rounded-xl">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">AMR {String(robot.id).padStart(2, '0')}</h4>
              <div className={`px-2 py-1 rounded-full text-xs 
                ${robot.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                 robot.status === 'charging' ? 'bg-blue-500/20 text-blue-400' :
                 robot.status === 'maintenance' ? 'bg-red-500/20 text-red-400' : 
                 'bg-yellow-500/20 text-yellow-400'}`}>
                {robot.status}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>
                <p className="text-xs text-white/50">Zone</p>
                <p className="text-white/90">{robot.zoneId}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Battery</p>
                <p className="text-white/90">{robot.batteryLevel}%</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Tool</p>
                <p className="text-white/90">{robot.currentTool}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Efficiency</p>
                <p className="text-white/90">{robot.efficiency}%</p>
              </div>
            </div>
          </div>
        ))}
        
        {robots.length > 5 && (
          <p className="text-white/50 text-center text-sm">
            +{robots.length - 5} more AMRs not shown
          </p>
        )}
      </div>
      
      {metadata?.chartData && (
        <div className="mt-4 p-3 glass rounded-xl">
          <h4 className="font-medium text-white/70 mb-2">Distribution by {metadata.metricName || 'Status'}</h4>
          <div className="flex justify-between items-center gap-3">
            {Object.entries(metadata.chartData).map(([key, value]: [string, any]) => (
              <div key={key} className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/70">{key}</span>
                  <span className="text-white/90">{value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 relative overflow-hidden">
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
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-display text-lg text-white/90">Zone Summary</h3>
          <p className="text-white/50 text-sm">{zones.length} zones analyzed</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar">
        {zones.map((zone) => (
          <div key={zone.id} className="glass p-3 rounded-xl">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">{zone.name}</h4>
              <div className={`px-2 py-1 rounded-full text-xs 
                ${zone.priority === 'high' ? 'bg-red-500/20 text-red-400' : 
                 zone.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                 'bg-green-500/20 text-green-400'}`}>
                {zone.priority} priority
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>
                <p className="text-xs text-white/50">Robots</p>
                <p className="text-white/90">{zone.robotCount}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Tasks</p>
                <p className="text-white/90">{zone.tasksPending} pending</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Completed</p>
                <p className="text-white/90">{zone.tasksCompleted}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Efficiency</p>
                <p className="text-white/90">{zone.efficiency}%</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-white/50 mb-1">Traffic Density</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-white/10 relative overflow-hidden">
                  <div 
                    className={`absolute top-0 left-0 h-full rounded-full ${
                      zone.trafficDensity === 'high' ? 'bg-red-500' : 
                      zone.trafficDensity === 'medium' ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                    style={{ width: zone.trafficDensity === 'high' ? '100%' : zone.trafficDensity === 'medium' ? '66%' : '33%' }}
                  />
                </div>
                <span className="text-xs text-white/70">{zone.trafficDensity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {metadata?.chartData && (
        <div className="mt-4 p-3 glass rounded-xl">
          <h4 className="font-medium text-white/70 mb-2">Comparison by {metadata.metricName || 'Metric'}</h4>
          <div className="flex flex-col gap-3">
            {Object.entries(metadata.chartData).map(([key, value]: [string, any]) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/70">{key}</span>
                  <span className="text-white/90">{value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 relative overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-primary to-secondary" 
                    style={{ width: `${(value / Math.max(...Object.values(metadata.chartData) as number[])) * 100}%` }} 
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

function OverviewDisplay({ overview, metadata }: { overview: any, metadata?: any }) {
  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <h3 className="font-display text-lg text-white/90">Warehouse Overview</h3>
        <p className="text-white/50 text-sm">Current operational status</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="glass p-3 rounded-xl">
          <p className="text-xs text-white/50">Active AMRs</p>
          <div className="flex items-baseline gap-1">
            <p className="text-xl font-medium text-white/90">{overview.activeRobots}</p>
            <p className="text-white/50">/ {overview.totalRobots}</p>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 relative overflow-hidden mt-2">
            <div 
              className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-green-400 to-green-500" 
              style={{ width: `${(overview.activeRobots / overview.totalRobots) * 100}%` }} 
            />
          </div>
        </div>
        
        <div className="glass p-3 rounded-xl">
          <p className="text-xs text-white/50">Tasks Completed</p>
          <div className="flex items-baseline gap-1">
            <p className="text-xl font-medium text-white/90">{overview.tasksCompleted}</p>
            <p className="text-white/50">total today</p>
          </div>
        </div>
        
        <div className="glass p-3 rounded-xl col-span-2">
          <p className="text-xs text-white/50">Overall Efficiency</p>
          <div className="flex justify-between items-center mt-1">
            <p className="text-lg font-medium text-white/90">{overview.robotEfficiency}%</p>
            <div className={`px-2 py-1 rounded-full text-xs 
              ${overview.robotEfficiency > 80 ? 'bg-green-500/20 text-green-400' : 
               overview.robotEfficiency > 60 ? 'bg-yellow-500/20 text-yellow-400' :
               'bg-red-500/20 text-red-400'}`}>
              {overview.robotEfficiency > 80 ? 'Excellent' : 
               overview.robotEfficiency > 60 ? 'Good' : 
               overview.robotEfficiency > 40 ? 'Average' : 'Needs Improvement'}
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 relative overflow-hidden mt-2">
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
      </div>
      
      {metadata?.secondaryData && (
        <div className="glass p-3 rounded-xl">
          <h4 className="font-medium text-white/70 mb-2">Key Insights</h4>
          <ul className="text-white/80 space-y-2 text-sm">
            {Array.isArray(metadata.secondaryData) ? (
              metadata.secondaryData.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))
            ) : (
              Object.entries(metadata.secondaryData).map(([key, value]: [string, any]) => (
                <li key={key} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span>{key}: {value}</span>
                </li>
              ))
            )}
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
      <div className="mb-4">
        <h3 className="font-display text-lg text-white/90">{metadata.comparisonType} Comparison</h3>
        <p className="text-white/50 text-sm">Comparing by {metadata.metricName}</p>
      </div>
      
      {Array.isArray(data) && (
        <div className="glass p-3 rounded-xl">
          <div className="flex flex-col gap-3">
            {data.slice(0, 5).map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <p className="font-medium text-white/80">
                      {metadata.comparisonType === 'Robot' ? `AMR ${String(item.id).padStart(2, '0')}` : item.name}
                    </p>
                    <p className="text-white/90 text-sm">
                      {typeof item[metadata.metricName] === 'number' ? `${item[metadata.metricName]}${metadata.metricName.includes('Level') || metadata.metricName.includes('efficiency') ? '%' : ''}` : item[metadata.metricName]}
                    </p>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 relative overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-primary to-secondary" 
                      style={{ 
                        width: `${(item[metadata.metricName] / Math.max(...data.map((i: any) => i[metadata.metricName]))) * 100}%` 
                      }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {data.length > 5 && (
            <p className="text-white/50 text-center text-sm mt-3">
              +{data.length - 5} more items not shown
            </p>
          )}
        </div>
      )}
      
      {metadata?.chartData && (
        <div className="mt-4 p-3 glass rounded-xl">
          <h4 className="font-medium text-white/70 mb-2">Distribution</h4>
          <div className="flex justify-between items-center gap-3">
            {Object.entries(metadata.chartData).map(([key, value]: [string, any]) => (
              <div key={key} className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/70">{key}</span>
                  <span className="text-white/90">{value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 relative overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-primary to-secondary" 
                    style={{ width: `${(value / (Array.isArray(data) ? data.length : Object.keys(data).length)) * 100}%` }} 
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

function ErrorDisplay() {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="text-white/30 text-4xl mb-4">
        <i className="ri-search-line"></i>
      </div>
      <p className="text-white/70 text-center max-w-md">
        I'm sorry, I don't have specific information on that query. Please try asking about AMR locations, zone activities, or warehouse operations.
      </p>
    </div>
  );
}
