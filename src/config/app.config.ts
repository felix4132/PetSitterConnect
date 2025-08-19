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
        warnings.push(
            `NODE_ENV value '${nodeEnv}' is not standard. Use: development, production, or test`,
        );
    }

    // Validate PORT
    const port = process.env.PORT;
    if (port) {
        const portNum = parseInt(port, 10);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            errors.push(
                `PORT must be a valid number between 1 and 65535, got: ${port}`,
            );
        }
    }

    // Validate rate limiting configuration
    const rateLimitTtl = process.env.RATE_LIMIT_TTL;
    if (rateLimitTtl) {
        const ttl = parseInt(rateLimitTtl, 10);
        if (isNaN(ttl) || ttl < 1000) {
            errors.push(
                `RATE_LIMIT_TTL must be a number >= 1000 (1 second), got: ${rateLimitTtl}`,
            );
        }
    }

    const rateLimitLimit = process.env.RATE_LIMIT_LIMIT;
    if (rateLimitLimit) {
        const limit = parseInt(rateLimitLimit, 10);
        if (isNaN(limit) || limit < 1) {
            errors.push(
                `RATE_LIMIT_LIMIT must be a positive number, got: ${rateLimitLimit}`,
            );
        }
    }

    // Production-specific validations
    if (nodeEnv === 'production') {
        if (!process.env.ALLOWED_ORIGINS) {
            errors.push(
                'ALLOWED_ORIGINS must be set in production for security',
            );
        } else {
            const origins = process.env.ALLOWED_ORIGINS.split(',');
            const invalidOrigins = origins.filter((origin) => {
                const trimmed = origin.trim();
                return (
                    !trimmed.startsWith('http://') &&
                    !trimmed.startsWith('https://')
                );
            });

            if (invalidOrigins.length > 0) {
                errors.push(
                    `Invalid origins in ALLOWED_ORIGINS: ${invalidOrigins.join(', ')}. Origins must start with http:// or https://`,
                );
            }
        }
    }

    // Database configuration warnings
    if (nodeEnv === 'production') {
        if (!process.env.DB_PATH) {
            warnings.push(
                'DB_PATH is not set. The app is using an in-memory SQLite database (data is not persisted). This is NOT recommended for production. Set DB_PATH (e.g. ./data/petsitter.sqlite) and update the database configuration to use it.',
            );
        }

        // Warn about database synchronization in production
        if (process.env.DB_SYNCHRONIZE === 'true') {
            warnings.push(
                'DB_SYNCHRONIZE is enabled in production. This can cause data loss!',
            );
        }

        // Warn about database logging in production
        if (process.env.DB_LOGGING === 'true') {
            warnings.push(
                'DB_LOGGING is enabled in production. This may impact performance and expose sensitive data.',
            );
        }
    }

    // Log warnings
    if (warnings.length > 0) {
        // eslint-disable-next-line no-console
        console.warn('Configuration warnings:');
        warnings.forEach((warning) => {
            // eslint-disable-next-line no-console
            console.warn(`  - ${warning}`);
        });
    }

    // Log errors and exit if any
    if (errors.length > 0) {
        // eslint-disable-next-line no-console
        console.error('Configuration errors:');
        errors.forEach((error) => {
            // eslint-disable-next-line no-console
            console.error(`  - ${error}`);
        });
        // eslint-disable-next-line no-console
        console.error('Application cannot start with invalid configuration');
        process.exit(1);
    }
}
