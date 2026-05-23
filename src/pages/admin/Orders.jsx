import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Receipt, Search } from "lucide-react";
import {
  API_URL,
  formatCurrency,
  formatDate,
  getPaginationLabel,
  getStatusClasses,
} from "./adminShared";

const LIMIT = 10;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await axios.get(`${API_URL}/admin/orders`, {
          withCredentials: true,
          params: {
            page,
            limit: LIMIT,
            ...(orderStatus ? { orderStatus } : {}),
            ...(paymentStatus ? { paymentStatus } : {}),
            ...(startDate ? { startDate } : {}),
            ...(endDate ? { endDate } : {}),
          },
        });

        let nextOrders = data?.orders || [];
        if (search.trim()) {
          const term = search.trim().toLowerCase();
          nextOrders = nextOrders.filter((order) => {
            const haystack = [
              order._id,
              order.user?.userName,
              order.user?.email,
              order.orderStatus,
              order.paymentStatus,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return haystack.includes(term);
          });
        }

        if (isMounted) {
          setOrders(nextOrders);
          setPagination(data?.pagination || { page, pages: 1, total: nextOrders.length, limit: LIMIT });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Unable to load orders.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [endDate, orderStatus, page, paymentStatus, search, startDate]);

  const summary = useMemo(() => {
    const delivered = orders.filter((order) => order.orderStatus === "delivered").length;
    const paid = orders.filter((order) => order.paymentStatus === "paid").length;
    const revenue = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

    return {
      total: orders.length,
      delivered,
      paid,
      revenue,
    };
  }, [orders]);

  const handleStatusChange = async (orderId, changes, message) => {
    try {
      setFeedback("");
      await axios.patch(`${API_URL}/admin/orders/${orderId}/status`, changes, {
        withCredentials: true,
      });
      setOrders((current) =>
        current.map((order) => (order._id === orderId ? { ...order, ...changes } : order))
      );
      setFeedback(message);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update order.");
    }
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />
        <div className="px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Admin Orders</p>
          <h1 className="text-xl font-bold text-gray-900">Manage platform orders</h1>
          {(error || feedback) && (
            <div className="mt-3 space-y-2">
              {error && <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">{error}</div>}
              {feedback && <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">{feedback}</div>}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Visible</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{summary.total}</p>
          <p className="mt-1 text-sm text-gray-500">Filtered orders</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Delivered</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{summary.delivered}</p>
          <p className="mt-1 text-sm text-gray-500">Completed shipments</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Paid</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{summary.paid}</p>
          <p className="mt-1 text-sm text-gray-500">Captured payments</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Value</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(summary.revenue)}</p>
          <p className="mt-1 text-sm text-gray-500">Current page volume</p>
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative flex-[2]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order, customer, or payment..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </div>

          <select
            value={orderStatus}
            onChange={(event) => {
              setPage(1);
              setOrderStatus(event.target.value);
            }}
            className="min-w-[150px] rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white"
          >
            <option value="">All Order Status</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentStatus}
            onChange={(event) => {
              setPage(1);
              setPaymentStatus(event.target.value);
            }}
            className="min-w-[150px] rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white"
          >
            <option value="">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(event) => {
              setPage(1);
              setStartDate(event.target.value);
            }}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white"
          />

          <input
            type="date"
            value={endDate}
            onChange={(event) => {
              setPage(1);
              setEndDate(event.target.value);
            }}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white"
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Order Feed</h2>
          <span className="text-xs text-gray-500">Recent admin slice</span>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-50" />
            ))}
          </div>
        ) : orders.length ? (
          <div className="divide-y divide-gray-50">
            {orders.map((order) => (
              <article key={order._id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-900">{order._id}</h3>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border ${getStatusClasses(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border ${getStatusClasses(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <p><span className="font-semibold text-gray-700">{order.user?.userName || "Customer"}</span></p>
                      <p>{order.user?.email || "No email"}</p>
                      <p>{formatDate(order.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 xl:min-w-[320px]">
                    <div className="flex gap-2">
                      <select
                        value={order.orderStatus || ""}
                        onChange={(event) =>
                          handleStatusChange(
                            order._id,
                            { orderStatus: event.target.value },
                            "Order status updated successfully."
                          )
                        }
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-none focus:border-blue-400"
                      >
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <select
                        value={order.paymentStatus || ""}
                        onChange={(event) =>
                          handleStatusChange(
                            order._id,
                            { paymentStatus: event.target.value },
                            "Payment status updated successfully."
                          )
                        }
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-none focus:border-blue-400"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-gray-50 bg-gray-50/50 px-3 py-2">
                      <span className="text-xs text-gray-500">Order total</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(order.totalPrice)}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <Receipt className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-900">No orders found</p>
          </div>
        )}

        {!loading && (
          <div className="flex items-center justify-between border-t border-gray-50 px-5 py-3">
            <p className="text-xs text-gray-500">
              {getPaginationLabel(pagination.page || page, pagination.limit || LIMIT, pagination.total || orders.length)}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={(pagination.page || page) <= 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-gray-700">
                {pagination.page || page} / {pagination.pages || 1}
              </span>
              <button
                disabled={(pagination.page || page) >= (pagination.pages || 1)}
                onClick={() => setPage((current) => Math.min(current + 1, pagination.pages || 1))}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Orders;
