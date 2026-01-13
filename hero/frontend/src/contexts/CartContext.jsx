import React, { createContext, useState } from 'react';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const storedCart = localStorage.getItem('@CampinasShopping:cart');
    if (storedCart) {
      return JSON.parse(storedCart);
    }
    return [];
  });

  // Persistir no localStorage sempre que o carrinho mudar
  React.useEffect(() => {
    localStorage.setItem('@CampinasShopping:cart', JSON.stringify(cart));
  }, [cart]);

  function addToCart(product, storeId) {
    // Multi-store support enabled
    setCart(prevCart => {
       const itemInCart = prevCart.find(item => item.id === product.id);
       if (itemInCart) {
           return prevCart.map(item => 
               item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
           );
       }
       return [...prevCart, { ...product, quantity: 1, storeId }];
    });
  }

  function removeFromCart(productId) {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }
  
  function clearCart() {
      setCart([]);
  }

  const total = cart.reduce((acc, item) => acc + (Number(item.preco) * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}
