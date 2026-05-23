import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  PackageSearch,
  ShoppingCart,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  API_URL,
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatMonth,
  getStatusClasses,
} from "./adminShared";

const StatCard = ({ title, value, helper, icon: Icon, tone = "blue" }) => {
  const toneMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-sm text-gray-500">{helper}</p>
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${toneMap[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await axios.get(`${API_URL}/admin/dashboard`, {
          withCredentials: true,
        });

        if (isMounted) {
          setDashboard(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Unable to load the admin dashboard right now.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = dashboard?.stats || {};
  const monthlyRevenue = dashboard?.monthlyRevenue || [];
  const lowStockProducts = dashboard?.lowStockProducts || [];
  const recentOrders = dashboard?.recentOrders || [];

  const highestRevenue = useMemo(
    () => monthlyRevenue.reduce((max, item) => Math.max(max, Number(item.revenue || 0)), 0),
    [monthlyRevenue]
  );

  const statCards = [
    {
      title: "Customers",
      value: formatCompactNumber(stats.totalUsers),
      helper: "Registered customers",
      icon: Users,
      tone: "blue",
    },
    {
      title: "Vendors",
      value: formatCompactNumber(stats.totalVendors),
      helper: "Marketplace sellers",
      icon: Store,
      tone: "emerald",
    },
    {
      title: "Products",
      value: formatCompactNumber(stats.totalProducts),
      helper: "Items on platform",
      icon: Boxes,
      tone: "amber",
    },
    {
      title: "Orders",
      value: formatCompactNumber(stats.totalOrders),
      helper: "All-time order volume",
      icon: ShoppingCart,
      tone: "rose",
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.totalRevenue),
      helper: "Gross marketplace earnings",
      icon: CircleDollarSign,
      tone: "blue",
    },
    {
      title: "Pending Payouts",
      value: formatCurrency(stats.pendingPayouts),
      helper: "Awaiting settlement",
      icon: Wallet,
      tone: "amber",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400" />
        <div className="px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Admin Dashboard</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                Welcome back, {user?.userName || "Admin"}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Monitor revenue, stock risk, vendor activity, and recent platform orders from one place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Revenue</p>
                <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Payouts</p>
                <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(stats.pendingPayouts)}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Monthly Revenue</h2>
              <p className="text-sm text-gray-500">Trailing revenue built from vendor transactions.</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 w-24 rounded bg-gray-100 animate-pulse" />
                  <div className="h-3 w-full rounded-full bg-gray-100 animate-pulse" />
                </div>
              ))}
            </div>
          ) : monthlyRevenue.length ? (
            <div className="space-y-5">
              {monthlyRevenue.map((entry) => {
                const revenue = Number(entry.revenue || 0);
                const width = highestRevenue > 0 ? Math.max((revenue / highestRevenue) * 100, 8) : 0;

                return (
                  <div key={entry.month}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">{formatMonth(entry.month)}</p>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(revenue)}</p>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              No revenue history available yet.
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Operations Snapshot</h2>
              <p className="text-sm text-gray-500">Platform pressure points you may want to review.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-sm text-blue-700 font-medium">Products needing attention</p>
              <p className="mt-1 text-2xl font-bold text-blue-900">{lowStockProducts.length}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
              <p className="text-sm text-amber-700 font-medium">Pending payouts</p>
              <p className="mt-1 text-2xl font-bold text-amber-900">{formatCurrency(stats.pendingPayouts)}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Recent orders</span>
                <span className="font-semibold text-gray-900">{recentOrders.length}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-500">Total listings</span>
                <span className="font-semibold text-gray-900">{formatCompactNumber(stats.totalProducts)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Low Stock Products</h2>
              <p className="text-sm text-gray-500">Items below or near the stock threshold.</p>
            </div>
            <PackageSearch className="h-5 w-5 text-gray-300" />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-20 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
              ))}
            </div>
          ) : lowStockProducts.length ? (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product._id} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{product.category || "Uncategorized"}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600">
                      {product.stock} left
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Price</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(product.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              No low stock alerts right now.
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <p className="text-sm text-gray-500">Fresh platform activity from the last few orders.</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-24 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order._id} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.user?.userName || "Customer"}</h3>
                      <p className="mt-1 text-sm text-gray-500">{order.user?.email || "No email"}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusClasses(
                        order.orderStatus
                      )}`}
                    >
                      {order.orderStatus || "processing"}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-500">{formatDate(order.createdAt)}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusClasses(
                        order.paymentStatus
                      )}`}
                    >
                      payment: {order.paymentStatus || "pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              No recent orders available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
