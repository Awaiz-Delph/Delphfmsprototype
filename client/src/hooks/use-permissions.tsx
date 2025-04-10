import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { PERMISSIONS, UserRole } from '@shared/types';

interface PermissionsContextType {
  userPermissions: string[];
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  checkPermission: (permission: string, fallbackToRoleCheck?: boolean) => boolean;
  hasMinimumRole: (minimumRole: UserRole) => boolean;
}

export const PermissionsContext = createContext<PermissionsContextType | null>(null);

// Role hierarchy for checking minimum role requirements
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  manager: 80,
  maintenance: 60,
  operator: 40,
  viewer: 20,
};

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Fetch user permissions from the API
  const { 
    data: permissionsData,
    isLoading,
  } = useQuery({
    queryKey: user ? ['/api/users', user.id, 'permissions'] : [],
    enabled: !!user && !!user.id,
  });
  
  const userPermissions = permissionsData?.permissions || [];
  
  // Check if user has a specific permission directly assigned
  const hasPermission = useCallback((permission: string) => {
    return userPermissions.includes(permission);
  }, [userPermissions]);
  
  // Check if user has minimum role level
  const hasMinimumRole = useCallback((minimumRole: UserRole): boolean => {
    if (!user) return false;
    
    const userRoleValue = ROLE_HIERARCHY[user.role as UserRole] || 0;
    const requiredRoleValue = ROLE_HIERARCHY[minimumRole] || 0;
    
    return userRoleValue >= requiredRoleValue;
  }, [user]);
  
  // Check permission with fallback to role-based check
  const checkPermission = useCallback((
    permission: string,
    fallbackToRoleCheck = true
  ): boolean => {
    // Direct permission check
    if (hasPermission(permission)) return true;
    
    // If we don't want to fall back to role checks, stop here
    if (!fallbackToRoleCheck) return false;
    
    // Role-based fallback checks
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Role-based permission mapping as a fallback
    const rolePermissionMap: Record<UserRole, string[]> = {
      admin: Object.values(PERMISSIONS),
      manager: [
        PERMISSIONS.USER_VIEW,
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_EDIT,
        PERMISSIONS.ROBOT_VIEW,
        PERMISSIONS.ROBOT_CONTROL,
        PERMISSIONS.ROBOT_DEPLOY,
        PERMISSIONS.ZONE_VIEW,
        PERMISSIONS.ZONE_EDIT,
        PERMISSIONS.ZONE_PRIORITIZE,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.ANALYTICS_EXPORT,
        PERMISSIONS.AI_QUERY,
      ],
      maintenance: [
        PERMISSIONS.ROBOT_VIEW,
        PERMISSIONS.ROBOT_CONTROL,
        PERMISSIONS.ROBOT_MAINTENANCE,
        PERMISSIONS.ZONE_VIEW,
        PERMISSIONS.AI_QUERY,
      ],
      operator: [
        PERMISSIONS.ROBOT_VIEW,
        PERMISSIONS.ROBOT_CONTROL,
        PERMISSIONS.ZONE_VIEW, 
        PERMISSIONS.AI_QUERY,
      ],
      viewer: [
        PERMISSIONS.ROBOT_VIEW,
        PERMISSIONS.ZONE_VIEW,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.AI_QUERY,
      ],
    };
    
    return rolePermissionMap[user.role as UserRole]?.includes(permission) || false;
  }, [user, hasPermission]);
  
  return (
    <PermissionsContext.Provider
      value={{
        userPermissions,
        isLoading,
        hasPermission,
        checkPermission,
        hasMinimumRole,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}