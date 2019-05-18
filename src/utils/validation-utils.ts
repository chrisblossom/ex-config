import Joi from '@hapi/joi';
import { extendError } from './extend-error';
import { BasicConfig } from '../types';

function generateResolveValidator(
    presets?: string | false,
    plugins?: string | false,
) {
    const schema = Joi.array()
        .items(
            Joi.string(),
            Joi.array()
                .ordered(Joi.string().required(), Joi.any())
                .max(2),
        )
        .single(true);

    const obj: BasicConfig = {};
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
    config: BasicConfig,
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

        extendError({ error, pathname: packagePath });

        throw error;
    }
}

export type ResolveSchema = ReturnType<typeof generateResolveValidator>;

export { generateResolveValidator, validateResolveKeys };
