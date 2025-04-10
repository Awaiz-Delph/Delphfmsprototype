import { 
  users, permissions, rolePermissions, userPermissions,
  robotHistoricalData, dailyPerformanceMetrics, zoneHistoricalData, toolUsageStats,
  type User, type InsertUser, type Permission, 
  type RolePermission, type UserPermission,
  type RobotHistoricalData, type InsertRobotHistoricalData,
  type DailyPerformanceMetrics, type InsertDailyPerformanceMetrics,
  type ZoneHistoricalData, type InsertZoneHistoricalData,
  type ToolUsageStats, type InsertToolUsageStats
} from "@shared/schema";
import { 
  Robot, Zone, Activity, WarehouseOverview, 
  UserWithPermissions, PERMISSIONS
} from "@shared/types";

// Extend the storage interface for warehouse data
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Permission management
  getUserWithPermissions(id: number): Promise<UserWithPermissions | undefined>;
  getPermissions(): Promise<Permission[]>;
  createPermission(name: string, description?: string): Promise<Permission>;
  assignRolePermission(role: string, permissionId: number): Promise<RolePermission>;
  removeRolePermission(role: string, permissionId: number): Promise<boolean>;
  setUserPermission(userId: number, permissionId: number, hasPermission: boolean): Promise<UserPermission>;
  getUserPermissions(userId: number): Promise<string[]>;
  
  // Warehouse-specific methods
  getAllRobots(): Promise<Robot[]>;
  getRobotById(id: number): Promise<Robot | undefined>;
  getAllZones(): Promise<Zone[]>;
  getZoneById(id: string): Promise<Zone | undefined>;
  getRecentActivities(limit: number): Promise<Activity[]>;
  getWarehouseOverview(): Promise<WarehouseOverview>;
  updateRobotPosition(id: number, x: number, y: number): Promise<Robot | undefined>;
  addActivity(activity: Activity): Promise<Activity>;
  
  // Historical data methods
  // Robot historical data
  addRobotHistoricalData(data: InsertRobotHistoricalData): Promise<RobotHistoricalData>;
  getRobotHistoricalData(robotId: number, startTime?: Date, endTime?: Date): Promise<RobotHistoricalData[]>;
  getRobotHistoryById(historyId: number): Promise<RobotHistoricalData | undefined>;
  
  // Daily performance metrics
  addDailyPerformanceMetrics(data: InsertDailyPerformanceMetrics): Promise<DailyPerformanceMetrics>;
  getDailyPerformanceMetrics(startDate?: Date, endDate?: Date): Promise<DailyPerformanceMetrics[]>;
  
  // Zone historical data
  addZoneHistoricalData(data: InsertZoneHistoricalData): Promise<ZoneHistoricalData>;
  getZoneHistoricalData(zoneId: string, startTime?: Date, endTime?: Date): Promise<ZoneHistoricalData[]>;
  
  // Tool usage statistics
  addToolUsageStats(data: InsertToolUsageStats): Promise<ToolUsageStats>;
  getToolUsageStats(toolType?: string, startDate?: Date, endDate?: Date): Promise<ToolUsageStats[]>;
  
  // Analytics methods
  getEfficiencyTrends(days: number): Promise<{ date: string; efficiency: number }[]>;
  getRobotPerformanceComparison(): Promise<{ robotId: number; name: string; efficiency: number; tasksCompleted: number }[]>;
  getZoneActivityHeatmap(): Promise<{ zoneId: string; activity: number }[]>;
  getPeakActivityTimes(): Promise<{ hour: number; activity: number }[]>;
  getBatteryTrends(robotId?: number): Promise<{ timestamp: string; level: number }[]>;
  
  // Session management
  sessionStore: any; // Session store from express-session
}

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private robots: Map<number, Robot>;
  private zones: Map<string, Zone>;
  private activities: Activity[];
  private overview: WarehouseOverview;
  
  // User permissions 
  private permissionsList: Map<number, Permission>;
  private rolePermissionsList: Map<string, Set<number>>;
  private userPermissionsList: Map<number, Map<number, boolean>>;
  
  // Historical data
  private robotHistoryData: Map<number, RobotHistoricalData[]>;
  private dailyMetrics: Map<string, DailyPerformanceMetrics>;
  private zoneHistoryData: Map<string, ZoneHistoricalData[]>;
  private toolUsageData: ToolUsageStats[];
  
  // Session store for authentication
  sessionStore: any;
  
  // ID counters
  currentId: number;
  currentPermissionId: number;
  currentPermissionMappingId: number;
  currentHistoryId: number;

  constructor() {
    // Initialize collections
    this.users = new Map();
    this.robots = new Map();
    this.zones = new Map();
    this.activities = [];
    this.overview = {
      activeRobots: 0,
      totalRobots: 0,
      tasksCompleted: 0,
      robotEfficiency: 0,
      robotUtilization: 0,
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
    };
    
    // Permission-related maps
    this.permissionsList = new Map();
    this.rolePermissionsList = new Map();
    this.userPermissionsList = new Map();
    
    // Historical data collections
    this.robotHistoryData = new Map();
    this.dailyMetrics = new Map();
    this.zoneHistoryData = new Map();
    this.toolUsageData = [];
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Counters
    this.currentId = 1;
    this.currentPermissionId = 1;
    this.currentPermissionMappingId = 1;
    this.currentHistoryId = 1;
    
    // Initialize roles and permissions
    this.initializePermissions();
  }
  
  // Initialize default permissions
  private initializePermissions(): void {
    // Create all permissions defined in the PERMISSIONS constant
    Object.entries(PERMISSIONS).forEach(([key, value]) => {
      const permissionId = this.currentPermissionId++;
      this.permissionsList.set(permissionId, {
        id: permissionId,
        name: value, 
        description: `Permission to ${value.replace(':', ' ')}`
      });
    });
  }
  
  // Public method to ensure admin user exists (can be called directly from routes)
  async initializeAdminUser(): Promise<User> {
    // Hash function implementation
    const hashPassword = async (password: string) => {
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      return `${buf.toString("hex")}.${salt}`;
    };
    
    // Check if admin already exists
    const existingAdmin = await this.getUserByUsername("admin");
    if (existingAdmin) {
      // Fix the password if it doesn't match expected format
      if (!existingAdmin.password.includes(".")) {
        console.log("Fixing admin password format");
        
        // Update with properly hashed password
        existingAdmin.password = await hashPassword("admin123");
        this.users.set(existingAdmin.id, existingAdmin);
      }
      return existingAdmin;
    }
    
    // Create admin user if not exists
    const adminId = this.currentId++;
    // Properly hash the password
    const hashedPassword = await hashPassword("admin123");
    
    const adminUser: User = { 
      id: adminId,
      username: "admin",
      password: hashedPassword,
      email: "admin@delphnoid.com",
      fullName: "System Administrator",
      role: "admin",
      department: "IT",
      isActive: true, 
      lastLogin: null 
    };
    this.users.set(adminId, adminUser);
    
    // Set up default role permissions - mapping roles to their default permissions
    const defaultRolePermissions: Record<string, string[]> = {
      'admin': Object.values(PERMISSIONS),
      'manager': [
        PERMISSIONS.USER_VIEW,
        PERMISSIONS.USER_EDIT,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.ANALYTICS_EXPORT,
        PERMISSIONS.ROBOT_CONTROL,
        PERMISSIONS.ZONE_EDIT,
      ],
      'maintenance': [
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.ROBOT_VIEW,
        PERMISSIONS.ROBOT_MAINTENANCE,
        PERMISSIONS.ZONE_VIEW,
      ],
      'operator': [
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.ROBOT_VIEW,
        PERMISSIONS.ZONE_VIEW,
      ],
      'viewer': [
        PERMISSIONS.ANALYTICS_VIEW,
      ],
    };
    
    Object.entries(defaultRolePermissions).forEach(([role, permissions]) => {
      const rolePerms = new Set<number>();
      permissions.forEach(permission => {
        // Find permission ID by name
        const permId = Array.from(this.permissionsList.values())
          .find(p => p.name === permission)?.id;
        
        if (permId) {
          rolePerms.add(permId);
        }
      });
      
      this.rolePermissionsList.set(role, rolePerms);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      isActive: true, 
      lastLogin: null 
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // Remove user and all their permissions
    const deleted = this.users.delete(id);
    this.userPermissionsList.delete(id);
    
    // Add activity for audit
    if (deleted) {
      await this.addActivity({
        id: Date.now(),
        type: 'user',
        iconName: 'user-minus',
        message: `User ID ${id} was deleted from the system`,
        timestamp: new Date()
      });
    }
    
    return deleted;
  }
  
  // Permission management methods
  async getUserWithPermissions(id: number): Promise<UserWithPermissions | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const permissions = await this.getUserPermissions(id);
    
    return {
      id: user.id,
      username: user.username,
      email: user.email || undefined,
      fullName: user.fullName || undefined,
      role: user.role as any, // Type cast role to UserRole
      department: user.department || undefined,
      isActive: user.isActive,
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
      permissions
    };
  }
  
  async getPermissions(): Promise<Permission[]> {
    return Array.from(this.permissionsList.values());
  }
  
  async createPermission(name: string, description?: string): Promise<Permission> {
    const id = this.currentPermissionId++;
    const permission: Permission = { id, name, description };
    this.permissionsList.set(id, permission);
    return permission;
  }
  
  async assignRolePermission(role: string, permissionId: number): Promise<RolePermission> {
    // Get or create the role's permission set
    let rolePerms = this.rolePermissionsList.get(role);
    if (!rolePerms) {
      rolePerms = new Set<number>();
      this.rolePermissionsList.set(role, rolePerms);
    }
    
    // Add the permission to the role
    rolePerms.add(permissionId);
    
    // Return a role permission object
    return {
      id: this.currentPermissionMappingId++,
      role,
      permissionId
    };
  }
  
  async removeRolePermission(role: string, permissionId: number): Promise<boolean> {
    const rolePerms = this.rolePermissionsList.get(role);
    if (!rolePerms) return false;
    
    return rolePerms.delete(permissionId);
  }
  
  async setUserPermission(userId: number, permissionId: number, hasPermission: boolean): Promise<UserPermission> {
    // Get or create the user's permission map
    let userPerms = this.userPermissionsList.get(userId);
    if (!userPerms) {
      userPerms = new Map<number, boolean>();
      this.userPermissionsList.set(userId, userPerms);
    }
    
    // Set the permission value
    userPerms.set(permissionId, hasPermission);
    
    // Return a user permission object
    return {
      id: this.currentPermissionMappingId++,
      userId,
      permissionId,
      hasPermission
    };
  }
  
  async getUserPermissions(userId: number): Promise<string[]> {
    const user = this.users.get(userId);
    if (!user) return [];
    
    // Get role-based permissions
    const role = user.role;
    const rolePerms = this.rolePermissionsList.get(role) || new Set<number>();
    
    // Get user-specific permission overrides
    const userPerms = this.userPermissionsList.get(userId) || new Map<number, boolean>();
    
    // Combine permissions
    const effectivePermissions: string[] = [];
    
    // Add all permissions from the role that aren't explicitly denied for the user
    for (const permId of rolePerms) {
      const permission = this.permissionsList.get(permId);
      if (permission && (!userPerms.has(permId) || userPerms.get(permId))) {
        effectivePermissions.push(permission.name);
      }
    }
    
    // Add explicitly granted user permissions that aren't in the role
    for (const [permId, hasPermission] of userPerms.entries()) {
      if (hasPermission && !rolePerms.has(permId)) {
        const permission = this.permissionsList.get(permId);
        if (permission) {
          effectivePermissions.push(permission.name);
        }
      }
    }
    
    return effectivePermissions;
  }
  
  // Warehouse methods
  async getAllRobots(): Promise<Robot[]> {
    return Array.from(this.robots.values());
  }
  
  async getRobotById(id: number): Promise<Robot | undefined> {
    return this.robots.get(id);
  }
  
  async getAllZones(): Promise<Zone[]> {
    return Array.from(this.zones.values());
  }
  
  async getZoneById(id: string): Promise<Zone | undefined> {
    return this.zones.get(id);
  }
  
  async getRecentActivities(limit: number): Promise<Activity[]> {
    return this.activities.slice(0, limit);
  }
  
  async getWarehouseOverview(): Promise<WarehouseOverview> {
    return this.overview;
  }
  
  async updateRobotPosition(id: number, x: number, y: number): Promise<Robot | undefined> {
    const robot = this.robots.get(id);
    
    if (robot) {
      robot.coordinates = { x, y };
      this.robots.set(id, robot);
      return robot;
    }
    
    return undefined;
  }
  
  async addActivity(activity: Activity): Promise<Activity> {
    this.activities.unshift(activity);
    
    // Limit the number of activities stored
    if (this.activities.length > 100) {
      this.activities.pop();
    }
    
    return activity;
  }
  
  // Methods to set initial data
  setRobots(robots: Robot[]): void {
    this.robots.clear();
    robots.forEach(robot => this.robots.set(robot.id, robot));
  }
  
  setZones(zones: Zone[]): void {
    this.zones.clear();
    zones.forEach(zone => this.zones.set(zone.id, zone));
  }
  
  setActivities(activities: Activity[]): void {
    this.activities = activities;
  }
  
  setOverview(overview: WarehouseOverview): void {
    this.overview = overview;
  }

  // Historical Data Methods

  // Robot historical data
  async addRobotHistoricalData(data: InsertRobotHistoricalData): Promise<RobotHistoricalData> {
    const id = this.currentHistoryId++;
    const historyEntry: RobotHistoricalData = {
      ...data,
      id
    };

    // Get or create the robot's history array
    let robotHistory = this.robotHistoryData.get(data.robotId);
    if (!robotHistory) {
      robotHistory = [];
      this.robotHistoryData.set(data.robotId, robotHistory);
    }

    // Add the entry to the history
    robotHistory.push(historyEntry);

    return historyEntry;
  }

  async getRobotHistoricalData(
    robotId: number, 
    startTime?: Date, 
    endTime?: Date
  ): Promise<RobotHistoricalData[]> {
    const history = this.robotHistoryData.get(robotId) || [];
    
    // If no time filters, return all history
    if (!startTime && !endTime) {
      return [...history];
    }

    // Filter by date range
    return history.filter(entry => {
      const timestamp = new Date(entry.timestamp);
      
      // Check start time if provided
      if (startTime && timestamp < startTime) {
        return false;
      }
      
      // Check end time if provided
      if (endTime && timestamp > endTime) {
        return false;
      }
      
      return true;
    });
  }

  async getRobotHistoryById(historyId: number): Promise<RobotHistoricalData | undefined> {
    // Search all robot histories for the specific entry
    for (const history of this.robotHistoryData.values()) {
      const entry = history.find(h => h.id === historyId);
      if (entry) {
        return entry;
      }
    }
    
    return undefined;
  }

  // Daily performance metrics
  async addDailyPerformanceMetrics(data: InsertDailyPerformanceMetrics): Promise<DailyPerformanceMetrics> {
    const id = this.currentHistoryId++;
    const metrics: DailyPerformanceMetrics = {
      ...data,
      id
    };

    // Use date string as key
    const dateKey = data.date.toISOString().split('T')[0];
    this.dailyMetrics.set(dateKey, metrics);

    return metrics;
  }

  async getDailyPerformanceMetrics(
    startDate?: Date, 
    endDate?: Date
  ): Promise<DailyPerformanceMetrics[]> {
    const allMetrics = Array.from(this.dailyMetrics.values());
    
    // If no date filters, return all metrics
    if (!startDate && !endDate) {
      return allMetrics;
    }

    // Filter by date range
    return allMetrics.filter(metrics => {
      const date = new Date(metrics.date);
      
      // Check start date if provided
      if (startDate && date < startDate) {
        return false;
      }
      
      // Check end date if provided
      if (endDate && date > endDate) {
        return false;
      }
      
      return true;
    });
  }

  // Zone historical data
  async addZoneHistoricalData(data: InsertZoneHistoricalData): Promise<ZoneHistoricalData> {
    const id = this.currentHistoryId++;
    const historyEntry: ZoneHistoricalData = {
      ...data,
      id
    };

    // Get or create the zone's history array
    let zoneHistory = this.zoneHistoryData.get(data.zoneId);
    if (!zoneHistory) {
      zoneHistory = [];
      this.zoneHistoryData.set(data.zoneId, zoneHistory);
    }

    // Add the entry to the history
    zoneHistory.push(historyEntry);

    return historyEntry;
  }

  async getZoneHistoricalData(
    zoneId: string, 
    startTime?: Date, 
    endTime?: Date
  ): Promise<ZoneHistoricalData[]> {
    const history = this.zoneHistoryData.get(zoneId) || [];
    
    // If no time filters, return all history
    if (!startTime && !endTime) {
      return [...history];
    }

    // Filter by date range
    return history.filter(entry => {
      const timestamp = new Date(entry.timestamp);
      
      // Check start time if provided
      if (startTime && timestamp < startTime) {
        return false;
      }
      
      // Check end time if provided
      if (endTime && timestamp > endTime) {
        return false;
      }
      
      return true;
    });
  }

  // Tool usage statistics
  async addToolUsageStats(data: InsertToolUsageStats): Promise<ToolUsageStats> {
    const id = this.currentHistoryId++;
    const statsEntry: ToolUsageStats = {
      ...data,
      id
    };

    // Add to the tool usage data array
    this.toolUsageData.push(statsEntry);

    return statsEntry;
  }

  async getToolUsageStats(
    toolType?: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<ToolUsageStats[]> {
    // Start with all tool usage data
    let filteredStats = [...this.toolUsageData];
    
    // Filter by tool type if provided
    if (toolType) {
      filteredStats = filteredStats.filter(stats => stats.toolType === toolType);
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
      filteredStats = filteredStats.filter(stats => {
        const date = new Date(stats.date);
        
        // Check start date if provided
        if (startDate && date < startDate) {
          return false;
        }
        
        // Check end date if provided
        if (endDate && date > endDate) {
          return false;
        }
        
        return true;
      });
    }
    
    return filteredStats;
  }

  // Analytics methods
  async getEfficiencyTrends(days: number): Promise<{ date: string; efficiency: number }[]> {
    // Get daily metrics for the requested number of days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const metrics = await this.getDailyPerformanceMetrics(startDate, endDate);
    
    // Convert to efficiency data format
    return metrics.map(metric => {
      const dateStr = new Date(metric.date).toISOString().split('T')[0];
      return {
        date: dateStr,
        efficiency: metric.robotUtilization
      };
    });
  }

  async getRobotPerformanceComparison(): Promise<{ 
    robotId: number; 
    name: string; 
    efficiency: number; 
    tasksCompleted: number 
  }[]> {
    const robots = await this.getAllRobots();
    const result: { 
      robotId: number; 
      name: string; 
      efficiency: number; 
      tasksCompleted: number 
    }[] = [];
    
    // Calculate performance metrics for each robot
    for (const robot of robots) {
      // Get historical data for this robot (last 7 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const history = await this.getRobotHistoricalData(robot.id, startDate, endDate);
      
      // Calculate average performance score
      let totalScore = 0;
      let taskCount = 0;
      
      for (const entry of history) {
        if (entry.performanceScore) {
          totalScore += entry.performanceScore;
        }
        if (entry.taskId) {
          taskCount++;
        }
      }
      
      const avgEfficiency = history.length > 0 ? totalScore / history.length : 0;
      
      result.push({
        robotId: robot.id,
        name: robot.name,
        efficiency: avgEfficiency,
        tasksCompleted: taskCount
      });
    }
    
    return result;
  }

  async getZoneActivityHeatmap(): Promise<{ zoneId: string; activity: number }[]> {
    const zones = await this.getAllZones();
    const result: { zoneId: string; activity: number }[] = [];
    
    // Get activity metrics for each zone
    for (const zone of zones) {
      // Get most recent zone historical data (last 24 hours)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      
      const history = await this.getZoneHistoricalData(zone.id, startDate, endDate);
      
      // Calculate activity score based on robot count and congestion level
      let totalActivity = 0;
      
      for (const entry of history) {
        // Higher activity = more robots + higher congestion
        const activityScore = entry.robotCount * (1 + entry.congestionLevel / 100);
        totalActivity += activityScore;
      }
      
      // Average activity level
      const avgActivity = history.length > 0 ? totalActivity / history.length : 0;
      
      result.push({
        zoneId: zone.id,
        activity: avgActivity
      });
    }
    
    return result;
  }

  async getPeakActivityTimes(): Promise<{ hour: number; activity: number }[]> {
    // Initialize an array for all 24 hours
    const hourlyActivity: { hour: number; activity: number }[] = 
      Array.from({ length: 24 }, (_, i) => ({ hour: i, activity: 0 }));
    
    // Collect zone data for the last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    // Get all zone data
    const zones = await this.getAllZones();
    let totalEntries = 0;
    
    for (const zone of zones) {
      const history = await this.getZoneHistoricalData(zone.id, startDate, endDate);
      
      for (const entry of history) {
        const hour = new Date(entry.timestamp).getHours();
        // Activity based on robot count and congestion
        const activityScore = entry.robotCount * (1 + entry.congestionLevel / 100);
        
        hourlyActivity[hour].activity += activityScore;
        totalEntries++;
      }
    }
    
    // Calculate average per entry if we have data
    if (totalEntries > 0) {
      for (let i = 0; i < 24; i++) {
        hourlyActivity[i].activity /= totalEntries;
      }
    }
    
    return hourlyActivity;
  }

  async getBatteryTrends(robotId?: number): Promise<{ timestamp: string; level: number }[]> {
    // Get data for specific robot or all robots
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    let batteryData: { timestamp: string; level: number }[] = [];
    
    if (robotId) {
      // Get data for specific robot
      const history = await this.getRobotHistoricalData(robotId, startDate, endDate);
      
      batteryData = history.map(entry => ({
        timestamp: new Date(entry.timestamp).toISOString(),
        level: entry.batteryLevel
      }));
    } else {
      // Get aggregated data for all robots per hour
      const hourlyData = new Map<string, { sum: number; count: number }>();
      const robots = await this.getAllRobots();
      
      for (const robot of robots) {
        const history = await this.getRobotHistoricalData(robot.id, startDate, endDate);
        
        for (const entry of history) {
          // Group by hour
          const timestamp = new Date(entry.timestamp);
          timestamp.setMinutes(0, 0, 0);
          const hourKey = timestamp.toISOString();
          
          if (!hourlyData.has(hourKey)) {
            hourlyData.set(hourKey, { sum: 0, count: 0 });
          }
          
          const hourData = hourlyData.get(hourKey)!;
          hourData.sum += entry.batteryLevel;
          hourData.count++;
        }
      }
      
      // Convert to output format
      for (const [timestamp, data] of hourlyData.entries()) {
        batteryData.push({
          timestamp,
          level: data.count > 0 ? data.sum / data.count : 0
        });
      }
      
      // Sort by timestamp
      batteryData.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }
    
    return batteryData;
  }
}

export const storage = new MemStorage();
