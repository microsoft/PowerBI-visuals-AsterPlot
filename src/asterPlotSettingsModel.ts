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

import powerbi from "powerbi-visuals-api";
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;

import {formattingSettings, formattingSettingsInterfaces} from "powerbi-visuals-utils-formattingmodel"
import {LegendPosition} from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";
import {AsterDataPoint} from "./dataInterfaces";
import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;
import FormattingSettingsSlice = formattingSettings.Slice;
import IEnumMember = powerbi.IEnumMember;
import ILocalizedItemMember = formattingSettingsInterfaces.ILocalizedItemMember;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import ValidatorType = powerbi.visuals.ValidatorType;
import ISelectionId = powerbi.visuals.ISelectionId;
import { isEmpty } from "lodash-es";

interface IEnumMemberWithDisplayNameKey extends IEnumMember{
    key: string;
}

export const AsterPlotObjectNames = {
    Legend: { name: "legend", displayName: "Legend", displayNameKey: "Visual_Legend" },
    LegendTitle: { name: "legendTitle", displayName: "Legend title", displayNameKey: "Visual_LegendTitle" },
    Label: { name: "label", displayName: "Center Label", displayNameKey: "Visual_CenterLabel" },
    Labels: { name: "labels", displayName: "Detail Labels", displayNameKey: "Visual_DetailLabels" },
    Pies: { name: "pies", displayName: "Pies colors", displayNameKey: "Visual_PiesColors" },
    OuterLine: { name: "outerLine", displayName: "Outer Line", displayNameKey: "Visual_Outerline" },
    Ticks: { name: "ticks", displayName: "Ticks", displayNameKey: "Visual_Ticks" },
} as const;

class TextDefaultSizes {
    public static readonly DefaultTextSize = 9;
    public static readonly MinTextSize = 7;
    public static readonly MaxTextSize = 30;
}

const legendPositionOptions: ILocalizedItemMember[] = [
    { value: LegendPosition[LegendPosition.Top], displayNameKey: "Visual_Top" },
    { value: LegendPosition[LegendPosition.Bottom], displayNameKey: "Visual_Bottom" },
    { value: LegendPosition[LegendPosition.Left], displayNameKey: "Visual_Left" },
    { value: LegendPosition[LegendPosition.Right], displayNameKey: "Visual_Right" },
    { value: LegendPosition[LegendPosition.TopCenter], displayNameKey: "Visual_TopCenter" },
    { value: LegendPosition[LegendPosition.BottomCenter], displayNameKey: "Visual_BottomCenter" },
    { value: LegendPosition[LegendPosition.LeftCenter], displayNameKey: "Visual_LeftCenter" },
    { value: LegendPosition[LegendPosition.RightCenter], displayNameKey: "Visual_RightCenter" },
];

const labelPositionOptions: IEnumMemberWithDisplayNameKey[] = [
    { value: "outside", displayName: "Outside", key: "Visual_Outside" },
    { value: "inside", displayName: "Inside", key: "Visual_Inside" }    
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
    slices = [this.position, this.showTitle, this.titleText, this.font, this.labelColor];

    onPreProcess(): void {
        this.titleText.visible = this.showTitle.value;
    }
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
    slices = [ this.font, this.color];
}

class LabelsOptionsSettingsGroup extends BaseFontCardSettings {
     position = new formattingSettings.ItemDropdown({
        name: "position",
        displayName: "Position",
        displayNameKey: "Visual_Position",
        value: labelPositionOptions[0],
        items: labelPositionOptions
    });
    showCategory = new formattingSettings.ToggleSwitch({
        name: "showCategory",
        displayName: "Display Category",
        displayNameKey: "Visual_DisplayCategory",
        value: false,
    });

    showDataValue = new formattingSettings.ToggleSwitch({
        name: "showDataValue",
        displayName: "Display value",
        displayNameKey: "Visual_DisplayValue",
        value: true,
    });

