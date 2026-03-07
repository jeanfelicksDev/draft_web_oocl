"use client";

import React, { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { LayoutDashboard, Ship, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";


import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { ModalForm } from "./ModalForm";
import { ShipperForm } from "./forms/ShipperForm";
import { ConsigneeForm } from "./forms/ConsigneeForm";
import { GoodsForm } from "./forms/GoodsForm";
import { Combobox } from "./Combobox";
import { ContainerTable } from "./ContainerTable";
import { generateBLPDF } from "@/lib/pdfGenerator";
import { LinkedPortSelector } from "./LinkedPortSelector";

// Basic schema for the string-only forms (Port, City, TypeReleased, etc.)
const basicSchema = yup.object().shape({
    name: yup.string().required("Requis"),
});

function SmallGenericForm({
    isOpen, onClose, title, endpoint, idField, entities, setEntities, initialData, entityName, isTextArea = false, fieldName = "name"
}: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const schema = yup.object().shape({
        [fieldName]: yup.string().required("Requis")
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: initialData || { [fieldName]: "" }
    });

    React.useEffect(() => {
        if (isOpen) reset(initialData || { [fieldName]: "" });
    }, [isOpen, initialData, reset, fieldName]);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const isEditing = !!initialData?.id;
            const res = await fetch(isEditing ? `${endpoint}/${initialData.id}` : endpoint, {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const saved = await res.json();
                if (isEditing) {
                    setEntities(entities.map((e: any) => e[idField] === saved[idField] ? saved : e));
                } else {
                    setEntities([...entities, saved]);
                }
                onClose();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const onDelete = async () => {
        if (!initialData?.id) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${endpoint}/${initialData.id}`, { method: "DELETE" });
            if (res.ok) {
                setEntities(entities.filter((e: any) => e[idField] !== initialData.id));
                onClose();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ModalForm
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            onSubmit={handleSubmit(onSubmit)}
            onDelete={initialData ? onDelete : undefined}
            isSubmitting={isSubmitting}
        >
            <div>
                <label>{entityName} *</label>
                {isTextArea ? (
                    <textarea rows={3} {...register(fieldName)} />
                ) : (
                    <input {...register(fieldName)} />
                )}
                {errors[fieldName] && <span className="error-msg">{(errors[fieldName] as any).message}</span>}
            </div>
        </ModalForm>
    );
}

export default function MainPage() {
    const { data: session } = useSession();
    const [containers, setContainers] = useState<any[]>([]);
    const [currentBlId, setCurrentBlId] = useState<string | null>(null);

    // States for dynamic data fetching
    const [shippers, setShippers] = useState<any[]>([]);
    const [consignees, setConsignees] = useState<any[]>([]);
    const [notifys, setNotifys] = useState<any[]>([]);
    const [alsoNotifys, setAlsoNotifys] = useState<any[]>([]);
    const [freightBuyers, setFreightBuyers] = useState<any[]>([]);
    const [forwarders, setForwarders] = useState<any[]>([]);
    const [goods, setGoods] = useState<any[]>([]);
    const [typesReleased, setTypesReleased] = useState<any[]>([]);
    const [billOfLadings, setBillOfLadings] = useState<any[]>([]);

    // Form State (React Hook Form)
    const { register, handleSubmit, setValue, getValues, watch, reset, formState: { errors } } = useForm({
        defaultValues: {
            bookingNumber: "",
            contractNumber: "",
            shipperId: "",
            consigneeId: "",
            notifyId: "",
            alsoNotifyId: "",
            forwarderId: "",
            freightBuyerId: "",
            goodsId: "",
            portCountryText: "",
            portCityText: "",
            typeReleasedId: "",
        }
    });
    // eslint-disable-next-line react-hooks/incompatible-library
    const values = watch();
    // Modal States
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [editingEntity, setEditingEntity] = useState<any>(null);

    const handleNewForm = () => {
        reset({
            bookingNumber: "",
            contractNumber: "",
            shipperId: "",
            consigneeId: "",
            notifyId: "",
            alsoNotifyId: "",
            forwarderId: "",
            freightBuyerId: "",
            goodsId: "",
            portCountryText: "",
            portCityText: "",
            typeReleasedId: "",
        });
        setContainers([]);
        setCurrentBlId(null);
    };

    const handleAddNew = (modalKey: string) => { setEditingEntity(null); setActiveModal(modalKey); };
    const handleEdit = (modalKey: string, list: any[], id: string) => { const item = list.find(x => x.id === id); if (item) { setEditingEntity(item); setActiveModal(modalKey); } };
    const handleSaveList = (setter: any, list: any[], field: any) => (item: any) => { const exists = list.find(x => x.id === item.id); setter(exists ? list.map(x => x.id === item.id ? item : x) : [...list, item]); setValue(field, item.id); setActiveModal(null); };
    const handleDeleteList = (setter: any, list: any[], field: any) => (id: string) => { setter(list.filter(x => x.id !== id)); if (getValues(field) === id) { setValue(field, ""); } setActiveModal(null); };
    const handleGenericSave = (endpoint: string, setter: any, list: any[], field: any) => async (data: any) => { const isEdit = !!editingEntity?.id; const url = isEdit ? `${endpoint}/${editingEntity.id}` : endpoint; const res = await fetch(url, { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); if (res.ok) { const item = await res.json(); const exists = list.find(x => x.id === item.id); setter(exists ? list.map(x => x.id === item.id ? item : x) : [...list, item]); setValue(field, item.id); setActiveModal(null); } };
    const handleGenericDelete = (endpoint: string, setter: any, list: any[], field: any) => async () => { if (!editingEntity?.id) return; const url = `${endpoint}/${editingEntity.id}`; const res = await fetch(url, { method: "DELETE" }); if (res.ok) { setter(list.filter(x => x.id !== editingEntity.id)); if (getValues(field) === editingEntity.id) { setValue(field, ""); } setActiveModal(null); } };

    // Helper: returns 'input-filled' css class if a watched value is non-empty
    const fc = (val: string | undefined | null) => (val && val.trim() !== "" ? "input-filled" : "");

    const handleSearchBooking = async (bookingNumArg?: string) => {
        const bookingNum = bookingNumArg || getValues("bookingNumber");
        if (!bookingNum) return;

        try {
            const res = await fetch(`/api/billoflading?bookingNumber=${bookingNum}`);
            if (res.ok) {
                const data = await res.json();
                // Map API keys to form field names
                setValue("bookingNumber", data.bookingNumber || "");
                setValue("contractNumber", data.contractNumber || "");
                setValue("typeReleasedId", data.typeReleasedId || "");
                setValue("portCountryText", data.portCountryText || "");
                setValue("portCityText", data.portCityText || "");
                setValue("shipperId", data.shipperId || "");
                setValue("consigneeId", data.consigneeId || "");
                setValue("notifyId", data.notifyId || "");
                setValue("alsoNotifyId", data.alsoNotifyId || "");
                setValue("forwarderId", data.forwarderId || "");
                setValue("freightBuyerId", data.freightBuyerId || "");
                setValue("goodsId", data.goodsId || "");

                if (data.containers) {
                    setContainers(data.containers);
                }
                setCurrentBlId(data.id);
                if (!bookingNumArg) toast.success("Données du booking chargées !");
            } else if (res.status === 404) {
                if (!bookingNumArg) toast.error("Booking Number non trouvé.");
            } else {
                if (!bookingNumArg) toast.error("Erreur lors de la recherche.");
            }
        } catch (error) {
            console.error("Search error:", error);
            if (!bookingNumArg) toast.error("Erreur de connexion.");
        }
    };

    // Initial Fetch Effect
    React.useEffect(() => {
        const fetchAll = async () => {
            const results = await Promise.all([
                fetch('/api/shippers').then(res => res.ok ? res.json() : []),
                fetch('/api/consignees').then(res => res.ok ? res.json() : []),
                fetch('/api/notify').then(res => res.ok ? res.json() : []),
                fetch('/api/alsonotify').then(res => res.ok ? res.json() : []),
                fetch('/api/freightbuyers').then(res => res.ok ? res.json() : []),
                fetch('/api/forwarders').then(res => res.ok ? res.json() : []),
                fetch('/api/goods').then(res => res.ok ? res.json() : []),
                fetch('/api/typereleased').then(res => res.ok ? res.json() : []),
            ]);

            const [
                shippersRes, consigneesRes, notifyRes, alsoNotifyRes,
                freightRes, forwardersRes, goodsRes, typesRes
            ] = results;

            if (Array.isArray(shippersRes)) setShippers(shippersRes);
            if (Array.isArray(consigneesRes)) setConsignees(consigneesRes);
            if (Array.isArray(notifyRes)) setNotifys(notifyRes);
            if (Array.isArray(alsoNotifyRes)) setAlsoNotifys(alsoNotifyRes);
            if (Array.isArray(freightRes)) setFreightBuyers(freightRes);
            if (Array.isArray(forwardersRes)) setForwarders(forwardersRes);
            if (Array.isArray(goodsRes)) setGoods(goodsRes);
            if (Array.isArray(typesRes)) setTypesReleased(typesRes);

            const blsRes = await fetch('/api/billoflading').then(res => res.ok ? res.json() : []);
            if (Array.isArray(blsRes)) setBillOfLadings(blsRes);
        };
        fetchAll();
    }, []);


    // Save as DRAFT (no containers required)
    const handleSaveDraft = async () => {
        const data = getValues();
        if (!data.bookingNumber || !/^[0-9]{10}$/.test(data.bookingNumber)) {
            toast.error("Le numéro de booking est requis (10 chiffres).");
            return;
        }
        try {
            const url = currentBlId ? `/api/billoflading/${currentBlId}` : "/api/billoflading";
            const res = await fetch(url, {
                method: currentBlId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, containers, saveStatus: "DRAFT" })
            });
            if (res.ok) {
                const saved = await res.json();
                if (!currentBlId) setCurrentBlId(saved.id);
                const blsRes = await fetch('/api/billoflading').then(r => r.json());
                setBillOfLadings(Array.isArray(blsRes) ? blsRes : []);
                toast.success("Brouillon sauvegardé ! Vous pouvez revenir le compléter.");
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || "Erreur lors de la sauvegarde.");
            }
        } catch {
            toast.error("Erreur de connexion.");
        }
    };

    // Delete a BL permanently
    const handleDeleteBL = async (blId: string, bookingNumber: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm(`Supprimer définitivement le BL #${bookingNumber} ?\nCette action est irréversible.`)) return;
        try {
            const res = await fetch(`/api/billoflading/${blId}`, { method: "DELETE" });
            if (res.ok) {
                // If deleting the currently-open BL, reset the form
                if (currentBlId === blId) handleNewForm();
                const blsRes = await fetch('/api/billoflading').then(r => r.json());
                setBillOfLadings(Array.isArray(blsRes) ? blsRes : []);
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || "Erreur lors de la suppression.");
            }
        } catch {
            toast.error("Erreur de connexion.");
        }
    };

    // Save VALIDATED (final) - requires containers
    const onSubmit = async (data: any) => {
        if (containers.length === 0) {
            toast.error("Veuillez ajouter au moins un conteneur.");
            return;
        }

        try {
            const url = currentBlId ? `/api/billoflading/${currentBlId}` : "/api/billoflading";
            const res = await fetch(url, {
                method: currentBlId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    containers,
                    saveStatus: "VALIDATED"
                })
            });

            if (res.ok) {
                toast.success("Bill of Lading enregistré avec succès !!");

                // Hydrate the data explicitly before passing it to the PDF generator
                const hydratedData = {
                    bookingNumber: data.bookingNumber,
                    contractNumber: data.contractNumber,
                    typeReleased: typesReleased.find(t => t.id === data.typeReleasedId)?.name || "",
                    portCountryText: data.portCountryText || "",
                    portCityText: data.portCityText || "",
                    shipper: shippers.find(s => s.id === data.shipperId) || {},
                    consignee: consignees.find(c => c.id === data.consigneeId) || {},
                    notify: notifys.find(n => n.id === data.notifyId) || {},
                    alsoNotify: alsoNotifys.find(a => a.id === data.alsoNotifyId) || {},
                    freightBuyer: freightBuyers.find(f => f.id === data.freightBuyerId) || {},
                    forwarder: forwarders.find(f => f.id === data.forwarderId) || {},
                    goods: goods.find(g => g.id === data.goodsId) || {},
                    containers
                };

                generateBLPDF(hydratedData);

                const blsRes = await fetch('/api/billoflading').then(res => res.json());
                setBillOfLadings(blsRes);
            } else {
                toast.error("Erreur lors de l'enregistrement.")
            }
        } catch (e) {
            toast.error("Erreur de connexion.");
        }
    };

    return (
        <div className="app-container">
            {/* Sidebar Navigation - Keeping it simple for UI structure */}
            <aside className="sidebar" style={{ width: '280px', backgroundColor: 'var(--sidebar-bg)', padding: '2rem 0', height: '100vh', position: 'sticky', top: 0, borderRight: '2px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '0 1rem', marginBottom: '2.5rem', textAlign: 'center' }}>
                    <img
                        src="/logo-oocl.png"
                        alt="OOCL Logo"
                        style={{ width: '100%', maxWidth: '220px', height: 'auto', objectFit: 'contain' }}
                    />
                </div>

                {/* Navigation indicators */}
                <div style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                        padding: '1rem 1.5rem',
                        borderRadius: '12px',
                        backgroundColor: 'var(--accent-teal)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1.5rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(230, 0, 18, 0.2)'
                    }}>
                        <Ship size={22} /> Créer une S.I
                    </div>

                    <Link href="/dashboard" passHref style={{ textDecoration: 'none' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            padding: '1rem 1.5rem',
                            borderRadius: '12px',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '1.5rem',
                            transition: 'all 0.2s'
                        }}>
                            <LayoutDashboard size={22} /> Tb de Bord
                        </div>
                    </Link>
                </div>

                <div style={{ padding: '2rem', borderTop: '2px solid var(--border-color)', marginTop: 'auto' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>Connecté en tant que :</p>
                        <p style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', wordBreak: 'break-all' }}>{session?.user?.email}</p>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="btn-outline"
                        style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem' }}
                    >
                        Se déconnecter
                    </button>
                </div>
            </aside>

            {/* Main Content Form */}
            <main className="main-content">
                <header className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>{currentBlId ? "Modification du spécimen" : "Création du spécimen"}</h1>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={handleSaveDraft}
                            className="btn-outline"
                            style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#d97706', color: '#d97706' }}
                        >
                            <Save size={15} /> Enregistrer brouillon
                        </button>
                        {currentBlId && (
                            <>
                                <button type="button" onClick={handleNewForm} className="btn-outline" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
                                    + Nouveau spécimen
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => handleDeleteBL(currentBlId, getValues('bookingNumber'), e)}
                                    className="btn-outline"
                                    title="Supprimer ce BL"
                                    style={{
                                        padding: '0.6rem 1rem',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        borderColor: 'var(--danger)',
                                        color: 'var(--danger)'
                                    }}
                                >
                                    <Trash2 size={15} /> Supprimer
                                </button>
                            </>
                        )}
                    </div>
                </header>

                <form onSubmit={handleSubmit(onSubmit)} className="form-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Header info */}
                    <section>
                        <div className="grid-2">
                            <div>
                                <label>Booking Number *</label>
                                <input
                                    {...register("bookingNumber", {
                                        required: "Ce champ est obligatoire",
                                        minLength: { value: 10, message: "Doit contenir exactement 10 chiffres" },
                                        maxLength: { value: 10, message: "Doit contenir exactement 10 chiffres" },
                                        pattern: { value: /^[0-9]{10}$/, message: "Doit contenir exactement 10 chiffres" }
                                    })}
                                    inputMode="numeric"
                                    maxLength={10}
                                    className={fc(values.bookingNumber)}
                                    onKeyDown={(e) => {
                                        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
                                        if (allowedKeys.includes(e.key)) return;
                                        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
                                        if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                                    }}
                                    onPaste={(e) => {
                                        const pasted = e.clipboardData.getData('text');
                                        if (!/^[0-9]+$/.test(pasted)) {
                                            e.preventDefault();
                                            const digitsOnly = pasted.replace(/[^0-9]/g, '').slice(0, 10);
                                            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                                            nativeInputValueSetter?.call(e.currentTarget, digitsOnly);
                                            e.currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
                                        }
                                    }}
                                />

                                {errors.bookingNumber && <span className="error-msg">{(errors.bookingNumber as any).message}</span>}
                            </div>
                            <div>
                                <label>Contract Number *</label>
                                <input
                                    {...register("contractNumber", {
                                        required: "Ce champ est obligatoire",
                                        maxLength: { value: 10, message: "Maximum 10 caractères autorisés" }
                                    })}
                                    maxLength={10}
                                    className={fc(values.contractNumber)}
                                />
                                {errors.contractNumber && <span className="error-msg">{(errors.contractNumber as any).message}</span>}
                            </div>
                        </div>

                        <div className="grid-2" style={{ marginTop: '1.5rem' }}>
                            <Combobox
                                label="Type Released *"
                                items={typesReleased}
                                displayKey="name"
                                valueKey="id"
                                value={values.typeReleasedId}
                                onChange={(val) => setValue("typeReleasedId", val)}
                                onAddNew={() => handleAddNew("TYPE_RELEASED")}
                                onEdit={() => handleEdit("TYPE_RELEASED", typesReleased, values.typeReleasedId)}
                            />
                        </div>

                        <div className="grid-2" style={{ marginTop: '1.5rem' }}>
                            <LinkedPortSelector
                                portCountryValue={values.portCountryText}
                                onPortCountryChange={(name) => setValue("portCountryText", name)}
                                portCityValue={values.portCityText}
                                onPortCityChange={(name) => setValue("portCityText", name)}
                            />
                        </div>
                    </section>

                    <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />

                    {/* Entities Subforms (Shipper, Consignee, Notify) */}
                    <section className="grid-2">
                        <Combobox
                            label="Shipper *"
                            items={shippers}
                            displayKey="name"
                            valueKey="id"
                            value={values.shipperId}
                            onChange={(val) => setValue("shipperId", val)}
                            onAddNew={() => handleAddNew("SHIPPER")}
                            onEdit={() => handleEdit("SHIPPER", shippers, values.shipperId)}
                        />

                        <Combobox
                            label="Consignee *"
                            items={consignees}
                            displayKey="name"
                            valueKey="id"
                            value={values.consigneeId}
                            onChange={(val) => setValue("consigneeId", val)}
                            onAddNew={() => handleAddNew("CONSIGNEE")}
                            onEdit={() => handleEdit("CONSIGNEE", consignees, values.consigneeId)}
                        />
                    </section>

                    <section className="grid-2">
                        <Combobox
                            label="Notify *"
                            items={notifys}
                            displayKey="name"
                            valueKey="id"
                            value={values.notifyId}
                            onChange={(val) => setValue("notifyId", val)}
                            onAddNew={() => handleAddNew("NOTIFY")}
                            onEdit={() => handleEdit("NOTIFY", notifys, values.notifyId)}
                        />

                        <Combobox
                            label="Also Notify *"
                            items={alsoNotifys}
                            displayKey="description"
                            valueKey="id"
                            value={values.alsoNotifyId}
                            onChange={(val) => setValue("alsoNotifyId", val)}
                            onAddNew={() => handleAddNew("ALSO_NOTIFY")}
                            onEdit={() => handleEdit("ALSO_NOTIFY", alsoNotifys, values.alsoNotifyId)}
                        />
                    </section>

                    <section className="grid-2">
                        <Combobox
                            label="Freight Buyer *"
                            items={freightBuyers}
                            displayKey="name"
                            valueKey="id"
                            value={values.freightBuyerId}
                            onChange={(val) => setValue("freightBuyerId", val)}
                            onAddNew={() => handleAddNew("FREIGHT_BUYER")}
                            onEdit={() => handleEdit("FREIGHT_BUYER", freightBuyers, values.freightBuyerId)}
                        />

                        <Combobox
                            label="Forwarder *"
                            items={forwarders}
                            displayKey="name"
                            valueKey="id"
                            value={values.forwarderId}
                            onChange={(val) => setValue("forwarderId", val)}
                            onAddNew={() => handleAddNew("FORWARDER")}
                            onEdit={() => handleEdit("FORWARDER", forwarders, values.forwarderId)}
                        />
                    </section>

                    <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />

                    {/* Goods */}
                    <section>
                        <Combobox
                            label="Description of Goods *"
                            items={goods}
                            displayKey="description"
                            valueKey="id"
                            value={values.goodsId}
                            onChange={(val) => setValue("goodsId", val)}
                            onAddNew={() => handleAddNew("GOODS")}
                            onEdit={() => handleEdit("GOODS", goods, values.goodsId)}
                        />
                    </section>

                    {/* Containers List Custom Component */}
                    <ContainerTable containers={containers} setContainers={setContainers} />


                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
                        <button
                            type="submit"
                            className="btn-primary"
                            style={{
                                padding: '0.8rem 2rem',
                                fontSize: '1.1rem',
                                width: '50%',
                                backgroundColor: '#58cc02',
                                borderColor: '#58cc02',
                                boxShadow: '0 4px 0 #58a700'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = '#46a302';
                                e.currentTarget.style.borderColor = '#46a302';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = '#58cc02';
                                e.currentTarget.style.borderColor = '#58cc02';
                            }}
                        >
                            💾 ENREGISTRER ET FINALISER LE BL
                        </button>
                    </div>

                </form>
            </main>

            {/* --- ALL MODALS FOR DYNAMIC ENTITY CREATION --- */}

            <ShipperForm
                isOpen={activeModal === "SHIPPER"}
                onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setShippers, shippers, "shipperId")}
                onDelete={handleDeleteList(setShippers, shippers, "shipperId")}
            />

            <ConsigneeForm
                title="Consignee"
                endpoint="/api/consignees"
                isOpen={activeModal === "CONSIGNEE"}
                onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setConsignees, consignees, "consigneeId")}
                onDelete={handleDeleteList(setConsignees, consignees, "consigneeId")}
            />

            <ConsigneeForm
                title="Notify"
                endpoint="/api/notify"
                isOpen={activeModal === "NOTIFY"}
                onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setNotifys, notifys, "notifyId")}
                onDelete={handleDeleteList(setNotifys, notifys, "notifyId")}
            />

            <ConsigneeForm
                title="Freight Buyer"
                endpoint="/api/freightbuyers"
                isOpen={activeModal === "FREIGHT_BUYER"}
                onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setFreightBuyers, freightBuyers, "freightBuyerId")}
                onDelete={handleDeleteList(setFreightBuyers, freightBuyers, "freightBuyerId")}
            />

            <ConsigneeForm
                title="Forwarder"
                endpoint="/api/forwarders"
                isOpen={activeModal === "FORWARDER"}
                onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setForwarders, forwarders, "forwarderId")}
                onDelete={handleDeleteList(setForwarders, forwarders, "forwarderId")}
            />

            <GoodsForm
                isOpen={activeModal === "GOODS"}
                onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setGoods, goods, "goodsId")}
                onDelete={handleDeleteList(setGoods, goods, "goodsId")}
            />


            <SmallGenericForm
                title={editingEntity ? "Modifier Type Released" : "Ajouter Type Released (MBL/HBL..)"}
                isOpen={activeModal === "TYPE_RELEASED"}
                onClose={() => setActiveModal(null)}
                endpoint="/api/typereleased"
                entityName="Type Released"
                idField="typeReleasedId"
                entities={typesReleased}
                setEntities={setTypesReleased}
                initialData={editingEntity}
            />


            <SmallGenericForm
                title={editingEntity ? "Modifier Also Notify" : "Ajouter Also Notify"}
                isOpen={activeModal === "ALSO_NOTIFY"}
                onClose={() => setActiveModal(null)}
                endpoint="/api/alsonotify"
                entityName="Description (Also Notify)"
                idField="alsoNotifyId"
                entities={alsoNotifys}
                setEntities={setAlsoNotifys}
                initialData={editingEntity}
                isTextArea={true}
                fieldName="description"
            />

            {/* Right Sidebar - Latest Bookings */}
            <aside className="booking-sidebar">
                <h3>Derniers Bookings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {billOfLadings.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '1rem' }}>Aucun booking.</p>
                    ) : (
                        billOfLadings.map((bl) => {
                            const isDraft = bl.saveStatus === "DRAFT";
                            return (
                                <div
                                    key={bl.id}
                                    className={`booking-card ${currentBlId === bl.id ? 'active' : ''} ${isDraft ? 'draft' : ''}`}
                                    onClick={() => handleSearchBooking(bl.bookingNumber)}
                                >
                                    <span className="booking-card-num">#{bl.bookingNumber}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                                        {isDraft ? (
                                            <span className="badge-draft">⏳ À terminer</span>
                                        ) : (
                                            <span className="badge-validated">✓ Terminé</span>
                                        )}
                                        <button
                                            type="button"
                                            title="Supprimer ce BL"
                                            onClick={(e) => handleDeleteBL(bl.id, bl.bookingNumber, e)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--danger)',
                                                cursor: 'pointer',
                                                padding: '0.2rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                borderRadius: '6px',
                                                transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,75,75,0.1)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </aside>

        </div>
    );
}
