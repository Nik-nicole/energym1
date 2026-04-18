"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type BoldStatus = "ACTIVE" | "PROCESSING" | "PAID" | "REJECTED" | "CANCELLED" | "EXPIRED";

export default function PaymentReturnClient() {
  const searchParams = useSearchParams();
  const linkId = searchParams.get("link_id");
  const [status, setStatus] = useState<BoldStatus>("PROCESSING");

  useEffect(() => {
    if (!linkId) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/bold/status/${linkId}`);
        const data = await res.json();
        const currentStatus = data.status as BoldStatus;

        setStatus(currentStatus);

        if (["PAID", "REJECTED", "CANCELLED", "EXPIRED"].includes(currentStatus)) {
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Error al verificar el estado del pago", error);
      }
    };

    const interval = setInterval(checkStatus, 3000);
    checkStatus();

    return () => clearInterval(interval);
  }, [linkId]);

  const renderContent = () => {
    switch (status) {
      case "PROCESSING": return { title: "Verificando pago...", color: "text-blue-400" };
      case "ACTIVE": return { title: "Esperando pago...", color: "text-yellow-400" };
      case "PAID": return { title: "Pago exitoso", color: "text-green-400" };
      case "REJECTED": return { title: "Pago rechazado", color: "text-red-400" };
      case "CANCELLED": return { title: "Pago cancelado", color: "text-red-400" };
      case "EXPIRED": return { title: "Link expirado", color: "text-gray-400" };
      default: return { title: "Verificando pago...", color: "text-blue-400" };
    }
  };

  const content = renderContent();

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-[#141414] rounded-2xl p-8 border border-white/10 text-center shadow-2xl">
        <h1 className={`text-2xl font-bold mb-4 ${content.color}`}>{content.title}</h1>
        <p className="text-gray-400 text-sm mb-6">
          ID de Transacción: <br />
          <span className="font-mono text-white">{linkId || "N/A"}</span>
        </p>
        {["PAID", "REJECTED", "CANCELLED", "EXPIRED"].includes(status) && (
          <a href="/" className="inline-block w-full py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">Volver al inicio</a>
        )}
      </div>
    </div>
  );
}