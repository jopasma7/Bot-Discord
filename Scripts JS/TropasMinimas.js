javascript:

var imputTroops = {
    spear: 100,
    sword: 100,
    axe: 0,
    archer: 100,
    spy: 100,
    light: 0,
    marcher: 0,
    heavy: 0,
    ram: 0,
    catapult: 50,
    knight: 0,
    snob: 0
}

var form = document.getElementById("command-data-form");
var entryTroops = form.getElementsByClassName("units-entry-all");
var imputTroops = form.getElementsByTagName("input");

var sTroops = "";
for(var i = 0 ; i<entryTroops.length ; i++){
    var content = entryTroops[i].textContent.replace(")","").replace("(","");
    if(i == entryTroops.length -1){
        sTroops = sTroops + content;
    }else sTroops = sTroops + content + "|";
}

var arrayTroops = sTroops.split("|");


if(imputTroops.archer != undefined){
    imputTroops.spear.setAttribute('value',calc(0,units.spear));
    imputTroops.sword.setAttribute('value',calc(1,units.sword));
    imputTroops.axe.setAttribute('value',calc(2,units.axe));
    imputTroops.archer.setAttribute('value',calc(3,units.archer));
    imputTroops.spy.setAttribute('value',calc(4,units.spy));
    imputTroops.light.setAttribute('value',calc(5,units.light));
    imputTroops.marcher.setAttribute('value',calc(6,units.marcher));
    imputTroops.heavy.setAttribute('value',calc(7,units.heavy));
    imputTroops.ram.setAttribute('value',calc(8,units.ram));
    imputTroops.catapult.setAttribute('value',calc(9,units.catapult));
    imputTroops.knight.setAttribute('value',calc(10,units.knight));
    imputTroops.snob.setAttribute('value',calc(11,units.snob));
}else{
    imputTroops.spear.setAttribute('value',calc(0,units.spear));
    imputTroops.sword.setAttribute('value',calc(1,units.sword));
    imputTroops.axe.setAttribute('value',calc(2,units.axe));
    imputTroops.spy.setAttribute('value',calc(3,units.spy));
    imputTroops.light.setAttribute('value',calc(4,units.light));
    imputTroops.heavy.setAttribute('value',calc(5,units.heavy));
    imputTroops.ram.setAttribute('value',calc(6,units.ram));
    imputTroops.catapult.setAttribute('value',calc(7,units.catapult));
    imputTroops.knight.setAttribute('value',calc(8,units.knight));
    imputTroops.snob.setAttribute('value',calc(9,units.snob));
}



function calc(number, unit){
    var num =  (parseInt(arrayTroops[number]) - unit);

    if(num < 0) return 0
    else return num;
}

void(0);



javascript: 

(function(By, Chinezu) {
    $('.quickedit-label').each(function(i, e) {
    if (Chinezu.Rename.indexOf($(e).text().trim()) != -1) {
        $(e).parent().parent().parent().parent().find('input[type="checkbox"]').prop('checked', !0);
        By = !0;
    }
    });
    if (By) {
        var name = $('input[name="label_format"]');
        name.val(Chinezu.Name);
        $('input[name="label"]').click();
        var link = $(e).parent()[0];
        link.style.color = 'red';
    } else document.location.reload(!By);
    })(!1, {
        Rename: ['Ataque', 'Apoyo'],
        Name: '%unit% (%coords%) %player% - %sent%'
    })