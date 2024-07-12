import SendObj from '../interfaces/SendObj';
export default function getFormattedName(sendObj: SendObj): string {

    let formattedName = sendObj.pathname.substring(1).split('.')[0];

    if (sendObj.width) {
        formattedName += `_${sendObj.width}w`;
    }
    if (sendObj.height) {
        formattedName += `_${sendObj.height}h`;
    }
    if (sendObj.quality) {
        formattedName += `_${sendObj.quality}q`;
    }
    if (sendObj.format) {
        formattedName += `.${sendObj.format}`;
    } else {
        formattedName += `.${sendObj.pathname.substring(1).split('.')[1]}`;
    }

    return formattedName;
}