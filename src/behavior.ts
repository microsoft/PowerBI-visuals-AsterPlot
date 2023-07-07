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

// d3
// import Selection = d3.Selection;
import { Selection, AsterPlotData, AsterArcDescriptor } from "./dataInterfaces";
// powerbi.extensibility.utils.interactivity
import { interactivityBaseService, interactivitySelectionService, interactivityUtils } from "powerbi-visuals-utils-interactivityutils";
import appendClearCatcher = interactivityBaseService.appendClearCatcher;
import createInteractivitySelectionService = interactivitySelectionService.createInteractivitySelectionService;
import IInteractivityService = interactivityBaseService.IInteractivityService;
import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;
import SelectableDataPoint = interactivitySelectionService.SelectableDataPoint;
import IBehaviorOptions = interactivityBaseService.IBehaviorOptions;

// powerbi.extensibility.utils.interactivity
import ISelectionHandler = interactivityBaseService.ISelectionHandler;

import * as asterPlotUtils from "./utils";
import * as d3 from "d3";
import { BaseDataPoint } from "powerbi-visuals-utils-interactivityutils/lib/interactivityBaseService";
const getEvent = (): MouseEvent => <MouseEvent>require("d3-selection").event;

export interface AsterPlotBehaviorOptions extends IBehaviorOptions<SelectableDataPoint> {
    selection: Selection<AsterPlotData>;
    clearCatcher: Selection<any>;
    interactivityService: IInteractivityService<SelectableDataPoint>;
    hasHighlights: boolean;
}

export class AsterPlotWebBehavior implements IInteractiveBehavior {
    private selection: Selection<any>;
    private clearCatcher: Selection<any>;
    private interactivityService: IInteractivityService<SelectableDataPoint>;
    private hasHighlights: boolean;

    public bindEvents(options: AsterPlotBehaviorOptions, selectionHandler: ISelectionHandler) {
        this.selection = options.selection;
        this.clearCatcher = options.clearCatcher;
        this.interactivityService = options.interactivityService;
        this.hasHighlights = options.hasHighlights;

        this.selection.on("click", (d, i: number) => {
            selectionHandler.handleSelection(d.data, (<MouseEvent>getEvent()).ctrlKey);
        });

        this.clearCatcher.on("click", () => {
            selectionHandler.handleClearSelection();
        });

        this.renderSelection(this.interactivityService.hasSelection());
        this.bindContextMenuToClearCatcher(options, selectionHandler);
        this.bindContextMenu(options, selectionHandler);
    }

    protected bindContextMenu(options: AsterPlotBehaviorOptions, selectionHandler: ISelectionHandler) {
        options.selection.on("contextmenu",
            (datum: any) => {
                const mouseEvent: MouseEvent = <MouseEvent>(<any>d3).event;
                selectionHandler.handleContextMenu(datum.data, {
                    x: mouseEvent.clientX,
                    y: mouseEvent.clientY
                });
                mouseEvent.preventDefault();
            });
    }

    protected bindContextMenuToClearCatcher(options: AsterPlotBehaviorOptions, selectionHandler: ISelectionHandler) {
        const {
            clearCatcher
        } = options;

        const emptySelection = {
            "measures": [],
            "dataMap": {
            }
        };

        clearCatcher.on("contextmenu", () => {
            const event: MouseEvent = <MouseEvent>getEvent() || <MouseEvent>window.event;
            if (event) {
                selectionHandler.handleContextMenu(
                    <BaseDataPoint>{
                        identity: emptySelection,
                        selected: false
                    },
                    {
                        x: event.clientX,
                        y: event.clientY
                    });
                event.preventDefault();
                event.stopPropagation();
            }
        });
    }

    public renderSelection(hasSelection: boolean) {
        this.changeOpacityAttribute("fill-opacity", hasSelection);
        this.changeOpacityAttribute("stroke-opacity", hasSelection);
    }

    private changeOpacityAttribute(attributeName: string, hasSelection: boolean) {
        this.selection.style(attributeName, (d) => {
            return asterPlotUtils.getFillOpacity(
                d.data.selected,
                d.data.highlight,
                hasSelection,
                this.hasHighlights);
        });
    }
}
