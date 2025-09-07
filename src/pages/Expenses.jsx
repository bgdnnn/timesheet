import React, { useEffect, useState, useCallback } from "react";
import { listExpenses, summary } from "@/api/expenses";
import { receiptFileUrl } from "@/api/receipts";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useIsMobile } from "@/hooks/use-mobile";
import { X, Pencil, ChevronDown } from "lucide-react";

function Money({ value }) {
  if (value == null) return <span className="text-gray-400">—</span>;
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  return <span>£{num.toFixed(2)}</span>;
}

const CustomDatePickerInput = React.forwardRef(({ value, onClick }, ref) => (
  <Button onClick={onClick} ref={ref} variant="outline">
    {value}
  </Button>
));

const MonthYearPicker = ({ selected, onChange, showYearPicker = false }) => {
  const formatString = showYearPicker ? "yyyy" : "MMMM yyyy";
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      dateFormat={formatString}
      showMonthYearPicker={!showYearPicker}
      showYearPicker={showYearPicker}
      showFullMonthYearPicker
      customInput={<CustomDatePickerInput />}
    />
  );
};

export default function Expenses() {
  const [items, setItems] = useState([]);
  const [blobs, setBlobs] = useState({});
  const [sumWeek, setSumWeek] = useState(null);
  const [sumMonth, setSumMonth] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState({ type: "specific", date: new Date() });

  const fetchExpenses = async () => {
    let start, end;
    if (filter.type === "week") {
      start = startOfWeek(filter.date);
      end = endOfWeek(filter.date);
    } else if (filter.type === "month") {
      start = startOfMonth(filter.date);
      end = endOfMonth(filter.date);
    } else if (filter.type === "year") {
      start = startOfYear(filter.date);
      end = endOfYear(filter.date);
    } else if (filter.type === "specific") {
      start = end = filter.date;
    }

    const params = {};
    if (start) params.start = format(start, "yyyy-MM-dd");
    if (end) params.end = format(end, "yyyy-MM-dd");

    const rows = await listExpenses(params);
    const monthly = await summary("month");
    setItems(rows);
    const thisMonthKey = format(new Date(), "yyyy-MM");
    const monthRow = monthly.find((r) => r.bucket === thisMonthKey);
    setSumMonth(monthRow?.total ?? null);
    const weekly = await summary("week");
    const yearWeek = format(new Date(), "RRRR-ww");
    const weekRow = weekly.find((r) => r.bucket === yearWeek);
    setSumWeek(weekRow?.total ?? null);
  };

  useEffect(() => {
    fetchExpenses();
  }, [filter]);

  const handleSave = () => {
    setIsFormOpen(false);
    fetchExpenses();
  };

  const handleRowClick = async (expense) => {
    if (expense.receipt_id) {
      setFullscreenImage(expense);
      if (!blobs[expense.receipt_id]) {
        try {
          const url = await receiptFileUrl(expense.receipt_id);
          setBlobs((b) => ({ ...b, [expense.receipt_id]: url }));
        } catch (e) {
          console.error("Error fetching receipt URL:", e);
        }
      }
    } else {
      setSelectedExpense(expense);
      setIsFormOpen(true);
    }
  };

  const handleNewExpense = () => {
    setSelectedExpense(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (expense) => {
    setFullscreenImage(null); // Close any open image preview
    setSelectedExpense(expense);
    setIsFormOpen(true);
  };

  const renderFilterButton = (filterType, label) => {
    const handleDateChange = (date) => {
      if (date) {
        setFilter({ type: filterType, date });
      }
    };

    let formatString = "PPP";
    if (filter.type === 'month') {
      formatString = "MMMM yyyy";
    } else if (filter.type === 'year') {
      formatString = "yyyy";
    }

    const picker = {
      month: <MonthYearPicker selected={filter.date} onChange={handleDateChange} />,
      year: <MonthYearPicker selected={filter.date} onChange={handleDateChange} showYearPicker />,
      specific: <Calendar mode="single" selected={filter.date} onSelect={handleDateChange} />,
      week: <Calendar mode="single" selected={filter.date} onSelect={handleDateChange} />,
    }[filterType];

    const handleDefaultFilterClick = () => {
      const today = new Date();
      let newDate = today;
      if (filterType === "week") {
        newDate = startOfWeek(today);
      } else if (filterType === "month") {
        newDate = startOfMonth(today);
      } else if (filterType === "year") {
        newDate = startOfYear(today);
      }
      setFilter({ type: filterType, date: newDate });
    };

    return (
      <div className="relative flex items-center">
        <Button
          variant={filter.type === filterType ? "secondary" : "ghost"}
          className="flex-1 md:flex-none pr-8"
          onClick={handleDefaultFilterClick}
        >
          {filter.type === filterType ? `${label}: ${format(filter.date, formatString)}` : label}
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            {picker}
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <div className="text-white p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left mb-4 md:mb-0">Expenses</h1>
        <div className="flex flex-wrap gap-2">
          {renderFilterButton("specific", "Date")}
          {renderFilterButton("week", "Week")}
          {renderFilterButton("month", "Month")}
          {renderFilterButton("year", "Year")}
          <Button variant={filter.type === "all" ? "secondary" : "ghost"} onClick={() => setFilter({ type: "all", date: new Date() })} className="flex-1 md:flex-none">All</Button>
          <Button onClick={handleNewExpense}>New Expense</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-white/20 bg-white/5 p-4"><div className="text-sm text-gray-300">This week</div><div className="text-xl font-semibold"><Money value={sumWeek} /></div></div>
        <div className="rounded-xl border border-white/20 bg-white/5 p-4"><div className="text-sm text-gray-300">This month</div><div className="text-xl font-semibold"><Money value={sumMonth} /></div></div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/20">
        <table className="min-w-full text-sm">
          <thead className="bg-white/10">
            <tr>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2 hidden md:table-cell">Vendor</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-right px-4 py-2">Total</th>
              <th className="text-left px-4 py-2 hidden md:table-cell">Receipt</th>
              <th className="text-left px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className="border-t border-white/10 cursor-pointer hover:bg-white/5" onClick={() => handleRowClick(e)}>
                <td className="px-4 py-2">{format(new Date(e.entry_date), "dd/MM/yy")}</td>
                <td className="px-4 py-2 hidden md:table-cell">{e.vendor || <span className="text-gray-400">—</span>}</td>
                <td className="px-4 py-2">{e.expense_type || <span className="text-gray-400">—</span>}</td>
                <td className="px-4 py-2 text-right"><Money value={e.total_amount} /></td>
                <td className="px-4 py-2 hidden md:table-cell">{e.receipt_filename || <span className="text-gray-400">No receipt added!</span>}</td>
                <td className="px-4 py-2 text-right">
                  <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); handleEditClick(e); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (<tr><td className="px-4 py-4 text-gray-300" colSpan={5}>No expenses yet.</td></tr>)}
          </tbody>
        </table>
      </div>
      <ExpenseForm open={isFormOpen} onOpenChange={setIsFormOpen} expense={selectedExpense} onSave={handleSave} />

      {fullscreenImage && (
        <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
          <DialogContent className="bg-black/80 border-none text-white w-screen h-screen max-w-none flex flex-col items-center justify-center">
            <DialogTitle className="sr-only">Receipt Image Preview</DialogTitle>
            <DialogDescription className="sr-only">Full screen view of the receipt image.</DialogDescription>
            <img
              alt={fullscreenImage.original_filename || `receipt-${fullscreenImage.id}`}
              className="max-h-[80vh] max-w-[80vw] object-contain"
              src={blobs[fullscreenImage.receipt_id]}
            />
            <div className="absolute bottom-4 flex gap-4">
              <Button variant="secondary" onClick={() => setFullscreenImage(null)}>
                <X className="mr-2 h-4 w-4" /> Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
