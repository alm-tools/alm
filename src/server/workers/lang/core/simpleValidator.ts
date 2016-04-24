/// Not useful for user input validation
// But great for simple config validation
// works only by "n" valid options

type Type = 'string' | 'boolean' | 'number' | 'object' | 'array';

export const types = {
    string: 'string' as Type,
    boolean: 'boolean' as Type,
    number: 'number' as Type,
    object: 'object' as Type,
    array: 'array' as Type,
}

export interface MemberDefinition {
    type: Type;
    validValues?: string[];
    /** Only used if `type` is `object` or `array` */
    objectDefinition?: ValidationInfo;
}

export interface ValidationInfo {
    members: { [name: string]: MemberDefinition };
    /** These are members that you know about but don't make sense to validate for you */
    extraMembers?: string[];
}

export interface Errors {
    invalidValues: string[];
    extraKeys: string[];
    errorMessage: string;
}

export class SimpleValidator {

    private potentialLowerCaseMatch: { [key: string]: string };
    private extraMembers = [];
    constructor(public validationInfo: ValidationInfo) {
        this.potentialLowerCaseMatch = {};
        Object.keys(validationInfo.members).forEach(k=> this.potentialLowerCaseMatch[k.toLowerCase()] = k);
        this.extraMembers = validationInfo.extraMembers || [];
    }

    validate = (toValidate: any): Errors => {
        const errors = { invalidValues: [], extraKeys: [], errorMessage: '' };
        Object.keys(toValidate).forEach(k=> {
            // Check extra keys
            if (!this.validationInfo.members[k]) {
                if (this.potentialLowerCaseMatch[k]) {
                    errors.extraKeys.push(`Key: '${k}' is a potential lower case match for '${this.potentialLowerCaseMatch[k]}'. Fix the casing.`);
                }
                else if (this.extraMembers.some(m => m === k)) {
                    return; // continue. as we don't care about validating this key
                }
                else {
                    errors.extraKeys.push(`Unknown Option: ${k}`)
                }
            }
            // Do validation
            else {
                const validationInfo = this.validationInfo.members[k];
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

                }
                else if (typeof value !== validationInfo.type) {
                    errors.invalidValues.push(`Key: '${k}' has an invalid type: ${typeof value}`)
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
