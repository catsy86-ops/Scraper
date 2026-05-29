import { vi } from "vitest";

vi.mock("framer-motion", () => ({
  motion: vi.fn(() => (props: object) => {
    const { children } = props as { children?: unknown };
    return children;
  }),
  AnimatePresence: ({ children }: { children: unknown }) => children,
}));