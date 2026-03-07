import fs from 'fs';
import path from 'path';

const models = {
    'shippers': 'shipper',
    'consignees': 'consignee',
    'notify': 'notify',
    'alsonotify': 'alsoNotify',
    'freightbuyers': 'freightBuyer',
    'forwarders': 'forwarder',
    'ports': 'port',
    'cities': 'city',
    'goods': 'goods',
    'typereleased': 'typeReleased'
};

for (const [folder, model] of Object.entries(models)) {
    const file = path.join('app', 'api', folder, '[id]', 'route.ts');
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        if (!content.includes('export async function DELETE')) {
            const patch = "\n\n" + "export async function DELETE(\n" +
"    request: Request,\n" +
"    { params }: { params: Promise<{ id: string }> }\n" +
") {\n" +
"    try {\n" +
"        const { id } = await params;\n" +
"        await prisma." + model + ".delete({ where: { id } });\n" +
"        return NextResponse.json({ success: true }, { status: 200 });\n" +
"    } catch (error) {\n" +
"        console.error('Error deleting:', error);\n" +
"        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });\n" +
"    }\n" +
"}\n";
            fs.writeFileSync(file, content + patch);
            console.log("Updated", file);
        }
    } else {
        console.log("Not found:", file);
    }
}
