import React from "react";

const Footer = () => {
  return (
    <footer className="mt-12 px-8 py-6 bg-gray-100 flex justify-between text-sm text-gray-600">
      <div className="flex gap-6">
        <span>Shop</span>
        <span>Help</span>
        <span>About Us</span>
      </div>

      <div className="flex gap-4">
        <span>🌐</span>
        <span>🐦</span>
      </div>
    </footer>
  );
};

export default Footer;