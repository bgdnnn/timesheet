import React, { useState, useEffect, useCallback } from 'react';
import { client } from '@/api/timesheetClient';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import UserFormModal from "@/components/admin/UserFormModal";

// A new AdminApi client would be cleaner, but for now, we can use the generic fetchJson
const AdminApi = {
    listUsers: () => client.fetchJson('/admin/users'),
    getUser: (userId) => client.fetchJson(`/admin/users/${userId}`),
    updateUser: (userId, data) => client.fetchJson(`/admin/users/${userId}`, { method: 'PUT', body: data }),
    deleteUser: (userId) => client.fetchJson(`/admin/users/${userId}`, { method: 'DELETE' }),
};

export default function AdminPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const { toast } = useToast();

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

            <div className="bg-black/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-4">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/20">
                            <th className="p-4">ID</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Full Name</th>
                            <th className="p-4">Company</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-white/10">
                                <td className="p-4">{user.id}</td>
                                <td className="p-4">{user.email}</td>
                                <td className="p-4">{user.full_name || '-'}</td>
                                <td className="p-4">{user.company || '-'}</td>
                                <td className="p-4">
                                    <Select
                                        defaultValue={user.role}
                                        onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                                    >
                                        <SelectTrigger className="w-[180px] bg-white/10 border-white/20">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800/80 backdrop-blur-lg border-white/20 text-white">
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </td>
                                <td className="p-4 flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>Edit</Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">Delete</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-gray-800/80 backdrop-blur-lg border-white/20 text-white">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the user and all their associated data.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
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
}