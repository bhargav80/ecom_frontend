import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // adjust path
import { useCart } from "../context/cartContext";
const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isVendor } = useAuth();
  const { cart } = useCart();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  return (
    <nav className="flex flex-col md:flex-row items-center justify-between px-4 py-4 bg-white shadow-sm">
      {/* Logo */}
      <div className="text-xl font-bold text-blue-600 w-full md:w-auto text-center md:text-left">
        ShopNow
      </div>

      {/* Search */}
      <div className="flex items-center bg-gray-100 px-4 py-2 rounded-full w-full md:w-1/3 mt-3 md:mt-0">
        <input
          type="text"
          placeholder="Search"
          className="bg-transparent outline-none w-full"
        />
      </div>

      {/* Nav Links */}
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
