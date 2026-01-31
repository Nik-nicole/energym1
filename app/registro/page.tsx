import { prisma } from "@/lib/db";
import { RegistroForm } from "./_components/registro-form";
import { Header } from "@/components/ui/header";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getSedes() {
  try {
    return await prisma.sede.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function RegistroPage() {
  const sedes = await getSedes();

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
            <h1 className="text-2xl font-bold mb-2">Únete a Energym</h1>
            <p className="text-gray-400">Crea tu cuenta y comienza tu transformación</p>
          </div>
          <RegistroForm sedes={sedes} />
        </div>
      </div>
    </main>
  );
}
