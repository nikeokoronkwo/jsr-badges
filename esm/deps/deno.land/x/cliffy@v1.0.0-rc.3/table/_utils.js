/**
 * Get next words from the beginning of [content] until all words have a length lower or equal then [length].
 *
 * @param length    Max length of all words.
 * @param content   The text content.
 */
import { Cell } from "./cell.js";
import { consumeWords } from "./consume_words.js";
import { stripColor, unicodeWidth } from "./deps.js";
/**
 * Get longest cell from given row index.
 */
export function longest(index, rows, maxWidth) {
    const cellLengths = rows.map((row) => {
        const cell = row[index];
        const cellValue = cell instanceof Cell && cell.getColSpan() > 1
            ? ""
            : cell?.toString() || "";
        return cellValue
            .split("\n")
            .map((line) => {
            const str = typeof maxWidth === "undefined"
                ? line
                : consumeWords(maxWidth, line);
            return strLength(str) || 0;
        });
    }).flat();
    return Math.max(...cellLengths);
}
export const strLength = (str) => {
    return unicodeWidth(stripColor(str));
};
