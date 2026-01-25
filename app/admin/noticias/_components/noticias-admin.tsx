"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Edit2, Trash2, Tag, Check, X, Loader2, Calendar } from "lucide-react";

interface Noticia {
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

interface NoticiasAdminProps {
  initialNoticias: Noticia[];
  sedes: { id: string; nombre: string }[];
}

export function NoticiasAdmin({ initialNoticias, sedes }: NoticiasAdminProps) {
  const [noticias, setNoticias] = useState<Noticia[]>(initialNoticias ?? []);
  const [showForm, setShowForm] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    titulo: "",
    contenido: "",
    resumen: "",
    imagen: "",
    sedeId: "",
    esPromocion: false,
    fechaInicio: "",
    fechaFin: "",
    activo: true,
    destacado: false,
  });

  const resetForm = () => {
    setFormData({
      titulo: "",
      contenido: "",
      resumen: "",
      imagen: "",
      sedeId: "",
      esPromocion: false,
      fechaInicio: "",
      fechaFin: "",
      activo: true,
      destacado: false,
    });
    setEditingNoticia(null);
    setShowForm(false);
  };

  const openEdit = (noticia: Noticia) => {
    setFormData({
      titulo: noticia?.titulo ?? "",
      contenido: noticia?.contenido ?? "",
      resumen: noticia?.resumen ?? "",
      imagen: noticia?.imagen ?? "",
      sedeId: noticia?.sedeId ?? "",
      esPromocion: noticia?.esPromocion ?? false,
      fechaInicio: noticia?.fechaInicio ? new Date(noticia.fechaInicio).toISOString().split("T")[0] : "",
      fechaFin: noticia?.fechaFin ? new Date(noticia.fechaFin).toISOString().split("T")[0] : "",
      activo: noticia?.activo ?? true,
      destacado: noticia?.destacado ?? false,
    });
    setEditingNoticia(noticia);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingNoticia ? `/api/noticias/${editingNoticia.id}` : "/api/noticias";
      const method = editingNoticia ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updatedNoticia = await res.json();
        if (editingNoticia) {
          setNoticias((prev) => prev.map((n) => (n.id === editingNoticia.id ? updatedNoticia : n)));
        } else {
          setNoticias((prev) => [updatedNoticia, ...prev]);
        }
        resetForm();
      }
    } catch (error) {
      console.error("Error saving noticia:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta noticia?")) return;

    try {
      const res = await fetch(`/api/noticias/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNoticias((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (error) {
      console.error("Error deleting noticia:", error);
    }
  };

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-[1200px] mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Volver al panel
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Gestionar Noticias</h1>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 gradient-bg rounded-lg font-medium flex items-center gap-2 hover:opacity-90"
            >
              <Plus className="w-5 h-5" /> Nueva Noticia
            </button>
          </div>
        </motion.div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#141414] rounded-xl p-6 border border-white/10 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingNoticia ? "Editar Noticia" : "Nueva Noticia"}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Título</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData((p) => ({ ...p, titulo: e.target.value }))}
                  required
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Resumen</label>
                <input
                  type="text"
                  value={formData.resumen}
                  onChange={(e) => setFormData((p) => ({ ...p, resumen: e.target.value }))}
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Contenido</label>
                <textarea
                  value={formData.contenido}
                  onChange={(e) => setFormData((p) => ({ ...p, contenido: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">URL de Imagen</label>
                  <input
                    type="url"
                    value={formData.imagen}
                    onChange={(e) => setFormData((p) => ({ ...p, imagen: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sede (opcional)</label>
                  <select
                    value={formData.sedeId}
                    onChange={(e) => setFormData((p) => ({ ...p, sedeId: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white"
                  >
                    <option value="">Todas las sedes</option>
                    {(sedes ?? []).map((sede) => (
                      <option key={sede?.id ?? ""} value={sede?.id ?? ""}>{sede?.nombre ?? ""}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha inicio</label>
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData((p) => ({ ...p, fechaInicio: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha fin</label>
                  <input
                    type="date"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData((p) => ({ ...p, fechaFin: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.esPromocion}
                      onChange={(e) => setFormData((p) => ({ ...p, esPromocion: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Promoción</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData((p) => ({ ...p, activo: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Activo</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={resetForm} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 gradient-bg rounded-lg font-medium flex items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingNoticia ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="grid gap-4">
          {(noticias ?? []).map((noticia, index) => (
            <motion.div
              key={noticia?.id ?? index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#141414] rounded-xl p-4 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {noticia?.esPromocion && <Tag className="w-5 h-5 text-[#D604E0]" />}
                  <div>
                    <h3 className="font-semibold">{noticia?.titulo ?? ""}</h3>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar className="w-3 h-3" />
                      {noticia?.fechaPublicacion ? new Date(noticia.fechaPublicacion).toLocaleDateString("es-CO") : ""}
                      {noticia?.sede?.nombre && (
                        <span className="px-2 py-0.5 bg-[#040AE0]/20 text-[#040AE0] rounded text-xs">
                          {noticia.sede.nombre}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs rounded ${noticia?.activo ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {noticia?.activo ? "Activo" : "Inactivo"}
                  </span>
                  <button onClick={() => openEdit(noticia)} className="p-2 text-gray-400 hover:text-white">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(noticia?.id ?? "")} className="p-2 text-gray-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
