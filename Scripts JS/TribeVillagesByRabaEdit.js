javascript:

var Doc = document;
if (typeof DEBUG !== 'boolean') DEBUG = false;

var scriptData = {
	name: 'Tribe Villages',
	version: 'v3.1',
    creator: 'Rabagalan73',
};

var translations = {
    es_ES: {
        'Title': 'Generador de Coordenadas desde el perfil de Tribu',
        'Subtitle': 'Todos los Pueblos:',
        'InfoTitle': 'Información Adicional:',
        'InfoDesc': 'Este plugin ha sido creado por '+scriptData.creator+'. <br> Script Version: '+scriptData.version,
        'Tip': 'PD: Este script utiliza varios cálculos para almacenar todas las coordenadas de los jugadores. Si una tribu es muy grande o tiene muchas aldeas. Probablemente el calculo se demore más.',
		'TribeProfile': 'Este script se ejecuta desde la página de perfil de una tribu.',
		'Premium': 'Necesitas una cuenta premium.',
	},
    en_EN: {
        'Title': 'Coords Generator from Tribe Profile',
        'Subtitle': 'All Villages:',
        'InfoTitle': 'Additional Information:',
        'InfoDesc': 'This plugin has been created by '+scriptData.creator+'. <br> Script Version: '+scriptData.version,
        'Tip': 'PS: This script uses several calculations to store all the coordinates of the all players. If a tribe is very large or has many villages. Probably the calculation will take longer.',
		'TribeProfile': 'This script is executed from a tribe profile page!',
		'Premium': 'You need a premium account.',
    },
};

initDebug();
initScript();


// ******************************************** //
//          Get Players Coords Method           //
// ******************************************** //

// This is the main body of the script. 
// Here we collect the values of the tribe players one by one and look up the coordinates of their villages. 
// Then we will place them in an array and return it for printing.

function getCoords(){
    var array = new Array();
    var content = Doc.getElementById("content_value");
    var rows = content.getElementsByTagName("table")[2].getElementsByTagName("tbody")[0].rows

    for(var i=1;i<rows.length;i++){
        var perfil = rows[i].getElementsByTagName("td")[0].getElementsByTagName("a")[0].href; // Player Profile page!
        var DOM = getSourceAsDOM(perfil+""); 
        var tds = DOM.getElementsByTagName("TD");

        for(var a=0;a<tds.length;a++){
            var inner = tds[a].innerHTML;
            if(/^\d+\|\d+$/.test(inner)){
                array.push(inner);
            }
        }   
    }
    array = array.join(' ');
    return array;
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


// ******************************************** //
//           Create Fake Script Func            //
// ******************************************** //

// This method will create a new window where the new fakes script will appear with all the coordinates.
function createFakeScript(){
    var delante='<textarea cols=80 rows=10>javascript:sp=0;sw=0;ax=0;scout=0;lc=0;hv=0;cat=0;ra=1;coords=\'';
    var detras='\';var doc=document;if(window.frames.length>0)doc=window.main.document;url=doc.URL;if(url.indexOf(\'screen=place\')==-1)alert(\'Este script se usa desde la plaza\');coords=coords.split(\' \');index=Math.round(Math.random()*(coords.length-1));coords=coords[index];coords=coords.split(\'|\');doc.forms[0].x.value=coords[0];doc.forms[0].y.value=coords[1];insertUnit(doc.forms[0].spear,sp);insertUnit(doc.forms[0].sword,sw);insertUnit(doc.forms[0].axe,ax);insertUnit(doc.forms[0].spy,scout);insertUnit(doc.forms[0].light,lc);insertUnit(doc.forms[0].heavy,hv);insertUnit(doc.forms[0].ram,ra);insertUnit(doc.forms[0].catapult,cat);void(0)</textarea><br><br>';

    var S = '<b>'+lang("Title")+'</b><hr>'+lang("Subtitle")+'<br>'+delante+getCoords()+detras+
    '<b>'+lang("InfoTitle")+'</b><hr>'+lang("InfoDesc")+'<br><hr>'+lang("Tip")+'<br>';

    var w = 840;
        var h = 680;
        var left = Number((screen.width/2)-(w/2));
        var tops = Number((screen.height/2)-(h/2));

    var popup = window.open("templates/sales/index.php?go=new_sale", 'twfg', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+tops+', left='+left);
    popup.document.open('text/html','replace');
    popup.document.write(S);
    popup.document.close(); 
}


// ******************************************** //
//            Inits Debug Parameters            //
// ******************************************** //

// This method starts the debugs paramethers and values for print in console possible bugs!
function initDebug() {
	console.debug(`${scriptInfo()} Todo funcionando correctamente!`);
	if (DEBUG) {
		console.debug(`${scriptInfo()} World:`, game_data.world);
		console.debug(`${scriptInfo()} Screen:`, game_data.screen);
		console.debug(`${scriptInfo()} Game Version:`, game_data.majorVersion);
		console.debug(`${scriptInfo()} Game Build:`, game_data.version);
		console.debug(`${scriptInfo()} Locale:`, game_data.locale);
		console.debug(`${scriptInfo()} Premium:`, game_data.features.Premium.active);
	}
}

// ******************************************** //
//              Script Info Method              //
// ******************************************** //

// Addicional method to gets name and version for this script.
function scriptInfo() {
	return `[${scriptData.name} ${scriptData.version}]`;
}

// ******************************************** //
//              Starts Script Funcs             //
// ******************************************** //

// This method is called at the beginning to this code for enable all script functions!
// Checks if player have active premium account and if is in the correct window. Else returns error.
function initScript() {
    win = window;
    if(window.frames.length>0) Doc = window.main.document; 
	const gameScreen = new URL(window.location.href).searchParams.get('screen');
	if (game_data.features.Premium.active) {
		if (gameScreen === 'info_ally') {
            createFakeScript();
        } else UI.ErrorMessage(lang("TribeProfile"), 2000);      
	} else UI.ErrorMessage(lang("Premium"));
	
}

// ******************************************** //
//                 Lang Method                  //
// ******************************************** //

// Addicional method to gets the language of player locate. If is undefined. By default set on Spanish.
function lang(string) {
	var gameLocale = game_data.locale;
	if (translations[gameLocale] !== undefined) return translations[gameLocale][string];
    else return translations['es_ES'][string];
}

void(0);