import { useEffect, useState } from "react";
import axios from "axios";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
const API_URL =import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const CartPage = () => {
  const [cart, setCart] = useState({ items: [], totalPrice: 0 });
  const [loading, setLoading] = useState(true);
const navigate = useNavigate();
  const fetchCart = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/cart`, {
        withCredentials: true,
      });
      setCart(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) return;

    try {
      await axios.patch(
        `${API_URL}/cart/${productId}`,
        { quantity },
        { withCredentials: true }
      );
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const removeItem = async (productId) => {
    try {
      await axios.delete(`${API_URL}/cart/${productId}`, {
        withCredentials: true,
      });
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;

  if (cart.items.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <h2 className="text-xl font-semibold">Your cart is empty 🛒</h2>
        <p className="mt-2 text-sm">Add something and come back</p>
      </div>
    );
return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="text-indigo-600" size={24} />
            Shopping Cart
          </h1>
          <p className="text-sm text-slate-500 mt-1">You have {cart.items.length} items</p>
        </header>

        {cart.items.length === 0 ? (
          <div className="text-center bg-white border border-slate-200 p-10 rounded-2xl shadow-sm">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="text-slate-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Your cart is empty</h3>
            <button 
              onClick={() => navigate("/")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
              Continue Shopping
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.product}
                  className="group relative flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:shadow-md hover:ring-indigo-100"
                >
                  {/* Product Image (Reduced Size) */}
                  <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200/50 flex-shrink-0">
                    <img
                      src={item.image?.[0]?.url || "https://via.placeholder.com/150"}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-start">
                      <div className="max-w-[70%]">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          Stock: {item.stock}
                        </p>
                      </div>
                      <p className="text-lg font-black text-slate-900">
                        ₹{item.price.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-2">
                      {/* Compact Quantity Selector */}
                      <div className="flex items-center bg-slate-50 p-0.5 rounded-lg ring-1 ring-slate-200">
                        <button
                          onClick={() => updateQuantity(item.product, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all disabled:opacity-30"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="w-8 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateQuantity(item.product, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all disabled:opacity-30"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.product)}
                        className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 px-2 py-1.5 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Sidebar (Condensed) */}
            <aside className="lg:sticky lg:top-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Summary</h2>

                <div className="space-y-3 text-xs font-semibold">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="text-slate-900">₹{cart.totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Shipping</span>
                    <span className="text-emerald-600 uppercase tracking-widest text-[10px]">Free</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 my-4"></div>

                <div className="flex justify-between items-end mb-6">
                  <span className="text-sm font-bold text-slate-900">Total</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900">
                      ₹{cart.totalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/checkout")}
                  className="group relative w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg shadow-indigo-100 active:scale-[0.98]"
                >
                  Checkout
                  <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 group-hover:translate-x-0.5 transition-transform" size={16} />
                </button>
                
                <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-tight">
                  Secure Checkout
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
  
};

export default CartPage;