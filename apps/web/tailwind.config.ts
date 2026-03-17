import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bark: {
          ink: "#0b3a87",
          muted: "#38528a",
          clay: "#f7c40d",
          soft: "#fff1b6",
          line: "#d7e0f3"
        },
        foam: "#f6f9ff"
      }
    }
  },
  plugins: []
};

export default config;
