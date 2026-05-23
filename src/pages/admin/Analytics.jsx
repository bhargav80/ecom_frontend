import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  BarChart3,
  CircleDollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import {
  API_URL,
  formatCompactNumber,
  formatCurrency,
  toSentenceCase,
} from "./adminShared";

const toneClassMap = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

const tonePalette = ["blue", "emerald", "amber", "rose"];

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
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [range, setRange] = useState("12m");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await axios.get(`${API_URL}/admin/analytics`, {
          withCredentials: true,
          params: { range },
        });

        if (isMounted) {
          setAnalytics(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Unable to load analytics.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [range]);

  const stats = analytics?.stats || {};
  const revenueTrend = (analytics?.revenueTrend || []).map((entry, index) => ({
    ...entry,
    label: entry.month || entry.label || `Period ${index + 1}`,
  }));
  const categoryPerformance = analytics?.categoryPerformance || [];
  const orderMix = (analytics?.orderMix || []).map((entry, index) => ({
    ...entry,
    label: toSentenceCase(entry.status || entry.label || "unknown"),
    tone: tonePalette[index % tonePalette.length],
  }));

  const highestRevenue = useMemo(
    () => revenueTrend.reduce((max, item) => Math.max(max, Number(item.revenue || 0)), 0),
    [revenueTrend]
  );

  const categoryTotal = useMemo(
    () => categoryPerformance.reduce((sum, item) => sum + Number(item.revenue || 0), 0),
    [categoryPerformance]
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
      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-sky-400 to-blue-500" />
        <div className="px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Admin Analytics</p>
                <h1 className="text-xl font-bold text-gray-900">Marketplace performance</h1>
              </div>

              <div className="relative">
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                  <select
                    value={range}
                    onChange={(event) => setRange(event.target.value)}
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

            {error && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {error}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard title="Revenue" value={formatCurrency(stats.totalRevenue)} helper="Gross transaction value" icon={CircleDollarSign} tone="blue" />
        <StatCard title="Orders" value={formatCompactNumber(stats.totalOrders)} helper="Unique transacted orders" icon={ShoppingCart} tone="emerald" />
        <StatCard title="Categories" value={categoryPerformance.length} helper="Revenue contributing categories" icon={Package} tone="amber" />
        <StatCard title="Mix States" value={orderMix.length} helper="Order status groups" icon={Activity} tone="rose" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Revenue Trend</h2>
              <p className="text-xs text-gray-500">Selected range revenue movement</p>
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
                      <p className="text-sm font-bold text-gray-800">{entry.label}</p>
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
            <p className="text-xs text-gray-500">Distribution by order status</p>
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

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Category Performance</h2>
              <p className="text-xs text-gray-500">Revenue concentration by category</p>
            </div>
            <Package className="h-5 w-5 text-gray-300" />
          </div>

          {categoryPerformance.length ? (
            <div className="space-y-5">
              {categoryPerformance.map((category) => {
                const share = categoryTotal > 0 ? (Number(category.revenue || 0) / categoryTotal) * 100 : 0;

                return (
                  <div key={category.name}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-700">{category.name}</p>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(category.revenue)}</span>
                        <span className="ml-2 text-xs text-gray-400">{share.toFixed(1)}% share</span>
                      </div>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                        style={{ width: `${Math.min(share, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center text-sm text-gray-400">No category data</div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold text-gray-900">Analytics Notes</h2>
            <p className="text-xs text-gray-500">Quick read on what the selected range is showing.</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-4">
              <CircleDollarSign className="mt-0.5 h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Revenue in range</p>
                <p className="text-sm text-gray-500">{formatCurrency(stats.totalRevenue)} across the selected window.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-4">
              <TrendingUp className="mt-0.5 h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Top category impact</p>
                <p className="text-sm text-gray-500">
                  {categoryPerformance[0]
                    ? `${categoryPerformance[0].name} is currently the strongest category by revenue.`
                    : "Category performance data will appear here once transactions are available."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-4">
              <ShoppingCart className="mt-0.5 h-4 w-4 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Order concentration</p>
                <p className="text-sm text-gray-500">
                  {orderMix[0]
                    ? `${orderMix[0].label} accounts for the largest visible order-state segment.`
                    : "Order mix insights will appear once status data is available."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Analytics;
