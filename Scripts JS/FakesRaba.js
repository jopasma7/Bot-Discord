// Script modificado por Rabagalan73

limiteEngaño = 2;
var coords = window.coords;
var fakeLimit = parseInt(window.limiteEngaño || 1);

var doc = document;

if (window.frames.length > 0 && window.main != null) {
  doc = window.main.document;
}

var url = doc.URL;

if (url.indexOf('screen=place') === -1) {
  window.open('game.php?screen=place', '_self');
}

var puntos = game_data.village.points;
var limiteEngaño = Math.floor((puntos * fakeLimit) / 100);
var popTotal = 0;
var coordsDistancia = {};

coords = coords.split(' ');
crearArrayCoordenadas(coords);
var coordsOrdenadas = ordenarCoordenadas(coordsDistancia);

index = 0;
farmcookie = document.cookie.match('(^|;) ?farm=([^;]*)(;|$)');
if (farmcookie != null)
  index = parseInt(farmcookie[2]);

  if (index >= coordsOrdenadas.length)
    alert('Se han mostrado todos los pueblos introducidos, ahora volverán a repetirse desde el principio.');

  if (index >= coordsOrdenadas.length)
    index = 0;
    coords = coordsOrdenadas[index][0];
    coords = coords.split('|');
    index = index+1;
    cookie_date = new Date(2031,3,27);
    document.cookie = 'farm='+index+';expires='+cookie_date.toGMTString();

    doc.forms[0].x.value = coords[0];
    doc.forms[0].y.value = coords[1];

    var avisosDiv = document.getElementById('command-form-warning');
    if (document.getElementById('errorDiv') === null){
      var errorDiv = document.createElement('div');
    }
    if (document.getElementById('objetivosDiv') === null){
      var objetivosDiv = document.createElement('div');
    }

    $('#place_target').find('input').val(coords[0]+'|'+coords[1]);

    if ((doc.forms[0].sword.dataset.allCount * popUnidades['sword']) + (doc.forms[0].spear.dataset.allCount * popUnidades['spear']) + (doc.forms[0].spy.dataset.allCount * popUnidades['spy']) >= limiteEngaño && doc.forms[0].axe.dataset.allCount <= 10) {
      var esDeff = true;
    } else if ((doc.forms[0].axe.dataset.allCount * popUnidades['axe']) + (doc.forms[0].light.dataset.allCount * popUnidades['light']) + (doc.forms[0].spy.dataset.allCount * popUnidades['spy']) >= limiteEngaño){
      var esOff = true;
    } else {
      var sinGrupo = true;
    }

    if (doc.forms[0].ram.dataset.allCount >= 1)
      var tieneArietes = true;
    
    if (doc.forms[0].catapult.dataset.allCount >= 1)
      var tieneCatas = true;

    setTimeout(function() {
      objetivosDiv.id = "objetivosDiv";
      objetivosDiv.style.width = "95%";
      objetivosDiv.style.backgroundColor = "#E0FFAA";
      objetivosDiv.style.border = "1px solid #93AF62";
      objetivosDiv.style.borderRadius = "3px";
      objetivosDiv.style.padding = "5px 5px 5px 5px";
      objetivosDiv.innerHTML = `<span style='font-size:13px;font-weight:bold;color:black;'>Objetivo ${index}/${coordsOrdenadas.length}</span>`;
      avisosDiv.appendChild(objetivosDiv);
    }, 175)

    if (tieneArietes) {
      unidades['ram']++;
      popTotal += popUnidades['ram'];
    } else {
      if (tieneCatas) {
        unidades['catapult']++;
        popTotal += popUnidades['catapult'];
      }
    }

    if (esDeff) {
      while(popTotal < limiteEngaño) {
        if (doc.forms[0].spy.dataset.allCount > 0) {
          if (unidades['ram'] === 0 && unidades['catapult'] === 0) {
            maxEspias = 25;
          } else {
            maxEspias = 50;
          }

          if (unidades['spy'] < maxEspias && unidades['spy'] < doc.forms[0].spy.dataset.allCount) {
            unidades['spy']++;
            popTotal += popUnidades['spy'];
          } else {
            if (unidades['sword'] >= unidades['spear']) {
              unidades['spear']++;
              popTotal+= popUnidades['spear'];
            } else {
              unidades['sword']++;
              popTotal+= popUnidades['sword'];
            }
          }
        } else {
          if (unidades['sword'] >= unidades['spear']) {
            unidades['spear']++;
            popTotal+= popUnidades['spear'];
          } else {
            unidades['sword']++;
            popTotal += popUnidades['sword'];
          }
        }
      }
    }

    if (esOff) {
      while (popTotal < limiteEngaño) {
        if (doc.forms[0].spy.dataset.allCount > 0) {
          if(unidades['spy'] < 20 && unidades['spy'] < doc.forms[0].spy.dataset.allCount){
            unidades['spy']++;
            popTotal += popUnidades['spy'];
          }else{
            if((unidades['light'] * 7) >= unidades['axe']){
              if(unidades['axe'] < doc.forms[0].axe.dataset.allCount){
                unidades['axe']++;
                popTotal += popUnidades['axe'];
              }else{
                unidades['light']++;
                popTotal += popUnidades['light'];
              }
            }else{
              if(unidades['light'] < doc.forms[0].light.dataset.allCount){
                unidades['light']++;
                popTotal += popUnidades['light'];
              }else{
                unidades['axe']++;
                popTotal += popUnidades['axe'];
              }
            }
          }
        }else{
          if((unidades['light'] * 7) >= unidades['axe']){
            if(unidades['axe'] < doc.forms[0].axe.dataset.allCount){
              unidades['axe']++;
              popTotal += popUnidades['axe'];
            }else{
              unidades['light']++;
              popTotal += popUnidades['light'];
            }
          }else{
            if(unidades['light'] < doc.forms[0].light.dataset.allCount){
              unidades['light']++;
              popTotal += popUnidades['light'];
            }else{
              unidades['axe']++;
              popTotal += popUnidades['axe'];
            }
          }
        }
      }
    }

    if(sinGrupo){
      setTimeout(function(){
        errorDiv.id = "errorDiv";
        errorDiv.style.width = "95%";
        errorDiv.style.backgroundColor = "#FFCCAA";
        errorDiv.style.border = "1px solid #7D510F";
        errorDiv.style.borderRadius = "3px";
        errorDiv.style.padding = "5px 5px 5px 5px";
        errorDiv.style.display = "inline-block";
        errorDiv.style.verticalAlign = "middle";
        errorDiv.style.lineHeight = "normal";
        errorDiv.innerHTML = `<span style='font-size:13px;font-weight:bold;color:#B40000;'><img src='https://dses.innogamescdn.com/asset/66d23af3/graphic/error.png'> No hay suficientes unidades de ningun tipo para enviar fakes. (Minímo de población: ${limiteEngaño})</span>`;
        avisosDiv.appendChild(errorDiv);
      }, 175)
    }

  setTimeout(function(){
    doc.forms[0].spear.value = unidades['spear'];
    doc.forms[0].sword.value = unidades['sword'];
    doc.forms[0].axe.value = unidades['axe'];
    if(game_data.units.includes('archer')){
      doc.forms[0].archer.value = unidades['archer'];
    }
    doc.forms[0].spy.value = unidades['spy'];
    doc.forms[0].light.value = unidades['light'];
    if(game_data.units.includes('marcher')){
      doc.forms[0].archer.value = unidades['marcher'];
    }
    doc.forms[0].heavy.value = unidades['heavy'];
    doc.forms[0].ram.value = unidades['ram'];
    doc.forms[0].catapult.value = unidades['catapult'];
  }, 150)



