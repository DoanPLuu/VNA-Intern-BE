import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotFutureDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === undefined || value === null || value === '') {
            return true;
          }

          if (!(typeof value === 'string' || value instanceof Date)) {
            return false;
          }

          const inputDate = new Date(value);
          if (Number.isNaN(inputDate.getTime())) {
            return false;
          }

          const today = new Date();
          today.setHours(23, 59, 59, 999);

          return inputDate.getTime() <= today.getTime();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} không được lớn hơn ngày hiện tại`;
        },
      },
    });
  };
}
