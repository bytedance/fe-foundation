/**
 * @file Vector
 */
import {Emitter} from '@co-hooks/emitter';

export interface IVectorEvent {
    'change': [];
}

export class Vector extends Emitter<IVectorEvent> {
    private vector: number[] = [0, 0];

    constructor(value?: number[]) {
        super();

        this.set(value || [], true);
    }

    public static addVector(v1: Vector, v2: Vector): Vector {
        const res = new Vector(v1.get());
        res.add(v2);

        return res;
    }

    public static subVector(v1: Vector, v2: Vector): Vector {
        const res = new Vector(v1.get());

        res.sub(v2);
        return res;
    }

    public static mulVector(v1: Vector, v2: Vector): Vector {
        const res = new Vector(v1.get());

        res.mul(v2);
        return res;
    }

    public static divVector(v1: Vector, v2: Vector): Vector {
        const res = new Vector(v1.get());

        res.division(v2);
        return res;
    }

    public static dotVector(v1: Vector, v2: Vector): number {
        return v1.dot(v2);
    }

    public static distance(v1: Vector, v2: Vector): number {
        const vector = new Vector(v1.get());

        vector.sub(v2);

        return vector.getLength();
    }

    public static clone(v: Vector): Vector {
        return new Vector(v.get());
    }

    public static scaleVector(v: Vector, scale: number): Vector {
        const clone = Vector.clone(v);
        clone.scale(scale);

        return clone;
    }

    public set(value: number[], isSlient: boolean = false): void {
        for (let i = 0; i < 2; i++) {
            this.vector[i] = value[i] || 0;
        }

        !isSlient && this.emitChange();
    }

    public get(ins: boolean = false): number[] {
        return ins ? this.vector : this.vector.slice(0);
    }

    public getLength(): number {
        return Math.sqrt(this.vector.reduce((lenSqrt, v) => lenSqrt += v * v, 0));
    }

    public add(v: Vector, isSlient: boolean = false): this {
        const value = v.get();

        this.set(value.map((item, i) => this.vector[i] + item), isSlient);

        return this;
    }

    public sub(v: Vector, isSlient: boolean = false): this {
        const value = v.get();

        this.set(value.map((item, i) => this.vector[i] - item), isSlient);

        return this;
    }

    public mul(v: Vector, isSlient: boolean = false): this {
        const value = v.get();

        this.set(value.map((item, i) => this.vector[i] * item), isSlient);

        return this;
    }

    public division(v: Vector, isSlient: boolean = false): this {
        const value = v.get();

        this.set(value.map((item, i) => this.vector[i] / item), isSlient);

        return this;
    }

    public dot(v: Vector): number {
        const value = v.get();

        return this.vector.reduce((res, item, i) => res += item * value[i], 0);
    }

    public scale(scale: number, isSlient: boolean = false): this {
        this.set(this.vector.map((item, i) => scale * item), isSlient);
        return this;
    }

    // 向量夹角公式  angle = arccos(a•b/(|a||b|))
    public getAngle(v: Vector): number {
        const dot = this.dot(v);
        return Math.acos(dot / (this.getLength() * v.getLength()));
    }

    public getNormal(): Vector {
        const len = this.getLength();
        return new Vector(this.vector.map(item => item / len));
    }

    public getX(): number {
        return this.vector[0];
    }

    public getY(): number {
        return this.vector[1];
    }

    public emitChange(): void {
        this.emit('change');
    }
}
