import { createElement, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  PackageCheck,
  Search,
  ShoppingBag,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const PAGE_SIZE = 6;

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

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

const formatDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const toSentenceCase = (value = "") =>
  value
    .toString()
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getStatusClasses = (status) => {
  const normalized = status?.toString().toLowerCase();

  switch (normalized) {
    case "paid":
    case "delivered":
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "pending":
    case "processing":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "cancelled":
    case "refunded":
      return "bg-rose-50 text-rose-700 border-rose-100";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const normalizeOrder = (order = {}) => {
  const items = Array.isArray(order.items)
    ? order.items
    : Array.isArray(order.products)
      ? order.products
      : Array.isArray(order.orderItems)
        ? order.orderItems
        : [];

  const normalizedItems = items.map((item) => ({
    name: item?.name || item?.product?.name || "Product",
    quantity: Number(item?.quantity || item?.qty || 0),
    price: Number(item?.price || item?.product?.price || 0),
  }));

  const itemCount = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    _id: order._id || order.id || `sample-${Math.random().toString(36).slice(2, 7)}`,
    customer: {
      name: order?.customer?.userName || order?.customer?.name || order?.user?.userName || order?.user?.name || "Customer",
      email: order?.customer?.email || order?.user?.email || "",
    },
    items: normalizedItems,
    itemCount,
    totalAmount: Number(order.totalAmount || order.totalPrice || order.amount || 0),
    paymentStatus: toSentenceCase(order.paymentStatus || "Pending"),
    orderStatus: toSentenceCase(order.orderStatus || order.status || "Pending"),
    createdAt: order.createdAt || order.updatedAt || new Date().toISOString(),
    shippingAddress: {
      city:
        order?.shippingAddress?.city ||
        order?.address?.city ||
        order?.deliveryAddress?.city ||
        "",
      state:
        order?.shippingAddress?.state ||
        order?.address?.state ||
        order?.deliveryAddress?.state ||
        "",
    },
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
          {helper ? <p className="mt-1 text-sm text-gray-500">{helper}</p> : null}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneMap[tone]}`}>
          {createElement(Icon, { className: "h-5 w-5" })}
        </div>
      </div>
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await axios.get(`${API_URL}/vendor/orders`, {
          withCredentials: true,
        });

        const rawOrders = Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data?.data?.orders)
            ? data.data.orders
            : Array.isArray(data)
              ? data
              : [];

        if (isMounted) {
          setOrders(rawOrders.map(normalizeOrder));
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Unable to load vendor orders right now.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, startDate, endDate]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    const startTime = startDate ? new Date(`${startDate}T00:00:00`).getTime() : null;
    const endTime = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : null;

    return orders.filter((order) => {
      const matchesStatus = statusFilter === "All" || order.orderStatus === statusFilter;
      const orderTime = new Date(order.createdAt).getTime();
      const matchesDateRange =
        (!startTime || (!Number.isNaN(orderTime) && orderTime >= startTime)) &&
        (!endTime || (!Number.isNaN(orderTime) && orderTime <= endTime));
      const location = [order.shippingAddress.city, order.shippingAddress.state]
        .filter(Boolean)
        .join(", ")
        .toLowerCase();
      const itemsLabel = order.items.map((item) => item.name).join(" ").toLowerCase();
      const createdAtLabel = formatDate(order.createdAt).toLowerCase();
      const createdAtInputValue = formatDateInputValue(order.createdAt);
      const matchesSearch =
        !term ||
        order._id.toLowerCase().includes(term) ||
        order.customer.name.toLowerCase().includes(term) ||
        order.customer.email.toLowerCase().includes(term) ||
        itemsLabel.includes(term) ||
        location.includes(term) ||
        createdAtLabel.includes(term) ||
        createdAtInputValue.includes(term);

      return matchesStatus && matchesSearch && matchesDateRange;
    });
  }, [orders, search, statusFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  const paginationLabel = useMemo(() => {
    if (!filteredOrders.length) return "0 of 0";
    const startIndex = (currentPage - 1) * PAGE_SIZE + 1;
    const endIndex = Math.min(currentPage * PAGE_SIZE, filteredOrders.length);
    return `${startIndex}-${endIndex} of ${filteredOrders.length}`;
  }, [currentPage, filteredOrders]);

  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => {
      if (order.paymentStatus === "Paid") return sum + order.totalAmount;
      return sum;
    }, 0);

    const pendingOrders = filteredOrders.filter((order) =>
      ["Pending", "Processing"].includes(order.orderStatus)
    ).length;

    const deliveredOrders = filteredOrders.filter((order) => order.orderStatus === "Delivered").length;
    const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      pendingOrders,
      deliveredOrders,
      averageOrderValue,
    };
  }, [filteredOrders]);

  const statusOptions = useMemo(() => {
    const uniqueStatuses = new Set(orders.map((order) => order.orderStatus));
    return ["All", ...uniqueStatuses];
  }, [orders]);

 return (
  <div className="space-y-4">
    {/* Compact Header */}
    <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />
      <div className="px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Vendor Orders</p>
            <h1 className="text-xl font-bold text-gray-900">Track every order</h1>
          </div>

          <div className="flex gap-2 sm:min-w-[280px]">
            <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-tight text-gray-400">Delivered</p>
              <p className="text-base font-bold text-gray-900">{stats.deliveredOrders}</p>
            </div>
            <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-tight text-gray-400">AOV</p>
              <p className="text-base font-bold text-gray-900">{formatCurrency(stats.averageOrderValue)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {error}
          </div>
        )}
      </div>
    </section>

    {/* Compact Stat Cards */}
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard
        title="Visible"
        value={stats.totalOrders}
        helper="Filtered count"
        icon={ShoppingBag}
        tone="blue"
      />
      <StatCard
        title="Revenue"
        value={formatCurrency(stats.totalRevenue)}
        helper="Paid only"
        icon={ArrowUpRight}
        tone="emerald"
      />
      <StatCard
        title="Pending"
        value={stats.pendingOrders}
        helper="Awaiting action"
        icon={Clock3}
        tone="amber"
      />
      <StatCard
        title="Delivered"
        value={stats.deliveredOrders}
        helper="Completed"
        icon={PackageCheck}
        tone="rose"
      />
    </section>

    {/* Compact One-Line Filter Bar */}
    <section className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        {/* Search - Flexible width */}
        <div className="relative flex-[2]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
          />
        </div>

        {/* Status Select */}
        <div className="flex-1 min-w-[140px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div className="flex-1 min-w-[140px]">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase pl-1 text-gray-400">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate || undefined}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white"
            />
          </div>
        </div>

        {/* Date To */}
        <div className="flex-1 min-w-[140px]">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase pl-1 text-gray-400">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white"
            />
          </div>
        </div>

        {/* Clear Action */}
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setStatusFilter("All");
            setStartDate("");
            setEndDate("");
          }}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-blue-600"
        >
          Clear
        </button>
      </div>
    </section>

    {/* Compact Order Feed */}
    <section className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Order Feed</h2>
        <span className="text-xs text-gray-500">Recent Activity</span>
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-50" />
          ))}
        </div>
      ) : filteredOrders.length ? (
        <div className="divide-y divide-gray-50">
          {paginatedOrders.map((order) => {
            const location = [order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(", ");

            return (
              <article key={order._id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900">{order._id}</h3>
                      <div className="flex gap-1">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${getStatusClasses(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${getStatusClasses(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <p><span className="font-semibold text-gray-700">{order.customer.name}</span></p>
                      <p>{formatDate(order.createdAt)}</p>
                      <p>{location || "No Location"}</p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                          {item.name} ×{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 xl:min-w-[280px]">
                    <div className="flex-1 rounded-lg border border-gray-50 bg-gray-50/50 px-3 py-1.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Qty</p>
                      <p className="text-sm font-bold text-gray-900">{order.itemCount}</p>
                    </div>
                    <div className="flex-1 rounded-lg border border-gray-50 bg-gray-50/50 px-3 py-1.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="py-10 text-center">
          <CircleAlert className="mx-auto h-8 w-8 text-amber-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">No results found</p>
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && filteredOrders.length ? (
        <div className="flex items-center justify-between border-t border-gray-50 px-5 py-3">
          <p className="text-xs text-gray-500">{paginationLabel}</p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  </div>
);
};

export default Orders;
