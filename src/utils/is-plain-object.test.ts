/* eslint-disable @typescript-eslint/ban-ts-comment */

import { runInNewContext } from 'node:vm';
import { isPlainObject } from './is-plain-object';

function Foo(x: any) {
	// @ts-ignore
	this.x = x;
}

function ObjectConstructor(): void {}

ObjectConstructor.prototype.constructor = Object;

test.each([
	{},
	{ foo: true },
	{ constructor: Foo },
	{ valueOf: 0 },
	Object.create(null),
	// eslint-disable-next-line no-new-object
	new Object(),
	runInNewContext('({})'),
])('$value returns true', (value) => {
	const result = isPlainObject(value);
	expect(result).toEqual(true);
});

test.each([
	[
		'foo',
		'bar',
	],
	// @ts-ignore
	new Foo(1),
	Math,
	JSON,
	Atomics,
	Error,
	(): void => {},
	/./,
	null,
	undefined,
	Number.NaN,
	'',
	0,
	false,
	// @ts-ignore
	new ObjectConstructor(),
	// @ts-ignore
	(new Foo().constructor = Object),
	// @ts-ignore
	// eslint-disable-next-line func-names
	(function (): void {})(),
])('$value returns false', (value) => {
	const result = isPlainObject(value);
	expect(result).toEqual(false);
});
