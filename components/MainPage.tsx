"use client";

import React, { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import {
    Ship,
    Save,
    Trash2,
    PlusCircle,
    FileText,
    User,
    Search,
    ShieldAlert,
    BookOpen,
    Eye,
    Edit
} from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAuth } from "./AuthProvider";
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
   MAIN PAGE WITH STEPPER WIZARD
   ════════════════════════════════════════════ */
const blSchema = yup.object().shape({
    bookingNumber: yup.string().required("Booking Number is required"),
    contractNumber: yup.string().required("Contract Number is required"),
    typeReleasedId: yup.string().required("Type Released is required"),
    portCountryText: yup.string().required("Country is required"),
    portCityText: yup.string().required("City is required"),
    shipperId: yup.string().required("Shipper is required"),
    consigneeId: yup.string().required("Consignee is required"),
    notifyId: yup.string().required("Notify is required"),
    alsoNotifyId: yup.string().nullable(),
    forwarderId: yup.string().required("Forwarder is required"),
    freightBuyerId: yup.string().required("Freight Payer is required"),
    goodsId: yup.string().required("Nature of Goods is required"),
    vesselId: yup.string().required("Vessel is required"),
    voyageId: yup.string().optional().nullable(),
    globalTypeTc: yup.string().required("Global Container Type is required"),
    globalPackageType: yup.string().required("Global Packaging Type is required"),
    hsCode: yup.string().optional().nullable(),
});

