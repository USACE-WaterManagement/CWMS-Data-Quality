
/**
 * 
 * A class that represents a color in the RGB color space. 
 * 
 * @remarks Instances of this class are immutable. Based on java.awt.Color.
 */
export class Color {
    r = 0
    g = 0
    b = 0
    a = 1.0;

    constructor(r: number, g: number, b: number, a: number = 1.0) {
        this.r = r
        this.g = g
        this.b = b
        this.a = a
    }

    static readonly LIGHT_RED = new Color(255, 90, 90);
    static readonly LIGHT_BLUE = new Color(0, 200, 255);
    static readonly LIGHT_CYAN = new Color(150, 255, 255);
    static readonly LIGHT_GREEN = new Color(150, 255, 150);
    static readonly LIGHT_MAGENTA = new Color(255, 125, 255);
    static readonly LIGHT_PINK = new Color(255, 210, 210);
    static readonly LIGHT_YELLOW = new Color(255, 255, 150);
    static readonly LIGHT_ORANGE = new Color(255, 200, 125);
    static readonly PURPLE = new Color(128, 0, 128);
    static readonly BLUE = new Color(0, 0, 255);
    static readonly BLACK = new Color(0, 0, 0);
    static readonly CYAN = new Color(0, 255, 255);
    static readonly GREEN = new Color(0, 255, 0);
    static readonly MAGENTA = new Color(255, 0, 255);
    static readonly PINK = new Color(255, 175, 175);
    static readonly RED = new Color(255, 0, 0);
    static readonly WHITE = new Color(255, 255, 255);
    static readonly YELLOW = new Color(255, 255, 0);
    static readonly ORANGE = new Color(255, 200, 0);

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
    getRGB(): number {
        return (this.a << 24) | (this.r << 16) | (this.g << 8) | this.b;
    }

    /**
     * Returns a darker version of this color.
     *
     * @param {number} [factor=0.7] - The darkness factor, ranging from 0 to 1.
     * @returns {Color} The darker version of this color.
     *
     * For consistency, This method is based on the `java.awt.Color.darker()` method from 
     * the Java standard library.
     */
    darker(factor: number = 0.7): Color {
        const r = Math.floor(this.r * factor);
        const g = Math.floor(this.g * factor);
        const b = Math.floor(this.b * factor);
        return new Color(r, g, b, this.a);
    }

    /**
     * Returns a brighter version of this color.
     *
     * @param {number} [factor=0.7] - The brightness factor, ranging from 0 to 1.
     * @returns {Color} The brighter version of this color.
     *
     * For consistency, This method is based on the `java.awt.Color.brighter()` method from 
     * the Java standard library.
     */
    brighter(factor: number = 0.7): Color {
        const dr = Math.floor((255 - this.r) * factor);
        const dg = Math.floor((255 - this.g) * factor);
        const db = Math.floor((255 - this.b) * factor);
        return new Color(this.r + dr, this.g + dg, this.b + db, this.a);
    }

}