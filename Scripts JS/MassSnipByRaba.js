/*
 * Script Name: Mass Snipe
 * Version: v1.1.3
 * Last Updated: 2023-09-21
 * Author: RedAlert
 * Author URL: https://twscripts.dev/
 * Author Contact: redalert_tw (Discord)
 * Approved: N/A
 * Approved Date: 2023-01-20
 * Mod: JawJaw
 */

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;

// Script Config
var scriptConfig = {
    scriptData: {
        prefix: 'massSnipe',
        name: 'Mass Snipe',
        version: 'v1.1.3',
        author: 'RedAlert',
        authorUrl: 'https://twscripts.dev/',
        helpLink:
            'https://forum.tribalwars.net/index.php?threads/mass-snipe.290217/',
    },
    translations: {
        en_DK: {
            'Mass Snipe': 'Mass Snipe',
            Help: 'Help',
            'There was an error!': 'There was an error!',
            'There was an error while fetching the data!':
                'There was an error while fetching the data!',
            'Redirecting...': 'Redirecting...',
            'There was an error fetching villages by group!':
                'There was an error fetching villages by group!',
            'An error occured while fetching troop counts!':
                'An error occured while fetching troop counts!',
            Village: 'Village',
            'Landing Time': 'Landing Time',
            Sigil: 'Sigil',
            'Min. Amount': 'Min. Amount',
            Action: 'Action',
            'Add new Snipe': 'Add new Snipe',
            'Calculate Times': 'Calculate Times',
            From: 'From',
            To: 'To',
            Unit: 'Unit',
            Distance: 'Distance',
            'Launch Time': 'Launch Time',
            'Send in': 'Send in',
            Send: 'Send',
            'No possible snipe options found!':
                'No possible snipe options found!',
            'combinations found': 'combinations found',
            'Export as BB Code': 'Export as BB Code',
            'Nothing to export!': 'Nothing to export!',
            'Copied on clipboard!': 'Copied on clipboard!',
            Command: 'Command',
            Status: 'Status',
            'Reset Script': 'Reset Script',
            'Script configuration has been reset!':
                'Script configuration has been reset!',
            'Already exists!': 'Already exists!',
            'Mass Import': 'Mass Import',
            'Paste text here from a forum thread':
                'Paste text here from a forum thread',
            'There has been an error while parsing the text!':
                'There has been an error while parsing the text!',
            'No trains could be found!': 'No trains could be found!',
            'This field can not be empty!': 'This field can not be empty!',
            // string identifiers which need to be translated for text parser to identify them on other languages
            Noble: 'Noble',
            'Village:': 'Village:',
            'Arrival time:': 'Arrival time:',
        },
        pt_BR: {
            'Mass Snipe': 'Snip em massa',
            Help: 'Ajuda',
            'There was an error!': 'Ocorreu um erro!',
            'There was an error while fetching the data!':
                'Ocorreu um erro ao buscar os dados!',
            'Redirecting...': 'Redirecionando...',
            'There was an error fetching villages by group!':
                'Ocorreu um erro ao buscar aldeias no grupo!',
            'An error occured while fetching troop counts!':
                'Ocorreu um erro ao buscar a quantidade de tropas!',
            Village: 'Aldeia',
            'Landing Time': 'Hora de chegada',
            Sigil: 'Afli\u00e7\u00e3o',
            'Min. Amount': 'Quantidade m\u00edn.',
            Action: 'A\u00e7\u00e3o',
            'Add new Snipe': 'Add novo snip',
            'Calculate Times': 'Calcular tempos',
            From: 'Origem',
            To: 'Destino',
            Unit: 'Unidade',
            Distance: 'Dist\u00e2ncia',
            'Launch Time': 'Hora de sa\u00edda',
            'Send in': 'Enviar em',
            Send: 'Enviar',
            'No possible snipe options found!':
                'Nenhuma op\u00e7\u00e3o poss\u00edvel de snip encontrada!',
            'combinations found': 'combina\u00e7\u00f5es encontradas',
            'Export as BB Code': 'Exportar como C\u00f3digo BB',
            'Nothing to export!': 'Nada para exportar!',
            'Copied on clipboard!':
                'Copiado na \u00e1rea de transfer\u00eancia!',
            Command: 'Comando',
            Status: 'Status',
            'Reset Script': 'Redefinir script',
            'Script configuration has been reset!':
                'A configura\u00e7\u00e3o do script foi redefinida!',
            'Already exists!': 'J\u00e1 existe!',
            'Mass Import': 'Import. em massa',
            'Paste text here from a forum thread':
                'Cole aqui o texto de um t\u00f3pico do f\u00f3rum',
            'There has been an error while parsing the text!':
                'Ocorreu um erro ao analisar o texto!',
            'No trains could be found!': 'Nenhum noble train foi encontrado!',
            'This field can not be empty!':
                'Este campo n\u00e3o pode ficar vazio!',
            // string identifiers which need to be translated for text parser to identify them on other languages
            Noble: 'Nobre',
            'Village:': 'Aldeia:',
            'Arrival time:': 'Arrival time:',
        },
        es_ES: {
            'Mass Snipe': 'Snip en masa',
            Help: 'Ayuda',
            'There was an error!': 'OcurriÃ³ un error!',
            'There was an error while fetching the data!':
                'Se produjo un error al obtener los datos!',
            'Redirecting...': 'Redireccionando...',
            'There was an error fetching villages by group!':
                'Se produjo un error al buscar pueblos por grupo.!',
            'An error occured while fetching troop counts!':
                'Se produjo un error al obtener el recuento de tropas.!',
            Village: 'Pueblo',
            'Landing Time': 'Hora de llegada',
            Sigil: 'Sigil',
            'Min. Amount': 'Cantidad mÃ­nima',
            Action: 'AcciÃ³n',
            'Add new Snipe': 'AÃ±adir nuevo snip',
            'Calculate Times': 'Calcular tiempos',
            From: 'Origen',
            To: 'Destino',
            Unit: 'Unidad',
            Distance: 'Distancia',
            'Launch Time': 'Hora de salida',
            'Send in': 'Mandar',
            Send: 'Enviar',
            'No possible snipe options found!': 'No hay snips posibles!',
            'combinations found': 'Combinaciones encontradas',
            'Export as BB Code': 'Exportar como CÃ³digo BB',
            'Nothing to export!': 'Nada para exportar!',
            'Copied on clipboard!': 'Copiado portapapeles!',
            Command: 'Orden',
            Status: 'Status',
            'Reset Script': 'Resetear script',
            'Script configuration has been reset!':
                'La configuracion se ha reseteado!',
            'Already exists!': 'Ya existe!',
            'Mass Import': 'Importar en masa',
            'Paste text here from a forum thread':
                'Coloque aquÃ­ el texto del foro',
            'There has been an error while parsing the text!':
                'OcurriÃ³ un error la analizar el texto!',
            'No trains could be found!': 'NingÃºn tren encontrado!',
            'This field can not be empty!': 'Este campo no puede estar vacio!',
            // string identifiers which need to be translated for text parser to identify them on other languages
            Noble: 'Noble',
            'Village:': 'Pueblo:',
            'Arrival time:': 'Arrival time:',
        },
    },
    allowedMarkets: [],
    allowedScreens: [],
    allowedModes: [],
    isDebug: DEBUG,
    enableCountApi: true,
};

