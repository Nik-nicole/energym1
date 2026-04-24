export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.error("Upload: No autorizado - sesión inválida");
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar si es admin
    if (session.user.role !== "ADMIN") {
      console.error("Upload: No autorizado - usuario no es admin:", session.user.role);
      return NextResponse.json(
        { error: "Solo administradores pueden subir imágenes" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error("Upload: No se proporcionó archivo");
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'];
    
    // Para HEIC/HEIF, también validar por extensión ya que algunos navegadores los detectan como octet-stream
    const isHeicByExtension = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    const isValidType = allowedTypes.includes(file.type) || 
                       file.type.includes('heic') || 
                       file.type.includes('heif') ||
                       (isHeicByExtension && file.type === 'application/octet-stream');
    
    if (!isValidType) {
      console.error("Upload: Tipo de archivo no permitido:", file.type);
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Solo JPG, PNG, WebP, AVIF, HEIC y HEIF" },
        { status: 400 }
      );
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error("Upload: Archivo demasiado grande:", file.size);
      return NextResponse.json(
        { error: "El archivo es demasiado grande. Máximo 10MB" },
        { status: 400 }
      );
    }

    console.log("Upload recibido:", file.name, file.type, file.size);

    // Verificar configuración de Cloudinary
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("Upload: Configuración de Cloudinary incompleta");
      return NextResponse.json(
        { error: "Error de configuración del servidor" },
        { status: 500 }
      );
    }

    // Subir imagen a Cloudinary
    const result = await uploadImage(file, 'fitzone/sedes');
    
    console.log("Upload exitoso:", result.public_id, result.secure_url);

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Error al subir la imagen", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Solo administradores pueden eliminar imágenes" },
        { status: 403 }
      );
    }

    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: "No se proporcionó el publicId" },
        { status: 400 }
      );
    }

    const { deleteImage } = await import("@/lib/cloudinary");
    const result = await deleteImage(publicId);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Error al eliminar la imagen" },
      { status: 500 }
    );
  }
}
