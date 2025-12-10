import { createAuthClient } from "better-auth/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: API_URL,
  credentials: "include", // ✅ Important for cookies
});

// ✅ Custom Google sign-in that opens in same window
export const signInWithGoogle = () => {
  // Redirect to backend's Google OAuth endpoint
  window.location.href = `${API_URL}/api/auth/signin/google? callbackURL=${encodeURIComponent(window.location.origin + "/dashboard")}`;
};

// Re-export hooks
export const { useSession, signOut } = authClient;

// ✅ Handle sign out
export const handleSignOut = async (navigate) => {
  try {
    await authClient.signOut();
    navigate("/auth/sign-in");
  } catch (error) {
    console.error("Sign out error:", error);
    navigate("/auth/sign-in");
  }
};
