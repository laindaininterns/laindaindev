// Standalone safe mock for PostHog analytics (no external package dependency)
const posthogMock = {
  init: () => {},
  capture: () => {},
  identify: () => {},
  reset: () => {},
  on: () => {},
  people: {
    set: () => {},
    set_once: () => {}
  }
};

export const isPostHogEnabled = false;
export { posthogMock as posthog };
export default posthogMock;
