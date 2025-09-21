javascript:

//***************************************//
//** SCRIPT DE LA TRIBU TOX PARA FAKES **//
//***************************************//
// Si quieres cambiar las unidades con las que mandarás fakes, aquí los valores.

// ** Lanzas | Espadas | Hachas ** //
// ** Espías | Cav. Ligera | Cav. Pesada ** //
// ** Catapultas | Arietes ** //



// Introduce las coordenadas de los pueblos donde quieres enviar fakes.
coords='477|452 456|445'; 

//*************//
//** SCRIPT **//
//***********//
var doc=document;
if(window.frames.length>0) doc=window.main.document;url=doc.URL;

if(url.indexOf('screen=place')==-1 || url.indexOf('screen=info_ally')==-1 ) {
    if(url.indexOf('screen=info_ally') ==-1){
        coords=coords.split(' ');
        index=window.localStorage.getItem('atIdx');

        if(index==null||parseInt(index)+1>coords.length-1){
            index=0;
        }else{
            index++;
        }

        window.localStorage.setItem('atIdx',index);
        coords=coords[index];
        coords=coords.split('|');
        doc.forms[0].x.value=coords[0];
        doc.forms[0].y.value=coords[1];

        securedInsertUnit = (e, u) => e.getAttribute('data-all-count') > 0 && insertUnit(e, u);
        securedInsertUnit(doc.forms[0].spear, sp);
        securedInsertUnit(doc.forms[0].sword, sw);
        securedInsertUnit(doc.forms[0].axe, ax);
        securedInsertUnit(doc.forms[0].spy, scout);
        securedInsertUnit(doc.forms[0].light, lc);
        securedInsertUnit(doc.forms[0].heavy, hv);
        securedInsertUnit(doc.forms[0].ram, ra);
        securedInsertUnit(doc.forms[0].catapult, cat);

    }else{
        // Tribe
        newCoords=coords.split(' ');

        var array = new Array();
        var content = doc.getElementById("content_value");
        var rows = content.getElementsByTagName("table")[2].getElementsByTagName("tbody")[0].rows

        for(var i=1;i<rows.length;i++){
            var perfil = rows[i].getElementsByTagName("td")[0].getElementsByTagName("a")[0].href; // Player Profile page!
            var DOM = getSourceAsDOM(perfil+""); 
            var tds = DOM.getElementsByTagName("TD");

            for(var a=0;a<tds.length;a++){
                var inner = tds[a].innerHTML;
                if(/^\d+\|\d+$/.test(inner)){
                    if(newCoords.includes(inner)) console.log("Eliminando: "+inner);
                    else array.push(inner);
                }
            }   
        }
        array = array.join(' ');
        //coords = array;
        // Print new Array in Coords

    }


}else alert('Este script se usa desde la plaza');


function getSourceAsDOM(url){
    xmlhttp=new XMLHttpRequest();
    xmlhttp.open("GET",url,false);
    xmlhttp.send();
    parser=new DOMParser();
    return parser.parseFromString(xmlhttp.responseText,"text/html");      
}

console.log(coords);



void(0)