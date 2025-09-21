javascript:
//Creator: Alex "Rabagalan73"

/*Version list:
V1.0 - Updated 25/08/2021 - Starting the proyect and adding new features!
*/


var count = 0;
var allowedScreens = ['report', 'info_command'];

var translations = {
    es_ES: {
		'Usage': 'Este script se ejecuta desde un informe.',
	},
};

function messages(string) {
	var gameLocale = game_data.locale;

	if (translations[gameLocale] !== undefined) {
		return translations[gameLocale][string];
	} else {
		return translations['es_ES'][string];
	}
}

function getParameterByName(name, url = window.location.href) {
	return new URL(url).searchParams.get(name);
}

(function () {
    const gameScreen = getParameterByName('screen');
    const gameView = getParameterByName('view');
    const commandId = getParameterByName('id');
    if (allowedScreens.includes(gameScreen)) {
        if (gameScreen === 'report' && gameView !== null)  initScript();
        else if (gameScreen === 'info_command' && commandId !== null) initScript();
        else UI.ErrorMessage(messages('Usage'), 2000);
    } else UI.ErrorMessage(messages('Usage'), 2000);
})();

function initScript() {
    UI.ErrorMessage("Hola", 2000);

	// Pillar el pueblo desde donde son las tropas
	var village = $('table#vis')[0];
	console.log(village);
	var villageToSend
	// Pueblo donde están apoyando las tropas.
	// Pillar las tropas

}



