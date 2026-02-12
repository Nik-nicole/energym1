"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, Crown, Camera, Dumbbell, Target, Award } from "lucide-react";
import { toast } from "sonner";

interface Admin {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminProfileProps {
  admin: Admin;
}

export function AdminProfile({ admin }: AdminProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: admin.firstName,
    lastName: admin.lastName || "",
    email: admin.email,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [currentImage, setCurrentImage] = useState(admin.image);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al subir la imagen');
      }

      const result = await response.json();
      setCurrentImage(result.imageUrl);
      toast.success('Imagen de perfil actualizada exitosamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Error al subir la imagen');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Error al actualizar perfil");

      const updatedAdmin = await response.json();
      
      // Update local state
      setFormData({
        ...formData,
        firstName: updatedAdmin.firstName,
        lastName: updatedAdmin.lastName || "",
        email: updatedAdmin.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      setIsEditing(false);
      toast.success("Perfil actualizado exitosamente");
    } catch (error) {
      toast.error("Error al actualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: admin.firstName,
      lastName: admin.lastName || "",
      email: admin.email,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsEditing(false);
  };

  const getInitials = (firstName: string, lastName: string | null) => {
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName ? lastName.charAt(0).toUpperCase() : "";
    return `${first}${last}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#141414] to-[#1A1A1A] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Mi Perfil</h1>
          <p className="text-gray-400">Gestiona tu información personal y configuración</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card - Enhanced Design */}
          <div className="lg:col-span-1">
            <Card className="bg-[#141414] border-[#1E1E1E] text-white overflow-hidden">
              {/* Cover Image */}
              <div className="h-32 bg-gradient-to-r from-[#D604E0] to-[#040AE0] relative">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-[#141414] cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <AvatarImage src={currentImage || ""} alt={admin.firstName} />
                      <AvatarFallback className="bg-[#D604E0] text-white text-2xl">
                        {getInitials(admin.firstName, admin.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-[#D604E0] hover:bg-[#D604E0]/90 border-2 border-[#141414]"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                    >
                      <Camera className="h-5 w-5" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              
              <CardContent className="pt-16 pb-6">
                <div className="text-center space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                      {admin.firstName} {admin.lastName}
                      <Crown className="h-5 w-5 text-yellow-500" />
                    </h2>
                    <Badge className="mt-2 bg-[#D604E0] hover:bg-[#D604E0]/90 text-white">
                      Administrador
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail className="h-4 w-4 text-[#D604E0]" />
                      {admin.email}
                    </div>
                  </div>
                  
                  <Separator className="bg-[#1E1E1E]" />
                  
                  {/* Gym Stats */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-400">Estadísticas del Gimnasio</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0A0A0A] p-3 rounded-lg text-center">
                        <Dumbbell className="h-6 w-6 text-[#D604E0] mx-auto mb-1" />
                        <div className="text-lg font-bold text-white">250+</div>
                        <div className="text-xs text-gray-400">Miembros</div>
                      </div>
                      <div className="bg-[#0A0A0A] p-3 rounded-lg text-center">
                        <Target className="h-6 w-6 text-[#040AE0] mx-auto mb-1" />
                        <div className="text-lg font-bold text-white">15</div>
                        <div className="text-xs text-gray-400">Planes</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Última actualización: {new Date(admin.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Form Card */}
            <Card className="bg-[#141414] border-[#1E1E1E] text-white">
              <CardHeader className="border-b border-[#1E1E1E]">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">Información Personal</CardTitle>
                  {!isEditing ? (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="bg-[#D604E0] hover:bg-[#D604E0]/90 text-white"
                    >
                      Editar Perfil
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handleCancel}
                        className="border-[#1E1E1E] text-white hover:bg-[#1E1E1E]"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleUpdate} 
                        disabled={isLoading}
                        className="bg-[#D604E0] hover:bg-[#D604E0]/90 text-white"
                      >
                        {isLoading ? "Guardando..." : "Guardar Cambios"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Información Básica</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-gray-400">Nombre</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Nombre"
                          className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-gray-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-gray-400">Apellido</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Apellido"
                          className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-gray-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-400">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Email"
                        className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-gray-500"
                      />
                    </div>
                  </div>

                  {/* Password Change */}
                  {isEditing && (
                    <>
                      <Separator className="bg-[#1E1E1E]" />
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Cambiar Contraseña</h3>
                        <p className="text-sm text-gray-400">
                          Deja estos campos en blanco si no quieres cambiar tu contraseña
                        </p>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="text-gray-400">Contraseña Actual</Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={formData.currentPassword}
                              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                              placeholder="Contraseña actual"
                              className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-gray-500"
                            />
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="newPassword" className="text-gray-400">Nueva Contraseña</Label>
                              <Input
                                id="newPassword"
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                placeholder="Nueva contraseña"
                                className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-gray-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword" className="text-gray-400">Confirmar Contraseña</Label>
                              <Input
                                id="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="Confirmar contraseña"
                                className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-gray-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Stats Card */}
            <Card className="bg-[#141414] border-[#1E1E1E] text-white">
              <CardHeader className="border-b border-[#1E1E1E]">
                <CardTitle className="text-xl">Estadísticas de Cuenta</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#1E1E1E]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#D604E0]/20 rounded-lg">
                        <User className="h-5 w-5 text-[#D604E0]" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white">ADMIN</div>
                        <div className="text-sm text-gray-400">Rol</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#1E1E1E]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#040AE0]/20 rounded-lg">
                        <Calendar className="h-5 w-5 text-[#040AE0]" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white">
                          {Math.floor(
                            (Date.now() - new Date(admin.createdAt).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}
                        </div>
                        <div className="text-sm text-gray-400">Días como admin</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#1E1E1E]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Award className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white">Nivel 5</div>
                        <div className="text-sm text-gray-400">Experiencia</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
