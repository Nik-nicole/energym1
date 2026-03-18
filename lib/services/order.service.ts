import { prisma } from '../prisma';
import { userQueries } from '../query-helpers';
import { PrismaWrapper } from '../connection-wrapper';
import { WompiService } from '../wompi';
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
    if (!sede) {
      throw new Error('Sede no disponible');
    }

    // Validar que el plan esté disponible en esta sede
    const isPlanAvailableInSede = await PlanService.validatePlanInSede(planId, sedeId);
    if (!isPlanAvailableInSede) {
      throw new Error('Plan no disponible en esta sede');
    }

    // Verificar si el usuario ya tiene este plan activo
    const existingUserPlan = await PlanService.getPlanActivo(userId);
    if (existingUserPlan && existingUserPlan.planId === planId) {
      throw new Error('Ya tienes este plan activo');
    }

    // Generar reference para Wompi
    const reference = WompiService.generateReference();

    // Procesar pago con Wompi
    const wompiResponse = await WompiService.processPayment({
      amount: totalPrice,
      currency: 'COP',
      customerEmail: paymentInfo.email,
      paymentMethod: paymentInfo.method,
      ...(paymentInfo.method === 'card' && {
        cardInfo: {
          number: paymentInfo.cardNumber || '4242424242424242',
          name: paymentInfo.cardName || 'Test User',
          expiry: paymentInfo.cardExpiry || '12/25',
          cvc: paymentInfo.cardCvc || '123'
        }
      }),
      ...(paymentInfo.method === 'pse' && {
        pseInfo: {
          documentType: paymentInfo.documentType,
          documentNumber: paymentInfo.documentNumber
        }
      }),
      reference
    });

    if (!wompiResponse.success) {
      throw new Error(`Error en el procesamiento del pago: ${wompiResponse.message}`);
    }

    // Crear el registro de pago
    const payment = await PrismaWrapper.execute(
      () => prisma.payment.create({
        data: {
          sedeId: sede.id,
          amount: totalPrice,
          paymentMethod: paymentInfo.method,
          status: 'COMPLETED',
          transactionId: wompiResponse.transactionId,
          gatewayResponse: JSON.parse(JSON.stringify(wompiResponse))
        }
      }),
      3
    );

    // Crear la orden del plan
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
          status: 'PAID'
        },
        include: {
          plan: true,
          sede: true,
          payment: true
        }
      }),
      3
    );

    // Activar el plan para el usuario
    const userPlan = await PlanService.activatePlanForUser(userId, plan.id, payment.id);

    // Enviar email de confirmación (simulado)
    console.log(`Email de confirmación enviado para el plan ${plan.nombre}`);

    return {
      success: true,
      order: planOrder,
      userPlan: {
        planId: plan.id,
        startDate: userPlan.startDate,
        endDate: userPlan.endDate,
        isActive: userPlan.isActive
      },
      payment: wompiResponse,
      message: "Plan activado exitosamente"
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

    // Validar que la sede exista
    const sede = await SedeService.getSedeWithPaymentGateway(sedeId);
    if (!sede) {
      throw new Error('Sede no disponible');
    }

    // Validar stock
    if (product.stock < quantity) {
      throw new Error('Stock insuficiente');
    }

    // Generar reference para Wompi
    const reference = WompiService.generateReference();

    // Procesar pago con Wompi
    const wompiResponse = await WompiService.processPayment({
      amount: totalPrice,
      currency: 'COP',
      customerEmail: paymentInfo.email,
      paymentMethod: paymentInfo.method,
      reference
    });

    if (!wompiResponse.success) {
      throw new Error(`Error en el procesamiento del pago: ${wompiResponse.message}`);
    }

    // Crear el registro de pago
    const payment = await PrismaWrapper.execute(
      () => prisma.payment.create({
        data: {
          sedeId: sede.id,
          amount: totalPrice,
          paymentMethod: paymentInfo.method,
          status: 'COMPLETED',
          transactionId: wompiResponse.transactionId,
          gatewayResponse: JSON.parse(JSON.stringify(wompiResponse))
        }
      }),
      3
    );

    // Crear la orden del producto
    const productOrder = await PrismaWrapper.execute(
      () => prisma.productOrder.create({
        data: {
          userId,
          productId: product.id,
          sedeId: sede.id,
          paymentId: payment.id,
          quantity,
          unitPrice,
          totalPrice,
          status: 'PAID'
        },
        include: {
          product: true,
          sede: true,
          payment: true
        }
      }),
      3
    );

    // Actualizar stock del producto
    await PrismaWrapper.execute(
      () => prisma.producto.update({
        where: { id: productId },
        data: {
          stock: product.stock - quantity
        }
      }),
      3
    );

    return {
      success: true,
      order: productOrder,
      payment: wompiResponse,
      message: "Producto comprado exitosamente"
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
