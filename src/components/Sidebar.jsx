import { createElement, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/vendor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/vendor/products", icon: Package, label: "Products" },
  { to: "/vendor/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/vendor/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/vendor/profile", icon: User, label: "Profile" },
];

const NavItems = ({ isCollapsed = false, onNavigate }) => (
  <nav className="mt-3 flex flex-col gap-1.5 px-3">
    {links.map(({ to, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        onClick={onNavigate}
        title={isCollapsed ? label : undefined}
        className={({ isActive }) =>
          [
            "group flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/30",
            isCollapsed ? "justify-center px-2" : "px-3.5",
            isActive
              ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-950",
          ].join(" ")
        }
      >
        {createElement(Icon, { className: "h-[18px] w-[18px] flex-shrink-0" })}
        {!isCollapsed && <span className="truncate">{label}</span>}
      </NavLink>
    ))}
  </nav>
);

const LogoutButton = ({ isCollapsed = false, onLogout }) => (
  <button
    type="button"
    onClick={onLogout}
    title={isCollapsed ? "Logout" : undefined}
    className={[
      "mx-3 mb-4 flex items-center gap-3 rounded-xl py-2.5 text-sm font-semibold text-red-600 transition",
      "hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/20",
      isCollapsed ? "justify-center px-2" : "px-3.5",
    ].join(" ")}
  >
    <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
    {!isCollapsed && <span className="truncate">Logout</span>}
  </button>
);

const SidebarHeader = ({ collapsed, onToggle }) => (
  <div
    className={`flex items-center border-b border-gray-100 px-4 py-4 ${
      collapsed ? "justify-center" : "justify-between"
    }`}
  >
    {!collapsed && (
      <div>
        <p className="text-base font-bold text-gray-950">Vendor Panel</p>
        <p className="mt-0.5 text-xs text-gray-500">Manage your store</p>
      </div>
    )}

    <button
      type="button"
      onClick={onToggle}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? <Menu className="h-[18px] w-[18px]" /> : <ChevronLeft className="h-[18px] w-[18px]" />}
    </button>
  </div>
);

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-blue-600 md:hidden"
        aria-label="Open vendor menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 transform flex-col border-r border-gray-100 bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-base font-bold text-gray-950">Vendor Panel</p>
            <p className="mt-0.5 text-xs text-gray-500">Manage your store</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close vendor menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between">
          <NavItems onNavigate={() => setMobileOpen(false)} />
          <LogoutButton onLogout={handleLogout} />
        </div>
      </aside>

      <aside
        className={`hidden min-h-screen flex-shrink-0 flex-col border-r border-gray-100 bg-white shadow-sm transition-all duration-300 ease-out md:flex ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <SidebarHeader collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />

        <div className="flex min-h-0 flex-1 flex-col justify-between">
          <NavItems isCollapsed={collapsed} />
          <LogoutButton isCollapsed={collapsed} onLogout={handleLogout} />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
