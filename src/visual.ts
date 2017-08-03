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

module powerbi.extensibility.visual {
    // powerbi
    import IViewport = powerbi.IViewport;
    import DataView = powerbi.DataView;
    import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
    import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
    import VisualObjectInstance = powerbi.VisualObjectInstance;
    import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
    import DataViewCategoricalColumn = powerbi.DataViewCategoricalColumn;
    import DataViewValueColumn = powerbi.DataViewValueColumn;
    import IVisual = powerbi.extensibility.IVisual;
    import IDataColorPalette = powerbi.extensibility.IColorPalette;
    import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

    // powerbi.extensibility.visual
    import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
    import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;

    // powerbi.extensibility.utils.svg
    import IMargin = powerbi.extensibility.utils.svg.IMargin;
    import translate = powerbi.extensibility.utils.svg.translate;
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;

    // powerbi.extensibility.utils.type
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;

    // powerbi.extensibility.utils.chart
    import ILegend = powerbi.extensibility.utils.chart.legend.ILegend;
    import LegendData = powerbi.extensibility.utils.chart.legend.LegendData;
    import LegendDataModule = powerbi.extensibility.utils.chart.legend.data;
    import dataLabelUtils = powerbi.extensibility.utils.chart.dataLabel.utils;
    import legendPosition = powerbi.extensibility.utils.chart.legend.position;
    import createLegend = powerbi.extensibility.utils.chart.legend.createLegend;
    import LegendPosition = powerbi.extensibility.utils.chart.legend.LegendPosition;
    import positionChartArea = powerbi.extensibility.utils.chart.legend.positionChartArea;
    import LabelEnabledDataPoint = powerbi.extensibility.utils.chart.dataLabel.LabelEnabledDataPoint;

    // powerbi.extensibility.utils.interactivity
    import appendClearCatcher = powerbi.extensibility.utils.interactivity.appendClearCatcher;
    import createInteractivityService = powerbi.extensibility.utils.interactivity.createInteractivityService;

    // powerbi.extensibility.utils.interactivity
    import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
    import IInteractiveBehavior = powerbi.extensibility.utils.interactivity.IInteractiveBehavior;

    // powerbi.extensibility.utils.color
    import ColorHelper = powerbi.extensibility.utils.color.ColorHelper;

    // powerbi.extensibility.utils.tooltip
    import ITooltipServiceWrapper = powerbi.extensibility.utils.tooltip.ITooltipServiceWrapper;
    import createTooltipServiceWrapper = powerbi.extensibility.utils.tooltip.createTooltipServiceWrapper;

    let AsterPlotVisualClassName: string = "asterPlot";

    export class AsterPlot implements IVisual {
        private static AsterSlices: ClassAndSelector = createClassAndSelector("asterSlices");
        private static AsterSlice: ClassAndSelector = createClassAndSelector("asterSlice");
        private static AsterHighlightedSlice: ClassAndSelector = createClassAndSelector("asterHighlightedSlice");
        private static OuterLine: ClassAndSelector = createClassAndSelector("outerLine");
        private static CenterLabelClass: ClassAndSelector = createClassAndSelector("centerLabel");

        private layout: VisualLayout;

        private static PiesPropertyIdentifier: DataViewObjectPropertyIdentifier = {
            objectName: "pies",
            propertyName: "fill"
        };

        private svg: d3.Selection<any>;
        private mainGroupElement: d3.Selection<any>;
        private mainLabelsElement: d3.Selection<any>;
        private slicesElement: d3.Selection<AsterPlotData>;
        private clearCatcher: d3.Selection<any>;

        private colors: IDataColorPalette;

        private visualHost: IVisualHost;
        private interactivityService: IInteractivityService;

        private renderService: DataRenderService;

        private legend: ILegend;
        private data: AsterPlotData;

        private get settings(): AsterPlotSettings {
            return this.data && this.data.settings;
        }

        private behavior: IInteractiveBehavior;

        private tooltipServiceWrapper: ITooltipServiceWrapper;

