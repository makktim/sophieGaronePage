import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Rendelések</h1>
      <div className="border rounded-md overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Total (HUF)</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Items</th>
              <th className="text-left p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b align-top">
                <td className="p-3">{o.id}</td>
                <td className="p-3">{o.userEmail}</td>
                <td className="p-3">{o.totalHUF.toLocaleString("hu-HU")}</td>
                <td className="p-3">{o.status}</td>
                <td className="p-3">
                  <ul className="list-disc ml-5">
                    {o.items.map((it) => (
                      <li key={it.id}>
                        {it.product.title} × {it.qty} —{" "}
                        {it.priceHUF.toLocaleString("hu-HU")} Ft
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="p-3">
                  {new Date(o.createdAt).toLocaleString("hu-HU")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
