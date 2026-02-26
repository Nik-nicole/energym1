"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFormValidation } from "@/hooks/use-form-validation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function SimpleValidationTest() {
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
    direccion: { required: true, message: "La dirección es obligatoria" }
  };

  const { errors, validateForm, clearErrors } = useFormValidation(validationRules);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: ""
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      email: "",
      telefono: "",
      direccion: ""
    });
    clearErrors();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Validating form:", formData);
    console.log("Errors before validation:", errors);
    
    if (!validateForm(formData)) {
      console.log("Validation failed, errors:", errors);
      toast.error("Por favor, completa todos los campos obligatorios");
      return;
    }

    console.log("Validation passed!");
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

  // Helper function to get border class based on error
  const getBorderClass = (error: string) => {
    return error ? "border-red-500" : "border-gray-300";
  };

  // Helper function to get label class based on error
  const getLabelClass = (error: string) => {
    return error ? "text-red-500" : "text-gray-700";
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Prueba Simple de Validación</h1>
      <p className="text-gray-600 mb-6">
        Este componente prueba si la validación de campos obligatorios funciona correctamente.
      </p>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Abrir Formulario de Prueba
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>Formulario con Validación</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className={getLabelClass(errors.nombre)}>
                Nombre *
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                placeholder="Juan Pérez"
                className={`bg-white ${getBorderClass(errors.nombre)}`}
              />
              {errors.nombre && (
                <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className={getLabelClass(errors.email)}>
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="juan@ejemplo.com"
                className={`bg-white ${getBorderClass(errors.email)}`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono" className={getLabelClass(errors.telefono)}>
                Teléfono *
              </Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                placeholder="3001234567"
                className={`bg-white ${getBorderClass(errors.telefono)}`}
              />
              {errors.telefono && (
                <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion" className={getLabelClass(errors.direccion)}>
                Dirección *
              </Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                placeholder="Calle 123 #45-67"
                className={`bg-white ${getBorderClass(errors.direccion)}`}
              />
              {errors.direccion && (
                <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
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
