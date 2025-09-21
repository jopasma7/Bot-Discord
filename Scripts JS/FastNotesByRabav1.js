var scriptData = {
	name: 'Fast Notes',
	version: 'v5.1',
    editor: 'Rabagalan73',
};

if (typeof DEBUG !== 'boolean') DEBUG = false;

var allowedScreens = ['report', 'info_command'];

var translations = {
    es_ES: {
		Title: 'Establece notas rápidas',
		Help: 'Ayuda',
		Added: 'Has añadido la nota correctamente.',
		CantAdded: 'No puedes agregar este informe a una nota rápida.',
		Link: 'Enlace al Informe',
		BadUsage: 'Este script se ejecuta desde un informe.',
		NoNotes: 'No se ha encontrado ninguna nota para este pueblo.',
	    NeedPremium: 'Para ejecutar este Script necesitas una cuenta Premium.',
        NotDefensor: 'No se puede analizar las tropas del defensor porque no existen o no se ven.',
        NotAtacante: 'No se puede analizar las tropas del atacante porque no existen o no se ven.',
        note: {
            player: "•[b] Jugador ➢[/b] [player]%player%[/player]",
            village: "•[b] Pueblo ➢[/b] %type%",
            features: "[b][color=#2e2eb9] ★ [u]Características[/u] ★[/color][/b]",
            militia: "[color=#00a500][b]✔[/b][/color] %amount% Milicia [unit]militia[/unit]",
            wall: {
                yes: "[color=#00a500][b]✔[/b][/color] Nivel %level% de Muralla [building]wall[/building]",
                no: "[color=#ff0000][b]✘[/b][/color] Sin Muralla [building]wall[/building]"
            },
            paladin: {
                yes: "[color=#00a500][b]✔[/b][/color] Paladín [unit]knight[/unit]",
                no: "[color=#ff0000][b]✘[/b][/color] Sin Paladín [unit]knight[/unit]",
            }
        },
        deff: "[color=#00a5a5][b]Posible Defensivo[/b][/color]",
        off: '[color=#ff6363][b]Posible Ofensivo[/b][/color]',
        mixto: '[color=#558d55][b]Posible Mixto o Apoyos[/b][/color]',
        unknown: '[color=#ff55ff][b]Imposible Identificar[/b][/color]',
        empty: '[color=#ff55ff][b]Pueblo Vacío[/b][/color]',
	},
};

win = window;
win.FastNotes ={
	tableAtacante: null,
	tableDefensor: null,
	tableSpy: null,
	outsideOFF: 0,
	insideOFF: 0,
	outsideDEFF: 0,
	totalDEFF: 0,
	totalOFF: 0,
    paladin: false,
    wall: false,
    wall_level: 0,
    militia: false,
    militia_amount: 0
}

initDebug();

function sendAlertMess(){
	UI.ErrorMessage('Especificar y analizar al <button class="btn" onclick="sendAtacante()">Pueblo Atacante</button> o <button class="btn" onclick="sendDefensor()">Pueblo Defensor</button>', 10000);
}

