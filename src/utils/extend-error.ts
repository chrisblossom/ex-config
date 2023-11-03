/* eslint-disable no-useless-concat,no-param-reassign */

interface Args {
	error: Error;
	pathname?: string;
	message?: string;
}

// TODO: refactor by renaming to extendErrorMessage and make Args more explicit
function extendError({ error, pathname, message }: Args): void {
	if (pathname != null) {
		error.message +=
			message != null && message !== ''
				? message
				: '\n' + `found in path: ${pathname}`;
	}
}

export { extendError };
