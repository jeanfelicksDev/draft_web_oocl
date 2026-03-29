"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Ship, FileText, Search, Eye, AlertCircle, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { generateBLPDF } from "@/lib/pdfGenerator";

export default function AdminDraftsPage() {
    const [vessels, setVessels] = useState<any[]>([]);
    const [selectedVessel, setSelectedVessel] = useState<any>(null);
    const [voyages, setVoyages] = useState<any[]>([]);
    const [selectedVoyage, setSelectedVoyage] = useState<any>(null);
    
    const [expectedBookings, setExpectedBookings] = useState<any[]>([]);
    const [clientDrafts, setClientDrafts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load vessels
    useEffect(() => {
        fetch("/api/vessels")
            .then(r => r.ok ? r.json() : [])
            .then(data => setVessels(Array.isArray(data) ? data : []))
            .catch(() => toast.error("Impossible de charger les navires"));
    }, []);

    // Load voyages when vessel changes
    useEffect(() => {
        if (!selectedVessel) { setVoyages([]); setSelectedVoyage(null); return; }
        fetch(`/api/voyages?vesselId=${selectedVessel.id}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                setVoyages(Array.isArray(data) ? data : []);
                setSelectedVoyage(null);
            });
    }, [selectedVessel]);

    // Load comparison data when voyage changes
    useEffect(() => {
        if (!selectedVoyage) { setExpectedBookings([]); setClientDrafts([]); return; }
        setIsLoading(true);
        fetch(`/api/admin/drafts-comparison?voyageId=${selectedVoyage.id}`)
            .then(r => r.ok ? r.json() : { expected: [], drafts: [] })
            .then(data => {
                setExpectedBookings(data.expected || []);
                setClientDrafts(data.drafts || []);
            })
            .catch(() => toast.error("Erreur de chargement des données"))
            .finally(() => setIsLoading(false));
    }, [selectedVoyage]);

    const handleViewPdf = (draft: any) => {
        if (!draft) return;
        try {
            // Reformat the data to match what generateBLPDF expects (hydration)
            const hydratedData = {
                ...draft,
                typeReleased: draft.typeReleased?.name || "",
                vessel: draft.vessel?.name || "",
                voyage: draft.voyage?.number || "",
                etd: draft.voyage?.etdDate || "",
                // Relations like shipper, consignee, etc. are already handled as objects by the generator
            };
            generateBLPDF(hydratedData, true);
        } catch (e: any) {
            console.error("PDF Preview Error:", e);
            toast.error("Erreur lors de la génération du PDF");
        }
    };

    // UI helper for status badges
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "VALIDATED":
                return <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}><CheckCircle size={10} /> VALIDÉ</span>;
            case "DRAFT":
                return <span style={{ background: "#fef9c3", color: "#854d0e", padding: "2px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}><Clock size={10} /> BROUILLON</span>;
            default:
                return <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700 }}>{status}</span>;
        }
    };

    // Merged data for the table
    // Rules: 
    // 1. Show all expected bookings.
    // 2. If a draft matches an expected booking, pair them.
    // 3. Show all drafts that DON'T match an expected booking (at the end).
    const comparisonRows = (() => {
        const rows: any[] = [];
        const matchedDraftIds = new Set();

        // 1 & 2: Expected + Matched Drafts
        expectedBookings.forEach(exp => {
            const match = clientDrafts.find(d => d.bookingNumber?.trim().toUpperCase() === exp.number?.trim().toUpperCase());
            if (match) matchedDraftIds.add(match.id);
            rows.push({
                expected: exp.number,
                draftNumber: match?.bookingNumber || null,
                draftStatus: match?.saveStatus || null,
                draftData: match || null,
                isMatch: !!match,
                isUnexpected: false
            });
        });

        // 3: Unexpected Drafts
        clientDrafts.forEach(draft => {
            if (!matchedDraftIds.has(draft.id)) {
                rows.push({
                    expected: null,
                    draftNumber: draft.bookingNumber,
                    draftStatus: draft.saveStatus,
                    draftData: draft,
                    isMatch: false,
                    isUnexpected: true
                });
            }
        });

        return rows;
    })();

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <div className="main-content-inner">
                    <header className="content-header">
                        <h1>Suivi des Drafts Clients</h1>
                    </header>

                    <div className="grid-2" style={{ marginBottom: "2rem" }}>
                        <div className="form-container glass-panel">
                            <label><Ship size={14} style={{ marginRight: "6px" }} /> Sélectionner un Navire</label>
                            <select 
                                value={selectedVessel?.id || ""} 
                                onChange={(e) => setSelectedVessel(vessels.find(v => v.id === e.target.value))}
                            >
                                <option value="">-- Choisir un navire --</option>
                                {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>

                        <div className="form-container glass-panel" style={{ opacity: selectedVessel ? 1 : 0.5 }}>
                            <label><FileText size={14} style={{ marginRight: "6px" }} /> Sélectionner un Voyage</label>
                            <select 
                                disabled={!selectedVessel}
                                value={selectedVoyage?.id || ""} 
                                onChange={(e) => setSelectedVoyage(voyages.find(v => v.id === e.target.value))}
                            >
                                <option value="">-- Choisir un voyage --</option>
                                {voyages.map(v => <option key={v.id} value={v.id}>{v.number}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-container glass-panel" style={{ padding: "1.5rem" }}>
                        <div className="form-section-title">Comparaison des Bookings</div>
                        
                        {!selectedVoyage ? (
                            <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                                <Search size={40} style={{ marginBottom: "1rem", opacity: 0.3 }} />
                                <p>Veuillez sélectionner un navire et un voyage pour afficher le suivi.</p>
                            </div>
                        ) : isLoading ? (
                            <div style={{ textAlign: "center", padding: "3rem" }}>Chargement en cours...</div>
                        ) : comparisonRows.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                                Aucun booking trouvé pour ce voyage.
                            </div>
                        ) : (
                            <table style={{ border: "none", background: "transparent" }}>
                                <thead>
                                    <tr>
                                        <th style={{ background: "#f8fafc", borderRadius: "10px 0 0 0" }}>Booking Attendu</th>
                                        <th style={{ background: "#f8fafc" }}>Draft Client</th>
                                        <th style={{ background: "#f8fafc", textAlign: "center", borderRadius: "0 10px 0 0" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonRows.map((row, idx) => (
                                        <tr key={idx} style={{ 
                                            background: row.isUnexpected ? "#fff1f2" : "transparent",
                                            borderLeft: row.isUnexpected ? "4px solid #ef4444" : "none"
                                        }}>
                                            <td style={{ fontWeight: 800, color: row.expected ? "#0a1f5c" : "#94a3b8", fontSize: "0.95rem" }}>
                                                {row.expected || (
                                                    <span style={{ fontSize: "0.75rem", fontStyle: "italic", fontWeight: 400, color: "#ef4444", display: "flex", alignItems: "center", gap: "4px" }}>
                                                        <AlertCircle size={12} /> Non répertorié
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ fontWeight: 700 }}>
                                                {row.draftNumber ? (
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                        <span style={{ color: "#0a1f5c" }}>{row.draftNumber}</span>
                                                        {getStatusBadge(row.draftStatus)}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: "#cbd5e1", fontStyle: "italic", fontSize: "0.85rem" }}>En attente de soumission...</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {row.draftData && (
                                                    <button 
                                                        onClick={() => handleViewPdf(row.draftData)}
                                                        className="btn-outline"
                                                        style={{ padding: "6px 12px", fontSize: "0.75rem", background: "white" }}
                                                    >
                                                        <Eye size={14} /> Voir Draft PDF
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
