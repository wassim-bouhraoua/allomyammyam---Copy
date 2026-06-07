import { useEffect } from "react";

export function useGoogleSignIn(
  callback: (response: any) => void,
  buttonId: string = "google-signin-button"
) {
  useEffect(() => {
    const google = (window as any).google;

    const initGoogleSignIn = () => {
      const g = (window as any).google;
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      if (g && clientId) {
        g.accounts.id.initialize({
          client_id: clientId,
          callback,
        });

        const btnContainer = document.getElementById(buttonId);
        if (btnContainer) {
          g.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            width: Math.floor(btnContainer.getBoundingClientRect().width) || 376,
          });
        }
      }
    };

    if (google) {
      initGoogleSignIn();
    } else {
      let script = document.getElementById("google-gsi-script") as HTMLScriptElement;
      if (!script) {
        script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.id = "google-gsi-script";
        script.onload = () => {
          initGoogleSignIn();
        };
        document.body.appendChild(script);
      } else {
        const oldOnload = script.onload;
        script.onload = (e) => {
          if (oldOnload) (oldOnload as any)(e);
          initGoogleSignIn();
        };
        if ((window as any).google) {
          initGoogleSignIn();
        }
      }
    }
  }, [callback, buttonId]);
}
