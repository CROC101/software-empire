export type NumberBase = 2 | 8 | 10 | 16;

const DIGITS = "0123456789ABCDEF";
const MAX_INPUT_DIGITS = 64;
const MAX_FRACTION_DIGITS = 20;

type DivisionStep = {
  value: bigint;
  quotient: bigint;
  remainder: number;
  remainderDigit: string;
};

type MultiplicationStep = {
  remainder: bigint;
  product: bigint;
  digit: number;
  digitSymbol: string;
  nextRemainder: bigint;
};

export type BaseConversion = {
  input: string;
  sourceBase: NumberBase;
  targetBase: NumberBase;
  output: string;
  decimalValue: string;
  decimalFractionTruncated: boolean;
  isNegative: boolean;
  sourceTerms: string[];
  exactNumerator: bigint;
  exactDenominator: bigint;
  integerDivisionSteps: DivisionStep[];
  fractionMultiplicationSteps: MultiplicationStep[];
  fractionTruncated: boolean;
};

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = left;
  let b = right;
  while (b !== BigInt(0)) [a, b] = [b, a % b];
  return a;
}

function basePrefix(base: NumberBase): string {
  if (base === 2) return "0b";
  if (base === 8) return "0o";
  if (base === 16) return "0x";
  return "";
}

function parseNumber(input: string, base: NumberBase) {
  let value = input.trim();
  if (!value) throw new Error("กรอกตัวเลขที่ต้องการแปลงก่อน");

  let isNegative = false;
  if (value.startsWith("-") || value.startsWith("+")) {
    isNegative = value.startsWith("-");
    value = value.slice(1);
  }

  const prefix = basePrefix(base);
  if (prefix && value.toLowerCase().startsWith(prefix)) value = value.slice(prefix.length);
  if (!value || value === ".") throw new Error("กรอกตัวเลขให้ครบ");
  if ((value.match(/\./g) ?? []).length > 1) throw new Error("ใส่จุดทศนิยมได้เพียงหนึ่งจุด");

  const [wholePart = "", fractionPart = ""] = value.split(".");
  if (!wholePart && !fractionPart) throw new Error("กรอกตัวเลขให้ครบ");
  if (`${wholePart}${fractionPart}`.length > MAX_INPUT_DIGITS) {
    throw new Error(`รองรับตัวเลขไม่เกิน ${MAX_INPUT_DIGITS} หลัก`);
  }

  const allDigits = `${wholePart}${fractionPart}`;
  for (const character of allDigits) {
    const digit = DIGITS.indexOf(character.toUpperCase());
    if (digit < 0 || digit >= base) {
      throw new Error(`เลข “${character}” ใช้ไม่ได้ในฐาน ${base}`);
    }
  }

  const parseDigits = (digits: string) => {
    let result = BigInt(0);
    for (const character of digits) {
      result = result * BigInt(base) + BigInt(DIGITS.indexOf(character.toUpperCase()));
    }
    return result;
  };

  const denominator = BigInt(base) ** BigInt(fractionPart.length);
  let numerator = parseDigits(wholePart || "0") * denominator + parseDigits(fractionPart);
  if (isNegative) numerator = -numerator;
  const divisor = greatestCommonDivisor(
    numerator < BigInt(0) ? -numerator : numerator,
    denominator,
  );

  const wholeTerms = wholePart.split("").map((character, index) => {
    const exponent = wholePart.length - index - 1;
    return `${character.toUpperCase()} × ${base}${exponent === 1 ? "" : `^${exponent}`}`;
  });
  const fractionTerms = fractionPart.split("").map((character, index) => {
    return `${character.toUpperCase()} × ${base}^-${index + 1}`;
  });

  return {
    isNegative: numerator < BigInt(0),
    numerator: numerator / divisor,
    denominator: denominator / divisor,
    sourceTerms: [...wholeTerms, ...fractionTerms],
  };
}

function convertMagnitude(numerator: bigint, denominator: bigint, base: NumberBase) {
  const baseValue = BigInt(base);
  const integerPart = numerator / denominator;
  let value = integerPart;
  const integerDivisionSteps: DivisionStep[] = [];

  while (value > BigInt(0)) {
    const quotient = value / baseValue;
    const remainder = Number(value % baseValue);
    integerDivisionSteps.push({ value, quotient, remainder, remainderDigit: DIGITS[remainder] });
    value = quotient;
  }

  const integerDigits = integerDivisionSteps.length
    ? integerDivisionSteps
        .map((step) => DIGITS[step.remainder])
        .reverse()
        .join("")
    : "0";

  let remainder = numerator % denominator;
  let fractionDigits = "";
  const fractionMultiplicationSteps: MultiplicationStep[] = [];
  while (remainder !== BigInt(0) && fractionMultiplicationSteps.length < MAX_FRACTION_DIGITS) {
    const product = remainder * baseValue;
    const digit = Number(product / denominator);
    const nextRemainder = product % denominator;
    fractionMultiplicationSteps.push({
      remainder,
      product,
      digit,
      digitSymbol: DIGITS[digit],
      nextRemainder,
    });
    fractionDigits += DIGITS[digit];
    remainder = nextRemainder;
  }

  return {
    integerDigits,
    fractionDigits,
    fractionTruncated: remainder !== BigInt(0),
    integerDivisionSteps,
    fractionMultiplicationSteps,
  };
}

export function convertNumberBase(
  input: string,
  sourceBase: NumberBase,
  targetBase: NumberBase,
): BaseConversion {
  const parsed = parseNumber(input, sourceBase);
  const magnitude = parsed.numerator < BigInt(0) ? -parsed.numerator : parsed.numerator;
  const decimal = convertMagnitude(magnitude, parsed.denominator, 10);
  const target = convertMagnitude(magnitude, parsed.denominator, targetBase);
  const isNegative = parsed.isNegative && magnitude !== BigInt(0);
  const sign = isNegative ? "−" : "";

  return {
    input: input.trim(),
    sourceBase,
    targetBase,
    output: `${sign}${target.integerDigits}${target.fractionDigits ? `.${target.fractionDigits}` : ""}${target.fractionTruncated ? "…" : ""}`,
    decimalValue: `${sign}${decimal.integerDigits}${decimal.fractionDigits ? `.${decimal.fractionDigits}` : ""}`,
    decimalFractionTruncated: decimal.fractionTruncated,
    isNegative,
    sourceTerms: parsed.sourceTerms,
    exactNumerator: magnitude,
    exactDenominator: parsed.denominator,
    integerDivisionSteps: target.integerDivisionSteps,
    fractionMultiplicationSteps: target.fractionMultiplicationSteps,
    fractionTruncated: target.fractionTruncated,
  };
}

export function fractionAsDecimal(numerator: bigint, denominator: bigint): string {
  if (numerator === BigInt(0)) return "0";
  return denominator === BigInt(1)
    ? numerator.toString()
    : `${numerator.toString()} / ${denominator.toString()}`;
}
