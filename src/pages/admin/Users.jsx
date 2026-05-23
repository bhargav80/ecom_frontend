import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Search, UserCog } from "lucide-react"; // Added Chevron icons
import {
  API_URL,
  formatDate,
  getPaginationLabel, // Added for footer label
  getStatusClasses,
} from "./adminShared";

const LIMIT = 10; // Defined constant limit

const Users = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1); // Added page state

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await axios.get(`${API_URL}/admin/users`, {
          withCredentials: true,
          params: {
            page, // Added page param
            limit: LIMIT, // Changed from hardcoded 100 to LIMIT
            ...(search.trim() ? { search: search.trim() } : {}),
          },
        });

        if (isMounted) {
          setUsers(data?.users || []);
          // Sync pagination state from backend response
          setPagination(data?.pagination || { page, pages: 1, total: (data?.users || []).length, limit: LIMIT });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Unable to load users.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, page]); // Added page dependency

  const summary = useMemo(() => {
    const blocked = users.filter((user) => user.isBlocked).length;

    return {
      total: users.length,
      blocked,
      active: users.length - blocked,
    };
  }, [users]);

  const handleToggleBlock = async (userId) => {
    try {
      setFeedback("");
      const { data } = await axios.patch(`${API_URL}/admin/users/${userId}/block`, {}, { withCredentials: true });
      const nextUser = data?.user;

      setUsers((current) =>
        current.map((user) =>
          user._id === userId ? { ...user, isBlocked: nextUser?.isBlocked ?? !user.isBlocked } : user
        )
      );
      setFeedback("User status updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update user.");
    }
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />
        <div className="px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Admin Users</p>
          <h1 className="text-xl font-bold text-gray-900">Manage customer accounts</h1>
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
          <p className="text-sm font-medium text-gray-500">Visible</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{summary.total}</p>
          <p className="mt-1 text-sm text-gray-500">Current page users</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Active</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{summary.active}</p>
          <p className="mt-1 text-sm text-gray-500">Not blocked</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Blocked</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{summary.blocked}</p>
          <p className="mt-1 text-sm text-gray-500">Restricted accounts</p>
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => {
              setPage(1); // Reset to page 1 on search
              setSearch(event.target.value);
            }}
            placeholder="Search user name or email..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Customer List</h2>
          <span className="text-xs text-gray-500">{pagination.total} accounts total</span>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-50" />
            ))}
          </div>
        ) : users.length ? (
          <div className="divide-y divide-gray-50">
            {users.map((user) => (
              <article key={user._id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-900">{user.userName}</h3>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border ${getStatusClasses(user.isBlocked ? "blocked" : "active")}`}>
                        {user.isBlocked ? "blocked" : "active"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <p>{user.email}</p>
                      <p>{formatDate(user.createdAt)}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleBlock(user._id)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      user.isBlocked
                        ? "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    }`}
                  >
                    <UserCog className="h-4 w-4" />
                    {user.isBlocked ? "Unblock User" : "Block User"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <UserCog className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-900">No users found</p>
          </div>
        )}

        {/* Pagination Footer - Matches Orders.jsx style */}
        {!loading && (
          <div className="flex items-center justify-between border-t border-gray-50 px-5 py-3">
            <p className="text-xs text-gray-500">
              {getPaginationLabel(pagination.page || page, pagination.limit || LIMIT, pagination.total)}
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

export default Users;