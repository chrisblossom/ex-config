import path from 'path';
import { cloneDeep } from 'lodash';
import Joi from 'joi';
import {
    exConfig,
    Config,
    PostProcessor,
    Preprocessor,
    Processor,
    Validator,
    Options,
} from './ex-config';

const cwd = process.cwd();
const app1Dir = path.resolve(__dirname, '__sandbox__/app1/');

beforeEach(() => {
    process.chdir(app1Dir);
});

afterEach(() => {
    process.chdir(cwd);
});

test('throws with undefined config', () => {
    // @ts-ignore
    expect(() => exConfig()).toThrowErrorMatchingInlineSnapshot(
        `"config is required"`,
    );
});

test('does not mutate original config', () => {
    const config = {
        presets: ['preset-04'],
        inside: [1, 2],
        plugins: ['plugin-01'],
    };

    const configClone = cloneDeep(config);

    const processor: Processor = ({ value, current = [] }) => {
        value.push(3);
        current.push(value);
        return current;
    };

    const postProcessor: PostProcessor = ({ value }) => {
        value.plugins.forEach((val: any) => {
            val[0].imported.push(`mutated ${val[0].imported[0]}`);
        });

        return value;
    };

    const options = { processor, postProcessor };

    const result1 = exConfig(config, options);

    expect(config).toEqual(configClone);
    expect(result1).toMatchSnapshot();

    const clone1 = cloneDeep(result1);

    const result2 = exConfig(config, options);
    expect(config).toEqual(configClone);
    expect(result2).toEqual(clone1);
});

test('merges deep nested presets', () => {
    const config = {
        presets: ['preset-01'],
        inside: [1],
        plugins: ['plugin-01'],
    };

    const result = exConfig(config);

    expect(result).toMatchSnapshot();
});

