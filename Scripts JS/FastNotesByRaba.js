/*
// Especifica que acción hacer después de colocar la nota: "eliminar", "siguiente"
note_added = {
	mode: "eliminar"
}

// Especifica las algunas características dispones en el modo de "Eliminar Nota" y "Siguiente Nota".
// Estas opciones solo se activan cuando el modo "note_added" está seleccionado.
delete_options = {
	confirm_msg: true // Envía un mensaje de confirmación para eliminar.
}

next_options = {
	delay: {
		enable: true,
		cooldown: 1000, // Añade un tiempo de espera de 1 segundo antes de pasar a la siguiente.
	}
}

// Especifica el modo de empleo del script a la hora de guardar las notas: defensor, atacante, mixto.
// Las mayúsculas no son detectadas. Escribir correctamente.
village_options = { 
	mode: 'mixto'
}

*/


/************************/

/*     Script Raba      */
/*    Versión 5.6      */

/************************/


var scriptData = {
	name: 'Fast Notes',
	version: 'v5.6',
    editor: 'Rabagalan73',
};

// Revisar error si es un informe pero no es un informe de ataque.

if (typeof DEBUG !== 'boolean') DEBUG = false;

var allowedScreens = ['report', 'info_command'];

var translations = {
    es_ES: {
		Title: 'Establece notas rápidas',
		Help: 'Ayuda',
		Added: 'Has añadido la nota correctamente.',
		CantAdded: 'No puedes agregar este informe a una nota rápida.',
		CantInspect: 'No se puede analizar las tropas porque no has detectado ninguna.',
		ComingSoon: 'Imposible agregar... Próximamente ^^',
		OwnVillage: 'No puedes agregar este informe a la nota del pueblo porque el pueblo te pertenece.',
		Link: 'Enlace al Informe',
		BadUsage: 'Este script se ejecuta desde un informe de ataque o defensa.',
		AlertMessage: 'Especificar y analizar al %attacker% o %defender%',
		NoNotes: 'No se ha encontrado ninguna nota para este pueblo.',
	    NeedPremium: 'Para ejecutar este Script necesitas una cuenta Premium.',
        NotDefensor: 'No se puede analizar las tropas del defensor porque no existen o no se ven.',
        NotAtacante: 'No se puede analizar las tropas del atacante porque no existen o no se ven.',
        deff: "[color=#00a5a5][b]Posible Defensivo[/b][/color]",
		deff_blindado: '[color=#00a5a5][b]Posible Defensivo Blindado[/b][/color]',
        off: '[color=#ff6363][b]Posible Ofensivo[/b][/color]',
		off_blindado: '[color=#ff6363][b]Posible Ofensivo Blindado[/b][/color]',
		spy: '[color=#333363][b]Pueblo con Espías[/b][/color]',
		deff_chance: '[color=#1f6363][b]Alta Probabilidad de Defensivo[/b][/color]',
        mixto: '[color=#558d55][b]Posible Mixto o Apoyos[/b][/color]',
        unknown: '[color=#ff55ff][b]Imposible Identificar[/b][/color]',
		barbarian: '[color=#ff55ff][b]Pueblo Abandonado[/b][/color]',
        empty: '[color=#ff55ff][b]Pueblo Vacío[/b][/color]',
		note: {
            player: "•[b] Jugador ➢[/b] [player]%player%[/player]",
            village: "•[b] Pueblo ➢[/b] %type%",
			points: "•[b] Puntos ➢[/b] %points%",
            features: "[b][color=#2e2eb9] ★ [u]Características[/u] ★[/color][/b]",
			time: "•[b] Hora de batalla ➢[/b] [color=#0000ff][b]%time%[/b][/color]",
            militia: "[color=#00a500][b]✔[/b][/color] %amount% Milicia [unit]militia[/unit]",
            wall: {
                yes: "[color=#00a500][b]✔[/b][/color] Nivel %level% de Muralla [building]wall[/building]",
                no: "[color=#ff0000][b]✘[/b][/color] Sin Muralla [building]wall[/building]"
            },
			iglesia: {
				yes: "[color=#00a500][b]✔[/b][/color] Iglesia lvl.%level%  [building]church_f[/building]",
				no: "[color=#ff0000][b]✘[/b][/color] Sin Iglesia [building]church_f[/building]"
			},
			torre: {
				yes: "[color=#00a500][b]✔[/b][/color] Torre lvl.%level% [building]watchtower[/building]",
				no: "[color=#ff0000][b]✘[/b][/color] Sin Torre [building]watchtower[/building]"
			},
            knight: "[color=#00a500][b]✔[/b][/color] Paladín [unit]knight[/unit]",
			snob: "[color=#00a500][b]✔[/b][/color] Noble [unit]snob[/unit]",
			knightsnob: "[color=#00a500][b]✔[/b][/color] Noble + Paladín [unit]knight[/unit][unit]snob[/unit]"
        },
	},
};

