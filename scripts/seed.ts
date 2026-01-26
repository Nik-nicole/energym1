import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Seeding database...");

  // Crear sedes
  const sedeNorte = await prisma.sede.upsert({
    where: { id: "sede-norte" },
    update: {},
    create: {
      id: "sede-norte",
      nombre: "FitZone Norte",
      direccion: "Calle 134 #15-20, Usaquén",
      ciudad: "Bogotá",
      telefono: "+57 601 123 4567",
      email: "norte@fitzone.com",
      descripcion: "Nuestra sede insignia en el norte de Bogotá. Con más de 2000m² de instalaciones de última generación, equipos premium de marcas reconocidas mundialmente y un ambiente exclusivo diseñado para tu máximo rendimiento. Contamos con zona de pesas libre, área de cardio con vista panorámica, estudio de spinning, salones para clases grupales y zona de recuperación con sauna y jacuzzi.",
      imagen: "https://cdn.abacus.ai/images/223406aa-b7ac-4de5-bd3a-93424a34a9e8.png",
      latitud: 4.7295,
      longitud: -74.0308,
      horario: "Lunes a Viernes: 5:00 AM - 10:00 PM | Sábados: 6:00 AM - 8:00 PM | Domingos: 7:00 AM - 4:00 PM",
    },
  });

  const sedeCentro = await prisma.sede.upsert({
    where: { id: "sede-centro" },
    update: {},
    create: {
      id: "sede-centro",
      nombre: "FitZone Centro",
      direccion: "Carrera 7 #32-16, Chapinero",
      ciudad: "Bogotá",
      telefono: "+57 601 234 5678",
      email: "centro@fitzone.com",
      descripcion: "Ubicada estratégicamente en el corazón de Chapinero, nuestra sede Centro combina el diseño industrial moderno con equipamiento de alta tecnología. Perfecta para profesionales que buscan entrenar antes o después del trabajo. Incluye zona CrossFit, área funcional, máquinas de última generación y una cafetería saludable para recargar energías.",
      imagen: "https://cdn.abacus.ai/images/15acad2a-d1c0-439e-980e-f71b83dde8da.png",
      latitud: 4.6486,
      longitud: -74.0628,
      horario: "Lunes a Viernes: 5:30 AM - 10:00 PM | Sábados: 6:00 AM - 6:00 PM | Domingos: 8:00 AM - 2:00 PM",
    },
  });

  const sedeSur = await prisma.sede.upsert({
    where: { id: "sede-sur" },
    update: {},
    create: {
      id: "sede-sur",
      nombre: "FitZone Sur",
      direccion: "Autopista Sur #68-45, Kennedy",
      ciudad: "Bogotá",
      telefono: "+57 601 345 6789",
      email: "sur@fitzone.com",
      descripcion: "La sede más espaciosa de nuestra cadena, diseñada pensando en la familia. Contamos con áreas especializadas para todas las edades, desde programas para adultos mayores hasta entrenamiento juvenil. Amplias zonas de peso libre, piscina semiolímpica climatizada, canchas de squash y parqueadero gratuito para miembros.",
      imagen: "https://cdn.abacus.ai/images/77c7a414-7ec9-4b14-aa95-bd957b3202ab.png",
      latitud: 4.6097,
      longitud: -74.1318,
      horario: "Lunes a Viernes: 5:00 AM - 10:00 PM | Sábados y Domingos: 6:00 AM - 8:00 PM",
    },
  });

  console.log("Sedes creadas:", { sedeNorte, sedeCentro, sedeSur });

  // Crear planes
  const planBasico = await prisma.plan.upsert({
    where: { id: "plan-basico" },
    update: {},
    create: {
      id: "plan-basico",
      nombre: "Plan Básico",
      precio: 89000,
      descripcion: "Ideal para comenzar tu camino fitness. Acceso a una sede con equipamiento completo y horarios flexibles.",
      beneficios: [
        "Acceso a una sede",
        "Zona de cardio y pesas",
        "Evaluación física inicial",
        "Casillero incluido",
        "Acceso a duchas",
      ],
      duracion: "Mensual",
      tipo: "BASICO",
      esVip: false,
      activo: true,
      destacado: false,
      orden: 1,
    },
  });

  const planPremium = await prisma.plan.upsert({
    where: { id: "plan-premium" },
    update: {},
    create: {
      id: "plan-premium",
      nombre: "Plan Premium",
      precio: 149000,
      descripcion: "Maximiza tus resultados con beneficios adicionales y clases grupales ilimitadas en tu sede.",
      beneficios: [
        "Acceso a una sede",
        "Clases grupales ilimitadas",
        "Acceso a zona wellness (sauna)",
        "1 sesión de nutricionista",
        "Programa de entrenamiento personalizado",
        "Toalla incluida",
        "Descuentos en tienda",
      ],
      duracion: "Mensual",
      tipo: "PREMIUM",
      esVip: false,
      activo: true,
      destacado: true,
      orden: 2,
    },
  });

  const planVip = await prisma.plan.upsert({
    where: { id: "plan-vip" },
    update: {},
    create: {
      id: "plan-vip",
      nombre: "Plan VIP",
      precio: 249000,
      descripcion: "La experiencia fitness definitiva. Acceso total a todas las sedes FitZone y beneficios exclusivos.",
      beneficios: [
        "Acceso a TODAS las sedes",
        "Clases grupales ilimitadas",
        "Acceso completo zona wellness",
        "2 sesiones de nutricionista al mes",
        "4 sesiones de entrenador personal",
        "Estacionamiento gratuito",
        "Invitados gratis (2 al mes)",
        "Acceso prioritario a eventos",
        "Kit de bienvenida premium",
      ],
      duracion: "Mensual",
      tipo: "VIP",
      esVip: true,
      activo: true,
      destacado: true,
      orden: 3,
    },
  });

  const planAnual = await prisma.plan.upsert({
    where: { id: "plan-anual" },
    update: {},
    create: {
      id: "plan-anual",
      nombre: "Plan Anual",
      precio: 799000,
      descripcion: "Compromiso de un año con beneficios premium. Ahorra más del 30% comparado con pagos mensuales.",
      beneficios: [
        "Acceso a todas las sedes",
        "Clases grupales ilimitadas",
        "Acceso zona wellness completa",
        "6 sesiones de nutricionista",
        "Evaluaciones trimestrales",
        "2 meses gratis incluidos",
        "Congelamiento de membresía (30 días)",
      ],
      duracion: "Anual",
      tipo: "ANUAL",
      esVip: true,
      activo: true,
      destacado: false,
      orden: 4,
    },
  });

  console.log("Planes creados");

  // Relacionar planes con sedes
  const allSedes = [sedeNorte, sedeCentro, sedeSur];
  
  // Plan básico y premium disponibles en todas las sedes
  for (const sede of allSedes) {
    await prisma.planSede.upsert({
      where: { planId_sedeId: { planId: planBasico.id, sedeId: sede.id } },
      update: {},
      create: { planId: planBasico.id, sedeId: sede.id },
    });
    await prisma.planSede.upsert({
      where: { planId_sedeId: { planId: planPremium.id, sedeId: sede.id } },
      update: {},
      create: { planId: planPremium.id, sedeId: sede.id },
    });
    await prisma.planSede.upsert({
      where: { planId_sedeId: { planId: planVip.id, sedeId: sede.id } },
      update: {},
      create: { planId: planVip.id, sedeId: sede.id },
    });
    await prisma.planSede.upsert({
      where: { planId_sedeId: { planId: planAnual.id, sedeId: sede.id } },
      update: {},
      create: { planId: planAnual.id, sedeId: sede.id },
    });
  }

  console.log("Relaciones plan-sede creadas");

  // Crear noticias y promociones
  await prisma.noticia.upsert({
    where: { id: "noticia-1" },
    update: {},
    create: {
      id: "noticia-1",
      titulo: "¡Gran Inauguración de Nuevos Equipos!",
      contenido: "Estamos emocionados de anunciar la llegada de equipamiento de última generación a todas nuestras sedes. Nuevas máquinas de cardio con pantallas táctiles, zona de peso libre ampliada y equipos de entrenamiento funcional de marcas líderes como Technogym y Life Fitness. ¡Ven a probarlos!",
      resumen: "Nuevos equipos de última generación en todas las sedes.",
      imagen: "https://cdn.abacus.ai/images/e18280c8-9fba-4533-ad8d-19ff9e8ceb48.png",
      sedeId: null,
      esPromocion: false,
      activo: true,
      destacado: true,
    },
  });

  await prisma.noticia.upsert({
    where: { id: "noticia-2" },
    update: {},
    create: {
      id: "noticia-2",
      titulo: "Promoción de Verano: 50% OFF en Inscripción",
      contenido: "Durante todo enero y febrero, obtén un 50% de descuento en tu inscripción inicial en cualquiera de nuestros planes. Además, al inscribirte en el Plan Premium o VIP, recibirás un kit de bienvenida valorado en $150.000 completamente gratis. ¡No te pierdas esta oportunidad de transformar tu vida!",
      resumen: "50% de descuento en inscripción durante enero y febrero.",
      imagen: "https://cdn.abacus.ai/images/d81a14de-28ab-4440-997b-6246f5f8be45.png",
      sedeId: null,
      esPromocion: true,
      fechaInicio: new Date("2026-01-01"),
      fechaFin: new Date("2026-02-28"),
      activo: true,
      destacado: true,
    },
  });

  await prisma.noticia.upsert({
    where: { id: "noticia-3" },
    update: {},
    create: {
      id: "noticia-3",
      titulo: "Nuevas Clases de Spinning en Sede Norte",
      contenido: "Inauguramos nuestra nueva sala de spinning con 40 bicicletas de última generación y sistema de sonido envolvente. Clases disponibles de lunes a sábado con instructores certificados internacionalmente. Reserva tu lugar a través de nuestra app.",
      resumen: "Nueva sala de spinning con 40 bicicletas premium.",
      imagen: "https://cdn.abacus.ai/images/223406aa-b7ac-4de5-bd3a-93424a34a9e8.png",
      sedeId: "sede-norte",
      esPromocion: false,
      activo: true,
      destacado: false,
    },
  });

  await prisma.noticia.upsert({
    where: { id: "noticia-4" },
    update: {},
    create: {
      id: "noticia-4",
      titulo: "Reto FitZone 90 Días",
      contenido: "¿Estás listo para el desafío? Únete a nuestro programa de transformación de 90 días. Incluye seguimiento personalizado, plan nutricional, sesiones con entrenador y acceso a nuestra comunidad exclusiva. Los mejores resultados ganarán premios increíbles incluyendo membresía VIP por un año.",
      resumen: "Programa de transformación con premios increíbles.",
      imagen: "https://cdn.abacus.ai/images/d9570e29-20cc-4090-b76d-62f460a6b818.png",
      sedeId: null,
      esPromocion: true,
      fechaInicio: new Date("2026-02-01"),
      fechaFin: new Date("2026-04-30"),
      activo: true,
      destacado: true,
    },
  });

  await prisma.noticia.upsert({
    where: { id: "noticia-5" },
    update: {},
    create: {
      id: "noticia-5",
      titulo: "Clases de Yoga al Aire Libre - Sede Sur",
      contenido: "Todos los domingos a las 7:00 AM, disfruta de nuestras clases de yoga en el jardín de la sede Sur. Conecta con la naturaleza mientras trabajas tu flexibilidad y bienestar mental. Clase gratuita para todos los miembros.",
      resumen: "Yoga gratuito los domingos para miembros.",
      imagen: "https://cdn.abacus.ai/images/77c7a414-7ec9-4b14-aa95-bd957b3202ab.png",
      sedeId: "sede-sur",
      esPromocion: false,
      activo: true,
      destacado: false,
    },
  });

  console.log("Noticias creadas");

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash("johndoe123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "john@doe.com" },
    update: {},
    create: {
      email: "john@doe.com",
      password: hashedPassword,
      firstName: "John",
      lastName: "Doe",
      role: "ADMIN",
      sedeId: "sede-norte",
    },
  });

  console.log("Usuario admin creado:", adminUser.email);

  // Crear usuario cliente de ejemplo
  const clientPassword = await bcrypt.hash("cliente123", 10);
  const clientUser = await prisma.user.upsert({
    where: { email: "cliente@ejemplo.com" },
    update: {},
    create: {
      email: "cliente@ejemplo.com",
      password: clientPassword,
      firstName: "María",
      lastName: "García",
      role: "CLIENTE",
      sedeId: "sede-centro",
    },
  });

  console.log("Usuario cliente creado:", clientUser.email);

  // Crear productos de ejemplo
  const productos = [
    {
      nombre: "Proteína Whey Premium",
      descripcion: "Proteína de suero de alta calidad para recuperación muscular. Sabor vainilla, 2kg.",
      precio: 149900,
      categoria: "SUPLEMENTOS",
      stock: 50,
      destacado: true,
      sedeId: sedeNorte.id,
    },
    {
      nombre: "Guantes de Entrenamiento",
      descripcion: "Guantes profesionales con muñequera ajustable. Perfectos para levantamiento de pesas.",
      precio: 45900,
      categoria: "ACCESORIOS",
      stock: 30,
      destacado: false,
      sedeId: sedeNorte.id,
    },
    {
      nombre: "Creatina Monohidratada",
      descripcion: "Creatina pura para mejorar fuerza y rendimiento. 300g.",
      precio: 89000,
      categoria: "SUPLEMENTOS",
      stock: 25,
      destacado: true,
      sedeId: sedeCentro.id,
    },
    {
      nombre: "Cinta de Correr Profesional",
      descripcion: "Cinta eléctrica con inclinación automática y monitor cardíaco.",
      precio: 2500000,
      categoria: "EQUIPOS",
      stock: 5,
      destacado: true,
      sedeId: sedeCentro.id,
    },
    {
      nombre: "Shaker Proteico",
      descripcion: "Shaker de 700ml con esfera mezcladora. Diseño ergonómico.",
      precio: 25000,
      categoria: "ACCESORIOS",
      stock: 100,
      destacado: false,
      sedeId: sedeSur.id,
    },
    {
      nombre: "Mancuernas Ajustables",
      descripcion: "Set de mancuernas ajustables de 2.5kg a 25kg. Incluye rack.",
      precio: 890000,
      categoria: "EQUIPOS",
      stock: 10,
      destacado: true,
      sedeId: sedeSur.id,
    }
  ];

  for (const producto of productos) {
    await prisma.producto.create({
      data: producto,
    });
  }

  console.log("Productos creados");
  console.log("Seeding completado exitosamente!");
  } catch (error) {
  console.error("Error en seed:", error);
  throw error;
} finally {
  await prisma.$disconnect();
}
}

main();
