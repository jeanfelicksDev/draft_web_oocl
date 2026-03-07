import * as fs from 'fs';

const file = 'components/MainPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Rename editingShipper to editingEntity
content = content.replace('const [editingShipper, setEditingShipper] = useState<any>(null);', 'const [editingEntity, setEditingEntity] = useState<any>(null);\n\n    const handleAddNew = (modalKey: string) => { setEditingEntity(null); setActiveModal(modalKey); };\n    const handleEdit = (modalKey: string, list: any[], id: string) => { const item = list.find(x => x.id === id); if(item) { setEditingEntity(item); setActiveModal(modalKey); } };\n    const handleSaveList = (setter: any, list: any[], field: any) => (item: any) => { const exists = list.find(x => x.id === item.id); setter(exists ? list.map(x => x.id === item.id ? item : x) : [...list, item]); setValue(field, item.id); setActiveModal(null); };\n    const handleGenericSave = (endpoint: string, setter: any, list: any[], field: any) => async (data: any) => { const isEdit = !!editingEntity?.id; const url = isEdit ?  + "" + $ + "$" + {endpoint}/$ + "$" + {editingEntity.id} + "" +  : endpoint; const res = await fetch(url, { method: isEdit ? \"PUT\" : \"POST\", headers: { \"Content-Type\": \"application/json\" }, body: JSON.stringify(data) }); if (res.ok) { const item = await res.json(); const exists = list.find(x => x.id === item.id); setter(exists ? list.map(x => x.id === item.id ? item : x) : [...list, item]); setValue(field, item.id); setActiveModal(null); } };');

