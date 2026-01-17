import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                gold: {
                    50: '#FBF9F1',
                    100: '#F5F0DB',
                    200: '#EBE0B6',
                    300: '#DCC98A',
                    400: '#D1B563',
                    500: '#C6A543', // Base Gold
                    600: '#A48431',
                    700: '#836526', // Dark Bronze
                    800: '#6D5224',
                    900: '#5A4423',
                },
                cream: {
                    50: '#FDFAF6', // Ultra Light
                    100: '#F9F5EC',
                    200: '#F2EBD9',
                }
            },
            fontFamily: {
                serif: ['var(--font-playfair)', 'serif'],
                sans: ['var(--font-geist-sans)', 'sans-serif'],
            }
        },
    },
    plugins: [],
};
export default config;
