"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const AM_CSS = `
:root{
  --am-crema:#F3EED7; --am-oliva:#808249; --am-verde-noche:#1E2113;
  --am-salvia-palida:#DFD6A4; --am-rosa-empolvado:#E1B4A1; --am-malva:#A15D66; --am-vino-profundo:#4A1D2B;
  --am-verde-cala:#B9C287; --am-ocre:#9A8B4F; --am-salvia-foto:#A9AE8F; --am-dorado-aceituna:#C39B45;
  --am-sepia:#4A4232; --am-dorado-viejo:#B8964A;
  --am-bg:var(--am-crema); --am-text:var(--am-malva);
  --am-script-formal:'Monsieur La Doulaise',cursive;
  --am-script-alt:'Pinyon Script',cursive;
  --am-display:'Vogue','Bodoni Moda',serif;
  --am-label:'Marcellus SC',serif;
  --am-body:'EB Garamond',serif;
  --am-noct-script:'Mr Dafoe','Norican',cursive;
  --ease-out:cubic-bezier(.23,1,.32,1);
  --ease:var(--ease-out);
}
@font-face{font-family:'Handflair'; src:url('/am/fonts/Handflair.ttf') format('truetype'); font-weight:400; font-style:normal; font-display:swap;}
@font-face{font-family:'Vogue'; src:url('/am/fonts/Vogue.ttf') format('truetype'); font-display:swap;}
@font-face{font-family:'Mr Dafoe'; src:url('/am/fonts/MrDafoe-Regular.ttf') format('truetype'); font-display:swap;}
.am-root{margin:0; background:var(--am-crema); font-family:var(--am-body); font-style:italic; color:var(--am-text); -webkit-font-smoothing:antialiased; min-height:100svh;}
.am-root *{box-sizing:border-box;}
.inv{position:relative;}
.sec{display:none; position:relative; min-height:100svh; overflow:hidden;
  padding:64px 26px 128px; flex-direction:column; align-items:center; justify-content:center; text-align:center;}
.sec.on{display:flex; animation:secIn 260ms var(--ease-out) both;}
@keyframes secIn{from{opacity:0; transform:translateY(8px);} to{opacity:1; transform:none;}}
.sec > *{position:relative; z-index:3;}
.bg{position:absolute; inset:-8% -4%; z-index:0; background-position:center; background-size:cover; background-repeat:no-repeat;}
.bg.tex{inset:0;}
.grain{position:absolute; inset:0; z-index:2; pointer-events:none; opacity:.28;
  background:url('/am/grain.png') top left/220px 220px repeat; mix-blend-mode:multiply;}
.wrap{position:relative; z-index:3; width:100%; max-width:760px; display:flex; flex-direction:column; align-items:center;}
.wrap.narrow{max-width:430px;}
.gifts::after{content:""; position:absolute; inset:0; z-index:1; pointer-events:none;
  background:linear-gradient(180deg, rgba(243,238,215,.5), rgba(243,238,215,.22) 40%, rgba(243,238,215,.55));}
.rsvp{background-color:var(--am-verde-noche);
  background-image:radial-gradient(92% 72% at 50% 42%, rgba(30,33,19,.18), rgba(30,33,19,.88) 80%), url('/am/grain.png'), url('/am/mat/noct-cala.png');
  background-size:auto, 220px 220px, cover;
  background-position:center, top left, center;
  background-repeat:no-repeat, repeat, no-repeat;
  padding:96px 26px 110px; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch;}
.script{font-family:var(--am-script-formal); font-size:clamp(28px,7.4vw,42px); line-height:1; margin:0; color:var(--am-malva); font-style:normal;}
.label{font-family:var(--am-label); font-style:normal; font-size:11px; letter-spacing:.25em; text-transform:uppercase; color:var(--am-malva); margin:0;}
.label.lt{color:var(--am-verde-cala);}
.vg{font-family:var(--am-display); font-weight:400; letter-spacing:.08em; text-transform:uppercase; font-style:normal; color:var(--am-malva);}
.lock{margin:6px 0 0; display:flex; flex-direction:column; align-items:center; width:100%;}
.lock .script.over{margin-bottom:-.3em; color:var(--am-malva);}
.lock-main{font-size:clamp(26px,6.6vw,46px); line-height:1.1; color:var(--am-vino-profundo); text-wrap:balance;}
.body{font-family:var(--am-body); font-style:italic; font-size:15px; line-height:1.8; margin:14px 0 0; color:var(--am-malva); text-wrap:pretty;}
.body.sm{font-size:14px; line-height:1.7;}
.body.lt{color:rgba(243,238,215,.9);}
.shead{display:flex; flex-direction:column; align-items:center; gap:8px; margin-bottom:36px;}
.vcard .ic.sm{width:auto; height:80px; object-fit:contain; opacity:.92; mix-blend-mode:multiply; filter:drop-shadow(0 2px 1px rgba(94,30,46,.16));}

/* PORTADA */
.cover{background:var(--am-vino-profundo); padding:0; justify-content:flex-end;}
.vsheen{position:absolute; inset:0; z-index:1; pointer-events:none;
  background:
    radial-gradient(58% 44% at 50% 32%, rgba(255,228,238,.13), transparent 72%),
    radial-gradient(100% 74% at 50% 106%, rgba(16,4,8,.66), transparent 60%),
    radial-gradient(96% 58% at 50% -8%, rgba(16,4,8,.5), transparent 58%);}