// 2. Fix Combobox usages
content = content.replace(/onAddNew=\{\(\) => setActiveModal\(\"([^\"]+)\"\)\}/g, 'onAddNew={() => handleAddNew(\"\")}');

content = content.replace(/onAddNew=\{\(\) => \{\s*setEditingShipper\(null\);\s*setActiveModal\(\"SHIPPER\"\);\s*\}\}/, 'onAddNew={() => handleAddNew(\"SHIPPER\")}');
content = content.replace(/onEdit=\{\(\) => \{\s*const selected = shippers.find\(s => s.id === values.shipperId\);\s*if \(selected\) \{\s*setEditingShipper\(selected\);\s*setActiveModal\(\"SHIPPER_EDIT\"\);\s*\}\s*\}\}/, 'onEdit={() => handleEdit(\"SHIPPER\", shippers, values.shipperId)}');

content = content.replace(/<Combobox\s*label=\"Consignee(.*?)onAddNew=\{\(\) => handleAddNew\(\"CONSIGNEE\"\)\}/s, '<Combobox label=\"Consignee={() => handleAddNew(\"CONSIGNEE\")}\n                            onEdit={() => handleEdit(\"CONSIGNEE\", consignees, values.consigneeId)}');

content = content.replace(/<Combobox\s*label=\"Notify(.*?)onAddNew=\{\(\) => handleAddNew\(\"NOTIFY\"\)\}/s, '<Combobox label=\"Notify={() => handleAddNew(\"NOTIFY\")}\n                            onEdit={() => handleEdit(\"NOTIFY\", notifys, values.notifyId)}');

content = content.replace(/<Combobox\s*label=\"Also Notify(.*?)onAddNew=\{\(\) => handleAddNew\(\"ALSO_NOTIFY\"\)\}/s, '<Combobox label=\"Also Notify={() => handleAddNew(\"ALSO_NOTIFY\")}\n                            onEdit={() => handleEdit(\"ALSO_NOTIFY\", alsoNotifys, values.alsoNotifyId)}');

content = content.replace(/<Combobox\s*label=\"Freight Buyer(.*?)onAddNew=\{\(\) => handleAddNew\(\"FREIGHT_BUYER\"\)\}/s, '<Combobox label=\"Freight Buyer={() => handleAddNew(\"FREIGHT_BUYER\")}\n                            onEdit={() => handleEdit(\"FREIGHT_BUYER\", freightBuyers, values.freightBuyerId)}');

content = content.replace(/<Combobox\s*label=\"Forwarder(.*?)onAddNew=\{\(\) => handleAddNew\(\"FORWARDER\"\)\}/s, '<Combobox label=\"Forwarder={() => handleAddNew(\"FORWARDER\")}\n                            onEdit={() => handleEdit(\"FORWARDER\", forwarders, values.forwarderId)}');

content = content.replace(/<Combobox\s*label=\"Description of Goods(.*?)onAddNew=\{\(\) => handleAddNew\(\"GOODS\"\)\}/s, '<Combobox label=\"Description of Goods={() => handleAddNew(\"GOODS\")}\n                            onEdit={() => handleEdit(\"GOODS\", goods, values.goodsId)}');

content = content.replace(/<Combobox\s*label=\"Type Released(.*?)onAddNew=\{\(\) => handleAddNew\(\"TYPE_RELEASED\"\)\}/s, '<Combobox label=\"Type Released={() => handleAddNew(\"TYPE_RELEASED\")}\n                                onEdit={() => handleEdit(\"TYPE_RELEASED\", typesReleased, values.typeReleasedId)}');

content = content.replace(/<Combobox\s*label=\"Port of Discharge(.*?)onAddNew=\{\(\) => handleAddNew\(\"PORT\"\)\}/s, '<Combobox label=\"Port of Discharge={() => handleAddNew(\"PORT\")}\n                                onEdit={() => handleEdit(\"PORT\", ports, values.portId)}');

content = content.replace(/<Combobox\s*label=\"Place of Delivery(.*?)onAddNew=\{\(\) => handleAddNew\(\"CITY\"\)\}/s, '<Combobox label=\"Place of Delivery={() => handleAddNew(\"CITY\")}\n                                onEdit={() => handleEdit(\"CITY\", cities, values.cityId)}');


// 3. Fix Modals
const modalsRegex = /\{\/\* --- ALL MODALS FOR DYNAMIC ENTITY CREATION --- \*\/\}.*$/s;

const newModals =  + "" + 
            {/* --- ALL MODALS FOR DYNAMIC ENTITY CREATION --- */}

            <ShipperForm
                isOpen={activeModal === "SHIPPER"}
                onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setShippers, shippers, "shipperId")}
            />

            <ConsigneeForm
                title="Nouveau Consignee"
                endpoint="/api/consignees"
                isOpen={activeModal === "CONSIGNEE"}
                onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setConsignees, consignees, "consigneeId")}
            />

            <ConsigneeForm
                title="Nouveau Notify"
                endpoint="/api/notify"
                isOpen={activeModal === "NOTIFY"}
                onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setNotifys, notifys, "notifyId")}
            />

            <ConsigneeForm
                title="Nouveau Freight Buyer"
                endpoint="/api/freightbuyers"
                isOpen={activeModal === "FREIGHT_BUYER"}
                onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setFreightBuyers, freightBuyers, "freightBuyerId")}
            />

            <ConsigneeForm
                title="Nouveau Forwarder"
                endpoint="/api/forwarders"
                isOpen={activeModal === "FORWARDER"}
                onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setForwarders, forwarders, "forwarderId")}
            />

            <GoodsForm
                isOpen={activeModal === "GOODS"}
                onClose={() => setActiveModal(null)}
                initialData={editingEntity}
                onSuccess={handleSaveList(setGoods, goods, "goodsId")}
            />

            {/* Small generic Modal: PORT, CITY, TYPERELEASED, ALSONOTIFY */}
            <ModalForm
                title={editingEntity ? "Modifier un Port" : "Ajouter un Port"}
                isOpen={activeModal === "PORT"}
                onClose={() => setActiveModal(null)}
                schema={basicSchema}
                defaultValues={editingEntity || { name: "" }}
                onSubmit={handleGenericSave("/api/ports", setPorts, ports, "portId")}
            >
                {(register, errors) => (
                    <div>
                        <label>Nom du Port *</label>
                        <input {...register("name")} />
                        {errors.name && <span className="error-msg">{errors.name.message}</span>}
                    </div>
                )}
            </ModalForm>

            <ModalForm
                title={editingEntity ? "Modifier Type Released" : "Ajouter Type Released (MBL/HBL..)"}
                isOpen={activeModal === "TYPE_RELEASED"}
                onClose={() => setActiveModal(null)}
                schema={basicSchema}
                defaultValues={editingEntity || { name: "" }}
                onSubmit={handleGenericSave("/api/typereleased", setTypesReleased, typesReleased, "typeReleasedId")}
            >
                {(register, errors) => (
                    <div>
                        <label>Type Released *</label>
                        <input {...register("name")} />
                    </div>
                )}
            </ModalForm>

            <ModalForm
                title={editingEntity ? "Modifier Place of Delivery" : "Ajouter Place of Delivery (City)"}
                isOpen={activeModal === "CITY"}
                onClose={() => setActiveModal(null)}
                schema={basicSchema}
                defaultValues={editingEntity || { name: "" }}
                onSubmit={handleGenericSave("/api/cities", setCities, cities, "cityId")}
            >
                {(register, errors) => (
                    <div>
                        <label>Nom de la ville *</label>
                        <input {...register("name")} />
                    </div>
                )}
            </ModalForm>

            <ModalForm
                title={editingEntity ? "Modifier Also Notify" : "Ajouter Also Notify"}
                isOpen={activeModal === "ALSO_NOTIFY"}
                onClose={() => setActiveModal(null)}
                schema={yup.object().shape({ description: yup.string().required() })}
                defaultValues={editingEntity || { description: "" }}
                onSubmit={handleGenericSave("/api/alsonotify", setAlsoNotifys, alsoNotifys, "alsoNotifyId")}
            >
                {(register, errors) => (
                    <div>
                        <label>Description (Also Notify) *</label>
                        <textarea rows={3} {...register("description")} />
                    </div>
                )}
            </ModalForm>

        </div>
    );
}
 + "" + ;

content = content.replace(modalsRegex, newModals);

fs.writeFileSync(file, content);
