/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Activation du Dark Mode pro via une classe globale
  theme: {
    extend: {
      colors: {
        // Optionnel : Vous pourrez personnaliser vos couleurs d'accent ici
      },
    },
  },
  plugins: [],
}