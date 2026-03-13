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
    isOpen, 
    onClose, 
    onSuccess, 
    onDelete, 
    initialData,
    hscodes = [],
    onAddNewHSCode
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    onSuccess: (goods: any) => void, 
    onDelete?: (id: string) => void, 
    initialData?: any,
    hscodes?: any[],
    onAddNewHSCode?: () => void
}) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: initialData || defaultValues,
    });

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
            // Wait for reset to apply then resize
            setTimeout(autoResize, 0);
        }
    }, [isOpen, initialData, reset]);

    const { ref: registerRef, ...restRegister } = register("description");

    const handleFormSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const isEditing = !!initialData?.id;
            const submitEndpoint = isEditing ? `/api/goods/${initialData.id}` : "/api/goods";

            const res = await fetch(submitEndpoint, {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                const savedItem = await res.json();
                onSuccess(savedItem);
                onClose();
            } else {
                alert("Erreur lors de l'enregistrement.")
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
            title={initialData ? "Modifier Marchandise" : "Nouvelle Marchandise"}
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleSubmit(handleFormSubmit)}
            onDelete={initialData && onDelete ? handleDelete : undefined}
            isSubmitting={isSubmitting}
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
                                    onChange={(val) => {
                                        field.onChange(val);
                                        // Auto-fill nature if found
                                        const hsc = hscodes.find(h => h.code === val);
                                        if (hsc && hsc.description) {
                                            // Optional: we can auto-fill the description if it's empty
                                            // The user said "ajouter HS CODE and nature".
                                        }
                                    }}
                                    onAddNew={onAddNewHSCode}
                                    error={errors.hsCode?.message as string}
                                    placeholder="Sélectionner ou ajouter..."
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
            </div>
        </ModalForm>
    );
}