function calcularDistancia(puebloAtacante, puebloGranja){
  coordAtacante = puebloAtacante.split('|');
  coordGranja = puebloGranja.split('|');

  distancia = ((coordAtacante[0] - coordGranja[0]) ** 2 + (coordAtacante[1] - coordGranja[1]) ** 2) ** 0.5;

  return Math.round(distancia);
}

function crearArrayCoordenadas(arrayCoordenadas){
  for(var i = 0; i < arrayCoordenadas.length; i++){
    coordsDistancia[arrayCoordenadas[i]] = calcularDistancia(game_data.village.coord, arrayCoordenadas[i]);
  }
}

function ordenarCoordenadas(arrayCoordenadas){
  var arrayObjetos = Object.keys(arrayCoordenadas).map(function(coordenada){
    return { coordenada: coordenada, distancia: arrayCoordenadas[coordenada] };
  });

  arrayObjetos.sort(function(a, b){
    return a.distancia - b.distancia;
  });

  var arrayDeArrays = arrayObjetos.map(function(objeto){
    return [objeto.coordenada, objeto.distancia.toString()];
  });

  return arrayDeArrays;
}

// Obtenemos la configuración del mundo
function getWorldConfig () {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      getFakeLimit(this);
    }
  };
  xmlhttp.open('GET', '/interface.php?func=get_config', true);
  xmlhttp.send();
}

// Obtenemos el límite de engaño para los fakes
function getFakeLimit (xml) {
  var xmlFakeLimit, xmlDoc, fakeLimit2;
  xmlDoc = xml.responseXML;
  xmlFakeLimit = xmlDoc.getElementsByTagName('fake_limit');
  for (var i = 0; i < xmlFakeLimit.length; i++) {
    fakeLimit2 = xmlFakeLimit[i].textContent;
  }
  var retorno = parseInt(fakeLimit2);
  return parseInt(retorno);
}