import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { authClient, signInWithGoogle } from "@/lib/auth-client";
import { useNavigate, NavLink } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function Providers({ children }) {
  const navigate = useNavigate();

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={(href) => {
        console.log("🚀 Navigate to:", href);
        navigate(href);
      }}
      replace={(href) => {
        console.log("🔄 Replace to:", href);
        navigate(href, { replace: true });
      }}
      onSessionChange={() => {
        console.log("📡 Session changed");
      }}
      Link={NavLink}
      basePath="/auth"
      redirectTo="/dashboard"
      // ✅ Custom social provider handler
      social={{
        providers: ["google"],
        // Override the default Google sign-in
        onSocialSignIn: (provider) => {
          if (provider === "google") {
            signInWithGoogle();
            return false; // Prevent default behavior
          }
          return true;
        },
      }}
      credentials={{
        forgotPassword: true,
      }}
      signUp={{
        fields: ["name"],
      }}
      nameRequired={true}
      baseURL={API_URL}
    >
      {children}
    </AuthUIProvider>
  );
}
