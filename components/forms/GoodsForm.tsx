"use client";

import React from "react";
import { ModalForm } from "../ModalForm";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Combobox } from "../Combobox";

const schema = yup.object().shape({
    description: yup.string().required("La description est requise"),
    hsCode: yup.string().required("Le code HS est requis"),
    declNo: yup.string().required("Le N° de déclaration est requis"),
});

const defaultValues = {
    description: "",
    hsCode: "",
    declNo: "",
};

export function GoodsForm({ 
    title = "",
    isOpen, 
    onClose, 
    onSuccess, 
    onDelete, 
    initialData,
    hscodes = [],
    onAddNewHSCode,
    onEditHSCode
}: { 
    title?: string;
    isOpen: boolean; 
    onClose: () => void; 
    onSuccess: (goods: any) => void; 
    onDelete?: (id: string) => void; 
    initialData?: any; 
    hscodes?: any[]; 
    onAddNewHSCode?: () => void; 
    onEditHSCode?: (id: string) => void; 
}) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: initialData || defaultValues,
    });

    const selectedHSCode = watch("hsCode");
    const hscInfo = hscodes.find(h => h.code === selectedHSCode);

    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    const autoResize = () => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
        }
    };

    React.useEffect(() => {
        if (isOpen) {
            reset(initialData || defaultValues);
            setTimeout(autoResize, 0);
        }
    }, [isOpen, initialData, reset]);

    const { ref: registerRef, ...restRegister } = register("description");

    const handleFormSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const isEditing = !!initialData?.id;
            const res = await fetch(isEditing ? `/api/goods/${initialData.id}` : "/api/goods", {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                const savedItem = await res.json();
                onSuccess(savedItem);
                onClose();
            } else {
                alert("Erreur lors de l'enregistrement.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id || !onDelete) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/goods/${initialData.id}`, { method: "DELETE" });
            if (res.ok) {
                onDelete(initialData.id);
                onClose();
            } else {
                alert("Erreur lors de la suppression.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ModalForm
            title={title}
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleSubmit(handleFormSubmit)}
            onDelete={initialData && onDelete ? handleDelete : undefined}
            isSubmitting={isSubmitting}
            maxWidth="800px"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label>Description Goods *</label>
                    <textarea 
                        {...restRegister}
                        ref={(e: HTMLTextAreaElement | null) => {
                            registerRef(e);
                            textareaRef.current = e;
                        }}
                        rows={4} 
                        onChange={(e) => {
                            restRegister.onChange(e);
                            autoResize();
                        }}
                        style={{ overflow: 'hidden', resize: 'none' }}
                    />
                    {errors.description && <span className="error-msg">{errors.description.message as string}</span>}
                </div>

                <div className="grid-2">
                    <div>
                        <Controller
                            name="hsCode"
                            control={control}
                            render={({ field }) => (
                                <Combobox
                                    label="HS CODE *"
                                    items={hscodes}
                                    displayKey="code"
                                    valueKey="code"
                                    value={field.value}
                                    onChange={field.onChange}
                                    onAddNew={onAddNewHSCode}
                                    onEdit={onEditHSCode ? () => {
                                        const h = hscodes.find(x => x.code === field.value);
                                        if (h) onEditHSCode(h.id);
                                    } : undefined}
                                    error={errors.hsCode?.message as string}
                                    placeholder="Sélectionner..."
                                />
                            )}
                        />
                    </div>
                    <div>
                        <label>DECL N° *</label>
                        <input {...register("declNo")} />
                        {errors.declNo && <span className="error-msg">{errors.declNo.message as string}</span>}
                    </div>
                </div>

                {hscInfo && (
                    <div style={{ 
                        marginTop: '-0.5rem',
                        padding: '0.8rem 1rem',
                        backgroundColor: 'rgba(10, 31, 92, 0.05)',
                        borderRadius: '10px',
                        borderLeft: '4px solid var(--primary)',
                        fontSize: '0.9rem'
                    }}>
                        <p style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.2rem', textTransform: 'uppercase', fontSize: '0.7rem' }}>Commodity / Nature</p>
                        <p style={{ color: '#0a1f5c', fontWeight: 500 }}>{hscInfo.description}</p>
                    </div>
                )}
            </div>
        </ModalForm>
    );
}
