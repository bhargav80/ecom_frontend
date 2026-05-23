import { useEffect, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  PackageCheck,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";



const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const compactNumberFormatter = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));
const formatCompactNumber = (value) => compactNumberFormatter.format(Number(value || 0));

const formatMonth = (month) => {
  if (!month) return "N/A";
  const date = new Date(`${month}-01`);
  if (Number.isNaN(date.getTime())) return month;
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getStatusClasses = (status) => {
  switch (status) {
    case "paid":
    case "settled":
    case "active":
      return "bg-green-50 text-green-700 border-green-100";
    case "pending":
    case "processing":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-100";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const StatCard = ({ title, value, icon: Icon, tone = "blue", helper }) => {
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
          {helper && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${toneMap[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await axios.get(`${API_URL}/vendor/dashboard`, {
          withCredentials: true,
        });

        if (isMounted && data?.dashboard) {
          setDashboard(data.dashboard);
        }
      } catch (err) {
        if (isMounted) {
          setDashboard("Sample");
          setError(
            err.response?.data?.message ||
              "Showing sample dashboard data because the live dashboard could not be loaded."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
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
  const recentTransactions = dashboard?.recentTransactions || [];

  const highestRevenue = monthlyRevenue.reduce(
    (max, item) => Math.max(max, Number(item.revenue || 0)),
    0
  );

  const statCards = [
    {
      title: "Total Products",
      value: formatCompactNumber(stats.totalProducts),
      icon: Boxes,
      tone: "blue",
      helper: `${stats.activeProducts || 0} active listings`,
    },
    {
      title: "Total Orders",
      value: formatCompactNumber(stats.totalOrders),
      icon: ShoppingCart,
      tone: "emerald",
      helper: `${stats.cancelledTransactions || 0} cancelled transactions`,
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: CircleDollarSign,
      tone: "blue",
      helper: `${formatCurrency(stats.pendingBalance)} pending balance`,
    },
    {
      title: "Low Stock Alerts",
      value: formatCompactNumber(stats.lowStockCount),
      icon: AlertTriangle,
      tone: "amber",
      helper: "Products that need restocking soon",
    },
    {
      title: "Settled Balance",
      value: formatCurrency(stats.settledBalance),
      icon: Wallet,
      tone: "emerald",
      helper: `${formatCurrency(stats.totalDebits)} debits recorded`,
    },
    {
      title: "Active Products",
      value: formatCompactNumber(stats.activeProducts),
      icon: PackageCheck,
      tone: "rose",
      helper: "Live and available to customers",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400" />
        <div className="px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Vendor Dashboard</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                Welcome back, {dashboard?.vendor?.businessName || user?.businessName || "Vendor"}
              </h1>
             
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                  Pending
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {formatCurrency(stats.pendingBalance)}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                  Revenue
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
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
              <p className="text-sm text-gray-500">A quick look at revenue by month.</p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium">
              {monthlyRevenue.length} month{monthlyRevenue.length === 1 ? "" : "s"}
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
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
                const width =
                  highestRevenue > 0 ? Math.max((revenue / highestRevenue) * 100, 8) : 0;

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
              No revenue data available yet.
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Balance Snapshot</h2>
              <p className="text-sm text-gray-500">Current money flow at a glance.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/80 flex items-center justify-center text-emerald-600">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-emerald-700 font-medium">Settled</p>
                  <p className="text-xl font-bold text-emerald-900">
                    {formatCurrency(stats.settledBalance)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/80 flex items-center justify-center text-amber-600">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-amber-700 font-medium">Pending</p>
                  <p className="text-xl font-bold text-amber-900">
                    {formatCurrency(stats.pendingBalance)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Debits</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(stats.totalDebits)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-500">Cancelled</span>
                <span className="font-semibold text-gray-900">
                  {stats.cancelledTransactions || 0}
                </span>
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
              <p className="text-sm text-gray-500">Items that need attention soon.</p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-sm font-medium">
              {lowStockProducts.length} alert{lowStockProducts.length === 1 ? "" : "s"}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="h-20 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse"
                />
              ))}
            </div>
          ) : lowStockProducts.length ? (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div
                  key={product._id}
                  className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                      {product.stock} left
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Price</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              No low stock products right now.
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <p className="text-sm text-gray-500">Latest credits and order activity.</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="h-24 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse"
                />
              ))}
            </div>
          ) : recentTransactions.length ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {transaction.productName || transaction.product?.name || "Product"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Qty {transaction.quantity || 0} • {transaction.product?.category || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusClasses(
                        transaction.status
                      )}`}
                    >
                      {transaction.status || "unknown"}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusClasses(
                        transaction.order?.paymentStatus
                      )}`}
                    >
                      payment: {transaction.order?.paymentStatus || "unknown"}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusClasses(
                        transaction.order?.orderStatus
                      )}`}
                    >
                      order: {transaction.order?.orderStatus || "unknown"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              No recent transactions yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
