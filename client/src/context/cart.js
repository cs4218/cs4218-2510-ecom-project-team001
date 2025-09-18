import React, { useState, useContext, createContext, useEffect } from "react";

function normalizeCart(list) {
  if (!Array.isArray(list)) return [];
  const byId = new Map();

  for (const raw of list) {
    if (!raw) continue;
    const id = raw._id ?? raw.id;
    if (!id) continue;

    const existing = byId.get(id);
    if (existing) {
      existing.quantity += 1;
    } else {
      // Treat any incoming `quantity` as product stock; cart starts at 1
      const { quantity: _ignoreStock, ...rest } = raw;
      byId.set(id, { ...rest, _id: id, quantity: 1 });
    }
  }
  return Array.from(byId.values());
}

const CartContext = createContext();
const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    let existingCartItem = localStorage.getItem("cart");
    if (existingCartItem) {
      setCart(normalizeCart(JSON.parse(existingCartItem)));
    }
  }, []);

  return (
    <CartContext.Provider value={[cart, setCart]}>
      {children}
    </CartContext.Provider>
  );
};

// custom hook
const useCart = () => useContext(CartContext);

export { useCart, CartProvider };