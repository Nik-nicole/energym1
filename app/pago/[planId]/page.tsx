import prisma from "@/lib/db";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { PagoPlanClient } from "./_components/pago-plan-client";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getData(planId: string, userSedeId: string | null | undefined) {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        sedes: {
          include: {
            sede: true
          }
        }
      }
    });

    if (!plan) {
      return null;
    }

    // Verificar si el plan está disponible en la sede del usuario
    if (userSedeId && plan.sedes && plan.sedes.length > 0) {
      const isPlanAvailableInUserSede = plan.sedes.some(
        (planSede: { sede: { id: string } }) => planSede.sede.id === userSedeId
      );
      
      if (!isPlanAvailableInUserSede) {
        return { plan: null, error: "sede_not_available" };
      }
    }

    return { plan, error: null };
  } catch (error) {
    console.error("Error fetching plan data:", error);
    return null;
  }
}

export default async function PagoPlanPage({
  params,
}: {
  params: { planId: string };
}) {
  const session = await getServerSession(authOptions);
  const data = await getData(params.planId, session?.user?.sedeId);

  if (!data) {
    notFound();
  }

  // Si el plan no está disponible en la sede del usuario, redirigir a la página principal
  if (data.error === "sede_not_available") {
    redirect("/?error=plan_not_available_in_sede");
  }

  const { plan } = data;

  if (!plan) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <PagoPlanClient plan={plan} />
      <Footer />
    </main>
  );
}
