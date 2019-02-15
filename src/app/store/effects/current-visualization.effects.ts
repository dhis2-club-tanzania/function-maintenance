import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Observable } from 'rxjs';
import { UserActionTypes, AddCurrentUser, Go } from '../actions';
import {
  map,
  withLatestFrom,
  first,
  take,
  tap,
  switchMap
} from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../reducers';
import { getCurrentVisualization, getQueryParams } from '../selectors';
import { CurrentVisualizationState } from '../reducers/current-visualization.reducer';
import { getDefaultVisualizationLayer } from '../../shared/modules/ngx-dhis2-visualization/helpers/get-default-visualization-layer.helper';
import {
  AddOrUpdateCurrentVisualizationAction,
  CurrentVisualizationActionTypes,
  UpdateCurrentVisualizationWithDataSelectionsAction,
  SimulateVisualizationAction,
  AddVisualizationItemAction
} from '../actions/current-visualization.actions';
import {
  generateUid,
  getSelectionDimensionsFromFavorite,
  getVisualizationLayerType
} from '../../shared/modules/ngx-dhis2-visualization/helpers';
import { LoadVisualizationAnalyticsAction } from '../../shared/modules/ngx-dhis2-visualization/store';

import * as fromFunctionSelectors from '../../shared/modules/ngx-dhis2-data-selection-filter/modules/data-filter/store/selectors';
import * as fromFunctionRuleActions from '../../shared/modules/ngx-dhis2-data-selection-filter/modules/data-filter/store/actions/function-rule.actions';
import {
  VisualizationDataSelection,
  VisualizationLayer
} from '../../shared/modules/ngx-dhis2-visualization/models';
import { FavoriteService } from '../../shared/modules/ngx-dhis2-visualization/services';
import { ROUTER_NAVIGATION, RouterNavigationAction } from '@ngrx/router-store';
import {
  SetActiveFunction,
  FunctionActionTypes,
  AddFunctions
} from '../../shared/modules/ngx-dhis2-data-selection-filter/modules/data-filter/store/actions/function.actions';

@Injectable()
export class CurrentVisualizationEffects {
  @Effect({ dispatch: false })
  addCurrentUser$: Observable<any> = this.actions$.pipe(
    ofType(UserActionTypes.AddCurrentUser),
    withLatestFrom(this.store.select(getCurrentVisualization)),
    tap(
      ([action, currentVisualization]: [
        AddCurrentUser,
        CurrentVisualizationState
      ]) => {
        this.store
          .select(fromFunctionSelectors.getSelectedFunctions)
          .pipe(
            first((selectedFunctions: any[]) => selectedFunctions.length > 0)
          )
          .subscribe((selectedFunctions: any[]) => {
            this.store.dispatch(
              new AddOrUpdateCurrentVisualizationAction({
                ...currentVisualization,
                loading: false,
                layers: [
                  {
                    ...getDefaultVisualizationLayer(
                      action.currentUser,
                      action.systemInfo,
                      selectedFunctions
                    ),
                    id: generateUid()
                  }
                ]
              })
            );
          });
      }
    )
  );

  @Effect()
  updateCurrentVisualizationDataSelections$: Observable<
    any
  > = this.actions$.pipe(
    ofType(
      CurrentVisualizationActionTypes.UpdateCurrentVisualizationWithDataSelections
    ),
    withLatestFrom(this.store.select(getCurrentVisualization)),
    map(
      ([action, currentVisualization]: [
        UpdateCurrentVisualizationWithDataSelectionsAction,
        CurrentVisualizationState
      ]) =>
        new LoadVisualizationAnalyticsAction(
          currentVisualization.id,
          _.map(currentVisualization.layers, layer => {
            return {
              ...layer,
              dataSelections: action.dataSelections
            };
          })
        )
    )
  );

