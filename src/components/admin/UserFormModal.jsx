import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { client } from '@/api/timesheetClient';

const AdminApi = {
    getUser: (userId) => client.fetchJson(`/admin/users/${userId}`),
    updateUser: (userId, data) => client.fetchJson(`/admin/users/${userId}`, { method: 'PUT', body: data }),
};

export default function UserFormModal({ isOpen, onClose, user, onSave }) {
    const [formData, setFormData] = useState({
        full_name: '',
        company: '',
        wage: '',
        role: 'user',
    });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && user) {
            setLoading(true);
            AdminApi.getUser(user.id)
                .then(data => {
                    setFormData({
                        full_name: data.full_name || '',
                        company: data.company || '',
                        wage: data.wage !== null ? data.wage.toString() : '',
                        role: data.role || 'user',
                    });
                })
                .catch(error => {
                    console.error("Error fetching user details:", error);
                    toast({
                        variant: "destructive",
                        title: "Failed to load user details",
                        description: error.message,
                    });
                    onClose();
                })
                .finally(() => setLoading(false));
        } else if (isOpen && !user) {
            // For creating a new user (if that functionality were added later)
            setFormData({
                full_name: '',
                company: '',
                wage: '',
                role: 'user',
            });
        }
    }, [isOpen, user, toast, onClose]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSelectChange = (value) => {
        setFormData(prev => ({
            ...prev,
            role: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToSave = {
                ...formData,
                wage: formData.wage !== '' ? parseFloat(formData.wage) : null,
            };
            await AdminApi.updateUser(user.id, dataToSave);
            toast({
                title: "User updated",
                description: "User details have been successfully updated.",
            });
            onSave();
        } catch (error) {
            console.error("Error updating user:", error);
            toast({
                variant: "destructive",
                title: "Failed to update user",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-800/80 backdrop-blur-lg border-white/20 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{user ? `Edit User: ${user.full_name || user.email}` : "Add New User"}</DialogTitle>
                </DialogHeader>
                {loading ? (
                    <div className="text-center py-8">Loading user details...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="full_name" className="text-right">Full Name</Label>
                            <Input id="full_name" value={formData.full_name} onChange={handleChange} className="col-span-3 bg-white/10 border-white/20 text-white" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="company" className="text-right">Company</Label>
                            <Input id="company" value={formData.company} onChange={handleChange} className="col-span-3 bg-white/10 border-white/20 text-white" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="wage" className="text-right">Hourly Rate</Label>
                            <Input id="wage" type="number" step="0.01" value={formData.wage} onChange={handleChange} className="col-span-3 bg-white/10 border-white/20 text-white" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">Role</Label>
                            <Select value={formData.role} onValueChange={handleSelectChange}>
                                <SelectTrigger className="col-span-3 bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800/80 backdrop-blur-lg border-white/20 text-white">
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>Save changes</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}