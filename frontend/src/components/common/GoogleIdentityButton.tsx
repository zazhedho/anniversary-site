import { useEffect, useRef, useState } from "react";

type GoogleIdentityButtonProps = {
  label: string;
  onCredential: (idToken: string) => Promise<void> | void;
  disabled?: boolean;
  onError?: (message: string) => void;
};

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsID = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      size?: "large" | "medium" | "small";
      width?: number;
      logo_alignment?: "left" | "center";
    }
  ) => void;
};

type GoogleGlobal = {
  accounts?: {
    id?: GoogleAccountsID;
  };
};

declare global {
  interface Window {
    google?: GoogleGlobal;
  }
}

const GOOGLE_SCRIPT_ID = "google-identity-services-script";

function ensureGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing?.dataset.loaded === "true") {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = existing || document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Google Identity script"));

    if (!existing) {
      document.head.appendChild(script);
    }
  });
}

export default function GoogleIdentityButton({ label, onCredential, disabled = false, onError }: GoogleIdentityButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [available, setAvailable] = useState(false);
  const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!clientId) {
        setAvailable(false);
        onErrorRef.current?.("Google login is not configured on frontend");
        return;
      }

      try {
        await ensureGoogleScript();
      } catch (err) {
        if (!cancelled) {
          onErrorRef.current?.(err instanceof Error ? err.message : "Failed to load Google Identity");
          setAvailable(false);
        }
        return;
      }

      if (cancelled) return;
      const api = window.google?.accounts?.id;
      if (!api || !containerRef.current) {
        setAvailable(false);
        onErrorRef.current?.("Google Identity API is unavailable");
        return;
      }

      api.initialize({
        client_id: clientId,
        callback: (response) => {
          const token = (response.credential || "").trim();
          if (!token) {
            onErrorRef.current?.("Google credential is unavailable");
            return;
          }
          void onCredentialRef.current(token);
        },
      });

      containerRef.current.innerHTML = "";
      api.renderButton(containerRef.current, {
        type: "standard",
        theme: "outline",
        text: "continue_with",
        shape: "pill",
        size: "large",
        width: 320,
        logo_alignment: "left",
      });
      setAvailable(true);
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return (
    <div className="space-y-2">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#6f332f]/75">{label}</p>
      <div className="relative">
        <div ref={containerRef} className="google-identity-button flex w-full justify-center" />
        {!available || disabled ? <div className="absolute inset-0 cursor-not-allowed rounded-full bg-white/35" aria-hidden="true" /> : null}
      </div>
    </div>
  );
}
