/**
 * @file StreamBoard
 */
import {BoardType, FloatType, NodeType} from '@chief-editor/base';
import {BrickDragType, IBrickDragData} from '../types';
import {EditorBoard} from './EditorBoard';

export class StreamBoard extends EditorBoard {

    public readonly type: BoardType = NodeType.STREAM;

    public isFloatMode(): boolean {
        return this.floatType !== FloatType.NONE;
    }

    public isValidBoard(data: IBrickDragData): boolean {

        const activeBoard = this.getOwnEditor().getActiveBoard();

        if (!activeBoard || activeBoard.type !== NodeType.STREAM) {
            return false;
        }

        const accept = this.getBoardAcceptInfo();

        if (!accept.length) {
            return true;
        }

        let brickTypes: string[] = [];
        if (data.type === BrickDragType.NEW) {
            brickTypes = data.brickDataList.map(brick => brick.type);
        } else {
            brickTypes = data.bricks.map(brick => brick.brickType);
        }

        const typesReg = brickTypes.map(type => {
            const config = this.getOwnEditor().getBrickConfigs()[type];

            if (!config) {
                console.warn(`Brick: type = ${type} is not registered in current editor`);
                return;
            }

            if (!config.category) {
                return new RegExp(',' + type + ',', 'g');
            }
            return new RegExp(`,(${type}|${config.category}),`);
        }).filter(reg => !!reg) as RegExp[];

        const acceptStr = `,${accept.join(',')},`;
        return typesReg.every(item => item.test(acceptStr));
    }
}
