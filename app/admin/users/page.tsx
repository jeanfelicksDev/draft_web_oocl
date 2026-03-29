"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, ShieldCheck, ShieldAlert, ArrowLeft, Loader2, Building2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Sidebar } from "@/components/Sidebar";

interface UserAccount {
    id: string;
    email: string;
    name: string | null;
    companyName: string | null;
    phone: string | null;
    role: string;
    isAuthorized: boolean;
    permissions: string;
    createdAt: string;
}

// Permissions granulaires supprimées pour simplification

export default function AdminUsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated" || (session && (session.user as any).role !== "ADMIN")) {
            router.push("/");
        }
    }, [status, session, router]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                const d = await res.json().catch(() => ({}));
                toast.error(`Erreur: ${d.details || "Inconnue"}`);
            }
        } catch (error) {
            toast.error("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session && (session.user as any).role === "ADMIN") {
            fetchUsers();
        }
    }, [session]);

    const updateUserData = async (userId: string, data: any) => {
        console.log("Updating user data:", userId, data);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                const updated = await res.json();
                console.log("Update success:", updated);
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updated } : u));
                toast.success("Mise à jour réussie");
            } else {
                const error = await res.json().catch(() => ({}));
                console.error("Update failed:", error);
                toast.error(`Erreur: ${error.details || "Inconnue"}`);
            }
        } catch (error) {
            console.error("Update connection error:", error);
            toast.error("Erreur de connexion");
        }
    };

    // handlePermissionToggle supprimé

    const toggleAuthorization = async (userId: string, currentStatus: boolean) => {
        console.log("Toggling auth for:", userId, "current:", currentStatus);
        try {
            const res = await fetch(`/api/admin/users/${userId}/authorize`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isAuthorized: !currentStatus }),
            });

            if (res.ok) {
                const updated = await res.json();
                console.log("Toggle success:", updated);
                toast.success(currentStatus ? "Accès révoqué" : "Accès autorisé");
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, isAuthorized: !currentStatus } : u));
            } else {
                const error = await res.json().catch(() => ({}));
                console.error("Toggle failed:", error);
                toast.error(`Erreur: ${error.details || "Inconnue"}`);
            }
        } catch (error) {
            console.error("Toggle connection error:", error);
            toast.error("Erreur de connexion");
        }
    };

    const handleDeleteUser = async (userId: string, userEmail: string) => {
        if (!confirm(`Voulez-vous vraiment supprimer définitivement le compte ${userEmail} ? Cette action est irréversible.`)) return;

        console.log("Deleting user:", userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                console.log("Delete success");
                toast.success("Utilisateur supprimé");
                setUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                const error = await res.json().catch(() => ({}));
                console.error("Delete failed:", error);
                toast.error(`Erreur: ${error.details || "Inconnue"}`);
            }
        } catch (error) {
            console.error("Delete connection error:", error);
            toast.error("Erreur de connexion");
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="app-container">
                <Sidebar />
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Loader2 className="spinner" size={40} color="var(--primary)" />
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <Sidebar />

            <main className="main-content">
                <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <Link href="/" style={{ color: "var(--text-muted)" }}>
                                <ArrowLeft size={24} />
                            </Link>
                            <h1 style={{ fontWeight: 800 }}>Gestion des Comptes</h1>
                        </div>
                        <div className="badge-validated" style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}>
                            Mode Administrateur
                        </div>
                    </div>

                    <div className="form-container" style={{ padding: 0, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border)" }}>
                                    <th style={{ padding: "1.25rem", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>Entreprise</th>
                                    <th style={{ padding: "1.25rem", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>Téléphone</th>
                                    <th style={{ padding: "1.25rem", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>Email</th>
                                    <th style={{ padding: "1.25rem", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>Rôle</th>
                                    <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>Statut</th>
                                    <th style={{ padding: "1.25rem", textAlign: "right", fontSize: "0.85rem", color: "var(--text-muted)" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }}>
                                        <td style={{ padding: "1.25rem" }}>
                                            <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                                                {user.companyName || "N/A"}
                                            </div>
                                        </td>
                                        <td style={{ padding: "1.25rem" }}>
                                            <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                                                {user.phone || "N/A"}
                                            </div>
                                        </td>
                                        <td style={{ padding: "1.25rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                <div style={{ 
                                                    width: 32, height: 32, borderRadius: "50%", 
                                                    backgroundColor: "var(--bg-primary)", display: "flex", 
                                                    alignItems: "center", justifyContent: "center", color: "var(--primary)" 
                                                }}>
                                                    <User size={16} />
                                                </div>
                                                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{user.email}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "1.25rem" }}>
                                            <select 
                                                value={user.role}
                                                onChange={(e) => updateUserData(user.id, { role: e.target.value })}
                                                disabled={user.id === (session?.user as any).id}
                                                style={{ 
                                                    padding: "0.4rem 0.5rem", borderRadius: "6px", border: "1px solid var(--border)",
                                                    fontSize: "0.85rem", fontWeight: 700,
                                                    backgroundColor: user.role === "ADMIN" ? "#fee2e2" : "white",
                                                    color: user.role === "ADMIN" ? "#b91c1c" : "inherit"
                                                }}
                                            >
                                                <option value="CLIENT">CLIENT</option>
                                                <option value="ADMIN">ADMIN</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: "1.25rem", textAlign: "center" }}>
                                            {user.isAuthorized ? (
                                                <span className="badge-validated" style={{ fontSize: "0.75rem" }}>AUTORISÉ</span>
                                            ) : (
                                                <span className="badge-draft" style={{ fontSize: "0.75rem", backgroundColor: "#fee2e2", color: "#ef4444" }}>RÉVOQUÉ</span>
                                            )}
                                        </td>
                                        <td style={{ padding: "1.25rem", textAlign: "right" }}>
                                            {user.id !== (session?.user as any)?.id && (
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.75rem" }}>
                                                    <button
                                                        onClick={() => toggleAuthorization(user.id, user.isAuthorized)}
                                                        style={{
                                                            padding: "0.5rem 1rem",
                                                            borderRadius: "6px",
                                                            fontSize: "0.8rem",
                                                            fontWeight: 700,
                                                            cursor: "pointer",
                                                            border: "1px solid",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "0.4rem",
                                                            backgroundColor: user.isAuthorized ? "#fee2e2" : "#dcfce7",
                                                            borderColor: user.isAuthorized ? "#fecaca" : "#bbf7d0",
                                                            color: user.isAuthorized ? "#b91c1c" : "#15803d",
                                                        }}
                                                    >
                                                        {user.isAuthorized ? (
                                                            <><ShieldAlert size={14} /> Révoquer</>
                                                        ) : (
                                                            <><ShieldCheck size={14} /> Autoriser</>
                                                        )}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteUser(user.id, user.email)}
                                                        style={{ 
                                                            background: "none", 
                                                            border: "none", 
                                                            color: "var(--danger)", 
                                                            cursor: "pointer",
                                                            padding: "0.5rem",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            transition: "opacity 0.2s"
                                                        }}
                                                        title="Supprimer définitivement"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
