javascript: 

/* 
>> Script By Rabagalan73 para la tribu FTM! 

>> Ejemplo de unidades: 
    "amounts": {"spear":1,"sword":1,"axe":1,"archer":1,"spy":1,"light":1,"marcher":1,"heavy":1,"ram":1,"catapult":1}

>> También se puede dejar en blanco para envíar todas las unidades en el pueblo.
    "amounts": {}

>> Utilizar el modo Secuencial para mandar los ataques por orden.
    "mode":"secuencial" 

>> Utilizar el modo Random para envíar los ataques de forma aleatoria a cualquier coordenada.
    "mode":"random" 
*/

var config = {
    "amounts": {"spy":1,"ram":1}, 
    "coords": "567|446 566|444",
    "mode": "secuencial" 
}; 

if (game_data.screen === 'place' && game_data.mode === null) { 
    const { amounts, coords } = config; 
    if(config.mode.toLowerCase() == "secuencial") sequentialFakeScript(amounts, coords); 
    else if(config.mode.toLowerCase() == "random") randomFakeScript(amounts, coords); 
    else {
        alert("Ha habido un problema al seleccionar el modo. Has colocado '"+config.mode+"' y ese modo no existe. Utiliza 'random' o 'secuencial'.",1000);
        console.log("Hubo un problema al poner el modo.");
    }
    
} else { 
    UI.InfoMessage('Redireccionando'); 
    setTimeout(function () { window.location.assign(game_data.link_base_pure + 'place'); }, 500); 
}

function sequentialFakeScript(amounts, coords) { 
    coords = coords.split(' '); 
    index = 0; 
    fakecookie = document.cookie.match('(^|;) ?farm=([^;]*)(;|$)'); 
    if (fakecookie != null) index = parseInt(fakecookie[2]); 
    if (index >= coords.length) alert('Has completado la lista. Volviendo a la primera coordenada.'); 
    if (index >= coords.length) index = 0; coords = coords[index]; coords = coords.split('|'); 
    
    index = index + 1; 
    cookie_date = new Date(2030, 1, 1); 
    document.cookie = 'farm=' + index + ';expires=' + cookie_date.toGMTString(); 
    document.forms[0].x.value = coords[0]; 
    document.forms[0].y.value = coords[1]; 

    if(Object.keys(config.amounts).length != 0){
        jQuery('input[class=unitsInput]').val(0); 
        var count; 

        for (var unit in amounts) { 
            if (amounts.hasOwnProperty(unit)) { 
                if (amounts[unit] > 0 && typeof document.forms[0][unit] != 'undefined') { 
                    count = parseInt(document.forms[0][unit].nextSibling.nextSibling.innerHTML.match(/\d+/)); 
                    if (count > 0 && amounts[unit] < count) { 
                        document.forms[0][unit].value = Math.min(amounts[unit], count); 
                    } 
                } 
            } 
        }
    }else selectAllUnits(1);
} 

function randomFakeScript(amounts, coords) { 
    var coord = coords.split(' '); 
    var coordSplit = coord[Math.floor(Math.random() * coord.length)].split('|'); 
    document.forms[0].x.value = coordSplit[0]; 
    document.forms[0].y.value = coordSplit[1]; 
    
    if(Object.keys(config.amounts).length != 0){
        jQuery('input[class=unitsInput]').val(0); 
        var count; 
        
        for (var unit in amounts) { 
            if (amounts.hasOwnProperty(unit)) { 
                if (amounts[unit] > 0 && typeof document.forms[0][unit] != 'undefined') { 
                    count = parseInt(document.forms[0][unit].nextSibling.nextSibling.innerHTML.match(/\d+/)); 
                    if (count > 0 && amounts[unit] < count) { 
                        document.forms[0][unit].value = Math.min(amounts[unit], count); 
                    }                 
                }           
            }        
        }
    }else selectAllUnits(1);    
} 

