"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CustomSwitch } from "@/components/ui/custom-switch";
import { ControlledInput } from "@/components/ui/controlled-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ControlledTextarea } from "@/components/ui/controlled-textarea";
import { Textarea } from "@/components/ui/textarea";
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
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  Plus,
  Users,
  Package,
  Newspaper,
  Clock,
  Upload,
  Image as ImageIcon,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useFormValidation, getInputProps, getLabelProps } from "@/hooks/use-form-validation";
import { useErrorScroll } from "@/hooks/use-error-scroll";

const CIUDADES_COLOMBIA = [
  "Bogotá",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Cúcuta",
  "Ibagué",
  "Bucaramanga",
  "Soledad",
  "Santa Marta",
  "Villavicencio",
  "Manizales",
  "Pereira",
];

interface Sede {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string | null;
  descripcion: string;
  imagenes: string[];
  horario: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  paymentGatewayId?: string | null;
  paymentGateway?: {
    id: string;
    nombre: string;
    tipo: string;
    cuentaBanco: string;
  } | null;
  _count: {
    usuarios: number;
    productos: number;
    noticias: number;
    planesEnSede: number;
  };
}

interface PaymentGateway {
  id: string;
  nombre: string;
  tipo: string;
  cuentaBanco: string;
}

interface SedesAdminProps {
  sedes: Sede[];
}

