/**
 * Consumes the maximum amount of words from a string which is not longer than
 * given length. This function returns at least one word.
 *
 * ```ts
 * import { consumeWords } from "./mod.ts";
 *
 * const str = consumeWords(9, "This is an example."); // returns: "This is"
 * ```
 *
 * @param length  The maximum length of the returned string.
 * @param content The content from which the string should be consumed.
 */
export declare function consumeWords(length: number, content: string): string;
