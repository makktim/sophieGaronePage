const KEY = "cart.v1"; // változtasd, ha sémát módosítasz
const EXPIRES_DAYS = 1; // opcionális lejárat

const storage = () =>
  typeof window === "undefined" ? null : window.localStorage;
// ha inkább session kell: window.sessionStorage

export type PersistedCart = {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageSrc?: string;
  }>;
  totalAmount: number;
  updatedAt: number;
};

export function loadCart(): PersistedCart | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedCart;
    // minimális validáció
    if (!Array.isArray(data?.items)) return null;
    if (
      EXPIRES_DAYS &&
      Date.now() - (data.updatedAt || 0) > EXPIRES_DAYS * 864e5
    )
      return null;
    return data;
  } catch {
    return null;
  }
}

export function saveCart(cart: PersistedCart) {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(KEY, JSON.stringify({ ...cart, updatedAt: Date.now() }));
  } catch {
    // kvóta hiba esetén csendben bukunk
  }
}

export function clearCartStorage() {
  storage()?.removeItem(KEY);
}
