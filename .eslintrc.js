module.exports = {
	'env': {
		'es6': true,
		'node': true
	},
	'extends': 'eslint:recommended',
	'globals': {
		'Atomics': 'readonly',
		'SharedArrayBuffer': 'readonly',
		'CR': 'readwrite'
	},
	'parserOptions': {
		'ecmaVersion': 2018,
		'sourceType': 'module'
	},
	'parser': 'babel-eslint',
	'rules': {
		'indent': [
			'error',
			'tab'
		],
		'linebreak-style': [
			'error',
			'unix'
		],
		'quotes': [
			'error',
			'single',
			{ 'avoidEscape': true }
		],
		'semi': [
			'error',
			'always'
		],
		'no-control-regex': 'off'
	},
	'overrides': {
			'files': ['files/web/static/js/**/**'],
			'env': {
				'node': false,
				'browser': true,
				'jquery': true
			},
			'rules': {
				'no-undef': 'off'
			}
	}
};