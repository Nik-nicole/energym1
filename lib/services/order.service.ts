import { prisma } from '../prisma';
import { userQueries } from '../query-helpers';
import { PrismaWrapper } from '../connection-wrapper';
import { BoldService } from '../bold';
import { PlanService } from './plan.service';
import { SedeService } from './sede.service';

export class OrderService {
  static async createPlanOrder(userId: string, orderData: {
    planId: string;
    sedeId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    paymentInfo: any;
  }) {
    const { planId, sedeId, quantity, unitPrice, totalPrice, paymentInfo } = orderData;

    // Validar que el plan exista y esté activo
    const plan = await PlanService.getPlanById(planId);
    if (!plan || !plan.activo) {
      throw new Error('Plan no disponible');
    }

    // Validar que la sede exista y esté activa
    const sede = await SedeService.getSedeWithPaymentGateway(sedeId);
    if (!sede || !sede.paymentGateway) {
      throw new Error('Sede no disponible o sin pasarela de pago configurada');
    }

    // Validar que el plan esté disponible en esta sede
    const isPlanAvailableInSede = await PlanService.validatePlanInSede(planId, sedeId);
    if (!isPlanAvailableInSede) {
      throw new Error('Plan no disponible en esta sede');
    }

    // Verificar si el usuario puede comprar un nuevo plan (no tiene planes activos o congelados)
    const canPurchase = await PlanService.canUserPurchaseNewPlan(userId);
    if (!canPurchase) {
      throw new Error('No puedes comprar un nuevo plan mientras tengas un plan activo o congelado');
    }

    // Generar referencia para BOLD
    const reference = BoldService.generateReference('PLAN');

    // Obtener API Key de BOLD desde la configuración de la sede
    const envVarName = sede.paymentGateway.cuentaBanco;
    const boldApiKey = envVarName ? process.env[envVarName] : null;
    
    if (!boldApiKey) {
      throw new Error('Configuración de pago incompleta - API Key de BOLD no configurada');
    }

    // Preparar callback URL
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://energym1-five.vercel.app';
    const callbackUrl = `${origin}/pago/confirmacion/bold?planOrderId=${reference}`;

    // Crear link de pago con BOLD
    const boldResponse = await BoldService.createPaymentLink({
      amount: totalPrice,
      currency: 'COP',
      reference,
      description: `Plan ${plan.nombre} - Energym`,
      callbackUrl,
      apiKey: boldApiKey,
      imageUrl: `${origin}/logo.png`
    });

    if (!boldResponse.success) {
      throw new Error(`Error en el procesamiento del pago: ${boldResponse.message}`);
    }

    // Crear el registro de pago con estado PENDING
    const payment = await PrismaWrapper.execute(
      () => prisma.payment.create({
        data: {
          sedeId: sede.id,
          amount: totalPrice,
          paymentMethod: paymentInfo.method,
          status: 'PENDING',
          transactionId: boldResponse.reference,
          gatewayResponse: JSON.parse(JSON.stringify(boldResponse))
        }
      }),
      3
    );

    // Crear la orden del plan con estado PENDING y asociada al pago
    const planOrder = await PrismaWrapper.execute(
      () => prisma.planOrder.create({
        data: {
          userId,
          planId: plan.id,
          sedeId: sede.id,
          paymentId: payment.id,
          quantity: quantity || 1,
          unitPrice,
          totalPrice,
          status: 'PENDING'
        },
        include: {
          plan: true,
          sede: true,
          payment: true
        }
      }),
      3
    );

    // Enviar email de confirmación (simulado)
    console.log(`Email de confirmación enviado para el plan ${plan.nombre} - Payment URL: ${boldResponse.paymentUrl}`);

    return {
      success: true,
      order: planOrder,
      payment: boldResponse,
      paymentUrl: boldResponse.paymentUrl,
      message: "Pago iniciado exitosamente. Redirige al usuario a la URL de pago."
    };
  }

