import React, { useEffect, useState } from "react";
import axios from "axios";
import { Truck, XCircle, Package, ChevronLeft, ChevronRight, Calendar, Hash } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ||"http://localhost:3000/api";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true); // Added for UI stability
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  const fetchOrders = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${API_URL}/orders/my-orders?page=${pageNumber}&limit=${limit}`,
        { withCredentials: true }
      );

      setOrders(data.orders || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  const handleCancel = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await axios.put(
        `${API_URL}/orders/${orderId}/cancel`,
        {},
        { withCredentials: true }
      );
      fetchOrders(page);
    } catch (err) {
      console.error("Cancel error:", err);
    }
  };

  const handleTrack = (orderId) => {
    alert(`Tracking order reference: ${orderId}`);
  };

  // Helper for Status Badge Styling
  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dot-bg-emerald-600";
      case "cancelled":
        return "bg-rose-50 text-rose-700 ring-rose-600/10 dot-bg-rose-600";
      default:
        return "bg-amber-50 text-amber-700 ring-amber-600/10 dot-bg-amber-600";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Block */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Order History
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Check the status of recent orders, manage returns, and discover items.
            </p>
          </div>
          <div className="hidden sm:flex h-12 w-12 bg-white rounded-2xl items-center justify-center border border-slate-200/60 shadow-sm text-slate-400">
            <Package size={22} />
          </div>
        </div>

        {/* 1. Loading Skeleton State */}
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="bg-slate-50/60 px-6 py-4 flex justify-between items-center border-b border-slate-100">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-slate-200 rounded-xl animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-1/4 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          /* 2. Empty State */
          <div className="text-center bg-white border border-slate-200/60 p-16 rounded-3xl shadow-sm max-w-md mx-auto mt-12">
            <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 text-slate-400 border border-slate-100">
              <Package size={26} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">No orders placed yet</h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
              Looks like you haven't made your choice yet. When you buy something, it will show up here.
            </p>
            <button className="mt-6 inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition">
              Start Exploring
            </button>
          </div>
        ) : (
          /* 3. Main Data Content Loop */
          <div className="space-y-6">
            {orders.map((order) => {
              const statusStyle = getStatusStyles(order.orderStatus);
              return (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
                >
                  {/* Order Context Top Bar */}
                  <div className="bg-slate-50/60 border-b border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <div>
                        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">Order Reference</span>
                        <span className="text-xs font-mono font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                          <Hash size={12} className="text-slate-400" />
                          {order._id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">Date Placed</span>
                        <span className="text-xs font-medium text-slate-600 flex items-center gap-1 mt-0.5">
                          <Calendar size={12} className="text-slate-400" />
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 sm:text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-none border border-current/10 ${statusStyle.split(' dot-bg')[0]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.includes('emerald') ? 'bg-emerald-600' : statusStyle.includes('rose') ? 'bg-rose-600' : 'bg-amber-600'}`} />
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>

                  {/* Items Sublist */}
                  <div className="divide-y divide-slate-100 px-6">
                    {order.orderItems?.map((item) => (
                      <div key={item._id} className="py-5 flex gap-4 sm:gap-6 items-start">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
                          <img
                            src={item.product?.images?.[0]?.url || "https://via.placeholder.com/150?text=Product"}
                            alt={item.productName}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0 pt-1">
                          <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition">
                            {item.productName}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 font-medium">
                            Quantity: <span className="text-slate-700 font-semibold">{item.quantity}</span> 
                            <span className="mx-2">•</span> 
                            Unit Price: <span className="text-slate-700 font-semibold">₹{item.price.toLocaleString('en-IN')}</span>
                          </p>
                        </div>

                        <div className="text-right pt-1 flex-shrink-0">
                          <p className="text-sm font-bold text-slate-900">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Bar / Financials Summary */}
                  <div className="bg-slate-50/30 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">Paid via {order.paymentStatus || 'Card'}</span>
                      <span className="text-slate-300 text-xs">•</span>
                      <span className="text-sm text-slate-500 font-medium">Total: <span className="text-base font-bold text-slate-900">₹{order.totalPrice.toLocaleString('en-IN')}</span></span>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.orderStatus !== "Delivered" && order.orderStatus !== "Cancelled" && (
                        <button
                          onClick={() => handleCancel(order._id)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition duration-150"
                        >
                          <XCircle size={14} />
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => handleTrack(order._id)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 shadow-sm transition duration-150"
                      >
                        <Truck size={14} />
                        Track Order
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Premium Metric Pagination Deck */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-8">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 transition shadow-sm"
              >
                <ChevronLeft size={14} />
                Previous
              </button>

              <div className="hidden sm:flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`h-8 w-8 flex items-center justify-center rounded-xl text-xs font-bold transition ${
                        page === pageNum
                          ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <div className="sm:hidden text-xs text-slate-500 font-semibold">
                Page {page} of {totalPages}
              </div>

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 transition shadow-sm"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;