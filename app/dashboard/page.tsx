"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
    Calendar, Ship, Box, Weight, BarChart3, Globe,
    TrendingUp, LayoutDashboard, X, User, LogOut,
    FileText, Package,
} from "lucide-react";
import { Combobox } from "@/components/Combobox";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const sessionIsAdmin = (session?.user as any)?.role === "ADMIN";

    const [stats, setStats]           = useState<any>(null);
    const [companies, setCompanies]   = useState<any[]>([]);
    const [isAdmin, setIsAdmin]       = useState(false);
    const [isLoading, setIsLoading]   = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [startDate, setStartDate]             = useState("");
    const [endDate, setEndDate]                 = useState("");
    const [selectedCompanyId, setSelectedCompanyId] = useState("");
    const [selectedHsCode, setSelectedHsCode]       = useState("");
    const [hsCodes, setHsCodes]                     = useState<any[]>([]);
    const [selectedYear, setSelectedYear]           = useState(new Date().getFullYear().toString());

    const fetchStats = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            let url = `/api/dashboard/stats?year=${selectedYear}`;
            if (startDate)         url += `&startDate=${startDate}`;
            if (endDate)           url += `&endDate=${endDate}`;
            if (selectedCompanyId) url += `&companyId=${selectedCompanyId}`;
            if (selectedHsCode)    url += `&hsCode=${selectedHsCode}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setCompanies(data.companies || []);
                setHsCodes(data.stats.hsCodeList || []);
                setIsAdmin(data.isAdmin || sessionIsAdmin);
            } else {
                const err = await res.json().catch(() => ({}));
                setFetchError(err.error || `Erreur ${res.status}`);
            }
        } catch {
            setFetchError("Erreur de connexion au serveur.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") fetchStats();
    }, [status, startDate, endDate, selectedCompanyId, selectedHsCode, selectedYear]);

    const monthNames = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
    const chartData  = stats?.monthlyStats?.map((s: any) => ({
        name: monthNames[s.month - 1],
        Tonnage: s.tonnage,
        TEU:     s.teu,
    })) || [];

    const years = Array.from({ length: 5 }, (_, i) => {
        const y = new Date().getFullYear() - 2 + i;
        return { id: y.toString(), name: y.toString() };
    });

    const resetFilters = () => {
        setStartDate("");
        setEndDate("");
        setSelectedCompanyId("");
        setSelectedHsCode("");
        setSelectedYear(new Date().getFullYear().toString());
    };

    /* ── Loading ── */
    if (status === "loading") {
        return (
            <div style={{
                height: "100vh", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                background: "var(--bg)", gap: "1.25rem",
            }}>
                <div style={{
                    width: 48, height: 48,
                    border: "4px solid var(--border)",
                    borderTopColor: "var(--primary)",
                    borderRadius: "50%",
                    animation: "spin 0.9s linear infinite",
                }} />
                <p style={{ fontWeight: 700, color: "var(--primary)" }}>
                    Chargement de l&apos;interface…
                </p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!session) return null;

    /* ─── Summary Card helper ─── */
    const StatCard = ({
        icon, label, value, iconBg, iconColor, accent,
    }: {
        icon: React.ReactNode; label: string; value: string | number;
        iconBg: string; iconColor: string; accent?: boolean;
    }) => (
        <div className="stats-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div style={{
                    padding: "0.5rem",
                    background: iconBg,
                    color: iconColor,
                    borderRadius: "10px",
                    display: "inline-flex",
                }}>
                    {icon}
                </div>
                {accent && (
                    <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "var(--primary)",
                        marginTop: 2,
                    }} />
                )}
            </div>
            <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>
                {label}
            </p>
            <p style={{ fontSize: "1.45rem", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {value}
            </p>
        </div>
    );

    /* ═══════════════════════════════════════════
       RENDER
       ─────────────────────────────────────────── */
    return (
        <div className="app-container">

            {/* ──────────── SIDEBAR GAUCHE ──────────── */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src="/logo-oocl.png" alt="OOCL Logo" />
                </div>

                <nav className="sidebar-nav">
                    <Link href="/" passHref style={{ textDecoration: "none" }}>
                        <div className="nav-item">
                            <Ship size={19} />
                            <span>Créer une S.I..</span>
                        </div>
                    </Link>
                    <div className="nav-item active">
                        <LayoutDashboard size={19} />
                        <span>Tableau de Bord</span>
                    </div>

                    {sessionIsAdmin && (
                        <Link href="/admin/users" passHref style={{ textDecoration: "none" }}>
                            <div className="nav-item">
                                <User size={19} />
                                <span>Gestion Comptes</span>
                            </div>
                        </Link>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: "50%",
                            background: "linear-gradient(135deg, var(--primary) 0%, #ff4d5e 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "white", flexShrink: 0,
                        }}>
                            <User size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p className="sidebar-user-name">Connecté</p>
                            <p className="sidebar-user-email">{session?.user?.email}</p>
                        </div>
                    </div>
                    <button onClick={() => signOut({ callbackUrl: "/login" })}
                        className="btn-outline"
                        style={{ width: "100%", justifyContent: "center", fontSize: "0.82rem" }}>
                        <LogOut size={14} />
                        Se déconnecter
                    </button>
                </div>
            </aside>

            {/* ──────────── MAIN ──────────── */}
            <main className="main-content">
                <div className="main-content-inner">
                    {/* Header */}
                    <header className="content-header">
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                <BarChart3 size={14} style={{ color: "var(--text-muted)" }} />
                                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Analytique
                                </span>
                            </div>
                            <h1>Tableau de Bord</h1>
                        </div>

                        {(startDate || endDate || selectedCompanyId || selectedHsCode) && (
                            <button onClick={resetFilters} className="btn-outline"
                                style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
                                <X size={14} /> Effacer les filtres
                            </button>
                        )}
                    </header>

                    {/* ─── Filters Card ─── */}
                    <div style={{
                        background: "var(--bg-card)",
                        borderRadius: "var(--radius-xl)",
                        border: "1px solid rgba(226,232,240,0.8)",
                        padding: "1.25rem 1.5rem",
                        marginBottom: "1.5rem",
                        boxShadow: "var(--shadow-md)",
                        display: "flex",
                        flexWrap: "nowrap",
                        gap: "1rem",
                        alignItems: "flex-end",
                        position: "relative",
                        overflow: "hidden",
                    }}>
                        {/* Accent bar */}
                        <div style={{
                            position: "absolute", top: 0, left: 0, right: 0, height: 3,
                            background: "linear-gradient(90deg, var(--primary), #ff4d5e)",
                        }} />

                        {/* Date début */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", flexShrink: 0 }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", fontWeight: 700 }}>
                                <Calendar size={12} /> Date Début
                            </label>
                            <input type="date" value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ width: 145 }} />
                        </div>

                        {/* Date fin */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", flexShrink: 0 }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", fontWeight: 700 }}>
                                <Calendar size={12} /> Date Fin
                            </label>
                            <input type="date" value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{ width: 145 }} />
                        </div>

                        {/* Admin company filter */}
                        {(isAdmin || sessionIsAdmin) && (
                            <div style={{ flex: "1 1 auto", minWidth: 200 }}>
                                <Combobox
                                    label="Entreprise / Client"
                                    items={[
                                        { id: "", companyName: "Toutes les entreprises" },
                                        ...companies.map(c => ({ id: c.id, companyName: c.companyName || c.email }))
                                    ]}
                                    displayKey="companyName"
                                    valueKey="id"
                                    value={selectedCompanyId}
                                    onChange={(val) => setSelectedCompanyId(val)}
                                    placeholder={companies.length > 0 ? "Filtrer client…" : "Aucun client"}
                                />
                            </div>
                        )}

                        {/* HS Code filter */}
                        <div style={{ flex: "1 1 auto", minWidth: 200 }}>
                            <Combobox
                                label="HS Code / Marchandise"
                                items={[
                                    { id: "", name: "Toutes les marchandises" },
                                    ...hsCodes
                                ]}
                                displayKey="name"
                                valueKey="id"
                                value={selectedHsCode}
                                onChange={(val) => setSelectedHsCode(val)}
                                placeholder={hsCodes.length > 0 ? "Filtrer code…" : "Aucun code"}
                            />
                        </div>
                    </div>

                    {/* ─── Content ─── */}
                    {isLoading ? (
                        <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
                            <div style={{
                                width: 44, height: 44, margin: "0 auto 1.25rem",
                                border: "4px solid var(--border)", borderTopColor: "var(--primary)",
                                borderRadius: "50%", animation: "spin 0.9s linear infinite",
                            }} />
                            <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>Chargement des statistiques…</p>
                        </div>

                    ) : fetchError ? (
                        <div style={{
                            textAlign: "center", padding: "4rem 2rem",
                            background: "var(--bg-card)", borderRadius: "var(--radius-xl)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            boxShadow: "var(--shadow-md)",
                        }}>
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
                            <h3 style={{ color: "var(--danger)", fontWeight: 800, marginBottom: "0.5rem" }}>
                                Erreur de chargement
                            </h3>
                            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>{fetchError}</p>
                            <button onClick={fetchStats} className="btn-primary">
                                🔄 Réessayer
                            </button>
                        </div>

                    ) : (
                        <>
                            {/* ── KPI Cards ── */}
                            <div className="grid-4" style={{ marginBottom: "2rem" }}>
                                <StatCard icon={<FileText size={18} />} label="Total BLs"
                                    value={stats?.countBL || 0}
                                    iconBg="rgba(230,0,18,0.08)" iconColor="var(--primary)" accent />

                                <StatCard icon={<Box size={18} />} label="Conteneurs 20'"
                                    value={stats?.count20 || 0}
                                    iconBg="rgba(16,185,129,0.1)" iconColor="var(--success)" />

                                <StatCard icon={<Package size={18} />} label="Conteneurs 40'"
                                    value={stats?.count40 || 0}
                                    iconBg="rgba(59,130,246,0.1)" iconColor="#3b82f6" />

                                <StatCard icon={<Weight size={18} />} label="Tonnage Total (kg)"
                                    value={stats?.totalTonnage?.toLocaleString() || 0}
                                    iconBg="rgba(245,158,11,0.1)" iconColor="var(--warning)" />
                            </div>

                            {/* ── Performance Chart ── */}
                            <div style={{
                                background: "var(--bg-card)",
                                borderRadius: "var(--radius-xl)",
                                border: "1px solid rgba(226,232,240,0.8)",
                                padding: "2rem",
                                marginBottom: "2rem",
                                boxShadow: "var(--shadow-md)",
                                position: "relative",
                                overflow: "hidden",
                            }}>
                                {/* Accent */}
                                <div style={{
                                    position: "absolute", top: 0, left: 0, right: 0, height: 3,
                                    background: "linear-gradient(90deg, var(--primary), #ff4d5e)",
                                }} />

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                                    <div>
                                        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
                                            Performance mensuelle
                                        </p>
                                        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <TrendingUp size={20} style={{ color: "var(--primary)" }} />
                                            Tonnage &amp; TEU — {selectedYear}
                                        </h2>
                                    </div>
                                    <div style={{ width: 140 }}>
                                        <Combobox
                                            label="Année"
                                            items={years}
                                            displayKey="name"
                                            valueKey="id"
                                            value={selectedYear}
                                            onChange={(val) => setSelectedYear(val)} />
                                    </div>
                                </div>

                                <div style={{ width: "100%", height: 380 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false}
                                                stroke="var(--border)" opacity={0.4} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false}
                                                tick={{ fontSize: 12, fontWeight: 700, fill: "var(--text-muted)" }} />
                                            <YAxis yAxisId="left" axisLine={false} tickLine={false}
                                                tick={{ fontSize: 12, fontWeight: 700, fill: "var(--text-muted)" }}
                                                label={{ value: "Tonnage (Kg)", angle: -90, position: "insideLeft", offset: 10, fill: "#f59e0b", fontWeight: 800 }} />
                                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false}
                                                tick={{ fontSize: 12, fontWeight: 700, fill: "var(--text-muted)" }}
                                                label={{ value: "TEU", angle: 90, position: "insideRight", offset: 10, fill: "#3b82f6", fontWeight: 800 }} />
                                            <Tooltip contentStyle={{
                                                borderRadius: "var(--radius-lg)",
                                                border: "1px solid var(--border)",
                                                boxShadow: "var(--shadow-lg)",
                                                fontWeight: 700,
                                            }} />
                                            <Legend wrapperStyle={{ paddingTop: "1.25rem", fontWeight: 700 }} />
                                            <Line yAxisId="left" type="monotone" dataKey="Tonnage"
                                                stroke="#f59e0b" strokeWidth={3}
                                                dot={{ r: 5, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
                                                activeDot={{ r: 7, strokeWidth: 0 }} />
                                            <Line yAxisId="right" type="monotone" dataKey="TEU"
                                                stroke="#3b82f6" strokeWidth={3}
                                                dot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                                                activeDot={{ r: 7, strokeWidth: 0 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* ── Destinations + Goods ── */}
                            <div className="grid-2" style={{ gap: "2rem" }}>

                                {/* Destinations */}
                                <div style={{
                                    background: "var(--bg-card)",
                                    borderRadius: "var(--radius-xl)",
                                    border: "1px solid rgba(226,232,240,0.8)",
                                    padding: "1.75rem",
                                    boxShadow: "var(--shadow-md)",
                                }}>
                                    <h3 style={{
                                        fontSize: "1rem", fontWeight: 800, color: "var(--text)",
                                        marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem",
                                        letterSpacing: "-0.01em",
                                    }}>
                                        <Globe size={18} style={{ color: "var(--success)" }} />
                                        Destinations desservies
                                    </h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: 380, overflowY: "auto" }}>
                                        {!stats?.destList?.length ? (
                                            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem 0", fontSize: "0.875rem" }}>
                                                Aucune donnée disponible
                                            </p>
                                        ) : stats.destList.map((d: any, idx: number) => (
                                            <div key={idx} style={{
                                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                                padding: "0.875rem 1rem",
                                                background: "var(--bg)", borderRadius: "var(--radius)",
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                                                    <span style={{
                                                        fontSize: "0.72rem", fontWeight: 900, color: "var(--primary)",
                                                        background: "var(--primary-light)",
                                                        width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                                                        borderRadius: "6px", flexShrink: 0,
                                                    }}>
                                                        {idx + 1}
                                                    </span>
                                                    <span style={{ fontWeight: 700, color: "var(--text)", textTransform: "uppercase", fontSize: "0.875rem" }}>
                                                        {d.name}
                                                    </span>
                                                </div>
                                                <span style={{ fontWeight: 800, color: "var(--primary)", fontSize: "0.875rem" }}>
                                                    {d.count} fois
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Goods distribution */}
                                <div style={{
                                    background: "var(--bg-card)",
                                    borderRadius: "var(--radius-xl)",
                                    border: "1px solid rgba(226,232,240,0.8)",
                                    padding: "1.75rem",
                                    boxShadow: "var(--shadow-md)",
                                }}>
                                    <h3 style={{
                                        fontSize: "1rem", fontWeight: 800, color: "var(--text)",
                                        marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem",
                                        letterSpacing: "-0.01em",
                                    }}>
                                        <BarChart3 size={18} style={{ color: "var(--primary)" }} />
                                        Type de marchandises (%)
                                    </h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                        {!stats?.goodsList?.length ? (
                                            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem 0", fontSize: "0.875rem" }}>
                                                Aucune donnée disponible
                                            </p>
                                        ) : stats.goodsList.map((g: any, idx: number) => {
                                            const colors = ["var(--primary)", "#3b82f6", "var(--success)", "var(--warning)", "#8b5cf6"];
                                            const color  = colors[idx % colors.length];
                                            return (
                                                <div key={idx}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.45rem" }}>
                                                        <span style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.875rem" }}>{g.name}</span>
                                                        <span style={{ fontWeight: 800, color: color, fontSize: "0.875rem" }}>
                                                            {g.percentage.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div style={{ width: "100%", height: 8, background: "var(--bg)", borderRadius: 99, overflow: "hidden" }}>
                                                        <div style={{
                                                            width: `${g.percentage}%`, height: "100%",
                                                            background: color, borderRadius: 99,
                                                            transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
                                                        }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
