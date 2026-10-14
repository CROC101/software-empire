import type { z } from "zod";

export { expose, wrap, type Remote } from "comlink";

/**
 * Wrap a Worker method so its input is parsed inside the Worker.
 * Data from the main thread is untrusted, even on the same origin.
 *
 *   expose({ format: validated(z.string(), (text) => format(text)) });
 */
export function validated<S extends z.ZodType, R>(
  schema: S,
  handler: (input: z.output<S>) => R,
): (input: unknown) => R {
  return (input) => handler(schema.parse(input));
}
