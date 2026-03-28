"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MapPin, Plus, Trash2, Globe } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminPortsPage() {
    const [countries, setCountries] = useState<any[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<any>(null);
    const [ports, setPorts] = useState<any[]>([]);
    const [newPortName, setNewPortName] = useState("");
    const [newCountryName, setNewCountryName] = useState("");
    const [isAddingCountry, setIsAddingCountry] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Charger les pays au démarrage
    useEffect(() => {
        fetch("/api/globals/countries")
            .then(r => r.ok ? r.json() : [])
            .then(data => setCountries(Array.isArray(data) ? data : []))
            .catch(() => toast.error("Impossible de charger les pays"));
    }, []);

    // Charger les ports quand le pays change
    useEffect(() => {
        if (!selectedCountry) { setPorts([]); return; }
        setIsLoading(true);
        fetch(`/api/admin/global-ports?countryId=${selectedCountry.id}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => setPorts(Array.isArray(data) ? data : []))
            .finally(() => setIsLoading(false));
    }, [selectedCountry]);

    const handleAddCountry = async () => {
        if (!newCountryName.trim()) return;
        const res = await fetch("/api/admin/global-countries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newCountryName.trim().toUpperCase() })
        });
        if (res.ok) {
            const saved = await res.json();
            setCountries(prev => [...prev, saved]);
            setSelectedCountry(saved);
            setNewCountryName("");
            setIsAddingCountry(false);
            toast.success("Pays ajouté !");
        } else {
            toast.error("Erreur lors de l'ajout du pays");
        }
    };

    const handleAddPort = async () => {
        if (!newPortName.trim() || !selectedCountry) return;
        const res = await fetch("/api/admin/global-ports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newPortName.trim().toUpperCase(), countryId: selectedCountry.id })
        });
        if (res.ok) {
            const saved = await res.json();
            setPorts(prev => [...prev, saved]);
            setNewPortName("");
            toast.success("Port ajouté !");
        } else {
            toast.error("Erreur lors de l'ajout du port");
        }
    };

    const handleDeletePort = async (portId: string) => {
        if (!window.confirm("Supprimer ce port ?")) return;
        const res = await fetch(`/api/admin/global-ports/${portId}`, { method: "DELETE" });
        if (res.ok) {
            setPorts(prev => prev.filter(p => p.id !== portId));
            toast.success("Port supprimé");
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }}>

                {/* En-tête */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                    <div style={{ padding: '0.75rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <MapPin size={28} color="#e60012" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0a1f5c' }}>Gestion des Ports & Pays</h1>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Référentiel maritime — Accès Administrateur</p>
                    </div>
                </div>

                {/* Contenu limité à 50% de largeur */}
                <div style={{ maxWidth: '50%', margin: '0 auto' }}>

                <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700, color: '#0a1f5c' }}>
                        1. Choisir un Pays
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                        <select
                            value={selectedCountry?.id || ""}
                            onChange={(e) => {
                                const found = countries.find(c => c.id === e.target.value);
                                setSelectedCountry(found || null);
                            }}
                            style={{
                                flex: 1, minWidth: '250px', height: '48px',
                                border: '2px solid #e2e8f0', borderRadius: '10px',
                                padding: '0 1rem', fontSize: '0.95rem', color: '#0a1f5c',
                                background: 'white', cursor: 'pointer'
                            }}
                        >
                            <option value="">— Sélectionner un pays —</option>
                            {countries.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setIsAddingCountry(v => !v)}
                            style={{
                                height: '48px', padding: '0 1.5rem', borderRadius: '10px',
                                border: '2px solid #e2e8f0', background: 'white',
                                fontWeight: 700, cursor: 'pointer', display: 'flex',
                                alignItems: 'center', gap: '0.5rem', color: '#0a1f5c',
                                fontSize: '0.9rem'
                            }}
                        >
                            <Plus size={18} /> Nouveau Pays
                        </button>
                    </div>

                    {isAddingCountry && (
                        <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: '#f1f5f9', borderRadius: '10px', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="Nom du pays (ex: SÉNÉGAL)"
                                value={newCountryName}
                                onChange={e => setNewCountryName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddCountry()}
                                style={{ flex: 1, minWidth: '200px', height: '42px', border: '2px solid #e2e8f0', borderRadius: '8px', padding: '0 1rem', fontSize: '0.95rem' }}
                            />
                            <button onClick={handleAddCountry} style={{ height: '42px', padding: '0 1.5rem', borderRadius: '8px', background: '#e60012', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                Enregistrer
                            </button>
                            <button onClick={() => setIsAddingCountry(false)} style={{ height: '42px', padding: '0 1rem', borderRadius: '8px', background: 'white', border: '2px solid #e2e8f0', cursor: 'pointer' }}>
                                Annuler
                            </button>
                        </div>
                    )}
                </div>

                {/* Gestion des ports */}
                <div style={{
                    background: 'white', borderRadius: '16px', padding: '2rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
                    opacity: selectedCountry ? 1 : 0.5
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0a1f5c' }}>
                            2. Ports {selectedCountry ? `— ${selectedCountry.name}` : '(choisissez d\'abord un pays)'}
                        </h3>
                        {selectedCountry && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    placeholder="Nom du port..."
                                    value={newPortName}
                                    onChange={e => setNewPortName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddPort()}
                                    style={{ height: '42px', border: '2px solid #e2e8f0', borderRadius: '8px', padding: '0 1rem', fontSize: '0.9rem', width: '220px' }}
                                />
                                <button onClick={handleAddPort} style={{ height: '42px', width: '42px', borderRadius: '8px', background: '#e60012', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Plus size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    {!selectedCountry ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                            <Globe size={40} style={{ margin: '0 auto 1rem', opacity: 0.4, display: 'block' }} />
                            <p style={{ fontWeight: 500 }}>Sélectionnez un pays pour voir et gérer ses ports.</p>
                        </div>
                    ) : isLoading ? (
                        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Chargement des ports...</p>
                    ) : ports.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                            <p style={{ color: '#94a3b8' }}>Aucun port enregistré pour {selectedCountry.name}.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                            {ports.map(p => (
                                <div key={p.id} style={{ padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0a1f5c' }}>{p.name}</span>
                                    <button
                                        onClick={() => handleDeletePort(p.id)}
                                        style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '2px' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#e60012')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                </div> {/* fin maxWidth 50% */}
            </main>
        </div>
    );
}
