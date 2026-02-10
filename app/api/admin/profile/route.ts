import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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
      return NextResponse.json(
        { error: "Administrador no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...admin,
      createdAt: admin.createdAt.toISOString(),
      updatedAt: admin.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return NextResponse.json(
      { error: "Error al obtener perfil" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      currentPassword,
      newPassword,
      confirmPassword,
    } = body;

    if (!firstName || !email) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Check if new password is provided
    if (newPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Las contraseñas no coinciden" },
        { status: 400 }
      );
    }

    // If changing password, verify current password
    if (newPassword && !currentPassword) {
      return NextResponse.json(
        { error: "Debes proporcionar la contraseña actual" },
        { status: 400 }
      );
    }

    // Get current admin data
    const currentAdmin = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentAdmin) {
      return NextResponse.json(
        { error: "Administrador no encontrado" },
        { status: 404 }
      );
    }

    // Verify current password if changing password
    if (newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, currentAdmin.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Contraseña actual incorrecta" },
          { status: 400 }
        );
      }
    }

    // Check if email is already taken by another user
    if (email !== currentAdmin.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: session.user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "El email ya está en uso" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      firstName,
      lastName,
      email,
    };

    // Add new password if provided
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    // Update admin
    const updatedAdmin = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
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

    return NextResponse.json({
      ...updatedAdmin,
      createdAt: updatedAdmin.createdAt.toISOString(),
      updatedAt: updatedAdmin.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return NextResponse.json(
      { error: "Error al actualizar perfil" },
      { status: 500 }
    );
  }
}
