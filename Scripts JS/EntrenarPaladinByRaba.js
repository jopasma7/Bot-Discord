/*
 * Script Name: Entrenar Paladín
 * Version: v1.2
 * Last Updated: 2024-04-15
 * Author: K I N G S 
 * Editor: Rabagalan73
 */


var simple_mode = true;

if (window.location.href.includes('statue&mode=overview')) {
	let $html = `<h3 align="center">Entrenamiento</h3>
    <div class="info_box">
        <div class="content">Establece el tiempo de entrenamiento:</div>
    </div>
    <table width="100%">
        <tbody>`;

		BuildingStatue.knights[Object.keys(BuildingStatue.knights)[0]].usable_regimens.forEach(function (el, i) { 	      	
			if (i % 2 === 0) $html += '<tr>';     	
        	$html += `
                <td>
                    <div class="time">
                        <input type="radio" name="train-knights" value="${i}">
                        <span style="margin-bottom: 1px" class="icon header time"></span>${String(
                            Math.floor(
                                el.duration / 3600
                            )
                        ).padStart(2, '0')}:${String(
                            Math.floor(
                                (el.duration % 3600) / 60
                            )
                        ).padStart(2, '0')}:${String(
                            Math.floor(el.duration % 60)
                        ).padStart(2, '0')}
                    </div>
                </td>`;
       		if (i % 2 !== 0 || i === 4) $html += '</tr>';
    	}
	);

	let paladines_html = ``;
	var names = [];
	var keys = [];
	var collection = Object.keys(BuildingStatue.knights);
	paladines_html += 
		`<tr>
			<td width="50%">Nombre del Paladín</td>
	  	</tr>`;
	for(var i=0;i<collection.length;i++){
		names.push(BuildingStatue.knights[collection[i]].name);
		keys.push(collection[i]);
		if(BuildingStatue.knights[collection[i]].activity.type == "home"){
			paladines_html += 
			`<tr>
				<td width="90%"><strong> `+ BuildingStatue.knights[collection[i]].name + `</strong></td>
				<td width="10%"><input type="button" id="indi" onClick="onIndi(`+Object.keys(BuildingStatue.knights)[i]+`)" class="btn evt-confirm-btn btn-confirm-yes" value="Entrenar"></td>
			</tr>`
		}else{
			paladines_html += 
			`<tr>
				<td width="90%"><strong> `+ BuildingStatue.knights[collection[i]].name + `</strong></td>
				<td width="10%"><input type="button" id="indi" disabled class="btn evt-confirm-btn btn-confirm-yes" value="Ocupado"></td>
			</tr>`
		}
		//console.log("analizando "+i + " value: "+Object.keys(BuildingStatue.knights)[i])
		
	}
	

	

	$html += `
        </tbody>
    </table>

	<br>
	<div class="info_box">
        <div class="content">Envia tus paladines a entrenar por separado:</div>
    </div>


	<h3 align="center">Paladines</h3>
	<div style="padding-top: 4px">
		<table id="paladin_table" width="100%">
			<tbody>
				`+paladines_html+`
			</tbody>
		</table>
		
		
	</div>

	<div class="info_box">
        <div class="content">Entrenamiento global:</div>
    </div>
    <div style="padding-top: 4px">
        <input type="button" id="start" class="btn" value="Entrenar Todos">
        <input type="button" id="save" class="btn" value="Guardar Opciones">
    </div>
    <br>
    <small>
        <strong>
            Training v1.2 by<span style="color: red"> K I N G S </span> & <span style="color: blue">Rabagalan73</span>
        </strong>
    </small>`;

	
	Dialog.show('Knights', $html);
	let val = Number(localStorage.getItem('Statue'));
	$(`input[value="${val === undefined ? 0 : val}"]`).prop('checked', true);




	$('#save').on('click', function () {
		localStorage.setItem('Statue', $('input[type="radio"]:checked').val());
		UI.SuccessMessage(
			'Las opciones han sido guardadas.'
		);
	});

	$('#start').on('click', function (e) {
		e.preventDefault();
		val = Number($('input[type="radio"]:checked').val());
		Dialog.close();
		Object.keys(BuildingStatue.knights).forEach((i, el) => {
			setTimeout(function () {
				TribalWars.post(
					game_data.link_base.replace('amp;screen=', '') +
						'screen=statue&ajaxaction=regimen',
					null,
					{
						knight: BuildingStatue.knights[i].id,
						regimen: BuildingStatue.knights[i].usable_regimens[val].id,
					},
					function () {
						UI.SuccessMessage(_('386e303de70e5a2ff1b5cabefb0666f5'));
					},
					function (r) {
						console.error(r);
					}
				);
			}, el * 250);
		});
	});

	$('#indi').on('click', function (e) {
		$(this).attr("disabled", "disabled");
	});
} else
	UI.InfoMessage('Redireccionando...'),
		(window.location.href = game_data.link_base_pure + 'statue&mode=overview');


function onIndi(id){
	//console.log("ID: "+id);
	val = Number($('input[type="radio"]:checked').val());
		TribalWars.post(
			game_data.link_base.replace('amp;screen=', '') +
				'screen=statue&ajaxaction=regimen',
			null,
			{
				knight: id,
				regimen: BuildingStatue.knights[id].usable_regimens[val].id,
			},
			function () {
				UI.SuccessMessage(_('386e303de70e5a2ff1b5cabefb0666f5'));
			},
			function (r) {
				console.error(r);
			}
		);
}

function disableButt(){
	const buttons = document.querySelectorAll('#indi');

	buttons.forEach((button) => {
		$(button).on('click', function (e) {
			button.disabled = true;
			button.value = "Entrenando...";
		});
	});
}

disableButt();