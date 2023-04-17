import {Quality} from './Quality.js';

// import java.awt.Color;
// import java.util.Collections;
// import java.util.HashMap;
// import java.util.Map;
// import java.util.StringTokenizer;
// import java.util.prefs.Preferences;

/**
 *
 */
export class QualityStringRenderer {
    // Prefix for the Quality Flag foreground and background color preferences key.
    public static readonly FG_COLOR_PREFIX = "qf_color_";
    public static readonly BG_COLOR_PREFIX = "qf_bg_color_";

    private static readonly SYMBOL_TO_COLORED_HTML_CACHE: Map<string, string> = new Map<string, string>();
    private static readonly SYMBOLIC_BG_COLOR_MAP: Map<string, string> = new Map<string, string>([
        ["A", "darkgreen"],
        ["*", "blue"],
        ["Q", "yellow"],
        ["R", "red"],
        ["M", "black"],
        ["P", "cyan"],
        ["I", "lightpurple"],
        ["K", "purple"],
        ["E", "darkpurple"]
    ]);
    private static readonly symbolicFgColorMap: Map<string, string> = new Map<string, string>([
        ["A", "white"],
        ["*", "white"],
        ["Q", "black"],
        ["R", "white"],
        ["M", "white"],
        ["P", "black"],
        ["I", "white"],
        ["K", "white"],
        ["E", "white"]
    ]);

    private static readonly LIGHT_RED = "rgb(255, 90, 90)";
    private static readonly LIGHT_BLUE = "rgb(0, 200, 255)";
    private static readonly LIGHT_CYAN = "rgb(150, 255, 255)";
    private static readonly LIGHT_GREEN = "rgb(150, 255, 150)";
    private static readonly LIGHT_MAGENTA = "rgb(255, 125, 255)";
    private static readonly LIGHT_PINK = "rgb(255, 210, 210)";
    private static readonly LIGHT_YELLOW = "rgb(255, 255, 150)";
    private static readonly LIGHT_ORANGE = "rgb(255, 200, 125)";
    private static readonly PURPLE = "rgb(128, 0, 128)";

    static readonly BINARY_STRING = 0;
    static readonly OCTAL_STRING = 1;
    static readonly HEX_STRING = 2;
    static readonly INTEGER_STRING = 3;
    static readonly SYMBOLIC_STRING = 4;
    static readonly SYMBOLIC_REVISED_STRING = 5;
    static readonly SYMBOLIC_TESTS_STRING = 6;
    // Be sure to use the getters for accessing these, since they may be null.
    private static previousColorMap: Map<string, string> = new Map<string, string>();

    public static getSymbolicString(intQuality: number): string {
        return QualityStringRenderer.getString(intQuality, QualityStringRenderer.SYMBOLIC_STRING);
    }
    public static getJSON(intQuality: number): Object {
        return {
            "QUALITY_CODE": intQuality,
            "SCREENED_ID": Quality.isScreened_int(intQuality) ? "SCREENED" : "UNSCREENED",
            "VALIDITY_ID": Quality.getValidity_int(intQuality),
            "RANGE_ID": Quality.getRange_int(intQuality),
            "CHANGED_ID": Quality.isDifferentValue_int(intQuality) ? "MODIFIED" : "ORIGINAL",
            "REPL_CAUSE_ID": Quality.getReplaceCause_int(intQuality),
            "REPL_METHOD_ID": Quality.getReplaceMethod_int(intQuality),
            "TEST_FAILED_ID": Quality.getTestFailed_int(intQuality),
            "PROTECTION_ID": Quality.isProtected_int(intQuality) ? "PROTECTED" : "UNPROTECTED"
        }
    }
    public static getString(intQuality: number, stringType: number): string {
        let n = intQuality;
        let bytes: Int32Array = new Int32Array(4);
        bytes[3] = (n & Quality.MASK_BYTE);
        bytes[2] = (n >> 8 & Quality.MASK_BYTE);
        bytes[1] = (n >> 16 & Quality.MASK_BYTE);
        bytes[0] = (n >> 24 & Quality.MASK_BYTE);
        if (stringType === QualityStringRenderer.BINARY_STRING)
            return this.pad(n.toString(n), QualityStringRenderer.BINARY_STRING);
        if (stringType === QualityStringRenderer.HEX_STRING)
            return this.pad(n.toString(n), QualityStringRenderer.HEX_STRING);
        if (stringType === QualityStringRenderer.OCTAL_STRING)
            return this.pad(n.toString(n),  QualityStringRenderer.OCTAL_STRING);
        if (stringType === QualityStringRenderer.INTEGER_STRING)
            return n.toString();
        let qualString = "";
        if (stringType === QualityStringRenderer.SYMBOLIC_STRING) {
            if (Quality.isQualityClear(bytes)) {
                qualString += " * ";
            } else {
                if (Quality.isProtected(bytes))
                    qualString += "P";
                else
                    qualString += " ";
                if (Quality.isMissing(bytes))
                    qualString += "M";
                if (Quality.isReject(bytes))
                    qualString += "R";
                if (Quality.isQuestion(bytes))
                    qualString += "Q";
                if (qualString.length === 1)
                    qualString += " ";
            }
            return qualString;
        }
        if (stringType === QualityStringRenderer.SYMBOLIC_REVISED_STRING) {
            if (Quality.isAccepted(bytes))
                qualString += "A";
            else if (Quality.isInterpolated(bytes))
                qualString += "I";
            else if (Quality.isKeyboardInput(bytes))
                qualString += "K";
            else if (Quality.isGraphicalEstimate(bytes))
                qualString += "E";
            else qualString += " ";
            return qualString;
        }
        if (stringType === QualityStringRenderer.SYMBOLIC_TESTS_STRING) {
            if (Quality.isAbsoluteMagnitude(bytes))
                qualString += "AM";
            if (Quality.isConstantValue(bytes)) {
                if (qualString.length > 0)
                    qualString += ",";
                qualString += "CV";
            }
            if (Quality.isRateOfChange(bytes)) {
                if (qualString.length > 0)
                    qualString += ",";
                qualString += "RC";
            }
            if (Quality.isRelativeMagnitude(bytes)) {
                if (qualString.length > 0)
                    qualString += ",";
                qualString += "RM";
            }
            if (Quality.isDurationMagnitude(bytes)) {
                if (qualString.length > 0)
                    qualString += ",";
                qualString += "DM";
            }
            if (Quality.isNegativeIncremental(bytes)) {
                if (qualString.length > 0)
                    qualString += ",";
                qualString += "NI";
            }
            if (Quality.isGageList(bytes)) {
                if (qualString.length > 0)
                    qualString += ",";
                qualString += "GL";
            }
            if (Quality.isUserDefinedTest(bytes)) {
                if (qualString.length > 0)
                    qualString += ",";
                qualString += "UD";
            }
            if (Quality.isDistributionTest(bytes)) {
                if (qualString.length > 0)
                    qualString += ",";
                qualString += "DS";
            }
            return qualString;
        }
        return n.toString(n);
    }

    static pad(inputStr: string, stringType: number): string {
        const shouldBe: number[] = [ 32, 11, 8 ];
        if (stringType == QualityStringRenderer.INTEGER_STRING) {
            return inputStr;
        }
        const have = inputStr.length;
        const need = shouldBe[stringType] - have;
        return (Quality.PADDING[need] + inputStr);
    }
}