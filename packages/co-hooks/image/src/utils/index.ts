/**
 * @file utils
 */

import exif from './exif';

export interface IMetaDataInfo {
    exif: {
        get: (str: string) => number;
    };
    imageHead: ArrayBuffer;
}

/**
 * 从Blob里面读取图片的meta信息
 *
 * @param {Blob} blob 图片
 * @param {Function} cb 回调函数
 */
export const parseMeta = (blob: Blob, cb: (data: IMetaDataInfo) => void) => {
    const fr = new FileReader();
    fr.onload = () => {
        cb(parseHead(fr.result as ArrayBuffer));
    };

    fr.onerror = e => {
        cb({} as IMetaDataInfo);
    };

    blob = blob.slice(0, 262144);
    fr.readAsArrayBuffer(blob);
};

/**
 * 从数组中提取图片头信息
 *
 * @param {ArrayBuffer} buffer 数组
 * @param {boolean=} noParse 不处理额外的信息
 * @return {Object}
 */
export const parseHead = (buffer: ArrayBuffer, noParse?: boolean) => {
    if (buffer.byteLength < 6) {
        return {};
    }
    const ret = {} as any;
    const dataview = new DataView(buffer);
    const maxOffset = dataview.byteLength - 4;
    let offset = 2;
    let headLength = offset;

    if (dataview.getUint16(0) === 0xffd8) {

        while (offset < maxOffset) {

            const markerBytes = dataview.getUint16(offset);

            if (markerBytes >= 0xffe0 && markerBytes <= 0xffef || markerBytes === 0xfffe) {

                const markerLength = dataview.getUint16(offset + 2) + 2;

                if (offset + markerLength > dataview.byteLength) {
                    break;
                }

                const PARSER_MAP = {
                    0xffe1: [exif.parseExifData]
                };

                const parsers = (PARSER_MAP as any)[markerBytes];

                if (!noParse && parsers) {
                    for (const fn of parsers) {
                        fn(dataview, offset, markerLength, ret);
                    }
                }

                offset += markerLength;
                headLength = offset;
            } else {
                break;
            }
        }

        if (headLength > 6) {
            ret.imageHead = buffer.slice
                ? buffer.slice(2, headLength)
                : new Uint8Array(buffer).subarray(2, headLength);
        }
    }

    return ret;
};

/**
 * 将dataURI形式的图片转换成ArrayBuffer
 *
 * @param {string} dataURI 字符串形式的图片
 * @return {ArrayBuffer}
 */
export const dataURL2ArrayBuffer = (dataURI: string) => {
    const parts = dataURI.split(',');
    // tslint:disable-next-line
    const byteStr = ~parts[0].indexOf('base64') ? atob(parts[1]) : decodeURIComponent(parts[1]);
    const ab = new ArrayBuffer(byteStr.length);
    const intArray = new Uint8Array(ab);

    for (let i = 0; i < byteStr.length; i++) {
        intArray[i] = byteStr.charCodeAt(i);
    }

    return intArray.buffer;
};

/**
 * 更新图片头
 *
 * @param {ArrayBuffer} buffer 图片
 * @param {ArrayBuffer} head 头信息
 * @return {ArrayBuffer}
 */
export const updateImageHead = (buffer: ArrayBuffer, head: ArrayBuffer): ArrayBufferLike => {
    const data = parseHead(buffer, true);
    let bodyoffset = 2;

    if (data.imageHead) {
        bodyoffset = 2 + data.imageHead.byteLength;
    }

    const bodyBuffer = buffer.slice ? buffer.slice(bodyoffset) : new Uint8Array(buffer).subarray(bodyoffset);
    const resultBuffer = new Uint8Array(head.byteLength + 2 + bodyBuffer.byteLength);

    resultBuffer[0] = 0xFF;
    resultBuffer[1] = 0xD8;
    resultBuffer.set(new Uint8Array(head), 2);
    resultBuffer.set(new Uint8Array(bodyBuffer), head.byteLength + 2);

    return resultBuffer.buffer;
};

/**
 * 将ArrayBuffer转换成Blob
 *
 * @param {ArrayBuffer} buffer 缓冲池
 * @param {string} type MIME类型
 * @return {Blob}
 */
export const arrayBufferToBlob = (buffer: ArrayBuffer, type: string): Blob => new Blob([buffer], type ? {type} : {});

/**
 * 将dataURI形式的图片转换成BLOB
 *
 * @param {string} dataURI 字符串形式的图片
 * @return {Blob}
 */
export const dataURL2Blob = (dataURI: string): Blob => {
    const parts = dataURI.split(',');
    // tslint:disable-next-line
    const byteStr = ~parts[0].indexOf('base64') ? atob(parts[1]) : decodeURIComponent(parts[1]);
    const mimetype = parts[0].split(':')[1].split(';')[0];

    const ab = new ArrayBuffer(byteStr.length);
    const intArray = new Uint8Array(ab);

    for (let i = 0; i < byteStr.length; i++) {
        intArray[i] = byteStr.charCodeAt(i);
    }

    return arrayBufferToBlob(ab, mimetype);
};
