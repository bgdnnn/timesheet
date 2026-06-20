// src/pages/Holidays.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Holidays, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Info,
  CalendarDays,
  Palmtree,
  CalendarX2,
  Bookmark,
  X,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-black/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg ${className}`}>
    {children}
  </div>
);

const ModalOverlay = ({ children, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
    className={`relative bg-gray-900/90 backdrop-blur-2xl border border-white/20 text-white rounded-2xl shadow-2xl p-6 md:p-8 w-full ${className}`}
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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TOTAL_PAID_ALLOWANCE = 22;

export default function HolidaysPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [userHolidays, setUserHolidays] = useState([]);
  const [bankHolidays, setBankHolidays] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [leaveType, setLeaveType] = useState("paid"); // "paid" or "unpaid"
  const [leaveNotes, setLeaveNotes] = useState("");
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch UK Bank Holidays
  useEffect(() => {
    const fetchBankHolidays = async () => {
      try {
        const resp = await fetch("https://www.gov.uk/bank-holidays.json");
        if (!resp.ok) throw new Error("Failed to fetch UK bank holidays");
        const data = await resp.json();
        
        // Parse England and Wales bank holidays
        const division = data["england-and-wales"] || { events: [] };
        const eventsMap = {};
        division.events.forEach(event => {
          eventsMap[event.date] = event.title;
        });
        setBankHolidays(eventsMap);
      } catch (err) {
        console.error("Bank holidays fetch error:", err);
      }
    };
    fetchBankHolidays();
  }, []);

  // Fetch User & Holidays for the current year
  const fetchUserAndHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Fetch holidays for the selected year
      const startOfYear = `${currentYear}-01-01`;
      const endOfYear = `${currentYear}-12-31`;
      const data = await Holidays.filter({
        from: startOfYear,
        to: endOfYear
      });
      setUserHolidays(data);
    } catch (err) {
      console.error("Failed to load user or holidays:", err);
      toast.error("Failed to load holiday records");
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchUserAndHolidays();
  }, [fetchUserAndHolidays]);

  // Create mappings for holidays in state
  const holidaysMap = useMemo(() => {
    const map = new Map();
    userHolidays.forEach(h => {
      // Normalize date string (some DBs return date + time strings)
      const dateStr = h.date.split("T")[0];
      map.set(dateStr, h);
    });
    return map;
  }, [userHolidays]);

  // Statistics calculations
  const stats = useMemo(() => {
    let paidTaken = 0;
    let unpaidTaken = 0;

    userHolidays.forEach(h => {
      if (h.type === "paid") {
        paidTaken++;
      } else if (h.type === "unpaid") {
        unpaidTaken++;
      }
    });

    return {
      totalAllowance: TOTAL_PAID_ALLOWANCE,
      paidTaken,
      paidRemaining: Math.max(0, TOTAL_PAID_ALLOWANCE - paidTaken),
      unpaidTaken,
    };
  }, [userHolidays]);

  // Calendar calculations
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    
    // Convert getDay() standard (0 = Sun, 1 = Mon...) to Mon = 0, Sun = 6
    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const cells = [];

    // 1. Previous month padding days
    const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = lastDayOfPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const d = new Date(prevYear, prevMonth, day);
      const dateStr = formatDate(d);
      cells.push({
        date: d,
        dayNumber: day,
        isCurrentMonth: false,
        dateStr,
      });
    }

    // 2. Current month days
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentYear, currentMonth, day);
      const dateStr = formatDate(d);
      cells.push({
        date: d,
        dayNumber: day,
        isCurrentMonth: true,
        dateStr,
      });
    }

    // 3. Next month padding days to complete standard 6 rows grid (42 cells)
    const totalCells = 42;
    const remaining = totalCells - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const d = new Date(nextYear, nextMonth, day);
      const dateStr = formatDate(d);
      cells.push({
        date: d,
        dayNumber: day,
        isCurrentMonth: false,
        dateStr,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  function formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Open modal for marking leave
  const handleCellClick = (cell) => {
    const holidayData = holidaysMap.get(cell.dateStr);
    setSelectedDateStr(cell.dateStr);
    
    if (holidayData) {
      setSelectedHoliday(holidayData);
      setLeaveType(holidayData.type);
      setLeaveNotes(holidayData.notes || "");
    } else {
      setSelectedHoliday(null);
      setLeaveType("paid");
      setLeaveNotes("");
    }

    setIsModalOpen(true);
  };

  // Save leave entry
  const handleSaveLeave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await Holidays.create({
        date: selectedDateStr,
        type: leaveType,
        notes: leaveNotes || null,
      });

      toast.success("Leave marked successfully!");
      fetchUserAndHolidays();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save leave:", err);
      toast.error("Failed to save leave entry");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete leave entry
  const handleDeleteLeave = async () => {
    if (!selectedHoliday) return;

    if (window.confirm("Are you sure you want to clear this leave day?")) {
      setIsSaving(true);
      try {
        await Holidays.removeByDate(selectedDateStr);
        toast.success("Leave cleared successfully!");
        fetchUserAndHolidays();
        setIsModalOpen(false);
      } catch (err) {
        console.error("Failed to delete leave:", err);
        toast.error("Failed to clear leave");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 2, current - 1, current, current + 1, current + 2];
  }, []);

  return (
    <div className="text-white">
      <AnimatePresence>
        {isModalOpen && (
          <ModalOverlay onClose={() => setIsModalOpen(false)}>
            <ModalContent onClose={() => setIsModalOpen(false)} className="max-w-md">
              <h2 className="text-xl md:text-2xl font-bold mb-1">
                {selectedHoliday ? "Edit Leave Record" : "Mark Leave Day"}
              </h2>
              <p className="text-gray-400 text-sm mb-6 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-sky-400" />
                {new Date(selectedDateStr).toLocaleDateString("en-GB", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

              {bankHolidays[selectedDateStr] && (
                <div className="mb-6 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs flex gap-2 items-start">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">UK Bank Holiday:</span> {bankHolidays[selectedDateStr]}. 
                    You can still mark leave here, but normally bank holidays are public holidays.
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveLeave} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-300">Leave Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setLeaveType("paid")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                        leaveType === "paid"
                          ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/5"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
                      }`}
                    >
                      <Palmtree className="h-6 w-6 mb-1.5" />
                      <span className="font-bold text-xs uppercase tracking-wider">Paid Holiday</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeaveType("unpaid")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                        leaveType === "unpaid"
                          ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/5"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
                      }`}
                    >
                      <CalendarX2 className="h-6 w-6 mb-1.5" />
                      <span className="font-bold text-xs uppercase tracking-wider">Unpaid Leave</span>
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-bold text-gray-300">Notes (Optional)</Label>
                  <Input
                    placeholder="e.g. Vacation in Spain, dentist appointment..."
                    value={leaveNotes}
                    onChange={(e) => setLeaveNotes(e.target.value)}
                    className="mt-2 bg-white/5 border-white/10 hover:border-white/20 focus:border-sky-500/50 transition-all text-sm h-10 rounded-xl"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  {selectedHoliday && (
                    <Button
                      type="button"
                      onClick={handleDeleteLeave}
                      disabled={isSaving}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Clear</span>
                    </Button>
                  )}
                  
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-semibold py-2 rounded-xl transition-all shadow-lg"
                  >
                    {isSaving ? "Saving..." : "Save Record"}
                  </Button>
                </div>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Header & Year Selector */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white via-sky-200 to-white bg-clip-text text-transparent">
            Holiday & Leave Calendar
          </h1>
          <p className="text-gray-400 text-sm mt-1">Track paid holidays, unpaid leave, and public bank holidays.</p>
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Leave Year:</Label>
          <select
            value={currentYear}
            onChange={(e) => {
              setCurrentYear(parseInt(e.target.value));
              // Optionally align month
            }}
            className="bg-white/15 border border-white/20 rounded-xl px-4 py-2 text-white font-bold text-sm outline-none focus:border-sky-500 transition-colors"
          >
            {yearOptions.map(yr => (
              <option key={yr} value={yr} className="bg-gray-900 text-white font-semibold">
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Holiday Statistics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <GlassCard className="p-4 md:p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
              Annual Allowance
            </span>
            <span className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-sky-200">
              {stats.totalAllowance}
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 font-semibold block mt-1">Resets Jan 1st each year</span>
          </div>
          <div className="p-3 rounded-full bg-sky-500/10 text-sky-400">
            <Bookmark className="h-5 w-5 md:h-6 md:w-6" />
          </div>
        </GlassCard>

        <GlassCard className="p-4 md:p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
              Paid Taken
            </span>
            <span className="text-2xl md:text-3xl font-black text-emerald-400">
              {stats.paidTaken}
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 font-semibold block mt-1">Days deducted</span>
          </div>
          <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" />
          </div>
        </GlassCard>

        <GlassCard className="p-4 md:p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs font-bold text-sky-400 uppercase tracking-widest block mb-1">
              Paid Remaining
            </span>
            <span className="text-2xl md:text-3xl font-black text-sky-400">
              {stats.paidRemaining}
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 font-semibold block mt-1">Available leave</span>
          </div>
          <div className="p-3 rounded-full bg-sky-500/10 text-sky-400">
            <Palmtree className="h-5 w-5 md:h-6 md:w-6" />
          </div>
        </GlassCard>

        <GlassCard className="p-4 md:p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
              Unpaid Taken
            </span>
            <span className="text-2xl md:text-3xl font-black text-amber-400">
              {stats.unpaidTaken}
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 font-semibold block mt-1">Not deducted</span>
          </div>
          <div className="p-3 rounded-full bg-amber-500/10 text-amber-400">
            <CalendarX2 className="h-5 w-5 md:h-6 md:w-6" />
          </div>
        </GlassCard>
      </div>

      {/* Main Calendar View */}
      <GlassCard className="p-4 md:p-6 mb-6">
        {/* Calendar Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={prevMonth}
            className="hover:bg-white/10 rounded-full h-10 w-10 flex items-center justify-center p-0"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>

          <Button
            variant="ghost"
            onClick={nextMonth}
            className="hover:bg-white/10 rounded-full h-10 w-10 flex items-center justify-center p-0"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Calendar Legend */}
        <div className="flex flex-wrap gap-4 justify-center items-center mb-6 text-xs md:text-sm font-semibold border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-violet-500" />
            <span className="text-gray-300">UK Bank Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-gray-300">Paid Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-gray-300">Unpaid Leave</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {/* Weekday headers */}
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center font-bold text-[10px] md:text-xs text-gray-500 uppercase tracking-widest pb-2">
              {day}
            </div>
          ))}

          {/* Day cells */}
          {calendarCells.map((cell, idx) => {
            const hasHoliday = holidaysMap.get(cell.dateStr);
            const isBankHoliday = bankHolidays[cell.dateStr];
            
            let bgClass = "bg-white/5 hover:bg-white/10 border-white/5 text-white";
            let statusBadge = null;

            if (isBankHoliday) {
              bgClass = "bg-violet-600/25 hover:bg-violet-600/40 border-violet-500/40 text-violet-200 shadow-lg shadow-violet-600/5";
            }
            
            if (hasHoliday) {
              if (hasHoliday.type === "paid") {
                bgClass = "bg-emerald-600/25 hover:bg-emerald-600/40 border-emerald-500/40 text-emerald-200 shadow-lg shadow-emerald-600/5";
              } else if (hasHoliday.type === "unpaid") {
                bgClass = "bg-amber-600/25 hover:bg-amber-600/40 border-amber-500/40 text-amber-200 shadow-lg shadow-amber-600/5";
              }
            }

            // Muted styles for padding days from adjacent months
            const opacityClass = cell.isCurrentMonth ? "opacity-100" : "opacity-35";

            return (
              <button
                key={idx}
                onClick={() => handleCellClick(cell)}
                className={`flex flex-col items-center justify-between p-2 md:p-3 aspect-square border rounded-xl transition-all duration-200 relative group overflow-hidden ${bgClass} ${opacityClass}`}
              >
                {/* Day number */}
                <span className="text-sm md:text-base font-black self-start">
                  {cell.dayNumber}
                </span>

                {/* Indicators / Tooltips */}
                <div className="w-full flex flex-col gap-0.5 justify-end flex-grow">
                  {isBankHoliday && (
                    <span className="text-[7px] md:text-[9px] font-bold text-violet-300 leading-tight block text-left truncate w-full" title={isBankHoliday}>
                      {isBankHoliday}
                    </span>
                  )}
                  {hasHoliday && hasHoliday.notes && (
                    <span className="text-[7px] md:text-[9px] text-gray-400 italic leading-tight block text-left truncate w-full" title={hasHoliday.notes}>
                      "{hasHoliday.notes}"
                    </span>
                  )}
                </div>

                {/* Tiny badge showing type if hovered/marked */}
                {hasHoliday && (
                  <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${hasHoliday.type === 'paid' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                )}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Notice / Policy */}
      <div className="flex gap-2.5 items-start p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-gray-300 text-xs md:text-sm">
        <Info className="h-4 w-4 md:h-5 md:w-5 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Leave Guidelines:</span> Your leave allowance is set to {TOTAL_PAID_ALLOWANCE} days. 
          When you mark a day as "Paid Holiday", it automatically deducts from your remaining allowance for that calendar year. 
          "Unpaid Leave" is tracked separately and does not reduce your paid allowance. Holidays reset on 1 January each year.
        </div>
      </div>
    </div>
  );
}
