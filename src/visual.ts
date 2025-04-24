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


// powerbi
import powerbi from "powerbi-visuals-api";

// powerbi.extensibility.utils.svg
import * as SVGUtil from "powerbi-visuals-utils-svgutils";

// powerbi.extensibility.utils.type
import {pixelConverter as PixelConverter} from "powerbi-visuals-utils-typeutils";

// powerbi.extensibility.utils.chart
import * as LegendUtil from "powerbi-visuals-utils-chartutils";

// powerbi.extensibility.utils.color
import {ColorHelper} from "powerbi-visuals-utils-colorutils";

// powerbi.extensibility.utils.tooltip
import {createTooltipServiceWrapper, ITooltipServiceWrapper} from "powerbi-visuals-utils-tooltiputils";

import {AsterPlotConverterService} from "./services/asterPlotConverterService";

import {AsterPlotColumns} from "./asterPlotColumns";

import {BehaviorOptions, Behavior} from "./behavior";

import {AsterDataPoint, AsterPlotData} from "./dataInterfaces";

import {VisualLayout} from "./visualLayout";

import {DataRenderService} from "./services/dataRenderService";

import { legend as LegendModule, legendInterfaces } from "powerbi-visuals-utils-chartutils";
import createLegend = LegendModule.createLegend;
import LegendPosition = legendInterfaces.LegendPosition;
import LegendDataPoint = legendInterfaces.LegendDataPoint;

import "../style/asterPlot.less";
import {FormattingSettingsService} from "powerbi-visuals-utils-formattingmodel";
import {
    AsterPlotObjectNames,
    AsterPlotSettingsModel,
    labelReference,
    labelsReference,
    legendReference,
    outerLineReference,
    piesReference
} from "./asterPlotSettingsModel";

// OnObject
import {
    HtmlSubSelectableClass,
    HtmlSubSelectionHelper,
    SubSelectableDirectEdit as SubSelectableDirectEditAttr,
    SubSelectableDisplayNameAttribute,
    SubSelectableObjectNameAttribute
} from "powerbi-visuals-utils-onobjectutils"

// d3
import { select as d3Select, Selection as d3Selection } from "d3-selection";
import {PieArcDatum} from "d3-shape";

import IViewport = powerbi.IViewport;
import DataView = powerbi.DataView;
import IVisual = powerbi.extensibility.IVisual;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
// powerbi.extensibility.visual
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
// powerbi.visuals
import ISelectionId = powerbi.visuals.ISelectionId;
import translate = SVGUtil.manipulation.translate;
import ClassAndSelector = SVGUtil.CssConstants.ClassAndSelector;
import createClassAndSelector = SVGUtil.CssConstants.createClassAndSelector;
import ILegend = LegendUtil.legendInterfaces.ILegend;
import legendData = LegendUtil.legendData;
import dataLabelUtils = LegendUtil.dataLabelUtils;
import positionChartArea = LegendUtil.legend.positionChartArea;

import IVisualEventService = powerbi.extensibility.IVisualEventService;
import FormattingModel = powerbi.visuals.FormattingModel;
import VisualOnObjectFormatting = powerbi.extensibility.visual.VisualOnObjectFormatting;
import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import CustomVisualObject = powerbi.visuals.CustomVisualObject;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import DataViewObject = powerbi.DataViewObject;
import SubSelectableDirectEditStyle = powerbi.visuals.SubSelectableDirectEditStyle;
import SubSelectableDirectEdit = powerbi.visuals.SubSelectableDirectEdit;
import SubSelectionRegionOutlineFragment = powerbi.visuals.SubSelectionRegionOutlineFragment;
import SubSelectionOutlineType = powerbi.visuals.SubSelectionOutlineType;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import VisualShortcutType = powerbi.visuals.VisualShortcutType;
const AsterPlotVisualClassName: string = "asterPlot";


const TitleEdit: SubSelectableDirectEdit = {
    reference: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "titleText"
    },
    style: SubSelectableDirectEditStyle.HorizontalLeft,
};

export class AsterPlot implements IVisual {
    private static AsterSlices: ClassAndSelector = createClassAndSelector("asterSlices");
    private static AsterSlice: ClassAndSelector = createClassAndSelector("asterSlice");
    private static AsterHighlightedSlice: ClassAndSelector = createClassAndSelector("asterHighlightedSlice");
    private static OuterLine: ClassAndSelector = createClassAndSelector("outerLine");
    private static LineLabel: ClassAndSelector = createClassAndSelector("line-label")
    private static CenterLabelClass: ClassAndSelector = createClassAndSelector("centerLabel");
    private static LegendTitleSelector: ClassAndSelector = createClassAndSelector("legendTitle");
    private static LegendItemSelector: ClassAndSelector = createClassAndSelector("legendItem");
    private static LegendIconSelector: ClassAndSelector = createClassAndSelector("legendIcon");

