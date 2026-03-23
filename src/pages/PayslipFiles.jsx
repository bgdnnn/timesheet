import React, { useEffect, useState, useMemo, useRef } from "react";
import { format } from "date-fns";
import { 
  FileText, 
  Upload, 
  Trash2, 
  Eye, 
  Calendar, 
  Hash, 
  ArrowUpDown,
  RefreshCw,
  Plus,
  Download,
  X,
  Loader2,
  CheckCircle2,
  FilterX,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { client } from "@/api/timesheetClient";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6 ${className}`}>
    {children}
  </div>
);

const ModalOverlay = ({ children, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
    className={`bg-gray-800/90 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-6 text-white ${className}`}
    onClick={(e) => e.stopPropagation()}
  >
    {children}
  </motion.div>
);

const getTaxYearString = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    let startYear, endYear;
    if (month < 4 || (month === 4 && day < 6)) {
        startYear = year - 1;
        endYear = year;
    } else {
        startYear = year;
        endYear = year + 1;
    }
    return `${String(startYear).slice(2)}-${String(endYear).slice(2)}`;
};

export default function PayslipFiles() {
  const isMobile = useIsMobile();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUpload] = useState(false);
  
  // Filtering & Sorting State
  const currentTaxYear = useMemo(() => getTaxYearString(new Date()), []);
  const [filterYear, setFilterYear] = useState(currentTaxYear);
  const [filterWeek, setFilterWeek] = useState("");
  const [sortField, setSortField] = useState("date"); 
  const [sortOrder, setSortOrder] = useState("desc");

  // Bulk Upload State
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, status: "" });
  const bulkInputRef = useRef(null);

  // View Modal State
  const [viewPdfUrl, setViewPdfUrl] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [processDate, setProcessDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [taxWeek, setTaxWeek] = useState("");
  const [taxYear, setTaxYear] = useState("");

  async function fetchFiles() {
    setLoading(true);
    try {
      const data = await client.fetchJson("/payslip-files");
      setFiles(data);
    } catch (err) {
      console.error("Failed to fetch payslip files:", err);
      toast.error("Failed to load archive");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !taxWeek || !taxYear) {
        toast.error("Please fill all fields");
        return;
    }
    
    setIsUpload(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("process_date", processDate);
    formData.append("tax_week", taxWeek);
    formData.append("tax_year", taxYear);

    try {
      await client.fetchJson("/payslip-files/upload", {
        method: "POST",
        body: formData
      });
      toast.success("Payslip archived");
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setTaxWeek("");
      setTaxYear("");
      fetchFiles();
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Upload failed");
    } finally {
      setIsUpload(false);
    }
  };

  const handleBulkFiles = async (e) => {
    const selectedFiles = Array.from(e.target.files).filter(f => f.name.toLowerCase().endsWith(".pdf"));
    if (selectedFiles.length === 0) return;

    setBulkProgress({ current: 0, total: selectedFiles.length, status: "Starting..." });
    setIsUpload(true);

    const pattern = /Payslip for Tax Week_(\d+) Tax Year_(\d{4})-(\d{4})\.pdf/i;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const match = file.name.match(pattern);
      
      if (!match) continue;

      const week = match[1];
      const startYear = match[2];
      const endYear = match[3];
      const taxYearStr = `${startYear.slice(2)}-${endYear.slice(2)}`;

      setBulkProgress({ 
        current: i + 1, 
        total: selectedFiles.length, 
        status: `Uploading Week ${week}, Year ${taxYearStr}...` 
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("tax_week", week);
      formData.append("tax_year", taxYearStr);

      try {
        await client.fetchJson("/payslip-files/upload", {
          method: "POST",
          body: formData
        });
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }

    setBulkProgress({ current: selectedFiles.length, total: selectedFiles.length, status: "Complete!" });
    toast.success("Bulk upload finished");
    setTimeout(() => {
        setIsUpload(false);
        setBulkProgress({ current: 0, total: 0, status: "" });
        fetchFiles();
    }, 1500);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this payslip?")) return;
    try {
      await client.fetchJson(`/payslip-files/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      fetchFiles();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Delete failed");
    }
  };

  const handleAction = async (file, action = "view") => {
    if (action === "download") {
        if (!window.confirm(`Download payslip "${file.filename}"?`)) return;
    }

    if (isMobile && action === "view") {
        toast.info("Opening payslip...");
        const url = `${client.baseUrl}/payslip-files/${file.id}/view`;
        window.open(url, "_blank");
        return;
    }

    const toastId = toast.loading(action === "view" ? "Loading viewer..." : "Preparing download...");

    try {
      const response = await fetch(`${client.baseUrl}/payslip-files/${file.id}/${action}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Action failed");
      
      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      
      if (action === "download") {
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', file.filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          toast.success("Download started", { id: toastId });
          setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
          setViewPdfUrl(url);
          setIsViewModalOpen(true);
          toast.dismiss(toastId);
      }
    } catch (err) {
      console.error(`${action} failed:`, err);
      toast.error("Error occurred", { id: toastId });
    }
  };

  const closeViewModal = () => {
    if (viewPdfUrl) window.URL.revokeObjectURL(viewPdfUrl);
    setViewPdfUrl(null);
    setIsViewModalOpen(false);
  };

  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];

    if (filterYear) {
        result = result.filter(f => f.tax_year === filterYear);
    }
    if (filterWeek) {
        result = result.filter(f => String(f.tax_week) === filterWeek);
    }

    result.sort((a, b) => {
      let valA, valB;
      if (sortField === "date") {
        valA = new Date(a.process_date).getTime();
        valB = new Date(b.process_date).getTime();
      } else if (sortField === "week") {
        valA = Number(a.tax_week);
        valB = Number(b.tax_week);
      } else {
        valA = a.tax_year;
        valB = b.tax_year;
      }
      if (valA < valB) return sortOrder === "desc" ? 1 : -1;
      if (valA > valB) return sortOrder === "desc" ? -1 : 1;
      return 0;
    });

    return result;
  }, [files, filterYear, filterWeek, sortField, sortOrder]);

  const uniqueYears = useMemo(() => {
    const years = [...new Set(files.map(f => f.tax_year))];
    return years.sort((a, b) => b.localeCompare(a));
  }, [files]);

  return (
    <div className="text-white space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payslip Archive</h1>
          <p className="text-gray-300 mt-1">Upload and manage your payslip PDF documents.</p>
        </div>
        <div className="flex gap-3">
            <input 
                type="file" 
                multiple 
                ref={bulkInputRef}
                onChange={handleBulkFiles}
                className="hidden"
                accept=".pdf"
            />
            <Button 
                onClick={() => bulkInputRef.current.click()}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold h-11 px-6 rounded-xl flex items-center gap-2"
            >
                <Upload className="h-5 w-5" />
                Bulk Upload
            </Button>
            <Button 
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold h-11 px-6 rounded-xl flex items-center gap-2"
            >
                <Plus className="h-5 w-5" />
                Single PDF
            </Button>
        </div>
      </div>

      {/* Filters & Sorting */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="md:col-span-1 p-4">
            <Label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Filter Year</Label>
            <select 
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500/50"
            >
                <option value="" className="bg-gray-900">All Years</option>
                {uniqueYears.map(y => (
                    <option key={y} value={y} className="bg-gray-900">{y}</option>
                ))}
            </select>
        </GlassCard>

        <GlassCard className="md:col-span-1 p-4">
            <Label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Filter Week</Label>
            <Input 
                type="number"
                placeholder="e.g. 50"
                value={filterWeek}
                onChange={(e) => setFilterWeek(e.target.value)}
                className="bg-white/5 border-white/10 h-10"
            />
        </GlassCard>

        <GlassCard className="md:col-span-2 flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400 font-bold uppercase">Sort:</span>
                <div className="flex gap-2">
                    {["date", "week"].map(f => (
                        <button
                            key={f}
                            onClick={() => {
                                if (sortField === f) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                                else { setSortField(f); setSortOrder("desc"); }
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${sortField === f ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-gray-400 hover:text-white bg-white/5"}`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                            {sortField === f && <ArrowUpDown className="h-3 w-3" />}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex gap-2">
                {(filterYear || filterWeek) && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setFilterYear(""); setFilterWeek(""); }}
                        title="Clear Filters"
                        className="text-rose-400 hover:bg-rose-500/10"
                    >
                        <FilterX className="h-4 w-4" />
                    </Button>
                )}
                <Button variant="ghost" size="icon" onClick={fetchFiles} className="text-gray-400 hover:text-white">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
        </GlassCard>
      </div>

      {/* Progress Overlay */}
      <AnimatePresence>
        {isUploading && bulkProgress.total > 0 && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-6">
                <GlassCard className="max-w-md w-full p-8 text-center space-y-6 bg-gray-900/80 border-cyan-500/30">
                    {bulkProgress.current === bulkProgress.total && bulkProgress.status === "Complete!" ? (
                        <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto animate-bounce" />
                    ) : (
                        <Loader2 className="h-16 w-16 text-cyan-400 mx-auto animate-spin" />
                    )}
                    <div>
                        <h2 className="text-2xl font-bold mb-2">
                            {bulkProgress.current === bulkProgress.total && bulkProgress.status === "Complete!" 
                                ? "Processing Complete" 
                                : "Bulk Uploading..."}
                        </h2>
                        <p className="text-gray-400">{bulkProgress.status}</p>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                        <motion.div 
                            className="bg-cyan-500 h-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                        />
                    </div>
                    <div className="text-sm font-bold text-gray-300 uppercase tracking-widest">
                        {bulkProgress.current} / {bulkProgress.total} Files
                    </div>
                </GlassCard>
            </div>
        )}
      </AnimatePresence>

      {/* Files List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredAndSortedFiles.map((file) => (
            <motion.div
              key={file.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <GlassCard className="group hover:border-cyan-500/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 transition-all">
                    <FileText className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleAction(file, "view")}
                      title={isMobile ? "Open PDF" : "View PDF"}
                      className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full h-8 w-8"
                    >
                      {isMobile ? <ExternalLink className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleAction(file, "download")}
                      title="Download PDF"
                      className="text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(file.id)}
                      title="Delete"
                      className="text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg leading-none mb-2">{file.filename}</h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(file.process_date), "dd MMM yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Hash className="h-3 w-3" />
                      <span>Tax Week {file.tax_week} • Year {file.tax_year}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAndSortedFiles.length === 0 && !loading && !isUploading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <FileText className="h-16 w-16 text-white/10 mb-4" />
            <p className="text-gray-400 font-medium">No payslips found matching your filters.</p>
            <Button 
              variant="link" 
              onClick={() => { setFilterYear(""); setFilterWeek(""); }}
              className="text-cyan-400 mt-2 hover:text-cyan-300"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {/* View Modal (Laptop Only) */}
      <AnimatePresence>
        {isViewModalOpen && (
          <ModalOverlay onClose={closeViewModal}>
            <ModalContent onClose={closeViewModal} className="max-w-5xl w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-gray-900 border-white/10">
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gray-800/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-400" />
                  <span className="font-bold text-sm md:text-base">Payslip Viewer</span>
                </div>
                <Button variant="ghost" size="icon" onClick={closeViewModal} className="text-gray-400 hover:text-white rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 w-full bg-white">
                <iframe src={viewPdfUrl} className="w-full h-full border-none" title="PDF Viewer" />
              </div>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Single Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <ModalOverlay onClose={() => setIsUploadModalOpen(false)}>
            <ModalContent onClose={() => setIsUploadModalOpen(false)} className="max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Plus className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">Archive Payslip</h2>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label>PDF File</Label>
                  <Input 
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="mt-1.5 bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Process Date</Label>
                        <Input 
                            type="date" 
                            value={processDate}
                            onChange={(e) => setProcessDate(e.target.value)}
                            className="mt-1.5 bg-white/5 border-white/10"
                            required
                        />
                    </div>
                    <div>
                        <Label>Tax Week</Label>
                        <Input 
                            type="number" 
                            placeholder="e.g. 50"
                            value={taxWeek}
                            onChange={(e) => setTaxWeek(e.target.value)}
                            className="mt-1.5 bg-white/5 border-white/10"
                            required
                        />
                    </div>
                </div>

                <div>
                  <Label>Tax Year (ex: 25-26)</Label>
                  <Input 
                    type="text" 
                    placeholder="25-26"
                    value={taxYear}
                    onChange={(e) => setTaxYear(e.target.value)}
                    className="mt-1.5 bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsUploadModalOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isUploading}
                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 rounded-xl"
                  >
                    {isUploading ? "Uploading..." : "Archive Payslip"}
                  </Button>
                </div>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}
