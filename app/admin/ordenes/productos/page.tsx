import prisma from "@/lib/db";
import { AdminLayout } from "../../_components/admin-layout";
import { OrdenesProductosAdmin } from "./_components/ordenes-productos-admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getOrdenesProductosData() {
  try {
    const productOrders = await prisma.productOrder.findMany({
      select: {
        id: true,
        userId: true,
        productId: true,
        sedeId: true,
        quantity: true,
        unitPrice: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
            precio: true,
            imagen: true,
            descripcion: true,
          },
        },
        sede: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            ciudad: true,
            telefono: true,
            email: true,
            paymentGateway: {
              select: {
                cuentaBanco: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            paymentMethod: true,
            status: true,
            amount: true,
            transactionId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Reducir a 50 para mayor velocidad
    });

    return { productOrders };
  } catch (error) {
    console.error("Error fetching product orders:", error);
    return null;
  }
}

export default async function OrdenesProductosPage() {
  const data = await getOrdenesProductosData();

  if (!data) {
    notFound();
  }

  return (
    <AdminLayout>
      <OrdenesProductosAdmin productOrders={data.productOrders} />
    </AdminLayout>
  );
}
