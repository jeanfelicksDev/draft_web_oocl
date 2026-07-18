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
    MapPin,
    FileText,
    Hash,
    Coins
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useAuth } from "./AuthProvider";
import { PERMISSIONS } from "@/lib/constants/permissions";

interface SidebarProps {
    onNewForm?: () => void;
    onAddTypeTc?: () => void;
    onAddPackageType?: () => void;
}

export function Sidebar({ onNewForm, onAddTypeTc, onAddPackageType }: SidebarProps) {
    const pathname = usePathname();
    const { user, hasPermission } = useAuth();
    
    // Détermination dynamique des accès selon les permissions granulaires
    const canManageUsers = hasPermission(PERMISSIONS.MANAGE_USERS);
    const canManageDrafts = hasPermission(PERMISSIONS.BL_WRITE);
    const isAdmin = (user as any)?.role === "ADMIN";

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
                        <span>Create S.I.</span>
                    </div>
                </Link>

                <Link href="/dashboard" passHref style={{ textDecoration: "none" }}>
                    <div className={`nav-item ${pathname === '/dashboard' ? 'active' : ''}`}>
                        <LayoutDashboard size={19} />
                        <span>Dashboard</span>
                    </div>
                </Link>

                {/* Administration principale */}
                {canManageUsers && (
                    <>
                        <Link href="/admin/users" passHref style={{ textDecoration: "none" }}>
                            <div className={`nav-item admin-nav-item ${pathname === '/admin/users' ? 'active' : ''}`} style={{ 
                                marginTop: "1.5rem",
                                borderTop: "1px solid var(--border)",
                                paddingTop: "1rem",
                                color: pathname === '/admin/users' ? "white" : "#000000"
                            }}>
                                <ShieldCheck size={19} strokeWidth={2.5} />
                                <span style={{ fontWeight: 600 }}>User Access</span>
                            </div>
                        </Link>
                        <Link href="/admin/ports" passHref style={{ textDecoration: "none" }}>
                            <div className={`nav-item admin-nav-item ${pathname === '/admin/ports' ? 'active' : ''}`} style={{ 
                                marginTop: "0.25rem",
                                color: pathname === '/admin/ports' ? "white" : "#000000"
                            }}>
                                <MapPin size={19} strokeWidth={2.5} />
                                <span style={{ fontWeight: 600 }}>Manage Ports & Countries</span>
                            </div>
                        </Link>
                        <Link href="/admin/vessels" passHref style={{ textDecoration: "none" }}>
                            <div className={`nav-item admin-nav-item ${pathname === '/admin/vessels' ? 'active' : ''}`} style={{ 
                                marginTop: "0.25rem",
                                color: pathname === '/admin/vessels' ? "white" : "#000000"
                            }}>
                                <Ship size={19} strokeWidth={2.5} />
                                <span style={{ fontWeight: 600 }}>Manage Vessels & Voyages</span>
                            </div>
                        </Link>
                        <Link href="/admin/drafts" passHref style={{ textDecoration: "none" }}>
                            <div className={`nav-item admin-nav-item ${pathname === '/admin/drafts' ? 'active' : ''}`} style={{ 
                                marginTop: "0.25rem",
                                color: pathname === '/admin/drafts' ? "white" : "#000000"
                            }}>
                                <FileText size={19} strokeWidth={2.5} />
                                <span style={{ fontWeight: 600 }}>Client Drafts Tracking</span>
                            </div>
                        </Link>
                    </>
                )}

                {/* Tables de référence (Actions rapides) - Déplacé en bas */}
                {canManageUsers && (
                    <div style={{ marginTop: "1.5rem", padding: "0 1rem" }}>
                        <p style={{ 
                            fontSize: "0.7rem", fontWeight: 800, color: "#000000", 
                            textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" 
                        }}>
                            Quick Actions
                        </p>
                        <Link href="/admin/references?tab=tc" passHref style={{ textDecoration: "none" }}>
                            <div 
                                className="nav-item-action" 
                                style={{ 
                                    display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem",
                                    borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                                    color: "#000000", transition: "all 0.2s"
                                }}
                            >
                                <Box size={18} style={{ color: "var(--primary)" }} />
                                <span>Add Container Type</span>
                            </div>
                        </Link>
                        <Link href="/admin/references?tab=package" passHref style={{ textDecoration: "none" }}>
                            <div 
                                className="nav-item-action" 
                                style={{ 
                                    display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem",
                                    borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                                    color: "#000000", transition: "all 0.2s", marginTop: "0.25rem"
                                }}
                            >
                                <Package size={18} style={{ color: "var(--primary)" }} />
                                <span>Add Package Type</span>
                            </div>
                        </Link>
                        <Link href="/admin/references?tab=released" passHref style={{ textDecoration: "none" }}>
                            <div 
                                className="nav-item-action" 
                                style={{ 
                                    display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem",
                                    borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                                    color: "#000000", transition: "all 0.2s", marginTop: "0.25rem"
                                }}
                            >
                                <ShieldCheck size={18} style={{ color: "var(--primary)" }} />
                                <span>BL Type</span>
                            </div>
                        </Link>
                        <Link href="/admin/references?tab=hscode" passHref style={{ textDecoration: "none" }}>
                            <div 
                                className="nav-item-action" 
                                style={{ 
                                    display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem",
                                    borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                                    color: "#000000", transition: "all 0.2s", marginTop: "0.25rem"
                                }}
                            >
                                <Hash size={18} style={{ color: "var(--primary)" }} />
                                <span>HS Code</span>
                            </div>
                        </Link>
                        <Link href="/admin/references?tab=currency" passHref style={{ textDecoration: "none" }}>
                            <div 
                                className="nav-item-action" 
                                style={{ 
                                    display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem",
                                    borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                                    color: "#000000", transition: "all 0.2s", marginTop: "0.25rem"
                                }}
                            >
                                <Coins size={18} style={{ color: "var(--primary)" }} />
                                <span>Currencies</span>
                            </div>
                        </Link>
                    </div>
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
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, margin: 0, color: "#000000" }}>Connected as</p>
                        <p style={{ 
                            fontSize: "0.85rem", fontWeight: 800, margin: 0, 
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            color: "#000000"
                        }}>
                            {user?.email || "User"}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => signOut({ callbackUrl: "/login" })} 
                    className="btn-outline" 
                    style={{ width: "100%", padding: "0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                >
                    <LogOut size={16} />
                    Log out
                </button>
            </div>
 
            <style jsx>{`
                .nav-item-action:hover {
                    background: var(--primary-light);
                    color: #000000;
                    transform: translateX(4px);
                }
            `}</style>
        </aside>
    );
}
