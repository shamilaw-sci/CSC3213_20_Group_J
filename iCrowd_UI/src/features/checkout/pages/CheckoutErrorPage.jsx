import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const CheckoutErrorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const errorMessage = location.state?.message || "Something went wrong during checkout.";

  return (
    <div className="max-w-xl mx-auto py-20 px-4 text-center">
      
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle size={48} className="text-red-600" />
      </div>
      
      <h1 className="text-3xl font-black text-black mb-4 tracking-tight">Checkout Failed</h1>
      
      <div className="bg-red-50 text-red-800 p-6 rounded-2xl border border-red-100 mb-8 font-medium">
        {errorMessage}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          onClick={() => navigate(-1)}
          className="bg-gray-100 text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft size={18} />
          Go Back & Try Again
        </button>

        <Link 
          to="/cart" 
          className="bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-colors shadow-lg active:scale-95"
        >
          Return to Cart
        </Link>
      </div>
    </div>
  );
};

export default CheckoutErrorPage;
