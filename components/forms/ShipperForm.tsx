"use client";

import React from "react";
import { ModalForm } from "../ModalForm";
import * as yup from "yup";
import { countryRequirements, cityRequirements } from "../../lib/constants";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { SearchableDropdown } from "../SearchableDropdown";
import { MARITIME_COUNTRIES, WORLD_PORTS_BY_COUNTRY } from "../../lib/world-ports-data";

const schema = yup.object().shape({
    name: yup.string().required("Le nom est requis"),
    address: yup.string().required("L'adresse est requise"),
    country: yup.string().required("Le pays est requis"),
    city: yup.string().required("La ville est requise"),
    phone: yup.string().required("Le téléphone est requis"),
    email: yup.string().email("Email invalide").required("L'email est requis"),
    vat: yup.string().nullable().when(["country", "city"], {
        is: (country: string, city: string) => countryRequirements[country]?.includes("VAT") || cityRequirements[city]?.includes("VAT"),
        then: (s: any) => s.required("Le N°VAT est requis pour cette destination."),
        otherwise: (s: any) => s.nullable(),
    }),
    eori: yup.string().nullable().when(["country", "city"], {
        is: (country: string, city: string) => countryRequirements[country]?.includes("EORI") || cityRequirements[city]?.includes("EORI"),
        then: (s: any) => s.required("Le N°EORI est requis pour cette destination."),
        otherwise: (s: any) => s.nullable(),
    }),
    bin: yup.string().nullable().when(["country", "city"], {
        is: (country: string, city: string) => countryRequirements[country]?.includes("BIN") || cityRequirements[city]?.includes("BIN"),
        then: (s: any) => s.required("Le BIN est requis pour cette destination."),
        otherwise: (s: any) => s.nullable(),
    }),
    usci: yup.string().nullable().when(["country", "city"], {
        is: (country: string, city: string) => countryRequirements[country]?.includes("USCI") || cityRequirements[city]?.includes("USCI"),
        then: (s: any) => s.required("L'USCI est requis pour cette destination."),
        otherwise: (s: any) => s.nullable(),
    }),
});

const defaultValues = {
    name: "",
    address: "",
    country: "",
    city: "",
    phone: "",
    email: "",
    vat: "",
    eori: "",
    bin: "",
    usci: "",
};

