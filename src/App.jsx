import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import Categories from "./pages/Categories";
import Layout from "./pages/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterVendor from "./pages/RegisterVendor";
import VendorLayout from "./pages/VendorLayout";
import AdminLayout from "./pages/adminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVendors from "./pages/admin/Vendors";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminPayouts from "./pages/admin/Payouts";
import AdminUsers from "./pages/admin/Users";
import AdminAnalytics from "./pages/admin/Analytics";
import Dashboard from "./pages/vendor/Dashboard";
import ProductPage from "./pages/ProductPage";
import Products from "./pages/vendor/Products";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./context/cartContext";
import CartPage from "./pages/cartPage";
import CheckoutPage from "./pages/checkoutPage";
import OrdersPage from "./pages/orderPage";
import PaymentStatus from "./pages/PaymentStatus";
import Orders from "./pages/vendor/Orders";
import Analytics from "./pages/vendor/Analytics";
import { Navigate } from "react-router-dom";
import Profile from "./pages/Profile";
// import Profile from "./pages/vendor/Profile";

//import './App.css'

function App() {
  return (
    <CartProvider>
    <Routes>
      <Route path="login" element={<Login />} />

      <Route path="register" element={<Register />} />
      <Route path="register/vendor" element={<RegisterVendor />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/category/:name" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage/>} />
          <Route path="orders" element={<OrdersPage/>} />
          <Route path="/payment-status" element={<PaymentStatus />} />
          <Route path="/profile" element={<Profile/>}/>
          
        </Route>
      </Route>
 
      <Route element={<ProtectedRoute role="vendor" />}>
        <Route path="/vendor" element={<VendorLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile/>}/>
          
        </Route>
      </Route>
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="vendors" element={<AdminVendors />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="payouts" element={<AdminPayouts />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="profile" element={<Profile/>}/>
        </Route>
      </Route>
    </Routes>
      </CartProvider>
  );
}

export default App;
