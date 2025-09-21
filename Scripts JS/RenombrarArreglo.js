javascript: 

( 
    function(By, Chinezu) {
        $('.quickedit-label').each(function(i, e) {
            if (Chinezu.Rename.indexOf($(e).text().trim()) != -1) {
                $(e).parent().parent().parent().parent().find('input[type="checkbox"]').prop('checked', !0);
                By = !0;
            }
        });
        
        if (By) {
            $('input[name="label_format"]').val(Chinezu.Name);
            $('input[name="label"]').click();
        } else document.location.reload(!By);      
    }
)

(!1, {
        Rename: ['Ataque', 'Apoyo'],
        Name: '"%unit% (%coords%) %player% - %duration%"'
    }
)



