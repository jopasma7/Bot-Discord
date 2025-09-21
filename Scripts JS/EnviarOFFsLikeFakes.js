// Selecciona el modo:

mode = "random";

coords='435|445 439|447';


var doc=document;

if(window.frames.length>0)doc=window.main.document;url=doc.URL;
if(url.indexOf('screen=place')==-1)alert('Este script se usa desde la plaza');


coords=coords.split(' ');

// Random Mode
if(mode.toLowerCase() == "random"){
    index=Math.round(Math.random()*(coords.length-1));
}else{

}



doc.forms[0].input.value=coords[index];
insertUnit(doc.forms[0].spear,1);
insertUnit(doc.forms[0].sword,1);
insertUnit(doc.forms[0].axe,1);
insertUnit(doc.forms[0].spy,1);
insertUnit(doc.forms[0].light,1);
insertUnit(doc.forms[0].heavy,1);
insertUnit(doc.forms[0].ram,1);
insertUnit(doc.forms[0].catapult,1);

void(0)


javascript: 

var config = { 
    "unitAmounts": {
        "spear": 0,
        "sword": 0,
        "axe": 0,
        "archer": 0,
        "spy": 5,
        "light": 0,
        "marcher": 0,
        "heavy": 0,
        "ram": 0,
        "catapult": 0,
        "knight": 0,
        "snob": 0,
    },
    "coords": "476|605 482|582",
    "sendMode": "sequential",
    "full": true
}; 

function sequentialFakeScript(unitAmounts, coords, full) { 
    coords = coords.split(' '); 
    index = 0; 
    fakecookie = document.cookie.match('(^|;) ?farm=([^;]*)(;|$)'); 
    if (fakecookie != null) index = parseInt(fakecookie[2]); 
    if (index >= coords.length) alert('All villages were extracted, now start from the first!'); 
    if (index >= coords.length) index = 0; 
    
    coords = coords[index]; 
    coords = coords.split('|'); 
    index = index + 1; 
    cookie_date = new Date(2030, 1, 1); 
    document.cookie = 'farm=' + index + ';expires=' + cookie_date.toGMTString(); 
    document.forms[0].x.value = coords[0]; 
    document.forms[0].y.value = coords[1];
    
    jQuery('input[class=unitsInput]').val(0); 
    var count; 
    
    for (var unit in unitAmounts) { 
        if (unitAmounts.hasOwnProperty(unit)) {
            if (unitAmounts[unit] > 0 && typeof document.forms[0][unit] != 'undefined') { 
                count = parseInt(document.forms[0][unit].nextSibling.nextSibling.innerHTML.match(/\d+/)); 
                if (count > 0 && unitAmounts[unit] < count) { 
                    document.forms[0][unit].value = Math.min(unitAmounts[unit], count); 
                } 

                if(full){
                    document.forms[0][unit].value = Math.max(unitAmounts[unit], count); 
                }
            } 
        } 
    } 
} 

if (game_data.screen === 'place' && game_data.mode === null) { 
    const { unitAmounts, coords, full } = config; 
    sequentialFakeScript(unitAmounts, coords, full); 
} else {
     UI.InfoMessage('Redirecting...'); 
     
     setTimeout(function () { window.location.assign(game_data.link_base_pure + 'place'); }, 500); 
}