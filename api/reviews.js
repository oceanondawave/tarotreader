const SHEET_ID = process.env.REVIEWS_SHEET_ID;
const SHEET_NAME = "Reviews";

// Create a JWT for Google Service Account auth
async function getServiceAccountToken() {
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!keyJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured");

    const key = JSON.parse(keyJson);

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
        iss: key.client_email,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
    };

    // Encode header and payload
    const encode = (obj) =>
        Buffer.from(JSON.stringify(obj))
            .toString("base64")
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");

    const signingInput = `${encode(header)}.${encode(payload)}`;

    // Sign with RSA private key using Web Crypto API (available in Vercel Edge/Node)
    const { createSign } = await import("crypto");
    const sign = createSign("RSA-SHA256");
    sign.update(signingInput);
    const signature = sign
        .sign(key.private_key)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    const jwt = `${signingInput}.${signature}`;

    // Exchange JWT for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    if (!tokenRes.ok) {
        const err = await tokenRes.text();
        throw new Error(`Failed to get service account token: ${err}`);
    }

    const { access_token } = await tokenRes.json();
    return access_token;
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

    // GET: Fetch all reviews (public read using API key or direct sheet access)
    if (req.method === "GET") {
        try {
            const apiKey = process.env.GOOGLE_API_KEY;
            let url;

            if (apiKey) {
                url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${apiKey}`;
            } else {
                // Try service account if no API key
                const token = await getServiceAccountToken();
                const sheetsRes = await fetch(
                    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const data = await sheetsRes.json();
                return formatAndReturn(res, data);
            }

            const sheetsRes = await fetch(url);
            const data = await sheetsRes.json();
            return formatAndReturn(res, data);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            return res.status(500).json({ error: "Failed to fetch reviews" });
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

            // Get service account token to write to the sheet
            const saToken = await getServiceAccountToken();

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

            const appendRes = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A:G:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${saToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ values: [row] }),
                }
            );

            if (!appendRes.ok) {
                const err = await appendRes.json();
                console.error("Sheets append error:", err);
                return res.status(500).json({ error: "Failed to save review" });
            }

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Error submitting review:", error);
            return res.status(500).json({ error: "Failed to submit review" });
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
