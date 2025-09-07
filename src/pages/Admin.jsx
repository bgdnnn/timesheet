import React, { useState, useEffect, useCallback } from 'react';
import { client } from '@/api/timesheetClient';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import UserFormModal from "@/components/admin/UserFormModal";
import { useIsMobile } from "@/hooks/use-mobile";

// A new AdminApi client would be cleaner, but for now, we can use the generic fetchJson
const AdminApi = {
    listUsers: () => client.fetchJson('/admin/users'),
    getUser: (userId) => client.fetchJson(`/admin/users/${userId}`),
    updateUser: (userId, data) => client.fetchJson(`/admin/users/${userId}`, { method: 'PUT', body: data }),
    deleteUser: (userId) => client.fetchJson(`/admin/users/${userId}`, { method: 'DELETE' }),
};

const AdminDesktopView = ({ users, handleEditUser, handleDeleteUser, handleRoleChange }) => (
    <div className="overflow-x-auto rounded-2xl shadow-lg border border-white/20">
        <div className="bg-gray-900/70 backdrop-blur-xl p-1 min-w-[800px]">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-white/20">
                        <th className="p-4 font-semibold">ID</th>
                        <th className="p-4 font-semibold">Email</th>
                        <th className="p-4 font-semibold">Full Name</th>
                        <th className="p-4 font-semibold">Company</th>
                        <th className="p-4 font-semibold">Role</th>
                        <th className="p-4 font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                            <td className="p-4 text-sm">{user.id}</td>
                            <td className="p-4">{user.email}</td>
                            <td className="p-4">{user.full_name || '—'}</td>
                            <td className="p-4">{user.company || '—'}</td>
                            <td className="p-4">
                                <Select
                                    defaultValue={user.role}
                                    onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                                >
                                    <SelectTrigger className="w-[120px] bg-gray-800/80 border-white/20 focus:ring-2 focus:ring-blue-500">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800/90 backdrop-blur-lg border-white/20 text-white">
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </td>
                            <td className="p-4 flex items-center space-x-2">
                                <Button variant="secondary" size="sm" onClick={() => handleEditUser(user)}>Edit</Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">Delete</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-gray-800/90 backdrop-blur-lg border-white/20 text-white">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the user and all their associated data.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel asChild><Button variant="secondary">Cancel</Button></AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const AdminMobileView = ({ users, handleEditUser, handleDeleteUser, handleRoleChange }) => (
    <div className="space-y-4">
        {users.map(user => (
            <div key={user.id} className="bg-gray-900/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <p className="font-bold text-lg">{user.full_name || 'No Name'}</p>
                        <p className="text-sm text-gray-300">{user.email}</p>
                    </div>
                    <p className="text-sm text-gray-400">ID: {user.id}</p>
                </div>
                <div className="border-t border-white/10 my-4"></div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-semibold text-gray-400">Company</p>
                        <p>{user.company || '—'}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-400">Role</p>
                        <Select
                            defaultValue={user.role}
                            onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        >
                            <SelectTrigger className="w-full bg-gray-800/80 border-white/20 focus:ring-2 focus:ring-blue-500 mt-1">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800/90 backdrop-blur-lg border-white/20 text-white">
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="border-t border-white/10 my-4"></div>
                <div className="flex justify-end space-x-2">
                    <Button variant="secondary" size="sm" onClick={() => handleEditUser(user)}>Edit</Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-800/90 backdrop-blur-lg border-white/20 text-white">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the user and all their associated data.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel asChild><Button variant="secondary">Cancel</Button></AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        ))}
    </div>
);


export default function AdminPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedUsers = await AdminApi.listUsers();
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast({
                variant: "destructive",
                title: "Failed to fetch users",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setIsUserModalOpen(true);
    };

    const handleDeleteUser = async (userId) => {
        try {
            await AdminApi.deleteUser(userId);
            toast({
                title: "User deleted",
                description: "User has been successfully deleted.",
            });
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            toast({
                variant: "destructive",
                title: "Failed to delete user",
                description: error.message,
            });
        }
    };
    
    const handleRoleChange = async (userId, newRole) => {
        try {
            await AdminApi.updateUser(userId, { role: newRole });
            toast({
                title: "Role updated",
                description: "User role has been successfully updated.",
            });
            fetchUsers();
        } catch (error) {
            console.error("Error updating role:", error);
            toast({
                variant: "destructive",
                title: "Failed to update role",
                description: error.message,
            });
        }
    };

    if (loading) {
        return <div className="text-white">Loading users...</div>;
    }

    return (
        <div className="text-white">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Admin Panel - User Management</h1>
            
            <UserFormModal
                isOpen={isUserModalOpen}
                onClose={() => {
                    setIsUserModalOpen(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
                onSave={() => {
                    fetchUsers();
                    setIsUserModalOpen(false);
                    setSelectedUser(null);
                }}
            />

            {isMobile ? (
                <AdminMobileView users={users} handleEditUser={handleEditUser} handleDeleteUser={handleDeleteUser} handleRoleChange={handleRoleChange} />
            ) : (
                <AdminDesktopView users={users} handleEditUser={handleEditUser} handleDeleteUser={handleDeleteUser} handleRoleChange={handleRoleChange} />
            )}
        </div>
    );
}
