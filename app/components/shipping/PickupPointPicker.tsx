"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./pickup.module.css";

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

type Carrier = "GLS" | "FOXPOST";

// Segéd típusőrök és olvasók
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getString(obj: unknown, key: string): string | undefined {
  return isRecord(obj) && typeof obj[key] === "string"
    ? (obj[key] as string)
    : undefined;
}
function getNumber(obj: unknown, key: string): number | undefined {
  return isRecord(obj) && typeof obj[key] === "number"
    ? (obj[key] as number)
    : undefined;
}

function getNestedRecord(
  obj: unknown,
  key: string
): Record<string, unknown> | undefined {
  return isRecord(obj) && isRecord(obj[key]) ? (obj[key] as Record<string, unknown>) : undefined;
}

function asArray(maybeArr: unknown): unknown[] {
  return Array.isArray(maybeArr) ? maybeArr : [];
}

/**
 * Külső (GLS/Foxpost) API item → egységes PickupPoint
 * Nem használ `any`-t, csak szigorú ellenőrzéseket.
 */
function mapExternalItemToPickupPoint(
  carrier: Carrier,
  x: unknown
): PickupPoint | null {
  const id =
    getString(x, "id") ??
    getString(x, "place_id") ??
    getString(x, "terminalId") ??
    getString(x, "code");

  const name =
    getString(x, "name") ??
    getString(x, "label") ??
    getString(getNestedRecord(x, "address"), "name") ??
    `${carrier} pont`;

  const zip = getString(x, "zip") ?? getString(x, "postalCode");
  const city = getString(x, "city") ?? getString(x, "settlement");

  const streetLike =
    getString(x, "street") ?? getString(x, "addr") ?? undefined;

  const addrObj = getNestedRecord(x, "address");
  const addressFull = getString(addrObj, "full");
  const address =
    addressFull ??
    (zip || city || streetLike
      ? `${zip ?? ""} ${city ?? ""} ${streetLike ?? ""}`.trim()
      : name);

  const lat = getNumber(x, "lat") ?? getNumber(x, "latitude");
  const lng = getNumber(x, "lng") ?? getNumber(x, "longitude");

  if (!id) return null;

  return {
    carrier,
    id,
    name,
    address,
    zip,
    city,
    lat,
    lng,
  };
}

export default function PickupPointPicker({
  carrier,
  onClose,
  onSelect,
}: {
  carrier: Carrier;
  onClose: () => void;
  onSelect: (p: PickupPoint) => void;
}) {
  const [query, setQuery] = useState<string>("");
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const url =
          carrier === "FOXPOST" ? "/api/foxpost/terminals" : "/api/gls/pudos";

        const res = await fetch(url);
        // Ha nem 2xx, adjunk hibát
        if (!res.ok) {
          throw new Error(`Hálózati hiba: ${res.status} ${res.statusText}`);
        }

        const json: unknown = await res.json();
        if (!alive) return;

        // A legtöbb API { items: [...] }-t ad vissza; ha nem, próbáljuk tömbként kezelni
        const container = (isRecord(json) && "items" in json ? (json as { items?: unknown }).items : json);
        const list = asArray(container);

        const mapped: PickupPoint[] = list
          .map((item) => mapExternalItemToPickupPoint(carrier, item))
          .filter((p): p is PickupPoint => p !== null);

        setPoints(mapped);
      } catch (e: unknown) {
        const msg =
          e instanceof Error
            ? e.message
            : typeof e === "string"
            ? e
            : "Ismeretlen hiba történt.";
        if (alive) setError(msg || "Nem sikerült betölteni az átvevőpontokat.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [carrier]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return points.slice(0, 200); // limitáljuk a listát
    return points.filter((p) =>
      [p.name, p.address, p.city, p.zip]
        .filter((s): s is string => Boolean(s))
        .some((s) => s.toLowerCase().includes(q))
    );
  }, [points, query]);

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <header className={styles.header}>
          <h3>
            {carrier === "FOXPOST"
              ? "Foxpost automata választása"
              : "GLS CsomagPont választása"}
          </h3>
          <button
            className={styles.close}
            onClick={onClose}
            aria-label="Bezárás"
          >
            ×
          </button>
        </header>
        <div className={styles.controls}>
          <input
            className={styles.search}
            placeholder="Keresés város, irányítószám, utca szerint…"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setQuery(e.target.value)
            }
          />
        </div>
        {loading ? (
          <div className={styles.loading}>Betöltés…</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <ul className={styles.list}>
            {filtered.map((p) => (
              <li key={`${p.carrier}-${p.id}`} className={styles.item}>
                <div className={styles.itemMain}>
                  <strong>{p.name}</strong>
                  <div className={styles.addr}>{p.address}</div>
                </div>
                <button className={styles.select} onClick={() => onSelect(p)}>
                  Választás
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
