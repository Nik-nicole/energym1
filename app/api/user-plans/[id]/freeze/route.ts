import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;
    const userId = session.user.id;
    const userRole = session.user.role;

    console.log('DEBUG API - id recibido:', id);
    console.log('DEBUG API - userId:', userId);
    console.log('DEBUG API - userRole:', userRole);

    // Intentar obtener el UserPlan por ID primero
    let userPlan = await prisma.userPlan.findUnique({
      where: { id },
      include: {
        plan: true,
        user: true,
      },
    });
    console.log('DEBUG API - UserPlan encontrado por ID:', userPlan);

    // Si no se encuentra por ID, buscar por userId y planId
    if (!userPlan) {
      console.log('DEBUG API - No se encontró por ID, buscando por userId y planId...');
      userPlan = await prisma.userPlan.findFirst({
        where: {
          userId: userId,
          planId: id,
          isActive: true,
          OR: [
            { endDate: null },
            { endDate: { gt: new Date() } }
          ]
        },
        include: {
          plan: true,
          user: true,
        },
      });
      console.log('DEBUG API - UserPlan encontrado por userId+planId:', userPlan);
    }

    // Si aún no se encuentra y es admin, buscar solo por planId
    if (!userPlan && userRole === 'ADMIN') {
      console.log('DEBUG API - Buscando como admin por planId...');
      userPlan = await prisma.userPlan.findFirst({
        where: {
          planId: id,
          isActive: true,
          OR: [
            { endDate: null },
            { endDate: { gt: new Date() } }
          ]
        },
        include: {
          plan: true,
          user: true,
        },
      });
      console.log('DEBUG API - UserPlan encontrado por admin:', userPlan);
    }

    // Si no se encuentra UserPlan, crearlo automáticamente (solo para admins)
    if (!userPlan && userRole === 'ADMIN') {
      console.log('DEBUG API - Creando UserPlan automáticamente...');
      try {
        // Obtener el body para ver si viene un targetUserId
        const body = await request.json().catch(() => ({}));
        const targetUserId = body.userId;
        
        if (!targetUserId) {
          return NextResponse.json(
            { error: 'Se requiere userId para crear el plan' },
            { status: 400 }
          );
        }
        
        userPlan = await prisma.userPlan.create({
          data: {
            userId: targetUserId,
            planId: id,
            isActive: true,
            status: 'ACTIVE',
            startDate: new Date(),
          },
          include: {
            plan: true,
            user: true,
          },
        });
        console.log('DEBUG API - UserPlan creado:', userPlan);
      } catch (createError) {
        console.error('DEBUG API - Error creando UserPlan:', createError);
        return NextResponse.json(
          { error: 'No se pudo crear el plan para congelar' },
          { status: 500 }
        );
      }
    }

    if (!userPlan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    // Validar que el plan pertenezca al usuario O que sea un administrador
    if (userPlan.userId !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar este plan' },
        { status: 403 }
      );
    }

    // Validar que el plan esté activo
    if (!userPlan.isActive) {
      return NextResponse.json(
        { error: 'Solo se pueden congelar planes activos' },
        { status: 400 }
      );
    }

    // Congelar el plan - intentar usar campos status/freezeDate si existen
    let frozenPlan;
    try {
      frozenPlan = await prisma.userPlan.update({
        where: { id },
        data: {
          status: 'FROZEN',
          isActive: false,
          freezeDate: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      // Si los campos no existen, usar la lógica temporal
      console.log('Los campos status/freezeDate no existen, usando lógica temporal');
      frozenPlan = await prisma.userPlan.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      message: 'Plan congelado correctamente',
      userPlan: frozenPlan,
    });
  } catch (error) {
    console.error('Error freezing plan:', error);
    return NextResponse.json(
      { error: 'Error al congelar el plan' },
      { status: 500 }
    );
  }
}
