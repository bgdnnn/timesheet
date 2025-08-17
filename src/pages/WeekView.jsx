
import React, { useState, useEffect, useCallback } from "react";
import { Project } from "@/api/entities";
import { TimeEntry } from "@/api/entities";
import { Hotel } from "@/api/entities"; // Added import
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { format, startOfWeek, addDays, subDays, isSameDay } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import TimeEntryModal from "../components/week-view/TimeEntryModal";
import WeekSummary from "../components/week-view/WeekSummary";

const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg ${className}`}>
        {children}
    </div>
);

export default function WeekView() {
    const [user, setUser] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [allEntries, setAllEntries] = useState([]); // Changed from weekEntries
    const [projects, setProjects] = useState([]);
    const [hotels, setHotels] = useState([]); // Added state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedEntry, setSelectedEntry] = useState(null);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    const fetchData = useCallback(async () => {
        try {
            const currentUser = await User.me();
            setUser(currentUser);
            
            // Fetch projects, entries, and hotels in parallel
            const [fetchedProjects, fetchedEntries, fetchedHotels] = await Promise.all([
                Project.filter({ created_by: currentUser.email }),
                TimeEntry.filter({ created_by: currentUser.email }),
                Hotel.filter({ created_by: currentUser.email }, "name") // Fetch hotels
            ]);

            // Create a map to store the latest entry date for each project
            const projectLastUsedDates = {};
            fetchedEntries.forEach(entry => {
                const entryDate = new Date(entry.date);
                if (!projectLastUsedDates[entry.project_id] || entryDate > projectLastUsedDates[entry.project_id]) {
                    projectLastUsedDates[entry.project_id] = entryDate;
                }
            });

            // Sort projects based on their last used date (most recent first)
            const sortedProjects = [...fetchedProjects].sort((a, b) => {
                const dateA = projectLastUsedDates[a.id];
                const dateB = projectLastUsedDates[b.id];

                // If both have entries, sort by date (descending)
                if (dateA && dateB) {
                    return dateB.getTime() - dateA.getTime();
                } 
                // If only A has entries, A comes before B
                else if (dateA) {
                    return -1;
                } 
                // If only B has entries, B comes before A
                else if (dateB) {
                    return 1;
                } 
                // If neither has entries, maintain original relative order
                else {
                    return 0;
                }
            });

            setProjects(sortedProjects);
            setAllEntries(fetchedEntries); // Changed from setWeekEntries
            setHotels(fetchedHotels); // Set hotels state

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePreviousWeek = () => setCurrentDate(subDays(currentDate, 7));
    const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const handleGoToToday = () => setCurrentDate(new Date());

    const openModalForDate = (date) => {
        setSelectedDate(date);
        setSelectedEntry(null);
        setIsModalOpen(true);
    };

    const openModalForEntry = (entry) => {
        setSelectedEntry(entry);
        setSelectedDate(new Date(entry.date));
        setIsModalOpen(true);
    }
    
    const handleEntrySave = async () => {
        setIsModalOpen(false);
        fetchData();
    };

    const handleDeleteEntry = async (entryId) => {
        await TimeEntry.delete(entryId);
        // The modal closing is handled by the parent component (TimeEntryModal itself) after deletion.
        fetchData();
    };

    const getEntriesForDay = (day) => {
        return allEntries.filter(entry => isSameDay(new Date(entry.date), day));
    };

    // Filter allEntries to get only entries for the current displayed week
    const currentWeekEntries = allEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= weekStart && entryDate < addDays(weekStart, 7);
    });

    const totalWeekHours = currentWeekEntries.reduce((acc, entry) => {
        return acc + (entry.hours_worked || 0) + (entry.travel_time || 0);
    }, 0);


    return (
        <div className="text-white">
            <AnimatePresence>
                {isModalOpen && (
                    <TimeEntryModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        projects={projects}
                        hotels={hotels} // Added prop
                        allEntries={allEntries} // Added/updated prop
                        selectedDate={selectedDate}
                        onSave={handleEntrySave}
                        entry={selectedEntry}
                        onDelete={handleDeleteEntry}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
                <div className="text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold">Week View</h1>
                    <p className="text-sm md:text-base text-gray-300">
                        {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM, d yyyy")}
                    </p>
                </div>
                <div className="flex items-center justify-center md:justify-end gap-2 md:gap-4">
                     <GlassCard className="flex items-center p-2 rounded-xl">
                        <span className="text-xs md:text-sm px-2 md:px-4">
                            Total: <span className="font-bold text-sm md:text-lg">{totalWeekHours.toFixed(1)}h</span>
                        </span>
                     </GlassCard>
                     <Button
                        onClick={() => openModalForDate(new Date())}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-lg border border-white/30 text-white rounded-lg px-3 md:px-4 py-2 flex items-center gap-2 transition-all text-sm md:text-base"
                    >
                        <Plus className="h-4 w-4 md:h-5 md:w-5" /> 
                        <span className="hidden sm:inline">Add Entry</span>
                        <span className="sm:hidden">Add</span>
                    </Button>
                </div>
            </div>

            {/* Week Navigation */}
            <div className="flex justify-center items-center gap-3 md:gap-4 mb-6 md:mb-8">
                <Button onClick={handlePreviousWeek} variant="ghost" size="icon" className="bg-white/10 rounded-full hover:bg-white/20 h-8 w-8 md:h-10 md:w-10">
                    <ChevronLeft className="h-4 w-4 md:h-5 w-5"/>
                </Button>
                <Button onClick={handleGoToToday} variant="ghost" className="bg-white/10 rounded-lg hover:bg-white/20 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2">
                    Today
                </Button>
                
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="bg-white/10 rounded-full hover:bg-white/20 h-8 w-8 md:h-10 md:w-10">
                            <CalendarDays className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-800/80 backdrop-blur-lg border-white/20 text-white" align="center">
                        <Calendar
                            mode="single"
                            selected={currentDate}
                            onSelect={(date) => {
                                if (date) {
                                    setCurrentDate(date);
                                }
                            }}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                <Button onClick={handleNextWeek} variant="ghost" size="icon" className="bg-white/10 rounded-full hover:bg-white/20 h-8 w-8 md:h-10 md:w-10">
                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5"/>
                </Button>
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 md:gap-4">
                {weekDays.map((day, index) => {
                    const dayEntries = getEntriesForDay(day);
                    const totalDayHours = dayEntries.reduce((acc, entry) => acc + (entry.hours_worked || 0) + (entry.travel_time || 0), 0);
                    return (
                        <GlassCard key={index} className="p-3 md:p-4 flex flex-col min-h-fit">
                            <div className="text-center mb-3 md:mb-4">
                                <p className="font-bold text-base md:text-lg">{format(day, "EEE")}</p>
                                <p className={`text-sm ${isSameDay(day, new Date()) ? 'text-cyan-400' : 'text-gray-300'}`}>
                                    {format(day, "d")}
                                </p>
                            </div>
                            <div className="flex-grow space-y-2 md:space-y-3">
                                {dayEntries.map(entry => (
                                    <motion.div 
                                        key={entry.id} 
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        onClick={() => openModalForEntry(entry)}
                                        className="bg-white/5 p-2 md:p-3 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 active:bg-white/15 transition-all"
                                    >
                                        <p className="font-semibold text-xs md:text-sm truncate">{entry.project_name}</p>
                                        <p className="text-xs text-gray-300">
                                            {entry.hours_worked || 0}h work
                                            {entry.travel_time > 0 && <span>, {entry.travel_time}h travel</span>}
                                        </p>
                                    </motion.div>
                                ))}
                                {dayEntries.length === 0 && (
                                    <div 
                                        onClick={() => openModalForDate(day)}
                                        className="flex items-center justify-center h-12 md:h-16 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all"
                                    >
                                        <Plus className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <div className="mt-3 md:mt-4 border-t border-white/20 pt-2 text-center">
                                <span className="font-bold text-sm md:text-base text-gray-200">
                                    {totalDayHours.toFixed(1)}h
                                </span>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>

            {/* Week Summary Component */}
            <WeekSummary 
                weekEntries={allEntries} 
                weekStart={weekStart} 
                user={user} 
            />
        </div>
    );
}
