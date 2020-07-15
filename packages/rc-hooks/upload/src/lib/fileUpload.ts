import {RefObject} from 'react';
import {Emitter} from '@co-hooks/emitter';
import {FileStatus, IBaseFile, IFileUploadErrorMessage, IFileUploadEvent, IFileUploadOptions} from '..';
import {FileClass} from './file';

interface IFilesMap {
    [key: string]: FileClass;
}

interface IObject {
    [key: string]: string;
}

export class FileUpload<U> extends Emitter<IFileUploadEvent<U>> {

    public files: FileClass[] = [];
    public filesMap: IFilesMap = {};
    public input: RefObject<HTMLInputElement> = {current: null};
    public maxLength: number = -1;
    public autoUpload: boolean = true;
    public name: string = '';
    public uploadUrl: string = '';
    public accept: string = '';
    public multiple: boolean = false;
    public withCredentials: boolean = false;
    public headers: IObject = {};
    public data: ((file: File) => IObject) | IObject = {};
    public errors: IFileUploadErrorMessage = {overflowCount: ''};
    public hasProgress: boolean = false;
    public customRequest?: (
        file: File,
        uploaded: (response: U) => void,
        progress: (a: number, b: number) => void
    ) => void;

    public init(input: RefObject<HTMLInputElement>): void {
        this.input = input;
    }

    public initFile(file: Partial<IBaseFile>): FileClass {
        const newFile = new FileClass({
            id: file.id,
            file: file.file,
            fileType: file.fileType,
            name: file.name,
            fileStatus: this.autoUpload ? file.fileStatus : FileStatus.DONE
        });
        this.filesMap[newFile.id] = newFile;
        return newFile;
    }

    public initURLFile(file: IBaseFile): FileClass {
        const newFile = new FileClass({
            id: file.id,
            fileStatus: file.fileStatus,
            fileType: file.fileType,
            url: file.url,
            name: file.name ? file.name : file.url,
            errmsg: file.errmsg ? file.errmsg : ''
        });
        this.filesMap[newFile.id] = newFile;
        return newFile;
    }

    public clickInput(): void {
        if (this.input.current) {
            this.input.current.click();
        }
    }

    public addFiles(files: FileList | File[]): void {
        // 超出上传最大数量限制
        if ((this.files.length + files.length > this.maxLength) && this.maxLength > -1) {
            this.emit('error', {type: 'overflowCount', message: this.errors.overflowCount});
        } else {
            Array.from(files).forEach(file => {
                const fileWrapper: FileClass = this.initFile({file: file});
                // ATTENTION 临时 hack 方案， 用于解决批量上传时显示问题
                this.emit('change', {type: 'init', file: fileWrapper.getBaseFile()});
            });
        }
    }

    public replaceFile(id: string): void {
        const input: HTMLInputElement = document.createElement('input');
        input.type = 'file';
        input.accept = this.accept;
        // input.multiple = this.multiple;
        input.onchange = ev => {
            const files = (ev.target as HTMLInputElement).files;
            if (files) {
                const file = this.filesMap[id];
                file.destroy();
                file.updateFile({
                    file: files[0],
                    url: '',
                    name: file.name,
                    fileStatus: FileStatus.INIT
                });
                file.setProgress(0);
                const index = this.getIndexById(id);
                index > -1 && this.emit('change', {type: 'update', index, file: file.getBaseFile()});
            }
        };
        input.click();
    }

    public removeFileById(id: string): void {
        const index = this.getIndexById(id);
        index > -1 && this.emit('change', {type: 'remove', index, file: this.filesMap[id].getBaseFile()});
    }

    public getIndexById(id: string): number {
        for (let i = 0; i < this.files.length; i++) {
            if (this.files[i].id === id) {
                return i;
            }
        }
        return -1;
    }

    public upload(file: FileClass): FileClass {
        file.fileStatus = FileStatus.LOADING;
        this.emit('file-change', file.id);

        const progressFn = (loaded: number, total: number): void => {
            this.hasProgress = true;
            file.setProgress(parseFloat((loaded / total * 100).toFixed(2)));
            this.emit('file-change', file.id);
        };

        if (this.customRequest && file.file) {
            if (this.customRequest.length === 3) {
                // TODO 自定义上传暂时用参数来决定 进度条动画
                this.hasProgress = true;
            }
            this.customRequest(file.file, (response: U) => {
                const index = this.getIndexById(file.id);
                this.emit('change', {
                    type: 'uploaded',
                    index,
                    response,
                    file: file.getBaseFile()
                });
            }, progressFn);
            file.fileStatus = FileStatus.LOADING;
            this.emit('file-change', file.id);
            return file;
        }

        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        xhr.responseType = 'json';
        if (xhr.upload && 'onprogress' in xhr.upload) {
            this.hasProgress = true;
            xhr.upload.onprogress = e => {
                (e.total > 0) && progressFn(e.loaded, e.total);
            };
        } else {
            this.hasProgress = false;
        }

        xhr.onerror = ev => {
            const index = this.getIndexById(file.id);
            if (index > -1) {
                this.emit('change', {
                    type: 'uploaded',
                    index,
                    response: xhr.response,
                    file: file.getBaseFile()
                });
            }
        };

        xhr.onload = res => {
            const index = this.getIndexById(file.id);
            if (index > -1) {
                this.emit('change', {
                    type: 'uploaded',
                    index,
                    response: xhr.response,
                    file: file.getBaseFile()
                });
            }
        };

        let data = this.data;
        if (typeof data === 'function') {
            data = data(file.file as File);
        }
        for (let name in data) {
            if (Object.prototype.hasOwnProperty.call(data, name)) {
                formData.append(name, data[name]);
            }
        }

        formData.append(this.name, file.file as File);
        xhr.open('post', this.uploadUrl, true);
        for (let name in this.headers) {
            if (Object.prototype.hasOwnProperty.call(this.headers, name)) {
                xhr.setRequestHeader(name, this.headers[name]);
            }
        }
        xhr.withCredentials = this.withCredentials;
        xhr.send(formData);

        file.request = {
            abort: function abort() {
                xhr.abort();
            }
        };

        return file;
    }

