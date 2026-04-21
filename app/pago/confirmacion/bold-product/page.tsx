"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

export default function BoldProductConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const productOrderId = searchParams.get('productOrderId');

  useEffect(() => {
    if (!productOrderId) {
      setError('No se encontró ID de la orden');
      setLoading(false);
      return;
    }
    // Redirigir a la pantalla de estado usando orderId (sin exponer LNK_* en URL)
    router.replace(`/payment-status?orderId=${productOrderId}`);
  }, [productOrderId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-[#141414] rounded-2xl p-8 border border-white/10 text-center"
        >
          <div className="mb-6 flex justify-center">
            <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Redirigiendo...
          </h1>
          <p className="text-gray-300">
            Estamos preparando tu página de estado de pago...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-[#141414] rounded-2xl p-8 border border-white/10 text-center"
        >
          <div className="mb-6 flex justify-center">
            <RefreshCw className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Error
          </h1>
          <p className="text-gray-300 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={() => router.push('/marketplace')}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Volver al marketplace
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
