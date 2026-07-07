import { useState, useMemo, useCallback } from "react"
import type { Cart, CartItem } from "@/types/common"

export type { Cart, CartItem }

export interface PosItem {
  id:    string
  name:  string
  price: number
  image: string
}

export interface UseCartReturn {
  cart:       Cart
  cartItems:  CartItem[]
  itemCount:  number
  subtotal:   number
  addItem:    (item: PosItem) => void
  removeItem: (id: string) => void
  clearItem:  (id: string) => void
  clearCart:  () => void
  getQty:     (id: string) => number
}

export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<Cart>({})

  const addItem = useCallback((item: PosItem) => {
    setCart(prev => ({
      ...prev,
      [item.id]: prev[item.id]
        ? { ...prev[item.id], quantity: prev[item.id].quantity + 1 }
        : { id: item.id, name: item.name, price: item.price, image: item.image, quantity: 1 },
    }))
  }, [])

  const removeItem = useCallback((id: string) => {
    setCart(prev => {
      if (!prev[id]) return prev
      if (prev[id].quantity <= 1) {
        const { [id]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: { ...prev[id], quantity: prev[id].quantity - 1 } }
    })
  }, [])

  const clearItem = useCallback((id: string) => {
    setCart(prev => {
      const { [id]: _removed, ...rest } = prev
      return rest
    })
  }, [])

  const clearCart = useCallback(() => setCart({}), [])

  const getQty = useCallback((id: string) => cart[id]?.quantity ?? 0, [cart])

  const cartItems = useMemo(() => Object.values(cart), [cart])
  const subtotal  = useMemo(() => cartItems.reduce((s, i) => s + i.price * i.quantity, 0), [cartItems])
  const itemCount = useMemo(() => cartItems.reduce((s, i) => s + i.quantity, 0), [cartItems])

  return { cart, cartItems, itemCount, subtotal, addItem, removeItem, clearItem, clearCart, getQty }
}
