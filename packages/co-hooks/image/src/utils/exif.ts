/**
 * @file exif 获取图片的EXIF信息
 * 代码来自于：https://github.com/blueimp/JavaScript-Load-Image
 */

// Sample
// ====================================
// Make : Apple
// Model : iPhone 4S
// Orientation : 1
// XResolution : 72 [72/1]
// YResolution : 72 [72/1]
// ResolutionUnit : 2
// Software : QuickTime 7.7.1
// DateTime : 2013:09:01 22:53:55
// ExifIFDPointer : 190
// ExposureTime : 0.058823529411764705 [1/17]
// FNumber : 2.4 [12/5]
// ExposureProgram : Normal program
// ISOSpeedRatings : 800
// ExifVersion : 0220
// DateTimeOriginal : 2013:09:01 22:52:51
// DateTimeDigitized : 2013:09:01 22:52:51
// ComponentsConfiguration : YCbCr
// ShutterSpeedValue : 4.058893515764426
// ApertureValue : 2.5260688216892597 [4845/1918]
// BrightnessValue : -0.3126686601998395
// MeteringMode : Pattern
// Flash : Flash did not fire, compulsory flash mode
// FocalLength : 4.28 [107/25]
// SubjectArea : [4 values]
// FlashpixVersion : 0100
// ColorSpace : 1
// PixelXDimension : 2448
// PixelYDimension : 3264
// SensingMethod : One-chip color area sensor
// ExposureMode : 0
// WhiteBalance : Auto white balance
// FocalLengthIn35mmFilm : 35
// SceneCaptureType : Standard

const EXIF = {} as any;

EXIF.ExifMap = function () {
    return this;
};

EXIF.ExifMap.prototype.map = {
    'Orientation': 0x0112 // tslint:disable-line
};

EXIF.ExifMap.prototype.get = function (id: any) {
    return this[id] || this[this.map[id]];
};

EXIF.exifTagTypes = {
    // byte, 8-bit unsigned int:
    1: {
        getValue: function (dataView: any, dataOffset: any) { // tslint:disable-line
            return dataView.getUint8(dataOffset);
        },
        size: 1
    },

    // ascii, 8-bit byte:
    2: {
        getValue: function (dataView: any, dataOffset: any) { // tslint:disable-line
            return String.fromCharCode(dataView.getUint8(dataOffset));
        },
        size: 1,
        ascii: true
    },

    // short, 16 bit int:
    3: {
        getValue: function (dataView: any, dataOffset: any, littleEndian: any) { // tslint:disable-line
            return dataView.getUint16(dataOffset, littleEndian);
        },
        size: 2
    },

    // long, 32 bit int:
    4: {
        getValue: function (dataView: any, dataOffset: any, littleEndian: any) { // tslint:disable-line
            return dataView.getUint32(dataOffset, littleEndian);
        },
        size: 4
    },

    // rational = two long values,
    // first is numerator, second is denominator:
    5: {
        getValue: function (dataView: any, dataOffset: any, littleEndian: any) { // tslint:disable-line
            return dataView.getUint32(dataOffset, littleEndian)
                / dataView.getUint32(dataOffset + 4, littleEndian);
        },
        size: 8
    },

    // slong, 32 bit signed int:
    9: {
        getValue: function (dataView: any, dataOffset: any, littleEndian: any) { // tslint:disable-line
            return dataView.getInt32(dataOffset, littleEndian);
        },
        size: 4
    },

    // srational, two slongs, first is numerator, second is denominator:
    10: {
        getValue: function (dataView: any, dataOffset: any, littleEndian: any) { // tslint:disable-line
            return dataView.getInt32(dataOffset, littleEndian)
                / dataView.getInt32(dataOffset + 4, littleEndian);
        },
        size: 8
    }
};

// undefined, 8-bit byte, value depending on field:
EXIF.exifTagTypes[7] = EXIF.exifTagTypes[1];

