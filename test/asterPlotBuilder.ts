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

// powerbi.extensibility.utils.test
import {
    VisualBuilderBase
} from "powerbi-visuals-utils-testutils";

// AsterPlot1443303142064
import {
    AsterPlot
} from "../src/visual";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import { createSelectionId, MockISelectionIdBuilder } from "powerbi-visuals-utils-testutils";

class FakeSelectionIdBuilder extends MockISelectionIdBuilder {
    private index = 0;
    createSelectionId() {
        return createSelectionId(`${this.index++}`);
    }
}

export class AsterPlotBuilder extends VisualBuilderBase<AsterPlot> {
    constructor(width: number, height: number) {
        super(width, height, "AsterPlot1443303142064");
    }

    protected build(options: VisualConstructorOptions): AsterPlot {
        options.host.createSelectionIdBuilder = () => {
            return new FakeSelectionIdBuilder();
        };
        return new AsterPlot(options);
    }

    public get mainElement(): SVGElement {
        return this.element.querySelector<SVGElement>("svg.asterPlot");
    }

    public get centerText(): HTMLElement {
        return this.mainElement.querySelector<HTMLElement>(".asterPlot .centerLabel");
    }

    public get legendGroup(): HTMLElement {
        return this.element
            .querySelector(".legend")
            .querySelector("#legendGroup");
    }

    public get legendTitle(): HTMLElement {
        return this.legendGroup
            .querySelector<HTMLElement>(".legendTitle");
    }

    public get legendItems(): NodeListOf<HTMLElement> {
        return this.legendGroup.querySelectorAll(".legendItem");
    }

    public get firstLegendText(): HTMLElement {
        return this.legendGroup
            .querySelector(".legendItem")
            .querySelector(".legendText");
    }

    public get dataLabels(): NodeListOf<HTMLElement> {
        return this.mainElement.querySelectorAll("text.data-labels");
    }

    public get lineLabels(): NodeListOf<HTMLElement> {
        return this.mainElement.querySelectorAll("polyline.line-label");
    }

    public get slices(): NodeListOf<HTMLElement> {
        return this.mainElement.querySelectorAll("path.asterSlice");
    }

    public get outerLine(): NodeListOf<HTMLElement> {
        return this.mainElement.querySelectorAll("path.outerLine");
    }

    public get outerLineGrid(): NodeListOf<HTMLElement> {
        return this.mainElement.querySelectorAll("g.circleLine");
    }
}
