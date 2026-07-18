"use client";

import React from "react";
import { ModalForm } from "../ModalForm";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup.object().shape({
    code: yup.string().required("HS Code is required"),
    description: yup.string().required("Commodity nature is required"),
});

const defaultValues = {
    code: "",
    description: "",
};

export function HSCodeForm({ title = "", isOpen, onClose, onSuccess, onDelete, initialData }: { title?: string, isOpen: boolean, onClose: () => void, onSuccess: (hscode: any) => void, onDelete?: (id: string) => void, initialData?: any }) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        mode: "onChange",
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
                alert(err.error || "Error during save.");
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
                alert("Error during deletion.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to ensure uppercase and sync with react-hook-form
    const handleUpper = (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase();
        setValue(fieldName, val, { shouldValidate: true });
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
                    <label>HS Code *</label>
                    <input 
                        {...register("code")} 
                        placeholder="e.g. 8703" 
                        onChange={handleUpper("code")}
                        style={{ textTransform: 'uppercase' }}
                    />
                    {errors.code && <span className="error-msg">{errors.code.message as string}</span>}
                </div>

                <div>
                    <label>Commodity Nature *</label>
                    <input 
                        {...register("description")} 
                        placeholder="Short description" 
                        onChange={handleUpper("description")}
                        style={{ textTransform: 'uppercase' }}
                    />
                    {errors.description && <span className="error-msg">{errors.description.message as string}</span>}
                </div>
            </div>
        </ModalForm>
    );
}
