import React from "react";

const Hero = () => {
  return (
    <div className="bg-gradient-to-r from-blue-400 to-blue-200 
                    px-4 md:px-10 
                    py-10 md:py-16 
                    rounded-lg 
                    mx-4 md:mx-8 
                    mt-6">
      
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 leading-snug">
        NEW ARRIVALS - UP TO <br className="hidden sm:block" /> 60% OFF
      </h1>

      <button className="bg-blue-600 text-white px-5 md:px-6 py-2 rounded-full hover:bg-blue-700">
        Shop Now
      </button>
    </div>
  );
};

export default Hero;