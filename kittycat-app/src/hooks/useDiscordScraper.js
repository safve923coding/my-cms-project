import { useState, useCallback } from 'react';

const USER_TOKEN = import.meta.env.VITE_DISCORD_TOKEN;
const CHANNEL_ID = "1413264497623175283";
const DISCORD_API = "https://discord.com/api/v9";
const HEADERS = {
    "Authorization": USER_TOKEN,
    "Content-Type": "application/json"
};

const delay = ms => new Promise(res => setTimeout(res, ms));

function parseCase(msg) {
    let content = msg.content || "";

    if (!content && msg.embeds && msg.embeds.length > 0) {
        const desc = msg.embeds[0].description;
        if (desc) content = desc;
    }

    if (!content) return null;

    const jailMatch = content.match(/(.+?)\s+ถูกจำคุก\s+เป็นเวลา\s+(\d+)\s+นาที\s+และถูกปรับเป็นจำนวน\s+([\d,]+)\$/);
    if (!jailMatch) return null;

    const officerMatch = content.match(/ชื่อ\s*:\s*(.+)/);
    const officerName = officerMatch ? officerMatch[1].trim() : "Unknown";

    return {
        officerName,
        timestamp: msg.timestamp || "",
        messageId: msg.id || ""
    };
}

export function useDiscordScraper() {
    const [fetching, setFetching] = useState(false);
    const [progress, setProgress] = useState('');
    const [fetchError, setFetchError] = useState(null);

    const fetchNewCases = useCallback(async (existingCases = []) => {
        setFetching(true);
        setFetchError(null);
        setProgress('กำลังเชื่อมต่อฐานข้อมูล Discord...');
        let newCasesCount = 0;

        try {
            // Find the most recent message ID from the existing cases
            let lastId = null;
            if (existingCases.length > 0) {
                // messages might not be perfectly sorted, find max id safely
                lastId = existingCases.reduce((max, c) => (BigInt(c.messageId || 0) > BigInt(max || 0) ? c.messageId : max), existingCases[0].messageId);
            }

            const existingIds = new Set(existingCases.map(c => c.messageId));
            let allNewMessages = [];
            let currentAfter = lastId;

            setProgress(lastId ? 'กำลังดึงคดีใหม่...' : 'กำลังดึงข้อมูลคดีทั้งหมด (อาจใช้เวลาสักครู่)...');

            while (true) {
                let url = `${DISCORD_API}/channels/${CHANNEL_ID}/messages?limit=100`;
                if (currentAfter) {
                    url += `&after=${currentAfter}`;
                }

                const response = await fetch(url, { headers: HEADERS });

                if (response.ok) {
                    const messages = await response.json();
                    if (!messages || messages.length === 0) break;

                    allNewMessages = allNewMessages.concat(messages);

                    if (messages.length < 100) break;

                    const maxId = messages.reduce((max, msg) => BigInt(msg.id) > BigInt(max) ? msg.id : max, "0");
                    currentAfter = maxId;

                    setProgress(`เจอข้อมูล ${allNewMessages.length} คดี...`);
                    await delay(500);

                } else if (response.status === 429) {
                    const data = await response.json();
                    const retryAfter = data.retry_after || 5;
                    setProgress(`API Limit... รอ ${retryAfter} วินาที...`);
                    await delay(retryAfter * 1000);
                } else if (response.status === 401 || response.status === 403) {
                    throw new Error('โทเคน Discord หมดอายุ หรือไม่มีสิทธิ์เข้าถึงห้อง');
                } else {
                    throw new Error(`การเชื่อมต่อขัดข้อง Status: ${response.status}`);
                }
            }

            setProgress('กำลังประมวลผลข้อมูล...');
            const newParsedCases = [];
            for (const msg of allNewMessages) {
                const caseObj = parseCase(msg);
                if (caseObj && !existingIds.has(caseObj.messageId)) {
                    newParsedCases.push(caseObj);
                }
            }
            newCasesCount = newParsedCases.length;

            return newParsedCases; // Returning just the new ones. The caller should merge and save.

        } catch (err) {
            setFetchError(err.message);
            return null; // Signals failure
        } finally {
            setFetching(false);
            setProgress(newCasesCount > 0 ? `พบ ${newCasesCount} คดีใหม่` : 'ข้อมูลคดีเป็นปัจจุบันแล้ว');
            setTimeout(() => setProgress(''), 4000);
        }
    }, []);

    return { fetching, progress, fetchError, fetchNewCases };
}
