import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;

    // Obtener el usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar si es administrador o el dueño de la orden
    const isAdmin = user.role === 'ADMIN';

    // Obtener la orden de producto
    const productOrder = await prisma.productOrder.findUnique({
      where: { id: id },
      include: {
        user: true,
        product: true,
        items: {
          include: {
            product: true
          }
        },
        sede: {
          include: {
            paymentGateway: true
          }
        },
        payment: true
      }
    });
    
    console.log(`[API Order] Orden encontrada (RAW):`, JSON.stringify({
      id: productOrder?.id,
      status: productOrder?.status,
      paymentId: productOrder?.paymentId,
      boldReference: (productOrder as any)?.boldReference,
      customerName: (productOrder as any)?.customerName,
      customerEmail: (productOrder as any)?.customerEmail,
      shippingPhone: productOrder?.shippingPhone,
      shippingAddress: productOrder?.shippingAddress,
      shippingCity: productOrder?.shippingCity,
    }, null, 2));

    console.log(`[API Order] Orden encontrada:`, {
      id: productOrder?.id,
      status: productOrder?.status,
      paymentId: productOrder?.paymentId,
      hasPayment: !!productOrder?.payment,
      paymentData: productOrder?.payment ? {
        id: productOrder.payment.id,
        method: productOrder.payment.paymentMethod,
        status: productOrder.payment.status,
        amount: productOrder.payment.amount,
        transactionId: productOrder.payment.transactionId
      } : null
    });

    if (!productOrder) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Solo permitir acceso si es administrador o el dueño de la orden y está pagada
    if (!isAdmin && (productOrder.userId !== user.id || productOrder.status !== 'PAID')) {
      return NextResponse.json({ error: "No autorizado para ver esta orden" }, { status: 403 });
    }

    // Crear timeline basado en el status
    // Estados: PENDING → PAID → VERIFIED → PACKED → SHIPPED → DELIVERED
    const getTimelineStatus = (stepIndex: number, currentStatus: string) => {
      const statusOrder = ["PENDING", "PAID", "VERIFIED", "PACKED", "SHIPPED", "DELIVERED"];
      const currentIndex = statusOrder.indexOf(currentStatus);
      
      if (currentStatus === "CANCELLED") return "cancelled";
      if (stepIndex < currentIndex) return "completed";
      if (stepIndex === currentIndex) return "current";
      return "pending";
    };

    const timeline = [
      { label: "Orden Pagada", status: getTimelineStatus(1, productOrder.status), date: productOrder.createdAt.toLocaleDateString() },
      { label: "Verificada", status: getTimelineStatus(2, productOrder.status), date: "" },
      { label: "Empacada", status: getTimelineStatus(3, productOrder.status), date: "" },
      { label: "Enviada", status: getTimelineStatus(4, productOrder.status), date: "" }
    ];

    // Si está cancelado, mostrar todos como cancelados con X roja
    if (productOrder.status === "CANCELLED") {
      timeline.forEach(item => {
        item.status = "cancelled";
      });
    }

