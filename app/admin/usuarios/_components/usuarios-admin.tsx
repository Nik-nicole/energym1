"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Edit,
  Plus,
  Calendar,
  MapPin,
  Package,
  UserCheck,
  UserX,
  Crown,
  Search,
  Filter,
  Power,
  PowerOff,
} from "lucide-react";
import { toast } from "sonner";

interface Sede {
  id: string;
  nombre: string;
}

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  duracion: string;
  isActive?: boolean;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  role: string;
  image: string | null;
  sedeId: string | null;
  sede: Sede | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  planActivo?: {
    id: string;
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
    isActive?: boolean;
  } | null;
}

interface UsuariosAdminProps {
  users: User[];
  sedes: Sede[];
  plans: Plan[];
}

export function UsuariosAdmin({ users, sedes, plans }: UsuariosAdminProps) {
  const [usersList, setUsersList] = useState<User[]>(users);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "CLIENTE",
    sedeId: sedes.length > 0 ? sedes[0].id : "",
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'create' | 'toggle' | 'plan';
    user?: User;
    isActive?: boolean;
    plan?: Plan;
  }>({ type: 'create' });

  const [planFormData, setPlanFormData] = useState({
    planId: "",
    fechaInicio: "",
    fechaFin: "",
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "CLIENTE",
      sedeId: sedes.length > 0 ? sedes[0].id : "",
      isActive: true,
    });
    setFormErrors({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "",
    });
  };

  const resetPlanForm = () => {
    setPlanFormData({
      planId: "",
      fechaInicio: "",
      fechaFin: "",
      isActive: true,
    });
  };

  // Filtrar usuarios
  const filteredUsers = usersList.filter((user) => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const validateForm = () => {
    const errors = {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "",
    };

    // Validación de nombre
    if (!formData.firstName.trim()) {
      errors.firstName = "El nombre es requerido";
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = "El nombre debe tener al menos 2 caracteres";
    }

    // Validación de apellido
    if (formData.lastName && formData.lastName.trim().length < 2) {
      errors.lastName = "El apellido debe tener al menos 2 caracteres";
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "El email es requerido";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "El email no es válido";
    }

    // Validación de contraseña
    if (!formData.password) {
      errors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = "La contraseña debe contener mayúsculas, minúsculas y números";
    }

    // Validación de confirmación de contraseña
    if (!formData.confirmPassword) {
      errors.confirmPassword = "La confirmación de contraseña es requerida";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
    }

    // Validación de rol
    if (!formData.role) {
      errors.role = "El rol es requerido";
    }

    setFormErrors(errors);
    
    // Verificar si hay errores
    return Object.values(errors).some(error => error !== "");
  };

  const handleCreate = async () => {
    // Validar formulario
    if (validateForm()) {
      return;
    }

    // Verificar si el email ya existe en la lista actual
    const emailExists = usersList.some(user => 
      user.email.toLowerCase() === formData.email.toLowerCase()
    );
    
    if (emailExists) {
      setFormErrors(prev => ({ ...prev, email: "El email ya está registrado" }));
      return;
    }

    // Mostrar diálogo de confirmación
    setConfirmAction({ type: 'create' });
    setShowConfirmDialog(true);
  };

  const confirmCreate = async () => {
    setIsLoading(true);
    setShowConfirmDialog(false);
    
    try {
      const response = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim() || null,
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: formData.role,
          sedeId: formData.sedeId || null,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear usuario");
      }

      const newUser = await response.json();
      setUsersList([...usersList, newUser]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Usuario creado exitosamente");
    } catch (error) {
      console.error("Error creating user:", error);
      
      let errorMessage = "Error al crear usuario";
      
      if (error instanceof Error) {
        if (error.message.includes("ya existe")) {
          errorMessage = "El email ya está registrado. Por favor usa otro email.";
          setFormErrors(prev => ({ ...prev, email: "El email ya está registrado" }));
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName || "",
      email: user.email,
      password: "",
      confirmPassword: "",
      role: user.role,
      sedeId: user.sedeId || "",
      isActive: user.isActive !== false,
    });
    setFormErrors({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingUser || !formData.firstName || !formData.email) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Por favor ingresa un email válido");
      return;
    }

    // Validación de contraseña solo si se proporciona una nueva
    if (formData.password && formData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/usuarios/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar usuario");
      }

      const updatedUser = await response.json();
      setUsersList(usersList.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      setIsEditDialogOpen(false);
      setEditingUser(null);
      resetForm();
      toast.success("Usuario actualizado exitosamente");
    } catch (error) {
      console.error("Error updating user:", error);
      let errorMessage = "Error al actualizar usuario";
      
      if (error instanceof Error) {
        if (error.message.includes("ya existe")) {
          errorMessage = "El email ya está en uso por otro usuario.";
        } else if (error.message.includes("contraseña")) {
          errorMessage = "La contraseña debe tener al menos 6 caracteres.";
        } else if (error.message.includes("email válido")) {
          errorMessage = "Por favor ingresa un email válido.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (userId: string) => {
    const user = usersList.find(u => u.id === userId);
    if (!user) return;
    
    setConfirmAction({ 
      type: 'toggle', 
      user, 
      isActive: user.isActive 
    });
    setShowConfirmDialog(true);
  };

  const confirmToggleActive = async () => {
    if (!confirmAction.user) return;
    
    setIsLoading(true);
    setShowConfirmDialog(false);
    
    try {
      const response = await fetch(`/api/admin/usuarios/${confirmAction.user.id}/toggle-active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !confirmAction.isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cambiar estado");
      }

      const updatedUser = await response.json();
      setUsersList(usersList.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      toast.success(`Usuario ${!confirmAction.isActive ? "activado" : "desactivado"} exitosamente`);
    } catch (error) {
      console.error("Error toggling user active status:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignPlan = async () => {
    if (!selectedUser || !planFormData.planId || !planFormData.fechaInicio || !planFormData.fechaFin) {
      toast.error("Por favor completa todos los campos del plan");
      return;
    }

    setIsLoading(true);
    setIsPlanDialogOpen(false);
    
    try {
      const response = await fetch(`/api/admin/usuarios/${selectedUser.id}/assign-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: planFormData.planId,
          fechaInicio: planFormData.fechaInicio,
          fechaFin: planFormData.fechaFin,
          isActive: planFormData.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al asignar plan");
      }

      const updatedUser = await response.json();
      setUsersList(usersList.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      setSelectedUser(null);
      resetPlanForm();
      setIsPlanDialogOpen(false);
      toast.success("Plan asignado exitosamente");
    } catch (error) {
      console.error("Error assigning plan:", error);
      toast.error(error instanceof Error ? error.message : "Error al asignar plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePlan = async (userId: string, planId: string, isActive: boolean) => {
    const user = usersList.find(u => u.id === userId);
    if (!user) return;
    
    setConfirmAction({ 
      type: 'plan', 
      user, 
      plan: plans.find(p => p.id === planId),
      isActive 
    });
    setShowConfirmDialog(true);
  };

  const confirmTogglePlan = async () => {
    if (!confirmAction.user || !confirmAction.plan) return;
    
    setIsLoading(true);
    setShowConfirmDialog(false);
    
    try {
      const response = await fetch(`/api/admin/usuarios/${confirmAction.user.id}/toggle-plan`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: confirmAction.plan.id,
          isActive: !confirmAction.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cambiar estado del plan");
      }

      const updatedUser = await response.json();
      setUsersList(usersList.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      toast.success(`Plan ${!confirmAction.isActive ? "activado" : "desactivado"} exitosamente`);
    } catch (error) {
      console.error("Error toggling plan status:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado del plan");
    } finally {
      setIsLoading(false);
    }
  };

  const openPlanDialog = (user: User) => {
    setSelectedUser(user);
    setShowPlanDialog(true);
  };

  const openTogglePlanDialog = (user: User) => {
    setSelectedUser(user);
    // Buscar el plan actual del usuario
    const currentPlan = user.planActivo;
    if (currentPlan) {
      setConfirmAction({ 
        type: 'plan', 
        user, 
        plan: {
          id: currentPlan.id,
          nombre: currentPlan.nombre,
          precio: 0,
          duracion: '',
          isActive: currentPlan.isActive !== false 
        },
        isActive: currentPlan.isActive !== false 
      });
      setShowConfirmDialog(true);
    } else {
      toast.error("Este usuario no tiene un plan asignado");
    }
  };
        return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Usuarios</h1>
          <p className="text-[#A0A0A0]">
            Gestiona los usuarios y sus planes
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gradient-bg hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#141414] border-[#1E1E1E]">
            <DialogHeader>
              <DialogTitle className="gradient-text">Crear Nuevo Usuario</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-[#F8F8F8]">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Nombre"
                    className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                  />
                  {formErrors.firstName && (
                    <p className="text-xs text-red-400">{formErrors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido" className="text-[#F8F8F8]">Apellido</Label>
                  <Input
                    id="apellido"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Apellido"
                    className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                  />
                  {formErrors.lastName && (
                    <p className="text-xs text-red-400">{formErrors.lastName}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#F8F8F8]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email"
                  className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                />
                {formErrors.email && (
                  <p className="text-xs text-red-400">{formErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#F8F8F8]">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Contraseña"
                  className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                />
                {formErrors.password && (
                  <p className="text-xs text-red-400">{formErrors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#F8F8F8]">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirmar contraseña"
                  className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                />
                {formErrors.confirmPassword && (
                  <p className="text-xs text-red-400">{formErrors.confirmPassword}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rol" className="text-[#F8F8F8]">Rol</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white">
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141414] border-[#1E1E1E]">
                      <SelectItem value="CLIENTE">Cliente</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sede" className="text-[#F8F8F8]">Sede (opcional)</Label>
                  <Select
                    value={formData.sedeId}
                    onValueChange={(value) => setFormData({ ...formData, sedeId: value })}
                  >
                    <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white">
                      <SelectValue placeholder="Seleccionar sede (opcional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141414] border-[#1E1E1E]">
                    {sedes.map((sede) => (
                      <SelectItem key={sede.id} value={sede.id}>
                        {sede.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="activo" className="text-[#F8F8F8]">Usuario activo</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white">
                Cancelar
              </Button>
              <Button onClick={handleCreate} className="gradient-bg hover:opacity-90">
                Validar y Crear
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A0A0A0]" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#141414] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-48 bg-[#141414] border-[#1E1E1E] text-white">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent className="bg-[#141414] border-[#1E1E1E]">
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="CLIENTE">Clientes</SelectItem>
            <SelectItem value="ADMIN">Administradores</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-[#141414] border-[#1E1E1E] rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-[#0A0A0A]">
            <TableRow>
              <TableHead className="text-[#F8F8F8]">Usuario</TableHead>
              <TableHead className="text-[#F8F8F8]">Email</TableHead>
              <TableHead className="text-[#F8F8F8]">Rol</TableHead>
              <TableHead className="text-[#F8F8F8]">Sede</TableHead>
              <TableHead className="text-[#F8F8F8]">Plan</TableHead>
              <TableHead className="text-[#F8F8F8]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="border-b border-[#1E1E1E] hover:bg-[#0A0A0A]">
                <TableCell className="text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#1E1E1E] rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-[#A0A0A0]" />
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-[#A0A0A0]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-[#A0A0A0]">{user.email}</TableCell>
                <TableCell className="text-[#A0A0A0]">
                  <Badge className={user.role === "ADMIN" ? "gradient-bg text-white" : "bg-[#1E1E1E] text-[#A0A0A0]"}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-[#A0A0A0]">
                  {user.sede ? user.sede.nombre : "Sin sede"}
                </TableCell>
                <TableCell className="text-[#A0A0A0]">
                  {user.planActivo ? (
                    <div className="flex items-center gap-1">
                      <Crown className="h-3 w-3 text-[#D604E0]" />
                      <span className="text-xs">{user.planActivo.nombre}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#A0A0A0]">Sin plan</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                      className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white px-3 py-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    {user.role !== "ADMIN" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPlanDialog(user)}
                          className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white px-3 py-1"
                        >
                          <Crown className="h-4 w-4 mr-1" />
                          Ver Plan
                        </Button>
                        {user.planActivo && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openTogglePlanDialog(user)}
                            className={`${
                              user.planActivo.isActive !== false 
                                ? "border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-orange-400" 
                                : "border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                            } px-3 py-1`}
                          >
                            {user.planActivo.isActive !== false ? (
                              <>
                                <PowerOff className="h-4 w-4 mr-1" />
                                Desactivar Plan
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-1" />
                                Activar Plan
                              </>
                            )}
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      variant={user.isActive !== false ? "outline" : "outline"}
                      size="sm"
                      onClick={() => handleToggleActive(user.id)}
                      className={`${
                        user.isActive !== false 
                          ? "border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-red-400" 
                          : "border-red-500/50 text-red-400 hover:bg-red-500/10"
                      } px-3 py-1`}
                    >
                      {user.isActive !== false ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-1" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-1" />
                          Activar
                        </>
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#141414] border-[#1E1E1E]">
          <DialogHeader>
            <DialogTitle className="gradient-text">Editar Usuario</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nombre" className="text-[#F8F8F8]">Nombre</Label>
                <Input
                  id="edit-nombre"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Nombre"
                  className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-apellido" className="text-[#F8F8F8]">Apellido</Label>
                <Input
                  id="edit-apellido"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Apellido"
                  className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-[#F8F8F8]">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email"
                className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password" className="text-[#F8F8F8]">Nueva Contraseña (dejar en blanco para no cambiar)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Nueva contraseña"
                className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-rol" className="text-[#F8F8F8]">Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#141414] border-[#1E1E1E]">
                    <SelectItem value="CLIENTE">Cliente</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sede" className="text-[#F8F8F8]">Sede (opcional)</Label>
                <Select
                  value={formData.sedeId}
                  onValueChange={(value) => setFormData({ ...formData, sedeId: value })}
                >
                  <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white">
                    <SelectValue placeholder="Seleccionar sede (opcional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#141414] border-[#1E1E1E]">
                    {sedes.map((sede) => (
                      <SelectItem key={sede.id} value={sede.id}>
                        {sede.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-activo"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-activo" className="text-[#F8F8F8]">Usuario activo</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white">
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading} className="gradient-bg hover:opacity-90">
              {isLoading ? "Actualizando..." : "Actualizar Usuario"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan View Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-md bg-[#141414] border-[#1E1E1E]">
          <DialogHeader>
            <DialogTitle className="gradient-text">Información del Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[#F8F8F8]">Usuario</Label>
              <div className="p-2 bg-[#0A0A0A] rounded border border-[#1E1E1E]">
                {selectedUser?.firstName} {selectedUser?.lastName}
              </div>
            </div>
            {selectedUser?.planActivo ? (
              <>
                <div className="space-y-2">
                  <Label className="text-[#F8F8F8]">Plan Asignado</Label>
                  <div className="p-3 bg-[#0A0A0A] rounded border border-[#1E1E1E]">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-4 w-4 text-[#D604E0]" />
                      <span className="font-medium text-white">{selectedUser.planActivo.nombre}</span>
                    </div>
                    <div className="space-y-1 text-sm text-[#A0A0A0]">
                      <p><span className="text-[#A0A0A0]">Fecha de inicio:</span> {new Date(selectedUser.planActivo.fechaInicio).toLocaleDateString()}</p>
                      <p><span className="text-[#A0A0A0]">Fecha de fin:</span> {new Date(selectedUser.planActivo.fechaFin).toLocaleDateString()}</p>
                      <p><span className="text-[#A0A0A0]">Estado:</span> 
                        <span className={`ml-1 ${selectedUser.planActivo.isActive !== false ? 'text-green-400' : 'text-red-400'}`}>
                          {selectedUser.planActivo.isActive !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowPlanDialog(false)}
                    className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white"
                  >
                    Cerrar
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Crown className="h-12 w-12 text-[#A0A0A0] mx-auto mb-3" />
                <p className="text-[#A0A0A0]">Este usuario no tiene un plan asignado</p>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPlanDialog(false)}
                    className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md bg-[#141414] border-[#1E1E1E]">
          <DialogHeader>
            <DialogTitle className="gradient-text">
              {confirmAction.type === 'create' ? 'Confirmar Creación de Usuario' : 'Confirmar Cambio de Estado'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {confirmAction.type === 'create' ? (
              <>
                <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#1E1E1E]">
                  <h4 className="font-medium text-white mb-2">Datos del Nuevo Usuario:</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-[#A0A0A0]">Nombre:</span> <span className="text-white">{formData.firstName} {formData.lastName}</span></p>
                    <p><span className="text-[#A0A0A0]">Email:</span> <span className="text-white">{formData.email}</span></p>
                    <p><span className="text-[#A0A0A0]">Rol:</span> <span className="text-white">{formData.role}</span></p>
                    <p><span className="text-[#A0A0A0]">Estado:</span> <span className="text-white">{formData.isActive ? "Activo" : "Inactivo"}</span></p>
                  </div>
                </div>
                <p className="text-[#A0A0A0] text-sm">
                  ¿Estás seguro de que deseas crear este usuario? Esta acción no se puede deshacer.
                </p>
              </>
            ) : (
              <>
                <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#1E1E1E]">
                  <h4 className="font-medium text-white mb-2">Usuario:</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-[#A0A0A0]">Nombre:</span> <span className="text-white">{confirmAction.user?.firstName} {confirmAction.user?.lastName}</span></p>
                    <p><span className="text-[#A0A0A0]">Email:</span> <span className="text-white">{confirmAction.user?.email}</span></p>
                    <p><span className="text-[#A0A0A0]">Estado actual:</span> <span className={`text-white ${confirmAction.isActive ? 'text-green-400' : 'text-red-400'}`}>
                      {confirmAction.isActive ? 'Activo' : 'Inactivo'}
                    </span></p>
                  </div>
                </div>
                <p className="text-[#A0A0A0] text-sm">
                  ¿Estás seguro de que deseas {confirmAction.isActive ? 'desactivar' : 'activar'} este usuario? 
                  {confirmAction.isActive ? (
                    <span className="text-red-400"> El usuario no podrá iniciar sesión.</span>
                  ) : (
                    <span className="text-green-400"> El usuario podrá volver a iniciar sesión.</span>
                  )}
                </p>
              </>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white"
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmAction.type === 'create' ? confirmCreate : confirmToggleActive} 
              disabled={isLoading}
              className={`${
                confirmAction.type === 'toggle' && confirmAction.isActive 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'gradient-bg hover:opacity-90'
              }`}
            >
              {isLoading ? (
                confirmAction.type === 'create' ? "Creando..." : "Procesando..."
              ) : (
                confirmAction.type === 'create' 
                  ? "Confirmar Creación" 
                  : confirmAction.isActive 
                    ? "Confirmar Desactivación" 
                    : "Confirmar Activación"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
