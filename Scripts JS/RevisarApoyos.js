javascript: 

/* 
Script Name: RevisarApoyos
Version: v1.0
Created by: Black_Lottus
*/

// Almacena el total de tropas apoyante.
var tropas_apoyando = {
    spear: 0,
    sword: 0,
    axe: 0,
    archer: 0,
    spy: 0,
    light: 0,
    marcher: 0,
    heavy: 0,
    ram: 0,
    catapult: 0,
    knight: 0,
    snob: 0 
}

// Almacena el apoyo simple.
var apoyo_simple = "";
var apoyo_total = "";

if (document.URL.match("screen=info_village")) {
    
    let collection = [];
    let incomings = true;
    if($("#commands_incomings").length != 0){
        $("#commands_incomings").find("tr").eq(0).find("th").last().after('<th style="white-space: nowrap; width: 150px; text-align: center;">Tropas</th>');
        $("#commands_incomings").find("tr").eq(0).find("th").last().after('<th style="white-space: nowrap; width: 150px; text-align: center;">Total de Apoyos</th>');
        collection =  document.getElementById("commands_incomings").getElementsByClassName("command-row");
    }
    
    if($("#commands_outgoings").length != 0){
        $("#commands_outgoings").find("tr").eq(0).find("th").last().after('<th style="white-space: nowrap; width: 150px; text-align: center;">Tropas</th>');
        $("#commands_outgoings").find("tr").eq(0).find("th").last().after('<th style="white-space: nowrap; width: 150px; text-align: center;">Total de Apoyos</th>');
        collection =  document.getElementById("commands_outgoings").getElementsByClassName("command-row");
        incomings = false;
    }
    
    for (let i = 0; i < collection.length; i++) {

        // Revisa si es un apoyo:
        var iconos = collection[i].getElementsByClassName('icon-container')[0];

        // Revisa si está regresando
        if($(collection[i]).find('.command_hover_details')[0] == undefined) continue;
        var returning = $(collection[i]).find('.command_hover_details')[0].dataset.commandType; // Revisa si el ataque está volviendo.
        
        if(returning == "back" || !iconos.getElementsByClassName('command_hover_details')[0].dataset.iconHint.match(/Apoyo/i)){
            continue;
        }

        // Obtener las tropas del apoyo
        var link = collection[i].querySelector('a').href;
        calculate(link);

        var simpleValue = apoyo_simple;
        var totalValue = apoyo_total;
        
        if(incomings){
            var cuadrito = $("#commands_incomings").find("tr").eq(i+1).find("td").last().after(simpleValue);
            var cuadrito = $("#commands_incomings").find("tr").eq(i+1).find("td").last().last().after(totalValue);
        }else{
            var cuadrito = $("#commands_outgoings").find("tr").eq(i+1).find("td").last().after(simpleValue);
            var cuadrito = $("#commands_outgoings").find("tr").eq(i+1).find("td").last().last().after(totalValue);
        }
        
    }
}

