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

import PrimitiveValue = powerbi.PrimitiveValue;

// powerbi
// tslint:disable-next-line
import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;
import IColorPalette = powerbi.extensibility.IColorPalette;
// powerbi.extensibility.utils.type
import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";

// powerbi.extensibility.utils.chart
import * as LegendUtil from "powerbi-visuals-utils-chartutils";
import legendData = LegendUtil.legendData;


// powerbi.extensibility.utils.chart


// powerbi.extensibility.visual.test
import { AsterPlotData } from "./asterPlotData";
import { AsterPlotBuilder } from "./asterPlotBuilder";
import { getSolidColorStructuralObject, isColorAppliedToElements } from "./helpers/helpers";

// powerbi.extensibility.utils.test
import { clickElement, assertColorsMatch } from "powerbi-visuals-utils-testutils";

import DataViewValueColumn = powerbi.DataViewValueColumn;

describe("AsterPlot", () => {
    let visualBuilder: AsterPlotBuilder,
        defaultDataViewBuilder: AsterPlotData,
        dataView: DataView,
        defaultLabelColor,
        colorPalette: IColorPalette;

    beforeEach(() => {
        defaultLabelColor = "rgb(0, 0, 0)";
        visualBuilder = new AsterPlotBuilder(1000, 500);
        defaultDataViewBuilder = new AsterPlotData();
        dataView = defaultDataViewBuilder.getDataView();
    });

    describe("DOM tests", () => {
        let labelColor = getSolidColorStructuralObject("red");
        let labelFontSize: number = 11;

        beforeEach(() => {
            dataView.metadata.objects = {
                label: {
                    show: true,
                    color: labelColor,
                    fontSize: labelFontSize
                },
            };
        });

        it("Should create svg element", () => {
            expect(visualBuilder.mainElement).not.toBeNull();
        });

        it("Should draw right amount of slices", () => {
            visualBuilder.updateFlushAllD3Transitions(dataView);

            expect(visualBuilder.mainElement.querySelectorAll(".asterSlice").length)
                .toBe(dataView.categorical.categories[0].values.length);
        });

        it("Should add center label", () => {
            visualBuilder.updateFlushAllD3Transitions(dataView);

            const centerText: HTMLElement = visualBuilder.centerText;

            expect(centerText).not.toBeNull();
        });

        it("Should not add center label to DOM when there is no data", () => {
            visualBuilder.updateFlushAllD3Transitions([]);

            const centerText: HTMLElement = visualBuilder.centerText;

            expect(centerText).toBeNull();
        });

        it("Should add center label with resized text", () => {
            visualBuilder.updateFlushAllD3Transitions(dataView);

            const centerText: HTMLElement = visualBuilder.centerText;

            expect(centerText).not.toBeNull();
            expect(centerText.getBoundingClientRect().height).toBeCloseTo(labelFontSize + 1.5, 10);
            expect(centerText.style.fontSize).toBe(labelFontSize + "px");
            expect(centerText.style.fill).toBe(labelColor.solid.color);
        });

        it("Selection test", () => {
            visualBuilder.updateFlushAllD3Transitions(dataView);

            const clickableSlice: HTMLElement = visualBuilder.slices[0],
                checkingSlice: HTMLElement = visualBuilder.slices[1];
            clickElement(clickableSlice);

            expect(parseFloat(clickableSlice.style["fill-opacity"])).toBe(1);
            expect(parseFloat(checkingSlice.style["fill-opacity"])).toBeLessThan(1);
        });

        describe("Data Labels", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    labels: {
                        show: true
                    },
                };
            });

            it("Default Data Labels", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                const numOfLabels: number = dataView.categorical.values[0].values.length,
                    labels: NodeListOf<HTMLElement> = visualBuilder.dataLabels;

                expect(labels.length).toBe(numOfLabels);

                const lines: NodeListOf<HTMLElement> = visualBuilder.lineLabels;

                expect(lines.length).toBe(numOfLabels);

                const slices: NodeListOf<HTMLElement> = visualBuilder.slices;

                expect(slices.length).toBe(numOfLabels);
            });

            it("Data Labels have conflict with viewport", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                const numOfLabels: number = dataView.categorical.values[0].values.length,
                    labels: NodeListOf<HTMLElement> = visualBuilder.dataLabels,
                    lines: NodeListOf<HTMLElement> = visualBuilder.lineLabels;

                expect(lines.length).toBe(numOfLabels);
                expect(labels.length).toBe(numOfLabels);

                // The viewport is reduced
                visualBuilder.viewport = { height: 250, width: 400 };
                visualBuilder.update(dataView);

                const labelsAfterResize: NodeListOf<HTMLElement> = visualBuilder.dataLabels,
                    linesAfterResize: NodeListOf<HTMLElement> = visualBuilder.lineLabels;

                expect(labelsAfterResize.length).toBe(numOfLabels);
                expect(linesAfterResize.length).toBe(numOfLabels);

                const firstLabelX: string = labels[0].getAttribute("x"),
                    firstLabelY: string = labels[0].getAttribute("y"),
                    lastLabelY: string = labels[labels.length - 1].getAttribute("y"),
                    firstResizeLabelX: string = labelsAfterResize[0].getAttribute("x"),
                    firstResizeLabelY: string = labelsAfterResize[0].getAttribute("y"),
                    lastResizeLabelY: string = labelsAfterResize[labelsAfterResize.length - 1].getAttribute("y");

                expect(firstLabelX).toBeGreaterThan(parseFloat(firstResizeLabelX));
                expect(firstLabelY).toBeLessThan(parseFloat(firstResizeLabelY));

                expect(lastLabelY).toBeLessThan(parseFloat(lastResizeLabelY));
            });

            it("Data Labels - Decimal value for Labels should have a limit to 17", () => {
                const maxPrecision: number = 17;
                (<any>dataView.metadata.objects).labels.show = true;
                (<any>dataView.metadata.objects).labels.precision = maxPrecision;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const labels: NodeListOf<HTMLElement> = visualBuilder.dataLabels;
                const dataLabels: string = labels[0].textContent;

                expect(dataLabels).toBe("$0,000.86618686000000000M");
                expect(dataLabels.length - 8).toBe(maxPrecision);
            });

            it("Data Labels - Change font size", () => {
                (<any>dataView.metadata.objects).labels.show = true;
                (<any>dataView.metadata.objects).labels.fontSize = 15;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const labels: NodeListOf<HTMLElement> = visualBuilder.dataLabels;
                const firstDataLabels = labels[0];

                expect(firstDataLabels.style["font-size"])
                    .toBe((<any>dataView.metadata.objects).labels.fontSize * 4 / 3 + "px");
            });

            it("Data Labels should be clear when removing data", () => {
                (<any>dataView.metadata.objects).labels.show = true;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                let labels: NodeListOf<HTMLElement> = visualBuilder.dataLabels;
                expect(labels.length).toBeGreaterThan(0);

                // Manually remove categories
                dataView.categorical.categories = undefined;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                // Check that the labels were removed
                labels = visualBuilder.dataLabels;
                expect(labels.length).toBe(0);
            });

            it("Data Labels should be displayed correctly when using dates as category values", () => {
                (<any>dataView.metadata.objects).labels.show = true;

                // Manually change the category format to be a date format
                dataView.categorical.categories[0].source.format = "dddd\, MMMM %d\, yyyy";

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const labels: NodeListOf<HTMLElement> = visualBuilder.dataLabels;

                expect(labels.length).toBeGreaterThan(0);

                // Verify label text is formatted correctly
                expect(labels[0].textContent).toBe("$0,000.87M");
                expect(labels[3].textContent).toBe("$0,000.31M");
                expect(labels[5].textContent).toBe("$0,001.26M");
            });

            it("Data Labels should not display lines for null and zero labels", () => {
                (<any>dataView.metadata.objects).labels.show = true;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const originalLines: number = visualBuilder.lineLabels.length;

                // Manually set a label to null and zero
                dataView.categorical.values[0].values[0] = null;
                dataView.categorical.values[1].values[0] = null;
                dataView.categorical.values[0].values[3] = 0;
                dataView.categorical.values[1].values[3] = 0;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const newLines: number = visualBuilder.lineLabels.length;

                // Verify label lines are not generated for null and zero
                expect(newLines).toBeLessThan(originalLines);
            });

            it("Data labels shouldn't be displayed for non highlighted values", () => {
                (<any>dataView.metadata.objects).labels.show = true;

                const length: number = Math.round(dataView.categorical.values[0].values.length / 2);

                dataView.categorical.values.forEach((column: DataViewValueColumn) => {
                    column.highlights = column.values.map((value: PrimitiveValue, index: number) => {
                        return index >= length ? null : value;
                    });
                });

                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.lineLabels.length).toEqual(length);
            });
        });

        // describe("Converter", () => {
        //     it("Should convert all data when there is a limit to colors", () => {
        //         const asterData = visualBuilder.converter(dataView);
        //
        //         // Verify that all data was created even with the color limitation
        //         expect(asterData.dataPoints.length)
        //             .toBe(dataView.categorical.categories[0].values.length);
        //     });
        // });
    });

    describe("Format settings test", () => {
        describe("Labels", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    labels: {
                        show: true
                    },
                };
            });

            it("show", () => {
                (<any>dataView.metadata.objects).labels.show = false;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.dataLabels.length).toBe(0);
            });

            it("color", () => {
                const color: string = "#649731";

                (<any>dataView.metadata.objects).labels.color = getSolidColorStructuralObject(color);

                visualBuilder.updateFlushAllD3Transitions(dataView);

                assertColorsMatch(
                    visualBuilder.dataLabels[0].style["fill"],
                    color);
            });

            it("display units", () => {
                const displayUnits: number = 1000;

                (<any>dataView.metadata.objects).labels.displayUnits = displayUnits;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.dataLabels
                    .forEach((element: Element) => {
                        const text = element.textContent;
                        expect(text[text.length - 1]).toEqual("K");
                    });
            });

            it("precision", () => {
                const precision: number = 7;

                (<any>dataView.metadata.objects).labels.displayUnits = 1;
                (<any>dataView.metadata.objects).labels.precision = precision;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.dataLabels
                    .forEach((element: Element) => {
                        expect(element.textContent.split(".")[1].length).toEqual(precision);
                    });
            });

            it("font size", () => {
                const fontSize: number = 22,
                    expectedFontSize: string = "29.3333px";

                (<any>dataView.metadata.objects).labels.fontSize = fontSize;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.dataLabels
                    .forEach((element: HTMLElement) => {
                        expect(element.style["font-size"]).toBe(expectedFontSize);
                    });
            });
        });

        describe("Outer line", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    outerLine: {
                        show: true
                    }
                };
            });

            it("Show", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.outerLine).toBeDefined();
            });

            it("Thickness", () => {
                const thickness: number = 5;

                (<any>dataView.metadata.objects).outerLine.thickness = thickness;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.outerLine
                    .forEach((element: HTMLElement) => {
                        const elementThickness: number = parseFloat(element.getAttribute("stroke-width"));
                        expect(elementThickness).toBe(thickness);
                    })
            });

            it("Grid line", () => {
                (<any>dataView.metadata.objects).outerLine.showGrid = true;
                (<any>dataView.metadata.objects).outerLine.showGridTicksValues = true;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.outerLineGrid).toBeDefined();
            });
        });

        // describe("Pie colors", () => {
        //     it("Pie colors options created for all pies", () => {
        //         visualBuilder.updateFlushAllD3Transitions(dataView);
        //
        //         let piesOptionName: string = "pies",
        //             piesOptions: EnumerateVisualObjectInstancesOptions = <EnumerateVisualObjectInstancesOptions>{ objectName: piesOptionName };
        //
        //         let colorOptions: VisualObjectInstanceEnumeration = visualBuilder.enumerateObjectInstances(piesOptions);
        //
        //         expect(visualBuilder.mainElement.find(".asterSlice").length).toBe(colorOptions.length);
        //     });
        // });

        function timeout(ms: number) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        const DefaultWaitForRender: number = 500;

        describe("Keyboard Navigation check", () => {
            it("links should have attributes tabindex=0, role=option and aria-selected=false", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    let nodes = [...visualBuilder.slices];
                    nodes.forEach((el: Element) => {
                        expect(el.getAttribute("role")).toBe("option");
                        expect(el.getAttribute("tabindex")).toBe("0");
                        expect(el.getAttribute("aria-selected")).toBe("false");
                    });
                    done();
                },);
            });

            it("enter toggles the correct slice", (done: DoneFn) => {
                const enterEvent = new KeyboardEvent("keydown", { code: "Enter", bubbles: true });
                visualBuilder.updateRenderTimeout(
                    dataView,
                    async () => {
                        visualBuilder.slices[0].dispatchEvent(enterEvent);
                        await timeout(DefaultWaitForRender);
                        expect(visualBuilder.slices[0].getAttribute("aria-selected")).toBe("true");
                        for (const slice of [...visualBuilder.slices]) {
                            if (slice !== visualBuilder.slices[0]) {
                                expect(slice.getAttribute("aria-selected")).toBe("false");
                            }
                        }

                        visualBuilder.slices[0].dispatchEvent(enterEvent);
                        await timeout(DefaultWaitForRender);
                        for (const slice of [...visualBuilder.slices]) {
                            expect(slice.getAttribute("aria-selected")).toBe("false");
                        }

                        done();
                    },
                    2,
                );
            });
        });

        it("space toggles the correct slice", (done: DoneFn) => {
            const spaceEvent = new KeyboardEvent("keydown", { code: "Space", bubbles: true });
            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    visualBuilder.slices[0].dispatchEvent(spaceEvent);
                    await timeout(DefaultWaitForRender);
                    expect(visualBuilder.slices[0].getAttribute("aria-selected")).toBe("true");
                    for (const slice of [...visualBuilder.slices]) {
                        if (slice !== visualBuilder.slices[0]) {
                            expect(slice.getAttribute("aria-selected")).toBe("false");
                        }
                    }

                    visualBuilder.slices[0].dispatchEvent(spaceEvent);
                    await timeout(DefaultWaitForRender);
                    for (const slice of [...visualBuilder.slices]) {
                        expect(slice.getAttribute("aria-selected")).toBe("false");
                    }

                    done();
                },
                2,
            );
        });

        it("tab between slices works", (done: DoneFn) => {
            const tabEvent = new KeyboardEvent("keydown", { code: "Tab", bubbles: true });
            const enterEvent = new KeyboardEvent("keydown", { code: "Enter", bubbles: true });
            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    visualBuilder.slices[0].dispatchEvent(enterEvent);
                    await timeout(DefaultWaitForRender);
                    expect(visualBuilder.slices[0].getAttribute("aria-selected")).toBe("true");
                    for (const slice of [...visualBuilder.slices]) {
                        if (slice !== visualBuilder.slices[0]) {
                            expect(slice.getAttribute("aria-selected")).toBe("false");
                        }
                    }

                    visualBuilder.slices[1].dispatchEvent(tabEvent);
                    await timeout(DefaultWaitForRender);

                    visualBuilder.slices[1].dispatchEvent(enterEvent);
                    await timeout(DefaultWaitForRender);
                    expect(visualBuilder.slices[1].getAttribute("aria-selected")).toBe("true");
                    for (const slice of [...visualBuilder.slices]) {
                        if (slice !== visualBuilder.slices[1]) {
                            expect(slice.getAttribute("aria-selected")).toBe("false");
                        }
                    }

                    done();
                },
                2,
            );
        });

        describe("Default Legend", () => {
            const defaultLegendLabelFontSize: number = 9;

            beforeEach(() => {
                dataView.metadata.objects = {
                    legend: {
                        show: true
                    }
                };

                visualBuilder.update(dataView);
            });

            it("Should add legend", () => {
                expect(visualBuilder.legendGroup).toBeDefined();
            });

            it("Should color legend title & items with default color", () => {
                const legendTitle: HTMLElement = visualBuilder.legendGroup.querySelector(".legendTitle");

                assertColorsMatch(
                    legendTitle.style["fill"],
                    legendData.DefaultLegendLabelFillColor);

                assertColorsMatch(
                    visualBuilder.firstLegendText.style["fill"],
                    legendData.DefaultLegendLabelFillColor);
            });

            it("Should set legend title & tooltip to text from dataview", () => {
                const legendTitle: HTMLElement = visualBuilder.legendTitle;

                expect(legendTitle).not.toBeNull();

                const legendTitleText: string = legendTitle.firstChild.textContent,
                    legendTitleTitle: string = legendTitle.querySelector("title").textContent,
                    expectedDefaultTitleAndToolTipText: string
                        = dataView.categorical.categories[0].source.displayName;

                expect(legendTitleText).toEqual(expectedDefaultTitleAndToolTipText);
                expect(legendTitleTitle).toEqual(expectedDefaultTitleAndToolTipText);
            });

            it("Should set legend title and legend items with default font size", () => {
                const legendTitle: HTMLElement = visualBuilder.legendTitle,
                    defaultLabelFontSizeInPixels: number = Math.round(
                        PixelConverter.fromPointToPixel(defaultLegendLabelFontSize)),
                    legendTitleFontSize: number = Math.round(parseFloat(legendTitle.style["font-size"])),
                    firstLegendItemTextFontSize: number = Math.round(
                        parseFloat(visualBuilder.firstLegendText.style["font-size"]));

                expect(legendTitleFontSize).toBe(defaultLabelFontSizeInPixels);
                expect(firstLegendItemTextFontSize).toBe(defaultLabelFontSizeInPixels);
            });

            it("multi-selection test", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                const firstSlice: HTMLElement = visualBuilder.slices[0],
                    secondSlice: HTMLElement = visualBuilder.slices[1],
                    thirdSlice: HTMLElement = visualBuilder.slices[3];

                clickElement(firstSlice);
                clickElement(secondSlice, true);

                expect(parseFloat(firstSlice.style["fill-opacity"])).toBe(1);
                expect(parseFloat(secondSlice.style["fill-opacity"])).toBe(1);
                expect(parseFloat(thirdSlice.style["fill-opacity"])).toBeLessThan(1);
            });
        });

        describe("Custom Legend", () => {
            const labelFontSizeInPoints: number = 10,
                // tslint:disable-next-line: mocha-no-side-effect-code
                labelFonSizeInPixels: number = Math.round(
                    PixelConverter.fromPointToPixel(labelFontSizeInPoints)),
                customLegendTitle = "My title";

            beforeEach(() => {
                dataView.metadata.objects = {
                    legend: {
                        titleText: customLegendTitle,
                        show: true,
                        showTitle: true,
                        labelColor: { solid: { color: defaultLabelColor } },
                        fontSize: labelFontSizeInPoints,
                        position: "LeftCenter",
                    }
                };
            });

            it("Should add right amount of legend items", () => {
                visualBuilder.update(dataView);

                const legendItems: NodeListOf<HTMLElement> = visualBuilder.legendItems;

                expect(legendItems.length).toBe(dataView.categorical.categories[0].values.length);
            });

            it("Should set legend title & tooltip to user configured text", () => {
                visualBuilder.update(dataView);

                const legendTitle: HTMLElement = visualBuilder.legendTitle;

                expect(legendTitle).toBeDefined();

                const legendTitleText: string = legendTitle.firstElementChild.textContent,
                    legendTitleTitle: string = legendTitle.querySelector("title").textContent;

                expect(legendTitleText).toEqual(customLegendTitle);
                expect(legendTitleTitle).toEqual(customLegendTitle);
            });

            it("Should color legend title & items with user configured color", () => {
                visualBuilder.update(dataView);
                const legendTitle: HTMLElement = visualBuilder.legendTitle;

                assertColorsMatch(
                    legendTitle.style["fill"],
                    defaultLabelColor);

                assertColorsMatch(
                    visualBuilder.firstLegendText.style["fill"],
                    defaultLabelColor);
            });

            it("Should set legend title and legend items with user configured font size", () => {
                visualBuilder.update(dataView);

                const legendTitle: HTMLElement = visualBuilder.legendTitle;

                const legendTitleFontSize: number = Math.round(parseFloat(legendTitle.style["font-size"])),
                    firstLegendItemTextFontSize: number = Math.round(
                        parseFloat(visualBuilder.firstLegendText.style["font-size"]));

                expect(legendTitleFontSize).toBe(labelFonSizeInPixels);
                expect(firstLegendItemTextFontSize).toBe(labelFonSizeInPixels);
            });

            it("Should set legend title and legend items with user configured font size", () => {
                visualBuilder.update(dataView);

                const legendTitle: HTMLElement = visualBuilder.legendTitle;

                const legendTitleFontSize: number = Math.round(parseFloat(legendTitle.style["font-size"])),
                    firstLegendItemTextFontSize: number = Math.round(
                        parseFloat(visualBuilder.firstLegendText.style["font-size"]));

                expect(legendTitleFontSize).toBe(labelFonSizeInPixels);
                expect(firstLegendItemTextFontSize).toBe(labelFonSizeInPixels);
            });

            it("if required fields are missing then visual shouldn't be rendered", () => {
                dataView = defaultDataViewBuilder.getDataView([AsterPlotData.ColumnCategory]);
                visualBuilder.update(dataView);

                expect(visualBuilder.lineLabels[0]).toBeUndefined();
                expect(visualBuilder.dataLabels[0]).toBeUndefined();

                dataView = defaultDataViewBuilder.getDataView([AsterPlotData.ColumnY1]);
                visualBuilder.update(dataView);

                expect(visualBuilder.lineLabels[0]).toBeUndefined();
                expect(visualBuilder.dataLabels[0]).toBeUndefined();
            });
        });

        describe("high contrast mode test", () => {
            const backgroundColor: string = "#000000";
            const foregroundColor: string = "#ff00ff";

            beforeEach(() => {
                visualBuilder.visualHost.colorPalette.isHighContrast = true;

                visualBuilder.visualHost.colorPalette.background = { value: backgroundColor };
                visualBuilder.visualHost.colorPalette.foreground = { value: foregroundColor };
            });

            it("should not use fill style", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const slices: HTMLElement[] = Array.from(visualBuilder.slices);

                    expect(isColorAppliedToElements(slices, null, "fill"));
                    done();
                });
            });

            it("should use stroke style", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const slices: HTMLElement[] = Array.from(visualBuilder.slices);

                    expect(isColorAppliedToElements(slices, foregroundColor, "stroke"));
                    done();
                });
            });
        });
    });
});
