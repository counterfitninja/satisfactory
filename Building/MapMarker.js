/* global Intl, Sentry */
import BaseLayout_Math                          from '../BaseLayout/Math.js';
import BaseLayout_Modal                         from '../BaseLayout/Modal.js';

import Building_Sign                            from './Sign.js';

import Lib_MapMarker                            from '../Lib/L.MapMarker.js';
import SaveParser_FicsIt                        from '../SaveParser/FicsIt.js';

export default class Building_MapMarker
{
    static get getStampsIcons(){
        return {
            650: ['Biomass', '/img/mapMarkerIcons/TXUI_Biomass_Map.png'],
            651: ['Cave', '/img/mapMarkerIcons/TXUI_Cave_Map.png'],
            652: ['Crash', '/img/mapMarkerIcons/TXUI_Crash_Map.png'],
            653: ['Crate', '/img/mapMarkerIcons/TXUI_Crate_Map.png'],
            654: ['Creature', '/img/mapMarkerIcons/TXUI_Creature_Map.png'],
            656: ['Question Mark', '/img/mapMarkerIcons/TXUI_QMark_Map.png'],
            657: ['Fluids', '/img/mapMarkerIcons/TXUI_Fluids_Map.png'],
            659: ['Radiation', '/img/mapMarkerIcons/TXUI_Radiation_Map.png'],
            660: ['Rock', '/img/mapMarkerIcons/TXUI_Rock_Map.png'],
            661: ['Warning', '/img/mapMarkerIcons/TXUI_Warning_Map.png'],
            662: ['Fruit', '/img/mapMarkerIcons/TXUI_Fruit_Map.png'],
            663: ['Slug', '/img/mapMarkerIcons/TXUI_Slug_Map.png'],
        };
    }


    static getMarkerFromId(baseLayout, mapMarkerId)
    {
        let mapMarkers = baseLayout.mapSubSystem.getMapMarkers();
            for(let i = 0; i < mapMarkers.length; i++)
            {
                for(let j = 0; j < mapMarkers[i].length; j++)
                {
                    if(mapMarkers[i][j].name === 'MarkerID' && mapMarkers[i][j].value.value === mapMarkerId)
                    {
                        return mapMarkers[i];
                    }
                }
            }

        return null;
    }

    static getProperty(mapMarker, propertyName)
    {
        for(let i = 0; i < mapMarker.length; i++)
        {
            if(mapMarker[i].name === propertyName)
            {
                return mapMarker[i].value;
            }
        }
    }

    static getFormattedColor(mapMarker)
    {
        let color = Building_MapMarker.getProperty(mapMarker, 'Color');
            if(color !== null)
            {
                return 'rgb(' + BaseLayout_Math.linearColorToRGB(color.values.r) + ', ' + BaseLayout_Math.linearColorToRGB(color.values.g) + ', ' + BaseLayout_Math.linearColorToRGB(color.values.b) + ')';
            }

        return '#666666';
    }

    static getIconSrc(baseLayout, mapMarker)
    {
        let iconId = Building_MapMarker.getProperty(mapMarker, 'IconID');
            if(Building_Sign.getMonochromeIcons[iconId] !== undefined)
            {
                return [baseLayout.staticUrl + Building_Sign.getMonochromeIcons[iconId][1]];
            }
            if(Building_MapMarker.getStampsIcons[iconId] !== undefined)
            {
                return [baseLayout.staticUrl + Building_MapMarker.getStampsIcons[iconId][1]];
            }

        return baseLayout.getIconSrcFromId(iconId, baseLayout.staticUrl + '/img/mapMarkerIcons/TXUI_QMark_Map.png');
    }

    /*
     * ADD/DELETE
     */
    static add(baseLayout, mapMarker)
    {
        baseLayout.setupSubLayer('playerOrientationLayer');

        let location    = Building_MapMarker.getProperty(mapMarker, 'Location');
        let mapMarkerId = Building_MapMarker.getProperty(mapMarker, 'MarkerID');
            if(mapMarkerId.value !== 255)
            {
                let marker      = new L.mapMarker(
                    baseLayout.satisfactoryMap.unproject([location.values[0].value, location.values[1].value, location.values[2].value]),
                    {
                        mapMarkerId     : mapMarkerId.value,
                        color           : '#FFFFFF',
                        fillColor       : Building_MapMarker.getFormattedColor(mapMarker),
                        icon            : Building_MapMarker.getIconSrc(baseLayout, mapMarker),
                        zIndexOffset    : 900
                    }
                );

                baseLayout.playerLayers.playerOrientationLayer.count++;
                baseLayout.bindMouseEvents(marker);
                baseLayout.playerLayers.playerOrientationLayer.elements.push(marker);

                return {layer: 'playerOrientationLayer', marker: marker};
            }

        return null;
    }

