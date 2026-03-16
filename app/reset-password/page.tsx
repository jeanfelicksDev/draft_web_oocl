"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ResetPasswordContent() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        if (password.length < 6) {
            setError("Le mot de passe doit faire au moins 6 caractères");
            return;
        }

        setLoading(true);
        setMessage("");
        setError("");

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            } else {
                setError(data.error || "Une erreur est survenue");
            }
        } catch (err) {
            setError("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="error-msg">Token manquant. Veuillez utiliser le lien reçu par email.</div>
            </div>
        );
    }

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
                <h2 style={{ textAlign: "center", marginBottom: "1.5rem", fontWeight: 800 }}>réinitialisation</h2>
                <p style={{ textAlign: "center", marginBottom: "2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    Choisissez votre nouveau mot de passe.
                </p>

                {message ? (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ padding: "1rem", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "8px", marginBottom: "1.5rem" }}>
                            {message}
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Redirection vers la connexion...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div>
                            <label>nouveau mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label>confirmer le mot de passe</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                        >
                            {loading ? "réinitialisation..." : "changer le mot de passe"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
