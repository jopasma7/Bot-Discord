

javascript:

/*
 * Script Name: RenamerRabita
 * Version: v1.0
 * Created by: Black_Lottus
 * Desc: Este script te permite renombrar algunos ataques entrantes de forma más rápida y eficiente.
 */

xd();

function xd (){

    var table = document.getElementById('incomings_table').rows; // Tabla de entrantes.
    // Hay que eliminar la primera y la última.

    for(row = 1; row<(table.length-1); row++){
        
        // Marca el checkbox del ladito si el Ataque no está renombrado.
        //$(table[row].getElementsByClassName('quickedit-label')[0]).parent().parent().parent().parent().find('input[type="checkbox"]').prop('checked', !0);

        console.log("Analizando el "+row);
        var text = table[row].getElementsByClassName('quickedit-label')[0].textContent.trim(); // Recoge el TextContent del Ataque entrante.
        console.log("Nombre: "+text);
        if(text.includes("[❓]") || text.includes("[✔️]") || text.includes("[💥]")){ // Si ya está renombrado, pasa al siguiente.{
            console.log("El ataque "+row+" ya está renombrado.");
            continue; // Si ya está renombrado, pasa al siguiente.
        }

        // Recoge el link del pueblo.
        var href = table[row].getElementsByTagName('td')[2].getElementsByTagName('a')[0].href;
        var doc = getSourceAsDOM(href);

        

        //var text = "%unit% - %player% [❓]";
        table[row].getElementsByClassName('quickedit-content')[0].getElementsByTagName('a')[1].click(); // Click botón de renombrar.
        var text = table[row].getElementsByClassName('quickedit-edit')[0].getElementsByTagName('input')[0].value;
        
        var all_notes = doc.getElementsByClassName('village-note');
       
        var player_name = doc.querySelectorAll('.vis')[0].rows[4].cells[1].textContent; // Recoge el nombre de usuario del jugador que tiene el pueblo.

        var rojo = false;
        var azul = false;
        
        for(var notes = 0; notes < all_notes.length; notes++){ // Recorre todas las notas colocadas.
            var nota = all_notes[notes].getElementsByClassName('village-note-body')[0].textContent.trim();
            
            if(nota.replace("\n","").slice() != ""){    
                if(nota.includes(player_name)){ // Revisa si el jugador de la nota es el mismo que el del pueblo. (Para notas old)
                    if(nota.includes("Pueblo ➢ Posible Ofensivo")){      
                        rojo = true;
                        break;
                    }
                    if(nota.includes("Pueblo ➢ Posible Defensivo") || nota.includes("Pueblo ➢ Alta Probabilidad de Defensivo")){      
                        azul = true;
                        break;
                    }
                }                    
            }
        }

        console.log("Normal: "+text);
        var nextText= text.replace(" (🔴)","").replace(" (🔵)","").replace(" (⚪)","");
        console.log("Edit: "+nextText);

        if(!nextText.includes("[❓]")){
            nextText = nextText + " [❓]";
        }

        if(rojo) nextText += " (🔴)";
        else if(azul) nextText += " (🔵)";
        else nextText += " (⚪)";

        

        table[row].getElementsByClassName('quickedit-edit')[0].getElementsByTagName('input')[0].value = nextText; // Cambia el nombre
        table[row].getElementsByClassName('quickedit-edit')[0].getElementsByTagName('input')[1].click(); // Click boton de guardar el renombrado.  
        
        
    }
    
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



// Este método es para cuando se pueda renombrar bien.
// De momento no sirve.
function xd2 (){

    var table = document.getElementById('incomings_table').rows; // Tabla de entrantes.
    // Hay que eliminar la primera y la última.

    for(row = 1; row<(table.length-1); row++){
        
        // Marca el checkbox del ladito si el Ataque no está renombrado.
        //$(table[row].getElementsByClassName('quickedit-label')[0]).parent().parent().parent().parent().find('input[type="checkbox"]').prop('checked', !0);

        var ataque = table[row].getElementsByClassName('quickedit-label')[0].textContent.trim(); // Recoge el TextContent del Ataque entrante.       
            if(ataque == "Ataque"){
                // Recoge el link del pueblo.
                var href = table[row].getElementsByTagName('td')[2].getElementsByTagName('a')[0].href;
                var doc = getSourceAsDOM(href);               

                var text = "%unit% %player% [❓]";
                table[row].getElementsByClassName('quickedit-content')[0].getElementsByTagName('a')[1].click(); // Click botón de renombrar.
                //var text = table[row].getElementsByClassName('quickedit-edit')[0].getElementsByTagName('input')[0].value;
                var all_notes = doc.getElementsByClassName('village-note');
            
                var rojo = false;
                var azul = false;
                for(var notes = 0; notes < all_notes.length; notes++){ // Recorre todas las notas colocadas.
                    var nota = all_notes[notes].getElementsByClassName('village-note-body')[0].textContent.trim();
                    
                    if(nota.replace("\n","").slice() != ""){           
                        if(nota.includes("Pueblo ➢ Posible Ofensivo") || nota.toUpperCase().includes("OFF")){      
                            rojo = true;
                            break;
                        }
                        if(nota.includes("Pueblo ➢ Posible Defensivo") || nota.toUpperCase().includes("DEFF")){      
                            azul = true;
                            break;
                        }
                    }
                }

                if(rojo) text += " (🔴)";
                else if(azul) text += " (🔵)";
                else text += " (⚪)";

                table[row].getElementsByClassName('quickedit-edit')[0].getElementsByTagName('input')[0].value = text; // Cambia el nombre
                table[row].getElementsByClassName('quickedit-edit')[0].getElementsByTagName('input')[1].click(); // Click boton de guardar el renombrado.
                    }

                
        
        
        
    }
    
}


