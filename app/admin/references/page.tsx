"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Package, Plus, Trash2, Pencil, X, Check, ShieldCheck } from "lucide-react";
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

    const [items, setItems] = useState<any[]>([]);
    const [newName, setNewName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");

    const apiUrl = activeTab === "tc" 
        ? "/api/typetc" 
        : activeTab === "package" 
            ? "/api/packagetypes" 
            : "/api/typereleased";

    const load = () => {
        setItems([]);
        fetch(apiUrl)
            .then(r => r.json())
            .then(d => {
                setItems(Array.isArray(d) ? d : []);
            })
            .catch(() => toast.error("Erreur chargement données"));
    };

    useEffect(() => { load(); }, [activeTab, apiUrl]);

    const handleAdd = async () => {
        if (!newName.trim()) return;
        const res = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName.trim() })
        });
        if (res.ok) {
            setNewName("");
            load();
            toast.success("Ajouté");
        } else {
            const data = await res.json();
            toast.error(data.error || "Erreur ajout");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cet élément ?")) return;
        const res = await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
        if (res.ok) {
            load();
            toast.success("Supprimé");
        } else {
            const data = await res.json();
            toast.error(data.error || "Erreur suppression");
        }
    };

    const handleSaveEdit = async (id: string) => {
        if (!editingName.trim()) return;
        const res = await fetch(`${apiUrl}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: editingName.trim() })
        });
        if (res.ok) {
            setEditingId(null);
            load();
            toast.success("Mis à jour");
        } else {
            const data = await res.json();
            toast.error(data.error || "Erreur modification");
        }
    };

    const getTitle = () => {
        if (activeTab === "tc") return "Types de Conteneur (TC)";
        if (activeTab === "package") return "Types d'Emballage (Package)";
        return "Types de Connaissement (Released)";
    };

    const getIcon = () => {
        if (activeTab === "tc") return <Box size={22} color="#e60012" />;
        if (activeTab === "package") return <Package size={22} color="#e60012" />;
        return <ShieldCheck size={22} color="#e60012" />;
    };

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <div className="main-content-inner" style={{ maxWidth: '600px', padding: '2rem 0' }}>
                    <header className="content-header" style={{ position: 'relative', background: 'transparent', border: 'none', padding: '0 0 2rem 0' }}>
                        <div>
                            <h1>{getTitle()}</h1>
                            <p style={{ margin: "0.5rem 0 0", color: "#64748b" }}>
                                Gestion administrative du référentiel maritime
                            </p>
                        </div>
                    </header>

                    <div style={{ background: "white", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                        
                        {/* Barre d'ajout */}
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

                        {/* Liste */}
                        <div>
                            {items.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                                    <p style={{ margin: 0, color: "#94a3b8", fontWeight: 500 }}>Aucun élément trouvé.</p>
                                </div>
                            ) : (
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
