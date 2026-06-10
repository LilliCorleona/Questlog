import { useState, useEffect, useCallback } from "react";

// ════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════
const XP_LVL = [0,100,250,450,700,1000,1400,1900,2500,3200,4000,5000,6200,7600,9200,11000,13200,15700,18500,22000];
const TITLES = ["Novize","Lehrling","Wanderer","Kämpfer","Veteran","Champion","Held","Legende","Halbgott","Der Ewige"];
const SKILL_LVL = [0,50,150,300,500,800,1200,1800,2600,3600];
const SKILL_RANK = ["Anfänger","Lehrling","Fortg.","Erfahren","Kenner","Experte","Meister","Großmeister","Legende","Unsterblich"];
const XP_MAP = {trivial:10,easy:25,medium:60,hard:150,boss:400};
const HP_DMG = {trivial:2,easy:5,medium:12,hard:25,boss:50};
const SPOON_COST = {trivial:1,easy:2,medium:3,hard:5,boss:8};
const STAT_CAT = {sport:"STR",arbeit:"CON",finanzen:"DEX",lernen:"INT",haushalt:"WIS",soziales:"CHA",selbstfuersorge:"CARE",hobby:null};
const CAT_META = {
  sport:          {label:"🔥 Sport",           color:"#e05c20"},
  arbeit:         {label:"🌱 Arbeit",          color:"#c87840"},
  lernen:         {label:"🌬 Lernen",          color:"#c0eedd"},
  haushalt:       {label:"🌿 Haushalt",        color:"#a0cc80"},
  soziales:       {label:"✨ Soziales",        color:"#a070d0"},
  finanzen:       {label:"💧 Finanzen",        color:"#2a7ab8"},
  selbstfuersorge:{label:"🌸 Selbstfürsorge", color:"#d070a0"},
  hobby:          {label:"🎨 Hobby",           color:"#70c8a0"},
};
const CONDITIONS = [
  {id:"exhausted", label:"Erschöpft / Gestresst", icon:"😴", effect:"Schwere Quests markiert, Selbstfürsorge leuchtet auf"},
  {id:"focused",   label:"Fokussiert",            icon:"🎯", effect:"Arbeits-XP +20%",      xpBonus:{cat:"arbeit",mult:1.2}},
  {id:"motivated", label:"Motiviert",             icon:"✨", effect:"Alle XP +20%",          xpBonus:{cat:"all",mult:1.2}},
  {id:"recovered", label:"Erholt",                icon:"🌸", effect:"HP-Regen +5 pro Quest", hpBonus:5},
  {id:"creative",  label:"Kreativ",               icon:"🎨", effect:"Hobby & Lernen XP +50%",xpBonus:{cat:"hobby_lernen",mult:1.5}},
  {id:"energized", label:"Energiegeladen",        icon:"💪", effect:"Sport-XP +20%",         xpBonus:{cat:"sport",mult:1.2}},
  {id:"social",    label:"Sozial aufgeladen",     icon:"💬", effect:"Soziales-XP +20%",      xpBonus:{cat:"soziales",mult:1.2}},
];
const LOOT_TABLE = [
  {n:"Waldbeere",r:"common",e:"🫐"},{n:"Rostiges Schwert",r:"common",e:"⚔️"},{n:"Heiltrank",r:"common",e:"🧪"},
  {n:"Moosstein",r:"uncommon",e:"🪨"},{n:"Silberblatt",r:"uncommon",e:"🍃"},{n:"Moosfaden",r:"uncommon",e:"🧵"},
  {n:"Wasserstein",r:"rare",e:"💧"},{n:"Elfenstiefel",r:"rare",e:"👢"},{n:"Rindenrüstung",r:"rare",e:"🌳"},
  {n:"Drachenschuppe",r:"epic",e:"🐲"},{n:"Mondkristall",r:"epic",e:"🔮"},{n:"Sturmfeder",r:"epic",e:"🪶"},
  {n:"Ewiges Artefakt",r:"legendary",e:"🌟"},{n:"Weltenwurzel",r:"legendary",e:"🌱"},
];
const LOOT_W = [40,28,16,11,5];
const LOOT_R = ["common","uncommon","rare","epic","legendary"];
const RARITY_COLOR = {common:"#6a8a74",uncommon:"#a0cc80",rare:"#60b8e8",epic:"#c8a0f0",legendary:"#b0e89a"};
const RARITY_LABEL = {common:"Gewöhnlich",uncommon:"Ungewöhnlich",rare:"Selten",epic:"Episch",legendary:"LEGENDÄR!"};

const MILESTONES = [
  {id:"first_quest",   label:"Erste Quest",         icon:"⚔️",  check:s=>s.quests.filter(q=>q.done).length>=1},
  {id:"streak_3",      label:"3 Tage Streak",        icon:"🔥",  check:s=>s.streak>=3},
  {id:"streak_7",      label:"7 Tage Streak",        icon:"🌟",  check:s=>s.streak>=7},
  {id:"first_boss",    label:"Boss besiegt",         icon:"💀",  check:s=>s.quests.some(q=>q.done&&q.diff==="boss")},
  {id:"care_10",       label:"10× Selbstfürsorge",   icon:"🌸",  check:s=>s.quests.filter(q=>q.done&&q.cat==="selbstfuersorge").length>=10},
  {id:"first_rest",    label:"Erste Lange Rast",     icon:"🌙",  check:s=>s.longRests>=1},
  {id:"level_5",       label:"Stufe 5 erreicht",     icon:"🏆",  check:s=>s.level>=5},
  {id:"level_10",      label:"Stufe 10 erreicht",    icon:"👑",  check:s=>s.level>=10},
  {id:"skill_expert",  label:"Fertigkeit: Experte",  icon:"🎓",  check:s=>s.skills.some(sk=>getSkillLv(sk.xp)>=5)},
  {id:"loot_legendary",label:"Legendärer Loot",      icon:"💎",  check:s=>s.loot.some(l=>l.r==="legendary")},
];

const DEFAULT_STATE = {
  charName:"Held des Alltags",level:1,xp:0,hp:100,maxHp:100,
  streak:0,lastDate:null,longRests:0,shortRestsToday:0,lastShortRest:null,
  spoons:10,maxSpoons:10,
  conditions:[],
  stats:{STR:8,CON:8,DEX:8,INT:8,WIS:8,CHA:8,CARE:8},
  skills:[
    {id:"s1",name:"Kochen",emoji:"🍳",xp:0},
    {id:"s2",name:"Zeichnen",emoji:"✏️",xp:0},
    {id:"s3",name:"Nähen",emoji:"🧵",xp:0},
    {id:"s4",name:"Stricken",emoji:"🧶",xp:0},
    {id:"s5",name:"Häkeln",emoji:"🪡",xp:0},
  ],
  loot:[],quests:[],rituals:[],
  milestones:[],
  dailySuggestion:null,
};

