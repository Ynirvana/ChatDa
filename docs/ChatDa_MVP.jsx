import { useState, useEffect } from "react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
:root {
  --g1:#FF6B35;--g2:#E84393;--g3:#6C5CE7;--g4:#0984E3;
  --w:#FFF;--w9:rgba(255,255,255,.9);--w7:rgba(255,255,255,.7);--w5:rgba(255,255,255,.5);--w2:rgba(255,255,255,.2);--w1:rgba(255,255,255,.1);--w05:rgba(255,255,255,.05);
  --dk:#1a1033;--dk8:rgba(26,16,51,.8);
  --grn:#00B894;--grn-bg:rgba(0,184,148,.15);
  --blu:#74B9FF;--blu-bg:rgba(116,185,255,.15);
  --pur:#A29BFE;--pur-bg:rgba(162,155,254,.15);
  --yel:#FFEAA7;--yel-bg:rgba(255,234,167,.15);
  --pink:#FD79A8;--pink-bg:rgba(253,121,168,.15);
  --cd:rgba(255,255,255,.08);--cb:rgba(255,255,255,.12);--ch:rgba(255,255,255,.14);
  --rd:16px;--rdl:24px;--rdf:999px;
}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--dk);color:var(--w);-webkit-font-smoothing:antialiased}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-12px) rotate(3deg)}}
@keyframes glow{0%,100%{opacity:.4}50%{opacity:.8}}
@keyframes scaleIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
.fu{animation:fadeUp .6s ease-out forwards;opacity:0}
.si{animation:scaleIn .35s ease-out forwards}
.mg{background:linear-gradient(135deg,var(--g1) 0%,var(--g2) 35%,var(--g3) 70%,var(--g4) 100%)}
.pb{min-height:100vh;background:linear-gradient(165deg,#1a1033 0%,#2d1b4e 30%,#1a1033 60%,#0f1923 100%)}
input,textarea,select{font-family:'Plus Jakarta Sans',sans-serif;background:var(--cd);border:1.5px solid var(--cb);border-radius:12px;color:var(--w);padding:14px 18px;font-size:15px;outline:none;width:100%;transition:border-color .2s}
input:focus,textarea:focus,select:focus{border-color:var(--w5)}
input::placeholder,textarea::placeholder{color:var(--w5)}
select option{background:var(--dk);color:var(--w)}
`;

const R="999px";
const TI={Student:{c:"var(--blu)",bg:"var(--blu-bg)",i:"🎓",l:"Student"},Local:{c:"var(--grn)",bg:"var(--grn-bg)",i:"📍",l:"Local"},Traveler:{c:"var(--pur)",bg:"var(--pur-bg)",i:"✈️",l:"Traveler"}};
const FI={eats:{e:"🍖",l:"chatda eats",c:"var(--g1)",bg:"rgba(255,107,53,.2)"},nights:{e:"🍺",l:"chatda nights",c:"var(--blu)",bg:"var(--blu-bg)"}};
const CATS=[{k:"all",l:"All",i:"✨"},{k:"visa",l:"Visa & Work",i:"📄"},{k:"life",l:"Daily Life",i:"🏠"},{k:"food",l:"Food & Places",i:"🍖"}];
const SCATS=[{k:"all",l:"All",i:"✨"},{k:"food",l:"Restaurants",i:"🍖"},{k:"cafe",l:"Cafés",i:"☕"},{k:"bar",l:"Bars",i:"🍺"},{k:"culture",l:"Culture",i:"🏛️"}];

const P=[
  {id:1,n:"Jun",t:"Local",nat:"Korean",bio:"I'll order for you lol",s:"instagram",a:"🧑‍🍳"},
  {id:2,n:"Alex",t:"Student",sch:"Yonsei",nat:"American",bio:"Here for the food and bad jokes",s:"instagram",a:"😎"},
  {id:3,n:"Marie",t:"Traveler",nat:"French",bio:"3 weeks in Seoul, obsessed w/ kimchi",s:"instagram",a:"🇫🇷"},
  {id:4,n:"Yuki",t:"Student",sch:"Korea Univ",nat:"Japanese",bio:"Exchange student, love spicy food",s:"instagram",a:"🎌"},
  {id:5,n:"Mina",t:"Local",nat:"Korean",bio:"Foodie & your local guide tonight",s:"linkedin",a:"👩‍💼"},
  {id:6,n:"Tom",t:"Traveler",nat:"British",bio:"Digital nomad, 2 months in Seoul",s:"linkedin",a:"🇬🇧"},
];

const EVS=[
  {id:1,title:"Samgyeopsal Night 🥩",fmt:"eats",date:"2026-04-18",time:"7:00 PM",loc:"맛찬들왕소금구이 홍대점",area:"Hongdae",cap:12,fee:1000,desc:"Real Korean BBQ with locals who'll help you order, grill, and eat like you've been here for years.",ppl:[P[0],P[1],P[2],P[3],P[4]]},
  {id:2,title:"Friday Pub Night 🍺",fmt:"nights",date:"2026-04-25",time:"8:00 PM",loc:"펀마이마이 이태원점",area:"Itaewon",cap:20,fee:1000,desc:"Beer, board games, and new friends. Darts, pool, card games — pay for your own drinks.",ppl:[P[0],P[5]]},
];

const QS=[
  {id:1,title:"How do I open a bank account as a foreigner?",body:"Just arrived on E-2 visa with ARC. Which bank? What docs?",cat:"visa",au:P[5],time:"2h ago",votes:12,ac:3,views:89,solved:true,answers:[
    {id:1,body:"KEB Hana Bank in Itaewon — English staff. Bring ARC, passport, employment contract. ~40 min.",au:P[0],time:"1h ago",votes:8,ok:true},
    {id:2,body:"Shinhan Bank app has full English. Go early — wait is brutal after lunch.",au:P[1],time:"45m ago",votes:4,ok:false},
    {id:3,body:"Kakao Bank is easiest IF you already have a Korean phone + another bank account.",au:P[4],time:"30m ago",votes:3,ok:false},
  ]},
  {id:2,title:"Best SIM card for 3-month stay?",body:"Tourist visa, need data+calls. Budget ₩30-40k/month.",cat:"life",au:P[2],time:"5h ago",votes:7,ac:2,views:54,solved:false,answers:[
    {id:4,body:"Chingu Mobile — prepaid ₩33k/month, 10GB. Sign up online, pick up at airport.",au:P[3],time:"3h ago",votes:5,ok:false},
    {id:5,body:"eSIM Airalo for data + CU prepaid SIM for Korean number. ≈₩35k total.",au:P[5],time:"2h ago",votes:3,ok:false},
  ]},
  {id:3,title:"English-speaking dentist near Gangnam?",body:"Toothache. How much without insurance?",cat:"life",au:P[1],time:"1d ago",votes:15,ac:4,views:203,solved:true,answers:[]},
  {id:4,title:"Can I freelance on E-2 visa?",body:"I do graphic design on the side. Legal?",cat:"visa",au:P[5],time:"2d ago",votes:22,ac:5,views:341,solved:false,answers:[]},
  {id:5,title:"Hidden 삼겹살 spots in Mapo-gu?",body:"Tired of tourist spots. Locals, where do YOU go?",cat:"food",au:P[3],time:"3d ago",votes:18,ac:6,views:267,solved:true,answers:[]},
];

const SPOTS=[
  {id:1,name:"맛찬들왕소금구이",area:"Hongdae",cat:"food",desc:"The real deal for samgyeopsal. Thick-cut pork belly, amazing salt seasoning. Locals' favorite.",
   grad:"linear-gradient(135deg,#e17055,#d63031)",emoji:"🥩",
   photos:[
    {id:1,au:P[1],cap:"First time grilling Korean BBQ myself!! Jun showed me how 🔥",grad:"linear-gradient(135deg,#ff7675,#d63031)",emoji:"🔥",time:"2d ago",likes:14},
    {id:2,au:P[2],cap:"This 된장찌개 side dish was incredible",grad:"linear-gradient(135deg,#fdcb6e,#e17055)",emoji:"🍲",time:"2d ago",likes:9},
    {id:3,au:P[0],cap:"Our chatda eats crew 🥩🍻",grad:"linear-gradient(135deg,#fab1a0,#e84393)",emoji:"📸",time:"2d ago",likes:22},
    {id:4,au:P[3],cap:"소금구이 > everything. I'll fight anyone who disagrees",grad:"linear-gradient(135deg,#ff6348,#ee5a24)",emoji:"🥩",time:"3d ago",likes:17},
  ]},
  {id:2,name:"펀마이마이",area:"Itaewon",cat:"bar",desc:"Beer + board games + darts + pool. Perfect for groups. Great craft beer selection.",
   grad:"linear-gradient(135deg,#0984e3,#6c5ce7)",emoji:"🍺",
   photos:[
    {id:5,au:P[5],cap:"Thursday night vibes at Funmymoney 🎯",grad:"linear-gradient(135deg,#74b9ff,#0984e3)",emoji:"🎯",time:"5d ago",likes:11},
    {id:6,au:P[0],cap:"Board game night! Played Catan for 3 hours",grad:"linear-gradient(135deg,#a29bfe,#6c5ce7)",emoji:"🎲",time:"5d ago",likes:8},
  ]},
  {id:3,name:"Café Onion 안국",area:"Jongno",cat:"cafe",desc:"Aesthetic café in a renovated traditional hanok. Amazing pastries and coffee. Always a line but worth it.",
   grad:"linear-gradient(135deg,#fdcb6e,#e17055)",emoji:"☕",
   photos:[
    {id:7,au:P[2],cap:"The building alone is worth the visit 😍",grad:"linear-gradient(135deg,#ffeaa7,#fdcb6e)",emoji:"🏠",time:"1w ago",likes:28},
    {id:8,au:P[3],cap:"Croissant + iced latte = perfect morning",grad:"linear-gradient(135deg,#dfe6e9,#b2bec3)",emoji:"🥐",time:"1w ago",likes:15},
    {id:9,au:P[4],cap:"한옥 카페는 여기가 진짜 최고",grad:"linear-gradient(135deg,#fab1a0,#e17055)",emoji:"☕",time:"1w ago",likes:19},
  ]},
  {id:4,name:"경복궁 Gyeongbokgung",area:"Jongno",cat:"culture",desc:"The main royal palace. Wear hanbok for free entry. Best at sunrise before the crowds.",
   grad:"linear-gradient(135deg,#00b894,#00cec9)",emoji:"🏛️",
   photos:[
    {id:10,au:P[2],cap:"Wore hanbok here and got free entry!! Life hack 🇰🇷",grad:"linear-gradient(135deg,#55efc4,#00b894)",emoji:"👘",time:"4d ago",likes:34},
    {id:11,au:P[1],cap:"Sunrise at Gyeongbokgung hits different",grad:"linear-gradient(135deg,#ffeaa7,#fab1a0)",emoji:"🌅",time:"6d ago",likes:41},
  ]},
  {id:5,name:"통인시장 Tongin Market",area:"Jongno",cat:"food",desc:"Traditional market with the famous coin lunch box (도시락). Fill your box with whatever looks good.",
   grad:"linear-gradient(135deg,#e84393,#fd79a8)",emoji:"🍱",
   photos:[
    {id:12,au:P[3],cap:"₩5,000 coin lunch box — best deal in Seoul",grad:"linear-gradient(135deg,#fd79a8,#e84393)",emoji:"🪙",time:"3d ago",likes:26},
    {id:13,au:P[5],cap:"Got way too much food. No regrets.",grad:"linear-gradient(135deg,#fab1a0,#ff7675)",emoji:"🍱",time:"4d ago",likes:18},
  ]},
];

// Components
function Bdg({t,sch,nat}){const x=TI[t];return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:R,background:x.bg,color:x.c,fontSize:11,fontWeight:700}}>{x.i} {x.l}{sch?` @ ${sch}`:""} · {nat}</span>}
function FBdg({f}){const x=FI[f];return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 14px",borderRadius:R,background:x.bg,color:x.c,fontSize:12,fontWeight:700,textTransform:"uppercase"}}>{x.e} {x.l}</span>}
function Btn({children,v="primary",full,onClick,style={}}){
  const s={primary:{background:"var(--w)",color:"var(--dk)",padding:"14px 28px",fontSize:15,fontWeight:700,border:"none",borderRadius:R,cursor:"pointer",transition:"all .2s",width:full?"100%":"auto",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"'Plus Jakarta Sans'",...style},
  ghost:{background:"transparent",color:"var(--w7)",padding:"10px 16px",fontSize:14,fontWeight:600,border:"none",borderRadius:R,cursor:"pointer",fontFamily:"'Plus Jakarta Sans'",...style},
  outline:{background:"transparent",color:"var(--w)",padding:"14px 28px",fontSize:15,fontWeight:700,border:"1.5px solid var(--w2)",borderRadius:R,cursor:"pointer",width:full?"100%":"auto",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"'Plus Jakarta Sans'",...style},
  glass:{background:"var(--cd)",color:"var(--w)",padding:"14px 28px",fontSize:15,fontWeight:700,border:"1.5px solid var(--cb)",borderRadius:R,cursor:"pointer",width:full?"100%":"auto",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"'Plus Jakarta Sans'",backdropFilter:"blur(10px)",...style},
  accent:{background:"linear-gradient(135deg,var(--g1),var(--g2))",color:"var(--w)",padding:"14px 28px",fontSize:15,fontWeight:700,border:"none",borderRadius:R,cursor:"pointer",width:full?"100%":"auto",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"'Plus Jakarta Sans'",...style}};
  return <button onClick={onClick} style={s[v]}>{children}</button>}
function Pill({c,active,onClick}){return <button onClick={onClick} style={{padding:"8px 18px",borderRadius:R,border:"1.5px solid",borderColor:active?"var(--g2)":"var(--cb)",background:active?"rgba(232,67,147,.2)":"var(--cd)",color:active?"var(--g2)":"var(--w7)",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans'",whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:5}}>{c.i} {c.l}</button>}
function Cd({children,style={},onClick,hover=true}){return <div onClick={onClick} style={{background:"var(--cd)",border:"1px solid var(--cb)",borderRadius:"var(--rd)",padding:20,cursor:onClick?"pointer":"default",transition:"all .25s",backdropFilter:"blur(10px)",...style}} onMouseOver={e=>{if(hover&&onClick){e.currentTarget.style.background="var(--ch)";e.currentTarget.style.transform="translateY(-2px)"}}} onMouseOut={e=>{if(hover&&onClick){e.currentTarget.style.background="var(--cd)";e.currentTarget.style.transform="none"}}}>{children}</div>}
function Orb({sz,color,top,left,right,bottom,d=0}){return <div style={{position:"absolute",width:sz,height:sz,borderRadius:"50%",background:`radial-gradient(circle,${color} 0%,transparent 70%)`,top,left,right,bottom,animation:`glow 4s ease-in-out infinite ${d}s`,pointerEvents:"none",filter:"blur(40px)"}}/>}

function Nav({pg,go,li}){
  const active=(t)=>pg===t||pg.startsWith(t);
  return <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(26,16,51,.75)",backdropFilter:"blur(24px)",borderBottom:"1px solid var(--w1)",padding:"0 20px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div onClick={()=>go("landing")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,var(--g1),var(--g2))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🇰🇷</div>
      <span style={{fontSize:22,fontWeight:900,letterSpacing:-1}}>chatda</span>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:2}}>
      {["meetups","places","asks"].map(t=><Btn key={t} v="ghost" onClick={()=>go(t==="asks"?"community":t)} style={{color:active(t==="asks"?"community":t)||active(t==="asks"?"question":"")?active("community")||active("question")?"var(--w)":"var(--w5)":"var(--w5)",fontWeight:(t==="meetups"&&(active("meetups")||active("meetup")))||(t==="places"&&(active("places")||active("place")))||(t==="asks"&&(active("community")||active("question")))?700:500,color:(t==="meetups"&&(active("meetups")||active("meetup")))||(t==="places"&&(active("places")||active("place")))||(t==="asks"&&(active("community")||active("question")))?"var(--w)":"var(--w5)"}}>{t.charAt(0).toUpperCase()+t.slice(1)}</Btn>)}
      {li?<div onClick={()=>go("profile")} style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,var(--g1),var(--g2))",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,marginLeft:8,border:"2px solid var(--w2)"}}>🇮🇹</div>
      :<Btn v="primary" onClick={()=>go("signup")} style={{marginLeft:8,padding:"10px 22px",fontSize:14}}>Join</Btn>}
    </div>
  </nav>}

// Photo card for spots
function PhotoCard({photo,onClick}){
  return <div onClick={onClick} style={{borderRadius:14,overflow:"hidden",cursor:"pointer",transition:"all .2s",position:"relative",aspectRatio:"1"}}
    onMouseOver={e=>{e.currentTarget.style.transform="scale(1.03)"}} onMouseOut={e=>{e.currentTarget.style.transform="none"}}>
    <div style={{width:"100%",height:"100%",background:photo.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:48}}>{photo.emoji}</div>
    <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"32px 12px 10px",background:"linear-gradient(transparent,rgba(0,0,0,.7))"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
        <div style={{width:20,height:20,borderRadius:"50%",background:TI[photo.au.t].bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>{photo.au.a}</div>
        <span style={{fontSize:11,fontWeight:700}}>{photo.au.n}</span>
      </div>
      <p style={{fontSize:11,color:"var(--w9)",lineHeight:1.3,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{photo.cap}</p>
    </div>
    <div style={{position:"absolute",top:8,right:8,padding:"2px 8px",borderRadius:R,background:"rgba(0,0,0,.4)",backdropFilter:"blur(4px)",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:3}}>❤️ {photo.likes}</div>
  </div>}

// Spot card
function SpotCard({spot,onClick}){
  return <Cd onClick={onClick} style={{padding:0,overflow:"hidden"}}>
    <div style={{height:120,background:spot.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,position:"relative"}}>
      {spot.emoji}
      <div style={{position:"absolute",bottom:8,right:8,padding:"3px 10px",borderRadius:R,background:"rgba(0,0,0,.4)",backdropFilter:"blur(4px)",fontSize:11,fontWeight:700}}>📸 {spot.photos.length}</div>
    </div>
    <div style={{padding:16}}>
      <h3 style={{fontSize:16,fontWeight:800,marginBottom:4}}>{spot.name}</h3>
      <div style={{fontSize:13,color:"var(--w5)",display:"flex",gap:10}}>
        <span>📍 {spot.area}</span>
        <span>❤️ {spot.photos.reduce((a,p)=>a+p.likes,0)}</span>
      </div>
    </div>
  </Cd>}

// PAGES
function Landing({go}){
  return <div>
    <section className="mg" style={{position:"relative",overflow:"hidden",padding:"100px 24px 80px",minHeight:520}}>
      <Orb sz={300} color="rgba(255,255,255,.08)" top="-80px" right="-60px"/><Orb sz={200} color="rgba(255,255,255,.06)" bottom="-40px" left="10%" d={1.5}/>
      <div style={{position:"absolute",top:60,right:"15%",width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,.1)",animation:"float 5s ease-in-out infinite"}}/>
      <div style={{position:"absolute",bottom:100,right:"25%",width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,.08)",animation:"float 4s ease-in-out infinite 1s"}}/>
      <div className="fu" style={{maxWidth:700,position:"relative"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 16px",borderRadius:R,background:"rgba(255,255,255,.15)",backdropFilter:"blur(10px)",fontSize:13,fontWeight:600,marginBottom:28,color:"var(--w9)"}}>⭐⭐⭐⭐⭐ First meetup this Saturday</div>
        <h1 style={{fontSize:"clamp(48px,10vw,80px)",fontWeight:900,lineHeight:.95,letterSpacing:-3,marginBottom:20}}>Find your<br/>Korea</h1>
        <p style={{fontSize:20,color:"var(--w9)",lineHeight:1.5,marginBottom:40,maxWidth:480}}>Meetups. Places. Answers.<br/>One home for foreigners in Korea.</p>
        <div style={{display:"flex",gap:14,flexWrap:"wrap"}}><Btn onClick={()=>go("signup")}>Join chatda</Btn><Btn v="outline" onClick={()=>go("meetups")}>See meetups</Btn></div>
      </div>
    </section>

    <section className="pb" style={{padding:"80px 24px"}}>
      <div style={{maxWidth:700,margin:"0 auto"}}>
        <h2 style={{fontSize:14,fontWeight:800,textTransform:"uppercase",letterSpacing:3,color:"var(--g2)",marginBottom:36}}>Why chatda?</h2>
        <div style={{display:"grid",gap:14}}>
          {[{i:"🔒",t:"Verified, real people",d:"No anonymous chat rooms. Everyone links social media and gets verified."},{i:"📸",t:"Discover & share places",d:"Find spots other foreigners love. Post your own. Build the guide together."},{i:"🚀",t:"From newcomer to local",d:"Join your first meetup. Share what you learn. Host your own. Become the local."}].map((x,i)=><Cd key={i}><div style={{display:"flex",gap:16}}><div style={{fontSize:28}}>{x.i}</div><div><div style={{fontWeight:800,fontSize:16,marginBottom:4}}>{x.t}</div><div style={{fontSize:14,color:"var(--w7)",lineHeight:1.5}}>{x.d}</div></div></div></Cd>)}
        </div>
      </div>
    </section>

    <section className="pb" style={{padding:"0 24px 60px"}}><div style={{maxWidth:700,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><h2 style={{fontSize:26,fontWeight:900}}>Upcoming</h2><Btn v="ghost" onClick={()=>go("meetups")}>See all →</Btn></div>
      <div style={{display:"grid",gap:14}}>{EVS.map(ev=><EvCard key={ev.id} ev={ev} go={()=>go(`meetup-${ev.id}`)}/>)}</div>
    </div></section>

    <section className="pb" style={{padding:"0 24px 60px"}}><div style={{maxWidth:700,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><h2 style={{fontSize:26,fontWeight:900}}>Popular Places</h2><Btn v="ghost" onClick={()=>go("places")}>See all →</Btn></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>{SPOTS.slice(0,3).map(s=><SpotCard key={s.id} spot={s} onClick={()=>go(`place-${s.id}`)}/>)}</div>
    </div></section>

    <section className="pb" style={{padding:"0 24px 60px"}}><div style={{maxWidth:700,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><h2 style={{fontSize:26,fontWeight:900}}>Recent Questions</h2><Btn v="ghost" onClick={()=>go("community")}>See all →</Btn></div>
      <div style={{display:"grid",gap:10}}>{QS.slice(0,3).map(q=><QCd key={q.id} q={q} go={()=>go(`question-${q.id}`)} compact/>)}</div>
    </div></section>

    <section className="mg" style={{padding:"80px 24px",textAlign:"center",position:"relative",overflow:"hidden"}}>
      <Orb sz={200} color="rgba(255,255,255,.1)" top="-60px" left="20%"/>
      <div style={{position:"relative"}}><h2 style={{fontSize:"clamp(28px,6vw,44px)",fontWeight:900,marginBottom:14,letterSpacing:-1}}>Your Korea<br/>starts here.</h2><p style={{fontSize:18,color:"var(--w9)",maxWidth:400,margin:"0 auto 32px"}}>Join, discover, share, host. Repeat.</p><Btn onClick={()=>go("signup")}>Join chatda — it's free</Btn></div>
    </section>
  </div>}

function EvCard({ev,go}){const f=FI[ev.fmt];const d=new Date(ev.date+"T00:00");
  return <Cd onClick={go}><div style={{display:"flex",gap:16}}>
    <div style={{width:58,minWidth:58,height:58,borderRadius:14,background:f.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,fontWeight:800,color:f.c,textTransform:"uppercase"}}>{d.toLocaleDateString("en-US",{weekday:"short"})}</span><span style={{fontSize:20,fontWeight:900,color:f.c}}>{d.getDate()}</span></div>
    <div style={{flex:1,minWidth:0}}><FBdg f={ev.fmt}/><h3 style={{fontSize:18,fontWeight:800,margin:"6px 0"}}>{ev.title}</h3><div style={{fontSize:13,color:"var(--w5)",display:"flex",gap:14,flexWrap:"wrap"}}><span>📍 {ev.area}</span><span>🕖 {ev.time}</span><span>👥 {ev.ppl.length}/{ev.cap}</span></div>
    <div style={{display:"flex",alignItems:"center",marginTop:12,gap:4}}><div style={{display:"flex"}}>{ev.ppl.slice(0,5).map((p,i)=><div key={p.id} style={{width:28,height:28,borderRadius:"50%",background:TI[p.t].bg,border:"2px solid var(--dk)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,marginLeft:i>0?-8:0,position:"relative",zIndex:5-i}}>{p.a}</div>)}</div><span style={{fontSize:12,color:"var(--w5)",marginLeft:4}}>{ev.ppl.length} going</span></div></div>
  </div></Cd>}

function EventsP({go}){return <div className="pb"><div style={{maxWidth:700,margin:"0 auto",padding:"40px 24px 80px"}}><h1 style={{fontSize:32,fontWeight:900,letterSpacing:-1,marginBottom:6}}>Meetups</h1><p style={{fontSize:16,color:"var(--w5)",marginBottom:32}}>Meet real people over real Korean food.</p><div style={{display:"grid",gap:14}}>{EVS.map(ev=><EvCard key={ev.id} ev={ev} go={()=>go(`meetup-${ev.id}`)}/>)}</div></div></div>}

function EvDetail({id,go,li}){const ev=EVS.find(e=>e.id===id);const[rsvp,setR]=useState(0);if(!ev)return null;const ds=new Date(ev.date+"T00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  return <div className="pb"><div style={{maxWidth:700,margin:"0 auto",padding:"24px 24px 120px"}}>
    <button onClick={()=>go("meetups")} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"var(--w5)",fontFamily:"'Plus Jakarta Sans'",marginBottom:20}}>← Back</button>
    <div className="fu"><FBdg f={ev.fmt}/><h1 style={{fontSize:32,fontWeight:900,letterSpacing:-1,marginTop:12,marginBottom:8}}>{ev.title}</h1>
      <Cd style={{marginTop:20,marginBottom:28}} hover={false}>{[{i:"📅",a:ds,b:ev.time},{i:"📍",a:ev.loc,b:ev.area},{i:"💰",a:`₩${ev.fee.toLocaleString()}`,b:ev.fmt==="eats"?"Food split (N빵)":"Pay your own"},{i:"👥",a:`${ev.ppl.length}/${ev.cap}`,b:`${ev.cap-ev.ppl.length} left`}].map((r,i)=><div key={i}>{i>0&&<div style={{height:1,background:"var(--w1)",margin:"14px 0"}}/>}<div style={{display:"flex",gap:14,alignItems:"center"}}><span style={{fontSize:22}}>{r.i}</span><div><div style={{fontWeight:700,fontSize:15}}>{r.a}</div><div style={{fontSize:13,color:"var(--w5)"}}>{r.b}</div></div></div></div>)}</Cd>
      <div style={{marginBottom:32}}><h2 style={{fontSize:17,fontWeight:800,marginBottom:10}}>About</h2><p style={{fontSize:15,color:"var(--w7)",lineHeight:1.7}}>{ev.desc}</p></div>
      <div style={{marginBottom:32}}><h2 style={{fontSize:17,fontWeight:800,marginBottom:16}}>Who's coming ({ev.ppl.length})</h2><div style={{display:"grid",gap:10}}>{ev.ppl.map(p=><Cd key={p.id} hover={false} style={{padding:16}}><div style={{display:"flex",gap:14}}><div style={{width:46,height:46,borderRadius:"50%",background:TI[p.t].bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{p.a}</div><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}><span style={{fontWeight:800,fontSize:15}}>{p.n}</span><Bdg t={p.t} sch={p.sch} nat={p.nat}/></div><p style={{fontSize:13,color:"var(--w5)",marginBottom:6}}>{p.bio}</p><span style={{fontSize:12,color:"var(--blu)",cursor:"pointer"}}>{p.s==="instagram"?"📸":"💼"} {p.s}</span></div></div></Cd>)}</div></div>
    </div>
    <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"16px 24px 20px",background:"rgba(26,16,51,.9)",backdropFilter:"blur(24px)",borderTop:"1px solid var(--w1)",display:"flex",justifyContent:"center"}}><div style={{maxWidth:700,width:"100%",display:"flex",gap:12,alignItems:"center"}}>
      <div style={{flex:1}}><div style={{fontWeight:800,fontSize:16}}>₩{ev.fee.toLocaleString()}</div><div style={{fontSize:12,color:"var(--w5)"}}>{ev.cap-ev.ppl.length} left</div></div>
      {rsvp===2?<div style={{padding:"14px 32px",borderRadius:R,background:"var(--grn-bg)",color:"var(--grn)",fontWeight:800}}>✓ You're in!</div>:rsvp===1?<div style={{flex:2,textAlign:"center"}}><div style={{fontSize:13,color:"var(--w5)",marginBottom:8}}>Send ₩{ev.fee.toLocaleString()} via Toss</div><Btn v="accent" full onClick={()=>setR(2)}>I've sent it ✓</Btn></div>:<Btn v="accent" onClick={()=>{if(!li){go("signup");return}setR(1)}} style={{padding:"16px 36px",fontSize:16}}>RSVP</Btn>}
    </div></div>
  </div></div>}

// SPOTS
function SpotsP({go}){const[cat,setCat]=useState("all");const list=cat==="all"?SPOTS:SPOTS.filter(s=>s.cat===cat);
  return <div className="pb"><div style={{maxWidth:700,margin:"0 auto",padding:"40px 24px 80px"}}>
    <h1 style={{fontSize:32,fontWeight:900,letterSpacing:-1,marginBottom:6}}>Places</h1>
    <p style={{fontSize:16,color:"var(--w5)",marginBottom:20}}>Discovered by foreigners. Shared for everyone.</p>
    <div style={{display:"flex",gap:8,marginBottom:24,overflowX:"auto",paddingBottom:4}}>{SCATS.map(c=><Pill key={c.k} c={c} active={cat===c.k} onClick={()=>setCat(c.k)}/>)}</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>{list.map(s=><SpotCard key={s.id} spot={s} onClick={()=>go(`place-${s.id}`)}/>)}</div>
  </div></div>}

function SpotDetail({id,go,li}){const spot=SPOTS.find(s=>s.id===id);const[showAdd,setShowAdd]=useState(false);if(!spot)return null;
  return <div className="pb"><div style={{maxWidth:700,margin:"0 auto",padding:"24px 24px 80px"}}>
    <button onClick={()=>go("places")} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"var(--w5)",fontFamily:"'Plus Jakarta Sans'",marginBottom:20}}>← Back to Places</button>
    <div className="fu">
      <div style={{height:180,borderRadius:"var(--rd)",background:spot.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:64,marginBottom:24,position:"relative",overflow:"hidden"}}>
        {spot.emoji}
        <div style={{position:"absolute",bottom:12,right:12,padding:"6px 14px",borderRadius:R,background:"rgba(0,0,0,.4)",backdropFilter:"blur(4px)",fontSize:13,fontWeight:700}}>📸 {spot.photos.length} photos</div>
      </div>
      <h1 style={{fontSize:28,fontWeight:900,letterSpacing:-.5,marginBottom:6}}>{spot.name}</h1>
      <div style={{fontSize:14,color:"var(--w5)",marginBottom:12}}>📍 {spot.area}</div>
      <p style={{fontSize:15,color:"var(--w7)",lineHeight:1.7,marginBottom:28}}>{spot.desc}</p>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:900}}>Photos ({spot.photos.length})</h2>
        <Btn v="accent" onClick={()=>{if(!li){go("signup");return}setShowAdd(true)}} style={{padding:"10px 20px",fontSize:13}}>+ Add photo</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
        {spot.photos.map(photo=><PhotoCard key={photo.id} photo={photo}/>)}
      </div>
    </div>

    {showAdd&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false)}}>
      <div className="si" style={{background:"var(--dk)",borderRadius:"var(--rdl) var(--rdl) 0 0",border:"1px solid var(--cb)",padding:28,width:"100%",maxWidth:600}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h2 style={{fontSize:22,fontWeight:900}}>Add a photo</h2><button onClick={()=>setShowAdd(false)} style={{background:"none",border:"none",fontSize:24,cursor:"pointer",color:"var(--w5)"}}>×</button></div>
        <div style={{display:"grid",gap:16}}>
          <div style={{height:160,borderRadius:"var(--rd)",background:"var(--cd)",border:"2px dashed var(--cb)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:8}}><span style={{fontSize:36}}>📸</span><span style={{fontSize:14,color:"var(--w5)",fontWeight:600}}>Tap to upload photo</span></div>
          <div><label style={{fontSize:13,fontWeight:700,marginBottom:6,display:"block",color:"var(--w7)"}}>Caption</label><input placeholder="What's the story behind this photo?"/></div>
          <Btn v="accent" full onClick={()=>setShowAdd(false)}>Post photo</Btn>
        </div>
      </div>
    </div>}
  </div></div>}

// Q&A
function QCd({q,go,compact}){const cc=q.cat==="visa"?["var(--blu)","var(--blu-bg)"]:q.cat==="food"?["var(--g1)","rgba(255,107,53,.15)"]:["var(--yel)","var(--yel-bg)"];const ci=CATS.find(c=>c.k===q.cat);
  return <Cd onClick={go} style={{padding:compact?16:20}}><div style={{display:"flex",gap:14}}>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",minWidth:44,padding:"4px 0"}}><span style={{fontSize:20,fontWeight:900,color:q.votes>10?"var(--g2)":"var(--w)"}}>{q.votes}</span><span style={{fontSize:10,color:"var(--w5)",fontWeight:700,textTransform:"uppercase"}}>votes</span></div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>{q.solved&&<span style={{padding:"2px 8px",borderRadius:R,background:"var(--grn-bg)",color:"var(--grn)",fontSize:10,fontWeight:800}}>✓ SOLVED</span>}<span style={{padding:"2px 8px",borderRadius:R,background:cc[1],color:cc[0],fontSize:10,fontWeight:800}}>{ci?.i} {ci?.l}</span></div>
      <h3 style={{fontSize:compact?14:16,fontWeight:800,marginBottom:6,lineHeight:1.4}}>{q.title}</h3>
      {!compact&&<p style={{fontSize:13,color:"var(--w5)",lineHeight:1.5,marginBottom:10,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{q.body}</p>}
      <div style={{display:"flex",alignItems:"center",gap:12,fontSize:12,color:"var(--w5)"}}><span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:18,height:18,borderRadius:"50%",background:TI[q.au.t].bg,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10}}>{q.au.a}</span>{q.au.n}</span><span>💬 {q.ac}</span><span>👁 {q.views}</span><span>{q.time}</span></div>
    </div>
  </div></Cd>}

function CommunityP({go,li}){const[cat,setCat]=useState("all");const[ask,setAsk]=useState(false);const list=cat==="all"?QS:QS.filter(q=>q.cat===cat);
  return <div className="pb"><div style={{maxWidth:700,margin:"0 auto",padding:"40px 24px 80px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><div><h1 style={{fontSize:32,fontWeight:900,letterSpacing:-1}}>Asks</h1><p style={{fontSize:16,color:"var(--w5)",marginTop:4}}>Ask anything about life in Korea.</p></div><Btn v="accent" onClick={()=>{if(!li){go("signup");return}setAsk(true)}} style={{marginTop:4,padding:"10px 20px",fontSize:14}}>Ask</Btn></div>
    <div style={{display:"flex",gap:8,marginTop:20,marginBottom:24,overflowX:"auto",paddingBottom:4}}>{CATS.map(c=><Pill key={c.k} c={c} active={cat===c.k} onClick={()=>setCat(c.k)}/>)}</div>
    <div style={{display:"grid",gap:10}}>{list.map(q=><QCd key={q.id} q={q} go={()=>go(`question-${q.id}`)}/>)}</div>
    {ask&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)setAsk(false)}}>
      <div className="si" style={{background:"var(--dk)",borderRadius:"var(--rdl) var(--rdl) 0 0",border:"1px solid var(--cb)",padding:28,width:"100%",maxWidth:600,maxHeight:"80vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h2 style={{fontSize:22,fontWeight:900}}>Ask a question</h2><button onClick={()=>setAsk(false)} style={{background:"none",border:"none",fontSize:24,cursor:"pointer",color:"var(--w5)"}}>×</button></div>
        <div style={{display:"grid",gap:16}}>
          <div><label style={{fontSize:13,fontWeight:700,marginBottom:8,display:"block",color:"var(--w7)"}}>Category</label><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{CATS.filter(c=>c.k!=="all").map(c=><Pill key={c.k} c={c} active={false} onClick={()=>{}}/>)}</div></div>
          <div><label style={{fontSize:13,fontWeight:700,marginBottom:6,display:"block",color:"var(--w7)"}}>Title</label><input placeholder="e.g. How do I renew my E-2 visa?"/></div>
          <div><label style={{fontSize:13,fontWeight:700,marginBottom:6,display:"block",color:"var(--w7)"}}>Details</label><textarea placeholder="Share more context..." rows={4} style={{resize:"vertical"}}/></div>
          <Btn v="accent" full onClick={()=>setAsk(false)}>Post question</Btn>
        </div>
      </div>
    </div>}
  </div></div>}

function QDetailP({qid,go,li}){const q=QS.find(x=>x.id===qid);const[votes,setV]=useState({});if(!q)return null;const tog=(t,id)=>{const k=`${t}-${id}`;setV(p=>({...p,[k]:!p[k]}))};
  const cc=q.cat==="visa"?["var(--blu)","var(--blu-bg)"]:q.cat==="food"?["var(--g1)","rgba(255,107,53,.15)"]:["var(--yel)","var(--yel-bg)"];const ci=CATS.find(c=>c.k===q.cat);
  return <div className="pb"><div style={{maxWidth:700,margin:"0 auto",padding:"24px 24px 80px"}}>
    <button onClick={()=>go("community")} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"var(--w5)",fontFamily:"'Plus Jakarta Sans'",marginBottom:20}}>← Back to Asks</button>
    <div className="fu">
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>{q.solved&&<span style={{padding:"3px 10px",borderRadius:R,background:"var(--grn-bg)",color:"var(--grn)",fontSize:12,fontWeight:800}}>✓ SOLVED</span>}<span style={{padding:"3px 10px",borderRadius:R,background:cc[1],color:cc[0],fontSize:12,fontWeight:800}}>{ci?.i} {ci?.l}</span></div>
      <h1 style={{fontSize:26,fontWeight:900,lineHeight:1.3,marginBottom:20}}>{q.title}</h1>
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:20}}><div style={{width:38,height:38,borderRadius:"50%",background:TI[q.au.t].bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{q.au.a}</div><div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontWeight:800,fontSize:15}}>{q.au.n}</span><Bdg t={q.au.t} nat={q.au.nat}/></div><span style={{fontSize:12,color:"var(--w5)"}}>{q.time}</span></div></div>
      <p style={{fontSize:15,color:"var(--w7)",lineHeight:1.8,marginBottom:20}}>{q.body}</p>
      <div style={{display:"flex",alignItems:"center",gap:16,paddingTop:16,borderTop:"1px solid var(--w1)"}}>
        <button onClick={()=>tog("q",q.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:R,border:"1.5px solid",borderColor:votes[`q-${q.id}`]?"var(--g2)":"var(--cb)",background:votes[`q-${q.id}`]?"rgba(232,67,147,.15)":"var(--cd)",color:votes[`q-${q.id}`]?"var(--g2)":"var(--w7)",cursor:"pointer",fontFamily:"'Plus Jakarta Sans'",fontSize:14,fontWeight:800}}>▲ {q.votes+(votes[`q-${q.id}`]?1:0)}</button>
        <span style={{fontSize:13,color:"var(--w5)"}}>👁 {q.views}</span>
      </div>

      <h2 style={{fontSize:20,fontWeight:900,marginTop:40,marginBottom:20}}>{q.answers.length} {q.answers.length===1?"Answer":"Answers"}</h2>
      <div style={{display:"grid",gap:14}}>{q.answers.map(a=><Cd key={a.id} hover={false} style={{borderColor:a.ok?"var(--grn)":"var(--cb)",background:a.ok?"rgba(0,184,148,.08)":"var(--cd)"}}>
        {a.ok&&<div style={{fontSize:13,fontWeight:800,color:"var(--grn)",marginBottom:12}}>✓ Accepted</div>}
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}><div style={{width:32,height:32,borderRadius:"50%",background:TI[a.au.t].bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{a.au.a}</div><div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontWeight:800,fontSize:14}}>{a.au.n}</span><Bdg t={a.au.t} sch={a.au.sch} nat={a.au.nat}/></div><span style={{fontSize:12,color:"var(--w5)"}}>{a.time}</span></div></div>
        <p style={{fontSize:14,color:"var(--w7)",lineHeight:1.7}}>{a.body}</p>
        <div style={{marginTop:12}}><button onClick={()=>tog("a",a.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:R,border:"1.5px solid",borderColor:votes[`a-${a.id}`]?"var(--g2)":"var(--cb)",background:votes[`a-${a.id}`]?"rgba(232,67,147,.15)":"transparent",color:votes[`a-${a.id}`]?"var(--g2)":"var(--w5)",cursor:"pointer",fontFamily:"'Plus Jakarta Sans'",fontSize:12,fontWeight:800}}>▲ {a.votes+(votes[`a-${a.id}`]?1:0)}</button></div>
      </Cd>)}</div>

      <Cd hover={false} style={{marginTop:24}}><h3 style={{fontSize:16,fontWeight:800,marginBottom:12}}>Your Answer</h3>
        {li?<div><textarea placeholder="Share your experience..." rows={3} style={{marginBottom:12,resize:"vertical"}}/><Btn v="accent">Post answer</Btn></div>
        :<div style={{textAlign:"center",padding:12}}><p style={{fontSize:14,color:"var(--w5)",marginBottom:12}}>Join chatda to answer</p><Btn v="accent" onClick={()=>go("signup")}>Join chatda</Btn></div>}
      </Cd>
    </div>
  </div></div>}

// SIGNUP
function SignupP({go,setLi}){const[step,setStep]=useState(0);const[trk,setTrk]=useState(null);
  const W=ch=><div className="pb"><div style={{maxWidth:440,margin:"0 auto",padding:step===0?"80px 24px":"48px 24px"}}><div className="fu">{ch}</div></div></div>;
  if(step===0)return W(<div style={{textAlign:"center"}}>
    <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,var(--g1),var(--g2))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 20px"}}>🇰🇷</div>
    <h1 style={{fontSize:32,fontWeight:900,marginBottom:8}}>Join chatda</h1><p style={{fontSize:16,color:"var(--w5)",marginBottom:36}}>Find your people in Korea</p>
    <Btn full onClick={()=>setStep(1)} style={{background:"var(--w)",color:"var(--dk)",marginBottom:12}}><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>Continue with Google</Btn>
    <div style={{margin:"16px 0",fontSize:13,color:"var(--w5)"}}>or</div><input type="email" placeholder="Email address" style={{marginBottom:12}}/><Btn v="glass" full onClick={()=>setStep(1)}>Continue</Btn>
    <p style={{fontSize:12,color:"var(--w5)",marginTop:20}}>By continuing, you agree to our Terms & Guidelines</p>
  </div>);
  if(step===1)return W(<><div style={{fontSize:13,color:"var(--w5)",marginBottom:8}}>Step 1 of 4</div><h1 style={{fontSize:28,fontWeight:900,marginBottom:8}}>I am a...</h1><p style={{fontSize:14,color:"var(--w5)",marginBottom:28}}>Your status in Korea, not nationality.</p>
    <div style={{display:"grid",gap:12}}>{[{t:"Student",d:"Studying at a Korean university",s:".edu or .ac.kr email"},{t:"Traveler",d:"Visiting or staying",s:"No extra verification"},{t:"Local",d:"Living in Korea",s:"Korean phone (010)"}].map(x=>{const info=TI[x.t];const sel=trk===x.t;return <div key={x.t} onClick={()=>setTrk(x.t)} style={{padding:20,borderRadius:"var(--rd)",border:`2px solid ${sel?info.c:"var(--cb)"}`,background:sel?info.bg:"var(--cd)",cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><span style={{fontSize:26}}>{info.i}</span><span style={{fontWeight:900,fontSize:18}}>{x.t}</span></div><p style={{fontSize:14,color:"var(--w7)",marginBottom:2}}>{x.d}</p><p style={{fontSize:12,color:"var(--w5)"}}>{x.s}</p></div>})}</div>
    <Btn v="accent" full style={{marginTop:24}} onClick={()=>{if(trk)setStep(2)}}>Continue</Btn></>);
  if(step===2)return W(<><div style={{fontSize:13,color:"var(--w5)",marginBottom:8}}>Step 2 of 4</div><h1 style={{fontSize:28,fontWeight:900,marginBottom:24}}>{trk==="Student"?"University email":trk==="Local"?"Korean phone":"You're good!"}</h1>
    {trk==="Student"&&<div><input type="email" placeholder="name@university.ac.kr" style={{marginBottom:12}}/><Btn v="accent" full onClick={()=>setStep(3)}>Send code</Btn></div>}
    {trk==="Local"&&<div><div style={{display:"flex",gap:8,marginBottom:12}}><div style={{padding:"14px 16px",borderRadius:12,background:"var(--cd)",border:"1.5px solid var(--cb)",color:"var(--w5)"}}>+82</div><input type="tel" placeholder="010-0000-0000"/></div><Btn v="accent" full onClick={()=>setStep(3)}>Send SMS</Btn></div>}
    {trk==="Traveler"&&<div><Cd hover={false} style={{textAlign:"center",padding:28,marginBottom:20}}><span style={{fontSize:40}}>✈️</span><p style={{fontSize:16,fontWeight:800,color:"var(--pur)",marginTop:8}}>No extra verification!</p></Cd><Btn v="accent" full onClick={()=>setStep(3)}>Continue</Btn></div>}</>);
  if(step===3)return W(<><div style={{fontSize:13,color:"var(--w5)",marginBottom:8}}>Step 3 of 4</div><h1 style={{fontSize:28,fontWeight:900,marginBottom:8}}>Link social media</h1><p style={{fontSize:14,color:"var(--w5)",marginBottom:24}}>At least 1. This is how people know you're real.</p>
    <div style={{display:"grid",gap:14}}>{[{p:"Instagram",i:"📸",h:"instagram.com/username"},{p:"LinkedIn",i:"💼",h:"linkedin.com/in/username"},{p:"X",i:"𝕏",h:"x.com/username"},{p:"TikTok",i:"🎵",h:"tiktok.com/@username"}].map(x=><div key={x.p}><label style={{fontSize:13,fontWeight:700,marginBottom:6,display:"flex",alignItems:"center",gap:6,color:"var(--w7)"}}>{x.i} {x.p}</label><input placeholder={x.h}/></div>)}</div>
    <p style={{fontSize:12,color:"var(--w5)",marginTop:12}}>6+ months, 5+ posts, 10+ followers.</p><Btn v="accent" full style={{marginTop:24}} onClick={()=>setStep(4)}>Continue</Btn></>);
  if(step===4)return W(<><div style={{fontSize:13,color:"var(--w5)",marginBottom:8}}>Step 4 of 4</div><h1 style={{fontSize:28,fontWeight:900,marginBottom:24}}>Almost there!</h1>
    <div style={{display:"grid",gap:16}}>
      <div><label style={{fontSize:13,fontWeight:700,marginBottom:6,display:"block",color:"var(--w7)"}}>Display name</label><input placeholder="Your name"/></div>
      <div><label style={{fontSize:13,fontWeight:700,marginBottom:6,display:"block",color:"var(--w7)"}}>Nationality</label><select><option>Select</option>{["American","British","Canadian","Chinese","French","German","Italian","Japanese","Korean","Vietnamese","Other"].map(n=><option key={n}>{n}</option>)}</select></div>
      <div><label style={{fontSize:13,fontWeight:700,marginBottom:6,display:"block",color:"var(--w7)"}}>Short bio</label><input placeholder="e.g. Architect in Seoul, love spicy food" maxLength={100}/></div>
      <div><label style={{fontSize:13,fontWeight:700,marginBottom:8,display:"block",color:"var(--w7)"}}>Interests</label><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{["Food","Startup","Tech","Design","Travel","Language","Culture","Sports","Music","Nightlife"].map(t=><label key={t} style={{padding:"8px 16px",borderRadius:R,border:"1.5px solid var(--cb)",background:"var(--cd)",fontSize:13,fontWeight:600,cursor:"pointer",color:"var(--w7)"}}><input type="checkbox" style={{display:"none"}}/>{t}</label>)}</div></div>
    </div><Btn v="accent" full style={{marginTop:28}} onClick={()=>{setStep(5);setLi(true)}}>Create my profile</Btn></>);
  return W(<div style={{textAlign:"center",paddingTop:40}} className="si"><div style={{fontSize:64,marginBottom:16}}>🎉</div><h1 style={{fontSize:32,fontWeight:900,marginBottom:8}}>Welcome!</h1><p style={{fontSize:16,color:"var(--w5)",marginBottom:36}}>Start exploring. Start sharing. Start hosting.</p><div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}><Btn onClick={()=>go("meetups")}>Browse meetups</Btn><Btn v="outline" onClick={()=>go("places")}>Explore places</Btn></div></div>)}

function ProfileP({go,setLi}){return <div className="pb"><div style={{maxWidth:500,margin:"0 auto",padding:"40px 24px 80px"}}><div className="fu" style={{textAlign:"center",marginBottom:32}}>
  <div style={{width:88,height:88,borderRadius:"50%",background:"linear-gradient(135deg,var(--g1),var(--g2))",margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,border:"3px solid var(--w2)"}}>🇮🇹</div>
  <h1 style={{fontSize:26,fontWeight:900}}>Sarah</h1><div style={{marginTop:8}}><Bdg t="Local" nat="Italian"/></div><p style={{fontSize:14,color:"var(--w5)",marginTop:12}}>Architect in Apgujeong, looking for foodie friends</p>
  <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:12,flexWrap:"wrap"}}>{["Food","Design","Travel"].map(t=><span key={t} style={{padding:"4px 12px",borderRadius:R,background:"var(--cd)",border:"1px solid var(--cb)",fontSize:12,fontWeight:600}}>{t}</span>)}</div>
</div><div style={{display:"grid",gap:14}}>
  <Cd hover={false}><h3 style={{fontSize:14,fontWeight:800,marginBottom:12}}>Social Media</h3><div style={{display:"flex",alignItems:"center",gap:8}}><span>📸</span><span style={{fontSize:14,color:"var(--blu)"}}>instagram.com/sarah_in_seoul</span></div></Cd>
  <Cd hover={false}><h3 style={{fontSize:14,fontWeight:800,marginBottom:12}}>Activity</h3><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>{[["0","Meetups"],["0","Places"],["0","Questions"],["0","Answers"]].map(([n,l])=><div key={l} style={{textAlign:"center",padding:12,background:"var(--w05)",borderRadius:12}}><div style={{fontSize:22,fontWeight:900}}>{n}</div><div style={{fontSize:10,color:"var(--w5)",fontWeight:600}}>{l}</div></div>)}</div></Cd>
</div><div style={{display:"grid",gap:10,marginTop:24}}><Btn v="glass" full>Edit Profile</Btn><Btn v="ghost" full onClick={()=>{setLi(false);go("landing")}} style={{color:"var(--w5)"}}>Sign Out</Btn></div></div></div>}

export default function App(){const[pg,go]=useState("landing");const[li,setLi]=useState(false);
  useEffect(()=>{window.scrollTo(0,0)},[pg]);
  const r=()=>{
    if(pg==="landing")return <Landing go={go}/>;
    if(pg==="meetups")return <EventsP go={go}/>;
    if(pg.startsWith("meetup-"))return <EvDetail id={parseInt(pg.split("-")[1])} go={go} li={li}/>;
    if(pg==="places")return <SpotsP go={go}/>;
    if(pg.startsWith("place-"))return <SpotDetail id={parseInt(pg.split("-")[1])} go={go} li={li}/>;
    if(pg==="community")return <CommunityP go={go} li={li}/>;
    if(pg.startsWith("question-"))return <QDetailP qid={parseInt(pg.split("-")[1])} go={go} li={li}/>;
    if(pg==="signup")return <SignupP go={go} setLi={setLi}/>;
    if(pg==="profile")return <ProfileP go={go} setLi={setLi}/>;
    return <Landing go={go}/>;};
  return <><style>{CSS}</style><div style={{minHeight:"100vh",background:"var(--dk)"}}><Nav pg={pg} go={go} li={li}/>{r()}</div></>;}