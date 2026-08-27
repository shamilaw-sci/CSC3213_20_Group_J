import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle, Mail, Package, CreditCard } from 'lucide-react';

const CheckoutSuccessPage = () => {
  const location = useLocation();
  const orderDetails = location.state;

  if (!orderDetails) {
    return <Navigate to="/search" />;
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={48} className="text-green-600" />
      </div>
      
      <h1 className="text-4xl font-black text-black mb-4 tracking-tight">Order Confirmed!</h1>
      <p className="text-gray-500 text-lg mb-8">
        Thank you for your purchase. Your order number is <span className="font-bold text-black">#{orderDetails.orderId}</span>
      </p>

      <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm text-left mb-8 space-y-6">
        
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Mail size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-black mb-1">Confirmation Email</h3>
            <p className="text-sm text-gray-500">
              We've sent a confirmation email to <span className="font-medium text-black">{orderDetails.email}</span> with your order details.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Package size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-black mb-1">Order Status</h3>
            <p className="text-sm text-gray-500">
              {orderDetails.method === 'BANK_TRANSFER' 
                ? 'Your order is currently PENDING. We will process it as soon as we verify your bank transfer receipt.' 
                : 'Your order is PROCESSING and will be shipped soon.'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
            <CreditCard size={20} className="text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-black mb-1">Total Paid</h3>
            <p className="font-black text-xl text-black">Rs. {orderDetails.total.toFixed(2)}</p>
          </div>
        </div>

      </div>

      <Link 
        to="/search" 
        className="inline-block bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-colors shadow-lg active:scale-95"
      >
        Continue Shopping
      </Link>
    </div>
  );
};

export default CheckoutSuccessPage;