    public uploadFileById(id: string): void {
        const index = this.getIndexById(id);
        if (index > -1) {
            this.upload(this.files[index]);
        }
    }

    public isOverMaxLength(): boolean {
        return this.maxLength >= 0 && this.files.length >= this.maxLength;
    }

    public updateOptions(options: Omit<IFileUploadOptions<U>, 'value'>): void {
        this.errors = options.errors || {overflowCount: ''};
        this.maxLength = (!options.maxLength && options.maxLength !== 0) ? -1 : options.maxLength;
        this.autoUpload = !!options.autoUpload;
        this.name = options.name || '';
        this.uploadUrl = options.uploadUrl || '';
        this.accept = options.accept || '';
        this.headers = options.headers || {};
        this.withCredentials = options.withCredentials || false;
        this.data = options.data || {};
        this.customRequest = options.customRequest;
    }

    public updateValue(value: IBaseFile[]): void {
        let needChange = false;
        // 表示所有的文件上传都已结束
        let isAllResolved = true;
        const updatedValues: FileClass[] = [];
        if (value.length !== this.files.length) {
            needChange = true;
        }
        if (this.maxLength > -1 && value.length > this.maxLength) {
            this.emit('error', {type: 'overflowCount', message: this.errors.overflowCount});
            return;
        }
        value.forEach(baseFile => {
            const f = this.filesMap[baseFile.id];
            // ATTENTION 现在只是简单根据 FileStatus 的变化来判断是否更新列表。
            if (!f) {
                // 初始化
                if (baseFile.url) {
                    updatedValues.push(this.initURLFile(baseFile));
                    needChange = true;
                } else if (baseFile.file) {
                    updatedValues.push(this.initFile(baseFile));
                    needChange = true;
                    this.autoUpload && (isAllResolved = false);
                } else {
                    throw new Error('初始化时请设置 url 或者 file 对象');
                }
            } else if (this.autoUpload && baseFile.fileStatus === FileStatus.INIT && f.fileStatus !== FileStatus.LOADING) {
                // addFiles 之后上传
                updatedValues.push(this.upload(f));
                // needChange = true;
                isAllResolved = false;
            } else if (baseFile.fileStatus === FileStatus.INIT && f.fileStatus === FileStatus.LOADING) {
                // 处于批量上传的情况下，会存在其中一个文件的处于上传中，但是用户实际感受的仍是 INIT, 所以需要特殊处理
                updatedValues.push(f);
                isAllResolved = false;
            } else if (f.fileStatus === baseFile.fileStatus) {
                // 状态未改变
                updatedValues.push(f);
                if (f.fileStatus !== FileStatus.DONE && f.fileStatus !== FileStatus.FAIL) {
                    isAllResolved = false;
                }
            } else if (baseFile.fileStatus !== f.fileStatus) {
                // 状态有改变
                updatedValues.push(f.updateFile(baseFile));
                needChange = true;
                if (baseFile.fileStatus !== FileStatus.DONE && baseFile.fileStatus !== FileStatus.FAIL) {
                    isAllResolved = false;
                }
            }
        });
        this.files = updatedValues;
        needChange && this.emit('files-change', this.files);
        needChange && isAllResolved && this.emit('value-change', this.getBaseFiles());
        this.clearUnusedFiles();
        this.emit('disabled-change', this.isOverMaxLength());
    }

    public destroy(): void {
        this.files.forEach(file => {
            file.destroy();
        });
    }

    public clearUnusedFiles(): void {
        const newMap = Object.assign({}, this.filesMap);
        this.files.forEach(file => {
            delete newMap[file.id];
        });
        Object.keys(newMap).forEach(id => {
            newMap[id].destroy();
            delete newMap[id];
        });
    }

    private getBaseFiles(): IBaseFile[] {
        return this.files.map(i => i.getBaseFile());
    }

}
