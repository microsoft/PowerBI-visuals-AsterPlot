import powerbi from "powerbi-visuals-api";
import {formattingSettings} from "powerbi-visuals-utils-formattingmodel"
import {LegendPosition} from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";
import {AsterDataPoint} from "./dataInterfaces";
import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;
import FormattingSettingsSlice = formattingSettings.Slice;
import IEnumMember = powerbi.IEnumMember;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import ValidatorType = powerbi.visuals.ValidatorType;
import ISelectionId = powerbi.visuals.ISelectionId;
import FormattingId = powerbi.visuals.FormattingId;

const nameof = <T>(name: Extract<keyof T, string>): string => name;

export const AsterPlotObjectNames = {
    Legend: { name: "legend", displayName: "Legend", displayNameKey: "Visual_Legend" },
    LegendTitle: { name: "legendTitle", displayName: "Legend title", displayNameKey: "Visual_LegendTitle" },
    Label: { name: "label", displayName: "Center Label", displayNameKey: "Visual_CenterLabel" },
    Labels: { name: "labels", displayName: "Detail Labels", displayNameKey: "Visual_DetailLabels" },
    Pies: { name: "pies", displayName: "Pies colors", displayNameKey: "Visual_PiesColors" },
    OuterLine: { name: "outerLine", displayName: "Outer Line", displayNameKey: "Visual_Outerline" },
} as const;


export const legendReference: {
    cardUid: string;
    groupUid: string;
    show: FormattingId;
    position: FormattingId;
    titleText: FormattingId;
    labelColor: FormattingId;
    fontSize: FormattingId;
    fontFamily: FormattingId;
    bold: FormattingId;
    italic: FormattingId;
    underline: FormattingId;
} = {
    cardUid: "Visual-legend-card",
    groupUid: "legend-group",
    show: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: nameof<LegendCardSettings>("show"),
    },
    position: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: nameof<LegendCardSettings>("position"),
    },
    titleText: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: nameof<LegendCardSettings>("titleText"),
    },
    labelColor: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: nameof<LegendCardSettings>("labelColor")
    },
    fontSize: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "fontSize"
    },
    fontFamily: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "fontFamily"
    },
    bold: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "bold"
    },
    italic: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "italic"
    },
    underline: {
        objectName: AsterPlotObjectNames.Legend.name,
        propertyName: "underline"
    },
};

export const labelReference: {
    cardUid: string;
    groupUid: string;
    show: FormattingId;
    fontFamily: FormattingId;
    bold: FormattingId;
    italic: FormattingId;
    underline: FormattingId;
    fontSize: FormattingId;
    color: FormattingId;
} = {
    cardUid: "Visual-label-card",
    groupUid: "label-group",
    show: {
        objectName: AsterPlotObjectNames.Label.name,
        propertyName: nameof<CenterLabelCardSettings>("show")
    },
    color: {
        objectName: AsterPlotObjectNames.Label.name,
        propertyName: nameof<CenterLabelCardSettings>("color")
    },
    fontFamily: {
        objectName: AsterPlotObjectNames.Label.name,
        propertyName: "fontFamily"
    },
    bold: {
        objectName: AsterPlotObjectNames.Label.name,
        propertyName: "fontBold"
    },
    italic: {
        objectName: AsterPlotObjectNames.Label.name,
        propertyName: "fontItalic"
    },
    underline: {
        objectName: AsterPlotObjectNames.Label.name,
        propertyName: "fontUnderline"
    },
    fontSize: {
        objectName: AsterPlotObjectNames.Label.name,
        propertyName: "fontSize"
    },
};

export const labelsReference: {
    cardUid: string;
    groupUid: string;
    show: FormattingId;
    color: FormattingId;
    displayUnits: FormattingId;
    precision: FormattingId;
    fontFamily: FormattingId;
    bold: FormattingId;
    italic: FormattingId;
    underline: FormattingId;
    fontSize: FormattingId;
} = {
    cardUid: "Visual-labels-card",
    groupUid: "labels-group",
    show: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: nameof<LabelsCardSettings>("show")
    },
    color: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: nameof<LabelsCardSettings>("color")
    },
    displayUnits: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: nameof<LabelsCardSettings>("displayUnits")
    },
    precision: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: nameof<LabelsCardSettings>("precision")
    },
    fontFamily: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: "fontFamily"
    },
    bold: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: "fontBold"
    },
    italic: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: "fontItalic"
    },
    underline: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: "fontUnderline"
    },
    fontSize: {
        objectName: AsterPlotObjectNames.Labels.name,
        propertyName: "fontSize"
    },
}

