import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { authClient } from "@/lib/auth-client";
import { useNavigate, Link as RouterLink } from "react-router-dom";

export function Providers({ children }) {
  const navigate = useNavigate();

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={(href) => {
        console.log("AuthUI navigating to:", href);
        navigate(href);
      }}
      replace={(href) => {
        console.log("AuthUI replacing to:", href);
        navigate(href, { replace: true });
      }}
      onSessionChange={(session) => {
        console.log("📡 Session changed:", session);
        if (session?.user) {
          navigate("/dashboard", { replace: true });
        }
      }}
      Link={({ href, children, ...props }) => (
        <RouterLink to={href} {...props}>
          {children}
        </RouterLink>
      )}
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
    >
      {children}
    </AuthUIProvider>
  );
}
