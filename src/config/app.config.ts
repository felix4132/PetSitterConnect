/**
 * Application configuration interface
 */
export interface AppConfig {
    port: number;
    nodeEnv: string;
    database: {
        type: string;
        database: string;
        synchronize: boolean;
        logging: boolean;
    };
    cors: {
        origin: string[] | boolean;
        credentials: boolean;
    };
    rateLimit: {
        ttl: number;
        limit: number;
    };
}

/**
 * Load and validate application configuration
 */
export function loadAppConfig(): AppConfig {
    const nodeEnv = process.env.NODE_ENV ?? 'development';
    const isProduction = nodeEnv === 'production';

    return {
        port: parseInt(process.env.PORT ?? '3000', 10),
        nodeEnv,
        database: {
            type: process.env.DB_TYPE ?? 'sqlite',
            database: process.env.DB_PATH ?? 'data/pets.db',
            synchronize: !isProduction,
            logging: nodeEnv === 'development',
        },
        cors: {
            origin: isProduction
                ? (process.env.ALLOWED_ORIGINS?.split(',') ?? [])
                : true,
            credentials: true,
        },
        rateLimit: {
            ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60000', 10),
            limit: parseInt(process.env.RATE_LIMIT_LIMIT ?? '100', 10),
        },
    };
}

/**
 * Validate required environment variables
 */
export function validateConfig(): void {
    const required = ['NODE_ENV'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(
            `Missing optional environment variables: ${missing.join(', ')}`,
        );
    }

    if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
        // eslint-disable-next-line no-console
        console.warn(
            'ALLOWED_ORIGINS should be set in production for security',
        );
    }
}