export const piesReference: {
    cardUid: string;
    groupUid: string;
    fill: FormattingId;
} = {
    cardUid: "Visual-pies-card",
    groupUid: "pies-group",
    fill: {
        objectName: AsterPlotObjectNames.Pies.name,
        propertyName: "fill"
    }
};

export const outerLineReference: {
    cardUid: string;
    groupUid: string;
    fill: FormattingId;
    showGrid: FormattingId;
    showGridTicksValues: FormattingId;
    showStraightLines: FormattingId;
} = {
    cardUid: "Visual-outerLine-card",
    groupUid: "outerLine-group",
    fill: {
        objectName: AsterPlotObjectNames.OuterLine.name,
        propertyName: nameof<OuterLineCardSettings>("color")
    },
    showGrid: {
        objectName: AsterPlotObjectNames.OuterLine.name,
        propertyName: nameof<OuterLineCardSettings>("showGrid")
    },
    showGridTicksValues: {
        objectName: AsterPlotObjectNames.OuterLine.name,
        propertyName: nameof<OuterLineCardSettings>("showGridTicksValues")
    },
    showStraightLines: {
        objectName: AsterPlotObjectNames.OuterLine.name,
        propertyName: nameof<OuterLineCardSettings>("showStraightLines")
    },
}

class TextDefaultSizes {
    public static readonly DefaultTextSize = 9;
    public static readonly MinTextSize = 7;
    public static readonly MaxTextSize = 30;
}

const legendPositionOptions: IEnumMember[] = [
    { value: LegendPosition[LegendPosition.Top], displayName: "Visual_Top" },
    { value: LegendPosition[LegendPosition.Bottom], displayName: "Visual_Bottom" },
    { value: LegendPosition[LegendPosition.Left], displayName: "Visual_Left" },
    { value: LegendPosition[LegendPosition.Right], displayName: "Visual_Right" },
    { value: LegendPosition[LegendPosition.TopCenter], displayName: "Visual_TopCenter" },
    { value: LegendPosition[LegendPosition.BottomCenter], displayName: "Visual_BottomCenter" },
    { value: LegendPosition[LegendPosition.LeftCenter], displayName: "Visual_LeftCenter" },
    { value: LegendPosition[LegendPosition.RightCenter], displayName: "Visual_RightCenter" },
];


class BaseFontCardSettings extends Card {
    font = new formattingSettings.FontControl({
        name: "font",
        displayName: "Font",
        displayNameKey: "Visual_Font",
        fontSize: new formattingSettings.NumUpDown({
            name: "fontSize",
            displayName: "Text Size",
            displayNameKey: "Visual_TextSize",
            value: TextDefaultSizes.DefaultTextSize,
            options: {
                minValue: { value: TextDefaultSizes.MinTextSize, type: powerbi.visuals.ValidatorType.Min },
                maxValue: { value: TextDefaultSizes.MaxTextSize, type: powerbi.visuals.ValidatorType.Max },
            }
        }),
        fontFamily: new formattingSettings.FontPicker({
            name: "fontFamily",
            value: "Arial, sans-serif",
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "fontBold",
            value: false,
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "fontItalic",
            value: false,
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "fontUnderline",
            value: false,
        }),
    });
}


class LegendCardSettings extends BaseFontCardSettings {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: false,
    });

    topLevelSlice = this.show;

    position = new formattingSettings.ItemDropdown({
        name: "position",
        displayName: "Position",
        displayNameKey: "Visual_Position",
        value: legendPositionOptions[0],
        items: legendPositionOptions,
    });

    showTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayName: "Show Title",
        displayNameKey: "Visual_ShowTitle",
        value: true,
    });

    titleText = new formattingSettings.TextInput({
        name: "titleText",
        displayName: "Title",
        displayNameKey: "Visual_Title",
        value: "",
        placeholder: "",
    });

    labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: { value: "#666666" },
    });

    name: string = AsterPlotObjectNames.Legend.name;
    displayName: string = AsterPlotObjectNames.Legend.displayName;
    displayNameKey: string = AsterPlotObjectNames.Legend.displayNameKey;
    description: string = "Display legend options";
    descriptionKey: string = "Visual_Description_Legend";
    slices = [this.position, this.showTitle, this.titleText, this.labelColor, this.font];
}

class CenterLabelCardSettings extends BaseFontCardSettings {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: false,
    });

    topLevelSlice = this.show;

    color = new formattingSettings.ColorPicker({
        name: "color",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: { value: "rgb(119, 119, 119)" },
    });

    name: string = AsterPlotObjectNames.Label.name;
    displayName: string = AsterPlotObjectNames.Label.displayName;
    displayNameKey: string = AsterPlotObjectNames.Label.displayNameKey;
    slices = [this.color, this.font];
}


