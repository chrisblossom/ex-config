import { cloneDeep } from 'lodash';
import { builtInProcessors } from './utils/get-processor';
import { ConfigFunctionParameters, Overrides } from './types';
import { getContext } from './utils/get-context';
import { extendError } from './utils/extend-error';
import { parseKeys } from './parse-keys';

export type Config = { [key: string]: any };

export interface LifecycleParams {
    // actionable item
    value: any;
    // current value of actionable item
    current?: any;
    // current full config
    config: Config;
    // current config directory
    dirname: string;
}

export type Validator = (lifecycleParams: LifecycleParams) => void;
export type Preprocessor = (lifecycleParams: LifecycleParams) => Config;
export type Processor = (lifecycleParams: LifecycleParams) => any;
export type PostProcessor = (lifecycleParams: LifecycleParams) => Config;

export interface Options {
    baseDirectory?: string;
    presets?: string | false;
    plugins?: string | false;
    preprocessor?: Preprocessor;
    processor?: Processor | builtInProcessors;
    validator?: Validator;
    postProcessor?: PostProcessor;
    overrides?: { [key: string]: Overrides };
}

function exConfig(config: Config, options: Options = {}): Config {
    if (config === undefined) {
        throw new Error('config is required');
    }

    const { baseDirectory = process.cwd(), ...opts } = options;

    const dirname = baseDirectory;

    const context = getContext(opts);

    let cfg: Config = config;
    if (typeof config === 'function') {
        const args: ConfigFunctionParameters = {
            options: {},
            dirname,
        };

        cfg = config(args);
    }

    /**
     * Prevent original config from being mutated to guard against external caching issues
     */
    cfg = cloneDeep(cfg);

    if (context.preprocessor) {
        try {
            cfg = context.preprocessor({ value: cfg, config: cfg, dirname });
        } catch (error) {
            extendError({ error, pathname: dirname });
            throw error;
        }
    }

    /**
     * Validate base config
     */
    if (context.validator) {
        context.validator({ value: cfg, config: cfg, dirname });
    }

    cfg = parseKeys({ baseConfig: {}, config: cfg, dirname, context });

    if (opts.postProcessor) {
        try {
            cfg = opts.postProcessor({
                value: cfg,
                config: cfg,
                dirname,
            });
        } catch (error) {
            extendError({ error, pathname: dirname });
            throw error;
        }
    }

    return cfg;
}

export { exConfig };
