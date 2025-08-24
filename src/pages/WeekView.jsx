// src/pages/WeekView.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Project, TimeEntry, Hotel, User, Payslips, Receipts, WeeklyEarnings } from "@/api/entities.js";
import { uploadPayslip } from "@/api/payslips.js";
import { Button } from "@/components/ui/button.jsx";
import { Plus, ChevronLeft, ChevronRight, CalendarDays, ReceiptText, RefreshCw } from "lucide-react";
import { format, startOfWeek as fnsStartOfWeek, addDays, subDays, isSameDay } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx";
import { Calendar } from "@/components/ui/calendar.jsx";
import TimeEntryModal from "@/components/week-view/TimeEntryModal.jsx";
import WeekSummary from "@/components/week-view/WeekSummary.jsx";

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg ${className}`}>
    {children}
  </div>
);

export default function WeekView() {
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allEntries, setAllEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [weekPayslip, setWeekPayslip] = useState(null);
  const [weekEarnings, setWeekEarnings] = useState(null);
  const [receiptsByDay, setReceiptsByDay] = useState({}); // { 'yyyy-MM-dd': count }
  const [isCalculating, setIsCalculating] = useState(false);

  const inFlightRef = useRef(false);

  const weekStart = useMemo(() => fnsStartOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const fetchData = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const [fetchedProjects, fetchedEntries, fetchedHotels, fetchedPayslip, fetchedReceipts, fetchedWeeklyEarnings] = await Promise.all([
        Project.filter({ created_by: currentUser.email }),
        TimeEntry.filter({ created_by: currentUser.email }),
        Hotel.filter({ created_by: currentUser.email }, "name"),
        Payslips.forWeek(format(weekStart, "yyyy-MM-dd")),
        // pull all user's receipts, sort server-side desc if your API supports it
        Receipts.list({ created_by: currentUser.email }, "created_at_desc"),
        WeeklyEarnings.forWeek(format(weekStart, "yyyy-MM-dd")),
      ]);

      const lastByProject = {};
      fetchedEntries.forEach((e) => {
        const d = new Date(e.date);
        if (!lastByProject[e.project_id] || d > lastByProject[e.project_id]) {
          lastByProject[e.project_id] = d;
        }
      });
      const sortedProjects = [...fetchedProjects].sort((a, b) => {
        const da = lastByProject[a.id];
        const db = lastByProject[b.id];
        if (da && db) return db.getTime() - da.getTime();
        if (da) return -1;
        if (db) return 1;
        return (a.name || "").localeCompare(b.name || "");
      });

      // build receipts count map for current week
      const start = weekStart;
      const end = addDays(weekStart, 7);
      const byDay = {};
      (fetchedReceipts || []).forEach((r) => {
        const d = new Date(r.receipt_date || r.created_at);
        if (d >= start && d < end) {
          const key = format(d, "yyyy-MM-dd");
          byDay[key] = (byDay[key] || 0) + 1;
        }
      });

      setProjects(sortedProjects);
      setAllEntries(fetchedEntries);
      setHotels(fetchedHotels);
      setWeekPayslip(fetchedPayslip || null);
      setWeekEarnings(fetchedWeeklyEarnings || null);
      setReceiptsByDay(byDay);
    } catch (err) {
      console.error("fetchData error:", err);
    } finally {
      inFlightRef.current = false;
    }
  }, [weekStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePayslipUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await uploadPayslip({ week_start: format(weekStart, "yyyy-MM-dd"), file });
      await fetchData(); // Refresh data after upload
    } catch (error) {
      console.error("Payslip upload failed:", error);
      // Optionally, show an error message to the user
    }
  };

  const handleRecalculate = async () => {
    setIsCalculating(true);
    try {
        await WeeklyEarnings.recalculate();
        await fetchData(); // Refresh data after recalculation
    } catch (error) {
        console.error("Recalculation failed:", error);
        // Optionally, show an error message to the user
    } finally {
        setIsCalculating(false);
    }
  };

  const handlePreviousWeek = () => setCurrentDate((d) => subDays(d, 7));
  const handleNextWeek = () => setCurrentDate((d) => addDays(d, 7));
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
  };

  const handleEntrySave = async () => {
    setIsModalOpen(false);
    await fetchData();
  };

  const handleDeleteEntry = async (entryId) => {
    await TimeEntry.delete(entryId);
    await fetchData();
  };

  const getEntriesForDay = (day) => allEntries.filter((e) => isSameDay(new Date(e.date), day));

  const currentWeekEntries = useMemo(
    () =>
      allEntries.filter((e) => {
        const d = new Date(e.date);
        return d >= weekStart && d < addDays(weekStart, 7);
      }),
    [allEntries, weekStart]
  );

  const totalWeekHours = useMemo(
    () => currentWeekEntries.reduce((acc, e) => acc + (Number(e.hours_worked || 0) + Number(e.travel_time || 0)), 0),
    [currentWeekEntries]
  );

  return (
    <div className="text-white">
      <AnimatePresence>
        {isModalOpen && (
          <TimeEntryModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            projects={projects}
            hotels={hotels}
            allEntries={allEntries}
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
            onClick={handleRecalculate}
            disabled={isCalculating}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-lg border border-white/30 text-white rounded-lg px-3 md:px-4 py-2 flex items-center gap-2 transition-all text-sm md:text-base"
          >
            <RefreshCw className={`h-4 w-4 md:h-5 md:w-5 ${isCalculating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isCalculating ? 'Recalculating...' : 'Recalculate'}</span>
            <span className="sm:hidden">Recalc</span>
          </Button>
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
          <ChevronLeft className="h-4 w-4 md:h-5 w-5" />
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
            <Calendar mode="single" selected={currentDate} onSelect={(d) => d && setCurrentDate(d)} initialFocus />
          </PopoverContent>
        </Popover>

        <Button onClick={handleNextWeek} variant="ghost" size="icon" className="bg-white/10 rounded-full hover:bg-white/20 h-8 w-8 md:h-10 md:w-10">
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 md:gap-4">
        {weekDays.map((day, i) => {
          const dayEntries = getEntriesForDay(day);
          const totalDayHours = dayEntries.reduce(
            (acc, e) => acc + (Number(e.hours_worked || 0) + Number(e.travel_time || 0)),
            0
          );
          const key = format(day, "yyyy-MM-dd");
          const receiptCount = receiptsByDay[key] || 0;

          return (
            <GlassCard key={i} className="p-3 md:p-4 flex flex-col min-h-fit">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="text-center w-full">
                  <p className="font-bold text-base md:text-lg">{format(day, "EEE")}</p>
                  <p className={`text-sm ${isSameDay(day, new Date()) ? "text-cyan-400" : "text-gray-300"}`}>{format(day, "d")}</p>
                </div>
                {receiptCount > 0 && (
                  <div className="absolute -mt-2 -mr-2 right-3 top-3 flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 border border-white/25">
                    <ReceiptText className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">{receiptCount}</span>
                  </div>
                )}
              </div>

              <div className="flex-grow space-y-2 md:space-y-3">
                {dayEntries.map((e) => (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    onClick={() => openModalForEntry(e)}
                    className="bg-white/5 p-2 md:p-3 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 active:bg-white/15 transition-all"
                  >
                    <p className="font-semibold text-xs md:text-sm truncate">{e.project_name}</p>
                    <p className="text-xs text-gray-300">
                      {Number(e.hours_worked || 0)}h work
                      {Number(e.travel_time || 0) > 0 && <span>, {Number(e.travel_time)}h travel</span>}
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
                <span className="font-bold text-sm md:text-base text-gray-200">{totalDayHours.toFixed(1)}h</span>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Week Summary */}
      <WeekSummary
        weekStart={weekStart}
        entries={currentWeekEntries}
        user={user}
        payslip={weekPayslip}
        earnings={weekEarnings}
        onReplacePayslip={() => {
          document.getElementById("hidden-payslip-input")?.click();
        }}
      />

      {/* optional hidden input hook */}
      <input id="hidden-payslip-input" type="file" accept="application/pdf,image/*" className="hidden" onChange={handlePayslipUpload} />
    </div>
  );
}
