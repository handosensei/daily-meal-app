type GoogleCredentialResponse = {
  credential?: string;
};

type GooglePromptNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
};

type GoogleAccountsApi = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      prompt: (callback?: (notification: GooglePromptNotification) => void) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleAccountsApi;
  }
}

const GOOGLE_IDENTITY_SCRIPT_ID = 'google-identity-services';
const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleIdentityScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID) as
      | HTMLScriptElement
      | null;

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Google unavailable')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_IDENTITY_SCRIPT_ID;
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Google unavailable')), {
      once: true,
    });
    document.head.appendChild(script);
  });
}

export async function requestGoogleIdToken() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  if (!clientId) {
    throw new Error('Google client is not configured');
  }

  await loadGoogleIdentityScript();

  return new Promise<string>((resolve, reject) => {
    window.google?.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          resolve(response.credential);
          return;
        }

        reject(new Error('Google sign in failed'));
      },
    });

    window.google?.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        reject(new Error('Google sign in failed'));
      }
    });
  });
}
