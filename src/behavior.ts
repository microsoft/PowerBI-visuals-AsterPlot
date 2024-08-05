/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import powerbi from "powerbi-visuals-api";
import { Selection, AsterDataPoint } from "./dataInterfaces";
import * as asterPlotUtils from "./utils";
import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import { PieArcDatum } from "d3-shape";
import { LegendDataPoint } from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import { LabelEnabledDataPoint } from "powerbi-visuals-utils-chartutils/lib/dataLabel/dataLabelInterfaces";

const EnterCode = "Enter";
const SpaceCode = "Space";

export interface BaseDataPoint {
    selected: boolean;
}

export interface SelectableDataPoint extends BaseDataPoint {
    identity: ISelectionId;
    specificIdentity?: ISelectionId;
}

export interface BehaviorOptions {
    selection: Selection<PieArcDatum<AsterDataPoint>>;
    legendItems: Selection<LegendDataPoint>;
    legendIcons: Selection<any>;
    outerLine: Selection<PieArcDatum<AsterDataPoint>>;
    centerLabel: Selection<any>;
    lineLabels: Selection<LabelEnabledDataPoint>;
    clearCatcher: Selection<any>;
    hasHighlights: boolean;
    formatMode: boolean;
    dataPoints: AsterDataPoint[];
}

export class Behavior {
    private options: BehaviorOptions;
    private colorHelper: ColorHelper;
    private selectionManager: ISelectionManager;

    private legendDataPoints: LegendDataPoint[];

    constructor(colorHelper: ColorHelper, selectionManager: ISelectionManager) {
        this.colorHelper = colorHelper;
        this.selectionManager = selectionManager;
        this.selectionManager.registerOnSelectCallback(this.onSelectCallback.bind(this));
    }

    public get isInitialized(): boolean {
        return !!this.options;
    }

    public bindEvents(options: BehaviorOptions) {
        this.options = options;
        this.legendDataPoints = options.legendItems.data();

        if (options.formatMode) {
            this.removeEventListeners();
            this.selectionManager.clear();
        } else {
            this.addEventListeners();
            this.onSelectCallback();
        }
    }

    public get hasSelection(): boolean {
        const selectionIds = this.selectionManager.getSelectionIds();
        return selectionIds.length > 0;
    }

    private removeEventListeners(): void {
        this.options.selection.on("click contextmenu", null);
        this.options.legendItems.on("click", null);
        this.options.clearCatcher.on("click contextmenu", null);
    }

    private addEventListeners(): void {
        this.bindClickEvents();
        this.bindContextMenuEvents();
        this.bindKeyboardEvents();
    }

    private bindClickEvents(): void {
        this.options.selection.on("click", (event: MouseEvent, d: PieArcDatum<AsterDataPoint>) => {
            event.stopPropagation();
            this.selectDataPoint(d.data, event.ctrlKey || event.metaKey || event.shiftKey);
            this.onSelectCallback();
        });

        this.options.legendItems.on("click", (event: MouseEvent, d: LegendDataPoint) => {
            event.stopPropagation();
            this.selectDataPoint(d, event.ctrlKey || event.metaKey || event.shiftKey);
            this.onSelectCallback();
        });

        this.options.clearCatcher.on("click", () => {
            this.selectionManager.clear();
            this.onSelectCallback();
        });
    }

    private bindContextMenuEvents(): void {
        this.options.selection.on("contextmenu", (event: MouseEvent, dataPoint: PieArcDatum<AsterDataPoint>) => {
            event.preventDefault();
            event.stopPropagation();

            this.selectionManager.showContextMenu(dataPoint?.data?.identity ?? {}, {
                x: event.clientX,
                y: event.clientY
            });
        });

        this.options.legendItems.on("contextmenu", (event: MouseEvent, dataPoint: LegendDataPoint) => {
            event.preventDefault();
            event.stopPropagation();
            this.selectionManager.showContextMenu(dataPoint.identity, {
                x: event.clientX,
                y: event.clientY
            });
        });

        this.options.outerLine.on("contextmenu", (event: MouseEvent, dataPoint: PieArcDatum<AsterDataPoint>) => {
            event.preventDefault();
            event.stopPropagation();

            this.selectionManager.showContextMenu(dataPoint.data.identity, {
                x: event.clientX,
                y: event.clientY
            });
        });

        const handleEmptyContextMenu = (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            const emptySelection = {
                "measures": [],
                "dataMap": {
                }
            };

            this.selectionManager.showContextMenu(emptySelection, {
                x: event.clientX,
                y: event.clientY
            });

        };

        this.options.centerLabel.on("contextmenu", handleEmptyContextMenu);
        this.options.lineLabels.on("contextmenu", handleEmptyContextMenu);
        this.options.clearCatcher.on("contextmenu", handleEmptyContextMenu);
    }

