import path from 'path';
import { cloneDeep, isPlainObject } from 'lodash';
import Joi from 'joi';
import { exConfig, exConfigSync } from './ex-config';
import {
    ConfigFunctionParameters,
    PostProcessorAsync,
    PreprocessorAsync,
    ProcessorAsync,
    ValidatorAsync,
    OptionsAsync,
    BasicConfig,
} from './types';
import { automatic as automaticProcessor } from './utils/get-processor';

const cwd = process.cwd();
const app1Dir = path.resolve(__dirname, '__sandbox__/app1/');

const sleep = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

beforeEach(() => {
    process.chdir(app1Dir);
});

afterEach(() => {
    process.chdir(cwd);
});

describe('throws with undefined config', () => {
    test('async', async () => {
        // @ts-ignore
        await expect(exConfig()).rejects.toThrowErrorMatchingInlineSnapshot(
            `"config is required"`,
        );
    });

    test('sync', () => {
        // @ts-ignore
        expect(() => exConfigSync()).toThrowErrorMatchingInlineSnapshot(
            `"config is required"`,
        );
    });
});

describe('does not mutate original config', () => {
    const config = {
        presets: ['preset-04'],
        inside: [1, 2],
        plugins: ['plugin-01'],
    };

    const configClone = cloneDeep(config);

    const processor: ProcessorAsync = ({ value, current = [] }) => {
        value.push(3);
        current.push(value);
        return current;
    };

    const postProcessor: PostProcessorAsync = ({ value }) => {
        value.plugins.forEach((val: any) => {
            val[0].imported.push(`mutated ${val[0].imported[0]}`);
        });

        return value;
    };

    const options = { processor, postProcessor };

    let lastResult1;
    let lastResult2;
    const checkResult = ({ result1, result2 }: any) => {
        expect(config).toEqual(configClone);
        expect(result1).toMatchSnapshot();

        const result1Clone = cloneDeep(result1);

        expect(config).toEqual(configClone);
        expect(result2).toEqual(result1Clone);

        lastResult1 = result1;
        if (lastResult1) {
            expect(result1).toEqual(lastResult1);
        }

        lastResult2 = result2;
        if (lastResult2) {
            expect(result2).toEqual(lastResult2);
        }
    };

    test('async', async () => {
        const result1 = await exConfig(config, options);
        const result2 = await exConfig(config, options);

        checkResult({ result1, result2 });
    });

    test('sync', () => {
        const result1 = exConfigSync(config, options);
        const result2 = exConfigSync(config, options);

        checkResult({ result1, result2 });
    });
});

describe('merges deep nested presets', () => {
    const config = {
        presets: ['preset-01'],
        inside: [1],
        plugins: ['plugin-01'],
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config);

        checkResult(result);
    });
});

describe('ignores mutated value', () => {
    const config = {
        presets: ['preset-01'],
        inside: [1],
        plugins: ['plugin-01'],
        example: [0],
    };

    /* eslint-disable no-param-reassign */
    const preprocessor: PreprocessorAsync = ({ value }) => {
        const clone = cloneDeep(value);
        value = {};
        return clone;
    };

    const processor: ProcessorAsync = ({ value }) => {
        const clone = cloneDeep(value);
        value = {};
        return clone;
    };

    const postProcessor: PostProcessorAsync = ({ value }) => {
        const clone = cloneDeep(value);
        value = {};
        return clone;
    };

    const overridePreprocessor: PreprocessorAsync = ({ value }) => {
        const clone = cloneDeep(value);
        value = {};
        return clone;
    };

    const overrideProcessor: ProcessorAsync = ({ value }) => {
        const clone = cloneDeep(value);
        value = {};
        return clone;
    };
    /* eslint-enable */

    const options = {
        preprocessor,
        processor,
        postProcessor,
        overrides: {
            example: {
                preprocessor: overridePreprocessor,
                processor: overrideProcessor,
            },
        },
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config, options);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config, options);

        checkResult(result);
    });
});

