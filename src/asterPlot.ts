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
    // d3
    import ArcDescriptor = d3.layout.pie.Arc;
    import SvgArc = d3.svg.Arc;

    // jsCommon
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
    import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;
    import PixelConverter = jsCommon.PixelConverter;
    import IStringResourceProvider = jsCommon.IStringResourceProvider;

    // powerbi
    // import IVisualWarning = powerbi.IVisualWarning;
    //import IVisualErrorMessage = powerbi.IVisualErrorMessage;
    import IViewport = powerbi.IViewport;
    import DataView = powerbi.DataView;
    import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
    import IEnumType = powerbi.IEnumType;
    import createEnumType = powerbi.createEnumType;
    import IEnumMember = powerbi.IEnumMember;
    import DataViewObjects = powerbi.DataViewObjects;
    import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
    import VisualObjectInstance = powerbi.VisualObjectInstance;
    import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
    import DataViewValueColumns = powerbi.DataViewValueColumns;
    import DataViewCategoricalColumn = powerbi.DataViewCategoricalColumn;
    import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
    import DataViewValueColumn = powerbi.DataViewValueColumn;
    import IVisual = powerbi.extensibility.IVisual;
    import IDataColorPalette = powerbi.extensibility.IColorPalette;
    import DataViewScopeIdentity = powerbi.DataViewScopeIdentity;
    import IVisualHostServices = powerbi.extensibility.IVisualHost;
    import VisualInitOptions = powerbi.extensibility.VisualConstructorOptions;

    import TextProperties = powerbi.TextProperties;
    import TextMeasurementService = powerbi.TextMeasurementService;
    import DataLabelManager = powerbi.DataLabelManager;
    import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
    import VisualDataRoleKind = powerbi.VisualDataRoleKind;

    // powerbi.extensibility.visual
    import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
    import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;

    // powerbi.data
    //import DataViewObjectPropertyTypeDescriptor = powerbi.data.DataViewObjectPropertyTypeDescriptor;

    // powerbi.visuals
    import ValueFormatter = powerbi.visuals.valueFormatter;
    import LegendData = powerbi.visuals.LegendData;
    import IValueFormatter = powerbi.visuals.IValueFormatter;
    import SelectableDataPoint = powerbi.visuals.SelectableDataPoint;
    import TooltipDataItem = powerbi.visuals.TooltipDataItem;
    import IInteractivityService = powerbi.visuals.IInteractivityService;
    import IInteractiveBehavior = powerbi.visuals.IInteractiveBehavior;
    import ISelectionHandler = powerbi.visuals.ISelectionHandler;
    import IMargin = powerbi.visuals.IMargin;
    //import ObjectEnumerationBuilder = powerbi.visuals.ObjectEnumerationBuilder;
    import LegendPosition = powerbi.visuals.LegendPosition;
    import dataLabelUtils = powerbi.visuals.dataLabelUtils;
    import converterHelper = powerbi.visuals.converterHelper;
    import legendPosition = powerbi.visuals.legendPosition;
    import ColorHelper = powerbi.visuals.ColorHelper;
    import valueFormatter = powerbi.visuals.valueFormatter;
    import TooltipBuilder = powerbi.visuals.TooltipBuilder;
    import ISelectionId = powerbi.visuals.ISelectionId;
    import LegendIcon = powerbi.visuals.LegendIcon;
    import ILegend = powerbi.visuals.ILegend;
    import appendClearCatcher = powerbi.visuals.appendClearCatcher;
    import createInteractivityService = powerbi.visuals.createInteractivityService;
    import createLegend = powerbi.visuals.createLegend;
    import MinervaAnimationDuration = powerbi.visuals.AnimatorCommon.MinervaAnimationDuration;
    import SVGUtil = powerbi.visuals.SVGUtil;
    import TooltipManager = powerbi.visuals.TooltipManager;
    import TooltipEvent = powerbi.visuals.TooltipEvent;
    import ILabelLayout = powerbi.visuals.ILabelLayout;
    import LabelEnabledDataPoint = powerbi.visuals.LabelEnabledDataPoint;
    import Legend = powerbi.visuals.Legend;

    var AsterPlotVisualClassName: string = "asterPlot";
    var AsterRadiusRatio: number = 0.9;
    var AsterConflictRatio = 0.9;

    export interface IVisualErrorMessage {
        message: string;
        title: string;
        detail: string;
    }

    export interface IVisualWarning {
        code: string;
        getMessages(resourceProvider: IStringResourceProvider): IVisualErrorMessage;
    }

    export interface AsterPlotData {
        dataPoints: AsterDataPoint[];
        highlightedDataPoints?: AsterDataPoint[];
        settings: AsterPlotSettings;
        hasHighlights: boolean;
        legendData: LegendData;
        labelFormatter: IValueFormatter;
        centerText: string;
    }

    export interface AsterArcDescriptor extends ArcDescriptor<AsterDataPoint> {
        isLabelHasConflict?: boolean;
        data: AsterDataPoint;
    }

    export interface AsterDataPoint extends SelectableDataPoint {
        color: string;
        sliceHeight: number;
        sliceWidth: number;
        label: string;
        highlight?: boolean;
        tooltipInfo: TooltipDataItem[];
        labelFontSize: string;
    }

    export interface AsterPlotBehaviorOptions {
        selection: d3.Selection<any>;
        clearCatcher: d3.Selection<any>;
        interactivityService: IInteractivityService;
        hasHighlights: boolean;
    }

    class AsterPlotWebBehavior implements IInteractiveBehavior {
        private selection: d3.Selection<any>;
        private clearCatcher: d3.Selection<any>;
        private interactivityService: IInteractivityService;
        private hasHighlights: boolean;

        public bindEvents(options: AsterPlotBehaviorOptions, selectionHandler: ISelectionHandler) {
            this.selection = options.selection;
            this.clearCatcher = options.clearCatcher;
            this.interactivityService = options.interactivityService;
            this.hasHighlights = options.hasHighlights;

            this.selection.on("click", (d, i: number) => {
                selectionHandler.handleSelection(d.data, (d3.event as MouseEvent).ctrlKey);
            });

            this.clearCatcher.on("click", () => {
                selectionHandler.handleClearSelection();
            });

            this.renderSelection(this.interactivityService.hasSelection());
        }

        public renderSelection(hasSelection: boolean) {
            this.selection.style("fill-opacity", (d) => {
                return asterPlotUtils.getFillOpacity(
                    d.data.selected,
                    d.data.highlight,
                    hasSelection,
                    this.hasHighlights);
            });
        }
    }

    export class AsterPlotWarning implements IVisualWarning {
        private message: string;
        constructor(message: string) {
            this.message = message;
        }

        public get code(): string {
            return "AsterPlotWarning";
        }

        public getMessages(resourceProvider: IStringResourceProvider): IVisualErrorMessage {
            return {
                message: this.message,
                title: resourceProvider.get(""),
                detail: resourceProvider.get("")
            };
        }
    }

    class VisualLayout {
        private marginValue: IMargin;
        private viewportValue: IViewport;
        private viewportInValue: IViewport;
        private minViewportValue: IViewport;
        private originalViewportValue: IViewport;
        private previousOriginalViewportValue: IViewport;

        public defaultMargin: IMargin;
        public defaultViewport: IViewport;

        constructor(defaultViewport?: IViewport, defaultMargin?: IMargin) {
            this.defaultViewport = defaultViewport || { width: 0, height: 0 };
            this.defaultMargin = defaultMargin || { top: 0, bottom: 0, right: 0, left: 0 };
        }

        public get viewport(): IViewport {
            return this.viewportValue || (this.viewportValue = this.defaultViewport);
        }

        public get viewportCopy(): IViewport {
            return _.clone(this.viewport);
        }

        //Returns viewport minus margin
        public get viewportIn(): IViewport {
            return this.viewportInValue || this.viewport;
        }

        public get minViewport(): IViewport {
            return this.minViewportValue || { width: 0, height: 0 };
        }

        public get margin(): IMargin {
            return this.marginValue || (this.marginValue = this.defaultMargin);
        }

        public set minViewport(value: IViewport) {
            this.setUpdateObject(value, v => this.minViewportValue = v, VisualLayout.restrictToMinMax);
        }

        public set viewport(value: IViewport) {
            this.previousOriginalViewportValue = _.clone(this.originalViewportValue);
            this.originalViewportValue = _.clone(value);
            this.setUpdateObject(value,
                v => this.viewportValue = v,
                o => VisualLayout.restrictToMinMax(o, this.minViewport));
        }

        public set margin(value: IMargin) {
            this.setUpdateObject(value, v => this.marginValue = v, VisualLayout.restrictToMinMax);
        }

        //Returns true if viewport has updated after last change.
        public get viewportChanged(): boolean {
            return !!this.originalViewportValue && (!this.previousOriginalViewportValue
                || this.previousOriginalViewportValue.height !== this.originalViewportValue.height
                || this.previousOriginalViewportValue.width !== this.originalViewportValue.width);
        }

        public get viewportInIsZero(): boolean {
            return this.viewportIn.width === 0 || this.viewportIn.height === 0;
        }

        public resetMargin(): void {
            this.margin = this.defaultMargin;
        }

        private update(): void {
            this.viewportInValue = VisualLayout.restrictToMinMax({
                width: this.viewport.width - (this.margin.left + this.margin.right),
                height: this.viewport.height - (this.margin.top + this.margin.bottom)
            }, this.minViewportValue);
        }

        private setUpdateObject<T>(object: T, setObjectFn: (T) => void, beforeUpdateFn?: (T) => void): void {
            object = _.clone(object);
            setObjectFn(VisualLayout.createNotifyChangedObject(object, o => {
                if (beforeUpdateFn) beforeUpdateFn(object);
                this.update();
            }));

            if (beforeUpdateFn) beforeUpdateFn(object);
            this.update();
        }

        private static createNotifyChangedObject<T>(object: T, objectChanged: (o?: T, key?: string) => void): T {
            var result: T = <any>{};
            _.keys(object).forEach(key => Object.defineProperty(result, key, {
                get: () => object[key],
                set: (value) => { object[key] = value; objectChanged(object, key); },
                enumerable: true,
                configurable: true
            }));
            return result;
        }

        private static restrictToMinMax<T>(value: T, minValue?: T): T {
            _.keys(value).forEach(x => value[x] = Math.max(minValue && minValue[x] || 0, value[x]));
            return value;
        }
    }

    class Helpers {
        public static setAttrThroughTransitionIfNotResized(
            element: d3.Selection<any>,
            setTransision: (t: d3.Transition<any>) => d3.Transition<any>,
            attrName: string,
            attrValue: (data: any, index: number) => any,
            attrTransitionValue: (data: any, index: number) => any,
            viewportChanged: boolean) {
            if (viewportChanged) {
                element.attr(attrName, attrValue);
            } else {
                setTransision(element.transition()).attrTween(attrName, attrTransitionValue);
            }
        }

        public static interpolateArc(arc: any) {
            return function (data) {
                if (!this.oldData) {
                    this.oldData = data;
                    return () => arc(data);
                }

                var interpolation = d3.interpolate(this.oldData, data);
                this.oldData = interpolation(0);
                return (x) => arc(interpolation(x));
            };
        }

        public static addContext(context: any, fn: Function): any {
            return <any>function () {
                return fn.apply(context, [this].concat(_.toArray(arguments)));
            };
        }
    }

    export class AsterPlotColumns<T> {
        public static getColumnSources(dataView: DataView) {
            return this.getColumnSourcesT<DataViewMetadataColumn>(dataView);
        }

        public static getTableValues(dataView: DataView) {
            var table = dataView && dataView.table;
            var columns = this.getColumnSourcesT<any[]>(dataView);
            return columns && table && _.mapValues(
                columns, (n: DataViewMetadataColumn, i) => n && table.rows.map(row => row[n.index]));
        }

        public static getTableRows(dataView: DataView) {
            var table = dataView && dataView.table;
            var columns = this.getColumnSourcesT<any[]>(dataView);
            return columns && table && table.rows.map(row =>
                _.mapValues(columns, (n: DataViewMetadataColumn, i) => n && row[n.index]));
        }

        public static getCategoricalValues(dataView: DataView) {
            var categorical = dataView && dataView.categorical;
            var categories = categorical && categorical.categories || [];
            var values = categorical && categorical.values || <DataViewValueColumns>[];
            var series = categorical && values.source && this.getSeriesValues(dataView);
            return categorical && _.mapValues(new this<any[]>(), (n, i) =>
                (<DataViewCategoricalColumn[]>_.toArray(categories)).concat(_.toArray(values))
                    .filter(x => x.source.roles && x.source.roles[i]).map(x => x.values)[0]
                || values.source && values.source.roles && values.source.roles[i] && series);
        }

        public static getSeriesValues(dataView: DataView) {
            return dataView && dataView.categorical && dataView.categorical.values
                && dataView.categorical.values.map(x => converterHelper.getSeriesName(x.source));
        }

        public static getCategoricalColumns(dataView: DataView) {
            var categorical = dataView && dataView.categorical;
            var categories = categorical && categorical.categories || [];
            var values = categorical && categorical.values || <DataViewValueColumns>[];
            return categorical && _.mapValues(
                new this<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns>(),
                (n, i) => categories.filter(x => x.source.roles && x.source.roles[i])[0]
                    || values.source && values.source.roles && values.source.roles[i]
                    || values.filter(x => x.source.roles && x.source.roles[i]));
        }

        private static getColumnSourcesT<T>(dataView: DataView) {
            var columns = dataView && dataView.metadata && dataView.metadata.columns;
            return columns && _.mapValues(
                new this<T>(), (n, i) => columns.filter(x => x.roles && x.roles[i])[0]);
        }

        //Data Roles
        public Category: T = null;
        public Y: T = null;
    }

    export class AsterPlot implements IVisual {

        private static AsterSlices: ClassAndSelector = createClassAndSelector("asterSlices");
        private static AsterSlice: ClassAndSelector = createClassAndSelector("asterSlice");
        private static AsterHighlightedSlice: ClassAndSelector = createClassAndSelector("asterHighlightedSlice");
        private static OuterLine: ClassAndSelector = createClassAndSelector("outerLine");
        private static labelGraphicsContextClass: ClassAndSelector = createClassAndSelector("labels");
        private static linesGraphicsContextClass: ClassAndSelector = createClassAndSelector("lines");
        private static CenterLabelClass: ClassAndSelector = createClassAndSelector("centerLabel");
        private static CenterTextFontHeightCoefficient = 0.4;
        private static CenterTextFontWidthCoefficient = 1.9;
        private visualHost: IVisualHost;


        constructor(options: VisualConstructorOptions) {
            this.hostServices = options.host;
            
            this.layout = new VisualLayout(null, { top: 10, right: 10, bottom: 15, left: 10 });
            var svg: d3.Selection<any> = this.svg = d3.select(options.element)
                .append("svg")
                .classed(AsterPlotVisualClassName, true)
                .style("position", "absolute");

            this.colors = options.host.colorPalette;
            this.mainGroupElement = svg.append("g");
            this.mainLabelsElement = svg.append("g");
            this.behavior = new AsterPlotWebBehavior();
            this.clearCatcher = appendClearCatcher(this.mainGroupElement);
            this.slicesElement = this.mainGroupElement.append("g").classed(AsterPlot.AsterSlices.class, true);

            this.interactivityService = createInteractivityService(options.host);
            this.legend = createLegend($(options.element), options.host && false, this.interactivityService, true);

        }

        public static converter(dataView: DataView, colors: IDataColorPalette, hostServices: IVisualHost): AsterPlotData {
            var categorical = AsterPlotColumns.getCategoricalColumns(dataView);
            var catValues = AsterPlotColumns.getCategoricalValues(dataView);
            if (!categorical
                || !categorical.Category
                || _.isEmpty(categorical.Category.values)
                || _.isEmpty(categorical.Y)
                || _.isEmpty(categorical.Y[0].values)) {
                return;
            }
            var settings = AsterPlot.parseSettings(dataView);
            //var properties = AsterPlotSettings.getProperties(AsterPlot.capabilities);

            var dataPoints: AsterDataPoint[] = [];
            var highlightedDataPoints: AsterDataPoint[] = [];
            var legendData = <LegendData>{
                dataPoints: [],
                title: null,
                fontSize: settings.legend.fontSize,
                labelColor: LegendData.DefaultLegendLabelFillColor
            };

            var colorHelper: ColorHelper = new ColorHelper(colors);

            var hasHighlights: boolean = !!(categorical.Y[0].highlights);

            var maxValue: number = Math.max(d3.min(<number[]>categorical.Y[0].values));
            var minValue: number = Math.min(0, d3.min(<number[]>categorical.Y[0].values));
            //var labelFormatter: IValueFormatter = ValueFormatter.create({
            //    format: ValueFormatter.getFormatString(categorical.Y[0].source, properties.general.formatString),
            //    precision: settings.labels.precision,
            //    value: (settings.labels.displayUnits === 0) && (maxValue != null) ? maxValue : settings.labels.displayUnits,
            //});
            //var categorySourceFormatString = valueFormatter.getFormatString(categorical.Category.source, properties.general.formatString);
            var fontSizeInPx: string = PixelConverter.fromPoint(settings.labels.fontSize);

            for (var i = 0; i < catValues.Category.length; i++) {
                var formattedCategoryValue = catValues.Category[i];// valueFormatter.format(, categorySourceFormatString);
                var currentValue = <number>categorical.Y[0].values[i];

                var tooltipInfo: TooltipDataItem[] = TooltipBuilder.createTooltipInfo(
                    null,//properties.general.formatString,
                    dataView.categorical,
                    formattedCategoryValue,
                    currentValue,
                    null,
                    null,
                    0);

                if (categorical.Y.length > 1) {
                    var toolTip: TooltipDataItem = TooltipBuilder.createTooltipInfo(
                        null, //properties.general.formatString,
                        dataView.categorical,
                        formattedCategoryValue,
                        categorical.Y[1].values[i],
                        null,
                        null,
                        1)[1];

                    if (toolTip) {
                        tooltipInfo.push(toolTip);
                    }

                    currentValue += <number>categorical.Y[1].values[i];
                }

                var identity: DataViewScopeIdentity = categorical.Category.identity[i],
                    color: string,
                    sliceWidth: number;

                color = colorHelper.getColorForMeasure(
                    categorical.Category.objects && categorical.Category.objects[i],
                    identity.key);

                sliceWidth = Math.max(0, categorical.Y.length > 1 ? <number>categorical.Y[1].values[i] : 1);
                
                var visualHost: IVisualHost;
                var selectionId: ISelectionId = hostServices.createSelectionIdBuilder()
                    .withCategory(categorical[i], i)
                    .withMeasure(categorical.Category.values[i] == null ? "" : categorical.Category.values[i].toString())
                    .createSelectionId();

                if (sliceWidth > 0) {
                    dataPoints.push({
                        sliceHeight: <number>categorical.Y[0].values[i] - minValue,
                        sliceWidth: sliceWidth,
                        label: <any>currentValue,
                        color: color,
                        identity: selectionId,
                        selected: false,
                        tooltipInfo: tooltipInfo,
                        labelFontSize: fontSizeInPx,
                        highlight: false,
                    });
                }

                // Handle legend data
                if (settings.legend.show) {
                    legendData.dataPoints.push({
                        label: formattedCategoryValue,
                        color: color,
                        icon: LegendIcon.Box,
                        selected: false,
                        identity: selectionId
                    });
                }

                // Handle highlights
                if (hasHighlights) {
                    var highlightIdentity: ISelectionId = //SelectionId.createWithHighlight(selectionId);
                        visualHost.createSelectionIdBuilder()
                            .withMeasure(categorical.Category.source.queryName)
                            .createSelectionId();
                    var notNull: boolean = categorical.Y[0].highlights[i] != null;
                    currentValue = notNull ? <number>categorical.Y[0].highlights[i] : 0;

                    tooltipInfo = TooltipBuilder.createTooltipInfo(
                        null,//properties.general.formatString,
                        dataView.categorical,
                        formattedCategoryValue,
                        currentValue,
                        null,
                        null,
                        0);

                    if (categorical.Y.length > 1) {
                        var toolTip: TooltipDataItem = TooltipBuilder.createTooltipInfo(
                            null,//properties.general.formatString,
                            dataView.categorical,
                            formattedCategoryValue,
                            categorical.Y[1].highlights[i],
                            null,
                            null,
                            1)[1];
                        if (toolTip)
                            tooltipInfo.push(toolTip);

                        currentValue += categorical.Y[1].highlights[i] !== null ? <number>categorical.Y[1].highlights[i] : 0;
                    }

                    highlightedDataPoints.push({
                        sliceHeight: notNull ? <number>categorical.Y[0].highlights[i] - minValue : null,
                        sliceWidth: Math.max(0, (categorical.Y.length > 1 && categorical.Y[1].highlights[i] !== null) ? <number>categorical.Y[1].highlights[i] : sliceWidth),
                        label: <any>currentValue,
                        color: color,
                        identity: highlightIdentity,
                        selected: false,
                        tooltipInfo: tooltipInfo,
                        labelFontSize: fontSizeInPx,
                        highlight: true,
                    });
                }
            }

            return dataPoints.length && <AsterPlotData>{
                dataPoints: dataPoints,
                settings: settings,
                hasHighlights: hasHighlights,
                legendData: legendData,
                highlightedDataPoints: highlightedDataPoints,
                labelFormatter: null,//labelFormatter,
                centerText: categorical.Category.source.displayName
            };
        }

        //private static parseSettings(dataView: DataView, categorySource: DataViewMetadataColumn): AsterPlotSettings {
        //    var settings = AsterPlotSettings.parse(dataView, AsterPlot.capabilities);
        //    settings.labels.precision = Math.min(17, Math.max(0, settings.labels.precision));
        //    settings.outerLine.thickness = Math.min(300, Math.max(1, settings.outerLine.thickness));
        //    settings.createOriginalSettings();
        //    if (_.isEmpty(settings.legend.titleText)) {
        //        settings.legend.titleText = categorySource.displayName;
        //    }

        //    return settings;
        //}

        private static parseSettings(dataView: DataView): AsterPlotSettings {
            let settings: AsterPlotSettings = AsterPlotSettings.parse<AsterPlotSettings>(dataView);

            //settings.size.charge = Math.min(
            //    Math.max(settings.size.charge, ForceGraph.MinCharge),
            //    ForceGraph.MaxCharge);

            //settings.links.decimalPlaces = settings.links.decimalPlaces
            //    && Math.min(
            //        Math.max(settings.links.decimalPlaces, ForceGraph.MinDecimalPlaces),
            //        ForceGraph.MaxDecimalPlaces);

            return settings;
        }



        private layout: VisualLayout;
        private svg: d3.Selection<any>;
        private mainGroupElement: d3.Selection<any>;
        private mainLabelsElement: d3.Selection<any>;
        private slicesElement: d3.Selection<AsterPlotData>;
        private centerText: d3.Selection<any>;
        private clearCatcher: d3.Selection<any>;
        private colors: IDataColorPalette;
        private hostServices: IVisualHost;
        private interactivityService: IInteractivityService;
        private legend: ILegend;
        private data: AsterPlotData;
        private get settings(): AsterPlotSettings {
            return this.data && this.data.settings;
        }

        private behavior: IInteractiveBehavior;

        public update(options: VisualUpdateOptions): void {
            if (!options) {
                return; // or clear the view, display an error, etc.
            }

            this.layout.viewport = options.viewport;

            var duration = MinervaAnimationDuration; //options.suppressAnimations ? 0 :
            var data = AsterPlot.converter(options.dataViews[0], this.colors, this.hostServices);
            debugger;
            if (!data) {
                this.clear();
                return;
            }

            this.data = data;

            if (this.interactivityService) {
                this.interactivityService.applySelectionStateToData(this.data.dataPoints);
                this.interactivityService.applySelectionStateToData(this.data.highlightedDataPoints);
            }

            this.renderLegend();
            this.updateViewPortAccordingToLegend();

            //this.svg.attr(this.layout.viewport);

            var transformX: number = (this.layout.viewportIn.width + this.layout.margin.right) / 2;
            var transformY: number = (this.layout.viewportIn.height + this.layout.margin.bottom) / 2;

            this.mainGroupElement.attr("transform", SVGUtil.translate(transformX, transformY));
            this.mainLabelsElement.attr("transform", SVGUtil.translate(transformX, transformY));

            // Move back the clearCatcher
            this.clearCatcher.attr("transform", SVGUtil.translate(-transformX, -transformY));

            dataLabelUtils.cleanDataLabels(this.mainLabelsElement, true);

            this.renderArcsAndLabels(duration);

            if (this.data.hasHighlights) {
                this.renderArcsAndLabels(duration, true);
            } else {
                this.slicesElement.selectAll(AsterPlot.AsterHighlightedSlice.selector).remove();
            }

            if (this.interactivityService) {
                var behaviorOptions: AsterPlotBehaviorOptions = {
                    selection: this.slicesElement.selectAll(AsterPlot.AsterSlice.selector + ", " + AsterPlot.AsterHighlightedSlice.selector),
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

        private renderArcsAndLabels(duration: number, isHighlight: boolean = false): any {
            var viewportRadius: number = Math.min(this.layout.viewportIn.width, this.layout.viewportIn.height) / 2,
                innerRadius: number = 0.3 * (this.settings.labels.show ? viewportRadius * AsterRadiusRatio : viewportRadius),
                maxScore: number = d3.max(this.data.dataPoints, d => d.sliceHeight),
                totalWeight: number = d3.sum(this.data.dataPoints, d => d.sliceWidth);

            var pie: d3.layout.Pie<AsterDataPoint> = d3.layout.pie<AsterDataPoint>()
                .sort(null)
                .value((dataPoint: AsterDataPoint) => {
                    if (!totalWeight || !dataPoint || isNaN(dataPoint.sliceWidth)) {
                        return 0;
                    }

                    return dataPoint.sliceWidth / totalWeight;
                });

            var arc: d3.svg.Arc<AsterArcDescriptor> = d3.svg.arc<AsterArcDescriptor>()
                .innerRadius(innerRadius)
                .outerRadius((arcDescriptor: AsterArcDescriptor, i: number) => {
                    var height: number = 0;

                    if (maxScore) {
                        var radius: number = viewportRadius - innerRadius,
                            sliceHeight: number = 1;

                        sliceHeight = arcDescriptor
                            && arcDescriptor.data
                            && !isNaN(arcDescriptor.data.sliceHeight)
                            ? arcDescriptor.data.sliceHeight
                            : sliceHeight;

                        height = radius * sliceHeight / maxScore;
                    }

                    //The chart should shrink if data labels are on
                    var heightIsLabelsOn = innerRadius + (this.settings.labels.show ? height * AsterRadiusRatio : height);

                    // Prevent from data to be inside the inner radius
                    return Math.max(heightIsLabelsOn, innerRadius);
                });

            var arcDescriptorDataPoints: ArcDescriptor<AsterDataPoint>[] = pie(isHighlight
                ? this.data.highlightedDataPoints
                : this.data.dataPoints);

            var classSelector: ClassAndSelector = isHighlight
                ? AsterPlot.AsterHighlightedSlice
                : AsterPlot.AsterSlice;

            var selection = this.slicesElement
                .selectAll(classSelector.selector)
                .data(
                arcDescriptorDataPoints,
                (d: ArcDescriptor<AsterDataPoint>, i: number) => {
                    return (d.data
                        ? (d.data.identity as powerbi.visuals.ISelectionId).getKey()
                        : i) as any; // TODO: check it.
                });

            selection
                .enter()
                .append("path")
                .classed(classSelector.class, true)
                .attr("stroke", "#333");

            selection
                .attr("fill", d => d.data.color)
                .call(selection => {
                    return Helpers.setAttrThroughTransitionIfNotResized(
                        selection,
                        s => s.duration(duration),
                        "d",
                        arc,
                        Helpers.interpolateArc(arc),
                        this.layout.viewportChanged);
                });

            selection
                .exit()
                .remove();

            TooltipManager.addTooltip(selection, (tooltipEvent: TooltipEvent) => tooltipEvent.data.data.tooltipInfo);

            // Draw data labels only if they are on and there are no highlights or there are highlights and this is the highlighted data labels
            if (this.settings.labels.show && (!this.data.hasHighlights || (this.data.hasHighlights && isHighlight))) {
                var labelRadCalc = (d: AsterDataPoint) => {
                    var height: number = viewportRadius * (d && !isNaN(d.sliceHeight) ? d.sliceHeight : 1) / maxScore + innerRadius;
                    return Math.max(height, innerRadius);
                };
                var labelArc = d3.svg.arc<AsterArcDescriptor>()
                    .innerRadius(d => labelRadCalc(d.data))
                    .outerRadius(d => labelRadCalc(d.data));

                var lineRadCalc = (d: AsterDataPoint) => {
                    var height: number = (viewportRadius - innerRadius) * (d && !isNaN(d.sliceHeight) ? d.sliceHeight : 1) / maxScore;
                    height = innerRadius + height * AsterRadiusRatio;
                    return Math.max(height, innerRadius);
                };
                var outlineArc = d3.svg.arc<AsterArcDescriptor>()
                    .innerRadius(d => lineRadCalc(d.data))
                    .outerRadius(d => lineRadCalc(d.data));

                var labelLayout = this.getLabelLayout(labelArc, this.layout.viewport);
                this.drawLabels(
                    arcDescriptorDataPoints.filter(x => !isHighlight || x.data.sliceHeight !== null),
                    this.mainLabelsElement,
                    labelLayout,
                    this.layout.viewport,
                    outlineArc,
                    labelArc);
            }
            else {
                dataLabelUtils.cleanDataLabels(this.mainLabelsElement, true);
            }

            // Draw center text and outline once for original data points
            if (!isHighlight) {
                this.drawCenterText(innerRadius);
                this.drawOuterLine(innerRadius, _.max(arcDescriptorDataPoints.map(d => arc.outerRadius()(d, undefined))), arcDescriptorDataPoints); // TODO: check it `arc.outerRadius()(d, undefined)`
            }

            return selection;
        }

        private getLabelLayout(arc: SvgArc<AsterArcDescriptor>, viewport: IViewport): ILabelLayout {
            var midAngle = function (d: ArcDescriptor<AsterDataPoint>) { return d.startAngle + (d.endAngle - d.startAngle) / 2; };
            var textProperties: TextProperties = {
                fontFamily: dataLabelUtils.StandardFontFamily,
                fontSize: PixelConverter.fromPoint(this.settings.labels.fontSize),
                text: "",
            };
            var isLabelsHasConflict = function (d: AsterArcDescriptor) {
                var pos = arc.centroid(d);
                textProperties.text = d.data.label;
                var textWidth = TextMeasurementService.measureSvgTextWidth(textProperties);
                var horizontalSpaceAvaliableForLabels = viewport.width / 2 - Math.abs(pos[0]);
                var textHeight = TextMeasurementService.estimateSvgTextHeight(textProperties);
                var verticalSpaceAvaliableForLabels = viewport.height / 2 - Math.abs(pos[1]);
                d.isLabelHasConflict = textWidth > horizontalSpaceAvaliableForLabels || textHeight > verticalSpaceAvaliableForLabels;
                return d.isLabelHasConflict;
            };

            return {
                labelText: (d: AsterArcDescriptor) => {
                    textProperties.text = d.data.label;
                    var pos = arc.centroid(d);
                    var xPos = isLabelsHasConflict(d) ? pos[0] * AsterConflictRatio : pos[0];
                    var spaceAvaliableForLabels = viewport.width / 2 - Math.abs(xPos);
                    return TextMeasurementService.getTailoredTextOrDefault(textProperties, spaceAvaliableForLabels);
                },
                labelLayout: {
                    x: (d: AsterArcDescriptor) => {
                        var pos = arc.centroid(d);
                        textProperties.text = d.data.label;
                        var xPos = d.isLabelHasConflict ? pos[0] * AsterConflictRatio : pos[0];
                        return xPos;
                    },
                    y: (d: AsterArcDescriptor) => {
                        var pos = arc.centroid(d);
                        var yPos = d.isLabelHasConflict ? pos[1] * AsterConflictRatio : pos[1];
                        return yPos;
                    },
                },
                filter: (d: AsterArcDescriptor) => (d != null && !_.isEmpty(d.data.label)),
                style: {
                    "fill": this.settings.labels.color,
                    "font-size": textProperties.fontSize,
                    "text-anchor": (d: AsterArcDescriptor) => midAngle(d) < Math.PI ? "start" : "end",
                },
            };
        }

        private drawLabels(data: ArcDescriptor<AsterDataPoint>[],
            context: d3.Selection<AsterArcDescriptor>,
            layout: ILabelLayout,
            viewport: IViewport,
            outlineArc: d3.svg.Arc<AsterArcDescriptor>,
            labelArc: d3.svg.Arc<AsterArcDescriptor>): void {

            // Hide and reposition labels that overlap
            var dataLabelManager = new DataLabelManager();
            var filteredData = dataLabelManager.hideCollidedLabels(viewport, data, layout, true /* addTransform */);

            if (filteredData.length === 0) {
                dataLabelUtils.cleanDataLabels(context, true);
                return;
            }

            // Draw labels
            if (context.select(AsterPlot.labelGraphicsContextClass.selector).empty())
                context.append("g").classed(AsterPlot.labelGraphicsContextClass.class, true);

            var labels = context
                .select(AsterPlot.labelGraphicsContextClass.selector)
                .selectAll(".data-labels").data<LabelEnabledDataPoint>(
                filteredData,
                (d: ArcDescriptor<AsterDataPoint>) => (d.data.identity as ISelectionId).getKey());

            labels.enter().append("text").classed("data-labels", true);

            if (!labels)
                return;

            labels
                .attr({ x: (d: LabelEnabledDataPoint) => d.labelX, y: (d: LabelEnabledDataPoint) => d.labelY, dy: ".35em" })
                .text((d: LabelEnabledDataPoint) => d.labeltext)
                .style(layout.style as any);

            labels
                .exit()
                .remove();

            // Draw lines
            if (context.select(AsterPlot.linesGraphicsContextClass.selector).empty())
                context.append("g").classed(AsterPlot.linesGraphicsContextClass.class, true);

            // Remove lines for null and zero values
            filteredData = _.filter(filteredData, (d: ArcDescriptor<AsterDataPoint>) => d.data.sliceHeight !== null && d.data.sliceHeight !== 0);

            var lines = context
                .select(AsterPlot.linesGraphicsContextClass.selector)
                .selectAll("polyline")
                .data<LabelEnabledDataPoint>(
                filteredData,
                (d: ArcDescriptor<AsterDataPoint>) => (d.data.identity as ISelectionId).getKey());

            var labelLinePadding = 4;
            var chartLinePadding = 1.02;

            var midAngle = function (d: ArcDescriptor<AsterDataPoint>) { return d.startAngle + (d.endAngle - d.startAngle) / 2; };

            lines.enter()
                .append("polyline")
                .classed("line-label", true);

            lines
                .attr("points", (d) => {
                    var textPoint = [d.labelX, d.labelY];
                    textPoint[0] = textPoint[0] + ((midAngle(d as any) < Math.PI ? -1 : 1) * labelLinePadding);
                    var chartPoint = outlineArc.centroid(d as any);
                    chartPoint[0] *= chartLinePadding;
                    chartPoint[1] *= chartLinePadding;

                    return [chartPoint, textPoint] as any; // TODO: check it
                }).
                style({
                    "opacity": 0.5,
                    "fill-opacity": 0,
                    "stroke": () => this.settings.labels.color,
                });

            lines
                .exit()
                .remove();

        }

        private renderLegend(): void {
            if (this.settings.legend.show) {

                // Force update for title text
                var legendObject = _.clone(this.settings.legend);
                legendObject.labelColor = <any>{ solid: { color: legendObject.labelColor } };
                LegendData.update(this.data.legendData, <any>legendObject);
                this.legend.changeOrientation(LegendPosition[this.settings.legend.position]);
            }

            this.legend.drawLegend(this.data.legendData, this.layout.viewportCopy);
            Legend.positionChartArea(this.svg, this.legend);
        }

        private updateViewPortAccordingToLegend(): void {
            if (!this.settings.legend.show)
                return;

            var legendMargins: IViewport = this.legend.getMargins();
            var legendPosition: LegendPosition = LegendPosition[this.settings.legend.position];

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

        private drawOuterLine(innerRadius: number, radius: number, data: ArcDescriptor<AsterDataPoint>[]): void {
            var mainGroup = this.mainGroupElement;
            var outlineArc = d3.svg.arc()
                .innerRadius(innerRadius)
                .outerRadius(radius);
            if (this.settings.outerLine.show) {
                var OuterThickness: string = this.settings.outerLine.thickness + "px";
                var outerLine = mainGroup.selectAll(AsterPlot.OuterLine.selector).data(data);
                outerLine.enter().append("path");
                outerLine.attr("fill", "none")
                    .attr({
                        "stroke": "#333",
                        "stroke-width": OuterThickness,
                        "d": outlineArc as SvgArc<any> // TODO: check it.
                    })
                    .style("opacity", 1)
                    .classed(AsterPlot.OuterLine.class, true);
                outerLine.exit().remove();
            }
            else
                mainGroup.selectAll(AsterPlot.OuterLine.selector).remove();
        }

        private drawCenterText(innerRadius: number): void {
            if (_.isEmpty(this.data.centerText)) {
                this.mainGroupElement.select(AsterPlot.CenterLabelClass.selector).remove();
                return;
            }

            var centerTextProperties: TextProperties = {
                fontFamily: dataLabelUtils.StandardFontFamily,
                fontWeight: "bold",
                fontSize: PixelConverter.toString(innerRadius * AsterPlot.CenterTextFontHeightCoefficient),
                text: this.data.centerText
            };

            if (this.mainGroupElement.select(AsterPlot.CenterLabelClass.selector).empty())
                this.centerText = this.mainGroupElement.append("text").classed(AsterPlot.CenterLabelClass.class, true);

            this.centerText
                .style({
                    "line-height": 1,
                    "font-weight": centerTextProperties.fontWeight,
                    "font-size": centerTextProperties.fontSize,
                    "fill": this.settings.labels.color
                })
                .attr({
                    "dy": "0.35em",
                    "text-anchor": "middle"
                })
                .text(TextMeasurementService.getTailoredTextOrDefault(centerTextProperties, innerRadius * AsterPlot.CenterTextFontWidthCoefficient));
        }

        private clear(): void {
            this.mainGroupElement.selectAll("path").remove();
            this.mainGroupElement.select(AsterPlot.CenterLabelClass.selector).remove();
            dataLabelUtils.cleanDataLabels(this.mainLabelsElement, true);
            this.legend.drawLegend({ dataPoints: [] }, this.layout.viewportCopy);
        }

        public onClearSelection(): void {
            if (this.interactivityService)
                this.interactivityService.clearSelection();
        }

        // This function returns the values to be displayed in the property pane for each object.
        // Usually it is a bind pass of what the property pane gave you, but sometimes you may want to do
        // validation and return other values/defaults
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            return AsterPlotSettings.enumerateObjectInstances(
                this.settings && AsterPlotSettings.getDefault(),
                options);
        }
    }

    export module asterPlotUtils {
        export var DimmedOpacity: number = 0.4;
        export var DefaultOpacity: number = 1.0;

        export function getFillOpacity(selected: boolean, highlight: boolean, hasSelection: boolean, hasPartialHighlights: boolean): number {
            if ((hasPartialHighlights && !highlight) || (hasSelection && !selected)) {
                return DimmedOpacity;
            }

            return DefaultOpacity;
        }
    }
}
