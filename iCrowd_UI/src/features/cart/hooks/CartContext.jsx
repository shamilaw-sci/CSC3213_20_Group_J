import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { syncCartWithBackend } from '../api/cartApi';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  // Load initial state from localStorage
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('iCrowd_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      return [];
    }
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('iCrowd_cart', JSON.stringify(cart));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [cart]);

  // Sync with backend on login
  useEffect(() => {
    if (isAuthenticated) {
      const syncCart = async () => {
        try {
          const serverCart = await syncCartWithBackend(cart);
          if (serverCart && serverCart.items) {
             setCart(serverCart.items.map(dbItem => ({
               product: dbItem.product,
               quantity: dbItem.quantity
             })));
          }
        } catch (error) {
          console.error("Failed to sync cart with backend", error);
        }
      };
      syncCart();
    }
  }, [isAuthenticated]);

  // Helper to persist backend if authenticated
  const notifyBackendIfAuth = async (newCartState) => {
    if (isAuthenticated) {
        try {
          await syncCartWithBackend(newCartState);
        } catch (error) {
            console.error("Failed to push cart update to backend", error);
        }
    }
  };

  const addToCart = (product) => {
    if (product.availableStock <= 0) return; 

    setCart((prevCart) => {
      let newCart;
      const existingItem = prevCart.find((item) => item.product.id === product.id);

      if (existingItem) {
        if (existingItem.quantity < product.availableStock) {
          newCart = prevCart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
            newCart = prevCart;
        }
      } else {
        newCart = [...prevCart, { product, quantity: 1 }];
      }
      
      notifyBackendIfAuth(newCart);
      return newCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => {
        const newCart = prevCart.filter((item) => item.product.id !== productId);
        notifyBackendIfAuth(newCart);
        return newCart;
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) => {
      const newCart = prevCart.map((item) => {
        if (item.product.id === productId) {
          const constrainedQuantity = Math.min(newQuantity, item.product.availableStock);
          return { ...item, quantity: constrainedQuantity };
        }
        return item;
      });
      notifyBackendIfAuth(newCart);
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    notifyBackendIfAuth([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getItemCount = () => {
     return cart.reduce((total, item) => total + item.quantity, 0);
  }

  const isProductInCart = (productId) => {
    return cart.some((item) => item.product.id === productId);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getItemCount,
        isProductInCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
