import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, formatDistanceToNow } from "date-fns";
import { client } from '@/api/timesheetClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import UserFormModal from "@/components/admin/UserFormModal";
import { useIsMobile } from "@/hooks/use-mobile";
import ImportData from "@/components/ImportData";
import { Project, TimeEntry, Hotel } from "@/api/entities";
import { 
    Shield, 
    ShieldAlert, 
    ShieldCheck, 
    Users, 
    Database, 
    FileJson, 
    FileSpreadsheet, 
    RefreshCw, 
    Clock, 
    HardDrive, 
    Cpu, 
    Server, 
    Activity, 
    Download, 
    Upload, 
    Search, 
    Terminal, 
    Copy, 
    Check, 
    AlertTriangle, 
    FileText, 
    Calendar, 
    DollarSign, 
    CheckCircle2, 
    Layers, 
    Zap,
    Briefcase,
    Receipt,
    GraduationCap,
    Plane,
    Building2,
    StickyNote
} from "lucide-react";
import { toast } from "sonner";

const AdminApi = {
    getStatus: () => client.fetchJson('/admin/status'),
    listUsers: () => client.fetchJson('/admin/users'),
    getUser: (userId) => client.fetchJson(`/admin/users/${userId}`),
    updateUser: (userId, data) => client.fetchJson(`/admin/users/${userId}`, { method: 'PUT', body: data }),
    deleteUser: (userId) => client.fetchJson(`/admin/users/${userId}`, { method: 'DELETE' }),
    listBackups: () => client.fetchJson('/admin/backups'),
    triggerBackup: (type = 'db') => client.fetchJson(`/admin/backups/trigger?backup_type=${encodeURIComponent(type)}`, { method: 'POST' }),
    restoreBackup: (filename) => client.fetchJson(`/admin/backups/restore/${encodeURIComponent(filename)}`, { method: 'POST' }),
    getBackupLogs: (lines = 50) => client.fetchJson(`/admin/backups/logs?lines_count=${lines}`),
};

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6 ${className}`}>
    {children}
  </div>
);

const MetricStatCard = ({ title, value, subtitle, icon: Icon, iconColor = "text-cyan-400", badgeText, badgeColor = "bg-cyan-500/10 text-cyan-400" }) => (
    <GlassCard className="p-4 sm:p-5 flex flex-col justify-between hover:border-white/30 transition-all">
        <div className="flex items-start justify-between gap-2.5 mb-2.5">
            <div className="space-y-1 min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 truncate" title={title}>{title}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-lg sm:text-2xl font-bold tracking-tight text-white break-words">{value}</span>
                </div>
            </div>
            <div className={`p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0 ${iconColor}`}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 pt-2 border-t border-white/5 text-xs">
            <span className="text-gray-400 truncate text-[11px] sm:text-xs min-w-0 flex-1 mr-1" title={subtitle}>{subtitle}</span>
            {badgeText && (
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold shrink-0 ${badgeColor}`}>
                    {badgeText}
                </span>
            )}
        </div>
    </GlassCard>
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
                        <th className="p-4 font-bold text-xs uppercase tracking-widest text-gray-400">Wage / Hr</th>
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
                            <td className="p-4 font-mono text-sm">{user.wage ? `£${parseFloat(user.wage).toFixed(2)}` : '—'}</td>
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
                    <span className="text-[10px] font-mono text-gray-500 uppercase">ID: #{user.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Company</p>
                        <p className="font-medium truncate">{user.company || '—'}</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Wage / Hr</p>
                        <p className="font-mono">{user.wage ? `£${parseFloat(user.wage).toFixed(2)}` : '—'}</p>
                    </div>
                    <div className="col-span-2 bg-white/5 p-2 rounded-lg border border-white/5 flex items-center justify-between">
                        <p className="text-[10px] uppercase font-bold text-gray-500">Role</p>
                        <Select
                            defaultValue={user.role}
                            onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        >
                            <SelectTrigger className="w-[100px] bg-transparent border-none h-auto p-0 focus:ring-0 text-xs font-semibold text-right">
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
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 text-rose-400">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-900 border-white/20 text-white">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                    Permanently delete <strong>{user.email}</strong>?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-white/5 border-white/10 text-white">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-rose-500 hover:bg-rose-600 text-white">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </GlassCard>
        ))}
    </div>
);

