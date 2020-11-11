/**
 * @file LayerGroup
 */
import {IBrickDataGlobal} from '@chief-editor/base';
import {clone, guid} from '@co-hooks/util';
import {Vector} from '@co-hooks/vector';
import {Matrix3D} from '@co-hooks/matrix3d';
import {CommandType, IGroupCommand, IRemoveBrickCommandOption, IUnGroupCommand} from '../../types';
import {getDefaultGroupData} from '../../util/group';
import {LayerBoard} from '../LayerBoard';
import {EditorTemplate} from '../EditorTemplate';
import {LayerMark} from './LayerMark';

export class LayerGroup {

    private readonly board: LayerBoard;

    constructor(board: LayerBoard) {
        this.board = board;
    }

    /**
     * 成组
     */
    public group(): IGroupCommand | null {
        const brickIds = this.getOwnerTemplate().getActiveBrickIds();

        const rect = LayerMark.getBrickGroupRect(brickIds, this.board);

        if (!rect) {
            return null;
        }

        const id = guid();
        const {offset, sizeOffset} = rect;
        const [left, top] = offset.get();
        const [width, height] = sizeOffset.get();

        const groupData = getDefaultGroupData({
            vertical: 'top',
            horizontal: 'left',
            left,
            top,
            width,
            height
        });

        groupData.id = id;

        const bricks: IBrickDataGlobal[] = [];
        const removeOptions: IRemoveBrickCommandOption[] = [];

        brickIds.forEach((id: string, i: number) => {
            const brick = this.getOwnerTemplate().getBrick(id);
            const info = brick.getBrickRectInfo();

            if (!info) {
                return;
            }

            const {vector} = info;
            const [newLeft, newTop] = Vector.subVector(vector, offset).get();

            const brickData = brick.getBrickData();

            removeOptions.push({
                brickId: brickData.id || '',
                boardId: this.board.id,
                fromIndex: brick.getNodeIndex(),
                brickData: clone(brickData)
            });

            brickData.layout = {
                ...brickData.layout,
                left: newLeft,
                top: newTop,
                vertical: 'top',
                horizontal: 'left'
            };

            bricks.push(brickData);
        });

        (groupData.parts as any).content.bricks = bricks;

        const groupCommand: IGroupCommand = {
            name: CommandType.GROUP,
            templateId: this.getOwnerTemplate().id,
            createOptions: {
                bricks: [groupData],
                boardId: this.board.id,
                index: this.board.getNode().getChildNodes().length || 0
            },
            removeOptions
        };

        return groupCommand;
    }

    /**
     * 取消成组
     * @param groupId 组id
     */
    public ungroup(groupId: string): IUnGroupCommand | null {
        const group = this.getOwnerTemplate().getBrick(groupId);
        const index = group.getNodeIndex();

        const groupInfo = group.getBrickRectInfo();

        if (!groupInfo) {
            return null;
        }

        const {
            vector: groupVector, width: groupWidth, height: groupHeight, transform: {rotate: groupRotate}
        } = groupInfo;
        // 组自身的圆心向量
        const centerVectorRelativeGroup = new Vector([groupWidth / 2, groupHeight / 2]);
        // 父容器到组圆心的向量
        const centerVectorRelativeParent = Vector.addVector(groupVector, centerVectorRelativeGroup);

        const rotateMatrix = Matrix3D.rotateMatrix3D(groupRotate / 180 * Math.PI);

        const part = group.getPart('content');

        if (!part) {
            return null;
        }

        const children = part.getChildNodes();
        const bricks: IBrickDataGlobal[] = [];

        children.forEach(child => {
            const brick = this.getOwnerTemplate().getBrickByNode(child);

            const brickData = brick.getBrickData();
            const info = brick.getBrickRectInfo();

            if (!info) {
                return;
            }

            const {vector, width, height, transform: {rotate}} = info;
            // 子元素自身的圆心向量
            const childCenterVectorRelativeChild = new Vector([width / 2, height / 2]);
            // 子元素圆心相对组左上角位置
            const childCenterVectorRelativeGroup = Vector.addVector(vector, childCenterVectorRelativeChild);
            // 子元素圆心到组圆心的向量
            const childCenterVectorRelativeGroupCenter = Vector.subVector(
                centerVectorRelativeGroup,
                childCenterVectorRelativeGroup
            );

            // 组合圆心 -> child圆心
            const groupCenterToChildCenter = Vector.subVector(
                childCenterVectorRelativeGroup,
                centerVectorRelativeGroup
            );

            // 旋转后的 组合圆心 -> child圆心
            const groupCenterToRotatedChildCenter = rotateMatrix.mulVector(groupCenterToChildCenter);

            // 旧圆心 -> 新圆心偏移量
            const centerOffset = Vector.subVector(groupCenterToRotatedChildCenter, groupCenterToChildCenter);

            // 组合父容器 -> 子元素圆心
            const childCenterVectorRelativeGroupParent = Vector.subVector(
                centerVectorRelativeParent,
                childCenterVectorRelativeGroupCenter
            );

            // 组合父容器 -> 旋转后的子元素圆心 取消组合后的圆心位置
            const rotatedChildCenterVectorRelativeGroupParent = Vector.addVector(
                childCenterVectorRelativeGroupParent,
                centerOffset
            );

            // 组合父容器 -> 旋转后的子元素左上角
            const childVectorRelativeGroupParent = Vector.subVector(
                rotatedChildCenterVectorRelativeGroupParent,
                childCenterVectorRelativeChild
            );

            const [left, top] = childVectorRelativeGroupParent.get();

            brickData.layout = {
                ...brickData.layout,
                vertical: 'top',
                horizontal: 'left',
                left: Math.floor(left),
                top: Math.floor(top),
                rotate: Math.floor((rotate + groupRotate + 360) % 360)
            };

            bricks.push(brickData);
        });

        const ungroupCommand: IUnGroupCommand = {
            name: CommandType.UNGROUP,
            templateId: this.getOwnerTemplate().id,
            createOptions: {
                bricks,
                boardId: this.board.id,
                index
            },
            removeOptions: [{
                brickData: group.getBrickData(),
                boardId: this.board.id,
                brickId: groupId,
                fromIndex: index
            }]
        };

        return ungroupCommand;
    }

    private getOwnerTemplate(): EditorTemplate {
        return this.board.getOwnerTemplate();
    }
}
