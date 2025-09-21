/*
 * Nombre: Panel de ordenes
 * Autor: DarkMein
 * Version: v1.3.4
 * Ultima actualizacion: 2020-09-17
 *
 * Changelog:
 * v1.0    -> Version inicial
 * v1.1    -> Mejorada introduccion de datos y aÃƒÆ’Ã‚Â±adidos selectores de tiempo restante, tiempo de lanzamiento, filtro por pueblo y soporte multipagina
 * v1.2    -> Anadido soporte multipagina, correcciones menores por desfases de tiempo cuando se configuraban ataques a pueblos muy lejanos
 * v1.3.1  -> Incluidos codigos BBCode en las coordenadas de los pueblos, incluido soporte a mundo con arqueros
 *  V1.3.2 -> Corregido error en tiempos de viaje de los apoyos con paladin, las unidades viajan a velocidad del paladin en los apoyos
 *  V1.3.3 -> Corregido error al mostrar coordenadas de origen/destino cuando se aÃ±adia un nuevo ataque a la tabla. Refrescando se solucionaba, era un error temporal que n oafectaba a los calculos de tiempos
 *  V1.3.4 -> Corregido error en el que nombres de pueblos con puntos hacian que el script no mostrase resultados
 */

(function() {
    'use strict';
    //Cantidad de ordenes visualizadas en la pantalla de la plaza
    const numFilas = 10
    const colorVerde = "lawngreen"
    const colorRojo = "orangered"
    const colorGris = "darkgray"
    const colorTablaTropas = "#FCF2DC"
    const colorTablaTropas2 = "#F5F6CE"
    const colorTablaInfo = "#FAF0E6"
    const colorTablaCabecera = "#E6E6FA"
    const colorFilaAdd = "#E6E6E6"

    //A partir de aqui no tocar si no sabes lo que haces
    const versionDB = 1
    const nombreDB = "OrdenesGT_DB"

    //Tiempos de cada unidad en segundos por cada campo recorrido, detectado automaticamente por script
    var tiemposUnidades = []
    var arqueros = false
    const tablaOrdenes = "tablaOrdenes"

    var puebloOri
    var puebloDest
    var tiempoLleg
    var unid = [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
    var tiempoUpdateCoords = 0
    var numPueblos = 0;
    var falloLecturaPueblos = false

    var database
    var tabla
    var config
    var infoAdicional
    var pagina = 1
    var tiposTropas = 10
    var idPuebloActual = parseInt(getPropertyInHTML("\"village\":{\"id"))

    var patronCoords = /\([0-9]*\|[0-9]*\)/g;
    var titulo = document.title
    var coords = titulo.match(patronCoords).toString()
    coords = coords.replace("(","")
    coords = coords.replace(")","")
    //coords = coords.replaceAll(".","")
    //coords = coords.replaceAll(";","")
	//coords = coords.replaceAll(",","")
	//coords = coords.replaceAll(":","")
    //coords = coords.replaceAll("[","")
    //coords = coords.replaceAll("]","")
    //coords = coords.replaceAll("{","")
    //coords = coords.replaceAll("}","")

    //Si existe input de arquero en formulario, es mundo de arqueros
    if (document.getElementById("unit_input_archer") != null){
        arqueros = true
        tiposTropas = 12;
    } else {
        tiposTropas = 10
    }


    var plantilla = "<table style=\"border:1px solid #" + colorTablaTropas + "\" width=\"100%\" cellpadding=\"0\" id=\"" + tablaOrdenes + "\" cellspacing=\"0\">          <tbody><tr class=\"center\">            "
    var columnas =
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">  <b>Dia</b>   " +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">  <b>Hora</b>  " +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">  <b>Origen</b> " +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">  <b>Destino</b> " +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">       <img src=\"https://dses.innogamescdn.com/asset/1d2499b/graphic/unit/unit_spear.png\" title=\"\" alt=\"\" class=\"\">      </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">       <img src=\"https://dses.innogamescdn.com/asset/1d2499b/graphic/unit/unit_sword.png\" title=\"\" alt=\"\" class=\"\">      </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">       <img src=\"https://dses.innogamescdn.com/asset/1d2499b/graphic/unit/unit_axe.png\" title=\"\" alt=\"\" class=\"\">      </td>            " +
        (arqueros ? "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">       <img src=\"https://dses.innogamescdn.com/asset/1d2499b/graphic/unit/unit_archer.png\" title=\"\" alt=\"\" class=\"\">      </td>" : "") +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">       <img src=\"https://dses.innogamescdn.com/asset/1d2499b/graphic/unit/unit_spy.png\" title=\"\" alt=\"\" class=\"\">      </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">       <img src=\"https://dses.innogamescdn.com/asset/1d2499b/graphic/unit/unit_light.png\" title=\"\" alt=\"\" class=\"\">      </td>            " +
        (arqueros ? "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">       <img src=\"https://dses.innogamescdn.com/asset/1d2499b/graphic/unit/unit_marcher.png\" title=\"\" alt=\"\" class=\"\">      </td>" : "") +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">       <img src=\"https://dses.innogamescdn.com/asset/1d2499b/graphic/unit/unit_heavy.png\" title=\"\" alt=\"\" class=\"\">      </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">       <img src=\"https://dses.innogamescdn.com/asset/1d2499b/graphic/unit/unit_ram.png\" title=\"\" alt=\"\" class=\"\">      </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">       <img src=\"https://dses.innogamescdn.com/asset/1d2499b/graphic/unit/unit_catapult.png\" title=\"\" alt=\"\" class=\"\">      </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">       <img src=\"https://dses.innogamescdn.com/asset/1d2499b/graphic/unit/unit_knight.png\" title=\"\" alt=\"\" class=\"\">      </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">       <img src=\"https://dses.innogamescdn.com/asset/1d2499b/graphic/unit/unit_snob.png\" title=\"\" alt=\"\" class=\"\">      </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">       <b>Ataque</b></td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">       <b>Apoyo</b></td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">       <img src=\"https://dses.innogamescdn.com/asset/1d2499b/graphic/rechts.png\" title=\"\" alt=\"\" class=\"\">      </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">       <b>Opciones</b></td>            "+
        "<td style=\"padding:2px;background-color:" + colorTablaCabecera + "\">        ID    </td>            "


    var filas =
        "<td style=\"padding:2px;background-color:" + colorTablaTropas + "\">                </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaTropas2 + "\">                </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaTropas + "\">                </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaTropas2 + "\">                </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaTropas + "\">              </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaTropas2 + "\">              </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaTropas + "\">              </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaTropas2 + "\">              </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaTropas + "\">              </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaTropas2 + "\">              </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaTropas + "\">              </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaTropas2 + "\">              </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaTropas + "\">              </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaTropas2 + "\">              </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaTropas + "\">              </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaTropas2 + "\">              </td>            " +
        "<td style=\"padding:2px;background-color:" + colorTablaTropas + "\">              </td>            " +
        (arqueros ? "<td style=\"padding:2px;background-color:" + colorTablaTropas2 + "\">              </td>            " : "")+
        (arqueros ? "<td style=\"padding:2px;background-color:" + colorTablaTropas + "\">              </td>            " : "")+
        "<td style=\"padding:2px;background-color:" + colorTablaTropas2 + "\"><button class=\"btnSeleccionarOrden\"  type=\"button\">Selec</button>  <button class=\"btnBorrarOrden\"  type=\"button\">Borrar</button></td>            "+
        "<td style=\"padding:2px;background-color:" + colorTablaTropas + "\">              </td>            "

    var filaAdd =
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><input id=\"diaAdd\" type=\"date\" step=\"1\" value=\"2020-01-01\"  style=\"width: 10em;\"</td>            " +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><input id=\"horaAdd\" type=\"time\" step=\"0.001\" value=\"00:00:00.000\"  style=\"width: 10em;\"</td>            " +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><input id=\"origenAdd\" type=\"text\" placeholder=\"123|456\" size=\"4\" maxlength=\"7\"</td>            " +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><input id=\"destinoAdd\" type=\"text\" placeholder=\"123|456\" size=\"4\" maxlength=\"7\" </td>            " +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><input id=\"lanzasAdd\" type=\"text\" placeholder=\"0\" style=\"width: 3em;\" </td>            " +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><input id=\"espadasAdd\" type=\"text\" placeholder=\"0\" style=\"width: 3em;\"   </td>            " +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><input id=\"hachasAdd\" type=\"text\" placeholder=\"0\"  style=\"width: 3em;\"   </td>            " +
        (arqueros ? "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><input id=\"arqueroAdd\" type=\"text\" placeholder=\"0\"  style=\"width: 3em;\"   </td>            " : "") +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><input id=\"espiasAdd\" type=\"text\" placeholder=\"0\"  style=\"width: 3em;\"   </td>            " +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><input id=\"ligerasAdd\" type=\"text\" placeholder=\"0\"  style=\"width: 3em;\"   </td>            " +
        (arqueros ? "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><input id=\"cabArqueroAdd\" type=\"text\" placeholder=\"0\"  style=\"width: 3em;\"   </td>            " : "") +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><input id=\"pesadasAdd\" type=\"text\" placeholder=\"0\"  style=\"width: 3em;\"   </td>            " +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><input id=\"arietesAdd\" type=\"text\" placeholder=\"0\"  style=\"width: 3em;\"   </td>            " +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><input id=\"catasAdd\" type=\"text\" placeholder=\"0\"  style=\"width: 3em;\"   </td>            " +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><input id=\"paladinAdd\" type=\"text\" placeholder=\"0\"  style=\"width: 2em;\"   </td>            " +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><input id=\"noblesAdd\" type=\"text\" placeholder=\"0\"  style=\"width: 2em;\"   </td>            " +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\">  </td>            " +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\">  </td>            " +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\">  </td>            " +
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\"><button class=\"btnSelecTropas\"  type=\"button\">Selec todo</button>  <button id=\"btnGuardarOrden\" type=\"button\">Anadir</button> </td>              "+
        "<td style=\"padding:2px;background-color:" + colorFilaAdd + "\">  </td>            "


    var plantillaTabla = plantilla
    plantillaTabla += columnas
    for (var i = 0; i < numFilas; i++) {
        plantillaTabla += "</tr>                <tr class=\"center\">            "
        plantillaTabla += filas
    }
    plantillaTabla += "</tr>                <tr class=\"center\">            " + filaAdd
    plantillaTabla += "</tr>                     </tbody></table>"

    var plantillaConfig = ""
    plantillaConfig += "<table class=\"vis settings\" width=\"50%\"><tbody>"
    plantillaConfig += "<tr><th colspan=\"2\">Configuracion del panel de ordenes</th></tr>"
    plantillaConfig += "<tr><td>Funcionamiento de los contadores de tiempo:</td><td><label><input type=\"radio\" name=\"mostrarCuentaAtras\" value=\"0\" checked=\"checked\">Mostrar cuenta atras</label><br><label><input type=\"radio\" name=\"mostrarCuentaAtras\" value=\"1\">Mostrar cuando se debe lanzar</label><br></td></tr>"
    plantillaConfig += "<tr><td>Mostrar solo ordenes de este pueblo:</td><td><label><input type=\"checkbox\" name=\"mostrarOrdenesPorPueblo\">Solo ordenes de " + coords + "</label></td></tr>"
    plantillaConfig += "</tbody></table>"

    var plantillaInfoAdicional = ""
    plantillaInfoAdicional += "<table class=\"vis settings\" width=\"100%\"><tbody>"
    plantillaInfoAdicional += "<tr><td><button class=\"btnPagAnterior\"  type=\"button\">Anterior pagina</button>  <button class=\"btnPagSiguiente\"  type=\"button\">Siguiente pagina</button> <label class=\"labelPagina\"> Pagina: 1 </label></td></tr>"
    plantillaInfoAdicional += "</tbody></table>"


    if (document.getElementById(tablaOrdenes) != null) return;

    var posicion = document.getElementById('command-form-warning')
    if (posicion != null) {
        var url2 = "https://" + location.host + "/interface.php?func=get_unit_info"
        $.ajax({
            url: url2,
            async: false,
            success: function(data) {
                if (arqueros == false ){
                    $.each(["spear", "sword", "axe", "spy", "light", "heavy", "ram", "catapult", "knight", "snob"], function(key, val) {
                        //NO redondear decimales, el juego te miente en la pantalla de info de tropas, si le haces caso a esas pantallas salen los tiempos desfasados unos segundos, a cuantos mas campos de distancia, mayor error
                        tiemposUnidades.push(Number($(data).find("config > " + val + " > speed").text()) * 60);
                    })
                } else {
                    $.each(["spear", "sword", "axe", "archer", "spy", "light", "marcher", "heavy", "ram", "catapult", "knight", "snob"], function(key, val) {
                        tiemposUnidades.push(Number($(data).find("config > " + val + " > speed").text()) * 60);
                    })
                }
            },
        })

        console.log("Tiempos unidades por campo en este mundo:")
        console.log(tiemposUnidades)

        config = createElementFromHTML(plantillaConfig)
        posicion.appendChild(config)

        tabla = createElementFromHTML(plantillaTabla)
        posicion.appendChild(tabla)

        infoAdicional = createElementFromHTML(plantillaInfoAdicional)
        posicion.appendChild(infoAdicional)

        iniEventosBotones()
        leerDatabase()
        llenarOrdenAdd()
    }


    function iniEventosBotones(){
        var btnMostrarPueblo = document.getElementsByName("mostrarOrdenesPorPueblo")[0]
        var btnPagAnterior = document.getElementsByClassName("btnPagAnterior")[0]
        var btnPagSiguiente = document.getElementsByClassName("btnPagSiguiente")[0]
        var btnSelecTropas = document.getElementsByClassName("btnSelecTropas")[0]
        var pOri = document.getElementById("origenAdd");
        var pDest = document.getElementById("destinoAdd");

        btnMostrarPueblo.onclick = function(event) {
            limpiarTabla()
            mostrarDatos()
        }

        btnPagAnterior.onclick = function(event) {
            if (pagina > 1){
                pagina--
                limpiarTabla()
                mostrarDatos()
            }
            document.getElementsByClassName("labelPagina")[0].innerText = "Pagina: " + pagina

        }

        btnPagSiguiente.onclick = function(event) {
            pagina++
            document.getElementsByClassName("labelPagina")[0].innerText = "Pagina: " + pagina
            limpiarTabla()
            mostrarDatos()
        }

        btnSelecTropas.onclick = function(event) {
            var tropas = document.getElementsByClassName("units-entry-all")
            var t = 0;

            escribirValTropaAdd("lanzasAdd",document.getElementById("units_entry_all_spear"))
            escribirValTropaAdd("espadasAdd",document.getElementById("units_entry_all_sword"))
            escribirValTropaAdd("hachasAdd",document.getElementById("units_entry_all_axe"))
            if (arqueros) escribirValTropaAdd("arqueroAdd",document.getElementById("units_entry_all_archer"))
            escribirValTropaAdd("espiasAdd",document.getElementById("units_entry_all_spy"))
            escribirValTropaAdd("ligerasAdd",document.getElementById("units_entry_all_light"))
            if (arqueros) escribirValTropaAdd("cabArqueroAdd",document.getElementById("units_entry_all_marcher"))
            escribirValTropaAdd("pesadasAdd",document.getElementById("units_entry_all_heavy"))
            escribirValTropaAdd("arietesAdd",document.getElementById("units_entry_all_ram"))
            escribirValTropaAdd("catasAdd",document.getElementById("units_entry_all_catapult"))
            escribirValTropaAdd("paladinAdd",document.getElementById("units_entry_all_knight"))
            escribirValTropaAdd("noblesAdd",document.getElementById("units_entry_all_snob"))
        }

        //Autocompletado en inputs de coordenadas para anadir automaticamente el | tras el 3 digito. 123|456
        pOri.addEventListener('keyup', function(evt){
            var n = this.value.length
            if (n == 3) {
                pOri.value += "|";
            }
        }, false);

        pDest.addEventListener('keyup', function(evt){
            var n = this.value.length
            if (n == 3) {
                pDest.value += "|";
            }
        }, false);
    }

    function llenarOrdenAdd(){
        var dt = new Date()
        document.getElementById("diaAdd").value = dt.getFullYear() + "-" + (dt.getMonth() + 1 < 10 ? "0" : "") + (dt.getMonth() + 1) + "-" + (dt.getDate() < 10 ? "0" : "") + dt.getDate()
        document.getElementById("horaAdd").value = (dt.getHours() < 10 ? "0" : "") + dt.getHours() + ":" + (dt.getMinutes() < 10 ? "0" : "") + dt.getMinutes() + ":" + (dt.getSeconds() < 10 ? "0" : "") + dt.getSeconds()
        document.getElementById("origenAdd").value = coords


        var btn = document.getElementById("btnGuardarOrden");
        btn.onclick = function() {
            var elmDia
            var elmHora
            var datosNOK = false;

            var a,m,d,hor,min,seg,ms

            elmDia = document.getElementById("diaAdd").value.split("-")
            elmHora = document.getElementById("horaAdd").value.split(":")
            //console.log(elmHora)
            //console.log(elmHora[0])
            //console.log(elmHora[1])
            //console.log(elmHora[2])

            d = parseInt(elmDia[2])
            m = parseInt(elmDia[1]) - 1
            a = parseInt(elmDia[0])

            hor = parseInt(elmHora[0])
            min = parseInt(elmHora[1])

            if (elmHora[2] != null){
                if (elmHora[2].includes(".")){
                    seg = parseInt(elmHora[2].split(".")[0])
                    ms = parseInt(elmHora[2].split(".")[1])
                } else {
                    seg = parseInt(elmHora[2])
                    ms = 0
                }
            } else {
                seg = 0
                ms = 0
            }

            var dt = new Date(a,m,d, hor,min,seg,ms)
            tiempoLleg = dt.getTime()

            puebloOri = document.getElementById("origenAdd").value.trim()
            puebloDest = document.getElementById("destinoAdd").value.trim()

            var t = 0;
            unid[t++] = leerValTropaAdd("lanzasAdd")
            unid[t++] = leerValTropaAdd("espadasAdd")
            unid[t++] = leerValTropaAdd("hachasAdd")
            if (arqueros) unid[t++] = leerValTropaAdd("arqueroAdd")
            unid[t++] = leerValTropaAdd("espiasAdd")
            unid[t++] = leerValTropaAdd("ligerasAdd")
            if (arqueros) unid[t++] = leerValTropaAdd("cabArqueroAdd")
            unid[t++] = leerValTropaAdd("pesadasAdd")
            unid[t++] = leerValTropaAdd("arietesAdd")
            unid[t++] = leerValTropaAdd("catasAdd")
            unid[t++] = leerValTropaAdd("paladinAdd")
            unid[t] = leerValTropaAdd("noblesAdd")

            if (puebloOri == puebloDest
                || puebloOri.includes("|") == false || puebloOri.split("|").length != 2 || isNaN(puebloOri.split("|")[0]) || isNaN(puebloOri.split("|")[1]) || puebloOri.length != 7
                || puebloDest.includes("|") == false|| puebloDest.split("|").length != 2 || isNaN(puebloDest.split("|")[0]) || isNaN(puebloDest.split("|")[1]) || puebloDest.length != 7){

                if(puebloOri == puebloDest){
                    UI.ErrorMessage(
                        `Error al guardar orden, el pueblo de origen debe ser diferente al de destino`,
                        4000
                    );
                } else {
                    UI.ErrorMessage(
                        `Error al guardar orden, revisa las corodenadas destino y los datos de la orden`,
                        4000
                    );
                }
            } else {
                UI.SuccessMessage(`La orden ha sido guardada correctamente!`, 2000);
                guardarOrden()
                limpiarTabla()
                mostrarDatos()
            }
        }
    }

    function leerValTropaAdd(nombre){
        var cantidad = document.getElementById(nombre).value.length > 0 ? parseInt(document.getElementById(nombre).value) : 0
        return cantidad
    }

    function escribirValTropaAdd(nombre, val){
        var elemento = document.getElementById(nombre)

        var num = val.innerText
        num = num.replace("(","")
        num = num.replace(")","")

        if (!isNaN(num)){
            elemento.value = num
        } else {
            elemento.value = 0
        }
    }

    function leerDatabase(){
        var request = indexedDB.open(nombreDB, versionDB);
        var versionDBActual = request.version;

        request.onupgradeneeded = function(event) {
            var db = event.target.result;
            actualizarDB(db)
        };

        request.onerror = function(event) {
            UI.ErrorMessage(
                `Error al abrir la lista de ordenes, version DB:` + versionDB,
                4000
            );
        };

        request.onsuccess = function(event) {
            database = event.target.result;

            guardarListaCoordenadas()
            mostrarDatos()
            window.setInterval(mostrarDatos, 950);
            borrarOrdenes()
            cargarOrdenes()
        }
    }

    function actualizarDB(db){
        console.log("Actualizando base de datos...");

        if (db.objectStoreNames.contains('OrdenesGT')){
            console.log("Borrando antigua lista de ordenes");
            db.deleteObjectStore('OrdenesGT')
        }
        if (db.objectStoreNames.contains('ConfigGT')){
            console.log("Borrando configuraciones antiguas");
            db.deleteObjectStore('ConfigGT')
        }
        if (db.objectStoreNames.contains('PueblosGT')){
            console.log("Borrando lista de pueblos antigua");
            db.deleteObjectStore('PueblosGT')
        }


        if (!db.objectStoreNames.contains('OrdenesGT')) {
            console.log("Creando nueva lista de ordenes");
            var inf = db.createObjectStore('OrdenesGT', {autoIncrement: true})
            inf.createIndex('origen', 'origen', {unique: false});
            inf.createIndex('destino', 'destino', {unique: false});
        }
        if (!db.objectStoreNames.contains('ConfigGT')) {
            console.log("Creando nuevas configuraciones");
            var cfg = db.createObjectStore('ConfigGT', {autoIncrement: false})
            cfg.add(tiempoUpdateCoords, "configUpdatePueblos");
        }
        if (!db.objectStoreNames.contains('PueblosGT')) {
            console.log("Creando nueva lista de pueblos");
            var pue = db.createObjectStore('PueblosGT', {autoIncrement: false})
            pue.createIndex('idPueblo', 'idPueblo', {unique: true});
            pue.createIndex('coordsPueblo', 'coordsPueblo', {unique: true});
            pue.createIndex('idJugador', 'idJugador', {unique: false});
        }
    }

    function limpiarTabla(){
        for (var i = 0; i < numFilas; i++){
            var fila = tabla.getElementsByTagName('tr')[i+1].getElementsByTagName('td')
            var t = 0
            fila[t++].innerText = ""
            fila[t++].innerText = ""
            fila[t++].innerText = ""
            fila[t++].innerText = ""

            for (var j = 0; j < tiposTropas; j++){
                fila[t++].innerText = ""
            }

            fila[t++].innerText = ""
            fila[t++].innerText = ""
            fila[t].innerText = ""
            fila[t+2].innerText = ""

            for (var k = 0; k <= t; k++){
                if (esFilaPar(k) == true){
                    fila[k].style.backgroundColor = colorTablaTropas
                } else {
                    fila[k].style.backgroundColor = colorTablaTropas2
                }
            }
        }
        mostrarDatos()
    }

    function escribirBBCode(fila, coords, vista){
        var tx = database.transaction('PueblosGT', 'readonly');
        var store = tx.objectStore('PueblosGT');

        var coordIndex = store.index("coordsPueblo");
        var req

        if (!(fila.style.backgroundColor == colorVerde || fila.style.backgroundColor == colorRojo || fila.style.backgroundColor == colorGris)){
            req = coordIndex.openCursor(coords)

            req.onsuccess = function(event) {
                var cursor = event.target.result;
                if (cursor != null){
                    var texto

                    if (vista == "overview"){
                        texto = '<a href="' + "/game.php?village=" + cursor.value.idPueblo + "&screen=overview" + '">%coords%</a>'
                    } else if (vista == "place"){
                        texto = '<a href="' + "/game.php?village=" + cursor.value.idPueblo + "&screen=place" + '">%coords%</a>'
                    } else {
                        texto = '<a href="' + "/game.php?village=" + idPuebloActual + "&screen=info_village&id=" + cursor.value.idPueblo + '">%coords%</a>'
                    }
                    fila.innerHTML = texto.replace("%coords%", coords)
                    fila.style.backgroundColor = colorVerde;
                } else {
                    fila.innerText = coords
                    fila.style.backgroundColor = colorGris;
                }

                console.log("BBcode de coord: " + coords)
            }
            req.onerror = function(event) {
                fila.innerText = coords
                fila.style.backgroundColor = colorGris;
            }
        }
    }


    function mostrarDatos(){
        var tx = database.transaction('OrdenesGT', 'readwrite');
        var store = tx.objectStore('OrdenesGT');

        var numOrdenesLeidas = 0
        var filasLlenas = 0
        var coordIndex = store.index("origen");
        var req

        if (document.getElementsByName("mostrarOrdenesPorPueblo")[0].checked == false){
            req = coordIndex.openCursor()
        } else {
            req = coordIndex.openCursor(coords)
        }

        req.onsuccess = function(event) {
            var cursor = event.target.result;

            if (filasLlenas < numFilas && cursor != null){
                numOrdenesLeidas++;
                if ((numOrdenesLeidas <= (pagina * numFilas)) && (numOrdenesLeidas > ((pagina - 1) * numFilas))){

                    var fila = tabla.getElementsByTagName('tr')[filasLlenas + 1].getElementsByTagName('td')

                    var dt = getServerTime()
                    var dt2 = new Date(cursor.value.horaLlegada)
                    var t = 0

                    fila[t++].innerText = (dt2.getDate() < 10 ? "0" : "") + dt2.getDate() + "/" + (dt2.getMonth() + 1 < 10 ? "0" : "") + (dt2.getMonth() + 1) + "/" + dt2.getFullYear()
                    fila[t++].innerText = (dt2.getHours() < 10 ? "0" : "") + dt2.getHours() + ":" + (dt2.getMinutes() < 10 ? "0" : "") + dt2.getMinutes() + ":" + (dt2.getSeconds() < 10 ? "0" : "") + dt2.getSeconds() + ":" + (dt2.getMilliseconds() < 10 ? "00" : (dt2.getMilliseconds() < 100 ? "0" : "")) + dt2.getMilliseconds() + "ms"

                    fila[t].style.fontSize = "x-small"
                    //fila[t].innerText = cursor.value.origen
                    escribirBBCode(fila[t], cursor.value.origen, "place")
                    if (cursor.value.origen == coords){
                        fila[t].style.backgroundColor = colorVerde;
                    } else {
                        fila[t].style.backgroundColor = colorRojo;
                    }
                    t++

                    fila[t].style.fontSize = "x-small"
                    //fila[t].innerText = cursor.value.destino
                    escribirBBCode(fila[t], cursor.value.destino, "info_village")
                    t++

                    for (var i = 0; i < tiposTropas; i++){
                        fila[t++].innerText = cursor.value.tropas[i] >= 0 ? cursor.value.tropas[i] : 0
                    }

                    var tiempoViajeFilaATA = tiempoViajeATA(cursor.value.origen, cursor.value.destino, cursor.value.tropas) ;
                    var tiempoRestATA = dt2.getTime()
                    tiempoRestATA -= dt.getTime()
                    tiempoRestATA -= tiempoViajeFilaATA

                    fila[t].style.fontSize = "x-small"
                    if (tiempoRestATA > 0){
                        if (document.getElementsByName("mostrarCuentaAtras")[0].checked){
                            fila[t].innerText = obtenerTiempoRestante(cursor.value.horaLlegada - dt.getTime() - tiempoViajeFilaATA)
                        } else {
                            fila[t].innerText = obtenerTiempoAtaque(cursor.value.horaLlegada - tiempoViajeFilaATA)
                        }
                        //console.log(obtenerTiempoRestante(tiempoViajeFilaATA))
                        fila[t++].style.backgroundColor = colorVerde;
                    } else {
                        if (document.getElementsByName("mostrarCuentaAtras")[0].checked){
                            fila[t].innerText = "TARDE";
                        } else {
                            fila[t].innerText = obtenerTiempoAtaque(cursor.value.horaLlegada - tiempoViajeFilaATA)
                        }
                        //console.log(obtenerTiempoRestante(tiempoViajeFilaATA))
                        fila[t++].style.backgroundColor = colorRojo;
                    }


                    var tiempoViajeFilaAPO = tiempoViajeAPO(cursor.value.origen, cursor.value.destino, cursor.value.tropas) ;
                    var tiempoRestAPO = cursor.value.horaLlegada
                    tiempoRestAPO -= dt.getTime()
                    tiempoRestAPO -= tiempoViajeFilaAPO

                    fila[t].style.fontSize = "x-small"
                    if (tiempoRestAPO > 0){
                        if (document.getElementsByName("mostrarCuentaAtras")[0].checked){
                            fila[t].innerText = obtenerTiempoRestante(cursor.value.horaLlegada - dt.getTime() - tiempoViajeFilaAPO)
                        } else {
                            fila[t].innerText = obtenerTiempoAtaque(cursor.value.horaLlegada - tiempoViajeFilaAPO)
                            //fila[t].innerText = obtenerTiempoRestante(tiempoViajeFilaAPO)
                        }
                        fila[t++].style.backgroundColor = colorVerde;
                    } else {
                        if (document.getElementsByName("mostrarCuentaAtras")[0].checked){
                            fila[t].innerText = "TARDE";
                        } else {
                            fila[t].innerText = obtenerTiempoAtaque(cursor.value.horaLlegada - tiempoViajeFilaAPO)
                        }
                        fila[t++].style.backgroundColor = colorRojo;
                    }
                    fila[t++].innerText = calcularCampos(cursor.value.origen, cursor.value.destino).toFixed(1)
                    t++
                    fila[t].innerText = cursor.primaryKey;

                    filasLlenas+=1
                    cursor.continue()
                } else {
                    cursor.continue()
                }
            }
        }

        req.onerror = function(event) {
            console.log("Error al buscar registros de ordenes")
        }
    }

    function borrarOrdenes(){
        var btn = tabla.getElementsByClassName("btnBorrarOrden");
        for (var i = 0; i < btn.length; i++){
            btn[i].onclick = function(event) {
                //Firefox caca, incompatible, metodo para ser compatible con chrome/firefox/safari
                var path = event.path || (event.composedPath && event.composedPath());

                var fila = path[2]

                var tama = fila.getElementsByTagName('td').length
                var strID = fila.getElementsByTagName('td')[tama - 1].innerText

                var id = parseInt(strID)
                console.log ("Borrando orden con ID: " + id)

                var tx = database.transaction('OrdenesGT', 'readwrite');
                var store = tx.objectStore('OrdenesGT');

                if (!isNaN(id)){
                    store.delete(id)
                }
                tx.oncomplete = function(event) {
                    limpiarTabla()
                    UI.SuccessMessage('La orden ha sido eliminada', 2000);
                };
                tx.onerror = function(event) {
                    UI.ErrorMessage(
                        `Error al eliminar la orden`,
                        4000
                    );
                };
            }
        }
    }

    function cargarOrdenes(){
        var btn = tabla.getElementsByClassName("btnSeleccionarOrden");
        for (var i = 0; i < btn.length; i++){
            btn[i].onclick = function(event) {
                var e = jQuery.Event("keydown");
                e.which = 50;
                var e2 = jQuery.Event("keyup");
                e.which = 50;


                var path = event.path || (event.composedPath && event.composedPath()); //Firefox caca, incompatible

                var fila = path[2]
                var tama = fila.getElementsByTagName('td').length

                var t = 3
                var dest = fila.getElementsByTagName('td')[t++].innerText

                var lanzas = fila.getElementsByTagName('td')[t++].innerText
                var espadas = fila.getElementsByTagName('td')[t++].innerText
                var hachas = fila.getElementsByTagName('td')[t++].innerText
                if (arqueros) var arcos = fila.getElementsByTagName('td')[t++].innerText
                var espias = fila.getElementsByTagName('td')[t++].innerText
                var lijas = fila.getElementsByTagName('td')[t++].innerText
                if (arqueros) var arcosCab = fila.getElementsByTagName('td')[t++].innerText
                var pesadas = fila.getElementsByTagName('td')[t++].innerText
                var ariete = fila.getElementsByTagName('td')[t++].innerText
                var catas = fila.getElementsByTagName('td')[t++].innerText
                var paladin = fila.getElementsByTagName('td')[t++].innerText
                var nobles = fila.getElementsByTagName('td')[t].innerText

                var id = parseInt(fila.getElementsByTagName('td')[tama - 1].innerText)
                //console.log ("Cargando orden con ID: " + id)

                var un = document.getElementById("unit_input_spear")
                $('[name="' + un + '"]').trigger(e);
                un.value = lanzas;
                $('[name="' + un + '"]').trigger(e2);

                var un2 = document.getElementById("unit_input_sword")
                $('[name="' + un2 + '"]').trigger(e);
                un2.value = espadas;
                $('[name="' + un2 + '"]').trigger(e2);

                var un3 = document.getElementById("unit_input_axe")
                $('[name="' + un3 + '"]').trigger(e);
                un3.value = hachas;
                $('[name="' + un3 + '"]').trigger(e2);

                var un4 = document.getElementById("unit_input_spy")
                $('[name="' + un4 + '"]').trigger(e);
                un4.value = espias;
                $('[name="' + un4 + '"]').trigger(e2);

                var un5 = document.getElementById("unit_input_light")
                $('[name="' + un5 + '"]').trigger(e);
                un5.value = lijas;
                $('[name="' + un5 + '"]').trigger(e2);

                var un6 = document.getElementById("unit_input_heavy")
                $('[name="' + un6 + '"]').trigger(e);
                un6.value = pesadas;
                $('[name="' + un6 + '"]').trigger(e2);

                var un7 = document.getElementById("unit_input_ram")
                $('[name="' + un7 + '"]').trigger(e);
                un7.value = ariete;
                $('[name="' + un7 + '"]').trigger(e2);

                var un8 = document.getElementById("unit_input_catapult")
                $('[name="' + un8 + '"]').trigger(e);
                un8.value = catas;
                $('[name="' + un8 + '"]').trigger(e2);

                var un9 = document.getElementById("unit_input_knight")
                $('[name="' + un9 + '"]').trigger(e);
                un9.value = paladin;
                $('[name="' + un9 + '"]').trigger(e2);

                var un10 = document.getElementById("unit_input_snob")
                $('[name="' + un10 + '"]').trigger(e);
                un10.value = nobles;
                $('[name="' + un10 + '"]').trigger(e2);

                var un11 = document.getElementsByClassName("target-input-field target-input-autocomplete ui-autocomplete-input")[0]
                $('[name="' + un11 + '"]').trigger(e);
                un11.value = dest;
                $('[name="' + un11 + '"]').trigger(e2);

                if (arqueros){
                    var un12 = document.getElementById("unit_input_archer")
                    $('[name="' + un12 + '"]').trigger(e);
                    un12.value = arcos;
                    $('[name="' + un12 + '"]').trigger(e2);

                    var un13 = document.getElementById("unit_input_marcher")
                    $('[name="' + un13 + '"]').trigger(e);
                    un13.value = arcosCab;
                    $('[name="' + un13 + '"]').trigger(e2);
                }

                UI.SuccessMessage('Datos cargados en el formulario', 1000);
            }
        }
    }

    function guardarOrden(){
        var tx = database.transaction('OrdenesGT', 'readwrite');
        var store = tx.objectStore('OrdenesGT');

        var itemA = {
            origen: puebloOri,
            destino: puebloDest,
            tropas: unid,
            horaLlegada: tiempoLleg
        };

        store.add(itemA);

        tx.oncomplete = function(event) {
            console.log('Guardada orden correctamente');
        };
        tx.onerror = function(event) {
            console.log("Error al guardar orden")
        };
    }


    function tiempoViaje(coordsORI, coordsDEST, tropas){
        var distanciaCampos = calcularCampos(coordsORI, coordsDEST)
        var tiempoV = 0

        for (var i = 0; i < tiposTropas; i++){
            var msAnadir = Math.round(tiemposUnidades[i] * 1000 * distanciaCampos)

            if(tropas[i] > 0 && tiempoV < msAnadir){
                tiempoV = msAnadir
            }
        }
        return tiempoV + 1000 //Por alguna razon, los tiempos se desfasan exactamente 1s
    }

    function calcularCampos(coordsORI, coordsDEST){
        var elemORI = coordsORI.split("|")
        var elemDEST = coordsDEST.split("|")

        var coordXori = elemORI[0]
        var coordYori = elemORI[1]

        var coordXdest = elemDEST[0]
        var coordYdest = elemDEST[1]

        var distanciaCampos = Math.sqrt(Math.pow((coordXori - coordXdest),2) + Math.pow((coordYori - coordYdest),2))
        return distanciaCampos
    }

    function tiempoViajeATA(coordsORI, coordsDEST, tropas){
        return tiempoViaje(coordsORI, coordsDEST, tropas)
    }

    function tiempoViajeAPO(coordsORI, coordsDEST, tropas){
        var posPala = 8
        if (arqueros) posPala = posPala + 2


        //Si hay paladin las unidades de apoyo viajan a su velocidad, aunque sean arietes o nobles.
        if (tropas[posPala] > 0){
            for (var i = 0; i < tiposTropas; i++){
                tropas[i] = 0
            }
            tropas[posPala] = 1
        }
        return tiempoViaje(coordsORI, coordsDEST, tropas)
    }

    function obtenerTiempoRestante(milliseconds){
        //Devuelve tiempo acumulado en una cantidad de milisegundos
        var hours = milliseconds / (1000*60*60);
        var absoluteHours = Math.floor(hours);
        var h = absoluteHours > 9 ? absoluteHours : '0' + absoluteHours;

        var minutes = (hours - absoluteHours) * 60;
        var absoluteMinutes = Math.floor(minutes);
        var m = absoluteMinutes > 9 ? absoluteMinutes : '0' + absoluteMinutes;

        var seconds = (minutes - absoluteMinutes) * 60;
        var absoluteSeconds = Math.floor(seconds);
        var s = absoluteSeconds > 9 ? absoluteSeconds : '0' + absoluteSeconds;


        return h + ':' + m + ':' + s;
    }

    function obtenerTiempoAtaque(milliseconds){
        //Devuelve fecha y hora
        var dt2 = new Date(milliseconds + 1000)
        return (dt2.getHours() < 10 ? "0" : "") + dt2.getHours() + ":" + (dt2.getMinutes() < 10 ? "0" : "") + dt2.getMinutes() + ":" + (dt2.getSeconds() < 10 ? "0" : "") + dt2.getSeconds()
    }

    function createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild;
    }

    function getServerTime(){
        var serverTime = document.getElementById("serverTime").innerText.split(":")
        var serverDate = document.getElementById("serverDate").innerText.split("/")
        var dt = new Date(serverDate[2], (serverDate[1] - 1), serverDate[0], serverTime[0], serverTime[1], serverTime[2])
        return dt
    }

    function esFilaPar(n) {
        return n % 2 == 0;
    }

    function getPropertyInHTML(prop) {
        var pos = document.documentElement.innerHTML.indexOf(prop);
        var posComma = document.documentElement.innerHTML.indexOf(",", pos)
        return document.documentElement.innerHTML.slice(pos + prop.length + 2, posComma)
    }

    function guardarListaCoordenadas(){
        var tx = database.transaction('ConfigGT', 'readwrite');
        var store = tx.objectStore('ConfigGT');

        var tiempoActual = new Date()
        tiempoUpdateCoords = tiempoActual.getTime()

        var tUpd = store.get("configUpdatePueblos");

        tx.oncomplete = function(event) {
            var msUltimaUpdate = tUpd.result

            //Descargamos la lista de pueblos 1 vez cada 12 horas, el fichero tiene numero de accesos limitados
            if (msUltimaUpdate == null || (tiempoActual.getTime() > msUltimaUpdate + (3600000 * 12))){
                UI.SuccessMessage('Actualizando listado de pueblos (BBcodes), no cierres la pestana del navegador', 10000);
                obtenerListaCoordenadas(database)
            } else {
                console.log("Fichero de pueblos actualizado hace " + ((tiempoUpdateCoords - msUltimaUpdate) / 60000).toFixed(0) + " minutos");
            }
        };
        tx.onerror = function(event) {
            console.log("Error al guardar tiempo ultima update pueblos")
        };
    }

    function obtenerListaCoordenadas(database){
        var listaPueblos
        var direccion = "https://" + location.host + "/map/village.txt"

        console.log("Leyendo lista de pueblos desde " + direccion)
        var request = new XMLHttpRequest();
        request.open('GET', direccion, true);
        request.send(null);
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {
                var type = request.getResponseHeader('Content-Type');
                if (type.indexOf("text") !== 1) {
                    listaPueblos = request.responseText

                    if (listaPueblos != null){
                        console.log("Guardado datos...")
                        var pueb = listaPueblos.split("\n")
                        numPueblos = 0;

                        var txCl = database.transaction('PueblosGT', 'readwrite');
                        var storeCl = txCl.objectStore('PueblosGT');
                        storeCl.clear()

                        txCl.oncomplete = function(event) {
                            var tx = database.transaction('PueblosGT', 'readwrite');
                            var store = tx.objectStore('PueblosGT');

                            for (var p = 0; p < pueb.length-1; p+=1) {
                                var componentes = pueb[p].split(",")
                                var coordsP = parseInt(componentes[2]) + "|" + parseInt(componentes[3])
                                var idP = parseInt(componentes[0])

                                var datos = {
                                    idPueblo: idP,
                                    nombrePueblo: componentes[1],
                                    coordX: parseInt(componentes[2]),
                                    coordY: parseInt(componentes[3]),
                                    coordsPueblo: coordsP,
                                    idJugador: parseInt(componentes[4]),
                                    puntosPueblo: parseInt(componentes[5]),
                                    x: parseInt(componentes[6])
                                }
                                store.put(datos, idP);
                                numPueblos++

                                tx.onsuccess = function(event) {
                                    //console.log("Guardando ID de " + coordsP)
                                }
                                tx.oncomplete = function(event) {
                                    var tx2 = database.transaction('ConfigGT', 'readwrite');
                                    var store2 = tx2.objectStore('ConfigGT');
                                    store2.put(tiempoUpdateCoords, "configUpdatePueblos");
                                    UI.SuccessMessage('Se ha actualizado el listado de pueblos. Pueblos en el mundo: ' + numPueblos, 2000);
                                    console.log("Finalizada actualizacion del listado de pueblos. Pueblos: " + numPueblos);
                                }
                                tx.onerror = function(event) {
                                    if(falloLecturaPueblos == false){
                                        //Para no spamear
                                        UI.ErrorMessage('Error al actualizar la lista de pueblos del mundo',10000);
                                        falloLecturaPueblos = true;
                                    }
                                    console.log("Error al guardar datos del pueblo con id " + idP +" y coordenadas "+ coordsP)
                                };
                            }
                        }


                    } else {
                        console.log("Error en la lectura de la lista")
                    }
                }
            }
        }
    }


})();