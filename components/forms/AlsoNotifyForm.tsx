"use client";

import React from "react";
import { ModalForm } from "../ModalForm";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup.object().shape({
    name: yup.string().required("Le nom est requis"),
    description: yup.string().required("La description est requise"),
});

export function AlsoNotifyForm({
    title,
    isOpen,
    onClose,
    onSuccess,
    initialData,
    maxWidth = "800px"
}: {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (item: any) => void;
    initialData?: any;
    maxWidth?: string;
}) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: initialData || { name: "ALSO NOTIFY", description: "" },
    });

    React.useEffect(() => {
        if (isOpen) {
            reset(initialData || { name: "ALSO NOTIFY", description: "" });
        }
    }, [isOpen, initialData, reset]);

    const handleFormSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const isEditing = !!initialData?.id;
            const url = isEditing ? `/api/alsonotify/${initialData.id}` : "/api/alsonotify";
            const res = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                const saved = await res.json();
                onSuccess(saved);
                onClose();
            } else {
                alert("Erreur lors de l'enregistrement.");
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
            isSubmitting={isSubmitting}
            maxWidth={maxWidth}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label style={{ fontWeight: 700, color: 'var(--oocl-blue)', marginBottom: '0.4rem', display: 'block' }}>Also Notify *</label>
                    <input {...register("name")} placeholder="ex: Nom de l'entité" />
                    {errors.name && <span className="error-msg">{errors.name.message as string}</span>}
                </div>
                
                <div>
                    <label style={{ fontWeight: 700, color: 'var(--oocl-blue)', marginBottom: '0.4rem', display: 'block' }}>Description (Also Notify) *</label>
                    <textarea {...register("description")} rows={6} placeholder="Détails de l'adresse, contact, etc." />
                    {errors.description && <span className="error-msg">{errors.description.message as string}</span>}
                </div>
            </div>
        </ModalForm>
    );
}
