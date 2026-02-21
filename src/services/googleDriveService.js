class GoogleDriveService {
  constructor() {
    this.isAuthenticated = false;
    this.accessToken = null;
    this.tokenExpiresAt = null;  // Timestamp (ms) when the access token expires
    this.refreshTimer = null;    // Timer ID for proactive token refresh
    this.userInfo = null;
    this.folderId = null;
    this.spreadsheetId = null;
    this.clientId = null; // Will be fetched from backend securely
    this.creatingFolder = false;
    this.creatingSpreadsheet = false;
    this.savingReading = false;

    // Load saved state from localStorage
    this.loadSavedState();
  }

  // Load saved authentication state from localStorage
  loadSavedState() {
    try {
      const savedState = localStorage.getItem("googleDriveAuth");
      if (savedState) {
        const state = JSON.parse(savedState);
        this.accessToken = state.accessToken;
        this.refreshToken = state.refreshToken || null;
        this.tokenExpiresAt = state.tokenExpiresAt || null;
        this.userInfo = state.userInfo;
        this.isAuthenticated = state.isAuthenticated;
        this.folderId = state.folderId;
        this.spreadsheetId = state.spreadsheetId;

        if (this.isAuthenticated) {
          const isExpired = this.tokenExpiresAt && Date.now() >= this.tokenExpiresAt;
          if (isExpired) {
            // Token already expired — silently refresh on startup (uses Google's browser session cookie)
            console.log("🔑 Saved token expired. Will silently refresh on startup...");
            // Delay to allow the Google Identity Services script to load first
            setTimeout(() => this.silentRefresh(), 2000);
          } else {
            // Token still valid — schedule refresh before it expires
            this.scheduleTokenRefresh();
          }
        }
      }
    } catch (error) {
      console.error("Failed to load saved state:", error);
      this.clearSavedState();
    }
  }

  // Save authentication state to localStorage
  saveState() {
    try {
      const state = {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        tokenExpiresAt: this.tokenExpiresAt,
        userInfo: this.userInfo,
        isAuthenticated: this.isAuthenticated,
        folderId: this.folderId,
        spreadsheetId: this.spreadsheetId,
      };
      localStorage.setItem("googleDriveAuth", JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }

  // Schedule a silent token refresh 5 minutes before expiry
  scheduleTokenRefresh() {
    // Clear any existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (!this.tokenExpiresAt || !this.isAuthenticated) return;

    const msUntilExpiry = this.tokenExpiresAt - Date.now();
    const refreshIn = Math.max(msUntilExpiry - 5 * 60 * 1000, 0); // 5 min before expiry, min 0

    console.log(`🔄 Token refresh scheduled in ${Math.round(refreshIn / 60000)} min`);

    this.refreshTimer = setTimeout(() => {
      this.silentRefresh();
    }, refreshIn);
  }

  // Silently refresh the access token without user interaction using the Refresh Token
  async silentRefresh() {
    if (!this.isAuthenticated || !this.clientId || !this.refreshToken) {
      console.warn("Cannot silently refresh: Missing refresh token or client ID");
      return false;
    }

    console.log("🔄 Proactively refreshing access token via backend API...");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "refresh_token",
          refresh_token: this.refreshToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn("Proactive refresh failed (will retry):", data.error_description || data.error);
        this.refreshTimer = setTimeout(() => this.silentRefresh(), 2 * 60 * 1000);
        return false;
      }

      this.accessToken = data.access_token;
      if (data.expires_in) {
        this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
      }

      this.saveState();
      console.log("✅ Token proactively refreshed via API — stays signed in!");
      this.scheduleTokenRefresh();

      return true;
    } catch (err) {
      console.warn("Network error during silent refresh (will retry):", err);
      this.refreshTimer = setTimeout(() => this.silentRefresh(), 2 * 60 * 1000);
      return false;
    }
  }

  // Helper method to handle fetch errors and detect deleted spreadsheets
  async handleFetchResponse(response, url) {
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("401 Unauthorized - Authentication token expired");
      }
      if (response.status === 404) {
        console.error("Spreadsheet not found (404) - may have been deleted");
        throw new Error("Sheet not found - spreadsheet may have been deleted");
      }
      throw new Error(`HTTP error! status: ${response.status} - ${url}`);
    }
    return response;
  }

  // Check if token is expired and refresh if needed
  async refreshTokenIfNeeded() {
    if (!this.accessToken) {
      throw new Error("No access token available");
    }

    try {
      // Try a simple API call to check if token is still valid
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v1/userinfo",
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        console.log("Token expired, attempting silent refresh via API...");

        const success = await this.silentRefresh();

        if (!success) {
          // If the backend API refresh failed (e.g. refresh token expired or was revoked)
          // we must fall back to interactive sign in so the user can re-authorize.
          throw new Error("INTERACTIVE_SIGN_IN_REQUIRED");
        }

        return true;
      }

      return true; // Token is still valid
    } catch (error) {
      // Only propagate - never sign out automatically on network errors
      console.warn("Token validation failed (will not sign out):", error.message);
      throw error;
    }
  }

  // Clear saved authentication state
  clearSavedState() {
    try {
      localStorage.removeItem("googleDriveAuth");
    } catch (error) {
      console.error("Failed to clear saved state:", error);
    }
  }

  // Initialize Google API client (fetches client ID securely)
  async initialize() {
    try {
      // 1. Fetch public Client ID from our secure Vercel backend
      if (!this.clientId) {
        // Run fetch asynchronously in background, but if we need it immediately we wait
        const authResponse = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_client_id" })
        });

        const textData = await authResponse.text();
        let authData;
        try {
          authData = JSON.parse(textData);
        } catch (e) {
          console.error("Failed to parse /api/auth JSON response:", textData);
          throw new Error(`/api/auth endpoint did not return valid JSON.`);
        }

        if (!authResponse.ok || !authData.clientId) {
          throw new Error("Could not fetch Google Client ID from secure backend");
        }
        this.clientId = authData.clientId;
      }

      // Wait for Google Identity Services library to load
      if (!window.google) {
        await this.waitForGoogle();
      }
      return true;
    } catch (error) {
      console.error("Failed to initialize Google API:", error);
      return false;
    }
  }

  // Wait for Google Identity Services to load
  waitForGoogle() {
    return new Promise((resolve, reject) => {
      const checkGoogle = () => {
        if (window.google && window.google.accounts) {
          resolve();
        } else {
          setTimeout(checkGoogle, 100);
        }
      };
      checkGoogle();

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error("Google Identity Services failed to load"));
      }, 10000);
    });
  }

  // Load Google Identity Services script
  loadGoogleScript() {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Sign in user
  signIn() {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("🔍 Starting Google sign-in process...");

        // Mobile Safari popup blocker fix: 
        // We must initialize the client *before* the user clicks, OR hope the fetch is fast enough (< 1000ms).
        // If it's cached, initialize() is instant.
        const initResult = await this.initialize();
        if (!initResult) {
          throw new Error("Failed to initialize Google API");
        }

        return new Promise((resolve, reject) => {
          console.log("🔧 Creating OAuth client...");
          const client = google.accounts.oauth2.initCodeClient({
            client_id: this.clientId,
            scope:
              "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
            callback: async (response) => {
              console.log("🔍 OAuth code received:", response);
              if (response.error) {
                reject(new Error(response.error));
                return;
              }

              try {
                // Exchange the authorization code via our secure Vercel backend
                const tokenResponse = await fetch("/api/auth", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    action: "exchange_code",
                    code: response.code,
                    redirect_uri: window.location.origin,
                  }),
                });

                const tokenData = await tokenResponse.json();

                if (!tokenResponse.ok) {
                  console.error("Token exchange failed:", tokenData);
                  throw new Error(tokenData.error_description || "Failed to exchange authorization code");
                }

                this.accessToken = tokenData.access_token;

                // Only update the refresh token if Google actually gave us a new one
                // (Sometimes they only give it on the very first authorization)
                if (tokenData.refresh_token) {
                  this.refreshToken = tokenData.refresh_token;
                }

                // Get user info
                const userResponse = await fetch(
                  "https://www.googleapis.com/oauth2/v2/userinfo",
                  {
                    headers: {
                      Authorization: `Bearer ${this.accessToken}`,
                    },
                  }
                );

                const userInfo = await userResponse.json();

                // Verify that the token has the required Drive permission
                try {
                  // Try to list files in Drive to verify permission
                  const driveResponse = await fetch(
                    "https://www.googleapis.com/drive/v3/files?pageSize=1",
                    {
                      headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                      },
                    }
                  );

                  if (!driveResponse.ok) {
                    // If Drive API fails, user didn't grant Drive permission
                    reject(new Error("Drive permission not granted"));
                    return;
                  }
                } catch (driveError) {
                  // If we can't access Drive, user didn't grant permission
                  reject(new Error("Drive permission not granted"));
                  return;
                }

                this.userInfo = userInfo;
                this.isAuthenticated = true;

                // Store when the token expires and schedule proactive refresh
                if (tokenData.expires_in) {
                  this.tokenExpiresAt = Date.now() + tokenData.expires_in * 1000;
                }

                // Save state to localStorage
                this.saveState();

                // Schedule refresh before this token expires
                this.scheduleTokenRefresh();

                resolve(userInfo);
              } catch (error) {
                reject(error);
              }
            },
            error_callback: (error) => {
              console.error("OAuth error:", error);
              reject(
                new Error(
                  error.type === "popup_closed"
                    ? "Popup was closed"
                    : "Authentication failed"
                )
              );
            },
          });

          console.log("🚀 Requesting authorization code...");
          client.requestCode();
        });
      } catch (error) {
        console.error("Sign in failed:", error);
        reject(error);
      }
    });
  }

  // Sign out user
  async signOut() {
    // Cancel scheduled token refresh
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    try {
      if (this.accessToken) {
        try {
          // Revoke the access token
          await fetch(
            `https://oauth2.googleapis.com/revoke?token=${this.accessToken}`,
            {
              method: "POST",
            }
          );
        } catch (revokeError) {
          // Ignore revocation errors for expired tokens
          console.log(
            "Token revocation failed (likely expired):",
            revokeError.message
          );
        }
      }
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      // Always clear state regardless of revocation success
      this.isAuthenticated = false;
      this.accessToken = null;
      this.userInfo = null;
      this.folderId = null;
      this.spreadsheetId = null;
      this.creatingFolder = false;
      this.creatingSpreadsheet = false;
      this.savingReading = false;

      // Clear saved state
      this.clearSavedState();
    }
  }

  // Create or find Tarot Readings folder
  async createOrFindFolder() {
    try {
      // If folder already exists in memory, return it
      if (this.folderId) {
        return this.folderId;
      }

      // If folder creation is already in progress, wait for it
      if (this.creatingFolder) {
        // Wait for the creation to complete, timeout after 5s
        let attempts = 0;
        while (this.creatingFolder && attempts < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }
        if (this.creatingFolder) {
          console.warn("Timed out waiting for creatingFolder lock");
        } else {
          return this.folderId;
        }
      }

      this.creatingFolder = true;

      // Create personalized folder name with user name
      const userName =
        this.userInfo?.name
          ?.replace(/[^a-zA-Z0-9\s]/g, "")
          .replace(/\s+/g, " ")
          .trim() || "User";
      const folderName = `${userName} - Tarot Readings`;

      // Check if folder already exists
      const listResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      const listData = await listResponse.json();

      if (listData.files.length > 0) {
        this.folderId = listData.files[0].id;
        this.saveState();
        return this.folderId;
      }

      // Create new folder
      const createResponse = await fetch(
        "https://www.googleapis.com/drive/v3/files",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
          }),
        }
      );

      const folderData = await createResponse.json();
      this.folderId = folderData.id;

      // Save state
      this.saveState();

      return this.folderId;
    } catch (error) {
      console.error("Failed to create/find folder:", error);
      throw error;
    } finally {
      this.creatingFolder = false;
    }
  }

  // Create or find spreadsheet for readings
  async createOrFindSpreadsheet() {
    try {
      // If spreadsheet already exists in memory, return it
      if (this.spreadsheetId) {
        return this.spreadsheetId;
      }

      // If spreadsheet creation is already in progress, wait for it
      if (this.creatingSpreadsheet) {
        // Wait for the creation to complete, timeout after 5s
        let attempts = 0;
        while (this.creatingSpreadsheet && attempts < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }
        if (this.creatingSpreadsheet) {
          console.warn("Timed out waiting for creatingSpreadsheet lock");
        } else {
          return this.spreadsheetId;
        }
      }

      this.creatingSpreadsheet = true;

      if (!this.folderId) {
        await this.createOrFindFolder();
      }

      // Create one persistent spreadsheet name with user name
      const userName =
        this.userInfo?.name
          ?.replace(/[^a-zA-Z0-9\s]/g, "")
          .replace(/\s+/g, " ")
          .trim() || "User";
      const spreadsheetName = `${userName} - Tarot Readings`;

      // Check if spreadsheet already exists
      const listResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${spreadsheetName}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name)`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      const listData = await listResponse.json();

      if (listData.files.length > 0) {
        this.spreadsheetId = listData.files[0].id;
        this.saveState();
        return this.spreadsheetId;
      }

      // Create new spreadsheet
      const createResponse = await fetch(
        "https://sheets.googleapis.com/v4/spreadsheets",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: {
              title: spreadsheetName,
            },
            sheets: [
              {
                properties: {
                  title: "Readings",
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 8,
                  },
                },
              },
            ],
          }),
        }
      );

      const spreadsheetData = await createResponse.json();
      this.spreadsheetId = spreadsheetData.spreadsheetId;

      // Save state
      this.saveState();

      // Move spreadsheet to folder
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${this.spreadsheetId}?addParents=${this.folderId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      // Add headers
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Readings!A1:I1?valueInputOption=RAW`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [
              [
                "ID",
                "Date",
                "Time",
                "Question",
                "Card 1",
                "Card 2",
                "Card 3",
                "Reading",
                "Language",
              ],
            ],
          }),
        }
      );

      return this.spreadsheetId;
    } catch (error) {
      console.error("Failed to create/find spreadsheet:", error);
      throw error;
    } finally {
      this.creatingSpreadsheet = false;
    }
  }

  // Save reading to spreadsheet
  async saveReading(readingData) {
    try {
      // If saving is already in progress, wait for it
      if (this.savingReading) {
        // Wait for the save to complete, but timeout after 10 seconds
        let attempts = 0;
        while (this.savingReading && attempts < 100) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }
        if (this.savingReading) {
          console.warn("Timed out waiting for savingReading lock");
          // Proceed anyway, assume lock is stale
        } else {
          return;
        }
      }

      this.savingReading = true;

      // Check if user is authenticated first
      if (!this.isAuthenticated || !this.accessToken) {
        throw new Error("User not authenticated");
      }

      // Check token and fallback to interactive sign-in if needed
      try {
        await this.refreshTokenIfNeeded();
      } catch (refreshErr) {
        if (refreshErr.message === "INTERACTIVE_SIGN_IN_REQUIRED") {
          console.log("Interactive sign-in required before saving. Prompting user...");
          try {
            await this.signIn();
          } catch (signInErr) {
            throw new Error("Authentication required to save reading");
          }
        } else {
          throw refreshErr;
        }
      }

      if (!this.spreadsheetId) {
        await this.createOrFindSpreadsheet();
      }

      const now = new Date();

      // Format date consistently (YYYY-MM-DD)
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      // Format time consistently (HH:MM:SS in 24-hour format)
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const timeStr = `${hours}:${minutes}:${seconds}`;

      // Create a unique ID for this reading to prevent duplicates
      const readingId = `${dateStr}_${timeStr}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const values = [
        [
          readingId,
          dateStr,
          timeStr,
          readingData.question || "",
          JSON.stringify(readingData.cards[0] || {}),
          JSON.stringify(readingData.cards[1] || {}),
          JSON.stringify(readingData.cards[2] || {}),
          readingData.answer || "",
          readingData.language || "vi",
        ],
      ];

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Readings!A:I:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values }),
        }
      );

      return {
        success: true,
        spreadsheetId: this.spreadsheetId,
        folderId: this.folderId,
      };
    } catch (error) {
      console.error("Failed to save reading:", error);
      throw error;
    } finally {
      this.savingReading = false;
    }
  }

  // Get user's saved readings count
  async getReadingsCount() {
    try {
      if (!this.isAuthenticated || !this.accessToken) {
        return 0; // Don't throw for count, just return 0
      }

      // Check token and fallback to interactive sign-in if needed
      try {
        await this.refreshTokenIfNeeded();
      } catch (refreshErr) {
        if (refreshErr.message === "INTERACTIVE_SIGN_IN_REQUIRED") {
          console.log("Interactive sign-in required for count. Prompting user...");
          try {
            await this.signIn();
          } catch (signInErr) {
            return 0;
          }
        } else {
          throw refreshErr;
        }
      }

      if (!this.spreadsheetId) {
        await this.createOrFindSpreadsheet();
      }

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Readings!A:I`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      const data = await response.json();
      const rows = data.values || [];
      return Math.max(0, rows.length - 1); // Subtract header row
    } catch (error) {
      console.error("Failed to get readings count:", error);
      throw error;
    }
  }

  // Get spreadsheet URL
  getSpreadsheetUrl() {
    if (this.spreadsheetId) {
      return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`;
    }
    return null;
  }

  // Get folder URL
  getFolderUrl() {
    if (this.folderId) {
      return `https://drive.google.com/drive/folders/${this.folderId}`;
    }
    return null;
  }

  // Get all saved readings from spreadsheet
  async getAllReadings() {
    try {
      // Check if user is authenticated first
      if (!this.isAuthenticated || !this.accessToken) {
        throw new Error("User not authenticated");
      }

      // Check if token is still valid
      try {
        await this.refreshTokenIfNeeded();
      } catch (refreshErr) {
        if (refreshErr.message === "INTERACTIVE_SIGN_IN_REQUIRED") {
          console.log("Interactive sign-in required. Prompting user...");
          try {
            await this.signIn();
          } catch (signInErr) {
            console.warn("User cancelled interactive sign-in:", signInErr.message);
            throw new Error("Authentication required to get readings");
          }
        } else {
          throw refreshErr;
        }
      }

      if (!this.spreadsheetId) {
        await this.createOrFindSpreadsheet();
      }

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Readings!A:I`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("401 Unauthorized - Authentication token expired");
        }
        if (response.status === 404) {
          throw new Error(
            "Sheet not found - spreadsheet may have been deleted"
          );
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];

      // Skip header row and convert to reading objects
      const readings = rows.slice(1).map((row, index) => {
        // Parse card data from JSON strings
        const parseCard = (cardStr) => {
          try {
            const card = JSON.parse(cardStr || "{}");
            return card.name ? card : { name: cardStr || "" };
          } catch {
            return { name: cardStr || "" };
          }
        };

        const cards = [
          parseCard(row[4]),
          parseCard(row[5]),
          parseCard(row[6]),
        ].filter((card) => card.name && card.name.trim() !== ""); // Only include cards with non-empty names

        return {
          id: row[0] || index + 1, // Use the ID from the sheet, fallback to index
          date: row[1] || "",
          time: row[2] || "",
          question: row[3] || "",
          cards: cards,
          answer: row[7] || "",
          language: row[8] || "vi",
        };
      });

      return readings;
    } catch (error) {
      console.error("Failed to get all readings:", error);
      // Let the caller handle all errors (so the UI can show a proper error message instead of falsely claiming 0 readings)
      throw error;
    }
  }

  // Search readings by question or date
  async searchReadings(query) {
    try {
      const allReadings = await this.getAllReadings();

      if (!query || query.trim() === "") {
        return allReadings;
      }

      const searchTerm = query.toLowerCase();
      return allReadings.filter(
        (reading) =>
          reading.question.toLowerCase().includes(searchTerm) ||
          reading.date.toLowerCase().includes(searchTerm) ||
          reading.cards.some((card) =>
            card.name.toLowerCase().includes(searchTerm)
          )
      );
    } catch (error) {
      console.error("Failed to search readings:", error);
      return [];
    }
  }

  // Clean up malformed rows in the spreadsheet
  async cleanupMalformedRows() {
    try {
      console.log("🧹 Starting cleanup of malformed rows...");

      if (!this.spreadsheetId) {
        await this.createOrFindSpreadsheet();
      }

      // Get current data
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Readings!A:I`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      const data = await response.json();
      const rows = data.values || [];

      if (rows.length <= 1) {
        console.log("🧹 No data rows to clean up");
        return { success: true, cleanedRows: 0 };
      }

      // Find malformed rows to delete
      const rowsToDelete = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        // Mark rows for deletion if they are:
        // - Empty or null
        // - Have less than 2 columns
        // - Have empty ID (first column)
        if (!row || row.length < 2 || !row[0] || row[0].trim() === "") {
          rowsToDelete.push(i);
          console.log(`🧹 Marking malformed row ${i} for deletion:`, row);
        }
      }

      if (rowsToDelete.length === 0) {
        console.log("🧹 No malformed rows found");
        return { success: true, cleanedRows: 0 };
      }

      // Delete malformed rows (in reverse order to maintain indices)
      const sheetMetadataResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      const sheetMetadata = await sheetMetadataResponse.json();
      const sheetId = sheetMetadata.sheets[0].properties.sheetId;

      // Delete rows in reverse order
      let deletedCount = 0;
      for (let i = rowsToDelete.length - 1; i >= 0; i--) {
        const rowIndex = rowsToDelete[i];

        try {
          const deleteResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                requests: [
                  {
                    deleteDimension: {
                      range: {
                        sheetId: sheetId,
                        dimension: "ROWS",
                        startIndex: rowIndex,
                        endIndex: rowIndex + 1,
                      },
                    },
                  },
                ],
              }),
            }
          );

          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json();
            console.error(`🧹 Failed to delete row ${rowIndex}:`, errorData);
            continue; // Skip this row and continue with others
          }

          deletedCount++;
          console.log(`🧹 Successfully deleted malformed row ${rowIndex}`);
        } catch (error) {
          console.error(`🧹 Error deleting row ${rowIndex}:`, error);
          continue; // Skip this row and continue with others
        }
      }

      console.log(
        `🧹 Cleanup completed. Attempted to remove ${rowsToDelete.length} malformed rows, successfully deleted ${deletedCount}`
      );
      return {
        success: true,
        cleanedRows: deletedCount,
        attemptedRows: rowsToDelete.length,
      };
    } catch (error) {
      console.error("🧹 Failed to cleanup malformed rows:", error);
      throw error;
    }
  }

  // Delete a reading from the spreadsheet
  async deleteReading(readingId) {
    try {
      console.log(
        "🗑️ googleDriveService.deleteReading called with ID:",
        readingId
      );
      if (!this.spreadsheetId) {
        console.log("🗑️ No spreadsheet ID, creating/finding spreadsheet...");
        await this.createOrFindSpreadsheet();
      }

      // Clean up any malformed rows before attempting deletion
      try {
        console.log("🗑️ Cleaning up malformed rows before deletion...");
        await this.cleanupMalformedRows();
      } catch (cleanupError) {
        console.warn(
          "🗑️ Cleanup failed, continuing with deletion:",
          cleanupError.message
        );
      }

      // Get current data to find the row to delete
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Readings!A:I`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      const data = await response.json();
      const rows = data.values || [];
      console.log("🗑️ Current spreadsheet data:", rows.length, "rows");
      console.log("🗑️ Full spreadsheet data:", rows);
      console.log("🗑️ Looking for readingId:", readingId);

      // Find the actual row index by searching for the readingId in the first column
      let rowIndex = -1;
      let validRows = 0;
      let availableIds = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        // Skip empty rows or rows with insufficient data
        if (!row || row.length < 2 || !row[0] || row[0].trim() === "") {
          console.log(`🗑️ Skipping invalid row ${i}:`, row);
          continue;
        }

        validRows++;
        availableIds.push(row[0]);

        // Check if this row matches our readingId
        if (row[0] === readingId) {
          rowIndex = i;
          console.log(`🗑️ Found matching reading at row ${i}`);
          break;
        }
      }

      console.log("🗑️ Total valid rows found:", validRows);
      console.log("🗑️ Available reading IDs:", availableIds);
      console.log("🗑️ Target row index:", rowIndex);

      if (rowIndex === -1) {
        console.error("🗑️ Reading not found in spreadsheet");
        console.error("🗑️ Looking for:", readingId);
        console.error("🗑️ Available IDs:", availableIds);
        throw new Error(
          `Reading "${readingId}" not found in spreadsheet. Available readings: ${availableIds.length}`
        );
      }

      // Get the actual sheet ID from spreadsheet metadata
      const sheetMetadataResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      const sheetMetadata = await sheetMetadataResponse.json();
      const sheetId = sheetMetadata.sheets[0].properties.sheetId;
      console.log("🗑️ Found sheet ID:", sheetId);

      // Use batch update to delete the row (avoids CORS issues)
      console.log(
        "🗑️ About to delete row with index:",
        rowIndex,
        "type:",
        typeof rowIndex
      );
      console.log("🗑️ API request body:", {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      });

      const batchUpdateResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: sheetId, // Use the actual sheet ID
                    dimension: "ROWS",
                    startIndex: rowIndex,
                    endIndex: rowIndex + 1,
                  },
                },
              },
            ],
          }),
        }
      );

      if (!batchUpdateResponse.ok) {
        const errorData = await batchUpdateResponse.json();
        console.error("🗑️ Batch update failed:", errorData);

        // Handle specific error cases
        if (errorData.error?.message?.includes("No grid with id")) {
          throw new Error(
            "Invalid sheet ID. The spreadsheet structure may be corrupted."
          );
        } else if (errorData.error?.message?.includes("Invalid range")) {
          throw new Error(
            "Invalid row range. The row may have already been deleted or the spreadsheet structure is invalid."
          );
        } else if (errorData.error?.message?.includes("Permission denied")) {
          throw new Error(
            "Permission denied. You may not have write access to this spreadsheet."
          );
        } else {
          throw new Error(
            `Failed to delete row: ${errorData.error?.message || "Unknown error"
            }`
          );
        }
      }

      console.log("🗑️ Reading deletion completed successfully");
      return { success: true };
    } catch (error) {
      console.error("🗑️ Failed to delete reading:", error);
      throw error;
    }
  }

  // Get folder and spreadsheet info for display
  getDriveInfo() {
    const userName =
      this.userInfo?.name
        ?.replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim() || "User";

    return {
      folderUrl: this.getFolderUrl(),
      spreadsheetUrl: this.getSpreadsheetUrl(),
      folderId: this.folderId,
      spreadsheetId: this.spreadsheetId,
      folderName: `${userName} - Tarot Readings`,
      spreadsheetName: `${userName} - Tarot Readings`,
    };
  }

  // Check if user should be signed out due to token expiration or missing files
  async checkAuthStatus() {
    try {
      if (!this.isAuthenticated) {
        return { isValid: false, reason: "Not authenticated" };
      }

      // Check if token is still valid
      await this.refreshTokenIfNeeded();

      // Check if spreadsheet still exists
      if (this.spreadsheetId) {
        try {
          const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}`,
            {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
              },
            }
          );

          if (!response.ok) {
            console.log("Spreadsheet no longer exists, signing out user");
            return { isValid: false, reason: "Spreadsheet not found" };
          }
        } catch (error) {
          console.log("Error checking spreadsheet:", error);
          return { isValid: false, reason: "Spreadsheet check failed" };
        }
      }

      return { isValid: true };
    } catch (error) {
      console.error("Auth status check failed:", error);
      return { isValid: false, reason: "Token expired or invalid" };
    }
  }
}

const googleDriveService = new GoogleDriveService();
export default googleDriveService;
