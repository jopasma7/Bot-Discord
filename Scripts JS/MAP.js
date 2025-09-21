/*
 * Script Name: Map Coords
 * Version: v1.1
 * Last Updated: 2024-04-10
 * Author: Rabagalan73
 */

var scriptData = {
    name: 'Map Coords',
    version: 'v1.1',
    author: 'Rabagalan73'
};

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false; // enable/disable debug mode

// Globals
var ALLOWED_GAME_SCREENS = ['map']; // list of game screens where script can be executed
var COORDS_REGEX = /[0-9]{1,3}\|[0-9]{1,3}/g; // regex for coordinates

if (typeof TWMap === 'undefined') TWMap = {};
if ('TWMap' in window) mapOverlay = TWMap;

// Data Store Config
var STORAGE_KEY = 'RA_CBW_STORE'; // key for sessionStorage
var DEFAULT_STATE = {
    MAX_BARBARIANS: 100,
    MAX_FA_PAGES_TO_FETCH: 20,
};

// Translations
var translations = {
    en_DK: {
        'Clear Barbarian Walls': 'Clear Barbarian Walls',
        Help: 'Help',
        'This script requires PA and FA to be active!':
            'This script requires PA and FA to be active!',
        'Redirecting...': 'Redirecting...',
        'Fetching FA pages...': 'Fetching FA pages...',
        'Finished fetching FA pages!': 'Finished fetching FA pages!',
        Fetching: 'Fetching',
        'No barbarian villages found fitting the criteria!':
            'No barbarian villages found fitting the criteria!',
        Type: 'Type',
        Barbarian: 'Barbarian',
        Report: 'Report',
        Distance: 'Distance',
        Wall: 'Wall',
        'Last Attack Time': 'Last Attack Time',
        Actions: 'Actions',
        Attack: 'Attack',
        'barbarian villages where found': 'barbarian villages where found',
        'Showing the first': 'Showing the first',
        'barbarian villages.': 'barbarian villages.',
        Settings: 'Settings',
        'Save Settings': 'Save Settings',
        'Maximum villages to show on the table':
            'Maximum villages to show on the table',
        'Maximum FA Pages to fetch': 'Maximum FA Pages to fetch',
        'Minimum Wall Level': 'Minimum Wall Level',
        'Settings saved!': 'Settings saved!',
        'Include reports with partial losses':
            'Include reports with partial losses',
    },
};

// Init Debug
//initDebug();


// Initialize script logic
async function initScript(store) {
    const { MAX_BARBARIANS, MAX_FA_PAGES_TO_FETCH } = store;
    const faURLs = await fetchFAPages(MAX_FA_PAGES_TO_FETCH);

    // Show progress bar and notify user
    startProgressBar(faURLs.length);
    UI.SuccessMessage(tt('Fetching FA pages...'));

    const faPages = [];
    jQuery.fetchAll(
        faURLs,
        function (index, data) {
            updateProgressBar(index, faURLs.length);
            const { plunder_list } = data;
            faPages.push(...plunder_list);
        },
        function () {
            const faTableRows = getFATableRows(faPages);
            const barbarians = getFABarbarians(faTableRows);

            const content = prepareContent(barbarians, MAX_BARBARIANS);
            renderUI(content);
            jQuery('#barbVillagesCount').text(barbarians.length);

            updateMap(barbarians);

            // event handlers
            showSettingsPanel(store);
        },
        function (error) {
            UI.ErrorMessage('Error fetching FA pages!');
            console.error(`${scriptInfo()} Error:`, error);
        }
    );
}

// Update map to include barbarians
function updateMap(barbarians) {
    const barbCoords = barbarians.map((barbarian) => barbarian.coord);
    // Show wall level of barbarian villages on the Map
    if (mapOverlay.mapHandler._spawnSector) {
        //exists already, don't recreate
    } else {
        //doesn't exist yet
        mapOverlay.mapHandler._spawnSector = mapOverlay.mapHandler.spawnSector;
    }

    TWMap.mapHandler.spawnSector = function (data, sector) {
        // Override Map Sector Spawn
        mapOverlay.mapHandler._spawnSector(data, sector);
        var beginX = sector.x - data.x;
        var endX = beginX + mapOverlay.mapSubSectorSize;
        var beginY = sector.y - data.y;
        var endY = beginY + mapOverlay.mapSubSectorSize;
        for (var x in data.tiles) {
            var x = parseInt(x, 10);
            if (x < beginX || x >= endX) {
                continue;
            }
            for (var y in data.tiles[x]) {
                var y = parseInt(y, 10);

                if (y < beginY || y >= endY) {
                    continue;
                }
                var xCoord = data.x + x;
                var yCoord = data.y + y;
                var v = mapOverlay.villages[xCoord * 1000 + yCoord];
                if (v) {
                    var vXY = '' + v.xy;
                    var vCoords = vXY.slice(0, 3) + '|' + vXY.slice(3, 6);
                    if (barbCoords.includes(vCoords)) {
                        const currentBarbarian = barbarians.find(
                            (obj) => obj.villageId == v.id
                        );

                        const eleDIV = $('<div></div>')
                            .css({
                                border: '1px coral solid',
                                position: 'absolute',
                                backgroundColor: '#000',
                                color: '#fff',
                                width: '30px',
                                height: '15px',
                                marginTop: '20px',
                                marginLeft: '10px',
                                display: 'block',
                                zIndex: '10',
                                fontWeight: 'normal',
                                textAlign: 'center',
                            })
                            .attr('id', 'dsm' + v.id)
                            .html(currentBarbarian.wall);

                        sector.appendElement(
                            eleDIV[0],
                            data.x + x - sector.x,
                            data.y + y - sector.y
                        );
                    }
                }
            }
        }
    };

    mapOverlay.reload();
}