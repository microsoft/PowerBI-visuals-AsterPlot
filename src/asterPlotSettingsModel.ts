import powerbi from "powerbi-visuals-api";
import {formattingSettings} from "powerbi-visuals-utils-formattingmodel"

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;
import IEnumMember = powerbi.IEnumMember;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import {LegendPosition} from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";

const legendPositionOptions: IEnumMember[] = [
    { value: LegendPosition[LegendPosition.Top], displayName: "Visual_Top" },
    { value: LegendPosition[LegendPosition.Bottom], displayName: "Visual_Bottom" },
    { value: LegendPosition[LegendPosition.Left], displayName: "Visual_Left" },
    { value: LegendPosition[LegendPosition.Right], displayName: "Visual_Right" },
    { value: LegendPosition[LegendPosition.TopCenter], displayName: "Visual_TopCenter" },
    { value: LegendPosition[LegendPosition.BottomCenter], displayName: "Visual_BottomCenter" },
    { value: LegendPosition[LegendPosition.LeftCenter], displayName: "Visual_LeftCenter" },
    { value: LegendPosition[LegendPosition.RightCenter], displayName: "Visual_RightCenter" },
]


class BaseFontCardSettings extends Card {
    font = new formattingSettings.FontControl({
        name: "font",
        displayName: "Font",
        displayNameKey: "Visual_Font",
        fontSize: new formattingSettings.NumUpDown({
            name: "fontSize",
            displayName: "Text Size",
            displayNameKey: "Visual_TextSize",
            value: 9,
            options: {
                minValue: { value: 7, type: powerbi.visuals.ValidatorType.Min },
                maxValue: { value: 30, type: powerbi.visuals.ValidatorType.Max },
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
        displayName: "Precision",
        displayNameKey: "Visual_Precision",
        value: null,
    });

    name: string = "labels";
    displayName: string = "Detail Labels";
    displayNameKey: string = "Visual_DetailLabels";
    slices = [this.color, this.displayUnits, this.precision, this.font];
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

    name: string = "legend";
    displayName: string = "Legend";
    displayNameKey: string = "Visual_Legend";
    description: string = "Display legend options";
    descriptionKey: string = "Visual_Description_Legend";
    slices = [this.position, this.titleText, this.labelColor, this.font];
}

class CentralLabelCardSettings extends BaseFontCardSettings {
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

    name: string = "label";
    displayName: string = "Central Label";
    displayNameKey: string = "Visual_CenterLabel";
    slices = [this.color, this.font];
}

class OuterLineCardSettings extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: false,
    });

    thickness = new formattingSettings.NumUpDown({
        name: "thickness",
        displayName: "Thickness",
        displayNameKey: "Visual_Thickness",
        value: 1,
        options: {
            minValue: { value: 0.1, type: powerbi.visuals.ValidatorType.Min },
            maxValue: { value: 10, type: powerbi.visuals.ValidatorType.Max },
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
        displayName: "Text Color",
        displayNameKey: "Visual_TextColor",
        value: { value: "rgb(119, 119, 119)" },
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text Size",
        displayNameKey: "Visual_TextSize",
        value: 9,
        options: {
            minValue: { value: 7, type: powerbi.visuals.ValidatorType.Min },
            maxValue: { value: 30, type: powerbi.visuals.ValidatorType.Max },
        }
    });

    name: string = "outerLine";
    displayName: string = "Outer line"
    displayNameKey: string = "Visual_Outerline";
    slices = [
        this.thickness,
        this.color,
        this.showGrid,
        this.showGridTicksValues,
        this.showStraightLines,
        this.textColor,
        this.fontSize,
    ];
}

class PiesCardSettings extends Card {
    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: { value: "rgb(119, 119, 119)" },
    });

    name: string = "pies";
    displayName: string = "Pies colors";
    displayNameKey: "Visual_PiesColors";
}

export class AsterPlotSettingsModel extends Model {
    labels = new LabelsCardSettings();
    legend = new LegendCardSettings();
    label = new CentralLabelCardSettings();
    outerLine = new OuterLineCardSettings();

    cards = [
        this.labels,
        this.legend,
        this.label,
        this.outerLine,
    ];

    public setLocalizedOptions(localizationManager: ILocalizationManager) {
        this.setLocalizedDisplayName(legendPositionOptions, localizationManager);
    }


    private setLocalizedDisplayName(options: IEnumMember[], localizationManager: ILocalizationManager) {
        options.forEach((option: IEnumMember) => {
            option.displayName = localizationManager.getDisplayName(option.displayName.toString());
        });
    }
}