win = window;
win.FastNotes ={
	table: null,
	units: {
		spear: 0, sword: 0, axe: 0, archer: 0, 
		spy: 0, light_cavalry: 0, archer_cavalry: 0, heavy_cavalry: 0, 
		ram: 0, catapult: 0, 
		snob: 0, knight: 0, militia: 0,
		snob_alive: false,
		knight_alive: false,
		militia_alive: false
	},
	spy_units: {
		spear: 0, sword: 0, axe: 0, archer: 0, 
		spy: 0, light_cavalry: 0, archer_cavalry: 0, heavy_cavalry: 0, 
		ram: 0, catapult: 0, 
		snob: 0, knight: 0, militia: 0
	},
	wall: {
		build: false,
    	level: 0,
	},
	iglesia: {
		build: false,
    	level: 0,
	},
	torre: {
		build: false,
    	level: 0,
	}
}


//////////////////////////////////
//          MAIN CODE           //
//////////////////////////////////

// Checks if scripts is running without bugs! 
initDebug();

// Start script and run opperations.
function initSetVillageNote() { 

	// Check if is a valid Report
	if($('table#attack_info_att')[0] == undefined && $('table#attack_info_def')[0] == undefined){
		UI.ErrorMessage(tt('BadUsage'), 2000);
		return;
	}

	// Check if your are the player defender / atackker!
	const atackkerPlName = $('table#attack_info_att')[0].rows[0].cells[1].textContent;
	const defenderPlName = $('table#attack_info_def')[0].rows[0].cells[1].textContent;

	/*/ Check if defender player is null...
	if(defenderPlName == '---'){
		// Barbarian village or player removed village!!
		var playerName = table.rows[0].cells[1].getElementsByTagName('a')[0].textContent; // Get the PlayerName
		createNote(playerName, tt('barbarian'), autodetected);
		return;
	}*/

	// Check if you are the attacker and the defender player!! (If you auto-attack one of your own villages for example).
	if(game_data.player.name == atackkerPlName && game_data.player.name == defenderPlName){
		UI.ErrorMessage(tt('OwnVillage'), 2000);
		return;
	}

	// Check if you are the attacker or defender!!
	if(game_data.player.name == atackkerPlName) {
		spyValues(); // Get Spy Values 
		getInfo();
		inspectVillage($("table#attack_info_def")[0], "Pueblo defensor detectado ya que eres el atacante. "); 
		return;
	}
	if(game_data.player.name == defenderPlName) {inspectVillage($('table#attack_info_att')[0], "Pueblo atacante detectado ya que eres el defensor. "); return;}

	// If you aren't ataccker or defender... Send Alert!
	if (typeof village_options !== 'undefined') {
		// Get the mode for the specific player!
		var mode = village_options.mode.toLowerCase();
		if(mode == "mixto"){
			sendAlertMess();	
		}else if(mode == "defensor"){
			spyValues();
			getInfo(); 
			inspectVillage($("table#attack_info_def")[0], "Modo único de pueblo defensor. ");
		}else if(mode == "atacante"){
			inspectVillage($('table#attack_info_att')[0], "Modo único de pueblo atacante. "); 
		}else{
			UI.ErrorMessage("Tienes que seleccionar un modo correcto: Defensor, Atacante, Mixto", 2000);
		}
		return;
	}
	sendAlertMess();	
		
}





