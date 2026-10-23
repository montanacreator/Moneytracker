(function(){
var KEY="haushaltsbuch-v2",type="e",V="",fc="",af="",armId=null;
var S={accounts:[],cats:{e:["Lebensmittel","Wohnen","Mobilität","Freizeit","Gesundheit","Abos","Sonstiges"],i:["Gehalt","Nebenjob","Geschenk","Sonstiges"]},items:[],budgets:{},recs:[],goals:[],theme:{accent:"#6d1a2c",bg:"#f5ecee"},pin:""};
var $=function(id){return document.getElementById(id)};
var fmt=new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"});
var mfmt=new Intl.DateTimeFormat("de-DE",{month:"long",year:"numeric"});
var dfmt=new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit"});
var EV={1:"Monatlich",2:"Alle 2 Monate",3:"Alle 3 Monate",6:"Halbjährlich",12:"Jährlich"};
function load(){try{var r=localStorage.getItem(KEY);if(r){var o=JSON.parse(r);for(var k in o)if(o[k]!=null)S[k]=o[k]}}catch(e){}
  if(!S.accounts.length)S.accounts=[{id:Date.now(),name:"Girokonto",start:0}]}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function pad(n){return String(n).padStart(2,"0")}
function today(){var d=new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function num(v){return parseFloat(String(v).replace(",","."))}
function uid(){return Date.now()*1000+Math.floor(Math.random()*1000)}
function acc(id){return S.accounts.filter(function(a){return String(a.id)===String(id)})[0]}
function accName(id){var a=acc(id);return a?a.name:"Konto"}
function bal(a){var b=a.start||0;S.items.forEach(function(x){if(x.acc===a.id)b+=x.type==="i"?x.amount:-x.amount});return b}
function msg(t){$("vm").textContent=t}
function lum(h){var n=parseInt(h.slice(1),16);return(.299*(n>>16)+.587*(n>>8&255)+.114*(n&255))/255}
function theme(){var t=S.theme,r=document.documentElement.style,dk=lum(t.bg)<.5;
  r.setProperty("--accent",t.accent);r.setProperty("--bg",t.bg);r.setProperty("--onaccent",lum(t.accent)<.6?"#fff":"#111");
  r.setProperty("--ink",dk?"#f4f4f4":"#1d1d1f");r.setProperty("--muted",dk?"#b8b8b8":"#6b6b70");
  r.setProperty("--surface","color-mix(in srgb,"+t.bg+(dk?" 85%,#fff)":" 35%,#fff)"));
  r.setProperty("--line","color-mix(in srgb,"+t.bg+(dk?" 75%,#fff)":" 82%,#000)"));r.colorScheme=dk?"dark":"light"}
function hash(s){return window.crypto&&crypto.subtle?crypto.subtle.digest("SHA-256",new TextEncoder().encode("mt:"+s)).then(function(b){return Array.from(new Uint8Array(b)).map(function(x){return pad(x.toString(16))}).join("")}):Promise.resolve("p:"+btoa(unescape(encodeURIComponent(s))))}
function nextD(d,e,day){var p=d.split("-"),m=+p[1]-1+e,y=+p[0],dim=new Date(y,m+1,0).getDate(),t=new Date(y,m,Math.min(day,dim));return t.getFullYear()+"-"+pad(t.getMonth()+1)+"-"+pad(t.getDate())}
function runRecs(){var t=today(),ch=0;S.recs.forEach(function(r){var n=0;while(r.next<=t&&n++<240){S.items.push({id:uid(),type:r.type,amount:r.amount,cat:r.cat,note:r.name,date:r.next,acc:r.acc});r.next=nextD(r.next,r.every,r.day);ch=1}});if(ch)save()}
function mrows(){var m=$("month").value;return S.items.filter(function(x){return x.date.slice(0,7)===m&&(!af||String(x.acc)===af)}).sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:b.id-a.id})}
function rowH(x){var p=x.date.split("-");return '<li><div><div class="t">'+esc(x.note||x.cat)+'</div><div class="m">'+dfmt.format(new Date(+p[0],+p[1]-1,+p[2]))+" · "+esc(x.cat)+" · "+esc(accName(x.acc))+'</div></div><span class="amt '+x.type+'">'+(x.type==="i"?"+":"−")+fmt.format(x.amount)+'</span><button class="del" data-act="del-item" data-id="'+x.id+'" aria-label="Eintrag löschen">×</button></li>'}
function listH(r){return r.length?"<ul>"+r.map(rowH).join("")+"</ul>":'<p class="empty">Keine Einträge.</p>'}
function sum(r){var s=0;r.forEach(function(x){s+=x.amount});return s}
function accOpts(){return S.accounts.map(function(a){return '<option value="'+a.id+'">'+esc(a.name)+"</option>"}).join("")}
function barH(n,v,max,over){return '<div class="cat"><span>'+esc(n)+'</span><div class="bar'+(over?" over":"")+'"><i style="width:'+Math.min(100,Math.round(v/max*100))+'%"></i></div><b class="amt">'+fmt.format(v)+"</b></div>"}

function viewHtml(){
  var rows=mrows(),mo=$("month").selectedOptions[0].text,h="";
  if(V==="entries")return["Einträge · "+mo,listH(rows)];
  if(V==="exp"){var ex=rows.filter(function(x){return x.type==="e"}),by={},t=0;
    ex.forEach(function(x){by[x.cat]=(by[x.cat]||0)+x.amount;t+=x.amount});
    var ns=Object.keys(by).sort(function(a,b){return by[b]-by[a]});if(ns.indexOf(fc)<0)fc="";
    h='<div class="chips"><button class="chip" data-act="fc" data-c="" aria-pressed="'+!fc+'">Alle</button>'+ns.map(function(n){return '<button class="chip" data-act="fc" data-c="'+esc(n)+'" aria-pressed="'+(fc===n)+'">'+esc(n)+"</button>"}).join("")+"</div>";
    ns.forEach(function(n){if(!fc||fc===n)h+=barH(n,by[n],t)});
    return["Ausgaben · "+mo,h+listH(fc?ex.filter(function(x){return x.cat===fc}):ex)]}
  if(V==="cats"){["e","i"].forEach(function(t){
    var nm=S.cats[t].slice();rows.forEach(function(x){if(x.type===t&&nm.indexOf(x.cat)<0)nm.push(x.cat)});
    h+="<h3>"+(t==="e"?"Ausgaben":"Einnahmen")+"</h3>"+nm.map(function(c){var r=rows.filter(function(x){return x.type===t&&x.cat===c});
      return "<details><summary><span>"+esc(c)+'</span><b class="amt '+t+'">'+fmt.format(sum(r))+"</b></summary>"+listH(r)+"</details>"}).join("")});
    return["Kategorien · "+mo,h]}
  if(V==="bud"){h='<p class="m">Lege fest, wie viel du pro Kategorie im Monat ausgeben willst. Leer lassen = kein Budget.</p>';
    S.cats.e.forEach(function(c){var sp=sum(rows.filter(function(x){return x.type==="e"&&x.cat===c})),l=S.budgets[c]||0;
      h+='<div class="item"><div class="row"><b>'+esc(c)+'</b><span class="m">'+fmt.format(sp)+(l?" von "+fmt.format(l):"")+'</span></div>'+(l?'<div class="bar'+(sp>l?" over":"")+'"><i style="width:'+Math.min(100,Math.round(sp/l*100))+'%"></i></div>':"")+'<input type="number" step="0.01" min="0" placeholder="Budget pro Monat in €" aria-label="Budget '+esc(c)+'" data-ch="budget" data-c="'+esc(c)+'" value="'+(l||"")+'" style="margin-top:6px"></div>'});
    return["Budgets · "+mo,h]}
  if(V==="rec"){h=S.recs.length?S.recs.map(function(r){return '<div class="item"><div class="row"><div><b>'+esc(r.name)+'</b><div class="m">'+(r.type==="i"?"+":"−")+fmt.format(r.amount)+" · "+EV[r.every]+" · nächste: "+r.next.split("-").reverse().join(".")+" · "+esc(accName(r.acc))+'</div></div><button class="del" data-act="rec-del" data-id="'+r.id+'" aria-label="Löschen">×</button></div></div>'}).join(""):'<p class="empty">Noch keine regelmäßigen Buchungen.</p>';
    var co=function(t){return '<optgroup label="'+(t==="e"?"Ausgabe":"Einnahme")+'">'+S.cats[t].map(function(c){return '<option value="'+t+"|"+esc(c)+'">'+esc(c)+"</option>"}).join("")+"</optgroup>"};
    h+='<h3>Neue regelmäßige Buchung</h3><div class="fld"><input id="rn" placeholder="Name, z. B. Miete" aria-label="Name"><select id="rc" aria-label="Kategorie">'+co("e")+co("i")+'</select><input id="rq" type="number" step="0.01" min="0" placeholder="Betrag in €" aria-label="Betrag"><select id="ra" aria-label="Konto">'+accOpts()+'</select><select id="re" aria-label="Rhythmus">'+Object.keys(EV).map(function(k){return '<option value="'+k+'">'+EV[k]+"</option>"}).join("")+'</select><label for="rd">Erste Buchung am</label><input id="rd" type="date" value="'+today()+'"></div><button class="add" data-act="rec-add" type="button">Hinzufügen</button>';
    return["Regelmäßige Buchungen",h]}
  if(V==="goals"){h=S.goals.length?S.goals.map(function(g){var p=g.target>0?Math.min(100,Math.round(g.saved/g.target*100)):0;
      return '<div class="item"><div class="row"><b>'+esc(g.name)+'</b><button class="del" data-act="goal-del" data-id="'+g.id+'" aria-label="Ziel löschen">×</button></div><div class="m">'+fmt.format(g.saved)+" von "+fmt.format(g.target)+" gespart · noch "+fmt.format(Math.max(0,g.target-g.saved))+' ('+p+' %)</div><div class="bar"><i style="width:'+p+'%"></i></div><div class="row"><input id="g'+g.id+'" type="number" step="0.01" placeholder="Betrag zurücklegen in €" aria-label="Betrag"><button class="lnk" data-act="goal-dep" data-id="'+g.id+'">Einzahlen</button></div></div>'}).join(""):'<p class="empty">Noch keine Ziele.</p>';
    h+='<h3>Neues Ziel</h3><div class="fld"><input id="gn" placeholder="z. B. Auto kaufen" aria-label="Name"><input id="gt" type="number" step="0.01" min="0" placeholder="Benötigter Betrag in €" aria-label="Zielbetrag"><input id="gs" type="number" step="0.01" min="0" placeholder="Schon gespart in €" aria-label="Schon gespart"></div><button class="add" data-act="goal-add" type="button">Ziel anlegen</button>';
    return["Ziele",h]}
  h='<h3 style="margin-top:0">Farben</h3><div class="row"><label for="ca">Hauptfarbe</label><input id="ca" type="color" data-th="accent" value="'+S.theme.accent+'"></div><div class="row"><label for="cb">Hintergrund</label><input id="cb" type="color" data-th="bg" value="'+S.theme.bg+'"></div><button class="lnk" data-act="theme-reset">Zurücksetzen</button>';
  h+='<h3>Sicherheit</h3><p class="m">'+(S.pin?"Passwortschutz ist aktiv.":"Schütze die App mit einem Passwort.")+' Face ID ist in dieser Version nicht möglich.</p><div class="row"><input id="pp" type="password" placeholder="Neues Passwort (mind. 4 Zeichen)" autocomplete="new-password" aria-label="Neues Passwort"><button class="lnk" data-act="pin-set">Setzen</button></div>'+(S.pin?'<button class="lnk" data-act="pin-clear">Passwort entfernen</button>':"");
  h+='<h3>Konten</h3><p class="m">Name · Startguthaben in €</p>'+S.accounts.map(function(a){return '<div class="arow"><input data-ch="aname" data-id="'+a.id+'" value="'+esc(a.name)+'" aria-label="Kontoname"><input type="number" step="0.01" data-ch="astart" data-id="'+a.id+'" value="'+(a.start||0)+'" aria-label="Startguthaben"><button class="del'+(String(a.id)===armId?" arm":"")+'" data-act="del-acc" data-id="'+a.id+'" aria-label="Konto löschen">'+(String(a.id)===armId?"Löschen?":"×")+'</button><div class="m" style="grid-column:1/-1">Aktuell: '+fmt.format(bal(a))+"</div></div>"}).join("")+'<div class="arow"><input id="na" placeholder="Neues Konto" aria-label="Neues Konto"><input id="ns" type="number" step="0.01" placeholder="Guthaben" aria-label="Guthaben"><button class="lnk" data-act="add-acc">+</button></div>';
  h+='<h3>Kategorien</h3>';["e","i"].forEach(function(t){h+='<p class="m">'+(t==="e"?"Ausgaben":"Einnahmen")+'</p><div class="chips">'+S.cats[t].map(function(c){return '<span class="chip">'+esc(c)+' <button class="del" style="padding:0 2px" data-act="del-cat" data-t="'+t+'" data-c="'+esc(c)+'" aria-label="'+esc(c)+' löschen">×</button></span>'}).join("")+'</div><div class="row"><input id="nc'+t+'" placeholder="Neue Kategorie" aria-label="Neue Kategorie"><button class="lnk" data-act="add-cat" data-t="'+t+'">Hinzufügen</button></div>'});
  return["Einstellungen",h]}

function renderHome(){if(af&&!acc(af))af="";var rows=mrows(),inc=0,exp=0,tot=0;
  rows.forEach(function(x){if(x.type==="i")inc+=x.amount;else exp+=x.amount});S.accounts.forEach(function(a){tot+=bal(a)});
  var sel=af?acc(af):null;$("total").textContent=fmt.format(sel?bal(sel):tot);$("tl").textContent=sel?sel.name:"Gesamtguthaben";
  $("accs").innerHTML='<button class="acard" data-act="af" data-id="" aria-pressed="'+!af+'"><span>Alle Konten</span><b>'+fmt.format(tot)+"</b></button>"+S.accounts.map(function(a){return '<button class="acard" data-act="af" data-id="'+a.id+'" aria-pressed="'+(String(a.id)===af)+'"><span>'+esc(a.name)+"</span><b>"+fmt.format(bal(a))+"</b></button>"}).join("");$("inc").textContent=fmt.format(inc);$("exp").textContent=fmt.format(exp);
  var T=[["entries","Einträge",rows.length+" im Monat"],["exp","Ausgaben",fmt.format(exp)],["cats","Kategorien",S.cats.e.length+S.cats.i.length+" Kategorien"],["bud","Budgets",Object.keys(S.budgets).length+" aktiv"],["rec","Regelmäßig",S.recs.length+" Buchungen"],["goals","Ziele",S.goals.length+" Ziele"]];
  $("tiles").innerHTML=T.map(function(t){return '<button class="tile" data-act="view" data-v="'+t[0]+'"><b>'+t[1]+"</b><span>"+t[2]+"</span></button>"}).join("")}
function show(){if(!V)return;var v=viewHtml();$("vt").textContent=v[0];$("vb").innerHTML=v[1];msg("");if(!$("dV").open)$("dV").showModal()}
function fillMonths(keep){var set={};set[today().slice(0,7)]=1;S.items.forEach(function(x){set[x.date.slice(0,7)]=1});
  var ks=Object.keys(set).sort().reverse(),cur=keep||$("month").value||ks[0];
  $("month").innerHTML=ks.map(function(k){var p=k.split("-");return '<option value="'+k+'">'+mfmt.format(new Date(+p[0],+p[1]-1,1))+"</option>"}).join("");
  $("month").value=ks.indexOf(cur)>-1?cur:ks[0]}
function all(keep){fillMonths(keep);renderHome();show()}
function fillCats(){$("cat").innerHTML=S.cats[type].map(function(c){return "<option>"+esc(c)+"</option>"}).join("");
  $("bE").setAttribute("aria-pressed",type==="e");$("bI").setAttribute("aria-pressed",type==="i")}
function openEntry(){$("amount").value="";$("note").value="";$("errE").textContent="";$("date").value=today();$("acc").innerHTML=accOpts();var pre=af||S.lastAcc;if(pre&&acc(pre))$("acc").value=pre;fillCats();$("dE").showModal();$("amount").focus()}
function saveEntry(){var a=num($("amount").value),d=$("date").value;
  if(!(a>0)){$("errE").textContent="Bitte einen Betrag größer als 0 eingeben.";return}
  if(!d){$("errE").textContent="Bitte ein Datum wählen.";return}
  S.items.push({id:uid(),type:type,amount:Math.round(a*100)/100,cat:$("cat").value,note:$("note").value.trim(),date:d,acc:+$("acc").value});
  S.lastAcc=$("acc").value;save();$("dE").close();all(d.slice(0,7))}

document.addEventListener("click",function(e){var b=e.target.closest("[data-act]");if(!b)return;var a=b.dataset.act,d=b.dataset;
  if(a==="view"){V=d.v;armId=null;show()}
  else if(a==="close"){V="";$("dV").close()}
  else if(a==="open-entry")openEntry();
  else if(a==="del-item"){S.items=S.items.filter(function(x){return String(x.id)!==d.id});save();all()}
  else if(a==="fc"){fc=d.c;show()}
  else if(a==="af"){af=d.id;renderHome();show()}
  else if(a==="del-acc"){if(S.accounts.length<2){msg("Mindestens ein Konto muss bleiben.");return}
    if(armId!==d.id){armId=d.id;show();return}
    S.accounts=S.accounts.filter(function(x){return String(x.id)!==d.id});S.items=S.items.filter(function(x){return String(x.acc)!==d.id});S.recs=S.recs.filter(function(x){return String(x.acc)!==d.id});armId=null;save();all()}
  else if(a==="add-acc"){var n=$("na").value.trim();if(!n){msg("Bitte einen Kontonamen eingeben.");return}S.accounts.push({id:uid(),name:n,start:num($("ns").value)||0});save();all()}
  else if(a==="del-cat"){S.cats[d.t]=S.cats[d.t].filter(function(c){return c!==d.c});save();all()}
  else if(a==="add-cat"){var c=$("nc"+d.t).value.trim();if(!c){msg("Bitte einen Namen eingeben.");return}if(S.cats[d.t].indexOf(c)<0)S.cats[d.t].push(c);save();all()}
  else if(a==="rec-add"){var q=num($("rq").value),dt=$("rd").value,v=$("rc").value;
    if(!(q>0)){msg("Bitte einen Betrag größer als 0 eingeben.");return}if(!dt){msg("Bitte ein Datum wählen.");return}
    S.recs.push({id:uid(),name:$("rn").value.trim()||v.slice(2),type:v[0],amount:Math.round(q*100)/100,cat:v.slice(2),acc:+$("ra").value,every:+$("re").value,next:dt,day:+dt.slice(8)});runRecs();save();all()}
  else if(a==="rec-del"){S.recs=S.recs.filter(function(r){return String(r.id)!==d.id});save();all()}
  else if(a==="goal-add"){var gn=$("gn").value.trim(),gt=num($("gt").value);if(!gn||!(gt>0)){msg("Bitte Name und Zielbetrag eingeben.");return}S.goals.push({id:uid(),name:gn,target:gt,saved:num($("gs").value)||0});save();all()}
  else if(a==="goal-del"){S.goals=S.goals.filter(function(g){return String(g.id)!==d.id});save();all()}
  else if(a==="goal-dep"){var v2=num($("g"+d.id).value);if(isNaN(v2)||!v2){msg("Bitte einen Betrag eingeben.");return}S.goals.forEach(function(g){if(String(g.id)===d.id)g.saved=Math.max(0,g.saved+v2)});save();all()}
  else if(a==="theme-reset"){S.theme={accent:"#6d1a2c",bg:"#f5ecee"};theme();save();show()}
  else if(a==="pin-set"){var p=$("pp").value;if(p.length<4){msg("Das Passwort braucht mindestens 4 Zeichen.");return}hash(p).then(function(h){S.pin=h;save();show();msg("Passwort gesetzt.")})}
  else if(a==="pin-clear"){S.pin="";save();show();msg("Passwort entfernt.")}
});
document.addEventListener("change",function(e){var t=e.target,c=t.dataset.ch;if(!c)return;
  if(c==="aname")acc(t.dataset.id).name=t.value.trim()||"Konto";
  else if(c==="astart")acc(t.dataset.id).start=num(t.value)||0;
  else if(c==="budget"){var v=num(t.value);if(v>0)S.budgets[t.dataset.c]=v;else delete S.budgets[t.dataset.c]}
  save();all()});
document.addEventListener("input",function(e){var t=e.target;if(t.dataset.th){S.theme[t.dataset.th]=t.value;theme();save()}});
$("bE").onclick=function(){type="e";fillCats()};$("bI").onclick=function(){type="i";fillCats()};
$("sE").onclick=saveEntry;$("cE").onclick=function(){$("dE").close()};
$("month").onchange=function(){renderHome();show()};
function unlock(){hash($("lp").value).then(function(h){if(h===S.pin){$("lock").hidden=true;$("lp").value=""}else $("le").textContent="Falsches Passwort."})}
$("lu").onclick=unlock;$("lp").addEventListener("keydown",function(e){if(e.key==="Enter")unlock()});
load();theme();runRecs();if(S.pin)$("lock").hidden=false;fillMonths();renderHome();
})();
