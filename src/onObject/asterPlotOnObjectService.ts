import powerbi from "powerbi-visuals-api";

import ISelectionId = powerbi.visuals.ISelectionId;

import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import SubSelectionRegionOutlineFragment = powerbi.visuals.SubSelectionRegionOutlineFragment;

import VisualOnObjectFormatting = powerbi.extensibility.visual.VisualOnObjectFormatting;

import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { HtmlSubSelectionHelper, SubSelectableObjectNameAttribute } from "powerbi-visuals-utils-onobjectutils";

import { select as d3Select } from "d3-selection";
import { PieArcDatum as d3PieArcDatum} from "d3-shape"

import { AsterPlotObjectNames } from "../asterPlotSettingsModel";
import { SubSelectionStylesService, SubSelectionShortcutsService } from "./helperServices";
import { AsterDataPoint } from "../dataInterfaces";

export class AsterPlotOnObjectService implements VisualOnObjectFormatting {
    private localizationManager: ILocalizationManager;
    private htmlSubSelectionHelper: HtmlSubSelectionHelper;
    private getArcOutlines: (objectName: string, selectionId?: ISelectionId) => SubSelectionRegionOutlineFragment[];
    
    constructor(element: HTMLElement, host: IVisualHost, localizationManager: ILocalizationManager, getArcOutlines?: (objectName: string, selectionId?: ISelectionId) => SubSelectionRegionOutlineFragment[]){
        this.localizationManager = localizationManager;
        this.getArcOutlines = getArcOutlines;
        this.htmlSubSelectionHelper = HtmlSubSelectionHelper.createHtmlSubselectionHelper({
            hostElement: element,
            subSelectionService: host.subSelectionService,
            selectionIdCallback: (e) => this.selectionIdCallback(e),
            customOutlineCallback: (e) => this.customOutlineCallback(e)
        });
    }
    
    public setFormatMode(isFormatMode: boolean): void {
        this.htmlSubSelectionHelper.setFormatMode(isFormatMode);
    }

    public updateOutlinesFromSubSelections(subSelections: CustomVisualSubSelection[], clearExistingOutlines?: boolean, suppressRender?: boolean): void {
        this.htmlSubSelectionHelper.updateOutlinesFromSubSelections(subSelections, clearExistingOutlines, suppressRender);
    }

    public getSubSelectables(filter?: SubSelectionStylesType): CustomVisualSubSelection[] | undefined{
        return this.htmlSubSelectionHelper.getAllSubSelectables(filter);
    }

    public getSubSelectionStyles(subSelections: CustomVisualSubSelection[]): SubSelectionStyles | undefined{
        const visualObject = subSelections[0]?.customVisualObjects[0];
        if (visualObject) {
            switch (visualObject.objectName) {
                case AsterPlotObjectNames.Legend.name:
                    return SubSelectionStylesService.GetLegendStyles();
                case AsterPlotObjectNames.Label.name:
                    return SubSelectionStylesService.GetCenterLabelStyles();
                case AsterPlotObjectNames.Labels.name:
                    return SubSelectionStylesService.GetDetailLabelsStyles();
                case AsterPlotObjectNames.Ticks.name:
                    return SubSelectionStylesService.GetTicksStyles();
                case AsterPlotObjectNames.Pies.name:
                    return SubSelectionStylesService.GetPiesStyles(subSelections, this.localizationManager);
                case AsterPlotObjectNames.OuterLine.name:
                    return SubSelectionStylesService.GetOuterLineStyles(this.localizationManager);
            }
        }
    }

    public getSubSelectionShortcuts(subSelections: CustomVisualSubSelection[]): VisualSubSelectionShortcuts | undefined{
        const visualObject = subSelections[0]?.customVisualObjects[0];
        if (visualObject) {
            switch (visualObject.objectName) {
                case AsterPlotObjectNames.Legend.name:
                    return SubSelectionShortcutsService.GetLegendShortcuts(this.localizationManager);
                case AsterPlotObjectNames.LegendTitle.name:
                    return SubSelectionShortcutsService.GetLegendTitleShortcuts(this.localizationManager);
                case AsterPlotObjectNames.Label.name:
                    return SubSelectionShortcutsService.GetCenterLabelShortcuts(this.localizationManager);
                case AsterPlotObjectNames.Labels.name:
                    return SubSelectionShortcutsService.GetDetailLabelsShortcuts(this.localizationManager);
                case AsterPlotObjectNames.Ticks.name:
                    return SubSelectionShortcutsService.GetTicksShortcuts(this.localizationManager);
                case AsterPlotObjectNames.Pies.name:
                    return SubSelectionShortcutsService.GetPiesShortcuts(subSelections, this.localizationManager);
                case AsterPlotObjectNames.OuterLine.name:
                    return SubSelectionShortcutsService.GetOuterLineShortcuts(this.localizationManager);
            }
        }
    }

    public selectionIdCallback(e: Element): powerbi.visuals.ISelectionId {
        const elementType: string = d3Select(e).attr(SubSelectableObjectNameAttribute);

        switch (elementType) {
            case AsterPlotObjectNames.Pies.name: {
                const datum = d3Select<Element, d3PieArcDatum<AsterDataPoint>>(e).datum();
                return datum.data.identity;
            }
            default:
                return undefined;
        }
    }

    public customOutlineCallback(subSelections: CustomVisualSubSelection): powerbi.visuals.SubSelectionRegionOutlineFragment[] {
        const elementType: string = subSelections.customVisualObjects[0].objectName;

        switch (elementType) {
            case AsterPlotObjectNames.Pies.name: {
                const subSelectionIdentity: powerbi.visuals.ISelectionId = subSelections.customVisualObjects[0].selectionId;
                const result = this.getArcOutlines(elementType, subSelectionIdentity);
                return result;
            }
            case AsterPlotObjectNames.OuterLine.name: {
                const result = this.getArcOutlines(elementType);
                return result;
            }
            default:
                return undefined;
        }
    }
}
