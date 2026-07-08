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
  cart:            Cart
  cartItems:       CartItem[]
  itemCount:       number
  subtotal:        number
  addItem:         (item: PosItem, quantity?: number, kotSent?: boolean) => void
  removeItem:      (id: string) => void
  clearItem:       (id: string) => void
  clearCart:       () => void
  getQty:          (id: string) => number
  markAllKotSent:  () => void
  hasUnsentItems:  boolean
}

export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<Cart>({})

  const addItem = useCallback((item: PosItem, quantity = 1, isSavedOrder = false) => {
    setCart(prev => {
      const existing = prev[item.id]
      const newQty = existing ? existing.quantity + quantity : quantity
      const newKotQty = isSavedOrder ? newQty : (existing?.kotQty ?? 0)
      const isKotSent = newQty <= newKotQty

      return {
        ...prev,
        [item.id]: {
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: newQty,
          kotQty: newKotQty,
          kotSent: isKotSent,
        }
      }
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setCart(prev => {
      if (!prev[id]) return prev
      const existing = prev[id]
      if (existing.quantity <= 1) {
        const { [id]: _removed, ...rest } = prev
        return rest
      }
      const newQty = existing.quantity - 1
      const isKotSent = newQty <= (existing.kotQty ?? 0)
      return { ...prev, [id]: { ...existing, quantity: newQty, kotSent: isKotSent } }
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

  // Mark every item in the cart as kotSent after KOT is fired
  const markAllKotSent = useCallback(() => {
    setCart(prev => {
      const updated: Cart = {}
      for (const key of Object.keys(prev)) {
        updated[key] = {
          ...prev[key],
          kotQty: prev[key].quantity,
          kotSent: true,
        }
      }
      return updated
    })
  }, [])

  const cartItems = useMemo(() => Object.values(cart), [cart])
  const subtotal  = useMemo(() => cartItems.reduce((s, i) => s + i.price * i.quantity, 0), [cartItems])
  const itemCount = useMemo(() => cartItems.reduce((s, i) => s + i.quantity, 0), [cartItems])

  // True when at least one item hasn't been sent via KOT yet
  const hasUnsentItems = useMemo(() => cartItems.some(i => !i.kotSent), [cartItems])

  return { cart, cartItems, itemCount, subtotal, addItem, removeItem, clearItem, clearCart, getQty, markAllKotSent, hasUnsentItems }
}
