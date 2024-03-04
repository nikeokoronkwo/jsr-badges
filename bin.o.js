// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const { Deno: Deno1 } = globalThis;
const noColor = typeof Deno1?.noColor === "boolean" ? Deno1.noColor : false;
let enabled = !noColor;
function setColorEnabled(value) {
    if (Deno1?.noColor) {
        return;
    }
    enabled = value;
}
function getColorEnabled() {
    return enabled;
}
function code(open, close) {
    return {
        open: `\x1b[${open.join(";")}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, "g")
    };
}
function run(str, code) {
    return enabled ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}` : str;
}
function bold(str) {
    return run(str, code([
        1
    ], 22));
}
function dim(str) {
    return run(str, code([
        2
    ], 22));
}
function italic(str) {
    return run(str, code([
        3
    ], 23));
}
function red(str) {
    return run(str, code([
        31
    ], 39));
}
function green(str) {
    return run(str, code([
        32
    ], 39));
}
function yellow(str) {
    return run(str, code([
        33
    ], 39));
}
function brightBlue(str) {
    return run(str, code([
        94
    ], 39));
}
function brightMagenta(str) {
    return run(str, code([
        95
    ], 39));
}
const ANSI_PATTERN = new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"
].join("|"), "g");
function stripColor(string) {
    return string.replace(ANSI_PATTERN, "");
}
function distance(a, b) {
    if (a.length == 0) {
        return b.length;
    }
    if (b.length == 0) {
        return a.length;
    }
    const matrix = [];
    for(let i = 0; i <= b.length; i++){
        matrix[i] = [
            i
        ];
    }
    for(let j = 0; j <= a.length; j++){
        matrix[0][j] = j;
    }
    for(let i = 1; i <= b.length; i++){
        for(let j = 1; j <= a.length; j++){
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}
function paramCaseToCamelCase(str) {
    return str.replace(/-([a-z])/g, (g)=>g[1].toUpperCase());
}
function underscoreToCamelCase(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase().replace(/_([a-z])/g, (g)=>g[1].toUpperCase());
}
function getOption(flags, name) {
    while(name[0] === "-"){
        name = name.slice(1);
    }
    for (const flag of flags){
        if (isOption(flag, name)) {
            return flag;
        }
    }
    return;
}
function didYouMeanOption(option, options) {
    const optionNames = options.map((option)=>[
            option.name,
            ...option.aliases ?? []
        ]).flat().map((option)=>getFlag(option));
    return didYouMean(" Did you mean option", getFlag(option), optionNames);
}
function didYouMeanType(type, types) {
    return didYouMean(" Did you mean type", type, types);
}
function didYouMean(message, type, types) {
    const match = closest(type, types);
    return match ? `${message} "${match}"?` : "";
}
function getFlag(name) {
    if (name.startsWith("-")) {
        return name;
    }
    if (name.length > 1) {
        return `--${name}`;
    }
    return `-${name}`;
}
function isOption(option, name) {
    return option.name === name || option.aliases && option.aliases.indexOf(name) !== -1;
}
function matchWildCardOptions(name, flags) {
    for (const option of flags){
        if (option.name.indexOf("*") === -1) {
            continue;
        }
        let matched = matchWildCardOption(name, option);
        if (matched) {
            matched = {
                ...matched,
                name
            };
            flags.push(matched);
            return matched;
        }
    }
}
function matchWildCardOption(name, option) {
    const parts = option.name.split(".");
    const parts2 = name.split(".");
    if (parts.length !== parts2.length) {
        return false;
    }
    const count = Math.max(parts.length, parts2.length);
    for(let i = 0; i < count; i++){
        if (parts[i] !== parts2[i] && parts[i] !== "*") {
            return false;
        }
    }
    return option;
}
function closest(str, arr) {
    let minDistance = Infinity;
    let minIndex = 0;
    for(let i = 0; i < arr.length; i++){
        const dist = distance(str, arr[i]);
        if (dist < minDistance) {
            minDistance = dist;
            minIndex = i;
        }
    }
    return arr[minIndex];
}
function getDefaultValue(option) {
    return typeof option.default === "function" ? option.default() : option.default;
}
class FlagsError extends Error {
    constructor(message){
        super(message);
        Object.setPrototypeOf(this, FlagsError.prototype);
    }
}
class UnknownRequiredOptionError extends FlagsError {
    constructor(option, options){
        super(`Unknown required option "${getFlag(option)}".${didYouMeanOption(option, options)}`);
        Object.setPrototypeOf(this, UnknownRequiredOptionError.prototype);
    }
}
class UnknownConflictingOptionError extends FlagsError {
    constructor(option, options){
        super(`Unknown conflicting option "${getFlag(option)}".${didYouMeanOption(option, options)}`);
        Object.setPrototypeOf(this, UnknownConflictingOptionError.prototype);
    }
}
class UnknownTypeError extends FlagsError {
    constructor(type, types){
        super(`Unknown type "${type}".${didYouMeanType(type, types)}`);
        Object.setPrototypeOf(this, UnknownTypeError.prototype);
    }
}
class ValidationError extends FlagsError {
    constructor(message){
        super(message);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
class DuplicateOptionError extends ValidationError {
    constructor(name){
        super(`Option "${getFlag(name).replace(/^--no-/, "--")}" can only occur once, but was found several times.`);
        Object.setPrototypeOf(this, DuplicateOptionError.prototype);
    }
}
class InvalidOptionError extends ValidationError {
    constructor(option, options){
        super(`Invalid option "${getFlag(option)}".${didYouMeanOption(option, options)}`);
        Object.setPrototypeOf(this, InvalidOptionError.prototype);
    }
}
class UnknownOptionError extends ValidationError {
    constructor(option, options){
        super(`Unknown option "${getFlag(option)}".${didYouMeanOption(option, options)}`);
        Object.setPrototypeOf(this, UnknownOptionError.prototype);
    }
}
class MissingOptionValueError extends ValidationError {
    constructor(option){
        super(`Missing value for option "${getFlag(option)}".`);
        Object.setPrototypeOf(this, MissingOptionValueError.prototype);
    }
}
class InvalidOptionValueError extends ValidationError {
    constructor(option, expected, value){
        super(`Option "${getFlag(option)}" must be of type "${expected}", but got "${value}".`);
        Object.setPrototypeOf(this, InvalidOptionValueError.prototype);
    }
}
class UnexpectedOptionValueError extends ValidationError {
    constructor(option, value){
        super(`Option "${getFlag(option)}" doesn't take a value, but got "${value}".`);
        Object.setPrototypeOf(this, InvalidOptionValueError.prototype);
    }
}
class OptionNotCombinableError extends ValidationError {
    constructor(option){
        super(`Option "${getFlag(option)}" cannot be combined with other options.`);
        Object.setPrototypeOf(this, OptionNotCombinableError.prototype);
    }
}
class ConflictingOptionError extends ValidationError {
    constructor(option, conflictingOption){
        super(`Option "${getFlag(option)}" conflicts with option "${getFlag(conflictingOption)}".`);
        Object.setPrototypeOf(this, ConflictingOptionError.prototype);
    }
}
class DependingOptionError extends ValidationError {
    constructor(option, dependingOption){
        super(`Option "${getFlag(option)}" depends on option "${getFlag(dependingOption)}".`);
        Object.setPrototypeOf(this, DependingOptionError.prototype);
    }
}
class MissingRequiredOptionError extends ValidationError {
    constructor(option){
        super(`Missing required option "${getFlag(option)}".`);
        Object.setPrototypeOf(this, MissingRequiredOptionError.prototype);
    }
}
class UnexpectedRequiredArgumentError extends ValidationError {
    constructor(arg){
        super(`An required argument cannot follow an optional argument, but "${arg}"  is defined as required.`);
        Object.setPrototypeOf(this, UnexpectedRequiredArgumentError.prototype);
    }
}
class UnexpectedArgumentAfterVariadicArgumentError extends ValidationError {
    constructor(arg){
        super(`An argument cannot follow an variadic argument, but got "${arg}".`);
        Object.setPrototypeOf(this, UnexpectedArgumentAfterVariadicArgumentError.prototype);
    }
}
class InvalidTypeError extends ValidationError {
    constructor({ label, name, value, type }, expected){
        super(`${label} "${name}" must be of type "${type}", but got "${value}".` + (expected ? ` Expected values: ${expected.map((value)=>`"${value}"`).join(", ")}` : ""));
        Object.setPrototypeOf(this, MissingOptionValueError.prototype);
    }
}
var OptionType;
(function(OptionType) {
    OptionType["STRING"] = "string";
    OptionType["NUMBER"] = "number";
    OptionType["INTEGER"] = "integer";
    OptionType["BOOLEAN"] = "boolean";
})(OptionType || (OptionType = {}));
const __boolean = (type)=>{
    if (~[
        "1",
        "true"
    ].indexOf(type.value)) {
        return true;
    }
    if (~[
        "0",
        "false"
    ].indexOf(type.value)) {
        return false;
    }
    throw new InvalidTypeError(type, [
        "true",
        "false",
        "1",
        "0"
    ]);
};
const number = (type)=>{
    const value = Number(type.value);
    if (Number.isFinite(value)) {
        return value;
    }
    throw new InvalidTypeError(type);
};
const string = ({ value })=>{
    return value;
};
function validateFlags(ctx, opts, options = new Map()) {
    if (!opts.flags) {
        return;
    }
    setDefaultValues(ctx, opts);
    const optionNames = Object.keys(ctx.flags);
    if (!optionNames.length && opts.allowEmpty) {
        return;
    }
    if (ctx.standalone) {
        validateStandaloneOption(ctx, options, optionNames);
        return;
    }
    for (const [name, option] of options){
        validateUnknownOption(option, opts);
        validateConflictingOptions(ctx, option);
        validateDependingOptions(ctx, option);
        validateRequiredValues(ctx, option, name);
    }
    validateRequiredOptions(ctx, options, opts);
}
function validateUnknownOption(option, opts) {
    if (!getOption(opts.flags ?? [], option.name)) {
        throw new UnknownOptionError(option.name, opts.flags ?? []);
    }
}
function setDefaultValues(ctx, opts) {
    if (!opts.flags?.length) {
        return;
    }
    for (const option of opts.flags){
        let name;
        let defaultValue = undefined;
        if (option.name.startsWith("no-")) {
            const propName = option.name.replace(/^no-/, "");
            if (typeof ctx.flags[propName] !== "undefined") {
                continue;
            }
            const positiveOption = getOption(opts.flags, propName);
            if (positiveOption) {
                continue;
            }
            name = paramCaseToCamelCase(propName);
            defaultValue = true;
        }
        if (!name) {
            name = paramCaseToCamelCase(option.name);
        }
        const hasDefaultValue = (!opts.ignoreDefaults || typeof opts.ignoreDefaults[name] === "undefined") && typeof ctx.flags[name] === "undefined" && (typeof option.default !== "undefined" || typeof defaultValue !== "undefined");
        if (hasDefaultValue) {
            ctx.flags[name] = getDefaultValue(option) ?? defaultValue;
            ctx.defaults[option.name] = true;
            if (typeof option.value === "function") {
                ctx.flags[name] = option.value(ctx.flags[name]);
            }
        }
    }
}
function validateStandaloneOption(ctx, options, optionNames) {
    if (!ctx.standalone || optionNames.length === 1) {
        return;
    }
    for (const [_, opt] of options){
        if (!ctx.defaults[opt.name] && opt !== ctx.standalone) {
            throw new OptionNotCombinableError(ctx.standalone.name);
        }
    }
}
function validateConflictingOptions(ctx, option) {
    if (!option.conflicts?.length) {
        return;
    }
    for (const flag of option.conflicts){
        if (isset(flag, ctx.flags)) {
            throw new ConflictingOptionError(option.name, flag);
        }
    }
}
function validateDependingOptions(ctx, option) {
    if (!option.depends) {
        return;
    }
    for (const flag of option.depends){
        if (!isset(flag, ctx.flags) && !ctx.defaults[option.name]) {
            throw new DependingOptionError(option.name, flag);
        }
    }
}
function validateRequiredValues(ctx, option, name) {
    if (!option.args) {
        return;
    }
    const isArray = option.args.length > 1;
    for(let i = 0; i < option.args.length; i++){
        const arg = option.args[i];
        if (arg.optional) {
            continue;
        }
        const hasValue = isArray ? typeof ctx.flags[name][i] !== "undefined" : typeof ctx.flags[name] !== "undefined";
        if (!hasValue) {
            throw new MissingOptionValueError(option.name);
        }
    }
}
function validateRequiredOptions(ctx, options, opts) {
    if (!opts.flags?.length) {
        return;
    }
    const optionsValues = [
        ...options.values()
    ];
    for (const option of opts.flags){
        if (!option.required || paramCaseToCamelCase(option.name) in ctx.flags) {
            continue;
        }
        const conflicts = option.conflicts ?? [];
        const hasConflict = conflicts.find((flag)=>!!ctx.flags[flag]);
        const hasConflicts = hasConflict || optionsValues.find((opt)=>opt.conflicts?.find((flag)=>flag === option.name));
        if (hasConflicts) {
            continue;
        }
        throw new MissingRequiredOptionError(option.name);
    }
}
function isset(flagName, flags) {
    const name = paramCaseToCamelCase(flagName);
    return typeof flags[name] !== "undefined";
}
const integer = (type)=>{
    const value = Number(type.value);
    if (Number.isInteger(value)) {
        return value;
    }
    throw new InvalidTypeError(type);
};
const DefaultTypes = {
    string,
    number,
    integer,
    boolean: __boolean
};
function parseFlags(argsOrCtx, opts = {}) {
    let args;
    let ctx;
    if (Array.isArray(argsOrCtx)) {
        ctx = {};
        args = argsOrCtx;
    } else {
        ctx = argsOrCtx;
        args = argsOrCtx.unknown;
        argsOrCtx.unknown = [];
    }
    args = args.slice();
    ctx.flags ??= {};
    ctx.literal ??= [];
    ctx.unknown ??= [];
    ctx.stopEarly = false;
    ctx.stopOnUnknown = false;
    ctx.defaults ??= {};
    opts.dotted ??= true;
    validateOptions(opts);
    const options = parseArgs(ctx, args, opts);
    validateFlags(ctx, opts, options);
    if (opts.dotted) {
        parseDottedOptions(ctx);
    }
    return ctx;
}
function validateOptions(opts) {
    opts.flags?.forEach((opt)=>{
        opt.depends?.forEach((flag)=>{
            if (!opts.flags || !getOption(opts.flags, flag)) {
                throw new UnknownRequiredOptionError(flag, opts.flags ?? []);
            }
        });
        opt.conflicts?.forEach((flag)=>{
            if (!opts.flags || !getOption(opts.flags, flag)) {
                throw new UnknownConflictingOptionError(flag, opts.flags ?? []);
            }
        });
    });
}
function parseArgs(ctx, args, opts) {
    const optionsMap = new Map();
    let inLiteral = false;
    for(let argsIndex = 0; argsIndex < args.length; argsIndex++){
        let option;
        let current = args[argsIndex];
        let currentValue;
        let negate = false;
        if (inLiteral) {
            ctx.literal.push(current);
            continue;
        } else if (current === "--") {
            inLiteral = true;
            continue;
        } else if (ctx.stopEarly || ctx.stopOnUnknown) {
            ctx.unknown.push(current);
            continue;
        }
        const isFlag = current.length > 1 && current[0] === "-";
        if (!isFlag) {
            if (opts.stopEarly) {
                ctx.stopEarly = true;
            }
            ctx.unknown.push(current);
            continue;
        }
        const isShort = current[1] !== "-";
        const isLong = isShort ? false : current.length > 3 && current[2] !== "-";
        if (!isShort && !isLong) {
            throw new InvalidOptionError(current, opts.flags ?? []);
        }
        if (isShort && current.length > 2 && current[2] !== ".") {
            args.splice(argsIndex, 1, ...splitFlags(current));
            current = args[argsIndex];
        } else if (isLong && current.startsWith("--no-")) {
            negate = true;
        }
        const equalSignIndex = current.indexOf("=");
        if (equalSignIndex !== -1) {
            currentValue = current.slice(equalSignIndex + 1) || undefined;
            current = current.slice(0, equalSignIndex);
        }
        if (opts.flags) {
            option = getOption(opts.flags, current);
            if (!option) {
                const name = current.replace(/^-+/, "");
                option = matchWildCardOptions(name, opts.flags);
                if (!option) {
                    if (opts.stopOnUnknown) {
                        ctx.stopOnUnknown = true;
                        ctx.unknown.push(args[argsIndex]);
                        continue;
                    }
                    throw new UnknownOptionError(current, opts.flags);
                }
            }
        } else {
            option = {
                name: current.replace(/^-+/, ""),
                optionalValue: true,
                type: OptionType.STRING
            };
        }
        if (option.standalone) {
            ctx.standalone = option;
        }
        const positiveName = negate ? option.name.replace(/^no-?/, "") : option.name;
        const propName = paramCaseToCamelCase(positiveName);
        if (typeof ctx.flags[propName] !== "undefined") {
            if (!opts.flags?.length) {
                option.collect = true;
            } else if (!option.collect && !ctx.defaults[option.name]) {
                throw new DuplicateOptionError(current);
            }
        }
        if (option.type && !option.args?.length) {
            option.args = [
                {
                    type: option.type,
                    optional: option.optionalValue,
                    variadic: option.variadic,
                    list: option.list,
                    separator: option.separator
                }
            ];
        }
        if (opts.flags?.length && !option.args?.length && typeof currentValue !== "undefined") {
            throw new UnexpectedOptionValueError(option.name, currentValue);
        }
        let optionArgsIndex = 0;
        let inOptionalArg = false;
        const next = ()=>currentValue ?? args[argsIndex + 1];
        const previous = ctx.flags[propName];
        parseNext(option);
        if (typeof ctx.flags[propName] === "undefined") {
            if (option.args?.length && !option.args?.[optionArgsIndex].optional) {
                throw new MissingOptionValueError(option.name);
            } else if (typeof option.default !== "undefined" && (option.type || option.value || option.args?.length)) {
                ctx.flags[propName] = getDefaultValue(option);
            } else {
                setFlagValue(true);
            }
        }
        if (option.value) {
            const value = option.value(ctx.flags[propName], previous);
            setFlagValue(value);
        } else if (option.collect) {
            const value = typeof previous !== "undefined" ? Array.isArray(previous) ? previous : [
                previous
            ] : [];
            value.push(ctx.flags[propName]);
            setFlagValue(value);
        }
        optionsMap.set(propName, option);
        opts.option?.(option, ctx.flags[propName]);
        function parseNext(option) {
            if (negate) {
                setFlagValue(false);
                return;
            } else if (!option.args?.length) {
                setFlagValue(undefined);
                return;
            }
            const arg = option.args[optionArgsIndex];
            if (!arg) {
                const flag = next();
                throw new UnknownOptionError(flag, opts.flags ?? []);
            }
            if (!arg.type) {
                arg.type = OptionType.BOOLEAN;
            }
            if (!option.args?.length && arg.type === OptionType.BOOLEAN && arg.optional === undefined) {
                arg.optional = true;
            }
            if (arg.optional) {
                inOptionalArg = true;
            } else if (inOptionalArg) {
                throw new UnexpectedRequiredArgumentError(option.name);
            }
            let result;
            let increase = false;
            if (arg.list && hasNext(arg)) {
                const parsed = next().split(arg.separator || ",").map((nextValue)=>{
                    const value = parseValue(option, arg, nextValue);
                    if (typeof value === "undefined") {
                        throw new InvalidOptionValueError(option.name, arg.type ?? "?", nextValue);
                    }
                    return value;
                });
                if (parsed?.length) {
                    result = parsed;
                }
            } else {
                if (hasNext(arg)) {
                    result = parseValue(option, arg, next());
                } else if (arg.optional && arg.type === OptionType.BOOLEAN) {
                    result = true;
                }
            }
            if (increase && typeof currentValue === "undefined") {
                argsIndex++;
                if (!arg.variadic) {
                    optionArgsIndex++;
                } else if (option.args[optionArgsIndex + 1]) {
                    throw new UnexpectedArgumentAfterVariadicArgumentError(next());
                }
            }
            if (typeof result !== "undefined" && (option.args.length > 1 || arg.variadic)) {
                if (!ctx.flags[propName]) {
                    setFlagValue([]);
                }
                ctx.flags[propName].push(result);
                if (hasNext(arg)) {
                    parseNext(option);
                }
            } else {
                setFlagValue(result);
            }
            function hasNext(arg) {
                if (!option.args?.length) {
                    return false;
                }
                const nextValue = currentValue ?? args[argsIndex + 1];
                if (!nextValue) {
                    return false;
                }
                if (option.args.length > 1 && optionArgsIndex >= option.args.length) {
                    return false;
                }
                if (!arg.optional) {
                    return true;
                }
                if (option.equalsSign && arg.optional && !arg.variadic && typeof currentValue === "undefined") {
                    return false;
                }
                if (arg.optional || arg.variadic) {
                    return nextValue[0] !== "-" || typeof currentValue !== "undefined" || arg.type === OptionType.NUMBER && !isNaN(Number(nextValue));
                }
                return false;
            }
            function parseValue(option, arg, value) {
                const result = opts.parse ? opts.parse({
                    label: "Option",
                    type: arg.type || OptionType.STRING,
                    name: `--${option.name}`,
                    value
                }) : parseDefaultType(option, arg, value);
                if (typeof result !== "undefined") {
                    increase = true;
                }
                return result;
            }
        }
        function setFlagValue(value) {
            ctx.flags[propName] = value;
            if (ctx.defaults[propName]) {
                delete ctx.defaults[propName];
            }
        }
    }
    return optionsMap;
}
function parseDottedOptions(ctx) {
    ctx.flags = Object.keys(ctx.flags).reduce((result, key)=>{
        if (~key.indexOf(".")) {
            key.split(".").reduce((result, subKey, index, parts)=>{
                if (index === parts.length - 1) {
                    result[subKey] = ctx.flags[key];
                } else {
                    result[subKey] = result[subKey] ?? {};
                }
                return result[subKey];
            }, result);
        } else {
            result[key] = ctx.flags[key];
        }
        return result;
    }, {});
}
function splitFlags(flag) {
    flag = flag.slice(1);
    const normalized = [];
    const index = flag.indexOf("=");
    const flags = (index !== -1 ? flag.slice(0, index) : flag).split("");
    if (isNaN(Number(flag[flag.length - 1]))) {
        flags.forEach((val)=>normalized.push(`-${val}`));
    } else {
        normalized.push(`-${flags.shift()}`);
        if (flags.length) {
            normalized.push(flags.join(""));
        }
    }
    if (index !== -1) {
        normalized[normalized.length - 1] += flag.slice(index);
    }
    return normalized;
}
function parseDefaultType(option, arg, value) {
    const type = arg.type || OptionType.STRING;
    const parseType = DefaultTypes[type];
    if (!parseType) {
        throw new UnknownTypeError(type, Object.keys(DefaultTypes));
    }
    return parseType({
        label: "Option",
        type,
        name: `--${option.name}`,
        value
    });
}
function didYouMeanCommand(command, commands, excludes = []) {
    const commandNames = commands.map((command)=>command.getName()).filter((command)=>!excludes.includes(command));
    return didYouMean(" Did you mean command", command, commandNames);
}
const ARGUMENT_REGEX = /^[<\[].+[\]>]$/;
const ARGUMENT_DETAILS_REGEX = /[<\[:>\]]/;
function splitArguments(args) {
    const parts = args.trim().split(/[, =] */g);
    const typeParts = [];
    while(parts[parts.length - 1] && ARGUMENT_REGEX.test(parts[parts.length - 1])){
        typeParts.unshift(parts.pop());
    }
    const typeDefinition = typeParts.join(" ");
    return {
        flags: parts,
        typeDefinition,
        equalsSign: args.includes("=")
    };
}
function parseArgumentsDefinition(argsDefinition, validate = true, all) {
    const argumentDetails = [];
    let hasOptional = false;
    let hasVariadic = false;
    const parts = argsDefinition.split(/ +/);
    for (const arg of parts){
        if (validate && hasVariadic) {
            throw new UnexpectedArgumentAfterVariadicArgumentError(arg);
        }
        const parts = arg.split(ARGUMENT_DETAILS_REGEX);
        if (!parts[1]) {
            if (all) {
                argumentDetails.push(parts[0]);
            }
            continue;
        }
        const type = parts[2] || OptionType.STRING;
        const details = {
            optional: arg[0] === "[",
            name: parts[1],
            action: parts[3] || type,
            variadic: false,
            list: type ? arg.indexOf(type + "[]") !== -1 : false,
            type
        };
        if (validate && !details.optional && hasOptional) {
            throw new UnexpectedRequiredArgumentError(details.name);
        }
        if (arg[0] === "[") {
            hasOptional = true;
        }
        if (details.name.length > 3) {
            const istVariadicLeft = details.name.slice(0, 3) === "...";
            const istVariadicRight = details.name.slice(-3) === "...";
            hasVariadic = details.variadic = istVariadicLeft || istVariadicRight;
            if (istVariadicLeft) {
                details.name = details.name.slice(3);
            } else if (istVariadicRight) {
                details.name = details.name.slice(0, -3);
            }
        }
        argumentDetails.push(details);
    }
    return argumentDetails;
}
function dedent(str) {
    const lines = str.split(/\r?\n|\r/g);
    let text = "";
    let indent = 0;
    for (const line of lines){
        if (text || line.trim()) {
            if (!text) {
                text = line.trimStart();
                indent = line.length - text.length;
            } else {
                text += line.slice(indent);
            }
            text += "\n";
        }
    }
    return text.trimEnd();
}
function getDescription(description, __short) {
    return __short ? description.trim().split("\n", 1)[0].trim() : dedent(description);
}
class CommandError extends Error {
    constructor(message){
        super(message);
        Object.setPrototypeOf(this, CommandError.prototype);
    }
}
class ValidationError1 extends CommandError {
    exitCode;
    cmd;
    constructor(message, { exitCode } = {}){
        super(message);
        Object.setPrototypeOf(this, ValidationError1.prototype);
        this.exitCode = exitCode ?? 2;
    }
}
class DuplicateOptionNameError extends CommandError {
    constructor(optionName, commandName){
        super(`An option with name '${bold(getFlag(optionName))}' is already registered on command '${bold(commandName)}'. If it is intended to override the option, set the '${bold("override")}' option of the '${bold("option")}' method to true.`);
        Object.setPrototypeOf(this, DuplicateOptionNameError.prototype);
    }
}
class MissingCommandNameError extends CommandError {
    constructor(){
        super("Missing command name.");
        Object.setPrototypeOf(this, MissingCommandNameError.prototype);
    }
}
class DuplicateCommandNameError extends CommandError {
    constructor(name){
        super(`Duplicate command name "${name}".`);
        Object.setPrototypeOf(this, DuplicateCommandNameError.prototype);
    }
}
class DuplicateCommandAliasError extends CommandError {
    constructor(alias){
        super(`Duplicate command alias "${alias}".`);
        Object.setPrototypeOf(this, DuplicateCommandAliasError.prototype);
    }
}
class CommandNotFoundError extends CommandError {
    constructor(name, commands, excluded){
        super(`Unknown command "${name}".${didYouMeanCommand(name, commands, excluded)}`);
        Object.setPrototypeOf(this, CommandNotFoundError.prototype);
    }
}
class DuplicateTypeError extends CommandError {
    constructor(name){
        super(`Type with name "${name}" already exists.`);
        Object.setPrototypeOf(this, DuplicateTypeError.prototype);
    }
}
class DuplicateCompletionError extends CommandError {
    constructor(name){
        super(`Completion with name "${name}" already exists.`);
        Object.setPrototypeOf(this, DuplicateCompletionError.prototype);
    }
}
class DuplicateExampleError extends CommandError {
    constructor(name){
        super(`Example with name "${name}" already exists.`);
        Object.setPrototypeOf(this, DuplicateExampleError.prototype);
    }
}
class DuplicateEnvVarError extends CommandError {
    constructor(name){
        super(`Environment variable with name "${name}" already exists.`);
        Object.setPrototypeOf(this, DuplicateEnvVarError.prototype);
    }
}
class MissingRequiredEnvVarError extends ValidationError1 {
    constructor(envVar){
        super(`Missing required environment variable "${envVar.names[0]}".`);
        Object.setPrototypeOf(this, MissingRequiredEnvVarError.prototype);
    }
}
class TooManyEnvVarValuesError extends CommandError {
    constructor(name){
        super(`An environment variable can only have one value, but "${name}" has more than one.`);
        Object.setPrototypeOf(this, TooManyEnvVarValuesError.prototype);
    }
}
class UnexpectedOptionalEnvVarValueError extends CommandError {
    constructor(name){
        super(`An environment variable cannot have an optional value, but "${name}" is defined as optional.`);
        Object.setPrototypeOf(this, UnexpectedOptionalEnvVarValueError.prototype);
    }
}
class UnexpectedVariadicEnvVarValueError extends CommandError {
    constructor(name){
        super(`An environment variable cannot have an variadic value, but "${name}" is defined as variadic.`);
        Object.setPrototypeOf(this, UnexpectedVariadicEnvVarValueError.prototype);
    }
}
class DefaultCommandNotFoundError extends CommandError {
    constructor(name, commands){
        super(`Default command "${name}" not found.${didYouMeanCommand(name, commands)}`);
        Object.setPrototypeOf(this, DefaultCommandNotFoundError.prototype);
    }
}
class CommandExecutableNotFoundError extends CommandError {
    constructor(name){
        super(`Command executable not found: ${name}`);
        Object.setPrototypeOf(this, CommandExecutableNotFoundError.prototype);
    }
}
class UnknownCommandError extends ValidationError1 {
    constructor(name, commands, excluded){
        super(`Unknown command "${name}".${didYouMeanCommand(name, commands, excluded)}`);
        Object.setPrototypeOf(this, UnknownCommandError.prototype);
    }
}
class NoArgumentsAllowedError extends ValidationError1 {
    constructor(name){
        super(`No arguments allowed for command "${name}".`);
        Object.setPrototypeOf(this, NoArgumentsAllowedError.prototype);
    }
}
class MissingArgumentsError extends ValidationError1 {
    constructor(names){
        super(`Missing argument(s): ${names.join(", ")}`);
        Object.setPrototypeOf(this, MissingArgumentsError.prototype);
    }
}
class MissingArgumentError extends ValidationError1 {
    constructor(name){
        super(`Missing argument: ${name}`);
        Object.setPrototypeOf(this, MissingArgumentError.prototype);
    }
}
class TooManyArgumentsError extends ValidationError1 {
    constructor(args){
        super(`Too many arguments: ${args.join(" ")}`);
        Object.setPrototypeOf(this, TooManyArgumentsError.prototype);
    }
}
class Type {
}
class BooleanType extends Type {
    parse(type) {
        return __boolean(type);
    }
    complete() {
        return [
            "true",
            "false"
        ];
    }
}
class StringType extends Type {
    parse(type) {
        return string(type);
    }
}
class FileType extends StringType {
    constructor(){
        super();
    }
}
class IntegerType extends Type {
    parse(type) {
        return integer(type);
    }
}
class NumberType extends Type {
    parse(type) {
        return number(type);
    }
}
const border = {
    top: "─",
    topMid: "┬",
    topLeft: "┌",
    topRight: "┐",
    bottom: "─",
    bottomMid: "┴",
    bottomLeft: "└",
    bottomRight: "┘",
    left: "│",
    leftMid: "├",
    mid: "─",
    midMid: "┼",
    right: "│",
    rightMid: "┤",
    middle: "│"
};
class Cell {
    value;
    options;
    get length() {
        return this.toString().length;
    }
    static from(value) {
        let cell;
        if (value instanceof Cell) {
            cell = new this(value.getValue());
            cell.options = {
                ...value.options
            };
        } else {
            cell = new this(value);
        }
        return cell;
    }
    constructor(value){
        this.value = value;
        this.options = {};
    }
    toString() {
        return this.value.toString();
    }
    getValue() {
        return this.value;
    }
    setValue(value) {
        this.value = value;
        return this;
    }
    clone(value) {
        return Cell.from(value ?? this);
    }
    border(enable = true, override = true) {
        if (override || typeof this.options.border === "undefined") {
            this.options.border = enable;
        }
        return this;
    }
    colSpan(span, override = true) {
        if (override || typeof this.options.colSpan === "undefined") {
            this.options.colSpan = span;
        }
        return this;
    }
    rowSpan(span, override = true) {
        if (override || typeof this.options.rowSpan === "undefined") {
            this.options.rowSpan = span;
        }
        return this;
    }
    align(direction, override = true) {
        if (override || typeof this.options.align === "undefined") {
            this.options.align = direction;
        }
        return this;
    }
    getBorder() {
        return this.options.border === true;
    }
    getColSpan() {
        return typeof this.options.colSpan === "number" && this.options.colSpan > 0 ? this.options.colSpan : 1;
    }
    getRowSpan() {
        return typeof this.options.rowSpan === "number" && this.options.rowSpan > 0 ? this.options.rowSpan : 1;
    }
    getAlign() {
        return this.options.align ?? "left";
    }
}
class Column {
    static from(options) {
        const opts = options instanceof Column ? options.opts : options;
        return new Column().options(opts);
    }
    opts = {};
    options(options) {
        Object.assign(this.opts, options);
        return this;
    }
    minWidth(width) {
        this.opts.minWidth = width;
        return this;
    }
    maxWidth(width) {
        this.opts.maxWidth = width;
        return this;
    }
    border(border = true) {
        this.opts.border = border;
        return this;
    }
    padding(padding) {
        this.opts.padding = padding;
        return this;
    }
    align(direction) {
        this.opts.align = direction;
        return this;
    }
    getMinWidth() {
        return this.opts.minWidth;
    }
    getMaxWidth() {
        return this.opts.maxWidth;
    }
    getBorder() {
        return this.opts.border;
    }
    getPadding() {
        return this.opts.padding;
    }
    getAlign() {
        return this.opts.align;
    }
}
const __default = JSON.parse("{\n  \"UNICODE_VERSION\": \"15.0.0\",\n  \"tables\": [\n    {\n      \"d\": \"AAECAwQFBgcICQoLDA0OAw8DDwkQCRESERIA\",\n      \"r\": \"AQEBAgEBAQEBAQEBAQEBBwEHAVABBwcBBwF4\"\n    },\n    {\n      \"d\": \"AAECAwQFBgcGCAYJCgsMDQ4PEAYREhMUBhUWFxgZGhscHR4fICEiIyIkJSYnKCkqJSssLS4vMDEyMzQ1Njc4OToGOzwKBj0GPj9AQUIGQwZEBkVGR0hJSktMTQZOBgoGT1BRUlNUVVZXWFkGWgZbBlxdXl1fYGFiY2RlZmdoBmlqBmsGAQZsBm1uO29wcXI7czt0dXZ3OwY7eHkGent8Bn0Gfn+AgYKDhIWGBoc7iAZdO4kGiosGAXGMBo0GjgaPBpAGkQaSBpMGlJUGlpcGmJmam5ydnp+gLgahLKIGo6SlpganqKmqqwasBq0Grq8GsLGyswa0BrUGtre4Brm6uwZHvAa9vga/wME7wjvDxAbFO8bHO8gGyQbKywbMzQbOBs/Q0QbSBr8GvgbT1AbUBtUG1gbXBtjZ2tsG3N0G3t/g4eLjO+Tl5ufoO+k76gbrBuztOwbu7/AGO+XxCgYKCwZd8g==\",\n      \"r\": \"AQEBAQEBAQEBAQEBAQEBAQEBAQMBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQECBQEOAQEBAQEBAQEBAwEBAQEBAQEBAQIBAwEIAQEBAQEBAQEBAQEBAQIBAQEBAQEBAQEBAQEBAQEBDQEBBQEBAQEBAgEBAwEBAQEBAQEBAQEBbQHaAQEFAQEBBAECAQEBAQEBAQEBAwGuASFkCAELAQEBAQEBAQEHAQMBAQEaAQIBCAEFAQEBAQEBAQEBAQEBAQEBAQEBAQECAQEBAQIBAQEBAQEBAwEDAQEBAQEBAQUBAQEBAQEBBAEBAVIBAdkBARABAQFfARMBAYoBBAEBBQEmAUkBAQcBAQIBHgEBARUBAQEBAQUBAQcBDwEBARoBAgEBAQEBAQECAQEBAQEBAQEBAQEBAQEBAQMBBAEBAgEBAQEUfwEBAQIDAXj/AQ==\"\n    },\n    {\n      \"d\": \"AFUVAF3Xd3X/93//VXVVV9VX9V91f1/31X93XVXdVdVV9dVV/VVX1X9X/131VfXVVXV3V1VdVV1V1/1dV1X/3VUAVf3/3/9fVf3/3/9fVV1V/11VFQBQVQEAEEEQVQBQVQBAVFUVAFVUVQUAEAAUBFBVFVFVAEBVBQBUVRUAVVFVBRAAAVBVAVVQVQBVBQBAVUVUAQBUUQEAVQVVUVVUAVRVUVUFVUVBVVRBFRRQUVVQUVUBEFRRVQVVBQBRVRQBVFVRVUFVBVVFVVRVUVVUVQRUBQRQVUFVBVVFVVBVBVVQVRVUAVRVUVUFVVFVRVUFRFVRAEBVFQBAVVEAVFUAQFVQVRFRVQEAQAAEVQEAAQBUVUVVAQQAQVVQBVRVAVRVRUFVUVVRVaoAVQFVBVRVBVUFVQVVEABQVUUBAFVRVRUAVUFVUVVAFVRVRVUBVRUUVUUAQEQBAFQVABRVAEBVAFUEQFRFVRUAVVBVBVAQUFVFUBFQVQAFVUAABABUUVVUUFUVANd/X3//BUD3XdV1VQAEAFVXVdX9V1VXVQBUVdVdVdV1VX111VXVV9V//1X/X1VdVf9fVV9VdVdV1VX31dfVXXX9193/d1X/VV9VV3VVX//1VfVVXVVdVdVVdVWlVWlVqVaWVf/f/1X/Vf/1X1Xf/19V9VVf9df1X1X1X1XVVWlVfV31VVpVd1V3VapV33/fVZVVlVX1WVWlVelV+v/v//7/31Xv/6/77/tVWaVVVlVdVWaVmlX1/1WpVVZVlVWVVlVW+V9VFVBVAKqaqlWqWlWqVaoKoKpqqapqgapVqaqpqmqqVapqqv+qVqpqVRVAAFBVBVVQVUUVVUFVVFVQVQBQVRVVBQBQVRUAUFWqVkBVFQVQVVFVAUBBVRVVVFVUVQQUVAVRVVBVRVVRVFFVqlVFVQCqWlUAqmqqaqpVqlZVqmpVAV1VUVVUVQVAVQFBVQBVQBVVQVUAVRVUVQFVBQBUVQVQVVFVAEBVFFRVFVBVFUBBUUVVUVVAVRUAAQBUVRVVUFUFAEBVARRVFVAEVUVVFQBAVVRVBQBUAFRVAAVEVUVVFQBEFQRVBVBVEFRVUFUVAEARVFUVUQAQVQEFEABVFQBBVRVEFVUABVVUVQEAQFUVABRAVRVVAUABVQUAQFBVAEAAEFUFAAUABEFVAUBFEAAQVVARVRVUVVBVBUBVRFVUFQBQVQBUVQBAVRVVFUBVqlRVWlWqVapaVapWVaqpqmmqalVlVWpZVapVqlVBAFUAUABAVRVQVRUAQAEAVQVQVQVUVQBAFQBUVVFVVFUVAAEAVQBAABQAEARAVUVVAFUAQFUAQFVWVZVV/39V/1//X1X/76uq6v9XVWpVqlWqVlVaVapaVapWVamqmqqmqlWqapWqVapWqmqmqpaqWlWVaqpVZVVpVVZVlapVqlpVVmqpVapVlVZVqlZVqlVWVapqqpqqVapWqlZVqpqqWlWlqlWqVlWqVlVRVQD/Xw==\",\n      \"r\": \"CBcBCAEBAQEBAQEBAQECAQEBAQEBAQEBAQEBAQMBAQECAQEBAQEBAQEBAQEBBAEBGAEDAQwBAwEIAQEBAQEBAQgcCAEDAQEBAQEDAQEBDQEDEAELAQEBEQEKAQEBDgEBAgIBAQoBBQQBCAEBAQEBAQEHAQEHBgEWAQIBDQECAgEFAQECAgEKAQ0BAQIKAQ0BDQEBAQEBAQEBAgEHAQ4BAQEBAQQBBgEBDgEBAQEBAQcBAQIBAQEBBAEFAQEBDgEBAQEBAQECAQcBDwECAQwCDQEBAQEBAQECAQgBAQEEAQcBDQEBAQEBAQQBBwERAQEBARYBAQECAQEBGAECAQIBARIBBgEBDQECAQEBAQECAQgBAQEZAQEBAgYBAQEDAQECAQEBAQMBCBgIBwEMAQEGAQcBBwEQAQEBAQEBAgIBCgEBDQEIAQ0BAQEBAQEBBgEBDgEBAQEBAQEBAgEMBwEMAQwBAQEBCQECAwEHAQEBAQ0BAQEBDgIBBgEDAQEBAQEBAQMBAQEBAgEBAQEBAQEBCAEBAgEBAQEBAQkBCAgBAwECAQEBAgEBAQkBAQEBAwECAQMBAQIBBwEFAQEDAQYBAQEBAgEBAQEBAQEBAQECAgEDAQECBAIDAgIBBQEEAQEBAwEPAQEBCyIBCAEJAwQBAQIBAQEBAgECAQEBAQMBAQEBAwEBAQEBAQEBAQgBAQMDAgEBAwEEAQIBAQEBBAEBAQEBAQECAQEBAQEBAQEBAQEHAQQBAwEBAQcBAgUBBgECAQYBAQwBAQEUAQELCAYBFgMFAQYDAQoBAQMBARQBAQkBAQoBBgEVAwsBCgIPAQ0BGQEBAgEHARQBAwIBBgEBAQUBBgQBAgEJAQEBBQECAQMHAQELAQECCQEQAQECAgECAQsBDAEBAQEBCgEBAQsBAQEECQ4BCAQCAQEECAEEAQEFCAEPAQEEAQEPAQgBFAEBAQEBAQEKAQEJAQ8BEAEBEwEBAQIBCwEBDgENAwEKAQEBAQELAQEBAQECAQwBCAEBAQEBDgEDAQwBAQECAQEXAQEBAQEHAgEBBQEIAQEBAQEQAgEBBQEUAQEBAQEbAQEBAQEGARQBAQEBARkBAQEBCQEBAQEQAQIBDwEBARQBAQEBBwEBAQkBAQEBAQECAQEBCwECAQEVAQEBAQQBBQEBAQEOAQEBAQEBEgEBFgEBAgEMAQEBAQ8BAQMBFgEBDgEBBQEPAQETAQECAQMOAgUBCgIBGQEBAQEIAQMBBwEBAwECEwgBAQcLAQUBFwEBAQEDAQEBBwEBBAEBDg0BAQwBAQEDAQQBAQEDBAEBBAEBAQEBEAEPAQgBAQsBAQ4BEQEMAgEBBwEOAQEHAQEBAQQBBAEDCwECAQEBAwEBBggBAgEBAREBBQMKAQEBAwQCEQEBHgEPAQIBAQYEAQYBAwEUAQUMAQEBAQEBAQECAQEBAgEIAwEBBgsBAgEODAMBAgEBCwEBAQEBAwECAQECAQEBBwgPAQ==\"\n    }\n  ]\n}");
function runLengthDecode({ d, r }) {
    const data = atob(d);
    const runLengths = atob(r);
    let out = "";
    for (const [i, ch] of [
        ...runLengths
    ].entries()){
        out += data[i].repeat(ch.codePointAt(0));
    }
    return Uint8Array.from([
        ...out
    ].map((x)=>x.codePointAt(0)));
}
let tables = null;
function lookupWidth(cp) {
    if (!tables) tables = __default.tables.map(runLengthDecode);
    const t1Offset = tables[0][cp >> 13 & 0xff];
    const t2Offset = tables[1][128 * t1Offset + (cp >> 6 & 0x7f)];
    const packedWidths = tables[2][16 * t2Offset + (cp >> 2 & 0xf)];
    const width = packedWidths >> 2 * (cp & 0b11) & 0b11;
    return width === 3 ? 1 : width;
}
const cache = new Map();
function charWidth(ch) {
    if (cache.has(ch)) return cache.get(ch);
    const cp = ch.codePointAt(0);
    let v = null;
    if (cp < 0x7f) {
        v = cp >= 0x20 ? 1 : cp === 0 ? 0 : null;
    } else if (cp >= 0xa0) {
        v = lookupWidth(cp);
    } else {
        v = null;
    }
    cache.set(ch, v);
    return v;
}
function unicodeWidth(str) {
    return [
        ...str
    ].map((ch)=>charWidth(ch) ?? 0).reduce((a, b)=>a + b, 0);
}
const strLength = (str)=>{
    return unicodeWidth(stripColor(str));
};
function consumeWords(length, content) {
    let consumed = "";
    const words = content.split("\n")[0]?.split(/ /g);
    for(let i = 0; i < words.length; i++){
        const word = words[i];
        if (consumed) {
            const nextLength = strLength(word);
            const consumedLength = strLength(consumed);
            if (consumedLength + nextLength >= length) {
                break;
            }
        }
        consumed += (i > 0 ? " " : "") + word;
    }
    return consumed;
}
function longest(index, rows, maxWidth) {
    const cellLengths = rows.map((row)=>{
        const cell = row[index];
        const cellValue = cell instanceof Cell && cell.getColSpan() > 1 ? "" : cell?.toString() || "";
        return cellValue.split("\n").map((line)=>{
            const str = typeof maxWidth === "undefined" ? line : consumeWords(maxWidth, line);
            return strLength(str) || 0;
        });
    }).flat();
    return Math.max(...cellLengths);
}
class Row extends Array {
    options = {};
    static from(cells) {
        const row = new this(...cells);
        if (cells instanceof Row) {
            row.options = {
                ...cells.options
            };
        }
        return row;
    }
    clone() {
        const row = new Row(...this.map((cell)=>cell instanceof Cell ? cell.clone() : cell));
        row.options = {
            ...this.options
        };
        return row;
    }
    border(enable = true, override = true) {
        if (override || typeof this.options.border === "undefined") {
            this.options.border = enable;
        }
        return this;
    }
    align(direction, override = true) {
        if (override || typeof this.options.align === "undefined") {
            this.options.align = direction;
        }
        return this;
    }
    getBorder() {
        return this.options.border === true;
    }
    hasBorder() {
        return this.getBorder() || this.some((cell)=>cell instanceof Cell && cell.getBorder());
    }
    getAlign() {
        return this.options.align ?? "left";
    }
}
class TableLayout {
    table;
    options;
    constructor(table, options){
        this.table = table;
        this.options = options;
    }
    toString() {
        const opts = this.createLayout();
        return opts.rows.length ? this.renderRows(opts) : "";
    }
    createLayout() {
        Object.keys(this.options.chars).forEach((key)=>{
            if (typeof this.options.chars[key] !== "string") {
                this.options.chars[key] = "";
            }
        });
        const hasBodyBorder = this.table.getBorder() || this.table.hasBodyBorder();
        const hasHeaderBorder = this.table.hasHeaderBorder();
        const hasBorder = hasHeaderBorder || hasBodyBorder;
        const rows = this.#getRows();
        const columns = Math.max(...rows.map((row)=>row.length));
        for(let rowIndex = 0; rowIndex < rows.length; rowIndex++){
            const row = rows[rowIndex];
            const length = row.length;
            if (length < columns) {
                const diff = columns - length;
                for(let i = 0; i < diff; i++){
                    row.push(this.createCell(null, row, rowIndex, length + i));
                }
            }
        }
        const padding = [];
        const width = [];
        for(let colIndex = 0; colIndex < columns; colIndex++){
            const column = this.options.columns.at(colIndex);
            const minColWidth = column?.getMinWidth() ?? (Array.isArray(this.options.minColWidth) ? this.options.minColWidth[colIndex] : this.options.minColWidth);
            const maxColWidth = column?.getMaxWidth() ?? (Array.isArray(this.options.maxColWidth) ? this.options.maxColWidth[colIndex] : this.options.maxColWidth);
            const colWidth = longest(colIndex, rows, maxColWidth);
            width[colIndex] = Math.min(maxColWidth, Math.max(minColWidth, colWidth));
            padding[colIndex] = column?.getPadding() ?? (Array.isArray(this.options.padding) ? this.options.padding[colIndex] : this.options.padding);
        }
        return {
            padding,
            width,
            rows,
            columns,
            hasBorder,
            hasBodyBorder,
            hasHeaderBorder
        };
    }
    #getRows() {
        const header = this.table.getHeader();
        const rows = header ? [
            header,
            ...this.table
        ] : this.table.slice();
        const hasSpan = rows.some((row)=>row.some((cell)=>cell instanceof Cell && (cell.getColSpan() > 1 || cell.getRowSpan() > 1)));
        if (hasSpan) {
            return this.spanRows(rows);
        }
        return rows.map((row, rowIndex)=>{
            const newRow = this.createRow(row);
            for(let colIndex = 0; colIndex < row.length; colIndex++){
                newRow[colIndex] = this.createCell(row[colIndex], newRow, rowIndex, colIndex);
            }
            return newRow;
        });
    }
    spanRows(rows) {
        const rowSpan = [];
        let colSpan = 1;
        let rowIndex = -1;
        while(true){
            rowIndex++;
            if (rowIndex === rows.length && rowSpan.every((span)=>span === 1)) {
                break;
            }
            const row = rows[rowIndex] = this.createRow(rows[rowIndex] || []);
            let colIndex = -1;
            while(true){
                colIndex++;
                if (colIndex === row.length && colIndex === rowSpan.length && colSpan === 1) {
                    break;
                }
                if (colSpan > 1) {
                    colSpan--;
                    rowSpan[colIndex] = rowSpan[colIndex - 1];
                    row.splice(colIndex, this.getDeleteCount(rows, rowIndex, colIndex), row[colIndex - 1]);
                    continue;
                }
                if (rowSpan[colIndex] > 1) {
                    rowSpan[colIndex]--;
                    rows[rowIndex].splice(colIndex, this.getDeleteCount(rows, rowIndex, colIndex), rows[rowIndex - 1][colIndex]);
                    continue;
                }
                const cell = row[colIndex] = this.createCell(row[colIndex] || null, row, rowIndex, colIndex);
                colSpan = cell.getColSpan();
                rowSpan[colIndex] = cell.getRowSpan();
            }
        }
        return rows;
    }
    getDeleteCount(rows, rowIndex, colIndex) {
        return colIndex <= rows[rowIndex].length - 1 && typeof rows[rowIndex][colIndex] === "undefined" ? 1 : 0;
    }
    createRow(row) {
        return Row.from(row).border(this.table.getBorder(), false).align(this.table.getAlign(), false);
    }
    createCell(cell, row, rowIndex, colIndex) {
        const column = this.options.columns.at(colIndex);
        const isHeaderRow = this.isHeaderRow(rowIndex);
        return Cell.from(cell ?? "").border((isHeaderRow ? null : column?.getBorder()) ?? row.getBorder(), false).align((isHeaderRow ? null : column?.getAlign()) ?? row.getAlign(), false);
    }
    isHeaderRow(rowIndex) {
        return rowIndex === 0 && this.table.getHeader() !== undefined;
    }
    renderRows(opts) {
        let result = "";
        const rowSpan = new Array(opts.columns).fill(1);
        for(let rowIndex = 0; rowIndex < opts.rows.length; rowIndex++){
            result += this.renderRow(rowSpan, rowIndex, opts);
        }
        return result.slice(0, -1);
    }
    renderRow(rowSpan, rowIndex, opts, isMultiline) {
        const row = opts.rows[rowIndex];
        const prevRow = opts.rows[rowIndex - 1];
        const nextRow = opts.rows[rowIndex + 1];
        let result = "";
        let colSpan = 1;
        if (!isMultiline && rowIndex === 0 && row.hasBorder()) {
            result += this.renderBorderRow(undefined, row, rowSpan, opts);
        }
        let isMultilineRow = false;
        result += " ".repeat(this.options.indent || 0);
        for(let colIndex = 0; colIndex < opts.columns; colIndex++){
            if (colSpan > 1) {
                colSpan--;
                rowSpan[colIndex] = rowSpan[colIndex - 1];
                continue;
            }
            result += this.renderCell(colIndex, row, opts);
            if (rowSpan[colIndex] > 1) {
                if (!isMultiline) {
                    rowSpan[colIndex]--;
                }
            } else if (!prevRow || prevRow[colIndex] !== row[colIndex]) {
                rowSpan[colIndex] = row[colIndex].getRowSpan();
            }
            colSpan = row[colIndex].getColSpan();
            if (rowSpan[colIndex] === 1 && row[colIndex].length) {
                isMultilineRow = true;
            }
        }
        if (opts.columns > 0) {
            if (row[opts.columns - 1].getBorder()) {
                result += this.options.chars.right;
            } else if (opts.hasBorder) {
                result += " ";
            }
        }
        result += "\n";
        if (isMultilineRow) {
            return result + this.renderRow(rowSpan, rowIndex, opts, isMultilineRow);
        }
        if (opts.rows.length > 1 && (rowIndex === 0 && opts.hasHeaderBorder || rowIndex < opts.rows.length - 1 && opts.hasBodyBorder)) {
            result += this.renderBorderRow(row, nextRow, rowSpan, opts);
        }
        if (rowIndex === opts.rows.length - 1 && row.hasBorder()) {
            result += this.renderBorderRow(row, undefined, rowSpan, opts);
        }
        return result;
    }
    renderCell(colIndex, row, opts, noBorder) {
        let result = "";
        const prevCell = row[colIndex - 1];
        const cell = row[colIndex];
        if (!noBorder) {
            if (colIndex === 0) {
                if (cell.getBorder()) {
                    result += this.options.chars.left;
                } else if (opts.hasBorder) {
                    result += " ";
                }
            } else {
                if (cell.getBorder() || prevCell?.getBorder()) {
                    result += this.options.chars.middle;
                } else if (opts.hasBorder) {
                    result += " ";
                }
            }
        }
        let maxLength = opts.width[colIndex];
        const colSpan = cell.getColSpan();
        if (colSpan > 1) {
            for(let o = 1; o < colSpan; o++){
                maxLength += opts.width[colIndex + o] + opts.padding[colIndex + o];
                if (opts.hasBorder) {
                    maxLength += opts.padding[colIndex + o] + 1;
                }
            }
        }
        const { current, next } = this.renderCellValue(cell, maxLength);
        row[colIndex].setValue(next.getValue());
        if (opts.hasBorder) {
            result += " ".repeat(opts.padding[colIndex]);
        }
        result += current;
        if (opts.hasBorder || colIndex < opts.columns - 1) {
            result += " ".repeat(opts.padding[colIndex]);
        }
        return result;
    }
    renderCellValue(cell, maxLength) {
        const length = Math.min(maxLength, strLength(cell.toString()));
        let words = consumeWords(length, cell.toString());
        const breakWord = strLength(words) > length;
        if (breakWord) {
            words = words.slice(0, length);
        }
        const next = cell.toString().slice(words.length + (breakWord ? 0 : 1));
        const fillLength = maxLength - strLength(words);
        const align = cell.getAlign();
        let current;
        if (fillLength === 0) {
            current = words;
        } else if (align === "left") {
            current = words + " ".repeat(fillLength);
        } else if (align === "center") {
            current = " ".repeat(Math.floor(fillLength / 2)) + words + " ".repeat(Math.ceil(fillLength / 2));
        } else if (align === "right") {
            current = " ".repeat(fillLength) + words;
        } else {
            throw new Error("Unknown direction: " + align);
        }
        return {
            current,
            next: cell.clone(next)
        };
    }
    renderBorderRow(prevRow, nextRow, rowSpan, opts) {
        let result = "";
        let colSpan = 1;
        for(let colIndex = 0; colIndex < opts.columns; colIndex++){
            if (rowSpan[colIndex] > 1) {
                if (!nextRow) {
                    throw new Error("invalid layout");
                }
                if (colSpan > 1) {
                    colSpan--;
                    continue;
                }
            }
            result += this.renderBorderCell(colIndex, prevRow, nextRow, rowSpan, opts);
            colSpan = nextRow?.[colIndex].getColSpan() ?? 1;
        }
        return result.length ? " ".repeat(this.options.indent) + result + "\n" : "";
    }
    renderBorderCell(colIndex, prevRow, nextRow, rowSpan, opts) {
        const a1 = prevRow?.[colIndex - 1];
        const a2 = nextRow?.[colIndex - 1];
        const b1 = prevRow?.[colIndex];
        const b2 = nextRow?.[colIndex];
        const a1Border = !!a1?.getBorder();
        const a2Border = !!a2?.getBorder();
        const b1Border = !!b1?.getBorder();
        const b2Border = !!b2?.getBorder();
        const hasColSpan = (cell)=>(cell?.getColSpan() ?? 1) > 1;
        const hasRowSpan = (cell)=>(cell?.getRowSpan() ?? 1) > 1;
        let result = "";
        if (colIndex === 0) {
            if (rowSpan[colIndex] > 1) {
                if (b1Border) {
                    result += this.options.chars.left;
                } else {
                    result += " ";
                }
            } else if (b1Border && b2Border) {
                result += this.options.chars.leftMid;
            } else if (b1Border) {
                result += this.options.chars.bottomLeft;
            } else if (b2Border) {
                result += this.options.chars.topLeft;
            } else {
                result += " ";
            }
        } else if (colIndex < opts.columns) {
            if (a1Border && b2Border || b1Border && a2Border) {
                const a1ColSpan = hasColSpan(a1);
                const a2ColSpan = hasColSpan(a2);
                const b1ColSpan = hasColSpan(b1);
                const b2ColSpan = hasColSpan(b2);
                const a1RowSpan = hasRowSpan(a1);
                const a2RowSpan = hasRowSpan(a2);
                const b1RowSpan = hasRowSpan(b1);
                const b2RowSpan = hasRowSpan(b2);
                const hasAllBorder = a1Border && b2Border && b1Border && a2Border;
                const hasAllRowSpan = a1RowSpan && b1RowSpan && a2RowSpan && b2RowSpan;
                const hasAllColSpan = a1ColSpan && b1ColSpan && a2ColSpan && b2ColSpan;
                if (hasAllRowSpan && hasAllBorder) {
                    result += this.options.chars.middle;
                } else if (hasAllColSpan && hasAllBorder && a1 === b1 && a2 === b2) {
                    result += this.options.chars.mid;
                } else if (a1ColSpan && b1ColSpan && a1 === b1) {
                    result += this.options.chars.topMid;
                } else if (a2ColSpan && b2ColSpan && a2 === b2) {
                    result += this.options.chars.bottomMid;
                } else if (a1RowSpan && a2RowSpan && a1 === a2) {
                    result += this.options.chars.leftMid;
                } else if (b1RowSpan && b2RowSpan && b1 === b2) {
                    result += this.options.chars.rightMid;
                } else {
                    result += this.options.chars.midMid;
                }
            } else if (a1Border && b1Border) {
                if (hasColSpan(a1) && hasColSpan(b1) && a1 === b1) {
                    result += this.options.chars.bottom;
                } else {
                    result += this.options.chars.bottomMid;
                }
            } else if (b1Border && b2Border) {
                if (rowSpan[colIndex] > 1) {
                    result += this.options.chars.left;
                } else {
                    result += this.options.chars.leftMid;
                }
            } else if (b2Border && a2Border) {
                if (hasColSpan(a2) && hasColSpan(b2) && a2 === b2) {
                    result += this.options.chars.top;
                } else {
                    result += this.options.chars.topMid;
                }
            } else if (a1Border && a2Border) {
                if (hasRowSpan(a1) && a1 === a2) {
                    result += this.options.chars.right;
                } else {
                    result += this.options.chars.rightMid;
                }
            } else if (a1Border) {
                result += this.options.chars.bottomRight;
            } else if (b1Border) {
                result += this.options.chars.bottomLeft;
            } else if (a2Border) {
                result += this.options.chars.topRight;
            } else if (b2Border) {
                result += this.options.chars.topLeft;
            } else {
                result += " ";
            }
        }
        const length = opts.padding[colIndex] + opts.width[colIndex] + opts.padding[colIndex];
        if (rowSpan[colIndex] > 1 && nextRow) {
            result += this.renderCell(colIndex, nextRow, opts, true);
            if (nextRow[colIndex] === nextRow[nextRow.length - 1]) {
                if (b1Border) {
                    result += this.options.chars.right;
                } else {
                    result += " ";
                }
                return result;
            }
        } else if (b1Border && b2Border) {
            result += this.options.chars.mid.repeat(length);
        } else if (b1Border) {
            result += this.options.chars.bottom.repeat(length);
        } else if (b2Border) {
            result += this.options.chars.top.repeat(length);
        } else {
            result += " ".repeat(length);
        }
        if (colIndex === opts.columns - 1) {
            if (b1Border && b2Border) {
                result += this.options.chars.rightMid;
            } else if (b1Border) {
                result += this.options.chars.bottomRight;
            } else if (b2Border) {
                result += this.options.chars.topRight;
            } else {
                result += " ";
            }
        }
        return result;
    }
}
class Table extends Array {
    static _chars = {
        ...border
    };
    options = {
        indent: 0,
        border: false,
        maxColWidth: Infinity,
        minColWidth: 0,
        padding: 1,
        chars: {
            ...Table._chars
        },
        columns: []
    };
    headerRow;
    static from(rows) {
        const table = new this(...rows);
        if (rows instanceof Table) {
            table.options = {
                ...rows.options
            };
            table.headerRow = rows.headerRow ? Row.from(rows.headerRow) : undefined;
        }
        return table;
    }
    static fromJson(rows) {
        return new this().fromJson(rows);
    }
    static chars(chars) {
        Object.assign(this._chars, chars);
        return this;
    }
    static render(rows) {
        Table.from(rows).render();
    }
    fromJson(rows) {
        this.header(Object.keys(rows[0]));
        this.body(rows.map((row)=>Object.values(row)));
        return this;
    }
    columns(columns) {
        this.options.columns = columns.map((column)=>column instanceof Column ? column : Column.from(column));
        return this;
    }
    column(index, column) {
        if (column instanceof Column) {
            this.options.columns[index] = column;
        } else if (this.options.columns[index]) {
            this.options.columns[index].options(column);
        } else {
            this.options.columns[index] = Column.from(column);
        }
        return this;
    }
    header(header) {
        this.headerRow = header instanceof Row ? header : Row.from(header);
        return this;
    }
    body(rows) {
        this.length = 0;
        this.push(...rows);
        return this;
    }
    clone() {
        const table = new Table(...this.map((row)=>row instanceof Row ? row.clone() : Row.from(row).clone()));
        table.options = {
            ...this.options
        };
        table.headerRow = this.headerRow?.clone();
        return table;
    }
    toString() {
        return new TableLayout(this, this.options).toString();
    }
    render() {
        console.log(this.toString());
        return this;
    }
    maxColWidth(width, override = true) {
        if (override || typeof this.options.maxColWidth === "undefined") {
            this.options.maxColWidth = width;
        }
        return this;
    }
    minColWidth(width, override = true) {
        if (override || typeof this.options.minColWidth === "undefined") {
            this.options.minColWidth = width;
        }
        return this;
    }
    indent(width, override = true) {
        if (override || typeof this.options.indent === "undefined") {
            this.options.indent = width;
        }
        return this;
    }
    padding(padding, override = true) {
        if (override || typeof this.options.padding === "undefined") {
            this.options.padding = padding;
        }
        return this;
    }
    border(enable = true, override = true) {
        if (override || typeof this.options.border === "undefined") {
            this.options.border = enable;
        }
        return this;
    }
    align(direction, override = true) {
        if (override || typeof this.options.align === "undefined") {
            this.options.align = direction;
        }
        return this;
    }
    chars(chars) {
        Object.assign(this.options.chars, chars);
        return this;
    }
    getHeader() {
        return this.headerRow;
    }
    getBody() {
        return [
            ...this
        ];
    }
    getMaxColWidth() {
        return this.options.maxColWidth;
    }
    getMinColWidth() {
        return this.options.minColWidth;
    }
    getIndent() {
        return this.options.indent;
    }
    getPadding() {
        return this.options.padding;
    }
    getBorder() {
        return this.options.border === true;
    }
    hasHeaderBorder() {
        const hasBorder = this.headerRow?.hasBorder();
        return hasBorder === true || this.getBorder() && hasBorder !== false;
    }
    hasBodyBorder() {
        return this.getBorder() || this.options.columns.some((column)=>column.getBorder()) || this.some((row)=>row instanceof Row ? row.hasBorder() : row.some((cell)=>cell instanceof Cell ? cell.getBorder() : false));
    }
    hasBorder() {
        return this.hasHeaderBorder() || this.hasBodyBorder();
    }
    getAlign() {
        return this.options.align ?? "left";
    }
    getColumns() {
        return this.options.columns;
    }
    getColumn(index) {
        return this.options.columns[index] ??= new Column();
    }
}
class HelpGenerator {
    cmd;
    indent;
    options;
    static generate(cmd, options) {
        return new HelpGenerator(cmd, options).generate();
    }
    constructor(cmd, options = {}){
        this.cmd = cmd;
        this.indent = 2;
        this.options = {
            types: false,
            hints: true,
            colors: true,
            long: false,
            ...options
        };
    }
    generate() {
        const areColorsEnabled = getColorEnabled();
        setColorEnabled(this.options.colors);
        const result = this.generateHeader() + this.generateMeta() + this.generateDescription() + this.generateOptions() + this.generateCommands() + this.generateEnvironmentVariables() + this.generateExamples();
        setColorEnabled(areColorsEnabled);
        return result;
    }
    generateHeader() {
        const usage = this.cmd.getUsage();
        const rows = [
            [
                bold("Usage:"),
                brightMagenta(this.cmd.getPath() + (usage ? " " + highlightArguments(usage, this.options.types) : ""))
            ]
        ];
        const version = this.cmd.getVersion();
        if (version) {
            rows.push([
                bold("Version:"),
                yellow(`${this.cmd.getVersion()}`)
            ]);
        }
        return "\n" + Table.from(rows).padding(1).toString() + "\n";
    }
    generateMeta() {
        const meta = Object.entries(this.cmd.getMeta());
        if (!meta.length) {
            return "";
        }
        const rows = [];
        for (const [name, value] of meta){
            rows.push([
                bold(`${name}: `) + value
            ]);
        }
        return "\n" + Table.from(rows).padding(1).toString() + "\n";
    }
    generateDescription() {
        if (!this.cmd.getDescription()) {
            return "";
        }
        return this.label("Description") + Table.from([
            [
                dedent(this.cmd.getDescription())
            ]
        ]).indent(this.indent).maxColWidth(140).padding(1).toString() + "\n";
    }
    generateOptions() {
        const options = this.cmd.getOptions(false);
        if (!options.length) {
            return "";
        }
        let groups = [];
        const hasGroups = options.some((option)=>option.groupName);
        if (hasGroups) {
            for (const option of options){
                let group = groups.find((group)=>group.name === option.groupName);
                if (!group) {
                    group = {
                        name: option.groupName,
                        options: []
                    };
                    groups.push(group);
                }
                group.options.push(option);
            }
        } else {
            groups = [
                {
                    name: "Options",
                    options
                }
            ];
        }
        let result = "";
        for (const group of groups){
            result += this.generateOptionGroup(group);
        }
        return result;
    }
    generateOptionGroup(group) {
        if (!group.options.length) {
            return "";
        }
        const hasTypeDefinitions = !!group.options.find((option)=>!!option.typeDefinition);
        if (hasTypeDefinitions) {
            return this.label(group.name ?? "Options") + Table.from([
                ...group.options.map((option)=>[
                        option.flags.map((flag)=>brightBlue(flag)).join(", "),
                        highlightArguments(option.typeDefinition || "", this.options.types),
                        red(bold("-")),
                        getDescription(option.description, !this.options.long),
                        this.generateHints(option)
                    ])
            ]).padding([
                2,
                2,
                1,
                2
            ]).indent(this.indent).maxColWidth([
                60,
                60,
                1,
                80,
                60
            ]).toString() + "\n";
        }
        return this.label(group.name ?? "Options") + Table.from([
            ...group.options.map((option)=>[
                    option.flags.map((flag)=>brightBlue(flag)).join(", "),
                    red(bold("-")),
                    getDescription(option.description, !this.options.long),
                    this.generateHints(option)
                ])
        ]).indent(this.indent).maxColWidth([
            60,
            1,
            80,
            60
        ]).padding([
            2,
            1,
            2
        ]).toString() + "\n";
    }
    generateCommands() {
        const commands = this.cmd.getCommands(false);
        if (!commands.length) {
            return "";
        }
        const hasTypeDefinitions = !!commands.find((command)=>!!command.getArgsDefinition());
        if (hasTypeDefinitions) {
            return this.label("Commands") + Table.from([
                ...commands.map((command)=>[
                        [
                            command.getName(),
                            ...command.getAliases()
                        ].map((name)=>brightBlue(name)).join(", "),
                        highlightArguments(command.getArgsDefinition() || "", this.options.types),
                        red(bold("-")),
                        command.getShortDescription()
                    ])
            ]).indent(this.indent).maxColWidth([
                60,
                60,
                1,
                80
            ]).padding([
                2,
                2,
                1,
                2
            ]).toString() + "\n";
        }
        return this.label("Commands") + Table.from([
            ...commands.map((command)=>[
                    [
                        command.getName(),
                        ...command.getAliases()
                    ].map((name)=>brightBlue(name)).join(", "),
                    red(bold("-")),
                    command.getShortDescription()
                ])
        ]).maxColWidth([
            60,
            1,
            80
        ]).padding([
            2,
            1,
            2
        ]).indent(this.indent).toString() + "\n";
    }
    generateEnvironmentVariables() {
        const envVars = this.cmd.getEnvVars(false);
        if (!envVars.length) {
            return "";
        }
        return this.label("Environment variables") + Table.from([
            ...envVars.map((envVar)=>[
                    envVar.names.map((name)=>brightBlue(name)).join(", "),
                    highlightArgumentDetails(envVar.details, this.options.types),
                    red(bold("-")),
                    this.options.long ? dedent(envVar.description) : envVar.description.trim().split("\n", 1)[0],
                    envVar.required ? `(${yellow(`required`)})` : ""
                ])
        ]).padding([
            2,
            2,
            1,
            2
        ]).indent(this.indent).maxColWidth([
            60,
            60,
            1,
            80,
            10
        ]).toString() + "\n";
    }
    generateExamples() {
        const examples = this.cmd.getExamples();
        if (!examples.length) {
            return "";
        }
        return this.label("Examples") + Table.from(examples.map((example)=>[
                dim(bold(`${capitalize(example.name)}:`)),
                dedent(example.description)
            ])).padding(1).indent(this.indent).maxColWidth(150).toString() + "\n";
    }
    generateHints(option) {
        if (!this.options.hints) {
            return "";
        }
        const hints = [];
        option.required && hints.push(yellow(`required`));
        if (typeof option.default !== "undefined") {
            const defaultValue = getDefaultValue(option);
            if (typeof defaultValue !== "undefined") {
                hints.push(bold(`Default: `) + inspect(defaultValue, this.options.colors));
            }
        }
        option.depends?.length && hints.push(yellow(bold(`Depends: `)) + italic(option.depends.map(getFlag).join(", ")));
        option.conflicts?.length && hints.push(red(bold(`Conflicts: `)) + italic(option.conflicts.map(getFlag).join(", ")));
        const type = this.cmd.getType(option.args[0]?.type)?.handler;
        if (type instanceof Type) {
            const possibleValues = type.values?.(this.cmd, this.cmd.getParent());
            if (possibleValues?.length) {
                hints.push(bold(`Values: `) + possibleValues.map((value)=>inspect(value, this.options.colors)).join(", "));
            }
        }
        if (hints.length) {
            return `(${hints.join(", ")})`;
        }
        return "";
    }
    label(label) {
        return "\n" + bold(`${label}:`) + "\n\n";
    }
}
function capitalize(string) {
    return (string?.charAt(0).toUpperCase() + string.slice(1)) ?? "";
}
function inspect(value, colors) {
    return Deno.inspect(value, {
        depth: 1,
        colors,
        trailingComma: false
    });
}
function highlightArguments(argsDefinition, types = true) {
    if (!argsDefinition) {
        return "";
    }
    return parseArgumentsDefinition(argsDefinition, false, true).map((arg)=>typeof arg === "string" ? arg : highlightArgumentDetails(arg, types)).join(" ");
}
function highlightArgumentDetails(arg, types = true) {
    let str = "";
    str += yellow(arg.optional ? "[" : "<");
    let name = "";
    name += arg.name;
    if (arg.variadic) {
        name += "...";
    }
    name = brightMagenta(name);
    str += name;
    if (types) {
        str += yellow(":");
        str += red(arg.type);
        if (arg.list) {
            str += green("[]");
        }
    }
    str += yellow(arg.optional ? "]" : ">");
    return str;
}
class Command {
    types = new Map();
    rawArgs = [];
    literalArgs = [];
    _name = "COMMAND";
    _parent;
    _globalParent;
    ver;
    desc = "";
    _usage;
    actionHandler;
    globalActionHandler;
    options = [];
    commands = new Map();
    examples = [];
    envVars = [];
    aliases = [];
    completions = new Map();
    cmd = this;
    argsDefinition;
    isExecutable = false;
    throwOnError = false;
    _allowEmpty = false;
    _stopEarly = false;
    defaultCommand;
    _useRawArgs = false;
    args = [];
    isHidden = false;
    isGlobal = false;
    hasDefaults = false;
    _versionOptions;
    _helpOptions;
    _versionOption;
    _helpOption;
    _help;
    _shouldExit;
    _meta = {};
    _groupName = null;
    _noGlobals = false;
    errorHandler;
    versionOption(flags, desc, opts) {
        this._versionOptions = flags === false ? flags : {
            flags,
            desc,
            opts: typeof opts === "function" ? {
                action: opts
            } : opts
        };
        return this;
    }
    helpOption(flags, desc, opts) {
        this._helpOptions = flags === false ? flags : {
            flags,
            desc,
            opts: typeof opts === "function" ? {
                action: opts
            } : opts
        };
        return this;
    }
    command(nameAndArguments, cmdOrDescription, override) {
        this.reset();
        const result = splitArguments(nameAndArguments);
        const name = result.flags.shift();
        const aliases = result.flags;
        if (!name) {
            throw new MissingCommandNameError();
        }
        if (this.getBaseCommand(name, true)) {
            if (!override) {
                throw new DuplicateCommandNameError(name);
            }
            this.removeCommand(name);
        }
        let description;
        let cmd;
        if (typeof cmdOrDescription === "string") {
            description = cmdOrDescription;
        }
        if (cmdOrDescription instanceof Command) {
            cmd = cmdOrDescription.reset();
        } else {
            cmd = new Command();
        }
        cmd._name = name;
        cmd._parent = this;
        if (description) {
            cmd.description(description);
        }
        if (result.typeDefinition) {
            cmd.arguments(result.typeDefinition);
        }
        aliases.forEach((alias)=>cmd.alias(alias));
        this.commands.set(name, cmd);
        this.select(name);
        return this;
    }
    alias(alias) {
        if (this.cmd._name === alias || this.cmd.aliases.includes(alias)) {
            throw new DuplicateCommandAliasError(alias);
        }
        this.cmd.aliases.push(alias);
        return this;
    }
    reset() {
        this._groupName = null;
        this.cmd = this;
        return this;
    }
    select(name) {
        const cmd = this.getBaseCommand(name, true);
        if (!cmd) {
            throw new CommandNotFoundError(name, this.getBaseCommands(true));
        }
        this.cmd = cmd;
        return this;
    }
    name(name) {
        this.cmd._name = name;
        return this;
    }
    version(version) {
        if (typeof version === "string") {
            this.cmd.ver = ()=>version;
        } else if (typeof version === "function") {
            this.cmd.ver = version;
        }
        return this;
    }
    meta(name, value) {
        this.cmd._meta[name] = value;
        return this;
    }
    getMeta(name) {
        return typeof name === "undefined" ? this._meta : this._meta[name];
    }
    help(help) {
        if (typeof help === "string") {
            this.cmd._help = ()=>help;
        } else if (typeof help === "function") {
            this.cmd._help = help;
        } else {
            this.cmd._help = (cmd, options)=>HelpGenerator.generate(cmd, {
                    ...help,
                    ...options
                });
        }
        return this;
    }
    description(description) {
        this.cmd.desc = description;
        return this;
    }
    usage(usage) {
        this.cmd._usage = usage;
        return this;
    }
    hidden() {
        this.cmd.isHidden = true;
        return this;
    }
    global() {
        this.cmd.isGlobal = true;
        return this;
    }
    executable() {
        this.cmd.isExecutable = true;
        return this;
    }
    arguments(args) {
        this.cmd.argsDefinition = args;
        return this;
    }
    action(fn) {
        this.cmd.actionHandler = fn;
        return this;
    }
    globalAction(fn) {
        this.cmd.globalActionHandler = fn;
        return this;
    }
    allowEmpty(allowEmpty) {
        this.cmd._allowEmpty = allowEmpty !== false;
        return this;
    }
    stopEarly(stopEarly = true) {
        this.cmd._stopEarly = stopEarly;
        return this;
    }
    useRawArgs(useRawArgs = true) {
        this.cmd._useRawArgs = useRawArgs;
        return this;
    }
    default(name) {
        this.cmd.defaultCommand = name;
        return this;
    }
    globalType(name, handler, options) {
        return this.type(name, handler, {
            ...options,
            global: true
        });
    }
    type(name, handler, options) {
        if (this.cmd.types.get(name) && !options?.override) {
            throw new DuplicateTypeError(name);
        }
        this.cmd.types.set(name, {
            ...options,
            name,
            handler: handler
        });
        if (handler instanceof Type && (typeof handler.complete !== "undefined" || typeof handler.values !== "undefined")) {
            const completeHandler = (cmd, parent)=>handler.complete?.(cmd, parent) || [];
            this.complete(name, completeHandler, options);
        }
        return this;
    }
    globalComplete(name, complete, options) {
        return this.complete(name, complete, {
            ...options,
            global: true
        });
    }
    complete(name, complete, options) {
        if (this.cmd.completions.has(name) && !options?.override) {
            throw new DuplicateCompletionError(name);
        }
        this.cmd.completions.set(name, {
            name,
            complete,
            ...options
        });
        return this;
    }
    throwErrors() {
        this.cmd.throwOnError = true;
        return this;
    }
    error(handler) {
        this.cmd.errorHandler = handler;
        return this;
    }
    getErrorHandler() {
        return this.errorHandler ?? this._parent?.errorHandler;
    }
    noExit() {
        this.cmd._shouldExit = false;
        this.throwErrors();
        return this;
    }
    noGlobals() {
        this.cmd._noGlobals = true;
        return this;
    }
    shouldThrowErrors() {
        return this.throwOnError || !!this._parent?.shouldThrowErrors();
    }
    shouldExit() {
        return this._shouldExit ?? this._parent?.shouldExit() ?? true;
    }
    group(name) {
        this.cmd._groupName = name;
        return this;
    }
    globalOption(flags, desc, opts) {
        if (typeof opts === "function") {
            return this.option(flags, desc, {
                value: opts,
                global: true
            });
        }
        return this.option(flags, desc, {
            ...opts,
            global: true
        });
    }
    option(flags, desc, opts) {
        if (typeof opts === "function") {
            opts = {
                value: opts
            };
        }
        const result = splitArguments(flags);
        const args = result.typeDefinition ? parseArgumentsDefinition(result.typeDefinition) : [];
        const option = {
            ...opts,
            name: "",
            description: desc,
            args,
            flags: result.flags,
            equalsSign: result.equalsSign,
            typeDefinition: result.typeDefinition,
            groupName: this._groupName ?? undefined
        };
        if (option.separator) {
            for (const arg of args){
                if (arg.list) {
                    arg.separator = option.separator;
                }
            }
        }
        for (const part of option.flags){
            const arg = part.trim();
            const isLong = /^--/.test(arg);
            const name = isLong ? arg.slice(2) : arg.slice(1);
            if (this.cmd.getBaseOption(name, true)) {
                if (opts?.override) {
                    this.removeOption(name);
                } else {
                    throw new DuplicateOptionNameError(name, this.getPath());
                }
            }
            if (!option.name && isLong) {
                option.name = name;
            } else if (!option.aliases) {
                option.aliases = [
                    name
                ];
            } else {
                option.aliases.push(name);
            }
        }
        if (option.prepend) {
            this.cmd.options.unshift(option);
        } else {
            this.cmd.options.push(option);
        }
        return this;
    }
    example(name, description) {
        if (this.cmd.hasExample(name)) {
            throw new DuplicateExampleError(name);
        }
        this.cmd.examples.push({
            name,
            description
        });
        return this;
    }
    globalEnv(name, description, options) {
        return this.env(name, description, {
            ...options,
            global: true
        });
    }
    env(name, description, options) {
        const result = splitArguments(name);
        if (!result.typeDefinition) {
            result.typeDefinition = "<value:boolean>";
        }
        if (result.flags.some((envName)=>this.cmd.getBaseEnvVar(envName, true))) {
            throw new DuplicateEnvVarError(name);
        }
        const details = parseArgumentsDefinition(result.typeDefinition);
        if (details.length > 1) {
            throw new TooManyEnvVarValuesError(name);
        } else if (details.length && details[0].optional) {
            throw new UnexpectedOptionalEnvVarValueError(name);
        } else if (details.length && details[0].variadic) {
            throw new UnexpectedVariadicEnvVarValueError(name);
        }
        this.cmd.envVars.push({
            name: result.flags[0],
            names: result.flags,
            description,
            type: details[0].type,
            details: details.shift(),
            ...options
        });
        return this;
    }
    parse(args = Deno.args) {
        const ctx = {
            unknown: args.slice(),
            flags: {},
            env: {},
            literal: [],
            stopEarly: false,
            stopOnUnknown: false,
            defaults: {},
            actions: []
        };
        return this.parseCommand(ctx);
    }
    async parseCommand(ctx) {
        try {
            this.reset();
            this.registerDefaults();
            this.rawArgs = ctx.unknown.slice();
            if (this.isExecutable) {
                await this.executeExecutable(ctx.unknown);
                return {
                    options: {},
                    args: [],
                    cmd: this,
                    literal: []
                };
            } else if (this._useRawArgs) {
                await this.parseEnvVars(ctx, this.envVars);
                return await this.execute(ctx.env, ctx.unknown);
            }
            let preParseGlobals = false;
            let subCommand;
            if (ctx.unknown.length > 0) {
                subCommand = this.getSubCommand(ctx);
                if (!subCommand) {
                    const optionName = ctx.unknown[0].replace(/^-+/, "");
                    const option = this.getOption(optionName, true);
                    if (option?.global) {
                        preParseGlobals = true;
                        await this.parseGlobalOptionsAndEnvVars(ctx);
                    }
                }
            }
            if (subCommand || ctx.unknown.length > 0) {
                subCommand ??= this.getSubCommand(ctx);
                if (subCommand) {
                    subCommand._globalParent = this;
                    return subCommand.parseCommand(ctx);
                }
            }
            await this.parseOptionsAndEnvVars(ctx, preParseGlobals);
            const options = {
                ...ctx.env,
                ...ctx.flags
            };
            const args = this.parseArguments(ctx, options);
            this.literalArgs = ctx.literal;
            if (ctx.actions.length) {
                await Promise.all(ctx.actions.map((action)=>action.call(this, options, ...args)));
            }
            if (ctx.standalone) {
                return {
                    options,
                    args,
                    cmd: this,
                    literal: this.literalArgs
                };
            }
            return await this.execute(options, args);
        } catch (error) {
            this.handleError(error);
        }
    }
    getSubCommand(ctx) {
        const subCommand = this.getCommand(ctx.unknown[0], true);
        if (subCommand) {
            ctx.unknown.shift();
        }
        return subCommand;
    }
    async parseGlobalOptionsAndEnvVars(ctx) {
        const isHelpOption = this.getHelpOption()?.flags.includes(ctx.unknown[0]);
        const envVars = [
            ...this.envVars.filter((envVar)=>envVar.global),
            ...this.getGlobalEnvVars(true)
        ];
        await this.parseEnvVars(ctx, envVars, !isHelpOption);
        const options = [
            ...this.options.filter((option)=>option.global),
            ...this.getGlobalOptions(true)
        ];
        this.parseOptions(ctx, options, {
            stopEarly: true,
            stopOnUnknown: true,
            dotted: false
        });
    }
    async parseOptionsAndEnvVars(ctx, preParseGlobals) {
        const helpOption = this.getHelpOption();
        const isVersionOption = this._versionOption?.flags.includes(ctx.unknown[0]);
        const isHelpOption = helpOption && ctx.flags?.[helpOption.name] === true;
        const envVars = preParseGlobals ? this.envVars.filter((envVar)=>!envVar.global) : this.getEnvVars(true);
        await this.parseEnvVars(ctx, envVars, !isHelpOption && !isVersionOption);
        const options = this.getOptions(true);
        this.parseOptions(ctx, options);
    }
    registerDefaults() {
        if (this.hasDefaults || this.getParent()) {
            return this;
        }
        this.hasDefaults = true;
        this.reset();
        !this.types.has("string") && this.type("string", new StringType(), {
            global: true
        });
        !this.types.has("number") && this.type("number", new NumberType(), {
            global: true
        });
        !this.types.has("integer") && this.type("integer", new IntegerType(), {
            global: true
        });
        !this.types.has("boolean") && this.type("boolean", new BooleanType(), {
            global: true
        });
        !this.types.has("file") && this.type("file", new FileType(), {
            global: true
        });
        if (!this._help) {
            this.help({});
        }
        if (this._versionOptions !== false && (this._versionOptions || this.ver)) {
            this.option(this._versionOptions?.flags || "-V, --version", this._versionOptions?.desc || "Show the version number for this program.", {
                standalone: true,
                prepend: true,
                action: async function() {
                    const __long = this.getRawArgs().includes(`--${this._versionOption?.name}`);
                    if (__long) {
                        await checkVersion(this);
                        this.showLongVersion();
                    } else {
                        this.showVersion();
                    }
                    this.exit();
                },
                ...this._versionOptions?.opts ?? {}
            });
            this._versionOption = this.options[0];
        }
        if (this._helpOptions !== false) {
            this.option(this._helpOptions?.flags || "-h, --help", this._helpOptions?.desc || "Show this help.", {
                standalone: true,
                global: true,
                prepend: true,
                action: async function() {
                    const __long = this.getRawArgs().includes(`--${this.getHelpOption()?.name}`);
                    await checkVersion(this);
                    this.showHelp({
                        long: __long
                    });
                    this.exit();
                },
                ...this._helpOptions?.opts ?? {}
            });
            this._helpOption = this.options[0];
        }
        return this;
    }
    async execute(options, args) {
        if (this.defaultCommand) {
            const cmd = this.getCommand(this.defaultCommand, true);
            if (!cmd) {
                throw new DefaultCommandNotFoundError(this.defaultCommand, this.getCommands());
            }
            cmd._globalParent = this;
            return cmd.execute(options, args);
        }
        await this.executeGlobalAction(options, args);
        if (this.actionHandler) {
            await this.actionHandler(options, ...args);
        }
        return {
            options,
            args,
            cmd: this,
            literal: this.literalArgs
        };
    }
    async executeGlobalAction(options, args) {
        if (!this._noGlobals) {
            await this._parent?.executeGlobalAction(options, args);
        }
        await this.globalActionHandler?.(options, ...args);
    }
    async executeExecutable(args) {
        const command = this.getPath().replace(/\s+/g, "-");
        await Deno.permissions.request({
            name: "run",
            command
        });
        try {
            const cmd = new Deno.Command(command, {
                args
            });
            const output = await cmd.output();
            if (!output.success) {
                Deno.exit(output.code);
            }
        } catch (error) {
            if (error instanceof Deno.errors.NotFound) {
                throw new CommandExecutableNotFoundError(command);
            }
            throw error;
        }
    }
    parseOptions(ctx, options, { stopEarly = this._stopEarly, stopOnUnknown = false, dotted = true } = {}) {
        parseFlags(ctx, {
            stopEarly,
            stopOnUnknown,
            dotted,
            allowEmpty: this._allowEmpty,
            flags: options,
            ignoreDefaults: ctx.env,
            parse: (type)=>this.parseType(type),
            option: (option)=>{
                if (option.action) {
                    ctx.actions.push(option.action);
                }
            }
        });
    }
    parseType(type) {
        const typeSettings = this.getType(type.type);
        if (!typeSettings) {
            throw new UnknownTypeError(type.type, this.getTypes().map((type)=>type.name));
        }
        return typeSettings.handler instanceof Type ? typeSettings.handler.parse(type) : typeSettings.handler(type);
    }
    async parseEnvVars(ctx, envVars, validate = true) {
        for (const envVar of envVars){
            const env = await this.findEnvVar(envVar.names);
            if (env) {
                const parseType = (value)=>{
                    return this.parseType({
                        label: "Environment variable",
                        type: envVar.type,
                        name: env.name,
                        value
                    });
                };
                const propertyName = underscoreToCamelCase(envVar.prefix ? envVar.names[0].replace(new RegExp(`^${envVar.prefix}`), "") : envVar.names[0]);
                if (envVar.details.list) {
                    ctx.env[propertyName] = env.value.split(envVar.details.separator ?? ",").map(parseType);
                } else {
                    ctx.env[propertyName] = parseType(env.value);
                }
                if (envVar.value && typeof ctx.env[propertyName] !== "undefined") {
                    ctx.env[propertyName] = envVar.value(ctx.env[propertyName]);
                }
            } else if (envVar.required && validate) {
                throw new MissingRequiredEnvVarError(envVar);
            }
        }
    }
    async findEnvVar(names) {
        for (const name of names){
            const status = await Deno.permissions.query({
                name: "env",
                variable: name
            });
            if (status.state === "granted") {
                const value = Deno.env.get(name);
                if (value) {
                    return {
                        name,
                        value
                    };
                }
            }
        }
        return undefined;
    }
    parseArguments(ctx, options) {
        const params = [];
        const args = ctx.unknown.slice();
        if (!this.hasArguments()) {
            if (args.length) {
                if (this.hasCommands(true)) {
                    if (this.hasCommand(args[0], true)) {
                        throw new TooManyArgumentsError(args);
                    } else {
                        throw new UnknownCommandError(args[0], this.getCommands());
                    }
                } else {
                    throw new NoArgumentsAllowedError(this.getPath());
                }
            }
        } else {
            if (!args.length) {
                const required = this.getArguments().filter((expectedArg)=>!expectedArg.optional).map((expectedArg)=>expectedArg.name);
                if (required.length) {
                    const optionNames = Object.keys(options);
                    const hasStandaloneOption = !!optionNames.find((name)=>this.getOption(name, true)?.standalone);
                    if (!hasStandaloneOption) {
                        throw new MissingArgumentsError(required);
                    }
                }
            } else {
                for (const expectedArg of this.getArguments()){
                    if (!args.length) {
                        if (expectedArg.optional) {
                            break;
                        }
                        throw new MissingArgumentError(expectedArg.name);
                    }
                    let arg;
                    const parseArgValue = (value)=>{
                        return expectedArg.list ? value.split(",").map((value)=>parseArgType(value)) : parseArgType(value);
                    };
                    const parseArgType = (value)=>{
                        return this.parseType({
                            label: "Argument",
                            type: expectedArg.type,
                            name: expectedArg.name,
                            value
                        });
                    };
                    if (expectedArg.variadic) {
                        arg = args.splice(0, args.length).map((value)=>parseArgValue(value));
                    } else {
                        arg = parseArgValue(args.shift());
                    }
                    if (expectedArg.variadic && Array.isArray(arg)) {
                        params.push(...arg);
                    } else if (typeof arg !== "undefined") {
                        params.push(arg);
                    }
                }
                if (args.length) {
                    throw new TooManyArgumentsError(args);
                }
            }
        }
        return params;
    }
    handleError(error) {
        this.throw(error instanceof ValidationError ? new ValidationError1(error.message) : error instanceof Error ? error : new Error(`[non-error-thrown] ${error}`));
    }
    throw(error) {
        if (error instanceof ValidationError1) {
            error.cmd = this;
        }
        this.getErrorHandler()?.(error, this);
        if (this.shouldThrowErrors() || !(error instanceof ValidationError1)) {
            throw error;
        }
        this.showHelp();
        console.error(red(`  ${bold("error")}: ${error.message}\n`));
        Deno.exit(error instanceof ValidationError1 ? error.exitCode : 1);
    }
    getName() {
        return this._name;
    }
    getParent() {
        return this._parent;
    }
    getGlobalParent() {
        return this._globalParent;
    }
    getMainCommand() {
        return this._parent?.getMainCommand() ?? this;
    }
    getAliases() {
        return this.aliases;
    }
    getPath(name) {
        return this._parent ? this._parent.getPath(name) + " " + this._name : name || this._name;
    }
    getArgsDefinition() {
        return this.argsDefinition;
    }
    getArgument(name) {
        return this.getArguments().find((arg)=>arg.name === name);
    }
    getArguments() {
        if (!this.args.length && this.argsDefinition) {
            this.args = parseArgumentsDefinition(this.argsDefinition);
        }
        return this.args;
    }
    hasArguments() {
        return !!this.argsDefinition;
    }
    getVersion() {
        return this.getVersionHandler()?.call(this, this);
    }
    getVersionHandler() {
        return this.ver ?? this._parent?.getVersionHandler();
    }
    getDescription() {
        return typeof this.desc === "function" ? this.desc = this.desc() : this.desc;
    }
    getUsage() {
        return this._usage ?? [
            this.getArgsDefinition(),
            this.getRequiredOptionsDefinition()
        ].join(" ").trim();
    }
    getRequiredOptionsDefinition() {
        return this.getOptions().filter((option)=>option.required).map((option)=>[
                findFlag(option.flags),
                option.typeDefinition
            ].filter((v)=>v).join(" ").trim()).join(" ");
    }
    getShortDescription() {
        return getDescription(this.getDescription(), true);
    }
    getRawArgs() {
        return this.rawArgs;
    }
    getLiteralArgs() {
        return this.literalArgs;
    }
    showVersion() {
        console.log(this.getVersion());
    }
    getLongVersion() {
        return `${bold(this.getMainCommand().getName())} ${brightBlue(this.getVersion() ?? "")}` + Object.entries(this.getMeta()).map(([k, v])=>`\n${bold(k)} ${brightBlue(v)}`).join("");
    }
    showLongVersion() {
        console.log(this.getLongVersion());
    }
    showHelp(options) {
        console.log(this.getHelp(options));
    }
    getHelp(options) {
        this.registerDefaults();
        return this.getHelpHandler().call(this, this, options ?? {});
    }
    getHelpHandler() {
        return this._help ?? this._parent?.getHelpHandler();
    }
    exit(code = 0) {
        if (this.shouldExit()) {
            Deno.exit(code);
        }
    }
    hasOptions(hidden) {
        return this.getOptions(hidden).length > 0;
    }
    getOptions(hidden) {
        return this.getGlobalOptions(hidden).concat(this.getBaseOptions(hidden));
    }
    getBaseOptions(hidden) {
        if (!this.options.length) {
            return [];
        }
        return hidden ? this.options.slice(0) : this.options.filter((opt)=>!opt.hidden);
    }
    getGlobalOptions(hidden) {
        const helpOption = this.getHelpOption();
        const getGlobals = (cmd, noGlobals, options = [], names = [])=>{
            if (cmd.options.length) {
                for (const option of cmd.options){
                    if (option.global && !this.options.find((opt)=>opt.name === option.name) && names.indexOf(option.name) === -1 && (hidden || !option.hidden)) {
                        if (noGlobals && option !== helpOption) {
                            continue;
                        }
                        names.push(option.name);
                        options.push(option);
                    }
                }
            }
            return cmd._parent ? getGlobals(cmd._parent, noGlobals || cmd._noGlobals, options, names) : options;
        };
        return this._parent ? getGlobals(this._parent, this._noGlobals) : [];
    }
    hasOption(name, hidden) {
        return !!this.getOption(name, hidden);
    }
    getOption(name, hidden) {
        return this.getBaseOption(name, hidden) ?? this.getGlobalOption(name, hidden);
    }
    getBaseOption(name, hidden) {
        const option = this.options.find((option)=>option.name === name || option.aliases?.includes(name));
        return option && (hidden || !option.hidden) ? option : undefined;
    }
    getGlobalOption(name, hidden) {
        const helpOption = this.getHelpOption();
        const getGlobalOption = (parent, noGlobals)=>{
            const option = parent.getBaseOption(name, hidden);
            if (!option?.global) {
                return parent._parent && getGlobalOption(parent._parent, noGlobals || parent._noGlobals);
            }
            if (noGlobals && option !== helpOption) {
                return;
            }
            return option;
        };
        return this._parent && getGlobalOption(this._parent, this._noGlobals);
    }
    removeOption(name) {
        const index = this.options.findIndex((option)=>option.name === name);
        if (index === -1) {
            return;
        }
        return this.options.splice(index, 1)[0];
    }
    hasCommands(hidden) {
        return this.getCommands(hidden).length > 0;
    }
    getCommands(hidden) {
        return this.getGlobalCommands(hidden).concat(this.getBaseCommands(hidden));
    }
    getBaseCommands(hidden) {
        const commands = Array.from(this.commands.values());
        return hidden ? commands : commands.filter((cmd)=>!cmd.isHidden);
    }
    getGlobalCommands(hidden) {
        const getCommands = (command, noGlobals, commands = [], names = [])=>{
            if (command.commands.size) {
                for (const [_, cmd] of command.commands){
                    if (cmd.isGlobal && this !== cmd && !this.commands.has(cmd._name) && names.indexOf(cmd._name) === -1 && (hidden || !cmd.isHidden)) {
                        if (noGlobals && cmd?.getName() !== "help") {
                            continue;
                        }
                        names.push(cmd._name);
                        commands.push(cmd);
                    }
                }
            }
            return command._parent ? getCommands(command._parent, noGlobals || command._noGlobals, commands, names) : commands;
        };
        return this._parent ? getCommands(this._parent, this._noGlobals) : [];
    }
    hasCommand(name, hidden) {
        return !!this.getCommand(name, hidden);
    }
    getCommand(name, hidden) {
        return this.getBaseCommand(name, hidden) ?? this.getGlobalCommand(name, hidden);
    }
    getBaseCommand(name, hidden) {
        for (const cmd of this.commands.values()){
            if (cmd._name === name || cmd.aliases.includes(name)) {
                return cmd && (hidden || !cmd.isHidden) ? cmd : undefined;
            }
        }
    }
    getGlobalCommand(name, hidden) {
        const getGlobalCommand = (parent, noGlobals)=>{
            const cmd = parent.getBaseCommand(name, hidden);
            if (!cmd?.isGlobal) {
                return parent._parent && getGlobalCommand(parent._parent, noGlobals || parent._noGlobals);
            }
            if (noGlobals && cmd.getName() !== "help") {
                return;
            }
            return cmd;
        };
        return this._parent && getGlobalCommand(this._parent, this._noGlobals);
    }
    removeCommand(name) {
        const command = this.getBaseCommand(name, true);
        if (command) {
            this.commands.delete(command._name);
        }
        return command;
    }
    getTypes() {
        return this.getGlobalTypes().concat(this.getBaseTypes());
    }
    getBaseTypes() {
        return Array.from(this.types.values());
    }
    getGlobalTypes() {
        const getTypes = (cmd, types = [], names = [])=>{
            if (cmd) {
                if (cmd.types.size) {
                    cmd.types.forEach((type)=>{
                        if (type.global && !this.types.has(type.name) && names.indexOf(type.name) === -1) {
                            names.push(type.name);
                            types.push(type);
                        }
                    });
                }
                return getTypes(cmd._parent, types, names);
            }
            return types;
        };
        return getTypes(this._parent);
    }
    getType(name) {
        return this.getBaseType(name) ?? this.getGlobalType(name);
    }
    getBaseType(name) {
        return this.types.get(name);
    }
    getGlobalType(name) {
        if (!this._parent) {
            return;
        }
        const cmd = this._parent.getBaseType(name);
        if (!cmd?.global) {
            return this._parent.getGlobalType(name);
        }
        return cmd;
    }
    getCompletions() {
        return this.getGlobalCompletions().concat(this.getBaseCompletions());
    }
    getBaseCompletions() {
        return Array.from(this.completions.values());
    }
    getGlobalCompletions() {
        const getCompletions = (cmd, completions = [], names = [])=>{
            if (cmd) {
                if (cmd.completions.size) {
                    cmd.completions.forEach((completion)=>{
                        if (completion.global && !this.completions.has(completion.name) && names.indexOf(completion.name) === -1) {
                            names.push(completion.name);
                            completions.push(completion);
                        }
                    });
                }
                return getCompletions(cmd._parent, completions, names);
            }
            return completions;
        };
        return getCompletions(this._parent);
    }
    getCompletion(name) {
        return this.getBaseCompletion(name) ?? this.getGlobalCompletion(name);
    }
    getBaseCompletion(name) {
        return this.completions.get(name);
    }
    getGlobalCompletion(name) {
        if (!this._parent) {
            return;
        }
        const completion = this._parent.getBaseCompletion(name);
        if (!completion?.global) {
            return this._parent.getGlobalCompletion(name);
        }
        return completion;
    }
    hasEnvVars(hidden) {
        return this.getEnvVars(hidden).length > 0;
    }
    getEnvVars(hidden) {
        return this.getGlobalEnvVars(hidden).concat(this.getBaseEnvVars(hidden));
    }
    getBaseEnvVars(hidden) {
        if (!this.envVars.length) {
            return [];
        }
        return hidden ? this.envVars.slice(0) : this.envVars.filter((env)=>!env.hidden);
    }
    getGlobalEnvVars(hidden) {
        if (this._noGlobals) {
            return [];
        }
        const getEnvVars = (cmd, envVars = [], names = [])=>{
            if (cmd) {
                if (cmd.envVars.length) {
                    cmd.envVars.forEach((envVar)=>{
                        if (envVar.global && !this.envVars.find((env)=>env.names[0] === envVar.names[0]) && names.indexOf(envVar.names[0]) === -1 && (hidden || !envVar.hidden)) {
                            names.push(envVar.names[0]);
                            envVars.push(envVar);
                        }
                    });
                }
                return getEnvVars(cmd._parent, envVars, names);
            }
            return envVars;
        };
        return getEnvVars(this._parent);
    }
    hasEnvVar(name, hidden) {
        return !!this.getEnvVar(name, hidden);
    }
    getEnvVar(name, hidden) {
        return this.getBaseEnvVar(name, hidden) ?? this.getGlobalEnvVar(name, hidden);
    }
    getBaseEnvVar(name, hidden) {
        const envVar = this.envVars.find((env)=>env.names.indexOf(name) !== -1);
        return envVar && (hidden || !envVar.hidden) ? envVar : undefined;
    }
    getGlobalEnvVar(name, hidden) {
        if (!this._parent || this._noGlobals) {
            return;
        }
        const envVar = this._parent.getBaseEnvVar(name, hidden);
        if (!envVar?.global) {
            return this._parent.getGlobalEnvVar(name, hidden);
        }
        return envVar;
    }
    hasExamples() {
        return this.examples.length > 0;
    }
    getExamples() {
        return this.examples;
    }
    hasExample(name) {
        return !!this.getExample(name);
    }
    getExample(name) {
        return this.examples.find((example)=>example.name === name);
    }
    getHelpOption() {
        return this._helpOption ?? this._parent?.getHelpOption();
    }
}
async function checkVersion(cmd) {
    const mainCommand = cmd.getMainCommand();
    const upgradeCommand = mainCommand.getCommand("upgrade");
    if (!isUpgradeCommand(upgradeCommand)) {
        return;
    }
    const latestVersion = await upgradeCommand.getLatestVersion();
    const currentVersion = mainCommand.getVersion();
    if (currentVersion === latestVersion) {
        return;
    }
    const versionHelpText = `(New version available: ${latestVersion}. Run '${mainCommand.getName()} upgrade' to upgrade to the latest version!)`;
    mainCommand.version(`${currentVersion}  ${bold(yellow(versionHelpText))}`);
}
function findFlag(flags) {
    for (const flag of flags){
        if (flag.startsWith("--")) {
            return flag;
        }
    }
    return flags[0];
}
function isUpgradeCommand(command) {
    return command instanceof Command && "getLatestVersion" in command;
}
async function getBadge(name, pkg, type) {
    return await fetch(`https://badgen.net/https/nikechukwu.npkn.net/jsr-endpoint/${name}/${pkg}/${type}?icon=https://jsr.io/logo.svg`).then((response)=>{
        return response.text();
    }).then((data)=>{
        console.log(data);
    });
}
function getBadgeMd(name, pkg, type) {
    return `![Custom Badge](https://badgen.net/https/nikechukwu.npkn.net/jsr-endpoint/${name}/${pkg}/${type}?icon=https://jsr.io/logo.svg)`;
}
function splitPkg(pkgname) {
    const items = pkgname.split("/");
    return {
        scope: items[0].replace("@", ""),
        name: items[1]
    };
}
new Command().name("jsr-badges").description("Generate your JSR Badges!").version("v1.0.0").arguments("<output-type> <jsr-package-name> <badge-type>").help(`
  <output-type>: markdown (md) | svg (svg)
  <jsr-package-name>: the jsr package to use in it's normal format: "@scope/name"
  <badge-type>: Supported badges are: version (version), publisher (pub), and package name (name)
  `).parse(Deno.args).then((res)=>{
    const { args: output } = res;
    const { scope: scope, name: name } = splitPkg(output[1]);
    if (output[0] == "markdown" || output[0] == "md") {
        if (output[2] == "pub") output[2] = "publisher";
        console.log(getBadgeMd(scope, name, output[2]));
    } else if (output[0] == "svg") {
        if (output[2] == "pub") output[2] = "publisher";
        console.log(getBadge(scope, name, output[2]));
    } else {
        console.error("output type can only be markdown or svg.");
    }
});
