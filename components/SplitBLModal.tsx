"use client";

import React, { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Ship, ArrowRight, ArrowLeft, Check, ChevronRight } from "lucide-react";

/* ══════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════ */
interface Container {
    id: string;
    containerNum: string;
    typeTc?: string | null;
    sealNum?: string | null;
    count?: number | null;
    packageType?: string | null;
    grossWeight?: number | null;
    netWeight?: number | null;
    volume?: number | null;
}

interface SplitBLModalProps {
    isOpen: boolean;
    bl: {
        id: string;
        bookingNumber: string;
        containers: Container[];
    } | null;
    onClose: () => void;
    onSuccess: (newBLs: any[]) => void;
}

/* ══════════════════════════════════════════════════════════
   CONTAINER CARD
   ══════════════════════════════════════════════════════════ */
function ContainerCard({
    container,
    selected,
    onClick,
}: {
    container: Container;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            style={{
                padding: "0.6rem 0.8rem",
                borderRadius: "8px",
                border: `2px solid ${selected ? "#E60012" : "#e2e8f0"}`,
                background: selected ? "rgba(230,0,18,0.06)" : "#fff",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                transition: "all 0.15s",
                userSelect: "none",
            }}
        >
            <span style={{ fontWeight: 800, fontSize: "0.8rem", color: "#0a1f5c" }}>
                {container.containerNum}
            </span>
            <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                {[container.typeTc, container.sealNum, container.count ? `${container.count} pkg` : null]
                    .filter(Boolean)
                    .join(" · ")}
            </span>
            {container.grossWeight ? (
                <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                    {container.grossWeight} kg
                </span>
            ) : null}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   MAIN MODAL
   ══════════════════════════════════════════════════════════ */
export function SplitBLModal({ isOpen, bl, onClose, onSuccess }: SplitBLModalProps) {
    // ── Step state ──
    // "count" → ask how many splits
    // number  → assign containers for that split index (1-based)
    // "done"  → confirmation
    const [phase, setPhase] = useState<"count" | number | "done">("count");
    const [splitCount, setSplitCount] = useState(2);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // splits[i] = array of containers assigned to split i+1
    const [splits, setSplits] = useState<Container[][]>([]);
    // remaining = containers not yet assigned (starts as all containers)
    const [remaining, setRemaining] = useState<Container[]>([]);

    // Selection state for move operations
    const [selectedLeft, setSelectedLeft] = useState<Set<string>>(new Set());
    const [selectedRight, setSelectedRight] = useState<Set<string>>(new Set());

    /* ─── Init / Reset ─── */
    const initSplits = useCallback((count: number) => {
        const allContainers = bl?.containers ?? [];
        setSplits(Array.from({ length: count }, () => []));
        setRemaining([...allContainers]);
        setSelectedLeft(new Set());
        setSelectedRight(new Set());
        setPhase(1);
    }, [bl]);

    const reset = () => {
        setPhase("count");
        setSplitCount(2);
        setSplits([]);
        setRemaining([]);
        setSelectedLeft(new Set());
        setSelectedRight(new Set());
    };

    /* ─── Move containers: left → right (remaining → current split) ─── */
    const moveToRight = () => {
        if (typeof phase !== "number") return;
        const idx = phase - 1;
        const toMove = remaining.filter((c) => selectedLeft.has(c.id));
        if (toMove.length === 0) return;
        setRemaining((prev) => prev.filter((c) => !selectedLeft.has(c.id)));
        setSplits((prev) => {
            const next = [...prev];
            next[idx] = [...next[idx], ...toMove];
            return next;
        });
        setSelectedLeft(new Set());
    };

    /* ─── Move containers: right → left (current split → remaining) ─── */
    const moveToLeft = () => {
        if (typeof phase !== "number") return;
        const idx = phase - 1;
        const toMove = splits[idx]?.filter((c) => selectedRight.has(c.id)) ?? [];
        if (toMove.length === 0) return;
        setSplits((prev) => {
            const next = [...prev];
            next[idx] = next[idx].filter((c) => !selectedRight.has(c.id));
            return next;
        });
        setRemaining((prev) => [...prev, ...toMove]);
        setSelectedRight(new Set());
    };

    /* ─── Toggle selection helpers ─── */
    const toggleLeft = (id: string) =>
        setSelectedLeft((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const toggleRight = (id: string) =>
        setSelectedRight((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    /* ─── Navigate between steps ─── */
    const goNext = () => {
        if (typeof phase !== "number") return;
        setSelectedLeft(new Set());
        setSelectedRight(new Set());
        if (phase < splitCount) {
            setPhase(phase + 1);
        } else {
            setPhase("done");
        }
    };

    const goPrev = () => {
        if (typeof phase !== "number") return;
        if (phase > 1) {
            setSelectedLeft(new Set());
            setSelectedRight(new Set());
            setPhase(phase - 1);
        }
    };

    /* ─── Finish: call API ─── */
    const handleFinish = async () => {
        if (typeof phase !== "done" || !bl) return;

        // Validate: every split has at least one container
        const emptyIdx = splits.findIndex((s) => s.length === 0);
        if (emptyIdx !== -1) {
            toast.error(`Le split n°${emptyIdx + 1} n'a aucun conteneur. Veuillez redistribuer.`);
            setPhase(emptyIdx + 1);
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/billoflading/split", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    originalBlId: bl.id,
                    splits: splits.map((containers) => ({ containers })),
                }),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`BL splitté en ${splits.length} documents !`);
                onSuccess(data.splits);
                reset();
                onClose();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || "Erreur lors du split.");
            }
        } catch {
            toast.error("Erreur de connexion.");
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ─── Don't render when closed ─── */
    if (!isOpen || !bl) return null;

    const currentSplitContainers = typeof phase === "number" ? (splits[phase - 1] ?? []) : [];

    /* ════════════════════════════════════════════
       RENDER
       ════════════════════════════════════════════ */
    return (
        <div
            className="modal-overlay"
            style={{ zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={(e) => {
                if (e.target === e.currentTarget) { reset(); onClose(); }
            }}
        >
            <div
                style={{
                    background: "#fff",
                    borderRadius: "18px",
                    boxShadow: "0 24px 80px rgba(0,0,18,0.22)",
                    width: "min(900px, 96vw)",
                    maxHeight: "90vh",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div style={{
                    background: "linear-gradient(135deg,#E60012 0%,#b8000e 100%)",
                    padding: "1.25rem 1.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                }}>
                    <Ship size={22} color="#fff" />
                    <div>
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.72rem", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Split du Booking
                        </p>
                        <h2 style={{ color: "#fff", fontWeight: 900, fontSize: "1.1rem", margin: 0 }}>
                            #{bl.bookingNumber}
                        </h2>
                    </div>

                    {/* Step tracker */}
                    {typeof phase === "number" && (
                        <div style={{ marginLeft: "auto", display: "flex", gap: "6px", alignItems: "center" }}>
                            {Array.from({ length: splitCount }, (_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        width: 28, height: 28, borderRadius: "50%",
                                        background: i + 1 < phase ? "rgba(255,255,255,0.4)" : i + 1 === phase ? "#fff" : "rgba(255,255,255,0.15)",
                                        color: i + 1 === phase ? "#E60012" : "#fff",
                                        fontWeight: 900, fontSize: "0.75rem",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        border: i + 1 === phase ? "none" : "1.5px solid rgba(255,255,255,0.3)",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {i + 1 < phase ? <Check size={13} /> : i + 1}
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => { reset(); onClose(); }}
                        style={{
                            marginLeft: typeof phase === "number" ? "0.75rem" : "auto",
                            background: "rgba(255,255,255,0.2)",
                            border: "none", borderRadius: "50%",
                            width: 32, height: 32, cursor: "pointer",
                            color: "#fff", fontSize: "1.1rem",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* ── Body ── */}
                <div style={{ flex: 1, overflowY: "auto", padding: "1.75rem" }}>

                    {/* ── PHASE: count ── */}
                    {phase === "count" && (
                        <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                            <div style={{
                                width: 70, height: 70, borderRadius: "50%",
                                background: "rgba(230,0,18,0.08)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 1.5rem",
                            }}>
                                <Ship size={34} color="#E60012" />
                            </div>
                            <h3 style={{ fontWeight: 900, fontSize: "1.25rem", color: "#0a1f5c", marginBottom: "0.5rem" }}>
                                Combien de BL souhaitez-vous obtenir à partir de ce booking ?
                            </h3>
                            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "2rem" }}>
                                {bl.containers.length} conteneur(s) au total · Chaque split recevra au moins 1 conteneur.
                            </p>

                            {/* Number picker */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.25rem", marginBottom: "2rem" }}>
                                <button
                                    onClick={() => setSplitCount((n) => Math.max(2, n - 1))}
                                    disabled={splitCount <= 2}
                                    style={{
                                        width: 44, height: 44, borderRadius: "50%",
                                        border: "2px solid #e2e8f0",
                                        background: splitCount <= 2 ? "#f8fafc" : "#fff",
                                        fontSize: "1.3rem", fontWeight: 900, cursor: splitCount <= 2 ? "default" : "pointer",
                                        color: splitCount <= 2 ? "#cbd5e1" : "#0a1f5c",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}
                                >
                                    –
                                </button>
                                <div style={{
                                    width: 90, height: 90, borderRadius: "50%",
                                    background: "linear-gradient(135deg,#E60012,#b8000e)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: "0 8px 24px rgba(230,0,18,0.3)",
                                }}>
                                    <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                                        {splitCount}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSplitCount((n) => Math.min(9, n + 1))}
                                    disabled={splitCount >= 9 || splitCount >= bl.containers.length}
                                    style={{
                                        width: 44, height: 44, borderRadius: "50%",
                                        border: "2px solid #e2e8f0",
                                        background: (splitCount >= 9 || splitCount >= bl.containers.length) ? "#f8fafc" : "#fff",
                                        fontSize: "1.3rem", fontWeight: 900,
                                        cursor: (splitCount >= 9 || splitCount >= bl.containers.length) ? "default" : "pointer",
                                        color: (splitCount >= 9 || splitCount >= bl.containers.length) ? "#cbd5e1" : "#0a1f5c",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}
                                >
                                    +
                                </button>
                            </div>

                            {/* Quick pick row */}
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "1rem" }}>
                                {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                                    <button
                                        key={n}
                                        disabled={n > bl.containers.length}
                                        onClick={() => setSplitCount(n)}
                                        style={{
                                            width: 38, height: 38, borderRadius: "10px",
                                            border: splitCount === n ? "2px solid #E60012" : "1.5px solid #e2e8f0",
                                            background: splitCount === n ? "rgba(230,0,18,0.08)" : n > bl.containers.length ? "#f8fafc" : "#fff",
                                            color: n > bl.containers.length ? "#cbd5e1" : splitCount === n ? "#E60012" : "#0a1f5c",
                                            fontWeight: 800, fontSize: "0.88rem", cursor: n > bl.containers.length ? "default" : "pointer",
                                        }}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── PHASE: assign containers per split ── */}
                    {typeof phase === "number" && (
                        <div>
                            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                                <h3 style={{ fontWeight: 800, color: "#0a1f5c", margin: 0 }}>
                                    Split n°{phase} — <span style={{ color: "#E60012" }}>{bl.bookingNumber} ({phase})</span>
                                </h3>
                                <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
                                    Sélectionnez les conteneurs à affecter à ce split, puis utilisez les flèches pour les déplacer.
                                </p>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "1rem", alignItems: "start" }}>

                                {/* ── Left panel: remaining ── */}
                                <div style={{
                                    border: "1.5px solid #e2e8f0",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                }}>
                                    <div style={{
                                        background: "#f8fafc",
                                        padding: "0.6rem 1rem",
                                        borderBottom: "1px solid #e2e8f0",
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                    }}>
                                        <span style={{ fontWeight: 800, fontSize: "0.8rem", color: "#475569" }}>
                                            Conteneurs disponibles
                                        </span>
                                        <span style={{
                                            background: "#e2e8f0", color: "#475569",
                                            borderRadius: "20px", padding: "2px 8px",
                                            fontWeight: 800, fontSize: "0.72rem",
                                        }}>
                                            {remaining.length}
                                        </span>
                                    </div>
                                    <div style={{
                                        minHeight: 200, maxHeight: 340, overflowY: "auto",
                                        padding: "0.75rem",
                                        display: "flex", flexDirection: "column", gap: "0.5rem",
                                        background: "#fff",
                                    }}>
                                        {remaining.length === 0 ? (
                                            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.8rem", padding: "2rem 0" }}>
                                                Tous les conteneurs sont affectés.
                                            </p>
                                        ) : (
                                            remaining.map((c) => (
                                                <ContainerCard
                                                    key={c.id}
                                                    container={c}
                                                    selected={selectedLeft.has(c.id)}
                                                    onClick={() => toggleLeft(c.id)}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* ── Arrow buttons ── */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingTop: "3.5rem" }}>
                                    <button
                                        onClick={moveToRight}
                                        disabled={selectedLeft.size === 0}
                                        title="Déplacer vers ce split"
                                        style={{
                                            width: 44, height: 44, borderRadius: "12px",
                                            border: "2px solid",
                                            borderColor: selectedLeft.size > 0 ? "#E60012" : "#e2e8f0",
                                            background: selectedLeft.size > 0 ? "#E60012" : "#f8fafc",
                                            color: selectedLeft.size > 0 ? "#fff" : "#cbd5e1",
                                            cursor: selectedLeft.size > 0 ? "pointer" : "default",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            transition: "all 0.18s",
                                        }}
                                    >
                                        <ArrowRight size={20} />
                                    </button>
                                    <button
                                        onClick={moveToLeft}
                                        disabled={selectedRight.size === 0}
                                        title="Remettre dans le pool"
                                        style={{
                                            width: 44, height: 44, borderRadius: "12px",
                                            border: "2px solid",
                                            borderColor: selectedRight.size > 0 ? "#0a1f5c" : "#e2e8f0",
                                            background: selectedRight.size > 0 ? "#0a1f5c" : "#f8fafc",
                                            color: selectedRight.size > 0 ? "#fff" : "#cbd5e1",
                                            cursor: selectedRight.size > 0 ? "pointer" : "default",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            transition: "all 0.18s",
                                        }}
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                </div>

                                {/* ── Right panel: this split ── */}
                                <div style={{
                                    border: "1.5px solid #E60012",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    boxShadow: "0 0 0 3px rgba(230,0,18,0.07)",
                                }}>
                                    <div style={{
                                        background: "rgba(230,0,18,0.06)",
                                        padding: "0.6rem 1rem",
                                        borderBottom: "1px solid rgba(230,0,18,0.15)",
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                    }}>
                                        <span style={{ fontWeight: 800, fontSize: "0.8rem", color: "#E60012" }}>
                                            {bl.bookingNumber} ({phase})
                                        </span>
                                        <span style={{
                                            background: "#E60012", color: "#fff",
                                            borderRadius: "20px", padding: "2px 8px",
                                            fontWeight: 800, fontSize: "0.72rem",
                                        }}>
                                            {currentSplitContainers.length}
                                        </span>
                                    </div>
                                    <div style={{
                                        minHeight: 200, maxHeight: 340, overflowY: "auto",
                                        padding: "0.75rem",
                                        display: "flex", flexDirection: "column", gap: "0.5rem",
                                        background: "#fff",
                                    }}>
                                        {currentSplitContainers.length === 0 ? (
                                            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.8rem", padding: "2rem 0" }}>
                                                Aucun conteneur affecté.
                                            </p>
                                        ) : (
                                            currentSplitContainers.map((c) => (
                                                <ContainerCard
                                                    key={c.id}
                                                    container={c}
                                                    selected={selectedRight.has(c.id)}
                                                    onClick={() => toggleRight(c.id)}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Info bar */}
                            <div style={{
                                marginTop: "1rem",
                                background: "#f8fafc",
                                borderRadius: "8px",
                                padding: "0.6rem 1rem",
                                fontSize: "0.78rem",
                                color: "#64748b",
                                display: "flex",
                                gap: "1.5rem",
                            }}>
                                {splits.map((s, i) => (
                                    <span key={i}>
                                        <strong style={{ color: i + 1 === phase ? "#E60012" : "#0a1f5c" }}>
                                            ({i + 1})
                                        </strong>{" "}
                                        {s.length} conteneur(s)
                                    </span>
                                ))}
                                {remaining.length > 0 && (
                                    <span style={{ marginLeft: "auto", color: "#f59e0b", fontWeight: 700 }}>
                                        ⚠ {remaining.length} non affecté(s)
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── PHASE: done – summary ── */}
                    {phase === "done" && (
                        <div>
                            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                                <div style={{
                                    width: 60, height: 60, borderRadius: "50%",
                                    background: "rgba(16,185,129,0.1)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    margin: "0 auto 1rem",
                                }}>
                                    <Check size={30} color="#10b981" />
                                </div>
                                <h3 style={{ fontWeight: 900, color: "#0a1f5c", marginBottom: "0.25rem" }}>
                                    Récapitulatif du split
                                </h3>
                                <p style={{ color: "#64748b", fontSize: "0.88rem" }}>
                                    Vérifiez la répartition avant de confirmer. L&apos;original sera supprimé.
                                </p>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {splits.map((containers, i) => {
                                    const isEmpty = containers.length === 0;
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                border: `1.5px solid ${isEmpty ? "#ef4444" : "#e2e8f0"}`,
                                                borderRadius: "10px",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div style={{
                                                background: isEmpty ? "#fef2f2" : "#f8fafc",
                                                padding: "0.6rem 1rem",
                                                borderBottom: `1px solid ${isEmpty ? "#fecaca" : "#e2e8f0"}`,
                                                display: "flex", justifyContent: "space-between",
                                            }}>
                                                <span style={{ fontWeight: 800, color: isEmpty ? "#ef4444" : "#0a1f5c", fontSize: "0.88rem" }}>
                                                    {bl.bookingNumber} ({i + 1})
                                                    {isEmpty && " ⚠ Vide !"}
                                                </span>
                                                <span style={{ fontWeight: 700, color: "#64748b", fontSize: "0.78rem" }}>
                                                    {containers.length} conteneur(s)
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", padding: "0.6rem 0.75rem", background: "#fff" }}>
                                                {containers.length === 0 ? (
                                                    <span style={{ fontSize: "0.78rem", color: "#ef4444" }}>Aucun conteneur — cliquez Retour pour corriger.</span>
                                                ) : containers.map((c) => (
                                                    <span key={c.id} style={{
                                                        background: "#f0f4f8", color: "#0a1f5c",
                                                        borderRadius: "6px", padding: "2px 8px",
                                                        fontWeight: 700, fontSize: "0.75rem",
                                                    }}>
                                                        {c.containerNum}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {remaining.length > 0 && (
                                    <div style={{
                                        background: "#fffbeb", border: "1.5px solid #f59e0b",
                                        borderRadius: "10px", padding: "0.75rem 1rem",
                                    }}>
                                        <p style={{ fontWeight: 700, color: "#b45309", margin: "0 0 0.25rem" }}>
                                            ⚠ {remaining.length} conteneur(s) non affecté(s)
                                        </p>
                                        <p style={{ fontSize: "0.8rem", color: "#92400e", margin: 0 }}>
                                            Ces conteneurs ne seront inclus dans aucun split. Revenez en arrière pour les affecter.
                                        </p>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
                                            {remaining.map((c) => (
                                                <span key={c.id} style={{
                                                    background: "#fef3c7", color: "#92400e",
                                                    borderRadius: "6px", padding: "2px 8px",
                                                    fontWeight: 700, fontSize: "0.75rem",
                                                }}>
                                                    {c.containerNum}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div style={{
                    borderTop: "1px solid #e2e8f0",
                    padding: "1rem 1.75rem",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    background: "#f8fafc",
                }}>
                    {/* Left side */}
                    <button
                        type="button"
                        onClick={() => { reset(); onClose(); }}
                        style={{
                            border: "1.5px solid #e2e8f0", background: "#fff",
                            color: "#64748b", fontWeight: 700, padding: "0 1.25rem",
                            height: 42, borderRadius: "10px", cursor: "pointer",
                            fontSize: "0.88rem",
                        }}
                    >
                        Annuler
                    </button>

                    {/* Right side */}
                    <div style={{ display: "flex", gap: "0.6rem" }}>
                        {typeof phase === "number" && phase > 1 && (
                            <button
                                type="button"
                                onClick={goPrev}
                                style={{
                                    border: "1.5px solid #e2e8f0", background: "#fff",
                                    color: "#0a1f5c", fontWeight: 700, padding: "0 1.25rem",
                                    height: 42, borderRadius: "10px", cursor: "pointer",
                                    fontSize: "0.88rem",
                                }}
                            >
                                ← Précédent
                            </button>
                        )}

                        {phase === "count" && (
                            <button
                                type="button"
                                onClick={() => initSplits(splitCount)}
                                disabled={splitCount > bl.containers.length}
                                style={{
                                    background: splitCount > bl.containers.length
                                        ? "#e2e8f0"
                                        : "linear-gradient(135deg,#E60012 0%,#b8000e 100%)",
                                    color: splitCount > bl.containers.length ? "#94a3b8" : "#fff",
                                    fontWeight: 800, padding: "0 1.75rem",
                                    height: 42, borderRadius: "10px",
                                    border: "none",
                                    cursor: splitCount > bl.containers.length ? "default" : "pointer",
                                    fontSize: "0.9rem",
                                    display: "flex", alignItems: "center", gap: "0.5rem",
                                    boxShadow: splitCount > bl.containers.length ? "none" : "0 4px 14px rgba(230,0,18,0.25)",
                                }}
                            >
                                Commencer la répartition <ChevronRight size={16} />
                            </button>
                        )}

                        {typeof phase === "number" && (
                            <button
                                type="button"
                                onClick={goNext}
                                style={{
                                    background: "linear-gradient(135deg,#E60012 0%,#b8000e 100%)",
                                    color: "#fff", fontWeight: 800, padding: "0 1.75rem",
                                    height: 42, borderRadius: "10px", border: "none",
                                    cursor: "pointer", fontSize: "0.9rem",
                                    display: "flex", alignItems: "center", gap: "0.5rem",
                                    boxShadow: "0 4px 14px rgba(230,0,18,0.25)",
                                }}
                            >
                                {phase < splitCount ? (
                                    <>Split suivant <ChevronRight size={16} /></>
                                ) : (
                                    <>Récapitulatif <ChevronRight size={16} /></>
                                )}
                            </button>
                        )}

                        {phase === "done" && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setPhase(splitCount)}
                                    style={{
                                        border: "1.5px solid #e2e8f0", background: "#fff",
                                        color: "#0a1f5c", fontWeight: 700, padding: "0 1.25rem",
                                        height: 42, borderRadius: "10px", cursor: "pointer",
                                        fontSize: "0.88rem",
                                    }}
                                >
                                    ← Retour
                                </button>
                                <button
                                    type="button"
                                    onClick={handleFinish}
                                    disabled={isSubmitting}
                                    style={{
                                        background: isSubmitting ? "#e2e8f0" : "linear-gradient(135deg,#10b981 0%,#059669 100%)",
                                        color: isSubmitting ? "#94a3b8" : "#fff",
                                        fontWeight: 800, padding: "0 1.75rem",
                                        height: 42, borderRadius: "10px", border: "none",
                                        cursor: isSubmitting ? "default" : "pointer",
                                        fontSize: "0.9rem",
                                        display: "flex", alignItems: "center", gap: "0.5rem",
                                        boxShadow: isSubmitting ? "none" : "0 4px 14px rgba(16,185,129,0.3)",
                                    }}
                                >
                                    {isSubmitting ? "Création en cours…" : "✓ Confirmer le split"}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
