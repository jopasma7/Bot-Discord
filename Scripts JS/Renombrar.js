javascript:

var table=document.getElementById("commands_table");
var eleTrs=table.rows;
var headers=eleTrs[0].getElementsByTagName("th");

function getHeader(ele){
    for (i=0;i<headers.length;i++){
        if (headers[i].innerHTML.match(ele, "i")) return i
    }
}

for (x=1;x<eleTrs.length-1;x++){
    var ataque=eleTrs[x];
    var etiqueta=ataque.getElementsByTagName('span')[2].innerHTML;
    if (etiqueta.match(/Ataque a/i)){
        $(ataque).find('.rename-icon').click();
        var spear=eleTrs[x].cells[getHeader('spear')].innerHTML;
        var sword=eleTrs[x].cells[getHeader('sword')].innerHTML;
        var axe=eleTrs[x].cells[getHeader('axe')].innerHTML;
        var scout=eleTrs[x].cells[getHeader('spy')].innerHTML;
        var lc=eleTrs[x].cells[getHeader('light')].innerHTML;
        var hc=eleTrs[x].cells[getHeader('heavy')].innerHTML;
        var ram=eleTrs[x].cells[getHeader('ram')].innerHTML;
        var cat=eleTrs[x].cells[getHeader('catapult')].innerHTML;
        var noble=eleTrs[x].cells[getHeader('snob')].innerHTML;

        console.log("Espias: " +scout + " Ariete: "+ram);

        var coord=etiqueta.match(/(\d+\|\d+)\) (K\d+)/);

        if (scout>=1)etiqueta='Espionaje';
        if (lc>=100 || hc>=150)etiqueta='Granjeo';
        if (spear>=100) etiqueta='Kamikaze';
        if (sword>=100) etiqueta='Kamikaze';
        if (hc>=500) etiqueta='BUM! Lijas';
        if (cat==1 && scout>=1) etiqueta='Fake Cata + Espía!';
        else if (cat==1) etiqueta='Fake Catas!';
        if (cat>=50) etiqueta='BUM! Catas';
        if (ram==1 && scout>=1) etiqueta='Fake Ariete + Espía!';
        else if (ram==1) etiqueta='Fake Arietes!';
        if (axe>=500 && lc>=50) etiqueta='MINI BUM!';
        if (noble==1) etiqueta='Noblesitoh';
        if (axe>=4000 && lc>=2000) etiqueta='BUM!';
        $(ataque).find('input[type=text]').val(etiqueta);$(ataque).find('input[type=button]').click();
    }
}

void(0);