test('ignores mutated value', () => {
    const config = {
        presets: ['preset-01'],
        inside: [1],
        plugins: ['plugin-01'],
        example: [0],
    };

    /* eslint-disable no-param-reassign */
    const preprocessor: Preprocessor = ({ value }) => {
        const clone = cloneDeep(value);
        value = {};
        return clone;
    };

    const processor: Processor = ({ value }) => {
        const clone = cloneDeep(value);
        value = {};
        return clone;
    };

    const postProcessor: PostProcessor = ({ value }) => {
        const clone = cloneDeep(value);
        value = {};
        return clone;
    };

    const overridePreprocessor: Preprocessor = ({ value }) => {
        const clone = cloneDeep(value);
        value = {};
        return clone;
    };

    const overrideProcessor: Processor = ({ value }) => {
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

    const result = exConfig(config, options);

    expect(result).toMatchSnapshot();
});

test('adds dirname to all lifecycles', () => {
    const result: any = {
        validator: [],
        preprocessor: [],
        processor: [],
        postProcessor: [],

        overrideValidator: [],
        overridePreprocessor: [],
        overrideProcessor: [],
    };

    const validator: Validator = ({ dirname }) => {
        result.validator.push(dirname);
    };

    const preprocessor: Preprocessor = ({ value, dirname }) => {
        result.preprocessor.push(dirname);
        return value;
    };

    const processor: Processor = ({ value, dirname }) => {
        result.processor.push(dirname);
        return value;
    };

    const postProcessor: PostProcessor = ({ value, dirname }) => {
        result.postProcessor.push(dirname);
        return value;
    };

    const overrideValidator: Validator = ({ dirname }) => {
        result.overrideValidator.push(dirname);
    };

    const overridePreprocessor: Preprocessor = ({ value, dirname }) => {
        result.overridePreprocessor.push(dirname);
        return value;
    };

    const overrideProcessor: Processor = ({ value, dirname }) => {
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

    exConfig(config, options);

    expect(result).toMatchSnapshot();
});

test('preset object order matter does not matter', () => {
    const config = {
        inside: [1],
        plugins: ['plugin-01'],
        presets: ['preset-01'],
    };

    const result = exConfig(config);

    expect(result).toMatchSnapshot();
});

test('plugins processor can be overridden', () => {
    const processor: Processor = ({ value }) => {
        return value;
    };

    const options: Options = {
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

    const result = exConfig(config, options);
    expect(result).toMatchSnapshot();
});

test('allows disabling presets and plugins', () => {
    const options: Options = {
        presets: false,
        plugins: false,
    };

    const config = {
        presets: ['one'],
        inside: [1],
        plugins: ['plugin-one'],
    };

    const result = exConfig(config, options);

    expect(result).toMatchSnapshot();
});

test('allows custom preset and plugin name', () => {
    const options = {
        presets: 'customPreset',
        plugins: 'customPlugin',
    };

    const config = {
        customPreset: ['preset-01'],
        inside: [1],
        customPlugin: ['plugin-01'],
    };

    const result = exConfig(config, options);

    expect(result).toMatchSnapshot();
});

test('merges deep with custom prefix resolution', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app2/');
    process.chdir(dir);

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

    const result = exConfig(config, options);

    expect(result).toMatchSnapshot();
});

test('allows builtin processor', () => {
    const options: Options = {
        processor: 'arrayConcat',
    };

    const config = {
        presets: ['preset-01'],
        inside: [1],
    };

    const result = exConfig(config, options);

    expect(result).toMatchSnapshot();
});

test('allows custom processor', () => {
    const processor: Processor = ({ value }) => {
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

    const result = exConfig(config, options);

    expect(result).toMatchSnapshot();
});

test('allows builtin processor override', () => {
    const options: Options = {
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

    const result = exConfig(config, options);

    expect(result).toMatchSnapshot();
});

test('allows custom processor override', () => {
    const processor: Processor = ({ value }) => {
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

    const result = exConfig(config, options);

    expect(result).toMatchSnapshot();
});

test('catches error custom processor override', () => {
    const processor: Processor = ({ value }) => {
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

    expect(() => exConfig(config, options)).toThrowErrorMatchingInlineSnapshot(`
"bad value: 3
invalid key: example
found in path: <PROJECT_ROOT>/node_modules/preset-02/node_modules/preset-03/index.js"
`);
});

test('mergeObject processor', () => {
    const options: Options = {
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

    const result = exConfig(config, options);

    expect(result).toMatchSnapshot();
});

test('validates config', () => {
    const validator: Validator = ({ value }) => {
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

    expect(() => exConfig(config, options)).toThrowErrorMatchingInlineSnapshot(`
"{
  \\"string\\" [31m[1][0m: 1
}
[31m
[1] \\"string\\" must be a string[0m"
`);
});

test('validates nested config', () => {
    const validator: Validator = ({ value }) => {
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

    expect(() => exConfig(config, options)).toThrowErrorMatchingInlineSnapshot(`
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

test('validates override config', () => {
    const validator: Validator = ({ value }) => {
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

    expect(() => exConfig(config, options)).toThrowErrorMatchingInlineSnapshot(`
"\\"value\\" must be a string
invalid key: string"
`);
});

test('validates nested override config', () => {
    const validator: Validator = ({ value }) => {
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

    expect(() => exConfig(config, options)).toThrowErrorMatchingInlineSnapshot(`
"\\"value\\" must be a string
invalid key: other
found in path: <PROJECT_ROOT>/node_modules/preset-02/node_modules/preset-03/index.js"
`);
});

test('allows post processing', () => {
    const postProcessor: PostProcessor = ({ value }) => {
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

    // Call twice to ensure loaded works
    exConfig(config);
    const result = exConfig(config, options);
    expect(result).toMatchSnapshot();
});

test('allows post processing error', () => {
    const postProcessor: PostProcessor = ({ value }) => {
        throw new Error(`postProcessor error ${value.example}`);
    };

    const options = {
        postProcessor,
    };

    const config = {
        presets: ['preset-01'],
        example: [0],
    };

    expect(() => exConfig(config, options)).toThrowErrorMatchingInlineSnapshot(`
"postProcessor error 3,2,1,0
found in path: <PROJECT_ROOT>"
`);
});

test('allows preprocessor', () => {
    const validator: Validator = ({ value }) => {
        const schema = Joi.object({
            example: Joi.array().items(Joi.string()),
        });

        const isValid = Joi.validate(value, schema, { allowUnknown: true });

        if (isValid.error) {
            throw new Error(isValid.error.annotate());
        }
    };

    const preprocessor: Preprocessor = ({ value }) => {
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

    const result = exConfig(config, options);
    expect(result).toMatchSnapshot();
});

test('preprocessor error', () => {
    const validator: Validator = ({ value }) => {
        const schema = Joi.object({
            example: Joi.array().items(Joi.string()),
        });

        const isValid = Joi.validate(value, schema, { allowUnknown: true });

        if (isValid.error) {
            throw new Error(isValid.error.annotate());
        }
    };

    const preprocessor: Preprocessor = ({ value }) => {
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

    expect(() => exConfig(config, options)).toThrowErrorMatchingInlineSnapshot(`
"preprocessor 0
found in path: <PROJECT_ROOT>"
`);
});

test('allows preprocessor override', () => {
    const validator: Validator = ({ value }) => {
        const schema = Joi.array().items(Joi.string());

        const isValid = Joi.validate(value, schema, { allowUnknown: true });

        if (isValid.error) {
            throw new Error(isValid.error.annotate());
        }
    };

    const preprocessor: Preprocessor = ({ value }) => {
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

    const result = exConfig(config, options);
    expect(result).toMatchSnapshot();
});

test('preprocessor override error', () => {
    const validator: Validator = ({ value }) => {
        const schema = Joi.array().items(Joi.string());

        const isValid = Joi.validate(value, schema, { allowUnknown: true });

        if (isValid.error) {
            throw new Error(isValid.error.annotate());
        }
    };

    const preprocessor: Preprocessor = ({ value }) => {
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

    expect(() => exConfig(config, options)).toThrowErrorMatchingInlineSnapshot(`
"preprocessor 3
invalid key: example"
`);
});

test('extends must be a string', () => {
    const presetPath = path.resolve(app1Dir, 'node_modules/preset-01');
    const one = require(presetPath);

    const config = {
        presets: [one],
    };

    expect(() => exConfig(config)).toThrowErrorMatchingInlineSnapshot(`
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

test('extends must be a string - nested', () => {
    const config = {
        presets: ['invalid-preset-01'],
    };

    expect(() => exConfig(config)).toThrowErrorMatchingInlineSnapshot(`
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

test('resolve must be a string', () => {
    const pluginPath = path.resolve(app1Dir, 'node_modules/plugin-01');
    const pluginOne = require(pluginPath);

    const config = {
        plugins: [pluginOne],
    };

    expect(() => exConfig(config)).toThrowErrorMatchingInlineSnapshot(`
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

test('resolve must be a string - nested', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['invalid-preset-02'],
    };

    expect(() => exConfig(config)).toThrowErrorMatchingInlineSnapshot(`
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

test('resolve must be a string - nested - works as array', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: [['invalid-preset-02', {}]],
    };

    expect(() => exConfig(config)).toThrowErrorMatchingInlineSnapshot(`
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

test('es modules must use a default export', () => {
    const config = {
        presets: ['invalid-preset-03'],
    };

    expect(() => exConfig(config)).toThrowErrorMatchingInlineSnapshot(`
"<PROJECT_ROOT>/node_modules/invalid-preset-03/index.js must use export default with es modules
found in path: <PROJECT_ROOT>"
`);
});

test('calls presets and plugins as a function with default options = {}', () => {
    const config = {
        presets: ['preset-05'],
        plugins: ['plugin-03'],
    };

    const result = exConfig(config);

    expect(result).toMatchSnapshot();
});

test('calls presets and plugins as a function with specified options', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: [['preset-05', { special: 'options 05' }]],
        plugins: [['plugin-03', { special: 'options 03' }]],
    };

    const result = exConfig(config);

    expect(result).toMatchSnapshot();
});

test('handle base config as function', () => {
    const config = (args: Config) => {
        return {
            args,
            presets: [['preset-05', { special: 'options 05' }]],
            plugins: [['plugin-03', { special: 'options 03' }]],
        };
    };

    const result = exConfig(config);

    expect(result).toMatchSnapshot();
});

test('handles es module default exports', () => {
    const config = {
        presets: ['preset-06'],
        plugins: ['plugin-04'],
    };

    const result = exConfig(config);

    expect(result).toMatchSnapshot();
});
