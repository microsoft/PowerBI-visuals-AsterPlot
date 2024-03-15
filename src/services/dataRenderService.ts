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

// tslint:disable-next-line
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
import * as d3 from "d3";
import {Arc, arc, PieArcDatum} from "d3-shape";

import { AsterArcDescriptor, ArcDescriptor, Selection } from "../dataInterfaces";

// powerbi.extensibility.utils.svg
import { CssConstants } from "powerbi-visuals-utils-svgutils";
import ClassAndSelector = CssConstants.ClassAndSelector;
import createClassAndSelector = CssConstants.createClassAndSelector;

import { ITooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";

import { Helpers } from "../helpers";

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
    AsterPlotData
} from "../dataInterfaces";

import {
    VisualLayout
} from "../visualLayout";

import { max, filter, isEmpty } from "lodash-es";
import {AsterPlotObjectNames, AsterPlotSettingsModel, OuterLineCardSettings} from "../asterPlotSettingsModel";
import {HtmlSubSelectableClass, SubSelectableObjectNameAttribute, SubSelectableDisplayNameAttribute, SubSelectableTypeAttribute} from "powerbi-visuals-utils-onobjectutils";
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import {BaseType, select} from "d3";

export class DataRenderService {
    private static AsterRadiusRatio: number = 0.9;
    private static AsterConflictRatio: number = 0.9;
    private static AnimationDuration: number = 0;
    private static CenterTextFontWidthCoefficient = 1.9;
    private static AxisTextWidthCoefficient = 1.75;
    private static PixelsBelowAxis = 5;
    private static LabelLinePadding = 4;
    private static ChartLinePadding = 1.02;

    private static AsterSlice: ClassAndSelector = createClassAndSelector("asterSlice");
    private static AsterHighlightedSlice: ClassAndSelector = createClassAndSelector("asterHighlightedSlice");
    private static CenterLabelClass: ClassAndSelector = createClassAndSelector("centerLabel");
    private static labelGraphicsContextClass: ClassAndSelector = createClassAndSelector("labels");
    private static linesGraphicsContextClass: ClassAndSelector = createClassAndSelector("lines");
    private static DataLabels: ClassAndSelector = createClassAndSelector("data-labels")
    private static LineLabel: ClassAndSelector = createClassAndSelector("line-label")
    private static OuterLine: ClassAndSelector = createClassAndSelector("outerLine");
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
    private readonly dataPoints: AsterArcDescriptor[];
    private readonly highlightedDataPoints: AsterArcDescriptor[];
    private readonly arcSvg: Arc<any, AsterArcDescriptor>;
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

        this.totalWeight = d3.sum(this.data.dataPoints, d => d.sliceWidth);
        this.dataPoints = this.createDataPoints(data, false, this.totalWeight);
        this.highlightedDataPoints = this.createDataPoints(data, true, this.totalWeight);
        this.maxHeight = d3.max(this.data.dataPoints, d => d.sliceHeight);
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
        this.outerRadius = max(this.dataPoints.map(d => this.arcSvg.outerRadius()(d)));

