import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const CategoryPage = () => {
  const { name } = useParams();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [sort, setSort] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  // Pagination States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8; // Fits 2-column mobile or 4-column desktop layout grids perfectly

  const navigate = useNavigate();

  // Reset page when category changes
  useEffect(() => {
    setPage(1);
  }, [name]);

  useEffect(() => {
    setLoading(true);
    const fetchProducts = async () => {
      try {
        // Appended page and limit query variables to the endpoint string
        const res = await fetch(
          `${API_URL}/products?category=${name}&page=${page}&limit=${limit}`,
        );
        const json = await res.json();
        
        const actualProducts = json.data || json.products || [];
        setProducts(actualProducts);
        setFiltered(actualProducts);
        
        // Dynamic server total page metrics matching your API responses
        setTotalPages(json.totalPages || 1);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setLoading(false);
      }
    };

    if (name) fetchProducts();
  }, [name, page]); // Re-runs fetch whenever user switches pages

  // Sorting side-effect
  useEffect(() => {
    let temp = [...products];
    if (sort === "low") {
      temp.sort((a, b) => a.price - b.price);
    } else if (sort === "high") {
      temp.sort((a, b) => b.price - a.price);
    }
    setFiltered(temp);
  }, [sort, products]);

  // Premium Skeleton State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb skeleton */}
          <div className="h-4 w-32 bg-slate-200 rounded mb-3 animate-pulse" />
          {/* Title skeleton */}
          <div className="h-8 w-56 bg-slate-200 rounded-lg mb-8 animate-pulse" />

          {/* Filter bar skeleton */}
          <div className="h-14 bg-slate-200 rounded-2xl mb-8 animate-pulse" />

          {/* Products skeleton grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="w-full aspect-square bg-slate-200 rounded-xl animate-pulse" />
                <div className="mt-4 h-4 bg-slate-200 rounded w-5/6 animate-pulse" />
                <div className="mt-2 h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                  <div className="h-5 w-16 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-10 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 antialiased">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Simple Navigation / Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
          <span className="cursor-pointer hover:text-slate-600 transition" onClick={() => navigate('/')}>Home</span>
          <span>/</span>
          <span className="text-slate-600 capitalize">{name}</span>
        </nav>

        {/* Header Title */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-6 capitalize">
          {name} Collection
        </h1>

        {/* Clean, Modern Filter/Sort Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-3.5 mb-8 shadow-sm backdrop-blur-md bg-white/90">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-500">
              Showing page <span className="text-slate-900 font-semibold">{page}</span> of <span className="text-slate-900 font-semibold">{totalPages}</span>
            </p>

            {/* Custom Styled Select Dropdown Container */}
            <div className="flex items-center gap-2.5">
              <label className="text-xs font-semibold tracking-wider uppercase text-slate-400 hidden sm:block">
                Sort By
              </label>
              <div className="relative w-full sm:w-auto">
                <select
                  className="w-full sm:w-48 appearance-none bg-slate-50 border border-slate-200 pl-4 pr-10 py-2 rounded-xl text-sm font-medium text-slate-700 
                  hover:bg-slate-100/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                  transition-all duration-200 cursor-pointer"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="">Featured</option>
                  <option value="low">Price: Low to High</option>
                  <option value="high">Price: High to Low</option>
                </select>
                {/* Custom Chevron SVG for UI Polish */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid Layout */}
        {filtered.length > 0 ? (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filtered.map((product) => (
                <div
                  key={product._id}
                  onClick={() => navigate(`/product/${product._id}`)}
                  className="group relative bg-white rounded-2xl p-3 border border-slate-100 shadow-sm 
                  hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer 
                  active:scale-[0.98] flex flex-col justify-between"
                >
                  <div>
                    {/* Fixed Aspect Ratio Container prevents sudden layout shifts */}
                    <div className="w-full aspect-square overflow-hidden rounded-xl bg-slate-100 relative">
                      <img
                        src={product.images?.[0]?.url || "https://via.placeholder.com/300x300?text=No+Image"}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    </div>

                    {/* Product Metadata */}
                    <h3 className="mt-3.5 text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors duration-200 line-clamp-2 min-h-[2.5rem] leading-snug">
                      {product.name}
                    </h3>
                  </div>

                  {/* Pricing & Footer Actions */}
                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-base font-bold text-slate-900">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </span>
                    
                    {/* Subtle Contextual Hint on Desktop Hover */}
                    <span className="text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 hidden sm:inline-flex items-center gap-0.5">
                      View
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Premium Metric Pagination Deck */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-10">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 transition shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {/* Desktop Number Blocks */}
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

              {/* Mobile View Indicator Label */}
              <div className="sm:hidden text-xs text-slate-500 font-semibold">
                Page {page} of {totalPages}
              </div>

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 transition shadow-sm"
              >
                Next
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          /* Polished Empty State */
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 max-w-md mx-auto mt-8 px-4">
            <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No products found</h3>
            <p className="text-xs text-slate-500 mb-5">We couldn't find anything matching this category at the moment.</p>
            <button 
              onClick={() => navigate('/')} 
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
            >
              Go Back Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;