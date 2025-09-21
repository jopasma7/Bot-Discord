//Plugin original con fallos y antiguo.
//Este archivo ha sido modificado a gusto propio e implementado por Rabagalan73, específicamente para el w68.
//Si necesitas información adicional ponte en contacto.

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
        if (ScriptAPI.preventLaunch === true)  {
            UI.ErrorMessage('Ya estas ejecutando el Script', 5000);
            return false;
    	}
        win.DSSelectVillages.enableScript();
        ScriptAPI.preventLaunch = (noConflict !== false) ? true : false;
       	return true; 
    }
}

win.DSSelectVillages ={
        currentLang: 'es',      
        showWithCoords: true,     
        showWithCounter: true,     
        showWithNewLine: true,
        showWithFakes: true,      
        breakAfter: -1,     
        enabled: false,     
        villages: [],       
        villagesId: [],     
        lang: {
            es: {
                UI: {
                    selectedVillages: "Seleccionar pueblos",
                    enableShowWithCoords: "Códigos BB",
                    enableShowWithCounter: "Listado",
                    enableShowWithNewLine: "Nueva línea",
                    enableShowFakes: "Generar Script de Fakes"
                }
            }
        },
        
        enableScript: function () {
            this.enabled = true;
            this.showWithCoords = win.showWithCoords;
            this.showWithCounter = win.showWithCounter;
            this.showWithFakes = win.showWithFakes;
            this.breakAfter = win.breakAfter;
            win.TWMap.mapHandler.integratedSpawnSector = win.TWMap.mapHandler.spawnSector;
            win.TWMap.mapHandler.spawnSector = this.spawnSector;
            
            this.oldClickFunction = win.TWMap.mapHandler.onClick;
            win.TWMap.mapHandler.onClick = this.clickFunction;
            win.TWMap.reload();
            
            this.showUi();
        },
        
        spawnSector: function (data, sector) {
            win.TWMap.mapHandler.integratedSpawnSector(data, sector);
            for (var i = 0; i < win.DSSelectVillages.villagesId.length; i++) {
                var villageId = win.DSSelectVillages.villagesId[i];
                if(villageId === null){
                    continue;
                }
                var v = $('#map_village_' + villageId);
                $('<div class="DSSelectVillagesOverlay" id="DSSelectVillages_overlay_' + villageId + '" style="width:52px; height:37px; position: absolute; z-index: 50; left:' + $(v).css('left') + '; top: ' + $(v).css('top') + ';"></div>').appendTo(v.parent());
                $('#DSSelectVillages_overlay_' + villageId).css('outline', 'rgb(255,255,0) solid 2px').css('background-color', 'rgb(255,165,0,0.14)');
            }
        },
        
        markVillageAsSelected: function (id) {
            $('#DSSelectVillages_overlay_' + id).css('outline', 'rgba(51, 255, 0, 0.7) solid 2px').css('background-color', 'rgba(155, 252, 10, 0.14)');
        },
        demarkVillageAsSelected: function (id) {
            $('#DSSelectVillages_overlay_' + id).css('outline', '').css('background-color', '');
        },
        
        disableScript: function () {
            this.enabled = false;
            this.villages = [];
            this.villagesId = [];
            win.TWMap.mapHandler.onClick = this.oldClickFunction;
            win.TWMap.mapHandler.spawnSector = win.TWMap.mapHandler.integratedSpawnSector;
            win.TWMap.reload();
            $('#bb_main_div').remove();
        },
        
        showUi: function () {
            
            $('#map_config').prepend('<table id="bb_main_div" class="vis" style="border-spacing:0px;border-collapse:collapse;margin-top:15px;" width="100%"><tbody>'
									+'<tr><th colspan="4">' + this.lang[this.currentLang].UI.selectedVillages + '</th></tr>'
									+'<tr>'
                                    +'	<td>'
                                    +'		<input type="checkbox" id="bbcode">'
                                    +'	</td>'
                                    +'	<td>'
									+'		<label for="warplanner_enabled">' + this.lang[this.currentLang].UI.enableShowWithCoords + '</label>'
									+'	</td>'
                                    +'	<td>'
                                    +'		<input type="checkbox" id="zaehlen">'
                                    +'	</td>'
                                    +'	<td>'
									+'		<label for="warplanner_enabled">' + this.lang[this.currentLang].UI.enableShowWithCounter + '</label>'
									+'	</td>'
                                    +'</tr>'
                                    +'<tr>'
                                    +'	<td>'
                                    +'		<input type="checkbox" id="new-line">'
                                    +'	</td>'
                                    +'	<td>'
									+'		<label for="new-line">' + this.lang[this.currentLang].UI.enableShowWithNewLine + '</label>'
									+'	</td>'
                                    +'  <td>'
                                    +'		<input type="checkbox" id="script-fakes">'
                                    +'	</td>'
                                    +'	<td>'
									+'		<label for="warplanner_enabled">' + this.lang[this.currentLang].UI.enableShowFakes + '</label>'
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
            var chkbxBBcode = $('#bbcode');
            var chkbxcounter = $('#zaehlen');
            var chkbxShowWithNewLine = $('#new-line');
            var chkbxFakes = $('#script-fakes');
            chkbxBBcode.prop('checked', this.showWithCoords);
            chkbxcounter.prop('checked', this.showWithCounter);
            chkbxShowWithNewLine.prop('checked', this.showWithNewLine);
            chkbxFakes.prop('checked', this.showWithFakes);


            javascript:

            $('#troop_confirm_go').after('<a href="#" id="troop_confirm_train" class="btn btn-img" style="line-height: 21px;">' + 
            '<img src="https://dses.innogamescdn.com/asset/aea37386/graphic/unit/tiny/snob.png" title="" alt="" class=""> Añadir ataque con noble</a>');
            
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
                var billingItems = document.querySelectorAll('#bb_main_div.vis input[type="checkbox"]');

                for (var i = 0; i < billingItems.length; i++) {
                    if(billingItems[i].id != "script-fakes") billingItems[i].disabled = !billingItems[i].disabled;
                }

                win.DSSelectVillages.outputCoords();
            });

        },
        
        outputCoords: function () {
            var coordsOutput = "";
            for (var i = 0; i < this.villages.length; i++) {
                if (this.villages[i] === null) {
                    continue;
                }
                var fakescoords = "";
                var realCount = 0;
                for (var j = 0; j <= i; j++) {
                    if (this.villages[j] != null) {
                        realCount++;
                        if(realCount >= this.villages.length){
                            fakescoords += this.villages[j];
                        }else{
                            fakescoords += this.villages[j] + " ";
                        }                       
                    }
                }
                
                if(this.showWithFakes){                         
                    coordsOutput = sendScriptFakes(fakescoords);
                    
                }else{
                    coordsOutput += (this.showWithCounter ? realCount + ". " : "" ) + 
                    (this.showWithCoords ? "[coord]" : "") + this.villages[i] + (this.showWithCoords ? "[/coord]" : "") + 
                    (this.showWithNewLine ? "\n" : " ");
                }
               


                if (this.breakAfter != -1 && realCount % this.breakAfter == 0) {
                    coordsOutput += "\n";
                }
            }
            $('#output').html(coordsOutput);
            $("#output").select();
        },
        
        handleVillage: function (x, y) {
            var coord = x + "|" + y;
            var index = this.villages.indexOf(coord);
            var village = win.TWMap.villages[(x) * 1000 + y];
            if (!village) {
                return;
            }
            if (index === -1) {
                this.villages.push(coord);
                this.villagesId.push(village.id);
                this.markVillageAsSelected(village.id);
                win.TWMap.reload();
            } else {
                this.villages[index] = null;
                var indexId = this.villagesId.indexOf(village.id);
                this.villagesId[indexId] = null;
                this.demarkVillageAsSelected(village.id);
            }
            this.outputCoords();
        },
        
        clickFunction: function (x, y, event) {
            win.DSSelectVillages.handleVillage(x, y);
            return false;
        },
        
        oldClickFunction: null
    };

