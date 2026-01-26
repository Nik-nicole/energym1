import { prisma } from "@/lib/db";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { PagoPlanClient } from "./_components/pago-plan-client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getData(planId: string) {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return null;
    }

    return { plan };
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
  const data = await getData(params.planId);

  if (!data) {
    notFound();
  }

  const { plan } = data;

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <PagoPlanClient plan={plan} />
      <Footer />
    </main>
  );
}