    static delete(marker)
    {
        let baseLayout  = marker.baseLayout;
        let mapMarkerId = marker.relatedTarget.options.mapMarkerId;
        let mapMarkers  = baseLayout.mapSubSystem.getMapMarkers();
            for(let i = (mapMarkers.length - 1); i >= 0; i--)
            {
                for(let j = 0; j < mapMarkers[i].length; j++)
                {
                    if(mapMarkers[i][j].name === 'MarkerID' && mapMarkers[i][j].value.value === mapMarkerId)
                    {
                        mapMarkers.splice(i, 1);
                        baseLayout.deleteMarkerFromElements('playerOrientationLayer', marker.relatedTarget);
                        baseLayout.playerLayers.playerOrientationLayer.count--;
                        baseLayout.setBadgeLayerCount('playerOrientationLayer');

                        SaveParser_FicsIt.fixMapManager(baseLayout, baseLayout.mapSubSystem.subSystem, true);
                        return;
                    }
                }
            }
    }

    /**
     * CONTEXT MENU
     */
    static addContextMenu(baseLayout, mapMarkerId, contextMenu)
    {
        let mapMarker = Building_MapMarker.getMarkerFromId(baseLayout, mapMarkerId);
            if(mapMarker !== null)
            {
                contextMenu.push({
                    text        : Building_MapMarker.getProperty(mapMarker, 'Name')
                });
                contextMenu.push({
                    icon        : 'fa-arrows-alt',
                    text        : baseLayout.translate._('Update position'),
                    callback    : Building_MapMarker.updatePosition});
                contextMenu.push('-');

                contextMenu.push({
                    icon        : 'fa-pen',
                    text        : baseLayout.translate._('Update label'),
                    callback    : Building_MapMarker.updateText
                });
                contextMenu.push({
                    icon        : 'fa-paint-brush',
                    text        : baseLayout.translate._('Update color'),
                    callback    : Building_MapMarker.updateColor
                });
                contextMenu.push({
                    icon        : 'fa-icons',
                    text        : baseLayout.translate._('Update icon'),
                    callback    : Building_MapMarker.updateIcon
                });
                contextMenu.push('-');

                contextMenu.push({
                    icon        : 'fa-trash-alt',
                    text        : baseLayout.translate._('Delete'),
                    callback    : Building_MapMarker.delete
                });
            }

        return contextMenu;
    }

    /**
     * MODALS
     */
    static updatePosition(marker)
    {
        let baseLayout      = marker.baseLayout;
        let mapMarkerId     = marker.relatedTarget.options.mapMarkerId;
        let mapMarker       = Building_MapMarker.getMarkerFromId(baseLayout, mapMarkerId);
        let location        = Building_MapMarker.getProperty(mapMarker, 'Location');

            BaseLayout_Modal.form({
                title       : 'Update "<strong>Map Marker</strong>" position',
                container   : '#leafletMap',
                inputs      : [{
                    label       : 'X',
                    name        : 'x',
                    inputType   : 'coordinate',
                    value       : location.values[0].value
                },
                {
                    label       : 'Y',
                    name        : 'y',
                    inputType   : 'coordinate',
                    value       : location.values[1].value
                },
                {
                    label       : 'Z',
                    name        : 'z',
                    inputType   : 'coordinate',
                    value       : location.values[2].value
                }],
                callback    : function(values)
                {
                    values.x        = parseFloat(values.x);
                    values.y        = parseFloat(values.y);
                    values.z        = parseFloat(values.z);

                    for(let i = 0; i < mapMarker.length; i++)
                    {
                        if(mapMarker[i].name === 'Location')
                        {
                            if(isNaN(values.x) === false)
                            {
                                mapMarker[i].value.values[0].value = values.x;
                            }
                            if(isNaN(values.y) === false)
                            {
                                mapMarker[i].value.values[1].value = values.y;
                            }
                            if(isNaN(values.z) === false)
                            {
                                mapMarker[i].value.values[2].value = values.z;
                            }

                            baseLayout.deleteMarkerFromElements('playerOrientationLayer', marker.relatedTarget);
                            baseLayout.playerLayers.playerOrientationLayer.count--;

                            let result = Building_MapMarker.add(baseLayout, mapMarker);
                                baseLayout.addElementToLayer(result.layer, result.marker);
                            return;
                        }
                    }
                }
            });
    }

    static updateText(marker)
    {
        let baseLayout      = marker.baseLayout;
        let mapMarkerId     = marker.relatedTarget.options.mapMarkerId;
        let mapMarker       = Building_MapMarker.getMarkerFromId(baseLayout, mapMarkerId);

            BaseLayout_Modal.form({
                title       : 'Update "<strong>Map Marker</strong>" label',
                container   : '#leafletMap',
                inputs      : [{
                    name        : 'Name',
                    inputType   : 'text',
                    value       : Building_MapMarker.getProperty(mapMarker, 'Name')
                }],
                callback    : function(values)
                {
                    if(values.Name !== '')
                    {
                        for(let i = 0; i < mapMarker.length; i++)
                        {
                            if(mapMarker[i].name === 'Name')
                            {
                                mapMarker[i].value = values.Name;
                                return;
                            }
                        }
                    }
                }
            });
    }

