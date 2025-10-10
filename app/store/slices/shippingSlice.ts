import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ShippingMethod =
  | "gls_courier"
  | "gls_parcelshop"
  | "foxpost_locker"
  | "pickup";
export type PaymentHint = "card" | "cod";

export interface PickupPoint {
  carrier: "GLS" | "FOXPOST";
  id: string;
  name: string;
  address: string;
  zip?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

export interface ShippingState {
  // kosár snapshot
  subtotal: number;
  itemsCount: number;
  // elérhetőség
  email: string;
  phone: string;
  // számlázás
  billingName: string;
  billingZip: string;
  billingCity: string;
  billingAddr: string;
  companyVat: string;
  // szállítási cím
  shipDiff: boolean;
  shipZip: string;
  shipCity: string;
  shipAddr: string;
  // szállítás
  shipping: ShippingMethod;
  pickupPoint: PickupPoint | null;
  // fizetés
  paymentHint: PaymentHint;
  // egyebek
  coupon: string;
  note: string;
  acceptTos: boolean;
  marketing: boolean;
  // ui
  submitting: boolean;
  error: string | null;
  showPicker: boolean;
}

const initialState: ShippingState = {
  subtotal: 0,
  itemsCount: 0,
  email: "",
  phone: "",
  billingName: "",
  billingZip: "",
  billingCity: "",
  billingAddr: "",
  companyVat: "",
  shipDiff: false,
  shipZip: "",
  shipCity: "",
  shipAddr: "",
  shipping: "gls_courier",
  pickupPoint: null,
  paymentHint: "card",
  coupon: "",
  note: "",
  acceptTos: false,
  marketing: false,
  submitting: false,
  error: null,
  showPicker: false,
};

const shippingSlice = createSlice({
  name: "shipping",
  initialState,
  reducers: {
    setField(
      state,
      action: PayloadAction<{ key: keyof ShippingState; value: any }>
    ) {
      const { key, value } = action.payload;
      state[key] = value;
    },
    setShippingMethod(state, action: PayloadAction<ShippingMethod>) {
      state.shipping = action.payload;
      const requiresPickup =
        action.payload === "gls_parcelshop" ||
        action.payload === "foxpost_locker";
      if (!requiresPickup) state.pickupPoint = null;
    },
    setPickupPoint(state, action: PayloadAction<PickupPoint | null>) {
      state.pickupPoint = action.payload;
    },
    togglePicker(state, action: PayloadAction<boolean>) {
      state.showPicker = action.payload;
    },
    setSubmitting(state, action: PayloadAction<boolean>) {
      state.submitting = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    resetCheckout() {
      return initialState;
    },
  },
});

export const {
  setField,
  setShippingMethod,
  setPickupPoint,
  togglePicker,
  setSubmitting,
  setError,
  resetCheckout,
} = shippingSlice.actions;

export default shippingSlice.reducer;
