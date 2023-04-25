/**
 *
 * A class that represents a color in the RGB color space.
 *
 * @remarks Instances of this class are immutable. Based on java.awt.Color.
 */
export declare class Color {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number, g: number, b: number, a?: number);
    static readonly LIGHT_RED: Color;
    static readonly LIGHT_BLUE: Color;
    static readonly LIGHT_CYAN: Color;
    static readonly LIGHT_GREEN: Color;
    static readonly LIGHT_MAGENTA: Color;
    static readonly LIGHT_PINK: Color;
    static readonly LIGHT_YELLOW: Color;
    static readonly LIGHT_ORANGE: Color;
    static readonly PURPLE: Color;
    static readonly BLUE: Color;
    static readonly BLACK: Color;
    static readonly CYAN: Color;
    static readonly GREEN: Color;
    static readonly MAGENTA: Color;
    static readonly PINK: Color;
    static readonly RED: Color;
    static readonly WHITE: Color;
    static readonly YELLOW: Color;
    static readonly ORANGE: Color;
    /**
     * Returns the RGB value representing the color in the default sRGB
     * ColorModel. (Bits 24-31 are alpha, 16-23 are red, 8-15 are green,
     * 0-7 are blue).
     *
     * For consistency, This method is based on the `java.awt.Color.getRGB()` method from
     * the Java standard library.
     *
     * @returns The RGB value of the color as a number.
     */
    getRGB(): number;
    /**
     * Returns a darker version of this color.
     *
     * @param {number} [factor=0.7] - The darkness factor, ranging from 0 to 1.
     * @returns {Color} The darker version of this color.
     *
     * For consistency, This method is based on the `java.awt.Color.darker()` method from
     * the Java standard library.
     */
    darker(factor?: number): Color;
    /**
     * Returns a brighter version of this color.
     *
     * @param {number} [factor=0.7] - The brightness factor, ranging from 0 to 1.
     * @returns {Color} The brighter version of this color.
     *
     * For consistency, This method is based on the `java.awt.Color.brighter()` method from
     * the Java standard library.
     */
    brighter(factor?: number): Color;
}
//# sourceMappingURL=Colors.d.ts.map