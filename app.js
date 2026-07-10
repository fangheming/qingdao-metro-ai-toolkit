// Bootstrap: this external script runs with proper global scope
window.STATIONS = ['丁家河','东郭庄','中山路','中心医院','井冈山路','仙家寨（汽车北站）','兴国路','农业大学','凤凰岛','凤岗路','北岭','南北屯','南岭','台东','团岛','天目山路','太行山路','安子','安顺路','小寨子','小村庄','山里','广饶路','新港山路','正阳中路','水清沟','永年路','沟岔','沧安路','流亭','海泊桥（海慈医疗）','王家港','瑞金路','石油大学','胜利桥（纺织谷）','薛家岛','西镇','观象山（市立医院）','遵义路','青岛','青岛北站'];

// Duty station areas
var DUTY_MAP={
  '东郭庄':'东郭庄轮值','沟岔':'东郭庄轮值','农业大学':'东郭庄轮值','正阳中路':'东郭庄轮值',
  '小寨子':'东郭庄轮值','凤岗路':'东郭庄轮值','流亭':'东郭庄轮值','仙家寨（汽车北站）':'东郭庄轮值',
  '瑞金路':'兴国派班员','遵义路':'兴国派班员','南岭':'兴国派班员','兴国路':'兴国派班员',
  '永年路':'兴国派班员','沧安路':'兴国派班员','青岛北站':'兴国派班员','安顺路':'兴国派班员','胜利桥（纺织谷）':'兴国派班员',
  '中心医院':'海泊桥轮值','水清沟':'海泊桥轮值','北岭':'海泊桥轮值','小村庄':'海泊桥轮值',
  '海泊桥（海慈医疗）':'海泊桥轮值','台东':'海泊桥轮值','广饶路':'海泊桥轮值','观象山（市立医院）':'海泊桥轮值','中山路':'海泊桥轮值',
  '青岛':'山里派班员','西镇':'山里派班员','团岛':'山里派班员','凤凰岛':'山里派班员',
  '山里':'山里派班员','南北屯':'山里派班员','新港山路':'山里派班员',
  '安子':'王家港轮值','天目山路':'王家港轮值','薛家岛':'王家港轮值','丁家河':'王家港轮值',
  '井冈山路':'王家港轮值','太行山路':'王家港轮值','石油大学':'王家港轮值','王家港':'王家港轮值'
};
function getDutyArea(stationName){return DUTY_MAP[stationName]||'';}

var trains=[],trainMap={},stIdx={};
var currentKey='Z01152',currentTrain=null,currentCurIdx=-2;

function loadData(key){
  currentKey=key;
  var d=key==='Z01152'?Z01152_DATA:Z01647_DATA;
  trains=d.trains;stIdx=d.stations;trainMap={};
  for(var i=0;i<trains.length;i++)trainMap[trains[i].no]=trains[i];
  window.STATIONS=Object.keys(stIdx).sort();
}

function t2s(t){if(!t)return Infinity;var p=t.split(':');return +p[0]*3600 + +p[1]*60 + (+p[2]||0)}
function nowStr(){return new Date().toTimeString().slice(0,8)}
function nowFull(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)+' '+d.toTimeString().slice(0,8)}

function findTrain(no){
  no=(no||'').trim();if(!no)return null;
  var wd=no.length===6?+no[2]:(no.length===4?+no[0]:0);
  if(no.length===6){var t=trainMap[no];if(t)return t;for(var i=0;i<trains.length;i++)if(trains[i].no===no)return trains[i];return null}
  if(no.length===4){var m=[];for(var i=0;i<trains.length;i++){var tn=trains[i].no;if(tn.slice(-4)===no&&(!wd||(tn.length===6?+tn[2]:+tn[0])===wd))m.push(trains[i])}if(m.length===1)return m[0];if(m.length>1)return m}
  return trainMap[no]||null;
}

function computePos(t){
  var ns=t2s(nowStr()),pos='',ci=-1,bw=false,bf=-1;
  for(var i=0;i<t.stations.length;i++){
    var s=t.stations[i],a=t2s(s.a),b=t2s(s.b);
    if(i<t.stations.length-1){var dep=isFinite(b)?b:a,nx=t.stations[i+1],nxt=isFinite(t2s(nx.a))?t2s(nx.a):t2s(nx.b);if(isFinite(dep)&&isFinite(nxt)&&ns>dep&&ns<nxt){bw=true;bf=i;ci=i+.5;pos='运行中: '+s.n+' → '+nx.n;break}}
    if(isFinite(a)&&isFinite(b)&&ns>=a&&ns<=b){ci=i;pos='停靠在 '+s.n;break}
    if(!isFinite(a)&&isFinite(b)&&ns>=b&&ns<=b){ci=i;pos='通过 '+s.n;break}
    if(isFinite(a)&&!isFinite(b)&&ns>=a&&ns<=a){ci=i;pos='通过 '+s.n;break}
  }
  if(ci===-1){
    var ft=t.stations[0].a||t.stations[0].b,fts=t2s(ft);
    var ls=t.stations[t.stations.length-1],lt=ls.b||ls.a,lts=t2s(lt);
    var overnight=lts<fts; // train crosses midnight
    // First check: not yet departed
    if(ft&&ns<fts){
      if(!overnight||ns>16200){pos='尚未发车';ci=0;} // after 4:30AM
      else if(ns<lts){pos='尚未发车';ci=0;} // before midnight: truly not started
    }
    // Second check: already finished
    if(ci===-1&&lt){
      var checkLt=lts;
      if(overnight)checkLt+=86400;
      if(ns>checkLt)pos='退出服务'; // after adjusted arrival
      // Overnight: early morning, train just arrived last night
      if(pos===''&&overnight&&ns>lts&&ns<16200)pos='退出服务';
      if(pos==='退出服务')ci=t.stations.length;
    }
  }
  if(ci===-1)pos='时间不在运行范围内';return{pos:pos,ci:ci,bw:bw,bf:bf};
}

