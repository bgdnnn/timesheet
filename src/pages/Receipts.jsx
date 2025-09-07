import React, { useEffect, useState } from "react";
import { listReceipts, receiptFileUrl, uploadReceipts, deleteReceipt } from "@/api/receipts";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { Trash2, X } from "lucide-react";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
    />
  );
};

export default function Receipts() {
  const [items, setItems] = useState([]);
  const [blobs, setBlobs] = useState({}); // { [id]: objectUrl }
  const [filter, setFilter] = useState({ type: "specific", date: new Date() });
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadDate, setUploadDate] = useState(new Date());
  const [uploadFiles, setUploadFiles] = useState([]);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const isMobile = useIsMobile();

  const fetchReceipts = async () => {
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

    try {
      const rows = await listReceipts(params);
      setItems(rows);

      // Prefetch first 8 thumbnails (optional)
      const first = rows.slice(0, 8);
      const obj = {};
      for (const r of first) {
        try {
          obj[r.id] = await receiptFileUrl(r.id);
        } catch (e) {
          console.error("prefetch error", e);
        }
      }
      setBlobs(obj);
    } catch (e) {
      console.error("Failed to load receipts", e);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [filter]);

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      alert("Please select at least one file to upload.");
      return;
    }
    try {
      await uploadReceipts({
        entry_date: format(uploadDate, "yyyy-MM-dd"),
        files: uploadFiles,
      });
      setUploadDialogOpen(false);
      setUploadFiles([]);
      fetchReceipts(); // Refresh the list
    } catch (e) {
      console.error("Upload failed", e);
      alert("Upload failed. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReceipt(id);
      if (fullscreenImage && fullscreenImage.id === id) {
        setFullscreenImage(null);
      }
      fetchReceipts(); // Refresh the list
    } catch (e) {
      console.error("Delete failed", e);
      alert("Delete failed. Please try again.");
    }
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


    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={filter.type === filterType ? "secondary" : "ghost"} className="flex-1 md:flex-none">
            {filter.type === filterType ? `${label}: ${format(filter.date, formatString)}` : label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          {picker}
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="text-white p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left mb-4 md:mb-0">Receipts</h1>
        <div className="flex flex-wrap gap-2">
          {renderFilterButton("specific", "Date")}
          {renderFilterButton("week", "Week")}
          {renderFilterButton("month", "Month")}
          {renderFilterButton("year", "Year")}
          <Button variant={filter.type === "all" ? "secondary" : "ghost"} onClick={() => setFilter({ type: "all", date: new Date() })} className="flex-1 md:flex-none">All</Button>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 md:flex-none">Upload Receipt</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Receipt</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="receipt-date">Date</Label>
                  <Calendar
                    mode="single"
                    selected={uploadDate}
                    onSelect={setUploadDate}
                    className="rounded-md border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="receipt-files">Files</Label>
                  <Input
                    id="receipt-files"
                    type="file"
                    multiple
                    onChange={(e) => setUploadFiles(Array.from(e.target.files))}
                  />
                </div>
              </div>
              <Button onClick={handleUpload}>Upload</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((r) => (
          <div key={r.id} className="rounded-xl border border-white/20 bg-white/5 p-2 group relative">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 z-10 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the receipt.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(r.id)}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="text-xs text-gray-300 mb-2">
              {format(new Date(r.entry_date), "PPP")}
            </div>
            <img
              alt={r.original_filename || `receipt-${r.id}`}
              className="w-full h-40 object-cover rounded cursor-pointer"
              src={blobs[r.id]}
              onMouseEnter={async () => {
                if (!blobs[r.id]) {
                  try {
                    const url = await receiptFileUrl(r.id);
                    setBlobs((b) => ({ ...b, [r.id]: url }));
                  } catch (e) {
                    console.error("hover fetch error", e);
                  }
                }
              }}
              onClick={() => setFullscreenImage(r)}
            />
            <div className="text-xs mt-2 truncate">
              {r.original_filename || "(image)"}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-gray-300">No receipts yet.</div>
        )}
      </div>

      {fullscreenImage && (
        <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
          <DialogContent className="bg-black/80 border-none text-white w-screen h-screen max-w-none flex flex-col items-center justify-center">
            <img
              alt={fullscreenImage.original_filename || `receipt-${fullscreenImage.id}`}
              className="max-h-[80vh] max-w-[80vw] object-contain"
              src={blobs[fullscreenImage.id]}
            />
            <div className="absolute bottom-4 flex gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the receipt.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(fullscreenImage.id)}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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

