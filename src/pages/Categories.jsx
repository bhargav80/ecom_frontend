import React from "react";
import { 
  Laptop, Shirt, Home, Dumbbell, Watch, Sofa, ChevronRight,
  BookText, ToyBrick, Apple, Droplet
} from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  { name: "electronics", icon: Laptop },
  { name: "fashion", icon: Shirt },
  { name: "home", icon: Home },
  { name: "fitness", icon: Dumbbell },
  { name: "accessories", icon: Watch },
  { name: "furniture", icon: Sofa },
  { name: "beauty", icon: Droplet },   // replaced
  { name: "grocerries", icon: Apple }, // replaced
  { name: "toys", icon: ToyBrick },    // fixed case
  { name: "books", icon: BookText },
];
const Categories = () => {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 max-w-5xl mx-auto">
      
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Shop by Category
      </h1>

      {/* Mobile = grid | Desktop = list */}
      <div className="grid grid-cols-3 gap-3 md:flex md:flex-col">
        
        {categories.map((cat) => {
          const Icon = cat.icon;

          return (
            <Link
              key={cat.name}
              to={`/category/${cat.name}`}
              className="group bg-white border border-gray-200 rounded-2xl p-3 
              flex flex-col items-center justify-center text-center
              md:flex-row md:justify-between md:px-5 md:py-4
              hover:shadow-md transition-all duration-200"
            >

              {/* Left / Top */}
              <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
                <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>

                <span className="text-xs md:text-base font-medium text-gray-800 capitalize group-hover:text-blue-600">
                  {cat.name}
                </span>
              </div>

              {/* Right arrow (only desktop) */}
              <ChevronRight className="hidden md:block w-5 h-5 text-gray-400 group-hover:text-blue-500" />
            </Link>
          );
        })}

      </div>
    </div>
  );
};

export default Categories;