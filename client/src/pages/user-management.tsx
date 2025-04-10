import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { PermissionGate, AdminOnly } from '@/components/ui/permission-gate';
import { PERMISSIONS, UserRole } from '@shared/types';
import { User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  UserPlus, 
  UserCog, 
  UserMinus, 
  Search, 
  Shield, 
  Check, 
  RefreshCw,
  PencilLine,
  Save,
  X
} from 'lucide-react';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createUserSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal('')),
  fullName: z.string().optional().or(z.literal('')),
  role: z.enum(['admin', 'manager', 'operator', 'viewer', 'maintenance']),
  department: z.string().optional().or(z.literal('')),
});

type CreateUserData = z.infer<typeof createUserSchema>;

// Role display information
const ROLE_INFO: Record<UserRole, { color: string, description: string }> = {
  admin: { 
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    description: 'Full system access'
  },
  manager: { 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    description: 'Manage robots, zones, and analytics'
  },
  operator: { 
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    description: 'Control robots and view data'
  },
  maintenance: { 
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    description: 'Maintain and service robots'
  },
  viewer: { 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    description: 'View-only access'
  },
};

export default function UserManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkPermission, hasPermission } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState('users');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // Fetch users
  const { 
    data: users = [], 
    isLoading: isLoadingUsers,
    isError: isUsersError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['/api/users'],
    enabled: hasPermission(PERMISSIONS.USER_VIEW),
  });

  // Filter users based on search query
  const filteredUsers = users.filter((user: User) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      (user.fullName && user.fullName.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.department && user.department.toLowerCase().includes(query)) ||
      user.role.toLowerCase().includes(query)
    );
  });

  // Create user form
  const createUserForm = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      password: '',
      email: '',
      fullName: '',
      role: 'viewer',
      department: '',
    },
  });

  // Edit user form
  const editUserForm = useForm<Partial<User>>({
    defaultValues: {
      email: '',
      fullName: '',
      role: 'viewer',
      department: '',
    },
  });

  // Set edit form values when editingUser changes
  useEffect(() => {
    if (editingUser) {
      editUserForm.reset({
        email: editingUser.email || '',
        fullName: editingUser.fullName || '',
        role: editingUser.role as UserRole,
        department: editingUser.department || '',
      });
    }
  }, [editingUser, editUserForm]);

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const response = await apiRequest('POST', '/api/users', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowCreateDialog(false);
      createUserForm.reset();
      toast({
        title: "User created",
        description: "New user has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: "Error creating user",
        description: error.message || "Could not create user",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; userData: Partial<User> }) => {
      const response = await apiRequest('PATCH', `/api/users/${data.id}`, data.userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setEditUserDialogOpen(false);
      setEditingUser(null);
      toast({
        title: "User updated",
        description: "User has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: "Error updating user",
        description: error.message || "Could not update user",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowDeleteConfirm(null);
      toast({
        title: "User deleted",
        description: "User has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: "Error deleting user",
        description: error.message || "Could not delete user",
      });
    },
  });

  // Handle create user form submission
  const onCreateUser = (data: CreateUserData) => {
    createUserMutation.mutate(data);
  };

  // Handle update user form submission
  const onUpdateUser = (data: Partial<User>) => {
    if (!editingUser) return;
    
    updateUserMutation.mutate({ 
      id: editingUser.id, 
      userData: data 
    });
  };

  // Handle delete user confirmation
  const onDeleteUser = (userId: number) => {
    deleteUserMutation.mutate(userId);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and permissions</p>
        </div>
        <Button onClick={() => refetchUsers()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[250px]"
              />
            </div>
            
            <PermissionGate permission={PERMISSIONS.USER_CREATE}>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Create User
              </Button>
            </PermissionGate>
          </div>
        </div>
        
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>User List</CardTitle>
              <CardDescription>
                Manage user accounts and access levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center p-6">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : isUsersError ? (
                <div className="bg-destructive/10 p-4 rounded-md text-destructive text-center">
                  Error loading users. Please try again.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                          {searchQuery ? "No users match your search" : "No users found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.username}
                          </TableCell>
                          <TableCell>{user.fullName || "-"}</TableCell>
                          <TableCell>{user.email || "-"}</TableCell>
                          <TableCell>{user.department || "-"}</TableCell>
                          <TableCell>
                            <Badge className={ROLE_INFO[user.role as UserRole]?.color || "bg-gray-100"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.isActive ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditingUser(user);
                                  setEditUserDialogOpen(true);
                                }}
                                title="Edit User"
                              >
                                <PencilLine className="h-4 w-4" />
                              </Button>
                              
                              <AdminOnly>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setShowDeleteConfirm(user.id)}
                                  title="Delete User"
                                >
                                  <UserMinus className="h-4 w-4" />
                                </Button>
                              </AdminOnly>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <p className="text-sm text-muted-foreground">
                Total users: {users.length}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Role & Permission Management</CardTitle>
              <CardDescription>
                Manage system roles and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(ROLE_INFO).map(([role, info]) => (
                  <div key={role} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={info.color}>
                        {role}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {info.description}
                      </span>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Object.entries(PERMISSIONS)
                        .filter(([, permission]) => {
                          // Filter permissions based on if this role typically has them
                          const roleHierarchy = {
                            admin: 5,
                            manager: 4,
                            maintenance: 3,
                            operator: 2,
                            viewer: 1
                          };
                          
                          const permissionRoleMap: Record<string, UserRole> = {
                            [PERMISSIONS.SYSTEM_ADMIN]: 'admin',
                            [PERMISSIONS.USER_DELETE]: 'admin',
                            [PERMISSIONS.SETTINGS_EDIT]: 'admin',
                            [PERMISSIONS.USER_CREATE]: 'manager',
                            [PERMISSIONS.USER_EDIT]: 'manager',
                            [PERMISSIONS.ZONE_EDIT]: 'manager',
                            [PERMISSIONS.ZONE_PRIORITIZE]: 'manager',
                            [PERMISSIONS.ROBOT_DEPLOY]: 'manager',
                            [PERMISSIONS.ANALYTICS_EXPORT]: 'manager',
                            [PERMISSIONS.ROBOT_CONTROL]: 'operator',
                            [PERMISSIONS.ROBOT_MAINTENANCE]: 'maintenance',
                            [PERMISSIONS.ROBOT_VIEW]: 'viewer',
                            [PERMISSIONS.ZONE_VIEW]: 'viewer',
                            [PERMISSIONS.ANALYTICS_VIEW]: 'viewer',
                            [PERMISSIONS.AI_QUERY]: 'viewer',
                          };
                          
                          const minRoleForPermission = permissionRoleMap[permission] || 'viewer';
                          return roleHierarchy[role as UserRole] >= roleHierarchy[minRoleForPermission];
                        })
                        .map(([key, permission]) => (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            <span title={permission}>{permission}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. All users start with the default permissions for their role.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createUserForm}>
            <form onSubmit={createUserForm.handleSubmit(onCreateUser)} className="space-y-4">
              <FormField
                control={createUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createUserForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createUserForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <AdminOnly>
                            <SelectItem value="admin">Admin</SelectItem>
                          </AdminOnly>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="operator">Operator</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {ROLE_INFO[field.value as UserRole]?.description}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createUserForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Department" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="gap-2"
                >
                  {createUserMutation.isPending && (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  )}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.username}</DialogTitle>
            <DialogDescription>
              Update user information and role
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editUserForm}>
            <form onSubmit={editUserForm.handleSubmit(onUpdateUser)} className="space-y-4">
              <FormField
                control={editUserForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <AdminOnly
                  fallback={
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input disabled value={editingUser?.role || ''} />
                      </FormControl>
                      <FormDescription>
                        Only admins can change roles
                      </FormDescription>
                    </FormItem>
                  }
                >
                  <FormField
                    control={editUserForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="operator">Operator</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {ROLE_INFO[field.value as UserRole]?.description}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AdminOnly>
                
                <FormField
                  control={editUserForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Department" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingUser(null);
                    setEditUserDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="gap-2"
                >
                  {updateUserMutation.isPending && (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm !== null} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => showDeleteConfirm && onDeleteUser(showDeleteConfirm)}
              disabled={deleteUserMutation.isPending}
              className="gap-2"
            >
              {deleteUserMutation.isPending && (
                <RefreshCw className="h-4 w-4 animate-spin" />
              )}
              Delete User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}