// ════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════
function getSkillLv(xp){ for(let i=SKILL_LVL.length-1;i>=0;i--){if(xp>=SKILL_LVL[i])return i;} return 0; }
function getProfBonus(lv){ return lv>=5?2:lv>=3?1:0; }
function getTitle(lvl){ return TITLES[Math.min(Math.floor((lvl-1)/2),TITLES.length-1)]; }
function getLvlPct(xp,lvl){
  const need=XP_LVL[Math.min(lvl,XP_LVL.length-1)];
  const prev=XP_LVL[Math.min(lvl-1,XP_LVL.length-1)]||0;
  return Math.min(100,Math.round(((xp-prev)/(need-prev))*100));
}
function rollLootItem(){
  let acc=0; const r=Math.random()*100; let rarity="common";
  for(let i=0;i<LOOT_W.length;i++){acc+=LOOT_W[i];if(r<acc){rarity=LOOT_R[i];break;}}
  const pool=LOOT_TABLE.filter(l=>l.r===rarity);
  return pool[Math.floor(Math.random()*pool.length)];
}
function deadlineInfo(deadline){
  if(!deadline) return null;
  const now=new Date(); now.setHours(0,0,0,0);
  const dl=new Date(deadline);
  const days=Math.round((dl-now)/86400000);
  if(days<0) return {text:`☠ Überfällig (${Math.abs(days)}T)`,urgent:true,days};
  if(days===0) return {text:"⚠ Heute fällig!",urgent:true,days};
  if(days===1) return {text:"⏳ Morgen",urgent:false,days};
  return {text:`📅 ${days}T`,urgent:false,days};
}
function calcXPGain(base,quest,state){
  let xp=base; const bonuses=[];
  // Deadline bonus
  if(quest.deadline){const now=new Date();now.setHours(0,0,0,0);if(new Date(quest.deadline)>=now){xp=Math.round(xp*1.25);bonuses.push("⚡ Früh!");}}
  // Streak
  if(state.streak>=3){xp=Math.round(xp*1.5);bonuses.push("🔥 Streak!");}
  // Conditions
  const hasMotivated=state.conditions.includes("motivated");
  const hasFocused=state.conditions.includes("focused");
  const hasCreative=state.conditions.includes("creative");
  const hasEnergized=state.conditions.includes("energized");
  const hasSocial=state.conditions.includes("social");
  if(hasMotivated){xp=Math.round(xp*1.2);bonuses.push("✨ Motiviert!");}
  if(hasFocused&&quest.cat==="arbeit"){xp=Math.round(xp*1.2);bonuses.push("🎯 Fokus!");}
  if(hasCreative&&(quest.cat==="hobby"||quest.cat==="lernen")){xp=Math.round(xp*1.5);bonuses.push("🎨 Kreativ!");}
  if(hasEnergized&&quest.cat==="sport"){xp=Math.round(xp*1.2);bonuses.push("💪 Energie!");}
  if(hasSocial&&quest.cat==="soziales"){xp=Math.round(xp*1.2);bonuses.push("💬 Sozial!");}
  // Proficiency for skill
  if(quest.skillId){
    const skill=state.skills.find(s=>s.id===quest.skillId);
    if(skill){const pb=getProfBonus(getSkillLv(skill.xp));xp+=pb*5;if(pb>0)bonuses.push(`📚 Prof +${pb*5}`);}
  }
  // D20
  const roll=Math.floor(Math.random()*20)+1;
  let crit=false,fumble=false;
  if(roll===20){xp*=2;bonuses.push("🎲 NAT 20!");crit=true;}
  else if(roll===1){xp=Math.round(xp*.5);bonuses.push("💀 Patzer!");fumble=true;}
  return{xp:Math.round(xp),bonuses,crit,fumble,roll};
}
function checkMilestones(state){
  const newly=[];
  MILESTONES.forEach(m=>{
    if(!state.milestones.includes(m.id)&&m.check(state)){newly.push(m.id);}
  });
  return newly;
}
function todayKey(){ return new Date().toDateString(); }
function shouldResetRitual(ritual){
  const today=new Date(); today.setHours(0,0,0,0);
  if(!ritual.lastCompleted) return true;
  const last=new Date(ritual.lastCompleted); last.setHours(0,0,0,0);
  if(ritual.freq==="daily") return last<today;
  if(ritual.freq==="weekly"){
    const dayOfWeek=today.getDay();
    const monday=new Date(today); monday.setDate(today.getDate()-((dayOfWeek+6)%7));
    return last<monday;
  }
  if(ritual.freq==="monthly"){
    return last.getMonth()!==today.getMonth()||last.getFullYear()!==today.getFullYear();
  }
  return false;
}

// ════════════════════════════════════════════
//  SUB-COMPONENTS
// ════════════════════════════════════════════

function Divider({label}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,margin:"10px 0 7px"}}>
      <div style={{flex:1,height:1,background:"linear-gradient(to right,transparent,#2d5a35,transparent)"}}/>
      {label&&<span style={{fontFamily:"'Cinzel',serif",fontSize:".55rem",letterSpacing:3,color:"#3a6a48",textTransform:"uppercase",whiteSpace:"nowrap"}}>{label}</span>}
      {!label&&<span style={{color:"#3a6a48",fontSize:".7rem"}}>◆</span>}
      <div style={{flex:1,height:1,background:"linear-gradient(to right,transparent,#2d5a35,transparent)"}}/>
    </div>
  );
}

function Bar({pct,colorA,colorB,height=8}){
  return(
    <div style={{height,background:"rgba(0,0,0,0.45)",borderRadius:2,overflow:"hidden",border:"1px solid #1a3d20",position:"relative"}}>
      <div style={{width:`${Math.max(0,Math.min(100,pct))}%`,height:"100%",background:`linear-gradient(to right,${colorA},${colorB})`,borderRadius:2,transition:"width 0.8s cubic-bezier(.4,0,.2,1)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:"-100%",width:"50%",height:"100%",background:"linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)",animation:"shim 3s infinite"}}/>
      </div>
    </div>
  );
}

function StatBox({label,icon,val,color,tooltip}){
  const mod=Math.floor((val-10)/2);
  return(
    <div title={tooltip} style={{padding:"5px 3px",textAlign:"center",border:`1px solid ${color}44`,borderRadius:3,background:`${color}0d`,cursor:"default",transition:"transform .2s,box-shadow .2s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 4px 10px ${color}22`;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
      <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:"1.1rem",color,lineHeight:1}}>{val}</div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:".52rem",opacity:.65,color}}>{mod>=0?"+":""}{mod}</div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:".48rem",letterSpacing:1,color:"#6a8a74",marginTop:1}}>{icon} {label}</div>
    </div>
  );
}

function SkillRow({skill}){
  const lv=getSkillLv(skill.xp);
  const pb=getProfBonus(lv);
  const need=SKILL_LVL[Math.min(lv,SKILL_LVL.length-1)];
  const prev=SKILL_LVL[Math.min(lv-1,SKILL_LVL.length-1)]||0;
  const pct=Math.min(100,need>prev?Math.round(((skill.xp-prev)/(need-prev))*100):100);
  return(
    <div style={{display:"grid",gridTemplateColumns:"auto 1fr auto",gap:5,alignItems:"center",padding:"3px 6px",border:"1px solid #1a3d20",borderRadius:3,background:"rgba(0,0,0,.18)"}}>
      <span style={{fontSize:".82rem"}}>{skill.emoji}</span>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:"#b8cfc0",fontFamily:"'Crimson Text',serif",fontSize:".82rem"}}>{skill.name}</span>
          {pb>0&&<span style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",color:"#a0cc80",background:"rgba(160,204,128,.1)",border:"1px solid #a0cc8044",borderRadius:2,padding:"1px 4px"}}>Prof+{pb}</span>}
        </div>
        <div style={{height:2,background:"rgba(0,0,0,.3)",borderRadius:1,overflow:"hidden",marginTop:2}}>
          <div style={{height:"100%",width:`${pct}%`,background:"#70c8a0",transition:"width .8s"}}/>
        </div>
      </div>
      <span style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",color:"#70c8a0",letterSpacing:1,whiteSpace:"nowrap"}}>{SKILL_RANK[Math.min(lv,SKILL_RANK.length-1)]}</span>
    </div>
  );
}

