import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#163324",
        deep: "#0f2b1d",
        paper: "#f5f7f3",
        card: "#ffffff",
        line: "#dce5dc",
        greenx: "#28573c",
        sage: "#edf4eb",
        gold: "#c89b4a",
        goldbg: "#fff8e9",
        danger: "#98532f",
        muted: "#708073",
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
      },
      boxShadow: {
        card: "0 15px 34px -28px rgba(16,47,31,.4)",
      },
    },
  },
  plugins: [],
};

export default config;
