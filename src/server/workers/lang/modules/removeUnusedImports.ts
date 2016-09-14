/**
 * Removes unused imports (both import/require and ES6)
 */
export const removeUnusedImports = (filePath: string, service: ts.LanguageService) => {

    /**
     * Plan:
     * - First finds all the imports in the file
     * - Then checks if they have any usages (using document highlighting).
     * - For used ones it removes them
     *   - If all the ones from a destructured ES6 import the whole import is removed
     */

}
