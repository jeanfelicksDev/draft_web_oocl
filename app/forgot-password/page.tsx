"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
            } else {
                setError(data.error || "Une erreur est survenue");
            }
        } catch (err) {
            setError("Erreur de connexion");
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
                <h2 style={{ textAlign: "center", marginBottom: "1.5rem", fontWeight: 800 }}>Mot de passe oublié</h2>
                <p style={{ textAlign: "center", marginBottom: "2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    Entrez votre email pour recevoir un lien de réinitialisation.
                </p>

                {message ? (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ padding: "1rem", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "8px", marginBottom: "1.5rem" }}>
                            {message}
                        </div>
                        <Link href="/login" className="btn-primary" style={{ display: "inline-block", textDecoration: "none", width: "100%" }}>
                            Retour à la connexion
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div>
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="votre@email.com"
                            />
                        </div>

                        {error && (
                            <div className="error-msg">{error}</div>
                        )}

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? "Envoi..." : "Envoyer le lien"}
                        </button>

                        <div style={{ textAlign: "center" }}>
                            <Link href="/login" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 700 }}>
                                Retour à la connexion
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
