
javascript:

var newName=prompt('Cuántos Ataques:');

var ii,entrante,label;
var arrInputs=document.getElementById("commands_incomings").getElementsByClassName("command-row no_ignored_command");

for(ii=0;ii<newName;ii++){
    entrante=arrInputs[ii];
    label=entrante.getElementsByClassName("quickedit-label")[0].textContent;

    if(label.includes("{*}")){
        $(entrante).find('.rename-icon').click();
        $(entrante).find('input[type=text]').val(label.replace("{*}","{P}"));
        $(entrante).find('input[type=button]').click();
    }else newName++;
    

}

void(0);