
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, X, Trash2, Bed } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimeEntry } from "@/api/entities";
import { format } from "date-fns";

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

export default function TimeEntryModal({ isOpen, onClose, projects, hotels, selectedDate, onSave, entry, onDelete, allEntries }) {
    const [date, setDate] = useState(selectedDate);
    const [projectId, setProjectId] = useState(entry?.project_id || "");
    const [hotelId, setHotelId] = useState(entry?.hotel_id || "none");
    const [hoursWorked, setHoursWorked] = useState(entry?.hours_worked || 0);
    const [travelTime, setTravelTime] = useState(entry?.travel_time || 0);
    const [isSaving, setIsSaving] = useState(false);
    const [sortedProjects, setSortedProjects] = useState([]);

    useEffect(() => {
        if (entry) {
            setDate(new Date(entry.date));
            setProjectId(entry.project_id);
            setHotelId(entry.hotel_id || "none");
            setHoursWorked(entry.hours_worked);
            setTravelTime(entry.travel_time);
        } else {
            setDate(selectedDate);
            setProjectId("");
            setHotelId("none");
            setHoursWorked(0);
            setTravelTime(0);
        }
    }, [entry, selectedDate]);

    useEffect(() => {
        if (!projects) {
            setSortedProjects([]);
            return;
        }

        if (!allEntries || allEntries.length === 0) {
            // If no entries, sort alphabetically
            const sorted = [...projects].sort((a, b) => a.name.localeCompare(b.name));
            setSortedProjects(sorted);
            return;
        }

        const lastUsedMap = new Map();
        // Sort entries by date descending to find the last usage
        const sortedEntries = [...allEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        for (const entry of sortedEntries) {
            if (!lastUsedMap.has(entry.project_id)) {
                lastUsedMap.set(entry.project_id, new Date(entry.date).getTime());
            }
        }

        const sorted = [...projects].sort((a, b) => {
            const lastUsedA = lastUsedMap.get(a.id);
            const lastUsedB = lastUsedMap.get(b.id);

            if (lastUsedA && lastUsedB) {
                return lastUsedB - lastUsedA; // Most recent first
            }
            if (lastUsedA) return -1; // A has been used, B hasn't
            if (lastUsedB) return 1;  // B has been used, A hasn't

            return a.name.localeCompare(b.name); // Alphabetical for unused
        });

        setSortedProjects(sorted);
    }, [projects, allEntries]);

    const handleProjectChange = (id) => {
        setProjectId(id);
        const selectedProject = projects.find(p => p.id === id);
        if (selectedProject) {
            setHoursWorked(selectedProject.default_hours_worked || 0);
            setTravelTime(selectedProject.default_travel_time || 0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const selectedProject = projects.find(p => p.id === projectId);
        if (!selectedProject) {
            console.error("Project not found");
            setIsSaving(false);
            return;
        }

        const selectedHotel = hotelId !== "none" ? hotels.find(h => h.id === hotelId) : null;
        const finalHotelId = hotelId === "none" ? null : hotelId;
        
        const entryData = {
            date: format(date, "yyyy-MM-dd"),
            project_id: projectId,
            project_name: selectedProject.name,
            hours_worked: parseFloat(hoursWorked),
            travel_time: parseFloat(travelTime),
            hotel_id: parseFloat(travelTime) > 0 ? finalHotelId : null,
            hotel_name: parseFloat(travelTime) > 0 ? (selectedHotel?.name || null) : null,
        };

        try {
            if (entry) {
                await TimeEntry.update(entry.id, entryData);
            } else {
                await TimeEntry.create(entryData);
            }
            onSave();
        } catch (error) {
            console.error("Failed to save entry:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!entry || !onDelete) return;
        if (window.confirm("Are you sure you want to delete this time entry?")) {
            try {
                await onDelete(entry.id);
            } catch (error) {
                console.error("Failed to delete entry:", error);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <ModalOverlay onClose={onClose}>
            <ModalContent onClose={onClose} className="mx-4 max-w-sm sm:max-w-md">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 pr-8">
                    {entry ? "Edit" : "Add"} Time Entry
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                    <div>
                        <Label className="text-sm md:text-base">Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start font-normal mt-2 bg-white/10 border-white/20 hover:bg-white/20 text-sm md:text-base h-9 md:h-10">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-gray-800/80 backdrop-blur-lg border-white/20 text-white" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div>
                        <Label className="text-sm md:text-base">Project</Label>
                        <Select value={projectId} onValueChange={handleProjectChange}>
                            <SelectTrigger className="mt-2 bg-white/10 border-white/20 text-sm md:text-base h-9 md:h-10">
                                <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800/80 backdrop-blur-lg border-white/20 text-white">
                                {sortedProjects.map(p => (
                                    <SelectItem key={p.id} value={p.id} className="text-sm md:text-base">
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div>
                            <Label className="text-sm md:text-base">Hours Worked</Label>
                            <Input 
                                type="number" 
                                step="0.25"
                                value={hoursWorked} 
                                onChange={e => setHoursWorked(e.target.value)} 
                                className="mt-2 bg-white/10 border-white/20 text-sm md:text-base h-9 md:h-10"
                            />
                        </div>
                        <div>
                            <Label className="text-sm md:text-base">Travel Time (h)</Label>
                            <Input 
                                type="number" 
                                step="0.25"
                                value={travelTime} 
                                onChange={e => setTravelTime(e.target.value)} 
                                className="mt-2 bg-white/10 border-white/20 text-sm md:text-base h-9 md:h-10"
                            />
                        </div>
                    </div>

                    {parseFloat(travelTime) > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }} 
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <Label className="text-sm md:text-base flex items-center"><Bed className="mr-2 h-4 w-4"/>Hotel</Label>
                            <Select value={hotelId} onValueChange={setHotelId}>
                                <SelectTrigger className="mt-2 bg-white/10 border-white/20 text-sm md:text-base h-9 md:h-10">
                                    <SelectValue placeholder="Select a hotel (optional)" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800/80 backdrop-blur-lg border-white/20 text-white">
                                    <SelectItem value="none" className="text-sm md:text-base">N/A</SelectItem>
                                    {hotels.map(h => (
                                        <SelectItem key={h.id} value={h.id} className="text-sm md:text-base">
                                            {h.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </motion.div>
                    )}

                    <div className="flex justify-end items-center pt-4 gap-4">
                        {entry && onDelete && (
                             <Button 
                                type="button" 
                                variant="ghost"
                                onClick={handleDelete} 
                                className="text-red-400 hover:bg-red-500/20 hover:text-red-300 mr-auto rounded-lg"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        )}
                        <Button 
                            type="submit" 
                            disabled={isSaving} 
                            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg px-4 md:px-6 py-2 transition-all text-sm md:text-base"
                        >
                            {isSaving ? "Saving..." : (entry ? "Update Entry" : "Add Entry")}
                        </Button>
                    </div>
                </form>
            </ModalContent>
        </ModalOverlay>
    );
}
