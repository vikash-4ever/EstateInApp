/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        "rubik" : ['Rubik-Regular', 'sans-serif'],
        "rubik-bold" : ["Rubik-Bold", "sans-serif"],
        "rubik-extrabold" : ["Rubik-ExtraBold", "sans-serif"],
        "rubik-medium" : ["Rubik-Medium", "sans-serif"],
        "rubik-semibold" : ["Rubik-SemiBold", "sans-serif"],
        "rubik-light" : ["Rubik-Light", "sans-serif"],
      },
      colors: {
        "primary" : {
          100: '#abafb51a',
          200: '#c8c8ccff',
          300: 'black',
        },
        accent: {
          100: '#fbfbfd',
        },
        black: {
          DEFAULT: '#000000',
          50: '#5a5e74ff',
          100: '#c8c8ccff',
          200: '#666876',
          300: '#191d31',
        },
        danger: '#f75555',
      }
    }
  },
  plugins: [],
}