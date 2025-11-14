// utils/numberToWords.ts

const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const hundreds = ['', 'مئة', 'مئتان', 'ثلاثمئة', 'أربعمئة', 'خمسمئة', 'ستمئة', 'سبعمئة', 'ثمانمئة', 'تسعمئة'];

const scales = [
    { singular: '', dual: '', plural: '', isFeminine: true }, // For units
    { singular: 'ألف', dual: 'ألفان', plural: 'آلاف', isFeminine: false },
    { singular: 'مليون', dual: 'مليونان', plural: 'ملايين', isFeminine: false },
    { singular: 'مليار', dual: 'ملياران', plural: 'مليارات', isFeminine: false },
    { singular: 'ترليون', dual: 'ترليونان', plural: 'ترليونات', isFeminine: false },
];

function convertChunk(num: number): string {
    if (num === 0) return '';
    if (num > 999) return '';

    const numStr = num.toString().padStart(3, '0');
    const h = parseInt(numStr[0]);
    const t = parseInt(numStr[1]);
    const u = parseInt(numStr[2]);

    let parts = [];
    if (h > 0) {
        parts.push(hundreds[h]);
    }

    const tenUnit = t * 10 + u;
    if (tenUnit > 0) {
        if (tenUnit < 10) {
            parts.push(units[tenUnit]);
        } else if (tenUnit < 20) {
            parts.push(teens[tenUnit - 10]);
        } else {
            if (u > 0) {
                parts.push(units[u]);
            }
            if (t > 0) {
                parts.push(tens[t]);
            }
        }
    }
    
    return parts.join(' و');
}


export function numberToWordsAr(num: number): string {
    if (num === 0) return 'صفر';
    if (num > Number.MAX_SAFE_INTEGER) return 'رقم كبير جدًا';

    const numStr = num.toString();
    const chunks: number[] = [];

    for (let i = numStr.length; i > 0; i -= 3) {
        chunks.push(parseInt(numStr.substring(Math.max(0, i - 3), i)));
    }

    if (chunks.length === 0) return '';

    let result = [];
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (chunk === 0) continue;

        const scale = scales[i];
        const chunkText = convertChunk(chunk);
        
        let scaleText = '';
        if (i > 0) { // Not in the units scale
             if (chunk === 1) {
                 scaleText = scale.singular;
             } else if (chunk === 2) {
                 scaleText = scale.dual;
             } else if (chunk >= 3 && chunk <= 10) {
                 scaleText = scale.plural;
             } else { // 11 and above
                 scaleText = scale.singular;
             }
        }
       
        result.push(chunkText + (scaleText ? ' ' + scaleText : ''));
    }

    return result.reverse().join(' و');
}