function W6Picker({onPick,onClose,title}){
  return(
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300}}>
      <div style={{background:"#0d2010",border:"1px solid #2d7a40",borderRadius:6,padding:"20px 24px",textAlign:"center",minWidth:200,boxShadow:"0 0 40px rgba(80,160,80,.15)"}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:".75rem",letterSpacing:2,color:"#8ab87a",marginBottom:12}}>{title}</div>
        <div style={{display:"flex",gap:8,justifyContent:"center"}}>
          {[1,2,3,4,5,6].map(n=>(
            <button key={n} onClick={()=>onPick(n)} style={{width:36,height:36,fontFamily:"'Cinzel Decorative',serif",fontSize:"1rem",background:"rgba(0,0,0,.3)",border:"1px solid #2d7a40",borderRadius:4,color:"#b0e89a",cursor:"pointer",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(80,160,60,.2)";e.currentTarget.style.transform="scale(1.1)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(0,0,0,.3)";e.currentTarget.style.transform="";}}>
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Toast({msg,type,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,3200);return()=>clearTimeout(t);},[]);
  const c={loot:{b:"#8ab87a",t:"#b0e89a"},warning:{b:"#e05c20",t:"#f09080"},crit:{b:"#a0cc80",t:"#c0eedd"},milestone:{b:"#c8a0f0",t:"#e0c8ff"}}[type]||{b:"#8ab87a",t:"#b0e89a"};
  return(
    <div style={{position:"fixed",bottom:22,right:22,padding:"9px 16px",borderRadius:4,fontFamily:"'Cinzel',serif",fontSize:".68rem",letterSpacing:1,border:`1px solid ${c.b}`,color:c.t,background:"#080f09",zIndex:500,maxWidth:280,lineHeight:1.5,animation:"slideIn .4s ease"}}>
      {msg}
    </div>
  );
}

function LevelUpModal({level,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400}}>
      <div style={{background:"#0d2010",border:"1px solid #2d7a40",borderRadius:6,padding:"32px 28px",maxWidth:340,width:"90%",textAlign:"center",boxShadow:"0 0 60px rgba(80,160,80,.2)",animation:"popIn .4s ease"}}>
        <div style={{fontSize:"2.2rem",marginBottom:8}}>🌿</div>
        <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:"1.6rem",color:"#b0e89a",textShadow:"0 0 20px rgba(180,240,120,.3)",marginBottom:4}}>Aufgestiegen!</div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:".85rem",color:"#8ab87a",marginBottom:10}}>STUFE {level} · {getTitle(level)}</div>
        <div style={{fontSize:".9rem",color:"#7aaa8a",marginBottom:16,lineHeight:1.6,fontStyle:"italic"}}>Die Elemente neigen sich vor dir.<br/>Deine Taten formen dein Schicksal.</div>
        <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:16,flexWrap:"wrap"}}>
          {["❤ HP +10","✦ Neue Kraft"].map(p=>(
            <span key={p} style={{fontFamily:"'Cinzel',serif",fontSize:".7rem",padding:"4px 10px",border:"1px solid #2d7a40",borderRadius:3,color:"#8ab87a"}}>{p}</span>
          ))}
        </div>
        <button onClick={onClose} style={{fontFamily:"'Cinzel',serif",fontSize:".72rem",letterSpacing:1,padding:"8px 20px",border:"1px solid #2d7a40",borderRadius:3,background:"rgba(80,160,60,.2)",color:"#b0e89a",cursor:"pointer"}}>Weiter, Held!</button>
      </div>
    </div>
  );
}

// ── Quest Card ──
function QuestCard({quest,skills,conditions,onToggle,isCare}){
  const [showW6,setShowW6]=useState(false);
  const meta=CAT_META[quest.cat]||{label:quest.cat,color:"#70c8a0"};
  const dl=quest.deadline&&!quest.done?deadlineInfo(quest.deadline):null;
  const diffEmoji={trivial:"🟢",easy:"🟡",medium:"🟠",hard:"🔴",boss:"💀"}[quest.diff];
  const isExhausted=conditions.includes("exhausted");
  const warnHeavy=isExhausted&&(quest.diff==="hard"||quest.diff==="boss");
  const glowCare=conditions.includes("exhausted")&&quest.cat==="selbstfuersorge";
  const skill=quest.skillId?skills.find(s=>s.id===quest.skillId):null;
  const spoonCost=SPOON_COST[quest.diff];
  return(
    <>
    {showW6&&isCare&&<W6Picker title="Spoons zurückgeben (W6)" onClose={()=>setShowW6(false)} onPick={(n)=>{setShowW6(false);onToggle(quest.id,{spoonsBack:n,hpBack:null});}}/>}
    <div style={{
      display:"grid",gridTemplateColumns:"auto 1fr auto",gap:8,alignItems:"start",
      padding:"8px 10px",
      border:`1px solid ${glowCare?"#d070a088":warnHeavy?"rgba(224,92,32,.5)":dl?.urgent?"rgba(224,92,32,.4)":"#1a3d20"}`,
      borderLeft:`3px solid ${meta.color}`,
      borderRadius:3,
      background:glowCare?"rgba(208,112,160,.07)":warnHeavy?"rgba(224,92,32,.04)":"rgba(0,0,0,.18)",
      transition:"all .2s",opacity:quest.done?.4:1,
      boxShadow:glowCare?"0 0 8px rgba(208,112,160,.2)":"none",
    }}>
      <div onClick={()=>isCare&&!quest.done?setShowW6(true):onToggle(quest.id,{})}
        style={{width:18,height:18,border:`1px solid ${quest.done?"#8ab87a":"#2d5a35"}`,borderRadius:2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:quest.done?"rgba(80,160,60,.2)":"transparent",color:"#b0e89a",fontSize:".7rem",marginTop:1,userSelect:"none"}}>
        {quest.done?"✓":""}
      </div>
      <div style={{minWidth:0}}>
        <div style={{fontFamily:"'Crimson Text',serif",fontSize:".92rem",fontWeight:600,color:quest.done?"#5a7a64":"#b8cfc0",textDecoration:quest.done?"line-through":"none",lineHeight:1.2}}>
          {warnHeavy&&"⚠ "}{quest.name}
        </div>
        <div style={{display:"flex",gap:4,alignItems:"center",marginTop:2,flexWrap:"wrap"}}>
          <span style={{fontFamily:"'Cinzel',serif",fontSize:".52rem",letterSpacing:1,padding:"1px 5px",border:`1px solid ${meta.color}55`,borderRadius:2,color:meta.color}}>{meta.label}</span>
          {skill&&<span style={{fontFamily:"'Cinzel',serif",fontSize:".52rem",padding:"1px 5px",border:"1px solid #70c8a044",borderRadius:2,color:"#70c8a0"}}>{skill.emoji} {skill.name}</span>}
          {dl&&<span style={{fontSize:".72rem",color:dl.urgent?"#e05c20":"#6a8a74",fontStyle:"italic"}}>{dl.text}</span>}
          {quest.chainId&&<span style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",padding:"1px 5px",border:"1px solid #8ab87a44",borderRadius:2,color:"#8ab87a"}}>🔗 Kette</span>}
        </div>
        {quest.notes&&<div style={{fontSize:".76rem",color:"#5a7a64",fontStyle:"italic",marginTop:2}}>{quest.notes}</div>}
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,flexShrink:0}}>
        <span style={{fontSize:".82rem"}}>{diffEmoji}</span>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:".56rem",color:"#a0cc80",whiteSpace:"nowrap"}}>+{XP_MAP[quest.diff]}</span>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",color:"#6a8a74",whiteSpace:"nowrap"}}>🥄{spoonCost}</span>
      </div>
    </div>
    </>
  );
}

