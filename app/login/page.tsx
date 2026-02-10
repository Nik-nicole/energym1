import { LoginForm } from "./_components/login-form";
import { Header } from "@/components/ui/header";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center mb-6">
              <Image 
                src="/logo.png" 
                alt="Energym Logo" 
                width={60} 
                height={60}
                className="rounded-lg"
              />
            </Link>
            <h1 className="text-2xl font-bold mb-2">Bienvenido de vuelta</h1>
            <p className="text-gray-400">Inicia sesión para acceder a tu cuenta</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
