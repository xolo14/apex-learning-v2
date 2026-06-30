export type GoogleTokenClaims = {
  email: string;
  name: string;
  picture?: string;
  sub: string;
};

function googleClientId(): string {
  return (
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.VITE_GOOGLE_CLIENT_ID?.trim() ||
    ""
  );
}

/** Verify a Google Identity Services JWT (credential) server-side. */
export async function verifyGoogleIdToken(credential: string): Promise<GoogleTokenClaims> {
  const clientId = googleClientId();
  if (!clientId) {
    throw new Error("Google sign-in is not configured on the server.");
  }

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
  );
  if (!res.ok) {
    throw new Error("Google sign-in could not be verified. Please try again.");
  }

  const data = (await res.json()) as Record<string, string>;
  if (data.aud !== clientId) {
    throw new Error("Google sign-in token is not valid for this app.");
  }
  if (data.email_verified !== "true" || !data.email) {
    throw new Error("Your Google email must be verified to continue.");
  }

  return {
    email: data.email,
    name: (data.name || data.given_name || "Syncpedia member").slice(0, 80),
    picture: data.picture,
    sub: data.sub,
  };
}