    private events: IVisualEventService;

    private layout: VisualLayout;
    private rootElement: HTMLElement;
    private svg: d3Selection<SVGSVGElement, null, HTMLElement, null>;
    private mainGroupElement: d3Selection<SVGGElement, null, HTMLElement, null>;
    private mainLabelsElement: d3Selection<SVGGElement, null, HTMLElement, null>;
    private slicesElement: d3Selection<SVGGElement, null, HTMLElement, null>;
    private legendElement: d3Selection<SVGSVGElement, null, HTMLElement, null>;
    private legendGroup: d3Selection<SVGGElement, null, HTMLElement, null>;
    private legendItems: d3Selection<SVGGElement, LegendDataPoint, SVGGElement, null>;

    private colorPalette: ISandboxExtendedColorPalette;
    private colorHelper: ColorHelper;

    private visualHost: IVisualHost;
    private localizationManager: ILocalizationManager;
    private selectionManager: ISelectionManager;
    private formattingSettingsService: FormattingSettingsService;

    private subSelectionHelper: HtmlSubSelectionHelper;
    private formatMode: boolean = false;
    private visualTitleEditSubSelection = JSON.stringify(TitleEdit);

    private renderService: DataRenderService;

    private legend: ILegend;

    private behavior: Behavior;

    private tooltipServiceWrapper: ITooltipServiceWrapper;

    public visualOnObjectFormatting: VisualOnObjectFormatting;

    // public for tests
    public data: AsterPlotData;
    public formattingSettings: AsterPlotSettingsModel;

    constructor(options: VisualConstructorOptions) {
        this.events = options.host.eventService;
        this.visualHost = options.host;
        this.localizationManager = this.visualHost.createLocalizationManager();
        this.selectionManager = this.visualHost.createSelectionManager();
        this.formattingSettingsService = new FormattingSettingsService(this.localizationManager);
        this.rootElement = options.element;

        this.subSelectionHelper = HtmlSubSelectionHelper.createHtmlSubselectionHelper({
            hostElement: options.element,
            subSelectionService: options.host.subSelectionService,
            selectionIdCallback: (e) => this.selectionIdCallback(e),
            customOutlineCallback: (e) => this.customOutlineCallback(e),
        });

        this.visualOnObjectFormatting = {
            getSubSelectionStyles: (subSelections) => this.getSubSelectionStyles(subSelections),
            getSubSelectionShortcuts: (subSelections) => this.getSubSelectionShortcuts(subSelections),
            getSubSelectables: (filter) => this.getSubSelectables(filter),
        };

        this.tooltipServiceWrapper = createTooltipServiceWrapper(
            this.visualHost.tooltipService,
            options.element);

        this.layout = new VisualLayout(null, {
            top: 10,
            right: 10,
            bottom: 15,
            left: 10
        });

        const rootElement: d3Selection<HTMLElement, null, HTMLElement, null> = d3Select(options.element);

        const svg = this.svg = rootElement
            .append("svg")
            .classed(AsterPlotVisualClassName, true);

        this.colorPalette = options.host.colorPalette;
        this.colorHelper = new ColorHelper(this.colorPalette);
        this.mainGroupElement = svg.append("g").attr("id", "mainGroup");
        this.mainLabelsElement = svg.append("g").attr("id", "mainLabels");

        this.behavior = new Behavior(this.colorHelper, this.selectionManager);

        this.slicesElement = this.mainGroupElement
            .append("g")
            .classed(AsterPlot.AsterSlices.className, true)
            .attr("role", "listbox")
            .attr("aria-multiselectable", "true");

        this.legend = createLegend(options.element, true);

        this.legendElement = rootElement.select<SVGSVGElement>("svg.legend");
        this.legendGroup = this.legendElement.selectChild<SVGGElement>("g#legendGroup");
        this.legendItems = this.legendGroup.selectChildren<SVGGElement, null>(AsterPlot.LegendItemSelector.selectorName);
    }

