import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();
const API_URL = import.meta.env.VITE_API_URL ||"http://localhost:3000/api";

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  // Helper for API calls
  const fetchCartData = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${API_URL}/cart`, { credentials: "include" });
      const data = await res.json();
      setCart(data.items || []);
      setTotalPrice(data.totalPrice || 0);
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  useEffect(() => {
    fetchCartData();
  }, [isAuthenticated]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) await fetchCartData(); // Sync with backend
      return data;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const res = await fetch(`${API_URL/cart}/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) await fetchCartData(); //
    } catch (err) {
      console.error(err);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const res = await fetch(`${API_URL/cart}/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
        credentials: "include",
      });
      if (res.ok) await fetchCartData(); //
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <CartContext.Provider value={{ cart, totalPrice, addToCart, removeFromCart, updateQuantity, loading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);