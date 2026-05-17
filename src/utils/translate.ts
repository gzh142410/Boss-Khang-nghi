import axios from 'axios';

const CACHE_KEY = 'translation_cache';

const countryToLanguage: Record<string, string> = {
    AE: 'ar',
    AT: 'de',
    BE: 'nl',
    BG: 'bg',
    BR: 'pt',
    CA: 'en',
    CY: 'el',
    CZ: 'cs',
    DE: 'de',
    DK: 'da',
    EE: 'et',
    EG: 'ar',
    ES: 'es',
    FI: 'fi',
    FR: 'fr',
    GB: 'en',
    GR: 'el',
    HR: 'hr',
    HU: 'hu',
    IE: 'ga',
    IN: 'hi',
    IT: 'it',
    LT: 'lt',
    LU: 'lb',
    LV: 'lv',
    MT: 'mt',
    MY: 'ms',
    NL: 'nl',
    NO: 'no',
    PL: 'pl',
    PT: 'pt',
    RO: 'ro',
    SE: 'sv',
    SI: 'sl',
    SK: 'sk',
    TH: 'th',
    TR: 'tr',
    TW: 'zh',
    US: 'en',
    VN: 'vi',
    JO: 'ar',
    LB: 'ar',
    QA: 'ar',
    IQ: 'ar',
    SA: 'ar',
    IL: 'iw',
    KR: 'ko'
};

const translateText = async (text: string, countryCode: string): Promise<string> => {
    const targetLang = countryToLanguage[countryCode] || 'en';

    if (targetLang === 'en') {
        return text;
    }
    const cached = localStorage.getItem(CACHE_KEY);
    const cache = cached ? JSON.parse(cached) : {};
    const cacheKey = `en:${targetLang}:${text}`;

    if (cache[cacheKey]) {
        return cache[cacheKey];
    }

    try {
        const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
            params: {
                client: 'gtx',
                sl: 'en',
                tl: targetLang,
                dt: 't',
                q: text
            }
        });

        const data = response.data;

        const translatedText = data[0]
            ?.map((item: unknown[]) => item[0])
            .filter(Boolean)
            .join('');

        const result = translatedText || text;

        cache[cacheKey] = result;
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

        return result;
    } catch {
        return text;
    }
};

/**
 * Dịch nhiều text cùng lúc trong 1 request duy nhất
 * Giảm từ N requests xuống còn 1 request
 */
export const translateBatch = async (texts: string[], countryCode: string): Promise<Record<string, string>> => {
    const targetLang = countryToLanguage[countryCode] || 'en';
    const result: Record<string, string> = {};

    if (targetLang === 'en') {
        for (const text of texts) {
            result[text] = text;
        }
        return result;
    }

    const cached = localStorage.getItem(CACHE_KEY);
    const cache = cached ? JSON.parse(cached) : {};

    // Tách ra: text đã cache và text cần dịch
    const needTranslate: string[] = [];
    for (const text of texts) {
        const cacheKey = `en:${targetLang}:${text}`;
        if (cache[cacheKey]) {
            result[text] = cache[cacheKey];
        } else {
            needTranslate.push(text);
        }
    }

    if (needTranslate.length === 0) {
        return result;
    }

    // Gộp tất cả text cần dịch thành 1 chuỗi, phân cách bằng \n
    const separator = '\n\n---SPLIT---\n\n';
    const combined = needTranslate.join(separator);

    try {
        const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
            params: {
                client: 'gtx',
                sl: 'en',
                tl: targetLang,
                dt: 't',
                q: combined
            }
        });

        const data = response.data;
        const translatedCombined = data[0]
            ?.map((item: unknown[]) => item[0])
            .filter(Boolean)
            .join('');

        if (translatedCombined) {
            // Tách kết quả dịch theo separator
            const parts = translatedCombined.split(/\n*---SPLIT---\n*/);

            for (let i = 0; i < needTranslate.length; i++) {
                const original = needTranslate[i];
                const translated = parts[i]?.trim() || original;
                result[original] = translated;

                const cacheKey = `en:${targetLang}:${original}`;
                cache[cacheKey] = translated;
            }

            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } else {
            for (const text of needTranslate) {
                result[text] = text;
            }
        }
    } catch {
        for (const text of needTranslate) {
            result[text] = text;
        }
    }

    return result;
};

export default translateText;
