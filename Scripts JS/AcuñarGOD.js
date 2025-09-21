// ==UserScript==
// @name         Auto-Mint Coins
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Revisa los recursos y acuña monedas automáticamente si es posible. Recarga la página tras 5 intentos fallidos consecutivos, mostrando el número de intentos en el log.
// @author       Tú
// @match        https://es91.guerrastribales.es/game.php?screen=snob*
// @grant        none
// ==/UserScript==

(async function () {
    console.log("=== Iniciando script para acuñar monedas automáticamente ===");

    let failedAttempts = 0; // Contador de intentos fallidos consecutivos

    // Función para verificar recursos y acuñar monedas
    const checkAndMintCoins = () => {
        try {
            // Extraer los requisitos de recursos desde la tabla
            const requiredWood = parseInt(jQuery('#coin_cost_wood .value').text().replace(/\D/g, ''), 10);
            const requiredStone = parseInt(jQuery('#coin_cost_stone .value').text().replace(/\D/g, ''), 10);
            const requiredIron = parseInt(jQuery('#coin_cost_iron .value').text().replace(/\D/g, ''), 10);

            // Verificar los recursos actuales
            const wood = parseInt(jQuery('#wood').text().replace(/\D/g, ''), 10);
            const stone = parseInt(jQuery('#stone').text().replace(/\D/g, ''), 10);
            const iron = parseInt(jQuery('#iron').text().replace(/\D/g, ''), 10);

            console.log(`Requisitos: Madera=${requiredWood}, Barro=${requiredStone}, Hierro=${requiredIron}`);
            console.log(`Recursos actuales: Madera=${wood}, Barro=${stone}, Hierro=${iron}`);

            // Calcular el número máximo de monedas que se pueden acuñar
            const maxCoinsByWood = Math.floor(wood / requiredWood);
            const maxCoinsByStone = Math.floor(stone / requiredStone);
            const maxCoinsByIron = Math.floor(iron / requiredIron);
            const maxCoins = Math.min(maxCoinsByWood, maxCoinsByStone, maxCoinsByIron);

            console.log(`Máximo de monedas que se pueden acuñar: ${maxCoins}`);

            if (maxCoins > 0) {
                // Restablecer el contador de intentos fallidos
                failedAttempts = 0;

                // Establecer el número máximo de monedas en el campo de entrada
                jQuery('#coin_mint_count').val(maxCoins);

                // Ejecutar el comando para acuñar monedas
                console.log("Acuñando monedas...");
                jQuery('input[type="submit"].btn-default[value="Acuñar"]').click();
            } else {
                failedAttempts++;
                console.log(`No hay suficientes recursos para acuñar monedas. Intentos fallidos consecutivos: ${failedAttempts}`);

                // Si se alcanzan 10 intentos fallidos consecutivos, recargar la página
                if (failedAttempts >= 10) {
                    console.log("Se alcanzaron 10 intentos fallidos consecutivos. Recargando la página...");
                    location.reload();
                }
            }
        } catch (error) {
            console.error("Error al verificar recursos o acuñar monedas:", error);
        }
    };

    // Ejecutar la verificación de recursos y acuñación cada 5 segundos
    setInterval(checkAndMintCoins, 5000);
})();