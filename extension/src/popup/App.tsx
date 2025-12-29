import React, { useState, useEffect } from "react";
import { getToken, isAuthenticated } from "../shared/storage";
import { validateToken } from "../shared/api";
import type { PopupScreen } from "../shared/types";

// Import screen components (will create these next)
import LoginScreen from "./components/LoginScreen";
import SaveScreen from "./components/SaveScreen";
import SuccessScreen from "./components/SuccessScreen";

function App() {
  const [currentScreen, setCurrentScreen] = useState<PopupScreen>("login");
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const authenticated = await isAuthenticated();

      if (authenticated) {
        const token = await getToken();
        if (token) {
          // Validate token with backend
          const isValid = await validateToken(token);

          if (isValid) {
            setAuthToken(token);
            setCurrentScreen("save");
          } else {
            // Token is invalid/expired
            setCurrentScreen("login");
          }
        } else {
          setCurrentScreen("login");
        }
      } else {
        setCurrentScreen("login");
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setCurrentScreen("login");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful login
  const handleLoginSuccess = (token: string) => {
    setAuthToken(token);
    setCurrentScreen("save");
  };

  // Handle successful save
  const handleSaveSuccess = () => {
    setCurrentScreen("success");
  };

  // Handle logout
  const handleLogout = () => {
    setAuthToken(null);
    setCurrentScreen("login");
  };

  // Handle "save another" from success screen
  const handleSaveAnother = () => {
    setCurrentScreen("save");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-96 h-96 flex items-center justify-center bg-bg-page">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-1 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Render current screen
  return (
    <div className="w-96 min-h-96 bg-bg-page">
      {currentScreen === "login" && (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}

      {currentScreen === "save" && authToken && (
        <SaveScreen
          token={authToken}
          onSaveSuccess={handleSaveSuccess}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === "success" && (
        <SuccessScreen onSaveAnother={handleSaveAnother} />
      )}
    </div>
  );
}

export default App;
