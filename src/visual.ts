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


import * as d3 from "d3";
import "d3-selection-multi";

type Selection<T> = d3.Selection<any, T, any, any>;
type UpdateSelection<T> = d3.Selection<any, T, any, any>;

// powerbi
// tslint:disable-next-line
import powerbi from "powerbi-visuals-api";
import IViewport = powerbi.IViewport;
import DataView = powerbi.DataView;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import IVisual = powerbi.extensibility.IVisual;
import IColorPalette = powerbi.extensibility.IColorPalette;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

// powerbi.extensibility.visual
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

// powerbi.visuals
import ISelectionId = powerbi.visuals.ISelectionId;

// powerbi.extensibility.utils.svg
import * as SVGUtil from "powerbi-visuals-utils-svgutils";
import IMargin = SVGUtil.IMargin;
import translate = SVGUtil.manipulation.translate;
import ClassAndSelector = SVGUtil.CssConstants.ClassAndSelector;
import createClassAndSelector = SVGUtil.CssConstants.createClassAndSelector;

// powerbi.extensibility.utils.type
import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";

// powerbi.extensibility.utils.chart
import * as LegendUtil from "powerbi-visuals-utils-chartutils";
import ILegend = LegendUtil.legendInterfaces.ILegend;
import legendData = LegendUtil.legendData;
import dataLabelUtils = LegendUtil.dataLabelUtils;
import positionChartArea = LegendUtil.legend.positionChartArea;

// powerbi.extensibility.utils.interactivity
import { interactivityBaseService, interactivitySelectionService } from "powerbi-visuals-utils-interactivityutils";
import appendClearCatcher = interactivityBaseService.appendClearCatcher;
import createInteractivitySelectionService = interactivitySelectionService.createInteractivitySelectionService;
import IInteractivityService = interactivityBaseService.IInteractivityService;
import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;

// powerbi.extensibility.utils.color
import { ColorHelper } from "powerbi-visuals-utils-colorutils";

import IVisualEventService = powerbi.extensibility.IVisualEventService;

// powerbi.extensibility.utils.tooltip
import {
    createTooltipServiceWrapper,
    ITooltipServiceWrapper
} from "powerbi-visuals-utils-tooltiputils";

import {
    AsterPlotConverterService
} from "./services/asterPlotConverterService";

import {
    AsterPlotColumns
} from "./asterPlotColumns";

import {
    AsterPlotWebBehavior,
    AsterPlotBehaviorOptions
} from "./behavior";

import {
    AsterDataPoint,
    AsterPlotData
} from "./dataInterfaces";

import {
    VisualLayout
} from "./visualLayout";

import {
    DataRenderService
} from "./services/dataRenderService";

import {
    AsterPlotSettings,
    CentralLabelsSettings,
    LabelsSettings,
    LegendSettings,
    OuterLineSettings
} from "./settings";
import { LegendPosition } from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";
import { createLegend } from "powerbi-visuals-utils-chartutils/lib/legend/legend";
// import _ = require("lodash");
import { isEmpty, clone } from "lodash-es";

let AsterPlotVisualClassName: string = "asterPlot";


import "../style/asterPlot.less";

// tslint:disable-next-line: export-name
export class AsterPlot implements IVisual {
    private static AsterSlices: ClassAndSelector = createClassAndSelector("asterSlices");
    private static AsterSlice: ClassAndSelector = createClassAndSelector("asterSlice");
    private static AsterHighlightedSlice: ClassAndSelector = createClassAndSelector("asterHighlightedSlice");
    private static OuterLine: ClassAndSelector = createClassAndSelector("outerLine");
    private static CenterLabelClass: ClassAndSelector = createClassAndSelector("centerLabel");

    private events: IVisualEventService;

    private layout: VisualLayout;

