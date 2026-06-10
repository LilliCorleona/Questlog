import { useState, useEffect } from "react";

const XP_MAP = {trivial:10,easy:25,medium:60,hard:150,boss:400};
const SPOON_COST = {trivial:1,easy:2,medium:3,hard:5,boss:8};
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
const QUADRANTS = [
  {id:"q1",title:"Wichtig & Dringend",    sub:"Sofort erledigen",          icon:"⚔️", color:"#e05c20",bg:"rgba(224,92,32,.05)",  border:"rgba(224,92,32,.3)"},
  {id:"q2",title:"Wichtig & Nicht Dringend",sub:"Planen & terminieren",    icon:"🌟", color:"#b0e89a",bg:"rgba(176,232,154,.04)",border:"rgba(176,232,154,.25)"},
  {id:"q3",title:"Nicht Wichtig & Dringend",sub:"Delegieren wenn möglich", icon:"💧", color:"#60b8e8",bg:"rgba(96,184,232,.04)", border:"rgba(96,184,232,.25)"},
  {id:"q4",title:"Nicht Wichtig & Nicht Dringend",sub:"Später oder löschen",icon:"🌿",color:"#6a9a50",bg:"rgba(106,154,80,.04)",border:"rgba(106,154,80,.2)"},
];

function Toast({msg,type,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,3200);return()=>clearTimeout(t);},[]);
  const c={loot:{b:"#8ab87a",t:"#b0e89a"},warning:{b:"#e05c20",t:"#f09080"},crit:{b:"#a0cc80",t:"#c0eedd"}}[type]||{b:"#8ab87a",t:"#b0e89a"};
  return(
    <div style={{position:"fixed",bottom:22,right:22,padding:"9px 16px",borderRadius:4,fontFamily:"'Cinzel',serif",fontSize:".68rem",letterSpacing:1,border:`1px solid ${c.b}`,color:c.t,background:"#080f09",zIndex:500,maxWidth:280,lineHeight:1.5,animation:"slideIn .4s ease"}}>
      {msg}
    </div>
  );
}

function Divider({label}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,margin:"10px 0 7px"}}>
      <div style={{flex:1,height:1,background:"linear-gradient(to right,transparent,#2d5a35,transparent)"}}/>
      {label
        ?<span style={{fontFamily:"'Cinzel',serif",fontSize:".52rem",letterSpacing:3,color:"#3a6a48",textTransform:"uppercase",whiteSpace:"nowrap"}}>{label}</span>
        :<span style={{color:"#3a6a48",fontSize:".65rem"}}>◆</span>
      }
      <div style={{flex:1,height:1,background:"linear-gradient(to right,transparent,#2d5a35,transparent)"}}/>
    </div>
  );
}