describe('adds dirname to all lifecycles', () => {
    let result: any = {};

    beforeEach(() => {
        result = {
            validator: [],
            preprocessor: [],
            processor: [],
            postProcessor: [],

            overrideValidator: [],
            overridePreprocessor: [],
            overrideProcessor: [],
        };
    });

    const validator: ValidatorAsync = ({ dirname }) => {
        result.validator.push(dirname);
    };

    const preprocessor: PreprocessorAsync = ({ value, dirname }) => {
        result.preprocessor.push(dirname);
        return value;
    };

    const processor: ProcessorAsync = ({ value, dirname }) => {
        result.processor.push(dirname);
        return value;
    };

    const postProcessor: PostProcessorAsync = ({ value, dirname }) => {
        result.postProcessor.push(dirname);
        return value;
    };

    const overrideValidator: ValidatorAsync = ({ dirname }) => {
        result.overrideValidator.push(dirname);
    };

    const overridePreprocessor: PreprocessorAsync = ({ value, dirname }) => {
        result.overridePreprocessor.push(dirname);
        return value;
    };

    const overrideProcessor: ProcessorAsync = ({ value, dirname }) => {
        result.overrideProcessor.push(dirname);
        return value;
    };

    const config = {
        presets: ['preset-01'],
        inside: [1],
        plugins: ['plugin-01'],
        example: [0],
    };

    const options = {
        validator,
        preprocessor,
        processor,
        postProcessor,
        overrides: {
            example: {
                validator: overrideValidator,
                preprocessor: overridePreprocessor,
                processor: overrideProcessor,
            },
        },
    };

    let lastResult;
    const checkResult = () => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        await exConfig(config, options);

        checkResult();
    });

    test('sync', () => {
        exConfigSync(config, options);

        checkResult();
    });
});

describe('preset object order matter does not matter', () => {
    const config = {
        inside: [1],
        plugins: ['plugin-01'],
        presets: ['preset-01'],
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config);

        checkResult(result);
    });
});

describe('plugins processor can be overridden', () => {
    const processor: ProcessorAsync = ({ value }) => {
        return value;
    };

    const options: OptionsAsync = {
        processor,
        overrides: {
            plugins: {
                processor: 'arrayConcat',
            },
        },
    };

    const config = {
        presets: ['preset-01', 'preset-04'],
        plugins: ['plugin-01'],
        inside: false,
        example: false,
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config, options);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config, options);

        checkResult(result);
    });
});

describe('allows disabling presets and plugins', () => {
    const options: OptionsAsync = {
        presets: false,
        plugins: false,
    };

    const config = {
        presets: ['one'],
        inside: [1],
        plugins: ['plugin-one'],
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config, options);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config, options);

        checkResult(result);
    });
});

describe('allows custom preset and plugin name', () => {
    const options = {
        presets: 'customPreset',
        plugins: 'customPlugin',
    };

    const config = {
        customPreset: ['preset-01'],
        inside: [1],
        customPlugin: ['plugin-01'],
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config, options);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config, options);

        checkResult(result);
    });
});

describe('merges deep with custom prefix resolution', () => {
    beforeEach(() => {
        const dir = path.resolve(__dirname, '__sandbox__/app2/');
        process.chdir(dir);
    });

    const options = {
        overrides: {
            presets: {
                resolve: {
                    prefix: 'backtrack-preset',
                    org: '@backtrack',
                    orgPrefix: 'preset',
                },
            },
            plugins: {
                resolve: {
                    prefix: 'backtrack-plugin',
                    org: '@backtrack',
                    orgPrefix: 'plugin',
                },
            },
        },
    };

    const config = {
        presets: ['01'],
        inside: [1],
        plugins: ['01'],
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config, options);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config, options);

        checkResult(result);
    });
});

describe('allows builtin processor', () => {
    const options: OptionsAsync = {
        processor: 'arrayConcat',
    };

    const config = {
        presets: ['preset-01'],
        inside: [1],
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config, options);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config, options);

        checkResult(result);
    });
});

