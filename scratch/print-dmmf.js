const { Prisma } = require("@prisma/client");

const model = Prisma.dmmf.datamodel.models.find(m => m.name === "BillOfLading");
if (model) {
    console.log("FIELDS:", model.fields.map(f => f.name));
} else {
    console.log("BillOfLading model not found in DMMF!");
}
