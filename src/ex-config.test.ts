import path from 'path';
import { cloneDeep } from 'lodash';
import Joi from 'joi';
import ExConfig, {
    Config,
    PostProcessor,
    Preprocessor,
    Processor,
    Validator,
} from './ex-config';

const cwd = process.cwd();

afterEach(() => {
    process.chdir(cwd);
});

test('does not mutate original config', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

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

    const exConfig = new ExConfig({ processor, postProcessor });

    const result1 = exConfig.load(config);
    expect(config).toEqual(configClone);
    expect(result1).toMatchSnapshot();

    const clone1 = cloneDeep(result1);

    // reset config
    // @ts-ignore
    exConfig.config = {};
    // @ts-ignore
    exConfig.loaded = false;

    const result2 = exConfig.load(config);
    expect(config).toEqual(configClone);
    expect(result2).toEqual(clone1);
});

test('merges deep nested presets', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-01'],
        inside: [1],
        plugins: ['plugin-01'],
    };

    const exConfig = new ExConfig();

    const result = exConfig.load(config);

    expect(result).toMatchSnapshot();
});

test('adds dirname to all lifecycles', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

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

    const exConfig = new ExConfig({
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
    });

    exConfig.load(config);

    expect(result).toMatchSnapshot();
});

test('preset object order matter does not matter', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        inside: [1],
        plugins: ['plugin-01'],
        presets: ['preset-01'],
    };

    const exConfig = new ExConfig();

    const result = exConfig.load(config);

    expect(result).toMatchSnapshot();
});

test('plugins processor can be overridden', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-01', 'preset-04'],
        plugins: ['plugin-01'],
        inside: false,
        example: false,
    };

    const processor: Processor = ({ value }) => {
        return value;
    };

    const exConfig = new ExConfig({
        processor,
        overrides: {
            plugins: {
                processor: 'arrayConcat',
            },
        },
    });

    const result = exConfig.load(config);
    expect(result).toMatchSnapshot();
});

test('allows disabling presets and plugins', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['one'],
        inside: [1],
        plugins: ['plugin-one'],
    };

    const exConfig = new ExConfig({
        presets: false,
        plugins: false,
    });

    const result = exConfig.load(config);

    expect(result).toMatchSnapshot();
});

test('allows custom preset and plugin name', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        customPreset: ['preset-01'],
        inside: [1],
        customPlugin: ['plugin-01'],
    };

    const exConfig = new ExConfig({
        presets: 'customPreset',
        plugins: 'customPlugin',
    });

    const result = exConfig.load(config);

    expect(result).toMatchSnapshot();
});

test('merges deep with custom prefix resolution', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app2/');
    process.chdir(dir);

    const config = {
        presets: ['01'],
        inside: [1],
        plugins: ['01'],
    };

    const exConfig = new ExConfig({
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
    });

    const result = exConfig.load(config);

    expect(result).toMatchSnapshot();
});

test('allows builtin processor', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-01'],
        inside: [1],
    };

    const exConfig = new ExConfig({
        processor: 'arrayConcat',
    });

    const result = exConfig.load(config);

    expect(result).toMatchSnapshot();
});

test('allows custom processor', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-01'],
        inside: [0],
        example: [0],
    };

    const processor: Processor = ({ value }) => {
        return value;
    };

    const exConfig = new ExConfig({
        processor,
    });

    const result = exConfig.load(config);

    expect(result).toMatchSnapshot();
});

test('allows builtin processor override', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-01'],
        inside: [1],
    };

    const exConfig = new ExConfig({
        overrides: {
            example: {
                processor: 'arrayConcat',
            },
        },
    });

    const result = exConfig.load(config);

    expect(result).toMatchSnapshot();
});

test('allows custom processor override', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-01'],
        inside: [0],
        example: [0],
    };

    const processor: Processor = ({ value }) => {
        return value;
    };

    const exConfig = new ExConfig({
        overrides: {
            example: {
                processor,
            },
        },
    });

    const result = exConfig.load(config);

    expect(result).toMatchSnapshot();
});

