import SendObj from "../interfaces/SendObj"

export function normalizer(originalURL: string) {
    const url = new URL(originalURL, "https://localhost");
    const path = url.pathname;
    const info = url.searchParams;

    let sendObj: SendObj = { pathname: path };
    info.forEach((value, key, parent) => {
        switch (key.toLowerCase()) {
            case "width":
                if (value) {
                    const width = parseInt(value)
                    if (!isNaN(width) && (width > 0)) {
                        sendObj["width"] = width.toString();
                    }
                }
                break;
            case "height":
                if (value) {
                    const height = parseInt(value)
                    if (!isNaN(height) && (height > 0)) {
                        sendObj["height"] = height.toString();
                    }
                }
                break;
            case 'quality':
                if (value) {
                    var quality = parseInt(value);
                    if (!isNaN(quality) && (quality > 0)) {
                        if (quality > 100) quality = 100;
                        sendObj['quality'] = quality.toString();
                    }
                }
                break;
            case 'format':
                var SUPPORTED_FORMATS = ['auto', 'jpeg', 'webp', 'avif', 'png', 'svg', 'gif'];
                if (value && SUPPORTED_FORMATS.includes(value.toLowerCase())) {
                    var format = value.toLowerCase();
                    if (format === 'auto') {
                        format = 'jpeg';
                    }
                    sendObj['format'] = format
                }
                break;

            default:
                break;

        }
    })
    console.log(path)
    return sendObj;
}