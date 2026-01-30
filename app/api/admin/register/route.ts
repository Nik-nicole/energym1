export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, sedeId, adminKey } = body ?? {};

    // Verificar clave de administrador (seguridad adicional)
    const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "fitzone_admin_2026";
    
    if (adminKey !== ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: "Clave de administrador inválida" },
        { status: 403 }
      );
    }

    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: "Email, contraseña y nombre son requeridos" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName: lastName ?? null,
        sedeId: sedeId ?? null,
        role: "ADMIN",
      },
    });

    return NextResponse.json(
      {
        message: "Usuario admin creado exitosamente",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en admin register:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