$.getScript(
    `https://twscripts.dev/scripts/twSDK.js?url=${document.currentScript.src}`,
    async function () {
        // Initialize Library
        await twSDK.init(scriptConfig);
        const scriptInfo = twSDK.scriptInfo();

        const DEFAULT_VALUES = {
            SELECTED_UNITS: ['spear', 'sword', 'archer', 'heavy'],
        };

        const { worldUnitInfo, villages } = await fetchWorldConfigData();

        // Entry Point
        (async function () {
            try {
                // build user interface
                buildUI();

                // register event handlers
                handleAddNewSnipeNeeded();
                handleRemoveSnipeNeeded();
                handleCalculateTimes();
                handleAddSnipeNeededFromDOM();
                handleMassImport();
                handleExportBBCode();
                handleResetScript();
            } catch (error) {
                UI.ErrorMessage(twSDK.tt('There was an error!'));
                console.error(`${scriptInfo} Error:`, error);
            }
        })();

        // Render: Build user interface
        function buildUI() {
            const { selectedUnits, snipesNeeded } = initDefaultValues();

            const unitPickerHtml = twSDK.buildUnitsPicker(selectedUnits, [
                'spy',
                'militia',
            ]);
            const snipesNeededTable = buildSnipesNeededTable(snipesNeeded);

            const content = `
                <div class="ra-mb15">
                    ${unitPickerHtml}
                </div>
                <div class="ra-mb15">
                    ${snipesNeededTable}
                </div>
                <div>
                    <a href="javascript:void(0);" id="raCalculateTimesBtn" class="btn">
                        ${twSDK.tt('Calculate Times')}
                    </a>
                    <a href="javascript:void(0);" id="raMassImportBtn" class="btn">
                        ${twSDK.tt('Mass Import')}
                    </a>
                    <a href="javascript:void(0);" id="raExportBBCodeBtn" class="btn">
                        ${twSDK.tt('Export as BB Code')}
                    </a>
                    <a href="javascript:void(0);" id="raResetScriptBtn" class="btn">
                        ${twSDK.tt('Reset Script')}
                    </a>
                </div>
                <div id="raSnipes" class="ra-mt15" style="display:none;">
                    <label class="ra-label"><span id="raPossibleCombinationsCount">0</span> ${twSDK.tt(
                        'combinations found'
                    )}</label>
                    <div id="raPossibleCombinationsTable"></div>
                </div>
            `;

            const customStyle = `
                .ra-table-v2 th { font-size: 12px; }
                .ra-table-v2 th, .ra-table-v2 td { text-align: center; border: 1px solid #c4a566; }
                .ra-table-v2 th label, .ra-table-v2 td input[type="checkbox"] { cursor: pointer; }
                .ra-label { display: block; font-weight: 600; margin-bottom: 5px; }
                .ra-input { display: block; width: 100%; height: auto; padding: 5px; font-size: 14px; }
                .ra-chosen-command td { background-color: #ffe563 !important; }
            `;

            twSDK.renderBoxWidget(
                content,
                scriptConfig.scriptData.prefix,
                'ra-mass-snipe',
                customStyle
            );
        }

        // Action Handler: Add new snipe needed
        function handleAddNewSnipeNeeded() {
            jQuery('#raAddNewSnipeNeededBtn').on('click', function (e) {
                e.preventDefault();

                addTableRow();
            });
        }

        // Action Handler: Remove a snipe
        function handleRemoveSnipeNeeded() {
            jQuery('.ra-remove-snipe').on('click', function (e) {
                e.preventDefault();

                jQuery(this).parent().parent().remove();
            });
        }

        // Action Handler: Calculate launch times and find possible snipes
        function handleCalculateTimes() {
            jQuery('#raCalculateTimesBtn').on('click', async function (e) {
                e.preventDefault();

                const { selectedUnits, snipesNeeded } = collectUserInput();
                saveUserInput({ selectedUnits, snipesNeeded });

                const ownVillages = await fetchAllPlayerVillagesByGroup(
                    game_data.group_id
                );
                const troopCounts = await fetchTroopsForCurrentGroup(
                    game_data.group_id
                );

                let possibleSnipes = [];
                let realSnipes = [];

                ownVillages.forEach((village) => {
                    const { id, coords, name } = village;

                    snipesNeeded.forEach((snipeNeeded) => {
                        const { coord, landingTime, sigil, minAmount } =
                            snipeNeeded;
                        const distance = twSDK.calculateDistance(coord, coords);
                        const landingTimeObj = getLandingTime(landingTime);

                        selectedUnits.forEach((unit) => {
                            const launchTime = getLaunchTime(
                                unit,
                                landingTimeObj,
                                distance,
                                sigil
                            );
                            if (
                                launchTime >
                                    twSDK.getServerDateTimeObject().getTime() &&
                                distance > 0
                            ) {
                                const formattedLaunchTime =
                                    twSDK.formatDateTime(launchTime);
                                possibleSnipes.push({
                                    id: id,
                                    name: name,
                                    unit: unit,
                                    fromCoord: coords,
                                    toCoord: coord,
                                    distance: distance,
                                    launchTime: launchTime,
                                    formattedLaunchTime: formattedLaunchTime,
                                    minAmount: minAmount,
                                    landingTime:
                                        twSDK.formatDateTime(landingTimeObj),
                                });
                            }
                        });
                    });
                });

                possibleSnipes.sort((a, b) => {
                    return a.launchTime - b.launchTime;
                });

                possibleSnipes.forEach((snipe) => {
                    const { id, unit, minAmount } = snipe;
                    troopCounts.forEach((villageTroops) => {
                        if (
                            villageTroops.villageId === id &&
                            villageTroops[unit] >= minAmount
                        ) {
                            snipe = {
                                ...snipe,
                                unitAmount: villageTroops[unit],
                            };
                            realSnipes.push(snipe);
                        }
                    });
                });

                if (realSnipes.length) {
                    const snipesTableHtml = buildCombinationsTable(realSnipes);
                    jQuery('#raSnipes').show();
                    jQuery('#raPossibleCombinationsCount').text(
                        realSnipes.length
                    );
                    jQuery('#raPossibleCombinationsTable').html(
                        snipesTableHtml
                    );

                    localStorage.setItem(
                        `${scriptConfig.scriptData.prefix}_snipes`,
                        JSON.stringify(realSnipes)
                    );

                    jQuery(window.TribalWars)
                        .off()
                        .on('global_tick', function () {
                            const remainingTime = jQuery(
                                '#raSnipes .ra-table tbody tr:eq(0) span[data-endtime]'
                            )
                                .text()
                                .trim();
                            if (remainingTime === '0:00:10') {
                                TribalWars.playSound('chat');
                            }
                            document.title =
                                twSDK.tt('Send in') + ' ' + remainingTime;
                        });

                    Timing.tickHandlers.timers.handleTimerEnd = function (e) {
                        jQuery(this).closest('tr').remove();
                    };

                    Timing.tickHandlers.timers.init();
                } else {
                    UI.ErrorMessage(
                        twSDK.tt('No possible snipe options found!')
                    );
                    jQuery('#raSnipes').hide();
                    jQuery('#raPossibleCombinationsCount').text(0);
                    jQuery('#raPossibleCombinationsTable').html('');
                    localStorage.removeItem(
                        `${scriptConfig.scriptData.prefix}_snipes`
                    );
                }
            });
        }

        // Action Handler: Add snipe needed on table from DOM
        function handleAddSnipeNeededFromDOM() {
            // add from "/game.php?screen=info_village&id=XXXX" screen
            jQuery(
                '#commands_outgoings table tbody tr.command-row, #commands_incomings table tbody tr.command-row'
            ).on('click', function () {
                try {
                    jQuery(
                        '#commands_outgoings table tbody tr.command-row'
                    ).removeClass('ra-chosen-command');
                    jQuery(this).addClass('ra-chosen-command');

                    const commandLandingTime = jQuery(this)
                        .find('td:eq(1)')
                        .text()
                        .trim();
                    const landingTime =
                        twSDK.getTimeFromString(commandLandingTime);

                    const [x, y] = window.location.href
                        .split('#')[1]
                        .split(';');

                    addTableRow(`${x}|${y}`, landingTime);
                } catch (error) {
                    UI.ErrorMessage(twSDK.tt('There was an error!'));
                    console.error(`${scriptInfo} Error: `, error);
                }
            });

            // add from "/game.php?screen=overview_villages&mode=incomings" screen
            jQuery('#incomings_table tbody tr').on('click', function (e) {
                e.preventDefault();

                try {
                    jQuery(this).addClass('ra-chosen-command');

                    const destination = jQuery(this)
                        .find('td:eq(1)')
                        .text()
                        .match(twSDK.coordsRegex)[0];
                    const landingTimeString = jQuery(this)
                        .find('td:eq(5)')
                        .text()
                        .trim();
                    const landingTime =
                        twSDK.getTimeFromString(landingTimeString);

                    addTableRow(destination, landingTime);
                } catch (error) {
                    UI.ErrorMessage(twSDK.tt('There was an error!'));
                    console.error(`${scriptInfo} Error: `, error);
                }
            });
        }

        // Action Handler: Mass Import incomings that need to be sniped
        function handleMassImport() {
            jQuery('#raMassImportBtn').on('click', function (e) {
                e.preventDefault();

                const content = `
                    <div class="ra-popup-content">
                        <div class="ra-mb15">
                            <label class="ra-label" for="raMassImportTextarea">${twSDK.tt(
                                'Paste text here from a forum thread'
                            )}</label>
                            <textarea class="ra-textarea" id="raMassImportTextarea"></textarea>
                        </div>
                        <div class="ra-mb15">
                            <a href="javascript:void(0);" id="raMassImportExecuteBtn" class="btn">
                                ${twSDK.tt('Mass Import')}
                            </a>
                        </div>
                    </div>
                `;

                Dialog.show('content', content);

                jQuery('#raMassImportExecuteBtn').on('click', function (e) {
                    e.preventDefault();

                    const text = jQuery('#raMassImportTextarea').val().trim();

                    if (text === '') {
                        UI.ErrorMessage(
                            twSDK.tt('This field can not be empty!')
                        );
                        return;
                    }

                    const parsedData = parseTrains(text);

                    if (parsedData.length) {
                        parsedData.forEach((villageToBeSniped) => {
                            const { destination, snipeNeeded } =
                                villageToBeSniped;
                            snipeNeeded.forEach((landingTime) => {
                                const date = new Date(landingTime);
                                const formattedDate =
                                    twSDK.formatDateTime(date);
                                addTableRow(destination, formattedDate);
                            });
                        });
                    } else {
                        UI.InfoMessage(twSDK.tt('No trains could be found!'));
                    }
                });
            });
        }

        // Action Handler: Export combinations as BB code
        function handleExportBBCode() {
            jQuery('#raExportBBCodeBtn').on('click', function (e) {
                e.preventDefault();

                const snipes =
                    JSON.parse(
                        localStorage.getItem(
                            `${scriptConfig.scriptData.prefix}_snipes`
                        )
                    ) ?? [];

                if (snipes.length) {
                    const bbCodeSnipes = getBBCodeExport(snipes);
                    twSDK.copyToClipboard(bbCodeSnipes);
                    UI.SuccessMessage(twSDK.tt('Copied on clipboard!'));
                } else {
                    UI.ErrorMessage(twSDK.tt('Nothing to export!'));
                }
            });
        }

        // Action Handler: Reset script configuration
        function handleResetScript() {
            jQuery('#raResetScriptBtn').on('click', function (e) {
                e.preventDefault();

                const localStorageKeys = Object.keys(localStorage);
                const sessionStorageKeys = Object.keys(sessionStorage);

                localStorageKeys.forEach((key) => {
                    if (key.startsWith(`${scriptConfig.scriptData.prefix}_`)) {
                        localStorage.removeItem(key);
                    }
                });

                sessionStorageKeys.forEach((key) => {
                    if (key.startsWith(`${scriptConfig.scriptData.prefix}_`)) {
                        sessionStorage.removeItem(key);
                    }
                });

                UI.SuccessMessage(
                    twSDK.tt('Script configuration has been reset!')
                );

                setTimeout(function () {
                    window.location.reload();
                }, 500);
            });
        }

        // Helper: Render Combinations Table
        function buildCombinationsTable(snipes) {
            let combinationsTable = `
                <table class="ra-table ra-table-v2" width="100%">
                    <thead>
                        <tr>
                            <th>
                                #
                            </th>
                            <th class="ra-text-left">
                                ${twSDK.tt('From')}
                            </th>
                            <th class="ra-text-left">
                                ${twSDK.tt('To')}
                            </th>
                            <th>
                                ${twSDK.tt('Unit')}
                            </th>
                            <th class="ra-hide-on-mobile">
                                ${twSDK.tt('Distance')}
                            </th>
                            <th>
                                ${twSDK.tt('Launch Time')}
                            </th>
                            <th>
                                ${twSDK.tt('Send in')}
                            </th>
                            <th>
                                ${twSDK.tt('Send')}
                            </th>
                        </tr>
                    </thead>
                <tbody>
            `;

            const serverTime = twSDK.getServerDateTimeObject().getTime();

            snipes.forEach((snipe, index) => {
                const {
                    id,
                    fromCoord,
                    toCoord,
                    unit,
                    distance,
                    launchTime,
                    formattedLaunchTime,
                    unitAmount,
                } = snipe;
                const [toX, toY] = toCoord.split('|');
                const timeTillLaunch = twSDK.secondsToHms(
                    (launchTime - serverTime) / 1000
                );

                const toCoordData = villages.find(
                    (village) => village[2] + '|' + village[3] === toCoord
                );

                let commandUrl = '';
                if (game_data.player.sitter > 0) {
                    commandUrl = `/game.php?t=${game_data.player.id}&village=${id}&screen=place&x=${toX}&y=${toY}&${unit}=${unitAmount}`;
                } else {
                    commandUrl = `/game.php?village=${id}&screen=place&x=${toX}&y=${toY}&y=${toY}&${unit}=${unitAmount}`;
                }

                combinationsTable += `
                    <tr>
                        <td>
                            ${index + 1}
                        </td>
                        <td class="ra-text-left">
                            <a href="${
                                game_data.link_base_pure
                            }info_village&id=${id}" target="_blank" rel="noopener noreferrer">
                                ${fromCoord}
                            </a>
                        </td>
                        <td>
                            <a href="${
                                game_data.link_base_pure
                            }info_village&id=${
                    toCoordData[0]
                }" target="_blank" rel="noopener noreferrer">
                                ${toCoord}
                            </a>
                        </td>
                        <td>
                            <img src="/graphic/unit/unit_${unit}.png" /> <span class="ra-unit-count">${twSDK.formatAsNumber(
                    unitAmount
                )}</span>
                        </td>
                        <td class="ra-hide-on-mobile">
                            ${parseFloat(distance).toFixed(2)}
                        </td>
                        <td>
                            ${formattedLaunchTime}
                        </td>
                        <td>
                            <span class="timer" data-endtime>${timeTillLaunch}</span>
                        </td>
                        <td>
                            <a href="${commandUrl}" target="_blank" rel="noopener noreferrer" class="btn">
                                ${twSDK.tt('Send')}
                            </a>
                        </td>
                    </tr>
                `;
            });

            combinationsTable += `</tbody></table>`;

            return combinationsTable;
        }

        // Helper: Build the snipes needed table
        function buildSnipesNeededTable(snipesNeeded) {
            let snipesNeededTable = ``;
            let tableRows = ``;

            if (snipesNeeded === null) {
                tableRows += buildSnipeNeededTableRow(
                    game_data.village.coord,
                    new Date().toLocaleString('en-GB').replace(',', ''),
                    0,
                    50
                );
            } else {
                snipesNeeded.forEach((snipeNeeded) => {
                    const { coord, landingTime, sigil, minAmount } =
                        snipeNeeded;
                    tableRows += buildSnipeNeededTableRow(
                        coord,
                        landingTime,
                        sigil,
                        minAmount
                    );
                });
            }

            snipesNeededTable = `
                <table class="ra-table ra-table-v2" width="100%">
                    <thead>
                        <tr>
                            <th width="15%">
                                ${twSDK.tt('Village')}
                            </th>
                            <th width="47%">
                                ${twSDK.tt('Landing Time')}
                            </th>
                            <th width="15%">
                                ${twSDK.tt('Sigil')}
                            </th>
                            <th width="15%">
                                ${twSDK.tt('Min. Amount')}
                            </th>
                            <th width="20%">
                                ${twSDK.tt('Action')}
                            </th>
                        </tr>
                    </thead>
                    <tbody id="raSnipeNeeded">
                        ${tableRows}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="5">
                                <a href="javascript:void(0);" class="btn" id="raAddNewSnipeNeededBtn">
                                    ${twSDK.tt('Add new Snipe')}
                                </a>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            `;

            return snipesNeededTable;
        }

        // Helper: Build a table row on the snipes needed table
        function buildSnipeNeededTableRow(
            coord = '',
            landingTime = '',
            sigil = 0,
            minAmount = 50
        ) {
            return `
                <tr>
                    <td>
                        <input type="text" class="ra-input ra-tac" name="village_coord" value="${coord}" />
                    </td>
                    <td>
                        <input type="text" class="ra-input" name="landing_time" value="${landingTime}" />
                    </td>
                    <td>
                        <input type="text" class="ra-input ra-tac" name="sigil" value="${sigil}" />
                    </td>
                    <td>
                        <input type="text" class="ra-input ra-tac" name="min_amount" value="${minAmount}" />
                    </td>
                    <td class="ra-tac">
                        <a href="javascript:void(0);" class="ra-remove-snipe">
                            <img src="/graphic/forum/thread_delete.png">
                        </a>
                    </td>
                </tr>
            `;
        }

        // Helper: Get BB Code export for snipe attempts
        function getBBCodeExport(snipes) {
            let bbCode = `[table][**]${twSDK.tt('Unit')}[||]${twSDK.tt(
                'From'
            )}[||]${twSDK.tt('To')}[||]${twSDK.tt(
                'Landing Time'
            )}[||]${twSDK.tt('Launch Time')}[||]${twSDK.tt(
                'Command'
            )}[||]${twSDK.tt('Status')}[/**]\n`;

            snipes.forEach((snipe) => {
                const {
                    fromCoord,
                    toCoord,
                    formattedLaunchTime,
                    id,
                    unit,
                    unitAmount,
                    landingTime,
                } = snipe;
                const [toX, toY] = toCoord.split('|');

                let commandUrl = '';

                if (game_data.player.sitter > 0) {
                    commandUrl = `/game.php?t=${game_data.player.id}&village=${id}&screen=place&x=${toX}&y=${toY}&${unit}=${unitAmount}`;
                } else {
                    commandUrl = `/game.php?village=${id}&screen=place&x=${toX}&y=${toY}&${unit}=${unitAmount}`;
                }

                bbCode += `[*][unit]${unit}[/unit] ${twSDK.formatAsNumber(
                    unitAmount
                )}[|] ${fromCoord} [|] ${toCoord} [|] ${landingTime} [|]${formattedLaunchTime}[|][url=${
                    window.location.origin
                }${commandUrl}]${twSDK.tt('Send')}[/url][|]\n`;
            });

            bbCode += `[/table]`;

            return bbCode;
        }

        // Helper: Add snipe needed table row
        function addTableRow(coord, landingTime, sigil, minAmount) {
            const snipesNeeded = collectSnipesNeeded();
            const doesExist = snipesNeeded.filter((item) => {
                return item.coord === coord && item.landingTime === landingTime;
            });

            if (doesExist && doesExist.length === 0) {
                const tableRow = buildSnipeNeededTableRow(
                    coord,
                    landingTime,
                    sigil,
                    minAmount
                );
                jQuery('#raSnipeNeeded').append(tableRow);
                handleRemoveSnipeNeeded();
            } else {
                UI.InfoMessage(twSDK.tt('Already exists!'));
            }
        }

        // Helper: Get landing time date object
        function getLandingTime(landingTime) {
            const [landingDay, landingHour] = landingTime.split(' ');
            const [day, month, year] = landingDay.split('/');
            const [hours, minutes, seconds, milliseconds] =
                landingHour.split(':');
            const landingHourFormatted = `${hours}:${minutes}:${seconds}`;
            const landingTimeFormatted =
                year + '-' + month + '-' + day + ' ' + landingHourFormatted;
            const landingTimeObject = new Date(landingTimeFormatted);
            return landingTimeObject;
        }

        // Helper: Get launch time of command
        function getLaunchTime(unit, landingTime, distance, sigil) {
            const msPerSec = 1000;
            const secsPerMin = 60;
            const msPerMin = msPerSec * secsPerMin;
            const sigilRatio = 1 + sigil / 100;

            const unitSpeed = worldUnitInfo.config[unit].speed;
            const unitTime = (distance * unitSpeed * msPerMin) / sigilRatio;

            const launchTime = new Date();
            launchTime.setTime(
                Math.round((landingTime - unitTime) / msPerSec) * msPerSec
            );

            return launchTime.getTime();
        }

        // Helper: Parse train info from selected text
        function parseTrains(selectedText) {
            try {
                let foundSnipesNeeded = [];
                let villagesToBeSniped = selectedText.split(
                    twSDK.tt('Village:')
                );

                if (villagesToBeSniped.length > 1) {
                    villagesToBeSniped = villagesToBeSniped.filter(
                        (item) => item !== ''
                    );

                    villagesToBeSniped.forEach((villageToBeSniped) => {
                        const snipeNeeded = [];
                        const destination = villageToBeSniped.match(
                            twSDK.coordsRegex
                        )[0];
                        let linesOfText = villageToBeSniped.split('\n');

                        linesOfText = linesOfText.filter((line) => line !== '');
                        linesOfText = linesOfText.filter((line) => {
                            return (
                                line.includes(twSDK.tt('Noble')) ||
                                line.includes(twSDK.tt('Village:'))
                            );
                        });

                        linesOfText = linesOfText.map((line) => line.trim());

                        if (linesOfText && linesOfText.length) {
                            Object.values(linesOfText).forEach((row) => {
                                if (row.includes(twSDK.tt('Noble'))) {
                                    let landingTime = '';
                                    landingTime = row
                                        .split(twSDK.tt('Arrival time:'))[1]
                                        .match(twSDK.dateTimeMatch)[0];

                                    if (
                                        landingTime !== '' &&
                                        new Date(landingTime).getTime() >
                                            twSDK
                                                .getServerDateTimeObject()
                                                .getTime()
                                    ) {
                                        snipeNeeded.push(landingTime);
                                    }
                                }
                            });
                        }

                        foundSnipesNeeded.push({
                            destination: destination,
                            snipeNeeded: snipeNeeded,
                        });
                    });

                    foundSnipesNeeded = foundSnipesNeeded.filter(
                        (item) => item.snipeNeeded.length > 0
                    );
                }

                return foundSnipesNeeded;
            } catch (error) {
                UI.ErrorMessage(
                    twSDK.tt('There has been an error while parsing the text!')
                );
                console.error(`${scriptInfo} Error: `, error);
            }
        }

        // Helper: Get the default field values on script load time
        function initDefaultValues() {
            const selectedUnits =
                JSON.parse(
                    localStorage.getItem(
                        `${scriptConfig.scriptData.prefix}_chosen_units`
                    )
                ) ?? DEFAULT_VALUES.SELECTED_UNITS;

            const snipesNeeded =
                JSON.parse(
                    sessionStorage.getItem(
                        `${scriptConfig.scriptData.prefix}_snipes_needed`
                    )
                ) ?? null;

            return { selectedUnits, snipesNeeded };
        }

        // Helper: Collect user input
        function collectUserInput() {
            const selectedUnits = collectSelectedUnits();
            const snipesNeeded = collectSnipesNeeded();

            return { selectedUnits, snipesNeeded };
        }

        // Helper: Collect selected units
        function collectSelectedUnits() {
            const selectedUnits = [];

            jQuery('.ra-unit-selector').each(function () {
                if (jQuery(this).is(':checked')) {
                    selectedUnits.push(this.value);
                }
            });

            return selectedUnits;
        }

        // Helper: Collect snipes needed
        function collectSnipesNeeded() {
            const snipesNeeded = [];

            jQuery('#raSnipeNeeded > tr').each(function () {
                const villageCoord = jQuery(this)
                    .find('td input[name="village_coord"]')
                    .val();
                const landingTime = jQuery(this)
                    .find('td input[name="landing_time"]')
                    .val();
                const sigil = jQuery(this).find('td input[name="sigil"]').val();
                const minAmount = jQuery(this)
                    .find('td input[name="min_amount"]')
                    .val();

                snipesNeeded.push({
                    coord: villageCoord,
                    landingTime: landingTime,
                    sigil: parseInt(sigil),
                    minAmount: parseInt(minAmount),
                });
            });

            return snipesNeeded;
        }

        // Helper: Save user input in memory
        function saveUserInput(userInput) {
            const { selectedUnits, snipesNeeded } = userInput;

            if (selectedUnits.length) {
                localStorage.setItem(
                    `${scriptConfig.scriptData.prefix}_chosen_units`,
                    JSON.stringify(selectedUnits)
                );
            }

            if (snipesNeeded.length) {
                sessionStorage.setItem(
                    `${scriptConfig.scriptData.prefix}_snipes_needed`,
                    JSON.stringify(snipesNeeded)
                );
            }
        }

        // Helper: Fetch home troop counts for current group
        async function fetchTroopsForCurrentGroup(groupId) {
            const mobileCheck = $('#mobileHeader').length > 0;
            const troopsForGroup = await jQuery
                .get(
                    game_data.link_base_pure +
                        `overview_villages&mode=combined&group=${groupId}&page=-1`
                )
                .then(async (response) => {
                    const htmlDoc = jQuery.parseHTML(response);
                    const homeTroops = [];

                    if (mobileCheck) {
                        let table = jQuery(htmlDoc).find(
                            '#combined_table tr.nowrap'
                        );
                        for (let i = 0; i < table.length; i++) {
                            let objTroops = {};
                            let villageId = parseInt(
                                table[i]
                                    .getElementsByClassName('quickedit-vn')[0]
                                    .getAttribute('data-id')
                            );
                            let listTroops = Array.from(
                                table[i].getElementsByTagName('img')
                            )
                                .filter((e) => e.src.includes('unit'))
                                .map((e) => ({
                                    name: e.src
                                        .split('unit_')[1]
                                        .replace('@2x.png', ''),
                                    value: parseInt(
                                        e.parentElement.nextElementSibling
                                            .innerText
                                    ),
                                }));
                            listTroops.forEach((item) => {
                                objTroops[item.name] = item.value;
                            });

                            objTroops.villageId = villageId;

                            homeTroops.push(objTroops);
                        }
                    } else {
                        const combinedTableRows = jQuery(htmlDoc).find(
                            '#combined_table tr.nowrap'
                        );
                        const combinedTableHead = jQuery(htmlDoc).find(
                            '#combined_table tr:eq(0) th'
                        );

                        const combinedTableHeader = [];

                        // collect possible buildings and troop types
                        jQuery(combinedTableHead).each(function () {
                            const thImage = jQuery(this)
                                .find('img')
                                .attr('src');
                            if (thImage) {
                                let thImageFilename = thImage.split('/').pop();
                                thImageFilename = thImageFilename.replace(
                                    '.png',
                                    ''
                                );
                                combinedTableHeader.push(thImageFilename);
                            } else {
                                combinedTableHeader.push(null);
                            }
                        });

                        // collect possible troop types
                        combinedTableRows.each(function () {
                            let rowTroops = {};

                            combinedTableHeader.forEach(
                                (tableHeader, index) => {
                                    if (tableHeader) {
                                        if (tableHeader.includes('unit_')) {
                                            const villageId = jQuery(this)
                                                .find(
                                                    'td:eq(1) span.quickedit-vn'
                                                )
                                                .attr('data-id');
                                            const unitType =
                                                tableHeader.replace(
                                                    'unit_',
                                                    ''
                                                );
                                            rowTroops = {
                                                ...rowTroops,
                                                villageId: parseInt(villageId),
                                                [unitType]: parseInt(
                                                    jQuery(this)
                                                        .find(`td:eq(${index})`)
                                                        .text()
                                                ),
                                            };
                                        }
                                    }
                                }
                            );

                            homeTroops.push(rowTroops);
                        });
                    }

                    return homeTroops;
                })
                .catch((error) => {
                    UI.ErrorMessage(
                        tt('An error occured while fetching troop counts!')
                    );
                    console.error(`${scriptInfo()} Error:`, error);
                });

            return troopsForGroup;
        }

        // Helper: Fetch player villages by group
        async function fetchAllPlayerVillagesByGroup(groupId) {
            try {
                let fetchVillagesUrl = '';
                if (game_data.player.sitter > 0) {
                    fetchVillagesUrl =
                        game_data.link_base_pure +
                        `groups&ajax=load_villages_from_group&t=${game_data.player.id}`;
                } else {
                    fetchVillagesUrl =
                        game_data.link_base_pure +
                        'groups&ajax=load_villages_from_group';
                }
                const villagesByGroup = await jQuery
                    .post({
                        url: fetchVillagesUrl,
                        data: { group_id: groupId },
                        dataType: 'json',
                        headers: { 'TribalWars-Ajax': 1 },
                    })
                    .then(({ response }) => {
                        const parser = new DOMParser();
                        const htmlDoc = parser.parseFromString(
                            response.html,
                            'text/html'
                        );
                        const tableRows = jQuery(htmlDoc)
                            .find('#group_table > tbody > tr')
                            .not(':eq(0)');

                        if (tableRows.length) {
                            let villagesList = [];

                            tableRows.each(function () {
                                const villageId =
                                    jQuery(this)
                                        .find('td:eq(0) a')
                                        .attr('data-village-id') ??
                                    jQuery(this)
                                        .find('td:eq(0) a')
                                        .attr('href')
                                        .match(/\d+/)[0];
                                const villageName = jQuery(this)
                                    .find('td:eq(0)')
                                    .text()
                                    .trim();
                                const villageCoords = jQuery(this)
                                    .find('td:eq(1)')
                                    .text()
                                    .trim();

                                villagesList.push({
                                    id: parseInt(villageId),
                                    name: villageName,
                                    coords: villageCoords,
                                });
                            });

                            return villagesList;
                        } else {
                            return [];
                        }
                    });

                return villagesByGroup;
            } catch (error) {
                UI.ErrorMessage(
                    twSDK.tt('There was an error fetching villages by group!')
                );
                console.error(`${scriptInfo} Error:`, error);
            }
        }

        // Service: Fetch world config and needed data
        async function fetchWorldConfigData() {
            try {
                const worldUnitInfo = await twSDK.getWorldUnitInfo();
                const villages = await twSDK.worldDataAPI('village');
                return { villages, worldUnitInfo };
            } catch (error) {
                UI.ErrorMessage(
                    twSDK.tt('There was an error while fetching the data!')
                );
                console.error(`${scriptInfo} Error:`, error);
            }
        }
    }
);