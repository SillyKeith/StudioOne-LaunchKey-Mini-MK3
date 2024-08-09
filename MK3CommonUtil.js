class Util {
    static toRange(value, inStart, inEnd, outStart, outEnd) {
        return (value - inStart) / (inEnd - inStart) * (outEnd - outStart) + outStart;
    }
    static toIntRange(value, inStart, inEnd, outStart, outEnd) {
        return Math.floor(Util.toRange(value, inStart, inEnd, outStart, outEnd));
    }
    static arrayContains(array, value) {
        for (let i = 0; i < array.length; i++)
            if (array[i] == value)
                return true;
        return false;
    }
}
class RgbColor {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}
RgbColor.kRgbWhite = new RgbColor(127, 127, 127, 127);
RgbColor.kRgbYellow = new RgbColor(127, 127, 0, 127);
class ColorUtil {
    static fromValue(value) {
        let alpha = (value >> 24) & 0xFF;
        if (alpha == 0x00)
            value = 0x7FFFFFFF;
        let red = (value >> 1) & 0x7F;
        let green = (value >> 9) & 0x7F;
        let blue = (value >> 17) & 0x7F;
        return new RgbColor(red, green, blue, alpha);
    }
    static toInt(color) {
        return color.r << 1 | (color.g << 9) | (color.b << 17) | (color.a << 24);
    }
    static addBrightness(value, amount) {
        let setC = function (value) {
            return value > 127.0 ? 0xFF : value < 0.0 ? 0x00 : value;
        };
        let c = ColorUtil.fromValue(value);
        c.r = setC(c.r + amount * 127.0);
        c.g = setC(c.g + amount * 127.0);
        c.b = setC(c.b + amount * 127.0);
        return ColorUtil.toInt(c);
    }
}
