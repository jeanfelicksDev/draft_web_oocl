"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [devResetLink, setDevResetLink] = useState("");
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");
        setDevResetLink("");

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                if (data.devMode && data.devResetLink) {
                    setDevResetLink(data.devResetLink);
                }
            } else {
                setError(data.error || "Une erreur est survenue");
            }
        } catch (err) {
            setError("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(devResetLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
            <div style={{ marginBottom: "2rem" }}>
                <img src="/logo-oocl.png" alt="OOCL Logo" style={{ height: "80px", width: "auto" }} />
            </div>

            <div className="form-container" style={{ width: "100%", maxWidth: "400px" }}>
                <h2 style={{ textAlign: "center", marginBottom: "1.5rem", fontWeight: 800 }}>mot de passe oublié</h2>
                <p style={{ textAlign: "center", marginBottom: "2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    Entrez votre email pour recevoir un lien de réinitialisation.
                </p>

                {message ? (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ padding: "1rem", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "8px", marginBottom: "1rem" }}>
                            {message}
                        </div>

                        {devResetLink && (
                            <div style={{
                                marginBottom: "1.5rem",
                                padding: "1rem",
                                backgroundColor: "rgba(234, 179, 8, 0.1)",
                                border: "1px solid rgba(234, 179, 8, 0.3)",
                                borderRadius: "8px",
                                textAlign: "left"
                            }}>
                                <p style={{ fontSize: "0.78rem", color: "#ca8a04", fontWeight: 700, marginBottom: "0.5rem" }}>
                                    ⚠️ MODE DÉVELOPPEMENT — Lien de réinitialisation :
                                </p>
                                <p style={{
                                    fontSize: "0.72rem",
                                    wordBreak: "break-all",
                                    color: "var(--text-muted)",
                                    marginBottom: "0.75rem",
                                    fontFamily: "monospace",
                                    backgroundColor: "rgba(0,0,0,0.15)",
                                    padding: "0.5rem",
                                    borderRadius: "4px"
                                }}>
                                    {devResetLink}
                                </p>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button
                                        onClick={handleCopy}
                                        className="btn-primary"
                                        style={{ flex: 1, fontSize: "0.8rem", padding: "0.5rem" }}
                                    >
                                        {copied ? "✓ Copié !" : "Copier le lien"}
                                    </button>
                                    <a
                                        href={devResetLink}
                                        className="btn-primary"
                                        style={{ flex: 1, fontSize: "0.8rem", padding: "0.5rem", textDecoration: "none", textAlign: "center", backgroundColor: "rgba(16, 185, 129, 0.8)" }}
                                    >
                                        Ouvrir directement →
                                    </a>
                                </div>
                            </div>
                        )}

                        <Link href="/login" className="btn-primary" style={{ display: "inline-block", textDecoration: "none", width: "100%" }}>
                            retour à la connexion
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div>
                            <label>email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value.toLowerCase())}
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
                            {loading ? "envoi..." : "envoyer le lien"}
                        </button>

                        <div style={{ textAlign: "center" }}>
                            <Link href="/login" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 700 }}>
                                retour à la connexion
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