    public static converter(dataView: DataView, settings: AsterPlotSettingsModel, colors: ISandboxExtendedColorPalette, colorHelper: ColorHelper, visualHost: IVisualHost, localizationManager: ILocalizationManager): AsterPlotData {
        const categorical = AsterPlotColumns.getCategoricalColumns(dataView);

        if (!AsterPlotConverterService.isDataValid(categorical)) {
            return;
        }

        settings.parse(colors, categorical.Category.source.displayName);

        const converterService: AsterPlotConverterService = new AsterPlotConverterService(dataView, settings, colors, visualHost, categorical);

        return converterService.getConvertedData(localizationManager);
    }

    private areValidOptions(options: VisualUpdateOptions): boolean {
        return !!options && options.dataViews !== undefined && options.dataViews !== null && options.dataViews.length > 0 && options.dataViews[0] !== null;
    }

    private applySelectionStateToData(): void {
        this.behavior.setSelectedToDataPointsDefault(
            this.data.dataPoints.concat(this.data.highlightedDataPoints),
            this.data.hasHighlights
        );
    }

    public update(options: VisualUpdateOptions): void {
        this.events.renderingFinished(options);
        this.visualHost.eventService.renderingStarted(options);
        try {
            if (!this.areValidOptions(options)) {
                return;
            }

            this.formatMode = options.formatMode ?? false;
            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(AsterPlotSettingsModel, options.dataViews[0]);

            const data: AsterPlotData = AsterPlot.converter(
                options.dataViews[0],
                this.formattingSettings,
                this.colorPalette,
                this.colorHelper,
                this.visualHost,
                this.localizationManager,
            );
            if (!data) {
                this.clear();
                return;
            }

            this.formattingSettings.populatePies(data.dataPoints);

            this.layout.viewport = options.viewport;
            this.data = data;

            this.applySelectionStateToData();
            this.renderLegend();
            this.updateViewPortAccordingToLegend();
            this.transformAndResizeMainSvgElements();

            dataLabelUtils.cleanDataLabels(this.mainLabelsElement, true);

            this.renderService = new DataRenderService(data,
                this.formattingSettings,
                this.layout,
                this.tooltipServiceWrapper,
                this.localizationManager,
                this.formatMode);

            this.renderService.renderArcs(this.slicesElement, false);

            if (!this.data.hasHighlights) {
                this.removeHighlightedSlice();
            } else {
                this.renderService.renderArcs(this.slicesElement, true);
            }

            if (this.formattingSettings.labels.show.value) {
                this.renderService.renderLabels(this.mainLabelsElement, this.data.hasHighlights);
            } else {
                this.renderService.cleanLabels(this.mainLabelsElement);
            }

            if (this.formattingSettings.label.show.value) {
                this.renderService.drawCenterText(this.mainGroupElement);
            } else {
                this.renderService.cleanCenterText(this.mainGroupElement);
            }
            if (this.formattingSettings.outerLine.show.value) {
                this.renderService.drawOuterLines(this.mainGroupElement);
            } else {
                this.renderService.cleanOuterLines(this.mainGroupElement);
            }

            this.bindBehaviorOptions();

            this.subSelectionHelper.setFormatMode(options.formatMode);
            const shouldUpdateSubSelection = options.type & (powerbi.VisualUpdateType.Data
                | powerbi.VisualUpdateType.Resize
                | powerbi.VisualUpdateType.FormattingSubSelectionChange);
            if (this.formatMode && shouldUpdateSubSelection) {
                this.subSelectionHelper.updateOutlinesFromSubSelections(options.subSelections, true);
            }


            this.events.renderingFinished(options);
        }
        catch (e) {
            this.events.renderingFailed(options, e);
            console.log(e);
        }
    }

    private removeHighlightedSlice(): void {
        this.slicesElement.selectAll(AsterPlot.AsterHighlightedSlice.selectorName).remove();
    }

    private transformAndResizeMainSvgElements() {
        this.svg
            .attr("width", PixelConverter.toString(this.layout.viewport.width))
            .attr("height", PixelConverter.toString(this.layout.viewport.height));

        const transformX: number = (this.layout.viewportIn.width + this.layout.margin.right) / 2;
        const transformY: number = (this.layout.viewportIn.height + this.layout.margin.bottom) / 2;

        this.mainGroupElement
            .attr("transform", translate(transformX, transformY))

        this.mainLabelsElement
            .attr("transform", translate(transformX, transformY));
    }

