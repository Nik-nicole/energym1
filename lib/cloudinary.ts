import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

// Función para subir imágenes
export async function uploadImage(file: File, folder: string = 'fitzone/marketplace') {
  try {
    // Convertir File a Buffer
    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    // Detectar si es HEIC/HEIF
    const isHeicByExtension = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    const isHeicOrHeif = file.type === 'image/heic' || 
                        file.type === 'image/heif' || 
                        file.type.includes('heic') || 
                        file.type.includes('heif') ||
                        (isHeicByExtension && file.type === 'application/octet-stream');

    // Convertir TODOS los formatos a WebP
    try {
      let imageFormat = file.type || 'image/jpeg';
      if (isHeicOrHeif) {
        console.log(`Convirtiendo imagen HEIC/HEIF a WebP: ${file.name}`);
      } else if (file.name.toLowerCase().endsWith('.avif')) {
        console.log(`Convirtiendo imagen AVIF a WebP: ${file.name}`);
      } else {
        console.log(`Convirtiendo imagen ${file.name} a WebP`);
      }
      
      // Convertir a WebP con sharp
      buffer = await sharp(buffer)
        .webp({ quality: 85, alphaQuality: 100 })
        .toBuffer();
      
      console.log(`Conversión exitosa: ${file.name} -> WebP`);
    } catch (conversionError) {
      console.error('Error al convertir imagen a WebP:', conversionError);
      // Si falla la conversión a WebP, intentar al menos procesar la imagen con sharp
      try {
        buffer = await sharp(buffer)
          .toBuffer();
        console.log(`Procesada imagen con sharp (sin conversión): ${file.name}`);
      } catch (fallbackError) {
        console.error('Error en fallback de procesamiento:', fallbackError);
        throw new Error('Error al procesar la imagen');
      }
    }

    // Subir a Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          format: 'webp', // Forzar formato WebP
          allowed_formats: ['webp', 'jpg', 'jpeg', 'png'],
          max_file_size: 10000000, // 10MB
          transformation: [
            { width: 800, height: 600, crop: 'limit', quality: 'auto' },
            { fetch_format: 'webp' } // Servir siempre en WebP
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return result as any;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Error al subir la imagen');
  }
}

// Función para eliminar imágenes
export async function deleteImage(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Error al eliminar la imagen');
  }
}

// Función para generar firma para upload directo
export function generateSignature(params: any) {
  return cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
}
