javascript:

if(getParameterByName('screen') != "overview_villages"){
    UI.ErrorMessage("Este script se ejecuta desde Visión General - Tropas",2000);
}else{
  var nombre ="Apoyos Propios";
  var tr = units_table.getElementsByTagName("tr");
  var apoyos = [];
  var pueblo;

  for (var j = 0; j < tr.length; j++) {
      if (tr[j].className == "row_a" || tr[j].className == "row_b") {
        if(tr[j-1].className.includes("units_away")){
          pueblo = tr[j-1].getElementsByTagName("span")[2];
          pueblo = pueblo.innerText;
          pueblo = pueblo.split("(")[1].split(")")[0];
        }
          var tas = tr[j].getElementsByTagName("a");
          if (tas.length > 2) {
              var pl = tas[2].innerHTML;
              var pos = _v(pl,pueblo);
            }else{
              pl = nombre;
              var pos = _v(pl,pueblo);
            }
              if (pos == -1) {
                  var l = apoyos.length;
                  apoyos[apoyos.length] = new Array(11);
                  apoyos[l][0] = pueblo;
                  apoyos[l][1] = pl;
                  apoyos[l][2] = parseInt(tr[j].getElementsByTagName("td")[2].innerHTML);
                  apoyos[l][3] = parseInt(tr[j].getElementsByTagName("td")[3].innerHTML);
                  apoyos[l][4] = parseInt(tr[j].getElementsByTagName("td")[4].innerHTML);
                  apoyos[l][5] = parseInt(tr[j].getElementsByTagName("td")[5].innerHTML);
                  apoyos[l][6] = parseInt(tr[j].getElementsByTagName("td")[6].innerHTML);
                  apoyos[l][7] = parseInt(tr[j].getElementsByTagName("td")[7].innerHTML);
                  apoyos[l][8] = parseInt(tr[j].getElementsByTagName("td")[8].innerHTML);
                  apoyos[l][9] = parseInt(tr[j].getElementsByTagName("td")[9].innerHTML);
                  apoyos[l][10] = parseInt(tr[j].getElementsByTagName("td")[10].innerHTML);
              } else {
                  apoyos[pos][2] += parseInt(tr[j].getElementsByTagName("td")[2].innerHTML);
                  apoyos[pos][3] += parseInt(tr[j].getElementsByTagName("td")[3].innerHTML);
                  apoyos[pos][4] += parseInt(tr[j].getElementsByTagName("td")[4].innerHTML);
                  apoyos[pos][5] += parseInt(tr[j].getElementsByTagName("td")[5].innerHTML);
                  apoyos[pos][6] += parseInt(tr[j].getElementsByTagName("td")[6].innerHTML);
                  apoyos[pos][7] += parseInt(tr[j].getElementsByTagName("td")[7].innerHTML);
                  apoyos[pos][8] += parseInt(tr[j].getElementsByTagName("td")[8].innerHTML);
                  apoyos[pos][9] += parseInt(tr[j].getElementsByTagName("td")[9].innerHTML);
                  apoyos[pos][10] += parseInt(tr[j].getElementsByTagName("td")[10].innerHTML);
              }
      }
   }
   var str = '<div class="popup_menu">Quien me esta apoyando? O.o<a href=javascript:location.reload()>cerrar</a></div><div class="popup_content" style="max-height: 500px; overflow-y: auto;"><h3>Modificado por: Lan Fan & Rabagalan73 </h3><a class="btn" href="#" onclick="exportar();">Exportar</a><table class="vis" style="padding: 3px"><tbody><tr><th width="35" style="text-align:center">Pueblo</th><th width="35" style="text-align:center">Nombre</th><th width="35" style="text-align:center"><img alt="" title="Lancero" src="/graphic/unit/unit_spear.png"></th><th width="35" style="text-align:center"><img alt="" title="Soldado con espada" src="/graphic/unit/unit_sword.png"></th><th width="35" style="text-align:center"><img alt="" title="Soldado con hacha" src="/graphic/unit/unit_axe.png"></th><th width="35" style="text-align:center"><img alt="" title="EspÃa" src="/graphic/unit/unit_spy.png"></th><th width="35" style="text-align:center"><img alt="" title="CaballerÃa ligera" src="/graphic/unit/unit_light.png"></th><th width="35" style="text-align:center"><img alt="" title="CaballerÃa pesada" src="/graphic/unit/unit_heavy.png"></th><th width="35" style="text-align:center"><img alt="" title="Ariete" src="/graphic/unit/unit_ram.png"></th><th width="35" style="text-align:center"><img alt="" title="Catapulta" src="/graphic/unit/unit_catapult.png"></th><th width="35" style="text-align:center"><img alt="" title="Pala" src="/graphic/unit/unit_knight.png"></tr>';
   var strBB = '[table][**][b]Pueblo[/b][||][b]Nombre[/b][||][unit]spear[/unit][||][unit]sword[/unit][||][unit]axe[/unit][||][unit]spy[/unit][||][unit]light[/unit][||][unit]heavy[/unit][||][unit]ram[/unit][||][unit]catapult[/unit][||][unit]snob[/unit][/**]';
   for (var j = 0; j < apoyos.length; j++) {
      str += '<tr>';
      strBB += '[*]';
      for (var k = 0; k < apoyos[j].length; k++) {
          str += '<td>' + apoyos[j][k] + '</td>';
          if (k == 0){
            strBB += apoyos[j][k];
          }else if(k == 1){
            strBB += '[|][player]' + apoyos[j][k] + '[/player]';
          }else{
            strBB += '[|]' + apoyos[j][k];
          }
      }
      str += '</tr>';
   }
   str += '</tbody></table></div>';
   strBB += '[/table]';
   var p = document.createElement("div");
   p.className = "popup_style ui-draggable";
   p.style.width = "auto";
   p.style.position = "fixed";
   p.style.display = "block";
   p.style.top = "130px";
   p.style.left = "50px";
   p.style.margin = "0 auto";
   p.innerHTML = str;
   document.body.appendChild(p);
   function _v(_p,pueblo) {
      var _r = -1;
      if (apoyos.length < 0) _r = -1;
      else {
          for (var t = 0; t < apoyos.length; t++) {
            console.log(apoyos[t][1]);
              if (apoyos[t][1] == _p && apoyos[t][0]==pueblo) return t;
          }
      }
      return _r;
   }
}


function getParameterByName(name, url = window.location.href) {
	return new URL(url).searchParams.get(name);
}

function exportar() {
   var ta = document.createElement("textarea");
   ta.style.height = "800px";
   ta.style.width = "600px";
   var body =document.getElementsByTagName('body')[0];
   body.innerHTML = "";
   ta.value = strBB;
   body.appendChild(ta);
}