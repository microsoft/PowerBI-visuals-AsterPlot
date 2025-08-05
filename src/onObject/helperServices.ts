import powerbi from "powerbi-visuals-api";

import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import VisualShortcutType = powerbi.visuals.VisualShortcutType;
import TextSubSelectionStyles = powerbi.visuals.TextSubSelectionStyles;
import NumericTextSubSelectionStyles = powerbi.visuals.NumericTextSubSelectionStyles;

import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { centerLabelReferences, detailLabelsReferences, legendReferences, outerLineReferences, piesReferences } from "./references";
import { IFontReference } from "./interfaces";

export class SubSelectionStylesService {
    private static GetSubselectionStylesForText(objectReference: IFontReference): TextSubSelectionStyles {
        return {
            type: SubSelectionStylesType.Text,
            fontFamily: {
                reference: {
                    ...objectReference.fontFamily
                },
                label: objectReference.fontFamily.propertyName
            },
            bold: {
                reference: {
                    ...objectReference.bold
                },
                label: objectReference.bold.propertyName
            },
            italic: {
                reference: {
                    ...objectReference.italic
                },
                label: objectReference.italic.propertyName
            },
            underline: {
                reference: {
                    ...objectReference.underline
                },
                label: objectReference.underline.propertyName
            },
            fontSize: {
                reference: {
                    ...objectReference.fontSize
                },
                label: objectReference.fontSize.propertyName
            },
            fontColor: {
                reference: {
                    ...objectReference.color
                },
                label: objectReference.color.propertyName
            }
        };
    }

    public static GetLegendStyles(): SubSelectionStyles {
        return SubSelectionStylesService.GetSubselectionStylesForText(legendReferences);
    }

    public static GetCenterLabelStyles(): SubSelectionStyles {
        return SubSelectionStylesService.GetSubselectionStylesForText(centerLabelReferences);
    }

    public static GetDetailLabelsStyles(): SubSelectionStyles {
        const textStyles: NumericTextSubSelectionStyles = {
            ...this.GetSubselectionStylesForText(detailLabelsReferences),
            type: SubSelectionStylesType.NumericText,
            displayUnits: {
                reference: {
                    ...detailLabelsReferences.displayUnits
                },
                label: detailLabelsReferences.displayUnits.propertyName
            },
            precision: {
                reference: {
                    ...detailLabelsReferences.precision
                },
                label: detailLabelsReferences.precision.propertyName
            },
        };

        return textStyles;
    }

    public static GetTicksStyles(): SubSelectionStyles {
        return SubSelectionStylesService.GetSubselectionStylesForText(outerLineReferences);
    }

    public static GetPiesStyles(subSelections: CustomVisualSubSelection[], localizationManager: ILocalizationManager): SubSelectionStyles {
        const selector = subSelections[0].customVisualObjects[0].selectionId?.getSelector();
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                    ...piesReferences.fill,
                    selector
                },
                label: localizationManager.getDisplayName("Visual_Fill")
            },
        };
    }
    public static GetOuterLineStyles(localizationManager: ILocalizationManager): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                    ...outerLineReferences.linesColor,
                },
                label: localizationManager.getDisplayName("Visual_Color")
            },
        };
    }
}