function sendAtacante() {

    if($('table#attack_info_att_units')[0] == undefined){
        UI.ErrorMessage(tt('NotAtacante'),2000);
        return;
    }

	win.FastNotes.tableAtacante = $('table#attack_info_att_units')[0];
	const atacantePlayerName = $('table#attack_info_att')[0].rows[0].cells[1].textContent;

	if (atacantePlayerName !== '---') {
		if (atacantePlayerName == game_data.player.name) {
			villageId = $('table#attack_info_def')[0]
				.rows[1].cells[1].getElementsByTagName('span')[0]
				.getAttribute('data-id');
		} else {
			villageId = $('table#attack_info_att')[0]
				.rows[1].cells[1].getElementsByTagName('span')[0]
				.getAttribute('data-id');
		}
		
		if(win.FastNotes.tableAtacante.rows[0].cells.length == 13){
			// Arqueros
			calcArcher(win.FastNotes.tableAtacante);
		}else{
			calc(win.FastNotes.tableAtacante);
		}
		

		if(win.FastNotes.insideOFF > 400 && win.FastNotes.totalDEFF > 400) typeVillage= tt('mixto');
		else if(win.FastNotes.insideOFF > 400) typeVillage= tt('off');
		else if(win.FastNotes.totalDEFF > win.FastNotes.totalOFF) typeVillage= tt('deff');
		else if(win.FastNotes.totalOFF > win.FastNotes.totalDEFF) typeVillage= tt('off');
		else if(win.FastNotes.totalOFF == 0 && win.FastNotes.totalDEFF == 0) typeVillage= tt('empty');
		else typeVillage= tt('unknown');	
	

   		noteText = tt('note').player.replace("%player%", atacantePlayerName) + '\n';
   		noteText += tt('note').village.replace("%type%", typeVillage) + '\n';
    	noteText += '\n' + $('#report_export_code')[0].innerHTML.replace("[spoiler]", "[spoiler=Informe]");

		TribalWars.post('info_village',{ ajaxaction: 'edit_notes', id: villageId, },{note: noteText,},function () { UI.SuccessMessage(tt('Added'), 2000); });
	} else {
		UI.ErrorMessage(tt('CantAdded'), 2000);
	}

}

function checkWall(){    
    if(document.getElementById("attack_results") != null){
        var x = document.getElementById("attack_results");
        if(x.getElementsByTagName("tbody")[0] != undefined){
            if(x.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[1] != undefined){
				var arr = x.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
				for(var i =0 ; arr.length>i ; i++){
					var elem = x.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[i];
					if(elem.getElementsByTagName("th")[0].textContent === "Daños por arietes:"){
						var text = x.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[i].getElementsByTagName("td")[0].textContent;
						var split = text.replace(".","").split(" ");
						win.FastNotes.wall = true;
                		win.FastNotes.wall_level = parseInt(split[split.length-1], 10);
                    	console.log("Nivel de Muralla (Daño por ariete): "+ win.FastNotes.wall_level);
					}else if(elem.getElementsByTagName("th")[0].textContent === "Daño por catapultas:"){
						var text = x.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[i].getElementsByTagName("td")[0].textContent;
						if(text.includes("Muralla")){
							var split = text.replace(".","").split(" ");
							win.FastNotes.wall = true;
							win.FastNotes.wall_level = parseInt(split[split.length-1], 10);
							console.log("Nivel de Muralla (Daño por Catapulta): "+ win.FastNotes.wall_level);
						}	
					}
				}
            }  
        }       
    }

    

    if(document.getElementById("attack_spy_away") != null && win.FastNotes.wall == false){
        win.FastNotes.tableSpy = document.getElementById("attack_spy_away").getElementsByClassName("vis")[0];
        var t = document.getElementById("attack_spy_buildings_right")
        var array = t.getElementsByTagName("tr");
        for(var i = 0 ; array.length>i ; i++){
            if(array[i].getElementsByTagName("td")[0] != undefined){
                if(array[i].getElementsByTagName("td")[0].getElementsByTagName("span")[0] != undefined){
                    if(array[i].getElementsByTagName("td")[0].getElementsByTagName("span")[0].textContent === "Muralla"){
                        win.FastNotes.wall_level = parseInt(array[i].getElementsByTagName("td")[1].textContent, 10);
                        win.FastNotes.wall = true;
                        console.log("Wall "+win.FastNotes.wall_level+ " set!");
                    }        
                }
            }  
        } 
    }    
}

