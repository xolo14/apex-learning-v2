import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from "@react-oauth/google";

type GoogleAuthContextValue = {
  clientId: string;
  ready: boolean;
};

const GoogleAuthContext = createContext<GoogleAuthContextValue>({
  clientId: "",
  ready: false,
});

function resolveBuildTimeClientId(): string {
  return ((import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? "").trim();
}

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    fetch("/api/public/app-config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { googleClientId?: string } | null) => {
        if (!alive) return;
        const id = data?.googleClientId?.trim() || resolveBuildTimeClientId();
        setClientId(id);
      })
      .catch(() => {
        if (alive) setClientId(resolveBuildTimeClientId());
      })
      .finally(() => {
        if (alive) setReady(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  const value: GoogleAuthContextValue = { clientId, ready };

  if (!clientId) {
    return <GoogleAuthContext.Provider value={value}>{children}</GoogleAuthContext.Provider>;
  }

  return (
    <GoogleAuthContext.Provider value={value}>
      <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  return useContext(GoogleAuthContext);
}

export function GoogleContinueButton({
  onSuccess,
  onError,
  disabled,
}: {
  onSuccess: (credential: string) => void;
  onError: () => void;
  disabled?: boolean;
}) {
  const { clientId, ready } = useGoogleAuth();

  if (!ready || !clientId) return null;

  const useRedirect =
    typeof window !== "undefined" &&
    (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
  const redirectUri = typeof window !== "undefined" ? window.location.origin : undefined;

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      <GoogleLogin
        onSuccess={(res: CredentialResponse) => {
          if (res.credential) onSuccess(res.credential);
          else onError();
        }}
        onError={onError}
        useOneTap={false}
        ux_mode={useRedirect ? "redirect" : "popup"}
        redirect_uri={useRedirect ? redirectUri : undefined}
        type="standard"
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        width="320"
        locale="en"
      />
    </div>
  );
}
