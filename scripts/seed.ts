import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Seeding database...");

    // -------------------
    // Crear sedes
    // -------------------
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
        descripcion:
          "Nuestra sede insignia en el norte de Bogotá. Con más de 2000m² de instalaciones de última generación...",
        imagen:
          "https://cdn.abacus.ai/images/223406aa-b7ac-4de5-bd3a-93424a34a9e8.png",
        latitud: 4.7295,
        longitud: -74.0308,
        horario:
          "Lunes a Viernes: 5:00 AM - 10:00 PM | Sábados: 6:00 AM - 8:00 PM | Domingos: 7:00 AM - 4:00 PM",
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
        descripcion:
          "Ubicada estratégicamente en el corazón de Chapinero, nuestra sede Centro combina el diseño industrial moderno con equipamiento de alta tecnología...",
        imagen:
          "https://cdn.abacus.ai/images/15acad2a-d1c0-439e-980e-f71b83dde8da.png",
        latitud: 4.6486,
        longitud: -74.0628,
        horario:
          "Lunes a Viernes: 5:30 AM - 10:00 PM | Sábados: 6:00 AM - 6:00 PM | Domingos: 8:00 AM - 2:00 PM",
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
        descripcion:
          "La sede más espaciosa de nuestra cadena, diseñada pensando en la familia...",
        imagen:
          "https://cdn.abacus.ai/images/77c7a414-7ec9-4b14-aa95-bd957b3202ab.png",
        latitud: 4.6097,
        longitud: -74.1318,
        horario: "Lunes a Viernes: 5:00 AM - 10:00 PM | Sábados y Domingos: 6:00 AM - 8:00 PM",
      },
    });

    console.log("Sedes creadas:", { sedeNorte, sedeCentro, sedeSur });

    // -------------------
    // Crear planes
    // -------------------
    const planesData = [
      {
        id: "plan-basico",
        nombre: "Plan Básico",
        precio: 89000,
        descripcion: "Ideal para comenzar tu camino fitness.",
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
      {
        id: "plan-premium",
        nombre: "Plan Premium",
        precio: 149000,
        descripcion: "Maximiza tus resultados con beneficios adicionales.",
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
      {
        id: "plan-vip",
        nombre: "Plan VIP",
        precio: 249000,
        descripcion: "La experiencia fitness definitiva.",
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
    ];

    const planes = [];
    for (const planData of planesData) {
      const plan = await prisma.plan.upsert({
        where: { id: planData.id },
        update: {},
        create: planData,
      });
      planes.push(plan);
    }

    console.log("Planes creados");

    // -------------------
    // Crear productos
    // -------------------
    const productosData = [
      {
        id: "producto-proteina-whey",
        nombre: "Proteína Whey Premium",
        descripcion: "Proteína de suero de alta calidad para recuperación muscular.",
        precio: 149900,
        categoria: "SUPLEMENTOS",
        stock: 50,
        destacado: true,
        sedeId: sedeNorte.id,
      },
      {
        id: "producto-guantes",
        nombre: "Guantes de Entrenamiento",
        descripcion: "Guantes profesionales con muñequera ajustable.",
        precio: 45900,
        categoria: "ACCESORIOS",
        stock: 30,
        destacado: false,
        sedeId: sedeNorte.id,
      },
      {
        id: "producto-creatina",
        nombre: "Creatina Monohidratada",
        descripcion: "Creatina pura para mejorar fuerza y rendimiento.",
        precio: 89000,
        categoria: "SUPLEMENTOS",
        stock: 25,
        destacado: true,
        sedeId: sedeCentro.id,
      },
      {
        id: "producto-cinta",
        nombre: "Cinta de Correr Profesional",
        descripcion: "Cinta eléctrica con inclinación automática y monitor cardíaco.",
        precio: 2500000,
        categoria: "EQUIPOS",
        stock: 5,
        destacado: true,
        sedeId: sedeCentro.id,
      },
    ];

    const productos = [];
    for (const productoData of productosData) {
      const producto = await prisma.producto.upsert({
        where: { id: productoData.id },
        update: {},
        create: productoData,
      });
      productos.push(producto);
    }

    console.log("Productos creados");

    // -------------------
    // Crear usuarios
    // -------------------
    const hashedAdmin = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.upsert({
      where: { email: "admin@fitzone.com" },
      update: {},
      create: {
        email: "admin@fitzone.com",
        password: hashedAdmin,
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
        sedeId: sedeNorte.id,
      },
    });

    const hashedCliente = await bcrypt.hash("cliente123", 10);
    const cliente = await prisma.user.upsert({
      where: { email: "cliente@fitzone.com" },
      update: {},
      create: {
        email: "cliente@fitzone.com",
        password: hashedCliente,
        firstName: "María",
        lastName: "García",
        role: "CLIENTE",
        sedeId: sedeCentro.id,
      },
    });

    console.log("Usuarios creados:", { admin: admin.email, cliente: cliente.email });

    // -------------------
    // Crear PaymentGateways
    // -------------------
    const gatewayNorte = await prisma.paymentGateway.upsert({
      where: { id: "gateway-norte" },
      update: {},
      create: {
        id: "gateway-norte",
        nombre: "Pasarela Norte",
        tipo: "BANCARIA",
        cuentaBanco: "1234567890",
      },
    });

    const gatewayCentro = await prisma.paymentGateway.upsert({
      where: { id: "gateway-centro" },
      update: {},
      create: {
        id: "gateway-centro",
        nombre: "Pasarela Centro",
        tipo: "BANCARIA",
        cuentaBanco: "9876543210",
      },
    });

    console.log("Payment Gateways creados");

    // -------------------
    // Crear PlanOrders (órdenes de planes)
    // -------------------
    const planOrder1 = await prisma.planOrder.create({
      data: {
        userId: cliente.id,
        planId: planes[0].id,
        sedeId: cliente.sedeId!,
        quantity: 1,
        unitPrice: planes[0].precio,
        totalPrice: planes[0].precio,
        status: "PENDING",
      },
    });

    // -------------------
    // Crear ProductOrders (órdenes de productos)
    // -------------------
    const productOrder1 = await prisma.productOrder.create({
      data: {
        userId: cliente.id,
        productId: productos[0].id,
        sedeId: cliente.sedeId!,
        quantity: 2,
        unitPrice: productos[0].precio,
        totalPrice: productos[0].precio * 2,
        status: "PENDING",
      },
    });

    console.log("Órdenes creadas");

    console.log("Seed completado exitosamente!");
  } catch (error) {
    console.error("Error en seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