function AddQuestModal({quadId,quadTitle,skills,chainIds,onAdd,onClose}){
  const [form,setForm]=useState({title:"",cat:"arbeit",diff:"medium",deadline:"",skillId:"",notes:"",chainId:""});
  const submit=()=>{
    if(!form.title.trim()) return;
    onAdd({
      id:Date.now().toString(),
      name:form.title.trim(),
      cat:form.cat,diff:form.diff,
      deadline:form.deadline||null,
      skillId:form.skillId||null,
      notes:form.notes||null,
      chainId:form.chainId||null,
      quadrant:quadId,
      created:new Date().toISOString(),
    });
    onClose();
  };
  const inp={width:"100%",fontFamily:"'Crimson Text',serif",fontSize:".88rem",background:"rgba(0,0,0,.4)",border:"1px solid #1a3d20",borderRadius:3,padding:"6px 9px",color:"#cce8d4"};
  const lbl={fontFamily:"'Cinzel',serif",fontSize:".56rem",letterSpacing:1,color:"#3a6a48",textTransform:"uppercase",display:"block",marginBottom:2};
  return(
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:"linear-gradient(135deg,#0e2412,#0a1c0e)",border:"1px solid #2d5a35",borderRadius:6,padding:"24px 22px",maxWidth:420,width:"92%",boxShadow:"0 0 50px rgba(80,160,80,.15)",animation:"popIn .35s ease",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-8,top:-8,fontSize:"3rem",opacity:.04,pointerEvents:"none"}}>🌿</div>
        <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:"1rem",color:"#a8d898",marginBottom:4,textAlign:"center"}}>Neue Quest</div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:".6rem",letterSpacing:3,color:"#4a7a58",textAlign:"center",marginBottom:14}}>{quadTitle}</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div>
            <label style={lbl}>Quest-Titel</label>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Was muss getan werden?" style={inp} autoFocus/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            <div>
              <label style={lbl}>Bereich</label>
              <select value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))} style={inp}>
                {Object.entries(CAT_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Schwierigkeit (DC)</label>
              <select value={form.diff} onChange={e=>setForm(f=>({...f,diff:e.target.value}))} style={inp}>
                <option value="trivial">🟢 Trivial — DC 5</option>
                <option value="easy">🟡 Leicht — DC 10</option>
                <option value="medium">🟠 Mittel — DC 15</option>
                <option value="hard">🔴 Schwer — DC 20</option>
                <option value="boss">💀 Boss — DC 25</option>
              </select>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            <div>
              <label style={lbl}>Deadline</label>
              <input type="date" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Fertigkeit</label>
              <select value={form.skillId} onChange={e=>setForm(f=>({...f,skillId:e.target.value}))} style={inp}>
                <option value="">— keine —</option>
                {skills.map(sk=><option key={sk.id} value={sk.id}>{sk.emoji} {sk.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            <div>
              <label style={lbl}>Quest-Kette (ID)</label>
              <input value={form.chainId} onChange={e=>setForm(f=>({...f,chainId:e.target.value}))}
                placeholder="z.B. 'bericht'"
                list="chainlist" style={inp}/>
              <datalist id="chainlist">{chainIds.map(c=><option key={c} value={c}/>)}</datalist>
            </div>
            <div>
              <label style={lbl}>Notiz</label>
              <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Kontext, Bedingungen…" style={inp}/>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={submit} style={{flex:1,fontFamily:"'Cinzel',serif",fontSize:".66rem",letterSpacing:1,padding:"8px",border:"1px solid #2d5a35",borderRadius:3,background:"rgba(80,160,60,.2)",color:"#a8d898",cursor:"pointer",fontWeight:700}}>
            + Quest eintragen
          </button>
          <button onClick={onClose} style={{fontFamily:"'Cinzel',serif",fontSize:".66rem",padding:"8px 14px",border:"1px solid #1a3d20",borderRadius:3,background:"transparent",color:"#4a7a58",cursor:"pointer"}}>
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestCard({quest,quadColor,skills,onAccept,onDelete,onMove}){
  const [hover,setHover]=useState(false);
  const [showMove,setShowMove]=useState(false);
  const meta=CAT_META[quest.cat]||{label:quest.cat,color:"#70c8a0"};
  const skill=quest.skillId?skills.find(s=>s.id===quest.skillId):null;
  const diffEmoji={trivial:"🟢",easy:"🟡",medium:"🟠",hard:"🔴",boss:"💀"}[quest.diff];
  const dcLabel={trivial:"DC 5",easy:"DC 10",medium:"DC 15",hard:"DC 20",boss:"DC 25"}[quest.diff];
  let dlColor="#6a8a74"; let dlText="";
  if(quest.deadline){
    const now=new Date();now.setHours(0,0,0,0);
    const dl=new Date(quest.deadline);
    const days=Math.round((dl-now)/86400000);
    if(days<0){dlText=`☠ Überfällig (${Math.abs(days)}T)`;dlColor="#e05c20";}
    else if(days===0){dlText="⚠ Heute!";dlColor="#e05c20";}
    else if(days<=3){dlText=`⏳ ${days}T`;dlColor="#c87840";}
    else dlText=`📅 ${days}T`;
  }
  return(
    <div
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>{setHover(false);setShowMove(false);}}
      style={{
        background:hover?"rgba(255,255,255,.03)":"rgba(0,0,0,.22)",
        border:`1px solid ${hover?quadColor+"66":"#1a3d20"}`,
        borderLeft:`3px solid ${meta.color}`,
        borderRadius:3,padding:"9px 10px 7px",
        transition:"all .2s",
        position:"relative",
      }}>
      {/* Quest name */}
      <div style={{fontFamily:"'Crimson Text',serif",fontSize:".92rem",fontWeight:600,color:"#b8cfc0",lineHeight:1.25,marginBottom:5,paddingRight:16}}>
        {quest.name}
      </div>
      {/* Tags row */}
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6,alignItems:"center"}}>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",letterSpacing:1,padding:"1px 5px",border:`1px solid ${meta.color}44`,borderRadius:2,color:meta.color}}>{meta.label}</span>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",color:"#5a8a6a",padding:"1px 4px"}}>{diffEmoji} {dcLabel}</span>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",color:"#a0cc80",padding:"1px 4px"}}>+{XP_MAP[quest.diff]} XP</span>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",color:"#6a8a74",padding:"1px 4px"}}>🥄{SPOON_COST[quest.diff]}</span>
        {skill&&<span style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",padding:"1px 5px",border:"1px solid #70c8a033",borderRadius:2,color:"#70c8a0"}}>{skill.emoji} {skill.name}</span>}
        {quest.chainId&&<span style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",padding:"1px 5px",border:"1px solid #8ab87a33",borderRadius:2,color:"#8ab87a"}}>🔗 {quest.chainId}</span>}
        {dlText&&<span style={{fontSize:".72rem",color:dlColor,fontStyle:"italic"}}>{dlText}</span>}
      </div>
      {quest.notes&&<div style={{fontSize:".74rem",color:"#4a7a58",fontStyle:"italic",marginBottom:5}}>{quest.notes}</div>}
      {/* Actions */}
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        <button onClick={()=>onAccept(quest)} style={{flex:1,fontFamily:"'Cinzel',serif",fontSize:".58rem",letterSpacing:1,padding:"4px 7px",border:`1px solid ${quadColor}55`,borderRadius:3,background:`${quadColor}10`,color:quadColor,cursor:"pointer",transition:"all .2s",minWidth:80}}>
          ⚔ Heute annehmen
        </button>
        <div style={{position:"relative"}}>
          <button onClick={()=>setShowMove(s=>!s)} style={{fontFamily:"'Cinzel',serif",fontSize:".58rem",padding:"4px 7px",border:"1px solid #2d5a3555",borderRadius:3,background:"transparent",color:"#5a8a6a",cursor:"pointer"}} title="Verschieben">⇄</button>
          {showMove&&(
            <div style={{position:"absolute",bottom:"100%",right:0,background:"#0d2010",border:"1px solid #2d5a35",borderRadius:4,padding:"6px",zIndex:10,minWidth:160,marginBottom:4,boxShadow:"0 4px 16px rgba(0,0,0,.5)"}}>
              {QUADRANTS.filter(q=>q.id!==quest.quadrant).map(q=>(
                <button key={q.id} onClick={()=>{onMove(quest.id,q.id);setShowMove(false);}}
                  style={{display:"block",width:"100%",textAlign:"left",fontFamily:"'Cinzel',serif",fontSize:".58rem",padding:"4px 8px",border:"none",background:"transparent",color:q.color,cursor:"pointer",borderRadius:2,marginBottom:2}}>
                  {q.icon} {q.title}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={()=>onDelete(quest.id)} style={{fontFamily:"'Cinzel',serif",fontSize:".6rem",padding:"4px 7px",border:"1px solid #1a2a1a",borderRadius:3,background:"transparent",color:"#3a5a40",cursor:"pointer"}} title="Entfernen">✕</button>
      </div>
    </div>
  );
}

export default function Questboard(){
  const [quests,setQuests]=useState([]);
  const [charData,setCharData]=useState(null);
  const [modal,setModal]=useState(null);
  const [toasts,setToasts]=useState([]);
  const [filter,setFilter]=useState("all");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      try{
        const bRes=await window.storage.get("boardquests");
        setQuests(bRes?JSON.parse(bRes.value):[]);
        const cRes=await window.storage.get("character");
        setCharData(cRes?JSON.parse(cRes.value):null);
      }catch{ setQuests([]); }
      setLoading(false);
    })();
  },[]);

  const saveQuests=async(qs)=>{ await window.storage.set("boardquests",JSON.stringify(qs)); };

  const toast=(msg,type="loot")=>{
    const id=Date.now()+Math.random();
    setToasts(t=>[...t.slice(-3),{id,msg,type}]);
  };

  const addQuest=(q)=>{ const nq=[q,...quests]; setQuests(nq); saveQuests(nq); toast("📜 Quest eingetragen!","crit"); };

  const deleteQuest=(id)=>{ const nq=quests.filter(q=>q.id!==id); setQuests(nq); saveQuests(nq); };

  const moveQuest=(id,newQuadrant)=>{
    const nq=quests.map(q=>q.id===id?{...q,quadrant:newQuadrant}:q);
    setQuests(nq); saveQuests(nq);
    const qLabel=QUADRANTS.find(q=>q.id===newQuadrant)?.title;
    toast(`⇄ Quest verschoben → ${qLabel}`,"loot");
  };

  const acceptToday=async(quest)=>{
    try{
      const cRes=await window.storage.get("character");
      if(cRes){
        const char=JSON.parse(cRes.value);
        const already=(char.quests||[]).some(q=>q.id===quest.id);
        if(!already){
          const updated={...char,quests:[{...quest,done:false,penaltyApplied3:false,penaltyApplied7:false},...(char.quests||[])]};
          await window.storage.set("character",JSON.stringify(updated));
          toast(`⚔ "${quest.name}" ins Tageslog übernommen!`,"loot");
        } else {
          toast("Diese Quest ist bereits im Tageslog.","warning");
        }
      } else {
        toast("Kein Charakter gefunden — öffne erst das Tageslog.","warning");
      }
    }catch{ toast("Fehler beim Übertragen.","warning"); }
  };

  const skills=charData?.skills||[];
  const chainIds=[...new Set(quests.filter(q=>q.chainId).map(q=>q.chainId))];

  const getFiltered=(quadId)=>{
    let qs=quests.filter(q=>q.quadrant===quadId);
    if(filter!=="all") qs=qs.filter(q=>q.cat===filter);
    return qs;
  };

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:#060e08;}
    @keyframes slideIn{from{transform:translateX(80px);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes popIn{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
    input,select{outline:none;color-scheme:dark;}
    ::-webkit-scrollbar{width:3px;}
    ::-webkit-scrollbar-thumb{background:#1e4a28;border-radius:2px;}
    .parchment-card{
      background:linear-gradient(160deg,#0e2412 0%,#0a1c0e 50%,#0d2010 100%);
      border-radius:5px;
      position:relative;
      overflow:hidden;
    }
    .parchment-card::before{
      content:'';position:absolute;inset:0;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.022'/%3E%3C/svg%3E");
      pointer-events:none;z-index:0;
    }
  `;

  if(loading) return <div style={{color:"#7aaa8a",fontFamily:"'Cinzel',serif",textAlign:"center",padding:40,background:"#060e08",minHeight:"100vh"}}>Lade Questboard…</div>;

  const totalQuests=quests.length;
  const overdueCount=quests.filter(q=>{
    if(!q.deadline) return false;
    const now=new Date();now.setHours(0,0,0,0);
    return new Date(q.deadline)<now;
  }).length;

  return(
    <div style={{minHeight:"100vh",background:"#060e08",backgroundImage:"radial-gradient(ellipse at 15% 20%,#0b2210 0%,transparent 45%),radial-gradient(ellipse at 85% 80%,#071508 0%,transparent 45%)",fontFamily:"'Crimson Text',Georgia,serif",color:"#cce8d4",padding:"14px 12px 60px"}}>
      <style>{css}</style>
      {toasts.map(t=><Toast key={t.id} msg={t.msg} type={t.type} onDone={()=>setToasts(ts=>ts.filter(x=>x.id!==t.id))}/>)}
      {modal&&<AddQuestModal quadId={modal.id} quadTitle={modal.title} skills={skills} chainIds={chainIds} onAdd={addQuest} onClose={()=>setModal(null)}/>}

      {/* HEADER */}
      <div style={{textAlign:"center",maxWidth:1100,margin:"0 auto 16px"}}>
        <div style={{opacity:.3,fontSize:"1rem",marginBottom:5,letterSpacing:8}}>🔥 💧 🌬 🌿</div>
        <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:"clamp(1rem,2.8vw,1.6rem)",color:"#d5ead8",letterSpacing:4,textShadow:"0 0 30px rgba(160,210,160,.15)"}}>Das Questboard</div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:".6rem",letterSpacing:5,color:"#4a7a58",marginTop:4}}>LANGFRISTIGE QUESTS · KEIN HP-VERLUST</div>

        {/* Char summary */}
        {charData&&(
          <div style={{display:"inline-flex",gap:16,alignItems:"center",background:"rgba(13,32,16,.8)",border:"1px solid #1a3d20",borderRadius:4,padding:"6px 14px",margin:"10px 0 6px",flexWrap:"wrap",justifyContent:"center"}}>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:".62rem",color:"#8ab87a"}}>⚔ {charData.charName}</span>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:".62rem",color:"#a8d898"}}>Stufe {charData.level}</span>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:".62rem",color:"#6a8a74"}}>{totalQuests} Quests</span>
            {overdueCount>0&&<span style={{fontFamily:"'Cinzel',serif",fontSize:".62rem",color:"#e05c20"}}>☠ {overdueCount} überfällig</span>}
          </div>
        )}

        <Divider/>

        {/* Filter */}
        <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>setFilter("all")} style={{fontFamily:"'Cinzel',serif",fontSize:".56rem",letterSpacing:1,padding:"3px 9px",border:`1px solid ${filter==="all"?"#2d5a35":"#1a3d20"}`,borderRadius:3,background:filter==="all"?"rgba(80,160,60,.15)":"transparent",color:filter==="all"?"#a8d898":"#4a7a58",cursor:"pointer"}}>
            Alle ({totalQuests})
          </button>
          {Object.entries(CAT_META).map(([k,v])=>{
            const count=quests.filter(q=>q.cat===k).length;
            if(count===0) return null;
            return(
              <button key={k} onClick={()=>setFilter(k)} style={{fontFamily:"'Cinzel',serif",fontSize:".56rem",letterSpacing:1,padding:"3px 9px",border:`1px solid ${filter===k?v.color+"66":"#1a3d20"}`,borderRadius:3,background:filter===k?v.color+"15":"transparent",color:filter===k?v.color:"#4a7a58",cursor:"pointer"}}>
                {v.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* EISENHOWER GRID */}
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        {/* Axis labels */}
        <div style={{display:"grid",gridTemplateColumns:"20px 1fr 1fr",gap:10,marginBottom:4}}>
          <div/>
          <div style={{textAlign:"center",fontFamily:"'Cinzel',serif",fontSize:".56rem",letterSpacing:3,color:"#e05c2077"}}>⚡ DRINGEND</div>
          <div style={{textAlign:"center",fontFamily:"'Cinzel',serif",fontSize:".56rem",letterSpacing:3,color:"#6a8a7477"}}>🕰 NICHT DRINGEND</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"20px 1fr 1fr",gridTemplateRows:"auto auto",gap:10}}>
          {/* Importance labels */}
          <div style={{gridRow:"1/2",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",letterSpacing:2,color:"#e05c2066",writingMode:"vertical-rl",textOrientation:"mixed",transform:"rotate(180deg)",whiteSpace:"nowrap"}}>WICHTIG</div>
          </div>
          <div style={{gridRow:"2/3",gridColumn:"1/2",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:".5rem",letterSpacing:2,color:"#6a8a7466",writingMode:"vertical-rl",textOrientation:"mixed",transform:"rotate(180deg)",whiteSpace:"nowrap"}}>NICHT WICHTIG</div>
          </div>

          {/* Q1 — Wichtig & Dringend */}
          {QUADRANTS.map((q,i)=>{
            const qs=getFiltered(q.id);
            const allCount=quests.filter(qq=>qq.quadrant===q.id).length;
            return(
              <div key={q.id} className="parchment-card"
                style={{border:`1px solid ${q.border}`,padding:"12px",minHeight:320,display:"flex",flexDirection:"column",gap:7,gridColumn:i%2===0?"2/3":"3/4",gridRow:i<2?"1/2":"2/3"}}>
                {/* Decorative corner leaf */}
                <div style={{position:"absolute",fontSize:"2.5rem",opacity:.035,right:4,bottom:4,pointerEvents:"none",userSelect:"none"}}>🌿</div>

                {/* Quadrant header */}
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",position:"relative",zIndex:1}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:1}}>
                      <span style={{fontSize:"1rem"}}>{q.icon}</span>
                      <span style={{fontFamily:"'Cinzel',serif",fontSize:".68rem",fontWeight:700,color:q.color,letterSpacing:1}}>{q.title}</span>
                      {allCount>0&&<span style={{fontFamily:"'Cinzel',serif",fontSize:".56rem",color:q.color,background:`${q.color}18`,border:`1px solid ${q.color}33`,borderRadius:10,padding:"1px 7px"}}>{allCount}</span>}
                    </div>
                    <div style={{fontFamily:"'Crimson Text',serif",fontSize:".76rem",color:"#5a8a6a",fontStyle:"italic",marginLeft:22}}>{q.sub}</div>
                  </div>
                  <button onClick={()=>setModal({id:q.id,title:q.title})} style={{fontFamily:"'Cinzel',serif",fontSize:".6rem",letterSpacing:1,padding:"4px 9px",border:`1px solid ${q.color}55`,borderRadius:3,background:`${q.color}10`,color:q.color,cursor:"pointer",flexShrink:0,marginLeft:6}}>
                    + Quest
                  </button>
                </div>

                <div style={{height:1,background:`linear-gradient(to right,${q.color}44,transparent)`,margin:"0 0 2px",flexShrink:0}}/>

                {/* Cards */}
                <div style={{display:"flex",flexDirection:"column",gap:5,flex:1,overflowY:"auto",position:"relative",zIndex:1}}>
                  {qs.length===0?(
                    <div style={{textAlign:"center",padding:"20px 10px",color:"#3a5a40",fontStyle:"italic",fontSize:".8rem"}}>
                      <div style={{fontSize:"1.3rem",marginBottom:4,opacity:.35}}>{q.icon}</div>
                      Keine Quests hier
                    </div>
                  ):qs.map(quest=>(
                    <QuestCard key={quest.id} quest={quest} quadColor={q.color} skills={skills}
                      onAccept={acceptToday} onDelete={deleteQuest} onMove={moveQuest}/>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer note */}
      <div style={{maxWidth:1100,margin:"12px auto 0",textAlign:"center",fontFamily:"'Cinzel',serif",fontSize:".55rem",letterSpacing:2,color:"#2a4a30"}}>
        ✦ BOARD-QUESTS KOSTEN KEIN HP · KEIN DRUCK · NUR ÜBERBLICK ✦
      </div>
    </div>
  );
}
