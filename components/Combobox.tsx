"use client";

import React from "react";
import { Plus, Edit3 } from "lucide-react";

interface ComboboxProps {
    label: string;
    items: any[];
    displayKey: string;
    valueKey: string;
    value: string;
    onChange: (value: string) => void;
    onAddNew?: () => void;
    onEdit?: () => void;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    multiline?: boolean;
    isDraft?: boolean;
}

/**
 * Composant Combobox simplifié (Select standard avec actions)
 * Remplace l'ancien type Combobox complexe par un Select HTML harmonisé.
 */
export function Combobox({
    label,
    items,
    displayKey,
    valueKey,
    value,
    onChange,
    onAddNew,
    onEdit,
    placeholder = "Sélectionner...",
    error,
    disabled = false,
    multiline = false,
    isDraft = false,
}: ComboboxProps) {
    const safeItems = Array.isArray(items) ? items : [];

    const getBorderColor = () => {
        if (error) return 'var(--danger)';
        if (isDraft) return '#d97706';
        return 'var(--border)';
    };

    const getBgColor = () => {
        if (isDraft) return 'rgba(217, 119, 6, 0.05)';
        if (value) return 'rgba(16, 185, 129, 0.05)';
        return 'var(--input-bg)';
    };

    return (
        <div style={{ width: '100%', marginBottom: '1rem' }}>
            <label style={{ 
                marginBottom: '0.45rem', 
                fontSize: '0.85rem', 
                fontWeight: 700, 
                color: isDraft ? '#b45309' : 'var(--oocl-blue)',
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <span>{label}</span>
            </label>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    {multiline ? (
                        <textarea
                            value={safeItems.find(i => i[valueKey] === value)?.[displayKey] || ""}
                            readOnly
                            onClick={onEdit}
                            placeholder={placeholder}
                            disabled={disabled}
                            style={{
                                width: '100%',
                                padding: '0.6rem 1rem',
                                borderRadius: '12px',
                                border: `2px solid ${getBorderColor()}`,
                                backgroundColor: getBgColor(),
                                color: isDraft ? '#92400e' : '#0a1f5c',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                minHeight: '100px',
                                cursor: onEdit ? 'pointer' : 'default',
                                transition: 'all 0.2s'
                            }}
                        />
                    ) : (
                        <select
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            disabled={disabled}
                            style={{
                                width: '100%',
                                height: '46px',
                                padding: '0.6rem 2.5rem 0.6rem 1rem',
                                borderRadius: '12px',
                                border: `2px solid ${getBorderColor()}`,
                                backgroundColor: getBgColor(),
                                color: isDraft ? '#92400e' : '#0a1f5c',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                appearance: 'none',
                                cursor: 'pointer',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 1rem center',
                                transition: 'all 0.2s'
                            }}
                        >
                            <option value="">{placeholder}</option>
                            {safeItems.map((item) => {
                                const isItemDraft = item.saveStatus === "DRAFT";
                                return (
                                    <option key={item[valueKey]} value={item[valueKey]}>
                                        {String(item[displayKey]).toUpperCase()}
                                    </option>
                                );
                            })}
                        </select>
                    )}
                </div>

                {!disabled && (onAddNew || onEdit) && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {value && onEdit && (
                            <button
                                type="button"
                                onClick={onEdit}
                                title="Modifier"
                                style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '10px',
                                    border: '1.5px solid var(--border)',
                                    backgroundColor: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--primary)'
                                }}
                            >
                                <Edit3 size={16} />
                            </button>
                        )}
                        {onAddNew && (
                            <button
                                type="button"
                                onClick={onAddNew}
                                title="Ajouter"
                                style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '10px',
                                    border: '1.5px solid var(--border)',
                                    backgroundColor: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--success)'
                                }}
                            >
                                <Plus size={20} />
                            </button>
                        )}
                    </div>
                )}
            </div>
            
            {error && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', fontWeight: 600 }}>{error}</div>}
        </div>
    );
}
