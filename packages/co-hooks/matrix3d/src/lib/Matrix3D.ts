/**
 * @file Matrix
 */
import {Emitter} from '@co-hooks/emitter';
import {clone} from '@co-hooks/util';
import {Vector} from '@co-hooks/vector';

export interface IMatrixEvent {
    'change': [];
}

export type IMatrix3D = [
    [number, number, number],
    [number, number, number],
    [number, number, number]
];

export enum Matrix3DMulType {
    'LEFT' = 'LEFT',
    'RIGHT' = 'RIGHT'
};

export class Matrix3D extends Emitter<IMatrixEvent> {
    private matrix: IMatrix3D;

    constructor(value?: IMatrix3D) {
        super();

        this.matrix = value || Matrix3D.initIdentity();
    }

    public static initIdentity(): IMatrix3D {
        return [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];
    }

    public static identityMatrix3D(): Matrix3D {
        return new Matrix3D();
    }

    public static translateMatrix3D(v: Vector): Matrix3D {
        const [x, y] = v.get();
        let [r1, r2, r3] = Matrix3D.initIdentity();

        r1[2] = x;
        r2[2] = y;
        return new Matrix3D([r1, r2, r3]);
    }

    public static scaleMatrix3D(v: Vector): Matrix3D {
        const [x, y] = v.get();
        let [r1, r2, r3] = Matrix3D.initIdentity();

        r1[0] *= x;
        r2[1] *= y;
        return new Matrix3D([r1, r2, r3]);
    }

    public static rotateMatrix3D(angle: number): Matrix3D {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        return new Matrix3D(
            [
                [cos, -sin, 0],
                [sin, cos, 0],
                [0, 0, 1]
            ]
        );
    }

    public static skewMatrix3D(sx: number = 0, sy: number = 0): Matrix3D {
        return new Matrix3D(
            [
                [1, Math.tan(sx), 0],
                [Math.tan(sy), 1, 0],
                [0, 0, 1]
            ]
        );
    }

    public set(value: IMatrix3D): void {
        this.matrix = value;
    }

    public get(ins: boolean = false): IMatrix3D {
        return ins ? this.matrix : clone(this.matrix);
    }

    public getTransformMatrix(): number[] {
        const [r1, r2] = this.matrix;
        return [r1[0], r2[0], r1[1], r2[1], r1[2], r2[2]];
    }

    public add(m: Matrix3D): void {
        const value = m.get();

        value.forEach((item, row) => {
            item.forEach((n, col) => {
                this.matrix[row][col] = this.matrix[row][col] + n;
            });
        });
    }

    public sub(m: Matrix3D): void {
        const value = m.get();

        value.forEach((item, row) => {
            item.forEach((n, col) => {
                this.matrix[row][col] = this.matrix[row][col] - n;
            });
        });
    }

    // 矩阵相乘，默认左乘
    public mul(m: Matrix3D, type: Matrix3DMulType = Matrix3DMulType.LEFT): this {
        const [[i11, i12, i13], [i21, i22, i23], [i31, i32, i33]]
            = type === Matrix3DMulType.LEFT ? m.get() : this.matrix;
        const [[j11, j12, j13], [j21, j22, j23], [j31, j32, j33]]
            = type === Matrix3DMulType.LEFT ? this.matrix : m.get();

        this.matrix = [
            [
                i11 * j11 + i12 * j21 + i13 * j31,
                i11 * j12 + i12 * j22 + i13 * j32,
                i11 * j13 + i12 * j23 + i13 * j33
            ],
            [
                i21 * j11 + i22 * j21 + i23 * j31,
                i21 * j12 + i22 * j22 + i23 * j32,
                i21 * j13 + i22 * j23 + i23 * j33
            ],
            [
                i31 * j11 + i32 * j21 + i33 * j31,
                i31 * j12 + i32 * j22 + i33 * j32,
                i31 * j13 + i32 * j23 + i33 * j33
            ]
        ];

        return this;
    }

    // 左乘变换
    public mulVector(v: Vector): Vector {
        const [x, y, z = 1] = v.get();
        const [[i11, i12, i13], [i21, i22, i23], [i31, i32, i33]] = this.matrix;

        return new Vector(
            [
                x * i11 + y * i12 + z * i13,
                x * i21 + y * i22 + z * i23,
                x * i31 + y * i32 + z * i33
            ]
        );
    }

    public translate(x: number, y: number): Matrix3D {
        return this.clone().translateO(x, y);
    }

    public translateO(x: number, y: number): this {
        this.matrix[0][2] += x;
        this.matrix[1][2] += y;
        return this;
    }

    public scale(sx: number, sy: number, cx: number = 0, cy: number = 0): Matrix3D {
        return this.clone().scaleO(sx, sy, cx, cy);
    }

    public scaleO(sx: number, sy: number, cx: number = 0, cy: number = 0): this {
        return this.translateO(-cx, -cy)
            .mul(Matrix3D.scaleMatrix3D(new Vector([sx, sy])))
            .translateO(cx, cy);
    }

    public rotate(rotate: number, cx: number = 0, cy: number = 0): Matrix3D {
        return this.clone().rotateO(rotate, cx, cy);
    }

    public rotateO(rotate: number, cx: number = 0, cy: number = 0): this {
        return this.translateO(-cx, -cy)
            .mul(Matrix3D.rotateMatrix3D(rotate))
            .translateO(cx, cy);
    }

    public skew(sx: number = 0, sy: number = 0, cx: number = 0, cy: number = 0): Matrix3D {
        return this.clone().skewO(sx, sy, cx, cy);
    }

    public skewO(sx: number = 0, sy: number = 0, cx: number = 0, cy: number = 0): this {
        return this.translateO(-cx, -cy)
            .mul(Matrix3D.skewMatrix3D(sx, sy))
            .translateO(cx, cy);
    }

    // 逆矩阵
    public inverse(): Matrix3D {
        const [[a, c, e], [b, d, f]] = this.matrix;

        // 相关系数，为0证明不存在逆矩阵
        const det = a * d - b * c;
        if (!det) {
            throw new Error('Cannot inverse current matrix');
        }

        // Calculate the top 2x2 matrix
        const na = d / det;
        const nb = -b / det;
        const nc = -c / det;
        const nd = a / det;

        // Apply the inverted matrix to the top right
        const ne = -(na * e + nc * f);
        const nf = -(nb * e + nd * f);

        return new Matrix3D([
            [na, nc, ne],
            [nb, nd, nf],
            [0, 0, 1]
        ]);
    }

    public clone(): Matrix3D {
        return new Matrix3D(this.get());
    }
}
