/// Not useful for user input validation
// But great for simple config validation 
// works only by "n" valid options

export var types = {
    string: 'string',
    boolean: 'boolean',
    number: 'number'
}

export interface ValidationInfo {
    [name: string]: {
        validValues?: string[];
        type?: string;
    }
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

    validate(config: any): Errors {
        var keys = Object.keys(config);
        var errors = { invalidValues: [], extraKeys: [], errorMessage: '' };
        keys.forEach(k=> {
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
                var validationInfo = this.validationInfo[k];
                var value: any = config[k];
                if (validationInfo.validValues && validationInfo.validValues.length) {
                    var validValues = validationInfo.validValues;
                    if (!validValues.some(valid => valid.toLowerCase() === value.toLowerCase())) {
                        errors.invalidValues.push(`Key: '${k}' has an invalid value: ${value}`);
                    }
                }
                if (validationInfo.type && typeof value !== validationInfo.type) {
                    errors.invalidValues.push(`Key: '${k}' has an invalid type: ${typeof value}`)
                }
            }
        });

        var total = errors.invalidValues.concat(errors.extraKeys);
        if (total.length) {
            errors.errorMessage = total.join("\n");
        }

        return errors;
    }
}


export function createMap(arr: string[]): { [key: string]: boolean } {
    return arr.reduce((result: { [key: string]: boolean }, key: string) => {
        result[key] = true;
        return result;
    }, <{ [key: string]: boolean }>{});
}
