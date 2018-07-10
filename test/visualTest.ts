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
    // powerbi.extensibility.utils.type
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;

    // powerbi.extensibility.utils.chart
    import LegendData = powerbi.extensibility.utils.chart.legend.data;
    import defaultLabelColor = powerbi.extensibility.utils.chart.dataLabel.utils.defaultLabelColor;

    // powerbi.extensibility.visual.test
    import AsterPlotData = powerbi.extensibility.visual.test.AsterPlotData;
    import AsterPlotBuilder = powerbi.extensibility.visual.test.AsterPlotBuilder;
    import getSolidColorStructuralObject = powerbi.extensibility.visual.test.helpers.getSolidColorStructuralObject;

    // powerbi.extensibility.utils.test
    import clickElement = powerbi.extensibility.utils.test.helpers.clickElement;
    import MockISelectionId = powerbi.extensibility.utils.test.mocks.MockISelectionId;
    import assertColorsMatch = powerbi.extensibility.utils.test.helpers.color.assertColorsMatch;

    // AsterPlot1443303142064
    import VisualClass = powerbi.extensibility.visual.AsterPlot1443303142064.AsterPlot;
    import AsterPlotVisualData = powerbi.extensibility.visual.AsterPlot1443303142064.AsterPlotData;

    import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;

    import areColorsEqual = powerbi.extensibility.visual.test.helpers.areColorsEqual;
    import isColorAppliedToElements = powerbi.extensibility.visual.test.helpers.isColorAppliedToElements;
    import IDataColorPalette = powerbi.extensibility.IColorPalette;

    describe("AsterPlot", () => {
        let visualBuilder: AsterPlotBuilder,
            defaultDataViewBuilder: AsterPlotData,
            dataView: DataView,
            colorPalette: IDataColorPalette;

        beforeEach(() => {
            let selectionIndex: number = 0;

            visualBuilder = new AsterPlotBuilder(1000, 500);
            defaultDataViewBuilder = new AsterPlotData();
            dataView = defaultDataViewBuilder.getDataView();

            powerbi.extensibility.utils.test.mocks.createSelectionId = function () {
                return new MockISelectionId(`${++selectionIndex}`);
            };
        });

        describe("DOM tests", () => {
            let labelColor: string = "red";
            let labelFontSize: number = 11;

            beforeEach(() => {
                dataView.metadata.objects = {
                    label: {
                        show: true,
                        color: labelColor,
                        fontSize: labelFontSize
                    }
                };
            });

            it("Should create svg element", () => {
                expect(visualBuilder.mainElement[0]).toBeInDOM();
            });

            it("Should draw right amount of slices", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.mainElement.find(".asterSlice").length)
                    .toBe(dataView.categorical.categories[0].values.length);
            });

            it("Should add center label", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                const centerText: JQuery = $(".asterPlot .centerLabel");

                expect(centerText).toBeInDOM();
            });

            it("Should not add center label to DOM when there is no data", () => {
                visualBuilder.updateFlushAllD3Transitions([]);

                const centerText: JQuery = $(".asterPlot .centerLabel");

                expect(centerText.length).toBe(0);
            });

            it("Should add center label with resized text", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                const centerText: JQuery = $(".asterPlot .centerLabel");

                expect(centerText).toBeInDOM();
                expect(centerText[0].getBBox().height).toBeCloseTo(12, 10);
                expect(centerText[0].style.fontSize).toBe(labelFontSize + "px");
                expect(centerText[0].style.fill).toBe(labelColor);
            });

            it("Selection test", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                const clickableSlice: JQuery = visualBuilder.slices.eq(0),
                    checkingSlice: JQuery = visualBuilder.slices.eq(1);
                clickElement(clickableSlice);

                expect(parseFloat(clickableSlice.css("fill-opacity"))).toBe(1);
                expect(parseFloat(checkingSlice.css("fill-opacity"))).toBeLessThan(1);
            });

            describe("Data Labels", () => {
                beforeEach(() => {
                    dataView.metadata.objects = {
                        labels: {
                            show: true
                        }
                    };
                });

                it("Default Data Labels", () => {
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const numOfLabels: number = dataView.categorical.values[0].values.length,
                        labels: JQuery = $(".asterPlot .labels .data-labels");

                    expect(labels.length).toBe(numOfLabels);

                    const lines: JQuery = $(".asterPlot .lines .line-label");

                    expect(lines.length).toBe(numOfLabels);

                    const slices: JQuery = $(".asterPlot .asterSlice");

                    expect(slices.length).toBe(numOfLabels);
                });

                it("Data Labels have conflict with viewport", () => {
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const numOfLabels: number = dataView.categorical.values[0].values.length,
                        labels: JQuery = $(".asterPlot .labels .data-labels"),
                        lines: JQuery = $(".asterPlot .lines .line-label");

                    expect(lines.length).toBe(numOfLabels);
                    expect(labels.length).toBe(numOfLabels);

                    // The viewport is reduced
                    visualBuilder.viewport = { height: 250, width: 400 };
                    visualBuilder.update(dataView);

                    const labelsAfterResize: JQuery = $(".asterPlot .labels .data-labels"),
                        linesAfterResize: JQuery = $(".asterPlot .lines .line-label");

                    expect(labelsAfterResize.length).toBe(numOfLabels);
                    expect(linesAfterResize.length).toBe(numOfLabels);

                    const firstLabelX: string = $(labels).first().attr("x"),
                        firstLabelY: string = $(labels).first().attr("y"),
                        lastLabelY: string = $(labels).last().attr("y"),
                        firstResizeLabelX: string = $(labelsAfterResize).first().attr("x"),
                        firstResizeLabelY: string = $(labelsAfterResize).first().attr("y"),
                        lastResizeLabelY: string = $(labelsAfterResize).last().attr("y");

                    expect(firstLabelX).toBeGreaterThan(parseFloat(firstResizeLabelX));
                    expect(firstLabelY).toBeLessThan(parseFloat(firstResizeLabelY));

                    expect(lastLabelY).toBeLessThan(parseFloat(lastResizeLabelY));
                });

                it("Data Labels - Decimal value for Labels should have a limit to 17", () => {
                    (dataView.metadata.objects as any).labels.show = true;
                    (dataView.metadata.objects as any).labels.precision = 5666;

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const labels: JQuery = $(".asterPlot .labels .data-labels"),
                        dataLabels: string = $(labels).first().text(),
                        maxPrecision: number = 17;

                    expect(dataLabels).toBe("$0,000.86618686000000000M");
                    expect(dataLabels.length - 8).toBe(maxPrecision);
                });

                it("Data Labels - Change font size", () => {
                    (dataView.metadata.objects as any).labels.show = true;
                    (dataView.metadata.objects as any).labels.fontSize = 15;

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const labels: JQuery = $(".asterPlot .labels .data-labels");

                    expect(labels.first().css("font-size"))
                        .toBe((dataView.metadata.objects as any).labels.fontSize * 4 / 3 + "px");
                });

                it("Data Labels should be clear when removing data", () => {
                    (dataView.metadata.objects as any).labels.show = true;

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    let labels: JQuery = $(".asterPlot .labels .data-labels");
                    expect(labels.length).toBeGreaterThan(0);

                    // Manually remove categories
                    dataView.categorical.categories = undefined;

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    // Check that the labels were removed
                    labels = $(".asterPlot .labels .data-labels");
                    expect(labels.length).toBe(0);
                });

                it("Data Labels should be displayed correctly when using dates as category values", () => {
                    (dataView.metadata.objects as any).labels.show = true;

                    // Manually change the category format to be a date format
                    dataView.categorical.categories[0].source.format = "dddd\, MMMM %d\, yyyy";

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const labels: JQuery = $(".asterPlot .labels .data-labels");

                    expect(labels.length).toBeGreaterThan(0);

                    // Verify label text is formatted correctly
                    expect($(labels[0]).text()).toBe("$0,000.87M");
                    expect($(labels[3]).text()).toBe("$0,000.31M");
                    expect($(labels[5]).text()).toBe("$0,001.26M");
                });

                it("Data Labels should not display lines for null and zero labels", () => {
                    (dataView.metadata.objects as any).labels.show = true;

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const originalLines: number = $(".asterPlot .lines .line-label").length;

                    // Manually set a label to null and zero
                    dataView.categorical.values[0].values[0] = null;
                    dataView.categorical.values[1].values[0] = null;
                    dataView.categorical.values[0].values[3] = 0;
                    dataView.categorical.values[1].values[3] = 0;

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const newLines: number = $(".asterPlot .lines .line-label").length;

                    // Verify label lines are not generated for null and zero
                    expect(newLines).toBeLessThan(originalLines);
                });

                it("Data labels shouldn't be displayed for non highlighted values", () => {
                    (dataView.metadata.objects as any).labels.show = true;

                    const length: number = Math.round(dataView.categorical.values[0].values.length / 2);

                    dataView.categorical.values.forEach((column: DataViewValueColumn) => {
                        column.highlights = column.values.map((value: PrimitiveValue, index: number) => {
                            return index >= length ? null : value;
                        });
                    });

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.lineLabel.length).toEqual(length);
                });
            });

            describe("Converter", () => {
                it("Should convert all data when there is a limit to colors", () => {
                    const asterData: AsterPlotVisualData = visualBuilder.converter(dataView);

                    // Verify that all data was created even with the color limitation
                    expect(asterData.dataPoints.length)
                        .toBe(dataView.categorical.categories[0].values.length);
                });
            });
        });

        describe("Format settings test", () => {
            describe("Labels", () => {
                beforeEach(() => {
                    dataView.metadata.objects = {
                        labels: {
                            show: true
                        }
                    };
                });

                it("show", () => {
                    (dataView.metadata.objects as any).labels.show = false;

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.dataLabels).not.toBeInDOM();
                });

                it("color", () => {
                    const color: string = "#649731";

                    (dataView.metadata.objects as any).labels.color = getSolidColorStructuralObject(color);

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    assertColorsMatch(
                        visualBuilder.dataLabels.first().css("fill"),
                        color);
                });

                it("display units", () => {
                    const displayUnits: number = 1000;

                    (dataView.metadata.objects as any).labels.displayUnits = displayUnits;

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    visualBuilder.dataLabels
                        .toArray()
                        .forEach((element: Element) => {
                            expect(_.last($(element).text())).toEqual("K");
                        });
                });

                it("precision", () => {
                    const precision: number = 7;

                    (dataView.metadata.objects as any).labels.displayUnits = 1;
                    (dataView.metadata.objects as any).labels.precision = precision;

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    visualBuilder.dataLabels
                        .toArray()
                        .forEach((element: Element) => {
                            expect($(element).text().split(".")[1].length).toEqual(precision);
                        });
                });

                it("font size", () => {
                    const fontSize: number = 22,
                        expectedFontSize: string = "29.3333px";

                    (dataView.metadata.objects as any).labels.fontSize = fontSize;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    visualBuilder.dataLabels
                        .toArray()
                        .forEach((element: Element) => {
                            expect($(element).css("font-size")).toBe(expectedFontSize);
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

                    expect(visualBuilder.outerLine).toBeInDOM();
                });

                it("Thickness", () => {
                    const thickness: number = 5;

                    (dataView.metadata.objects as any).outerLine.thickness = thickness;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(parseFloat(visualBuilder.outerLine.attr("stroke-width"))).toBe(thickness);
                });

                it("Grid line", () => {
                    (dataView.metadata.objects as any).outerLine.showGrid = true;
                    (dataView.metadata.objects as any).outerLine.showGridTicksValues = true;

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.outerLineGrid).toBeInDOM();
                });
            });

            describe("Pie colors", () => {
                it("Pie colors options created for all pies", () => {
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    let piesOptionName: string = "pies",
                        piesOptions: EnumerateVisualObjectInstancesOptions = <EnumerateVisualObjectInstancesOptions>{ objectName: piesOptionName };

                    let colorOptions: VisualObjectInstanceEnumeration = visualBuilder.enumerateObjectInstances(piesOptions);

                    expect(visualBuilder.mainElement.find(".asterSlice").length).toBe(colorOptions.length);
                });
            });

            describe("Default Legend", () => {
                const defaultLegendLabelFontSize: number = 8;

                beforeEach(() => {
                    dataView.metadata.objects = {
                        legend: {
                            show: true
                        }
                    };

                    visualBuilder.update(dataView);
                });

                it("Should add legend", () => {
                    expect(visualBuilder.legendGroup).toBeInDOM();
                });

                it("Should color legend title & items with default color", () => {
                    const legendTitle: JQuery = visualBuilder.legendGroup.children(".legendTitle");

                    assertColorsMatch(
                        legendTitle.css("fill"),
                        LegendData.DefaultLegendLabelFillColor);

                    assertColorsMatch(
                        visualBuilder.firstLegendText.css("fill"),
                        LegendData.DefaultLegendLabelFillColor);
                });

                it("Should set legend title & tooltip to text from dataview", () => {
                    const legendTitle: JQuery = visualBuilder.legendGroup.children(".legendTitle");

                    expect(legendTitle.length).toEqual(1);

                    const legendTitleText: string = legendTitle.get(0).firstChild.textContent,
                        legendTitleTitle: string = legendTitle.children("title").text(),
                        expectedDefaultTitleAndToolTipText: string
                            = dataView.categorical.categories[0].source.displayName;

                    expect(legendTitleText).toEqual(expectedDefaultTitleAndToolTipText);
                    expect(legendTitleTitle).toEqual(expectedDefaultTitleAndToolTipText);
                });

                it("Should set legend title and legend items with default font size", () => {
                    const legendTitle: JQuery = visualBuilder.legendGroup.find(".legendTitle"),
                        defaultLabelFontSizeInPixels: number = Math.round(
                            PixelConverter.fromPointToPixel(defaultLegendLabelFontSize)),
                        legendTitleFontSize: number = Math.round(parseFloat(legendTitle.css("font-size"))),
                        firstLegendItemTextFontSize: number = Math.round(
                            parseFloat(visualBuilder.firstLegendText.css("font-size")));

                    expect(legendTitleFontSize).toBe(defaultLabelFontSizeInPixels);
                    expect(firstLegendItemTextFontSize).toBe(defaultLabelFontSizeInPixels);
                });

                it("multi-selection test", () => {
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const firstSlice: JQuery = visualBuilder.slices.eq(0),
                        secondSlice: JQuery = visualBuilder.slices.eq(1),
                        thirdSlice: JQuery = visualBuilder.slices.eq(3);

                    clickElement(firstSlice);
                    clickElement(secondSlice, true);

                    expect(parseFloat(firstSlice.css("fill-opacity"))).toBe(1);
                    expect(parseFloat(secondSlice.css("fill-opacity"))).toBe(1);
                    expect(parseFloat(thirdSlice.css("fill-opacity"))).toBeLessThan(1);
                });
            });

            describe("Custom Legend", () => {
                const labelFontSizeInPoints: number = 10,
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

                    const legendItems: JQuery = $("#legendGroup .legendItem");

                    expect(legendItems.length)
                        .toEqual(dataView.categorical.categories[0].values.length);
                });

                it("Should set legend title & tooltip to user configured text", () => {
                    visualBuilder.update(dataView);

                    const legendTitle: JQuery = visualBuilder
                        .legendGroup
                        .children(".legendTitle");

                    expect(legendTitle.length).toEqual(1);

                    const legendTitleText: string = legendTitle.get(0).firstChild.textContent,
                        legendTitleTitle: string = legendTitle.children("title").text();

                    expect(legendTitleText).toEqual(customLegendTitle);
                    expect(legendTitleTitle).toEqual(customLegendTitle);
                });

                it("Should color legend title & items with user configured color", () => {
                    visualBuilder.update(dataView);

                    const legendTitle: JQuery = visualBuilder
                        .legendGroup
                        .children(".legendTitle");

                    assertColorsMatch(
                        legendTitle.css("fill"),
                        defaultLabelColor);

                    assertColorsMatch(
                        visualBuilder.firstLegendText.css("fill"),
                        defaultLabelColor);
                });

                it("Should set legend title and legend items with user configured font size", () => {
                    visualBuilder.update(dataView);

                    const legendTitle: JQuery = visualBuilder
                        .legendGroup
                        .find(".legendTitle");

                    const legendTitleFontSize: number = Math.round(parseFloat(legendTitle.css("font-size"))),
                        firstLegendItemTextFontSize: number = Math.round(
                            parseFloat(visualBuilder.firstLegendText.css("font-size")));

                    expect(legendTitleFontSize).toBe(labelFonSizeInPixels);
                    expect(firstLegendItemTextFontSize).toBe(labelFonSizeInPixels);
                });

                it("Should set legend title and legend items with user configured font size", () => {
                    visualBuilder.update(dataView);

                    const legendTitle: JQuery = visualBuilder
                        .legendGroup
                        .find(".legendTitle");

                    const legendTitleFontSize: number = Math.round(parseFloat(legendTitle.css("font-size"))),
                        firstLegendItemTextFontSize: number = Math.round(
                            parseFloat(visualBuilder.firstLegendText.css("font-size")));

                    expect(legendTitleFontSize).toBe(labelFonSizeInPixels);
                    expect(firstLegendItemTextFontSize).toBe(labelFonSizeInPixels);
                });

                it("if required fields are missing then visual shouldn't be rendered", () => {
                    dataView = defaultDataViewBuilder.getDataView([AsterPlotData.ColumnCategory]);
                    visualBuilder.update(dataView);

                    expect(visualBuilder.lineLabel[0]).not.toBeInDOM();
                    expect(visualBuilder.dataLabels[0]).not.toBeInDOM();

                    dataView = defaultDataViewBuilder.getDataView([AsterPlotData.ColumnY1]);
                    visualBuilder.update(dataView);

                    expect(visualBuilder.lineLabel[0]).not.toBeInDOM();
                    expect(visualBuilder.dataLabels[0]).not.toBeInDOM();
                });
            });
        });

        describe("high contrast mode test", () => {
            const backgroundColor: string = "black";
            const foregroundColor: string = "green";

            beforeEach(() => {
                visualBuilder.visualHost.colorPalette.isHighContrast = true;

                visualBuilder.visualHost.colorPalette.background = { value: backgroundColor };
                visualBuilder.visualHost.colorPalette.foreground = { value: foregroundColor };
            });

            it("should not use fill style", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const slices: JQuery[] = visualBuilder.slices.toArray().map($);
                    const archs: JQuery[] = visualBuilder.outerLineGrid.toArray().map($);

                    expect(isColorAppliedToElements(slices, null, "fill"));
                    expect(isColorAppliedToElements(archs, null, "fill"));

                    done();
                });
            });

            it("should use stroke style", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const slices: JQuery[] = visualBuilder.slices.toArray().map($);
                    const archs: JQuery[] = visualBuilder.outerLineGrid.toArray().map($);

                    expect(isColorAppliedToElements(slices, foregroundColor, "stroke"));
                    expect(isColorAppliedToElements(archs, foregroundColor, "stroke"));

                    done();
                });
            });
        });
    });
}
