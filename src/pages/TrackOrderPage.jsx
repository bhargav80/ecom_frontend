import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  BadgeCheck,
  CircleAlert,
  CreditCard,
  House,
  MapPin,
  Package,
  Receipt,
  Truck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const toSentenceCase = (value = "") =>
  value
    .toString()
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getStatusTone = (status) => {
  const normalized = status?.toString().toLowerCase();

  if (normalized === "delivered") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (normalized === "cancelled" || normalized === "failed") {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }

  if (normalized === "shipped") {
    return "bg-sky-50 text-sky-700 ring-sky-100";
  }

  return "bg-amber-50 text-amber-700 ring-amber-100";
};

const normalizeItems = (order = {}) => {
  const source = Array.isArray(order.orderItems)
    ? order.orderItems
    : Array.isArray(order.items)
      ? order.items
      : Array.isArray(order.products)
        ? order.products
        : [];

  return source.map((item, index) => ({
    id: item?._id || item?.product?._id || `${index}-${item?.productName || "item"}`,
    name: item?.productName || item?.name || item?.product?.name || "Product",
    quantity: Number(item?.quantity || item?.qty || 0),
    price: Number(item?.price || item?.product?.price || 0),
    image:
      item?.product?.images?.[0]?.url ||
      item?.image?.[0]?.url ||
      item?.image ||
      "https://via.placeholder.com/160?text=Item",
  }));
};

const normalizeOrder = (order = {}) => {
  const items = normalizeItems(order);
  const addressSource =
    order.shippingAddress || order.address || order.deliveryAddress || {};
  const totals = {
    subtotal:
      Number(order.itemsPrice || 0) ||
      items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    shipping: Number(order.shippingPrice || 0),
    total: Number(order.totalPrice || order.totalAmount || 0),
  };

  return {
    id: order._id || order.id || "",
    createdAt: order.createdAt || order.updatedAt || "",
    orderStatus: toSentenceCase(order.orderStatus || order.status || "Processing"),
    paymentStatus: toSentenceCase(order.paymentStatus || "Pending"),
    paymentMethod: order.paymentMethod || order.paymentStatus || "Online Payment",
    items,
    totals,
    shippingAddress: {
      name:
        addressSource.fullName ||
        addressSource.name ||
        order.user?.userName ||
        "Customer",
      line1: addressSource.address || addressSource.line1 || "",
      line2: addressSource.area || addressSource.line2 || "",
      city: addressSource.city || "",
      state: addressSource.state || "",
      postalCode: addressSource.postalCode || addressSource.pincode || "",
      phone: addressSource.phoneNo || addressSource.phone || "",
      country: addressSource.country || "India",
    },
    tracking: {
      carrier:
        order.trackingInfo?.carrier ||
        order.shippingInfo?.carrier ||
        "ShopNow Logistics",
      trackingId:
        order.trackingInfo?.trackingId ||
        order.shippingInfo?.trackingId ||
        order._id ||
        "",
      updatedAt:
        order.deliveredAt ||
        order.shippedAt ||
        order.updatedAt ||
        order.createdAt ||
        "",
    },
  };
};

const buildTimeline = (order) => {
  const normalizedStatus = order.orderStatus.toLowerCase();
  const createdAt = order.createdAt;
  const updateTime = order.tracking.updatedAt;
  const isCancelled = normalizedStatus === "cancelled";

  const steps = [
    {
      key: "placed",
      title: "Order placed",
      description: "We received your order and payment intent.",
      completed: true,
      active: false,
      time: createdAt,
    },
    {
      key: "processing",
      title: "Processing",
      description: "The seller is preparing your package.",
      completed: ["processing", "shipped", "delivered"].includes(normalizedStatus),
      active: normalizedStatus === "processing",
      time: ["processing", "shipped", "delivered"].includes(normalizedStatus) ? updateTime : "",
    },
    {
      key: "shipped",
      title: "Shipped",
      description: "Your package is on the way.",
      completed: ["shipped", "delivered"].includes(normalizedStatus),
      active: normalizedStatus === "shipped",
      time: ["shipped", "delivered"].includes(normalizedStatus) ? updateTime : "",
    },
    {
      key: "delivered",
      title: isCancelled ? "Cancelled" : "Delivered",
      description: isCancelled
        ? "This order was cancelled before completion."
        : "The package has reached its destination.",
      completed: normalizedStatus === "delivered" || isCancelled,
      active: normalizedStatus === "delivered" || isCancelled,
      time:
        normalizedStatus === "delivered" || isCancelled
          ? order.tracking.updatedAt || createdAt
          : "",
      danger: isCancelled,
    },
  ];

  return steps;
};

const TrackOrderPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await axios.get(`${API_URL}/orders/${orderId}`, {
          withCredentials: true,
        });

        const nextOrder = normalizeOrder(data?.order || data);
        if (isMounted) {
          setOrder(nextOrder);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "We couldn't load this order right now.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    } else {
      setLoading(false);
      setError("Missing order reference.");
    }

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const timeline = useMemo(() => (order ? buildTimeline(order) : []), [order]);

  const estimatedDelivery = useMemo(() => {
    if (!order?.createdAt) return "Not available";
    if (["Delivered", "Cancelled"].includes(order.orderStatus)) {
      return formatDate(order.tracking.updatedAt || order.createdAt);
    }

    const date = new Date(order.createdAt);
    if (Number.isNaN(date.getTime())) return "Not available";
    date.setDate(date.getDate() + 5);
    return formatDate(date.toISOString());
  }, [order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
            <div className="h-[25rem] animate-pulse rounded-2xl bg-white shadow-sm" />
            <div className="h-[25rem] animate-pulse rounded-2xl bg-white shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <CircleAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
            Unable to track this order
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {error || "The order details are not available."}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to orders
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Continue shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fullAddress = [
    order.shippingAddress.line1,
    order.shippingAddress.line2,
    order.shippingAddress.city,
    order.shippingAddress.state,
    order.shippingAddress.postalCode,
    order.shippingAddress.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.05),_transparent_40%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Main Header Tracking Banner */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400" />
          <div className="grid gap-6 px-5 py-6 lg:grid-cols-[1.3fr_0.7fr] lg:px-6">
            <div>
              <button
                type="button"
                onClick={() => navigate("/orders")}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 transition hover:border-slate-300 hover:bg-white"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to orders
              </button>

              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-sky-600">
                Live tracking
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                Order #{order.id.slice(-8).toUpperCase()}
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-500">
                Follow your shipment, review delivery details, and keep the order reference handy if you need support.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusTone(order.orderStatus)}`}>
                  <Package className="mr-1.5 h-3.5 w-3.5" />
                  {order.orderStatus}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusTone(order.paymentStatus)}`}>
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                  {order.paymentStatus}
                </span>
              </div>
            </div>

            {/* Quick Metrics Subgrid */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-xl bg-slate-950 p-4 text-white">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Estimated delivery
                </p>
                <p className="mt-1 text-lg font-bold">{estimatedDelivery}</p>
                <p className="mt-1 text-xs text-slate-300">
                  Carrier: {order.tracking.carrier}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tracking reference
                </p>
                <p className="mt-1 break-all text-xs font-semibold text-slate-900">
                  {order.tracking.trackingId}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Last updated {formatDateTime(order.tracking.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Details Splitting Layout */}
        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
          {/* Main Status Timeline Card */}
          <section className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Shipment timeline
                </p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                  Where your order is now
                </h2>
              </div>
              <Truck className="h-4 w-4 text-slate-400" />
            </div>

            <div className="mt-5 space-y-3">
              {timeline.map((step, index) => (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        step.danger
                          ? "bg-rose-100 text-rose-600"
                          : step.completed
                            ? "bg-emerald-100 text-emerald-600"
                            : step.active
                              ? "bg-sky-100 text-sky-600"
                              : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {step.completed ? <BadgeCheck className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                    </div>
                    {index < timeline.length - 1 ? (
                      <div
                        className={`mt-1 w-px flex-1 ${
                          step.completed ? "bg-emerald-200" : "bg-slate-200"
                        }`}
                      />
                    ) : null}
                  </div>

                  <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {step.time ? formatDateTime(step.time) : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-sky-100 bg-sky-50/50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                Delivery note
              </p>
              <p className="mt-1 text-xs leading-relaxed text-sky-950">
                Orders usually arrive within 3 to 5 business days after dispatch. If the status has not changed for a while, share your order reference with support.
              </p>
            </div>
          </section>

          {/* Sidebar Section */}
          <aside className="space-y-4">
            {/* Address */}
            <section className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Shipping address
                  </p>
                  <h2 className="mt-0.5 text-sm font-bold text-slate-950">
                    Delivering to {order.shippingAddress.name}
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                {fullAddress || "Address details were not provided for this order."}
              </p>
              {order.shippingAddress.phone ? (
                <p className="mt-1.5 text-xs font-semibold text-slate-900">
                  {order.shippingAddress.phone}
                </p>
              ) : null}
            </section>

            {/* Order Summary & Item Rows */}
            <section className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <Receipt className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Order summary
                  </p>
                  <h2 className="mt-0.5 text-sm font-bold text-slate-950">
                    {order.items.length} item{order.items.length === 1 ? "" : "s"}
                  </h2>
                </div>
              </div>

              <div className="mt-4 space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-12 w-12 rounded-lg border border-slate-100 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-xs font-semibold text-slate-900">{item.name}</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Qty {item.quantity} <span className="mx-1 text-slate-300">|</span> {formatCurrency(item.price)} each
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown Breakdown */}
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.totals.shipping)}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-950">
                  <span>Total paid</span>
                  <span>{formatCurrency(order.totals.total || order.totals.subtotal + order.totals.shipping)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Placed on</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Payment method</span>
                  <span>{toSentenceCase(order.paymentMethod)}</span>
                </div>
              </div>
            </section>

            {/* Quick Actions Panel */}
            <section className="rounded-2xl border border-slate-200/60 bg-slate-950 p-5 text-white shadow-sm">
              <div className="flex items-center gap-2.5">
                <House className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Need anything else?
                  </p>
                  <h2 className="mt-0.5 text-sm font-bold">Manage your next step</h2>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/orders")}
                  className="rounded-lg bg-white py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  View all orders
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="rounded-lg border border-slate-700 py-2 text-xs font-semibold text-white transition hover:border-slate-500 hover:bg-slate-900"
                >
                  Continue shopping
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;