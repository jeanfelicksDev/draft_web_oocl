"use client";

import React from "react";
import { Trash2 } from "lucide-react";

interface ModalFormProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onDelete?: () => Promise<void>;
    isSubmitting?: boolean;
    children: React.ReactNode;
    maxWidth?: string;
}

export function ModalForm({
    title,
    isOpen,
    onClose,
    onSubmit,
    onDelete,
    isSubmitting = false,
    children,
    maxWidth,
}: ModalFormProps) {
    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={maxWidth ? { maxWidth } : {}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    {title && (
                        <h2 style={{ 
                            color: '#e60012', 
                            fontSize: '1.4rem', 
                            fontWeight: 900, 
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            margin: 0
                        }}>
                            {title}
                        </h2>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            fontSize: '1.8rem',
                            cursor: 'pointer',
                            lineHeight: 1,
                            transition: 'transform 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.25)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title="Fermer"
                    >
                        &times;
                    </button>
                </div>

                <form onSubmit={onSubmit}>
                    {children}

                    <div style={{ display: 'flex', justifyContent: onDelete ? 'space-between' : 'flex-end', alignItems: 'center', marginTop: '2.5rem' }}>
                        {onDelete && (
                            <button
                                type="button"
                                onClick={async (e) => {
                                    e.preventDefault();
                                    if (window.confirm("Voulez-vous vraiment supprimer cet enregistrement ?")) {
                                        await onDelete();
                                    }
                                }}
                                disabled={isSubmitting}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--danger)',
                                    fontSize: '1.4rem',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0.5rem'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                title="Supprimer définitivement"
                            >
                                <Trash2 size={24} />
                            </button>
                        )}
                        <button
                            type="submit"
                            style={{
                                padding: '0.75rem 2rem',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 15px rgba(16, 185, 129, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 10px rgba(16, 185, 129, 0.2)';
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
