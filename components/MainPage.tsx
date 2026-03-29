"use client";

import React, { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import {
    LayoutDashboard,
    Ship,
    Save,
    Trash2,
    PlusCircle,
    FileText,
    LogOut,
    User,
    ChevronRight,
    Search,
    ShieldAlert,
    ShieldCheck,
    BookOpen,
    Eye
} from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAuth } from "./AuthProvider";
import { ModalForm } from "./ModalForm";
import { Sidebar } from "./Sidebar";
import { ShipperForm } from "./forms/ShipperForm";
import { ConsigneeForm } from "./forms/ConsigneeForm";
import { GoodsForm } from "./forms/GoodsForm";
import { HSCodeForm } from "./forms/HSCodeForm";
import { SmallGenericForm } from "./forms/SmallGenericForm";
import { AlsoNotifyForm } from "./forms/AlsoNotifyForm";
import { Combobox } from "./Combobox";
import { ContainerTable } from "./ContainerTable";
import { generateBLPDF } from "@/lib/pdfGenerator";
import { LinkedPortSelector } from "./LinkedPortSelector";

/* ════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════ */
const blSchema = yup.object().shape({
    bookingNumber: yup.string().required("Booking Number requis"),
    contractNumber: yup.string().required("Contract Number requis"),
    typeReleasedId: yup.string().required("Type Released requis"),
    portCountryText: yup.string().required("Pays requis"),
    portCityText: yup.string().required("Ville requise"),
    shipperId: yup.string().required("Shipper requis"),
    consigneeId: yup.string().required("Consignee requis"),
    notifyId: yup.string().required("Notify requis"),
    alsoNotifyId: yup.string().nullable(),
    forwarderId: yup.string().required("Forwarder requis"),
    freightBuyerId: yup.string().required("Freight Buyer requis"),
    goodsId: yup.string().required("Nature des marchandises requise"),
    vesselId: yup.string().required("Navire requis"),
    voyageId: yup.string().required("Voyage requis"),
});

