const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { action, code, refresh_token, redirect_uri } = req.body;

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.error("Missing Google credentials in Vercel environment variables.");
            return res.status(500).json({ error: "Server configuration error" });
        }

        // Action 1: Get public Client ID (Frontend needs this to open Google popup)
        if (action === "get_client_id") {
            return res.status(200).json({ clientId });
        }

        // Prepare exactly what we will send to Google
        const params = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
        });

        if (action === "exchange_code" && code) {
            // Exchanging an initial auth code for tokens
            params.append("code", code);
            params.append("grant_type", "authorization_code");
            params.append("redirect_uri", redirect_uri || "postmessage");
        } else if (action === "refresh_token" && refresh_token) {
            // Exchanging a refresh token for a new access token
            params.append("refresh_token", refresh_token);
            params.append("grant_type", "refresh_token");
        } else {
            return res.status(400).json({ error: "Invalid action or missing parameters" });
        }

        // Call Google's actual OAuth server securely from the backend
        const googleResponse = await fetch(GOOGLE_TOKEN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params,
        });

        const data = await googleResponse.json();

        if (!googleResponse.ok) {
            console.error("Google OAuth API Error:", data);
            return res.status(googleResponse.status).json({
                error: data.error,
                error_description: data.error_description || "Google API request failed",
            });
        }

        // Send the tokens back down to the React frontend
        return res.status(200).json(data);
    } catch (error) {
        console.error("Vercel Auth Handler Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
