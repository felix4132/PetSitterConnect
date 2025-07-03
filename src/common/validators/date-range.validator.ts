import {
    registerDecorator,
    ValidatorConstraint,
    type ValidationArguments,
    type ValidationOptions,
    type ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsAfterDateConstraint implements ValidatorConstraintInterface {
    validate(endDate: string, args: ValidationArguments): boolean {
        const startDateProperty = args.constraints[0] as string;
        const dto = args.object as Record<string, unknown>;
        const startDate = dto[startDateProperty] as string;

        if (!startDate || !endDate) {
            return true; // Let @IsISO8601() handle missing dates
        }

        try {
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            return endDateObj > startDateObj;
        } catch {
            return true; // Let @IsISO8601() handle invalid dates
        }
    }

    defaultMessage(args: ValidationArguments): string {
        const startDateProperty = args.constraints[0] as string;
        return `${args.property} must be after ${startDateProperty}`;
    }
}

export function IsAfterDate(
    startDateProperty: string,
    validationOptions?: ValidationOptions,
) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [startDateProperty],
            validator: IsAfterDateConstraint,
        });
    };
}
