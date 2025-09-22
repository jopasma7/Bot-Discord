/* Script By Raba */
/* Versión: 1.0 */
/* Este script sirve para calcular los niveles de muralla que dispone el pueblo según los puntos del pueblo */

//javascript:
var puntuaciones = [0,8,2,2,2,3,3,4,5,5,7,9,9,12,15,17,20,25,29,36,43];
var puntosAntes=parseInt(prompt('Puntuación del Pueblo (Antes)'));
var pointsContentString = content_value.getElementsByTagName('table')[1].getElementsByTagName('td')[4].textContent;
var puntos = parseInt(pointsContentString.replace(".",""));

if(getParameterByName('screen') == "info_village"){
    
    var count = 0;
    console.log("Fuera Bucle Puntos Antes: "+ puntosAntes);
    console.log("Fuera Bucle Puntos: "+ puntos);
    var msg = "Calculando el posible nivel de Muralla:";
    while(puntosAntes < puntos){
        count++;
        if(count == 21){
            msg =  msg + `\nSolamente existen 20 niveles de muralla.`;
            break;
        }
        puntosAntes = puntosAntes + puntuaciones[count]
        console.log("Puntos Antes: "+ puntosAntes);   
        msg =  msg + `\nEl Nivel [`+count+`] de la Muralla costó [`+puntuaciones[count]+`] : Puntos : `+puntosAntes+` -->> `+puntos+``;
    }
    alert(msg);

}else {

}

// Addicional function to get Parameters quickly!!
function getParameterByName(name, url = window.location.href) {
	return new URL(url).searchParams.get(name);
}
