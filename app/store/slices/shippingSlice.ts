import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// (opcionális) ha szeretnél pontosabb típust a draft-hoz:
// import type { Draft } from "@reduxjs/toolkit";

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

// ── Típusos setField reducer (generikus) ──────────────────────────────────────
type SetFieldPayload<K extends keyof ShippingState> = {
  key: K;
  value: ShippingState[K];
};

const setFieldReducer = <K extends keyof ShippingState>(
  state: ShippingState, // vagy Draft<ShippingState> ha használod a típust
  action: PayloadAction<SetFieldPayload<K>>
) => {
  const { key, value } = action.payload;
  // TS itt tudja, hogy value: ShippingState[K]
  state[key] = value as ShippingState[typeof key];
};

// ── Slice ─────────────────────────────────────────────────────────────────────
const shippingSlice = createSlice({
  name: "shipping",
  initialState,
  reducers: {
    // Dinamikus mezőállítás típusosan
    setField: setFieldReducer,

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