function sendScriptFakes(a){
    var text = `javascript: units = {
        'spear': false,
        'sword': false,
        'axe': false,
        'archer': 0,
        'spy': false,
        'light': false,
        'heavy': 0,
        'catapult': false,
        'ram': false,
        'knight': 0,
        'snob': 0
    };   
    unitsValor= {
        'spear': 1,
        'sword': 1,
        'axe': 1,
        'archer': 1,
        'spy': 2,
        'light': 4,
        'heavy': 6,
        'catapult': 8,
        'ram': 5,
        'knight': 10,
        'snob': 100
    };
    
    coords = "`+a+`";
    name = "fakes";
    msg = {
        target: "Objetivo numero",
        total: "Total:",
        error: "Tropas insuficientes!",
        end: "Final de la lista!"
    };
    var b = document;
    
    function e(a) {
        return b.getElementsByName(a)[0];
    }
    
    function k(a) {
        return Number(e(a).nextSibling.nextSibling.innerHTML.match(/\\d+/));
    }
    
    function n() {
        var a = p,
            t = q;
    
        function D(a, d) {
            a.push("\\n");
            for (var c = 0; c < a.length; c++) {
                if (0 < d) {
                    if (a[c][1]) {
                        k(a[c][0]) > a[c][1] ? (a[c][1] += 1, d -= unitsValor[a[c][0]], m += unitsValor[a[c][0]], insertUnit(e(a[c][0]), a[c][1])) : (a.splice(c, 1), c = -1);
                    } else {
                        if (1 == a.length) break;
                        c = -1;
                    }
                } else break;
            }
            0 < d && (e(name).innerHTML = " " + msg.error, e(name).style.color = "red");
        }
        var v = [],
            m = t,
            f = [
                ["main", 10, [1.17, 5]],
                ["farm", 5, [1.172102, -240]],
                ["storage", 6, [1, 0]],
                ["place", 0, [1, 0]],
                ["barracks", 16, [1.17, 7]],
                ["smith", 19, [1.17, 20]],
                ["wood", 6, [1.155, 5]],
                ["stone", 6, [1.14, 10]],
                ["iron", 6, [1.17, 10]],
                ["market", 10, [1.17, 20]],
                ["stable", 20, [1.17, 8]],
                ["wall", 8, [1.17, 5]],
                ["garage", 24, [1.17, 8]],
                ["hide", 5, [1.17, 2]],
                ["snob", 512, [1.17, 80]],
                ["statue", 24, [1, 10]]
            ],
            a = a.reverse(),
            w = f.map(function (a) {
                return Number(game_data.village.buildings[a[0]]);
            }),
            f = f.map(function (a, d) {
                return 0 == w[d] ? 0 : Math.round(a[1] * Math.pow(1.2, w[d] - 1));
            }),
            f = Math.floor(function (a) {
                var d = 0;
                a.forEach(function (a) {
                    d += a;
                });
                return d;
            }(f) / 100);
        if (!(0 > f - t)) {
            for (x = 0; a.length > x;) e(a[x]) && 1 > k(a[x]) ? a.splice(x, 1) : x++;
            for (var g = 0; g < a.length; g++) {
                var l = Math.ceil((f - t) / a.length / unitsValor[a[g]]),
                    l = l + Number(e(a[g]).value);
                l > k(a[g]) ? l = k(a[g]) : v.push([a[g], l]);
                m += unitsValor[a[g]] * l;
                insertUnit(e(a[g]), l);
            }
            f > m && D(v.reverse(), f - m);
        }
    }
    if (e("input") && "" == e("input").value) {
        e(name) || $("h3").append('<span name="' + name + '" style="color:green;font-size:11px;"></span>');
        var s = coords.split(" "),
            u = 0,
            p = [],
            q = 0,
            y = Math.floor((Math.random() * s.length) + 0).toString();
        /^-?[\\d.]+(?:e-?\\d+)?$/.test(y) && (u = Number(y));
        e(name).innerHTML = " " + msg.target + " " + (u) + "  (" + s[u] + "). " + msg.total + " " + s.length;
        e(name).style.color = "green";
        e("input").value = s[u];
        for (var z in units) {
            if (e(z)) {
                var A = units[z],
                    B = Number(A),
                    C = k(z) + B;
                "boolean" == typeof A && A ? insertUnit(e(z), k(z)) : "boolean" != typeof A || A ? 0 > B ? 0 < C && insertUnit(e(z), C) : k(z) >= A && insertUnit(e(z), B) : p.push(z);
                q += e(z).value * unitsValor[z];
            }
        }
        0 < p.length && n();
    }
    xProcess("inputx", "inputy");
    btnA = document.getElementById('target_attack');
    btnA.focus();`
    return text;
}


ScriptAPI.lib.launchOnScreen('map', "Este script debe iniciarse desde el mapa.");