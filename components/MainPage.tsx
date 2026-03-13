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
import { ModalForm } from "./ModalForm";
import { ShipperForm } from "./forms/ShipperForm";
import { ConsigneeForm } from "./forms/ConsigneeForm";
import { GoodsForm } from "./forms/GoodsForm";
import { HSCodeForm } from "./forms/HSCodeForm";
import { SmallGenericForm } from "./forms/SmallGenericForm";
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
    goodsId: yup.string().required("Description requis"),
});

export default function MainPage() {
    const { data: session } = useSession();

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
    const [billOfLadings, setBillOfLadings] = useState<any[]>([]);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [newPass, setNewPass] = useState("");
    const bookingRef = useRef<HTMLInputElement>(null);


    const { register, handleSubmit, setValue, getValues, watch, reset, formState: { errors } } = useForm({
        resolver: yupResolver(blSchema),
        defaultValues: {
            bookingNumber: "", contractNumber: "",
            shipperId: "", consigneeId: "", notifyId: "", alsoNotifyId: "",
            forwarderId: "", freightBuyerId: "", goodsId: "",
            portCountryText: "", portCityText: "", typeReleasedId: "",
        }
    });

    const values = watch();

    useEffect(() => {
        if ((session?.user as any)?.mustChangePassword) {
            setShowChangePasswordModal(true);
        }
    }, [session]);

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
        forwarderId: "", freightBuyerId: "", goodsId: "",
        portCountryText: "", portCityText: "", typeReleasedId: "",
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
            const [s, c, n, a, f, fw, g, t, hs] = await Promise.all([
                fetch('/api/shippers').then(r => r.ok ? r.json() : []),
                fetch('/api/consignees').then(r => r.ok ? r.json() : []),
                fetch('/api/notify').then(r => r.ok ? r.json() : []),
                fetch('/api/alsonotify').then(r => r.ok ? r.json() : []),
                fetch('/api/freightbuyers').then(r => r.ok ? r.json() : []),
                fetch('/api/forwarders').then(r => r.ok ? r.json() : []),
                fetch('/api/goods').then(r => r.ok ? r.json() : []),
                fetch('/api/typereleased').then(r => r.ok ? r.json() : []),
                fetch('/api/hscodes').then(r => r.ok ? r.json() : []),
            ]);
            if (Array.isArray(s))  setShippers(s);
            if (Array.isArray(c))  setConsignees(c);
            if (Array.isArray(n))  setNotifys(n);
            if (Array.isArray(a))  setAlsoNotifys(a);
            if (Array.isArray(f))  setFreightBuyers(f);
            if (Array.isArray(fw)) setForwarders(fw);
            if (Array.isArray(g))  setGoods(g);
            if (Array.isArray(t))  setTypesReleased(t);
            if (Array.isArray(hs)) setHscodes(hs);
            const bls = await fetch('/api/billoflading').then(r => r.ok ? r.json() : []);
            if (Array.isArray(bls)) setBillOfLadings(bls);
        };
        fetchAll();
    }, []);

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
                toast.error(err.error || "Erreur lors de la sauvegarde.");
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
        if (containers.length === 0) {
            toast.error("Veuillez ajouter au moins un conteneur.");
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
                    goods: goods.find(g => g.id === data.goodsId) || {},
                    containers,
                };
                generateBLPDF(hydratedData, false);
                const bls = await fetch('/api/billoflading').then(r => r.ok ? r.json() : []);
                setBillOfLadings(bls);
            } else {
                toast.error("Erreur lors de l'enregistrement.");
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

            {/* ──────────── SIDEBAR GAUCHE ──────────── */}
            <aside className="sidebar">
                {/* Logo */}
                <div className="sidebar-logo">
                    <img src="/logo-oocl.png" alt="OOCL Logo" />
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <div className="nav-item active" onClick={handleNewForm} style={{ cursor: "pointer" }}>
                        <Ship size={19} />
                        <span>Créer une S.I.</span>
                    </div>

                    <Link href="/dashboard" passHref style={{ textDecoration: "none" }}>
                        <div className="nav-item">
                            <LayoutDashboard size={19} />
                            <span>Tableau de Bord</span>
                        </div>
                    </Link>

                    {(session?.user as any)?.role === "ADMIN" && (
                        <Link href="/admin/users" passHref style={{ textDecoration: "none" }}>
                            <div className="nav-item">
                                <User size={19} />
                                <span>Gestion Comptes</span>
                            </div>
                        </Link>
                    )}
                </nav>

                {/* Session info + logout */}
                <div className="sidebar-footer">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: "50%",
                            background: "linear-gradient(135deg, var(--primary) 0%, #ff4d5e 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "white", flexShrink: 0,
                        }}>
                            <User size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p className="sidebar-user-name">Connecté en tant que</p>
                            <p className="sidebar-user-email">{session?.user?.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="btn-outline"
                        style={{ width: "100%", justifyContent: "center", fontSize: "0.82rem" }}
                    >
                        <LogOut size={14} />
                        Se déconnecter
                    </button>
                </div>
            </aside>

            {/* ──────────── MAIN CONTENT ──────────── */}
            <main className="main-content">
                <div className="main-content-inner">
                    {/* Header */}
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

                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                className="btn-outline"
                                style={{ borderColor: "#d97706", color: "#d97706" }}
                            >
                                <Save size={14} />
                                Brouillon
                            </button>

                            {currentBlId && (
                                <>
                                    <button type="button" onClick={handleNewForm} className="btn-outline">
                                        <PlusCircle size={14} />
                                        Nouveau
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleDeleteBL(currentBlId, getValues("bookingNumber"), e)}
                                        className="btn-outline"
                                        style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
                                    >
                                        <Trash2 size={14} />
                                        Supprimer
                                    </button>
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

                            <div className="grid-2">
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

                                <div>
                                    <label>Contract Number *</label>
                                    <input
                                        {...register("contractNumber")}
                                        maxLength={10}
                                        placeholder="ex: CNTR1234"
                                        className={fc(values.contractNumber)}
                                    />
                                    {errors.contractNumber && <span className="error-msg">{(errors.contractNumber as any).message}</span>}
                                </div>
                            </div>

                            <div className="grid-2" style={{ marginTop: "1.5rem" }}>
                                <Combobox
                                    label="Type Released *"
                                    items={typesReleased}
                                    displayKey="name"
                                    valueKey="id"
                                    value={values.typeReleasedId}
                                    onChange={(val) => setValue("typeReleasedId", val)}
                                    onAddNew={() => handleAddNew("TYPE_RELEASED")}
                                    onEdit={() => handleEdit("TYPE_RELEASED", typesReleased, values.typeReleasedId)}
                                    error={errors.typeReleasedId?.message as string}
                                />
                            </div>

                            <div className="grid-2" style={{ marginTop: "1.5rem" }}>
                                <LinkedPortSelector
                                    portCountryValue={values.portCountryText}
                                    onPortCountryChange={(name) => setValue("portCountryText", name)}
                                    portCityValue={values.portCityText}
                                    onPortCityChange={(name) => setValue("portCityText", name)}
                                    portCountryError={errors.portCountryText?.message as string}
                                    portCityError={errors.portCityText?.message as string}
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
                                    onAddNew={() => handleAddNew("SHIPPER")}
                                    onEdit={() => handleEdit("SHIPPER", shippers, values.shipperId)}
                                    error={errors.shipperId?.message as string} />

                                <Combobox label="Consignee *" items={consignees} displayKey="name" valueKey="id"
                                    value={values.consigneeId} onChange={(val) => setValue("consigneeId", val)}
                                    onAddNew={() => handleAddNew("CONSIGNEE")}
                                    onEdit={() => handleEdit("CONSIGNEE", consignees, values.consigneeId)}
                                    error={errors.consigneeId?.message as string} />
                            </div>

                            <div className="grid-2" style={{ marginTop: "1.5rem" }}>
                                <Combobox label="Notify *" items={notifys} displayKey="name" valueKey="id"
                                    value={values.notifyId} onChange={(val) => setValue("notifyId", val)}
                                    onAddNew={() => handleAddNew("NOTIFY")}
                                    onEdit={() => handleEdit("NOTIFY", notifys, values.notifyId)}
                                    error={errors.notifyId?.message as string} />

                                <Combobox label="Also Notify" items={alsoNotifys} displayKey="description" valueKey="id"
                                    value={values.alsoNotifyId || ""} onChange={(val) => setValue("alsoNotifyId", val)}
                                    onAddNew={() => handleAddNew("ALSO_NOTIFY")}
                                    onEdit={() => handleEdit("ALSO_NOTIFY", alsoNotifys, values.alsoNotifyId || "")}
                                    error={errors.alsoNotifyId?.message as string} />
                            </div>

                            <div className="grid-2" style={{ marginTop: "1.5rem" }}>
                                <Combobox label="Freight Buyer *" items={freightBuyers} displayKey="name" valueKey="id"
                                    value={values.freightBuyerId} onChange={(val) => setValue("freightBuyerId", val)}
                                    onAddNew={() => handleAddNew("FREIGHT_BUYER")}
                                    onEdit={() => handleEdit("FREIGHT_BUYER", freightBuyers, values.freightBuyerId)}
                                    error={errors.freightBuyerId?.message as string} />

                                <Combobox label="Forwarder *" items={forwarders} displayKey="name" valueKey="id"
                                    value={values.forwarderId} onChange={(val) => setValue("forwarderId", val)}
                                    onAddNew={() => handleAddNew("FORWARDER")}
                                    onEdit={() => handleEdit("FORWARDER", forwarders, values.forwarderId)}
                                    error={errors.forwarderId?.message as string} />
                            </div>
                        </section>



                        {/* ── Section : Marchandises ── */}
                        <section>
                            <p className="form-section-title">
                                <Ship size={12} />
                                Marchandises
                            </p>
                            <Combobox label="Description of Goods *" items={goods} displayKey="description" valueKey="id"
                                value={values.goodsId} onChange={(val) => setValue("goodsId", val)}
                                onAddNew={() => handleAddNew("GOODS")}
                                onEdit={() => handleEdit("GOODS", goods, values.goodsId)}
                                multiline={true}
                                error={errors.goodsId?.message as string} />
                        </section>

                        {/* ── Conteneurs ── */}
                        <ContainerTable containers={containers} setContainers={setContainers} />

                        {/* ── Bouton FINALISER ── */}
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", paddingTop: "0.5rem" }}>
                            <button type="submit" className="btn-finalize" disabled={isGeneratingPDF}>
                                {isGeneratingPDF ? (
                                    <>
                                        <div className="spinner" style={{ marginRight: "0.5rem" }}></div>
                                        Génération du PDF...
                                    </>
                                ) : (
                                    "💾 Enregistrer et finaliser le B/L"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* ──────────── MODALS ──────────── */}
            <ShipperForm
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
                title={editingEntity ? "Modifier Type Released" : "Ajouter Type Released (MBL/HBL…)"}
                isOpen={activeModal === "TYPE_RELEASED"} onClose={() => setActiveModal(null)}
                endpoint="/api/typereleased" entityName="Type Released"
                idField="typeReleasedId" entities={typesReleased} setEntities={setTypesReleased}
                initialData={editingEntity} />

            <SmallGenericForm
                title={editingEntity ? "Modifier Also Notify" : "Ajouter Also Notify"}
                isOpen={activeModal === "ALSO_NOTIFY"} onClose={() => setActiveModal(null)}
                endpoint="/api/alsonotify" entityName="Description (Also Notify)"
                idField="alsoNotifyId" entities={alsoNotifys} setEntities={setAlsoNotifys}
                initialData={editingEntity} isTextArea={true} fieldName="description" />

            {/* Modal de changement de mot de passe obligatoire */}
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
                                    <span className="booking-card-num">#{bl.bookingNumber}</span>

                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
                                        {isDraft
                                            ? <span className="badge-draft">⏳ En traitement</span>
                                            : <span className="badge-validated">✓ Terminé</span>}

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
