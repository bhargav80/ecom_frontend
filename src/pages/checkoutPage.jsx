import { useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapPin,
  CreditCard,
  Lock,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { initiateCashfreePayment } from "../utils/cashfree";
import { useCart } from "../context/cartContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, totalPrice } = useCart();
  const [shippingAddress, setShippingAddress] = useState({
    address: "",
    city: "",
    postalCode: "",
    state: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);
  const buyNowProduct = location.state?.buyNowProduct || null;
  const cartItemsCount = useMemo(
    () => cart.reduce((count, item) => count + item.quantity, 0),
    [cart],
  );

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const { data } = await axios.post(
        `${API_URL}/orders/checkout`,
        {
          shippingAddress,
          paymentMethod,
        },
        { withCredentials: true },
      );

      if (paymentMethod === "COD") {
        alert("Order placed successfully!");
        window.location.href = "/orders";
        return;
      }

      await initiateCashfreePayment(data.paymentSessionId);
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-900 px-6 py-8 text-white sm:px-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-300">
                    {buyNowProduct ? "Buy Now Checkout" : "Secure Checkout"}
                  </p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight">
                    Finish your order in one step
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-300">
                    Review your delivery details and choose how you want to pay.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-300">
                    Order Total
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">
                    ₹{totalPrice.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              {buyNowProduct && (
                <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="h-24 w-24 overflow-hidden rounded-2xl border border-white bg-white shadow-sm">
                      <img
                        src={
                          buyNowProduct.image ||
                          "https://via.placeholder.com/160x160?text=Item"
                        }
                        alt={buyNowProduct.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                          Selected Item
                        </span>
                        {buyNowProduct.rating ? (
                          <span className="text-sm font-semibold text-amber-500">
                            ★ {Number(buyNowProduct.rating).toFixed(1)}
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-3 text-lg font-bold text-slate-900 sm:text-xl">
                        {buyNowProduct.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Added to your checkout flow for faster purchase.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm ring-1 ring-slate-200">
                      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">
                        Price
                      </p>
                      <p className="mt-1 text-xl font-black text-slate-950">
                        ₹
                        {Number(buyNowProduct.price || 0).toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <PackageCheck className="text-indigo-600" size={18} />
                  <p className="mt-3 text-sm font-bold text-slate-900">
                    Fast confirmation
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Orders are confirmed right after payment or COD selection.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <ShieldCheck className="text-indigo-600" size={18} />
                  <p className="mt-3 text-sm font-bold text-slate-900">
                    Protected payment
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Checkout stays encrypted throughout the payment session.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <CheckCircle2 className="text-indigo-600" size={18} />
                  <p className="mt-3 text-sm font-bold text-slate-900">
                    Clear pricing
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Totals shown here include the products currently in your
                    cart.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <MapPin size={14} className="text-indigo-500" />
                  Shipping Address
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="House No, Street, Landmark"
                    value={shippingAddress.address}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        address: e.target.value,
                      })
                    }
                    className="sm:col-span-2 rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />

                  <input
                    type="text"
                    placeholder="City"
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        city: e.target.value,
                      })
                    }
                    className="rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />

                  <input
                    type="text"
                    placeholder="State"
                    value={shippingAddress.state}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        state: e.target.value,
                      })
                    }
                    className="rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />

                  <input
                    type="text"
                    placeholder="Postal Code"
                    value={shippingAddress.postalCode}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        postalCode: e.target.value,
                      })
                    }
                    className="sm:col-span-2 rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <CreditCard size={14} className="text-indigo-500" />
                  Payment Method
                </label>
                <div className="relative">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-2xl border-0 bg-slate-50 p-4 text-sm font-semibold text-slate-900 outline-none ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="UPI">
                      Online Payment (UPI/Card/NetBanking)
                    </option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-indigo-50/60 p-4 ring-1 ring-indigo-100">
                <CheckCircle2 className="mt-0.5 text-indigo-600" size={16} />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-900">
                    Buyer Protection
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-indigo-800/80">
                    Your purchase is covered by our secure payment guarantee
                    with no hidden charges.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={
                  loading ||
                  !shippingAddress.address.trim() ||
                  !shippingAddress.city.trim() ||
                  !shippingAddress.state.trim() ||
                  !shippingAddress.postalCode.trim()
                }
                className="group relative w-full overflow-hidden rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 active:scale-[0.98]"
              >
                <div className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Verifying details...</span>
                    </>
                  ) : (
                    <>
                      <Lock
                        size={16}
                        className="text-slate-400 transition-colors group-hover:text-white"
                      />
                      <span>Place Order</span>
                    </>
                  )}
                </div>
              </button>

              <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                All transactions are encrypted and 100% secure
              </p>
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                    Order Summary
                  </p>
                  <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900">
                    {cartItemsCount} item{cartItemsCount === 1 ? "" : "s"}
                  </h2>
                </div>
                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Total
                  </p>
                  <p className="text-lg font-black text-slate-950">
                    ₹{totalPrice.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {cart.slice(0, 3).map((item) => (
                  <div
                    key={item.product}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3"
                  >
                    <div className="h-14 w-14 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
                      <img
                        src={
                          item.image?.[0]?.url ||
                          "https://via.placeholder.com/120x120?text=Item"
                        }
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      ₹
                      {Number(item.price * item.quantity).toLocaleString(
                        "en-IN",
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {cartItemsCount > 3 ? (
                <p className="mt-3 text-xs font-medium text-slate-500">
                  Plus {cartItemsCount - 3} more item
                  {cartItemsCount - 3 === 1 ? "" : "s"} in your cart.
                </p>
              ) : null}

              <div className="my-5 border-t border-dashed border-slate-200" />

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    ₹{totalPrice.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Shipping</span>
                  <span className="font-bold uppercase tracking-widest text-emerald-600">
                    Free
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Payment</span>
                  <span className="font-semibold text-slate-900">
                    {paymentMethod === "COD"
                      ? "Cash on Delivery"
                      : "Online Payment"}
                  </span>
                </div>
              </div>
            </div>

            <p className="px-1 text-center text-xs font-medium text-slate-500">
              Need help?{" "}
              <button className="font-bold text-indigo-600 hover:underline">
                Contact Support
              </button>
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
