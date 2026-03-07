"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

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
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
        resolver: yupResolver(containerSchema)
    });

    const values = watch();
    const fc = (val: any) => (val && val !== "" ? "input-filled" : "");

    const onSubmit = (data: any) => {
        setContainers([...containers, { ...data, id: crypto.randomUUID() }]);
        reset();
    };

    const removeContainer = (id: string) => {
        setContainers(containers.filter(c => c.id !== id));
    };

    return (
        <div className="container-list-section">
            <h3>Liste des Conteneurs</h3>

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
                        <col style={{ width: '4%' }} />
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
                            <tr key={c.id}>
                                <td>{c.containerNum}</td>
                                <td>{c.typeTc}</td>
                                <td>{c.sealNum}</td>
                                <td>{c.count}</td>
                                <td>{c.packageType}</td>
                                <td>{c.grossWeight}</td>
                                <td>{c.netWeight}</td>
                                <td>{c.volume}</td>
                                <td>
                                    <button type="button" className="btn-remove" onClick={() => removeContainer(c.id)}>
                                        &times;
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {/* Input Row */}
                        <tr>
                            <td>
                                <input {...register("containerNum")} className={fc(values.containerNum)} />
                            </td>
                            <td>
                                <input {...register("typeTc")} className={fc(values.typeTc)} />
                            </td>
                            <td>
                                <input {...register("sealNum")} className={fc(values.sealNum)} />
                            </td>
                            <td>
                                <input {...register("count")} type="number" className={fc(values.count)} />
                            </td>
                            <td>
                                <input {...register("packageType")} className={fc(values.packageType)} />
                            </td>
                            <td>
                                <input {...register("grossWeight")} type="number" step="0.01" className={fc(values.grossWeight)} />
                            </td>
                            <td>
                                <input {...register("netWeight")} type="number" step="0.01" className={fc(values.netWeight)} />
                            </td>
                            <td>
                                <input {...register("volume")} type="number" step="0.01" className={fc(values.volume)} />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <button type="button" onClick={handleSubmit(onSubmit)} className="btn-success" style={{ padding: '0.4rem 0.8rem' }}>+</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {(Object.keys(errors).length > 0) && (
                <div className="error-msg" style={{ marginTop: '10px' }}>
                    Veuillez remplir correctement tous les champs de la ligne d&apos;ajout.
                </div>
            )}
        </div>
    );
}
