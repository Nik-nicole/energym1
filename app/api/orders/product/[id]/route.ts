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
        sede: {
          include: {
            paymentGateway: true
          }
        },
        payment: true
      }
    });

    if (!productOrder) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Solo permitir acceso si es administrador o el dueño de la orden y está pagada
    if (!isAdmin && (productOrder.userId !== user.id || productOrder.status !== 'PAID')) {
      return NextResponse.json({ error: "No autorizado para ver esta orden" }, { status: 403 });
    }

    // Crear timeline basado en el status
    const timeline = [
      { label: "Orden Pagada", status: ["PAID", "VERIFIED", "PACKED", "SHIPPED"].includes(productOrder.status) ? "completed" : productOrder.status === "PAID" ? "current" : "pending", date: productOrder.createdAt.toLocaleDateString() },
      { label: "Verificada", status: ["VERIFIED", "PACKED", "SHIPPED"].includes(productOrder.status) ? "completed" : productOrder.status === "VERIFIED" ? "current" : "pending", date: "" },
      { label: "Empacada", status: ["PACKED", "SHIPPED"].includes(productOrder.status) ? "completed" : productOrder.status === "PACKED" ? "current" : "pending", date: "" },
      { label: "Enviada", status: productOrder.status === "SHIPPED" ? "current" : productOrder.status === "SHIPPED" ? "completed" : "pending", date: "" }
    ];

    // Si está cancelado, mostrar todos como cancelados con X roja
    if (productOrder.status === "CANCELLED") {
      timeline.forEach(item => {
        item.status = "cancelled";
      });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: productOrder.id,
        date: productOrder.createdAt.toLocaleDateString(),
        total: `$${productOrder.totalPrice.toFixed(2)}`,
        status: productOrder.status === "PAID" ? "Orden Pagada" : 
                productOrder.status === "VERIFIED" ? "Verificada" :
                productOrder.status === "PACKED" ? "Empacada" :
                productOrder.status === "SHIPPED" ? "Enviada" :
                productOrder.status === "CANCELLED" ? "Cancelada" : "Orden Pagada",
        timeline: timeline,
        client: {
          name: `${productOrder.user.firstName} ${productOrder.user.lastName || ''}`,
          email: productOrder.user.email,
          phone: "No especificado", // Podrías agregar este campo al User
          address: "No especificada", // Podrías agregar este campo al User
          city: "No especificada" // Podrías agregar este campo al User
        },
        product: {
          name: productOrder.product.nombre,
          description: productOrder.product.descripcion,
          category: productOrder.product.categoria,
          image: productOrder.product.imagen || "/placeholder-product.jpg",
          quantity: productOrder.quantity,
          unitPrice: `$${productOrder.unitPrice.toFixed(2)}`,
          subtotal: `$${(productOrder.unitPrice * productOrder.quantity).toFixed(2)}`,
          total: `$${productOrder.totalPrice.toFixed(2)}`
        },
        location: {
          name: productOrder.sede.nombre,
          address: productOrder.sede.direccion,
          city: productOrder.sede.ciudad,
          phone: productOrder.sede.telefono,
          email: productOrder.sede.email,
          paymentAccount: productOrder.sede.paymentGateway?.cuentaBanco || "No especificada"
        },
        payment: productOrder.payment ? {
          method: productOrder.payment.paymentMethod,
          status: productOrder.payment.status === "COMPLETED" ? "Pagado" : 
                  productOrder.payment.status === "PENDING" ? "Pendiente" : 
                  productOrder.payment.status === "FAILED" ? "Fallido" : "Desconocido",
          amount: `$${productOrder.payment.amount.toFixed(2)}`,
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
