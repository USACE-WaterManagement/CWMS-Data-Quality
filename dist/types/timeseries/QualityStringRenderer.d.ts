/**
 *
 */
export declare class QualityStringRenderer {
    static readonly FG_COLOR_PREFIX = "qf_color_";
    static readonly BG_COLOR_PREFIX = "qf_bg_color_";
    private static readonly SYMBOL_TO_COLORED_HTML_CACHE;
    private static readonly SYMBOLIC_BG_COLOR_MAP;
    private static readonly symbolicFgColorMap;
    static readonly BINARY_STRING = 0;
    static readonly OCTAL_STRING = 1;
    static readonly HEX_STRING = 2;
    static readonly INTEGER_STRING = 3;
    static readonly SYMBOLIC_STRING = 4;
    static readonly SYMBOLIC_REVISED_STRING = 5;
    static readonly SYMBOLIC_TESTS_STRING = 6;
    private static previousColorMap;
    static getSymbolicString(intQuality: number): string;
    static getJSON(intQuality: number): Object;
    static getString(intQuality: number, stringType: number): string;
    static pad(inputStr: string, stringType: number): string;
    static getDefaultSymbolicFgColorMap(): Map<string, string>;
    static generateColorPrefMap(): Map<string, string>;
    static convertToColoredHtml(input: string, map: Map<string, string>): string;
    static getDefaultSymbolicBgColorMap(): Map<string, string>;
    static getColorLineForChar(c: string, map: Map<string, string>): string;
    private static parseColorString;
    private static parseRGBString;
    private static parseInt;
    private static removeChar;
    static getSymbolicRevisedString(intQuality: number): string;
    static getColoredHtmlSymbolicString(intQuality: number, colorMap?: Map<string, string>): string;
    static getSymbolicTestsString(intQuality: number): string;
    static toBinaryStringFromBytes(bytes: Int32Array): string;
    static getHtmlStringDescription(intQuality: number): string;
    private static getStringDescription;
    private static appendTextWithDelimeter;
    private static checkPrimaryBits;
    private static checkRevisionBits;
    private static checkTestBits;
}
//# sourceMappingURL=QualityStringRenderer.d.ts.map