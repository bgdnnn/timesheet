import React, { useState, useEffect, useCallback } from 'react';
import { client } from '@/api/timesheetClient';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import UserFormModal from "@/components/admin/UserFormModal";
import { useIsMobile } from "@/hooks/use-mobile";
import ImportData from "@/components/ImportData";
import { Project, TimeEntry, Hotel } from "@/api/entities";
import { Download, Upload, Shield, Users, Database, FileJson, FileSpreadsheet, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const AdminApi = {
    listUsers: () => client.fetchJson('/admin/users'),
    getUser: (userId) => client.fetchJson(`/admin/users/${userId}`),
    updateUser: (userId, data) => client.fetchJson(`/admin/users/${userId}`, { method: 'PUT', body: data }),
    deleteUser: (userId) => client.fetchJson(`/admin/users/${userId}`, { method: 'DELETE' }),
};

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6 ${className}`}>
    {children}
  </div>
);

const AdminDesktopView = ({ users, handleEditUser, handleDeleteUser, handleRoleChange }) => (
    <div className="overflow-x-auto rounded-2xl shadow-lg border border-white/20">
        <div className="bg-white/10 backdrop-blur-xl p-1 min-w-[800px]">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="p-4 font-bold text-xs uppercase tracking-widest text-gray-400">ID</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-widest text-gray-400">Email</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-widest text-gray-400">Full Name</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-widest text-gray-400">Company</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-widest text-gray-400">Role</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-widest text-gray-400">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4 text-sm text-gray-400">#{user.id}</td>
                            <td className="p-4 font-medium">{user.email}</td>
                            <td className="p-4">{user.full_name || '—'}</td>
                            <td className="p-4">{user.company || '—'}</td>
                            <td className="p-4">
                                <Select
                                    defaultValue={user.role}
                                    onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                                >
                                    <SelectTrigger className="w-[110px] bg-white/5 border-white/10 h-8 text-xs">
                                        <SelectValue placeholder="Role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-900 border-white/10 text-white">
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </td>
                            <td className="p-4 flex items-center space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)} className="h-8 hover:bg-white/10">Edit</Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">Delete</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-gray-900 border-white/20 text-white">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-gray-400">
                                                This will permanently remove <strong>{user.email}</strong> and all associated timesheet data.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="bg-white/5 border-white/10 text-white">Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-rose-500 hover:bg-rose-600 text-white">Delete Permanently</AlertDialogAction>
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
            <GlassCard key={user.id} className="p-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="font-bold text-lg leading-none mb-1">{user.full_name || 'No Name'}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase">ID: {user.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Company</p>
                        <p className="text-sm truncate">{user.company || '—'}</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Role</p>
                        <Select
                            defaultValue={user.role}
                            onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        >
                            <SelectTrigger className="w-full bg-transparent border-none h-auto p-0 focus:ring-0 text-sm">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-white/10 text-white">
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                    <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)} className="h-8">Edit</Button>
                    <Button variant="ghost" size="sm" className="h-8 text-rose-400">Delete</Button>
                </div>
            </GlassCard>
        ))}
    </div>
);


export default function AdminPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const isMobile = useIsMobile();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedUsers = await AdminApi.listUsers();
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    }, []);

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
            toast.success("User deleted successfully");
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Failed to delete user");
        }
    };
    
    const handleRoleChange = async (userId, newRole) => {
        try {
            await AdminApi.updateUser(userId, { role: newRole });
            toast.success("Role updated successfully");
            fetchUsers();
        } catch (error) {
            console.error("Error updating role:", error);
            toast.error("Failed to update role");
        }
    };

    const handleExport = async (format) => {
        try {
          const [allProjects, allEntries, allHotels] = await Promise.all([
            Project.list(),
            TimeEntry.list(),
            Hotel.list(),
          ]);
    
          const data = {
            projects: allProjects,
            entries: allEntries,
            hotels: allHotels,
            exportDate: new Date().toISOString(),
          };
    
          if (format === "json") {
            const blob = new Blob([JSON.stringify(data, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `admin-full-export-${new Date().toISOString().split("T")[0]}.json`;
            a.click();
          } else {
            let csv = "Type,Date,Name/Project,Duration/Client,Notes\n";
            allEntries.forEach((e) => {
              csv += `Entry,${e.date},${e.project_name},${e.hours_worked}h,"${(e.notes || "").replace(/"/g, '""')}"\n`;
            });
            allProjects.forEach((p) => {
              csv += `Project,${new Date(p.created_date || Date.now()).toISOString().split("T")[0]},${p.name},${p.client},${p.archived ? "Archived" : "Active"}\n`;
            });
    
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `admin-full-export-${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
          }
          toast.success("Export successful");
        } catch (e) {
          console.error("Export failed", e);
          toast.error("Export failed");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <RefreshCw className="h-8 w-8 animate-spin text-white/20" />
            </div>
        );
    }

    return (
        <div className="text-white space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                            <Shield className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    </div>
                    <p className="text-gray-400 ml-11">System oversight and data management tools.</p>
                </div>
            </div>

            {/* User Management Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-cyan-400" />
                    <h2 className="text-xl font-bold">User Access Control</h2>
                </div>
                {isMobile ? (
                    <AdminMobileView users={users} handleEditUser={handleEditUser} handleDeleteUser={handleDeleteUser} handleRoleChange={handleRoleChange} />
                ) : (
                    <AdminDesktopView users={users} handleEditUser={handleEditUser} handleDeleteUser={handleDeleteUser} handleRoleChange={handleRoleChange} />
                )}
            </div>

            {/* Data Operations Grid */}
            <div className="space-y-6 pt-4">
                <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-cyan-400" />
                    <h2 className="text-xl font-bold">System Operations</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Import Widget */}
                    <GlassCard className="flex flex-col border-cyan-500/10 hover:border-cyan-500/30 transition-all">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
                                <Upload className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Batch Import</h3>
                                <p className="text-xs text-gray-500">Restore data from JSON</p>
                            </div>
                        </div>
                        <div className="mt-auto">
                            <ImportData onImported={fetchUsers} onMenuStateChange={() => {}} />
                        </div>
                    </GlassCard>

                    {/* Export CSV Widget */}
                    <GlassCard className="flex flex-col border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                                <FileSpreadsheet className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Excel Export</h3>
                                <p className="text-xs text-gray-500">Generate CSV summary</p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => handleExport("csv")}
                            className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 mt-auto font-bold py-6 rounded-xl"
                        >
                            <Download className="mr-2 h-5 w-5" />
                            Download CSV
                        </Button>
                    </GlassCard>

                    {/* Export JSON Widget */}
                    <GlassCard className="flex flex-col border-purple-500/10 hover:border-purple-500/30 transition-all">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                                <FileJson className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Full Backup</h3>
                                <p className="text-xs text-gray-500">Secure JSON archive</p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => handleExport("json")}
                            className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/20 mt-auto font-bold py-6 rounded-xl"
                        >
                            <Download className="mr-2 h-5 w-5" />
                            Download JSON
                        </Button>
                    </GlassCard>
                </div>
            </div>
            
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
        </div>
    );
}
