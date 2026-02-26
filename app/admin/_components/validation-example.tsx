"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFormValidation, getInputProps, getLabelProps } from "@/hooks/use-form-validation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function ValidationExample() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation rules
  const validationRules = {
    nombre: { required: true, message: "El nombre es obligatorio" },
    email: { 
      required: true, 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
      message: "El email no es válido" 
    },
    telefono: { 
      required: true, 
      pattern: /^[0-9]{10}$/, 
      message: "El teléfono debe tener 10 dígitos" 
    },
    direccion: { required: true, message: "La dirección es obligatoria" },
    ciudad: { required: true, message: "La ciudad es obligatoria" }
  };

  const { errors, validateForm, clearErrors, hasErrors } = useFormValidation(validationRules);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: ""
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      email: "",
      telefono: "",
      direccion: "",
      ciudad: ""
    });
    clearErrors();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario
    if (!validateForm(formData)) {
      toast.error("Por favor, completa todos los campos obligatorios");
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulación de envío
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Formulario enviado exitosamente");
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Error al enviar el formulario");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Ejemplo de Validación de Formularios</h1>
      <p className="text-gray-600 mb-6">
        Este ejemplo muestra cómo los campos obligatorios se marcan en rojo cuando no se completan al enviar el formulario.
      </p>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Abrir Formulario de Ejemplo
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>Formulario con Validación</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" {...getLabelProps(errors.nombre)}>
                Nombre *
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                placeholder="Juan Pérez"
                {...getInputProps(errors.nombre)}
              />
              {errors.nombre && (
                <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" {...getLabelProps(errors.email)}>
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="juan@ejemplo.com"
                {...getInputProps(errors.email)}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono" {...getLabelProps(errors.telefono)}>
                Teléfono *
              </Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                placeholder="3001234567"
                {...getInputProps(errors.telefono)}
              />
              {errors.telefono && (
                <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion" {...getLabelProps(errors.direccion)}>
                Dirección *
              </Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                placeholder="Calle 123 #45-67"
                {...getInputProps(errors.direccion)}
              />
              {errors.direccion && (
                <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ciudad" {...getLabelProps(errors.ciudad)}>
                Ciudad *
              </Label>
              <Input
                id="ciudad"
                value={formData.ciudad}
                onChange={(e) => handleInputChange('ciudad', e.target.value)}
                placeholder="Bogotá"
                {...getInputProps(errors.ciudad)}
              />
              {errors.ciudad && (
                <p className="text-red-500 text-sm mt-1">{errors.ciudad}</p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Características de la validación:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Los campos obligatorios se marcan con un asterisco (*)</li>
          <li>Al enviar el formulario, los campos vacíos se marcan en rojo</li>
          <li>Se muestran mensajes de error específicos para cada campo</li>
          <li>Los bordes de los campos inválidos se vuelven rojos</li>
          <li>Las etiquetas de los campos inválidos también se vuelven rojas</li>
          <li>El formulario no se envía hasta que todos los campos sean válidos</li>
        </ul>
      </div>
    </div>
  );
}
