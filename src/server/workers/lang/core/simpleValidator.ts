/// Not useful for user input validation
// But great for simple config validation
// works only by "n" valid options

type Type = 'string' | 'boolean' | 'number' | 'object' | 'array';

export const types: {
    string: 'string',
    boolean: 'boolean',
    number: 'number',
    object: 'object',
    array: 'array',
} = {
    string: 'string',
    boolean: 'boolean',
    number: 'number',
    object: 'object',
    array: 'array',
}

export interface MemberDefinition {
    type: Type;
    validValues?: string[];
    /** Only used if `type` is `object` or `array` */
    sub?: MemberDefinition;
}

export interface ValidationInfo {
    [name: string]: MemberDefinition;
}

export interface Errors {
    invalidValues: string[];
    extraKeys: string[];
    errorMessage: string;
}

export class SimpleValidator {

    private potentialLowerCaseMatch: { [key: string]: string };
    constructor(public validationInfo: ValidationInfo) {
        this.potentialLowerCaseMatch = {};
        Object.keys(validationInfo).forEach(k=> this.potentialLowerCaseMatch[k.toLowerCase()] = k);
    }

    validate = (toValidate: any): Errors => {
        const errors = { invalidValues: [], extraKeys: [], errorMessage: '' };
        Object.keys(toValidate).forEach(k=> {
            // Check extra keys
            if (!this.validationInfo[k]) {
                if (this.potentialLowerCaseMatch[k]) {
                    errors.extraKeys.push(`Key: '${k}' is a potential lower case match for '${this.potentialLowerCaseMatch[k]}'. Fix the casing.`);
                }
                else {
                    errors.extraKeys.push(`Unknown Option: ${k}`)
                }
            }
            // Do validation
            else {
                const validationInfo = this.validationInfo[k];
                const value: any = toValidate[k];
                /** Do a valid values check */
                if (validationInfo.validValues && validationInfo.validValues.length) {
                    var validValues = validationInfo.validValues;
                    if (!validValues.some(valid => valid.toLowerCase() === value.toLowerCase())) {
                        errors.invalidValues.push(`Key: '${k}' has an invalid value: ${value}`);
                    }
                }
                /** Do an array check */
                if (validationInfo.type === 'array') {
                    if (!Array.isArray(value)){
                        errors.invalidValues.push(`Key: '${k}' should be an array. But set value is ${value}`);
                    }
                    /** TODO: check sub members */
                }
                /** Do an object check */
                else if (validationInfo.type === 'object') {
                    if (typeof value !== 'object'){
                        errors.invalidValues.push(`Key: '${k}' should be an object. But set value is ${value}`);
                    }
                    /** TODO: check sub members */
                }
                /** Do the primitive type check */
                else if (typeof value !== validationInfo.type) {
                    errors.invalidValues.push(`Key: '${k}' has a value '${JSON.stringify(value)}' of an invalid type: ${typeof value}`)
                }
            }
        });

        const total = errors.invalidValues.concat(errors.extraKeys);
        if (total.length) {
            errors.errorMessage = total.join("\n");
        }

        return errors;
    }
}