        constructor(options: VisualConstructorOptions) {

            this.visualHost = options.host;

            this.tooltipServiceWrapper = createTooltipServiceWrapper(
                this.visualHost.tooltipService,
                options.element);

            this.layout = new VisualLayout(null, {
                top: 10,
                right: 10,
                bottom: 15,
                left: 10
            });

            let svg: d3.Selection<any> = this.svg = d3.select(options.element)
                .append("svg")
                .classed(AsterPlotVisualClassName, true)
                .style("position", "absolute");

            this.colors = options.host.colorPalette;
            this.mainGroupElement = svg.append("g");
            this.mainLabelsElement = svg.append("g");

            this.behavior = new AsterPlotWebBehavior();
            this.clearCatcher = appendClearCatcher(this.mainGroupElement);

            this.slicesElement = this.mainGroupElement
                .append("g")
                .classed(AsterPlot.AsterSlices.className, true);

            this.interactivityService = createInteractivityService(options.host);

            this.legend = createLegend(
                options.element,
                options.host && false,
                this.interactivityService,
                true);
        }

        public static converter(dataView: DataView, colors: IDataColorPalette, visualHost: IVisualHost): AsterPlotData {
            let categorical = AsterPlotColumns.getCategoricalColumns(dataView);

            if (!AsterPlotConverterService.isDataValid(categorical)) {
                return;
            }

            let settings: AsterPlotSettings = AsterPlot.parseSettings(dataView, categorical.Category.source);
            let converterService: AsterPlotConverterService = new AsterPlotConverterService(dataView, settings, colors, visualHost, categorical);

            return converterService.getConvertedData();
        }

        private static parseSettings(dataView: DataView, categorySource: DataViewMetadataColumn): AsterPlotSettings {
            let settings: AsterPlotSettings = AsterPlotSettings.parse<AsterPlotSettings>(dataView);

            settings.labels.precision = Math.min(17, Math.max(0, settings.labels.precision));
            settings.outerLine.thickness = Math.min(25, Math.max(0.1, settings.outerLine.thickness));

            if (_.isEmpty(settings.legend.titleText)) {
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

            if (!this.areValidOptions(options)) {
                return;
            }

            let data = AsterPlot.converter(options.dataViews[0], this.colors, this.visualHost);

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
        }

        private removeHighlightedSlice(): void {
            this.slicesElement.selectAll(AsterPlot.AsterHighlightedSlice.selectorName).remove();
        }

        private transformAndResizeMainSvgElements() {
            this.svg.attr({
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
                    hasHighlights: this.data.hasHighlights
                };

                this.interactivityService.bind(
                    this.data.dataPoints.concat(this.data.highlightedDataPoints),
                    this.behavior,
                    behaviorOptions);
            }
        }

        private renderLegend(): void {
            if (this.settings.legend.show) {
                // Force update for title text
                let legendObject = _.clone(this.settings.legend);
                legendObject.labelColor = <any>{ solid: { color: legendObject.labelColor } };
                LegendDataModule.update(this.data.legendData, <any>legendObject);
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
                const identity: ISelectionId = pie.identity as ISelectionId,
                    displayName: string = `${pie.categoryName}`;

                this.addAnInstanceToEnumeration(instanceEnumeration, {
                    displayName,
                    objectName: AsterPlot.PiesPropertyIdentifier.objectName,
                    selector: ColorHelper.normalizeSelector(identity.getSelector(), false),
                    properties: {
                        fill: { solid: { color: pie.color } }
                    }
                });
            });
        }

        private addAnInstanceToEnumeration(
            instanceEnumeration: VisualObjectInstanceEnumeration,
            instance: VisualObjectInstance): void {

            let objectInstanceEnumeration: VisualObjectInstanceEnumerationObject = instanceEnumeration as VisualObjectInstanceEnumerationObject;

            if (objectInstanceEnumeration.instances) {
                objectInstanceEnumeration
                    .instances
                    .push(instance);
            } else {
                (instanceEnumeration as VisualObjectInstance[]).push(instance);
            }
        }
    }
}