class LabelsCardSettings extends BaseFontCardSettings {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: false,
    });

    topLevelSlice = this.show;

    color = new formattingSettings.ColorPicker({
        name: "color",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: { value: "#777777" },
    });

    displayUnits = new formattingSettings.AutoDropdown({
        name: "displayUnits",
        displayName: "Display Units",
        displayNameKey: "Visual_DisplayUnits",
        value: 0,
    });

    precision = new formattingSettings.NumUpDown({
        name: "precision",
        displayName: "Decimal Places",
        displayNameKey: "Visual_DecimalPlaces",
        value: null,
        options: {
            minValue: { value: 0, type: ValidatorType.Min },
            maxValue: { value: 17, type: ValidatorType.Max },
        }
    });

    name: string = AsterPlotObjectNames.Labels.name;
    displayName: string = AsterPlotObjectNames.Labels.displayName;
    displayNameKey: string = AsterPlotObjectNames.Labels.displayNameKey;
    slices = [this.color, this.displayUnits, this.precision, this.font];
}

class PiesCardSettings extends Card {
    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayName: "Fill",
        displayNameKey: "Visual_Fill",
        value: { value: "" },
    });

    name: string = AsterPlotObjectNames.Pies.name;
    displayName: string = AsterPlotObjectNames.Pies.displayName;
    displayNameKey: string = AsterPlotObjectNames.Pies.displayNameKey;
    slices: FormattingSettingsSlice[] = [this.fill];
}

export class OuterLineCardSettings extends BaseFontCardSettings {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: false,
    });

    topLevelSlice = this.show;

    thickness = new formattingSettings.Slider({
        name: "thickness",
        displayName: "Thickness",
        displayNameKey: "Visual_Thickness",
        value: 1,
        options: {
            minValue: { value: 0.1, type: ValidatorType.Min },
            maxValue: { value: 25, type: ValidatorType.Max },
        }
    });

    color = new formattingSettings.ColorPicker({
        name: "color",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: { value: "grey" },
    });

    showGrid = new formattingSettings.ToggleSwitch({
        name: "showGrid",
        displayName: "Show Grid",
        displayNameKey: "Visual_ShowGrid",
        value: false,
    });

    showGridTicksValues = new formattingSettings.ToggleSwitch({
        name: "showGridTicksValues",
        displayName: "Show Grid Ticks Values",
        displayNameKey: "Visual_ShowGridTicksValues",
        value: false,
    });

    showStraightLines = new formattingSettings.ToggleSwitch({
        name: "showStraightLines",
        displayName: "Show Straight Lines",
        displayNameKey: "Visual_ShowStraightLines",
        value: true,
    });

    textColor = new formattingSettings.ColorPicker({
        name: "textColor",
        displayName: "Ticks Color",
        displayNameKey: "Visual_TicksColor",
        value: { value: "rgb(119, 119, 119)" },
    });

    name: string = AsterPlotObjectNames.OuterLine.name;
    displayName: string = AsterPlotObjectNames.OuterLine.displayName
    displayNameKey: string = AsterPlotObjectNames.OuterLine.displayNameKey;
    slices = [
        this.thickness,
        this.color,
        this.showGrid,
        this.showGridTicksValues,
        this.showStraightLines,
        this.textColor,
        this.font,
    ];
}

export class AsterPlotSettingsModel extends Model {
    legend = new LegendCardSettings();
    label = new CenterLabelCardSettings();
    labels = new LabelsCardSettings();
    pies = new PiesCardSettings();
    outerLine = new OuterLineCardSettings();

    cards = [
        this.legend,
        this.label,
        this.labels,
        this.pies,
        this.outerLine,
    ];


    public populatePies(pies: AsterDataPoint[], isHighContrast: boolean) {
        if (!pies || pies.length === 0) {
            return;
        }

        this.pies.slices = [];
        this.pies.visible = !isHighContrast;

        for (const pie of pies) {
            const identity: ISelectionId = <ISelectionId>pie.identity;
            const displayName: string = pie.categoryName;
            const selector = identity.getSelector();

            this.pies.slices.push(
                new formattingSettings.ColorPicker({
                    name: "fill",
                    displayName,
                    selector,
                    value: { value: pie.fillColor },
                })
            );
        }
    }

    public setLocalizedOptions(localizationManager: ILocalizationManager) {
        this.setLocalizedDisplayName(legendPositionOptions, localizationManager);
    }

    private setLocalizedDisplayName(options: IEnumMember[], localizationManager: ILocalizationManager) {
        options.forEach((option: IEnumMember) => {
            option.displayName = localizationManager.getDisplayName(option.displayName.toString());
        });
    }
}
