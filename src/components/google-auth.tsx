import type { ReactNode } from "react";
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from "@react-oauth/google";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  if (!clientId?.trim()) return <>{children}</>;
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}

export function isGoogleAuthEnabled() {
  return Boolean(clientId?.trim());
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
  if (!clientId?.trim()) return null;

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      <GoogleLogin
        onSuccess={(res: CredentialResponse) => {
          if (res.credential) onSuccess(res.credential);
          else onError();
        }}
        onError={onError}
        useOneTap={false}
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
