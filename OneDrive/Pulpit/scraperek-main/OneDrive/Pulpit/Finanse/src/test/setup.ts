import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Sonner pulls in browser APIs we don't need in tests.
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

// Stub the Supabase client — useUserSettings only uses it for fetch/upsert
// and we don't want to touch the network during integration tests.
vi.mock("@/integrations/supabase/client", () => {
  const builder = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: async () => ({ data: null, error: null }),
    upsert: async () => ({ error: null }),
  };
  return {
    supabase: {
      from: () => builder,
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    },
  };
});
