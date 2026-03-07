"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
    Calendar,
    Ship,
    Box,
    Weight,
    BarChart3,
    Globe,
    Building2,
    Search,
    X,
    TrendingUp,
    LayoutDashboard,
    ArrowLeft,
    BarChart,
    ChevronRight
} from "lucide-react";
import { Combobox } from "@/components/Combobox";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const sessionIsAdmin = (session?.user as any)?.role === "ADMIN";

    // Stats and Meta
    const [stats, setStats] = useState<any>(null);
    const [companies, setCompanies] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedCompanyId, setSelectedCompanyId] = useState("");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    const fetchStats = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            let url = `/api/dashboard/stats?year=${selectedYear}`;
            if (startDate) url += `&startDate=${startDate}`;
            if (endDate) url += `&endDate=${endDate}`;
            if (selectedCompanyId) url += `&companyId=${selectedCompanyId}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setCompanies(data.companies || []);
                setIsAdmin(data.isAdmin || sessionIsAdmin);
            } else {
                const err = await res.json().catch(() => ({}));
                setFetchError(err.error || `Erreur ${res.status}`);
            }
        } catch (error) {
            console.error("Dashboard error:", error);
            setFetchError("Erreur de connexion au serveur.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchStats();
        }
    }, [status, startDate, endDate, selectedCompanyId, selectedYear]);

    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    const chartData = stats?.monthlyStats?.map((s: any) => ({
        name: monthNames[s.month - 1],
        Tonnage: s.tonnage,
        TEU: s.teu
    })) || [];

    const years = Array.from({ length: 5 }, (_, i) => {
        const y = new Date().getFullYear() - 2 + i;
        return { id: y.toString(), name: y.toString() };
    });

    const resetFilters = () => {
        setStartDate("");
        setEndDate("");
        setSelectedCompanyId("");
        setSelectedYear(new Date().getFullYear().toString());
    };

    if (status === "loading") {
        return (
            <div style={{
                height: "100vh", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                backgroundColor: "var(--bg-lighter)", gap: "1rem"
            }}>
                <div className="spinner" style={{
                    width: "50px", height: "50px",
                    border: "6px solid var(--border-color)",
                    borderTopColor: "var(--accent-teal)",
                    borderRadius: "50%"
                }}></div>
                <p style={{ fontWeight: 800, color: "var(--primary)", fontSize: "1.2rem" }}>Chargement de l&apos;interface...</p>
                <style jsx>{`
                    .spinner { animation: spin 1s linear infinite; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    if (!session) {
        return (
            <div style={{ padding: "4rem", textAlign: "center" }}>
                <h2>Session non trouvée</h2>
                <p>Redirection vers la connexion...</p>
                <Link href="/login" style={{ color: "var(--accent-teal)", fontWeight: 800 }}>Cliquer ici si vous n&apos;êtes pas redirigé</Link>
            </div>
        );
    }

    return (
        <div className="app-container" style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-lighter)" }}>

            {/* Sidebar (Similar structure to MainPage) */}
            <aside className="sidebar" style={{ width: '280px', backgroundColor: 'var(--sidebar-bg)', padding: '2rem 0', height: '100vh', position: 'sticky', top: 0, borderRight: '2px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '0 1rem', marginBottom: '2.5rem', textAlign: 'center' }}>
                    <img
                        src="/logo-oocl.png"
                        alt="OOCL Logo"
                        style={{ width: '100%', maxWidth: '220px', height: 'auto', objectFit: 'contain' }}
                    />
                </div>

                <div style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 }}>
                    <Link href="/" passHref style={{ textDecoration: 'none' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            padding: '1rem 1.5rem',
                            borderRadius: '12px',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '1.5rem',
                            transition: 'all 0.2s'
                        }}>
                            <Ship size={22} /> Créer une S.I
                        </div>
                    </Link>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                        padding: '1rem 1.5rem',
                        borderRadius: '12px',
                        backgroundColor: 'var(--accent-teal)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1.5rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(230, 0, 18, 0.2)'
                    }}>
                        <LayoutDashboard size={22} /> Tb de Bord
                    </div>
                </div>

                <div style={{ padding: '2rem', borderTop: '2px solid var(--border-color)', marginTop: 'auto' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>Connecté :</p>
                        <p style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>{session?.user?.email}</p>
                    </div>
                    <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn-outline" style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem' }}>
                        Se déconnecter
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content" style={{ flexGrow: 1, padding: "2rem", overflowY: "auto" }}>
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                    <div>
                        <h1 style={{ fontSize: "2.4rem", fontWeight: 900, color: "var(--primary)" }}>Tb de Bord</h1>
                        <p style={{ color: "var(--text-muted)", fontWeight: 700 }}>Statistiques et rapports d&apos;activité</p>
                    </div>

                    <div style={{ display: "flex", gap: "1rem" }}>
                        {/* Clear Filters Button */}
                        {(startDate || endDate || selectedCompanyId) && (
                            <button onClick={resetFilters} style={{
                                display: "flex", alignItems: "center", gap: "0.5rem",
                                backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#dc2626",
                                border: "none", padding: "0.6rem 1.2rem", borderRadius: "10px",
                                fontWeight: 800, cursor: "pointer", fontSize: "0.9rem"
                            }}>
                                <X size={16} /> Effacer les filtres
                            </button>
                        )}
                    </div>
                </header>

                {/* Filters Section */}
                <section style={{
                    backgroundColor: "white", padding: "1.5rem",
                    borderRadius: "20px", marginBottom: "2rem",
                    boxShadow: "var(--shadow-lg)", display: "flex",
                    flexWrap: "wrap", gap: "1.5rem", alignItems: "flex-end",
                    border: "2px solid var(--border-color)"
                }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ fontWeight: 800, color: "var(--primary)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Calendar size={16} /> Date Début
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{ padding: "0.8rem", borderRadius: "10px", border: "2px solid var(--border-color)", fontWeight: 700 }}
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ fontWeight: 800, color: "var(--primary)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Calendar size={16} /> Date Fin
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{ padding: "0.8rem", borderRadius: "10px", border: "2px solid var(--border-color)", fontWeight: 700 }}
                        />
                    </div>

                    {/* Admin company filter — using custom Combobox */}
                    {(isAdmin || sessionIsAdmin) && (
                        <div style={{ flexGrow: 1, minWidth: "300px" }}>
                            <Combobox
                                label="Filtrer par Entreprise/Client"
                                items={[
                                    { id: "", companyName: "Toutes les entreprises" },
                                    ...companies.map(c => ({ id: c.id, companyName: c.companyName || c.email }))
                                ]}
                                displayKey="companyName"
                                valueKey="id"
                                value={selectedCompanyId}
                                onChange={(val) => setSelectedCompanyId(val)}
                                placeholder={companies.length > 0 ? "Sélectionner un client..." : "Aucun client enregistré"}
                            />
                        </div>
                    )}
                </section>

                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)", fontWeight: 700 }}>
                        <div className="spinner" style={{ margin: "0 auto 1rem auto", width: "40px", height: "40px", border: "4px solid var(--border-color)", borderTopColor: "var(--accent-teal)", borderRadius: "50%" }}></div>
                        Chargement des statistiques...
                    </div>
                ) : fetchError ? (
                    <div style={{
                        textAlign: "center", padding: "4rem",
                        backgroundColor: "white", borderRadius: "24px",
                        border: "2px solid rgba(220, 38, 38, 0.2)"
                    }}>
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
                        <h3 style={{ color: "#dc2626", fontWeight: 900, marginBottom: "0.5rem" }}>Erreur de chargement</h3>
                        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>{fetchError}</p>
                        <button onClick={fetchStats} style={{
                            backgroundColor: "var(--accent-teal)", color: "white",
                            border: "none", padding: "0.8rem 2rem", borderRadius: "12px",
                            fontWeight: 800, cursor: "pointer", fontSize: "1rem"
                        }}>
                            🔄 Réessayer
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid-4" style={{ marginBottom: "2rem" }}>
                            <div className="stats-card" style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "24px", boxShadow: "var(--shadow-md)", border: "2px solid var(--border-color)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                                    <div style={{ padding: "0.8rem", backgroundColor: "rgba(0, 180, 216, 0.1)", color: "var(--accent-teal)", borderRadius: "14px" }}>
                                        <Ship size={24} />
                                    </div>
                                    <TrendingUp size={16} color="var(--accent-teal)" />
                                </div>
                                <h3 style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 700 }}>Total BLs</h3>
                                <p style={{ fontSize: "2rem", fontWeight: 900, color: "var(--primary)" }}>{stats?.countBL || 0}</p>
                            </div>

                            <div className="stats-card" style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "24px", boxShadow: "var(--shadow-md)", border: "2px solid var(--border-color)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                                    <div style={{ padding: "0.8rem", backgroundColor: "rgba(230, 0, 18, 0.1)", color: "var(--accent-teal)", borderRadius: "14px" }}>
                                        <Box size={24} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-teal)' }}>20&apos;</span>
                                </div>
                                <h3 style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 700 }}>Conteneurs 20&apos;</h3>
                                <p style={{ fontSize: "2rem", fontWeight: 900, color: "var(--primary)" }}>{stats?.count20 || 0}</p>
                            </div>

                            <div className="stats-card" style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "24px", boxShadow: "var(--shadow-md)", border: "2px solid var(--border-color)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                                    <div style={{ padding: "0.8rem", backgroundColor: "rgba(10, 31, 92, 0.05)", color: "var(--primary)", borderRadius: "14px" }}>
                                        <Box size={24} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>40&apos;</span>
                                </div>
                                <h3 style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 700 }}>Conteneurs 40&apos;</h3>
                                <p style={{ fontSize: "2rem", fontWeight: 900, color: "var(--primary)" }}>{stats?.count40 || 0}</p>
                            </div>

                            <div className="stats-card" style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "24px", boxShadow: "var(--shadow-md)", border: "2px solid var(--border-color)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                                    <div style={{ padding: "0.8rem", backgroundColor: "rgba(230, 0, 18, 0.1)", color: "var(--accent-teal)", borderRadius: "14px" }}>
                                        <Weight size={24} />
                                    </div>
                                </div>
                                <h3 style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 700 }}>Tonnage Total (Kg)</h3>
                                <p style={{ fontSize: "2rem", fontWeight: 900, color: "var(--primary)" }}>{stats?.totalTonnage?.toLocaleString() || 0}</p>
                            </div>
                        </div>

                        {/* Performance Chart Section */}
                        <div style={{
                            backgroundColor: "white",
                            padding: "2rem",
                            borderRadius: "24px",
                            border: "2px solid var(--border-color)",
                            marginBottom: "2rem",
                            boxShadow: "var(--shadow-md)"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                                <div>
                                    <h3 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                        <TrendingUp size={24} /> Performance Annuelle (Tonnage & TEU)
                                    </h3>
                                    <p style={{ color: "var(--text-muted)", fontWeight: 700 }}>Évolution mensuelle des volumes réalisés</p>
                                </div>
                                <div style={{ width: "150px" }}>
                                    <Combobox
                                        label="Année"
                                        items={years}
                                        displayKey="name"
                                        valueKey="id"
                                        value={selectedYear}
                                        onChange={(val) => setSelectedYear(val)}
                                    />
                                </div>
                            </div>

                            <div style={{ width: "100%", height: "400px" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.3} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fontWeight: 700, fill: 'var(--text-muted)' }}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fontWeight: 700, fill: 'var(--text-muted)' }}
                                            label={{ value: 'Tonnage (Kg)', angle: -90, position: 'insideLeft', offset: 10, fill: '#ED8936', fontWeight: 800 }}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fontWeight: 700, fill: 'var(--text-muted)' }}
                                            label={{ value: 'TEU', angle: 90, position: 'insideRight', offset: 10, fill: '#3182CE', fontWeight: 800 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: '2px solid var(--border-color)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                fontWeight: 800
                                            }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 800 }} />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="Tonnage"
                                            stroke="#ED8936"
                                            strokeWidth={4}
                                            dot={{ r: 6, fill: '#ED8936', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="TEU"
                                            stroke="#3182CE"
                                            strokeWidth={4}
                                            dot={{ r: 6, fill: '#3182CE', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Detailed Stats Grid */}
                        <div className="grid-2" style={{ gap: "2rem" }}>

                            {/* Destinations Served */}
                            <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "24px", boxShadow: "var(--shadow-md)", border: "2px solid var(--border-color)" }}>
                                <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--primary)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <Globe size={22} color="var(--accent-teal)" /> Destinations Desservies
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "400px", overflowY: "auto", paddingRight: "0.5rem" }}>
                                    {stats?.destList?.length === 0 ? (
                                        <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>Aucune donnée</p>
                                    ) : (
                                        stats?.destList?.map((d: any, idx: number) => (
                                            <div key={idx} style={{
                                                display: "flex", justifyContent: "space-between",
                                                alignItems: "center", padding: "1rem",
                                                backgroundColor: "var(--bg-lighter)", borderRadius: "14px"
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                    <span style={{ fontSize: "0.8rem", fontWeight: 900, color: "var(--accent-teal)", backgroundColor: "white", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px" }}>
                                                        {idx + 1}
                                                    </span>
                                                    <span style={{ fontWeight: 800, color: "var(--text-main)", textTransform: "uppercase" }}>{d.name}</span>
                                                </div>
                                                <span style={{ fontWeight: 900, color: "var(--primary)" }}>{d.count} fois</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Goods Distribution */}
                            <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "24px", boxShadow: "var(--shadow-md)", border: "2px solid var(--border-color)" }}>
                                <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--primary)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <BarChart3 size={22} color="var(--accent-teal)" /> Type de Marchandises (%)
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                    {stats?.goodsList?.length === 0 ? (
                                        <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>Aucune donnée</p>
                                    ) : (
                                        stats?.goodsList?.map((g: any, idx: number) => (
                                            <div key={idx}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                                    <span style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "0.95rem" }}>{g.name}</span>
                                                    <span style={{ fontWeight: 900, color: "var(--accent-teal)" }}>{g.percentage.toFixed(1)}%</span>
                                                </div>
                                                <div style={{ width: "100%", height: "12px", backgroundColor: "var(--bg-lighter)", borderRadius: "10px", overflow: "hidden" }}>
                                                    <div style={{
                                                        width: `${g.percentage}%`,
                                                        height: "100%",
                                                        backgroundColor: idx % 2 === 0 ? "var(--accent-teal)" : "#ff4b4b",
                                                        transition: "width 1s ease-out"
                                                    }}></div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    </>
                )}
            </main>

            <style jsx>{`
                .spinner {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .grid-4 {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                }
                .grid-2 {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                }
                .stats-card {
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .stats-card:hover {
                    transform: translateY(-5px);
                    box-shadow: var(--shadow-lg);
                }
                @media (max-width: 1200px) {
                    .grid-4 { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 768px) {
                    .grid-2, .grid-4 { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