    private bindBehaviorOptions(): void {
        const behaviorOptions: BehaviorOptions = {
            selection: this.slicesElement.selectAll(AsterPlot.AsterSlice.selectorName + ", " + AsterPlot.AsterHighlightedSlice.selectorName),
            legend: this.legendElement,
            legendItems: this.legendItems,
            legendIcons: <d3Selection<SVGElement, LegendDataPoint, null, undefined>>this.legendElement.selectAll(AsterPlot.LegendIconSelector.selectorName),
            clearCatcher: this.svg,
            hasHighlights: this.data.hasHighlights,
            dataPoints: this.data.dataPoints,
            formatMode: this.formatMode,
        };
        this.behavior.bindEvents(behaviorOptions);
    }

    private renderLegend(): void {
        const legendObject: DataViewObject = {
            show: this.formattingSettings.legend.show.value,
            showTitle: this.formattingSettings.legend.showTitle.value,
            position: LegendPosition[this.formattingSettings.legend.position.value.value],
        };

        legendData.update(this.data.legendData, legendObject);
        this.legend.changeOrientation(LegendPosition[this.formattingSettings.legend.position.value.value]);
        this.legend.drawLegend(this.data.legendData, this.layout.viewportCopy);
        positionChartArea(this.svg, this.legend);
        this.legendItems = this.legendGroup.selectAll(AsterPlot.LegendItemSelector.selectorName);

        this.legendGroup
            .classed(HtmlSubSelectableClass, this.formatMode && this.formattingSettings.legend.show.value)
            .attr(SubSelectableObjectNameAttribute, AsterPlotObjectNames.Legend.name)
            .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName(AsterPlotObjectNames.Legend.displayName));