// tslint:disable-next-line
EXIF.getExifValue = function (dataView: any, tiffOffset: any, offset: any, type: any, length: any, littleEndian: any) {

    const tagType = EXIF.exifTagTypes[type];

    if (!tagType) {
        return;
    }

    const tagSize = tagType.size * length;

    // Determine if the value is contained in the dataOffset bytes,
    // or if the value at the dataOffset is a pointer to the actual data:
    const dataOffset = tagSize > 4 ? tiffOffset + dataView.getUint32(offset + 8, littleEndian) : (offset + 8);

    if (dataOffset + tagSize > dataView.byteLength) {
        return;
    }

    if (length === 1) {
        return tagType.getValue(dataView, dataOffset, littleEndian);
    }

    const values = [];

    for (let i = 0; i < length; i += 1) {
        values[i] = tagType.getValue(dataView, dataOffset + i * tagType.size, littleEndian);
    }

    if (tagType.ascii) {

        let str = '';

        // Concatenate the chars:
        for (const c of values) {
            // Ignore the terminating NULL byte(s):
            if (c === '\u0000') {
                break;
            }

            str += c;
        }

        return str;
    }

    return values;
};

// tslint:disable-next-line
EXIF.parseExifTag = function (dataView: any, tiffOffset: any, offset: any, littleEndian: any, data: any) {

    const tag = dataView.getUint16(offset, littleEndian);
    data.exif[tag] = EXIF.getExifValue(
        dataView, tiffOffset, offset,
        dataView.getUint16(offset + 2, littleEndian), // tag type
        dataView.getUint32(offset + 4, littleEndian), // tag length
        littleEndian
    );
};

EXIF.parseExifTags = function (dataView: any, tiffOffset: any, dirOffset: any, littleEndian: any, data: any) {

    if (dirOffset + 6 > dataView.byteLength) {
        return;
    }

    const tagsNumber = dataView.getUint16(dirOffset, littleEndian);
    const dirEndOffset = dirOffset + 2 + 12 * tagsNumber;

    if (dirEndOffset + 4 > dataView.byteLength) {
        return;
    }

    for (let i = 0; i < tagsNumber; i += 1) {
        this.parseExifTag(
            dataView, tiffOffset,
            dirOffset + 2 + 12 * i, // tag offset
            littleEndian, data
        );
    }

    // Return the offset to the next directory:
    return dataView.getUint32(dirEndOffset, littleEndian);
};

// tslint:disable-next-line
EXIF.parseExifData = function (dataView: any, offset: number, length: number, data: any) {

    const tiffOffset = offset + 10;
    let littleEndian;
    let dirOffset;

    // Check for the ASCII code for "Exif" (0x45786966):
    if (dataView.getUint32(offset + 4) !== 0x45786966) {
        // No Exif data, might be XMP data instead
        return;
    }
    if (tiffOffset + 8 > dataView.byteLength) {
        return;
    }

    // Check for the two null bytes:
    if (dataView.getUint16(offset + 8) !== 0x0000) {
        return;
    }

    // Check the byte alignment:
    switch (dataView.getUint16(tiffOffset)) {
        case 0x4949:
            littleEndian = true;
            break;

        case 0x4D4D:
            littleEndian = false;
            break;

        default:
            return;
    }

    // Check for the TIFF tag marker (0x002A):
    if (dataView.getUint16(tiffOffset + 2, littleEndian) !== 0x002A) {
        return;
    }

    // Retrieve the directory offset bytes, usually 0x00000008 or 8 decimal:
    dirOffset = dataView.getUint32(tiffOffset + 4, littleEndian);

    // Create the exif object to store the tags:
    data.exif = new EXIF.ExifMap();

    // Parse the tags of the main image directory and retrieve the
    // offset to the next directory, usually the thumbnail directory:
    EXIF.parseExifTags(dataView, tiffOffset, tiffOffset + dirOffset, littleEndian, data);
};

export default EXIF;
