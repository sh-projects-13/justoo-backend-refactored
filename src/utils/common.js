export function toStringOrUndefined(value) {
    if (value === undefined || value === null) return undefined;
    const str = String(value).trim();
    return str.length ? str : undefined;
}

export function toTrimmedString(value) {
    return String(value ?? "").trim();
}

export function toIntOrUndefined(value) {
    if (value === undefined || value === null || value === "") return undefined;
    const n = Number.parseInt(String(value), 10);
    if (Number.isNaN(n)) return undefined;
    return n;
}

export function toNumericStringOrUndefined(value) {
    if (value === undefined || value === null || value === "") return undefined;
    const str = String(value).trim();
    if (!str) return undefined;
    const n = Number(str);
    if (Number.isNaN(n)) return undefined;
    return str;
}

export function toBooleanOrUndefined(value) {
    if (value === undefined || value === null || value === "") return undefined;
    if (typeof value === "boolean") return value;
    const s = String(value).trim().toLowerCase();
    if (["true", "1", "yes"].includes(s)) return true;
    if (["false", "0", "no"].includes(s)) return false;
    return undefined;
}

export function isPgUniqueViolation(err) {
    return Boolean(err && typeof err === "object" && err.code === "23505");
}