        this.legendGroup
            .select(AsterPlot.LegendTitleSelector.selectorName)
            .classed(HtmlSubSelectableClass, this.formatMode && this.formattingSettings.legend.show.value && Boolean(this.formattingSettings.legend.titleText.value))
            .attr(SubSelectableObjectNameAttribute, AsterPlotObjectNames.LegendTitle.name)
            .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName(AsterPlotObjectNames.LegendTitle.displayNameKey))
            .attr(SubSelectableDirectEditAttr, this.visualTitleEditSubSelection);
    }

    private updateViewPortAccordingToLegend(): void {
        if (!this.formattingSettings.legend.show.value) {
            return;
        }

        const legendMargins: IViewport = this.legend.getMargins();
        const legendPosition: LegendPosition = LegendPosition[this.formattingSettings.legend.position.value.value];

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

    public getFormattingModel(): FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    private selectionIdCallback(e: HTMLElement) {
        const elementType: string = d3Select(e).attr(SubSelectableObjectNameAttribute);

        switch (elementType) {
            case AsterPlotObjectNames.Pies.name: {
                const datum = d3Select<Element, PieArcDatum<AsterDataPoint>>(e).datum();
                return datum?.data.identity;
            }
            default:
                return undefined;
        }
    }

    private customOutlineCallback(subSelection: powerbi.visuals.CustomVisualSubSelection) {
        const elementType: string = subSelection?.customVisualObjects[0]?.objectName;

        switch (elementType) {
            case AsterPlotObjectNames.Pies.name: {
                const selectionId: ISelectionId = subSelection.customVisualObjects[0].selectionId;
                if (!selectionId) {
                    return undefined;
                }

                const selectedDataPoint = this.renderService
                    .getDataPoints(this.data.hasHighlights)
                    .find((d) => d.data.identity.equals(selectionId))

                if (!selectedDataPoint) {
                    return undefined;
                }

                const actualDataPoint = selectedDataPoint as unknown as PieArcDatum<AsterDataPoint>;

                const svgRect = this.mainGroupElement.node().getBBox();
                const x = svgRect.width / 2 - this.layout.margin.top / 2;
                let y = svgRect.height / 2 - this.layout.margin.left / 2;

                if (!this.legendElement.empty() && this.formattingSettings.legend.show.value) {
                    const height: number = Number(this.legendElement.attr("height")) || 0;
                    y += height;
                }

                const outlines: SubSelectionRegionOutlineFragment[] = [{
                    id: AsterPlotObjectNames.Pies.name,
                    outline: {
                        type: SubSelectionOutlineType.Arc,
                        center: { x, y },
                        startAngle: actualDataPoint.startAngle,
                        endAngle: actualDataPoint.endAngle,
                        innerRadius: this.renderService.innerRadius,
                        outerRadius: this.renderService.computeOuterRadius(selectedDataPoint),
                    }
                }];

                return outlines;
            }
            case AsterPlotObjectNames.OuterLine.name: {
                const firstDataPoint = this.renderService.getDataPoints(this.data.hasHighlights)[0];

                if (!firstDataPoint) {
                    return undefined;
                }

                const svgRect = this.mainGroupElement.node().getBBox();
                const x = svgRect.width / 2 - this.layout.margin.top / 2;
                let y = svgRect.height / 2 - this.layout.margin.left / 2;

                if (!this.legendElement.empty() && this.formattingSettings.legend.show.value) {
                    const height: number = Number(this.legendElement.attr("height")) || 0;
                    y += height;
                }

                const outlines: powerbi.visuals.SubSelectionRegionOutlineFragment[] = [{
                    id: AsterPlotObjectNames.OuterLine.name,
                    outline: {
                        type: SubSelectionOutlineType.Arc,
                        center: { x, y },
                        startAngle: 0,
                        endAngle: 360,
                        innerRadius: this.renderService.outerRadius,
                        outerRadius: this.renderService.outerRadius,
                    }
                }];

                return outlines;
            }
            default:
                return undefined;
        }
    }

    private getSubSelectionStyles(subSelections: CustomVisualSubSelection[]) {
        const visualObjects = subSelections[0]?.customVisualObjects;
        if (!visualObjects) {
            return undefined;
        }

        let visualObject: CustomVisualObject;
        if (visualObjects.length > 0 && visualObjects[0] != null) {
            visualObject = visualObjects[0];
        } else {
            return undefined;
        }

        switch (visualObject.objectName) {
            case AsterPlotObjectNames.Legend.name:
                return this.getLegendStyles();
            case AsterPlotObjectNames.Label.name:
                return this.getLabelStyles();
            case AsterPlotObjectNames.Labels.name:
                return this.getLabelsStyles();
            case AsterPlotObjectNames.Pies.name:
                return this.getPiesStyles(subSelections);
            case AsterPlotObjectNames.OuterLine.name:
                return this.getOuterLineStyles();
            default:
                return undefined;
        }
    }

    private getSubSelectionShortcuts(subSelections: powerbi.visuals.CustomVisualSubSelection[]) {
        const visualObjects = subSelections[0]?.customVisualObjects;
        if (!visualObjects) {
            return undefined;
        }

        let visualObject: CustomVisualObject;
        if (visualObjects.length > 0 && visualObjects[0] != null) {
            visualObject = visualObjects[0];
        } else {
            return undefined;
        }

        switch (visualObject.objectName) {
            case AsterPlotObjectNames.Legend.name:
                return this.getLegendShortcuts();
            case AsterPlotObjectNames.Label.name:
                return this.getLabelShortcuts();
            case AsterPlotObjectNames.Labels.name:
                return this.getLabelsShortcuts();
            case AsterPlotObjectNames.Pies.name:
                return this.getPiesShortcuts(subSelections);
            case AsterPlotObjectNames.OuterLine.name:
                return this.getOuterLineShortcuts();
            default:
                return undefined;
        }
    }

    private getSubSelectables(filter: powerbi.visuals.SubSelectionStylesType): CustomVisualSubSelection[] | undefined {
        return this.subSelectionHelper.getAllSubSelectables(filter);
    }

    private getLegendStyles(): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                    ...legendReference.labelColor,
                },
                label: this.localizationManager.getDisplayName("Visual_Color"),
            }
        }
    }

    private getLabelStyles(): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Text,
            fontFamily: {
                reference: { ...labelReference.fontFamily },
                label: labelReference.fontFamily.propertyName
            },
            bold: {
                reference: { ...labelReference.bold },
                label: labelReference.bold.propertyName
            },
            italic: {
                reference: { ...labelReference.italic },
                label: labelReference.italic.propertyName
            },
            underline: {
                reference: { ...labelReference.underline },
                label: labelReference.underline.propertyName
            },
            fontSize: {
                reference: { ...labelReference.fontSize },
                label: labelReference.fontSize.propertyName
            },
            fontColor: {
                reference: { ...labelReference.color },
                label: labelReference.color.propertyName
            },
        }
    }

    private getLabelsStyles(): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Text,
            fontFamily: {
                reference: { ...labelsReference.fontFamily },
                label: labelsReference.fontFamily.propertyName
            },
            bold: {
                reference: { ...labelsReference.bold },
                label: labelsReference.bold.propertyName
            },
            italic: {
                reference: { ...labelsReference.italic },
                label: labelsReference.italic.propertyName
            },
            underline: {
                reference: { ...labelsReference.underline },
                label: labelsReference.underline.propertyName
            },
            fontSize: {
                reference: { ...labelsReference.fontSize },
                label: labelsReference.fontSize.propertyName
            },
            fontColor: {
                reference: { ...labelsReference.color },
                label: labelsReference.color.propertyName
            },
        }
    }

    private getPiesStyles(subSelections: CustomVisualSubSelection[]): SubSelectionStyles {
        const selector = subSelections[0]?.customVisualObjects[0]?.selectionId?.getSelector();

        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                    ...piesReference.fill,
                    selector,
                },
                label: this.localizationManager.getDisplayName("Visual_Fill"),
            }
        }
    }

    private getOuterLineStyles(): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: { ...outerLineReference.fill },
                label: this.localizationManager.getDisplayName("Visual_Fill"),
            }
        }
    }


    private getLegendShortcuts(): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    legendReference.show,
                    legendReference.position,
                    legendReference.labelColor,
                    legendReference.fontSize,
                    legendReference.fontFamily,
                    legendReference.bold,
                    legendReference.italic,
                    legendReference.underline,
                ],
            },
            {
                type: VisualShortcutType.Picker,
                ...legendReference.position,
                label: this.localizationManager.getDisplayName("Visual_Position"),
            },
            {
                type: VisualShortcutType.Toggle,
                ...legendReference.show,
                enabledLabel: this.localizationManager.getDisplayName("Visual_OnObject_ShowLegend"),
                disabledLabel: this.localizationManager.getDisplayName("Visual_OnObject_HideLegend"),
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: legendReference.cardUid },
                label: this.localizationManager.getDisplayName("Visual_OnObject_FormatLegend"),
            }
        ];
    }

    private getLabelShortcuts(): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    labelReference.show,
                    labelReference.fontFamily,
                    labelReference.bold,
                    labelReference.italic,
                    labelReference.underline,
                    labelReference.fontSize,
                    labelReference.color
                ],
            },
            {
                type: VisualShortcutType.Toggle,
                ...labelReference.show,
                enabledLabel: this.localizationManager.getDisplayName("Visual_OnObject_ShowCenterLabel"),
                disabledLabel: this.localizationManager.getDisplayName("Visual_OnObject_HideCenterLabel"),
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: labelReference.cardUid },
                label: this.localizationManager.getDisplayName("Visual_OnObject_FormatCenterLabel"),
            }
        ];
    }

    private getLabelsShortcuts(): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    labelsReference.show,
                    labelsReference.color,
                    labelsReference.displayUnits,
                    labelsReference.precision,
                    labelsReference.fontFamily,
                    labelsReference.bold,
                    labelsReference.italic,
                    labelsReference.underline,
                    labelsReference.fontSize,
                ],
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: labelsReference.cardUid },
                label: this.localizationManager.getDisplayName("Visual_OnObject_FormatLabels"),
            }
        ];
    }

    private getPiesShortcuts(subSelections: CustomVisualSubSelection[]): VisualSubSelectionShortcuts {
        const selector = subSelections[0]?.customVisualObjects[0]?.selectionId?.getSelector();
        return [
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [{
                    ...piesReference.fill,
                    selector,
                }],
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: piesReference.cardUid },
                label: this.localizationManager.getDisplayName("Visual_OnObject_FormatPies"),
            },
        ];
    }


    private getOuterLineShortcuts(): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    outerLineReference.fill,
                ],
            },
            {
                type: VisualShortcutType.Toggle,
                ...outerLineReference.showGrid,
                enabledLabel: this.localizationManager.getDisplayName("Visual_ShowGrid"),
                disabledLabel: this.localizationManager.getDisplayName("Visual_HideGrid"),
            },
            {
                type: VisualShortcutType.Toggle,
                ...outerLineReference.showGridTicksValues,
                enabledLabel: this.localizationManager.getDisplayName("Visual_ShowGridTicksValues"),
                disabledLabel: this.localizationManager.getDisplayName("Visual_HideGridTicksValues"),
            },
            {
                type: VisualShortcutType.Toggle,
                ...outerLineReference.showStraightLines,
                enabledLabel: this.localizationManager.getDisplayName("Visual_ShowStraightLines"),
                disabledLabel: this.localizationManager.getDisplayName("Visual_HideStraightLines"),
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: outerLineReference.cardUid },
                label: this.localizationManager.getDisplayName("Visual_OnObject_FormatOuterLine"),
            }
        ];
    }
}