// Display a alert message to select where the note will be stored: 'Defender Player Village' or 'Attacker Player Village'!
// This alert will be displayed when you are neither the attacker nor the deffender player.
function sendAlertMess(){
	var msg = tt('AlertMessage')
	.replace("%attacker%",'<button class="btn" onclick="inspectVillage(false)">Pueblo Atacante</button>')
	.replace("%defender%",'<button class="btn" onclick="inspectVillage(true)">Pueblo Defensor</button>');
	UI.ErrorMessage(msg, 10000);
}

// Player Village Inspector
function inspectVillage(table, autodetected){

	// Check if table is undefined.
	// If yes. We can't inspect this table because we can't see any troops / units.
	if(table == undefined){ UI.ErrorMessage(tt('CantInspect'),2000); return; }

	//console.log(table);

	if(table == false) { table = $('table#attack_info_att')[0]; autodetected = "Pueblo atacante seleccionado. " }
	if(table == true) { 
		table = $('table#attack_info_def')[0]; autodetected = "Pueblo defensor seleccionado. "; 
		getInfo(); 
		spyValues(); // Get Spy Values 
	} 

	// Addicional info
	// --> Muralla
	// --> Paladín
	// --> Milicia
	// --> Espionaje -->> Solo interesa si analizas el pueblo defensor!!

	win.FastNotes.table = table; // Save in Script the Table when we are working!
	villageId = table.rows[1].cells[1].getElementsByTagName('span')[0].getAttribute('data-id'); // Village unique ID

	var target_village = table.querySelectorAll('.village_anchor');
	var dom_target_village = getSourceAsDOM(target_village[0].getElementsByTagName('a')[0].href);
	var content_value = dom_target_village.getElementById("content_value");
	var points = content_value.getElementsByTagName('table')[1].getElementsByTagName('td')[4].textContent;

	var playerName = table.rows[0].cells[1].textContent;
	if(playerName == '---') playerName = "Pueblo de bárbaros"
	else table.rows[0].cells[1].getElementsByTagName('a')[0].textContent; // Get the PlayerName
	
	// In the case of don't see any units / troops
	if(table.rows[2].getElementsByTagName('table')[0] == undefined){
		createNote(playerName, tt('unknown'), points, autodetected);
		return;
	}
	var units = table.rows[2].getElementsByTagName('table')[0]; // Units Table
	getValues(units); // Get Values

	calc(playerName,points,autodetected);
}

//////////////////////////////////
//          CALCULATORS         //
//////////////////////////////////

// Funt to calc units!
function getValues(units){
	// Get all values!!
	win.FastNotes.units.spear = parseInt(units.rows[1].getElementsByClassName("unit-item-spear")[0].textContent);
	win.FastNotes.units.sword = parseInt(units.rows[1].getElementsByClassName("unit-item-sword")[0].textContent);
	win.FastNotes.units.axe = parseInt(units.rows[1].getElementsByClassName("unit-item-axe")[0].textContent);
	win.FastNotes.units.spy = parseInt(units.rows[1].getElementsByClassName("unit-item-spy")[0].textContent);
	win.FastNotes.units.light_cavalry = parseInt(units.rows[1].getElementsByClassName("unit-item-light")[0].textContent);
	win.FastNotes.units.heavy_cavalry = parseInt(units.rows[1].getElementsByClassName("unit-item-heavy")[0].textContent);
	win.FastNotes.units.ram = parseInt(units.rows[1].getElementsByClassName("unit-item-ram")[0].textContent);
	win.FastNotes.units.catapult = parseInt(units.rows[1].getElementsByClassName("unit-item-catapult")[0].textContent);
	win.FastNotes.units.snob = parseInt(units.rows[1].getElementsByClassName("unit-item-snob")[0].textContent);
	if(win.FastNotes.units.snob - parseInt(units.rows[2].getElementsByClassName("unit-item-snob")[0].textContent) > 0) {
		win.FastNotes.units.snob_alive = true;
	}
	// Check if world have Archers!
	try{
	win.FastNotes.units.archer = parseInt(units.rows[1].getElementsByClassName("unit-item-archer")[0].textContent);
	win.FastNotes.units.archer_cavalry = parseInt(units.rows[1].getElementsByClassName("unit-item-marcher")[0].textContent);
	}catch(ex){ console.log("This world don't have archers!"); }

	// Check if world have Knight!!
	try{ 
		win.FastNotes.units.knight = parseInt(units.rows[1].getElementsByClassName("unit-item-knight")[0].textContent); 
		if(win.FastNotes.units.knight - parseInt(units.rows[2].getElementsByClassName("unit-item-knight")[0].textContent) > 0) {
			win.FastNotes.units.knight_alive = true;
		}
	}catch(ex){ console.log("This world don't have knight!"); }

	try{ win.FastNotes.units.militia = parseInt(units.rows[1].getElementsByClassName("unit-item-militia")[0].textContent);
		if(win.FastNotes.units.militia - parseInt(units.rows[2].getElementsByClassName("unit-item-militia")[0].textContent) > 0) {
		win.FastNotes.units.militia_alive = true;
		}
	}catch(ex){ console.log("No militia"); }
}

