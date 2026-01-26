export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Solo JPG, PNG y WebP" },
        { status: 400 }
      );
    }

    // Validar tamaño (3MB para imágenes de perfil)
    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. Máximo 3MB" },
        { status: 400 }
      );
    }

    // Obtener imagen actual del usuario para eliminarla
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });

    // Subir nueva imagen
    const result = await uploadImage(file, 'fitzone/profiles');

    // Eliminar imagen anterior si existe
    if (currentUser?.image) {
      try {
        const { deleteImage } = await import("@/lib/cloudinary");
        // Extraer public_id de la URL
        const urlParts = currentUser.image.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        if (publicId) {
          await deleteImage(`fitzone/profiles/${publicId}`);
        }
      } catch (error) {
        console.error("Error deleting old profile image:", error);
        // No fallar si no se puede eliminar la imagen anterior
      }
    }

    // Actualizar imagen del usuario en la base de datos
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: result.secure_url },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
        role: true,
        sede: {
          select: { id: true, nombre: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      imageUrl: result.secure_url,
    });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return NextResponse.json(
      { error: "Error al subir la imagen de perfil" },
      { status: 500 }
    );
  }
}
