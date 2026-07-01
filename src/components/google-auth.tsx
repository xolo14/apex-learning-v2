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
  variant = "default",
}: {
  onSuccess: (credential: string) => void;
  onError: () => void;
  disabled?: boolean;
  /** `brand` = full-width pill on dark onboarding screens */
  variant?: "default" | "brand";
}) {
  const { clientId, ready } = useGoogleAuth();

  if (!ready || !clientId) return null;

  const login = (
    <GoogleLogin
      onSuccess={(res: CredentialResponse) => {
        if (res.credential) onSuccess(res.credential);
        else onError();
      }}
      onError={onError}
      useOneTap={false}
      ux_mode="popup"
      type="standard"
      theme={variant === "brand" ? "outline" : "outline"}
      size="large"
      text="continue_with"
      shape={variant === "brand" ? "pill" : "rectangular"}
      width={variant === "brand" ? "340" : "320"}
      locale="en"
    />
  );

  if (variant === "brand") {
    return (
      <div className={"relative w-full " + (disabled ? "pointer-events-none opacity-50" : "")}>
        <div
          aria-hidden
          className="pointer-events-none flex h-[52px] w-full items-center justify-center gap-3 rounded-full bg-white px-5 text-[15px] font-semibold tracking-tight text-[#1f1f1f] shadow-[0_8px_32px_rgba(0,0,0,0.28)] ring-1 ring-white/20"
        >
          <GoogleMark />
          Continue with Google
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-full opacity-[0.011] [&_iframe]:!h-[52px] [&_iframe]:!min-h-[52px]">
          {login}
        </div>
      </div>
    );
  }

  return <div className={disabled ? "pointer-events-none opacity-50" : ""}>{login}</div>;
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