function builds(table){
	for(var i = 0, row; row = table.rows[i]; i++){
		if(row.cells[0].textContent.includes("Muralla")){
			win.FastNotes.wall.level = parseInt(row.cells[1].textContent);
			win.FastNotes.wall.build = true;
		}
		if(row.cells[0].textContent.includes("Iglesia")){
			win.FastNotes.iglesia.level = parseInt(row.cells[1].textContent);
			win.FastNotes.iglesia.build = true;
		}
		if(row.cells[0].textContent.includes("Torre")){
			win.FastNotes.torre.level = parseInt(row.cells[1].textContent);
			win.FastNotes.torre.build = true;
		}
	}
}

function getInfo(){

	// Wall info
	atack_results_table = $('table#attack_results')[0];
	buildings = $('table#attack_spy_buildings_left')[0];
	
	// Tabla donde aparece el daño por arietes / lealtad / etc.
	if(atack_results_table !== undefined){
		for(var i = 0, row; row = atack_results_table.rows[i]; i++){
			if(row.cells[0].textContent.includes("Daños por arietes")) win.FastNotes.wall.build = true; 
		}
	}

	// Tabla donde aparecen los edificios. (Espionaje)
	if(buildings !== undefined){
		var build_left = $('table#attack_spy_buildings_left')[0];
		var build_right = $('table#attack_spy_buildings_right')[0];
		
		builds(build_left);
		builds(build_right);

	}else{
		table = $('table#attack_results')[0];
		if(table !== undefined){
			for (var i = 0, row; row = table.rows[i]; i++) {
				if(row.cells[1] != null){
					if(row.cells[1].textContent.includes('Muralla')){
						var text = row.cells[1].textContent;
						var split = text.replace(".","").split(" ");
						win.FastNotes.wall.build = true;
						win.FastNotes.wall.level = parseInt(split[split.length-1], 10);
					}
					if(row.cells[0].textContent.includes("Iglesia")){
						var text = row.cells[1].textContent;
						var split = text.replace(".","").split(" ");
						win.FastNotes.iglesia.level = parseInt(split[split.length-1], 10);
						win.FastNotes.iglesia.build = true;
					}
					if(row.cells[0].textContent.includes("Torre")){
						var text = row.cells[1].textContent;
						var split = text.replace(".","").split(" ");
						win.FastNotes.torre.level = parseInt(split[split.length-1], 10);
						win.FastNotes.torre.build = true;
					}
				}
			 }
		}
	}	
	//console.log("Wall Active: "+ win.FastNotes.wall.build + " Level: "+win.FastNotes.wall.level);
}

