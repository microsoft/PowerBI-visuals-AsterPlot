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
import ISelectionId = powerbi.visuals.ISelectionId;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

// powerbi.extensibility.utils.chart
import * as LegendUtil from "powerbi-visuals-utils-chartutils";
import LegendData = LegendUtil.legendInterfaces.LegendData;

// powerbi.extensibility.utils.formatting
import {valueFormatter} from "powerbi-visuals-utils-formattingutils";
import IValueFormatter = valueFormatter.IValueFormatter;

import { shapesInterfaces,  } from "powerbi-visuals-utils-svgutils";
import ISize = shapesInterfaces.ISize;

import {
    PieArcDatum as d3PieArcDatum,
} from "d3-shape";

import { SelectableDataPoint } from "./behavior";

import {AsterPlotSettingsModel} from "./asterPlotSettingsModel";

export interface AsterPlotData {
    dataPoints: AsterDataPoint[];
    highlightedDataPoints?: AsterDataPoint[];
    settings: AsterPlotSettingsModel;
    hasHighlights: boolean;
    legendData: LegendData;
    labelFormatter: IValueFormatter;
    centerText: string;
}

export interface AsterDataPoint extends SelectableDataPoint {
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    sliceHeight?: number;
    sliceWidth?: number;
    label: string;
    highlight?: boolean;
    tooltipInfo: VisualTooltipDataItem[];
    labelFontSize: number;
    categoryName: string;
    identity: ISelectionId;
    isLabelHasConflict?: boolean;
}

export interface d3AsterDataPoint extends d3PieArcDatum<AsterDataPoint> {
    size: ISize;
}
