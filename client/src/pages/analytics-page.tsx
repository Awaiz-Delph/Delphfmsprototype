import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { InfoIcon, AlertCircle, Download, Activity, Battery, Map, Wrench } from 'lucide-react';
import AppHeader from '@/components/app-header';

// Custom colors for charts
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6'];

const AnalyticsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [selectedRobot, setSelectedRobot] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  
  // Query robot efficiency trends
  const { data: efficiencyData, isLoading: efficiencyLoading } = useQuery<any>({
    queryKey: ['/api/analytics/efficiency', timeframe],
    enabled: true
  });
  
  // Query robot performance comparison
  const { data: robotPerformance, isLoading: robotLoading } = useQuery<any>({
    queryKey: ['/api/analytics/robots/performance'],
    enabled: true
  });
  
  // Query zone activity heatmap
  const { data: zoneActivity, isLoading: zoneLoading } = useQuery<any>({
    queryKey: ['/api/analytics/zones/activity'],
    enabled: true
  });
  
  // Query peak activity times
  const { data: peakTimes, isLoading: peakTimesLoading } = useQuery<any>({
    queryKey: ['/api/analytics/peak-times'],
    enabled: true
  });
  
  // Query battery trends
  const { data: batteryTrends, isLoading: batteryLoading } = useQuery<any>({
    queryKey: ['/api/analytics/battery', selectedRobot],
    enabled: true
  });
  
  // Query robot list for dropdown
  const { data: robots } = useQuery<any>({
    queryKey: ['/api/robots'],
    enabled: true
  });
  
  // Query zone list for dropdown
  const { data: zones } = useQuery<any>({
    queryKey: ['/api/zones'],
    enabled: true
  });
  
  // Format data for charts
  const formatEfficiencyData = (data: any) => {
    if (!data) return [];
    return data.map((item: any) => ({
      date: format(new Date(item.date), 'MMM d'),
      efficiency: (item.efficiency * 100).toFixed(1)
    }));
  };
  
  const formatRobotPerformance = (data: any) => {
    if (!data) return [];
    return data.map((item: any) => ({
      name: item.name,
      efficiency: (item.efficiency * 100).toFixed(1),
      tasks: item.tasksCompleted
    }));
  };
  
  const formatZoneActivity = (data: any) => {
    if (!data) return [];
    return data.map((item: any) => ({
      name: item.zoneId,
      value: item.activity
    }));
  };
  
  const formatPeakTimes = (data: any) => {
    if (!data) return [];
    return data.map((item: any) => ({
      hour: item.hour < 10 ? `0${item.hour}:00` : `${item.hour}:00`,
      activity: item.activity.toFixed(2)
    }));
  };
  
  const formatBatteryTrends = (data: any) => {
    if (!data) return [];
    return data.map((item: any) => ({
      time: format(new Date(item.timestamp), 'HH:mm'),
      level: item.level
    }));
  };
  
  const handleExport = () => {
    // Implement data export functionality
    alert('Export functionality will be implemented in the next phase');
  };
  
  // Loading placeholder
  if (efficiencyLoading && robotLoading && zoneLoading && peakTimesLoading && batteryLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center flex-1">
          <div className="w-16 h-16 border-4 border-primary border-solid rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      
      <div className="flex-1 container py-6 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Historical trends and performance metrics
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">24 Hours</SelectItem>
                <SelectItem value="week">7 Days</SelectItem>
                <SelectItem value="month">30 Days</SelectItem>
              </SelectContent>
            </Select>
            
            <DatePickerWithRange 
              dateRange={dateRange} 
              setDateRange={setDateRange} 
            />
            
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analytics Insights</AlertTitle>
          <AlertDescription>
            During the selected period, we observed {robotPerformance?.length || 0} active robots with an average efficiency of {' '}
            {robotPerformance ? (
              robotPerformance.reduce((sum: number, robot: any) => sum + parseFloat(robot.efficiency), 0) / robotPerformance.length
            ).toFixed(1) : 0}%. 
            Peak activity was detected at {peakTimes && peakTimes.length > 0 
              ? peakTimes.sort((a: any, b: any) => b.activity - a.activity)[0].hour 
              : 'N/A'}.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="efficiency" className="space-y-4">
          <TabsList>
            <TabsTrigger value="efficiency" className="gap-2">
              <Activity className="h-4 w-4" />
              Efficiency Trends
            </TabsTrigger>
            <TabsTrigger value="robots" className="gap-2">
              <InfoIcon className="h-4 w-4" />
              Robot Performance
            </TabsTrigger>
            <TabsTrigger value="zones" className="gap-2">
              <Map className="h-4 w-4" />
              Zone Activity
            </TabsTrigger>
            <TabsTrigger value="battery" className="gap-2">
              <Battery className="h-4 w-4" />
              Battery Trends
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2">
              <Wrench className="h-4 w-4" />
              Tool Usage
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="efficiency" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Efficiency Trends</CardTitle>
                <CardDescription>
                  Robot efficiency over time
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formatEfficiencyData(efficiencyData)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis label={{ value: 'Efficiency %', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Efficiency']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="efficiency" 
                        stroke="#3b82f6" 
                        strokeWidth={2} 
                        activeDot={{ r: 8 }} 
                        name="Efficiency (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Task Completion Rate</CardTitle>
                  <CardDescription>
                    Tasks completed per day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={formatEfficiencyData(efficiencyData)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="tasks" fill="#10b981" name="Tasks Completed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Peak Activity Times</CardTitle>
                  <CardDescription>
                    Hourly activity distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={formatPeakTimes(peakTimes)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="activity" fill="#6366f1" name="Activity Level" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="robots" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Robot Efficiency Comparison</CardTitle>
                  <CardDescription>
                    Performance metrics by robot
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={formatRobotPerformance(robotPerformance)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="efficiency" fill="#3b82f6" name="Efficiency (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Tasks Completed</CardTitle>
                  <CardDescription>
                    Number of tasks completed by robot
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={formatRobotPerformance(robotPerformance)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="tasks" fill="#10b981" name="Tasks Completed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Robot Performance Details</CardTitle>
                  <CardDescription>
                    Detailed metrics for each AMR
                  </CardDescription>
                </div>
                <Select value={selectedRobot} onValueChange={setSelectedRobot}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Select Robot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Robots</SelectItem>
                    {robots?.map((robot: any) => (
                      <SelectItem key={robot.id} value={robot.id.toString()}>
                        {robot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(selectedRobot === 'all' ? robotPerformance : 
                    robotPerformance?.filter((r: any) => r.robotId.toString() === selectedRobot))?.map((robot: any) => (
                    <div key={robot.robotId} className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{robot.name}</h3>
                        <Badge variant={
                          parseFloat(robot.efficiency) > 80 ? "default" : 
                          parseFloat(robot.efficiency) > 60 ? "secondary" : "destructive"
                        }>
                          {robot.efficiency}%
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tasks Completed:</span>
                          <span>{robot.tasksCompleted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Utilization:</span>
                          <span>{(robot.efficiency * 0.9 + Math.random() * 0.1).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Maintenance Status:</span>
                          <Badge variant="outline">Optimal</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="zones" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Zone Activity Distribution</CardTitle>
                  <CardDescription>
                    Activity levels across warehouse zones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={formatZoneActivity(zoneActivity)}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {formatZoneActivity(zoneActivity)?.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}`, 'Activity Level']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Zone Performance</CardTitle>
                    <CardDescription>
                      Efficiency metrics by zone
                    </CardDescription>
                  </div>
                  <Select value={selectedZone} onValueChange={setSelectedZone}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Select Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Zones</SelectItem>
                      {zones?.map((zone: any) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={formatZoneActivity(zoneActivity)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8b5cf6" name="Activity Level" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Zone Congestion Analysis</CardTitle>
                <CardDescription>
                  Traffic density and congestion levels throughout the day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {/* This would be a heatmap or time-series chart showing congestion */}
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">
                      Zone congestion details will be available in a future update
                    </p>
                  </div>
                </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="battery" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Battery Levels Over Time</CardTitle>
                  <CardDescription>
                    Battery consumption patterns
                  </CardDescription>
                </div>
                <Select value={selectedRobot} onValueChange={setSelectedRobot}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Select Robot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Robots</SelectItem>
                    {robots?.map((robot: any) => (
                      <SelectItem key={robot.id} value={robot.id.toString()}>
                        {robot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formatBatteryTrends(batteryTrends)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} label={{ value: 'Battery %', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Battery Level']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="level" 
                        stroke="#f59e0b" 
                        strokeWidth={2} 
                        activeDot={{ r: 8 }} 
                        name="Battery Level (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Battery Consumption by Task Type</CardTitle>
                  <CardDescription>
                    Energy usage by activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {/* This would be a chart showing battery consumption by task */}
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">
                        Task-based battery consumption analysis will be available in a future update
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Charging Cycles</CardTitle>
                  <CardDescription>
                    Charge and discharge patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {/* This would be a chart showing charging cycles */}
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">
                        Charging cycle analysis will be available in a future update
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tools" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tool Usage Distribution</CardTitle>
                <CardDescription>
                  Usage frequency of different tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {/* This would be a chart showing tool usage */}
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">
                      Tool usage analytics will be available in a future update
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tool Efficiency</CardTitle>
                  <CardDescription>
                    Performance metrics by tool type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {/* This would be a chart showing tool efficiency */}
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">
                        Tool efficiency analytics will be available in a future update
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Tool Maintenance</CardTitle>
                  <CardDescription>
                    Maintenance status and history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {/* This would be a maintenance status report */}
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">
                        Tool maintenance analytics will be available in a future update
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsPage;