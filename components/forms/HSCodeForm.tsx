"use client";

import React from "react";
import { ModalForm } from "../ModalForm";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup.object().shape({
    code: yup.string().required("Le code HS est requis"),
    description: yup.string().required("La nature de la marchandise est requise"),
});

const defaultValues = {
    code: "",
    description: "",
};

export function HSCodeForm({ isOpen, onClose, onSuccess, onDelete, initialData }: { isOpen: boolean, onClose: () => void, onSuccess: (hscode: any) => void, onDelete?: (id: string) => void, initialData?: any }) {
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
            const res = await fetch(isEditing ? `/api/hscodes/${initialData.id}` : "/api/hscodes", {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                const savedItem = await res.json();
                onSuccess(savedItem);
                onClose();
            } else {
                const err = await res.json();
                alert(err.error || "Erreur lors de l'enregistrement.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id || !onDelete) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/hscodes/${initialData.id}`, { method: "DELETE" });
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
            title={initialData ? "Modifier Code HS" : "Nouveau Code HS"}
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleSubmit(handleFormSubmit)}
            onDelete={initialData && onDelete ? handleDelete : undefined}
            isSubmitting={isSubmitting}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label>HS CODE *</label>
                    <input {...register("code")} placeholder="Ex: 8703" />
                    {errors.code && <span className="error-msg">{errors.code.message as string}</span>}
                </div>

                <div>
                    <label>Nature de la marchandise *</label>
                    <textarea {...register("description")} rows={3} placeholder="Désignation courte" />
                    {errors.description && <span className="error-msg">{errors.description.message as string}</span>}
                </div>
            </div>
        </ModalForm>
    );
}