        if (showOuterLine) {
            this.outerRadius *= this.ticksOptions.diffPercent;
            this.ticksRadiusArray = this.calcTicksRadius(this.ticksOptions.ticksCount, this.outerRadius);
            this.tickValuesArray = this.calcTicksValues(this.ticksOptions.ticksCount, this.ticksOptions.maxHeight);
        }
    }

    public drawCenterText(mainGroupElement: Selection<any>): void {
        const centerTextProperties: TextProperties = {
            text: this.data.centerText,
            fontFamily: this.settings.label.font.fontFamily.value,
            fontSize: PixelConverter.toString(this.settings.label.font.fontSize.value),
            fontWeight: this.settings.label.font.bold.value ? "bold" : "normal",
            fontStyle: this.settings.label.font.italic.value ? "italic" : "normal",
        };

        let centerText: Selection<any> = mainGroupElement.select(DataRenderService.CenterLabelClass.selectorName);

        if (centerText.empty()) {
            centerText = mainGroupElement.append("text").classed(DataRenderService.CenterLabelClass.className, true);
        }

        centerText
            .classed(HtmlSubSelectableClass, this.formatMode && this.settings.label.show.value)
            .attr(SubSelectableObjectNameAttribute, AsterPlotObjectNames.Label.name)
            .attr(SubSelectableDisplayNameAttribute,  AsterPlotObjectNames.Label.displayName)
            .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Text)
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
    }

    public cleanCenterText(mainGroupElement: Selection<any>): void {
        mainGroupElement.select(DataRenderService.CenterLabelClass.selectorName).remove();
    }

    public renderArcs(slicesElement: Selection<any>, isHighlighted: boolean) {
        const arc: Arc<any, AsterArcDescriptor> = this.arcSvg;
        const classSelector: ClassAndSelector = this.getClassAndSelector(isHighlighted);

        let selection = slicesElement
            .selectAll(classSelector.selectorName)
            .data(isHighlighted ? this.highlightedDataPoints : this.dataPoints, (d: AsterArcDescriptor, i: number) => {
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
            .classed(classSelector.className, true))
            .classed(HtmlSubSelectableClass, this.formatMode)
            .attr(SubSelectableObjectNameAttribute, AsterPlotObjectNames.Pies.name)
            .attr(SubSelectableDisplayNameAttribute, (d) => d.data.categoryName)
            .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Shape);

        selection
            .attr("fill", d => d.data.fillColor)
            .attr("stroke", d => d.data.strokeColor)
            .attr("stroke-width", d => d.data.strokeWidth)
            .call(selection => {
                return Helpers.needToSetTransition(this.layout.viewportChanged)
                    ? Helpers.setAttr(selection, "d", arc)
                    : Helpers.setTransition(selection, DataRenderService.AnimationDuration, "d", arc);
            });

        this.applyTooltipToSelection(selection);
    }

    private drawGrid(element: Selection<any>, settings: OuterLineCardSettings): void {
        const color: string = settings.color.value.value;
        const ticksCount: number = this.ticksRadiusArray.length;

        let circleAxes: Selection<any> = element
            .selectAll("g" + DataRenderService.CircleLine.selectorName)
            .data(this.ticksRadiusArray);

        circleAxes.exit().remove();

        circleAxes = circleAxes.merge(
            circleAxes.enter().append("g").classed(DataRenderService.CircleLine.className, true));

        let circle: any = circleAxes
            .selectAll("circle")
            .data((t) => { return [t]; });

        circle
            .exit()
            .remove();

        circle = circle.merge(circle
            .enter()
            .append("circle"));

        circle
            .attr("r", (d) => d)
            .style("opacity", (d: number, i: number, o: number) => {
                if (o === ticksCount - 1) {
                    return 0;
                } else {
                    return settings.showGrid.value ? 0.5 : 0;
                }
            })
            .style("stroke", color)
            .style("fill", "none");

        if (settings.showGridTicksValues.value) {
            let text: any = circleAxes.selectAll("text").data(this.tickValuesArray);
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

        } else {
            element.selectAll(DataRenderService.CircleText.selectorName).remove();
        }
    }

    private drawOuter(element: Selection<any>) {
        const outlineArc: any = arc()
            .innerRadius(this.settings.outerLine.showStraightLines.value ? this.innerRadius : this.outerRadius)
            .outerRadius(this.outerRadius);

        const outerThickness: string = this.settings.outerLine.thickness.value + "px";
        const color: string = this.settings.outerLine.color.value.value;

        let outerLine = element.selectAll(DataRenderService.OuterLine.selectorName).data(this.dataPoints);
        outerLine.exit().remove();
        outerLine = outerLine.merge(outerLine.enter().append("path"));
        outerLine
            .attr("fill", "none")
            .attr("opacity", 0.5)
            .attr("stroke", color)
            .attr("stroke-width", outerThickness)
            .attr("d", <ArcDescriptor<any>>outlineArc)
            .classed(DataRenderService.OuterLine.className, true)

        const singleOuterLine: d3.Selection<BaseType, AsterArcDescriptor, any, any> = select(outerLine.node())
        singleOuterLine
            .classed(HtmlSubSelectableClass, this.formatMode)
            .attr(SubSelectableObjectNameAttribute, AsterPlotObjectNames.OuterLine.name)
            .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName(AsterPlotObjectNames.OuterLine.displayNameKey))
            .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Shape);
    }

    public drawOuterLines(element: Selection<any>): void {
        const settings: AsterPlotSettingsModel = this.settings;

        this.drawOuter(element);

        if (settings.outerLine.showGrid.value || settings.outerLine.showGridTicksValues.value) {
            this.drawGrid(element, settings.outerLine);
        } else {
            this.cleanGrid(element);
        }
    }

    private cleanGrid(element: Selection<any>): void {
        element.selectAll(DataRenderService.CircleLine.selectorName).remove();
        element.selectAll(DataRenderService.CircleText.selectorName).remove();
        element.selectAll("circle").remove();
    }

    public cleanOuterLines(element: Selection<any>): void {
        element.selectAll(DataRenderService.OuterLine.selectorName).remove();
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
        let array: any[];

        if (ticksCount % 3 === 0) {
            array = [(radius - this.innerRadius) / 3 + this.innerRadius / this.ticksOptions.diffPercent, (radius - this.innerRadius) / 3 * 2 + this.innerRadius / this.ticksOptions.diffPercent, radius];
        } else {
            array = [(radius - this.innerRadius) / 2 + this.innerRadius / this.ticksOptions.diffPercent, radius];
        }

        return array;
    }

    private calcTicksValues(ticksCount: number, outerValue: number): number[] {
        let array: any[];

        if (ticksCount % 3 === 0) {
            array = [outerValue / 3, outerValue / 3 * 2, outerValue];
        } else {
            array = [outerValue / 2, outerValue];
        }

        return array;
    }

    private applyTooltipToSelection(selection: d3.Selection<d3.BaseType, AsterArcDescriptor, any, any>): void {
        this.tooltipServiceWrapper.addTooltip(selection, (tooltipEvent: PieArcDatum<AsterDataPoint>) => {
            return tooltipEvent.data?.tooltipInfo;
        });
    }

    private createDataPoints(data: AsterPlotData, hasHighlight: boolean, totalWeight: number): AsterArcDescriptor[] {
        const pie: any = this.getPieLayout(totalWeight);

        return pie(hasHighlight
            ? data.highlightedDataPoints
            : data.dataPoints);
    }

    public getDataPoints(isHighlight: boolean): AsterArcDescriptor[] {
        return isHighlight ? this.highlightedDataPoints : this.dataPoints;
    }

    private getClassAndSelector(isHighlighted: boolean) {
        return (isHighlighted
            ? DataRenderService.AsterHighlightedSlice
            : DataRenderService.AsterSlice);
    }

    private getPieLayout(totalWeight: number): any {
        return d3.pie<AsterDataPoint>()
            .sort(null)
            .value((dataPoint: AsterDataPoint) => {
                if (!this.totalWeight || !dataPoint || isNaN(dataPoint.sliceWidth)) {
                    return 0;
                }

                return dataPoint.sliceWidth / totalWeight;
            });
    }

    public computeOuterRadius(arcDescriptor: AsterArcDescriptor): number {
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

    private getArcSvg(innerRadius: number = this.innerRadius, viewportRadius: number = this.viewportRadius, maxHeight: number = this.maxHeight) {
        return arc<AsterArcDescriptor>()
            .innerRadius(innerRadius)
            .outerRadius((arcDescriptor: AsterArcDescriptor) => {
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


    public renderLabels(labelsElement: Selection<any>, isHighlight: boolean) {
        const dataPoints: AsterArcDescriptor[] = isHighlight ? this.highlightedDataPoints : this.dataPoints;
        if (!this.data.hasHighlights || (this.data.hasHighlights && isHighlight)) {
            const labelArc = arc<AsterArcDescriptor>()
                .innerRadius(d => this.labelRadCalc(d.data))
                .outerRadius(d => this.labelRadCalc(d.data));

            const outlineArc = arc<AsterArcDescriptor>()
                .innerRadius(d => this.lineRadCalc(d.data))
                .outerRadius(d => this.lineRadCalc(d.data));

            const labelLayout: ILabelLayout = this.getLabelLayout(labelArc, this.layout.viewport);
            this.drawLabels(
                dataPoints.filter(x => !isHighlight || x.data.sliceHeight !== null),
                labelsElement,
                labelLayout,
                this.layout.viewport,
                outlineArc);
        }
    }

    public cleanLabels(labelsElement: Selection<any>): void {
        dataLabelUtils.cleanDataLabels(labelsElement, true);
    }

    private drawLabels(data: ArcDescriptor<AsterDataPoint>[],
        context: Selection<AsterArcDescriptor>,
        layout: ILabelLayout,
        viewport: IViewport,
        outlineArc: any): void {
        // Hide and reposition labels that overlap
        const dataLabelManager: DataLabelManager = new DataLabelManager();
        let filteredData: LabelEnabledDataPoint[] = dataLabelManager.hideCollidedLabels(viewport, data, layout, true /* addTransform */);

        if (filteredData.length === 0) {
            dataLabelUtils.cleanDataLabels(context, true);
            return;
        }

        // Draw labels
        if (context.select(DataRenderService.labelGraphicsContextClass.selectorName).empty()) {
            context.append("g").classed(DataRenderService.labelGraphicsContextClass.className, true);
        }

        let labels: Selection<any> = context
            .select(DataRenderService.labelGraphicsContextClass.selectorName)
            .selectAll(DataRenderService.DataLabels.selectorName)
            .data<LabelEnabledDataPoint>(
                filteredData,
                (d: AsterArcDescriptor) => (<ISelectionId>d.data.identity).getKey());

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

        labels
            .attr("x", (d: LabelEnabledDataPoint) => d.labelX)
            .attr("y", (d: LabelEnabledDataPoint) => d.labelY)
            .attr("dy", ".35em")
            .text((d: LabelEnabledDataPoint) => d.labeltext)
            .style("text-anchor", layout.style["text-anchor"])
            .style("fill", this.settings.labels.color.value.value)
            .style("font-family", this.settings.labels.font.fontFamily.value || dataLabelUtils.StandardFontFamily)
            .style("font-weight", this.settings.labels.font.bold.value ? "bold" : "normal")
            .style("font-style", this.settings.labels.font.italic.value ? "italic" : "normal")
            .style("text-decoration", this.settings.labels.font.underline.value ? "underline" : "none")
            .style("font-size", PixelConverter.fromPoint(this.settings.labels.font.fontSize.value));

        // Draw lines
        if (context.select(DataRenderService.linesGraphicsContextClass.selectorName).empty())
            context.append("g").classed(DataRenderService.linesGraphicsContextClass.className, true);

        // Remove lines for null and zero values
        filteredData = filter(filteredData, (d: AsterArcDescriptor) => d.data.sliceHeight !== null && d.data.sliceHeight !== 0);

        let lines = context
            .select(DataRenderService.linesGraphicsContextClass.selectorName)
            .selectAll("polyline")
            .data<LabelEnabledDataPoint>(
                filteredData,
                (d: AsterArcDescriptor) => (<ISelectionId>d.data.identity).getKey());

        const midAngle = (d: any) => {
            return d.startAngle + (d.endAngle - d.startAngle) / 2;
        };

        lines
            .exit()
            .remove();

        lines = lines.merge(
            lines
                .enter()
                .append("polyline")
                .classed(DataRenderService.LineLabel.className, true))
                .classed(HtmlSubSelectableClass, this.formatMode && this.settings.labels.show.value)
                .attr(SubSelectableObjectNameAttribute, AsterPlotObjectNames.Labels.name)
                .attr(SubSelectableDisplayNameAttribute, AsterPlotObjectNames.Labels.name);

        lines
            .attr("points", (d) => {
                const textPoint = [d.labelX, d.labelY];
                textPoint[0] = textPoint[0] + ((midAngle(<any>d) < Math.PI ? -1 : 1) * DataRenderService.LabelLinePadding);
                const chartPoint = outlineArc.centroid(<any>d);
                chartPoint[0] *= DataRenderService.ChartLinePadding;
                chartPoint[1] *= DataRenderService.ChartLinePadding;

                return <any>[chartPoint, textPoint];
            })
            .style("opacity", 0.5)
            .style("fill-opacity", 0)
            .style("stroke", () => this.settings.labels.color.value.value);


    }

    private getLabelLayout(arc: d3.Arc<any, AsterArcDescriptor>, viewport: IViewport): ILabelLayout {
        const midAngle = (d: any) => {
            return d.startAngle + (d.endAngle - d.startAngle) / 2;
        };
        const textProperties: TextProperties = {
            text: "",
            fontFamily: this.settings.labels.font.fontFamily.value || dataLabelUtils.StandardFontFamily,
            fontSize: PixelConverter.fromPoint(this.settings.labels.font.fontSize.value),
            fontWeight: this.settings.labels.font.bold ? "bold" : "normal",
            fontStyle: this.settings.labels.font.italic ? "italic" : "normal",
        };

        const isLabelsHasConflict = (d: AsterArcDescriptor) => {
            const pos = arc.centroid(d);
            textProperties.text = d.data.label;
            const textWidth = textMeasurementService.measureSvgTextWidth(textProperties);
            const horizontalSpaceAvailableForLabels = viewport.width / 2 - Math.abs(pos[0]);
            const textHeight = textMeasurementService.estimateSvgTextHeight(textProperties);
            const verticalSpaceAvailableForLabels = viewport.height / 2 - Math.abs(pos[1]);
            d.isLabelHasConflict = textWidth > horizontalSpaceAvailableForLabels || textHeight > verticalSpaceAvailableForLabels;
            return d.isLabelHasConflict;
        };

        return {
            labelText: (d: AsterArcDescriptor) => {
                textProperties.text = d.data.label;
                const pos = arc.centroid(d);
                const xPos = isLabelsHasConflict(d) ? pos[0] * DataRenderService.AsterConflictRatio : pos[0];
                const spaceAvailableForLabels = viewport.width / 2 - Math.abs(xPos);
                return textMeasurementService.getTailoredTextOrDefault(textProperties, spaceAvailableForLabels);
            },
            labelLayout: {
                x: (d: AsterArcDescriptor) => {
                    const pos = arc.centroid(d);
                    textProperties.text = d.data.label;
                    return d.isLabelHasConflict ? pos[0] * DataRenderService.AsterConflictRatio : pos[0];
                },
                y: (d: AsterArcDescriptor) => {
                    const pos: [number, number] = arc.centroid(d);
                    return d.isLabelHasConflict ? pos[1] * DataRenderService.AsterConflictRatio : pos[1];
                },
            },
            filter: (d: AsterArcDescriptor) => (d != null && !isEmpty(d.data.label + "")),
            style: {
                "text-anchor": (d: AsterArcDescriptor) => midAngle(d) < Math.PI ? "start" : "end",
            }
        };
    }
}
