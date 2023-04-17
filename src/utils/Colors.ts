
export class Color {
    r = 0
    g = 0
    b = 0
    constructor(r: number, g: number, b: number) {
        this.r = r
        this.g = g
        this.b = b
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

    getRGB() {
        return [this.r, this.g, this.b]
    }
    brighter(): Color {
        let scale = 1.0 / (1.0 - 0.7);
        let r = Math.round(Math.min(this.r / scale, 255));
        let g = Math.round(Math.min(this.g / scale, 255));
        let b = Math.round(Math.min(this.b / scale, 255));
        return new Color(r, g, b);
    }

    darker(): Color {
        let scale = 1.0 / 0.7;
        let r = Math.round(Math.max(this.r * scale, 0));
        let g = Math.round(Math.max(this.g * scale, 0));
        let b = Math.round(Math.max(this.b * scale, 0));
        return new Color(r, g, b);
    }
}