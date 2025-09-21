/*
 * Script Name: Timing Assist
 * Version: v1.1
 * Modified by: Black_Lottus
 */


var c, ctx, circleReference,
    lastMillis, lastTimingMillis,
    timerInterval, constOffset, runTimes,
    hitMs=getStorage("hit_ms"),
    milliPiFraction=.00628319,calibrationTime=getStorage("offset_ms"),
    imgSrc = {
        green:"https://dsen.innogamescdn.com/asset/04d88c84/graphic/dots/green.png",
        yellow:"https://dsen.innogamescdn.com/asset/04d88c84/graphic/dots/yellow.png",
        red:"https://dsen.innogamescdn.com/asset/04d88c84/graphic/dots/red.png",
        questionmark:"https://dsen.innogamescdn.com/asset/6be9bf502a/graphic/questionmark.png",
        watchtower:"https://dsen.innogamescdn.com/asset/04d88c84/graphic/big_buildings/watchtower1.png"
    };

    if("place" != game_data.screen) {
    alert("This script must be run from the rally point. "
    + "\nRunning during command execution will add millisecond assist."
    + "\n        Running after command excecution will show you by how many milliseconds you missed the target and allow you to .");
    }else if(2 == window.location.href.split("try=").length){
        if(null == runTimes ? runTimes = 1:runTimes++, 1 == runTimes) setTimeout(function(){addDisplay()},50);
        else { 
            var toReset=confirm("Script already running. Do you delete stored variables (May fix the script in case of recurring errors)?");
            1==toReset&&clearStorage()
        }
    }else null==runTimes&&(runTimes=0), promptCalibration();
    
    function addDisplay() {
        try {
            for(var e=$("#date_arrival").parent().parent()[0],t=2;t<e.children.length;t++)
                try {
                    if(null!=e.children[t].children[1].innerHTML.match(":")) {
                        var i=1e3*Number(e.children[t].children[1].innerHTML.split(":")[2]);
                        break
                    }
                }catch(e) {
                    console.log("Could not identify arrival second:\n"+e)
                }
                
                var n=e.children[e.children.length-1];
                constOffset=i+getStorage("const_offset"), e.children[0].innerHTML+="<th colspan='4'>    "
                + "    <span style='white-space:nowrap'>Asistente de Tiempos</span><span>    "
                + "    <img src='"+imgSrc.questionmark+"' onclick='toggleTutorial()' style='float:right;display:inline;height:15px;width:15px;cursor:pointer'></span></th>";
                
                var s=document.createElement("TD"), 
                    a=document.createAttribute("rowspan"),
                    r=document.createAttribute("colspan"),
                    o=document.createAttribute("style");
                    
                    a.value=e.children.length-2,
                    s.setAttributeNode(a),
                    r.value=2,
                    s.setAttributeNode(r),
                    o.value="line-height:1px;text-align:center",
                    s.setAttributeNode(o),
                    s.innerHTML="<div><h2 style='position:absolute;display:block;margin-top:54px;margin-left:63px' id='second_display'></h2>         "
                    +"                   <canvas id='millis_canvas' width='150px' height='130px' style='margin-top:-20px'></canvas></div>";
                    var l=document.createElement("TD"),                    
                        c=document.createAttribute("rowspan"),
                        d=document.createAttribute("colspan"),
                        m=document.createAttribute("style");
                        c.value=e.children.length-2,
                        l.setAttributeNode(c),
                        d.value=2,l.setAttributeNode(d),
                        m.value="height:1px;text-align:center",
                        l.setAttributeNode(m),
                        l.innerHTML="<img src='"+imgSrc.watchtower+"'>";
                        
                    var td=document.createElement("TD"),                    
                        rowspan=document.createAttribute("rowspan"),
                        colspan=document.createAttribute("colspan"),
                        style=document.createAttribute("style");
                        rowspan.value=e.children.length-2,
                        td.setAttributeNode(rowspan),
                        colspan.value=2,td.setAttributeNode(colspan),
                        style.value="height:1px;text-align:center",
                        td.setAttributeNode(style),
                        td.innerHTML="<img src='"+imgSrc.watchtower+"'>";
                    
                    var p=document.createElement("TD");
                    p.innerHTML="<button id='practice_button' type='button' class='btn btn-recruit' onclick='practiceFunction()' style='width:80px'>Test</button>";
                    
                    var u=document.createElement("TD"),
                        h=document.createAttribute("style");
                        h.value="white-space:nowrap",
                        u.setAttributeNode(h),
                        u.innerHTML="<span>Hit: </span><input style='width:30px' id='hit_input' title='Millisecond to hit' type='text' onchange='storeData(\"hit_ms\")' value='"+hitMs+"'></input>";
                    
                    var g=document.createElement("TD"),
                        f=document.createAttribute("style");
                        f.value="white-space:nowrap",
                        g.setAttributeNode(f);
                    
                    var b,y,T,v=new Date;
                    y=v.getTime()-getStorage("last_set_offset")<42e4,T=v.getTime()-getStorage("last_set_const")<36e5,b=y&&T?imgSrc.green:y||T?imgSrc.yellow:imgSrc.red,g.innerHTML="<span>Offset: </span><input id='offset_input' type='text' onchange='storeData(\"offset_ms\")' style='width:30px' value='"+calibrationTime+"'></input>                            <img id='offset_status' src='"+b+"' onclick = getInitialOffset() style='cursor:pointer'>";
                    
                    var ts=document.createElement("TD"),
                        st=document.createAttribute("style");
                        st.value="white-space:nowrap",
                        ts.setAttributeNode(st),
                        ts.innerHTML="<span>Hora: </span><input style='width:120px' id='date_input' title='Time' type='text'></input>";
                    
                    
                    var _=document.createElement("TD");
                    _.innerHTML="<span id='miss_display' style='width:34px;display:block' title='Missed by'>0</span>",
                        $(".village_anchor").parent().parent()[0].appendChild(s),
                        $(".village_anchor").parent().parent()[0].appendChild(l),
                        n.appendChild(p), n.appendChild(u), n.appendChild(g) ,n.appendChild(ts),
                        $("#ds_body")[0].setAttribute("onsubmit","sendFunction()"),
                        timerInterval=setInterval(drawCircle,5)
        }catch(e){
            console.log("Could not find table...\n"+e)
        }
    }
    
    function drawCircle(){
        null==c&&(c=document.getElementById("millis_canvas"),
            ctx=c.getContext("2d"),circleReference=-Math.PI/2,lastMillis=0,lastTimingMillis=0,
            hitMs=$("#hit_input")[0].value,$("#second_display")[0].innerHTML=$(".relative_time")[0].innerHTML.split(":")[2]);
            
        var e=new Date,
            t=(e=new Date(e.getTime()+calibrationTime+constOffset)).getMilliseconds(),
            i=new Date(e.getTime()-hitMs).getMilliseconds();t<lastMillis&&(lastMillis=t,1==String(e.getSeconds()).length?$("#second_display")[0].innerHTML="0"+e.getSeconds():$("#second_display")[0].innerHTML=e.getSeconds()),
            i<lastTimingMillis&&(ctx.clearRect(0,0,160,160),lastTimingMillis=0),ctx.beginPath(),ctx.arc(75,75,50,circleReference+lastTimingMillis*milliPiFraction,circleReference+i*milliPiFraction),ctx.stroke(),lastMillis=t,lastTimingMillis=i
    }
    
    function practiceFunction(){
        var e=new Date,
            t=(e=new Date(e.getTime()+calibrationTime+constOffset)).getMilliseconds();buttonText=["Test","Iniciar"],
            buttonDOM=$("#practice_button")[0],hitMs=$("#hit_input")[0].value,buttonDOM.innerHTML==buttonText[0]?(clearInterval(timerInterval),
            buttonDOM.innerHTML=buttonText[1],Math.abs(t-hitMs)<=500?$("#miss_display")[0].innerHTML=String(t-hitMs):$("#miss_display")[0].innerHTML=-(1e3-(t-hitMs))):(buttonDOM.innerHTML=buttonText[0],timerInterval=setInterval(drawCircle,5)),lastTimingMillis=1200
    }
    
    function sendFunction(){
        var e=new Date;
        
        clearInterval(timerInterval);
        var t=(e=new Date(e.getTime()+calibrationTime+constOffset)).getSeconds(),
            i=e.getMilliseconds();storeData("last_hit",String(t)+":"+String(i))
    }
    
    function updateColor(){
        var e,t,i,n=new Date;t=n.getTime()-getStorage("last_set_offset")<42e4,i=n.getTime()-getStorage("last_set_const")<36e5,e=t&&i?imgSrc.green:t||i?imgSrc.yellow:imgSrc.red,$("#offset_status")[0].src=e
    }
    
    function toggleTutorial(){
        if(null==$("#timing_tutorial")[0]){
            var e,t=document.createElement("DIV"),
                i=document.createElement("DIV"),
                n=document.createAttribute("class"),
                s=document.createAttribute("class"),
                a=.8*$("#contentContainer")[0].offsetWidth;n.value="popup_box_container",
                t.setAttributeNode(n),s.value="fader",i.setAttributeNode(s),
                e="<div class='popup_box mobile show' id='timing_tutorial' style='width:"+a+"px;top:12%'>    "
                    + "        <div class='popup_box_content' style='max-height: 70%;overflow:auto'><a class='popup_box_close tooltip-delayed' onclick='toggleTutorial()' style='cursor:pointer'>&nbsp;</a>     "
                    + "       <h2 class='popup_box_header'>Asistente de Tiempos</h2>            <p>The timing assistant helps you to time your attacks precisely by graphically displaying milliseconds on a circle. The circle is completed when millisecond equals target millisecond.      "
                    + "      The \"Try\"-button can be used to practice timing before executing a command.</p>            "
                    + "            <h5>Calibration</h5>            <p>The timing assistant needs to be regularly calibrated to the tribal wars clock for precise timing. This is done in the following steps:</p>             "
                    + "           <p style='display:inline'><b>Step 1 - Click the coloured indicator.</b></p><br>            <p style='display:inline'>This synchronizes the clock roughly, but does not change the \"offset\" used for finely tuning the clocks.      "
                    + "      This should be done every hour or so.</p><br><br>                        <p style='display:inline'><b>Step 2 - Send a calibration command.</b></p><br>            <p style='display:inline'>Send an attack/support to get real vs estimated hit time.       "
                    + "      This is the most important step for precision and should be done every 5-7 minutes or so, and is completed in step 3.</p><br><br>          "
                    + "              <p style='display:inline'><b>Step 3 - Run script in the rally point after command execution and input \"real hit time\".</b></p><br>     "
                    + "       <p style='display:inline'>Running the script in the rally point after command execution will prompt the user to input real hit time, and display estimated hit time.    "
                    + "         Input the hit time of the command (s:ms) to tell the script it's offset.</p>             "
                    + "           <p>The script should at this point be calibrated, and can be controlled by repeating step 2 and 3 to see whether the script estimates correct time or not      "
                    + "      (Within Â±5-20 ms depending on internet speed and stability). For reoccurring errors, run the script twice on this page and click ok to reset stored variables.</p>       "
                    + "                 <h5>Colour indicators</h5>            <p>The colour indicators shows how long it is since the clocks have been synchronized.</p>      "
                    + "      <img src='"+imgSrc.red+"'><p style='display:inline'> - Neither roughly nor finely tuned</p><br>      "
                    + "      <img src='"+imgSrc.yellow+"'><p style='display:inline'> - Either roughly or finely tuned</p><br>       "
                    + "     <img src='"+imgSrc.green+"'><p style='display:inline'> - Both roughly and finely tuned</p>       "
                    + "     <p><b>Note:</b> The colours do not necessarily reflect the quality of synchronization. To ensure correct synchronization, check whether the script is able to      "
                    + "      estimate the right hit time after sending a trial-command (Â±5-20 ms depending on internet speed and stability).</p>    "
                    + "        </div></div>",
                
                t.innerHTML=e,document.body.appendChild(t),
                document.body.appendChild(i)
        }else $("#timing_tutorial")[0].remove(),$(".fader")[0].remove()
    }
    
    function storeData(e,t){
        var i=localStorage.timeAssistant.split(","),
            n=new Date,s="";"hit_ms"==e?(hitMs=$("#hit_input")[0].value,isNaN(hitMs)&&($("#hit_input")[0].value=getStorage("hit_ms")),
            hitMs=isNaN(Number(hitMs))?getStorage("hit_ms"):Number(hitMs),i[0]=hitMs):"offset_ms"==e?(offsetMs=$("#offset_input")[0].value,isNaN(offsetMs)&&($("#offset_input")[0].value=getStorage("offset_ms")),isNaN(Number(offsetMs))?offsetMs=getStorage("offset_ms"):offsetMS=Number(offsetMs),i[1]=offsetMs,calibrationTime=Number(offsetMs),i[i.length-2]=n.getTime(),
            
            setTimeout(function(){updateColor()},250)):"offset"==e?(t=isNaN(Number(t))?getStorage("offset_ms"):Number(t),i[1]=t,i[i.length-2]=n.getTime()):"last_hit"==e?i[2]=t:"const_offset"==e&&(t=isNaN(Number(t))?getStorage("const_offset"):Number(t),i[3]=t,i[i.length-1]=n.getTime());
            
            for(var a=0;a<i.length-1;a++) s+=i[a]+",";s+=i[i.length-1],localStorage.setItem("timeAssistant",s)
    }
    
    function getStorage(e){
        var t,i=localStorage.timeAssistant,
            n=["hit_ms","offset_ms","last_hit","const_offset","last_set_offset","last_set_const"];
        
        if(null==i) return i="0,0,00:000,0,0,0",localStorage.setItem("timeAssistant",i),0;
        
        i=i.split(",");
        
        for(var s=0;s<n.length;s++) e==n[s]&&(t=2==s?i[s]:Number(i[s]));
        return t
    }
    
    function clearStorage(){
        localStorage.removeItem("timeAssistant"),location.reload()
    }
    
    function promptCalibration(){
        if(null==localStorage.timeAssistant);
        else try{
            var e=getStorage("last_hit"),t=t=e.split(":");i="",e=1e3*Number(t[0])+Number(t[1]),1==t[0].length&&(t[0]="0"+t[0]),1==t[1].length?t[1]="00"+t[1]:2==t[1].length&&(t[1]="0"+t[1]),t=t[0]+":"+t[1];
            var i=prompt("Estimated hit ms is "+t+". Please input correct hit-ms",t);
            if(null!=i){
                var n=i.split(":");e-15e3>(n=1e3*Number(n[0])+Number(n[1]))?n+=6e4:n-15e3>e&&(e+=6e4);
                var s=n-e;s=0==runTimes?Number(s+calibrationTime):Number(s),isNaN(s)?(storeData("offset",0),alert("Could not calculate offset... Please try again!")):(runTimes++,storeData("offset",s))
            }
        }catch(e){
            console.log("Something went wrong while prompting user. Check input!"),alert("Something went wrong... Please enter offset manually. 'Hit time - estimated hit time' gives offset.")
        }
    }
    
    function getInitialOffset(){
        var e,t=new Date;sTime=Timing.getCurrentServerTime(),storeData("const_offset",Math.round(sTime-t.getTime())),updateColor();
        for(var i=$("#date_arrival").parent().parent()[0],n=2;n<i.children.length;n++)
        try{
            if(null!=i.children[n].children[1].innerHTML.match(":")){
                e=1e3*Number(i.children[n].children[1].innerHTML.split(":")[2]);
                break
            }
        }catch(e){
            console.log("Could not identify arrival second:\n"+e)
        }
        constOffset=e+(sTime-t.getTime())           
    }