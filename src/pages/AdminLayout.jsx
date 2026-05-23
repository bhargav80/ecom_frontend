import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSiderbar";


const AdminLayout = () => {
  return (
    <>
      

      <div className="flex">
        <AdminSidebar />

        <main className="flex-1 p-6 bg-gray-50 min-h-screen">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default AdminLayout;