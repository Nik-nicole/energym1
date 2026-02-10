import { prisma } from "@/lib/db";
import { AdminLayout } from "../_components/admin-layout";
import { TiendaAdmin } from "./_components/tienda-admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getTiendaData() {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const sedes = await prisma.sede.findMany({
      select: {
        id: true,
        nombre: true,
      },
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });

    // Obtener datos de órdenes
    let orderItems = [];
    try {
      orderItems = await prisma.orderItem.findMany({
        include: {
          product: {
            select: {
              id: true,
              nombre: true,
              imagen: true,
            },
          },
          order: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100, // Limitar a las últimas 100 órdenes
      });
    } catch (error) {
      console.error("Error fetching order items:", error);
      orderItems = [];
    }

    return { productos, sedes, orderItems };
  } catch (error) {
    console.error("Error fetching tienda data:", error);
    return null;
  }
}

export default async function TiendaPage() {
  const data = await getTiendaData();

  if (!data) {
    notFound();
  }

  return (
    <AdminLayout>
      <TiendaAdmin productos={data.productos} sedes={data.sedes} orderItems={data.orderItems} />
    </AdminLayout>
  );
}
