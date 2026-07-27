import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageSrc?: string;
};

type CartState = {
  items: CartItem[];
  totalAmount: number;
};

const initialState: CartState = { items: [], totalAmount: 0 };

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem(
      state,
      action: PayloadAction<{
        id: string;
        name: string;
        price: number;
        quantity: number;
        imageSrc?: string;
      }>
    ) {
      const i = state.items.findIndex((x) => x.id === action.payload.id);
      if (i >= 0) {
        state.items[i].quantity += action.payload.quantity;
        if (action.payload.imageSrc) {
          state.items[i].imageSrc = action.payload.imageSrc;
        }
      } else {
        state.items.push({ ...action.payload });
      }
      state.totalAmount = state.items.reduce(
        (s, it) => s + it.price * it.quantity,
        0
      );
    },
    updateQuantity(
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) {
      const it = state.items.find((x) => x.id === action.payload.id);
      if (it) it.quantity = Math.max(1, action.payload.quantity);
      state.totalAmount = state.items.reduce(
        (s, it2) => s + it2.price * it2.quantity,
        0
      );
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((x) => x.id !== action.payload);
      state.totalAmount = state.items.reduce(
        (s, it) => s + it.price * it.quantity,
        0
      );
    },
    clearCart(state) {
      state.items = [];
      state.totalAmount = 0;
    },

    replaceCart(_state, action: PayloadAction<CartState>) {
      return action.payload;
    },
  },
});

export const { addItem, updateQuantity, removeItem, clearCart, replaceCart } =
  cartSlice.actions;
export default cartSlice.reducer;
