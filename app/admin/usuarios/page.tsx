import { prisma } from "@/lib/db";
import { AdminLayout } from "../_components/admin-layout";
import { UsuariosAdmin } from "./_components/usuarios-admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getUsersData() {
  try {
    const users = await prisma.user.findMany({
      include: {
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
        _count: {
          select: {
            orders: true,
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

    const plans = await prisma.plan.findMany({
      select: {
        id: true,
        nombre: true,
        precio: true,
        duracion: true,
      },
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });

    return { users, sedes, plans };
  } catch (error) {
    console.error("Error fetching users:", error);
    return null;
  }
}

export default async function UsuariosPage() {
  const data = await getUsersData();

  if (!data) {
    notFound();
  }

  return (
    <AdminLayout>
      <UsuariosAdmin users={data.users} sedes={data.sedes} plans={data.plans} />
    </AdminLayout>
  );
}
