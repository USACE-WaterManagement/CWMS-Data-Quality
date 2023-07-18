import { Quality } from './Quality.js';
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
    static getSymbolicString(intQuality) {
        return QualityStringRenderer.getString(intQuality, QualityStringRenderer.SYMBOLIC_STRING);
    }
    static getJSON(intQuality) {
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
        };
    }
    static getString(intQuality, stringType) {
        let n = intQuality;
        let bytes = new Int32Array(4);
        bytes[3] = (n & Quality.MASK_BYTE);
        bytes[2] = (n >> 8 & Quality.MASK_BYTE);
        bytes[1] = (n >> 16 & Quality.MASK_BYTE);
        bytes[0] = (n >> 24 & Quality.MASK_BYTE);
        if (stringType === QualityStringRenderer.BINARY_STRING)
            return this.pad(n.toString(n), QualityStringRenderer.BINARY_STRING);
        if (stringType === QualityStringRenderer.HEX_STRING)
            return this.pad(n.toString(n), QualityStringRenderer.HEX_STRING);
        if (stringType === QualityStringRenderer.OCTAL_STRING)
            return this.pad(n.toString(n), QualityStringRenderer.OCTAL_STRING);
        if (stringType === QualityStringRenderer.INTEGER_STRING)
            return n.toString();
        let qualString = "";
        if (stringType === QualityStringRenderer.SYMBOLIC_STRING) {
            if (Quality.isQualityClear(bytes)) {
                qualString += " * ";
            }
            else {
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
            else
                qualString += " ";
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
    static pad(inputStr, stringType) {
        const shouldBe = [32, 11, 8];
        if (stringType == QualityStringRenderer.INTEGER_STRING) {
            return inputStr;
        }
        const have = inputStr.length;
        const need = shouldBe[stringType] - have;
        return (Quality.PADDING[need] + inputStr);
    }
    static getDefaultSymbolicFgColorMap() {
        // Make sure we return the unmodifiable version of the map.
        return QualityStringRenderer.symbolicFgColorMap;
    }
    static generateColorPrefMap() {
        throw new Error("Not Implimented");
    }
    static convertToColoredHtml(input, map) {
        throw new Error("Not Implimented");
    }
    static getDefaultSymbolicBgColorMap() {
        throw new Error("Not Implimented");
    }
    static getColorLineForChar(c, map) {
        throw new Error("Not Implimented");
    }
    static parseColorString(colorString) {
        throw new Error("Not Implimented");
    }
    static parseRGBString(rgbaStr) {
        throw new Error("Not Implimented");
    }
    static parseInt(str) {
        throw new Error("Not Implimented");
    }
    static removeChar(s, c) {
        throw new Error("Not Implimented");
    }
    static getSymbolicRevisedString(intQuality) {
        return QualityStringRenderer.getString(intQuality, QualityStringRenderer.SYMBOLIC_REVISED_STRING);
    }
    static getColoredHtmlSymbolicString(intQuality, colorMap) {
        if (!colorMap) {
            colorMap = QualityStringRenderer.generateColorPrefMap();
        }
        return QualityStringRenderer.convertToColoredHtml(QualityStringRenderer.getSymbolicString(intQuality) + QualityStringRenderer.getSymbolicRevisedString(intQuality), colorMap);
    }
    static getSymbolicTestsString(intQuality) {
        return QualityStringRenderer.getString(intQuality, QualityStringRenderer.SYMBOLIC_TESTS_STRING);
    }
    static toBinaryStringFromBytes(bytes) {
        throw new Error("Not Implimented");
    }
    static getHtmlStringDescription(intQuality) {
        return QualityStringRenderer.getStringDescription(intQuality, ", ", "<br>");
    }
    static getStringDescription(intQuality, delimiter, linebreak) {
        if (!delimiter || !linebreak) {
            delimiter = ", ";
            linebreak = "\n";
        }
        const bytes = new Int32Array(4);
        bytes[3] = intQuality & Quality.MASK_BYTE;
        bytes[2] = (intQuality >> 8) & Quality.MASK_BYTE;
        bytes[1] = (intQuality >> 16) & Quality.MASK_BYTE;
        bytes[0] = (intQuality >> 24) & Quality.MASK_BYTE;
        if (Quality.isQualityClear(bytes)) {
            return "Quality is not set";
        }
        let sb = "";
        QualityStringRenderer.checkPrimaryBits(sb, bytes, delimiter);
        QualityStringRenderer.checkRevisionBits(sb, bytes, linebreak);
        QualityStringRenderer.checkTestBits(sb, bytes, linebreak);
        if (Quality.isProtected(bytes)) {
            if (sb.length > 0) {
                sb += linebreak;
            }
            sb += "PROTECTED from change or replacement";
        }
        return sb;
    }
    static appendTextWithDelimeter(sb, delimeter, text) {
        if (sb.length > 0)
            sb += delimeter;
        sb += text;
        return sb;
    }
    static checkPrimaryBits(sb, bytes, delimiter) {
        if (Quality.isScreened(bytes)) {
            sb += "Screened";
        }
        else {
            sb += "Not Screened";
        }
        if (Quality.isOkay(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, delimiter, "Passed tests OK");
        }
        if (Quality.isMissing(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, delimiter, "Set to Missing");
        }
        if (Quality.isQuestion(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, delimiter, "Questionable Quality");
        }
        if (Quality.isReject(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, delimiter, "Rejected Quality");
        }
        return sb;
    }
    static checkRevisionBits(sb, bytes, linebreak) {
        if (Quality.isRange1(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Value is between first and second range limit");
        }
        if (Quality.isRange2(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Value is between second and third range limit");
        }
        if (Quality.isRange3(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Value is above third range limit");
        }
        if (Quality.isDifferentValue(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Current value is different from original value");
        }
        if (Quality.isRevisedAutomatically(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Revised automatically by DATCHK or other Process");
        }
        if (Quality.isRevisedInteractively(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Revised interactively with DATVUE or CWMS Verification Editor");
        }
        if (Quality.isRevisedManually(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Manual entry with DATVUE or CWMS Verification Editor");
        }
        if (Quality.isRevisedToOriginalAccepted(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Original value accepted in DATVUE or CWMS Verification Editor");
        }
        if (Quality.isReplaceLinearInterpolation(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Replacement method: linear interpolation");
        }
        if (Quality.isReplaceManualChange(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Replacement method: manual change");
        }
        if (Quality.isReplaceWithMissing(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Replacement method: replace with missing value");
        }
        if (Quality.isReplaceGraphicalChange(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Replacement method: graphical change");
        }
        return sb;
    }
    static checkTestBits(sb, bytes, linebreak) {
        if (Quality.isAbsoluteMagnitude(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Failed Test: Absolute Magnitude");
        }
        if (Quality.isConstantValue(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Failed Test: Constant Value");
        }
        if (Quality.isRateOfChange(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Failed Test: Rate-of-change");
        }
        if (Quality.isRelativeMagnitude(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Failed Test: Relative Magnitude");
        }
        if (Quality.isDurationMagnitude(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Failed Test: Duration-magnitude");
        }
        if (Quality.isNegativeIncremental(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Failed Test: Negative Incremental Value");
        }
        if (Quality.isGageList(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Failed Test: On GAGE list as faulty gage");
        }
        if (Quality.isUserDefinedTest(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Failed Test: User-defined Test");
        }
        if (Quality.isDistributionTest(bytes)) {
            sb += QualityStringRenderer.appendTextWithDelimeter(sb, linebreak, "Failed Test: Distribution Test");
        }
        return sb;
    }
}
// Prefix for the Quality Flag foreground and background color preferences key.
QualityStringRenderer.FG_COLOR_PREFIX = "qf_color_";
QualityStringRenderer.BG_COLOR_PREFIX = "qf_bg_color_";
QualityStringRenderer.SYMBOL_TO_COLORED_HTML_CACHE = new Map();
QualityStringRenderer.SYMBOLIC_BG_COLOR_MAP = new Map([
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
QualityStringRenderer.symbolicFgColorMap = new Map([
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
QualityStringRenderer.BINARY_STRING = 0;
QualityStringRenderer.OCTAL_STRING = 1;
QualityStringRenderer.HEX_STRING = 2;
QualityStringRenderer.INTEGER_STRING = 3;
QualityStringRenderer.SYMBOLIC_STRING = 4;
QualityStringRenderer.SYMBOLIC_REVISED_STRING = 5;
QualityStringRenderer.SYMBOLIC_TESTS_STRING = 6;
// Be sure to use the getters for accessing these, since they may be null.
QualityStringRenderer.previousColorMap = new Map();
