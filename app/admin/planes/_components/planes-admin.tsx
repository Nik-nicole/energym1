"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Edit2, Trash2, Crown, Check, X, Loader2 } from "lucide-react";

interface Plan {
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
  orden: number;
  sedes: { sede: { id: string; nombre: string } }[];
}

interface PlanesAdminProps {
  initialPlanes: Plan[];
  sedes: { id: string; nombre: string }[];
}

export function PlanesAdmin({ initialPlanes, sedes }: PlanesAdminProps) {
  const [planes, setPlanes] = useState<Plan[]>(initialPlanes ?? []);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    precio: 0,
    descripcion: "",
    beneficios: "",
    duracion: "Mensual",
    tipo: "STANDARD",
    esVip: false,
    activo: true,
    destacado: false,
    orden: 0,
    sedeIds: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      precio: 0,
      descripcion: "",
      beneficios: "",
      duracion: "Mensual",
      tipo: "STANDARD",
      esVip: false,
      activo: true,
      destacado: false,
      orden: 0,
      sedeIds: [],
    });
    setEditingPlan(null);
    setShowForm(false);
  };

  const openEdit = (plan: Plan) => {
    setFormData({
      nombre: plan?.nombre ?? "",
      precio: plan?.precio ?? 0,
      descripcion: plan?.descripcion ?? "",
      beneficios: (plan?.beneficios ?? []).join("\n"),
      duracion: plan?.duracion ?? "Mensual",
      tipo: plan?.tipo ?? "STANDARD",
      esVip: plan?.esVip ?? false,
      activo: plan?.activo ?? true,
      destacado: plan?.destacado ?? false,
      orden: plan?.orden ?? 0,
      sedeIds: (plan?.sedes ?? []).map((s) => s?.sede?.id ?? ""),
    });
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        beneficios: formData.beneficios.split("\n").filter((b) => b.trim()),
      };

      const url = editingPlan ? `/api/planes/${editingPlan.id}` : "/api/planes";
      const method = editingPlan ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updatedPlan = await res.json();
        if (editingPlan) {
          setPlanes((prev) => prev.map((p) => (p.id === editingPlan.id ? updatedPlan : p)));
        } else {
          setPlanes((prev) => [...prev, updatedPlan]);
        }
        resetForm();
      }
    } catch (error) {
      console.error("Error saving plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este plan?")) return;

    try {
      const res = await fetch(`/api/planes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlanes((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price ?? 0);
  };

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-[1200px] mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Volver al panel
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Gestionar Planes</h1>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 gradient-bg rounded-lg font-medium flex items-center gap-2 hover:opacity-90"
            >
              <Plus className="w-5 h-5" /> Nuevo Plan
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
              <h2 className="text-xl font-bold">{editingPlan ? "Editar Plan" : "Nuevo Plan"}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData((p) => ({ ...p, nombre: e.target.value }))}
                    required
                    className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Precio (COP)</label>
                  <input
                    type="number"
                    value={formData.precio}
                    onChange={(e) => setFormData((p) => ({ ...p, precio: Number(e.target.value) }))}
                    required
                    className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData((p) => ({ ...p, descripcion: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Beneficios (uno por línea)</label>
                <textarea
                  value={formData.beneficios}
                  onChange={(e) => setFormData((p) => ({ ...p, beneficios: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Duración</label>
                  <select
                    value={formData.duracion}
                    onChange={(e) => setFormData((p) => ({ ...p, duracion: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white"
                  >
                    <option value="Mensual">Mensual</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Orden</label>
                  <input
                    type="number"
                    value={formData.orden}
                    onChange={(e) => setFormData((p) => ({ ...p, orden: Number(e.target.value) }))}
                    className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.esVip}
                      onChange={(e) => setFormData((p) => ({ ...p, esVip: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">VIP</span>
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
              <div>
                <label className="block text-sm text-gray-400 mb-2">Sedes disponibles</label>
                <div className="flex flex-wrap gap-2">
                  {(sedes ?? []).map((sede) => (
                    <label key={sede?.id ?? ""} className="flex items-center gap-2 px-3 py-1 bg-[#0A0A0A] rounded-lg cursor-pointer border border-white/10">
                      <input
                        type="checkbox"
                        checked={formData.sedeIds.includes(sede?.id ?? "")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((p) => ({ ...p, sedeIds: [...p.sedeIds, sede?.id ?? ""] }));
                          } else {
                            setFormData((p) => ({ ...p, sedeIds: p.sedeIds.filter((id) => id !== sede?.id) }));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{sede?.nombre ?? ""}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={resetForm} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 gradient-bg rounded-lg font-medium flex items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingPlan ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="grid gap-4">
          {(planes ?? []).map((plan, index) => (
            <motion.div
              key={plan?.id ?? index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-[#141414] rounded-xl p-4 border ${
                plan?.esVip ? "border-[#D604E0]/50" : "border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {plan?.esVip && <Crown className="w-5 h-5 text-[#D604E0]" />}
                  <div>
                    <h3 className="font-semibold">{plan?.nombre ?? ""}</h3>
                    <p className="text-gray-400 text-sm">{formatPrice(plan?.precio ?? 0)} / {plan?.duracion ?? ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs rounded ${plan?.activo ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {plan?.activo ? "Activo" : "Inactivo"}
                  </span>
                  <button onClick={() => openEdit(plan)} className="p-2 text-gray-400 hover:text-white">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(plan?.id ?? "")} className="p-2 text-gray-400 hover:text-red-400">
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
