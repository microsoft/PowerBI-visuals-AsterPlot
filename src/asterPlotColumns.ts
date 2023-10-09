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
import DataView = powerbi.DataView;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import DataViewValueColumns = powerbi.DataViewValueColumns;

// powerbi.extensibility.utils.dataview
import { converterHelper } from "powerbi-visuals-utils-dataviewutils";


import { toArray, mapValues } from "lodash-es";

export class AsterPlotColumns<T> {
    // tslint:disable-next-line: function-name
    public static getCategoricalValues(dataView: DataView) {
        let categorical = dataView && dataView.categorical;
        let categories: (DataViewCategoryColumn | DataViewValueColumn)[] = categorical && categorical.categories || [];
        let values = categorical && categorical.values || <DataViewValueColumns>[];
        let series = categorical && values.source && this.getSeriesValues(dataView);
        return categorical && mapValues(new this<any[]>(), (n, i) =>
            (<(DataViewCategoryColumn | DataViewValueColumn)[]>toArray(categories)).concat(toArray(values))
                .filter(x => x.source.roles && x.source.roles[i]).map(x => x.values)[0]
            || values.source && values.source.roles && values.source.roles[i] && series);
    }

    // tslint:disable-next-line: function-name
    public static getSeriesValues(dataView: DataView) {
        return dataView && dataView.categorical && dataView.categorical.values
            && dataView.categorical.values.map(x => converterHelper.getSeriesName(x.source));
    }

    // tslint:disable-next-line: function-name
    public static getCategoricalColumns(dataView: DataView) {
        let categorical = dataView && dataView.categorical;
        let categories = categorical && categorical.categories || [];
        let values = categorical && categorical.values || <DataViewValueColumns>[];
        return categorical && mapValues(
            new this<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns>(),
            (n, i) => {
                return categories.filter(x => x.source.roles && x.source.roles[i])[0]
                    || values.source && values.source.roles && values.source.roles[i]
                    || values.filter(x => x.source.roles && x.source.roles[i]);
            });
    }

    // Data Roles
    public Category: T = null;
    public Y: T = null;
}
