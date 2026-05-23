import React from "react";

const Newsletter = () => {
  return (
    <div className="mx-8 mt-10">
      <h2 className="text-lg font-semibold mb-3">Newsletter</h2>

      <div className="flex gap-4">
        <input
          type="email"
          placeholder="Enter your email"
          className="border px-4 py-2 rounded w-1/3"
        />
        <button className="bg-blue-600 text-white px-6 py-2 rounded">
          Subscribe
        </button>
      </div>
    </div>
  );
};

export default Newsletter;