    static updateColor(marker)
    {
        let baseLayout              = marker.baseLayout;
        let mapMarkerId             = marker.relatedTarget.options.mapMarkerId;
        let mapMarker               = Building_MapMarker.getMarkerFromId(baseLayout, mapMarkerId);

            BaseLayout_Modal.form({
                title       : 'Update "<strong>Map Marker</strong>" color',
                container   : '#leafletMap',
                inputs      : [{
                    name            : 'Color',
                    inputType       : 'colorPicker',
                    value           : Building_MapMarker.getFormattedColor(mapMarker),
                    colorPresets    : baseLayout.gameStateSubSystem.getPlayerColorPresets()
                }],
                callback    : function(values)
                {
                    let newColor = {
                            r       : BaseLayout_Math.RGBToLinearColor(values.Color.r),
                            g       : BaseLayout_Math.RGBToLinearColor(values.Color.g),
                            b       : BaseLayout_Math.RGBToLinearColor(values.Color.b),
                            a       : 1
                        };

                    for(let i = 0; i < mapMarker.length; i++)
                    {
                        if(mapMarker[i].name === 'Color')
                        {
                            mapMarker[i].value.values = newColor;

                            baseLayout.deleteMarkerFromElements('playerOrientationLayer', marker.relatedTarget);
                            baseLayout.playerLayers.playerOrientationLayer.count--;

                            let result = Building_MapMarker.add(baseLayout, mapMarker);
                                baseLayout.addElementToLayer(result.layer, result.marker);
                            return;
                        }
                    }
                }
            });
    }

    /**
     * MODALS ICONS
     */
    static generateIconOptions()
    {
        let options = [];

            // Stamps
            for(let key in Building_MapMarker.getStampsIcons)
            {
                options.push({
                    group       : 'Stamps',
                    dataContent : '<img src="' + Building_MapMarker.getStampsIcons[key][1] + '" style="width: 24px;" class="mr-1" /> ' + Building_MapMarker.getStampsIcons[key][0],
                    value       : key,
                    text        : Building_MapMarker.getStampsIcons[key][0]
                });
            }

            // Monochrome
            for(let key in Building_Sign.getMonochromeIcons)
            {
                options.push({
                    group       : 'Monochrome',
                    dataContent : '<img src="' + Building_Sign.getMonochromeIcons[key][1] + '" style="width: 24px;" class="mr-1" /> ' + Building_Sign.getMonochromeIcons[key][0],
                    value       : key,
                    text        : Building_Sign.getMonochromeIcons[key][0]
                });
            }

            return options;
    };

    static updateIcon(marker)
    {
        let baseLayout      = marker.baseLayout;
        let mapMarkerId     = marker.relatedTarget.options.mapMarkerId;
        let mapMarker       = Building_MapMarker.getMarkerFromId(baseLayout, mapMarkerId);
        let options         = Building_MapMarker.generateIconOptions();
            /*
            if(baseLayout.useDebug === true)
            {
                options.push({value: 184, text: 'TEST ICON ID'});
            }
            /**/

            BaseLayout_Modal.form({
                title       : 'Update "<strong>Map Marker</strong>" icon',
                container   : '#leafletMap',
                inputs      : [{
                    name        : 'IconID',
                    inputType   : 'selectPicker',
                    inputOptions: options,
                    value       : Building_MapMarker.getProperty(mapMarker, 'IconID')
                }],
                callback    : function(values)
                {
                    for(let i = 0; i < mapMarker.length; i++)
                    {
                        if(mapMarker[i].name === 'IconID')
                        {
                            mapMarker[i].value = parseInt(values.IconID);

                            baseLayout.deleteMarkerFromElements('playerOrientationLayer', marker.relatedTarget);
                            baseLayout.playerLayers.playerOrientationLayer.count--;

                            let result = Building_MapMarker.add(baseLayout, mapMarker);
                                baseLayout.addElementToLayer(result.layer, result.marker);
                            return;
                        }
                    }

                }
            });
    }


    /**
     * TOOLTIP
     */
    static getTooltip(baseLayout, mapMarkerId, genericTooltipBackgroundStyle)
    {
        let mapMarker = Building_MapMarker.getMarkerFromId(baseLayout, mapMarkerId);
            if(mapMarker !== null)
            {
                let content     = [];
                    content.push(Building_MapMarker.getProperty(mapMarker, 'Name'));

                let location    = Building_MapMarker.getProperty(mapMarker, 'Location');
                    content.push('<div class="text-small">' + new Intl.NumberFormat(baseLayout.language).format(Math.round(location.values[0].value)) + ' / ' + new Intl.NumberFormat(baseLayout.language).format(Math.round(location.values[1].value)) + '</div>');
                    content.push('<div class="text-small">Altitude: ' + new Intl.NumberFormat(baseLayout.language).format(Math.round(location.values[2].value / 100)) + 'm</div>');

                return '<div class="d-flex" style="' + genericTooltipBackgroundStyle + '">\
                            <div class="justify-content-center align-self-center w-100 text-center" style="margin: -10px 0;">\
                                ' + content.join('') + '\
                            </div>\
                        </div>';
            }

        return null;
    }
}