test('catches error custom processor override', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-01'],
        inside: [0],
    };

    const processor: Processor = ({ value }) => {
        throw new Error(`bad value: ${value}`);
    };

    const exConfig = new ExConfig({
        overrides: {
            example: {
                processor,
            },
        },
    });

    try {
        expect.hasAssertions();
        exConfig.load(config);
    } catch (error) {
        expect(error).toMatchSnapshot();
    }
});

test('mergeObject processor', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-01'],
        inside: [1],
        object: {
            array: [0],
            zero: true,
        },
    };

    const exConfig = new ExConfig({
        overrides: {
            object: {
                processor: 'mergeDeep',
            },
        },
    });

    const result = exConfig.load(config);

    expect(result).toMatchSnapshot();
});

test('validates config', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        string: 1,
    };

    const validator: Validator = ({ value }) => {
        const schema = Joi.object({
            string: Joi.string(),
        });

        const isValid = Joi.validate(value, schema, { allowUnknown: true });

        if (isValid.error) {
            throw new Error(isValid.error.annotate());
        }
    };

    const exConfig = new ExConfig({
        validator,
    });

    try {
        expect.hasAssertions();
        exConfig.load(config);
    } catch (error) {
        expect(error).toMatchSnapshot();
    }
});

test('validates nested config', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-01'],
    };

    const validator: Validator = ({ value }) => {
        const schema = Joi.object({
            other: Joi.string(),
        });

        const isValid = Joi.validate(value, schema, { allowUnknown: true });

        if (isValid.error) {
            throw new Error(isValid.error.annotate());
        }
    };

    const exConfig = new ExConfig({
        presets: 'presets',
        validator,
    });

    try {
        expect.hasAssertions();
        exConfig.load(config);
    } catch (error) {
        expect(error).toMatchSnapshot();
    }
});

test('validates override config', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        string: 1,
    };

    const validator: Validator = ({ value }) => {
        const schema = Joi.string();

        const isValid = Joi.validate(value, schema, { allowUnknown: true });

        if (isValid.error) {
            throw new Error(isValid.error.annotate());
        }
    };

    const exConfig = new ExConfig({
        overrides: {
            string: {
                validator,
            },
        },
    });

    try {
        expect.hasAssertions();
        exConfig.load(config);
    } catch (error) {
        expect(error).toMatchSnapshot();
    }
});

test('validates nested override config', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-01'],
        string: 1,
    };

    const validator: Validator = ({ value }) => {
        const schema = Joi.string();

        const isValid = Joi.validate(value, schema, { allowUnknown: true });

        if (isValid.error) {
            throw new Error(isValid.error.annotate());
        }
    };

    const exConfig = new ExConfig({
        overrides: {
            other: {
                validator,
            },
        },
    });

    try {
        expect.hasAssertions();
        exConfig.load(config);
    } catch (error) {
        expect(error).toMatchSnapshot();
    }
});

test('allows post processing', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-01'],
        example: [0],
    };

    const postProcessor: PostProcessor = ({ value }) => {
        const example = value.example.map((number: number) => number * 2);
        return {
            ...value,
            example,
        };
    };

    const exConfig = new ExConfig({
        postProcessor,
    });

    // Call twice to ensure loaded works
    exConfig.load(config);
    const result = exConfig.load(config);
    expect(result).toMatchSnapshot();
});

test('allows post processing error', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-01'],
        example: [0],
    };

    const postProcessor: PostProcessor = ({ value }) => {
        throw new Error(`postProcessor error ${value.example}`);
    };

    const exConfig = new ExConfig({
        postProcessor,
    });

    try {
        expect.hasAssertions();
        exConfig.load(config);
    } catch (error) {
        expect(error).toMatchSnapshot();
    }
});

test('allows preprocessing', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-01'],
        example: [0],
    };

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

    const exConfig = new ExConfig({
        validator,
        preprocessor,
    });

    const result = exConfig.load(config);
    expect(result).toMatchSnapshot();
});

