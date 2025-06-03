import powerbi from "powerbi-visuals-api";

import GroupFormattingModelReference = powerbi.visuals.GroupFormattingModelReference;
import FormattingId = powerbi.visuals.FormattingId;

export interface IFontReference extends GroupFormattingModelReference {
    fontFamily: FormattingId;
    bold: FormattingId;
    italic: FormattingId;
    underline: FormattingId;
    fontSize: FormattingId;
    color: FormattingId;
}

export interface ILegendReference extends IFontReference {
    show: FormattingId;
    position: FormattingId;
    titleText: FormattingId;
    showTitle: FormattingId;
}

export interface ICenterLabelReference extends IFontReference {
    show: FormattingId;
}

export interface IDetailLabelsReference extends IFontReference {
    displayUnits: FormattingId;
    precision: FormattingId;
    show: FormattingId;
}

export interface IOuterLineReference extends IFontReference {
    thickness: FormattingId;
    show: FormattingId;
    linesColor: FormattingId;
    showGrid: FormattingId;
    showLines: FormattingId;
    showTicks: FormattingId;
}

export interface IPiesReference extends GroupFormattingModelReference {
    fill: FormattingId;
}