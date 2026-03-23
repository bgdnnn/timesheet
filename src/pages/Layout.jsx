// src/pages/Layout.jsx
import React from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Briefcase,
  Calendar,
  LogOut,
  User,
  Clock,
  Menu,
  X,
  Building,
  DollarSign,
  Shield,
  FileText,
  Award,
} from "lucide-react";
import { User as UserEntity } from "@/api/entities";
import { AnimatePresence, motion } from "framer-motion";
import ProfileModal from "../components/profile/ProfileModal";

const navigationItems = [
  { title: "Week View", urlKey: "WeekView", icon: Calendar },
  { title: "Projects", urlKey: "Projects", icon: Briefcase },
  { title: "Hotels", urlKey: "Hotels", icon: Building },
  { title: "Receipts", urlKey: "Receipts", icon: Calendar },
  { title: "Expenses", urlKey: "Expenses", icon: Calendar },
  { title: "Earnings", urlKey: "Earnings", icon: DollarSign },
  { title: "Payslips", urlKey: "payslips", icon: FileText },
  { title: "Trainings", urlKey: "trainings", icon: Award },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [user, setUser] = React.useState(null);

  const fetchUser = React.useCallback(async () => {
    try {
      const data = await UserEntity.me();
      setUser(data);
    } catch (e) {
      console.warn("Auth check failed", e);
      if (e.status === 401) {
        navigate("/login");
      }
    }
  }, [navigate]);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    await UserEntity.logout();
    navigate("/login");
  };

  const isActive = (urlKey) => {
    const path = createPageUrl(urlKey);
    return location.pathname === path || (path === "/WeekView" && location.pathname === "/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-sky-700 font-sans selection:bg-blue-500/30 text-white">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-black/10 border-r border-white/10 hidden lg:flex flex-col z-40 backdrop-blur-xl">
        <div className="p-8">
          <div className="flex items-center space-x-3 group">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 shadow-lg shadow-blue-500/20">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white">
              WorkFlow
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.urlKey);
            return (
              <Link
                key={item.title}
                to={createPageUrl(item.urlKey)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  active
                    ? "bg-white/10 text-sky-400 border border-white/10"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 ${
                    active ? "scale-110" : "group-hover:scale-110"
                  }`}
                />
                <span className="font-bold text-sm tracking-wide">{item.title}</span>
                {active && (
                  <motion.div
                    layoutId="active-pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]"
                  />
                )}
              </Link>
            );
          })}
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                location.pathname === "/admin"
                  ? "bg-white/10 text-cyan-400 border border-white/10"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              <Shield className={`h-5 w-5 transition-transform duration-200 ${location.pathname === "/admin" ? "scale-110" : "group-hover:scale-110"}`} />
              <span className="font-bold text-sm tracking-wide">Admin</span>
            </Link>
          )}
        </nav>

        <div className="p-4 space-y-2 border-t border-white/10 bg-black/20">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 transition-all duration-200 text-left"
          >
            <User className="h-5 w-5 flex-shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold truncate">Profile</span>
              <span className="text-[10px] text-gray-500 truncate">{user?.email}</span>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all duration-200 group"
          >
            <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            <span className="text-sm font-bold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900/80 backdrop-blur-lg border-b border-white/10 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-sky-600">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-black text-white">WorkFlow</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[280px] bg-gray-900 border-l border-white/10 z-[60] lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xl font-black text-white">Menu</span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.urlKey);
                    return (
                      <Link
                        key={item.title}
                        to={createPageUrl(item.urlKey)}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-2 rounded-xl transition-all ${
                          active
                            ? "bg-blue-500/10 text-sky-400 border border-sky-500/20"
                            : "text-white/70"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${active ? "text-sky-400" : ""}`} />
                        <span className="font-bold text-sm">{item.title}</span>
                      </Link>
                    );
                  })}
                  {user?.role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-2 rounded-xl transition-all ${
                        location.pathname === "/admin"
                          ? "bg-blue-500/10 text-sky-400 border border-sky-500/20"
                          : "text-white/70"
                      }`}
                    >
                      <Shield className={`h-5 w-5 ${location.pathname === "/admin" ? "text-sky-400" : ""}`} />
                      <span className="font-bold text-sm">Admin Panel</span>
                    </Link>
                  )}
                </nav>

                <div className="mt-auto space-y-2 pt-6 border-t border-white/10">
                  <button
                    onClick={() => {
                      setIsProfileModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-gray-300 active:bg-white/5"
                  >
                    <User className="h-5 w-5" />
                    <span className="font-bold text-sm">Profile Settings</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-rose-400 active:bg-rose-500/5"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-bold text-sm">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 min-h-screen">
          <Outlet context={{ user, fetchUser }} />
        </div>
      </main>

      <AnimatePresence>
        {isProfileModalOpen && (
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            user={user}
            onSave={fetchUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
