let posthogInstance;

try {
  posthogInstance = (await import('posthog-js')).default;
} catch (e) {
  // Safe fallback mock object if posthog-js package is unavailable
  posthogInstance = new Proxy({}, {
    get: (_, prop) => {
      if (prop === 'init') return () => {};
      return () => {};
    }
  });
}

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

export const isPostHogEnabled = Boolean(posthogKey && posthogHost);

if (!isPostHogEnabled) {
  if (import.meta.env.DEV) {
    const missingVariable = posthogKey ? 'VITE_POSTHOG_HOST' : 'VITE_POSTHOG_KEY';
    console.warn(
      `[PostHog Warning]: ${missingVariable} variable required by PostHog is missing. Analytics disabled.`
    );
  }
} else if (posthogInstance && typeof posthogInstance.init === 'function') {
  try {
    posthogInstance.init(posthogKey, {
      api_host: posthogHost,
      defaults: '2026-05-30',
      capture_exceptions: {
        capture_unhandled_errors: true,
        capture_unhandled_rejections: true,
        capture_console_errors: false,
      },
    });
  } catch (err) {
    console.warn('[PostHog Init Warning]: Failed to initialize PostHog:', err.message);
  }
}

export default posthogInstance;
