import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import * as XLSX from 'xlsx';
import toast from "react-hot-toast";
import { FileUp, PlusCircle, Trash2, Edit } from "lucide-react";

const containerSchema = yup.object().shape({
    containerNum: yup.string()
        .required("N° Conteneur requis")
        .length(11, "Doit faire 11 caractères")
        .matches(/^[A-Z]{4}[0-9]{7}$/, "Format: 4 lettres + 7 chiffres (ex: MEDU1234567)"),
    typeTc: yup.string().optional().nullable(),
    sealNum: yup.string().required("N° Plomb requis").max(11, "Max 11 caractères"),
    count: yup.number()
        .typeError("Doit être un nombre")
        .required("Nombre de colis requis")
        .integer("Doit être un nombre entier")
        .min(1, "Minimum 1")
        .transform((val, orig) => orig === "" ? null : val),
    packageType: yup.string().optional().nullable(),
    grossWeight: yup.number()
        .typeError("Doit être un nombre")
        .required("Poids brut requis")
        .min(1, "Minimum 1")
        .transform((val, orig) => orig === "" ? null : val)
        .test("max-weight", "Poids max dépassé", function (val) {
            const { typeTc } = this.parent;
            if (!val || !typeTc) return true;
            if (typeTc.startsWith("20") && val > 28000) return false;
            if (typeTc.startsWith("40") && val > 37000) return false;
            return true;
        })
        .test("gross-gt-net", "Brut < Net", function (val) {
            const { netWeight } = this.parent;
            if (!val || netWeight === undefined || netWeight === null) return true;
            return val > netWeight;
        }),
    netWeight: yup.number()
        .typeError("Doit être un nombre")
        .nullable()
        .transform((value, originalValue) => (originalValue === "" ? null : value)),
    volume: yup.number()
        .typeError("Doit être un nombre")
        .nullable()
        .transform((value, originalValue) => (originalValue === "" ? null : value)),
});

