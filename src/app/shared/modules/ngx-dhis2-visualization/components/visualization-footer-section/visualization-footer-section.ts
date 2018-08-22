import { Component, EventEmitter, Input, Output } from '@angular/core';
import { openAnimation } from '../../animations';

/**
 * Generated class for the VisualizationFooterSectionComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'visualization-footer-section',
  templateUrl: 'visualization-footer-section.html',
  styleUrls: ['./visualization-footer-section.css'],
  animations: [openAnimation]
})
export class VisualizationFooterSectionComponent {
  @Input()
  type: string;
  @Input()
  name: string;
  @Input()
  description: string;
  @Input()
  configId: string;
  @Input()
  hideTypeButtons: boolean;
  @Input()
  hideManagementBlock: boolean;

  @Output()
  visualizationTypeChange: EventEmitter<{
    id: string;
    type: string;
  }> = new EventEmitter<{ id: string; type: string }>();

  @Output()
  saveVisualization: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  removeVisualization: EventEmitter<any> = new EventEmitter<any>();

  constructor() {
    this.hideManagementBlock = this.hideTypeButtons = true;
  }

  onVisualizationTypeChange(type: string) {
    this.visualizationTypeChange.emit({ id: this.configId, type: type });
  }

  onVisualizationSave(visualizationDetails: any) {
    this.saveVisualization.emit(visualizationDetails);
  }

  onVisualizationRemove(details: any) {
    this.removeVisualization.emit(details);
  }
}
