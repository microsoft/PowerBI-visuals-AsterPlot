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

import { isEmpty } from "lodash-es";
import powerbi from "powerbi-visuals-api";

import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";

import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";

import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import { legendInterfaces } from "powerbi-visuals-utils-chartutils"

import { AsterPlotColumns } from "../asterPlotColumns";
import { AsterPlotSettingsModel } from "../asterPlotSettingsModel";
import { AsterDataPoint, AsterPlotData } from "../dataInterfaces";
import { createTooltipInfo } from "../tooltipBuilder";

import DataView = powerbi.DataView;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import PrimitiveValue = powerbi.PrimitiveValue;
import IValueFormatter = valueFormatter.IValueFormatter;
import ISelectionId = powerbi.visuals.ISelectionId;

import IColorPalette = powerbi.extensibility.IColorPalette;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

import LegendData = legendInterfaces.LegendData;


const minStrokeWidth: number = 0;
const maxStrokeWidth: number = 3;

export type CategoricalColumns = { Category: powerbi.DataViewCategoryColumn; Y: powerbi.DataViewValueColumn[]; }
export type CategoricalValueColumns = { Category: powerbi.PrimitiveValue[]; Y: powerbi.PrimitiveValue[]; };

export class AsterPlotConverterService {
    private static PiesPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "pies",
        propertyName: "fill"
    };

    private dataView: DataView;
    private categoricalColumns: CategoricalColumns;
    private categoricalValueColumns: CategoricalValueColumns;
    private settings: AsterPlotSettingsModel;
    private visualHost: IVisualHost;

    private dataPoints: AsterDataPoint[];
    private highlightedDataPoints: AsterDataPoint[];
    private legendData: LegendData;
    private colorHelper: ColorHelper;
    private hasHighlights: boolean;

    private maxValue: number;

    private labelFormatter: IValueFormatter;
    private fontSizeInPx: number

    constructor(dataView: DataView,
        settings: AsterPlotSettingsModel,
        colors: IColorPalette,
        visualHost: IVisualHost,
        categorical?: CategoricalColumns) {
        this.dataView = dataView;
        this.categoricalColumns = categorical || AsterPlotColumns.getCategoricalColumns(dataView);
        this.categoricalValueColumns = AsterPlotColumns.getCategoricalValues(dataView);
        this.settings = settings;
        this.colorHelper = new ColorHelper(colors, AsterPlotConverterService.PiesPropertyIdentifier, "");
        this.visualHost = visualHost;

        this.legendData = {
            dataPoints: [],
            title: this.settings.legend.titleText.value,
            fontSize: this.settings.legend.font.fontSize.value,
            fontFamily: this.settings.legend.font.fontFamily.value,
            fontStyle: this.settings.legend.font.italic.value ? "italic" : "normal",
            fontWeight: this.settings.legend.font.bold.value ? "bold" : "normal",
            textDecoration: this.settings.legend.font.underline.value ? "underline" : "none",
            labelColor: this.colorHelper.getHighContrastColor("foreground", this.settings.legend.labelColor.value.value)
        };

        this.hasHighlights = this.containsHighlights(this.categoricalColumns);
        this.maxValue = this.getMaxValue(this.categoricalColumns);

        this.labelFormatter = this.createFormatter(
            this.categoricalColumns.Y[0].source,
            settings.labels.precision.value,
            (Number(settings.labels.displayUnits.value.valueOf()) === 0) && (this.maxValue != null)
                ? this.maxValue
                : Number(settings.labels.displayUnits.value.valueOf()));

        this.fontSizeInPx = PixelConverter.fromPointToPixel(settings.labels.font.fontSize.value);

        this.dataPoints = [];
        this.highlightedDataPoints = [];
    }

    public static isDataValid(categorical: CategoricalColumns): boolean {
        return categorical
            && categorical.Category
            && !isEmpty(categorical.Category.values)
            && !isEmpty(categorical.Y)
            && !isEmpty(categorical.Y[0].values);
    }

    private containsHighlights(categorical: CategoricalColumns): boolean {
        return !!(categorical?.Y?.[0]?.highlights);
    }

    private getMaxValue(categorical: CategoricalColumns): number {
        return Math.max.apply(null, <number[]>categorical.Y[0].values);
    }

    private createFormatter(column: DataViewMetadataColumn, precision?: number, value?: number): IValueFormatter {
        return valueFormatter.create({
            format: valueFormatter.getFormatStringByColumn(column, true),
            precision: precision,
            value: value
        });
    }

    private isMoreThanOneMeasure(categoricalColumns: CategoricalColumns) {
        return categoricalColumns.Y.length > 1;
    }

    private buildOneMeasureTooltip(formattedCategoryValue: PrimitiveValue, value: number, localizationManager: ILocalizationManager): VisualTooltipDataItem[] {
        return createTooltipInfo(this.dataView.categorical, formattedCategoryValue, localizationManager, value, 0);
    }

    private buildTwoMeasuresTooltip(formattedCategoryValue: PrimitiveValue, value: number, secondValue: number, localizationManager: ILocalizationManager): VisualTooltipDataItem[] {
        const tooltipInfo: VisualTooltipDataItem[] = this.buildOneMeasureTooltip(formattedCategoryValue, value, localizationManager);

        const toolTip: VisualTooltipDataItem = createTooltipInfo(
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
        const categoryValue = this.categoricalValueColumns.Category,
            category: DataViewCategoryColumn = this.categoricalColumns.Category,
            values: number[] = <number[]>this.categoricalColumns.Y[0].values,
            categoricalColumns: CategoricalColumns = this.categoricalColumns;

        for (let i = 0; i < categoryValue.length; i++) {
            const formattedCategoryValue: PrimitiveValue = categoryValue[i];
            let currentValue = values[i];

            let tooltipInfo: VisualTooltipDataItem[];

            if (this.isMoreThanOneMeasure(categoricalColumns)) {
                const secondMeasureValue: number = <number>categoricalColumns.Y[1].values[i];
                tooltipInfo = this.buildTwoMeasuresTooltip(formattedCategoryValue, currentValue, secondMeasureValue, localizationManager);
            } else {
                tooltipInfo = this.buildOneMeasureTooltip(formattedCategoryValue, currentValue, localizationManager);
            }

            const colorFromPalette = this.colorHelper.getColorForMeasure(category.objects?.[i], (category.identity[i] as { identityIndex: number }).identityIndex)
            const dataPointFillColor: string = dataViewObjects.getFillColor(category.objects?.[i] || category.source.objects, AsterPlotConverterService.PiesPropertyIdentifier);
            const fillColor: string = this.colorHelper.getHighContrastColor("background", dataPointFillColor || colorFromPalette);

            const strokeColor = this.colorHelper.getHighContrastColor("foreground", fillColor);
            const strokeWidth = this.colorHelper.isHighContrast ? maxStrokeWidth : minStrokeWidth;
            const sliceWidth = Math.max(0, categoricalColumns.Y.length > 1 ? <number>categoricalColumns.Y[1].values[i] : 1);

            const selectionId: ISelectionId = this.visualHost.createSelectionIdBuilder()
                .withCategory(category, i)
                .withMeasure(category.source.queryName)
                .createSelectionId();

            if (sliceWidth > 0) {
                this.dataPoints.push({
                    sliceHeight: values[i],
                    sliceWidth,
                    label: this.labelFormatter.format(currentValue),
                    fillColor,
                    strokeColor,
                    strokeWidth,
                    identity: selectionId,
                    selected: false,
                    tooltipInfo,
                    labelFontSize: this.fontSizeInPx,
                    highlight: false,
                    categoryName: formattedCategoryValue.toString(),
                });
            }

            // Handle legend data
            if (this.settings.legend.show.value) {
                this.legendData.dataPoints.push({
                    label: formattedCategoryValue.toString(),
                    color: strokeColor,
                    // icon: LegendIcon.Box,
                    selected: false,
                    identity: selectionId
                });
            }

            // Handle highlights
            if (this.hasHighlights) {

                const highlightValues: number[] = <number[]>this.categoricalColumns.Y[0].highlights;
                const isNotNull: boolean = highlightValues[i] != null;

                currentValue = isNotNull
                    ? <number>highlightValues[i]
                    : 0;

                if (this.isMoreThanOneMeasure(categoricalColumns)) {
                    const secondMeasureValue: number = <number>categoricalColumns.Y[1].highlights[i] !== null ? <number>categoricalColumns.Y[1].highlights[i] : 0;
                    tooltipInfo = this.buildTwoMeasuresTooltip(formattedCategoryValue, currentValue, secondMeasureValue, localizationManager);
                } else {
                    tooltipInfo = this.buildOneMeasureTooltip(formattedCategoryValue, currentValue, localizationManager);
                }

                const height: number = isNotNull ? highlightValues[i] : null;
                const width: number = Math.max(0, (categoricalColumns.Y.length > 1 && categoricalColumns.Y[1].highlights[i] !== null) ? <number>categoricalColumns.Y[1].highlights[i] : sliceWidth)
                this.highlightedDataPoints.push({
                    sliceHeight: height,
                    sliceWidth: width,
                    label: this.labelFormatter.format(currentValue),
                    fillColor,
                    strokeColor,
                    strokeWidth,
                    identity: selectionId,
                    selected: false,
                    tooltipInfo,
                    labelFontSize: this.fontSizeInPx,
                    highlight: true,
                    categoryName: formattedCategoryValue.toString()
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
