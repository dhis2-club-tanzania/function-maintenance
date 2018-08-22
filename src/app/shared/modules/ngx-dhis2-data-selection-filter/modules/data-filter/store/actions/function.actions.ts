import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { FunctionObject } from '../models/function.model';
import { FunctionRule } from '../models';

export enum FunctionActionTypes {
  LoadFunctionsInitiated = '[Function] Load Functions initiated',
  LoadFunctions = '[Function] Load Functions',
  LoadFunctionsFail = '[Function] Load Functions fail',
  AddFunction = '[Function] Add Function',
  UpsertFunction = '[Function] Upsert Function',
  AddFunctions = '[Function] Add Functions',
  UpsertFunctions = '[Function] Upsert Functions',
  UpdateFunction = '[Function] Update Function',
  UpdateFunctions = '[Function] Update Functions',
  DeleteFunction = '[Function] Delete Function',
  DeleteFunctions = '[Function] Delete Functions',
  ClearFunctions = '[Function] Clear Functions',
  SetSelectedFunctions = '[Function] Set Selected Functions'
}

export class LoadFunctionsInitiated implements Action {
  readonly type = FunctionActionTypes.LoadFunctionsInitiated;

  constructor() {}
}
export class LoadFunctions implements Action {
  readonly type = FunctionActionTypes.LoadFunctions;

  constructor() {}
}

export class LoadFunctionsFail implements Action {
  readonly type = FunctionActionTypes.LoadFunctionsFail;

  constructor(public error: any) {}
}

export class AddFunction implements Action {
  readonly type = FunctionActionTypes.AddFunction;

  constructor(public payload: { function: FunctionObject }) {}
}

export class UpsertFunction implements Action {
  readonly type = FunctionActionTypes.UpsertFunction;

  constructor(public payload: { function: FunctionObject }) {}
}

export class AddFunctions implements Action {
  readonly type = FunctionActionTypes.AddFunctions;

  constructor(
    public functions: FunctionObject[],
    public functionRules: FunctionRule[]
  ) {}
}

export class UpsertFunctions implements Action {
  readonly type = FunctionActionTypes.UpsertFunctions;

  constructor(public payload: { functions: FunctionObject[] }) {}
}

export class UpdateFunction implements Action {
  readonly type = FunctionActionTypes.UpdateFunction;

  constructor(public id: string, public changes: Partial<FunctionObject>) {}
}

export class UpdateFunctions implements Action {
  readonly type = FunctionActionTypes.UpdateFunctions;

  constructor(public payload: { functions: Update<FunctionObject>[] }) {}
}

export class DeleteFunction implements Action {
  readonly type = FunctionActionTypes.DeleteFunction;

  constructor(public payload: { id: string }) {}
}

export class DeleteFunctions implements Action {
  readonly type = FunctionActionTypes.DeleteFunctions;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearFunctions implements Action {
  readonly type = FunctionActionTypes.ClearFunctions;
}

export class SetSelectedFunctions implements Action {
  readonly type = FunctionActionTypes.SetSelectedFunctions;
  constructor(public selectedFunctionIds: string[]) {}
}

export type FunctionActions =
  | LoadFunctionsInitiated
  | LoadFunctions
  | LoadFunctionsFail
  | AddFunction
  | UpsertFunction
  | AddFunctions
  | UpsertFunctions
  | UpdateFunction
  | UpdateFunctions
  | DeleteFunction
  | DeleteFunctions
  | ClearFunctions;