function buildTrainView(t,cp){
  var d=t.dir===1?'下行':'上行',dc=t.dir===1?'d':'u',ar=t.routes&&t.routes.length?t.routes[0]:'';
  if(cp.ci>=0&&t.stations)for(var i=Math.min(Math.floor(cp.ci),t.stations.length-1);i>=0;i--)if(t.stations[i].route){ar=t.stations[i].route;break}
  var h='<div class="rstatus" id="rstatus">'+nowStr()+' · '+currentKey+'</div>';
  h+='<div class="train-card"><span class="tc-no">'+t.no+'</span><span class="tc-dir '+dc+'">'+d+'</span>';
  if(ar)h+=' <span style="display:inline-block;padding:4px 14px;border-radius:8px;font-size:17px;font-weight:700;background:rgba(240,160,40,.25);color:#f0c040;border:1px solid rgba(240,192,64,.3);margin-left:8px;vertical-align:middle">'+ar+'</span>';
  h+='<div class="tc-pos"><span class="pdim">位置：</span><span class="pval" id="posText">'+cp.pos+'</span></div>';
  // Duty area
  var duty='';
  if(cp.bw&&cp.bf>=0)duty=getDutyArea(t.stations[cp.bf].n);
  else if(cp.ci>=0&&cp.ci===Math.floor(cp.ci)&&cp.ci<t.stations.length)duty=getDutyArea(t.stations[cp.ci].n);
  if(duty)h+='<div class="tc-pos"><span class="pdim">属地：</span><span class="pval" style="color:#f0c040">'+duty+'</span></div>';
  h+='<div class="tc-pos"><span class="pdim">路径：</span>'+t.start+' <span class="pval">→</span> '+t.end+' · '+t.stations.length+'站</div>';
  if(t.routes&&t.routes.length>1){h+='<div class="tc-pos"><span class="pdim">全部交路：</span>';for(var i=0;i<t.routes.length;i++)h+='<span class="route-tag">'+t.routes[i]+'</span>';if(t.pickup)h+=' <span class="route-tag" style="background:rgba(64,180,255,.2);color:#4ab8ff;border-color:rgba(64,180,255,.3)">'+t.pickup+'接</span>';h+=' <span style="color:rgba(255,255,255,.3);font-size:11px">'+t.drivers+'位司机</span></div>'}
  else if(t.pickup){h+='<div class="tc-pos"><span class="pdim">接车：</span><span class="route-tag" style="background:rgba(64,180,255,.2);color:#4ab8ff;border-color:rgba(64,180,255,.3)">'+t.pickup+'接</span></div>'}
  h+='</div><div class="timeline">';
  for(var i=0;i<t.stations.length;i++){
    var s=t.stations[i],cls='tl-row';
    if(cp.ci>=0&&i<Math.floor(cp.ci))cls+=' passed';else if((cp.bw&&i===cp.bf)||i===cp.ci)cls+=' current';else if(cp.ci>=0&&i>cp.ci)cls+=' upcoming';
    var ts='';if(!s.a&&s.b)ts='通过 '+s.b;else if(s.a&&!s.b)ts='通过 '+s.a;else if(s.a&&s.b)ts='到 '+s.a+' 发 '+s.b;
    if(s.route)ts+=' <span style="color:#f0c040;font-size:12px;font-weight:600">['+s.route+']</span>';
    h+='<div class="'+cls+'"><span class="tl-time">'+ts+'</span><span class="tl-station">'+s.n+'</span></div>';
  }
  h+='</div>';document.getElementById('results').innerHTML=h;
  if(cp.ci>=0&&cp.ci<t.stations.length){var el=document.querySelector('.tl-row.current');if(el)el.scrollIntoView({block:'start'})}
}

function showTrain(t){var cp=computePos(t);if(cp.ci!==currentCurIdx){currentCurIdx=cp.ci;buildTrainView(t,cp)}else{var st=document.getElementById('rstatus');if(st)st.textContent=nowStr()+' · '+currentKey;var pt=document.getElementById('posText');if(pt)pt.textContent=cp.pos}}