export default function MainPage() {
    const { user, hasPermission } = useAuth();
    const canWrite = hasPermission("BL_WRITE");
    const canDelete = hasPermission("BL_DELETE");
    const canManageUsers = hasPermission("ADMIN_ACCESS");
    const canEditRefTables = hasPermission("BL_WRITE"); // Les clients peuvent aussi gérer leurs partenaires

    const [containers, setContainers] = useState<any[]>([]);
    const [currentBlId, setCurrentBlId] = useState<string | null>(null);

    const [shippers, setShippers]         = useState<any[]>([]);
    const [consignees, setConsignees]     = useState<any[]>([]);
    const [notifys, setNotifys]           = useState<any[]>([]);
    const [alsoNotifys, setAlsoNotifys]   = useState<any[]>([]);
    const [freightBuyers, setFreightBuyers] = useState<any[]>([]);
    const [forwarders, setForwarders]     = useState<any[]>([]);
    const [goods, setGoods]               = useState<any[]>([]);
    const [hscodes, setHscodes]           = useState<any[]>([]);
    const [isHSCodeModalOpen, setIsHSCodeModalOpen] = useState(false);
    const [typesReleased, setTypesReleased] = useState<any[]>([]);
    const [typesTc, setTypesTc]             = useState<any[]>([]);
    const [packageTypes, setPackageTypes]   = useState<any[]>([]);
    const [billOfLadings, setBillOfLadings] = useState<any[]>([]);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [vessels, setVessels]           = useState<any[]>([]);
    const [filteredVoyages, setFilteredVoyages] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [newPass, setNewPass] = useState("");
    const bookingRef = useRef<HTMLInputElement>(null);


    const { register, handleSubmit, setValue, getValues, watch, reset, formState: { errors } } = useForm({
        resolver: yupResolver(blSchema),
        defaultValues: {
            bookingNumber: "", contractNumber: "",
            shipperId: "", consigneeId: "", notifyId: "", alsoNotifyId: "",
            forwarderId: "", freightBuyerId: "", 
            goodsId: "",
            portCountryText: "", portCityText: "", typeReleasedId: "",
            vesselId: "", voyageId: "",
        }
    });

    const values = watch();

    useEffect(() => {
        if ((user as any)?.mustChangePassword) {
            setShowChangePasswordModal(true);
        }
    }, [user]);

    const handlePasswordChange = async () => {
        if (newPass.length < 6) return toast.error("6 caractères min.");
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword: newPass }),
            });
            if (res.ok) {
                toast.success("Mot de passe mis à jour !");
                setShowChangePasswordModal(false);
                signOut({ callbackUrl: "/login" });
            } else {
                const d = await res.json();
                toast.error(d.error || "Erreur");
            }
        } catch (e) { toast.error("Erreur de connexion"); }
    };
    const [activeModal, setActiveModal]   = useState<string | null>(null);
    const [editingEntity, setEditingEntity] = useState<any>(null);

    const emptyForm = {
        bookingNumber: "", contractNumber: "",
        shipperId: "", consigneeId: "", notifyId: "", alsoNotifyId: "",
        goodsId: "",
        portCountryText: "", portCityText: "", typeReleasedId: "",
        vesselId: "", voyageId: "",
    };

    const handleNewForm = () => {
        reset(emptyForm);
        setContainers([]);
        setCurrentBlId(null);
        setTimeout(() => bookingRef.current?.focus(), 0);
    };

    const handleAddNew  = (key: string) => { setEditingEntity(null); setActiveModal(key); };
    const handleEdit    = (key: string, list: any[], id: string) => {
        const item = list.find(x => x.id === id);
        if (item) { setEditingEntity(item); setActiveModal(key); }
    };
    const handleSaveList = (setter: any, list: any[], field: any) => (item: any) => {
        const exists = list.find(x => x.id === item.id);
        setter(exists ? list.map(x => x.id === item.id ? item : x) : [...list, item]);
        setValue(field, item.id);
        setActiveModal(null);
    };
    const handleDeleteList = (setter: any, list: any[], field: any) => (id: string) => {
        setter(list.filter(x => x.id !== id));
        if (getValues(field) === id) setValue(field, "");
        setActiveModal(null);
    };

    const fc = (val: string | undefined | null) => (val && val.trim() !== "" ? "input-filled" : "");

    /* ─── Search booking by number ─── */
    const handleSearchBooking = async (bookingNumArg?: string) => {
        const bookingNum = bookingNumArg || getValues("bookingNumber");
        if (!bookingNum) return;
        try {
            const res = await fetch(`/api/billoflading?bookingNumber=${bookingNum}`);
            if (res.ok) {
                const data = await res.json();
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
                setValue("vesselId", data.vesselId || "");
                setValue("voyageId", data.voyageId || "");

                if (data.containers) setContainers(data.containers);
                setCurrentBlId(data.id);

                if (!bookingNumArg) toast.success("Données du booking chargées !");
            } else if (res.status === 404) {
                if (!bookingNumArg) toast.error("Booking Number non trouvé.");
            } else {
                if (!bookingNumArg) toast.error("Erreur lors de la recherche.");
            }
        } catch { if (!bookingNumArg) toast.error("Erreur de connexion."); }
    };

    /* ─── Initial fetch ─── */
    React.useEffect(() => {
        const fetchAll = async () => {
            const [s, c, n, a, f, fw, g, t, hs, ttc, pt, bls, vss] = await Promise.all([
                fetch('/api/shippers').then(r => r.ok ? r.json() : []),
                fetch('/api/consignees').then(r => r.ok ? r.json() : []),
                fetch('/api/notify').then(r => r.ok ? r.json() : []),
                fetch('/api/alsonotify').then(r => r.ok ? r.json() : []),
                fetch('/api/freightbuyers').then(r => r.ok ? r.json() : []),
                fetch('/api/forwarders').then(r => r.ok ? r.json() : []),
                fetch('/api/goods').then(r => r.ok ? r.json() : []),
                fetch('/api/typereleased').then(r => r.ok ? r.json() : []),
                fetch('/api/hscodes').then(r => r.ok ? r.json() : []),
                fetch('/api/typetc').then(r => r.ok ? r.json() : []),
                fetch('/api/packagetypes').then(r => r.ok ? r.json() : []),
                fetch('/api/billoflading').then(r => r.ok ? r.json() : []),
                fetch('/api/vessels').then(r => r.ok ? r.json() : []),
            ]);
            if (Array.isArray(s))   setShippers(s);
            if (Array.isArray(c))   setConsignees(c);
            if (Array.isArray(n))   setNotifys(n);
            if (Array.isArray(a))   setAlsoNotifys(a);
            if (Array.isArray(f))   setFreightBuyers(f);
            if (Array.isArray(fw))  setForwarders(fw);
            if (Array.isArray(g))   setGoods(g);
            if (Array.isArray(t))   setTypesReleased(t);
            if (Array.isArray(hs))  setHscodes(hs);
            if (Array.isArray(ttc)) setTypesTc(ttc);
            if (Array.isArray(pt))  setPackageTypes(pt);
            if (Array.isArray(bls)) setBillOfLadings(bls);
            if (Array.isArray(vss)) setVessels(vss);
        };
        fetchAll();
    }, []);

    useEffect(() => {
        if (values.vesselId) {
            fetch(`/api/voyages?vesselId=${values.vesselId}`)
                .then(r => r.ok ? r.json() : [])
                .then(data => setFilteredVoyages(Array.isArray(data) ? data : []));
        } else {
            setFilteredVoyages([]);
        }
    }, [values.vesselId]);

    /* ─── Save Draft ─── */
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
                const bls = await fetch('/api/billoflading').then(r => r.json());
                setBillOfLadings(Array.isArray(bls) ? bls : []);
                toast.success("Brouillon sauvegardé !");
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(`${err.error || "Erreur"} ${err.details ? ": " + err.details : ""}`);
            }
        } catch { toast.error("Erreur de connexion."); }
    };

    /* ─── Delete BL ─── */
    const handleDeleteBL = async (blId: string, bookingNumber: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm(`Supprimer définitivement le BL #${bookingNumber} ?\nCette action est irréversible.`)) return;
        try {
            const res = await fetch(`/api/billoflading/${blId}`, { method: "DELETE" });
            if (res.ok) {
                if (currentBlId === blId) handleNewForm();
                const bls = await fetch('/api/billoflading').then(r => r.json());
                setBillOfLadings(Array.isArray(bls) ? bls : []);
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || "Erreur lors de la suppression.");
            }
        } catch { toast.error("Erreur de connexion."); }
    };

    /* ─── Save Validated ─── */
    const onSubmit = async (data: any) => {
        // 1. Check if containers are present
        if (containers.length === 0) {
            toast.error("Veuillez ajouter au moins un conteneur.");
            return;
        }

        // 2. Check each partner status and missing fields
        const partnersToCheck = [
            { id: data.shipperId, list: shippers, label: "Expéditeur (Shipper)" },
            { id: data.consigneeId, list: consignees, label: "Destinataire (Consignee)" },
            { id: data.notifyId, list: notifys, label: "Notify Party" },
            { id: data.forwarderId, list: forwarders, label: "Forwarder" },
            { id: data.freightBuyerId, list: freightBuyers, label: "Freight Buyer" },
            { id: data.alsoNotifyId, list: alsoNotifys, label: "Also Notify Party" }
        ];

        const draftsErrors: string[] = [];

        // Better way to check missing fields with constants
        const { countryRequirements, cityRequirements } = await import("@/lib/constants");
        
        for (const p of partnersToCheck) {
            const partner = p.list.find(x => x.id === p.id);
            if (partner && partner.saveStatus === "DRAFT") {
                const missing: string[] = [];
                
                if (p.label === "Also Notify Party") {
                    if (!partner.name) missing.push("Nom");
                    if (!partner.description) missing.push("Adresse/Description");
                } else {
                    if (!partner.name) missing.push("Nom");
                    if (!partner.address) missing.push("Adresse");
                    if (!partner.country) missing.push("Pays");
                    if (!partner.city) missing.push("Ville");
                    if (!partner.phone) missing.push("Téléphone");
                    if (!partner.email) missing.push("Email");
                }

                const reqs = [
                    ...(countryRequirements[partner.country] || []),
                    ...(cityRequirements[partner.city] || [])
                ];

                if (reqs.includes("VAT") && !partner.vat) missing.push("N° VAT");
                if (reqs.includes("EORI") && !partner.eori) missing.push("N° EORI");
                if (reqs.includes("BIN") && !partner.bin) missing.push("N° BIN");
                if (reqs.includes("USCI") && !partner.usci) missing.push("N° USCI");

                if (missing.length > 0) {
                    draftsErrors.push(`${p.label} : Champs manquants (${missing.join(", ")})`);
                } else {
                    // Tous les champs sont là, mais c'est un brouillon
                    draftsErrors.push(`${p.label} : Doit être validé officiellement (Tous les champs sont renseignés)`);
                }
            }
        }

        if (draftsErrors.length > 0) {
            toast((t) => (
                <div style={{ textAlign: "left", position: "relative", paddingRight: "1.5rem" }}>
                    <button 
                        onClick={() => toast.dismiss(t.id)}
                        style={{
                            position: "absolute",
                            top: "-10px",
                            right: "-10px",
                            background: "white",
                            border: "1px solid #ddd",
                            borderRadius: "50%",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            cursor: "pointer",
                            color: "#666",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                            zIndex: 1
                        }}
                        title="Fermer"
                    >
                        &times;
                    </button>
                    <p style={{ fontWeight: 800, color: "var(--danger)", marginBottom: "0.5rem", fontSize: "1rem" }}>
                        Impossible de finaliser : Certains partenaires sont encore en Brouillon.
                    </p>
                    <ul style={{ fontSize: "0.9rem", paddingLeft: "1.2rem", color: "#333" }}>
                        {draftsErrors.map((err, i) => <li key={i} style={{ marginBottom: "0.25rem" }}>{err}</li>)}
                    </ul>
                    <p style={{ fontSize: "0.8rem", marginTop: "0.75rem", fontStyle: "italic", color: "#666", borderTop: "1px solid #eee", paddingTop: "0.5rem" }}>
                        Veuillez modifier ces partenaires pour compléter les informations manquantes.
                    </p>
                </div>
            ), { duration: 15000, position: "top-center", style: { maxWidth: "600px", padding: "1rem" } });
            return;
        }

        setIsGeneratingPDF(true);
        try {
            const url = currentBlId ? `/api/billoflading/${currentBlId}` : "/api/billoflading";
            const res = await fetch(url, {
                method: currentBlId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, containers, saveStatus: "VALIDATED" })
            });
            if (res.ok) {
                toast.success("Bill of Lading enregistré avec succès !");

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
                    vessel: vessels.find(v => v.id === data.vesselId)?.name || "",
                    voyage: filteredVoyages.find(v => v.id === data.voyageId)?.number || "",
                    etd: filteredVoyages.find(v => v.id === data.voyageId)?.etdDate || "",
                    containers,
                };
                generateBLPDF(hydratedData, false);
                const bls = await fetch('/api/billoflading').then(r => r.ok ? r.json() : []);
                setBillOfLadings(bls);
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(`${err.error || "Erreur"} ${err.details ? ": " + err.details : ""}`);
            }
        } catch { 
            toast.error("Erreur de connexion."); 
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    /* ════════════════════════════════════════════
       RENDER
       ════════════════════════════════════════════ */
    return (
        <div className="app-container">

            <Sidebar 
                onNewForm={handleNewForm} 
                onAddTypeTc={() => handleAddNew("TYPE_TC")}
                onAddPackageType={() => handleAddNew("PACKAGE_TYPE")}
            />

            {/* ──────────── MAIN CONTENT ──────────── */}
            <main className="main-content">
                <div className="main-content-inner">
                    <header className="content-header">
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                <FileText size={14} style={{ color: "var(--text-muted)" }} />
                                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Shipping Instructions
                                </span>
                            </div>
                            <h1>{currentBlId ? "Modification du spécimen" : "Nouveau spécimen"}</h1>
                        </div>

                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>

                            {canWrite && (
                                <button
                                    type="button"
                                    onClick={handleSaveDraft}
                                    className="btn-outline"
                                    style={{ borderColor: "#d97706", color: "#d97706" }}
                                >
                                    <Save size={14} />
                                    Brouillon
                                </button>
                            )}

                            {currentBlId && (
                                <>
                                    {canWrite && (
                                        <button type="button" onClick={handleNewForm} className="btn-outline">
                                            <PlusCircle size={14} />
                                            Nouveau
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteBL(currentBlId, getValues("bookingNumber"), e)}
                                            className="btn-outline"
                                            style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
                                        >
                                            <Trash2 size={14} />
                                            Supprimer
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </header>

                    {/* ─── FORM CARD ─── */}
                    <form onSubmit={handleSubmit(onSubmit)} className="form-container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

                        {/* ── Section : Infos générales ── */}
                        <section>
                            <p className="form-section-title">
                                <BookOpen size={12} />
                                Informations générales
                            </p>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
                                <div>
                                    <label>Booking Number *</label>
                                    <input
                                        {...register("bookingNumber")}
                                        ref={(e) => {
                                            register("bookingNumber").ref(e);
                                            (bookingRef as any).current = e;
                                        }}
                                        inputMode="numeric"
                                        maxLength={10}
                                        placeholder="ex: 1234567890"
                                        className={fc(values.bookingNumber)}
                                        disabled={!canWrite}
                                        onKeyDown={(e) => {
                                            const ok = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
                                            if (ok.includes(e.key)) return;
                                            if ((e.ctrlKey || e.metaKey) && ['a','c','v','x'].includes(e.key.toLowerCase())) return;
                                            if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                                        }}
                                        onPaste={(e) => {
                                            const pasted = e.clipboardData.getData('text');
                                            if (!/^[0-9]+$/.test(pasted)) {
                                                e.preventDefault();
                                                const digits = pasted.replace(/[^0-9]/g, '').slice(0, 10);
                                                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                                                setter?.call(e.currentTarget, digits);
                                                e.currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
                                            }
                                        }}
                                    />
                                    {errors.bookingNumber && <span className="error-msg">{(errors.bookingNumber as any).message}</span>}
                                </div>

                                <Combobox
                                    label="Type Released *"
                                    items={typesReleased}
                                    displayKey="name"
                                    valueKey="id"
                                    value={values.typeReleasedId}
                                    onChange={(val) => setValue("typeReleasedId", val)}
                                    error={errors.typeReleasedId?.message as string}
                                    disabled={!canWrite}
                                />

                                <div>
                                    <label>Contract Number *</label>
                                    <input
                                        {...register("contractNumber")}
                                        maxLength={10}
                                        placeholder="ex: CNTR1234"
                                        className={fc(values.contractNumber)}
                                        disabled={!canWrite}
                                    />
                                    {errors.contractNumber && <span className="error-msg">{(errors.contractNumber as any).message}</span>}
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "4fr 2fr 1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
                                <Combobox
                                    label="Navire *"
                                    items={vessels}
                                    displayKey="name"
                                    valueKey="id"
                                    value={values.vesselId}
                                    onChange={(val) => {
                                        setValue("vesselId", val);
                                        setValue("voyageId", ""); // Reset voyage
                                    }}
                                    error={errors.vesselId?.message as string}
                                    disabled={!canWrite}
                                />
                                <Combobox
                                    label="Voyage *"
                                    items={filteredVoyages}
                                    displayKey="number"
                                    valueKey="id"
                                    value={values.voyageId}
                                    onChange={(val) => setValue("voyageId", val)}
                                    error={errors.voyageId?.message as string}
                                    disabled={!canWrite || !values.vesselId}
                                />
                                <div style={{ width: '100%', marginBottom: '1rem' }}>
                                    <label style={{ marginBottom: '0.45rem', fontSize: '0.85rem', fontWeight: 700, visibility: 'hidden', display: 'flex' }}>
                                        <span>&nbsp;</span>
                                    </label>
                                    <div style={{ background: "#f8fafc", padding: "0.4rem 0.8rem", borderRadius: "12px", border: "2px solid #e2e8f0", height: "46px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                        <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", margin: 0 }}>ETA Port</p>
                                        <p style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--primary)", margin: "0.2rem 0 0 0" }}>
                                            {filteredVoyages.find(v => v.id === values.voyageId)?.etaDate ? new Date(filteredVoyages.find(v => v.id === values.voyageId).etaDate).toLocaleDateString() : "—"}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ width: '100%', marginBottom: '1rem' }}>
                                    <label style={{ marginBottom: '0.45rem', fontSize: '0.85rem', fontWeight: 700, visibility: 'hidden', display: 'flex' }}>
                                        <span>&nbsp;</span>
                                    </label>
                                    <div style={{ background: "#f8fafc", padding: "0.4rem 0.8rem", borderRadius: "12px", border: "2px solid #e2e8f0", height: "46px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                        <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", margin: 0 }}>ETD Navire</p>
                                        <p style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--primary)", margin: "0.2rem 0 0 0" }}>
                                            {filteredVoyages.find(v => v.id === values.voyageId)?.etdDate ? new Date(filteredVoyages.find(v => v.id === values.voyageId).etdDate).toLocaleDateString() : "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid-2" style={{ marginTop: "1.5rem" }}>
                                <LinkedPortSelector
                                    portCountryValue={values.portCountryText}
                                    onPortCountryChange={(name) => setValue("portCountryText", name)}
                                    portCityValue={values.portCityText}
                                    onPortCityChange={(name) => setValue("portCityText", name)}
                                    portCountryError={errors.portCountryText?.message as string}
                                    portCityError={errors.portCityText?.message as string}
                                    disabled={!canWrite}
                                />
                            </div>
                        </section>



                        {/* ── Section : Parties ── */}
                        <section>
                            <p className="form-section-title">
                                <User size={12} />
                                Parties impliquées
                            </p>

                            <div className="grid-2">
                                <Combobox label="Shipper *" items={shippers} displayKey="name" valueKey="id"
                                    value={values.shipperId} onChange={(val) => setValue("shipperId", val)}
                                    onAddNew={canEditRefTables ? () => handleAddNew("SHIPPER") : undefined}
                                    onEdit={canEditRefTables ? () => handleEdit("SHIPPER", shippers, values.shipperId) : undefined}
                                    error={errors.shipperId?.message as string}
                                    isDraft={shippers.find(s => s.id === values.shipperId)?.saveStatus === "DRAFT"}
                                    disabled={!canWrite} />

                                <Combobox label="Consignee *" items={consignees} displayKey="name" valueKey="id"
                                    value={values.consigneeId} onChange={(val) => setValue("consigneeId", val)}
                                    onAddNew={canEditRefTables ? () => handleAddNew("CONSIGNEE") : undefined}
                                    onEdit={canEditRefTables ? () => handleEdit("CONSIGNEE", consignees, values.consigneeId) : undefined}
                                    error={errors.consigneeId?.message as string}
                                    isDraft={consignees.find(c => c.id === values.consigneeId)?.saveStatus === "DRAFT"}
                                    disabled={!canWrite} />
                            </div>

                            <div className="grid-2" style={{ marginTop: "1.5rem" }}>
                                <Combobox label="Notify *" items={notifys} displayKey="name" valueKey="id"
                                    value={values.notifyId} onChange={(val) => setValue("notifyId", val)}
                                    onAddNew={canEditRefTables ? () => handleAddNew("NOTIFY") : undefined}
                                    onEdit={canEditRefTables ? () => handleEdit("NOTIFY", notifys, values.notifyId) : undefined}
                                    error={errors.notifyId?.message as string}
                                    isDraft={notifys.find(n => n.id === values.notifyId)?.saveStatus === "DRAFT"}
                                    disabled={!canWrite} />

                                <Combobox label="Also Notify" items={alsoNotifys} displayKey="name" valueKey="id"
                                    value={values.alsoNotifyId || ""} onChange={(val) => setValue("alsoNotifyId", val)}
                                    onAddNew={canEditRefTables ? () => handleAddNew("ALSO_NOTIFY") : undefined}
                                    onEdit={canEditRefTables ? () => handleEdit("ALSO_NOTIFY", alsoNotifys, values.alsoNotifyId || "") : undefined}
                                    error={errors.alsoNotifyId?.message as string}
                                    isDraft={alsoNotifys.find(a => a.id === values.alsoNotifyId)?.saveStatus === "DRAFT"}
                                    disabled={!canWrite} />
                            </div>

                            <div className="grid-2" style={{ marginTop: "1.5rem" }}>
                                <Combobox label="Freight Buyer *" items={freightBuyers} displayKey="name" valueKey="id"
                                    value={values.freightBuyerId} onChange={(val) => setValue("freightBuyerId", val)}
                                    onAddNew={canEditRefTables ? () => handleAddNew("FREIGHT_BUYER") : undefined}
                                    onEdit={canEditRefTables ? () => handleEdit("FREIGHT_BUYER", freightBuyers, values.freightBuyerId) : undefined}
                                    error={errors.freightBuyerId?.message as string}
                                    isDraft={freightBuyers.find(f => f.id === values.freightBuyerId)?.saveStatus === "DRAFT"}
                                    disabled={!canWrite} />

                                <Combobox label="Forwarder *" items={forwarders} displayKey="name" valueKey="id"
                                    value={values.forwarderId} onChange={(val) => setValue("forwarderId", val)}
                                    onAddNew={canEditRefTables ? () => handleAddNew("FORWARDER") : undefined}
                                    onEdit={canEditRefTables ? () => handleEdit("FORWARDER", forwarders, values.forwarderId) : undefined}
                                    error={errors.forwarderId?.message as string}
                                    isDraft={forwarders.find(f => f.id === values.forwarderId)?.saveStatus === "DRAFT"}
                                    disabled={!canWrite} />
                            </div>
                        </section>



                        {/* ── Section : Marchandises ── */}
                        <section>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                                <Ship size={14} style={{ color: "var(--primary)" }} />
                                <p className="form-section-title" style={{ margin: 0 }}>Description des marchandises</p>
                            </div>
                            
                            <Combobox label="Nature des marchandises *" items={goods} displayKey="description" valueKey="id"
                                value={values.goodsId} onChange={(val) => setValue("goodsId", val)}
                                onAddNew={canEditRefTables ? () => handleAddNew("GOODS") : undefined}
                                onEdit={canEditRefTables ? () => handleEdit("GOODS", goods, values.goodsId) : undefined}
                                error={errors.goodsId?.message as string}
                                isDraft={goods.find(g => g.id === values.goodsId)?.saveStatus === "DRAFT"}
                                disabled={!canWrite}
                                multiline={true} />
                        </section>

                        {/* ── Conteneurs ── */}
                        <ContainerTable 
                            containers={containers} 
                            setContainers={setContainers} 
                            typesTc={typesTc}
                            packageTypes={packageTypes}
                            disabled={!canWrite}
                        />

                        {/* ── Bouton FINALISER ── */}
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", paddingTop: "0.5rem" }}>
                            <button type="submit" className="btn-finalize" disabled={isGeneratingPDF || !canWrite}>
                                {isGeneratingPDF ? (
                                    <>
                                        <div className="spinner" style={{ marginRight: "0.5rem" }}></div>
                                        Génération du PDF...
                                    </>
                                ) : (
                                    "✨ Enregistrer et finaliser le B/L"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* ──────────── MODALS ──────────── */}
            <ShipperForm
                title="Shipper"
                isOpen={activeModal === "SHIPPER"} onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setShippers, shippers, "shipperId")}
                onDelete={handleDeleteList(setShippers, shippers, "shipperId")} />

            <ConsigneeForm title="Consignee" endpoint="/api/consignees"
                isOpen={activeModal === "CONSIGNEE"} onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setConsignees, consignees, "consigneeId")}
                onDelete={handleDeleteList(setConsignees, consignees, "consigneeId")} />

            <ConsigneeForm title="Notify" endpoint="/api/notify"
                isOpen={activeModal === "NOTIFY"} onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setNotifys, notifys, "notifyId")}
                onDelete={handleDeleteList(setNotifys, notifys, "notifyId")} />

            <ConsigneeForm title="Freight Buyer" endpoint="/api/freightbuyers"
                isOpen={activeModal === "FREIGHT_BUYER"} onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setFreightBuyers, freightBuyers, "freightBuyerId")}
                onDelete={handleDeleteList(setFreightBuyers, freightBuyers, "freightBuyerId")} />

            <ConsigneeForm title="Forwarder" endpoint="/api/forwarders"
                isOpen={activeModal === "FORWARDER"} onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setForwarders, forwarders, "forwarderId")}
                onDelete={handleDeleteList(setForwarders, forwarders, "forwarderId")} />

            <GoodsForm
                title="Description of Goods"
                isOpen={activeModal === "GOODS"} onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                hscodes={hscodes}
                onAddNewHSCode={() => { setEditingEntity(null); setIsHSCodeModalOpen(true); }}
                onEditHSCode={(id) => {
                    const item = hscodes.find(x => x.id === id);
                    if (item) { setEditingEntity(item); setIsHSCodeModalOpen(true); }
                }}
                onSuccess={handleSaveList(setGoods, goods, "goodsId")}
                onDelete={handleDeleteList(setGoods, goods, "goodsId")} />

            <HSCodeForm
                title="HS Code"
                isOpen={isHSCodeModalOpen} onClose={() => { setIsHSCodeModalOpen(false); setEditingEntity(null); }}
                initialData={editingEntity}
                onSuccess={(item) => {
                    const exists = hscodes.find(x => x.id === item.id);
                    setHscodes(exists ? hscodes.map(x => x.id === item.id ? item : x) : [...hscodes, item]);
                    setIsHSCodeModalOpen(false);
                    setEditingEntity(null);
                }}
                onDelete={(id) => {
                    setHscodes(hscodes.filter(x => x.id !== id));
                    setIsHSCodeModalOpen(false);
                    setEditingEntity(null);
                }} />

            <SmallGenericForm
                title="Reference Type"
                isOpen={activeModal === "TYPE_RELEASED"} onClose={() => setActiveModal(null)}
                endpoint="/api/typereleased" entityName="Type Released"
                idField="typeReleasedId" entities={typesReleased} setEntities={setTypesReleased}
                initialData={editingEntity} />

            <SmallGenericForm
                title=""
                isOpen={activeModal === "TYPE_TC"} onClose={() => setActiveModal(null)}
                endpoint="/api/typetc" entityName="Type de Conteneur"
                idField="typeTcId" entities={typesTc} setEntities={setTypesTc}
                initialData={editingEntity} />

            <AlsoNotifyForm
                title="Also Notify"
                isOpen={activeModal === "ALSO_NOTIFY"} onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={(saved) => {
                    const isEditing = !!editingEntity;
                    if (isEditing) {
                        setAlsoNotifys(alsoNotifys.map(e => e.id === saved.id ? saved : e));
                    } else {
                        setAlsoNotifys([...alsoNotifys, saved]);
                    }
                    setActiveModal(null);
                }}
                onDelete={handleDeleteList(setAlsoNotifys, alsoNotifys, "alsoNotifyId")}
                maxWidth="800px" />

            <SmallGenericForm
                title=""
                isOpen={activeModal === "PACKAGE_TYPE"} onClose={() => setActiveModal(null)}
                endpoint="/api/packagetypes" entityName="Type de Package"
                idField="packageTypeId" entities={packageTypes} setEntities={setPackageTypes}
                initialData={editingEntity} />

            {showChangePasswordModal && (
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <div className="modal-content" style={{ maxWidth: "400px", textAlign: "center" }}>
                        <ShieldAlert size={48} color="var(--primary)" style={{ marginBottom: "1rem" }} />
                        <h2 style={{ fontWeight: 800 }}>Changement Obligatoire</h2>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                            Vous utilisez un mot de passe temporaire. Vous devez impérativement le modifier avant de continuer.
                        </p>
                        <div style={{ textAlign: "left", marginBottom: "1.5rem" }}>
                            <label>Nouveau mot de passe</label>
                            <input 
                                type="password" 
                                value={newPass} 
                                onChange={(e) => setNewPass(e.target.value)} 
                                placeholder="6 caractères minimum"
                            />
                        </div>
                        <button className="btn-primary" onClick={handlePasswordChange} style={{ width: "100%" }}>
                            Enregistrer et se reconnecter
                        </button>
                    </div>
                </div>
            )}

            {/* ──────────── BOOKING SIDEBAR DROITE ──────────── */}
            <aside className="booking-sidebar">
                <div style={{ padding: "0 0 1rem 0" }}>
                    <div className="search-box" style={{ 
                        position: "relative",
                        background: "#fff",
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                        padding: "0.2rem 0.5rem",
                        display: "flex",
                        alignItems: "center"
                    }}>
                        <Search size={16} style={{ color: "var(--text-muted)", marginRight: "0.5rem" }} />
                        <input 
                            type="text" 
                            placeholder="Rechercher un booking..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ 
                                border: "none", 
                                outline: "none", 
                                width: "100%", 
                                fontSize: "0.85rem",
                                padding: "0.4rem 0"
                            }} 
                        />
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                    {billOfLadings.filter(bl => bl.bookingNumber.includes(searchQuery)).length === 0 ? (
                        <div style={{
                            textAlign: "center", padding: "2rem 1rem",
                            color: "var(--text-light)", fontSize: "0.85rem"
                        }}>
                            <Ship size={32} style={{ margin: "0 auto 0.75rem", opacity: 0.3 }} />
                            <p>Aucun booking trouvé.</p>
                        </div>
                    ) : (
                        billOfLadings
                            .filter(bl => bl.bookingNumber.includes(searchQuery))
                            .map((bl) => {
                            const isDraft = bl.saveStatus === "DRAFT";
                            return (
                                <div
                                    key={bl.id}
                                    className={`booking-card ${currentBlId === bl.id ? "active" : ""} ${isDraft ? "draft" : "validated"}`}
                                    onClick={() => handleSearchBooking(bl.bookingNumber)}
                                >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                                        <span className="booking-card-num" style={{ margin: 0, flexShrink: 0 }}>#{bl.bookingNumber}</span>

                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            {isDraft
                                                ? <span className="badge-draft" title="En traitement" style={{ padding: "0.2rem 0.4rem" }}>⏳</span>
                                                : <span className="badge-validated" title="Terminé" style={{ padding: "0.2rem 0.4rem" }}>✓</span>}

                                            {canDelete && (
                                                <button
                                                    type="button"
                                                    title="Supprimer ce BL"
                                                    onClick={(e) => handleDeleteBL(bl.id, bl.bookingNumber, e)}
                                                    style={{
                                                        background: "none", border: "none",
                                                        color: "var(--danger)", cursor: "pointer",
                                                        padding: "0.25rem", borderRadius: "6px",
                                                        display: "flex", alignItems: "center",
                                                        transition: "background 0.15s"
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                                                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                             )}
                                        </div>
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