// Accede al ataque y revisa las tropas. Las calcula y cambia el nombre al ataque.
function calculate (link){
    var source = getSourceAsDOM(link);
    // Apoyo simple
    var spear = parseInt(source.getElementsByClassName('unit-item unit-item-spear')[0].textContent);
    var sword = parseInt(source.getElementsByClassName('unit-item unit-item-sword')[0].textContent);
    var axe = parseInt(source.getElementsByClassName('unit-item unit-item-axe')[0].textContent);
    var archer = 0;
    var spy = parseInt(source.getElementsByClassName('unit-item unit-item-spy')[0].textContent);
    var light = parseInt(source.getElementsByClassName('unit-item unit-item-light')[0].textContent);
    var marcher = 0;
    var heavy = parseInt(source.getElementsByClassName('unit-item unit-item-heavy')[0].textContent);
    var ram = parseInt(source.getElementsByClassName('unit-item unit-item-ram')[0].textContent);
    var catapult = parseInt(source.getElementsByClassName('unit-item unit-item-catapult')[0].textContent);
    var knight = 0;
    var snob = parseInt(source.getElementsByClassName('unit-item unit-item-snob')[0].textContent);

    if(source.getElementsByClassName('unit-item unit-item-archer')[0] != undefined){
        archer = parseInt(source.getElementsByClassName('unit-item unit-item-archer')[0].textContent);
        marcher = parseInt(source.getElementsByClassName('unit-item unit-item-marcher')[0].textContent);
        tropas_apoyando.archer = tropas_apoyando.archer + archer;
        tropas_apoyando.marcher = tropas_apoyando.marcher + marcher;
    }
    if(source.getElementsByClassName('unit-item unit-item-knight')[0] != undefined){
        knight = parseInt(source.getElementsByClassName('unit-item unit-item-knight')[0].textContent);
        tropas_apoyando.knight = tropas_apoyando.knight + knight;
    }

    // Apoyo total
    tropas_apoyando.spear = tropas_apoyando.spear + spear; 
    tropas_apoyando.sword = tropas_apoyando.sword + sword;
    tropas_apoyando.axe = tropas_apoyando.axe + axe;
    tropas_apoyando.spy = tropas_apoyando.spy + spy;
    tropas_apoyando.light = tropas_apoyando.light + light;
    tropas_apoyando.heavy = tropas_apoyando.heavy + heavy;
    tropas_apoyando.ram = tropas_apoyando.ram + ram;
    tropas_apoyando.catapult = tropas_apoyando.catapult + catapult;
    tropas_apoyando.snob = tropas_apoyando.snob + snob;

    //console.log("Tropas Totales: " + tropas_apoyando.spear + " " + tropas_apoyando.sword + " " + tropas_apoyando.axe + " " + tropas_apoyando.archer + " " + tropas_apoyando.spy + " " + tropas_apoyando.light + " " + tropas_apoyando.marcher + " " + tropas_apoyando.heavy + " " + tropas_apoyando.ram + " " + tropas_apoyando.catapult + " " + tropas_apoyando.knight + " " + tropas_apoyando.snob);
    apoyo_simple = "";
    let tropas_simple = ``;
    let tropas = ``;

    console.log(">> Calculando apoyo simple: " + "Lanzas: " + spear + " Espadas: " + sword + " Hachas: " + axe + " Arqueros: " + archer + " Espías: " + spy + " Caballería Ligera: " + light + " Arqueros a caballo: " + marcher + " Caballería Pesada: " + heavy + " Arietes: " + ram + " Catapultas: " + catapult + " Paladines: " + knight + " Nobles: " + snob);
    console.log(">> Calculando apoyo total: " + "Lanzas: " + tropas_apoyando.spear + " Espadas: " + tropas_apoyando.sword + " Hachas: " + tropas_apoyando.axe + " Arqueros: " + tropas_apoyando.archer + " Espías: " + tropas_apoyando.spy + " Caballería Ligera: " + tropas_apoyando.light + " Arqueros a caballo: " + tropas_apoyando.marcher + " Caballería Pesada: " + tropas_apoyando.heavy + " Arietes: " + tropas_apoyando.ram + " Catapultas: " + tropas_apoyando.catapult + " Paladines: " + tropas_apoyando.knight + " Nobles: " + tropas_apoyando.snob);
    
    if(spear != 0) tropas_simple += 
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_spear.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]spear', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Lancero">
        <span>${spear}</span> 
    </span> `;
    if(sword != 0) tropas_simple +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_sword.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]sword', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Soldado con espada">
        <span>${sword}</span>
    </span> `;
    if(axe != 0) tropas_simple +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_axe.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]axe', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Soldado con hacha">
        <span>${axe}</span>
    </span> `;
    if(archer != 0) tropas_simple +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_archer.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]archer', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Arquero">
        <span>${archer}</span>
    </span> `;
    if(spy != 0) tropas_simple +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_spy.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]spy', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Espía">
        <span>${spy}</span>
    </span> `;
    if(light != 0) tropas_simple +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_light.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]light', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Caballería ligera">
        <span>${light}</span>
    </span> `;
    if(marcher != 0) tropas_simple +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_marcher.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]marcher', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Arquero a caballo">
        <span>${marcher}</span>
    </span> `;
    if(heavy != 0) tropas_simple +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_heavy.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]heavy', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Caballería pesada">
        <span>${heavy}</span>
    </span> `;
    if(ram != 0) tropas_simple +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_ram.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]ram', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Ariete">
        <span>${ram}</span>
    </span> `;
    if(catapult != 0) tropas_simple +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_catapult.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]catapult', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Catapulta">
        <span>${catapult}</span>
    </span> `;
    if(knight != 0) tropas_simple +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_knight.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]knight', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Paladín">
        <span>${knight}</span>
    </span> `;
    if(snob != 0) tropas_simple +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_snob.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]snob', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Noble">
        <span>${snob}</span>
    </span> `;
    

    // Devolver para tropas totales los valores si no son 0
    if(tropas_apoyando.spear != 0) tropas += 
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_spear.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]spear', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Lancero">
        <span>${tropas_apoyando.spear}</span> 
    </span> `;
    if(tropas_apoyando.sword != 0) tropas +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_sword.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]sword', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Soldado con espada">
        <span>${tropas_apoyando.sword}</span>
    </span> `;
    if(tropas_apoyando.axe != 0) tropas += 
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_axe.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]axe', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Soldado con hacha">
        <span>${tropas_apoyando.axe}</span>
    </span> `;
    if(tropas_apoyando.archer != 0) tropas +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_archer.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]archer', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Arquero">
        <span>${tropas_apoyando.archer}</span>
    </span> `;
    if(tropas_apoyando.spy != 0) tropas +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_spy.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]spy', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Espía">
        <span>${tropas_apoyando.spy}</span>
    </span> `;
    if(tropas_apoyando.light != 0) tropas +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_light.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]light', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Caballería ligera">
        <span>${tropas_apoyando.light}</span>
    </span> `;
    if(tropas_apoyando.marcher != 0) tropas +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_marcher.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]marcher', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Arquero a caballo">
        <span>${tropas_apoyando.marcher}</span>
    </span> `;
    if(tropas_apoyando.heavy != 0) tropas +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_heavy.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]heavy', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Caballería pesada">
        <span>${tropas_apoyando.heavy}</span>
    </span> `;
    if(tropas_apoyando.ram != 0) tropas +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_ram.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]ram', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Ariete">
        <span>${tropas_apoyando.ram}</span>
    </span> `;
    if(tropas_apoyando.catapult != 0) tropas +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_catapult.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]catapult', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Catapulta">
        <span>${tropas_apoyando.catapult}</span>
    </span> `;
    if(tropas_apoyando.knight != 0) tropas +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_knight.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]knight', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Paladín">
        <span>${tropas_apoyando.knight}</span>
    </span> `;
    if(tropas_apoyando.snob != 0) tropas +=
    `<span style="display: inline-flex; align-items: center; gap: 5px;">
        <img src="https://dses.innogamescdn.com/asset/95eda994/graphic/unit/unit_snob.png" 
            style="cursor: pointer; width: 20px; height: 20px;" 
            onclick="BBCodes.insert('[unit]snob', '[/unit]'); $(this).parent().parent().hide();" 
            class="" data-title="Noble">
        <span>${tropas_apoyando.snob}</span>
    </span> `;   

    
    apoyo_total = 
    `<td style="white-space: nowrap; width: 150px; text-align: center;">
        ${tropas}
    </td>
    `;

    apoyo_simple = 
    `<td style="white-space: nowrap; width: 150px; text-align: center;">
        ${tropas_simple}
    </td>
    `;

    return;
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