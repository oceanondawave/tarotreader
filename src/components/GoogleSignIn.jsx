import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import googleDriveService from "../services/googleDriveService";

const GoogleSignIn = ({
  onSignIn,
  onSignOut,
  isSignedIn,
  userInfo,
  onReadingSaved,
  onViewSavedReadings,
  onShowUserInfo,
  isCreatingDriveFiles = false,
}) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasReadings, setHasReadings] = useState(false);

  useEffect(() => {
    // Check if user is already signed in on component mount
    checkAuthStatus();
  }, []);

  // Check if user has saved readings when signed in (but not on every mount)
  useEffect(() => {
    if (isSignedIn) {
      // Add a small delay to avoid immediate API calls
      const timeoutId = setTimeout(() => {
        checkForSavedReadings();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [isSignedIn]);

  // Update hasReadings when a reading is saved
  useEffect(() => {
    if (onReadingSaved) {
      // Create a function that can be called from outside
      const updateHasReadings = () => {
        checkForSavedReadings();
      };

      // Store the function so it can be called from the parent
      window.updateHasReadings = updateHasReadings;
    }
  }, [onReadingSaved]);

  const checkAuthStatus = async () => {
    try {
      const isAuth = await googleDriveService.initialize();
      if (isAuth && googleDriveService.isAuthenticated) {
        onSignIn(googleDriveService.userInfo);
        checkForSavedReadings();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    }
  };

  const checkForSavedReadings = async () => {
    try {
      // Only check if user is authenticated
      if (!googleDriveService.isAuthenticated) {
        setHasReadings(false);
        return;
      }

      const readings = await googleDriveService.getAllReadings();
      setHasReadings(readings.length > 0);
    } catch (error) {
      console.error("Failed to check for saved readings:", error);
      // Only show button if it's not a token expiration or auth error
      if (
        !error.message.includes("Token expired") &&
        !error.message.includes("not authenticated")
      ) {
        setHasReadings(true); // Always show the button when signed in
      } else {
        setHasReadings(false);
      }
    }
  };

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await googleDriveService.signIn();
      onSignIn(googleDriveService.userInfo);
      await checkForSavedReadings();
    } catch (error) {
      console.error("Sign in failed:", error);
      setError(error.message || t("signInFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await googleDriveService.signOut();
      onSignOut();
      setHasReadings(false);
    } catch (error) {
      console.error("Sign out failed:", error);
      setError(error.message || t("signOutFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <motion.div
        className="google-signin-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="google-signin-content">
          <h3>{t("saveToDrive")}</h3>
          <p>{t("autoCreateFolder")}</p>
          <p>{t("excelFormat")}</p>
          <p>{t("searchableHistory")}</p>
          <p>{t("cloudBackup")}</p>

          <button
            className="google-signin-button"
            onClick={handleSignIn}
            disabled={isLoading}
            aria-label={t("signInWithGoogle")}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <span className="google-icon">🔗</span>
                {t("signInWithGoogle")}
              </>
            )}
          </button>

          {error && <div className="error-message">{error}</div>}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="google-signin-compact"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="google-signin-compact-content">
        <button
          className="user-avatar-compact"
          onClick={onShowUserInfo}
          disabled={isLoading || isCreatingDriveFiles}
          aria-label={`${t("userInfo")} - ${userInfo?.name}`}
          title={`${t("userInfo")} - ${userInfo?.name}`}
        >
          {userInfo?.picture ? (
            <img src={userInfo.picture} alt={userInfo.name} />
          ) : (
            <span className="avatar-placeholder">
              {userInfo?.name?.charAt(0) || "U"}
            </span>
          )}
          <span className="user-name-compact">{userInfo?.name || "User"}</span>
          <span className="status-indicator">✅</span>
        </button>

        <button
          className="sign-out-compact-button"
          onClick={handleSignOut}
          disabled={isLoading || isCreatingDriveFiles}
          aria-label={t("signOut")}
        >
          <span className="google-icon">🚪</span>
          {t("signOut")}
        </button>
      </div>
    </motion.div>
  );
};

export default GoogleSignIn;
