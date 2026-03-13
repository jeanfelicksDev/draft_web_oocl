"use client";

import React from "react";
import { ModalForm } from "../ModalForm";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

interface SmallGenericFormProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    endpoint: string;
    entityName: string;
    idField: string;
    entities: any[];
    setEntities: (entities: any[]) => void;
    initialData?: any;
    isTextArea?: boolean;
    fieldName?: string;
}

export function SmallGenericForm({
    title,
    isOpen,
    onClose,
    endpoint,
    entityName,
    idField,
    entities,
    setEntities,
    initialData,
    isTextArea = false,
    fieldName = "name"
}: SmallGenericFormProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const schema = yup.object().shape({
        [fieldName]: yup.string().required(`Le champ ${fieldName} est requis`),
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: initialData || { [fieldName]: "" },
    });

    React.useEffect(() => {
        if (isOpen) {
            reset(initialData || { [fieldName]: "" });
        }
    }, [isOpen, initialData, reset, fieldName]);

    const handleFormSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const isEditing = !!initialData?.id;
            const url = isEditing ? `${endpoint}/${initialData.id}` : endpoint;
            const res = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                const saved = await res.json();
                if (isEditing) {
                    setEntities(entities.map(e => e.id === saved.id ? saved : e));
                } else {
                    setEntities([...entities, saved]);
                }
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
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ textTransform: 'capitalize' }}>{entityName} *</label>
                {isTextArea ? (
                    <textarea {...register(fieldName as any)} rows={4} />
                ) : (
                    <input {...register(fieldName as any)} />
                )}
                {errors[fieldName] && <span className="error-msg">{errors[fieldName]?.message as string}</span>}
            </div>
        </ModalForm>
    );
}
