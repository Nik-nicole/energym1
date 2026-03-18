export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SafeQuery from "@/lib/db-safe-query";
import { prisma } from "@/lib/prisma";

// GET - Obtener perfil del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const user = await SafeQuery.query(
      () => prisma.user.findUnique({
        where: { id: session.user.id },
        include: { 
          sede: {
            select: { id: true, nombre: true }
          },
          userPlans: {
            include: {
              plan: true,
            },
          },
        },
      }),
      'user.profile.get'
    );

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar perfil del usuario
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { firstName, lastName, email, sedeId } = await request.json();

    // Validaciones básicas
    if (!firstName || !email) {
      return NextResponse.json(
        { error: "Nombre y email son obligatorios" },
        { status: 400 }
      );
    }

    // Verificar que el email no esté en uso por otro usuario
    const existingUser = await SafeQuery.query(
      () => prisma.user.findFirst({
        where: {
          email,
          id: { not: session.user.id }
        },
      }),
      'user.profile.emailCheck'
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está en uso" },
        { status: 400 }
      );
    }

    // Verificar que la sede existe si se proporciona
    if (sedeId) {
      const sede = await SafeQuery.query(
        () => prisma.sede.findUnique({
          where: { id: sedeId }
        }),
        'user.profile.sedeCheck'
      );

      if (!sede) {
        return NextResponse.json(
          { error: "La sede especificada no existe" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await SafeQuery.query(
      () => prisma.user.update({
        where: { id: session.user.id },
        data: {
          firstName,
          lastName: lastName || null,
          email,
          sedeId: sedeId || null,
        },
        include: {
          sede: {
            select: { id: true, nombre: true }
          },
          userPlans: {
            include: {
              plan: true,
            },
          },
        },
      }),
      'user.profile.update'
    );

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
