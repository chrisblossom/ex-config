/* @flow */

import Joi from 'joi';
import { extendError } from './extend-error';
import type { Config, ResolveSchema } from './ex-config';

function generateResolveValidator(
    presets?: string | false,
    plugins?: string | false,
) {
    const schema = Joi.array()
        .items(Joi.string())
        .single(true);

    const obj = {};
    if (presets) {
        obj[presets] = schema.label(presets);
    }

    if (plugins) {
        obj[plugins] = schema.label(plugins);
    }

    if (Object.keys(obj).length === 0) {
        return null;
    }

    return Joi.object(obj);
}

function validateResolveKeys(
    config: Config,
    schema: ResolveSchema,
    packagePath?: string,
) {
    if (schema === null) {
        return;
    }

    const isValid = Joi.validate(config, schema, {
        allowUnknown: true,
    });

    if (isValid.error) {
        let message = isValid.error.annotate();

        // eslint-disable-next-line no-useless-concat
        message += '\n' + 'extends key must be a module expressed as a string';

        const error = new Error(message);

        extendError(error, packagePath);

        throw error;
    }
}

export { generateResolveValidator, validateResolveKeys };
