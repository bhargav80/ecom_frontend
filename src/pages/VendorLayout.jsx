import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const VendorLayout = () => {
  return (
    <>
      

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6 bg-gray-50 min-h-screen">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default VendorLayout;