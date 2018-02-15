/* @flow */

import { mergeDeep } from './processors';

describe('mergeDeep', () => {
    it('deep merges objects', () => {
        const obj1 = {
            all: 1,
            one: 1,
            two: {
                inside1: 'one',
                inside2: {
                    inside1: ['1'],
                    inside2: '1',
                },
            },
        };

        const obj2 = {
            all: 2,
            two: {
                inside2: {
                    inside1: ['2'],
                    inside2: '2',
                    inside3: '2',
                },
            },
        };

        const obj3 = {
            all: 3,
            two: {
                inside2: {
                    inside1: ['3'],
                    inside2: '2',
                    inside3: 3,
                },
            },
            three: 3,
        };

        const result = mergeDeep({
            current: obj1,
            value: [obj2, obj3],
            dirname: __dirname,
        });

        expect(result).toEqual({
            all: 3,
            one: 1,
            two: {
                inside1: 'one',
                inside2: {
                    inside1: ['1', '2', '3'],
                    inside2: '2',
                    inside3: 3,
                },
            },
            three: 3,
        });
    });
});
