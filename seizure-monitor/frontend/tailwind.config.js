/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#87AEEE",
        },
        semantic: {
          alert: "#FF8383",
          ok: "#83D49B",
        },
        ink: {
          100: "#3D3D3D",
          60: "#8A8A8A",
        },
        surface: "#FFFFFF",
        bg: "#F5F2EE",
        accent: {
          pink: "#FB83FF",
          peach: "#FFD8CC",
          blue: "#C4E5FF",
        }
      },
      fontWeight: {
        regular: 400,
        semibold: 600,
      },
      fontSize: {
        title: "24px",
        h2: "18px",
        body: "16px",
        bodySmall: "14px",
        mono: "14px",
      },
      spacing: {
        grid: "8px",
        margin: "16px",
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}
