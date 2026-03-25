// Script para verificar configuración de Cloudinary
const cloudinary = require('cloudinary').v2;

// Intentar configurar Cloudinary
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  console.log('✅ Configuración de Cloudinary:');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Configurado' : '❌ No configurado');
  console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Configurado' : '❌ No configurado');
  console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Configurado' : '❌ No configurado');
  
  // Probar conexión
  cloudinary.api.ping((error, result) => {
    if (error) {
      console.error('❌ Error de conexión con Cloudinary:', error);
    } else {
      console.log('✅ Conexión exitosa con Cloudinary:', result);
    }
  });
  
} catch (error) {
  console.error('❌ Error configurando Cloudinary:', error);
}
