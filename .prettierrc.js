'use strict';

const prettier = {
    semi: true,
    tabWidth: 4,
    singleQuote: true,
    trailingComma: 'all',
    arrowParens: 'always',

    /**
     * Needed for Node v6 support
     */
    overrides: [
        {
            files: '*.js',
            excludeFiles: '*/**',
            options: {
                trailingComma: 'es5',
            },
        },
    ],
};

module.exports = prettier;
