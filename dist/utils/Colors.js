/**
 *
 * A class that represents a color in the RGB color space.
 *
 * @remarks Instances of this class are immutable. Based on java.awt.Color.
 */
class Color {
    constructor(r, g, b, a = 1.0) {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.a = 1.0;
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
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
    getRGB() {
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
    darker(factor = 0.7) {
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
    brighter(factor = 0.7) {
        const dr = Math.floor((255 - this.r) * factor);
        const dg = Math.floor((255 - this.g) * factor);
        const db = Math.floor((255 - this.b) * factor);
        return new Color(this.r + dr, this.g + dg, this.b + db, this.a);
    }
}
Color.LIGHT_RED = new Color(255, 90, 90);
Color.LIGHT_BLUE = new Color(0, 200, 255);
Color.LIGHT_CYAN = new Color(150, 255, 255);
Color.LIGHT_GREEN = new Color(150, 255, 150);
Color.LIGHT_MAGENTA = new Color(255, 125, 255);
Color.LIGHT_PINK = new Color(255, 210, 210);
Color.LIGHT_YELLOW = new Color(255, 255, 150);
Color.LIGHT_ORANGE = new Color(255, 200, 125);
Color.PURPLE = new Color(128, 0, 128);
Color.BLUE = new Color(0, 0, 255);
Color.BLACK = new Color(0, 0, 0);
Color.CYAN = new Color(0, 255, 255);
Color.GREEN = new Color(0, 255, 0);
Color.MAGENTA = new Color(255, 0, 255);
Color.PINK = new Color(255, 175, 175);
Color.RED = new Color(255, 0, 0);
Color.WHITE = new Color(255, 255, 255);
Color.YELLOW = new Color(255, 255, 0);
Color.ORANGE = new Color(255, 200, 0);
export { Color };
