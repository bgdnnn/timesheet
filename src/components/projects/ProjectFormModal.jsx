
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Project } from "@/api/entities";
import { toast } from "sonner";

const ModalOverlay = ({ children, onClose }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
    >
        {children}
    </motion.div>
);

const ModalContent = ({ children, onClose, className = "" }) => (
    <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`relative bg-gray-800/50 backdrop-blur-2xl border border-white/20 text-white rounded-2xl shadow-2xl p-8 w-full ${className}`}
        onClick={(e) => e.stopPropagation()}
    >
        <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
        >
            <X className="h-5 w-5" />
        </Button>
        {children}
    </motion.div>
);

export default function ProjectFormModal({ isOpen, onClose, onSave, project }) {
    const [name, setName] = useState("");
    const [client, setClient] = useState("");
    const [contract, setContract] = useState("");
    const [defaultHoursWorked, setDefaultHoursWorked] = useState(8);
    const [defaultTravelTime, setDefaultTravelTime] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (project) {
            setName(project.name);
            setClient(project.client);
            setContract(project.contract || "");
            setDefaultHoursWorked(project.default_hours_worked);
            setDefaultTravelTime(project.default_travel_time || 0);
        } else {
            setName("");
            setClient("");
            setContract("");
            setDefaultHoursWorked(8);
            setDefaultTravelTime(0);
        }
    }, [project]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const projectData = {
            name,
            client,
            contract,
            default_hours_worked: parseFloat(defaultHoursWorked),
            default_travel_time: parseFloat(defaultTravelTime),
        };

        try {
            if (project) {
                await Project.update(project.id, projectData);
                toast.success("Project updated successfully.");
            } else {
                await Project.create(projectData);
                toast.success("Project created successfully.");
            }
            onSave();
        } catch (error) {
            console.error("Failed to save project:", error);
            toast.error("Failed to save project.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <ModalOverlay onClose={onClose}>
            <ModalContent onClose={onClose} className="mx-4 max-w-sm sm:max-w-md">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 pr-8">
                    {project ? "Edit" : "Add"} Project
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label className="text-sm md:text-base">Project Name</Label>
                        <Input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            required 
                            className="mt-2 bg-white/10 border-white/20 text-sm md:text-base h-9 md:h-10" 
                        />
                    </div>
                    <div>
                        <Label className="text-sm md:text-base">Client</Label>
                        <Input 
                            value={client} 
                            onChange={(e) => setClient(e.target.value)} 
                            required 
                            className="mt-2 bg-white/10 border-white/20 text-sm md:text-base h-9 md:h-10" 
                        />
                    </div>
                    <div>
                        <Label className="text-sm md:text-base">Contract/Reference</Label>
                        <Input 
                            value={contract} 
                            onChange={(e) => setContract(e.target.value)} 
                            className="mt-2 bg-white/10 border-white/20 text-sm md:text-base h-9 md:h-10" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div>
                            <Label className="text-sm md:text-base">Default Hours</Label>
                            <Input 
                                type="number" 
                                step="0.25"
                                value={defaultHoursWorked} 
                                onChange={(e) => setDefaultHoursWorked(e.target.value)} 
                                required 
                                className="mt-2 bg-white/10 border-white/20 text-sm md:text-base h-9 md:h-10" 
                            />
                        </div>
                        <div>
                            <Label className="text-sm md:text-base">Default Travel</Label>
                            <Input 
                                type="number" 
                                step="0.25"
                                value={defaultTravelTime} 
                                onChange={(e) => setDefaultTravelTime(e.target.value)} 
                                className="mt-2 bg-white/10 border-white/20 text-sm md:text-base h-9 md:h-10" 
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button 
                            type="submit" 
                            disabled={isSaving} 
                            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg px-4 md:px-6 py-2 transition-all text-sm md:text-base"
                        >
                            {isSaving ? "Saving..." : "Save Project"}
                        </Button>
                    </div>
                </form>
            </ModalContent>
        </ModalOverlay>
    );
}
