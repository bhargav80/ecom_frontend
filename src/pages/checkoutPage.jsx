import { useState } from "react";
import axios from "axios";
import { MapPin, CreditCard, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { initiateCashfreePayment } from "../utils/cashfree";

const API_URL = import.meta.env.VITE_API_URL ||"http://localhost:3000/api";

const CheckoutPage = () => {
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const { data } = await axios.post(
        `${API_URL}/orders/checkout`,
        {
          shippingAddress: address,
          paymentMethod,
        },
        { withCredentials: true }
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
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Secure Checkout</h1>
          <p className="text-sm text-slate-500 mt-1">Complete your order by providing your details</p>
        </header>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 sm:p-8">
          <div className="space-y-6">
            
            {/* Shipping Address Section */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <MapPin size={14} className="text-indigo-500" />
                Shipping Address
              </label>
              <textarea
                placeholder="Flat/House No., Colony, Street, Landmark, City, State, PIN..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full min-h-[100px] bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
              />
            </div>

            {/* Payment Method Section */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <CreditCard size={14} className="text-indigo-500" />
                Payment Method
              </label>
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none cursor-pointer"
                >
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="UPI">Online Payment (UPI/Card/NetBanking)</option>
                </select>
                {/* Custom Chevron for the select */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-start gap-3 bg-indigo-50/50 p-4 rounded-xl ring-1 ring-indigo-100">
              <CheckCircle2 className="text-indigo-600 mt-0.5" size={16} />
              <div>
                <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-tight">Buyer Protection</p>
                <p className="text-xs text-indigo-700/80 mt-0.5 leading-relaxed">
                  Your purchase is covered by our secure payment guarantee. No hidden charges.
                </p>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={loading || !address.trim()}
              className="group relative w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:bg-slate-200 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200 active:scale-[0.98] overflow-hidden"
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Verifying details...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                    <span>Place Order</span>
                  </>
                )}
              </div>
            </button>
            
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
              All transactions are encrypted and 100% secure
            </p>
          </div>
        </div>

        {/* Support Link */}
        <p className="text-center mt-8 text-xs text-slate-500 font-medium">
          Need help? <button className="text-indigo-600 font-bold hover:underline">Contact Support</button>
        </p>
      </div>
    </div>
  );
};

export default CheckoutPage;