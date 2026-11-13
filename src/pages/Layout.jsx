// src/pages/Layout.jsx
import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
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
  Palmtree,
  HardHat,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import ProfileModal from "../components/profile/ProfileModal";

const navigationItems = [
  { title: "Week View", urlKey: "WeekView", icon: Calendar, section: "Workspace" },
  { title: "Projects", urlKey: "Projects", icon: Briefcase },
  { title: "Hotels", urlKey: "Hotels", icon: Building },
  { title: "Receipts", urlKey: "Receipts", icon: ReceiptText, section: "Finance" },
  { title: "Expenses", urlKey: "Expenses", icon: Wallet },
  { title: "Earnings", urlKey: "Earnings", icon: DollarSign },
  { title: "Payslips", urlKey: "payslips", icon: FileText },
  { title: "Trainings", urlKey: "trainings", icon: Award, section: "Records" },
  { title: "Construction Details", urlKey: "construction-details", icon: HardHat },
  { title: "Holidays", urlKey: "Holidays", icon: Palmtree },
];

export default function Layout() {
  const location = useLocation();
  const { user, checkSession: fetchUser, logout: handleLogout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);

  const isActive = (urlKey) => {
    const path = createPageUrl(urlKey);
    return location.pathname.toLowerCase() === path.toLowerCase() || (path.toLowerCase() === "/weekview" && location.pathname === "/");
  };

  return (
    <div className="workflow-app font-sans selection:bg-teal-400/25 text-white">
      <div className="wf-ambient" aria-hidden="true" />
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 wf-sidebar hidden lg:flex flex-col z-40 backdrop-blur-xl">
        <div className="px-7 pt-8 pb-3">
          <div className="flex items-center space-x-3 group">
            <div className="wf-brand-mark p-2.5 rounded-2xl">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">WorkFlow<span className="text-teal-300">.</span></span>
              <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 mt-0.5">Time well spent</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.urlKey);
            return (
              <React.Fragment key={item.title}>
              {item.section && <div className="wf-nav-section">{item.section}</div>}
              <Link
                aria-current={active ? "page" : undefined}
                to={createPageUrl(item.urlKey)}
                className={`wf-nav-link flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
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
              </React.Fragment>
            );
          })}
          {user?.role === "admin" && (
            <Link
              to="/admin"
              aria-current={location.pathname === "/admin" ? "page" : undefined}
              className={`wf-nav-link flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
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

        <div className="wf-sidebar-footer p-4 space-y-2">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="wf-action w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/10 transition-all duration-200 text-left"
          >
            <User className="h-5 w-5 flex-shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold truncate">Profile</span>
              <span className="text-[10px] text-gray-500 truncate">{user?.email}</span>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="wf-action w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all duration-200 group"
          >
            <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            <span className="text-sm font-bold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 wf-mobile-header backdrop-blur-lg z-50 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="wf-brand-mark p-1.5 rounded-lg">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-black text-white">WorkFlow</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          className="wf-icon-button p-2 text-gray-400 hover:text-white transition-colors"
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
              id="mobile-navigation"
              className="fixed right-0 top-0 bottom-0 w-[280px] bg-[#0c1727] border-l border-white/10 z-[60] lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xl font-black text-white">Menu</span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close navigation"
                    className="wf-icon-button p-2 text-gray-400 hover:text-white"
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
                        aria-current={active ? "page" : undefined}
                        to={createPageUrl(item.urlKey)}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`wf-nav-link flex items-center space-x-3 px-4 py-2 rounded-xl transition-all ${
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
                      className={`wf-nav-link flex items-center space-x-3 px-4 py-2 rounded-xl transition-all ${
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
        <div className="max-w-[1440px] mx-auto p-4 md:p-8 lg:px-10 lg:py-10 min-h-screen">
          <div className="hidden lg:flex items-center justify-between mb-9 pb-5 border-b border-white/[0.06]">
            <span className="wf-topline">Your workspace</span>
            <span className="text-xs text-slate-500">{new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</span>
          </div>
          <div className="wf-page" key={location.pathname}>
            <Outlet context={{ user, fetchUser }} />
          </div>
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
