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
    private static PiesPropertyIdentifier = {
        pies: {
            defaultColor: { objectName: "pies", propertyName: "defaultColor" },
            fill: { objectName: "pies", propertyName: "fill" }
        }
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
    private totalValue: number;

    private labelFormatter: IValueFormatter;
    private percentageFormatter: IValueFormatter;
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
        this.colorHelper = new ColorHelper(colors, AsterPlotConverterService.PiesPropertyIdentifier.pies.defaultColor, settings.pies.defaultColor.value.value);
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
        this.totalValue = this.getTotalValue(this.categoricalColumns);

        this.percentageFormatter = valueFormatter.create({ format: "0.0%" });
        this.labelFormatter = this.createFormatter(
            this.categoricalColumns.Y[0].source,
            settings.detailLabels.labelsValuesGroup.precision.value,
            (Number(settings.detailLabels.labelsValuesGroup.displayUnits.value.valueOf()) === 0) && (this.maxValue != null)
                ? this.maxValue
                : Number(settings.detailLabels.labelsValuesGroup.displayUnits.value.valueOf()));

        this.fontSizeInPx = PixelConverter.fromPointToPixel(settings.detailLabels.labelsValuesGroup.font.fontSize.value);

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

    private getTotalValue(categorical: CategoricalColumns | undefined): number {
        return  (<number[]>categorical.Y[0].values).reduce((a, b) => a + (b || 0), 0);
    }

    private getLabelText(categoryValue: PrimitiveValue, currentValue: number): string {
        const showCategory = this.settings.detailLabels.labelsOptionsGroup.showCategory.value;
        const showDataValue = this.settings.detailLabels.labelsOptionsGroup.showDataValue.value;
        const showPercentOfTotal = this.settings.detailLabels.labelsOptionsGroup.showPercentOfTotal.value;

        const labelContents: string[] = [];

        if (showCategory) {
            labelContents.push(categoryValue.toString());
        }

        if (showDataValue) {
            labelContents.push(this.labelFormatter.format(currentValue));
        }

       if (showPercentOfTotal) {
            const percentage = this.totalValue > 0 ? currentValue / this.totalValue : 0;
            const formattedPercentage = this.percentageFormatter.format(percentage);
            labelContents.push(formattedPercentage);
        }

        return labelContents.join(" ");
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

    private static getDataPointColor(
        categoryIndex: number,
        colorHelper: ColorHelper,
        useConditionalFormatting: boolean,
        categoryDataPointObjects?: powerbi.DataViewObjects[],
        categorySourceObjects?: powerbi.DataViewObjects): string {

        if (useConditionalFormatting && categorySourceObjects) {
            const defaultColor = dataViewObjects.getFillColor(
                categorySourceObjects,
                AsterPlotConverterService.PiesPropertyIdentifier.pies.defaultColor
            );

            const fillColorFromFx = dataViewObjects.getFillColor(
                categorySourceObjects,
                AsterPlotConverterService.PiesPropertyIdentifier.pies.fill
            );

            return defaultColor ?? fillColorFromFx;;
        }

        if (!useConditionalFormatting && categoryDataPointObjects && categoryDataPointObjects[categoryIndex]) {
            const colorOverride: string = dataViewObjects.getFillColor(
                categoryDataPointObjects[categoryIndex],
                AsterPlotConverterService.PiesPropertyIdentifier.pies.fill);

            if (colorOverride) {
                return colorOverride;
            }
        }

        const paletteColor = colorHelper.getColorForMeasure(
            categoryDataPointObjects?.[categoryIndex], 
            categoryIndex
        );
        
        return paletteColor;
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


            const effectiveColor = AsterPlotConverterService.getDataPointColor(
                i,
                this.colorHelper,
                this.settings.pies.useConditionalFormatting.value,
                category.objects, 
                category.source.objects
            );

            const fillColor = this.colorHelper.getHighContrastColor("background", effectiveColor);
            const strokeColor = this.colorHelper.getHighContrastColor("foreground", fillColor);
            const strokeWidth = this.colorHelper.isHighContrast ? maxStrokeWidth : minStrokeWidth;
            const sliceWidth = Math.max(0, categoricalColumns.Y.length > 1 ? <number>categoricalColumns.Y[1].values[i] : 1);

            const selectionId: ISelectionId = this.visualHost.createSelectionIdBuilder()
                .withCategory(category, i)
                .withMeasure(category.source.queryName)
                .createSelectionId();

            const labelText = this.getLabelText(formattedCategoryValue, currentValue);

            if (sliceWidth > 0) {
                this.dataPoints.push({
                    sliceHeight: values[i],
                    sliceWidth,
                    label: labelText,
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
                const highlightValueIsNotNull: boolean = highlightValues[i] != null;
                const secondHighlightValue: number = this.isMoreThanOneMeasure(categoricalColumns) ? <number>categoricalColumns.Y[1].highlights[i] : null;

                currentValue = highlightValueIsNotNull
                    ? <number>highlightValues[i]
                    : 0;

                if (this.isMoreThanOneMeasure(categoricalColumns)) {
                    const secondMeasureValue: number = secondHighlightValue !== null ? secondHighlightValue : 0;
                    tooltipInfo = this.buildTwoMeasuresTooltip(formattedCategoryValue, currentValue, secondMeasureValue, localizationManager);
                } else {
                    tooltipInfo = this.buildOneMeasureTooltip(formattedCategoryValue, currentValue, localizationManager);
                }

                const height: number = highlightValueIsNotNull ? highlightValues[i] : null;
                const width: number = Math.max(0, (categoricalColumns.Y.length > 1 && secondHighlightValue !== null) ? secondHighlightValue : sliceWidth)
                const highlightLabelText = this.getLabelText(formattedCategoryValue, currentValue);
                this.highlightedDataPoints.push({
                    sliceHeight: height,
                    sliceWidth: width,
                    label: highlightLabelText,
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
