import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/cartContext";

const API_URL =import.meta.env.VITE_API_URL || "http://localhost:3000/api";
console.log(API_URL)
const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON but received ${contentType}`);
  }

  return response.json();
};

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
 
  const [product, setProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [totalReviewPages, setTotalReviewPages] = useState(1);
  const [totalReviewsCount, setTotalReviewsCount] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const reviewLimit = 4;


  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [formError, setFormError] = useState("");

  const images = product?.images?.map((img) =>
    typeof img === "string" ? img : img.url,
  ) || ["https://via.placeholder.com/600x600?text=No+Image"];

  
  useEffect(() => {
    let isMounted = true;
    const fetchProductAndUser = async () => {
      try {
        setLoading(true);
        setError("");

        const [productData, userResult] = await Promise.all([
          fetchJson(`${API_URL}/products/${id}`),
          fetchJson(`${API_URL}/auth/me`, { credentials: "include" }).catch(() => ({ user: null })),
        ]);

        if (!isMounted) return;
        setProduct(productData?.data || null);
        setUser(userResult?.user || null);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Failed to load product.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) fetchProductAndUser();
    return () => { isMounted = false; };
  }, [id]);


  const fetchProductReviews = async () => {
    try {
      setReviewsLoading(true);
      
      const reviewsResult = await fetchJson(
        `${API_URL}/reviews?product=${id}&page=${reviewPage}&limit=${reviewLimit}`,{ credentials: "include" }
      );
      setReviews(reviewsResult?.data || []);
      setTotalReviewPages(reviewsResult?.totalPages || 1);
      setTotalReviewsCount(reviewsResult?.totalReviews || 0);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProductReviews();
  }, [id, reviewPage]);

  // Handle Review Submission
  const handleReviewSubmit = async (e) => {
  e.preventDefault();
  if (!newReviewText.trim()) {
    setFormError("Please enter your review message.");
    return;
  }

  try {
    setSubmittingReview(true);
    setFormError("");


    await fetchJson(`${API_URL}/reviews`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        review: newReviewText,
        rating: newRating,
        product: id,
      }),
    });

  
    setNewReviewText("");
    setNewRating(5);
    setReviewPage(1); 
    await fetchProductReviews(); 
    alert("Review posted successfully!");
  } catch (err) {
    setFormError(err.message || "Could not post your review. Check permission limits.");
  } finally {
    setSubmittingReview(false);
  }
};


const handleDeleteReview = async (reviewId) => {
  if (!window.confirm("Are you sure you want to delete your review?")) {
    return;
  }

  try {
   
    await fetchJson(`${API_URL}/reviews/${reviewId}`, {
      method: "DELETE",
      credentials: "include",
    });

    alert("Review deleted successfully.");

    
    if (reviews.length === 1 && reviewPage > 1) {
      setReviewPage((prev) => prev - 1);
    } else {
      
      await fetchProductReviews();
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert(err.message || "Failed to delete the review. You may not have permission.");
  }
};

  const handleAddToCart = () => {
    requireAuth(async () => {
      const result = await addToCart(product._id, 1);
      if (result.message === "Added to cart" || result.success) {
        alert("Success! Product added to cart.");
      } else {
        alert(result.message || "Error adding to cart");
      }
    });
  };

  const requireAuth = (action) => {
    if (!user) {
      navigate("/login", { state: { from: `/product/${id}` } });
      return;
    }
    action();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 py-10">
        <div className="max-w-5xl mx-auto px-4 animate-pulse space-y-6">
          <div className="h-96 bg-slate-200 rounded-3xl" />
          <div className="h-64 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) return <div className="p-12 text-center text-sm font-semibold text-rose-500">{error}</div>;
  if (!product) return <div className="p-12 text-center text-sm font-medium text-slate-500">Product details empty.</div>;

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 antialiased py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        
        
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
        
            <div className="p-6 bg-slate-50/50 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
              <div className="relative aspect-square w-full flex items-center justify-center bg-white rounded-2xl border border-slate-200/60 p-4 shadow-inner group">
                <button
                  onClick={() => setCurrentImage((p) => (p === 0 ? images.length - 1 : p - 1))}
                  className="absolute left-3 bg-white/90 hover:bg-white text-slate-700 shadow-md h-8 w-8 rounded-xl flex items-center justify-center transition border border-slate-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                </button>

                <img
                  src={images[currentImage]}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain mix-blend-multiply"
                />

                <button
                  onClick={() => setCurrentImage((p) => (p + 1) % images.length)}
                  className="absolute right-3 bg-white/90 hover:bg-white text-slate-700 shadow-md h-8 w-8 rounded-xl flex items-center justify-center transition border border-slate-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto justify-center py-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImage(idx)}
                      className={`w-14 h-14 rounded-xl border-2 transition overflow-hidden bg-white p-0.5 flex-shrink-0 ${
                        currentImage === idx ? "border-slate-900 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} className="w-full h-full object-cover rounded-lg" alt="Thumbnail variant" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                  {product.name}
                </h1>

                <div className="flex items-center gap-2 text-sm">
                  <div className="flex text-amber-400 font-semibold items-center gap-0.5">
                    <span>★</span> {product.ratingsAverage ? Number(product.ratingsAverage).toFixed(1) : "0.0"}
                  </div>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-medium">
                    {totalReviewsCount} Community Reviews
                  </span>
                </div>

                <div className="py-2">
                  <p className="text-3xl font-extrabold text-slate-950 tracking-tight">
                    ₹{product.price.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-emerald-600 font-bold mt-1 tracking-wide uppercase">
                    Inclusive of all local duties & taxes
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Product Summary
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {product.description || "No full summary description attached to this product entry framework context currently."}
                  </p>
                </div>
              </div>

              
              <div className="flex flex-col sm:flex-row gap-3 mt-8 border-t border-slate-100 pt-6">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 px-5 py-3 bg-slate-100 text-slate-800 text-sm rounded-xl font-bold hover:bg-slate-200 transition duration-150"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => requireAuth(() => alert("Proceeding to single checkout instantly!"))}
                  className="flex-1 px-5 py-3 bg-slate-900 text-white text-sm rounded-xl font-bold hover:bg-slate-800 shadow-md shadow-slate-900/10 transition duration-150"
                >
                  Buy Now
                </button>
              </div>
            </div>

          </div>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
         
          <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 tracking-tight mb-4">
              Share Your Thoughts
            </h3>
            
            {user ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
              
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Rating Score
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setNewRating(starValue)}
                        className="text-xl transition-transform active:scale-95 focus:outline-none"
                      >
                        <span className={starValue <= newRating ? "text-amber-400" : "text-slate-200"}>★</span>
                      </button>
                    ))}
                  </div>
                </div>

                
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Review Details
                  </label>
                  <textarea
                    rows={4}
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    placeholder="What did you like or dislike about this product?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition placeholder:text-slate-400"
                  />
                </div>

                {formError && <p className="text-xs font-medium text-rose-500">{formError}</p>}

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-40 shadow-sm transition"
                >
                  {submittingReview ? "Submitting..." : "Post Review"}
                </button>
              </form>
            ) : (
              <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/40 text-center">
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
                  You must be logged in to share a purchase evaluation review.
                </p>
                <button
                  onClick={() => navigate("/login", { state: { from: `/product/${id}` } })}
                  className="inline-flex justify-center items-center px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition"
                >
                  Sign In to Continue
                </button>
              </div>
            )}
          </div>

         
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center justify-between">
              <span>Customer Feedback</span>
              <span className="text-xs font-normal text-slate-400">{totalReviewsCount} total items</span>
            </h2>

            {reviewsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-white h-24 border border-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-white p-10 text-center rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm font-medium">Be the first to review this product entry!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reviews.map((rev) => (
  <div
    key={rev._id}
    className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between"
  >
    <div>
      <div className="flex justify-between items-start gap-2 mb-2">
        <p className="text-sm font-bold text-slate-800 truncate">
          {rev.user?.userName || "Anonymous Customer"}
        </p>
        <div className="flex text-amber-400 text-xs flex-shrink-0">
          {"★".repeat(rev.rating)}
          <span className="text-slate-100">{"★".repeat(5 - rev.rating)}</span>
        </div>
      </div>
      <p className="text-slate-600 text-xs leading-relaxed line-clamp-4">
        {rev.review}
      </p>
    </div>

  
    {user && rev.user && (user._id === rev.user._id || user.id === rev.user._id) && (
      <div className="flex justify-end mt-3 pt-2 border-t border-slate-50">
        <button
          onClick={() => handleDeleteReview(rev._id)}
          className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition duration-150 flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    )}
  </div>
))}
                </div>

                
                {totalReviewPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-6">
                    <button
                      onClick={() => setReviewPage((p) => Math.max(p - 1, 1))}
                      disabled={reviewPage === 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 transition"
                    >
                      Back
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalReviewPages }).map((_, index) => {
                        const pageNum = index + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setReviewPage(pageNum)}
                            className={`h-7 w-7 flex items-center justify-center rounded-lg text-xs font-bold transition ${
                              reviewPage === pageNum
                                ? "bg-slate-900 text-white shadow-sm"
                                : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setReviewPage((p) => Math.min(p + 1, totalReviewPages))}
                      disabled={reviewPage === totalReviewPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProductPage;