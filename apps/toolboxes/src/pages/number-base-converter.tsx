import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowLeftRight, Binary, Calculator, RotateCcw } from "lucide-react";
import {
  convertNumberBase,
  fractionAsDecimal,
  type BaseConversion,
  type NumberBase,
} from "@/lib/number-base-converter";

const BASES: NumberBase[] = [2, 8, 10, 16];
const EXAMPLE = { value: "1101", source: 2 as NumberBase, target: 10 as NumberBase };

function ArithmeticSteps({ result }: { result: BaseConversion }) {
  const expression = result.sourceTerms.length ? result.sourceTerms.join(" + ") : "0";
  const signedNumerator = result.isNegative
    ? `−${result.exactNumerator}`
    : result.exactNumerator.toString();

  return (
    <section className="mt-6" aria-labelledby="steps-title" aria-live="polite">
      <h2 id="steps-title" className="text-xl font-semibold">
        วิธีทำทีละขั้น
      </h2>
      <ol className="mt-3 grid min-w-0 list-none gap-3 p-0">
        <li className="min-w-0 rounded-lg border border-surface-variant bg-surface-container p-4 sm:p-5">
          <h3 className="font-semibold">ขั้นที่ 1: กระจายค่าตามหลักในฐานต้นทาง</h3>
          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
            คูณเลขแต่ละหลักด้วยฐานต้นทางยกกำลังตำแหน่ง โดยหลักขวาสุดของจำนวนเต็มเริ่มจากเลขชี้กำลัง
            0 และหลักหลังจุดทศนิยมใช้เลขชี้กำลัง −1, −2, …
          </p>
          <p
            className="mt-3 break-words font-mono text-sm leading-relaxed"
            aria-label="นิพจน์กระจายค่าตามหลัก"
          >
            {result.isNegative && "−("}
            {expression}
            {result.isNegative && ")"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            ค่าที่แน่นอน ={" "}
            <span className="font-mono text-on-surface">
              {signedNumerator} / {result.exactDenominator}
            </span>
          </p>
        </li>

        <li className="min-w-0 rounded-lg border border-surface-variant bg-surface-container p-4 sm:p-5">
          <h3 className="font-semibold">ขั้นที่ 2: เขียนค่าในฐานสิบ</h3>
          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
            ฐานสิบที่ใช้เป็นค่ากลางในการตรวจสอบ:{" "}
            <span className="font-mono text-on-surface">
              {result.decimalValue}
              {result.decimalFractionTruncated ? "…" : ""}
            </span>
            {result.decimalFractionTruncated ? " (แสดงทศนิยม 20 หลักแรก)" : ""}
          </p>
        </li>

        <li className="min-w-0 rounded-lg border border-surface-variant bg-surface-container p-4 sm:p-5">
          <h3 className="font-semibold">ขั้นที่ 3: แปลงส่วนจำนวนเต็มด้วยการหารซ้ำ</h3>
          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
            นำส่วนจำนวนเต็มหารด้วยฐานปลายทาง เก็บเศษแต่ละครั้ง แล้วอ่านเศษจากล่างขึ้นบน
          </p>
          {result.integerDivisionSteps.length ? (
            <div className="mt-3 min-w-0 overflow-x-auto">
              <table className="w-full min-w-80 border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-variant text-on-surface-variant">
                    <th scope="col" className="p-2 font-medium">
                      จำนวนที่หาร
                    </th>
                    <th scope="col" className="p-2 font-medium">
                      ผลหาร
                    </th>
                    <th scope="col" className="p-2 font-medium">
                      เศษ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.integerDivisionSteps.map((step, index) => (
                    <tr
                      key={`${step.value}-${index}`}
                      className="border-b border-surface-variant last:border-0"
                    >
                      <td className="p-2 font-mono">
                        {step.value} ÷ {result.targetBase}
                      </td>
                      <td className="p-2 font-mono">{step.quotient}</td>
                      <td className="p-2 font-mono">{step.remainderDigit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              ส่วนจำนวนเต็มเป็น 0 จึงเขียนเป็น 0 ในทุกฐาน
            </p>
          )}
          {result.isNegative && (
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              ค่าตั้งต้นเป็นลบ จึงใส่เครื่องหมาย − ไว้หน้าคำตอบ
            </p>
          )}
        </li>

        {result.fractionMultiplicationSteps.length > 0 && (
          <li className="min-w-0 rounded-lg border border-surface-variant bg-surface-container p-4 sm:p-5">
            <h3 className="font-semibold">ขั้นที่ 4: แปลงเศษส่วนด้วยการคูณซ้ำ</h3>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
              คูณเศษส่วนที่เหลือด้วยฐานปลายทาง เลขจำนวนเต็มที่ได้คือเลขถัดไปหลังจุดทศนิยม
              แล้วทำซ้ำกับเศษส่วนใหม่
            </p>
            <div className="mt-3 min-w-0 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-variant text-on-surface-variant">
                    <th scope="col" className="p-2 font-medium">
                      เศษส่วนก่อนคูณ
                    </th>
                    <th scope="col" className="p-2 font-medium">
                      คูณฐาน
                    </th>
                    <th scope="col" className="p-2 font-medium">
                      เลขถัดไป
                    </th>
                    <th scope="col" className="p-2 font-medium">
                      เศษส่วนที่เหลือ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.fractionMultiplicationSteps.map((step, index) => (
                    <tr
                      key={`${step.remainder}-${index}`}
                      className="border-b border-surface-variant last:border-0"
                    >
                      <td className="p-2 font-mono">
                        {fractionAsDecimal(step.remainder, result.exactDenominator)}
                      </td>
                      <td className="p-2 font-mono">× {result.targetBase}</td>
                      <td className="p-2 font-mono">{step.digitSymbol}</td>
                      <td className="p-2 font-mono">
                        {fractionAsDecimal(step.nextRemainder, result.exactDenominator)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.fractionTruncated && (
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                เศษส่วนนี้มีเลขต่อเนื่องเกิน 20 หลัก จึงแสดง 20 หลักแรกและใส่ … ไว้ท้ายคำตอบ
              </p>
            )}
          </li>
        )}
      </ol>
    </section>
  );
}

export default function NumberBaseConverterPage() {
  const [value, setValue] = useState("");
  const [sourceBase, setSourceBase] = useState<NumberBase>(2);
  const [targetBase, setTargetBase] = useState<NumberBase>(10);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BaseConversion | null>(null);

  const calculate = (nextValue = value, nextSource = sourceBase, nextTarget = targetBase) => {
    setError("");
    try {
      setResult(convertNumberBase(nextValue, nextSource, nextTarget));
    } catch (cause) {
      setResult(null);
      setError(
        cause instanceof Error
          ? cause.message
          : "แปลงตัวเลขไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองอีกครั้ง",
      );
    }
  };

  const updateValue = (nextValue: string) => {
    setValue(nextValue);
    setResult(null);
    setError("");
  };

  const swapBases = () => {
    setSourceBase(targetBase);
    setTargetBase(sourceBase);
    setResult(null);
    setError("");
  };

  const clear = () => {
    setValue("");
    setError("");
    setResult(null);
  };

  const useExample = () => {
    setValue(EXAMPLE.value);
    setSourceBase(EXAMPLE.source);
    setTargetBase(EXAMPLE.target);
    calculate(EXAMPLE.value, EXAMPLE.source, EXAMPLE.target);
  };

  return (
    <main className="min-h-screen bg-surface px-4 py-6 text-on-surface sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm text-on-surface-variant hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          กลับไปหน้ารวมเครื่องมือ
        </Link>

        <header className="mt-4 rounded-lg border border-surface-variant bg-surface-container p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface text-primary-container">
              <Binary size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm leading-relaxed text-primary-container">
                Digital · Computer Architecture · Discrete Math
              </p>
              <h1 className="text-2xl font-bold">แปลงเลขฐานพร้อมวิธีทำ</h1>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                แปลงเลขฐาน 2, 8, 10 และ 16 พร้อมดูการกระจายค่าตามหลัก การหารซ้ำ และการคูณเศษส่วน
              </p>
            </div>
          </div>
        </header>

        <section
          className="mt-5 rounded-lg border border-surface-variant bg-surface-container p-4 sm:p-6"
          aria-labelledby="converter-title"
        >
          <h2 id="converter-title" className="text-lg font-semibold">
            กำหนดตัวเลขและฐาน
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
            <div>
              <label htmlFor="base-number" className="mb-1 block text-sm font-medium">
                ตัวเลขที่ต้องการแปลง
              </label>
              <input
                id="base-number"
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                value={value}
                onChange={(event) => updateValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") calculate();
                }}
                placeholder="เช่น 1101, 17 หรือ A.F"
                aria-describedby="number-help"
                aria-invalid={Boolean(error)}
                className="min-h-11 w-full rounded-md border border-surface-variant bg-surface-container px-3 font-mono text-base leading-relaxed outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
              />
              <p id="number-help" className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                รองรับจำนวนเต็ม เศษส่วน และค่าติดลบ · ใส่จุดทศนิยมด้วย . · สูงสุด 64 หลัก
              </p>
            </div>

            <div>
              <label htmlFor="source-base" className="mb-1 block text-sm font-medium">
                จากฐาน
              </label>
              <select
                id="source-base"
                value={sourceBase}
                onChange={(event) => {
                  setSourceBase(Number(event.target.value) as NumberBase);
                  setResult(null);
                  setError("");
                }}
                className="min-h-11 w-full rounded-md border border-surface-variant bg-surface-container px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
              >
                {BASES.map((base) => (
                  <option key={base} value={base}>
                    {base} —{" "}
                    {base === 2
                      ? "Binary"
                      : base === 8
                        ? "Octal"
                        : base === 10
                          ? "Decimal"
                          : "Hexadecimal"}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={swapBases}
              aria-label="สลับฐานต้นทางและฐานปลายทาง"
              title="สลับฐาน"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-surface-variant bg-surface-container px-3 text-sm hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
            >
              <ArrowLeftRight size={17} aria-hidden="true" />
              <span className="sm:hidden">สลับฐาน</span>
            </button>

            <div>
              <label htmlFor="target-base" className="mb-1 block text-sm font-medium">
                เป็นฐาน
              </label>
              <select
                id="target-base"
                value={targetBase}
                onChange={(event) => {
                  setTargetBase(Number(event.target.value) as NumberBase);
                  setResult(null);
                  setError("");
                }}
                className="min-h-11 w-full rounded-md border border-surface-variant bg-surface-container px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
              >
                {BASES.map((base) => (
                  <option key={base} value={base}>
                    {base} —{" "}
                    {base === 2
                      ? "Binary"
                      : base === 8
                        ? "Octal"
                        : base === 10
                          ? "Decimal"
                          : "Hexadecimal"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-md bg-error-container px-4 py-3 text-sm leading-relaxed text-on-error-container"
            >
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => calculate()}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary-container px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
            >
              <Calculator size={17} aria-hidden="true" />
              แปลงเลข
            </button>
            <button
              type="button"
              onClick={clear}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-surface-variant bg-surface-container px-4 text-sm hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
            >
              <RotateCcw size={16} aria-hidden="true" />
              ล้างข้อมูล
            </button>
            <button
              type="button"
              onClick={useExample}
              className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-primary-container underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
            >
              ลองตัวอย่าง 1101₂ → ฐานสิบ
            </button>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
            ทำงานในเบราว์เซอร์ ไม่ส่งตัวเลขที่กรอกไปยัง backend · รองรับเลขฐาน 2, 8, 10 และ 16
          </p>
        </section>

        {result ? (
          <>
            <section
              className="mt-5 rounded-lg border border-surface-variant bg-surface-container p-4 sm:p-6"
              aria-labelledby="answer-title"
              aria-live="polite"
            >
              <h2 id="answer-title" className="text-sm font-medium text-on-surface-variant">
                คำตอบ
              </h2>
              <p
                className="mt-1 break-words font-mono text-3xl font-bold leading-tight text-primary-container"
                aria-label={`คำตอบ ${result.output} ฐาน ${result.targetBase}`}
              >
                {result.output}
                <span className="ml-2 font-sans text-base font-medium text-on-surface-variant">
                  ฐาน {result.targetBase}
                </span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                {result.input} ฐาน {result.sourceBase} = {result.decimalValue}
                {result.decimalFractionTruncated ? "…" : ""} ฐานสิบ = {result.output} ฐาน{" "}
                {result.targetBase}
              </p>
            </section>
            <ArithmeticSteps result={result} />
          </>
        ) : (
          <section
            className="mt-5 rounded-lg border border-dashed border-surface-variant bg-surface-container px-4 py-8 text-center"
            aria-live="polite"
          >
            <Calculator size={24} className="mx-auto text-on-surface-variant" aria-hidden="true" />
            <h2 className="mt-2 font-semibold">พร้อมแปลงเลขฐาน</h2>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
              กรอกตัวเลข เลือกฐานต้นทางและฐานปลายทาง แล้วกด “แปลงเลข” เพื่อดูคำตอบและวิธีทำ
            </p>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              ตัวอย่าง: 1101 ฐาน 2 มีค่าเท่ากับ 13 ฐาน 10
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
