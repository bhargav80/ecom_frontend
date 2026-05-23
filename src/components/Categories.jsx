import React from "react";
import { useNavigate,Link } from "react-router-dom";
import {
  Shirt,
  Laptop,
  Watch,
  Home,
  Grid,
} from "lucide-react";

const categories = [
  { name: "Fashion", icon: <Shirt size={28} /> },
  { name: "Electronics", icon: <Laptop size={28} /> },
  { name: "Accessories", icon: <Watch size={28} /> },
  { name: "Home", icon: <Home size={28} /> },
];

const Categories = () => {
   const navigate = useNavigate();
  return (
    <div className="mt-10 flex justify-center">
      <div className="w-full max-w-5xl px-4">
        
        <h2 className="text-base sm:text-lg font-semibold mb-6 text-center">
          Shop by Category
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:justify-center gap-6">
          
          {/* Category Cards */}
          {categories.map((cat, index) => (
            <div
              key={index}
              onClick={() => navigate(`/category/${cat.name}`)}
              className="flex flex-col items-center justify-center 
                         bg-gray-100 
                         w-full md:w-24 h-24 
                         rounded-xl md:rounded-full 
                         cursor-pointer 
                         hover:bg-blue-100 
                         hover:scale-105 
                         hover:shadow-md
                         transition duration-200"
            >
              <div className="mb-1 text-blue-600">{cat.icon}</div>
              <span className="text-xs sm:text-sm text-center px-2">
                {cat.name}
              </span>
            </div>
          ))}

          {/* View All Card */}
          <div
            className="flex flex-col items-center justify-center 
                       bg-blue-600 text-white
                       w-full md:w-24 h-24 
                       rounded-xl md:rounded-full 
                       cursor-pointer 
                       hover:bg-blue-700 
                       hover:scale-105 
                       hover:shadow-md
                       transition duration-200"
          >
            <Grid size={28} />
            
            <div className="text-xs sm:text-sm mt-1" onClick={()=>navigate('/categories')}>
             Categories
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Categories;