import prisma from "@/lib/db";
import { AdminLayout } from "../_components/admin-layout";
import { AdminProfile } from "./_components/admin-profile";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getAdminData() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return null;
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      return null;
    }

    return {
      admin: {
        ...admin,
        createdAt: admin.createdAt.toISOString(),
        updatedAt: admin.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error fetching admin data:", error);
    return null;
  }
}

export default async function AdminProfilePage() {
  const data = await getAdminData();

  if (!data) {
    notFound();
  }

  return (
    <AdminLayout>
      <AdminProfile admin={data.admin} />
    </AdminLayout>
  );
}
