"use client";

import { motion } from "framer-motion";
import { 
  Check, 
  Calendar, 
  CreditCard, 
  Crown, 
  Download,
  Share,
  ArrowLeft,
  User,
  ShoppingBag
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Payment {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  paymentMethod: string;
  status: string;
  paymentStatus: string;
  cardName: string | null;
  email: string;
  transactionId: string;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  };
  plan: {
    id: string;
    nombre: string;
    precio: number;
    descripcion: string;
    duracion: string;
    esVip: boolean;
  };
}

interface ConfirmacionPagoClientProps {
  payment: Payment;
}

export function ConfirmacionPagoClient({ payment }: ConfirmacionPagoClientProps) {
  const router = useRouter();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = () => {
    const receiptData = {
      id: payment.id,
      plan: payment.plan.nombre,
      amount: payment.amount,
      date: payment.createdAt,
      status: payment.status,
    };
    
    const blob = new Blob([JSON.stringify(receiptData, null, 2)], {
      type: "application/json",
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comprobante-${payment.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FitZone - Confirmación de Pago",
          text: `He adquirido el plan ${payment.plan.nombre} en FitZone por ${formatPrice(payment.amount)}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    }
  };

  return (
    <div className="flex-1 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            ¡Pago Confirmado!
          </h1>
          <p className="text-gray-400 text-lg">
            Tu plan ha sido activado exitosamente
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del Pago */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Detalles del Plan */}
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Detalles del Plan</h2>
              
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {payment.plan.nombre}
                  </h3>
                  <p className="text-gray-400">{payment.plan.descripcion}</p>
                </div>
                {payment.plan.esVip && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full">
                    <Crown className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 text-sm font-medium">VIP</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/[0.03] rounded-2xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Duración</p>
                  <p className="text-white font-medium">{payment.plan.duracion}</p>
                </div>
                <div className="bg-white/[0.03] rounded-2xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Precio</p>
                  <p className="text-white font-medium">{formatPrice(payment.plan.precio)}</p>
                </div>
              </div>

              <div className="border-t border-white/[0.05] pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total pagado</span>
                  <span className="text-2xl font-bold text-white">
                    {formatPrice(payment.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Información de Pago */}
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Información de Pago</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">ID de Transacción</span>
                  <span className="text-white font-mono">{payment.transactionId}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Método de Pago</span>
                  <span className="text-white capitalize">{payment.paymentMethod}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Fecha</span>
                  <span className="text-white">{formatDate(payment.createdAt)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Estado</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-medium">
                    Confirmado
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Acciones */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Información del Usuario */}
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Información del Cliente</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white font-medium">
                      {payment.user.firstName} {payment.user.lastName}
                    </p>
                    <p className="text-gray-400 text-sm">{payment.user.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Acciones Rápidas</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.10] rounded-2xl font-medium text-white transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Descargar Comprobante
                </button>
                
                <button
                  onClick={handleShare}
                  className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.10] rounded-2xl font-medium text-white transition-all flex items-center justify-center gap-2"
                >
                  <Share className="w-5 h-5" />
                  Compartir
                </button>
                
                <Link
                  href="/perfil"
                  className="w-full py-3 gradient-bg rounded-2xl font-medium text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Ver Mi Perfil
                </Link>
                
                <Link
                  href="/tienda"
                  className="flex items-center gap-3 p-3 bg-white/[0.05] hover:bg-white/10 rounded-2xl transition-colors"
                >
                  <ShoppingBag className="w-5 h-5 text-white/60" />
                  <div className="flex-1">
                    <p className="text-white font-medium">Visitar Tienda</p>
                    <p className="text-gray-400 text-xs">Compra productos y suplementos</p>
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
