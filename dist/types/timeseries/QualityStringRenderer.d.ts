/**
 *
 */
export declare class QualityStringRenderer {
    static readonly FG_COLOR_PREFIX = "qf_color_";
    static readonly BG_COLOR_PREFIX = "qf_bg_color_";
    private static readonly SYMBOL_TO_COLORED_HTML_CACHE;
    private static readonly SYMBOLIC_BG_COLOR_MAP;
    private static readonly symbolicFgColorMap;
    private static readonly LIGHT_RED;
    private static readonly LIGHT_BLUE;
    private static readonly LIGHT_CYAN;
    private static readonly LIGHT_GREEN;
    private static readonly LIGHT_MAGENTA;
    private static readonly LIGHT_PINK;
    private static readonly LIGHT_YELLOW;
    private static readonly LIGHT_ORANGE;
    private static readonly PURPLE;
    static readonly BINARY_STRING = 0;
    static readonly OCTAL_STRING = 1;
    static readonly HEX_STRING = 2;
    static readonly INTEGER_STRING = 3;
    static readonly SYMBOLIC_STRING = 4;
    static readonly SYMBOLIC_REVISED_STRING = 5;
    static readonly SYMBOLIC_TESTS_STRING = 6;
    private static previousColorMap;
    static getSymbolicString(intQuality: number): string;
    static getString(intQuality: number, stringType: number): string;
    static pad(inputStr: string, stringType: number): string;
}
//# sourceMappingURL=QualityStringRenderer.d.ts.map