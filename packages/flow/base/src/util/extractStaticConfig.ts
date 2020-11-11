/**
 * @file extractStaticConfig
 */

export function extractStaticConfig<T>(config: T): T;

export function extractStaticConfig(config: unknown): unknown {

    if (typeof config !== 'object') {
        return config;
    }

    if (config == null) {
        return config;
    }

    if (Array.isArray(config)) {
        return config.map(item => extractStaticConfig(item));
    }

    const data: Record<string, unknown> = {};

    Object.keys(config).forEach(key => {

        if (key === '__bind__') {
            return;
        }

        data[key] = extractStaticConfig((config as Record<string, unknown>)[key]);
    });

    return data;
}
