import React, { useEffect, useState, useMemo, useRef } from "react";
import { format } from "date-fns";
import { 
  HardHat, 
  Upload, 
  Trash2, 
  Eye, 
  Calendar, 
  Building2, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Plus, 
  Search, 
  ArrowUpDown, 
  RefreshCw, 
  X, 
  Edit, 
  FileCheck, 
  Layers, 
  ExternalLink,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
  FolderKanban,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConstructionDetails as ConstructionDetailsApi } from "@/api/entities";
import { AnimatePresence, motion } from "framer-motion";
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
    className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    {children}
  </motion.div>
);

const ModalContent = ({ children, onClose, className = "" }) => (
  <motion.div
    initial={{ scale: 0.95, opacity: 0, y: 15 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    exit={{ scale: 0.95, opacity: 0, y: 15 }}
    transition={{ type: "spring", damping: 25, stiffness: 280 }}
    className={`bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto ${className}`}
    onClick={(e) => e.stopPropagation()}
  >
    {children}
  </motion.div>
);

export default function ConstructionDetails() {
  const [details, setDetails] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Search, Filter & Sort
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState("all");
  const [fileTypeFilter, setFileTypeFilter] = useState("all"); // all, pdf, image
  const [sortField, setSortField] = useState("manufacturer_then_details"); // manufacturer_then_details, manufacturer, name, date_desc, date_asc
  const [viewMode, setViewMode] = useState("grouped"); // grouped, grid, list
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Upload Form State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadManufacturer, setUploadManufacturer] = useState("");
  const [uploadDetailsText, setUploadDetailsText] = useState("");
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Edit Form State
  const [editName, setEditName] = useState("");
  const [editManufacturer, setEditManufacturer] = useState("");
  const [editDetailsText, setEditDetailsText] = useState("");

  const popularManufacturers = [
    "Kingspan",
    "Catnic",
    "Celotex",
    "Knauf",
    "Rockwool",
    "British Gypsum",
    "Marley",
    "Sika",
    "Isover",
    "Wienerberger",
    "Ibstock",
    "Ancon",
    "Visqueen",
    "Schöck",
    "Velux"
  ];

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await ConstructionDetailsApi.list();
      setDetails(data);
      const mList = await ConstructionDetailsApi.getManufacturers();
      setManufacturers(mList);
    } catch (err) {
      console.error("Failed to load construction details:", err);
      toast.error("Failed to load construction details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  // Handle preview URL cleanup
  useEffect(() => {
    if (!uploadFile) {
      setFilePreviewUrl(null);
      return;
    }
    if (uploadFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(uploadFile);
      setFilePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFilePreviewUrl(null);
    }
  }, [uploadFile]);

  const handleFileSelect = (file) => {
    if (!file) return;
    setUploadFile(file);
    if (!uploadName) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      const formattedName = cleanName
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      setUploadName(formattedName);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error("Please select a file to upload (PDF, JPG, PNG, etc.)");
      return;
    }
    if (!uploadName.trim()) {
      toast.error("Please enter a name for this detail");
      return;
    }
    if (!uploadManufacturer.trim()) {
      toast.error("Please enter or select a manufacturer");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Uploading construction detail...");

    try {
      await ConstructionDetailsApi.upload({
        file: uploadFile,
        name: uploadName.trim(),
        manufacturer: uploadManufacturer.trim(),
        details: uploadDetailsText.trim() || undefined,
      });

      toast.success("Construction detail uploaded successfully!", { id: toastId });
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadName("");
      setUploadManufacturer("");
      setUploadDetailsText("");
      fetchDetails();
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Failed to upload construction detail", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditName(item.name || "");
    setEditManufacturer(item.manufacturer || "");
    setEditDetailsText(item.details || "");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (!editManufacturer.trim()) {
      toast.error("Manufacturer cannot be empty");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Updating details...");

    try {
      await ConstructionDetailsApi.update(editingItem.id, {
        name: editName.trim(),
        manufacturer: editManufacturer.trim(),
        details: editDetailsText.trim() || null,
      });

      toast.success("Detail updated successfully!", { id: toastId });
      setIsEditModalOpen(false);
      setEditingItem(null);
      fetchDetails();
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to update detail", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}" from ${item.manufacturer}?`)) {
      return;
    }

    try {
      await ConstructionDetailsApi.remove(item.id);
      toast.success("Construction detail deleted");
      setDetails((prev) => prev.filter((d) => d.id !== item.id));
      ConstructionDetailsApi.getManufacturers().then(setManufacturers);
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete detail");
    }
  };

  // Preview & Download actions - EXACTLY like Payslips and Trainings
  const handleAction = async (item, action = "view") => {
    if (action === "download") {
      if (!window.confirm(`Download "${item.name}" (${item.filename})?`)) return;
      toast.info("Starting download...");
      const url = ConstructionDetailsApi.downloadUrl(item.id);
      window.open(url, "_blank");
      setTimeout(() => toast.success("Download requested"), 1000);
      return;
    }

    toast.info("Opening detail...", { duration: 1500 });
    const url = ConstructionDetailsApi.fileUrl(item.id);
    window.open(url, "_blank");
  };

  const toggleGroupCollapse = (manuf) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [manuf]: !prev[manuf],
    }));
  };

  // Helper to determine file icon & color
  const getFileBadge = (filename = "", mime = "") => {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".pdf") || mime.includes("pdf")) {
      return {
        label: "PDF",
        icon: FileText,
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        isPdf: true,
      };
    }
    if (
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".png") ||
      lower.endsWith(".webp") ||
      lower.endsWith(".svg") ||
      mime.startsWith("image/")
    ) {
      return {
        label: "IMAGE",
        icon: ImageIcon,
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        isImage: true,
      };
    }
    return {
      label: "DOC",
      icon: FileCheck,
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      isDoc: true,
    };
  };

  // Filtered and Sorted Details
  const filteredAndSortedDetails = useMemo(() => {
    let list = [...details];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        return (
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.manufacturer && item.manufacturer.toLowerCase().includes(q)) ||
          (item.details && item.details.toLowerCase().includes(q)) ||
          (item.filename && item.filename.toLowerCase().includes(q))
        );
      });
    }

    // Manufacturer filter
    if (selectedManufacturer !== "all") {
      list = list.filter(
        (item) => item.manufacturer.toLowerCase() === selectedManufacturer.toLowerCase()
      );
    }

    // File type filter
    if (fileTypeFilter === "pdf") {
      list = list.filter(
        (item) => item.filename.toLowerCase().endsWith(".pdf") || (item.mime_type && item.mime_type.includes("pdf"))
      );
    } else if (fileTypeFilter === "image") {
      list = list.filter(
        (item) =>
          item.filename.toLowerCase().match(/\.(jpe?g|png|webp|svg|gif|bmp)$/) ||
          (item.mime_type && item.mime_type.startsWith("image/"))
      );
    }

    // Sorting: default "sort them by manufacturer than the details"
    list.sort((a, b) => {
      if (sortField === "manufacturer_then_details") {
        const mComp = (a.manufacturer || "").localeCompare(b.manufacturer || "", undefined, { sensitivity: "base" });
        if (mComp !== 0) return mComp;
        const dComp = (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
        if (dComp !== 0) return dComp;
        return (a.details || "").localeCompare(b.details || "", undefined, { sensitivity: "base" });
      }

      if (sortField === "manufacturer") {
        return (a.manufacturer || "").localeCompare(b.manufacturer || "", undefined, { sensitivity: "base" });
      }

      if (sortField === "name") {
        return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
      }

      if (sortField === "date_desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      if (sortField === "date_asc") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return 0;
    });

    return list;
  }, [details, searchQuery, selectedManufacturer, fileTypeFilter, sortField]);

  // Grouped by Manufacturer
  const groupedByManufacturer = useMemo(() => {
    const groups = {};
    filteredAndSortedDetails.forEach((item) => {
      const manuf = item.manufacturer || "Other";
      if (!groups[manuf]) {
        groups[manuf] = [];
      }
      groups[manuf].push(item);
    });

    // Ensure details within each group are sorted by name
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
    });

    return groups;
  }, [filteredAndSortedDetails]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = details.length;
    const totalManuf = new Set(details.map((d) => d.manufacturer?.toLowerCase())).size;
    const pdfCount = details.filter(
      (d) => d.filename?.toLowerCase().endsWith(".pdf") || d.mime_type?.includes("pdf")
    ).length;
    const imgCount = details.filter(
      (d) =>
        d.filename?.toLowerCase().match(/\.(jpe?g|png|webp|svg|gif|bmp)$/) ||
        d.mime_type?.startsWith("image/")
    ).length;
    return { totalCount, totalManuf, pdfCount, imgCount };
  }, [details]);

  const suggestedManufacturers = useMemo(() => {
    const existing = [...manufacturers];
    popularManufacturers.forEach((p) => {
      if (!existing.some((e) => e.toLowerCase() === p.toLowerCase())) {
        existing.push(p);
      }
    });
    return existing;
  }, [manufacturers]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-white">
        <RefreshCw className="h-10 w-10 animate-spin text-sky-400 mb-4" />
        <p className="text-gray-300 font-medium text-lg">Loading construction details...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="text-white space-y-6 pb-16"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20">
              <HardHat className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Construction Details
              </h1>
              <p className="text-gray-300 text-sm mt-0.5">
                Upload, organize, and view architectural & technical specifications.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" />
          Add Construction Detail
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black leading-none">{stats.totalCount}</div>
            <div className="text-xs text-gray-400 font-semibold mt-1">Total Details</div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black leading-none">{stats.totalManuf}</div>
            <div className="text-xs text-gray-400 font-semibold mt-1">Manufacturers</div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black leading-none">{stats.pdfCount}</div>
            <div className="text-xs text-gray-400 font-semibold mt-1">PDF Documents</div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black leading-none">{stats.imgCount}</div>
            <div className="text-xs text-gray-400 font-semibold mt-1">Images & Photos</div>
          </div>
        </GlassCard>
      </div>

      {/* Filter and Control Bar */}
      <GlassCard className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, manufacturer, details or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400 rounded-xl h-10 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300">
              <ArrowUpDown className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold text-gray-400 hidden sm:inline">Sort:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="bg-transparent border-0 text-white font-medium text-xs focus:ring-0 cursor-pointer outline-none"
              >
                <option value="manufacturer_then_details" className="bg-slate-900 text-white">
                  Manufacturer → Details (Default)
                </option>
                <option value="manufacturer" className="bg-slate-900 text-white">
                  Manufacturer (A-Z)
                </option>
                <option value="name" className="bg-slate-900 text-white">
                  Detail Name (A-Z)
                </option>
                <option value="date_desc" className="bg-slate-900 text-white">
                  Date Added (Newest)
                </option>
                <option value="date_asc" className="bg-slate-900 text-white">
                  Date Added (Oldest)
                </option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
              <button
                onClick={() => setFileTypeFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  fileTypeFilter === "all" ? "bg-sky-500 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFileTypeFilter("pdf")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                  fileTypeFilter === "pdf" ? "bg-red-500/80 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <FileText className="h-3 w-3" />
                PDF
              </button>
              <button
                onClick={() => setFileTypeFilter("image")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                  fileTypeFilter === "image" ? "bg-emerald-500/80 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <ImageIcon className="h-3 w-3" />
                Images
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewMode("grouped")}
                title="Grouped by Manufacturer"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "grouped" ? "bg-white/20 text-sky-400" : "text-gray-400 hover:text-white"
                }`}
              >
                <FolderKanban className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                title="Cards Grid"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "grid" ? "bg-white/20 text-sky-400" : "text-gray-400 hover:text-white"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="Table List"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "list" ? "bg-white/20 text-sky-400" : "text-gray-400 hover:text-white"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Manufacturer Filter Chips */}
        {manufacturers.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
            <span className="text-gray-400 font-semibold flex items-center gap-1 flex-shrink-0">
              <Building2 className="h-3.5 w-3.5 text-sky-400" />
              Manufacturers:
            </span>
            <button
              onClick={() => setSelectedManufacturer("all")}
              className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all border ${
                selectedManufacturer === "all"
                  ? "bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm"
                  : "bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10"
              }`}
            >
              All ({details.length})
            </button>
            {manufacturers.map((m) => {
              const count = details.filter((d) => d.manufacturer.toLowerCase() === m.toLowerCase()).length;
              const isSelected = selectedManufacturer.toLowerCase() === m.toLowerCase();
              return (
                <button
                  key={m}
                  onClick={() => setSelectedManufacturer(isSelected ? "all" : m)}
                  className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm"
                      : "bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span>{m}</span>
                  <span className="text-[10px] opacity-75 font-normal">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Main Content Area */}
      {filteredAndSortedDetails.length === 0 ? (
        <GlassCard className="p-12 text-center flex flex-col items-center justify-center">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4 text-sky-400">
            <HardHat className="h-12 w-12 opacity-80" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Construction Details Found</h3>
          <p className="text-gray-300 text-sm max-w-md mb-6">
            {searchQuery || selectedManufacturer !== "all" || fileTypeFilter !== "all"
              ? "No construction details match your search or active filters. Try clearing your filters."
              : "Start by uploading your first technical construction detail, spec sheet, or installation drawing."}
          </p>
          {searchQuery || selectedManufacturer !== "all" || fileTypeFilter !== "all" ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedManufacturer("all");
                setFileTypeFilter("all");
              }}
              className="border-white/20 hover:bg-white/10 text-white"
            >
              Clear Filters
            </Button>
          ) : (
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold px-6 py-2 rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload First Detail
            </Button>
          )}
        </GlassCard>
      ) : viewMode === "grouped" ? (
        /* Grouped View (by Manufacturer) */
        <div className="space-y-6">
          {Object.entries(groupedByManufacturer).map(([manuf, items]) => {
            const isCollapsed = !!collapsedGroups[manuf];
            return (
              <div key={manuf} className="space-y-3">
                {/* Group Header Card */}
                <div
                  onClick={() => toggleGroupCollapse(manuf)}
                  className="flex items-center justify-between p-3.5 bg-white/10 backdrop-blur-xl border border-white/15 rounded-xl cursor-pointer hover:bg-white/15 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors flex items-center gap-2">
                        {manuf}
                        <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-xs px-2 py-0.5">
                          {items.length} {items.length === 1 ? "detail" : "details"}
                        </Badge>
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-xs hidden sm:inline font-medium">
                      {isCollapsed ? "Expand" : "Collapse"}
                    </span>
                    {isCollapsed ? (
                      <ChevronRight className="h-5 w-5 group-hover:text-white transition-transform" />
                    ) : (
                      <ChevronDown className="h-5 w-5 group-hover:text-white transition-transform" />
                    )}
                  </div>
                </div>

                {/* Items in this group */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      {items.map((item) => (
                        <DetailCard
                          key={item.id}
                          item={item}
                          getFileBadge={getFileBadge}
                          onAction={handleAction}
                          onEdit={() => handleOpenEdit(item)}
                          onDelete={() => handleDelete(item)}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : viewMode === "grid" ? (
        /* Unified Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedDetails.map((item) => (
            <DetailCard
              key={item.id}
              item={item}
              getFileBadge={getFileBadge}
              onAction={handleAction}
              onEdit={() => handleOpenEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          ))}
        </div>
      ) : (
        /* Dense Table List View */
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/20 text-gray-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Manufacturer</th>
                  <th className="py-3.5 px-4">Detail Name</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Specifications / Details</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4 hidden sm:table-cell">Date Added</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAndSortedDetails.map((item) => {
                  const badge = getFileBadge(item.filename, item.mime_type);
                  const Icon = badge.icon;
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-3 px-4 font-bold text-sky-400">
                        {item.manufacturer}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-400 group-hover:text-sky-400" />
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300 hidden md:table-cell max-w-xs truncate">
                        {item.details || <span className="text-gray-500 italic">No notes</span>}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${badge.color} text-[10px] px-2 py-0.5 border`}>
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs hidden sm:table-cell whitespace-nowrap">
                        {item.created_at ? format(new Date(item.created_at), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAction(item, "view")}
                            title="Open in new tab"
                            className="text-gray-400 hover:text-sky-400 rounded-full h-8 w-8"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit"
                            className="text-gray-400 hover:text-white rounded-full h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAction(item, "download")}
                            title="Download"
                            className="text-gray-400 hover:text-emerald-400 rounded-full h-8 w-8"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item)}
                            title="Delete"
                            className="text-gray-400 hover:text-rose-400 rounded-full h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* ================= MODAL: ADD / UPLOAD DETAIL ================= */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <ModalOverlay onClose={() => !isUploading && setIsUploadModalOpen(false)}>
            <ModalContent onClose={() => !isUploading && setIsUploadModalOpen(false)} className="w-full max-w-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Add Construction Detail</h2>
                    <p className="text-xs text-gray-400">Upload PDF specifications, CAD details, or installation photos</p>
                  </div>
                </div>
                <button
                  onClick={() => !isUploading && setIsUploadModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* File Drop Area */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    File (PDF, JPG, PNG, WEBP, etc.) *
                  </Label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                      isDragOver
                        ? "border-sky-400 bg-sky-500/10 scale-[1.01]"
                        : uploadFile
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-white/20 bg-white/5 hover:border-sky-400/50 hover:bg-white/10"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.svg,.gif,.bmp,.doc,.docx"
                      onChange={(e) => handleFileSelect(e.target.files?.[0])}
                      className="hidden"
                    />

                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-4">
                        {filePreviewUrl ? (
                          <img
                            src={filePreviewUrl}
                            alt="Preview"
                            className="h-16 w-16 object-cover rounded-xl border border-white/20 shadow-md"
                          />
                        ) : (
                          <div className="p-3.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                            <FileText className="h-8 w-8" />
                          </div>
                        )}
                        <div className="text-left">
                          <p className="font-bold text-white text-sm truncate max-w-[240px] sm:max-w-xs">
                            {uploadFile.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {(uploadFile.size / 1024).toFixed(1)} KB • {uploadFile.type || "Document"}
                          </p>
                          <span className="text-[11px] text-sky-400 font-semibold hover:underline mt-1 inline-block">
                            Click to change file
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                          <Upload className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">
                            Click to browse or drag & drop file here
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Supports PDF documents, technical drawings & high-res images
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detail Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="upload-name" className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Detail Name *
                  </Label>
                  <Input
                    id="upload-name"
                    required
                    placeholder="e.g. Cavity Wall Tie Detail, Slab Edge Spec, Lintel Detail"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    className="bg-white/5 border-white/15 text-white placeholder:text-gray-500 rounded-xl h-11 focus:border-sky-400"
                  />
                </div>

                {/* Manufacturer */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="upload-manuf" className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Manufacturer *
                    </Label>
                    <span className="text-[11px] text-gray-400">Type or pick from below</span>
                  </div>
                  <Input
                    id="upload-manuf"
                    required
                    placeholder="e.g. Kingspan, Catnic, Rockwool, Knauf, Sika"
                    value={uploadManufacturer}
                    onChange={(e) => setUploadManufacturer(e.target.value)}
                    className="bg-white/5 border-white/15 text-white placeholder:text-gray-500 rounded-xl h-11 focus:border-sky-400"
                  />

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto">
                    {suggestedManufacturers.slice(0, 8).map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setUploadManufacturer(m)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-lg border font-medium transition-colors ${
                          uploadManufacturer.toLowerCase() === m.toLowerCase()
                            ? "bg-sky-500 text-white border-sky-400"
                            : "bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Details / Specifications */}
                <div className="space-y-1.5">
                  <Label htmlFor="upload-details" className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Specifications / Details (Optional)
                  </Label>
                  <Textarea
                    id="upload-details"
                    rows={3}
                    placeholder="e.g. 100mm cavity insulation, fire rated to class A1, fixing centers at 450mm..."
                    value={uploadDetailsText}
                    onChange={(e) => setUploadDetailsText(e.target.value)}
                    className="bg-white/5 border-white/15 text-white placeholder:text-gray-500 rounded-xl focus:border-sky-400 resize-none"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isUploading}
                    onClick={() => setIsUploadModalOpen(false)}
                    className="text-gray-400 hover:text-white hover:bg-white/10 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading || !uploadFile || !uploadName.trim() || !uploadManufacturer.trim()}
                    className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold px-6 rounded-xl shadow-lg shadow-sky-500/20 flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Save Construction Detail
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* ================= MODAL: EDIT DETAIL ================= */}
      <AnimatePresence>
        {isEditModalOpen && editingItem && (
          <ModalOverlay onClose={() => !isUploading && setIsEditModalOpen(false)}>
            <ModalContent onClose={() => !isUploading && setIsEditModalOpen(false)} className="w-full max-w-lg">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Edit className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Edit Construction Detail</h2>
                    <p className="text-xs text-gray-400">Update name, manufacturer or notes for this detail</p>
                  </div>
                </div>
                <button
                  onClick={() => !isUploading && setIsEditModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name" className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Detail Name *
                  </Label>
                  <Input
                    id="edit-name"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-white/5 border-white/15 text-white rounded-xl h-11 focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-manuf" className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Manufacturer *
                  </Label>
                  <Input
                    id="edit-manuf"
                    required
                    value={editManufacturer}
                    onChange={(e) => setEditManufacturer(e.target.value)}
                    className="bg-white/5 border-white/15 text-white rounded-xl h-11 focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-details" className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Specifications / Details
                  </Label>
                  <Textarea
                    id="edit-details"
                    rows={3}
                    value={editDetailsText}
                    onChange={(e) => setEditDetailsText(e.target.value)}
                    className="bg-white/5 border-white/15 text-white rounded-xl focus:border-amber-400 resize-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-gray-400">
                  <span className="truncate max-w-[280px]">File: {editingItem.filename}</span>
                  <Badge className="bg-white/10 text-gray-300 text-[10px]">
                    {(editingItem.size_bytes ? editingItem.size_bytes / 1024 : 0).toFixed(1)} KB
                  </Badge>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isUploading}
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading || !editName.trim() || !editManufacturer.trim()}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 rounded-xl"
                  >
                    {isUploading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Subcomponent: Construction Detail Card (matches Trainings / Payslips style)
function DetailCard({ item, getFileBadge, onAction, onEdit, onDelete }) {
  const badge = getFileBadge(item.filename, item.mime_type);
  const Icon = badge.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
    >
      <GlassCard className="group border-white/10 hover:border-sky-400/30 transition-all duration-300 h-full flex flex-col justify-between">
        <div>
          {/* Card Header: Icon & Action Buttons */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-sky-500/10 text-sky-400 transition-all">
                <Icon className="h-6 w-6" />
              </div>
              <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-xs px-2.5 py-1 font-bold">
                {item.manufacturer}
              </Badge>
            </div>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onAction(item, "view")}
                title="Open in new tab"
                className="text-gray-400 hover:text-sky-400 rounded-full h-8 w-8"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                title="Edit"
                className="text-gray-400 hover:text-white rounded-full h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onAction(item, "download")}
                title="Download"
                className="text-gray-400 hover:text-emerald-400 rounded-full h-8 w-8"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                title="Delete"
                className="text-gray-400 hover:text-rose-400 rounded-full h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Title & Notes */}
          <div className="mb-3">
            <h3 className="font-bold text-lg text-white mb-1.5 group-hover:text-sky-300 transition-colors line-clamp-2">
              {item.name}
            </h3>

            {item.details && (
              <p className="text-xs text-gray-300 bg-white/5 p-2.5 rounded-xl border border-white/5 line-clamp-3 mb-2">
                {item.details}
              </p>
            )}
          </div>
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-3 border-t border-white/10 mt-auto">
          <Badge className={`${badge.color} text-[10px] px-2 py-0.5 border font-semibold`}>
            {badge.label}
          </Badge>
          <span className="flex items-center gap-1 font-mono text-gray-500">
            <Calendar className="h-3 w-3" />
            {item.created_at ? format(new Date(item.created_at), "dd MMM yyyy") : ""}
          </span>
        </div>
      </GlassCard>
    </motion.div>
  );
}
