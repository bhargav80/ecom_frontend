import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/cartContext";

const Navbar = () => {
  const { isAuthenticated, logout, isAdmin, isVendor } = useAuth();
  const { cart } = useCart();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();

    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 flex flex-col items-center justify-between bg-white px-6 py-4 shadow-md transition-all md:flex-row">
      <div className="w-full text-center text-2xl font-extrabold tracking-tight text-blue-600 md:w-auto md:text-left">
        <Link to="/">ShopNow</Link>
      </div>

      <form
        onSubmit={handleSearch}
        className="mt-4 flex w-full items-center rounded-full bg-gray-100 px-4 py-2 shadow-inner transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 md:mt-0 md:w-2/5"
      >
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />
        <button
          type="submit"
          aria-label="Search products"
          className="text-sm font-semibold text-gray-500 transition-colors hover:text-blue-600 focus:outline-none"
        >
          Search
        </button>
      </form>

       <div className="flex items-center gap-4 text-sm font-medium text-gray-700 mt-3 md:mt-0">
        <Link to="/">Home</Link>
        <Link to="/categories">Categories</Link>
        <Link to="#">Deals</Link>

        <Link to="/cart" className="text-lg relative">
          🛒
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>

        {!isAuthenticated ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Signup</Link>
          </>
        ) : (
          <div className="relative group">
            <button className="text-lg">👤</button>

            {/* Dropdown */}
            <div
              className="absolute right-0 top-full w-44 bg-white shadow-md rounded-md 
  opacity-0 invisible group-hover:opacity-100 group-hover:visible transition"
            >
              <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">
                Profile
              </Link>
              <Link to="/orders" className="block px-4 py-2 hover:bg-gray-100">
                My Orders
              </Link>

              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  Admin Dashboard
                </Link>
              )}

              {isVendor && (
                <Link
                  to="/vendor/dashboard"
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  Vendor Dashboard
                </Link>
              )}

              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
