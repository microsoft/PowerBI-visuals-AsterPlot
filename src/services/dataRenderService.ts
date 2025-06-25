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

import IViewport = powerbi.IViewport;

// powerbi.extensibility.utils.chart
import {
    DataLabelManager,
    dataLabelUtils,
    dataLabelInterfaces,
} from "powerbi-visuals-utils-chartutils";
import ILabelLayout = dataLabelInterfaces.ILabelLayout;
import LabelEnabledDataPoint = dataLabelInterfaces.LabelEnabledDataPoint;

// d3
import "d3-transition";
import { Selection as d3Selection } from 'd3-selection';
import { sum as d3Sum, max as d3Max } from "d3-array";
import {
    Arc as d3Arc,
    arc as d3CreateArc,
    PieArcDatum as d3PieArcDatum,
    pie as d3Pie
} from "d3-shape";
import { interpolate as d3Interpolate } from "d3-interpolate";

// powerbi.extensibility.utils.svg
import { CssConstants } from "powerbi-visuals-utils-svgutils";
import ClassAndSelector = CssConstants.ClassAndSelector;
import createClassAndSelector = CssConstants.createClassAndSelector;

import { ITooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";

// powerbi.extensibility.utils.type
import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";

// powerbi.extensibility.utils.formatting
import { textMeasurementService, interfaces } from "powerbi-visuals-utils-formattingutils";
import TextProperties = interfaces.TextProperties;


// powerbi.visuals
import ISelectionId = powerbi.visuals.ISelectionId;


class CircleTicksOptions {
    public diffPercent: number;
    public maxHeight: number;
    public ticksCount: number;
}

import {
    AsterDataPoint,
    AsterPlotData,
    d3AsterDataPoint
} from "../dataInterfaces";

import {
    VisualLayout
} from "../visualLayout";

import { max, filter, isEmpty } from "lodash-es";
import { AsterPlotObjectNames, AsterPlotSettingsModel, OuterLineCardSettings } from '../asterPlotSettingsModel';
import {HtmlSubSelectableClass, SubSelectableObjectNameAttribute, SubSelectableDisplayNameAttribute, SubSelectableTypeAttribute} from "powerbi-visuals-utils-onobjectutils";
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

export class DataRenderService {
    private static AsterRadiusRatio: number = 0.9;
    private static AsterConflictRatio: number = 0.9;
    private static AnimationDuration: number = 0;
    private static CenterTextFontWidthCoefficient = 1.9;
    private static AxisTextWidthCoefficient = 1.75;
    private static PixelsBelowAxis = 5;
    private static LabelLinePadding = 4;
    private static LableLineHeight = 25;
    private static LableLineLegHeight = 10;

    private static AsterSlice: ClassAndSelector = createClassAndSelector("asterSlice");
    private static AsterHighlightedSlice: ClassAndSelector = createClassAndSelector("asterHighlightedSlice");
    private static CenterLabelClass: ClassAndSelector = createClassAndSelector("centerLabel");
    private static labelGraphicsContextClass: ClassAndSelector = createClassAndSelector("labels");
    private static linesGraphicsContextClass: ClassAndSelector = createClassAndSelector("lines");
    private static DataLabels: ClassAndSelector = createClassAndSelector("data-labels")
    private static LineLabel: ClassAndSelector = createClassAndSelector("line-label")
    private static OuterLine: ClassAndSelector = createClassAndSelector("outerLine");
    private static OuterCircleBorder: ClassAndSelector = createClassAndSelector("outerCircle");
    private static InnerCircleBorder: ClassAndSelector = createClassAndSelector("innerCircle");
    private static CircleLine: ClassAndSelector = createClassAndSelector("circleLine");
    private static CircleText: ClassAndSelector = createClassAndSelector("circleText");

    private data: AsterPlotData;
    private formatMode: boolean;
    private layout: VisualLayout;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private localizationManager: ILocalizationManager;
    private readonly settings: AsterPlotSettingsModel;
    private readonly viewportRadius: number;
    private readonly maxHeight: number;
    private readonly totalWeight: number;
    private readonly dataPoints: d3AsterDataPoint[];
    private readonly highlightedDataPoints: d3AsterDataPoint[];
    private readonly arcSvg: d3Arc<DataRenderService, d3PieArcDatum<AsterDataPoint>>;
    private readonly ticksOptions: CircleTicksOptions;
    private readonly ticksRadiusArray: number[];
    private readonly tickValuesArray: number[];
    public innerRadius: number;
    public outerRadius: number;

    constructor(data: AsterPlotData,
        settings: AsterPlotSettingsModel,
        layout: VisualLayout,
        tooltipServiceWrapper: ITooltipServiceWrapper,
        localizationManager: ILocalizationManager,
        formatMode: boolean = false) {

        this.data = data;
        this.settings = settings;
        this.layout = layout;
        this.localizationManager = localizationManager;
        this.formatMode = formatMode;

        this.totalWeight = d3Sum(this.data.dataPoints, d => d.sliceWidth);
        this.dataPoints = this.createDataPoints(data, false, this.totalWeight);
        this.highlightedDataPoints = this.createDataPoints(data, true, this.totalWeight);
        this.maxHeight = d3Max(this.data.dataPoints, d => d.sliceHeight);
        this.viewportRadius = Math.min(this.layout.viewportIn.width, this.layout.viewportIn.height) / 2;
        this.tooltipServiceWrapper = tooltipServiceWrapper;

        this.innerRadius = 0.3 * (this.settings.labels.show.value
            ? this.viewportRadius * DataRenderService.AsterRadiusRatio
            : this.viewportRadius);
        const showOuterLine: boolean = settings.outerLine.show.value;
        if (showOuterLine) {
            this.ticksOptions = this.calcTickOptions(this.maxHeight);
            this.innerRadius /= this.ticksOptions.diffPercent;
        }

        this.arcSvg = this.getArcSvg(this.innerRadius, this.viewportRadius, this.maxHeight);
        this.outerRadius = max(this.dataPoints.map(d => this.arcSvg.outerRadius().bind(this)(d)));

        if (showOuterLine) {
            this.outerRadius *= this.ticksOptions.diffPercent;
            this.ticksRadiusArray = this.calcTicksRadius(this.ticksOptions.ticksCount, this.outerRadius);
            this.tickValuesArray = this.calcTicksValues(this.ticksOptions.ticksCount, this.ticksOptions.maxHeight);
        }
    }

    public drawCenterText(mainGroupElement: d3Selection<SVGGElement, null, HTMLElement, null>): void {
        const centerTextProperties: TextProperties = {
            text: this.data.centerText,
            fontFamily: this.settings.label.font.fontFamily.value,
            fontSize: PixelConverter.toString(this.settings.label.font.fontSize.value),
            fontWeight: this.settings.label.font.bold.value ? "bold" : "normal",
            fontStyle: this.settings.label.font.italic.value ? "italic" : "normal",
        };

        let centerText: d3Selection<SVGTextElement, null, HTMLElement, null> = mainGroupElement.select<SVGTextElement>(DataRenderService.CenterLabelClass.selectorName);

        if (centerText.empty()) {
            centerText = mainGroupElement.append("text").classed(DataRenderService.CenterLabelClass.className, true);
        }

        centerText
            .style("line-height", 1)
            .style("font-weight", centerTextProperties.fontWeight)
            .style("font-size", this.settings.label.font.fontSize.value)
            .style("font-family", this.settings.label.font.fontFamily.value || dataLabelUtils.StandardFontFamily)
            .style("font-weight", this.settings.label.font.bold.value ? "bold" : "normal")
            .style("font-style", this.settings.label.font.italic.value ? "italic" : "normal")
            .style("text-decoration", this.settings.label.font.underline.value ? "underline" : "none")
            .style("fill", this.settings.label.color.value.value)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .text(textMeasurementService.getTailoredTextOrDefault(centerTextProperties, this.innerRadius * DataRenderService.CenterTextFontWidthCoefficient));

        this.applyOnObjectStylesToCenterLabel(centerText);
    }

    private applyOnObjectStylesToCenterLabel(labelsSelection: d3Selection<SVGTextElement, null, HTMLElement, null>): void{
        labelsSelection
            .attr(SubSelectableObjectNameAttribute, AsterPlotObjectNames.Label.name)
            .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName(AsterPlotObjectNames.Label.displayNameKey))
            .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Text)
            .classed(HtmlSubSelectableClass, this.formatMode && this.settings.label.show.value);
    }


    public cleanCenterText(mainGroupElement: d3Selection<SVGGElement, null, HTMLElement, null>): void {
        mainGroupElement.select<SVGTextElement>(DataRenderService.CenterLabelClass.selectorName).remove();
    }

    public renderArcs(slicesElement: d3Selection<SVGGElement, null, HTMLElement, null>, isHighlighted: boolean) {
        const arc: d3Arc<DataRenderService, d3PieArcDatum<AsterDataPoint>> = this.arcSvg;
        const classSelector: ClassAndSelector = this.getClassAndSelector(isHighlighted);

        let selection = slicesElement
            .selectAll<SVGPathElement, null>(classSelector.selectorName)
            .data(isHighlighted ? this.highlightedDataPoints : this.dataPoints, (d: d3PieArcDatum<AsterDataPoint>, i: number) => {
                return d.data
                    ? (<powerbi.visuals.ISelectionId>d.data.identity).getKey()
                    : i;
            });

        selection
            .exit()
            .remove();

        selection = selection.merge(selection
            .enter()
            .append("path")
            .attr("aria-selected", false)
            .attr("tabindex", 0)
            .attr("role", "option")
            .attr("center", (d) => arc.centroid(d).toString())
            .classed(classSelector.className, true));

        this.applyOnObjectStylesToPies(selection);

        const interpolateArc = (dataRendererService: DataRenderService, arc: d3Arc<DataRenderService, d3PieArcDatum<AsterDataPoint>>) => {
            return function (data: d3PieArcDatum<AsterDataPoint>) {
                if (!this.oldData) {
                    this.oldData = data;
                    return () => arc.call(dataRendererService, data);
                }

                const interpolation = d3Interpolate(this.oldData, data);
                this.oldData = interpolation(0);
                return (x: number) => arc.call(dataRendererService, interpolation(x));
            }
        }

        selection
            .attr("fill", d => d.data.fillColor)
            .attr("stroke", d => d.data.strokeColor)
            .attr("stroke-width", d => d.data.strokeWidth)
            .call(selection => {
                return this.layout.viewportChanged
                    ? selection
                        .transition()
                        .duration(DataRenderService.AnimationDuration)
                        .attrTween("d", interpolateArc(this, arc))
                    : selection.attr("d", (d) => arc.call(this, d));
            });

        this.applyTooltipToSelection(selection);
    }

    private applyOnObjectStylesToPies(selection: d3Selection<SVGPathElement, d3PieArcDatum<AsterDataPoint>, SVGGElement, null>): void{
        selection
            .classed(HtmlSubSelectableClass, this.formatMode)
            .attr(SubSelectableObjectNameAttribute, AsterPlotObjectNames.Pies.name)
            .attr(SubSelectableDisplayNameAttribute, (d) => `"${d.data.categoryName}" ${this.localizationManager.getDisplayName("Visual_Slice")}`)
            .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Shape);
    }

    private drawGrid(element: d3Selection<SVGGElement, null, HTMLElement, null>, settings: OuterLineCardSettings): void {
        const color: string = settings.color.value.value;
        const ticksCount: number = this.ticksRadiusArray.length;

        const circleAxes: d3Selection<SVGGElement, number, SVGGElement, null> = element
            .selectAll<SVGGElement, number>("g" + DataRenderService.CircleLine.selectorName)
            .data(this.ticksRadiusArray)
            .join("g")
            .classed(DataRenderService.CircleLine.className, true);

        const circle = circleAxes
            .selectAll<SVGCircleElement, number>("circle")
            .data((t) => [t])
            .join("circle");

        circle
            .attr("r", (d) => d)
            .style("opacity", function(_: number, i: number, n: SVGCircleElement[] | ArrayLike<SVGCircleElement>) {
                const nodes = circle.nodes();
                const index = nodes.indexOf(n[i]);

                if (index === ticksCount - 1 || !settings.showGrid.value) {
                    return 0;
                }

                return 0.5;
            })
            .style("stroke", color)
            .style("fill", "none");

        if (settings.showGridTicksValues.value) {
            let text = circleAxes.selectAll<SVGTextElement, number>("text").data(this.tickValuesArray);
            const textProperties: TextProperties = {
                fontFamily: dataLabelUtils.StandardFontFamily,
                fontSize: PixelConverter.toString(this.settings.outerLine.font.fontSize.value)
            };
            text.exit().remove();
            text = text.merge(text.enter().append("text"));
            text
                .attr("dy", (d: number, i: number) => { return -this.ticksRadiusArray[i] + DataRenderService.PixelsBelowAxis + (parseInt(this.settings.outerLine.font.fontSize.value.toString())); })
                .attr("dx", (d: number, i: number) => { return - textMeasurementService.measureSvgTextWidth(textProperties, this.tickValuesArray[i].toString()) / DataRenderService.AxisTextWidthCoefficient; })
                .attr("text-anchor", "middle")
                .style("font-size", this.settings.outerLine.font.fontSize.value)
                .style("fill", this.settings.outerLine.textColor.value.value)
                .style("font-family", this.settings.outerLine.font.fontFamily.value || dataLabelUtils.StandardFontFamily)
                .style("font-weight", this.settings.outerLine.font.bold.value ? "bold" : "normal")
                .style("font-style", this.settings.outerLine.font.italic.value ? "italic" : "normal")
                .style("text-decoration", this.settings.outerLine.font.underline.value ? "underline" : "none")
                .classed(DataRenderService.CircleText.className, true)
                .text((_: number, i: number) => { return this.tickValuesArray[i]; });

            this.applyOnObjectStylesToCircleText(text);

        } else {            
            element.selectAll(DataRenderService.CircleText.selectorName).remove();
        }
    }

    private applyOnObjectStylesToCircleText(text: d3Selection<SVGTextElement, number, SVGGElement, number>): void{
        text
        .attr(SubSelectableObjectNameAttribute, AsterPlotObjectNames.Ticks.name)
        .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName(AsterPlotObjectNames.Ticks.displayNameKey))
        .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Text)
        .classed(HtmlSubSelectableClass, this.formatMode && this.settings.outerLine.showGridTicksValues.value);
    }

    private drawArcCircles(
        element: d3Selection<SVGGElement, null, HTMLElement, null>,
        circleClassName: ClassAndSelector,
        radius: number,
    ): void {
        const selection = element.selectAll<SVGPathElement, d3PieArcDatum<AsterDataPoint>>(circleClassName.selectorName).data([this.dataPoints[0]]);
       
        if (!this.settings.outerLine.showStraightLines.value && circleClassName === DataRenderService.InnerCircleBorder) {
            element.selectAll(circleClassName.selectorName).remove();
            return;
        }
        
        selection.exit().remove();
        const mergedCircle = selection.enter().append("path").merge(selection)
        .attr("class", circleClassName.className)
        .attr("fill", "none")
        .attr("opacity", 0.5)
        .attr("stroke", this.settings.outerLine.color.value.value)
        .attr("stroke-width", this.settings.outerLine.thickness.value + "px")
        .attr("d", () => {
            return d3CreateArc()
            .innerRadius(radius)
            .outerRadius(radius)({
                startAngle: 0,
                endAngle: 2 * Math.PI,
                innerRadius: radius,
                outerRadius: radius
            });
        });

        this.applyOnObjectStylesToOuterLines(mergedCircle);
    }

    private drawOuterStreightLines(element: d3Selection<SVGGElement, null, HTMLElement, null>) {
        const outerThickness: string = this.settings.outerLine.thickness.value + "px";
        const uniqueAngles = Array.from(new Set(this.dataPoints.map(d => d.startAngle)));
        const lines = element.selectAll<SVGPathElement,d3PieArcDatum<AsterDataPoint>>("path." + DataRenderService.OuterLine.className).data(uniqueAngles);

        if (this.dataPoints.length <= 1 || !this.settings.outerLine.showStraightLines.value) {
            element.selectAll(DataRenderService.OuterLine.selectorName).remove();
            return;
        }

        lines.exit().remove();

        const mergedԼines = lines.enter().append("path").merge(lines)
        .attr("class", DataRenderService.OuterLine.className)
        .attr("fill", "none")
        .attr("opacity", 0.5)
        .attr("stroke", this.settings.outerLine.color.value.value)
        .attr("stroke-width", outerThickness)
        .attr("d", (angle: number) => {
            const angleRad = angle - Math.PI / 2;
            const [cos, sin] = [Math.cos(angleRad), Math.sin(angleRad)];
            const halfStrokeWidth = parseInt(outerThickness) / 2;
            const [x1, y1] = [cos * this.innerRadius, sin * this.innerRadius];
            const [x2, y2] = [cos * (this.outerRadius - halfStrokeWidth), sin * (this.outerRadius - halfStrokeWidth)];

            return `M${x1},${y1} L${x2},${y2}`;
        });

        this.applyOnObjectStylesToOuterLines(mergedԼines);
    }

    private applyOnObjectStylesToOuterLines(
        selection: d3Selection<SVGPathElement, unknown, SVGGElement, null>
    ): void {
        selection
        .classed(HtmlSubSelectableClass, this.formatMode && this.settings.outerLine.show.value)
        .attr(SubSelectableObjectNameAttribute, AsterPlotObjectNames.OuterLine.name)
        .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName(AsterPlotObjectNames.OuterLine.displayNameKey))
        .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Shape);
    }
  
    public drawOuterLines(element: d3Selection<SVGGElement, null, HTMLElement, null>): void {
        this.drawOuterStreightLines(element); 
        this.drawArcCircles(element, DataRenderService.InnerCircleBorder, this.innerRadius);
        this.drawArcCircles(element, DataRenderService.OuterCircleBorder, this.outerRadius);   
        const settings: AsterPlotSettingsModel = this.settings;
        if (settings.outerLine.showGrid.value || settings.outerLine.showGridTicksValues.value) {
            this.drawGrid(element, settings.outerLine);
        } else {
            this.cleanGrid(element);
        }
    }

    private cleanGrid(element: d3Selection<SVGGElement, null, HTMLElement, null>): void {
        element.selectAll(DataRenderService.CircleLine.selectorName).remove();
        element.selectAll(DataRenderService.CircleText.selectorName).remove();
        element.selectAll("circle").remove();
    }

    public cleanOuterLinesAndCircles(element: d3Selection<SVGGElement, null, HTMLElement, null>): void {    
        element.selectAll(DataRenderService.OuterLine.selectorName).remove();
        element.selectAll(DataRenderService.OuterCircleBorder.selectorName).remove();
        element.selectAll(DataRenderService.InnerCircleBorder.selectorName).remove();
        this.cleanGrid(element);
    }

    private calcTickOptions(value: number): CircleTicksOptions {
        let val: number = value > 0 ? Math.floor(value) : Math.ceil(value);
        let modifier = 1;

        if (val === 0) {
            for (let i = 0; i < value.toString().length - 3; ++i) {
                modifier *= 10;
                val = value * modifier;
                val = val > 0 ? Math.floor(val) : Math.ceil(val);

                if (val !== 0) {
                    break;
                }
            }
        }

        const step = Math.pow(10, val.toString().length - 1);

        const allTicksCount: number = Math.ceil((val) / step);
        const endPoint: number = allTicksCount * step / modifier;
        const diffPercent: number = endPoint / value;
        const threeTicks: number = 3;
        const twoTicks: number = 2;

        return {
            diffPercent,
            maxHeight: allTicksCount * step * modifier,
            ticksCount: allTicksCount % threeTicks === 0 ? threeTicks : twoTicks // 2 or 3 ticks only needed
        };
    }

    private calcTicksRadius(ticksCount: number, radius: number): number[] {
        let array: number[];

        if (ticksCount % 3 === 0) {
            array = [(radius - this.innerRadius) / 3 + this.innerRadius / this.ticksOptions.diffPercent, (radius - this.innerRadius) / 3 * 2 + this.innerRadius / this.ticksOptions.diffPercent, radius];
        } else {
            array = [(radius - this.innerRadius) / 2 + this.innerRadius / this.ticksOptions.diffPercent, radius];
        }

        return array;
    }

    private calcTicksValues(ticksCount: number, outerValue: number): number[] {
        let array: number[];

        if (ticksCount % 3 === 0) {
            array = [outerValue / 3, outerValue / 3 * 2, outerValue];
        } else {
            array = [outerValue / 2, outerValue];
        }

        return array;
    }

    private applyTooltipToSelection(selection: d3Selection<SVGPathElement, d3PieArcDatum<AsterDataPoint>, SVGGElement, null>): void {
        this.tooltipServiceWrapper.addTooltip(selection, 
            (tooltipEvent: d3PieArcDatum<AsterDataPoint>) => tooltipEvent.data?.tooltipInfo,
            (tooltipEvent: d3PieArcDatum<AsterDataPoint>) => tooltipEvent.data?.identity,
        );
    }

    private createDataPoints(data: AsterPlotData, hasHighlight: boolean, totalWeight: number): d3AsterDataPoint[] {
        const pie = this.getPieLayout(totalWeight);

        return pie.bind(this)(hasHighlight
            ? data.highlightedDataPoints
            : data.dataPoints);
    }

    public getDataPoints(isHighlight: boolean): d3PieArcDatum<AsterDataPoint>[] {
        return isHighlight ? this.highlightedDataPoints : this.dataPoints;
    }

    private getClassAndSelector(isHighlighted: boolean) {
        return (isHighlighted
            ? DataRenderService.AsterHighlightedSlice
            : DataRenderService.AsterSlice);
    }

    private getPieLayout(totalWeight: number) {
        return d3Pie<DataRenderService, AsterDataPoint>()
            .sort(null)
            .value((dataPoint: AsterDataPoint) => {
                if (!this.totalWeight || !dataPoint || isNaN(dataPoint.sliceWidth)) {
                    return 0;
                }

                return dataPoint.sliceWidth / totalWeight;
            });
    }

    public computeOuterRadius(arcDescriptor: d3PieArcDatum<AsterDataPoint>): number {
        let height: number = 0;

        if (this.maxHeight) {
            const radius: number = this.viewportRadius - this.innerRadius;
            const sliceHeight = arcDescriptor
            && arcDescriptor.data
            && !isNaN(arcDescriptor.data.sliceHeight)
                ? arcDescriptor.data.sliceHeight
                : 1;

            height = radius * sliceHeight / this.maxHeight;
        }

        // The chart should shrink if data labels are on
        let heightIsLabelsOn = this.innerRadius + (this.settings.labels.show.value ? height * DataRenderService.AsterRadiusRatio : height);
        // let heightIsLabelsOn = this.innerRadius + height;
        if (this.ticksOptions) {
            heightIsLabelsOn /= this.ticksOptions.diffPercent;
        }

        // Prevent from data to be inside the inner radius
        return Math.max(heightIsLabelsOn, this.innerRadius);
    }

    private getArcSvg(innerRadius: number = this.innerRadius, viewportRadius: number = this.viewportRadius, maxHeight: number = this.maxHeight): d3Arc<DataRenderService, d3PieArcDatum<AsterDataPoint>> {
        return d3CreateArc<DataRenderService, d3PieArcDatum<AsterDataPoint>>()
            .innerRadius(innerRadius)
            .outerRadius((arcDescriptor: d3PieArcDatum<AsterDataPoint>) => {
                let height: number = 0;

                if (this.maxHeight) {
                    const radius: number = viewportRadius - innerRadius;
                    const sliceHeight = arcDescriptor
                        && arcDescriptor.data
                        && !isNaN(arcDescriptor.data.sliceHeight)
                        ? arcDescriptor.data.sliceHeight
                        : 1;

                    height = radius * sliceHeight / maxHeight;
                }

                // The chart should shrink if data labels are on
                let heightIsLabelsOn = innerRadius + (this.settings.labels.show.value ? height * DataRenderService.AsterRadiusRatio : height);
                // let heightIsLabelsOn = innerRadius + height;
                if (this.ticksOptions) {
                    heightIsLabelsOn /= this.ticksOptions.diffPercent;
                }

                // Prevent from data to be inside the inner radius
                return Math.max(heightIsLabelsOn, innerRadius);
            });
    }

    private lineRadCalc(d: AsterDataPoint) {
        let height: number = (this.viewportRadius - this.innerRadius) * (d && !isNaN(d.sliceHeight) ? d.sliceHeight : 1) / this.maxHeight;
        height = this.innerRadius + height * DataRenderService.AsterRadiusRatio;
        return Math.max(height, this.innerRadius);
    }

    private labelRadCalc(d: AsterDataPoint) {
        const height: number = this.viewportRadius * (d && !isNaN(d.sliceHeight) ? d.sliceHeight : 1) / this.maxHeight + this.innerRadius;
        return Math.max(height, this.innerRadius);
    }


    public renderLabels(labelsElement: d3Selection<SVGGElement, null, HTMLElement, null>, isHighlight: boolean) {
        const dataPoints: d3AsterDataPoint[] = isHighlight ? this.highlightedDataPoints : this.dataPoints;
        if (!this.data.hasHighlights || (this.data.hasHighlights && isHighlight)) {
            const labelArc = d3CreateArc<DataRenderService, d3PieArcDatum<AsterDataPoint>>()
                .innerRadius(d => this.labelRadCalc(d.data))
                .outerRadius(d => this.labelRadCalc(d.data));

            const labelLayout: ILabelLayout = this.getLabelLayout(labelArc, this.layout.viewport);
            this.drawLabels(
                dataPoints.filter(x => !isHighlight || x.data.sliceHeight !== null),
                labelsElement,
                labelLayout,
                this.layout.viewport);
        }
    }

    public cleanLabels(labelsElement: d3Selection<SVGGElement, null, HTMLElement, null>): void {
        dataLabelUtils.cleanDataLabels(labelsElement, true);
    }

    private calculateMiddAngleforLabels(d: d3PieArcDatum<AsterDataPoint> & LabelEnabledDataPoint) : number {
        return d.startAngle + (d.endAngle - d.startAngle) / 2;
    };

    private computeLabelLinePoints(d: d3PieArcDatum<AsterDataPoint> & LabelEnabledDataPoint): {
        lineStartPoint: [number, number],
        lineBreakPoint: [number, number],
        lineEndPoint: [number, number],
        direction: number
    } {
        const angle = this.calculateMiddAngleforLabels(d) - Math.PI / 2;
        const radius = this.arcSvg.outerRadius().call(this, d);
        const direction = this.calculateMiddAngleforLabels(d) < Math.PI ? 1 : -1;

        const lineStartPoint: [number, number] = [
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
        ];

        const lineBreakPoint: [number, number] = [
            lineStartPoint[0] + Math.cos(angle) * DataRenderService.LableLineHeight,
            lineStartPoint[1] + Math.sin(angle) * DataRenderService.LableLineHeight
        ];

        const lineEndPoint: [number, number] = [
            lineBreakPoint[0] + direction * DataRenderService.LableLineLegHeight,
            lineBreakPoint[1]
        ];

        return { lineStartPoint, lineBreakPoint, lineEndPoint, direction };
    }


    private drawLabels(data: d3AsterDataPoint[],
        context: d3Selection<SVGGElement, null, HTMLElement, null>,
        layout: ILabelLayout,
        viewport: IViewport
    ): void {
        // Hide and reposition labels that overlap
        const dataLabelManager: DataLabelManager = new DataLabelManager();
        type LabelMergedDataPoint = d3PieArcDatum<AsterDataPoint> & LabelEnabledDataPoint;
        let filteredData: LabelMergedDataPoint[] = <LabelMergedDataPoint[]>dataLabelManager.hideCollidedLabels(viewport, data, layout, true /* addTransform */);

        if (filteredData.length === 0) {
            dataLabelUtils.cleanDataLabels(context, true);
            return;
        }

        // Draw labels
        if (context.select(DataRenderService.labelGraphicsContextClass.selectorName).empty()) {
            context.append("g").classed(DataRenderService.labelGraphicsContextClass.className, true);
        }

        let labels = context
            .select<SVGGElement>(DataRenderService.labelGraphicsContextClass.selectorName)
            .selectAll<SVGTextElement, d3PieArcDatum<AsterDataPoint>>(DataRenderService.DataLabels.selectorName)
            .data(
                filteredData,
                (d: d3PieArcDatum<AsterDataPoint>) => {
                    return (<ISelectionId>d.data.identity).getKey();
                });

        labels
            .exit()
            .remove();

        labels = labels.merge(
            labels
                .enter()
                .append("text")
                .classed(DataRenderService.DataLabels.className, true))
                .classed(HtmlSubSelectableClass, this.formatMode && this.settings.labels.show.value)
                .attr(SubSelectableObjectNameAttribute, AsterPlotObjectNames.Labels.name)
                .attr(SubSelectableDisplayNameAttribute, AsterPlotObjectNames.Labels.name)
                .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Text);

        if (!labels) {
            return;
        }

        const labelLinePointsCache = new Map();

        labels
           .attr("x", (d) => {
                if (!labelLinePointsCache.has(d)) {
                    labelLinePointsCache.set(d, this.computeLabelLinePoints(d));
                }
                const { lineEndPoint } = labelLinePointsCache.get(d);
                return lineEndPoint[0];
            })
            .attr("y", (d) => {
                if (!labelLinePointsCache.has(d)) {
                labelLinePointsCache.set(d, this.computeLabelLinePoints(d));
                }
                const { lineEndPoint } = labelLinePointsCache.get(d);
                return lineEndPoint[1];
            })
            .attr("dy", ".35em")
            .attr("dx", (d: LabelMergedDataPoint) => { 
                if (!labelLinePointsCache.has(d)) {
                    labelLinePointsCache.set(d, this.computeLabelLinePoints(d));
                }
                const { direction } = labelLinePointsCache.get(d);
                return direction * DataRenderService.LabelLinePadding;
            })
            .text((d: LabelEnabledDataPoint) => d.labeltext)
            .style("text-anchor", layout.style["text-anchor"])
            .style("fill", this.settings.labels.color.value.value)
            .style("font-family", this.settings.labels.font.fontFamily.value || dataLabelUtils.StandardFontFamily)
            .style("font-weight", this.settings.labels.font.bold.value ? "bold" : "normal")
            .style("font-style", this.settings.labels.font.italic.value ? "italic" : "normal")
            .style("text-decoration", this.settings.labels.font.underline.value ? "underline" : "none")
            .style("font-size", PixelConverter.fromPoint(this.settings.labels.font.fontSize.value));

        this.applyOnObjectStylesToLabels(labels);

        // Draw lines
        if (context.select(DataRenderService.linesGraphicsContextClass.selectorName).empty())
            context.append("g").classed(DataRenderService.linesGraphicsContextClass.className, true);

        // Remove lines for null and zero values
        filteredData = filter(filteredData, (d: d3PieArcDatum<AsterDataPoint>) => d.data.sliceHeight !== null && d.data.sliceHeight !== 0);

        let lines = context
            .select(DataRenderService.linesGraphicsContextClass.selectorName)
            .selectAll<SVGPolylineElement, d3PieArcDatum<AsterDataPoint>>("polyline")
            .data(
                filteredData,
                (d: d3PieArcDatum<AsterDataPoint>) => {
                    return (<ISelectionId>d.data.identity).getKey();
                });

        lines
            .exit()
            .remove();

        lines = lines.merge(
            lines
                .enter()
                .append("polyline")
                .classed(DataRenderService.LineLabel.className, true));

        lines
            .attr("points", (d) => {
                if (!labelLinePointsCache.has(d)) {
                    labelLinePointsCache.set(d, this.computeLabelLinePoints(d));
                }   

                const { lineStartPoint, lineBreakPoint, lineEndPoint } = labelLinePointsCache.get(d);
                return [].concat(lineStartPoint, lineBreakPoint, lineEndPoint);
            })
            .style("opacity", 0.5)
            .style("fill-opacity", 0)
            .style("stroke", () => this.settings.labels.color.value.value);
    }

    private applyOnObjectStylesToLabels(labelsSelection: d3Selection<SVGTextElement, d3PieArcDatum<AsterDataPoint> & LabelEnabledDataPoint, SVGGElement, null>): void{
        labelsSelection
            .style("pointer-events", this.formatMode ? "auto" : "none")
            .attr(SubSelectableObjectNameAttribute, AsterPlotObjectNames.Labels.name)
            .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName(AsterPlotObjectNames.Labels.displayNameKey))
            .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Text)
            .classed(HtmlSubSelectableClass, this.formatMode && this.settings.labels.show.value);
    }

    private getLabelLayout(arc: d3Arc<DataRenderService, d3PieArcDatum<AsterDataPoint>>, viewport: IViewport): ILabelLayout {
    
        const textProperties: TextProperties = {
            text: "",
            fontFamily: this.settings.labels.font.fontFamily.value || dataLabelUtils.StandardFontFamily,
            fontSize: PixelConverter.fromPoint(this.settings.labels.font.fontSize.value),
            fontWeight: this.settings.labels.font.bold ? "bold" : "normal",
            fontStyle: this.settings.labels.font.italic ? "italic" : "normal",
        };

        const isLabelsHasConflict = (d: d3PieArcDatum<AsterDataPoint>) => {
            const pos = arc.centroid(d);
            textProperties.text = d.data.label;
            const textWidth = textMeasurementService.measureSvgTextWidth(textProperties);
            const horizontalSpaceAvailableForLabels = viewport.width / 2 - Math.abs(pos[0]);
            const textHeight = textMeasurementService.estimateSvgTextHeight(textProperties);
            const verticalSpaceAvailableForLabels = viewport.height / 2 - Math.abs(pos[1]);
            d.data.isLabelHasConflict = textWidth > horizontalSpaceAvailableForLabels || textHeight > verticalSpaceAvailableForLabels;
            return d.data.isLabelHasConflict;
        };

        return {
            labelText: (d: d3PieArcDatum<AsterDataPoint>) => {
                textProperties.text = d.data.label;
                const pos = arc.centroid(d);
                const xPos = isLabelsHasConflict(d) ? pos[0] * DataRenderService.AsterConflictRatio : pos[0];
                const spaceAvailableForLabels = viewport.width / 2 - Math.abs(xPos);
                return textMeasurementService.getTailoredTextOrDefault(textProperties, spaceAvailableForLabels);
            },
            labelLayout: {
                x: (d: d3PieArcDatum<AsterDataPoint>) => {
                    const pos = arc.centroid(d);
                    textProperties.text = d.data.label;
                    return d.data.isLabelHasConflict ? pos[0] * DataRenderService.AsterConflictRatio : pos[0];
                },
                y: (d: d3PieArcDatum<AsterDataPoint>) => {
                    const pos: [number, number] = arc.centroid(d);
                    return d.data.isLabelHasConflict ? pos[1] * DataRenderService.AsterConflictRatio : pos[1];
                },
            },
            filter: (d: d3PieArcDatum<AsterDataPoint>) => (d != null && !isEmpty(d.data.label + "")),
            style: {
                "text-anchor": (d: d3PieArcDatum<AsterDataPoint>) => this.calculateMiddAngleforLabels(d) < Math.PI ? "start" : "end",
            }
        };
    }
}