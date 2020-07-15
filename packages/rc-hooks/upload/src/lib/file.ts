import {guid} from '@co-hooks/util';
import {IBaseFile, IFile, IRequest} from '../types/interface';
import {FileStatus, FileType} from '../types/enum';

type IOption = Omit<IFile, 'id'>;
type IFileClass = Omit<IFile, 'id'>;
export class FileClass implements IFileClass {

    public readonly id: string;
    public name: string;
    public fileType: FileType;
    /** 编辑前的原始文件 URL */
    public originUrl?: string;
    public data?: unknown;
    /** 编辑前的原始文件 */
    public originFile?: File;
    public size?: number;
    /** 上传成功后的文件 URL，可对文件进行编辑，并更新此 URL */
    public url: string;
    /** 上传成功后的文件，可对文件进行编辑并更新 */
    public file?: File;
    /** 上传成功前的预览 URL */
    public previewUrl: string = '';
    public fileStatus: FileStatus = FileStatus.INIT;
    public errmsg: string = '';
    public request?: IRequest;

    private progress: number;

    constructor(props: Partial<IFile>) {
        const {id, name, data, url, fileType, file} = props;
        this.id = id ? id : guid();
        this.name = name || '';
        this.data = data;
        this.url = url || '';
        this.fileType = fileType || FileType.FILE;
        this.progress = 100;
        this.errmsg = props.errmsg || '';
        if (url) {
            this.fileStatus = FileStatus.DONE;
        }
        if (props.fileStatus) {
            this.fileStatus = props.fileStatus;
        }
        if (file) {
            this.originFile = file;
            this.file = file;
            this.name = this.getName(file.name);
            this.progress = 0;
            if (this.isImageUrl(file)) {
                if (!fileType) {
                    this.fileType = FileType.IMAGE;
                }
                if (this.fileType === FileType.IMAGE) {
                    this.previewUrl = window.URL.createObjectURL(file);
                }
            }
        }
    }

    public updateFile(options: Partial<IBaseFile>): this {
        // TODO 待优化
        if (options.file && this.file !== options.file) {
            this.previewUrl = window.URL.createObjectURL(options.file);
        }
        for (let name in options) {
            if (Object.prototype.hasOwnProperty.call(options, name)) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                this[name] = options[name];
            }
        }
        return this;
    }

    public getFileName(): string | undefined {
        return this.name ? this.name : this.url;
    }

    public setStatus(status: FileStatus): void {
        this.fileStatus = status;
    }

    public getProgress(): number {
        return this.progress;
    }

    public setProgress(progress: number): void {
        this.progress = progress;
    }

    public getName(path: string): string {
        return path.split('/').pop() || '';
    }

    public getExtName(path: string): string {
        if (!path) {
            return '';
        }
        const filename = path.split('/').pop() || '';
        const filenameWithoutSuffix = filename.split(/[?#]/)[0];
        return (/\.[^./\\]*$/.exec(filenameWithoutSuffix) || [''])[0];
    }

    public isImageUrl(file: File): boolean {
        if (file.type.indexOf('image/') === 0) {
            return true;
        }

        let url = file.name;
        let extension = this.getExtName(url);

        if (/^data:image\//.test(url) || /(webp|svg|png|gif|jpg|jpeg|bmp|dpg)$/i.test(extension)) {
            return true;
        } else if (/^data:/.test(url)) {
            return false;
        }

        return false;
    }

    public getBaseFile(): IBaseFile {
        return {
            id: this.id,
            name: this.name,
            url: this.url,
            fileType: this.fileType,
            fileStatus: this.fileStatus,
            data: this.data,
            file: this.file
        };
    }

    public destroy(): void {
        if (this.previewUrl) {
            window.URL.revokeObjectURL(this.previewUrl);
            this.previewUrl = '';
        }
    }
}
