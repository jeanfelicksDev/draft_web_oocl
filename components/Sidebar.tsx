'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    Ship, 
    ShieldCheck, 
    LogOut,
    User,
    Package,
    Box,
    MapPin
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useAuth } from "./AuthProvider";

interface SidebarProps {
    onNewForm?: () => void;
    onAddTypeTc?: () => void;
    onAddPackageType?: () => void;
}

export function Sidebar({ onNewForm, onAddTypeTc, onAddPackageType }: SidebarProps) {
    const pathname = usePathname();
    const { user, hasPermission } = useAuth();
    const canManageUsers = hasPermission("ADMIN_ACCESS");
    const canEditRefTables = hasPermission("REF_TABLES_WRITE");

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <img src="/logo-oocl.png" alt="OOCL Logo" />
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <Link href="/" passHref style={{ textDecoration: "none" }}>
                    <div 
                        className={`nav-item ${pathname === '/' ? 'active' : ''}`} 
                        onClick={pathname === '/' ? onNewForm : undefined}
                        style={{ cursor: "pointer" }}
                    >
                        <Ship size={19} />
                        <span>Créer une S.I.</span>
                    </div>
                </Link>

                <Link href="/dashboard" passHref style={{ textDecoration: "none" }}>
                    <div className={`nav-item ${pathname === '/dashboard' ? 'active' : ''}`}>
                        <LayoutDashboard size={19} />
                        <span>Tableau de Bord</span>
                    </div>
                </Link>

                {/* Tables de référence (Actions rapides) - Réservé ADMIN */}
                {canManageUsers && (
                    <div style={{ marginTop: "1.5rem", padding: "0 1rem" }}>
                        <p style={{ 
                            fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", 
                            textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" 
                        }}>
                            Actions Rapides
                        </p>
                        <Link href="/admin/references?tab=tc" passHref style={{ textDecoration: "none" }}>
                            <div 
                                className="nav-item-action" 
                                style={{ 
                                    display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem",
                                    borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                                    color: "var(--text-main)", transition: "all 0.2s"
                                }}
                            >
                                <Box size={18} style={{ color: "var(--primary)" }} />
                                <span>Ajouter Type TC</span>
                            </div>
                        </Link>
                        <Link href="/admin/references?tab=package" passHref style={{ textDecoration: "none" }}>
                            <div 
                                className="nav-item-action" 
                                style={{ 
                                    display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem",
                                    borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                                    color: "var(--text-main)", transition: "all 0.2s", marginTop: "0.25rem"
                                }}
                            >
                                <Package size={18} style={{ color: "var(--primary)" }} />
                                <span>Ajouter Type Package</span>
                            </div>
                        </Link>
                        <Link href="/admin/references?tab=released" passHref style={{ textDecoration: "none" }}>
                            <div 
                                className="nav-item-action" 
                                style={{ 
                                    display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem",
                                    borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                                    color: "var(--text-main)", transition: "all 0.2s", marginTop: "0.25rem"
                                }}
                            >
                                <ShieldCheck size={18} style={{ color: "var(--primary)" }} />
                                <span>Type Connais.</span>
                            </div>
                        </Link>
                    </div>
                )}

                {canManageUsers && (
                    <>
                        <Link href="/admin/users" passHref style={{ textDecoration: "none" }}>
                            <div className={`nav-item admin-nav-item ${pathname === '/admin/users' ? 'active' : ''}`} style={{ 
                                marginTop: "1.5rem",
                                borderTop: "1px solid var(--border)",
                                paddingTop: "1rem",
                                color: pathname === '/admin/users' ? "white" : "var(--primary)"
                            }}>
                                <ShieldCheck size={19} strokeWidth={2.5} />
                                <span style={{ fontWeight: 600 }}>Accès Utilisateurs</span>
                            </div>
                        </Link>
                        <Link href="/admin/ports" passHref style={{ textDecoration: "none" }}>
                            <div className={`nav-item admin-nav-item ${pathname === '/admin/ports' ? 'active' : ''}`} style={{ 
                                marginTop: "0.25rem",
                                color: pathname === '/admin/ports' ? "white" : "var(--primary)"
                            }}>
                                <MapPin size={19} strokeWidth={2.5} />
                                <span style={{ fontWeight: 600 }}>Gérer Ports & Pays</span>
                            </div>
                        </Link>
                    </>
                )}
            </nav>

            {/* Session info + logout */}
            <div className="sidebar-footer">
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--primary) 0%, #ff4d5e 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", flexShrink: 0,
                    }}>
                        <User size={18} />
                    </div>
                    <div style={{ overflow: "hidden" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, margin: 0, color: "var(--text-muted)" }}>Connected as</p>
                        <p style={{ 
                            fontSize: "0.85rem", fontWeight: 800, margin: 0, 
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            color: "var(--primary)"
                        }}>
                            {user?.email || "User"}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => signOut()} 
                    className="btn-outline" 
                    style={{ width: "100%", padding: "0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                >
                    <LogOut size={16} />
                    Se déconnecter
                </button>
            </div>

            <style jsx>{`
                .nav-item-action:hover {
                    background: #f1f5f9;
                    transform: translateX(4px);
                }
            `}</style>
        </aside>
    );
}
