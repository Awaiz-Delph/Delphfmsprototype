import { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { UserRole } from "@shared/types";

interface PermissionGateProps {
  permission?: string;
  minimumRole?: UserRole;
  children: ReactNode;
  fallback?: ReactNode;
  showErrorMessage?: boolean;
}

/**
 * A component that conditionally renders its children based on user permissions
 * 
 * @example
 * // Only show to users with the 'robot:control' permission
 * <PermissionGate permission={PERMISSIONS.ROBOT_CONTROL}>
 *   <RobotControlPanel />
 * </PermissionGate>
 * 
 * @example
 * // Only show to managers and above
 * <PermissionGate minimumRole="manager">
 *   <AdvancedSettings />
 * </PermissionGate>
 * 
 * @example
 * // Show alternative content if permission is missing
 * <PermissionGate 
 *   permission={PERMISSIONS.ANALYTICS_EXPORT}
 *   fallback={<UpgradePrompt />}
 * >
 *   <ExportButton />
 * </PermissionGate>
 */
export function PermissionGate({ 
  permission,
  minimumRole,
  children,
  fallback,
  showErrorMessage = false,
}: PermissionGateProps) {
  const { checkPermission, hasMinimumRole } = usePermissions();
  
  // Handle permission check
  const hasRequiredPermission = permission ? checkPermission(permission) : true;
  
  // Handle role check
  const hasRequiredRole = minimumRole ? hasMinimumRole(minimumRole) : true;
  
  // User needs to pass both checks
  const isAuthorized = hasRequiredPermission && hasRequiredRole;
  
  if (isAuthorized) {
    return <>{children}</>;
  }
  
  // If there's a fallback, use that
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // If we want to show an error message
  if (showErrorMessage) {
    return (
      <Alert variant="destructive" className="my-4">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You don't have permission to access this feature.
          {permission && ` Missing permission: ${permission}`}
          {minimumRole && ` Required role: ${minimumRole} or higher`}
        </AlertDescription>
      </Alert>
    );
  }
  
  // By default, render nothing
  return null;
}

/**
 * A component that only renders its children for admin users
 */
export function AdminOnly({ 
  children, 
  fallback,
  showErrorMessage,
}: Omit<PermissionGateProps, "permission" | "minimumRole">) {
  return (
    <PermissionGate 
      minimumRole="admin"
      fallback={fallback}
      showErrorMessage={showErrorMessage}
    >
      {children}
    </PermissionGate>
  );
}

/**
 * A component that only renders its children for managers and above
 */
export function ManagerOnly({ 
  children, 
  fallback,
  showErrorMessage,
}: Omit<PermissionGateProps, "permission" | "minimumRole">) {
  return (
    <PermissionGate 
      minimumRole="manager"
      fallback={fallback}
      showErrorMessage={showErrorMessage}
    >
      {children}
    </PermissionGate>
  );
}