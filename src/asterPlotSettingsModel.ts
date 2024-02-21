import powerbi from "powerbi-visuals-api";
import {formattingSettings} from "powerbi-visuals-utils-formattingmodel"
import {LegendPosition} from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";
import {AsterDataPoint} from "./dataInterfaces";
import {ColorHelper} from "powerbi-visuals-utils-colorutils";
import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;
import FormattingSettingsSlice = formattingSettings.Slice;
import IEnumMember = powerbi.IEnumMember;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import ValidatorType = powerbi.visuals.ValidatorType;
import ISelectionId = powerbi.visuals.ISelectionId;

export const AsterPlotObjectNames = {
    Legend: { name: "legend", displayName: "Legend" },
    LegendTitle: { name: "legendTitle", displayName: "Legend title" },
    Label: { name: "label", displayName: "Center Label" },
    Labels: { name: "labels", displayName: "Detail Labels" },
    Pies: { name: "pies", displayName: "Pies colors" },
    OuterLine: { name: "outerLine", displayName: "Outer Line" },
} as const;

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


class LegendCardSettings extends Card {
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

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text Size",
        displayNameKey: "Visual_TextSize",
        value: TextDefaultSizes.DefaultTextSize,
        options: {
            minValue: {value: TextDefaultSizes.MinTextSize, type: powerbi.visuals.ValidatorType.Min},
            maxValue: {value: TextDefaultSizes.MaxTextSize, type: powerbi.visuals.ValidatorType.Max},
        }
    });

    name: string = AsterPlotObjectNames.Legend.name;
    displayName: string = AsterPlotObjectNames.Legend.displayName;
    displayNameKey: string = "Visual_Legend";
    description: string = "Display legend options";
    descriptionKey: string = "Visual_Description_Legend";
    slices = [this.position, this.titleText, this.labelColor, this.fontSize];
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
    displayNameKey: string = "Visual_CenterLabel";
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
    displayNameKey: string = "Visual_DetailLabels";
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
    displayNameKey: "Visual_PiesColors";
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
    displayNameKey: string = "Visual_Outerline";
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
