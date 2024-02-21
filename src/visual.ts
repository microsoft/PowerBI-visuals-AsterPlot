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
import {select} from "d3";
// powerbi
// tslint:disable-next-line
import powerbi from "powerbi-visuals-api";

// powerbi.extensibility.utils.svg
import * as SVGUtil from "powerbi-visuals-utils-svgutils";

// powerbi.extensibility.utils.type
import {pixelConverter as PixelConverter} from "powerbi-visuals-utils-typeutils";

// powerbi.extensibility.utils.chart
import * as LegendUtil from "powerbi-visuals-utils-chartutils";

// powerbi.extensibility.utils.interactivity
import {interactivityBaseService, interactivitySelectionService} from "powerbi-visuals-utils-interactivityutils";

// powerbi.extensibility.utils.color
import {ColorHelper} from "powerbi-visuals-utils-colorutils";

// powerbi.extensibility.utils.tooltip
import {createTooltipServiceWrapper, ITooltipServiceWrapper} from "powerbi-visuals-utils-tooltiputils";

import {AsterPlotConverterService} from "./services/asterPlotConverterService";

import {AsterPlotColumns} from "./asterPlotColumns";

import {AsterPlotBehaviorOptions, AsterPlotWebBehavior} from "./behavior";

import {AsterDataPoint, AsterPlotData} from "./dataInterfaces";

import {VisualLayout} from "./visualLayout";

import {DataRenderService} from "./services/dataRenderService";

import {LegendPosition} from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";
import {createLegend} from "powerbi-visuals-utils-chartutils/lib/legend/legend";
import {isEmpty} from "lodash-es";
import "../style/asterPlot.less";
import {FormattingSettingsService} from "powerbi-visuals-utils-formattingmodel";
import {AsterPlotObjectNames, AsterPlotSettingsModel} from "./asterPlotSettingsModel";

// OnObject
import {
    HtmlSubSelectableClass,
    HtmlSubSelectionHelper,
    SubSelectableDirectEdit as SubSelectableDirectEditAttr,
    SubSelectableDisplayNameAttribute,
    SubSelectableObjectNameAttribute
} from "powerbi-visuals-utils-onobjectformatting/src"

type Selection<T> = d3.Selection<any, T, any, any>;
import IViewport = powerbi.IViewport;
import DataView = powerbi.DataView;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
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
import translate = SVGUtil.manipulation.translate;
import ClassAndSelector = SVGUtil.CssConstants.ClassAndSelector;
import createClassAndSelector = SVGUtil.CssConstants.createClassAndSelector;
import ILegend = LegendUtil.legendInterfaces.ILegend;
import legendData = LegendUtil.legendData;
import dataLabelUtils = LegendUtil.dataLabelUtils;
import positionChartArea = LegendUtil.legend.positionChartArea;
import appendClearCatcher = interactivityBaseService.appendClearCatcher;
import createInteractivitySelectionService = interactivitySelectionService.createInteractivitySelectionService;
import IInteractivityService = interactivityBaseService.IInteractivityService;
import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;

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
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import FormattingId = powerbi.visuals.FormattingId;
import VisualShortcutType = powerbi.visuals.VisualShortcutType;

const AsterPlotVisualClassName: string = "asterPlot";

const legendReference: {
    cardUid: string;
    groupUid: string;
    show: FormattingId;
    position: FormattingId;
    titleText: FormattingId;
    labelColor: FormattingId;
    fontSize: FormattingId;
} = {
    cardUid: "Visual-legend-card",
    groupUid: "legend-group",
    show: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "show",
    },
    position: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "position",
    },
    titleText: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "titleText",
    },
    labelColor: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "labelColor"
    },
    fontSize: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "fontSize"
    },
};

const labelReference: {
    cardUid: string;
    groupUid: string;
    show: FormattingId;
    fontFamily: FormattingId;
    bold: FormattingId;
    italic: FormattingId;
    underline: FormattingId;
    fontSize: FormattingId;
    color: FormattingId;
} = {
    cardUid: "Visual-label-card",
    groupUid: "label-group",
    show: {
        objectName: AsterPlotObjectNames.Label.name,
        propertyName: "show"
    },
    fontFamily: {
        objectName: AsterPlotObjectNames.Label.name,
        propertyName: "fontFamily"
    },
    bold: {
        objectName: AsterPlotObjectNames.Label.name,
        propertyName: "fontBold"
    },
    italic: {
        objectName: AsterPlotObjectNames.Label.name,
        propertyName: "fontItalic"
    },
    underline: {
        objectName: AsterPlotObjectNames.Label.name,
        propertyName: "fontUnderline"
    },
    fontSize: {
        objectName: AsterPlotObjectNames.Label.name,
        propertyName: "fontSize"
    },
    color: {
        objectName: AsterPlotObjectNames.Label.name,
        propertyName: "color"
    },
};

