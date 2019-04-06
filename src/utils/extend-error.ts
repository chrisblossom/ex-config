/* eslint-disable no-useless-concat,no-param-reassign */

interface Args {
    error: Error;
    pathname?: string;
    message?: string;
}

function extendError({ error, pathname, message }: Args) {
    if (pathname) {
        error.message += message || '\n' + `found in path: ${pathname}`;
    }
}

export { extendError };
