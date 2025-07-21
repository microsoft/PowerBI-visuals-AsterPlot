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

// / <reference path="../_references.ts"/>
import {
    RgbColor,
    parseColorString
} from "powerbi-visuals-utils-colorutils";

import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;

export function getSolidColorStructuralObject(color: string) {
    return { solid: { color } };
}

export function areColorsEqual(firstColor: string, secondColor: string): boolean {
    const firstConvertedColor: RgbColor = parseColorString(firstColor),
        secondConvertedColor: RgbColor = parseColorString(secondColor);

    return firstConvertedColor.R === secondConvertedColor.R
        && firstConvertedColor.G === secondConvertedColor.G
        && firstConvertedColor.B === secondConvertedColor.B;
}

export function isColorAppliedToElements(
    elements: HTMLElement[],
    color?: string,
    colorStyleName: string = "fill"
): boolean {
    return elements.some((element: HTMLElement) => {
        const currentColor: string = element.style[colorStyleName];

        if (!currentColor || !color) {
            return currentColor === color;
        }

        return areColorsEqual(currentColor, color);
    });
}

/**
 * Calculates expected formatted values from the DataView values
 * @param dataView The DataView containing the data to format
 * @param CategoricalValuesIndex The index of the dataView.categorical.values
 * @returns Array of formatted value strings
 */
export function getFormattedValues(dataView: DataView, CategoricalValuesIndex: number = 0): string[] {
    const valueColumn = dataView.categorical!.values![CategoricalValuesIndex];
    const values = valueColumn.values as number[];
    const maxValue = Math.max.apply(null, values);
    
    const formatter = valueFormatter.create({
        format: valueFormatter.getFormatStringByColumn(valueColumn.source, true),
        value: maxValue  // Use maxValue for automatic display units
    });
    
    return values.map(value => formatter.format(value));
}

/**
 * Calculates expected formatted percentages from the DataView values
 * @param dataView The DataView containing the data to calculate percentages from
 * @returns Array of formatted percentage strings
 */
export function calculateExpectedPercentages(dataView: DataView): string[] {
    const values = dataView.categorical!.values![0].values as number[];
    const totalValue = values.reduce((a, b) => a + (b || 0), 0);
    const percentageFormatter = valueFormatter.create({ format: "0.0%" });
    
    return values.map(value => {
        const percentage = totalValue > 0 ? value / totalValue : 0;
        return percentageFormatter.format(percentage);
    });
}
