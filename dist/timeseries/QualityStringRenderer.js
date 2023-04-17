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
class QualityStringRenderer {
    static getSymbolicString(intQuality) {
        return QualityStringRenderer.getString(intQuality, QualityStringRenderer.SYMBOLIC_STRING);
    }
    static getString(intQuality, stringType) {
        let n = intQuality;
        let bytes = new Int32Array(4);
        bytes[3] = (n & Quality.MASK_BYTE);
        bytes[2] = (n >> 8 & Quality.MASK_BYTE);
        bytes[1] = (n >> 16 & Quality.MASK_BYTE);
        bytes[0] = (n >> 24 & Quality.MASK_BYTE);
        if (stringType === QualityStringRenderer.BINARY_STRING)
            return this.pad(n.toString(n), 0);
        if (stringType === QualityStringRenderer.HEX_STRING)
            return this.pad(n.toString(n), QualityStringRenderer.HEX_STRING);
        if (stringType === QualityStringRenderer.OCTAL_STRING)
            return this.pad(n.toString(n), QualityStringRenderer.OCTAL_STRING);
        if (stringType === QualityStringRenderer.INTEGER_STRING)
            return n.toString();
        let qualString = "";
        if (stringType === 4) {
            if (Quality.isQualityClear(bytes)) {
                qualString += " * ";
            }
            else {
                if (Quality.isBitSet(bytes, 32))
                    qualString += "P";
                else
                    qualString += " ";
                if (Quality.isBitSet(bytes, 3))
                    qualString += "M";
                if (Quality.isBitSet(bytes, 5))
                    qualString += "R";
                if (Quality.isBitSet(bytes, 4))
                    qualString += "Q";
                if (qualString.length === 1)
                    qualString += " ";
            }
            return qualString;
        }
        if (stringType === 5) {
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
        if (stringType === 6) {
            if (Quality.isBitSet(bytes, 16))
                qualString += "AM";
            if (Quality.isBitSet(bytes, 17)) {
                if (qualString.length > 0)
                    qualString += ",";
                qualString += "CV";
            }
            if (Quality.isBitSet(bytes, 18)) {
                if (qualString.length > 0)
                    qualString += ",";
                qualString += "RC";
            }
            if (Quality.isBitSet(bytes, 19)) {
                if (qualString.length > 0)
                    qualString += ",";
                qualString += "RM";
            }
            if (Quality.isBitSet(bytes, 20)) {
                if (qualString.length > 0)
                    qualString += ",";
                qualString += "DM";
            }
            if (Quality.isBitSet(bytes, 21)) {
                if (qualString.length > 0)
                    qualString += ",";
                qualString += "NI";
            }
            if (Quality.isBitSet(bytes, 23)) {
                if (qualString.length > 0)
                    qualString += ",";
                qualString += "GL";
            }
            if (Quality.isBitSet(bytes, 25)) {
                if (qualString.length > 0)
                    qualString += ",";
                qualString += "UD";
            }
            if (Quality.isBitSet(bytes, 26)) {
                if (qualString.length > 0)
                    qualString += ",";
                qualString += "DS";
            }
            return qualString;
        }
        return n.toString(16);
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
QualityStringRenderer.LIGHT_RED = "rgb(255, 90, 90)";
QualityStringRenderer.LIGHT_BLUE = "rgb(0, 200, 255)";
QualityStringRenderer.LIGHT_CYAN = "rgb(150, 255, 255)";
QualityStringRenderer.LIGHT_GREEN = "rgb(150, 255, 150)";
QualityStringRenderer.LIGHT_MAGENTA = "rgb(255, 125, 255)";
QualityStringRenderer.LIGHT_PINK = "rgb(255, 210, 210)";
QualityStringRenderer.LIGHT_YELLOW = "rgb(255, 255, 150)";
QualityStringRenderer.LIGHT_ORANGE = "rgb(255, 200, 125)";
QualityStringRenderer.PURPLE = "rgb(128, 0, 128)";
QualityStringRenderer.BINARY_STRING = 0;
QualityStringRenderer.OCTAL_STRING = 1;
QualityStringRenderer.HEX_STRING = 2;
QualityStringRenderer.INTEGER_STRING = 3;
QualityStringRenderer.SYMBOLIC_STRING = 4;
QualityStringRenderer.SYMBOLIC_REVISED_STRING = 5;
QualityStringRenderer.SYMBOLIC_TESTS_STRING = 6;
// Be sure to use the getters for accessing these, since they may be null.
QualityStringRenderer.previousColorMap = new Map();
export { QualityStringRenderer };