function sendDefensor() {
    if($('table#attack_info_def_units')[0] == undefined){
        UI.ErrorMessage(tt('NotDefensor'),2000);
        return;
    }

	if(document.getElementById("attack_spy_away") != null){
		win.FastNotes.tableSpy = document.getElementById("attack_spy_away").getElementsByClassName("vis")[0];
	}

    checkWall();
	win.FastNotes.tableDefensor = $('table#attack_info_def_units')[0];

	const defenderPlayerName = $('table#attack_info_def')[0].rows[0].cells[1].textContent;

	if (defenderPlayerName !== '---') {

		if (defenderPlayerName == game_data.player.name) {
			villageId = $('table#attack_info_att')[0]
				.rows[1].cells[1].getElementsByTagName('span')[0]
				.getAttribute('data-id');
		} else {
			villageId = $('table#attack_info_def')[0]
				.rows[1].cells[1].getElementsByTagName('span')[0]
				.getAttribute('data-id');
		}
	
	
		if(win.FastNotes.tableDefensor.rows[0].cells.length == 14) calcArcher(win.FastNotes.tableDefensor);
		else calc(win.FastNotes.tableDefensor);
		

		if(win.FastNotes.tableSpy != null){
			if(win.FastNotes.tableDefensor.rows[0].cells.length == 14) calcSpyArcher();
			else calcSpyTable();	
			
			if(win.FastNotes.outsideOFF > 200 && win.FastNotes.outsideDEFF > 200) typeVillage= tt('mixto');
			else if(win.FastNotes.outsideOFF > 400) typeVillage= tt('off');
			else if(win.FastNotes.insideOFF > 400 && win.FastNotes.totalDEFF > 400) typeVillage= tt('mixto');
			else if(win.FastNotes.insideOFF > 400) typeVillage= tt('off');
			else if(win.FastNotes.outsideDEFF > 400) typeVillage= tt('deff');
			else if(win.FastNotes.totalDEFF > win.FastNotes.totalOFF) typeVillage= tt('deff');
			else if(win.FastNotes.totalOFF > win.FastNotes.totalDEFF) typeVillage= tt('off');
			else if(win.FastNotes.totalOFF == 0 && win.FastNotes.totalDEFF == 0) typeVillage= tt('empty');	
			else typeVillage= tt('unknown');	

		}else{

			if(win.FastNotes.insideOFF > 400 && win.FastNotes.totalDEFF > 400) typeVillage= tt('mixto');
			else if(win.FastNotes.insideOFF > 400) typeVillage= tt('off');
			else if(win.FastNotes.totalDEFF > win.FastNotes.totalOFF) typeVillage= tt('deff');
			else if(win.FastNotes.totalOFF > win.FastNotes.totalDEFF) typeVillage= tt('off');
			else if(win.FastNotes.totalOFF == 0 && win.FastNotes.totalDEFF == 0) typeVillage= tt('empty');
			else typeVillage= tt('unknown');	
		}

    	noteText = tt('note').player.replace("%player%", defenderPlayerName) + '\n';
    	noteText += tt('note').village.replace("%type%", typeVillage) + '\n';
    
    	// Features if have someone!
    	noteText += '\n' + tt('note').features;
    	if(win.FastNotes.militia){
        noteText += '\n' + tt('note').militia.replace("%amount%", win.FastNotes.militia_amount);
    	}
    	if(win.FastNotes.wall){
        	noteText += '\n' + tt('note').wall.yes.replace("%level%",win.FastNotes.wall_level);
    	}else noteText += '\n' + tt('note').wall.no;
    

    	if(win.FastNotes.paladin){
     	   noteText += '\n' + tt('note').paladin.yes + "\n";
    	}else noteText += '\n' + tt('note').paladin.no + "\n";

   		noteText += '\n' + $('#report_export_code')[0].innerHTML.replace("[spoiler]", "[spoiler=Informe]");
		TribalWars.post('info_village',{ ajaxaction: 'edit_notes', id: villageId, },{note: noteText,},function () { UI.SuccessMessage(tt('Added'), 2000); });
	} else {
		UI.ErrorMessage(tt('CantAdded'), 2000);
	}

}

function initSetVillageNote() { 
	sendAlertMess();		
}

