const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'app/api');
const routes = [
    'forwarders/route.ts',
    'freightbuyers/route.ts',
    'goods/route.ts',
    'ports/route.ts'
];

const template = (modelName) => `import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-utils";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const list = await prisma.${modelName}.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(list);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        const newItem = await prisma.${modelName}.create({
            data: { ...data, userId },
        });
        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}
`;

const modelsMapping = {
    'forwarders/route.ts': 'forwarder',
    'freightbuyers/route.ts': 'freightBuyer',
    'goods/route.ts': 'goods',
    'ports/route.ts': 'port'
};

for (const [route, model] of Object.entries(modelsMapping)) {
    const fullPath = path.join(apiDir, route);
    fs.writeFileSync(fullPath, template(model));
    console.log(`Updated ${fullPath}`);
}