test('preprocessing error', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['01'],
        example: [0],
    };

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

    const exConfig = new ExConfig({
        validator,
        preprocessor,
    });

    try {
        expect.hasAssertions();
        exConfig.load(config);
    } catch (error) {
        expect(error).toMatchSnapshot();
    }
});

test('allows preprocessing override', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-01'],
        example: [0],
    };

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

    const exConfig = new ExConfig({
        overrides: {
            example: {
                preprocessor,
                validator,
            },
        },
    });

    const result = exConfig.load(config);
    expect(result).toMatchSnapshot();
});

test('preprocessing override error', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-01'],
        example: [0],
    };

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

    const exConfig = new ExConfig({
        overrides: {
            example: {
                preprocessor,
                validator,
            },
        },
    });

    try {
        expect.hasAssertions();
        exConfig.load(config);
    } catch (error) {
        expect(error).toMatchSnapshot();
    }
});

test('extends must be a string', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const presetPath = path.resolve(dir, 'node_modules/preset-01');
    const one = require(presetPath);

    const config = {
        presets: [one],
    };

    const exConfig = new ExConfig();

    try {
        expect.hasAssertions();
        exConfig.load(config);
    } catch (error) {
        expect(error).toMatchSnapshot();
    }
});

test('extends must be a string - nested', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['invalid-preset-01'],
    };

    const exConfig = new ExConfig();

    try {
        expect.hasAssertions();
        exConfig.load(config);
    } catch (error) {
        expect(error).toMatchSnapshot();
    }
});

test('resolve must be a string', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const pluginPath = path.resolve(dir, 'node_modules/plugin-01');
    const pluginOne = require(pluginPath);

    const config = {
        plugins: [pluginOne],
    };

    const exConfig = new ExConfig();

    try {
        expect.hasAssertions();
        exConfig.load(config);
    } catch (error) {
        expect(error).toMatchSnapshot();
    }
});

test('resolve must be a string - nested', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['invalid-preset-02'],
    };

    const exConfig = new ExConfig();

    try {
        expect.hasAssertions();
        exConfig.load(config);
    } catch (error) {
        expect(error).toMatchSnapshot();
    }
});

test('resolve must be a string - nested - works as array', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: [['invalid-preset-02', {}]],
    };

    const exConfig = new ExConfig();

    try {
        expect.hasAssertions();
        exConfig.load(config);
    } catch (error) {
        expect(error).toMatchSnapshot();
    }
});

test('es modules must use a default export', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['invalid-preset-03'],
    };

    const exConfig = new ExConfig();

    try {
        expect.hasAssertions();
        exConfig.load(config);
    } catch (error) {
        expect(error).toMatchSnapshot();
    }
});

test('calls presets and plugins as a function with default options = {}', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-05'],
        plugins: ['plugin-03'],
    };

    const exConfig = new ExConfig();

    const result = exConfig.load(config);

    expect(result).toMatchSnapshot();
});

test('calls presets and plugins as a function with specified options', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: [['preset-05', { special: 'options 05' }]],
        plugins: [['plugin-03', { special: 'options 03' }]],
    };

    const exConfig = new ExConfig();

    const result = exConfig.load(config);

    expect(result).toMatchSnapshot();
});

test('handle base config as function', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = (args: Config) => {
        return {
            args,
            presets: [['preset-05', { special: 'options 05' }]],
            plugins: [['plugin-03', { special: 'options 03' }]],
        };
    };

    const exConfig = new ExConfig();

    const result = exConfig.load(config);

    expect(result).toMatchSnapshot();
});

test('handles es module default exports', () => {
    const dir = path.resolve(__dirname, '__sandbox__/app1/');
    process.chdir(dir);

    const config = {
        presets: ['preset-06'],
        plugins: ['plugin-04'],
    };

    const exConfig = new ExConfig();

    const result = exConfig.load(config);

    expect(result).toMatchSnapshot();
});
