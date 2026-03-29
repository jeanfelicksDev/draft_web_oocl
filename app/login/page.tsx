"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Email ou mot de passe incorrect");
            } else {
                router.push("/");
                router.refresh();
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
            <div style={{ marginBottom: "2rem" }}>
                <img src="/logo-oocl.png" alt="OOCL Logo" style={{ height: "80px", width: "auto" }} />
            </div>

            <div className="form-container" style={{ width: "100%", maxWidth: "400px" }}>
                <h2 style={{ textAlign: "center", marginBottom: "2rem", fontWeight: 800 }}>connexion</h2>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                        <label>email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value.toLowerCase())}
                            required
                        />
                    </div>
                    <div>
                        <label>mot de passe</label>
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
                        style={{ marginTop: "1rem", width: "100%" }}
                    >
                        {loading ? "connexion..." : "se connecter"}
                    </button>
                    
                </form>

                <div style={{ textAlign: "center", marginTop: "1rem" }}>
                    <Link href="/forgot-password" style={{ fontSize: "0.9rem", color: "var(--primary)", textDecoration: "underline", fontWeight: 600 }}>
                        Mot de passe oublié ?
                    </Link>
                </div>

                <div style={{ marginTop: "2rem", textAlign: "center", fontWeight: 700, color: "var(--text-muted)" }}>
                    Pas encore de compte ? <Link href="/register" style={{ color: "var(--primary)", textDecoration: "none" }}>S'inscrire</Link>
                </div>
            </div>
        </div>
    );
}