function calc(playerName,points,autodetected){
	var minValue = 500; var maxValue = 20000;

	// OFF -->> Axe - Light_Cavalry - Archer_Cavalry - Ram
	// DEFF -->> Spear - Sword - Archer - Heavy_Cavalry
	var off = win.FastNotes.units.axe + win.FastNotes.units.light_cavalry + win.FastNotes.units.archer_cavalry + win.FastNotes.units.ram
		+ win.FastNotes.spy_units.axe + win.FastNotes.spy_units.light_cavalry + win.FastNotes.spy_units.archer_cavalry + win.FastNotes.spy_units.ram
	var deff = win.FastNotes.units.spear + win.FastNotes.units.sword + win.FastNotes.units.archer + win.FastNotes.units.heavy_cavalry
		+ win.FastNotes.spy_units.spear + win.FastNotes.spy_units.sword + win.FastNotes.spy_units.archer + win.FastNotes.spy_units.heavy_cavalry;

	var off_fuera = win.FastNotes.spy_units.axe + win.FastNotes.spy_units.light_cavalry + win.FastNotes.spy_units.archer_cavalry + win.FastNotes.spy_units.ram;
	var deff_fuera = win.FastNotes.spy_units.spear + win.FastNotes.spy_units.sword + win.FastNotes.spy_units.archer + win.FastNotes.spy_units.heavy_cavalry;

	var todo = win.FastNotes.units.spear + win.FastNotes.units.sword + win.FastNotes.units.axe + win.FastNotes.units.archer 
		+ win.FastNotes.units.spy + win.FastNotes.units.light_cavalry + win.FastNotes.units.archer_cavalry + win.FastNotes.units.heavy_cavalry
		+ win.FastNotes.units.ram + win.FastNotes.units.catapult;
	// Mixto -->> off >= 500 deff >= 500
	// Espias -->> off < 500 deff < 500 espías > 100
	// OFF -->> off >= 500
    // DEFF -->> deff >= 500
	// DEFF -->> deff > off
	// OFF -->> off > deff	

	// > 500 cases
	if(off_fuera >= minValue) typeVillage= tt('off');
	else if(deff_fuera >= minValue) typeVillage= tt('deff');
	else if((win.FastNotes.units.ram + win.FastNotes.units.spy) == todo || (win.FastNotes.units.catapult + win.FastNotes.units.spy) == todo) typeVillage= tt('deff_chance');
	else if(off >= minValue && deff >= maxValue) typeVillage= tt('off_blindado'); 
	else if(off >= minValue && deff >= minValue) typeVillage= tt('mixto'); 
	else if(off >= minValue) typeVillage= tt('off');
	else if(off < minValue && deff >= maxValue) typeVillage= tt('deff_blindado'); 
	else if(deff >= minValue) typeVillage= tt('deff');

	// < 500 cases
	else if(deff > off) typeVillage= tt('deff');
	else if(off > deff) typeVillage= tt('off');
	else if(off < minValue && deff < minValue && win.FastNotes.units.spy >=100) typeVillage= tt('spy');
	else if(off == 0 && deff == 0) typeVillage= tt('empty');
	else typeVillage= tt('unknown');
	
	console.log("OFF: "+off+ " DEFF: "+deff);
	console.log("OFF FUERA: "+off_fuera+ " DEFF FUERA: "+deff_fuera);

	createNote(playerName, typeVillage, points, autodetected);
}