  @Effect({ dispatch: false })
  setActiveFunctionOrSimulateFunction$: Observable<any> = this.actions$.pipe(
    ofType(
      fromFunctionRuleActions.FunctionRuleActionTypes.SetActiveFunctionRule,
      CurrentVisualizationActionTypes.SimulateVisualization
    ),
    withLatestFrom(this.store.select(getCurrentVisualization)),
    tap(([action, currentVisualization]: [any, CurrentVisualizationState]) => {
      const dataSelections: VisualizationDataSelection[] =
        currentVisualization.layers && currentVisualization.layers[0]
          ? currentVisualization.layers[0].dataSelections
          : [];
      const dxDataSelection: VisualizationDataSelection = _.find(
        dataSelections,
        ['dimension', 'dx']
      );

      const dxDataSelectionIndex = dataSelections.indexOf(dxDataSelection);

      const newItem =
        action.functionObject && action.functionRule
          ? {
              id: action.functionRule.id,
              name: action.functionRule.name,
              ruleDefinition: action.functionRule,
              functionObject: {
                id: action.functionObject.id,
                functionString: action.functionObject.function
              },
              type: 'FUNCTION_RULE'
            }
          : null;

      if (newItem && dxDataSelection) {
        const dxItems = dxDataSelection.items || [];
        const availableItem = _.find(dxItems, ['id', newItem.id]);
        const availableItemIndex = dxItems.indexOf(availableItem);

        const newDxItems =
          availableItemIndex !== -1
            ? [
                ..._.slice(dxItems, 0, availableItemIndex),
                newItem,
                ..._.slice(dxItems, availableItemIndex + 1)
              ]
            : [...dxItems, newItem];

        const newDataSelections: VisualizationDataSelection[] = [
          ..._.slice(dataSelections, 0, dxDataSelectionIndex),
          {
            ...dxDataSelection,
            items: newDxItems
          },
          ..._.slice(dataSelections, dxDataSelectionIndex + 1)
        ];

        const newCurrentVisualization: CurrentVisualizationState = {
          ...currentVisualization,
          layers: _.map(
            currentVisualization.layers,
            (layer: VisualizationLayer) => {
              return {
                ...layer,
                dataSelections: newDataSelections
              };
            }
          )
        };

        this.store.dispatch(
          new AddOrUpdateCurrentVisualizationAction(newCurrentVisualization)
        );

        if (action.simulate) {
          this.store.dispatch(
            new LoadVisualizationAnalyticsAction(
              newCurrentVisualization.id,
              newCurrentVisualization.layers
            )
          );
        }
      }
    })
  );

  @Effect({ dispatch: false })
  addVisualizationItem$: Observable<any> = this.actions$.pipe(
    ofType(CurrentVisualizationActionTypes.AddVisualizationItem),
    tap((action: AddVisualizationItemAction) => {
      this.store.dispatch(
        new AddOrUpdateCurrentVisualizationAction({
          id: action.visualizationItem.id,
          type: action.visualizationItem.type,
          loading: true,
          error: null,
          layers: []
        })
      );
      const favorite =
        action.visualizationItem[_.camelCase(action.visualizationItem.type)];

      if (favorite) {
        this.favoriteService
          .getFavorite({
            type: _.camelCase(action.visualizationItem.type),
            id: favorite.id,
            useTypeAsBase: true
          })
          .subscribe(
            (favoriteObject: any) => {
              const visualizationLayers: VisualizationLayer[] = _.map(
                favoriteObject.mapViews || [favoriteObject],
                (favoriteLayer: any) => {
                  const dataSelections = getSelectionDimensionsFromFavorite(
                    favoriteLayer
                  );
                  return {
                    id: favoriteLayer.id,
                    dataSelections,
                    layerType: getVisualizationLayerType(
                      favorite.type,
                      favoriteLayer
                    ),
                    analytics: null,
                    config: {
                      ...favoriteLayer,
                      type: favoriteLayer.type ? favoriteLayer.type : 'COLUMN',
                      visualizationType: action.visualizationItem.type
                    }
                  };
                }
              );
              this.store.dispatch(
                new AddOrUpdateCurrentVisualizationAction({
                  id: action.visualizationItem.id,
                  type: action.visualizationItem.type,
                  loading: false,
                  layers: visualizationLayers
                })
              );
            },
            error => {
              this.store.dispatch(
                new AddOrUpdateCurrentVisualizationAction({
                  id: action.visualizationItem.id,
                  type: action.visualizationItem.type,
                  loading: false,
                  error,
                  layers: []
                })
              );
            }
          );
      }
    })
  );

  @Effect({ dispatch: false })
  routerNavigation$: Observable<any> = this.actions$.pipe(
    ofType(ROUTER_NAVIGATION),
    take(1),
    tap((action: any) => {
      const queryParams: any =
        action.payload.routerState && action.payload.routerState.queryParams
          ? action.payload.routerState.queryParams
          : null;
      if (queryParams) {
        if (queryParams.function) {
          this.store.dispatch(
            new SetActiveFunction({ id: queryParams.function })
          );
        }

        if (queryParams.rule) {
          this.store.dispatch(
            new fromFunctionRuleActions.SetActiveFunctionRule(
              {
                id: queryParams.rule
              },
              {
                id: queryParams.function
              }
            )
          );
        }
      }
    })
  );

  @Effect({ dispatch: false })
  addFunctions$: Observable<any> = this.actions$.pipe(
    ofType(FunctionActionTypes.AddFunctions),
    withLatestFrom(this.store.select(getQueryParams)),
    map(([action, routeQueryParams]: [AddFunctions, any]) => {
      const selectedFunction = _.find(action.functions, ['selected', true]);
      const selectedFunctionRule = _.find(action.functionRules, [
        'selected',
        true
      ]);

      if (!routeQueryParams.function && !routeQueryParams.rule) {
        const queryParams =
          selectedFunction && selectedFunctionRule
            ? {
                function: selectedFunction.id,
                rule: selectedFunctionRule.id
              }
            : {};
        this.store.dispatch(new Go({ path: ['/'], query: queryParams }));
      }
    })
  );
  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private favoriteService: FavoriteService
  ) {}
}