function queryByTrain(input){
  try{
  input=input||document.getElementById('tNo').value.trim();
  if(!input){document.getElementById('results').innerHTML='<div class="placeholder">请输入车次号</div>';return}
  var train=findTrain(input);
  if(!train){currentTrain=null;document.getElementById('results').innerHTML='<div class="placeholder"><div class="ph-icon">⚠️</div>未找到车次: '+input+'</div>';return}
  if(Array.isArray(train)){currentTrain=null;var h='<div class="rstatus">找到 '+train.length+' 个匹配车次</div>';for(var i=0;i<train.length;i++){var t=train[i];h+='<div class="st-card" data-tn="'+t.no+'"><span class="st-dir '+(t.dir===1?'d':'u')+'">'+(t.dir===1?'下行':'上行')+'</span> <span style="color:#00e6b4;font-size:14px;font-weight:600">'+t.no+'</span><div class="st-info">'+t.start+' → '+t.end+'</div></div>'}document.getElementById('results').innerHTML=h;return}
  currentTrain=train;currentCurIdx=-2;showTrain(train)
  }catch(e){document.getElementById('results').innerHTML='<div style="color:red;padding:20px">ERROR: '+e.message+'</div>';}
}

function queryByStation(st){
  st=st||document.getElementById('sName').value.trim();if(!st)return;var dir=+document.getElementById('sDir').value,ts=stIdx[st]||[],results=[];
  for(var i=0;i<ts.length;i++){var t=trainMap[ts[i]];if(!t)continue;if(dir&&t.dir!==dir)continue;var cp=computePos(t);if(cp.ci<0||cp.ci>=t.stations.length)continue;var m=false,mt='',ici=Math.floor(cp.ci);
    if(cp.ci===ici&&t.stations[cp.ci].n===st){m=true;mt='停靠'}else if(cp.bw&&t.stations[cp.bf].n===st){m=true;mt='刚离开'}else if(cp.bw&&cp.bf+1<t.stations.length&&t.stations[cp.bf+1].n===st){m=true;mt='即将到达'}else if(cp.ci===ici&&cp.ci+1<t.stations.length&&t.stations[cp.ci+1].n===st){m=true;mt='下一站'}
    if(m)results.push({train:t,type:mt,cp:cp})}
  if(!results.length){document.getElementById('results').innerHTML='<div class="placeholder">当前没有列车在 '+st+'</div>';return}
  currentTrain=null;var h='<div class="rstatus">'+st+' · 当前 '+results.length+' 趟列车</div>';
  for(var i=0;i<results.length;i++){var r=results[i],t=r.train;h+='<div class="st-card" data-tn="'+t.no+'"><span class="st-dir '+(t.dir===1?'d':'u')+'">'+(t.dir===1?'下行':'上行')+'</span> <span style="color:#00e6b4;font-size:14px;font-weight:600">'+t.no+'</span><span style="color:rgba(255,255,255,.3);font-size:11px;margin-left:8px">'+r.type+'</span><div class="st-info">'+t.start+' → '+t.end+' · '+r.cp.pos+'</div></div>'}
  document.getElementById('results').innerHTML=h
}

// Event bindings & init
document.getElementById('sName').addEventListener('input',function(){var q=this.value.trim().toLowerCase(),list=document.getElementById('sList');if(!q){list.classList.remove('show');return}list.innerHTML='';for(var i=0,c=0;i<STATIONS.length&&c<8;i++){if(STATIONS[i].toLowerCase().indexOf(q)>=0){var dv=document.createElement('div');dv.textContent=STATIONS[i];dv.onclick=(function(sn){return function(){document.getElementById('sName').value=sn;list.classList.remove('show');queryByStation(sn)}})(STATIONS[i]);list.appendChild(dv);c++}}list.classList.toggle('show',list.children.length>0)});
document.addEventListener('click',function(e){if(!e.target.closest('.suggest-wrap'))document.getElementById('sList').classList.remove('show');var el=e.target.closest('[data-tn]');if(el){var t=trainMap[el.getAttribute('data-tn')];if(t){currentTrain=t;currentCurIdx=-2;showTrain(t)}}});
document.getElementById('btnQ').addEventListener('click',function(){var tn=document.getElementById('tNo').value.trim();if(tn)queryByTrain(tn);else queryByStation()});
document.getElementById('tNo').addEventListener('keydown',function(e){if(e.key==='Enter')queryByTrain()});
document.getElementById('sName').addEventListener('keydown',function(e){if(e.key==='Enter'){document.getElementById('sList').classList.remove('show');queryByStation()}});
document.getElementById('ttSelect').addEventListener('change',function(){currentTrain=null;loadData(this.value);document.getElementById('results').innerHTML='<div class="placeholder"><div class="ph-icon">[OK]</div>已切换时刻表</div>'});
setInterval(function(){document.getElementById('liveClock').textContent=nowFull();if(currentTrain)showTrain(currentTrain)},1000);
loadData('Z01152');document.getElementById('liveClock').textContent=nowFull();

// Export to window for onclick handlers
window.queryByTrain=queryByTrain;
window.queryByStation=queryByStation;
window.trains=trains;
window.trainMap=trainMap;
window.STATIONS=STATIONS;