function spyValues(){
	// Get all values!!
	console.log("Spy Values");
	units = $('table#attack_spy_away')[0];
	if(units !== undefined){
		win.FastNotes.spy_units.spear = parseInt(units.rows[1].getElementsByTagName("table")[0].rows[1].getElementsByClassName("unit-item-spear")[0].textContent);
		win.FastNotes.spy_units.sword = parseInt(units.rows[1].getElementsByTagName("table")[0].rows[1].getElementsByClassName("unit-item-sword")[0].textContent);
		win.FastNotes.spy_units.axe = parseInt(units.rows[1].getElementsByTagName("table")[0].rows[1].getElementsByClassName("unit-item-axe")[0].textContent);
		win.FastNotes.spy_units.spy = parseInt(units.rows[1].getElementsByTagName("table")[0].rows[1].getElementsByClassName("unit-item-spy")[0].textContent);
		win.FastNotes.spy_units.light_cavalry = parseInt(units.rows[1].getElementsByTagName("table")[0].rows[1].getElementsByClassName("unit-item-light")[0].textContent);
		win.FastNotes.spy_units.heavy_cavalry = parseInt(units.rows[1].getElementsByTagName("table")[0].rows[1].getElementsByClassName("unit-item-heavy")[0].textContent);
		win.FastNotes.spy_units.ram = parseInt(units.rows[1].getElementsByTagName("table")[0].rows[1].getElementsByClassName("unit-item-ram")[0].textContent);
		win.FastNotes.spy_units.catapult = parseInt(units.rows[1].getElementsByTagName("table")[0].rows[1].getElementsByClassName("unit-item-catapult")[0].textContent);
		win.FastNotes.spy_units.snob = parseInt(units.rows[1].getElementsByTagName("table")[0].rows[1].getElementsByClassName("unit-item-snob")[0].textContent);
		if(win.FastNotes.spy_units.snob > 0) {
			win.FastNotes.units.snob_alive = true;
		}
		// Check if world have Archers!
		try{
		win.FastNotes.spy_units.archer = parseInt(units.rows[1].getElementsByTagName("table")[0].rows[1].getElementsByClassName("unit-item-archer")[0].textContent);
		win.FastNotes.spy_units.archer_cavalry = parseInt(units.rows[1].getElementsByTagName("table")[0].rows[1].getElementsByClassName("unit-item-marcher")[0].textContent);
		}catch(ex){}

		// Check if world have Knight!!
		try{ 
			win.FastNotes.spy_units.knight = parseInt(units.rows[1].getElementsByTagName("table")[0].rows[1].getElementsByClassName("unit-item-knight")[0].textContent); 
			if(win.FastNotes.spy_units.knight > 0) {
				win.FastNotes.units.knight_alive = true;
				win.FastNotes.units.knight = 1;
			}
		}catch(ex){}
	}
}


//////////////////////////////////
//            NOTES             //
//////////////////////////////////

// Create and Edit text contend for the Village Note
function createNote(playerName, typeVillage, points, autodetected){

	var time = $('#content_value')[0].getElementsByTagName('table')[4].rows[1].cells[1].textContent;
	var nextime= time.replace(" "," - ").replace(/\t/g,"").replace(/\n/g,"");
	// Edit Note Text
	noteText = tt('note').player.replace("%player%", playerName) + '\n';
	noteText += tt('note').points.replace("%points%", points) + '\n\n';
    noteText += tt('note').village.replace("%type%", typeVillage) + '\n';
	noteText += tt('note').time.replace("%time%",nextime);

	// Features if have someone!
	if(win.FastNotes.units.knight_alive || win.FastNotes.units.snob_alive ||  win.FastNotes.torre.build ||  win.FastNotes.iglesia.build || win.FastNotes.wall.build || win.FastNotes.units.militia_alive){
		noteText += '\n\n' + tt('note').features;
		if(win.FastNotes.units.militia_alive) noteText += '\n' + tt('note').militia.replace("%amount%", win.FastNotes.units.militia);
		if(win.FastNotes.wall.build){
			if(win.FastNotes.wall.level > 0) noteText += '\n' + tt('note').wall.yes.replace("%level%",win.FastNotes.wall.level);
			else noteText += '\n' + tt('note').wall.no;
		}
		if(win.FastNotes.iglesia.build){
			if(win.FastNotes.iglesia.level > 0) noteText += '\n' + tt('note').iglesia.yes.replace("%level%",win.FastNotes.iglesia.level);
			else noteText += '\n' + tt('note').iglesia.no;
		}
		if(win.FastNotes.torre.build){
			if(win.FastNotes.torre.level > 0) noteText += '\n' + tt('note').torre.yes.replace("%level%",win.FastNotes.torre.level);
			else noteText += '\n' + tt('note').torre.no;
		}
		if(win.FastNotes.units.knight_alive && win.FastNotes.units.snob_alive)noteText += '\n' + tt('note').knightsnob;
		else if(win.FastNotes.units.knight_alive)noteText += '\n' + tt('note').knight;
		else if(win.FastNotes.units.snob_alive)noteText += '\n' + tt('note').snob;
	}

    noteText += '\n\n' + $('#report_export_code')[0].innerHTML.replace("[spoiler]", "[spoiler=Informe]");
	postNote(noteText, autodetected);
}

