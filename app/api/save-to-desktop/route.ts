import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(request: Request) {
    try {
        const { filename, base64 } = await request.json();
        if (!filename || !base64) {
            return NextResponse.json({ error: "Filename and base64 content required" }, { status: 400 });
        }

        // Target directory on Desktop
        const desktopPath = path.join(os.homedir(), "Desktop", "MesDraftsOOCL");
        
        // Create directory if not exists
        if (!fs.existsSync(desktopPath)) {
            fs.mkdirSync(desktopPath, { recursive: true });
        }

        const filePath = path.join(desktopPath, filename);
        
        // Decode base64 to buffer
        const buffer = Buffer.from(base64, 'base64');
        
        // Write file
        fs.writeFileSync(filePath, buffer);

        return NextResponse.json({ success: true, path: filePath });
    } catch (error: any) {
        console.error("Error saving to desktop:", error);
        return NextResponse.json({ error: "Failed to save to desktop", details: error.message }, { status: 500 });
    }
}
