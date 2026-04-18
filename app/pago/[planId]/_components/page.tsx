import { Suspense } from "react";
import PaymentReturnClient from "./payment-return-client";

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PaymentReturnClient />
    </Suspense>
  );
}