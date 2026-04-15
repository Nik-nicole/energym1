import { prisma } from '../prisma';
import { Role } from '@prisma/client';
import { userQueries } from '../query-helpers';
import { PrismaWrapper } from '../connection-wrapper';

export class UserService {
  static async getUserByEmail(email: string) {
    return await userQueries.byEmail(email);
  }

  static async getUserById(userId: string) {
    return await userQueries.byId(userId);
  }

  static async getUserWithSede(email: string) {
    return await userQueries.withSede(email);
  }

  static async getUserProfile(userId: string) {
    return await PrismaWrapper.execute(
      () => prisma.user.findUnique({
        where: { id: userId },
        include: {
          sede: {
            select: {
              id: true,
              nombre: true,
              direccion: true
            }
          },
          userPlans: {
            include: {
              plan: true
            },
            where: {
              isActive: true,
              endDate: {
                gte: new Date()
              }
            }
          },
          productOrders: {
            include: {
              product: {
                select: {
                  id: true,
                  nombre: true,
                  imagen: true
                }
              },
              payment: {
                select: {
                  status: true,
                  transactionId: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          },
          planOrders: {
            include: {
              plan: {
                select: {
                  id: true,
                  nombre: true,
                  tipo: true,
                  duracion: true,
                  esVip: true
                }
              },
              payment: {
                select: {
                  status: true,
                  transactionId: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      }),
      3
    );
  }

  static async updateUser(userId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    image?: string;
    sedeId?: string;
    password?: string;
    confirmPassword?: string;
    role?: string;
  }) {
    // Filter out confirmPassword and handle password hashing
    const { confirmPassword, password, ...updateData } = data;
    
    // Check if email is being updated and if it already exists
    if (updateData.email) {
      const existingUser = await PrismaWrapper.execute(
        () => prisma.user.findFirst({
          where: {
            email: updateData.email,
            id: { not: userId }
          }
        }),
        3
      );
      
      if (existingUser) {
        throw new Error("El email ya está en uso por otro usuario");
      }
    }
    
    // Prepare the update data
    const finalUpdateData: any = {
      ...updateData,
      updatedAt: new Date()
    };
    
    // If password is provided, hash it
    if (password) {
      const bcrypt = require('bcryptjs');
      finalUpdateData.password = await bcrypt.hash(password, 10);
    }
    
    return await PrismaWrapper.execute(
      () => prisma.user.update({
        where: { id: userId },
        data: finalUpdateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          sedeId: true,
          image: true,
          sede: {
            select: {
              id: true,
              nombre: true,
              direccion: true
            }
          }
        }
      }),
      3
    );
  }

  static async updateUserProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }) {
    return await this.updateUser(userId, data);
  }

  static async updateUserImage(userId: string, imageUrl: string) {
    return await this.updateUser(userId, { image: imageUrl });
  }

  static async getAllUsers(options?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    sedeId?: string;
  }) {
    const { page = 1, limit = 20, search, role, isActive, sedeId } = options || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (sedeId) {
      where.sedeId = sedeId;
    }

    const [users, total] = await Promise.all([
      PrismaWrapper.execute(
        () => prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
            sedeId: true,
            image: true,
            sede: {
              select: {
                id: true,
                nombre: true
              }
            },
            userPlans: {
              select: {
                id: true,
                isActive: true,
                startDate: true,
                endDate: true,
                plan: {
                  select: {
                    id: true,
                    nombre: true,
                    tipo: true,
                    esVip: true
                  }
                }
              }
            },
            _count: {
              select: {
                productOrders: true,
                planOrders: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        3
      ),
      PrismaWrapper.execute(
        () => prisma.user.count({ where }),
        3
      )
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async createUser(data: {
    email: string;
    firstName: string;
    lastName?: string;
    role?: string;
    sedeId?: string;
  }) {
    return await PrismaWrapper.execute(
      () => prisma.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          password: "TEMP_PASSWORD", // Se debe establecer una contraseña temporal
          role: (data.role as any) || 'CLIENTE',
          sedeId: data.sedeId || null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          sedeId: true,
          image: true,
          sede: {
            select: {
              id: true,
              nombre: true
            }
          }
        }
      }),
      3
    );
  }

  static async deactivateUser(userId: string) {
    return await PrismaWrapper.execute(
      () => prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true
        }
      }),
      3
    );
  }

  static async activateUser(userId: string) {
    return await PrismaWrapper.execute(
      () => prisma.user.update({
        where: { id: userId },
        data: {
          isActive: true,
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true
        }
      }),
      3
    );
  }

  static async updateUserRole(userId: string, role: string) {
    return await PrismaWrapper.execute(
      () => prisma.user.update({
        where: { id: userId },
        data: {
          role: role as any,
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true
        }
      }),
      3
    );
  }

  static async getUserStats(userId: string) {
    const [user, productOrders, planOrders, activePlans] = await Promise.all([
      this.getUserById(userId),
      PrismaWrapper.execute(
        () => prisma.productOrder.count({
          where: { userId }
        }),
        3
      ),
      PrismaWrapper.execute(
        () => prisma.planOrder.count({
          where: { userId }
        }),
        3
      ),
      PrismaWrapper.execute(
        () => prisma.userPlan.count({
          where: {
            userId,
            isActive: true,
            endDate: {
              gte: new Date()
            }
          }
        }),
        3
      )
    ]);

    return {
      user,
      stats: {
        totalProductOrders: productOrders,
        totalPlanOrders: planOrders,
        activePlans
      }
    };
  }

  static async searchUsers(query: string, limit: number = 10) {
    return await PrismaWrapper.execute(
      () => prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          image: true,
          sede: {
            select: {
              id: true,
              nombre: true
            }
          }
        },
        take: limit
      }),
      3
    );
  }
}
