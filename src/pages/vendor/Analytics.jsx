import { createElement, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  BarChart3,
  CircleAlert,
  CircleDollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Calendar, // Added for the filter icon
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const EMPTY_LIST = [];

// ... (formatters and helpers remain the same)
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

const toneClassMap = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

const normalizeAnalytics = (payload = {}) => {
  const stats = payload.stats || payload.summary || {};

  return {
    stats: {
      totalRevenue: Number(stats.totalRevenue || stats.revenue || 0),
      totalOrders: Number(stats.totalOrders || stats.orders || 0),
      averageOrderValue: Number(stats.averageOrderValue || stats.aov || 0),
      repeatCustomerRate: Number(stats.repeatCustomerRate || 0),
      fulfillmentRate: Number(stats.fulfillmentRate || 0),
      conversionRate: Number(stats.conversionRate || 0),
    },
    revenueTrend: Array.isArray(payload.revenueTrend)
      ? payload.revenueTrend
      : Array.isArray(payload.monthlyRevenue)
        ? payload.monthlyRevenue.map((entry) => ({
            label: entry.label || entry.month || "N/A",
            revenue: Number(entry.revenue || 0),
            orders: Number(entry.orders || 0),
          }))
        : [],
    categoryPerformance: Array.isArray(payload.categoryPerformance)
      ? payload.categoryPerformance
      : Array.isArray(payload.categories)
        ? payload.categories.map((entry) => ({
            name: entry.name || entry.category || "Category",
            revenue: Number(entry.revenue || 0),
            share: Number(entry.share || 0),
          }))
        : [],
    orderMix: Array.isArray(payload.orderMix) ? payload.orderMix : [],
    topProducts: Array.isArray(payload.topProducts) ? payload.topProducts : [],
  };
};

const StatCard = ({ title, value, helper, icon: Icon, tone = "blue" }) => {
  const toneMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-sm text-gray-500">{helper}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneMap[tone]}`}>
          {createElement(Icon, { className: "h-5 w-5" })}
        </div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const [analytics, setAnalytics] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // 1. Add state for the time range filter
  const [range, setRange] = useState("12m"); 

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        // 2. Pass the range as a query parameter
        const { data } = await axios.get(`${API_URL}/vendor/analytics`, {
          params: { range }, // axios handles appending ?range=X
          withCredentials: true,
        });

        const payload = data?.analytics || data?.data?.analytics || data;

        if (isMounted) {
          setAnalytics(normalizeAnalytics(payload));
        }
      } catch (err) {
       console.log(err);
       setError("Failed to load analytics data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [range]); // 3. Re-run effect when range changes

  const stats = analytics?.stats || {};
  const revenueTrend = analytics?.revenueTrend ?? EMPTY_LIST;
  const categoryPerformance = analytics?.categoryPerformance ?? EMPTY_LIST;
  const orderMix = analytics?.orderMix ?? EMPTY_LIST;
  const topProducts = analytics?.topProducts ?? EMPTY_LIST;

  const highestRevenue = useMemo(
    () => revenueTrend.reduce((max, item) => Math.max(max, Number(item.revenue || 0)), 0),
    [revenueTrend]
  );

  const totalMixValue = useMemo(
    () => orderMix.reduce((sum, item) => sum + Number(item.value || 0), 0),
    [orderMix]
  );

  const donutStyle = useMemo(() => {
    if (!orderMix.length || !totalMixValue) {
      return { background: "#e5e7eb" };
    }

    let cursor = 0;
    const stops = orderMix.map((item) => {
      const value = Number(item.value || 0);
      const percent = (value / totalMixValue) * 100;
      const nextCursor = cursor + percent;
      const color = {
        blue: "#3b82f6",
        emerald: "#10b981",
        amber: "#f59e0b",
        rose: "#f43f5e",
      }[item.tone || "blue"];

      const segment = `${color} ${cursor}% ${nextCursor}%`;
      cursor = nextCursor;
      return segment;
    });

    return {
      background: `conic-gradient(${stops.join(", ")})`,
    };
  }, [orderMix, totalMixValue]);

 return (
  <div className="space-y-4">
    {/* Compact Header */}
    <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-sky-400 to-blue-500" />
      <div className="px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Vendor Analytics</p>
              <h1 className="text-xl font-bold text-gray-900">Performance Overview</h1>
            </div>
            
            {/* 4. Timeframe Filter Dropdown */}
            <div className="relative">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500">
                <Calendar className="h-4 w-4 text-gray-400" />
                <select 
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-gray-700 outline-none cursor-pointer"
                >
                  <option value="3m">Last 3 Months</option>
                  <option value="6m">Last 6 Months</option>
                  <option value="12m">Last 12 Months</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 sm:min-w-[280px]">
            <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-tight text-gray-400">Repeat Rate</p>
              <p className="text-base font-bold text-gray-900">{stats.repeatCustomerRate || 0}%</p>
            </div>
            <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-tight text-gray-400">Conversion</p>
              <p className="text-base font-bold text-gray-900">{stats.conversionRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Primary Metric Cards */}
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard title="Revenue" value={formatCurrency(stats.totalRevenue)} helper="Gross revenue" icon={CircleDollarSign} tone="blue" />
      <StatCard title="Orders" value={formatCompactNumber(stats.totalOrders)} helper="Total volume" icon={ShoppingCart} tone="emerald" />
      <StatCard title="Avg Order" value={formatCurrency(stats.averageOrderValue)} helper="AOV value" icon={TrendingUp} tone="amber" />
      <StatCard title="Fulfillment" value={`${stats.fulfillmentRate || 0}%`} helper="Success rate" icon={Activity} tone="rose" />
    </section>

    {/* ... (Rest of the rendering logic remains the same) */}
    {/* Row 3: Revenue Trend & Order Mix */}
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Revenue Trend</h2>
            <p className="text-xs text-gray-500">Monthly growth momentum</p>
          </div>
          <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
            {revenueTrend.length} Periods
          </span>
        </div>

        {loading ? (
            <div className="py-20 text-center text-sm text-gray-400 animate-pulse">Loading trend...</div>
        ) : revenueTrend.length ? (
          <div className="space-y-6">
            {revenueTrend.map((entry) => {
              const width = highestRevenue > 0 ? Math.max((Number(entry.revenue || 0) / highestRevenue) * 100, 8) : 0;
              return (
                <div key={`${entry.label}-${entry.revenue}`}>
                  <div className="mb-2 flex items-end justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{entry.label}</p>
                      <p className="text-xs text-gray-400">{entry.orders || 0} orders</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(entry.revenue)}</p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-gray-400">No trend data available</div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm flex flex-col justify-between">
        <div className="mb-4">
          <h2 className="text-base font-bold text-gray-900">Order Mix</h2>
          <p className="text-xs text-gray-500">Fulfillment status</p>
        </div>

        {orderMix.length ? (
          <>
            <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full shadow-sm" style={donutStyle}>
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                <p className="text-xs font-bold uppercase text-gray-400">Orders</p>
                <p className="text-2xl font-bold text-gray-900">{totalMixValue}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {orderMix.map((item) => (
                <div key={item.label} className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${toneClassMap[item.tone] || toneClassMap.blue}`} />
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-sm text-gray-400">No mix data available</div>
        )}
      </div>
    </section>

    {/* Row 4: Category & Top Products */}
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Category Strength</h2>
            <p className="text-xs text-gray-500">Revenue concentration by niche</p>
          </div>
          <Package className="h-5 w-5 text-gray-300" />
        </div>

        {categoryPerformance.length ? (
          <div className="space-y-5">
            {categoryPerformance.map((category) => (
              <div key={category.name}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-700">{category.name}</p>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(category.revenue)}</span>
                    <span className="ml-2 text-xs text-gray-400">{category.share}% share</span>
                  </div>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                    style={{ width: `${Math.min(Number(category.share || 0), 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-gray-400">No category data</div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-900">Top Products</h2>
          <p className="text-xs text-gray-500">Best performers by volume and value</p>
        </div>

        {topProducts.length ? (
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between rounded-xl border border-gray-50 bg-gray-50/50 px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="overflow-hidden">
                  <p className="truncate text-sm font-bold text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sold || 0} units sold</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-gray-400">No product analytics</div>
        )}
      </div>
    </section>
  </div>
);
};

export default Analytics;