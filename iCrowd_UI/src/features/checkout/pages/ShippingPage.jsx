import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCart } from '../../cart/hooks/CartContext';
import MapSelector from '../components/MapSelector';
import { MapPin, Truck, Zap } from 'lucide-react';

const ShippingPage = () => {
  const { user } = useAuth();
  const { cart, getCartTotal, getItemCount } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    district: '',
  });

  const [deliveryType, setDeliveryType] = useState('STANDARD'); // STANDARD or FAST
  const [mapLocation, setMapLocation] = useState(null);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        phone: user.phone || '',
        email: user.email || '',
        address: user.address || '',
        district: user.district || '',
      });
    }
  }, [user]);

  // Redirect if cart empty
  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const subTotal = getCartTotal();
  const shippingCost = deliveryType === 'FAST' ? 500 : 200;
  const total = subTotal + shippingCost;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const checkoutData = {
      shippingFullName: formData.fullName,
      shippingPhone: formData.phone,
      shippingEmail: formData.email,
      shippingAddress: formData.address,
      shippingDistrict: formData.district,
      shippingLat: mapLocation ? mapLocation[0] : null,
      shippingLng: mapLocation ? mapLocation[1] : null,
      deliveryType: deliveryType,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };

    // Save to local storage for the next step (PaymentPage)
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    navigate('/checkout/payment');
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      
      {/* Left: Form */}
      <div className="md:w-2/3">
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm mb-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <MapPin size={24} /> Shipping Information
          </h2>
          
          <form id="shipping-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-black" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-black" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-black" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <select required name="district" value={formData.district} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-black bg-white">
                <option value="">Select District</option>
                <option value="Colombo">Colombo</option>
                <option value="Gampaha">Gampaha</option>
                <option value="Kandy">Kandy</option>
                <option value="Galle">Galle</option>
                {/* Add more as needed */}
              </select>
            </div>
          </form>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm mb-6">
          <h2 className="text-xl font-bold mb-4">Pin Your Location</h2>
          <p className="text-gray-500 text-sm mb-4">This helps our riders deliver your package faster and more accurately.</p>
          <MapSelector onLocationSelect={setMapLocation} />
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Delivery Method</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <label className={`cursor-pointer border-2 rounded-2xl p-4 flex items-start gap-4 transition-all ${deliveryType === 'STANDARD' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="delivery" value="STANDARD" checked={deliveryType === 'STANDARD'} onChange={() => setDeliveryType('STANDARD')} className="mt-1 accent-black w-4 h-4" />
              <div>
                <div className="flex items-center gap-2 font-bold text-black mb-1">
                  <Truck size={18} /> Standard Delivery
                </div>
                <p className="text-sm text-gray-500">3-5 Business Days</p>
                <p className="font-semibold text-black mt-2">Rs. 200.00</p>
              </div>
            </label>

            <label className={`cursor-pointer border-2 rounded-2xl p-4 flex items-start gap-4 transition-all ${deliveryType === 'FAST' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="delivery" value="FAST" checked={deliveryType === 'FAST'} onChange={() => setDeliveryType('FAST')} className="mt-1 accent-black w-4 h-4" />
              <div>
                <div className="flex items-center gap-2 font-bold text-black mb-1">
                  <Zap size={18} className="text-amber-500" /> Fast Delivery
                </div>
                <p className="text-sm text-gray-500">1-2 Business Days</p>
                <p className="font-semibold text-black mt-2">Rs. 500.00</p>
              </div>
            </label>

          </div>
        </div>
      </div>

      {/* Right: Summary */}
      <div className="md:w-1/3">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm sticky top-6">
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            {cart.map((item) => (
              <div key={item.product.id} className="flex gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-xl flex-shrink-0 p-1">
                  <img src={item.product.imageUrls?.[0]} alt={item.product.name} className="w-full h-full object-cover mix-blend-multiply" />
                </div>
                <div className="flex-grow">
                  <p className="text-sm font-bold text-black line-clamp-2">{item.product.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  <p className="text-sm font-semibold mt-1">Rs. {(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3 mb-6">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal ({getItemCount()} items)</span>
              <span>Rs. {subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Shipping cost</span>
              <span>Rs. {shippingCost.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mb-8">
            <div className="flex justify-between items-end">
              <span className="font-bold text-black">Total</span>
              <span className="text-2xl font-black text-black">Rs. {total.toFixed(2)}</span>
            </div>
          </div>

          <button 
            type="submit" 
            form="shipping-form"
            className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-colors shadow-lg active:scale-[0.98]"
          >
            Continue to Payment
          </button>
        </div>
      </div>

    </div>
  );
};

export default ShippingPage;
