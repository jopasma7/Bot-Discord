javascript:
if (document.URL.match("mode=incomings&type=unignored&subtype=attacks")) {
        $("#incomings_table").find("tr").eq(0).find("th").last().after('<th>Watchtower</th>');
    
        var url = "https://" + location.host + game_data.link_base_pure + "overview_villages&mode=buildings&group=0&page=-1",
            url2 = "https://" + location.host + "/interface.php?func=get_unit_info",
            towerCoords = [],
            towerLevels = [],
            unitSpeed = [],
            intersectionPoints = [],
            block = [],
            timesRun = 1,
            rows = Number($("#incomings_table").find("th").first().text().replace("Comando ", "").replace("(", "").replace(")", ""));
    
        function first() {
            $.ajax({
                url: url2,
                success: function (data) {
                    $.each(["sword", "axe", "spy", "light", "heavy", "ram", "snob"], function (key, val) {
                        var speedText = $(data).find("config > " + val + " > speed").text();
                        var speed = Number(speedText) * 60;
    
                        if (!isNaN(speed)) {
                            unitSpeed.push(speed);
                        } else {
                            console.error("Velocidad de unidad no válida para", val, ":", speedText);
                        }
                    });
    
                    $.ajax({
                        url: url,
                        success: function (datas) {
                            $(datas).find("#villages").find("tr").each(function (key, val) {
                                var level = Number($(val).find(".upgrade_building.b_watchtower").text());
    
                                if (level > 0) {
                                    towerCoords.push($(val).find(".quickedit-label").text().match(/\d+\|\d+/)[0]);
    
                                    var radiusMap = [1.1, 1.3, 1.5, 1.7, 2, 2.3, 2.6, 3, 3.4, 3.9, 4.4, 5.1, 5.8, 6.7, 7.6, 8.7, 10, 11.5, 13.1, 15];
                                    towerLevels.push(radiusMap[level - 1]);
                                }
                            });
    
                            if (towerCoords.length == 0) {
                                UI.ErrorMessage("There are no watchtowers in any of your villages!", 5000);
                            }
                        },
                    });
                },
            });
        }
    
        var doStuff = function () {
            $.ajax({
                url: url,
                success: function () {
                    intersectionPoints = [];
                    block = [];
    
                    // Iterar sobre todas las filas, comenzando desde la fila 1
                    $("#incomings_table").find("tr").each(function (index) {
                        if (index === 0) return; // Saltar la cabecera
    
                        var $thisRow = $(this);
                        var cells = $thisRow.find("td");
    
                        // Verificar si las celdas necesarias existen y la cantidad de celdas
                        if (cells.length < 7) {
                            console.warn("Fila incompleta en la fila " + index + ". Se omite.");
                            return; // Omitir esta fila si no tiene suficientes celdas
                        }
    
                        var distanceCell = cells.eq(4);
                        var destinationCell = cells.eq(1);
                        var originCell = cells.eq(2);
                        var timeCell = cells.eq(6);
    
                        // Verificar que las celdas no están vacías
                        if (!distanceCell.length || !destinationCell.length || !originCell.length || !timeCell.length) {
                            console.error("Una o más celdas están vacías en la fila", index);
                            return;
                        }
    
                        $thisRow.find("td").last().after("<td></td>");
    
                        var distance = Number(distanceCell.text().trim());
                        var destination = destinationCell.text().match(/\d+\|\d+/)[0];
                        var origin = originCell.text().match(/\d+\|\d+/)[0];
    
                        var hmsText = timeCell.text().trim();
                        console.log("Tiempo extraído:", hmsText);
    
                        var hms = hmsText.split(':');
    
                        if (hms.length !== 3) {
                            console.error("Formato incorrecto de tiempo:", hms);
                            return;
                        }
    
                        var seconds = (+hms[0]) * 3600 + (+hms[1]) * 60 + (+hms[2]);
                        console.log("Tiempo en segundos:", seconds);
    
                        var commandName = $(this).find("td").eq(0).text().trim();
                        console.log("Nombre del comando:", commandName);
    
                        var remainingFields;
                        if (commandName.includes("Espada")) {
                            remainingFields = seconds / unitSpeed[0];
                        } else if (commandName.includes("Machado") || commandName.includes("Lanceiro")) {
                            remainingFields = seconds / unitSpeed[1];
                        } else if (commandName.includes("Batedor") || commandName.includes("Btd")) {
                            remainingFields = seconds / unitSpeed[2];
                        } else if (commandName.includes("CAVL") || commandName.includes("Leve")) {
                            remainingFields = seconds / unitSpeed[3];
                        } else if (commandName.includes("CAVP") || commandName.includes("Pesada")) {
                            remainingFields = seconds / unitSpeed[4];
                        } else if (commandName.includes("Ariete") || commandName.includes("Cata") || commandName.includes("Catapulta")) {
                            remainingFields = seconds / unitSpeed[5];
                        } else if (commandName.includes("Nobre")) {
                            remainingFields = seconds / unitSpeed[6];
                        }
    
                        if (isNaN(remainingFields)) {
                            console.error("remainingFields no es válido en la fila", index);
                            return;
                        }
    
                        var M = destination.split("|");
                        var source = origin.split("|");
    
                        var remaining = Math.sqrt(Math.pow((M[0] - source[0]), 2) + Math.pow((M[1] - source[1]), 2)) - (distance - remainingFields);
                        console.log("Distancia restante:", remaining);
    
                        if (isNaN(remaining)) {
                            console.error("Cálculo de tiempo fallido en la fila", index);
                            return;
                        }
    
                        var sec = remaining * unitSpeed[0];
    
                        function clock(x) {
                            myTimer = setInterval(myClock, 1000);
    
                            function myClock() {
                                if (isNaN(sec) || sec < 0) {
                                    clearInterval(myTimer);
                                    var time = "Detected";
                                    $(x).find("td").last().text(time).css({
                                        "font-weight": "bold",
                                        "color": "green"
                                    });
                                    return;
                                }
    
                                --sec;
                                var seconds = Math.floor(sec % 60);
                                var minutes = Math.floor((sec / 60) % 60);
                                var hours = Math.floor((sec / (60 * 60)));
    
                                // Formatear los valores a dos dígitos si son menores a 10
                                seconds = seconds < 10 ? "0" + seconds : seconds;
                                minutes = minutes < 10 ? "0" + minutes : minutes;
                                hours = hours < 10 ? "0" + hours : hours;
    
                                var time = hours + ":" + minutes + ":" + seconds;
    
                                // Actualizar el tiempo en la tabla
                                $(x).find("td").last().text(time).css("font-weight", "bold");
    
                                if (sec <= 0) {
                                    clearInterval(myTimer);
                                }
                            }
                        }
    
                        clock(this);
    
                        console.log("Datos finales:");
                        console.log("Velocidades de unidades:", unitSpeed);
                        console.log("Distancia:", distance);
                        console.log("Destino:", destination);
                        console.log("Origen:", origin);
                        console.log("Remaining Fields:", remainingFields);
                        console.log("Tiempo restante:", sec);
                    });
                },
            });
        }
    
        $.ajax({
            url: first(),
            success: function () {
                setTimeout(doStuff, 1);
            }
        });
    
    } else {
        self.location = game_data.link_base_pure.replace(/screen\=\w*/i, "screen=overview_villages&mode=incomings&type=unignored&subtype=attacks");
    }
    
    void(0);
    