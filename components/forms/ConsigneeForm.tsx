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
    name: yup.string().required("Name is required"),
    address: yup.string().required("Address is required"),
    country: yup.string().required("Country is required"),
    city: yup.string().required("City is required"),
    phone: yup.string().required("Phone is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    vat: yup.string().nullable().when(["country", "city"], {
        is: (country: string, city: string) => countryRequirements[country]?.includes("VAT") || cityRequirements[city]?.includes("VAT"),
        then: (s: any) => s.required("VAT No is required for this destination."),
        otherwise: (s: any) => s.nullable(),
    }),
    eori: yup.string().nullable().when(["country", "city"], {
        is: (country: string, city: string) => countryRequirements[country]?.includes("EORI") || cityRequirements[city]?.includes("EORI"),
        then: (s: any) => s.required("EORI No is required for this destination."),
        otherwise: (s: any) => s.nullable(),
    }),
    bin: yup.string().nullable().when(["country", "city"], {
        is: (country: string, city: string) => countryRequirements[country]?.includes("BIN") || cityRequirements[city]?.includes("BIN"),
        then: (s: any) => s.required("BIN is required for this destination."),
        otherwise: (s: any) => s.nullable(),
    }),
    usci: yup.string().nullable().when(["country", "city"], {
        is: (country: string, city: string) => countryRequirements[country]?.includes("USCI") || cityRequirements[city]?.includes("USCI"),
        then: (s: any) => s.required("USCI is required for this destination."),
        otherwise: (s: any) => s.nullable(),
    }),
    paymentPlace: yup.string().nullable().optional(),
    paymentCurrency: yup.string().nullable().optional(),
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
    paymentPlace: "",
    paymentCurrency: "",
};

// Sub-component for form body
function ConsigneeFormBody({ register, errors, watch, setValue, isFreightPayer }: any) {
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
    const handleUpper = (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const val = e.target.value.toUpperCase();
        setValue(fieldName, val);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <label>Name *</label>
                <input 
                    {...register("name")} 
                    onChange={handleUpper("name")} 
                    style={{ textTransform: 'uppercase' }} 
                />
                {errors.name && <span className="error-msg">{errors.name.message}</span>}
            </div>

            <div>
                <label>Address *</label>
                <textarea 
                    {...register("address")} 
                    rows={3} 
                    onChange={handleUpper("address")} 
                    style={{ textTransform: 'uppercase' }} 
                />
                {errors.address && <span className="error-msg">{errors.address.message}</span>}
            </div>

            <div className="grid-2">
                <div>
                    <SearchableDropdown
                        label="Country *"
                        options={MARITIME_COUNTRIES}
                        value={country}
                        onSelect={(val) => {
                            setValue("country", val);
                            setValue("city", "");
                        }}
                        placeholder="Select a country..."
                        error={errors.country?.message}
                    />
                </div>
                <div>
                    <SearchableDropdown
                        label="City *"
                        options={availablePorts}
                        value={city}
                        onSelect={(val) => setValue("city", val)}
                        placeholder={country ? "Select a city..." : "⬅ Select a country first"}
                        disabled={!country}
                        error={errors.city?.message}
                    />
                </div>
            </div>

            <div className="grid-2">
                <div>
                    <label>Phone *</label>
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
                    <input 
                        {...register("email")} 
                        type="email" 
                        onChange={handleUpper("email")} 
                        style={{ textTransform: 'uppercase' }} 
                    />
                    {errors.email && <span className="error-msg">{errors.email.message}</span>}
                </div>
            </div>

            {isFreightPayer && (
                <>
                    <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />
                    <h4 style={{ color: 'var(--text-muted)' }}>Payment Details</h4>
                    <div className="grid-2">
                        <div>
                            <label>Place of Payment</label>
                            <input 
                                {...register("paymentPlace")} 
                                placeholder="e.g. PARIS"
                                onChange={handleUpper("paymentPlace")} 
                                style={{ textTransform: 'uppercase' }} 
                            />
                            {errors.paymentPlace && <span className="error-msg">{errors.paymentPlace.message}</span>}
                        </div>
                        <div>
                            <label>Payment Currency</label>
                            <input 
                                {...register("paymentCurrency")} 
                                placeholder="e.g. EUR"
                                onChange={handleUpper("paymentCurrency")} 
                                style={{ textTransform: 'uppercase' }} 
                            />
                            {errors.paymentCurrency && <span className="error-msg">{errors.paymentCurrency.message}</span>}
                        </div>
                    </div>
                </>
            )}

            {/* Conditional Fields */}
            {(isNeeded("VAT") || isNeeded("EORI") || isNeeded("BIN") || isNeeded("USCI")) && (
                <>
                    <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />
                    <h4 style={{ color: 'var(--text-muted)' }}>Destination Specific Information</h4>
                    <div className="grid-2">
                        {isNeeded("VAT") && (
                            <div>
                                <label>VAT No *</label>
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
                                <label>EORI No *</label>
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

export function ConsigneeForm({ isOpen, onClose, onSuccess, onDelete, title = "New Consignee", endpoint, initialData }: { isOpen: boolean, onClose: () => void, onSuccess: (data: any) => void, onDelete?: (id: string) => void, title?: string, endpoint: string, initialData?: any }) {
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
                body: JSON.stringify({ ...data, saveStatus: "VALIDATED" }),
            });

            if (res.ok) {
                const newItem = await res.json();
                onSuccess(newItem);
                onClose();
            } else {
                alert("Error during save.")
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveAsDraft = async () => {
        const data = watch(); // or getValues()
        if (!data.name) {
            alert("Name is required even for a draft.");
            return;
        }
        setIsSubmitting(true);
        try {
            const isEditing = !!initialData?.id;
            const submitEndpoint = isEditing ? `${endpoint}/${initialData.id}` : endpoint;

            const res = await fetch(submitEndpoint, {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, saveStatus: "DRAFT" }),
            });

            if (res.ok) {
                const newItem = await res.json();
                onSuccess(newItem);
                onClose();
            } else {
                alert("Error during draft save.")
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
                alert("Error during deletion.");
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
            onSaveDraft={handleSaveAsDraft}
            onDelete={initialData && onDelete ? handleDelete : undefined}
            isSubmitting={isSubmitting}
            maxWidth="800px"
        >
            <ConsigneeFormBody 
                register={register} 
                errors={errors} 
                watch={watch} 
                setValue={setValue} 
                isFreightPayer={title === "Freight Payer" || endpoint.includes("freightbuyers")} 
            />
        </ModalForm>
    );
}
