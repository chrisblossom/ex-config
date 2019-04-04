/* eslint-disable no-useless-concat,no-param-reassign */

function extendError(error: Error, pathname?: string, message?: string) {
    if (pathname) {
        error.message += message || '\n' + `found in path: ${pathname}`;
    }
}

export { extendError };