// Posts a note in the specific village!!
function postNote(noteText, autodetected){
	var msg = "";
	
	var mode = ""
	
	var delete_confirm = false;
	var cooldown_next = false;
	var delay_next = 200;

	// Get note post mode!!
	if (typeof note_added !== 'undefined') {
		mode = note_added.mode.toLowerCase();
	}

	// Get Next Options!!
	if (typeof next_options !== 'undefined') {
		cooldown_next = next_options.delay.enable;
		delay_next = next_options.delay.cooldown;
	}

	// Get Delete Options!!
	if (typeof delete_options !== 'undefined') {
		delete_confirm = delete_options.confirm_msg;
	}

	if(mode == "siguiente"){
		var next = $('#report-next')[0];
		if(next !== undefined) msg = "Pasando al siguiente informe."
		TribalWars.post('info_village', { ajaxaction: 'edit_notes', id: villageId, }, { note: noteText, }, function () { 
			UI.SuccessMessage(autodetected+tt('Added')+ " "+msg, 2000); 
		})
		if(next !== undefined){
			if(cooldown_next){
				setTimeout(function(){next.click();}, delay_next);
			}else{next.click();}		
		}

	}else if(mode == "eliminar"){

		if(delete_confirm){
			msg = '¿Deseas eliminar el informe? <button class="btn" onclick="removeReport()">Sí</button> <button class="btn">No</button>';
		}else{
			removeReport();
		}
		TribalWars.post('info_village', { ajaxaction: 'edit_notes', id: villageId, }, { note: noteText, }, function () { 
			UI.SuccessMessage(autodetected+tt('Added')+ " "+msg, 20000); 
		})
	}else{
		TribalWars.post('info_village', { ajaxaction: 'edit_notes', id: villageId, }, { note: noteText, }, function () { 
		UI.SuccessMessage(autodetected+tt('Added')+ " "+msg, 20000); 
		})
	}	
}

// Function to click remove button!!
function removeReport(){
	var table = $('td#content_value');
	var result = table[0].getElementsByTagName('table')[table[0].getElementsByTagName('table').length-1];
	var del = result.rows[0].cells[2];
	if(del.textContent.includes("Borrar")){
		del.getElementsByTagName("a")[0].click();
	}
}

// Function to click next-report button!!
function nextReport(){
	var next = $('#report-next')[0];
	if(next !== undefined){
		next.click();
	}
}



//////////////////////////////////
//         ADDICCIONAL          //
//////////////////////////////////


// Translations Messages and Codes!
function tt(string) {
	var gameLocale = game_data.locale;
	if (translations[gameLocale] !== undefined) return translations[gameLocale][string];
	else return translations['es_ES'][string];
}

// Addicional function to get Parameters quickly!!
function getParameterByName(name, url = window.location.href) {
	return new URL(url).searchParams.get(name);
}

// Addicional func to get info from Script!!
function scriptInfo() {
	return `[${scriptData.name} ${scriptData.version}]`;
}
// Debugging function to checks script!!
function initDebug() {
	console.debug(`${scriptInfo()} It works ^^!`);
	if (DEBUG) {
		console.debug(`${scriptInfo()} World:`, game_data.world);
		console.debug(`${scriptInfo()} Screen:`, game_data.screen);
		console.debug(`${scriptInfo()} Game Version:`, game_data.majorVersion);
		console.debug(`${scriptInfo()} Game Build:`, game_data.version);
		console.debug(`${scriptInfo()} Locale:`, game_data.locale);
		console.debug(`${scriptInfo()} Premium:`, game_data.features.Premium.active);
	}
}

// Funct to detect if you are in report view or info_command view!!
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

// ******************************************** //
//              Source AS Document              //
// ******************************************** //

// Returns the page with the specify url. The returns type is Document.
function getSourceAsDOM(url){
    xmlhttp=new XMLHttpRequest();
    xmlhttp.open("GET",url,false);
    xmlhttp.send();
    parser=new DOMParser();
    return parser.parseFromString(xmlhttp.responseText,"text/html");      
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