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

export default function PickupPointPicker({
  carrier,
  onClose,
  onSelect,
}: {
  carrier: "GLS" | "FOXPOST";
  onClose: () => void;
  onSelect: (p: PickupPoint) => void;
}) {
  const [query, setQuery] = useState("");
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const url =
          carrier === "FOXPOST" ? "/api/foxpost/terminals" : "/api/gls/pudos";
        const res = await fetch(url);
        const data = await res.json();
        if (!alive) return;
        // alakítsd a választ egységes PickupPoint tömbbé
        const mapped: PickupPoint[] = (data?.items || data || []).map(
          (x: any) => ({
            carrier,
            id: x.id || x.place_id || x.terminalId || x.code,
            name: x.name || x.label || x.address?.name || `${carrier} pont`,
            address:
              x.address?.full ||
              x.address ||
              `${x.zip || ""} ${x.city || ""} ${
                x.street || x.addr || ""
              }`.trim(),
            zip: x.zip || x.postalCode,
            city: x.city || x.settlement,
            lat: x.lat || x.latitude,
            lng: x.lng || x.longitude,
          })
        );
        setPoints(mapped);
      } catch (e: any) {
        setError(e?.message || "Nem sikerült betölteni az átvevőpontokat.");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [carrier]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return points.slice(0, 200); // limitáljuk a listát
    return points.filter((p) =>
      [p.name, p.address, p.city, p.zip]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q))
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
            onChange={(e) => setQuery(e.target.value)}
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