.cover .grain{opacity:.22;}
.cov-in{position:relative; z-index:3; display:flex; flex-direction:column; align-items:center; width:100%; max-width:600px;}
.cov-in.hero{min-height:100svh; padding:4.5vh 4vw max(6vh,86px); align-items:stretch; max-width:none; display:flex; flex-direction:column; justify-content:space-between; gap:4vh;}
.par-credits{display:flex; justify-content:space-between; gap:20px; margin:0;}
.pc-col{display:flex; flex-direction:column; font-family:'Marcellus SC',var(--am-label),serif; font-style:normal; font-size:11px; text-transform:uppercase; letter-spacing:.15em; line-height:2; color:#F3EED7;}
.pc-l{text-align:left;}
.pc-r{text-align:right;}
.hero-mid{display:flex; flex-direction:column; justify-content:center; flex:1;}
.bless{margin:0 0 max(8vh,54px); text-align:center; font-family:'Marcellus',var(--am-label),serif; font-style:normal; font-size:13px; text-transform:uppercase; letter-spacing:.15em; line-height:1.6; color:rgba(243,238,215,.8); white-space:nowrap;}
.hero-names{margin:0; text-align:center; white-space:nowrap; font-family:'Monsieur La Doulaise',var(--am-script-formal),cursive; font-weight:400; font-style:normal; font-size:13.2vw; line-height:1.05; color:#F3EED7; text-shadow:0 1px 0 rgba(255,255,255,.32), 0 -1px 1px rgba(16,4,8,.55), 0 3px 5px rgba(16,4,8,.5), 0 2px 18px rgba(16,4,8,.45);}
.hero-names .amp{font-size:.44em;}
.hero-date{display:flex; align-items:center; gap:18px; margin:2.5vh 0 3vh;}
.foil-mono{width:min(60vw,28svh,300px); aspect-ratio:1/1; margin:0 0 clamp(6px,1.4svh,14px); flex:none;
  -webkit-mask:url('/am/logo/mono-dorado.png') center/contain no-repeat;
  mask:url('/am/logo/mono-dorado.png') center/contain no-repeat;
  background:linear-gradient(102deg, #7C5B26 0%, #A6842F 15%, #E8D69C 33%, #FFF6DA 43%, #E0C878 54%, #B8964A 68%, #8A6A2F 84%, #6E5220 100%);
  background-size:260% 100%;
  animation:foil 8s ease-in-out infinite alternate;
  filter:drop-shadow(0 4px 18px rgba(0,0,0,.5));}
.foil-mono.hero-mono{width:112px; height:112px; margin:-22px auto -22px; align-self:center; flex:none;}
@keyframes foil{from{background-position:0% 0;} to{background-position:100% 0;}}
.hero-date .hd-rule{flex:1; height:1px; background:rgba(243,238,215,.45);}
.hero-date .hd-txt{font-family:'Marcellus SC',var(--am-label),serif; font-style:normal; font-size:11px; text-transform:uppercase; letter-spacing:.15em; color:#DFD6A4; white-space:nowrap;}
@media (max-width:400px){.bless{font-size:10px; letter-spacing:.1em;} .pc-col{font-size:10px;}}
@media (max-width:340px){.bless{font-size:9px; letter-spacing:.07em;}}
@media (max-width:760px){.hero-names{font-size:18vw; line-height:1.12;} .hero-names .hn-a,.hero-names .hn-b{display:block;}}

/* DETALLES */
.details{background-image:linear-gradient(180deg, rgba(243,238,215,.5), rgba(243,238,215,.22) 40%, rgba(243,238,215,.55)), url('/am/grain.png'), url('/am/tex/papel-peonias.jpg');
  background-size:auto, 220px 220px, cover; background-position:center, top left, center; background-repeat:no-repeat, repeat, no-repeat;
  justify-content:flex-start; padding-top:116px; padding-bottom:110px; height:100svh; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch;}
.sec-tag{position:absolute; top:18px; right:20px; z-index:4; margin:0; display:flex; align-items:center; gap:8px;
  font-family:'Marcellus',var(--am-label),serif; font-style:normal; font-size:9px; letter-spacing:.22em;
  text-transform:uppercase; color:var(--am-oliva); opacity:.75;}
.sec-tag::before{content:""; width:16px; height:1px; background:currentColor; opacity:.6;}
.details .shead.dhead{align-items:center; text-align:center; width:100%; max-width:none; margin-bottom:40px; gap:0;}
.details .lock,.dress .lock{margin:0; gap:2px;}
.lock.lock-mid{align-items:center; text-align:center;}
.details .lock .lock-main.dl{font-family:'Monsieur La Doulaise',var(--am-script-formal),cursive; align-self:center; font-weight:600; font-size:clamp(72px,17vw,116px); letter-spacing:.01em; text-transform:none; line-height:1.05;
  text-shadow:0 1px 0 rgba(255,255,255,.55), 0 2px 3px rgba(94,30,46,.16);}
.dress .lock .lock-main.hf{font-family:'Handflair',var(--am-script-formal),cursive; font-size:58px; font-weight:500; letter-spacing:normal; text-transform:none; line-height:1.5; text-align:center; color:var(--am-crema);}
.dress-detail{margin:0; text-align:center; font-family:'Marcellus SC',var(--am-label),serif; font-style:normal; font-size:11px; letter-spacing:.28em; text-transform:uppercase; line-height:2; color:rgba(251,248,238,.85);}
.details .lock .script.over,.dress .lock .script.over{margin-bottom:0; font-family:'Instrument Serif',serif; font-style:italic; font-weight:500; align-self:center;
  text-shadow:0 1px 0 rgba(255,255,255,.5), 0 1px 2px rgba(94,30,46,.14);
  font-size:clamp(22px,5vw,32px); letter-spacing:.01em; line-height:1.1;}
.dress .lock{align-items:center; text-align:center;}
.timeline{list-style:none; margin:0 0 44px; padding:26px 30px; width:max-content; max-width:100%; display:grid; grid-template-columns:auto 26px auto; align-items:center; row-gap:14px;
  background-color:rgba(251,248,238,.9); background-image:url('/am/grain.png'); background-size:96px 96px; background-blend-mode:multiply; backdrop-filter:blur(3px);
  box-shadow:inset 1px 1px 0 rgba(255,255,255,.5), inset -1px -1px 0 rgba(94,30,46,.1), 0 14px 30px -26px rgba(74,66,50,.5);}
.details .timeline{align-self:center;}
.timeline li{display:contents;}
.timeline .t{font-family:'Vogue',var(--am-label),serif; font-style:normal; font-size:21px; letter-spacing:.06em; line-height:1.35; white-space:nowrap;
  color:var(--am-oliva); text-align:right; padding-right:2px; font-variant-numeric:tabular-nums;}
.timeline .pt{position:relative; justify-self:center; width:7px; height:7px; border-radius:50%;
  background:var(--am-oliva); align-self:center;}
.timeline .pt::after{content:""; position:absolute; left:50%; top:7px; width:1px; height:32px;
  margin-left:-.5px; background:rgba(128,130,73,.32);}
.timeline li:last-child .pt::after{display:none;}
.timeline .e{font-family:var(--am-body); font-style:italic; font-size:18px; line-height:1.35; text-align:left;
  color:var(--am-vino-profundo); padding-left:4px;}
.btn-cap{display:inline-flex; align-items:center; justify-content:center; gap:6px; border:none; padding:9px 18px 10px; border-radius:0;
  font-family:var(--am-label); font-style:normal; font-size:9.5px; letter-spacing:.18em; text-transform:uppercase; line-height:1;
  background:var(--am-malva); color:var(--am-crema); cursor:pointer; position:relative; overflow:hidden;
  text-decoration:none; isolation:isolate;
  transition:transform 160ms var(--ease-out), background 160ms ease;}
.btn-cap::after{content:""; position:absolute; top:0; left:-80%; width:50%; height:100%; z-index:-1; pointer-events:none;
  background:linear-gradient(100deg, transparent, rgba(255,255,255,.28), transparent); transform:skewX(-18deg);}
.btn-cap:active{color:var(--am-crema); transform:scale(.97);}
@media (hover:hover) and (pointer:fine){
  .btn-cap::after{transition:left 560ms ease;}
  .btn-cap:hover::after{left:130%;}
  .btn-cap:hover{background:var(--am-vino-profundo); color:var(--am-crema);}
}
.venues{display:grid; grid-template-columns:1fr 1fr; gap:16px; width:100%; max-width:620px; align-items:stretch;}
.vcard{position:relative; overflow:hidden; padding:34px 26px 28px; display:flex; flex-direction:column; align-items:center; gap:7px;
  border:none; border-radius:0;
  background-color:rgba(251,248,238,.74);
  background-image:url('/am/grain.png'), radial-gradient(120% 90% at 30% 10%, rgba(255,255,255,.6), transparent 60%);
  background-size:96px 96px, auto; background-blend-mode:multiply, normal;
  backdrop-filter:blur(3px);
  box-shadow:inset 1px 1px 0 rgba(251,248,238,.55), inset -1px -1px 0 rgba(94,30,46,.14), 0 1px 0 rgba(251,248,238,.4), 0 14px 30px -26px rgba(74,66,50,.5);}
.vcard::after{content:""; position:absolute; inset:10px; z-index:1; pointer-events:none;
  box-shadow:inset 1px 1px 1px rgba(94,30,46,.13), inset -1px -1px 0 rgba(251,248,238,.5);}
.vcard .vlabel::after{content:""; display:block; width:34px; height:1px; margin:7px auto 0; background:rgba(161,93,102,.45);}
.vsub{margin:6px 0 0; font-family:'Marcellus',var(--am-label),serif; font-style:normal; font-size:10px; letter-spacing:.2em; text-transform:uppercase; line-height:1.5; text-align:center; color:var(--am-malva);}
.vbg{position:absolute; inset:0; z-index:0; background-size:cover; background-position:center; opacity:.55;}
.vcard > *{position:relative; z-index:1;}
.vtime{display:flex; align-items:baseline; gap:.16em; margin:2px 0 0; line-height:1;}
.vtime .vg{font-size:clamp(30px,7vw,44px); color:var(--am-vino-profundo); letter-spacing:.04em;}
.vtime .vpm{font-size:clamp(13px,3vw,17px); letter-spacing:.16em; color:var(--am-malva);}
.vcard .body{margin-top:2px; font-size:14px;}
.vcard .label.vlabel{font-family:'Pinyon Script',var(--am-script-formal),cursive; font-style:normal; font-size:clamp(28px,6.4vw,36px); letter-spacing:.01em; text-transform:none; line-height:1.34; color:var(--am-vino-profundo); margin:2px 0 0;}
.vcard .btn-cap{margin-top:auto; align-self:center; padding:9px 18px 10px;
  box-shadow:0 2px 0 rgba(94,30,46,.22), 0 8px 16px -10px rgba(74,66,50,.55);}
.vcard .btn-cap:active{box-shadow:0 1px 0 rgba(94,30,46,.28), 0 4px 9px -8px rgba(74,66,50,.5);}
.dress{position:relative; overflow:hidden; width:100%; max-width:620px; margin-top:18px;
  background:var(--am-sepia); box-shadow:0 20px 40px -26px rgba(30,25,14,.7);}
.dress::before{content:""; position:absolute; inset:0; z-index:1; pointer-events:none;
  background:radial-gradient(95% 78% at 50% 42%, rgba(30,25,14,.42), rgba(24,20,12,.86) 84%);}
.dress-in{position:relative; z-index:3; padding:42px 28px 38px; display:flex; flex-direction:column; align-items:center; gap:8px;}
.dress-in .body{max-width:420px;}
.swatches{display:flex; gap:11px; margin-top:22px;}
.swatches span{width:30px; height:30px; border-radius:50%; box-shadow:0 0 0 1px rgba(243,238,215,.45), 0 6px 14px -8px rgba(0,0,0,.6);}

/* REGALOS */
.gifts .bg{inset:-18% -12%; background-size:cover; background-position:center 78%;}
.gifts .shead .lock{position:relative; padding:24px 30px 26px; border-radius:2px;
  background:linear-gradient(150deg, rgba(251,248,238,.4), rgba(251,248,238,.14) 46%, rgba(251,248,238,.3));
  backdrop-filter:blur(9px) saturate(1.12); -webkit-backdrop-filter:blur(9px) saturate(1.12);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.6), inset 0 -1px 0 rgba(94,30,46,.1), 0 18px 40px -30px rgba(74,66,50,.5);}
.gifts .shead .lock .script.over{position:relative; z-index:2; margin-bottom:-.34em; transform:translateX(-.14em);}
.gifts .shead .lock .lock-main{position:relative; z-index:1; font-family:var(--am-display); font-weight:400; letter-spacing:.08em; text-transform:uppercase; font-style:normal;}
.gifts{justify-content:flex-start; padding-top:76px;}
.gcards{display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:18px; width:100%;}
.gcard{display:flex; flex-direction:column; overflow:hidden; text-align:left;
  background:rgba(251,248,238,.9); border:1px solid rgba(161,93,102,.18);
  box-shadow:0 16px 34px -24px rgba(74,66,50,.55);}
.gph{display:block; width:100%; height:150px; background:#EDE7D2; object-fit:cover;}
.gbody{padding:16px 16px 18px; display:flex; flex-direction:column; gap:8px; flex:1;}
.grow{display:flex; align-items:baseline; justify-content:space-between; gap:10px;}
.gname{font-family:var(--am-body); font-style:italic; font-weight:500; font-size:19px; letter-spacing:0;
  text-transform:none; color:var(--am-vino-profundo); margin:0; line-height:1.25;}
.gmeta{font-family:var(--am-label); font-style:normal; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--am-oliva); white-space:nowrap;}
.gbody .body{margin:0; flex:1;}
.bar{height:3px; background:rgba(161,93,102,.16); overflow:hidden;}
.bar i{display:block; height:100%; background:var(--am-malva);}
.gpct, .gsum{font-family:var(--am-label); font-style:normal; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--am-malva);}
.gsum{color:var(--am-oliva);}
.pw{margin-top:34px; font-family:var(--am-label); font-style:normal; font-size:11px; letter-spacing:.1em; color:var(--am-malva); opacity:.75;}
.pw.sec-foot{position:static; margin:38px 0 0; text-align:center;}
.pw .wd{font-family:'Instrument Serif', serif; font-style:italic; font-size:17px; letter-spacing:0;}
.pw .wd i{color:#E84B8A; font-style:normal;}

/* RSVP nocturno */
.rsvp .label.lt{color:var(--am-salvia-foto);}
.rsvp .sec-tag.lt{color:var(--am-salvia-foto); opacity:.6;}
.wrap.night{display:flex; flex-direction:column; align-items:center; justify-content:center; gap:clamp(20px,3.4vh,34px); min-height:100%;}
.nhead{display:flex; flex-direction:column; align-items:center; text-align:center;}
.nrule{width:1px; height:clamp(34px,7vh,62px); background:linear-gradient(180deg, transparent, rgba(169,174,143,.6)); margin-bottom:18px;}
.nsp{margin-bottom:0; position:relative; z-index:2;}
.nsc{font-family:var(--am-noct-script); font-style:normal; font-size:clamp(38px,11.4vw,92px); white-space:nowrap; line-height:1.1; margin:-.16em 0 0; color:var(--am-salvia-foto); padding:0 6px; position:relative; z-index:1;}
.nsc.ink{filter:url(#ink);}
.rcard{position:relative; z-index:3; width:100%; display:flex; flex-direction:column; align-items:center; gap:14px;
  padding:36px 26px 30px; background:linear-gradient(165deg, rgba(169,174,143,.13), rgba(30,33,19,.5) 60%);
  border:1px solid rgba(169,174,143,.22); backdrop-filter:blur(6px) saturate(1.1);
  box-shadow:inset 0 1px 0 rgba(223,214,164,.22), 0 26px 60px -34px rgba(0,0,0,.85);}
.rcard::after{content:""; position:absolute; inset:8px; pointer-events:none; border:1px solid rgba(195,155,69,.16);}
.rlead{margin:0; font-family:var(--am-body); font-style:italic; font-size:17px; line-height:1.45; text-align:center; color:rgba(169,174,143,.9);}
.foil-mono.rseal{width:118px; aspect-ratio:1/1; margin:0 auto 4px; filter:drop-shadow(0 5px 16px rgba(0,0,0,.55)) drop-shadow(0 0 14px rgba(195,155,69,.28));}
.rinput{width:100%; padding:14px 16px; border-radius:0; background:rgba(169,174,143,.08); border:1px solid rgba(169,174,143,.34);
  font-family:var(--am-body); font-style:italic; font-size:16px; color:var(--am-salvia-foto); text-align:center;}
.rinput::placeholder{color:rgba(169,174,143,.55);}
.rinput:focus{outline:none; border-color:var(--am-salvia-foto); background:rgba(169,174,143,.14);}
.nmono{font-family:var(--am-label); font-style:normal; font-weight:400; font-size:9px; letter-spacing:.25em; text-transform:uppercase; margin:10px 0 0; color:var(--am-salvia-foto); text-align:center; line-height:normal;}
.rsvp .pw.sec-foot.lt{margin:0; color:rgba(169,174,143,.75);}
.rsvp .pw.sec-foot.lt .wd{color:var(--am-salvia-foto);}
.rres{width:100%; display:flex; flex-direction:column; gap:8px;}
.rres-item{display:flex; justify-content:space-between; align-items:center; gap:10px; width:100%; text-align:left; cursor:pointer; border-radius:0;
  padding:14px 18px; background:rgba(169,174,143,.08); border:1px solid rgba(169,174,143,.28);
  transition:border-color 200ms ease, background 200ms ease;}
.rres-item:hover{border-color:var(--am-salvia-foto); background:rgba(169,174,143,.14);}
.rres-name{font-family:var(--am-body); font-style:italic; font-size:18px; color:var(--am-salvia-foto); margin:0;}
.rres-sub{font-family:var(--am-label); font-style:normal; font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:rgba(169,174,143,.65); margin:3px 0 0;}
.rback{background:none; border:none; cursor:pointer; font-family:var(--am-label); font-style:normal; font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:rgba(169,174,143,.7); padding:0; align-self:flex-start;}
.rchoice{display:flex; gap:10px; width:100%;}
.rchoice button{flex:1; padding:13px; cursor:pointer; border-radius:0; font-family:var(--am-label); font-style:normal; font-size:10px; letter-spacing:.18em; text-transform:uppercase;
  background:rgba(169,174,143,.08); border:1px solid rgba(169,174,143,.34); color:var(--am-salvia-foto);
  transition:all 200ms ease;}
.rchoice button.sel-si{background:rgba(185,194,135,.22); border-color:var(--am-verde-cala); color:var(--am-verde-cala);}
.rchoice button.sel-no{background:rgba(225,180,161,.14); border-color:rgba(225,180,161,.6); color:var(--am-rosa-empolvado);}
.rseats{display:flex; gap:8px; flex-wrap:wrap; justify-content:center;}
.rseats button{width:44px; height:44px; cursor:pointer; border-radius:0; font-family:var(--am-display); font-style:normal; font-size:16px;
  background:rgba(169,174,143,.08); border:1px solid rgba(169,174,143,.34); color:var(--am-salvia-foto); transition:all 200ms ease;}
.rseats button.sel{background:var(--am-salvia-foto); color:var(--am-verde-noche); border-color:var(--am-salvia-foto);}
.rerr{font-family:var(--am-body); font-style:italic; font-size:14px; color:var(--am-rosa-empolvado); margin:0; text-align:center;}
textarea.rinput{resize:vertical; min-height:64px;}

/* botones */
.btn{display:inline-block; width:100%; text-align:center; margin-top:6px; padding:14px 26px; cursor:pointer; border-radius:0;
  font-family:var(--am-label); font-style:normal; font-size:11px; letter-spacing:.22em; text-transform:uppercase; text-decoration:none;
  color:var(--am-crema); background:var(--am-malva); border:none; position:relative; overflow:hidden;
  transition:transform 160ms var(--ease-out), background 160ms ease;}
.btn::after{content:""; position:absolute; top:0; left:-80%; width:50%; height:100%;
  background:linear-gradient(100deg, transparent, rgba(255,255,255,.28), transparent); transform:skewX(-18deg);}
@media (hover:hover) and (pointer:fine){
  .btn::after{transition:left 560ms ease;}
  .btn:hover::after{left:130%;}
  .btn:hover{background:var(--am-vino-profundo);}
}
.btn:active{transform:scale(.97);}
.btn:disabled{opacity:.55; cursor:default;}
.night-btn{color:var(--am-verde-noche);
  background:linear-gradient(102deg, #7C5B26 0%, #A6842F 15%, #E8D69C 33%, #FFF6DA 43%, #E0C878 54%, #B8964A 68%, #8A6A2F 84%, #6E5220 100%);
  background-size:260% 100%; animation:foil 8s ease-in-out infinite alternate;
  box-shadow:inset 0 1px 0 rgba(255,246,218,.5), inset 0 -1px 0 rgba(0,0,0,.28), 0 12px 26px -16px rgba(0,0,0,.7);}
.night-btn:hover{background:linear-gradient(102deg, #8A6A2F 0%, #B8964A 15%, #F2E3B0 33%, #FFFBE8 43%, #E8D69C 54%, #C39B45 68%, #98762F 84%, #7C5B26 100%); background-size:260% 100%;}

/* nav pastilla */
.pill{position:fixed; left:50%; bottom:22px; transform:translateX(-50%); z-index:40;
  display:flex; gap:2px; padding:5px; border-radius:100px;
  background:linear-gradient(165deg, rgba(169,120,133,.34), rgba(74,29,43,.62) 62%); backdrop-filter:blur(14px) saturate(1.2); -webkit-backdrop-filter:blur(14px) saturate(1.2);
  box-shadow:0 12px 32px -12px rgba(30,25,14,.72), inset 0 1px 0 rgba(255,255,255,.28), inset 0 0 0 1px rgba(184,150,74,.24);}
.pill a{font-family:'Marcellus',var(--am-label),serif; font-style:normal; font-weight:400; text-transform:uppercase; font-size:11px; letter-spacing:.1em;
  padding:9px 18px; border-radius:100px; text-decoration:none; color:rgba(243,238,215,.82); cursor:pointer;
  transition:background 200ms ease, color 200ms ease, transform 160ms var(--ease-out);}
@media (hover:hover) and (pointer:fine){ .pill a:hover{color:var(--am-crema);} }
.pill a:active{transform:scale(.97);}
.pill a.on{background:var(--am-rosa-empolvado); color:var(--am-vino-profundo);}

/* overlay aporte */
.gov{position:fixed; inset:0; z-index:100; background:rgba(30,25,14,.55); backdrop-filter:blur(5px);
  display:flex; align-items:center; justify-content:center; padding:22px;}
.gov-card{position:relative; width:100%; max-width:420px; max-height:88svh; overflow-y:auto; padding:34px 28px 30px;
  background-color:rgba(251,248,238,.97); background-image:url('/am/grain.png'); background-size:96px 96px; background-blend-mode:multiply;
  box-shadow:inset 1px 1px 0 rgba(255,255,255,.5), inset -1px -1px 0 rgba(94,30,46,.1), 0 30px 70px -30px rgba(0,0,0,.6);
  display:flex; flex-direction:column; gap:12px; text-align:center;}
.gov-card::after{content:""; position:absolute; inset:10px; pointer-events:none;
  box-shadow:inset 1px 1px 1px rgba(94,30,46,.13), inset -1px -1px 0 rgba(251,248,238,.5);}
.gov-close{position:absolute; top:12px; right:14px; z-index:2; background:none; border:none; cursor:pointer;
  font-family:var(--am-label); font-size:12px; color:var(--am-malva); letter-spacing:.1em;}
.gov-name{font-family:var(--am-script-alt); font-style:normal; font-size:clamp(30px,7vw,38px); line-height:1.3; color:var(--am-vino-profundo); margin:0;}
.gov-input{width:100%; padding:12px 14px; border-radius:0; background:rgba(161,93,102,.06); border:1px solid rgba(161,93,102,.3);
  font-family:var(--am-body); font-style:italic; font-size:15px; color:var(--am-vino-profundo); text-align:center;}
.gov-input:focus{outline:none; border-color:var(--am-malva);}
.gov-chips{display:flex; gap:8px; flex-wrap:wrap; justify-content:center;}
.gov-chips button{padding:10px 16px; cursor:pointer; border-radius:0; font-family:var(--am-label); font-style:normal; font-size:10px; letter-spacing:.14em;
  background:transparent; border:1px solid rgba(161,93,102,.35); color:var(--am-malva); transition:all 180ms ease;}
.gov-chips button.sel{background:var(--am-malva); color:var(--am-crema); border-color:var(--am-malva);}
.gov-fee{font-family:var(--am-label); font-style:normal; font-size:9px; letter-spacing:.18em; text-transform:uppercase; color:var(--am-oliva); margin:0;}
.gov-thanks{font-family:var(--am-body); font-style:italic; font-size:16px; line-height:1.8; color:var(--am-malva); margin:0;}

.rv{opacity:0; transform:translateY(10px); transition:opacity 420ms var(--ease-out), transform 420ms var(--ease-out);}
.sec.on .rv{opacity:1; transform:none;}
.d1{transition-delay:80ms;} .d2{transition-delay:160ms;} .d3{transition-delay:240ms;} .d4{transition-delay:320ms;} .d5{transition-delay:400ms;}

@media (max-width:640px){
  .venues{grid-template-columns:1fr;}
  .timeline{grid-template-columns:auto 24px auto;}
  .pill a{padding:9px 13px; font-size:10px;}
}
@media (prefers-reduced-motion:reduce){
  .rv{transform:none !important; transition:opacity 200ms ease !important;}
  .sec.on{animation:secFade 200ms ease both;}
  @keyframes secFade{from{opacity:0;} to{opacity:1;}}
  .foil-mono{animation:none;}
  .btn::after{display:none;}
}
`;

function fmtQ(n: number) {
  return `Q ${Math.round(n).toLocaleString("en-US")}`;
}

export default function BodaClientAM({ slug }: { slug: string }) {
  const [pareja, setPareja] = useState<any>(null);
  const [fondos, setFondos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("portada");

  // aporte
  const [giftOpen, setGiftOpen] = useState<any>(null);
  const [giftNombre, setGiftNombre] = useState("");
  const [giftMensaje, setGiftMensaje] = useState("");
  const [giftMonto, setGiftMonto] = useState(0);
  const [giftCustom, setGiftCustom] = useState(false);
  const [giftPaid, setGiftPaid] = useState(false);

  // rsvp
  const [rq, setRq] = useState("");
  const [rResults, setRResults] = useState<any[]>([]);
  const [rSearched, setRSearched] = useState(false);
  const [rSel, setRSel] = useState<any>(null);
  const [rCodeStep, setRCodeStep] = useState(false);
  const [rCode, setRCode] = useState("");
  const [rCodeErr, setRCodeErr] = useState(false);
  const [rAsis, setRAsis] = useState("");
  const [rAcomp, setRAcomp] = useState(0);
  const [rRestr, setRRestr] = useState("");
  const [rMsg, setRMsg] = useState("");
  const [rSending, setRSending] = useState(false);
  const [rDone, setRDone] = useState(false);

  useEffect(() => { load(); }, [slug]);

  // Precalienta todas las fuentes al montar: las secciones ocultas (display:none)
  // no disparan la descarga y la primera visita a cada pantalla mostraba el fallback.
  useEffect(() => {
    const familias = [
      "'Monsieur La Doulaise'", "'Pinyon Script'", "'Bodoni Moda'", "'Marcellus'",
      "'Marcellus SC'", "'EB Garamond'", "'Mr Dafoe'", "'Instrument Serif'",
      "'Vogue'", "'Handflair'",
    ];
    familias.forEach(f => { document.fonts.load(`1em ${f}`).catch(() => {}); document.fonts.load(`italic 1em ${f}`).catch(() => {}); });
  }, []);

  async function load() {
    const { data: p } = await supabase.from("parejas").select("*").eq("slug", slug).single();
    if (p) {
      setPareja(p);
      const { data: f } = await supabase.from("fondos").select("*").eq("pareja_id", p.id).order("orden");
      setFondos(f || []);
    }
    setLoading(false);
  }

  function show(id: string) {
    setActive(id);
    window.scrollTo(0, 0);
    try { history.replaceState(null, "", "#" + id); } catch {}
  }

  useEffect(() => {
    const h = (location.hash || "").replace("#", "");
    if (["portada", "detalles", "regalos", "rsvp"].includes(h)) setActive(h);
  }, []);

  async function searchGuests() {
    if (!rq.trim() || !pareja) return;
    setRSearched(true);
    setRSel(null);
    const { data } = await supabase.from("invitados")
      .select("id,nombre,asientos,confirmado,pareja_id,tiene_codigo")
      .eq("pareja_id", pareja.id)
      .ilike("nombre", `%${rq.trim()}%`);
    setRResults(data || []);
  }

  function pickGuest(inv: any) {
    setRSel(inv);
    setRCode(""); setRCodeErr(false);
    setRAsis(""); setRAcomp(0); setRRestr(""); setRMsg("");
    setRCodeStep(!!(pareja.rsvp_codigo_requerido && inv.tiene_codigo));
  }

  async function verifyCode() {
    if (!rSel) return;
    setRCodeErr(false);
    const { data } = await supabase.from("invitados")
      .select("id").eq("id", rSel.id).eq("codigo", rCode.trim().toUpperCase()).single();
    if (data) setRCodeStep(false);
    else setRCodeErr(true);
  }

  async function submitRsvp() {
    if (!rSel || !rAsis) return;
    setRSending(true);
    await supabase.from("rsvp").insert({
      invitado_id: rSel.id, pareja_id: pareja.id, nombre: rSel.nombre,
      asistencia: rAsis, acompanantes: rAcomp, restricciones: rRestr, mensaje: rMsg,
    });
    await supabase.from("invitados").update({ confirmado: true }).eq("id", rSel.id);
    setRSending(false);
    setRDone(true);
  }

  function openGift(f: any) {
    setGiftOpen(f);
    setGiftNombre(""); setGiftMensaje(""); setGiftPaid(false); setGiftCustom(false);
    setGiftMonto(f.modo === "completo" ? f.meta : (f.chips?.[0] || 100));
  }

  async function payGift() {
    const f = giftOpen;
    const monto = f.modo === "completo" ? f.meta : giftMonto;
    if (monto <= 0) return;
    setGiftPaid(true);
    await supabase.from("contribuciones").insert({ fondo_id: f.id, nombre_invitado: giftNombre || "Anónimo", monto, mensaje: giftMensaje || null });
    await supabase.from("fondos").update({
      recaudado: (f.recaudado || 0) + monto,
      ...(f.modo === "completo" ? { tomado: true } : {}),
    }).eq("id", f.id);
    load();
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#4A1D2B", fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: 20, color: "#F3EED7" }}>
      André &amp; Marjorie…
    </div>
  );

  const seats = rSel?.asientos || 1;

  return (
    <div className="am-root">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preload" href="/am/fonts/Vogue.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      <link rel="preload" href="/am/fonts/Handflair.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      <link rel="preload" href="/am/fonts/MrDafoe-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Monsieur+La+Doulaise&family=Pinyon+Script&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500&family=Marcellus&family=Marcellus+SC&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Mr+Dafoe&family=Instrument+Serif:ital@1&family=Italiana&family=Norican&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: AM_CSS }} />

      {/* filtro tinta para el script nocturno */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="ink">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
          <feComponentTransfer><feFuncA type="discrete" tableValues="0 .6 .8 1 1" /></feComponentTransfer>
        </filter>
      </svg>

      <main className="inv">

        {/* 01 · PORTADA */}
        <section className={`sec cover${active === "portada" ? " on" : ""}`} id="portada">
          <div className="bg" style={{ backgroundImage: "url('/am/tex/terciopelo-tulipanes.jpg')" }} />
          <div className="vsheen" aria-hidden="true" />
          <div className="grain" />
          <div className="cov-in hero">
            <div className="par-credits rv">
              <div className="pc-col pc-l"><span>Juan Felipe González</span><span>Anna Mónica Cobos</span></div>
              <div className="pc-col pc-r"><span>Carlos Rafael Del Cid</span><span>Ana Isabel Conde</span></div>
            </div>
            <div className="hero-mid">
              <p className="bless rv d1">By His grace, and with the blessing of those who raised us</p>
              <h1 className="hero-names rv d3"><span className="hn-a">André <span className="amp">&amp;</span></span> <span className="hn-b">Marjorie</span></h1>
            </div>
            <div className="hero-date rv d4"><span className="hd-rule" aria-hidden="true" /><span className="hd-txt">24 · X · 2026</span></div>
            <div className="foil-mono hero-mono rv d4" role="img" aria-label="Monograma A&M" />
          </div>
        </section>

        {/* 02 · DETALLES */}
        <section className={`sec details${active === "detalles" ? " on" : ""}`} id="detalles">
          <p className="sec-tag">Detalles del día</p>
          <div className="wrap">
            <header className="shead dhead">
              <h2 className="lock lock-mid"><span className="script over">el</span><span className="lock-main dl">Gran día</span></h2>
            </header>

            <ol className="timeline">
              <li><span className="t">2:30 PM</span><span className="pt" aria-hidden="true" /><span className="e">Recepción de invitados</span></li>
              <li><span className="t">3:00 PM</span><span className="pt" aria-hidden="true" /><span className="e">Ceremonia religiosa</span></li>
              <li><span className="t">4:00 PM</span><span className="pt" aria-hidden="true" /><span className="e">Cóctel &amp; fotos</span></li>
              <li><span className="t">5:00 PM</span><span className="pt" aria-hidden="true" /><span className="e">Recepción y cena</span></li>
              <li><span className="t">7:00 PM</span><span className="pt" aria-hidden="true" /><span className="e">¡A bailar!</span></li>
            </ol>

            <div className="venues">
              <article className="vcard">
                <div className="vbg" style={{ backgroundImage: "url('/am/tex/piedra.webp')" }} />
                <img className="ic sm" src="/am/ic/pajaritos.png" alt="" />
                <p className="label vlabel">La promesa</p>
                <p className="vsub">Ceremonia religiosa</p>
                <p className="vtime"><span className="vg">3</span><span className="vg vpm">PM</span></p>
                <p className="body">Terraza · El Mayab</p>
                <a className="btn-cap" href={pareja?.ceremonia_maps || "https://maps.google.com"} target="_blank" rel="noopener noreferrer">Ver en Maps ↗</a>
              </article>
              <article className="vcard">
                <div className="vbg" style={{ backgroundImage: "url('/am/tex/lino.webp')" }} />
                <img className="ic sm" src="/am/ic/bola-disco.png" alt="" />
                <p className="label vlabel">La celebración</p>
                <p className="vsub">Recepción y cena</p>
                <p className="vtime"><span className="vg">7</span><span className="vg vpm">PM</span></p>
                <p className="body">Jardín principal · El Mayab</p>
                <a className="btn-cap" href={pareja?.recepcion_maps || "https://maps.google.com"} target="_blank" rel="noopener noreferrer">Ver en Maps ↗</a>
              </article>
            </div>

            <article className="dress">
              <div className="grain" />
              <div className="dress-in">
                <h3 className="lock dress-lock"><span className="lock-main hf">Dress code</span></h3>
                <p className="dress-detail">Black tie</p>
                <p className="body lt">Nuestra boda será una noche muy especial y elegante para nosotros; nos encantaría que nos acompañaran a mantener la estética y formalidad del evento.</p>
                <div className="swatches" aria-hidden="true">
                  <span style={{ background: "var(--am-vino-profundo)" }} />
                  <span style={{ background: "var(--am-malva)" }} />
                  <span style={{ background: "var(--am-rosa-empolvado)" }} />
                  <span style={{ background: "var(--am-salvia-palida)" }} />
                </div>
              </div>
            </article>
            <p className="pw sec-foot"><span className="wd">wedo<i>.</i></span></p>
          </div>
        </section>

        {/* 03 · REGALOS */}
        <section className={`sec gifts${active === "regalos" ? " on" : ""}`} id="regalos">
          <div className="bg" style={{ backgroundImage: "url('/am/mat/crisantemo-suenos.jpg')" }} />
          <div className="grain" />
          <p className="sec-tag">Mesa de regalos</p>
          <div className="wrap">
            <header className="shead">
              <h2 className="lock"><span className="script over">Sin listas de regalos</span><span className="lock-main">CON LISTA DE SUEÑOS</span></h2>
            </header>

            <div className="gcards">
              {fondos.map((f, i) => {
                const pct = f.meta > 0 ? Math.min(Math.round(((f.recaudado || 0) / f.meta) * 100), 100) : 0;
                return (
                  <article className="gcard" key={i}>
                    {f.foto
                      ? <img className="gph" src={f.foto} alt={f.nombre} />
                      : <div className="gph" />}
                    <div className="gbody">
                      <div className="grow"><h3 className="gname">{f.nombre}</h3><span className="gmeta">Meta {fmtQ(f.meta || 0)}</span></div>
                      {f.descripcion && <p className="body sm">{f.descripcion}</p>}
                      {f.modo !== "completo" && (
                        <>
                          <div className="bar"><i style={{ width: `${pct}%` }} /></div>
                          <div className="grow"><span className="gpct">{pct}% recaudado</span><span className="gsum">{fmtQ(f.recaudado || 0)}</span></div>
                        </>
                      )}
                      {f.modo === "completo" && f.tomado
                        ? <span className="gpct" style={{ color: "var(--am-oliva)" }}>✦ Ya regalado</span>
                        : <a className="btn" onClick={e => { e.preventDefault(); openGift(f); }} href="#">Aportar</a>}
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="pw sec-foot"><span className="wd">wedo<i>.</i></span></p>
          </div>
        </section>

        {/* 04 · RSVP */}
        <section className={`sec rsvp${active === "rsvp" ? " on" : ""}`} id="rsvp">
          <p className="sec-tag lt">Confirmación</p>
          <div className="wrap narrow night">
            <div className="nhead">
              <span className="nrule" aria-hidden="true" />
              <p className="label lt nsp">Por favor, confírmanos antes del 30 de septiembre</p>
              <p className="nsc ink">¿nos acompañas?</p>
            </div>

            {rDone ? (
              <div className="rcard">
                <div className="foil-mono rseal" role="img" aria-label="A&M" />
                <p className="rlead">{rAsis === "si" ? "Tu lugar está guardado. ¡Nos vemos el 24 de octubre!" : "Gracias por avisarnos. Te vamos a extrañar."}</p>
                <p className="nmono">Tu confirmación llegó directo a André &amp; Marjorie</p>
              </div>
            ) : rSel && rCodeStep ? (
              <div className="rcard">
                <button className="rback" onClick={() => { setRSel(null); setRCodeStep(false); }}>← Volver</button>
                <p className="rres-name" style={{ fontSize: 22 }}>{rSel.nombre}</p>
                <p className="rlead">Ingresa el código de tu invitación</p>
                <input
                  className="rinput"
                  value={rCode}
                  onChange={e => { setRCode(e.target.value.toUpperCase()); setRCodeErr(false); }}
                  onKeyDown={e => e.key === "Enter" && verifyCode()}
                  placeholder="Ej: ABC123"
                  maxLength={8}
                  style={{ letterSpacing: 4, fontFamily: "monospace", fontStyle: "normal" }}
                />
                {rCodeErr && <p className="rerr">Código incorrecto. Revisa tu invitación.</p>}
                <button className="btn night-btn" onClick={verifyCode} disabled={!rCode.trim()}>Continuar</button>
              </div>
            ) : rSel ? (
              <div className="rcard">
                <button className="rback" onClick={() => setRSel(null)}>← Volver</button>
                <p className="rres-name" style={{ fontSize: 24 }}>{rSel.nombre}</p>
                <p className="nmono" style={{ margin: 0 }}>{seats} {seats === 1 ? "lugar reservado" : "lugares reservados"}</p>

                {rSel.confirmado ? (
                  <p className="rlead" style={{ marginTop: 10 }}>✦ Ya confirmaste tu asistencia. ¡Gracias!</p>
                ) : (
                  <>
                    <div className="rchoice">
                      <button className={rAsis === "si" ? "sel-si" : ""} onClick={() => setRAsis("si")}>Sí, asistiré</button>
                      <button className={rAsis === "no" ? "sel-no" : ""} onClick={() => { setRAsis("no"); setRAcomp(0); }}>No podré ir</button>
                    </div>

                    {rAsis === "si" && seats > 1 && (
                      <>
                        <p className="nmono" style={{ margin: "4px 0 0" }}>¿Cuántos asisten? (incluyéndote)</p>
                        <div className="rseats">
                          {Array.from({ length: seats }, (_, i) => i + 1).map(n => (
                            <button key={n} className={rAcomp + 1 === n ? "sel" : ""} onClick={() => setRAcomp(n - 1)}>{n}</button>
                          ))}
                        </div>
                      </>
                    )}

                    {rAsis === "si" && (
                      <input className="rinput" value={rRestr} onChange={e => setRRestr(e.target.value)} placeholder="Restricciones alimentarias (opcional)…" />
                    )}
                    <textarea className="rinput" value={rMsg} onChange={e => setRMsg(e.target.value)} placeholder="Un mensaje para los novios (opcional)…" />

                    <button className="btn night-btn" onClick={submitRsvp} disabled={!rAsis || rSending}>
                      {rSending ? "Enviando…" : "Confirmar"}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <form className="rcard" onSubmit={e => { e.preventDefault(); searchGuests(); }}>
                <div className="foil-mono rseal" role="img" aria-label="A&M" />
                <p className="rlead">Busca tu nombre en la lista de invitados</p>
                <input className="rinput" type="text" value={rq} onChange={e => setRq(e.target.value)} placeholder="Escribe tu nombre…" aria-label="Tu nombre" />
                <button className="btn night-btn" type="submit">Buscar mi invitación</button>

                {rSearched && rResults.length === 0 && (
                  <p className="rerr">No encontramos tu nombre. Intenta con otro término.</p>
                )}
                {rResults.length > 0 && (
                  <div className="rres">
                    {rResults.map((inv, i) => (
                      <button type="button" className="rres-item" key={i} onClick={() => pickGuest(inv)}>
                        <span>
                          <span className="rres-name">{inv.nombre}</span>
                          <span className="rres-sub" style={{ display: "block" }}>{inv.asientos} {inv.asientos === 1 ? "lugar" : "lugares"}{inv.confirmado ? " · ya confirmó" : ""}</span>
                        </span>
                        <span style={{ color: "var(--am-salvia-foto)" }}>→</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="nmono">Tu confirmación llega directo a André &amp; Marjorie</p>
              </form>
            )}
            <p className="pw sec-foot lt"><span className="wd">wedo<i>.</i></span></p>
          </div>
        </section>
      </main>

      {/* nav pastilla */}
      <nav className="pill" aria-label="Secciones">
        {[["portada", "Nosotros"], ["detalles", "El día"], ["regalos", "Regalos"], ["rsvp", "RSVP"]].map(([id, label]) => (
          <a key={id} className={active === id ? "on" : ""} onClick={e => { e.preventDefault(); show(id); }} href={`#${id}`}>{label}</a>
        ))}
      </nav>

      {/* overlay aporte */}
      {giftOpen && (
        <div className="gov" onClick={e => e.target === e.currentTarget && setGiftOpen(null)}>
          <div className="gov-card">
            <button className="gov-close" onClick={() => setGiftOpen(null)}>✕</button>
            {giftPaid ? (
              <>
                <div className="foil-mono" style={{ width: 96, height: 96, margin: "0 auto" }} role="img" aria-label="A&M" />
                <p className="gov-name">¡Gracias{giftNombre ? `, ${giftNombre.split(" ")[0]}` : ""}!</p>
                <p className="gov-thanks">{pareja?.mensaje_gracias || "Con todo nuestro amor, gracias por ser parte de este momento tan especial para nosotros."}</p>
                <p className="gov-fee">— André &amp; Marjorie</p>
                <button className="btn" onClick={() => setGiftOpen(null)}>Cerrar</button>
              </>
            ) : (
              <>
                <p className="gov-name">{giftOpen.nombre}</p>
                {giftOpen.descripcion && <p className="body sm" style={{ margin: 0 }}>{giftOpen.descripcion}</p>}
                <input className="gov-input" value={giftNombre} onChange={e => setGiftNombre(e.target.value)} placeholder="Tu nombre…" />
                <textarea className="gov-input" value={giftMensaje} onChange={e => setGiftMensaje(e.target.value)} placeholder="Mensaje para los novios (opcional)…" style={{ resize: "vertical", minHeight: 60 }} />

                {giftOpen.modo === "completo" ? (
                  <button className="btn" onClick={payGift}>Regalar {fmtQ(giftOpen.meta || 0)} — completo</button>
                ) : (
                  <>
                    <div className="gov-chips">
                      {(giftOpen.chips || [100, 200, 500, 1000]).map((a: number) => (
                        <button key={a} className={!giftCustom && giftMonto === a ? "sel" : ""} onClick={() => { setGiftMonto(a); setGiftCustom(false); }}>{fmtQ(a)}</button>
                      ))}
                      <button className={giftCustom ? "sel" : ""} onClick={() => { setGiftCustom(true); setGiftMonto(0); }}>Otro</button>
                    </div>
                    {giftCustom && (
                      <input className="gov-input" type="number" placeholder="Escribe tu monto en Q…" onChange={e => setGiftMonto(parseInt(e.target.value) || 0)} />
                    )}
                    <button className="btn" onClick={payGift} disabled={giftMonto <= 0}>
                      {giftMonto > 0 ? `Aportar ${fmtQ(giftMonto)}` : "Selecciona un monto"}
                    </button>
                  </>
                )}
                {giftMonto > 0 && (
                  <p className="gov-fee">Comisión wedo 3.5% · Los novios reciben {fmtQ(giftMonto * 0.965)}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
