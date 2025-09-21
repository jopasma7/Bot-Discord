/*
 * Script Name: DividirOFF
 * Version: v1.0
 * Created by: Black_Lottus
 * Desc: This script allow you to split your trops in % when you atack someone.
 */

javascript:

/* COMENTARIO DE AYUDA */
// Selecciona que tropas quieres que sean divididas en % en los ataques. 
// Establece el valor en 'true' o 'false'.
/*var units = {
    'spear': false,
    'sword': false,
    'axe': true,
    'archer': false,
    'spy': true,
    'light': true,
    'marcher': true,
    'heavy': false,
    'ram': true,
    'catapult': true
};


/* COMENTARIO DE AYUDA */
// Coloca el % de tropas que quieres que sea asignado en cada ataque.
// El valor entre '' que hay es el % de tropas que se enviará en cada ataque. 
// La suma de los % nunca debe exeder el 100% o no enviará el ataque.

// El primer ataque está bloqueado porque es el que ponemos primero en la plaza de reuniones.
// El resto de ataques puedes asignar el % que quieras.
// NOTA : Para 2 ataques no es necesario porque el GT ya divide las tropas por defecto.
// Pero puedes usarlo igualmente por si deseas establecer un % de tropas diferente y que no sea el 50% justo.

/*var attacks = {

    // Caso en el que mandas 5 ataques.
    five : { 
        first: 0, // Ataque nº 1 bloqueado no se puede cambiar.
        second: 50, // % de tropa en el ataque nº 2.
        third: 20, // % de tropa en el ataque nº 3.
        fourth: 15, // % de tropa en el ataque nº 4.
        fifth: 15 // % de tropa en el ataque nº 5.
    },

    four : {
        first: 0,
        second: 30,
        third: 10,
        fourth: 10,
    },

    three : {
        first: 0,
        second: 30,
        third: 20,
    },

    two : {
        first: 0,
        second: 30,
    }
};*/

var troops = {
    spear : 0, sword : 0, axe : 0, archer : 0,
    spy : 0, light : 0, marcher : 0, heavy : 0,
    ram : 0, catapult : 0
}

var total_troops = {
    spear : 0, sword : 0, axe : 0, archer : 0,
    spy : 0, light : 0, marcher : 0, heavy : 0,
    ram : 0, catapult : 0
}

if(2 == window.location.href.split("try=").length){
    var table = $('#place_confirm_units')[0];
    getValues(table);
    substract(table);
    applyValues(table);
    putTotal(table);
}else UI.ErrorMessage("Este script se ejecuta desde la confirmación de un ataque en la plaza de reuniones.");

void(0);

function putTotal(table){
    var row = table.rows.length-1;
    table.rows[row].getElementsByClassName("unit-item-spear")[0].textContent = total_troops.spear;
    table.rows[row].getElementsByClassName("unit-item-sword")[0].textContent = total_troops.sword;
    table.rows[row].getElementsByClassName("unit-item-axe")[0].textContent = total_troops.axe;
    table.rows[row].getElementsByClassName("unit-item-spy")[0].textContent = total_troops.spy;
    table.rows[row].getElementsByClassName("unit-item-light")[0].textContent = total_troops.light;
    table.rows[row].getElementsByClassName("unit-item-heavy")[0].textContent = total_troops.heavy;
    table.rows[row].getElementsByClassName("unit-item-ram")[0].textContent = total_troops.ram;
    table.rows[row].getElementsByClassName("unit-item-catapult")[0].textContent = total_troops.catapult;
    try{
        table.rows[row].getElementsByClassName("unit-item-archer")[0].textContent = total_troops.archer;
        table.rows[row].getElementsByClassName("unit-item-marcher")[0].textContent = total_troops.marcher;
    }catch(e){}
}

