import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCart } from '../../cart/hooks/cartState';
import { useAddressBook } from '../../user/hooks/useAddressBook';
import MapSelector from '../components/MapSelector';
import { validateShippingDetails } from '../api/checkoutApi';
import { MapPin, Truck, Zap, AlertCircle, CheckCircle2, Bookmark, Loader2, ShieldCheck } from 'lucide-react';

const SRI_LANKA_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara',
  'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota',
  'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu',
  'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam',
  'Anuradhapura', 'Polonnaruwa',
  'Badulla', 'Monaragala',
  'Ratnapura', 'Kegalle'
];

const ShippingPage = () => {
  const { user } = useAuth();
  const { cart, cartLoading, cartReady, syncError, promo, promoBusy, getCartTotal, getItemCount } = useCart();
  const { addresses, defaultAddress } = useAddressBook(user);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    district: '',
  });

  const [deliveryType, setDeliveryType] = useState('STANDARD'); // STANDARD or FAST
  const [mapLocation, setMapLocation] = useState([6.9271, 79.8612]); // Default: Colombo
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState('HOME');

  // Validation & Error states
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  // Backend calculated pricing summary
  const [validatedSummary, setValidatedSummary] = useState(null);
  const quoteRevision = useRef(0);

  // Redirect if cart empty
  useEffect(() => {
    if (!cartLoading && (!cartReady || syncError || cart.length === 0)) {
      navigate('/cart');
    }
  }, [cart, cartLoading, cartReady, syncError, navigate]);

  // Initial user prefill & address book loading
  useEffect(() => {
    if (user) {
      if (defaultAddress) {
        setSelectedAddressId(String(defaultAddress.id));
        setFormData({
          fullName: defaultAddress.recipientName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          phone: defaultAddress.phone || user.phone || '',
          email: user.email || '',
          address: defaultAddress.address || defaultAddress.addressLine1 || '',
          district: defaultAddress.district || defaultAddress.city || '',
        });
        if (defaultAddress.latitude && defaultAddress.longitude) {
          setMapLocation([parseFloat(defaultAddress.latitude), parseFloat(defaultAddress.longitude)]);
        }
      } else {
        setSelectedAddressId('new');
        setFormData({
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          phone: user.phone || '',
          email: user.email || '',
          address: user.address || '',
          district: user.district || '',
        });
      }
    }
  }, [user, defaultAddress]);

  // Handle saved address dropdown selection
  const handleAddressSelect = (e) => {
    const addressId = e.target.value;
    setSelectedAddressId(addressId);
    setServerError('');
    setErrors({});

    if (addressId === 'new') {
      setFormData({
        fullName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
        phone: user?.phone || '',
        email: user?.email || '',
        address: '',
        district: '',
      });
      setSaveAddress(false);
      return;
    }

    const matched = addresses.find((addr) => String(addr.id) === addressId);
    if (matched) {
      setFormData({
        fullName: matched.recipientName || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''),
        phone: matched.phone || user?.phone || '',
        email: user?.email || '',
        address: matched.address || matched.addressLine1 || '',
        district: matched.district || matched.city || '',
      });
      if (matched.latitude && matched.longitude) {
        setMapLocation([parseFloat(matched.latitude), parseFloat(matched.longitude)]);
      }
      setSaveAddress(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  // Perform backend quote calculation
  const calculateBackendQuote = useCallback(async (currentDeliveryType) => {
    if (!cart || cart.length === 0) return;

    const revision = ++quoteRevision.current;
    setIsQuoteLoading(true);
    setServerError('');

    try {
      const payload = {
        recipientName: formData.fullName || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Guest Customer'),
        phone: formData.phone || '0710000000',
        email: formData.email || user?.email || 'customer@icrowd.lk',
        address: formData.address || 'Colombo, Sri Lanka',
        district: formData.district || 'Colombo',
        latitude: mapLocation ? mapLocation[0] : 6.9271,
        longitude: mapLocation ? mapLocation[1] : 79.8612,
        deliveryType: currentDeliveryType || deliveryType,
        promoCode: promo?.promoCode || null,
        saveAddress: false, // Don't save during live calculation preview
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      const quote = await validateShippingDetails(payload);
      if (revision !== quoteRevision.current) return;
      if (quote && quote.valid) {
        setValidatedSummary(quote);
      }
    } catch (err) {
      console.warn("Backend pricing calculation note:", err?.response?.data || err?.message);
      // Fallback display if temporary connection issue
    } finally {
      if (revision === quoteRevision.current) setIsQuoteLoading(false);
    }
  }, [cart, formData, deliveryType, mapLocation, user, promo]);

  // Recalculate quote when delivery method or cart changes
  useEffect(() => {
    if (cart.length > 0) {
      calculateBackendQuote(deliveryType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryType, cart, promo]);

  // Frontend field validation
  const validateFrontend = () => {
    const newErrors = {};

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Recipient name must be at least 2 characters.';
    }

    const cleanPhone = (formData.phone || '').trim().replace(/[\s-]/g, '');
    const phonePattern = /^(\+?94|0)?[0-9]{9,10}$/;
    if (!formData.phone || !cleanPhone) {
      newErrors.phone = 'Phone number is required.';
    } else if (!phonePattern.test(cleanPhone)) {
      newErrors.phone = 'Enter a valid telephone number (e.g. 0712345678 or +94712345678).';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailPattern.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address.';
    }

    if (!formData.address || formData.address.trim().length < 4) {
      newErrors.address = 'Street address must be at least 4 characters.';
    }

    if (!formData.district) {
      newErrors.district = 'Please select your delivery district.';
    }

    if (!deliveryType) {
      newErrors.deliveryType = 'Please choose a delivery method.';
    }

    if (!mapLocation || !Array.isArray(mapLocation) || mapLocation.length !== 2) {
      newErrors.mapLocation = 'Please pin your location on the map.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Form Submission -> Backend Validation -> Proceed to Payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (promoBusy) return;
    setServerError('');

    // Step 1: Run Frontend Validation
    const isFormValid = validateFrontend();
    if (!isFormValid) {
      const firstError = document.querySelector('.border-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsValidating(true);

    try {
      // Step 2: Validate shipping info and compute trusted prices on backend
      const validationPayload = {
        recipientName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        district: formData.district,
        latitude: mapLocation ? mapLocation[0] : null,
        longitude: mapLocation ? mapLocation[1] : null,
        deliveryType: deliveryType,
        promoCode: promo?.promoCode || null,
        saveAddress: Boolean(user && saveAddress),
        addressLabel: addressLabel,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      const response = await validateShippingDetails(validationPayload);

      if (!response.valid) {
        setServerError(response.message || 'Shipping information validation failed. Please review your details.');
        setIsValidating(false);
        return;
      }

      // Step 3: Store validated checkout details with trusted backend calculations
      const checkoutData = {
        owner: String(user.id || user.email),
        promoCode: promo?.promoCode || null,
        shippingFullName: formData.fullName.trim(),
        shippingPhone: formData.phone.trim(),
        shippingEmail: formData.email.trim(),
        shippingAddress: formData.address.trim(),
        shippingDistrict: formData.district,
        shippingLat: mapLocation ? mapLocation[0] : null,
        shippingLng: mapLocation ? mapLocation[1] : null,
        deliveryType: response.deliveryType || deliveryType,
        subTotal: Number(response.subTotal),
        discount: Number(response.discount || 0),
        shippingCost: Number(response.deliveryFee),
        total: Number(response.totalAmount),
        estimatedDelivery: response.estimatedDelivery,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          name: item.product.name,
          price: item.product.price,
        })),
      };

      // Persist validated checkout session data for payment page
      sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));

      // Step 4: Continue to Payment without creating order or initiating payment
      navigate('/checkout/payment');
    } catch (err) {
      console.error("Backend shipping validation error:", err);
      const apiErr = err.response?.data;
      if (apiErr?.error === 'OUT_OF_STOCK') {
        setServerError(`Item "${apiErr.productName || 'in your cart'}" is currently out of stock or requested quantity is unavailable.`);
      } else if (apiErr?.message) {
        setServerError(apiErr.message);
      } else {
        setServerError('Could not validate shipping information. Please check your network and try again.');
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Fallback prices if backend response hasn't loaded yet
  const fallbackSubTotal = getCartTotal();
  const fallbackShipping = deliveryType === 'FAST' ? 500 : 200;
  const displaySubTotal = validatedSummary?.subTotal != null ? Number(validatedSummary.subTotal) : fallbackSubTotal;
  const displayDiscount = validatedSummary?.discount != null ? Number(validatedSummary.discount) : 0;
  const displayShippingCost = validatedSummary?.deliveryFee != null ? Number(validatedSummary.deliveryFee) : fallbackShipping;
  const displayTotal = validatedSummary?.totalAmount != null ? Number(validatedSummary.totalAmount) : (displaySubTotal - displayDiscount + displayShippingCost);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
      {/* Left: Form */}
      <div className="min-w-0">
        {/* Backend Error Alert */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 mb-6 flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Please check your details</p>
              <p className="text-xs text-red-700 mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        <div className="bg-white p-5 sm:p-7 rounded-[32px] border border-gray-100 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MapPin size={24} /> Shipping Information
            </h2>

            {/* Saved Addresses Dropdown for Logged-in Customer */}
            {user && addresses.length > 0 && (
              <div className="w-full sm:w-auto">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Saved Addresses</label>
                <select
                  value={selectedAddressId}
                  onChange={handleAddressSelect}
                  className="w-full sm:w-64 text-xs font-medium border border-gray-300 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="new">+ Enter a new address</option>
                  {addresses.map((addr) => (
                    <option key={addr.id} value={String(addr.id)}>
                      {addr.label ? `[${addr.label}] ` : ''}{addr.recipientName || 'Address'} - {addr.address || addr.addressLine1}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <form id="shipping-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="e.g. Kamal Perera"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full border rounded-xl px-4 py-3 focus:outline-none transition-colors ${
                    errors.fullName ? 'border-red-500 bg-red-50/30 focus:border-red-600' : 'border-gray-300 focus:border-black'
                  }`}
                />
                {errors.fullName && <p className="text-xs text-red-600 mt-1 font-medium">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="e.g. 077 123 4567"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full border rounded-xl px-4 py-3 focus:outline-none transition-colors ${
                    errors.phone ? 'border-red-500 bg-red-50/30 focus:border-red-600' : 'border-gray-300 focus:border-black'
                  }`}
                />
                {errors.phone && <p className="text-xs text-red-600 mt-1 font-medium">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="e.g. kamal@example.com"
                value={formData.email}
                onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none transition-colors ${
                  errors.email ? 'border-red-500 bg-red-50/30 focus:border-red-600' : 'border-gray-300 focus:border-black'
                }`}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1 font-medium">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                placeholder="House No, Street Name, Apartment / Suite"
                value={formData.address}
                onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none transition-colors ${
                  errors.address ? 'border-red-500 bg-red-50/30 focus:border-red-600' : 'border-gray-300 focus:border-black'
                }`}
              />
              {errors.address && <p className="text-xs text-red-600 mt-1 font-medium">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District <span className="text-red-500">*</span>
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none bg-white transition-colors cursor-pointer ${
                  errors.district ? 'border-red-500 bg-red-50/30 focus:border-red-600' : 'border-gray-300 focus:border-black'
                }`}
              >
                <option value="">Select District</option>
                {SRI_LANKA_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
              {errors.district && <p className="text-xs text-red-600 mt-1 font-medium">{errors.district}</p>}
            </div>

            {/* Save Address to Account Checkbox */}
            {user && (selectedAddressId === 'new' || !selectedAddressId) && (
              <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 mt-4 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-gray-800">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="w-4 h-4 rounded text-black focus:ring-black accent-black cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5">
                    <Bookmark size={16} className="text-gray-500" />
                    Save this address to my account for future orders
                  </span>
                </label>

                {saveAddress && (
                  <div className="pt-2 pl-6 border-t border-gray-200/60 flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-600">Address Label:</span>
                    <div className="flex gap-2">
                      {['HOME', 'WORK', 'OTHER'].map((label) => (
                        <button
                          type="button"
                          key={label}
                          onClick={() => setAddressLabel(label)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            addressLabel === label
                              ? 'bg-black text-white border-black shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Map Location Section */}
        <div className="bg-white p-5 sm:p-7 rounded-[32px] border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MapPin size={20} /> Pin Your Location
            </h2>
            {mapLocation && (
              <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                {mapLocation[0].toFixed(4)}, {mapLocation[1].toFixed(4)}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Click anywhere on the map to place or reposition your delivery pin. This ensures precise dispatch.
          </p>
          <MapSelector
            selectedPosition={mapLocation}
            onLocationSelect={(coords) => {
              setMapLocation(coords);
              if (errors.mapLocation) {
                setErrors((prev) => ({ ...prev, mapLocation: '' }));
              }
            }}
          />
          {errors.mapLocation && <p className="text-xs text-red-600 mt-2 font-medium">{errors.mapLocation}</p>}
        </div>

        {/* Delivery Method Selection */}
        <div className="bg-white p-5 sm:p-7 rounded-[32px] border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Delivery Method</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`cursor-pointer border-2 rounded-2xl p-4 flex items-start gap-4 transition-all ${
                deliveryType === 'STANDARD' ? 'border-black bg-gray-50/70 shadow-sm' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="delivery"
                value="STANDARD"
                checked={deliveryType === 'STANDARD'}
                onChange={() => setDeliveryType('STANDARD')}
                className="mt-1 accent-black w-4 h-4 cursor-pointer"
              />
              <div>
                <div className="flex items-center gap-2 font-bold text-black mb-1">
                  <Truck size={18} /> Standard Delivery
                </div>
                <p className="text-sm text-gray-500">3-5 Business Days</p>
                <p className="font-semibold text-black mt-2">LKR 200.00</p>
              </div>
            </label>

            <label
              className={`cursor-pointer border-2 rounded-2xl p-4 flex items-start gap-4 transition-all ${
                deliveryType === 'FAST' ? 'border-black bg-gray-50/70 shadow-sm' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="delivery"
                value="FAST"
                checked={deliveryType === 'FAST'}
                onChange={() => setDeliveryType('FAST')}
                className="mt-1 accent-black w-4 h-4 cursor-pointer"
              />
              <div>
                <div className="flex items-center gap-2 font-bold text-black mb-1">
                  <Zap size={18} className="text-amber-500" /> Fast Delivery
                </div>
                <p className="text-sm text-gray-500">1-2 Business Days</p>
                <p className="font-semibold text-black mt-2">LKR 500.00</p>
              </div>
            </label>
          </div>
          {errors.deliveryType && <p className="text-xs text-red-600 mt-2 font-medium">{errors.deliveryType}</p>}
        </div>
      </div>

      {/* Right: Validated Order Summary */}
      <div className="min-w-0">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm sticky top-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Order Summary</h2>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <ShieldCheck size={14} /> Order estimate
            </div>
          </div>

          {/* Cart Item Preview */}
          <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.product.id} className="flex gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-xl flex-shrink-0 p-1 border border-gray-100">
                  <img
                    src={item.product.imageUrls?.[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover mix-blend-multiply rounded-lg"
                  />
                </div>
                <div className="flex-grow">
                  <p className="text-sm font-bold text-black line-clamp-2">{item.product.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                  <p className="text-sm font-semibold mt-1">
                    LKR {(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown calculated from trusted backend data */}
          <div className="border-t border-gray-100 pt-4 space-y-3 mb-6 relative">
            {isQuoteLoading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
                <Loader2 className="w-5 h-5 text-black animate-spin" />
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal ({getItemCount()} items)</span>
              <span className="font-medium text-gray-900">LKR {displaySubTotal.toFixed(2)}</span>
            </div>

            {displayDiscount > 0 && (
              <div className="flex justify-between text-sm text-emerald-700 font-medium">
                <span>Promotional Discount</span>
                <span>- LKR {displayDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                Delivery Fee
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                  {deliveryType === 'FAST' ? 'Express' : 'Standard'}
                </span>
              </span>
              <span className="font-medium text-gray-900">LKR {displayShippingCost.toFixed(2)}</span>
            </div>

            {validatedSummary?.estimatedDelivery && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                <span>Estimated arrival: <strong className="text-gray-900">{validatedSummary.estimatedDelivery}</strong></span>
              </div>
            )}
          </div>

          {/* Order Total */}
          <div className="border-t border-gray-100 pt-4 mb-8">
            <div className="flex justify-between items-end">
              <div>
                <span className="font-bold text-black block">Total Payable</span>
                <span className="text-xs text-gray-500">Includes all taxes & delivery</span>
              </div>
              <span className="text-2xl font-black text-black">
                LKR {displayTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Continue to Payment button */}
          <button
            type="submit"
            form="shipping-form"
            disabled={isValidating || promoBusy}
            className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Checking your details…</span>
              </>
            ) : (
              <span>Continue to Payment</span>
            )}
          </button>

          <p className="text-[11px] text-gray-400 text-center mt-3">
            Next, choose how you would like to pay.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingPage;
