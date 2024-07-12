import SendObj from "../interfaces/SendObj";
import Sharp from 'sharp';
import { GetObjectCommandOutput } from '@aws-sdk/client-s3';

export async function convertWithSharp(out: GetObjectCommandOutput, sendObj: SendObj) {

    const image = out.Body?.transformToByteArray();
    let type = out.ContentType;
    let transformed = Sharp(await image, { failOn: 'none', animated: true });
    if (sendObj.width) {
        transformed = transformed.resize({ width: parseInt(sendObj.width) });
    }
    if (sendObj.height) {
        transformed = transformed.resize({ height: parseInt(sendObj.height) });
    }
    if (sendObj.format || sendObj.quality) {
        if (sendObj.quality && sendObj.format) {
            type = `image/${sendObj.format}`;
            transformed = transformed.toFormat(sendObj.format as any, { quality: parseInt(sendObj.quality) });
        }
        if (sendObj.format) {
            type = `image/${sendObj.format}`;
            transformed = transformed.toFormat(sendObj.format as any);
        }
        if (sendObj.quality) {
            switch (sendObj.pathname.substring(1).split('.')[1]) {
                case 'jpeg':

                    transformed = transformed.jpeg({ quality: parseInt(sendObj.quality) });
                    break;
                case 'jpg':
                    transformed = transformed.jpeg({ quality: parseInt(sendObj.quality) });

                    break;
                case 'png':
                    transformed = transformed.png({ quality: parseInt(sendObj.quality) });
                    break;
                case 'avif':
                    transformed = transformed.avif({ quality: parseInt(sendObj.quality) });
                    break;
                case 'webp':
                    transformed = transformed.webp({ quality: parseInt(sendObj.quality) });
                    break;
                default:
                    break;

            }
        }
        if (sendObj.format === 'auto') {
            type = `image/${sendObj.format}`;
            transformed = transformed.toFormat('jpeg');
        }
    }

    return { type, transformed };

}

