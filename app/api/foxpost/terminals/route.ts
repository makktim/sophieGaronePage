// app/api/foxpost/terminals/route.ts
import { NextResponse } from "next/server";
import { isSandboxFoxpost } from "@/app/lib/foxpostClient";

type PickupPoint = {
  carrier: "FOXPOST";
  id: string; // mindig operator_id!
  operator_id: string;
  place_id: string;
  name: string;
  address: string;
  zip?: string;
  city?: string;
  lat?: number;
  lng?: number;
};

type FoxRow = {
  operator_id?: string;
  place_id?: string;
  name?: string;
  address?: string;
  zip?: string;
  city?: string;
  street?: string;
  geolat?: string | number;
  geolng?: string | number;
};

export async function GET() {
  try {
    const src =
      // ha sandbox a BASE -> sandbox_foxplus.json
      isSandboxFoxpost()
        ? "https://cdn.foxpost.hu/sandbox_foxplus.json"
        : "https://cdn.foxpost.hu/foxplus.json";

    // cache-bust, hogy tuti új listát kapjunk, és ne a régi prod-ot
    const url = `${src}?t=${Date.now()}`;

    const r = await fetch(url, { next: { revalidate: 60 } });
    if (!r.ok) throw new Error(`FOXPOST CDN error: ${r.status}`);
    const data: unknown = await r.json();
    const rows: FoxRow[] = Array.isArray(data)
      ? (data as FoxRow[])
      : (data as { items?: FoxRow[] })?.items ?? [];

    const items: PickupPoint[] = rows
      .map(
        (x): PickupPoint => ({
          carrier: "FOXPOST",
          id: x.operator_id || "", // csak operator_id mehet az id-be
          operator_id: x.operator_id || "",
          place_id: x.place_id || "",
          name: x.name || `Foxpost automata`,
          address:
            x.address || [x.zip, x.city, x.street].filter(Boolean).join(" "),
          zip: x.zip,
          city: x.city,
          lat:
            (typeof x.geolat === "string" ? Number(x.geolat) : x.geolat) ||
            undefined,
          lng:
            (typeof x.geolng === "string" ? Number(x.geolng) : x.geolng) ||
            undefined,
        })
      )
      .filter((it) => !!it.id); // dobjuk a rekordokat, ahol nincs operator_id

    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "FOXPOST list fetch error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
