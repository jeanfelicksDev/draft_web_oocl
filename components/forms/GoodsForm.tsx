"use client";

import React from "react";
import { ModalForm } from "../ModalForm";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

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

export function GoodsForm({ isOpen, onClose, onSuccess, onDelete, initialData }: { isOpen: boolean, onClose: () => void, onSuccess: (goods: any) => void, onDelete?: (id: string) => void, initialData?: any }) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: initialData || defaultValues,
    });

    React.useEffect(() => {
        if (isOpen) {
            reset(initialData || defaultValues);
        }
    }, [isOpen, initialData, reset]);

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
                    <textarea {...register("description")} rows={4} />
                    {errors.description && <span className="error-msg">{errors.description.message as string}</span>}
                </div>

                <div className="grid-2">
                    <div>
                        <label>HS CODE *</label>
                        <input {...register("hsCode")} />
                        {errors.hsCode && <span className="error-msg">{errors.hsCode.message as string}</span>}
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
