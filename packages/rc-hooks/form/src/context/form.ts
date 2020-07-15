/**
 * @file form
 */

import {createContext} from 'react';
import {Form} from '@co-hooks/form';

export const FormContext = createContext<Form | null>(null);

export const FormProvider = FormContext.Provider;
