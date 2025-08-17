// src/pages/Layout.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import ImportData from "@/components/ImportData";
import { createPageUrl } from "@/utils";
import { Briefcase, Calendar, LogOut, User, Clock, Menu, X, Download, Building } from "lucide-react";
import { User as UserEntity } from "@/api/entities";
import { Project } from "@/api/entities";
import { TimeEntry } from "@/api/entities";
import { Hotel } from "@/api/entities";
import { AnimatePresence, motion } from "framer-motion";
import ProfileModal from "../components/profile/ProfileModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const navigationItems = [
  { title: "Week View", urlKey: "WeekView", icon: Calendar },
  { title: "Projects", urlKey: "Projects", icon: Briefcase },
  { title: "Hotels", urlKey: "Hotels", icon: Building },
];

const ExportButton = ({ onExport, onMenuStateChange }) => {
  const commonButtonClass =
    "w-full flex items-center space-x-3 px-4 py-3 mt-2 rounded-lg text-gray-300 hover:bg-white/10 transition-all duration-200";
  return (
    <Popover onOpenChange={onMenuStateChange}>
      <PopoverTrigger asChild>
        <button className={commonButtonClass}>
          <Download className="h-5 w-5" />
          <span>Export Data</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="bg-gray-800/80 backdrop-blur-lg border-white/20 text-white w-56 p-2">
        <div className="p-2">
          <h4 className="font-semibold text-sm text-white mb-2">Export Options</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Button variant="ghost" className="hover:bg-white/10 w-full justify-start p-2" onClick={() => onExport("TimeEntry", "json")}>
              Entries (JSON)
            </Button>
            <Button variant="ghost" className="hover:bg-white/10 w-full justify-start p-2" onClick={() => onExport("TimeEntry", "csv")}>
              Entries (CSV)
            </Button>
            <Button variant="ghost" className="hover:bg-white/10 w-full justify-start p-2" onClick={() => onExport("Project", "json")}>
              Projects (JSON)
            </Button>
            <Button variant="ghost" className="hover:bg-white/10 w-full justify-start p-2" onClick={() => onExport("Project", "csv")}>
              Projects (CSV)
            </Button>
            <Button variant="ghost" className="hover:bg-white/10 w-full justify-start p-2" onClick={() => onExport("Hotel", "json")}>
              Hotels (JSON)
            </Button>
            <Button variant="ghost" className="hover:bg-white/10 w-full justify-start p-2" onClick={() => onExport("Hotel", "csv")}>
              Hotels (CSV)
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const fetchUser = React.useCallback(async () => {
    try {
      const currentUser = await UserEntity.me();
      setUser(currentUser);
    } catch (e) {
      // Not logged in, redirect to login
      UserEntity.loginWithRedirect(window.location.href);
    }
  }, []);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    await UserEntity.logout();
    UserEntity.login();
  };

  const handleProfileSave = () => {
    setIsProfileModalOpen(false);
    fetchUser(); // Refresh user data
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const replacer = (key, value) => (value === null ? "" : value);
    const csvRows = data.map((row) => headers.map((fieldName) => JSON.stringify(row[fieldName], replacer)).join(","));
    csvRows.unshift(headers.join(","));
    return csvRows.join("\r\n");
  };

  const downloadFile = (content, fileName, contentType) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;

  // must be in the DOM in some browsers
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // delay revoke a bit so the download starts cleanly
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

  const handleExport = async (entityName, fileFormat) => {
    setIsMobileMenuOpen(false); // Close mobile menu if open

    if (!user) {
      alert("User not loaded. Please try again.");
      return;
    }

    const Entity = entityName === "Project" ? Project : entityName === "TimeEntry" ? TimeEntry : Hotel;

    let data;
    try {
      const sortKey = entityName === "TimeEntry" ? "date" : "name";
      data = await Entity.filter({ created_by: user.email }, sortKey);
    } catch (error) {
      console.error(`Error fetching ${entityName} data for export:`, error);
      alert(`Failed to fetch ${entityName.toLowerCase()} data. Please try again.`);
      return;
    }

    if (!data || data.length === 0) {
      alert(`No ${entityName.toLowerCase()} data to export.`);
      return;
    }
    if (entityName === "TimeEntry") {
      data = data.slice().sort((a, b) => b.date.localeCompare(a.date));
    } else if (entityName === "Project" || entityName === "Hotel") {
      data = data.slice().sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    }

    const processedData = data.map((item) => {
      const baseData = {
        user_name: user.full_name,
        user_email: user.email,
        created_at_time: item.created_date ? format(new Date(item.created_date), "HH:mm:ss") : "",
        updated_at_time: item.updated_date ? format(new Date(item.updated_date), "HH:mm:ss") : "",
      };

      if (entityName === "TimeEntry") {
        const [year, month, day] = item.date.split("-").map((num) => parseInt(num, 10));
        const entryDate = new Date(year, month - 1, day);
        return {
          ...baseData,
          date: item.date,
          day_of_week: format(entryDate, "EEEE"),
          project_name: item.project_name,
          hours_worked: item.hours_worked,
          travel_time: item.travel_time,
          hotel_name: item.hotel_name || "",
        };
      }
      if (entityName === "Project") {
        return {
          ...baseData,
          project_name: item.name,
          client: item.client,
          contract: item.contract || "",
          default_hours_worked: item.default_hours_worked,
          default_travel_time: item.default_travel_time || 0,
        };
      }
      if (entityName === "Hotel") {
        return {
          ...baseData,
          hotel_name: item.name,
          address: item.address || "",
        };
      }
      return item;
    });

    const dateStr = new Date().toISOString().split("T")[0];
    let fileContent, fileName, contentType;

    if (fileFormat === "json") {
      fileContent = JSON.stringify(processedData, null, 2);
      fileName = `${entityName.toLowerCase()}-export-${dateStr}.json`;
      contentType = "application/json";
    } else if (fileFormat === "csv") {
      fileContent = convertToCSV(processedData);
      fileName = `${entityName.toLowerCase()}-export-${dateStr}.csv`;
      contentType = "text/csv";
    }

    downloadFile(fileContent, fileName, contentType);
  };

  if (!user) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-sky-700">
        <div className="flex items-center space-x-2 text-white">
          <Clock className="animate-spin h-6 w-6" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-blue-900 to-sky-700 text-white font-sans">
      <AnimatePresence>
        {isProfileModalOpen && (
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            user={user}
            onSave={handleProfileSave}
          />
        )}
      </AnimatePresence>

      <div className="flex">
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/10 backdrop-blur-lg border-b border-white/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-wider">TimeSheet</h1>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-all"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="md:hidden fixed top-0 left-0 z-50 w-64 h-screen p-4 flex flex-col justify-between bg-black/10 backdrop-blur-lg border-r border-white/20"
            >
              <div>
                <div className="px-4 py-2 mb-8">
                  <h1 className="text-2xl font-bold tracking-wider">TimeSheet</h1>
                </div>
                <nav className="flex flex-col space-y-2">
                  {navigationItems.map((item) => {
                    const url = createPageUrl(item.urlKey);
                    const isActive = location.pathname.startsWith(url);
                    return (
                      <Link
                        key={item.title}
                        to={url}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive ? "bg-white/20 text-white shadow-lg" : "text-gray-300 hover:bg-black/10"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="border-t border-white/20 pt-2">
                <ExportButton
                  onExport={handleExport}
                  onMenuStateChange={(open) => {
                    if (!open) setIsMobileMenuOpen(false);
                  }}
                />
                <ImportData className="mt-2" />
                <button
                  onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2 mt-2 rounded-lg text-gray-300 hover:bg-black/10 transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{user.full_name}</p>
                    <p className="text-xs text-gray-400">{user.company || "Click to set company"}</p>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 mt-2 rounded-lg text-gray-300 hover:bg-black/10 transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 h-screen p-4 flex-col justify-between sticky top-0 bg-black/10 backdrop-blur-lg border-r border-white/20">
          <div>
            <div className="px-4 py-2 mb-8">
              <h1 className="text-2xl font-bold tracking-wider">TimeSheet</h1>
            </div>
            <nav className="flex flex-col space-y-2">
              {navigationItems.map((item) => {
                const url = createPageUrl(item.urlKey);
                const isActive = location.pathname.startsWith(url);
                return (
                  <Link
                    key={item.title}
                    to={url}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive ? "bg-white/20 text-white shadow-lg" : "text-gray-300 hover:bg-black/10"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="border-t border-white/20 pt-2">
            <ExportButton onExport={handleExport} onMenuStateChange={() => {}} />
            <ImportData className="mt-2" />
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="w-full flex items-center space-x-3 px-4 py-2 mt-2 rounded-lg text-gray-300 hover:bg-black/10 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">{user.full_name}</p>
                <p className="text-xs text-gray-400">{user.company || "Click to set company"}</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 mt-2 rounded-lg text-gray-300 hover:bg-black/10 transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-0 pt-16 md:pt-0">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
