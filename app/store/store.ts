import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./slices/cartSlice";
import contentReducer from "./slices/contentSlice";
import shippingReducer from "./slices/shippingSlice";
import productsReducer from "./slices/productSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    content: contentReducer,
    shipping: shippingReducer,
    products: productsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
