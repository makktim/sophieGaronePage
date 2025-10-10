// app/api/foxpost/create-parcel/route.ts
import { NextResponse } from "next/server";
import { foxpostFetch } from "@/app/lib/foxpostClient";
import { normHuPhone } from "@/app/lib/phone";


type Address = {
  name?: string;
  email?: string;
  phone?: string;
  zip?: string | number;
  city?: string;
  address?: string;
};

type Payload = {
  orderId?: string; // <<< ÚJ: ha jön, mentünk DB-be
  orderNumber?: string;
  totals?: { total?: number };
  paymentHint?: "card" | "cod" | string;
  note?: string;
  customer?: {
    email?: string;
    phone?: string;
    billing?: Address;
    shippingAddress?: Address;
  };
  shipping?: {
    method?: "foxpost_locker" | "foxpost_home" | string;
    pickupPoint?: { id?: string } | null; // id = operator_id
  };
};

type FoxParcelLockerItem = {
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  destination: string; // operator_id
  size: "XS" | "S" | "M" | "L" | "XL";
  refCode: string;
  cod?: number;
  comment?: string;
};

type FoxParcelHomeItem = {
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  recipientZip: string;
  recipientCity: string;
  recipientAddress: string;
  recipientCountry: "HU";
  size: "XS" | "S" | "M" | "L" | "XL";
  refCode: string;
  cod?: number;
  comment?: string;
};

type FoxRespItem = {
  clFoxId?: string | null;
  barcodeTof?: string | null;
  errors?: { field: string; message: string }[] | null;
};

function pickParcelId(r: FoxRespItem): string | null {
  return r.clFoxId || r.barcodeTof || null;
}

export async function POST(req: Request) {
  try {
    const payload: Payload = await req.json();

    const orderNumber = payload.orderNumber || `ORD-${Date.now()}`;
    const billing: Address = (payload.customer?.billing ?? {}) as Address;
    const shipping: Address = (payload.customer?.shippingAddress ??
      payload.customer?.billing ??
      {}) as Address;

    const email = payload.customer?.email || billing.email || "";
    const phone = normHuPhone(
      payload.customer?.phone || shipping.phone || billing.phone
    );

    const note = payload.note ? String(payload.note).slice(0, 50) : undefined;
    const cod =
      String(payload.paymentHint || "").toLowerCase() === "cod"
        ? Math.max(0, Math.round(Number(payload.totals?.total || 0)))
        : 0;
    const size = "M";

    let item: FoxParcelLockerItem | FoxParcelHomeItem | null = null;

    if (payload.shipping?.method === "foxpost_locker") {
      const dest = payload.shipping?.pickupPoint?.id;
      if (!dest) {
        return NextResponse.json(
          { error: "Hiányzik a pickupPoint.id (operator_id)" },
          { status: 400 }
        );
      }
      item = {
        recipientName: shipping.name || billing.name || "N/A",
        recipientEmail: email,
        recipientPhone: phone,
        destination: dest,
        size,
        refCode: orderNumber,
        ...(cod > 0 ? { cod } : {}),
        ...(note ? { comment: note } : {}),
      };
    } else if (payload.shipping?.method === "foxpost_home") {
      if (!shipping.zip || !shipping.city || !shipping.address) {
        return NextResponse.json(
          { error: "Hiányos cím (zip/city/address)" },
          { status: 400 }
        );
      }
      item = {
        recipientName: shipping.name || billing.name || "N/A",
        recipientEmail: email,
        recipientPhone: phone,
        recipientZip: String(shipping.zip),
        recipientCity: shipping.city,
        recipientAddress: shipping.address,
        recipientCountry: "HU",
        size,
        refCode: orderNumber,
        ...(cod > 0 ? { cod } : {}),
        ...(note ? { comment: note } : {}),
      };
    } else {
      return NextResponse.json(
        { error: "Unsupported shipping method" },
        { status: 400 }
      );
    }

    const res = await foxpostFetch(`/parcel`, {
      method: "POST",
      body: JSON.stringify([item]),
    });
    const txt = await res.text();
    if (res.status !== 201) {
      return NextResponse.json(
        { error: "Foxpost hiba", status: res.status, body: txt },
        { status: 502 }
      );
    }

    const parsed = (txt ? JSON.parse(txt) : []) as FoxRespItem[] | FoxRespItem;
    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    const parcelId = pickParcelId(first);

    // opcionális mentés a rendelésre
    if (payload.orderId && parcelId) {
/*       await prisma.order.update({
        where: { id: payload.orderId },
        data: { shippingParcelId: parcelId },
      }); */
    }

    return NextResponse.json(first);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Foxpost create error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
