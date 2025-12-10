import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { authClient } from "@/lib/auth-client";
import { useNavigate, NavLink } from "react-router-dom";

// ✅ Use same origin
const API_URL = import.meta.env.VITE_API_URL || "";

export function Providers({ children }) {
  const navigate = useNavigate();

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={(href) => navigate(href)}
      replace={(href) => navigate(href, { replace: true })}
      onSessionChange={() => console.log("📡 Session changed")}
      Link={NavLink}
      basePath="/auth"
      redirectTo="/dashboard"
      social={{
        providers: ["google"],
      }}
      credentials={{
        forgotPassword: true,
      }}
      signUp={{
        fields: ["name"],
      }}
      nameRequired={true}
      baseURL={API_URL || window.location.origin}
    >
      {children}
    </AuthUIProvider>
  );
}
