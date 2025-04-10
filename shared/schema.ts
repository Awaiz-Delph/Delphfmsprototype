import { pgTable, text, serial, integer, boolean, timestamp, real, json, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Role enum for user permissions
export const RoleEnum = z.enum([
  'admin',          // Full access to all system features
  'manager',        // Access to manage robots, zones, and view analytics
  'operator',       // Access to operate robots and view basic data
  'viewer',         // Read-only access to system data
  'maintenance'     // Access to maintenance features and robot diagnostics
]);

export type Role = z.infer<typeof RoleEnum>;

// User table with role field
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  role: text("role").notNull().default('viewer'),
  department: text("department"),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
});

// Permissions table for granular access control
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

// Role-permission mapping table
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  permissionId: integer("permission_id").notNull(),
});

// User-specific permission overrides
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  permissionId: integer("permission_id").notNull(),
  hasPermission: boolean("has_permission").notNull().default(true),
});

// Update the insert schema for users to include the new fields
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
  department: true,
});

// Insert schemas for other tables
export const insertPermissionSchema = createInsertSchema(permissions);
export const insertRolePermissionSchema = createInsertSchema(rolePermissions);
export const insertUserPermissionSchema = createInsertSchema(userPermissions);

// Historical Data Models

// Time-series data for robot metrics
export const robotHistoricalData = pgTable("robot_historical_data", {
  id: serial("id").primaryKey(),
  robotId: integer("robot_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  batteryLevel: integer("battery_level").notNull(),
  status: text("status").notNull(),
  zoneId: text("zone_id").notNull(),
  taskId: integer("task_id"),
  position: json("position").notNull(), // { x: number, y: number }
  toolAttached: text("tool_attached"),
  performanceScore: real("performance_score"),
});

// Daily aggregated performance metrics
export const dailyPerformanceMetrics = pgTable("daily_performance_metrics", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  totalTasks: integer("total_tasks").notNull(),
  completedTasks: integer("completed_tasks").notNull(),
  failedTasks: integer("failed_tasks").notNull(),
  averageTaskTime: real("average_task_time").notNull(),
  robotUtilization: real("robot_utilization").notNull(), // percentage
  zoneActivity: json("zone_activity").notNull(), // { zoneId: string, taskCount: number }[]
  peakHours: json("peak_hours").notNull(), // { hour: number, taskCount: number }[]
  batteryConsumption: real("battery_consumption").notNull(), // average % per task
});

// Zone efficiency tracking
export const zoneHistoricalData = pgTable("zone_historical_data", {
  id: serial("id").primaryKey(),
  zoneId: text("zone_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  robotCount: integer("robot_count").notNull(),
  trafficDensity: text("traffic_density").notNull(),
  congestionLevel: real("congestion_level").notNull(), // percentage
  taskCompletion: real("task_completion").notNull(), // percentage
  avgRobotSpeed: real("avg_robot_speed"), // units per minute
});

// Tool usage statistics
export const toolUsageStats = pgTable("tool_usage_stats", {
  id: serial("id").primaryKey(),
  toolType: text("tool_type").notNull(),
  date: date("date").notNull(),
  usageDuration: integer("usage_duration").notNull(), // minutes
  taskCount: integer("task_count").notNull(),
  efficiency: real("efficiency").notNull(), // percentage
  robotId: integer("robot_id").notNull(),
  zoneId: text("zone_id").notNull(),
});

// Insert schemas for historical data
export const insertRobotHistoricalDataSchema = createInsertSchema(robotHistoricalData).omit({ id: true });
export const insertDailyPerformanceMetricsSchema = createInsertSchema(dailyPerformanceMetrics).omit({ id: true });
export const insertZoneHistoricalDataSchema = createInsertSchema(zoneHistoricalData).omit({ id: true });
export const insertToolUsageStatsSchema = createInsertSchema(toolUsageStats).omit({ id: true });

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type UserPermission = typeof userPermissions.$inferSelect;

// Historical data types
export type RobotHistoricalData = typeof robotHistoricalData.$inferSelect;
export type InsertRobotHistoricalData = z.infer<typeof insertRobotHistoricalDataSchema>;

export type DailyPerformanceMetrics = typeof dailyPerformanceMetrics.$inferSelect;
export type InsertDailyPerformanceMetrics = z.infer<typeof insertDailyPerformanceMetricsSchema>;

export type ZoneHistoricalData = typeof zoneHistoricalData.$inferSelect;
export type InsertZoneHistoricalData = z.infer<typeof insertZoneHistoricalDataSchema>;

export type ToolUsageStats = typeof toolUsageStats.$inferSelect;
export type InsertToolUsageStats = z.infer<typeof insertToolUsageStatsSchema>;
