javascript:

var coords=prompt("Introduce las coordenadas que deseas analizar en el siguiente formato: 123|456 789|012 345|678");
console.log(coords);

var coordArray = coords.split(' ');
for(var i = 0; i < coordArray.length; i++){
	var coord = coordArray[i];
	// Process each coord here
}

document.getElementById("inputx").value = coordArray[0].split('|')[0];
document.getElementById("inputy").value = coordArray[0].split('|')[1];
console.log(coordArray[0].split('|')[0]);
console.log(coordArray[0].split('|')[1]);

void(0);