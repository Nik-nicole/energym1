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

    // Detectar si es HEIC/HEIF y convertir a JPEG
    const isHeicByExtension = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    const isHeicOrHeif = file.type === 'image/heic' || 
                        file.type === 'image/heif' || 
                        file.type.includes('heic') || 
                        file.type.includes('heif') ||
                        (isHeicByExtension && file.type === 'application/octet-stream');

    if (isHeicOrHeif) {
      console.log(`Convirtiendo imagen HEIC/HEIF a JPEG: ${file.name}`);
      
      try {
        // Convertir HEIC/HEIF a JPEG usando sharp
        buffer = await sharp(buffer)
          .jpeg({ quality: 90 })
          .toBuffer();
        
        console.log(`Conversión exitosa: ${file.name} -> JPEG`);
      } catch (conversionError) {
        console.error('Error al convertir HEIC/HEIF a JPEG:', conversionError);
        throw new Error('Error al convertir el formato HEIC/HEIF a JPEG');
      }
    }

    // Subir a Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          max_file_size: 10000000, // 10MB
          transformation: [
            { width: 800, height: 600, crop: 'limit', quality: 'auto' },
            { fetch_format: 'auto' }
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