// Función para formatear moneda en pesos colombianos
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

    return NextResponse.json({
      success: true,
      order: {
        id: productOrder.id,
        date: productOrder.createdAt.toLocaleDateString(),
        total: formatCurrency(productOrder.totalPrice),
        status: productOrder.status === "PAID" ? "Orden Pagada" : 
                productOrder.status === "VERIFIED" ? "Verificada" :
                productOrder.status === "PACKED" ? "Empacada" :
                productOrder.status === "SHIPPED" ? "Enviada" :
                productOrder.status === "CANCELLED" ? "Cancelada" : "Orden Pagada",
        timeline: timeline,
        client: {
          name: (productOrder as any).customerName || `${productOrder.user.firstName} ${productOrder.user.lastName || ''}`,
          email: (productOrder as any).customerEmail || productOrder.user.email,
          phone: productOrder.shippingPhone || "No especificado",
          address: productOrder.shippingAddress || "No especificada",
          city: productOrder.shippingCity || "No especificada"
        },
        product: productOrder.items && productOrder.items.length > 0 ? {
          items: productOrder.items.map(item => ({
            name: item.product.nombre,
            description: item.product.descripcion,
            category: item.product.categoria,
            image: item.product.imagen || "/placeholder-product.jpg",
            quantity: item.quantity,
            unitPrice: formatCurrency(item.unitPrice),
            subtotal: formatCurrency(item.unitPrice * item.quantity),
            total: formatCurrency(item.totalPrice)
          })),
          // Legacy single product support
          name: productOrder.product?.nombre || productOrder.items[0]?.product.nombre,
          description: productOrder.product?.descripcion || productOrder.items[0]?.product.descripcion,
          category: productOrder.product?.categoria || productOrder.items[0]?.product.categoria,
          image: productOrder.product?.imagen || productOrder.items[0]?.product.imagen || "/placeholder-product.jpg",
          quantity: productOrder.items.reduce((sum, item) => sum + item.quantity, 0),
          unitPrice: formatCurrency(productOrder.unitPrice || productOrder.items[0]?.unitPrice),
          subtotal: formatCurrency(productOrder.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)),
          total: formatCurrency(productOrder.totalPrice)
        } : {
          // Single product fallback
          name: productOrder.product?.nombre || "Producto",
          description: productOrder.product?.descripcion || "",
          category: productOrder.product?.categoria || "",
          image: productOrder.product?.imagen || "/placeholder-product.jpg",
          quantity: productOrder.quantity || 1,
          unitPrice: formatCurrency(productOrder.unitPrice || 0),
          subtotal: formatCurrency((productOrder.unitPrice || 0) * (productOrder.quantity || 1)),
          total: formatCurrency(productOrder.totalPrice || 0),
          items: []
        },
        location: {
          name: productOrder.sede.nombre,
          address: productOrder.sede.direccion,
          city: productOrder.sede.ciudad,
          phone: productOrder.sede.telefono,
          email: productOrder.sede.email,
          paymentAccount: productOrder.sede.paymentGateway?.nombre || productOrder.sede.paymentGateway?.cuentaBanco || "No especificada"
        },
        payment: productOrder.payment ? {
          method: productOrder.payment.paymentMethod,
          status: productOrder.payment.status === "PAID" || productOrder.payment.status === "COMPLETED" ? "Pagado" : 
                  productOrder.payment.status === "PENDING" ? "Pendiente" : 
                  productOrder.payment.status === "REJECTED" || productOrder.payment.status === "FAILED" ? "Fallido" : 
                  productOrder.payment.status === "CANCELLED" || productOrder.payment.status === "EXPIRED" ? "Cancelado" : "Desconocido",
          amount: formatCurrency(productOrder.payment.amount),
          date: productOrder.payment.createdAt.toLocaleDateString(),
          transactionId: productOrder.payment.transactionId
        } : null,
        shipping: {
          method: "Envio estandar", // Podrías agregar esto a ProductOrder
          trackingNumber: "", // Podrías agregar esto a ProductOrder
          notes: "" // Podrías agregar esto a ProductOrder
        }
      }
    });
  } catch (error) {
    console.error("Error fetching product order:", error);
    return NextResponse.json(
      { error: "Error al obtener la orden" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("PUT request received")
    const session = await getServerSession(authOptions);
    console.log("Session:", session?.user?.email)
    
    if (!session?.user?.email) {
      console.log("No session found")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;
    console.log("Order ID:", id)
    const body = await request.json();
    console.log("Request body:", body)

    // Obtener el usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.log("User not found")
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    console.log("Updating order status to:", body.status)

    // Actualizar la orden
    const updatedOrder = await prisma.productOrder.update({
      where: { id: id },
      data: {
        status: body.status,
        updatedAt: new Date()
      }
    });

    console.log("Order updated successfully:", updatedOrder)

    return NextResponse.json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error updating product order:", error);
    return NextResponse.json(
      { error: "Error al actualizar la orden" },
      { status: 500 }
    );
  }
}
