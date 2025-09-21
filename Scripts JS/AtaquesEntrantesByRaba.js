javascript:

// ******************************************** //
//              Create Script Func              //
// ******************************************** //

script();

// This method will create a new window where the new fakes script will appear with all the coordinates.
function script(){

    var table = $('#combined_table')[0];
    if(table != undefined){
        for (var i = 1, row; row = table.rows[i]; i++) {
            if(row.cells[1].getElementsByTagName("img").length != 0){
                var a = row.cells[1].getElementsByTagName("img")[0].dataset.title;
                var e = a.replace(")","").replace("Bajo ataque (","");
                row.cells[0].textContent = "( " + e + " )";
                
            }
        }
    }

    var table = $('#production_table')[0];
    if(table != undefined){
        for (var i = 1, row; row = table.rows[i]; i++) {
            if(row.cells[1].getElementsByTagName("img").length != 0){
                var a = row.cells[1].getElementsByTagName("img")[0].dataset.title;
                var e = a.replace(")","").replace("Bajo ataque (","");
                row.cells[0].textContent = "( " + e + " )";
                
            }
        }
    }
    

}

void(0);