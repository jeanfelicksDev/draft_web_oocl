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
function ConsigneeFormBody({ register, errors, watch, setValue }: any) {
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '70vh', paddingRight: '10px', overflowY: 'auto' }}>
            <div>
                <label>Nom *</label>
                <input {...register("name")} />
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
                        label="CONSIGNEE TEST *"
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
                    <input {...register("phone")} type="tel" />
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
                    <h4 style={{ color: 'var(--text-muted)' }}>Informations spécifiques à la destination</h4>
                    <div className="grid-2">
                        {isNeeded("VAT") && (
                            <div>
                                <label>N°VAT *</label>
                                <input {...register("vat")} />
                                {errors.vat && <span className="error-msg">{errors.vat.message}</span>}
                            </div>
                        )}
                        {isNeeded("EORI") && (
                            <div>
                                <label>N°EORI *</label>
                                <input {...register("eori")} />
                                {errors.eori && <span className="error-msg">{errors.eori.message}</span>}
                            </div>
                        )}
                    </div>

                    <div className="grid-2">
                        {isNeeded("BIN") && (
                            <div>
                                <label>BIN *</label>
                                <input {...register("bin")} />
                                {errors.bin && <span className="error-msg">{errors.bin.message}</span>}
                            </div>
                        )}
                        {isNeeded("USCI") && (
                            <div>
                                <label>USCI *</label>
                                <input {...register("usci")} />
                                {errors.usci && <span className="error-msg">{errors.usci.message}</span>}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export function ConsigneeForm({ isOpen, onClose, onSuccess, onDelete, title = "Nouveau Consignee", endpoint, initialData }: { isOpen: boolean, onClose: () => void, onSuccess: (data: any) => void, onDelete?: (id: string) => void, title?: string, endpoint: string, initialData?: any }) {
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
            const submitEndpoint = isEditing ? `${endpoint}/${initialData.id}` : endpoint;

            const res = await fetch(submitEndpoint, {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                const newItem = await res.json();
                onSuccess(newItem);
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
            const submitEndpoint = `${endpoint}/${initialData.id}`;
            const res = await fetch(submitEndpoint, { method: "DELETE" });
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
            title={initialData ? `Modifier ${title.replace("Nouveau ", "")}` : title}
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleSubmit(handleFormSubmit)}
            onDelete={initialData && onDelete ? handleDelete : undefined}
            isSubmitting={isSubmitting}
        >
            <ConsigneeFormBody register={register} errors={errors} watch={watch} setValue={setValue} />
        </ModalForm>
    );
}