  static async createProductOrder(userId: string, orderData: {
    productId: string;
    sedeId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    paymentInfo: any;
  }) {
    const { productId, sedeId, quantity, unitPrice, totalPrice, paymentInfo } = orderData;

    // Validar que el producto exista y esté activo
    const product = await PrismaWrapper.execute(
      () => prisma.producto.findUnique({
        where: { id: productId }
      }),
      3
    );

    if (!product || !product.activo) {
      throw new Error('Producto no disponible');
    }

    // Validar que la sede exista y tenga payment gateway
    const sede = await SedeService.getSedeWithPaymentGateway(sedeId);
    if (!sede || !sede.paymentGateway) {
      throw new Error('Sede no disponible o sin pasarela de pago configurada');
    }

    // Validar stock
    if (product.stock < quantity) {
      throw new Error('Stock insuficiente');
    }

    // Generar referencia para BOLD
    const reference = BoldService.generateReference('PROD');

    // Obtener API Key de BOLD desde la configuración de la sede
    const envVarName = sede.paymentGateway.cuentaBanco;
    const boldApiKey = envVarName ? process.env[envVarName] : null;
    
    if (!boldApiKey) {
      throw new Error('Configuración de pago incompleta - API Key de BOLD no configurada');
    }

    // Preparar callback URL
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://energym1-five.vercel.app';
    const callbackUrl = `${origin}/pago/confirmacion/bold-product?productOrderId=${reference}`;

    // Calcular IVA para productos
    const subtotal = totalPrice;
    const ivaRate = 0.19;
    const ivaAmount = Math.round(subtotal * ivaRate);
    const totalAmount = Math.round(subtotal * (1 + ivaRate));

    // Crear link de pago con BOLD
    const boldResponse = await BoldService.createPaymentLink({
      amount: totalAmount,
      currency: 'COP',
      reference,
      description: `${product.nombre} (x${quantity}) - Energym`,
      callbackUrl,
      apiKey: boldApiKey,
      imageUrl: product.imagen ? product.imagen.split(',')[0].trim() : `${origin}/logo.png`,
      taxes: [
        {
          type: 'VAT',
          base: subtotal,
          value: ivaAmount,
        },
      ],
    });

    if (!boldResponse.success) {
      throw new Error(`Error en el procesamiento del pago: ${boldResponse.message}`);
    }

    // Crear el registro de pago con estado PENDING
    const payment = await PrismaWrapper.execute(
      () => prisma.payment.create({
        data: {
          sedeId: sede.id,
          amount: totalAmount, // Usar el total con IVA para productos
          paymentMethod: paymentInfo.method,
          status: 'PENDING',
          transactionId: boldResponse.reference,
          gatewayResponse: JSON.parse(JSON.stringify(boldResponse))
        }
      }),
      3
    );

    // Crear la orden del producto con estado PENDING y asociada al pago
    const productOrder = await PrismaWrapper.execute(
      () => prisma.productOrder.create({
        data: {
          userId,
          productId: product.id,
          sedeId: sede.id,
          paymentId: payment.id,
          quantity,
          unitPrice,
          totalPrice: totalAmount, // Guardar el total con IVA
          status: 'PENDING'
        },
        include: {
          product: true,
          sede: true,
          payment: true
        }
      }),
      3
    );

    // Enviar email de confirmación (simulado)
    console.log(`Email de confirmación enviado para el producto ${product.nombre} - Payment URL: ${boldResponse.paymentUrl}`);

    return {
      success: true,
      order: productOrder,
      payment: boldResponse,
      paymentUrl: boldResponse.paymentUrl,
      message: "Pago iniciado exitosamente. Redirige al usuario a la URL de pago."
    };
  }

  static async getUserOrders(userId: string) {
    const [productOrders, planOrders] = await Promise.all([
      PrismaWrapper.execute(
        () => prisma.productOrder.findMany({
          where: { userId },
          include: {
            product: true,
            sede: true,
            payment: true
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }),
        3
      ),
      PrismaWrapper.execute(
        () => prisma.planOrder.findMany({
          where: { userId },
          include: {
            plan: true,
            sede: true,
            payment: true
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }),
        3
      )
    ]);

    return {
      productOrders,
      planOrders,
      allOrders: [...productOrders, ...planOrders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    };
  }

  static async getOrderById(orderId: string, type: 'product' | 'plan') {
    if (type === 'product') {
      return await PrismaWrapper.execute(
        () => prisma.productOrder.findUnique({
          where: { id: orderId },
          include: {
            product: true,
            sede: true,
            payment: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }),
        3
      );
    } else {
      return await PrismaWrapper.execute(
        () => prisma.planOrder.findUnique({
          where: { id: orderId },
          include: {
            plan: true,
            sede: true,
            payment: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }),
        3
      );
    }
  }

  static async updateOrderStatus(orderId: string, status: string, type: 'product' | 'plan') {
    if (type === 'product') {
      return await PrismaWrapper.execute(
        () => prisma.productOrder.update({
          where: { id: orderId },
          data: { status }
        }),
        3
      );
    } else {
      return await PrismaWrapper.execute(
        () => prisma.planOrder.update({
          where: { id: orderId },
          data: { status }
        }),
        3
      );
    }
  }
}
