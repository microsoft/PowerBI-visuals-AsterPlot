import powerbi from "powerbi-visuals-api";
import SubSelectableDirectEdit = powerbi.visuals.SubSelectableDirectEdit;
import SubSelectableDirectEditStyle = powerbi.visuals.SubSelectableDirectEditStyle;

import { ICenterLabelReference, IDetailLabelsReference, IFontReference, ILegendReference, IOuterLineReference, IPiesReference } from "./interfaces";
import { AsterPlotObjectNames } from "../asterPlotSettingsModel";

export const TitleEdit: SubSelectableDirectEdit = {
    reference: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "titleText"
    },
    style: SubSelectableDirectEditStyle.HorizontalLeft,
}

export const visualTitleEditSubSelection = JSON.stringify(TitleEdit);

const createBaseFontReference = (objectName: string, colorName: string = ""): IFontReference => {
    return {
        fontFamily: {
            objectName: objectName,
            propertyName: "fontFamily"
        },
        bold: {
            objectName: objectName,
            propertyName: "fontBold"
        },
        italic: {
            objectName: objectName,
            propertyName: "fontItalic"
        },
        underline: {
            objectName: objectName,
            propertyName: "fontUnderline"
        },
        fontSize: {
            objectName: objectName,
            propertyName: "fontSize"
        },
        color: {
            objectName: objectName,
            propertyName: colorName || "color"
        }
    }
}

export const legendReferences: ILegendReference = {
    ...createBaseFontReference(AsterPlotObjectNames.Legend.name, "labelColor"),
    cardUid: "Visual-legend-card",
    groupUid: "legend-group",
    show: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "show",
    },
    position: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "position",
    },
    titleText: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "titleText",
    },
    showTitle: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "showTitle",
    }
}

export const centerLabelReferences: ICenterLabelReference = {
    ...createBaseFontReference(AsterPlotObjectNames.CenterLabel.name),
    cardUid: "Visual-label-card",
    groupUid: "label-group",
    show: {
        objectName: AsterPlotObjectNames.CenterLabel.name,
        propertyName: "show"
    }
}

export const detailLabelsReferences: IDetailLabelsReference = {
    ...createBaseFontReference(AsterPlotObjectNames.DetailLabels.name),
    cardUid: "Visual-labels-card",
    groupUid: "options-group",
    displayUnits: {
        objectName: AsterPlotObjectNames.DetailLabels.name,
        propertyName: "displayUnits"
    },
    precision: {
        objectName: AsterPlotObjectNames.DetailLabels.name,
        propertyName: "precision"
    },
    show: {
        objectName: AsterPlotObjectNames.DetailLabels.name,
        propertyName: "show"
    },
    position: {
        objectName: AsterPlotObjectNames.DetailLabels.name,
        propertyName: "position"
    },
    detailLabelsContent: {
        objectName: AsterPlotObjectNames.DetailLabels.name,
        propertyName: "detailLabelsContent"
    }
}

export const outerLineReferences: IOuterLineReference = {
    ...createBaseFontReference(AsterPlotObjectNames.OuterLine.name, "textColor"),
    cardUid: "Visual-outerLine-card",
    groupUid: "outerLine-group",
    thickness: {
        objectName: AsterPlotObjectNames.OuterLine.name,
        propertyName: "thickness"
    },
    show: {
        objectName: AsterPlotObjectNames.OuterLine.name,
        propertyName: "show"
    },
    linesColor: {
        objectName: AsterPlotObjectNames.OuterLine.name,
        propertyName: "color"
    },
    showGrid: {
        objectName: AsterPlotObjectNames.OuterLine.name,
        propertyName: "showGrid"
    },
    showLines: {
        objectName: AsterPlotObjectNames.OuterLine.name,
        propertyName: "showStraightLines"
    },
    showTicks: {
        objectName: AsterPlotObjectNames.OuterLine.name,
        propertyName: "showGridTicksValues"
    }
}

export const piesReferences: IPiesReference = {
    cardUid: "Visual-pies-card",
    groupUid: "pies-group",
    fill: {
        objectName: AsterPlotObjectNames.Pies.name,
        propertyName: "fill"
    }
}
