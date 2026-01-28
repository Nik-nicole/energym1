"use client";

import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

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
  imagen: string | null;
  horario: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    usuarios: number;
    productos: number;
    noticias: number;
  };
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

  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    ciudad: "",
    telefono: "",
    email: "",
    descripcion: "",
    imagen: "",
    horario: "",
    activo: true,
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

  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = () => {
    setFormData({
      nombre: "",
      direccion: "",
      ciudad: "",
      telefono: "",
      email: "",
      descripcion: "",
      imagen: "",
      horario: "",
      activo: true,
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
    setImagenFile(null);
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
    if (!formData.nombre || !formData.direccion || !formData.ciudad || !formData.telefono || !formData.descripcion) {
      toast.error("Por favor completa todos los campos requeridos");
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
      let imageUrl = formData.imagen;
      
      // Si hay un archivo de imagen, subirlo al servidor
      if (imagenFile) {
        try {
          const formDataUpload = new FormData();
          formDataUpload.append('file', imagenFile);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formDataUpload,
          });
          
          if (!uploadResponse.ok) {
            console.warn('Error al subir imagen, usando placeholder');
            imageUrl = 'https://cdn.abacus.ai/images/223406aa-b7ac-4de5-bd3a-93424a34a9e8.png';
          } else {
            const uploadResult = await uploadResponse.json();
            imageUrl = uploadResult.url;
          }
        } catch (error) {
          console.warn('Error al subir imagen, usando placeholder:', error);
          imageUrl = 'https://cdn.abacus.ai/images/223406aa-b7ac-4de5-bd3a-93424a34a9e8.png';
        }
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
          imagen: imageUrl || 'https://cdn.abacus.ai/images/223406aa-b7ac-4de5-bd3a-93424a34a9e8.png',
          horario: horarioString,
          activo: formData.activo,
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
      imagen: sede.imagen || "",
      horario: sede.horario,
      activo: sede.activo,
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

      const response = await fetch(`/api/admin/sedes/${editingSede.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          horario: horarioString,
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar sede");

      const updatedSede = await response.json();
      setSedesList(sedesList.map((s) => (s.id === updatedSede.id ? updatedSede : s)));
      setIsEditDialogOpen(false);
      setEditingSede(null);
      resetForm();
      toast.success("Sede actualizada exitosamente");
    } catch (error) {
      toast.error("Error al actualizar sede");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/sedes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar sede");

      setSedesList(sedesList.filter((s) => s.id !== id));
      toast.success("Sede eliminada exitosamente");
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
                  <Label htmlFor="nombre" className="text-[#F8F8F8]">Nombre</Label>
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
                  <Label htmlFor="ciudad" className="text-[#F8F8F8]">Ciudad</Label>
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
                <Label htmlFor="direccion" className="text-[#F8F8F8]">Dirección</Label>
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
                  <Label htmlFor="telefono" className="text-[#F8F8F8]">Teléfono</Label>
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
                  <Label htmlFor="email" className="text-[#F8F8F8]">Email</Label>
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
                <Label htmlFor="descripcion" className="text-[#F8F8F8]">Descripción</Label>
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
                <Label htmlFor="imagen" className="text-[#F8F8F8]">Imagen de la Sede</Label>
                <div className="border-2 border-dashed border-[#1E1E1E] rounded-lg p-4">
                  <input
                    type="file"
                    id="imagen"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImagenFile(file);
                        // Preview de la imagen
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, imagen: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="imagen"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    {formData.imagen || imagenFile ? (
                      <div className="relative">
                        <img
                          src={formData.imagen || (imagenFile ? URL.createObjectURL(imagenFile) : "")}
                          alt="Preview"
                          className="h-32 w-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Upload className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="h-12 w-12 text-[#A0A0A0] mb-2" />
                        <p className="text-sm text-[#A0A0A0]">Click para subir imagen</p>
                        <p className="text-xs text-[#A0A0A0]">PNG, JPG hasta 10MB</p>
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
                <Button onClick={handleCreate} disabled={isLoading} className="gradient-bg hover:opacity-90">
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
          <div
            key={sede.id}
            onClick={() => handleView(sede)}
            className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
          >
            <div className="relative overflow-hidden rounded-2xl bg-[#141414] border border-[#1E1E1E] hover:border-[#D604E0]/50 transition-all duration-300">
              {/* Imagen de la sede */}
              <div className="relative h-64 overflow-hidden">
                {sede.imagen ? (
                  <img
                    src={sede.imagen}
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 border-[#3B82F6]/50 text-[#3B82F6] hover:bg-[#3B82F6]/10 hover:border-[#3B82F6] hover:text-white transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#141414] border-[#1E1E1E]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">¿Eliminar sede?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#A0A0A0]">
                          Esta acción no se puede deshacer. Se eliminará permanentemente la sede "{sede.nombre}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-[#1E1E1E] text-[#F8F8F8] hover:bg-[#2A2A2A]">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(sede.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
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
              {viewingSede.imagen && (
                <div className="h-40 overflow-hidden rounded-lg">
                  <img
                    src={viewingSede.imagen}
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
                <Label htmlFor="edit-nombre" className="text-[#F8F8F8]">Nombre</Label>
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
                <Label htmlFor="edit-ciudad" className="text-[#F8F8F8]">Ciudad</Label>
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
              <Label htmlFor="edit-direccion" className="text-[#F8F8F8]">Dirección</Label>
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
                <Label htmlFor="edit-telefono" className="text-[#F8F8F8]">Teléfono</Label>
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
              <Label htmlFor="edit-descripcion" className="text-[#F8F8F8]">Descripción</Label>
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
                <Label htmlFor="edit-imagen" className="text-[#F8F8F8]">Imagen de la Sede</Label>
                <div className="border-2 border-dashed border-[#1E1E1E] rounded-lg p-4">
                  <input
                    type="file"
                    id="edit-imagen"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImagenFile(file);
                        // Preview de la imagen
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, imagen: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="edit-imagen"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    {formData.imagen || imagenFile ? (
                      <div className="relative">
                        <img
                          src={formData.imagen || (imagenFile ? URL.createObjectURL(imagenFile) : "")}
                          alt="Preview"
                          className="h-32 w-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Upload className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="h-12 w-12 text-[#A0A0A0] mb-2" />
                        <p className="text-sm text-[#A0A0A0]">Click para subir imagen</p>
                        <p className="text-xs text-[#A0A0A0]">PNG, JPG hasta 10MB</p>
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
              <Button onClick={handleUpdate} disabled={isLoading} className="gradient-bg hover:opacity-90">
                {isLoading ? "Actualizando..." : "Actualizar Sede"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
