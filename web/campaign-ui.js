'use strict';
// Presentation only. Entry, settlement and lineup changes are handled by the save owner.
globalThis.CampaignUI=(()=>{
 const L=(en,es)=>language==='es'?es:en;
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pad=n=>String(n).padStart(2,'0');
 const clubPartner=()=>L('Club partner','Compañero del club');
 const name=id=>Number.isInteger(id)&&id>=0&&roster[id]?roster[id].name:clubPartner();
 const art=(id,fallback)=>id!=null&&id>=0?id:fallback;
 const head=id=>Number.isInteger(id)&&id>=0&&roster[id]?CharacterPortraits.thumbnail(roster[id]):clubBadge();
 const full=id=>Number.isInteger(id)&&id>=0&&roster[id]?CharacterPortraits.side(roster[id]):clubBadge();
 function icon(shape){
  const paths={rival:'m12 2 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 8.6l6.2-.9z',up:'m5 15 7-7 7 7',ok:'m4 12 5 5L20 6',team:'M2 19v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M15 13a5 5 0 0 1 7 5M11 7a3 3 0 1 1-6 0 3 3 0 1 1 6 0m9 1a3 3 0 1 1-6 0 3 3 0 1 1 6 0',back:'m14 5-7 7 7 7',go:'M5 17 18 4M6 4h12v12',lock:'M7 10V7a5 5 0 0 1 10 0v3M4 10h16v11H4z'};
  return '<svg class="cp-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="'+paths[shape]+'"/></svg>';
 }
 function clubBadge(){return '<span class="cp-club-badge" aria-hidden="true">'+icon('team')+'</span>';}
 const coin=n=>'<span class="cp-money"><img src="/currency-coin.webp" alt="'+L('coins','monedas')+'">'+Number(n||0).toLocaleString(language==='es'?'es-ES':'en-US')+'</span>';
 const button=(action,label,primary=false,extra='')=>'<button type="button" data-meta="campaign:'+action+'" class="cp-button '+(primary?'primary':'meta-button')+'" '+extra+'>'+label+'</button>';
 const back=(action='back')=>button(action,icon('back')+L('Back','Volver'));
 const bagNames=()=>[L('Common bag','Bolsa común'),L('Rare bag','Bolsa rara'),L('Epic bag','Bolsa épica'),L('Legendary bag','Bolsa legendaria')];
 function feeButton(m){
  if(m.attempt)return button('enter',L('Resume match','Reanudar partido')+icon('go'),true);
  if(m.coins<m.fee)return button('recover',L('Earn coins','Ganar monedas')+icon('go'),true);
  if(m.confirmRetry)return button('enter',L('Play','Jugar'),true);
  return button(m.retry?'retry':'enter',(m.retry?L('Retry','Reintentar'):L('Play','Jugar'))+' '+coin(m.fee),true);
 }
 function ladder(m){
  const sections=Career.campaign.sections,currentSection=Math.floor(m.rung/4);
  return sections.map((section,i)=>{
   const locked=i>currentSection, first=i*4, last=i===sections.length-1;
   const rows=[3,2,1,0].map(index=>{
    const rung=first+index,boss=index===3,active=rung===m.rung,done=rung<m.rung;
    const label=boss?name(section.rival):L('Club match','Partido de club')+' '+(index+1);
    const status=done?icon('ok'):active?L('Up next','A jugar'):locked?icon('lock'):boss?icon('rival'):icon('lock');
    return '<li class="cp-rung '+(active?'cp-current':done?'cp-cleared':'')+'" '+(boss?'data-boss="'+section.rival+'"':'')+(active?' aria-current="step"':'')+'><span class="cp-node">'+pad(rung+1)+'</span><strong>'+label+'</strong><small>'+status+'</small></li>';
   }).join('');
   const caption=locked?icon('lock')+' '+L('Defeat','Vence a')+' '+name(sections[i-1].rival):last?L('Final boss','Rival final'):L('Featured rival','Rival destacado');
   return '<section class="cp-ladder'+(locked?' cp-locked':'')+'" data-section="'+i+'"><article class="cp-rival" style="--rival:'+roster[section.rival].shirt+'"><div class="cp-rival-art">'+full(section.rival)+'</div><div class="cp-rival-copy"><span class="cp-kicker">'+caption+'</span><h2>'+name(section.rival)+'</h2></div></article><div class="cp-road"><div class="cp-road-heading"><span class="cp-kicker">'+(last?L('Final boss','Rival final'):L('Section','Tramo'))+' '+(i+1)+' / '+sections.length+'</span><strong>'+escape(section.theme[language==='es'?1:0])+'</strong></div><ol>'+rows+'</ol></div></section>';
  }).reverse().join('');
 }
 function team(m){
  const options=[-1,...m.owned.filter(id=>id!==m.player)].map(id=>{
   const selected=id===(m.partner??-1);
   return button('partner:'+id,'<span class="cp-thumb">'+head(id)+'</span><strong>'+name(id)+'</strong><span class="partner-check">'+(selected?icon('ok'):'')+'</span>',false,'aria-pressed="'+selected+'"');
  }).join('');
  return '<section class="partner-selector"><div class="partner-player"><span class="cp-thumb">'+head(m.player)+'</span><div><small>'+L('You control','Tú controlas')+'</small><h2>'+name(m.player)+'</h2></div></div><h3>'+L('Available partners','Compañeros disponibles')+'</h3><div class="partner-options">'+options+'</div></section>';
 }
 function result(m){
  const r=m.result;
  const reward=r.won?'<img src="/kit-bag-'+r.bagTier+'.webp" alt=""><strong>'+bagNames()[r.bagTier]+'</strong>'+
   (r.unlocked!=null?'<span>'+L('Player unlocked','Jugador desbloqueado')+' · '+name(r.unlocked)+'</span>':''):'<p>'+L('Rematch available','Revancha disponible')+'</p>';
  return '<section class="match-receipt"><h2>'+ (r.won?L('You won','Has ganado'):L('You lost','Has perdido'))+'</h2><b aria-label="'+L('Final score','Resultado final')+'">'+escape(r.score)+'</b>'+reward+'</section>';
 }
 function unlock(m){
  const id=m.result.unlocked;
  return '<article class="cp-unlock" style="--rival:'+roster[id].shirt+'"><div class="cp-unlock-art">'+full(id)+'</div><div class="cp-unlock-copy"><span class="cp-kicker">'+icon('rival')+L('New teammate','Nuevo fichaje')+'</span><h2>'+name(id)+'</h2><p>'+L('joins your team.','se une a tu equipo.')+'</p></div></article>';
 }
 function complete(m){return '<section class="cp-complete"><div><span class="cp-kicker">'+icon('rival')+L('Campaign complete','Campaña completada')+'</span><h2>'+L('All rivals defeated.','Todos los rivales vencidos.')+'</h2><strong>'+m.total+' / '+m.total+' · '+(m.controlMode==='competitive'?L('Competitive','Competitivo'):'Casual')+'</strong></div><div class="cp-hall">'+m.owned.map(id=>'<span title="'+name(id)+'">'+head(id)+'</span>').join('')+'</div></section>';}
 function render(view,m){
  let title,body,actions;
  const balance=coin(m.coins),mode=m.controlMode==='competitive'?L('Competitive','Competitivo'):'Casual';
  switch(view){
   case 'ladder':
    title=L('Campaign','Campaña');body=ladder(m);
    actions=m.browsing?back()+button('current',L('Current match','Partido actual'),true):back()+(!m.attempt?button('team',icon('team')+L('Partner','Compañero')):'')+feeButton(m);break;
   case 'team':
    title=L('Choose your partner','Elige tu compañero');body=team(m);actions=button('ladder',icon('back')+L('Back to ladder','Volver a campaña'),true);break;
   case 'result':{
    const r=m.result,showUnlock=r.unlocked!=null&&r.stage!=='bag';title=L('Match result','Resultado');body=result(m);
    actions=r.won?button(showUnlock?'unlock':'bag',showUnlock?L('Meet your teammate','Conoce tu fichaje'):L('Open ','Abrir ')+bagNames()[r.bagTier].toLocaleLowerCase(),true):
     button('ladder',L('Leave','Salir'))+feeButton({...m,retry:true,attempt:false});break;
   }
   case 'unlock':{
    const who=name(m.result.unlocked);
    title=L('Player unlocked','Jugador desbloqueado');body=unlock(m);
    actions=button('keep',L('Keep lineup','Mantener pareja'))+button('as-partner',L('Use as partner','Elegir de compañero'))+button('as-player',L('Play as','Jugar con')+' '+who,true);break;
   }
   case 'complete':
    title=L('Hall of champions','Galería de campeones');body=complete(m);
    actions=button('collection',L('Collection','Colección'))+button('quick',L('Quick play','Partida rápida')+icon('go'),true);break;
   case 'recovery':
    title=L('Fund your entry','Consigue tu entrada');body='<section class="cp-recovery">'+icon('up')+'<h2>'+L('Free coin drill','Reto de monedas gratis')+'</h2><p>'+L('Hit the targets. Earn coins. Return to this match.','Acierta los objetivos, gana monedas y vuelve al partido.')+'</p><div class="cp-price">'+L('Next entry','Próxima entrada')+' '+coin(m.fee)+'</div></section>';actions=back()+button('recover',L('Play drill','Jugar reto'),true);break;
   default:throw Error('Unknown campaign view '+view);
  }
  const short=m.coins<m.fee&&!m.attempt&&view==='ladder';
  return '<div class="campaign-shell cp-view-'+view+'"><header class="cp-header"><div><span class="cp-kicker">'+mode+' / '+(view==='ladder'?L('Match','Partido')+' '+Math.min(m.rung+1,m.total)+' / '+m.total:L('Arcade ladder','Circuito arcade'))+'</span><h1>'+title+'</h1></div><button data-meta="refill" class="cp-balance" aria-label="'+L('Coin balance','Saldo de monedas')+'">'+balance+'</button></header><div class="cp-stage">'+body+'</div>'+(short?'<p class="cp-short">'+L('Entry fee','Entrada')+' '+coin(m.fee)+' · '+L('Free coin drill available','Reto de monedas gratis')+'</p>':'')+'<footer class="cp-actions">'+actions+'</footer></div>';
 }
 return {render};
})();