export class SubSelectionShortcutsService {
    public static GetLegendShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts{
        return [
            {
                type: VisualShortcutType.Picker,
                ...legendReferences.position,
                label: localizationManager.getDisplayName("Visual_Position")
            },
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.show,
                disabledLabel: localizationManager.getDisplayName("Visual_Delete")
            },
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.showTitle,
                enabledLabel: localizationManager.getDisplayName("Visual_AddTitle")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    legendReferences.bold,
                    legendReferences.fontFamily,
                    legendReferences.fontSize,
                    legendReferences.italic,
                    legendReferences.underline,
                    legendReferences.color,
                    legendReferences.showTitle,
                    legendReferences.titleText
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: legendReferences.cardUid, groupUid: legendReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_FormatLegend")
            }
        ];
    }
    public static GetLegendTitleShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.showTitle,
                disabledLabel: localizationManager.getDisplayName("Visual_Delete")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    legendReferences.showTitle,
                    legendReferences.titleText
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: legendReferences.cardUid, groupUid: legendReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_FormatLegend")
            }
        ];
    }
    public static GetCenterLabelShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...centerLabelReferences.show,
                disabledLabel: localizationManager.getDisplayName("Visual_Delete")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    centerLabelReferences.bold,
                    centerLabelReferences.fontFamily,
                    centerLabelReferences.fontSize,
                    centerLabelReferences.italic,
                    centerLabelReferences.underline,
                    centerLabelReferences.color,
                    centerLabelReferences.show
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: centerLabelReferences.cardUid, groupUid: centerLabelReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_FormatCenterLabel")
            }
        ];
    }
    public static GetDetailLabelsShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...detailLabelsReferences.show,
                disabledLabel: localizationManager.getDisplayName("Visual_Delete")
            },
            {
                type: VisualShortcutType.Picker,
                ...detailLabelsReferences.position,
                label: localizationManager.getDisplayName("Visual_Position")
            },
            {
                type: VisualShortcutType.Picker,
                ...detailLabelsReferences.detailLabelsContent,
                label: localizationManager.getDisplayName("Visual_LabelsContent")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    detailLabelsReferences.bold,
                    detailLabelsReferences.fontFamily,
                    detailLabelsReferences.fontSize,
                    detailLabelsReferences.italic,
                    detailLabelsReferences.underline,
                    detailLabelsReferences.color,
                    detailLabelsReferences.show,
                    detailLabelsReferences.precision,
                    detailLabelsReferences.displayUnits,
                    detailLabelsReferences.position,
                    detailLabelsReferences.detailLabelsContent
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: detailLabelsReferences.cardUid, groupUid: detailLabelsReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_FormatLabels")
            }
        ];
    }
    public static GetTicksShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...outerLineReferences.showTicks,
                disabledLabel: localizationManager.getDisplayName("Visual_Delete")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    outerLineReferences.bold,
                    outerLineReferences.fontFamily,
                    outerLineReferences.fontSize,
                    outerLineReferences.italic,
                    outerLineReferences.underline,
                    outerLineReferences.color,
                    outerLineReferences.showTicks
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: outerLineReferences.cardUid, groupUid: outerLineReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_FormatTicks")
            }
        ];
    }
    public static GetPiesShortcuts(subSelections: CustomVisualSubSelection[], localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        const selector = subSelections[0].customVisualObjects[0].selectionId?.getSelector();
        return [
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [{
                    ...piesReferences.fill,
                    selector
                }],
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: piesReferences.cardUid },
                label: localizationManager.getDisplayName("Visual_FormatPies")
            }
        ];
    }
    public static GetOuterLineShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...outerLineReferences.show,
                disabledLabel: localizationManager.getDisplayName("Visual_DeleteOuterLine"),
            },
            {
                type: VisualShortcutType.Toggle,
                ...outerLineReferences.showGrid,
                disabledLabel: localizationManager.getDisplayName("Visual_HideGrid"),
                enabledLabel: localizationManager.getDisplayName("Visual_ShowGrid")
            },
            {
                type: VisualShortcutType.Toggle,
                ...outerLineReferences.showLines,
                disabledLabel: localizationManager.getDisplayName("Visual_HideStraightLines"),
                enabledLabel: localizationManager.getDisplayName("Visual_ShowStraightLines")
            },
            {
                type: VisualShortcutType.Toggle,
                ...outerLineReferences.showTicks,
                enabledLabel: localizationManager.getDisplayName("Visual_ShowGridTicksValues"),
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [{
                    ...outerLineReferences.linesColor,
                    ...outerLineReferences.showGrid,
                    ...outerLineReferences.showLines,
                    ...outerLineReferences.showTicks
                }],
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: outerLineReferences.cardUid },
                label: localizationManager.getDisplayName("Visual_FormatOuterLine")
            }
        ];
    }
}