function getValues(table){

    // Recogiendo los valores de la tabla.
    console.log("Spear: "+troops.spear);
    troops.spear = parseInt(table.rows[1].getElementsByClassName("unit-item-spear")[0].textContent);
    troops.sword  = parseInt(table.rows[1].getElementsByClassName("unit-item-sword")[0].textContent);
    troops.axe  = parseInt(table.rows[1].getElementsByClassName("unit-item-axe")[0].textContent);
    troops.spy  = parseInt(table.rows[1].getElementsByClassName("unit-item-spy")[0].textContent);
    troops.light  = parseInt(table.rows[1].getElementsByClassName("unit-item-light")[0].textContent);
    troops.heavy  = parseInt(table.rows[1].getElementsByClassName("unit-item-heavy")[0].textContent);
    troops.ram  = parseInt(table.rows[1].getElementsByClassName("unit-item-ram")[0].textContent);
    troops.catapult = parseInt(table.rows[1].getElementsByClassName("unit-item-catapult")[0].textContent);

    // Para mundos donde los arqueros están activos.
    try{
        troops.archer = parseInt(table.rows[1].getElementsByClassName("unit-item-archer")[0].textContent);
        troops.marcher = parseInt(table.rows[1].getElementsByClassName("unit-item-marcher")[0].textContent);
    }catch(ex){}

    console.log("Troops: "+troops.spear+" "+troops.sword+" "+troops.axe+" "+troops.archer+" "+troops.spy+" " + 
        troops.light+" "+troops.marcher+" "+troops.heavy+" "+troops.ram+" "+troops.catapult);
}

// Resta las unidades del primer ataques a las unidades globales.
function substract(table){
    troops.spear = troops.spear - parseInt(table.rows[2].getElementsByClassName("unit-item-spear")[0].textContent);
    total_troops.spear += parseInt(table.rows[2].getElementsByClassName("unit-item-spear")[0].textContent);

    troops.sword  = troops.sword - parseInt(table.rows[2].getElementsByClassName("unit-item-sword")[0].textContent);
    total_troops.sword  += parseInt(table.rows[2].getElementsByClassName("unit-item-sword")[0].textContent);

    troops.axe  = troops.axe - parseInt(table.rows[2].getElementsByClassName("unit-item-axe")[0].textContent);
    total_troops.axe  += parseInt(table.rows[2].getElementsByClassName("unit-item-axe")[0].textContent);

    troops.spy  = troops.spy - parseInt(table.rows[2].getElementsByClassName("unit-item-spy")[0].textContent);
    total_troops.spy  += parseInt(table.rows[2].getElementsByClassName("unit-item-spy")[0].textContent);

    troops.light  = troops.light - parseInt(table.rows[2].getElementsByClassName("unit-item-light")[0].textContent);
    total_troops.light  += parseInt(table.rows[2].getElementsByClassName("unit-item-light")[0].textContent);

    troops.heavy  = troops.heavy - parseInt(table.rows[2].getElementsByClassName("unit-item-heavy")[0].textContent);
    total_troops.heavy  += parseInt(table.rows[2].getElementsByClassName("unit-item-heavy")[0].textContent);

    troops.ram  = troops.ram - parseInt(table.rows[2].getElementsByClassName("unit-item-ram")[0].textContent);
    total_troops.ram  += parseInt(table.rows[2].getElementsByClassName("unit-item-ram")[0].textContent);

    troops.catapult = troops.catapult - parseInt(table.rows[2].getElementsByClassName("unit-item-catapult")[0].textContent);
    total_troops.catapult += parseInt(table.rows[2].getElementsByClassName("unit-item-catapult")[0].textContent);

    // Para mundos donde los arqueros están activos.
    try{
        troops.archer = troops.archer - parseInt(table.rows[2].getElementsByClassName("unit-item-archer")[0].textContent);
        total_troops.archer += parseInt(table.rows[2].getElementsByClassName("unit-item-archer")[0].textContent);
        troops.marcher = troops.marcher - parseInt(table.rows[2].getElementsByClassName("unit-item-marcher")[0].textContent);
        total_troops.marcher += parseInt(table.rows[2].getElementsByClassName("unit-item-marcher")[0].textContent);
    }catch(ex){}

    console.log("Troops: "+troops.spear+" "+troops.sword+" "+troops.axe+" "+troops.archer+" "+troops.spy+" " + 
        troops.light+" "+troops.marcher+" "+troops.heavy+" "+troops.ram+" "+troops.catapult);
}

