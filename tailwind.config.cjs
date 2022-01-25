const colors = require('tailwindcss/colors');

module.exports = {
	// add this section
	content: ['./src/**/*.html', './src/**/*.svelte', './src/**/*.ts'],
	darkMode: 'media', // or 'media' or 'class'
	theme: {
		extend: {
			fontFamily: {
				sans: ['"Clear Sans"', 'system-ui', 'sans-serif']
			},
			colors: {
				primary: colors.green
			}
		}
	},
	variants: {
		extend: {}
	},
	plugins: []
};
