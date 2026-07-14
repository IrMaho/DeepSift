import { PropertyType } from '../types/dna-types.js';

const HEX_COLOR = /^#([0-9a-fA-F]{3,8})$/;
const RGB_FUNC = /^rgba?\s*\(/i;
const HSL_FUNC = /^hsla?\s*\(/i;
const GENERIC_COLOR_CONSTRUCTOR = /^(?:Color|UIColor|NSColor|SolidColor)\s*[\.(]/i;
const COLOR_DOT_ACCESS = /^(?:Colors?|Couleur)\.\w+/i;
const NAMED_COLOR = /^(?:red|blue|green|yellow|orange|purple|pink|cyan|magenta|white|black|grey|gray|brown|teal|indigo|amber|lime|transparent)$/i;

const DIMENSION_UNIT = /^-?\d+(\.\d+)?\s*(px|rem|em|dp|sp|pt|vw|vh|vmin|vmax|ch|ex|%|rpx|lpx)$/i;
const EDGE_INSETS = /^EdgeInsets[\s.(]/i;
const GENERIC_SPACING = /^(?:Spacing|Padding|Margin|Inset|Offset)\s*\./i;

const DURATION_UNIT = /^\d+(\.\d+)?\s*(ms|s)$/i;
const DURATION_CONSTRUCTOR = /^Duration\s*\(/i;
const DURATION_MILLIS = /^(?:animationDuration|transitionDuration|delay)\b/i;

const FONT_FAMILY_LIKE = /^['"][\w\s-]+['"](?:\s*,\s*['"]?[\w\s-]+['"]?)*$/;
const FONT_FILE_PATH = /\.(ttf|otf|woff2?|eot)$/i;
const FONT_CONSTRUCTOR = /^(?:TextStyle|Font|Typography)\s*\(/i;
const GOOGLE_FONT = /^GoogleFonts\.\w+/i;

const BOX_SHADOW_LIKE = /(?:box-shadow|BoxShadow|shadow|dropShadow|elevation)/i;
const SHADOW_VALUE = /^\d+(\.\d+)?\s*(px|dp)?\s+\d+/;

const BORDER_RADIUS_LIKE = /(?:border.*radius|BorderRadius|rounded|corner.*radius)/i;
const RADIUS_VALUE = /^(?:BorderRadius|Radius)\s*[.(]/i;

const Z_INDEX_LIKE = /^-?\d{1,4}$/;
const Z_INDEX_NAME = /z[-_]?(?:index|level|order)/i;

export function classifyValue(raw: string): PropertyType | null {
    const v = raw.trim();
    if (!v || v.length > 500) return null;

    if (isColorValue(v)) return 'color';
    if (isDimensionValue(v)) return 'dimension';
    if (isDurationValue(v)) return 'duration';
    if (isFontValue(v)) return 'font';
    if (isShadowValue(v)) return 'shadow';
    if (isRadiusValue(v)) return 'radius';
    if (isOpacityValue(v)) return 'opacity';

    return null;
}

function isColorValue(v: string): boolean {
    return HEX_COLOR.test(v)
        || RGB_FUNC.test(v)
        || HSL_FUNC.test(v)
        || GENERIC_COLOR_CONSTRUCTOR.test(v)
        || COLOR_DOT_ACCESS.test(v)
        || NAMED_COLOR.test(v);
}

function isDimensionValue(v: string): boolean {
    return DIMENSION_UNIT.test(v)
        || EDGE_INSETS.test(v)
        || GENERIC_SPACING.test(v);
}

function isDurationValue(v: string): boolean {
    return DURATION_UNIT.test(v)
        || DURATION_CONSTRUCTOR.test(v);
}

function isFontValue(v: string): boolean {
    return FONT_FAMILY_LIKE.test(v)
        || FONT_FILE_PATH.test(v)
        || FONT_CONSTRUCTOR.test(v)
        || GOOGLE_FONT.test(v);
}

function isShadowValue(v: string): boolean {
    return BOX_SHADOW_LIKE.test(v) || SHADOW_VALUE.test(v);
}

function isRadiusValue(v: string): boolean {
    return RADIUS_VALUE.test(v) || BORDER_RADIUS_LIKE.test(v);
}

function isOpacityValue(v: string): boolean {
    const num = parseFloat(v);
    if (isNaN(num)) return false;
    return num >= 0 && num <= 1 && v.includes('.');
}

export function classifyByName(name: string): PropertyType | null {
    const n = name.toLowerCase();

    if (/(?:color|colour|bg|foreground|background|fill|stroke|tint|accent|primary|secondary|surface)/.test(n)) return 'color';
    if (/(?:width|height|size|spacing|padding|margin|gap|inset|offset|top|bottom|left|right|min|max)/.test(n) && !Z_INDEX_NAME.test(n)) return 'dimension';
    if (/(?:duration|delay|timeout|interval|animation|transition)/.test(n)) return 'duration';
    if (/(?:font|typeface|typography|text.*style|letter.*spacing|line.*height)/.test(n)) return 'font';
    if (/(?:shadow|elevation|drop)/.test(n)) return 'shadow';
    if (/(?:radius|rounded|corner|border.*rad)/.test(n)) return 'radius';
    if (/(?:opacity|alpha|transparency)/.test(n)) return 'opacity';
    if (/(?:breakpoint|screen|viewport|media)/.test(n)) return 'breakpoint';
    if (Z_INDEX_NAME.test(n)) return 'z-index';

    return null;
}

export function classifyToken(name: string, value: string): PropertyType {
    const byValue = classifyValue(value);
    if (byValue) return byValue;

    const byName = classifyByName(name);
    if (byName) return byName;

    return 'unknown';
}
