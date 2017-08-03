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

/// <reference path="_references.ts"/>

module powerbi.extensibility.visual.test {
    // powerbi.extensibility.utils.test
    import VisualBuilderBase = powerbi.extensibility.utils.test.VisualBuilderBase;

    // AsterPlot1443303142064
    import VisualClass = powerbi.extensibility.visual.AsterPlot1443303142064.AsterPlot;
    import AsterPlotData = powerbi.extensibility.visual.AsterPlot1443303142064.AsterPlotData;

    export class AsterPlotBuilder extends VisualBuilderBase<VisualClass> {
        constructor(width: number, height: number) {
            super(width, height, "AsterPlot1443303142064");
        }

        protected build(options: VisualConstructorOptions): VisualClass {
            return new VisualClass(options);
        }

        public get mainElement(): JQuery {
            return this.element.children("svg");
        }

        public get legendGroup(): JQuery {
            return this.element
                .children(".legend")
                .children("#legendGroup");
        }

        public get firstLegendText(): JQuery {
            return this.legendGroup
                .children(".legendItem")
                .first()
                .children(".legendText");
        }

        public get dataLabels(): JQuery {
            return this.mainElement
                .children("g")
                .children("g.labels")
                .children("text.data-labels");
        }

        public get lineLabel(): JQuery {
            return this.mainElement
                .children("g")
                .children("g.lines")
                .children("polyline.line-label");
        }

        public get slices(): JQuery {
            return this.mainElement
                .children("g")
                .children("g.asterSlices")
                .children("path.asterSlice");
        }

        public get outerLine(): JQuery {
            return this.mainElement
                .children("g")
                .children("path.outerLine");
        }

        public get outerLineGrid(): JQuery {
            return this.mainElement
                .children("g")
                .children("g.circleLine");
        }

        public converter(dataView: DataView): AsterPlotData {
            return VisualClass.converter(
                dataView,
                this.visualHost.colorPalette,
                this.visualHost);
        }
    }
}