function calc(table) {
	var alive_pal = 0;var death_pal = 0;var alive_militia = 0;var death_militia = 0;
	for (var i = 0, row; row = table.rows[i]; i++) {
        if(i == 1){
            for (var j = 0, colum; colum = row.cells[j]; j++) {
				// DEFF : 1-2-6
				if(j == 1 || j == 2 || j == 6) {
					win.FastNotes.totalDEFF += parseInt(row.cells[j].textContent, 10);
				// OFF : 3-5-7
				}else if(j == 3 || j == 5 || j == 7) {
					win.FastNotes.insideOFF += parseInt(row.cells[j].textContent, 10);
					win.FastNotes.totalOFF += parseInt(row.cells[j].textContent, 10);
				}else if(j == 9) {
					alive_pal = parseInt(row.cells[j].textContent, 10);
                    
                }else if(j == 11) {
					alive_militia = parseInt(row.cells[j].textContent, 10);
                    win.FastNotes.militia_amount = parseInt(row.cells[j].textContent, 10);
                    if(win.FastNotes.militia_amount > 0) win.FastNotes.militia = true;
                }                
            }
        }else if(i == 2){
			for (var j = 0, colum; colum = row.cells[j]; j++) {
				if(j == 9){
					death_pal = parseInt(row.cells[j].textContent, 10);
				}else if(j == 11) {
					death_militia = parseInt(row.cells[j].textContent, 10);
                } 	
			}
		}           
    }

	if(alive_pal - death_pal != 0){
		win.FastNotes.paladin = true;
	}

	if(alive_militia - death_militia > 0){
		win.FastNotes.militia_amount = (alive_militia - death_militia);
    	win.FastNotes.militia = true;
	}
}

function calcArcher(table) {
	var alive_pal = 0;var death_pal = 0;var alive_militia = 0;var death_militia = 0;
	for (var i = 0, row; row = table.rows[i]; i++) {
        if(i == 1){
            for (var j = 0, colum; colum = row.cells[j]; j++) {
				// DEFF : 1-2-4-8
				if(j == 1 ||  j == 2 || j == 4 || j == 8) {
					win.FastNotes.totalDEFF += parseInt(row.cells[j].textContent, 10);
				// OFF : 3-6-7-9
				}else if(j == 3 || j == 6 || j == 7 || j == 9 ) {
					win.FastNotes.insideOFF += parseInt(row.cells[j].textContent, 10);
					win.FastNotes.totalOFF += parseInt(row.cells[j].textContent, 10);
				}else if(j == 11) {
					alive_pal = parseInt(row.cells[j].textContent, 10);
                    
                }else if(j == 13) {
					alive_militia = parseInt(row.cells[j].textContent, 10);
                    win.FastNotes.militia_amount = parseInt(row.cells[j].textContent, 10);
                    if(win.FastNotes.militia_amount > 0) win.FastNotes.militia = true;
                }                
            }
        }else if(i == 2){
			for (var j = 0, colum; colum = row.cells[j]; j++) {
				if(j == 11){
					death_pal = parseInt(row.cells[j].textContent, 10);
				}else if(j == 13) {
					death_militia = parseInt(row.cells[j].textContent, 10);
                } 	
			}
		}           
    }

	if(alive_pal - death_pal != 0){
		win.FastNotes.paladin = true;
	}

	if(alive_militia - death_militia > 0){
		win.FastNotes.militia_amount = (alive_militia - death_militia);
    	win.FastNotes.militia = true;
	}
}

function calcSpyArcher() {
	for (var i = 0, row; row = win.FastNotes.tableSpy.rows[i]; i++) {
		if(i == 1){
			for (var j = 0, colum; colum = row.cells[j]; j++) {
				// DEFF : 0-1-3-7
				if(j == 0 || j == 1 || j == 3 || j == 7) {
					win.FastNotes.outsideDEFF += parseInt(row.cells[j].textContent, 10);
					win.FastNotes.totalDEFF += parseInt(row.cells[j].textContent, 10);
				// OFF : 2-4-6
				}else if(j == 2 || j == 5 || j == 6|| j == 8) {
					win.FastNotes.outsideOFF += parseInt(row.cells[j].textContent, 10);
					win.FastNotes.totalOFF += parseInt(row.cells[j].textContent, 10);
				}else if(j == 10) {
					var paladin = row.cells[j].textContent;
					if(paladin === '1'){
						win.FastNotes.paladin = true;
					}                    
                }
			}
		}           
	}
}

