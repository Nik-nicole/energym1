"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type BoldStatus =
  | "PROCESSING"
  | "PAID"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "ERROR";

export default function PaymentReturnClient() {
  const searchParams = useSearchParams();
  const linkId = searchParams.get("link_id");

  const [status, setStatus] = useState<BoldStatus>("PROCESSING");

  useEffect(() => {
    if (!linkId) {
      setStatus("ERROR");
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/bold/status/${linkId}`);

        if (!res.ok) {
          setStatus("ERROR");
          return;
        }

        const data = await res.json();
        const currentStatus = data.status as BoldStatus;

        setStatus(currentStatus);

        if (
          ["PAID", "REJECTED", "CANCELLED", "EXPIRED"].includes(currentStatus)
        ) {
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Error al verificar el estado del pago", error);
        setStatus("ERROR");
        clearInterval(interval);
      }
    };

    // 🔥 primera ejecución inmediata
    checkStatus();

    const interval = setInterval(checkStatus, 3000);

    return () => clearInterval(interval);
  }, [linkId]);

  const getStatusConfig = () => {
    switch (status) {
      case "PAID":
        return {
          title: "Pago exitoso",
          color: "text-green-400",
        };
      case "REJECTED":
        return {
          title: "Pago rechazado",
          color: "text-red-400",
        };
      case "CANCELLED":
        return {
          title: "Pago cancelado",
          color: "text-red-400",
        };
      case "EXPIRED":
        return {
          title: "Link expirado",
          color: "text-gray-400",
        };
      case "ERROR":
        return {
          title: "Error al verificar el pago",
          color: "text-red-400",
        };
      default:
        return {
          title: "Verificando pago...",
          color: "text-blue-400",
        };
    }
  };

  const { title, color } = getStatusConfig();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      {/* MODAL */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 w-full max-w-md text-center shadow-2xl">
        {/* Loader / Icon */}
        <div className="mb-6">
          {status === "PROCESSING" && (
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
          )}

          {status === "PAID" && (
            <div className="text-green-400 text-4xl">✓</div>
          )}

          {["REJECTED", "CANCELLED", "ERROR"].includes(status) && (
            <div className="text-red-400 text-4xl">✕</div>
          )}

          {status === "EXPIRED" && (
            <div className="text-gray-400 text-4xl">⌛</div>
          )}
        </div>

        {/* Title */}
        <h2 className={`text-xl font-semibold mb-2 ${color}`}>
          {title}
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-6">
          {status === "PROCESSING" &&
            "Estamos confirmando tu pago con la pasarela. Esto puede tardar unos segundos."}
          {status === "PAID" &&
            "Tu pago fue procesado correctamente."}
          {status === "REJECTED" &&
            "El pago fue rechazado. Intenta con otro método."}
          {status === "CANCELLED" &&
            "Cancelaste el proceso de pago."}
          {status === "EXPIRED" &&
            "El link de pago ha expirado."}
          {status === "ERROR" &&
            "No pudimos verificar el estado del pago."}
        </p>

        {/* ID */}
        <p className="text-xs text-gray-500 mb-6">
          ID de Transacción:
          <br />
          <span className="font-mono text-white">
            {linkId || "N/A"}
          </span>
        </p>

        {/* Botón */}
        {["PAID", "REJECTED", "CANCELLED", "EXPIRED", "ERROR"].includes(
          status
        ) && (
          <a
            href="/"
            className="inline-block w-full py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Volver al inicio
          </a>
        )}
      </div>
    </div>
  );
}