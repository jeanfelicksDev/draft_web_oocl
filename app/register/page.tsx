"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [phone, setPhone] = useState("");
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
                body: JSON.stringify({ email, password, companyName, phone, role }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error during registration");
            } else {
                alert("Account successfully created! Please log in.");
                router.push("/login");
            }
        } catch (err) {
            setError("An error occurred");
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
                <h2 style={{ textAlign: "center", marginBottom: "2rem", fontWeight: 800 }}>Create Account</h2>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                    <div>
                        <label>Company Name</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                        />
                    </div>
                    {!adminExists && (
                        <div>
                             <label>Account Type</label>
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
                                <option value="ADMIN">Administrator</option>
                            </select>
                        </div>
                    )}
                    <div>
                          <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value.toLowerCase())}
                            required
                        />
                    </div>
                    <div>
                          <label>Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                          <label>Password</label>
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
                          {loading ? "Registering..." : "Register"}
                    </button>
                </form>

                <div style={{ marginTop: "2rem", textAlign: "center", fontWeight: 700, color: "var(--text-muted)" }}>
                    Already have an account? <Link href="/login" style={{ color: "var(--primary)", textDecoration: "none" }}>Log In</Link>
                </div>
            </div>
        </div>
    );
}
