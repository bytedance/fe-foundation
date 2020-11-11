/**
 * @file useDawnPath 创建DawnPath
 */

import {FlowContext, IContextOptions, IModelOptions} from '@chief-editor/flow';
import {useMemo} from 'react';

export interface IDawnContextOptions extends IContextOptions {
    models?: Array<string | Omit<IModelOptions, 'context'>>;
}

export function useFlowContext(options: IDawnContextOptions): FlowContext {

    const {models = [{name: 'page'}], ...extra} = options;

    return useMemo(() => {

        const context = new FlowContext(extra);

        models.forEach(info => context.createModel(info));

        return context;
    }, []);
}
