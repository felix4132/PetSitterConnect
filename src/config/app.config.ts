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
 * Validate required environment variables and configuration
 */
export function validateConfig(): void {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate NODE_ENV
    const nodeEnv = process.env.NODE_ENV;
    if (!nodeEnv) {
        warnings.push('NODE_ENV is not set, defaulting to development');
    } else if (!['development', 'production', 'test'].includes(nodeEnv)) {
        warnings.push(`NODE_ENV value '${nodeEnv}' is not standard. Use: development, production, or test`);
    }

    // Validate PORT
    const port = process.env.PORT;
    if (port) {
        const portNum = parseInt(port, 10);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            errors.push(`PORT must be a valid number between 1 and 65535, got: ${port}`);
        }
    }

    // Validate rate limiting configuration
    const rateLimitTtl = process.env.RATE_LIMIT_TTL;
    if (rateLimitTtl) {
        const ttl = parseInt(rateLimitTtl, 10);
        if (isNaN(ttl) || ttl < 1000) {
            errors.push(`RATE_LIMIT_TTL must be a number >= 1000 (1 second), got: ${rateLimitTtl}`);
        }
    }

    const rateLimitLimit = process.env.RATE_LIMIT_LIMIT;
    if (rateLimitLimit) {
        const limit = parseInt(rateLimitLimit, 10);
        if (isNaN(limit) || limit < 1) {
            errors.push(`RATE_LIMIT_LIMIT must be a positive number, got: ${rateLimitLimit}`);
        }
    }

    // Production-specific validations
    if (nodeEnv === 'production') {
        if (!process.env.ALLOWED_ORIGINS) {
            errors.push('ALLOWED_ORIGINS must be set in production for security');
        } else {
            const origins = process.env.ALLOWED_ORIGINS.split(',');
            const invalidOrigins = origins.filter(origin => {
                const trimmed = origin.trim();
                return !trimmed.startsWith('http://') && !trimmed.startsWith('https://');
            });
            
            if (invalidOrigins.length > 0) {
                errors.push(`Invalid origins in ALLOWED_ORIGINS: ${invalidOrigins.join(', ')}. Origins must start with http:// or https://`);
            }
        }
    }

    // Database configuration warnings
    if (nodeEnv === 'production' && !process.env.DB_PATH) {
        warnings.push('DB_PATH is not set in production, using default path');
    }

    // Log warnings
    if (warnings.length > 0) {
        // eslint-disable-next-line no-console
        console.warn('Configuration warnings:');
        warnings.forEach(warning => {
            // eslint-disable-next-line no-console
            console.warn(`  - ${warning}`);
        });
    }

    // Log errors and exit if any
    if (errors.length > 0) {
        // eslint-disable-next-line no-console
        console.error('Configuration errors:');
        errors.forEach(error => {
            // eslint-disable-next-line no-console
            console.error(`  - ${error}`);
        });
        // eslint-disable-next-line no-console
        console.error('Application cannot start with invalid configuration');
        process.exit(1);
    }
}
