// source: https://github.com/sindresorhus/is-plain-obj
// copy due to ESM-only package

function isPlainObject<Value>(
	value: unknown,
): value is Record<PropertyKey, Value> {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return (
		(prototype === null ||
			prototype === Object.prototype ||
			Object.getPrototypeOf(prototype) === null) &&
		!(Symbol.toStringTag in value) &&
		!(Symbol.iterator in value)
	);
}

export { isPlainObject };
