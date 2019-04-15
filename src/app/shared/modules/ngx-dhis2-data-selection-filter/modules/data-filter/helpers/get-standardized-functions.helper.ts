import * as _ from 'lodash';
import { FunctionObject } from '../models/function.model';
import { getStandardizedFunction } from './get-standardized-function.helper';

export function getStandardizedFunctions(
  functionList,
  selectedFunctionId: string = ''
): FunctionObject[] {
  return _.map(
    functionList || [],
    (functionItem: any, functionItemIndex: number) => {
      const selectedFunction = _.find(functionList || [], [
        'id',
        selectedFunctionId !== ''
          ? selectedFunctionId
          : functionItemIndex === 0
          ? functionItem.id
          : ''
      ]);
      return getStandardizedFunction(
        functionItem,
        selectedFunction && selectedFunction.id === functionItem.id
      );
    }
  );
}