// Sub-component for form body
function ShipperFormBody({ register, errors, watch, setValue }: any) {
    const country = watch("country");
    const city = watch("city");

    const availablePorts = country ? (WORLD_PORTS_BY_COUNTRY[country] || []) : [];

    const isNeeded = (field: string) => {
        return countryRequirements[country]?.includes(field) || cityRequirements[city]?.includes(field);
    };

    React.useEffect(() => {
        if (!isNeeded("VAT")) setValue("vat", "");
        if (!isNeeded("EORI")) setValue("eori", "");
        if (!isNeeded("BIN")) setValue("bin", "");
        if (!isNeeded("USCI")) setValue("usci", "");
    }, [country, city, setValue]);

    // Helper to ensure uppercase and sync with react-hook-form
    const handleUpper = (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase();
        setValue(fieldName, val);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <label>Nom du Shipper *</label>
                <input 
                    {...register("name")} 
                    onChange={handleUpper("name")} 
                    style={{ textTransform: 'uppercase' }} 
                />
                {errors.name && <span className="error-msg">{errors.name.message}</span>}
            </div>

            <div>
                <label>Adresse *</label>
                <textarea {...register("address")} rows={3} />
                {errors.address && <span className="error-msg">{errors.address.message}</span>}
            </div>

            <div className="grid-2">
                <div>
                    <SearchableDropdown
                        label="Pays *"
                        options={MARITIME_COUNTRIES}
                        value={country}
                        onSelect={(val) => {
                            setValue("country", val);
                            setValue("city", "");
                        }}
                        placeholder="Sélectionner un pays..."
                        error={errors.country?.message}
                    />
                </div>
                <div>
                    <SearchableDropdown
                        label="Ville *"
                        options={availablePorts}
                        value={city}
                        onSelect={(val) => setValue("city", val)}
                        placeholder={country ? "Sélectionner une ville..." : "⬅ Choisir d'abord un pays"}
                        disabled={!country}
                        error={errors.city?.message}
                    />
                </div>
            </div>

            <div className="grid-2">
                <div>
                    <label>Téléphone *</label>
                    <input 
                        {...register("phone")} 
                        type="tel" 
                        onChange={handleUpper("phone")} 
                        style={{ textTransform: 'uppercase' }} 
                    />
                    {errors.phone && <span className="error-msg">{errors.phone.message}</span>}
                </div>
                <div>
                    <label>Email *</label>
                    <input {...register("email")} type="email" />
                    {errors.email && <span className="error-msg">{errors.email.message}</span>}
                </div>
            </div>

            {/* Conditional Fields */}
            {(isNeeded("VAT") || isNeeded("EORI") || isNeeded("BIN") || isNeeded("USCI")) && (
                <>
                    <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />
                    <div className="grid-2">
                        {isNeeded("VAT") && (
                            <div>
                                <label>N°VAT *</label>
                                <input 
                                    {...register("vat")} 
                                    onChange={handleUpper("vat")} 
                                    style={{ textTransform: 'uppercase' }} 
                                />
                                {errors.vat && <span className="error-msg">{errors.vat.message}</span>}
                            </div>
                        )}
                        {isNeeded("EORI") && (
                            <div>
                                <label>N°EORI *</label>
                                <input 
                                    {...register("eori")} 
                                    onChange={handleUpper("eori")} 
                                    style={{ textTransform: 'uppercase' }} 
                                />
                                {errors.eori && <span className="error-msg">{errors.eori.message}</span>}
                            </div>
                        )}
                    </div>
                    <div className="grid-2">
                        {isNeeded("BIN") && (
                            <div>
                                <label>BIN *</label>
                                <input 
                                    {...register("bin")} 
                                    onChange={handleUpper("bin")} 
                                    style={{ textTransform: 'uppercase' }} 
                                />
                                {errors.bin && <span className="error-msg">{errors.bin.message}</span>}
                            </div>
                        )}
                        {isNeeded("USCI") && (
                            <div>
                                <label>USCI *</label>
                                <input 
                                    {...register("usci")} 
                                    onChange={handleUpper("usci")} 
                                    style={{ textTransform: 'uppercase' }} 
                                />
                                {errors.usci && <span className="error-msg">{errors.usci.message}</span>}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export function ShipperForm({ title = "", isOpen, onClose, onSuccess, onDelete, initialData }: { title?: string, isOpen: boolean, onClose: () => void, onSuccess: (shipper: any) => void, onDelete?: (id: string) => void, initialData?: any }) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: initialData ? { ...defaultValues, ...initialData } : defaultValues,
    });

    React.useEffect(() => {
        if (isOpen) {
            reset(initialData ? { ...defaultValues, ...initialData } : defaultValues);
        }
    }, [isOpen, initialData, reset]);

    const handleFormSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const isEditing = !!initialData?.id;
            const res = await fetch(isEditing ? `/api/shippers/${initialData.id}` : "/api/shippers", {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, saveStatus: "VALIDATED" }),
            });

            if (res.ok) {
                const savedShipper = await res.json();
                onSuccess(savedShipper);
                onClose();
            } else {
                alert("Erreur lors de l'enregistrement.")
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveAsDraft = async () => {
        const data = watch();
        if (!data.name) {
            alert("Le nom est obligatoire même pour un brouillon.");
            return;
        }
        setIsSubmitting(true);
        try {
            const isEditing = !!initialData?.id;
            const res = await fetch(isEditing ? `/api/shippers/${initialData.id}` : "/api/shippers", {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, saveStatus: "DRAFT" }),
            });

            if (res.ok) {
                const savedShipper = await res.json();
                onSuccess(savedShipper);
                onClose();
            } else {
                alert("Erreur lors de l'enregistrement du brouillon.")
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id || !onDelete) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/shippers/${initialData.id}`, { method: "DELETE" });
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
            onSaveDraft={handleSaveAsDraft}
            onDelete={initialData && onDelete ? handleDelete : undefined}
            isSubmitting={isSubmitting}
            maxWidth="800px"
        >
            <ShipperFormBody register={register} errors={errors} watch={watch} setValue={setValue} />
        </ModalForm>
    );
}
