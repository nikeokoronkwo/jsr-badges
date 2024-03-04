/**
 * Get the width of a string's constituent characters in columns in TTY-like
 * environments.
 *
 * Combine with `stripColor` from `fmt/colors.ts` to get the expected physical
 * width of a string in the console.
 *
 * @example
 * ```ts
 * import { unicodeWidth } from "https://deno.land/std@$STD_VERSION/console/unicode_width.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/assert/assert_equals.ts";
 * import { stripColor } from "https://deno.land/std@$STD_VERSION/fmt/colors.ts";
 *
 * assertEquals(unicodeWidth("hello world"), 11);
 * assertEquals(unicodeWidth("天地玄黃宇宙洪荒"), 16);
 * assertEquals(unicodeWidth("ｆｕｌｌｗｉｄｔｈ"), 18);
 * assertEquals(unicodeWidth(stripColor("\x1b[36mголубой\x1b[39m")), 7);
 * assertEquals(unicodeWidth(stripColor("\x1b[31m紅色\x1b[39m")), 4);
 * assertEquals(unicodeWidth(stripColor("\x1B]8;;https://deno.land\x07🦕\x1B]8;;\x07")), 2);
 * ```
 */
export declare function unicodeWidth(str: string): number;