export function SedesAdmin({ sedes }: SedesAdminProps) {
  const [sedesList, setSedesList] = useState<Sede[]>(sedes);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [viewingSede, setViewingSede] = useState<Sede | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Validation rules
  const validationRules = {
    nombre: { required: true, message: "El nombre es obligatorio" },
    direccion: { required: true, message: "La dirección es obligatoria" },
    ciudad: { required: true, message: "La ciudad es obligatoria" },
    telefono: { 
      required: true, 
      pattern: /^[0-9]{7,15}$/, 
      message: "El teléfono no es válido" 
    },
    descripcion: { required: true, message: "La descripción es obligatoria" }
  };

  const { errors, validateForm, clearErrors } = useFormValidation(validationRules);
  const { setFieldRef } = useErrorScroll(errors);

  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    ciudad: "",
    telefono: "",
    email: "",
    descripcion: "",
    imagenes: [] as string[],
    horario: "",
    activo: true,
    paymentGatewayId: "",
  });

  // Estado para horarios estructurados
  const [horarios, setHorarios] = useState([
    { dia: 'lunes', abierto: true, apertura: '09:00', cierre: '18:00' },
    { dia: 'martes', abierto: true, apertura: '09:00', cierre: '18:00' },
    { dia: 'miércoles', abierto: true, apertura: '09:00', cierre: '18:00' },
    { dia: 'jueves', abierto: true, apertura: '09:00', cierre: '18:00' },
    { dia: 'viernes', abierto: true, apertura: '09:00', cierre: '18:00' },
    { dia: 'sábado', abierto: false, apertura: '09:00', cierre: '14:00' },
    { dia: 'domingo', abierto: false, apertura: '09:00', cierre: '14:00' },
  ]);

  const [imagenFiles, setImagenFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState<{[key: string]: {name: string, progress: number, status: string}}>({});
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [autoSaveImages, setAutoSaveImages] = useState(true);

  // Función para subir imágenes con animaciones individuales
  const uploadImagesWithProgress = async (files: File[]): Promise<string[]> => {
    setShowUploadModal(true);
    setIsUploading(true);
    
    // Inicializar estado para cada imagen
    const imageStates: {[key: string]: {name: string, progress: number, status: string}} = {};
    files.forEach((file, index) => {
      const imageKey = `image_${index}`;
      imageStates[imageKey] = {
        name: file.name,
        progress: 0,
        status: 'Preparando...'
      };
    });
    setUploadingImages(imageStates);
    
    try {
      console.log(`Iniciando subida de ${files.length} imágenes con animaciones individuales...`);
      console.log('Archivos:', files.map(f => f.name));
      
      // Subir TODAS las imágenes en paralelo con animaciones individuales
      const uploadPromises = files.map(async (file, index) => {
        const imageKey = `image_${index}`;
        
        // Simular preparación
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Actualizar estado a "Subiendo..."
        setUploadingImages(prev => ({
          ...prev,
          [imageKey]: { ...prev[imageKey], status: 'Subiendo...', progress: 10 }
        }));
        
        try {
          console.log(`Subiendo imagen ${index + 1}:`, file.name, file.type, file.size);
          
          const formDataUpload = new FormData();
          formDataUpload.append('file', file);
          
          // Simular progreso durante la subida
          const progressInterval = setInterval(() => {
            setUploadingImages(prev => {
              const currentProgress = prev[imageKey].progress;
              if (currentProgress < 80) {
                return {
                  ...prev,
                  [imageKey]: { ...prev[imageKey], progress: currentProgress + 20 }
                };
              }
              return prev;
            });
          }, 300);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formDataUpload,
          });
          
          clearInterval(progressInterval);
          
          console.log(`Respuesta upload ${index + 1}:`, uploadResponse.status, uploadResponse.statusText);
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            console.log(`Upload exitoso ${index + 1}:`, uploadResult);
            
            // Actualizar a "Procesando..."
            setUploadingImages(prev => ({
              ...prev,
              [imageKey]: { ...prev[imageKey], status: 'Procesando...', progress: 90 }
            }));
            
            // Simular procesamiento
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Actualizar a "¡Completado!"
            setUploadingImages(prev => ({
              ...prev,
              [imageKey]: { ...prev[imageKey], status: '¡Completado!', progress: 100 }
            }));
            
            return uploadResult.url;
          } else {
            const errorText = await uploadResponse.text();
            console.error(`Error upload ${index + 1}:`, uploadResponse.status, errorText);
            
            setUploadingImages(prev => ({
              ...prev,
              [imageKey]: { ...prev[imageKey], status: 'Error al subir', progress: 0 }
            }));
            
            return null;
          }
        } catch (error) {
          console.error(`Error subiendo imagen ${index + 1}:`, error);
          
          setUploadingImages(prev => ({
            ...prev,
            [imageKey]: { ...prev[imageKey], status: 'Error al subir', progress: 0 }
          }));
          
          return null;
        }
      });
      
      // Esperar a que TODAS las imágenes se suban
      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(url => url !== null) as string[];
      
      console.log(`Subida completada: ${validUrls.length}/${files.length} imágenes exitosas`);
      console.log('URLs válidas:', validUrls);
      
      // IMPORTANTE: Agregar TODAS las imágenes al formulario DESPUÉS de que se suban todas
      setFormData(prev => {
        const currentUrls = prev.imagenes || [];
        const newUrls = [...currentUrls, ...validUrls].slice(0, 5);
        console.log(`TODAS las imágenes agregadas al formulario:`, newUrls);
        return { ...prev, imagenes: newUrls };
      });
      
      // Mantener el modal abierto por 2 segundos más para mostrar el estado final
      setTimeout(() => {
        setIsUploading(false);
      }, 2000);
      
      return validUrls;
      
    } catch (error) {
      console.error('Error general en la subida:', error);
      setIsUploading(false);
      
      return [];
    }
  };

  // Cargar pasarelas de pago
  useEffect(() => {
    const fetchPaymentGateways = async () => {
      try {
        const response = await fetch('/api/admin/payment-gateways');
        if (response.ok) {
          const data = await response.json();
          setPaymentGateways(data);
        }
      } catch (error) {
        console.error('Error fetching payment gateways:', error);
      }
    };

    fetchPaymentGateways();
  }, []);

  const resetForm = () => {
    setFormData({
      nombre: "",
      direccion: "",
      ciudad: "",
      telefono: "",
      email: "",
      descripcion: "",
      imagenes: [],
      horario: "",
      activo: true,
      paymentGatewayId: "",
    });
    setHorarios([
      { dia: 'lunes', abierto: true, apertura: '09:00', cierre: '18:00' },
      { dia: 'martes', abierto: true, apertura: '09:00', cierre: '18:00' },
      { dia: 'miércoles', abierto: true, apertura: '09:00', cierre: '18:00' },
      { dia: 'jueves', abierto: true, apertura: '09:00', cierre: '18:00' },
      { dia: 'viernes', abierto: true, apertura: '09:00', cierre: '18:00' },
      { dia: 'sábado', abierto: false, apertura: '09:00', cierre: '14:00' },
      { dia: 'domingo', abierto: false, apertura: '09:00', cierre: '14:00' },
    ]);
    setImagenFiles([]);
    clearErrors();
  };

  // Función para generar el string de horario
  const generarHorarioString = () => {
    const diasAbiertos = horarios.filter(h => h.abierto);
    if (diasAbiertos.length === 0) return 'Cerrado todos los días';
    
    const horarioString = diasAbiertos.map(h => 
      `${h.dia.charAt(0).toUpperCase() + h.dia.slice(1)}: ${h.apertura} - ${h.cierre}`
    ).join(' | ');
    
    return horarioString;
  };

  // Función para parsear horario string a array de horarios
  const parseHorarioString = (horarioString: string) => {
    const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    const horariosParsed = diasSemana.map(dia => ({
      dia,
      abierto: false,
      apertura: '09:00',
      cierre: '18:00'
    }));

    if (!horarioString || horarioString === 'Cerrado todos los días') {
      return horariosParsed;
    }

    // Parsear el string de horario
    const partes = horarioString.split('|');
    partes.forEach(parte => {
      // Usar regex que soporte caracteres con tildes y otros caracteres Unicode
      const match = parte.match(/([^:]+):\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
      if (match) {
        const [, dia, apertura, cierre] = match;
        const diaNormalizado = dia.toLowerCase().trim();
        const diaIndex = diasSemana.findIndex(d => d.toLowerCase() === diaNormalizado);
        if (diaIndex !== -1) {
          horariosParsed[diaIndex] = {
            dia: diasSemana[diaIndex],
            abierto: true,
            apertura,
            cierre
          };
        }
      }
    });

    return horariosParsed;
  };

  const handleCreate = async () => {
    // Validar formulario
    const formDataForValidation = {
      nombre: formData.nombre,
      direccion: formData.direccion,
      ciudad: formData.ciudad,
      telefono: formData.telefono,
      descripcion: formData.descripcion
    };

    if (!validateForm(formDataForValidation)) {
      toast.error("Por favor, completa todos los campos obligatorios");
      return;
    }

    // Generar el string de horario
    const horarioString = generarHorarioString();
    if (!horarioString || horarioString === 'Cerrado todos los días') {
      toast.error("Por favor configura al menos un día de atención");
      return;
    }

    setIsLoading(true);
    try {
      // Si hay archivos de imagen, subirlos al servidor
      // Nota: Las imágenes ya se subieron automáticamente al seleccionarlas
      const existingCloudinaryUrls = (formData.imagenes || []).filter(url => !url.startsWith('blob:'));
      let imagenesUrls: string[] = existingCloudinaryUrls;
      
      console.log('Imágenes finales (ya subidas):', imagenesUrls);
      
      if (imagenesUrls.length === 0) {
        // Si no hay imágenes, usar una por defecto
        imagenesUrls = ['https://cdn.abacus.ai/images/223406aa-b7ac-4de5-bd3a-93424a34a9e8.png'];
      }

      const response = await fetch("/api/admin/sedes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          telefono: formData.telefono,
          email: formData.email || null,
          descripcion: formData.descripcion,
          imagenes: imagenesUrls,
          horario: horarioString,
          activo: formData.activo,
          paymentGatewayId: formData.paymentGatewayId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear sede");
      }

      const newSede = await response.json();
      setSedesList([...sedesList, newSede]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Sede creada exitosamente");
    } catch (error) {
      console.error("Error creating sede:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear sede");
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleEdit = (sede: Sede) => {
    setEditingSede(sede);
    setFormData({
      nombre: sede.nombre,
      direccion: sede.direccion,
      ciudad: sede.ciudad,
      telefono: sede.telefono,
      email: sede.email || "",
      descripcion: sede.descripcion,
      imagenes: sede.imagenes || [],
      horario: sede.horario,
      activo: sede.activo,
      paymentGatewayId: sede.paymentGatewayId || "",
    });
    // Parsear y cargar los horarios existentes
    const horariosParsed = parseHorarioString(sede.horario);
    setHorarios(horariosParsed);
    setIsEditDialogOpen(true);
  };

  const handleView = (sede: Sede) => {
    setViewingSede(sede);
    setIsViewDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingSede) return;

    setIsLoading(true);
    try {
      // Generar el string de horario
      const horarioString = generarHorarioString();
      if (!horarioString || horarioString === 'Cerrado todos los días') {
        toast.error("Por favor configura al menos un día de atención");
        setIsLoading(false);
        return;
      }

      // Nota: las imágenes se suben al seleccionarlas; aquí solo persistimos las URLs de Cloudinary
      const imagenesUrls = (formData.imagenes || []).filter((url) => !url.startsWith('blob:'));
      console.log('Imágenes finales (solo Cloudinary):', imagenesUrls);

      const payload = {
        ...formData,
        imagenes: imagenesUrls,
        horario: horarioString,
      };
      
      console.log('[Sede Update] Enviando payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`/api/admin/sedes/${editingSede.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log('[Sede Update] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Sede Update] Error response:', errorText);
        throw new Error("Error al actualizar sede");
      }

      const updatedSede = await response.json();
      console.log('[Sede Update] Sede actualizada:', updatedSede);
      
      setSedesList(sedesList.map((s) => (s.id === updatedSede.id ? updatedSede : s)));
      setIsEditDialogOpen(false);
      setEditingSede(null);
      resetForm();
      toast.success("Sede actualizada exitosamente");
    } catch (error) {
      console.error('[Sede Update] Error:', error);
      toast.error("Error al actualizar sede");
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/sedes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar sede");

      const result = await response.json();
      setSedesList(sedesList.filter((s) => s.id !== id));
      
      // Mostrar mensaje detallado con estadísticas
      const stats = result.estadisticas;
      let mensaje = "Sede eliminada exitosamente";
      
      if (stats) {
        const detalles = [];
        if (stats.usuariosDesvinculados > 0) {
          detalles.push(`${stats.usuariosDesvinculados} usuarios desvinculados`);
        }
        if (stats.productosEliminados > 0) {
          detalles.push(`${stats.productosEliminados} productos eliminados`);
        }
        if (stats.noticiasDesvinculadas > 0) {
          detalles.push(`${stats.noticiasDesvinculadas} noticias desvinculadas`);
        }
        if (stats.planesEliminados > 0) {
          detalles.push(`${stats.planesEliminados} planes eliminados`);
        }
        
        if (detalles.length > 0) {
          mensaje += ` (${detalles.join(", ")})`;
        }
      }
      
      toast.success(mensaje);
    } catch (error) {
      toast.error("Error al eliminar sede");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Sedes</h1>
          <p className="text-[#A0A0A0]">
            Gestiona las sedes de tu negocio
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gradient-bg hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Sede
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#141414] border-[#1E1E1E]">
            <DialogHeader>
              <DialogTitle className="gradient-text">Crear Nueva Sede</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" {...getLabelProps(errors.nombre)}>Nombre *</Label>
                  <ControlledInput
                    id="nombre"
                    ref={setFieldRef('nombre')}
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre de la sede"
                    maxLength={100}
                    showCharCount={true}
                    showWarning={true}
                    className={`bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0] ${getInputProps(errors.nombre).className}`}
                  />
                  {errors.nombre && (
                    <p className="text-xs text-red-400">{errors.nombre}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ciudad" {...getLabelProps(errors.ciudad)}>Ciudad *</Label>
                  <Select
                    value={formData.ciudad}
                    onValueChange={(value) => setFormData({ ...formData, ciudad: value })}
                  >
                    <SelectTrigger className={`bg-[#0A0A0A] border-[#1E1E1E] text-white ${errors.ciudad ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Seleccionar ciudad" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141414] border-[#1E1E1E]">
                      {CIUDADES_COLOMBIA.map((ciudad) => (
                        <SelectItem key={ciudad} value={ciudad} className="text-white">
                          {ciudad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.ciudad && (
                    <p className="text-xs text-red-400">{errors.ciudad}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion" {...getLabelProps(errors.direccion)}>Dirección *</Label>
                <ControlledTextarea
                  id="direccion"
                  ref={setFieldRef('direccion')}
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Dirección completa"
                  rows={3}
                  maxLength={500}
                  showCharCount={true}
                  showWarning={true}
                  className={`bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0] ${getInputProps(errors.direccion).className}`}
                />
                {errors.direccion && (
                  <p className="text-xs text-red-400">{errors.direccion}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono" {...getLabelProps(errors.telefono)}>Teléfono *</Label>
                  <ControlledInput
                    id="telefono"
                    ref={setFieldRef('telefono')}
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="3001234567"
                    maxLength={15}
                    showCharCount={true}
                    showWarning={true}
                    className={`bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0] ${getInputProps(errors.telefono).className}`}
                  />
                  {errors.telefono && (
                    <p className="text-xs text-red-400">{errors.telefono}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#F8F8F8]">Email</Label>
                  <ControlledInput
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@ejemplo.com"
                    maxLength={100}
                    showCharCount={true}
                    showWarning={true}
                    className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion" {...getLabelProps(errors.descripcion)}>Descripción *</Label>
                <ControlledTextarea
                  id="descripcion"
                  ref={setFieldRef('descripcion')}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción de la sede"
                  rows={4}
                  maxLength={1000}
                  showCharCount={true}
                  showWarning={true}
                  className={`bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0] ${getInputProps(errors.descripcion).className}`}
                />
                {errors.descripcion && (
                  <p className="text-xs text-red-400">{errors.descripcion}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentGateway" className="text-[#F8F8F8]">Cuenta de Pago</Label>
                <Select
                  value={formData.paymentGatewayId}
                  onValueChange={(value) => setFormData({ ...formData, paymentGatewayId: value })}
                >
                  <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]">
                    <SelectValue placeholder="Selecciona una cuenta de pago" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-[#1E1E1E]">
                    {paymentGateways.map((gateway) => (
                      <SelectItem
                        key={gateway.id}
                        value={gateway.id}
                        className="text-white hover:bg-[#1E1E1E] focus:bg-[#D604E0]"
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{gateway.nombre}</div>
                            <div className="text-xs text-[#A0A0A0]">{gateway.tipo}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-[#F8F8F8]">Descripción *</Label>
                <ControlledTextarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción de la sede"
                  maxLength={500}
                  showCharCount={true}
                  showWarning={true}
                  rows={3}
                  className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[#F8F8F8] font-medium">Horario de Atención</Label>
                <div className="border border-[#1E1E1E] rounded-xl p-4 bg-[#0A0A0A]">
                  {/* Header del horario */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E1E1E]">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#D604E0]" />
                      <span className="text-sm font-medium text-white">Configurar días y horas</span>
                    </div>
                    <div className="text-xs text-[#A0A0A0]">
                      Activa los días que atiendes
                    </div>
                  </div>
                  
                  {/* Lista de días */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                    {horarios.map((horario, index) => (
                      <div 
                        key={horario.dia} 
                        className="flex items-center justify-between p-3 rounded-lg border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:border-[#D604E0]/30 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <CustomSwitch
                            checked={horario.abierto}
                            onCheckedChange={(checked) => {
                              const nuevosHorarios = [...horarios];
                              nuevosHorarios[index].abierto = checked;
                              setHorarios(nuevosHorarios);
                            }}
                          />
                          <div className="flex flex-col">
                            <span className={`text-sm font-semibold capitalize ${
                              horario.abierto ? 'text-white' : 'text-[#606060]'
                            }`}>
                              {horario.dia}
                            </span>
                            {!horario.abierto && (
                              <span className="text-xs text-[#606060]">Cerrado</span>
                            )}
                          </div>
                        </div>
                        
                        {horario.abierto && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-[#A0A0A0]">De</span>
                              <Input
                                type="time"
                                value={horario.apertura}
                                onChange={(e) => {
                                  const nuevosHorarios = [...horarios];
                                  nuevosHorarios[index].apertura = e.target.value;
                                  setHorarios(nuevosHorarios);
                                }}
                                className="w-28 h-9 text-sm bg-[#141414] border-[#2A2A2A] text-white focus:border-[#D604E0] transition-colors"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-[#A0A0A0]">a</span>
                              <Input
                                type="time"
                                value={horario.cierre}
                                onChange={(e) => {
                                  const nuevosHorarios = [...horarios];
                                  nuevosHorarios[index].cierre = e.target.value;
                                  setHorarios(nuevosHorarios);
                                }}
                                className="w-28 h-9 text-sm bg-[#141414] border-[#2A2A2A] text-white focus:border-[#D604E0] transition-colors"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Resumen del horario */}
                  <div className="mt-4 pt-3 border-t border-[#1E1E1E]">
                    <div className="bg-[#141414] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-[#A0A0A0]">Vista previa:</span>
                      </div>
                      <p className="text-xs text-white leading-relaxed">
                        {generarHorarioString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imagenes" className="text-[#F8F8F8]">Imágenes de la Sede (hasta 5)</Label>
                <div className="border-2 border-dashed border-[#1E1E1E] rounded-lg p-4">
                  <input
                    type="file"
                    id="imagenes"
                    accept="image/*"
                    multiple
                    max="5"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      console.log('Archivos seleccionados:', files.length, files.map(f => f.name));
                      
                      if (files.length > 0) {
                        const validFiles = files.slice(0, 5); // Limitar a 5 imágenes
                        console.log('Archivos válidos:', validFiles.length, validFiles.map(f => f.name));
                        
                        // Subir todas las imágenes con progreso (se agregarán automáticamente al formulario)
                        await uploadImagesWithProgress(validFiles);
                        
                        // Limpiar el input para permitir seleccionar más imágenes
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="imagenes"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    {(formData.imagenes.length > 0 || imagenFiles.length > 0) ? (
                      <div className="w-full">
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {formData.imagenes.slice(0, 5).map((img, index) => (
                            <div key={index} className="relative">
                              <img
                                src={img}
                                alt={`Preview ${index + 1}`}
                                className="h-20 w-20 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const newImagenes = formData.imagenes.filter((_, i) => i !== index);
                                  const newFiles = imagenFiles.filter((_, i) => i !== index);
                                  setFormData({ ...formData, imagenes: newImagenes });
                                  setImagenFiles(newFiles);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {formData.imagenes.length < 5 && (
                            <div className="h-20 w-20 border-2 border-dashed border-[#1E1E1E] rounded-lg flex items-center justify-center">
                              <Plus className="h-6 w-6 text-[#A0A0A0]" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-[#A0A0A0] text-center">
                          {formData.imagenes.length}/5 imágenes
                        </p>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="h-12 w-12 text-[#A0A0A0] mb-2" />
                        <p className="text-sm text-[#A0A0A0]">Click para subir imágenes</p>
                        <p className="text-xs text-[#A0A0A0]">PNG, JPG hasta 10MB • Máximo 5 imágenes</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CustomSwitch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label htmlFor="activo" className="text-[#F8F8F8]">Sede activa</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white">
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={isLoading || isUploading} className="gradient-bg hover:opacity-90">
                  {isLoading ? "Creando..." : "Crear Sede"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid de Sedes - Estilo Landing Page */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sedesList.map((sede) => (
          <div key={sede.id}>
            <div
              onClick={() => handleView(sede)}
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
            >
              <div className="relative overflow-hidden rounded-2xl bg-[#141414] border border-[#1E1E1E] hover:border-[#D604E0]/50 transition-all duration-300">
                {/* Imagen de la sede */}
                <div className="relative h-64 overflow-hidden">
                  {sede.imagenes && sede.imagenes.length > 0 ? (
                    <img
                      src={sede.imagenes[0]}
                      alt={sede.nombre}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#D604E0]/20 to-[#3B82F6]/20 flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-[#A0A0A0]" />
                    </div>
                  )}
                  
                  {/* Overlay con información sobre la imagen */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-[#D604E0] transition-colors duration-300">
                            {sede.nombre}
                          </h3>
                          <div className="flex items-center text-white/80 text-sm">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{sede.ciudad}</span>
                          </div>
                        </div>
                        {/* Badge de estado con fondo sólido */}
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          sede.activo 
                            ? 'bg-green-500 text-white border border-green-600' 
                            : 'bg-red-500 text-white border border-red-600'
                        }`}>
                          {sede.activo ? 'Activa' : 'Inactiva'}
                        </div>
                      </div>
                      
                      {/* Información esencial: ubicación, teléfono y email */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-white/70 text-xs">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{sede.direccion}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70 text-xs">
                          <Phone className="h-3 w-3" />
                          <span>{sede.telefono}</span>
                        </div>
                        {sede.email && (
                          <div className="flex items-center gap-2 text-white/70 text-xs">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{sede.email}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Estadísticas minimalistas */}
                      <div className="flex items-center gap-4 text-white/60 text-xs">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{sede._count.usuarios}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          <span>{sede._count.productos}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Newspaper className="h-3 w-3" />
                          <span>{sede._count.noticias}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Botones de acción con colores de la página */}
                <div className="p-4 bg-[#141414]">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(sede);
                      }}
                      className="flex-1 border-[#D604E0]/50 text-[#D604E0] hover:bg-[#D604E0]/10 hover:border-[#D604E0] hover:text-white transition-all duration-200"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        // Abrir diálogo de eliminación manualmente
                        const deleteDialog = document.getElementById(`delete-dialog-${sede.id}`);
                        if (deleteDialog) {
                          deleteDialog.click();
                        }
                      }}
                      className="flex-1 border-[#3B82F6]/50 text-[#3B82F6] hover:bg-[#3B82F6]/10 hover:border-[#3B82F6] hover:text-white transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* AlertDialog separado fuera del contenedor con onClick */}
            <AlertDialog>
              <AlertDialogTrigger id={`delete-dialog-${sede.id}`} className="hidden" />
              <AlertDialogContent className="bg-[#141414] border-[#1E1E1E]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">¿Eliminar sede permanentemente?</AlertDialogTitle>
                  <AlertDialogDescription className="text-[#A0A0A0] space-y-2">
                    <p>Esta acción <strong>no se puede deshacer</strong>. Se eliminará permanentemente la sede <strong>"{sede.nombre}"</strong>.</p>
                    
                    <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 font-semibold mb-2">⚠️ También se eliminará/desvinculará:</p>
                      <ul className="text-sm text-red-300 space-y-1">
                        <li>• Todos los productos de esta sede ({sede._count.productos})</li>
                        <li>• Los planes asociados a esta sede ({sede._count.planesEnSede})</li>
                        <li>• Los usuarios serán desvinculados ({sede._count.usuarios})</li>
                        <li>• Las noticias serán desvinculadas ({sede._count.noticias})</li>
                      </ul>
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-2">Los usuarios y noticias no se eliminarán, solo perderán la relación con esta sede.</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-[#1E1E1E] text-[#F8F8F8] hover:bg-[#2A2A2A]">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(sede.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Sí, Eliminar Todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>

      {/* Modal de Visualización de Sede */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto bg-[#141414] border-[#1E1E1E]">
          <DialogHeader>
            <DialogTitle className="gradient-text text-xl">Información de la Sede</DialogTitle>
          </DialogHeader>
          {viewingSede && (
            <div className="space-y-4">
              {/* Banner de imagen más pequeño */}
              {viewingSede.imagenes && viewingSede.imagenes.length > 0 && (
                <div className="h-40 overflow-hidden rounded-lg">
                  <img
                    src={viewingSede.imagenes[0]}
                    alt={viewingSede.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Layout horizontal para mejor aprovechamiento del espacio */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columna izquierda: Información básica */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-white">{viewingSede.nombre}</h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        viewingSede.activo 
                          ? 'bg-green-500 text-white border border-green-600' 
                          : 'bg-red-500 text-white border border-red-600'
                      }`}>
                        {viewingSede.activo ? 'Activa' : 'Inactiva'}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-[#D604E0] mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-white text-sm font-medium">{viewingSede.direccion}</p>
                          <p className="text-[#A0A0A0] text-xs">{viewingSede.ciudad}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#D604E0]" />
                        <p className="text-white text-sm">{viewingSede.telefono}</p>
                      </div>
                      
                      {viewingSede.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[#D604E0]" />
                          <p className="text-white text-sm">{viewingSede.email}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#D604E0]" />
                        <p className="text-white text-sm">{viewingSede.horario}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-base font-semibold text-white mb-2">Descripción</h4>
                    <p className="text-[#A0A0A0] text-sm leading-relaxed">{viewingSede.descripcion}</p>
                  </div>
                </div>
                
                {/* Columna derecha: Mapa y Estadísticas */}
                <div className="space-y-4">
                  {/* Mapa de Google Maps */}
                  <div>
                    <h4 className="text-base font-semibold text-white mb-2">Ubicación</h4>
                    <div className="h-48 rounded-lg overflow-hidden border border-[#1E1E1E]">
                      <iframe
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(viewingSede.direccion + ', ' + viewingSede.ciudad)}`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                  
                  {/* Estadísticas */}
                  <div>
                    <h4 className="text-base font-semibold text-white mb-2">Estadísticas</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-[#0A0A0A] rounded-lg border border-[#1E1E1E]">
                        <Users className="h-6 w-6 text-[#D604E0] mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">{viewingSede._count.usuarios}</p>
                        <p className="text-xs text-[#A0A0A0]">Usuarios</p>
                      </div>
                      <div className="text-center p-3 bg-[#0A0A0A] rounded-lg border border-[#1E1E1E]">
                        <Package className="h-6 w-6 text-[#D604E0] mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">{viewingSede._count.productos}</p>
                        <p className="text-xs text-[#A0A0A0]">Productos</p>
                      </div>
                      <div className="text-center p-3 bg-[#0A0A0A] rounded-lg border border-[#1E1E1E]">
                        <Newspaper className="h-6 w-6 text-[#D604E0] mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">{viewingSede._count.noticias}</p>
                        <p className="text-xs text-[#A0A0A0]">Noticias</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t border-[#1E1E1E]">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEdit(viewingSede);
                  }}
                  className="border-[#D604E0]/50 text-[#D604E0] hover:bg-[#D604E0]/10 hover:border-[#D604E0] hover:text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                  className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edición de Sede */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#141414] border-[#1E1E1E]">
          <DialogHeader>
            <DialogTitle className="gradient-text">Editar Sede</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nombre" className="text-[#F8F8F8]">Nombre *</Label>
                <ControlledInput
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre de la sede"
                  maxLength={100}
                  showCharCount={true}
                  showWarning={true}
                  className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ciudad" className="text-[#F8F8F8]">Ciudad *</Label>
                <Select
                  value={formData.ciudad}
                  onValueChange={(value) => setFormData({ ...formData, ciudad: value })}
                >
                  <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]">
                    <SelectValue placeholder="Selecciona una ciudad" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-[#1E1E1E]">
                    {CIUDADES_COLOMBIA.map((ciudad) => (
                      <SelectItem
                        key={ciudad}
                        value={ciudad}
                        className="text-white hover:bg-[#1E1E1E] focus:bg-[#D604E0]"
                      >
                        {ciudad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-direccion" className="text-[#F8F8F8]">Dirección *</Label>
              <ControlledInput
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Dirección completa"
                maxLength={200}
                showCharCount={true}
                showWarning={true}
                className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-telefono" className="text-[#F8F8F8]">Teléfono *</Label>
                <ControlledInput
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Teléfono"
                  type="tel"
                  maxLength={20}
                  showCharCount={true}
                  showWarning={true}
                  className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-[#F8F8F8]">Email</Label>
                <ControlledInput
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email (opcional)"
                  type="email"
                  maxLength={100}
                  showCharCount={true}
                  showWarning={true}
                  className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-paymentGateway" className="text-[#F8F8F8]">Cuenta de Pago</Label>
              <Select
                value={formData.paymentGatewayId}
                onValueChange={(value) => setFormData({ ...formData, paymentGatewayId: value })}
              >
                <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]">
                  <SelectValue placeholder="Selecciona una cuenta de pago" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-[#1E1E1E]">
                  {paymentGateways.map((gateway) => (
                    <SelectItem
                      key={gateway.id}
                      value={gateway.id}
                      className="text-white hover:bg-[#1E1E1E] focus:bg-[#D604E0]"
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{gateway.nombre}</div>
                          <div className="text-xs text-[#A0A0A0]">{gateway.tipo}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-descripcion" className="text-[#F8F8F8]">Descripción *</Label>
              <ControlledTextarea
                id="edit-descripcion"
                value={formData.descripcion}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción de la sede"
                maxLength={500}
                showCharCount={true}
                showWarning={true}
                rows={3}
                className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[#F8F8F8] font-medium">Horario de Atención</Label>
              <div className="border border-[#1E1E1E] rounded-xl p-4 bg-[#0A0A0A]">
                {/* Header del horario */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E1E1E]">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#D604E0]" />
                    <span className="text-sm font-medium text-white">Configurar días y horas</span>
                  </div>
                  <div className="text-xs text-[#A0A0A0]">
                    Activa los días que atiendes
                  </div>
                </div>
                
                {/* Lista de días */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                  {horarios.map((horario, index) => (
                    <div 
                      key={horario.dia} 
                      className="flex items-center justify-between p-3 rounded-lg border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:border-[#D604E0]/30 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <CustomSwitch
                          checked={horario.abierto}
                          onCheckedChange={(checked) => {
                            const nuevosHorarios = [...horarios];
                            nuevosHorarios[index].abierto = checked;
                            setHorarios(nuevosHorarios);
                          }}
                        />
                        <div className="flex flex-col">
                          <span className={`text-sm font-semibold capitalize ${
                            horario.abierto ? 'text-white' : 'text-[#606060]'
                          }`}>
                            {horario.dia}
                          </span>
                          {!horario.abierto && (
                            <span className="text-xs text-[#606060]">Cerrado</span>
                          )}
                        </div>
                      </div>
                      
                      {horario.abierto && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-[#A0A0A0]">De</span>
                            <Input
                              type="time"
                              value={horario.apertura}
                              onChange={(e) => {
                                const nuevosHorarios = [...horarios];
                                nuevosHorarios[index].apertura = e.target.value;
                                setHorarios(nuevosHorarios);
                              }}
                              className="w-28 h-9 text-sm bg-[#141414] border-[#2A2A2A] text-white focus:border-[#D604E0] transition-colors"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-[#A0A0A0]">a</span>
                            <Input
                              type="time"
                              value={horario.cierre}
                              onChange={(e) => {
                                const nuevosHorarios = [...horarios];
                                nuevosHorarios[index].cierre = e.target.value;
                                setHorarios(nuevosHorarios);
                              }}
                              className="w-28 h-9 text-sm bg-[#141414] border-[#2A2A2A] text-white focus:border-[#D604E0] transition-colors"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Resumen del horario */}
                <div className="mt-4 pt-3 border-t border-[#1E1E1E]">
                  <div className="bg-[#141414] rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-[#A0A0A0]">Vista previa:</span>
                    </div>
                    <p className="text-xs text-white leading-relaxed">
                      {generarHorarioString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-imagenes" className="text-[#F8F8F8]">Imágenes de la Sede (hasta 5)</Label>
                <div className="border-2 border-dashed border-[#1E1E1E] rounded-lg p-4">
                  <input
                    type="file"
                    id="edit-imagenes"
                    accept="image/*"
                    multiple
                    max="5"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        const remainingSlots = Math.max(0, 5 - (formData.imagenes?.length || 0));
                        const validFiles = files.slice(0, remainingSlots);
                        if (validFiles.length === 0) {
                          e.target.value = '';
                          return;
                        }

                        await uploadImagesWithProgress(validFiles);

                        // Limpiar el input para permitir seleccionar más imágenes
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="edit-imagenes"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    {(formData.imagenes.length > 0 || imagenFiles.length > 0) ? (
                      <div className="w-full">
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {formData.imagenes.slice(0, 5).map((img, index) => (
                            <div key={index} className="relative">
                              <img
                                src={img}
                                alt={`Preview ${index + 1}`}
                                className="h-20 w-20 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const newImagenes = formData.imagenes.filter((_, i) => i !== index);
                                  const newFiles = imagenFiles.filter((_, i) => i !== index);
                                  setFormData({ ...formData, imagenes: newImagenes });
                                  setImagenFiles(newFiles);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {formData.imagenes.length < 5 && (
                            <div className="h-20 w-20 border-2 border-dashed border-[#1E1E1E] rounded-lg flex items-center justify-center">
                              <Plus className="h-6 w-6 text-[#A0A0A0]" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-[#A0A0A0] text-center">
                          {formData.imagenes.length}/5 imágenes
                        </p>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="h-12 w-12 text-[#A0A0A0] mb-2" />
                        <p className="text-sm text-[#A0A0A0]">Click para subir imágenes</p>
                        <p className="text-xs text-[#A0A0A0]">PNG, JPG hasta 10MB • Máximo 5 imágenes</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CustomSwitch
                id="edit-activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <Label htmlFor="edit-activo" className="text-[#F8F8F8]">Sede activa</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white">
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={isLoading || isUploading} className="gradient-bg hover:opacity-90">
                {isLoading ? "Actualizando..." : "Actualizar Sede"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de carga de imágenes */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-md bg-[#0A0A0A] border-[#1E1E1E] text-[#F8F8F8]">
          <DialogHeader>
            <DialogTitle className="text-[#F8F8F8] flex items-center gap-2">
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#D604E0]"></div>
                  Subiendo imágenes...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  ¡Subida completada!
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {Object.entries(uploadingImages).map(([key, img]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#F8F8F8] truncate max-w-[200px]">{img.name}</span>
                  <span className={
                    img.status === '¡Completado!' ? 'text-green-400' : 
                    img.status.includes('Error') ? 'text-red-400' : 
                    'text-[#D604E0]'
                  }>
                    {img.status}
                  </span>
                </div>
                <div className="w-full bg-[#1E1E1E] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      img.status === '¡Completado!' ? 'bg-green-500' : 
                      img.status.includes('Error') ? 'bg-red-500' : 
                      'bg-gradient-to-r from-[#D604E0] to-[#040AE0]'
                    }`}
                    style={{ width: `${img.progress}%` }}
                  />
                </div>
              </div>
            ))}
            {Object.keys(uploadingImages).length === 0 && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D604E0] mx-auto mb-4"></div>
                <p className="text-sm text-[#A0A0A0]">Preparando subida...</p>
              </div>
            )}
            
            {/* Botón de cerrar cuando se completa */}
            {!isUploading && Object.keys(uploadingImages).length > 0 && (
              <div className="pt-4 border-t border-[#1E1E1E]">
                <Button 
                  onClick={() => setShowUploadModal(false)} 
                  className="w-full gradient-bg hover:opacity-90 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Cerrar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