describe('allows custom processor', () => {
    const processor: ProcessorAsync = ({ value }) => {
        return value;
    };

    const options = {
        processor,
    };

    const config = {
        presets: ['preset-01'],
        inside: [0],
        example: [0],
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config, options);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config, options);

        checkResult(result);
    });
});

describe('allows builtin processor override', () => {
    const options: OptionsAsync = {
        overrides: {
            example: {
                processor: 'arrayConcat',
            },
        },
    };

    const config = {
        presets: ['preset-01'],
        inside: [1],
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config, options);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config, options);

        checkResult(result);
    });
});

describe('allows custom processor override', () => {
    const processor: ProcessorAsync = ({ value }) => {
        return value;
    };

    const options = {
        overrides: {
            example: {
                processor,
            },
        },
    };

    const config = {
        presets: ['preset-01'],
        inside: [0],
        example: [0],
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config, options);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config, options);

        checkResult(result);
    });
});

describe('catches error custom processor override', () => {
    const processor: ProcessorAsync = ({ value }) => {
        throw new Error(`bad value: ${value}`);
    };

    const options = {
        overrides: {
            example: {
                processor,
            },
        },
    };

    const config = {
        presets: ['preset-01'],
        inside: [0],
    };

    test('async', async () => {
        await expect(exConfig(config, options)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"bad value: 3
invalid key: example
found in path: <PROJECT_ROOT>/node_modules/preset-02/node_modules/preset-03/index.js"
`);
    });

    test('sync', () => {
        expect(() => exConfigSync(config, options))
            .toThrowErrorMatchingInlineSnapshot(`
"bad value: 3
invalid key: example
found in path: <PROJECT_ROOT>/node_modules/preset-02/node_modules/preset-03/index.js"
`);
    });
});

describe('mergeObject processor', () => {
    const options: OptionsAsync = {
        overrides: {
            object: {
                processor: 'mergeDeep',
            },
        },
    };

    const config = {
        presets: ['preset-01'],
        inside: [1],
        object: {
            array: [0],
            zero: true,
        },
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config, options);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config, options);

        checkResult(result);
    });
});

describe('validates config', () => {
    const validator: ValidatorAsync = ({ value }) => {
        const schema = Joi.object({
            string: Joi.string(),
        });

        const isValid = Joi.validate(value, schema, { allowUnknown: true });

        if (isValid.error) {
            throw new Error(isValid.error.annotate());
        }
    };

    const options = {
        validator,
    };

    const config = {
        string: 1,
    };

    test('async', async () => {
        await expect(exConfig(config, options)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"{
  \\"string\\" [31m[1][0m: 1
}
[31m
[1] \\"string\\" must be a string[0m"
`);
    });

    test('sync', () => {
        expect(() => exConfigSync(config, options))
            .toThrowErrorMatchingInlineSnapshot(`
"{
  \\"string\\" [31m[1][0m: 1
}
[31m
[1] \\"string\\" must be a string[0m"
`);
    });
});

