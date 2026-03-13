"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, ShieldCheck, ShieldAlert, ArrowLeft, Loader2, Building2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface UserAccount {
    id: string;
    email: string;
    name: string | null;
    companyName: string | null;
    role: string;
    isAuthorized: boolean;
    tempPassword: string | null;
    mustChangePassword: boolean;
    createdAt: string;
}

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

    const toggleAuthorization = async (userId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/authorize`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isAuthorized: !currentStatus }),
            });

            if (res.ok) {
                toast.success(currentStatus ? "Accès révoqué" : "Accès autorisé");
                setUsers(users.map(u => u.id === userId ? { ...u, isAuthorized: !currentStatus } : u));
            } else {
                toast.error("Erreur lors de la modification");
            }
        } catch (error) {
            toast.error("Erreur de connexion");
        }
    };

    const handleDeleteUser = async (userId: string, userEmail: string) => {
        if (!confirm(`Voulez-vous vraiment supprimer définitivement le compte ${userEmail} ? Cette action est irréversible.`)) return;

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                toast.success("Utilisateur supprimé");
                setUsers(users.filter(u => u.id !== userId));
            } else {
                const d = await res.json();
                toast.error(d.error || "Erreur lors de la suppression");
            }
        } catch (error) {
            toast.error("Erreur de connexion");
        }
    };

    if (status === "loading" || loading) {
        return (
            <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
                <Loader2 className="spinner" size={40} color="var(--primary)" />
            </div>
        );
    }

    return (
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
                            <th style={{ padding: "1.25rem", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>Email / Nom</th>
                            <th style={{ padding: "1.25rem", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>Entreprise</th>
                            <th style={{ padding: "1.25rem", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>Rôle</th>
                            <th style={{ padding: "1.25rem", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>Date Création</th>
                            <th style={{ padding: "1.25rem", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>Pass. Temporaire</th>
                            <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>Statut</th>
                            <th style={{ padding: "1.25rem", textAlign: "right", fontSize: "0.85rem", color: "var(--text-muted)" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }}>
                                <td style={{ padding: "1.25rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <div style={{ 
                                            width: 32, height: 32, borderRadius: "50%", 
                                            backgroundColor: "var(--bg-primary)", display: "flex", 
                                            alignItems: "center", justifyContent: "center", color: "var(--primary)" 
                                        }}>
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{user.email}</div>
                                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{user.name || "N/A"}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: "1.25rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                                        <Building2 size={14} color="var(--text-muted)" />
                                        {user.companyName || "N/A"}
                                    </div>
                                </td>
                                <td style={{ padding: "1.25rem" }}>
                                    <span style={{ 
                                        fontSize: "0.75rem", fontWeight: 700, 
                                        padding: "0.25rem 0.5rem", borderRadius: "4px",
                                        backgroundColor: user.role === "ADMIN" ? "rgba(230,0,18,0.1)" : "#f1f5f9",
                                        color: user.role === "ADMIN" ? "var(--primary)" : "var(--text-muted)"
                                    }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td style={{ padding: "1.25rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td style={{ padding: "1.25rem" }}>
                                    {user.tempPassword ? (
                                        <code style={{ 
                                            backgroundColor: "#fef9c3", color: "#854d0e", 
                                            padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 800,
                                            border: "1px dashed #eab308"
                                        }}>
                                            {user.tempPassword}
                                        </code>
                                    ) : (
                                        <span style={{ color: "#cbd5e1", fontSize: "0.8rem" }}>Aucun</span>
                                    )}
                                </td>
                                <td style={{ padding: "1.25rem", textAlign: "center" }}>
                                    {user.isAuthorized ? (
                                        <span className="badge-validated" style={{ fontSize: "0.75rem" }}>AUTORISÉ</span>
                                    ) : (
                                        <span className="badge-draft" style={{ fontSize: "0.75rem", backgroundColor: "#fee2e2", color: "#ef4444" }}>RÉVOQUÉ</span>
                                    )}
                                </td>
                                <td style={{ padding: "1.25rem", textAlign: "right" }}>
                                    {user.role !== "ADMIN" && (
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
    );
}
