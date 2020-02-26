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

// powerbi
import powerbi from "powerbi-visuals-api";
import IViewport = powerbi.IViewport;
import DataView = powerbi.DataView;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import IVisual = powerbi.extensibility.IVisual;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import DataViewValueColumns = powerbi.DataViewValueColumns;

// powerbi.extensibility.utils.formatting
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import IValueFormatter = valueFormatter.IValueFormatter;

// powerbi.extensibility.utils.type
import { pixelConverter as PixelConverter  } from "powerbi-visuals-utils-typeutils";

import IDataColorPalette = powerbi.extensibility.IColorPalette;

// powerbi.extensibility.utils.color
import { ColorHelper } from "powerbi-visuals-utils-colorutils";


// powerbi.extensibility.utils.chart
import * as LegendUtil from "powerbi-visuals-utils-chartutils";
import ILegend = LegendUtil.legendInterfaces.ILegend;
import LegendDataModule = LegendUtil.legendData;
import LegendData = LegendUtil.legendInterfaces.LegendData;
// import LegendIcon = powerbi.extensibility.utils.chart.legend.LegendIcon;


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


// powerbi.extensibility.utils.interactivity
import { interactivityBaseService, interactivitySelectionService } from "powerbi-visuals-utils-interactivityutils";
import appendClearCatcher = interactivityBaseService.appendClearCatcher;
import createInteractivityService = interactivitySelectionService.createInteractivitySelectionService;
import IInteractivityService = interactivityBaseService.IInteractivityService;
import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;


// powerbi.extensibility.utils.tooltip
import {
    createTooltipServiceWrapper,
    ITooltipServiceWrapper,
} from "powerbi-visuals-utils-tooltiputils";
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import {
    AsterPlotColumns
} from "./../columns";

import {
    AsterPlotWebBehavior,
    AsterPlotBehaviorOptions
} from "./../behavior";

import {
    AsterDataPoint,
    AsterPlotData
} from "./../dataInterfaces";

import {
    VisualLayout
} from "./../visualLayout";

import {
    DataRenderService
} from "./../services/dataRenderService";

import {
    AsterPlotSettings,
    CentralLabelsSettings,
    LabelsSettings,
    LegendSettings,
    OuterLineSettings
} from "./../settings";

import {
    createTooltipData,
    createTooltipInfo
} from "./../tooltipBuilder";
import { LegendPosition } from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";
import { createLegend } from "powerbi-visuals-utils-chartutils/lib/legend/legend";
import _ = require("lodash");



const minStrokeWidth: number = 0;
const maxStrokeWidth: number = 3;

