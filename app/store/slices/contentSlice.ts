import { createSlice } from "@reduxjs/toolkit";
import huContent from "../../huContent.json";

const initialState: CartState = {
  content: huContent,
  language: "hu",
  isOpen: false,
};

const contentSlice = createSlice({
  name: "content",
  initialState,
  reducers: {
    updateQuantity: (state) => {
      state.content = huContent;
    },
    openModal: (state) => {
      state.isOpen = true;
    },
    closeModal: (state) => {
      state.isOpen = false;
    },
  },
});

export const { updateQuantity, openModal, closeModal } = contentSlice.actions;
export default contentSlice.reducer;
