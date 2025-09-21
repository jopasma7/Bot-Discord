// Script created by Rabagalan73

win = window;
// Loading Script LIB
ScriptAPI.lib = {
    launchOnScreen: function (screen, onError, noConflict) {
        if (game_data.screen != screen) {
        	if (onError == null) return false;
            if (onError.substring(0, 1) == "/") window.location.href = onError;
            	else UI.ErrorMessage(onError, 5000);
            return false;
        }
        enableScript();
        ScriptAPI.preventLaunch = (noConflict !== false) ? true : false;
       	return true; 
    }
}

function enableScript() {
    showUi();
}


win.VNotes={
    currentLang: 'es',      
    playername: true,  
    points: true,
    enableoff: true,
    enabledeff: true, 
    lang: {
        es: {
            UI: {
                enablePlayerName: 'Nombre del Jugador',
                enablePoints: 'Puntos del Pueblo',
                enableOFF: 'Pueblo Ofensivo',
                enableDEFF: 'Pueblo Defensivo'
            }
        }
    }
}


function showUi() {    
    
    var allDivTd = document.getElementById("content_value").getElementsByTagName("TD");

    for(var i = 0; i < allDivTd.length; i++){
        var td = allDivTd[i];
        if(i==19){
            $(td).prepend('<table id="bb_main_div" class="vis" style="border-spacing:0px;border-collapse:collapse;margin-top:3px;" width="100%"><tbody>'
            +'<tr><th colspan="4">' + 'Agregar notas al Pueblo' + '</th></tr>'
            +'<tr>'
            +'	<td>'
            +'		<input type="checkbox" id="playername">'
            +'	</td>'
            +'	<td>'
            +'		<label for="warplanner_enabled">' + win.VNotes.lang[win.VNotes.currentLang].UI.enablePlayerName + '</label>'
            +'	</td>'
            +'	<td>'
            +'		<input type="checkbox" id="points">'
            +'	</td>'
            +'	<td>'
            +'		<label for="warplanner_enabled">' + win.VNotes.lang[win.VNotes.currentLang].UI.enablePoints + '</label>'
            +'	</td>'
            +'</tr>'
            +'<tr>'
            +'	<td>'
            +'		<input type="checkbox" id="enableoff">'
            +'	</td>'
            +'	<td>'
            +'		<label for="new-line">' + win.VNotes.lang[win.VNotes.currentLang].UI.enableOFF + '</label>'
            +'	</td>'
            +'  <td>'
            +'		<input type="checkbox" id="enabledeff">'
            +'	</td>'
            +'	<td>'
            +'		<label for="warplanner_enabled">' + win.VNotes.lang[win.VNotes.currentLang].UI.enableDEFF + '</label>'
            +'  </td>'
            +'</tr>'
            +'</tbody></table>'
            +'<table id="bb_main_div" class="vis" style="border-spacing:0px;border-collapse:collapse;margin-top:15px;" width="100%"><tbody>'
            +'<tr><td></td>'
            +'	<td>'
             +'		<textarea id="output" rows="5" style="width:95%;" readonly></textarea>'
            +'	</td>'
            +'</tr>'
            +'</tbody></table>'                                  
            +'');


            var chkbxPlayerName = $('#playername');
            var chkbxPoints = $('#points');
            var chkbxEnableOFF = $('#enableoff');
            var chkbxEnableDEFF = $('#enabledeff');

            chkbxPlayerName.prop('checked', win.VNotes.playername);
            chkbxPoints.prop('checked', win.VNotes.points);
            chkbxEnableOFF.prop('checked', win.VNotes.enableoff);
            chkbxEnableDEFF.prop('checked', win.VNotes.enabledeff);

            chkbxPlayerName.change(function () {
                win.VNotes.playername = this.checked;
                output();
            });

            chkbxPoints.change(function () {
                win.VNotes.points = this.checked;
                output();
            });

            chkbxEnableOFF.change(function () {
                win.VNotes.enableoff = this.checked;
                output();
            });

            chkbxEnableDEFF.change(function () {
                win.VNotes.enabledeff = this.checked;
                output();
            });

        }
    }
}

