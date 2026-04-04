"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Package, Plus, Trash2, Pencil, X, Check, ShieldCheck, Hash } from "lucide-react";
import toast from "react-hot-toast";
import { Sidebar } from "@/components/Sidebar";

export default function AdminReferencesPage() {
    return (
        <Suspense fallback={<div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>}>
            <AdminReferencesContent />
        </Suspense>
    );
}

function AdminReferencesContent() {
    const searchParams = useSearchParams();
    const activeTab = searchParams.get("tab") || "tc";
    const isHSCode = activeTab === "hscode";

    // States communs
    const [items, setItems] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    // States pour tabs simples (name only)
    const [newName, setNewName] = useState("");
    const [editingName, setEditingName] = useState("");

    // States pour HS Code (code + description)
    const [newHsCode, setNewHsCode] = useState("");
    const [newHsDesc, setNewHsDesc] = useState("");
    const [editingHsCode, setEditingHsCode] = useState("");
    const [editingHsDesc, setEditingHsDesc] = useState("");

    const apiUrl = activeTab === "tc"
        ? "/api/typetc"
        : activeTab === "package"
            ? "/api/packagetypes"
            : activeTab === "hscode"
                ? "/api/hscodes"
                : "/api/typereleased";

    const load = () => {
        setItems([]);
        fetch(apiUrl)
            .then(r => r.json())
            .then(d => { setItems(Array.isArray(d) ? d : []); })
            .catch(() => toast.error("Erreur chargement données"));
    };

    useEffect(() => { load(); }, [activeTab, apiUrl]);

    // ── Ajouter ──
    const handleAdd = async () => {
        if (isHSCode) {
            if (!newHsCode.trim() || !newHsDesc.trim()) return;
            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: newHsCode.trim(), description: newHsDesc.trim() })
            });
            if (res.ok) { setNewHsCode(""); setNewHsDesc(""); load(); toast.success("HS Code ajouté"); }
            else { const d = await res.json(); toast.error(d.error || "Erreur ajout"); }
        } else {
            if (!newName.trim()) return;
            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName.trim() })
            });
            if (res.ok) { setNewName(""); load(); toast.success("Ajouté"); }
            else { const d = await res.json(); toast.error(d.error || "Erreur ajout"); }
        }
    };

    // ── Supprimer ──
    const handleDelete = async (id: string) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cet élément ?")) return;
        const res = await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
        if (res.ok) { load(); toast.success("Supprimé"); }
        else { const d = await res.json(); toast.error(d.error || "Erreur suppression"); }
    };

    // ── Modifier ──
    const handleSaveEdit = async (id: string) => {
        if (isHSCode) {
            if (!editingHsCode.trim() || !editingHsDesc.trim()) return;
            const res = await fetch(`${apiUrl}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: editingHsCode.trim(), description: editingHsDesc.trim() })
            });
            if (res.ok) { setEditingId(null); load(); toast.success("Mis à jour"); }
            else { const d = await res.json(); toast.error(d.error || "Erreur modification"); }
        } else {
            if (!editingName.trim()) return;
            const res = await fetch(`${apiUrl}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editingName.trim() })
            });
            if (res.ok) { setEditingId(null); load(); toast.success("Mis à jour"); }
            else { const d = await res.json(); toast.error(d.error || "Erreur modification"); }
        }
    };

    const getTitle = () => {
        if (activeTab === "tc") return "Types de Conteneur (TC)";
        if (activeTab === "package") return "Types d'Emballage (Package)";
        if (activeTab === "hscode") return "Codes HS (Harmonized System)";
        return "Types de Connaissement (Released)";
    };

    const getIcon = () => {
        if (activeTab === "tc") return <Box size={22} color="#e60012" />;
        if (activeTab === "package") return <Package size={22} color="#e60012" />;
        if (activeTab === "hscode") return <Hash size={22} color="#e60012" />;
        return <ShieldCheck size={22} color="#e60012" />;
    };

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <div className="main-content-inner" style={{ maxWidth: isHSCode ? '800px' : '600px', padding: '2rem 0' }}>
                    <header className="content-header" style={{ position: 'relative', background: 'transparent', border: 'none', padding: '0 0 2rem 0' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {getIcon()}
                                <h1 style={{ margin: 0 }}>{getTitle()}</h1>
                            </div>
                            <p style={{ margin: "0.25rem 0 0", color: "#64748b" }}>
                                {isHSCode
                                    ? "Gérez vos codes SH/HS pour la classification douanière des marchandises"
                                    : "Gestion administrative du référentiel maritime"}
                            </p>
                        </div>
                    </header>

                    <div style={{ background: "white", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>

                        {/* ── Formulaire d'ajout ── */}
                        {isHSCode ? (
                            <div style={{ marginBottom: "2rem" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "12px", alignItems: "end" }}>
                                    <div>
                                        <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
                                            Code HS *
                                        </label>
                                        <input
                                            style={{ width: "100%", height: "46px", padding: "0 14px", borderRadius: "10px", border: "2px solid #e2e8f0", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", fontFamily: "monospace", fontWeight: 700 }}
                                            placeholder="Ex: 8703.10"
                                            value={newHsCode}
                                            onChange={e => setNewHsCode(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && handleAdd()}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
                                            Désignation de la marchandise *
                                        </label>
                                        <input
                                            style={{ width: "100%", height: "46px", padding: "0 14px", borderRadius: "10px", border: "2px solid #e2e8f0", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                                            placeholder="Ex: Véhicules automobiles..."
                                            value={newHsDesc}
                                            onChange={e => setNewHsDesc(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && handleAdd()}
                                        />
                                    </div>
                                    <button
                                        onClick={handleAdd}
                                        disabled={!newHsCode.trim() || !newHsDesc.trim()}
                                        style={{
                                            height: "46px", padding: "0 22px",
                                            background: (newHsCode.trim() && newHsDesc.trim()) ? "#e60012" : "#cbd5e1",
                                            color: "white", border: "none", borderRadius: "10px",
                                            cursor: (newHsCode.trim() && newHsDesc.trim()) ? "pointer" : "not-allowed",
                                            fontWeight: "bold", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "6px"
                                        }}
                                    >
                                        <Plus size={20} /> Ajouter
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: "flex", gap: "12px", marginBottom: "2rem" }}>
                                <input
                                    style={{ flex: 1, height: "46px", padding: "0 18px", borderRadius: "10px", border: "2px solid #e2e8f0", fontSize: "1rem", outline: "none" }}
                                    placeholder={`Nouveau ${activeTab === 'tc' ? 'TC' : activeTab === 'package' ? 'Package' : 'Connais.'}...`}
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleAdd()}
                                />
                                <button
                                    onClick={handleAdd}
                                    disabled={!newName.trim()}
                                    style={{
                                        height: "46px", padding: "0 22px", background: newName.trim() ? "#e60012" : "#cbd5e1",
                                        color: "white", border: "none", borderRadius: "10px", cursor: newName.trim() ? "pointer" : "not-allowed",
                                        fontWeight: "bold", transition: "all 0.2s"
                                    }}
                                >
                                    <Plus size={22} />
                                </button>
                            </div>
                        )}

                        {/* ── En-tête de colonne pour HS Code ── */}
                        {isHSCode && items.length > 0 && (
                            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr auto", gap: "12px", padding: "0 0 8px 0", borderBottom: "2px solid #e2e8f0", marginBottom: "4px" }}>
                                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Code HS</span>
                                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Désignation</span>
                                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</span>
                            </div>
                        )}

                        {/* ── Liste ── */}
                        <div style={{ maxHeight: "55vh", overflowY: "auto", paddingRight: "8px" }}>
                            {items.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                                    <p style={{ margin: 0, color: "#94a3b8", fontWeight: 500 }}>
                                        {isHSCode ? "Aucun code HS enregistré." : "Aucun élément trouvé."}
                                    </p>
                                </div>
                            ) : isHSCode ? (
                                // ── Liste HS Code ──
                                items.map((item, i) => (
                                    <div key={item.id} style={{
                                        display: "grid", gridTemplateColumns: "140px 1fr auto", gap: "12px",
                                        alignItems: "center", padding: "14px 0",
                                        borderBottom: i < items.length - 1 ? "1px solid #f1f5f9" : "none"
                                    }}>
                                        {editingId === item.id ? (
                                            <>
                                                <input
                                                    style={{ height: "38px", padding: "0 10px", borderRadius: "8px", border: "2px solid #e60012", outline: "none", fontSize: "0.9rem", fontFamily: "monospace", fontWeight: 700 }}
                                                    value={editingHsCode}
                                                    onChange={e => setEditingHsCode(e.target.value)}
                                                    autoFocus
                                                />
                                                <input
                                                    style={{ height: "38px", padding: "0 10px", borderRadius: "8px", border: "2px solid #e2e8f0", outline: "none", fontSize: "0.9rem" }}
                                                    value={editingHsDesc}
                                                    onChange={e => setEditingHsDesc(e.target.value)}
                                                    onKeyDown={e => e.key === "Enter" && handleSaveEdit(item.id)}
                                                />
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button onClick={() => handleSaveEdit(item.id)} style={{ background: "#22c55e", color: "white", border: "none", borderRadius: "8px", width: "38px", height: "38px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={16} /></button>
                                                    <button onClick={() => setEditingId(null)} style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "8px", width: "38px", height: "38px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#e60012", fontSize: "0.95rem", background: "#fff1f2", padding: "4px 10px", borderRadius: "6px", display: "inline-block" }}>{item.code}</span>
                                                <span style={{ fontWeight: 600, color: "#0a1f5c", fontSize: "0.9rem", lineHeight: 1.4 }}>{item.description}</span>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button
                                                        onClick={() => { setEditingId(item.id); setEditingHsCode(item.code); setEditingHsDesc(item.description); }}
                                                        style={{ background: "#f8fafc", color: "#64748b", border: "none", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px", transition: "all 0.2s" }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
                                                        onMouseLeave={e => (e.currentTarget.style.background = "#f8fafc")}
                                                    >
                                                        <Pencil size={13} /> Modifier
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        style={{ background: "#fff1f2", color: "#e60012", border: "none", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px", transition: "all 0.2s" }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = "#ffe4e6")}
                                                        onMouseLeave={e => (e.currentTarget.style.background = "#fff1f2")}
                                                    >
                                                        <Trash2 size={13} /> Supprimer
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            ) : (
                                // ── Liste standard ──
                                items.map((item, i) => (
                                    <div key={item.id} style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        padding: "16px 0", borderBottom: i < items.length - 1 ? "1px solid #f1f5f9" : "none"
                                    }}>
                                        {editingId === item.id ? (
                                            <div style={{ display: "flex", flex: 1, gap: "12px" }}>
                                                <input
                                                    style={{ flex: 1, height: "38px", padding: "0 12px", borderRadius: "8px", border: "2px solid #e60012", outline: "none", fontSize: "0.95rem" }}
                                                    value={editingName}
                                                    onChange={e => setEditingName(e.target.value)}
                                                    autoFocus
                                                    onKeyDown={e => e.key === "Enter" && handleSaveEdit(item.id)}
                                                />
                                                <button onClick={() => handleSaveEdit(item.id)} style={{ background: "#22c55e", color: "white", border: "none", borderRadius: "8px", width: "38px", height: "38px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={18} /></button>
                                                <button onClick={() => setEditingId(null)} style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "8px", width: "38px", height: "38px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <span style={{ fontWeight: "700", color: "#0a1f5c", fontSize: "1rem" }}>{item.name}</span>
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <button
                                                        onClick={() => { setEditingId(item.id); setEditingName(item.name); }}
                                                        style={{ background: "#f8fafc", color: "#64748b", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
                                                        onMouseLeave={e => (e.currentTarget.style.background = "#f8fafc")}
                                                    >
                                                        <Pencil size={14} /> Modifier
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        style={{ background: "#fff1f2", color: "#e60012", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = "#ffe4e6")}
                                                        onMouseLeave={e => (e.currentTarget.style.background = "#fff1f2")}
                                                    >
                                                        <Trash2 size={14} /> Supprimer
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
