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
    maxWidth?: string;
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
    fieldName = "name",
    maxWidth
}: SmallGenericFormProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const schema = yup.object().shape({
        [fieldName]: yup.string().required(`${entityName} is required`),
    });

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        mode: "onChange",
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
                alert("Error during save.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${endpoint}/${initialData.id}`, { method: "DELETE" });
            if (res.ok) {
                setEntities(entities.filter(e => e.id !== initialData.id));
                onClose();
            } else {
                alert("Error during deletion.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpper = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const val = e.target.value.toUpperCase();
        setValue(fieldName as any, val, { shouldValidate: true });
    };

    return (
        <ModalForm
            title={title}
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleSubmit(handleFormSubmit)}
            onDelete={initialData?.id ? handleDelete : undefined}
            isSubmitting={isSubmitting}
            maxWidth={maxWidth}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ textTransform: 'capitalize' }}>{entityName} *</label>
                {isTextArea ? (
                    <textarea 
                        {...register(fieldName as any)} 
                        rows={4} 
                        onChange={handleUpper}
                        style={{ textTransform: 'uppercase' }}
                    />
                ) : (
                    <input 
                        {...register(fieldName as any)} 
                        onChange={handleUpper}
                        style={{ textTransform: 'uppercase' }}
                    />
                )}
                {errors[fieldName] && <span className="error-msg">{errors[fieldName]?.message as string}</span>}
            </div>
        </ModalForm>
    );
}