    showPercentOfTotal = new formattingSettings.ToggleSwitch({
        name: "showPercentOfTotal",
        displayName: "Display Percent",
        displayNameKey: "Visual_DisplayPercent",
        value: false,
    });

    name: string = "options";
    displayName: string = "Options";
    displayNameKey: string = "Visual_Options";
    slices: formattingSettings.Slice[] = [this.position, this.showCategory, this.showDataValue, this.showPercentOfTotal];
}

class LablesValuesSettingsGroup extends BaseFontCardSettings {
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
    
    name: string = "values";
    displayName: string = "Values";
    displayNameKey: string = "Visual_Values";
    slices = [this.displayUnits, this.precision, this.font, this.color];
}

class LabelsCardSettings extends formattingSettings.CompositeCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: false,
    });

    topLevelSlice = this.show;

    public labelsOptionsGroup: LabelsOptionsSettingsGroup = new LabelsOptionsSettingsGroup();
    public labelsValuesGroup: LablesValuesSettingsGroup = new LablesValuesSettingsGroup();

    name: string = AsterPlotObjectNames.Labels.name;
    displayName: string = AsterPlotObjectNames.Labels.displayName;
    displayNameKey: string = AsterPlotObjectNames.Labels.displayNameKey;
    groups: formattingSettings.Group[] = [this.labelsOptionsGroup, this.labelsValuesGroup];
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
    public thicknessMin: number = 0.1;
    public thicknessMax: number = 25;
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
            minValue: { value: this.thicknessMin, type: ValidatorType.Min },
            maxValue: { value: this.thicknessMax, type: ValidatorType.Max },
            unitSymbolAfterInput: true,
            unitSymbol: "%"
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
    labelsValues = new LablesValuesSettingsGroup();
    pies = new PiesCardSettings();
    outerLine = new OuterLineCardSettings();

    cards = [
        this.legend,
        this.label,
        this.labels,
        this.pies,
        this.outerLine,
    ];

    setLocalizedOptions(localizationManager: ILocalizationManager): void {
        this.setLocalizedDisplayName(labelPositionOptions, localizationManager);
    }   

    public setLocalizedDisplayName(options: IEnumMemberWithDisplayNameKey[], localizationManager: ILocalizationManager): void {
        options.forEach(option => {
            option.displayName = localizationManager.getDisplayName(option.key)
        });
    }

    public parse(colorPalette: ISandboxExtendedColorPalette, title: string){
        if (isEmpty(this.legend.titleText.value)) {
            this.legend.titleText.value = title;
        }

        this.outerLine.thickness.value = Math.min(this.outerLine.thicknessMax, Math.max(this.outerLine.thicknessMin, this.outerLine.thickness.value));
        this.processHighContrastMode(colorPalette);
    }

    public populatePies(pies: AsterDataPoint[]) {
        if (!pies || pies.length === 0) {
            return;
        }

        this.pies.slices = [];

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

    public processHighContrastMode(colorPalette: ISandboxExtendedColorPalette): void {
        const isHighContrast: boolean = colorPalette.isHighContrast;

        this.legend.labelColor.visible = !isHighContrast;
        this.legend.labelColor.value.value = isHighContrast ? colorPalette.foreground.value : this.legend.labelColor.value.value;

        this.label.color.visible = !isHighContrast;
        this.label.color.value.value = isHighContrast ? colorPalette.foreground.value : this.label.color.value.value;

        this.labels.labelsValuesGroup.color.visible = !isHighContrast;
        this.labels.labelsValuesGroup.color.value.value = isHighContrast ? colorPalette.foreground.value : this.labels.labelsValuesGroup.color.value.value;

        this.pies.visible = !isHighContrast;

        this.outerLine.color.visible = !isHighContrast;
        this.outerLine.color.value.value = isHighContrast ? colorPalette.foreground.value : this.outerLine.color.value.value;
        this.outerLine.textColor.visible = !isHighContrast;
        this.outerLine.textColor.value.value = isHighContrast ? colorPalette.foreground.value : this.outerLine.textColor.value.value;
    }
}
