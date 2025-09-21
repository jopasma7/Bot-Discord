javascript:

coords='502|495';
name = "fakes";
msg = {
    target: "Objetivo numero",
    total: "Total:",
    error: "Tropas insuficientes!",
    end: "Final de la lista!"
};
var b = document;

function e(a) {
    return b.getElementsByName(a)[0];
}



function k(a) {
    return Number(e(a).nextSibling.nextSibling.innerHTML.match(/\d+/));
}

function n() {
    var a = p,
        t = q;

    function D(a, d) {
        a.push("\n");
        for (var c = 0; c < a.length; c++) {
            if (0 < d) {
                if (a[c][1]) {
                    k(a[c][0]) > a[c][1] ? (a[c][1] += 1, d -= unitsValor[a[c][0]], m += unitsValor[a[c][0]], insertUnit(e(a[c][0]), a[c][1])) : (a.splice(c, 1), c = -1);
                } else {
                    if (1 == a.length) break;
                    c = -1;
                }
            } else break;
        }
        0 < d && (e(name).innerHTML = " " + msg.error, e(name).style.color = "red");
    }
    var v = [],
        m = t,
        f = [
            ["main", 10, [1.17, 5]],
            ["farm", 5, [1.172102, -240]],
            ["storage", 6, [1, 0]],
            ["place", 0, [1, 0]],
            ["barracks", 16, [1.17, 7]],
            ["smith", 19, [1.17, 20]],
            ["wood", 6, [1.155, 5]],
            ["stone", 6, [1.14, 10]],
            ["iron", 6, [1.17, 10]],
            ["market", 10, [1.17, 20]],
            ["stable", 20, [1.17, 8]],
            ["wall", 8, [1.17, 5]],
            ["garage", 24, [1.17, 8]],
            ["hide", 5, [1.17, 2]],
            ["snob", 512, [1.17, 80]],
            ["statue", 24, [1, 10]]
        ],
        a = a.reverse(),
        w = f.map(function (a) {
            return Number(game_data.village.buildings[a[0]]);
        }),
        f = f.map(function (a, d) {
            return 0 == w[d] ? 0 : Math.round(a[1] * Math.pow(1.2, w[d] - 1));
        }),
        f = Math.floor(function (a) {
            var d = 0;
            a.forEach(function (a) {
                d += a;
            });
            return d;
        }(f) / 100);
    if (!(0 > f - t)) {
        for (x = 0; a.length > x;) e(a[x]) && 1 > k(a[x]) ? a.splice(x, 1) : x++;
        for (var g = 0; g < a.length; g++) {
            var l = Math.ceil((f - t) / a.length / unitsValor[a[g]]),
                l = l + Number(e(a[g]).value);
            l > k(a[g]) ? l = k(a[g]) : v.push([a[g], l]);
            m += unitsValor[a[g]] * l;
            insertUnit(e(a[g]), l);
        }
        f > m && D(v.reverse(), f - m);
    }
}
if (e("input") && "" == e("input").value) {
    e(name) || $("h3").append('<span name="' + name + '" style="color:green;font-size:11px;"></span>');
    var s = coords.split(" "),
        u = 0,
        p = [],
        q = 0,
        y = Math.floor((Math.random() * s.length) + 0).toString();
    /^-?[\d.]+(?:e-?\d+)?$/.test(y) && (u = Number(y));
    e(name).innerHTML = " " + msg.target + " " + (u) + "  (" + s[u] + "). " + msg.total + " " + s.length;
    e(name).style.color = "green";
    e("input").value = s[u];
    for (var z in units) {
        if (e(z)) {
            var A = units[z],
                B = Number(A),
                C = k(z) + B;
            "boolean" == typeof A && A ? insertUnit(e(z), k(z)) : "boolean" != typeof A || A ? 0 > B ? 0 < C && insertUnit(e(z), C) : k(z) >= A && insertUnit(e(z), B) : p.push(z);
            q += e(z).value * unitsValor[z];
        }
    }
    0 < p.length && n();
}
xProcess("inputx", "inputy");
btnA = document.getElementById('target_attack');
btnA.focus();
void(0)