const labelsReference: {
    cardUid: string;
    groupUid: string;
    show: FormattingId;
    color: FormattingId;
    displayUnits: FormattingId;
    precision: FormattingId;
    fontFamily: FormattingId;
    bold: FormattingId;
    italic: FormattingId;
    underline: FormattingId;
    fontSize: FormattingId;
} = {
    cardUid: "Visual-labels-card",
    groupUid: "labels-group",
    show: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: "show"
    },
    color: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: "color"
    },
    displayUnits: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: "displayUnits"
    },
    precision: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: "precision"
    },
    fontFamily: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: "fontFamily"
    },
    bold: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: "fontBold"
    },
    italic: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: "fontItalic"
    },
    underline: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: "fontUnderline"
    },
    fontSize: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: "fontSize"
    },
}


const TitleEdit: SubSelectableDirectEdit = {
    reference: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "titleText"
    },
    style: SubSelectableDirectEditStyle.HorizontalLeft,
};

// tslint:disable-next-line: export-name
export class AsterPlot implements IVisual {
    private static AsterSlices: ClassAndSelector = createClassAndSelector("asterSlices");
    private static AsterSlice: ClassAndSelector = createClassAndSelector("asterSlice");
    private static AsterHighlightedSlice: ClassAndSelector = createClassAndSelector("asterHighlightedSlice");
    private static OuterLine: ClassAndSelector = createClassAndSelector("outerLine");
    private static CenterLabelClass: ClassAndSelector = createClassAndSelector("centerLabel");
    private static LegendTitleSelector: ClassAndSelector = createClassAndSelector("legendTitle");

    private events: IVisualEventService;

    private layout: VisualLayout;

