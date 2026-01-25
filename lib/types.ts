import { Role } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  sedeId: string | null;
  sedeName: string | null;
}

export interface SedeWithRelations {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string | null;
  descripcion: string;
  imagen: string | null;
  latitud: number;
  longitud: number;
  horario: string;
  activo: boolean;
}

export interface PlanWithSedes {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  beneficios: string[];
  duracion: string;
  tipo: string;
  esVip: boolean;
  activo: boolean;
  destacado: boolean;
  sedes: { sede: { id: string; nombre: string } }[];
}

export interface NoticiaWithSede {
  id: string;
  titulo: string;
  contenido: string;
  resumen: string | null;
  imagen: string | null;
  sedeId: string | null;
  sede: { id: string; nombre: string } | null;
  esPromocion: boolean;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  activo: boolean;
  destacado: boolean;
  fechaPublicacion: Date;
}

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }
}
