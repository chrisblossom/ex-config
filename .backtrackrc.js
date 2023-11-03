'use strict';

module.exports = {
	presets: [
		[
			'@backtrack/node',
			{ mode: 'module', syntax: 'typescript' },
		],
	],

	config: {
		wallaby: (config) => {
			config.files = config.files.filter((pattern) => {
				return pattern !== '!**/node_modules/**';
			});

			config.files.push('!node_modules/**');

			return config;
		},

		eslint: {
			rules: {
				'import/no-cycle': 'off',
				'@typescript-eslint/no-require-imports': 'off',

				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/no-unsafe-assignment': 'off',
				'@typescript-eslint/no-unsafe-return': 'off',
				'@typescript-eslint/no-unsafe-member-access': 'off',

				'@typescript-eslint/strict-boolean-expressions': 'off',
			},
		},

		/**
		 * Jest v29 does not support prettier v3.
		 *
		 * Remove this when Jest v30 is released.
		 *
		 * https://jestjs.io/docs/configuration/#prettierpath-string
		 */
		jest: {
			prettierPath: null,
		},
	},
};
