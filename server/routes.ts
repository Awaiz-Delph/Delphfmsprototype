import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { warehouseData } from "./warehouse-data";
import { handleAIQuery } from "./ai-service";
import { openAIService } from "./openai-service";
import { perplexityService } from "./perplexity-service";
import { User, insertUserSchema } from "@shared/schema";
import { UserRole, PERMISSIONS } from "@shared/types";
import { z } from "zod";
import { setupAuth } from "./auth";

// Helper middleware to check permissions
function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const userId = (req.user as User).id;
    const permissions = await storage.getUserPermissions(userId);
    
    if (permissions.includes(permission)) {
      return next();
    }
    
    return res.status(403).json({ 
      error: "Forbidden", 
      message: `Missing required permission: ${permission}` 
    });
  };
}

// Helper middleware to check roles
function requireRole(role: UserRole) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const userRole = (req.user as User).role as UserRole;
    const ROLE_HIERARCHY: Record<UserRole, number> = {
      'admin': 5,
      'manager': 4,
      'maintenance': 3,
      'operator': 2,
      'viewer': 1,
    };
    
    if (ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role]) {
      return next();
    }
    
    return res.status(403).json({ 
      error: "Forbidden", 
      message: `Required role: ${role}` 
    });
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure admin user exists for demo purposes
  await storage.initializeAdminUser();
  console.log("Admin user initialized - use username: admin, password: admin123");
  
  // Setup authentication
  setupAuth(app);
  
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // Send initial data to the client
    ws.send(JSON.stringify({ type: 'robots', payload: warehouseData.robots }));
    ws.send(JSON.stringify({ type: 'zones', payload: warehouseData.zones }));
    ws.send(JSON.stringify({ type: 'activities', payload: warehouseData.activities }));
    ws.send(JSON.stringify({ type: 'overview', payload: warehouseData.overview }));
    
    // Periodically send updated data (simulating real-time updates)
    const intervalId = setInterval(() => {
      // Only send if the connection is still open
      if (ws.readyState === WebSocket.OPEN) {
        // Simulate robot movement
        warehouseData.updateRobotPositions();
        ws.send(JSON.stringify({ type: 'robots', payload: warehouseData.robots }));
        
        // Occasionally add a new activity
        if (Math.random() > 0.7) {
          const newActivity = warehouseData.generateRandomActivity();
          warehouseData.activities.unshift(newActivity);
          
          // Keep only the latest 20 activities
          if (warehouseData.activities.length > 20) {
            warehouseData.activities.pop();
          }
          
          ws.send(JSON.stringify({ type: 'activities', payload: warehouseData.activities }));
        }
      }
    }, 5000);
    
    // Clean up on connection close
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      clearInterval(intervalId);
    });
  });
  
  // API Routes - prefixed with /api
  
  // ===== User and Permission Management Routes =====
  
  // Get current user info with permissions
  app.get("/api/me", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const user = await storage.getUserWithPermissions((req.user as User).id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Don't return the password
    const { password, ...userWithoutPassword } = user as any;
    res.json(userWithoutPassword);
  });
  
  // Get all users (admin or manager only)
  app.get("/api/users", requireRole("manager"), async (_req, res) => {
    const users = await storage.getAllUsers();
    
    // Don't return passwords
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user as any;
      return userWithoutPassword;
    });
    
    res.json(usersWithoutPasswords);
  });
  
  // Get specific user by ID (admin or manager only)
  app.get("/api/users/:id", requireRole("manager"), async (req, res) => {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Don't return the password
    const { password, ...userWithoutPassword } = user as any;
    res.json(userWithoutPassword);
  });
  
  // Create new user (admin only)
  app.post("/api/users", requirePermission(PERMISSIONS.USER_CREATE), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Add activity for audit
      await storage.addActivity({
        id: Date.now(),
        type: 'user',
        iconName: 'user-plus',
        message: `New user ${user.username} (${user.role}) was created`,
        timestamp: new Date()
      });
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user as any;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });
  
  // Update user (admin for any user, or users can update their own details)
  app.patch("/api/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    const currentUser = req.user as User;
    
    // Check permissions - users can update themselves, admins can update anyone
    if (userId !== currentUser.id) {
      if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Managers can't update admins
      if (currentUser.role === 'manager') {
        const targetUser = await storage.getUser(userId);
        if (targetUser?.role === 'admin') {
          return res.status(403).json({ error: "Managers cannot update admin accounts" });
        }
      }
    }
    
    // Don't allow role changes unless admin
    if (req.body.role && currentUser.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can change user roles" });
    }
    
    try {
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Add activity for audit
      await storage.addActivity({
        id: Date.now(),
        type: 'user',
        iconName: 'user-cog',
        message: `User ${updatedUser.username} was updated`,
        timestamp: new Date()
      });
      
      // Don't return the password
      const { password, ...userWithoutPassword } = updatedUser as any;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  
  // Delete user (admin only)
  app.delete("/api/users/:id", requirePermission(PERMISSIONS.USER_DELETE), async (req, res) => {
    const userId = parseInt(req.params.id);
    const currentUser = req.user as User;
    
    // Don't allow self-deletion
    if (userId === currentUser.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    
    // Check if user exists first
    const userToDelete = await storage.getUser(userId);
    if (!userToDelete) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const success = await storage.deleteUser(userId);
    if (success) {
      res.status(204).send();
    } else {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
  
  // Get user permissions
  app.get("/api/users/:id/permissions", async (req, res) => {
    const userId = parseInt(req.params.id);
    const currentUser = req.user as User;
    
    // Users can view their own permissions, admin/managers can view anyone's
    if (userId !== currentUser.id && 
        currentUser.role !== 'admin' && 
        currentUser.role !== 'manager') {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const userExists = await storage.getUser(userId);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const permissions = await storage.getUserPermissions(userId);
    res.json({ permissions });
  });
  
  // Set user permission (admin only)
  app.post("/api/users/:id/permissions", requireRole("admin"), async (req, res) => {
    const userId = parseInt(req.params.id);
    const { permissionId, hasPermission } = req.body;
    
    if (typeof permissionId !== 'number' || typeof hasPermission !== 'boolean') {
      return res.status(400).json({ error: "Invalid permission data" });
    }
    
    const userExists = await storage.getUser(userId);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }
    
    try {
      const userPermission = await storage.setUserPermission(userId, permissionId, hasPermission);
      
      // Add activity for audit
      await storage.addActivity({
        id: Date.now(),
        type: 'user',
        iconName: 'shield',
        message: `Permission ${permissionId} ${hasPermission ? 'granted to' : 'revoked from'} user ${userId}`,
        timestamp: new Date()
      });
      
      res.json(userPermission);
    } catch (error) {
      console.error("Error setting user permission:", error);
      res.status(500).json({ error: "Failed to set user permission" });
    }
  });
  
  // Get all available permissions (admin or manager only)
  app.get("/api/permissions", requireRole("manager"), async (_req, res) => {
    const permissions = await storage.getPermissions();
    res.json(permissions);
  });
  
  // Get all robots
  app.get('/api/robots', (req, res) => {
    res.json(warehouseData.robots);
  });
  
  // Get a specific robot by ID
  app.get('/api/robots/:id', (req, res) => {
    const robotId = parseInt(req.params.id);
    const robot = warehouseData.robots.find(r => r.id === robotId);
    
    if (robot) {
      res.json(robot);
    } else {
      res.status(404).json({ message: 'Robot not found' });
    }
  });
  
  // Get all zones
  app.get('/api/zones', (req, res) => {
    res.json(warehouseData.zones);
  });
  
  // Get a specific zone by ID
  app.get('/api/zones/:id', (req, res) => {
    const zoneId = req.params.id;
    const zone = warehouseData.zones.find(z => z.id === zoneId);
    
    if (zone) {
      res.json(zone);
    } else {
      res.status(404).json({ message: 'Zone not found' });
    }
  });
  
  // Get recent activities
  app.get('/api/activities', (req, res) => {
    res.json(warehouseData.activities);
  });
  
  // Get warehouse overview
  app.get('/api/overview', (req, res) => {
    res.json(warehouseData.overview);
  });
  
  // Process AI query
  app.post('/api/query', async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: 'Query is required' });
      }
      
      const aiResponse = await handleAIQuery(query, warehouseData);
      res.json(aiResponse);
    } catch (error) {
      console.error('Error processing query:', error);
      res.status(500).json({ message: 'Error processing query' });
    }
  });
  
  // Get AI optimization suggestions for the warehouse
  app.get('/api/optimizations', async (req, res) => {
    try {
      try {
        // First try using OpenAI
        const suggestions = await openAIService.generateOptimizationSuggestions(warehouseData);
        res.json({ suggestions });
      } catch (openAIError) {
        console.error('Error using OpenAI for optimization suggestions, trying Perplexity:', openAIError);
        
        // Fallback to Perplexity
        const suggestions = await perplexityService.generateOptimizationSuggestions(warehouseData);
        res.json({ suggestions });
      }
    } catch (error) {
      console.error('Error generating optimization suggestions:', error);
      res.status(500).json({ 
        message: 'Error generating optimization suggestions',
        suggestions: []
      });
    }
  });

  // ===== Historical Data Analytics Routes =====
  
  // Get efficiency trends
  app.get('/api/analytics/efficiency', requirePermission(PERMISSIONS.ANALYTICS_VIEW), async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const efficiencyData = await storage.getEfficiencyTrends(days);
      res.json(efficiencyData);
    } catch (error) {
      console.error('Error fetching efficiency trends:', error);
      res.status(500).json({ message: 'Error fetching efficiency trends' });
    }
  });
  
  // Get robot performance comparison
  app.get('/api/analytics/robots/performance', requirePermission(PERMISSIONS.ANALYTICS_VIEW), async (req, res) => {
    try {
      const performanceData = await storage.getRobotPerformanceComparison();
      res.json(performanceData);
    } catch (error) {
      console.error('Error fetching robot performance:', error);
      res.status(500).json({ message: 'Error fetching robot performance' });
    }
  });
  
  // Get zone activity heatmap
  app.get('/api/analytics/zones/activity', requirePermission(PERMISSIONS.ANALYTICS_VIEW), async (req, res) => {
    try {
      const activityData = await storage.getZoneActivityHeatmap();
      res.json(activityData);
    } catch (error) {
      console.error('Error fetching zone activity:', error);
      res.status(500).json({ message: 'Error fetching zone activity' });
    }
  });
  
  // Get peak activity times
  app.get('/api/analytics/peak-times', requirePermission(PERMISSIONS.ANALYTICS_VIEW), async (req, res) => {
    try {
      const peakTimes = await storage.getPeakActivityTimes();
      res.json(peakTimes);
    } catch (error) {
      console.error('Error fetching peak activity times:', error);
      res.status(500).json({ message: 'Error fetching peak activity times' });
    }
  });
  
  // Get battery trends
  app.get('/api/analytics/battery', requirePermission(PERMISSIONS.ANALYTICS_VIEW), async (req, res) => {
    try {
      const robotId = req.query.robotId ? parseInt(req.query.robotId as string) : undefined;
      const batteryData = await storage.getBatteryTrends(robotId);
      res.json(batteryData);
    } catch (error) {
      console.error('Error fetching battery trends:', error);
      res.status(500).json({ message: 'Error fetching battery trends' });
    }
  });
  
  // Get robot historical data
  app.get('/api/analytics/robots/:id/history', requirePermission(PERMISSIONS.ANALYTICS_VIEW), async (req, res) => {
    try {
      const robotId = parseInt(req.params.id);
      const startDate = req.query.start ? new Date(req.query.start as string) : undefined;
      const endDate = req.query.end ? new Date(req.query.end as string) : undefined;
      
      const historyData = await storage.getRobotHistoricalData(robotId, startDate, endDate);
      res.json(historyData);
    } catch (error) {
      console.error('Error fetching robot history:', error);
      res.status(500).json({ message: 'Error fetching robot history' });
    }
  });
  
  // Get zone historical data
  app.get('/api/analytics/zones/:id/history', requirePermission(PERMISSIONS.ANALYTICS_VIEW), async (req, res) => {
    try {
      const zoneId = req.params.id;
      const startDate = req.query.start ? new Date(req.query.start as string) : undefined;
      const endDate = req.query.end ? new Date(req.query.end as string) : undefined;
      
      const historyData = await storage.getZoneHistoricalData(zoneId, startDate, endDate);
      res.json(historyData);
    } catch (error) {
      console.error('Error fetching zone history:', error);
      res.status(500).json({ message: 'Error fetching zone history' });
    }
  });
  
  // Get daily performance metrics
  app.get('/api/analytics/daily-metrics', requirePermission(PERMISSIONS.ANALYTICS_VIEW), async (req, res) => {
    try {
      const startDate = req.query.start ? new Date(req.query.start as string) : undefined;
      const endDate = req.query.end ? new Date(req.query.end as string) : undefined;
      
      const metricsData = await storage.getDailyPerformanceMetrics(startDate, endDate);
      res.json(metricsData);
    } catch (error) {
      console.error('Error fetching daily metrics:', error);
      res.status(500).json({ message: 'Error fetching daily metrics' });
    }
  });
  
  // Get tool usage statistics
  app.get('/api/analytics/tools', requirePermission(PERMISSIONS.ANALYTICS_VIEW), async (req, res) => {
    try {
      const toolType = req.query.type as string | undefined;
      const startDate = req.query.start ? new Date(req.query.start as string) : undefined;
      const endDate = req.query.end ? new Date(req.query.end as string) : undefined;
      
      const toolData = await storage.getToolUsageStats(toolType, startDate, endDate);
      res.json(toolData);
    } catch (error) {
      console.error('Error fetching tool usage data:', error);
      res.status(500).json({ message: 'Error fetching tool usage data' });
    }
  });
  
  // Add data collection endpoint for storing historical data
  app.post('/api/analytics/collect', async (req, res) => {
    try {
      const { type, data } = req.body;
      
      if (!type || !data) {
        return res.status(400).json({ message: 'Type and data are required' });
      }
      
      let result;
      
      switch (type) {
        case 'robot':
          result = await storage.addRobotHistoricalData(data);
          break;
        case 'zone':
          result = await storage.addZoneHistoricalData(data);
          break;
        case 'daily':
          result = await storage.addDailyPerformanceMetrics(data);
          break;
        case 'tool':
          result = await storage.addToolUsageStats(data);
          break;
        default:
          return res.status(400).json({ message: 'Invalid data type' });
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error collecting analytics data:', error);
      res.status(500).json({ message: 'Error collecting analytics data' });
    }
  });

  return httpServer;
}
