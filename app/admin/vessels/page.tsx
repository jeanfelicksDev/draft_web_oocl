"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Ship, Plus, Trash2, Calendar, Anchor } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminVesselsPage() {
    const [vessels, setVessels] = useState<any[]>([]);
    const [selectedVessel, setSelectedVessel] = useState<any>(null);
    const [voyages, setVoyages] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [voyageSearchTerm, setVoyageSearchTerm] = useState("");
    
    // Form states
    const [newVesselName, setNewVesselName] = useState("");
    const [isAddingVessel, setIsAddingVessel] = useState(false);
    const [editingVesselId, setEditingVesselId] = useState<string | null>(null);
    const [editingVesselName, setEditingVesselName] = useState("");
    
    const [newVoyageNumber, setNewVoyageNumber] = useState("");
    const [newEtdDate, setNewEtdDate] = useState("");
    const [newEtaDate, setNewEtaDate] = useState("");
    const [editingVoyageId, setEditingVoyageId] = useState<string | null>(null);
    const [editingVoyageNumber, setEditingVoyageNumber] = useState("");
    const [editingEtdDate, setEditingEtdDate] = useState("");
    const [editingEtaDate, setEditingEtaDate] = useState("");
    
    const [isLoading, setIsLoading] = useState(false);
    const [showRotationForm, setShowRotationForm] = useState(false);

    const [selectedVoyage, setSelectedVoyage] = useState<any>(null);
    const [expectedBookings, setExpectedBookings] = useState<any[]>([]);
    const [newBookingNumber, setNewBookingNumber] = useState("");
    const [isBookingLoading, setIsBookingLoading] = useState(false);

    // Load vessels
    useEffect(() => {
        fetch("/api/vessels")
            .then(r => r.ok ? r.json() : [])
            .then(data => setVessels(Array.isArray(data) ? data : []))
            .catch(() => toast.error("Impossible de charger les navires"));
    }, []);

    useEffect(() => {
        if (!selectedVessel) { setVoyages([]); setSelectedVoyage(null); return; }
        setIsLoading(true);
        fetch(`/api/voyages?vesselId=${selectedVessel.id}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                setVoyages(Array.isArray(data) ? data : []);
                setSelectedVoyage(null);
            })
            .finally(() => setIsLoading(false));
    }, [selectedVessel]);

    // Load bookings when voyage changes
    useEffect(() => {
        if (!selectedVoyage) { setExpectedBookings([]); return; }
        setIsBookingLoading(true);
        fetch(`/api/expected-bookings?voyageId=${selectedVoyage.id}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => setExpectedBookings(Array.isArray(data) ? data : []))
            .finally(() => setIsBookingLoading(false));
    }, [selectedVoyage]);

    const handleAddVessel = async () => {
        if (!newVesselName.trim()) return;
        const res = await fetch("/api/vessels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newVesselName.trim().toUpperCase() })
        });
        if (res.ok) {
            const saved = await res.json();
            setVessels(prev => [...prev.filter(v => v.id !== saved.id), saved].sort((a,b) => a.name.localeCompare(b.name)));
            setSelectedVessel(saved);
            setNewVesselName("");
            setIsAddingVessel(false);
            toast.success("Navire ajouté !");
        } else {
            toast.error("Erreur lors de l'ajout du navire");
        }
    };

    const handleUpdateVessel = async () => {
        if (!editingVesselId || !editingVesselName.trim()) return;
        const res = await fetch(`/api/vessels/${editingVesselId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: editingVesselName.trim().toUpperCase() })
        });
        if (res.ok) {
            const updated = await res.json();
            setVessels(prev => prev.map(v => v.id === updated.id ? updated : v));
            if (selectedVessel?.id === editingVesselId) setSelectedVessel(updated);
            setEditingVesselId(null);
            toast.success("Navire mis à jour !");
        } else {
            toast.error("Erreur lors de la mise à jour");
        }
    };

    const handleAddVoyage = async () => {
        if (!newVoyageNumber.trim() || !selectedVessel) return;
        const res = await fetch("/api/voyages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                number: newVoyageNumber.trim().toUpperCase(), 
                vesselId: selectedVessel.id,
                etdDate: newEtdDate,
                etaDate: newEtaDate
            })
        });
        if (res.ok) {
            const saved = await res.json();
            setVoyages(prev => [saved, ...prev]);
            setNewVoyageNumber("");
            setNewEtdDate("");
            setNewEtaDate("");
            setShowRotationForm(false);
            toast.success("Voyage ajouté !");
        } else {
            toast.error("Erreur lors de l'ajout du voyage");
        }
    };

    const handleUpdateVoyage = async () => {
        if (!editingVoyageId || !editingVoyageNumber.trim()) return;
        const res = await fetch(`/api/voyages/${editingVoyageId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                number: editingVoyageNumber.trim().toUpperCase(), 
                vesselId: selectedVessel.id,
                etdDate: editingEtdDate,
                etaDate: editingEtaDate
            })
        });
        if (res.ok) {
            const updated = await res.json();
            setVoyages(prev => prev.map(v => v.id === updated.id ? updated : v));
            if (selectedVoyage?.id === editingVoyageId) setSelectedVoyage(updated);
            setEditingVoyageId(null);
            toast.success("Voyage mis à jour !");
        } else {
            toast.error("Erreur lors de la mise à jour");
        }
    };

    const handleDeleteVoyage = async (voyageId: string) => {
        if (!window.confirm("Supprimer ce voyage ?")) return;
        const res = await fetch(`/api/voyages/${voyageId}`, { method: "DELETE" });
        if (res.ok) {
            setVoyages(prev => prev.filter(v => v.id !== voyageId));
            toast.success("Voyage supprimé");
        }
    };

    const handleDeleteVessel = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Supprimer ce navire et tous ses voyages ?")) return;
        const res = await fetch(`/api/vessels/${id}`, { method: "DELETE" });
        if (res.ok) {
            setVessels(prev => prev.filter(v => v.id !== id));
            if (selectedVessel?.id === id) setSelectedVessel(null);
            toast.success("Navire supprimé");
        }
    };

    const handleAddBooking = async () => {
        if (!newBookingNumber.trim() || !selectedVoyage) return;
        const res = await fetch("/api/expected-bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                number: newBookingNumber.trim().toUpperCase(), 
                voyageId: selectedVoyage.id 
            })
        });
        if (res.ok) {
            const saved = await res.json();
            setExpectedBookings(prev => [saved, ...prev]);
            setNewBookingNumber("");
            toast.success("Booking ajouté !");
        } else {
            toast.error("Erreur lors de l'ajout du booking");
        }
    };

    const handleDeleteBooking = async (id: string) => {
        if (!window.confirm("Supprimer ce booking ?")) return;
        const res = await fetch(`/api/expected-bookings/${id}`, { method: "DELETE" });
        if (res.ok) {
            setExpectedBookings(prev => prev.filter(b => b.id !== id));
            toast.success("Booking supprimé");
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }}>

                {/* Header Centered */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0a1f5c' }}>Gestion Navires & Voyages</h1>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Flotte maritime — Accès Administrateur</p>
                </div>

                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    
                    {/* 1. Vessel Selection */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700, color: '#0a1f5c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Anchor size={18} /> 1. Sélectionner un Navire
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                                <select
                                    value={selectedVessel?.id || ""}
                                    onChange={(e) => {
                                        const found = vessels.find(v => v.id === e.target.value);
                                        setSelectedVessel(found || null);
                                    }}
                                    style={{
                                        width: '100%', height: '48px',
                                        border: '2px solid #e2e8f0', borderRadius: '10px',
                                        padding: '0 1rem', fontSize: '0.95rem', color: '#0a1f5c',
                                        background: 'white', cursor: 'pointer', fontWeight: 600
                                    }}
                                >
                                    <option value="">— Sélectionner un navire —</option>
                                    {vessels
                                        .filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <input
                                type="text"
                                placeholder="🔍 Filtrer..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ width: '120px', height: '48px', border: '2px solid #e2e8f0', borderRadius: '10px', padding: '0 0.75rem', fontSize: '0.9rem' }}
                            />

                            <button
                                onClick={() => setIsAddingVessel(v => !v)}
                                style={{
                                    height: '48px', padding: '0 1.5rem', borderRadius: '10px',
                                    border: '2px solid #e2e8f0', background: 'white',
                                    fontWeight: 700, cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', gap: '0.5rem', color: '#0a1f5c',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <Plus size={18} /> Nouveau Navire
                            </button>

                            {selectedVessel && (
                                <button
                                    onClick={() => {
                                        setEditingVesselId(selectedVessel.id);
                                        setEditingVesselName(selectedVessel.name);
                                    }}
                                    style={{
                                        height: '48px', width: '48px', borderRadius: '10px',
                                        border: '2px solid #e2e8f0', background: 'white',
                                        cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', color: '#64748b'
                                    }}
                                >
                                    <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
                                </button>
                            )}
                        </div>

                        {isAddingVessel && (
                            <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: '#f1f5f9', borderRadius: '10px', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="Nom du navire (ex: OOCL BRISBANE)"
                                    value={newVesselName}
                                    onChange={e => setNewVesselName(e.target.value.toUpperCase())}
                                    onKeyDown={e => e.key === 'Enter' && handleAddVessel()}
                                    style={{ flex: 1, minWidth: '200px', height: '42px', border: '2px solid #e2e8f0', borderRadius: '8px', padding: '0 1rem', fontSize: '0.95rem' }}
                                />
                                <button onClick={handleAddVessel} style={{ height: '42px', padding: '0 1.5rem', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                    Enregistrer
                                </button>
                                <button onClick={() => setIsAddingVessel(false)} style={{ height: '42px', padding: '0 1rem', borderRadius: '8px', background: 'white', border: '2px solid #e2e8f0', cursor: 'pointer' }}>
                                    Annuler
                                </button>
                            </div>
                        )}

                        {editingVesselId && (
                            <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#ef4444', marginBottom: '4px' }}>RÉNOMMER LE NAVIRE</label>
                                    <input
                                        type="text"
                                        value={editingVesselName}
                                        onChange={e => setEditingVesselName(e.target.value.toUpperCase())}
                                        style={{ width: '100%', height: '42px', border: '2px solid #fee2e2', borderRadius: '8px', padding: '0 1rem', fontSize: '0.95rem', fontWeight: 700 }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={handleUpdateVessel} style={{ height: '42px', padding: '0 1.5rem', borderRadius: '8px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                        Mettre à jour
                                    </button>
                                    <button onClick={() => setEditingVesselId(null)} style={{ height: '42px', padding: '0 1rem', borderRadius: '8px', background: 'white', border: '2px solid #fee2e2', cursor: 'pointer' }}>
                                        Annuler
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeleteVessel(editingVesselId, e as any)}
                                        style={{ height: '42px', width: '42px', borderRadius: '8px', background: 'white', border: '2px solid #fee2e2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Voyages Management */}
                    <div style={{
                        background: 'white', borderRadius: '16px', padding: '2rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
                        opacity: selectedVessel ? 1 : 0.5,
                        transition: 'opacity 0.3s'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0a1f5c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={18} /> 2. Voyages {selectedVessel ? `— ${selectedVessel.name}` : '(choisissez un navire)'}
                            </h3>
                            {selectedVessel && (
                                <button
                                    onClick={() => setShowRotationForm(!showRotationForm)}
                                    style={{
                                        height: '36px', padding: '0 1rem', borderRadius: '8px',
                                        background: showRotationForm ? '#f1f5f9' : 'var(--primary)',
                                        color: showRotationForm ? '#0a1f5c' : 'white',
                                        border: 'none', fontWeight: 700, cursor: 'pointer',
                                        fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem'
                                    }}
                                >
                                    {showRotationForm ? 'Annuler' : <><Plus size={16} /> Ajouter une rotation</>}
                                </button>
                            )}
                        </div>

                        {selectedVessel && showRotationForm && (
                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                                    Ajouter une rotation
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: '#64748b' }}>N° Voyage</label>
                                        <input
                                            type="text"
                                            placeholder="ex: 215E"
                                            value={newVoyageNumber}
                                            onChange={e => setNewVoyageNumber(e.target.value.toUpperCase())}
                                            style={{ width: '100%', height: '42px', border: '2px solid #e2e8f0', borderRadius: '8px', padding: '0 0.8rem', fontSize: '0.9rem', fontWeight: 700 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: '#64748b' }}>Date ETD</label>
                                        <input
                                            type="date"
                                            value={newEtdDate}
                                            onChange={e => setNewEtdDate(e.target.value)}
                                            style={{ width: '100%', height: '42px', border: '2px solid #e2e8f0', borderRadius: '8px', padding: '0 0.8rem', fontSize: '0.9rem', fontWeight: 600 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: '#64748b' }}>Date ETA</label>
                                        <input
                                            type="date"
                                            value={newEtaDate}
                                            onChange={e => setNewEtaDate(e.target.value)}
                                            style={{ width: '100%', height: '42px', border: '2px solid #e2e8f0', borderRadius: '8px', padding: '0 0.8rem', fontSize: '0.9rem', fontWeight: 600 }}
                                        />
                                    </div>
                                    <button 
                                        onClick={handleAddVoyage}
                                        style={{ height: '42px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}
                                    >
                                        Ajouter
                                    </button>
                                </div>
                            </div>
                        )}

                        {selectedVessel && (
                            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <input
                                    type="text"
                                    placeholder="🔍 Filtrer voyages..."
                                    value={voyageSearchTerm}
                                    onChange={e => setVoyageSearchTerm(e.target.value)}
                                    style={{ width: '200px', height: '36px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.85rem' }}
                                />
                            </div>
                        )}

                        {!selectedVessel ? (
                            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                                <Ship size={40} style={{ margin: '0 auto 1rem', opacity: 0.2, display: 'block' }} />
                                <p style={{ fontWeight: 500 }}>Veuillez sélectionner un navire pour gérer ses voyages.</p>
                            </div>
                        ) : isLoading ? (
                            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Chargement des voyages...</p>
                        ) : voyages.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                                <p style={{ color: '#94a3b8' }}>Aucun voyage enregistré pour {selectedVessel.name}.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                                            <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800 }}>N° VOYAGE</th>
                                            <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800 }}>DATE ETD</th>
                                            <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800 }}>DATE ETA</th>
                                            <th style={{ padding: '1rem', textAlign: 'right' }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {voyages
                                            .filter(v => v.number.toLowerCase().includes(voyageSearchTerm.toLowerCase()))
                                            .map(v => (
                                                <React.Fragment key={v.id}>
                                                    <tr 
                                                        onClick={() => setSelectedVoyage(v)}
                                                        style={{ 
                                                            borderBottom: '1px solid #f1f5f9', 
                                                            cursor: 'pointer',
                                                            background: selectedVoyage?.id === v.id ? '#f1f5f9' : (editingVoyageId === v.id ? '#fff1f2' : 'transparent'),
                                                            transition: 'background 0.2s'
                                                        }}
                                                    >
                                                        <td style={{ padding: '1rem', fontWeight: 800, color: '#0a1f5c' }}>{v.number}</td>
                                                        <td style={{ padding: '1rem', color: '#0a1f5c', fontWeight: 600 }}>
                                                            {v.etdDate ? new Date(v.etdDate).toLocaleDateString() : '—'}
                                                        </td>
                                                        <td style={{ padding: '1rem', color: '#0a1f5c', fontWeight: 600 }}>
                                                            {v.etaDate ? new Date(v.etaDate).toLocaleDateString() : '—'}
                                                        </td>
                                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                                <button
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        setEditingVoyageId(v.id);
                                                                        setEditingVoyageNumber(v.number);
                                                                        setEditingEtdDate(v.etdDate ? v.etdDate.split('T')[0] : "");
                                                                        setEditingEtaDate(v.etaDate ? v.etaDate.split('T')[0] : "");
                                                                    }}
                                                                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                                                                >
                                                                    <Plus size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteVoyage(v.id); }}
                                                                    style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}
                                                                    onMouseEnter={e => (e.currentTarget.style.color = '#e60012')}
                                                                    onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {editingVoyageId === v.id && (
                                                        <tr style={{ background: '#fff1f2' }}>
                                                            <td colSpan={4} style={{ padding: '1rem' }}>
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                                                                    <div>
                                                                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#ef4444' }}>N° VOYAGE</label>
                                                                        <input
                                                                            type="text"
                                                                            value={editingVoyageNumber}
                                                                            onChange={e => setEditingVoyageNumber(e.target.value.toUpperCase())}
                                                                            style={{ width: '100%', height: '36px', border: '1px solid #fee2e2', borderRadius: '6px', padding: '0 0.5rem' }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#ef4444' }}>ETD</label>
                                                                        <input
                                                                            type="date"
                                                                            value={editingEtdDate}
                                                                            onChange={e => setEditingEtdDate(e.target.value)}
                                                                            style={{ width: '100%', height: '36px', border: '1px solid #fee2e2', borderRadius: '6px', padding: '0 0.5rem' }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#ef4444' }}>ETA</label>
                                                                        <input
                                                                            type="date"
                                                                            value={editingEtaDate}
                                                                            onChange={e => setEditingEtaDate(e.target.value)}
                                                                            style={{ width: '100%', height: '36px', border: '1px solid #fee2e2', borderRadius: '6px', padding: '0 0.5rem' }}
                                                                        />
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                                        <button onClick={handleUpdateVoyage} style={{ flex: 1, height: '36px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem' }}>Enregistrer</button>
                                                                        <button onClick={() => setEditingVoyageId(null)} style={{ height: '36px', padding: '0 0.75rem', background: 'white', border: '1px solid #fee2e2', borderRadius: '6px' }}>Annuler</button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* 3. Expected Bookings Management */}
                    <div style={{
                        marginTop: '1.5rem',
                        background: 'white', borderRadius: '16px', padding: '2rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
                        opacity: selectedVoyage ? 1 : 0.5,
                        transition: 'opacity 0.3s'
                    }}>
                        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 700, color: '#0a1f5c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Ship size={18} /> 3. Bookings Attendus {selectedVoyage ? `— ${selectedVoyage.number}` : '(cliquez sur un voyage)'}
                        </h3>

                        {selectedVoyage ? (
                            <>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Numéro de Booking (ex: 1234567890)"
                                        value={newBookingNumber}
                                        onChange={e => setNewBookingNumber(e.target.value.toUpperCase())}
                                        onKeyDown={e => e.key === 'Enter' && handleAddBooking()}
                                        style={{ flex: 1, height: '42px', border: '2px solid #e2e8f0', borderRadius: '10px', padding: '0 1rem', fontSize: '0.9rem', fontWeight: 700 }}
                                    />
                                    <button 
                                        onClick={handleAddBooking}
                                        style={{ height: '42px', padding: '0 1.5rem', borderRadius: '10px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        Ajouter
                                    </button>
                                </div>

                                {isBookingLoading ? (
                                    <p style={{ color: '#94a3b8', textAlign: 'center' }}>Chargement...</p>
                                ) : expectedBookings.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                                        Aucun booking attendu pour ce voyage.
                                    </div>
                                ) : (
                                    <div className="custom-scrollbar" style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: '0.4rem',
                                        maxHeight: '400px',
                                        overflowY: 'auto',
                                        paddingRight: '4px'
                                    }}>
                                        {expectedBookings.map((b, index) => (
                                            <div key={b.id} style={{ 
                                                background: '#f8fafc', 
                                                padding: '0.4rem 1rem', 
                                                borderRadius: '10px', 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                border: '1px solid #e2e8f0',
                                                transition: 'all 0.2s'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', width: '20px' }}>
                                                        {index + 1}.
                                                    </span>
                                                    <span style={{ fontWeight: 800, color: '#0a1f5c', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                                                        {b.number}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteBooking(b.id)}
                                                    style={{ 
                                                        background: 'white', 
                                                        border: '1px solid #e2e8f0', 
                                                        color: '#cbd5e1', 
                                                        cursor: 'pointer',
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.color = '#e60012';
                                                        e.currentTarget.style.borderColor = '#fee2e2';
                                                        e.currentTarget.style.background = '#fef2f2';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.color = '#cbd5e1';
                                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                                        e.currentTarget.style.background = 'white';
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                <p>Veuillez sélectionner un voyage dans la liste ci-dessus.</p>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
