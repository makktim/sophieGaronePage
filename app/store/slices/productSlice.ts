import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ProductDTO = {
  id: string;
  title: string;
  priceHUF: number;
  stock: number;
  createdAt: string;
  // ha később lesz: imageUrl, description, stb.
};

type UiProduct = {
  id: string;
  title: string;
  price: number; // UI-hoz átnevezve
  currency: "HUF";
  inStock: boolean;
  imageSrc?: string;
};

type State = {
  items: UiProduct[];
};

const initialState: State = { items: [] };

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts(state, action: PayloadAction<UiProduct[]>) {
      console.log("action.payload", action.payload);
      state.items = action.payload;
    },
    upsertProduct(state, action: PayloadAction<UiProduct>) {
      const i = state.items.findIndex((p) => p.id === action.payload.id);
      if (i >= 0) state.items[i] = action.payload;
      else state.items.push(action.payload);
    },
    clearProducts(state) {
      state.items = [];
    },
  },
});

export const { setProducts, upsertProduct, clearProducts } =
  productsSlice.actions;
export default productsSlice.reducer;
