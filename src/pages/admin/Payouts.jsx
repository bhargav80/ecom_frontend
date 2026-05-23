import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, CircleDollarSign, Wallet } from "lucide-react";
import {
  API_URL,
  formatCurrency,
  formatDate,
  getPaginationLabel,
  getStatusClasses,
} from "./adminShared";

const LIMIT = 10;

const Payouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [status]);

  useEffect(() => {
    let isMounted = true;

    const fetchPayouts = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await axios.get(`${API_URL}/admin/payouts`, {
          withCredentials: true,
          params: {
            page,
            limit: LIMIT,
            ...(status ? { status } : {}),
          },
        });

        if (isMounted) {
          setPayouts(data?.payouts || []);
          setPagination(data?.pagination || { page, pages: 1, total: 0, limit: LIMIT });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Unable to load payouts.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPayouts();

    return () => {
      isMounted = false;
    };
  }, [page, status]);

  const summary = useMemo(() => {
    const total = payouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
    const pending = payouts
      .filter((payout) => payout.status === "pending")
      .reduce((sum, payout) => sum + Number(payout.amount || 0), 0);

    return {
      count: pagination.total,
      total,
      pending,
    };
  }, [pagination.total, payouts]);

  const handleSettle = async (payoutId) => {
    try {
      setFeedback("");
      await axios.patch(`${API_URL}/admin/payouts/${payoutId}/settle`, {}, { withCredentials: true });
      setPayouts((current) =>
        current.map((payout) => (payout._id === payoutId ? { ...payout, status: "settled" } : payout))
      );
      setFeedback("Payout settled successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to settle payout.");
    }
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-sky-400 to-blue-500" />
        <div className="px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Admin Payouts</p>
          <h1 className="text-xl font-bold text-gray-900">Track vendor settlements</h1>
          {(error || feedback) && (
            <div className="mt-3 space-y-2">
              {error && <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">{error}</div>}
              {feedback && <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">{feedback}</div>}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Payouts</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{summary.count}</p>
          <p className="mt-1 text-sm text-gray-500">Visible records</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Pending Value</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(summary.pending)}</p>
          <p className="mt-1 text-sm text-gray-500">Awaiting settlement</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Visible Volume</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(summary.total)}</p>
          <p className="mt-1 text-sm text-gray-500">Current page amount</p>
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="min-w-[180px] rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none transition focus:border-blue-400"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="settled">Settled</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Payout Feed</h2>
          <span className="text-xs text-gray-500">Vendor transactions</span>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-50" />
            ))}
          </div>
        ) : payouts.length ? (
          <div className="divide-y divide-gray-50">
            {payouts.map((payout) => (
              <article key={payout._id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-900">
                        {payout.vendor?.businessName || payout.vendor?.userName || "Vendor"}
                      </h3>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border ${getStatusClasses(payout.status)}`}>
                        {payout.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <p>{payout.vendor?.email || "No email"}</p>
                      <p>{formatDate(payout.createdAt)}</p>
                      <p>Order: {payout.order?._id || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-right">
                      <p className="text-[10px] font-bold uppercase text-gray-400">Amount</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(payout.amount)}</p>
                    </div>

                    {payout.status !== "settled" && (
                      <button
                        type="button"
                        onClick={() => handleSettle(payout._id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <CircleDollarSign className="h-4 w-4" />
                        Settle
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <Wallet className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-900">No payouts found</p>
          </div>
        )}

        {!loading && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/40 px-4 py-3">
            <p className="text-xs text-gray-500">
              {getPaginationLabel(pagination.page || page, pagination.limit || LIMIT, pagination.total || 0)}
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={(pagination.page || page) <= 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="p-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-gray-700">
                {pagination.page || page} / {pagination.pages || 1}
              </span>
              <button
                disabled={(pagination.page || page) >= (pagination.pages || 1)}
                onClick={() => setPage((current) => Math.min(current + 1, pagination.pages || 1))}
                className="p-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-30"
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

export default Payouts;
