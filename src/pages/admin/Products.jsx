import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Search, ShieldAlert, Trash2 } from "lucide-react";
import {
  API_URL,
  formatCurrency,
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

const Products = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, category, approvalStatus]);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await axios.get(`${API_URL}/admin/products`, {
          withCredentials: true,
          params: {
            page,
            limit: LIMIT,
            ...(search.trim() ? { search: search.trim() } : {}),
            ...(category ? { category } : {}),
            ...(approvalStatus ? { approvalStatus } : {}),
          },
        });

        if (isMounted) {
          setProducts(data?.products || []);
          setPagination(data?.pagination || { page, pages: 1, total: 0, limit: LIMIT });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Unable to load products.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchProducts, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, category, approvalStatus, page]);

  const categories = useMemo(() => {
    const values = Array.from(new Set(products.map((product) => product.category).filter(Boolean)));
    return values.sort((a, b) => a.localeCompare(b));
  }, [products]);

  const summary = useMemo(() => {
    const lowStock = products.filter((product) => Number(product.stock || 0) <= 5).length;
    const approved = products.filter((product) => product.approvalStatus === "approved").length;

    return {
      total: pagination.total,
      lowStock,
      approved,
      categories: categories.length,
    };
  }, [categories.length, pagination.total, products]);

  const handleDelete = async (productId) => {
    try {
      setFeedback("");
      await axios.delete(`${API_URL}/admin/products/${productId}`, {
        withCredentials: true,
      });
      setProducts((current) => current.filter((product) => product._id !== productId));
      setPagination((current) => ({
        ...current,
        total: Math.max((current.total || 1) - 1, 0),
      }));
      setFeedback("Product deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete product.");
    }
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400" />
        <div className="px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Admin Products</p>
          <h1 className="text-xl font-bold text-gray-900">Oversee product catalog</h1>
          {(error || feedback) && (
            <div className="mt-3 space-y-2">
              {error && <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">{error}</div>}
              {feedback && <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">{feedback}</div>}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard title="Total" value={summary.total} helper="Marketplace products" />
        <SummaryCard title="Approved" value={summary.approved} helper="Review cleared" />
        <SummaryCard title="Low Stock" value={summary.lowStock} helper="Need attention" />
        <SummaryCard title="Categories" value={summary.categories} helper="Active catalog groups" />
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-[2]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product name..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </div>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="min-w-[160px] rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none transition focus:border-blue-400"
          >
            <option value="">All Categories</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={approvalStatus}
            onChange={(event) => setApprovalStatus(event.target.value)}
            className="min-w-[160px] rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none transition focus:border-blue-400"
          >
            <option value="">All Approval</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-900">Products List</h2>
          <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">
            {pagination.total} Items
          </span>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-24 rounded-lg bg-gray-50 animate-pulse" />
            ))}
          </div>
        ) : products.length ? (
          <div className="divide-y divide-gray-50">
            {products.map((product) => {
              const image = Array.isArray(product.images) ? product.images[0] : "";
              const imageUrl = typeof image === "string" ? image : image?.url;
              const stockState = Number(product.stock || 0) <= 5 ? "pending" : "approved";

              return (
                <article key={product._id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <img
                      src={imageUrl || "https://via.placeholder.com/120x120?text=Product"}
                      alt={product.name}
                      className="h-14 w-14 rounded-lg border border-gray-100 bg-gray-50 object-cover"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{product.name}</h3>
                      <p className="text-xs text-gray-500">{product.category || "Uncategorized"}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {product.vendor?.businessName || product.vendor?.userName || "Unknown vendor"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase border ${getStatusClasses(product.approvalStatus || "pending")}`}>
                        {product.approvalStatus || "pending"}
                      </span>
                      <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase border ${getStatusClasses(stockState)}`}>
                        stock {product.stock || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-center">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400">Price</p>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(product.price)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400">Added</p>
                        <p className="text-sm font-bold text-gray-900">{formatDate(product.createdAt)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(product._id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-gray-300" />
            <h3 className="mt-2 text-sm font-bold text-gray-900">No products found</h3>
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

export default Products;
