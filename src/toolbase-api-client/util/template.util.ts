import Handlebars from "handlebars";
import { EqualityOperator, NumericOperator } from "../dto/operators.enum";

const HELPERS: { [keyof: CustomHelperName]: Handlebars.HelperDelegate } = {
    'if': function (operand1: string | undefined, operator: string | undefined, operand2: string | undefined, options: Handlebars.HelperOptions) {
        // console.log(operand1, operator, operand2, options);
        if (typeof operand1 !== 'string' && operator === undefined) {
            throw new Error('First argument is required in if helper');
        } else if (typeof operator === 'string' && options === undefined) {
            throw new Error('Third argument is required when operator is provided in if helper. Provided arguments: ' + operand1 + ', ' + operator + ', ' + operand2);
        } else if (typeof operator !== 'string' && options === undefined) {
            options = operator as any;
            operator = undefined;
        } else if (typeof options?.fn !== 'function') {
            throw new Error('Too many arguments provided in if helper. Provided arguments: ' + operand1 + ', ' + operator + ', ' + operand2 + ', ' + options);
        }

        const equals = (strict: boolean) => (l: any, r: any) => strict ? l === r : l == r;
        const notEquals = (strict: boolean) => (l: any, r: any) => strict ? l !== r : l != r;
        const lessThan = (l: any, r: any) => Number(l) < Number(r);
        const lessThanOrEqual = (l: any, r: any) => Number(l) <= Number(r);
        const greaterThan = (l: any, r: any) => Number(l) > Number(r);
        const greaterThanOrEqual = (l: any, r: any) => Number(l) >= Number(r);

        const equalityOperators = {
            [EqualityOperator.EQUAL]: equals(false),
            [EqualityOperator.DOUBLE_EQUAL]: equals(false),
            [EqualityOperator.TRIPLE_EQUAL]: equals(true),
            [EqualityOperator.NOT_EQUAL]: notEquals(false),
            [EqualityOperator.NOT_EQUAL_BANG]: notEquals(false),
            [EqualityOperator.STRICT_NOT_EQUAL]: notEquals(true),
        } satisfies { [key: string]: (l: any, r: any) => boolean };

        const numericOperators = {
            [NumericOperator.LESS_THAN]: lessThan,
            [NumericOperator.LESS_THAN_EQUAL]: lessThanOrEqual,
            [NumericOperator.GREATER_THAN]: greaterThan,
            [NumericOperator.GREATER_THAN_EQUAL]: greaterThanOrEqual
        };

        const allOperators = {
            ...equalityOperators,
            ...numericOperators,
        };

        const op = typeof operator === 'string' ? operator as keyof typeof allOperators : undefined;
        if (op && !(op in allOperators)) {
            throw new Error(`Operator ${operator} is not supported in if helper`);
        }

        const parseOperand = (operand?: string) => {
            let negated = false;
            if (typeof operand === 'string' && operand.startsWith('!')) {
                negated = true;
                operand = operand.slice(1);
            }

            let availableOperators: Partial<typeof allOperators> = {};
            let value: string | number | boolean | null | undefined = operand;
            if (!Number.isNaN(Number(value))) {
                if (negated) {
                    value = Number(value) !== 0;
                    availableOperators = equalityOperators;
                } else {
                    value = Number(value);
                    availableOperators = allOperators;
                }
            } else if (value === 'true') {
                value = negated ? false : true;
                availableOperators = equalityOperators;
            } else if (value === 'false') {
                value = negated ? true : false;
                availableOperators = equalityOperators;
            } else if (value === 'null') {
                value = negated ? true : null;
                availableOperators = equalityOperators;
            } else if (value === 'undefined') {
                value = negated ? true : undefined;
                availableOperators = equalityOperators;
            }

            return { value, negated, availableOperators };
        };

        const left = parseOperand(operand1);
        const right = operand2 ? parseOperand(operand2) : undefined;

        const result = op ? allOperators[op](left.value, right?.value) : Boolean(left.value);

        // console.log(result);

        return result ? options.fn(this) : options.inverse(this);
    }
};

const KNOWN_HELPERS: KnownHelpers = (() => {
    let khs: KnownHelpers = {};
    Object.keys(HELPERS).forEach(key => {
        khs[key] = true;
        Handlebars.registerHelper(key, HELPERS[key]);
    });
    return khs;
})();

export const TemplateUtil = {
    template: (template: string, context: { [key: string]: any }, strict: boolean = false) => Handlebars.compile(template, { noEscape: true, strict: strict, knownHelpers: KNOWN_HELPERS, knownHelpersOnly: true })(context)
}
