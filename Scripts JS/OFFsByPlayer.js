javascript:

/* Script By Raba */
/* Versión: 1.1 */

if(getParameterByName('screen') == "info_player"){
    var coords_off = "";
    var coords_deff = "";

    openWindow();
    var villages_table = document.getElementById('villages_list');
    var anchor = document.querySelectorAll(".village_anchor");
    for(var i=0;i<anchor.length;i++){
        var source = getSourceAsDOM(anchor[i].querySelector('a').href);
        //console.log(i);
        if(hasNote(source)){// Si tiene Nota Propia
            var note = source.getElementById('own_village_note'); // Nota Propia
            var content = note.getElementsByClassName('village-note-body')[0].textContent;
            if(content.includes("Posible Ofensivo")){
                coords_off += villages_table.rows[i+1].cells[2].textContent + " ";
            } 
            if(content.includes("Posible Defensivo")){
                coords_deff += villages_table.rows[i+1].cells[2].textContent + " ";
            } 
        }else if(hasOtherNote(source)){
            var note = source.getElementsByClassName('village-note')[1]; // Nota Ajena
            var content = note.getElementsByClassName('village-note-body')[0].textContent;
            if(content.includes("Posible Ofensivo")){
                coords_off += villages_table.rows[i+1].cells[2].textContent + " ";
            } 
            if(content.includes("Posible Defensivo")){
                coords_deff += villages_table.rows[i+1].cells[2].textContent + " ";
            } 
        }
    }

    createWindow(coords_deff, coords_off);
    
}else{
    UI.ErrorMessage("Este script se ejecuta desde el perfil de un jugador", 2000);
}



// ******************************************** //
//           Create Window Func            //
// ******************************************** //

// This method will create a new window where the new coords will appear.
function createWindow(coords_deff, coords_off){
    var S = '<b>Generador de Coordenadas by Raba</b><hr><b>Pueblos Defensivos: </b><br>'+coords_deff+
    '<br><br><b>Pueblos Ofensivos: </b><br>'+coords_off;

    var w = 840;
        var h = 680;
        var left = Number((screen.width/2)-(w/2));
        var tops = Number((screen.height/2)-(h/2));

    var popup = window.open("", 'twfg', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+tops+', left='+left);
    popup.document.open('text/html','replace');
    popup.document.write(S);
    popup.document.close(); 
}

function openWindow(){
    var S = '<b>Generador de Coordenadas by Raba</b><hr><br><br><b>Cargando pueblos por favor espera... </b>';

    var w = 840;
        var h = 680;
        var left = Number((screen.width/2)-(w/2));
        var tops = Number((screen.height/2)-(h/2));

    var popup = window.open("", 'twfg', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+tops+', left='+left);
    popup.document.open('text/html','replace');
    popup.document.write(S);
    popup.document.close(); 
}
function getParameterByName(name, url = window.location.href) {
	return new URL(url).searchParams.get(name);
}

function hasNote(source){
    var note = source.getElementById('own_village_note');
    if(note.getElementsByClassName('village-note-body')[0].textContent.trim() == ""){
        return false;
    } else return true;
}

function hasOtherNote(source){
    var note = source.getElementsByClassName('village-note')[1];
    if(note == undefined){
        return false;
    }
    if(note.getElementsByClassName('village-note-body')[0].textContent.trim() == ""){
        return false;
    } else return true;
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

void(0);