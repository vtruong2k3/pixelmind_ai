"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Cpu, RefreshCw, Loader2, ToggleLeft, ToggleRight,
  Edit2, Save, X, Zap, Users, Tag, Plus, Trash2, AlertTriangle,
} from "lucide-react";
import { adminService, type AdminFeature } from "@/services/adminService";
import { hasMinRole, type UserRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  fashion:    { bg: "rgba(167,139,250,0.15)", text: "#a78bfa", label: "Fashion" },
  creative:   { bg: "rgba(251,146,60,0.15)",  text: "#fb923c", label: "Creative" },
  photo_edit: { bg: "rgba(96,165,250,0.15)",  text: "#60a5fa", label: "Photo Edit" },
  default:    { bg: "rgba(113,113,122,0.15)", text: "#71717a", label: "Other" },
};

// ── Feature card ─────────────────────────────────────────────

function FeatureCard({
  feature, onEdit, onToggle, onDelete, toggling,
}: {
  feature: AdminFeature;
  onEdit: (f: AdminFeature) => void;
  onToggle: (f: AdminFeature) => void;
  onDelete: (f: AdminFeature) => void;
  toggling: boolean;
}) {
  const cat = CATEGORY_COLORS[feature.category] ?? CATEGORY_COLORS.default;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: "#111113", border: "1px solid #1f1f23", opacity: feature.isActive ? 1 : 0.6 }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.text }}>{cat.label}</span>
            <code className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "#27272a", color: "#52525b" }}>{feature.slug}</code>
          </div>
          <p className="text-sm font-bold text-white leading-tight">{feature.name}</p>
          <p className="text-[11px] mt-0.5" style={{ color: "#52525b" }}>{feature.nameEn}</p>
        </div>
        <button onClick={() => onToggle(feature)} disabled={toggling} className="shrink-0 transition-all" title={feature.isActive ? "Tắt" : "Bật"}>
          {toggling
            ? <Loader2 size={20} className="animate-spin" style={{ color: "#52525b" }} />
            : feature.isActive
              ? <ToggleRight size={24} style={{ color: "#34d399" }} />
              : <ToggleLeft size={24} style={{ color: "#52525b" }} />}
        </button>
      </div>

      {feature.description && <p className="text-[11px] leading-relaxed" style={{ color: "#71717a" }}>{feature.description}</p>}

      {/* Stats */}
      <div className="flex items-center gap-4 pt-1 border-t" style={{ borderColor: "#27272a" }}>
        <div className="flex items-center gap-1.5"><Zap size={11} style={{ color: "#facc15" }} /><span className="text-[11px] font-bold" style={{ color: "#facc15" }}>{feature.creditCost} cr</span></div>
        <div className="flex items-center gap-1.5"><Users size={11} style={{ color: "#60a5fa" }} /><span className="text-[11px]" style={{ color: "#a1a1aa" }}>{(feature._count?.jobs ?? 0).toLocaleString("vi-VN")} lượt</span></div>
        <div className="flex items-center gap-1.5"><Tag size={11} style={{ color: "#a1a1aa" }} /><span className="text-[11px]" style={{ color: "#a1a1aa" }}>{feature.imageCount} ảnh</span></div>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => onEdit(feature)} className="h-7 px-2 text-zinc-400 hover:text-white hover:bg-zinc-800"><Edit2 size={11} /></Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(feature)} className="h-7 px-2 text-red-500/60 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={11} /></Button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Create / Edit form fields ─────────────────────────────────

interface FeatureForm {
  slug: string; name: string; nameEn: string; description: string;
  prompt: string; category: string; imageCount: number; creditCost: number; sortOrder: number;
}

const BLANK_FORM: FeatureForm = { slug: "", name: "", nameEn: "", description: "", prompt: "", category: "fashion", imageCount: 1, creditCost: 10, sortOrder: 0 };

const generateSlug = (text: string) => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

