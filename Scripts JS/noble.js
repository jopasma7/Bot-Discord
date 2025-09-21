/*
 * Script Name: Discord Support Tool
 * Version: v1.0.7
 * Last Updated: 2022-11-08
 * Author: RedAlert
 * Author URL: https://twscripts.dev/
 * Author Contact: redalert_tw (Discord)
 * Approved: N/A
 * Approved Date: 2022-07-04
 * Mod: JawJaw
 */

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;
if (typeof config !== 'object') config = null;



// Script Config
var scriptConfig = {
    scriptData: {
        prefix: 'discordSupportTool',
        name: 'Discord Support Tool',
        version: 'v1.0.7',
        author: 'RedAlert',
        authorUrl: 'https://twscripts.dev/',
        helpLink:
            'https://forum.tribalwars.net/index.php?threads/discord-support-tool.289204/',
    },
    translations: {
        es_ES: {
            'Discord Support Tool': 'Herramienta de Apoyo de Discord',
            Help: 'Ayuda',
            'Village:': 'Pueblo:',
            'Wall level:': 'Nivel de Muralla:',
            'Loyalty:': 'Lealtad:',
            'Defender:': 'Defensor:',
            Noble: 'Noble',
            'Extracted Data': 'Datos extraídos',
            'Send to Discord': 'Envíar a Discord',
            Reset: 'Reiniciar',
            'Invalid input!': '¡Entrada no válida!',
            'This script can only be run on an in-game forum thread!':
                'Este script solamente puede ser ejecutado en el foro de la tribu.',
            'Selected text does not follow the required format!':
                'El texto seleccionado no cumple el formato requerido.',
            'There was an error!': '¡Ha ocurrido un error!',
            'There was an error fetching village info!':
                'Ocurrió un problema al obtener la información del pueblo.',
            'You need to provide a configuration to run this script!':
                'Necesitas proporcionar una configuración para ejecutar este script.',
            'Sigil of Distress': 'Mejora de Apoyo',
            Flag: 'Bandera',
            Sigil: 'Sigilo',
            'Wall Level': 'Nivel de Muralla',
            Loyalty: 'Lealtad',
            'Defending Troops': 'Tropas Defensoras',
            'Script is not allowed to be used on this TW market!':
                'Este script no está disponible en el servidor!',
            'No noble incomings found on the selected incomings!':
                'No hay nobles entrantes en los ataques seleccionados.',
            'Inc. Support:': 'Ap. Entrante:',
            'Incoming Support': 'Apoyo Entrante',
        },
        en_DK: {
            'Discord Support Tool': 'Discord Support Tool',
            Help: 'Help',
            'Village:': 'Village:',
            'Wall level:': 'Wall level:',
            'Loyalty:': 'Loyalty:',
            'Defender:': 'Defender:',
            Noble: 'Noble',
            'Extracted Data': 'Extracted Data',
            'Send to Discord': 'Send to Discord',
            Reset: 'Reset',
            'Invalid input!': 'Invalid input!',
            'This script can only be run on an in-game forum thread!':
                'This script can only be run on an in-game forum thread!',
            'Selected text does not follow the required format!':
                'Selected text does not follow the required format!',
            'There was an error!': 'There was an error!',
            'There was an error fetching village info!':
                'There was an error fetching village info!',
            'You need to provide a configuration to run this script!':
                'You need to provide a configuration to run this script!',
            'Sigil of Distress': 'Sigil of Distress',
            Flag: 'Flag',
            Sigil: 'Sigil',
            'Wall Level': 'Wall level',
            Loyalty: 'Loyalty',
            'Defending Troops': 'Defending Troops',
            'Script is not allowed to be used on this TW market!':
                'Script is not allowed to be used on this TW market!',
            'No noble incomings found on the selected incomings!':
                'No noble incomings found on the selected incomings!',
            'Inc. Support:': 'Inc. Support:',
            'Incoming Support': 'Incoming Support',
        },
        fr_FR: {
            'Discord Support Tool': 'Discord - Outil soutien',
            Help: 'Aide',
            'Village:': 'Village:',
            'Wall level:': 'Niveau mur:',
            'Loyalty:': 'Loyaute:',
            'Defender:': 'Defenseur:',
            Noble: 'Noble',
            'Extracted Data': 'Donnee extraites',
            'Send to Discord': 'Envoyer vers Discord',
            Reset: 'Reinitialiser',
            'Invalid input!': 'Entree invalide!',
            'This script can only be run on an in-game forum thread!':
                'Ce script ne peut etre lance que sur un post du forum !',
            'Selected text does not follow the required format!':
                'Texte selectionne au mauvais format',
            'There was an error!': 'Oupsi il y a eu une erreur!',
            'There was an error fetching village info!':
                'Une erreur s est produite lors de la recuperation des informations sur le village !',
            'You need to provide a configuration to run this script!':
                'Vous devez fournir une configuration pour executer ce script !',
            'Sigil of Distress': 'Signal de detresse',
            Flag: 'Drapeau',
            Sigil: 'Signal',
            'Wall Level': 'Niveau mur',
            Loyalty: 'Loyaute',
            'Defending Troops': 'Troupes en defense',
            'Script is not allowed to be used on this TW market!':
                'Script non autorise sur ce serveur!',
            'No noble incomings found on the selected incomings!':
                'Aucun noble entrant sur les ordres arrivants',
            'Inc. Support:': 'Soutiens entr.:',
            'Incoming Support': 'Soutiens entrants',
        },
    },
    allowedMarkets: ['es', 'en', 'us', 'fr'],
    allowedScreens: ['forum'],
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
        const isValidScreen = twSDK.checkValidLocation('screen');
        const isValidMarket = twSDK.checkValidMarket();
        const threadId = twSDK.getParameterByName('thread_id');

        const { villages } = await fetchWorldData();

        // Check if we are on a valid market
        if (!isValidMarket) {
            UI.ErrorMessage(
                twSDK.tt('Script is not allowed to be used on this TW market!')
            );
            return;
        }

        // Check if a configuration has been provided to the script
        if (config === null) {
            UI.ErrorMessage(
                twSDK.tt(
                    'You need to provide a configuration to run this script!'
                )
            );
            return;
        }

        // Entry point
        if (isValidScreen && threadId) {
            try {
                //build the user interface
                buildUI();

                // text select listener
                handleOnTextSelect();

                // handle user actions
                handleSendToDiscord();
                handleReset();
            } catch (error) {
                UI.ErrorMessage(twSDK.tt('There was an error!'));
                console.error(`${scriptInfo} Error:`, error);
            }
        } else {
            UI.ErrorMessage(
                twSDK.tt(
                    'This script can only be run on an in-game forum thread!'
                )
            );
        }

        // Render: Build the user interface
        function buildUI() {
            const content = `
                <div class="ra-mb15">
                    <table class="ra-table ra-table-v2" width="100%">
                        <tbody>
                            <tr>
                                <td width="25%">
                                    <b>${twSDK.tt('Village:')}</b>
                                </td>
                                <td id="raVillageInfo"></td>
                            </tr>
                            <tr>
                                <td width="25%">
                                    <b>${twSDK.tt('Wall level:')}</b>
                                </td>
                                <td id="raWallLevel"></td>
                            </tr>
                            <tr>
                                <td width="25%">
                                    <b>${twSDK.tt('Loyalty:')}</b>
                                </td>
                                <td id="raLoyalty"></td>
                            </tr>
                            <tr>
                                <td width="25%">
                                    <b>${twSDK.tt('Defender:')}</b>
                                </td>
                                <td id="raDefender"></td>
                            </tr>
                            <tr>
                                <td width="25%">
                                    <b>${twSDK.tt('Inc. Support:')}</b>
                                </td>
                                <td id="raIncomingSupport"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="ra-mb15">
                    <label class="ra-label" for="raSelectedText">${twSDK.tt(
                        'Extracted Data'
                    )}</label>
                    <textarea class="ra-textarea" id="raSelectedText"></textarea>
                </div>
                <div class="ra-mb15">
                    <a href="javascript:void(0);" id="raSendToDiscord" class="btn btn-disabled" data-village="">
                        ${twSDK.tt('Send to Discord')}
                    </a>
                    <a href="javascript:void(0);" id="raResetBtn" class="btn" data-village="">
                        ${twSDK.tt('Reset')}
                    </a>
                </div>
            `;

            const customStyle = `
                .ra-label { font-weight: bold; margin-bottom: 6px; display: block; }
            `;

            twSDK.renderFixedWidget(
                content,
                'raDiscordSupportTool',
                'ra-discord-support-tool',
                customStyle
            );
        }

        // Event Handler: On text select event listener
        function handleOnTextSelect() {
            jQuery('.text').mouseup(async function (event) {
                var selectedText = getSelectedText();
                if (selectedText !== '') {
                    if (
                        selectedText.includes(
                            twSDK.tt('Village:'),
                            twSDK.tt('Noble')
                        )
                    ) {
                        const villageUnderAttack =
                            getVillageUnderAttack(selectedText);
                        const trainInfo = parseTrainInfo(selectedText);
                        const { wallLevel, loyalty, defendingTroops } =
                            parseVillageInfo(selectedText);
                        const [id, name, x, y] = villageUnderAttack;
                        const incomingSupport = await fetchIncomingSupport(id);

                        const villageName = `${name} (${x}|${y})`;
                        const villageLink = `/game.php?screen=info_village&id=${id}`;

                        let defendingTroopsHtml = '';
                        if (defendingTroops) {
                            defendingTroops.forEach((item) => {
                                const { unit, amountHome } = item;
                                defendingTroopsHtml += `${amountHome} ${unit}, `;
                            });
                        }

                        let incomingTroopsHtml = '';
                        if (incomingSupport) {
                            incomingSupport.forEach((item) => {
                                const { unit, amount } = item;
                                if (parseInt(amount) > 0) {
                                    incomingTroopsHtml += `${amount} ${unit}, `;
                                }
                            });
                        }

                        jQuery('#raSelectedText').val(trainInfo);
                        jQuery('#raSendToDiscord').removeClass('btn-disabled');
                        jQuery('#raSendToDiscord').attr(
                            'data-village',
                            JSON.stringify(villageUnderAttack)
                        );
                        jQuery('#raVillageInfo').html(`
                        <a href="${villageLink}" target="_blank" rel="noreferrer nofollow noopener">
                            ${villageName}
                        </a>
                    `);
                        jQuery('#raWallLevel').text(wallLevel || 'N/A');
                        jQuery('#raLoyalty').text(loyalty || 'N/A');
                        jQuery('#raDefender').text(
                            defendingTroopsHtml || 'N/A'
                        );
                        jQuery('#raIncomingSupport').text(
                            incomingTroopsHtml || 'N/A'
                        );

                        if (
                            wallLevel === undefined &&
                            loyalty === undefined &&
                            defendingTroops === undefined
                        ) {
                            jQuery('#raResetBtn').trigger('click');
                        }
                    } else {
                        jQuery('#raResetBtn').trigger('click');
                        UI.ErrorMessage(
                            twSDK.tt(
                                'Selected text does not follow the required format!'
                            )
                        );
                    }
                }
            });
        }

        // Action Handler: Send support request details on Discord
        function handleSendToDiscord() {
            jQuery('#raSendToDiscord').on('click', async function (e) {
                e.preventDefault();

                const supportText = jQuery('#raSelectedText').val();
                const villageData = JSON.parse(
                    jQuery(this).attr('data-village')
                );

                const [id, name, x, y] = villageData;
                const villageName = `${name} (${x}|${y})`;
                const villageLink = `${window.location.origin}/game.php?screen=info_village&id=${id}`;

                if (supportText !== '' && id !== '') {
                    const villageEffects = await fetchVillageEffects(id);

                    const supportTextWithNoblesHighlighted = replaceGlobally(
                        supportText,
                        twSDK.tt('Noble'),
                        `***${twSDK.tt('Noble')}***`
                    );

                    const { author, name, version } = scriptConfig.scriptData;
                    let messageContent = `@everyone [${game_data.world}] - **${game_data.player.name}**`;

                    // prepare body
                    /*
                    https://discord.com/developers/docs/resources/webhook
                    https://discord.com/developers/docs/resources/channel#embed-object-embed-limits
                    */
                    const body = {
                        username: `[${game_data.world}] - ${
                            config.username || twSDK.tt('Discord Support Tool')
                        }`,
                        avatar_url:
                            config.avatar ||
                            'https://twscripts.dev/scripts/tribal-wars-icon.png',
                        content: messageContent,
                        embeds: [
                            {
                                color: config.colorCode || 12690020,
                                timestamp: new Date(),
                                title: villageName.substring(0, 256),
                                url: villageLink,
                                description:
                                    '```yaml\n' +
                                    supportTextWithNoblesHighlighted +
                                    '```'.substring(0, 4096),
                                fields: [
                                    {
                                        name: twSDK.tt('Wall Level'),
                                        value:
                                            jQuery('#raWallLevel')
                                                .text()
                                                .trim() ?? 'N/A',
                                        inline: false,
                                    },
                                    {
                                        name: twSDK.tt('Loyalty'),
                                        value:
                                            jQuery('#raLoyalty')
                                                .text()
                                                .trim() ?? 'N/A',
                                        inline: false,
                                    },
                                    {
                                        name: twSDK.tt('Sigil'),
                                        value:
                                            `${villageEffects.sigil}%` ?? 'N/A',
                                        inline: false,
                                    },
                                    {
                                        name: twSDK.tt('Flag'),
                                        value: villageEffects.flag ?? 'N/A',
                                        inline: false,
                                    },
                                    {
                                        name: twSDK.tt('Defending Troops'),
                                        value:
                                            jQuery('#raDefender')
                                                .text()
                                                .trim() ?? 'N/A',
                                        inline: false,
                                    },
                                    {
                                        name: twSDK.tt('Incoming Support'),
                                        value:
                                            jQuery('#raIncomingSupport')
                                                .text()
                                                .trim() ?? 'N/A',
                                        inline: false,
                                    },
                                ],
                                footer: {
                                    text: `${name} ${version} - ${author}`,
                                    icon_url:
                                        'https://twscripts.dev/scripts/tribal-wars-icon.png',
                                },
                            },
                        ],
                        allowed_mentions: {
                            parse: ['everyone', 'roles', 'users'],
                        },
                    };

                    // send the data to discord
                    sendData(config.webhookURL, body);

                    // reset the data after being sent
                    setTimeout(function () {
                        jQuery('#raResetBtn').trigger('click');
                    }, 500);
                } else {
                    UI.ErrorMessage(twSDK.tt('Invalid input!'));
                }
            });
        }

        // Action Handler: Reset form with data to be sent to Discord
        function handleReset() {
            jQuery('#raResetBtn').on('click', function (e) {
                e.preventDefault();

                jQuery('#raSelectedText').val('');
                jQuery('#raSendToDiscord').addClass('btn-disabled');
                jQuery('#raSendToDiscord').attr('data-village', '');
                jQuery('#raVillageInfo').html('');
                jQuery('#raWallLevel').text('');
                jQuery('#raLoyalty').text('');
                jQuery('#raDefender').text('');
                jQuery('#raIncomingSupport').text('');

                window.getSelection().removeAllRanges();
            });
        }

        // Service: Send data to Discord
        function sendData(url, body) {
            return $.ajax({
                url: url,
                async: false,
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(body),
            });
        }

        // Helper: Fetch village info
        async function fetchVillageEffects(villageId) {
            try {
                const villageEffects = await jQuery
                    .get(`/game.php?village=${villageId}&screen=overview`)
                    .then((response) => {
                        const parser = new DOMParser();
                        const htmlDoc = parser.parseFromString(
                            response,
                            'text/html'
                        );

                        const tableRows = jQuery(htmlDoc).find(
                            '#show_effects .widget_content .village_overview_effect'
                        );

                        if (tableRows.length) {
                            let effects = {
                                sigil: 0,
                                flag: null,
                            };

                            tableRows.each(function () {
                                let dataTitle = jQuery(this)
                                    .attr('title')
                                    ?.trim();
                                let tdText = jQuery(this).text()?.trim();

                                if (dataTitle) {
                                    if (
                                        tdText.includes(
                                            twSDK.tt('Sigil of Distress')
                                        )
                                    ) {
                                        dataTitle = dataTitle.split('<i>')[1];
                                        dataTitle = dataTitle.split('</i>')[0];
                                        dataTitle = dataTitle.split(' ');
                                        dataTitle = dataTitle
                                            .map((item) => parseInt(item))
                                            .filter((item) => item >= 0);
                                        effects = {
                                            ...effects,
                                            sigil: dataTitle[0],
                                        };
                                    }
                                } else {
                                    effects = {
                                        ...effects,
                                        flag: tdText,
                                    };
                                }
                            });

                            return effects;
                        } else {
                            return {};
                        }
                    });

                return villageEffects;
            } catch (error) {
                UI.ErrorMessage(
                    twSDK.tt('There was an error fetching village info!')
                );
                console.error(`${scriptInfo} Error: `, error);
            }
        }

        // Helper: Get selected text value
        function getSelectedText() {
            if (window.getSelection) {
                return window.getSelection().toString();
            } else if (document.selection) {
                return document.selection.createRange().text;
            }
            return '';
        }

        // Helper: Parse train info from selected text
        function parseTrainInfo(selectedText) {
            if (!selectedText.includes(twSDK.tt('Noble'))) {
                return '';
            } else {
                let linesOfText = selectedText.split('\n');

                linesOfText = linesOfText.filter((line) => line !== ''); // remove empty lines
                linesOfText = linesOfText.filter(
                    (line) => !line.includes(twSDK.tt('Village:'))
                ); // remove village info
                linesOfText = linesOfText.filter(
                    (line) => !line.includes(twSDK.tt('Wall level:'))
                ); // remove wall level info
                linesOfText = linesOfText.filter(
                    (line) => !line.includes(twSDK.tt('Loyalty:'))
                ); // remove loyalty info
                linesOfText = linesOfText.filter(
                    (line) => !line.includes(twSDK.tt('Defender:'))
                ); // remove defender info

                linesOfText = linesOfText.map((line) => line.trim());

                if (linesOfText && linesOfText.length) {
                    return linesOfText.join('\n');
                } else {
                    return '';
                }
            }
        }

        // Helper: Parse village info from selected text
        function parseVillageInfo(selectedText) {
            if (!selectedText.includes(twSDK.tt('Noble'))) {
                UI.ErrorMessage(
                    twSDK.tt(
                        'No noble incomings found on the selected incomings!'
                    )
                );
                return {};
            } else {
                let linesOfText = selectedText.split('\n');

                linesOfText = linesOfText.filter((line) => line !== ''); // remove empty lines

                linesOfText = linesOfText.filter(
                    (line) =>
                        line.includes(twSDK.tt('Wall level:')) ||
                        line.includes(twSDK.tt('Loyalty:')) ||
                        line.includes(twSDK.tt('Defender:'))
                );

                let villageInfo = {
                    wallLevel: '',
                    loyalty: '',
                    defendingTroops: [],
                };

                linesOfText.map((item) => {
                    if (item.includes(twSDK.tt('Wall level:'))) {
                        villageInfo.wallLevel = parseInt(
                            item.replace(twSDK.tt('Wall level:'), '')
                        );
                    } else if (item.includes(twSDK.tt('Loyalty:'))) {
                        villageInfo.loyalty = parseInt(
                            item.replace(twSDK.tt('Loyalty:'), '')
                        );
                    } else if (item.includes(twSDK.tt('Defender:'))) {
                        let defenderTroops = item.split(' ');
                        defenderTroops = defenderTroops
                            .map((item) => parseInt(item))
                            .filter((item) => item >= 0);

                        const defendingTroops = [];
                        game_data.units.forEach((unit, index) => {
                            if (parseInt(defenderTroops[index]) !== 0) {
                                defendingTroops.push({
                                    unit: [unit],
                                    amountHome: defenderTroops[index],
                                });
                            }
                        });

                        villageInfo = {
                            ...villageInfo,
                            defendingTroops: defendingTroops,
                        };
                    }
                });

                return villageInfo;
            }
        }

        // Helper: Get village under attack from selected text
        function getVillageUnderAttack(selectedText) {
            const linesOfText = selectedText.split('\n');
            const villageCoordinate = linesOfText[0].match(
                twSDK.coordsRegex
            )[0]; // returns 111|222

            const villageUnderAttack = villages.filter((village) => {
                const villageCoord = village[2] + '|' + village[3];
                return villageCoord === villageCoordinate;
            })[0];

            return villageUnderAttack;
        }

        // Helper: Globally replace a string within a string
        function replaceGlobally(original, searchTxt, replaceTxt) {
            const regex = new RegExp(searchTxt, 'g');
            return original.replace(regex, replaceTxt);
        }

        // Fetch incomings information for village
        async function fetchIncomingSupport(villageId) {
            try {
                const response = await jQuery.get(
                    `/game.php?village=${villageId}&screen=place&mode=call&target=${villageId}`
                );
                const htmlDoc = jQuery.parseHTML(response);
                const troopsRows = jQuery(htmlDoc).find(
                    '#support_sum tbody tr'
                );

                const troopsInVillage = [];
                game_data.units.forEach((unit) => {
                    troopsRows.each(function () {
                        const unitAmount = jQuery(this)
                            .find(`td[data-unit="${unit}"]`)
                            .text()
                            .trim();
                        if (unitAmount) {
                            troopsInVillage.push({
                                unit: unit,
                                amount: parseInt(unitAmount),
                            });
                        }
                    });
                });

                return troopsInVillage;
            } catch (error) {
                UI.ErrorMessage(
                    twSDK.tt(
                        'There was an error fetching incomings information!'
                    )
                );
                console.error(`${scriptInfo} Error: `, error);
            }
        }

        // Helper: Fetch all required world data
        async function fetchWorldData() {
            try {
                const villages = await twSDK.worldDataAPI('village');
                return { villages };
            } catch (error) {
                UI.ErrorMessage(error);
                console.error(`${scriptInfo} Error:`, error);
            }
        }
    }
);