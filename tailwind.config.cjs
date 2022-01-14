const colors = require('tailwindcss/colors');

module.exports = {
	// add this section
	purge: ['./src/**/*.html', './src/**/*.svelte'],
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
