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
  Gift,
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
    className={`relative bg-gray-900/95 backdrop-blur-2xl border border-white/20 text-white rounded-2xl shadow-2xl p-6 md:p-8 w-full ${className}`}
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

  // Drag selection states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState("");
  const [dragEnd, setDragEnd] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [leaveType, setLeaveType] = useState("paid"); // "paid", "unpaid", or "gift"
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
      const dateStr = h.date.split("T")[0];
      map.set(dateStr, h);
    });
    return map;
  }, [userHolidays]);

  // Statistics calculations
  const stats = useMemo(() => {
    let paidTaken = 0;
    let unpaidTaken = 0;
    let giftTaken = 0;

    userHolidays.forEach(h => {
      if (h.type === "paid") {
        paidTaken++;
      } else if (h.type === "unpaid") {
        unpaidTaken++;
      } else if (h.type === "gift") {
        giftTaken++;
      }
    });

    return {
      totalAllowance: TOTAL_PAID_ALLOWANCE,
      paidTaken,
      paidRemaining: Math.max(0, TOTAL_PAID_ALLOWANCE - paidTaken),
      unpaidTaken,
      giftTaken,
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

  // Click & Drag Range selection handlers
  const handleMouseDown = (dateStr) => {
    setIsDragging(true);
    setDragStart(dateStr);
    setDragEnd(dateStr);
  };

  const handleMouseEnter = (dateStr) => {
    if (!isDragging) return;
    setDragEnd(dateStr);
  };

  // Determine if a cell is inside the current dragging selection
  const isInDragRange = useCallback((dateStr) => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    const d = new Date(dateStr);
    const dStart = new Date(dragStart);
    const dEnd = new Date(dragEnd);
    const minD = dStart < dEnd ? dStart : dEnd;
    const maxD = dStart < dEnd ? dEnd : dStart;
    return d >= minD && d <= maxD;
  }, [isDragging, dragStart, dragEnd]);

  // Global mouseup handler to complete range drag selection
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);

        const dStart = new Date(dragStart);
        const dEnd = new Date(dragEnd);
        const startStr = dStart < dEnd ? formatDate(dStart) : formatDate(dEnd);
        const endStr = dStart < dEnd ? formatDate(dEnd) : formatDate(dStart);

        setStartDateStr(startStr);
        setEndDateStr(endStr);

        // Prepopulate form if single day edit
        if (startStr === endStr) {
          const holidayData = holidaysMap.get(startStr);
          if (holidayData) {
            setSelectedHoliday(holidayData);
            setLeaveType(holidayData.type);
            setLeaveNotes(holidayData.notes || "");
          } else {
            setSelectedHoliday(null);
            setLeaveType("paid");
            setLeaveNotes("");
          }
        } else {
          setSelectedHoliday(null);
          setLeaveType("paid");
          setLeaveNotes("");
        }

        setIsModalOpen(true);
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDragging, dragStart, dragEnd, holidaysMap]);

  // Save leave entry (supporting ranges and filtering weekends/bank holidays)
  const handleSaveLeave = async (e) => {
    e.preventDefault();
    if (new Date(endDateStr) < new Date(startDateStr)) {
      toast.error("End date cannot be before start date");
      return;
    }

    setIsSaving(true);

    const markedDates = [];
    const skippedWeekend = [];
    const skippedBankHol = [];

    let curr = new Date(startDateStr);
    const end = new Date(endDateStr);

    while (curr <= end) {
      const dateStr = formatDate(curr);
      const dayOfWeek = curr.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isBankHol = !!bankHolidays[dateStr];

      if (isWeekend) {
        skippedWeekend.push(dateStr);
      } else if (isBankHol) {
        skippedBankHol.push(dateStr);
      } else {
        markedDates.push(dateStr);
      }

      curr.setDate(curr.getDate() + 1);
    }

    if (markedDates.length === 0) {
      toast.error("No valid weekdays selected (skipped weekends & bank holidays)");
      setIsSaving(false);
      return;
    }

    try {
      await Promise.all(
        markedDates.map(dateStr =>
          Holidays.create({
            date: dateStr,
            type: leaveType,
            notes: leaveNotes || null,
          })
        )
      );

      let msg = `Successfully marked ${markedDates.length} day(s).`;
      if (skippedWeekend.length > 0 || skippedBankHol.length > 0) {
        const parts = [];
        if (skippedWeekend.length > 0) parts.push(`${skippedWeekend.length} weekend day(s)`);
        if (skippedBankHol.length > 0) parts.push(`${skippedBankHol.length} bank holiday(s)`);
        msg += ` Skipped ${parts.join(" and ")}.`;
      }
      toast.success(msg);

      fetchUserAndHolidays();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save leave range:", err);
      toast.error("Failed to save leave entries");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete leave entry for the selected range
  const handleDeleteLeave = async () => {
    if (window.confirm("Are you sure you want to clear marked leave for this date range?")) {
      setIsSaving(true);
      
      const datesToClear = [];
      let curr = new Date(startDateStr);
      const end = new Date(endDateStr);

      while (curr <= end) {
        const dateStr = formatDate(curr);
        if (holidaysMap.has(dateStr)) {
          datesToClear.push(dateStr);
        }
        curr.setDate(curr.getDate() + 1);
      }

      if (datesToClear.length === 0) {
        toast.error("No marked leave days found in this range");
        setIsSaving(false);
        return;
      }

      try {
        await Promise.all(datesToClear.map(dateStr => Holidays.removeByDate(dateStr)));
        toast.success(`Cleared leave for ${datesToClear.length} day(s).`);
        fetchUserAndHolidays();
        setIsModalOpen(false);
      } catch (err) {
        console.error("Failed to clear leave range:", err);
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
    <div className="text-white select-none">
      <AnimatePresence>
        {isModalOpen && (
          <ModalOverlay onClose={() => setIsModalOpen(false)}>
            <ModalContent onClose={() => setIsModalOpen(false)} className="max-w-md">
              <h2 className="text-xl md:text-2xl font-bold mb-1">
                {selectedHoliday && (startDateStr === endDateStr) ? "Edit Leave Record" : "Mark Leave Range"}
              </h2>
              <p className="text-gray-400 text-sm mb-6 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-sky-400" />
                {startDateStr === endDateStr ? (
                  new Date(startDateStr).toLocaleDateString("en-GB", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                ) : (
                  <span>Select Range below:</span>
                )}
              </p>

              {startDateStr === endDateStr && bankHolidays[startDateStr] && (
                <div className="mb-6 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs flex gap-2 items-start">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">UK Bank Holiday:</span> {bankHolidays[startDateStr]}. 
                    You can still mark leave here, but normally bank holidays are public holidays.
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveLeave} className="space-y-5">
                {/* Range Selectors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-gray-400 uppercase">Start Date</Label>
                    <Input
                      type="date"
                      value={startDateStr}
                      onChange={(e) => setStartDateStr(e.target.value)}
                      className="mt-1.5 bg-white/5 border-white/10 hover:border-white/20 focus:border-sky-500/50 transition-all text-sm h-10 rounded-xl text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-gray-400 uppercase">End Date</Label>
                    <Input
                      type="date"
                      value={endDateStr}
                      onChange={(e) => setEndDateStr(e.target.value)}
                      className="mt-1.5 bg-white/5 border-white/10 hover:border-white/20 focus:border-sky-500/50 transition-all text-sm h-10 rounded-xl text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-300">Leave Type</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setLeaveType("paid")}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                        leaveType === "paid"
                          ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/5"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
                      }`}
                    >
                      <Palmtree className="h-5 w-5 mb-1" />
                      <span className="font-bold text-[10px] uppercase tracking-wider">Paid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeaveType("gift")}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                        leaveType === "gift"
                          ? "bg-fuchsia-500/15 border-fuchsia-500/50 text-fuchsia-300 shadow-md shadow-fuchsia-500/5"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
                      }`}
                    >
                      <Gift className="h-5 w-5 mb-1" />
                      <span className="font-bold text-[10px] uppercase tracking-wider">Gift</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeaveType("unpaid")}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                        leaveType === "unpaid"
                          ? "bg-rose-500/15 border-rose-500/50 text-rose-300 shadow-md shadow-rose-500/5"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
                      }`}
                    >
                      <CalendarX2 className="h-5 w-5 mb-1" />
                      <span className="font-bold text-[10px] uppercase tracking-wider">Unpaid</span>
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
                  {(selectedHoliday || startDateStr !== endDateStr) && (
                    <Button
                      type="button"
                      onClick={handleDeleteLeave}
                      disabled={isSaving}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Clear Leave</span>
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
        <GlassCard className="p-4 md:p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
              Annual Allowance
            </span>
            <span className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-sky-200">
              {stats.totalAllowance}
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 font-semibold block mt-1">Resets Jan 1st</span>
          </div>
          <div className="p-2.5 rounded-full bg-sky-500/10 text-sky-400">
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
          <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400">
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
          <div className="p-2.5 rounded-full bg-sky-500/10 text-sky-400">
            <Palmtree className="h-5 w-5 md:h-6 md:w-6" />
          </div>
        </GlassCard>

        <GlassCard className="p-4 md:p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs font-bold text-fuchsia-400 uppercase tracking-widest block mb-1">
              Holiday Gifts
            </span>
            <span className="text-2xl md:text-3xl font-black text-fuchsia-400">
              {stats.giftTaken}
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 font-semibold block mt-1">Bonus leave</span>
          </div>
          <div className="p-2.5 rounded-full bg-fuchsia-500/10 text-fuchsia-400">
            <Gift className="h-5 w-5 md:h-6 md:w-6" />
          </div>
        </GlassCard>

        <GlassCard className="p-4 md:p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs font-bold text-rose-400 uppercase tracking-widest block mb-1">
              Unpaid Taken
            </span>
            <span className="text-2xl md:text-3xl font-black text-rose-400">
              {stats.unpaidTaken}
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 font-semibold block mt-1">Not deducted</span>
          </div>
          <div className="p-2.5 rounded-full bg-rose-500/10 text-rose-400">
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
            <span className="w-3 h-3 rounded bg-yellow-400" />
            <span className="text-gray-300">UK Bank Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-400" />
            <span className="text-gray-300">Paid Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-fuchsia-400" />
            <span className="text-gray-300">Holiday Gift</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-rose-400" />
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
            const isHighlighted = isInDragRange(cell.dateStr);
            
            let bgClass = "bg-white/5 hover:bg-white/10 border-white/5 text-white";

            if (isBankHoliday) {
              bgClass = "bg-yellow-500/30 hover:bg-yellow-500/45 border-yellow-400/80 text-yellow-100 shadow-[0_0_15px_rgba(234,179,8,0.15)]";
            }
            
            if (hasHoliday) {
              if (hasHoliday.type === "paid") {
                bgClass = "bg-emerald-500/30 hover:bg-emerald-500/45 border-emerald-400/80 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
              } else if (hasHoliday.type === "gift") {
                bgClass = "bg-fuchsia-500/30 hover:bg-fuchsia-500/45 border-fuchsia-400/80 text-fuchsia-100 shadow-[0_0_15px_rgba(217,70,239,0.15)]";
              } else if (hasHoliday.type === "unpaid") {
                bgClass = "bg-rose-500/30 hover:bg-rose-500/45 border-rose-400/80 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.15)]";
              }
            }

            // Apply dragging selection highlight
            if (isHighlighted) {
              bgClass = "bg-sky-500/35 hover:bg-sky-500/50 border-sky-400 text-sky-100 scale-[1.02] shadow-[0_0_15px_rgba(56,189,248,0.3)] ring-2 ring-sky-400/30 z-10";
            }

            // Muted styles for padding days from adjacent months
            const opacityClass = cell.isCurrentMonth ? "opacity-100" : "opacity-35";

            let bulletColor = null;
            if (hasHoliday) {
              if (hasHoliday.type === "paid") bulletColor = "bg-emerald-400";
              else if (hasHoliday.type === "gift") bulletColor = "bg-fuchsia-400";
              else if (hasHoliday.type === "unpaid") bulletColor = "bg-rose-400";
            }

            return (
              <button
                key={idx}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleMouseDown(cell.dateStr);
                }}
                onMouseEnter={() => handleMouseEnter(cell.dateStr)}
                className={`flex flex-col items-center justify-between p-2 md:p-3 aspect-square border rounded-xl transition-all duration-200 relative group overflow-hidden ${bgClass} ${opacityClass}`}
              >
                {/* Day number */}
                <span className="text-sm md:text-base font-black self-start">
                  {cell.dayNumber}
                </span>

                {/* Indicators / Tooltips */}
                <div className="w-full flex flex-col gap-0.5 justify-end flex-grow">
                  {isBankHoliday && !isHighlighted && (
                    <span className="text-[7px] md:text-[9px] font-black text-yellow-300 leading-tight block text-left truncate w-full" title={isBankHoliday}>
                      {isBankHoliday}
                    </span>
                  )}
                  {hasHoliday && hasHoliday.notes && !isHighlighted && (
                    <span className="text-[7px] md:text-[9px] text-gray-300 italic leading-tight block text-left truncate w-full" title={hasHoliday.notes}>
                      "{hasHoliday.notes}"
                    </span>
                  )}
                  {isHighlighted && (
                    <span className="text-[7px] md:text-[9px] font-bold text-sky-200 leading-tight block text-center truncate w-full">
                      Selected
                    </span>
                  )}
                </div>

                {/* Tiny badge showing type if hovered/marked */}
                {hasHoliday && !isHighlighted && bulletColor && (
                  <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${bulletColor}`} />
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
          <span className="font-bold text-white">Leave Guidelines:</span> Click and drag to select a range of dates. 
          Weekends and UK Bank Holidays are automatically skipped. **Holiday Gifts** (Bonus Leave) and **Unpaid Leave** do not deduct from your 22-day Annual Allowance.
        </div>
      </div>
    </div>
  );
}