    private static PiesPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "pies",
        propertyName: "fill",
    };

    private svg: Selection<any>;
    private mainGroupElement: Selection<any>;
    private mainLabelsElement: Selection<any>;
    private slicesElement: Selection<AsterPlotData>;
    private clearCatcher: Selection<any>;
    private legendElement: Selection<any>;

    private colorPalette: IColorPalette;
    private colorHelper: ColorHelper;

    private visualHost: IVisualHost;
    private localizationManager: ILocalizationManager;
    private formattingSettingsService: FormattingSettingsService;
    private formattingSettings: AsterPlotSettingsModel;
    private interactivityService: IInteractivityService<any>;
    private subSelectionHelper: HtmlSubSelectionHelper;
    private formatMode: boolean = false;
    private visualTitleEditSubSelection = JSON.stringify(TitleEdit);
    public visualOnObjectFormatting: VisualOnObjectFormatting;

    private renderService: DataRenderService;

    private legend: ILegend;
    private data: AsterPlotData;

    private behavior: IInteractiveBehavior;

    private tooltipServiceWrapper: ITooltipServiceWrapper;

    constructor(options: VisualConstructorOptions) {
        this.events = options.host.eventService;
        this.visualHost = options.host;
        this.localizationManager = this.visualHost.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(this.localizationManager);

        this.subSelectionHelper = HtmlSubSelectionHelper.createHtmlSubselectionHelper({
            hostElement: options.element,
            subSelectionService: options.host.subSelectionService,
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

        const svg: Selection<any> = this.svg = d3.select(options.element)
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
            .attr("role", "listbox")
            .attr("aria-multiselectable", "true")
            .classed(AsterPlot.AsterSlices.className, true);

        this.interactivityService = createInteractivitySelectionService(options.host);

        this.legend = createLegend(
            options.element,
            options.host && false,
            this.interactivityService,
            true);

        this.legendElement = select(options.element).select("g#legendGroup");
    }

    // tslint:disable-next-line: function-name
    public static converter(dataView: DataView, settings: AsterPlotSettingsModel, colors: IColorPalette, colorHelper: ColorHelper, visualHost: IVisualHost, localizationManager: ILocalizationManager): AsterPlotData {
        const categorical = <any>AsterPlotColumns.getCategoricalColumns(dataView);

        if (!AsterPlotConverterService.isDataValid(categorical)) {
            return;
        }

        AsterPlot.setHighContrastColors(settings, categorical.Category.source, colorHelper);
        const converterService: AsterPlotConverterService = new AsterPlotConverterService(dataView, settings, colors, visualHost, categorical);

        return converterService.getConvertedData(localizationManager);
    }

    private static setHighContrastColors(settings: AsterPlotSettingsModel, categorySource: DataViewMetadataColumn, colorHelper: ColorHelper): void {
        settings.legend.labelColor.value.value = colorHelper.getHighContrastColor("foreground", settings.legend.labelColor.value.value);
        settings.label.color.value.value = colorHelper.getHighContrastColor("foreground", settings.label.color.value.value);
        settings.labels.color.value.value = colorHelper.getHighContrastColor("foreground", settings.labels.color.value.value);
        settings.outerLine.color.value.value = colorHelper.getHighContrastColor("foreground", settings.outerLine.color.value.value);
        settings.outerLine.textColor.value.value = colorHelper.getHighContrastColor("foreground", settings.outerLine.textColor.value.value);

        if (isEmpty(settings.legend.titleText.value)) {
            settings.legend.titleText.value = categorySource.displayName;
        }
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
        this.events.renderingFinished(options);
        this.visualHost.eventService.renderingStarted(options);
        try {
            if (!this.areValidOptions(options)) {
                return;
            }

            this.formatMode = options.formatMode ?? false;
            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(AsterPlotSettingsModel, options.dataViews[0]);
            this.formattingSettings.setLocalizedOptions(this.localizationManager);

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

            // this.formattingSettings.populatePies(data.dataPoints, this.colorHelper.isHighContrast);

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

            this.bindInteractivityBehaviour();

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

        // Move back the clearCatcher
        this.clearCatcher.attr("transform", translate(-transformX, -transformY));
    }

    private bindInteractivityBehaviour(): void {
        if (this.interactivityService) {
            const behaviorOptions: AsterPlotBehaviorOptions = {
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
        if (this.formattingSettings.legend.show.value) {
            const legendObject: DataViewObject = {
                labelColor: {
                    solid: {
                        color: this.formattingSettings.legend.labelColor.value.value
                    }
                },
                titleText: this.formattingSettings.legend.titleText.value,
                fontSize: this.formattingSettings.legend.fontSize.value,
            };

            legendData.update(this.data.legendData, legendObject);
            this.legend.changeOrientation(LegendPosition[this.formattingSettings.legend.position.value.value]);
        }

        this.legend.drawLegend(this.data.legendData, this.layout.viewportCopy);
        positionChartArea(this.svg, this.legend);

        this.legendElement
            .classed(HtmlSubSelectableClass, this.formatMode && this.formattingSettings.legend.show.value)
            .attr(SubSelectableObjectNameAttribute, AsterPlotObjectNames.Legend.name)
            .attr(SubSelectableDisplayNameAttribute, AsterPlotObjectNames.Legend.displayName);

        this.legendElement
            .select(AsterPlot.LegendTitleSelector.selectorName)
            .classed(HtmlSubSelectableClass, this.formatMode && this.formattingSettings.legend.show.value && Boolean(this.formattingSettings.legend.titleText.value))
            .attr(SubSelectableObjectNameAttribute, AsterPlotObjectNames.LegendTitle.name)
            .attr(SubSelectableDisplayNameAttribute, AsterPlotObjectNames.LegendTitle.displayName)
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

    /* This function returns the values to be displayed in the property pane for each object.
     * Usually it is a bind pass of what the property pane gave you, but sometimes you may want to do
     * validation and return other values/defaults
     */
    // public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
    //     const instanceEnumeration: VisualObjectInstanceEnumeration =
    //         AsterPlotSettings.enumerateObjectInstances(
    //             this.settings || AsterPlotSettings.getDefault(),
    //             options);
    //
    //     if (options.objectName === AsterPlot.PiesPropertyIdentifier.objectName) {
    //         this.enumeratePies(instanceEnumeration);
    //     }
    //
    //     return instanceEnumeration || [];
    // }

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

        const objectInstanceEnumeration: VisualObjectInstanceEnumerationObject = <VisualObjectInstanceEnumerationObject>instanceEnumeration;

        if (objectInstanceEnumeration.instances) {
            objectInstanceEnumeration
                .instances
                .push(instance);
        } else {
            (<VisualObjectInstance[]>instanceEnumeration).push(instance);
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

    private getLegendShortcuts(): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [legendReference.show, legendReference.position, legendReference.labelColor],
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
}