    private bindKeyboardEvents(): void {
        this.options.selection.on("keydown", (event: KeyboardEvent, d: PieArcDatum<AsterDataPoint>) => {
            if (event.code == EnterCode || event.code == SpaceCode) {
                event.preventDefault();
                this.selectDataPoint(d.data, event.ctrlKey || event.metaKey || event.shiftKey);
                this.onSelectCallback();
            }
        });
    }

    private selectDataPoint(dataPoint: AsterDataPoint | LegendDataPoint, multiSelect: boolean = false): void {
        if (!dataPoint || !dataPoint.identity) return;        

        const selectedIds: ISelectionId[] = <ISelectionId[]>this.selectionManager.getSelectionIds();
        const isSelected: boolean = this.isDataPointSelected(dataPoint, selectedIds);

        const selectionIdsToSelect: ISelectionId[] = [];
        if (!isSelected) {
            dataPoint.selected = true;
            selectionIdsToSelect.push(dataPoint.identity);
        } else {
            // toggle selected back to false
            dataPoint.selected = false;
            if (multiSelect) {
                selectionIdsToSelect.push(dataPoint.identity);
            }
        }

        this.selectionManager.select(selectionIdsToSelect, multiSelect);
    }

    private onSelectCallback(selectionIds?: ISelectionId[]): void {
        this.applySelectionStateToData(selectionIds);
        this.renderSelection();
    }

    private applySelectionStateToData(selectionIds?: ISelectionId[]): void {
        const selectedIds: ISelectionId[] = selectionIds || <ISelectionId[]>this.selectionManager.getSelectionIds();
        this.setSelectedToDataPoints(this.options.dataPoints, selectedIds);
        this.setSelectedToDataPoints(this.legendDataPoints, selectedIds);
        this.renderSelection();
    }

    public setSelectedToDataPointsDefault(dataPoints: AsterDataPoint[] | LegendDataPoint[], hasHighlights: boolean): void {
        const ids: ISelectionId[] = <ISelectionId[]>this.selectionManager.getSelectionIds();
        this.setSelectedToDataPoints(dataPoints, ids, hasHighlights);
    }

    private setSelectedToDataPoints(dataPoints: AsterDataPoint[] | LegendDataPoint[], ids: ISelectionId[], hasHighlightsParameter?: boolean): void {
        const hasHighlights: boolean = hasHighlightsParameter || (this.options && this.options.hasHighlights);

        if (hasHighlights && this.hasSelection) {
            this.selectionManager.clear();
        }

        for (const dataPoint of dataPoints) { 
            dataPoint.selected = this.isDataPointSelected(dataPoint, ids);
        }
    }

    private isDataPointSelected(dataPoint: AsterDataPoint | LegendDataPoint, selectedIds: ISelectionId[]): boolean {
        return selectedIds.some((value: ISelectionId) => value.equals(<ISelectionId>dataPoint.identity));
    }

    private renderSelection(): void {
        const dataPointHasSelection: boolean = this.options.dataPoints.some((dataPoint: AsterDataPoint) => dataPoint.selected);
        const legendHasSelection: boolean = this.legendDataPoints.some((dataPoint: LegendDataPoint) => dataPoint.selected);

        this.options.legendIcons.style("fill-opacity", (legendDataPoint: LegendDataPoint) => {
            return asterPlotUtils.getLegendFillOpacity(
                legendDataPoint.selected,
                legendHasSelection,
                this.colorHelper.isHighContrast
            );
        });

        this.options.legendIcons.style("fill", (legendDataPoint: LegendDataPoint) => {
            return asterPlotUtils.getLegendFill(
                legendDataPoint.selected,
                legendHasSelection,
                legendDataPoint.color,
                this.colorHelper.isHighContrast
            );
        });

        this.options.selection.attr("aria-selected", (d: any) => {
            return d.data.selected;
        })
        this.changeOpacityAttribute("fill-opacity", dataPointHasSelection);
        this.changeOpacityAttribute("stroke-opacity", dataPointHasSelection);
    }
    
    private changeOpacityAttribute(attributeName: string, hasSelection: boolean) {
        this.options.selection.style(attributeName, (d: any) => {
            return asterPlotUtils.getFillOpacity(
                d.data.selected,
                d.data.highlight,
                hasSelection,
                this.options.hasHighlights);
        });
    }
}