function calcSpyTable(){
	for (var i = 0, row; row = win.FastNotes.tableSpy.rows[i]; i++) {
		if(i == 1){
			for (var j = 0, colum; colum = row.cells[j]; j++) {
				// DEFF : 0-1-5
				if(j == 0 || j == 1 || j == 5) {
					win.FastNotes.outsideDEFF += parseInt(row.cells[j].textContent, 10);
					win.FastNotes.totalDEFF += parseInt(row.cells[j].textContent, 10);
				// OFF : 2-4-6
				}else if(j == 2 || j == 4 || j == 6) {
					win.FastNotes.outsideOFF += parseInt(row.cells[j].textContent, 10);
					win.FastNotes.totalOFF += parseInt(row.cells[j].textContent, 10);
				}else if(j == 8) {
					var paladin = row.cells[j].textContent;
					if(paladin === '1'){
						win.FastNotes.paladin = true;
					}                    
                }
			}
		}           
	}	
}

function initGetVillageNote() {
	$.get($('.village_anchor').first().find('a').first().attr('href'), function (html) {
		const note = jQuery(html).find('#own_village_note .village-note');
		if (note.length > 0) {
			const noteContent = `
                <div id="ra-village-notes" class="vis">
                    <div class="ra-village-notes-header">
                        <h3>${tt(scriptData.name)}</h3>
                    </div>
                    <div class="ra-village-notes-body">
                        ${note[0].children[1].innerHTML}
                    </div>
                    <div class="ra-village-notes-footer">
                        <small>
                            <strong>
                                ${tt(scriptData.name)} ${scriptData.version}
                            </strong> -
                            <a href="${scriptData.authorUrl}" target="_blank" rel="noreferrer noopener">
                                ${scriptData.author}
                            </a> -
                            <a href="${scriptData.helpLink}" target="_blank" rel="noreferrer noopener">
                                ${tt('Help')}
                            </a>
                        </small>
                    </div>
                </div>
                <style>
                    #ra-village-notes { position: relative; display: block; width: 100%; height: auto; clear: both; margin: 15px auto; padding: 10px; box-sizing: border-box; }
                    .ra-village-notes-footer { margin-top: 15px; }
                </style>
            `;
			jQuery('#content_value table:eq(0)').after(noteContent);
		}
	});
}

function getParameterByName(name, url = window.location.href) {
	return new URL(url).searchParams.get(name);
}

function scriptInfo() {
	return `[${scriptData.name} ${scriptData.version}]`;
}

function initDebug() {
	console.debug(`${scriptInfo()} It works ðŸš€!`);
	if (DEBUG) {
		console.debug(`${scriptInfo()} World:`, game_data.world);
		console.debug(`${scriptInfo()} Screen:`, game_data.screen);
		console.debug(`${scriptInfo()} Game Version:`, game_data.majorVersion);
		console.debug(`${scriptInfo()} Game Build:`, game_data.version);
		console.debug(`${scriptInfo()} Locale:`, game_data.locale);
		console.debug(`${scriptInfo()} Premium:`, game_data.features.Premium.active);
	}
}

function tt(string) {
	var gameLocale = game_data.locale;

	if (translations[gameLocale] !== undefined) {
		return translations[gameLocale][string];
	} else {
		return translations['es_ES'][string];
	}
}

(function () {
	const gameScreen = getParameterByName('screen');
	const gameView = getParameterByName('view');
	const commandId = getParameterByName('id');

	if (game_data.features.Premium.active) {
		if (allowedScreens.includes(gameScreen)) {
			if (gameScreen === 'report' && gameView !== null) {
				initSetVillageNote();
			} else if (gameScreen === 'info_command' && commandId !== null) {
				initGetVillageNote();
			} else UI.ErrorMessage(tt('BadUsage'),2000);
		} else UI.ErrorMessage(tt('BadUsage'),2000);
	} else UI.ErrorMessage(tt('NeedPremium'));	
})();