// ── Ritual Card ──
function RitualCard({ritual,onToggle,onDelete}){
  const meta=CAT_META[ritual.cat]||{label:ritual.cat,color:"#70c8a0"};
  const needsReset=shouldResetRitual(ritual);
  const isDone=ritual.completedToday&&!needsReset;
  const freqLabel={daily:"täglich",weekly:"wöchentlich",monthly:"monatlich"}[ritual.freq];
  return(
    <div style={{display:"grid",gridTemplateColumns:"auto 1fr auto auto",gap:7,alignItems:"center",padding:"7px 10px",border:`1px solid ${ritual.required?"#2d5a3588":"#1a3d2088"}`,borderLeft:`3px solid ${meta.color}`,borderRadius:3,background:"rgba(0,0,0,.15)",opacity:isDone?.5:1,transition:"all .2s"}}>
      <div onClick={()=>!isDone&&onToggle(ritual.id)}
        style={{width:17,height:17,border:`1px solid ${isDone?"#8ab87a":"#2d5a35"}`,borderRadius:2,cursor:isDone?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:isDone?"rgba(80,160,60,.2)":"transparent",color:"#b0e89a",fontSize:".65rem",userSelect:"none"}}>
        {isDone?"✓":""}
      </div>
      <div>
        <div style={{fontFamily:"'Crimson Text',serif",fontSize:".88rem",fontWeight:600,color:isDone?"#5a7a64":"#b8cfc0",textDecoration:isDone?"line-through":"none"}}>
          {ritual.required&&"🔴 "}{ritual.name}
        </div>
        <div style={{display:"flex",gap:4,marginTop:2,flexWrap:"wrap"}}>
          <span style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",padding:"1px 5px",border:`1px solid ${meta.color}44`,borderRadius:2,color:meta.color}}>{meta.label}</span>
          <span style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",color:"#6a8a74",padding:"1px 4px"}}>{freqLabel}</span>
          {ritual.required&&<span style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",color:"#e05c2099",padding:"1px 4px"}}>Pflicht</span>}
        </div>
      </div>
      <span style={{fontFamily:"'Cinzel',serif",fontSize:".55rem",color:"#a0cc80"}}>+{XP_MAP[ritual.diff||"easy"]}</span>
      <button onClick={()=>onDelete(ritual.id)} style={{fontFamily:"'Cinzel',serif",fontSize:".6rem",padding:"2px 6px",border:"none",background:"transparent",color:"#3a5a40",cursor:"pointer"}} title="Ritual entfernen">✕</button>
    </div>
  );
}

// ════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════
export default function TagesLog(){
  const [S,setS]=useState(null);
  const [tab,setTab]=useState("rituale");
  const [showRitual,setShowRitual]=useState(false);
  const [showAddQuest,setShowAddQuest]=useState(false);
  const [showDayStart,setShowDayStart]=useState(false);
  const [showW6,setShowW6]=useState(null); // "hp" | "spoons" | null for rest
  const [form,setForm]=useState({title:"",cat:"arbeit",diff:"medium",deadline:"",skillId:"",notes:"",chainId:""});
  const [ritualForm,setRitualForm]=useState({name:"",cat:"selbstfuersorge",diff:"easy",freq:"daily",required:false});
  const [newSkill,setNewSkill]=useState({name:"",emoji:"🎨"});
  const [toasts,setToasts]=useState([]);
  const [levelUpModal,setLevelUpModal]=useState(null);
  const [loading,setLoading]=useState(true);

  // Load
  useEffect(()=>{
    (async()=>{
      try{
        const res=await window.storage.get("character");
        const data=res?JSON.parse(res.value):{...DEFAULT_STATE};
        if(!data.stats.CARE) data.stats.CARE=8;
        if(!data.rituals) data.rituals=[];
        if(!data.milestones) data.milestones=[];
        if(!data.conditions) data.conditions=[];
        if(data.spoons===undefined) data.spoons=10;
        if(data.maxSpoons===undefined) data.maxSpoons=10;
        setS(data);
      }catch{setS({...DEFAULT_STATE});}
      setLoading(false);
    })();
  },[]);

  const persist=useCallback(async(state)=>{
    await window.storage.set("character",JSON.stringify(state));
  },[]);

  const toast=(msg,type="loot")=>{
    const id=Date.now()+Math.random();
    setToasts(t=>[...t.slice(-3),{id,msg,type}]);
  };

  const applyLevelUps=(state)=>{
    let{level,xp,maxHp,hp}=state;
    let leveled=false;
    while(level<XP_LVL.length&&xp>=XP_LVL[level]){
      level++;maxHp+=10;hp=maxHp;leveled=true;
    }
    if(leveled) setTimeout(()=>setLevelUpModal(level),600);
    return{...state,level,maxHp,hp};
  };

  const checkAndAwardMilestones=(state)=>{
    const newly=checkMilestones(state);
    if(newly.length>0){
      newly.forEach(mid=>{
        const m=MILESTONES.find(x=>x.id===mid);
        if(m) setTimeout(()=>toast(`${m.icon} Meilenstein: ${m.label}!`,"milestone"),800);
      });
      return{...state,milestones:[...state.milestones,...newly]};
    }
    return state;
  };

  const completeQuest=(id,extra={})=>{
    setS(prev=>{
      const q=prev.quests.find(q=>q.id===id);
      if(!q||q.done) return prev;
      const{xp:xpGain,bonuses,crit,fumble}=calcXPGain(XP_MAP[q.diff],q,prev);
      if(crit) setTimeout(()=>toast("⚔ KRITISCHER TREFFER! Nat 20!","crit"),200);
      if(fumble) setTimeout(()=>toast("💀 Patzer… Nat 1.","warning"),200);
      if(bonuses.filter(b=>!b.includes("NAT")&&!b.includes("Patzer")).length>0)
        setTimeout(()=>toast("🏆 "+bonuses.filter(b=>!b.includes("NAT")&&!b.includes("Patzer")).join(" · "),"loot"),500);
      // Stats
      const statKey=STAT_CAT[q.cat];
      const newStats={...prev.stats};
      if(statKey&&newStats[statKey]!==undefined) newStats[statKey]=Math.min(20,newStats[statKey]+1);
      // Skills
      let newSkills=prev.skills;
      if(q.skillId){
        newSkills=prev.skills.map(sk=>{
          if(sk.id!==q.skillId) return sk;
          const ol=getSkillLv(sk.xp); const nx={...sk,xp:sk.xp+XP_MAP[q.diff]};
          const nl=getSkillLv(nx.xp); if(nl>ol) setTimeout(()=>toast(`${sk.emoji} ${sk.name} → ${SKILL_RANK[nl]}!`,"loot"),700);
          return nx;
        });
      }
      // HP & Spoons
      const condRecovered=prev.conditions.includes("recovered");
      const hpHeal=5+(condRecovered?5:0);
      const spoonsBack=q.cat==="selbstfuersorge"?(extra.spoonsBack||0):0;
      const spoonCost=SPOON_COST[q.diff];
      const newHp=Math.min(prev.maxHp,prev.hp+hpHeal);
      const newSpoons=Math.min(prev.maxSpoons,Math.max(0,prev.spoons-spoonCost+spoonsBack));
      // Streak
      const today=todayKey();
      const newStreak=prev.lastDate!==today?prev.streak+1:prev.streak;
      const newLastDate=today;
      // Chain bonus
      let chainBonus=0;
      if(q.chainId){
        const chainDone=prev.quests.filter(cq=>cq.chainId===q.chainId&&cq.done).length;
        if(chainDone>0){chainBonus=25;setTimeout(()=>toast("🔗 Quest-Kette! +25 XP Bonus","loot"),900);}
      }
      let next={...prev,stats:newStats,skills:newSkills,hp:newHp,spoons:newSpoons,streak:newStreak,lastDate:newLastDate,
        xp:prev.xp+xpGain+chainBonus,
        quests:prev.quests.map(qq=>qq.id===id?{...qq,done:true,completedAt:new Date().toISOString()}:qq),
      };
      next=applyLevelUps(next);
      next=checkAndAwardMilestones(next);
      persist(next);
      return next;
    });
  };

  const completeRitual=(id)=>{
    setS(prev=>{
      const r=prev.rituals.find(r=>r.id===id);
      if(!r) return prev;
      const{xp:xpGain}=calcXPGain(XP_MAP[r.diff||"easy"],{...r,deadline:null,skillId:null,chainId:null},prev);
      const statKey=STAT_CAT[r.cat];
      const newStats={...prev.stats};
      if(statKey&&newStats[statKey]!==undefined) newStats[statKey]=Math.min(20,newStats[statKey]+1);
      const spoonCost=SPOON_COST[r.diff||"easy"];
      let next={...prev,stats:newStats,
        xp:prev.xp+xpGain,
        spoons:Math.max(0,prev.spoons-spoonCost),
        hp:Math.min(prev.maxHp,prev.hp+3),
        rituals:prev.rituals.map(rr=>rr.id===id?{...rr,completedToday:true,lastCompleted:new Date().toISOString(),streak:(rr.streak||0)+1}:rr),
      };
      next=applyLevelUps(next);
      next=checkAndAwardMilestones(next);
      persist(next);
      toast(`🔁 ${r.name} erledigt! +${xpGain} XP`,"loot");
      return next;
    });
  };

  const doShortRest=()=>{
    setS(prev=>{
      if(prev.shortRestsToday>=2){toast("Kurze Rast bereits 2× genutzt heute.","warning");return prev;}
      const heal=Math.floor(Math.random()*6)+1+prev.level;
      const spoonsBack=Math.floor(Math.random()*4)+2;
      const next={...prev,hp:Math.min(prev.maxHp,prev.hp+heal),spoons:Math.min(prev.maxSpoons,prev.spoons+spoonsBack),shortRestsToday:prev.shortRestsToday+1,lastShortRest:new Date().toISOString()};
      persist(next);
      toast(`🌿 Kurze Rast — HP +${heal}, Spoons +${spoonsBack}`,"crit");
      return next;
    });
  };

  const doLongRest=()=>{
    setS(prev=>{
      const xpBonus=50;
      let next={...prev,hp:prev.maxHp,spoons:prev.maxSpoons,shortRestsToday:0,conditions:[],
        xp:prev.xp+xpBonus,longRests:(prev.longRests||0)+1,
        rituals:prev.rituals.map(r=>({...r,completedToday:false})),
      };
      next=applyLevelUps(next);
      next=checkAndAwardMilestones(next);
      persist(next);
      toast("🌙 Lange Rast — volle HP & Spoons! +50 XP","crit");
      return next;
    });
  };

  const addQuest=()=>{
    if(!form.title.trim()) return;
    const q={id:Date.now().toString(),name:form.title.trim(),cat:form.cat,diff:form.diff,deadline:form.deadline||null,skillId:form.skillId||null,notes:form.notes||null,chainId:form.chainId||null,done:false,penaltyApplied3:false,penaltyApplied7:false,created:new Date().toISOString()};
    setS(prev=>{const ns={...prev,quests:[q,...prev.quests]};persist(ns);return ns;});
    setForm(f=>({...f,title:"",deadline:"",notes:"",chainId:""}));
    setShowAddQuest(false);
  };

  const addRitual=()=>{
    if(!ritualForm.name.trim()) return;
    const r={id:"r"+Date.now(),name:ritualForm.name.trim(),cat:ritualForm.cat,diff:ritualForm.diff,freq:ritualForm.freq,required:ritualForm.required,completedToday:false,streak:0,lastCompleted:null};
    setS(prev=>{const ns={...prev,rituals:[r,...prev.rituals]};persist(ns);return ns;});
    setRitualForm({name:"",cat:"selbstfuersorge",diff:"easy",freq:"daily",required:false});
    setShowRitual(false);
  };

  const addSkill=()=>{
    if(!newSkill.name.trim()) return;
    const sk={id:"s"+Date.now(),name:newSkill.name.trim(),emoji:newSkill.emoji||"🎯",xp:0};
    setS(prev=>{const ns={...prev,skills:[...prev.skills,sk]};persist(ns);return ns;});
    setNewSkill({name:"",emoji:"🎨"});
  };

  const rollLoot=()=>{
    const item=rollLootItem();
    setS(prev=>{const ns={...prev,loot:[...prev.loot,{n:item.n,r:item.r,e:item.e}]};persist(ns);return ns;});
    toast(`${item.e} ${item.n} — ${RARITY_LABEL[item.r]}`,"loot");
  };

  const toggleCondition=(id)=>{
    setS(prev=>{
      const has=prev.conditions.includes(id);
      const ns={...prev,conditions:has?prev.conditions.filter(c=>c!==id):[...prev.conditions,id]};
      persist(ns);return ns;
    });
  };

  if(loading||!S) return <div style={{color:"#7aaa8a",fontFamily:"'Cinzel',serif",textAlign:"center",padding:40,background:"#060e08",minHeight:"100vh"}}>Lade Questlog…</div>;

  const activeQuests=S.quests.filter(q=>!q.done);
  const doneQuests=S.quests.filter(q=>q.done);
  const hpPct=(S.hp/S.maxHp)*100;
  const xpPct=getLvlPct(S.xp,S.level);
  const xpNeed=XP_LVL[Math.min(S.level,XP_LVL.length-1)];
  const spoonPct=(S.spoons/S.maxSpoons)*100;
  const lowSpoons=S.spoons<=4;

  const inputStyle={width:"100%",fontFamily:"'Crimson Text',serif",fontSize:".88rem",background:"rgba(0,0,0,.35)",border:"1px solid #1a3d20",borderRadius:3,padding:"5px 8px",color:"#cce8d4"};
  const labelStyle={fontFamily:"'Cinzel',serif",fontSize:".56rem",letterSpacing:1,color:"#3a6a48",textTransform:"uppercase",display:"block",marginBottom:2};

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:#060e08;}
    @keyframes shim{to{left:200%;}}
    @keyframes slideIn{from{transform:translateX(80px);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes popIn{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
    @keyframes pulse{0%,100%{opacity:.7}50%{opacity:1;}}
    input,select,textarea{outline:none;color-scheme:dark;}
    ::-webkit-scrollbar{width:3px;}
    ::-webkit-scrollbar-thumb{background:#1e4a28;border-radius:2px;}
    .btn{font-family:'Cinzel',serif;font-size:.64rem;letter-spacing:1px;border-radius:3px;cursor:pointer;transition:all .2s;border:1px solid;}
    .btn:hover{filter:brightness(1.2);}
    .parchment-card{
      background:linear-gradient(135deg,#0e2412 0%,#0a1c0e 40%,#0d2010 100%);
      border:1px solid #1e4a28;
      border-radius:5px;
      position:relative;
      overflow:hidden;
    }
    .parchment-card::before{
      content:'';position:absolute;inset:0;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
      pointer-events:none;
    }
    .leaf-deco{position:absolute;opacity:.04;font-size:4rem;pointer-events:none;user-select:none;}
  `;

  return(
    <div style={{minHeight:"100vh",background:"#060e08",backgroundImage:"radial-gradient(ellipse at 8% 25%,#0b2210 0%,transparent 45%),radial-gradient(ellipse at 92% 75%,#071508 0%,transparent 45%),radial-gradient(ellipse at 50% 100%,#050d06 0%,transparent 30%)",fontFamily:"'Crimson Text',Georgia,serif",color:"#cce8d4",padding:"14px 12px 60px"}}>
      <style>{css}</style>

      {/* Modals */}
      {levelUpModal&&<LevelUpModal level={levelUpModal} onClose={()=>setLevelUpModal(null)}/>}
      {showW6&&<W6Picker title={showW6==="hp"?"HP zurückgeben (W6)":"Spoons zurückgeben (W6)"} onClose={()=>setShowW6(null)} onPick={(n)=>{
        setS(prev=>{
          const ns=showW6==="hp"?{...prev,hp:Math.min(prev.maxHp,prev.hp+n)}:{...prev,spoons:Math.min(prev.maxSpoons,prev.spoons+n)};
          persist(ns);return ns;
        });
        toast(`${showW6==="hp"?"❤":"🥄"} +${n} ${showW6==="hp"?"HP":"Spoons"}`,"crit");
        setShowW6(null);
      }}/>}
      {toasts.map(t=><Toast key={t.id} msg={t.msg} type={t.type} onDone={()=>setToasts(ts=>ts.filter(x=>x.id!==t.id))}/>)}

      {/* HEADER */}
      <div style={{textAlign:"center",marginBottom:14,maxWidth:1000,margin:"0 auto 14px"}}>
        <div style={{opacity:.35,fontSize:"1rem",marginBottom:5,letterSpacing:8}}>🔥 💧 🌬 🌿</div>
        <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:"clamp(1rem,2.8vw,1.6rem)",color:"#d5ead8",letterSpacing:4,textShadow:"0 0 30px rgba(160,210,160,.18)"}}>Tages-Questlog</div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:".62rem",letterSpacing:5,color:"#4a7a58",marginTop:4}}>
          {new Date().toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}
        </div>
        <Divider/>
      </div>

      {/* MAIN GRID */}
      <div style={{display:"grid",gridTemplateColumns:"clamp(210px,26%,255px) 1fr",gap:12,maxWidth:1000,margin:"0 auto"}}>

        {/* ══ CHAR SHEET ══ */}
        <div className="parchment-card" style={{padding:"14px 12px",position:"sticky",top:14,height:"fit-content",maxHeight:"calc(100vh - 40px)",overflowY:"auto"}}>
          <div className="leaf-deco" style={{right:-10,top:-10}}>🌿</div>
          <div className="leaf-deco" style={{left:-10,bottom:-10,transform:"rotate(180deg)"}}>🌿</div>

          {/* Name */}
          <input value={S.charName} onChange={e=>{const ns={...S,charName:e.target.value};setS(ns);persist(ns);}}
            style={{fontFamily:"'Cinzel',serif",fontSize:".95rem",fontWeight:700,background:"transparent",border:"none",borderBottom:"1px solid #2d5a3566",color:"#d5ead8",width:"100%",textAlign:"center",padding:"2px 0"}}/>
          <div style={{fontStyle:"italic",fontSize:".75rem",color:"#6a8a74",textAlign:"center",marginTop:3}}>Stufe {S.level} · {getTitle(S.level)}</div>

          {/* Level */}
          <div style={{display:"flex",justifyContent:"center",margin:"10px 0 6px"}}>
            <div style={{width:44,height:44,background:"rgba(0,0,0,.3)",border:"1px solid #2d5a35",borderRadius:6,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",boxShadow:"0 0 12px rgba(80,180,80,.08)"}}>
              <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:"1.3rem",lineHeight:1,color:"#a8d898",textShadow:"0 0 8px rgba(160,220,120,.25)"}}>{S.level}</div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:".48rem",letterSpacing:2,color:"#6a8a74"}}>STUFE</div>
            </div>
          </div>

          {/* Bars */}
          <div style={{marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'Cinzel',serif",fontSize:".56rem",letterSpacing:1,color:"#6a8a74",marginBottom:2}}>
              <span>❤ HP</span><span>{Math.max(0,S.hp)}/{S.maxHp}</span>
            </div>
            <Bar pct={hpPct} colorA="#6a0000" colorB="#c04030"/>
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'Cinzel',serif",fontSize:".56rem",letterSpacing:1,color:"#6a8a74",marginBottom:2,marginTop:5}}>
              <span>🌿 XP</span><span>{S.xp}/{xpNeed}</span>
            </div>
            <Bar pct={xpPct} colorA="#1a4a28" colorB="#6a9a50"/>
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'Cinzel',serif",fontSize:".56rem",letterSpacing:1,color:lowSpoons?"#e05c20":"#6a8a74",marginBottom:2,marginTop:5}}>
              <span>🥄 Spoons</span><span>{S.spoons}/{S.maxSpoons}</span>
            </div>
            <Bar pct={spoonPct} colorA={lowSpoons?"#7a2000":"#2a5a38"} colorB={lowSpoons?"#c05020":"#70c8a0"}/>
          </div>

          {lowSpoons&&<div style={{fontFamily:"'Cinzel',serif",fontSize:".6rem",color:"#e05c20",textAlign:"center",padding:"4px",background:"rgba(224,92,32,.07)",border:"1px solid rgba(224,92,32,.2)",borderRadius:3,marginBottom:6,animation:"pulse 2s infinite"}}>⚠ Wenig Energie — ruh dich aus</div>}

          <div style={{textAlign:"center",fontFamily:"'Cinzel',serif",fontSize:".58rem",letterSpacing:2,color:"#7aaa8a",marginBottom:6}}>
            {S.streak>=5?"🔥":S.streak>=2?"💧":"🌱"} {S.streak} Tage Streak
          </div>

          {/* Rast Buttons */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:6}}>
            <button className="btn" onClick={doShortRest} disabled={S.shortRestsToday>=2}
              style={{padding:"5px 6px",border:"1px solid #2d5a35",background:"rgba(80,160,60,.1)",color:S.shortRestsToday>=2?"#3a6a48":"#8ab87a",fontSize:".58rem"}}>
              🌿 Kurze Rast {S.shortRestsToday}/2
            </button>
            <button className="btn" onClick={doLongRest}
              style={{padding:"5px 6px",border:"1px solid #2a4a6a",background:"rgba(42,74,106,.15)",color:"#7aaac8",fontSize:".58rem"}}>
              🌙 Lange Rast
            </button>
          </div>
          <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:8}}>
            <button className="btn" onClick={()=>setShowW6("hp")} style={{padding:"4px 8px",border:"1px solid #c04030",background:"rgba(192,64,48,.1)",color:"#f09090",fontSize:".56rem"}}>🎲 HP</button>
            <button className="btn" onClick={()=>setShowW6("spoons")} style={{padding:"4px 8px",border:"1px solid #70c8a0",background:"rgba(112,200,160,.08)",color:"#90d8b0",fontSize:".56rem"}}>🎲 Spoons</button>
            <button className="btn" onClick={rollLoot} style={{padding:"4px 8px",border:"1px solid #a070d0",background:"rgba(160,112,208,.1)",color:"#c8a0f0",fontSize:".56rem"}}>💎 Loot</button>
          </div>

          <Divider label="Tagesstart"/>
          {/* Day Start toggle */}
          <button className="btn" onClick={()=>setShowDayStart(s=>!s)}
            style={{width:"100%",padding:"5px",border:"1px solid #2d5a35",background:"rgba(0,0,0,.2)",color:"#8ab87a",fontSize:".6rem",marginBottom:showDayStart?8:0}}>
            {showDayStart?"▲":"▼"} Spoons & Conditions
          </button>
          {showDayStart&&(
            <div style={{marginBottom:6}}>
              {/* Spoons W20 */}
              <div style={{marginBottom:8}}>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:".56rem",letterSpacing:2,color:"#6a8a74",marginBottom:4,textAlign:"center"}}>🥄 TAGES-SPOONS (W20)</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                  <button onClick={()=>setS(prev=>{const ns={...prev,spoons:Math.max(0,prev.spoons-1),maxSpoons:Math.max(0,prev.maxSpoons-1)};persist(ns);return ns;})}
                    style={{width:28,height:28,fontFamily:"'Cinzel',serif",fontSize:"1rem",background:"rgba(0,0,0,.3)",border:"1px solid #2d5a35",borderRadius:3,color:"#8ab87a",cursor:"pointer"}}>−</button>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:"2rem",color:"#a8d898",lineHeight:1,textShadow:"0 0 10px rgba(160,220,120,.2)"}}>{S.maxSpoons}</div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",color:"#4a7a58",letterSpacing:1}}>MAX SPOONS</div>
                  </div>
                  <button onClick={()=>setS(prev=>{const ns={...prev,spoons:Math.min(20,prev.spoons+1),maxSpoons:Math.min(20,prev.maxSpoons+1)};persist(ns);return ns;})}
                    style={{width:28,height:28,fontFamily:"'Cinzel',serif",fontSize:"1rem",background:"rgba(0,0,0,.3)",border:"1px solid #2d5a35",borderRadius:3,color:"#8ab87a",cursor:"pointer"}}>+</button>
                </div>
              </div>
              {/* Conditions */}
              <div style={{fontFamily:"'Cinzel',serif",fontSize:".56rem",letterSpacing:2,color:"#6a8a74",marginBottom:4,textAlign:"center"}}>CONDITIONS</div>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                {CONDITIONS.map(c=>{
                  const active=S.conditions.includes(c.id);
                  return(
                    <button key={c.id} onClick={()=>toggleCondition(c.id)}
                      style={{padding:"4px 8px",border:`1px solid ${active?"#2d7a40":"#1a3d20"}`,borderRadius:3,background:active?"rgba(80,160,60,.15)":"rgba(0,0,0,.2)",color:active?"#b0e89a":"#6a8a74",cursor:"pointer",fontFamily:"'Crimson Text',serif",fontSize:".8rem",textAlign:"left",transition:"all .2s"}}>
                      {c.icon} {c.label}
                      {active&&<span style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",color:"#70c8a0",marginLeft:4}}>{c.effect}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <Divider label="Attribute"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4,marginBottom:4}}>
            <StatBox label="STR" icon="🔥" val={S.stats.STR} color="#e05c20" tooltip="Stärke — Sport"/>
            <StatBox label="KON" icon="🌱" val={S.stats.CON} color="#c87840" tooltip="Konstitution — Arbeit"/>
            <StatBox label="GEW" icon="💧" val={S.stats.DEX} color="#2a7ab8" tooltip="Gewandtheit — Finanzen"/>
            <StatBox label="INT" icon="🌬" val={S.stats.INT} color="#c0eedd" tooltip="Intelligenz — Lernen"/>
            <StatBox label="WIS" icon="🌿" val={S.stats.WIS} color="#a0cc80" tooltip="Weisheit — Haushalt"/>
            <StatBox label="CHA" icon="✨" val={S.stats.CHA} color="#a070d0" tooltip="Charisma — Soziales"/>
          </div>
          <div style={{display:"flex",justifyContent:"center"}}>
            <div style={{width:"33%"}}><StatBox label="CARE" icon="🌸" val={S.stats.CARE} color="#d070a0" tooltip="Fürsorge — Selbstfürsorge"/></div>
          </div>

          <Divider label="Fertigkeiten"/>
          <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:5}}>
            {S.skills.map(sk=><SkillRow key={sk.id} skill={sk}/>)}
          </div>
          <div style={{display:"flex",gap:4}}>
            <input value={newSkill.emoji} onChange={e=>setNewSkill(s=>({...s,emoji:e.target.value}))} maxLength={2}
              style={{width:32,textAlign:"center",fontSize:".9rem",background:"rgba(0,0,0,.3)",border:"1px solid #1a3d20",borderRadius:3,padding:"3px",color:"#cce8d4"}}/>
            <input value={newSkill.name} onChange={e=>setNewSkill(s=>({...s,name:e.target.value}))} placeholder="Neue Fertigkeit…"
              onKeyDown={e=>e.key==="Enter"&&addSkill()}
              style={{flex:1,fontFamily:"'Crimson Text',serif",fontSize:".82rem",background:"rgba(0,0,0,.3)",border:"1px solid #1a3d20",borderRadius:3,padding:"3px 6px",color:"#cce8d4"}}/>
            <button onClick={addSkill} className="btn" style={{padding:"3px 7px",border:"1px solid #2d5a35",background:"transparent",color:"#6a8a74",fontSize:".6rem"}}>+</button>
          </div>

          <Divider label="Beutel"/>
          <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
            {S.loot.length===0?<span style={{fontSize:".7rem",color:"#3a6a48",fontStyle:"italic"}}>Noch leer…</span>:
              S.loot.slice(-12).map((l,i)=>(
                <span key={i} style={{padding:"2px 6px",borderRadius:2,fontSize:".68rem",border:`1px solid ${RARITY_COLOR[l.r]}44`,color:RARITY_COLOR[l.r],background:"rgba(0,0,0,.2)"}}>{l.e} {l.n}</span>
              ))
            }
          </div>

          {/* Milestones */}
          {S.milestones.length>0&&<>
            <Divider label="Meilensteine"/>
            <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
              {S.milestones.map(mid=>{
                const m=MILESTONES.find(x=>x.id===mid);
                return m?<span key={mid} title={m.label} style={{fontSize:".85rem",cursor:"default"}}>{m.icon}</span>:null;
              })}
            </div>
          </>}
        </div>

        {/* ══ QUEST PANEL ══ */}
        <div className="parchment-card" style={{padding:"14px 12px"}}>
          <div className="leaf-deco" style={{right:0,top:"30%",opacity:.03}}>🌿</div>

          {/* Tabs */}
          <div style={{display:"flex",gap:1,marginBottom:12,borderBottom:"1px solid #1a3d20"}}>
            {[
              {id:"rituale",label:`🔁 Rituale (${S.rituals.filter(r=>!r.completedToday||shouldResetRitual(r)).length})`},
              {id:"active", label:`⚔ Quests (${activeQuests.length})`},
              {id:"done",   label:`✓ Erledigt (${doneQuests.length})`},
            ].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{fontFamily:"'Cinzel',serif",fontSize:".62rem",letterSpacing:1,padding:"6px 10px",background:"transparent",border:"none",borderBottom:`2px solid ${tab===t.id?"#a8d898":"transparent"}`,color:tab===t.id?"#a8d898":"#6a8a74",cursor:"pointer",marginBottom:-1,transition:"all .2s"}}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Add buttons */}
          <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
            {tab==="active"&&(
              <button className="btn" onClick={()=>setShowAddQuest(s=>!s)}
                style={{padding:"6px 12px",border:"1px solid #2d5a35",background:"rgba(80,160,60,.15)",color:"#a8d898",fontWeight:700,fontSize:".64rem"}}>
                {showAddQuest?"▲ Schließen":"+ Quest eintragen"}
              </button>
            )}
            {tab==="rituale"&&(
              <button className="btn" onClick={()=>setShowRitual(s=>!s)}
                style={{padding:"6px 12px",border:"1px solid #2d5a35",background:"rgba(80,160,60,.15)",color:"#a8d898",fontWeight:700,fontSize:".64rem"}}>
                {showRitual?"▲ Schließen":"+ Ritual eintragen"}
              </button>
            )}
          </div>

          {/* Add Quest Form */}
          {showAddQuest&&tab==="active"&&(
            <div style={{background:"rgba(0,0,0,.2)",border:"1px solid #1a3d20",borderRadius:4,padding:12,marginBottom:10}}>
              <div style={{marginBottom:6}}>
                <label style={labelStyle}>Quest-Titel</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addQuest()} placeholder="Was ist deine Quest?" style={inputStyle}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
                <div>
                  <label style={labelStyle}>Bereich</label>
                  <select value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))} style={inputStyle}>
                    {Object.entries(CAT_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Schwierigkeit (DC)</label>
                  <select value={form.diff} onChange={e=>setForm(f=>({...f,diff:e.target.value}))} style={inputStyle}>
                    <option value="trivial">🟢 Trivial — DC 5 (+10 XP)</option>
                    <option value="easy">🟡 Leicht — DC 10 (+25 XP)</option>
                    <option value="medium">🟠 Mittel — DC 15 (+60 XP)</option>
                    <option value="hard">🔴 Schwer — DC 20 (+150 XP)</option>
                    <option value="boss">💀 Boss — DC 25 (+400 XP)</option>
                  </select>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
                <div>
                  <label style={labelStyle}>Deadline</label>
                  <input type="date" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>Fertigkeit</label>
                  <select value={form.skillId} onChange={e=>setForm(f=>({...f,skillId:e.target.value}))} style={inputStyle}>
                    <option value="">— keine —</option>
                    {S.skills.map(sk=><option key={sk.id} value={sk.id}>{sk.emoji} {sk.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                <div>
                  <label style={labelStyle}>Quest-Kette (ID)</label>
                  <input value={form.chainId} onChange={e=>setForm(f=>({...f,chainId:e.target.value}))} placeholder="z.B. 'bericht'" style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>Notiz</label>
                  <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Kontext…" style={inputStyle}/>
                </div>
              </div>
              <button className="btn" onClick={addQuest} style={{padding:"6px 14px",border:"1px solid #2d5a35",background:"rgba(80,160,60,.2)",color:"#a8d898",fontWeight:700,fontSize:".64rem"}}>+ Quest annehmen</button>
            </div>
          )}

          {/* Add Ritual Form */}
          {showRitual&&tab==="rituale"&&(
            <div style={{background:"rgba(0,0,0,.2)",border:"1px solid #1a3d20",borderRadius:4,padding:12,marginBottom:10}}>
              <div style={{marginBottom:6}}>
                <label style={labelStyle}>Ritual-Name</label>
                <input value={ritualForm.name} onChange={e=>setRitualForm(f=>({...f,name:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addRitual()} placeholder="z.B. Wasser trinken, Spaziergang…" style={inputStyle}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:6}}>
                <div>
                  <label style={labelStyle}>Bereich</label>
                  <select value={ritualForm.cat} onChange={e=>setRitualForm(f=>({...f,cat:e.target.value}))} style={inputStyle}>
                    {Object.entries(CAT_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Schwierigkeit</label>
                  <select value={ritualForm.diff} onChange={e=>setRitualForm(f=>({...f,diff:e.target.value}))} style={inputStyle}>
                    <option value="trivial">🟢 Trivial</option>
                    <option value="easy">🟡 Leicht</option>
                    <option value="medium">🟠 Mittel</option>
                    <option value="hard">🔴 Schwer</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Häufigkeit</label>
                  <select value={ritualForm.freq} onChange={e=>setRitualForm(f=>({...f,freq:e.target.value}))} style={inputStyle}>
                    <option value="daily">Täglich</option>
                    <option value="weekly">Wöchentlich</option>
                    <option value="monthly">Monatlich</option>
                  </select>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <input type="checkbox" id="reqCheck" checked={ritualForm.required} onChange={e=>setRitualForm(f=>({...f,required:e.target.checked}))} style={{accentColor:"#8ab87a"}}/>
                <label htmlFor="reqCheck" style={{fontFamily:"'Cinzel',serif",fontSize:".6rem",color:"#8ab87a",letterSpacing:1,cursor:"pointer"}}>Pflicht-Ritual (HP-Verlust wenn nicht erledigt)</label>
              </div>
              <button className="btn" onClick={addRitual} style={{padding:"6px 14px",border:"1px solid #2d5a35",background:"rgba(80,160,60,.2)",color:"#a8d898",fontWeight:700,fontSize:".64rem"}}>+ Ritual eintragen</button>
            </div>
          )}

          {/* RITUALE TAB */}
          {tab==="rituale"&&(
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {S.rituals.length===0?(
                <div style={{textAlign:"center",padding:"30px 20px",color:"#3a6a48",fontStyle:"italic",fontSize:".85rem"}}>
                  <div style={{fontSize:"1.6rem",marginBottom:6,opacity:.4}}>🔁</div>
                  Noch keine Rituale. Trage deine täglichen Gewohnheiten ein.
                </div>
              ):S.rituals.map(r=><RitualCard key={r.id} ritual={r} onToggle={completeRitual} onDelete={(id)=>{const ns={...S,rituals:S.rituals.filter(r=>r.id!==id)};setS(ns);persist(ns);}}/>)}
            </div>
          )}

          {/* ACTIVE QUESTS TAB */}
          {tab==="active"&&(
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {activeQuests.length===0?(
                <div style={{textAlign:"center",padding:"30px 20px",color:"#3a6a48",fontStyle:"italic",fontSize:".85rem"}}>
                  <div style={{fontSize:"1.6rem",marginBottom:6,opacity:.4}}>📜</div>
                  Keine aktiven Quests. Die Taverne ruft!
                </div>
              ):activeQuests.map(q=>(
                <QuestCard key={q.id} quest={q} skills={S.skills} conditions={S.conditions} onToggle={completeQuest} isCare={q.cat==="selbstfuersorge"}/>
              ))}
            </div>
          )}

          {/* DONE TAB */}
          {tab==="done"&&(
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {doneQuests.length===0?(
                <div style={{textAlign:"center",padding:"30px 20px",color:"#3a6a48",fontStyle:"italic",fontSize:".85rem"}}>
                  <div style={{fontSize:"1.6rem",marginBottom:6,opacity:.4}}>✓</div>
                  Noch nichts erledigt heute.
                </div>
              ):doneQuests.map(q=>(
                <QuestCard key={q.id} quest={q} skills={S.skills} conditions={S.conditions} onToggle={()=>{}} isCare={false}/>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