export default function MainPage() {
    const { user, hasPermission } = useAuth();
    const canWrite = hasPermission("BL_WRITE");
    const canDelete = hasPermission("BL_WRITE");
    const canEditRefTables = hasPermission("BL_WRITE");

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
    const [pendingGoodsData, setPendingGoodsData] = useState<any>(null); // snapshot form before opening HSCode
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
    const [bookingDuplicateError, setBookingDuplicateError] = useState<string | null>(null);
    const bookingRef = useRef<HTMLInputElement>(null);

    // Stepper wizard navigation states
    const [activeStep, setActiveStep] = useState(1);
    const [activeSubStep, setActiveSubStep] = useState(1);

    const { register, handleSubmit, setValue, getValues, watch, reset, trigger, formState: { errors } } = useForm({
        resolver: yupResolver(blSchema),
        defaultValues: {
            bookingNumber: "", contractNumber: "",
            shipperId: "", consigneeId: "", notifyId: "", alsoNotifyId: "",
            forwarderId: "", freightBuyerId: "", 
            goodsId: "", hsCode: "",
            portCountryText: "", portCityText: "", typeReleasedId: "",
            vesselId: "", voyageId: "",
            globalTypeTc: "", globalPackageType: ""
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
        forwarderId: "", freightBuyerId: "",
        goodsId: "", hsCode: "",
        portCountryText: "", portCityText: "", typeReleasedId: "",
        vesselId: "", voyageId: "",
        globalTypeTc: "", globalPackageType: ""
    };

    const handleNewForm = () => {
        reset(emptyForm);
        setContainers([]);
        setCurrentBlId(null);
        setActiveStep(1);
        setActiveSubStep(1);
        setTimeout(() => bookingRef.current?.focus(), 0);
    };

    const handleAddNew  = (key: string) => { setEditingEntity(null); setActiveModal(key); };
    const handleEdit    = (key: string, list: any[], id: string) => {
        const item = list.find(x => x.id === id);
        if (item) { setEditingEntity(item); setActiveModal(key); }
    };
    const handleSaveList = (setter: any, list: any[], field: any) => (item: any) => {
        const exists = list.find(x => x.id === item.id);
        const updatedList = exists ? list.map(x => x.id === item.id ? item : x) : [...list, item];
        
        if (field === "consigneeId" || field === "notifyId" || field === "alsoNotifyId") {
            setConsignees(updatedList);
            setNotifys(updatedList);
            setAlsoNotifys(updatedList);
        } else {
            setter(updatedList);
        }
        
        setValue(field, item.id);
        setActiveModal(null);
    };
    const handleDeleteList = (setter: any, list: any[], field: any) => (id: string) => {
        const updatedList = list.filter(x => x.id !== id);
        
        if (field === "consigneeId" || field === "notifyId" || field === "alsoNotifyId") {
            setConsignees(updatedList);
            setNotifys(updatedList);
            setAlsoNotifys(updatedList);
        } else {
            setter(updatedList);
        }
        
        if (getValues(field) === id) setValue(field, "");
        setActiveModal(null);
    };

    const fc = (val: string | undefined | null) => (val && val.trim() !== "" ? "input-filled" : "");

    /* ─── Check booking duplicate against API ─── */
    const checkBookingDuplicate = async (bookingNumber: string): Promise<boolean> => {
        if (!bookingNumber || !/^[0-9]{10}$/.test(bookingNumber) || currentBlId) {
            setBookingDuplicateError(null);
            return false;
        }
        try {
            const res = await fetch(`/api/billoflading?bookingNumber=${bookingNumber}`);
            if (res.ok) {
                // BL found → duplicate
                setBookingDuplicateError(`Booking number "${bookingNumber}" already exists.`);
                return true;
            } else {
                setBookingDuplicateError(null);
                return false;
            }
        } catch {
            setBookingDuplicateError(null);
            return false;
        }
    };

    /* ─── Stepper Navigation Validation ─── */
    const validateCurrentStep = async (): Promise<boolean> => {
        if (activeStep === 1) {
            const formValid = await trigger([
                "bookingNumber",
                "contractNumber",
                "typeReleasedId",
                "vesselId",
                "portCountryText",
                "portCityText"
            ]);
            if (!formValid) return false;

            // Only check duplicate when creating a new BL (not editing)
            if (!currentBlId) {
                const isDuplicate = await checkBookingDuplicate(getValues("bookingNumber"));
                if (isDuplicate) {
                    toast.error(`Booking number "${getValues("bookingNumber")}" already exists. Please choose another or load the existing BL.`, { duration: 5000 });
                    return false;
                }
            }
            return true;
        }
        if (activeStep === 2) {
            if (activeSubStep === 1) return await trigger("shipperId");
            if (activeSubStep === 2) return await trigger("consigneeId");
            if (activeSubStep === 3) return await trigger("notifyId");
            if (activeSubStep === 4) return await trigger("alsoNotifyId");
            if (activeSubStep === 5) return await trigger("freightBuyerId");
            if (activeSubStep === 6) return await trigger("forwarderId");
        }
        if (activeStep === 3) {
            if (activeSubStep === 1) {
                return await trigger(["goodsId", "globalTypeTc", "globalPackageType"]);
            }
            if (activeSubStep === 2) {
                if (containers.length === 0) {
                    toast.error("Please add at least one container.");
                    return false;
                }
                // Verify all containers have data (normally verified in form, but check anyway)
                const invalid = containers.some(c => !c.containerNum || !c.sealNum || !c.count || !c.grossWeight);
                if (invalid) {
                    toast.error("Some containers in the list are incomplete.");
                    return false;
                }
                return true;
            }
        }
        return true;
    };

    const handleBack = () => {
        if (activeStep === 4) {
            setActiveStep(3);
            setActiveSubStep(2);
        } else if (activeStep === 3) {
            if (activeSubStep === 2) {
                setActiveSubStep(1);
            } else {
                setActiveStep(2);
                setActiveSubStep(6);
            }
        } else if (activeStep === 2) {
            if (activeSubStep > 1) {
                setActiveSubStep(activeSubStep - 1);
            } else {
                setActiveStep(1);
            }
        }
    };

    const handleNext = async () => {
        const isValid = await validateCurrentStep();
        if (!isValid) return;

        if (activeStep === 1) {
            // Save draft silently in the background
            if (canWrite) {
                handleSaveDraft(true);
            }
            setActiveStep(2);
            setActiveSubStep(1);
        } else if (activeStep === 2) {
            if (activeSubStep < 6) {
                setActiveSubStep(activeSubStep + 1);
            } else {
                setActiveStep(3);
                setActiveSubStep(1);
            }
        } else if (activeStep === 3) {
            if (activeSubStep === 1) {
                setActiveSubStep(2);
            } else {
                setActiveStep(4);
            }
        }
    };

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

                // Automatically extract globalTypeTc and globalPackageType from first container
                if (data.containers && data.containers.length > 0) {
                    setContainers(data.containers);
                    setValue("globalTypeTc", data.containers[0].typeTc || "");
                    setValue("globalPackageType", data.containers[0].packageType || "");
                } else {
                    setContainers([]);
                    setValue("globalTypeTc", "");
                    setValue("globalPackageType", "");
                }

                setCurrentBlId(data.id);
                
                // Reset stepper to step 1
                setActiveStep(1);
                setActiveSubStep(1);

                if (!bookingNumArg) toast.success("Booking data loaded!");
            } else if (res.status === 404) {
                if (!bookingNumArg) toast.error("Booking Number not found.");
            } else {
                if (!bookingNumArg) toast.error("Error during search.");
            }
        } catch { if (!bookingNumArg) toast.error("Connection error."); }
    };

    /* ─── Initial fetch ─── */
    useEffect(() => {
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

    // Update form's hsCode value if selected goods changes
    useEffect(() => {
        if (values.goodsId) {
            const selected = goods.find(g => g.id === values.goodsId);
            if (selected) setValue("hsCode", selected.hsCode);
        }
    }, [values.goodsId, goods, setValue]);

    /* ─── Save Draft ─── */
    const handleSaveDraft = async (silent: any = false) => {
        const isSilent = silent === true;
        const data = getValues();
        if (!data.bookingNumber || !/^[0-9]{10}$/.test(data.bookingNumber)) {
            if (!isSilent) toast.error("Booking number is required (10 digits).");
            return;
        }

        // Apply global type and package to all containers in draft
        const updatedContainers = containers.map(c => ({
            ...c,
            typeTc: data.globalTypeTc || c.typeTc,
            packageType: data.globalPackageType || c.packageType
        }));

        try {
            const url = currentBlId ? `/api/billoflading/${currentBlId}` : "/api/billoflading";
            const res = await fetch(url, {
                method: currentBlId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, containers: updatedContainers, saveStatus: "DRAFT" })
            });
            if (res.ok) {
                const saved = await res.json();
                if (!currentBlId) setCurrentBlId(saved.id);
                const bls = await fetch('/api/billoflading').then(r => r.json());
                setBillOfLadings(Array.isArray(bls) ? bls : []);
                if (!isSilent) toast.success("Draft saved!");
            } else {
                if (!isSilent) {
                    const err = await res.json().catch(() => ({}));
                    toast.error(`${err.error || "Error"} ${err.details ? ": " + err.details : ""}`);
                }
            }
        } catch { 
            if (!isSilent) toast.error("Connection error."); 
        }
    };

    /* ─── Delete BL ─── */
    const handleDeleteBL = async (blId: string, bookingNumber: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm(`Permanently delete BL #${bookingNumber}?\nThis action is irreversible.`)) return;
        try {
            const res = await fetch(`/api/billoflading/${blId}`, { method: "DELETE" });
            if (res.ok) {
                if (currentBlId === blId) handleNewForm();
                const bls = await fetch('/api/billoflading').then(r => r.json());
                setBillOfLadings(Array.isArray(bls) ? bls : []);
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || "Error during deletion.");
            }
        } catch { toast.error("Connection error."); }
    };

    /* ─── Save Validated (Submit) ─── */
    const onSubmit = async (data: any) => {
        if (containers.length === 0) {
            toast.error("Please add at least one container before finalizing.");
            return;
        }

        // Apply global type and package type to all containers
        const updatedContainers = containers.map(c => ({
            ...c,
            typeTc: data.globalTypeTc || c.typeTc,
            packageType: data.globalPackageType || c.packageType
        }));

        // Check if partners are valid (not drafts)
        const partnersToCheck = [
            { id: data.shipperId, list: shippers, label: "Shipper" },
            { id: data.consigneeId, list: consignees, label: "Consignee" },
            { id: data.notifyId, list: notifys, label: "Notify Party" },
            { id: data.forwarderId, list: forwarders, label: "Forwarder" },
            { id: data.freightBuyerId, list: freightBuyers, label: "Freight Payer" },
            { id: data.alsoNotifyId, list: alsoNotifys, label: "Also Notify Party" }
        ];

        const draftsErrors: string[] = [];
        const { countryRequirements, cityRequirements } = await import("@/lib/constants");
        
        for (const p of partnersToCheck) {
            if (!p.id) continue;
            const partner = p.list.find(x => x.id === p.id);
            if (partner && partner.saveStatus === "DRAFT") {
                const missing: string[] = [];
                
                if (p.label === "Also Notify Party") {
                    if (!partner.name) missing.push("Name");
                    if (!partner.description) missing.push("Address/Description");
                } else {
                    if (!partner.name) missing.push("Name");
                    if (!partner.address) missing.push("Address");
                    if (!partner.country) missing.push("Country");
                    if (!partner.city) missing.push("City");
                    if (!partner.phone) missing.push("Phone");
                    if (!partner.email) missing.push("Email");
                }

                const reqs = [
                    ...(countryRequirements[partner.country] || []),
                    ...(cityRequirements[partner.city] || [])
                ];

                if (reqs.includes("VAT") && !partner.vat) missing.push("VAT No");
                if (reqs.includes("EORI") && !partner.eori) missing.push("EORI No");
                if (reqs.includes("BIN") && !partner.bin) missing.push("BIN No");
                if (reqs.includes("USCI") && !partner.usci) missing.push("USCI No");

                if (missing.length > 0) {
                    draftsErrors.push(`${p.label}: Missing fields (${missing.join(", ")})`);
                } else {
                    draftsErrors.push(`${p.label}: Must be officially validated`);
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
                        Cannot finalize: Some partners are still in Draft.
                    </p>
                    <ul style={{ fontSize: "0.9rem", paddingLeft: "1.2rem", color: "#333" }}>
                        {draftsErrors.map((err, i) => <li key={i} style={{ marginBottom: "0.25rem" }}>{err}</li>)}
                    </ul>
                    <p style={{ fontSize: "0.8rem", marginTop: "0.75rem", fontStyle: "italic", color: "#666", borderTop: "1px solid #eee", paddingTop: "0.5rem" }}>
                        Please edit these partners to complete the missing information.
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
                body: JSON.stringify({ ...data, containers: updatedContainers, saveStatus: "VALIDATED" })
            });
            if (res.ok) {
                toast.success("Bill of Lading successfully saved!");

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
                    hsCode: data.hsCode || "",
                    vessel: vessels.find(v => v.id === data.vesselId)?.name || "",
                    voyage: filteredVoyages.find(v => v.id === data.voyageId)?.number || "",
                    etd: filteredVoyages.find(v => v.id === data.voyageId)?.etdDate || "",
                    containers: updatedContainers,
                };
                await generateBLPDF(hydratedData, false);
                
                const bls = await fetch('/api/billoflading').then(r => r.ok ? r.json() : []);
                setBillOfLadings(bls);

                // Redirect to Table of Contents / Dashboard step
                setActiveStep(1);
                setActiveSubStep(1);
                handleNewForm();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(`${err.error || "Error"} ${err.details ? ": " + err.details : ""}`);
            }
        } catch { 
            toast.error("Connection error."); 
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    /* ─── Stepper Circle Rendering ─── */
    const renderStepper = () => {
        const steps = [
            { num: 1, label: "Voyage" },
            { num: 2, label: "Parties" },
            { num: 3, label: "Containers" },
            { num: 4, label: "Validation" }
        ];

        const getLineWidth = () => {
            if (activeStep === 1) return "0%";
            if (activeStep === 2) return "33%";
            if (activeStep === 3) return "66%";
            return "100%";
        };

        return (
            <div className="stepper-container">
                <div className="stepper-line">
                    <div className="stepper-line-fill" style={{ width: getLineWidth() }}></div>
                </div>
                {steps.map(s => {
                    let status = "";
                    if (activeStep === s.num) status = "active";
                    else if (activeStep > s.num) status = "completed";

                    return (
                        <div 
                            key={s.num} 
                            className={`stepper-step ${status}`}
                            onClick={async () => {
                                if (s.num < activeStep) {
                                    setActiveStep(s.num);
                                    if (s.num === 2) setActiveSubStep(1);
                                    if (s.num === 3) setActiveSubStep(1);
                                } else if (s.num > activeStep) {
                                    let valid = true;
                                    for (let st = activeStep; st < s.num; st++) {
                                        valid = await validateCurrentStep();
                                        if (!valid) break;
                                    }
                                    if (valid) {
                                        setActiveStep(s.num);
                                        if (s.num === 2) setActiveSubStep(1);
                                        if (s.num === 3) setActiveSubStep(1);
                                    }
                                }
                            }}
                        >
                            <div className="step-circle">{s.num}</div>
                            <span className="step-label">{s.label}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    /* ─── Sub-step dots ─── */
    const renderSubStepIndicator = () => {
        if (activeStep === 2) {
            const subSteps = [
                { id: 1, label: "Shipper" },
                { id: 2, label: "Consignee" },
                { id: 3, label: "Notify" },
                { id: 4, label: "Also Notify" },
                { id: 5, label: "Freight Payer" },
                { id: 6, label: "Forwarder" }
            ];
            return (
                <div style={{ marginBottom: "2rem", textAlign: "center" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--oocl-blue)", marginBottom: "0.75rem" }}>
                        Parties — {subSteps[activeSubStep - 1].label} ({activeSubStep}/6)
                    </h3>
                    <div className="substep-indicator-bar">
                        {subSteps.map(ss => (
                            <div 
                                key={ss.id} 
                                className={`substep-dot ${activeSubStep === ss.id ? "active" : activeSubStep > ss.id ? "completed" : ""}`}
                                title={ss.label}
                                style={{ cursor: "pointer" }}
                                onClick={async () => {
                                    if (ss.id < activeSubStep) {
                                        setActiveSubStep(ss.id);
                                    } else if (ss.id > activeSubStep) {
                                        const valid = await validateCurrentStep();
                                        if (valid) setActiveSubStep(ss.id);
                                    }
                                }}
                            />
                        ))}
                    </div>
                </div>
            );
        }
        if (activeStep === 3) {
            const subSteps = [
                { id: 1, label: "Goods & Packaging" },
                { id: 2, label: "Container List" }
            ];
            return (
                <div style={{ marginBottom: "2rem", textAlign: "center" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--oocl-blue)", marginBottom: "0.75rem" }}>
                        {subSteps[activeSubStep - 1].label} ({activeSubStep}/2)
                    </h3>
                    <div className="substep-indicator-bar">
                        {subSteps.map(ss => (
                            <div 
                                key={ss.id} 
                                className={`substep-dot ${activeSubStep === ss.id ? "active" : activeSubStep > ss.id ? "completed" : ""}`}
                                title={ss.label}
                                style={{ cursor: "pointer" }}
                                onClick={async () => {
                                    if (ss.id < activeSubStep) {
                                        setActiveSubStep(ss.id);
                                    } else if (ss.id > activeSubStep) {
                                        const valid = await validateCurrentStep();
                                        if (valid) setActiveSubStep(ss.id);
                                    }
                                }}
                            />
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    /* ─── Step 4 Recap View ─── */
    const renderRecapStep = () => {
        const editSection = (step: number, substep: number) => {
            setActiveStep(step);
            setActiveSubStep(substep);
        };

        const getPartnerName = (id: string, list: any[]) => {
            const p = list.find(x => x.id === id);
            return p ? p.name : "";
        };

        return (
            <div className="recap-grid-container">
                <div className="recap-card">
                    <div className="recap-card-header">
                        <h3 className="recap-card-title">
                            <BookOpen size={16} />
                            1. References & Voyage
                        </h3>
                        <button type="button" className="btn-edit-recap" onClick={() => editSection(1, 1)} title="Edit this section">
                            <Edit size={14} />
                        </button>
                    </div>
                    <div className="recap-field-grid">
                        <div className="recap-field">
                            <span className="recap-label">Booking Number</span>
                            <span className="recap-value">{values.bookingNumber || <span className="empty">Not specified</span>}</span>
                        </div>
                        <div className="recap-field">
                            <span className="recap-label">Type Released</span>
                            <span className="recap-value">{typesReleased.find(t => t.id === values.typeReleasedId)?.name || <span className="empty">Not specified</span>}</span>
                        </div>
                        <div className="recap-field">
                            <span className="recap-label">Contract Number</span>
                            <span className="recap-value">{values.contractNumber || <span className="empty">Not specified</span>}</span>
                        </div>
                        <div className="recap-field">
                            <span className="recap-label">Vessel</span>
                            <span className="recap-value">{vessels.find(v => v.id === values.vesselId)?.name || <span className="empty">Not specified</span>}</span>
                        </div>
                        <div className="recap-field">
                            <span className="recap-label">Port of Discharge</span>
                            <span className="recap-value">{values.portCountryText ? `${values.portCityText}, ${values.portCountryText}` : <span className="empty">Not specified</span>}</span>
                        </div>
                    </div>
                </div>

                <div className="recap-card">
                    <div className="recap-card-header">
                        <h3 className="recap-card-title">
                            <User size={16} />
                            2. Parties
                        </h3>
                        <button type="button" className="btn-edit-recap" onClick={() => editSection(2, 1)} title="Edit this section">
                            <Edit size={14} />
                        </button>
                    </div>
                    <div className="recap-field-grid">
                        <div className="recap-field">
                            <span className="recap-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Shipper * 
                                <button type="button" className="btn-edit-recap" onClick={() => editSection(2, 1)} style={{ padding: 0 }}><Edit size={10} /></button>
                            </span>
                            <span className="recap-value">{getPartnerName(values.shipperId, shippers) || <span className="empty">Not specified</span>}</span>
                        </div>
                        <div className="recap-field">
                            <span className="recap-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Consignee * 
                                <button type="button" className="btn-edit-recap" onClick={() => editSection(2, 2)} style={{ padding: 0 }}><Edit size={10} /></button>
                            </span>
                            <span className="recap-value">{getPartnerName(values.consigneeId, consignees) || <span className="empty">Not specified</span>}</span>
                        </div>
                        <div className="recap-field">
                            <span className="recap-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Notify * 
                                <button type="button" className="btn-edit-recap" onClick={() => editSection(2, 3)} style={{ padding: 0 }}><Edit size={10} /></button>
                            </span>
                            <span className="recap-value">{getPartnerName(values.notifyId, notifys) || <span className="empty">Not specified</span>}</span>
                        </div>
                        <div className="recap-field">
                            <span className="recap-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Also Notify 
                                <button type="button" className="btn-edit-recap" onClick={() => editSection(2, 4)} style={{ padding: 0 }}><Edit size={10} /></button>
                            </span>
                            <span className="recap-value">{getPartnerName(values.alsoNotifyId || "", alsoNotifys) || <span className="empty">None</span>}</span>
                        </div>
                        <div className="recap-field">
                            <span className="recap-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Freight Payer * 
                                <button type="button" className="btn-edit-recap" onClick={() => editSection(2, 5)} style={{ padding: 0 }}><Edit size={10} /></button>
                            </span>
                            <span className="recap-value">{getPartnerName(values.freightBuyerId, freightBuyers) || <span className="empty">Not specified</span>}</span>
                        </div>
                        <div className="recap-field">
                            <span className="recap-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Forwarder * 
                                <button type="button" className="btn-edit-recap" onClick={() => editSection(2, 6)} style={{ padding: 0 }}><Edit size={10} /></button>
                            </span>
                            <span className="recap-value">{getPartnerName(values.forwarderId, forwarders) || <span className="empty">Not specified</span>}</span>
                        </div>
                    </div>
                </div>

                <div className="recap-card">
                    <div className="recap-card-header">
                        <h3 className="recap-card-title">
                            <Ship size={16} />
                            3. Goods & Packaging
                        </h3>
                        <button type="button" className="btn-edit-recap" onClick={() => editSection(3, 1)} title="Edit this section">
                            <Edit size={14} />
                        </button>
                    </div>
                    <div className="recap-field-grid" style={{ gridTemplateColumns: "1fr" }}>
                        <div className="recap-field">
                            <span className="recap-label">Nature / Description of Goods</span>
                            <span className="recap-value" style={{ whiteSpace: "pre-wrap" }}>
                                {goods.find(g => g.id === values.goodsId)?.description || <span className="empty">Not specified</span>}
                            </span>
                        </div>
                    </div>
                    <div className="recap-field-grid" style={{ marginTop: "1rem" }}>
                        <div className="recap-field">
                            <span className="recap-label">HS Code</span>
                            <span className="recap-value">{values.hsCode || <span className="empty">Not specified</span>}</span>
                        </div>
                        <div className="recap-field">
                            <span className="recap-label">Declaration No</span>
                            <span className="recap-value">
                                {goods.find(g => g.id === values.goodsId)?.declNo || <span className="empty">Not specified</span>}
                            </span>
                        </div>
                        <div className="recap-field">
                            <span className="recap-label">Declaration Date</span>
                            <span className="recap-value">
                                {(() => {
                                    const dDate = goods.find(g => g.id === values.goodsId)?.declDate;
                                    if (!dDate) return <span className="empty">Not specified</span>;
                                    const parts = dDate.split("-");
                                    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dDate;
                                })()}
                            </span>
                        </div>
                        <div className="recap-field">
                            <span className="recap-label">Global Container Type</span>
                            <span className="recap-value">{values.globalTypeTc || <span className="empty">Not specified</span>}</span>
                        </div>
                        <div className="recap-field">
                            <span className="recap-label">Global Package Type</span>
                            <span className="recap-value">{values.globalPackageType || <span className="empty">Not specified</span>}</span>
                        </div>
                    </div>
                </div>

                <div className="recap-card">
                    <div className="recap-card-header">
                        <h3 className="recap-card-title">
                            <PlusCircle size={16} />
                            4. Container List ({containers.length})
                        </h3>
                        <button type="button" className="btn-edit-recap" onClick={() => editSection(3, 2)} title="Edit this section">
                            <Edit size={14} />
                        </button>
                    </div>
                    <div className="table-responsive">
                        <table className="container-table" style={{ width: "100%", fontSize: "0.85rem" }}>
                            <thead>
                                <tr>
                                    <th>Container</th>
                                    <th>Seal No</th>
                                    <th>Package Qty</th>
                                    <th>Gross Weight</th>
                                    <th>Net Weight</th>
                                    <th>Volume</th>
                                </tr>
                            </thead>
                            <tbody>
                                {containers.map(c => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600 }}>{c.containerNum}</td>
                                        <td>{c.sealNum}</td>
                                        <td>{c.count}</td>
                                        <td>{c.grossWeight} kg</td>
                                        <td>{c.netWeight ? `${c.netWeight} kg` : "-"}</td>
                                        <td>{c.volume ? `${c.volume} cbm` : "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

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
                            <h1>{currentBlId ? "Edit Shipping Instructions" : "New Shipping Instructions"}</h1>
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
                                    Save Draft
                                </button>
                            )}

                            {currentBlId && (
                                <>
                                    {canWrite && (
                                        <button type="button" onClick={handleNewForm} className="btn-outline">
                                            <PlusCircle size={14} />
                                            New
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
                                            Delete
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </header>

                    {/* Horizontal progress bar */}
                    {renderStepper()}

                    {/* ─── FORM CARD ─── */}
                    <form id="si-form" onSubmit={handleSubmit(onSubmit)} className="form-container" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        
                        {/* ── STEP 1 : Références & Voyage ── */}
                        {activeStep === 1 && (
                            <section className="fade-in">
                                <p className="form-section-title">
                                    <BookOpen size={12} />
                                    References & Voyage
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
                                            placeholder="e.g. 1234567890"
                                            className={fc(values.bookingNumber)}
                                            disabled={!canWrite}
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
                                            onBlur={(e) => {
                                                if (!currentBlId) checkBookingDuplicate(e.target.value);
                                            }}
                                            onChange={(e) => {
                                                // N'accepter que les chiffres à la saisie
                                                const cleaned = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                                                e.target.value = cleaned;
                                                register("bookingNumber").onChange(e);
                                                if (bookingDuplicateError) setBookingDuplicateError(null);
                                            }}
                                        />
                                        {errors.bookingNumber && <span className="error-msg">{(errors.bookingNumber as any).message}</span>}
                                        {!errors.bookingNumber && bookingDuplicateError && !currentBlId && (
                                            <span className="error-msg" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                ⚠️ {bookingDuplicateError}
                                            </span>
                                        )}
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
                                            placeholder="e.g. CNTR1234"
                                            className={fc(values.contractNumber)}
                                            disabled={!canWrite}
                                            onChange={(e) => {
                                                const val = e.target.value.toUpperCase();
                                                setValue("contractNumber", val);
                                            }}
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                        {errors.contractNumber && <span className="error-msg">{(errors.contractNumber as any).message}</span>}
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
                                    <Combobox
                                        label="Vessel *"
                                        items={vessels}
                                        displayKey="name"
                                        valueKey="id"
                                        value={values.vesselId}
                                        onChange={(val) => {
                                            setValue("vesselId", val);
                                        }}
                                        error={errors.vesselId?.message as string}
                                        disabled={!canWrite}
                                    />
                                    <Combobox
                                        label="Voyage"
                                        items={filteredVoyages}
                                        displayKey="number"
                                        valueKey="id"
                                        value={values.voyageId ?? ""}
                                        onChange={(val) => setValue("voyageId", val)}
                                        disabled={!canWrite || filteredVoyages.length === 0}
                                        placeholder={values.vesselId ? "Select a voyage..." : "— Select a vessel first"}
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
                                        disabled={!canWrite}
                                    />
                                </div>
                            </section>
                        )}

                        {/* ── STEP 2 : Acteurs (Parties) ── */}
                        {activeStep === 2 && (
                            <section className="fade-in">
                                <p className="form-section-title">
                                    <User size={12} />
                                    Parties Involved
                                </p>
                                {renderSubStepIndicator()}

                                {activeSubStep === 1 && (
                                    <div className="fade-in">
                                        <Combobox label="Shipper *" items={shippers} displayKey="name" valueKey="id"
                                            value={values.shipperId} onChange={(val) => setValue("shipperId", val)}
                                            onAddNew={canEditRefTables ? () => handleAddNew("SHIPPER") : undefined}
                                            onEdit={canEditRefTables ? () => handleEdit("SHIPPER", shippers, values.shipperId) : undefined}
                                            error={errors.shipperId?.message as string}
                                            isDraft={shippers.find(s => s.id === values.shipperId)?.saveStatus === "DRAFT"}
                                            disabled={!canWrite} />
                                    </div>
                                )}

                                {activeSubStep === 2 && (
                                    <div className="fade-in">
                                        <Combobox label="Consignee *" items={consignees} displayKey="name" valueKey="id"
                                            value={values.consigneeId} onChange={(val) => setValue("consigneeId", val)}
                                            onAddNew={canEditRefTables ? () => handleAddNew("CONSIGNEE") : undefined}
                                            onEdit={canEditRefTables ? () => handleEdit("CONSIGNEE", consignees, values.consigneeId) : undefined}
                                            error={errors.consigneeId?.message as string}
                                            isDraft={consignees.find(c => c.id === values.consigneeId)?.saveStatus === "DRAFT"}
                                            disabled={!canWrite} />
                                    </div>
                                )}

                                {activeSubStep === 3 && (
                                    <div className="fade-in">
                                        <Combobox label="Notify *" items={notifys} displayKey="name" valueKey="id"
                                            value={values.notifyId} onChange={(val) => setValue("notifyId", val)}
                                            onAddNew={canEditRefTables ? () => handleAddNew("NOTIFY") : undefined}
                                            onEdit={canEditRefTables ? () => handleEdit("NOTIFY", notifys, values.notifyId) : undefined}
                                            error={errors.notifyId?.message as string}
                                            isDraft={notifys.find(n => n.id === values.notifyId)?.saveStatus === "DRAFT"}
                                            disabled={!canWrite} />
                                    </div>
                                )}

                                {activeSubStep === 4 && (
                                    <div className="fade-in">
                                        <Combobox label="Also Notify" items={alsoNotifys} displayKey="name" valueKey="id"
                                            value={values.alsoNotifyId || ""} onChange={(val) => setValue("alsoNotifyId", val)}
                                            onAddNew={canEditRefTables ? () => handleAddNew("ALSO_NOTIFY") : undefined}
                                            onEdit={canEditRefTables ? () => handleEdit("ALSO_NOTIFY", alsoNotifys, values.alsoNotifyId || "") : undefined}
                                            error={errors.alsoNotifyId?.message as string}
                                            isDraft={alsoNotifys.find(a => a.id === values.alsoNotifyId)?.saveStatus === "DRAFT"}
                                            disabled={!canWrite} />
                                    </div>
                                )}

                                {activeSubStep === 5 && (
                                    <div className="fade-in">
                                        <Combobox label="Freight Payer *" items={freightBuyers} displayKey="name" valueKey="id"
                                            value={values.freightBuyerId} onChange={(val) => setValue("freightBuyerId", val)}
                                            onAddNew={canEditRefTables ? () => handleAddNew("FREIGHT_BUYER") : undefined}
                                            onEdit={canEditRefTables ? () => handleEdit("FREIGHT_BUYER", freightBuyers, values.freightBuyerId) : undefined}
                                            error={errors.freightBuyerId?.message as string}
                                            isDraft={freightBuyers.find(f => f.id === values.freightBuyerId)?.saveStatus === "DRAFT"}
                                            disabled={!canWrite} />
                                    </div>
                                )}

                                {activeSubStep === 6 && (
                                    <div className="fade-in">
                                        <Combobox label="Forwarder *" items={forwarders} displayKey="name" valueKey="id"
                                            value={values.forwarderId} onChange={(val) => setValue("forwarderId", val)}
                                            onAddNew={canEditRefTables ? () => handleAddNew("FORWARDER") : undefined}
                                            onEdit={canEditRefTables ? () => handleEdit("FORWARDER", forwarders, values.forwarderId) : undefined}
                                            error={errors.forwarderId?.message as string}
                                            isDraft={forwarders.find(f => f.id === values.forwarderId)?.saveStatus === "DRAFT"}
                                            disabled={!canWrite} />
                                    </div>
                                )}
                            </section>
                        )}

                        {/* ── STEP 3 : Marchandises & Conteneurs ── */}
                        {activeStep === 3 && (
                            <section className="fade-in">
                                {renderSubStepIndicator()}

                                {activeSubStep === 1 && (
                                    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                        <Combobox label="Nature of Goods *" items={goods} displayKey="description" valueKey="id"
                                            value={values.goodsId} onChange={(val) => {
                                                setValue("goodsId", val);
                                                const selected = goods.find(g => g.id === val);
                                                if (selected) setValue("hsCode", selected.hsCode);
                                            }}
                                            onAddNew={canEditRefTables ? () => handleAddNew("GOODS") : undefined}
                                            onEdit={canEditRefTables ? () => handleEdit("GOODS", goods, values.goodsId) : undefined}
                                            error={errors.goodsId?.message as string}
                                            isDraft={goods.find(g => g.id === values.goodsId)?.saveStatus === "DRAFT"}
                                            disabled={!canWrite}
                                            multiline={true} />

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                            <Combobox 
                                                label="Global Container Type *" 
                                                items={typesTc} 
                                                displayKey="name" 
                                                valueKey="name" 
                                                value={values.globalTypeTc} 
                                                onChange={(val) => setValue("globalTypeTc", val)}
                                                error={errors.globalTypeTc?.message as string}
                                                disabled={!canWrite}
                                            />

                                            <Combobox 
                                                label="Global Package Type *" 
                                                items={packageTypes} 
                                                displayKey="name" 
                                                valueKey="name" 
                                                value={values.globalPackageType} 
                                                onChange={(val) => setValue("globalPackageType", val)}
                                                error={errors.globalPackageType?.message as string}
                                                disabled={!canWrite}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeSubStep === 2 && (
                                    <div className="fade-in">
                                        <ContainerTable 
                                            containers={containers} 
                                            setContainers={setContainers} 
                                            disabled={!canWrite}
                                            globalTypeTc={values.globalTypeTc}
                                            globalPackageType={values.globalPackageType}
                                        />
                                    </div>
                                )}
                            </section>
                        )}

                        {/* ── STEP 4 : Récapitulatif ── */}
                        {activeStep === 4 && (
                            <section className="fade-in">
                                <p className="form-section-title">
                                    <Eye size={12} />
                                    Summary & Submission
                                </p>
                                {renderRecapStep()}
                            </section>
                        )}


                    </form>

                    {/* ── NAVIGATION BUTTONS (outside form-container) ── */}
                    <div className="form-nav-buttons">
                        {activeStep > 1 ? (
                            <button type="button" className="btn-outline" onClick={handleBack}>
                                ← Previous
                            </button>
                        ) : (
                            <div />
                        )}

                        {activeStep < 4 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                style={{
                                    background: "linear-gradient(135deg, #E60012 0%, #b8000e 100%)",
                                    color: "#fff",
                                    padding: "0 1.75rem",
                                    height: "42px",
                                    borderRadius: "var(--radius)",
                                    fontWeight: 700,
                                    fontSize: "0.95rem",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                    boxShadow: "0 4px 14px rgba(230,0,18,0.25)",
                                    transition: "all 0.2s",
                                }}
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                type="submit"
                                form="si-form"
                                className="btn-finalize"
                                disabled={isGeneratingPDF || !canWrite}
                            >
                                {isGeneratingPDF ? (
                                    <>
                                        <div className="spinner" style={{ marginRight: "0.5rem" }} />
                                        Generating PDF...
                                    </>
                                ) : (
                                    "✨ Validate & Generate PDF"
                                )}
                            </button>
                        )}
                    </div>

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

            <ConsigneeForm title="Freight Payer" endpoint="/api/freightbuyers"
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
                onAddNewHSCode={() => {
                    // Snapshot current GoodsForm data before switching to HSCode modal
                    setPendingGoodsData(editingEntity);
                    setEditingEntity(null);
                    setIsHSCodeModalOpen(true);
                }}
                onEditHSCode={(id) => {
                    const item = hscodes.find(x => x.id === id);
                    if (item) {
                        // Snapshot current GoodsForm data before switching to HSCode modal
                        setPendingGoodsData(editingEntity);
                        setEditingEntity(item);
                        setIsHSCodeModalOpen(true);
                    }
                }}
                onSuccess={handleSaveList(setGoods, goods, "goodsId")}
                onDelete={handleDeleteList(setGoods, goods, "goodsId")} />

            <HSCodeForm
                title="HS Code"
                isOpen={isHSCodeModalOpen}
                onClose={() => {
                    // Restore GoodsForm data on cancel
                    setIsHSCodeModalOpen(false);
                    setEditingEntity(pendingGoodsData);
                    setPendingGoodsData(null);
                }}
                initialData={pendingGoodsData ? null : editingEntity}
                onSuccess={(item) => {
                    const exists = hscodes.find(x => x.id === item.id);
                    setHscodes(exists ? hscodes.map(x => x.id === item.id ? item : x) : [...hscodes, item]);
                    // Restore GoodsForm data after saving HSCode
                    setIsHSCodeModalOpen(false);
                    setEditingEntity(pendingGoodsData);
                    setPendingGoodsData(null);
                }}
                onDelete={(id) => {
                    setHscodes(hscodes.filter(x => x.id !== id));
                    setIsHSCodeModalOpen(false);
                    setEditingEntity(pendingGoodsData);
                    setPendingGoodsData(null);
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
                endpoint="/api/typetc" entityName="Container Type"
                idField="typeTcId" entities={typesTc} setEntities={setTypesTc}
                initialData={editingEntity} />

            <AlsoNotifyForm
                title="Also Notify"
                isOpen={activeModal === "ALSO_NOTIFY"} onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={(saved) => {
                    const isEditing = !!editingEntity;
                    const newList = isEditing 
                        ? alsoNotifys.map(e => e.id === saved.id ? saved : e)
                        : [...alsoNotifys, saved];
                    
                    setConsignees(newList);
                    setNotifys(newList);
                    setAlsoNotifys(newList);
                    setValue("alsoNotifyId", saved.id);
                    setActiveModal(null);
                }}
                onDelete={handleDeleteList(setAlsoNotifys, alsoNotifys, "alsoNotifyId")}
                maxWidth="800px" />

            <SmallGenericForm
                title=""
                isOpen={activeModal === "PACKAGE_TYPE"} onClose={() => setActiveModal(null)}
                endpoint="/api/packagetypes" entityName="Package Type"
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
                                padding: "0.4rem 0",
                                background: "white",
                                backgroundColor: "white",
                                color: "#1a1c21",
                                borderRadius: "0",
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
