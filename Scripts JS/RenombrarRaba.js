javascript:

var newName=prompt('Cuántos Ataques:');

var ii,entrante,label;

var arrInputs;
if(getParameterByName('screen') == "info_village"){
    arrInputs=document.getElementById("commands_incomings").getElementsByClassName("command-row no_ignored_command");
}else if(getParameterByName('screen') == "place" || getParameterByName('screen') == "overview"){
    arrInputs=document.getElementById("commands_incomings").getElementsByClassName("command-row no_ignored_command");
}else{
    arrInputs=document.getElementById("incomings_table").getElementsByClassName("nowrap");
}

for(ii=0;ii<newName;ii++){
    entrante=arrInputs[ii];
    label=entrante.getElementsByClassName("quickedit-label")[0].textContent;

    if(label.includes("[❓]")){
        $(entrante).find('.rename-icon').click();
        $(entrante).find('input[type=text]').val(label.replace("[❓]","[💥]"));
        $(entrante).find('input[type=button]').click();
    }else newName++;
    

}

function getParameterByName(name, url = window.location.href) {
	return new URL(url).searchParams.get(name);
}

void(0);




// CON CLICK

function fillClick() {
    jQuery(
        '#commands_outgoings table tbody tr.command-row, #commands_incomings table tbody tr.command-row'
    ).on('click', function () {
        try {
            jQuery(
                '#commands_outgoings table tbody tr.command-row'
            ).removeClass('ra-chosen-command');
            jQuery(this).addClass('ra-chosen-command');

            const commandLandingTime = jQuery(this).find('td:eq(0)').text().trim();

            jQuery(this).find('.rename-icon').click();
            jQuery(this).find('input[type=text]').val(commandLandingTime.replace("[❓]","[💥]"));
        } catch (error) {
            UI.ErrorMessage('Ha ocurrido un error');
            console.error("Error:" , error);
        }
    });
}
fillClick();

