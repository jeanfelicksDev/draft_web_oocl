import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import * as XLSX from 'xlsx';
import toast from "react-hot-toast";
import { FileUp } from "lucide-react";

const containerSchema = yup.object().shape({
    containerNum: yup.string().required("N° Conteneur requis"),
    typeTc: yup.string().required("Type TC requis"),
    sealNum: yup.string().required("Plomb requis"),
    count: yup.number().typeError("Doit être un nombre").required("Nombre requis"),
    packageType: yup.string().required("Package requis"),
    grossWeight: yup.number().typeError("Doit être un nombre").required("Poids brut requis"),
    netWeight: yup.number().typeError("Doit être un nombre").required("Poids net requis"),
    volume: yup.number().typeError("Doit être un nombre").required("Volume requis"),
});

export function ContainerTable({
    containers,
    setContainers
}: {
    containers: any[],
    setContainers: React.Dispatch<React.SetStateAction<any[]>>
}) {
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(containerSchema)
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const values = watch();
    const fc = (val: any) => (val && val !== "" ? "input-filled" : "");

    const onSubmit = (data: any) => {
        if (editingId) {
            setContainers(containers.map(c => c.id === editingId ? { ...data, id: editingId } : c));
            setEditingId(null);
        } else {
            setContainers([...containers, { ...data, id: crypto.randomUUID() }]);
        }
        reset();
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

                // Skip header row if first cell is string "CONTENEUR" or similar
                const startRow = (String(data[0][0]).toLowerCase().includes('conteneur')) ? 1 : 0;
                
                const newContainers = data.slice(startRow)
                    .filter(row => row.length >= 8 && row[0]) // Basic validation: at least 8 columns and a container number
                    .map(row => ({
                        id: crypto.randomUUID(),
                        containerNum: String(row[0] || ""),
                        typeTc: String(row[1] || ""),
                        sealNum: String(row[2] || ""),
                        count: parseFloat(String(row[3] || "0")) || 0,
                        packageType: String(row[4] || ""),
                        grossWeight: parseFloat(String(row[5] || "0")) || 0,
                        netWeight: parseFloat(String(row[6] || "0")) || 0,
                        volume: parseFloat(String(row[7] || "0")) || 0
                    }));

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

    const editContainer = (container: any) => {
        setEditingId(container.id);
        setValue("containerNum", container.containerNum);
        setValue("typeTc", container.typeTc);
        setValue("sealNum", container.sealNum);
        setValue("count", container.count);
        setValue("packageType", container.packageType);
        setValue("grossWeight", container.grossWeight);
        setValue("netWeight", container.netWeight);
        setValue("volume", container.volume);
    };

    const cancelEdit = () => {
        setEditingId(null);
        reset();
    };

    const removeContainer = (id: string) => {
        if (editingId === id) cancelEdit();
        setContainers(containers.filter(c => c.id !== id));
    };

    return (
        <div className="container-list-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    Liste des Conteneurs
                    {editingId && <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--primary)', fontStyle: 'italic' }}>(Mode édition actif)</span>}
                </h3>
                
                <div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleExcelImport} 
                        accept=".xlsx, .xls" 
                        style={{ display: 'none' }} 
                    />
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-outline"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: '#22c55e', color: '#16a34a' }}
                    >
                        <FileUp size={14} />
                        Importer Excel
                    </button>
                </div>
            </div>

            <div className="table-responsive">
                <table className="container-table">
                    <colgroup>
                        <col className="col-conteneur" />
                        <col style={{ width: '10%' }} />
                        <col className="col-plomb" />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '6%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Conteneur</th>
                            <th>Type TC</th>
                            <th>N° Plomb</th>
                            <th>Nbre</th>
                            <th>Package</th>
                            <th>Gross. W</th>
                            <th>Poids Net</th>
                            <th>Volume</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {containers.map((c) => (
                            <tr key={c.id} style={editingId === c.id ? { backgroundColor: 'var(--bg-blue-light)' } : {}}>
                                <td>{c.containerNum}</td>
                                <td>{c.typeTc}</td>
                                <td>{c.sealNum}</td>
                                <td>{c.count}</td>
                                <td>{c.packageType}</td>
                                <td>{c.grossWeight}</td>
                                <td>{c.netWeight}</td>
                                <td>{c.volume}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                        <button 
                                            type="button" 
                                            className="btn-remove" 
                                            title="Modifier"
                                            onClick={() => editContainer(c)}
                                            style={{ color: 'var(--primary)' }}
                                        >
                                            ✎
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn-remove" 
                                            title="Supprimer"
                                            onClick={() => removeContainer(c.id)}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {/* Input Row / Edit Row */}
                        <tr style={{ backgroundColor: editingId ? 'rgba(230, 0, 18, 0.05)' : 'white' }}>
                            <td>
                                <input {...register("containerNum")} className={fc(values.containerNum)} placeholder="N° Conteneur" />
                            </td>
                            <td>
                                <input {...register("typeTc")} className={fc(values.typeTc)} placeholder="Type" />
                            </td>
                            <td>
                                <input {...register("sealNum")} className={fc(values.sealNum)} placeholder="Plomb" />
                            </td>
                            <td>
                                <input {...register("count")} type="number" className={fc(values.count)} placeholder="Qté" />
                            </td>
                            <td>
                                <input {...register("packageType")} className={fc(values.packageType)} placeholder="Pckg" />
                            </td>
                            <td>
                                <input {...register("grossWeight")} type="number" step="0.01" className={fc(values.grossWeight)} placeholder="Gross" />
                            </td>
                            <td>
                                <input {...register("netWeight")} type="number" step="0.01" className={fc(values.netWeight)} placeholder="Net" />
                            </td>
                            <td>
                                <input {...register("volume")} type="number" step="0.01" className={fc(values.volume)} placeholder="Vol" />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                {editingId ? (
                                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                        <button type="button" onClick={handleSubmit(onSubmit)} className="btn-success" title="Appliquer" style={{ padding: '0.4rem 0.6rem' }}>✓</button>
                                        <button type="button" onClick={cancelEdit} className="btn-remove" title="Annuler" style={{ padding: '0.4rem 0.6rem', background: '#ccc', color: '#000' }}>✕</button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={handleSubmit(onSubmit)} className="btn-success" style={{ padding: '0.4rem 0.8rem' }}>+</button>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {(Object.keys(errors).length > 0) && (
                <div className="error-msg" style={{ marginTop: '10px' }}>
                    Veuillez remplir correctement tous les champs de la ligne.
                </div>
            )}
        </div>
    );
}
