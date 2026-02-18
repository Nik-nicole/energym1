import prisma from "@/lib/db";
import { AdminLayout } from "../../_components/admin-layout";
import { OrdenesPlanesAdmin } from "./_components/ordenes-planes-admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getOrdenesPlanesData() {
  try {
    const planOrders = await prisma.planOrder.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        plan: {
          select: {
            id: true,
            nombre: true,
            precio: true,
            duracion: true,
            tipo: true,
            esVip: true,
          },
        },
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limitar a las últimas 100 órdenes
    });

    return { planOrders };
  } catch (error) {
    console.error("Error fetching plan orders:", error);
    return null;
  }
}

export default async function OrdenesPlanesPage() {
  const data = await getOrdenesPlanesData();

  if (!data) {
    notFound();
  }

  return (
    <AdminLayout>
      <OrdenesPlanesAdmin planOrders={data.planOrders} />
    </AdminLayout>
  );
}
