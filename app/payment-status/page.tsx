"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw, ArrowRight } from "lucide-react";
import { PaymentStatus } from "@/lib/payment-status-utils";

type StatusType = 'loading' | 'pending' | 'paid' | 'rejected' | 'expired' | 'error';

interface PaymentData {
  status: PaymentStatus;
  amount?: number;
  transactionId: string;
  paymentMethod?: string;
  error?: string;
}

export default function PaymentStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StatusType>('loading');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  // Caché de datos invariables del pago (cargados en la primera llamada)
  const cachedPaymentMeta = useRef<{ amount?: number; paymentMethod?: string } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const transactionId = searchParams.get('transactionId');

  useEffect(() => {
    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsPolling(false);
    };

    if (!transactionId) {
      setError('No se encontró ID de transacción');
      setStatus('error');
      return;
    }

    let cancelled = false;
    setPollingCount(0);
    setIsPolling(true);

    const mapStatus = (rawStatus: string): StatusType => {
      switch (rawStatus) {
        case 'PENDING': return 'pending';
        case 'PAID':
        case 'COMPLETED': return 'paid';
        case 'REJECTED':
        case 'FAILED': return 'rejected';
        case 'CANCELLED':
        case 'EXPIRED': return 'expired';
        default: return 'pending';
      }
    };

    const isTerminal = (s: StatusType) =>
      ['paid', 'rejected', 'expired', 'error'].includes(s);

    // Primera llamada: consulta completa con validación de propiedad
    const fetchInitial = async (): Promise<boolean> => {
      try {
        const response = await fetch(`/api/payments/status/${transactionId}`);
        if (!response.ok) throw new Error('Error al consultar estado del pago');
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        if (cancelled) return true;

        // Guardar en caché los datos que no cambian
        cachedPaymentMeta.current = { amount: data.amount, paymentMethod: data.paymentMethod };

        const newStatus = mapStatus(data.status);
        setPaymentData({
          status: data.status,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          transactionId: data.transactionId,
        });
        setStatus(newStatus);
        if (isTerminal(newStatus)) {
          stopPolling();
          return true;
        }
        return isTerminal(newStatus);
      } catch (err) {
        if (cancelled) return true;
        console.error('[PaymentStatus] Error inicial:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setStatus('error');
        stopPolling();
        return true;
      }
    };

    // Llamadas sucesivas: solo consulta el campo status (endpoint liviano)
    const fetchPoll = async (): Promise<boolean> => {
      try {
        const response = await fetch(`/api/payments/status/${transactionId}/poll`);
        if (!response.ok) throw new Error('Error al consultar estado del pago');
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        if (cancelled) return true;

        const newStatus = mapStatus(data.status);
        setStatus(newStatus);
        // Preservar los datos invariables del caché
        setPaymentData(prev => prev
          ? { ...prev, status: data.status }
          : { status: data.status, transactionId: transactionId!, ...cachedPaymentMeta.current });

        if (isTerminal(newStatus)) {
          stopPolling();
          return true;
        }

        setPollingCount(prev => prev + 1);
        return isTerminal(newStatus);
      } catch (err) {
        if (cancelled) return true;
        console.error('[PaymentStatus] Error en polling:', err);
        // No detener polling por error transitorio — solo logueamos
        return false;
      }
    };

    const startPolling = async () => {
      const done = await fetchInitial();
      if (done) return;

      // Polling liviano cada 15 segundos
      intervalRef.current = setInterval(async () => {
        const done = await fetchPoll();
        if (done) {
          stopPolling();
        }
      }, 15000);

      // Tiempo máximo de espera: 10 minutos (~40 intentos)
      timeoutRef.current = setTimeout(() => {
        if (cancelled) return;
        setError('Tiempo de espera agotado. Por favor actualiza la página.');
        setStatus('expired');
        stopPolling();
      }, 10 * 60 * 1000);
    };

    startPolling();

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [transactionId]);  // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-16 h-16 text-yellow-500" />;
      case 'paid':
        return <CheckCircle2 className="w-16 h-16 text-green-500" />;
      case 'rejected':
      case 'expired':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-16 h-16 text-red-500" />;
      default:
        return <AlertCircle className="w-16 h-16 text-gray-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verificando pago...';
      case 'pending':
        return 'Procesando pago...';
      case 'paid':
        return '¡Pago realizado!';
      case 'rejected':
        return 'Pago cancelado';
      case 'expired':
        return 'Tiempo agotado';
      case 'error':
        return 'Error en el pago';
      default:
        return 'Estado desconocido';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'loading':
        return 'Estamos verificando el estado de tu pago...';
      case 'pending':
        return 'Tu pago está siendo procesado. Esto puede tomar unos segundos...';
      case 'paid':
        return '¡Tu pago ha sido procesado exitosamente!';
      case 'rejected':
        return 'Tu pago ha sido cancelado o rechazado. Por favor intenta con otro método de pago.';
      case 'expired':
        return error || 'El tiempo de espera ha finalizado. Por favor actualiza la página.';
      case 'error':
        return error || 'Ocurrió un error al procesar tu pago. Por favor intenta nuevamente.';
      default:
        return 'Estado del pago desconocido.';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getActionButton = () => {
    switch (status) {
      case 'paid':
        return (
          <div className="space-y-3">
            <button
              onClick={() => router.push('/perfil')}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              Ir a mis órdenes
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        );
      case 'rejected':
      case 'expired':
      case 'error':
        return (
          <div className="space-y-3">
            <button
              onClick={() => router.push('/marketplace')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al marketplace
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-[#141414] rounded-2xl p-8 border border-white/10 text-center"
      >
        {/* Icono de estado */}
        <div className="mb-6 flex justify-center">
          {getStatusIcon()}
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-white mb-4">
          {getStatusTitle()}
        </h1>

        {/* Mensaje */}
        <p className="text-gray-300 mb-6">
          {getStatusMessage()}
        </p>

        {/* Información del pago */}
        {paymentData && paymentData.amount && (
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Monto</p>
            <p className="text-white text-xl font-semibold">
              {formatCurrency(paymentData.amount)}
            </p>
          </div>
        )}

        {/* Información de polling */}
        {(status === 'pending' || status === 'loading') && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-sm">
              {status === 'loading' ? 'Iniciando verificación...' : `Verificando estado (${pollingCount + 1} intentos)`}
            </p>
            <p className="text-blue-400 text-xs mt-1">
              Actualizando automáticamente cada 15 segundos...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Botones de acción */}
        {getActionButton()}

        {/* Transaction ID para referencia */}
        {transactionId && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-gray-500 text-xs">
              Referencia de pago: {transactionId}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