function output () {
    var textOutput = "";

    textOutput += (win.VNotes.playername ? $('#icon header village')+ " \n" : "" ) + 
            (win.VNotes.points ? "Puntos: " + "aqui los puntos  \n": "") 
            + (win.VNotes.enableoff ? "PUEBLO OFF \n" : " ") + (win.VNotes.enabledeff ? "PUEBLO DEFF \n" : " ");

    $('#output').html(textOutput);
    $("#output").select();
}

    /*$('#content_value').prepend('<table id="bb_main_div" class="vis" style="border-spacing:0px;border-collapse:collapse;margin-top:15px;" width="100%"><tbody>'
                            +'<tr><th colspan="3">' + 'Titulo' + '</th></tr>'
                            +'<tr>'
                            +'	<td>'
                            +'		<input type="checkbox" id="bbcode">'
                            +'	</td>'
                            +'	<td>'
                            +'		<label for="warplanner_enabled">' + 'Coordenadas' + '</label>'
                            +'	</td>'
                            +'</tr>'
                            +'<tr>'
                            +'	<td>'
                            +'		<input type="checkbox" id="zaehlen">'
                            +'	</td>'
                            +'	<td>'
                            +'		<label for="warplanner_enabled">' + 'Counter' + '</label>'
                            +'	</td>'
                            +'</tr>'
                            +'<tr>'
                            +'	<td>'
                            +'		<input type="checkbox" id="new-line">'
                            +'	</td>'
                            +'	<td>'
                            +'		<label for="new-line">' + 'NewLine' + '</label>'
                            +'	</td>'
                            +'</tr>'
                            +'<td>'
                            +'		<input type="checkbox" id="script-fakes">'
                            +'	</td>'
                            +'	<td>'
                            +'		<label for="warplanner_enabled">' + 'ScriptFakes' + '</label>'
                            +'	</td>'
                            +'<tr><td></td>'
                            +'	<td>'
                             +'		<textarea id="output" rows="5" style="width:95%;" readonly></textarea>'
                            +'	</td>'
                            +'</tr>'
                            +'</tbody></table>');
    var chkbxBBcode = $('#bbcode');
    var chkbxcounter = $('#zaehlen');
    var chkbxShowWithNewLine = $('#new-line');
    var chkbxFakes = $('#script-fakes');
    chkbxBBcode.prop('checked', this.showWithCoords);
    chkbxcounter.prop('checked', this.showWithCounter);
    chkbxShowWithNewLine.prop('checked', this.showWithNewLine);
    chkbxFakes.prop('checked', this.showWithFakes);
    
    chkbxBBcode.change(function () {
        win.DSSelectVillages.showWithCoords = this.checked;
        win.DSSelectVillages.outputCoords();
    });
    chkbxcounter.change(function () {
        win.DSSelectVillages.showWithCounter = this.checked;
        win.DSSelectVillages.outputCoords();
    });
    chkbxShowWithNewLine.change(function () {
        win.DSSelectVillages.showWithNewLine = this.checked;
        win.DSSelectVillages.outputCoords();
    });
    chkbxFakes.change(function (){
        win.DSSelectVillages.showWithFakes = this.checked;
        win.DSSelectVillages.outputCoords();
    });*/




function handlepaste (elem, e) {
    var savedcontent = elem.innerHTML;
    if (e && e.clipboardData && e.clipboardData.getData) {// Webkit - get data from clipboard, put into editdiv, cleanup, then cancel event
        if (/text\/html/.test(e.clipboardData.types)) {
            elem.innerHTML = e.clipboardData.getData('text/html');
        }
        else if (/text\/plain/.test(e.clipboardData.types)) {
            elem.innerHTML = e.clipboardData.getData('text/plain');
        }
        else {
            elem.innerHTML = "";
        }
        waitforpastedata(elem, savedcontent);
        if (e.preventDefault) {
                e.stopPropagation();
                e.preventDefault();
        }
        return false;
    }
    else {// Everything else - empty editdiv and allow browser to paste content into it, then cleanup
        elem.innerHTML = "";
        waitforpastedata(elem, savedcontent);
        return true;
    }
}

function waitforpastedata (elem, savedcontent) {
    if (elem.childNodes && elem.childNodes.length > 0) {
        processpaste(elem, savedcontent);
    }
    else {
        that = {
            e: elem,
            s: savedcontent
        }
        that.callself = function () {
            waitforpastedata(that.e, that.s)
        }
        setTimeout(that.callself,20);
    }
}

function processpaste (elem, savedcontent) {
    pasteddata = elem.innerHTML;
    //^^Alternatively loop through dom (elem.childNodes or elem.getElementsByTagName) here

    elem.innerHTML = savedcontent;

    // Do whatever with gathered data;
    document.getElementById("container").innerHTML = pasteddata;

    var el = document.getElementById("div");
    el.setAttribute("contenteditable", false);
    el.textContent= "Pasted!!";
    el.style.textDecoration = 'line-through';
    

    //alert(pasteddata);
}


ScriptAPI.lib.launchOnScreen('info_village', "Este script debe ejecutarse desde la información del pueblo.");