function FeatureFormFields({ form, onChange }: { form: FeatureForm; onChange: (patch: Partial<FeatureForm>) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold mb-1.5 block text-zinc-400">Tên (VI) *</label>
          <Input value={form.name} onChange={e => {
            const val = e.target.value;
            onChange({ name: val, slug: generateSlug(form.nameEn || val) });
          }} className="bg-zinc-900 border-zinc-800 text-white" placeholder="vd: Thay áo" />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1.5 block text-zinc-400">Tên (EN)</label>
          <Input value={form.nameEn} onChange={e => {
            const val = e.target.value;
            onChange({ nameEn: val, slug: generateSlug(val || form.name) });
          }} className="bg-zinc-900 border-zinc-800 text-white" placeholder="vd: Swap Shirt" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold mb-1.5 block text-zinc-400">Slug * <span style={{ color: "#52525b" }}>(không dấu, dùng _)</span></label>
        <Input value={form.slug} onChange={e => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} className="bg-zinc-900 border-zinc-800 text-white font-mono" placeholder="vd: swap_shirt" />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1.5 block text-zinc-400">Mô tả</label>
        <Input value={form.description} onChange={e => onChange({ description: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" placeholder="Mô tả ngắn về tính năng..." />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1.5 block text-zinc-400">Prompt AI</label>
        <textarea
        value={form.prompt}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ prompt: e.target.value })}
        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-md px-3 py-2 text-xs min-h-[80px] resize-none focus:outline-none focus:border-zinc-600"
        placeholder="Prompt gửi lên AI để tạo ảnh/xử lý ảnh..."
      />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold mb-1.5 block text-zinc-400">Danh mục</label>
          <Select value={form.category} onValueChange={v => onChange({ category: v })}>
            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white h-9"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== "default").map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-zinc-300">{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold mb-1.5 block text-zinc-400 truncate">Số ảnh upload</label>
          <Select value={String(form.imageCount)} onValueChange={v => onChange({ imageCount: Number(v) })}>
            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white h-9"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="0" className="text-zinc-300">0 ảnh</SelectItem>
              <SelectItem value="1" className="text-zinc-300">1 ảnh</SelectItem>
              <SelectItem value="2" className="text-zinc-300">2 ảnh</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold mb-1.5 block text-zinc-400 flex items-center gap-1 truncate"><Zap size={10} className="text-yellow-400" />Credit cost</label>
          <Input type="number" min={0} value={form.creditCost} onChange={e => onChange({ creditCost: Number(e.target.value) || 0 })} className="bg-zinc-900 border-zinc-800 text-white h-9" />
        </div>
      </div>
      <div className="pt-2">
        <label className="text-xs font-semibold mb-1.5 block text-zinc-400">Sort order <span style={{ color: "#52525b" }}>(nhỏ hơn = hiện trước)</span></label>
        <Input type="number" value={form.sortOrder} onChange={e => onChange({ sortOrder: Number(e.target.value) || 0 })} className="bg-zinc-900 border-zinc-800 text-white h-9" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────

function FeaturesInner() {
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "USER") as UserRole;
  const isAdmin = hasMinRole(role, "ADMIN");
  const qc = useQueryClient();

  // ── Local UI state ────────────────────────────────────────────
  const [editing,    setEditing]    = useState<AdminFeature | null>(null);
  const [editForm,   setEditForm]   = useState<FeatureForm>(BLANK_FORM);
  const [creating,   setCreating]   = useState(false);
  const [createForm, setCreateForm] = useState<FeatureForm>(BLANK_FORM);
  const [deleting,   setDeleting]   = useState<AdminFeature | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: features = [], isLoading, refetch } = useQuery({
    queryKey:  ["admin-features"],
    queryFn:   () => adminService.getFeatures(),
    staleTime: 2 * 60_000,
    enabled:   isAdmin,
  });

  // ── Mutations ─────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: () => adminService.createFeature({
      ...createForm,
      nameEn: createForm.nameEn || createForm.name,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-features"] });
      qc.invalidateQueries({ queryKey: ["studio-features"] }); // refresh studio
      toast.success("Đã thêm tính năng mới!");
      setCreating(false); setCreateForm(BLANK_FORM);
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AdminFeature> }) => adminService.updateFeature(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-features"] });
      qc.invalidateQueries({ queryKey: ["studio-features"] });
      toast.success("Đã cập nhật tính năng");
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminService.deleteFeature(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-features"] });
      qc.invalidateQueries({ queryKey: ["studio-features"] });
      toast.success("Đã xóa tính năng");
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleToggle = async (f: AdminFeature) => {
    setTogglingId(f.id);
    try {
      await adminService.updateFeature(f.id, { isActive: !f.isActive });
      await qc.invalidateQueries({ queryKey: ["admin-features"] });
      await qc.invalidateQueries({ queryKey: ["studio-features"] });
      toast.success(f.isActive ? `Đã tắt "${f.name}"` : `Đã bật "${f.name}"`);
    } catch (e: any) { toast.error(e.message); }
    finally { setTogglingId(null); }
  };

  const openEdit = (f: AdminFeature) => {
    setEditing(f);
    setEditForm({ slug: f.slug, name: f.name, nameEn: f.nameEn, description: f.description ?? "", prompt: f.prompt, category: f.category, imageCount: f.imageCount, creditCost: f.creditCost, sortOrder: f.sortOrder });
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    updateMut.mutate({ id: editing.id, payload: { name: editForm.name, nameEn: editForm.nameEn || editForm.name, description: editForm.description, prompt: editForm.prompt, category: editForm.category, imageCount: editForm.imageCount, creditCost: editForm.creditCost, sortOrder: editForm.sortOrder } });
  };

  if (!isAdmin) return <div className="flex items-center justify-center h-96"><p className="text-zinc-500 text-sm">Bạn không có quyền truy cập.</p></div>;

  const activeCount = features.filter(f => f.isActive).length;

  return (
    <div className="p-8 max-w-[1400px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Cpu size={22} className="text-violet-400" /> Quản lý Tính năng AI</h1>
          <p className="text-sm mt-1" style={{ color: "#71717a" }}>
            {features.length} tính năng · <span style={{ color: "#34d399" }}>{activeCount} đang bật</span>
            {features.length - activeCount > 0 && <span style={{ color: "#f87171" }}> · {features.length - activeCount} tắt</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()} style={{ borderColor: "#27272a", color: "#a1a1aa", background: "#18181b" }}>
            <RefreshCw size={13} className="mr-1.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => { setCreateForm(BLANK_FORM); setCreating(true); }}
            style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)", color: "#fff" }}>
            <Plus size={13} className="mr-1.5" /> Thêm tính năng
          </Button>
        </div>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Tổng tính năng",  value: features.length, color: "#a78bfa" },
          { label: "Đang hoạt động",  value: activeCount, color: "#34d399" },
          { label: "Đã tắt",          value: features.length - activeCount, color: "#f87171" },
          { label: "Tổng lượt dùng",  value: features.reduce((s, f) => s + (f._count?.jobs ?? 0), 0).toLocaleString("vi-VN"), color: "#facc15" },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl p-4" style={{ background: "#111113", border: "1px solid #1f1f23" }}>
            <p className="text-[11px] font-semibold mb-2" style={{ color: "#71717a" }}>{item.label}</p>
            <p className="text-2xl font-black" style={{ color: item.color }}>{item.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Grid */}
      {isLoading
        ? <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-red-500" size={28} /></div>
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {features.sort((a, b) => a.sortOrder - b.sortOrder).map(f => (
              <FeatureCard key={f.id} feature={f} onEdit={openEdit} onToggle={handleToggle} onDelete={setDeleting} toggling={togglingId === f.id} />
            ))}
          </div>
        )}

      {/* ── Create Dialog ── */}
      <Dialog open={creating} onOpenChange={o => { if (!o) setCreating(false); }}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-black flex items-center gap-2"><Plus size={14} className="text-green-400" /> Thêm tính năng AI mới</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <FeatureFormFields form={createForm} onChange={patch => setCreateForm(prev => ({ ...prev, ...patch }))} />
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1 border-zinc-800 text-zinc-400" onClick={() => setCreating(false)}>Hủy</Button>
              <Button className="flex-1 text-white font-bold" disabled={createMut.isPending || !createForm.slug || !createForm.name}
                onClick={() => createMut.mutate()}
                style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
                {createMut.isPending ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Plus size={13} className="mr-1.5" />}
                Tạo tính năng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editing} onOpenChange={o => { if (!o) setEditing(null); }}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-black flex items-center gap-2"><Edit2 size={14} className="text-violet-400" /> Sửa: {editing?.slug}</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <FeatureFormFields form={editForm} onChange={patch => setEditForm(prev => ({ ...prev, ...patch }))} />
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1 border-zinc-800 text-zinc-400" onClick={() => setEditing(null)}><X size={13} className="mr-1.5" />Hủy</Button>
              <Button className="flex-1 text-white font-bold" disabled={updateMut.isPending} onClick={handleSaveEdit}
                style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)" }}>
                {updateMut.isPending ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Save size={13} className="mr-1.5" />}Lưu thay đổi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!deleting} onOpenChange={o => { if (!o) setDeleting(null); }}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-black flex items-center gap-2 text-red-400"><AlertTriangle size={14} /> Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <div className="pt-2 space-y-4">
            <p className="text-sm text-zinc-300">
              Bạn sắp xóa tính năng <span className="font-bold text-white">"{deleting?.name}"</span>.
              {(deleting?._count?.jobs ?? 0) > 0 && (
                <span className="text-yellow-400"> Tính năng này có <strong>{deleting?._count?.jobs}</strong> job liên quan.</span>
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-zinc-800 text-zinc-400" onClick={() => setDeleting(null)}>Hủy</Button>
              <Button className="flex-1 font-bold" disabled={deleteMut.isPending} onClick={() => deleting && deleteMut.mutate(deleting.id)}
                style={{ background: "#dc2626", color: "#fff" }}>
                {deleteMut.isPending ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Trash2 size={13} className="mr-1.5" />}Xóa tính năng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DashboardFeaturesPage() {
  return <FeaturesInner />;
}
