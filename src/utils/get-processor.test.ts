import { mergeDeep } from './get-processor';

describe('mergeDeep', () => {
    test('deep merges objects', () => {
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
            config: {},
            current: obj1,
            value: [obj2, obj3],
            dirname: __dirname,
            api: {},
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
