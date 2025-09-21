javascript:
var pueblos = [];
var coordsTodosAtaques = [];

var velocidades = [
  "Ariete",
  "CAVL",
  "EspÃ­a",
  "Hacha",
  "Espada",
];

obtenerPueblos();

async function obtenerPueblos() {
  var pueblosDeff = [
    {
      "coordenadas": "443|506",
      "tipo": "def",
      "updatedAt": "2024-12-22T22:11:42.115Z"
    },
    {
      "coordenadas": "490|480",
      "tipo": "def",
      "updatedAt": "2024-12-23T00:21:46.943Z"
    }
  ];

  var pueblosOff = [
    {
      "coordenadas": "443|504",
      "tipo": "off",
      "updatedAt": "2024-12-19T22:11:53.257Z"
    },
    {
      "coordenadas": "488|481",
      "tipo": "off",
      "updatedAt": "2024-12-22T22:19:55.911Z"
    }
  ];

  pueblos = pueblosDeff.concat(pueblosOff);

  let cabecera = 'Origen';
  let tableHeaders = $('#incomings_table th');
  let chosenHeader = tableHeaders.filter(function (header) {
    return tableHeaders[header].innerText == cabecera;
  });

  let chosenHeaderIndex = chosenHeader[0].cellIndex + 1;
  let rows = $('#incomings_table tr td:nth-child(' + chosenHeaderIndex + ')');

  rows.each(function (row) {
    coordsTodosAtaques.push(extraerCoordString(rows[row].innerText));
  });

  for (let i = 0; i < coordsTodosAtaques.length; i++) {
    let coordAtaque = coordsTodosAtaques[i];

    let puebloEncontrado = pueblos.find(p => p.coordenadas === coordAtaque);
    if (puebloEncontrado) {
      let diferenciaDias = calcularDiferenciaDias(puebloEncontrado.updatedAt);

      if (diferenciaDias > 10 && puebloEncontrado.tipo === "off") {
        continue;
      }

      let nuevoNombreBase = "";
      if (puebloEncontrado.tipo === "def") {
        nuevoNombreBase = "Fake (Deff)";
      } else if (puebloEncontrado.tipo === "off") {
        let labelDias = (diferenciaDias === 1) ? "1 DÃ­a" : diferenciaDias + " DÃ­as";
        nuevoNombreBase = `Fake (Estampado) [${labelDias}]`;
      }

      if (nuevoNombreBase) {
        renombrarAtaque('incomings_table', coordAtaque, nuevoNombreBase);
      }
    }
  }

}

function renombrarAtaque(tableID, searchString, nuevoNombreBase) {
  $("#" + tableID + " tr td").each(function () {
    if ($(this).text().toLowerCase().indexOf(searchString.toLowerCase()) >= 0) {
      let $quickeditLabel = $(this).parent().find(".quickedit-label");
      let nombreOriginal = $quickeditLabel.text().trim();

      if (nombreOriginal.includes("(Estampado)") || nombreOriginal.includes("(Deff)")) {
        return;
      }

      let matchedVelocity = velocidades.find(v =>
        nombreOriginal.toLowerCase().includes(v.toLowerCase())
      );

      let nombreFinal = (matchedVelocity)
        ? `${matchedVelocity} -> ${nuevoNombreBase}`
        : nuevoNombreBase;

      $(this).parent().find(".rename-icon").click();
      $(this).parent().find('input[type="text"]').val(nombreFinal);
      $(this).parent().find('input[type="button"]').click();
    }
  });
}

function extraerCoordString(str) {
  var regexCoords = /[0-9]*\|[0-9]*/g;
  var arr = regexCoords.exec(str);
  return arr ? arr[0] : "";
}

function calcularDiferenciaDias(fechaStr) {
  let fechaUpdate = new Date(fechaStr);
  let hoy = new Date();

  let diffMs = hoy - fechaUpdate;

  let diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDias;
}