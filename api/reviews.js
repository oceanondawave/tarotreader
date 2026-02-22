import { google } from "googleapis";

const SHEET_ID = process.env.REVIEWS_SHEET_ID;
const SHEET_NAME = "Reviews";

// Initialize Google Auth using the Service Account Key
async function getAuthClient() {
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!keyJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured");

    const credentials = JSON.parse(keyJson);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return auth;
}

export default async function handler(req, res) {
    // CORS headers for cross-origin requests
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (!SHEET_ID) {
        return res.status(500).json({ error: "REVIEWS_SHEET_ID not configured" });
    }

    // GET: Fetch all reviews
    if (req.method === "GET") {
        try {
            const auth = await getAuthClient();
            const sheets = google.sheets({ version: "v4", auth });

            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: SHEET_NAME,
            });

            return formatAndReturn(res, response.data);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            return res.status(500).json({ error: "Failed to fetch reviews", details: error.message, stack: error.stack });
        }
    }

    // POST: Submit a review
    if (req.method === "POST") {
        try {
            const { stars, review, userInfo, accessToken } = req.body;

            // Validate inputs
            if (!stars || !review || !review.trim()) {
                return res.status(400).json({ error: "Stars and review text are required" });
            }
            if (stars < 1 || stars > 5) {
                return res.status(400).json({ error: "Stars must be between 1 and 5" });
            }
            if (!accessToken || !userInfo) {
                return res.status(401).json({ error: "Authentication required" });
            }

            // Validate the user's access token with Google
            const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!profileRes.ok) {
                return res.status(401).json({ error: "Invalid or expired access token" });
            }

            const profile = await profileRes.json();

            // Verify the token matches the claimed user
            if (profile.email !== userInfo.email) {
                return res.status(401).json({ error: "Token does not match claimed user" });
            }

            const auth = await getAuthClient();
            const sheets = google.sheets({ version: "v4", auth });

            const timestamp = new Date().toISOString();
            const row = [
                timestamp,
                stars,
                review.trim(),
                profile.name || userInfo.name,
                profile.email,
                profile.picture || userInfo.picture || "",
                profile.id || userInfo.id || "",
            ];

            await sheets.spreadsheets.values.append({
                spreadsheetId: SHEET_ID,
                range: `${SHEET_NAME}!A:G`,
                valueInputOption: "USER_ENTERED",
                insertDataOption: "INSERT_ROWS",
                requestBody: {
                    values: [row],
                },
            });

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Error submitting review:", error);
            return res.status(500).json({ error: "Failed to submit review", details: error.message, stack: error.stack });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}

function formatAndReturn(res, data) {
    if (!data.values || data.values.length < 2) {
        return res.status(200).json({ reviews: [] });
    }

    // Skip header row, map to objects, sort newest first
    const reviews = data.values
        .slice(1)
        .map((row, index) => ({
            id: index,
            timestamp: row[0] || "",
            stars: parseInt(row[1]) || 5,
            review: row[2] || "",
            name: row[3] || "Anonymous",
            email: row[4] || "",
            picture: row[5] || "",
            userId: row[6] || "",
        }))
        .filter((r) => r.review.trim())
        .reverse(); // newest first

    return res.status(200).json({ reviews });
}