    private static PiesPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "pies",
        propertyName: "fill"
    };

    private svg: Selection<any>;
    private mainGroupElement: Selection<any>;
    private mainLabelsElement: Selection<any>;
    private slicesElement: Selection<AsterPlotData>;
    private clearCatcher: Selection<any>;

    private colorPalette: IColorPalette;
    private colorHelper: ColorHelper;

    private visualHost: IVisualHost;
    private localizationManager: ILocalizationManager;
    private interactivityService: IInteractivityService<any>;

    private renderService: DataRenderService;

    private legend: ILegend;
    private data: AsterPlotData;

    private get settings(): AsterPlotSettings {
        return this.data && this.data.settings;
    }

    private behavior: IInteractiveBehavior;

    private tooltipServiceWrapper: ITooltipServiceWrapper;

    constructor(options: VisualConstructorOptions) {
        if (window.location !== window.parent.location) {
            require("core-js/stable");
        }
        this.events = options.host.eventService;
        this.visualHost = options.host;
        this.localizationManager = this.visualHost.createLocalizationManager();

        this.tooltipServiceWrapper = createTooltipServiceWrapper(
            this.visualHost.tooltipService,
            options.element);

        this.layout = new VisualLayout(null, {
            top: 10,
            right: 10,
            bottom: 15,
            left: 10
        });

        let svg: Selection<any> = this.svg = d3.select(options.element)
            .append("svg")
            .classed(AsterPlotVisualClassName, true)
            .style("position", "absolute");

        this.colorPalette = options.host.colorPalette;
        this.colorHelper = new ColorHelper(this.colorPalette);
        this.mainGroupElement = svg.append("g");
        this.mainLabelsElement = svg.append("g");

        this.behavior = new AsterPlotWebBehavior();
        this.clearCatcher = appendClearCatcher(this.mainGroupElement);

        this.slicesElement = this.mainGroupElement
            .append("g")
            .classed(AsterPlot.AsterSlices.className, true);

        this.interactivityService = createInteractivitySelectionService(options.host);

        this.legend = createLegend(
            options.element,
            options.host && false,
            this.interactivityService,
            true);
    }

    // tslint:disable-next-line: function-name
    public static converter(dataView: DataView, colors: IColorPalette, colorHelper: ColorHelper, visualHost: IVisualHost, localizationManager: ILocalizationManager): AsterPlotData {
        let categorical = <any>AsterPlotColumns.getCategoricalColumns(dataView);

        if (!AsterPlotConverterService.isDataValid(categorical)) {
            return;
        }

        let settings: AsterPlotSettings = AsterPlot.parseSettings(dataView, categorical.Category.source, colorHelper);
        let converterService: AsterPlotConverterService = new AsterPlotConverterService(dataView, settings, colors, visualHost, categorical);

        return converterService.getConvertedData(localizationManager);
    }

    private static parseSettings(dataView: DataView, categorySource: DataViewMetadataColumn, colorHelper: ColorHelper): AsterPlotSettings {
        let settings: AsterPlotSettings = AsterPlotSettings.parse<AsterPlotSettings>(dataView);

        // parse colors for high contrast mode
        settings.label.color = colorHelper.getHighContrastColor("foreground", settings.label.color);
        settings.labels.color = colorHelper.getHighContrastColor("foreground", settings.labels.color);
        settings.legend.labelColor = colorHelper.getHighContrastColor("foreground", settings.legend.labelColor);
        settings.outerLine.color = colorHelper.getHighContrastColor("foreground", settings.outerLine.color);
        settings.outerLine.textColor = colorHelper.getHighContrastColor("foreground", settings.outerLine.textColor);

        settings.labels.precision = Math.min(17, Math.max(0, settings.labels.precision));
        settings.outerLine.thickness = Math.min(25, Math.max(0.1, settings.outerLine.thickness));

        if (isEmpty(settings.legend.titleText)) {
            settings.legend.titleText = categorySource.displayName;
        }

        return settings;
    }

    private areValidOptions(options: VisualUpdateOptions): boolean {
        return !!options && options.dataViews !== undefined && options.dataViews !== null && options.dataViews.length > 0 && options.dataViews[0] !== null;
    }

    private applySelectionStateToData(): void {
        if (this.interactivityService) {
            this.interactivityService.applySelectionStateToData(
                this.data.dataPoints.concat(this.data.highlightedDataPoints),
                this.data.hasHighlights);
        }
    }

    public update(options: VisualUpdateOptions): void {
        this.visualHost.eventService.renderingStarted(options);
        try {
            if (!this.areValidOptions(options)) {
                return;
            }
            let data: AsterPlotData = AsterPlot.converter(options.dataViews[0], this.colorPalette, this.colorHelper, this.visualHost, this.localizationManager);
            if (!data) {
                this.clear();
                return;
            }

            this.layout.viewport = options.viewport;
            this.data = data;

            this.applySelectionStateToData();
            this.renderLegend();
            this.updateViewPortAccordingToLegend();
            this.transformAndResizeMainSvgElements();

            dataLabelUtils.cleanDataLabels(this.mainLabelsElement, true);

            this.renderService = new DataRenderService(data,
                this.settings,
                this.layout,
                this.tooltipServiceWrapper);

            this.renderService.renderArcs(this.slicesElement, false);

            if (!this.data.hasHighlights) {
                this.removeHighlightedSlice();
            } else {
                this.renderService.renderArcs(this.slicesElement, true);
            }

            if (this.settings.labels.show) {
                this.renderService.renderLabels(this.mainLabelsElement, this.data.hasHighlights);
            } else {
                this.renderService.cleanLabels(this.mainLabelsElement);
            }

            if (this.settings.label.show) {
                this.renderService.drawCenterText(this.mainGroupElement);
            } else {
                this.renderService.cleanCenterText(this.mainGroupElement);
            }
            if (this.settings.outerLine.show) {
                this.renderService.drawOuterLines(this.mainGroupElement);
            } else {
                this.renderService.cleanOuterLines(this.mainGroupElement);
            }

            this.bindInteractivityBehaviour();
            this.visualHost.eventService.renderingFinished(options);
        }
        catch (e) {
            this.visualHost.eventService.renderingFailed(options, e);
            console.log(e);
        }
    }

    private removeHighlightedSlice(): void {
        this.slicesElement.selectAll(AsterPlot.AsterHighlightedSlice.selectorName).remove();
    }

    private transformAndResizeMainSvgElements() {
        this.svg.attrs({
            width: PixelConverter.toString(this.layout.viewport.width),
            height: PixelConverter.toString(this.layout.viewport.height)
        });

        let transformX: number = (this.layout.viewportIn.width + this.layout.margin.right) / 2;
        let transformY: number = (this.layout.viewportIn.height + this.layout.margin.bottom) / 2;

        this.mainGroupElement.attr("transform", translate(transformX, transformY));
        this.mainLabelsElement.attr("transform", translate(transformX, transformY));

        // Move back the clearCatcher
        this.clearCatcher.attr("transform", translate(-transformX, -transformY));
    }

    private bindInteractivityBehaviour(): void {
        if (this.interactivityService) {
            let behaviorOptions: AsterPlotBehaviorOptions = {
                selection: this.slicesElement.selectAll(AsterPlot.AsterSlice.selectorName + ", " + AsterPlot.AsterHighlightedSlice.selectorName),
                clearCatcher: this.clearCatcher,
                interactivityService: this.interactivityService,
                hasHighlights: this.data.hasHighlights,
                dataPoints: this.data.dataPoints,
                behavior: this.behavior
            };

            this.interactivityService.bind(behaviorOptions);
        }
    }

    private renderLegend(): void {
        if (this.settings.legend.show) {
            // Force update for title text
            let legendObject = clone(this.settings.legend);
            legendObject.labelColor = <any>{ solid: { color: legendObject.labelColor } };
            legendData.update(this.data.legendData, <any>legendObject);
            this.legend.changeOrientation(LegendPosition[this.settings.legend.position]);
        }

        this.legend.drawLegend(this.data.legendData, this.layout.viewportCopy);
        positionChartArea(this.svg, this.legend);
    }

    private updateViewPortAccordingToLegend(): void {
        if (!this.settings.legend.show) {
            return;
        }

        let legendMargins: IViewport = this.legend.getMargins();
        let legendPosition: LegendPosition = LegendPosition[this.settings.legend.position];

        switch (legendPosition) {
            case LegendPosition.Top:
            case LegendPosition.TopCenter:
            case LegendPosition.Bottom:
            case LegendPosition.BottomCenter: {
                this.layout.viewport.height -= legendMargins.height;
                break;
            }
            case LegendPosition.Left:
            case LegendPosition.LeftCenter:
            case LegendPosition.Right:
            case LegendPosition.RightCenter: {
                this.layout.viewport.width -= legendMargins.width;
                break;
            }
            default:
                break;
        }
    }

    private clear(): void {
        this.mainGroupElement.selectAll("path").remove();
        this.mainGroupElement.select(AsterPlot.CenterLabelClass.selectorName).remove();
        dataLabelUtils.cleanDataLabels(this.mainLabelsElement, true);
        this.legend.drawLegend({ dataPoints: [] }, this.layout.viewportCopy);
    }

    /* This function returns the values to be displayed in the property pane for each object.
     * Usually it is a bind pass of what the property pane gave you, but sometimes you may want to do
     * validation and return other values/defaults
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
        const instanceEnumeration: VisualObjectInstanceEnumeration =
            AsterPlotSettings.enumerateObjectInstances(
                this.settings || AsterPlotSettings.getDefault(),
                options);

        if (options.objectName === AsterPlot.PiesPropertyIdentifier.objectName) {
            this.enumeratePies(instanceEnumeration);
        }

        return instanceEnumeration || [];
    }

    public enumeratePies(instanceEnumeration: VisualObjectInstanceEnumeration): void {
        const pies: AsterDataPoint[] = this.data.dataPoints;

        if (!pies || !(pies.length > 0)) {
            return;
        }

        pies.forEach((pie: AsterDataPoint) => {
            const identity: ISelectionId = <ISelectionId>pie.identity,
                displayName: string = `${pie.categoryName}`;

            this.addAnInstanceToEnumeration(instanceEnumeration, {
                displayName,
                objectName: AsterPlot.PiesPropertyIdentifier.objectName,
                selector: ColorHelper.normalizeSelector(identity.getSelector(), false),
                properties: {
                    fill: { solid: { color: pie.fillColor } }
                }
            });
        });
    }

    private addAnInstanceToEnumeration(
        instanceEnumeration: VisualObjectInstanceEnumeration,
        instance: VisualObjectInstance): void {

        let objectInstanceEnumeration: VisualObjectInstanceEnumerationObject = <VisualObjectInstanceEnumerationObject>instanceEnumeration;

        if (objectInstanceEnumeration.instances) {
            objectInstanceEnumeration
                .instances
                .push(instance);
        } else {
            (<VisualObjectInstance[]>instanceEnumeration).push(instance);
        }
    }
}

