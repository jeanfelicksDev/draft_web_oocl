"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [role, setRole] = useState("CLIENT");
    const [adminExists, setAdminExists] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const res = await fetch("/api/auth/register");
                const data = await res.json();
                if (data.adminExists) {
                    setAdminExists(true);
                    setRole("CLIENT");
                }
            } catch (err) {
                console.error("Failed to check admin status", err);
            }
        };
        checkAdmin();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, companyName, role }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erreur lors de l'inscription");
            } else {
                alert("Compte créé avec succès ! Connectez-vous.");
                router.push("/login");
            }
        } catch (err) {
            setError("Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--bg-primary)",
            padding: "1rem"
        }}>
            <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "3rem" }}>🚢</span>
                <span style={{ fontFamily: "Nunito", fontSize: "2.5rem", fontWeight: 900, color: "var(--primary)" }}>duo<span style={{ color: "var(--accent-teal)" }}>ship</span></span>
            </div>

            <div className="form-container" style={{ width: "100%", maxWidth: "400px" }}>
                <h2 style={{ textAlign: "center", marginBottom: "2rem", fontWeight: 800 }}>Créer un compte</h2>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                        <label>Nom de l'entreprise</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                        />
                    </div>
                    {!adminExists && (
                        <div>
                            <label>Type de compte</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.8rem",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border-color)",
                                    backgroundColor: "var(--bg-secondary)",
                                    color: "var(--text-primary)",
                                    fontSize: "1rem"
                                }}
                            >
                                <option value="CLIENT">Client</option>
                                <option value="ADMIN">Administrateur</option>
                            </select>
                        </div>
                    )}
                    <div>
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="error-msg">{error}</div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ marginTop: "1rem" }}
                    >
                        {loading ? "Chargement..." : "S'inscrire"}
                    </button>
                </form>

                <div style={{ marginTop: "2rem", textAlign: "center", fontWeight: 700, color: "var(--text-muted)" }}>
                    Déjà un compte ? <Link href="/login" style={{ color: "var(--primary)", textDecoration: "none" }}>Se connecter</Link>
                </div>
            </div>
        </div>
    );
}
