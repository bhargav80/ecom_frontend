import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Check, ChevronLeft, ChevronRight, Search, ShieldCheck, Store } from "lucide-react";
import {
  API_URL,
  formatDate,
  getPaginationLabel,
  getStatusClasses,
} from "./adminShared";

const LIMIT = 10;

const SummaryCard = ({ title, value, helper }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    <p className="mt-1 text-sm text-gray-500">{helper}</p>
  </div>
);

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  useEffect(() => {
    let isMounted = true;

    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await axios.get(`${API_URL}/admin/vendors`, {
          withCredentials: true,
          params: {
            page,
            limit: LIMIT,
            ...(search.trim() ? { search: search.trim() } : {}),
            ...(status !== "all" ? { status } : {}),
          },
        });

        if (isMounted) {
          setVendors(data?.vendors || []);
          setPagination(data?.pagination || { page, pages: 1, total: 0, limit: LIMIT });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Unable to load vendors.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchVendors, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [page, search, status]);

  const summary = useMemo(() => {
    const approved = vendors.filter((vendor) => vendor.isApproved).length;
    const pending = vendors.length - approved;
    const blocked = vendors.filter((vendor) => vendor.isBlocked).length;

    return {
      total: pagination.total,
      approved,
      pending,
      blocked,
    };
  }, [pagination.total, vendors]);

  const handleVendorAction = async (vendor, changes, message) => {
    try {
      setFeedback("");
      await axios.patch(`${API_URL}/admin/vendors/${vendor._id}/status`, changes, {
        withCredentials: true,
      });
      setVendors((current) =>
        current.map((item) => (item._id === vendor._id ? { ...item, ...changes } : item))
      );
      setFeedback(message);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update vendor.");
    }
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />
        <div className="px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Admin Vendors</p>
              <h1 className="text-xl font-bold text-gray-900">Review seller accounts</h1>
            </div>
          </div>

          {(error || feedback) && (
            <div className="mt-3 space-y-2">
              {error && <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">{error}</div>}
              {feedback && <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">{feedback}</div>}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard title="Total" value={summary.total} helper="Vendor accounts" />
        <SummaryCard title="Approved" value={summary.approved} helper="Live sellers" />
        <SummaryCard title="Pending" value={summary.pending} helper="Need review" />
        <SummaryCard title="Blocked" value={summary.blocked} helper="Restricted vendors" />
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-[2]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search vendor name, email, or business..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="min-w-[160px] rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none transition focus:border-blue-400"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-900">Vendor List</h2>
          <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">
            {pagination.total} Vendors
          </span>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-24 rounded-lg bg-gray-50 animate-pulse" />
            ))}
          </div>
        ) : vendors.length ? (
          <div className="divide-y divide-gray-50">
            {vendors.map((vendor) => {
              const approvalLabel = vendor.isApproved ? "approved" : "pending";

              return (
                <article key={vendor._id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{vendor.businessName || vendor.userName}</h3>
                      <p className="text-xs text-gray-500">{vendor.userName} • {vendor.email}</p>
                      <p className="mt-1 text-xs text-gray-400">Joined {formatDate(vendor.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase border ${getStatusClasses(approvalLabel)}`}>
                        {approvalLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!vendor.isApproved && (
                        <button
                          type="button"
                          onClick={() =>
                            handleVendorAction(
                              vendor,
                              { isApproved: true },
                              "Vendor approved successfully."
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-gray-300" />
            <h3 className="mt-2 text-sm font-bold text-gray-900">No vendors found</h3>
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

export default Vendors;
