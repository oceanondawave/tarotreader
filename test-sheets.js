import { google } from "googleapis";

async function test() {
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!keyJson) {
        console.error("No service account key found in .env");
        return;
    }

    const credentials = JSON.parse(keyJson);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.REVIEWS_SHEET_ID,
            range: "A:G",
        });
        console.log("SUCCESS:");
        console.dir(response.data, { depth: null });
    } catch (e) {
        console.error("FAIL:", e.message);
    }
}

test();