export default function AdminPage() {
    const [systemStatus, setSystemStatus] = useState(null);
    const [users, setUsers] = useState([]);
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userFilter, setUserFilter] = useState("");
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [backupTypeRunning, setBackupTypeRunning] = useState(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [signupEnabled, setSignupEnabled] = useState(true);
    const [isUpdatingSignup, setIsUpdatingSignup] = useState(false);
    const [activeTab, setActiveTab] = useState("telemetry");
    const [copiedLog, setCopiedLog] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [customLogs, setCustomLogs] = useState(null);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const isMobile = useIsMobile();

    const fetchAllData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const [statusRes, usersRes, backupsRes, signupRes] = await Promise.allSettled([
                AdminApi.getStatus(),
                AdminApi.listUsers(),
                AdminApi.listBackups(),
                client.fetchJson('/admin/settings/signup_enabled')
            ]);

            if (statusRes.status === 'fulfilled') {
                setSystemStatus(statusRes.value);
            }
            if (usersRes.status === 'fulfilled') {
                setUsers(usersRes.value);
            }
            if (backupsRes.status === 'fulfilled') {
                setBackups(backupsRes.value);
            }
            if (signupRes.status === 'fulfilled') {
                setSignupEnabled(signupRes.value?.value === 'true');
            }
        } catch (error) {
            console.error("Error fetching admin telemetry:", error);
            toast.error("Failed to load some dashboard data");
        } finally {
            setLoading(false);
            if (isRefresh) setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
        // Periodic telemetry refresh every 30 seconds
        const interval = setInterval(() => {
            AdminApi.getStatus()
                .then(status => setSystemStatus(status))
                .catch(() => {});
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchAllData]);

    const handleToggleSignup = async () => {
        setIsUpdatingSignup(true);
        const newValue = !signupEnabled;
        try {
            await client.fetchJson('/admin/settings/signup_enabled', {
                method: 'POST',
                body: { value: newValue ? 'true' : 'false' }
            });
            setSignupEnabled(newValue);
            toast.success(`Public signups ${newValue ? 'enabled' : 'disabled'} successfully`);
        } catch (error) {
            console.error("Error toggling signup setting:", error);
            toast.error("Failed to toggle signup status");
        } finally {
            setIsUpdatingSignup(false);
        }
    };

    const handleTriggerBackup = async (type = 'db') => {
        setIsBackingUp(true);
        setBackupTypeRunning(type);
        const toastId = toast.loading(
            type === 'full' ? "Creating full database & media archive..." : "Dumping PostgreSQL database..."
        );
        try {
            const res = await AdminApi.triggerBackup(type);
            toast.success(res.message || "Backup completed successfully", { id: toastId });
            fetchAllData(true);
        } catch (error) {
            console.error("Backup failed:", error);
            toast.error(`Backup failed: ${error.message}`, { id: toastId });
        } finally {
            setIsBackingUp(false);
            setBackupTypeRunning(null);
        }
    };

    const handleDownloadBackup = async (filename) => {
        const toastId = toast.loading(`Preparing download for ${filename}...`);
        try {
            const token = localStorage.getItem("ts_token");
            const headers = token ? { "Authorization": `Bearer ${token}` } : {};
            const res = await fetch(`${client.baseUrl}/admin/backups/download/${encodeURIComponent(filename)}`, {
                headers,
                credentials: "include"
            });
            if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success(`Downloaded ${filename}`, { id: toastId });
        } catch (err) {
            console.error("Download error:", err);
            toast.error(`Failed to download backup: ${err.message}`, { id: toastId });
        }
    };

    const handleRestoreBackup = async (filename) => {
        setIsRestoring(true);
        const toastId = toast.loading("Restoring database from backup... please do not refresh.");
        try {
            const res = await AdminApi.restoreBackup(filename);
            toast.success(res.message || "Database restored successfully", { id: toastId });
            fetchAllData(true);
        } catch (error) {
            console.error("Restore failed:", error);
            toast.error(`Restore failed: ${error.message}`, { id: toastId });
        } finally {
            setIsRestoring(false);
        }
    };

    const handleFetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const res = await AdminApi.getBackupLogs(60);
            setCustomLogs(res.logs || []);
            setShowLogs(true);
        } catch (err) {
            console.error("Failed to fetch logs:", err);
            toast.error("Failed to load logs");
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleCopyLogs = (logsArray) => {
        if (!logsArray) return;
        navigator.clipboard.writeText(logsArray.join("\n"));
        setCopiedLog(true);
        toast.success("Logs copied to clipboard");
        setTimeout(() => setCopiedLog(false), 2000);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setIsUserModalOpen(true);
    };

    const handleDeleteUser = async (userId) => {
        try {
            await AdminApi.deleteUser(userId);
            toast.success("User deleted successfully");
            fetchAllData(true);
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Failed to delete user");
        }
    };
    
    const handleRoleChange = async (userId, newRole) => {
        try {
            await AdminApi.updateUser(userId, { role: newRole });
            toast.success("Role updated successfully");
            fetchAllData(true);
        } catch (error) {
            console.error("Error updating role:", error);
            toast.error("Failed to update role");
        }
    };

    const handleExport = async (exportFormat) => {
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
    
          if (exportFormat === "json") {
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
          toast.success("Export generated successfully");
        } catch (e) {
          console.error("Export failed", e);
          toast.error("Export failed");
        }
    };

    const filteredUsers = useMemo(() => {
        if (!userFilter.trim()) return users;
        const q = userFilter.toLowerCase();
        return users.filter(u => 
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.full_name && u.full_name.toLowerCase().includes(q)) ||
            (u.company && u.company.toLowerCase().includes(q)) ||
            (u.role && u.role.toLowerCase().includes(q))
        );
    }, [users, userFilter]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <RefreshCw className="h-10 w-10 animate-spin text-cyan-400" />
                <p className="text-gray-400 text-sm animate-pulse">Loading system telemetry & dashboard...</p>
            </div>
        );
    }

    const backend = systemStatus?.backend || {};
    const db = systemStatus?.database || {};
    const sys = systemStatus?.system || {};
    const storage = systemStatus?.storage || {};
    const backupsInfo = systemStatus?.backups || {};
    const lastBackup = backupsInfo?.last_backup || (backups && backups[0]) || null;
    const gdrive = backupsInfo?.gdrive || {};
    const counts = db?.counts || {};

    const activeLogs = customLogs || backupsInfo?.recent_logs || [];

    return (
        <div className="text-white space-y-6 sm:space-y-8 pb-12">
            {/* Header with Live Status Pulse */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4 sm:pb-6">
                <div>
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
                        <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
                            <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
                                <span>Admin Dashboard</span>
                                <span className="flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] sm:text-xs font-semibold">
                                    <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    System Active
                                </span>
                            </h1>
                        </div>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm">
                        Real-time server telemetry, database status, disaster recovery, and user access control.
                    </p>
                </div>

                {/* Header Action Controls */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                    <Button
                        onClick={() => fetchAllData(true)}
                        disabled={refreshing}
                        variant="outline"
                        className="bg-white/5 hover:bg-white/10 border-white/20 text-white rounded-xl h-9 sm:h-10 text-xs font-semibold flex-1 sm:flex-initial"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>

                    <Button
                        onClick={() => handleTriggerBackup('db')}
                        disabled={isBackingUp}
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 rounded-xl h-9 sm:h-10 text-xs font-bold flex-1 sm:flex-initial"
                    >
                        {isBackingUp && backupTypeRunning === 'db' ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                            <Zap className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Quick DB Dump
                    </Button>

                    <Button
                        onClick={() => handleTriggerBackup('full')}
                        disabled={isBackingUp}
                        className="bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 rounded-xl h-9 sm:h-10 text-xs font-bold flex-1 sm:flex-initial"
                    >
                        {isBackingUp && backupTypeRunning === 'full' ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                            <Database className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Full Archive
                    </Button>
                </div>
            </div>

            {/* 4 Key Vitality Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Backend API Status */}
                <MetricStatCard 
                    title="Backend Status"
                    value="Operational"
                    subtitle={`Uptime: ${backend.uptime_formatted || 'Active'} • PID: ${backend.pid || '—'}`}
                    icon={Server}
                    iconColor="text-emerald-400"
                    badgeText={`Python ${backend.python_version || '3.12'}`}
                    badgeColor="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                />

                {/* 2. PostgreSQL DB Status */}
                <MetricStatCard 
                    title="PostgreSQL Engine"
                    value={db.size_formatted || "Healthy"}
                    subtitle={`Active Connections: ${db.active_connections || 0} • Ping: ${db.latency_ms || 1}ms`}
                    icon={Database}
                    iconColor="text-cyan-400"
                    badgeText={db.version ? db.version.split(' ')[0] + ' 16' : 'Postgres'}
                    badgeColor="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                />

                {/* 3. Disaster Recovery / Last Backup */}
                <MetricStatCard 
                    title="Last Backup"
                    value={lastBackup ? format(new Date(lastBackup.created_at), "MMM d, HH:mm") : "None"}
                    subtitle={lastBackup ? `${lastBackup.size_formatted} (${formatDistanceToNow(new Date(lastBackup.created_at), { addSuffix: true })})` : "No backups recorded"}
                    icon={ShieldCheck}
                    iconColor="text-sky-400"
                    badgeText={lastBackup?.type === 'full_archive' ? 'Full Archive' : 'DB Dump'}
                    badgeColor="bg-sky-500/10 text-sky-400 border border-sky-500/20"
                />

                {/* 4. Hardware Resources */}
                <MetricStatCard 
                    title="RAM Utilization"
                    value={`${sys.ram?.used_percent || 0}%`}
                    subtitle={`Used: ${sys.ram?.formatted_used || '0 B'} / ${sys.ram?.formatted_total || '0 B'}`}
                    icon={Cpu}
                    iconColor="text-amber-400"
                    badgeText={`Load: ${sys.load_average ? sys.load_average[0] : '0.00'}`}
                    badgeColor="bg-amber-500/10 text-amber-400 border border-amber-500/20"
                />
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl w-full grid grid-cols-2 lg:flex gap-1 h-auto">
                    <TabsTrigger 
                        value="telemetry" 
                        className="rounded-xl px-2.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/30 truncate"
                    >
                        <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 shrink-0" />
                        <span className="truncate">System Telemetry</span>
                    </TabsTrigger>
                    <TabsTrigger 
                        value="backups" 
                        className="rounded-xl px-2.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/30 truncate"
                    >
                        <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 shrink-0" />
                        <span className="truncate">Backups ({backups?.length || 0})</span>
                    </TabsTrigger>
                    <TabsTrigger 
                        value="users" 
                        className="rounded-xl px-2.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/30 truncate"
                    >
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 shrink-0" />
                        <span className="truncate">Users ({users?.length || 0})</span>
                    </TabsTrigger>
                    <TabsTrigger 
                        value="operations" 
                        className="rounded-xl px-2.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/30 truncate"
                    >
                        <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 shrink-0" />
                        <span className="truncate">Settings & Data</span>
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: System Health & Telemetry */}
                <TabsContent value="telemetry" className="space-y-6 focus:outline-none">
                    {/* Database Records & Entity Totals */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-cyan-400 shrink-0" />
                            <h2 className="text-lg sm:text-xl font-bold truncate">Database Entity Breakdown</h2>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 hover:border-cyan-500/30 transition-all min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] sm:text-xs text-gray-400 font-semibold uppercase truncate">Total Users</span>
                                    <Users className="h-4 w-4 text-cyan-400 shrink-0" />
                                </div>
                                <p className="text-xl sm:text-2xl font-bold">{counts.users || 0}</p>
                                <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1 truncate">{counts.admins || 0} Admins • {(counts.users || 0) - (counts.admins || 0)} Standard</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 hover:border-emerald-500/30 transition-all min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] sm:text-xs text-gray-400 font-semibold uppercase truncate">Time Logged</span>
                                    <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                                </div>
                                <p className="text-xl sm:text-2xl font-bold">{counts.total_hours ? counts.total_hours.toLocaleString() : 0} <span className="text-xs sm:text-sm font-normal text-gray-400">hrs</span></p>
                                <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1 truncate">{counts.time_entries || 0} total entries</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 hover:border-sky-500/30 transition-all min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] sm:text-xs text-gray-400 font-semibold uppercase truncate">Projects</span>
                                    <Briefcase className="h-4 w-4 text-sky-400 shrink-0" />
                                </div>
                                <p className="text-xl sm:text-2xl font-bold">{counts.projects || 0}</p>
                                <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1 truncate">{counts.active_projects || 0} active • {(counts.projects || 0) - (counts.active_projects || 0)} archived</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 hover:border-indigo-500/30 transition-all min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] sm:text-xs text-gray-400 font-semibold uppercase truncate">Payslip Files</span>
                                    <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                                </div>
                                <p className="text-xl sm:text-2xl font-bold">{counts.payslips || 0}</p>
                                <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1 truncate">Stored in database</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 hover:border-purple-500/30 transition-all min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] sm:text-xs text-gray-400 font-semibold uppercase truncate">Media Storage</span>
                                    <HardDrive className="h-4 w-4 text-purple-400 shrink-0" />
                                </div>
                                <p className="text-xl sm:text-2xl font-bold">{storage.media?.formatted_size || '0 B'}</p>
                                <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1 truncate">{storage.media?.files_count || 0} files on disk</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 hover:border-amber-500/30 transition-all min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] sm:text-xs text-gray-400 font-semibold uppercase truncate">Expenses</span>
                                    <Receipt className="h-4 w-4 text-amber-400 shrink-0" />
                                </div>
                                <p className="text-xl sm:text-2xl font-bold">£{counts.expenses_total ? counts.expenses_total.toFixed(2) : '0.00'}</p>
                                <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1 truncate">{counts.expenses || 0} expenses • {counts.receipts || 0} receipts</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 hover:border-pink-500/30 transition-all min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] sm:text-xs text-gray-400 font-semibold uppercase truncate">Trainings</span>
                                    <GraduationCap className="h-4 w-4 text-pink-400 shrink-0" />
                                </div>
                                <p className="text-xl sm:text-2xl font-bold">{counts.trainings || 0}</p>
                                <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1 truncate">Certificates on file</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 hover:border-teal-500/30 transition-all min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] sm:text-xs text-gray-400 font-semibold uppercase truncate">Holidays & Hotels</span>
                                    <Plane className="h-4 w-4 text-teal-400 shrink-0" />
                                </div>
                                <p className="text-xl sm:text-2xl font-bold">{counts.holidays || 0}</p>
                                <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1 truncate">{counts.hotels || 0} hotels • {counts.notes || 0} notes</p>
                            </div>
                        </div>
                    </div>

                    {/* Server Hardware & Storage Telemetry */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pt-2">
                        {/* Storage Partition Gauges */}
                        <GlassCard className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <HardDrive className="h-5 w-5 text-cyan-400 shrink-0" />
                                    <h3 className="font-bold text-base sm:text-lg truncate">Server Storage & Disks</h3>
                                </div>
                                <span className="text-[11px] sm:text-xs text-gray-400 font-mono shrink-0">{sys.hostname || 'Linux'}</span>
                            </div>

                            {/* Root Storage */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs gap-2">
                                    <span className="text-gray-300 font-medium truncate">Root ( / )</span>
                                    <span className="text-gray-400 font-mono shrink-0">
                                        {storage.disk_root?.formatted_used} / {storage.disk_root?.formatted_total} ({storage.disk_root?.used_percent}%)
                                    </span>
                                </div>
                                <Progress value={storage.disk_root?.used_percent || 0} className="h-2.5 bg-white/10" />
                                <p className="text-[11px] text-gray-400">
                                    Free space: <strong className="text-white">{storage.disk_root?.formatted_free}</strong> remaining
                                </p>
                            </div>

                            {/* SRV Storage */}
                            {storage.disk_srv && (
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <div className="flex justify-between text-xs gap-2">
                                        <span className="text-gray-300 font-medium truncate">Data ( /srv )</span>
                                        <span className="text-gray-400 font-mono shrink-0">
                                            {storage.disk_srv?.formatted_used} / {storage.disk_srv?.formatted_total} ({storage.disk_srv?.used_percent}%)
                                        </span>
                                    </div>
                                    <Progress value={storage.disk_srv?.used_percent || 0} className="h-2.5 bg-white/10" />
                                    <p className="text-[11px] text-gray-400">
                                        Free space: <strong className="text-white">{storage.disk_srv?.formatted_free}</strong> remaining
                                    </p>
                                </div>
                            )}

                            {/* Media & Backups sizes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5 text-xs">
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 min-w-0">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold truncate">Media Directory</p>
                                    <p className="font-bold text-sm text-cyan-300 mt-0.5">{storage.media?.formatted_size || '0 B'}</p>
                                    <p className="text-[10px] text-gray-500 truncate" title={storage.media?.path}>{storage.media?.path}</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 min-w-0">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold truncate">Backups Directory</p>
                                    <p className="font-bold text-sm text-indigo-300 mt-0.5">{storage.backups?.formatted_size || '0 B'}</p>
                                    <p className="text-[10px] text-gray-500 truncate" title={storage.backups?.path}>{storage.backups?.path}</p>
                                </div>
                            </div>
                        </GlassCard>

                        {/* System Specs & Environment */}
                        <GlassCard className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Activity className="h-5 w-5 text-emerald-400 shrink-0" />
                                    <h3 className="font-bold text-base sm:text-lg truncate">System Environment</h3>
                                </div>
                                <span className="text-[10px] sm:text-xs px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shrink-0">
                                    Production
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs">
                                <div className="space-y-1 min-w-0">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold truncate">Operating System</p>
                                    <p className="font-medium text-white truncate" title={sys.os}>{sys.os || 'Linux'}</p>
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold truncate">System Uptime</p>
                                    <p className="font-medium text-white truncate">{sys.uptime_formatted || 'N/A'}</p>
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold truncate">CPU Cores & Load</p>
                                    <p className="font-medium text-white truncate">
                                        {sys.cpu_cores || 1} Cores • {sys.load_average ? sys.load_average.join(', ') : '0.00'}
                                    </p>
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold truncate">Python & API</p>
                                    <p className="font-medium text-white truncate">Python {backend.python_version || '3.12'}</p>
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold truncate">Server Local Time</p>
                                    <p className="font-medium text-white truncate">
                                        {backend.server_time ? format(new Date(backend.server_time), "yyyy-MM-dd HH:mm:ss") : '—'}
                                    </p>
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold truncate">PostgreSQL</p>
                                    <p className="font-medium text-white truncate" title={db.version}>{db.version ? db.version.split(' ')[0] + ' 16' : 'PostgreSQL 16'}</p>
                                </div>
                            </div>

                            {/* RAM Gauge */}
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <div className="flex justify-between text-xs gap-2">
                                    <span className="text-gray-300 font-medium truncate">Memory (RAM)</span>
                                    <span className="text-gray-400 font-mono shrink-0">
                                        {sys.ram?.formatted_used} / {sys.ram?.formatted_total} ({sys.ram?.used_percent}%)
                                    </span>
                                </div>
                                <Progress value={sys.ram?.used_percent || 0} className="h-2.5 bg-white/10" />
                            </div>
                        </GlassCard>
                    </div>

                    {/* Scheduled Background Automations */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-cyan-400 shrink-0" />
                            <h2 className="text-lg sm:text-xl font-bold truncate">Automated Background Tasks & Crons</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Cron 1: DB Backup */}
                            <GlassCard className="p-4 sm:p-5 flex flex-col justify-between border-cyan-500/10 hover:border-cyan-500/30 transition-all">
                                <div>
                                    <div className="flex items-center gap-2.5 mb-3 min-w-0">
                                        <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                                            <Database className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-sm sm:text-base text-white truncate">Weekly DB SQL Dump</h3>
                                            <span className="text-[10px] font-mono text-cyan-400 block truncate">30 23 * * 6</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mb-3">
                                        Runs automated <code className="text-cyan-300">pg_dump</code> and compresses to <code className="text-cyan-300">.sql.gz</code> keeping 4 rolling copies.
                                    </p>
                                </div>
                                <div className="pt-3 border-t border-white/5 text-xs flex justify-between items-center text-gray-400 gap-2">
                                    <span className="truncate">Schedule:</span>
                                    <span className="text-white font-medium shrink-0">Saturdays 23:30 UTC</span>
                                </div>
                            </GlassCard>

                            {/* Cron 2: Google Drive Backup */}
                            <GlassCard className="p-4 sm:p-5 flex flex-col justify-between border-indigo-500/10 hover:border-indigo-500/30 transition-all">
                                <div>
                                    <div className="flex items-center gap-2.5 mb-3 min-w-0">
                                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-sm sm:text-base text-white truncate">Weekly Cloud Sync</h3>
                                            <span className="text-[10px] font-mono text-indigo-400 block truncate">45 23 * * 6</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mb-3">
                                        Packages database & media files into <code className="text-indigo-300">.tar.gz</code> archive and uploads to Google Drive.
                                    </p>
                                </div>
                                <div className="pt-3 border-t border-white/5 text-xs flex justify-between items-center text-gray-400 gap-2">
                                    <span className="truncate">Schedule:</span>
                                    <span className="text-white font-medium shrink-0">Saturdays 23:45 UTC</span>
                                </div>
                            </GlassCard>

                            {/* Cron 3: Payslip Downloader */}
                            <GlassCard className="p-4 sm:p-5 flex flex-col justify-between border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                                <div>
                                    <div className="flex items-center gap-2.5 mb-3 min-w-0">
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-sm sm:text-base text-white truncate">Payslip Auto-Fetcher</h3>
                                            <span className="text-[10px] font-mono text-emerald-400 block truncate">Thu, Fri, Sat</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mb-3">
                                        Polls email for new weekly payslips, extracts gross/tax/net, and stores PDFs in media library.
                                    </p>
                                </div>
                                <div className="pt-3 border-t border-white/5 text-xs flex justify-between items-center text-gray-400 gap-2">
                                    <span className="truncate">Last run:</span>
                                    <span className="text-white font-medium shrink-0">
                                        {systemStatus?.payslip_automation?.last_run ? format(new Date(systemStatus.payslip_automation.last_run), "MMM d, HH:mm") : 'Recent'}
                                    </span>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 2: Backups & Disaster Recovery */}
                <TabsContent value="backups" className="space-y-6 focus:outline-none">
                    {/* Header & Quick Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold">Disaster Recovery & Backup Archives</h2>
                            <p className="text-xs text-gray-400">
                                Total {backups?.length || 0} backup archives stored ({backupsInfo.total_backups_formatted || '0 B'}).
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button 
                                onClick={() => handleTriggerBackup('db')} 
                                disabled={isBackingUp}
                                className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-xl text-xs font-bold h-9"
                            >
                                {isBackingUp && backupTypeRunning === 'db' ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Zap className="h-3.5 w-3.5 mr-1.5" />}
                                Fast SQL Dump
                            </Button>

                            <Button 
                                onClick={() => handleTriggerBackup('full')} 
                                disabled={isBackingUp}
                                className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-bold h-9"
                            >
                                {isBackingUp && backupTypeRunning === 'full' ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Database className="h-3.5 w-3.5 mr-1.5" />}
                                Full DB + Media
                            </Button>

                            <Button 
                                onClick={handleFetchLogs} 
                                variant="outline"
                                className="bg-white/5 hover:bg-white/10 border-white/20 text-white rounded-xl text-xs h-9"
                            >
                                <Terminal className="h-3.5 w-3.5 mr-1.5" />
                                View Backup Logs
                            </Button>
                        </div>
                    </div>

                    {/* Google Drive Status Alert Notice */}
                    {gdrive.status === 'needs_reauth' && (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-300 text-xs">
                            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-bold text-amber-200">Google Drive Cloud Sync Notice</p>
                                <p>
                                    Local backup archives are created successfully, but Google Drive OAuth refresh returned <code className="bg-black/30 px-1 py-0.5 rounded text-amber-100">invalid_grant</code>. 
                                    To re-enable off-site cloud sync, run <code className="bg-black/30 px-1 py-0.5 rounded text-amber-100">python3 scripts/gdrive_auth.py</code> on the server.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Backups Table */}
                    <div className="overflow-x-auto rounded-2xl shadow-lg border border-white/20">
                        <div className="bg-white/10 backdrop-blur-xl p-1 min-w-[750px]">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="p-4 font-bold text-xs uppercase tracking-widest text-gray-400">Archive File</th>
                                        <th className="p-4 font-bold text-xs uppercase tracking-widest text-gray-400">Type</th>
                                        <th className="p-4 font-bold text-xs uppercase tracking-widest text-gray-400">Size</th>
                                        <th className="p-4 font-bold text-xs uppercase tracking-widest text-gray-400">Created</th>
                                        <th className="p-4 font-bold text-xs uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {backups && backups.length > 0 ? (
                                        backups.map((backup) => (
                                            <tr key={backup.filename} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-mono text-xs font-semibold text-white">
                                                    <div className="flex items-center gap-2">
                                                        <Database className="h-4 w-4 text-cyan-400 shrink-0" />
                                                        <span className="truncate max-w-[280px]" title={backup.filename}>{backup.filename}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {backup.type === 'full_archive' || (backup.filename && backup.filename.includes('gdrive')) ? (
                                                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30 text-[10px]">
                                                            Full Archive (DB + Media)
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 text-[10px]">
                                                            SQL Dump (pg_dump)
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="p-4 text-xs font-mono text-gray-300">{backup.size_formatted}</td>
                                                <td className="p-4 text-xs text-gray-300">
                                                    <div>{backup.created_at ? format(new Date(backup.created_at), "MMM d, yyyy HH:mm") : 'N/A'}</div>
                                                    <div className="text-[10px] text-gray-500">
                                                        {backup.created_at ? formatDistanceToNow(new Date(backup.created_at), { addSuffix: true }) : ''}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            onClick={() => handleDownloadBackup(backup.filename)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
                                                        >
                                                            <Download className="h-3.5 w-3.5 mr-1" />
                                                            Download
                                                        </Button>

                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    disabled={isRestoring}
                                                                    className="h-8 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/20"
                                                                >
                                                                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                                                    Restore
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="bg-gray-900 border-white/20 text-white">
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle className="flex items-center gap-2 text-rose-400">
                                                                        <ShieldAlert className="h-5 w-5" />
                                                                        Confirm Database Restore
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription className="text-gray-400 space-y-4">
                                                                        <p>
                                                                            You are about to restore data from backup archive:
                                                                            <strong className="text-white block font-mono text-xs mt-1 bg-black/40 p-2 rounded border border-white/10">
                                                                                {backup.filename}
                                                                            </strong>
                                                                        </p>
                                                                        <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-rose-400 text-xs space-y-1">
                                                                            <p><strong>DANGER / DESTRUCTIVE ACTION:</strong></p>
                                                                            <p>
                                                                                This will permanently drop and replace all tables in the database with data from this snapshot.
                                                                                {backup.type === 'full_archive' && " Media folder files will also be restored."}
                                                                            </p>
                                                                        </div>
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel className="bg-white/5 border-white/10 text-white">Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction 
                                                                        onClick={() => handleRestoreBackup(backup.filename)}
                                                                        className="bg-rose-500 hover:bg-rose-600 text-white font-bold"
                                                                    >
                                                                        Yes, Restore Now
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500 text-sm">
                                                No backups found in <code className="text-xs text-gray-400">/srv/backups/timesheet</code>.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Live Terminal Log Console */}
                    <GlassCard className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Terminal className="h-4 w-4 text-cyan-400" />
                                <h3 className="font-bold text-sm text-white">Backup Execution Logs</h3>
                                <span className="text-[10px] text-gray-500 font-mono">(/srv/backups/timesheet/backup.log)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => handleCopyLogs(activeLogs)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-gray-400 hover:text-white bg-white/5"
                                >
                                    {copiedLog ? <Check className="h-3 w-3 mr-1 text-emerald-400" /> : <Copy className="h-3 w-3 mr-1" />}
                                    {copiedLog ? "Copied" : "Copy Logs"}
                                </Button>
                                <Button
                                    onClick={() => setShowLogs(!showLogs)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-gray-400 hover:text-white bg-white/5"
                                >
                                    {showLogs ? "Hide" : "Expand"}
                                </Button>
                            </div>
                        </div>

                        {showLogs && (
                            <div className="bg-black/70 border border-white/10 rounded-xl p-3 font-mono text-xs max-h-64 overflow-y-auto space-y-1 text-gray-300">
                                {loadingLogs ? (
                                    <div className="py-4 text-center text-gray-500 flex items-center justify-center gap-2">
                                        <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                                        Loading logs...
                                    </div>
                                ) : activeLogs && activeLogs.length > 0 ? (
                                    activeLogs.map((logLine, idx) => {
                                        const isErr = logLine.toLowerCase().includes("fail") || logLine.toLowerCase().includes("error") || logLine.toLowerCase().includes("invalid_grant");
                                        const isOk = logLine.toLowerCase().includes("success") || logLine.toLowerCase().includes("complete");
                                        return (
                                            <div 
                                                key={idx} 
                                                className={`leading-relaxed ${isErr ? 'text-rose-400' : isOk ? 'text-emerald-400' : 'text-gray-300'}`}
                                            >
                                                {logLine}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-gray-500 text-center py-2">No log entries available.</p>
                                )}
                            </div>
                        )}
                    </GlassCard>
                </TabsContent>

                {/* TAB 3: User Access Control */}
                <TabsContent value="users" className="space-y-6 focus:outline-none">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold">User Directory & Roles</h2>
                            <p className="text-xs text-gray-400">
                                Manage registered users, assign administrator privileges, and update hourly rates.
                            </p>
                        </div>

                        {/* Search bar */}
                        <div className="relative w-full sm:w-72">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by name or email..."
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-xs rounded-xl h-9"
                            />
                        </div>
                    </div>

                    {isMobile ? (
                        <AdminMobileView 
                            users={filteredUsers} 
                            handleEditUser={handleEditUser} 
                            handleDeleteUser={handleDeleteUser} 
                            handleRoleChange={handleRoleChange} 
                        />
                    ) : (
                        <AdminDesktopView 
                            users={filteredUsers} 
                            handleEditUser={handleEditUser} 
                            handleDeleteUser={handleDeleteUser} 
                            handleRoleChange={handleRoleChange} 
                        />
                    )}
                </TabsContent>

                {/* TAB 4: Settings & Data Operations */}
                <TabsContent value="operations" className="space-y-6 focus:outline-none">
                    {/* Public Signups Toggle Card */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-cyan-400 shrink-0" />
                            <h2 className="text-lg sm:text-xl font-bold truncate">System Security & Access</h2>
                        </div>

                        <GlassCard className="p-4 sm:p-6 border-cyan-500/10 hover:border-cyan-500/20 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="min-w-0">
                                <h3 className="font-bold text-base sm:text-lg">Public Signups</h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    When disabled, the "Sign Up" button on the login screen is hidden and new Google user registration is blocked.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${signupEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                    {signupEnabled ? 'ENABLED' : 'DISABLED'}
                                </span>
                                <Button
                                    onClick={handleToggleSignup}
                                    disabled={isUpdatingSignup}
                                    className={`px-4 py-2 text-xs font-bold rounded-xl ${signupEnabled ? 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}`}
                                >
                                    {isUpdatingSignup ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                                    {signupEnabled ? 'Disable Signups' : 'Enable Signups'}
                                </Button>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Data Import & Export Widgets */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-cyan-400 shrink-0" />
                            <h2 className="text-lg sm:text-xl font-bold truncate">Data Import & Export Utilities</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {/* Import Widget */}
                            <GlassCard className="p-4 sm:p-6 flex flex-col border-cyan-500/10 hover:border-cyan-500/30 transition-all">
                                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 min-w-0">
                                    <div className="p-2.5 sm:p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 shrink-0">
                                        <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-base sm:text-lg truncate">Batch Import</h3>
                                        <p className="text-xs text-gray-500 truncate">Restore or load data from JSON</p>
                                    </div>
                                </div>
                                <div className="mt-auto">
                                    <ImportData onImported={() => fetchAllData(true)} onMenuStateChange={() => {}} />
                                </div>
                            </GlassCard>

                            {/* Export CSV Widget */}
                            <GlassCard className="p-4 sm:p-6 flex flex-col border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 min-w-0">
                                    <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 shrink-0">
                                        <FileSpreadsheet className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-base sm:text-lg truncate">Excel / CSV Export</h3>
                                        <p className="text-xs text-gray-500 truncate">Generate tabular timesheet CSV</p>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => handleExport("csv")}
                                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 mt-auto font-bold py-5 sm:py-6 rounded-xl text-xs"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download CSV
                                </Button>
                            </GlassCard>

                            {/* Export JSON Widget */}
                            <GlassCard className="p-4 sm:p-6 flex flex-col border-purple-500/10 hover:border-purple-500/30 transition-all">
                                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 min-w-0">
                                    <div className="p-2.5 sm:p-3 rounded-2xl bg-purple-500/10 text-purple-400 shrink-0">
                                        <FileJson className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-base sm:text-lg truncate">Full JSON Backup</h3>
                                        <p className="text-xs text-gray-500 truncate">Structured JSON application backup</p>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => handleExport("json")}
                                    className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 mt-auto font-bold py-5 sm:py-6 rounded-xl text-xs"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download JSON
                                </Button>
                            </GlassCard>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
            
            {/* User Edit Modal */}
            <UserFormModal
                isOpen={isUserModalOpen}
                onClose={() => {
                    setIsUserModalOpen(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
                onSave={() => {
                    fetchAllData(true);
                    setIsUserModalOpen(false);
                    setSelectedUser(null);
                }}
            />
        </div>
    );
}
