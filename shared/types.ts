// User role types
export type UserRole = 'admin' | 'manager' | 'operator' | 'maintenance' | 'viewer';

// Define permissions as constants to ensure consistency
export const PERMISSIONS = {
  // System permissions
  SYSTEM_ADMIN: 'system:admin',
  
  // User management
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  
  // Robot management
  ROBOT_VIEW: 'robot:view',
  ROBOT_CONTROL: 'robot:control',
  ROBOT_DEPLOY: 'robot:deploy',
  ROBOT_MAINTENANCE: 'robot:maintenance',
  
  // Zone management
  ZONE_VIEW: 'zone:view',
  ZONE_EDIT: 'zone:edit',
  ZONE_PRIORITIZE: 'zone:prioritize',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // Settings
  SETTINGS_EDIT: 'settings:edit',
  
  // AI Assistant
  AI_QUERY: 'ai:query',
} as const;

// Warehouse data types
export interface Robot {
  id: number;
  name: string;
  type: string;
  status: 'idle' | 'working' | 'charging' | 'maintenance';
  batteryLevel: number;
  position: { x: number; y: number };
  coordinates?: { x: number; y: number }; // Alias for position to maintain compatibility
  currentZone: string | null;
  zoneId?: string; // Alias for currentZone to maintain compatibility
  lastTask: string | null;
  currentTask?: string | null; // Added for compatibility
  currentTool: string | null;
  efficiency?: number; // Direct access to efficiency
  maintenanceStatus: {
    lastMaintenance: Date | null;
    nextScheduled: Date | null;
    alertLevel: 'none' | 'low' | 'medium' | 'high';
  };
  statistics: {
    tasksCompleted: number;
    hoursActive: number;
    efficiency: number;
  };
}

export interface Zone {
  id: string;
  name: string;
  type: 'storage' | 'picking' | 'packing' | 'shipping' | 'receiving' | 'charging';
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive' | 'restricted';
  coordinates: {
    topLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  };
  trafficDensity: 'low' | 'medium' | 'high';
  robotCount: number;
  currentTasks: number;
  efficiency: number;
}

export interface Activity {
  id: number;
  type: 'robot' | 'zone' | 'system' | 'user';
  message: string;
  iconName: string;
  timestamp: Date;
  robotName?: string;
  details?: any;
}

export interface WarehouseOverview {
  totalRobots: number;
  activeRobots: number;
  robotUtilization: number;
  tasksCompleted?: number; // Direct access to tasks completed
  robotEfficiency?: number; // Average efficiency of all robots
  batteryLevels: {
    critical: number;
    low: number;
    medium: number;
    high: number;
  };
  zonePerformance: {
    id: string;
    name: string;
    efficiency: number;
  }[];
  taskCompletion: {
    total: number;
    completed: number;
    pending: number;
    rate: number;
  };
  alerts: {
    high: number;
    medium: number;
    low: number;
  };
}

// Permission types
export interface Permission {
  id: number;
  name: string;
  description: string | null;
}

export interface RolePermission {
  role: string;
  permissionId: number;
}

export interface UserPermission {
  userId: number;
  permissionId: number;
  hasPermission: boolean;
}

// User interface for use with permissions system
export interface User {
  id: number;
  username: string;
  password: string;
  email: string | null;
  fullName: string | null;
  role: string;
  department: string | null;
  isActive: boolean;
  lastLogin: Date | null;
}

export interface UserWithPermissions extends User {
  permissions: string[];
}

// Query response type for AI assistant
export interface QueryResponse {
  type: 'robot' | 'zone' | 'overview' | 'error' | 'text';
  data?: any;
  metadata?: {
    title?: string;
    subtitle?: string;
    metrics?: { label: string; value: string | number }[];
  };
  title?: string;
}

// AI Message type for chat interface
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}