import {getPrefixedStyleKey} from '@co-hooks/dom';

const transitionKeys = getPrefixedStyleKey('transition');
// css grammar reference: https://drafts.csswg.org/css-transitions/#transition-shorthand-property
const transitionRegExp = new RegExp(
    `
(\\S{1,})\\s{1,}\
(\\d{1,}(?:.\\d*)?[^\\s,]*)\\s{1,}\
([^\\s(]{1,}(?:\\([^)]*\\))?)\\s{1,}\
(\\d{1,}(?:.\\d*)?[^\\s,]*)
`.trim()
);

const animationKeys = getPrefixedStyleKey('animation');
// css grammar reference: https://drafts.csswg.org/css-animations/#animation
const animationRegExp = new RegExp(
    `
(\\d{1,}(?:.\\d*)?[^\\s,]*)\\s{1,}\
([^\\s(]{1,}(?:\\([^)]*\\))?)\\s{1,}\
(\\d{1,}(?:.\\d*)?[^\\s,]*)\\s{1,}\
(\\S{1,})\\s{1,}\
(\\S{1,})\\s{1,}\
(\\S{1,})\\s{1,}\
(\\S{1,})\\s{1,}\
([^\\s,]{1,})
`.trim()
);

export interface ITransitionValue {
    delay: number;
    duration: number;
    property: string;
    timingFunction: string;
}

export interface IAnimationValue {
    delay: number;
    direction: string;
    duration: number;
    fillMode: string;
    iterationCount: number;
    keyframes: string;
    playState: string;
    timingFunction: string;
}

function matchTransitions(value: string): [ITransitionValue, number] | null {
    const matched = value.match(transitionRegExp);
    if (!matched || matched.length < 5) {
        return null;
    }
    const transitionValue: ITransitionValue = {
        property: matched[1],
        duration: parseFloat(matched[2]) || 0,
        timingFunction: matched[3],
        delay: parseFloat(matched[4]) || 0
    };
    const nextIndex = (matched.index || 0) + matched[0].length;
    return [transitionValue, nextIndex];
}

function matchAnimations(value: string): [IAnimationValue, number] | null {
    const matched = value.match(animationRegExp);
    if (!matched || matched.length < 9) {
        return null;
    }
    const animationValue: IAnimationValue = {
        duration: parseFloat(matched[1]) || 0,
        timingFunction: matched[2],
        delay: parseFloat(matched[3]) || 0,
        iterationCount: parseFloat(matched[4]) || Infinity,
        direction: matched[5],
        fillMode: matched[6],
        playState: matched[7],
        keyframes: matched[8]
    };
    const nextIndex = (matched.index || 0) + matched[0].length;
    return [animationValue, nextIndex];
}

export function getTransitionValues(element: HTMLElement): ITransitionValue[] {
    return transitionKeys.reduce<ITransitionValue[]>((prev, key) => {
        const rawValue = getComputedStyle(element)[key as unknown as number].trim();

        for (let searchIndex = 0; searchIndex < rawValue.length;) {
            const matched = matchTransitions(rawValue.slice(searchIndex));
            if (!matched) {
                break;
            }
            prev.push(matched[0]);
            searchIndex = matched[1];
        }

        return prev;
    }, []);
}

export function getAnimationValues(element: HTMLElement): IAnimationValue[] {
    return animationKeys.reduce<IAnimationValue[]>((prev, key) => {
        const rawValue = getComputedStyle(element)[key as unknown as number].trim();

        for (let searchIndex = 0; searchIndex < rawValue.length;) {
            const matched = matchAnimations(rawValue.slice(searchIndex));
            if (!matched) {
                break;
            }
            searchIndex = matched[1];
            prev.push(matched[0]);
        }

        return prev;
    }, []);
}