export class AsterPlotConverterService {
    private static PiesPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "pies",
        propertyName: "fill"
    };

    private dataView: DataView;
    private categoricalColumns: AsterPlotColumns<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns>;
    private categoricalValueColumns: AsterPlotColumns<any[]>;
    private settings: AsterPlotSettings;
    private visualHost: IVisualHost;

    private dataPoints: AsterDataPoint[];
    private highlightedDataPoints: AsterDataPoint[];
    private legendData: LegendData;
    private colorHelper: ColorHelper;
    private hasHighlights: boolean;

    private maxValue: number;
    private minValue: number;

    private labelFormatter: IValueFormatter;
    private fontSizeInPx: string;

    constructor(dataView: DataView,
        settings: AsterPlotSettings,
        colors: IDataColorPalette,
        visualHost: IVisualHost,
        categorical?: AsterPlotColumns<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns>) {
        this.dataView = dataView;
        //TODO Check this
        this.categoricalColumns = categorical ? categorical : <any>AsterPlotColumns.getCategoricalColumns(dataView);
        this.categoricalValueColumns = AsterPlotColumns.getCategoricalValues(dataView);
        this.settings = settings;
        this.colorHelper = new ColorHelper(colors, AsterPlotConverterService.PiesPropertyIdentifier, "");
        this.visualHost = visualHost;

        this.legendData = {
            dataPoints: [],
            title: null,
            fontSize: this.settings.legend.fontSize,
            labelColor: this.colorHelper.getHighContrastColor("foreground", LegendDataModule.DefaultLegendLabelFillColor)
        };

        this.hasHighlights = this.containsHighlights(this.categoricalColumns);
        this.maxValue = this.getMaxValue(this.categoricalColumns);
        this.minValue = this.getMinValue(this.categoricalColumns);
        this.labelFormatter = this.createFormatter(this.categoricalColumns.Y[0].source, settings.labels.precision, (settings.labels.displayUnits === 0) && (this.maxValue != null) ? this.maxValue : settings.labels.displayUnits);

        this.fontSizeInPx = PixelConverter.fromPoint(settings.labels.fontSize);

        this.dataPoints = [];
        this.highlightedDataPoints = [];
    }

    public static isDataValid(categorical: AsterPlotColumns<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns>): boolean {
        return categorical
            && categorical.Category
            && !_.isEmpty(categorical.Category.values)
            && !_.isEmpty(categorical.Y)
            && !_.isEmpty(categorical.Y[0].values);
    }

    private containsHighlights(categorical: AsterPlotColumns<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns>): boolean {
        return categorical && categorical.Y && categorical.Y[0] && !!(categorical.Y[0].highlights);
    }

    private containsCategoryOnly(categorical: AsterPlotColumns<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns>): boolean {
        return !categorical || !categorical.Y || !categorical.Y[0];
    }

    private getMinValue(categorical: AsterPlotColumns<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns>): number {
        return Math.min(0, d3.min(<number[]>categorical.Y[0].values));
    }

    private getMaxValue(categorical: AsterPlotColumns<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns>): number {
        return Math.max(d3.min(<number[]>categorical.Y[0].values));
    }

    private createFormatter(column: DataViewMetadataColumn, precision?: number, value?: number): IValueFormatter {
        return valueFormatter.create({
            format: valueFormatter.getFormatStringByColumn(column, true),
            precision: precision,
            value: value
        });
    }

    private isMoreThanOneMeasure(categoricalColumns: AsterPlotColumns<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns>) {
        return categoricalColumns.Y.length > 1;
    }

    private buildOneMeasureTooltip(formattedCategoryValue: any, value: number, localizationManager: ILocalizationManager): VisualTooltipDataItem[] {
        return createTooltipInfo(this.dataView.categorical, formattedCategoryValue, localizationManager, value, 0);
    }

    private buildTwoMeasuresTooltip(formattedCategoryValue: any, value: number, secondValue: number, localizationManager: ILocalizationManager): VisualTooltipDataItem[] {
        let tooltipInfo: VisualTooltipDataItem[] = this.buildOneMeasureTooltip(formattedCategoryValue, value, localizationManager);

        let toolTip: VisualTooltipDataItem = createTooltipInfo(
            this.dataView.categorical,
            formattedCategoryValue,
            localizationManager,
            secondValue,
            1)[1];

        if (toolTip) {
            tooltipInfo.push(toolTip);
        }

        return tooltipInfo;
    }

    public getConvertedData(localizationManager: ILocalizationManager): AsterPlotData {
        let categoryValue: any = this.categoricalValueColumns.Category,
            category: any = this.categoricalColumns.Category,
            values: number[] = <number[]>this.categoricalColumns.Y[0].values,
            categoricalColumns: AsterPlotColumns<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns> = this.categoricalColumns;

        for (let i = 0; i < categoryValue.length; i++) {
            let formattedCategoryValue = categoryValue[i],
                currentValue = values[i];

            let tooltipInfo: VisualTooltipDataItem[];

            if (this.isMoreThanOneMeasure(categoricalColumns)) {
                let secondMeasureValue: number = <number>categoricalColumns.Y[1].values[i];
                tooltipInfo = this.buildTwoMeasuresTooltip(formattedCategoryValue, currentValue, secondMeasureValue, localizationManager);

                currentValue += secondMeasureValue;
            } else {
                tooltipInfo = this.buildOneMeasureTooltip(formattedCategoryValue, currentValue, localizationManager);
            }

            let identity: any = category.identity[i], // TODO fix type
                fillColor: string,
                strokeColor: string,
                strokeWidth: number,
                sliceWidth: number;

            if (category.objects && category.objects[i]) {
                fillColor = this.colorHelper.getColorForMeasure(category.objects[i], "");
            } else {
                fillColor = this.colorHelper.getColorForMeasure(category.objects && category.objects[i], identity.key);
            }

            strokeColor = this.colorHelper.getHighContrastColor("foreground", fillColor);
            strokeWidth = this.colorHelper.isHighContrast ? maxStrokeWidth : minStrokeWidth;

            sliceWidth = Math.max(0, categoricalColumns.Y.length > 1 ? <number>categoricalColumns.Y[1].values[i] : 1);

            let selectionId: ISelectionId = this.visualHost.createSelectionIdBuilder()
                .withCategory(category, i)
                .withMeasure(category.source.queryName)
                .createSelectionId();

            if (sliceWidth > 0) {
                this.dataPoints.push({
                    sliceHeight: values[i] - this.minValue,
                    sliceWidth,
                    label: this.labelFormatter.format(<any>currentValue),
                    fillColor,
                    strokeColor,
                    strokeWidth,
                    identity: selectionId,
                    selected: false,
                    tooltipInfo,
                    labelFontSize: this.fontSizeInPx,
                    highlight: false,
                    categoryName: formattedCategoryValue
                });
            }

            // Handle legend data
            if (this.settings.legend.show) {
                this.legendData.dataPoints.push({
                    label: formattedCategoryValue,
                    color: strokeColor,
                    // icon: LegendIcon.Box,
                    selected: false,
                    identity: selectionId
                });
            }

            // Handle highlights
            if (this.hasHighlights) {

                let highlightValues: number[] = <number[]>this.categoricalColumns.Y[0].highlights,
                    isNotNull: boolean = highlightValues[i] != null;

                currentValue = isNotNull
                    ? highlightValues[i] as number
                    : 0;

                if (this.isMoreThanOneMeasure(categoricalColumns)) {
                    let secondMeasureValue: number = <number>categoricalColumns.Y[1].highlights[i] !== null ? <number>categoricalColumns.Y[1].highlights[i] : 0;
                    tooltipInfo = this.buildTwoMeasuresTooltip(formattedCategoryValue, currentValue, secondMeasureValue, localizationManager);

                    currentValue += secondMeasureValue;
                } else {
                    tooltipInfo = this.buildOneMeasureTooltip(formattedCategoryValue, currentValue, localizationManager);
                }

                this.highlightedDataPoints.push({
                    sliceHeight: isNotNull ? highlightValues[i] - this.minValue : null,
                    sliceWidth: Math.max(0, (categoricalColumns.Y.length > 1 && categoricalColumns.Y[1].highlights[i] !== null) ? <number>categoricalColumns.Y[1].highlights[i] : sliceWidth),
                    label: this.labelFormatter.format(<any>currentValue),
                    fillColor,
                    strokeColor,
                    strokeWidth,
                    identity: selectionId,
                    selected: false,
                    tooltipInfo,
                    labelFontSize: this.fontSizeInPx,
                    highlight: true,
                    categoryName: formattedCategoryValue
                });
            }
        }

        return this.dataPoints.length
            ? {
                dataPoints: this.dataPoints,
                settings: this.settings,
                hasHighlights: this.hasHighlights,
                legendData: this.legendData,
                highlightedDataPoints: this.highlightedDataPoints,
                labelFormatter: this.labelFormatter,
                centerText: category.source.displayName
            }
            : null;
    }
}