export function ContainerTable({
    containers,
    setContainers,
    disabled = false,
    globalTypeTc = "",
    globalPackageType = ""
}: {
    containers: any[],
    setContainers: React.Dispatch<React.SetStateAction<any[]>>,
    disabled?: boolean,
    globalTypeTc?: string,
    globalPackageType?: string
}) {
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        mode: "onBlur",
        resolver: yupResolver(containerSchema),
        defaultValues: {
            containerNum: "",
            typeTc: "",
            sealNum: "",
            count: undefined,
            packageType: "",
            grossWeight: undefined,
            netWeight: undefined,
            volume: undefined
        }
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleContainerInput = (e: React.FormEvent<HTMLInputElement>) => {
        let val = e.currentTarget.value.toUpperCase();
        let letters = val.slice(0, 4).replace(/[^A-Z]/g, '');
        let numbers = val.slice(4, 11).replace(/[^0-9]/g, '');
        const final = letters + numbers;
        e.currentTarget.value = final;
        setValue("containerNum", final);
    };

    const openAddModal = () => {
        setEditingId(null);
        reset({
            containerNum: "",
            typeTc: globalTypeTc,
            sealNum: "",
            count: undefined,
            packageType: globalPackageType,
            grossWeight: undefined,
            netWeight: undefined,
            volume: undefined
        });
        setIsModalOpen(true);
    };

    const editContainer = (container: any) => {
        setEditingId(container.id);
        reset({
            containerNum: container.containerNum,
            typeTc: globalTypeTc || container.typeTc,
            sealNum: container.sealNum,
            count: container.count,
            packageType: globalPackageType || container.packageType,
            grossWeight: container.grossWeight,
            netWeight: container.netWeight ?? "",
            volume: container.volume ?? ""
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset();
    };

    const onSubmit = (data: any) => {
        const payload = {
            ...data,
            typeTc: globalTypeTc || data.typeTc || "",
            packageType: globalPackageType || data.packageType || "",
            netWeight: data.netWeight === null ? undefined : data.netWeight,
            volume: data.volume === null ? undefined : data.volume,
        };

        if (editingId) {
            setContainers(containers.map(c => c.id === editingId ? { ...payload, id: editingId } : c));
        } else {
            setContainers([...containers, { ...payload, id: crypto.randomUUID() }]);
        }
        closeModal();
    };

    const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

                if (data.length < 2) {
                    toast.error("Le fichier Excel semble vide ou mal formé.");
                    return;
                }

                // Détecter s'il y a un en-tête (s'il contient le mot "conteneur" ou "numéro")
                const startRow = (String(data[0][0]).toLowerCase().includes('conteneur') || String(data[0][0]).toLowerCase().includes('number')) ? 1 : 0;
                
                // Ordre attendu :
                // 0: Numero de Conteneur*
                // 1: Plomb*
                // 2: nombre de colis*
                // 3: Poids brut*
                // 4: Poids net
                // 5: Volume
                const newContainers = data.slice(startRow)
                    .filter(row => row.length >= 4 && row[0])
                    .map(row => {
                        const containerNum = String(row[0] || "").trim().toUpperCase();
                        const sealNum = String(row[1] || "").trim();
                        const count = parseInt(String(row[2] || "0"), 10) || 0;
                        const grossWeight = parseFloat(String(row[3] || "0")) || 0;
                        const netWeight = row[4] !== undefined && row[4] !== null && row[4] !== "" ? parseFloat(String(row[4])) : undefined;
                        const volume = row[5] !== undefined && row[5] !== null && row[5] !== "" ? parseFloat(String(row[5])) : undefined;

                        return {
                            id: crypto.randomUUID(),
                            containerNum,
                            sealNum,
                            count,
                            grossWeight,
                            netWeight,
                            volume,
                            typeTc: globalTypeTc,
                            packageType: globalPackageType
                        };
                    });

                if (newContainers.length === 0) {
                    toast.error("Aucune donnée valide trouvée dans le fichier.");
                } else {
                    setContainers([...containers, ...newContainers]);
                    toast.success(`${newContainers.length} conteneurs importés.`);
                }
            } catch (err) {
                console.error(err);
                toast.error("Erreur lors de la lecture du fichier Excel.");
            }
        };
        reader.readAsBinaryString(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeContainer = (id: string) => {
        setContainers(containers.filter(c => c.id !== id));
    };

    return (
        <div className="container-list-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.1rem' }}>
                    Liste des Conteneurs ({containers.length})
                </h3>
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleExcelImport} 
                        accept=".xlsx, .xls" 
                        style={{ display: 'none' }} 
                    />
                    {!disabled && (
                        <>
                            <button 
                                type="button"
                                onClick={openAddModal}
                                className="btn-outline"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                            >
                                <PlusCircle size={14} style={{ marginRight: '0.25rem' }} />
                                Ajouter un conteneur
                            </button>
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="btn-outline"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderColor: '#22c55e', color: '#16a34a' }}
                            >
                                <FileUp size={14} style={{ marginRight: '0.25rem' }} />
                                Importer Excel
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="table-responsive">
                <table className="container-table">
                    <colgroup>
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '11%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '10%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Conteneur</th>
                            <th>Type TC</th>
                            <th>N° Plomb</th>
                            <th>Nbre Colis</th>
                            <th>Colisage</th>
                            <th>Poids Brut</th>
                            <th>Poids Net</th>
                            <th>Volume</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {containers.length === 0 ? (
                            <tr>
                                <td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '2rem' }}>
                                    Aucun conteneur ajouté pour le moment.
                                </td>
                            </tr>
                        ) : (
                            containers.map((c) => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 600 }}>{c.containerNum}</td>
                                    <td>{c.typeTc || globalTypeTc || '-'}</td>
                                    <td>{c.sealNum}</td>
                                    <td>{c.count}</td>
                                    <td>{c.packageType || globalPackageType || '-'}</td>
                                    <td>{c.grossWeight} kg</td>
                                    <td>{c.netWeight ? `${c.netWeight} kg` : '-'}</td>
                                    <td>{c.volume ? `${c.volume} cbm` : '-'}</td>
                                    {!disabled ? (
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button 
                                                    type="button" 
                                                    onClick={() => editContainer(c)}
                                                    style={{ border: 'none', background: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.25rem' }}
                                                    title="Modifier"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeContainer(c.id)}
                                                    style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    ) : (
                                        <td>-</td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ════════════════ MODAL POPUP FOR CONTAINER ADD/EDIT ════════════════ */}
            {isModalOpen && mounted && createPortal(
                <div className="custom-modal-overlay">
                    <div className="custom-modal-content">
                        <div className="custom-modal-header">
                            <h3 className="custom-modal-title">
                                {editingId ? "Modifier le conteneur" : "Ajouter un conteneur"}
                            </h3>
                            <button type="button" className="custom-modal-close" onClick={closeModal}>✕</button>
                        </div>
                        <div className="custom-modal-body">
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div>
                                    <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>Numéro de Conteneur *</label>
                                    <input 
                                        {...register("containerNum")} 
                                        onInput={handleContainerInput}
                                        placeholder="ex: MEDU1234567" 
                                        maxLength={11} 
                                        style={{ width: "100%", height: "40px", padding: "0.5rem", borderRadius: "8px", border: errors.containerNum ? "1.5px solid var(--danger)" : "1.5px solid #cbd5e1" }}
                                    />
                                    {errors.containerNum && <span style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "0.25rem", display: "block" }}>{errors.containerNum.message}</span>}
                                </div>

                                <div>
                                    <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>N° Plomb *</label>
                                    <input 
                                        {...register("sealNum")} 
                                        placeholder="ex: SEAL987654" 
                                        maxLength={11} 
                                        style={{ width: "100%", height: "40px", padding: "0.5rem", borderRadius: "8px", border: errors.sealNum ? "1.5px solid var(--danger)" : "1.5px solid #cbd5e1" }}
                                    />
                                    {errors.sealNum && <span style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "0.25rem", display: "block" }}>{errors.sealNum.message}</span>}
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div>
                                        <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>Nombre de colis *</label>
                                        <input 
                                            {...register("count")} 
                                            type="number"
                                            placeholder="ex: 150" 
                                            style={{ width: "100%", height: "40px", padding: "0.5rem", borderRadius: "8px", border: errors.count ? "1.5px solid var(--danger)" : "1.5px solid #cbd5e1" }}
                                        />
                                        {errors.count && <span style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "0.25rem", display: "block" }}>{errors.count.message}</span>}
                                    </div>

                                    <div>
                                        <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>Poids Brut (kg) *</label>
                                        <input 
                                            {...register("grossWeight")} 
                                            type="number"
                                            step="0.01"
                                            placeholder="ex: 12500" 
                                            style={{ width: "100%", height: "40px", padding: "0.5rem", borderRadius: "8px", border: errors.grossWeight ? "1.5px solid var(--danger)" : "1.5px solid #cbd5e1" }}
                                        />
                                        {errors.grossWeight && <span style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "0.25rem", display: "block" }}>{errors.grossWeight.message}</span>}
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div>
                                        <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>Poids Net (kg)</label>
                                        <input 
                                            {...register("netWeight")} 
                                            type="number"
                                            step="0.01"
                                            placeholder="ex: 12000" 
                                            style={{ width: "100%", height: "40px", padding: "0.5rem", borderRadius: "8px", border: "1.5px solid #cbd5e1" }}
                                        />
                                        {errors.netWeight && <span style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "0.25rem", display: "block" }}>{errors.netWeight.message}</span>}
                                    </div>

                                    <div>
                                        <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>Volume (cbm)</label>
                                        <input 
                                            {...register("volume")} 
                                            type="number"
                                            step="0.01"
                                            placeholder="ex: 32.5" 
                                            style={{ width: "100%", height: "40px", padding: "0.5rem", borderRadius: "8px", border: "1.5px solid #cbd5e1" }}
                                        />
                                        {errors.volume && <span style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "0.25rem", display: "block" }}>{errors.volume.message}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="custom-modal-footer">
                            <button type="button" className="btn-outline" onClick={closeModal} style={{ height: "38px" }}>Annuler</button>
                            <button type="button" className="btn-success" onClick={handleSubmit(onSubmit)} style={{ height: "38px", color: "#ffffff", padding: "0 1.5rem" }}>
                                {editingId ? "Enregistrer" : "Ajouter"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

