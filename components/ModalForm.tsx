"use client";

import React from "react";

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '1.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        &times;
                    </button>
                </div>

                <form onSubmit={onSubmit}>
                    {children}

                    <div style={{ display: 'flex', justifyContent: onDelete ? 'space-between' : 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        {onDelete && (
                            <button
                                type="button"
                                className="btn-delete-modal"
                                onClick={onDelete}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Suppression..." : "Supprimer"}
                            </button>
                        )}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