function applyValues(table){
    if(table.rows.length == 8){
        // Caso de 5 ataques.
        travel(table, 3, attacks.five.second);
        travel(table, 4, attacks.five.third);
        travel(table, 5, attacks.five.fourth);
        travel(table, 6, attacks.five.fifth);
        UI.SuccessMessage("Tropas para 5 ataques agregadas a los campos correctamente.",2000);
    }else if(table.rows.length == 7){
        // Caso de 4 ataques.
        travel(table, 3, attacks.four.second);
        travel(table, 4, attacks.four.third);
        travel(table, 5, attacks.four.fourth);
        UI.SuccessMessage("Tropas para 4 ataques agregadas a los campos correctamente.",2000);
    }else if(table.rows.length == 6){
        // Caso de 3 ataques.
        travel(table, 3, attacks.three.second);
        travel(table, 4, attacks.three.third);
        UI.SuccessMessage("Tropas para 3 ataques agregadas a los campos correctamente.",2000);
    }else if(table.rows.length == 5){
        // Caso de 2 ataques.
        travel(table, 3, attacks.two.second);
        UI.SuccessMessage("Tropas para 2 ataques agregadas a los campos correctamente.",2000);
    }else if(table.rows.length == 4){
        UI.ErrorMessage("Añade ataques adicionales para que funcione el script y pueda dividir las tropas.");
    }else{
        UI.ErrorMessage("Algo ha fallado. ¿Estás usando el script correctamente?");
    }
}

function travel(table, row, percentage){
    var val;
    if(units.spear == true) {
        val = parseInt((troops.spear * percentage) / 100);
        table.rows[row].querySelectorAll('[data-unit="spear"]')[0].value = val;
        total_troops.spear += val;
    }
    if(units.sword == true) {
        val = parseInt((troops.sword * percentage) / 100);
        table.rows[row].querySelectorAll('[data-unit="sword"]')[0].value = parseInt((troops.sword * percentage) / 100);
        total_troops.sword += val;
    }
    if(units.axe == true) {
        val = parseInt((troops.axe * percentage) / 100);
        table.rows[row].querySelectorAll('[data-unit="axe"]')[0].value = parseInt((troops.axe * percentage) / 100);
        total_troops.axe += val;
    }
    
    if(units.spy == true) {
        val = parseInt((troops.spy * percentage) / 100);
        table.rows[row].querySelectorAll('[data-unit="spy"]')[0].value = parseInt((troops.spy * percentage) / 100);
        total_troops.spy += val;
    }
    if(units.light == true) {
        val = parseInt((troops.light * percentage) / 100);
        table.rows[row].querySelectorAll('[data-unit="light"]')[0].value = parseInt((troops.light * percentage) / 100);
        total_troops.light += val;
    }
    
    if(units.heavy == true) {
        val = parseInt((troops.heavy * percentage) / 100);
        table.rows[row].querySelectorAll('[data-unit="heavy"]')[0].value = parseInt((troops.heavy * percentage) / 100);
        total_troops.heavy += val;
    }
    if(units.ram == true) {
        val = parseInt((troops.ram * percentage) / 100);
        table.rows[row].querySelectorAll('[data-unit="ram"]')[0].value = parseInt((troops.ram * percentage) / 100)
        total_troops.ram += val;
    }
    if(units.catapult == true) {
        val = parseInt((troops.catapult * percentage) / 100);
        table.rows[row].querySelectorAll('[data-unit="catapult"]')[0].value = parseInt((troops.catapult * percentage) / 100);
        total_troops.catapult += val;
    }

    try{
        if(units.archer == true) {
            val = parseInt((troops.archer * percentage) / 100);
            table.rows[row].querySelectorAll('[data-unit="archer"]')[0].value = parseInt((troops.archer * percentage) / 100);
            total_troops.archer += val;
    }
        if(units.marcher == true) {
            val = parseInt((troops.marcher * percentage) / 100);
            table.rows[row].querySelectorAll('[data-unit="marcher"]')[0].value = parseInt((troops.marcher * percentage) / 100);
            total_troops.marcher += val;
    }
    }catch(ex){}
}
