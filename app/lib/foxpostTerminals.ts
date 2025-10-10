// app/lib/foxpostTerminals.ts
export type FoxpostTerminal = {
  operator_id: string;
  place_id?: number | string;
  name?: string;
  zip?: string;
  city?: string;
  address?: string;
};

export async function getFoxpostTerminalById(
  id: string
): Promise<FoxpostTerminal | null> {
  const src =
    process.env.FOXPOST_TERMINALS_URL || "https://cdn.foxpost.hu/foxplus.json";
  const r = await fetch(src, { next: { revalidate: 1800 } });
  if (!r.ok) return null;

  const json = await r.json();
  const rows: any[] = Array.isArray(json) ? json : json?.items || [];

  // operator_id az elsődleges, fallback: place_id (sandboxban előfordul)
  const found =
    rows.find((x) => String(x.operator_id) === String(id)) ||
    rows.find((x) => String(x.place_id) === String(id));

  if (!found) return null;

  return {
    operator_id: String(found.operator_id ?? id),
    place_id: found.place_id,
    name: found.name,
    zip: found.zip,
    city: found.city,
    address:
      found.address ||
      [found.zip, found.city, found.street].filter(Boolean).join(" "),
  };
}

export function formatFoxpostTerminal(
  t: FoxpostTerminal | null
): string | null {
  if (!t) return null;
  const addr = [t.zip, t.city, t.address].filter(Boolean).join(" ");
  return [t.name, addr].filter(Boolean).join(" — ");
}
