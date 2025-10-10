export type FoxpostPickupPoint = { id: string; name: string; address: string };

function foxpostTerminalsUrl() {
  const base = process.env.FOXPOST_BASE_URL || "";
  const isSandbox = base.includes("webapi-test");
  // ha külön meg van adva, azt használjuk
  if (process.env.FOXPOST_TERMINALS_URL) return process.env.FOXPOST_TERMINALS_URL!;
  return isSandbox
    ? "https://cdn.foxpost.hu/sandbox_foxplus.json"
    : "https://cdn.foxpost.hu/foxplus.json";
}

/** operator_id → {name, address}  (ha nem található, null) */
export async function resolveFoxpostPickup(
  operatorId?: string | null
): Promise<FoxpostPickupPoint | null> {
  const id = (operatorId || "").trim();
  if (!id) return null;

  const r = await fetch(foxpostTerminalsUrl(), { next: { revalidate: 3600 } });
  if (!r.ok) return null;

  const data = await r.json();
  const rows = Array.isArray(data) ? data : data?.items || [];
  const hit = rows.find(
    (x: { operator_id: string; place_id: string; }) => String(x.operator_id) === id || String(x.place_id) === id
  );
  if (!hit) return null;

  const address =
    hit.address ||
    [hit.zip, hit.city, hit.street].filter(Boolean).join(", ") ||
    "";
  return {
    id,
    name: hit.name || "Foxpost automata",
    address,
  };
}
