(async function () {
    console.log("=== Iniciando script para obtener tiempos de llenado del almacén y ejecutar cuenta atrás ===");

    // URL de la página de almacenamiento
    const storageUrl = `${game_data.link_base_pure}storage`;

    try {
        console.log(`Accediendo a la URL: ${storageUrl}`);
        const response = await jQuery.get(storageUrl);
        console.log("Página cargada correctamente.");

        // Parsear el HTML de la respuesta
        const htmlDoc = jQuery.parseHTML(response);

        // Extraer los tiempos de llenado para madera, barro y hierro
        const resources = ["wood", "stone", "iron"];
        const fullTimes = {};

        resources.forEach((resource) => {
            const timeElement = jQuery(htmlDoc).find(`.icon.header.${resource}`).closest("tr").find("span[data-endtime]");
            const endTime = parseInt(timeElement.attr("data-endtime"), 10);
            const timeLeft = timeElement.text().trim();

            fullTimes[resource] = {
                endTime,
                timeLeft,
            };
        });

        // Encontrar el tiempo más cercano
        const currentTime = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
        const closestResource = resources.reduce((closest, resource) => {
            const { endTime } = fullTimes[resource];
            if (!closest || endTime < fullTimes[closest].endTime) {
                return resource;
            }
            return closest;
        }, null);

        const closestEndTime = fullTimes[closestResource].endTime;
        const adjustedEndTime = closestEndTime - 15; // Ajustar para ejecutar 15 segundos antes

        console.log(`\nEl recurso más cercano a llenarse es: ${closestResource.toUpperCase()}`);
        console.log(`Timestamp de llenado más cercano: ${new Date(closestEndTime * 1000).toLocaleString()}`);
        console.log(`El comando se ejecutará 15 segundos antes: ${new Date(adjustedEndTime * 1000).toLocaleString()}`);

        // Crear una cuenta atrás con un diseño más elegante
        const timerContainer = document.createElement('div');
        timerContainer.id = 'timerContainer';
        timerContainer.style.position = 'fixed';
        timerContainer.style.top = '20px';
        timerContainer.style.right = '20px';
        timerContainer.style.backgroundColor = '#1e1e2f';
        timerContainer.style.border = '2px solid #4caf50';
        timerContainer.style.borderRadius = '10px';
        timerContainer.style.padding = '15px';
        timerContainer.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
        timerContainer.style.zIndex = '10000';
        timerContainer.style.fontFamily = 'Arial, sans-serif';
        timerContainer.style.textAlign = 'center';
        timerContainer.style.color = '#ffffff';

        timerContainer.innerHTML = `
            <h4 style="margin: 0; font-size: 18px; color: #4caf50;">⏳ Cuenta atrás</h4>
            <p id="countdownTimer" style="margin: 10px 0; font-size: 24px; font-weight: bold;">Calculando...</p>
        `;
        document.body.appendChild(timerContainer);

        // Actualizar la cuenta atrás cada segundo
        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
            const timeLeft = adjustedEndTime - now;

            if (timeLeft <= 5 && timeLeft > 0) {
                playSound(); // Reproducir sonido atractivo

                // Ejecutar el bloque de código proporcionado
                executeCoinBlock();
            }

            if (timeLeft <= 0) {
                console.log("¡El tiempo ha terminado! Reproduciendo sonido y ejecutando el bloque de código sin parar...");
                playSound(); // Continuar reproduciendo el sonido
                executeCoinBlock(); // Continuar ejecutando el bloque de código
            } else {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                const timerElement = document.getElementById('countdownTimer');
                timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            }
        }, 1000);

        // Función para reproducir un sonido atractivo
        function playSound() {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'triangle'; // Tipo de onda
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // Frecuencia en Hz (A4)
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5); // Duración de 0.5 segundos
        }

        // Función para ejecutar el bloque de código proporcionado
        function executeCoinBlock() {
            jQuery(document).ready(function () {
                let coins = jQuery('#coin_mint_fill_max').text();
                coins = coins.substring(1, coins.length - 1); // Eliminar paréntesis
                jQuery('#coin_mint_count').val(coins); // Establecer el valor en el campo de entrada
                jQuery('input[type="submit"].btn-default').focus(); // Enfocar el botón
            });
        }
    } catch (error) {
        console.error("Error al obtener los datos de la página de almacenamiento:", error);
    }
})();