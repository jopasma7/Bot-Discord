javascript:

function calcularDistancia(str1, str2){
  var coord_x1;
  var coord_y1;
  var coord_x2;
  var coord_y2;
  var res;

  coord_x1 = parseInt(str1.split('|')[0]);
  coord_y1 = parseInt(str1.split('|')[1]);

  coord_x2 = parseInt(str2.split('|')[0]);
  coord_y2 = parseInt(str2.split('|')[1]);

  res = Math.sqrt(Math.pow(Math.abs(coord_x1 - coord_x2), 2) + Math.pow(Math.abs(coord_y1 - coord_y2), 2));

  return res.toFixed(2);
}

var doc = document;
var distancia;
var pueblos_validos = "<h1>PUEBLOS A DISTANCIA DE SNIPEO</h1> <br>";
var fecha_actual = new Date();
var fecha_llegada_ataque = new Date('2018/11/28 00:55:00');
var diff = Math.abs(fecha_actual - fecha_llegada_ataque);

var tabla = doc.getElementsByClassName("vis");
var tabla_final = tabla[0];

var coords_pueblo_objetivo = tabla_final.rows[2].cells[1].innerHTML;

var coords_de_tus_pueblos;

function setCoords() {
    if ("VillageCoords" in localStorage) {
        coords_de_tus_pueblos = localStorage.getItem("VillageCoords");

    } else {
        // Lanzar error de que no hay coordenadas establecidas.
    }

    // Setear las coordenadas del pueblo.
    /*
    ...
    ...
    */
   
    localStorage.setItem("VillageCoords", coords_de_tus_pueblos);
}

/*RELLENAR CON LOS SIGUIENTES TIPOS:
    Lanza
    Espada
    Hacha
    Ligera
    Pesada
    Ariete
*/
var tipo_de_unidad = "Lanza";
pueblos_validos += "<h2>Velocidad: " + tipo_de_unidad + " </h2> <br>";
var velocidad_de_unidad;

switch (tipo_de_unidad){

    case "Lanza":
        velocidad_de_unidad = 19;
    case "Espada":
        velocidad_de_unidad = 23;
    case "Hacha":
        velocidad_de_unidad = 19;
    case "Ligera":
        velocidad_de_unidad = 10;
    case "Pesada":
        velocidad_de_unidad = 11;
    case "Ariete":
        velocidad_de_unidad = 31;
    default:
        velocidad_de_unidad = 10;
}

velocidad_de_unidad *= 60000;

coords_splitted = coords_de_tus_pueblos.split(' ');

for (var i = 0; i < coords_splitted.length; i++){

    distancia = calcularDistancia(coords_splitted[i], coords_pueblo_objetivo);

    if ((distancia * velocidad_de_unidad) < diff){
        pueblos_validos += coords_splitted[i] + "<br><br>";
    }
}

var popup = window.open("about:blank", "Pueblos a distancia de snipear", "width=700, height=500, top=85,left=50, scrollbars=1");

popup.document.open('text/html','replace');
popup.document.write(pueblos_validos);
popup.document.close();