describe('validates nested config', () => {
    const validator: ValidatorAsync = ({ value }) => {
        const schema = Joi.object({
            other: Joi.string(),
        });

        const isValid = Joi.validate(value, schema, { allowUnknown: true });

        if (isValid.error) {
            throw new Error(isValid.error.annotate());
        }
    };

    const options = {
        presets: 'presets',
        validator,
    };

    const config = {
        presets: ['preset-01'],
    };

    test('async', async () => {
        await expect(exConfig(config, options)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"{
  \\"example\\": [
    1
  ],
  \\"presets\\": [
    \\"preset-02\\"
  ],
  \\"object\\": {
    \\"array\\": [
      1
    ],
    \\"one\\": true,
    \\"preset\\": 1
  },
  \\"other\\" [31m[1][0m: 1
}
[31m
[1] \\"other\\" must be a string[0m
invalid nested config: <PROJECT_ROOT>/node_modules/preset-01/index.js"
`);
    });

    test('sync', () => {
        expect(() => exConfigSync(config, options))
            .toThrowErrorMatchingInlineSnapshot(`
"{
  \\"example\\": [
    1
  ],
  \\"presets\\": [
    \\"preset-02\\"
  ],
  \\"object\\": {
    \\"array\\": [
      1
    ],
    \\"one\\": true,
    \\"preset\\": 1
  },
  \\"other\\" [31m[1][0m: 1
}
[31m
[1] \\"other\\" must be a string[0m
invalid nested config: <PROJECT_ROOT>/node_modules/preset-01/index.js"
`);
    });
});

describe('validates override config', () => {
    const validator: ValidatorAsync = ({ value }) => {
        const schema = Joi.string();

        const isValid = Joi.validate(value, schema, { allowUnknown: true });

        if (isValid.error) {
            throw new Error(isValid.error.annotate());
        }
    };

    const options = {
        overrides: {
            string: {
                validator,
            },
        },
    };

    const config = {
        string: 1,
    };

    test('async', async () => {
        await expect(exConfig(config, options)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"\\"value\\" must be a string
invalid key: string"
`);
    });

    test('sync', () => {
        expect(() => exConfigSync(config, options))
            .toThrowErrorMatchingInlineSnapshot(`
"\\"value\\" must be a string
invalid key: string"
`);
    });
});

describe('validates nested override config', () => {
    const validator: ValidatorAsync = ({ value }) => {
        const schema = Joi.string();

        const isValid = Joi.validate(value, schema, { allowUnknown: true });

        if (isValid.error) {
            throw new Error(isValid.error.annotate());
        }
    };

    const options = {
        overrides: {
            other: {
                validator,
            },
        },
    };

    const config = {
        presets: ['preset-01'],
        string: 1,
    };

    test('async', async () => {
        await expect(exConfig(config, options)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"\\"value\\" must be a string
invalid key: other
found in path: <PROJECT_ROOT>/node_modules/preset-02/node_modules/preset-03/index.js"
`);
    });

    test('sync', () => {
        expect(() => exConfigSync(config, options))
            .toThrowErrorMatchingInlineSnapshot(`
"\\"value\\" must be a string
invalid key: other
found in path: <PROJECT_ROOT>/node_modules/preset-02/node_modules/preset-03/index.js"
`);
    });
});

describe('allows post processing', () => {
    const postProcessor: PostProcessorAsync = ({ value }) => {
        const example = value.example.map((number: number) => number * 2);
        return {
            ...value,
            example,
        };
    };

    const options = {
        postProcessor,
    };

    const config = {
        presets: ['preset-01'],
        example: [0],
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        // Call twice to ensure loaded works
        await exConfig(config);
        const result = await exConfig(config, options);

        checkResult(result);
    });

    test('sync', () => {
        // Call twice to ensure loaded works
        exConfigSync(config);
        const result = exConfigSync(config, options);

        checkResult(result);
    });
});

describe('allows post processing error', () => {
    const postProcessor: PostProcessorAsync = ({ value }) => {
        throw new Error(`postProcessor error ${value.example}`);
    };

    const options = {
        postProcessor,
    };

    const config = {
        presets: ['preset-01'],
        example: [0],
    };

    test('async', async () => {
        await expect(exConfig(config, options)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"postProcessor error 3,2,1,0
found in path: <PROJECT_ROOT>"
`);
    });

    test('sync', () => {
        expect(() => exConfigSync(config, options))
            .toThrowErrorMatchingInlineSnapshot(`
"postProcessor error 3,2,1,0
found in path: <PROJECT_ROOT>"
`);
    });
});

describe('allows preprocessor', () => {
    const validator: ValidatorAsync = ({ value }) => {
        const schema = Joi.object({
            example: Joi.array().items(Joi.string()),
        });

        const isValid = Joi.validate(value, schema, { allowUnknown: true });

        if (isValid.error) {
            throw new Error(isValid.error.annotate());
        }
    };

    const preprocessor: PreprocessorAsync = ({ value }) => {
        const example = value.example.map((number: number) =>
            number.toString(),
        );

        return {
            ...value,
            example,
        };
    };

    const options = {
        validator,
        preprocessor,
    };

    const config = {
        presets: ['preset-01'],
        example: [0],
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config, options);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config, options);

        checkResult(result);
    });
});

describe('preprocessor error', () => {
    const validator: ValidatorAsync = ({ value }) => {
        const schema = Joi.object({
            example: Joi.array().items(Joi.string()),
        });

        const isValid = Joi.validate(value, schema, { allowUnknown: true });

        if (isValid.error) {
            throw new Error(isValid.error.annotate());
        }
    };

    const preprocessor: PreprocessorAsync = ({ value }) => {
        throw new Error(`preprocessor ${value.example}`);
    };

    const options = {
        validator,
        preprocessor,
    };

    const config = {
        presets: ['01'],
        example: [0],
    };

    test('async', async () => {
        await expect(exConfig(config, options)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"preprocessor 0
found in path: <PROJECT_ROOT>"
`);
    });

    test('sync', () => {
        expect(() => exConfigSync(config, options))
            .toThrowErrorMatchingInlineSnapshot(`
"preprocessor 0
found in path: <PROJECT_ROOT>"
`);
    });
});

describe('allows preprocessor override', () => {
    const validator: ValidatorAsync = ({ value }) => {
        const schema = Joi.array().items(Joi.string());

        const isValid = Joi.validate(value, schema, { allowUnknown: true });

        if (isValid.error) {
            throw new Error(isValid.error.annotate());
        }
    };

    const preprocessor: PreprocessorAsync = ({ value }) => {
        const example = value.map((number: number) => number.toString());

        return example;
    };

    const options = {
        overrides: {
            example: {
                preprocessor,
                validator,
            },
        },
    };

    const config = {
        presets: ['preset-01'],
        example: [0],
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config, options);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config, options);

        checkResult(result);
    });
});

describe('preprocessor override error', () => {
    const validator: ValidatorAsync = ({ value }) => {
        const schema = Joi.array().items(Joi.string());

        const isValid = Joi.validate(value, schema, { allowUnknown: true });

        if (isValid.error) {
            throw new Error(isValid.error.annotate());
        }
    };

    const preprocessor: PreprocessorAsync = ({ value }) => {
        throw new Error(`preprocessor ${value}`);
    };

    const options = {
        overrides: {
            example: {
                preprocessor,
                validator,
            },
        },
    };

    const config = {
        presets: ['preset-01'],
        example: [0],
    };

    test('async', async () => {
        await expect(exConfig(config, options)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"preprocessor 3
invalid key: example"
`);
    });

    test('sync', () => {
        expect(() => exConfigSync(config, options))
            .toThrowErrorMatchingInlineSnapshot(`
"preprocessor 3
invalid key: example"
`);
    });
});

describe('extends must be a string', () => {
    const presetPath = path.resolve(app1Dir, 'node_modules/preset-01');
    const one = require(presetPath);

    const config = {
        presets: [one],
    };

    test('async', async () => {
        await expect(exConfig(config)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"{
  \\"presets\\": [
    {
      \\"example\\": [
        1
      ],
      \\"other\\": 1,
      \\"presets\\": [
        \\"preset-02\\"
      ],
      \\"object\\": {
        \\"array\\": [
          1
        ],
        \\"one\\": true,
        \\"preset\\": 1
      }
    }
  ]
}
[31m
[1] \\"presets\\" at position 0 does not match any of the allowed types[0m
extends key must be a module expressed as a string"
`);
    });

    test('sync', () => {
        expect(() => exConfigSync(config)).toThrowErrorMatchingInlineSnapshot(`
"{
  \\"presets\\": [
    {
      \\"example\\": [
        1
      ],
      \\"other\\": 1,
      \\"presets\\": [
        \\"preset-02\\"
      ],
      \\"object\\": {
        \\"array\\": [
          1
        ],
        \\"one\\": true,
        \\"preset\\": 1
      }
    }
  ]
}
[31m
[1] \\"presets\\" at position 0 does not match any of the allowed types[0m
extends key must be a module expressed as a string"
`);
    });
});

describe('extends must be a string - nested', () => {
    const config = {
        presets: ['invalid-preset-01'],
    };

    test('async', async () => {
        await expect(exConfig(config)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"{
  \\"presets\\": [
    {
      \\"example\\": [
        1
      ],
      \\"other\\": 1,
      \\"presets\\": [
        \\"preset-02\\"
      ],
      \\"object\\": {
        \\"array\\": [
          1
        ],
        \\"one\\": true,
        \\"preset\\": 1
      }
    }
  ]
}
[31m
[1] \\"presets\\" at position 0 does not match any of the allowed types[0m
extends key must be a module expressed as a string
found in path: <PROJECT_ROOT>/node_modules/invalid-preset-01/index.js"
`);
    });

    test('sync', () => {
        expect(() => exConfigSync(config)).toThrowErrorMatchingInlineSnapshot(`
"{
  \\"presets\\": [
    {
      \\"example\\": [
        1
      ],
      \\"other\\": 1,
      \\"presets\\": [
        \\"preset-02\\"
      ],
      \\"object\\": {
        \\"array\\": [
          1
        ],
        \\"one\\": true,
        \\"preset\\": 1
      }
    }
  ]
}
[31m
[1] \\"presets\\" at position 0 does not match any of the allowed types[0m
extends key must be a module expressed as a string
found in path: <PROJECT_ROOT>/node_modules/invalid-preset-01/index.js"
`);
    });
});

describe('resolve must be a string', () => {
    const pluginPath = path.resolve(app1Dir, 'node_modules/plugin-01');
    const pluginOne = require(pluginPath);

    const config = {
        plugins: [pluginOne],
    };

    test('async', async () => {
        await expect(exConfig(config)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"{
  \\"plugins\\": [
    {
      \\"imported\\": [
        \\"imported plugin-01\\"
      ]
    }
  ]
}
[31m
[1] \\"plugins\\" at position 0 does not match any of the allowed types[0m
extends key must be a module expressed as a string"
`);
    });

    test('sync', () => {
        expect(() => exConfigSync(config)).toThrowErrorMatchingInlineSnapshot(`
"{
  \\"plugins\\": [
    {
      \\"imported\\": [
        \\"imported plugin-01\\"
      ]
    }
  ]
}
[31m
[1] \\"plugins\\" at position 0 does not match any of the allowed types[0m
extends key must be a module expressed as a string"
`);
    });
});

describe('resolve must be a string - nested', () => {
    const config = {
        presets: ['invalid-preset-02'],
    };

    test('async', async () => {
        await expect(exConfig(config)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"{
  \\"plugins\\": [
    {
      \\"imported\\": [
        \\"imported plugin-01\\"
      ]
    }
  ]
}
[31m
[1] \\"plugins\\" at position 0 does not match any of the allowed types[0m
extends key must be a module expressed as a string
found in path: <PROJECT_ROOT>/node_modules/invalid-preset-02/index.js"
`);
    });

    test('sync', () => {
        expect(() => exConfigSync(config)).toThrowErrorMatchingInlineSnapshot(`
"{
  \\"plugins\\": [
    {
      \\"imported\\": [
        \\"imported plugin-01\\"
      ]
    }
  ]
}
[31m
[1] \\"plugins\\" at position 0 does not match any of the allowed types[0m
extends key must be a module expressed as a string
found in path: <PROJECT_ROOT>/node_modules/invalid-preset-02/index.js"
`);
    });
});

describe('resolve must be a string - nested - works as array', () => {
    const config = {
        presets: [['invalid-preset-02', {}]],
    };

    test('async', async () => {
        await expect(exConfig(config)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"{
  \\"plugins\\": [
    {
      \\"imported\\": [
        \\"imported plugin-01\\"
      ]
    }
  ]
}
[31m
[1] \\"plugins\\" at position 0 does not match any of the allowed types[0m
extends key must be a module expressed as a string
found in path: <PROJECT_ROOT>/node_modules/invalid-preset-02/index.js"
`);
    });

    test('sync', () => {
        expect(() => exConfigSync(config)).toThrowErrorMatchingInlineSnapshot(`
"{
  \\"plugins\\": [
    {
      \\"imported\\": [
        \\"imported plugin-01\\"
      ]
    }
  ]
}
[31m
[1] \\"plugins\\" at position 0 does not match any of the allowed types[0m
extends key must be a module expressed as a string
found in path: <PROJECT_ROOT>/node_modules/invalid-preset-02/index.js"
`);
    });
});

describe('es modules must use a default export', () => {
    const config = {
        presets: ['invalid-preset-03'],
    };

    test('async', async () => {
        await expect(exConfig(config)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"<PROJECT_ROOT>/node_modules/invalid-preset-03/index.js must use export default with es modules
found in path: <PROJECT_ROOT>"
`);
    });

    test('sync', () => {
        expect(() => exConfigSync(config)).toThrowErrorMatchingInlineSnapshot(`
"<PROJECT_ROOT>/node_modules/invalid-preset-03/index.js must use export default with es modules
found in path: <PROJECT_ROOT>"
`);
    });
});

describe('calls presets and plugins as a function with default options = {}', () => {
    const config = {
        presets: ['preset-05'],
        plugins: ['plugin-03'],
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config);

        checkResult(result);
    });
});

describe('calls presets and plugins as a function with specified options', () => {
    const config = {
        presets: [['preset-05', { special: 'options 05' }]],
        plugins: [['plugin-03', { special: 'options 03' }]],
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config);

        checkResult(result);
    });
});

describe('handle base config as function', () => {
    const config = (args: ConfigFunctionParameters) => {
        return {
            args,
            presets: [['preset-05', { special: 'options 05' }]],
            plugins: [['plugin-03', { special: 'options 03' }]],
        };
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config);

        checkResult(result);
    });
});

describe('handles es module default exports', () => {
    const config = {
        presets: ['preset-06'],
        plugins: ['plugin-04'],
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config);

        checkResult(result);
    });
});

describe('baseDirectory option', () => {
    const baseDirectory = path.resolve(__dirname, '__sandbox__/app2/');

    const options = {
        baseDirectory,
        overrides: {
            presets: {
                resolve: {
                    prefix: 'backtrack-preset',
                    org: '@backtrack',
                    orgPrefix: 'preset',
                },
            },
            plugins: {
                resolve: {
                    prefix: 'backtrack-plugin',
                    org: '@backtrack',
                    orgPrefix: 'plugin',
                },
            },
        },
    };

    const config = {
        presets: ['01'],
        inside: [1],
        plugins: ['01'],
    };

    let lastResult;
    const checkResult = (result: BasicConfig) => {
        expect(result).toMatchSnapshot();

        lastResult = result;
        if (lastResult) {
            expect(result).toEqual(lastResult);
        }
    };

    test('async', async () => {
        const result = await exConfig(config, options);

        checkResult(result);
    });

    test('sync', () => {
        const result = exConfigSync(config, options);

        checkResult(result);
    });
});

describe('async-only tests', () => {
    test('adds dirname to all lifecycles with delay', async () => {
        function changeValues(object: { [key: string]: any }, context: string) {
            function updater(value: any): any {
                if (isPlainObject(value) === true) {
                    const updatedObject = Object.keys(value).reduce(
                        (acc, key) => {
                            const val = value[key];

                            if (['presets', 'plugins'].includes(key) === true) {
                                return { ...acc, [key]: val };
                            }

                            return {
                                ...acc,
                                [key]: updater(val),
                            };
                        },
                        {},
                    );

                    return updatedObject;
                }

                if (Array.isArray(value)) {
                    return value.map((val) => updater(val));
                }

                if (
                    typeof value !== 'string' &&
                    typeof value.toString === 'function'
                ) {
                    // eslint-disable-next-line no-param-reassign
                    value = value.toString();
                }

                if (typeof value === 'string') {
                    return `${value} ${context}`;
                }

                return value;
            }

            const updated = updater(object);

            return updated;
        }

        const preprocessor: PreprocessorAsync = async ({ value }) => {
            await sleep();

            const updated = changeValues(value, 'preprocessor');

            return updated;
        };

        const processor: ProcessorAsync = async ({
            config,
            value,
            current,
            dirname,
        }) => {
            await sleep();

            const initialMerge = automaticProcessor({
                config,
                value: changeValues(value, 'processor'),
                current,
                dirname,
            });

            return initialMerge;
        };

        const postProcessor: PostProcessorAsync = async ({ value }) => {
            await sleep();

            const updated = changeValues(value, 'postProcessor');

            return updated;
        };

        const overridePreprocessor: PreprocessorAsync = async ({ value }) => {
            await sleep();

            const updated = changeValues(value, 'overridePreprocessor');

            return updated;
        };

        const overrideProcessor: ProcessorAsync = async ({
            config,
            value,
            current,
            dirname,
        }) => {
            await sleep();

            const initialMerge = automaticProcessor({
                config,
                value: changeValues(value, 'overrideProcessor'),
                current,
                dirname,
            });

            return initialMerge;
        };

        const config = {
            presets: ['preset-01'],
            inside: [1],
            plugins: ['plugin-01'],
            example: [0],
        };

        const options = {
            preprocessor,
            processor,
            postProcessor,
            overrides: {
                example: {
                    preprocessor: overridePreprocessor,
                    processor: overrideProcessor,
                },
            },
        };

        const parsedConfig = await exConfig(config, options);
        expect(parsedConfig).toMatchSnapshot();
    });

    test('config can be async', async () => {
        const expected = {
            works: true,
        };

        const config = async () => {
            await sleep();

            return expected;
        };

        const parsedConfig = await exConfig(config);
        expect(parsedConfig).toEqual(expected);
    });

    test('error in postProcessor will extendError', async () => {
        const baseConfig = {};

        const postProcessor: PostProcessorAsync = async () => {
            await sleep();
            throw new Error('postProcessor can throw');
        };

        const options = { postProcessor };

        await expect(exConfig(baseConfig, options)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"postProcessor can throw
found in path: <PROJECT_ROOT>"
`);
    });

    test('validator can be async', async () => {
        const baseConfig = {};

        const validator: ValidatorAsync = async () => {
            await sleep();
            throw new Error('validator can throw');
        };

        const options = { validator };

        await expect(
            exConfig(baseConfig, options),
        ).rejects.toThrowErrorMatchingInlineSnapshot(`"validator can throw"`);
    });

    test('validator can be async - extended config', async () => {
        const baseConfig = {
            presets: ['preset-01'],
        };

        let loaded = 0;
        const validator: ValidatorAsync = async () => {
            loaded += 1;
            await sleep();

            if (loaded === 2) {
                throw new Error('extended validator can throw');
            }
        };
        const options = { validator };

        await expect(exConfig(baseConfig, options)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"extended validator can throw
invalid nested config: <PROJECT_ROOT>/node_modules/preset-01/index.js"
`);
    });

    test('validator override can be async', async () => {
        const baseConfig = {
            valid: 0,
            invalidExample: 1,
        };

        const overrideValidator: ValidatorAsync = async () => {
            await sleep();
            throw new Error('validator override can throw');
        };

        const options = {
            overrides: {
                invalidExample: {
                    validator: overrideValidator,
                },
            },
        };

        await expect(exConfig(baseConfig, options)).rejects
            .toThrowErrorMatchingInlineSnapshot(`
"validator override can throw
invalid key: invalidExample"
`);
    });
});
