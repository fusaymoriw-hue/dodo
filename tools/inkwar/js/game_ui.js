/* ---- src/3d/visual.js ---- */


/* Recovered GLB geometry and skeleton. Model originals are never modified on disk. */
(function(){'use strict';const T=RING3D.THREE;
const withHex=o=>new Proxy(o,{get:(t,k)=>typeof k==='string'&&/^#[0-9a-fA-F]{6}$/.test(k)?parseInt(k.slice(1),16):t[k]});
const HC=withHex({'オリーブ':0x6f7d32,'深紫':0x4a2a72,'紺':0x1d2a52,'青':0x326fb6,'黒':0x222226,'茶':0x6b3a22,'金':0xc9a15b,'赤':0xa33b3b,'白':0xe6e1d8,'緑':0x2f9a48,'紫':0x7b49c4,'桃':0xe07070,'橙':0xf08a30}),CC=withHex({'赤':0xd64545,'白':0xf4f1ea,'青':0x2c5fbf,'黒':0x2a2a2a,'黄':0xe2c14a,'緑':0x2f8a5a,'桃':0xe07aa8,'紫':0x6a3d96,'茶':0x8a5430,'橙':0xe07a28}),HN={'ショート':'short','サイド':'side','ポニー':'pony','ツイン':'twin','ロング':'long','団子':'bun'};
const ALIGN=[.181818,0,0,0,0,.181818,0,0,0,0,-.181818,0,-.000099434,.087441054,-.037964417,1],cache=new Map();
/* Ink87：表情の形のうち、動かない（全部 0）ものは、同じ 0 の入れ物を使う（メモリを小さく） */
const ZERO=new Map();function slimGL(gl){gl.scene.traverse(o=>{const g=o.geometry,M=g&&g.morphAttributes&&g.morphAttributes.position;if(!M)return;for(let i=0;i<M.length;i++){const a=M[i].array;let z=true;for(let j=0;j<a.length;j++)if(a[j]!==0){z=false;break;}if(z){let Z=ZERO.get(a.length);if(!Z){Z=new Float32Array(a.length);ZERO.set(a.length,Z);}M[i]=new T.BufferAttribute(Z,3);}}const N=g.morphAttributes.normal;if(N)delete g.morphAttributes.normal;});}
/* Ink93：モデルのデータ（'@' のもの）を読む。同じものは1回だけ。配る形は中の入れ物から、投稿サイト用は js/m/〇〇.js から */
const LOADK=new Map();function loadKey(key){if(LOADK.has(key))return LOADK.get(key);const p=new Promise((ok,bad)=>{const emb=YR.binary[key]==='@'&&document.getElementById('yrb-'+key);if(emb){YR.binary[key]=emb.textContent;emb.remove();}
 if(YR.binary[key]==='@'&&YR.binaryBase){const sc=document.createElement('script');sc.src=YR.binaryBase+key+'.js';sc.onload=()=>ok();sc.onerror=()=>{LOADK.delete(key);bad(new Error('モデルを読み込めません：'+key));};document.head.appendChild(sc);}else ok();});LOADK.set(key,p);return p;}
YR.loadKey=loadKey;YR.prefetchModels=keys=>Promise.all(keys.filter(k=>YR.binary[k]).map(k=>loadKey(k).catch(()=>{})));
function parse(key){if(cache.has(key))return cache.get(key);const p=new Promise((ok,bad)=>{const run=()=>{try{const s=atob(YR.binary[key]),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);const go=buf=>new RING3D.GLTFLoader().parse(buf,'',gl=>{slimGL(gl);try{if(gl.parser&&gl.parser.cache)gl.parser.cache.removeAll();gl.parser=null;}catch(e){}if(/^(body|mh)_/.test(key))YR.binary[key]='#';ok(gl);},bad);if(YR.binaryGz)new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer().then(go,bad);else go(u.buffer);}catch(e){bad(e);}};
 // 分割版（zip）：モデルは assets の別ファイル。'@' は「まだ読み込んでいない」しるし
 loadKey(key).then(run,bad);});cache.set(key,p);return p;}
function cloneRig(src){const out=src.clone(true),a=[],b=[];src.traverse(o=>a.push(o));out.traverse(o=>b.push(o));const map=new Map(a.map((o,i)=>[o,b[i]]));out.traverse(o=>{if(o.isSkinnedMesh){const orig=a[b.indexOf(o)];o.skeleton=orig.skeleton.clone();o.skeleton.bones=orig.skeleton.bones.map(x=>map.get(x));o.bind(o.skeleton,orig.bindMatrix.clone());o.frustumCulled=false;}});return out;}
function mode(s){s=String(s||'').replace(/\+/g,'＋');return s==='ビキニ'?1:s==='セパレート'?2:s==='ビキニ＋パンツ'?3:s==='全身胴着'?4:s==='ビキニ＋スカート'?5:s==='セパレート＋スカート'?6:s==='セパレート＋パンツ'?7:s==='道着'?8:s==='クロップトップ'?9:s==='レオタード'?10:s==='レオタード＋スカート'?10:s==='ハイネック'?11:s==='ジャケット'?12:s==='コルセット'?13:s==='ドレス'?14:s==='ハルター'?15:s==='チャイナ'?16:s==='ボディスーツ'?17:s==='ホルタービキニ'?18:2;}
function clothAt(x,y,z,body,m){if(body<.5)return false;const ax=Math.abs(x),top=y>1.075+ax*ax*4&&y<1.24&&ax<.13,brief=y>.73&&y<1.01&&ax<.175&&Math.hypot(ax-.09,y-.66)>.105,pants=y>.36&&y<1.01&&ax<.18,one=y>.72&&y<1.24&&ax<.175&&Math.hypot(ax-.1,y-.68)>.1;return m===1?top||brief:m===2||m===4?one:m===3?top||pants:m===5?top:one&&y>1;}
const clothGLSL=`float clothHere(vec3 p,float b,float m){float a=abs(p.x),y=p.y;
if(m>7.5&&m<8.5){if(b<0.5)return (a<uGiArm&&y>1.02)?1.:0.;return (y>.36&&y<1.32&&a<.19)?1.:0.;}
if(b<0.5){if(m>12.5)return 0.;if(m>11.5)return (a<.335&&y>1.12)?1.:0.;if(m>10.5&&m<11.5)return (a<.115&&y>1.15&&y<1.345)?1.:0.;if(m>8.5&&m<9.5)return (a<.205&&y>1.205&&y<1.31&&length(vec2(a,y-1.335))>.085)?1.:0.;return 0.;}float top=(y>1.075+a*a*4.&&y<1.24&&a<.13)?1.:0.;float brief=(y>mix(uBriefLo,max(.73,uBriefLo-.1),smoothstep(-.02,.07,p.z))&&y<1.01&&a<.175&&length(vec2(a-.09,y-.66))>.105)?1.:0.;float pants=(y>.36&&y<1.01&&a<.18)?1.:0.;float one=(y>.72&&y<1.24&&a<.175&&length(vec2(a-.1,y-.68))>.1&&!(uCut>.5&&p.z<-.01&&length(vec2(a/.045,(y-1.04)/.10))<1.))?1.:0.;float crop=(y>1.075+a*a*3.&&y<1.31&&a<.20&&length(vec2(a,y-1.335))>.085)?1.:0.;float leo=(y>uHcY&&y<1.24&&a<min(.175,uHcW+(y-uHcY)*.85)&&!(uCut>.5&&p.z<-.01&&length(vec2(a/.045,(y-1.04)/.10))<1.))?1.:0.;float hn=(y>1.075+a*a*3.&&y<1.345&&a<.20&&!(a>.115&&y>1.17))?1.:0.;float jk=(y>1.06&&y<1.335&&a<.205&&!(a>.17&&y<1.15)&&!(p.z<-.01&&a<.05&&y>1.275))?1.:0.;float pl=(y>.10&&y<1.01&&a<.18&&!(uLegCut>.5&&y<.88&&((uLegCut<1.5&&p.x<0.)||(uLegCut>1.5&&p.x>0.))))?1.:0.;float hc=(y>uHcY&&y<1.0&&a<min(.175,uHcW+(y-uHcY)*.85))?1.:0.;brief=max(brief,(y>.80&&y<1.01&&a<min(.175,.045+(y-.80)*1.1))?1.:0.);float cs=((y>1.10&&y<1.24&&a<.13&&y>1.075+a*a*4.)||((a>.05||p.z>.0)&&a<.18&&y>.98&&y<1.24))?1.:0.;float dr=(y>.80&&y<1.24&&a<.18&&!(p.z<-.01&&a<.058&&y>.965&&y<1.115))?1.:0.;float ht=((p.z<0.&&y>1.075+a*a*3.&&y<1.335&&a<.20-max(0.,y-1.22)*1.2)||(p.z>=0.&&a<.06&&y>1.06&&y<1.335))?1.:0.;float vb=(y>.80&&y<(p.z<0.?.885+a*.65:1.0)&&a<.018+(y-.80)*(p.z<0.?1.05:.85))?1.:0.;float sp=(y>.45&&y<1.0&&a<.20&&a>(y>.80?.15:.118))?1.:0.;if(m>17.5){float cup=(p.z<.01&&length(vec2((a-.07)/.068,(y-1.17)/.075))<1.)?1.:0.;float bk=(p.z>=.0&&y>1.13&&y<1.17&&a<.17)?1.:0.;float nk=(p.z<.0&&y>1.10&&y<1.335&&a<.05*(1.-abs(y-1.2175)/.1175))?1.:0.;float hc2=(y>.83&&y<1.0&&a<min(.175,.035+(y-.83)*.85))?1.:0.;return max(max(cup,bk),max(nk,hc2));}if(m>16.5)return (y>uSuitLow&&y<1.345&&a<.21)?1.:0.;if(m>15.5)return max(hn,leo);if(m>14.5)return max(ht,max(vb,uNoSide>.5?0.:sp));if(m>13.5)return dr;if(m>12.5)return max(cs,hc);if(m>11.5)return max(jk,pl);if(m>10.5)return max(hn,uHighCut>.5?((y>uHcY&&y<1.01&&a<min(.175,uHcW+(y-uHcY)*.85))?1.:0.):brief);if(m>9.5)return leo;if(m>8.5)return max(crop,brief);if(m<1.5)return max(top,brief);if(m<2.5)return one;if(m<3.5)return max(top,pants);if(m<4.5)return one;if(m<5.5)return max(top,uBrief*(uHighCut>.5?hc:brief));if(m<6.5)return y>1.?one:0.;return max(one,pants);}
float giBelt(vec3 p,float b,float m){return (m>7.5&&m<8.5&&b>0.5&&p.y>.93&&p.y<.99&&abs(p.x)<.19)?1.:0.;}`;
function bodyMaterial(mesh,look){const old=mesh.material,g0=mesh.geometry,g=new T.BufferGeometry();for(const k in g0.attributes)g.setAttribute(k,g0.attributes[k]);g.setIndex(g0.index);g.morphAttributes=g0.morphAttributes;g.morphTargetsRelative=g0.morphTargetsRelative;g.groups=g0.groups;g.boundingSphere=g0.boundingSphere;g.boundingBox=g0.boundingBox;mesh.geometry=g;const p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,ref=new Float32Array(p.count*3),aw=new Float32Array(p.count),v=new T.Vector3();mesh.updateWorldMatrix(true,false);for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);ref.set([v.x,v.y,v.z],i*3);let w=0;for(let k=0;k<4;k++)if(/Arm|Hand|Shoulder|Finger|Thumb|Index|Middle|Ring|Little/.test(mesh.skeleton.bones[si.getComponent(i,k)].name))w+=sw.getComponent(i,k);aw[i]=Math.min(1,Math.max(0,.5+(.45-w)*1.5));/* Ink86：なめらかに（腕と体のさかいの服のふちが、ぎざぎざにならない） */}g.setAttribute('aClothRef',new T.BufferAttribute(ref,3));{const c0=g.attributes.color,pa=new Float32Array(p.count*3).fill(1);if(c0)for(let i=0;i<p.count;i++){pa[i*3]=c0.getX(i);pa[i*3+1]=c0.getY(i);pa[i*3+2]=c0.getZ(i);}g.setAttribute('aPaint',new T.BufferAttribute(pa,3));}g.setAttribute('aBody',new T.BufferAttribute(aw,1));const mat=new T.MeshBasicMaterial({map:old.map,color:0xffffff,side:T.DoubleSide});mat.userData={body:true,skin:skinTint(look),mode:mode(look.suit),clothHex:mode(look.suit)===8?(look.giColor?CC[look.giColor]:0xf4f1ea):(CC[look.suitColor]||0x2c5fbf),boot:look.boot==='なし'?1:0,bootHex:CC[look.bootColor]||CC[look.suitColor]||0x2a2a2a,cloth2Hex:look.suitColor2?CC[look.suitColor2]:null,wristHex:look.wrist?CC[look.wrist]:null,gloveHex:look.glove?CC[look.glove]:null,cuffHex:look.cuff?CC[look.cuff]:null,bootTop:look.bootTop||.43,legCut:look.legCut==='L'?1:look.legCut==='R'?2:0,innerHex:look.inner?CC[look.inner]:null,rollHex:look.roll?CC[look.roll]:null,stripeHex:look.pantStripe?CC[look.pantStripe]:null,socksSide:look.socksSide==='L'?1:look.socksSide==='R'?2:0,kneeSide:look.kneeSide==='L'?1:look.kneeSide==='R'?2:0,strapHex:look.strap?CC[look.strap]:null,chestHex:look.chest?CC[look.chest]:null,highCut:look.highCut?1:0,kneeHex:look.knee?CC[look.knee]:null,kneeCapHex:look.kneeCap?CC[look.kneeCap]:null,laceHex:look.lace?CC[look.lace]:null,laceFront:look.laceFront?1:0,briefLo:look.briefLo??.73,hcY:look.hcY??.83,hcW:look.hcW??.035,brief:look.brief?1:0,chokerY:look.chokerY??1.315,legSideW:look.legSideW??.06,legSideLo:look.legSideLo??.48,legSideEHex:look.legSideEdge?CC[look.legSideEdge]:null,panelHex:look.panel?CC[look.panel]:null,panelW:look.panelW??.07,panelTop:look.panelTop??1.13,legSideHex:look.legSide?CC[look.legSide]:null,stripeAHex:look.topStripes?CC[look.topStripes.a]:null,stripeBHex:look.topStripes?CC[look.topStripes.b]:null,stripeK:look.topStripes?.k??40,giArm:look.giArm??.40,bareZ:look.bareFoot?(look.bareFoot.z??-.06):9,diaSkinY:look.diaSkinY??0,csOn:look.cutSides?1:0,csLo:look.cutSides?.lo??1.0,csHi:look.cutSides?.hi??1.12,csW:look.cutSides?.w??.03,csWb:look.cutSides?.wb??.06,csEHex:look.cutSides&&look.cutSides.edge?CC[look.cutSides.edge]:null,csBand:look.cutSides?.band??0,csSl:look.cutSides?.slope??.6,csHalter:look.cutSides?.halter??0,csHeart:look.cutSides?.heart??0,csCenter:look.cutSides?.center?1:0,topLo:look.topLo??0,topFrom:look.topFrom??1.03,meshHex:look.mesh?CC[look.mesh.c]:null,meshEHex:look.mesh?.edge?CC[look.mesh.edge]:null,meshSide:look.mesh?.side??1,meshChest:look.mesh?.chest??1,tightsHex:look.tights?CC[look.tights.c]:null,tightsA:look.tights?.a??.5,tightsTop:(look.tights&&look.tights.top)||9,bootLine:look.bootLine===0?0:1,bandsHex:look.bands?CC[look.bands.c]:null,bandsY:look.bands?.y||[],bandsW:look.bands?.w??.012,bustHex:look.bust?CC[look.bust.c]:null,bustEHex:look.bust?.edge?CC[look.bust.edge]:null,bustLo:look.bust?.lo??1.12,bustHi:look.bust?.hi??1.225,bustHole:look.bust?.hole??0,bustW:(look.bust&&look.bust.w)||.135,lpHex:look.lapel?CC[look.lapel.c]:null,lpTop:(look.lapel&&look.lapel.top)||1.33,lpBot:(look.lapel&&look.lapel.bot)||1.1,lpX:(look.lapel&&look.lapel.x)||.12,lpW:(look.lapel&&look.lapel.w)||.012,lpB:(look.lapel&&look.lapel.back)||0,ucH:(look.underCut&&look.underCut.h)||0,ucW:(look.underCut&&look.underCut.w)||.06,ucLo:(look.underCut&&look.underCut.lo)||1.1,ucE:look.underCut&&look.underCut.edge?CC[look.underCut.edge]:null,sbHex:look.sideBands?CC[look.sideBands.c]:null,sbY:(look.sideBands&&look.sideBands.y)||[],sbW:(look.sideBands&&look.sideBands.w)||.005,yokeHex:look.yoke?CC[look.yoke]:null,hqA:look.harle?CC[look.harle.a]:null,hqB:look.harle?CC[look.harle.b]:null,hqK:(look.harle&&look.harle.k)||22,tcOn:look.thighCut?1:0,tcLo:(look.thighCut&&look.thighCut.lo)||.62,tcHi:(look.thighCut&&look.thighCut.hi)||.84,tcW:(look.thighCut&&look.thighCut.w)||.035,tcE:look.thighCut&&look.thighCut.edge?CC[look.thighCut.edge]:null,jkLo:look.jacketLo||.96,jkOpen:look.jacketOpen||0,stSide:look.pantStripeSide?1:0,stZ:(look.pantStripeSide&&look.pantStripeSide.z)||0,stW:(look.pantStripeSide&&look.pantStripeSide.w)||.012,bvHex:look.briefV?CC[look.briefV.c]:null,bvTop:look.briefV?.top??.99,bvBot:look.briefV?.bot??.81,bvW:look.briefV?.w??.12,bvB:look.briefV?.w0??.018,bvT:look.briefV?.t??0,suitArm:look.suitArm??-1,fnHex:look.fishnet?CC[look.fishnet.c]:null,fnTop:look.fishnet?.top??.80,fnSide:look.fishnet?.side==='L'?1:look.fishnet?.side==='R'?2:0,fnK:look.fishnet?.k??55,thSide:look.thighSide==='L'?1:look.thighSide==='R'?2:0,nvHex:look.neckV?CC[look.neckV.c]:null,nvLo:look.neckV?.lo??1.15,nvW:look.neckV?.w??.09,yokeW:look.yokeW??.115,ynHex:look.yokeNet?CC[look.yokeNet.c]:null,ynEHex:look.yokeNet&&look.yokeNet.edge?CC[look.yokeNet.edge]:null,ynK:(look.yokeNet&&look.yokeNet.k)||80,anHex:look.armNet?CC[look.armNet.c]:null,anEHex:look.armNet&&look.armNet.edge?CC[look.armNet.edge]:null,anFrom:(look.armNet&&look.armNet.from)||.38,sgHex:look.socksGrad?CC[look.socksGrad.c]:null,sgY:(look.socksGrad&&look.socksGrad.y)||.36,gtHex:look.garter?CC[look.garter]:null,tigerHex:look.tiger?CC[look.tiger.c]:null,tigerSHex:look.tiger?CC[look.tiger.s]:null,tigerSheer:look.tiger?.sheer?CC[look.tiger.sheer]:null,hStrapHex:look.halterStrap?CC[look.halterStrap]:null,shortsHex:look.shorts?CC[look.shorts.c]:null,shortsEHex:look.shorts&&look.shorts.edge?CC[look.shorts.edge]:null,shortsLo:look.shorts?.lo??.80,shortsTop:look.shorts?.top??1.0,shortsX:look.shorts?.x??.0,shortsFr:look.shorts?.fr??1.3,hipCut:look.hipCut?1:0,suitLow:look.suitLow??.10,upperHex:look.upper?CC[look.upper]:null,upperY:look.upperY??1.15,beltY:look.beltY??1.005,botTop:look.bottomTop??9,bottomA:look.bottomA??1,jkHex:look.jacket?CC[look.jacket]:null,legEdgeHex:look.legEdge?CC[look.legEdge]:null,legEdgeW:look.legEdgeW??.045,sheerY:look.sheerY??9,sheerA:look.sheerA??1,socksA:look.socksA??1,shoeHex:look.shoe?CC[look.shoe]:null,shoeTop:look.shoeTop??.09,noSide:look.noSide?1:0,dia:look.diamonds||null,diaFillHex:look.diaFill?CC[look.diaFill]:null,diaLineHex:look.diaLine?CC[look.diaLine]:null,frillHex:look.frontFrill?CC[look.frontFrill]:null,sleeveEnd:look.sleeveEnd??.53,sleeveStart:look.sleeveStart??.20,veeHex:look.vee?CC[look.vee]:null,veeEdgeHex:look.veeEdge?CC[look.veeEdge]:null,veeSideHex:look.veeSide?CC[look.veeSide]:null,veeA:look.veeA??1,veeLo:look.veeLo??.88,hemHex:look.hem?CC[look.hem]:null,bottomHex:look.bottomColor?CC[look.bottomColor]:null,beltHex:look.belt?CC[look.belt]:null,buckleHex:look.buckle?CC[look.buckle]:null,elbowHex:look.elbow?CC[look.elbow]:null,cut:look.cutout?1:0,sleeveHex:look.sleeve?CC[look.sleeve]:null,sleeveBHex:look.sleeveBand?CC[look.sleeveBand]:null,chokerHex:look.choker?CC[look.choker]:null,thighHex:look.thighBand?CC[look.thighBand]:null,thighBHex:look.thighStripe?CC[look.thighStripe]:null,socksHex:look.socks?CC[look.socks]:null,socksTop:look.socksTop||.74,bandHex:look.socksBand?CC[look.socksBand]:null,gloveLong:look.gloveLong?1:0,armHex:look.armband?CC[look.armband]:null,armSide:look.armSide||'both',mask:look.mask&&look.maskStyle!=='half'&&look.maskStyle!=='eye'?1:0,maskHex:CC[look.maskColor]||CC[look.suitColor]||0x2a2a2a};
 mat.onBeforeCompile=sh=>{sh.uniforms.uClothColor={value:new T.Color(mat.userData.clothHex)};sh.uniforms.uCloth2={value:new T.Color(mat.userData.cloth2Hex||mat.userData.clothHex)};sh.uniforms.uTwo={value:mat.userData.cloth2Hex?1:0};sh.uniforms.uWrist={value:new T.Color(mat.userData.wristHex||0)};sh.uniforms.uWristOn={value:mat.userData.wristHex!=null?1:0};sh.uniforms.uBootTop={value:mat.userData.bootTop};sh.uniforms.uLegCut={value:mat.userData.legCut};sh.uniforms.uInner={value:new T.Color(mat.userData.innerHex||0)};sh.uniforms.uInnerOn={value:mat.userData.innerHex!=null?1:0};sh.uniforms.uRoll={value:new T.Color(mat.userData.rollHex??mat.userData.clothHex)};sh.uniforms.uStripe={value:new T.Color(mat.userData.stripeHex||0)};sh.uniforms.uStripeOn={value:mat.userData.stripeHex!=null?1:0};sh.uniforms.uSocksSide={value:mat.userData.socksSide};sh.uniforms.uKneeSide={value:mat.userData.kneeSide};sh.uniforms.uStrap={value:new T.Color(mat.userData.strapHex||0)};sh.uniforms.uStrapOn={value:mat.userData.strapHex!=null?1:0};sh.uniforms.uChest={value:new T.Color(mat.userData.chestHex||0)};sh.uniforms.uChestOn={value:mat.userData.chestHex!=null?1:0};sh.uniforms.uHighCut={value:mat.userData.highCut};sh.uniforms.uKnee={value:new T.Color(mat.userData.kneeHex||0)};sh.uniforms.uKneeOn={value:mat.userData.kneeHex!=null?1:0};sh.uniforms.uKneeCap={value:new T.Color(mat.userData.kneeCapHex??mat.userData.kneeHex??0)};sh.uniforms.uLace={value:new T.Color(mat.userData.laceHex||0)};sh.uniforms.uLaceOn={value:mat.userData.laceHex!=null?1:0};sh.uniforms.uLaceF={value:mat.userData.laceFront||0};sh.uniforms.uBriefLo={value:mat.userData.briefLo??.73};sh.uniforms.uHcY={value:mat.userData.hcY??.83};sh.uniforms.uHcW={value:mat.userData.hcW??.035};sh.uniforms.uBrief={value:mat.userData.brief||0};sh.uniforms.uChokerY={value:mat.userData.chokerY??1.315};sh.uniforms.uLegSideW={value:mat.userData.legSideW??.06};sh.uniforms.uLegSideLo={value:mat.userData.legSideLo??.48};sh.uniforms.uLegSideE={value:new T.Color(mat.userData.legSideEHex??mat.userData.legSideHex??0)};sh.uniforms.uPanel={value:new T.Color(mat.userData.panelHex||0)};sh.uniforms.uPanelOn={value:mat.userData.panelHex!=null?1:0};sh.uniforms.uPanelW={value:mat.userData.panelW??.07};sh.uniforms.uPanelTop={value:mat.userData.panelTop??1.13};sh.uniforms.uLegSide={value:new T.Color(mat.userData.legSideHex||0)};sh.uniforms.uLegSideOn={value:mat.userData.legSideHex!=null?1:0};sh.uniforms.uStA={value:new T.Color(mat.userData.stripeAHex||0)};sh.uniforms.uStB={value:new T.Color(mat.userData.stripeBHex||0)};sh.uniforms.uStOn={value:mat.userData.stripeAHex!=null?1:0};sh.uniforms.uStK={value:mat.userData.stripeK};sh.uniforms.uBareZ={value:mat.userData.bareZ};sh.uniforms.uGiArm={value:mat.userData.giArm};sh.uniforms.uCsOn={value:mat.userData.csOn};sh.uniforms.uCsLo={value:mat.userData.csLo};sh.uniforms.uCsHi={value:mat.userData.csHi};sh.uniforms.uCsW={value:mat.userData.csW};sh.uniforms.uCsWb={value:mat.userData.csWb};sh.uniforms.uCsE={value:new T.Color(mat.userData.csEHex??mat.userData.clothHex)};sh.uniforms.uCsHalter={value:mat.userData.csHalter};sh.uniforms.uCsCenter={value:mat.userData.csCenter};sh.uniforms.uCsHeart={value:mat.userData.csHeart};sh.uniforms.uCsSl={value:mat.userData.csSl};sh.uniforms.uCsBand={value:mat.userData.csBand};sh.uniforms.uDiaSkinY={value:mat.userData.diaSkinY};sh.uniforms.uTopLo={value:mat.userData.topLo};sh.uniforms.uTopFrom={value:mat.userData.topFrom};sh.uniforms.uMesh={value:new T.Color(mat.userData.meshHex||0)};sh.uniforms.uMeshOn={value:mat.userData.meshHex!=null?1:0};sh.uniforms.uMeshE={value:new T.Color(mat.userData.meshEHex??mat.userData.meshHex??0)};sh.uniforms.uMeshSide={value:mat.userData.meshSide};sh.uniforms.uMeshChest={value:mat.userData.meshChest};sh.uniforms.uTights={value:new T.Color(mat.userData.tightsHex||0)};sh.uniforms.uTightsOn={value:mat.userData.tightsHex!=null?1:0};sh.uniforms.uTightsA={value:mat.userData.tightsA};sh.uniforms.uTightsTop={value:mat.userData.tightsTop};sh.uniforms.uBootLine={value:mat.userData.bootLine};{const by=mat.userData.bandsY,a=[];for(let q=0;q<4;q++)a.push(by[q]??-9);sh.uniforms.uBandsY={value:a};}sh.uniforms.uBands={value:new T.Color(mat.userData.bandsHex||0)};sh.uniforms.uBandsOn={value:mat.userData.bandsHex!=null?1:0};sh.uniforms.uBandsW={value:mat.userData.bandsW};sh.uniforms.uBust={value:new T.Color(mat.userData.bustHex||0)};sh.uniforms.uBustOn={value:mat.userData.bustHex!=null?1:0};sh.uniforms.uBustE={value:new T.Color(mat.userData.bustEHex??mat.userData.bustHex??0)};sh.uniforms.uBustLo={value:mat.userData.bustLo};sh.uniforms.uBustHi={value:mat.userData.bustHi};sh.uniforms.uBustHole={value:mat.userData.bustHole};sh.uniforms.uBustW={value:mat.userData.bustW};sh.uniforms.uLp={value:new T.Color(mat.userData.lpHex||0)};sh.uniforms.uLpOn={value:mat.userData.lpHex!=null?1:0};sh.uniforms.uLpTop={value:mat.userData.lpTop};sh.uniforms.uLpBot={value:mat.userData.lpBot};sh.uniforms.uLpX={value:mat.userData.lpX};sh.uniforms.uLpW={value:mat.userData.lpW};sh.uniforms.uLpB={value:mat.userData.lpB};sh.uniforms.uUcH={value:mat.userData.ucH};sh.uniforms.uUcW={value:mat.userData.ucW};sh.uniforms.uUcLo={value:mat.userData.ucLo};sh.uniforms.uUcE={value:new T.Color(mat.userData.ucE||0)};sh.uniforms.uUcEOn={value:mat.userData.ucE!=null?1:0};sh.uniforms.uSb={value:new T.Color(mat.userData.sbHex||0)};sh.uniforms.uSbOn={value:mat.userData.sbHex!=null?1:0};sh.uniforms.uSbW={value:mat.userData.sbW};{const a=[];for(let q=0;q<4;q++)a.push(mat.userData.sbY[q]??-9);sh.uniforms.uSbY={value:a};}sh.uniforms.uYoke={value:new T.Color(mat.userData.yokeHex||0)};sh.uniforms.uYokeOn={value:mat.userData.yokeHex!=null?1:0};sh.uniforms.uYokeW={value:mat.userData.yokeW};sh.uniforms.uYn={value:new T.Color(mat.userData.ynHex||0)};sh.uniforms.uYnOn={value:mat.userData.ynHex!=null?1:0};sh.uniforms.uYnE={value:new T.Color(mat.userData.ynEHex??mat.userData.ynHex??0)};sh.uniforms.uYnK={value:mat.userData.ynK};sh.uniforms.uAn={value:new T.Color(mat.userData.anHex||0)};sh.uniforms.uAnOn={value:mat.userData.anHex!=null?1:0};sh.uniforms.uAnE={value:new T.Color(mat.userData.anEHex??mat.userData.anHex??0)};sh.uniforms.uAnFrom={value:mat.userData.anFrom};sh.uniforms.uSg={value:new T.Color(mat.userData.sgHex||0)};sh.uniforms.uSgOn={value:mat.userData.sgHex!=null?1:0};sh.uniforms.uSgY={value:mat.userData.sgY};sh.uniforms.uGt={value:new T.Color(mat.userData.gtHex||0)};sh.uniforms.uGtOn={value:mat.userData.gtHex!=null?1:0};sh.uniforms.uHqA={value:new T.Color(mat.userData.hqA||0)};sh.uniforms.uHqB={value:new T.Color(mat.userData.hqB||0)};sh.uniforms.uHqOn={value:mat.userData.hqA!=null?1:0};sh.uniforms.uHqK={value:mat.userData.hqK};sh.uniforms.uTcOn={value:mat.userData.tcOn};sh.uniforms.uTcLo={value:mat.userData.tcLo};sh.uniforms.uTcHi={value:mat.userData.tcHi};sh.uniforms.uTcW={value:mat.userData.tcW};sh.uniforms.uTcE={value:new T.Color(mat.userData.tcE??0)};sh.uniforms.uTcEOn={value:mat.userData.tcE!=null?1:0};sh.uniforms.uJkLo={value:mat.userData.jkLo};sh.uniforms.uJkOpen={value:mat.userData.jkOpen};sh.uniforms.uStripeSide={value:mat.userData.stSide};sh.uniforms.uStripeZ={value:mat.userData.stZ};sh.uniforms.uStripeW={value:mat.userData.stW};sh.uniforms.uBv={value:new T.Color(mat.userData.bvHex||0)};sh.uniforms.uBvOn={value:mat.userData.bvHex!=null?1:0};sh.uniforms.uBvTop={value:mat.userData.bvTop};sh.uniforms.uBvBot={value:mat.userData.bvBot};sh.uniforms.uBvW={value:mat.userData.bvW};sh.uniforms.uBvB={value:mat.userData.bvB};sh.uniforms.uBvT={value:mat.userData.bvT};sh.uniforms.uSuitArm={value:mat.userData.suitArm};sh.uniforms.uFn={value:new T.Color(mat.userData.fnHex||0)};sh.uniforms.uFnOn={value:mat.userData.fnHex!=null?1:0};sh.uniforms.uFnTop={value:mat.userData.fnTop};sh.uniforms.uFnSide={value:mat.userData.fnSide};sh.uniforms.uFnK={value:mat.userData.fnK};sh.uniforms.uThSide={value:mat.userData.thSide};sh.uniforms.uNv={value:new T.Color(mat.userData.nvHex||0)};sh.uniforms.uNvOn={value:mat.userData.nvHex!=null?1:0};sh.uniforms.uNvLo={value:mat.userData.nvLo};sh.uniforms.uNvW={value:mat.userData.nvW};sh.uniforms.uTiger={value:new T.Color(mat.userData.tigerHex||0)};sh.uniforms.uTigerS={value:new T.Color(mat.userData.tigerSHex||0)};sh.uniforms.uTigerOn={value:mat.userData.tigerHex!=null?1:0};sh.uniforms.uTigerSh={value:new T.Color(mat.userData.tigerSheer||0)};sh.uniforms.uTigerShOn={value:mat.userData.tigerSheer!=null?1:0};sh.uniforms.uHStrap={value:new T.Color(mat.userData.hStrapHex||0)};sh.uniforms.uHStrapOn={value:mat.userData.hStrapHex!=null?1:0};sh.uniforms.uShorts={value:new T.Color(mat.userData.shortsHex||0)};sh.uniforms.uShortsOn={value:mat.userData.shortsHex!=null?1:0};sh.uniforms.uShortsE={value:new T.Color(mat.userData.shortsEHex??mat.userData.shortsHex??0)};sh.uniforms.uShortsLo={value:mat.userData.shortsLo};sh.uniforms.uShortsTop={value:mat.userData.shortsTop};sh.uniforms.uShortsX={value:mat.userData.shortsX};sh.uniforms.uShortsFr={value:mat.userData.shortsFr};sh.uniforms.uHipCut={value:mat.userData.hipCut||0};sh.uniforms.uSuitLow={value:mat.userData.suitLow??.10};sh.uniforms.uUpper={value:new T.Color(mat.userData.upperHex||0)};sh.uniforms.uUpperOn={value:mat.userData.upperHex!=null?1:0};sh.uniforms.uUpperY={value:mat.userData.upperY??1.15};sh.uniforms.uBeltY={value:mat.userData.beltY??1.005};sh.uniforms.uBotTop={value:mat.userData.botTop??9.};sh.uniforms.uBottomA={value:mat.userData.bottomA??1};sh.uniforms.uJk={value:new T.Color(mat.userData.jkHex||0)};sh.uniforms.uJkOn={value:mat.userData.jkHex!=null?1:0};sh.uniforms.uLegEW={value:mat.userData.legEdgeW};sh.uniforms.uLegE={value:new T.Color(mat.userData.legEdgeHex||0)};sh.uniforms.uLegEOn={value:mat.userData.legEdgeHex!=null?1:0};sh.uniforms.uSheerY={value:mat.userData.sheerY};sh.uniforms.uSheerA={value:mat.userData.sheerA};sh.uniforms.uSocksA={value:mat.userData.socksA};sh.uniforms.uShoe={value:new T.Color(mat.userData.shoeHex||0)};sh.uniforms.uShoeOn={value:mat.userData.shoeHex!=null?1:0};sh.uniforms.uShoeTop={value:mat.userData.shoeTop};sh.uniforms.uNoSide={value:mat.userData.noSide||0};{const D=mat.userData.dia||[],arr=[];for(let q=0;q<6;q++){const e=D[q];arr.push(e?new T.Vector4(e[0],e[1],e[2],e[3]):new T.Vector4(0,-9,.01,.01));}sh.uniforms.uDia={value:arr};sh.uniforms.uDiaN={value:D.length};sh.uniforms.uDiaFill={value:new T.Color(mat.userData.diaFillHex||0)};sh.uniforms.uDiaFillOn={value:mat.userData.diaFillHex!=null?1:0};sh.uniforms.uDiaLine={value:new T.Color(mat.userData.diaLineHex||0)};}sh.uniforms.uFrill={value:new T.Color(mat.userData.frillHex||0)};sh.uniforms.uFrillOn={value:mat.userData.frillHex!=null?1:0};sh.uniforms.uSleeveEnd={value:mat.userData.sleeveEnd??.53};sh.uniforms.uSleeveStart={value:mat.userData.sleeveStart??.20};sh.uniforms.uVee={value:new T.Color(mat.userData.veeHex||0)};sh.uniforms.uVeeOn={value:mat.userData.veeHex!=null?1:0};sh.uniforms.uVeeEdge={value:new T.Color(mat.userData.veeEdgeHex??mat.userData.veeHex??0)};sh.uniforms.uVeeSide={value:new T.Color(mat.userData.veeSideHex||0)};sh.uniforms.uVeeSideOn={value:mat.userData.veeSideHex!=null?1:0};sh.uniforms.uVeeA={value:mat.userData.veeA??1};sh.uniforms.uVeeLo={value:mat.userData.veeLo??.88};sh.uniforms.uHem={value:new T.Color(mat.userData.hemHex||0)};sh.uniforms.uHemOn={value:mat.userData.hemHex!=null?1:0};sh.uniforms.uBottom={value:new T.Color(mat.userData.bottomHex||0)};sh.uniforms.uBottomOn={value:mat.userData.bottomHex!=null?1:0};sh.uniforms.uCuff={value:new T.Color(mat.userData.cuffHex||0)};sh.uniforms.uCuffOn={value:mat.userData.cuffHex!=null?1:0};sh.uniforms.uBelt={value:new T.Color(mat.userData.beltHex||0)};sh.uniforms.uBeltOn={value:mat.userData.beltHex!=null?1:0};sh.uniforms.uBuckle={value:new T.Color(mat.userData.buckleHex??mat.userData.beltHex??0)};sh.uniforms.uElbow={value:new T.Color(mat.userData.elbowHex||0)};sh.uniforms.uElbowOn={value:mat.userData.elbowHex!=null?1:0};sh.uniforms.uCut={value:mat.userData.cut};sh.uniforms.uSleeve={value:new T.Color(mat.userData.sleeveHex||0)};sh.uniforms.uSleeveOn={value:mat.userData.sleeveHex!=null?1:0};sh.uniforms.uSleeveB={value:new T.Color(mat.userData.sleeveBHex??mat.userData.sleeveHex??0)};sh.uniforms.uChoker={value:new T.Color(mat.userData.chokerHex||0)};sh.uniforms.uChokerOn={value:mat.userData.chokerHex!=null?1:0};sh.uniforms.uThigh={value:new T.Color(mat.userData.thighHex||0)};sh.uniforms.uThighOn={value:mat.userData.thighHex!=null?1:0};sh.uniforms.uThighB={value:new T.Color(mat.userData.thighBHex??mat.userData.thighHex??0)};sh.uniforms.uSocks={value:new T.Color(mat.userData.socksHex||0)};sh.uniforms.uSocksOn={value:mat.userData.socksHex!=null?1:0};sh.uniforms.uSocksTop={value:mat.userData.socksTop};sh.uniforms.uBand={value:new T.Color(mat.userData.bandHex||0)};sh.uniforms.uBandOn={value:mat.userData.bandHex!=null?1:0};sh.uniforms.uGlove={value:new T.Color(mat.userData.gloveHex||0)};sh.uniforms.uGloveOn={value:mat.userData.gloveHex!=null?(mat.userData.gloveLong?2:1):0};sh.uniforms.uArm={value:new T.Color(mat.userData.armHex||0)};sh.uniforms.uArmOn={value:mat.userData.armHex!=null?(mat.userData.armSide==='L'?1:mat.userData.armSide==='R'?2:3):0};sh.uniforms.uClothMode={value:mat.userData.mode};sh.uniforms.uBoot={value:mat.userData.boot};sh.uniforms.uBootColor={value:new T.Color(mat.userData.bootHex)};sh.uniforms.uMask={value:mat.userData.mask};sh.uniforms.uSkin={value:new T.Color(...mat.userData.skin)};mat.userData.uSkinU=sh.uniforms.uSkin;sh.uniforms.uMaskColor={value:new T.Color(mat.userData.maskHex)};sh.vertexShader='attribute vec3 aClothRef;attribute float aBody;attribute vec3 aPaint;varying vec3 vClothRef;varying float vBody;varying vec3 vPaint;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvClothRef=aClothRef;vBody=aBody;vPaint=aPaint;');sh.fragmentShader='varying vec3 vClothRef;varying float vBody;varying vec3 vPaint;uniform float uGiArm;uniform float uBareZ;uniform vec3 uClothColor;uniform vec3 uCloth2;uniform float uTwo;uniform vec3 uWrist;uniform float uWristOn;uniform float uBootTop;uniform float uLegCut;uniform vec3 uInner;uniform float uInnerOn;uniform vec3 uRoll;uniform vec3 uStripe;uniform float uStripeOn;uniform float uSocksSide;uniform float uKneeSide;uniform vec3 uStrap;uniform float uStrapOn;uniform vec3 uChest;uniform float uChestOn;uniform float uHighCut;uniform vec3 uKnee;uniform float uKneeOn;uniform vec3 uKneeCap;uniform vec3 uLace;uniform float uLaceOn;uniform float uLaceF;uniform float uBriefLo;uniform float uHcY;uniform float uHcW;uniform float uBrief;uniform float uChokerY;uniform float uLegSideW;uniform float uLegSideLo;uniform vec3 uLegSideE;uniform vec3 uPanel;uniform float uPanelOn;uniform float uPanelW;uniform float uPanelTop;uniform vec3 uLegSide;uniform float uLegSideOn;uniform float uHipCut;uniform vec3 uStA;uniform vec3 uStB;uniform float uStOn;uniform float uStK;uniform float uCsOn;uniform float uCsLo;uniform float uCsHi;uniform float uCsW;uniform float uCsWb;uniform vec3 uCsE;uniform float uCsBand;uniform float uCsSl;uniform float uCsHalter;uniform float uCsHeart;uniform float uCsCenter;uniform float uDiaSkinY;uniform float uTopLo;uniform float uTopFrom;uniform vec3 uMesh;uniform float uMeshOn;uniform vec3 uMeshE;uniform float uMeshSide;uniform float uMeshChest;uniform vec3 uTights;uniform float uTightsOn;uniform float uTightsA;uniform float uTightsTop;uniform float uBootLine;uniform float uBandsY[4];uniform vec3 uBands;uniform float uBandsOn;uniform float uBandsW;uniform vec3 uBust;uniform float uBustOn;uniform vec3 uBustE;uniform float uBustLo;uniform float uBustHi;uniform float uBustHole;uniform float uBustW;uniform vec3 uLp;uniform float uLpOn;uniform float uLpTop;uniform float uLpBot;uniform float uLpX;uniform float uLpW;uniform float uLpB;uniform float uUcH;uniform float uUcW;uniform float uUcLo;uniform vec3 uUcE;uniform float uUcEOn;uniform vec3 uSb;uniform float uSbOn;uniform float uSbW;uniform float uSbY[4];uniform vec3 uYoke;uniform float uYokeOn;uniform float uYokeW;uniform vec3 uYn;uniform float uYnOn;uniform vec3 uYnE;uniform float uYnK;uniform vec3 uAn;uniform float uAnOn;uniform vec3 uAnE;uniform float uAnFrom;uniform vec3 uSg;uniform float uSgOn;uniform float uSgY;uniform vec3 uGt;uniform float uGtOn;uniform vec3 uHqA;uniform vec3 uHqB;uniform float uHqOn;uniform float uHqK;uniform float uTcOn;uniform float uTcLo;uniform float uTcHi;uniform float uTcW;uniform vec3 uTcE;uniform float uTcEOn;uniform float uJkLo;uniform float uJkOpen;uniform float uStripeSide;uniform float uStripeZ;uniform float uStripeW;uniform vec3 uBv;uniform float uBvOn;uniform float uBvTop;uniform float uBvBot;uniform float uBvW;uniform float uBvB;uniform float uBvT;uniform float uSuitArm;uniform vec3 uFn;uniform float uFnOn;uniform float uFnTop;uniform float uFnSide;uniform float uFnK;uniform float uThSide;uniform vec3 uNv;uniform float uNvOn;uniform float uNvLo;uniform float uNvW;uniform vec3 uTiger;uniform vec3 uTigerS;uniform float uTigerOn;uniform vec3 uTigerSh;uniform float uTigerShOn;uniform vec3 uHStrap;uniform float uHStrapOn;uniform vec3 uShorts;uniform float uShortsOn;uniform vec3 uShortsE;uniform float uShortsLo;uniform float uShortsTop;uniform float uShortsX;uniform float uShortsFr;uniform float uSuitLow;uniform vec3 uUpper;uniform float uUpperY;uniform float uUpperOn;uniform float uBeltY;uniform float uBotTop;uniform float uBottomA;uniform vec3 uJk;uniform float uJkOn;uniform float uLegEW;uniform vec3 uLegE;uniform float uLegEOn;uniform float uSheerY;uniform float uSheerA;uniform float uSocksA;uniform vec3 uShoe;uniform float uShoeOn;uniform float uShoeTop;uniform float uNoSide;uniform vec4 uDia[6];uniform float uDiaN;uniform vec3 uDiaFill;uniform float uDiaFillOn;uniform vec3 uDiaLine;uniform vec3 uFrill;uniform float uFrillOn;uniform float uSleeveEnd;uniform float uSleeveStart;uniform vec3 uVee;uniform float uVeeOn;uniform vec3 uVeeEdge;uniform vec3 uVeeSide;uniform float uVeeSideOn;uniform float uVeeA;uniform float uVeeLo;uniform vec3 uHem;uniform float uHemOn;uniform vec3 uBottom;uniform float uBottomOn;uniform vec3 uCuff;uniform float uCuffOn;uniform vec3 uBelt;uniform float uBeltOn;uniform vec3 uBuckle;uniform vec3 uElbow;uniform float uElbowOn;uniform float uCut;uniform vec3 uSleeve;uniform float uSleeveOn;uniform vec3 uSleeveB;uniform vec3 uChoker;uniform float uChokerOn;uniform vec3 uThigh;uniform float uThighOn;uniform vec3 uThighB;uniform vec3 uSocks;uniform float uSocksOn;uniform float uSocksTop;uniform vec3 uBand;uniform float uBandOn;uniform vec3 uGlove;uniform float uGloveOn;uniform vec3 uArm;uniform float uArmOn;uniform float uClothMode;uniform float uBoot;uniform vec3 uBootColor;uniform float uMask;uniform vec3 uMaskColor;uniform vec3 uSkin;\n'+clothGLSL+'\n'+sh.fragmentShader;sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nif(diffuseColor.a<.5)diffuseColor=vec4(.658,.393,.309,1.);diffuseColor.a=1.;diffuseColor.rgb=vec3(.956,.701,.565);diffuseColor.rgb*=uSkin*vPaint;if(uTightsOn>.5&&vClothRef.y<uChokerY-.02&&(uTightsTop>8.||(uTightsTop>0.&&vBody>.5&&vClothRef.y<uTightsTop)||(uTightsTop<0.&&vBody>.5&&vClothRef.y>-uTightsTop)))diffuseColor.rgb=mix(diffuseColor.rgb,uTights,uTightsA);if(clothHere(vClothRef,vBody,uClothMode)>.5&&!(vBody>.5&&vClothRef.y>uBotTop-(vClothRef.z>0.?-.03:0.)&&vClothRef.y<1.06)){diffuseColor.rgb=uClothColor;if(uStOn>.5&&vBody>.5&&vClothRef.y>1.06)diffuseColor.rgb=(uStK<0.?fract(atan(vClothRef.x,vClothRef.z)*(-uStK)/6.2832):fract(vClothRef.y*uStK-abs(vClothRef.x)*1.5))<.5?uStA:uStB;if(uTopLo>0.&&vBody>.5&&vClothRef.y>uTopFrom+abs(vClothRef.x)*.25&&vClothRef.y<uTopLo+abs(vClothRef.x)*abs(vClothRef.x)*2.){vec3 sk1=vec3(.956,.701,.565)*uSkin*vPaint;diffuseColor.rgb=uTightsOn>.5?mix(sk1,uTights,uTightsA):sk1;}if(vBody>.5&&vClothRef.y>uSheerY){vec3 sk0=vec3(.956,.701,.565)*uSkin*vPaint;float nt=(fract(vClothRef.x*170.)<.15||fract(vClothRef.y*170.)<.15)?.12:0.;diffuseColor.rgb=mix(sk0,uClothColor,clamp(uSheerA+nt,0.,1.));}if(uTwo>.5&&uClothMode<16.5&&vClothRef.y>1.05&&abs(vClothRef.x)>.07)diffuseColor.rgb=uCloth2;if(uClothMode>11.5&&uClothMode<12.5){float ax2=abs(vClothRef.x);if(vBody>.5&&vClothRef.z<-.01&&ax2<.085-(vClothRef.y-1.08)*.12&&vClothRef.y>1.08&&vClothRef.y<1.275)diffuseColor.rgb=uInnerOn>.5?uInner:diffuseColor.rgb;if(vBody<.5&&ax2>.30&&ax2<.335)diffuseColor.rgb=uRoll;}if(uHemOn>.5&&uClothMode<15.5&&vBody>.5&&vClothRef.y>1.04&&vClothRef.y<1.075+vClothRef.x*vClothRef.x*3.+.02)diffuseColor.rgb=uHem;if(uTigerOn>.5&&vBody>.5){float tx=abs(vClothRef.x),ty=vClothRef.y;bool fr=vClothRef.z<.0;float ve=.015+max(0.,ty-.80)*.2;bool tg=(ty>1.105&&ty<1.235&&tx<.112-max(0.,1.15-ty)*.25)||(fr&&ty>.83&&ty<.985&&tx>ve+.026&&tx<.30);bool shr=uTigerShOn>.5&&fr&&((ty>1.235&&ty<1.30&&tx<.105)||(ty>.86&&ty<1.105&&tx<(ty<.985?ve:.052+(ty-.985)*.15)));if(tg){float t=fract(ty*44.+sin(vClothRef.x*52.+vClothRef.z*37.)*.5+sin(vClothRef.x*17.)*.4);diffuseColor.rgb=t<.24?uTigerS:mix(uTiger,uTiger*.85,t);}else if(shr){diffuseColor.rgb=mix(vec3(.956,.701,.565)*uSkin,uTigerSh,.62);}}if(uBottomOn>.5&&vClothRef.y<1.03&&vBody>.5)diffuseColor.rgb=mix(vec3(.956,.701,.565)*uSkin,uBottom,uSocksA<.99&&uBottomA<.99?uBottomA:uBottomA);if(uChestOn>.5&&vBody>.5&&vClothRef.z<-.01&&abs(vClothRef.x)<.05&&vClothRef.y>1.10)diffuseColor.rgb=uChest;if(uPanelOn>.5&&vBody>.5&&vClothRef.y<uPanelTop&&abs(vClothRef.x)<uPanelW*(vClothRef.z<0.?1.:.8)*(.75+.25*clamp((vClothRef.y-.85)/.2,0.,1.)))diffuseColor.rgb=uPanel;if(uUpperOn>.5&&vBody>.5){float zz=uUpperY+.025*abs(fract(abs(vClothRef.x)*14.)*2.-1.)-abs(vClothRef.x)*.25*(vClothRef.z<0.?1.:0.);if(vClothRef.y>zz)diffuseColor.rgb=uUpper;}if(vBody>.5){float a7=abs(vClothRef.x),y7=vClothRef.y;if(uLegEOn>.5&&y7<1.0&&a7>uHcW+(y7-uHcY)*.85-uLegEW)diffuseColor.rgb=uLegE;if(uJkOn>.5&&y7>uJkLo&&(vClothRef.z>.0||a7>.042+(y7-.96)*.05+uJkOpen))diffuseColor.rgb=uJk;}if(uFrillOn>.5&&vBody>.5&&vClothRef.z<-.01&&vClothRef.y>.84&&vClothRef.y<1.25){float fx=abs(vClothRef.x),fy=vClothRef.y,wv=.006*sin(fy*160.);if(fx<.05+wv){float rr=fract(fy*40.);diffuseColor.rgb=uFrill*(.82+.18*sin(rr*3.1416));if(fx<.009)diffuseColor.rgb=uFrill*.7;}}if(uVeeSideOn>.5&&vBody>.5&&abs(vClothRef.x)>.105&&vClothRef.y>.84&&vClothRef.y<1.07)diffuseColor.rgb=uVeeSide;if(uVeeOn>.5&&vBody>.5&&vClothRef.z<-.01&&vClothRef.y>uVeeLo&&vClothRef.y<1.34){float vy=vClothRef.y,vx=abs(vClothRef.x),hw=.004+.085*(vy-uVeeLo)/(1.34-uVeeLo);if(vx<hw+.011){if(vx>hw)diffuseColor.rgb=uVeeEdge;else{vec3 sk=vec3(.956,.701,.565)*uSkin*vPaint;float gx=fract(vClothRef.x*180.),gy=fract(vy*180.);float net=(gx<.18||gy<.18)?1.:0.;diffuseColor.rgb=mix(sk,uVee,clamp(uVeeA+net*(1.-uVeeA)*.35,0.,1.));if(uLaceOn>.5&&uVeeA>.01&&vy<1.27){float lu=vx/max(hw,.004),lp=fract(vy*26.);if(abs(lu-abs(lp*2.-1.))<.12&&vx<min(hw,.045))diffuseColor.rgb=uLace;}}}}if(uLaceF>.5&&vBody>.5&&vClothRef.z<-.01&&vClothRef.y>.86&&vClothRef.y<1.27){float lx=abs(vClothRef.x);if(lx<.036){if(lx>.027&&(uChokerOn>.5||uHemOn>.5))diffuseColor.rgb=uChokerOn>.5?uChoker:uHem;else{float lu=lx/.027,lp=fract(vClothRef.y*30.);if(abs(lu-abs(lp*2.-1.))<.22)diffuseColor.rgb=uLaceOn>.5?uLace:vec3(.25,.15,.1);}}}if(uClothMode>15.5&&uHemOn>.5&&vBody>.5){float a4=abs(vClothRef.x),y4=vClothRef.y;bool pip=(vClothRef.z<-.01&&abs(vClothRef.x+.012)<.007&&y4>.90)||(a4>.103&&y4>1.17)||y4>1.33||(y4<1.01&&a4>.035+(y4-.83)*.85-.011);if(pip)diffuseColor.rgb=uHem;}if(uClothMode>17.5&&vBody>.5&&vClothRef.y>1.05){float a6=abs(vClothRef.x),y6=vClothRef.y;float cr=length(vec2((a6-.07)/.068,(y6-1.17)/.075));float nr=a6/(.05*max(.001,1.-abs(y6-1.2175)/.1175));if(vClothRef.z<.0&&nr<1.){diffuseColor.rgb=nr>.72?uDiaLine:(uDiaSkinY>0.&&y6<uDiaSkinY?vec3(.956,.701,.565)*uSkin:(uDiaFillOn>.5?uDiaFill:diffuseColor.rgb));}else if(vClothRef.z<.01&&cr>.86&&cr<1.)diffuseColor.rgb=uDiaLine;}if(uClothMode>16.5&&uClothMode<17.5&&vBody>.5){if(uTwo>.5&&vClothRef.x>0.)diffuseColor.rgb=uCloth2;float a5=abs(vClothRef.x),y5=vClothRef.y;if(uInnerOn>.5&&y5>.80&&y5<.98&&a5<.012+(y5-.80)*.45)diffuseColor.rgb=uInner;}if(uCuffOn>.5&&vClothRef.y<.785&&vClothRef.y>.70)diffuseColor.rgb=uCuff;if(uStripeOn>.5&&vBody>.5&&vClothRef.y<.97&&(uStripeSide>.5?(abs(vClothRef.z-uStripeZ)<uStripeW&&abs(vClothRef.x)>.07):(vClothRef.z<-.005&&abs(abs(vClothRef.x)-.085)<.017)))diffuseColor.rgb=uStripe;}if(uClothMode>13.5&&uClothMode<14.5&&vBody>.5){float a3=abs(vClothRef.x),y3=vClothRef.y;if(a3>.112&&y3>.80&&y3<.97&&clothHere(vClothRef,vBody,uClothMode)<.5){float u=y3*11.,w=vClothRef.z*11.;if(abs(fract(u+w)-.5)<.07||abs(fract(u-w)-.5)<.07)diffuseColor.rgb=vec3(.12,.13,.17);}if(y3>.80&&y3<.815&&clothHere(vClothRef,vBody,uClothMode)>.5)diffuseColor.rgb=vec3(.95);}if(uStrapOn>.5&&vBody>.5&&vClothRef.z<0.&&abs(vClothRef.x)<.014&&vClothRef.y>.86&&vClothRef.y<1.0)diffuseColor.rgb=uStrap;if(uBeltOn>.5&&vBody>.5&&vClothRef.y>uBeltY-.02&&vClothRef.y<uBeltY+.017&&abs(vClothRef.x)<.185){diffuseColor.rgb=(abs(vClothRef.x)<.028&&vClothRef.z<0.)?uBuckle:uBelt;}if(vBody<.5){float ax=abs(vClothRef.x);if(uClothMode>16.5&&uClothMode<17.5&&ax>.0&&ax<(uSuitArm>-.5?uSuitArm:(uSleeveOn>.5?uSleeveEnd:.29)))diffuseColor.rgb=(uTwo>.5&&vClothRef.x>0.)?uCloth2:(uUpperOn>.5?uUpper:uClothColor);if(uElbowOn>.5&&ax>.295&&ax<.37)diffuseColor.rgb=uElbow;if(uSleeveOn>.5&&ax>uSleeveStart&&ax<uSleeveEnd){diffuseColor.rgb=uSleeve;if(ax<uSleeveStart+.025||ax>uSleeveEnd-.025)diffuseColor.rgb=uSleeveB;}if(uAnOn>.5&&ax>uAnFrom&&ax<.48){float aq=(vClothRef.z+vClothRef.y)*80.,ar=ax*80.;if(ax<uAnFrom+.016)diffuseColor.rgb=uAnE;else if(fract(ar+aq)<.16||fract(ar-aq)<.16)diffuseColor.rgb=uAn;}if(uGloveOn>.5&&ax>(uGloveOn>1.5?.30:.47)&&ax<.605)diffuseColor.rgb=uGlove;if(uWristOn>.5&&ax>.462&&ax<.522)diffuseColor.rgb=uWrist;if(uArmOn>.5&&ax>.232&&ax<.272&&(uArmOn>2.5||(uArmOn<1.5&&vClothRef.x<0.)||(uArmOn>1.5&&uArmOn<2.5&&vClothRef.x>0.)))diffuseColor.rgb=uArm;}if(giBelt(vClothRef,vBody,uClothMode)>.5)diffuseColor.rgb=vec3(.08);'+'float fy=vClothRef.y;if(uKneeOn>.5&&vBody>.5&&fy>.425&&fy<.565&&abs(vClothRef.x)>.02&&(uKneeSide<.5||(uKneeSide<1.5&&vClothRef.x<0.)||(uKneeSide>1.5&&vClothRef.x>0.))){diffuseColor.rgb=uKnee;if(vClothRef.z<.0&&length(vec2((abs(vClothRef.x)-.088)/.05,(fy-.497)/.05))<1.)diffuseColor.rgb=uKneeCap;}if(uCsOn>.5&&vBody>.5&&clothHere(vClothRef,vBody,uClothMode)>.5){float cx=abs(vClothRef.x),cy=vClothRef.y,cz=vClothRef.z;float tt=clamp((uCsHi-cy)/(uCsHi-uCsLo),0.,1.);float wc=mix(uCsW,uCsWb,tt*tt);float lo=uCsLo-(cx-wc)*uCsSl;bool cut=cy<uCsHi&&cy>lo&&cx>wc&&cz<.06;float ed=.007;if(uCsCenter>0.){float t2=clamp((cy-uCsLo)/(uCsHi-uCsLo),0.,1.);float wcc=mix(uCsW,uCsWb,pow(t2,.8));cut=cz<0.&&cy>uCsLo&&cy<uCsHi&&cx<wcc;bool ee=cz<0.&&cy>uCsLo-ed&&cy<uCsHi+ed&&cx<wcc+ed&&!cut;if(ee){diffuseColor.rgb=uCsE;}}if(uCsHalter>0.&&cy>1.17&&cy<uChokerY-.01&&cx>.045+(uChokerY-cy)*uCsHalter)cut=true;bool hrt=false,hrtE=false;if(uCsHeart>0.&&cz<0.){float hy=uCsHeart;float c1=length(vec2(cx-.017,cy-hy-.012))-.021;float tri=(cy<hy+.012&&cy>hy-.05&&cx<(cy-(hy-.05))*.62)?-1.:1.;float hd=min(c1,tri>0.?1.:-.01);hrt=hd<0.;hrtE=!hrt&&min(c1,(cy<hy+.012&&cy>hy-.056&&cx<(cy-(hy-.056))*.62+.006)?-1.:1.)<.006;}if(hrt)cut=true;if(cut){diffuseColor.rgb=vec3(.956,.701,.565)*uSkin*vPaint;}else if(hrtE||(uCsHalter>0.&&cy>1.17&&cy<uChokerY-.01&&cx>.045+(uChokerY-cy)*uCsHalter-.007))diffuseColor.rgb=uCsE;else if(uCsCenter>0.){if(uCsBand>0.&&abs(cy-uCsBand)<.006&&cz<.0&&cx>.0)diffuseColor.rgb=uCsE;}else if((cy<uCsHi+ed&&cy>lo-ed&&cx>wc-ed&&cz<.06&&(cx<wc||cy>uCsHi||cy<lo))||(uCsBand>0.&&abs(cy-uCsBand)<.006&&cz<.0))diffuseColor.rgb=uCsE;}if(uMeshOn>.5&&vBody>.5&&clothHere(vClothRef,vBody,uClothMode)>.5){float mx=abs(vClothRef.x),my=vClothRef.y,mz=vClothRef.z;float zr=.11-(my-.95)*.15;bool sd=uMeshSide>.5&&my>.92&&my<1.2&&mx>.07&&mz>-zr*.55&&mz<zr*.55;bool ch=uMeshChest>.5&&mz<0.&&my>1.14&&my<1.25&&mx<.008+(my-1.14)*.42;if(sd||ch){vec3 skm=vec3(.956,.701,.565)*uSkin*vPaint;vec2 q=vec2((ch?vClothRef.x:mz)*95.,my*95.);q.x+=floor(q.y)*.5;vec2 f=fract(q)-.5;float d=length(f);bool edgeL=sd&&(abs(abs(mz)-zr*.55)<.006);diffuseColor.rgb=edgeL?uMeshE:(d<.3?skm:uMesh);}}if(uBandsOn>.5&&vBody>.5&&abs(vClothRef.x)<.2){for(int q=0;q<4;q++){if(abs(fy-uBandsY[q])<uBandsW)diffuseColor.rgb=uBands;}}if(uYokeOn>.5&&vBody>.5&&fy>1.12&&fy<uChokerY&&abs(vClothRef.x)<uYokeW&&clothHere(vClothRef,vBody,uClothMode)<.5){float yx=abs(vClothRef.x);bool sk=false,ye=false;if(uCsHalter>0.){float hl=.045+(uChokerY-fy)*uCsHalter;if(yx>hl)sk=true;else if(yx>hl-.007)ye=true;}if(uCsHeart>0.&&vClothRef.z<0.){float c1=length(vec2(yx-.017,fy-uCsHeart-.012))-.021;if(c1<0.)sk=true;else if(c1<.006)ye=true;}if(!sk){if(uYnOn>.5){float nq=(vClothRef.x+vClothRef.z)*uYnK,ny=fy*uYnK;if(yx>uYokeW-.01)diffuseColor.rgb=uYnE;else if(fract(ny+nq)<.16||fract(ny-nq)<.16)diffuseColor.rgb=uYn;}else diffuseColor.rgb=ye?uCsE:uYoke;}}if(uJkOn>.5&&uJkLo>1.&&vBody>.5){float ja=abs(vClothRef.x);if(fy>uJkLo&&fy<uChokerY-.035&&ja<.205&&!(ja>.175&&fy>1.15&&fy<1.29)&&(vClothRef.z>.0||ja>.042+uJkOpen+(fy-uJkLo)*.12))diffuseColor.rgb=(fy<uJkLo+.012)?uJk*.8:uJk;}if(uBustOn>.5&&vBody>.5&&vClothRef.z<.0){float bx=abs(vClothRef.x),lo=uBustLo-max(0.,.05-bx)*.5;if(fy>lo-.007&&fy<uBustHi&&bx<uBustW)diffuseColor.rgb=fy<lo?uBustE:uBust;if(uBustHole>.0){float hr=length(vec2(bx/uBustHole,(fy-uBustHi-.018)/(uBustHole*.75)));if(hr<1.)diffuseColor.rgb=hr>.8?uBustE:vec3(.956,.701,.565)*uSkin*vPaint;}}if(uSbOn>.5&&vBody>.5&&abs(vClothRef.x)>.1&&abs(vClothRef.z)<.07&&clothHere(vClothRef,vBody,uClothMode)>.5){for(int q=0;q<4;q++){if(abs(fy-uSbY[q])<uSbW)diffuseColor.rgb=uSb;}}if(uUcH>0.&&vBody>.5&&vClothRef.z<.0&&fy>uUcLo-.008&&clothHere(vClothRef,vBody,uClothMode)>.5){float ux=abs(vClothRef.x)/uUcW,top=uUcLo+uUcH*(1.-ux*ux);if(ux<1.08&&fy<top+.008){bool inside=ux<1.&&fy>uUcLo&&fy<top;diffuseColor.rgb=inside?vec3(.956,.701,.565)*uSkin:(uUcEOn>.5?uUcE:diffuseColor.rgb);}}if(uNvOn>.5&&vBody>.5&&vClothRef.z<.0&&fy>uNvLo&&fy<uChokerY+.02&&abs(vClothRef.x)<uNvW*min(1.,(fy-uNvLo)/(uChokerY-.03-uNvLo)))diffuseColor.rgb=uNv;if(uTigerShOn>.5&&vBody>.5&&vClothRef.z<.0&&fy>1.20&&fy<uChokerY-.015&&clothHere(vClothRef,vBody,uClothMode)<.5){float ax9=abs(vClothRef.x);if(ax9<.105)diffuseColor.rgb=mix(vec3(.956,.701,.565)*uSkin,uTigerSh,.62);else if(ax9<.15)diffuseColor.rgb=uClothColor;}if(uHStrapOn>.5&&vBody>.5&&vClothRef.z<.02&&fy>1.20&&fy<uChokerY){float xc=.092-(fy-1.20)/(uChokerY-1.20)*.055;if(abs(abs(vClothRef.x)-xc)<.017)diffuseColor.rgb=uHStrap;}if(uLpOn>.5&&vBody>.5&&fy>uLpBot&&fy<uLpTop+.02){float lt=clamp((fy-uLpBot)/(uLpTop-uLpBot),0.,1.),lx=uLpX*lt;bool fr=vClothRef.z<.0&&abs(abs(vClothRef.x)-lx)<uLpW;bool bk=uLpB>.5&&vClothRef.z>.0&&fy>uLpTop-.06&&abs(abs(vClothRef.x)-uLpX)<uLpW;if(fr||bk)diffuseColor.rgb=uLp;}if(uChokerOn>.5&&vBody>.5&&fy>uChokerY-.02&&fy<uChokerY+.02&&abs(vClothRef.x)<.075)diffuseColor.rgb=uChoker;if(uThighOn>.5&&vBody>.5&&fy>.60&&fy<.68&&(uThSide<.5||(uThSide<1.5&&vClothRef.x<0.)||(uThSide>1.5&&vClothRef.x>0.))&&clothHere(vClothRef,vBody,uClothMode)<.5){diffuseColor.rgb=(fy>.625&&fy<.645)?uThighB:uThigh;}if(uFnOn>.5&&vBody>.5&&fy<uFnTop&&abs(vClothRef.x)>.01&&(uFnSide<.5||(uFnSide<1.5&&vClothRef.x<0.)||(uFnSide>1.5&&vClothRef.x>0.))&&clothHere(vClothRef,vBody,uClothMode)<.5){float sq=(vClothRef.x+vClothRef.z)*uFnK,qy=fy*uFnK;if(fract(qy+sq)<.13||fract(qy-sq)<.13)diffuseColor.rgb=uFn;else if(fy>uFnTop-.012)diffuseColor.rgb=uFn;}if(uSocksOn>.5&&vBody>.5&&fy<uSocksTop&&!(uKneeOn>.5&&fy>.425&&fy<.565)&&(uSocksSide<.5||(uSocksSide<1.5&&vClothRef.x<0.)||(uSocksSide>1.5&&vClothRef.x>0.))&&clothHere(vClothRef,vBody,uClothMode)<.5){{vec3 sc2=uSocks;if(uSgOn>.5){float la=atan(vClothRef.z,abs(vClothRef.x)-.09);float jg=abs(fract(la*1.6)-.5)*2.;float t=clamp((uSgY+.05*jg-fy)/.06,0.,1.);sc2=mix(uSocks,uSg,t);}diffuseColor.rgb=(uBandOn>.5&&fy>uSocksTop-.035)?uBand:mix(vec3(.956,.701,.565)*uSkin,sc2,uSocksA);}}if(uGtOn>.5&&vBody>.5&&fy>uSocksTop-.01&&fy<uShortsLo+.02&&clothHere(vClothRef,vBody,uClothMode)<.5){float ga=atan(vClothRef.z,abs(vClothRef.x)-.09);if(abs(abs(ga)-1.25)<.16)diffuseColor.rgb=uGt;}if(uHqOn>.5){bool legQ=vBody>.5&&uSocksOn>.5&&fy<uSocksTop&&clothHere(vClothRef,vBody,uClothMode)<.5&&!(uKneeOn>.5&&fy>.425&&fy<.565);bool armQ=vBody<.5&&uGloveOn>.5&&abs(vClothRef.x)>(uGloveOn>1.5?.30:.47)&&abs(vClothRef.x)<.605;if(legQ||armQ){float u=(legQ?(vClothRef.z*1.4+(abs(vClothRef.x)-.09)*(vClothRef.x>0.?1.:-1.)):(vClothRef.z+vClothRef.y*1.2))*uHqK,v=(legQ?fy:abs(vClothRef.x))*uHqK*.55;bool c1=fract(u+v)<.5,c2=fract(u-v)<.5;diffuseColor.rgb=(c1==c2)?uHqA:uHqB;}}if(vBody>.5&&fy<(uBoot>.5?.5:uBootTop)&&!(uBoot>.5&&clothHere(vClothRef,vBody,uClothMode)>.5)){if(uBoot>.5){diffuseColor.rgb=vec3(.956,.701,.565)*uSkin*vPaint;}else{vec3 bc=uBootColor;if(fy>uBootTop-.045)bc=bc*.6+vec3(.06);else if(fy<.035)bc=bc*.35;else if(abs(vClothRef.z+.06)<.012&&fy>.12&&abs(abs(vClothRef.x)-.085)<.03){if(uLaceOn>.5){float lx=abs(abs(vClothRef.x)-.085)/.03,ph=fract(fy*42.);if(abs(lx-abs(ph*2.-1.))<.28)bc=uLace;}else if(uBootLine>.5)bc=mix(bc,vec3(1.),.45);}diffuseColor.rgb=bc*.95;if(uShoeOn>.5&&fy<uShoeTop)diffuseColor.rgb=fy<.03?uShoe*.5:uShoe;if(uBareZ<8.){vec3 skf=vec3(.956,.701,.565)*uSkin*vPaint;bool wrap=(fy>.075)||(fy>.015&&vClothRef.z>uBareZ&&!(fy<.05&&vClothRef.z>uBareZ+.085));diffuseColor.rgb=wrap?uBootColor*(fract(fy*55.+vClothRef.z*8.)<.12?.82:1.):skf;}}}'+'if(vBody>.5){float lx=abs(vClothRef.x),ly=vClothRef.y;float ex=.14-(1.02-ly)*.075;if(uLegSideOn>.5&&ly>uLegSideLo&&ly<1.04&&lx>ex+.06-uLegSideW&&lx<ex+.07&&clothHere(vClothRef,vBody,uClothMode)<.5){diffuseColor.rgb=uLegSide;if(abs(lx-(ex+.06-uLegSideW))<.005)diffuseColor.rgb=uLegSideE;}if(uShortsOn>.5){float sz=vClothRef.z,lo2=uShortsLo+max(0.,-sz-.01)*uShortsFr;bool sideOk=sz>.0||lx>ex-.005+uShortsX;if(ly>lo2&&ly<uShortsTop&&sideOk&&!(sz<0.&&clothHere(vClothRef,vBody,uClothMode)>.5)){diffuseColor.rgb=ly<lo2+.012?uShortsE:uShorts;}}if(uBvOn>.5&&vClothRef.z<.0&&ly>uBvBot&&ly<uBvTop&&lx<uBvB+uBvW*pow((ly-uBvBot)/(uBvTop-uBvBot),.85)&&(uBvT<=0.||lx>uBvB+uBvW*pow((ly-uBvBot)/(uBvTop-uBvBot),.85)-uBvT*(1.+(ly-uBvBot)*3.)))diffuseColor.rgb=uBv;if(uTcOn>.5&&ly>uTcLo&&ly<uTcHi){float tt=(ly-uTcLo)/(uTcHi-uTcLo),hw=uTcW*sin(tt*3.1416),ax=lx;float oe=ex+.055;float d=abs(vClothRef.z)/max(.001,hw);if(ax>oe-.045&&d<1.){diffuseColor.rgb=(uTcEOn>.5&&d>.8)?uTcE:vec3(.956,.701,.565)*uSkin*vPaint;}}if(uHipCut>.5&&length(vec2((lx-.155)/.022,(ly-.885)/.035))<1.&&vClothRef.z<.03)diffuseColor.rgb=vec3(.956,.701,.565)*uSkin*vPaint;}if(uDiaN>.5&&vBody>.5&&vClothRef.z<.0){for(int q=0;q<6;q++){if(float(q)>=uDiaN)break;vec4 e=uDia[q];float dd=abs(abs(vClothRef.x)-e.x)/e.z+abs(fy-e.y)/e.w;if(dd<1.){diffuseColor.rgb=(dd>1.-.022/min(e.z,e.w))?uDiaLine:(uDiaFillOn>.5?uDiaFill:diffuseColor.rgb);}}}if(uMask>.5&&fy>1.37){diffuseColor.rgb=uMaskColor;}');};mat.customProgramCacheKey=()=> 'yomiai-skin-104';return mat;}
function hairStrandColor(o,look,i,c1,c2,c3){if(!look.hairFx||look.hairFx==='wild')return c1;const g=o.geometry;g.computeBoundingBox();const cx=(g.boundingBox.min.x+g.boundingBox.max.x)/2;
 if(look.hairFx==='split')return cx>0?c2:c1;
 if(look.hairFx==='tri')return cx>.035?c2:cx<-.035?c1:c3;
 const h=Math.abs(Math.sin(i*12.9898)*43758.5453)%1;return h<.22?c2:c1;}
function wildStrand(o,i){if(!/外形|毛先/.test(o.name))return;const p=o.geometry.attributes.position;if(!p||p.count<3)return;const root=new T.Vector3().fromBufferAttribute(p,p.count-2),h=k=>Math.abs(Math.sin((i+k)*78.233)*43758.5453)%1;
 const q=new T.Quaternion().setFromEuler(new T.Euler((h(1)-.5)*.5,(h(2)-.5)*.3,(h(3)-.5)*.5)),v=new T.Vector3();for(let k=0;k<p.count;k++){v.fromBufferAttribute(p,k).sub(root).applyQuaternion(q).multiplyScalar(1.06).add(root);p.setXYZ(k,v.x,v.y,v.z);}p.needsUpdate=true;}
/* HairKit01：髪型メモ（data/hair_style.json）を3Dの髪に反映する。素材の髪（頭の空間：上+y・顔の前+z・後ろ-z）を、部品ごとに変形し、飾りを足す。 */
function hkGroup(n){return String(n||'').replace(/_?\d+$/,'');}
function hkHash(i,k){return Math.abs(Math.sin((i*12.9898+k*78.233))*43758.5453)%1;}
function hkMat(c){const m=new T.MeshBasicMaterial({color:new T.Color(c),side:T.DoubleSide});m.name='HairLab_runtime';return m;}
function hkEach(o,fn){const p=o.geometry.attributes.position;if(!p)return;const v=new T.Vector3();for(let k=0;k<p.count;k++){v.fromBufferAttribute(p,k);fn(v,k);p.setXYZ(k,v.x,v.y,v.z);}p.needsUpdate=true;o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();}
function hkCenter(o){o.geometry.computeBoundingBox();return o.geometry.boundingBox.getCenter(new T.Vector3());}
const HK_C=new T.Vector3(0,.18,-.22); // 頭の中心（素材の空間）
// 名簿にない選手（新人・オリジナル）は、番号から控えめなバリエーションを決める
function hkRandom(no,look){const r=k=>hkHash(no,k),h={};const hr=look.hair||'ショート';
 h.bangs=['down','down','side','center','up'][Math.floor(r(1)*5)];if(h.bangs==='down')delete h.bangs;
 if(hr==='ショート'){if(r(2)<.45)h.bob=.55;if(r(3)<.5)h.flip=.65;if(r(4)<.15)h.spike=.55;}
 if(hr==='ロング'){if(r(5)<.35)h.wave=.55;h.len=[.72,1,1,1.12][Math.floor(r(6)*4)];}
 if(hr==='ポニー'||hr==='ツイン'){if(r(7)<.4)h.tieHigh=1;if(r(8)<.3)h.acc=[{k:'ribbon',c:['#d03a3a','#7cc8ec','#f2f0ea','#ec8ab4'][Math.floor(r(9)*4)],pos:hr==='ツイン'?'twin':'tie'}];}
 if(r(10)<.12)h.ahoge=1;return h;}
function hairKit(hair,hs,color,look,mats){const add=[],strands=[];hair.traverse(o=>{if(o.isMesh&&o.material&&o.material.name==='HairLab_runtime')strands.push(o);});
 const hairMat=strands[0]&&!look.vkCol?strands[0].material:hkMat(color);const knot={pony:new T.Vector3(0,.36,-.85)};
 strands.forEach((o,i)=>{const g=hkGroup(o.name),c=hkCenter(o),front=/前髪/.test(g),side=/こめかみ/.test(g),outer=/外形/.test(g),top=/頭頂の重なり|頭皮に沿う/.test(g),tail=/流れる毛先|結び目の巻き毛|連続巻き毛/.test(g),conv=/結び目へ収束|頭頂から結び目/.test(g),isLong=/ロング/.test(g);
  // 前髪
  // 前髪の長さ：目のあたりまで下ろす（短い前髪の選手は bangLen:1 のまま）
  if(front&&hs.bangs!=='up'&&hs.bangs!=='spiky'){const k=(hs.bangLen??1.45)*(.88+.24*hkHash(i,11));if(k>1.01){const y0=.62;const fx=Math.max(-1,Math.min(1,c.x/.35));hkEach(o,v=>{if(v.y>=y0)return;const d=y0-v.y,nd=d*k,t=Math.min(1,(nd-d)/.35);v.y=y0-nd;v.z+=.05*t;v.x=v.x*(1+.10*t)+fx*.07*t;});}}
  if(front&&hs.bangs){const b=hs.bangs;
   if(b==='up'){o.visible=false;}
   else if(b==='center'){if(Math.abs(c.x)<.13)o.visible=false;else hkEach(o,v=>{const t=Math.max(0,(.70-v.y)/.66);v.x+=Math.sign(c.x)*.13*t;v.y+=.10*t*(1-Math.min(1,Math.abs(c.x)/.4));});}
   else if(b==='side'||b==='asym'){const dir=hkHash(look.seed||1,3)<.5?1:-1,k=b==='asym'?1.6:1;hkEach(o,v=>{const t=Math.max(0,(.70-v.y)/.66);v.x+=dir*.20*k*t;v.y+=(Math.sign(v.x)===-dir?.12:0)*t*k;if(b==='asym')v.y-=.10*t*(Math.sign(v.x)===dir?1:0);});}
   else if(b==='spiky'){hkEach(o,v=>{const t=Math.max(0,(.70-v.y)/.66);v.y+=.62*t*(.8+.4*hkHash(i,1));v.z+=.10*t;v.x+=(hkHash(i,2)-.5)*.2*t;});}}
  // 逆立ち（頭頂の毛先をとがらせて外へ）
  // ボリューム
  if((hs.vol||hs.afro)&&(outer||top||side||tail)){const k=1+.22*(hs.vol||0)+(hs.afro?.25:0);hkEach(o,v=>{v.x=HK_C.x+(v.x-HK_C.x)*k;v.z=HK_C.z+(v.z-HK_C.z)*k;if(v.y>HK_C.y)v.y=HK_C.y+(v.y-HK_C.y)*(1+(k-1)*.6);});}
  // ボブ（短い髪をあごの下まで伸ばす）
  if(hs.bob&&(outer||side)&&!isLong){hkEach(o,v=>{if(v.y<.20)v.y-=(.20-v.y)*.95*hs.bob;});}
  // ロングの長さ
  if(hs.len&&(outer||side)&&isLong){hkEach(o,v=>{if(v.y<0)v.y*=hs.len;});}
  // ウェーブ（毛先へ向かってうねる）
  if(hs.wave&&((outer&&isLong)||tail||(side&&isLong))){const A=.10*hs.wave;hkEach(o,v=>{if(v.y>0)return;const t=Math.min(1,-v.y/.6);v.x+=A*t*Math.sin(v.y*7+i*.7);v.z+=A*.7*t*Math.cos(v.y*6+i);});}
  // 外ハネ（毛先を外へ跳ね上げる）
  if(hs.flip&&(outer||side||(hs.wolf&&/うなじ/.test(g)))){const y0=hs.bob?-.10:.10,lo=o.geometry.boundingBox.min.y;hkEach(o,v=>{if(v.y>y0||v.y<-1.6)return;const r=Math.min(1,(y0-v.y)/Math.max(.15,y0-lo));const d=new T.Vector3(v.x,0,v.z-HK_C.z);if(d.lengthSq()<1e-6)return;d.normalize();v.addScaledVector(d,.30*hs.flip*r*r);v.y+=.20*hs.flip*r*r;});}
  // ウルフ：えり足を外へ散らす
  if(hs.wolf&&(outer||/うなじ/.test(g))){hkEach(o,v=>{if(v.y>-.05||v.z>-.2)return;const r=Math.min(1,(-.05-v.y)/.4);v.z-=.10*r;v.x+=(hkHash(i,7)-.5)*.16*r;});}
  // 結ぶ位置（ハイポニー・ハイツイン／低い位置）と毛先の長さ
  const tieDy=hs.tieHigh===1?.30:hs.tieHigh===-1?-.30:0,tieDz=hs.tieHigh===1?.10:0;
  if(tail&&hs.braid==='twin'&&/ツイン/.test(g)){o.visible=false;}
  if(tail){if(tieDy){hkEach(o,v=>{v.y+=tieDy;v.z+=tieDz;});}
   if(hs.tail&&hs.tail!==1){const kn=c.clone();kn.y=o.geometry.boundingBox.max.y;hkEach(o,v=>{v.y=kn.y+(v.y-kn.y)*hs.tail;v.z=kn.z+(v.z-kn.z)*Math.min(1.2,hs.tail);v.x=kn.x+(v.x-kn.x)*Math.min(1.2,hs.tail);});}
   if(/流れる毛先/.test(g)){const bb=o.geometry.boundingBox;knot[g]=new T.Vector3((bb.min.x+bb.max.x)/2,bb.max.y,(bb.min.z+bb.max.z)/2);}}
  if(conv&&tieDy){hkEach(o,v=>{const w=Math.max(0,1-v.distanceTo(new T.Vector3(Math.sign(v.x)*Math.min(Math.abs(v.x),.5),.36,-.80))/.55);v.y+=tieDy*w;v.z+=tieDz*w;});}
  // マスクの選手は前髪・頭頂の飾りを出さない（素材側で隠れる）
 });
 const G=new T.Group();G.name='HairKit_extra';hair.add(G);const mk=(geo,c,pos,rot,sc)=>{const m=new T.Mesh(geo,c?hkMat(c):hairMat);if(pos)m.position.copy(pos);if(rot)m.rotation.set(...rot);if(sc)m.scale.set(...sc);G.add(m);if(mats)mats.push(m.material);return m;};
 const tube=(pts,r,c,seg=24)=>mk(new T.TubeGeometry(new T.CatmullRomCurve3(pts),seg,r,6,false),c);
 // 逆立った髪：とがった毛束を、頭の上半分に外向きに植える（ツートンは左右で色を分ける）
 if(hs.spike&&!hs.afro){const n=Math.round(14+12*hs.spike),c2=HC[look.hair2]||null,split=look.hairFx==='split'&&c2;let k=0;
  for(let j=0;j<n*3&&k<n;j++){const yy=1-2*((j+.5)/(n*3)),rr=Math.sqrt(1-yy*yy),th=j*2.39996,d=new T.Vector3(Math.cos(th)*rr,yy,Math.sin(th)*rr);
   if(d.y<-.05||(d.z>.35&&d.y<.55))continue;k++;const r=hkHash(look.seed||1,j),L=(.20+.24*r)*(.6+.4*hs.spike)*(1+.25*Math.max(0,d.y)),dir=d.clone();dir.y+=.35;dir.normalize();
   const cone=mk(new T.ConeGeometry(.085+.05*r,L,5),split?(d.x>0?'#'+new T.Color(c2).getHexString():null):null,HK_C.clone().addScaledVector(d,.50).addScaledVector(dir,L*.45));cone.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir);}}
 // 放射状のとがった毛束（rays）：頭のまわりに外向きに細い毛束を植える。{n 本数, len 長さ, w 太さ, minY 下の限界, up 上向き, r 植える半径, front 顔の前を空ける}
 if(hs.rays){const R0=hs.rays,n=R0.n||60,Lb=R0.len??.42,Wb=R0.w??.05,minY=R0.minY??-.45,up=R0.up??.25,rad=R0.r??.50,fr=R0.front??.55;let k=0;
  const NS=R0.even?Math.round(n/Math.max(.05,(1-(R0.minY??-.45))/2)):n*4;for(let j=0;j<NS&&(R0.even||k<n);j++){const yy=1-2*((j+.5)/NS),rr=Math.sqrt(1-yy*yy),th=j*2.39996,d=new T.Vector3(Math.cos(th)*rr,yy,Math.sin(th)*rr);
   if(d.y<minY||(d.z>fr&&d.y<.45)||(R0.frontAll!=null&&d.z>R0.frontAll))continue;k++;const r=hkHash(look.seed||1,j+77),L=Lb*(.6+.7*r)*(1+.3*Math.max(0,d.y))*(1-(R0.nape??0)*Math.max(0,-d.y)),dir=d.clone();dir.y+=up;dir.z-=(R0.back??0);dir.x+=(hkHash(j,5)-.5)*.3;dir.normalize();
   const cone=mk(new T.ConeGeometry(Wb*(.7+.6*r),L,4),null,HK_C.clone().addScaledVector(d,rad).addScaledVector(dir,L*.45));cone.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir);}}
 // アホ毛
 if(hs.ahoge&&!look.mask&&hs.ahogeArc){const A=hs.ahogeArc,L=(hs.ahogeLen||1);for(let a=0;a<hs.ahoge;a++){const d=a?1:-1,w=a?(A.wR??1):(A.wL??1),y0=A.y??.66,z0=A.z??-.02;tube([new T.Vector3(d*.02,y0,z0),new T.Vector3(d*.12*L*w,y0+.30*L,z0-.04),new T.Vector3(d*.42*L*w,y0+.46*L,z0-.10),new T.Vector3(d*.78*L*w,y0+.30*L,z0-.12),new T.Vector3(d*.95*L*w,y0+.08*L,z0-.08)],.024,null,24);}}else if(hs.ahoge&&!look.mask){const L=(hs.ahogeLen||1);for(let a=0;a<hs.ahoge;a++){const sx=hs.ahoge===2?(a?.10:-.10):0;tube([new T.Vector3(sx,.68,.05),new T.Vector3(sx*1.6,.68+.22*L,.10),new T.Vector3(sx*2.2+.04,.68+.36*L,.24*L),new T.Vector3(sx*2.4+.06,.68+.30*L,.34*L)],.028,null,16);}}
 // アフロ
 if(hs.afro){const ge=new T.IcosahedronGeometry(.78,3),p=ge.attributes.position,v=new T.Vector3();for(let k=0;k<p.count;k++){v.fromBufferAttribute(p,k);v.multiplyScalar(1+.08*Math.sin(v.x*23)*Math.sin(v.y*19)*Math.sin(v.z*21));p.setXYZ(k,v.x,v.y,v.z);}ge.computeVertexNormals();mk(ge,null,new T.Vector3(0,.38,-.30),null,[1,.92,1]);}
 // 縦ロール（両サイド）
 if(hs.drill2){const D=hs.drill2,n=D.n||2,turns=D.turns||5,len=D.len||1.05,r0=D.r||.11;const base=new T.Color(color);
  for(const sx of [-1,1])for(let j=0;j<n;j++){const zoff=(D.z??.02)-j*(D.dz??.16),xo=(D.x??.58)+j*.03,y0=(D.y??.08)+j*.04,L=len*(1-j*.12),ph0=j*1.7+(sx>0?0:.9),tn=turns*(1-j*.1),pitch=L/tn;
   const N=Math.round(tn*32),V=5,pos=[],col=[],idx=[];
   for(let k=0;k<=N;k++){const t=k/N,a=ph0+t*Math.PI*2*tn*(sx>0?1:-1),taper=(1-.45*t)*(t<.05?.55+t/.05*.45:1),r=r0*taper,cx=sx*(xo+.04*t),cy=y0-L*t,cz=zoff+.03*t;
    const hw=pitch*.62*(1-.3*t);
    for(let q=0;q<V;q++){const u=q/(V-1),bulge=Math.sin(u*Math.PI)*r*.28;const rr=r+bulge;const px=cx+rr*Math.cos(a)*sx,pz=cz+rr*Math.sin(a),py=cy+hw*(1-2*u);
     const lit=.62+.38*(.5+.5*Math.sin(a+.6)),edge=.55+.45*Math.sin(u*Math.PI);const sh=lit*edge*(.9+.1*(1-t));
     pos.push(px,py,pz);col.push(Math.min(1,base.r*sh*1.12),Math.min(1,base.g*sh*1.12),Math.min(1,base.b*sh*1.12));}
    if(k<N)for(let q=0;q<V-1;q++){const b=k*V+q;idx.push(b,b+V,b+1,b+1,b+V,b+V+1);}}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);
   const mt=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});mats.push(mt);const me=new T.Mesh(g,mt);me.name='HK_drill2';me.frustumCulled=false;G.add(me);
   const core=[];for(let k=0;k<=20;k++){const t=k/20;core.push(new T.Vector3(sx*(xo+.04*t),y0-L*t*.96,zoff+.03*t));}const cm=tube(core,r0*.6,null,40);cm.material=new T.MeshBasicMaterial({color:base.clone().multiplyScalar(.55),side:T.DoubleSide});mats.push(cm.material);}}
 if(hs.drill){for(const sx of [-1,1]){const pts=[];for(let k=0;k<=40;k++){const t=k/40,a=t*Math.PI*2*4.5;pts.push(new T.Vector3(sx*(.58+.10*Math.cos(a)),.05-1.05*t,.02+.10*Math.sin(a)));}tube(pts,.075*(1-.35*(pts.length?0:0)),null,120);}}
 // 三つ編み
 const braid=(from,to,r)=>{const n=11;for(let k=0;k<n;k++){const t=k/(n-1),p=from.clone().lerp(to,t);p.x+=(k%2?1:-1)*r*.35;const m=mk(new T.SphereGeometry(r*(1-.25*t),10,8),null,p,[0,0,(k%2?1:-1)*.5],[1,1.35,1]);}};
 if(hs.braid==='twin'||hs.braid==='sides'){const r=hs.braid==='sides'?.045:.09,L=hs.braid==='sides'?-.75:-1.15;for(const sx of [-1,1])braid(new T.Vector3(sx*.55,-.05,-.12),new T.Vector3(sx*.62,L,.02),r);}
 if(hs.braid==='left')braid(new T.Vector3(-.56,.05,-.05),new T.Vector3(-.60,-.95,.08),.075);
 if(hs.braid==='back')braid(new T.Vector3(0,-.10,-.85),new T.Vector3(0,-1.70,-1.05),.11);
 // 飾り
 const at=pos=>{const k=Object.keys(knot).filter(x=>/流れる毛先/.test(x));if(pos==='tie'&&k.length)return [knot[k[0]].clone().add(new T.Vector3(0,.04,.02))];if(pos==='tie')return [new T.Vector3(0,.36+(hs.tieHigh===1?.30:0),-.86)];
  if(pos==='twin'){if(k.length>=2)return k.map(x=>knot[x].clone());return [new T.Vector3(-.52,.42,-.32),new T.Vector3(.52,.42,-.32)];}if(pos==='left')return [new T.Vector3(-.50,.40,-.05)];if(pos==='bun')return [new T.Vector3(-.45,.62,-.25),new T.Vector3(.45,.62,-.25)];return [new T.Vector3(.30,.68,-.05)];};
 for(const a of hs.acc||[]){
  if(a.k==='headband'){const hb=hs.hb||{},R=.545*(hb.r||1),Y=.33+(hb.y||0),Z=-.20+(hb.z||0),TL=hb.tail||1;const tor=mk(new T.TorusGeometry(R,.05*(hb.w||1),6,40),a.c,new T.Vector3(0,Y,Z),[Math.PI/2+.30+(hb.tilt||0),0,0],[1.02,1.12,1]);if(a.tails){const bz=Z-.68*R/.545,by=Y-.01-(hb.tilt||0)*.4;for(const sx of [-1,1])tube(TL>1.2?[new T.Vector3(sx*.04,by,bz),new T.Vector3(sx*.09,by-.25,bz-.16),new T.Vector3(sx*.15,by-.60*TL,bz-.26),new T.Vector3(sx*.22,by-1.0*TL,bz-.30)]:[new T.Vector3(sx*.05,by,bz),new T.Vector3(sx*.18*TL,by-.22*TL,bz-.17*TL),new T.Vector3(sx*.30*TL,by-.52*TL,bz-.27*TL)],.035*(hb.w||1),a.c,TL>1.2?16:10);}}
  else if(a.k==='roses'){const R=.6*(a.r||1),Y=a.y??.18,Z=a.z??.02,TL=a.tilt??.35,N=a.n||7,SP=a.span||1.35,sz=.05*(a.sz||1);const rose=(pos,nrm)=>{const g=new T.Group();g.position.copy(pos);g.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),nrm);const cA=new T.Color(a.c||'#b0202e'),cB=new T.Color(a.c2||'#7a1020');const layers=[[3,.35,.9],[5,.62,.55],[6,.88,.25],[7,1.0,.05]];layers.forEach(([np,rr,tilt],li)=>{for(let k=0;k<np;k++){const ang=k/np*Math.PI*2+li*.6;const pg=new T.SphereGeometry(sz*.55,8,6,0,Math.PI*.9,0,Math.PI*.5);const col=cA.clone().lerp(cB,li===0?1:li/4);const m=mk(pg,'#'+col.getHexString());g.remove&&0;G.remove(m);m.position.set(Math.cos(ang)*sz*rr*.55,Math.sin(ang)*sz*rr*.55,sz*(.3-li*.12));m.rotation.set(Math.PI/2-tilt,0,ang-Math.PI/2,'ZXY');m.rotation.order='ZXY';m.scale.set(1,1.2,.5);g.add(m);}});const core=mk(new T.SphereGeometry(sz*.28,8,6),'#'+cB.getHexString());G.remove(core);core.position.set(0,0,sz*.35);g.add(core);if(a.leaf!==0){for(const la of [2.2,4.0]){const lg=new T.SphereGeometry(sz*.5,6,4);const lf=mk(lg,a.lc||'#2a7a40');G.remove(lf);lf.scale.set(.45,1.2,.15);lf.position.set(Math.cos(la)*sz*1.0,Math.sin(la)*sz*1.0,-sz*.1);lf.rotation.z=la-Math.PI/2;g.add(lf);}}G.add(g);};for(let k=0;k<N;k++){const ang=-SP+2*SP*k/(N-1);const x=Math.sin(ang)*R,zz=Math.cos(ang)*R;const pos=new T.Vector3(x,Y+Math.cos(ang)*R*TL*.0,Z+zz-R).add(new T.Vector3(0,0,0));const p2=new T.Vector3(x,Y-(1-Math.cos(ang))*R*TL,Z+zz);const nrm=new T.Vector3(Math.sin(ang),.35,Math.cos(ang)).normalize();rose(p2,nrm);}}
  else if(a.k==='lilies'){const R=.6*(a.r||1),Y=a.y??.3,Z=a.z??-.1,TL=a.tilt??.35,N=a.n??5,SP=a.span||1.2,sz=.09*(a.sz||1);const cP=a.c||'#c82838',cI=a.c2||'#f0c040';const lily=(pos,nrm,big)=>{const g=new T.Group();g.position.copy(pos);g.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),nrm);const S=sz*(big||1);for(let k=0;k<6;k++){const ang=k/6*Math.PI*2+(k%2?Math.PI/6:0)*0;const L=S*(k%2?1.0:.92),W=S*(a.pw??.4);const sh=new T.Shape();sh.moveTo(0,0);sh.bezierCurveTo(W,L*.25,W*.9,L*.7,0,L);sh.bezierCurveTo(-W*.9,L*.7,-W,L*.25,0,0);const pg=new T.ShapeGeometry(sh,14),P=pg.attributes.position,C=[];const c0=new T.Color(cI),c1=new T.Color(cP);for(let i=0;i<P.count;i++){const y=P.getY(i),t=y/L;P.setY(i,y*Math.cos(.55)-t*t*L*.35);P.setZ(i,y*Math.sin(.55)*1.0+Math.max(0,t-.55)*L*.5-(P.getX(i)*P.getX(i))*3);const col=c0.clone().lerp(c1,Math.min(1,t*4.5));C.push(col.r,col.g,col.b);}pg.setAttribute('color',new T.Float32BufferAttribute(C,3));pg.computeVertexNormals();const mm=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});if(mats)mats.push(mm);const m=new T.Mesh(pg,mm);const pv=new T.Group();pv.rotation.z=ang;pv.add(m);g.add(pv);}for(let k=0;k<6;k++){const ang=k/6*Math.PI*2+.3,dir=new T.Vector3(Math.cos(ang)*.35,Math.sin(ang)*.35,1).normalize();const st=mk(new T.CylinderGeometry(S*.012,S*.012,S*.55,4),a.sc||'#e8d8a0');G.remove(st);st.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir);st.position.copy(dir.clone().multiplyScalar(S*.27));g.add(st);const an=mk(new T.SphereGeometry(S*.04,6,4),a.ac||'#6a2a10');G.remove(an);an.scale.set(1,1.8,1);an.position.copy(dir.clone().multiplyScalar(S*.55));g.add(an);}G.add(g);};for(let k=0;k<N;k++){const ang=N>1?-SP+2*SP*k/(N-1):0;const p2=new T.Vector3(Math.sin(ang)*R,Y-(1-Math.cos(ang))*R*TL,Z+Math.cos(ang)*R);const nrm=new T.Vector3(Math.sin(ang),.45,Math.cos(ang)).normalize();lily(p2,nrm,k===Math.floor(N/2)?1.25:1);}for(const e of (a.extra||[])){lily(new T.Vector3(...e.at),new T.Vector3(...(e.dir||[0,0,1])).normalize(),e.s||1);}}
  else if(a.k==='plume'){const S=a.s||1,N=a.n||3;for(let q=0;q<N;q++){const L=S*(.55-q*.08),W=S*(.1-q*.012),sh=new T.Shape();sh.moveTo(0,0);sh.bezierCurveTo(W*1.2,L*.3,W*1.1,L*.75,-W*.3+L*(a.curl??.25),L);sh.bezierCurveTo(-W*.6+L*(a.curl??.25)*.6,L*.7,-W*1.1,L*.3,0,0);const g=new T.ShapeGeometry(sh,20),P=g.attributes.position;for(let k=0;k<P.count;k++){const y=P.getY(k);P.setZ(k,-Math.pow(y/L,2)*L*(a.droop??.35));}g.computeVertexNormals();const m=new T.Mesh(g,hkMat(q===0?a.c:(a.c2||a.c)));m.material.side=T.DoubleSide;if(mats)mats.push(m.material);const grp=new T.Group();grp.position.set(a.x??.3,a.y??.45,a.z??-.1);grp.rotation.set(a.rx??-.3,a.ry??.0,(a.rz??-.6)-q*.35);grp.add(m);G.add(grp);}}
  else if(a.k==='wings'){const S=a.s||1;for(const sx of (a.one?[a.one]:[-1,1])){const sh=new T.Shape();sh.moveTo(0,0);sh.lineTo(.5*S,.42*S);sh.quadraticCurveTo(.40*S,.22*S,.44*S,.06*S);sh.quadraticCurveTo(.32*S,.08*S,.27*S,-.04*S);sh.quadraticCurveTo(.17*S,-.02*S,.12*S,-.12*S);sh.quadraticCurveTo(.05*S,-.06*S,0,-.06*S);sh.lineTo(0,0);const P0=new T.Vector3(sx*(a.x??.5),a.y??.3,a.z??-.1);const g=new T.Group();g.position.copy(P0);g.rotation.set(a.rx??0,sx*(a.ry??-1.2),sx*(a.rz??.15));g.scale.set(sx,1,1);const m=new T.Mesh(new T.ShapeGeometry(sh),hkMat(a.c));m.material.side=T.DoubleSide;g.add(m);if(mats)mats.push(m.material);const sp=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0,0,.005),new T.Vector3(.3*S,.22*S,.005),new T.Vector3(.62*S,.48*S,.005)]),12,.016*S,6,false),hkMat(a.sc||'#b8a878'));g.add(sp);if(mats)mats.push(sp.material);G.add(g);}}
  else if(a.k==='tiara'){const R=.56*(a.r||1),Y=.30+(a.y||0),Z=-.10+(a.z||0),W=a.w||1,SP=a.span||1.25,tl=a.tilt||0;const P=(ang,dy,dr)=>new T.Vector3(Math.sin(ang)*(R+dr),Y+dy+Math.cos(ang)*R*tl,Z+Math.cos(ang)*(R+dr));const pts=[];for(let k=0;k<=16;k++){const ang=-SP+2*SP*k/16;pts.push(P(ang,-.035*Math.abs(ang)/SP,0));}tube(pts,.03*W,a.c,32);const pl=P(0,.02,.01);mk(new T.SphereGeometry(.085*W,10,8),a.c,pl,null,[1,1.35,.45]);mk(new T.SphereGeometry(.035*W,10,8),a.gc||'#d02828',P(0,.02,.045));const H=a.horn||.5;mk(new T.ConeGeometry(.045*W,H,10),a.c,P(0,.08+H*.45,-.02),[-(a.hb??.25),0,0],[1,1,.55]);for(const sx of [-1,1]){if(a.side===0)break;const ang=sx*(a.sa||.95),hs2=a.sh||.28,q=P(ang,.04+hs2*.4,0);mk(new T.ConeGeometry(.035*W,hs2,8),a.c,q,[-.15,0,-sx*(a.so??.55)],[1,1,.55]);}}
  else if(a.k==='crown'){// 頭頂の小さな王冠（帯＋とがった山）。{r 半径, y, z, n 山の数, h 山の高さ, tilt 後ろへの傾き, w 帯の太さ, c 色}
   const R=.28*(a.r||1),n=a.n||7,H=.16*(a.h||1),g=new T.Group(),m=hkMat(a.c||'#26262a');if(mats)mats.push(m);const band=new T.Mesh(new T.CylinderGeometry(R,R*1.04,.06*(a.w||1),28,1,true),m);g.add(band);
   for(let k=0;k<n;k++){const ang=k/n*Math.PI*2,cn=new T.Mesh(new T.ConeGeometry(.055*(a.w||1),H,4),m);cn.position.set(Math.sin(ang)*R,.03+H*.5,Math.cos(ang)*R);cn.scale.set(1,1,.4);cn.rotation.y=ang;g.add(cn);}
   g.position.set(a.x||0,.52+(a.y||0),-.04+(a.z||0));g.rotation.x=-(a.tilt??.35);g.rotation.z=a.rz||0;G.add(g);}
  else if(a.k==='eyepatch'){// 眼帯：片目をおおう楕円の布と、頭を斜めに回るひも。{side 1/-1, x,y,z 布の中心, r 大きさ, c 色, strap ひもの傾き, sw ひもの太さ}
   const sd=a.side||1,cx=sd*(a.x??.2),cy=a.y??.02,cz=a.z??.32,r=a.r??.13;const pg=new T.SphereGeometry(1,20,14);pg.scale(r,r*.85,r*.3);const pm=mk(pg,a.c||'#4a2a5a',new T.Vector3(cx,cy,cz));pm.rotation.y=sd*.45;
   const C=new T.Vector3(0,a.cy??.2,a.cz??-.2),R=a.R??.56,tl=a.strap??.35,pts=[];for(let k=0;k<=40;k++){const th=k/40*Math.PI*2;pts.push(new T.Vector3(Math.sin(th)*R,C.y+Math.cos(th)*R*Math.sin(sd*tl)*0+ (Math.cos(th))*-.0,C.z+Math.cos(th)*R));}
   const q=new T.Quaternion().setFromEuler(new T.Euler(0,0,sd*tl));const ring=pts.map(v=>{const w=v.clone().sub(C).applyQuaternion(q).add(C);return w;});const off=new T.Vector3(0,cy-(a.cy??.2)-0,0);tube(ring.map(v=>v.clone().add(new T.Vector3(0,(cy-(a.cy??.2))*.0,0))),.025*(a.sw||1),a.c||'#4a2a5a',60);}
  else if(a.k==='katyusha'){const R=.62*(a.sz||1),Y=.18+(a.y||0),Z=.02+(a.z||0),W=a.w||1;const t=mk(new T.TorusGeometry(R,.045*W,6,30,Math.PI),a.c,new T.Vector3(0,Y,Z),[0,0,0],[1,1.0,1]);t.rotation.set(-.35-(a.tilt||0),0,0);if(a.frill){const nF=a.frill>1?a.frill:9;for(let k=0;k<nF;k++){const ang=.25+k/(nF-1)*(Math.PI-.5);{const tl=-.35-(a.tilt||0),py=Math.sin(ang)*R;mk(new T.SphereGeometry(.06*W,8,6),a.fc||a.c,new T.Vector3(Math.cos(ang)*R,Y+py*Math.cos(tl),Z+py*Math.sin(tl)*-1+.03),null,[1,.6,.6]);}}}}
  else if(a.k==='ribbon'){for(const p of at(a.pos)){const w=.16;for(const sx of [-1,1])mk(new T.ConeGeometry(.10,w,4),a.c,p.clone().add(new T.Vector3(sx*w*.55,0,0)),[0,0,sx*Math.PI/2],[1,1,.45]);mk(new T.SphereGeometry(.05,8,6),a.c,p);}}
  else if(a.k==='flower'){const fs=a.sz||1;for(const p0 of (a.at?[new T.Vector3(...a.at)]:at(a.pos))){const p=p0;for(let k=0;k<5;k++){const an=k/5*Math.PI*2;mk(new T.SphereGeometry(.045*fs,8,6),a.c,p.clone().add(new T.Vector3(Math.cos(an)*.06*fs,Math.sin(an)*.06*fs,.02)));}mk(new T.SphereGeometry(.035*fs,8,6),a.cc||'#f2e070',p.clone().add(new T.Vector3(0,0,.04*fs)));}}
  else if(a.k==='feather'){for(const p of at(a.pos))for(let k=0;k<3;k++)mk(new T.ConeGeometry(.05,.34,6),a.c,p.clone().add(new T.Vector3((k-1)*.06,.16,0)),[0,0,(k-1)*.35],[1,1,.3]);}
  else if(a.k==='orn'){for(const p of at(a.pos))mk(new T.SphereGeometry(a.big?.17:.065,10,8),a.c,p);}}
 return G;}
function maskMaterial(mesh,look){const old=mesh.material,g=mesh.geometry.clone();mesh.geometry=g;const p=g.attributes.position,ref=new Float32Array(p.count*3),v=new T.Vector3();mesh.updateWorldMatrix(true,false);for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);ref.set([v.x,v.y,v.z],i*3);}g.setAttribute('aClothRef',new T.BufferAttribute(ref,3));
 const mat=new T.MeshBasicMaterial({map:old.map,color:0xffffff,side:T.DoubleSide,transparent:old.transparent,alphaTest:old.alphaTest});
 mat.onBeforeCompile=sh=>{sh.uniforms.uMaskColor={value:new T.Color(CC[look.maskColor]||CC[look.suitColor]||0x2a2a2a)};sh.uniforms.uSkin={value:new T.Color(...skinTint(look))};sh.uniforms.uAccent={value:new T.Color(CC[look.maskAccent]||0xe2c14a)};sh.uniforms.uHalf={value:look.maskStyle==='half'?1:look.maskStyle==='eye'?2:look.maskStyle==='plate'?3:look.maskStyle==='lucha'?4:look.maskStyle==='ninja'?5:0};sh.uniforms.uLine={value:look.maskLine?1:0};sh.uniforms.uPink={value:new T.Color(CC[look.maskLine]||look.maskLine||0xd8408a)};sh.uniforms.uBand={value:new T.Color(CC[look.maskBand]||0x3a3a40)};
  sh.vertexShader='attribute vec3 aClothRef;varying vec3 vRef;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRef=aClothRef;');
  sh.fragmentShader='varying vec3 vRef;uniform vec3 uMaskColor;uniform vec3 uAccent;uniform vec3 uSkin;uniform float uHalf;uniform float uLine;uniform vec3 uPink;uniform vec3 uBand;\n'+sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat ax=abs(vRef.x),yy=vRef.y;if(uHalf>4.5){vec3 sk=diffuseColor.rgb*uSkin;float top=1.432-ax*.12;diffuseColor.rgb=yy<top?uMaskColor*(.9+.1*sin(yy*90.)):sk;}else if(uHalf>3.5){vec3 sk=diffuseColor.rgb*uSkin;float lo=1.398+max(0.,ax-.05)*.25;float e=pow((ax-.058)/.044,2.)+pow((yy-1.452)/(.022+max(0.,ax-.058)*.15),2.);vec3 c=sk;if(yy>lo){c=uMaskColor;if(e<1.)c=sk;else if(e<1.45)c=uBand;float cy0=1.428-(ax-.03)*.42;if(ax>.03&&ax<.11&&abs(yy-cy0)<.0045&&e>1.45)c=vec3(.95,.95,.97);float cy1=1.418-(ax-.04)*.42;if(ax>.04&&ax<.105&&abs(yy-cy1)<.004)c=vec3(.95,.95,.97);float b1=1.49-ax*.3;if(ax>.03&&ax<.10&&abs(yy-b1)<.006)c=uAccent;}diffuseColor.rgb=c;}else if(uHalf>2.5){vec3 sk=diffuseColor.rgb*uSkin;float lo=1.428-smoothstep(.0,.075,ax)*.04+smoothstep(.075,.115,ax)*.07;float e=pow((ax-.058)/.046,2.)+pow((yy-1.452)/(.017+max(0.,.06-ax)*.1),2.);vec3 c=sk;if(yy>lo&&ax<.118){c=uMaskColor;float sh2=.9+.1*sin(ax*60.+yy*30.);c*=sh2;if(e<1.)c=diffuseColor.rgb*uSkin;else if(e<1.6)c=uAccent;if(ax<.005&&yy>1.47)c=uAccent;if(ax>.025&&ax<.105&&abs((yy-1.415)-(ax-.025)*.75)<.0035)c=uAccent;if(ax>.04&&ax<.11&&abs((yy-1.50)+(ax-.04)*.3)<.003)c=uAccent;if(yy<lo+.004)c=uAccent;}diffuseColor.rgb=c;}else if(uHalf>1.5){vec3 sk=diffuseColor.rgb*uSkin;float e1=1.428-ax*.05,e2=1.482+ax*.12;float g1=pow((ax-.058)/.052,2.)+pow((yy-1.452)/(.036+max(0.,ax-.06)*.25),2.);bool gg=g1<1.||(uLine<.5&&ax<.02&&yy>1.44&&yy<1.478);vec3 c=sk;if(uLine>.5){bool up=yy>1.448-max(0.,ax-.075)*.9;float wv=(yy-1.428)*.42;bool vee=ax<wv&&yy<1.51&&yy>1.428;if(up&&ax<.125&&g1>=1.){c=uPink;if(g1<2.5)c=uAccent;if(g1<1.15)c=vec3(.12,.1,.12);}if(vee)c=uAccent;if(yy>1.462&&ax<(yy-1.462)*.85&&yy<1.52)c=uPink;}if(gg)c=uMaskColor;if(uLine<.5){float e1=1.428-ax*.05,e2=1.482+ax*.12;c=(yy>e1&&yy<e2&&ax<.088)?uMaskColor:sk;}diffuseColor.rgb=c;}else if(uHalf>.5){vec3 sk=diffuseColor.rgb*uSkin;vec3 c=sk;float band=step(1.49,yy)*step(yy,1.512);float eye=step(1.43,yy)*step(yy,1.474+ax*.1);float ow=.026+max(0.,1.418-yy)*.18;float low=step(yy,1.43)*step(ow,ax)+step(yy,1.366);if(band>.5){c=uBand;if(abs(yy-1.5)<.003)c=uBand*1.7;}else if(eye>.5||low>.5){c=uMaskColor;if(low>.5&&eye<.5&&yy>1.366&&ax<ow+.009)c=uAccent;if(low>.5&&eye<.5&&yy<1.366&&yy>1.357&&ax<ow)c=uAccent;if(low>.5&&abs(yy-1.43)<.005)c=uAccent;}diffuseColor.rgb=c;}else{bool mouth=ax<.042&&yy>1.366&&yy<1.412;if(mouth)diffuseColor.rgb*=uSkin;if(!mouth){float e=pow((ax-.062)/.058,2.)+pow((yy-1.452)/.036,2.);vec3 c=uMaskColor;if(e>1.&&e<1.9)c=uAccent;if(ax<.011&&yy>1.49)c=uAccent;if(yy<1.395&&ax>.05&&ax<.07)c=uAccent;diffuseColor.rgb=c;diffuseColor.a=1.;}}');};
 mat.customProgramCacheKey=()=> 'yomiai-mask-04'+(look.maskStyle||'');return mat;}
// 顔立ち（look.face）：肌・瞳の色・眉・目の形・ふだんの顔・輪郭・顔の特徴
const SKIN={'色白':[1,.99,.98],'普通':[.95,.88,.83],'小麦':[.84,.68,.55],'褐色':[.66,.48,.36],'スライム青':[.38,.72,1.4],'スライム紫':[.64,.46,1.45],'スライム水色':[.42,1,1.35]};
const IRIS=withHex({'ダークブラウン':0x4a2c20,'ブラウン':0x7a4a2a,'琥珀':0xc8902e,'ダークパープル':0x4e2f7e,'ボルドー':0x6e1f30,'ダークブルー':0x22407a,'紫':0x7a4bc0,'青':0x2f63c0,'水色':0x5aa8d8,'緑':0x2f8a55,'灰':0x7a8290,'赤':0xb03030,'黒':0x262626,'金':0xd8b040});
function skinTint(look){return SKIN[(look.face||{}).skin]||SKIN['普通'];}
function faceDots(){return 'float fr=0.;';}
function faceMaterial(mesh,look){const old=mesh.material,F=look.face||{},g=mesh.geometry.clone();mesh.geometry=g;const p=g.attributes.position,ref=new Float32Array(p.count*3),v=new T.Vector3();mesh.updateWorldMatrix(true,false);for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);ref.set([v.x,v.y,v.z],i*3);}g.setAttribute('aClothRef',new T.BufferAttribute(ref,3));
 const mark={'そばかす':1,'ペイント':2,'ほくろ':3,'傷':4}[F.mark]||0,markHex=CC[F.markColor]||(mark===2?0xd64545:0x8a5430);
 const mat=new T.MeshBasicMaterial({map:old.map,color:0xffffff,side:T.DoubleSide,transparent:old.transparent,alphaTest:old.alphaTest});
 mat.onBeforeCompile=sh=>{sh.uniforms.uSkin={value:new T.Color(...skinTint(look))};sh.uniforms.uMark={value:mark};sh.uniforms.uMarkColor={value:new T.Color(markHex)};
  sh.vertexShader='attribute vec3 aClothRef;varying vec3 vRef;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRef=aClothRef;');
  sh.fragmentShader='varying vec3 vRef;uniform vec3 uSkin;uniform float uMark;uniform vec3 uMarkColor;\n'+sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
diffuseColor.rgb*=uSkin;float ax=abs(vRef.x),yy=vRef.y,sx=sign(vRef.x);
if(uMark>.5&&uMark<1.5){vec2 c=vec2(ax,yy);for(int i=0;i<7;i++){float fi=float(i);vec2 d=vec2(.045+mod(fi*.0137,.035),1.418+mod(fi*.0091,.022));if(length(c-d)<.0042)diffuseColor.rgb=mix(diffuseColor.rgb,uMarkColor,.55);}}
if(uMark>1.5&&uMark<2.5){if(ax>.048&&ax<.095&&abs(yy-1.415-(ax-.048)*.25)<.0055)diffuseColor.rgb=uMarkColor;if(ax>.05&&ax<.09&&abs(yy-1.402-(ax-.05)*.25)<.0045)diffuseColor.rgb=uMarkColor;}
if(uMark>2.5&&uMark<3.5){if(length(vec2(vRef.x+.052,yy-1.405))<.0045)diffuseColor.rgb=vec3(.25,.15,.12);}
if(uMark>3.5){float sx2=vRef.x-.045;if(sx2>0.&&sx2<.042&&abs(yy-1.428+sx2*.9)<.0028)diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.55,.22,.22),.75);if(abs(sx2-.02)<.0022&&abs(yy-1.41)<.013)diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.55,.22,.22),.6);}`);};
 mat.customProgramCacheKey=()=> 'yomiai-face-01-'+mark;return mat;}
function irisMaterial(old,look){const c=new T.Color(IRIS[(look.face||{}).eye]||0x4a2c20);const mat=new T.MeshBasicMaterial({map:old.map,color:0xffffff,transparent:old.transparent,opacity:old.opacity,alphaTest:old.alphaTest,side:T.DoubleSide,depthWrite:old.depthWrite});
 mat.onBeforeCompile=sh=>{sh.uniforms.uIris={value:c};sh.fragmentShader='uniform vec3 uIris;\n'+sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat lu=dot(diffuseColor.rgb,vec3(.3,.59,.11));diffuseColor.rgb=uIris*(.35+lu*1.9)+vec3(max(0.,lu-.75))*1.5;');};mat.customProgramCacheKey=()=> 'yomiai-iris-01';return mat;}
// 眉・目の形・ふだんの顔は、表情モーフに常にかける量（persona）
const BROW={'上がり':{5:.75},'アーチ':{9:.45},'細':{6:.35},'下がり':{8:.7},'太':{}},EYES={'丸':{19:.45},'アーモンド':{},'切れ長':{11:.5},'たれ':{18:.65},'つり':{11:.35,5:.3}},BASE={'笑顔':{1:.6},'不敵':{1:.45,11:.4},'クール':{11:.4},'勝気':{5:.3,25:.55},'無邪気':{25:.6,19:.2},'おっとり':{3:.3,27:.35,18:.25}};
function personaOf(look){const F=look.face||{},w={};for(const src of [BROW[F.brow],EYES[F.eyeShape],BASE[F.base]])if(src)for(const k in src)w[k]=Math.max(w[k]||0,src[k]);return w;}
// VRoid の髪型（027〜053）。look.vhair が文字列ならそれ、null なら今の髪。なければ YR.vhairMap、136番以降は基本の髪型から番号で選ぶ。マスクの選手は今の髪。
const VH_BY_BASE={'ショート':['027','031','034','037','038','050','053','035'],'ロング':['029','033','036','040','051'],'ポニー':['030','045','047','048','046'],'ツイン':['028','044','049'],'団子':['042','043','039'],'サイド':['032','052']};
// LookPreset1：名簿にない選手（ランダム新人・オリジナル・エディット）は、135人から作った「髪型の型」「衣装の型」で見た目を作る（data/look_presets.json）
const LP_C2=['#f4f4f6','#26262c','#d8b048','#2a52b8','#c8283a','#2f8a5a','#6a3d96','#e07aa8','#e8a038','#3ab0c8','#8a5430','#f2d24a'],LP_C3=['#f4f4f6','#26262c','#d8b048','#c8283a','#2a52b8'];
function lpHex(v){if(v==null||v==='')return null;if(typeof v==='number')return v;const c=CC[v]??HC[v];return c!=null?c:(/^#[0-9a-f]{6}$/i.test(v)?v:null);}
function lpDist(a,b){const x=new T.Color(a),y=new T.Color(b);return Math.abs(x.r-y.r)+Math.abs(x.g-y.g)+Math.abs(x.b-y.b);}
function lpTok(v,pal){if(typeof v!=='string')return v;const m=/^\$(\d)([+-][\d.]+)?$/.exec(v);if(!m)return v;const c=new T.Color(pal[+m[1]-1]);if(m[2]){const o={};c.getHSL(o);c.setHSL(o.h,o.s,Math.min(.95,Math.max(.06,o.l+(+m[2]))));}return '#'+c.getHexString();}
function lpSub(o,pal){if(Array.isArray(o))return o.map(x=>lpSub(x,pal));if(o&&typeof o==='object'){const r={};for(const k in o)r[k]=lpSub(o[k],pal);return r;}return lpTok(o,pal);}
function lpSuitCat(suit){suit=String(suit||'');return /スカート|チャイナ|ドレス/.test(suit)?'スカート':/レオタード/.test(suit)?'レオタード':'セパレート';}
function presetLook(person,look){const P=YR.lookPresets;if(!P||String(look.suit||'').includes('道着'))return null;const h=k=>hkHash(person.no,k);
 let O=P.outfit.find(x=>x.id===look.outfitType);if(!O){let cat=lpSuitCat(look.suit);if(cat==='セパレート'&&h(40)<.45)cat='レオタード';const L=P.outfit.filter(x=>x.cat===cat);O=L[Math.floor(h(41)*L.length)]||P.outfit[0];}
 const c1=lpHex(look.suitColor)??0x2c5fbf;let c2=lpHex(look.color2),c3=lpHex(look.color3);
 if(c2==null){const L=LP_C2.filter(c=>lpDist(c,c1)>.5);c2=L[Math.floor(h(42)*L.length)];}
 if(c3==null){const L=LP_C3.filter(c=>lpDist(c,c1)>.4&&lpDist(c,c2)>.4);c3=L[Math.floor(h(43)*L.length)]||'#f4f4f6';}
 const pal=[c1,c2,c3],out=lpSub(O.L,pal);if(look.boot==='なし')out.boot='なし';
 if(!look.mask){let H=P.hair.find(x=>x.id===look.hairType);if(!H){const L=P.hair.filter(x=>x.cat===(look.hair||'ショート'));H=L.length?L[Math.floor(h(44)*L.length)]:P.hair[0];}const R=lpSub(H.r,pal);const fx=look.hairFx,h2=lpHex(look.hair2);if(fx==='wild'){R.m={...(R.m||{})};R.m.messy=(R.m.messy||0)+.5;R.m.spike=(R.m.spike||0)+.5;}else if(fx&&h2!=null){R.c2={mesh:'streak',split:'patch',tri:'tips'}[fx]||'streak';R.c2col=typeof h2==='number'?'#'+new T.Color(h2).getHexString():h2;if(fx==='tri')R.c2r=.55;}out.vrecipe=R;out.hair=H.cat;}
 return out;}
// Unlock1：隠し衣装。解禁前は、いまの衣装（lookFix）と同じ種類で、別の型・別の系統の色の衣装を着る（髪はそのまま）
function lockedLook(person,F){const P=YR.lookPresets;if(!P)return null;const c0=lpHex(F.suitColor);if(c0==null)return null;
 // Unlock2：色は本来の衣装と違う系統にする（ギャップ）。地の色は、本来の色から遠い色の中から選手番号で選ぶ。差し色は自動
 const GAP=['#f4f4f6','#26262c','#2a52b8','#c8283a','#2f8a5a','#6a3d96','#e07aa8','#e8a038','#3ab0c8','#f2d24a','#1e2a5a','#7a1e2e'];
 const far=GAP.filter(c=>lpDist(c,c0)>1.0),pool=far.length?far:GAP.filter(c=>lpDist(c,c0)>.5);const c1=pool[Math.floor(hkHash(person.no,58)*pool.length)];
 const cat=lpSuitCat(F.suit),L=P.outfit.filter(x=>x.cat===cat&&x.src!==person.no);const O=(L.length?L:P.outfit)[Math.floor(hkHash(person.no,57)*(L.length||P.outfit.length))];
 return presetLook(person,{suit:F.suit,suitColor:c1,outfitType:O.id,mask:true});}
function vpRecipe(person,look){if(look.vrecipe!==undefined)return look.vrecipe;const r=YR.vrecipe&&YR.vrecipe[person.no];if(look.mask)return r&&r.mask?r:null;if(r)return r;
 if(person.no>135){const L=VH_BY_BASE[look.hair]||VH_BY_BASE['ショート'],h=k=>hkHash(person.no,k);const R={b:L[Math.floor(h(23)*L.length)],m:{messy:.15+.5*h(24),flip:h(25)>.6?.6:0,len:.9+.25*h(26)}};
  if(h(27)>.5)R.f=['050','038','033','031','053','029','037','047'][Math.floor(h(28)*8)];return R;}return null;}
function vhairKey(person,look){if(look.mask)return null;if(look.vhair!==undefined)return look.vhair;const m=YR.vhairMap&&YR.vhairMap[person.no];if(m!==undefined)return m;if(person.no>135){const L=VH_BY_BASE[look.hair]||VH_BY_BASE['ショート'];return L[Math.floor(hkHash(person.no,23)*L.length)];}return null;}
// ===== VPart01：VRoid の髪を部品（頭皮・後ろ・長い後ろ髪・横・前髪・束・お団子・三つ編み）に分けたものを、選手ごとに組み立てる =====
// 毛束ごとに付け根からの位置 t（0〜1）と毛束番号を持つので、長さ・外ハネ・逆立ち・ウェーブ・ぼさぼさ・ボリューム・二色を毛束単位で加えられる。
// レシピ：{b:土台の髪型, f:前髪の髪型, s:横の毛の髪型, x:[[髪型,部品],...] 足す部品, drop:[部品] 土台から外す部品, m:{len,flip,wave,spike,messy,vol,tail,tie,bangLen}, c2:'tail'|'tips'|'half'|'bangs'}
const VP_C=[0,.075,-.015];// 頭の中心（VRoid の頭ボーン基準、前が +z）
async function vpPart(key,part){const gl=await parse('p'+key);let mesh=null;gl.scene.traverse(o=>{if(o.isMesh&&o.name==='VP_'+part)mesh=o;});if(!mesh)return null;
 // 量子化された位置を、頭ボーン基準の float に直す（形を変えるため）
 const g=mesh.geometry,src=g.attributes.position,n=src.count,M=mesh.matrixWorld.clone();mesh.updateMatrixWorld(true);const m=new T.Matrix4().compose(mesh.position,mesh.quaternion,mesh.scale);
 const P=new Float32Array(n*3),v=new T.Vector3();for(let i=0;i<n;i++){v.fromBufferAttribute(src,i).applyMatrix4(m);P[i*3]=v.x;P[i*3+1]=v.y;P[i*3+2]=v.z;}
 const ng=new T.BufferGeometry();ng.setAttribute('position',new T.BufferAttribute(P,3));ng.setAttribute('normal',g.attributes.normal);ng.setAttribute('uv',g.attributes.uv);ng.setIndex(g.index);
 return {geo:ng,ts:g.attributes._ts,map:mesh.material.map,part};}
function vpHash(a,b){return Math.abs(Math.sin(a*12.9898+b*78.233)*43758.5453)%1;}
function vpDeform(pp,m,seed){const P=pp.geo.attributes.position.array,TS=pp.ts.array,n=P.length/3,part=pp.part;if(m.capDrop&&(part==='cap'||part==='back')){const C=VP_C;for(let i=0;i<n;i++){const vx=P[i*3]-C[0],vy=P[i*3+1]-C[1],vz=P[i*3+2]-C[2],L=Math.hypot(vx,vy,vz)||1,fr=vz/L,w=Math.min(1,Math.max(0,(fr-.15)/.5));if(w>0){const a=m.capDrop*.05*w*w,c=Math.cos(a),sn=Math.sin(a),k=1+m.capDrop*.012*w;P[i*3]=C[0]+vx*k;P[i*3+1]=C[1]+(vy*c-vz*sn)*k;P[i*3+2]=C[2]+(vy*sn+vz*c)*k;}}}if(m.aline&&part!=='cap'&&(part!=='bangs'||m.aline.bangX)){const AL=m.aline,Y0=AL.y??.06,Z0=AL.z??-.06,ZR=AL.range??.15,K=AL.k??.8,BX=part==='bangs'?AL.bangX:0;for(let i=0;i<n;i++){const y=P[i*3+1];if(y>=Y0||Math.abs(P[i*3])<BX)continue;const f=Math.min(1,Math.max(0,(P[i*3+2]-Z0)/ZR));P[i*3+1]=Y0-(Y0-y)*(1+K*f*f);}if(AL.cut){const C=AL.cut,zf=C.zf??.1,zb=C.zb??-.12;for(let i=0;i<n;i++){const t=Math.min(1,Math.max(0,(P[i*3+2]-zb)/(zf-zb))),yc=C.yb+(C.yf-C.yb)*t;if(P[i*3+1]<yc&&Math.abs(P[i*3])>=BX)P[i*3+1]=yc;}}}if(m.aline&&m.aline.bangCut!=null&&part==='bangs'){const BC=m.aline.bangCut,BX=m.aline.bangX||9;for(let i=0;i<n;i++){if(Math.abs(P[i*3])<BX&&P[i*3+1]<BC)P[i*3+1]=BC;}}if(m.tuck){const A=m.tuck.at,Rr=m.tuck.r,k=m.tuck.k??.82;for(let i=0;i<n;i++){const dx=P[i*3]-A[0],dy=P[i*3+1]-A[1],dz=P[i*3+2]-A[2],e=Math.sqrt((dx/Rr[0])**2+(dy/Rr[1])**2+(dz/Rr[2])**2);if(e<(m.tuck.e??1.45)&&dy>-Rr[1]*.35){const f=Math.min(1,k/Math.max(e,.01));P[i*3]=A[0]+dx*f;P[i*3+1]=A[1]+dy*f;P[i*3+2]=A[2]+dz*f;}}}// tuck：かぶりもの（hood）の中に髪をしまう
 if(part==='cap'&&m.capCut){const mx={},r0={};for(let i=0;i<n;i++){const s2=TS[i*2+1];if(!(mx[s2]>=P[i*3+1]))mx[s2]=P[i*3+1];if(!r0[s2]||TS[i*2]<r0[s2][3])r0[s2]=[P[i*3],P[i*3+1],P[i*3+2],TS[i*2]];}for(let i=0;i<n;i++){const s2=TS[i*2+1];if(mx[s2]>m.capCut){const r=r0[s2];P[i*3]=r[0];P[i*3+1]=r[1];P[i*3+2]=r[2];}}}// capCut：土台の頭頂から上へ飛び出す毛（アホ毛・輪）を消す
 if(part==='cap')return;// capDrop：額の生え際（土台の前の縁）を下げる
 // 毛束ごとの付け根と長さ（動かす量は毛束の長さに合わせる。短い毛束はあまり動かさない）
 const root={},len={};for(let i=0;i<n;i++){const t=TS[i*2],s=TS[i*2+1];if(!root[s]||t<root[s][3])root[s]=[P[i*3],P[i*3+1],P[i*3+2],t];}
 const tipx={},tipP={};for(let i=0;i<n;i++){const s=TS[i*2+1],r=root[s],d=Math.hypot(P[i*3]-r[0],P[i*3+1]-r[1],P[i*3+2]-r[2]);if(!(len[s]>=d)){len[s]=d;tipx[s]=P[i*3];tipP[s]=[P[i*3],P[i*3+1],P[i*3+2]];}}
 const keep=pp.opt&&(pp.opt.rx||pp.opt.n||pp.opt.side||pp.opt.noUp!=null)?(()=>{let S=Object.keys(root).map(Number);if(pp.opt.noUp!=null){let mxy={};for(let i=0;i<n;i++){const s3=TS[i*2+1];if(!(mxy[s3]>=P[i*3+1]))mxy[s3]=P[i*3+1];}S=S.filter(s3=>mxy[s3]-root[s3][1]<=pp.opt.noUp);}if(pp.opt.side)S=S.filter(s=>pp.opt.side==='L'?tipx[s]>0:tipx[s]<0);if(pp.opt.rx)S=S.filter(s=>{const ax=Math.abs(tipx[s]);return ax>=pp.opt.rx[0]&&ax<=pp.opt.rx[1];});if(pp.opt.n){S.sort((a,b)=>len[b]-len[a]);S=S.slice(0,pp.opt.n);}return new Set(S);})():null;
 const anc=m.radial?(()=>{const A={},bd={},t0=m.radialFrom??.3;for(let i=0;i<n;i++){const s2=TS[i*2+1],r2=root[s2],L2=len[s2]||.001,tt=Math.hypot(P[i*3]-r2[0],P[i*3+1]-r2[1],P[i*3+2]-r2[2])/L2,d=Math.abs(tt-t0);if(!(bd[s2]<=d)){bd[s2]=d;A[s2]=[P[i*3],P[i*3+1],P[i*3+2]];}}return A;})():null;
 const tAx=(part==='tail'&&m.tailTaper)?(()=>{const A={};for(const k of Object.keys(root)){const r=root[k],tp=tipP[k];if(!tp)continue;const sd=Math.sign(r[0]-VP_C[0])||1;const a=A[sd]||(A[sd]={r:[0,0,0],t:[0,0,0],n:0});for(let j=0;j<3;j++){a.r[j]+=r[j];a.t[j]+=tp[j];}a.n++;}for(const k in A){const a=A[k];for(let j=0;j<3;j++){a.r[j]/=a.n;a.t[j]/=a.n;}}return A;})():null;
 const top={};if(m.noTop||m.cut){for(let i=0;i<n;i++){const s=TS[i*2+1];if(!(top[s]>=P[i*3+1]))top[s]=P[i*3+1];}}
 const C=VP_C,long=part==='long'||part==='back'||part==='side',tail=part==='tail'||part==='braid';
 const lenK=part==='bangs'?(m.bangLen??1):tail?(m.tail??1):long?(m.len??1):1;
 for(let i=0;i<n;i++){const s=TS[i*2+1],r=root[s],L=len[s]||.001,h=vpHash(s,seed);let x=P[i*3],y=P[i*3+1],z=P[i*3+2],tbU=-1,tbS=0;
  const t=Math.min(1,Math.hypot(x-r[0],y-r[1],z-r[2])/L),sz=Math.min(1,L/.12);
  if(m.sym&&part==='bangs'&&tipx[s]!=null&&(m.sym==='L'?tipx[s]<-.004:tipx[s]>.004)){P[i*3]=r[0];P[i*3+1]=r[1];P[i*3+2]=r[2];continue;}// 左右対称：片側だけ残し、組み立てで反対側へ写す
  if(keep&&!keep.has(s)){(pp.dropped||(pp.dropped=new Set())).add(s);P[i*3]=r[0];P[i*3+1]=r[1];P[i*3+2]=r[2];continue;}
  if(m.thick&&m.thick!==1){const tp=tipP[s];if(tp){const ax=tp[0]-r[0],ay=tp[1]-r[1],az=tp[2]-r[2],LL=ax*ax+ay*ay+az*az||1e-6,u=((x-r[0])*ax+(y-r[1])*ay+(z-r[2])*az)/LL,px=r[0]+ax*u,py=r[1]+ay*u,pz=r[2]+az*u;x=px+(x-px)*m.thick;y=py+(y-py)*m.thick;z=pz+(z-pz)*m.thick;}}
  if(m.noUp!=null&&tipP[s]&&tipP[s][1]-r[1]>m.noUp){P[i*3]=r[0];P[i*3+1]=r[1];P[i*3+2]=r[2];continue;}// 毛先が上を向く毛束（頭頂の角など）を消す
  if(m.radial&&part!=='braid'&&!(part==='bangs'&&m.radialBangs===0)&&anc&&anc[s]){// 放射状：頭から離れるあたりから先を、頭の中心から外向きにまっすぐ立てる
   const t0=m.radialFrom??.3;if(t>t0){const A=anc[s];let dx=A[0]-C[0],dy=A[1]-C[1]+(m.radialUp??.04),dz=A[2]-C[2];const D=Math.hypot(dx,dy,dz)||1;dx/=D;dy/=D;dz/=D;const mY=m.radialMinY??-.35;if(dy<mY){dy=mY;const H=Math.hypot(dx,dz)||1,k2=Math.sqrt(1-dy*dy)/H;dx*=k2;dz*=k2;}
    const tp=tipP[s],ax=tp[0]-A[0],ay=tp[1]-A[1],az=tp[2]-A[2],LL=ax*ax+ay*ay+az*az||1e-6,u=Math.max(0,((x-A[0])*ax+(y-A[1])*ay+(z-A[2])*az)/LL),px=A[0]+ax*u,py=A[1]+ay*u,pz=A[2]+az*u;
    const Ln=(m.radialLen??.14)*(.7+.6*h)*Math.min(1,Math.sqrt(LL)/.08+.3),w=Math.min(1,m.radial),sh=1-.6*u,qx=A[0]+dx*Ln*u+(x-px)*sh,qy=A[1]+dy*Ln*u+(y-py)*sh,qz=A[2]+dz*Ln*u+(z-pz)*sh;
    x+=(qx-x)*w;y+=(qy-y)*w;z+=(qz-z)*w;P[i*3]=x;P[i*3+1]=y;P[i*3+2]=z;continue;}}
  if(part==='tail'&&(m.tailThick||m.tailSpread)&&tipP[s]){// ツインテールを太く・外へ大きく広げる
   if(m.tailThick&&m.tailThick!==1){const tp=tipP[s],ax=tp[0]-r[0],ay=tp[1]-r[1],az=tp[2]-r[2],LL=ax*ax+ay*ay+az*az||1e-6,u=Math.max(0,Math.min(1,((x-r[0])*ax+(y-r[1])*ay+(z-r[2])*az)/LL)),px=r[0]+ax*u,py=r[1]+ay*u,pz=r[2]+az*u,pk=m.tailPeak??.35,f=u<pk?u/pk:1-(u-pk)/(1-pk),k=LL<.0016?1:Math.max(.3,1+(m.tailThick-1)*f-.65*Math.max(0,u-.55)/.45);x=px+(x-px)*k;y=py+(y-py)*k;z=pz+(z-pz)*k;}
   if(m.tailSpread){const sx=Math.sign(r[0]-C[0])||1;x+=sx*m.tailSpread*.11*Math.sin(Math.min(1,t)*Math.PI*.6);y+=m.tailSpread*.02*Math.sin(Math.min(1,t)*Math.PI);}}
  if(tAx){const sd=Math.sign(r[0]-VP_C[0])||1,a=tAx[sd];if(a){const ax=a.t[0]-a.r[0],ay=a.t[1]-a.r[1],az=a.t[2]-a.r[2],LL=ax*ax+ay*ay+az*az||1e-6,u=Math.max(0,Math.min(1.1,((x-a.r[0])*ax+(y-a.r[1])*ay+(z-a.r[2])*az)/LL)),f0=m.tailTaperFrom??.4,g=u<f0?0:Math.min(1,(u-f0)/(1-f0)),w=m.tailTaper*(m.tailTaperLin?g:g*g*(3-2*g)),cx=a.r[0]+ax*u,cy=a.r[1]+ay*u,cz=a.r[2]+az*u;if(m.tailRoot){const pk2=m.tailRootPeak??.15,b=u<pk2?Math.sqrt(u/pk2):Math.max(0,1-(u-pk2)/(f0+.25-pk2));const e=m.tailRoot*b;x+=(x-cx)*e;y+=(y-cy)*e*.6;z+=(z-cz)*e;}
   x+=(cx-x)*w;y+=(cy-y)*w;z+=(cz-z)*w;
   if(m.tailCurl){const c0=m.tailCurlFrom??.72;if(u>c0){const AL=Math.sqrt(LL),dx=ax/AL,dy=ay/AL,Lr=(u-c0)*AL,rc=(m.tailCurlR??.05)*(1-.35*(u-c0)/(1-c0)),th=Lr/rc;let nx=-dy,ny=dx;if((nx*sd>0)!==(m.tailCurlOut?true:false)){nx=-nx;ny=-ny;}const px=a.r[0]+ax*c0,py=a.r[1]+ay*c0,pz=a.r[2]+az*c0,qx=px+rc*(Math.sin(th)*dx+(1-Math.cos(th))*nx),qy=py+rc*(Math.sin(th)*dy+(1-Math.cos(th))*ny);x+=qx-cx;y+=qy-cy;z+=pz-cz;}}
   if(m.tailArc){const g2=Math.sin(Math.min(.5,u)*Math.PI);x+=sd*m.tailArc*.12*g2;}tbU=u;tbS=sd;}}// ツインテールの真ん中から毛先を細くまとめる（tailCurl：毛先を大きく巻く、tailArc：外へ弧を描く）
  if(m.cut&&top[s]>m.cut){P[i*3]=r[0];P[i*3+1]=r[1];P[i*3+2]=r[2];continue;}// 頭頂より上へ飛び出す毛束を長さに関係なく消す
   if(m.noTop&&top[s]>m.noTop&&L<.2){P[i*3]=r[0];P[i*3+1]=r[1];P[i*3+2]=r[2];continue;}// 頭頂から飛び出す短い毛束（アホ毛など）を消す// sz：毛束の大きさ（小さい毛束ほど控えめ）
  // 長さ
  const k=lenK*(1+(m.messy||0)*.18*(h-.5)*sz);if(k!==1){const f=1+(k-1)*t;x=r[0]+(x-r[0])*f;y=r[1]+(y-r[1])*f;z=r[2]+(z-r[2])*f;}
  // ふくらみ（頭の中心から全方向へ。アフロなど）
  if(m.puff){const f=1+m.puff*Math.sqrt(t)*(part==='bangs'?.5:1);x=C[0]+(x-C[0])*f;z=C[2]+(z-C[2])*f;if(y>C[1]-.05)y=C[1]-.05+(y-C[1]+.05)*f;}
  // ボリューム
  if(m.vol&&part!=='bangs'){const f=1+.14*m.vol*Math.sqrt(t);x=C[0]+(x-C[0])*f;z=C[2]+(z-C[2])*f;if(y>C[1])y=C[1]+(y-C[1])*(1+.05*m.vol*t);}
  // 風（前髪以外の毛先を後ろへなびかせる）
  if(m.wind&&part!=='bangs'&&part!=='cap'){const w=Math.pow(t,1.3);z-=.13*m.wind*w;y+=.03*m.wind*w;x+=(x-C[0])*.15*m.wind*w;}
  // かき上げ（前髪の毛先を上・後ろへ）
  if(m.sweep&&part==='bangs'){const w=Math.pow(t,1.2);y+=.075*m.sweep*w;z-=.11*m.sweep*w;x+=(x-C[0])*.25*m.sweep*w;}
  if(m.straight&&part==='bangs'){x+=(r[0]-x)*m.straight*Math.min(1,t*1.3);}// 前髪の毛束をまっすぐ下へ（横への流れを消す）
  if(m.bangDrop&&part==='bangs'&&tipP[s]&&tipP[s][2]>C[2]){y-=m.bangDrop*.012;z+=m.bangDrop*.004;}// 前髪の生え際を下げる
  // 前髪の分け（左右へふくらみ、毛先が内へ戻る）。part＝外へのふくらみ、curlIn＝毛先を内へ
  if((m.part||m.curlIn)&&part==='bangs'&&tipP[s]&&tipP[s][2]>C[2]){const sx=Math.sign((tipP[s]?tipP[s][0]:x)-C[0])||1,tt=Math.min(t,1);{const d0=sx*(x-C[0]),W=m.faceW??.05;const t0=m.partStart||0,tp=tt<t0?0:(tt-t0)/(1-t0);let d=d0*(1-(m.partIn||0)*Math.max(0,1-tt*1.6))+(m.part||0)*.035*Math.sin(Math.PI*Math.min(1,tp*1.15))-(m.curlIn||0)*.03*tt*tt*tt;if(m.curlIn&&d<Math.min(d0,W))d=Math.min(d0,W);x=C[0]+sx*d;}z+=(m.curlIn||0)*.012*tt*tt;}
  // 外ハネ（毛先だけを、毛束の長さに合わせて外・上へ）
  if(m.flip&&long){const w=Math.max(0,(t-.6)/.4);if(w>0){let dx=x-C[0],dz=z-C[2];const D=Math.hypot(dx,dz)||1;dx/=D;dz/=D;const a=Math.min(.05,.22*L)*Math.min(m.flip,1.2)*w*w;x+=dx*a;z+=dz*a;y+=a*.8;}}
  // ウェーブ
  if(m.wave&&part!=='bangs'){const a=.016*m.wave*t*sz;x+=a*Math.sin(t*14+s*.9);z+=a*.8*Math.cos(t*12+s*1.3);}
  // 毛先を巻く（ロール）：毛先の半分から先を、毛束ごとにらせん状に巻く
  if(m.roll&&part!=='bangs'&&part!=='braid'&&(m.rollTailOnly?part==='tail':(long||tail))){const w=Math.max(0,(t-(m.rollFrom??.45))/(1-(m.rollFrom??.45)));if(w>0){const ph=w*Math.PI*2*(m.rollTurns||1.6)+h*6.283;const R=.011*m.roll*Math.min(1,w*2.2)*Math.min(1,sz*1.4);let dx=x-C[0],dz=z-C[2];const D=Math.hypot(dx,dz)||1;dx/=D;dz/=D;const ox=Math.cos(ph)-1,oz=Math.sin(ph);x+=R*(ox*dx-oz*dz);z+=R*(ox*dz+oz*dx);y+=.012*m.roll*w*w;}}
  // 逆立ち
  if(m.spike&&part!=='braid'){const w=Math.pow(t,1.4)*(part==='bangs'?.45:1)*sz;let dx=x-C[0],dy=y-C[1],dz=z-C[2];const D=Math.hypot(dx,dy,dz)||1;const a=.06*m.spike*w*(.7+.6*h);x+=dx/D*a;y+=dy/D*a+.04*m.spike*w;z+=dz/D*a;}
  // ぼさぼさ（毛束ごとに毛先をずらす。毛束の長さに比例）
  if(m.messy){const a=Math.min(.03,.16*L)*m.messy*t*t;x+=a*(vpHash(s,seed+3)-.5)*2;z+=a*(vpHash(s,seed+5)-.5)*2;y+=a*(vpHash(s,seed+7)-.5);}
  if(tail&&m.tie){y+=m.tie*.06;}
  if(m.hug&&part==='bangs'){const dx=x-C[0],dy=y-C[1],dz=z-C[2],D=Math.hypot(dx,dy,dz)||1;if(D<m.hug){const k2=m.hug/D;x=C[0]+dx*k2;y=C[1]+dy*k2;z=C[2]+dz*k2;}}
  if(m.tailBody&&tbU>=0){const B=pp.tb||(pp.tb={});const bi=Math.min(23,Math.floor(Math.min(1,tbU)*24)),key=tbS+':'+bi,e=B[key]||(B[key]=[0,0,0,0]);e[0]+=x;e[1]+=y;e[2]+=z;e[3]++;}
  P[i*3]=x;P[i*3+1]=y;P[i*3+2]=z;}
 pp.geo.attributes.position.needsUpdate=true;pp.geo.computeBoundingSphere();}
function vpColors(pp,c1,c2,mode){const TS=pp.ts.array,P=pp.geo.attributes.position.array,n=P.length/3,col=new Float32Array(n*3),a=new T.Color(),b=c2||c1;
 for(let i=0;i<n;i++){const t=pp.part==='cap'?0:TS[i*2]/65535;let w=0;
  if(mode==='tips'){const f0=pp.c2r??.45;w=Math.min(1,Math.max(0,(t-f0)/(1-f0)));}else if(mode==='tail')w=(pp.part==='tail'||pp.part==='bun'||pp.part==='braid')?1:0;else if(mode==='half')w=P[i*3]>0?1:0;else if(mode==='bangs')w=pp.part==='bangs'?1:0;else if(mode==='streak')w=vpHash(TS[i*2+1],91)<(pp.c2r??.28)?1:0;else if(mode==='side')w=pp.part==='side'?1:0;else if(mode==='lowside'){const r0=pp.c2r??.25;w=Math.min(1,Math.max(0,(Math.abs(P[i*3])-.055)/.02))*Math.min(1,Math.max(0,((.10+r0*.1)-P[i*3+1])/.03))*Math.min(1,Math.max(0,(.01-P[i*3+2])/.03));}// 横・えり足の内側だけ色を変える（耳より後ろ）
  else if(mode==='patch'){const r0=pp.c2r??.25;w=Math.min(1,Math.max(0,(P[i*3]-.005)/.03))*Math.min(1,Math.max(0,(P[i*3+1]-(.20-r0*.3))/.03));}// 片側の頭頂だけ色を変える
  a.copy(c1).lerp(b,w);col[i*3]=a.r;col[i*3+1]=a.g;col[i*3+2]=a.b;}
 pp.geo.setAttribute('color',new T.BufferAttribute(col,3));}
// 前後に垂れる長い裾（チャイナ風）。腰の骨に付け、脚の動きに合わせて前後に振る。look.flaps={top,len,w,wb,front,back,c,edge}
function furMesh(base,F,mats){// 毛皮：土台の形（geometry）の表面に毛束を植える。{c 色, c2 毛先, n 本数, len 長さ, w 幅, flow [x,y,z] 流れ, out 外向き}
 const G=new T.Group(),ca=new T.Color(F.c||'#eccc40'),cb=new T.Color(F.c2||F.c||'#fbf2a8');base.computeVertexNormals();const cl=[];const P=base.attributes.position,Nn=base.attributes.normal;for(let i=0;i<P.count;i++)cl.push(ca.r*.95,ca.g*.95,ca.b*.95);base.setAttribute('color',new T.Float32BufferAttribute(cl,3));const m0=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});mats.push(m0);G.add(new T.Mesh(base,m0));
 const hs=(a,b)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v);};const n=F.n??500,L0=F.len??.05,W0=F.w??.02,fl=new T.Vector3(...(F.flow||[0,-1,0])),out=F.out??.6,pos=[],col=[],ix=[];let v=0;
 for(let k=0;k<n;k++){const i=Math.floor(hs(k,1)*P.count),root=new T.Vector3().fromBufferAttribute(P,i),nr=new T.Vector3().fromBufferAttribute(Nn,i).normalize(),f=fl.clone().addScaledVector(nr,-fl.dot(nr));const dir=nr.clone().multiplyScalar(out).add(f).normalize(),sd=new T.Vector3().crossVectors(nr,dir).normalize(),r1=hs(k,2),r2=hs(k,3),L=L0*(.6+.8*r1),W=W0*(.7+.6*r2);
  const tip=root.clone().addScaledVector(dir,L).addScaledVector(sd,(r2-.5)*W),mid=root.clone().addScaledVector(dir,L*.45).addScaledVector(nr,L*.12),c0=ca.clone().multiplyScalar(.88+.12*r1),cm=c0.clone().lerp(cb,.5);
  for(const q of [root.clone().addScaledVector(sd,-W),root.clone().addScaledVector(sd,W),mid.clone().addScaledVector(sd,-W*.6),mid.clone().addScaledVector(sd,W*.6),tip])pos.push(q.x,q.y,q.z);for(const c of [c0,c0,cm,cm,cb])col.push(c.r,c.g,c.b);ix.push(v,v+1,v+2,v+1,v+3,v+2,v+2,v+3,v+4);v+=5;}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(ix);const m=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});mats.push(m);const me=new T.Mesh(g,m);me.frustumCulled=false;G.add(me);return G;}
function flapTex(col,edge,botOnly,fringe){const c=document.createElement('canvas');c.width=64;c.height=256;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,256);const b=new T.Color(col);gr.addColorStop(0,'#'+b.clone().multiplyScalar(.93).getHexString());gr.addColorStop(1,'#'+b.getHexString());g.fillStyle=gr;g.fillRect(0,0,64,256);if(edge){g.fillStyle=edge;if(!botOnly){g.fillRect(0,0,4,256);g.fillRect(60,0,4,256);}g.fillRect(0,250,64,6);}if(fringe){const b2=new T.Color(col);g.fillStyle='#'+b2.clone().multiplyScalar(.62).getHexString();for(let x=0;x<64;x+=4)g.fillRect(x,40,1,216);g.fillStyle='#'+b2.clone().multiplyScalar(.75).getHexString();g.fillRect(0,0,64,18);}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
function addFlaps(root,look,mats){const F=look.flaps===1?{}:look.flaps;const hips=root.getObjectByName('J_Bip_C_Hips');const LL=['L','R'].map(k=>root.getObjectByName('J_Bip_'+k+'_LowerLeg')),UL=['L','R'].map(k=>root.getObjectByName('J_Bip_'+k+'_UpperLeg'));if(!hips||!LL[0]||!LL[1])return;root.updateMatrixWorld(true);
 const top=F.top??1.0,len=F.len??.66,w=F.w??.30,wb=F.wb??.36,col=F.c||look.suitColor||'#f4f4f6',edge=F.edge??look.hem??null;
 const mat=new T.MeshBasicMaterial({map:flapTex(col,edge),side:T.DoubleSide});mats.push(mat);
 for(const [sgn,z0] of [[-1,F.front===null?null:(F.front??-.115)],[1,F.back===null?null:(F.back??.105)]]){if(z0===null)continue;
  const G=new T.Group();hips.add(G);G.position.copy(hips.worldToLocal(new T.Vector3(0,top,z0)));G.quaternion.copy(hips.getWorldQuaternion(new T.Quaternion()).invert());
  const NU=8,NV=16,geo=new T.PlaneGeometry(1,1,NU,NV),pa=geo.attributes.position;const BP=[];root.traverse(o=>{const g=o.geometry;if(!o.isSkinnedMesh||!g||!g.attributes.aClothRef||!g.attributes.aBody)return;const r=g.attributes.aClothRef,b=g.attributes.aBody;for(let i=0;i<r.count;i++){const y=r.getY(i),z=r.getZ(i);if(b.getX(i)>.5&&y<top+.03&&y>top-len-.05&&sgn*z>0)BP.push(r.getX(i),y,z);}});
  const prof=new Map();const idx=[...Array(pa.count).keys()].sort((p,q)=>pa.getY(q)-pa.getY(p));for(const i of idx){const u=pa.getX(i),v=.5-pa.getY(i);const ww=w+(wb-w)*v;const x=u*ww,yw=top-v*len;let ext=-1;for(let k=0;k<BP.length;k+=3){if(Math.abs(BP[k+1]-yw)>.02||Math.abs(BP[k]-x)>.03)continue;const e=sgn*BP[k+2];if(e>ext)ext=e;}const key=Math.round(u*100);if(ext<0)ext=prof.get(key)??sgn*z0;ext=Math.max(ext,prof.get(key)??-1);prof.set(key,ext);const zl=BP.length?(ext+(F.gap??.012))*sgn-z0:-sgn*(x*x)*1.6*(1-v*.4)+sgn*v*.02;pa.setXYZ(i,x,-v*len,zl);}geo.computeVertexNormals();
  const me=new T.Mesh(geo,mat);me.frustumCulled=false;const P=new T.Group();G.add(P);P.add(me);let cur=0;const vk=new T.Vector3(),vh=new T.Vector3();
  me.onBeforeRender=()=>{let best=0;for(let k=0;k<2;k++){LL[k].getWorldPosition(vk);UL[k].getWorldPosition(vh);G.worldToLocal(vk);G.worldToLocal(vh);const ph=Math.atan2(vk.z-vh.z,-(vk.y-vh.y));const a=sgn*ph;if(a>best)best=a;}best=Math.min(best,1.9);cur+=(best-cur)*.5;P.rotation.x=-sgn*cur;};}}
function vpRibbon(G,at,col,size,mats,dir){const m=new T.MeshBasicMaterial({color:new T.Color(col),side:T.DoubleSide});mats.push(m);const g=new T.Group();g.position.copy(at);
 const s=.045*(size||1);for(const sx of [-1,1]){const lp=new T.Mesh(new T.SphereGeometry(s,12,8),m);lp.scale.set(1.05,.62,.32);lp.position.set(sx*s*1.05,0,0);lp.rotation.z=sx*.25;g.add(lp);
  const tl=new T.Mesh(new T.PlaneGeometry(s*.55,s*2.4),m);tl.position.set(sx*s*.45,-s*1.4,-.004);tl.rotation.z=sx*.28;g.add(tl);}
 const kn=new T.Mesh(new T.SphereGeometry(s*.38,8,6),m);g.add(kn);g.lookAt(at.clone().add(dir));G.add(g);return g;}
async function vpCompose(R,c1,c2,seed,mats){const parts=[],base=R.b,info=(YR.vpartInfo&&YR.vpartInfo[base])||{};
 const want=['cap','back','long','side','bangs','tail','bun','braid'].filter(p=>!(R.drop||[]).includes(p));
 for(const p of want){let key=base;if(p==='bangs'&&R.f)key=R.f;if(p==='side'&&R.s)key=R.s;const q=await vpPart(key,p);if(q)parts.push(q);}
 for(const [key,p,o] of (R.x||[])){const q=await vpPart(key,p);if(q){q.extra=1;q.opt=o||null;parts.push(q);}}
 const G=new T.Group();G.name='VPart_HeadLocal';G.rotation.y=Math.PI;G.scale.setScalar(.062/(info.eye||.0615)*1.06*(R.sc||1));G.position.y=.0054+(R.dy||0);G.position.z=-(R.dz||0);
 for(const q of parts){q.c2r=R.c2r;const qm=q.opt&&q.opt.m?{...(R.m||{}),sweep:0,...q.opt.m}:(R.m||{});vpDeform(q,qm,seed);vpColors(q,c1,c2,R.c2);const mt=new T.MeshBasicMaterial({map:q.map,vertexColors:true,color:new T.Color(1.05,1.05,1.05),side:T.DoubleSide,alphaTest:.5});mt.name='VPartHair';mats.push(mt);const me=new T.Mesh(q.geo,mt);me.frustumCulled=false;me.name='VP_'+q.part;G.add(me);if(q.tb&&qm.tailBody){for(const sd of [-1,1]){const pts=[];for(let b=0;b<24;b++){const e=q.tb[sd+':'+b];if(e&&e[3])pts.push(new T.Vector3(e[0]/e[3],e[1]/e[3],e[2]/e[3]));}if(pts.length<4)continue;const cv=new T.CatmullRomCurve3(pts),N=60,R0=qm.tailBody*.022,pk=qm.tailBodyPeak??.12;const geo=new T.TubeGeometry(cv,N,1,10,false),pa=geo.attributes.position;for(let i=0;i<=N;i++){const t=i/N,c=cv.getPointAt(t),r=R0*(t<pk?.55+.45*Math.sqrt(t/pk):Math.pow(1-(t-pk)/(1-pk),.9))+.001;for(let j=0;j<=10;j++){const k=i*11+j,v=new T.Vector3(pa.getX(k),pa.getY(k),pa.getZ(k));v.sub(c).multiplyScalar(r).add(c);pa.setXYZ(k,v.x,v.y,v.z);}}geo.computeVertexNormals();const tm=new T.MeshBasicMaterial({color:c1.clone().multiplyScalar(.88),side:T.DoubleSide});mats.push(tm);const tb=new T.Mesh(geo,tm);tb.frustumCulled=false;tb.name='VP_tailBody';G.add(tb);}}if(qm.sym&&q.part==='bangs'){const m2=new T.Mesh(q.geo,mt);m2.frustumCulled=false;m2.scale.x=-1;m2.name='VP_bangs_sym';G.add(m2);}}
 const WISP_SET={curtain6:[{x:.006,y:.17,len:.12,out:.024,in:.022,z:.124,w:.007},{x:.013,y:.17,len:.125,out:.030,in:.026,z:.124,w:.007},{x:.020,y:.168,len:.13,out:.036,in:.030,z:.123,w:.007}]};
 if(typeof R.wisps==='string')R={...R,wisps:WISP_SET[R.wisps]||null};
 if(R.wisps){// 前に垂れる細い毛束（左右対称）。{x 付け根の横位置, y 付け根の高さ, len 長さ, out 外へのふくらみ, in 毛先を内へ, w 太さ}
  const wm=new T.MeshBasicMaterial({color:c1.clone().multiplyScalar(.92),side:T.DoubleSide});mats.push(wm);
  for(const w of R.wisps)for(const sx of (w.side?[w.side]:[-1,1])){const x0=(w.x??.03)*sx,y0=w.y??.165,L=w.len??.15,o2=(w.out??.012)*sx,i2=(w.in??.012)*sx,W=w.w??.006,zf=w.z??.118;
   const fw=w.fwd||0,cv=new T.CatmullRomCurve3([new T.Vector3(x0,y0,zf-.012),new T.Vector3(x0+o2*.6,y0-L*.3,zf+.004+fw*.55),new T.Vector3(x0+o2,y0-L*.62,zf+.006+fw*.9),new T.Vector3(x0+o2-i2,y0-L,zf+.004+fw)]);
   const N=14,pos=[],idx=[];for(let k=0;k<=N;k++){const t=k/N,pt=cv.getPoint(t),tg=cv.getTangent(t),side=new T.Vector3().crossVectors(tg,new T.Vector3(0,0,1)).normalize(),hw=W*.5*(1-t*.85);pos.push(pt.x+side.x*hw,pt.y+side.y*hw,pt.z,pt.x-side.x*hw,pt.y-side.y*hw,pt.z);if(k<N){const a=k*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
   const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(pos,3));gg.setIndex(idx);const wmesh=new T.Mesh(gg,wm);wmesh.frustumCulled=false;wmesh.name='VP_wisp';G.add(wmesh);}}
 if(R.tails){// 毛束で作るツインテール（元の部品を使わない）。{x,y,z 結び目, rise 1本のとき根元で上へ盛り上がる高さ, out 横への張り出し, up 上がり, len 長さ, r 根元の太さ, n 毛束の数, curl 毛先の巻きの大きさ, back 後ろへ}
  const TL=R.tails,base=TL.c?new T.Color(TL.c):c1.clone();for(const sx of (TL.single?[0]:TL.one?[TL.one]:[-1,1])){const x0=sx*(TL.x??.075),y0=TL.y??.17,z0=TL.z??-.04,L=TL.len??.75,out=TL.out??.22,up=TL.up??.04,bk=TL.back??-.03,R0=TL.r??.035,nS=TL.n||36,cr=TL.curl??.045;
   const sw=TL.sway||0,ctl=(TL.single&&TL.rise?[[0,y0,z0],[0,y0+TL.rise,z0+bk*.45],[sw*.3,y0+TL.rise*.4-L*.1,z0+bk*1.15],[sw,y0-L*.38,z0+bk*1.25],[sw*1.2,y0-L*.7,z0+bk*1.1],[sw*1.4,y0-L,z0+bk*.95]]:TL.single?[[0,y0,z0],[0,y0-L*.15,z0+bk*.5],[0,y0-L*.4,z0+bk],[TL.sway||0,y0-L*.7,z0+bk*1.05],[(TL.sway||0)*1.4,y0-L,z0+bk]]:[[x0,y0,z0],[x0+sx*out*.45,y0+up,z0+bk*.4],[x0+sx*out*.9,y0-L*.12,z0+bk*.8],[x0+sx*out*1.05,y0-L*.4,z0+bk],[x0+sx*out*.95,y0-L*.72,z0+bk],[x0+sx*out*.8,y0-L*.92,z0+bk]]).map(a=>new T.Vector3(...a));
   if(TL.spray){// 結び目から外へ放射状に広がるとがった毛束（爆発したような短いツイン）。{n 本数, len 長さ, r 太さ, spread 広がり(ラジアン), dir 中心の向き [x,y,z]}
    const SP=TL.spray===1?{}:TL.spray,nS2=SP.n||26,Ls=SP.len??.22,Rs=SP.r??.02,spr=SP.spread??.8,d0=new T.Vector3(...(SP.dir||[1,.35,-.25]));d0.x*=sx;d0.normalize();const ky=new T.Vector3(0,1,0),ax1=new T.Vector3().crossVectors(d0,ky).normalize(),ax2=new T.Vector3().crossVectors(ax1,d0).normalize();
    const bm=new T.MeshBasicMaterial({color:base.clone().multiplyScalar(1.05)});mats.push(bm);const bm2=new T.MeshBasicMaterial({color:base.clone().multiplyScalar(.82)});mats.push(bm2);
    for(let j=0;j<nS2;j++){const a=vpHash(j,3+sx)*Math.PI*2,rr=Math.sqrt(vpHash(j,5+sx))*spr,dir=d0.clone().addScaledVector(ax1,Math.cos(a)*Math.sin(rr)).addScaledVector(ax2,Math.sin(a)*Math.sin(rr)).normalize();dir.y-=.15*vpHash(j,9);dir.normalize();
     const L2=Ls*(.55+.6*vpHash(j,7+sx)),g=new T.ConeGeometry(Rs*(.7+.6*vpHash(j,11)),L2,5);g.translate(0,L2/2,0);const m=new T.Mesh(g,j%3?bm:bm2);m.position.set(x0,y0,z0);m.quaternion.setFromUnitVectors(ky,dir);m.frustumCulled=false;m.name='VP_spray';G.add(m);}
    const kn=new T.Mesh(new T.SphereGeometry(Rs*1.6,10,8),bm2);kn.position.set(x0,y0,z0);G.add(kn);if(!SP.keep)continue;}
   const cv=new T.CatmullRomCurve3(ctl),N=48,F=[],tg=new T.Vector3();for(let k=0;k<=N;k++){const t=k/N;let p=cv.getPointAt(Math.min(1,t));F.push(p);}
   // 毛先の巻き
   const tipDir=cv.getTangentAt(1).normalize(),nrm=new T.Vector3(-tipDir.y,tipDir.x,0).normalize();if(nrm.x*sx>0)nrm.negate();const tipP=F[N].clone(),extra=[];for(let k=1;k<=(cr>0?16:0);k++){const th=k/16*Math.PI*1.6,rr=cr*(1-.3*k/16);extra.push(tipP.clone().addScaledVector(tipDir,rr*Math.sin(th)).addScaledVector(nrm,rr*(1-Math.cos(th))));}
   const path=F.concat(extra),NP=path.length-1;
   const mt=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});mats.push(mt);
   for(let j=0;j<nS;j++){const a=vpHash(j,7)*Math.PI*2,rad=Math.sqrt(vpHash(j,11)),ox=Math.cos(a)*rad,oz=Math.sin(a)*rad,W=R0*(.45+.35*vpHash(j,13)),pos=[],col=[],idx=[],sh0=.78+.22*vpHash(j,17);
    for(let k=0;k<=NP;k++){const t=k/NP,p=path[k],q=path[Math.min(NP,k+1)],d=q.clone().sub(path[Math.max(0,k-1)]).normalize(),sd2=new T.Vector3().crossVectors(d,new T.Vector3(0,0,1)).normalize(),fz=new T.Vector3().crossVectors(sd2,d).normalize();
     const env=R0*(TL.envFn==='brush'?(t<.08?.6+5*t:(t<(TL.wrapA??.6)?1-.35*(t-.08)/((TL.wrapA??.6)-.08):(t<(TL.wrapB??.75)?.55:.55+.9*Math.sin(Math.min(1,(t-(TL.wrapB??.75))/(1-(TL.wrapB??.75)))*Math.PI*.55)))):TL.envFn==='bulge'?(t<.08?.6+5*t:(1+.5*Math.sin(Math.PI*Math.min(1,(t-.08)/.62)))*Math.pow(Math.max(0,1-(t-.08)/.92),.75)):(t<.08?.6+5*t:Math.pow(Math.max(0,1-(t-.08)/.92),1.15)))*1.0,c=p.clone().addScaledVector(sd2,ox*env*1.2+(TL.wave?TL.wave*R0*Math.sin(t*(TL.waveF??9)+j*.7)*Math.min(1,t*3):0)).addScaledVector(fz,oz*env*1.2+(TL.wave?TL.wave*R0*.6*Math.cos(t*(TL.waveF??9)*.8+j):0)),hw=W*(TL.envFn==='brush'?(t<.08?.7+3.7*t:(t>(TL.wrapA??.6)-.02&&t<(TL.wrapB??.75)+.01?.3:1.1)):(t<.08?.7+3.7*t:Math.max(.08,1-(t-.08)/.92)))*.5,rb=a+t*.8,wv=sd2.clone().multiplyScalar(Math.cos(rb)).addScaledVector(fz,Math.sin(rb));
     pos.push(c.x+wv.x*hw,c.y+wv.y*hw,c.z+wv.z*hw,c.x-wv.x*hw,c.y-wv.y*hw,c.z-wv.z*hw);const sh=sh0*(.82+.18*Math.sin(t*9+j));for(let q2=0;q2<2;q2++)col.push(Math.min(1,base.r*sh*1.08),Math.min(1,base.g*sh*1.08),Math.min(1,base.b*sh*1.08));if(k<NP){const b=k*2;idx.push(b,b+1,b+2,b+1,b+3,b+2);}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);const me=new T.Mesh(g,mt);me.frustumCulled=false;me.name='VP_tails';G.add(me);}
   if(TL.braid){// 三つ編み：毛束の上に左右交互に傾いた房を重ねる。{from,to 範囲(0〜1), n 房の数, r 太さの倍率, tilt 傾き}
    const BR=TL.braid===1?{}:TL.braid,b0=BR.from??.03,b1=BR.to??(TL.wrapA??.8),nL=BR.n??18,tl=BR.tilt??.6,CL=cv.getLength(),seg=(b1-b0)*CL/nL;
    for(let i=0;i<nL;i++){const t=b0+(b1-b0)*(i+.5)/nL,p=cv.getPointAt(t),tg=cv.getTangentAt(t).normalize();let sd=new T.Vector3().crossVectors(tg,new T.Vector3(0,0,1));if(sd.lengthSq()<1e-6)sd.set(1,0,0);sd.normalize();const fz=new T.Vector3().crossVectors(sd,tg).normalize();
     const rr=R0*(BR.r??1.15)*(1-(BR.taper??.3)*(t-b0)/(b1-b0)),sg=i%2?1:-1,geo=new T.SphereGeometry(1,14,10);geo.scale(rr*.78,seg*1.05,rr*.62);geo.rotateZ(sg*tl);
     const sh=(i%2?(BR.alt??.78):1)*(BR.shade??.98),bm=new T.MeshBasicMaterial({color:new T.Color(Math.min(1,base.r*sh),Math.min(1,base.g*sh),Math.min(1,base.b*sh))});mats.push(bm);const lob=new T.Mesh(geo,bm);
     lob.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(sd,tg,fz));lob.position.copy(p).addScaledVector(sd,sg*rr*.28);lob.frustumCulled=false;lob.name='VP_braid';G.add(lob);
     const em=new T.MeshBasicMaterial({color:new T.Color(base.r*.55,base.g*.55,base.b*.55),side:T.BackSide});mats.push(em);const eg=geo.clone();const ed=new T.Mesh(eg,em);ed.scale.setScalar(1.06);ed.quaternion.copy(lob.quaternion);ed.position.copy(lob.position);ed.frustumCulled=false;G.add(ed);}}
   if(TL.wrap){const a=TL.wrapA??.6,b=TL.wrapB??.75,pts=[];for(let k=0;k<=12;k++)pts.push(cv.getPointAt(a+(b-a)*k/12));const wc=new T.CatmullRomCurve3(pts),wg=new T.TubeGeometry(wc,24,R0*.86*(TL.wrapR??1),12,false),wm=new T.MeshBasicMaterial({color:new T.Color(TL.wrap),side:T.DoubleSide});mats.push(wm);const wme=new T.Mesh(wg,wm);wme.frustumCulled=false;G.add(wme);
    if(TL.wrapEdge){const em=new T.MeshBasicMaterial({color:new T.Color(TL.wrapEdge),side:T.DoubleSide});mats.push(em);const eg=new T.TubeGeometry(new T.CatmullRomCurve3([cv.getPointAt(b-.012),cv.getPointAt(b),cv.getPointAt(Math.min(1,b+.012))]),6,R0*.9*(TL.wrapR??1),12,false);const eme=new T.Mesh(eg,em);eme.frustumCulled=false;G.add(eme);}
    const lm=new T.MeshBasicMaterial({color:new T.Color(TL.wrap).multiplyScalar(.7)});mats.push(lm);for(let k=1;k<6;k++){const t2=a+(b-a)*k/6,c=cv.getPointAt(t2),tg2=cv.getTangentAt(t2),ring=new T.Mesh(new T.TorusGeometry(R0*.87*(TL.wrapR??1),R0*.04,4,16),lm);ring.position.copy(c);ring.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),tg2);ring.rotation.x+=(k%2?.25:-.25);G.add(ring);}}
   if(TL.pom){const pm=new T.MeshBasicMaterial({color:new T.Color(TL.pom.c||TL.pom)});mats.push(pm);const ball=new T.Mesh(new T.SphereGeometry(TL.pom.r??.045,14,10),pm);ball.position.set(x0+sx*(TL.pom.out??.01),y0+(TL.pom.dy??0),z0+(TL.pom.dz??0));G.add(ball);if(TL.pom.two){const b2=ball.clone();b2.position.y+=(TL.pom.r??.045)*1.7;b2.position.z+=(TL.pom.r??.045)*.4;G.add(b2);}}// 結び目の玉（ポンポン）{c 色, r 半径}
   if(R.rib)vpRibbon(G,new T.Vector3(x0,y0+.005,z0),R.rib.c||R.rib,TL.ribS??1.1,mats,new T.Vector3(sx*.5,.3,.5));}}
 if(R.locks){// 耳の前から長く垂れる毛束（左右対称）。{x 付け根の横, y 付け根の高さ, z 前後, len 長さ, w 幅, out 外へ, fwd 前へ, tipFwd 毛先を前へ, tipIn 毛先を顔の中央へ, n 本数(片側)}
  for(const L0 of (Array.isArray(R.locks)?R.locks:[R.locks===1?{}:R.locks])){const nL=L0.n||2,base=L0.c?new T.Color(L0.c):c1.clone(),FR=!!L0.front;
  for(const sx of (L0.side?[L0.side]:[-1,1]))for(let j=0;j<nL;j++){const x0=sx*((L0.x??.075)+j*(L0.dx??.008)),y0=(L0.y??.12)-j*.01,z0=(L0.z??.045)-j*.022,L=(L0.len??.42)*(1-j*.08),W=(L0.w??.026),o2=sx*(L0.out??.025),f2=(L0.fwd??.035);
   const ti=sx*(L0.tipIn??0);const cv=new T.CatmullRomCurve3([new T.Vector3(x0,y0,z0),new T.Vector3(x0+o2*.4,y0-L*.25,z0+f2*.8),new T.Vector3(x0+o2*.9,y0-L*.55,z0+f2),new T.Vector3(x0+o2*1.2-ti*.35,y0-L*.8,z0+f2*.8+(L0.tipFwd??0)*.45),new T.Vector3(x0+o2*1.3+sx*.004-ti,y0-L,z0+f2*.6+(L0.tipFwd??0))]);
   const N=30,V=4,pos=[],col=[],idx=[];for(let k=0;k<=N;k++){const t=k/N,pt=cv.getPoint(t),hw=W*.5*(t<.1?.6+t*4:1-.75*Math.pow(t,2));for(let q=0;q<V;q++){const u=q/(V-1)*2-1,bul=(1-u*u)*W*.25;if(FR)pos.push(pt.x+u*hw,pt.y,pt.z+(1-u*u)*W*.15);else pos.push(pt.x+sx*u*hw*.35,pt.y,pt.z+u*hw+bul*0+ (1-u*u)*W*.15);const sh=.72+.28*(1-Math.abs(u))*(1-.3*t);col.push(base.r*sh,base.g*sh,base.b*sh);}
    if(k<N)for(let q=0;q<V-1;q++){const b=k*V+q;idx.push(b,b+V,b+1,b+1,b+V,b+V+1);}}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);
   const mt=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});mats.push(mt);const me=new T.Mesh(g,mt);me.frustumCulled=false;me.name='VP_lock';G.add(me);}}}
 if(R.fringe){// 一から作る前髪：頭頂の生え際から額・顔の前へ下りる、先のとがった毛束の扇。{n 本数, spread 左右の広がり(角度), len 長さ, w 幅, lift 根元の盛り上がり, out 毛先の外への開き, fwd 前への張り出し, y/z 根元, jit 長さのばらつき, strands:[{a,len,w,out,curl}] で1本ずつ指定}
  const FR=R.fringe,base=FR.c?new T.Color(FR.c):c1.clone(),mt=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});mats.push(mt);
  const list=FR.strands||Array.from({length:FR.n||9},(_,i)=>{const n=FR.n||9,t=n>1?i/(n-1)*2-1:0;return{a:t*(FR.spread??1.1),len:(FR.len??.2)*(1-(FR.jit??.25)*vpHash(i,3))*(1+(FR.sideLen??.4)*Math.abs(t)),w:(FR.w??.045)*(1-.25*Math.abs(t))};});
  list.forEach((st,i)=>{const ang=st.a,sx=Math.sign(ang)||1,ax=Math.abs(ang),R0=FR.r??.105,y0=(FR.y??.215)-.03*ax,z0=(FR.z??.03),L=st.len??FR.len??.2,W=st.w??FR.w??.045,lift=FR.lift??.03,out=(st.out??FR.out??.05)*sx,fw=FR.fwd??.0;
   const rx=Math.sin(ang)*R0,rz=z0+Math.cos(ang)*R0*.9,fz=FR.face??.135;
   const pts=[new T.Vector3(rx,y0,rz),new T.Vector3(rx*1.08,y0+lift,rz+(fz-rz)*.55+.02),new T.Vector3(rx*1.12+out*.25,y0-L*.25,Math.max(fz*Math.cos(ang*.85),rz)+fw*.5+.012),new T.Vector3(rx*1.15+out*.6,y0-L*.6,fz*Math.cos(ang*.9)+fw+.012),new T.Vector3(rx*1.18+out+(st.curl||0)*sx,y0-L,fz*Math.cos(ang*.95)+fw+.006)];
   const cv=new T.CatmullRomCurve3(pts),N=30,V=5,pos=[],col=[],idx=[],sh0=.86+.14*vpHash(i,9);
   for(let k=0;k<=N;k++){const t=k/N,pt=cv.getPoint(t),tg=cv.getTangent(t).normalize();let nv=new T.Vector3(pt.x,0,pt.z).normalize();const sd=new T.Vector3().crossVectors(tg,nv).normalize();const hw=W*.5*(t<.12?.55+t*3.75:Math.pow(Math.max(0,1-(t-.12)/.88),.85));
    for(let q=0;q<V;q++){const u=q/(V-1)*2-1,bul=(1-u*u)*W*.18;pos.push(pt.x+sd.x*u*hw+nv.x*bul,pt.y+sd.y*u*hw,pt.z+sd.z*u*hw+nv.z*bul);const sh=sh0*(.7+.3*(1-Math.abs(u)))*(1-.12*t);col.push(Math.min(1,base.r*sh*1.05),Math.min(1,base.g*sh*1.05),Math.min(1,base.b*sh*1.05));}
    if(k<N)for(let q=0;q<V-1;q++){const b=k*V+q;idx.push(b,b+V,b+1,b+1,b+V,b+V+1);}}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);const me=new T.Mesh(g,mt);me.frustumCulled=false;me.name='VP_fringe';G.add(me);});}
 if(R.bun){// 髪で作るお団子（頭頂などに1つ）。{at:[x,y,z], r 半径, n 毛束の数, turns 巻き数, sq 縦のつぶれ, w 毛束の太さ, base 根元のふくらみ}
  const BN=R.bun===1?{}:R.bun,at=new T.Vector3(...(BN.at||[0,.2,-.05])),r=BN.r??.05,nS=BN.n||14,tw=BN.turns??1.6,sq=BN.sq??.85,W=(BN.w??.5)*r,base=c1.clone(),mt=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});mats.push(mt);
  for(let j=0;j<nS;j++){const ph=j/nS*Math.PI*2,tilt=(vpHash(j,5)-.5)*.6,pts=[];for(let k=0;k<=24;k++){const t=k/24,a=ph+t*tw*Math.PI*2,el=Math.sin(t*Math.PI)*.9+tilt*(1-t),rr=r*(.55+.45*Math.sin(t*Math.PI));pts.push(new T.Vector3(at.x+Math.cos(a)*Math.cos(el)*rr,at.y+Math.sin(el)*rr*sq,at.z+Math.sin(a)*Math.cos(el)*rr));}
   const g=new T.TubeGeometry(new T.CatmullRomCurve3(pts),40,W*(.6+.4*vpHash(j,9)),6,false),P=g.attributes.position,col=[];for(let i=0;i<P.count;i++){const yy=(P.getY(i)-at.y)/r,sh=.7+.3*Math.max(0,yy)+.08*vpHash(j,3);col.push(base.r*sh,base.g*sh,base.b*sh);}g.setAttribute('color',new T.Float32BufferAttribute(col,3));const me=new T.Mesh(g,mt);me.frustumCulled=false;G.add(me);}
  const core=new T.SphereGeometry(r*.85,20,14),cp=core.attributes.position,cc=[];for(let i=0;i<cp.count;i++){cp.setY(i,cp.getY(i)*sq);const sh=.72+.2*Math.max(0,cp.getY(i)/r);cc.push(base.r*sh,base.g*sh,base.b*sh);}core.setAttribute('color',new T.Float32BufferAttribute(cc,3));const cm2=new T.Mesh(core,mt);cm2.position.copy(at);G.add(cm2);
  if(BN.cap){const cmC=new T.MeshBasicMaterial({color:new T.Color(BN.cap),side:T.DoubleSide});mats.push(cmC);const cp2=new T.Mesh(new T.SphereGeometry(r*1.62,20,12,0,Math.PI*2,0,Math.PI*(BN.capCover??.55)),cmC);cp2.position.copy(at);cp2.scale.set(1,sq,1);G.add(cp2);const fr=BN.frill??12;for(let k=0;k<fr;k++){const a=k/fr*Math.PI*2,el=Math.PI*(.5-(BN.capCover??.55));const fp=new T.Vector3(at.x+Math.cos(a)*r*1.64*Math.cos(el),at.y+Math.sin(el)*r*1.64*sq,at.z+Math.sin(a)*r*1.64*Math.cos(el));const fb=new T.Mesh(new T.SphereGeometry(r*.2,8,6),cmC);fb.position.copy(fp);fb.scale.set(1,.6,1);G.add(fb);}}
  if(BN.rib){const rm=new T.MeshBasicMaterial({color:new T.Color(BN.rib),side:T.DoubleSide});mats.push(rm);if(BN.cap){const el=Math.PI*(.5-(BN.capCover??.55)),rad=r*1.62*Math.cos(el);const ring=new T.Mesh(new T.TorusGeometry(rad*1.02,r*.14,6,28),rm);ring.position.copy(at).add(new T.Vector3(0,Math.sin(el)*r*1.62*sq-r*.12,0));ring.rotation.x=Math.PI/2;G.add(ring);}const RL=BN.ribLen??.35,RW=BN.ribW??.022;for(const sx of [-1,1]){const P0=at.clone().add(new T.Vector3(sx*r*1.0,-r*.2,0));const knot=new T.Mesh(new T.SphereGeometry(r*.28,10,8),rm);knot.position.copy(P0);knot.scale.set(.7,1,.7);G.add(knot);for(const k of [0,1]){const pts=[P0,P0.clone().add(new T.Vector3(sx*(.03+k*.01),-RL*.25,-.02+k*.03)),P0.clone().add(new T.Vector3(sx*(.06+k*.02),-RL*.6,-.03+k*.05)),P0.clone().add(new T.Vector3(sx*(.08+k*.03),-RL,-.02+k*.06))];const cv=new T.CatmullRomCurve3(pts),N=20,pos=[],idx=[];for(let q=0;q<=N;q++){const pt=cv.getPoint(q/N);pos.push(pt.x,pt.y,pt.z-RW,pt.x,pt.y,pt.z+RW);if(q<N){const b=q*2;idx.push(b,b+2,b+1,b+1,b+2,b+3);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);const me=new T.Mesh(g,rm);me.frustumCulled=false;G.add(me);}}}
  if(BN.base!==0){const bs=new T.SphereGeometry(r*.9,16,10),bp=bs.attributes.position,bc=[];for(let i=0;i<bp.count;i++){const sh=.68;bc.push(base.r*sh,base.g*sh,base.b*sh);}bs.setAttribute('color',new T.Float32BufferAttribute(bc,3));const bm=new T.Mesh(bs,mt);bm.position.copy(at).add(new T.Vector3(0,-r*.55,0));bm.scale.set(1.15,.5,1.15);G.add(bm);}}
 if(R.hood){// 毛皮のかぶりもの（獣マスク）。頭に沿う薄い殻＋外へ流れる毛束。{c 色, c2 毛先の色, mark 額の模様の色, at 中心, r [横,縦,前後], brow 額の下端, v 鼻へのV字の深さ, vw V字の幅, jaw 横の下端, earTop/earX/earBack 耳の切り抜き, n 毛束の数, len 毛束の長さ, w 毛束の幅, flow 後ろ下への流れ}
  const H=R.hood===1?{}:R.hood,ctr=new T.Vector3(...(H.at||[0,.06,-.03])),rr=H.r||[.11,.125,.12],ca=new T.Color(H.c||'#'+c1.getHexString()),cb=new T.Color(H.c2||H.c||'#'+c1.getHexString()),cm=H.mark?new T.Color(H.mark):null;
  const hs=(a,b,c)=>{const v=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return v-Math.floor(v);};const brow=H.brow??.0,vd=H.v??.05,vw=H.vw??.035,jaw=H.jaw??-.13;
  const fw=H.faceW??.78,cut=(lx,ly,lz)=>{const front=lz>rr[2]*.25&&Math.abs(lx)<rr[0]*fw;if(H.jawSide!=null&&!front){if(ly<H.jawSide-Math.max(0,lz/rr[2])*.04)return true;if(H.earTop!=null&&Math.abs(lx)>rr[0]*(H.earX??.5)&&ly<H.earTop&&lz>-rr[2]*(H.earBack??.3))return true;return ly<-rr[1]*.55&&lz<rr[2]*.6&&lz<-rr[2]*.2;}const vb=brow-Math.max(0,vd*(1-Math.abs(lx)/vw));if(front&&ly<vb)return true;if(ly<jaw)return true;if(ly<-rr[1]*.55&&lz<rr[2]*.6)return true;if(H.earTop!=null&&Math.abs(lx)>rr[0]*(H.earX??.5)&&ly<H.earTop&&lz>-rr[2]*(H.earBack??.3))return true;return false;};
  const markAt=(lx,ly,lz)=>{if(!cm||lz<rr[2]*.5)return false;if(H.markStyle==='zig'){const ax=Math.abs(lx)/rr[0],y=(ly-brow)/rr[1];const zz=.30+.22*Math.abs(((ax*3.2)%1)*2-1)+(ax<.1?.2:0);return (y>zz-.09&&y<zz&&ax<.8)||(y>0.&&y<.07&&ax<.75&&ax>.08);}const ax=Math.abs(lx)/rr[0],y=(ly-brow)/rr[1];if(y<0||y>.6)return false;const e=.12+y*.75;return Math.abs(ax-e)<.09||(ax<.05&&y>.12&&y<.4);};
  const ce=H.edge?new T.Color(H.edge):null;{const g=new T.SphereGeometry(1,H.n===0?160:64,H.n===0?120:48),pa=g.attributes.position,P=pa.array,col=[];for(let i=0;i<pa.count;i++){const x=pa.getX(i)*rr[0],z=pa.getZ(i)*rr[2];let y=pa.getY(i)*rr[1];if(H.peak&&y>0){const fz=Math.max(0,1-Math.abs(x)/rr[0]*2.2);y+=H.peak*Math.pow(y/rr[1],6)*fz;}pa.setXYZ(i,ctr.x+x,ctr.y+y,ctr.z+z);let c=markAt(x,y,z)?cm:ca.clone().multiplyScalar(.97);if(H.side&&Math.abs(x)>rr[0]*(H.sideX??.55)&&y<rr[1]*(H.sideTop??.55))c=new T.Color(H.side);if(H.lucha){const L=H.lucha,ax=Math.abs(x)/rr[0],yn=y/rr[1],zn=z/rr[2],cap=(L.cap??.62)-Math.max(0,-zn)*(L.capBack??.55);if(yn>cap+.07)c=new T.Color(L.top||'#e8e8f0');else if(yn>cap)c=new T.Color(L.rim||'#8aa0e0');if(zn>.55){const sx=ax/.30,sy=(yn-(L.sy??.30))/.22;if(sx<1&&Math.abs(sy)<1&&sy<1-sx*.35){c=new T.Color(L.shield||'#8a7ad8');const rr2=Math.hypot(sx*.9,sy*1.1);if(rr2>.45&&rr2<.68&&!(x>0&&Math.abs(sy)<.3))c=new T.Color(L.emb||'#f0d850');}const by=(L.by??.06)+ax*(L.bs??.32);if(ax>.18&&ax<.72&&Math.abs(yn-by)<.035)c=new T.Color(L.brow||'#f0d850');}}
 if(H.spots){for(const sp of H.spots){const dx=x/rr[0]-sp[0],dy=y/rr[1]-sp[1],dz=z/rr[2]-sp[2];if(dx*dx+dy*dy+dz*dz<sp[3]*sp[3])c=new T.Color(H.spotC||'#c82838');}}if(ce&&!cut(x,y,z)&&(cut(x,y-.012,z)||cut(x+.01,y,z)||cut(x-.01,y,z)))c=ce;else if(H.edge2&&z>rr[2]*.3&&Math.abs(x)<rr[0]*.62&&!cut(x,y-.012,z)&&cut(x,y-.024,z))c=new T.Color(H.edge2);col.push(c.r,c.g,c.b);}g.setAttribute('color',new T.Float32BufferAttribute(col,3));const idx=g.index.array,keep=[];for(let t=0;t<idx.length;t+=3){let cx=0,cy=0,cz=0;for(let q=0;q<3;q++){const j=idx[t+q]*3;cx+=P[j];cy+=P[j+1];cz+=P[j+2];}if(!cut(cx/3-ctr.x,cy/3-ctr.y,cz/3-ctr.z))keep.push(idx[t],idx[t+1],idx[t+2]);}g.setIndex(keep);const m=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});mats.push(m);const me=new T.Mesh(g,m);me.frustumCulled=false;G.add(me);}
  const N=(H.n??900)*2,Lb=H.len??.05,Wb=H.w??.022,flow=H.flow??.55,pos=[],col=[],ix=[];let vtx=0;const ga=Math.PI*(3-Math.sqrt(5));
  for(let i=0;i<N;i++){const yy=1-2*(i+.5)/N,rad=Math.sqrt(1-yy*yy),th=ga*i,ux=Math.cos(th)*rad,uz=Math.sin(th)*rad,uy=yy;const lx=ux*rr[0],ly=uy*rr[1],lz=uz*rr[2];if(cut(lx,ly,lz))continue;
   const nrm=new T.Vector3(ux/rr[0],uy/rr[1],uz/rr[2]).normalize(),root=new T.Vector3(ctr.x+lx,ctr.y+ly,ctr.z+lz);
   const face=lz>rr[2]*.2&&Math.abs(lx)<rr[0]*.85&&uy<(H.faceTop??.35);let fl=new T.Vector3(0,-1,-.6);if(face)fl.set(0,-1,.3);if(Math.abs(lx)>rr[0]*.4)fl.x+=Math.sign(lx)*.5;fl.addScaledVector(nrm,-fl.dot(nrm)).normalize();
   const r1=hs(i,1,2),r2=hs(i,3,4),L=Lb*(.6+.8*r1)*(uy>.6?.9:1)*(face?(H.faceLen??.45):1),W=Wb*(.7+.6*r2),dir=nrm.clone().multiplyScalar(uy>.8?1.2:.55).addScaledVector(fl,uy>.8?flow*.6:flow).normalize(),side=new T.Vector3().crossVectors(nrm,dir).normalize();
   const tip=root.clone().addScaledVector(dir,L).addScaledVector(side,(r2-.5)*W),mid=root.clone().addScaledVector(dir,L*.45).addScaledVector(nrm,L*.12);
   const isM=markAt(lx,ly,lz),c0=isM?cm.clone():ca.clone().multiplyScalar(.88+.12*r1),c2=isM?cm.clone().multiplyScalar(1.15):cb.clone();
   const a=root.clone().addScaledVector(side,-W),b=root.clone().addScaledVector(side,W),ma=mid.clone().addScaledVector(side,-W*.6),mb=mid.clone().addScaledVector(side,W*.6);
   for(const v of [a,b,ma,mb,tip])pos.push(v.x,v.y,v.z);for(const c of [c0,c0,c0.clone().lerp(c2,.5),c0.clone().lerp(c2,.5),c2])col.push(c.r,c.g,c.b);ix.push(vtx,vtx+1,vtx+2,vtx+1,vtx+3,vtx+2,vtx+2,vtx+3,vtx+4);vtx+=5;}
  const g2=new T.BufferGeometry();g2.setAttribute('position',new T.Float32BufferAttribute(pos,3));g2.setAttribute('color',new T.Float32BufferAttribute(col,3));g2.setIndex(ix);const m2=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});mats.push(m2);const me2=new T.Mesh(g2,m2);me2.frustumCulled=false;me2.name='VP_hood';G.add(me2);}
 if(R.ears){// 獣の耳（左右）。{c 外の色, in 内側の色, x 横, y 高さ, z 前後, h 高さ, w 幅, tilt 外への傾き}
  const E=R.ears===1?{}:R.ears,em=new T.MeshBasicMaterial({color:new T.Color(E.c||'#'+c1.getHexString()),side:T.DoubleSide}),im=new T.MeshBasicMaterial({color:new T.Color(E.in||'#e88a9a'),side:T.DoubleSide});mats.push(em,im);
  if(E.shape==='bunny'){for(const sx of [-1,1]){const h=E.h??.3,w=E.w??.05;const mkS=(ww,hh)=>{const sh=new T.Shape();sh.moveTo(-ww*.55,0);sh.bezierCurveTo(-ww*1.1,hh*.35,-ww*.9,hh*.9,0,hh);sh.bezierCurveTo(ww*.9,hh*.9,ww*1.1,hh*.35,ww*.55,0);sh.lineTo(-ww*.55,0);const g=new T.ShapeGeometry(sh,16);const P=g.attributes.position;const bend=(sx<0?(E.bendL??0):(E.bendR??0));for(let k=0;k<P.count;k++){const y=P.getY(k),x=P.getX(k);const t=Math.max(0,(y/hh-.55)/.45);P.setZ(k,-x*x*3-t*t*bend*hh*.8);P.setY(k,y-t*t*bend*hh*.25);}g.computeVertexNormals();return g;};const grp=new T.Group();grp.position.set(sx*(E.x??.06),E.y??.17,E.z??-.03);grp.rotation.set(-(E.back??.15),sx*(E.yaw??.25),-sx*(E.tilt??.2));const o1=new T.Mesh(mkS(w,h),em);grp.add(o1);const i1=new T.Mesh(mkS(w*.6,h*.85),im);i1.position.set(0,h*.06,.004);grp.add(i1);G.add(grp);}}
  else for(const sx of [-1,1]){const h=E.h??.10,w=E.w??.055,g=new T.ConeGeometry(w,h,4,1);g.translate(0,h/2,0);const ear=new T.Mesh(g,em);ear.scale.set(1,1,.45);ear.position.set(sx*(E.x??.075),E.y??.17,E.z??-.02);ear.rotation.set(-.15,Math.PI/4,-sx*(E.tilt??.35));G.add(ear);
   const gi=new T.ConeGeometry(w*.62,h*.78,4,1);gi.translate(0,h*.39,0);const ein=new T.Mesh(gi,im);ein.scale.set(1,1,.2);ein.position.copy(ear.position).add(new T.Vector3(0,.004,.012));ein.rotation.copy(ear.rotation);G.add(ein);}}
 if(R.bunCover){// お団子のカバー（布）・金の飾り・垂れるリボン。{c 布の色, g 飾りの色, tail リボンの長さ, cover 覆う割合, sc 大きさ}
  const BC=R.bunCover===1?{}:{...R.bunCover},bp=parts.filter(q=>q.part==='bun');const pts=[];for(const q of bp){const P=q.geo.attributes.position.array;for(let i=0;i<P.length/3;i++)if(!(q.dropped&&q.dropped.has(q.ts.array[i*2+1])))pts.push(new T.Vector3(P[i*3],P[i*3+1],P[i*3+2]));}
  for(const sd of (BC.at?[Math.sign(BC.at[0])||1]:[-1,1])){let c=new T.Vector3(),r=0;if(BC.at){c.set(...BC.at);r=(BC.r??.09)*(BC.sc||1);}else{const S=pts.filter(p=>Math.sign(p.x)===sd);if(S.length<10)continue;S.forEach(p=>c.add(p));c.multiplyScalar(1/S.length);S.forEach(p=>r+=p.distanceTo(c));r=r/S.length*1.25*(BC.sc||1);}
   const cm=new T.MeshBasicMaterial({color:new T.Color(BC.c||'#f6f0f2'),side:T.DoubleSide});mats.push(cm);const cv=BC.cover??.62;
   const cap=new T.Mesh(new T.SphereGeometry(r,18,12,0,Math.PI*2,Math.PI*(1-cv),Math.PI*cv),cm);cap.position.copy(c);cap.rotation.set(-.5,0,sd*.35);G.add(cap);
   const band=new T.Mesh(new T.TorusGeometry(r*.93,r*.12,6,20),cm);band.position.copy(c).add(new T.Vector3(0,-r*.05,r*.02));band.rotation.set(Math.PI/2-.5,0,sd*.35);G.add(band);
   const gm=new T.MeshBasicMaterial({color:new T.Color(BC.g||'#d8b040'),side:T.DoubleSide});mats.push(gm);if(BC.ears!==0)for(const k of [-1,1]){const ear=new T.Mesh(new T.ConeGeometry(r*.32,r*.9,4),gm);ear.position.copy(c).add(new T.Vector3(sd*r*.2+k*r*.45,r*.95,-r*.1));ear.rotation.set(-.3,0,-k*.45);ear.scale.set(1,1,.4);G.add(ear);}
   if(BC.cords&&!BC._cd){BC._cd=1;const CD=BC.cords,cmat=new T.MeshBasicMaterial({color:new T.Color(CD.c||'#b0302a')});mats.push(cmat);const bm=new T.MeshBasicMaterial({color:new T.Color(CD.bead||'#2a9a50')});mats.push(bm);const Lc=r*(CD.len??4),W=r*(CD.w??2.2);for(const k of [-1,1]){const P0=c.clone(),pts2=[P0,P0.clone().add(new T.Vector3(k*W*.45,r*1.1,-r*.3)),P0.clone().add(new T.Vector3(k*W*.95,r*.5,-r*.15)),P0.clone().add(new T.Vector3(k*W*1.05,-r*.9,r*.1)),new T.Vector3(k*W*.95,P0.y-Lc,P0.z+r*.4)];const cv2=new T.CatmullRomCurve3(pts2);const tb=new T.Mesh(new T.TubeGeometry(cv2,40,r*(CD.r??.06),6,false),cmat);G.add(tb);const end=pts2[4];const bd=new T.Mesh(new T.SphereGeometry(r*(CD.br??.28),12,10),bm);bd.position.copy(end);G.add(bd);const ts=new T.Mesh(new T.ConeGeometry(r*.2,r*.9,8,1,true),cmat);ts.position.copy(end).add(new T.Vector3(0,-r*.6,0));ts.rotation.x=Math.PI;G.add(ts);}}
   const L=(BC.tail??.12),tm2=BC.tc?new T.MeshBasicMaterial({color:new T.Color(BC.tc),side:T.DoubleSide}):cm;if(BC.tc)mats.push(tm2);for(const k of [0,1]){const t=new T.Mesh(new T.PlaneGeometry(r*.32,L),tm2);t.position.copy(c).add(new T.Vector3(sd*(r*.55+k*r*.25),-r*.6-L*.5,-r*.25-k*.004));t.rotation.set(0,sd*.6,sd*(.12+k*.1));G.add(t);}}}
 if(R.rib){const tl=parts.filter(q=>q.part==='tail'||q.part==='bun');const pts=[];for(const q of tl){const P=q.geo.attributes.position.array,TS=q.ts.array;for(let i=0;i<P.length/3;i++)if(TS[i*2]<6000&&!(q.dropped&&q.dropped.has(TS[i*2+1])))pts.push(new T.Vector3(P[i*3],P[i*3+1],P[i*3+2]));}
  const C=new T.Vector3(...VP_C);if(pts.length){// 左右の束はそれぞれに
   const L=pts.filter(p=>p.x<-.04),Rr=pts.filter(p=>p.x>.04),M=pts.filter(p=>Math.abs(p.x)<=.04);const groups=(L.length>20&&Rr.length>20)?[L,Rr]:[pts];
   for(const gp of groups){const at=gp.reduce((s,p)=>s.add(p),new T.Vector3()).multiplyScalar(1/gp.length);const out=at.clone().sub(C).normalize();at.addScaledVector(out,.03);vpRibbon(G,at,R.rib.c||'#e88ac0',R.rib.s,mats,out);}}
  else if(!R.tails){const at=new T.Vector3(...(R.rib.at||[0,.19,-.12]));vpRibbon(G,at,R.rib.c||'#e88ac0',R.rib.s,mats,new T.Vector3(...(R.rib.dir||[0,.3,-1])));}}
 return G;}
function applyFace(actor,look){const F=look.face||{};actor._persona=personaOf(look);const h=actor.bones.J_Bip_C_Head;
 if(h){const sc={'小顔':[.93,.93,.93],'丸顔':[1.05,.98,1.02],'シャープ':[.95,1.03,.97]}[F.contour];if(sc)h.scale.set(...sc);}
 actor.faceStep(100);}
// 表情（顔のモーフ：0怒り 1笑み 2喜び 3悲しみ 4驚き 5眉怒り 8眉困り 9眉驚き 11目細め 12目閉じ 19目見開き 20目ぎゅっ 28口大きく開く 32歯を食いしばる）
const FACE={neutral:{},calm:{11:.2},spirit:{5:.75,11:.45,32:.3},anger:{0:1,32:.4},smirk:{1:.55,5:.45,11:.3},pain:{20:1,8:.65,32:.6},scream:{20:1,8:.55,28:1},surprise:{19:.9,9:.7,28:.5},roar:{5:1,11:.55,28:1},tired:{3:.6,12:.35,28:.15},joy:{2:1},focus:{5:.4,11:.6}};
/* ===== Ink86：3Dキャラ工房の髪 =====
   YR.binary['mh_〇〇']：gzip＋base64。中身は [JSON の長さ][JSON {n,ni,i32,off,sc,uvMax,ties}][位置 int16×3][UV int16×2][色 uint8×4（明るさ・毛先・つや・束の番号）][三角形]。
   位置は「体の空間」（ゲームの向き）。頭の骨の空間に直して、頭の骨につける */
const MH_ID={s_bob:'bob',s_fuwa:'sFuwa',s_round:'sRound',s_hime:'sHime',s_boy:'sBoy',s_flip:'sFlip',s_messy:'sMessy',s_spiky:'sSpiky',s_neat:'sNeat',s_center:'sCenter',s_salmon:'sSalmon',l_straight:'lStraight',l_center:'lCenter',l_curtain:'lCurtain',l_wave:'lWave',l_wave2:'lWave2',l_super:'lSuper',l_wild:'lWild',l_sharp:'lSharp',p_high:'pony',p_ribbon:'ponyR',p_low:'ponyL',p_braid:'braid',t_long:'twinL',t_thin:'twinT',t_short:'twinS',t_spike:'twinP',t_tip:'twinTip',b_two:'bunTwo',b_bob:'bunBob',b_top:'bunTop',d_side:'ponyS'};
YR.mhKey=id=>'mh_'+(MH_ID[id]||'bob');
const MH_CAT={'ショート':'bob','ロング':'lStraight','ポニー':'pony','ツイン':'twinL','団子':'bunTwo','サイド':'ponyS'};
const mhCache=new Map();
function mhGeo(key,head,root){if(mhCache.has(key))return mhCache.get(key);const p=(async()=>{
 const b64=await loadKey(key).then(()=>YR.binary[key]);
 if(!b64)return null;YR.binary[key]='#';const s=atob(b64),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);
 const buf=await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(),dv=new DataView(buf),hl=dv.getUint32(0,true),H=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,4,hl)).replace(/\0+$/,'').trim());
 const n=H.n,al=x=>Math.ceil(x/4)*4;let o=4+hl;const qp=new Int16Array(buf,o,n*3);o+=al(n*6);const qu=new Int16Array(buf,o,n*2);o+=al(n*4);const c8=new Uint8Array(buf,o,n*4);o+=al(n*4);const ix=H.i32?new Uint32Array(buf,o,H.ni):new Uint16Array(buf,o,H.ni);
 const P=new Float32Array(n*3),U=new Float32Array(n*2),C=new Float32Array(n*3),A=new Float32Array(n);
 for(let i=0;i<n*3;i++)P[i]=H.off[i%3]+qp[i]/32767*H.sc[i%3];for(let i=0;i<n*2;i++)U[i]=qu[i]/32767*H.uvMax;for(let i=0;i<n;i++){C[i*3]=c8[i*4]/255;C[i*3+1]=c8[i*4+1]/255;C[i*3+2]=c8[i*4+2]/255;A[i]=c8[i*4+3]/251;}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(P,3));g.setAttribute('uv',new T.BufferAttribute(U,2));g.setAttribute('color',new T.BufferAttribute(C,3));g.setAttribute('aSA',new T.BufferAttribute(A,1));g.setIndex(new T.BufferAttribute(ix,1));
 root.updateMatrixWorld(true);const inv=head.matrixWorld.clone().invert();g.applyMatrix4(inv);g.computeBoundingSphere();
 g.userData.ties=(H.ties||[]).map(t=>({p:new T.Vector3(...t.p).applyMatrix4(inv),d:new T.Vector3(...t.d).transformDirection(inv),r:t.r||.03,kind:t.kind}));return g;})();mhCache.set(key,p);return p;}
let MH_TEX=null;
function mhTex(){if(MH_TEX)return MH_TEX;const N=256,cv=document.createElement('canvas');cv.width=cv.height=N;const g=cv.getContext('2d');let s=12345;const r=()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 const R=new Float32Array(N).fill(1);for(let i=0;i<46;i++){const x=Math.floor(r()*N),w=1+Math.floor(r()*2),a=.08+r()*.2;for(let k=0;k<w;k++)R[(x+k)%N]-=a;}
 for(let x=0;x<N;x++){const u=x/(N-1);R[x]*=1-.35*Math.exp(-(((u-.06)/.03)**2))-.35*Math.exp(-(((u-.94)/.03)**2));}
 const G=new Float32Array(N);let v=.5;for(let x=0;x<N;x++){if(x%6===0)v=r();G[x]=v;}const im=g.createImageData(N,N);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const o=(y*N+x)*4,wob=.08*Math.sin(y/N*6.283*2+x*.3);im.data[o]=Math.max(0,Math.min(255,R[x]*255));im.data[o+1]=Math.max(0,Math.min(255,(G[x]+wob)*255));im.data[o+2]=0;im.data[o+3]=255;}
 g.putImageData(im,0,0);const t=new T.CanvasTexture(cv);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;t.colorSpace=T.NoColorSpace;return MH_TEX=t;}
// 髪の素材（工房・ゲームの髪の塗りと同じ）：頂点の色 r＝明るさ・g＝毛先・b＝つや。fx：0 1色 1 毛先 2 左右 3 3色 4 筋
function mhMaterial(c1,c2,c3,fx){const m=new T.MeshBasicMaterial({map:mhTex(),vertexColors:true,side:T.DoubleSide}),hi=c1.clone().lerp(new T.Color(1,1,1),.45).multiplyScalar(.32);
 m.userData.U={uC1:{value:c1.clone()},uC2:{value:c2.clone()},uC3:{value:c3.clone()},uHi:{value:hi},uFx:{value:fx}};m.userData.hair=true;
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,m.userData.U);
  sh.vertexShader='attribute float aSA;varying float vSA;varying float vX;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSA=aSA;vX=position.x;');
  sh.fragmentShader='uniform vec3 uC1,uC2,uC3,uHi;uniform float uFx;varying float vSA;varying float vX;\n'+sh.fragmentShader.replace('#include <map_fragment>','').replace('#include <color_fragment>',
   'vec4 tx=texture2D(map,vMapUv);float hl=smoothstep(.5,.58,vColor.b+(tx.g-.5)*.32);vec3 cc=uC1;if(uFx>.5&&uFx<1.5)cc=mix(uC1,uC2,vColor.g);else if(uFx>1.5&&uFx<2.5)cc=vX>0.?uC2:uC1;else if(uFx>2.5&&uFx<3.5)cc=vX>.035?uC2:(vX<-.035?uC1:uC3);else if(uFx>3.5)cc=vSA<.22?uC2:uC1;diffuseColor.rgb=cc*vColor.r*(.72+.28*tx.r)+uHi*hl;diffuseColor.a=1.;');};
 m.customProgramCacheKey=()=>'iw-mh-hair1';m.name='MM_Hair';return m;}
async function mmHair(root,head,look,VR,c1,c2,c3,mats){
 const id=MH_ID[look.hairId]||MH_CAT[look.hair]||'bob',key='mh_'+id+(look.lite&&YR.binary['mh_'+id+'_lo']?'_lo':''),geo=await mhGeo(YR.binary[key]?key:'mh_bob',head,root);if(!geo)return;
 const fx=look.hairFx==='split'?2:look.hairFx==='tri'?3:(look.hairFx&&look.hairFx!=='wild')?4:(VR&&VR.c2&&!c2.equals(c1))?1:0;
 const mat=mhMaterial(c1,c2,c3,fx);mats.push(mat);const hm=new T.Mesh(geo,mat);hm.name='MM_Hair';hm.frustumCulled=false;head.add(hm);
 // 結び目（ポニー・ツイン・お団子）：ゴム。リボンの髪型はリボンも
 const rc=VR&&VR.rib?(typeof VR.rib==='string'?VR.rib:VR.rib.c):null,tc=rc||(VR&&VR.bunCover&&VR.bunCover.c)||(VR&&VR.tails&&VR.tails.wrap)||(VR&&VR.tails&&VR.tails.pom&&VR.tails.pom.c)||'#2a2a30';
 if(geo.userData.ties.length){const tm=new T.MeshBasicMaterial({color:new T.Color(CC[tc]||tc),side:T.DoubleSide});mats.push(tm);
  for(const t of geo.userData.ties){const ring=new T.Mesh(new T.TorusGeometry(Math.max(.012,t.r*.55),Math.max(.004,t.r*.18),8,20),tm);ring.position.copy(t.p);ring.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),t.d.clone().normalize());ring.frustumCulled=false;head.add(ring);
   if(rc&&typeof vpRibbon==='function'){const G=new T.Group();head.add(G);vpRibbon(G,t.p.clone(),CC[rc]||rc,(VR.rib&&VR.rib.s)||1,mats,t.d.clone().normalize().negate());}}}}
// 工房の顔の部品（目・口・眉・鼻の線）の素材：光を使わない、頂点の色。黒目は目の色をのせる
function mmFaceMaterial(mesh,old,look){const name=old.name||mesh.name||'',iris=new T.Color(IRIS[(look.face||{}).eye]||0x4a2c20),c4=mesh.geometry.attributes.color&&mesh.geometry.attributes.color.itemSize===4;
 const over=/eyeLineLowShade|eyeShadowUp|eyeLine|eyeLash|eyeLashC|eyeLidShade|eyeHighlight|eyeCrease|brow|lipLine|lipGloss|noseLine/.test(name);
 const mat=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,polygonOffset:over,polygonOffsetFactor:-2,polygonOffsetUnits:-4,transparent:c4,depthWrite:!c4});
 if(/eyeLashLow/.test(name)){mat.polygonOffsetFactor=-8;mat.polygonOffsetUnits=-16;}
 const lin='vec3 rw=pow(max(diffuseColor.rgb,vec3(0.)),vec3(1./2.2));';
 if(/irisRing/.test(name)){mat.onBeforeCompile=sh=>{sh.uniforms.uIris={value:iris};sh.fragmentShader='uniform vec3 uIris;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+lin+'diffuseColor.rgb=mix(vec3(.035,.02,.02),uIris*.5,rw.r);');};mat.customProgramCacheKey=()=>'iw-mm-irisring';}
 else if(/eyeIrisT/.test(name)){mat.onBeforeCompile=sh=>{sh.uniforms.uIris={value:iris};sh.fragmentShader='uniform vec3 uIris;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+lin+'float lu=rw.r;diffuseColor.rgb=uIris*pow(lu,2.2)*1.9+vec3(max(0.,lu-.9))*.5;');};mat.customProgramCacheKey=()=>'iw-mm-irisT';}
 else if(/eyeIris/.test(name)){mat.onBeforeCompile=sh=>{sh.uniforms.uIris={value:iris};sh.fragmentShader='uniform vec3 uIris;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+lin+'float lu=dot(rw,vec3(.3,.59,.11));diffuseColor.rgb=uIris*(.25+lu*2.2)+vec3(max(0.,lu-.7))*1.5;');};mat.customProgramCacheKey=()=>'iw-mm-iris';}
 if(old.map){mat.map=old.map;mat.vertexColors=false;mat.transparent=true;mat.depthWrite=false;} // 描いた板（黒目・光など）：絵をはる
 if(/eyeRim/.test(name)){const sk=skinTint(look),U={value:new T.Color(...sk)};mat.color.setRGB(.956,.701,.565);mat.polygonOffset=true;mat.polygonOffsetFactor=-6;mat.polygonOffsetUnits=-12;mat.transparent=true;mat.depthWrite=false;mesh.renderOrder=.5;
  mat.userData.skin=sk;mat.userData.uSkinU=U;mat.onBeforeCompile=sh=>{sh.uniforms.uSkin=U;sh.fragmentShader='uniform vec3 uSkin;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=uSkin;');};mat.customProgramCacheKey=()=>'iw-mm-rim';return mat;} // ふちの帯：肌の色にかける（スライムの色にも追いつく）
 if(/eyeHLPaint/.test(name)){mesh.renderOrder=.4;return mat;}
 mat.userData.iris=iris;
 if(c4)mesh.renderOrder=2;else if(/eyeLine|eyeLash|eyeCrease|eyeFold/.test(name)){mesh.renderOrder=1;mat.transparent=true;}
 return mat;}
class Actor{
 static async create(person){const look=(()=>{const L0=person.look||person,F=YR.lookFix&&person.no&&!L0._noFix&&YR.lookFix[person.no];if(F&&YR.lookLocked&&YR.lookLocked(person.no)){const pl=lockedLook(person,F);if(pl)return {...L0,...pl};}if(F)return {...L0,...F};if(person.no>135&&!L0._noFix&&L0.vrecipe===undefined){const pl=presetLook(person,L0);if(pl)return {...L0,...pl};}return {...L0};})(),gl=await parse(look.lite&&YR.binary.body_std?'body_std':look.eyeSet&&YR.binary['body_'+look.eyeSet]?'body_'+look.eyeSet:(YR.binary.body?'body':'body_yasashi'))/* Ink89：試合（look.lite）は軽い体（顔の部品が少ない）と軽い髪 */,root=cloneRig(gl.scene),mats=[];root.updateMatrixWorld(true);root.traverse(o=>{if(!o.isMesh)return;const mat=o.material;if(Array.isArray(mat)){o.visible=false;return;}const name=mat.name||'';o.visible=(name.startsWith('F00_')||name.startsWith('MM_Face_'))&&!/HAIR|Tops_|Shoes_|Accessory_/.test(name);if(name.includes('Bottoms_')){o.visible=String(look.suit).includes('スカート');if(o.visible&&(look.skirtLen||look.skirtOpen||look.skirtDrop)&&!o.userData.sl){o.userData.sl=1;o.geometry=o.geometry.clone();const pa=o.geometry.attributes.position,K=look.skirtLen||1,W=look.skirtOpen||0;let top=-1e9;for(let i=0;i<pa.count;i++)top=Math.max(top,pa.getY(i));let SKH=0;for(let i=0;i<pa.count;i++)SKH=Math.max(SKH,top-pa.getY(i));for(let i=0;i<pa.count;i++){let y=top-(top-pa.getY(i))*K;const x=pa.getX(i),z=pa.getZ(i);if(W&&z<0&&Math.abs(x)<W*(1+(top-y)*2.5))y=top;const Dp0=look.skirtDrop||0;if(Dp0){const rr=Math.hypot(x,z)||1,zn=z/rr,bq=Math.min(1,Math.max(0,(zn+.3)/1.1)),bk=bq*bq*(3-2*bq),tt=Math.min(1,Math.max(0,1-(top-pa.getY(i))/(SKH||1))),wt=tt*tt,Dp=Dp0*(1-(look.skirtBack??0)*bk*wt);y-=Dp;const sc=1+Dp0*(look.skirtWiden??1.6)+(look.skirtBackOut??0)*bk*wt;pa.setX(i,x*sc);pa.setZ(i,z*sc);}pa.setY(i,y);}pa.needsUpdate=true;o.geometry.computeBoundingSphere();}}if(!o.visible)return;if(name.includes('Bottoms_')&&look.skirtBands){const B=look.skirtBands.map(c=>new T.Color(CC[c]||c)),g=o.geometry=o.geometry.index?o.geometry:o.geometry;const pa=g.attributes.position;let lo=1e9,hi=-1e9;for(let i=0;i<pa.count;i++){lo=Math.min(lo,pa.getY(i));hi=Math.max(hi,pa.getY(i));}const col=new Float32Array(pa.count*3);for(let i=0;i<pa.count;i++){const t=(hi-pa.getY(i))/((hi-lo)||1),k=Math.min(B.length-1,Math.floor(t*B.length)),sh=.85+.15*Math.cos((t*B.length%1)*Math.PI*2);col[i*3]=B[k].r*sh;col[i*3+1]=B[k].g*sh;col[i*3+2]=B[k].b*sh;}g.setAttribute('color',new T.BufferAttribute(col,3));o.material=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});mats.push(o.material);return;}o.material=name.startsWith('MM_Face_')?(o.userData.noShadow=true,mmFaceMaterial(o,mat,look)):name.includes('Body_00_SKIN')?bodyMaterial(o,look):(look.mask&&name.includes('Face_00_SKIN'))?maskMaterial(o,look):name.includes('Face_00_SKIN')?faceMaterial(o,look):name.includes('EyeIris')?irisMaterial(mat,look):new T.MeshBasicMaterial({map:mat.map,color:mat.color,transparent:mat.transparent,opacity:mat.opacity,alphaTest:mat.alphaTest,side:T.DoubleSide,depthWrite:mat.depthWrite,vertexColors:name.includes('Bottoms_')&&!!o.geometry.attributes.color});if(name.includes('Bottoms_')){o.material.map=null;o.material.color.set(CC[look.suitColor]||0x2c5fbf);}o.material.name=name;mats.push(o.material);o.frustumCulled=false;});
 if(look.skirt2){let sk=null;root.traverse(o=>{if(o.isSkinnedMesh&&o.visible&&o.material&&String(o.material.name||'').includes('Bottoms_')||(o.isSkinnedMesh&&o.visible&&o.geometry.attributes.color&&!sk&&o.material.vertexColors))sk=sk||o;});if(sk){const S2=look.skirt2,g=sk.geometry.clone(),pa=g.attributes.position;let hi=-1e9,lo=1e9;for(let i=0;i<pa.count;i++){hi=Math.max(hi,pa.getY(i));lo=Math.min(lo,pa.getY(i));}const cx=0;for(let i=0;i<pa.count;i++){const t=(hi-pa.getY(i))/((hi-lo)||1),e0=1+(S2.out??.04)+t*(S2.flare??.04),e=(S2.front&&Math.abs(Math.atan2(pa.getX(i),-pa.getZ(i)*(S2.fz??1)))>S2.front)?.75:e0;pa.setX(i,pa.getX(i)*e);pa.setZ(i,pa.getZ(i)*e);pa.setY(i,hi-(hi-pa.getY(i))*(S2.len??1)-(S2.dy??.03));}const B=(S2.bands||[S2.c||'#f0a0c0']).map(c=>new T.Color(CC[c]||c)),col=new Float32Array(pa.count*3);for(let i=0;i<pa.count;i++){const t=(hi-pa.getY(i))/((hi-lo)||1),k=Math.min(B.length-1,Math.max(0,Math.floor(t*B.length))),sh=.85+.15*Math.cos((t*B.length%1)*Math.PI*2);col[i*3]=B[k].r*sh;col[i*3+1]=B[k].g*sh;col[i*3+2]=B[k].b*sh;}g.setAttribute('color',new T.BufferAttribute(col,3));pa.needsUpdate=true;g.computeBoundingSphere();const m2=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});mats.push(m2);const o2=new T.SkinnedMesh(g,m2);o2.bind(sk.skeleton,sk.bindMatrix);o2.frustumCulled=false;sk.parent.add(o2);}}
 // Ink86：髪は 3Dキャラ工房の髪（YR.binary['mh_〇〇']）。VRoid の髪の部品は使わない。鉢巻・アホ毛などの小物（HairKit）は今までどおり
 const color=new T.Color(HC[look.hairColor]||0x326fb6),color2=new T.Color(HC[look.hair2]||HC[look.hairColor]||0x326fb6),color3=new T.Color(HC[look.hair3]||HC[look.hair2]||0x326fb6);
 const head=root.getObjectByName('J_Bip_C_Head');if(!head)throw Error('素体の頭ボーンがありません');
 {const hair=new T.Group(),basis=new T.Group();basis.name='HairLab_030_To_HeadLocal';basis.matrixAutoUpdate=false;basis.matrix.fromArray(ALIGN);
  const HS=look.hs||(YR.hairStyle&&YR.hairStyle[person.no])||(person.no>135?hkRandom(person.no,look):null),VK0=vpRecipe(person,look);
  const HSa=VK0&&(VK0.acc||VK0.hk)&&HS?{...HS,...(VK0.hk||{}),...(VK0.acc?{acc:VK0.acc}:{})}:HS;
  const HS2=VK0&&!(VK0.keepKit&&HS)?{acc:((VK0.acc||(HS&&HS.acc))||[]).filter(x=>x.pos!=='tie'),ahoge:VK0.ahoge??(HS&&HS.ahoge),ahogeLen:VK0.ahogeLen??(HS&&HS.ahogeLen),ahogeArc:VK0.ahogeArc,hb:VK0.hb,...Object.fromEntries((VK0.kit||[]).map(k=>[k,HS&&HS[k]]))}:HSa;
  if(HS2)hairKit(hair,HS2,VK0&&VK0.col?new T.Color(VK0.col):color,{...look,seed:person.no||1,vkCol:!!(VK0&&VK0.col)},mats);
  const ex=hair.getObjectByName('HairKit_extra');if(ex){const k=1.07;ex.scale.setScalar(k);ex.position.copy(HK_C).multiplyScalar(1-k);}
  basis.add(hair);head.add(basis);
  const c1=VK0&&VK0.col?new T.Color(VK0.col):color,c2=VK0&&VK0.c2col?new T.Color(VK0.c2col):look.hair2?color2:c1;
  await mmHair(root,head,look,VK0,c1,c2,color3,mats);}
 if(look.bows){for(const bw of look.bows){const bn=root.getObjectByName(bw.bone||'J_Bip_C_UpperChest');if(!bn)continue;root.updateMatrixWorld(true);const w=new T.Vector3(...bw.at);const lp=bn.worldToLocal(w.clone());const G2=new T.Group();bn.add(G2);vpRibbon(G2,lp,bw.c||'#e85a8a',bw.s||1,mats,new T.Vector3(...(bw.dir||[0,0,-1])).applyQuaternion(bn.getWorldQuaternion(new T.Quaternion()).invert()));}}
 if(look.studs){const sm={};for(const st of look.studs){const bn=root.getObjectByName(st.bone||'J_Bip_C_UpperChest');if(!bn)continue;root.updateMatrixWorld(true);const c=st.c||'#d8b040';const m=sm[c]||(sm[c]=new T.MeshBasicMaterial({color:new T.Color(c)}));mats.push(m);const triG=()=>{const S=.012*(st.s||1),g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,S*.5,-S*.7, 0,S*.5,S*.7, 0,-S*(st.h||1.2),0],3));g.setIndex([0,1,2]);return g;};const me=new T.Mesh(st.shape==='pad'?new T.ConeGeometry(.012*(st.s||1),.012*(st.s||1)*(st.h||1.2),3,1):st.shape==='tri'?triG():new T.SphereGeometry(.012*(st.s||1),10,8),m);if(st.shape==='tri')m.side=T.DoubleSide;if(st.sc)me.scale.set(...st.sc);else me.scale.set(1,1,.5);if(st.rot)me.userData.rot=st.rot;let wp=new T.Vector3(...st.at);if(st.rel)wp.add(bn.getWorldPosition(new T.Vector3()));if(st.snap!==0){const bodies=[];root.traverse(o=>{if(o.isMesh&&o.visible&&o.material&&/Body/.test(o.material.name||o.name))bodies.push(o);});const rc=new T.Raycaster(new T.Vector3(wp.x,wp.y,-1.5),new T.Vector3(0,0,1));const hit=rc.intersectObjects(bodies,false)[0];if(hit)wp=hit.point.clone().add(new T.Vector3(0,0,-.002));}me.position.copy(bn.worldToLocal(wp));me.quaternion.copy(bn.getWorldQuaternion(new T.Quaternion()).invert());if(st.rot)me.quaternion.multiply(new T.Quaternion().setFromEuler(new T.Euler(...st.rot)));bn.add(me);}}// 体に付けるボタン・鋲 look.studs=[{at,c,s,bone}]
 if(look.furs){// 毛皮の飾り。[{shape:'ball'|'ring'|'tube', at 中心(世界座標), r 半径[x,y,z] / ring:{rx,rz,t,dy} / tube:{r,h,r2}, bone, c, c2, n, len, w, flow, out, rot}]
  root.updateMatrixWorld(true);for(const F of look.furs){const bn=root.getObjectByName(F.bone||'J_Bip_C_UpperChest');if(!bn)continue;let g;
   if(F.shape==='ring'){g=new T.TorusGeometry(1,F.t??.3,12,48);g.rotateX(Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setXYZ(i,x*(F.rx??.15),p.getY(i)*(F.ry??.15)+(F.dy??0)*Math.max(0,-z),z*(F.rz??.12));}}
   else if(F.shape==='tube'){g=new T.CylinderGeometry(F.r2??F.r??.06,F.r??.06,F.h??.3,24,8,true);}
   else{g=new T.SphereGeometry(1,24,16);const r=F.r||[.06,.06,.06];g.scale(...r);}
   if(F.rot)g.applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(...F.rot)));
   const G=furMesh(g,F,mats),wp=new T.Vector3(...F.at);G.position.copy(bn.worldToLocal(wp));G.quaternion.copy(bn.getWorldQuaternion(new T.Quaternion()).invert());bn.add(G);}}
 if(look.tie){// 体の前面に沿うネクタイ。{c 色, top 結び目の高さ, bot 先の高さ, w 幅, x 横のずれ, knot 結び目の大きさ, tilt 先の横ずれ}
  const TI=look.tie,bn=root.getObjectByName('J_Bip_C_UpperChest');if(bn){root.updateMatrixWorld(true);const bodies=[];root.traverse(o=>{if(o.isMesh&&o.visible&&o.material&&/Body/.test(o.material.name||o.name))bodies.push(o);});
   const rc=new T.Raycaster(),snap=(x,y)=>{rc.set(new T.Vector3(x,y,-1.5),new T.Vector3(0,0,1));const h=rc.intersectObjects(bodies,false)[0];return h?h.point.clone().add(new T.Vector3(0,0,-.006)):new T.Vector3(x,y,-.1);};
   const top=TI.top??1.335,bot=TI.bot??1.07,W=TI.w??.032,X=TI.x??0,TL=TI.tilt??.012,N=24,pos=[],idx=[];
   for(let k=0;k<=N;k++){const t=k/N,y=top-.025-(top-.025-bot)*t,cx=X+TL*t*t,hw=W*.5*(t<.08?.55+t*5.6:t>.9?1-(t-.9)*7:1);for(const u of [-1,0,1]){const p=snap(cx+u*hw,y-(u===0&&t>.97?.012:0));pos.push(p.x,p.y,p.z);}
    if(k<N){const b=k*3;idx.push(b,b+3,b+1,b+1,b+3,b+4,b+1,b+4,b+2,b+2,b+4,b+5);}}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);const tm=new T.MeshBasicMaterial({color:new T.Color(TI.c||'#7ab0ea'),side:T.DoubleSide});mats.push(tm);
   const inv=bn.matrixWorld.clone().invert();g.applyMatrix4(inv);const me=new T.Mesh(g,tm);me.frustumCulled=false;bn.add(me);
   const kp=snap(X,top-.012),kn=new T.Mesh(new T.SphereGeometry(.016*(TI.knot||1),10,8),tm);kn.scale.set(1.1,.9,.6);kn.position.copy(kp.applyMatrix4(inv));bn.add(kn);}}
 if(look.flaps)addFlaps(root,look,mats);
 if(look.sideSkirt){// 腰の横だけのスカート（左右）。{c 色, edge 縁, top 高さ, len 長さ, w 上の幅, wb 下の幅, x 横位置, flare 広がり}
  const F=look.sideSkirt,hips=root.getObjectByName('J_Bip_C_Hips');if(hips){root.updateMatrixWorld(true);const mat=new T.MeshBasicMaterial({map:flapTex(F.c||look.suitColor||'#f2c440',F.edge??null,!!F.fit,!!F.fringe),side:T.DoubleSide});mats.push(mat);
   let BP=null,CZ=0;if(F.fit){BP=[];const top0=F.top??.98,len0=F.len??.24;root.traverse(o=>{const g=o.geometry;if(!o.isSkinnedMesh||!g||!g.attributes.aClothRef||!g.attributes.aBody)return;const r=g.attributes.aClothRef,b=g.attributes.aBody;for(let i=0;i<r.count;i++){const y=r.getY(i);if(b.getX(i)>.5&&y>top0-len0-.04&&y<top0+.04)BP.push(r.getX(i),y,r.getZ(i));}});let n=0;for(let i=0;i<BP.length;i+=3)if(Math.abs(BP[i+1]-top0)<.04){CZ+=BP[i+2];n++;}CZ=n?CZ/n:0;}
   for(const sx of [-1,1]){const top=F.top??.98,len=F.len??.24,w=F.w??.16,wb=F.wb??.24,X=sx*(F.x??.15),fl=F.flare??.05,NU=F.fit?18:6,NV=F.fit?10:6;const geo=new T.PlaneGeometry(1,1,NU,NV),pa=geo.attributes.position;
    const a0=(sx<0&&F.a0L!=null)?F.a0L:(sx>0&&F.a0R!=null)?F.a0R:(F.a0??.75),a1=F.a1??2.3,R0=F.r??.165;if(BP){// 体に沿う（各高さで体の外形の支持関数＝凸包で、脚の間はまたいでつなぐ。下へ行くほど細くならない）
     const prev=new Map();const idx=[...Array(pa.count).keys()].sort((a,b)=>pa.getY(b)-pa.getY(a));for(const i of idx){const u=pa.getX(i)+.5,v=.5-pa.getY(i),an=a0+(a1-a0)*u,y=top-v*len,dx=sx*Math.sin(an),dz=-Math.cos(an);let h=0;for(let k=0;k<BP.length;k+=3){if(Math.abs(BP[k+1]-y)>.018)continue;const d=BP[k]*dx+(BP[k+2]-CZ)*dz;if(d>h)h=d;}const key=Math.round(u*1000);h=Math.max(h,prev.get(key)||0);prev.set(key,h);const R=h+(F.gap??.008)+fl*v;pa.setXYZ(i,R*dx,y,CZ+R*dz);}}
    else for(let i=0;i<pa.count;i++){const u=pa.getX(i)+.5,v=.5-pa.getY(i),an=a0+(a1-a0)*u,R=R0+fl*v+.006*Math.sin(u*Math.PI);pa.setXYZ(i,sx*R*Math.sin(an),top-v*len,-R*Math.cos(an)*1.1);}geo.computeVertexNormals();
    const me=new T.Mesh(geo,mat);me.frustumCulled=false;const G=new T.Group();hips.add(G);G.position.copy(hips.worldToLocal(new T.Vector3(0,0,0)));G.quaternion.copy(hips.getWorldQuaternion(new T.Quaternion()).invert());G.add(me);}}}
 const A=new Actor(root,person,mats);applyFace(A,look);return A;}
 constructor(model,p,mats){this.person=p;this.model=model;this.materials=mats;this.bones={};this.base={};this.group=new T.Group();this.pivot=new T.Group();this.group.add(this.pivot);this.pivot.add(model);model.traverse(o=>{if(o.isBone){this.bones[o.name]=o;this.base[o.name]={q:o.quaternion.clone(),p:o.position.clone()};}});model.updateMatrixWorld(true);const hip=this.bones.J_Bip_C_Hips;if(!hip)throw Error('腰ボーンを確認できません');this.hipHeight=hip.getWorldPosition(new T.Vector3()).y;model.position.y=-this.hipHeight;this.height=[.88,1,1.16][p.height]||1;this.width={'細い':.84,'標準':1,'太い':1.24}[(p.look||p).build]||1;this.group.scale.set(this.width,this.height,this.width);this.meshes=[];model.traverseVisible(o=>{if(o.isMesh)this.meshes.push(o);});this.skeletons=[...new Set(this.meshes.filter(o=>o.isSkinnedMesh).map(o=>o.skeleton))];this.pose();this._prepareLegBasis();this._prepareSupports();this._prepareHairFloor();this.update();}
 pose(p={},x=0,z=0,yaw=0){for(const[n,b]of Object.entries(this.bones)){b.quaternion.copy(this.base[n].q);b.position.copy(this.base[n].p);}this.group.position.set(x,p.y??this.hipHeight*this.height,z);this.group.rotation.set(p.rx||0,yaw,p.rz||0,'YXZ');const rot=(s,v)=>{let b=this.bones['J_Bip_'+s];if(b)b.quaternion.multiply(new T.Quaternion().setFromEuler(new T.Euler(...v)));};rot('L_UpperArm',[0,0,1.32]);rot('R_UpperArm',[0,0,-1.32]);rot('L_LowerArm',[0,-.35,0]);rot('R_LowerArm',[0,.35,0]);for(const[k,v]of Object.entries(p.bones||{})){let b=this.bones['J_Bip_'+k];if(b)b.quaternion.copy(this.base['J_Bip_'+k].q).multiply(new T.Quaternion().setFromEuler(new T.Euler(...v)));}for(const[n,b]of Object.entries(this.bones))if(/_(Index|Middle|Ring|Little)[123]$/.test(n))b.rotation.z+=n.includes('_L_')?.65:-.65;this.update();}
 face(name,hold){this._faceName=name;this._faceTarget=FACE[name]||{};this._faceUntil=hold?performance.now()+hold*1000:0;}
 faceBase(name){this._faceBase=name;}
 faceStep(dt){if(!this.faceMeshes){this.faceMeshes=[];this.model.traverse(o=>{if(o.isMesh&&o.morphTargetInfluences&&o.visible)this.faceMeshes.push(o);});this._faceW=new Float32Array(41);}
  let tg=this._faceTarget;const P=this._persona||{};if(!tg||(this._faceUntil&&performance.now()>this._faceUntil)){tg=FACE[this._faceBase||'calm']||{};}
  const act=tg!==FACE.calm&&tg!==FACE.neutral;const mix={};for(const k in P)mix[k]=P[k]*(act?.5:1);for(const k in tg)mix[k]=Math.max(mix[k]||0,tg[k]);tg=mix;
  const k=1-Math.exp(-dt*12),W=this._faceW;for(let i=0;i<W.length;i++){const t=tg[i]||0;W[i]+=(t-W[i])*k;}
  for(const m of this.faceMeshes){const inf=m.morphTargetInfluences;for(let i=0;i<inf.length&&i<W.length;i++)inf[i]=W[i];}}
 update(){this.group.updateMatrixWorld(true);if(this._hairFloor)this._resolveHairFloor();for(const s of this.skeletons)s.update();/* 接地・手足の接触は骨行列から頂点を求めるので必ず更新 */}
 /* Fix03: the supplied HairLab assets have rigid strand objects, no hair
  * bones, skin weights or spring chains. Rotate the EXISTING long/tail strand
  * objects about their original cap-centre attachment only. Vertex/index
  * buffers, material, length, attachment and object scale are left unchanged.
  * This is a deterministic quasistatic floor hinge, not flexible hair physics.
  * It cannot bend a strand, resolve head/body contacts, or lift a buried root. */
 _prepareHairFloor(){this._hairFloor=[];const v=new T.Vector3();for(const m of this.meshes){if(m.material.name!=='HairLab_runtime'||!/(ロング外形|流れる毛先)/.test(m.name))continue;const p=m.geometry.attributes.position;if(!p||p.count<3)continue;m.updateMatrix();const root=v.fromBufferAttribute(p,p.count-2).clone(),tip=v.fromBufferAttribute(p,p.count-1).clone(),points=[];for(let i=0;i<p.count;i++)points.push(new T.Vector3().fromBufferAttribute(p,i).sub(root));this._hairFloor.push({mesh:m,rest:m.matrix.clone(),root,tip:tip.sub(root),points,lastParent:null,angle:0,minimumY:Infinity});m.matrixAutoUpdate=false;}}
 _resolveHairFloor(){const up=new T.Vector3(),axis=new T.Vector3(),q=new T.Quaternion(),rotation=new T.Matrix4(),world=new T.Matrix4(),pivot=new T.Vector3(),cross=new T.Vector3(),a=new T.Matrix4(),b=new T.Matrix4(),clearance=.002*this.height,maxAngle=.65;for(const h of this._hairFloor){const m=h.mesh,parent=m.parent.matrixWorld.elements;if(h.lastParent&&parent.every((x,i)=>x===h.lastParent[i]))continue;h.lastParent=parent.slice();world.multiplyMatrices(m.parent.matrixWorld,h.rest);const e=world.elements;pivot.copy(h.root).applyMatrix4(world);up.set(e[1],e[5],e[9]);const scale=up.length();if(scale<1e-12)continue;up.multiplyScalar(1/scale);axis.crossVectors(h.tip,up);h.angle=0;
   let restMin=Infinity;for(const point of h.points)restMin=Math.min(restMin,pivot.y+scale*up.dot(point));h.minimumY=restMin;m.matrix.copy(h.rest);
   if(restMin<clearance&&axis.lengthSq()>1e-12){axis.normalize();const terms=h.points.map(point=>[scale*up.dot(point),scale*up.dot(cross.crossVectors(axis,point))]);
    // axis is perpendicular to the floor normal, so Rodrigues' projection
    // reduces to A*cos(angle)+B*sin(angle). This checks every original vertex.
    const minimum=angle=>{const c=Math.cos(angle),s=Math.sin(angle);let min=Infinity;for(const [A,B] of terms)min=Math.min(min,pivot.y+A*c+B*s);return min;};
    let high=maxAngle;if(minimum(high)>=clearance){let low=0;for(let i=0;i<22;i++){const middle=(low+high)/2;if(minimum(middle)<clearance)low=middle;else high=middle;}h.angle=high;}else h.angle=maxAngle;
    // A fixed attachment cannot be translated out of the floor. Fade the
    // bounded hinge continuously as its original root reaches the mat; leave
    // any impossible root/scalp penetration visible for the audit to report.
    const w=Math.max(0,Math.min(1,(pivot.y-clearance)/(.02*this.height)));h.angle*=w*w*(3-2*w);
    if(h.angle){q.setFromAxisAngle(axis,h.angle);rotation.makeRotationFromQuaternion(q);a.makeTranslation(h.root.x,h.root.y,h.root.z);b.makeTranslation(-h.root.x,-h.root.y,-h.root.z);m.matrix.copy(h.rest).multiply(a).multiply(rotation).multiply(b);h.minimumY=minimum(h.angle);}
   }
   m.matrixWorld.multiplyMatrices(m.parent.matrixWorld,m.matrix);m.matrixWorldNeedsUpdate=false;
  }}
 world(p){return this.group.localToWorld(new T.Vector3(p[0],p[1]-this.hipHeight,p[2]));}
 bone(n){return this.bones['J_Bip_'+n].getWorldPosition(new T.Vector3());}
 aim(b,from,to){const q=b.getWorldQuaternion(new T.Quaternion()),pq=b.parent.getWorldQuaternion(new T.Quaternion()).invert(),dq=new T.Quaternion().setFromUnitVectors(from.normalize(),to.normalize());b.quaternion.copy(pq.multiply(dq.multiply(q))).normalize();this.update();}
 hand(side,target){const u=this.bones['J_Bip_'+side+'_UpperArm'],e=this.bones['J_Bip_'+side+'_LowerArm'],h=this.bones['J_Bip_'+side+'_Hand'];this.update();const S=u.getWorldPosition(new T.Vector3()),E=e.getWorldPosition(new T.Vector3()),H=h.getWorldPosition(new T.Vector3()),l1=S.distanceTo(E),l2=E.distanceTo(H),d=target.clone().sub(S),len=Math.min(d.length(),l1+l2-.001);d.normalize();const pole=this.world([side==='L'?-.6:.6,.88,.1]).sub(S);pole.addScaledVector(d,-pole.dot(d)).normalize();const xx=(l1*l1-l2*l2+len*len)/(2*Math.max(.001,len)),yy=Math.sqrt(Math.max(0,l1*l1-xx*xx)),desired=S.clone().addScaledVector(d,xx).addScaledVector(pole,yy);this.aim(u,E.clone().sub(S),desired.sub(S));const ee=e.getWorldPosition(new T.Vector3()),hh=h.getWorldPosition(new T.Vector3());this.aim(e,hh.sub(ee),target.clone().sub(ee));}
 elbow(side,target){const u=this.bones['J_Bip_'+side+'_UpperArm'],e=this.bones['J_Bip_'+side+'_LowerArm'],h=this.bones['J_Bip_'+side+'_Hand'];this.update();const s=u.getWorldPosition(new T.Vector3()),ep=e.getWorldPosition(new T.Vector3());this.aim(u,ep.sub(s),target.clone().sub(s));const ee=e.getWorldPosition(new T.Vector3()),hh=h.getWorldPosition(new T.Vector3());this.aim(e,hh.sub(ee),s.clone().add(new T.Vector3(0,.1,-.08)).sub(ee));}

 /* WorkMotion01: support regions contain only existing, skinned body vertices.
  * Region selection is frozen in the standing bind-relative pose. No geometry,
  * weights, bone lengths or person scale are changed. surface() is a surface
  * measurement, not a bone-centre proxy and not a collision guarantee. */
 /* Fix04: calibrate the anatomical leg frame from the PROVIDED rig. L/R
  * are not swapped: the original left hip is negative local X, right positive.
  * A nearly straight current knee is not a reliable pole: its projection can
  * change sign when an ankle target crosses the rest leg's chord. Toe-forward
  * and pelvis orientation provide an explicit bend reference instead. */
 _prepareLegBasis(){this.update();const inv=this.group.matrixWorld.clone().invert(),point=n=>this.bone(n).applyMatrix4(inv),up=new T.Vector3(0,1,0),right=point('R_UpperLeg').sub(point('L_UpperLeg')).normalize(),forward=new T.Vector3();this._legBasis={hipRig:this.rigQuaternion(this.bones.J_Bip_C_Hips),up,right,sides:{}};for(const side of ['L','R']){const hip=point(side+'_UpperLeg'),knee=point(side+'_LowerLeg'),ankle=point(side+'_Foot'),toe=point(side+'_ToeBase'),f=toe.clone().sub(ankle);f.addScaledVector(up,-f.dot(up)).normalize();forward.add(f);this._legBasis.sides[side]={hip,knee,ankle,toe,l1:hip.distanceTo(knee),l2:knee.distanceTo(ankle),forward:f};}forward.normalize();this._legBasis.forward=forward;}
 legPole(side,options={}){const inv=this.group.matrixWorld.clone().invert(),p=this.bone(side+'_UpperLeg').applyMatrix4(inv),basis=this._legBasis,delta=this.rigQuaternion(this.bones.J_Bip_C_Hips).multiply(basis.hipRig.clone().invert()),forward=options.forward?options.forward.clone().transformDirection(inv):basis.forward.clone().applyQuaternion(delta),distance=basis.sides[side].l1+basis.sides[side].l2;return p.addScaledVector(forward,distance).applyMatrix4(this.group.matrixWorld);}
 footForward(side,orientation=null){let direction;if(orientation){const worldQ=Array.isArray(orientation)?new T.Quaternion().fromArray(orientation):orientation,rig=this.group.quaternion.clone().invert().multiply(worldQ);direction=this.bones['J_Bip_'+side+'_ToeBase'].position.clone().applyQuaternion(rig).multiply(this.group.scale).applyQuaternion(this.group.quaternion);}else direction=this.bone(side+'_ToeBase').sub(this.bone(side+'_Foot'));direction.y=0;if(direction.lengthSq()<1e-10){direction=this.legDirection('forward').multiply(this.group.scale).applyQuaternion(this.group.quaternion);direction.y=0;}return direction.normalize();}
 legDirection(name='forward'){const basis=this._legBasis,delta=this.rigQuaternion(this.bones.J_Bip_C_Hips).multiply(basis.hipRig.clone().invert());return basis[name].clone().applyQuaternion(delta);}
 _prepareSupports(){this._supportRegions={};const v=new T.Vector3(),inv=this.group.matrixWorld.clone().invert();for(const side of ['L','R'])for(const kind of ['foot','knee','hand','elbow']){const joint={foot:'Foot',knee:'LowerLeg',hand:'Hand',elbow:'LowerArm'}[kind],center=this.bone(side+'_'+joint).applyMatrix4(inv),items=[];for(const mesh of this.meshes){if(!mesh.material.userData.body||!mesh.isSkinnedMesh)continue;const si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight;for(let i=0;i<si.count;i++){let influence=0;for(let k=0;k<4;k++){const name=mesh.skeleton.bones[si.getComponent(i,k)].name;if(!name.includes('_'+side+'_'))continue;const fits=kind==='foot'?/Foot|ToeBase|LowerLeg/.test(name):kind==='knee'?/UpperLeg|LowerLeg/.test(name):kind==='elbow'?/UpperArm|LowerArm/.test(name):/Hand|Thumb|Index|Middle|Ring|Little/.test(name);if(fits)influence+=sw.getComponent(i,k);}if(influence<.35)continue;mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld).applyMatrix4(inv);const near=kind==='foot'?v.y<center.y+.075:kind==='hand'?v.distanceTo(center)<.12:v.distanceTo(center)<(kind==='knee'?.105:.085);if(near)items.push([mesh,i]);}}this._supportRegions[side+'_'+kind]=items;}}
 surface(side,kind){this.update();const items=this._supportRegions?.[side+'_'+kind]||[],v=new T.Vector3(),point=new T.Vector3(0,Infinity,0);for(const [mesh,i]of items){mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);if(v.y<point.y)point.copy(v);}return{point,minY:point.y,count:items.length};}
 /* Aim directions in the bone parent's coordinates: unlike a world quaternion
  * decomposition this remains well-defined under actor width/height scaling. */
 rigQuaternion(b){const chain=[];for(let n=b;n&&n!==this.group;n=n.parent)chain.push(n);const q=new T.Quaternion();for(let i=chain.length-1;i>=0;i--)q.multiply(chain[i].quaternion);return q;}
 supportOrientation(b,q){b.quaternion.copy(this.rigQuaternion(b.parent).invert().multiply(q));this.update();}
 supportAim(b,from,to){const inv=b.parent.matrixWorld.clone().invert(),f=from.clone().transformDirection(inv),t=to.clone().transformDirection(inv);if(f.lengthSq()<1e-12||t.lengthSq()<1e-12)return;const dq=new T.Quaternion().setFromUnitVectors(f.normalize(),t.normalize());b.quaternion.premultiply(dq).normalize();this.update();}
 limb(side,kind,target,pole){const leg=kind==='leg',u=this.bones['J_Bip_'+side+(leg?'_UpperLeg':'_UpperArm')],k=this.bones['J_Bip_'+side+(leg?'_LowerLeg':'_LowerArm')],end=this.bones['J_Bip_'+side+(leg?'_Foot':'_Hand')],inv=this.group.matrixWorld.clone().invert(),local=b=>b.getWorldPosition(new T.Vector3()).applyMatrix4(inv),p=local(u),q=local(k),r=local(end),goal=target.clone().applyMatrix4(inv),d=goal.clone().sub(p),l1=p.distanceTo(q),l2=q.distanceTo(r),len=Math.max(Math.abs(l1-l2)+.0001,Math.min(l1+l2-.0001,d.length()));d.normalize();const chosen=pole||(leg?this.legPole(side):null);let normal=chosen?chosen.clone().applyMatrix4(inv).sub(p):q.clone().sub(p);normal.addScaledVector(d,-normal.dot(d));if(normal.lengthSq()<1e-8){if(leg){normal.copy(this.legDirection('up'));normal.addScaledVector(d,-normal.dot(d));if(normal.lengthSq()<1e-8){normal.copy(this.legDirection('right'));normal.addScaledVector(d,-normal.dot(d));}}else normal.set(0,0,1).addScaledVector(d,-d.z);}normal.normalize();const x=(l1*l1-l2*l2+len*len)/(2*len),y=Math.sqrt(Math.max(0,l1*l1-x*x)),bend=p.clone().addScaledVector(d,x).addScaledVector(normal,y).applyMatrix4(this.group.matrixWorld);this.supportAim(u,k.getWorldPosition(new T.Vector3()).sub(u.getWorldPosition(new T.Vector3())),bend.sub(u.getWorldPosition(new T.Vector3())));this.supportAim(k,end.getWorldPosition(new T.Vector3()).sub(k.getWorldPosition(new T.Vector3())),target.clone().sub(k.getWorldPosition(new T.Vector3())));return end.getWorldPosition(new T.Vector3()).distanceTo(target);}
 knee(side,target){const u=this.bones['J_Bip_'+side+'_UpperLeg'],k=this.bones['J_Bip_'+side+'_LowerLeg'],shin=this.rigQuaternion(k);this.supportAim(u,k.getWorldPosition(new T.Vector3()).sub(u.getWorldPosition(new T.Vector3())),target.clone().sub(u.getWorldPosition(new T.Vector3())));this.supportOrientation(k,shin);return k.getWorldPosition(new T.Vector3()).distanceTo(target);}
 /* target.x/z: support JOINT's horizontal position. target.y: requested lowest
  * region surface height. No pelvis translation occurs here. The caller owns
  * reachability/root choice and must inspect residuals across the interval. */
 support(side,kind,target,weight=1){weight=Math.max(0,Math.min(1,weight));if(!weight)return;const joint={foot:'Foot',knee:'LowerLeg',hand:'Hand',elbow:'LowerArm'}[kind],names=kind==='foot'?[side+'_UpperLeg',side+'_LowerLeg',side+'_Foot']:kind==='knee'?[side+'_UpperLeg',side+'_LowerLeg']:kind==='hand'?[side+'_UpperArm',side+'_LowerArm',side+'_Hand']:[side+'_UpperArm'],old=names.map(n=>this.bones['J_Bip_'+n].quaternion.clone()),j=this.bones['J_Bip_'+side+'_'+joint],desired=target.clone();if(kind==='foot'){const f=this.bones['J_Bip_'+side+'_Foot'],q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),this.group.rotation.y).multiply(this._flatFeet?.[side]||this.base['J_Bip_'+side+'_Foot'].q);this.supportOrientation(f,this.group.quaternion.clone().invert().multiply(q));}for(let i=0;i<4;i++){const point=this.surface(side,kind);if(!Number.isFinite(point.minY))break;desired.y=target.y+j.getWorldPosition(new T.Vector3()).y-point.minY;if(kind==='foot'||kind==='hand'){const endQ=this.rigQuaternion(j);this.limb(side,kind==='foot'?'leg':'arm',desired,kind==='foot'?this.legPole(side,{forward:this.footForward(side)}):undefined);this.supportOrientation(j,endQ);}else if(kind==='knee')this.knee(side,desired);else{const u=this.bones['J_Bip_'+side+'_UpperArm'];this.supportAim(u,j.getWorldPosition(new T.Vector3()).sub(u.getWorldPosition(new T.Vector3())),desired.clone().sub(u.getWorldPosition(new T.Vector3())));}}if(weight<1){names.forEach((n,i)=>this.bones['J_Bip_'+n].quaternion.copy(old[i].slerp(this.bones['J_Bip_'+n].quaternion,weight)));this.update();}return{surface:this.surface(side,kind),joint:j.getWorldPosition(new T.Vector3()),target:target.clone()};}

 /* Fix02 contact patches refer to the SAME existing deformed skin vertices
  * throughout a planted interval. A changing lowest-vertex identity is useful
  * for floor penetration, but is not a fixed contact patch. These helpers never
  * move a root, change bone translations, scale, mesh or skin weights. */
 contactPatch(side,kind,options={}){
  this.update();const items=this._supportRegions?.[side+'_'+kind]||[],v=new T.Vector3(),rows=[];
  for(const [mesh,index]of items){mesh.getVertexPosition(index,v).applyMatrix4(mesh.matrixWorld);rows.push({meshIndex:this.meshes.indexOf(mesh),index,p:v.clone()});}
  if(!rows.length)return null;rows.sort((a,b)=>a.p.y-b.p.y);const low=rows[0].p,band=options.band??.0025*Math.max(this.height,this.width),radius=options.radius??.028*Math.min(this.height,this.width),chosen=rows.filter(x=>x.p.y<=low.y+band&&Math.hypot(x.p.x-low.x,x.p.z-low.z)<=radius),joint={foot:'Foot',knee:'LowerLeg',hand:'Hand',elbow:'LowerArm'}[kind],b=this.bones['J_Bip_'+side+'_'+joint],worldOrientation=this.group.quaternion.clone().multiply(this.rigQuaternion(b)).normalize();
  return {side,kind,vertices:chosen.map(({meshIndex,index})=>({meshIndex,index})),orientation:worldOrientation.toArray()};
 }
 patchPoint(patch){this.update();const point=new T.Vector3(),v=new T.Vector3();let count=0,minY=Infinity,maxY=-Infinity;for(const ref of patch?.vertices||[]){const mesh=this.meshes[ref.meshIndex];if(!mesh?.isSkinnedMesh||ref.index<0||ref.index>=mesh.geometry.attributes.position.count)continue;mesh.getVertexPosition(ref.index,v).applyMatrix4(mesh.matrixWorld);point.add(v);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);count++;}if(count)point.multiplyScalar(1/count);return{point,count,minY,maxY};}
 _supportJoint(side,kind){return this.bones['J_Bip_'+side+'_'+({foot:'Foot',knee:'LowerLeg',hand:'Hand',elbow:'LowerArm'}[kind])];}
 /* Iterate the actual patch centroid to an authored WORLD XYZ anchor. For a
  * hand patch its captured world rig orientation is held unless explicitly
  * disabled. The residual reports unreachable goals instead of calling a
  * clamped arm a successful planted support. */
 supportPatch(side,kind,target,patch,options={}){
  if(!patch)return null;const j=this._supportJoint(side,kind),lock=options.lockOrientation!==false&&(kind==='hand'||kind==='foot'),orientation=options.orientation?new T.Quaternion().fromArray(options.orientation):patch.orientation?new T.Quaternion().fromArray(patch.orientation):null;
  if(lock&&orientation)this.supportOrientation(j,this.group.quaternion.clone().invert().multiply(orientation));
  for(let i=0;i<(options.iterations??7);i++){const measured=this.patchPoint(patch),delta=target.clone().sub(measured.point);if(delta.lengthSq()<1e-14)break;const goal=j.getWorldPosition(new T.Vector3()).add(delta),q=this.rigQuaternion(j);
   if(kind==='hand'||kind==='foot')this.limb(side,kind==='foot'?'leg':'arm',goal,options.pole||(kind==='foot'?this.legPole(side,{forward:this.footForward(side)}):undefined));
   else if(kind==='knee')this.knee(side,goal);
   else{const upper=this.bones['J_Bip_'+side+'_UpperArm'];this.supportAim(upper,j.getWorldPosition(new T.Vector3()).sub(upper.getWorldPosition(new T.Vector3())),goal.sub(upper.getWorldPosition(new T.Vector3())));}
   if(lock)this.supportOrientation(j,orientation?this.group.quaternion.clone().invert().multiply(orientation):q);
  }
  const measured=this.patchPoint(patch),surface=this.surface(side,kind),delta=target.clone().sub(measured.point);return{patch:measured,surface,joint:j.getWorldPosition(new T.Vector3()),target:target.clone(),error:delta.length(),horizontalError:Math.hypot(delta.x,delta.z),verticalError:delta.y};
 }
 /* Reach test in actor scale-free coordinates; elbow is a single fixed-length
  * upper arm. fitSupportRoot RETURNS a translation, it does not apply one.
  * Motion owns the authored pelvis path and the order of other supports. */
 supportReach(side,kind,target,patch){
  const j=this._supportJoint(side,kind),upper=this.bones['J_Bip_'+side+(kind==='foot'||kind==='knee'?'_UpperLeg':'_UpperArm')],middle=this.bones['J_Bip_'+side+(kind==='foot'||kind==='knee'?'_LowerLeg':'_LowerArm')],inv=this.group.matrixWorld.clone().invert(),pos=b=>b.getWorldPosition(new T.Vector3()).applyMatrix4(inv),start=pos(upper),mid=pos(middle),end=pos(j),offset=patch?target.clone().sub(this.patchPoint(patch).point):target.clone().sub(j.getWorldPosition(new T.Vector3())),goal=j.getWorldPosition(new T.Vector3()).add(offset).applyMatrix4(inv),d=goal.sub(start),l1=start.distanceTo(mid),l2=mid.distanceTo(end),single=kind==='elbow'||kind==='knee',maximum=single?l1:Math.max(.0001,l1+l2-.0002),minimum=single?l1:Math.abs(l1-l2)+.0002,distance=d.length(),error=single?distance-maximum:Math.max(minimum-distance,0,distance-maximum);
  return{distance,minimum,maximum,error,reachable:single?Math.abs(error)<.0001:distance<=maximum&&distance>=minimum,direction:d,desiredJoint:j.getWorldPosition(new T.Vector3()).add(offset)};
 }
 fitSupportRoot(side,kind,target,patch,options={}){
  const reach=this.supportReach(side,kind,target,patch),single=kind==='elbow'||kind==='knee',desired=single?reach.maximum:Math.max(reach.minimum,Math.min(reach.maximum,reach.distance)),delta=new T.Vector3();
  if(Math.abs(reach.distance-desired)<.00001)return{delta,reach,method:'already_reachable'};
  const inv=this.group.matrixWorld.clone().invert(),zero=new T.Vector3().applyMatrix4(inv),v=new T.Vector3(0,1,0).applyMatrix4(inv).sub(zero),d=reach.direction,A=v.lengthSq(),B=-2*d.dot(v),C=d.lengthSq()-desired*desired,disc=B*B-4*A*C;
  let method='y';if(options.axis!=='xyz'&&disc>=0&&A>1e-10){const roots=[(-B+Math.sqrt(disc))/(2*A),(-B-Math.sqrt(disc))/(2*A)].sort((a,b)=>Math.abs(a)-Math.abs(b));delta.y=roots[0];}
  else{method='local_radial';if(reach.distance>1e-10){const local=d.clone().multiplyScalar(1-desired/reach.distance),origin=new T.Vector3().applyMatrix4(this.group.matrixWorld);delta.copy(local.applyMatrix4(this.group.matrixWorld).sub(origin));}}
  if(options.maxDistance!==undefined&&delta.length()>options.maxDistance)delta.setLength(options.maxDistance);
  return{delta,reach,method};
 }
 ground(clearance=.018){this.update();let min=Infinity;const v=new T.Vector3();for(const mesh of this.meshes){if(!mesh.material.userData.body)continue;const cnt=mesh.geometry.attributes.position.count,st=Math.max(4,Math.ceil(cnt/350));for(let i=0;i<cnt;i+=st){mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);min=Math.min(min,v.y);}}if(Number.isFinite(min)&&min<clearance){this.group.position.y+=clearance-min;this.update();}return min;}
 dispose(){this.materials.forEach(m=>m.dispose());this.meshes.forEach(m=>{if(m.material.userData.body)m.geometry.dispose();});this.group.removeFromParent();}
}
function mesh(s,g,color,pos,rot){const m=new T.Mesh(g,new T.MeshBasicMaterial({color,side:T.DoubleSide}));if(pos)m.position.set(...pos);if(rot)m.rotation.set(...rot);s.add(m);return m;}
function arena(){const s=new T.Scene();s.background=new T.Color(0x11131e);s.add(new T.HemisphereLight(0xffffff,0x333344,2));mesh(s,new T.PlaneGeometry(24,24),0x171c2d,[0,-.24,0],[-Math.PI/2,0,0]);mesh(s,new T.BoxGeometry(6.8,.2,6.8),0x222e46,[0,-.12,0]);const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const c=canvas.getContext('2d');c.fillStyle='#b9c8d2';c.fillRect(0,0,1024,1024);c.strokeStyle='#e8eef2';c.lineWidth=4;c.strokeRect(45,45,934,934);c.save();c.translate(512,512);c.rotate(-Math.PI/2);c.textAlign='center';c.fillStyle='#8198ac';c.font='bold 92px sans-serif';c.fillText('WOMEN PRO',0,-20);c.font='bold 50px sans-serif';c.fillText('WRESTLING SIMULATOR',0,52);c.font='bold 40px sans-serif';c.fillText('女子プロレスシミュレーター',0,112);c.restore();const tx=new T.CanvasTexture(canvas);tx.colorSpace=T.SRGBColorSpace;const mat=new T.MeshBasicMaterial({map:tx,side:T.DoubleSide}),floor=new T.Mesh(new T.PlaneGeometry(6,6),mat);floor.rotation.x=-Math.PI/2;s.add(floor);
 for(const x of[-3,3])for(const z of[-3,3]){mesh(s,new T.CylinderGeometry(.065,.07,1.55,8),x<0?0xc85e66:0x528ccb,[x,.65,z]);for(const y of[.45,.85,1.2])mesh(s,new T.BoxGeometry(.22,.17,.22),x<0?0xb94656:0x3b6796,[x,y,z]);}for(const y of[.45,.85,1.2])for(const a of[-1,1]){let r=mesh(s,new T.CylinderGeometry(.018,.018,6,6),0xe1d9d1,[0,y,a*3],[0,0,Math.PI/2]),r2=mesh(s,new T.CylinderGeometry(.018,.018,6,6),0xe1d9d1,[a*3,y,0],[Math.PI/2,0,0]);r.userData.ropeWall=[0,a];r2.userData.ropeWall=[a,0];}for(let i=0;i<16;i++){let a=i/16*Math.PI*2;mesh(s,new T.BoxGeometry(.4,.1,.2),0x516b97,[Math.cos(a)*5.6,1.5,Math.sin(a)*5.6]);}return s;}
YR.Visual={T,Actor,arena,clothAt,parse};})();


/* ---- src/i18n/en_all.js ---- */
window.IW_EN = {"ツインキャノン":"Twin Cannon","ベリータンク":"Belly Tank","ロングホース":"Long Hose","ホールタンク":"Back Tank","ブルーセイバー":"Blue Saber","ふつう":"Normal","不調":"Struggling","スーツ機能停止":"Suit Shutdown","変身解除":"Transformation Undone","たおれた":"Down","塊":"Clump","整列":"Rows","間隔":"Spaced","ばらばら":"Random","{0}・増":"{0}+","赤組":"Red Team","白組":"White Team","ジャンプ中：ホールタンクに当たり、即はじける":"Mid-jump: hits the Back Tank, instant burst","背中側：表には当たらない":"Back side: can't hit the front","真後ろ：背中のホールタンク（半分の確率で、即はじける）":"Directly behind: the Back Tank on her back (50% chance of instant burst)","相手のキャノン":"opponent's cannon","相手のホース":"opponent's hose","相手のベリータンク":"opponent's Belly Tank","インク漏れなので、即はじける":"She's leaking ink, so instant burst","ベリータンクが満タン：たいてい即はじける":"Belly Tank is full: usually an instant burst","ベリータンクにひび（インク漏れ）":"Cracked Belly Tank (ink leak)","こわれて、インク漏れ":"Broken, leaking ink","（武器はもうないので）":"(no weapons left)","インク戦闘員<br><b>ウォーズ</b>":"INK MINION<br><b>WARS</b>","スライム戦闘員40人 対 ヒーロー。マス目の上で、インクを撃ちあう連鎖パズルバトル":"40 Slime Minions vs. 1 Hero. A chain-reaction puzzle battle of ink-shooting on a grid","<b>🗺️ ステージ</b><small>インク団のアジトを、奥へ進む</small>":"<b>🗺️ Stages</b><small>Push deeper into the Ink Corps hideout</small>","<b>⚔️ フリー対戦</b><small>ヒーロー対決・紅白戦・個人戦</small>":"<b>⚔️ Free Battle</b><small>Hero Showdown · Red vs. White · Free-for-All</small>","📘 遊び方":"📘 How to Play","⚙️ 設定":"⚙️ Settings","Ver. {0} すべて架空の作品です":"Ver. {0} This is a work of fiction","声：{0}":"Voices: {0}","モード":"Mode","操作":"Control","並べ方":"Formation","盤の広さ":"Board size","増援":"Reinforcements","対戦開始！":"Start!","🦸 ヒーロー対決":"🦸 Hero Showdown","🔴⚪ 紅白戦":"🔴⚪ Red vs. White","🎯 個人戦":"🎯 Free-for-All","自分で操作":"Play myself","観戦（AI どうし）":"Watch (AI vs. AI)","19マス":"19 tiles","25マス":"25 tiles","31マス":"31 tiles","強化ヒーロー":"Powered-up Hero","四隅に毎ターン":"At the 4 corners every turn","ヒーロー1人 対 スライム戦闘員40人。「自分で操作」はヒーローを動かす。":"1 Hero vs. 40 Slime Minions. \"Play myself\" lets you control the Hero.","ヒーローをたおすために、仲間どうしで鍛え合う。赤組20人 対 白組20人。「自分で操作」は赤組を1人ずつ指揮する。相手を全滅させた組の勝ち。":"The minions train against each other to beat the Hero. 20 Red vs. 20 White. \"Play myself\" lets you command the Red Team one by one. Wipe out the other team to win.","40人全員が敵どうしのバトルロイヤル。最後まで残った1人が優勝。「自分で操作」は、1人（頭の上に黄色い矢印）を動かす。動く順は、ラウンドごとにくじ引き。":"A 40-minion battle royale where everyone is an enemy. The last one standing wins. \"Play myself\" controls one minion (yellow arrow over her head). Turn order is drawn by lot each round.","声":"Voice","📦 導入したモデル・作った声を書き出す":"📦 Export imported models & made voices","💬 じっくり（セリフで反応）":"💬 Relaxed (minions react with lines)","⚡ テンポ重視（パズルのように速く）":"⚡ Fast Tempo (quick, like a puzzle)","速い":"Fast","ゆっくり":"Slow","声ファイル（なければ読み上げ）":"Voice files (text-to-speech if missing)","読み上げ":"Text-to-speech","🎙️ 声の取り込み":"🎙️ Import Voices","🎙️ 声づくりの部屋":"🎙️ Voice Studio","声づくりの部屋で作った声があります（{0}個）。":"There are voices made in the Voice Studio ({0}).","声ファイルが入っています（{0}個）。":"Voice files are installed ({0}).","声ファイルはまだないので、端末の読み上げでしゃべります。":"No voice files yet, so the device's text-to-speech will talk.","（この端末は読み上げに対応していません）":"(This device doesn't support text-to-speech)","<b>使うモデル</b>（モデルの部屋で変える）：戦闘員＝{0} ／ ヒーロー＝{1}":"<b>Models in use</b> (change in the Model Room): Minions = {0} / Hero = {1}","遊び方":"How to Play","<b>ヒーロー1人</b>と、インク団の<b>スライム戦闘員40人</b>の対決です。戦闘員の正体は、女の子の姿に変身したスライム。<b>スライムインク</b>を撃って、ヒーローも自分たちと同じスライムにしようとしています。ヒーローは、戦闘員のインクタンクをはじけさせて、もとの小さなスライムに戻します。":"It's <b>1 Hero</b> vs. the Ink Corps' <b>40 Slime Minions</b>. The minions are really slimes who've transformed into girls. They shoot <b>slime ink</b> to turn the Hero into a slime just like them. The Hero bursts the minions' ink tanks to turn them back into little slimes.","戦闘員の体":"A minion's body","<b>ツインキャノン</b>（肩）：射程は満タンのとき3、ふだん2。相手のキャノンをつぶすと1ずつ伸びる（最大4）。左右で2人まで撃てる。":"<b>Twin Cannon</b> (shoulders): Range 3 when full, normally 2. +1 for each enemy cannon destroyed (max 4). Can shoot up to 2 targets, left and right.","<b>ロングホース</b>（右手）：射程3。1ターンたつと4、撃つたびに1ずつ伸びる（最大5）。":"<b>Long Hose</b> (right hand): Range 3. Becomes 4 after 1 turn, then +1 each time it fires (max 5).","<b>ジャンプ噴射</b>（背中のホールタンク）：タンクの下の穴（ホール）からインクを噴いて跳び、自分のまわりの凸の形（前と左右）を一気にインクまみれにする。ヒーローに当たればインク5回分。<b>ジャンプ中は、どこから撃たれても即はじける</b>。はじけた相手の飛沫は、宙に浮いて離れているので、届くかは運次第（半々）。届けば自分もはじける。":"<b>Jump Jet</b> (Back Tank): Sprays ink from the hole under the tank to jump, drenching the T-shape around her (front, left, right) in one go. Hitting the Hero counts as 5 hits of ink. <b>While jumping, a hit from any direction bursts her instantly</b>. The spray from a minion she bursts is up in the air and away, so whether it reaches her is luck (50/50). If it does, she bursts too.","<b>ベリータンク</b>（お腹）：はじめは<b>満タン</b>（満タンは、このタンクのこと）。満タンのベリータンクに当たると、たいてい即はじけて、隣の満タンの子まで<b>連鎖</b>する。撃つと満タンは解ける。2巡撃たないと、また満タンになる。キャノンやホースに当たったときは、満タンでも、こわれてインク漏れになるだけ。":"<b>Belly Tank</b> (belly): Starts <b>full</b> (\"full\" always means this tank). A hit on a full Belly Tank usually bursts her instantly, setting off a <b>chain</b> to full minions next to her. Firing empties it; it fills up again after 2 rounds without firing. A hit on the cannon or hose, even when full, just breaks it into an ink leak.","インク漏れ":"Ink leak","当たっても、満タンでなければ「インク漏れ」。当たった部分が使えなくなる。2ターンまでもつ（1ターン目の終わりにペタン座りになって動けなくなり、2ターン目の終わりにはじける）。もう1発当たると即はじける。ヒーローの隣でインク漏れになった子は、仲間に撃ってもらって自爆し、ヒーローにインク5回分を浴びせることがある。":"If a hit doesn't burst her (not full), she starts leaking ink. The part that was hit stops working. She lasts up to 2 turns (at the end of turn 1 she plops down and can't move; at the end of turn 2 she bursts). One more hit bursts her instantly. A leaking minion next to the Hero may have a friend shoot her to self-destruct, splashing the Hero with 5 hits of ink.","背中":"Back","背中側からは、表のキャノン・タンク・ホースには当たらない。<b>真後ろの一直線</b>からだけ、背中のホールタンクをねらえる（半分の確率で、即はじける）。":"From behind, you can't hit the cannon, tank or hose on her front. Only from <b>a straight line directly behind</b> can you aim at the Back Tank (50% chance of an instant burst).","移動5マス。攻撃は<b>移動の前と後に1回ずつ</b>（先に動くと、後の1回だけ）。":"Moves 5 tiles. Attacks <b>once before and once after moving</b> (if you move first, only the one after).","<b>ブレード</b>：隣の1人。背中からなら一刀。表からなら両断して、その先の1人にも衝撃波。":"<b>Blade</b>: One adjacent minion. From behind, one clean slash. From the front, it cuts through and sends a shockwave to the one beyond.","<b>レーザー</b>：10マス。縦か横の一直線なら<b>貫通</b>（狙った高さの部分がある子すべてに当たる）。":"<b>Laser</b>: 10 tiles. In a straight vertical or horizontal line it <b>pierces</b> (hits every minion with a part at the height you aimed).","<b>わざ</b>：薙ぎ払い（隣8マス）・ハレー彗星（一直線10マス）。強化ヒーローは、レーザーブレイク（5マス以内の全員）とホーミングも使える。使うと3ターン休み。":"<b>Specials</b>: Sweep (8 surrounding tiles) and Halley's Comet (10 tiles in a line). The Powered-up Hero can also use Laser Break (everyone within 5 tiles) and Homing. Each needs 3 turns to recharge.","スーツの<b>よごれ</b>（浴びたスライムインク）：50をこえると肌がだんだん青くなる。55で不調（撤退を始める。端に着いて2ターンで去る）・60でスーツ機能停止・70で変身解除・80でたおれて、<b>スライムになってインク団の仲間入り</b>。":"The suit's <b>grime</b> (slime ink taken): over 50, the skin slowly turns blue. 55: Struggling (starts retreating; leaves 2 turns after reaching the edge), 60: Suit Shutdown, 70: Transformation Undone, 80: Down — <b>she becomes a slime and joins the Ink Corps</b>.","同士討ち":"Friendly fire","外れた弾・かわされた弾は、ヒーローの向こうへ飛んでいき、そこにいる仲間に当たることがある。":"Shots that miss or get dodged fly past the Hero and can hit a friend on the other side.","勝ち負け":"Winning and losing","ヒーローは、戦闘員を全員はじけさせれば勝ち。戦闘員は、ヒーローを撤退させるか、たおせば勝ち。":"The Hero wins by bursting every minion. The minions win by making the Hero retreat or go down.","ステージ":"Stages","タイトルの「🗺️ ステージ」。ヒーローが1人で、インク団のアジトを奥へ進む。面ごとに、決まった並びの戦闘員を<b>決まったターンのうちに全員はじけさせれば</b>クリア（★1）。面ごとの目標2つを満たすと★がふえる（最大★3）。よごれは面ごとに0から。負けたら、その面をやり直す。クリアすると次の面が開く。クリアした面は、何度でも遊べる。":"\"🗺️ Stages\" on the title screen. The Hero alone pushes deeper into the Ink Corps hideout. Each stage has a set lineup of minions; <b>burst them all within the turn limit</b> to clear it (★1). Meet the stage's 2 goals for more stars (up to ★3). Grime starts at 0 each stage. If you lose, retry that stage. Clearing opens the next one. Cleared stages can be played again anytime.","<b>アジト第2層：インクのタンク置き場</b> 盤の上の<b>インクタンク</b>は、撃つ・斬る・飛沫がかかると大爆発する。まわり1マスの戦闘員は即はじけ、2マスの戦闘員には飛沫がかかる。2マス以内のほかのタンクも誘爆する。ヒーローも、1マスならよごれ6、2マスならよごれ3。後半の戦闘員は、ヒーローのそばのタンクを撃ってくる。第2層の班長は、何回か当てないとはじけない（タンクの爆発や飛沫でも1回）。":"<b>Hideout Level 2: Ink Tank Storage</b> The <b>ink tanks</b> on the board explode when shot, slashed or splashed. Minions within 1 tile burst instantly; minions 2 tiles away get splashed. Other tanks within 2 tiles go off too. The Hero takes 6 grime at 1 tile, 3 grime at 2 tiles. Later minions shoot at tanks near the Hero. The Level 2 Squad Leader takes several hits to burst (a tank blast or splash counts as 1).","<b>アジト第9層：首領の間</b> これまでのしかけが全部そろう最後の層。いちばん奥には<b>首領ノワール</b>（頭に金の王冠のチビ）。<b>部下が1人でも残っているあいだは、首領に攻撃は効かない</b>。部下をみんなはじけさせると、首領が<b>覚醒</b>して大きくなり、体力が増え、2ターンに1回<b>インクの雨</b>を降らせる（よごれ+3。<b>柱や壁のかげ</b>にいれば当たらない）。覚醒した首領は、こちらに近づかずに逃げ回る。":"<b>Hideout Level 9: The Boss's Hall</b> The final level, with every gimmick so far. Deepest inside is <b>Boss Noir</b> (the little one with a gold crown). <b>While even one of her minions remains, attacks don't work on the Boss</b>. Burst all her minions and the Boss <b>awakens</b>, growing big with more HP, and every 2 turns brings <b>ink rain</b> (+3 grime; safe <b>behind pillars or walls</b>). The awakened Boss keeps her distance and runs around.","<b>特別ステージ：首領の間への通路</b> この面だけ、ヒーローは<b>となりの戦闘員をつかんで、鉄柱へ放り投げる</b>（4マス以内のいちばん近い鉄柱。攻撃1回ぶん。この面は攻撃が1つの番に3回）。鉄柱につながった子は、もう動けない。全員を、はじけさせるか鉄柱につなげばクリア。":"<b>Special Stage: Passage to the Boss's Hall</b> On this stage only, the Hero <b>grabs adjacent minions and hurls them onto a steel pole</b> (the nearest pole within 4 tiles; counts as 1 attack; on this stage you get 3 attacks per turn). Minions stuck on a pole can't move anymore. Clear it by bursting every minion or sticking them on poles.","<b>アジト第8層：ワープの実験室</b> 同じ色に光る輪は<b>ワープ床</b>（2つでひと組）。上で止まると、<b>もう一方へ飛ぶ</b>（ヒーローも戦闘員も。出口にだれかいれば飛ばない）。ワープ床にレーザーを撃つと、<b>もう一方から同じ向きに</b>出ていく（鏡と組み合わせることも）。第8層の幹部は<b>すばやい</b>（1つの番に2回動く）。":"<b>Hideout Level 8: Warp Lab</b> Rings glowing the same color are <b>warp pads</b> (a pair). Stop on one and you <b>fly to the other</b> (Hero and minions alike; not if someone is on the exit). Fire a laser into a warp pad and it comes out <b>of the other one in the same direction</b> (combine with mirrors too). The Level 8 Officer is <b>fast</b> (moves twice per turn).","<b>アジト第7層：鏡の回廊</b> ななめの板は<b>鏡</b>。一直線に見えている鏡にレーザーを当てると、<b>直角に曲がって</b>つらぬく（鏡から鏡へ、全部で10マスまで）。当たり方は、曲がってきた向きで決まるので、正面を向いた子の横や、うしろ向きの子の正面からも当てられる。鏡は通れず、戦闘員の弾・流星・爆風は止まる。第7層の幹部は<b>はね返しの盾</b>（正面からのレーザー・ブレードをはね返す）。":"<b>Hideout Level 7: Mirror Corridor</b> The diagonal panels are <b>mirrors</b>. Hit a mirror in a straight line with the laser and it <b>turns at a right angle</b> and pierces on (mirror to mirror, up to 10 tiles in all). Where it hits depends on the direction it comes from, so you can hit the side of a front-facing minion, or the front of one facing away. Mirrors block movement and stop minion shots, comets and blasts. The Level 7 Officer has a <b>Reflect Shield</b> (bounces lasers and blades from the front).","<b>アジト第6層：救護係の医務室</b> 頭の上に白い十字の子は<b>救護係</b>。となりのインク漏れの仲間を<b>治して</b>しまう（こわれた武器やタンクも元どおり）。先に救護係をねらおう。第6層の最後は<b>幹部</b>。幹部は班長より大きく、ピンクの印。":"<b>Hideout Level 6: Medic Room</b> Minions with a white cross over their heads are <b>medics</b>. They <b>heal</b> leaking friends next to them (broken weapons and tanks too). Go for the medics first. The end of Level 6 has an <b>Officer</b>. Officers are bigger than Squad Leaders, with a pink mark.","<b>アジト第5層：地下水路のインクだまり</b> 床の紫の水たまりは<b>インクだまり</b>。ヒーローが通ると<b>1マスごとによごれ+1</b>（紫に光る行き先は、だまりを通る）。戦闘員がはじけた所・タンクの爆発のまわりに、新しいだまりができる。だまりの上の戦闘員は、毎ターン<b>満タン</b>になる（連鎖のチャンスにも）。":"<b>Hideout Level 5: Underground Ink Pools</b> The purple puddles on the floor are <b>ink pools</b>. The Hero gets <b>+1 grime per tile</b> walking through them (destinations glowing purple pass through a pool). New pools form where minions burst and around tank blasts. Minions standing in a pool become <b>full</b> every turn (a chance for chains, too).","<b>アジト第4層：インク工場のコンベア</b> 光る矢印の床は<b>ベルトコンベア</b>。戦闘員の番が終わるたびに、上にいる戦闘員・ヒーロー・タンクを1マス運ぶ。作業員は持ち場から歩かないが、コンベアには運ばれる。運ばれて一列にそろう・タンクのそばに集まるのを<b>待つのも作戦</b>。ヒーローも運ばれるので注意。":"<b>Hideout Level 4: Ink Factory Conveyors</b> Floors with glowing arrows are <b>conveyor belts</b>. After each minion turn, they carry the minions, Hero and tanks on them 1 tile. Workers never leave their posts, but the belts still carry them. <b>Waiting is a strategy too</b>, for them to line up or gather near a tank. Careful: the Hero gets carried too.","<b>ボーナス：固定砲台部隊</b> 壁にはりついた25人。だれでもいいので一撃を……。":"<b>Bonus: Fixed Cannon Squad</b> 25 minions stuck to the wall. Just one hit on anyone...","<b>アジト第3層：柱の倉庫</b> 盤の上の<b>柱</b>は通れない。レーザー・戦闘員の弾・ハレー彗星は柱で止まり、タンクの爆風も柱のかげにはとどかない。柱のかげで番を終えると撃たれにくい。回りこんで、ねらいの通る場所をさがそう。":"<b>Hideout Level 3: Pillar Warehouse</b> You can't pass through the <b>pillars</b> on the board. Lasers, minion shots and Halley's Comet stop at pillars, and tank blasts don't reach behind them. Ending your turn behind a pillar makes you harder to hit. Go around and find a spot with a clear line.","紅白戦":"Red vs. White","ヒーローをたおすために、仲間どうしで鍛え合う。<b>赤組20人 対 白組20人</b>。赤と白が<b>1人ずつ交互に</b>動く（先に動く組は、ラウンドごとに入れかわる）。相手を全員はじけさせた組の勝ち。":"The minions train against each other to beat the Hero. <b>20 Red vs. 20 White</b>. Red and White move <b>one at a time, taking turns</b> (the team that goes first switches every round). The team that bursts all opponents wins.","武器で戦うが、<b>その武器が弱点</b>。キャノンの弾は相手のキャノンに、ホースの弾は相手のホース（腰）に当たる。当たった武器はこわれて、インク漏れ（満タンかどうかは関係ない）。":"They fight with weapons, but <b>those weapons are weak points</b>. Cannon shots hit the enemy's cannon; hose shots hit the enemy's hose (at the hip). A hit weapon breaks into an ink leak (full or not).","その武器がもうない相手には、弾はお腹の<b>ベリータンク</b>に当たる。ベリータンクはただの弱点で、満タンなら、たいてい即はじける。":"If the target has lost that weapon, the shot hits her <b>Belly Tank</b>. The Belly Tank is just a weak point; if it's full, she usually bursts instantly.","背中側からは表に当たらない。真後ろの一直線からだけ、背中のホールタンクをねらえる。撃つと、相手の方を向くので、ほかの相手に背中を見せることになる。":"From behind you can't hit the front. Only from a straight line directly behind can you aim at the Back Tank. Firing turns you to face the target, which shows your back to the others.","戦闘員どうしの弾は8割当たる。それた弾は相手の向こうへ飛び、そこにいる子（味方でも）に当たることがある。":"Shots between minions hit 80% of the time. Stray shots fly past the target and may hit whoever is beyond (even a teammate).","紅白戦は、赤組の子を押して選び、青いマスで動く・赤い相手を押して撃つ。「この子はおわり」「残りはおまかせ」。":"In Red vs. White, tap a Red minion to select her, move on blue tiles, and tap a red target to shoot. \"Done with her\" / \"Auto for the rest\".","個人戦":"Free-for-All","<b>40人全員が敵どうしのバトルロイヤル</b>。最後まで残った1人が優勝。動く順は、ラウンドごとにくじ引きで、1人ずつ。自分は、頭の上に黄色い矢印の子。ルール（武器が弱点・背中・満タン・インク漏れ）は紅白戦と同じ。":"<b>A 40-minion battle royale where everyone is an enemy</b>. The last one standing wins. Turn order is drawn by lot each round, one at a time. You're the one with the yellow arrow over her head. Rules (weapons as weak points, back, full, ink leaks) are the same as Red vs. White.","カメラ":"Camera","ドラッグで盤を動かす。右ドラッグ（スマホは2本指）で角度。ホイール（スマホはピンチ）で寄る・引く。":"Drag to move the board. Right-drag (two fingers on phones) to change the angle. Wheel (pinch on phones) to zoom in and out.","閉じる":"Close","55撤退":"55!","テンポ（じっくり／テンポ重視）":"Tempo (Relaxed / Fast)","<b id=\"hTurn\">ターン 1</b><span id=\"hSide\"></span>":"<b id=\"hTurn\">Turn 1</b><span id=\"hSide\"></span>","<span>戦闘員</span><b id=\"hCount\">40</b><small id=\"hCount0\">/{0}</small>":"<span>Minions</span><b id=\"hCount\">40</b><small id=\"hCount0\">/{0}</small>","<span>ヒーローのよごれ <b id=\"hInk\">0</b><small id=\"hLv\">ふつう</small></span>":"<span>Hero's grime <b id=\"hInk\">0</b><small id=\"hLv\">Normal</small></span>","<span>{2}</span><small>テンポ</small>":"<span>{2}</span><small>Tempo</small>","<span>⏩</span><small>速さ</small>":"<span>⏩</span><small>Speed</small>","全体":"Overview","準備中…":"Loading…","3Dの準備に失敗しました：{0}":"Failed to set up 3D: {0}","使うモデル：戦闘員＝{0}／ヒーロー＝{1}":"Models in use: Minions = {0} / Hero = {1}","⚡ テンポ重視：連鎖を続けて速く。セリフは大事なところだけ":"⚡ Fast Tempo: chains keep going quickly. Lines only at key moments","💬 じっくり：一人ひとりが、セリフで反応":"💬 Relaxed: every minion reacts with a line","速さ：{0}":"Speed: {0}","メニュー":"Menu","タイトルへ戻る":"Back to Title","やり直す":"Retry","ステージ選びへ":"Stage Select","ヒーロー対決":"Hero Showdown","{0}・{1}マス{2}":"{0} · {1} tiles{2}","・強化ヒーロー":" · Powered-up Hero","上の ⏩（速さ）で速く、💬（テンポ）で連鎖のテンポを変えられます":"Use ⏩ (Speed) above to go faster, and 💬 (Tempo) to change the pace of chains","<b>{0}</b><span>全員はじけさせる（{1}ターンまで）</span>{2}<i>★の条件（押すと開く）</i>":"<b>{0}</b><span>Burst everyone (within {1} turn{1|s})</span>{2}<i>★ goals (tap to open)</i>","ターン {0}{1}":"Turn {0}{1}","⚠ よごれが 55 になると撤退（負け）、80 でたおれる。上のバーの目もりを見てね":"⚠ At 55 grime you retreat (lose); at 80 you go down. Watch the marks on the bar above","見せている間… 攻撃 あと<b>{0}</b>":"Showing… Attacks left <b>{0}</b>","レーザーブレイク":"Laser Break","ホーミング":"Homing","<small>あと{0}</small>":"<small>{0} left</small>","撤退中：攻撃してから「端へ下がる」。端に着いて2ターン待つと去る。":"Retreating: attack, then \"Fall back to edge\". Wait 2 turns at the edge to leave.","攻撃は移動の前と後。<b>先に動くと、後の1回だけ</b>。青で移動・赤で攻撃。":"Attacks come before and after moving. <b>If you move first, only the one after</b>. Blue to move, red to attack.","青いマスを押して移動。攻撃はあと{0}回（移動のあと）。":"Tap a blue tile to move. {0} attack(s) left (after moving).","移動した。攻撃はあと{0}回。終わったら「ターン終了」。":"Moved. {0} attack(s) left. When done, \"End Turn\".","攻撃は終わり。「ターン終了」で戦闘員の番。":"No attacks left. \"End Turn\" for the minions' turn.","ハレー彗星：オレンジの線のどこかを押して、向きを選ぶ。":"Halley's Comet: tap anywhere on the orange line to choose a direction.","{0} <span class=\"pst\">攻撃 あと<b>{1}</b>・移動 {2}</span>":"{0} <span class=\"pst\">Attacks left <b>{1}</b> · Move {2}</span>","ターン終了":"End Turn","済み":"Done","{0}マス":"{0} tiles","移動を戻す":"Undo Move","端へ下がる":"Fall back to edge","キャノンをねらう":"Aim at cannon","タンクをねらう":"Aim at tank","ホースをねらう":"Aim at hose","ホーミング：上から近い4人の、同じ部分に":"Homing: from above, at the same part of the 4 nearest","キャノンの高さ":"Cannon height","ベリータンクの高さ":"Belly Tank height","ホースの高さ":"Hose height","背中のホールタンク（真後ろ）":"Back Tank (directly behind)","真うしろのホールタンク：半分の確率ではじける":"Back Tank from directly behind: 50% chance to burst","インク漏れの子：当たればはじける":"Leaking minion: a hit bursts her","{0}はもうない：当たらずに通りすぎる":"{0} is gone: the shot passes through","その部分":"that part","{0}はもうない：かわりに{1}":"{0} is gone: hits {1} instead","満タンのタンクに当たる（たいていはじける）":"Hits a full tank (usually bursts)","タンクに当たる → インク漏れ":"Hits the tank → ink leak","ほかの部分に当たる":"Hits another part","満タンのタンク：たいてい（85%）はじける。こらえるとインク漏れ":"Full tank: usually (85%) bursts. If she holds, an ink leak","{0}をこわす → インク漏れ（2ターン後にはじける）{1}":"Breaks {0} → ink leak (bursts in 2 turns){1}","。キャノンで撃てなくなる":". Can't fire the cannon anymore","。ホースで撃てなくなる":". Can't fire the hose anymore","インク漏れ・ペタン座り：動けない。次の戦闘員の番の終わりに、はじける":"Leaking, sitting down: can't move. Bursts at the end of the next minion turn","インク漏れ：もう1回当てるとはじける。2ターンたつと、ひとりでにはじける":"Ink leak: one more hit bursts her. Bursts by herself after 2 turns","満タン：ベリータンクに当てると、たいていはじける":"Full: a hit on the Belly Tank usually bursts her","{0}{1}{2}{3}{4}{5}{6}{7}（{8}） 使える：{9} キャノン射程{10}・ホース射程{11}":"{0}{1}{2}{3}{4}{5}{6}{7} ({8}) Usable: {9} Cannon range {10} · Hose range {11}","【首領・覚醒：2ターンに1回インクの雨（柱のかげなら防げる）】":"[Boss · Awakened: ink rain every 2 turns (blocked behind pillars)]","【首領：部下が残っているあいだは攻撃が効かない】":"[Boss: attacks don't work while her minions remain]","【幹部】":"[Officer]","【すばやい：1つの番に2回動く】":"[Fast: moves twice per turn]","【はね返しの盾：正面からのレーザー・ブレードは効かない。鏡で横やうしろから、タンクの爆発・連鎖でも】":"[Reflect Shield: lasers and blades from the front don't work. Use mirrors for the side or back, or tank blasts and chains]","【救護係：となりのインク漏れの仲間を治す】":"[Medic: heals leaking friends next to her]","【治しの号令：まわり{0}マスのインク漏れの仲間を、毎ターン治す】":"[Healing Call: heals leaking friends within {0} tiles every turn]","【体力 {0}/{1}・あと{2}回当てるとはじける】":"[HP {0}/{1} · bursts after {2} more hit(s)]","インクだまり：ヒーローが通ると、1マスごとによごれ+1。上にいる戦闘員は、毎ターン満タン":"Ink pool: the Hero gets +1 grime per tile walking through. Minions on it become full every turn","ベルトコンベア（{0}へ）：ターンの終わりに、上にいる子・ヒーロー・タンクを1マス運ぶ":"Conveyor belt (toward {0}): at the end of the turn, carries minions, Hero and tanks on it 1 tile","奥":"back","右":"right","手前":"front","ワープ床：上で止まると、もう一方（{0}）へ飛ぶ。レーザーは、もう一方から同じ向きに出る":"Warp pad: stop on it to fly to the other one ({0}). Lasers come out of the other one in the same direction","🔫 ワープへレーザー：{0}":"🔫 Laser into warp: {0}","もう一方から出て、戦闘員{0}人の上を通る":"Comes out the other side and crosses {0} minion(s)","🌀 ワープ床へ動いて、飛ぶ":"🌀 Move onto the warp pad and fly","出口がふさがっているので、飛ばない":"The exit is blocked, so no warp","鉄柱：いま {0}人。12人ではじけ、同じ列（たて・よこ）で6人以上の柱も連鎖する。となりの戦闘員を選ぶと、全員まとめてここへ投げられる（4マス以内）":"Steel pole: {0} on it now. Bursts at 12, and poles in the same row or column with 6+ chain too. Pick an adjacent minion and they all get thrown here (within 4 tiles)","鏡（{0}）：レーザーを当てると、直角に曲がる。通れない。戦闘員の弾・流星・爆風は止まる":"Mirror ({0}): a laser turns at a right angle here. Can't pass. Stops minion shots, comets and blasts","{0}（一直線に見えている鏡だけ、ねらえる）":"{0} (only mirrors in a straight line can be aimed at)","🔫 鏡へレーザー：{0}":"🔫 Laser at mirror: {0}","曲がった先で、戦闘員{0}人の上を通る":"After turning, it crosses {0} minion(s)","柱：通れない。レーザー・弾・流星は柱で止まり、タンクの爆風も柱のかげにはとどかない":"Pillar: can't pass. Lasers, shots and comets stop at pillars, and tank blasts don't reach behind them","⚠ ヒーローもよごれ{0}":"⚠ The Hero gets {0} grime too","インクタンク（撃つと大爆発。まわり2マスの{0}人を巻きこむ。1マスの子は即はじける）":"Ink tank (explodes when shot, catching {0} minion(s) within 2 tiles; those 1 tile away burst instantly)","⚔ ブレードで斬る":"⚔ Slash with Blade","すぐ横で爆発！{0}":"Blast right next to you!{0}","🔫 レーザーで撃つ":"🔫 Fire Laser","一直線：手前の子にも当たる":"Straight line: also hits the ones in front","タンクだけをねらう":"Aim only at the tank","⚔ ブレードは使えない（変身解除中：インク漏れの子だけ斬れる）":"⚔ Can't use the Blade (Transformation Undone: can only slash leaking minions)","よごれが70をこえると、変身がとけて力が弱まる":"Over 70 grime, the transformation breaks and you get weaker","🪝 となりの{0}人を、鉄柱（{1},{2}）へ":"🪝 Throw {0} adjacent minion(s) onto the steel pole ({1},{2})","いま{0}人 → {1}人{2}":"Now {0} → {1}{2}","💥 12人をこえて、はじける！（同じ列で6人以上の柱も連鎖）":"💥 Over 12, it bursts! (poles in the same row with 6+ chain too)","⚔ ブレード":"⚔ Blade","背中から一刀":"One slash from behind","両断＋その先に衝撃波":"Cut through + shockwave beyond","{0}｜一直線：この高さで当たるのは{1}人{2}":"{0} | Straight line: {1} minion(s) hit at this height{2}","・タンク{0}つも爆発":" · {0} tank(s) explode too","{0}｜この子だけ":"{0} | Only this one","🔫 レーザー：{0}":"🔫 Laser: {0}","<b id=\"hTurn\">ラウンド 1</b><span id=\"hSide\"></span>":"<b id=\"hTurn\">Round 1</b><span id=\"hSide\"></span>","<span>残り</span><b id=\"hLeft\">40</b><small>人</small>":"<span>Left</span><b id=\"hLeft\">40</b><small></small>","<span>自分</span><b id=\"hMine\">-</b>":"<span>You</span><b id=\"hMine\">-</b>","<span class=\"tr\">赤組</span><b id=\"hRed\">20</b><span class=\"tw\">白組</span><b id=\"hWhite\">20</b>":"<span class=\"tr\">Red</span><b id=\"hRed\">20</b><span class=\"tw\">White</span><b id=\"hWhite\">20</b>","使うモデル：戦闘員＝{0}":"Models in use: Minions = {0}","40人のバトルロイヤル・{0}マス":"40-minion battle royale · {0} tiles","赤組20人 対 白組20人・{0}・{1}マス":"20 Red vs. 20 White · {0} · {1} tiles","{0}の番":"{0}'s turn","はじけた{0}":"Burst: {0}","（{0}位）":"({0} place)","爆発寸前（座りこみ）":"About to burst (sitting down)","元気":"Healthy","{0}・{1}（{2}） 武器：{3} キャノン射程{4}・ホース射程{5}":"{0} · {1} ({2}) Weapons: {3} Cannon range {4} · Hose range {5}","ライバル":"Rival","赤組の番：<b>動かす子</b>を選ぶ（黄色く光る子）。":"Red Team's turn: choose a <b>minion to move</b> (the ones glowing yellow).","<b>自分の番</b>（{0}）：{1}まわりは全員ライバル。赤い相手を押して撃つ。撃つと、その相手の方を向く（背中に気をつけて）。":"<b>Your turn</b> ({0}): {1}Everyone around is a rival. Tap a red target to shoot. Shooting turns you to face her (mind your back).","青いマスで動く（1回）。":"Move on the blue tiles (once).","<b>{0}</b>：{1}赤い相手を押して撃つ。撃つと、その相手の方を向く（背中に気をつけて）。":"<b>{0}</b>: {1}Tap a red target to shoot. Shooting turns you to face her (mind your back).","向きを変える":"Turn around","この子はおわり":"Done with her","ほかの子にする":"Pick another","残りはおまかせ":"Auto for the rest","動いたあとは、ほかの子にできない":"After moving, you can't switch to another","⬆ 奥へ":"⬆ Back","➡ 右へ":"➡ Right","⬇ 手前へ":"⬇ Front","⬅ 左へ":"⬅ Left","向き（背中を見せる方向に気をつけて）":"Facing (mind which way your back is showing)","💥 キャノン":"💥 Cannon","💥 キャノン2発：{0}にも":"💥 Double cannon: {0} too","左右で2人まで":"Up to 2, left and right","💧 ホース":"💧 Hose","🚀 ジャンプ噴射（{0}）":"🚀 Jump Jet ({0})","前と左右の3マス：相手{0}人が即はじける":"3 tiles front, left and right: {0} enemy(ies) burst instantly","（ここからは当たらない）":"(can't hit from here)","赤組の勝ち！":"Red Team wins!","白組を全員はじけさせた":"Burst every White minion","白組の勝ち！":"White Team wins!","赤組を全員はじけさせた":"Burst every Red minion","引き分け":"Draw","最後は、両方の組がいっしょにはじけた":"In the end, both teams burst together","ラウンド":"Round","残った赤組":"Red left","{4}人":"{4}","残った白組":"White left","{5}人":"{5}","もう一度":"Play Again","自分（{0}）":"You ({0})","{1}・はじけさせた {2}人":"{1} · Burst {2}","はじけた":"Burst","最後まで残った":"Last one standing","優勝！":"Winner!","{0}の優勝":"{0} wins","最後の2人が、いっしょにはじけた":"The last two burst together","40人のバトルロイヤルを、最後まで残った":"Survived to the end of the 40-minion battle royale","{1}位・はじけさせた {2}人":"Place {1} · Burst {2}","{0}位":"#{0}","{1}{2}・{3}人":"{1}{2} · {3}","（自分）":" (you)","★ 全員はじけさせる（{3}ターンまで）":"★ Burst everyone (within {3} turn{3|s})","いちばんよかった記録：{0}ターン・よごれ {1}":"Best record: {0} turn{0|s} · grime {1}","← タイトル":"← Title","ヒーローが1人で、インク団のアジトを奥へ進む。よごれは面ごとに0から。負けても、その面からやり直せる。":"The Hero alone pushes deeper into the Ink Corps hideout. Grime starts at 0 each stage. If you lose, you can retry from that stage.","📖 おはなし<small>見た場面は、ここからもう一度見られる</small>":"📖 Story<small>Watch scenes you've seen again from here</small>","🔒 ？？？":"🔒 ???","？？？":"???","出撃！":"Sortie!","インク団":"Ink Corps","💡 ヒント":"💡 Hint","はじめる":"Start","いっせい噴射ー！":"All together, fire!","とばす":"Skip","よごれが55をこえて、撤退した":"Grime went over 55, and the Hero retreated","ヒーローはスライムになって、インク団の仲間入り…":"The Hero became a slime and joined the Ink Corps…","{0}ターンのうちに、全員をはじけさせられなかった":"Couldn't burst everyone within {0} turn{0|s}","{6} 全員はじけさせる（{7}ターンまで）":"{6} Burst everyone (within {7} turn{7|s})","ターン":"Turns","はじけた戦闘員":"Minions burst","{10}人":"{10}","1回の攻撃でいちばん多く":"Most in one attack","{11}人":"{11}","ステージ選び":"Stage Select","ステージクリア！":"Stage Clear!","しっぱい…":"Failed…","記録更新！（前は{0}）":"New record! (was {0})","🏆 <b>アジト完全制圧！</b> 首領ノワールをたおして、インク団のアジトを最後まで進みきった！ おつかれさまでした。<br>★を集めなおすのも、ボーナス・特別ステージで遊ぶのも自由です。":"🏆 <b>Hideout fully conquered!</b> You defeated Boss Noir and made it all the way through the Ink Corps hideout! Great work.<br>Feel free to go back for more stars, or play the bonus and special stages.","🎉 {0}、クリア！ {1}":"🎉 {0} cleared! {1}","この先の層は、これから作ります。":"The levels beyond are still being made.","🎬 エンディングへ":"🎬 To the Ending","次の面へ":"Next Stage","ヒーローの勝ち！":"The Hero wins!","戦闘員を全員はじけさせた":"Burst every minion","インク団の勝ち！":"The Ink Corps wins!","ヒーローを撤退させた":"Made the Hero retreat","インク団の大勝利！":"A big Ink Corps victory!","ヒーローはスライムになって、インク団の仲間入り！":"The Hero became a slime and joined the Ink Corps!","時間切れ":"Time's up","決着がつかなかった":"No winner","残った戦闘員":"Minions left","確認用：おはなし「{0}」":"Test: Story \"{0}\"","▶ 見る":"▶ Watch","確認用：{0}":"Test: {0}","{1}<br>確認用なので、クリアしても★は記録しません。":"{1}<br>This is for testing, so clearing it won't record stars.","▶ はじめる":"▶ Start","コンピューターがヒーローを動かします（見るだけ）。":"The computer controls the Hero (watch only).","この面から、ヒーローを動かして遊べます。":"From this stage, you can control the Hero and play.","インク戦闘員":"INK MINION","ウォーズ":"WARS","🗺️ ステージ":"🗺️ Stages","インク団のアジトを、奥へ進む":"Push deeper into the Ink Corps hideout","⚔️ フリー対戦":"⚔️ Free Battle","ヒーロー対決・紅白戦・個人戦":"Hero Showdown · Red vs. White · Free-for-All","使うモデル":"Models in use","（モデルの部屋で変える）：戦闘員＝{0} ／ ヒーロー＝{1}":"(change in the Model Room): Minions = {0} / Hero = {1}","ヒーロー1人":"1 Hero","と、インク団の":"vs. the Ink Corps'","スライム戦闘員40人":"40 Slime Minions","の対決です。戦闘員の正体は、女の子の姿に変身したスライム。":". The minions are really slimes who've transformed into girls. They shoot","スライムインク":"slime ink","を撃って、ヒーローも自分たちと同じスライムにしようとしています。ヒーローは、戦闘員のインクタンクをはじけさせて、もとの小さなスライムに戻します。":"to turn the Hero into a slime just like them. The Hero bursts the minions' ink tanks to turn them back into little slimes.","（肩）：射程は満タンのとき3、ふだん2。相手のキャノンをつぶすと1ずつ伸びる（最大4）。左右で2人まで撃てる。":"(shoulders): Range 3 when full, normally 2. +1 for each enemy cannon destroyed (max 4). Can shoot up to 2 targets, left and right.","（右手）：射程3。1ターンたつと4、撃つたびに1ずつ伸びる（最大5）。":"(right hand): Range 3. Becomes 4 after 1 turn, then +1 each time it fires (max 5).","ジャンプ噴射":"Jump Jet","（背中のホールタンク）：タンクの下の穴（ホール）からインクを噴いて跳び、自分のまわりの凸の形（前と左右）を一気にインクまみれにする。ヒーローに当たればインク5回分。":"(Back Tank): Sprays ink from the hole under the tank to jump, drenching the T-shape around her (front, left, right) in one go. Hitting the Hero counts as 5 hits of ink.","ジャンプ中は、どこから撃たれても即はじける":"While jumping, a hit from any direction bursts her instantly","。はじけた相手の飛沫は、宙に浮いて離れているので、届くかは運次第（半々）。届けば自分もはじける。":". The spray from a minion she bursts is up in the air and away, so whether it reaches her is luck (50/50). If it does, she bursts too.","（お腹）：はじめは":"(belly): Starts","満タン":"full","（満タンは、このタンクのこと）。満タンのベリータンクに当たると、たいてい即はじけて、隣の満タンの子まで":"(\"full\" always means this tank). A hit on a full Belly Tank usually bursts her instantly, setting off a","連鎖":"chain","する。撃つと満タンは解ける。2巡撃たないと、また満タンになる。キャノンやホースに当たったときは、満タンでも、こわれてインク漏れになるだけ。":"to full minions next to her. Firing empties it; it fills up again after 2 rounds without firing. A hit on the cannon or hose, even when full, just breaks it into an ink leak.","背中側からは、表のキャノン・タンク・ホースには当たらない。":"From behind, you can't hit the cannon, tank or hose on her front. Only from","真後ろの一直線":"a straight line directly behind","からだけ、背中のホールタンクをねらえる（半分の確率で、即はじける）。":"can you aim at the Back Tank (50% chance of an instant burst).","移動5マス。攻撃は":"Moves 5 tiles. Attacks","移動の前と後に1回ずつ":"once before and once after moving","（先に動くと、後の1回だけ）。":"(if you move first, only the one after).","ブレード":"Blade","：隣の1人。背中からなら一刀。表からなら両断して、その先の1人にも衝撃波。":": One adjacent minion. From behind, one clean slash. From the front, it cuts through and sends a shockwave to the one beyond.","レーザー":"Laser","：10マス。縦か横の一直線なら":": 10 tiles. In a straight vertical or horizontal line it","貫通":"pierces","（狙った高さの部分がある子すべてに当たる）。":"(hits every minion with a part at the height you aimed).","わざ":"Specials","：薙ぎ払い（隣8マス）・ハレー彗星（一直線10マス）。強化ヒーローは、レーザーブレイク（5マス以内の全員）とホーミングも使える。使うと3ターン休み。":": Sweep (8 surrounding tiles) and Halley's Comet (10 tiles in a line). The Powered-up Hero can also use Laser Break (everyone within 5 tiles) and Homing. Each needs 3 turns to recharge.","スーツの":"The suit's","よごれ":"grime","（浴びたスライムインク）：50をこえると肌がだんだん青くなる。55で不調（撤退を始める。端に着いて2ターンで去る）・60でスーツ機能停止・70で変身解除・80でたおれて、":"(slime ink taken): over 50, the skin slowly turns blue. 55: Struggling (starts retreating; leaves 2 turns after reaching the edge), 60: Suit Shutdown, 70: Transformation Undone, 80: Down —","スライムになってインク団の仲間入り":"she becomes a slime and joins the Ink Corps","。":".","タイトルの「🗺️ ステージ」。ヒーローが1人で、インク団のアジトを奥へ進む。面ごとに、決まった並びの戦闘員を":"\"🗺️ Stages\" on the title screen. The Hero alone pushes deeper into the Ink Corps hideout. Each stage has a set lineup of minions;","決まったターンのうちに全員はじけさせれば":"burst them all within the turn limit","クリア（★1）。面ごとの目標2つを満たすと★がふえる（最大★3）。よごれは面ごとに0から。負けたら、その面をやり直す。クリアすると次の面が開く。クリアした面は、何度でも遊べる。":"to clear it (★1). Meet the stage's 2 goals for more stars (up to ★3). Grime starts at 0 each stage. If you lose, retry that stage. Clearing opens the next one. Cleared stages can be played again anytime.","アジト第2層：インクのタンク置き場":"Hideout Level 2: Ink Tank Storage","盤の上の":"The","インクタンク":"ink tanks","は、撃つ・斬る・飛沫がかかると大爆発する。まわり1マスの戦闘員は即はじけ、2マスの戦闘員には飛沫がかかる。2マス以内のほかのタンクも誘爆する。ヒーローも、1マスならよごれ6、2マスならよごれ3。後半の戦闘員は、ヒーローのそばのタンクを撃ってくる。第2層の班長は、何回か当てないとはじけない（タンクの爆発や飛沫でも1回）。":"on the board explode when shot, slashed or splashed. Minions within 1 tile burst instantly; minions 2 tiles away get splashed. Other tanks within 2 tiles go off too. The Hero takes 6 grime at 1 tile, 3 grime at 2 tiles. Later minions shoot at tanks near the Hero. The Level 2 Squad Leader takes several hits to burst (a tank blast or splash counts as 1).","アジト第9層：首領の間":"Hideout Level 9: The Boss's Hall","これまでのしかけが全部そろう最後の層。いちばん奥には":"The final level, with every gimmick so far. Deepest inside is","首領ノワール":"Boss Noir","（頭に金の王冠のチビ）。":"(the little one with a gold crown).","部下が1人でも残っているあいだは、首領に攻撃は効かない":"While even one of her minions remains, attacks don't work on the Boss","。部下をみんなはじけさせると、首領が":". Burst all her minions and the Boss","覚醒":"awakens","して大きくなり、体力が増え、2ターンに1回":", growing big with more HP, and every 2 turns brings","インクの雨":"ink rain","を降らせる（よごれ+3。":"(+3 grime; safe","柱や壁のかげ":"behind pillars or walls","にいれば当たらない）。覚醒した首領は、こちらに近づかずに逃げ回る。":"). The awakened Boss keeps her distance and runs around.","特別ステージ：首領の間への通路":"Special Stage: Passage to the Boss's Hall","この面だけ、ヒーローは":"On this stage only, the Hero","となりの戦闘員をつかんで、鉄柱へ放り投げる":"grabs adjacent minions and hurls them onto a steel pole","（4マス以内のいちばん近い鉄柱。攻撃1回ぶん。この面は攻撃が1つの番に3回）。鉄柱につながった子は、もう動けない。全員を、はじけさせるか鉄柱につなげばクリア。":"(the nearest pole within 4 tiles; counts as 1 attack; on this stage you get 3 attacks per turn). Minions stuck on a pole can't move anymore. Clear it by bursting every minion or sticking them on poles.","アジト第8層：ワープの実験室":"Hideout Level 8: Warp Lab","同じ色に光る輪は":"Rings glowing the same color are","ワープ床":"warp pads","（2つでひと組）。上で止まると、":"(a pair). Stop on one and you","もう一方へ飛ぶ":"fly to the other","（ヒーローも戦闘員も。出口にだれかいれば飛ばない）。ワープ床にレーザーを撃つと、":"(Hero and minions alike; not if someone is on the exit). Fire a laser into a warp pad and it comes out","もう一方から同じ向きに":"of the other one in the same direction","出ていく（鏡と組み合わせることも）。第8層の幹部は":"(combine with mirrors too). The Level 8 Officer is","すばやい":"fast","（1つの番に2回動く）。":"(moves twice per turn).","アジト第7層：鏡の回廊":"Hideout Level 7: Mirror Corridor","ななめの板は":"The diagonal panels are","鏡":"mirrors","。一直線に見えている鏡にレーザーを当てると、":". Hit a mirror in a straight line with the laser and it","直角に曲がって":"turns at a right angle","つらぬく（鏡から鏡へ、全部で10マスまで）。当たり方は、曲がってきた向きで決まるので、正面を向いた子の横や、うしろ向きの子の正面からも当てられる。鏡は通れず、戦闘員の弾・流星・爆風は止まる。第7層の幹部は":"and pierces on (mirror to mirror, up to 10 tiles in all). Where it hits depends on the direction it comes from, so you can hit the side of a front-facing minion, or the front of one facing away. Mirrors block movement and stop minion shots, comets and blasts. The Level 7 Officer has a","はね返しの盾":"Reflect Shield","（正面からのレーザー・ブレードをはね返す）。":"(bounces lasers and blades from the front).","アジト第6層：救護係の医務室":"Hideout Level 6: Medic Room","頭の上に白い十字の子は":"Minions with a white cross over their heads are","救護係":"medics","。となりのインク漏れの仲間を":". They","治して":"heal","しまう（こわれた武器やタンクも元どおり）。先に救護係をねらおう。第6層の最後は":"leaking friends next to them (broken weapons and tanks too). Go for the medics first. The end of Level 6 has an","幹部":"Officer","。幹部は班長より大きく、ピンクの印。":". Officers are bigger than Squad Leaders, with a pink mark.","アジト第5層：地下水路のインクだまり":"Hideout Level 5: Underground Ink Pools","床の紫の水たまりは":"The purple puddles on the floor are","インクだまり":"ink pools","。ヒーローが通ると":". The Hero gets","1マスごとによごれ+1":"+1 grime per tile","（紫に光る行き先は、だまりを通る）。戦闘員がはじけた所・タンクの爆発のまわりに、新しいだまりができる。だまりの上の戦闘員は、毎ターン":"walking through them (destinations glowing purple pass through a pool). New pools form where minions burst and around tank blasts. Minions standing in a pool become","になる（連鎖のチャンスにも）。":"every turn (a chance for chains, too).","アジト第4層：インク工場のコンベア":"Hideout Level 4: Ink Factory Conveyors","光る矢印の床は":"Floors with glowing arrows are","ベルトコンベア":"conveyor belts","。戦闘員の番が終わるたびに、上にいる戦闘員・ヒーロー・タンクを1マス運ぶ。作業員は持ち場から歩かないが、コンベアには運ばれる。運ばれて一列にそろう・タンクのそばに集まるのを":". After each minion turn, they carry the minions, Hero and tanks on them 1 tile. Workers never leave their posts, but the belts still carry them.","待つのも作戦":"Waiting is a strategy too","。ヒーローも運ばれるので注意。":", for them to line up or gather near a tank. Careful: the Hero gets carried too.","ボーナス：固定砲台部隊":"Bonus: Fixed Cannon Squad","壁にはりついた25人。だれでもいいので一撃を……。":"25 minions stuck to the wall. Just one hit on anyone...","アジト第3層：柱の倉庫":"Hideout Level 3: Pillar Warehouse","柱":"pillars","は通れない。レーザー・戦闘員の弾・ハレー彗星は柱で止まり、タンクの爆風も柱のかげにはとどかない。柱のかげで番を終えると撃たれにくい。回りこんで、ねらいの通る場所をさがそう。":"on the board. Lasers, minion shots and Halley's Comet stop at pillars, and tank blasts don't reach behind them. Ending your turn behind a pillar makes you harder to hit. Go around and find a spot with a clear line.","ヒーローをたおすために、仲間どうしで鍛え合う。":"The minions train against each other to beat the Hero.","赤組20人 対 白組20人":"20 Red vs. 20 White","。赤と白が":". Red and White move","1人ずつ交互に":"one at a time, taking turns","動く（先に動く組は、ラウンドごとに入れかわる）。相手を全員はじけさせた組の勝ち。":"(the team that goes first switches every round). The team that bursts all opponents wins.","武器で戦うが、":"They fight with weapons, but","その武器が弱点":"those weapons are weak points","。キャノンの弾は相手のキャノンに、ホースの弾は相手のホース（腰）に当たる。当たった武器はこわれて、インク漏れ（満タンかどうかは関係ない）。":". Cannon shots hit the enemy's cannon; hose shots hit the enemy's hose (at the hip). A hit weapon breaks into an ink leak (full or not).","その武器がもうない相手には、弾はお腹の":"If the target has lost that weapon, the shot hits her","に当たる。ベリータンクはただの弱点で、満タンなら、たいてい即はじける。":". The Belly Tank is just a weak point; if it's full, she usually bursts instantly.","40人全員が敵どうしのバトルロイヤル":"A 40-minion battle royale where everyone is an enemy","。最後まで残った1人が優勝。動く順は、ラウンドごとにくじ引きで、1人ずつ。自分は、頭の上に黄色い矢印の子。ルール（武器が弱点・背中・満タン・インク漏れ）は紅白戦と同じ。":". The last one standing wins. Turn order is drawn by lot each round, one at a time. You're the one with the yellow arrow over her head. Rules (weapons as weak points, back, full, ink leaks) are the same as Red vs. White.","ターン 1":"Turn 1","戦闘員":"Minions","ヒーローのよごれ":"Hero's grime","テンポ":"Tempo","速さ":"Speed","全員はじけさせる（{1}ターンまで）":"Burst everyone (within {1} turn{1|s})","★の条件（押すと開く）":"★ goals (tap to open)","見せている間… 攻撃 あと":"Showing… Attacks left","あと{0}":"{0} left","攻撃は移動の前と後。":"Attacks come before and after moving.","先に動くと、後の1回だけ":"If you move first, only the one after","。青で移動・赤で攻撃。":". Blue to move, red to attack.","攻撃 あと":"Attacks left","・移動 {2}":"· Move {2}","ラウンド 1":"Round 1","残り":"Left","人":"","自分":"You","赤組の番：":"Red Team's turn: choose a","動かす子":"minion to move","を選ぶ（黄色く光る子）。":"(the ones glowing yellow).","自分の番":"Your turn","（{0}）：{1}まわりは全員ライバル。赤い相手を押して撃つ。撃つと、その相手の方を向く（背中に気をつけて）。":"({0}): {1}Everyone around is a rival. Tap a red target to shoot. Shooting turns you to face her (mind your back).","：{1}赤い相手を押して撃つ。撃つと、その相手の方を向く（背中に気をつけて）。":": {1}Tap a red target to shoot. Shooting turns you to face her (mind your back).","📖 おはなし":"📖 Story","見た場面は、ここからもう一度見られる":"Watch scenes you've seen again from here","アジト完全制圧！":"Hideout fully conquered!","首領ノワールをたおして、インク団のアジトを最後まで進みきった！ おつかれさまでした。":"You defeated Boss Noir and made it all the way through the Ink Corps hideout! Great work.","★を集めなおすのも、ボーナス・特別ステージで遊ぶのも自由です。":"Feel free to go back for more stars, or play the bonus and special stages.","確認用なので、クリアしても★は記録しません。":"This is for testing, so clearing it won't record stars.","アジト第1層":"Hideout Level 1","入口と見張りの通路":"Entrance & Lookout Passage","アジト第2層":"Hideout Level 2","インクのタンク置き場":"Ink Tank Storage","アジト第3層":"Hideout Level 3","柱の倉庫":"Pillar Warehouse","ボーナス":"Bonus","固定砲台部隊の部屋":"Fixed Cannon Squad's Room","アジト第4層":"Hideout Level 4","インク工場のコンベア":"Ink Factory Conveyors","アジト第5層":"Hideout Level 5","地下水路のインクだまり":"Underground Ink Pools","アジト第6層":"Hideout Level 6","救護係の医務室":"Medic Room","アジト第7層":"Hideout Level 7","鏡の回廊":"Mirror Corridor","アジト第8層":"Hideout Level 8","ワープの実験室":"Warp Lab","特別ステージ":"Special Stage","首領の間への通路":"Passage to the Boss's Hall","アジト第9層":"Hideout Level 9","首領の間":"The Boss's Hall","入口の見張り":"Entrance Lookouts","縦に並んだ3人。一直線のレーザーは<b>貫通</b>する。ベリータンクの高さをねらおう。":"Three in a vertical line. A straight laser <b>pierces</b> through. Aim at Belly Tank height.","ん？ だれか来た！ 見張り、集合〜！":"Hm? Someone's here! Lookouts, gather up~!","ここがインク団のアジトか。まずは入口からだ":"So this is the Ink Corps hideout. Starting with the entrance","ヒーローだ！ みんなでスライムにしちゃおう！":"It's the Hero! Let's all turn her into a slime!","入口、突破！ 奥へ進むぞ":"Entrance cleared! On to the depths","満タンの連鎖":"Full-Tank Chain","満タンの子がはじけると、隣の満タンの子も<b>連鎖</b>してはじける。くっついた塊をねらおう。":"When a full minion bursts, full minions next to her <b>chain</b> and burst too. Aim for the clumps.","インク、たぷたぷに満タンにしたよ！":"I filled my ink all the way up, sloshy full!","くっついてれば、こわくないもんね！":"If we stick together, we've got nothing to fear!","……くっついてるなら、まとめていける":"……If they're stuck together, I can take them all at once","くっついてると、連鎖しやすいんだな":"Sticking together makes chains easy, huh","背中を見せる子":"Showing Their Backs","背中側からは、レーザーが表のタンクに当たらない。でも<b>背中からのブレード</b>は一刀ではじける。":"From behind, the laser can't hit the tanks on their front. But <b>a blade from behind</b> bursts them in one slash.","ねえ、ヒーロー来ないね〜":"Hey, the Hero's not coming, is she~","奥のほうを見張ってれば大丈夫だよ〜":"We'll be fine if we keep watch on the far side~","（後ろががら空きだ……そっと近づこう）":"(Her back is wide open…… I'll sneak up)","背中から、そっと一刀":"One quiet slash from behind","満タンじゃない子":"Not Full","満タンでない子は、すぐにははじけず「インク漏れ」になる。インク漏れの子は、もう1発か、隣の飛沫ではじける。":"Minions who aren't full don't burst right away; they start an \"ink leak.\" A leaking minion bursts with one more shot, or from a neighbor's splash.","さっき撃ったから、インク少なめ〜":"I just fired, so my ink's a little low~","でも少なめなら、連鎖しないもん！":"But if it's low, I won't chain!","まぜて並んでいるな。順番を考えよう":"They're mixed in a line. Let's think about the order","満タンの子を先にねらうのがコツか":"So the trick is to hit the full ones first","横向きの列":"Sideways Rows","横を向いた列は、<b>同じ列の正面</b>に回りこむと、一直線で貫通できる。":"For a row facing sideways, get around to <b>the front of that row</b> and one straight shot pierces them all.","左右の通路は、わたしたちが守るよ！":"We'll guard the left and right passages!","右よーし！ 左よーし！":"Right, clear! Left, clear!","列の正面に回りこめば、まとめてねらえる":"If I get around to the front of the row, I can hit them all","回りこむのも、立派な作戦だ":"Going around is a fine strategy too","爆発寸前":"About to Burst","インク漏れ（爆発寸前）の子は、2ターンでひとりでにはじける。隣にいると、インクを浴びるので注意。":"A leaking (about-to-burst) minion bursts by herself in 2 turns. Stand next to her and you'll get splashed, so be careful.","うう、タンクからインクがもれてる〜":"Ugh, ink is leaking from my tank~","ヒーローのそばで、ぱーんってしちゃおうかな！":"Maybe I'll go pop right next to the Hero!","うかつに近づくと、インクまみれだな":"Get too close carelessly and I'll be covered in ink","ふう、浴びずにすんだ":"Phew, didn't get splashed","まっすぐな通路":"Straight Passage","わざの<b>ハレー彗星</b>は、一直線10マスの子を、満タンでなくてもまとめてはじけさせる。使うと3ターン休み。":"The special <b>Halley's Comet</b> bursts every minion in a straight line of 10 tiles, full or not. It needs 3 turns to recharge.","細い通路は、一列に並んで通るんだよ〜":"In narrow passages, we walk in single file~","前の子に、ぴったりついていこうね！":"Stay right behind the girl in front!","一列なら、あのわざの出番だ":"Single file? Time for that special","ハレー彗星、決まった！":"Halley's Comet, right on target!","かこまれた！":"Surrounded!","まわりをかこまれたら、わざの<b>薙ぎ払い</b>。隣の8マスの子を、まとめてはじけさせる（はじけた飛沫を少し浴びる）。":"When you're surrounded, use the special <b>Sweep</b>. It bursts every minion on the 8 tiles around you (you'll catch a little splash).","つーかまえた！":"Gotcha!","もう逃げられないよ、ヒーロー！":"You can't run anymore, Hero!","近くに集まってくれたのは、むしろ好都合だ":"Gathering close is actually convenient for me","薙ぎ払いで、ひと息に！":"One Sweep and done!","増援の通路":"Reinforcement Passage","この面は、はじめの2ターン、戦闘員の番の終わりに<b>四隅から増援</b>が来る。来た子も全員はじけさせればクリア。":"On this stage, for the first 2 turns, <b>reinforcements arrive from the four corners</b> at the end of the minions' turn. Burst every one of them too to clear.","本部〜！ 入口にヒーローが来てまーす！":"HQ~! The Hero's at the entrance~!","増援、すぐ行くって！":"They say reinforcements are on the way!","集まってくる前に、数を減らさないと":"I need to thin them out before they gather","増援も、まとめてお帰りいただいた":"The reinforcements have all been sent home too","第1層の班長":"Level 1 Squad Leader","アオイ班長":"Leader Aoi","第1層のしめくくり。班長のまわりは満タンの子が守っている。いままでのコツを全部使おう。":"The finale of Level 1. Full minions guard the Squad Leader. Use every trick you've learned.","ここまで来るなんて、やるじゃない、ヒーロー":"Making it this far? Not bad, Hero","わたしは第1層の班長、アオイ。この先へは通さないよ！":"I'm Aoi, Level 1 Squad Leader. You're not getting past me!","班長か。第1層は、ここで終わりにしよう":"A Squad Leader. Let's end Level 1 here","班長〜、がんばって〜！":"Leader~, do your best~!","第1層、制圧！ この下に、まだ続いている……":"Level 1 secured! It keeps going down below……","タンク置き場":"Tank Storage","まん中の<b>インクタンク</b>を撃つと大爆発！ まわり1マスの子は、満タンでなくても<b>即はじける</b>。":"Shoot the <b>ink tank</b> in the middle for a huge explosion! Minions within 1 tile <b>burst instantly</b>, even if they're not full.","ここは、スライムインクのタンク置き場だよ〜":"This is where we keep the slime ink tanks~","みんなでタンクを守るんだ！ ぴったりくっついて！":"Let's all guard the tank! Stick close together!","……そのタンク、撃ったらどうなるんだろう":"……I wonder what happens if I shoot that tank","タンク、すごい爆発だ……！":"What an explosion that tank made……!","近づきすぎ注意":"Don't Get Too Close","タンクの爆発は、ヒーローにもかかる（1マスで<b>よごれ6</b>、2マスで<b>よごれ3</b>）。先に<b>3マス以上はなれて</b>から撃とう。":"Tank explosions hit the Hero too (<b>6 grime</b> at 1 tile, <b>3 grime</b> at 2 tiles). Get <b>3 or more tiles away</b> before you shoot.","わっ、目の前にタンクが……":"Whoa, there's a tank right in front of me……","ヒーロー、そこで撃ったら、自分もインクまみれだよ〜":"Hero, if you shoot there, you'll be covered in ink too~","ふふん、撃てないでしょ！":"Hmph, you can't shoot, can you!","はなれて撃てば、こわくない":"Shoot from a distance and there's nothing to fear","誘爆の列":"Chain of Tanks","タンクの爆発は、<b>2マス以内のほかのタンク</b>にも燃えうつる（誘爆）。ならんだタンクは、1つ撃てば全部いける。":"A tank explosion spreads to <b>other tanks within 2 tiles</b> (chain explosion). Shoot one tank in a row and they all go.","タンク、ずらーっと並べたよ！":"We lined up tanks, all in a row!","こんなにあれば、インクたっぷり！":"With this many, we've got tons of ink!","……1つでも爆発したら、となりも危ないんじゃないか？":"……If even one explodes, isn't the next one in danger?","誘爆で、まとめて吹きとんだ":"The chain explosion blew them all away","2マス先の子":"The Ones 2 Tiles Away","2マス先の子には、飛沫がかかるだけ。<b>満タンでない子はインク漏れ</b>で止まる。止まった子は、もう1発ではじける。":"Minions 2 tiles away only get splashed. <b>Minions who aren't full stop at an ink leak</b>. Once stopped, one more shot bursts them.","タンクのそばは、ちょっとはなれて立つんだよ〜":"Near the tank, stand a little bit away~","2マスはなれてれば、大丈夫だもんね！":"Two tiles away, we're totally safe!","大丈夫……かな？":"Safe…… right?","飛沫でゆらして、とどめの一発":"Rattle them with a splash, then finish them off","満タンの塊とタンク":"Full Clump and Tank","タンクの爆発で満タンの子がはじけると、そこから<b>連鎖</b>がつづく。2マスより遠くの子まで、とどくことも。":"When a tank explosion bursts a full minion, a <b>chain</b> continues from there. It can even reach minions farther than 2 tiles.","インク、満タンにしたよ〜！ たぷたぷ！":"We filled up our ink~! Sloshy!","タンクのまわりは、満タン組でかためるの！":"Around the tank, the full team holds the line!","満タンと、タンク。いちばん危ない組み合わせだ":"Full tanks plus an ink tank. The most dangerous combo","爆発と連鎖で、ひと息に！":"Explosion and chain, all at once!","タンクをねらってくる":"They'll Aim at Tanks","この先の戦闘員は、ヒーローの<b>2マス以内のタンク</b>を撃ってくる。タンクのそばで番を終えないように。":"From here on, minions will shoot tanks <b>within 2 tiles of the Hero</b>. Don't end your turn next to a tank.","いいこと考えた！ ヒーローのそばのタンクを撃っちゃえばいいんだ！":"I've got a great idea! We just shoot the tank next to the Hero!","どかーんで、インクまみれ〜！":"Ka-boom, and she's covered in ink~!","……タンクのそばに立たないようにしないと":"……I'd better not stand next to a tank","タンクのそばには、長居しない":"Don't hang around near tanks","タンクの通路":"Tank Passage","わざの<b>ハレー彗星</b>は、通り道のタンクも爆発させる。一列の子とタンクを、まとめてねらおう。":"The special <b>Halley's Comet</b> also blows up tanks in its path. Aim at a line of minions and tanks together.","通路の見張りは、一列に並んでね〜":"Passage lookouts, line up in single file~","タンクも、通路のまん中に置いとこう！":"Let's put a tank in the middle of the passage too!","一列に、タンクまで……あのわざなら":"A single file, and a tank too…… that special will do it","流星とタンクで、通路が空いた":"Comet and tank cleared the passage","タンクにかこまれて":"Surrounded by Tanks","かこまれたら<b>薙ぎ払い</b>。そのあと、すみのタンクと見張りを片づけよう。タンクのそばで番を終えないように。":"When surrounded, <b>Sweep</b>. Then clean up the corner tanks and lookouts. Don't end your turn next to a tank.","つーかまえた！ まわりは、タンクだらけだよ！":"Gotcha! And there's tanks all around you!","逃げようとしたら、タンクをどかーんだからね！":"Try to run and we'll blow a tank, ka-boom!","まずは、まわりから片づける":"First, clear out my surroundings","タンクの迷路を、ぬけた！":"Made it through the tank maze!","増援とタンク":"Reinforcements and Tanks","増援は<b>四隅</b>から来る。すみのタンクのそばに来たところを、ねらってみよう。":"Reinforcements come from the <b>four corners</b>. Try hitting them as they arrive next to the corner tanks.","本部〜！ タンク置き場にヒーローが〜！":"HQ~! The Hero's in the tank storage~!","増援、すみっこから来るって！":"Reinforcements are coming from the corners!","すみっこには……タンクがあるな":"In the corners there's…… a tank","増援も、タンクといっしょにお帰りいただいた":"The reinforcements went home along with the tanks","第2層の班長":"Level 2 Squad Leader","シアン班長":"Leader Cyan","班長は<b>5回当てないと</b>はじけない（タンクの爆発や飛沫でも1回）。タンクを使えば、いっぺんに何回ぶんも当てられる。":"The Squad Leader takes <b>5 hits</b> to burst (a tank blast or splash counts as 1). Use the tanks to land several hits at once.","タンク置き場へようこそ、ヒーロー":"Welcome to the tank storage, Hero","わたしは第2層の班長、シアン。ちょっとやそっとじゃ、はじけないよ！":"I'm Cyan, Level 2 Squad Leader. It takes more than a little to burst me!","それなら、何回でも当てるだけだ":"Then I'll just hit you as many times as it takes","班長〜、タンクも使って〜！":"Leader~, use the tanks too~!","第2層、制圧！ まだ下がある……":"Level 2 secured! There's still more below……","<b>柱</b>の向こうには、レーザーがとどかない（戦闘員の弾もとどかない）。横に回りこんで、ねらえる場所をさがそう。":"Lasers can't reach past <b>pillars</b> (and neither can minion shots). Go around the side and find a spot to aim from.","ここは倉庫だよ〜 柱がいっぱい！":"This is the warehouse~ Lots of pillars!","柱のうしろにかくれてれば、撃たれないもんね！":"If we hide behind the pillars, we won't get shot!","……なら、回りこめばいい":"……Then I'll just go around","柱があっても、回りこめばいい":"Pillars or not, just go around","柱にかくれる":"Hide Behind Pillars","柱のかげで番を終えると、戦闘員の弾がとどきにくい。撃ったら、<b>柱のうしろへもどる</b>のがコツ。":"End your turn behind a pillar and minion shots have a hard time reaching you. The trick is to shoot, then <b>get back behind the pillar</b>.","みんなで、ヒーローをねらうよ〜！":"Everyone, aim at the Hero~!","どこにいても、まる見えだもん！":"We can see her wherever she is!","あの柱を、盾にさせてもらおう":"I'll borrow that pillar as a shield","柱は、ヒーローの盾にもなる":"Pillars can be the Hero's shield too","回りこんで一直線":"Go Around for a Straight Line","正面は柱の壁。でも<b>列のはしに回りこめば</b>、一直線のレーザーで全員をつらぬける。":"The front is a wall of pillars. But <b>get around to the end of the row</b> and a straight laser pierces them all.","柱の壁のうしろに、ずらっと整列！":"All lined up behind the pillar wall!","これなら正面からは、ぜったい当たらないよ！":"Now you'll never hit us from the front!","正面からは、ね":"From the front, sure","列のはしから、まとめてつらぬいた":"Pierced them all from the end of the row","爆風と柱":"Blasts and Pillars","タンクの爆風も、<b>柱のかげにはとどかない</b>。かげにいる子は、別の向きからねらおう。":"Tank blasts don't <b>reach behind pillars</b> either. Aim at the ones in cover from another direction.","タンクのとなりに、柱を立てといたよ！":"We put a pillar right next to the tank!","爆発しても、柱のうしろなら平気〜":"Even if it blows, we're fine behind the pillar~","全員は、巻きこめないか……":"Can't catch them all, huh……","爆風のとどかない所も、考えて撃つ":"Shoot with the blast's blind spots in mind","倉庫の迷路":"Warehouse Maze","迷路のような倉庫。ハレー彗星も柱で止まる。<b>通路の一直線</b>をさがして、ねらいを通そう。":"A maze-like warehouse. Even Halley's Comet stops at pillars. Find <b>a straight line down a passage</b> to get your shot through.","倉庫の迷路へようこそ〜！":"Welcome to the warehouse maze~!","どこにいるか、わかるかな？":"Can you find where we are?","通路を一つずつ、たしかめていこう":"I'll check the passages one by one","迷路の見張り、全員はじけた":"Every maze lookout burst","柱の通路と増援":"Pillar Passages and Reinforcements","四隅から増援が来る。柱の通路は、来る子の通り道にもなる。<b>通路のまっすぐ先</b>で待ちかまえよう。":"Reinforcements come from the four corners. The pillar passages are their path too. Lie in wait <b>straight down the passage</b>.","本部〜！ 倉庫にもヒーローが来たよ〜！":"HQ~! The Hero's in the warehouse too~!","通路を通ってくるなら、一直線だ":"If they come down the passage, it's a straight line","通路で、まとめてお出むかえ":"A group welcome in the passage","タンクと柱":"Tanks and Pillars","戦闘員はヒーローのそばのタンクを撃ってくる。でも<b>柱のかげなら爆風はとどかない</b>。":"Minions shoot tanks near the Hero. But <b>blasts can't reach behind a pillar</b>.","ヒーローの足もとに、タンクを置いといたよ〜":"We put a tank right at the Hero's feet~","みんなで撃てば、どかーん！":"If we all shoot, ka-boom!","あの柱のうしろまで、急ごう":"I'd better hurry behind that pillar","柱のかげは、爆風のかくれ場所":"Behind a pillar is a hiding spot from blasts","かこまれて、柱":"Surrounded, with Pillars","かこまれたら薙ぎ払い。のこりの4人は、<b>柱で弾をさえぎりながら</b>一人ずつ。":"When surrounded, Sweep. Take the remaining 4 one at a time, <b>using pillars to block their shots</b>.","つーかまえた！ 今度は柱で、逃げ道もふさいだよ！":"Gotcha! This time the pillars block your escape too!","まわりから、いっせいに撃っちゃえ〜！":"Shoot from all around, all at once~!","近い子から、まとめて片づける":"Clear the closest ones together","かこみも柱も、のりこえた":"Got past the encirclement and the pillars","背中の列":"Row of Backs","柱の向こうで、奥を向いている列。<b>柱のすき間から回りこんで</b>、横からブレードか、列のはしからレーザー。":"A row facing away behind the pillars. <b>Slip around through the gaps</b>, then blade from the side, or laser from the end of the row.","奥の見張りは、まかせて〜":"Leave the far side to us~","うしろは柱があるから、安心だよね！":"There's a pillar behind us, so we're safe!","すき間から、そっと回りこもう":"I'll quietly slip around through the gap","列のはしから、静かに片づけた":"Quietly cleared from the end of the row","第3層の班長":"Level 3 Squad Leader","クロ班長":"Leader Kuro","班長は柱の砦の中。<b>6回当てないと</b>はじけない。砦の入口のまっすぐ先からなら、レーザーがとどく。":"The Squad Leader is inside a pillar fortress. She takes <b>6 hits</b> to burst. A laser reaches her from straight in front of the fortress entrance.","よく来たね、ヒーロー。ここは柱の砦だよ":"Welcome, Hero. This is the pillar fortress","わたしは第3層の班長、クロ。この砦は、だれにも破れない！":"I'm Kuro, Level 3 Squad Leader. No one can break this fortress!","入口があるなら、そこからねらうだけだ":"If there's an entrance, I'll just aim through it","班長〜、かくれてて〜！":"Leader~, stay hidden~!","第3層、制圧！ アジトは、まだ深い……":"Level 3 secured! The hideout goes deeper still……","固定砲台部隊":"Fixed Cannon Squad","壁にはりついた25人は、みんなタンクがパンパン。<b>だれでもいいので一撃</b>当てれば……？":"The 25 stuck to the wall all have tanks filled to bursting. <b>Just one hit on anyone</b> and……?","わたしたち、固定砲台部隊！":"We're the Fixed Cannon Squad!","わたしたちの一斉噴射で、今度こそたおすよ！":"With our all-out barrage, this time we'll take you down!","（……壁にはりついて、動けないのか？ 冷静に考えたら、ただの的だな）":"(……They're stuck to the wall and can't move? Thinking calmly, they're just targets)","でも、ずっと待ちすぎて、タンクがパンパン……あ！？":"But we waited so long, our tanks are packed full…… huh!?","これって、やばいかも！？ みんな、今のうちに撃って〜！":"This might be bad!? Everyone, shoot while you can~!","あれ？ とどかないー！":"Huh? It doesn't reach~!","壁にはりついてるから、前に出られないんだった〜！":"We're stuck to the wall, so we can't step forward~!","……それなら、こっちの番だ":"……Then it's my turn","……全員、見事にはじけたな":"……Every one of them burst beautifully","コンベアの作業員":"Conveyor Workers","光る矢印の床は<b>ベルトコンベア</b>。ターンの終わりに、上にいる子を1マス運ぶ。作業員がタンクのそばに集まるまで、<b>待つのも作戦</b>。":"Floors with glowing arrows are <b>conveyor belts</b>. At the end of the turn, they carry whoever is on them 1 tile. <b>Waiting is a strategy too</b>, until the workers gather near the tank.","ここはインク工場！ わたしたち、作業中だよ〜":"This is the ink factory! We're hard at work~","コンベアに乗ってれば、勝手に運んでくれるの！":"If you ride the conveyor, it carries you along by itself!","……あのタンクのほうへ、運ばれていくな":"……They're being carried toward that tank","待てば、コンベアが集めてくれる":"Wait, and the conveyor gathers them for me","運ばれてくるタンク":"Incoming Tank","タンクがコンベアで、作業員の群れへ運ばれていく。<b>となりに着いたところ</b>を撃てば、まとめていける。":"A tank rides the conveyor toward the crowd of workers. Shoot it <b>when it arrives next to them</b> to get them all.","インクタンク、出荷しまーす！":"Ink tank, shipping out~!","こっちに運ばれてきたら、受け取ってね〜":"When it gets here, catch it~","……着いたところを、撃てばいいな":"……I'll shoot it when it arrives","とどいた荷物は、大爆発":"The delivery went off with a bang","ヒーローも運ばれる":"The Hero Gets Carried Too","コンベアは<b>ヒーローも運ぶ</b>。乗ったまま番を終えると、作業員とタンクのほうへ運ばれてしまう。<b>おりてから</b>撃とう。":"Conveyors <b>carry the Hero too</b>. End your turn on one and you'll be carried toward the workers and the tank. <b>Step off first</b>, then shoot.","足もとが……動いてる！？":"The floor…… is moving!?","いらっしゃいませ〜！ ヒーローも、こっちへ運ばれてくるよ！":"Welcome~! The Hero gets carried this way too!","タンクのとなりまで、ごあんな〜い！":"Right this way, to the tank~!","コンベアからおりて、落ちついて撃つ":"Step off the conveyor and shoot calmly","一列にそろう":"Lining Up","コンベアの終わりで、作業員が<b>横一列</b>にそろう。そろったら、<b>列のはし</b>から一直線のレーザー。":"At the end of the conveyor, the workers line up <b>side by side</b>. Once they're lined up, a straight laser from <b>the end of the row</b>.","コンベアの終わりで、整列〜！":"Line up at the end of the conveyor~!","きれいに並ぶと、気持ちいいよね！":"Lining up neatly feels so good!","並んでくれるなら、ありがたい":"If they'll line up for me, I'm grateful","そろった列を、まとめてつらぬいた":"Pierced the lined-up row all at once","ぐるぐるコンベア":"Round-and-Round Conveyor","まわりつづけるコンベア。作業員が<b>タンクのそばを通るとき</b>が、ねらいどき。":"A conveyor that keeps going around. The moment to strike is <b>when a worker passes by the tank</b>.","ぐるぐる〜 ぐるぐる〜":"Round and round~ round and round~","まわってると、ねらいにくいでしょ！":"Hard to aim when we're spinning, isn't it!","タンクのそばに来たときが、チャンスだ":"The chance is when they come by the tank","まわる工場も、止めてみせた":"Even a spinning factory, I can stop","柱のすき間":"Gaps Between Pillars","作業員は柱のうしろ。でもコンベアで運ばれて、<b>すき間に来たとき</b>はねらえる。列のはしに回りこむ手もある。":"The workers are behind pillars. But when the conveyor carries them <b>into a gap</b>, you can hit them. Going around to the end of the row works too.","柱のうしろで、安全に作業〜":"Working safely behind the pillars~","ヒーローからは、見えないもんね！":"The Hero can't see us!","……ずっと柱のうしろに、いられるかな":"……Can they stay behind the pillars forever?","すき間を通る瞬間を、のがさない":"Don't miss the moment they pass the gap","近づくタンク":"Approaching Tank","タンクがコンベアでまん中へ運ばれてくる。作業員は、ヒーローのそばのタンクを撃つ。<b>タンクから2マス以上はなれて</b>。":"A tank rides the conveyor into the middle. Workers shoot tanks near the Hero. <b>Stay 2 or more tiles away from the tank</b>.","タンク、まん中へ出荷〜！":"Tank, shipping to the middle~!","ヒーローのそばに来たら、どかーんだよ！":"When it gets near the Hero, ka-boom!","タンクの通り道からは、はなれておこう":"Stay away from the tank's path","近づくタンクから、うまくにげた":"Got away from the approaching tank","増援のコンベア":"Conveyor Reinforcements","奥のすみから来た増援は、コンベアで<b>まん中のタンク</b>へ運ばれる。集まったところを、まとめて。":"Reinforcements from the far corners get carried by the conveyor to <b>the tank in the middle</b>. Get them all once they gather.","本部〜！ 工場にヒーローが〜！":"HQ~! The Hero's in the factory~!","増援、コンベアで送るね〜！":"We'll send reinforcements by conveyor~!","コンベアの先には……タンクか":"At the end of the conveyor…… a tank","送られてきた増援も、まとめて":"The reinforcements that got sent, all at once","タンクの行列":"Tank Parade","タンクと作業員の行列が、奥の群れへ運ばれていく。<b>行列がつまって、群れにくっついたとき</b>が、いちばんの見せ場。":"A parade of tanks and workers rides toward the crowd at the back. The best moment is <b>when the parade backs up and touches the crowd</b>.","タンクと作業員、まとめて出荷〜！":"Tanks and workers, shipping out together~!","むこうの倉庫で、みんなで待ってるよ〜":"We're all waiting in the warehouse over there~","ぜんぶ集まってから……一発で":"Once they've all gathered…… one shot","行列ごと、ひと息に！":"The whole parade, all at once!","第4層の班長":"Level 4 Squad Leader","モエギ班長":"Leader Moegi","班長はコンベアに乗って、ぐるぐるまわっている。<b>6回当てないと</b>はじけない。<b>タンクのそばを通るとき</b>に爆発させれば、まわりの作業員ごと。":"The Squad Leader rides the conveyor around and around. She takes <b>6 hits</b> to burst. Blow up a tank <b>as she passes by it</b> and the nearby workers go too.","インク工場へようこそ、ヒーロー！":"Welcome to the ink factory, Hero!","わたしは第4層の班長、モエギ。工場のラインは、止まらないよ！":"I'm Moegi, Level 4 Squad Leader. The factory line never stops!","それなら、ラインごと止めてみせる":"Then I'll stop it, line and all","班長〜、まわりながら、がんばって〜！":"Leader~, keep spinning and do your best~!","第4層、制圧！ アジトの奥へ……":"Level 4 secured! Into the depths of the hideout……","床の紫の水たまりは<b>インクだまり</b>。ヒーローが通ると<b>1マスごとによごれ+1</b>。むりに近づかず、ここからねらおう。":"The purple puddles on the floor are <b>ink pools</b>. The Hero gets <b>+1 grime per tile</b> walking through. Don't force your way in; aim from here.","ここは地下水路！ インクのだまりが、いっぱいだよ〜":"This is the underground waterway! Full of ink pools~","ヒーローが入ったら、インクまみれだね！":"If the Hero steps in, she'll be covered in ink!","……足もとに気をつけないと":"……I'd better watch my step","だまりには、足をふみいれずにすんだ":"Managed not to set foot in the pools","はじけた後のだまり":"Pools Left Behind","戦闘員がはじけると、その場所に<b>新しいインクだまり</b>ができる。目の前の塊をはじけさせると、道がふさがるかも。":"When a minion bursts, a <b>new ink pool</b> forms there. Burst the clump in front of you and you might block your own path.","はじけても、わたしたちのインクは残るんだよ〜":"Even when we burst, our ink stays behind~","ヒーローの通り道、インクでふさいじゃえ！":"Block the Hero's path with ink!","はじけさせる場所も、考えないとな":"I need to think about where they burst, too","はじけさせる場所で、道が変わる":"Where they burst changes the path","だまりで満タン":"Full from the Pools","インクだまりの上の戦闘員は、<b>毎ターン満タン</b>になる。ななめにくっついた満タンの子は……<b>1ターン待って</b>から、ねらってみよう。":"Minions standing in an ink pool become <b>full every turn</b>. Full minions touching diagonally…… try <b>waiting 1 turn</b> before you aim.","だまりにつかってると、インクがどんどんたまる〜":"Soaking in the pool fills our ink up more and more~","みんな満タンで、パワーアップだよ！":"Everyone's full and powered up!","満タンで、ななめにくっついて……か":"Full, and touching diagonally…… huh","だまりの満タンは、連鎖のもと":"Full from the pools means chain fuel","沼を渡る子":"Wading Through the Swamp","戦闘員は沼の中を歩いてくる。<b>沼の中で番を終えた子は満タン</b>。くっついたところを、まとめて。":"The minions walk through the swamp. <b>Minions who end their turn in the swamp are full</b>. Get them all once they bunch up.","沼なんて、へっちゃら〜！":"A swamp? No problem~!","ちゃぷちゃぷ、インクがたまっていく〜":"Splish splash, our ink is filling up~","沼の中で、満タンになっているな……":"They're getting full in the swamp……","沼の満タン組を、まとめて":"The full swamp crew, all at once","沼とタンク":"Swamp and Tanks","タンクの爆発は、まわりに<b>インクだまり</b>を作る。だまりに残った子は満タンになって、次の一発で連鎖しやすい。":"Tank blasts create <b>ink pools</b> around them. Minions left in a pool become full and chain easily on the next shot.","タンクのまわりで、休けい中〜":"Taking a break around the tank~","ばくはつしても、インクがまた使えるもんね！":"Even if it explodes, we can use the ink again!","一度で決めるか、二度に分けるか":"Finish in one, or split it into two?","爆発のあとのだまりまで、使いこなした":"Even made use of the pools after the blast","柱と沼":"Pillars and Swamp","柱のかげの子をねらうには、動く道をえらぶこと。<b>だまりのすき間</b>を通れば、よごれない。":"To aim at minions behind pillars, choose your path. Go through <b>the gaps between pools</b> and you won't get grimy.","柱と沼で、守りはかんぺき！":"Pillars and swamp, our defense is perfect!","ヒーロー、どっちから来るの〜？":"Hero, which way are you coming from~?","すき間の道を、さがそう":"Let's find a path through the gaps","すき間の道を、うまく通れた":"Slipped through the gaps nicely","かこまれて、沼":"Surrounded, with Swamp","まわりはかこまれ、その外は沼。薙ぎ払いのあとは、<b>はじけた所もだまり</b>になる。動かずに撃てる相手から。":"Surrounded, with swamp beyond. After a Sweep, <b>where they burst becomes pools too</b>. Start with the ones you can shoot without moving.","つーかまえた！ まわりは沼だよ〜！":"Gotcha! It's all swamp around you~!","にげようとしたら、インクまみれだね！":"Try to run and you'll be covered in ink!","動かずに、片づけられるか":"Can I clear them without moving?","沼のかこみも、ぬけた":"Got out of the swamp encirclement too","沼の増援":"Swamp Reinforcements","増援は四隅の沼から来る。<b>沼の中で番を終えた増援は満タン</b>。かたまったところをねらおう。":"Reinforcements come from the swamps in the four corners. <b>Reinforcements who end their turn in the swamp are full</b>. Aim when they bunch up.","本部〜！ 地下水路にヒーローが〜！":"HQ~! The Hero's in the underground waterway~!","増援、沼をこえて行くよ〜！":"Reinforcements, crossing the swamp~!","沼から来るなら、満タンだな":"If they come from the swamp, they're full","沼からの増援も、まとめて":"Even the swamp reinforcements, all at once","大きな沼":"The Big Swamp","大きな沼につかった作業員たち。<b>満タンになるまで待って</b>から、だれか一人に一撃。その前に、近づく警備係を。":"Workers soaking in a big swamp. <b>Wait until they're full</b>, then one hit on any one of them. Before that, deal with the approaching guards.","沼のお風呂、気持ちいい〜":"The swamp bath feels so good~","インクがたまって、ぽかぽか〜":"The ink's piling up, nice and warm~","……満タンになるまで、待つか":"……I'll wait until they're full","沼ぜんぶを、ひと息に！":"The whole swamp, all at once!","第5層の班長":"Level 5 Squad Leader","セピア班長":"Leader Sepia","班長は沼のまん中。まわりの子は<b>毎ターン満タン</b>。班長は<b>7回当てないと</b>はじけない。連鎖とタンクで、何回ぶんも当てよう。":"The Squad Leader is in the middle of the swamp. The minions around her are <b>full every turn</b>. She takes <b>7 hits</b> to burst. Use chains and tanks to land several hits.","地下水路へようこそ、ヒーロー":"Welcome to the underground waterway, Hero","わたしは第5層の班長、セピア。この沼は、わたしたちの力のみなもとだよ！":"I'm Sepia, Level 5 Squad Leader. This swamp is the source of our power!","その沼ごと、片づけてみせる":"Then I'll clear you out, swamp and all","班長〜、沼の中なら、満タンだよ〜！":"Leader~, in the swamp you're always full~!","第5層、制圧！ アジトの底は、もうすぐ……":"Level 5 secured! The bottom of the hideout is close……","頭の上に白い十字の子は<b>救護係</b>。となりのインク漏れの子を<b>治して</b>しまう。先に救護係をねらおう。":"Minions with a white cross over their heads are <b>medics</b>. They <b>heal</b> leaking minions next to them. Go for the medics first.","けがしたら、救護係におまかせ〜！":"If you get hurt, leave it to the medics~!","インク漏れくらい、すぐ治しちゃうよ！":"An ink leak? We'll fix it right up!","……あの十字の子から、たおすべきだな":"……I should take down the ones with the cross first","救護係を先に、が鉄則だ":"Medics first. That's the golden rule","救護係をねらえ":"Target the Medic","救護係が、まわりをかこまれて守られている。まわりの子をインク漏れにしても、<b>まん中の救護係</b>が治してしまう。":"The medic is surrounded and protected. Even if you make the ones around her leak, <b>the medic in the middle</b> will heal them.","救護係は、みんなで守るよ〜！":"We'll all protect the medic~!","まん中にいれば、安心だもんね！":"In the middle, she's safe!","まん中か……ねらい方を考えよう":"In the middle, huh…… let's think about how to aim","まん中の救護係から、くずした":"Broke them down, starting with the medic in the middle","治される前に":"Before They Heal","爆発寸前の子は、もう1発ではじける。でも救護係がとなりにいると、<b>治されてしまう</b>。治される前に、まとめて。":"About-to-burst minions burst with one more shot. But with a medic next to them, <b>they'll get healed</b>. Get them all before that.","うう……インクがもれて、もう限界……":"Ugh…… ink's leaking, I can't take much more……","まってて、いま治すからね〜！":"Hang on, I'll heal you right now~!","治される前に、決めないと":"I have to finish before they heal","治される前に、まとめて片づけた":"Cleared them all before they could heal","救護係と連鎖":"Medics and Chains","満タンの塊は連鎖で一気に。救護係は、連鎖で<b>インク漏れのまま残った子</b>を治しにくる。救護係ごと巻きこもう。":"Take the full clump in one chain. Medics come to heal <b>the ones the chain left leaking</b>. Catch the medics in it too.","満タンで、みんなで固まってるよ〜":"We're all full and huddled together~","救護係もいるから、安心安心！":"There's a medic too, so we're safe, safe!","救護係も、塊のそばにいるな":"The medic is near the clump too","救護係ごと、連鎖で":"Medic and all, with a chain","救護係とタンク":"Medics and Tanks","救護係がタンクのそばに集まっている。<b>タンクの爆発</b>なら、救護係もまとめて。":"The medics are gathered near a tank. A <b>tank explosion</b> gets the medics too.","タンクのそばは、救護係の休けい所〜":"Next to the tank is the medics' break room~","みんなで、お茶にしよ〜":"Let's all have some tea~","……そこで休けいは、危ないぞ":"……That's a dangerous place for a break","休けい所ごと、大爆発":"Break room and all, a big explosion","柱のうしろの救護係":"Medic Behind the Pillar","救護係は柱のうしろ。前に出てくる子をインク漏れにすると、救護係が<b>治しに出てくる</b>。そこをねらう手も。":"The medic is behind a pillar. Make a front-line minion leak and the medic <b>comes out to heal her</b>. You could strike then.","救護係は、柱のうしろで待機〜":"The medic waits behind the pillar~","けがしたら、すぐ来てね〜！":"If you get hurt, call me right away~!","出てきたところを、ねらうか":"I'll strike when she comes out","出てきた救護係を、のがさない":"Didn't miss the medic when she came out","沼の救護係":"Swamp Medics","沼の中の子は毎ターン満タン。救護係も沼の中。<b>1ターン待って、みんな満タン</b>になったら……。":"Minions in the swamp are full every turn. The medics are in the swamp too. <b>Wait 1 turn until they're all full</b>, and then……","沼の中の医務室だよ〜":"It's a medic room in the swamp~","インクたっぷり、元気いっぱい！":"Lots of ink, lots of energy!","みんな満タンになるのを、待とう":"Let's wait until they're all full","沼の医務室、まとめて片づけた":"Cleared out the swamp medic room all at once","救護係と増援":"Medics and Reinforcements","増援が来るうえに、救護係が治してまわる。<b>救護係から先に</b>。増援は四隅から。":"Reinforcements come, and the medics go around healing. <b>Medics first</b>. Reinforcements come from the four corners.","本部〜！ 医務室にヒーローが〜！":"HQ~! The Hero's in the medic room~!","増援、すぐ来るって！ けがは治すから、がんばって！":"Reinforcements are coming soon! We'll heal you, so hang in there!","長引くほど、不利だな":"The longer this drags on, the worse for me","救護係から先に、正解だった":"Medics first was the right call","救護部隊":"Medic Squad","救護係だらけの部隊。爆発寸前の子と救護係がくっついている。<b>満タンの救護係</b>がはじければ、となりの子も連鎖する。":"A squad full of medics. About-to-burst minions are touching medics. When <b>a full medic</b> bursts, her neighbors chain too.","救護部隊、出動〜！":"Medic Squad, move out~!","だれひとり、はじけさせないよ！":"We won't let a single one burst!","くっついているなら、連鎖でいける":"If they're touching, a chain will do it","救護部隊、まとめて解散":"Medic Squad, disbanded all at once","幹部ナデシコ":"Officer Nadeshiko","インク団の<b>幹部</b>。<b>7回当てないと</b>はじけない。<b>治しの号令</b>で、まわり2マスのインク漏れの子を毎ターン治す。救護係もいる。一気にはじけさせよう。":"An Ink Corps <b>Officer</b>. She takes <b>7 hits</b> to burst. With her <b>Healing Call</b>, she heals leaking minions within 2 tiles every turn. There are medics too. Burst them all at once.","あらあら、こんな奥まで……けがはない？ ヒーローさん":"My, my, all the way down here…… are you hurt, Miss Hero?","わたしはインク団の幹部、ナデシコ。みんなのけがは、わたしがぜんぶ治してあげる":"I'm Nadeshiko, an Ink Corps Officer. I'll heal every one of everyone's injuries","幹部……ここからが本番か":"An Officer…… this is where it gets real","ナデシコさまがいれば、はじけても平気だよ〜！":"With Lady Nadeshiko here, bursting is no problem~!","幹部ナデシコ、撃破！ アジトの奥から、だれかの気配が……":"Officer Nadeshiko defeated! Someone's presence stirs from deeper in the hideout……","ななめの板は<b>鏡</b>。レーザーを鏡に向けて撃つと、<b>直角に曲がって</b>つらぬく。柱のうしろの列も、横からねらえる。":"The diagonal panels are <b>mirrors</b>. Fire a laser at a mirror and it <b>turns at a right angle</b> and pierces on. You can hit rows behind pillars from the side.","ここは鏡の回廊〜！ 柱のうしろなら、ぜったい安全！":"This is the Mirror Corridor~! Behind the pillars, we're totally safe!","ヒーローのレーザーなんて、とどかないもんね！":"The Hero's laser can't reach us!","……あの鏡、使えそうだな":"……That mirror looks useful","鏡で曲げて、柱のうしろへ":"Bent by the mirror, behind the pillars","左右の鏡":"Left and Right Mirrors","鏡の向きで、曲がる向きが変わる。<b>左の鏡は上へ、右の鏡も上へ</b>。横に撃てば、柱のすき間を通って奥の列へ。":"The direction a mirror faces changes where the laser turns. <b>The left mirror sends it up, and the right mirror sends it up too</b>. Shoot sideways and it passes the gaps between pillars to the rows at the back.","左右のすみっこで、見張り中〜":"On lookout in the left and right corners~","柱がじゃまで、まっすぐは撃てないでしょ！":"The pillars are in the way, so you can't shoot straight!","まっすぐじゃなければ、いいんだろう？":"So it's fine as long as it's not straight, right?","左右の鏡で、両方の列を":"Both rows, with the left and right mirrors","うしろ向きの列":"Rows Facing Away","奥を向いた列は、下からだと背中しか見えない。<b>上の鏡</b>を使えば、列の正面からつらぬける。":"From below, a row facing away only shows its backs. Use <b>the mirror above</b> to pierce the row from the front.","奥の見張り、ばっちり〜":"Lookout at the back, all set~","うしろからのレーザーは、表に当たらないもんね！":"Lasers from behind can't hit our front!","表に当てるには……上からか":"To hit the front…… from above, then","鏡で、列の正面に回った":"Got around to the row's front with a mirror","鏡とタンク":"Mirrors and Tanks","柱のうしろのタンク。<b>鏡で曲げたレーザー</b>でも、タンクは大爆発する。":"A tank behind a pillar. Even with <b>a laser bent by a mirror</b>, the tank explodes big.","タンクは柱のうしろに、しまっといたよ〜":"We stashed the tank behind the pillar~","縦に並んだ3人。一直線のレーザーは":"Three in a vertical line. A straight laser","する。ベリータンクの高さをねらおう。":"through. Aim at Belly Tank height.","満タンの子がはじけると、隣の満タンの子も":"When a full minion bursts, full minions next to her","してはじける。くっついた塊をねらおう。":"and burst too. Aim for the clumps.","背中側からは、レーザーが表のタンクに当たらない。でも":"From behind, the laser can't hit the tanks on their front. But","背中からのブレード":"a blade from behind","は一刀ではじける。":"bursts them in one slash.","横を向いた列は、":"For a row facing sideways, get around to","同じ列の正面":"the front of that row","に回りこむと、一直線で貫通できる。":"and one straight shot pierces them all.","わざの":"The special","ハレー彗星":"Halley's Comet","は、一直線10マスの子を、満タンでなくてもまとめてはじけさせる。使うと3ターン休み。":"bursts every minion in a straight line of 10 tiles, full or not. It needs 3 turns to recharge.","まわりをかこまれたら、わざの":"When you're surrounded, use the special","薙ぎ払い":"Sweep","。隣の8マスの子を、まとめてはじけさせる（はじけた飛沫を少し浴びる）。":". It bursts every minion on the 8 tiles around you (you'll catch a little splash).","この面は、はじめの2ターン、戦闘員の番の終わりに":"On this stage, for the first 2 turns,","四隅から増援":"reinforcements arrive from the four corners","が来る。来た子も全員はじけさせればクリア。":"at the end of the minions' turn. Burst every one of them too to clear.","まん中の":"Shoot the","を撃つと大爆発！ まわり1マスの子は、満タンでなくても":"in the middle for a huge explosion! Minions within 1 tile","即はじける":"burst instantly","タンクの爆発は、ヒーローにもかかる（1マスで":"Tank explosions hit the Hero too (","よごれ6":"6 grime","、2マスで":"at 1 tile,","よごれ3":"3 grime","）。先に":"at 2 tiles). Get","3マス以上はなれて":"3 or more tiles away","から撃とう。":"before you shoot.","タンクの爆発は、":"A tank explosion spreads to","2マス以内のほかのタンク":"other tanks within 2 tiles","にも燃えうつる（誘爆）。ならんだタンクは、1つ撃てば全部いける。":"(chain explosion). Shoot one tank in a row and they all go.","2マス先の子には、飛沫がかかるだけ。":"Minions 2 tiles away only get splashed.","満タンでない子はインク漏れ":"Minions who aren't full stop at an ink leak","で止まる。止まった子は、もう1発ではじける。":". Once stopped, one more shot bursts them.","タンクの爆発で満タンの子がはじけると、そこから":"When a tank explosion bursts a full minion, a","がつづく。2マスより遠くの子まで、とどくことも。":"continues from there. It can even reach minions farther than 2 tiles.","この先の戦闘員は、ヒーローの":"From here on, minions will shoot tanks","2マス以内のタンク":"within 2 tiles of the Hero","を撃ってくる。タンクのそばで番を終えないように。":". Don't end your turn next to a tank.","は、通り道のタンクも爆発させる。一列の子とタンクを、まとめてねらおう。":"also blows up tanks in its path. Aim at a line of minions and tanks together.","かこまれたら":"When surrounded,","。そのあと、すみのタンクと見張りを片づけよう。タンクのそばで番を終えないように。":". Then clean up the corner tanks and lookouts. Don't end your turn next to a tank.","増援は":"Reinforcements come from the","四隅":"four corners","から来る。すみのタンクのそばに来たところを、ねらってみよう。":". Try hitting them as they arrive next to the corner tanks.","班長は":"The Squad Leader takes","5回当てないと":"5 hits","はじけない（タンクの爆発や飛沫でも1回）。タンクを使えば、いっぺんに何回ぶんも当てられる。":"to burst (a tank blast or splash counts as 1). Use the tanks to land several hits at once.","の向こうには、レーザーがとどかない（戦闘員の弾もとどかない）。横に回りこんで、ねらえる場所をさがそう。":"(and neither can minion shots). Go around the side and find a spot to aim from.","柱のかげで番を終えると、戦闘員の弾がとどきにくい。撃ったら、":"End your turn behind a pillar and minion shots have a hard time reaching you. The trick is to shoot, then","柱のうしろへもどる":"get back behind the pillar","のがコツ。":".","正面は柱の壁。でも":"The front is a wall of pillars. But","列のはしに回りこめば":"get around to the end of the row","、一直線のレーザーで全員をつらぬける。":"and a straight laser pierces them all.","タンクの爆風も、":"Tank blasts don't","柱のかげにはとどかない":"reach behind pillars","。かげにいる子は、別の向きからねらおう。":"either. Aim at the ones in cover from another direction.","迷路のような倉庫。ハレー彗星も柱で止まる。":"A maze-like warehouse. Even Halley's Comet stops at pillars. Find","通路の一直線":"a straight line down a passage","をさがして、ねらいを通そう。":"to get your shot through.","四隅から増援が来る。柱の通路は、来る子の通り道にもなる。":"Reinforcements come from the four corners. The pillar passages are their path too. Lie in wait","通路のまっすぐ先":"straight down the passage","で待ちかまえよう。":".","戦闘員はヒーローのそばのタンクを撃ってくる。でも":"Minions shoot tanks near the Hero. But","柱のかげなら爆風はとどかない":"blasts can't reach behind a pillar","かこまれたら薙ぎ払い。のこりの4人は、":"When surrounded, Sweep. Take the remaining 4 one at a time,","柱で弾をさえぎりながら":"using pillars to block their shots","一人ずつ。":".","柱の向こうで、奥を向いている列。":"A row facing away behind the pillars.","柱のすき間から回りこんで":"Slip around through the gaps","、横からブレードか、列のはしからレーザー。":", then blade from the side, or laser from the end of the row.","班長は柱の砦の中。":"The Squad Leader is inside a pillar fortress. She takes","6回当てないと":"6 hits","はじけない。砦の入口のまっすぐ先からなら、レーザーがとどく。":"to burst. A laser reaches her from straight in front of the fortress entrance.","壁にはりついた25人は、みんなタンクがパンパン。":"The 25 stuck to the wall all have tanks filled to bursting.","だれでもいいので一撃":"Just one hit on anyone","当てれば……？":"and……?","。ターンの終わりに、上にいる子を1マス運ぶ。作業員がタンクのそばに集まるまで、":". At the end of the turn, they carry whoever is on them 1 tile.","タンクがコンベアで、作業員の群れへ運ばれていく。":"A tank rides the conveyor toward the crowd of workers. Shoot it","となりに着いたところ":"when it arrives next to them","を撃てば、まとめていける。":"to get them all.","コンベアは":"Conveyors","ヒーローも運ぶ":"carry the Hero too","。乗ったまま番を終えると、作業員とタンクのほうへ運ばれてしまう。":". End your turn on one and you'll be carried toward the workers and the tank.","おりてから":"Step off first","撃とう。":", then shoot.","コンベアの終わりで、作業員が":"At the end of the conveyor, the workers line up","横一列":"side by side","にそろう。そろったら、":". Once they're lined up, a straight laser from","列のはし":"the end of the row","から一直線のレーザー。":".","まわりつづけるコンベア。作業員が":"A conveyor that keeps going around. The moment to strike is","タンクのそばを通るとき":"when a worker passes by the tank","が、ねらいどき。":".","作業員は柱のうしろ。でもコンベアで運ばれて、":"The workers are behind pillars. But when the conveyor carries them","すき間に来たとき":"into a gap","はねらえる。列のはしに回りこむ手もある。":", you can hit them. Going around to the end of the row works too.","タンクがコンベアでまん中へ運ばれてくる。作業員は、ヒーローのそばのタンクを撃つ。":"A tank rides the conveyor into the middle. Workers shoot tanks near the Hero.","タンクから2マス以上はなれて":"Stay 2 or more tiles away from the tank","奥のすみから来た増援は、コンベアで":"Reinforcements from the far corners get carried by the conveyor to","まん中のタンク":"the tank in the middle","へ運ばれる。集まったところを、まとめて。":". Get them all once they gather.","タンクと作業員の行列が、奥の群れへ運ばれていく。":"A parade of tanks and workers rides toward the crowd at the back. The best moment is","行列がつまって、群れにくっついたとき":"when the parade backs up and touches the crowd","が、いちばんの見せ場。":".","班長はコンベアに乗って、ぐるぐるまわっている。":"The Squad Leader rides the conveyor around and around. She takes","はじけない。":"to burst. Blow up a tank","に爆発させれば、まわりの作業員ごと。":"and the nearby workers go too.","。むりに近づかず、ここからねらおう。":"walking through. Don't force your way in; aim from here.","戦闘員がはじけると、その場所に":"When a minion bursts, a","新しいインクだまり":"new ink pool","ができる。目の前の塊をはじけさせると、道がふさがるかも。":"forms there. Burst the clump in front of you and you might block your own path.","インクだまりの上の戦闘員は、":"Minions standing in an ink pool become","毎ターン満タン":"full every turn","になる。ななめにくっついた満タンの子は……":". Full minions touching diagonally…… try","1ターン待って":"waiting 1 turn","から、ねらってみよう。":"before you aim.","戦闘員は沼の中を歩いてくる。":"The minions walk through the swamp.","沼の中で番を終えた子は満タン":"Minions who end their turn in the swamp are full","。くっついたところを、まとめて。":". Get them all once they bunch up.","タンクの爆発は、まわりに":"Tank blasts create","を作る。だまりに残った子は満タンになって、次の一発で連鎖しやすい。":"around them. Minions left in a pool become full and chain easily on the next shot.","柱のかげの子をねらうには、動く道をえらぶこと。":"To aim at minions behind pillars, choose your path. Go through","だまりのすき間":"the gaps between pools","を通れば、よごれない。":"and you won't get grimy.","まわりはかこまれ、その外は沼。薙ぎ払いのあとは、":"Surrounded, with swamp beyond. After a Sweep,","はじけた所もだまり":"where they burst becomes pools too","になる。動かずに撃てる相手から。":". Start with the ones you can shoot without moving.","増援は四隅の沼から来る。":"Reinforcements come from the swamps in the four corners.","沼の中で番を終えた増援は満タン":"Reinforcements who end their turn in the swamp are full","。かたまったところをねらおう。":". Aim when they bunch up.","大きな沼につかった作業員たち。":"Workers soaking in a big swamp.","満タンになるまで待って":"Wait until they're full","から、だれか一人に一撃。その前に、近づく警備係を。":", then one hit on any one of them. Before that, deal with the approaching guards.","班長は沼のまん中。まわりの子は":"The Squad Leader is in the middle of the swamp. The minions around her are","。班長は":". She takes","7回当てないと":"7 hits","はじけない。連鎖とタンクで、何回ぶんも当てよう。":"to burst. Use chains and tanks to land several hits.","。となりのインク漏れの子を":". They","しまう。先に救護係をねらおう。":"leaking minions next to them. Go for the medics first.","救護係が、まわりをかこまれて守られている。まわりの子をインク漏れにしても、":"The medic is surrounded and protected. Even if you make the ones around her leak,","まん中の救護係":"the medic in the middle","が治してしまう。":"will heal them.","爆発寸前の子は、もう1発ではじける。でも救護係がとなりにいると、":"About-to-burst minions burst with one more shot. But with a medic next to them,","治されてしまう":"they'll get healed","。治される前に、まとめて。":". Get them all before that.","満タンの塊は連鎖で一気に。救護係は、連鎖で":"Take the full clump in one chain. Medics come to heal","インク漏れのまま残った子":"the ones the chain left leaking","を治しにくる。救護係ごと巻きこもう。":". Catch the medics in it too.","救護係がタンクのそばに集まっている。":"The medics are gathered near a tank. A","タンクの爆発":"tank explosion","なら、救護係もまとめて。":"gets the medics too.","救護係は柱のうしろ。前に出てくる子をインク漏れにすると、救護係が":"The medic is behind a pillar. Make a front-line minion leak and the medic","治しに出てくる":"comes out to heal her","。そこをねらう手も。":". You could strike then.","沼の中の子は毎ターン満タン。救護係も沼の中。":"Minions in the swamp are full every turn. The medics are in the swamp too.","1ターン待って、みんな満タン":"Wait 1 turn until they're all full","になったら……。":", and then……","増援が来るうえに、救護係が治してまわる。":"Reinforcements come, and the medics go around healing.","救護係から先に":"Medics first","。増援は四隅から。":". Reinforcements come from the four corners.","救護係だらけの部隊。爆発寸前の子と救護係がくっついている。":"A squad full of medics. About-to-burst minions are touching medics. When","満タンの救護係":"a full medic","がはじければ、となりの子も連鎖する。":"bursts, her neighbors chain too.","インク団の":"An Ink Corps","治しの号令":"Healing Call","で、まわり2マスのインク漏れの子を毎ターン治す。救護係もいる。一気にはじけさせよう。":", she heals leaking minions within 2 tiles every turn. There are medics too. Burst them all at once.","。レーザーを鏡に向けて撃つと、":". Fire a laser at a mirror and it","つらぬく。柱のうしろの列も、横からねらえる。":"and pierces on. You can hit rows behind pillars from the side.","鏡の向きで、曲がる向きが変わる。":"The direction a mirror faces changes where the laser turns.","左の鏡は上へ、右の鏡も上へ":"The left mirror sends it up, and the right mirror sends it up too","。横に撃てば、柱のすき間を通って奥の列へ。":". Shoot sideways and it passes the gaps between pillars to the rows at the back.","奥を向いた列は、下からだと背中しか見えない。":"From below, a row facing away only shows its backs. Use","上の鏡":"the mirror above","を使えば、列の正面からつらぬける。":"to pierce the row from the front.","柱のうしろのタンク。":"A tank behind a pillar. Even with","鏡で曲げたレーザー":"a laser bent by a mirror","でも、タンクは大爆発する。":", the tank explodes big.","これなら、ばくはつしないもんね！":"That way, it won't explode!","鏡の角度は……いけるな":"The mirror's angle…… that works","鏡ごしの大爆発！":"A big explosion via mirror!","二つの鏡":"Two Mirrors","レーザーは、<b>鏡から鏡へ</b>何回でも曲がる（全部で10マスまで）。まっすぐ上の鏡から右の鏡へ……柱にはさまれた列にとどくかな。":"A laser turns <b>from mirror to mirror</b> any number of times (up to 10 tiles in all). From the mirror straight up to the mirror on the right…… will it reach the row boxed in by pillars?","柱でぐるっと、かこったよ〜":"We surrounded ourselves with pillars~","ここに入るには、おりの中に入るしかないね！":"The only way in here is to walk into the cage!","……鏡を、つないでいけば":"……If I chain the mirrors together","鏡から鏡へ、ねらいどおり":"Mirror to mirror, right on target","鏡と警備係":"Mirrors and Guards","警備係が近づいてくる。<b>鏡の前に立つと</b>、奥の塊もねらえる。どちらを先にするか。":"Guards are approaching. <b>Stand in front of the mirror</b> and you can hit the clump at the back too. Which one first?","警備係、出動〜！":"Guards, move out~!","奥の子たちは、柱のうしろで休けい中！":"The girls at the back are on break behind the pillars!","近い子と、奥の塊と……":"The close ones, and the clump at the back……","近くも奥も、片づけた":"Cleared both the close ones and the far ones","鏡とコンベア":"Mirrors and Conveyors","コンベアの作業員は、柱の壁のうしろ。壁のはしの<b>すき間</b>まで運ばれてきたところを、右の鏡で曲げたレーザーか、すき間の真下から。":"The conveyor workers are behind a wall of pillars. When they're carried to the <b>gap</b> at the end of the wall, hit them with a laser bent by the right mirror, or from straight below the gap.","鏡の回廊にも、コンベアがあるんだよ〜":"There's a conveyor in the Mirror Corridor too~","壁のうしろで、安全にお仕事〜":"Working safely behind the wall~","はしまで運ばれてきたら……":"Once they're carried to the end……","コンベアの先で、まとめて":"At the end of the conveyor, all at once","鏡と沼":"Mirrors and Swamp","沼の中の作業員は、毎ターン満タン。柱の向こうは、<b>鏡で曲げて</b>。鏡まで行く道は、沼をよけて。":"Workers in the swamp are full every turn. Past the pillars, <b>bend it with a mirror</b>. On the way to the mirror, avoid the swamp.","沼のぬくぬく作業場、柱のうしろにかくしたよ〜":"We hid our cozy swamp workshop behind the pillars~","柱のうしろなら、まっすぐのレーザーは、とどかないもんね！":"Behind the pillars, a straight laser can't reach us!","まっすぐがだめなら……鏡で曲げる":"If straight won't work…… I'll bend it with a mirror","沼も柱も、鏡でこえた":"Got past the swamp and the pillars with a mirror","鏡と増援":"Mirrors and Reinforcements","四隅から増援。鏡を使えば、柱のかげの子にも、来たばかりの増援にもとどく。":"Reinforcements from the four corners. With the mirrors, you can reach minions behind pillars and freshly arrived reinforcements.","本部〜！ 鏡の回廊にヒーローが〜！":"HQ~! The Hero's in the Mirror Corridor~!","増援、すみっこから行くよ〜！":"Reinforcements, coming from the corners~!","鏡の向きを、よく見ておこう":"Let's take a good look at which way the mirrors face","鏡ごしに、増援も":"Reinforcements too, via mirror","幹部セレナ":"Officer Serena","幹部セレナの<b>はね返しの盾</b>は、<b>正面</b>からのレーザー・ブレードをはね返す。<b>鏡で横やうしろ</b>に回すか、タンクの爆発・連鎖の飛沫で。<b>7回</b>当てればはじける。":"Officer Serena's <b>Reflect Shield</b> bounces back lasers and blades from <b>the front</b>. Swing around to <b>her side or back with mirrors</b>, or use tank blasts and chain splashes. <b>7 hits</b> burst her.","ようこそ、鏡の回廊へ。わたしは幹部、セレナ":"Welcome to the Mirror Corridor. I am Officer Serena","わたしの盾は、正面からの攻撃を、ぜんぶはね返す。あなたの光も、ね":"My shield reflects every attack from the front. Your light too, of course","正面からが、だめなら……":"If the front won't work……","セレナさまの盾は、無敵なんだから〜！":"Lady Serena's shield is invincible~!","幹部セレナ、撃破！ 鏡の回廊のその先へ……":"Officer Serena defeated! Beyond the Mirror Corridor……","同じ色に光る輪は<b>ワープ床</b>。上で止まると、<b>もう一方へ飛ぶ</b>。柱にかこまれた部屋にも入れる。":"Rings glowing the same color are <b>warp pads</b>. Stop on one and you <b>fly to the other</b>. You can even get into rooms surrounded by pillars.","ここはワープの実験室〜！":"This is the Warp Lab~!","柱の部屋の中なら、だれも入ってこられないよ！":"Inside the pillar room, no one can get in!","……あの光る輪は、どこにつながっている？":"……Where do those glowing rings lead?","ワープで、部屋の中へ":"Into the room by warp","ワープ床にレーザーを撃つと、<b>もう一方のワープ床から、同じ向きに</b>出ていく。":"Fire a laser into a warp pad and it comes out <b>of the other warp pad in the same direction</b>.","柱のうしろで、ずらっと整列〜":"All lined up behind the pillars~","ワープを通ってくるなんて、むりむり〜":"Coming through the warp? No way, no way~","光なら、通れるかもしれない":"Light might be able to get through","ワープごしに、列をつらぬいた":"Pierced the row through the warp","飛んでくる警備係":"Flying Guards","ワープ床は、<b>戦闘員も使う</b>。奥の警備係が、急に目の前に飛んでくることも。ワープ床のそばに立つときは注意。":"<b>Minions use warp pads too</b>. A guard from the back might suddenly fly right in front of you. Be careful standing near a warp pad.","ワープを使えば、一瞬でヒーローのそばへ！":"With the warp, we're next to the Hero in a flash!","どこから出てくるか、わかるかな〜？":"Can you guess where we'll come out~?","出口のそばには、立たないほうがいいな":"I'd better not stand next to an exit","飛んできた子も、落ちついて":"Stay calm, even with ones flying in","ワープとタンク":"Warps and Tanks","柱のむこうのタンク。ワープの出口は、タンクと同じ列。<b>ワープごしのレーザー</b>でも、タンクは大爆発。":"A tank beyond the pillars. The warp exit is in the same row as the tank. Even with <b>a laser through the warp</b>, the tank explodes big.","タンク置き場は、柱のむこう〜":"The tank storage is past the pillars~","ワープの出口？ そっちは、だれもいないよ〜":"The warp exit? Nobody's over there~","出口の向きが、ちょうどいい":"The exit faces just the right way","ワープごしの大爆発！":"A big explosion through the warp!","ワープと鏡":"Warps and Mirrors","ワープで出たレーザーも、<b>鏡で曲がる</b>。右のワープ床へ撃てば……。":"A laser coming out of a warp <b>turns at mirrors</b> too. Shoot into the right warp pad and……","鏡とワープ、ぜんぶそろった部屋だよ〜":"It's a room with mirrors and warps, everything~","これだけあれば、まよっちゃうでしょ！":"With all this, you'll get lost!","組み合わせれば、とどく":"Combine them and it'll reach","ワープと鏡で、ねらいどおり":"Right on target with warps and mirrors","ワープの近道":"Warp Shortcut","沼をこえると、よごれる。<b>ワープなら、沼を飛びこえられる</b>。沼の中の作業員は、毎ターン満タン。":"Crossing the swamp gets you grimy. <b>With a warp, you can fly over the swamp</b>. Workers in the swamp are full every turn.","沼の中で、作業中〜":"Working in the swamp~","ここまで来るには、沼をわたらないとね〜":"To get here, you'd have to cross the swamp~","わたらなくても、飛べばいい":"No need to cross, I'll just fly","ワープで、沼をひとっ飛び":"One hop over the swamp by warp","ワープの迷路":"Warp Maze","ワープ床が4組。どれがどこにつながっているか、<b>同じ色</b>をよく見よう。柱にかこまれた2人を、レーザーで上から。":"Four pairs of warp pads. Look closely at <b>the same colors</b> to see which connects where. Hit the 2 boxed in by pillars with a laser from above.","ワープだらけの迷路だよ〜":"It's a maze full of warps~","どこにつながってるか、わたしたちも、わかんない〜":"Even we don't know where they lead~","色を見れば、わかるはずだ":"The colors should tell me","ワープの迷路、とけた":"Solved the warp maze","ワープと増援":"Warps and Reinforcements","四隅から増援。すみのワープ床を使われると、<b>すぐ目の前</b>に。ワープの出口のそばは、気をつけて。":"Reinforcements from the four corners. If they use the corner warp pads, they'll be <b>right in front of you</b>. Be careful near warp exits.","本部〜！ 実験室にヒーローが〜！":"HQ~! The Hero's in the lab~!","増援、ワープで行くね〜！":"Reinforcements, coming by warp~!","出口を見張っておこう":"I'll keep watch on the exits","ワープの増援も、まとめて":"The warp reinforcements too, all at once","二つの部屋":"Two Rooms","柱でかこまれた部屋の中に、満タンの塊。<b>右のワープ床</b>は、部屋の中につながっている。ワープで入って、満タンのうちに一撃。":"A full clump inside a room surrounded by pillars. <b>The right warp pad</b> leads into the room. Warp in and strike while they're full.","部屋の中で、満タンで待機中〜":"Waiting in the room, all full~","入り口なんて、ないもんね〜":"There's no entrance anyway~","入り口がなくても、ワープがある":"No entrance? There's a warp","部屋の中の塊、まとめて":"The clump in the room, all at once","幹部ハヤテ":"Officer Hayate","幹部ハヤテは<b>すばやい</b>：1つの番に<b>2回</b>動いて撃つ。ワープ床も使って飛びまわる。<b>7回</b>当てればはじける。タンクのそばに来たときがチャンス。":"Officer Hayate is <b>fast</b>: she moves and shoots <b>twice</b> per turn, and zips around using warp pads too. <b>7 hits</b> burst her. Your chance is when she comes near a tank.","おっそーい！ ここまで来るのに、何ターンかかってんの？":"Too slooow! How many turns did it take you to get here?","あたしはインク団の幹部、ハヤテ！ あたしの速さに、ついてこれる？":"I'm Hayate, Ink Corps Officer! Can you keep up with my speed?","速いだけなら、待ちぶせればいい":"If she's only fast, I'll ambush her","ハヤテさま、はやーい！":"Lady Hayate is so fast~!","幹部ハヤテ、撃破！ この下が、アジトのいちばん奥……":"Officer Hayate defeated! Below here is the very bottom of the hideout……","この通路だけ、ヒーローは<b>となりの戦闘員を全員まとめて、鉄柱へ放り投げる</b>。<b>投げ方</b>：ヒーローの<b>上下左右のとなり</b>（ななめはだめ）にいる子を押すと、メニューのいちばん上に「🪝 鉄柱へ」が出る。鉄柱は<b>ヒーローから4マス以内</b>のものだけ。攻撃1回ぶん（この面は、攻撃が1つの番に3回）。<b>よごれ55で撤退＝負け</b>なので、増援にかこまれる前に投げよう。<b>1本に12人</b>重なると、その柱がはじけ、<b>同じ列で6人以上</b>つながった柱も<b>連鎖</b>してはじける。先に何本か6人以上にしてから、1本を12人に！":"In this passage only, the Hero <b>grabs every adjacent minion at once and hurls them onto a steel pole</b>. <b>How to throw</b>: tap a minion <b>directly above, below, left or right of the Hero</b> (not diagonal) and \"🪝 To the pole\" appears at the top of the menu. Only poles <b>within 4 tiles of the Hero</b> count. It uses 1 attack (on this stage you get 3 attacks per turn). <b>Grime 55 means retreat = defeat</b>, so throw before reinforcements surround you. When <b>12 minions</b> pile on one pole, that pole bursts, and poles in <b>the same row with 6+</b> <b>chain</b> and burst too. Get a few poles to 6+ first, then bring one to 12!","ここから先は、首領さまの間！ ぜったいに通さないよ〜！":"Past here is the Boss's Hall! You're not getting through~!","みんな〜！ ありったけで、かかれ〜！":"Everyone~! Give it everything you've got~!","数が多いな……あの鉄柱、使えるか":"There are a lot of them…… could I use those steel poles?","鉄柱？ あんなの、ただの飾りだよ〜！":"Steel poles? Those are just decorations~!","通路は、とおらせてもらった。……そこで、しばらくおとなしくしていろ":"I'll be passing through. ……Stay put there for a while","最後の守り：タンクと鏡":"Last Defense: Tanks and Mirrors","首領の間の守り。柱のうしろのタンクは、<b>鏡で曲げたレーザー</b>で。近づく警備係にも気をつけて。":"The guard of the Boss's Hall. Hit the tank behind the pillar with <b>a laser bent by a mirror</b>. Watch out for approaching guards too.","ここから先は、首領さまのお部屋！":"Past here is the Boss's room!","今までの守り、ぜんぶ使っちゃうよ〜！":"We'll use every defense we've got~!","今までの戦い方、ぜんぶ使うまでだ":"Then I'll use every way of fighting I've learned","最後の守り、ひとつめ":"Last defense, number one","最後の守り：柱とワープ":"Last Defense: Pillars and Warps","柱の部屋の中へは、<b>ワープ床</b>で。警備係をかわしながら。":"Get into the pillar room with a <b>warp pad</b>, dodging the guards.","部屋の中は、首領さまの親衛隊！":"Inside the room is the Boss's Royal Guard!","ワープの出口？ 気づかないでね〜":"The warp exit? Please don't notice it~","もう、見なれた仕かけだ":"A gimmick I'm used to by now","最後の守り：沼とコンベア":"Last Defense: Swamp and Conveyors","作業員がコンベアで<b>沼の中</b>へ運ばれると、毎ターン満タン。くっついて満タンになったところを、まとめて。":"Workers carried by the conveyor <b>into the swamp</b> are full every turn. Get them all once they're touching and full.","沼の工場で、首領さまのインクを作ってるの〜":"We're making the Boss's ink in the swamp factory~","みんなで満タン、パワーアップ！":"Everyone full, power up!","満タンで、くっつくのを待とう":"Wait for them to be full and touching","沼の工場も、止めた":"Stopped the swamp factory too","最後の守り：救護係とタンク":"Last Defense: Medics and Tanks","救護係が治してしまう前に。<b>タンク</b>なら救護係ごと。柱のかげの救護係は、回りこんで。":"Before the medics heal them. A <b>tank</b> gets the medics too. For medics behind pillars, go around.","首領さまの前で、だれひとりはじけさせない！":"In front of the Boss, we won't let a single one burst!","けがは、すぐ治すからね〜":"We'll heal any injuries right away~","治される前に、まとめてだ":"Before they heal, all at once","救護係ごと、片づけた":"Cleared them out, medics and all","最後の守り：鏡とワープ":"Last Defense: Mirrors and Warps","ワープから出たレーザーは、鏡で曲がる。右のワープ床へ撃てば……。":"A laser out of a warp turns at mirrors. Shoot into the right warp pad and……","鏡とワープのお部屋、いらっしゃいませ〜":"Welcome to the room of mirrors and warps~","ここで、まよっちゃえ〜！":"Get lost in here~!","つなぎ方は、もう知っている":"I already know how to link them","ワープと鏡で、一発":"One shot with warp and mirror","最後の守り：沼の救護係":"Last Defense: Swamp Medics","沼の中で、みんな満タン。救護係もいる。<b>1ターン待って</b>、満タンになったら一撃。":"Everyone's full in the swamp. There are medics too. <b>Wait 1 turn</b>, and once they're full, strike.","沼のお医者さん、またまた登場〜":"The swamp doctors are back again~","待ってから、まとめてだ":"Wait, then all at once","沼の医務室、もう一度":"The swamp medic room, once more","最後の守り：コンベアと鏡":"Last Defense: Conveyors and Mirrors","壁のうしろの作業員が、はしのすき間へ運ばれてくる。鏡で曲げるか、すき間の真下から。":"Workers behind the wall get carried to the gap at the end. Bend the laser with a mirror, or shoot from straight below the gap.","壁のうしろで、首領さまのおやつを運んでま〜す":"Carrying the Boss's snacks behind the wall~","のぞいちゃ、だめ〜！":"No peeking~!","はしまで来たら、ねらえる":"Once they reach the end, I can aim","おやつの運び手も、片づけた":"Cleared out the snack carriers too","最後の守り：ワープとタンク":"Last Defense: Warps and Tanks","ワープの出口は、タンクと同じ列。<b>ワープごしのレーザー</b>で大爆発。":"The warp exit is in the same row as the tank. A big explosion with <b>a laser through the warp</b>.","首領さまのタンク置き場は、ぜったい守る！":"We'll protect the Boss's tank storage no matter what!","ワープの出口なんて、関係ないもんね〜":"The warp exit has nothing to do with it~","関係、大ありだ":"It has everything to do with it","ワープごしの大爆発、もう一度":"A big explosion through the warp, once more","首領の親衛隊":"The Boss's Royal Guard","親衛隊長":"Guard Captain","首領の親衛隊。隊長は<b>4回</b>当てないとはじけない。救護係・タンク・鏡、ぜんぶ使って。":"The Boss's Royal Guard. The captain takes <b>4 hits</b> to burst. Use everything: medics, tanks, mirrors.","ここが最後の守り。首領さまには、指一本ふれさせない！":"This is the last defense. We won't let you lay a finger on the Boss!","親衛隊、全員そろってるよ〜！":"The Royal Guard is all here~!","この先に、首領がいるのか":"So the Boss is past here","親衛隊、突破！ 次は……首領の間だ":"Royal Guard broken through! Next is…… the Boss's Hall","首領ノワールは、<b>部下が1人でも残っているあいだは、守られていて攻撃が効かない</b>。部下を全員はじけさせると……。覚醒したら、<b>2ターンに1回のインクストーム</b>は<b>柱のかげ</b>で防げる。覚醒したら体力8。":"<b>While even one of her minions remains, Boss Noir is protected and attacks don't work</b>. Burst all her minions and then……. Once she awakens, <b>the ink storm every 2 turns</b> can be blocked <b>behind pillars</b>. Awakened, she has 8 HP.","よ、ようこそなのじゃ！ わらわは、インク団首領……ノワールなのじゃ！":"W-welcome, I say! I am the Chief of the Ink Corps…… Noir, I say!","……ちいさい":"……Tiny","ち、ちいさいとか言うでないっ！ みんな、わらわを守るのじゃ〜！":"D-don't you call me tiny! Everyone, protect me, I say~!","はーい！ 首領さまは、わたしたちが守ります！":"Okaaay! We'll protect you, Boss!","インク団首領ノワール、撃破！ アジト、完全制圧！":"Ink Corps Boss Noir defeated! The hideout is fully conquered!","オープニング":"Opening","インクの町のはずれ。地下ふかくに、インク団のアジトがある。":"On the edge of Ink Town, deep underground, lies the Ink Corps hideout.","アジトのいちばん奥にすむのは、首領ノワール。ふしぎなインクを作れる女の子。":"Living at the very back of the hideout is Boss Noir, a girl who can make mysterious ink.","ずっとひとりぼっちだったノワールは、インクから友だちを作った。それが、インク団の戦闘員たち。":"Noir had always been all alone, so she made friends out of ink. They became the minions of the Ink Corps.","戦闘員たちは、町の子とも遊ぶようになった。「いっしょに、インク団にならない？」――「いいよ」と答えた子は、インクをあびて、仲間になった。":"The minions started playing with the town's kids too. \"Want to join the Ink Corps with us?\" Those who answered \"Sure\" got splashed with ink and joined the gang.","友だちが入ったからと、自分から「わたしも入れて」と来た子もいる。":"Some even came on their own, saying \"Let me in too,\" because their friends had joined.","首領さま〜！ 今日のおやつです！":"Boss~! Here's today's snack!","うむ、ごくろうなのじゃ！ ……でも、まだまだ足りないのじゃ":"Mm, good work, I say! ……But it's still not enough, I say","おやつが、ですか？":"The snacks?","友だちが、なのじゃ！ もっと、もーっと、たくさんほしいのじゃ！":"Friends, I say! I want more, more, sooo many more, I say!","そこで、大作戦なのじゃ！ 町じゅうにインクの雨をふらせて、町の人を、みんなインクの仲間にするのじゃ！":"So, it's time for a grand plan, I say! We'll make ink rain fall all over town and make everyone in town our ink friends, I say!","さすが首領さま〜！":"That's our Boss~!","その大作戦のうわさは、町を守るヒーローの耳にも、とどいていた。":"Word of that grand plan reached the ears of the Hero who protects the town.","町じゅうをインクに……そんなこと、させるわけにはいかない":"Turning the whole town into ink…… I can't let that happen","待っていろ、インク団。……いくぞ！":"Wait for me, Ink Corps. ……Here I come!","再生の部屋":"Regeneration Room","最後の守りをすすむヒーローは、ふしぎな部屋に出た。":"Pushing through the last defenses, the Hero came out into a strange room.","……なんだ、この部屋は":"……What is this room?","円柱のカプセルが、奥までびっしり。うすく光る液の中に、戦闘員たちがふわりと浮かんでいる。":"Cylindrical capsules packed all the way to the back. In the faintly glowing liquid, minions float gently.","さっきはじけた子たちが……みんな、ここで元にもどっているのか":"The ones who burst earlier…… are they all being restored here?","再生中：347体 首領さまの手作りインクで、ひとりずつ":"Regenerating: 347 With the Boss's handmade ink, one by one","ひとりずつ……全部、首領が作ったのか":"One by one…… the Boss made all of them?","むにゃ……首領さま……つぎは、かつから……":"Mumble…… Boss…… next, the pork cutlet……","……ひっ！ ヒ、ヒーロー！？ う、動けない……！":"……Eek! H-H-Hero!? I-I can't move……!","やだやだ、いま来ないで〜！":"No no, don't come now~!","……寝てろ。動けない相手と戦う気はない":"……Go back to sleep. I have no intention of fighting someone who can't move","……わたし、もとは町の子なんだよ。ヒーローは、知らないでしょ":"……I was a town kid originally, you know. I bet you didn't know that, Hero","みんなと遊んでて、「仲間にならない？」って聞かれて……自分で「いいよ」って言ったの":"I was playing with everyone, and they asked \"Want to join?\"…… and I said \"Sure\" myself","……自分で、選んだのか":"……You chose it yourself?","うそだ〜！ 固定砲台部隊のときは、えんりょなく撃ってたくせに〜！":"Liar~! At the Fixed Cannon Squad, you shot us without holding back~!","わたしなんか、柱に投げられたんですけど〜！":"I got thrown onto a pole, you know~!","……あれは、撃ってきたからだ。……柱は、その……作戦だ":"……That was because you shot at me. ……The pole was, um…… strategy","……にげた":"……She ran","にげたね":"She ran","……でも、ヒーローって、もっとこわい人だと思ってた":"……But I thought the Hero would be a scarier person","エンディング":"Ending","首領の間のおくは、あの再生の部屋につながっていた。":"Beyond the Boss's Hall, it connected to that Regeneration Room.","うっ……ぐすっ……わらわの、負けなのじゃ……":"Ugh…… sniff…… I lose, I say……","わらわは……友だちが、ほしかっただけなのじゃ……":"I…… I only wanted friends, I say……","……そなた、この部屋の子たちに、手を出さなかったそうじゃな。どうしてなのじゃ……？":"……I hear you didn't lay a hand on the girls in this room. Why, I say……?","動けない相手と、戦う気はない。……それに":"I have no intention of fighting someone who can't move. ……And besides","友だちは、むりやりインクをかけて作るものじゃない":"Friends aren't something you make by forcing ink on people","……でも、ほら。もう、いるじゃないか":"……But look. You already have them, don't you?","再生完了":"Regeneration complete","首領さま〜！":"Boss~!","首領さま、だいじょうぶですか！？":"Boss, are you okay!?","負けちゃっても、わたしたちがいます〜！":"Even if you lost, you've got us~!","みんな……みんな〜！ うわぁぁん！":"Everyone…… everyone~! Waaah!","それにね、ヒーロー。わたしは「いいよ」って言ったよ？":"And you know, Hero, I said \"Sure,\" right?","わたしなんか、自分から「入れて」って言ったもん！":"I even said \"Let me in\" myself!","……ああ。聞いて、答えてもらったなら、それでいい":"……Yeah. If you asked and got an answer, that's fine","でも、インクの雨は、だれにも聞かない":"But ink rain doesn't ask anyone","……雨だと、ひとりずつ聞けないのじゃな":"……With rain, I can't ask them one by one, I say","……わかったのじゃ。インクの雨の大作戦は、やめるのじゃ":"……All right, I say. I'll call off the Ink Rain Plan, I say","わらわには、もう……こんなに、友だちがいたのじゃな":"I already had…… this many friends, I say","はい！ ずっと前から、です！":"Yes! Since long, long ago!","町の人と友だちになりたいなら、遊びに来て、ひとりずつ聞けばいい":"If you want to be friends with the townspeople, come play, and ask them one at a time","ほ、ほんとうか！？ ……では、ヒーロー。そなたも、わらわの友だちに……":"R-really!? ……Then, Hero. Will you be my friend too……","スライムにしないなら、な":"As long as you don't turn me into a slime","し、しないのじゃ！ ……たぶん":"I-I won't, I say! ……Probably","たぶん！？":"Probably!?","……というか、そなた。もう、なりかけておるのじゃ":"……Or rather, you. You're already halfway there, I say","……え？":"……Huh?","ほんとだ！ ほっぺ、青いよ〜！":"It's true! Your cheeks are blue~!","何百人もはじけさせて、そのインクをずっとあびておったからの。体の芯まで、しみこんでおるのじゃ":"You burst hundreds of us, and kept getting splashed with all that ink. It's soaked into you right to the core, I say","おそろいだ〜！":"We match~!","……変身をとけば、もどる。……たぶん":"……It'll go back when I undo the transformation. ……Probably","こうして、インクの雨の大作戦は中止になった。":"And so, the Ink Rain Plan was called off.","インク団は、今日もアジトでにぎやかにくらしている。ときどき、ヒーローとのインク合戦をたのしみながら。":"The Ink Corps still lives lively in the hideout today, sometimes enjoying ink battles with the Hero.","―― おしまい ――":"―― The End ――","鉄柱":"Steel pole","班長":"Squad Leader","鉄柱に{0}人つなぐ":"Put {0} on steel poles","鉄柱の{0}連鎖":"{0}-pole chain","{0}ターン以内にクリア":"Clear within {0} turn{0|s}","よごれ{0}以下でクリア":"Clear with {0} grime or less","よごれ0でクリア":"Clear with 0 grime","1回の攻撃で{0}人はじけさせる":"Burst {0} in one attack","わざを使わずにクリア":"Clear without specials","レーザーは、":"A laser turns","鏡から鏡へ":"from mirror to mirror","何回でも曲がる（全部で10マスまで）。まっすぐ上の鏡から右の鏡へ……柱にはさまれた列にとどくかな。":"any number of times (up to 10 tiles in all). From the mirror straight up to the mirror on the right…… will it reach the row boxed in by pillars?","警備係が近づいてくる。":"Guards are approaching.","鏡の前に立つと":"Stand in front of the mirror","、奥の塊もねらえる。どちらを先にするか。":"and you can hit the clump at the back too. Which one first?","コンベアの作業員は、柱の壁のうしろ。壁のはしの":"The conveyor workers are behind a wall of pillars. When they're carried to the","すき間":"gap","まで運ばれてきたところを、右の鏡で曲げたレーザーか、すき間の真下から。":"at the end of the wall, hit them with a laser bent by the right mirror, or from straight below the gap.","沼の中の作業員は、毎ターン満タン。柱の向こうは、":"Workers in the swamp are full every turn. Past the pillars,","鏡で曲げて":"bend it with a mirror","。鏡まで行く道は、沼をよけて。":". On the way to the mirror, avoid the swamp.","幹部セレナの":"Officer Serena's","は、":"bounces back lasers and blades from","正面":"the front","からのレーザー・ブレードをはね返す。":". Swing around to","鏡で横やうしろ":"her side or back with mirrors","に回すか、タンクの爆発・連鎖の飛沫で。":", or use tank blasts and chain splashes.","7回":"7 hits","当てればはじける。":"burst her.","。上で止まると、":". Stop on one and you","。柱にかこまれた部屋にも入れる。":". You can even get into rooms surrounded by pillars.","ワープ床にレーザーを撃つと、":"Fire a laser into a warp pad and it comes out","もう一方のワープ床から、同じ向きに":"of the other warp pad in the same direction","出ていく。":".","ワープ床は、":"","戦闘員も使う":"Minions use warp pads too","。奥の警備係が、急に目の前に飛んでくることも。ワープ床のそばに立つときは注意。":". A guard from the back might suddenly fly right in front of you. Be careful standing near a warp pad.","柱のむこうのタンク。ワープの出口は、タンクと同じ列。":"A tank beyond the pillars. The warp exit is in the same row as the tank. Even with","ワープごしのレーザー":"a laser through the warp","でも、タンクは大爆発。":", the tank explodes big.","ワープで出たレーザーも、":"A laser coming out of a warp","鏡で曲がる":"turns at mirrors","。右のワープ床へ撃てば……。":"too. Shoot into the right warp pad and……","沼をこえると、よごれる。":"Crossing the swamp gets you grimy.","ワープなら、沼を飛びこえられる":"With a warp, you can fly over the swamp","。沼の中の作業員は、毎ターン満タン。":". Workers in the swamp are full every turn.","ワープ床が4組。どれがどこにつながっているか、":"Four pairs of warp pads. Look closely at","同じ色":"the same colors","をよく見よう。柱にかこまれた2人を、レーザーで上から。":"to see which connects where. Hit the 2 boxed in by pillars with a laser from above.","四隅から増援。すみのワープ床を使われると、":"Reinforcements from the four corners. If they use the corner warp pads, they'll be","すぐ目の前":"right in front of you","に。ワープの出口のそばは、気をつけて。":". Be careful near warp exits.","柱でかこまれた部屋の中に、満タンの塊。":"A full clump inside a room surrounded by pillars.","右のワープ床":"The right warp pad","は、部屋の中につながっている。ワープで入って、満タンのうちに一撃。":"leads into the room. Warp in and strike while they're full.","幹部ハヤテは":"Officer Hayate is","：1つの番に":": she moves and shoots","2回":"twice","動いて撃つ。ワープ床も使って飛びまわる。":"per turn, and zips around using warp pads too.","当てればはじける。タンクのそばに来たときがチャンス。":"burst her. Your chance is when she comes near a tank.","この通路だけ、ヒーローは":"In this passage only, the Hero","となりの戦闘員を全員まとめて、鉄柱へ放り投げる":"grabs every adjacent minion at once and hurls them onto a steel pole","投げ方":"How to throw","：ヒーローの":": tap a minion","上下左右のとなり":"directly above, below, left or right of the Hero","（ななめはだめ）にいる子を押すと、メニューのいちばん上に「🪝 鉄柱へ」が出る。鉄柱は":"(not diagonal) and \"🪝 To the pole\" appears at the top of the menu. Only poles","ヒーローから4マス以内":"within 4 tiles of the Hero","のものだけ。攻撃1回ぶん（この面は、攻撃が1つの番に3回）。":"count. It uses 1 attack (on this stage you get 3 attacks per turn).","よごれ55で撤退＝負け":"Grime 55 means retreat = defeat","なので、増援にかこまれる前に投げよう。":", so throw before reinforcements surround you. When","1本に12人":"12 minions","重なると、その柱がはじけ、":"pile on one pole, that pole bursts, and poles in","同じ列で6人以上":"the same row with 6+","つながった柱も":"","してはじける。先に何本か6人以上にしてから、1本を12人に！":"and burst too. Get a few poles to 6+ first, then bring one to 12!","首領の間の守り。柱のうしろのタンクは、":"The guard of the Boss's Hall. Hit the tank behind the pillar with","で。近づく警備係にも気をつけて。":". Watch out for approaching guards too.","柱の部屋の中へは、":"Get into the pillar room with a","で。警備係をかわしながら。":", dodging the guards.","作業員がコンベアで":"Workers carried by the conveyor","沼の中":"into the swamp","へ運ばれると、毎ターン満タン。くっついて満タンになったところを、まとめて。":"are full every turn. Get them all once they're touching and full.","救護係が治してしまう前に。":"Before the medics heal them. A","タンク":"tank","なら救護係ごと。柱のかげの救護係は、回りこんで。":"gets the medics too. For medics behind pillars, go around.","沼の中で、みんな満タン。救護係もいる。":"Everyone's full in the swamp. There are medics too.","、満タンになったら一撃。":", and once they're full, strike.","ワープの出口は、タンクと同じ列。":"The warp exit is in the same row as the tank. A big explosion with","で大爆発。":".","首領の親衛隊。隊長は":"The Boss's Royal Guard. The captain takes","4回":"4 hits","当てないとはじけない。救護係・タンク・鏡、ぜんぶ使って。":"to burst. Use everything: medics, tanks, mirrors.","首領ノワールは、":"","部下が1人でも残っているあいだは、守られていて攻撃が効かない":"While even one of her minions remains, Boss Noir is protected and attacks don't work","。部下を全員はじけさせると……。覚醒したら、":". Burst all her minions and then……. Once she awakens,","2ターンに1回のインクストーム":"the ink storm every 2 turns","は":"can be blocked","柱のかげ":"behind pillars","で防げる。覚醒したら体力8。":". Awakened, she has 8 HP.","えへへ、当たれ！":"Hehe, take this!","ふふ、くらって！":"Fufu, eat this!","そこ、くらいなさい！":"You there, take that!","絶対、当てる！":"I'll hit you for sure!","こら、動くな！":"Hey, hold still!","やった、出せた！":"Yay, it came out!","インクまみれにしてやる！":"I'll cover you in ink!","ジャンプ噴射、いくよ！":"Jump jet, here I go!","上からいくよー！":"Coming from above~!","とびまーす！":"I'm jumpiiing!","まとめて、はじけて！":"Burst, all of you!","当たった！":"Hit!","やった、命中！":"Yay, a direct hit!","よし、よごれた！":"All right, she's grimy!","もう一発！":"One more!","かわされた！？":"She dodged!?","今の、よけられた！":"She dodged that!","えっ、届いてない！？":"Huh, it didn't reach!?","うそ、そらされた！":"No way, she deflected it!","えっ、今の、わたし！？":"Huh, was that at me!?","きゃっ！？ なんで！？":"Eek!? Why!?","うそ、わたしに！？":"No way, at me!?","え？ わたしを盾に？ ひどい！":"Huh? Using me as a shield? That's mean!","わたしを盾にしないで！":"Don't use me as a shield!","盾なんて聞いてない！":"Nobody said anything about shields!","やだ、わたしが受けちゃう！":"No, I'm gonna take the hit!","えっ、つかまれた！？":"Huh, she grabbed me!?","投げないで！":"Don't throw me!","きゃあ、手を離して！":"Eek, let go of me!","わたし、飛ぶ！？":"Am I flying!?","ひゃっ、重い！":"Eep, heavy!","誰かぶつかってきた！":"Somebody bumped into me!","うわっ、当たった！":"Whoa, it hit me!","タンク同士、ぶつかった！":"Our tanks bumped together!","タンクにひびが……！":"My tank's cracked……!","インクがもれてる……":"Ink's leaking……","次ではじけちゃうかも":"Next one might burst me","うう、まだ撃てる":"Ugh, I can still shoot","いつはじけちゃうの……":"When am I gonna burst……","はじけちゃったー！":"I burst~!","インクまみれー！":"All covered in ink~!","はじけちゃうー！":"I'm gonna burst~!","うわあああん！":"Waaahhh!","われちゃううう！":"I'm gonna pop~!","ひゃああああ！":"Hyaaaah!","みんな、離れて！":"Everyone, get away!","巻き込んじゃうよ！":"You'll get caught in it!","近くにいないで！":"Don't stand near me!","連鎖しちゃうー！":"It's gonna chain~!","よーく、ねらって……":"Aim carefully……","ねらいを定めて……":"Lining up the shot……","じっとしててね……":"Hold still for me……","動かないで……":"Don't move……","そこ……！":"There……!","ここからなら、とどく……":"From here, I can reach……","いくよー！":"Here I go~!","えいっ！":"Hyah!","それーっ！":"Take thaaat!","くらえー！":"Eat this~!","発射ー！":"Fire~!","スライムインク、いっけー！":"Slime ink, gooo!","ツインキャノン、発射！":"Twin Cannon, fire!","ダブルでいくよー！":"Double shot~!","どーん！":"Boom!","え！？":"Huh!?","あっ！":"Ah!","ひゃっ！？":"Eep!?","えっ！？":"Wha!?","わっ！？":"Whoa!?","あれっ！？":"Huh!?","うわああっ！":"Waaah!","きゃああっ！":"Kyaaah!","やあああん！":"Nooo!","ひゃああっ！":"Hyaaah!","うそおおっ！":"No waaay!","キャノンが、ふくらんで……！？":"My cannon's swelling up……!?","やだ、キャノンが！ とまってー！":"No, my cannon! Stoooop!","キャノンが、パンパンに……！":"My cannon's packed tight……!","ホースが、ふくらんでく……！":"My hose is swelling up……!","え、ホースが……！？ だめだめ！":"Huh, my hose……!? No no!","ホースが、パンパン……！":"My hose is packed tight……!","お腹のタンクが……ふくらんでる！？":"My belly tank…… is swelling!?","タンクが、ふくらんで……やだぁ！":"My tank's swelling up…… nooo!","タンクが、パンパンに……！":"My tank's packed tight……!","キャノンが、なくなっちゃった……！":"My cannon's gone……!","わたしのキャノンがー！":"My cannon~!","もう、キャノンで撃てないよ……！":"I can't shoot my cannon anymore……!","ホースが、はじけちゃった……！":"My hose burst……!","ホースがー！ もう撃てない……！":"My hose~! I can't shoot anymore……!","わたしのホースー！":"My hooose!","タンクが、はじけちゃった……！":"My tank burst……!","お腹のタンクがー！":"My belly tank~!","タンクが、なくなっちゃった……！":"My tank's gone……!","インクが、もれてる……！":"Ink's leaking……!","タンクに、ひびが……！":"My tank's cracked……!","は、はじけちゃいそう……！":"I-I'm gonna burst……!","まだ……まだ撃てるもん……！":"I can still…… I can still shoot……!","あぶない、あぶない……！":"Close call, close call……!","だめ、はじけちゃうー！":"No, I'm gonna burst~!","もう、もたないー！":"I can't hold it anymore~!","いやああ、ふくらむー！":"Nooo, I'm swelling~!","ああっ、あふれちゃうー！":"Aah, it's gonna overflow~!","あ……足に、力が……入らない……":"M-my legs…… have no…… strength……","もう、立てない……":"I can't stand anymore……","ぺたん……動けないよぉ……":"Plop…… I can't move……","だれか……たすけて……":"Somebody…… help……","〇ちゃーん！":"〇~!","〇ちゃん！？":"〇!?","いやっ、〇ちゃん！":"No, 〇!","〇ちゃん、こっち！":"〇, over here!","〇ちゃん、手をつないで……！":"〇, hold my hand……!","〇ちゃーん、いっしょに……！":"〇~, together……!","〇ちゃん、またあとでね……！":"〇, see you later……!","〇ちゃーーん！":"〇~~!","〇ちゃん、はなれないで……！":"〇, don't let go……!","〇ちゃん、にげてー！":"〇, run~!","〇ちゃん、ごめーん！":"〇, sorryyy!","あっ、〇ちゃん、近い……！":"Ah, 〇, too close……!","〇ちゃん、はなれて……！":"〇, get away……!","〇ちゃーん！？":"〇~!?","〇ちゃん、なんでー！？":"〇, whyyy!?","えっ、〇ちゃん！？":"Huh, 〇!?","〇ちゃんの、インクが……！":"〇's ink……!","あっ……！":"Ah……!","ひゃっ！":"Eep!","やっ……！":"No……!","ああっ！":"Aah!","いや、いやっ……！":"No, no……!","だめだめだめ……！":"No no no……!","とまって、とまってー！":"Stop, stoooop!","やだ、やだぁ……！":"No, nooo……!","ちょ、ちょっと待って……！":"W-wait a sec……!","ふくらんじゃう、ふくらんじゃうー！":"I'm swelling, I'm swelling~!","おさえられないよぉ……！":"I can't hold it in……!","タンクが、あつい……あついー！":"My tank's hot…… so hot~!","ぷるぷるが、とまらない……！":"The jiggling won't stop……!","あふれる、あふれちゃう……！":"Overflowing, it's overflowing……!","もう、だめえええっ！":"I can't take it anymooore!","はじけちゃうーーっ！":"I'm gonna buuurst!","あああああーっ！":"Aaaaaah!","いやああああんっ！":"Nooooo!","きゃあああーっ！":"Kyaaaah!","セーフ！ 飛沫、とどかなかった！":"Safe! The splash didn't reach!","ふう……あぶなかった！":"Phew…… that was close!","空の上なら、へっちゃら！":"Up in the air, I'm fine!","よけきれたー！":"Dodged it~!","もう……げんかい……！":"I'm…… at my limit……!","あ、あ……もれちゃう……！":"Ah, ah…… it's leaking……!","がまん、できない……！":"I can't hold it……!","悪いけど、盾になってもらう！":"Sorry, but you're my shield!","ちょっと借りるよ！":"Borrowing you for a sec!","こっちへ！":"Over here!","くっ……！":"Ngh……!","つめたっ……！":"Cold……!","まだまだ！":"Not yet!","しみてくる……！":"It's soaking in……!","あ……あ……！":"Ah…… ah……!","かかっちゃった……！":"It got on me……!","ふくらむぅ……！":"I'm swelling……!","だめ、あふれちゃう……！":"No, it's gonna overflow……!","ひっ……！":"Eek……!","う、うそ……！":"N-no way……!","タンクが……熱い……！":"My tank's…… hot……!","ひゃっ、かすった！":"Eep, it grazed me!","あぶなっ！":"Close one!","ちょっと、こっち撃たないで！":"Hey, don't shoot this way!","いまの、わたしの横！":"That was right next to me!","ご、ごめーん！":"S-sorryyy!","あっ、ちがうの！":"Ah, that's not it!","そっちじゃないのにー！":"I wasn't aiming there~!","わざとじゃないよ！":"I didn't mean to!","ここに撃って！ 自爆するから！":"Shoot here! I'll self-destruct!","撃って、ヒーローに浴びせて！":"Shoot me, splash it on the Hero!","わたしを使って！":"Use me!","きたっ、これで浴びせる！":"Here it comes, now I'll splash her!","あっ、入った……はじけるっ！":"Ah, it's in…… I'm gonna burst!","ねばねばインク、いけ！":"Sticky ink, go!","黄色くしてやる！":"I'll turn you yellow!","動き、止めて！":"Stop her moving!","インク、満タンになっちゃった":"My ink filled all the way up","もう少しで溢れちゃう":"It's about to overflow","撃たないと、溢れちゃう":"If I don't shoot, it'll overflow","撤退、始めた！":"She's started retreating!","逃げ始めたよ！":"She's running away!","今だ、追って！":"Now, chase her!","端まで追うよ！":"We'll chase her to the edge!","スーツ、崩れてる！":"Her suit's breaking down!","変身、解けた！":"Her transformation's undone!","倒せる、今！":"We can beat her, now!","追いつめてる！":"We've got her cornered!","減ってきちゃった……":"There's fewer of us……","みんな、大丈夫？":"Everyone, are you okay?","このままだと、やばいかも":"At this rate, this might be bad","固まらないで、ばらけて！":"Don't bunch up, spread out!","人数、少なくなってるよ":"Our numbers are dropping","もう、ほとんどいない……":"There's almost no one left……","わたしだけにしないで":"Don't leave me all alone","頼むから、生き残って":"Please, survive","ああ……みんな、どこー！":"Ah…… everyone, where are you~!","大勝利ー！":"Big victory~!","やったー！ インク団の勝ち！":"Yaaay! The Ink Corps wins!","またスライムの仲間が増えたね！":"Another slime friend joins us!","今だよ！ スライムインク、ぜんぶかけちゃえ！":"Now! Pour all the slime ink on her!","みんな、いっせいに！":"Everyone, all together!","これで、わたしたちの仲間だよ！":"Now you're one of us!","……か、体が……ぷるぷるする……！？":"……M-my body…… is jiggling……!?","うそ……わたし……スライムに……！？":"No way…… I'm…… becoming a slime……!?","……えへへ。インク団、よろしくね♪":"……Hehe. Nice to meet you, Ink Corps♪","なんだか……ぷるぷるして、楽しいかも！":"Somehow…… being jiggly might be fun!","わたしも、今日からインク団！":"From today, I'm Ink Corps too!","ようこそ、インク団へ！":"Welcome to the Ink Corps!","なかまが増えたー！":"A new friend~!","おそろいだね！":"We match!","これからは、いっしょだよ！":"From now on, we're together!","そこで、おとなしくしていろ！":"Stay put there!","とんでいけ！":"Fly!","次！":"Next!","ブレード！":"Blade!","はあっ！":"Haah!","斬る！":"Slash!","レーザーガン！":"Laser gun!","そこだ！":"There!","撃ち抜く！":"Pierce!","薙ぎ払い！":"Sweep!","まとめて来い！":"Come at me all at once!","ハレー彗星！":"Halley's Comet!","レーザーブレイク！":"Laser Break!","ホーミングミサイル！":"Homing missiles!","そっちへ飛んでけ！":"Fly over there!","ここまでだ！":"This is the end!","体が、重い！":"My body's heavy!","ねばねばする……！":"It's sticky……!","スーツにスライムが……しみてくる……！ 撤退する！":"Slime is…… soaking into my suit……! Retreating!","スーツが、とけていく……！":"My suit is melting away……!","変身が、解けた……！ 肌まで、青く……！":"My transformation's undone……! Even my skin's turning blue……!","もう……立てない……":"I…… can't stand anymore……","これで、全員だ！":"That's all of them!","街の平和は守った！":"The town's peace is safe!","えっ、タンクが……！？":"Huh, the tank……!?","タンクが、ぶるぶるしてる……！":"The tank's shaking……!","やだ、タンクがふくらんでる……！":"No, the tank's swelling……!","そのタンク、撃っちゃだめー！":"Don't shoot that tank~!","となりのタンクにも、うつった……！？":"It spread to the next tank too……!?","タンクが、つぎつぎ……！":"The tanks, one after another……!","きゃー！ こっちのタンクもー！":"Kyaa! This tank too~!","しまった、近すぎた……！":"Damn, too close……!","くっ、爆発に巻きこまれる……！":"Ngh, I'm getting caught in the blast……!","ヒーローのそばのタンク、ねらうよ……！":"I'll aim at the tank next to the Hero……!","あのタンクを撃てば……！":"If I shoot that tank……!","タンクごと、どかーんだよ！":"Ka-boom, tank and all!","いったぁ……！ でも、まだまだ！":"Owww……! But I'm not done yet!","ふふん、そのくらいじゃ、はじけないよ！":"Hmph, that's not enough to burst me!","班長のタンクは、大きいんだから！":"A Squad Leader's tank is big, you know!","う……タンクが、ふくらんできた……":"Ugh…… my tank's swelling up……","ちょ、ちょっと、きつくなってきたかも……":"I-it might be getting tight……","まだ……まだ、がんばれる……！":"I can still…… still keep going……!","そんな……班長のわたしが……！":"No way…… me, a Squad Leader……!","もう、もたない……！":"I can't hold on……!","みんなが、どんどんはじけてく……！ こっちに近づいてくるー！":"Everyone's bursting one after another……! It's coming this way~!","いやあ！ 破裂が、近づいてくるー！":"Nooo! The bursting is getting closer~!","に、にげられない……！ 手も足も、うごかないよぉ！":"I-I can't get away……! My arms and legs won't move!","つぎ、となり……！ そのつぎ、わたし……！？":"Next, the girl beside me……! And then, me……!?","いやいやいや、こないでー！":"No no no, don't come~!","はずして〜！ この留め具、はずしてー！":"Unhook me~! Unhook these clasps~!","まって、まって、まってー！":"Wait, wait, waaait!","もう、となりの子まで来てる……！":"It's already reached the girl next to me……!","やだやだ、順番がまわってくるー！":"No no, my turn's coming~!","だれか〜！ たすけてー！":"Somebody~! Help me~!","きゃあっ、はなしてー！":"Kyaa, let go~!","わ、わたし、とぶの！？":"W-wait, am I flying!?","うそっ、ささった〜！？":"No way, I'm stuck on it~!?","ホースとタンクが、ぬけない〜！":"My hose and tank won't come off~!","うごけな〜い！":"I can't moooove!","ちょ、上から来ないで〜！":"H-hey, don't come down from above~!","おもい〜！ つぶれる〜！":"Heavy~! I'm getting squished~!","きゃっ、だれか落ちてきた〜！":"Eek, somebody fell on me~!","わたしがはじけたら、みんなが……！ がまん……！":"If I burst, everyone will……! Hold it in……!","上からインクが、たれてくる……ふくらむ……でも、がまん！":"Ink's dripping from above…… I'm swelling…… but I'll hold it in!","みんな、がんばって……！ わたしも、たえる……！":"Everyone, hang in there……! I'll hold out too……!","ここで、はじけるわけには……いかないの……！":"I can't…… burst here……!","となりの柱から、インクが……！ みんな、ごめーん！":"Ink from the next pole……! Everyone, sorryyy!","えっ、こっちの柱まで……！？ もう、むりーっ！":"Huh, even this pole……!? I can't anymooore!","インクが、とんできた〜！ がまん、できな〜い！":"Ink's flying over~! I can't hold iiit!","……ごめん！ もう、げんかい……！":"……Sorry! I'm at my limit……!","みんな、ごめーん！ もう、むりーっ！":"Everyone, sorryyy! I can't anymooore!","えっ、うそ、まって……！":"Huh, no way, wait……!","となりが……！ わたしも、もう……！":"The one next to me……! I'm already……!","いやああ、みんな〜！":"Nooo, everyone~!","がまんしてたのに〜！":"And I was holding it in~!","つぎ、わたし……！？ いやあ〜！":"Next is me……!? Nooo~!","もれちゃう……でも、がまん……！":"It's leaking…… but I'll hold it in……!","だれか〜、ぬいて〜……":"Somebody~, pull me off~……","う、うごけないよぉ……":"I-I can't move……","インク、もれてる……はじけちゃいそう……でも、まだ……！":"Ink's leaking…… I'm about to burst…… but not yet……!","ふふ、正面からじゃ、効かないわ":"Fufu, that won't work from the front","その光、はね返してあげる":"I'll reflect that light right back","わたしの盾は、無敵よ":"My shield is invincible","はね返された……！":"It bounced back……!","正面からは、だめか……！":"So the front won't work……!","いま治すよ〜！":"I'll heal you now~!","いたいのいたいの、とんでけ〜！":"Pain, pain, fly away~!","じっとしててね〜、すぐ治るから！":"Hold still~, you'll be better in no time!","なおった〜！ ありがとう！":"All better~! Thank you!","わあ、元どおり！":"Wow, good as new!","もう一回、がんばれる！":"I can try again!","みんな、わたしのそばに……治してあげる":"Everyone, come close to me…… I'll heal you","けがは、ぜんぶわたしが引き受けるわ":"I'll take on every injury myself","だいじょうぶ、まだはじけさせない":"It's all right, I won't let you burst yet","い、いたくないのじゃ！ ぜんぜん、いたくないのじゃ！":"I-it doesn't hurt, I say! It doesn't hurt at all, I say!","ひゃっ！ ……ふ、ふん、効かぬのじゃ！":"Eek! ……H-hmph, that doesn't work on me, I say!","わらわに手を出すとは、ぶれいものなのじゃ！":"Laying a hand on me? How rude, I say!","首領さまは、わたしたちが守る！":"We'll protect the Boss!","首領さまに、さわらないで！":"Don't touch the Boss!","だいじょうぶです、首領さま！":"It's all right, Boss!","みんなの想い……受け取ったのじゃ！":"Everyone's feelings…… I have received them, I say!","みんな……ゆるさぬのじゃ……！ わらわが、首領なのじゃ！":"Everyone…… I won't forgive you, I say……! I am the Boss, I say!","インクの雨じゃ！ ふりそそぐのじゃ！":"Ink rain, I say! Pour down, I say!","これが首領の力なのじゃ！":"This is the Boss's power, I say!","柱のかげなら、だいじょうぶ……！":"Behind the pillar, I'm safe……!","あぶない、かくれててよかった！":"Close one, glad I hid!","うわっ、インクの雨……！":"Whoa, ink rain……!","よけきれない……！":"I can't dodge it all……!","い、いたいのじゃ……でも、まけぬのじゃ！":"I-it hurts, I say…… but I won't lose, I say!","ふん、まだまだなのじゃ！":"Hmph, I'm not done yet, I say!","う、うう……タンクが、ぱんぱんなのじゃ……":"Ugh, ugh…… my tank is packed full, I say……","み、みんなの分まで……がんばるのじゃ……！":"F-for everyone's sake…… I'll do my best, I say……!","み、みんな……ごめんなのじゃ〜……！":"E-everyone…… I'm sorry, I say~……!","きたぁーっ！":"Here it comeees!","やっぱりー！":"I knew it~!","いやああーっ！":"Nooooo!","わたしの番〜！？":"It's my turn~!?","みんな":"everyone","ヒーローがたおれた！":"The Hero is down!","よごれ {0}":"Grime {0}","ヒーローが、スライムになった！":"The Hero became a slime!","インク団の仲間入り":"Joined the Ink Corps","⏱ インク漏れから2ターンたった子が、ひとりでにはじけた{0}。ヒーローの攻撃の「1回で〇人」には数えない":"⏱ A minion who'd been leaking for 2 turns burst on her own{0}. Doesn't count toward the Hero's \"most in one attack\"","（まわりの{0}人も連鎖）":" ({0} nearby chained too)","ラウンド {0}":"Round {0}","残り {0}人・くじ引きの順に、1人ずつ":"{0} left · one at a time, in drawn order","ヒーローの番":"Hero's Turn","戦闘員の番":"Minions' Turn","{0}から、1人ずつ交互に":"Taking turns one at a time, starting with {0}","ターン {0}":"Turn {0}","足もとが、インクで……！":"The ink at my feet……!","だまりに、入っちゃった……！":"I stepped into a pool……!","スーツ不調！ ヒーローが撤退を始めた":"Suit struggling! The Hero has started to retreat","スーツ機能停止！":"Suit Shutdown!","変身解除！":"Transformation Undone!","大連鎖！":"Huge chain!","{0}{1}連鎖！":"{0}{1}-chain!","すごい！":"Amazing!","インクタンク、大爆発！":"Ink tank, huge explosion!","タンク誘爆！":"Tank chain explosion!","首領が、覚醒した！":"The Boss has awakened!","みんなの想いを受けとって…… 体力{0}":"Receiving everyone's feelings…… HP {0}","{0}人まとめて！":"{0} at once!","鉄柱から鉄柱へ":"From pole to pole","限界！":"Limit!","鉄柱の子たちが……":"The girls on the pole……","{0}人、いっぺんに！":"{0} at once!","インクが、となりの柱へ……！":"The ink's going to the next pole……!","鉄柱の大連鎖":"Steel pole mega-chain","……ワープした！":"……I warped!","ここに出るのか":"So this is where it comes out","ワープで、とうちゃく〜！":"Arrived by warp~!","しゅんっ！ 来たよ〜！":"Whoosh! I'm here~!","足もとが、動く……！":"The floor is moving……!","コンベアに、運ばれる……！":"I'm being carried by the conveyor……!","はこばれる〜":"Being carried~","ごとごと〜":"Clatter clatter~","ラインは止まらないよ〜":"The line never stops~","くっ……ここは引く！":"Ngh…… I'll fall back here!","固定砲台部隊、ぜんぶはじけた！":"The whole Fixed Cannon Squad burst!","オリーブ":"Olive","深紫":"Deep purple","紺":"Navy","青":"Blue","黒":"Black","茶":"Brown","金":"Gold","赤":"Red","白":"White","緑":"Green","紫":"Purple","桃":"Pink","橙":"Orange","黄":"Yellow","ショート":"Short","サイド":"Side","ポニー":"Ponytail","ツイン":"Twin tails","ロング":"Long","団子":"Bun","モデルを読み込めません：{0}":"Can't load model: {0}","ビキニ":"Bikini","セパレート":"Separates","ビキニ＋パンツ":"Bikini + shorts","全身胴着":"Full-body suit","ビキニ＋スカート":"Bikini + skirt","セパレート＋スカート":"Separates + skirt","セパレート＋パンツ":"Separates + shorts","道着":"Gi","クロップトップ":"Crop top","レオタード":"Leotard","レオタード＋スカート":"Leotard + skirt","ハイネック":"High neck","ジャケット":"Jacket","コルセット":"Corset","ドレス":"Dress","ハルター":"Halter","チャイナ":"Qipao","ボディスーツ":"Bodysuit","ホルタービキニ":"Halter bikini","なし":"None","色白":"Fair","普通":"Medium","小麦":"Tan","褐色":"Brown","スライム青":"Slime blue","スライム紫":"Slime purple","スライム水色":"Slime aqua","ダークブラウン":"Dark brown","ブラウン":"Brown","琥珀":"Amber","ダークパープル":"Dark purple","ボルドー":"Bordeaux","ダークブルー":"Dark blue","水色":"Light blue","灰":"Gray","そばかす":"Freckles","ペイント":"Face paint","ほくろ":"Mole","傷":"Scar","上がり":"Raised","アーチ":"Arched","細":"Thin","下がり":"Lowered","太":"Thick","丸":"Round","アーモンド":"Almond","切れ長":"Narrow","たれ":"Droopy","つり":"Upturned","笑顔":"Smile","不敵":"Bold","クール":"Cool","勝気":"Feisty","無邪気":"Innocent","おっとり":"Easygoing","スカート":"Skirt","小顔":"Small face","丸顔":"Round face","シャープ":"Sharp","素体の頭ボーンがありません":"The base body has no head bone","腰ボーンを確認できません":"Can't find the hip bone","細い":"Thin","標準":"Standard","太い":"Thick","（形）":"(shape)","名前":"Name","ファイルの中身：ノード{0}・メッシュ{1}・スキン（骨の組）{2}{3}{4}":"File contents: nodes {0} · meshes {1} · skins (bone sets) {2}{3}{4}","・拡張 {0}":" · extensions {0}","・作ったソフト {0}":" · made with {0}","骨を自動で入れた":"Bones added automatically","部品ごと":"By part","骨の名前の一覧":"List of bone names","このモデルには骨（ボーン）が入っていないので、動かせません。骨の入った形（VRM、または骨つきの GLB）で書き出してください （{0}）{1} この画面を送ってもらえれば、原因を調べられます":"This model has no bones, so it can't move. Please export it in a format with bones (VRM, or a rigged GLB) ({0}){1} this","（中の名前：{0}{1}）":"(internal name: {0}{1})","ほか{0}個":"{0} more","骨が見つかりません：{0} （{1}） （モデルの中の骨の名前：{2}{3}） この一覧を送ってもらえれば、読めるように直せます":"Bones not found: {0} ({1}) (bone names in the model: {2}{3}) Send this list and it can be fixed to load","（左右の名前を直した）":"(fixed left/right names)","＋z→回した":"+z → rotated","ブラウザ":"Browser","models フォルダ":"models folder","{0} が読めません":"Can't read {0}","保存したモデルが見つかりません（消されたかも）":"Saved model not found (it may have been deleted)","models フォルダに「{0}」がありません":"\"{0}\" is not in the models folder","モデルの参照がちがいます：{0}":"Wrong model reference: {0}","ベリータンク（お腹）":"Belly Tank (belly)","ツインキャノン（わき）":"Twin Cannon (sides)","ロングホース（腰）":"Long Hose (hip)","ホールタンク（背中）":"Back Tank (back)","カプセル（標準）":"Capsule (standard)","まるいタンク":"Round tank","うすいパネル（体になじむ）":"Thin panel (fits the body)","小びんのベルト":"Belt of small bottles","砲身（標準）":"Barrel (standard)","太くて短い":"Thick and short","2連の砲身":"Double barrel","小さいポッド（体になじむ）":"Small pod (fits the body)","ノズル（標準）":"Nozzle (standard)","水てっぽう":"Water pistol","細いノズル（体になじむ）":"Thin nozzle (fits the body)","円いタンク（標準）":"Round tank (standard)","2本のタンク":"Twin tanks","うすいリュック（体になじむ）":"Thin backpack (fits the body)","パーツが読めません":"Can't read the part","ゲームの体":"Game body","型{0}{1}{2}":"Type {0}{1}{2}","型1〜8":"Types 1–8","（ゲームの体）":"(game body)","（{0}、ほかはゲームの体）":"({0}, the rest is the game body)","localStorage に保存できません":"Can't save to localStorage","3Dの体を準備中…":"Preparing 3D bodies…","3Dの体を準備中…（{0}{1}/{2}）":"Preparing 3D bodies… ({0}{1}/{2})","3Dの体を準備中…（{0}）":"Preparing 3D bodies… ({0})","3Dの体を準備中…（{0}{1}/{2}{3}）":"Preparing 3D bodies… ({0}{1}/{2}{3})","盤を並べています…":"Setting up the board…","満":"F","パシャーーン！！":"SPLAAASH!!","パシャーン！":"SPLASH!","{0}連鎖！":"{0}-chain!","しゅっ！":"Fwsh!","パァン！":"POP!","こらえた！":"Held on!","ボコッ…！":"Bloop…!","ゴゴゴ…":"Rumble…","ドッカーン！":"KABOOM!","あと{0}回 {1}":"{0} more {1}","キィン！":"Clang!","セーフ！":"Safe!","ベチャッ！":"Splat!","ズドン！":"Thud!","再生中 {0}%":"Regenerating {0}%","インク団 再生の部屋":"Ink Corps Regeneration Room","再生中：347体":"Regenerating: 347","首領さまの手作りインクで、ひとりずつ":"With the Boss's handmade ink, one by one","おはなしを準備中…（{0}{1}/{2}）":"Preparing the story… ({0}{1}/{2})","おはなしを準備中…（首領）":"Preparing the story… (Boss)","おしまい":"The End","<b>{0}</b><span>おはなしを準備中…</span>":"<b>{0}</b><span>Preparing the story…</span>","とばす ⏭":"Skip ⏭","準備に失敗しました：{0}":"Setup failed: {0}","もう一度押すと、とばす ⏭":"Press again to skip ⏭","部屋の画面":"Room screen","インク団の戦闘員":"Ink Corps minion","▶ おわる":"▶ Finish","▶ つぎへ":"▶ Next","おはなしを準備中…":"Preparing the story…","おはなし":"Story","おはなし「{0}」・{1}：{2}":"Story \"{0}\" · {1}: {2}","インク団、出撃ー！":"Ink Corps, move out~!","インク団め、ここから先へは行かせない！":"Ink Corps, you won't get any further than this!","強化スーツ、起動！ 全員まとめて相手だ！":"Power suit, activate! I'll take you all on at once!","ヒーローに勝つために、鍛えるよ！ 赤組、いくよー！":"We'll train to beat the Hero! Red Team, let's go~!","白組だって、負けないもん！":"White Team won't lose either!","今日は、みんなライバルだよ！":"Today, everyone's a rival!","最後まで残るのは、わたし！":"The last one standing will be me!","ヒーローに勝つために……優勝する！":"To beat the Hero…… I'll win this!","赤組の勝ちー！ これでヒーローにも勝てるかも！":"Red Team wins~! Now we might even beat the Hero!","白組の勝ちー！ もっと強くなれたね！":"White Team wins~! We got even stronger!","やったー！ 優勝！ これで、ヒーローにも負けない！":"Yaaay! I won! Now I won't lose to the Hero either!","優勝ー！ わたしが、いちばん！":"Champion~! I'm number one!","ヒーロー、時間切れ〜！ また来てね！":"Hero, time's up~! Come again!","戦闘員の声1":"Minion voice 1","戦闘員の声2":"Minion voice 2","戦闘員の声3":"Minion voice 3","行くよー！ えへへ、当たれ！":"Here I go~! Hehe, take this!","え！？ うわああっ！":"Huh!? Waaah!","やったー！ 優勝！":"Yaaay! I won!","VOICEVOX：{0} {1}":"VOICEVOX: {0} {1}","{0}の声を、えらんでください":"Choose a voice for {0}","タイトルへ":"To Title","① VOICEVOX につなぐ":"① Connect to VOICEVOX","パソコンで VOICEVOX を起動してから、「つなぐ」を押す。":"Start VOICEVOX on your PC, then press \"Connect\".","つなぐ":"Connect","つながらないとき":"If it won't connect","VOICEVOX が起動しているか確かめる（起動している間だけ、つながる）。":"Check that VOICEVOX is running (it only connects while running).","game.html をファイルとして開いているときは、VOICEVOX が「よそのページからの呼び出し」を断っている。ブラウザで <b>http://127.0.0.1:50021/setting</b> を開き、「CORS Policy Mode」を <b>all</b> にして保存し、VOICEVOX を起動しなおす。":"When game.html is opened as a file, VOICEVOX refuses \"calls from other pages\". Open <b>http://127.0.0.1:50021/setting</b> in your browser, set \"CORS Policy Mode\" to <b>all</b>, save, and restart VOICEVOX.","VOICEVOX の場所を変えているときは、上の欄を、その場所（例：http://127.0.0.1:50021）にする。":"If you've changed VOICEVOX's address, enter it in the field above (e.g. http://127.0.0.1:50021).","② 声をえらぶ":"② Choose voices","ふつう（24kHz）":"Normal (24kHz)","小さめ（16kHz）":"Smaller (16kHz)","③ まとめて作る":"③ Make them all","作っていないものを、まとめて作る":"Make all the ones not yet made","止める":"Stop","ぜんぶ作り直す":"Remake everything","できた声は、このブラウザの中に入り、すぐゲームで使える（タイトルの「声」を「声ファイル」に）。途中で止めても、もう一度押せば続きから。声の設定を変えた組は、作り直しになる。":"Finished voices go into this browser and can be used in the game right away (set \"Voice\" on the title to \"Voice files\"). If you stop partway, press again to continue. Groups whose voice settings changed get remade.","④ 声フォルダとして保存（配るとき）":"④ Save as a voice folder (to share)","game.html のフォルダに書き出す":"Export to the game.html folder","voice.zip をダウンロード":"Download voice.zip","書き出すと、game.html と同じ所に voice フォルダ（h・m0・m1・m2 と index.txt）ができる。zip のときは、ほどいて同じ所に置く。":"Exporting creates a voice folder (h, m0, m1, m2 and index.txt) next to game.html. For the zip, unzip it in the same place.","クレジット":"Credits","VOICEVOX の声は、キャラクターごとに利用規約（商用利用・クレジットの書き方など）がちがう。使う声の規約を必ず読むこと。このクレジットは、タイトルと voice/index.txt に入る。":"Each VOICEVOX character has its own terms of use (commercial use, how to credit, etc.). Be sure to read the terms for the voices you use. This credit goes into the title and voice/index.txt.","（声をえらぶと、ここに出る）":"(appears here once you choose a voice)","（えらぶ）":"(choose)","{0}（{1}）":"{0} ({1})","試し聞き":"Preview","つなぐと、えらべる":"Connect to choose","高さ":"Pitch","抑揚":"Intonation","試し聞きできません：{0}":"Can't preview: {0}","つないでいます…":"Connecting…","つながりました（VOICEVOX {0}・キャラクター {1}人）":"Connected (VOICEVOX {0} · {1} characters)","<b class=\"warn\">つながりません</b>：{0} 下の「つながらないとき」を見てください":"<b class=\"warn\">Can't connect</b>: {0} See \"If it won't connect\" below","セリフ {0}種類・声のファイル {1}個のうち、できている {2}個":"{0} kinds of lines · {2} of {1} voice files made","4つの組の声を、ぜんぶえらんでください（①でつなぐと、えらべる）":"Choose voices for all 4 groups (connect in ① to choose)","<b class=\"warn\">止まりました</b>：{0}":"<b class=\"warn\">Stopped</b>: {0}","作っています… あと {0}個（約 {1} 分）":"Making… {0} left (about {1} min)","作り終わりました（{0}個{1}）。ゲームで、すぐ使えます。":"Done ({0}{1}). Ready to use in the game.","・失敗 {0}個（もう一度押すと、作り直す）":" · {0} failed (press again to remake)","止めました（続きは、もう一度押す）":"Stopped (press again to continue)","ぜんぶの声を、作り直しますか？":"Remake all the voices?","まとめています…":"Bundling…","まだ声がありません（③で作る）":"No voices yet (make them in ③)","voice.zip を作りました（{0}個）。ほどいて、game.html と同じ所に置く。":"Made voice.zip ({0}). Unzip it next to game.html.","作れませんでした：{0}":"Couldn't make it: {0}","このブラウザでは、フォルダに書き出せません（Chrome・Edge なら書き出せる）。「voice.zip をダウンロード」を使ってください。":"This browser can't export to a folder (Chrome and Edge can). Please use \"Download voice.zip\".","書き出しています…":"Exporting…","書き出しました：えらんだフォルダの中の voice（{0}個）。game.html と同じフォルダをえらんでいれば、そのまま使える。":"Exported: voice inside the folder you chose ({0}). If you chose the same folder as game.html, it's ready to use.","やめました":"Canceled","書き出せませんでした：{0}":"Couldn't export: {0}","ステージ {0}「{1}」{2}":"Stage {0} \"{1}\"{2}","<b>📋 セリフ一覧（自分で収録する）</b>":"<b>📋 Line List (record your own)</b>","Grok などで声を録るときの台本です。番号（h001・m001…）をファイル名に入れて録ると、「まとめて取り込む」で、そのセリフに入ります（例：m012.mp3、h003.wav）。1つずつなら、行の「取り込む」から。取り込んだ声は WAV にして、このブラウザの中へ入り、すぐゲームで使えます（「導入したモデル・作った声を書き出す」（設定の中）で持ち出せる）。":"A script for recording voices yourself. Put the number (h001, m001…) in the file name and \"Import all\" puts it on that line (e.g. m012.mp3, h003.wav). For one at a time, use \"Import\" on the line. Imported voices are converted to WAV, stored in this browser, and used in the game right away (you can take them out with \"Export imported models & made voices\" in Settings). Voice lines play in Japanese; the text shown here is the English subtitle.","「〜ちゃーん！」のような名前を呼ぶセリフは、「前の言葉」「名前」「後ろの言葉」を別々に録ると、ゲームが続けて鳴らします。ゲームを新しくしてセリフが増えると、番号がずれることがあるので、録るときと取り込むときは同じ版で。":"Lines that call a name, like \"〜ちゃーん！\", play in sequence if you record the \"words before\", the \"name\" and the \"words after\" separately. When the game is updated and lines are added, numbers can shift, so record and import with the same version.","ヒーロー（{2}）":"Hero ({2})","戦闘員（{4}）":"Minions ({4})","台本をコピー（番号つき）":"Copy script (numbered)","台本をダウンロード（.txt）":"Download script (.txt)","Grok 用の指示書をダウンロード":"Download the Grok instructions","まとめて取り込む":"Import all","{7}行（自分で録った声 {8}個）":"{7} lines ({8} voices you recorded)","声づくりの部屋へ":"To the Voice Studio","すべて":"All","まだ":"Not yet","できた":"Done","<span>取り込む先</span><span class=\"rseg\">{0}</span>":"<span>Import to</span><span class=\"rseg\">{0}</span>","3つの声とも同じ":"Same for all 3 voices","取り込む":"Import","録":"Rec","済":"Done","コピーしました（{0}行）":"Copied ({0} lines)","コピーできませんでした。「ダウンロード」を使ってください":"Couldn't copy. Please use \"Download\"","まだ声がありません":"No voices yet","{0} に取り込みました":"Imported to {0}","取り込めませんでした（音のファイルか確かめてください）：{0}":"Couldn't import (check that it's an audio file): {0}","指示書をダウンロードしました（声の役・読み方のきまり・番号と演技メモつきの台本）":"Downloaded the instructions (voice roles, reading rules, and a script with numbers and acting notes)","取り込んでいます…（{0}{1}{2}／{3}）":"Importing… ({0}{1}{2}/{3})","{0}（読めない）":"{0} (unreadable)","{0}個を取り込みました{1}":"Imported {0}{1}","。番号がわからず取り込めなかったもの：{0}{1}":". Couldn't import (number unknown): {0}{1}","ほか":"others","つやの瞳":"Glossy eyes","筆はねの目":"Brush-flick eyes","ふたつ窓の目":"Twin-window eyes","あかりの目":"Glow eyes","きらりの目":"Sparkle eyes","きらめき大目":"Big sparkly eyes","困り顔の丸目":"Worried round eyes","やさしい目":"Gentle eyes","凛の目":"Dignified eyes","スポーツ":"Sporty","作っています…":"Making…","顔に寄る":"Zoom to face","歩く（タプタプ）":"Walk (jiggle)","撃つ":"Shoot","放物線で撃つ":"Lob shot","当たる":"Get hit","<b>👗 モデルの部屋</b>":"<b>👗 Model Room</b>","★＝外のモデル。うすい型は、試合に出さない型。":"★ = external model. Faded types aren't used in matches.","型1〜8をぜんぶ出す":"Show all types 1–8","この型を元に戻す":"Reset this type","ぜんぶ元に戻す":"Reset everything","変えたものは、すぐ保存されます。次の試合から使われます。":"Changes are saved right away and used from the next match.","全身を見る":"View full body","ヒーローのタブでは、試せません":"Can't test on the Hero tab","動かす装備がありません（ぜんぶ、かくしているか、モデルの部品がつながっていません）":"No gear to move (it's all hidden, or the model's parts aren't linked)","連動している部品：{0}個{1}":"Linked parts: {0}{1}","（黄色の網の中に、モデルの部品が入るように、位置と範囲を変えてください）":"(Adjust the position and range so the model's parts fit inside the yellow mesh)","三角形 {0}（40人で約{1}万）{2}・骨の読み方：{3}・向き：{4}":"Triangles {0} (about {1}0k for 40){2} · bone reading: {3} · facing: {4}","<b class=\"warn\">多め：40人並ぶと重くなるかも</b>":"<b class=\"warn\">A lot: 40 lined up may get heavy</b>","<span>モデル</span>":"<span>Model</span>","ゲームの体（髪型・服を選べる）":"Game body (choose hairstyle & outfit)","外のモデルを読み込む（.vrm・.glb）":"Load an external model (.vrm / .glb)","{2}（{3}）":"{2} ({3})","このモデルを消す":"Delete this model","<span>前後を反転</span><span class=\"rseg\">":"<span>Flip front/back</span><span class=\"rseg\">","そのまま":"As is","反転する":"Flip","ふつうは自動で前を向く。それでも背中が前に見えるときだけ「反転する」。":"It normally faces front automatically. Only \"Flip\" if the back still shows as the front.","「{0}」を読んでいます…":"Loading \"{0}\"…","読み込みました（{0}・三角形 {1}）":"Loaded ({0} · {1} triangles)","読めませんでした：{0}":"Couldn't load: {0}","<b>試合で使う</b> 戦闘員：{0} ／ ヒーロー：{1}{2}":"<b>Used in matches</b> Minions: {0} / Hero: {1}{2}","<br><b class=\"warn\">ブラウザの保存場所（localStorage）がいっぱいで書けませんでした。べつの場所（IndexedDB）に控えたので、このまま使えます。</b>":"<br><b class=\"warn\">The browser's storage (localStorage) was full, so it couldn't save there. It was kept in another place (IndexedDB), so you can keep using it.</b>","🦸 ヒーロー":"🦸 Hero","<i style=\"background:{3}\"></i>戦闘員{4}{5}{6}":"<i style=\"background:{3}\"></i>Minion {4}{5}{6}","{0}：モデルの部品 {1}個{2}{3}":"{0}: {1} model part(s){2}{3}","（名前：{0}）":"(name: {0})","（近くの部品）":"(nearby part)","・つながっていない":" · not linked","{0}：かくしている（動かない）":"{0}: hidden (doesn't move)","{0}：ゲームの装備":"{0}: game gear","服の色":"Outfit color","服の色2":"Outfit color 2","モデル・パーツをまとめています…（{0}）":"Bundling models and parts… ({0})","声をまとめています…":"Bundling voices…","📦 導入したモデル・作った声の設定を書き出す":"📦 Export imported models & voice settings","ほかのパソコンで遊ぶときや、ほかの人に配るときに使います。":"Use this to play on another PC or to share with others.","いまのブラウザの中にある、<b>モデルの部屋の設定</b>（型・色・服・装備・試合に出す型など）、<b>読み込んだモデルとパーツ</b>、<b>タイトルの設定</b>、<b>声づくりの部屋で作った声</b>を、<b>models</b> フォルダと <b>voice</b> フォルダに書き出します。":"Exports what's in this browser — <b>Model Room settings</b> (types, colors, outfits, gear, which types appear in matches), <b>loaded models and parts</b>, <b>title settings</b>, and <b>voices made in the Voice Studio</b> — to a <b>models</b> folder and a <b>voice</b> folder.","この2つのフォルダを <b>game.html と同じ所</b>に置くと、だれが・どのパソコンやブラウザで開いても、はじめからこの状態で遊べます（遊ぶ人がそのブラウザで設定を変えたら、そちらが優先）。":"Put these 2 folders <b>next to game.html</b> and anyone opening it, on any PC or browser, starts in this state (if the player changes settings in their browser, those take priority).","zip でダウンロード":"Download as zip","とじる":"Close","このブラウザの設定を消して、フォルダの設定にもどす":"Clear this browser's settings and go back to the folder's settings","いまは、game.html の横の models フォルダに、配る用の設定が入っています（{0}）。":"The models folder next to game.html currently contains shared settings ({0}).","zip は、ほどいて中の models・voice を、手元の game.html と同じ所に置く。":"Unzip it and put the models and voice inside next to your game.html.","「フォルダに書き出す」は Chrome・Edge で使える（game.html があるフォルダをえらぶ）。zip のときは、ほどいて中の models・voice を game.html と同じ所に置く。前の models・voice フォルダがあるときは、上書きされる。":"\"Export to folder\" works in Chrome and Edge (choose the folder with game.html). For the zip, unzip it and put the models and voice next to game.html. Any existing models and voice folders will be overwritten.","このブラウザで変えたモデルの部屋の設定とタイトルの設定を消して、フォルダの設定にもどしますか？（読み込んだモデルや作った声は消えません）":"Clear the Model Room and title settings changed in this browser and go back to the folder's settings? (Loaded models and made voices won't be deleted)","モデル・パーツ {0}個{1} と、設定を書き出しました。":"Exported {0} model(s)/part(s){1} and the settings.","・声 {0}個":" · {0} voice(s)","（声はなし）":" (no voices)","このブラウザでは、フォルダに書き出せません（Chrome・Edge なら書き出せる）。「zip でダウンロード」を使ってください。":"This browser can't export to a folder (Chrome and Edge can). Please use \"Download as zip\".","書き出しています…（{0}／{1}）":"Exporting… ({0}/{1})","{0}（えらんだフォルダの中の models・voice）":"{0} (models and voice inside the folder you chose)","zip を作っています…":"Making the zip…","{0}（InkWar_モデルと声.zip。ほどいて、中の models・voice を game.html と同じ所に置く）":"{0} (InkWar_モデルと声.zip. Unzip it and put the models and voice inside next to game.html)","🧹 はじめの状態にもどす":"🧹 Reset to the starting state","このブラウザの中に入れたものを消して、はじめの状態にもどします。":"Clears what's been added to this browser and returns to the starting state.","設定だけもどす":"Reset settings only","モデルの部屋の設定（色・服・装備・試合に出す型など）と、タイトルの設定を消す。読み込んだモデル・パーツと、作った声は残る（また選べる）。":"Clears the Model Room settings (colors, outfits, gear, which types appear in matches) and title settings. Loaded models/parts and made voices remain (you can choose them again).","ぜんぶ消して、もどす":"Clear everything and reset","設定に加えて、読み込んだモデル・パーツ、声づくりの部屋で作った声と、その声の設定も消す。ゲームを入れたばかりの状態になる。":"In addition to settings, clears loaded models/parts, voices made in the Voice Studio, and their voice settings. Like a fresh install.","やめる":"Cancel","<b>注意</b>：game.html の横に models・voice フォルダ（配る用）があるので、消したあとは、そのフォルダの状態ではじまる。ゲームそのもののはじめの状態にしたいときは、そのフォルダを別の所へ移してから開く。":"<b>Note</b>: there are models and voice folders (for sharing) next to game.html, so after clearing it starts in that folder's state. To get the game's own starting state, move those folders elsewhere before opening.","設定を、はじめの状態にもどしますか？":"Reset settings to the starting state?","読み込んだモデル・パーツと作った声もふくめて、ぜんぶ消しますか？（もとにもどせません）":"Delete everything, including loaded models/parts and made voices? (This can't be undone)","game.html をファイルとして開いているときは、VOICEVOX が「よそのページからの呼び出し」を断っている。ブラウザで":"When game.html is opened as a file, VOICEVOX refuses \"calls from other pages\". Open","を開き、「CORS Policy Mode」を":"in your browser, set \"CORS Policy Mode\" to","にして保存し、VOICEVOX を起動しなおす。":", save, and restart VOICEVOX.","つながりません":"Can't connect","：{0} 下の「つながらないとき」を見てください":": {0} See \"If it won't connect\" below","止まりました":"Stopped","：{0}":": {0}","📋 セリフ一覧（自分で収録する）":"📋 Line List (record your own)","取り込む先":"Import to","👗 モデルの部屋":"👗 Model Room","多め：40人並ぶと重くなるかも":"A lot: 40 lined up may get heavy","モデル":"Model","前後を反転":"Flip front/back","試合で使う":"Used in matches","戦闘員：{0} ／ ヒーロー：{1}{2}":"Minions: {0} / Hero: {1}{2}","ブラウザの保存場所（localStorage）がいっぱいで書けませんでした。べつの場所（IndexedDB）に控えたので、このまま使えます。":"The browser's storage (localStorage) was full, so it couldn't save there. It was kept in another place (IndexedDB), so you can keep using it.","戦闘員{4}{5}{6}":"Minion {4}{5}{6}","いまのブラウザの中にある、":"Exports what's in this browser —","モデルの部屋の設定":"Model Room settings","（型・色・服・装備・試合に出す型など）、":"(types, colors, outfits, gear, which types appear in matches),","読み込んだモデルとパーツ":"loaded models and parts","、":",","タイトルの設定":"title settings","声づくりの部屋で作った声":"voices made in the Voice Studio","を、":"— to a","フォルダと":"folder and a","フォルダに書き出します。":"folder.","この2つのフォルダを":"Put these 2 folders","game.html と同じ所":"next to game.html","に置くと、だれが・どのパソコンやブラウザで開いても、はじめからこの状態で遊べます（遊ぶ人がそのブラウザで設定を変えたら、そちらが優先）。":"and anyone opening it, on any PC or browser, starts in this state (if the player changes settings in their browser, those take priority).","注意":"Note","：game.html の横に models・voice フォルダ（配る用）があるので、消したあとは、そのフォルダの状態ではじまる。ゲームそのもののはじめの状態にしたいときは、そのフォルダを別の所へ移してから開く。":": there are models and voice folders (for sharing) next to game.html, so after clearing it starts in that folder's state. To get the game's own starting state, move those folders elsewhere before opening.","<b>🎙️ 声づくりの部屋（VOICEVOX）</b><span>":"<b>🎙️ Voice Studio (VOICEVOX)</b><span>","<span>音の細かさ</span><span class=\"rseg\">":"<span>Audio quality</span><span class=\"rseg\">","インクの色":"Ink color","肌の色":"Skin color","<span class=\"rnote\">モデルの中の名前：</span>{0}":"<span class=\"rnote\">Name in the model: </span>{0}","★ {0}（読み込んだパーツ）":"★ {0} (loaded part)","◆ モデルの部品を使う（その部品が、この動きをする）":"◆ Use the model's part (that part does this motion)","えらんだ色":"Chosen color","<span>形</span>":"<span>Shape</span>","パーツを読み込む（.glb）":"Load a part (.glb)","<span>色</span><span class=\"rseg\">{7}":"<span>Color</span><span class=\"rseg\">{7}","<span>選び方</span><span class=\"rseg\">":"<span>How to pick</span><span class=\"rseg\">","名前で":"By name","近くの部品":"Nearby parts","例：belly（いくつかは , で区切る）":"e.g. belly (separate several with ,)","<span>部品の名前</span>":"<span>Part name</span>","名前に、この言葉が入っている部品（親の名前でもよい）を使う。{4}下の名前を押すと入る。":"Use parts whose name contains this word (a parent's name works too). {4}Tap a name below to enter it.","キャノンは、体のまん中より左の部品が左、右の部品が右になる。":"For the cannons, parts left of the body's center become the left one, parts right of it the right one.","範囲":"Range","（その名前の部品が見つかりません）":"(No part with that name found)","黄色の網の中にある、モデルの小さい部品（体や手足のような大きい形はのぞく）が、この部品の動き（タプタプ・ゆれ・撃つ・ふくらんではじける）をする。網は下の「部品を選ぶ網の場所」で動かせる。":"Small model parts inside the yellow mesh (excluding big shapes like the body and limbs) do this part's motions (jiggle, sway, shoot, swell and burst). Move the mesh with \"Mesh position for picking parts\" below.","このパーツを消す":"Delete this part","<span>向き</span><span class=\"rseg\">{0}</span>":"<span>Facing</span><span class=\"rseg\">{0}</span>","モデルの色のまま":"Keep the model's color","<span>撃つ動き</span><span class=\"rseg\">{0}</span>":"<span>Firing motion</span><span class=\"rseg\">{0}</span>","小＝引っこんで、前へ突き出す。大＝もっと深く引っこんで、もっと前へ{1}。まぜる＝1回ごとに、小か大。":"Small = pulls back, then thrusts forward. Large = pulls back deeper and thrusts further{1}. Mix = small or large each time.","小":"Small","大":"Large","まぜる":"Mix","（その前に一度ふくらんで、元にもどる）":"(it swells once first, then goes back)","ホースを構える角度（上向きが＋）。放物線で撃つのは、半分くらい。左下の「撃つ」「放物線で撃つ」で試せる。":"The angle the hose is held (up is +). About half of the shots are lobbed. Test with \"Shoot\" and \"Lob shot\" at the bottom left.","まっすぐ撃つ角度":"Straight shot angle","放物線の角度":"Lob angle","<span>タンクとの管</span><span class=\"rseg\">":"<span>Tube to tank</span><span class=\"rseg\">","見せる":"Show","かくす":"Hide","装備の位置<span class=\"rnote\">（体に重なるときに。動かしても、ルールは同じ）</span>":"Gear position<span class=\"rnote\"> (when it overlaps the body; moving it doesn't change the rules)</span>","かくしても、その部品は試合で使われる（弾は、かくした場所から出る）。":"Even when hidden, the part is used in matches (shots come out of the hidden spot).","モデルの部品を、4つの装備にする":"Turn the model's parts into the 4 pieces of gear","ゲームの装備にもどす":"Back to the game's gear","モデルに自分のタンク・キャノン・ホースがあるときは、上のボタンで、その部品が装備と同じ動きをする（ゲームの装備はかくれる）。部品の名前（belly・tank・brast・cannon・shaft・hose など）が見つかった装備だけ、その部品にする。名前が1つも見つからないときは、4つとも近くの部品で選ぶ。":"If the model has its own tank, cannon and hose, the button above makes those parts move like the gear (the game's gear is hidden). Only gear whose part name (belly, tank, brast, cannon, shaft, hose, etc.) is found uses that part. If no names are found, all 4 are picked from nearby parts.","読み込んだパーツ":"Loaded parts","モデルの部品":"Model parts","元の場所・角度":"Original position & angle","場所":"Position","角度":"Angle","大きさ":"Size","・動かした":" · moved","・色を変えた":" · recolored","かくした":"Hidden","外へ":"Outward","右へ":"Right","上へ":"Up","前へ":"Forward","前後の傾き":"Forward/back tilt","左右の向き":"Left/right facing","ひねり":"Twist","キャノンは左右が鏡うつしに動く。":"The cannons move as mirror images, left and right.","部品を選ぶ網の場所":"Mesh position for picking parts","網の場所を変えると、選ぶ部品が変わる。上の「場所」は、選んだ部品そのものを動かす。":"Moving the mesh changes which parts get picked. \"Position\" above moves the picked parts themselves.","網を外へ":"Mesh outward","網を右へ":"Mesh right","網を上へ":"Mesh up","網を前へ":"Mesh forward","強化ヒーローのスーツは、金と赤のまま。スーツ機能停止・変身解除・スライムの姿も、この髪型と顔になる（左下で見られる）。":"The Powered-up Hero's suit stays gold and red. Suit Shutdown, Transformation Undone and slime forms also use this hairstyle and face (preview at the bottom left).","外のモデルのヒーローは、姿（スーツ機能停止・変身解除・スライム）が変わる代わりに、色がだんだん変わっていく。":"A Hero using an external model changes color gradually instead of changing form (Suit Shutdown, Transformation Undone, slime).","髪型":"Hairstyle","髪の色":"Hair color","顔":"Face","目の色":"Eye color","表情":"Expression","スーツの色":"Suit color","スーツ":"Suit","スライム":"Slime","「この型だけ出す」にすると、試合の戦闘員は全員この型になる（外のモデルが効いているか、すぐわかる）。":"With \"Only this type\", every minion in matches becomes this type (so you can quickly see whether an external model works).","服の色の2つめは、インクの色にもなる（個人戦）。":"The second outfit color is also the ink color (Free-for-All).","紅白戦では、服の色だけ組の色（赤組・白組）になる。赤組は型1・3・5・7、白組は型2・4・6・8。":"In Red vs. White, only the outfit color becomes the team color (Red/White). Red uses types 1, 3, 5, 7; White uses types 2, 4, 6, 8.","試合に出す":"Use in matches","出す":"Use","出さない":"Don't use","この型だけ出す":"Only this type","外のモデルは、髪型・服・表情はモデルのまま。装備（タンク・キャノン・ホース）は、骨の位置に合わせて自動で付く。":"External models keep their own hairstyle, outfit and expressions. Gear (tank, cannon, hose) is attached automatically to match the bones.","スライム色に寄せる":"Tint toward slime color","少し":"A little","まあまあ":"Some","しっかり":"A lot","スライムの色":"Slime color","ゲームの体の服・靴は、体にぬった色なので、外すと肌の色になる（スカート・ボタンなどの飾りはかくれる）。自分で作った服・靴に入れかえるときの下地に。服の色の2つめは、インクの色のまま。":"The game body's clothes and shoes are painted on, so removing them shows skin color (decorations like skirts and buttons are hidden). A base for swapping in clothes and shoes you made. The second outfit color stays as the ink color.","肌":"Skin","服":"Outfit","服・靴":"Clothes & shoes","着る":"Wear","ぜんぶ外す（肌の色に）":"Remove all (skin color)","名前（いくつかは , で区切る）":"Names (separate several with ,)","名前（ペイントだけの服など）":"Names (outfits that are just paint, etc.)","服・靴などの部品":"Parts like clothes and shoes","<span>かくす部品</span>":"<span>Parts to hide</span>","<span>肌の色にぬる部品</span>":"<span>Parts to paint skin color</span>","名前に、その言葉が入っている部品（親の名前でもよい）。服や靴を外して入れかえるときに。1枚の体に絵としてかかれた服は、部品が分かれていないので、この方法では外せない。":"Parts whose name contains that word (a parent's name works too). For removing and swapping clothes or shoes. Clothes drawn as a picture on a single body aren't separate parts, so this can't remove them.","ヒーロー対決の服":"Hero Showdown outfit","インク団の紫でおそろい":"Matching Ink Corps purple","型の色":"Type colors","キャノン":"Cannon","ホース":"Hose","パーツを読み込みました（{0}）":"Loaded the part ({0})","パーツが読めませんでした：{0}":"Couldn't load the part: {0}","このパーツを、ブラウザから消しますか？（使っている型は、標準の形に戻ります）":"Delete this part from the browser? (Types using it go back to the standard shape)","このモデルを、ブラウザから消しますか？（使っている型は、ゲームの体に戻ります）":"Delete this model from the browser? (Types using it go back to the game body)","戦闘員8つとヒーローを、ぜんぶ元に戻しますか？":"Reset all 8 minions and the Hero?","🎙️ 声づくりの部屋（VOICEVOX）":"🎙️ Voice Studio (VOICEVOX)","音の細かさ":"Audio quality","モデルの中の名前：":"Name in the model:","形":"Shape","色":"Color","選び方":"How to pick","部品の名前":"Part name","向き":"Facing","撃つ動き":"Firing motion","タンクとの管":"Tube to tank","装備の位置":"Gear position","（体に重なるときに。動かしても、ルールは同じ）":"(when it overlaps the body; moving it doesn't change the rules)","かくす部品":"Parts to hide","肌の色にぬる部品":"Parts to paint skin color","インク戦闘員ウォーズ {0}":"Ink Minion Wars {0}","インク戦闘員ウォーズ":"Ink Minion Wars","ElevenLabs（ヒーロー：Honoka／戦闘員：Unya・Sameno・Itsuki／首領：いろはうた）":"ElevenLabs (Hero: Honoka / Minions: Unya, Sameno, Itsuki / Boss: Irohauta) — voices are in Japanese","ヒーロー":"Hero","{0}ちゃーん！":"{0}~!","{0}ちゃん！？":"{0}!?","いやっ、{0}ちゃん！":"No, {0}!","{0}ちゃん、こっち！":"{0}, over here!","{0}ちゃん、手をつないで……！":"{0}, hold my hand……!","{0}ちゃーん、いっしょに……！":"{0}~, together……!","{0}ちゃん、またあとでね……！":"{0}, see you later……!","{0}ちゃーーん！":"{0}~~!","{0}ちゃん、はなれないで……！":"{0}, don't let go……!","{0}ちゃん、にげてー！":"{0}, run~!","{0}ちゃん、ごめーん！":"{0}, sorryyy!","あっ、{0}ちゃん、近い……！":"Ah, {0}, too close……!","{0}ちゃん、はなれて……！":"{0}, get away……!","{0}ちゃーん！？":"{0}~!?","{0}ちゃん、なんでー！？":"{0}, whyyy!?","えっ、{0}ちゃん！？":"Huh, {0}!?","{0}ちゃんの、インクが……！":"{0}'s ink……!"};

/* ---- src/ui/i18n.js ---- */
// ---- インク戦闘員ウォーズ：英語版（画面に出る直前に、日本語を英語へ差しかえる） ----
//   ゲームの中身・声（セリフの文字で選ぶ）は日本語のまま動く。画面の文字・canvas の文字・alert/confirm だけを英語にする。
//   訳：window.IW_EN（tools/i18n/en.json から build.py が入れる）。{0} {1} の入った訳は「型」（つないだ文）。
//   言語：URL の ?lang=en / ?lang=ja → 前に選んだもの（localStorage iw_lang）→ ブラウザの言語（日本語以外は英語）。
(function (W) {
  'use strict';
  const IW3 = W.IW3 = W.IW3 || {};
  const JP = /[぀-ヿ㐀-鿿！-｠　-〿]/;
  let lang = 'ja';
  try {
    const q = (location.search.match(/[?&]lang=(en|ja)/) || [])[1];
    const saved = W.localStorage && localStorage.getItem('iw_lang');
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'ja';
    lang = q || saved || (/^ja/i.test(nav) ? 'ja' : 'en');
  } catch (e) { }
  IW3.lang = lang;
  IW3.setLang = function (l) { try { localStorage.setItem('iw_lang', l); } catch (e) { } location.href = location.href.replace(/([?&])lang=(en|ja)&?/, '$1').replace(/[?&]$/, '').replace(/#.*$/, '') + (location.hash || ''); };
  IW3.tr = function (s) { return s; };
  if (lang !== 'en') return;
  document.documentElement.lang = 'en';
  document.documentElement.classList.add('lang-en');

  const D = W.IW_EN || {};
  // 名前（戦闘員・ヒーロー・首領）
  const NAMES = { 'アカネ': 'Akane', 'ミドリ': 'Midori', 'ルリ': 'Ruri', 'コハク': 'Kohaku', 'ヒスイ': 'Hisui', 'サンゴ': 'Sango', 'モモ': 'Momo', 'ユズ': 'Yuzu', 'スミレ': 'Sumire', 'ツバキ': 'Tsubaki', 'カエデ': 'Kaede', 'ナギ': 'Nagi', 'シズク': 'Shizuku', 'ホタル': 'Hotaru', 'ミオ': 'Mio', 'リン': 'Rin', 'サクラ': 'Sakura', 'ツムギ': 'Tsumugi', 'ヒナ': 'Hina', 'アオイ': 'Aoi', 'カリン': 'Karin', 'ノゾミ': 'Nozomi', 'マユ': 'Mayu', 'ヨツバ': 'Yotsuba', 'イブキ': 'Ibuki', 'ハル': 'Haru', 'ナツ': 'Natsu', 'アキ': 'Aki', 'フユ': 'Fuyu', 'ミク': 'Miku', 'ソラ': 'Sora', 'ウミ': 'Umi', 'ネネ': 'Nene', 'キキ': 'Kiki', 'ララ': 'Lala', 'ルル': 'Lulu', 'ココ': 'Coco', 'ミミ': 'Mimi', 'ナナ': 'Nana', 'チカ': 'Chika', 'エマ': 'Emma', 'レイ': 'Rei', 'ユメ': 'Yume', 'サエ': 'Sae', 'トモ': 'Tomo', 'ブルーセイバー': 'Blue Saber', 'ノワール': 'Noir', 'セレナ': 'Serena', 'ミナ': 'Mina' };
  Object.assign(NAMES, W.IW_EN_NAMES || {});
  // 型（{0} 入り）を正規表現に。前の文字が長いものから試す
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const TPL = [];
  for (const k in D) {
    if (!/\{\d+\}/.test(k)) continue;
    const parts = k.split(/(\{\d+\})/), idx = [];
    let re = '^';
    for (const p of parts) { const m = p.match(/^\{(\d+)\}$/); if (m) { idx.push(+m[1]); re += '([\\s\\S]*?)'; } else re += esc(p); }
    re += '$';
    const lit = parts.filter(p => !/^\{\d+\}$/.test(p)).join('');
    if (!JP.test(lit) && lit.replace(/\s/g, '').length < 2) continue; // 文字がほとんどない型は、なんでもつかまえるので使わない
    const pcs = parts.filter(p => p && !/^\{\d+\}$/.test(p));
    TPL.push({ re: new RegExp(re), idx, en: D[k], lit: lit.length, pcs, head: /^\{\d+\}$/.test(parts[0]) || !parts[0] ? '' : parts[0], tail: /^\{\d+\}$/.test(parts[parts.length - 1]) || !parts[parts.length - 1] ? '' : parts[parts.length - 1] });
  }
  TPL.sort((a, b) => b.lit - a.lit);
  const cache = new Map(), miss = IW3.i18nMiss = new Map();
  function fill(en, idx, caps) {
    return en.replace(/\{(\d+)(?:\|(\w+))?\}/g, (m, n, f) => {
      const i = idx.indexOf(+n); if (i < 0) return '';
      let v = caps[i]; if (f === 'raw') return v;
      v = tr1(v, true);
      if (f === 's') return /^1$/.test(String(caps[i]).trim()) ? '' : 's';
      return v;
    });
  }
  function core(s) {
    if (Object.prototype.hasOwnProperty.call(D, s)) return D[s];
    if (NAMES[s]) return NAMES[s];
    for (const t of TPL) { // 先に、型の文字がぜんぶ入っているかを見る（正規表現の行ったり来たりで遅くならないように）
      if (t.head && !s.startsWith(t.head)) continue; if (t.tail && !s.endsWith(t.tail)) continue;
      let ok = true; for (const pc of t.pcs) if (s.indexOf(pc) < 0) { ok = false; break; } if (!ok) continue;
      const m = s.match(t.re); if (m) return fill(t.en, t.idx, m.slice(1));
    }
    return null;
  }
  // 1本の文を訳す。まわりの空白は残す
  function tr1(s, inner) {
    if (s == null) return s; s = String(s);
    if (!JP.test(s)) return s;
    if (cache.has(s)) return cache.get(s);
    const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/), body = m[2].replace(/\s+/g, ' ');
    // 頭の印（★ ✓ ✗ など）は外して訳す（型の {0} に印が入らないように）
    const lead = body.match(/^([★☆✓✗✔⭐🔒💡⚠⏱🎉🏆]+\s*)(?=\S)/);
    let r = Object.prototype.hasOwnProperty.call(D, body) ? D[body] : null;
    if (r == null && lead && JP.test(body.slice(lead[1].length))) { const r0 = tr1(body.slice(lead[1].length), true); if (!JP.test(r0)) r = lead[1] + r0; }
    if (r == null) r = core(body);
    if (r == null) { // 名前・ちゃん
      const n = body.match(/^(.+?)(ちゃん|さま|様)?([・ ]増)?$/); if (n && NAMES[n[1]]) r = NAMES[n[1]] + (n[3] ? '+' : '');
    }
    if (r == null) { // 頭の記号・終わりの記号を外して探す
      const k = body.match(/^([\s「『（(【〔♪★☆✨💬🎙️👗⚙️▶◀・…]*)([\s\S]*?)([\s」』）)】〕！？!?。、…〜♪ｗ]*)$/);
      if (k && (k[1] || k[3])) {
        const r2 = core(k[2]);
        if (r2 != null) r = k[1].replace(/[「『]/g, '"').replace(/[」』]/g, '"').replace(/[（]/g, '(').replace(/[）]/g, ')') + r2 + k[3].replace(/！/g, '!').replace(/？/g, '?').replace(/[。、]/g, '').replace(/[」』]/g, '"').replace(/）/g, ')').replace(/〜/g, '~');
      }
    }
    if (r == null) { // 改行・全角スペース・「／」で分けて、1つずつ
      for (const SEP of [/(\n|　| ／ |／)/, /(\n|　| ／ |／| |・|、)/]) {
        const sp = body.split(SEP);
        if (sp.length > 1) { const rr = sp.map(p => (SEP.test(p) && p.length <= 3 ? ({ '　': '  ', '・': ' · ', '、': ', ' }[p] || p) : (JP.test(p) ? (core(p) != null ? core(p) : (NAMES[p] || null)) : p))); if (rr.every(x => x != null)) { r = rr.join(''); break; } }
      }
    }
    if (r == null) { if (!inner) miss.set(body, (miss.get(body) || 0) + 1); r = body; }
    r = m[1] + r + m[3];
    if (cache.size > 20000) cache.clear();
    cache.set(s, r); return r;
  }
  IW3.tr = (s) => tr1(s, false);

  // ---- 画面（DOM） ----
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1 };
  const INLINE = /^(B|I|EM|STRONG|SPAN|BR|SMALL|U|S|SUB|SUP|RUBY|RT|MARK|KBD|BIG|FONT)$/;
  function inlineOnly(el) { for (const c of el.children) { if (!INLINE.test(c.tagName) || !inlineOnly(c)) return false; } return true; }
  function trAttr(el) {
    for (const a of ['title', 'placeholder', 'aria-label', 'alt', 'data-t']) { const v = el.getAttribute && el.getAttribute(a); if (v && JP.test(v)) el.setAttribute(a, tr1(v)); }
    if (el.tagName === 'INPUT' && /^(button|submit|reset)$/i.test(el.type) && JP.test(el.value)) el.value = tr1(el.value);
  }
  function trEl(el) {
    if (!el || el.nodeType !== 1 || SKIP[el.tagName] || el.isContentEditable) return;
    trAttr(el);
    // 文字と小さなタグだけの要素は、まるごと（<b> 入りの文）
    if (el.children.length && inlineOnly(el) && JP.test(el.textContent)) {
      const h = el.innerHTML.replace(/\s+/g, ' ').trim(), r = core(h) ;
      if (r != null) { busy = true; el.innerHTML = r; busy = false; return; }
    }
    for (let c = el.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) trText(c);
      else if (c.nodeType === 1) trEl(c);
    }
  }
  function trText(t) {
    const v = t.nodeValue; if (!v || !JP.test(v)) return;
    const p = t.parentNode; if (p && (SKIP[p.nodeName] || p.isContentEditable)) return;
    const r = tr1(v); if (r !== v) { busy = true; t.nodeValue = r; busy = false; }
  }
  let busy = false;
  const mo = new MutationObserver((list) => {
    if (busy) return;
    const els = new Set();
    for (const m of list) {
      if (m.type === 'childList') { for (const n of m.addedNodes) { if (n.nodeType === 1) els.add(n); else if (n.nodeType === 3 && n.parentNode) els.add(n.parentNode); } }
      else if (m.type === 'characterData') { if (m.target.parentNode) els.add(m.target.parentNode); }
      else if (m.type === 'attributes') { if (m.target.nodeType === 1) trAttr(m.target); }
    }
    // 親をまるごと訳せるか（<b> 入りの文が、あとから中身だけ変わったとき）
    for (const e of els) { const p = e.parentElement; trEl(p && p.children.length && inlineOnly(p) && p !== document.body ? p : e); }
  });
  function start() {
    trEl(document.body);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder', 'aria-label', 'alt', 'value', 'data-t'] });
    document.title = tr1(document.title);
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  // canvas の文字（3D の看板など）
  const C2 = W.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
  if (C2) for (const fn of ['fillText', 'strokeText', 'measureText']) { const o = C2[fn]; C2[fn] = function (t) { const a = Array.prototype.slice.call(arguments); a[0] = tr1(t); return o.apply(this, a); }; }
  for (const fn of ['alert', 'confirm', 'prompt']) { const o = W[fn]; if (o) W[fn] = function (t) { const a = Array.prototype.slice.call(arguments); a[0] = tr1(t); return o.apply(W, a); }; }
})(window);

/* ---- src/ui/extmodel.js ---- */
// ---- インク戦闘員ウォーズ：外で作ったモデル（VRM・GLB）を、このゲームの体として使う ----
//   使い方は2つ：
//     ① 遊ぶ人が、モデルの部屋で .vrm / .glb を読み込む → ブラウザ（IndexedDB）に保存される。参照は 'idb:番号'。
//     ② 作る人が、models フォルダに置く（tools/pack_models.py で models/○○.js と models/index.js を作る）→ はじめから入っている。参照は 'dir:名前'。
//   読み込んだモデルを、今のゲームの体（女子プロレスシミュレーターの体）と同じように使えるようにそろえる：
//     骨：VRoid の名前（J_Bip_C_Hips など）ならそのまま。VRM（0.x・1.0）は中の対応表（humanBones）から。Mixamo（mixamorig:Hips など）・よくある名前（Hips・LeftUpperArm など）も読む。
//     向き：体の前を −z に（VRM 1.0 や、ふつうの GLB は ＋z を向いているので、半回転させる）。
//     大きさ：腰の高さを、ゲームの体と同じにする。
//     骨のはじめの向き：元の回転がある骨でも、ゲームの動き（太もも x＋で前など）がそのまま使えるように、「体の向きでの回転」に直して当てる（IW3.Rig が A.norm を使う）。
//     腕：A ポーズ（腕が下がっている）のモデルは、下がっている角度のぶん、腕を下ろす角度を減らす（A.armRest）。
(function (W) {
  'use strict';
  const IW3 = W.IW3 = W.IW3 || {};
  const T = () => W.RING3D.THREE;
  const EXT = IW3.EXT = {};
  // VRM の骨の名前 → ゲームの骨の名前
  const HB = { hips: 'C_Hips', spine: 'C_Spine', chest: 'C_Chest', upperChest: 'C_UpperChest', neck: 'C_Neck', head: 'C_Head' };
  for (const [s, S] of [['left', 'L'], ['right', 'R']]) {
    Object.assign(HB, { [s + 'Shoulder']: S + '_Shoulder', [s + 'UpperArm']: S + '_UpperArm', [s + 'LowerArm']: S + '_LowerArm', [s + 'Hand']: S + '_Hand', [s + 'UpperLeg']: S + '_UpperLeg', [s + 'LowerLeg']: S + '_LowerLeg', [s + 'Foot']: S + '_Foot', [s + 'Toes']: S + '_ToeBase' });
    for (const f of ['Index', 'Middle', 'Ring', 'Little']) Object.assign(HB, { [s + f + 'Proximal']: S + '_' + f + '1', [s + f + 'Intermediate']: S + '_' + f + '2', [s + f + 'Distal']: S + '_' + f + '3' });
    Object.assign(HB, { [s + 'ThumbMetacarpal']: S + '_Thumb1', [s + 'ThumbProximal']: S + '_Thumb2', [s + 'ThumbIntermediate']: S + '_Thumb2', [s + 'ThumbDistal']: S + '_Thumb3' });
  }
  // Mixamo・よくある名前 → ゲームの骨の名前（「mixamorig:」などの前置きは取ってから見る）
  const NM = { Hips: 'C_Hips', Spine: 'C_Spine', Spine1: 'C_Chest', Chest: 'C_Chest', Spine2: 'C_UpperChest', UpperChest: 'C_UpperChest', Neck: 'C_Neck', Head: 'C_Head' };
  for (const [s, S] of [['Left', 'L'], ['Right', 'R']]) {
    Object.assign(NM, { [s + 'Shoulder']: S + '_Shoulder', [s + 'Arm']: S + '_UpperArm', [s + 'UpperArm']: S + '_UpperArm', [s + 'ForeArm']: S + '_LowerArm', [s + 'LowerArm']: S + '_LowerArm', [s + 'Hand']: S + '_Hand',
      [s + 'UpLeg']: S + '_UpperLeg', [s + 'UpperLeg']: S + '_UpperLeg', [s + 'Leg']: S + '_LowerLeg', [s + 'LowerLeg']: S + '_LowerLeg', [s + 'Foot']: S + '_Foot', [s + 'ToeBase']: S + '_ToeBase', [s + 'Toes']: S + '_ToeBase' });
    for (const [f, F] of [['Index', 'Index'], ['Middle', 'Middle'], ['Ring', 'Ring'], ['Pinky', 'Little'], ['Little', 'Little'], ['Thumb', 'Thumb']]) for (const i of [1, 2, 3]) NM[s + 'Hand' + f + i] = S + '_' + F + i;
  }
  const NEED = ['C_Hips', 'C_Spine', 'C_Head', 'L_UpperArm', 'L_LowerArm', 'L_Hand', 'R_UpperArm', 'R_LowerArm', 'R_Hand', 'L_UpperLeg', 'L_LowerLeg', 'L_Foot', 'R_UpperLeg', 'R_LowerLeg', 'R_Foot'];
  EXT.parse = (buf) => new Promise((ok, bad) => { try { new W.RING3D.GLTFLoader().parse(buf, '', ok, bad); } catch (e) { bad(e); } });
  // 骨を見つける：返り値 { map: {ゲームの名前: 骨}, how: 'VRoid'|'VRM0'|'VRM1'|'名前', front: '+z'|'-z'|null }
  // いろいろな骨の名前の形（Ink20）：名前から「左右」と「どの部分か」を読む
  //   Mixamo（mixamorig:LeftArm）・Unity/Booth（Upper Arm.L）・VRChat/CATS（Left arm・Left elbow）・Unreal（upperarm_l・calf_l）・
  //   3ds Max（Bip001 L Forearm）・Blender（upper_arm.L・shin.L）・MMD（左腕・左ひじ・左足・左ひざ・左足首）など
  const PART = { hips: 'Hips', hip: 'Hips', pelvis: 'Hips', spine: 'Spine', spine0: 'Spine', spine00: 'Spine', spine01: 'Spine', chest: 'Chest', spine1: 'Chest', spine02: 'Chest', spine001: 'Chest', upperchest: 'UpperChest', spine2: 'UpperChest', spine03: 'UpperChest', spine002: 'UpperChest',
    neck: 'Neck', neck0: 'Neck', neck01: 'Neck', neck1: 'Neck', head: 'Head', shoulder: 'Shoulder', clavicle: 'Shoulder', collar: 'Shoulder', collarbone: 'Shoulder',
    upperarm: 'UpperArm', uparm: 'UpperArm', arm: 'UpperArm', lowerarm: 'LowerArm', forearm: 'LowerArm', elbow: 'LowerArm', lowarm: 'LowerArm', hand: 'Hand', wrist: 'Hand',
    upperleg: 'UpperLeg', upleg: 'UpperLeg', thigh: 'UpperLeg', leg: 'Leg?', lowerleg: 'LowerLeg', calf: 'LowerLeg', shin: 'LowerLeg', knee: 'LowerLeg', lowleg: 'LowerLeg',
    foot: 'Foot', ankle: 'Foot', toe: 'ToeBase', toes: 'ToeBase', toebase: 'ToeBase', toe0: 'ToeBase', ball: 'ToeBase' };
  const JP = { '上半身': 'Spine', '上半身2': 'Chest', '上半身3': 'UpperChest', '首': 'Neck', '頭': 'Head', '肩': 'Shoulder', '腕': 'UpperArm', 'ひじ': 'LowerArm', '肘': 'LowerArm', '手首': 'Hand',
    '足': 'UpperLeg', '脚': 'UpperLeg', 'ひざ': 'LowerLeg', '膝': 'LowerLeg', '足首': 'Foot', 'つま先': 'ToeBase', '下半身': 'Hips?' };
  const CENTER = new Set(['Hips', 'Spine', 'Chest', 'UpperChest', 'Neck', 'Head', 'Hips?']);
  const SKIP = /twist|roll|(^|[^a-z])ik([^a-z]|$)|ik$|ｉｋ|target|pole|(^|[^a-z])end$|_end|nub|helper|tip$|捩|先$|親|ダミー|dummy/i;
  function readName(raw) {
    let n = String(raw || '').normalize('NFKC'); if (!n || (SKIP.test(n) && !/つま先$/.test(n))) return null;
    n = n.replace(/^.*[:|]/, '');
    // MMD（日本語）
    let side = '', m = n.match(/^(左|右)(.*)$/); if (m) { side = m[1] === '左' ? 'L' : 'R'; n = m[2]; }
    if (JP[n]) { const k = JP[n]; return CENTER.has(k) ? (side ? null : { k: k === 'Hips?' ? k : 'C_' + k }) : (side ? { k: side + '_' + k } : null); }
    let s = n.toLowerCase().replace(/^(mixamorig\d*|armature|bip0*1|def|org|mch|jnt|bone|b|c|cc_base|rig|skeleton|root)[-_. ]+/g, '');
    s = s.replace(/^(mixamorig\d*)/, '');
    if (!side) {
      if (/left/.test(s)) { side = 'L'; s = s.replace(/left/g, ' '); }
      else if (/right/.test(s)) { side = 'R'; s = s.replace(/right/g, ' '); }
      else { const q = s.match(/(^|[^a-z])([lr])([^a-z]|$)/); if (q) { side = q[2].toUpperCase(); s = s.slice(0, q.index) + q[1] + ' ' + q[3] + s.slice(q.index + q[0].length); } }
    }
    s = s.replace(/[-_. ()]+/g, '');
    const k = PART[s]; if (!k) return null;
    if (CENTER.has(k)) return side ? null : { k: 'C_' + k };
    return side ? { k: side + '_' + k } : null;
  }
  // 骨を見つける：返り値 { map: {ゲームの名前: 骨}, how: 'VRoid'|'VRM0'|'VRM1'|'名前', names: [見つかった名前] }
  async function findBones(gltf) {
    const json = gltf.parser.json || {}, ex = json.extensions || {}, map = {};
    const node = (i) => gltf.parser.getDependency('node', i);
    let how = null;
    if (ex.VRMC_vrm && ex.VRMC_vrm.humanoid) { for (const [k, v] of Object.entries(ex.VRMC_vrm.humanoid.humanBones || {})) if (HB[k] && v && v.node != null) map[HB[k]] = await node(v.node); how = 'VRM1'; }
    else if (ex.VRM && ex.VRM.humanoid) { for (const b of ex.VRM.humanoid.humanBones || []) if (HB[b.bone] && b.node != null) map[HB[b.bone]] = await node(b.node); how = 'VRM0'; }
    if (NEED.every(n => map[n])) return { map, how };
    // 名前で読む（VRM でも足りない骨は、名前で埋める）。three.js が名前を少し変えるので、ファイルの元の名前を使う
    const orig = (o) => { const a = gltf.parser.associations && gltf.parser.associations.get(o); return a && a.nodes != null && json.nodes && json.nodes[a.nodes] ? json.nodes[a.nodes].name || o.name : o.name; };
    const names = [], all = [], cand = {}, candMesh = {}, depth = (o) => { let d = 0; while (o.parent) { d++; o = o.parent; } return d; };
    gltf.scene.traverse(o => {
      const n = orig(o); if (!n) return; if (o.isBone || /bone|joint/i.test(o.type)) names.push(n); else if (o !== gltf.scene) all.push(n + (o.isMesh ? '（形）' : ''));
      if (/^J_Bip_/.test(n)) { const k = n.slice(6); if (!map[k]) { map[k] = o; how = how || 'VRoid'; } return; }
      if (o.isSkinnedMesh) return;
      const r = readName(n); if (!r) return;
      const C = o.isMesh ? candMesh : cand; (C[r.k] = C[r.k] || []).push(o); // 骨がなく、体の部分ごとに形が分かれたモデルは、形そのものを動かす
    });
    // 同じ部分の候補がいくつもあるときは、骨（isBone）で、根元に近いもの
    const best = (L) => L.slice().sort((a, b) => (b.isBone - a.isBone) || (depth(a) - depth(b)))[0];
    for (const [k, L] of Object.entries(candMesh)) if (!cand[k]) cand[k] = L;
    for (const s of ['L', 'R']) {
      const leg = cand[s + '_Leg?']; if (!leg) continue;
      // 「leg」だけの名前：太ももの名前（UpLeg・Thigh・Upper Leg）があれば、すねのこと（Mixamo）。なければ太もも（VRChat）
      if (cand[s + '_UpperLeg']) { cand[s + '_LowerLeg'] = cand[s + '_LowerLeg'] || leg; } else cand[s + '_UpperLeg'] = leg;
    }
    let got = 0;
    for (const [k, L] of Object.entries(cand)) { if (/\?$/.test(k) || map[k]) continue; map[k] = best(L); got++; }
    // 腰：名前がないときは、MMD の「下半身」の親（センター・グルーブ）か、両足と背骨の共通の親
    if (!map.C_Hips) {
      const anc = (o) => { const L = []; while (o) { L.push(o); o = o.parent; } return L; };
      const ks = ['L_UpperLeg', 'R_UpperLeg', 'C_Spine'].filter(k => map[k]);
      if (ks.length >= 2) { const A0 = anc(map[ks[0]].parent); const hit = A0.find(o => ks.every(k => anc(map[k]).includes(o)) && o !== gltf.scene); if (hit) map.C_Hips = hit; }
      if (!map.C_Hips && cand['Hips?']) map.C_Hips = best(cand['Hips?']);
    }
    if (got && how !== 'VRM0' && how !== 'VRM1' && how !== 'VRoid') how = '名前';
    const info = 'ファイルの中身：ノード' + (json.nodes || []).length + '・メッシュ' + (json.meshes || []).length + '・スキン（骨の組）' + (json.skins || []).length + (json.extensionsUsed && json.extensionsUsed.length ? '・拡張 ' + json.extensionsUsed.join(' ') : '') + (json.asset && json.asset.generator ? '・作ったソフト ' + json.asset.generator : '');
    return { map, how: how || '名前', names, all, info };
  }
  // ===== 骨のないモデルに、骨を自動で入れる（Ink22） =====
  //   形（メッシュ）の点の並びから、腰・首・肩・手・足の場所を見つけ、ゲームの骨（J_Bip_○○）を作って、点ごとに近い骨へ結びつける。
  //   ① 上は＋y。前は、顔の部品（mouth・eye・brow など）のある側。なければ＋z（glTF の決まり）。
  //   ② 股：下から見て、まん中にすき間がある高さ（足が2本に分かれている）。腰はその少し上。
  //   ③ 首：腰より上で、前後の厚みがいちばん細い高さ。
  //   ④ 手：肩からいちばん遠い点（足の点はのぞく）。T ポーズでも、腕を下ろしていても見つかる。
  //   ⑤ 小さい部品（ボタン・口・まゆなど）は、まるごと1本の骨に。大きい形（胴・手足）は、点ごとに近い骨（となりの骨と少しまぜる）。
  function autoRig(TT, scene) {
    scene.traverse(o => { if (/^J_Bip_/.test(o.name || '')) o.name = 'old_' + o.name; }); // 何も動かさない、名前だけの骨は使わない
    scene.updateMatrixWorld(true);
    const meshes = []; scene.traverse(o => { if (o.isMesh && !o.isSkinnedMesh && o.geometry && o.geometry.attributes.position) meshes.push(o); });
    if (!meshes.length) return null;
    const P = [], v = new TT.Vector3();
    for (const m of meshes) { const a = m.geometry.attributes.position, st = Math.max(1, Math.floor(a.count / 4000)); for (let i = 0; i < a.count; i += st) { v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld); P.push([v.x, v.y, v.z]); } }
    let y0 = Infinity, y1 = -Infinity; for (const p of P) { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    const H = y1 - y0; if (!(H > 0)) return null;
    const med = (L) => { const s = L.slice().sort((a, b) => a - b); return s.length ? s[s.length >> 1] : 0; };
    const x0 = med(P.map(p => p[0])), z0 = med(P.map(p => p[2]));
    const Y = (f) => y0 + f * H, inY = (p, a, b) => p[1] >= a && p[1] < b;
    // ① 前の向き
    let fz = 1; { const F = []; for (const m of meshes) if (/mouth|eye|brow|nose|lip|口|目|眉|鼻/i.test(m.name || '') && !/eyelash|hair/i.test(m.name || '')) F.push(new TT.Box3().setFromObject(m).getCenter(new TT.Vector3()));
      if (F.length) { const zf = F.reduce((a, c) => a + c.z, 0) / F.length; const hz = med(P.filter(p => p[1] > Y(0.8)).map(p => p[2])); if (Math.abs(zf - hz) > 1e-4) fz = zf > hz ? 1 : -1; }
      else { // 顔の部品がなければ、足先：つま先は前に長く出る
        const kz = med(P.filter(p => inY(p, Y(0.2), Y(0.3))).map(p => p[2])), F2 = P.filter(p => p[1] < Y(0.04)).map(p => p[2]);
        if (F2.length > 4) { const mx = Math.max(...F2) - kz, mn = kz - Math.min(...F2); if (Math.abs(mx - mn) > 0.01 * H) fz = mx > mn ? 1 : -1; } } }
    const ls = fz; // 前が＋z なら、体の左は＋x
    // ② 股
    const NS = 80, g = 0.012 * H; let crotch = null;
    for (let i = 2; i < NS * 0.62; i++) {
      const a = Y(i / NS), b = Y((i + 1) / NS), S = P.filter(p => inY(p, a, b)); if (S.length < 6) continue;
      const gap = !S.some(p => Math.abs(p[0] - x0) < g), both = S.some(p => p[0] > x0 + g) && S.some(p => p[0] < x0 - g);
      if (gap && both) crotch = b; // いちばん高いすき間（ひざがくっついていても、その上でまた分かれる）
    }
    // 首（③）を先に見つけて、股が低すぎるとき（スカート・足がくっついている）は、首の高さから腰を決める
    // 首：腰より上で、前後の厚みがいちばん細い高さ。同じくらい細い所がいくつもあるとき（部品を積んだ形など）は、いちばん上（頭のすぐ下）
    const neckOf = (hy) => { const L = [];
      for (let i = 0; i < 40; i++) { const f = 0.45 + 0.43 * i / 40, a = hy + (y1 - hy) * f, b = a + (y1 - hy) / 40; const S = P.filter(p => inY(p, a, b) && Math.abs(p[0] - x0) < 0.12 * H); if (S.length < 4) continue;
        let lo = Infinity, hi = -Infinity; for (const p of S) { if (p[2] < lo) lo = p[2]; if (p[2] > hi) hi = p[2]; } L.push([hi - lo, (a + b) / 2]); }
      if (!L.length) return Y(0.84); const mn = Math.min(...L.map(x => x[0])); return Math.max(...L.filter(x => x[0] <= mn * 1.2 + 0.002 * H).map(x => x[1])); };
    let hipY = crotch != null ? crotch + 0.035 * H : null;
    const n0 = neckOf(Y(0.4)), hipByNeck = y0 + (n0 - y0) * 0.62;
    if (hipY == null || hipY < y0 + (hipByNeck - y0) * 0.75) hipY = hipByNeck;
    hipY = Math.min(Y(0.62), Math.max(Y(0.25), hipY));
    // 足の場所
    const legS = P.filter(p => inY(p, y0 + (hipY - y0) * 0.45, y0 + (hipY - y0) * 0.65));
    const legX = (s) => { const L = legS.filter(p => (p[0] - x0) * s > g); return L.length ? med(L.map(p => p[0])) : x0 + s * 0.05 * H; };
    const legR = (s, lx) => { const L = legS.filter(p => (p[0] - x0) * s > g).map(p => Math.abs(p[0] - lx)); return L.length ? Math.max(0.02 * H, med(L) * 1.8) : 0.05 * H; };
    // ③ 首：前後の厚みがいちばん細い高さ（腕は前後にはあまり出ないので、厚みで見る）
    const neckY = neckOf(hipY);
    const tor = neckY - hipY, shY = neckY - 0.15 * tor;
    // 胸の幅（肩の横の位置）
    const chS = P.filter(p => inY(p, hipY + tor * 0.55, hipY + tor * 0.7) && Math.abs(p[0] - x0) < 0.2 * H).map(p => Math.abs(p[0] - x0)).sort((a, b) => a - b);
    const shX = chS.length ? Math.max(0.05 * H, chS[Math.floor(chS.length * 0.92)] * 0.85) : 0.1 * H;
    // ④ 手の先：肩からいちばん遠い点（足の点はのぞく）
    const arm = (s) => {
      const sh = [x0 + s * shX, shY, z0], lx = legX(s), lr = legR(s, lx), side = P.filter(p => (p[0] - x0) * s > 0);
      let far = null;
      // 腕を横に広げている（T・A ポーズ）：体から大きく横に出た点のうち、肩からいちばん遠い点
      const out = side.filter(p => (p[0] - x0) * s > 0.16 * H && p[1] > hipY - 0.15 * H && p[1] < neckY + 0.05 * H);
      if (out.length > Math.max(8, side.length * 0.01)) { let fd = -1; for (const p of out) { const d = Math.hypot(p[0] - sh[0], p[1] - sh[1], p[2] - sh[2]); if (d > fd) { fd = d; far = p; } } }
      else { // 腕を下ろしている：上から1段ずつ見て、胴とのあいだにすき間がある外側のかたまり（腕）を、いちばん下まで追う
        const st = 0.012 * H; let miss = 0, low = null;
        for (let y = shY - 0.06 * H; y > Y(0.15); y -= st) {
          const S = side.filter(p => inY(p, y - st, y)).map(p => [(p[0] - x0) * s, p]).filter(q => q[0] > 0.02 * H).sort((A, B) => A[0] - B[0]);
          let cut = -1, gmax = 0.012 * H; for (let i = 1; i < S.length; i++) { const gg = S[i][0] - S[i - 1][0]; if (gg > gmax) { gmax = gg; cut = i; } }
          if (cut > 0 && S.length - cut >= 2) { const O = S.slice(cut).map(q => q[1]); low = [O.reduce((a, p) => a + p[0], 0) / O.length, y - st, O.reduce((a, p) => a + p[2], 0) / O.length]; miss = 0; }
          else if (low && ++miss > 3) break;
        }
        far = low;
      }
      if (!far) far = [sh[0] + s * 0.05 * H, sh[1] - 0.35 * H, z0];
      const t = (k) => [sh[0] + (far[0] - sh[0]) * k, sh[1] + (far[1] - sh[1]) * k, sh[2] + (far[2] - sh[2]) * k];
      return { sh, el: t(0.46), wr: t(0.83), tip: far, lx, lr };
    };
    const J = {};
    J.C_Hips = [x0, hipY, z0]; J.C_Spine = [x0, hipY + tor * 0.22, z0]; J.C_Chest = [x0, hipY + tor * 0.5, z0]; J.C_UpperChest = [x0, hipY + tor * 0.75, z0];
    J.C_Neck = [x0, neckY - 0.04 * tor, z0]; J.C_Head = [x0, neckY + 0.05 * tor, z0]; const top = [x0, y1, z0];
    const TIP = {};
    for (const [S, s] of [['L', ls], ['R', -ls]]) {
      const A = arm(s); J[S + '_Shoulder'] = [x0 + s * shX * 0.3, shY + 0.02 * tor, z0]; J[S + '_UpperArm'] = A.sh; J[S + '_LowerArm'] = A.el; J[S + '_Hand'] = A.wr; TIP[S + '_Hand'] = A.tip;
      const lx = A.lx, ank = y0 + 0.06 * (hipY - y0);
      const toeZ = (() => { const L = P.filter(p => p[1] < y0 + 0.05 * H && (p[0] - x0) * s > 0).map(p => p[2] * fz); return L.length ? Math.max(...L) * fz : z0 + fz * 0.08 * H; })();
      J[S + '_UpperLeg'] = [lx, hipY - 0.04 * H, z0]; J[S + '_LowerLeg'] = [lx, ank + (hipY - 0.04 * H - ank) * 0.5, z0]; J[S + '_Foot'] = [lx, ank, z0]; J[S + '_ToeBase'] = [lx, y0 + 0.015 * H, z0 + (toeZ - z0) * 0.6]; TIP[S + '_ToeBase'] = [lx, y0 + 0.01 * H, toeZ];
    }
    const PAR = { C_Spine: 'C_Hips', C_Chest: 'C_Spine', C_UpperChest: 'C_Chest', C_Neck: 'C_UpperChest', C_Head: 'C_Neck' };
    for (const S of ['L', 'R']) Object.assign(PAR, { [S + '_Shoulder']: 'C_UpperChest', [S + '_UpperArm']: S + '_Shoulder', [S + '_LowerArm']: S + '_UpperArm', [S + '_Hand']: S + '_LowerArm', [S + '_UpperLeg']: 'C_Hips', [S + '_LowerLeg']: S + '_UpperLeg', [S + '_Foot']: S + '_LowerLeg', [S + '_ToeBase']: S + '_Foot' });
    // 骨を作る
    const names = Object.keys(J), bones = {}, list = [];
    for (const n of names) { const b = new TT.Bone(); b.name = 'J_Bip_' + n; bones[n] = b; list.push(b); }
    for (const n of names) { const b = bones[n], p = J[n], q = PAR[n] ? J[PAR[n]] : [0, 0, 0]; b.position.set(p[0] - q[0], p[1] - q[1], p[2] - q[2]); (PAR[n] ? bones[PAR[n]] : scene).add(b); }
    scene.updateMatrixWorld(true);
    // 骨ごとの線（その骨が受け持つところ）
    const kid = { C_Hips: 'C_Spine', C_Spine: 'C_Chest', C_Chest: 'C_UpperChest', C_UpperChest: 'C_Neck', C_Neck: 'C_Head' };
    for (const S of ['L', 'R']) Object.assign(kid, { [S + '_Shoulder']: S + '_UpperArm', [S + '_UpperArm']: S + '_LowerArm', [S + '_LowerArm']: S + '_Hand', [S + '_UpperLeg']: S + '_LowerLeg', [S + '_LowerLeg']: S + '_Foot', [S + '_Foot']: S + '_ToeBase' });
    const seg = names.map((n, i) => ({ n, i, a: J[n], b: kid[n] ? J[kid[n]] : n === 'C_Head' ? top : TIP[n] || J[n], side: n[0] === 'L' ? ls : n[0] === 'R' ? -ls : 0, leg: /Leg|Foot|Toe/.test(n), arm: /Arm|Hand|Shoulder/.test(n) }));
    const dseg = (p, s) => { const ax = s.b[0] - s.a[0], ay = s.b[1] - s.a[1], az = s.b[2] - s.a[2], L = ax * ax + ay * ay + az * az; let t = L ? ((p[0] - s.a[0]) * ax + (p[1] - s.a[1]) * ay + (p[2] - s.a[2]) * az) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - s.a[0] - ax * t, p[1] - s.a[1] - ay * t, p[2] - s.a[2] - az * t); };
    const ok = (p, s) => { if (p[1] > neckY && s.n !== 'C_Head' && s.n !== 'C_Neck') return false; if (s.arm && s.n.slice(2) !== 'Shoulder' && (p[0] - x0) * s.side < shX * 0.6) return false; if (s.side && (p[0] - x0) * s.side < -0.01 * H) return false; if (s.leg && p[1] > hipY + 0.06 * H) return false; if (s.arm && p[1] < hipY - 0.35 * H) return false; return true; };
    const near = (n1, n2) => PAR[n1] === n2 || PAR[n2] === n1;
    const skel = new TT.Skeleton(list);
    for (const m of meshes) {
      const g0 = m.geometry.clone(), a = g0.attributes.position, N = a.count, si = new Uint16Array(N * 4), sw = new Float32Array(N * 4);
      const box = new TT.Box3().setFromObject(m), small = box.getSize(new TT.Vector3()).length() < 0.07 * H;
      let rigid = -1; if (small) { const c = box.getCenter(new TT.Vector3()), p = [c.x, c.y, c.z]; let bd = Infinity; for (const s of seg) { if (!ok(p, s)) continue; const d = dseg(p, s); if (d < bd) { bd = d; rigid = s.i; } } }
      for (let i = 0; i < N; i++) {
        if (rigid >= 0) { si[i * 4] = rigid; sw[i * 4] = 1; continue; }
        v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld); const p = [v.x, v.y, v.z];
        let b1 = null, d1 = Infinity, b2 = null, d2 = Infinity;
        for (const s of seg) { if (!ok(p, s)) continue; const d = dseg(p, s); if (d < d1) { b2 = b1; d2 = d1; b1 = s; d1 = d; } else if (d < d2) { b2 = s; d2 = d; } }
        if (!b1) { si[i * 4] = 0; sw[i * 4] = 1; continue; }
        if (b2 && near(b1.n, b2.n) && d2 < d1 * 1.6 + 0.01 * H) { const w1 = 1 / Math.pow(d1 + 1e-4 * H, 3), w2 = 1 / Math.pow(d2 + 1e-4 * H, 3); si[i * 4] = b1.i; si[i * 4 + 1] = b2.i; sw[i * 4] = w1 / (w1 + w2); sw[i * 4 + 1] = w2 / (w1 + w2); }
        else { si[i * 4] = b1.i; sw[i * 4] = 1; }
      }
      g0.setAttribute('skinIndex', new TT.Uint16BufferAttribute(si, 4)); g0.setAttribute('skinWeight', new TT.Float32BufferAttribute(sw, 4));
      const sm = new TT.SkinnedMesh(g0, m.material); sm.name = m.name; sm.userData.srcName = m.userData.srcName; sm.position.copy(m.position); sm.quaternion.copy(m.quaternion); sm.scale.copy(m.scale);
      sm.renderOrder = m.renderOrder; sm.visible = m.visible; const par = m.parent; par.add(sm); for (const c of [...m.children]) sm.add(c); par.remove(m);
      sm.updateMatrixWorld(true); sm.bind(skel, sm.matrixWorld);
    }
    if (W.IW_AUTODBG) W.IW_AUTODBG_OUT = { P: P.filter((_, i) => i % 3 === 0).map(p => [(p[0] - x0) / H, (p[1] - y0) / H, (p[2] - z0) / H]), J: Object.fromEntries(Object.entries(J).map(([k, p]) => [k, [(p[0] - x0) / H, (p[1] - y0) / H, (p[2] - z0) / H]])) };
    const r2 = (p) => p.map(x => +((x) / H).toFixed(2)); return { fz, H: +H.toFixed(3), y0: +y0.toFixed(3), crotch: crotch == null ? null : +((crotch - y0) / H).toFixed(2), hip: +((hipY - y0) / H).toFixed(2), neck: +((neckY - y0) / H).toFixed(2), shX: +(shX / H).toFixed(2), J: Object.fromEntries(['L_UpperArm', 'L_Hand', 'L_UpperLeg', 'L_Foot', 'C_Head'].map(k => [k, r2(J[k].map((x, i) => x - [x0, y0, z0][i]))])) };
  }
  EXT._autoRig = autoRig; // テスト用
  // 外のモデルを、ゲームの体（Actor と同じ使い方）にする
  EXT.actor = async function (buf, opt) {
    opt = opt || {};
    const TT = T(), gltf = await EXT.parse(buf), scene = gltf.scene || gltf.scenes[0];
    { // ファイルの元の名前を覚えておく（three.js は名前を少し変えるので）。装備に使う部品を、名前で選ぶときに使う
      const J = gltf.parser.json || {}; scene.traverse(o => { const a = gltf.parser.associations && gltf.parser.associations.get(o); o.userData.srcName = (a && a.nodes != null && J.nodes && J.nodes[a.nodes] && J.nodes[a.nodes].name) || o.name || ''; }); }
    let fb = await findBones(gltf);
    // 骨（スキン）がないモデル：名前の合う部品の入れ子（部品ごと動かせる）でなければ、骨を自動で入れる
    if (!(gltf.parser.json.skins || []).length) {
      const hasMesh = (o) => { let f = false; o && o.traverse(c => { if (c.isMesh) f = true; }); return f; };
      const rigidOK = NEED.every(n => fb.map[n] && hasMesh(fb.map[n]));
      if (!rigidOK) { const r = autoRig(TT, scene); if (r) { fb = await findBones(gltf); fb.how = '骨を自動で入れた'; fb.auto = r; } }
      else fb.how = '部品ごと';
    }
    const B = fb.map;
    if (!B.C_Chest) B.C_Chest = B.C_UpperChest || B.C_Spine; if (!B.C_UpperChest) B.C_UpperChest = B.C_Chest; if (!B.C_Neck) B.C_Neck = B.C_Head;
    for (const s of ['L', 'R']) if (!B[s + '_ToeBase']) B[s + '_ToeBase'] = B[s + '_Foot'];
    const miss = NEED.filter(n => !B[n]);
    if (miss.length) {
      console.warn('骨の名前の一覧', fb.names);
      fb.names = fb.names.filter(n => !/hair|^J_Sec|skirt|bust|spring|髪|スカート/i.test(n)).concat(fb.names.filter(n => /hair|^J_Sec|skirt|bust|spring|髪|スカート/i.test(n))); // 髪・スカートの骨は後ろに
      if (!fb.names.length) throw new Error('このモデルには骨（ボーン）が入っていないので、動かせません。骨の入った形（VRM、または骨つきの GLB）で書き出してください\n（' + fb.info + '）' + (fb.all.length ? '\n（中の名前：' + fb.all.slice(0, 30).join('、') + (fb.all.length > 30 ? ' ほか' + (fb.all.length - 30) + '個' : '') + '）' : '') + '\nこの画面を送ってもらえれば、原因を調べられます');
      throw new Error('骨が見つかりません：' + miss.join('・') + '\n（' + fb.info + '）\n（モデルの中の骨の名前：' + fb.names.slice(0, 40).join('、') + (fb.names.length > 40 ? ' ほか' + (fb.names.length - 40) + '個' : '') + '）\nこの一覧を送ってもらえれば、読めるように直せます');
    }
    const group = new TT.Group(), pivot = new TT.Group(); group.add(pivot); pivot.add(scene);
    // 向き：前を −z に。ファイルの種類（VRM0 は −z、VRM1 は＋z、GLB は決まりなし）では決めつけず、骨から決める：
    //   ① 腕：左腕が −x にあれば、前は −z（体の左は −x）。逆なら、半回転させる。
    //   ② 足先の骨があれば、足先の向きでも確かめる。①と②が食いちがうときだけ、骨の名前の左右が反対のモデルとみて、名前を入れかえる（向きは足先にしたがう）。
    //   ③ opt.flip（モデルの部屋の「前後を反転」）なら、さらに半回転。
    group.updateMatrixWorld(true);
    const wp = (o) => o.getWorldPosition(new TT.Vector3());
    const armFront = wp(B.L_UpperArm).x < wp(B.R_UpperArm).x ? '-z' : '+z';
    let toeFront = null;
    if (B.L_ToeBase !== B.L_Foot) { const f = wp(B.L_Foot).add(wp(B.R_Foot)), t = wp(B.L_ToeBase).add(wp(B.R_ToeBase)); if (Math.abs(t.z - f.z) > 1e-3) toeFront = t.z > f.z ? '+z' : '-z'; }
    let front = armFront, swapped = false;
    if (toeFront && toeFront !== armFront) { for (const k of Object.keys(B)) if (/^L_/.test(k)) { const r = 'R_' + k.slice(2), x = B[k]; B[k] = B[r]; B[r] = x; } front = toeFront; swapped = true; }
    if ((front === '+z') !== !!opt.flip) pivot.rotation.y = Math.PI;
    group.updateMatrixWorld(true);
    // 大きさ：腰の高さを、ゲームの体と同じに
    const box = new TT.Box3().setFromObject(scene), hipY = wp(B.C_Hips).y, ground = box.min.y;
    const s = (opt.hip || 0.87) / Math.max(0.05, hipY - ground);
    pivot.scale.setScalar(s); group.updateMatrixWorld(true);
    pivot.position.y = -wp(B.C_Hips).y; group.updateMatrixWorld(true);
    const A = { auto: fb.auto, ext: true, how: fb.how + (swapped ? '（左右の名前を直した）' : ''), front: pivot.rotation.y ? '＋z→回した' : '−z', model: scene, group, pivot, bones: {}, base: {}, norm: {}, hipHeight: opt.hip || 0.87, height: 1, width: 1, materials: [], meshes: [] };
    for (const [k, b] of Object.entries(B)) { if (A.bones['J_Bip_' + k]) continue; A.bones['J_Bip_' + k] = b; A.base['J_Bip_' + k] = { q: b.quaternion.clone(), p: b.position.clone() }; }
    // 骨のはじめの向き：親の骨の、体から見た回転（IW3.Rig が、動きを体の向きでの回転に直すのに使う）
    const gInv = new TT.Quaternion(); group.getWorldQuaternion(gInv); gInv.invert();
    for (const [n, b] of Object.entries(A.bones)) { const P = gInv.clone().multiply(b.parent.getWorldQuaternion(new TT.Quaternion())); A.norm[n] = { P, Pi: P.clone().invert() }; }
    // 腕の下がり具合（A ポーズ）：肩→ひじが、水平からどれだけ下がっているか
    const inv = group.matrixWorld.clone().invert(), lp = (n) => wp(A.bones['J_Bip_' + n]).applyMatrix4(inv);
    const down = (sd) => { const a = lp(sd + '_UpperArm'), e = lp(sd + '_LowerArm'); return Math.atan2(-(e.y - a.y), Math.abs(e.x - a.x)); };
    A.armRest = { L: down('L'), R: down('R') };
    // 材質・メッシュ・三角形の数
    let tris = 0; const mats = new Set();
    scene.traverse(o => {
      if (!o.isMesh) return; A.meshes.push(o); o.frustumCulled = false; o.castShadow = false;
      const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) mats.add(m);
    });
    A.materials = [...mats]; A.tris = Math.round(tris);
    // スライムの色に寄せる（tint：0〜1）
    if (opt.tint && opt.tintColor != null) { const c = new TT.Color(opt.tintColor); for (const m of A.materials) if (m.color) m.color.lerp(c, opt.tint); }
    A.skeletons = [...new Set(A.meshes.filter(o => o.isSkinnedMesh).map(o => o.skeleton))];
    A.update = () => { group.updateMatrixWorld(true); for (const k of A.skeletons) k.update(); };
    A.bone = (n) => wp(A.bones['J_Bip_' + n]);
    // ゲームの体と同じ pose：骨を元に戻して、腕を下ろす（体の向きでの回転）
    A.pose = (p, x, z, yaw) => {
      for (const [n, b] of Object.entries(A.bones)) { b.quaternion.copy(A.base[n].q); b.position.copy(A.base[n].p); }
      group.position.set(x || 0, A.hipHeight * A.height, z || 0); group.rotation.set(0, yaw || 0, 0);
      const e = new TT.Euler(), q = new TT.Quaternion();
      for (const [k, v] of [['L_UpperArm', [0, 0, 1.32 - A.armRest.L]], ['R_UpperArm', [0, 0, -1.32 + A.armRest.R]], ['L_LowerArm', [0, -0.35, 0]], ['R_LowerArm', [0, 0.35, 0]]]) {
        const n = 'J_Bip_' + k, b = A.bones[n], N = A.norm[n]; q.setFromEuler(e.set(v[0], v[1], v[2])); b.quaternion.copy(N.Pi.clone().multiply(q).multiply(N.P).multiply(A.base[n].q));
      }
      A.update();
    };
    A.dispose = () => { group.removeFromParent(); };
    A.pose({}, 0, 0, 0);
    return A;
  };

  // ===== 保存（遊ぶ人が読み込んだモデル）：IndexedDB =====
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((ok, bad) => { const r = indexedDB.open('inkwar', 1); r.onupgradeneeded = () => r.result.createObjectStore('models', { keyPath: 'id' }); r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error); }));
  const tx = async (mode, fn) => { const d = await db(); return new Promise((ok, bad) => { const t = d.transaction('models', mode), st = t.objectStore('models'); const r = fn(st); t.oncomplete = () => ok(r && r.result); t.onerror = () => bad(t.error); }); };
  EXT.save = async (name, buf, info) => { const id = 'm' + Date.now().toString(36); NAMES['idb:' + id] = name; await tx('readwrite', st => st.put(Object.assign({ id, name, size: buf.byteLength, data: buf, at: Date.now() }, info || {}))); return 'idb:' + id; };
  // 設定の控え（localStorage がいっぱいで保存できないときの代わり）
  EXT.setKV = (v) => tx('readwrite', st => st.put({ id: '_set', v })).catch(() => { });
  EXT.getKV = async () => { try { const o = await tx('readonly', st => st.get('_set')); return o ? o.v : null; } catch (e) { return null; } };
  // 装備のパーツ（GLB）：モデルとは別の一覧
  EXT.listParts = async () => { try { const L = await tx('readonly', st => st.getAll()); return ((W.IW_MODELS && W.IW_MODELS.list) || []).filter(o => o.kind === 'part').map(o => ({ ref: 'dir:' + o.name, name: o.name })).concat((L || []).filter(o => o.kind === 'part').map(o => ({ ref: 'idb:' + o.id, name: o.name }))); } catch (e) { return []; } };
  EXT.remove = (ref) => tx('readwrite', st => st.delete(ref.replace(/^idb:/, '')));
  EXT.listSaved = async () => { try { const L = await tx('readonly', st => st.getAll()); return (L || []).filter(o => o.id !== '_set' && o.kind !== 'part').map(o => ({ ref: 'idb:' + o.id, name: o.name, size: o.size, tris: o.tris, from: 'ブラウザ' })); } catch (e) { return []; } };
  // ===== models フォルダ（作る人が入れておく） =====
  //   models/index.js：window.IW_MODELS = { list: [{ name, file, tris }], assign: { minions: { 0: 'dir:名前' }, hero: 'dir:名前' } }
  //   models/○○.js：(window.IW_MODEL_DATA = window.IW_MODEL_DATA || {})['名前'] = 'base64…'
  EXT.listFolder = () => ((W.IW_MODELS && W.IW_MODELS.list) || []).filter(o => o.kind !== 'part').map(o => ({ ref: 'dir:' + o.name, name: o.name, size: o.size, tris: o.tris, from: 'models フォルダ' }));
  const loadScript = (src) => new Promise((ok, bad) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => bad(new Error(src + ' が読めません')); document.head.appendChild(s); });
  const b64 = (s) => { const t = atob(s), u = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u.buffer; };
  const BUF = {};
  EXT.getBuf = async function (ref) {
    if (BUF[ref]) return BUF[ref];
    if (/^idb:/.test(ref)) { const o = await tx('readonly', st => st.get(ref.slice(4))); if (!o) throw new Error('保存したモデルが見つかりません（消されたかも）'); return (BUF[ref] = o.data); }
    if (/^dir:/.test(ref)) {
      const name = ref.slice(4), it = ((W.IW_MODELS && W.IW_MODELS.list) || []).find(o => o.name === name); if (!it) throw new Error('models フォルダに「' + name + '」がありません');
      if (!(W.IW_MODEL_DATA && W.IW_MODEL_DATA[name])) await loadScript(it.file);
      return (BUF[ref] = b64(W.IW_MODEL_DATA[name]));
    }
    throw new Error('モデルの参照がちがいます：' + ref);
  };
  EXT.list = async () => EXT.listFolder().concat(await EXT.listSaved());
  const NAMES = {};
  EXT.nameOf = async (ref) => { if (NAMES[ref]) return NAMES[ref]; const L = await EXT.list(); L.forEach(x => NAMES[x.ref] = x.name); const o = L.find(x => x.ref === ref); return o ? o.name : ref; };
})(typeof window !== 'undefined' ? window : globalThis);

/* ---- src/ui/models3d.js ---- */
// ---- インク戦闘員ウォーズ：3Dの体（Ink86〜：3Dキャラ工房の体・顔・髪。骨は女子プロレスシミュレーターの体と同じ） ----
//   戦闘員：ヘルメットはかぶらない（Ink02 で外した）。髪型は組ごとにちがう。体は「元の体」を組ごとに数人だけ作り、あとは複製して使う。
//     付けるもの：お腹のベリータンク（中のインクが光る。満タンはこのタンクのこと）・両わきの下のツインキャノン・右の腰のロングホース・背中のホールタンク（下の穴からインクを噴いて、ジャンプ噴射）。
//   ヒーロー：髪あり・ヒーロースーツ。手にレーザーブレード（光る棒）。
//   IW3.Rig：複製した体の骨を、名前で動かす（Actor.pose と同じやり方：元の向き × 足したい回転）。
(function (W) {
  'use strict';
  const IW3 = W.IW3 = W.IW3 || {};
  const T = () => W.RING3D && W.RING3D.THREE;
  IW3.INK = { ink: 0xb04df0, red: 0xf0466e, white: 0x3ec6ff, hero: 0x2f7bff, sticky: 0xffd23a };
  function tok(v, pal) {
    if (typeof v !== 'string') return v;
    const m = /^\$(\d)([+-][\d.]+)?$/.exec(v); if (!m) return v;
    const TT = T(), c = new TT.Color(pal[+m[1] - 1]);
    if (m[2]) { const o = {}; c.getHSL(o); c.setHSL(o.h, o.s, Math.min(0.95, Math.max(0.06, o.l + (+m[2])))); }
    return '#' + c.getHexString();
  }
  function sub(o, pal) { if (Array.isArray(o)) return o.map(x => sub(x, pal)); if (o && typeof o === 'object') { const r = {}; for (const k in o) r[k] = sub(o[k], pal); return r; } return tok(o, pal); }
  const STRIP = ['knee', 'kneeCap', 'elbow', 'armband', 'armSide', 'glove', 'gloveLong', 'wrist', 'thighBand', 'thighStripe', 'thighSide'];
  IW3.person = function (no, outfit, pal, hair, hairColor, eye, base, keepPads, skin) {
    const P = YR.lookPresets, O = P.outfit.find(x => x.id === outfit) || P.outfit[0], H = P.hair.find(x => x.id === hair) || P.hair[0];
    const look = sub(O.L, pal);
    if (!keepPads) for (const k of STRIP) delete look[k];
    look.vrecipe = sub(H.r, pal); look.hair = H.cat; look.hairId = H.id; /* Ink86：髪は 3Dキャラ工房の髪（H.id と同じ形） */ look.hairColor = hairColor || '#6b3a22';
    look.face = { eye: eye || 'ブラウン', base: base || '笑顔', skin: skin || '普通' }; look._noFix = true;
    return { no, name: 'p' + no, look };
  };
  const CANNON_OUT = 0.005, CANNON_DOWN = 0.12; // わきの下の、キャノンの位置（肩の骨からの、外・下へのずれ）
  const mat = (c, o) => { const TT = T(); return new TT.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.45, metalness: 0.15 }, o || {})); };
  // 体の骨に、小物を付ける
  // 小物は「体の前が −z、上が +y」の向きで置いてから、骨にくっつける（骨ごとの向きのちがいを気にしなくていい）
  // 装備の位置（モデルの部屋で、型ごとに変えられる）：on＝見せる、x＝横（キャノン・ホースは外へ、タンクは右へ）、y＝上、z＝前、単位は cm。s＝大きさ
  IW3.GEAR_PARTS = [['tank', 'ベリータンク（お腹）'], ['cannon', 'ツインキャノン（わき）'], ['hose', 'ロングホース（腰）'], ['pack', 'ホールタンク（背中）']];
  IW3.GEAR_STYLES = { tank: [['std', 'カプセル（標準）'], ['round', 'まるいタンク'], ['slim', 'うすいパネル（体になじむ）'], ['vials', '小びんのベルト']], cannon: [['std', '砲身（標準）'], ['short', '太くて短い'], ['twin', '2連の砲身'], ['pod', '小さいポッド（体になじむ）']], hose: [['std', 'ノズル（標準）'], ['pistol', '水てっぽう'], ['slim', '細いノズル（体になじむ）']], pack: [['std', '円いタンク（標準）'], ['twin', '2本のタンク'], ['slim', 'うすいリュック（体になじむ）']] };
  // 装備の動き（毎フレーム）：ホースはいつもゆらゆら、キャノン・タンクは動くとタプタプ。tilt＝放物線で撃つときの傾き
  //   v：{ tank, cannons, hose, pack, tilt, jig, id, popping }。中の入れ物（aim）を動かすので、はじけるときのふくらみ（外の入れ物）とまざらない
  IW3.gearTick = function (v, t, moving) {
    const dt = Math.min(0.1, Math.max(0, t - (v._gt != null ? v._gt : t))); v._gt = t; // 時間で計算（遅い端末でも同じ速さ）
    v.jig = Math.max(0, (v.jig || 0) * Math.exp(-dt * 2.2) + (moving ? dt * 3.5 : 0)); if (v.popping) return;
    const inner = (o) => o && o.visible && o.userData.aim ? o.children[0] : null, J = Math.min(1.2, v.jig), ph = (v.id || 0) * 1.7, tl = v.tilt || 0;
    const jig = (q, sp, amp) => { const a = amp * J * Math.sin(t * sp + ph); q.scale.set(1 + a * 0.6, 1 - a, 1 + a * 0.6); };
    const q1 = inner(v.tank); if (q1) jig(q1, 17, 0.14);
    const q4 = inner(v.pack); if (q4) jig(q4, 15, 0.09);
    for (const c of v.cannons || []) { const q = inner(c); if (!q) continue; jig(q, 19, 0.12); if (v.fireSwell) q.scale.multiplyScalar(1 + v.fireSwell); q.rotation.x = tl + 0.09 * J * Math.sin(t * 13 + ph); }
    const h = inner(v.hose); if (h) { const calm = 1 - Math.min(1, tl * 2); h.rotation.x = tl + 0.04 * Math.sin(t * 2.3 + ph) * calm; h.rotation.y = (0.16 * Math.sin(t * 1.6 + ph) + 0.07 * Math.sin(t * 3.7 + ph)) * calm; h.rotation.z = 0.05 * Math.sin(t * 2.1 + ph * 0.5); jig(h, 16, 0.04); }
  };
  // 撃つときに動く部分（砲身・口）。部品ごとに userData.pumpIdx（番号）で持つ。モデルの部品を使うときは、まるごと
  IW3.gearPumpParts = function (v, exit) {
    const pp = (o, def) => { if (!o || !o.visible) return null; const q = o.userData.aim ? o.children[0] : o; if (!q) return null; if (q.userData.whole) { const L = [q]; L.back = q.userData.back; return L; }
      const L = (q.userData.pumpIdx || def).map(i => q.children[i]).filter(Boolean); L.back = q.userData.back; return L; };
    if (exit === 'cannon') return (v.cannons || []).filter(Boolean).map(c => pp(c, [0, 1])).filter(Boolean);
    const h = v.hose && pp(v.hose, [1, 2, 3]); return h ? [h] : [];
  };
  // 撃つときの傾き（ラジアン）：キャノンは放物線のとき 35〜45°。ホースは型ごとに決めた角度（まっすぐ angN・放物線 angL）
  IW3.gearAngle = function (v, exit, lob) {
    const c = (v.gcfg && v.gcfg.hose) || {};
    if (exit === 'cannon') return lob ? (35 + Math.random() * 10) * Math.PI / 180 : 0;
    return (lob ? (c.angL != null ? c.angL : 40) : (c.angN || 0)) * Math.PI / 180;
  };
  // 撃つ動き（試合とモデルの部屋の両方で使う）：o = { tw（tween）, ang, n, onShot(i, big, hold) }。hold＝最後の突き出したまま撃つインク
  //   小：引っこむ → 前へ突き出す。大：もっと深く引っこんで、もっと前へ突き出す。キャノンの大は、その前に一度ふくらんで、元にもどる
  //   どちらにするかは、型の「撃つ動き」（小・大・まぜる）
  IW3.gearFire = async function (v, exit, o) {
    const tw = o.tw, can = exit === 'cannon', mode = ((v.gcfg && v.gcfg[exit]) || {}).motion || 'mix';
    const t0 = v.tilt || 0, ang = o.ang || 0; if (Math.abs(ang - t0) > 0.01) await tw(160, (t) => { v.tilt = t0 + (ang - t0) * t; });
    const G2 = IW3.gearPumpParts(v, exit);
    const setZ = (k) => { for (const g of G2) { const bk = g.back != null ? g.back : (can ? 0.06 : 0.07); for (const q of g) if (q) IW3.gearSlide(q, bk * k); } };
    const n = o.n || (2 + (Math.random() < 0.5 ? 1 : 0));
    for (let i = 0; i < n; i++) {
      const last = i === n - 1, big = mode === 'big' || (mode === 'mix' && Math.random() < 0.5);
      // 最後の1回：ほとんど下がらず、いつもの 1.5 倍突き出して、しばらく突き出したまま撃ちつづける
      const depth = last ? 0.25 : (big ? 1.7 : 1), push = (big ? 1.4 : 0.5) * (last ? 1.5 : 1);
      if (big && can && !last) { await tw(140, (t) => { v.fireSwell = 0.35 * Math.sin(t * Math.PI / 2); }); await tw(120, (t) => { v.fireSwell = 0.35 * (1 - t); }); v.fireSwell = 0; }
      await tw(last ? 70 : (big ? 150 : 110), (t) => setZ(depth * t));
      if (o.onShot) o.onShot(i, big, false); v.jig = Math.min(1.6, (v.jig || 0) + (big ? 0.9 : 0.6));
      await tw(big ? 85 : 70, (t) => setZ(depth - (depth + push) * t));
      if (last) { for (let j = 0; j < 4; j++) { await tw(110, () => setZ(-push)); if (o.onShot) o.onShot(i, big, true); v.jig = Math.min(1.6, (v.jig || 0) + 0.3); } await tw(160, () => setZ(-push)); }
      await tw(last ? 220 : (big ? 120 : 70), (t) => setZ(-push * (1 - t)));
    }
    setZ(0);
  };
  // 撃つときに、前後へすべらせる：中の入れ物（aim）ごと動かすとき（モデルの部品など）は、傾けた向きにそって動かす
  IW3.gearSlide = function (o, d) {
    const u = o.userData; if (!u.p0) u.p0 = [o.position.x, o.position.y, o.position.z];
    if (u.isAimRoot) { const w = new (T().Vector3)(0, 0, d).applyQuaternion(o.quaternion); o.position.set(u.p0[0] + w.x, u.p0[1] + w.y, u.p0[2] + w.z); }
    else o.position.set(u.p0[0], u.p0[1], u.p0[2] + d);
  };
  // 服・靴を外す（モデルの部屋の「服・靴」）。自分で作った服や靴に入れかえるときに、まず外す
  //   ゲームの体：服は体にぬった色（ペイント）なので、服の色をぜんぶ肌の色にする（肌の色が変わっても、いっしょに変わる）。スカートと、骨に付いた飾り（ボタン・ひもなど）はかくす
  //   外のモデル：名前に face.hideNames の言葉が入っている部品をかくす。face.skinNames の言葉が入っている部品は、肌の色にぬる（ペイントだけの服など）
  const BARE_K = [0.93, 0.74, 0.62]; // 赤・緑・青ごと（服の所の写り方に合わせて、試して決めた）
  const bareCol = (c, sk) => c.setRGB(sk.r * BARE_K[0], sk.g * BARE_K[1], sk.b * BARE_K[2]);
  IW3.undress = function (A, face, skinHex) {
    if (!face) return; const TT = T();
    const kw = (s) => String(s || '').toLowerCase().split(/[,、\s]+/).filter(Boolean);
    const hit = (o, K) => { for (let q = o; q && q !== A.group; q = q.parent) { const n = String((q.userData && q.userData.srcName) || q.name || '').toLowerCase(); if (n && K.some(k => n.includes(k))) return true; } return false; };
    if (A.ext) {
      const H = kw(face.hideNames), S = kw(face.skinNames); if (!H.length && !S.length) return;
      A.model.traverse(o => { if (!o.isMesh) return; if (H.length && hit(o, H)) o.visible = false;
        else if (S.length && hit(o, S)) { const f = (m) => { m = m.clone(); if (m.color) m.color.setHex(skinHex); if ('map' in m) m.map = null; m.needsUpdate = true; return m; }; o.material = Array.isArray(o.material) ? o.material.map(f) : f(o.material); } });
      return;
    }
    if (!face.bare) return;
    A.model.traverse(o => { if (!o.isMesh) return; if (o.name === 'Bodybaked_1' || (!o.name && o.parent && /^J_Bip_/.test(o.parent.name || ''))) o.visible = false; });
    const KEEP = new Set(['uSkin', 'uIris', 'uPink', 'uMarkColor', 'uMaskColor']);
    for (const m of A.materials || []) {
      if (!m.userData || !m.userData.skin || !m.onBeforeCompile || m.userData.bareDone) continue; m.userData.bareDone = true;
      const ob = m.onBeforeCompile;
      // 服の所は、同じ色でも明るく写るので、肌の色を少し暗くした色（BARE_K）にする。肌の色が変わったら、描く前に追いかける
      const cc = new TT.Color(), U = { value: cc }; m.userData.bareU = U;
      m.onBeforeCompile = function (sh, r) { ob.call(this, sh, r); const sk = sh.uniforms.uSkin; if (!sk) return; m.userData.bareSkin = sk; bareCol(cc, sk.value);
        for (const k in sh.uniforms) { const u = sh.uniforms[k]; if (/^u[A-Z]/.test(k) && !KEEP.has(k) && u && u.value && u.value.isColor) sh.uniforms[k] = U; } }; // 服の色（u〜）だけ。three.js の色（diffuse など）はそのまま
      m.needsUpdate = true;
    }
    A.model.traverse(o => { if (!o.isMesh || !o.material || !o.material.userData || !o.material.userData.bareU) return; const m = o.material, ob2 = o.onBeforeRender;
      o.onBeforeRender = function (...a) { const sk = m.userData.bareSkin; if (sk) bareCol(m.userData.bareU.value, sk.value); if (ob2) ob2.apply(this, a); }; });
  };
  // ===== 表情（状況に合わせて変わる） =====
  //   ゲームの体の顔は、まばたきや口の形（モーフ）を混ぜて表情を作る。番号と強さは、女子プロレスシミュレーターの表情（visual.js の FACE）と同じ
  //   v.expr＋v.exprUntil があればそれ（セリフなどで一時的に）、なければ v.mode とインク漏れなどの状態から決める。その子の「表情」（型の性格）も少し混ぜる
  const FACEX = { neutral: {}, calm: { 11: .2 }, spirit: { 5: .75, 11: .45, 32: .3 }, anger: { 0: 1, 32: .4 }, smirk: { 1: .55, 5: .45, 11: .3 }, pain: { 20: 1, 8: .65, 32: .6 }, scream: { 20: 1, 8: .55, 28: 1 },
    surprise: { 19: .9, 9: .7, 28: .5 }, roar: { 5: 1, 11: .55, 28: 1 }, tired: { 3: .6, 12: .35, 28: .15 }, joy: { 1: 1, 28: .3 }, puzzled: { 19: .35, 9: .5 }, /* Ink89：joy は目を開けた笑顔（前は目を閉じた大笑い＝cheer と同じ形）。puzzled：きょとん */ focus: { 5: .4, 11: .6 },
    worried: { 3: .45, 8: .45, 12: .2 }, cheer: { 2: 1, 28: .35 }, fear: { 19: .6, 8: .7, 20: .4, 28: .4 } };
  IW3.FACEX = FACEX;
  IW3.exprOfMode = function (v) {
    const m = v.mode, u = v.u || {}, hero = v.kind === 'hero';
    const M = { cannonW: 'focus', hoseW: 'focus', cannon: 'roar', hose: 'spirit', shock: 'surprise', hurt: hero ? 'pain' : 'scream', swell: 'scream', red: 'scream', leak: 'worried', sit: 'tired', cheer: 'cheer', kneel: 'pain', jump: 'spirit', fly: 'spirit', dodge: 'surprise', slash: 'anger', aimL: 'focus', spin: 'surprise', down: 'pain', slime: 'joy' };
    if (v.reload) return 'focus';
    if (M[m]) return M[m];
    if (u.state === 'leak') return u.sit ? 'tired' : 'worried'; // インク漏れ（爆発寸前）は、不安な顔のまま
    if (u.full) return 'smirk'; // 満タンは、ちょっと得意げ
    return hero && v.form === 'slime' ? 'joy' : 'calm';
  };
  IW3.faceTick = function (v, now) {
    if (v.model === 'ext' || (v.A && v.A.ext)) return; // 外のモデルは、顔のモーフの並びがちがうので動かさない
    if (!v.faceM || v.faceRoot !== v.root) { v.faceRoot = v.root; v.faceM = []; v.root.traverse(o => { if (o.isMesh && o.morphTargetInfluences && o.morphTargetInfluences.length && o.visible) v.faceM.push(o); }); v.faceW = new Float32Array(41); v.faceT = now; }
    if (!v.faceM.length) return;
    const dt = Math.min(0.1, Math.max(0, (now - v.faceT) / 1000)); v.faceT = now;
    const name = v.expr && v.exprUntil > now ? v.expr : IW3.exprOfMode(v);
    let tg = FACEX[name] || FACEX.calm; const P = v.persona || (v.A && v.A._persona) || {}, act = name !== 'calm' && name !== 'neutral', mix = {};
    for (const k in P) mix[k] = P[k] * (act ? .5 : 1); for (const k in tg) mix[k] = Math.max(mix[k] || 0, tg[k]);
    const kk = 1 - Math.exp(-dt * 12), Wt = v.faceW;
    for (let i = 0; i < Wt.length; i++) Wt[i] += ((mix[i] || 0) - Wt[i]) * kk;
    // まばたき（ときどき）
    if (!v.blinkAt) v.blinkAt = now + 1500 + Math.random() * 3000; const bl = now > v.blinkAt ? Math.sin(Math.min(1, (now - v.blinkAt) / 140) * Math.PI) : 0; if (now - v.blinkAt > 140) v.blinkAt = now + 1800 + Math.random() * 3500;
    for (const m of v.faceM) { const inf = m.morphTargetInfluences; for (let i = 0; i < inf.length && i < Wt.length; i++) inf[i] = Wt[i]; if (bl && inf.length > 12 && name !== 'scream' && name !== 'surprise') inf[12] = Math.max(inf[12], bl); }
  };
  IW3.gearOf = (face, k) => Object.assign({ on: true, x: 0, y: 0, z: 0, s: 1 }, (face && face.gear && face.gear[k]) || {});
  // 読み込んだパーツ（GLB）の形：ref → three の形（addGear は待てないので、先に読んでおく）
  const PART_CACHE = {};
  IW3.preloadParts = async function (face) {
    for (const [k] of IW3.GEAR_PARTS) { const g = IW3.gearOf(face, k); if (g.style !== 'ext' || !g.ext || PART_CACHE[g.ext]) continue;
      try { const gl = await IW3.EXT.parse(await IW3.EXT.getBuf(g.ext)); PART_CACHE[g.ext] = gl.scene || gl.scenes[0]; } catch (e) { console.warn('パーツが読めません', g.ext, e); } }
  };
  function addGear(A, ink, kind, face) {
    const TT = T(), B = (n) => A.bones['J_Bip_' + n], P = (n) => A.bone(n);
    A.group.updateMatrixWorld(true);
    const GA = (k, mir) => { const g = IW3.gearOf(face, k); return { g, off: (sx) => new TT.Vector3(g.x / 100 * (sx || 1), g.y / 100, -g.z / 100) }; };
    // 大きさ・見せる/かくす・角度（rx＝前後の傾き、ry＝左右の向き、rz＝ひねり。度。キャノンは左右が鏡うつし）
    const fit = (obj, k, sx) => { const g = IW3.gearOf(face, k); obj.scale.multiplyScalar(g.s || 1); if (!g.on) obj.visible = false;
      const m = sx || 1, D = Math.PI / 180; if (g.rx || g.ry || g.rz) obj.quaternion.multiply(new (T().Quaternion)().setFromEuler(new (T().Euler)((g.rx || 0) * D, (g.ry || 0) * D * m, (g.rz || 0) * D * m))); return obj; };
    const put = (bone, obj, pos) => { if (obj.userData.at) { pos = new TT.Vector3().fromArray(obj.userData.at); delete obj.userData.at; } A.group.add(obj); obj.position.copy(A.group.worldToLocal(pos.clone())); A.group.updateMatrixWorld(true); bone.attach(obj); return obj; };
    const G = {};
    const head = P('C_Head'), chest = P('C_Chest'), spine = P('C_Spine'), neck = P('C_Neck');
    const hh = head.y - neck.y; // 首から頭の骨まで
    if (kind === 'minion') {
      const inkM = mat(ink, { emissive: ink, emissiveIntensity: 0.35, roughness: 0.25, transparent: true, opacity: 0.92 });
      G.inkM = inkM;
      const glassM = mat(0xdff4ff, { transparent: true, opacity: 0.16, roughness: 0.05, depthWrite: false });
      // 部品ごとの色（本体の色）：ふつう＝黒っぽい、服の色、服の色2、インクの色、肌の色、えらんだ色
      const colOf = (g) => { const pal = (face && face.pal) || ['#2a2633', '#b04df0', '#1c1a22'];
        const c = g.col === 'outfit' ? pal[0] : g.col === 'accent' ? pal[2] : g.col === 'ink' ? '#' + ink.toString(16).padStart(6, '0') : g.col === 'skin' ? ({ 'スライム青': '#5aa0ff', 'スライム紫': '#9a6cff', 'スライム水色': '#5ae0f0' }[face && face.skin] || '#5aa0ff') : /^#/.test(g.col || '') ? g.col : '#26222e';
        return new TT.Color(c); };
      const mats = (k) => { const g = IW3.gearOf(face, k), c = colOf(g); return { g, body: mat(c), grip: mat(c.clone().lerp(new TT.Color(0xffffff), 0.18)) }; };
      const mesh = (geo, m, x, y, z, rx, ry, rz) => { const o = new TT.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0); return o; };
      const grp = (...L) => { const g = new TT.Group(); L.forEach(o => g.add(o)); return g; };
      const PI = Math.PI;
      // 読み込んだパーツ（GLB）：大きさを標準の部品にそろえて、向きを回す。色は「モデルの色のまま」か、えらんだ色
      const extPart = (k, size) => {
        const g = IW3.gearOf(face, k), src = g.ext && PART_CACHE[g.ext]; if (!src) return null;
        const o = src.clone(true), box = new TT.Box3().setFromObject(o), sz = box.getSize(new TT.Vector3()), c = box.getCenter(new TT.Vector3());
        const inner = new TT.Group(); inner.add(o); o.position.sub(c); inner.scale.setScalar(size / Math.max(1e-4, sz.x, sz.y, sz.z));
        const out = new TT.Group(); out.add(inner); out.rotation.y = (g.rot || 0) * PI / 2;
        if (g.col && g.col !== 'def') { const cc = colOf(g); o.traverse(m => { if (m.isMesh) m.material = Array.isArray(m.material) ? m.material.map(x => { x = x.clone(); x.color && x.color.copy(cc); return x; }) : (() => { const x = m.material.clone(); x.color && x.color.copy(cc); return x; })(); }); }
        const w = new TT.Group(); w.add(out); w.userData.pump = [out]; return w;
      };
      // ===== ベリータンク（お腹、表＝−z） =====
      const TANK = {
        std: (m) => { const tk = grp(mesh(new TT.CapsuleGeometry(0.068, 0.15, 6, 18), glassM, 0, 0, 0, 0, 0, PI / 2), mesh(new TT.CapsuleGeometry(0.062, 0.145, 6, 18), inkM, 0, 0, 0, 0, 0, PI / 2));
          for (const sx of [-1, 1]) tk.add(mesh(new TT.TorusGeometry(0.069, 0.008, 6, 20), m.body, sx * 0.085, 0, 0, 0, PI / 2)); tk.add(mesh(new TT.CylinderGeometry(0.018, 0.018, 0.03, 10), m.body, 0.11, 0, 0, 0, 0, PI / 2)); return tk; },
        round: (m) => grp(mesh(new TT.SphereGeometry(0.088, 18, 12), glassM), mesh(new TT.SphereGeometry(0.08, 18, 12), inkM), mesh(new TT.TorusGeometry(0.09, 0.01, 6, 24), m.body, 0, 0, 0, PI / 2), mesh(new TT.CylinderGeometry(0.02, 0.02, 0.03, 10), m.body, 0, 0.095, 0)),
        slim: (m) => grp(mesh(new TT.BoxGeometry(0.22, 0.11, 0.035), m.body, 0, 0, 0.05), mesh(new TT.BoxGeometry(0.16, 0.045, 0.012), inkM, 0, 0, 0.03), mesh(new TT.BoxGeometry(0.24, 0.02, 0.03), m.grip, 0, 0.065, 0.05)),
        vials: (m) => { const g = grp(mesh(new TT.BoxGeometry(0.28, 0.035, 0.03), m.body, 0, -0.03, 0.04)); for (const x of [-0.08, 0, 0.08]) { g.add(mesh(new TT.CylinderGeometry(0.026, 0.026, 0.1, 12), glassM, x, 0.02, 0.02)); g.add(mesh(new TT.CylinderGeometry(0.022, 0.022, 0.092, 12), inkM, x, 0.02, 0.02)); g.add(mesh(new TT.CylinderGeometry(0.028, 0.028, 0.015, 12), m.body, x, 0.075, 0.02)); } return g; },
      };
      // ===== ツインキャノン（わき、前＝−z）。userData.pump：ガシャコンで動く部分 =====
      const CANNON = {
        // 標準：球に砲身。撃つ前に砲身が球の中へ引っこんで、撃つときに前へ突き出す
        std: (m, sx) => { const t = mesh(new TT.CylinderGeometry(0.019, 0.022, 0.1, 12), m.body, 0, 0, -0.085, PI / 2), r = mesh(new TT.TorusGeometry(0.02, 0.007, 6, 14), inkM, 0, 0, -0.136);
          const c = grp(mesh(new TT.SphereGeometry(0.052, 18, 14), m.body), mesh(new TT.TorusGeometry(0.052, 0.006, 6, 24), inkM, 0, 0, 0, 0, PI / 2), t, r, mesh(new TT.BoxGeometry(0.03, 0.045, 0.05), m.grip, -sx * 0.05, 0, 0.01)); c.userData.pump = [t, r]; c.userData.back = 0.085; return c; },
        short: (m, sx) => { const t = mesh(new TT.CylinderGeometry(0.038, 0.042, 0.1, 14), m.body, 0, 0, -0.01, PI / 2), r = mesh(new TT.TorusGeometry(0.032, 0.01, 6, 16), inkM, 0, 0, -0.062); const c = grp(t, r, mesh(new TT.BoxGeometry(0.03, 0.06, 0.06), m.grip, -sx * 0.04, 0, 0.01)); c.userData.pump = [t, r]; return c; },
        twin: (m, sx) => { const L = []; for (const y of [0.022, -0.022]) { L.push(mesh(new TT.CylinderGeometry(0.015, 0.018, 0.17, 10), m.body, 0, y, 0, PI / 2), mesh(new TT.TorusGeometry(0.015, 0.006, 6, 12), inkM, 0, y, -0.088)); }
          const c = grp(...L, mesh(new TT.BoxGeometry(0.03, 0.08, 0.06), m.grip, -sx * 0.025, 0, 0.02)); c.userData.pump = L; return c; },
        pod: (m, sx) => { const b = mesh(new TT.SphereGeometry(0.04, 14, 10), m.body, 0, 0, 0); b.scale.set(0.8, 0.8, 1.5); const r = mesh(new TT.TorusGeometry(0.016, 0.007, 6, 12), inkM, 0, 0, -0.06); const c = grp(b, r); c.userData.pump = [r]; return c; },
      };
      // ===== ロングホース（右の腰、前＝−z） =====
      const HOSE = {
        std: (m) => { const n = mesh(new TT.CylinderGeometry(0.018, 0.026, 0.24, 10), m.body, 0, 0, -0.1, PI / 2), r = mesh(new TT.TorusGeometry(0.022, 0.008, 6, 12), inkM, 0, 0, -0.225), gp = mesh(new TT.CylinderGeometry(0.012, 0.012, 0.06, 8), m.grip, 0, 0.045, -0.02);
          const h = grp(mesh(new TT.BoxGeometry(0.05, 0.07, 0.12), m.body, 0, 0, 0.02), n, r, gp); h.userData.pump = [n, r, gp]; return h; },
        pistol: (m) => { const br = mesh(new TT.CylinderGeometry(0.016, 0.02, 0.16, 10), m.body, 0, 0.01, -0.07, PI / 2), r = mesh(new TT.TorusGeometry(0.018, 0.007, 6, 12), inkM, 0, 0.01, -0.155), bub = mesh(new TT.SphereGeometry(0.035, 12, 10), inkM, 0, 0.05, 0.01);
          const h = grp(mesh(new TT.BoxGeometry(0.045, 0.06, 0.1), m.body, 0, 0, 0.01), mesh(new TT.BoxGeometry(0.03, 0.07, 0.035), m.grip, 0, -0.055, 0.04), br, r, bub); h.userData.pump = [br, r]; return h; },
        slim: (m) => { const n = mesh(new TT.CylinderGeometry(0.011, 0.014, 0.26, 8), m.body, -0.02, 0, -0.08, PI / 2), r = mesh(new TT.TorusGeometry(0.014, 0.005, 6, 10), inkM, -0.02, 0, -0.212);
          const h = grp(mesh(new TT.BoxGeometry(0.02, 0.05, 0.07), m.grip, -0.03, 0, 0.0), n, r); h.userData.pump = [n, r]; return h; },
      };
      // ===== ホールタンク（背中＝＋z、下に穴） =====
      const PACK = {
        std: (m) => grp(mesh(new TT.CylinderGeometry(0.085, 0.085, 0.22, 18), m.body), mesh(new TT.SphereGeometry(0.085, 18, 8, 0, PI * 2, 0, PI / 2), m.body, 0, 0.11), mesh(new TT.CylinderGeometry(0.087, 0.087, 0.12, 18, 1, true, -0.7, 1.4), inkM, 0, 0.01),
          mesh(new TT.CylinderGeometry(0.085, 0.045, 0.06, 18), m.body, 0, -0.14), mesh(new TT.TorusGeometry(0.038, 0.012, 8, 18), inkM, 0, -0.172, 0, PI / 2), mesh(new TT.BoxGeometry(0.2, 0.03, 0.03), m.body, 0, 0.05, -0.08)),
        twin: (m) => { const g = grp(mesh(new TT.BoxGeometry(0.22, 0.03, 0.03), m.grip, 0, 0.05, -0.06)); for (const x of [-0.055, 0.055]) { g.add(mesh(new TT.CylinderGeometry(0.05, 0.05, 0.22, 14), m.body, x)); g.add(mesh(new TT.SphereGeometry(0.05, 14, 6, 0, PI * 2, 0, PI / 2), m.body, x, 0.11)); g.add(mesh(new TT.CylinderGeometry(0.052, 0.052, 0.1, 14, 1, true, -0.7, 1.4), inkM, x, 0.01)); g.add(mesh(new TT.TorusGeometry(0.024, 0.009, 6, 14), inkM, x, -0.115, 0, PI / 2)); } return g; },
        slim: (m) => grp(mesh(new TT.BoxGeometry(0.22, 0.26, 0.06), m.body, 0, 0, -0.06), mesh(new TT.BoxGeometry(0.15, 0.1, 0.012), inkM, 0, 0.02, -0.027), mesh(new TT.TorusGeometry(0.03, 0.01, 6, 14), inkM, 0, -0.135, -0.06, PI / 2)),
      };
      const SIZE = { tank: 0.3, cannon: 0.17, hose: 0.3, pack: 0.32 };
      // モデルの部品を使う：その部品の場所（pos）の近くにある、モデルの小さい形を集めて、部品として動かす（ゲームの部品のかわり）
      // 選び方：pick='name'（名前に、その言葉が入っている部品。親の名前でもよい）か、'near'（場所の近くの小さい部品）
      const modelPart = (k, pos, sx) => {
        const g = IW3.gearOf(face, k), R = (g.r != null ? g.r : ({ tank: 12, cannon: 10, hose: 12, pack: 14 })[k]) / 100, w = new TT.Group(); let n = 0;
        if (!A.ext) return { w, n };
        const off = GA(k).off(sx), sel = pos.clone().sub(off).add(new TT.Vector3((g.zx || 0) / 100 * (sx || 1), (g.zy || 0) / 100, -(g.zz || 0) / 100)); // 選ぶ網の場所（部品を動かす分はのぞく）
        const cx = spine.x, L = [], byName = g.pick === 'name', KW = String(g.names || '').toLowerCase().split(/[,、\s]+/).filter(Boolean);
        const nameHit = (o) => { for (let q = o; q && q !== A.group; q = q.parent) { const nm = String((q.userData && q.userData.srcName) || q.name || '').toLowerCase(); if (nm && KW.some(kw => nm.includes(kw))) return true; } return false; };
        const boxOf = (o) => { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); return o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); }; // 骨つきの形も、骨を当てる前（元の姿）の箱で見る
        A.group.updateMatrixWorld(true);
        A.model.traverse(o => { if (!o.isMesh || o.userData.gearTaken || !o.visible) return; let q = o.parent; while (q) { if (q.userData && q.userData.isGear) return; q = q.parent; }
          const bx = boxOf(o), c = bx.getCenter(new TT.Vector3());
          if (sx && (c.x - cx) * sx < 0) return; // キャノン：左右に分ける（体のまん中より左か右か）
          if (byName) { if (KW.length && nameHit(o)) L.push(o); return; }
          if (bx.getSize(new TT.Vector3()).length() > 0.5) return; if (sx && (c.x - cx) * sx < 0.02) return; if (c.distanceTo(sel) <= R) L.push(o); });
        // 名前で選んだときは、部品のまん中を動きの中心にする
        let at = sel.clone(); if (byName && L.length) { const bb = new TT.Box3(); for (const o of L) bb.union(boxOf(o)); at = bb.getCenter(new TT.Vector3()); w.userData.zr = bb.getSize(new TT.Vector3()).length() / 2; }
        for (const o of L) { o.userData.gearTaken = true; const nm = new TT.Mesh(o.geometry, o.material); nm.name = o.name; nm.userData.srcName = o.userData.srcName; nm.applyMatrix4(o.matrixWorld); nm.position.sub(at); nm.renderOrder = o.renderOrder; nm.userData.gearTaken = true; o.parent.remove(o); w.add(nm); n++; }
        w.userData.zoff = at.toArray(); at = at.clone().add(off); w.userData.zoff = byName ? [0, 0, 0] : new TT.Vector3().fromArray(w.userData.zoff).sub(at).toArray(); // 網は、選んだ場所に（名前のときは部品のまわり）
        return { w, n, at };
      };
      G.linked = {};
      G.cfg = { cannon: { motion: IW3.gearOf(face, 'cannon').motion || 'mix' }, hose: { motion: IW3.gearOf(face, 'hose').motion || 'mix', angN: IW3.gearOf(face, 'hose').angN || 0, angL: IW3.gearOf(face, 'hose').angL != null ? IW3.gearOf(face, 'hose').angL : 40 } }; // 撃つ動き・ホースの角度
      const build = (k, TBL, sx, pos) => { const m = mats(k), g = m.g; let o;
        let at = null;
        if (g.style === 'model') { const r = modelPart(k, pos, sx); o = r.w; at = r.at; o.userData.pump = []; G.linked[k] = (G.linked[k] || 0) + r.n; o.userData.back = 0.05; o.userData.whole = true; }
        else o = (g.style === 'ext' && extPart(k, SIZE[k])) || (TBL[g.style] || TBL.std)(m, sx);
        if (o.userData.pump) { o.userData.pumpIdx = o.userData.pump.map(c => o.children.indexOf(c)); delete o.userData.pump; } // 複製で使えるように、番号で持つ
        // ホースは、傾き・ゆれの支点を、いちばん後ろ（＋z の端）にする（前は、まん中が支点で不自然だった）
        if (k === 'hose') { o.updateMatrixWorld(true); const bb = new TT.Box3().setFromObject(o);
          if (!bb.isEmpty()) { const piv = new TT.Vector3((bb.min.x + bb.max.x) / 2, (bb.min.y + bb.max.y) / 2, bb.max.z); o.children.forEach(c => c.position.sub(piv)); o.position.add(piv); } }
        // 外側の入れ物（outer）→ 中（aim：傾き・ゆれ・タプタプ）→ 形。outer は、はじけるときにふくらむ
        o.userData.isAimRoot = true; const outer = new TT.Group(); outer.add(o); outer.userData.isGear = true; outer.userData.aim = 1; outer.userData.kind = k; if (at) outer.userData.at = at.toArray();
        if (face && face._zone === k) { const z = new TT.Mesh(new TT.SphereGeometry(o.userData.zr ? o.userData.zr + 0.02 : (g.r != null ? g.r : ({ tank: 12, cannon: 10, hose: 12, pack: 14 })[k]) / 100, 16, 10), new TT.MeshBasicMaterial({ color: 0xffe14d, wireframe: true, transparent: true, opacity: 0.55 })); if (o.userData.zoff) z.position.fromArray(o.userData.zoff); outer.add(z); } // モデルの部屋：連動させる範囲
        return outer; };
      { const pos = new TT.Vector3(spine.x, (spine.y + chest.y) / 2 - 0.005, spine.z - 0.19).add(GA('tank').off()); G.tank = fit(put(B('C_Spine'), build('tank', TANK, 0, pos), pos), 'tank'); }
      // 両わきの下のツインキャノン（前向き）：体に付けるので、腕の動きには引っぱられない
      G.cannons = [];
      for (const side of ['L', 'R']) {
        const sh = P(side + '_UpperArm'), sx = side === 'L' ? -1 : 1;
        const pos = new TT.Vector3(sh.x + sx * CANNON_OUT, sh.y - CANNON_DOWN, sh.z - 0.07).add(GA('cannon').off(sx));
        G.cannons.push(fit(put(B('C_UpperChest') || B('C_Chest'), build('cannon', CANNON, sx, pos), pos), 'cannon', sx));
      }
      // ロングホース：右の腰の横に付けて、前へ向ける。お腹のタンクから管でつなぐ
      const lg = P('R_UpperLeg');
      { const pos = new TT.Vector3(lg.x + 0.115, lg.y - 0.03, lg.z - 0.04).add(GA('hose').off()); G.hose = fit(put(B('C_Hips'), build('hose', HOSE, 0, pos), pos), 'hose'); }
      { // タンクからホースへの管
        const t0 = new TT.Vector3(spine.x + 0.09, (spine.y + chest.y) / 2 + 0.01, spine.z - 0.13).add(GA('tank').off()), t1 = new TT.Vector3(lg.x + 0.115, lg.y - 0.0, lg.z + 0.02).add(GA('hose').off());
        const mid = t0.clone().add(t1).multiplyScalar(0.5).add(new TT.Vector3(0.05, 0, -0.03));
        const tube = new TT.Mesh(new TT.TubeGeometry(new TT.QuadraticBezierCurve3(t0, mid, t1), 10, 0.009, 6), mats('hose').grip);
        A.group.add(tube); tube.position.set(0, 0, 0); const inv = A.group.matrixWorld.clone().invert(); tube.applyMatrix4(inv); A.group.updateMatrixWorld(true); B('C_Hips').attach(tube); G.tube = tube; if (!IW3.gearOf(face, 'tank').on || !IW3.gearOf(face, 'hose').on || IW3.gearOf(face, 'hose').tube === false || IW3.gearOf(face, 'tank').style === 'model' || IW3.gearOf(face, 'hose').style === 'model') tube.visible = false;
      }
      // 背中のホールタンク：ジャンプ噴射のときは、下の穴からインクを噴き出して跳ぶ
      { const pos = new TT.Vector3(chest.x, chest.y - 0.02, chest.z + 0.15).add(GA('pack').off()); G.pack = fit(put(B('C_Chest'), build('pack', PACK, 0, pos), pos), 'pack'); }
    } else if (kind === 'hero' || kind === 'heroPlain') {
      const hd = P('R_Hand'), bl = new TT.Group();
      const hilt = new TT.Mesh(new TT.CylinderGeometry(0.016, 0.016, 0.13, 10), mat(0x30343c, { metalness: 0.7 })); hilt.position.y = -0.01; bl.add(hilt);
      const guard = new TT.Mesh(new TT.BoxGeometry(0.075, 0.014, 0.03), mat(0xd8dde6, { metalness: 0.8 })); guard.position.y = -0.08; bl.add(guard);
      const beam = new TT.Mesh(new TT.CylinderGeometry(0.012, 0.02, 0.62, 10), new TT.MeshBasicMaterial({ color: 0x9fe3ff, transparent: true, opacity: 0.9 })); beam.position.y = -0.4; bl.add(beam);
      // 握り方：骨の元の向き（T ポーズ）では、右手の指は＋x、手のひらは−y、指は z 軸まわりに曲がる。
      //   なので柄は z 向き（こぶしの中を通る）、刃は前（−z）。手の骨に、その骨の向きのまま直接付ける。
      const hb = B('R_Hand'), i1 = A.bones.J_Bip_R_Index1, g = i1 ? i1.position.clone().multiplyScalar(0.62) : new TT.Vector3(0.05, 0, 0);
      bl.rotation.set(Math.PI / 2, 0, 0); bl.position.set(g.x, g.y - 0.028, g.z + 0.035);
      hb.add(bl); G.blade = bl; G.beam = beam;
      if (kind === 'hero') {
      const vis = new TT.Mesh(new TT.SphereGeometry(0.116, 20, 8, Math.PI * 1.08, Math.PI * 0.84, /* Ink89：顔の前（−z）に。前は頭の横に出ていた */ Math.PI * 0.4, Math.PI * 0.13), new TT.MeshStandardMaterial({ color: 0x46c8ff, transparent: true, opacity: 0.5, emissive: 0x2288ff, emissiveIntensity: 0.4, roughness: 0.1 }));
      G.visor = put(B('C_Head'), vis, new TT.Vector3(head.x, head.y + hh * 0.95 + 0.012, head.z));
      }
    }
    return G;
  }
  // 複製：骨を付けかえて、同じ形（geometry）を使い回す
  function cloneSk(src) {
    const TT = T(), cl = src.clone(true), a = [], b = [];
    src.traverse(o => a.push(o)); cl.traverse(o => b.push(o));
    const m = new Map(); a.forEach((o, i) => m.set(o, b[i]));
    a.forEach((o, i) => {
      if (o.isSkinnedMesh) b[i].bind(new TT.Skeleton(o.skeleton.bones.map(x => m.get(x)), o.skeleton.boneInverses), o.bindMatrix);
      if (o.material && b[i].material === o.material && o.material === o._gearInk) b[i].material = o.material.clone();
    });
    return { root: cl, map: m };
  }
  // 骨を動かす道具
  //   骨の向き（測って確かめた。VRoid の骨は元の回転がなく、体の前＝−z・左＝−x）：
  //     太もも・すね・足：x＋で前へ振れる。膝は「すね x−」で正しく曲がる（x＋は逆ひざ）。脚を外へ開く＝L z−・R z＋。
  //     腕（下ろした腕）：x＋で前へ振れる（Euler XYZ なので x がいちばん外側）。ひじ：L y−・R y＋で前に曲がる。
  //   脚は IK（足を置く場所から、太もも・すね・足首の角度を出す）で動かす：
  //     pose({ drop: 腰を下げる量, legs: { L: { f: 前へ, up: 上へ, z: 開き, pitch: つま先の上下 }, R: … } }) → 足は床に着いたまま、膝は前へ曲がる。
  //     UpperLeg を直接書いた側は、IK を使わない（昔のやり方）。返り値 { drop }。
  function legGeo(A) {
    if (A._legGeo) return A._legGeo;
    const TT = T(); A.group.updateMatrixWorld(true);
    const inv = A.group.matrixWorld.clone().invert(), pt = (n) => A.bones['J_Bip_' + n].getWorldPosition(new TT.Vector3()).applyMatrix4(inv);
    const G = { hipHeight: A.hipHeight, sx: A.width || 1, sy: A.height || 1 };
    for (const sd of ['L', 'R']) {
      const h = pt(sd + '_UpperLeg'), k = pt(sd + '_LowerLeg'), a = pt(sd + '_Foot');
      // 前＝−z。角度は「真下から前へ」
      const ang = (p, q) => Math.atan2(-(q.z - p.z), -(q.y - p.y));
      G[sd] = { h, a, l1: h.distanceTo(k), l2: k.distanceTo(a), a1: ang(h, k), a2: ang(k, a) };
    }
    return (A._legGeo = G);
  }
  IW3.Rig = function (A, root, map) {
    const TT = T(), bones = {}, base = {};
    for (const [n, b] of Object.entries(A.bones)) { const c = map ? map.get(b) : b; if (!c) continue; bones[n] = c; base[n] = { q: A.base[n].q.clone(), p: A.base[n].p.clone() }; }
    const q = new TT.Quaternion(), e = new TT.Euler();
    const finger = Object.keys(bones).filter(n => /_(Index|Middle|Ring|Little)[123]$/.test(n));
    const LG = legGeo(A);
    // 片脚の IK（横から見た平面で解く）。f・up は世界の長さ。
    function leg(sd, o, dropM, D) {
      const g = LG[sd], z = o.z || 0;
      const f = (o.f || 0) / LG.sx, up = (o.up || 0) / LG.sy;
      const fwd = -(g.a.z - g.h.z) + f;
      const down = ((g.h.y - g.a.y) - dropM - up) / Math.max(0.5, Math.cos(z));
      let d = Math.hypot(fwd, down); d = Math.min(g.l1 + g.l2 - 1e-4, Math.max(Math.abs(g.l1 - g.l2) + 1e-3, d));
      const b = Math.atan2(fwd, down);
      const c1 = Math.acos(Math.max(-1, Math.min(1, (g.l1 * g.l1 + d * d - g.l2 * g.l2) / (2 * g.l1 * d))));
      const c2 = Math.acos(Math.max(-1, Math.min(1, (g.l2 * g.l2 + d * d - g.l1 * g.l1) / (2 * g.l2 * d))));
      const t1 = b + c1 - g.a1, t2 = b - c2 - g.a2; // 太もも・すねの、元からの回転（前が＋）
      D[sd + '_UpperLeg'] = [t1, o.twist || 0, z];
      D[sd + '_LowerLeg'] = [t2 - t1, 0, 0];
      D[sd + '_Foot'] = [-t2 + (o.pitch || 0), 0, -z * 0.8];
    }
    return {
      root, bones, hip: A.hipHeight * A.height,
      pose(B) {
        for (const n in bones) { bones[n].quaternion.copy(base[n].q); bones[n].position.copy(base[n].p); }
        B = B || {};
        const D = Object.assign({ L_UpperArm: [0, 0, 1.32], R_UpperArm: [0, 0, -1.32], L_LowerArm: [0, -0.35, 0], R_LowerArm: [0, 0.35, 0] }, B);
        delete D.drop; delete D.legs;
        if (A.armRest) { D.L_UpperArm = [D.L_UpperArm[0], D.L_UpperArm[1], D.L_UpperArm[2] - A.armRest.L]; D.R_UpperArm = [D.R_UpperArm[0], D.R_UpperArm[1], D.R_UpperArm[2] + A.armRest.R]; } // 外のモデル：A ポーズのぶん
        const drop = B.drop || 0, legs = B.legs || {};
        for (const sd of ['L', 'R']) if (!B[sd + '_UpperLeg']) leg(sd, legs[sd] || {}, Math.max(0, drop) / LG.sy, D);
        for (const k in D) {
          const n = 'J_Bip_' + k, b = bones[n]; if (!b) continue; q.setFromEuler(e.set(D[k][0], D[k][1], D[k][2]));
          const N = A.norm && A.norm[n];
          if (N) b.quaternion.copy(N.Pi).multiply(q).multiply(N.P).multiply(base[n].q); // 外のモデル：骨のはじめの向きがあっても、体の向きでの回転として当てる
          else b.quaternion.multiply(q);
        }
        for (const n of finger) { if (A.norm && A.norm[n]) { const N = A.norm[n]; q.setFromEuler(e.set(0, 0, n.includes('_L_') ? 0.65 : -0.65)); bones[n].quaternion.premultiply(N.P).premultiply(q).premultiply(N.Pi); } else bones[n].rotation.z += n.includes('_L_') ? 0.65 : -0.65; }
        return { drop };
      },
    };
  };
  // ===== 見た目の型（モデルの部屋で変えて、保存する） =====
  //   minions：戦闘員の型 8つ（どのモードも、この中から使う）。hero：ヒーローの型。heroModeColor：ヒーロー対決の戦闘員の服を 'ink'（インク団の紫でおそろい）か 'type'（型の色）か
  IW3.MODEL_DEF = {
    minions: [
      { eyeSet: 'tsuya', hair: 's_bob', hairColor: '#2a2a6a', skin: 'スライム青', eye: 'ダークブラウン', base: '笑顔', outfit: 'sp_vest', pal: ['#2a2633', '#f0466e', '#1c1a22'] },
      { eyeSet: 'fude', hair: 't_short', hairColor: '#5a2a7a', skin: 'スライム紫', eye: '琥珀', base: '無邪気', outfit: 'sp_vest', pal: ['#1f2a4a', '#3e7bff', '#141a2e'] },
      { eyeSet: 'futamado', hair: 's_round', hairColor: '#1e2a5a', skin: 'スライム水色', eye: '琥珀', base: '勝気', outfit: 'sp_vest', pal: ['#1f3a2a', '#3ed27a', '#14241a'] },
      { eyeSet: 'akari', hair: 's_fuwa', hairColor: '#4a2a6a', skin: 'スライム紫', eye: 'ダークブラウン', base: '笑顔', outfit: 'sp_vest', pal: ['#3a3420', '#ffd23a', '#241f12'] },
      { eyeSet: 'kirari', hair: 'p_low', hairColor: '#3a2a6a', skin: 'スライム青', eye: '紫', base: 'おっとり', outfit: 'sp_vest', pal: ['#3a2236', '#ff6ad5', '#24141f'] },
      { eyeSet: 'kira', hair: 'b_bob', hairColor: '#2a3a6a', skin: 'スライム水色', eye: '青', base: '不敵', outfit: 'sp_vest', pal: ['#3a2a1f', '#ff8a3a', '#24180f'] },
      { eyeSet: 'komari', hair: 's_flip', hairColor: '#5a2a5a', skin: 'スライム紫', eye: '緑', base: 'クール', outfit: 'sp_vest', pal: ['#eef0f6', '#3ec6ff', '#c9ccd8'] },
      { eyeSet: 'yasashi', hair: 't_thin', hairColor: '#2a2a4a', skin: 'スライム青', eye: '金', base: '無邪気', outfit: 'sp_vest', pal: ['#2a2633', '#b04df0', '#1c1a22'] },
    ],
    hero: { eyeSet: 'rin', hair: 'p_high', hairColor: '#f2d27a', eye: '青', base: '勝気', pal: ['#2f7bff', '#f4f4f6', '#ff4a6a'] },
    heroModeColor: 'ink',
    use: [true, true, true, true, true, true, true, true], // 試合に出す型（1つだけにすると、戦闘員は全員その型）
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  //   保存：いま開いている間の控え（MEM）・localStorage・IndexedDB の3か所。localStorage がいっぱいでも、ほかで効くように。
  let MEM = null;
  IW3.models = function () {
    let m = MEM; if (!m) try { m = JSON.parse(localStorage.getItem('inkwar.models') || 'null'); } catch (e) { }
    if (!m && W.IW_MODELS && W.IW_MODELS.settings) m = W.IW_MODELS.settings; // 配る用に書き出したフォルダの設定（このブラウザで変えるまで）
    const d = clone(IW3.MODEL_DEF);
    const as = W.IW_MODELS && W.IW_MODELS.assign; // models フォルダの、はじめの割り当て（遊ぶ人が変えていなければ使う）
    if (as) { for (const [i, r] of Object.entries(as.minions || {})) if (d.minions[i]) d.minions[i].ext = r; if (as.hero) d.hero.ext = as.hero; }
    if (!m) return d;
    for (let i = 0; i < 8; i++) d.minions[i] = Object.assign(d.minions[i], (m.minions || [])[i] || {});
    Object.assign(d.hero, m.hero || {}); if (m.heroModeColor) d.heroModeColor = m.heroModeColor;
    if (Array.isArray(m.use) && m.use.some(Boolean)) d.use = d.use.map((x, i) => m.use[i] !== false);
    return d;
  };
  // 試合に出す型の番号（0〜7）
  // Ink93：投稿サイト用は、タイトルが出たら、試合で使う軽い体・軽い髪を先に読んでおく（声のまとめは、そのあと）
  if (window.YR && YR.prefetchModels && YR.binaryBase) YR.modelsReady = new Promise(ok => window.addEventListener('load', () => setTimeout(() => {
    try { const M = IW3.models(), ks = ['body_std']; (M.minions || []).forEach(f => f && f.hair && ks.push(YR.mhKey(f.hair) + '_lo')); ks.push(YR.mhKey((M.hero && M.hero.hair) || 'p_high') + '_lo'); YR.prefetchModels(ks).then(ok, ok); } catch (e) { ok(); }
  }, 200)));
  IW3.usedTypes = (M) => { const U = (M || IW3.models()).use || []; const L = [0, 1, 2, 3, 4, 5, 6, 7].filter(i => U[i] !== false); return L.length ? L : [0]; };
  // 今どのモデルを使うかの説明（タイトルと試合のはじめに出す）
  IW3.modelSummary = async function () {
    const M = IW3.models(), U = IW3.usedTypes(M), nm = async (r) => r ? '「' + await IW3.EXT.nameOf(r) + '」' : 'ゲームの体';
    const parts = []; for (const i of U) parts.push('型' + (i + 1) + (M.minions[i].ext ? '＝' + await nm(M.minions[i].ext) : ''));
    return { minions: (U.length === 8 ? '型1〜8' : '') + (U.length === 8 && !U.some(i => M.minions[i].ext) ? '（ゲームの体）' : U.length === 8 ? '（' + parts.filter(x => x.includes('＝')).join('・') + '、ほかはゲームの体）' : parts.join('・')), hero: await nm(M.hero.ext), ext: U.some(i => M.minions[i].ext) || !!M.hero.ext };
  };
  IW3.saveModels = function (m) {
    MEM = clone(m); IW3.modelsSaveErr = false;
    try { localStorage.setItem('inkwar.models', JSON.stringify(m)); } catch (e) { IW3.modelsSaveErr = true; console.warn('localStorage に保存できません', e); }
    if (IW3.EXT && IW3.EXT.setKV) IW3.EXT.setKV(MEM);
  };
  // このブラウザのモデルの設定を消す（配る用フォルダの設定、なければはじめの設定にもどる）
  IW3.resetModels = async function () { MEM = null; try { localStorage.removeItem('inkwar.models'); } catch (e) { } if (IW3.EXT && IW3.EXT.setKV) await IW3.EXT.setKV(null); };
  /* はじめに：localStorage に無ければ、IndexedDB の控えを読む */
  IW3.modelsReady = (async () => {
    let has = false; try { has = !!localStorage.getItem('inkwar.models'); } catch (e) { }
    if (!has && IW3.EXT && IW3.EXT.getKV) { const v = await IW3.EXT.getKV(); if (v && !MEM) MEM = v; }
  })().catch(() => { });
  IW3.INK_PAL = ['#2a2633', '#b04df0', '#1c1a22']; // インク団のおそろいの服
  // 元の体を作る（組の色ごとに数人）→ 複製
  const BASES = {};
  IW3.makeMinionBase = async function (key, ink, face) {
    const lite = !/^(story|room)/.test(key); // Ink89：試合は軽い体・軽い髪（顔が小さくしか映らない）。おはなし・モデルの部屋は細かい顔
    key = key + '|' + ink + '|' + JSON.stringify(face || {}); // 型を変えたら、作り直す
    if (BASES[key]) return BASES[key];
    const p = IW3.person(4000 + Object.keys(BASES).length, (face && face.outfit) || 'sp_vest', (face && face.pal) || ['#2a2633', '#' + ink.toString(16).padStart(6, '0'), '#1c1a22'], (face && face.hair) || 's_bob', (face && face.hairColor) || '#3a2a40', face && face.eye, face && face.base, false, (face && face.skin) || 'スライム青');
    const SLM = { 'スライム青': 0x5aa0ff, 'スライム紫': 0x9a6cff, 'スライム水色': 0x5ae0f0 };
    const A = face && face.ext ? await IW3.EXT.actor(await IW3.EXT.getBuf(face.ext), { tint: face.extTint || 0, tintColor: SLM[face.skin] || 0x5aa0ff, flip: !!face.extFlip }) // 外で作ったモデル
      : (p.look.eyeSet = (face && face.eyeSet) || 'yasashi', p.look.lite = lite, await YR.Visual.Actor.create(p));
    if (face && face.noir) { // のじゃチビの体つき：頭を大きく、胸を平らに（胸の骨をうすくして、首と肩は元にもどす）
      const bn = (n) => A.bones && A.bones[n]; const h = bn('J_Bip_C_Head'), uc = bn('J_Bip_C_UpperChest'), k = 0.8;
      if (h) h.scale.setScalar(1.25);
      if (uc) { uc.scale.set(0.94, 1, k); for (const n of ['J_Bip_C_Neck', 'J_Bip_L_Shoulder', 'J_Bip_R_Shoulder']) { const b = bn(n); if (b) b.scale.set(1 / 0.94, 1, 1 / k); } }
    }
    A.pose({}, 0, 0, 0);
    if (face && face.hide) A.model.traverse(o => { if (o.isMesh && face.hide.test(o.name)) o.visible = false; });
    IW3.undress(A, face, SLM[(face && face.skin) || 'スライム青'] || 0x5aa0ff);
    await IW3.preloadParts(face);
    const gear = addGear(A, ink, 'minion', face);
    A.pose({}, 0, 0, 0);
    BASES[key] = { A, gear };
    return BASES[key];
  };
  IW3.cloneMinion = function (base) {
    const { root, map } = cloneSk(base.A.group);
    const rig = IW3.Rig(base.A, root, map);
    // インクの材質は、1人ずつ（光り方を変えるため）
    const inkMats = [];
    root.traverse(o => { if (o.isMesh && o.material === base.gear.inkM) { o.material = o.material.clone(); inkMats.push(o.material); } });
    const find = (obj) => map.get(obj);
    return { root, rig, inkMats, model: base.A.ext ? 'ext' : 'ゲームの体', tank: find(base.gear.tank), fill: find(base.gear.fill), cannons: base.gear.cannons.map(find), hose: find(base.gear.hose), pack: find(base.gear.pack), tube: find(base.gear.tube), gcfg: base.gear.cfg, persona: base.A._persona || null };
  };
  // 首領ノワールの金の王冠（ステージとおはなしの場面で使う）
  IW3.makeCrown = function () {
    const TT = T(), cr = new TT.Group(), gm = new TT.MeshStandardMaterial({ color: 0xffd23a, emissive: 0xffa800, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.3, side: TT.DoubleSide });
    cr.add(new TT.Mesh(new TT.CylinderGeometry(0.16, 0.16, 0.08, 16, 1, true), gm));
    for (let k = 0; k < 5; k++) { const sp = new TT.Mesh(new TT.ConeGeometry(0.04, 0.12, 4), gm), a = k / 5 * Math.PI * 2; sp.position.set(Math.cos(a) * 0.15, 0.09, Math.sin(a) * 0.15); cr.add(sp); }
    const gem = new TT.Mesh(new TT.SphereGeometry(0.035, 8, 6), new TT.MeshBasicMaterial({ color: 0xff3a8a })); gem.position.set(0, 0.02, 0.165); cr.add(gem);
    return cr;
  };
  // 首領ノワールの型：試合に出す型のいちばん最後（ステージでも、おはなしの場面でも同じ）
  // Ink90：首領ノワールは「のじゃチビ」。型とは別の、専用の見た目（子どもっぽい：大きなきらきらの目・長いツインテール・ドレス）。
  //   体つきは makeMinionBase で子どもの形にする（頭を大きく、胸を平らに）。大きさは、おはなし・試合で小さく（sc）
  IW3.NOIR_LOOK = { noir: true, eyeSet: 'kira', hair: 't_long', hairColor: '#3b2a5c', eye: '琥珀', base: '勝気', outfit: 'sk_dress', pal: ['#2a1f3a', '#b04df0', '#e8c040'], skin: 'スライム紫' };
  IW3.noirFace = function () { return Object.assign({}, IW3.NOIR_LOOK); };
  IW3.makeHero = async function (power, full) { return IW3.makeHeroForm('hero', power, null, full); };
  // ヒーローの姿（よごれで変わる）
  //   hero：ヒーロースーツ（バイザーつき）／broken：スーツ機能停止（色がくすみ、手袋・バイザーなし、髪がほどけかけ）
  //   civil：変身解除（ふだんの服、髪をおろす）／slime：スライムになって、インク団の仲間入り（戦闘員と同じ服と装備、青い肌）
  IW3.makeHeroForm = async function (form, power, hm, full) { // full：細かい顔（おはなし・モデルの部屋）。ないときは試合用の軽い体
    const H = hm || IW3.models().hero; // ヒーローの型（モデルの部屋で変えられる）
    const pal = power ? ['#ffd24a', '#ff4a6a', '#ffffff'] : H.pal;
    const dull = (c, k) => { const TT = T(), x = new TT.Color(c), g = new TT.Color(0x8a8a92); return '#' + x.lerp(g, k).multiplyScalar(0.85).getHexString(); }; // スーツ機能停止：色がくすむ
    let p, kind = 'hero';
    if (form === 'broken') p = IW3.person(4901, 'sp_body', pal.map(c => dull(c, 0.45)), H.hair, H.hairColor, H.eye, H.base, false);
    else if (form === 'civil') p = IW3.person(4902, 'sp_tie', ['#f2efe8', '#5a78c0', '#2a2a30'], H.hair, H.hairColor, H.eye, H.base, false);
    else if (form === 'slime') { p = IW3.person(4903, 'sp_vest', ['#2a2633', '#' + IW3.INK.ink.toString(16).padStart(6, '0'), '#1c1a22'], H.hair, '#8fb8ff', H.eye, '笑顔', false, 'スライム青'); kind = 'minion'; }
    else p = IW3.person(4900, 'sp_body', pal, H.hair, H.hairColor, H.eye, H.base, true);
    p.look.eyeSet = H.eyeSet || 'rin'; // Ink87：顔（3Dキャラ工房の目のセット）
    p.look.lite = !full;
    const A = H.ext ? await IW3.EXT.actor(await IW3.EXT.getBuf(H.ext), { flip: !!H.extFlip, tint: form === 'slime' ? 0.55 : form === 'civil' ? 0.25 : form === 'broken' ? 0.15 : 0, tintColor: form === 'broken' ? 0x8a8a92 : 0x5aa0ff }) // 外で作ったモデル（姿はそのまま。色だけ変わっていく）
      : await YR.Visual.Actor.create(p);
    A.pose({}, 0, 0, 0);
    const gear = kind === 'minion' ? addGear(A, IW3.INK.ink, 'minion') : addGear(A, IW3.INK.hero, form === 'hero' ? 'hero' : 'heroPlain');
    A.pose({}, 0, 0, 0);
    const rig = IW3.Rig(A, A.group, null);
    return { A, root: A.group, rig, form, blade: gear.blade, beam: gear.beam, inkMats: gear.inkM ? [gear.inkM] : [], tank: gear.tank, cannons: gear.cannons, hose: gear.hose, pack: gear.pack, tube: gear.tube };
  };
  // 肌の色を、元の色から k（0〜1）だけスライムの青へ
  IW3.slimeSkin = function (A, k, to) {
    const TT = T(), c = new TT.Color(...(to || [0.38, 0.72, 1.4]));
    for (const m of A.materials || []) { const u = m.userData; if (!u || !u.uSkinU || !u.skin) continue; u.uSkinU.value.setRGB(u.skin[0], u.skin[1], u.skin[2]).lerp(c, k); }
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ---- src/ui/board3d.js ---- */
// ---- インク戦闘員ウォーズ：3Dの盤（マス・光るマス・カメラ・インクの演出・吹き出し） ----
//   IW3.Board.create(host, N)：盤を作る。返すもの：{scene, cam, tile(x,y)→世界座標, hl(マスの光らせ方), pick(コールバック), fx（演出）, bubble（吹き出し）, add/loop}
//   カメラ：左ドラッグで盤を滑らせる・右ドラッグ／2本指で角度・ホイール／ピンチで寄る引く。タップ（6px 未満）はマスを選ぶ。
//   演出：インクの弾（放物線）・はじける飛沫（周りに飛び散って、床にしみを残す）・ビーム・流星・輪っか。
(function (W) {
  'use strict';
  const IW3 = W.IW3 = W.IW3 || {};
  const T = () => W.RING3D.THREE;
  IW3.speed = 1; // 1 ふつう・0.55 速い・1.6 ゆっくり（時間にかける）
  const TW = []; // 動いている tween
  IW3.tween = function (ms, fn) {
    return new Promise(ok => { TW.push({ t0: performance.now(), ms: Math.max(1, ms * IW3.speed), fn, ok }); });
  };
  IW3.wait = (ms) => IW3.tween(ms, () => { });
  const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  IW3.ease = ease;

  IW3.Board = {
    create(host, N) {
      const TT = T();
      const cv = document.createElement('canvas'); cv.className = 'iw-canvas'; host.appendChild(cv);
      const R = new TT.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!W.IW_PLICY });
      R.outputColorSpace = TT.SRGBColorSpace; R.setClearColor(0x1a1f2e);
      const scene = new TT.Scene(); scene.fog = new TT.Fog(0x1a1f2e, 30, 70);
      scene.add(new TT.HemisphereLight(0xffefd9, 0x3c4a66, 2.0));
      const sun = new TT.DirectionalLight(0xfff1dc, 2.2); sun.position.set(-8, 16, 10); scene.add(sun);
      const cam = new TT.PerspectiveCamera(38, 1, 0.1, 200);
      const half = (N - 1) / 2;
      const tile = (x, y) => new TT.Vector3(x - half, 0, y - half);
      // 盤：市松もようのマス＋外のふち
      const g = new TT.BoxGeometry(0.96, 0.08, 0.96);
      const tm = new TT.MeshStandardMaterial({ roughness: 0.85, metalness: 0.0 });
      const tiles = new TT.InstancedMesh(g, tm, N * N); const M = new TT.Matrix4(), C = new TT.Color();
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const i = y * N + x; M.makeTranslation(x - half, -0.04, y - half); tiles.setMatrixAt(i, M);
        tiles.setColorAt(i, C.set((x + y) % 2 ? 0x3a4258 : 0x434c66));
      }
      scene.add(tiles);
      const rim = new TT.Mesh(new TT.BoxGeometry(N + 0.8, 0.3, N + 0.8), new TT.MeshStandardMaterial({ color: 0x232a3c, roughness: 0.9 })); rim.position.y = -0.24; scene.add(rim);
      const floor = new TT.Mesh(new TT.PlaneGeometry(200, 200), new TT.MeshStandardMaterial({ color: 0x151a26, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.4; scene.add(floor);
      // 光るマス（移動できるマス・狙える相手・攻撃の範囲）
      const hg = new TT.PlaneGeometry(0.9, 0.9); hg.rotateX(-Math.PI / 2);
      const hm = new TT.MeshBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false });
      const hl = new TT.InstancedMesh(hg, hm, N * N); hl.count = 0; hl.renderOrder = 2; hl.frustumCulled = false; scene.add(hl); // frustumCulled＝false：はじめの1こまで0マスだと「見える範囲が空」と覚えてしまい、あとで光らせても描かれなかった（マップやタイミングで、青・赤のマスが出ないことがあった）
      const HL_COL = { move: 0x3aa0ff, near: 0x37d67a, target: 0xff4a5a, area: 0xffb43a, pick: 0xffe14a, foe: 0xff4a5a, ally: 0x6ad1ff };
      let HLset = new Set(); // Ink97：いま光っているマス（押しまちがいの判定に使う）
      const setHL = (L) => { // L = [{x,y,c}]
        HLset = new Set((L || []).map(o => o.y * N + o.x));
        hl.count = L.length;
        L.forEach((o, i) => { M.makeTranslation(o.x - half, 0.012, o.y - half); hl.setMatrixAt(i, M); hl.setColorAt(i, C.set(HL_COL[o.c] || o.c || 0xffffff)); });
        hl.instanceMatrix.needsUpdate = true; if (hl.instanceColor) hl.instanceColor.needsUpdate = true;
      };
      // しみ（はじけたインクが床に残る）
      const sg = new TT.CircleGeometry(0.5, 14); sg.rotateX(-Math.PI / 2);
      const stains = []; const stainMat = {};
      const stain = (x, z, col, r) => {
        const k = col; if (!stainMat[k]) stainMat[k] = new TT.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
        const m = new TT.Mesh(sg, stainMat[k]); m.position.set(x, 0.006 + stains.length * 0.00002, z); const s = r || (0.3 + Math.random() * 0.4); m.scale.set(s, 1, s * (0.7 + Math.random() * 0.6)); m.rotation.y = Math.random() * 6;
        m.renderOrder = 1; scene.add(m); stains.push(m);
        if (stains.length > 260) { const o = stains.shift(); scene.remove(o); }
      };
      // ===== カメラ =====
      const CAM = { tx: 0, tz: half * 0.45, th: 0, ph: IW3.CAM_PH || 0.86, d: N * 1.05, ty: 0.6, follow: null, lock: false }; // ty：見る高さ（ボーナスの壁を見るときに上げる）
      const camGoal = { tx: CAM.tx, tz: CAM.tz, d: CAM.d, th: CAM.th, ph: CAM.ph, ty: CAM.ty };
      const applyCam = () => {
        const sp = Math.sin(CAM.ph), cp = Math.cos(CAM.ph);
        cam.position.set(CAM.tx + CAM.d * sp * Math.sin(CAM.th), CAM.d * cp + 0.5 + (CAM.ty - 0.6), CAM.tz + CAM.d * sp * Math.cos(CAM.th));
        cam.lookAt(CAM.tx, CAM.ty, CAM.tz);
        if (SHK.a > 0.001) { const t = performance.now() * 0.06; cam.position.x += Math.sin(t * 1.7) * SHK.a * CAM.d * 0.1; cam.position.y += Math.sin(t * 2.3) * SHK.a * CAM.d * 0.07; SHK.a *= 0.86; }
      };
      const SHK = { a: 0 }; const shake = (a) => { SHK.a = Math.max(SHK.a, a); }; // はじけたときの、画面のゆれ
      // 見せ場で、カメラをぐっと寄せる（自分でカメラを動かしているときは、何もしない）。ms たったら元へ
      let PB = null, PT = 0;
      const punch = (x, z, k, ms) => {
        if (CAM.lock) return; if (!PB) PB = { tx: camGoal.tx, tz: camGoal.tz, d: camGoal.d };
        camGoal.tx = PB.tx + (x - PB.tx) * 0.6; camGoal.tz = PB.tz + (z - PB.tz) * 0.6; camGoal.d = PB.d * (k || 0.7);
        clearTimeout(PT); PT = setTimeout(() => { if (PB && !CAM.lock) { camGoal.tx = PB.tx; camGoal.tz = PB.tz; camGoal.d = PB.d; } PB = null; }, (ms || 900) * IW3.speed);
      };
      const clampB = (v) => Math.max(-half - 1, Math.min(half + 1, v));
      const lookAt = (x, z, d, instant) => { if (d && host.clientWidth / Math.max(1, host.clientHeight) < 0.8) d *= 1.4; // Ink96：縦の画面では、少し引いて、左右の子が切れないように
        camGoal.tx = x; camGoal.tz = z; if (d) camGoal.d = d; if (instant) { CAM.tx = x; CAM.tz = z; if (d) CAM.d = d; } };
      // Ink81：立っている子の体（頭や胴）を押したときも、その子のマスにする。前は地面の奥のマスに当たって、となりの青いマスへ歩いてしまうことがあった
      let unitsFn = null;
      const unitAt = (px, py, W0, H0) => {
        if (!unitsFn) return null; const L = unitsFn() || []; if (!L.length) return null;
        const scr = (x, y, z) => { const q = new TT.Vector3(x, y, z).project(cam); return { x: (q.x + 1) / 2 * W0, y: (1 - q.y) / 2 * H0, z: q.z }; };
        const rt = new TT.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
        let best = null;
        for (const o of L) {
          const a = scr(o.x, 0.12, o.z), b = scr(o.x, o.h, o.z), m = scr(o.x, o.h * 0.55, o.z), side = scr(o.x + rt.x * 0.3, o.h * 0.55, o.z + rt.z * 0.3);
          const rad = Math.max(10, Math.hypot(side.x - m.x, side.y - m.y));
          const vx = b.x - a.x, vy = b.y - a.y, L2 = vx * vx + vy * vy || 1, t = Math.max(0, Math.min(1, ((px - a.x) * vx + (py - a.y) * vy) / L2));
          const d = Math.hypot(px - (a.x + vx * t), py - (a.y + vy * t));
          if (d <= rad && (!best || (best.hero && !o.hero) || (!!best.hero === !!o.hero && m.z < best.z))) best = { gx: o.gx, gy: o.gy, z: m.z, hero: o.hero }; // 重なっていたら、手前の子。Ink97：ヒーローと重なっていたら、戦闘員やタンクを先に
        }
        return best;
      };
      // 入力
      let pick = null, drag = null; const P = new Map();
      cv.addEventListener('contextmenu', e => e.preventDefault());
      cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); P.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, b: e.button }); drag = { moved: 0 }; });
      cv.addEventListener('pointermove', e => {
        const p = P.get(e.pointerId); if (!p) return;
        const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
        if (drag) drag.moved += Math.abs(dx) + Math.abs(dy);
        if (drag && drag.moved < 6) return;
        CAM.follow = null; CAM.lock = true;
        if (P.size >= 2) { // 2本指：角度と、開く／狭める
          const L = [...P.values()], d = Math.hypot(L[0].x - L[1].x, L[0].y - L[1].y);
          if (drag.pd) { camGoal.d = CAM.d = Math.max(5, Math.min(N * 2.2, CAM.d * drag.pd / Math.max(1, d))); }
          drag.pd = d; camGoal.th = CAM.th -= dx * 0.004; camGoal.ph = CAM.ph = Math.max(0.25, Math.min(1.35, CAM.ph - dy * 0.003));
          return;
        }
        if (p.b === 2 || e.shiftKey) { camGoal.th = CAM.th -= dx * 0.006; camGoal.ph = CAM.ph = Math.max(0.25, Math.min(1.35, CAM.ph - dy * 0.005)); return; }
        const k = CAM.d * 0.0018, s = Math.sin(CAM.th), c = Math.cos(CAM.th);
        CAM.tx -= (dx * c + dy * s) * k; CAM.tz -= (-dx * s + dy * c) * k; CAM.tx = clampB(CAM.tx); CAM.tz = clampB(CAM.tz); camGoal.tx = CAM.tx; camGoal.tz = CAM.tz; // Ink96：盤の外へ行きすぎない（前は盤が画面から消えて、まっ暗になった）
      });
      const up = (e) => {
        const p = P.get(e.pointerId); P.delete(e.pointerId);
        if (p && drag && drag.moved < 6 && P.size === 0 && p.b === 0 && pick) {
          const r = cv.getBoundingClientRect(), v = new TT.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
          const rc = new TT.Raycaster(); rc.setFromCamera(v, cam);
          let gcell = null; { const t0 = -rc.ray.origin.y / rc.ray.direction.y; if (t0 > 0) { const hp0 = rc.ray.origin.clone().addScaledVector(rc.ray.direction, t0); const gx0 = Math.round(hp0.x + half), gy0 = Math.round(hp0.z + half); if (gx0 >= 0 && gy0 >= 0 && gx0 < N && gy0 < N) gcell = { gx: gx0, gy: gy0 }; } }
          const hitU = unitAt(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
          // Ink97：ヒーローの体（剣など）が、光っている床のマスにかぶっていたら、床のマスを押したことにする（青いマスを押しても動かなかった）
          if (hitU && hitU.hero && gcell && (gcell.gx !== hitU.gx || gcell.gy !== hitU.gy) && HLset.has(gcell.gy * N + gcell.gx)) { pick(gcell.gx, gcell.gy); if (P.size === 0) drag = null; return; }
          if (hitU) { pick(hitU.gx, hitU.gy); if (P.size === 0) drag = null; return; }
          const t = -rc.ray.origin.y / rc.ray.direction.y; if (t > 0) { const hp = rc.ray.origin.clone().addScaledVector(rc.ray.direction, t); const gx = Math.round(hp.x + half), gy = Math.round(hp.z + half); if (gx >= 0 && gy >= 0 && gx < N && gy < N) pick(gx, gy); else pick(-1, -1); }
        }
        if (P.size === 0) drag = null;
      };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      cv.addEventListener('wheel', e => { e.preventDefault(); CAM.lock = true; camGoal.d = CAM.d = Math.max(5, Math.min(N * 2.2, CAM.d * (e.deltaY > 0 ? 1.1 : 0.9))); }, { passive: false });
      // ===== 演出の部品 =====
      const blobG = new TT.SphereGeometry(0.08, 10, 8), MC = {};
      const inkMat = (c) => MC[c] || (MC[c] = new TT.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, roughness: 0.3 }));
      const fx = {
        // インクの弾：a から b へ放物線
        shot(a, b, col, ms, h, sz) {
          sz = sz || 1;
          const m = new TT.Mesh(blobG, inkMat(col)); m.scale.setScalar(sz); scene.add(m); const tr = [];
          for (let i = 0; i < 4; i++) { const t = new TT.Mesh(blobG, inkMat(col)); t.scale.setScalar((0.75 - i * 0.16) * sz); scene.add(t); tr.push(t); }
          const H = h != null ? h : 0.4 + a.distanceTo(b) * 0.12;
          return IW3.tween(ms || 380, (t) => {
            const p = a.clone().lerp(b, t); p.y += Math.sin(t * Math.PI) * H; m.position.copy(p); m.scale.set(sz * (1 + 0.25 * Math.sin(t * 20)), sz * (1 - 0.2 * Math.sin(t * 20)), sz);
            tr.forEach((o, i) => { const tt = Math.max(0, t - (i + 1) * 0.05), q = a.clone().lerp(b, tt); q.y += Math.sin(tt * Math.PI) * H; o.position.copy(q); });
            if (t >= 1) { scene.remove(m); tr.forEach(o => scene.remove(o)); }
          });
        },
        // 飛沫：p のまわりに飛び散る（n 個）。床にしみを残す
        splash(p, col, n, power) {
          const L = []; n = n || 14; power = power || 1;
          for (let i = 0; i < n; i++) {
            const m = new TT.Mesh(blobG, inkMat(col)); const a = Math.random() * Math.PI * 2, sp = (0.8 + Math.random() * 1.6) * power;
            m.userData.v = new TT.Vector3(Math.cos(a) * sp, 2 + Math.random() * 2.6 * power, Math.sin(a) * sp); m.position.copy(p).add(new TT.Vector3(0, 0.8, 0)); m.scale.setScalar(0.6 + Math.random() * 0.9); scene.add(m); L.push(m);
          }
          let last = performance.now();
          return IW3.tween(700, (t) => {
            const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000) / IW3.speed; last = now;
            for (const m of L) { if (!m.parent) continue; m.userData.v.y -= 9 * dt; m.position.addScaledVector(m.userData.v, dt); if (m.position.y <= 0.02) { stain(m.position.x, m.position.z, col, 0.12 + Math.random() * 0.2); scene.remove(m); } }
            if (t >= 1) { for (const m of L) if (m.parent) { stain(m.position.x, m.position.z, col, 0.15); scene.remove(m); } stain(p.x, p.z, col, 0.5 + 0.2 * power); }
          });
        },
        // ビーム（レーザー）：a から b へ光る線
        beam(a, b, col, ms, w) {
          const len = a.distanceTo(b), g = new TT.CylinderGeometry(w || 0.05, w || 0.05, len, 8, 1, true); g.translate(0, len / 2, 0); g.rotateX(Math.PI / 2);
          const m = new TT.Mesh(g, new TT.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95, depthWrite: false, blending: TT.AdditiveBlending }));
          m.position.copy(a); m.lookAt(b); scene.add(m);
          return IW3.tween(ms || 420, (t) => { m.material.opacity = 0.95 * (1 - t * t); m.scale.set(1 + t, 1 + t, 1); if (t >= 1) { scene.remove(m); g.dispose(); } });
        },
        // 輪っか（薙ぎ払い・衝撃波・レーザーブレイク）
        ring(p, col, r, ms) {
          const g = new TT.RingGeometry(0.8, 1, 40); g.rotateX(-Math.PI / 2);
          const m = new TT.Mesh(g, new TT.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, depthWrite: false, side: TT.DoubleSide, blending: TT.AdditiveBlending }));
          m.position.copy(p); m.position.y = 0.5; scene.add(m);
          return IW3.tween(ms || 450, (t) => { const s = 0.3 + r * ease(t); m.scale.set(s, 1, s); m.material.opacity = 0.9 * (1 - t); if (t >= 1) { scene.remove(m); g.dispose(); } });
        },
        // 流星（ハレー彗星）：光る玉が a から b へ、尾を引いて
        comet(a, b, ms) {
          const m = new TT.Mesh(new TT.SphereGeometry(0.28, 14, 10), new TT.MeshBasicMaterial({ color: 0xfff2a8 })); scene.add(m);
          const tail = []; for (let i = 0; i < 8; i++) { const t = new TT.Mesh(new TT.SphereGeometry(0.22 - i * 0.022, 10, 8), new TT.MeshBasicMaterial({ color: i < 3 ? 0xffe066 : 0x7ac8ff, transparent: true, opacity: 0.8 - i * 0.09, blending: TT.AdditiveBlending, depthWrite: false })); scene.add(t); tail.push(t); }
          return IW3.tween(ms || 650, (t) => {
            const p = a.clone().lerp(b, ease(t)); p.y = 1.0; m.position.copy(p);
            tail.forEach((o, i) => { const q = a.clone().lerp(b, Math.max(0, ease(t) - (i + 1) * 0.035)); q.y = 1.0; o.position.copy(q); });
            if (t >= 1) { scene.remove(m); tail.forEach(o => scene.remove(o)); }
          });
        },
        flashAt(p, col) { return fx.ring(p, col, 1.4, 300); },
        // 撃った口の光（ぱっと光って消える）
        muzzle(p, col, r) {
          const m = new TT.Mesh(new TT.SphereGeometry(1, 12, 8), new TT.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, blending: TT.AdditiveBlending, depthWrite: false }));
          m.position.copy(p); scene.add(m); r = r || 0.12;
          return IW3.tween(170, (t) => { m.scale.setScalar(r * (0.4 + 1.4 * t)); m.material.opacity = 0.9 * (1 - t); if (t >= 1) { scene.remove(m); m.geometry.dispose(); m.material.dispose(); } });
        },
        // はじけたあとの、もとのスライム：ぷるぷるの小さな玉が、目をぱちぱちさせて、ぴょんぴょん逃げていく
        slime(p, col, dir) {
          const g = new TT.Group(), body = new TT.Mesh(new TT.SphereGeometry(0.16, 16, 12), new TT.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.25, roughness: 0.15, transparent: true, opacity: 0.88 }));
          body.position.y = 0.16; g.add(body);
          const eyeM = new TT.MeshBasicMaterial({ color: 0x1a1030 });
          for (const sx of [-1, 1]) { const e = new TT.Mesh(new TT.SphereGeometry(0.022, 8, 6), eyeM); e.position.set(sx * 0.055, 0.2, 0.14); e.scale.y = 1.4; g.add(e); }
          g.position.set(p.x, 0, p.z); g.rotation.y = Math.atan2(dir.x, dir.z); scene.add(g);
          const hops = 3, dist = 1.6;
          return IW3.tween(1200, (t) => {
            const k = t * hops, f = k % 1, n = Math.floor(k), hop = Math.sin(f * Math.PI);
            g.position.x = p.x + dir.x * dist * t; g.position.z = p.z + dir.z * dist * t; g.position.y = hop * (0.35 - n * 0.08);
            const sq = f < 0.12 || f > 0.9 ? 0.75 : 1.08; body.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
            const fade = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1; g.scale.setScalar(fade * (t < 0.08 ? t / 0.08 : 1)); body.material.opacity = 0.88 * fade;
            if (t >= 1) { scene.remove(g); body.geometry.dispose(); body.material.dispose(); }
          });
        },
        stain,
      };
      // ===== 吹き出し（HTML） =====
      const layer = document.createElement('div'); layer.className = 'iw-bubbles'; host.appendChild(layer);
      const BUB = [];
      const bubble = (getPos, text, cls, ms) => {
        const el = document.createElement('div'); el.className = 'iw-bub ' + (cls || ''); el.textContent = text; layer.appendChild(el);
        const o = { el, getPos, until: performance.now() + (ms || Math.min(2600, 900 + text.length * 90)) * Math.max(0.7, IW3.speed) };
        BUB.push(o); if (BUB.length > 7) { const x = BUB.shift(); x.el.remove(); }
        return o;
      };
      const v3 = new TT.Vector3();
      const updBubbles = (now) => {
        const r = cv.getBoundingClientRect();
        for (let i = BUB.length - 1; i >= 0; i--) {
          const b = BUB[i];
          if (now > b.until) { b.el.classList.add('out'); if (now > b.until + 300) { b.el.remove(); BUB.splice(i, 1); } continue; }
          const p = b.getPos(); if (!p) continue; v3.copy(p).project(cam);
          if (v3.z > 1) { b.el.style.display = 'none'; continue; }
          b.el.style.display = ''; b.el.style.left = ((v3.x + 1) / 2 * r.width) + 'px'; b.el.style.top = ((1 - v3.y) / 2 * r.height) + 'px';
        }
      };
      // ===== 毎フレーム =====
      const ticks = [];
      let raf = 0, alive = true, lastW = 0, lastH = 0;
      const loop = () => {
        if (!alive) return;
        raf = requestAnimationFrame(loop);
        const now = performance.now();
        for (let i = TW.length - 1; i >= 0; i--) { const o = TW[i], t = Math.min(1, (now - o.t0) / o.ms); try { o.fn(t); } catch (e) { console.error(e); } if (t >= 1) { TW.splice(i, 1); o.ok(); } }
        // カメラは、ゴールへなめらかに
        // Ink81：絵の速さ（こま数）に関係なく、同じ時間で落ちつく（前は1こまごとに12%。重い画面だと、カメラがいつまでも動いて、押した所がずれた）
        const dt = Math.min(0.5, Math.max(0, (now - (loop.t || now)) / 1000)); loop.t = now;
        const k = 1 - Math.pow(0.88, dt * 60); CAM.tx += (camGoal.tx - CAM.tx) * k; CAM.tz += (camGoal.tz - CAM.tz) * k; CAM.d += (camGoal.d - CAM.d) * k; CAM.th += (camGoal.th - CAM.th) * k; CAM.ph += (camGoal.ph - CAM.ph) * k; CAM.ty += (camGoal.ty - CAM.ty) * k;
        if (CAM.follow && !CAM.lock) { const p = CAM.follow(); if (p) { camGoal.tx = p.x; camGoal.tz = p.z; } }
        applyCam();
        for (const f of ticks) f(now);
        const w = host.clientWidth, h = host.clientHeight;
        if (w !== lastW || h !== lastH) { lastW = w; lastH = h; R.setPixelRatio(Math.min(1.75, W.devicePixelRatio || 1)); R.setSize(w, h, false); cam.aspect = w / Math.max(1, h); cam.updateProjectionMatrix(); }
        R.render(scene, cam);
        updBubbles(now);
      };
      applyCam(); loop();
      return {
        scene, cam, cv, R, N, half, tile, setHL, fx, bubble, CAM, camGoal, lookAt, ticks, shake, punch,
        onPick(f) { pick = f; },
        pickUnits(f) { unitsFn = f; }, // Ink81：押せる子の一覧 [{x,z,h,gx,gy}]
        follow(f) { CAM.follow = f; },
        unlock() { CAM.lock = false; },
        view(th, ph, d) { camGoal.th = th; camGoal.ph = ph; if (d) camGoal.d = d; },
        dispose() { alive = false; cancelAnimationFrame(raf); try { R.dispose(); R.forceContextLoss && R.forceContextLoss(); } catch (e) { } cv.remove(); layer.remove(); TW.length = 0; },
      };
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ---- src/ui/units3d.js ---- */
// ---- インク戦闘員ウォーズ：3Dの人たちと、出来事の見せ方（演出） ----
//   IW3.Stage.create(board, G)：盤の上に、ヒーローと戦闘員を立たせる。stage.play(ev)：対戦の出来事を順番に見せる（Promise）。
//   身ぶり：立つ（人によって構えがちがう）・歩く・キャノンを構える・ホースを向ける・ジャンプ噴射・インク漏れ（しゃがむ）・はじける（ぷしゅー）・よろこぶ。
//   骨の向き（測って確かめた）：右腕を前へ水平に＝R_UpperArm y＋1.5、左腕＝L_UpperArm y−1.5、両腕を上へ＝L z−1.2・R z＋1.2、
//     下ろした腕を前後に振る＝UpperArm x（＋が前）、前かがみ＝C_Spine x−、ひねる＝C_Spine y（＋で右肩が前）。
//     脚は IK：drop（腰を下げる）と legs:{L:{f 前, up 上, z 開き（L−・R＋が外）}} を渡すと、膝は前に正しく曲がり、足は床に着く。
//   歩く：進んだ距離から足の運び（位相）を出すので、足がすべらない。片足が床を押している間は、その足は床に止まって見える。
const QF = () => (window.IW3 && IW3.tempo === 'quick') ? 0.45 : 1; // Ink94：テンポ重視のときの、反応の時間の倍率
(function (W) {
  'use strict';
  const IW3 = W.IW3 = W.IW3 || {};
  const T = () => W.RING3D.THREE;
  const YAW = [0, -Math.PI / 2, Math.PI, Math.PI / 2];
  const CANNON_Y = (v) => v.cannons && v.cannons[0] ? v.cannons[0].getWorldPosition(new (T().Vector3)()).y : 1.15; // わきの下のキャノンの高さ
  const HOSE_Y = (v) => v.hose ? v.hose.getWorldPosition(new (T().Vector3)()).y : 0.78; // 腰のホースの高さ
  const restMode = (v) => v.u && v.u.sit ? 'sit' : v.u && v.u.state === 'leak' ? 'leak' : 'idle'; // ふだんの姿勢（ペタン座り・爆発寸前・ふつう）
  const lerpA = (a, b, t) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * t; };
  const STANCE = [ // 待機の構え（人によってちがう）
    { legs: { L: { z: -0.04 }, R: { z: 0.04 } } },
    { legs: { L: { z: -0.13, f: 0.02 }, R: { z: 0.13, f: -0.02 } } }, // 足を広げて立つ
    { legs: { L: { z: -0.12, f: 0.06 }, R: { z: 0.12, f: -0.04 } }, C_Spine: [-0.12, 0, 0], drop: 0.07 }, // 腰を落とす
    { legs: { L: { z: -0.06, f: 0.1 }, R: { z: 0.06, f: -0.08 } }, R_UpperArm: [0.15, 0, -1.25], R_LowerArm: [0, 0.9, 0], drop: 0.02 }, // 腰のホースに手をそえる
  ];
  // 歩きの1歩（ph：何歩目か＝位相（1周で2歩）、a：歩きの強さ 0〜1、step：1歩の長さ）
  const DS = 0.6; // 片足が床に着いている割合
  const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  function foot(u, S) { // u：その足の位相 0〜1 → 前・上・つま先
    if (u < DS) { // 床を押す：足は床に止まり、体が前へ進む
      const k = u / DS, heel = sm((k - 0.62) / 0.38);
      return { f: S / 2 - S * k, up: heel * 0.045, pitch: -heel * 0.42 + 0.22 * (1 - sm(k / 0.18)) };
    }
    const w = (u - DS) / (1 - DS); // 足を前へ運ぶ
    return { f: -S / 2 + S * (0.5 - 0.5 * Math.cos(Math.PI * w)), up: 0.045 * (1 - w) * (1 - w) + 0.085 * Math.sin(Math.PI * w), pitch: -0.42 * (1 - sm(w / 0.45)) + 0.22 * sm((w - 0.5) / 0.5) };
  }
  IW3.gait = function (ph, a, step) {
    const S = 2 * step * DS, uL = ((ph % 1) + 1) % 1, uR = (uL + 0.5) % 1;
    const fl = foot(uL, S), fr = foot(uR, S), c = Math.cos(Math.PI * 2 * ph);
    const sc = (o, z) => ({ f: o.f * a, up: o.up * a, pitch: o.pitch * a, z });
    return {
      legs: { L: sc(fl, -0.05), R: sc(fr, 0.05) },
      drop: a * (0.048 - 0.013 * Math.cos(Math.PI * 4 * (ph - DS / 2))),
      C_Spine: [-0.06 * a, 0.09 * a * c, 0], C_Neck: [0.03 * a, -0.07 * a * c, 0],
      L_UpperArm: [-0.42 * a * c, 0, 1.25], R_UpperArm: [0.42 * a * c, 0, -1.25],
      L_LowerArm: [0, -0.35 - 0.3 * a - 0.12 * a * Math.max(0, c), 0], R_LowerArm: [0, 0.35 + 0.3 * a + 0.12 * a * Math.max(0, -c), 0],
    };
  };
  IW3.Stage = {
    async create(B, G, onProgress) {
      const TT = T(), INK = IW3.INK;
      const views = new Map();
      const prog = (t) => onProgress && onProgress(t);
      prog('3Dの体を準備中…');
      const bases = [];
      const MD = IW3.models(); // 見た目の型（モデルの部屋で変えられる）
      const hexN = (h) => parseInt(String(h).replace('#', ''), 16);
      // ヒーロー対決：型の髪・肌・顔・服を使い、服の色は「インク団の紫でおそろい」か「型の色」
      const USE = IW3.usedTypes(MD); // 試合に出す型（モデルの部屋で選ぶ）
      const faces = USE.map(i => Object.assign({}, MD.minions[i], { pal: MD.heroModeColor === 'type' ? MD.minions[i].pal : IW3.INK_PAL }));
      // 紅白戦・個人戦：組ごとに服とインクの色を変える（赤組＝赤、白組＝白と水色）。顔と髪は、組ごとに2種類
      const TEAMS = G.hero ? null : { red: { ink: INK.red, pal: ['#2a2633', '#f0466e', '#1c1a22'] }, white: { ink: INK.white, pal: ['#eef0f6', '#3ec6ff', '#c9ccd8'] } };
      const tb = {};
      // 個人戦：服の色8種類（髪と肌は4種類）。足もとの輪は40人とも別の色
      const SOLO = G.mode === 'solo' ? [['#2a2633', '#f0466e', '#1c1a22', 0xf0466e], ['#1f2a4a', '#3e7bff', '#141a2e', 0x3e7bff], ['#1f3a2a', '#3ed27a', '#14241a', 0x3ed27a], ['#3a3420', '#ffd23a', '#241f12', 0xffd23a], ['#3a2236', '#ff6ad5', '#24141f', 0xff6ad5], ['#3a2a1f', '#ff8a3a', '#24180f', 0xff8a3a], ['#eef0f6', '#3ec6ff', '#c9ccd8', 0x3ec6ff], ['#2a2633', '#b04df0', '#1c1a22', 0xb04df0]] : null;
      const sb = [];
      if (SOLO) for (let k = 0; k < USE.length; k++) { const f = MD.minions[USE[k]], ink = hexN(f.pal[1]); sb.push({ b: await IW3.makeMinionBase('solo' + k, ink, f), f, ink }); /* 個人戦：型ごとの服の色。インクの色も、その服の色 */ prog('3Dの体を準備中…（' + (k + 1) + '/' + USE.length + '）'); }
      else if (TEAMS) {
        let n = 0; for (const tm of ['red', 'white']) { tb[tm] = []; for (const fi of (USE.length < 2 ? USE : USE.filter((x, i) => (i % 2 === 0) === (tm === 'red')))) { const f = Object.assign({}, MD.minions[fi], { pal: TEAMS[tm].pal }); /* 紅白戦：型の髪・顔・服の形で、色は組の色 */ tb[tm].push({ b: await IW3.makeMinionBase(tm + fi, TEAMS[tm].ink, f), f }); prog('3Dの体を準備中…（' + (++n) + '）'); } }
      } else for (let i = 0; i < faces.length; i++) { bases.push(await IW3.makeMinionBase('ink' + i, INK.ink, faces[i])); prog('3Dの体を準備中…（' + (i + 1) + '/' + (faces.length + 1) + '）'); }
      const chiefB = (G.units || []).some(u => u.chief) ? await IW3.makeMinionBase('noir', INK.ink, IW3.noirFace()) : null; // Ink90：首領は専用の見た目（のじゃチビ）
      const heroM = G.hero ? await IW3.makeHero(G.hero.power) : null; prog('盤を並べています…');
      const SLIME = { 'スライム青': 0x5aa0ff, 'スライム紫': 0x9a6cff, 'スライム水色': 0x5ae0f0 };
      const RING_G = new TT.RingGeometry(0.3, 0.4, 28); RING_G.rotateX(-Math.PI / 2);
      const RING_R = new TT.MeshBasicMaterial({ color: 0xff4a6a, transparent: true, opacity: 0.85, depthWrite: false }), RING_W = new TT.MeshBasicMaterial({ color: 0xf4f6ff, transparent: true, opacity: 0.85, depthWrite: false });
      // ヒーローのほかの姿は、遊んでいる間に裏で用意しておく
      const FORMS = { hero: Promise.resolve(heroM) };
      const getForm = (f) => FORMS[f] || (FORMS[f] = IW3.makeHeroForm(f, G.hero.power));
      if (G.hero) setTimeout(() => { getForm('broken').then(() => getForm('civil')).then(() => getForm('slime')).catch(() => { }); }, 2500);
      // ステージのインクタンク（物）：金属のタンクに、中のスライムインクが見える窓。人とちがって骨はない
      const BARREL = G.units.some(u => u.kind === 'barrel') ? (() => {
        const gBody = new TT.CylinderGeometry(0.3, 0.3, 0.78, 22), gBand = new TT.TorusGeometry(0.305, 0.028, 8, 26), gWin = new TT.CylinderGeometry(0.308, 0.308, 0.4, 22, 1, true, -0.75, 1.5), gCap = new TT.CylinderGeometry(0.2, 0.26, 0.08, 18), gVal = new TT.CylinderGeometry(0.05, 0.05, 0.12, 10);
        gBand.rotateX(Math.PI / 2);
        const mBody = new TT.MeshStandardMaterial({ color: 0x55507a, metalness: 0.55, roughness: 0.38 }), mBand = new TT.MeshStandardMaterial({ color: 0x2a2738, metalness: 0.6, roughness: 0.4 }), mCap = new TT.MeshStandardMaterial({ color: 0x8a86a6, metalness: 0.6, roughness: 0.3 });
        return { gBody, gBand, gWin, gCap, gVal, mBody, mBand, mCap };
      })() : null;
      let FULLM = null; // 満タンの印の絵（1つを使い回す）
      const fullMarkMat = () => {
        if (FULLM) return FULLM;
        const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d');
        g.beginPath(); g.moveTo(48, 6); g.bezierCurveTo(70, 34, 84, 50, 84, 62); g.arc(48, 62, 36, 0, Math.PI); g.bezierCurveTo(12, 50, 26, 34, 48, 6); g.closePath();
        g.fillStyle = '#b04df0'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#ffffff'; g.stroke();
        g.fillStyle = '#fff'; g.font = 'bold 38px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('満', 48, 62);
        const tx = new TT.CanvasTexture(c); tx.colorSpace = TT.SRGBColorSpace || tx.colorSpace;
        FULLM = new TT.SpriteMaterial({ map: tx, depthTest: false, transparent: true }); return FULLM;
      };
      const mkBarrel = (u) => {
        const R = BARREL, root = new TT.Group();
        const body = new TT.Mesh(R.gBody, R.mBody); root.add(body);
        for (const y of [-0.27, 0.27]) { const b = new TT.Mesh(R.gBand, R.mBand); b.position.y = y; root.add(b); }
        const inkMat = new TT.MeshStandardMaterial({ color: INK.ink, emissive: INK.ink, emissiveIntensity: 0.6, transparent: true, opacity: 0.92, roughness: 0.2 });
        for (const a of [0, Math.PI]) { const w = new TT.Mesh(R.gWin, inkMat); w.rotation.y = a; root.add(w); } // 前と後ろの窓（中のインクが光る）
        const cap = new TT.Mesh(R.gCap, R.mCap); cap.position.y = 0.43; root.add(cap);
        const val = new TT.Mesh(R.gVal, R.mBand); val.position.set(0.08, 0.5, 0); root.add(val);
        root.traverse(m => { if (m.isMesh) m.castShadow = !m.userData.noShadow; }); // Ink89：顔の部品・髪の小物は影を描かない
        const v = { kind: 'barrel', prop: true, root, inkMat, inkCol: INK.ink, id: u.id, u, gx: u.x, gy: u.y, yaw: (u.id * 1.7) % (Math.PI * 2), yawT: 0, mode: 'idle', t0: performance.now() + Math.random() * 3000, sc: 1, sq: 0, lift: 0, glow: 0 };
        v.yawT = v.yaw; B.scene.add(root); views.set(u.id, v); placeV(v); return v;
      };
      // 第3層の柱：倉庫のコンクリートの柱（紫の線と、インクのしみ）。動かない・こわれない
      const WALL = G.units.some(u => u.kind === 'wall') ? { g: new TT.BoxGeometry(0.86, 1.25, 0.86), gb: new TT.BoxGeometry(0.9, 0.08, 0.9), gs: new TT.BoxGeometry(0.87, 0.07, 0.87),
        m: new TT.MeshStandardMaterial({ color: 0x6d6a78, roughness: 0.85, metalness: 0.05 }), mb: new TT.MeshStandardMaterial({ color: 0x3a3746, roughness: 0.7 }), ms: new TT.MeshStandardMaterial({ color: INK.ink, emissive: INK.ink, emissiveIntensity: 0.35 }) } : null;
      const mkWall = (u) => {
        const R = WALL, root = new TT.Group();
        const body = new TT.Mesh(R.g, R.m); body.position.y = 0.625; root.add(body);
        for (const y of [0.04, 1.25]) { const b = new TT.Mesh(R.gb, R.mb); b.position.y = y; root.add(b); }
        const st = new TT.Mesh(R.gs, R.ms); st.position.y = 0.9; root.add(st);
        root.traverse(m => { if (m.isMesh) { m.castShadow = !m.userData.noShadow; m.receiveShadow = true; } });
        const v = { kind: 'wall', prop: true, wall: true, root, id: u.id, u, gx: u.x, gy: u.y, yaw: 0, yawT: 0, mode: 'idle', t0: 0, sc: 1, sq: 0, lift: 0 };
        B.scene.add(root); views.set(u.id, v); const p = B.tile(u.x, u.y); root.position.set(p.x, 0, p.z); return v;
      };
      // ボーナス（固定砲台部隊）：部屋の奥の壁に、大きなマス目。子は大の字で、手首と足首を壁に固定されている
      //   engine では、いちばん手前の列が壁のいちばん下の段、奥の列ほど上の段（奥の列は壁のうしろにかくれる）
      const PIN = (() => {
        const P = G.units.filter(u => u.pinned); if (!P.length) return null;
        const xs = P.map(u => u.x), ys = P.map(u => u.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        const SC = 0.78, RH = 1.42, wz = B.tile(0, y1).z - 0.5, rows = y1 - y0 + 1, cols = x1 - x0 + 1, cx = (B.tile(x0, 0).x + B.tile(x1, 0).x) / 2, Hh = rows * RH + 0.35, Ww = cols + 0.5;
        const g = new TT.Group(); B.scene.add(g);
        const wall = new TT.Mesh(new TT.BoxGeometry(Ww + 1.2, Hh + 0.6, 0.3), new TT.MeshStandardMaterial({ color: 0x2c2838, roughness: 0.9 })); wall.position.set(cx, (Hh + 0.6) / 2 - 0.05, wz - 0.2); g.add(wall);
        const lm = new TT.MeshStandardMaterial({ color: 0x9a5cff, emissive: 0x9a5cff, emissiveIntensity: 0.6 });
        for (let i = 0; i <= cols; i++) { const b = new TT.Mesh(new TT.BoxGeometry(0.06, Hh, 0.06), lm); b.position.set(cx - cols / 2 + i, Hh / 2 + 0.05, wz - 0.02); g.add(b); }
        for (let j = 0; j <= rows; j++) { const b = new TT.Mesh(new TT.BoxGeometry(cols, 0.06, 0.06), lm); b.position.set(cx, 0.1 + j * RH, wz - 0.02); g.add(b); }
        const cg = new TT.TorusGeometry(0.07, 0.025, 6, 14), cm = new TT.MeshStandardMaterial({ color: 0x1a1822, metalness: 0.6, roughness: 0.3, emissive: 0x5a2aa0, emissiveIntensity: 0.4 });
        const pinOf = (u) => { const p = B.tile(u.x, 0), foot = 0.14 + (y1 - u.y) * RH; return { x: p.x, z: wz + 0.22, foot }; };
        for (const u of P) { const q = pinOf(u); for (const [dx, dy] of [[-0.5, 1.33], [0.5, 1.33], [-0.27, 0.06], [0.27, 0.06]]) { const c = new TT.Mesh(cg, cm); c.position.set(q.x + dx, q.foot + dy, wz + 0.05); g.add(c); } } // 手首・足首の留め具
        return { SC, pinOf, center: { x: cx, z: wz, h: Hh } };
      })();
      IW3.pinInfo = PIN ? PIN.center : null;
      // 第5層のインクだまり：床に、つやのある紫の水たまり。ゆっくりゆらぐ。はじけた所に、あとからふえる（S.addPuddle）
      const PUD = new Map();
      const pudG = new TT.CircleGeometry(0.47, 22); pudG.rotateX(-Math.PI / 2);
      const pudM = new TT.MeshStandardMaterial({ color: INK.ink, emissive: INK.ink, emissiveIntensity: 0.18, roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.88, depthWrite: false });
      const addPuddle = (x, y, grow) => {
        const k = y * G.N + x; if (PUD.has(k)) return;
        const p = B.tile(x, y), m = new TT.Mesh(pudG, pudM); m.position.set(p.x, 0.009, p.z); m.renderOrder = 1; m.rotation.y = Math.random() * 6; B.scene.add(m); PUD.set(k, { m, ph: Math.random() * 6, s: grow ? 0.05 : 1 });
      };
      if (G.puddle) { for (let k = 0; k < G.N * G.N; k++) if (G.puddle[k]) addPuddle(k % G.N, Math.floor(k / G.N)); B.ticks.push((now) => { const t = now / 1000; for (const o of PUD.values()) { if (o.s < 1) o.s = Math.min(1, o.s + 0.04); const w = 1 + 0.03 * Math.sin(t * 1.6 + o.ph); o.m.scale.set(o.s * w, 1, o.s * (2 - w)); } }); }
      // 第8層のワープ床：同じ色の光る輪が2つずつ（つながっている）。ゆっくり回る
      const PADCOL = [0x5ae0ff, 0xff6ad5, 0xffd23a, 0x7dff6a, 0xb08aff, 0xff8a3a, 0xffffff, 0x3e7bff, 0xff4a5a];
      IW3.padColor = (pair) => PADCOL[(pair - 1) % PADCOL.length];
      if (G.pads) {
        const gR = new TT.RingGeometry(0.28, 0.42, 28), gD = new TT.CircleGeometry(0.27, 24); gR.rotateX(-Math.PI / 2); gD.rotateX(-Math.PI / 2);
        const pads = G.pads.map((pd) => { const col = IW3.padColor(pd.pair), g = new TT.Group(), q = B.tile(pd.x, pd.y);
          const r = new TT.Mesh(gR, new TT.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, depthWrite: false })), d = new TT.Mesh(gD, new TT.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.25, depthWrite: false }));
          for (let k = 0; k < 3; k++) { const dot = new TT.Mesh(new TT.SphereGeometry(0.04, 8, 6), new TT.MeshBasicMaterial({ color: col })); dot.position.set(Math.cos(k * 2.1) * 0.35, 0.03, Math.sin(k * 2.1) * 0.35); r.add(dot); }
          g.add(r, d); g.position.set(q.x, 0.011, q.z); r.renderOrder = 2; d.renderOrder = 2; B.scene.add(g); return { r, d }; });
        B.ticks.push((now) => { const t = now / 1000; pads.forEach((o, i) => { o.r.rotation.y = t * 1.2 + i; o.d.material.opacity = 0.18 + 0.12 * Math.sin(t * 3 + i); }); });
      }
      // 第4層のベルトコンベア：床に金属の板と、流れる矢印（＞）。光るマス（移動・ねらい）より下に置いて、じゃましない
      if (G.belt) {
        const gP = new TT.BoxGeometry(0.94, 0.008, 0.94), mP = new TT.MeshStandardMaterial({ color: 0x2a2d38, metalness: 0.6, roughness: 0.45 });
        const gC = new TT.BoxGeometry(0.34, 0.006, 0.07), mC = new TT.MeshStandardMaterial({ color: 0xc8ff3a, emissive: 0xc8ff3a, emissiveIntensity: 0.75 });
        const chev = [];
        for (let y = 0; y < G.N; y++) for (let x = 0; x < G.N; x++) {
          const d = G.belt[y * G.N + x]; if (d < 0) continue;
          const p = B.tile(x, y), plate = new TT.Mesh(gP, mP); plate.position.set(p.x, 0.004, p.z); plate.receiveShadow = true; B.scene.add(plate);
          for (let k = 0; k < 2; k++) { // ＞ の形（2本の棒）
            const g = new TT.Group(); for (const s of [1, -1]) { const b = new TT.Mesh(gC, mC); b.position.set(-0.09, 0, s * 0.11); b.rotation.y = s * 0.75; g.add(b); }
            g.rotation.y = [Math.PI / 2, 0, -Math.PI / 2, Math.PI][d]; g.position.set(p.x, 0.01, p.z); B.scene.add(g); chev.push({ g, p, D: IW.DIRS[d], k });
          }
        }
        B.ticks.push((now) => { const t = now / 1000 * 0.55; for (const c of chev) { const f = ((t + c.k * 0.5) % 1) - 0.5; c.g.position.set(c.p.x + c.D[0] * f * 0.8, 0.01, c.p.z + c.D[1] * f * 0.8); } });
      }
      // 第7層の鏡：ななめに立った鏡の板（銀色・水色のふち）。'/' と '\\' で向きがちがう
      const MIR = G.units.some(u => u.kind === 'mirror') ? { g: new TT.BoxGeometry(1.15, 1.3, 0.07), f: new TT.BoxGeometry(1.2, 0.07, 0.12), m: new TT.MeshStandardMaterial({ color: 0xdfe8ff, metalness: 1, roughness: 0.06, emissive: 0x3a5a8a, emissiveIntensity: 0.35 }), mf: new TT.MeshStandardMaterial({ color: 0x7ff0ff, emissive: 0x7ff0ff, emissiveIntensity: 0.7 }) } : null;
      const mkMirror = (u) => {
        const root = new TT.Group(), p = new TT.Mesh(MIR.g, MIR.m); p.position.y = 0.72; root.add(p);
        for (const y of [0.06, 1.38]) { const f = new TT.Mesh(MIR.f, MIR.mf); f.position.y = y; root.add(f); }
        root.rotation.y = u.mirror === '/' ? Math.PI / 4 : -Math.PI / 4;
        const v = { kind: 'mirror', prop: true, wall: true, root, id: u.id, u, gx: u.x, gy: u.y, yaw: root.rotation.y, yawT: root.rotation.y, mode: 'idle', t0: 0, sc: 1, sq: 0, lift: 0 };
        B.scene.add(root); views.set(u.id, v); const q = B.tile(u.x, u.y); root.position.set(q.x, 0, q.z); return v;
      };
      // 特別ステージの鉄柱：太さ10センチ・高さ約4メートルの鉄の柱（根もとに台）
      const POLE = G.units.some(u => u.kind === 'pole') ? { g: new TT.CylinderGeometry(0.05, 0.05, 4.2, 14), b: new TT.CylinderGeometry(0.22, 0.28, 0.12, 18), t: new TT.SphereGeometry(0.08, 12, 8), m: new TT.MeshStandardMaterial({ color: 0x9aa0b0, metalness: 0.85, roughness: 0.3 }), mb: new TT.MeshStandardMaterial({ color: 0x3a3746, metalness: 0.5, roughness: 0.5 }) } : null;
      const mkPole = (u) => {
        const root = new TT.Group(), c = new TT.Mesh(POLE.g, POLE.m); c.position.y = 2.1; root.add(c);
        const b = new TT.Mesh(POLE.b, POLE.mb); b.position.y = 0.06; root.add(b); const t = new TT.Mesh(POLE.t, POLE.m); t.position.y = 4.22; root.add(t);
        root.traverse(m => { if (m.isMesh) m.castShadow = !m.userData.noShadow; }); // Ink89：顔の部品・髪の小物は影を描かない
        const v = { kind: 'pole', prop: true, wall: true, root, id: u.id, u, gx: u.x, gy: u.y, yaw: 0, yawT: 0, mode: 'idle', t0: 0, sc: 1, sq: 0, lift: 0 };
        B.scene.add(root); views.set(u.id, v); const q = B.tile(u.x, u.y); root.position.set(q.x, 0, q.z); return v;
      };
      // 鉄柱につながった子からは、インクのしずくが下へ流れ落ちる（下の子に当たると、その子が少しふるえる）
      if (G.poles) {
        const dG = new TT.SphereGeometry(0.035, 8, 6), dM = new TT.MeshBasicMaterial({ color: INK.ink }), drops = []; let last = 0;
        B.ticks.push((now) => {
          const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
          if (drops.length < 40) for (const v of views.values()) { if (!v.stuck || v.fly || v.gone || !v.root.parent || Math.random() > dt * 1.4) continue; const o = stuckPos(v.stuck, v), m = new TT.Mesh(dG, dM); m.position.set(o.x + (Math.random() - 0.5) * 0.1, o.y - 0.08, o.z + (Math.random() - 0.5) * 0.1); B.scene.add(m); drops.push({ m, vy: 0, pole: v.stuck.pole, idx: v.stuck.idx }); }
          for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.vy -= 9 * dt; d.m.position.y += d.vy * dt;
            const below = [...views.values()].find(w => w.stuck && !w.gone && w.stuck.pole === d.pole && w.stuck.idx === d.idx - 1), floorY = below ? stuckPos(below.stuck, below).y + 0.08 : 0.02;
            if (d.m.position.y <= floorY) { B.scene.remove(d.m); drops.splice(i, 1); if (below) below.lift = 0.012; } }
        });
      }
      // 鉄柱につながった子の場所：体の右の装備（タンクの端と腰のホース）に柱が通り、体は柱の横に寝る（あおむけ・うつぶせ）。下から順に重なる
      // 鉄柱にささった子の位置：ホースの付け根（腰の横）が、ちょうど柱の中心を通るように置く（v がないとき・ホースがない子は、前と同じ「腰の横 0.24」）
      const hoseLocal = (v) => {
        if (!v || !v.hose) return null; if (v.hoseL) return v.hoseL;
        const TT3 = W.RING3D.THREE; v.root.updateMatrixWorld(true); const w = new TT3.Vector3(); v.hose.getWorldPosition(w);
        const l = v.root.worldToLocal(w); l.multiply(v.root.scale); return (v.hoseL = l); // 体の中心（腰）から見たホースの付け根
      };
      const stuckPos = (s, v) => {
        const q = B.tile(s.px, s.py), y = 0.2 + s.idx * 0.3, hl = hoseLocal(v);
        if (!hl) { const r = 0.24; return { x: q.x - r * Math.cos(s.ang), y, z: q.z + r * Math.sin(s.ang) }; }
        const TT3 = W.RING3D.THREE, o = hl.clone().applyEuler(new TT3.Euler(s.face === 'up' ? Math.PI / 2 : -Math.PI / 2, s.ang, 0, 'YXZ'));
        return { x: q.x - o.x, y: y - o.y, z: q.z - o.z };
      };
      const mk = (u) => {
        if (u.kind === 'pole') return mkPole(u);
        if (u.kind === 'barrel') return mkBarrel(u);
        if (u.kind === 'wall') return mkWall(u);
        if (u.kind === 'mirror') return mkMirror(u);
        let v;
        if (u.kind === 'hero') v = Object.assign({ kind: 'hero' }, heroM);
        else if (SOLO) { const e = sb[(u.color || 0) % sb.length]; v = Object.assign({ kind: 'minion' }, IW3.cloneMinion(e.b)); v.slimeCol = SLIME[e.f.skin] || 0x5aa0ff; v.inkCol = e.ink; }
        else if (TEAMS) { const e = tb[u.team][u.id % tb[u.team].length]; v = Object.assign({ kind: 'minion' }, IW3.cloneMinion(e.b)); v.slimeCol = SLIME[e.f.skin] || 0x5aa0ff; v.inkCol = TEAMS[u.team].ink; }
        else { const bi = u.chief && !chiefB ? bases.length - 1 : u.id % bases.length; v = Object.assign({ kind: 'minion' }, IW3.cloneMinion(u.chief && chiefB ? chiefB : bases[bi])); v.slimeCol = u.chief && chiefB ? (SLIME[IW3.NOIR_LOOK.skin] || 0x5aa0ff) : SLIME[faces[bi].skin] || 0x5aa0ff; v.inkCol = INK.ink; }
        if (TEAMS && u.kind === 'minion') { // 足もとの組の輪（どちらの組か、ひと目でわかるように）。自分の子（個人戦）には、頭の上に矢印
          const ring = new TT.Mesh(RING_G, SOLO ? new TT.MeshBasicMaterial({ color: new TT.Color().setHSL(((u.color || 0) * 0.618) % 1, 0.85, 0.6), transparent: true, opacity: 0.85, depthWrite: false }) : u.team === 'red' ? RING_R : RING_W); ring.renderOrder = 2; B.scene.add(ring); v.ring = ring;
          if (u.mine) { const ar = new TT.Mesh(new TT.ConeGeometry(0.12, 0.26, 4), new TT.MeshBasicMaterial({ color: 0xffe14a })); ar.rotation.x = Math.PI; B.scene.add(ar); v.arrow = ar; }
        }
        if (u.chief) { const cr = IW3.makeCrown(); B.scene.add(cr); v.arrow = cr; v.crown = true; } /* 首領（第9層）：頭の上に金の王冠 */
        else         if (u.boss) { const ar = new TT.Mesh(new TT.ConeGeometry(0.12, 0.26, 4), new TT.MeshBasicMaterial({ color: u.exec ? 0xff4ad8 : 0xffd84a })); ar.rotation.x = Math.PI; ar.scale.setScalar(u.exec ? 2.2 : 1.7); /* Ink81：班長も、ひと目でわかる大きさに */ B.scene.add(ar); v.arrow = ar; } /* 班長（ステージ）：頭の上に金色の印。幹部は大きなピンクの印 */
        else if (u.medic) { const cr = new TT.Group(), cm = new TT.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff8ad8, emissiveIntensity: 0.5 }); cr.add(new TT.Mesh(new TT.BoxGeometry(0.22, 0.07, 0.07), cm)); cr.add(new TT.Mesh(new TT.BoxGeometry(0.07, 0.22, 0.07), cm)); B.scene.add(cr); v.arrow = cr; } /* 救護係（第6層）：頭の上に白い十字 */
        v.id = u.id; v.u = u; v.gx = u.x; v.gy = u.y; v.yaw = YAW[u.dir]; v.yawT = v.yaw; v.mode = 'idle'; v.t0 = performance.now() + Math.random() * 3000;
        v.stance = u.kind === 'hero' ? 0 : u.id % STANCE.length; v.lift = 0; v.extra = null; v.sc = u.chief ? (u.awake ? 1.35 : 0.62) : u.exec ? 1.13 : u.boss && u.hp0 ? 1.06 : 1; if (u.chief) v.base = v.sc; /* 首領はチビ。覚醒すると大きく */
        if (u.pinned && PIN) { const q = PIN.pinOf(u); v.pin = q; v.sc = PIN.SC; v.yaw = v.yawT = YAW[2]; }
        B.scene.add(v.root); views.set(u.id, v); placeV(v); return v;
      };
      const placeV = (v) => { if (v.fly || v.stuck) { const o = v.fly || stuckPos(v.stuck, v); v.root.rotation.order = 'YXZ'; v.root.position.set(o.x, o.y + v.lift, o.z); v.root.rotation.y = v.fly ? v.fly.ry : v.stuck.ang; v.root.rotation.x = v.fly ? v.fly.rx : (v.stuck.face === 'up' ? Math.PI / 2 : -Math.PI / 2); v.root.rotation.z = 0; return; } /* 鉄柱へ飛んでいく・つながって寝ている */ if (v.pin) { v.root.position.set(v.pin.x, v.pin.foot + v.rig.hip * v.sc + v.lift, v.pin.z); v.root.rotation.y = v.yaw; return; } const p = B.tile(v.gx, v.gy); v.root.position.set(p.x, v.prop ? 0.39 + v.lift : v.rig.hip + v.lift - (v.drop || 0), p.z); v.root.rotation.y = v.yaw; };
      for (const u of G.units) if (!u.gone) mk(u);
      const posOf = (id, h) => { const v = views.get(id); if (!v) return null; if (v.stuck && !v.fly) { const o = stuckPos(v.stuck, v); return new TT.Vector3(o.x, o.y + 0.15, o.z); } /* 鉄柱につながった子 */ if (v.pin) return new TT.Vector3(v.pin.x, v.pin.foot + (h != null ? h : 1.15) * v.sc, v.pin.z + 0.15); const p = B.tile(v.gx, v.gy); p.y = h != null ? h : 1.15; return p; };
      const headOf = (id) => () => { const v = views.get(id); if (!v || !v.root.parent) return null; const p = v.root.position.clone(); p.y += 0.95 * (v.sc || 1); return p; };
      // ===== 毎フレームの身ぶり =====
      B.ticks.push((now) => {
        for (const v of views.values()) {
          if (!v.root.parent) continue;
          if (v.wall) continue; // 柱は動かない
          if (v.prop) { // インクタンク：中のインクがゆっくり光る。爆発の前は、ぶるぶるふるえる
            const t = (now - v.t0) / 1000, sh = v.shake || 0;
            v.inkMat.emissiveIntensity = 0.45 + 0.2 * Math.sin(t * 2.4) + (v.glow || 0);
            placeV(v);
            if (sh) { v.root.position.x += Math.sin(now * 0.11) * 0.05 * sh; v.root.position.z += Math.cos(now * 0.13) * 0.05 * sh; v.root.rotation.z = Math.sin(now * 0.09) * 0.08 * sh; }
            const sq = v.sq || 0; v.root.scale.set(v.sc * (1 + sq * 0.7), v.sc * (1 - sq), v.sc * (1 + sq * 0.7));
            continue;
          }
          const t = (now - v.t0) / 1000, br = Math.sin(t * 2.2) * 0.02;
          let P = JSON.parse(JSON.stringify(STANCE[v.stance] || {})), drop = P.drop || 0; delete P.drop;
          P.C_Spine = [(P.C_Spine ? P.C_Spine[0] : 0) + br, 0, 0]; P.C_Neck = [br * 0.6, 0, 0];
          const isH = v.kind === 'hero' && v.form !== 'slime', slimy = !isH;
          if (isH) { P.R_UpperArm = [0, 0.5, -1.0]; P.R_LowerArm = [0, 0.6, 0]; P.legs = { L: { z: -0.12, f: 0.05 }, R: { z: 0.12, f: -0.05 } }; }
          const m = v.mode;
          if (m === 'walk') {
            const W = IW3.gait(v.wph || 0, v.wamp || 0, v.wstep || 0.4); drop = W.drop; delete W.drop;
            if (v.wlegs) { W.legs.L.f = v.wlegs.L.f; W.legs.R.f = v.wlegs.R.f; W.legs.L.up = v.wlegs.L.up; W.legs.R.up = v.wlegs.R.up; W.legs.L.pitch = v.wlegs.L.pitch; W.legs.R.pitch = v.wlegs.R.pitch; }
            if (isH) { W.R_UpperArm[2] = -1.15; W.R_LowerArm = [0, 0.8, 0]; W.L_UpperArm[0] *= 1.4; W.R_UpperArm[0] *= 1.2; W.C_Spine[1] *= 1.3; drop *= 1.15; }
            Object.assign(P, W); P.C_Spine[0] += br;
          }
          else if (m === 'cannonW') { const k = Math.min(1, (now - v.mt) / (170 * IW3.speed)); P.C_Spine = [0.12 * k, 0, 0]; P.C_Neck = [-0.1 * k, 0, 0]; P.L_UpperArm = [0.2, 0, 1.0]; P.R_UpperArm = [0.2, 0, -1.0]; P.L_LowerArm = [0, -1.0, 0]; P.R_LowerArm = [0, 1.0, 0]; P.legs = { L: { f: 0.22, z: -0.12 }, R: { f: -0.2, z: 0.12 } }; drop = 0.04 + 0.06 * k; }
          else if (m === 'hoseW') { const k = Math.min(1, (now - v.mt) / (170 * IW3.speed)); P.R_UpperArm = [0.2, 0, -1.25]; P.R_LowerArm = [0, 0.95, 0]; P.L_UpperArm = [0.5 * k, 0, 1.1]; P.L_LowerArm = [0, -0.9, 0]; P.C_Spine = [-0.1 * k, 0, 0]; P.legs = { L: { f: 0.2, z: -0.14 }, R: { f: -0.18, z: 0.12 } }; drop = 0.06 + 0.05 * k; } // 腰を落として、ホースを相手へ
          else if (m === 'hurt') { const k = Math.min(1, (now - v.mt) / (320 * IW3.speed)), a = Math.sin(Math.min(1, k * 1.6) * Math.PI) ; P.C_Spine = [0.35 * a, 0, 0.08 * a]; P.C_Neck = [0.3 * a, 0, 0]; P.L_UpperArm = [0.3 * a, 0, 1.32 - 0.6 * a]; P.legs = { L: { f: 0.05 - 0.1 * a, z: -0.14 }, R: { f: -0.15 * a, z: 0.14 } }; drop = 0.04 * a; }
          else if (m === 'kneel') { P.legs = { L: { f: 0.3, z: -0.1 }, R: { f: -0.25, z: 0.12, up: 0.0, pitch: -0.6 } }; drop = 0.42; P.C_Spine = [-0.45, 0, 0.06]; P.C_Neck = [-0.35, 0, 0]; P.L_UpperArm = [0.6, 0, 1.25]; P.R_UpperArm = [0.4, 0, -1.3]; P.L_LowerArm = [0, -0.4, 0]; }
          else if (m === 'cannon') { P.C_Spine = [-0.18, 0, 0]; P.legs = { L: { f: 0.2, z: -0.1 }, R: { f: -0.18, z: 0.1 } }; drop = 0.07; }
          else if (m === 'hose') { P.R_UpperArm = [0.2, 0, -1.25]; P.R_LowerArm = [0, 0.95, 0]; P.L_UpperArm = [0.5, 0, 1.1]; P.L_LowerArm = [0, -0.9, 0]; P.C_Spine = [-0.06, 0, 0]; P.legs = { L: { f: 0.2, z: -0.14 }, R: { f: -0.18, z: 0.12 } }; drop = 0.1; }
          else if (m === 'jump') { P.legs = { L: { f: 0.08, up: 0.24, z: -0.28, pitch: -0.3 }, R: { f: 0.02, up: 0.2, z: 0.28, pitch: -0.3 } }; P.L_UpperArm = [0, 0, 0.3]; P.R_UpperArm = [0, 0, -0.3]; }
          else if (m === 'sit') { // ペタン座り：膝を前でそろえ、足先を左右へ。お尻は床に。手は床について、ぶるぶるふるえる（動けない）
            const tr = Math.sin(now * 0.06 + v.id) * 0.05;
            P.L_UpperLeg = [1.5, -1.0, -0.2]; P.R_UpperLeg = [1.5, 1.0, 0.2]; P.L_LowerLeg = [-2.7, 0, 0]; P.R_LowerLeg = [-2.7, 0, 0]; P.L_Foot = [0.6, 0, 0]; P.R_Foot = [0.6, 0, 0];
            P.C_Spine = [-0.18 + br, tr, tr * 0.6]; P.C_Neck = [-0.3, 0, Math.sin(t * 1.1) * 0.12];
            P.L_UpperArm = [0.6, 0, 1.2]; P.R_UpperArm = [0.6, 0, -1.2]; P.L_LowerArm = [0, -0.2, 0]; P.R_LowerArm = [0, 0.2, 0]; drop = 0.8;
          }
          else if (m === 'leak' || m === 'down') { P.legs = { L: { f: 0.06, z: -0.2 }, R: { f: 0.02, z: 0.2 } }; drop = 0.3; P.C_Spine = [-0.4 + br, m === 'leak' ? Math.sin(now * 0.06 + v.id) * 0.06 : 0, m === 'leak' ? Math.sin(now * 0.047 + v.id) * 0.05 : 0]; P.C_Neck = [-0.25, 0, Math.sin(t * 1.3) * 0.08]; P.L_UpperArm = [0.5, 0, 1.2]; P.R_UpperArm = [0.5, 0, -1.2]; P.L_LowerArm = [0, -1.1, 0]; P.R_LowerArm = [0, 1.1, 0]; if (m === 'down') { P.L_UpperArm = [0, 0, 0.5]; P.R_UpperArm = [0, 0, -0.5]; P.L_LowerArm = [0, -0.3, 0]; P.R_LowerArm = [0, 0.3, 0]; } }
          else if (m === 'cheer') { const s = Math.abs(Math.sin(t * 7)); P.L_UpperArm = [0, 0, -1.1 - 0.2 * s]; P.R_UpperArm = [0, 0, 1.1 + 0.2 * s]; P.legs = { L: { z: -0.1, up: 0.04 * s, pitch: -0.3 * s }, R: { z: 0.1, up: 0.04 * s, pitch: -0.3 * s } }; drop = 0.04 * (1 - s) - s * 0.08; }
          else if (m === 'swell') { // ふくらんでいく（ため）：手足を大きくじたばたさせながら
            const k = Math.min(1, (now - v.mt) / (v.mdur || 400)), sh = Math.sin(now * 0.09) * (0.05 + 0.12 * k), f = now * 0.05 + v.id;
            P.C_Spine = [0.1 + 0.15 * k + 0.12 * Math.sin(f * 1.2), 0.28 * Math.sin(f * 0.9), sh]; P.C_Neck = [0.15 * k + 0.2 * Math.sin(f * 1.7), 0, 0.22 * Math.sin(f * 1.3)];
            // 腕：頭の上まで、ぶんぶん（左右で少しずらす）
            const aL = 0.5 + 0.5 * Math.sin(f), aR = 0.5 + 0.5 * Math.sin(f + 2.4);
            P.L_UpperArm = [0.6 * Math.sin(f * 0.8), 0, 1.3 - 2.4 * aL]; P.R_UpperArm = [0.6 * Math.sin(f * 0.8 + 1.4), 0, -(1.3 - 2.4 * aR)];
            P.L_LowerArm = [0, -0.2 - 1.2 * (0.5 + 0.5 * Math.sin(f * 1.6)), 0]; P.R_LowerArm = [0, 0.2 + 1.2 * (0.5 + 0.5 * Math.sin(f * 1.6 + 1.5)), 0];
            if (v.u && v.u.sit) { // 座ったまま、足を大きくばたばた
              P.L_UpperLeg = [1.5 + 0.2 * Math.sin(f * 1.5), -1.0, -0.2]; P.R_UpperLeg = [1.5 + 0.2 * Math.sin(f * 1.5 + 3), 1.0, 0.2]; P.L_LowerLeg = [-2.7 + 1.3 * (0.5 + 0.5 * Math.sin(f * 1.5)), 0, 0]; P.R_LowerLeg = [-2.7 + 1.3 * (0.5 + 0.5 * Math.sin(f * 1.5 + 3)), 0, 0]; P.L_Foot = [0.6, 0, 0]; P.R_Foot = [0.6, 0, 0]; drop = 0.8;
            } else { // 立ったまま、足を交互に高くばたばた（その場で地団駄）
              const kl = Math.max(0, Math.sin(f * 1.5)), kr = Math.max(0, -Math.sin(f * 1.5));
              P.legs = { L: { z: -0.22, f: 0.16 * Math.sin(f * 1.5), up: 0.2 * kl, pitch: -0.4 * kl }, R: { z: 0.22, f: -0.16 * Math.sin(f * 1.5), up: 0.2 * kr, pitch: -0.4 * kr } }; drop = 0.05 + 0.04 * k;
            }
          }
          else if (m === 'dodge') { const k = Math.min(1, (now - v.mt) / (300 * IW3.speed)), a = Math.sin(k * Math.PI); P.C_Spine = [-0.1, 0, v.dsign * 0.35 * a]; P.legs = { L: { z: -0.2 - 0.15 * a, up: 0.12 * a, pitch: -0.3 * a }, R: { z: 0.2 + 0.15 * a, up: 0.1 * a, pitch: -0.3 * a } }; P.L_UpperArm = [0, 0, 0.9]; P.R_UpperArm[2] = -0.6; drop = 0.08 * (1 - a); }
          else if (m === 'shock') { P.C_Spine = [0.25, 0, 0]; P.C_Neck = [0.25, 0, 0]; P.L_UpperArm = [0, 0, 0.6]; P.R_UpperArm = [0, 0, -0.6]; P.legs = { L: { f: 0.1, z: -0.12 }, R: { f: -0.06, z: 0.12 } }; drop = 0.04; }
          else if (m === 'slash') { const k = Math.min(1, (now - v.mt) / (260 * IW3.speed)); P.R_UpperArm = [0, 1.6 - 3.0 * k, -0.4 + 0.6 * k]; P.R_LowerArm = [0, 0.2, 0]; P.C_Spine = [-0.15, -0.5 + 1.0 * k, 0]; P.legs = { L: { f: 0.24, z: -0.12 }, R: { f: -0.22, z: 0.12 } }; drop = 0.09; }
          else if (m === 'aimL') { P.L_UpperArm = [0, -1.5, 0.05]; P.L_LowerArm = [0, 0, 0]; P.C_Spine = [-0.05, -0.2, 0]; P.legs = { L: { f: 0.14, z: -0.12 }, R: { f: -0.1, z: 0.12 } }; drop = 0.04; }
          else if (m === 'spin') { P.R_UpperArm = [0, 0, -0.2]; P.L_UpperArm = [0, 0, 0.2]; P.legs = { L: { z: -0.15 }, R: { z: 0.15 } }; drop = 0.03; }
          if (v.kick) { const kk = Math.exp(-(now - v.kt) / (90 * IW3.speed)); if (kk < 0.02) v.kick = 0; else { P.C_Spine = [(P.C_Spine ? P.C_Spine[0] : 0) + 0.3 * kk, P.C_Spine ? P.C_Spine[1] : 0, 0]; P.C_Neck = [0.15 * kk, 0, 0]; drop += 0.03 * kk; } } // 撃った反動
          if (v.reload && v.rr > 0) { // 片手でリロード（右手）：rr＝手をのばした度合い、rk＝引いた度合い
            const rk = v.rk || 0, rr = v.rr, lerp3 = (a, b) => [0, 1, 2].map(i => (a ? a[i] : 0) + (b[i] - (a ? a[i] : 0)) * rr);
            const UA = v.reload === 'cannon' ? [0.3 - 0.25 * rk, 0, -1.3] : [0.25 - 0.45 * rk, 0, -1.2];
            const LA = v.reload === 'cannon' ? [0, 1.75 + 0.3 * rk, 0] : [0, 0.75 + 0.55 * rk, 0];
            P.R_UpperArm = lerp3(P.R_UpperArm || [0, 0, -1.25], UA); P.R_LowerArm = lerp3(P.R_LowerArm, LA);
            P.C_Spine = [(P.C_Spine ? P.C_Spine[0] : 0), (P.C_Spine ? P.C_Spine[1] : 0) - 0.08 * rk * rr, P.C_Spine ? P.C_Spine[2] : 0]; // 引くときに、少し体をひねる
          }
          if (v.stuck && !v.fly) { // 鉄柱につながって、動けない：手足をぐったり、ときどき、もぞもぞ。はじける前は、じたばた
            const sw = m === 'swell' ? Math.min(1, (now - v.mt) / (v.mdur || 400)) : 0, f = now * (m === 'swell' ? 0.05 : m === 'shock' ? 0.02 : 0.004) + v.id, j = m === 'swell' ? 0.12 + 0.25 * sw : m === 'shock' || m === 'hurt' ? 0.12 : 0.06 + 0.05 * Math.max(0, Math.sin(f * 0.7)); delete P.legs; drop = 0;
            P.L_UpperArm = [0.2 * Math.sin(f * 1.3) * j * 3, 0, 0.75 + j * Math.sin(f * 2.1)]; P.R_UpperArm = [0.2 * Math.sin(f * 1.1) * j * 3, 0, -0.75 - j * Math.sin(f * 1.9)];
            P.L_LowerArm = [0, -0.3, 0]; P.R_LowerArm = [0, 0.3, 0];
            P.L_UpperLeg = [0.1 + j * Math.sin(f * 1.7), 0, -0.06]; P.R_UpperLeg = [0.1 + j * Math.sin(f * 1.5 + 1), 0, 0.06]; P.L_LowerLeg = [-0.15 - j * Math.abs(Math.sin(f * 1.6)), 0, 0]; P.R_LowerLeg = [-0.15 - j * Math.abs(Math.sin(f * 1.4)), 0, 0];
            P.C_Spine = [0.05, 0.05 * Math.sin(f), 0]; P.C_Neck = [0.25, 0.15 * Math.sin(f * 0.8), 0];
          }
          if (v.pin) { // 大の字で壁に固定：手足は留め具から動かせない。はじける前は、その場で手足をぶるぶる・じたばた
            const sw = m === 'swell' ? Math.min(1, (now - v.mt) / (v.mdur || 400)) : 0, f = now * 0.05 + v.id, j = (m === 'swell' ? 0.12 + 0.2 * sw : m === 'shock' || m === 'hurt' ? 0.08 : 0.025);
            delete P.legs; drop = 0; v.yawT = YAW[2];
            P.L_UpperArm = [0.1 * Math.sin(f * 1.3) * j * 4, 0, -0.55 + j * Math.sin(f * 1.7)]; P.R_UpperArm = [0.1 * Math.sin(f * 1.1) * j * 4, 0, 0.55 - j * Math.sin(f * 1.9 + 1)];
            P.L_LowerArm = [0, -0.1 - j * Math.abs(Math.sin(f * 2.1)), 0]; P.R_LowerArm = [0, 0.1 + j * Math.abs(Math.sin(f * 2.3)), 0];
            P.L_UpperLeg = [0.05 + j * Math.sin(f * 1.6), 0, -0.36 + j * 0.5 * Math.sin(f * 2)]; P.R_UpperLeg = [0.05 + j * Math.sin(f * 1.5 + 2), 0, 0.36 - j * 0.5 * Math.sin(f * 2.2)];
            P.L_LowerLeg = [-0.05 - j * Math.abs(Math.sin(f * 1.8)), 0, 0]; P.R_LowerLeg = [-0.05 - j * Math.abs(Math.sin(f * 1.7)), 0, 0]; P.L_Foot = [0.2, 0, 0]; P.R_Foot = [0.2, 0, 0];
            P.C_Spine = [0.04 + (m === 'swell' ? 0.12 * Math.sin(f * 1.2) : 0), (m === 'swell' ? 0.15 * Math.sin(f) : 0.03 * Math.sin(t)), 0]; P.C_Neck = [0.05 + (m === 'swell' ? 0.2 * Math.sin(f * 1.5) : 0), 0.1 * Math.sin(t * 0.7), m === 'swell' ? 0.2 * Math.sin(f * 1.3) : 0];
          }
          if (v.extra) Object.assign(P, v.extra);
          P.drop = drop;
          v.rig.pose(P);
          v.drop = drop;
          IW3.gearTick(v, t, m === 'walk' || m === 'fly'); IW3.faceTick(v, now);
          v.yaw = lerpA(v.yaw, v.yawT, 0.2);
          if (m !== 'fly') placeV(v);
          if (v.ring) { v.ring.position.set(v.root.position.x, 0.02, v.root.position.z); }
          if (v.arrow) { v.arrow.position.set(v.root.position.x, v.root.position.y + (v.crown ? 0.8 * (v.sc || 1) : 1.05) + (v.crown ? 0.02 : 0.06) * Math.sin(t * 4), v.root.position.z); v.arrow.rotation.y = v.crown ? t * 0.8 : t * 2; }
          // Ink81：満タンの子の頭の上に、しずくの印（押さなくても、満タンだとわかるように）
          if (v.u && v.u.kind === 'minion') {
            const live = v.u.full && v.u.state === 'ok' && !v.u.gone && !v.u.pinned && v.root.visible && v.root.parent && m !== 'fly';
            // Ink95：見せている間は、対戦の中身がもう先に進んでいるので、攻撃の前の印をそのまま出す（はじけた・漏れた・ふくらんだ子は消す）
            if (!S.playing) v.fullPrev = live;
            const show = S.playing ? !!(v.fullPrev && v.root.visible && v.root.parent && m !== 'fly' && m !== 'leak' && m !== 'swell' && !v.gone) : live;
            if (show && !v.fullMark) { v.fullMark = new TT.Sprite(fullMarkMat()); v.fullMark.scale.set(0.34, 0.34, 1); v.fullMark.renderOrder = 5; B.scene.add(v.fullMark); }
            if (v.fullMark) { v.fullMark.visible = !!show; if (show) v.fullMark.position.set(v.root.position.x, v.root.position.y + 1.32 * (v.sc || 1) + (v.arrow ? 0.32 : 0) + 0.04 * Math.sin(t * 3 + v.id), v.root.position.z); }
          }
          // インクのタンクの光（満タンは明るく、インク漏れはちらちら）
          if (v.skinDirty > 0) { v.skinDirty--; if (v.A && v.skinK != null) IW3.slimeSkin(v.A, v.skinK); }
          if (slimy && v.inkMats.length) {
            const u = v.u, e = v.mode === 'swell' ? 0.8 + 2.4 * Math.min(1, (now - v.mt) / (v.mdur || 400)) * (0.6 + 0.4 * Math.abs(Math.sin(t * 30))) : u.state === 'leak' ? 0.15 + 0.5 * Math.abs(Math.sin(t * 9)) : u.full ? 0.55 + 0.15 * Math.sin(t * 3) : 0.2;
            for (const mt of v.inkMats) mt.emissiveIntensity = e;
          }
          // スライムの体は、いつも少しぷるぷるしている。sq：つぶれ（＋で横に広がり、縦につぶれる）
          const wob = slimy ? 0.016 * Math.sin(t * 3.3 + v.id) : 0, sq = v.sq || 0;
          v.root.scale.set(v.sc * (1 - wob * 0.5 + sq * 0.7), v.sc * (1 + wob - sq), v.sc * (1 - wob * 0.5 + sq * 0.7));
        }
      });
      // ===== 見せ方 =====
      const S = {
        views, posOf,
        addPuddle(x, y) { if (G.puddle) addPuddle(x, y, true); }, // はじけた所に、インクだまり
        // セリフ：同じ人の前の吹き出しは消して、新しいのを出す（「え！？」→「うわあ！」と続けて言える）
        // 効果音の文字（マンガの「ガシャッ」のような）：吹き出しではなく、物のそばにぽんと出す。声にはしない
        sfxText(getPos, text, ms, mv) { B.bubble(getPos, text, 'sfx' + (mv ? ' ' + mv : ''), ms || 520); }, // mv：動き方（swish＝すばやく横へ流れる）
        say(id, text, cls, ms, force) { if (!text) return; const v = views.get(id); if (v && v.mute && !force) return; /* mute：だまってじたばた（ボーナスの波のあいだ。悲鳴だけ force で言う） */ if (v && (cls === 'pop' || cls === 'red') && !(v.expr && v.exprUntil > performance.now())) S.expr(id, cls === 'pop' ? 'scream' : 'fear', ms || 900); /* 叫ぶセリフ・あせるセリフの顔 */ if (v && v.bub) v.bub.until = 0; const o = B.bubble(headOf(id), text, cls, ms); if (v) v.bub = o; if (IW3.voice) { if (IW3.tempo === 'quick' && v && v.kind !== 'hero' && !(v.u && v.u.chief)) { const now = performance.now(); if (now >= (IW3._qv || 0)) { IW3._qv = now + 900; IW3.voice(v, text); } } else IW3.voice(v, text); } },
        // 言い終わるまで待つセリフ（声が終わるか、声がないときは文字の長さぶん）。吹き出しも、言い終わるまで出しておく
        sayWait(id, text, cls) {
          const v = views.get(id); if (!v || !text) return Promise.resolve();
          const est = 700 + [...text].length * 150; // 声がないときの、読む時間のめやす
          if (v.bub) v.bub.until = 0; v.bub = B.bubble(headOf(id), text, cls, est + 4000);
          if ((cls === 'pop' || cls === 'red')) S.expr(id, cls === 'pop' ? 'scream' : 'fear', est + 1500);
          const p = IW3.voice ? IW3.voice(v, text, true) : null, t0 = performance.now();
          const cap = new Promise(r => setTimeout(r, est * 2.5 + 3000)); // 終わりの合図が来ないときも、止まらないように
          return Promise.race([p ? p : new Promise(r => setTimeout(r, est)), cap]).then(() => { const left = 500 - (performance.now() - t0); if (v.bub) { const b = v.bub; setTimeout(() => { b.until = 0; }, 400); } return left > 0 ? new Promise(r => setTimeout(r, left)) : null; });
        },
        face(id, x, y) { const v = views.get(id); if (!v) return; v.yawT = Math.atan2(-(x - v.gx), -(y - v.gy)); },
        faceDir(id, d) { const v = views.get(id); if (v) v.yawT = YAW[d]; },
        // 歩く：足を置く場所を、道のりの上に先に決めておく（床に着いている足は、その場所から動かない＝すべらない）
        //   足は「体が 0.6歩 先に進んだところ」に着き、1.2歩ぶん体が進む間そこに止まり、次の場所へ弧をえがいて運ばれる。
        //   歩き始めと止まるところも、足をそろえて終わるように、位相を少しずらして始め、最後に後ろ足を引き寄せる。
        async walk(id, path) {
          const v = views.get(id); if (!v || path.length < 2) return;
          const seg = []; let D = 0;
          for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i], l = Math.hypot(b.x - a.x, b.y - a.y); seg.push({ a, b, l, d0: D }); D += l; }
          const n = Math.max(2, Math.round(D / (v.kind === 'hero' ? 0.52 : 0.4))), step = D / n, S2 = step * DS; // 1歩の長さ（ちょうど何歩かで着く）
          const at = (d) => { d = Math.max(0, Math.min(D, d)); let k = seg.length - 1; while (k > 0 && seg[k].d0 > d) k--; const g = seg[k], u = Math.min(1, (d - g.d0) / g.l); return { x: g.a.x + (g.b.x - g.a.x) * u, y: g.a.y + (g.b.y - g.a.y) * u, k }; };
          const PH0 = 0.35, phEnd = PH0 + n / 2;
          const dOf = (ph) => (ph - PH0) * 2 * step;
          const land = (pl) => pl < PH0 ? at(0) : at(dOf(pl) + S2); // その位相で着く足の場所（歩き出す前に着いた足は、立っていた場所）
          const footW = (ph, off) => { // 片足の世界の位置と、足の上げ下げ
            const pl = Math.floor(ph - off) + off, u = ph - pl, F = foot(u, 0);
            if (u < DS) { const p = land(pl); return { x: p.x, y: p.y, up: pl < PH0 ? 0 : F.up, pitch: pl < PH0 ? 0 : F.pitch }; }
            const p0 = land(pl), p1 = land(pl + 1);
            if (pl + DS < PH0) { // 歩き出しの、最初の半歩
              const k = (ph - PH0) / (pl + 1 - PH0), w = sm(k);
              return { x: p0.x + (p1.x - p0.x) * w, y: p0.y + (p1.y - p0.y) * w, up: 0.075 * Math.sin(Math.PI * k), pitch: 0.18 * sm((k - 0.5) / 0.5) - 0.15 * Math.sin(Math.PI * k) };
            }
            const w = sm((u - DS) / (1 - DS) * 1.08 - 0.04);
            return { x: p0.x + (p1.x - p0.x) * w, y: p0.y + (p1.y - p0.y) * w, up: F.up, pitch: F.pitch };
          };
          let ms = D * (v.kind === 'hero' ? 400 : 430); const cap = v.kind === 'hero' ? 2300 : 1700; if (ms > cap) ms = cap + (ms - cap) * 0.45; // 遠いときは少し急ぐ
          v.mode = 'walk'; v.wstep = step; v.wph = PH0; v.wamp = 0; v.wlegs = null;
          let si = -1;
          const frame = (ph, d) => {
            const p = at(d); if (p.k !== si) { si = p.k; S.face(id, seg[p.k].b.x, seg[p.k].b.y); }
            v.gx = p.x; v.gy = p.y; v.wph = ph; v.wamp = sm(Math.min(d, D - d) / (step * 0.8));
            const hx = -Math.sin(v.yaw), hy = -Math.cos(v.yaw), L = {};
            for (const [sd, off] of [['L', 0], ['R', 0.5]]) { const f = footW(ph, off); L[sd] = { f: (f.x - p.x) * hx + (f.y - p.y) * hy, up: f.up, pitch: f.pitch }; }
            v.wlegs = L;
          };
          if (IW3.tempo === 'quick') ms *= 0.7; // テンポ重視：少し早足
          await IW3.tween(ms, (t) => { const ph = PH0 + (phEnd - PH0) * t; frame(ph, dOf(ph)); });
          await IW3.tween(Math.min(220, ms / n * 0.6), (t) => frame(phEnd + 0.16 * t, D)); // 後ろ足を引き寄せて、そろえる
          v.wamp = 0; v.wlegs = null;
          v.mode = restMode(v);
        },
        async slide(id, x, y, ms, hop) {
          const v = views.get(id); if (!v) return; const ax = v.gx, ay = v.gy;
          await IW3.tween(ms || 260, (t) => { v.gx = ax + (x - ax) * t; v.gy = ay + (y - ay) * t; v.lift = hop ? Math.sin(t * Math.PI) * hop : 0; });
          v.lift = 0;
        },
        // はじける：ぷしゅーと縮んで、インクが飛び散る
        // はじける：ぷるぷるふるえて → ぺしゃっと床につぶれ、インクが飛び散る → その場で、とけて床のしみになる（スライムは、あとで元に戻るので大丈夫）
        async pop(id, col, big) {
          const v = views.get(id); if (!v || !v.root.parent) return;
          if (v.mode !== 'swell') { v.mode = 'swell'; v.mt = performance.now(); v.mdur = 300 * IW3.speed; } const k = Math.min(1.8, 1 + (big || 0) * 0.12);
          const s0 = v.sc || 1;
          await IW3.tween(QF() * (big ? 160 : 240), (t) => { v.sq = 0.16 * Math.sin(t * Math.PI * 5) * (0.4 + t); v.sc = s0 * (1 + 0.12 * t); });
          const p = posOf(id, 0);
          B.fx.splash(p, col || INK.ink, Math.round(26 * k), 1.3 * k); B.fx.ring(p, col || INK.ink, 1.8 * k, 380); B.fx.muzzle(posOf(id, 0.8), col || INK.ink, 0.55 * k);
          if (big) { B.fx.ring(p, 0xffffff, 0.9 * k, 220); if (B.shake) B.shake(0.05 + 0.02 * Math.min(6, big)); }
          else if (B.shake) B.shake(0.03);
          if (IW3.sfx) IW3.sfx('pop'); S.sfxText(() => p.clone().add(new TT.Vector3(0, 1.2, 0)), big ? 'パシャーーン！！' : 'パシャーン！', 700);
          await IW3.tween(QF() * 170, (t) => { v.sq = 0.7 * t; v.lift = -t * 0.45; v.sc = s0 * (1.12 + 0.18 * t); });
          B.fx.stain(p.x, p.z, v.slimeCol || col || INK.ink, 0.55);
          await IW3.tween(QF() * 420, (t) => { v.sq = 0.7 + 0.25 * t; v.lift = -0.45 - t * 0.6; v.sc = s0 * (1.3 - 0.5 * t); }); // とけて、床にしみこむ
          B.scene.remove(v.root); if (v.ring) B.scene.remove(v.ring); if (v.arrow) B.scene.remove(v.arrow); v.gone = true; v.sq = 0;
        },
        // 連鎖の「ため」：となりの子の飛沫が飛んできて、かぶった子のタンクが光りながら、ぷくーっとふくらむ。連鎖が続くほど、少し早く。
        async charge(id, fromId, n, line, ohLine, noBubble) { // noBubble：大きな文字で数を出すときは、頭の上の「○連鎖！」を出さない（2回出ないように）
          const v = views.get(id); if (!v || !v.root.parent) return;
          const a = posOf(fromId, 0.9), b = posOf(id, 1.0);
          const fc = S.inkOf(fromId); if (a && b) { await Promise.all([B.fx.shot(a, b, fc, 150 * QF(), 0.35), B.fx.shot(a.clone().add(new TT.Vector3(0.15, 0.1, 0)), b.clone().add(new TT.Vector3(-0.1, -0.2, 0.05)), fc, 170 * QF(), 0.5)]); B.fx.splash(b, fc, 5, 0.35); }
          if (fromId) S.face(id, (views.get(fromId) || v).gx, (views.get(fromId) || v).gy);
          v.mode = 'shock'; v.mt = performance.now(); if (IW3.tempo !== 'quick' || ohLine) S.say(id, ohLine || IW3.pick(IW3.LINES.oh), 'ink', 900); await IW3.wait(QF() * Math.max(200, 380 - n * 30)); // え！？（テンポ重視では言わない）
          const dur = Math.max(800, 1400 - n * 90); // 連鎖が続くほど、少し短く
          if (n >= 2 && !noBubble) B.bubble(() => { const w = views.get(id); if (!w) return null; const p = w.root.position.clone(); p.y += 1.35; return p; }, n + '連鎖！', 'combo c' + Math.min(6, n), 900);
          if (n >= 3 && B.punch) B.punch(v.gx - B.half, v.gy - B.half, Math.max(0.55, 0.8 - n * 0.04), 1400);
          await S.flail(id, dur, line);
        },
        // ヒーローがかわす：撃ってきた向きから横へ、小さく跳んでもどる（すべらない）
        async dodge(id, fromId) {
          const v = views.get(id), w = views.get(fromId); if (!v) return;
          let dx = 1, dy = 0; if (w) { const ax = v.gx - w.gx, ay = v.gy - w.gy, l = Math.hypot(ax, ay) || 1; dx = -ay / l; dy = ax / l; }
          if (Math.random() < 0.5) { dx = -dx; dy = -dy; }
          const hx = -Math.sin(v.yaw), hy = -Math.cos(v.yaw); v.dsign = Math.sign(dx * -hy + dy * hx) || 1; // 体の右（＋）か左か
          const m0 = v.mode, ox = v.gx, oy = v.gy; v.mode = 'dodge'; v.mt = performance.now();
          await IW3.tween(300, (t) => { const a = Math.sin(t * Math.PI); v.gx = ox + dx * 0.4 * a; v.gy = oy + dy * 0.4 * a; v.lift = 0.12 * a; });
          v.gx = ox; v.gy = oy; v.lift = 0; if (v.mode === 'dodge') v.mode = m0 === 'dodge' ? 'idle' : m0;
        },
        // インクの弾（出口ごとに、出る場所がちがう）
        // インクの弾：構える（ため）→ 撃つ（口が光って、体が反動でのけぞる）→ 当たるとはじける。キャノンは2発、ホースは水鉄砲のように連なって飛ぶ
        // 撃つ：まっすぐ撃つか、ななめ上（35〜45°）に構えて放物線で撃つ（半分くらい）。
        //   砲身（ホースは口）が一度引っこんで、撃つときに前へ突き出す。これを1回の攻撃で2〜3回
        async shoot(id, toId, exit, col, miss, opt) {
          const v = views.get(id), w = views.get(toId); if (!v || !w) return;
          col = col || INK.ink; const can = exit === 'cannon';
          S.face(id, w.gx, w.gy);
          if (!(opt && opt.noWind)) { v.mode = can ? 'cannonW' : 'hoseW'; v.mt = performance.now(); await IW3.wait(170); }
          v.mode = can ? 'cannon' : 'hose'; v.mt = performance.now();
          const lob = opt && opt.lob != null ? opt.lob : Math.random() < 0.5, ang = IW3.gearAngle(v, exit, lob);
          const a = v.root.position.clone(); a.y = can ? CANNON_Y(v) : HOSE_Y(v);
          const hx = -Math.sin(v.yaw), hz = -Math.cos(v.yaw); a.x += hx * 0.25; a.z += hz * 0.25; if (ang > 0.2) a.y += 0.06;
          const b = w.root.position.clone(); b.y = can ? (w.kind === 'hero' ? 1.15 : CANNON_Y(w)) : (w.kind === 'hero' ? 0.85 : HOSE_Y(w));
          if (miss) { b.x += (Math.random() - 0.5) * 1.6; b.z += (Math.random() - 0.5) * 1.6; b.y = 0.05; }
          if (opt && opt.short) { b.lerp(a, 0.6 + Math.random() * 0.25); b.x += (Math.random() - 0.5) * 1.2; b.y = 0.05; } // とどかない（ボーナスの一斉噴射）
          // 弾の山の高さ：構えた角度から（放物線の出だしの傾き＝角度）。まっすぐ（0°）なら低い山
          const d = a.distanceTo(b), H = ang > 0.05 ? Math.max(0.25, d * Math.tan(ang) / 4) : (can ? null : 0.25), ms = ang > 0.3 ? 520 + d * 25 : (can ? 320 : 380);
          const shots = [];
          await IW3.gearFire(v, exit, { tw: IW3.tween, ang, onShot: (i, big, hold) => {
            if (hold) { // 突き出したまま、インクを撃ちつづける（細かい弾）
              const jit = () => new TT.Vector3((Math.random() - 0.5) * 0.18, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.18);
              if (IW3.sfx && Math.random() < 0.5) IW3.sfx(can ? 'cannon' : 'hose'); B.fx.muzzle(a, col, 0.1);
              shots.push(B.fx.shot(a.clone(), b.clone().add(jit()), col, ms, H, can ? 1.0 : 0.9)); return;
            }
            if (IW3.sfx) IW3.sfx(can ? 'cannon' : 'hose'); B.fx.muzzle(a, col, (can ? 0.2 : 0.14) * (big ? 1.4 : 1));
            const jit = () => new TT.Vector3((Math.random() - 0.5) * 0.14, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.14);
            if (can) { const sd = i % 2 ? -0.12 : 0.12; shots.push(B.fx.shot(a.clone().add(new TT.Vector3(sd * Math.cos(v.yaw), 0, -sd * Math.sin(v.yaw))), b.clone().add(jit()), col, ms, H, big ? 1.8 : 1.4)); }
            else for (let j = 0; j < (big ? 3 : 2); j++) shots.push(IW3.wait(j * 40).then(() => B.fx.shot(a.clone(), b.clone().add(jit()), col, ms, H, 1.2 - j * 0.2)));
          } });
          await Promise.all(shots);
          if (miss) B.fx.splash(b, col, 6, 0.45);
          else { B.fx.splash(b, col, 8, 0.5); B.fx.muzzle(b, col, 0.28); if (IW3.sfx) IW3.sfx('splat'); }
          if (v.tilt) { const t1 = v.tilt; IW3.tween(220, (t) => { v.tilt = t1 * (1 - t); }); }
          setTimeout(() => { if (v.mode === 'cannon' || v.mode === 'hose') v.mode = restMode(v); }, 300 * IW3.speed);
        },
        // 勝利の祝砲：勝った子たちが、空へ向けてキャノン・ホースを撃ちつづける（S.stopSalute() か、盤を閉じるまで）
        //   ななめ上（60〜75°）に構えて、引っこむ→突き出す。弾は空で、花火のようにぱっと開く
        salute(ids) {
          const tok = {}; S._salute = tok; const busy = new Set();
          const alive = () => S._salute === tok && B.cv && B.cv.isConnected;
          const fire = async (id) => {
            const v = views.get(id); if (!v || !v.root.parent) return; busy.add(id);
            try {
              const can = S.partObjs(v, 'cannon').length, hose = S.partObjs(v, 'hose').length; if (!can && !hose) return;
              const exit = can && hose ? (Math.random() < 0.5 ? 'cannon' : 'hose') : can ? 'cannon' : 'hose', col = S.inkOf(id) || INK.ink;
              const ang = (60 + Math.random() * 15) * Math.PI / 180;
              const a = v.root.position.clone(); a.y = exit === 'cannon' ? CANNON_Y(v) : HOSE_Y(v); const hx = -Math.sin(v.yaw), hz = -Math.cos(v.yaw); a.x += hx * 0.25; a.z += hz * 0.25;
              const far = 0.6 + Math.random() * 1.0, top = a.clone().add(new TT.Vector3(hx * far + (Math.random() - 0.5) * 0.6, 2.4 + Math.random() * 1.2, hz * far + (Math.random() - 0.5) * 0.6));
              const shots = [];
              await IW3.gearFire(v, exit, { tw: IW3.tween, ang, n: 2, onShot: (i, big, hold) => {
                if (hold && Math.random() < 0.5) return; if (IW3.sfx && Math.random() < 0.35) IW3.sfx(exit === 'cannon' ? 'cannon' : 'hose');
                B.fx.muzzle(a, col, 0.12);
                const to = top.clone().add(new TT.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.4));
                shots.push(B.fx.shot(a.clone(), to, col, 520, 0.4, hold ? 0.8 : 1.2).then(() => { if (!alive()) return; B.fx.ring(to, col, 0.9 + Math.random() * 0.6, 420); B.fx.muzzle(to, Math.random() < 0.3 ? 0xffffff : col, 0.5); if (IW3.sfx && Math.random() < 0.25) IW3.sfx('pop'); }));
              } });
              await Promise.all(shots); if (v.tilt) { const t1 = v.tilt; await IW3.tween(260, (t) => { v.tilt = t1 * (1 - t); }); }
            } finally { busy.delete(id); }
          };
          (async () => {
            await IW3.wait(500);
            while (alive()) {
              const L = ids.filter(id => { const v = views.get(id); return v && v.root.parent && !busy.has(id); });
              if (L.length) fire(L[Math.floor(Math.random() * L.length)]);
              await IW3.wait(260 + Math.random() * 280);
            }
          })();
        },
        stopSalute() { S._salute = null; },
        // 表情を一時的に変える（ms ミリ秒）。name は IW3.FACEX の名前
        expr(id, name, ms) { const v = views.get(id); if (!v) return; v.expr = name; v.exprUntil = performance.now() + (ms || 1000) * (IW3.speed || 1); },
        // ヒーローがインクを浴びた：のけぞる
        hurt(id) { const v = views.get(id); if (!v || !(v.mode === 'idle' || v.mode === 'hurt')) return; v.mode = 'hurt'; v.mt = performance.now(); setTimeout(() => { if (v.mode === 'hurt') v.mode = 'idle'; }, 340 * IW3.speed); },
        // ガシャコン：ポンプ式のショットガンのように、ホースは前の部分（筒・口・にぎり）を、キャノンは砲身を、後ろへ引いて戻す（n 回）
        pumpParts(v, exit) { return IW3.gearPumpParts(v, exit); },
        async pump(id, exit, n) {
          const v = views.get(id); if (!v) return; const G2 = S.pumpParts(v, exit); if (!G2.length) return;
          const back = exit === 'cannon' ? 0.06 : 0.08;
          const at = (dy) => () => { const g = G2[0] && G2[0][0]; if (!g || !v.root.parent) return null; const p = g.getWorldPosition(new TT.Vector3()); p.y += dy; return p; };
          // 片手でリロード：右手をのばして（ホースは右の腰、キャノンは右わきの砲身へ）、ガシャで手前へ引き、コンで前へもどす
          v.reload = exit; v.rk = 0; await IW3.tween(150, (t) => { v.rr = t; });
          for (let i = 0; i < n; i++) {
            if (IW3.sfx) IW3.sfx('gasha'); let kon = false; S.sfxText(at(0.12), 'しゅっ！', 300, 'swish');
            await IW3.tween(exit === 'cannon' ? 240 : 220, (t) => {
              G2.forEach((g, j) => { const tt = Math.max(0, Math.min(1, t * 1.25 - j * 0.25)), k = tt < 0.45 ? tt / 0.45 : 1 - (tt - 0.45) / 0.55; for (const o of g) if (o) IW3.gearSlide(o, back * k); if (j === 0) v.rk = k; });
              if (!kon && t > 0.5) { kon = true; if (IW3.sfx) IW3.sfx('kon'); S.sfxText(at(0.2), 'しゅっ！', 300, 'swish2'); }
            });
            await IW3.wait(60);
          }
          for (const g of G2) for (const o of g) if (o) IW3.gearSlide(o, 0);
          v.rk = 0; await IW3.tween(150, (t) => { v.rr = 1 - t; }); v.reload = null; v.rr = 0;
        },
        kick(v, exit) { // 撃った瞬間の反動：一度ぐっと下がって、戻る
          const G2 = S.pumpParts(v, exit); if (!G2.length) return;
          IW3.tween(180, (t) => { const k = 1 - t; for (const g of G2) for (const o of g) if (o) IW3.gearSlide(o, 0.07 * k * k); });
        },
        // ねらう：相手の方を向いて、構えて、ガシャコンとためて、ねらいの光の線がちかちか（「よーく、ねらって……」）
        async aim(id, toId, exit, line) {
          const v = views.get(id), w = views.get(toId); if (!v || !w) return;
          S.face(id, w.gx, w.gy); v.mode = exit === 'cannon' ? 'cannonW' : 'hoseW'; v.mt = performance.now();
          await IW3.wait(200);
          await S.pump(id, exit, exit === 'cannon' ? 2 : 3);
          if (line) S.say(id, line, 'ink', 1000);
          for (let i = 0; i < 2; i++) {
            const a = v.root.position.clone(); a.y = exit === 'cannon' ? CANNON_Y(v) : HOSE_Y(v); const b = w.root.position.clone(); b.y = exit === 'cannon' ? (w.kind === 'hero' ? 1.15 : CANNON_Y(w)) : (w.kind === 'hero' ? 0.85 : HOSE_Y(w));
            B.fx.beam(a, b, 0xff6ad5, 170, 0.008); if (IW3.sfx) IW3.sfx('aim');
            await IW3.wait(260);
          }
        },
        // ヒーローが、隣の戦闘員をつかんで、弾の前に引っぱり出す（本当に盾にする）
        async shieldGrab(sid, shooterId, heroLine, minionLine) {
          const h = views.get(999), v = views.get(sid), w = views.get(shooterId); if (!h || !v || !w) return;
          let dx = w.gx - h.gx, dy = w.gy - h.gy; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
          v.shieldHome = { x: v.gx, y: v.gy };
          S.face(999, v.gx, v.gy); h.mode = 'aimL'; h.mt = performance.now();
          S.say(999, heroLine, 'hero', 1300); v.mode = 'shock'; v.mt = performance.now();
          await IW3.wait(250);
          S.say(sid, minionLine, 'ink', 1400);
          const ox = v.gx, oy = v.gy, tx = h.gx + dx * 0.62, ty = h.gy + dy * 0.62;
          await IW3.tween(300, (t) => { const e = t * t * (3 - 2 * t); v.gx = ox + (tx - ox) * e; v.gy = oy + (ty - oy) * e; v.lift = Math.sin(t * Math.PI) * 0.18; });
          v.lift = 0; S.face(sid, w.gx, w.gy); S.face(999, w.gx, w.gy); v.mode = 'hurt'; v.mt = performance.now();
          await IW3.wait(200);
        },
        // 盾にされた子が無事なら、元のマスへ戻す
        async shieldRelease(sid) {
          const v = views.get(sid), h = views.get(999); if (h && h.mode === 'aimL') h.mode = 'idle';
          if (!v || !v.shieldHome) return; const H = v.shieldHome; v.shieldHome = null;
          if (!v.root.parent || v.gone) return;
          const ox = v.gx, oy = v.gy; await IW3.tween(260, (t) => { v.gx = ox + (H.x - ox) * t; v.gy = oy + (H.y - oy) * t; v.lift = Math.sin(t * Math.PI) * 0.15; }); v.lift = 0;
        },
        // じたばた：ms のあいだ、手足をじたばたさせながら、ぷくーっとふくらむ。長さに合わせて、セリフを1〜3つ続ける（first があれば、それを最初に）
        // ふくらみきったまま、じたばたしつづける（p が終わるまで）。時間は本物の時計で数える（演出をすぐ進めるテストでも止まらないように）
        async holdSwell(id, p) {
          const v = views.get(id); if (!v || !v.root.parent) return;
          let done = false; Promise.resolve(p).then(() => { done = true; }, () => { done = true; });
          const s1 = v.sc || 1, t0 = performance.now(); v.mode = 'swell'; v.mdur = v.mdur || 400; v.mt = performance.now() - v.mdur;
          while (!done && v.root.parent) { await new Promise(r => setTimeout(r, 90)); const t = (performance.now() - t0) / 1000; v.sc = s1 * (1 + 0.02 * Math.sin(t * 9)); v.lift = 0.05 * Math.abs(Math.sin(t * 7)); }
          v.sc = s1; v.lift = 0;
        },
        flail(id, ms, first) {
          ms *= QF(); // テンポ重視：短く（セリフも1つだけになる）
          const v = views.get(id); if (!v || !v.root.parent) return Promise.resolve();
          const L = IW3.LINES, P = IW3.pick;
          v.mode = 'swell'; v.mt = performance.now(); v.mdur = ms * IW3.speed; if (IW3.sfx) IW3.sfx('swell');
          const n = ms < 600 ? 1 : ms < 1100 ? 2 : 3, seg = ms / n;
          const seq = n === 1 ? [first || P(L.flailShort)] : n === 2 ? [first || P(L.flailA), P(L.flailC)] : [first || P(L.flailA), P(L.flailB), P(L.flailC)];
          seq.forEach((t, i) => { const go = () => { if (v.root.parent) S.say(id, t, i === seq.length - 1 ? 'pop' : 'ink', seg + 250); }; if (i === 0) go(); else setTimeout(go, i * seg * IW3.speed); });
          const s0 = v.sc || 1, sit = v.u && v.u.sit;
          return IW3.tween(ms, (t) => { v.sc = s0 * (1 + 0.22 * t * t) + Math.sin(t * Math.PI * 9) * 0.02 * t; v.lift = sit ? 0.03 * Math.abs(Math.sin(t * Math.PI * 6)) : 0.07 * Math.abs(Math.sin(t * Math.PI * 7)); }).then(() => { v.lift = 0; });
        },
        // やられたときの反応を、順番に：①「え！？」（びくっ）→ ②「うわあ！」（のけぞる）→ ③ インク漏れ（爆発寸前）か、はじける
        //   kind：'leak'（インク漏れ）・'burst'（はじける）・'quick'（まとめてやられるとき：①と③だけ、短く）・'time'（インク漏れの子が、時間ではじける）
        async react(id, kind, part, oh, opt) {
          opt = opt || {};
          const v = views.get(id); if (!v || !v.root.parent) return;
          const L = IW3.LINES, P = IW3.pick;
          if (kind === 'time') { await S.burstParts(id, null, false); await S.flail(id, 1500, P(L.timeNow)); await S.pop(id, v.inkCol); return; }
          // ① びくっ
          v.mode = 'shock'; v.mt = performance.now(); S.say(id, oh || P(L.oh), 'ink', 800);
          B.fx.splash(posOf(id, 0), v.hitCol || v.inkCol || INK.ink, 5, 0.4); if (IW3.sfx) IW3.sfx('splat');
          if (opt.faceTo) { const w = views.get(opt.faceTo); if (w) S.face(id, w.gx, w.gy); } // 呼び合う相手の方を向く
          await IW3.wait(QF() * (kind === 'quick' ? (opt.burstLine ? 560 : 220) : 380));
          if (kind !== 'quick' && IW3.tempo !== 'quick') { // ② のけぞる（テンポ重視では、とばす）
            v.mode = 'hurt'; v.mt = performance.now(); S.say(id, P(L.cry), 'ink', 900);
            await IW3.wait(QF() * 480);
          }
          if (kind === 'leak') { // ③ インク漏れ：ひびが入って、しゃがみこみ、タンクがちらちら光る（爆発寸前）
            await S.partPop(id, part, P((L.partSwell || {})[part] || L.leakNow), P((L.partGone || {})[part] || L.leakNow));
            v.mode = 'leak'; v.mt = performance.now(); S.say(id, P(L.leakNow), 'red', 1500);
            await IW3.wait(QF() * 650);
            await S.shieldRelease(id);
            return;
          }
          // ③ 残っている部品が破裂：当たった所（opt.part）が先、残りはいっぺんに
          await S.burstParts(id, opt.part, kind === 'quick');
          // ④ はじける：手足をじたばたさせながら、ふくらんで（ため）→ ぺしゃっと。まとめてやられるときは少し短く
          await S.flail(id, opt.flailMs || (kind === 'quick' ? (opt.burstLine ? 1100 : 700) : 1500), opt.burstLine);
          if (opt.hold) { await S.holdSwell(id, opt.hold); if (opt.scatter) await IW3.wait(QF() * Math.random() * opt.scatter); } // ボーナス：ふくらんだまま、ほかの子のセリフが終わるのを待つ → ばらばらにはじける
          v.shieldHome = null; const h = views.get(999); if (h && h.mode === 'aimL') h.mode = 'idle';
          await S.pop(id, v.inkCol);
        },
        // 爆発寸前の2ターン目：力がぬけて、ぺたんと座りこむ（もう動けない）
        async sitDown(id, line) {
          const v = views.get(id); if (!v || !v.root.parent) return;
          v.mode = 'shock'; v.mt = performance.now(); S.say(id, line, 'red', 1600); await IW3.wait(QF() * 300);
          v.mode = 'sit'; v.mt = performance.now(); B.fx.splash(posOf(id, 0), v.inkCol || INK.ink, 6, 0.4); if (IW3.sfx) IW3.sfx('splat');
          await IW3.tween(QF() * 260, (t) => { v.sq = 0.12 * Math.sin(t * Math.PI); }); v.sq = 0; // ぺたん
          await IW3.wait(QF() * 300);
        },
        // ヒーローの姿を変える（スーツ機能停止・変身解除・スライム）。光って、ぱっと変わる
        async heroForm(form) {
          const v = views.get(999); if (!v || v.form === form) return;
          const m = await getForm(form); if (!m) return;
          const on = !!v.root.parent; if (on) B.scene.remove(v.root);
          Object.assign(v, { A: m.A, root: m.root, rig: m.rig, blade: m.blade, beam: m.beam, inkMats: m.inkMats, form, tank: m.tank, cannons: m.cannons, hose: m.hose, pack: m.pack, tube: m.tube });
          if (on) B.scene.add(v.root); placeV(v);
          if (S.lastDirt != null) S.heroDirt(S.lastDirt);
        },
        preload(form) { return getForm(form); },
        async jumpShot(id, dir, col) {
          const v = views.get(id); if (!v) return; S.faceDir(id, dir); v.mode = 'jump';
          if (IW3.sfx) IW3.sfx('jump');
          await IW3.tween(260, (t) => { v.lift = Math.sin(t * Math.PI / 2) * 0.9; });
          const p = v.root.position.clone(); p.y = 0;
          await Promise.all([B.fx.splash(p, col || INK.ink, 26, 1.3), B.fx.ring(p, col || INK.ink, 2.2, 420), IW3.tween(260, (t) => { v.extra = { C_Spine: [0.1 * Math.sin(t * Math.PI * 4), 0, 0] }; })]);
          v.extra = null;
        },
        land(id) { const v = views.get(id); if (!v || v.mode !== 'jump') return; v.mode = 'idle'; return IW3.tween(200, (t) => { v.lift = 0.9 * (1 - t); }); },
        setMode(id, m) { const v = views.get(id); if (v) { v.mode = m; v.mt = performance.now(); } },
        // パーツが使えなくなった：灰色にして、ひびの音
        // 部品（objs）が、ぶるぶるしながら大きくふくらんで（ため ms）→ はじけ飛んで、なくなる
        async popObjs(id, objs, ms, swellLine) {
          const v = views.get(id); if (!v || !v.root.parent) return false; S.expr(id, 'fear', ms + 500); // 部品がふくらむ：こわがる顔 objs = objs.filter(o => o && o.visible); if (!objs.length) return false;
          const col = v.inkCol || INK.ink, s0 = objs.map(o => o.scale.clone()), glow = [];
          for (const o of objs) o.traverse(m => { if (m.isMesh && m.material && !Array.isArray(m.material)) { m.material = m.material.clone(); if (m.material.emissive) { m.material.emissive.setHex(col); glow.push(m.material); } } });
          if (swellLine) S.say(id, swellLine, 'red', Math.max(900, ms + 300)); if (IW3.sfx) { IW3.sfx('swell'); IW3.sfx('crack'); }
          await IW3.tween(QF() * ms, (t) => {
            const k = 1 + 1.4 * t * t, w = 1 + 0.12 * t * Math.sin(t * 60);
            objs.forEach((o, i) => o.scale.set(s0[i].x * k * w, s0[i].y * k / w, s0[i].z * k * w));
            for (const m of glow) m.emissiveIntensity = 0.2 + 2.2 * t * (0.6 + 0.4 * Math.abs(Math.sin(t * 25)));
          });
          for (const o of objs) { const p = o.getWorldPosition(new TT.Vector3()); B.fx.splash(p, col, objs.length > 2 ? 9 : 16, 0.7); B.fx.ring(p, col, 0.9, 300); B.fx.muzzle(p, col, 0.45); o.visible = false; o.scale.copy(s0[objs.indexOf(o)]); }
          if (v.tube && (objs.includes(v.tank) || objs.includes(v.hose))) v.tube.visible = false;
          if (B.shake) B.shake(0.025); if (IW3.sfx) IW3.sfx('pop');
          const ps = objs[0].getWorldPosition(new TT.Vector3()); S.sfxText(() => ps.clone().add(new TT.Vector3(0, 0.35, 0)), 'パァン！', 600);
          return true;
        },
        // 部品の名前 → その部品の形（キャノンは左右2つ）。背中のホールタンクは入れない
        partObjs(v, k) { return (k === 'cannon' ? v.cannons || [] : k === 'hose' ? [v.hose] : k === 'tank' ? [v.tank] : []).filter(o => o && o.visible); },
        // インク漏れ：当たった部品が、ふくらんで、はじけ飛ぶ（ほんとの破裂はしない）
        async partPop(id, part, swellLine, goneLine) {
          const v = views.get(id); if (!v || !v.root.parent) return;
          const objs = part === 'valve' ? [v.pack].filter(o => o && o.visible) : S.partObjs(v, part);
          if (!(await S.popObjs(id, objs, 1000, swellLine))) { B.fx.splash(posOf(id, 0), v.inkCol || INK.ink, 8, 0.6); if (IW3.sfx) IW3.sfx('crack'); return; }
          v.mode = 'shock'; v.mt = performance.now(); S.sfxText(() => posOf(id, 1.5), 'こらえた！', 900); /* Ink95：部品だけはじけて、本人は立っている合図 */ await IW3.wait(QF() * 250);
          if (goneLine) S.say(id, goneLine, 'red', 1300);
          await IW3.wait(QF() * 700);
        },
        // ほんとの破裂の前：まず1か所（当たった所。なければどこか）がふくらんで破裂 → 残りが、いっぺんに破裂。fast：まとめてはじけるときは短く
        async burstParts(id, first, fast) {
          const v = views.get(id); if (!v || !v.root.parent) return;
          const U = ['tank', 'cannon', 'hose'].map(k => ({ k, objs: S.partObjs(v, k) })).filter(x => x.objs.length); if (!U.length) return;
          const f = U.find(x => x.k === first) || U[Math.floor(Math.random() * U.length)], L = IW3.LINES, P = IW3.pick;
          await S.popObjs(id, f.objs, fast ? 450 : 900, P(((L.partSwell || {})[f.k]) || L.leakNow));
          const rest = U.filter(x => x !== f).flatMap(x => x.objs);
          if (rest.length) { await IW3.wait(QF() * (fast ? 60 : 140)); await S.popObjs(id, rest, fast ? 220 : 380, null); }
          await IW3.wait(QF() * (fast ? 60 : 150));
        },
        breakPart(id, part) {
          const v = views.get(id); if (!v) return;
          const objs = part === 'cannon' ? v.cannons : part === 'hose' ? [v.hose] : part === 'tank' ? [v.tank] : [v.pack];
          for (const o of objs) if (o) o.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color && m.material.color.multiplyScalar(0.45); if (m.material.emissive) m.material.emissive.setHex(0x111111); } });
        },
        tint(id, col, ms) { const v = views.get(id); if (!v) return; const p = posOf(id, 1); B.fx.flashAt(p, col); },
        heroDirt(total) { // ヒーローのスーツが、よごれで紫っぽくなる。スーツが不調になる 50 から、肌もだんだんスライムの青に
          S.lastDirt = total;
          const v = views.get(999); if (!v || !v.A) return;
          const k = Math.min(1, total / 80);
          if (v.form !== 'slime') v.A.materials && v.A.materials.forEach(m => { if (!m.userData.__c0 && m.color) m.userData.__c0 = m.color.clone(); if (m.userData.__c0 && m.userData.body !== true) m.color.copy(m.userData.__c0).lerp(new TT.Color(INK.ink), k * 0.35); });
          v.skinK = v.form === 'slime' ? null : Math.max(0, Math.min(1, (total - 48) / 32)) * 0.75; v.skinDirty = 40;
        },
        // インクタンクの大爆発：ふるえながらふくらむ（ため）→ ドカーン（大きな飛沫と輪）→ 床に大きなしみ
        async barrelBlow(id, chained) {
          const v = views.get(id); if (!v || v.gone || !v.root.parent) return;
          const top = () => { const q = v.root.position.clone(); q.y += 0.75; return q; };
          S.sfxText(top, chained ? 'ボコッ…！' : 'ゴゴゴ…', chained ? 420 : 760);
          if (IW3.sfx) { IW3.sfx('swell'); IW3.sfx('crack'); }
          await IW3.tween(chained ? 420 : 760, (t) => { v.sc = 1 + 0.38 * t * t; v.shake = 0.3 + t; v.glow = 2.6 * t; v.sq = -0.06 * Math.sin(t * Math.PI * 6) * t; });
          const p = posOf(id, 0), col = v.inkCol || INK.ink;
          B.fx.splash(p, col, 56, 2.4); B.fx.ring(p, col, 3.0, 620); B.fx.ring(p, 0xffffff, 2.0, 360); B.fx.muzzle(posOf(id, 0.6), col, 1.5); B.fx.muzzle(posOf(id, 1.2), 0xffffff, 0.7);
          S.sfxText(top, 'ドッカーン！', 950);
          if (B.shake) B.shake(chained ? 0.1 : 0.15); if (B.punch && !(B.CAM && B.CAM.lock)) B.punch(v.gx - B.half, v.gy - B.half, 0.75, 900);
          if (IW3.sfx) { IW3.sfx('pop'); IW3.sfx('jump'); IW3.sfx('splat'); }
          B.scene.remove(v.root); v.gone = true; v.shake = 0;
          B.fx.stain(p.x, p.z, col, 1.3);
          await IW3.wait(chained ? 160 : 280);
        },
        // 体力つきの班長に当たった：びくっ → のけぞる → タンクとからだが少しふくらむ（体力がへるほど大きく）。頭の上に「あと○回」
        async bossHit(id, hp, hp0, line) {
          const v = views.get(id); if (!v || !v.root.parent) return;
          const L = IW3.LINES, P = IW3.pick;
          v.mode = 'shock'; v.mt = performance.now(); S.say(id, P(L.oh), 'ink', 700);
          B.fx.splash(posOf(id, 0.2), v.inkCol || INK.ink, 8, 0.5); B.fx.flashAt(posOf(id, 1), 0xffe14a); if (IW3.sfx) { IW3.sfx('splat'); IW3.sfx('swell'); }
          await IW3.wait(320);
          v.mode = 'hurt'; v.mt = performance.now(); S.say(id, line, 'red', 1500);
          const s0 = v.sc || 1, f = 1 - hp / (hp0 || hp + 1), s1 = v.base ? v.base * (1 + 0.12 * f) : 1.06 + 0.16 * f;
          await IW3.tween(520, (t) => { v.sc = s0 + (s1 - s0) * t + Math.sin(t * Math.PI * 6) * 0.03 * (1 - t); v.sq = 0.08 * Math.sin(t * Math.PI * 4) * (1 - t); });
          v.sq = 0; v.sc = s1;
          let dots = ''; for (let i = 0; i < (hp0 || hp); i++) dots += i < hp ? '●' : '○';
          S.sfxText(headOf(id), 'あと' + hp + '回 ' + dots, 1300);
          await IW3.wait(420);
          v.mode = restMode(v);
        },
        // 首領（ふだん）：攻撃が、部下の想いのバリアではね返される
        async guardFx(id) {
          const v = views.get(id); if (!v || !v.root.parent) return;
          v.mode = 'shock'; v.mt = performance.now();
          B.fx.flashAt(posOf(id, 0.6), 0x8ad8ff); if (IW3.sfx) IW3.sfx('kon');
          S.sfxText(headOf(id), 'キィン！', 600);
          const s0 = v.sc || 1; await IW3.tween(360, (t) => { v.sq = 0.12 * Math.sin(t * Math.PI * 6) * (1 - t); v.sc = s0 * (1 - 0.08 * Math.sin(t * Math.PI)); });
          v.sq = 0; v.sc = s0; v.mode = restMode(v);
        },
        // 首領の覚醒：金の光 → むくむく大きくなる
        async awakenFx(id) {
          const v = views.get(id); if (!v || !v.root.parent) return;
          v.mode = 'shock'; v.mt = performance.now(); if (IW3.sfx) IW3.sfx('swell');
          for (let k = 0; k < 4; k++) { B.fx.flashAt(posOf(id, 0.3 + k * 0.3), 0xffd23a); await IW3.wait(140); }
          const s0 = v.sc || 0.72, s1 = 1.35;
          await IW3.tween(900, (t) => { v.sc = s0 + (s1 - s0) * t + Math.sin(t * Math.PI * 8) * 0.04 * (1 - t); v.sq = 0.1 * Math.sin(t * Math.PI * 5) * (1 - t); });
          v.sc = v.base = s1; v.sq = 0; if (B.shake) B.shake(0.1);
          B.fx.splash(posOf(id, 0.2), 0xffd23a, 18, 0.9);
          v.mode = restMode(v);
        },
        // 首領のインクの雨：空からヒーローのまわりへふりそそぐ（safe＝柱のかげで当たらない）
        async stormFx(id, safe) {
          const h = [...views.values()].find(w => w.u && w.u.kind === 'hero' && !w.gone); if (!h) return;
          const c = posOf(id, 1.2), hp = h.root.position.clone(), TT3 = W.RING3D.THREE, ink = (views.get(id) || {}).inkCol || INK.ink;
          if (IW3.sfx) IW3.sfx('jump');
          await Promise.all([0, 1, 2, 3, 4, 5].map(k => IW3.wait(k * 110).then(() => { const to = hp.clone().add(new TT3.Vector3((Math.random() - 0.5) * 1.6, 0.1, (Math.random() - 0.5) * 1.6)); return B.fx.shot(c.clone(), to, ink, 600, 2.4, 1.2); })));
          if (safe) S.sfxText(() => hp.clone().add(new TT3.Vector3(0, 1.3, 0)), 'セーフ！', 700);
          else { B.fx.splash(hp.clone().add(new TT3.Vector3(0, 0.6, 0)), ink, 14, 0.7); if (IW3.sfx) IW3.sfx('splat'); S.sfxText(() => hp.clone().add(new TT3.Vector3(0, 1.3, 0)), 'ベチャッ！', 700); }
        },
        // 治された（第6層）：はじけ飛んでいた武器・タンクが、ふくらむように元にもどる
        restoreParts(id) {
          const v = views.get(id); if (!v || !v.root.parent) return Promise.resolve();
          const objs = [...(v.cannons || []), v.hose, v.tank, v.pack].filter(o => o && !o.visible); if (v.tube) v.tube.visible = true;
          const s0 = objs.map(o => o.scale.clone());
          for (const o of objs) { o.visible = true; o.traverse(m => { if (m.isMesh && m.material && m.material.emissive) m.material.emissiveIntensity = 0.3; }); }
          return IW3.tween(500, (t) => { const k = 0.15 + 0.85 * t + Math.sin(t * Math.PI) * 0.15; objs.forEach((o, i) => o.scale.set(s0[i].x * k, s0[i].y * k, s0[i].z * k)); }).then(() => objs.forEach((o, i) => o.scale.copy(s0[i])));
        },
        // 救護係が治す：そばへ向いて、ピンクの光 → 部品が元にもどる → 「なおった〜！」
        // はね返しの盾（第7層の幹部）：水色の六角の光で、攻撃をはね返す
        async reflectFx(id, line) {
          const v = views.get(id); if (!v || !v.root.parent) return;
          const p = posOf(id, 1.0); B.fx.ring(p, 0x7ff0ff, 1.3, 380); B.fx.muzzle(p, 0xffffff, 0.8); B.fx.flashAt(p, 0x7ff0ff); if (IW3.sfx) IW3.sfx('kon');
          S.sfxText(headOf(id), 'キィン！', 700); if (line) S.say(id, line, 'ink', 1400);
          v.mode = 'cheer'; v.mt = performance.now(); await IW3.wait(700); v.mode = restMode(v);
        },
        // ワープ（第8層）：光って消えて、もう一方のワープ床から出てくる
        async warpFx(id, x, y) {
          const v = views.get(id); if (!v || !v.root.parent) return;
          const a = posOf(id, 0.5); B.fx.ring(a, 0x5ae0ff, 0.9, 260); B.fx.muzzle(a, 0xffffff, 0.6); if (IW3.sfx) IW3.sfx('laser');
          const s0 = v.sc || 1; await IW3.tween(180, (t) => { v.sc = s0 * (1 - 0.9 * t); });
          v.gx = x; v.gy = y; placeV(v);
          const b = posOf(id, 0.5); B.fx.ring(b, 0x5ae0ff, 0.9, 260); B.fx.muzzle(b, 0xffffff, 0.6);
          await IW3.tween(220, (t) => { v.sc = s0 * (0.1 + 0.9 * t); }); v.sc = s0;
        },
        // 鉄柱へ放り投げられる：空高く舞い上がって、くるくる回りながら → 柱の真上から落ちて、ホースとタンクに柱が通り、根もとまで（重なる）
        async poleThrow(id, s, line, landLine) {
          const v = views.get(id); if (!v || !v.root.parent) return;
          const h = views.get(999); if (h) { S.face(999, v.gx, v.gy); h.mode = 'slash'; h.mt = performance.now(); }
          if (line) S.say(id, line, 'red', 1100);
          const a0 = v.root.position.clone(), end = stuckPos(s, v), top = { x: end.x, y: 5.4, z: end.z };
          v.mode = 'swell'; v.mt = performance.now(); v.mdur = 400; v.mute = true; if (IW3.sfx) IW3.sfx('jump'); // 飛んでいるあいだは、ほかのセリフでじゃましない
          await IW3.tween(720, (t) => { const k = t * t * (3 - 2 * t); v.fly = { x: a0.x + (top.x - a0.x) * k, y: a0.y + (top.y - a0.y) * k + Math.sin(t * Math.PI) * 1.0, z: a0.z + (top.z - a0.z) * k, ry: s.ang + t * 4, rx: t * Math.PI * 3 }; });
          if (h) h.mode = 'idle';
          await IW3.wait(120);
          const rxEnd = s.face === 'up' ? Math.PI / 2 : -Math.PI / 2;
          await IW3.tween(480, (t) => { v.fly = { x: end.x, y: top.y + (end.y - top.y) * t * t, z: end.z, ry: s.ang, rx: rxEnd }; });
          v.fly = null; v.stuck = s; v.mode = 'idle'; placeV(v);
          const p = new TT.Vector3(end.x, end.y, end.z); B.fx.splash(p, v.inkCol || INK.ink, 10, 0.5); B.fx.ring(new TT.Vector3(end.x, 0.05, end.z), 0xffffff, 0.7, 260);
          if (IW3.sfx) { IW3.sfx('gasha'); IW3.sfx('splat'); } if (B.shake) B.shake(0.04);
          S.sfxText(() => new TT.Vector3(end.x, end.y + 0.5, end.z), 'ズドン！', 700);
          await IW3.tween(260, (t) => { v.sq = 0.15 * Math.sin(t * Math.PI); }); v.sq = 0;
          v.mute = false; if (landLine) S.say(id, landLine, 'red', 1500);
          await IW3.wait(500);
        },
        async healFx(id, toId, line, thanks) {
          const v = views.get(id), w = views.get(toId); if (!w || !w.root.parent) return;
          if (v && v !== w) { S.face(id, w.gx, w.gy); v.mode = 'cheer'; v.mt = performance.now(); }
          if (line) S.say(id, line, 'ink', 1200);
          await IW3.wait(350);
          const p = posOf(toId, 0.2); B.fx.ring(p, 0xff9ad5, 1.1, 420); B.fx.muzzle(posOf(toId, 1.0), 0xffc8ec, 0.6); B.fx.flashAt(posOf(toId, 0.8), 0xffffff); if (IW3.sfx) IW3.sfx('swell');
          await S.restoreParts(toId);
          w.mode = restMode(w); w.mt = performance.now(); if (thanks) S.say(toId, thanks, 'ink', 1100);
          if (v && v.mode === 'cheer') v.mode = restMode(v);
          await IW3.wait(450);
        },
        remove(id) { const v = views.get(id); if (v) { B.scene.remove(v.root); if (v.ring) B.scene.remove(v.ring); if (v.arrow) B.scene.remove(v.arrow); if (v.fullMark) B.scene.remove(v.fullMark); v.gone = true; } },
        inkOf(id) { const v = views.get(id); return (v && v.inkCol) || INK.ink; },
        spawn(u) { const v = mk(u); v.sc = 0.01; return IW3.tween(400, (t) => { v.sc = t; }).then(() => { v.sc = 1; v.root.scale.setScalar(1); }); },
        sync(G) { for (const u of G.units) { const v = views.get(u.id); if (!v) continue; if (u.gone && v.root.parent && !(u.kind === 'hero' && v.form === 'slime') && !u.stuck) S.remove(u.id); else if (!u.gone) { v.gx = u.x; v.gy = u.y; v.yawT = YAW[u.dir]; if ((v.mode === 'idle' || v.mode === 'leak') && (u.state === 'leak' || u.sit)) v.mode = restMode(v); if (v.mode === 'jump' && !u.jumping) S.land(u.id); } } },
      };
      return S;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ---- src/ui/director.js ---- */
// ---- インク戦闘員ウォーズ：出来事を、演出とセリフにする ----
//   IW3.play(stage, board, G, ev, hud)：対戦の出来事 ev を順番に見せる。
//   戦闘員の番は、人数が多いので、1人ずつ少し重ねて見せる（はじける場面だけは、終わるまで待つ）。
//   セリフは、だれでも聞ける言葉だけ（元のゲームのセリフから、そのまま使えるものを残して、ほかは置きかえた）。
(function (W) {
  'use strict';
  const IW3 = W.IW3 = W.IW3 || {};
  const L = IW3.LINES = {
    fire: ['えへへ、当たれ！', 'ふふ、くらって！', 'そこ、くらいなさい！', '絶対、当てる！', 'こら、動くな！', 'やった、出せた！', 'インクまみれにしてやる！'],
    jump: ['ジャンプ噴射、いくよ！', '上からいくよー！', 'とびまーす！', 'まとめて、はじけて！'],
    hitHero: ['当たった！', 'やった、命中！', 'よし、よごれた！', 'もう一発！'],
    wide: ['かわされた！？', '今の、よけられた！', 'えっ、届いてない！？', 'うそ、そらされた！'],
    stray: ['えっ、今の、わたし！？', 'きゃっ！？ なんで！？', 'うそ、わたしに！？'],
    shield: ['え？ わたしを盾に？ ひどい！', 'わたしを盾にしないで！', '盾なんて聞いてない！', 'やだ、わたしが受けちゃう！'],
    thrown: ['えっ、つかまれた！？', '投げないで！', 'きゃあ、手を離して！', 'わたし、飛ぶ！？'],
    bump: ['ひゃっ、重い！', '誰かぶつかってきた！', 'うわっ、当たった！', 'タンク同士、ぶつかった！'],
    leak: ['タンクにひびが……！', 'インクがもれてる……', '次ではじけちゃうかも', 'うう、まだ撃てる', 'いつはじけちゃうの……'],
    burst: ['はじけちゃったー！', 'インクまみれー！', 'はじけちゃうー！', 'うわあああん！', 'われちゃううう！', 'ひゃああああ！'],
    chain: ['みんな、離れて！', '巻き込んじゃうよ！', '近くにいないで！', '連鎖しちゃうー！'],
    aim: ['よーく、ねらって……', 'ねらいを定めて……', 'じっとしててね……', '動かないで……', 'そこ……！', 'ここからなら、とどく……'],
    go: ['いくよー！', 'えいっ！', 'それーっ！', 'くらえー！', '発射ー！', 'スライムインク、いっけー！'],
    goCannon: ['ツインキャノン、発射！', 'ダブルでいくよー！', 'どーん！'],
    oh: ['え！？', 'あっ！', 'ひゃっ！？', 'えっ！？', 'わっ！？', 'あれっ！？'],
    cry: ['うわああっ！', 'きゃああっ！', 'やあああん！', 'ひゃああっ！', 'うそおおっ！'],
    // 武器・タンクに当たった：ふくらんで、はじけ飛ぶ
    partSwell: { cannon: ['キャノンが、ふくらんで……！？', 'やだ、キャノンが！ とまってー！', 'キャノンが、パンパンに……！'], hose: ['ホースが、ふくらんでく……！', 'え、ホースが……！？ だめだめ！', 'ホースが、パンパン……！'], tank: ['お腹のタンクが……ふくらんでる！？', 'タンクが、ふくらんで……やだぁ！', 'タンクが、パンパンに……！'] },
    partGone: { cannon: ['キャノンが、なくなっちゃった……！', 'わたしのキャノンがー！', 'もう、キャノンで撃てないよ……！'], hose: ['ホースが、はじけちゃった……！', 'ホースがー！ もう撃てない……！', 'わたしのホースー！'], tank: ['タンクが、はじけちゃった……！', 'お腹のタンクがー！', 'タンクが、なくなっちゃった……！'] },
    leakNow: ['インクが、もれてる……！', 'タンクに、ひびが……！', 'は、はじけちゃいそう……！', 'まだ……まだ撃てるもん……！', 'あぶない、あぶない……！'],
    burstNow: ['だめ、はじけちゃうー！', 'もう、もたないー！', 'いやああ、ふくらむー！', 'ああっ、あふれちゃうー！'],
    sitNow: ['あ……足に、力が……入らない……', 'もう、立てない……', 'ぺたん……動けないよぉ……', 'だれか……たすけて……'],
    // いっぺんにはじけるときの、呼び合い（〇 に相手の名前が入る）
    callOh: ['〇ちゃーん！', '〇ちゃん！？', 'いやっ、〇ちゃん！', '〇ちゃん、こっち！'],
    callBurst: ['〇ちゃん、手をつないで……！', '〇ちゃーん、いっしょに……！', '〇ちゃん、またあとでね……！', '〇ちゃーーん！', '〇ちゃん、はなれないで……！'],
    callWarn: ['〇ちゃん、にげてー！', '〇ちゃん、ごめーん！', 'あっ、〇ちゃん、近い……！', '〇ちゃん、はなれて……！'],
    callBack: ['〇ちゃーん！？', '〇ちゃん、なんでー！？', 'えっ、〇ちゃん！？', '〇ちゃんの、インクが……！'],
    // じたばたのセリフ（長さに合わせて、短い1つ／はじめ→おわり／はじめ→なか→おわり）
    flailShort: ['あっ……！', 'ひゃっ！', 'やっ……！', 'ああっ！'],
    flailA: ['いや、いやっ……！', 'だめだめだめ……！', 'とまって、とまってー！', 'やだ、やだぁ……！', 'ちょ、ちょっと待って……！'],
    flailB: ['ふくらんじゃう、ふくらんじゃうー！', 'おさえられないよぉ……！', 'タンクが、あつい……あついー！', 'ぷるぷるが、とまらない……！', 'あふれる、あふれちゃう……！'],
    flailC: ['もう、だめえええっ！', 'はじけちゃうーーっ！', 'あああああーっ！', 'いやああああんっ！', 'きゃあああーっ！'],
    airSafe: ['セーフ！ 飛沫、とどかなかった！', 'ふう……あぶなかった！', '空の上なら、へっちゃら！', 'よけきれたー！'],
    timeNow: ['もう……げんかい……！', 'あ、あ……もれちゃう……！', 'がまん、できない……！'],
    shieldHero: ['悪いけど、盾になってもらう！', 'ちょっと借りるよ！', 'こっちへ！'],
    heroOuch: ['くっ……！', 'つめたっ……！', 'まだまだ！', 'しみてくる……！'],
    swell: ['あ……あ……！', 'かかっちゃった……！', 'ふくらむぅ……！', 'だめ、あふれちゃう……！', 'ひっ……！', 'う、うそ……！', 'タンクが……熱い……！'],
    graze: ['ひゃっ、かすった！', 'あぶなっ！', 'ちょっと、こっち撃たないで！', 'いまの、わたしの横！'],
    blame: ['ご、ごめーん！', 'あっ、ちがうの！', 'そっちじゃないのにー！', 'わざとじゃないよ！'],
    down: ['ここに撃って！ 自爆するから！', '撃って、ヒーローに浴びせて！', 'わたしを使って！'],
    self: ['きたっ、これで浴びせる！', 'あっ、入った……はじけるっ！'],
    sticky: ['ねばねばインク、いけ！', '黄色くしてやる！', '動き、止めて！'],
    refill: ['インク、満タンになっちゃった', 'もう少しで溢れちゃう', '撃たないと、溢れちゃう'],
    retreat: ['撤退、始めた！', '逃げ始めたよ！', '今だ、追って！', '端まで追うよ！'],
    weak: ['スーツ、崩れてる！', '変身、解けた！', '倒せる、今！', '追いつめてる！'],
    fewer: ['減ってきちゃった……', 'みんな、大丈夫？', 'このままだと、やばいかも', '固まらないで、ばらけて！', '人数、少なくなってるよ'],
    lastOnes: ['もう、ほとんどいない……', 'わたしだけにしないで', '頼むから、生き残って', 'ああ……みんな、どこー！'],
    win: ['大勝利ー！', 'やったー！ インク団の勝ち！', 'またスライムの仲間が増えたね！'],
    fallMinion: ['今だよ！ スライムインク、ぜんぶかけちゃえ！', 'みんな、いっせいに！', 'これで、わたしたちの仲間だよ！'],
    fallHero: ['……か、体が……ぷるぷるする……！？', 'うそ……わたし……スライムに……！？'],
    joined: ['……えへへ。インク団、よろしくね♪', 'なんだか……ぷるぷるして、楽しいかも！', 'わたしも、今日からインク団！'],
    welcome: ['ようこそ、インク団へ！', 'なかまが増えたー！', 'おそろいだね！', 'これからは、いっしょだよ！'],
    heroAtk: { pole: ['そこで、おとなしくしていろ！', 'とんでいけ！', '次！'], blade: ['ブレード！', 'はあっ！', '斬る！'], laser: ['レーザーガン！', 'そこだ！', '撃ち抜く！'], sweep: ['薙ぎ払い！', 'まとめて来い！'], comet: ['ハレー彗星！'], lbreak: ['レーザーブレイク！'], homing: ['ホーミングミサイル！'] },
    heroThrow: ['そっちへ飛んでけ！', 'ここまでだ！', 'えいっ！'],
    heroSticky: ['体が、重い！', 'ねばねばする……！'],
    heroLv: { 1: 'スーツにスライムが……しみてくる……！ 撤退する！', 2: 'スーツが、とけていく……！', 3: '変身が、解けた……！ 肌まで、青く……！', 4: 'もう……立てない……' },
    heroWin: ['これで、全員だ！', '街の平和は守った！'],
    // ステージ第2層：インクタンク・体力つきの班長
    barrelOh: ['えっ、タンクが……！？', 'タンクが、ぶるぶるしてる……！', 'やだ、タンクがふくらんでる……！', 'そのタンク、撃っちゃだめー！'],
    barrelChain: ['となりのタンクにも、うつった……！？', 'タンクが、つぎつぎ……！', 'きゃー！ こっちのタンクもー！'],
    barrelHero: ['しまった、近すぎた……！', 'くっ、爆発に巻きこまれる……！'],
    aimBarrel: ['ヒーローのそばのタンク、ねらうよ……！', 'あのタンクを撃てば……！', 'タンクごと、どかーんだよ！'],
    bossHitHi: ['いったぁ……！ でも、まだまだ！', 'ふふん、そのくらいじゃ、はじけないよ！', '班長のタンクは、大きいんだから！'],
    bossHitLo: ['う……タンクが、ふくらんできた……', 'ちょ、ちょっと、きつくなってきたかも……', 'まだ……まだ、がんばれる……！'],
    bossEnd: ['そんな……班長のわたしが……！', 'もう、もたない……！'],
    // ボーナス（固定砲台部隊）：破裂の波が、はじまった所から近づいてくる。遠い子は、まだ無事だけど、にげられない
    bonusDread: ['みんなが、どんどんはじけてく……！ こっちに近づいてくるー！', 'いやあ！ 破裂が、近づいてくるー！', 'に、にげられない……！ 手も足も、うごかないよぉ！', 'つぎ、となり……！ そのつぎ、わたし……！？', 'いやいやいや、こないでー！', 'はずして〜！ この留め具、はずしてー！', 'まって、まって、まってー！', 'もう、となりの子まで来てる……！', 'やだやだ、順番がまわってくるー！', 'だれか〜！ たすけてー！'],
    // 第6層：救護係・幹部ナデシコ
    // 特別ステージ：鉄柱
    poleGrab: ['えっ、つかまれた！？', 'きゃあっ、はなしてー！', 'わ、わたし、とぶの！？'],
    poleStuck: ['うそっ、ささった〜！？', 'ホースとタンクが、ぬけない〜！', 'うごけな〜い！'],
    poleCrush: ['ちょ、上から来ないで〜！', 'おもい〜！ つぶれる〜！', 'きゃっ、だれか落ちてきた〜！'],
    poleHold: ['わたしがはじけたら、みんなが……！ がまん……！', '上からインクが、たれてくる……ふくらむ……でも、がまん！', 'みんな、がんばって……！ わたしも、たえる……！', 'ここで、はじけるわけには……いかないの……！'],
    poleChainHit: ['となりの柱から、インクが……！ みんな、ごめーん！', 'えっ、こっちの柱まで……！？ もう、むりーっ！', 'インクが、とんできた〜！ がまん、できな〜い！'],
    poleSorry: ['……ごめん！ もう、げんかい……！', 'みんな、ごめーん！ もう、むりーっ！'],
    poleWave: ['えっ、うそ、まって……！', 'となりが……！ わたしも、もう……！', 'いやああ、みんな〜！', 'がまんしてたのに〜！', 'つぎ、わたし……！？ いやあ〜！'],
    poleEndure: ['もれちゃう……でも、がまん……！', 'だれか〜、ぬいて〜……', 'う、うごけないよぉ……', 'インク、もれてる……はじけちゃいそう……でも、まだ……！'],
    reflectExec: ['ふふ、正面からじゃ、効かないわ', 'その光、はね返してあげる', 'わたしの盾は、無敵よ'],
    reflectHero: ['はね返された……！', '正面からは、だめか……！'],
    medicHeal: ['いま治すよ〜！', 'いたいのいたいの、とんでけ〜！', 'じっとしててね〜、すぐ治るから！'],
    healed: ['なおった〜！ ありがとう！', 'わあ、元どおり！', 'もう一回、がんばれる！'],
    execHeal: ['みんな、わたしのそばに……治してあげる', 'けがは、ぜんぶわたしが引き受けるわ', 'だいじょうぶ、まだはじけさせない'],
    chiefGuard: ['い、いたくないのじゃ！ ぜんぜん、いたくないのじゃ！', 'ひゃっ！ ……ふ、ふん、効かぬのじゃ！', 'わらわに手を出すとは、ぶれいものなのじゃ！'],
    guardMinion: ['首領さまは、わたしたちが守る！', '首領さまに、さわらないで！', 'だいじょうぶです、首領さま！'],
    chiefAwake: ['みんなの想い……受け取ったのじゃ！', 'みんな……ゆるさぬのじゃ……！ わらわが、首領なのじゃ！'],
    chiefStorm: ['インクの雨じゃ！ ふりそそぐのじゃ！', 'これが首領の力なのじゃ！'],
    stormSafe: ['柱のかげなら、だいじょうぶ……！', 'あぶない、かくれててよかった！'],
    stormHit: ['うわっ、インクの雨……！', 'よけきれない……！'],
    chiefHitHi: ['い、いたいのじゃ……でも、まけぬのじゃ！', 'ふん、まだまだなのじゃ！'],
    chiefHitLo: ['う、うう……タンクが、ぱんぱんなのじゃ……', 'み、みんなの分まで……がんばるのじゃ……！'],
    chiefEnd: ['み、みんな……ごめんなのじゃ〜……！'],
    bonusCaught: ['きたぁーっ！', 'やっぱりー！', 'いやああーっ！', 'わたしの番〜！？'],
  };
  const pick = IW3.pick = (A) => A[Math.floor(Math.random() * A.length)];
  const nm = (S, id) => { const v = S.views.get(id); return ((v && v.u && v.u.name) || '').replace(/(・増|[0-9]+)$/, '') || 'みんな'; }; // 呼び名（数字などを取る）
  let lastCall = ''; const call = (A, name) => {
    // Ink80：名前とまるごと録った言い方（「アカネちゃーん！」など）があれば、6割はそれを使う（つなぎ目のない声）
    // Ink83：つないだ声は、どうしてもつないだように聞こえる → まるごと録った声があれば、いつもそれを使う。
    //   その場面の言い方に録った声がなければ、近い気持ちの言い方（びっくり＝「〇ちゃん！？」、それ以外＝「〇ちゃーん！」）にする
    const has = (t) => IW3.voiceHasWhole && IW3.voiceHasWhole(t.replace('〇', name));
    let whole = A.filter(has);
    if (!whole.length) whole = (A === L.callBack ? ['〇ちゃん！？', '〇ちゃーん！'] : ['〇ちゃーん！', '〇ちゃん！？']).filter(has).slice(0, 1);
    if (whole.length) { let t = pick(whole); for (let k = 0; k < 3 && t === lastCall && whole.length > 1; k++) t = pick(whole); lastCall = t; return t.replace('〇', name); }
    let t = pick(A); for (let k = 0; k < 4 && t === lastCall; k++) t = pick(A); lastCall = t; return t.replace('〇', name); }; // 同じ言い方が続かないように
  const QUICK = new Set(['sweep', 'lbreak', 'comet', 'homing', 'jump', 'kill', 'wave', 'barrel']); // まとめてやられる攻撃
  const chance = (p) => Math.random() < p;
  // ev を「人の動き」ごとに分ける
  function chunks(ev) {
    const out = []; let cur = null;
    const START = new Set(['turn', 'move', 'hatk', 'throw', 'spawn', 'sticky', 'leave', 'end', 'herolv', 'sit']);
    for (const e of ev) {
      let fresh = !cur || START.has(e.k);
      if (e.k === 'fire' && cur && (cur.actor !== e.id || cur.list.some(x => x.k === 'fire'))) fresh = true;
      if (e.k === 'fire' && cur && cur.k === 'move' && cur.actor === e.id && !cur.list.some(x => x.k === 'fire')) fresh = false;
      if (fresh) { if (cur) out.push(cur); cur = { actor: e.id, k: e.k, list: [] }; }
      cur.list.push(e);
    }
    if (cur) out.push(cur);
    return out;
  }
  // ヒーローがたおれる → まわりの戦闘員がいっせいにスライムインクをかける → スライムになって、インク団の仲間入り
  async function heroFall(S, B, G, hud, INK) {
    const h = S.views.get(999); if (!h) return;
    S.preload('slime');
    hud && hud.banner('ヒーローがたおれた！', 'よごれ ' + G.hero.ink, 'ink');
    S.setMode(999, 'kneel'); S.say(999, L.heroLv[4], 'hero');
    if (B.lookAt && !(B.CAM && B.CAM.lock)) B.lookAt(h.gx - B.half, h.gy - B.half, Math.max(9, B.N * 0.62)); // Ink97：寄りすぎない（前は 7・0.45。盤が見えないと言われた）
    await IW3.wait(1100);
    const near = [...S.views.values()].filter(v => v.kind === 'minion' && v.root.parent && !v.gone).sort((a, b) => Math.hypot(a.gx - h.gx, a.gy - h.gy) - Math.hypot(b.gx - h.gx, b.gy - h.gy)).slice(0, 8);
    if (near[0]) S.say(near[0].id, pick(L.fallMinion), 'ink');
    await IW3.wait(500);
    await Promise.all(near.map((m, i) => IW3.wait(i * 110).then(() => S.shoot(m.id, 999, i % 2 ? 'cannon' : 'hose', INK.ink, false))));
    const p = S.posOf(999, 0);
    B.fx.splash(p, INK.ink, 44, 1.6); B.fx.ring(p, INK.ink, 2.6, 600); if (B.shake) B.shake(0.12); if (IW3.sfx) IW3.sfx('pop');
    S.heroDirt(100); h.skinK = 1; h.skinDirty = 40;
    S.say(999, pick(L.fallHero), 'hero');
    await IW3.tween(900, (t) => { h.sq = 0.12 * Math.sin(t * Math.PI * 7) * (1 - t * 0.5); });
    h.sq = 0;
    B.fx.ring(p, 0xffffff, 1.8, 420); B.fx.muzzle(S.posOf(999, 0.9), 0xb8e0ff, 1.3); if (IW3.sfx) IW3.sfx('swell');
    await S.heroForm('slime');
    S.setMode(999, 'kneel'); await IW3.wait(250);
    await IW3.tween(500, (t) => { h.sq = -0.18 * Math.sin(t * Math.PI) ; }); h.sq = 0; // ぷるんと立ち上がる
    S.setMode(999, 'cheer');
    S.say(999, pick(L.joined), 'ink');
    hud && hud.banner('ヒーローが、スライムになった！', 'インク団の仲間入り', 'ink');
    near.forEach((m, i) => { S.setMode(m.id, 'cheer'); if (i < 3) setTimeout(() => S.say(m.id, L.welcome[i % L.welcome.length], 'ink'), (300 + i * 350) * IW3.speed); });
    await IW3.wait(2200);
  }
  IW3.play = async function (S, B, G, ev, hud) {
    const INK = IW3.INK;
    const C = chunks(ev);
    // Ink81：インク漏れから2ターンたって、ひとりでにはじけたとき、理由を出す（戦闘員の番に、急にはじけるように見えたため）
    { const nt = ev.filter(e => e.k === 'burst' && e.why === 'time').length, nc = ev.filter(e => e.k === 'burst' && e.why === 'chain').length;
      if (nt && hud && hud.toast) hud.toast('⏱ インク漏れから2ターンたった子が、ひとりでにはじけた' + (nc ? '（まわりの' + nc + '人も連鎖）' : '') + '。ヒーローの攻撃の「1回で〇人」には数えない'); }
    let pending = [];
    const flush = async () => { await Promise.all(pending); pending = []; };
    S.playing = (S.playing || 0) + 1; try {
    for (const c of C) {
      const heavy = c.list.some(e => e.k === 'fire' || e.k === 'leak' || e.k === 'sit' || e.k === 'burst' || e.k === 'ink' || e.k === 'herolv' || e.k === 'end' || e.k === 'turn' || e.k === 'throw' || e.k === 'leave' || e.k === 'hatk');
      const run = playChunk(S, B, G, c, hud, INK);
      if (heavy) { await flush(); await run; }
      else { pending.push(run); await IW3.wait((G.side === 'hero' ? 200 : 170) * (IW3.tempo === 'quick' ? 0.4 : 1)); if (pending.length > (IW3.tempo === 'quick' ? 8 : 4)) await flush(); }
    }
    await flush();
    } finally { S.playing = Math.max(0, (S.playing || 1) - 1); }
    S.sync(G);
  };
  async function playChunk(S, B, G, c, hud, INK) {
    const list = c.list; let combo = 0; const bg = []; let wave = null; // wave：ボーナスの破裂の波（はじまった子の場所） // combo：連鎖の数（この出来事のかたまりの中で）／bg：同時に進める反応
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      switch (e.k) {
        case 'turn':
          if (e.side === 'solo') { hud && hud.banner('ラウンド ' + e.n, '残り ' + e.left + '人・くじ引きの順に、1人ずつ'); await IW3.wait(650); break; }
          hud && hud.banner(e.side === 'hero' ? 'ヒーローの番' : e.side === 'red' || e.side === 'white' ? 'ラウンド ' + e.n : '戦闘員の番', e.side === 'red' || e.side === 'white' ? (e.side === 'red' ? '赤組' : '白組') + 'から、1人ずつ交互に' : 'ターン ' + e.n);
          if (G.poles && chance(0.7)) { const st = [...S.views.values()].filter(w => w.stuck && !w.gone); if (st.length) S.say(st[Math.floor(Math.random() * st.length)].id, pick(chance(0.5) ? L.poleHold : L.poleEndure), 'red', 2200); } // 鉄柱につながった子が、耐えている
          if (e.side === 'ink' && G.hero) { const n = IW3.count(G); if (n <= 3 && n > 0) S.say(IW3.anyMinion(G), pick(L.lastOnes)); else if (n <= 15 && chance(0.6)) S.say(IW3.anyMinion(G), pick(L.fewer)); }
          await IW3.wait(650); break;
        case 'move':
          if (B.CAM && !B.CAM.lock && e.id === 999) B.lookAt(e.path[e.path.length - 1].x - B.half, e.path[e.path.length - 1].y - B.half);
          await S.walk(e.id, e.path); break;
        case 'fire': {
          const v = S.views.get(e.id); if (!v) break;
          if (e.self) { S.say(e.to[0], pick(L.down), 'red'); await IW3.wait(300); }
          if (e.exit === 'valve') {
            S.say(e.id, pick(L.jump), 'ink', 1000); S.setMode(e.id, 'cannonW'); await IW3.wait(500); // しゃがんで、ためて
            await S.jumpShot(e.id, e.dir, S.inkOf(e.id));
          } else {
            // その弾がどうなるかを、あとの出来事から見る（それる・かわされる・盾にされる・仲間に当たる）
            const tid = e.to[0]; let miss = false, stray = 0, graze = 0, dodge = null, shield = null;
            for (let j = i + 1; j < list.length && list[j].k !== 'fire'; j++) {
              const k = list[j].k;
              if (k === 'stray') { stray = list[j].id; break; } if (k === 'graze') { graze = list[j].id; break; }
              if (k === 'shield') { shield = list[j]; break; }
              if (k === 'dodge' && !list[j].done) dodge = list[j];
              if (k === 'wide' || k === 'miss' || k === 'dodge') { miss = k === 'wide' || k === 'miss'; if (k === 'miss') break; }
            }
            // ① ねらう
            await S.aim(e.id, tid, e.exit, pick((S.views.get(tid) || {}).kind === 'barrel' ? L.aimBarrel : L.aim));
            // （ヒーローが、隣の子を盾にする）
            if (shield) { shield.done = true; await S.shieldGrab(shield.by, e.id, pick(L.shieldHero), pick(L.shield)); }
            // ② 「いくよー！」で撃つ
            S.say(e.id, pick(e.exit === 'cannon' && chance(0.5) ? L.goCannon : L.go), 'ink', 900);
            await IW3.wait(160);
            if (dodge) { dodge.done = true; setTimeout(() => S.dodge(999, e.id), 120 * IW3.speed); } // 弾が来るのに合わせて、よける
            if (shield) await S.shoot(e.id, shield.by, e.exit, S.inkOf(e.id), false, { noWind: true });
            else if (stray || graze) { S.face(e.id, S.views.get(tid).gx, S.views.get(tid).gy); await S.shoot(e.id, stray || graze, e.exit, S.inkOf(e.id), !!graze, { noWind: true }); }
            else await S.shoot(e.id, tid, e.exit, S.inkOf(e.id), miss, { noWind: true });
            if (e.to[1]) { await S.aim(e.id, e.to[1], e.exit, null); await S.shoot(e.id, e.to[1], e.exit, S.inkOf(e.id), false, { noWind: true }); }
            await IW3.wait(150);
          }
          break;
        }
        case 'wide': if (chance(0.35)) S.say(e.from, pick(L.wide)); break;
        case 'dodge': if (!e.done) await S.dodge(999, e.from); break;
        case 'stray': { const v = S.views.get(e.id); if (v) v.ohLine = pick(L.stray); setTimeout(() => S.say(e.from, pick(L.blame), 'red', 1200), 900 * IW3.speed); break; }
        case 'graze': S.say(e.id, pick(L.graze), 'ink'); break;
        case 'shield': if (e.done) break; S.say(e.by, pick(L.shield), 'ink'); { const v = S.views.get(e.by), h = S.views.get(999); if (v && h) { const ox = v.gx, oy = v.gy; await IW3.tween(180, t => { v.gx = ox + (h.gx - ox) * 0.3 * Math.sin(t * Math.PI); v.gy = oy + (h.gy - oy) * 0.3 * Math.sin(t * Math.PI); }); } } break;
        case 'ink':
          hud && hud.ink(e.total, e.n);
          S.heroDirt(e.total);
          if (e.n >= 4) B.fx.splash(S.posOf(999, 0), INK.ink, 16, 0.9);
          else B.fx.splash(S.posOf(999, 0), INK.ink, 4, 0.5);
          if (e.why === 'barrel') { S.hurt(999); S.say(999, pick(L.barrelHero), 'hero', 1100); }
          if (e.why === 'puddle') { S.hurt(999); if (chance(0.6)) S.say(999, pick(['足もとが、インクで……！', 'だまりに、入っちゃった……！']), 'hero', 1000); }
          if (e.why === 'hit' || e.why === 'splash') { S.hurt(999); if (chance(0.3)) S.say(999, pick(L.heroOuch), 'hero', 900); }
          if (e.n >= 4) { const h = S.views.get(999); if (h && B.punch) B.punch(h.gx - B.half, h.gy - B.half, 0.8, 700); if (B.shake) B.shake(0.05); await IW3.wait(140); }
          if (e.why === 'hit' && chance(0.2)) S.say(IW3.anyMinion(G, true), pick(L.hitHero), 'ink');
          if (IW3.sfx) IW3.sfx('splat');
          break;
        case 'herolv': {
          const h = S.views.get(999);
          if (h && B.punch) B.punch(h.gx - B.half, h.gy - B.half, 0.6, 1600);
          if (e.lv >= 4) { await heroFall(S, B, G, hud, INK); break; }
          S.say(999, L.heroLv[e.lv], 'hero');
          hud && hud.banner(e.lv === 1 ? 'スーツ不調！ ヒーローが撤退を始めた' : e.lv === 2 ? 'スーツ機能停止！' : '変身解除！', 'よごれ ' + G.hero.ink, 'ink');
          const p = S.posOf(999, 0);
          B.fx.ring(p, INK.ink, 1.6, 420); B.fx.splash(p, INK.ink, 14, 0.8); if (B.shake) B.shake(0.06);
          const form = e.lv >= 3 ? 'civil' : e.lv >= 2 ? 'broken' : null;
          if (form) { // 姿が変わる：光の輪 → ぱっと変わる
            S.setMode(999, 'hurt'); await IW3.wait(380);
            B.fx.ring(p, 0xffffff, 1.2, 300); B.fx.muzzle(S.posOf(999, 0.9), 0xffffff, 0.9); if (IW3.sfx) IW3.sfx('swell');
            await S.heroForm(form); S.setMode(999, 'idle');
          }
          await IW3.wait(800);
          S.say(IW3.anyMinion(G), pick(e.lv === 1 ? L.retreat : L.weak), 'ink');
          break;
        }
        case 'leak': { // やられた：え！？ → うわあ！ → インク漏れ（爆発寸前）
          const v = S.views.get(e.id), oh = v && v.ohLine; if (v) v.ohLine = null;
          await S.react(e.id, 'leak', e.part, oh); break;
        }
        case 'miss': break;
        case 'airSafe': S.say(e.id, pick(L.airSafe), 'ink', 1200); await IW3.wait(250); break;
        case 'face': S.faceDir(e.id, e.dir); break;
        case 'sit': await S.sitDown(e.id, pick(L.sitNow)); break;
        case 'chain': { // 仲間の飛沫をかぶって、ふくらんで（ため）、はじける
          if (G.opt && G.opt.stageBonus) { combo++; if (combo === 1) hud && hud.banner('大連鎖！', '', 'ink'); if (combo % 6 === 0) S.sfxText(() => S.posOf(e.id, 1.6), (combo + 1) + '連鎖！', 900); break; } // ボーナス：連鎖は、まとめて波のように
          if (bg.length) { await Promise.all(bg); bg.length = 0; }
          combo++;
          if (combo === 1 && chance(0.5)) S.say(e.from, pick(L.chain));
          if (IW3.tempo === 'quick' && combo >= 2) { // テンポ重視：連鎖の最初の1回は、じっくりと同じ（気づく・名前を呼ぶ）。2回目からは短く、数を大きく見せる
            const big = combo === 3 || combo === 5 || combo >= 7 && combo % 2 === 1;
            if (big) hud && hud.banner(combo + '連鎖！', combo >= 7 ? 'すごい！' : '', 'ink');
            await S.charge(e.id, e.from, combo, combo >= 4 && chance(0.4) ? pick(L.swell) : null, null, big);
            break;
          }
          await S.charge(e.id, e.from, combo, chance(0.6) ? pick(L.swell) : null, call(L.callBack, nm(S, e.from)));
          break;
        }
        case 'burst': {
          if (e.why === 'poleBurst') break; // 鉄柱の大連鎖は、'poleBurst' の台本で見せる
          const v = S.views.get(e.id); let oh = v && v.ohLine; if (v) v.ohLine = null;
          if (e.why === 'bossEnd') oh = pick(v && v.u && v.u.chief ? L.chiefEnd : L.bossEnd);
          if (G.opt && G.opt.stageBonus) { // ボーナス：破裂は、はじまった子から1マスずつ外へ。セリフは「言い終わってから」次の子が言う／次の列がはじける（時間では決めない）
            //   まだ無事な子は、だまって留め具の中でじたばた。悲鳴は1列ごとに1〜3人、言い終わってから次へ。波が来た列では1人が「きたぁーっ！」
            if (e.done) break;
            const v0 = S.views.get(e.id); if (!v0) break;
            const grp = list.slice(i).filter(x => x.k === 'burst' && S.views.get(x.id)); grp.forEach(x => { x.done = true; });
            const rest = grp.slice(1).map(x => ({ e: x, v: S.views.get(x.id) })), now = performance.now(), rg = (w) => Math.max(Math.abs(w.gx - v0.gx), Math.abs(w.gy - v0.gy));
            for (const o of rest) { o.r = rg(o.v); o.v.mode = 'shock'; o.v.mt = now; o.v.mute = true; }
            v0.mute = true;
            const maxR = Math.max(0, ...rest.map(o => o.r)), lines = L.bonusDread.slice().sort(() => Math.random() - 0.5); let li = 0; const used = new Set();
            const boom = (o, hold) => { o.v.waveHit = true; return S.react(o.e.id, 'quick', null, null, { part: o.e.part, flailMs: 900, hold, scatter: 1600 }); };
            // 台本：列がふくらんでじたばたしている最中に、次の列（より外）の子が悲鳴。言い終わったら、その列がばらばらにはじけて、次の列がふくらむ
            bg.push((async () => {
              const rows = []; for (let r = 1; r <= maxR; r++) rows[r] = rest.filter(o => o.r === r);
              const speak = async (r) => { // r 列目がふくらんでいる最中の悲鳴（1・2・2…・最後の手前は3人）
                const n = r === maxR - 1 ? 3 : r === 0 ? 1 : 2;
                for (let k = 0; k < n; k++) {
                  const c = rest.filter(o => o.r > r && !used.has(o.e.id) && !o.v.gone).sort((a, b) => a.r - b.r || Math.random() - 0.5)[0]; if (!c) break;
                  used.add(c.e.id); await S.sayWait(c.e.id, lines[li++ % lines.length], 'red'); await IW3.wait(250);
                }
              };
              const caught = async (row) => { // いちばん外の列：その列の子が、ふくらみながら「きたぁーっ！」（2人、1人ずつ）
                const T = row.slice().sort(() => Math.random() - 0.5).slice(0, 2);
                for (const o of T) { await S.sayWait(o.e.id, pick(L.bonusCaught), 'pop'); await IW3.wait(200); }
              };
              await S.sayWait(v0.id, pick(L.oh), 'ink');
              let cur = [{ e, v: v0 }]; const hits = [];
              for (let r = 0; r <= maxR; r++) {
                if (!cur.length) { cur = rows[r + 1] || []; continue; }
                const hold = r < maxR ? speak(r) : caught(cur);
                for (const o of cur) hits.push(boom(o, hold));
                await hold; await IW3.wait(700); // 言い終わった → その列がばらばらにはじけはじめる → 少しして次の列
                cur = rows[r + 1] || [];
              }
              await Promise.all(hits);
            })());
            hud && hud.count(IW3.liveViews(S)); break;
          }
          if (e.why === 'chain') { const q = IW3.tempo === 'quick' && combo >= 2; /* テンポ重視の2回目から：部品のパァン！と「にげてー！」をはぶいて、すぐはじける */ if (!q) await S.burstParts(e.id, null, true); const nx = nextChain(list, i, e.id); if (!q) S.say(e.id, nx ? call(L.callWarn, nm(S, nx)) : pick(L.burst), 'pop', 1000); await S.pop(e.id, S.inkOf(e.id), combo); }
          else if (e.why === 'time') await S.react(e.id, 'time');
          else if (e.why === 'self') { await S.burstParts(e.id, null, true); S.say(e.id, pick(L.burst), 'pop', 900); await S.pop(e.id, S.inkOf(e.id), 1); }
          else if (QUICK.has(e.why)) { // まとめてやられるときは、少しずつずらして同時に。近くの子どうしで、名前を呼び合う
            if (!e.pair) { // このかたまりの中の、同じ攻撃でまとめてはじける子を集めて、近い子と組にする
              const grp = list.slice(i).filter(x => x.k === 'burst' && QUICK.has(x.why) && !x.pair && S.views.get(x.id));
              const pos = (x) => S.views.get(x.id);
              for (const a of grp) { if (a.pair) continue; let best = null, bd = 9; for (const b of grp) { if (b === a || b.pair) continue; const d = Math.hypot(pos(a).gx - pos(b).gx, pos(a).gy - pos(b).gy); if (d < bd) { bd = d; best = b; } } if (best && bd <= 3) { a.pair = best.id; best.pair = a.id; } else { let nb = null, nd = 9; for (const b of grp) { if (b === a) continue; const d = Math.hypot(pos(a).gx - pos(b).gx, pos(a).gy - pos(b).gy); if (d < nd) { nd = d; nb = b; } } a.pair = nb && nd <= 3 ? nb.id : -1; } } // 余った子は、いちばん近い子を呼ぶ
            }
            const opt = e.pair > 0 ? { faceTo: e.pair, burstLine: call(L.callBurst, nm(S, e.pair)), part: e.part } : { part: e.part };
            const oh2 = e.pair > 0 ? call(L.callOh, nm(S, e.pair)) : oh;
            bg.push(IW3.wait(bg.length * 110).then(() => S.react(e.id, 'quick', null, oh2, opt)));
          }
          else { const nx = nextChain(list, i, e.id); await S.react(e.id, 'burst', null, oh, nx ? { burstLine: call(L.callWarn, nm(S, nx)), faceTo: nx, part: e.part } : { part: e.part }); }
          hud && hud.count(IW3.liveViews(S));
          break;
        }
        case 'barrel': { // インクタンクの大爆発（まわりの子は、あとの burst・leak の出来事で反応する）
          if (bg.length) { await Promise.all(bg); bg.length = 0; }
          const v = S.views.get(e.id); if (!v || v.gone) break;
          const near = [...S.views.values()].filter(w => w.kind === 'minion' && !w.gone && w.root.parent && Math.max(Math.abs(w.gx - v.gx), Math.abs(w.gy - v.gy)) <= 2);
          if (near.length) { S.say(near[Math.floor(Math.random() * near.length)].id, pick(e.from ? L.barrelChain : L.barrelOh), 'red', 1200); for (const w of near) { w.mode = 'shock'; w.mt = performance.now(); S.face(w.id, v.gx, v.gy); } }
          if (!e.from) hud && hud.banner('インクタンク、大爆発！', '', 'ink'); else { combo++; if (combo >= 2) hud && hud.banner('タンク誘爆！', '', 'ink'); }
          await S.barrelBlow(e.id, !!e.from);
          for (const w of near) if (!w.gone && w.mode === 'shock') w.mode = w.u && w.u.sit ? 'sit' : w.u && w.u.state === 'leak' ? 'leak' : 'idle';
          break;
        }
        case 'bossHit': {
          if (bg.length) { await Promise.all(bg); bg.length = 0; }
          { const cu = G.units.find(x => x.id === e.id), ch = cu && cu.chief; await S.bossHit(e.id, e.hp, e.hp0, pick(e.hp > (e.hp0 || 4) / 2 ? (ch ? L.chiefHitHi : L.bossHitHi) : (ch ? L.chiefHitLo : L.bossHitLo))); }
          break;
        }
        case 'guard': { // 第9層：首領は、部下が守っていて効かない（1回の攻撃で1回だけ見せる）
          if (e.done) break; for (let j = i + 1; j < list.length; j++) if (list[j].k === 'guard') list[j].done = true;
          if (bg.length) { await Promise.all(bg); bg.length = 0; }
          await S.guardFx(e.id);
          await S.sayWait(e.id, pick(L.chiefGuard), 'red');
          const mates = [...S.views.values()].filter(w => !w.gone && w.u && w.u.kind === 'minion' && !w.u.chief && w.root.parent);
          if (mates.length) await S.sayWait(mates[Math.floor(Math.random() * mates.length)].id, pick(L.guardMinion), 'ink');
          break;
        }
        case 'awaken': { // 第9層：部下がみんなはじけて、ひとりぼっち → 想いの力で覚醒
          if (bg.length) { await Promise.all(bg); bg.length = 0; }
          hud && hud.banner('首領が、覚醒した！', 'みんなの想いを受けとって…… 体力' + e.hp, 'ink');
          await S.awakenFx(e.id);
          await S.sayWait(e.id, pick(L.chiefAwake), 'pop');
          break;
        }
        case 'storm': { // 第9層：覚醒した首領のインクの雨（柱のかげなら当たらない）
          if (bg.length) { await Promise.all(bg); bg.length = 0; }
          S.say(e.id, pick(L.chiefStorm), 'pop', 1400);
          await S.stormFx(e.id, e.safe);
          S.say(999, pick(e.safe ? L.stormSafe : L.stormHit), 'hero', 1300);
          await IW3.wait(500);
          break;
        }
        case 'push': await S.slide(e.id, e.x, e.y, 160); break;
        case 'reflect': await S.reflectFx(e.id, pick(L.reflectExec)); if (chance(0.6)) S.say(999, pick(L.reflectHero), 'hero', 1100); break; // 第7層：はね返しの盾
        case 'pole': { // 特別ステージ：鉄柱へ放り投げる（となりの子を全員まとめて。何人も同時に宙を舞い、次々に柱へ落ちる）
          if (e.done) break;
          const grp = [e]; for (let j = i + 1; j < list.length && list[j].k === 'pole'; j++) { grp.push(list[j]); list[j].done = true; }
          const talkers = new Set(grp.slice().sort(() => Math.random() - 0.5).slice(0, 2).map(x => x.id)); // 落ちたときにしゃべるのは2人まで（声がまざらないように）
          if (grp.length >= 3) hud && hud.banner(grp.length + '人まとめて！', '', 'ink');
          await Promise.all(grp.map((x, n) => IW3.wait(n * 260).then(() => S.poleThrow(x.id, { pole: x.pole, px: x.px, py: x.py, idx: x.idx, face: x.face, ang: x.ang }, n < 2 ? pick(L.poleGrab) : null, talkers.has(x.id) ? pick(L.poleStuck) : null))));
          const top = grp[grp.length - 1];
          if (top.idx >= 5 && !list.slice(i + 1).some(x => x.k === 'poleBurst')) { const same = [...S.views.values()].filter(w => w.stuck && !w.gone && w.stuck.pole === top.pole && !grp.some(g => g.id === w.id)); if (same.length) S.say(same[Math.floor(Math.random() * same.length)].id, pick(L.poleHold), 'red', 2200); } // 重なるほど、がまん
          else if (top.idx > grp.length - 1) { const below = [...S.views.values()].filter(w => w.stuck && w.stuck.pole === top.pole && w.stuck.idx === grp[0].idx - 1)[0]; if (below) S.say(below.id, pick(L.poleCrush), 'red', 1300); }
          hud && hud.count(IW3.liveViews(S)); break;
        }
        case 'poleLink': { // 柱の連鎖：はじけた柱のインクが、同じ列の柱へ飛ぶ
          const a = B.tile(e.fx, e.fy), b = B.tile(e.tx, e.ty); a.y = 2.2; b.y = 2.2;
          if (IW3.sfx) IW3.sfx('jump');
          await Promise.all([0, 1, 2].map(k => IW3.wait(k * 90).then(() => B.fx.shot(a.clone(), b.clone().add(new (W.RING3D.THREE.Vector3)((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.4)), S.inkOf(0), 650, 1.6, 1.6))));
          B.fx.splash(b, IW3.INK.ink, 14, 0.8);
          hud && hud.banner(e.chain + '連鎖！', '鉄柱から鉄柱へ', 'ink'); if (B.shake) B.shake(0.08);
          break;
        }
        case 'poleBurst': { // 耐久の限界：だれか1人が「ごめん！」→ そこから上下へ、柱の子たちが順番にはじける（セリフは言い終わってから次へ）
          if (bg.length) { await Promise.all(bg); bg.length = 0; }
          const now = performance.now(), V = e.order.map(id => S.views.get(id)).filter(v => v && !v.gone), at = (id) => e.idx.indexOf(id), k0 = at(e.start);
          for (const v of V) { v.mute = true; v.mode = 'shock'; v.mt = now; }
          if (e.chain > 1) { // 連鎖した柱：1〜2人が言い終わってから、一気に（下から順に、少しずつずれて）
            const sp = V.slice().sort(() => Math.random() - 0.5);
            await S.sayWait(sp[0].id, pick(L.poleChainHit), 'pop'); if (sp[1]) await S.sayWait(sp[1].id, pick(L.poleWave), 'red');
            await Promise.all(V.map(v => IW3.wait(at(v.id) * 140).then(() => S.react(v.id, 'quick', null, null, { flailMs: 600 }))));
            hud && hud.count(IW3.liveViews(S)); break;
          }
          hud && hud.banner('限界！', '鉄柱の子たちが……', 'ink');
          await S.sayWait(e.start, pick(L.poleSorry), 'pop');
          const groups = []; for (const v of V) { const r = Math.abs(at(v.id) - k0); (groups[r] = groups[r] || []).push(v); }
          const hits = [], wl = L.poleWave.slice().sort(() => Math.random() - 0.5); let wi = 0;
          for (let r = 0; r < groups.length; r++) {
            const cur = groups[r] || []; if (!cur.length) continue;
            const nxt = (groups[r + 1] || [])[0];
            const hold = nxt ? S.sayWait(nxt.id, wl[wi++ % wl.length], 'red') : IW3.wait(600);
            for (const v of cur) hits.push(S.react(v.id, 'quick', null, null, { flailMs: 700, hold, scatter: 700 }));
            await hold; await IW3.wait(350);
          }
          await Promise.all(hits);
          hud && hud.banner(e.order.length + '人、いっぺんに！', list.slice(i + 1).some(x => x.k === 'poleLink') ? 'インクが、となりの柱へ……！' : '鉄柱の大連鎖', 'ink'); hud && hud.count(IW3.liveViews(S));
          break;
        }
        case 'warp': { await S.warpFx(e.id, e.x, e.y); if (e.id === 999) S.say(999, pick(['……ワープした！', 'ここに出るのか']), 'hero', 900); else if (chance(0.4)) S.say(e.id, pick(['ワープで、とうちゃく〜！', 'しゅんっ！ 来たよ〜！']), 'ink', 900); break; } // 第8層：ワープ床
        case 'heal': { const u = G.units.find(x => x.id === e.id); await S.healFx(e.id, e.to, pick(u && u.healer ? L.execHeal : L.medicHeal), pick(L.healed)); break; } // 第6層：救護係・幹部が治す
        case 'puddle': S.addPuddle && S.addPuddle(e.x, e.y); break; // 第5層：インクだまりができる
        case 'belt': { // ベルトコンベア：上にいる子・ヒーロー・タンクが、いっしょに1マス運ばれる
          if (IW3.sfx) IW3.sfx('gasha');
          if (e.moves.some(m => m.id === 999)) S.say(999, pick(['足もとが、動く……！', 'コンベアに、運ばれる……！']), 'hero', 1000);
          else if (chance(0.3)) { const m = e.moves.find(m => (S.views.get(m.id) || {}).kind === 'minion'); if (m) S.say(m.id, pick(['はこばれる〜', 'ごとごと〜', 'ラインは止まらないよ〜']), 'ink', 900); }
          await Promise.all(e.moves.map(m => S.slide(m.id, m.x, m.y, 520)));
          break;
        }
        case 'refill': if (chance(0.15)) S.say(e.id, pick(L.refill)); break;
        case 'selfburst': S.say(e.id, pick(L.self), 'red'); break;
        case 'sticky': {
          const v = S.views.get(e.id); if (v) { S.say(e.id, pick(L.sticky), 'sticky'); await S.shoot(e.id, 999, 'hose', INK.sticky, false); }
          B.fx.flashAt(S.posOf(999, 1), INK.sticky); S.say(999, pick(L.heroSticky), 'hero'); break;
        }
        case 'hatk': await heroAnim(S, B, G, e, INK); break;
        case 'wave': B.fx.ring(S.posOf(e.id, 0), 0x9fe3ff, 1.2, 260); break;
        case 'throw': {
          S.say(999, pick(L.heroThrow), 'hero'); S.say(e.who, pick(L.thrown), 'ink');
          const h = S.views.get(999), v = S.views.get(e.who);
          if (h && v) { S.face(999, v.gx, v.gy); S.setMode(999, 'slash'); await S.slide(e.who, e.x, e.y, 520, 1.6); S.say(e.at, pick(L.bump), 'ink'); B.fx.flashAt(S.posOf(e.at, 0.8), 0xffffff); }
          S.setMode(999, 'idle'); break;
        }
        case 'spawn': { const u = G.units.find(x => x.id === e.id); if (u) await S.spawn(u); break; }
        case 'leave': {
          const h = S.views.get(999); S.say(999, 'くっ……ここは引く！', 'hero');
          if (h) { h.mode = 'fly'; await IW3.tween(900, t => { h.root.position.y = h.rig.hip + t * t * 12; }); S.remove(999); }
          break;
        }
        case 'end': break;
      }
    }
    await Promise.all(bg);
    if (G.opt && G.opt.stageBonus && combo >= 2) { hud && hud.banner((combo + 1) + '連鎖！', '固定砲台部隊、ぜんぶはじけた！', 'ink'); hud && hud.count(IW3.liveViews(S)); await IW3.wait(900); }
  }
  // この子がはじけたあと、すぐ連鎖で巻き込まれる子（いれば、その子の名前を呼ぶ）
  function nextChain(list, i, id) { for (let j = i + 1; j < list.length; j++) { const x = list[j]; if (x.k === 'chain' && x.from === id) return x.id; if (x.k === 'fire' || x.k === 'hatk') break; } return 0; }
  async function heroAnim(S, B, G, e, INK) {
    { const hv = S.views.get(999); if (hv && B.punch && (e.w === 'sweep' || e.w === 'comet' || e.w === 'lbreak' || e.w === 'homing')) B.punch(hv.gx - B.half, hv.gy - B.half, 0.7, 1500); }
    const h = S.views.get(999); if (!h) return;
    if (B.CAM && !B.CAM.lock) B.lookAt(h.gx - B.half, h.gy - B.half);
    const lines = L.heroAtk[e.w]; if (lines) S.say(999, pick(lines), 'hero');
    const tv = e.to ? S.views.get(e.to) : null;
    if (tv) S.face(999, tv.gx, tv.gy);
    if (e.dir != null && !tv) S.faceDir(999, e.dir);
    if (IW3.sfx) IW3.sfx(e.w);
    if (e.w === 'blade') { await IW3.wait(120); S.setMode(999, 'slash'); await IW3.wait(240); if (tv) B.fx.ring(S.posOf(e.to, 0), 0x9fe3ff, 0.9, 220); await IW3.wait(120); S.setMode(999, 'idle'); return; }
    if (e.w === 'laser' && tv && e.bend && e.bend.length > 2) { // 第7層：鏡で曲がるレーザー（曲がる所ごとに光の線をつなぐ）
      S.setMode(999, 'aimL'); await IW3.wait(220);
      const hy = e.hgt === 'high' ? 1.15 : e.hgt === 'low' ? 0.84 : 1.01, P = e.bend.map(c => { const q = B.tile(c.x, c.y); q.y = hy; return q; });
      for (let k = 0; k < P.length - 1; k++) { if (e.bend[k].warp) { B.fx.ring(P[k], 0x5ae0ff, 0.8, 260); B.fx.ring(P[k + 1], 0x5ae0ff, 0.8, 260); await IW3.wait(60); continue; } /* ワープ床：光が消えて、もう一方から出る */ B.fx.beam(P[k], P[k + 1], 0x7ff0ff, 380, 0.06); if (k > 0) B.fx.flashAt(P[k], 0xffffff); await IW3.wait(70); }
      await IW3.wait(320); S.setMode(999, 'idle'); return;
    }
    if (e.w === 'laser' && tv) {
      S.setMode(999, 'aimL'); await IW3.wait(220);
      const a = h.root.position.clone(); a.y = 1.15;
      const hy = e.hgt === 'high' ? 1.15 : e.hgt === 'low' ? 0.84 : e.hgt === 'valve' ? 1.1 : 1.01; // キャノン（わきの下）・ベリータンク（お腹）・ホース（腰）の高さ
      let b = tv.root.position.clone(); b.y = hy;
      if (Math.round(h.gx) === Math.round(tv.gx) || Math.round(h.gy) === Math.round(tv.gy)) { const d = b.clone().sub(a); d.y = 0; d.normalize(); const len = wallStop(G, h, IW.sgn(Math.round(tv.gx) - Math.round(h.gx)), IW.sgn(Math.round(tv.gy) - Math.round(h.gy)), IW.heroStats(G.hero).laser); b = a.clone().addScaledVector(d, len); b.y = hy; } // 一直線：とどく所まで（柱があれば、柱の手前で止まる）
      a.y = hy;
      await B.fx.beam(a, b, 0x7ff0ff, 380, 0.06); S.setMode(999, 'idle'); return;
    }
    if (e.w === 'sweep') { S.setMode(999, 'spin'); const y0 = h.yawT; await Promise.all([IW3.tween(420, t => { h.yawT = y0 + t * Math.PI * 2; h.yaw = h.yawT; }), B.fx.ring(S.posOf(999, 0), 0x9fe3ff, 1.8, 420)]); S.setMode(999, 'idle'); return; }
    if (e.w === 'comet') {
      const D = IW.DIRS[e.dir], a = S.posOf(999, 1), b = a.clone(), len = wallStop(G, h, D[0], D[1], 10); b.x += D[0] * len; b.z += D[1] * len;
      S.setMode(999, 'aimL'); await IW3.wait(200); await B.fx.comet(a, b, 600); S.setMode(999, 'idle'); return;
    }
    if (e.w === 'lbreak') { S.setMode(999, 'cheer'); await Promise.all([B.fx.ring(S.posOf(999, 0), 0x7ff0ff, 6, 600), B.fx.ring(S.posOf(999, 0), 0xffffff, 4, 450)]); S.setMode(999, 'idle'); return; }
    if (e.w === 'homing') {
      S.setMode(999, 'cheer'); const a = S.posOf(999, 2.5);
      const T = IW.minions(G).slice(0, 4);
      await Promise.all(T.map((u, i) => { const b = S.posOf(u.id, 1.1); return b ? IW3.wait(i * 90).then(() => B.fx.shot(a, b, 0xff9a3a, 520, 3)) : null; }));
      S.setMode(999, 'idle'); return;
    }
  }
  // まっすぐ進んで、柱に当たるまでの長さ（柱がなければ max）
  function wallStop(G, h, dx, dy, max) { const x0 = Math.round(h.gx), y0 = Math.round(h.gy); for (let i = 1; i <= max; i++) if (IW.isWall && IW.isWall(G, x0 + dx * i, y0 + dy * i)) return i - 0.45; return max; }
  IW3.count = (G) => IW.minions(G).length;
  IW3.liveViews = (S) => { let n = 0; for (const v of S.views.values()) if (v.kind === 'minion' && !v.gone && !v.stuck && !(v.u && v.u.stuck)) n++; return n; };
  IW3.anyMinion = (G, near) => { const M = IW.minions(G); if (!M.length) return 0; if (near && G.hero) M.sort((a, b) => IW.dist(a, G.hero) - IW.dist(b, G.hero)); return (near ? M[Math.floor(Math.random() * Math.min(4, M.length))] : M[Math.floor(Math.random() * M.length)]).id; };
})(typeof window !== 'undefined' ? window : globalThis);

/* ---- src/ui/scene.js ---- */
// ---- インク戦闘員ウォーズ：おはなしの場面（オープニング・再生の部屋・エンディング） ----
//   IW3.Story.play(id, opt)：IW.STORY[id] の場面を、画面いっぱいの3Dで見せる。見終わる（とばす）と resolve
//     opt.auto：自動で次へ進む（確認用）
//   セット：throne（首領の間）＋ gate（アジトの入口）・lab（再生の部屋。円柱のカプセルがびっしり）
//   1行ごとの「しかけ」（ACT）で、カメラを動かしたり、キャラを歩かせたり、カプセルを開けたりする
(function (W) {
  'use strict';
  const IW3 = W.IW3 = W.IW3 || {};
  const T = () => W.RING3D.THREE;
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  // この場面の中だけの時間（tween）
  function makeClock() {
    const L = [];
    return {
      tween(ms, fn) { return new Promise(ok => L.push({ t0: performance.now(), ms: Math.max(1, ms), fn, ok })); },
      wait(ms) { return this.tween(ms, () => { }); },
      tick(now) { for (let i = L.length - 1; i >= 0; i--) { const o = L[i], t = Math.min(1, (now - o.t0) / o.ms); try { o.fn(t); } catch (e) { console.error(e); } if (t >= 1) { L.splice(i, 1); o.ok(); } } },
      clear() { for (const o of L.splice(0)) o.ok(); },
    };
  }
  // 字を書いた板（カプセルの表示・部屋の画面）
  function textTex(TT, w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const tex = new TT.CanvasTexture(c); tex.colorSpace = TT.SRGBColorSpace;
    const redraw = (...a) => { g.clearRect(0, 0, w, h); draw(g, w, h, ...a); tex.needsUpdate = true; };
    return { tex, redraw };
  }
  // くもりガラスのもよう（ざらざら）
  function frostTex(TT) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
    const im = g.createImageData(64, 128);
    for (let i = 0; i < im.data.length; i += 4) { const v = 215 + Math.random() * 40; im.data[i] = v; im.data[i + 1] = v; im.data[i + 2] = Math.min(255, v + 12); im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0);
    const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0.35)'); gr.addColorStop(0.15, 'rgba(255,255,255,0)'); gr.addColorStop(0.85, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.35)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
    const t = new TT.CanvasTexture(c); t.wrapS = TT.RepeatWrapping; t.repeat.set(4, 1); t.colorSpace = TT.SRGBColorSpace; return t;
  }

  // ===== キャラ =====
  //   kind：hero・noir・minion。o：{ ti（型の番号）, bare（再生中の体：服の形なし・装備なし）, sc, x, z, foot, yaw }
  const minionFaces = () => {
    const MD = IW3.models(), U = IW3.usedTypes(MD), nf = U[U.length - 1];
    let L = U.length > 1 ? U.filter(i => i !== nf) : U; L = L.slice(0, 3);
    return L.map(i => Object.assign({}, MD.minions[i], { pal: MD.heroModeColor === 'type' ? MD.minions[i].pal : IW3.INK_PAL }));
  };
  async function mkActor(S, kind, o) {
    const TT = T(); o = o || {}; let a;
    if (kind === 'hero') { const h = await IW3.makeHero(false, true); a = { kind: 'hero', root: h.root, rig: h.rig, A: h.A, model: h.A && h.A.ext ? 'ext' : 'ゲームの体' }; }
    else {
      const face = kind === 'noir' ? IW3.noirFace() : S.faces[(o.ti || 0) % S.faces.length];
      const f2 = o.bare ? Object.assign({}, face, { bare: true }) : face;
      const base = await IW3.makeMinionBase('story', IW3.INK.ink, f2);
      const c = IW3.cloneMinion(base); a = Object.assign({ kind: 'minion' }, c);
      if (o.bare) for (const g of [c.tank, c.fill, c.pack, c.tube, c.hose].concat(c.cannons || [])) if (g) g.visible = false;
      if (kind === 'noir') { a.noir = true; a.crown = IW3.makeCrown(); S.scene.add(a.crown); }
    }
    a.id = ++S.nid; a.mode = o.mode || 'idle'; a.t0 = performance.now() - Math.random() * 3000; a.sc = o.sc || (kind === 'noir' ? 0.62 : 1); /* Ink90：首領はもっと小さく（子どもの背たけ） */
    a.x = o.x || 0; a.z = o.z || 0; a.foot = o.foot || 0; a.yaw = o.yaw || 0; a.lift = 0; a.wph = 0; a.sleep = !!o.sleep; a.voice = o.voice != null ? o.voice : a.id;
    S.scene.add(a.root); S.actors.push(a); return a;
  }
  function poseActor(a, now) {
    const TT = T(), t = (now - a.t0) / 1000, br = Math.sin(t * 2.2) * 0.02, m = a.mode, isH = a.kind === 'hero';
    const P = { C_Spine: [br, 0, 0], C_Neck: [br * 0.6, 0, 0] }; let drop = 0;
    if (isH && m !== 'walk') { P.R_UpperArm = [0, 0.5, -1.0]; P.R_LowerArm = [0, 0.6, 0]; P.legs = { L: { z: -0.12, f: 0.05 }, R: { z: 0.12, f: -0.05 } }; }
    if (m === 'walk') {
      const G = IW3.gait(a.wph, 1, a.wstep || 0.4); drop = G.drop; delete G.drop; Object.assign(P, G);
      if (isH) { G.R_UpperArm[2] = -1.15; P.R_LowerArm = [0, 0.8, 0]; }
    } else if (m === 'float' || m === 'fear') { // カプセルの中で、ふわっと浮かぶ（fear：目がさめて、あわてる）
      const f = t * 0.7 + a.id;
      P.C_Spine = [-0.04, 0, 0.03 * Math.sin(f * 0.6)]; P.C_Neck = [-0.22 + 0.04 * Math.sin(f), 0, 0.06 * Math.sin(f * 0.7)];
      P.L_UpperArm = [0.15, 0, 1.12 + 0.06 * Math.sin(f)]; P.R_UpperArm = [0.15, 0, -1.12 - 0.06 * Math.sin(f + 1)]; P.L_LowerArm = [0, -0.45, 0]; P.R_LowerArm = [0, 0.45, 0];
      P.legs = { L: { f: 0.05, z: -0.04, up: 0.03 }, R: { f: -0.03, z: 0.05, up: 0.01 } };
      if (m === 'fear') { const s = Math.sin(now * 0.03 + a.id); P.C_Neck = [0.1, 0.25 * s, 0]; P.C_Spine = [0.12, 0.1 * s, 0]; P.L_UpperArm = [0.5, 0, 1.0 + 0.1 * s]; P.R_UpperArm = [0.5, 0, -1.0 + 0.1 * s]; P.L_LowerArm = [0, -1.7, 0]; P.R_LowerArm = [0, 1.7, 0]; P.legs = { L: { f: 0.12, z: -0.1, up: 0.1 + 0.05 * s }, R: { f: -0.08, z: 0.1, up: 0.06 - 0.05 * s } }; }
    } else if (m === 'sit' || m === 'cry' || m === 'sitUp') { // ペタン座り（cry：うつむいて、かたをふるわせる）
      const tr = m === 'cry' ? Math.sin(now * 0.035 + a.id) * 0.06 : 0;
      P.L_UpperLeg = [1.5, -1.0, -0.2]; P.R_UpperLeg = [1.5, 1.0, 0.2]; P.L_LowerLeg = [-2.7, 0, 0]; P.R_LowerLeg = [-2.7, 0, 0]; P.L_Foot = [0.6, 0, 0]; P.R_Foot = [0.6, 0, 0];
      P.C_Spine = [(m === 'cry' ? -0.3 : -0.08) + br, tr, 0]; P.C_Neck = [m === 'cry' ? -0.5 : 0.1, 0, m === 'cry' ? 0 : 0.08 * Math.sin(t)];
      P.L_UpperArm = m === 'cry' ? [-0.9, 0, 0.9] : [0.6, 0, 1.2]; P.R_UpperArm = m === 'cry' ? [-0.9, 0, -0.9] : [0.6, 0, -1.2];
      P.L_LowerArm = m === 'cry' ? [0, -2.0, 0] : [0, -0.2, 0]; P.R_LowerArm = m === 'cry' ? [0, 2.0, 0] : [0, 0.2, 0]; drop = 0.8;
      delete P.legs;
    } else if (m === 'cheer') { const s = Math.abs(Math.sin(t * 7)); P.L_UpperArm = [0, 0, -1.1 - 0.2 * s]; P.R_UpperArm = [0, 0, 1.1 + 0.2 * s]; P.legs = { L: { z: -0.1, up: 0.04 * s, pitch: -0.3 * s }, R: { z: 0.1, up: 0.04 * s, pitch: -0.3 * s } }; drop = 0.04 * (1 - s) - s * 0.08; }
    else if (m === 'shock') { P.C_Spine = [0.25, 0, 0]; P.C_Neck = [0.25, 0, 0]; P.L_UpperArm = [0, 0, 0.6]; P.R_UpperArm = [0, 0, -0.6]; P.legs = { L: { f: 0.1, z: -0.12 }, R: { f: -0.06, z: 0.12 } }; drop = 0.04; }
    else if (m === 'hold') { P.L_UpperArm = [-0.9, 0, 1.0]; P.R_UpperArm = [-0.9, 0, -1.0]; P.L_LowerArm = [0, -0.9, 0]; P.R_LowerArm = [0, 0.9, 0]; } // 両手で、前に差し出す（おやつ）
    P.drop = drop; a.rig.pose(P);
    const bob = m === 'float' || m === 'fear' ? Math.sin(t * 0.9 + a.id) * 0.03 : 0;
    a.root.position.set(a.x, a.foot + a.rig.hip * a.sc + a.lift + bob - drop * a.sc, a.z); a.root.rotation.y = a.yaw; a.root.scale.setScalar(a.sc);
    IW3.faceTick(a, now);
    if (a.sleep && a.faceM) for (const mm of a.faceM) { const inf = mm.morphTargetInfluences; if (inf.length > 12) inf[12] = 1; }
    if (a.crown) { const hb = a.rig.bones.J_Bip_C_Head; if (hb) { a.root.updateMatrixWorld(true); hb.getWorldPosition(a.crown.position); a.crown.position.y += 0.19 * 1.25 * a.sc; } a.crown.rotation.y = a.yaw; a.crown.scale.setScalar(a.sc / 0.72 * 0.62); }
  }
  // 歩かせる（x,z へ。ms ミリ秒）
  async function walkTo(S, a, x, z, ms, step) {
    const x0 = a.x, z0 = a.z, d = Math.hypot(x - x0, z - z0); if (d < 0.01) return;
    a.yaw = Math.atan2(-(x - x0), -(z - z0)); a.mode = 'walk'; a.wstep = step || 0.4;
    await S.clk.tween(ms, (t) => { a.x = x0 + (x - x0) * t; a.z = z0 + (z - z0) * t; a.wph = (d * t) / (2 * a.wstep) * 1.6; });
    a.mode = 'idle';
  }
  const faceTo = (a, x, z) => { a.yaw = Math.atan2(-(x - a.x), -(z - a.z)); };
  const say = (a, e) => { a.expr = e; a.exprUntil = Infinity; };

  // ===== セット：再生の部屋（lab） =====
  //   通路は手前（z=+3）から奥（z=-40）へ。カプセルは通路の左右に何列も。手前の左右5本ずつは、本物の戦闘員が入ったカプセル（開けられる）
  const LAB = { dz: 1.25, near: 5, cols: [-1.55, 1.55, -2.85, 2.85, -4.15, 4.15], rows: 22, glassY0: 0.3, glassH: 2.25, foot: 0.42 };
  async function buildLab(S, ending) {
    const TT = T(), sc = S.scene;
    sc.background = new TT.Color(0x09060f); sc.fog = new TT.Fog(0x09060f, 6, 27);
    sc.add(new TT.HemisphereLight(0x9a88c8, 0x120a1c, 1.1));
    for (let k = 0; k < 3; k++) { const L = new TT.PointLight(0xb070ff, 16, 11, 1.5); L.position.set(0, 3.6, 0.5 - k * 7); sc.add(L); }
    const dl = new TT.DirectionalLight(0xd8d0ff, 0.8); dl.position.set(3, 8, 6); sc.add(dl);
    // 床・天井・通路のふちの光
    const floor = new TT.Mesh(new TT.PlaneGeometry(14, 60), new TT.MeshStandardMaterial({ color: 0x17131f, roughness: 0.55, metalness: 0.5 })); floor.rotation.x = -Math.PI / 2; floor.position.z = -18; sc.add(floor);
    const ceil = new TT.Mesh(new TT.PlaneGeometry(14, 60), new TT.MeshStandardMaterial({ color: 0x0d0a14, roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 4.9, -18); sc.add(ceil);
    for (const sx of [-1, 1]) { const st = new TT.Mesh(new TT.PlaneGeometry(0.05, 46), new TT.MeshBasicMaterial({ color: 0xa060ff })); st.rotation.x = -Math.PI / 2; st.position.set(sx * 0.95, 0.005, -18); sc.add(st); }
    const wallM = new TT.MeshStandardMaterial({ color: 0x130f1c, roughness: 0.9 });
    for (const sx of [-1, 1]) { const w = new TT.Mesh(new TT.PlaneGeometry(60, 5), wallM); w.rotation.y = -sx * Math.PI / 2; w.position.set(sx * 5.2, 2.45, -18); sc.add(w); }
    // カプセルの部品
    const gBase = new TT.CylinderGeometry(0.52, 0.58, 0.3, 24), gCap = new TT.CylinderGeometry(0.5, 0.52, 0.3, 24), gPipe = new TT.CylinderGeometry(0.06, 0.06, 2.1, 8);
    const gRing = new TT.TorusGeometry(0.5, 0.025, 6, 32); gRing.rotateX(Math.PI / 2);
    const gGlass = new TT.CylinderGeometry(0.46, 0.46, LAB.glassH, 28, 1, true), gLiq = new TT.CylinderGeometry(0.43, 0.43, LAB.glassH - 0.04, 24, 1, true);
    const mMetal = new TT.MeshStandardMaterial({ color: 0x2c2838, roughness: 0.4, metalness: 0.7 });
    const mRing = new TT.MeshBasicMaterial({ color: 0xc48aff });
    const mGlass = new TT.MeshStandardMaterial({ color: 0xe8f0ff, transparent: true, opacity: 0.13, roughness: 0.05, metalness: 0.4, depthWrite: false, side: TT.DoubleSide });
    const mLiq = new TT.MeshStandardMaterial({ color: 0x9a6cff, emissive: 0x5a2ab0, emissiveIntensity: 0.55, transparent: true, opacity: 0.2, depthWrite: false, side: TT.DoubleSide });
    // くもりガラスの帯：太ももの中ほどから、肩の下まで（中の体はうっすら影だけ）
    const hip = (S.hip || 0.91) * 0.95, bandY0 = LAB.foot + hip * 0.74, bandY1 = LAB.foot + hip * 1.49, bandH = bandY1 - bandY0; // 測った骨の高さ：ひざ 0.59・脚のつけね 0.94・肩 1.36（腰の高さ×）
    const gBand = new TT.CylinderGeometry(0.47, 0.47, bandH, 28, 1, true);
    const mBand = new TT.MeshStandardMaterial({ color: 0xd8dcf0, map: frostTex(TT), transparent: true, opacity: 0.93, roughness: 1, metalness: 0, emissive: 0x3a2a60, emissiveIntensity: 0.35, side: TT.DoubleSide });
    // 遠くのカプセルの中の子（シルエット）
    const gBody = new TT.CapsuleGeometry(0.15, 0.8, 4, 10), gHead = new TT.SphereGeometry(0.12, 12, 8);
    const mSil = new TT.MeshStandardMaterial({ color: 0x4a3a7a, emissive: 0x2a1a5a, emissiveIntensity: 0.6, roughness: 0.7 });
    const spots = []; // 全部のカプセルの位置
    for (let c = 0; c < LAB.cols.length; c++) for (let r = 0; r < LAB.rows; r++) {
      const x = LAB.cols[c], z = -r * LAB.dz + (c >= 2 ? (c >= 4 ? 0.3 : 0.6) : 0);
      const real = c < 2 && r < LAB.near;
      spots.push({ x, z, real, side: x < 0 ? -1 : 1, r, c });
    }
    const far = spots.filter(s => !s.real), N = far.length, M4 = new TT.Matrix4(), Q = new TT.Quaternion(), V = new TT.Vector3(), ONE = new TT.Vector3(1, 1, 1);
    const inst = (g, m, n) => { const im = new TT.InstancedMesh(g, m, n); im.frustumCulled = false; sc.add(im); return im; }; // 動く物（泡など）も、いつも描く
    const iBase = inst(gBase, mMetal, spots.length), iCap = inst(gCap, mMetal, spots.length), iPipe = inst(gPipe, mMetal, spots.length), iRing = inst(gRing, mRing, spots.length * 2);
    spots.forEach((s, i) => {
      iBase.setMatrixAt(i, M4.makeTranslation(s.x, 0.15, s.z)); iCap.setMatrixAt(i, M4.makeTranslation(s.x, LAB.glassY0 + LAB.glassH + 0.15, s.z)); iPipe.setMatrixAt(i, M4.makeTranslation(s.x, LAB.glassY0 + LAB.glassH + 1.3, s.z));
      iRing.setMatrixAt(i * 2, M4.makeTranslation(s.x, 0.31, s.z)); iRing.setMatrixAt(i * 2 + 1, M4.makeTranslation(s.x, LAB.glassY0 + LAB.glassH - 0.01, s.z));
    });
    const iLiq = inst(gLiq, mLiq, N), iBand = inst(gBand, mBand, N), iBody = inst(gBody, mSil, N), iHead = inst(gHead, mSil, N);
    far.forEach((s, i) => {
      iLiq.setMatrixAt(i, M4.makeTranslation(s.x, LAB.glassY0 + LAB.glassH / 2, s.z)); iBand.setMatrixAt(i, M4.makeTranslation(s.x, (bandY0 + bandY1) / 2, s.z));
    });
    iBand.renderOrder = 3; iLiq.renderOrder = 2; // 遠くのカプセルは、ガラスを省いて液だけ（軽くするため）
    // 遠くの子は、ゆっくり上下にゆれる
    S.ups.push((now) => {
      const t = now / 1000;
      for (let i = 0; i < N; i++) { const s = far[i], b = Math.sin(t * 0.9 + i * 1.7) * 0.03;
        iBody.setMatrixAt(i, M4.makeTranslation(s.x, LAB.foot + 0.74 + b, s.z)); iHead.setMatrixAt(i, M4.makeTranslation(s.x, LAB.foot + 1.47 + b, s.z)); }
      iBody.instanceMatrix.needsUpdate = true; iHead.instanceMatrix.needsUpdate = true;
      mLiq.emissiveIntensity = 0.5 + 0.08 * Math.sin(t * 1.3);
    });
    // 泡（手前のカプセルの中を、下から上へ）
    const bubN = 4 * 40, iBub = inst(new TT.SphereGeometry(0.022, 6, 4), new TT.MeshBasicMaterial({ color: 0xe6d8ff, transparent: true, opacity: 0.7, depthWrite: false }), bubN);
    const near = spots.filter(s => s.c < 2 && s.r < 20), bub = [];
    for (let i = 0; i < bubN; i++) bub.push({ s: near[i % near.length], ox: (Math.random() - 0.5) * 0.6, oz: (Math.random() - 0.5) * 0.6, ph: Math.random(), sp: 0.12 + Math.random() * 0.12 });
    S.ups.push((now) => {
      const t = now / 1000;
      bub.forEach((b, i) => { const s = b.s; if (s.open) { iBub.setMatrixAt(i, M4.makeScale(0, 0, 0)); return; } const y = LAB.glassY0 + 0.1 + ((b.ph + t * b.sp) % 1) * (LAB.glassH - 0.2); iBub.setMatrixAt(i, M4.makeTranslation(s.x + b.ox, y, s.z + b.oz)); });
      iBub.instanceMatrix.needsUpdate = true;
    });
    // 手前の本物のカプセル（ガラス・液・くもりガラスは1本ずつ。エンディングで開く）
    const real = spots.filter(s => s.real).sort((a, b) => a.r - b.r || a.side - b.side);
    S.caps = [];
    for (const s of real) {
      const g = new TT.Group(); g.position.set(s.x, 0, s.z); sc.add(g);
      const glass = new TT.Mesh(gGlass, mGlass); glass.position.y = LAB.glassY0 + LAB.glassH / 2; glass.renderOrder = 4; g.add(glass);
      const liq = new TT.Mesh(gLiq, mLiq.clone()); liq.position.y = LAB.glassY0 + LAB.glassH / 2; liq.renderOrder = 2; g.add(liq);
      const band = new TT.Mesh(gBand, mBand); band.position.y = (bandY0 + bandY1) / 2; band.renderOrder = 3; g.add(band);
      const pct = 70 + Math.floor(Math.random() * 29);
      const lab = textTex(TT, 256, 64, (c, w, h, done) => { c.fillStyle = '#0c0a14'; c.fillRect(0, 0, w, h); c.fillStyle = done ? '#5aff9a' : '#c89aff'; c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(done ? '再生完了' : '再生中 ' + pct + '%', w / 2, h / 2); });
      lab.redraw(false);
      const pl = new TT.Mesh(new TT.PlaneGeometry(0.5, 0.125), new TT.MeshBasicMaterial({ map: lab.tex })); pl.position.set(-s.side * 0.585, 0.16, 0); pl.rotation.y = -s.side * Math.PI / 2; g.add(pl);
      S.caps.push({ s, g, glass, liq, band, lab, who: null });
    }
    // 部屋の画面（通路の上に、つりさげ）
    const mon = textTex(TT, 640, 240, (c, w, h) => {
      c.fillStyle = '#07050d'; c.fillRect(0, 0, w, h); c.strokeStyle = '#a060ff'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12);
      c.fillStyle = '#c89aff'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.fillText('インク団　再生の部屋', w / 2, 60);
      c.fillStyle = '#ffffff'; c.font = 'bold 54px sans-serif'; c.fillText('再生中：347体', w / 2, 135);
      c.fillStyle = '#ffd8f4'; c.font = '28px sans-serif'; c.fillText('首領さまの手作りインクで、ひとりずつ', w / 2, 195);
    }); mon.redraw();
    const scr = new TT.Mesh(new TT.PlaneGeometry(2.6, 0.975), new TT.MeshBasicMaterial({ map: mon.tex })); scr.position.set(0, 3.25, -6.6); sc.add(scr);
    for (const sx of [-1, 1]) { const w = new TT.Mesh(new TT.CylinderGeometry(0.015, 0.015, 1.2, 4), mMetal); w.position.set(sx * 1.1, 4.3, -6.6); sc.add(w); }
    // 中の戦闘員（再生中の体）
    const ac = [];
    for (let i = 0; i < S.caps.length; i++) { const cp = S.caps[i]; cp.who = await mkActor(S, 'minion', { ti: i, bare: true, sc: 0.95, x: cp.s.x, z: cp.s.z, foot: LAB.foot, mode: 'float', sleep: true }); faceTo(cp.who, 0, cp.s.z); S.prog && S.prog('おはなしを準備中…（' + (i + 1) + '/' + S.caps.length + '）'); ac.push(cp.who); }
    // ink:0〜3 の子：左右の3本目・4本目
    Object.defineProperty(S, 'ink', { configurable: true, get: () => [4, 5, 6, 7].map(i => S.caps[i].who) });
    S.capOf = (a) => S.caps.find(c => c.who === a);
    return ac;
  }
  // カプセルを開ける（液が引いて、ガラスが床へしずむ → ピカッと光って、服までもどった姿に）
  async function openCap(S, cp, i) {
    const TT = T();
    cp.lab.redraw(true); cp.s.open = true;
    await S.clk.tween(700, (t) => { cp.liq.scale.y = Math.max(0.01, 1 - t); cp.liq.position.y = LAB.glassY0 + (LAB.glassH / 2) * (1 - t); });
    cp.liq.visible = false;
    await S.clk.tween(600, (t) => { const k = ease(t); cp.glass.position.y = LAB.glassY0 + LAB.glassH / 2 - k * (LAB.glassH + 0.4); cp.band.position.y = cp.band.userData.y0 - k * (LAB.glassH + 0.4); });
    cp.glass.visible = cp.band.visible = false;
    const old = cp.who, nw = await mkActor(S, 'minion', { ti: S.caps.indexOf(cp), sc: 1, x: old.x, z: old.z, foot: LAB.foot, yaw: old.yaw, voice: old.voice });
    const fl = new TT.Mesh(new TT.SphereGeometry(0.6, 16, 10), new TT.MeshBasicMaterial({ color: 0xe8c8ff, transparent: true, opacity: 0.9, depthWrite: false })); fl.position.set(old.x, LAB.foot + 0.9, old.z); S.scene.add(fl);
    if (IW3.sfx) IW3.sfx('pop');
    old.root.visible = false; S.actors.splice(S.actors.indexOf(old), 1); S.scene.remove(old.root);
    cp.who = nw; nw.mode = 'shock'; say(nw, 'surprise');
    await S.clk.tween(380, (t) => { fl.scale.setScalar(1 + t * 1.2); fl.material.opacity = 0.9 * (1 - t); nw.foot = LAB.foot + (0.3 - LAB.foot) * ease(t); });
    S.scene.remove(fl); nw.foot = 0.3; nw.mode = 'idle'; say(nw, 'joy');
    return nw;
  }

  // ===== セット：首領の間（throne）と、アジトの入口（gate。x=40 の所） =====
  async function buildThrone(S) {
    const TT = T(), sc = S.scene;
    sc.background = new TT.Color(0x0c0812); sc.fog = new TT.Fog(0x0c0812, 9, 40);
    sc.add(new TT.HemisphereLight(0xc8b0ff, 0x1a0e24, 1.2));
    const dl = new TT.DirectionalLight(0xffe8d0, 1.2); dl.position.set(2, 7, 6); sc.add(dl);
    const pk = new TT.PointLight(0xc070ff, 26, 12, 1.5); pk.position.set(0, 3.5, -4.5); sc.add(pk);
    const fl = new TT.Mesh(new TT.PlaneGeometry(14, 16), new TT.MeshStandardMaterial({ color: 0x1d1626, roughness: 0.6, metalness: 0.3 })); fl.rotation.x = -Math.PI / 2; fl.position.z = -1; sc.add(fl);
    const cp = new TT.Mesh(new TT.PlaneGeometry(2.0, 9), new TT.MeshStandardMaterial({ color: 0x5a1a4a, roughness: 0.9 })); cp.rotation.x = -Math.PI / 2; cp.position.set(0, 0.005, 0.6); sc.add(cp);
    const mM = new TT.MeshStandardMaterial({ color: 0x2c2838, roughness: 0.4, metalness: 0.7 }), gold = new TT.MeshStandardMaterial({ color: 0xffd23a, emissive: 0x7a5000, emissiveIntensity: 0.5, metalness: 0.7, roughness: 0.3 });
    const dais = new TT.Mesh(new TT.BoxGeometry(4.4, 0.3, 2.4), mM); dais.position.set(0, 0.15, -4.4); sc.add(dais);
    const seat = new TT.Mesh(new TT.BoxGeometry(1.0, 0.45, 0.8), new TT.MeshStandardMaterial({ color: 0x7a2a8a, roughness: 0.6 })); seat.position.set(0, 0.52, -4.9); sc.add(seat);
    const back = new TT.Mesh(new TT.BoxGeometry(1.1, 1.9, 0.18), new TT.MeshStandardMaterial({ color: 0x7a2a8a, roughness: 0.6 })); back.position.set(0, 1.25, -5.3); sc.add(back);
    const crown = IW3.makeCrown(); crown.scale.setScalar(2.2); crown.position.set(0, 2.35, -5.3); sc.add(crown);
    const wall = new TT.Mesh(new TT.PlaneGeometry(14, 7), new TT.MeshStandardMaterial({ color: 0x1a1426, roughness: 0.9 })); wall.position.set(0, 3.5, -6.6); sc.add(wall);
    // 大きなインクのタンク（町にふらせるインク）
    S.tankMats = [];
    for (const x of [-3.6, -2.1, 2.1, 3.6]) {
      const g = new TT.Group(); g.position.set(x, 0, -5.7); sc.add(g);
      const sh = new TT.Mesh(new TT.CylinderGeometry(0.62, 0.62, 3.6, 24, 1, true), new TT.MeshStandardMaterial({ color: 0xe8f0ff, transparent: true, opacity: 0.18, depthWrite: false, side: TT.DoubleSide })); sh.position.y = 2.1; g.add(sh);
      const im = new TT.MeshStandardMaterial({ color: 0xb04df0, emissive: 0x8a2ad0, emissiveIntensity: 0.6 }); S.tankMats.push(im);
      const ink = new TT.Mesh(new TT.CylinderGeometry(0.56, 0.56, 2.7, 20), im); ink.position.y = 1.7; g.add(ink);
      for (const y of [0.15, 4.0]) { const c = new TT.Mesh(new TT.CylinderGeometry(0.7, 0.7, 0.3, 24), mM); c.position.y = y; g.add(c); }
      const p = new TT.Mesh(new TT.CylinderGeometry(0.08, 0.08, 3, 8), mM); p.position.y = 5.6; g.add(p);
    }
    for (const sx of [-1, 1]) for (const z of [-2.2, 1.2, 4.6]) { const c = new TT.Mesh(new TT.CylinderGeometry(0.32, 0.36, 5, 12), mM); c.position.set(sx * 4.6, 2.5, z); sc.add(c); const r = new TT.Mesh(new TT.TorusGeometry(0.34, 0.03, 6, 20), new TT.MeshBasicMaterial({ color: 0xc48aff })); r.rotation.x = Math.PI / 2; r.position.set(sx * 4.6, 1.4, z); sc.add(r); }
    S.ups.push((now) => { const t = now / 1000; for (const m of S.tankMats) m.emissiveIntensity = (S.tankGlow || 0.6) + 0.1 * Math.sin(t * 2); });
    // 入口（x=40）：岩の壁に大きな扉。インク団のしるし（インクのしずく）
    const GX = 40;
    const gf = new TT.Mesh(new TT.PlaneGeometry(16, 16), new TT.MeshStandardMaterial({ color: 0x23202c, roughness: 1 })); gf.rotation.x = -Math.PI / 2; gf.position.set(GX, 0, 0); sc.add(gf);
    const rock = new TT.Mesh(new TT.PlaneGeometry(16, 9), new TT.MeshStandardMaterial({ color: 0x2a2633, roughness: 1 })); rock.position.set(GX, 4.5, -4.2); sc.add(rock);
    const frame = new TT.Mesh(new TT.BoxGeometry(3.4, 4.2, 0.4), mM); frame.position.set(GX, 2.1, -4.0); sc.add(frame);
    const door = new TT.Mesh(new TT.BoxGeometry(2.8, 3.8, 0.42), new TT.MeshStandardMaterial({ color: 0x3a2a4a, roughness: 0.5, metalness: 0.5 })); door.position.set(GX, 1.9, -3.95); sc.add(door);
    S.doorM = new TT.MeshStandardMaterial({ color: 0xb04df0, emissive: 0x9a3ae0, emissiveIntensity: 0.8 });
    const drop = new TT.Group(); drop.position.set(GX, 2.3, -3.7); sc.add(drop);
    const ds = new TT.Mesh(new TT.SphereGeometry(0.42, 20, 14), S.doorM); drop.add(ds); const dc = new TT.Mesh(new TT.ConeGeometry(0.37, 0.6, 20), S.doorM); dc.position.y = 0.42; drop.add(dc);
    const lamp = new TT.PointLight(0xc070ff, 10, 8, 1.6); lamp.position.set(GX, 3.2, -2.6); sc.add(lamp);
    // キャラ
    S.noir = await mkActor(S, 'noir', { x: 0, z: -3.75, foot: 0.3, yaw: Math.PI, voice: 4 }); S.prog && S.prog('おはなしを準備中…（首領）');
    S.ink = [];
    const pos = [[-0.8, -1.8], [0.8, -1.8], [-2.0, -1.2], [2.0, -1.2], [-1.3, -0.4], [1.3, -0.4]];
    for (let i = 0; i < pos.length; i++) { const a = await mkActor(S, 'minion', { ti: i, x: pos[i][0], z: pos[i][1] }); faceTo(a, 0, -3.75); S.ink.push(a); S.prog && S.prog('おはなしを準備中…（' + (i + 1) + '/' + pos.length + '）'); }
    S.hero = await mkActor(S, 'hero', { x: GX, z: 0.5, yaw: 0 });
  }

  // ===== しかけ（1行ごと） =====
  //   S.shot(カメラの位置, 見る所, ミリ秒)。0 ミリ秒ですぐ切りかえ
  const V3 = (x, y, z) => new (T().Vector3)(x, y, z);
  const ACT = {
    // オープニング
    wide: (S) => S.shot(V3(0, 3.0, 6.2), V3(0, 1.1, -3), 0),
    noir: (S) => { say(S.noir, 'smirk'); const a = S.ink[0]; if (a.mode === 'hold') { a.box && (a.box.visible = false); walkTo(S, a, -0.8, -1.8, 900).then(() => faceTo(a, 0, -3.75)); } return S.shot(V3(0.25, 1.0, -1.25), V3(0, 0.8, -3.75), 1400); },
    minions: (S) => { const q = S._mq = (S._mq || 0) + 1; S.ink.forEach((a, i) => say(a, q > 1 && i === 1 ? 'puzzled' : 'joy')); /* 2回目は「おやつが、ですか？」：聞き返す子はきょとん */ return S.shot(V3(0.9, 1.85, -4.3), V3(0, 0.9, -1.0), 1400); },
    minions2: (S) => { S.ink.forEach((a, i) => { say(a, i % 2 ? 'cheer' : 'joy'); }); return S.shot(V3(-2.6, 1.6, 0.8), V3(0, 1.0, -1.6), 1600); },
    snack: async (S) => { const a = S.ink[0]; const box = new (T().Mesh)(new (T().BoxGeometry)(0.22, 0.12, 0.16), new (T().MeshStandardMaterial)({ color: 0xff9ad0 })); a.box = box; S.scene.add(box); S.ups.push(() => { const hb = a.rig.bones.J_Bip_C_Chest; if (hb) { hb.getWorldPosition(box.position); box.position.y -= 0.1; box.position.x += -Math.sin(a.yaw) * 0.32; box.position.z += -Math.cos(a.yaw) * 0.32; } }); S.shot(V3(2.0, 1.35, -3.0), V3(-0.3, 1.05, -3.0), 1200); await walkTo(S, a, -0.35, -2.75, 1100); a.mode = 'hold'; say(a, 'joy'); }, /* Ink89：頭が切れないよう、少し引いて上へ */
    noirUp: (S) => { S.noir.mode = 'cheer'; say(S.noir, 'roar'); return S.shot(V3(0.1, 0.95, -1.5), V3(0, 0.85, -3.75), 800); },
    tanks: (S) => { S.noir.mode = 'cheer'; say(S.noir, 'smirk'); S.clk.tween(1600, (t) => { S.tankGlow = 0.6 + 1.2 * t; }); return S.shot(V3(0, 1.3, 1.6), V3(0, 2.0, -5.5), 1800); },
    cheer: (S) => { S.ink.forEach(a => { a.mode = 'cheer'; say(a, 'cheer'); }); S.noir.mode = 'idle'; say(S.noir, 'joy'); return S.shot(V3(2.6, 1.8, 1.4), V3(0, 1.0, -2.2), 1200); },
    gate: async (S) => { await S.fade(1, 500); S.shot(V3(41.4, 1.7, 3.4), V3(40, 1.7, -3.5), 0); S.hero.mode = 'idle'; S.hero.yaw = 0; await S.fade(0, 600); },
    gateHero: (S) => { S.hero.yaw = 0; say(S.hero, 'focus'); return S.shot(V3(40.25, 1.5, -1.3), V3(40, 1.4, 0.5), 1000); },
    gateGo: async (S) => { S.hero.yaw = 0; say(S.hero, 'spirit'); S.shot(V3(40.8, 2.0, 4.0), V3(40, 1.8, -3.5), 1400); await walkTo(S, S.hero, 40, -2.6, 2200, 0.45); S.clk.tween(800, (t) => { S.doorM.emissiveIntensity = 0.8 + 2 * t; }); },
    // 再生の部屋
    labEnter: (S) => { S.hero.x = 0; S.hero.z = 3.4; S.hero.yaw = 0; return S.shot(V3(0.9, 2.0, 7.2), V3(0, 1.4, -6), 0); },
    labHero: (S) => { say(S.hero, 'surprise'); return S.shot(V3(0.5, 1.55, 1.4), V3(0, 1.35, 3.4), 1300); },
    labDolly: (S) => { say(S.hero, 'calm'); S.shot(V3(1.0, 1.5, 2.0), V3(-1.55, 1.5, -1), 0); S.shot(V3(0.3, 1.75, -10), V3(0, 1.5, -24), 8000); return S.clk.wait(1200); },
    labWalk: async (S) => { S.shot(V3(0.55, 1.75, 4.6), V3(0, 1.35, -4), 0); await walkTo(S, S.hero, 0, 0.6, 1600); say(S.hero, 'worried'); },
    monitor: (S) => S.shot(V3(0.1, 1.55, -1.0), V3(0, 3.15, -6.6), 1300),
    labHero2: (S) => { S.hero.yaw = 0; say(S.hero, 'worried'); return S.shot(V3(0.15, 1.45, -1.0), V3(0, 1.35, 0.6), 1100); },
    sleeper: async (S) => { const a = S.ink[0]; S.shot(V3(a.x * 0.35, 1.85, a.z + 0.75), V3(a.x, 1.75, a.z), 1300); await walkTo(S, S.hero, -0.35, a.z + 0.9, 1300); faceTo(S.hero, a.x, a.z); say(a, 'calm'); },
    wake1: (S) => { const a = S.ink[0]; a.sleep = false; a.mode = 'fear'; say(a, 'surprise'); if (IW3.sfx) IW3.sfx('kon'); return S.clk.wait(300); },
    wakeAll: (S) => { for (const c of S.caps) { const a = c.who; if (Math.abs(a.z - S.ink[0].z) < 3.2) { a.sleep = false; a.mode = 'fear'; say(a, 'fear'); } } return S.shot(V3(0.4, 1.7, S.ink[0].z + 3.0), V3(-0.2, 1.55, S.ink[0].z - 1.5), 1100); },
    heroCalm: (S) => { say(S.hero, 'calm'); return S.shot(V3(0.8, 1.55, S.hero.z - 1.3), V3(S.hero.x, 1.4, S.hero.z), 1000); },
    town1: (S) => { const a = S.ink[0]; a.mode = 'float'; say(a, 'calm'); return S.shot(V3(a.x * 0.3, 1.85, a.z + 0.85), V3(a.x, 1.75, a.z), 900); },
    heroCalm2: (S) => { say(S.hero, 'worried'); return S.shot(V3(0.6, 1.5, S.hero.z - 1.1), V3(S.hero.x, 1.4, S.hero.z), 900); },
    tsukkomi1: (S) => { const a = S.ink[2]; say(a, 'anger'); return S.shot(V3(a.x * 0.35, 1.85, a.z + 0.8), V3(a.x, 1.75, a.z), 900); },
    tsukkomi2: (S) => { const a = S.ink[3]; say(a, 'anger'); return S.shot(V3(a.x * 0.35, 1.85, a.z + 0.8), V3(a.x, 1.75, a.z), 900); },
    heroAway: async (S) => { say(S.hero, 'worried'); S.shot(V3(-0.2, 1.7, S.hero.z + 2.6), V3(0, 1.3, S.hero.z - 5), 900); await walkTo(S, S.hero, 0, S.hero.z - 0.2, 300); await walkTo(S, S.hero, 0, -10, 2600, 0.5); },
    away1: (S) => { const a = S.ink[1]; say(a, 'surprise'); a.mode = 'float'; return S.shot(V3(a.x * 0.35, 1.85, a.z + 0.8), V3(a.x, 1.75, a.z), 800); },
    away2: (S) => { const a = S.ink[2]; say(a, 'calm'); a.mode = 'float'; return S.shot(V3(a.x * 0.35, 1.85, a.z + 0.8), V3(a.x, 1.75, a.z), 800); },
    away3: (S) => { for (const c of S.caps) if (c.who.mode === 'fear') c.who.mode = 'float'; const a = S.ink[0]; say(a, 'joy'); return S.shot(V3(a.x * 0.3, 1.8, a.z + 0.9), V3(a.x, 1.75, a.z), 900); },
    // エンディング
    endWide: (S) => S.shot(V3(2.3, 2.6, 2.6), V3(0, 0.9, -3), 0),
    endNoir: (S) => { S.noir.mode = 'cry'; say(S.noir, 'worried'); return S.shot(V3(0.3, 0.62, -2.0), V3(0, 0.45, -3.1), 1200); },
    endNoirLook: (S) => { S.noir.mode = 'sitUp'; say(S.noir, 'worried'); return S.shot(V3(0.55, 1.45, -0.4), V3(0, 0.55, -3.1), 1200); },
    endHero: (S) => { say(S.hero, 'calm'); return S.shot(V3(-0.15, 0.75, -2.5), V3(0, 1.45, -1.1), 1100); },
    endOpen: (S) => { faceTo(S.hero, -1.55, -2.5); say(S.hero, 'joy'); return S.shot(V3(0.2, 1.9, 1.6), V3(0, 1.3, -3.4), 1500); },
    endDone: async (S) => { const L = S.caps.slice(); await Promise.all(L.map((c, i) => S.clk.wait(i * 160).then(() => openCap(S, c, i)))); },
    endRun: async (S) => { const n = S.caps.length, ring = S.caps.map((c, i) => { const a = Math.PI * (0.5 + (i / Math.max(1, n - 1))), r = 0.95 + (i % 2) * 0.5; return [Math.sin(a) * r * 1.1, -3.1 + Math.cos(a) * r * 0.75]; }); // 首領のうしろと横に、半円（手前はカメラとヒーローのためにあける）
      S.shot(V3(1.4, 2.3, 0.6), V3(0, 0.7, -3.3), 1600);
      await Promise.all(S.caps.map((c, i) => S.clk.wait(i * 90).then(async () => { const a = c.who; say(a, 'cheer'); const f0 = a.foot; await S.clk.tween(220, (t) => { a.foot = f0 * (1 - t); a.lift = Math.sin(t * Math.PI) * 0.15; }); a.lift = 0; await walkTo(S, a, ring[i][0], ring[i][1] + (ring[i][1] > -3.1 && Math.abs(ring[i][0]) < 0.5 ? -0.0 : 0), 1500, 0.5); faceTo(a, 0, -1.6); }))); },
    endCrowd: (S) => { for (const c of S.caps) say(c.who, 'worried'); S.noir.mode = 'sitUp'; say(S.noir, 'surprise'); return S.shot(V3(0.9, 1.3, -0.9), V3(0, 0.8, -3.4), 1000); },
    endHug: (S) => { for (const c of S.caps) { c.who.mode = 'cheer'; say(c.who, 'joy'); } S.noir.mode = 'sitUp'; say(S.noir, 'scream'); return S.shot(V3(0.4, 0.75, -2.0), V3(0, 0.5, -3.1), 1000); },
    endNoir2: (S) => { for (const c of S.caps) c.who.mode = 'idle'; S.noir.mode = 'sitUp'; say(S.noir, 'calm'); return S.shot(V3(0.3, 0.65, -2.1), V3(0, 0.5, -3.1), 1000); },
    endCheer: (S) => { for (const c of S.caps) { c.who.mode = 'cheer'; say(c.who, 'cheer'); } return S.shot(V3(1.5, 1.8, 0.2), V3(0, 0.8, -3.5), 1000); },
    endHero2: (S) => { for (const c of S.caps) c.who.mode = 'idle'; faceTo(S.hero, 0, -3.1); say(S.hero, 'joy'); return S.shot(V3(0.3, 1.5, -2.2), V3(0, 1.4, -1.0), 1000); },
    endNoir3: (S) => { S.noir.mode = 'idle'; say(S.noir, 'surprise'); return S.shot(V3(0.25, 1.0, -2.1), V3(0, 0.85, -3.1), 900); },
    endTalk3: (S) => { const a = S.ink[3]; for (const c of S.caps) c.who.mode = 'idle'; faceTo(a, S.hero.x, S.hero.z); say(a, 'joy'); S.noir.mode = 'sitUp'; say(S.noir, 'calm'); return S.shot(V3(a.x + 0.5, 1.45, a.z + 1.4), V3(a.x, 1.3, a.z), 1000); },
    endTalk0: (S) => { const a = S.ink[0]; faceTo(a, S.hero.x, S.hero.z); say(a, 'smirk'); a.mode = 'cheer'; return S.shot(V3(a.x + 0.5, 1.45, a.z + 1.4), V3(a.x, 1.3, a.z), 900); },
    endSlime: (S) => { for (const c of S.caps) c.who.mode = 'idle'; S.noir.mode = 'idle'; say(S.noir, 'surprise'); S.shot(V3(0.5, 1.5, -2.3), V3(0, 1.4, -1.2), 1200);
      const A = S.hero.A; if (A && IW3.slimeSkin) S.clk.tween(3200, (t) => IW3.slimeSkin(A, 0.75 * t)); return S.clk.wait(1200); }, // ヒーローの肌が、じわじわスライムの青に
    endSlime2: (S) => { S.hero.mode = 'shock'; say(S.hero, 'surprise'); return S.shot(V3(0.25, 1.5, -1.9), V3(0, 1.45, -1.2), 700); },
    endSlimeInk: (S) => { const a = S.ink[2]; faceTo(a, S.hero.x, S.hero.z); say(a, 'cheer'); a.mode = 'cheer'; return S.shot(V3(1.3, 1.5, -0.4), V3(0, 1.2, -2.0), 900); },
    endSame: (S) => { for (const c of S.caps) { c.who.mode = 'cheer'; say(c.who, 'cheer'); } S.hero.mode = 'idle'; say(S.hero, 'worried'); return S.shot(V3(1.6, 1.7, 0.3), V3(0, 1.0, -2.6), 1000); },
    endHero3: (S) => { for (const c of S.caps) c.who.mode = 'idle'; say(S.hero, 'tired'); return S.shot(V3(0.3, 1.5, -2.2), V3(0, 1.4, -1.1), 900); },
    endFar: (S) => { for (const c of S.caps) { c.who.mode = 'cheer'; say(c.who, 'cheer'); } S.noir.mode = 'cheer'; say(S.noir, 'joy'); return S.shot(V3(0, 3.6, 5.5), V3(0, 1.0, -5), 3500); },
    endFin: (S) => S.fade(0.85, 1500),
  };
  // エンディングのはじめの並び：首領はうずくまって泣いている。ヒーローは、少しはなれて立つ
  async function setupEnding(S) {
    S.noir = await mkActor(S, 'noir', { x: 0, z: -3.1, yaw: Math.PI, mode: 'cry', voice: 4 });
    S.hero = await mkActor(S, 'hero', { x: 0, z: -1.2, yaw: 0 }); faceTo(S.hero, 0, -3.1);
  }

  // ===== 再生 =====
  IW3.Story = {
    ACT, // 確認用
    async play(id, opt) {
      opt = opt || {}; const st = W.IW && W.IW.STORY && W.IW.STORY[id]; if (!st) return;
      const TT = T();
      const ov = document.createElement('div'); ov.className = 'story';
      ov.innerHTML = '<canvas class="scv"></canvas><div class="sfade"></div><div class="sfin">おしまい</div><div class="sload"><b>' + esc(st.title) + '</b><span>おはなしを準備中…</span></div><button type="button" class="sskip">とばす ⏭</button>';
      document.body.appendChild(ov);
      const cv = ov.querySelector('canvas'), fade = ov.querySelector('.sfade'), ld = ov.querySelector('.sload span');
      const R = new TT.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: !!W.IW_PLICY }); R.outputColorSpace = TT.SRGBColorSpace; R.setPixelRatio(Math.min(1.5, W.devicePixelRatio || 1));
      const scene = new TT.Scene(), cam = new TT.PerspectiveCamera(40, 1, 0.05, 120);
      const S = { scene, cam, clk: makeClock(), actors: [], ups: [], nid: 0, faces: minionFaces(), prog: (t) => { ld.textContent = t; } };
      IW3.storyNow = S; // 確認用
      const cp = V3(0, 2, 6), ct = V3(0, 1, 0);
      let shotId = 0;
      S.shot = (p, t, ms) => { const my = ++shotId; if (!ms) { cp.copy(p); ct.copy(t); return Promise.resolve(); } const p0 = cp.clone(), t0 = ct.clone(); return S.clk.tween(ms, (k) => { if (my !== shotId) return; const e = ease(k); cp.lerpVectors(p0, p, e); ct.lerpVectors(t0, t, e); }); };
      S.fade = (to, ms) => { fade.style.transition = 'opacity ' + (ms || 400) + 'ms'; fade.style.opacity = to; return S.clk.wait(ms || 400); };
      let alive = true, raf = 0, last = performance.now();
      const size = () => { const w = ov.clientWidth || W.innerWidth, h = ov.clientHeight || W.innerHeight; R.setSize(w, h, false); cam.aspect = w / Math.max(1, h); cam.fov = cam.aspect < 0.8 ? 58 : 40; cam.updateProjectionMatrix(); };
      size(); W.addEventListener('resize', size);
      const frame = () => { if (!alive) return; raf = requestAnimationFrame(frame); const now = performance.now(), dt = now - last; last = now;
        S.clk.tick(now); for (const f of S.ups) f(now, dt); for (const a of S.actors) poseActor(a, now);
        cam.position.copy(cp); cam.lookAt(ct); R.render(scene, cam); S.frames = (S.frames || 0) + 1; };
      // セットを作る（モデルの準備に少し時間がかかる）
      try {
        if (st.set === 'lab') {
          const hb = await IW3.makeMinionBase('story', IW3.INK.ink, S.faces[0]); S.hip = hb.A.hipHeight * hb.A.height;
          await buildLab(S, id === 'ending');
          for (const c of S.caps) c.band.userData.y0 = c.band.position.y;
          if (id === 'ending') await setupEnding(S); else S.hero = await mkActor(S, 'hero', { x: 0, z: 3.4, yaw: 0 });
        } else await buildThrone(S);
      } catch (e) { console.error(e); ld.textContent = '準備に失敗しました：' + e.message; }
      ov.querySelector('.sload').remove(); frame();
      let skip = false, next = null;
      const box = document.createElement('div'); box.className = 'talk story-talk'; ov.appendChild(box);
      const end = () => { alive = false; cancelAnimationFrame(raf); W.removeEventListener('resize', size); S.clk.clear(); try { R.dispose(); R.forceContextLoss && R.forceContextLoss(); } catch (e) { } ov.remove(); IW3.storyNow = null; };
      { const sk = ov.querySelector('.sskip'); let armT = 0; sk.onclick = (e) => { e.stopPropagation(); const now = performance.now(); if (now - armT > 2500) { armT = now; sk.textContent = 'もう一度押すと、とばす ⏭'; setTimeout(() => { if (performance.now() - armT >= 2400) sk.textContent = 'とばす ⏭'; }, 2500); return; } skip = true; next && next(); }; } // Ink96：とばすのは2回押し
      const NAME = { hero: ['ブルーセイバー', 'hero'], noir: ['首領ノワール', 'ink'], mon: ['部屋の画面', 'mon'], narr: ['', 'narr'] };
      for (let i = 0; i < st.lines.length && !skip; i++) {
        const [w0, t, a] = st.lines[i], w = w0.split(':')[0], k = +(w0.split(':')[1] || 0);
        const who = w === 'hero' ? S.hero : w === 'noir' ? S.noir : w === 'ink' ? (S.ink || [])[k] : null;
        box.innerHTML = '<div class="ttext dim">…</div>';
        const act = ACT[a]; let p = null; try { p = act ? act(S) : null; } catch (e) { console.error(e); }
        if (p && p.then) await Promise.race([p, S.clk.wait(a === 'endDone' || a === 'endRun' ? 6000 : 3200)]);
        if (skip) break;
        const nm = w === 'ink' ? 'インク団の戦闘員' : (NAME[w] || ['', ''])[0], cls = w === 'ink' ? 'ink' : (NAME[w] || ['', ''])[1];
        box.innerHTML = (nm ? '<div class="tname ' + cls + '">' + esc(nm) + '</div>' : '') + '<div class="ttext ' + (w === 'narr' ? 'narr' : w === 'mon' ? 'mon' : '') + '">' + esc(t) + '</div><div class="tnav"><button type="button" class="big">' + (i === st.lines.length - 1 ? '▶ おわる' : '▶ つぎへ') + '</button></div>';
        if (a === 'endFin') ov.classList.add('fin');
        if (who && w !== 'mon' && IW3.voice) { try { IW3.voice(w === 'hero' ? { kind: 'hero' } : w === 'noir' ? { noir: true } : { id: who.voice, u: { voice: who.voice } }, t, true); } catch (e) { } }
        const shownAt = performance.now(); // Ink81：字が出てすぐの押し（前の行を送ったときの2回目の押しなど）は受けない。読まずに次へ進むのを防ぐ
        await new Promise(ok => { next = ok; box.onclick = (e) => { e.stopPropagation(); if (performance.now() - shownAt < 450) return; ok(); }; if (opt.auto) setTimeout(ok, opt.autoMs || 1600); });
        next = null;
      }
      if (!skip && opt.hold) await new Promise(ok => setTimeout(ok, opt.hold));
      end();
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ---- src/ui/sound.js ---- */
// ---- インク戦闘員ウォーズ：効果音（WebAudio で、その場で作る。音の素材ファイルはなし） ----
(function (W) {
  'use strict';
  const IW3 = W.IW3 = W.IW3 || {};
  let ac = null, master = null, on = true;
  try { on = localStorage.getItem('inkwar.sound') !== 'off'; } catch (e) { }
  IW3.sfxInit = function () { if (ac) return; try { ac = new (W.AudioContext || W.webkitAudioContext)(); master = ac.createGain(); master.gain.value = 0.35; master.connect(ac.destination); } catch (e) { ac = null; } };
  IW3.sound = (v) => { if (v != null) { on = v; try { localStorage.setItem('inkwar.sound', v ? 'on' : 'off'); } catch (e) { } } return on; };
  function tone(f0, f1, ms, type, vol, delay) {
    const t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + ms / 1000);
    g.gain.setValueAtTime(vol || 0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + ms / 1000);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + ms / 1000 + 0.02);
  }
  function noise(ms, f, vol, delay) {
    const t = ac.currentTime + (delay || 0), n = Math.floor(ac.sampleRate * ms / 1000), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; fl.type = 'lowpass'; fl.frequency.value = f || 1200; g.gain.value = vol || 0.4;
    s.connect(fl); fl.connect(g); g.connect(master); s.start(t);
  }
  const last = {};
  IW3.sfx = function (k) {
    if (!ac || !on) return; const now = performance.now(); if (last[k] && now - last[k] < 60) return; last[k] = now;
    try {
      if (k === 'pop') { tone(520, 90, 260, 'triangle', 0.5); noise(320, 900, 0.35, 0.02); }
      else if (k === 'splat') noise(140, 700, 0.25);
      else if (k === 'aim') tone(1800, 1800, 70, 'sine', 0.06);
      else if (k === 'gasha') { noise(80, 1800, 0.22); tone(320, 160, 70, 'square', 0.09); } // ガシャ（引く）
      else if (k === 'kon') { tone(950, 620, 60, 'triangle', 0.16); noise(40, 4200, 0.12); } // コン（戻す）
      else if (k === 'swell') { tone(180, 720, 380, 'sine', 0.22); tone(240, 900, 380, 'triangle', 0.08, 0.04); for (let i = 0; i < 4; i++) tone(500 + i * 160, 300 + i * 100, 60, 'sine', 0.06, 0.08 * i); }
      else if (k === 'cannon') { tone(240, 120, 120, 'square', 0.18); noise(90, 1500, 0.2); }
      else if (k === 'hose') noise(260, 2400, 0.16);
      else if (k === 'jump') { tone(200, 640, 220, 'sawtooth', 0.15); noise(300, 1100, 0.3, 0.2); }
      else if (k === 'crack') tone(1400, 600, 90, 'square', 0.12);
      else if (k === 'blade') { noise(160, 4200, 0.25); tone(900, 1600, 120, 'sine', 0.15); }
      else if (k === 'laser') tone(1800, 500, 300, 'sawtooth', 0.14);
      else if (k === 'sweep') { noise(380, 3000, 0.3); tone(400, 1200, 300, 'sine', 0.15); }
      else if (k === 'comet') { tone(300, 1500, 600, 'sawtooth', 0.15); noise(600, 2600, 0.2); }
      else if (k === 'lbreak') { tone(150, 1800, 700, 'sawtooth', 0.2); noise(700, 2000, 0.3); }
      else if (k === 'homing') for (let i = 0; i < 4; i++) tone(900, 300, 200, 'square', 0.08, i * 0.09);
    } catch (e) { }
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ---- src/ui/voice.js ---- */
// ---- インク戦闘員ウォーズ：声（吹き出しのセリフを、声にする） ----
//   タイトルの「声」で選ぶ：'file'（声ファイル。なければ読み上げ）・'tts'（ブラウザの読み上げ）・'off'（声なし）。効果音を切ると、声も出ない。
//   読み上げ（tts）：端末に入っている日本語の声。戦闘員は9人分の声（高さと速さを変える）、ヒーローは落ちついた声。
//     声が重なりすぎないように、しゃべっている間に2つ以上たまったら、新しいものは飛ばす。
//   効果音の文字（ガシャッ・コン！・パシャーン！）は、S.sfxText で出すので、声にはならない。
//   はじめからの声（Grok）は、HTML の中に入っている（build.py の voice_embed。IW_VOICE_EMB）。となりに voice フォルダ（voice/index.txt → IW_VOICE）があれば、そちらが先。
//   声ファイル（file）：声づくりの部屋で作った声（このブラウザの中、voiceroom.js）が先。なければ game.html と同じ所の voice フォルダ。voice/index.js（tools/make_voice.py が作る）に、入っているファイルの一覧がある。
//     組：h（ヒーロー）・m0〜m2（戦闘員。voice 番号を3で割った余り）。ファイル名は、セリフの文字から決まる番号（IW3.voiceId）。
//     名前入りのセリフ（〇ちゃーん！ など）は、「前の言葉」「名前」「後ろの言葉」の3つを続けて鳴らす。
//     一覧にない組み合わせは、読み上げにまかせる。
(function (W) {
  'use strict';
  const IW3 = W.IW3 = W.IW3 || {};
  let mode = 'file';
  try { const o = JSON.parse(localStorage.getItem('inkwar.opt') || '{}'); if (o.voice) mode = o.voice; } catch (e) { }
  IW3.voiceMode = (m) => { if (m) mode = m; return mode; };
  // セリフの文字 → ファイルの番号（FNV-1a。文字が同じなら、いつも同じ番号）
  IW3.voiceId = function (text) { let h = 0x811c9dc5; for (const ch of String(text)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return 'v' + h.toString(36); };
  // しゃべる人の組と、声の高さ
  function who(v) {
    if (v && v.kind === 'hero') return { grp: 'h', pitch: 1.05, rate: 1.08, k: 0 };
    if (v && (v.noir || (v.u && v.u.chief))) return { grp: 'n', pitch: 1.45, rate: 1.1, k: 9 }; // Ink91：首領ノワールは、首領だけの声（組 n）
    const k = v && v.u && v.u.voice != null ? v.u.voice : (v && v.id ? v.id % 9 : 0);
    return { grp: 'm' + (k % 3), pitch: 1.25 + (k % 9) * 0.07, rate: 1.12 + (k % 4) * 0.04, k };
  }
  // ===== 読み上げ =====
  let jaVoices = [], pending = 0;
  const pickVoices = () => { if (!W.speechSynthesis) return; const L = speechSynthesis.getVoices().filter(x => /^ja/i.test(x.lang)); const fav = /Kyoko|Haruka|Nanami|O-ren|Ayumi|Mizuki|Google/i; jaVoices = L.sort((a, b) => (fav.test(b.name) ? 1 : 0) - (fav.test(a.name) ? 1 : 0)); };
  if (W.speechSynthesis) { pickVoices(); speechSynthesis.onvoiceschanged = pickVoices; }
  // 読みの辞書：読み上げ（端末の声）がまちがえやすい言葉を、ひらがなにしてから読ませる（吹き出しの文字はそのまま）。遊ぶ人に教えてもらったら、ここに足す
  //   長い言葉を先に（「薙ぎ払い」を「番」より先に置く、など）。Grok 用の指示書にも「（読み：…）」として出る
  IW3.READING = [['薙ぎ払い', 'なぎはらい'], ['お腹', 'おなか'], ['留め具', 'とめぐ'], ['飛沫', 'しぶき'], ['一刀', 'いっとう'], ['大の字', 'だいのじ'], ['砦', 'とりで'], ['盾', 'たて'], ['出番', 'でばん'], ['順番', 'じゅんばん'], ['番', 'ばん']];
  const reading = (t) => { let s = String(t); for (const [a, b] of IW3.READING) s = s.split(a).join(b); return s; };
  const clean = (t) => reading(t).replace(/……/g, '…').replace(/ー+/g, 'ー').replace(/[！？]{2,}/g, '！').replace(/♪/g, '');
  function tts(text, w, prio) {
    if (!W.speechSynthesis || !W.SpeechSynthesisUtterance) return null;
    if (!speechSynthesis.speaking && !speechSynthesis.pending) pending = 0; // 終わりの合図が来ないブラウザでも、止まらないように
    if (pending >= 2 && !prio) return null; // たまりすぎ：飛ばす（prio＝言い終わりを待つ大事なセリフは飛ばさない）
    let done; const P = new Promise(r => { done = r; });
    const u = new SpeechSynthesisUtterance(clean(text)); u.lang = 'ja-JP';
    if (jaVoices.length) u.voice = jaVoices[w.grp === 'h' ? 0 : (w.k % Math.min(2, jaVoices.length))];
    u.pitch = Math.min(2, w.pitch); u.rate = w.rate / Math.max(0.6, Math.min(1.4, IW3.speed || 1)); u.volume = 0.9;
    pending++; u.onend = u.onerror = () => { pending = Math.max(0, pending - 1); done(); };
    try { speechSynthesis.speak(u); } catch (e) { pending = Math.max(0, pending - 1); done(); }
    return P;
  }
  // ===== 声ファイル =====
  const V = () => W.IW_VOICE || null; // voice/index.js が入れる：{ ext, have: { h:[id…], m0:[…] … } }
  const has = (grp, id) => { const x = V(); if (!x) return false; const s = x._set || (x._set = {}); if (!s[grp]) s[grp] = new Set(x.have[grp] || []); return s[grp].has(id); };
  const hasE = (grp, id) => { const x = W.IW_VOICE_EMB; if (!x) return false; const s = x._set || (x._set = {}); if (!s[grp]) s[grp] = new Set(x.have[grp] || []); return s[grp].has(id); }; // HTML の中の声
  // 声づくりの部屋で作った声（このブラウザの中）：組/番号 → ある
  let MADE = null; const made = () => MADE || (MADE = (IW3.VSTORE && IW3.VSTORE.made()) || {});
  IW3.voiceRefresh = () => { MADE = null; };
  IW3.voiceCount = () => Object.keys(made()).length;
  const URLC = {};
  // 鳴らすものの場所：作った声（idb）が先、なければ voice フォルダのファイル
  // 順番：自分で録って取り込んだ声（rec）→ voice フォルダの声 → VOICEVOX でこのブラウザに作った声
  const src1 = (grp, id, ext) => { const k = grp + '/' + id, m = made()[k]; if (m && /^rec/.test(m)) return { k }; if (has(grp, id) && !(V() && V().embed)) { const x = V(); return { f: 'voice/' + grp + '/' + id + '.' + ((x && x.exts && x.exts[k]) || ext) }; } if (hasE(grp, id)) return { e: k }; return m ? { k } : null; };
  // 戦闘員の声2・声3 がないときは、声1（m0）で鳴らす（声を1人分だけ用意したとき。高さは子ごとに少し変わる）
  const srcOf = (grp, id, ext) => src1(grp, id, ext) || (grp === 'm1' || grp === 'm2' ? src1('m0', id, ext) : null);
  // HTML の中に入れた声（build.py が入れる）：しゃべるときに、1つずつ文字から音にもどす
  let EMB = null;
  const embUrl = (k) => {
    if (URLC['e:' + k]) return URLC['e:' + k];
    if (!EMB) { const el = W.document && document.getElementById('iwVoiceData'); try { EMB = el ? JSON.parse(el.textContent) : null; } catch (e) { EMB = {}; } }
    const t = (EMB || W.IW_VOICE_DATA || {})[k]; if (!t) return null;
    const c = t.indexOf(':'), ext = t.slice(0, c), bin = atob(t.slice(c + 1)), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return (URLC['e:' + k] = URL.createObjectURL(new Blob([u8], { type: ext === 'mp3' ? 'audio/mpeg' : 'audio/' + ext })));
  };
  // Ink89：投稿サイト用は、声のまとめ（voice/data_組_番号.js、400本ずつ）を、はじめに全部は読まない。
  //   いる声のまとめを、そのときに読む。タイトルが出て少したってから、残りを1つずつ裏で読んでおく。
  const VLOAD = {};
  const embChunk = (fn) => { const el = W.document && document.getElementById('iwvd-' + fn); if (!el) return false; try { W.IW_VOICE_DATA = Object.assign(W.IW_VOICE_DATA || {}, JSON.parse(el.textContent)); } catch (e) { } el.remove(); return true; }; // 配る形（HTML 1つ）：中の入れ物から読む
  const loadChunk = (fn) => VLOAD[fn] || (VLOAD[fn] = embChunk(fn) ? Promise.resolve(true) : new Promise(ok => { const sc = document.createElement('script'); sc.src = 'voice/' + fn; sc.onload = () => ok(true); sc.onerror = () => ok(false); document.head.appendChild(sc); }));
  const chunkOf = (k) => { const x = W.IW_VOICE_EMB; if (!x || !x.lazy) return null; const c = k.indexOf('/'), g = k.slice(0, c), i = (x.have[g] || []).indexOf(k.slice(c + 1)); return i < 0 ? null : 'data_' + g + '_' + Math.floor(i / (x.chunk || 400)) + '.js'; };
  async function needEmb(k) { if (W.IW_VOICE_DATA && W.IW_VOICE_DATA[k]) return; const fn = chunkOf(k); if (fn) await loadChunk(fn); }
  if (W.IW_VOICE_EMB && W.IW_VOICE_EMB.lazy && W.addEventListener) W.addEventListener('load', () => setTimeout(async () => { if (document.querySelector('script[id^="iwvd-"]')) return; /* 配る形は、裏で先に読まない（いるときにすぐ読める） */ if (W.YR && YR.modelsReady) { try { await YR.modelsReady; } catch (e) { } } /* Ink93：先に試合のモデル（軽い体・髪）を読んでから */ const x = W.IW_VOICE_EMB, n = x.chunk || 400; for (const g in x.have) for (let c = 0; c * n < x.have[g].length; c++) await loadChunk('data_' + g + '_' + c + '.js'); }, 3000));
  async function urlOf(s) { if (s.e) { await needEmb(s.e); return embUrl(s.e); } if (s.f) return s.f; if (URLC[s.k]) return URLC[s.k]; const b = IW3.VSTORE && await IW3.VSTORE.get(s.k); if (!b) return null; return (URLC[s.k] = URL.createObjectURL(b)); }
  // 名前入りのセリフ（「アオイ」＋「ちゃん！」など）は、ばらばらのファイルを続けて鳴らす。
  //   そのままだと、つなぎ目に「読みこみの待ち」と「ファイルの前後の無音」が入って、名前のあとで途切れる。
  //   → 先に全部を読みこんで（WebAudio）、つなぎ目の無音を切り、すき間なく並べて鳴らす
  let AC = null; const BUF = {};
  const ctx = () => { if (!AC) { try { AC = new (W.AudioContext || W.webkitAudioContext)(); } catch (e) { AC = null; } } if (AC && AC.state === 'suspended') AC.resume().catch(() => { }); return AC; };
  async function bufOf(u) {
    if (BUF[u]) return BUF[u];
    const ab = await (await fetch(u)).arrayBuffer(), b = await new Promise((ok, ng) => ctx().decodeAudioData(ab, ok, ng));
    // 前と後ろの無音（小さい音）を探す
    const d = b.getChannelData(0), th = 0.02, sr = b.sampleRate; let i0 = 0, i1 = d.length - 1;
    while (i0 < d.length && Math.abs(d[i0]) < th) i0++;
    while (i1 > i0 && Math.abs(d[i1]) < th) i1--;
    return (BUF[u] = { b, t0: Math.max(0, i0 / sr - 0.015), t1: Math.min(b.duration, i1 / sr + 0.03) });
  }
  function playJoin(files, w, prio, focus) {
    const A = ctx(); if (!A) return null;
    if (playing >= MAXV && !prio && !focus) return null;
    playing++; let done; const P = new Promise(r => { done = r; }), E = { focus, vol: () => { } }; ACT.add(E); P.then(() => ACT.delete(E));
    (async () => {
      try {
        const L = []; for (const f of files) { const u = await urlOf(f); if (!u) throw new Error('no voice'); L.push(await bufOf(u)); }
        const rate = 0.96 + (w.k % 9) * 0.015, g = A.createGain(); g.gain.value = 0.95 * duckOf(E); g.connect(A.destination); E.vol = (k) => { try { g.gain.setTargetAtTime(0.95 * k, A.currentTime, 0.06); } catch (e) { g.gain.value = 0.95 * k; } };
        let t = A.currentTime + 0.03, last = null;
        L.forEach((x, i) => {
          const s0 = i === 0 ? 0 : x.t0, s1 = i === L.length - 1 ? x.b.duration : x.t1; // はじめの頭と、最後のおしりは切らない
          const src = A.createBufferSource(); src.buffer = x.b; src.playbackRate.value = rate; src.connect(g);
          src.start(t, s0, s1 - s0); t += (s1 - s0) / rate - (i < L.length - 1 ? 0.02 : 0); last = src;
        });
        last.onended = () => { playing = Math.max(0, playing - 1); done(); };
      } catch (e) { playing = Math.max(0, playing - 1); ACT.delete(E); const q = playSeq(files, w, true, focus); if (q) q.then(done); else done(); } // 読みこめないとき（file:// のとなりのフォルダなど）は、前のやり方で
    })();
    return P;
  }
  let playing = 0;
  // 声が重なりすぎないように：ふつうの声は同時に2つまで。名前を呼ぶ声（「〇〇ちゃーん！」）は、いちばん大事なので
  //   鳴っている間は、ほかの声を小さく（25%）して、新しいふつうの声は出さない（吹き出しの字は出る）。名前の声どうしは、順番に（2つまで待つ）
  const MAXV = 2, ACT = new Set(); let focusOn = 0; const focusQ = [];
  const duckOf = (E) => (focusOn && !E.focus ? 0.25 : 1);
  const reduck = () => { for (const E of ACT) E.vol(duckOf(E)); };
  function playSeq(files, w, prio, focus) {
    if (playing >= MAXV && !prio && !focus) return null; // 同時に2つまで（prio・名前の声は飛ばさない）
    playing++; let i = 0, done; const P = new Promise(r => { done = r; }), E = { focus, a: null, vol: (k) => { if (E.a) E.a.volume = 0.95 * k; } }; ACT.add(E); P.then(() => ACT.delete(E));
    const end = () => { playing = Math.max(0, playing - 1); done(); };
    const next = async () => {
      if (i >= files.length) { end(); return; }
      const u = await urlOf(files[i++]).catch(() => null); if (!u) { end(); return; }
      const a = new Audio(u); E.a = a; a.volume = 0.95 * duckOf(E); a.playbackRate = 0.96 + (w.k % 9) * 0.015; a.preservesPitch = false;
      a.onended = next; a.onerror = end;
      a.play().catch(end);
    };
    next();
    return P;
  }
  // 名前入りのセリフを、型（〇の入った元の言い方）と名前に分ける
  function splitName(text) {
    const T = IW3.voiceTemplates || [];
    for (const t of T) { const [a, b] = t.split('〇'); if (text.startsWith(a) && text.endsWith(b) && text.length > a.length + b.length) return { a, b, name: text.slice(a.length, text.length - b.length) }; }
    return null;
  }
  // 名前を呼ぶ声：ほかを小さくして、はっきり聞かせる。鳴っている間に来た名前の声は、順番を待つ
  function nameCall(parts, w) {
    const go = () => {
      focusOn++; reduck();
      const p = (W.AudioContext || W.webkitAudioContext) && W.fetch && !W.IW_VOICE_OLDJOIN /* 確認用：前のつなぎ方 */ ? playJoin(parts, w, true, true) : playSeq(parts, w, true, true);
      const fin = () => { focusOn = Math.max(0, focusOn - 1); reduck(); const n = focusQ.shift(); if (n) n(); };
      if (p) p.then(fin); else fin();
      return p;
    };
    if (!focusOn) return go();
    if (focusQ.length >= 2) return null; // 待ちがいっぱい → この名前は声なし（吹き出しは出る）
    return new Promise(r => focusQ.push(() => { const p = go(); if (p) p.then(r); else r(); }));
  }
  // 声を出す。言い終わったら resolve する Promise を返す（声を出さなかったときは null）。prio：数の上限で飛ばさない
  IW3.voice = function (v, text, prio) {
    if (!text || mode === 'off' || (IW3.sound && !IW3.sound())) return null;
    const w = who(v), x = V(), ext = x ? x.ext || 'ogg' : 'ogg';
    if (mode === 'file' && (x || W.IW_VOICE_EMB || IW3.voiceCount())) {
      const id = IW3.voiceId(text), one = srcOf(w.grp, id, ext), sp = splitName(text);
      if (one) return sp ? nameCall([one], w) : playSeq([one], w, prio); // Ink80：名前入りを、まるごと録った声（「アカネちゃーん！」）があれば、つながずにそれを鳴らす
      if (sp) {
        const parts = [sp.a, sp.name, sp.b].filter(Boolean).map(t => srcOf(w.grp, IW3.voiceId(t), ext));
        if (parts.every(Boolean)) return nameCall(parts, w);
      }
      if (focusOn && !prio) return null; // 名前を呼ぶ声の間は、ふつうの声を出さない
      if (w.grp === 'n') return null; // 首領の声がないセリフは、ほかの子の声やブラウザの読み上げにしない（吹き出しだけ）
    }
    return tts(text, w, prio);
  };
  // Ink80：このセリフを、まるごと録った声があるか（名前を呼ぶ声で、録った言い方を多めに選ぶため）
  IW3.voiceHasWhole = function (text) {
    if (mode !== 'file') return false; const x = V(), ext = x ? x.ext || 'ogg' : 'ogg';
    try { return !!srcOf('m0', IW3.voiceId(text), ext); } catch (e) { return false; }
  };
  // 声ファイルを作るための一覧（tools/voice_lines.js が使う）：セリフ・言う人の組
  IW3.voiceList = function () {
    const L = IW3.LINES || {}, out = [], seen = new Set();
    const HERO = new Set(['heroAtk', 'heroThrow', 'heroSticky', 'heroLv', 'heroWin', 'heroOuch', 'shieldHero', 'fallHero', 'joined', 'barrelHero', 'reflectHero', 'stormSafe', 'stormHit']);
    const add = (t, g) => { if (!t || seen.has(g + t)) return; seen.add(g + t); out.push({ text: t, grp: g }); };
    const walk = (o, hero) => { for (const k in o) { const v = o[k]; if (Array.isArray(v)) v.forEach(t => typeof t === 'string' && !t.includes('〇') && add(t, hero ? 'h' : 'm')); else if (v && typeof v === 'object') walk(v, hero); else if (typeof v === 'string') add(v, hero ? 'h' : 'm'); } };
    for (const k in L) { const v = L[k]; if (/^chief/.test(k)) { (Array.isArray(v) ? v : []).forEach(t => typeof t === 'string' && add(t, 'n')); continue; } walk({ [k]: v }, HERO.has(k)); } // chief〇〇：首領のセリフ（組 n）
    (IW3.VOICE_EXTRA || []).forEach(([t, g]) => add(t, g));
    // 名前入りの型：前と後ろの言葉
    IW3.voiceTemplates = []; for (const k in L) if (Array.isArray(L[k])) for (const t of L[k]) if (typeof t === 'string' && t.includes('〇')) { IW3.voiceTemplates.push(t); const [a, b] = t.split('〇'); add(a, 'm'); add(b, 'm'); }
    for (const n of (W.IW && W.IW.NAMES) || []) add(n, 'm');
    // ステージの会話とクリアのひとこと（面のデータ IW.STAGES から自動で集める。面を足すと、ここにも自動で入る）
    //   一覧の番号がずれないように、いちばん後ろに、面の順に並べる。IW3.stageLineInfo：セリフ → どの面の、だれのセリフか（指示書のメモ用）
    IW3.stageLineInfo = {};
    for (const st of (W.IW && W.IW.STAGES) || []) {
      const lines = (st.talk || []).concat(st.volley || []).map(([w, t]) => [w, t]).concat(st.win ? [['win', st.win]] : []);
      for (const [w, t] of lines) { const g = w === 'hero' || w === 'win' ? 'h' : st.chief && w === 'boss' ? 'n' : 'm'; if (!IW3.stageLineInfo[t]) IW3.stageLineInfo[t] = { id: st.id, title: st.title, who: w, boss: st.boss || '' }; add(t, g); }
    }
    for (const t of IW3.STAGE_EXTRA || []) { add(t[0], t[1]); if (!IW3.stageLineInfo[t[0]]) IW3.stageLineInfo[t[0]] = { id: '', title: '', who: t[1] === 'h' ? 'hero' : 'ink', note: t[2] }; }
    // おはなしの場面（オープニング・再生の部屋・エンディング）。語りと画面の文字は、声なし
    for (const k in (W.IW && W.IW.STORY) || {}) { const st = W.IW.STORY[k];
      for (const [w0, t, , nt] of st.lines) { const w = w0.split(':')[0]; if (w === 'narr' || w === 'mon') continue; const g = w === 'hero' ? 'h' : w === 'noir' ? 'n' : 'm', nm = w === 'hero' ? 'ヒーロー' : w === 'noir' ? '首領ノワール' : '戦闘員'; if (!IW3.stageLineInfo[t]) IW3.stageLineInfo[t] = { id: 'おはなし', title: st.title, who: w === 'noir' ? 'boss' : w, boss: w === 'noir' ? '首領ノワール' : '', note: 'おはなし「' + st.title + '」・' + nm + '：' + (nt || '') }; add(t, g); } }
    return out;
  };
  // 一覧の外で、直接書いてあるセリフ（game.js・director.js・units3d.js）
  IW3.VOICE_EXTRA = [['インク団、出撃ー！', 'm'], ['インク団め、ここから先へは行かせない！', 'h'], ['強化スーツ、起動！ 全員まとめて相手だ！', 'h'], ['くっ……ここは引く！', 'h'],
    ['ヒーローに勝つために、鍛えるよ！ 赤組、いくよー！', 'm'], ['白組だって、負けないもん！', 'm'], ['今日は、みんなライバルだよ！', 'm'], ['最後まで残るのは、わたし！', 'm'], ['ヒーローに勝つために……優勝する！', 'm'],
    ['赤組の勝ちー！ これでヒーローにも勝てるかも！', 'm'], ['白組の勝ちー！ もっと強くなれたね！', 'm'], ['やったー！ 優勝！ これで、ヒーローにも負けない！', 'm'], ['優勝ー！ わたしが、いちばん！', 'm']];
  // ステージの画面に直接書いてあるセリフ（game.js の結果の画面）
  IW3.STAGE_EXTRA = [['ヒーロー、時間切れ〜！ また来てね！', 'm', 'ステージで、ヒーローが時間切れになった。うれしくて手をふる'],
    ['足もとが、動く……！', 'h', 'コンベアに乗っていて、運ばれる。少しあせる'], ['コンベアに、運ばれる……！', 'h', 'コンベアに乗っていて、運ばれる。少しあせる'],
    ['足もとが、インクで……！', 'h', 'インクだまりに足を入れてしまった。しまった、とあせる'], ['だまりに、入っちゃった……！', 'h', 'インクだまりに足を入れてしまった。しまった、とあせる'],
    ['……ワープした！', 'h', 'ワープ床で飛んで、少しおどろく'], ['ここに出るのか', 'h', 'ワープ床で飛んで、出た場所をたしかめる'], ['ワープで、とうちゃく〜！', 'm', 'ワープで飛んできて、得意げ'], ['しゅんっ！ 来たよ〜！', 'm', 'ワープで飛んできて、得意げ'],
    ['はこばれる〜', 'm', 'コンベアで運ばれて、のんきに楽しむ'], ['ごとごと〜', 'm', 'コンベアで運ばれて、のんきに楽しむ'], ['ラインは止まらないよ〜', 'm', 'コンベアで運ばれて、のんきに楽しむ']];
  // はじめからある声（HTML の中の声・となりの voice フォルダ）に、このセリフがあるか（セリフ一覧の「済」・指示書の「まだの行」に使う）
  IW3.voiceHasBase = (grp, id) => { const one = (g) => (V() && has(g, id)) || hasE(g, id); return one(grp) || ((grp === 'm1' || grp === 'm2') && one('m0')); };
  // 名前入りの型は、一覧を作らなくても使えるように、はじめに集めておく
  setTimeout(() => { try { IW3.voiceList(); } catch (e) { } }, 0);
})(typeof window !== 'undefined' ? window : globalThis);

/* ---- src/ui/voiceroom.js ---- */
// ---- インク戦闘員ウォーズ：声づくりの部屋（VOICEVOX で、セリフをまとめて声にする） ----
//   自分のパソコンで VOICEVOX を起動しておくと、このページから直接 VOICEVOX にたのんで、ぜんぶのセリフを声にする（Python はいらない）。
//   ① つなぐ：http://127.0.0.1:50021（VOICEVOX のエンジン）。game.html をファイルで開いているときは、VOICEVOX の設定で「CORS」を all にしておく。
//   ② 声をえらぶ：ヒーロー（h）と、戦闘員の3つの声（m0・m1・m2）。キャラクターとスタイル、速さ・高さ・抑揚。試し聞きできる。
//   ③ つくる：作っていないものだけ作る（途中で止めても続きから）。できた声は、このブラウザの中（IndexedDB 'inkwar-voice'）に入り、ゲームですぐ使える。
//   ④ 保存：声フォルダ（voice）として、game.html の所に書き出す（Chrome・Edge）か、voice.zip をダウンロード。ほかの人に配るときに。
//   クレジット：VOICEVOX の声は、キャラクターごとに利用規約がちがう。えらんだキャラクターの「VOICEVOX:名前」を、タイトルと voice/index.txt に入れる。
(function (W) {
  'use strict';
  const IW3 = W.IW3 = W.IW3 || {};
  const $ = (q, r) => (r || document).querySelector(q);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const GRP = [['h', 'ヒーロー'], ['m0', '戦闘員の声1'], ['m1', '戦闘員の声2'], ['m2', '戦闘員の声3']];
  const SAMPLE = { h: 'インク団め、ここから先へは行かせない！', m0: '行くよー！ えへへ、当たれ！', m1: 'え！？ うわああっ！', m2: 'やったー！ 優勝！' };
  const LSK = 'inkwar.vvox', MADEK = 'inkwar.vvox.made';
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') || d; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  const DEF = { engine: 'http://127.0.0.1:50021', rate: 24000, sp: { h: null, m0: null, m1: null, m2: null },
    tune: { h: { speed: 1.1, pitch: 0, into: 1.15 }, m0: { speed: 1.15, pitch: 0.03, into: 1.3 }, m1: { speed: 1.15, pitch: 0, into: 1.3 }, m2: { speed: 1.12, pitch: 0.05, into: 1.35 } } };
  const cfg = () => { const c = load(LSK, {}); return { engine: c.engine || DEF.engine, rate: c.rate || DEF.rate, sp: Object.assign({}, DEF.sp, c.sp || {}), tune: Object.assign({}, JSON.parse(JSON.stringify(DEF.tune)), c.tune || {}) }; };

  // ===== 声のしまい場所（このブラウザの中） =====
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((ok, bad) => { const r = indexedDB.open('inkwar-voice', 1); r.onupgradeneeded = () => r.result.createObjectStore('v'); r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error); }));
  const tx = async (mode, f) => { const d = await db(); return new Promise((ok, bad) => { const t = d.transaction('v', mode), st = t.objectStore('v'), q = f(st); t.oncomplete = () => ok(q && q.result); t.onerror = () => bad(t.error); }); };
  IW3.VSTORE = {
    put: (key, blob) => tx('readwrite', st => st.put(blob, key)),
    get: (key) => tx('readonly', st => st.get(key)),
    clear: () => tx('readwrite', st => st.clear()),
    made: () => load(MADEK, {}), // key（組/番号）→ 作ったときの声の設定（指紋）
    setMade: (m) => save(MADEK, m),
    credit: () => (load(LSK, {}).credit || ''),
  };

  // ===== セリフの一覧（ゲームの中の、声にするぜんぶのセリフ） =====
  //   戦闘員（m）のセリフは、3つの声のぶん。名前入りのセリフは、「前の言葉」「名前」「後ろの言葉」に分けてある（voice.js が続けて鳴らす）
  IW3.voiceJobs = function () {
    const L = IW3.voiceList ? IW3.voiceList() : [], out = [];
    for (const o of L) { const id = IW3.voiceId(o.text); if (o.grp === 'h') out.push({ grp: 'h', id, text: o.text }); else for (const g of ['m0', 'm1', 'm2']) out.push({ grp: g, id, text: o.text }); }
    return out;
  };
  const clean = (t) => (IW3.READING || []).reduce((s, [a, b]) => s.split(a).join(b), String(t)).replace(/♪/g, '').replace(/……+/g, '…').replace(/[！？]{2,}/g, (m) => m[0]).trim() || '…'; // 読みの辞書（voice.js の IW3.READING）を通してから
  const fp = (c, g) => { const s = c.sp[g], t = c.tune[g]; return [s && s.id, t.speed, t.pitch, t.into, c.rate].join(':'); }; // 声の設定の指紋（変えたら作り直す）

  // ===== VOICEVOX にたのむ =====
  async function vv(c, path, opt) { const r = await fetch(c.engine.replace(/\/$/, '') + path, opt); if (!r.ok) throw new Error('VOICEVOX：' + r.status + ' ' + (await r.text()).slice(0, 120)); return r; }
  async function synth(c, g, text) {
    const s = c.sp[g]; if (!s) throw new Error(GRP.find(x => x[0] === g)[1] + 'の声を、えらんでください');
    const q = await (await vv(c, '/audio_query?text=' + encodeURIComponent(clean(text)) + '&speaker=' + s.id, { method: 'POST' })).json();
    const t = c.tune[g]; q.speedScale = t.speed; q.pitchScale = t.pitch; q.intonationScale = t.into; q.outputSamplingRate = c.rate; q.prePhonemeLength = 0.05; q.postPhonemeLength = 0.08;
    return await (await vv(c, '/synthesis?speaker=' + s.id, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) })).blob();
  }

  // ===== zip（入れるだけ・圧縮なし） =====
  const CRC = (() => { const T = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; } return (u) => { let c = 0xffffffff; for (let i = 0; i < u.length; i++) c = T[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }; })();
  async function zip(files) { // files: [{name, data: Uint8Array}]
    const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
    for (const f of files) {
      const nm = enc.encode(f.name), d = f.data, crc = CRC(d), h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint32(14, crc, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true); h.setUint16(26, nm.length, true);
      parts.push(h.buffer, nm, d);
      const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint32(16, crc, true); c.setUint32(20, d.length, true); c.setUint32(24, d.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
      cen.push(c.buffer, nm); off += 30 + nm.length + d.length;
    }
    const cs = cen.reduce((a, b) => a + b.byteLength, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...cen, e.buffer], { type: 'application/zip' });
  }
  IW3.zipFiles = zip;
  // このブラウザの声（自分で録った声・VOICEVOX）と、いまの voice フォルダの声をまとめた、新しい voice フォルダの中身
  //   順番はゲームと同じ：録った声 → フォルダの声 → VOICEVOX。フォルダの声のファイルはそのまま（書き出すのは、このブラウザの声だけ）。index には両方をのせる
  async function voiceSet() {
    const M = IW3.VSTORE.made(), X = W.IW_VOICE && !W.IW_VOICE.embed ? W.IW_VOICE : null, /* HTML の中の声（embed）は書き出さない（HTML にもう入っている） */ have = { h: [], m0: [], m1: [], m2: [] }, exts = {}, files = [];
    const inDir = (g, id) => !!(X && X.have && (X.have[g] || []).includes(id));
    let useB = false, useD = false;
    for (const k in M) { const [g, id] = k.split('/'); if (!have[g]) continue; if (!/^rec/.test(M[k]) && inDir(g, id)) continue;
      const bl = await IW3.VSTORE.get(k).catch(() => null); if (!bl) continue; have[g].push(id); files.push({ path: [g, id + '.wav'], blob: bl }); useB = true; }
    if (X && X.have) for (const g in have) for (const id of X.have[g] || []) if (!have[g].includes(id)) { have[g].push(id); exts[g + '/' + id] = (X.exts && X.exts[g + '/' + id]) || X.ext || 'ogg'; useD = true; }
    const credit = [useB ? IW3.VSTORE.credit() : '', useD && X ? X.credit || '' : ''].filter(Boolean).join('、');
    return { have, exts, files, credit };
  }
  // 配る用の書き出し（pack.js）で使う：このブラウザの声がなければ、voice フォルダはさわらない
  IW3.voiceExportFiles = async function () {
    const V = await voiceSet(); if (!V.files.length) return [];
    return V.files.map(f => ({ path: ['voice', ...f.path], data: f.blob })).concat([{ path: ['voice', 'index.txt'], data: indexJs(V.have, V.credit, V.exts) }]);
  };
  const indexJs = (have, credit, exts) => 'window.IW_VOICE = ' + JSON.stringify(Object.assign({ ext: 'wav', have, credit }, exts && Object.keys(exts).length ? { exts } : {})) + ';\n';

  // ===== 部屋 =====
  IW3.voiceRoom = function (onBack) {
    const app = $('#app'); let c = cfg(), speakers = [], running = false, stop = false;
    app.innerHTML = '<div class="vroom"><div class="rhead"><b>🎙️ 声づくりの部屋（VOICEVOX）</b><span><button type="button" id="vList">📋 セリフ一覧（自分で収録する）</button> <button type="button" id="vBack">タイトルへ</button></span></div>' +
      '<section><h3>① VOICEVOX につなぐ</h3><p class="rnote">パソコンで VOICEVOX を起動してから、「つなぐ」を押す。</p>' +
      '<div class="vrow"><input type="text" id="vEng" value="' + esc(c.engine) + '"><button type="button" id="vConn">つなぐ</button></div><p class="vmsg" id="vConnMsg"></p>' +
      '<details class="vhelp"><summary>つながらないとき</summary><ol><li>VOICEVOX が起動しているか確かめる（起動している間だけ、つながる）。</li>' +
      '<li>game.html をファイルとして開いているときは、VOICEVOX が「よそのページからの呼び出し」を断っている。ブラウザで <b>http://127.0.0.1:50021/setting</b> を開き、「CORS Policy Mode」を <b>all</b> にして保存し、VOICEVOX を起動しなおす。</li>' +
      '<li>VOICEVOX の場所を変えているときは、上の欄を、その場所（例：http://127.0.0.1:50021）にする。</li></ol></details></section>' +
      '<section><h3>② 声をえらぶ</h3><div id="vGrp"></div><div class="vrow"><span>音の細かさ</span><span class="rseg"><button type="button" data-rate="24000">ふつう（24kHz）</button><button type="button" data-rate="16000">小さめ（16kHz）</button></span></div></section>' +
      '<section><h3>③ まとめて作る</h3><p class="vmsg" id="vCount"></p><div class="vbar"><i id="vBar"></i></div><p class="vmsg" id="vProg"></p>' +
      '<div class="vrow"><button type="button" class="big" id="vMake">作っていないものを、まとめて作る</button><button type="button" id="vStop" disabled>止める</button><button type="button" id="vRedo">ぜんぶ作り直す</button></div>' +
      '<p class="rnote">できた声は、このブラウザの中に入り、すぐゲームで使える（タイトルの「声」を「声ファイル」に）。途中で止めても、もう一度押せば続きから。声の設定を変えた組は、作り直しになる。</p></section>' +
      '<section><h3>④ 声フォルダとして保存（配るとき）</h3><div class="vrow"><button type="button" id="vDir">game.html のフォルダに書き出す</button><button type="button" id="vZip">voice.zip をダウンロード</button></div><p class="vmsg" id="vSaveMsg"></p>' +
      '<p class="rnote">書き出すと、game.html と同じ所に voice フォルダ（h・m0・m1・m2 と index.txt）ができる。zip のときは、ほどいて同じ所に置く。</p></section>' +
      '<section><h3>クレジット</h3><p class="vmsg" id="vCredit"></p><p class="rnote">VOICEVOX の声は、キャラクターごとに利用規約（商用利用・クレジットの書き方など）がちがう。使う声の規約を必ず読むこと。このクレジットは、タイトルと voice/index.txt に入る。</p></section></div>';
    const saveCfg = () => { const o = load(LSK, {}); Object.assign(o, c, { credit: credit() }); save(LSK, o); $('#vCredit').textContent = credit() || '（声をえらぶと、ここに出る）'; };
    const credit = () => [...new Set(GRP.map(([g]) => c.sp[g] && c.sp[g].chara).filter(Boolean))].map(n => 'VOICEVOX:' + n).join('、');
    $('#vBack').onclick = () => { stop = true; onBack && onBack(); };
    $('#vList').onclick = () => { stop = true; IW3.lineList(() => IW3.voiceRoom(onBack)); };
    const rateBtns = () => app.querySelectorAll('[data-rate]').forEach(b => b.classList.toggle('on', +b.dataset.rate === c.rate));
    app.querySelectorAll('[data-rate]').forEach(b => b.onclick = () => { c.rate = +b.dataset.rate; rateBtns(); saveCfg(); count(); });
    rateBtns();
    // ② 声の組
    const drawGrp = () => {
      const opts = (g) => '<option value="">（えらぶ）</option>' + speakers.map(s => '<optgroup label="' + esc(s.name) + '">' + s.styles.map(st => '<option value="' + st.id + '"' + (c.sp[g] && c.sp[g].id === st.id ? ' selected' : '') + '>' + esc(s.name + '（' + st.name + '）') + '</option>').join('') + '</optgroup>').join('');
      const sl = (g, k, lb, mn, mx, st) => '<label class="rsl"><span>' + lb + '</span><input type="range" data-tg="' + g + '" data-tk="' + k + '" min="' + mn + '" max="' + mx + '" step="' + st + '" value="' + c.tune[g][k] + '"><b>' + c.tune[g][k] + '</b></label>';
      $('#vGrp').innerHTML = GRP.map(([g, lab]) => '<div class="vgrp"><div class="vrow"><b>' + lab + '</b>' + (speakers.length ? '<select data-sp="' + g + '">' + opts(g) + '</select>' : '<span class="rnote">' + (c.sp[g] ? esc(c.sp[g].label) : 'つなぐと、えらべる') + '</span>') + '<button type="button" data-try="' + g + '">試し聞き</button></div>' +
        sl(g, 'speed', '速さ', 0.7, 1.6, 0.01) + sl(g, 'pitch', '高さ', -0.15, 0.15, 0.01) + sl(g, 'into', '抑揚', 0.5, 2, 0.01) + '</div>').join('');
      app.querySelectorAll('[data-sp]').forEach(el => el.onchange = () => { const id = +el.value, g = el.dataset.sp; let hit = null; for (const s of speakers) for (const st of s.styles) if (st.id === id) hit = { id, chara: s.name, label: s.name + '（' + st.name + '）' }; c.sp[g] = el.value ? hit : null; saveCfg(); count(); });
      app.querySelectorAll('[data-tg]').forEach(el => { el.oninput = () => { el.parentNode.querySelector('b').textContent = el.value; }; el.onchange = () => { c.tune[el.dataset.tg][el.dataset.tk] = +el.value; saveCfg(); count(); }; });
      app.querySelectorAll('[data-try]').forEach(b => b.onclick = async () => { const g = b.dataset.try; b.disabled = true; try { const bl = await synth(c, g, SAMPLE[g]); const a = new Audio(URL.createObjectURL(bl)); a.play(); } catch (e) { $('#vConnMsg').textContent = '試し聞きできません：' + e.message; } b.disabled = false; });
    };
    // ① つなぐ
    $('#vConn').onclick = async () => {
      c.engine = $('#vEng').value.trim() || DEF.engine; saveCfg(); const m = $('#vConnMsg'); m.textContent = 'つないでいます…';
      try { const ver = await (await vv(c, '/version')).json(); speakers = await (await vv(c, '/speakers')).json(); m.textContent = 'つながりました（VOICEVOX ' + ver + '・キャラクター ' + speakers.length + '人）';
        // はじめての人へ：まだえらんでいない組に、ちがうキャラクターを入れておく
        const flat = []; for (const s of speakers) flat.push({ id: s.styles[0].id, chara: s.name, label: s.name + '（' + s.styles[0].name + '）' });
        const used = new Set(GRP.map(([g]) => c.sp[g] && c.sp[g].chara).filter(Boolean)); let i = 0;
        for (const [g] of GRP) if (!c.sp[g] && flat.length) { let k = 0, f; do { f = flat[(i++) % flat.length]; k++; } while (used.has(f.chara) && k <= flat.length); c.sp[g] = f; used.add(f.chara); } // 4つの組に、ちがうキャラクター
        saveCfg(); drawGrp(); count();
      } catch (e) { m.innerHTML = '<b class="warn">つながりません</b>：' + esc(e.message || e) + '　下の「つながらないとき」を見てください'; }
    };
    drawGrp(); saveCfg();
    // ③ 作る
    const count = () => { const J = IW3.voiceJobs(), M = IW3.VSTORE.made(); let done = 0; for (const j of J) if (M[j.grp + '/' + j.id] === fp(c, j.grp)) done++;
      $('#vCount').textContent = 'セリフ ' + new Set(J.map(j => j.id)).size + '種類・声のファイル ' + J.length + '個のうち、できている ' + done + '個'; $('#vBar').style.width = (J.length ? done / J.length * 100 : 0) + '%'; return { J, done }; };
    count();
    const make = async (redo) => {
      if (running) return; if (!GRP.every(([g]) => c.sp[g])) { $('#vProg').textContent = '4つの組の声を、ぜんぶえらんでください（①でつなぐと、えらべる）'; return; }
      running = true; stop = false; $('#vStop').disabled = false; $('#vMake').disabled = $('#vRedo').disabled = true;
      const M = IW3.VSTORE.made(); if (redo) { for (const k in M) delete M[k]; IW3.VSTORE.setMade(M); }
      const J = IW3.voiceJobs().filter(j => M[j.grp + '/' + j.id] !== fp(c, j.grp) && !/^rec/.test(M[j.grp + '/' + j.id] || '')); // 自分で録った声（rec）は、作り直さない const t0 = performance.now(); let n = 0, err = 0;
      const worker = async () => { while (J.length && !stop) { const j = J.shift(); try { const bl = await synth(c, j.grp, j.text); await IW3.VSTORE.put(j.grp + '/' + j.id, bl); M[j.grp + '/' + j.id] = fp(c, j.grp); } catch (e) { err++; if (err > 5) { stop = true; $('#vProg').innerHTML = '<b class="warn">止まりました</b>：' + esc(e.message); } } n++;
        if (n % 5 === 0 || !J.length) { IW3.VSTORE.setMade(M); count(); const sec = (performance.now() - t0) / 1000 / n * J.length; if (!stop) $('#vProg').textContent = '作っています… あと ' + J.length + '個（約 ' + Math.ceil(sec / 60) + ' 分）'; } } };
      await Promise.all([worker(), worker()]);
      IW3.VSTORE.setMade(M); IW3.voiceRefresh && IW3.voiceRefresh(); count();
      if (!stop || !J.length) $('#vProg').textContent = '作り終わりました（' + n + '個' + (err ? '・失敗 ' + err + '個（もう一度押すと、作り直す）' : '') + '）。ゲームで、すぐ使えます。'; else if (err <= 5) $('#vProg').textContent = '止めました（続きは、もう一度押す）';
      running = false; $('#vStop').disabled = true; $('#vMake').disabled = $('#vRedo').disabled = false;
    };
    $('#vMake').onclick = () => make(false);
    $('#vRedo').onclick = () => { if (confirm('ぜんぶの声を、作り直しますか？')) make(true); };
    $('#vStop').onclick = () => { stop = true; };
    // ④ 保存
    const collect = async () => voiceSet();
    $('#vZip').onclick = async () => { const m = $('#vSaveMsg'); m.textContent = 'まとめています…';
      try { const V = await collect(), { have, files } = V; if (!files.length) { m.textContent = 'まだ声がありません（③で作る）'; return; }
        const Z = []; for (const f of files) Z.push({ name: 'voice/' + f.path.join('/'), data: new Uint8Array(await f.blob.arrayBuffer()) }); Z.push({ name: 'voice/index.txt', data: new TextEncoder().encode(indexJs(have, V.credit, V.exts)) });
        const a = document.createElement('a'); a.href = URL.createObjectURL(await zip(Z)); a.download = 'voice.zip'; a.click(); m.textContent = 'voice.zip を作りました（' + files.length + '個）。ほどいて、game.html と同じ所に置く。'; }
      catch (e) { m.textContent = '作れませんでした：' + e.message; } };
    $('#vDir').onclick = async () => { const m = $('#vSaveMsg');
      if (!W.showDirectoryPicker) { m.textContent = 'このブラウザでは、フォルダに書き出せません（Chrome・Edge なら書き出せる）。「voice.zip をダウンロード」を使ってください。'; return; }
      try { const root = await W.showDirectoryPicker({ mode: 'readwrite' }); m.textContent = '書き出しています…'; const V = await collect(), { have, files } = V; if (!files.length) { m.textContent = 'まだ声がありません（③で作る）'; return; }
        const vd = await root.getDirectoryHandle('voice', { create: true }), sub = {};
        for (const f of files) { const g = f.path[0]; sub[g] = sub[g] || await vd.getDirectoryHandle(g, { create: true }); const fh = await sub[g].getFileHandle(f.path[1], { create: true }), w = await fh.createWritable(); await w.write(f.blob); await w.close(); }
        const ih = await vd.getFileHandle('index.txt', { create: true }), w2 = await ih.createWritable(); await w2.write(indexJs(have, V.credit, V.exts)); await w2.close();
        m.textContent = '書き出しました：えらんだフォルダの中の voice（' + files.length + '個）。game.html と同じフォルダをえらんでいれば、そのまま使える。'; }
      catch (e) { m.textContent = e.name === 'AbortError' ? 'やめました' : '書き出せませんでした：' + e.message; } };
  };

  // ===== Grok などに声を頼むための指示書（台本つき）。セリフ一覧と同じ番号（tools/make_grok_brief.py と同じ中身） =====
  const BRIEF_NOTE = {'reflectExec': '幹部セレナ（クール）。盾で攻撃をはね返して、余裕たっぷりに', 'reflectHero': 'ヒーロー。攻撃をはね返されて、くやしがる', 'medicHeal': '救護係。仲間を治す。やさしく、元気に', 'healed': '治してもらって、元気になる。うれしそう', 'execHeal': '幹部ナデシコ（おっとりやさしいお姉さん）。まわりの子を治す。ゆったり、ていねいに', 'chiefGuard': '首領（チビ・のじゃ口調）。攻撃が効かなくて強がる。ちょっと涙目', 'guardMinion': '部下が首領をかばう。けなげに、きっぱり', 'chiefAwake': '首領が覚醒。ひとりぼっちになった悲しみと怒りで、力強く', 'chiefStorm': '覚醒した首領がインクの雨をふらせる。いばって', 'stormSafe': 'ヒーロー。柱のかげで助かって、ほっとする', 'stormHit': 'ヒーロー。インクの雨をあびて、あわてる', 'chiefHitHi': '首領が攻撃を受けて、いたいけど強がる', 'chiefHitLo': '首領がもう限界。泣きそうになりながら、がんばる', 'chiefEnd': '首領の最後。泣きながら、部下にあやまってはじける', 'poleGrab': 'ヒーローにつかまれて、投げられる。びっくり', 'poleStuck': '鉄柱にささって、動けない。あわてる', 'poleCrush': '上に仲間が落ちてきた。おもい、つぶれる', 'poleEndure': '鉄柱につながって、インクがもれている。弱々しく耐える', 'poleHold': '自分がはじけたら仲間がまきこまれるので、必死にがまんする。けなげに', 'poleSorry': 'がまんの限界。仲間にあやまりながら、はじけはじめる', 'poleChainHit': 'となりの柱からインクが飛んできて、こらえきれない。悲鳴', 'poleWave': 'となりがはじけて、自分の番が来る。悲鳴', 'bonusDread': '壁にはりついて動けない。破裂の波がどんどん近づいてくる。まだ無事だけど、にげられなくて悲鳴（こわがりつつ、コミカルに）', 'bonusCaught': 'とうとう自分の番が来た。半泣きの悲鳴', 'barrelHero': 'タンクの爆発に巻きこまれる。しまった、とあせる', 'barrelOh': 'となりのタンクがふるえだして、びっくり・こわがる', 'barrelChain': 'タンクがつぎつぎ爆発して、悲鳴', 'aimBarrel': 'ヒーローのそばのタンクをねらう。いたずらっぽく、わくわく', 'bossHitHi': '班長。当たっても強がる。余裕たっぷり', 'bossHitLo': '班長。だんだん苦しくなる。強がりがくずれてくる', 'bossEnd': '班長。とうとうはじける。くやしい・あわてる', 'shieldHero': '戦闘員をつかんで盾にする。悪びれず、少し余裕', 'heroOuch': 'インクを浴びて痛がる。短く、歯を食いしばる', 'fallHero': 'スライムになっていく。とまどい、力が抜けていく',
 'joined': 'スライム娘になって仲間入り。照れながら、ふにゃっと明るく', 'heroAtk': '必殺技の掛け声。短く、きっぱり、気合い', 'heroThrow': '戦闘員を投げ飛ばす。勢いよく', 'go': '攻撃の掛け声。短く元気に',
 'heroSticky': 'ねばねばインクで動きにくい。苦しそう', 'heroLv': 'スーツにスライムがしみてくる。あせり、弱っていく', 'heroWin': '勝利。凛として、ほっとする',
 'fire': '撃ちながら、はしゃぐ', 'jump': 'ジャンプして噴射する。気合い', 'hitHero': 'ヒーローに当たって大喜び', 'wide': 'よけられて、くやしい・びっくり', 'stray': '流れ弾が自分に来て、びっくり',
 'shield': 'ヒーローに盾にされて、困る・怒る', 'thrown': 'ヒーローにつかまれて、あせる', 'bump': '投げられた仲間がぶつかってきて、ひゃっとなる', 'leak': 'タンクにひびが入って、あせる',
 'burst': 'はじけた。悲鳴まじり、でもどこかコミカル', 'chain': '仲間に、はなれてと叫ぶ', 'aim': 'ねらいを定める。小声で、わくわく', 'goCannon': 'キャノン発射の掛け声。元気いっぱい',
 'oh': '当たって、びっくり（短く、高く）', 'cry': '当たって、のけぞる悲鳴', 'partSwell': '自分の武器やタンクがふくらんでいく。あせる・こわがる', 'partGone': '武器やタンクがはじけて、なくなった。泣きそう・くやしい',
 'leakNow': 'インクがもれていて、不安', 'burstNow': 'もうすぐはじけそうで、あわてる', 'sitNow': '力が抜けて、へたりこむ。弱々しく', 'flailShort': 'はじける直前、手足をばたばた。短い声',
 'flailA': 'はじける直前、手足をばたばた。いやがる', 'flailB': 'はじける直前、どんどんふくらむ。あわてる', 'flailC': 'はじける直前、もう限界。長くのばして叫ぶ', 'airSafe': 'ジャンプ中で助かった。得意げ',
 'timeNow': '限界がきて、はじける寸前', 'swell': 'ふくらんでいく。言葉にならない声', 'graze': 'かすった。ひゃっとする', 'blame': '仲間に当ててしまって、あやまる・言い合う',
 'down': 'わざと自分を撃たせる。必死・けなげ', 'self': '自爆のチャンス。張り切る', 'sticky': 'ねばねばインクを撃つ。楽しげ', 'refill': 'インクが満タンになった。少し得意げ',
 'retreat': 'ヒーローが逃げ出した。うれしい', 'weak': 'ヒーローのスーツがくずれてきた。うれしい', 'fewer': '仲間が減ってきて、不安', 'lastOnes': '残りわずか。心細い', 'win': '勝って大喜び',
 'fallMinion': 'ヒーローを追いつめた。みんなに呼びかける', 'welcome': 'スライムになったヒーローを歓迎する。うれしい', 'extra': 'そのときどきの掛け声（出撃・試合のはじめ・勝ったときなど）',};
  // ボスごとの話し方（ステージのはじまりの会話のメモ）
  const BOSS_NOTE = { '幹部ナデシコ': '幹部。おっとりやさしいお姉さん。治すのが得意。ゆったり、ていねいに', '幹部セレナ': '幹部。クールで落ちついた声。自信たっぷりに静かに', '幹部ハヤテ': '幹部。せっかちで元気。早口で、ちょっと生意気', '親衛隊長': '首領の親衛隊長。まじめで、首領が大好き。きっぱり、りりしく', '首領ノワール': '首領。チビで「〜のじゃ」と話す女の子。いばっているけど子どもっぽく、すぐ涙目' };
  IW3.voiceBrief = function () {
    const key = {}; const walk = (o, k) => { if (Array.isArray(o)) o.forEach(t => typeof t === 'string' && (key[t] = key[t] || k)); else if (o && typeof o === 'object') for (const kk in o) walk(o[kk], k + '.' + kk); else if (typeof o === 'string') key[o] = key[o] || k; };
    for (const k in (IW3.LINES || {})) walk(IW3.LINES[k], k);
    for (const t of IW3.voiceTemplates || []) { const [a, b] = t.split('〇'); key[a] = key[a] || 'name.前'; key[b] = key[b] || 'name.後'; }
    for (const n of (W.IW && W.IW.NAMES) || []) key[n] = 'name.名前';
    if (IW3.voiceList) IW3.voiceList(); const SL = IW3.stageLineInfo || {};
    const WHO = { hero: 'ヒーロー', win: 'ヒーロー', ink: '戦闘員', boss: '班長' };
    const stageNote = (i) => i.note || ('ステージ ' + i.id + '「' + i.title + '」' + (i.who === 'win' ? 'クリアのひとこと・ヒーロー：ほっとして、前を向く' : 'はじまりの会話・' + (i.who === 'boss' ? i.boss : WHO[i.who]) + '：' + (i.who === 'boss' ? (BOSS_NOTE[i.boss] || '班長。えらそうで強気、でも憎めない') : i.who === 'hero' ? '冷静に状況を見て、作戦を考える' : 'のんきで、自信まんまん')));
    for (const t in SL) if (!key[t]) key[t] = 'stage';
    const note0 = (k, t) => (k === 'stage' && SL[t] ? stageNote(SL[t]) : note(k)) + (/^（.*）$/.test(t) ? '。かっこの中は心の声：かっこは読まず、小さくつぶやく' : '');
    const note = (k) => k === 'name.名前' ? '名前だけ。人を呼ぶ調子で（このあとに「ちゃーん！」などが続く）' : k === 'name.前' ? '名前を呼ぶセリフの前半（このあとに名前が続く）' : k === 'name.後' ? '名前を呼ぶセリフの後半（この前に名前が来る）' : (BRIEF_NOTE[String(k || 'extra').split('.')[0]] || '');
    const L = IW3.voiceList ? IW3.voiceList() : [], H = L.filter(o => o.grp === 'h'), M = L.filter(o => o.grp !== 'h');
    const yomi = (t) => { const R = (IW3.READING || []).filter(([a]) => t.includes(a) && !(IW3.READING || []).some(([b]) => b !== a && b.includes(a) && t.includes(b))); return R.length ? '（読み：' + R.map(([a, b]) => a + '＝' + b).join('、') + '）' : ''; }; // 読みまちがえやすい言葉
    const row = (p, i, o) => { const n = note0(key[o.text] || 'extra', o.text) + yomi(o.text); return p + String(i + 1).padStart(3, '0') + '｜' + o.text + '｜' + (n ? '（' + n + '）' : ''); };
    const out = [
      '# インク戦闘員ウォーズ　声の収録の指示書（Grok 用）',
      '',
      '## この指示書の使い方（あなたが読む部分）',
      '1. 下の「Grok に貼る指示」を、まるごと Grok に貼る。',
      '2. つづけて、台本を少しずつ（10〜20行くらいずつ）貼って、「この行を、1行ずつ声にして」と頼む。',
      '   - 前に収録したことがあるなら、台本の前にある「まだ声がない行」だけを頼めばよい（ステージを足したときなど）。',
      '3. できた音声は、ファイル名に番号を入れて保存する（例：h001.mp3、m012.mp3）。',
      '4. ゲームの「声づくりの部屋」→「📋 セリフ一覧」→「まとめて取り込む」で、まとめて入れる。',
      '   - 戦闘員の声を1人分だけ作るときは、「取り込む先」を「3つの声とも同じ」にする。',
      '   - 3人分作るときは、声1・声2・声3 を別々に頼んで、取り込む先を変えて入れる。',
      '5. ぜんぶを Grok で作らなくてもよい。先に VOICEVOX でまとめて作り、こだわりたい行だけ Grok の声で取り込むと楽（取り込んだ声が優先される）。',
      '6. 作った声をゲームに使う・配る・売るときは、Grok の利用規約で使ってよいかを確かめること。',
      '',
      '---',
      '',
      '## Grok に貼る指示（ここから下をコピー）',
      '',
      'あなたは、ゲームのキャラクターの声を演じる声優です。これから、全年齢向けのコミカルなゲーム「インク戦闘員ウォーズ」のセリフを、1行ずつ音声にしてください。',
      '',
      '### 作品について',
      '- 悪の組織「インク団」の戦闘員たちと、ヒーロー1人のたたかい。暴力的・性的な表現はなく、明るくコミカルなノリです。',
      '- 戦闘員の正体は、女の子の姿のスライム（青や紫の肌）。インク団の首領ノワール（さみしがりの女の子）が、ふしぎなインクから作った友だちです。遊びながら「いいよ」と答えて仲間になった町の子もいます。スライムインクを撃って、ヒーローも自分たちと同じスライムにしようとしています。',
      '- ノワールは「町じゅうにインクの雨をふらせて、みんなを仲間にする大作戦」を考え、ヒーローはそれを止めにアジトへ来ます。最後はなかなおりして、インク団はそのまま続きます（あたたかい結末）。',
      '- 戦闘員は、インクがあふれると、ぷくっとふくらんで「パシャーン」とはじけて、溶けてしまいます（コミカルな退場で、こわい場面ではありません）。',
      '',
      '### 声の役',
      '- **ヒーロー**（番号が h のセリフ）：若い女性のヒーロー。凛としていて、自信があり、はきはき話す。攻撃の掛け声は短く、きっぱり。スライムになったあとのセリフ（「インク団、よろしくね♪」など）だけは、照れながら、ふにゃっと明るく。',
      '- **戦闘員**（番号が m のセリフ）：スライムの女の子たち。明るく元気で、ちょっとおっちょこちょい。悲鳴や叫びも、こわくなく、かわいくコミカルに。',
      '- **班長**（番号は m。メモに「班長」とある行）：戦闘員のまとめ役。戦闘員と同じ声で、少しえらそうで強気。でも憎めない、かわいい強がり。',
      '- **幹部**（番号は m。メモに「幹部」とある行）：戦闘員と同じ声で、ひとりずつ性格がちがう（ナデシコ＝おっとりやさしい、セレナ＝クール、ハヤテ＝せっかちで元気）。メモの性格で読む。',
      '- **首領ノワール**（番号は m。メモに「首領」とある行）：インク団のいちばんえらい人。でもチビの女の子で、「〜のじゃ」と話す。いばっているけど子どもっぽく、泣き虫。戦闘員と同じ声で、少し幼く、かわいく。',
      '- **語りや画面の文字**は、声にしません（台本に入っていません）。',
      '  - 3人分の声を作るときは、次のように声を変えてください。',
      '  - 声1：元気で高め、はきはき、テンポが速い。',
      '  - 声2：ふんわり甘め、少しのんびり。',
      '  - 声3：しっかり者で少し落ち着いた声、言い方はきびきび。',
      '',
      '### 読み方のきまり',
      '1. **1行＝1つの音声ファイル**。1つのファイルに、ほかの行を入れない。',
      '2. 書いてある言葉だけを読む。**番号やメモは読まない**。言葉を足したり、変えたりしない。',
      '3. 「……」は間をあける、「ー」は声をのばす、「！」は強く、「？」は語尾を上げる、「♪」は楽しげに（読まない）。',
      '4. 行のあとの（　）は演技のメモ。そのメモの気持ちで読む。',
      '5. 音声の前後の無音は、できるだけ短く。叫び声でも、音が割れない大きさで。',
      '6. 長さは、ほとんどの行が 0.5〜3 秒くらい。必要以上にゆっくりにしない。',
      '7. **名前を呼ぶセリフ**は、ゲームが「前の言葉」＋「名前」＋「後ろの言葉」をつなげて鳴らします。前の言葉は、このあとに名前が続くつもりで（語尾をのばさず、軽く切る）。名前だけの行は、人を呼ぶ調子で。後ろの言葉は、名前のすぐあとに続くつもりで。',
      '8. ファイル名は、行の番号にしてください（例：h001.mp3、m012.mp3）。番号をつけられないときは、作った順番がわかるようにしてください。',
      '',
      'この指示を読んだら「準備できました」とだけ答えてください。そのあと、台本を少しずつ渡します。',
      '',
      '---',
      '',
      ...(() => { // まだ声がない行（はじめからの声も、このブラウザで作った声もない行）。追加の収録は、ここだけでよい
        const made = IW3.VSTORE ? IW3.VSTORE.made() : {}, ok = (g, o) => { const id = IW3.voiceId(o.text); return !!made[g + '/' + id] || (IW3.voiceHasBase && IW3.voiceHasBase(g, id)); };
        const mh = H.map((o, i) => [o, i]).filter(([o]) => !ok('h', o)), mm = M.map((o, i) => [o, i]).filter(([o]) => !ok('m0', o));
        if (!mh.length && !mm.length) return ['## まだ声がない行', 'ありません（ぜんぶの行に声があります）。', '', '---', ''];
        return ['## まだ声がない行（追加で収録するのは、ここだけでよい）', 'ヒーロー ' + mh.length + '行・戦闘員 ' + mm.length + '行。番号は下の台本と同じです。', '',
          ...(mh.length ? ['### ヒーロー', '番号｜セリフ｜（演技メモ）', ...mh.map(([o, i]) => row('h', i, o)), ''] : []),
          ...(mm.length ? ['### 戦闘員（班長をふくむ）', '番号｜セリフ｜（演技メモ）', ...mm.map(([o, i]) => row('m', i, o)), ''] : []), '---', ''];
      })(),
      '## 台本：ヒーロー（' + H.length + '行）', '番号｜セリフ｜（演技メモ）', ...H.map((o, i) => row('h', i, o)), '',
      '## 台本：戦闘員（' + M.length + '行）', '番号｜セリフ｜（演技メモ）', ...M.map((o, i) => row('m', i, o)), '', '---',
      'この台本の番号は、ゲームの版（' + (W.IW ? W.IW.VERSION : '') + '）のセリフ一覧と同じです。ゲームを新しくしてセリフが増えると番号がずれることがあるので、取り込むときは同じ版で。'];
    return out.join('\n') + '\n';
  };
  // ===== 録った声を、ゲームの声の形（WAV・24kHz・1チャンネル）にする =====
  async function toWav(blob) {
    const AC = W.AudioContext || W.webkitAudioContext, ac = new AC(); let buf;
    try { buf = await ac.decodeAudioData(await blob.arrayBuffer()); } finally { try { ac.close(); } catch (e) { } }
    const rate = 24000, n = Math.ceil(buf.duration * rate), off = new (W.OfflineAudioContext || W.webkitOfflineAudioContext)(1, Math.max(1, n), rate), src = off.createBufferSource();
    src.buffer = buf; src.connect(off.destination); src.start(); const out = (await off.startRendering()).getChannelData(0);
    // 前後の無音を少し切る（0.02 未満が続くところ）
    let a = 0, b = out.length; while (a < b && Math.abs(out[a]) < 0.02) a++; while (b > a && Math.abs(out[b - 1]) < 0.02) b--; a = Math.max(0, a - rate * 0.03 | 0); b = Math.min(out.length, b + rate * 0.08 | 0);
    const L = Math.max(1, b - a), dv = new DataView(new ArrayBuffer(44 + L * 2)), wr = (o, t) => { for (let i = 0; i < t.length; i++) dv.setUint8(o + i, t.charCodeAt(i)); };
    wr(0, 'RIFF'); dv.setUint32(4, 36 + L * 2, true); wr(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); wr(36, 'data'); dv.setUint32(40, L * 2, true);
    for (let i = 0; i < L; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, out[a + i])) * 32767, true);
    return new Blob([dv.buffer], { type: 'audio/wav' });
  }

  // ===== セリフ一覧（自分で収録する：Grok などで録って、取り込む） =====
  //   番号：ヒーロー h001〜、戦闘員 m001〜（戦闘員のセリフは、3つの声で同じ文）。ファイル名にこの番号か、セリフの番号（v…）を入れておけば、まとめて取り込める
  //   取り込んだ声は WAV（24kHz）にして、このブラウザの中へ。VOICEVOX でまとめて作るときも、録った声は上書きしない
  IW3.lineList = function (onBack) {
    const app = $('#app'); let tab = 'h', slot = 'all', filt = 'all';
    const lines = () => { const L = IW3.voiceList ? IW3.voiceList() : [], H = [], Mn = []; for (const o of L) (o.grp === 'h' ? H : Mn).push({ text: o.text, id: IW3.voiceId(o.text) }); H.forEach((o, i) => o.no = 'h' + String(i + 1).padStart(3, '0')); Mn.forEach((o, i) => o.no = 'm' + String(i + 1).padStart(3, '0')); return { h: H, m: Mn }; };
    const slots = (t) => (t || tab) === 'h' ? ['h'] : slot === 'all' ? ['m0', 'm1', 'm2'] : [slot];
    const st = (g, id) => { const v = IW3.VSTORE.made()[g + '/' + id]; return v ? (/^rec/.test(v) ? 'rec' : 'vv') : IW3.voiceHasBase && IW3.voiceHasBase(g, id) ? 'base' : ''; }; // base：はじめから入っている声（Grok）
    const draw = () => {
      const LS = lines(), L = LS[tab], G = tab === 'h' ? ['h'] : ['m0', 'm1', 'm2'];
      const done = (o) => G.every(g => st(g, o.id)), shown = L.filter(o => filt === 'all' || (filt === 'todo' ? !done(o) : done(o)));
      const nrec = L.reduce((a, o) => a + G.filter(g => st(g, o.id) === 'rec').length, 0);
      app.innerHTML = '<div class="vroom"><div class="rhead"><b>📋 セリフ一覧（自分で収録する）</b><button type="button" id="lBack">' + (W.IW_WEB ? 'タイトルへ' : '声づくりの部屋へ') + '</button></div>' +
        '<section><p class="rnote">Grok などで声を録るときの台本です。番号（h001・m001…）をファイル名に入れて録ると、「まとめて取り込む」で、そのセリフに入ります（例：m012.mp3、h003.wav）。1つずつなら、行の「取り込む」から。取り込んだ声は WAV にして、このブラウザの中へ入り、すぐゲームで使えます（「導入したモデル・作った声を書き出す」（設定の中）で持ち出せる）。</p>' +
        '<p class="rnote">「〜ちゃーん！」のような名前を呼ぶセリフは、「前の言葉」「名前」「後ろの言葉」を別々に録ると、ゲームが続けて鳴らします。ゲームを新しくしてセリフが増えると、番号がずれることがあるので、録るときと取り込むときは同じ版で。</p></section>' +
        '<section><div class="vrow"><span class="rseg"><button type="button" data-ltab="h"' + (tab === 'h' ? ' class="on"' : '') + '>ヒーロー（' + LS.h.length + '）</button><button type="button" data-ltab="m"' + (tab === 'm' ? ' class="on"' : '') + '>戦闘員（' + LS.m.length + '）</button></span>' +
        '<span class="rseg">' + [['all', 'すべて'], ['todo', 'まだ'], ['done', 'できた']].map(([v, l]) => '<button type="button" data-lf="' + v + '"' + (filt === v ? ' class="on"' : '') + '>' + l + '</button>').join('') + '</span></div>' +
        (tab === 'm' ? '<div class="vrow"><span>取り込む先</span><span class="rseg">' + [['all', '3つの声とも同じ'], ['m0', '戦闘員の声1'], ['m1', '戦闘員の声2'], ['m2', '戦闘員の声3']].map(([v, l]) => '<button type="button" data-lslot="' + v + '"' + (slot === v ? ' class="on"' : '') + '>' + l + '</button>').join('') + '</span></div>' : '') +
        '<div class="vrow"><button type="button" id="lCopy">台本をコピー（番号つき）</button><button type="button" id="lTxt">台本をダウンロード（.txt）</button><button type="button" id="lBrief">Grok 用の指示書をダウンロード</button><button type="button" class="big" id="lBulk">まとめて取り込む</button><input type="file" id="lFiles" multiple accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm,.aac,.flac" hidden></div>' +
        '<p class="vmsg" id="lMsg">' + L.length + '行（自分で録った声 ' + nrec + '個）</p></section>' +
        '<section class="lrows">' + shown.map(o => '<div class="lrow"><span class="lno">' + o.no + '</span><span class="ltx">' + esc(o.text) + '</span><span class="lst">' + G.map(g => { const x = st(g, o.id); return '<i class="' + (x || 'no') + '" title="' + g + '">' + (g === 'h' ? '' : g.slice(1) * 1 + 1) + (x === 'rec' ? '録' : x === 'vv' ? 'V' : x === 'base' ? '済' : '－') + '</i>'; }).join('') + '</span>' +
          '<button type="button" data-lplay="' + o.id + '">▶</button><button type="button" data-lone="' + o.id + '">取り込む</button></div>').join('') + '</section>' +
        '<input type="file" id="lOne" accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm,.aac,.flac" hidden></div>';
      $('#lBack').onclick = () => onBack && onBack();
      app.querySelectorAll('[data-ltab]').forEach(b => b.onclick = () => { tab = b.dataset.ltab; draw(); });
      app.querySelectorAll('[data-lf]').forEach(b => b.onclick = () => { filt = b.dataset.lf; draw(); });
      app.querySelectorAll('[data-lslot]').forEach(b => b.onclick = () => { slot = b.dataset.lslot; draw(); });
      const script = () => L.map(o => o.no + '\t' + o.text).join('\n');
      $('#lCopy').onclick = async () => { try { await navigator.clipboard.writeText(script()); $('#lMsg').textContent = 'コピーしました（' + L.length + '行）'; } catch (e) { $('#lMsg').textContent = 'コピーできませんでした。「ダウンロード」を使ってください'; } };
      $('#lTxt').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + (tab === 'h' ? 'ヒーロー' : '戦闘員') + 'のセリフ（インク戦闘員ウォーズ ' + (W.IW ? W.IW.VERSION : '') + '）\n番号\tセリフ\n' + script() + '\n'], { type: 'text/plain' })); a.download = 'セリフ_' + (tab === 'h' ? 'ヒーロー' : '戦闘員') + '.txt'; a.click(); };
      const put = async (o, file, t) => { const wav = await toWav(file), M = IW3.VSTORE.made(); for (const g of slots(t)) { await IW3.VSTORE.put(g + '/' + o.id, wav); M[g + '/' + o.id] = 'rec:' + Date.now(); } IW3.VSTORE.setMade(M); IW3.voiceRefresh && IW3.voiceRefresh(); };
      app.querySelectorAll('[data-lplay]').forEach(b => b.onclick = async () => { const g = slots()[0], bl = await IW3.VSTORE.get(g + '/' + b.dataset.lplay).catch(() => null); if (!bl) { $('#lMsg').textContent = 'まだ声がありません'; return; } new Audio(URL.createObjectURL(bl)).play(); });
      app.querySelectorAll('[data-lone]').forEach(b => b.onclick = () => { const inp = $('#lOne'); inp.onchange = async () => { const f = inp.files[0]; if (!f) return; const o = L.find(x => x.id === b.dataset.lone); try { await put(o, f); draw(); $('#lMsg').textContent = o.no + ' に取り込みました'; } catch (e) { $('#lMsg').textContent = '取り込めませんでした（音のファイルか確かめてください）：' + e.message; } }; inp.value = ''; inp.click(); });
      $('#lBrief').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + IW3.voiceBrief()], { type: 'text/plain' })); a.download = 'Grok用_声の収録指示書_' + (W.IW ? W.IW.VERSION : '') + '.txt'; a.click(); $('#lMsg').textContent = '指示書をダウンロードしました（声の役・読み方のきまり・番号と演技メモつきの台本）'; };
      $('#lBulk').onclick = () => $('#lFiles').click();
      $('#lFiles').onchange = async () => {
        const F = [...$('#lFiles').files], msg = $('#lMsg'), LSA = lines(); let ok = 0; const miss = [];
        for (const f of F) {
          const nm = f.name.toLowerCase(), mn = nm.match(/([hm])\s*0*(\d{1,4})/), mv = nm.match(/v[0-9a-z]{4,8}/);
          let o = null, t = null; if (mn) { t = mn[1]; o = LSA[t][+mn[2] - 1] || null; }
          if (!o && mv) for (const tt of ['h', 'm']) { const x = LSA[tt].find(y => y.id === mv[0]); if (x) { o = x; t = tt; break; } }
          if (!o) { miss.push(f.name); continue; }
          msg.textContent = '取り込んでいます…（' + (ok + miss.length + 1) + '／' + F.length + '）'; try { await put(o, f, t); ok++; } catch (e) { miss.push(f.name + '（読めない）'); }
        }
        draw(); $('#lMsg').textContent = ok + '個を取り込みました' + (miss.length ? '。番号がわからず取り込めなかったもの：' + miss.slice(0, 8).join('、') + (miss.length > 8 ? ' ほか' : '') : '');
      };
    };
    draw();
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ---- src/ui/pack.js ---- */
// ---- インク戦闘員ウォーズ：導入したモデル・作った声の設定を書き出す（game.html の横に置くフォルダ。配る用） ----
//   いまのブラウザの中にある「モデルの部屋の設定・読み込んだモデルとパーツ・タイトルの設定・作った声」を、
//   models フォルダと voice フォルダに書き出す。game.html と同じ所に置くと、だれが・どのパソコン／ブラウザで開いても、はじめからその状態。
//   ファイルは .txt（中身は JavaScript）。.js だと、Windows がダウンロードした zip をほどくときに「危ないファイル」としてブロックするため。game.html は .js と .txt の両方を読む
//   models/index.txt：window.IW_MODELS = { list: [{ name, file, size, kind }], assign, settings（モデルの部屋の設定）, opt（タイトルの設定）, at }
//   models/○○.js：モデル・パーツのデータ（base64）。voice/：声（voiceroom.js と同じ形）
//   遊ぶ人が、そのブラウザでモデルの部屋やタイトルの設定を変えたら、そちらが優先（変えるまでは、フォルダの設定）。
(function (W) {
  'use strict';
  const IW3 = W.IW3 = W.IW3 || {};
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const b64 = (buf) => new Promise((ok, bad) => { const r = new FileReader(); r.onload = () => ok(String(r.result).replace(/^data:[^,]*,/, '')); r.onerror = () => bad(r.error); r.readAsDataURL(new Blob([buf])); });
  const safe = (s) => String(s || 'model').replace(/[\\/:*?"<>|\s.]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'model';

  // 書き出すファイルを集める：[{ path: ['models', 'x.js'], data: 文字列 or Blob }]
  IW3.packFiles = async function (OPT, progress) {
    const M = JSON.parse(JSON.stringify(IW3.models())), files = [], list = [], map = {}, used = new Set();
    const refs = [];
    M.minions.forEach((t, i) => { if (t.ext) refs.push([t, 'ext', 'model']); for (const [k] of IW3.GEAR_PARTS) { const g = t.gear && t.gear[k]; if (g && g.ext && g.style === 'ext') refs.push([g, 'ext', 'part']); } });
    if (M.hero && M.hero.ext) refs.push([M.hero, 'ext', 'model']);
    let n = 0;
    for (const [obj, key, kind] of refs) {
      const ref = obj[key]; if (!ref) continue;
      if (!map[ref]) {
        let nm = safe(await IW3.EXT.nameOf(ref).catch(() => '') || ref.replace(/^\w+:/, '')), base = nm, i = 2; while (used.has(nm)) nm = base + '_' + (i++); used.add(nm);
        progress && progress('モデル・パーツをまとめています…（' + (++n) + '）');
        const buf = await IW3.EXT.getBuf(ref);
        files.push({ path: ['models', nm + '.txt'], data: '(window.IW_MODEL_DATA = window.IW_MODEL_DATA || {})[' + JSON.stringify(nm) + '] = "' + await b64(buf) + '";\n' });
        list.push({ name: nm, file: 'models/' + nm + '.txt', size: buf.byteLength, kind });
        map[ref] = 'dir:' + nm;
      }
      obj[key] = map[ref];
    }
    const assign = { minions: {} }; M.minions.forEach((t, i) => { if (t.ext) assign.minions[i] = t.ext; }); if (M.hero && M.hero.ext) assign.hero = M.hero.ext;
    files.push({ path: ['models', 'index.txt'], data: 'window.IW_MODELS = ' + JSON.stringify({ list, assign, settings: M, opt: OPT || null, at: new Date().toISOString() }, null, 0) + ';\n' });
    // 声
    let voices = 0;
    if (IW3.voiceExportFiles) { progress && progress('声をまとめています…'); const V = await IW3.voiceExportFiles(); for (const f of V) files.push(f); voices = Math.max(0, V.length - 1); }
    return { files, models: list.length, voices };
  };

  // 書き出す：フォルダ（Chrome・Edge）か zip
  IW3.packDialog = function (OPT) {
    const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = '<div class="mbox"><h2>📦 導入したモデル・作った声の設定を書き出す</h2>' +
      '<p>ほかのパソコンで遊ぶときや、ほかの人に配るときに使います。</p>' +
      '<p>いまのブラウザの中にある、<b>モデルの部屋の設定</b>（型・色・服・装備・試合に出す型など）、<b>読み込んだモデルとパーツ</b>、<b>タイトルの設定</b>、<b>声づくりの部屋で作った声</b>を、<b>models</b> フォルダと <b>voice</b> フォルダに書き出します。</p>' +
      '<p>この2つのフォルダを <b>game.html と同じ所</b>に置くと、だれが・どのパソコンやブラウザで開いても、はじめからこの状態で遊べます（遊ぶ人がそのブラウザで設定を変えたら、そちらが優先）。</p>' +
      '<div class="vrow">' + (W.IW_WEB ? '' : '<button type="button" class="big" id="pDir">game.html のフォルダに書き出す</button>') + '<button type="button"' + (W.IW_WEB ? ' class="big"' : '') + ' id="pZip">zip でダウンロード</button><button type="button" id="pClose">とじる</button></div>' +
      (W.IW_MODELS && W.IW_MODELS.settings ? '<div class="vrow"><button type="button" id="pReset">このブラウザの設定を消して、フォルダの設定にもどす</button></div><p class="rnote">いまは、game.html の横の models フォルダに、配る用の設定が入っています（' + esc(String(W.IW_MODELS.at || '').slice(0, 10)) + '）。</p>' : '') +
      '<p class="vmsg" id="pMsg"></p><p class="rnote">' + (W.IW_WEB ? 'zip は、ほどいて中の models・voice を、手元の game.html と同じ所に置く。' : '「フォルダに書き出す」は Chrome・Edge で使える（game.html があるフォルダをえらぶ）。zip のときは、ほどいて中の models・voice を game.html と同じ所に置く。前の models・voice フォルダがあるときは、上書きされる。') + '</p></div>';
    document.body.appendChild(m);
    const msg = (t) => { m.querySelector('#pMsg').textContent = t; };
    m.querySelector('#pClose').onclick = () => m.remove();
    const rs = m.querySelector('#pReset'); if (rs) rs.onclick = async () => { if (!confirm('このブラウザで変えたモデルの部屋の設定とタイトルの設定を消して、フォルダの設定にもどしますか？（読み込んだモデルや作った声は消えません）')) return; await IW3.resetModels(); try { localStorage.removeItem('inkwar.opt'); } catch (e) { } location.reload(); };
    const done = (r) => 'モデル・パーツ ' + r.models + '個' + (r.voices ? '・声 ' + r.voices + '個' : '（声はなし）') + ' と、設定を書き出しました。';
    if (m.querySelector('#pDir')) m.querySelector('#pDir').onclick = async () => {
      if (!W.showDirectoryPicker) { msg('このブラウザでは、フォルダに書き出せません（Chrome・Edge なら書き出せる）。「zip でダウンロード」を使ってください。'); return; }
      try {
        const root = await W.showDirectoryPicker({ mode: 'readwrite' }); const r = await IW3.packFiles(OPT, msg); msg('書き出しています…');
        const dirs = {};
        const dirOf = async (parts) => { let d = root, key = ''; for (const p of parts) { key += '/' + p; d = dirs[key] = dirs[key] || await d.getDirectoryHandle(p, { create: true }); } return d; };
        let i = 0; for (const f of r.files) { const d = await dirOf(f.path.slice(0, -1)), fh = await d.getFileHandle(f.path[f.path.length - 1], { create: true }), w = await fh.createWritable(); await w.write(f.data); await w.close(); if (++i % 50 === 0) msg('書き出しています…（' + i + '／' + r.files.length + '）'); }
        msg(done(r) + '（えらんだフォルダの中の models・voice）');
      } catch (e) { msg(e.name === 'AbortError' ? 'やめました' : '書き出せませんでした：' + e.message); }
    };
    m.querySelector('#pZip').onclick = async () => {
      try {
        const r = await IW3.packFiles(OPT, msg); msg('zip を作っています…'); const enc = new TextEncoder(), Z = [];
        for (const f of r.files) Z.push({ name: f.path.join('/'), data: typeof f.data === 'string' ? enc.encode(f.data) : new Uint8Array(await f.data.arrayBuffer()) });
        const a = document.createElement('a'); a.href = URL.createObjectURL(await IW3.zipFiles(Z)); a.download = 'InkWar_モデルと声.zip'; a.click();
        msg(done(r) + '（InkWar_モデルと声.zip。ほどいて、中の models・voice を game.html と同じ所に置く）');
      } catch (e) { msg('作れませんでした：' + e.message); }
    };
  };
  // はじめの状態にもどす：このブラウザの中に入れたものを消す（設定だけ／ぜんぶ）
  IW3.resetDialog = function () {
    const dir = !!(W.IW_MODELS && (W.IW_MODELS.settings || (W.IW_MODELS.list || []).length)) || !!(W.IW_VOICE && !W.IW_VOICE.embed);
    const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = '<div class="mbox"><h2>🧹 はじめの状態にもどす</h2>' +
      '<p>このブラウザの中に入れたものを消して、はじめの状態にもどします。</p>' +
      '<div class="vrow"><button type="button" id="zSet">設定だけもどす</button></div><p class="rnote">モデルの部屋の設定（色・服・装備・試合に出す型など）と、タイトルの設定を消す。読み込んだモデル・パーツと、作った声は残る（また選べる）。</p>' +
      '<div class="vrow"><button type="button" class="big" id="zAll">ぜんぶ消して、もどす</button></div><p class="rnote">設定に加えて、読み込んだモデル・パーツ、声づくりの部屋で作った声と、その声の設定も消す。ゲームを入れたばかりの状態になる。</p>' +
      (dir ? '<p class="rnote"><b>注意</b>：game.html の横に models・voice フォルダ（配る用）があるので、消したあとは、そのフォルダの状態ではじまる。ゲームそのもののはじめの状態にしたいときは、そのフォルダを別の所へ移してから開く。</p>' : '') +
      '<div class="vrow"><button type="button" id="zClose">やめる</button></div></div>';
    document.body.appendChild(m);
    m.querySelector('#zClose').onclick = () => m.remove();
    const delDB = (name) => new Promise(r => { try { const q = indexedDB.deleteDatabase(name); q.onsuccess = q.onerror = q.onblocked = () => r(); } catch (e) { r(); } });
    const rmLS = (keys) => { for (const k of keys) try { localStorage.removeItem(k); } catch (e) { } };
    m.querySelector('#zSet').onclick = async () => { if (!confirm('設定を、はじめの状態にもどしますか？')) return; await IW3.resetModels(); rmLS(['inkwar.opt']); location.reload(); };
    m.querySelector('#zAll').onclick = async () => { if (!confirm('読み込んだモデル・パーツと作った声もふくめて、ぜんぶ消しますか？（もとにもどせません）')) return;
      try { if (W.speechSynthesis) speechSynthesis.cancel(); } catch (e) { }
      rmLS(['inkwar.models', 'inkwar.opt', 'inkwar.vvox', 'inkwar.vvox.made']); await delDB('inkwar'); await delDB('inkwar-voice'); location.reload(); };
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ---- src/ui/room.js ---- */
// ---- インク戦闘員ウォーズ：モデルの部屋（見た目の型を変える） ----
//   タイトルの「👗 モデルの部屋」から入る。戦闘員の型8つと、ヒーローの型を変えて、保存する（localStorage 'inkwar.models'）。
//   戦闘員の型：髪型・髪の色・肌・目・表情・服・服の色3つ。どのモードもこの8つから使う。
//     ヒーロー対決：服の色は「インク団の紫でおそろい」か「型の色」（部屋で選ぶ）。紅白戦：色だけ組の色に。個人戦：型の色そのまま。
//   ヒーローの型：髪型・髪の色・目・表情・スーツの色3つ。スーツ機能停止・変身解除・スライムの姿も、同じ髪型と顔になる。
//   外で作ったモデル（.vrm・.glb）：「外のモデルを読み込む」で読み、型やヒーローに割り当てる（ブラウザに保存）。models フォルダのモデルも選べる。
//   左（スマホは上）に3Dで見本を出す。ドラッグで回せる。変えるたびに作り直す（少し待つ）。
(function (W) {
  'use strict';
  const IW3 = W.IW3 = W.IW3 || {};
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SKINS = ['スライム青', 'スライム紫', 'スライム水色', '色白', '普通', '小麦', '褐色'];
  const EYESETS = [['tsuya', 'つやの瞳'], ['fude', '筆はねの目'], ['futamado', 'ふたつ窓の目'], ['akari', 'あかりの目'], ['kirari', 'きらりの目'], ['kira', 'きらめき大目'], ['komari', '困り顔の丸目'], ['yasashi', 'やさしい目'], ['rin', '凛の目']]; // Ink87：顔（3Dキャラ工房の目のセット）
  const EYES = ['ダークブラウン', 'ブラウン', '琥珀', 'ダークパープル', 'ボルドー', 'ダークブルー', '紫', '青', '水色', '緑', '灰', '赤', '黒', '金'];
  const FACES = ['笑顔', '不敵', 'クール', '勝気', '無邪気', 'おっとり'];
  const OUT_CAT = { lt: 'レオタード', sp: 'スポーツ', sk: 'スカート' };
  // 髪型・服の一覧に、わかりやすい呼び名をつける（「ショート3」「スポーツ9」など）
  function lists() {
    const P = YR.lookPresets, cnt = {};
    const hair = P.hair.map(h => { cnt[h.cat] = (cnt[h.cat] || 0) + 1; return [h.id, h.cat + cnt[h.cat]]; });
    const oc = {}; const outfit = P.outfit.map(o => { const c = o.id.split('_')[0]; oc[c] = (oc[c] || 0) + 1; return [o.id, (OUT_CAT[c] || c) + oc[c]]; });
    return { hair, outfit };
  }
  IW3.room = async function (onBack) {
    const app = $('#app'), T = W.RING3D.THREE, LS = lists();
    if (IW3.modelsReady) await IW3.modelsReady;
    let M = IW3.models(), tab = 0, form = 'hero', gen = 0;
    app.innerHTML = '<div class="room"><div class="rview"><canvas id="rcv"></canvas><div class="rwait" id="rwait">作っています…</div><button type="button" class="rfacebtn" id="rFace">顔に寄る</button><div class="rforms" id="rforms" hidden></div><div class="rdemo" id="rdemo"><button type="button" data-demo="walk">歩く（タプタプ）</button><button type="button" data-demo="shot">撃つ</button><button type="button" data-demo="lob">放物線で撃つ</button><button type="button" data-demo="pop">当たる</button><div class="rgstat" id="rgstat"></div></div></div>' +
      '<div class="rside"><div class="rhead"><b>👗 モデルの部屋</b><button type="button" id="rBack">タイトルへ</button></div>' +
      '<div class="ruse" id="ruse"></div><div class="rtabs" id="rtabs"></div><p class="rnote">★＝外のモデル。うすい型は、試合に出さない型。</p><div class="rform" id="rform"></div>' +
      '<div class="rfoot"><button type="button" id="rUseAll2">型1〜8をぜんぶ出す</button><button type="button" id="rReset1">この型を元に戻す</button><button type="button" id="rResetAll">ぜんぶ元に戻す</button></div>' +
      '<p class="rnote">変えたものは、すぐ保存されます。次の試合から使われます。</p></div></div>';
    // ===== 3D の見本 =====
    const cv = $('#rcv'), R = new T.WebGLRenderer({ canvas: cv, antialias: true }); R.outputColorSpace = T.SRGBColorSpace; R.setPixelRatio(Math.min(2, W.devicePixelRatio || 1));
    const sc = new T.Scene(); sc.background = new T.Color(0x1d2233);
    sc.add(new T.HemisphereLight(0xffefd9, 0x546878, 2.2)); const dl = new T.DirectionalLight(0xfff1dc, 2.2); dl.position.set(2, 4, 4); sc.add(dl);
    const floor = new T.Mesh(new T.CircleGeometry(0.9, 40), new T.MeshStandardMaterial({ color: 0x2c3348, roughness: 1 })); floor.rotation.x = -Math.PI / 2; sc.add(floor);
    const cam = new T.PerspectiveCamera(30, 1, 0.05, 50);
    let cur = null, yaw = Math.PI, drag = null, alive = true, zoom = 1, face = false, fk = 0; // face：顔に寄る（Ink89）
    const size = () => { const r = cv.parentElement.getBoundingClientRect(); R.setSize(r.width, r.height, false); cam.aspect = r.width / Math.max(1, r.height); cam.updateProjectionMatrix(); };
    addEventListener('resize', size); size();
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (!drag) return; yaw += (e.clientX - drag.x) * 0.01; drag.x = e.clientX; });
    cv.addEventListener('pointerup', () => { drag = null; });
    cv.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(0.5, Math.min(1.4, zoom * (e.deltaY > 0 ? 1.1 : 0.9))); }, { passive: false });
    $('#rFace').onclick = () => { face = !face; $('#rFace').textContent = face ? '全身を見る' : '顔に寄る'; if (face) yaw = Math.PI * Math.round(yaw / Math.PI / 2) * 2 + Math.PI; };
    const t0 = performance.now();
    const loop = () => {
      if (!alive) return; requestAnimationFrame(loop);
      const t = (performance.now() - t0) / 1000;
      fk += ((face ? 1 : 0) - fk) * 0.12; if (cur) { if (!drag && !face) yaw += 0.004; cur.root.rotation.y = yaw; const br = Math.sin(t * 2.2) * 0.02; cur.rig.pose({ C_Spine: [br, 0, 0], C_Neck: [br * 0.6, 0, 0], legs: { L: { z: -0.06 }, R: { z: 0.06 } } }); cur.root.position.y = cur.rig.hip; if (cur.gv) IW3.gearTick(cur.gv, t, demoWalk); }
      cam.position.set(0, 1.05 + 0.35 * fk, 3.4 * zoom * (1 - fk) + 0.85 * zoom * fk); cam.lookAt(0, 0.85 + 0.55 * fk, 0); R.render(sc, cam);
    };
    loop();
    // 動きの試し：歩く（タプタプ）・撃つ（引っこんで→突き出す×2〜3）・放物線（ななめ上に構える）・当たる（ふくらんで消えて、もどる）
    let demoWalk = false, demoBusy = false;
    const tw = (ms, f) => new Promise(r => { const s0 = performance.now(); const st = () => { const t = Math.min(1, (performance.now() - s0) / ms); f(t); if (t < 1) requestAnimationFrame(st); else r(); }; st(); });
    $('#rdemo').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-demo]'); if (!b) return; if (!cur || !cur.gv) { drawStat('ヒーローのタブでは、試せません'); return; } const k = b.dataset.demo, g = cur.gv;
      const any = [g.tank, g.hose, g.pack, ...(g.cannons || [])].some(o => o && o.visible && o.children[0] && (o.children[0].children.length));
      if (!any) { drawStat('動かす装備がありません（ぜんぶ、かくしているか、モデルの部品がつながっていません）'); return; }
      if (k === 'walk') { demoWalk = !demoWalk; b.classList.toggle('on', demoWalk); return; }
      if (demoBusy) return; demoBusy = true;
      try {
        if (k === 'pop') { for (const o of [g.tank, ...(g.cannons || []), g.hose].filter(o => o && o.visible)) { const s0 = o.scale.clone(); await tw(700, t => { const q = 1 + 1.4 * t * t; o.scale.set(s0.x * q, s0.y * q, s0.z * q); }); o.visible = false; o.scale.copy(s0); await tw(150, () => { }); }
          await tw(700, () => { }); for (const o of [g.tank, ...(g.cannons || []), g.hose]) if (o) o.visible = IW3.gearOf(M.minions[tab], o.userData.kind).on; }
        else for (const ex of ['cannon', 'hose']) {
          const ang = IW3.gearAngle(g, ex, k === 'lob');
          await IW3.gearFire(g, ex, { tw, ang, n: 3 });
          const t1 = g.tilt || 0; await tw(220, t => { g.tilt = t1 * (1 - t); });
        }
      } finally { demoBusy = false; }
    });
    // 見本を作り直す（続けて変えたときは、最後の1回だけ）
    async function rebuild() {
      const my = ++gen; $('#rwait').hidden = false;
      await new Promise(r => setTimeout(r, 120)); if (my !== gen || !alive) return;
      let m;
      try {
        if (tab === 8) m = await IW3.makeHeroForm(form, false, M.hero, true);
        else { const t0 = M.minions[tab], t = gearOpen && IW3.gearOf(t0, gearOpen).style === 'model' ? Object.assign({}, t0, { _zone: gearOpen }) : t0, b = await IW3.makeMinionBase('room', parseInt(t.pal[1].replace('#', ''), 16), t); m = { A: b.A, root: b.A.group, rig: IW3.Rig(b.A, b.A.group, null), gv: Object.assign({ id: 0, tilt: 0, jig: 0, gcfg: b.gear.cfg }, b.gear) };
          lastLinked = b.gear.linked || {}; drawStat(); modelNames = b.A.ext ? listNames(b.A.group) : [];
          document.querySelectorAll('[data-gnamelist]').forEach(el => { el.innerHTML = nameChips(el.dataset.gnamelist); });
          document.querySelectorAll('[data-dresslist]').forEach(el => { el.innerHTML = dressChips(el.dataset.dresslist); });
          for (const [k] of IW3.GEAR_PARTS) { const el = $('[data-glink="' + k + '"]'); if (el) el.textContent = b.gear.linked && b.gear.linked[k] != null ? '連動している部品：' + b.gear.linked[k] + '個' + (b.gear.linked[k] ? '' : '（黄色の網の中に、モデルの部品が入るように、位置と範囲を変えてください）') : ''; } }
        const tr = m.A && m.A.tris; const ti = $('#rTris'); if (ti && m.A && m.A.ext) ti.innerHTML = '三角形 ' + tr + '（40人で約' + Math.round(tr * 40 / 10000) + '万）' + (tr > 40000 ? '　<b class="warn">多め：40人並ぶと重くなるかも</b>' : '') + '・骨の読み方：' + esc(m.A.how) + '・向き：' + esc(m.A.front);
      } catch (e) { console.error(e); $('#rwait').hidden = false; $('#rwait').textContent = '作れませんでした：' + e.message; return; }
      if (my !== gen || !alive) return;
      if (cur) sc.remove(cur.root);
      cur = m; sc.add(cur.root); $('#rwait').hidden = true;
      if (tab === 8 && cur.A && cur.A.materials) setTimeout(() => form === 'slime' || IW3.slimeSkin(cur.A, form === 'civil' ? 0.55 : form === 'broken' ? 0.3 : 0), 60);
    }
    // ===== 入力 =====
    const sel = (key, L, v) => '<select data-k="' + key + '">' + L.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return '<option value="' + esc(val) + '"' + (val === v ? ' selected' : '') + '>' + esc(lab) + '</option>'; }).join('') + '</select>';
    const col = (key, v) => '<input type="color" data-k="' + key + '" value="' + esc(v) + '">';
    const row = (lab, html) => '<label class="rrow"><span>' + lab + '</span>' + html + '</label>';
    // 外で作ったモデルを選ぶ行（ゲームの体／models フォルダ／ブラウザに保存したもの）
    let EXL = [];
    const extRow = (o) => '<div class="rext"><label class="rrow"><span>モデル</span><select data-ext="1"><option value="">ゲームの体（髪型・服を選べる）</option>' +
      EXL.map(x => '<option value="' + esc(x.ref) + '"' + (o.ext === x.ref ? ' selected' : '') + '>' + esc(x.name) + '（' + esc(x.from) + '）</option>').join('') + '</select></label>' +
      '<div class="rexb"><button type="button" id="rLoad">外のモデルを読み込む（.vrm・.glb）</button>' + (o.ext && /^idb:/.test(o.ext) ? '<button type="button" id="rDel">このモデルを消す</button>' : '') + '<input type="file" id="rFile" accept=".vrm,.glb,model/gltf-binary" hidden></div>' +
      (o.ext ? '<label class="rrow"><span>前後を反転</span><span class="rseg"><button type="button" data-flip="0"' + (!o.extFlip ? ' class="on"' : '') + '>そのまま</button><button type="button" data-flip="1"' + (o.extFlip ? ' class="on"' : '') + '>反転する</button></span></label><p class="rnote">ふつうは自動で前を向く。それでも背中が前に見えるときだけ「反転する」。</p><p class="rnote" id="rTris"></p>' : '') + '</div>';
    async function loadFile(file) {
      const w = $('#rwait'); w.hidden = false; w.textContent = '「' + file.name + '」を読んでいます…';
      try {
        const buf = await file.arrayBuffer(), A = await IW3.EXT.actor(buf); // まず読めるか確かめる
        const ref = await IW3.EXT.save(file.name.replace(/\.(vrm|glb)$/i, ''), buf, { tris: A.tris, how: A.how });
        const o = tab === 8 ? M.hero : M.minions[tab]; o.ext = ref; IW3.saveModels(M); drawTabs();
        w.textContent = '読み込みました（' + A.how + '・三角形 ' + A.tris + '）';
        await drawForm(); rebuild();
      } catch (e) { console.error(e); w.textContent = '読めませんでした：' + e.message; }
    }
    // いま試合で使うもの（いちばん上に出す）
    let useGen = 0, formGen = 0;
    async function drawUse() {
      const my = ++useGen; const sm = await IW3.modelSummary();
      const el = $('#ruse'); if (!el || my !== useGen) return; // 古い答えが、あとから来たときは使わない
      el.innerHTML = '<b>試合で使う</b>　戦闘員：' + esc(sm.minions) + '　／　ヒーロー：' + esc(sm.hero) + (IW3.modelsSaveErr ? '<br><b class="warn">ブラウザの保存場所（localStorage）がいっぱいで書けませんでした。べつの場所（IndexedDB）に控えたので、このまま使えます。</b>' : '');
    }
    function drawTabs() { drawUse();
      const U = IW3.usedTypes(M);
      $('#rtabs').innerHTML = M.minions.map((t, i) => '<button type="button" data-t="' + i + '"' + (tab === i ? ' class="on"' : '') + (U.includes(i) ? '' : ' style="opacity:.45"') + '><i style="background:' + esc(t.pal[1]) + '"></i>戦闘員' + (i + 1) + (t.ext ? '★' : '') + '</button>').join('') + '<button type="button" data-t="8"' + (tab === 8 ? ' class="on"' : '') + '>🦸 ヒーロー</button>';
      $('#rtabs').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = +b.dataset.t; form = 'hero'; drawTabs(); drawForm(); rebuild(); });
    }
    // 装備の位置：部品ごとに、見せる／かくす・横・上下・前後・大きさ
    let gearOpen = null, PARTS = [], lastLinked = {};
    // 動きの試しの下：いま、それぞれの装備が何で動いているか
    const drawStat = (msg) => { const el = $('#rgstat'); if (!el) return; if (tab === 8) { el.textContent = ''; return; } const t = M.minions[tab];
      const one = ([k, lab]) => { const g = IW3.gearOf(t, k), nm = lab.replace(/（.*$/, ''); if (g.style === 'model') return nm + '：モデルの部品 ' + (lastLinked[k] || 0) + '個' + (g.pick === 'name' ? '（名前：' + (g.names || 'なし') + '）' : '（近くの部品）') + (lastLinked[k] ? '' : '・つながっていない'); if (!g.on) return nm + '：かくしている（動かない）'; return nm + '：ゲームの装備'; };
      el.innerHTML = (msg ? '<b class="warn">' + esc(msg) + '</b><br>' : '') + IW3.GEAR_PARTS.map(one).map(esc).join('<br>'); };
    // 形（標準・ほかの形・読み込んだパーツ）と、色
    const COLS = [['def', 'ふつう'], ['outfit', '服の色'], ['accent', '服の色2'], ['ink', 'インクの色'], ['skin', '肌の色']];
    let modelNames = [];
    const dressChips = (key) => modelNames.length ? '<span class="rnote">モデルの中の名前：</span>' + modelNames.map(n => '<button type="button" class="rchip" data-dressadd="' + key + '" data-v="' + esc(n) + '">' + esc(n) + '</button>').join('') : '';
    const nameChips = (k) => modelNames.length ? '<span class="rnote">モデルの中の名前：</span>' + modelNames.map(n => '<button type="button" class="rchip" data-gaddname="' + k + '" data-v="' + esc(n) + '">' + esc(n) + '</button>').join('') : '';
    const listNames = (root) => { const S = new Map(); root.traverse(o => { const n = (o.userData && o.userData.srcName) || ''; if (!n || /^(part|mesh|object|node|scene|root|armature|J_Bip_|old_J_Bip)/i.test(n) || /^\d+$/.test(n)) return; if (o.isBone) return; let c = 0; o.traverse(q => { if (q.isMesh) c++; }); if (c > 12) return; S.set(n, (S.get(n) || 0) + 1); }); /* 体ぜんぶを含む親の名前は出さない */ return [...S.keys()].slice(0, 60); };
    const sl0 = (k, key, lb, mn, mx, st, val, unit) => '<label class="rsl"><span>' + lb + '</span><input type="range" data-u="' + unit + '" data-g="' + k + '" data-gk="' + key + '" min="' + mn + '" max="' + mx + '" step="' + st + '" value="' + val + '"><b>' + (key === 's' ? Math.round(val * 100) + '%' : (val > 0 && key !== 'r' ? '+' : '') + val + unit) + '</b></label>';
    const partRows = (k, g) => {
      const cur = g.style === 'ext' ? 'ext:' + (g.ext || '') : (g.style || 'std');
      const opts = IW3.GEAR_STYLES[k].map(([v, l]) => [v, l]).concat(PARTS.map(x => ['ext:' + x.ref, '★ ' + x.name + '（読み込んだパーツ）'])).concat(M.minions[tab].ext ? [['model', '◆ モデルの部品を使う（その部品が、この動きをする）']] : []);
      const custom = /^#/.test(g.col || '');
      return '<label class="rrow"><span>形</span><select data-gstyle="' + k + '">' + opts.map(([v, l]) => '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select></label>' +
        (g.style === 'model' ? '<label class="rrow"><span>選び方</span><span class="rseg"><button type="button" data-gpick="' + k + '" data-v="name"' + (g.pick === 'name' ? ' class="on"' : '') + '>名前で</button><button type="button" data-gpick="' + k + '" data-v="near"' + (g.pick !== 'name' ? ' class="on"' : '') + '>近くの部品</button></span></label>' +
          (g.pick === 'name' ? '<label class="rrow"><span>部品の名前</span><input type="text" data-gnames="' + k + '" value="' + esc(g.names || '') + '" placeholder="例：belly（いくつかは , で区切る）"></label><div class="rnames" data-gnamelist="' + k + '">' + nameChips(k) + '</div><p class="rnote">名前に、この言葉が入っている部品（親の名前でもよい）を使う。' + (k === 'cannon' ? 'キャノンは、体のまん中より左の部品が左、右の部品が右になる。' : '') + '下の名前を押すと入る。</p>'
            : sl0(k, 'r', '範囲', 2, 30, 0.5, g.r != null ? g.r : ({ tank: 12, cannon: 10, hose: 12, pack: 14 })[k], 'cm')) + '<p class="rnote" data-glink="' + k + '">' + (lastLinked[k] != null ? '連動している部品：' + lastLinked[k] + '個' + (lastLinked[k] ? '' : (g.pick === 'name' ? '（その名前の部品が見つかりません）' : '（黄色の網の中に、モデルの部品が入るように、位置と範囲を変えてください）')) : '') + '</p>' + (g.pick === 'name' ? '' : '<p class="rnote">黄色の網の中にある、モデルの小さい部品（体や手足のような大きい形はのぞく）が、この部品の動き（タプタプ・ゆれ・撃つ・ふくらんではじける）をする。網は下の「部品を選ぶ網の場所」で動かせる。</p>') : '') +
        '<div class="rexb"><button type="button" data-gload="' + k + '">パーツを読み込む（.glb）</button>' + (g.style === 'ext' && g.ext ? '<button type="button" data-gdel="' + k + '">このパーツを消す</button>' : '') + '<input type="file" data-gfile="' + k + '" accept=".glb,.vrm,model/gltf-binary" hidden></div>' +
        (g.style === 'ext' ? '<label class="rrow"><span>向き</span><span class="rseg">' + [0, 1, 2, 3].map(r => '<button type="button" data-grot="' + k + '" data-v="' + r + '"' + ((g.rot || 0) === r ? ' class="on"' : '') + '>' + (r * 90) + '°</button>').join('') + '</span></label>' : '') +
        '<label class="rrow"><span>色</span><span class="rseg">' + COLS.map(([v, l]) => '<button type="button" data-gcol="' + k + '" data-v="' + v + '"' + ((g.col || 'def') === v ? ' class="on"' : '') + '>' + (v === 'def' && g.style === 'ext' ? 'モデルの色のまま' : l) + '</button>').join('') +
        '<input type="color" data-gcolc="' + k + '" value="' + esc(custom ? g.col : '#26222e') + '" title="えらんだ色"' + (custom ? ' class="on"' : '') + '></span></label>' +
        (k === 'cannon' || k === 'hose' ? '<label class="rrow"><span>撃つ動き</span><span class="rseg">' + [['small', '小'], ['big', '大'], ['mix', 'まぜる']].map(([v, l]) => '<button type="button" data-gmot="' + k + '" data-v="' + v + '"' + ((g.motion || 'mix') === v ? ' class="on"' : '') + '>' + l + '</button>').join('') + '</span></label><p class="rnote">小＝引っこんで、前へ突き出す。大＝もっと深く引っこんで、もっと前へ' + (k === 'cannon' ? '（その前に一度ふくらんで、元にもどる）' : '') + '。まぜる＝1回ごとに、小か大。</p>' : '') +
        (k === 'hose' ? sl0(k, 'angN', 'まっすぐ撃つ角度', -10, 30, 1, g.angN || 0, '°') + sl0(k, 'angL', '放物線の角度', 20, 65, 1, g.angL != null ? g.angL : 40, '°') + '<p class="rnote">ホースを構える角度（上向きが＋）。放物線で撃つのは、半分くらい。左下の「撃つ」「放物線で撃つ」で試せる。</p>' : '') +
        (k === 'hose' ? '<label class="rrow"><span>タンクとの管</span><span class="rseg"><button type="button" data-gtube="1"' + (g.tube !== false ? ' class="on"' : '') + '>見せる</button><button type="button" data-gtube="0"' + (g.tube === false ? ' class="on"' : '') + '>かくす</button></span></label>' : '');
    };
    const gearRows = (t) => '<div class="rgear"><div class="rgh">装備の位置<span class="rnote">（体に重なるときに。動かしても、ルールは同じ）</span></div>' +
      (t.ext ? '<div class="rexb"><button type="button" id="rUseModelGear">モデルの部品を、4つの装備にする</button><button type="button" id="rUseGameGear">ゲームの装備にもどす</button></div><p class="rnote">モデルに自分のタンク・キャノン・ホースがあるときは、上のボタンで、その部品が装備と同じ動きをする（ゲームの装備はかくれる）。部品の名前（belly・tank・brast・cannon・shaft・hose など）が見つかった装備だけ、その部品にする。名前が1つも見つからないときは、4つとも近くの部品で選ぶ。</p>' : '') + IW3.GEAR_PARTS.map(([k, lab]) => {
      const g = IW3.gearOf(t, k), moved = g.x || g.y || g.z || g.s !== 1 || g.rx || g.ry || g.rz;
      const sl = (key, lb, mn, mx, st, val, unit) => '<label class="rsl"><span>' + lb + '</span><input type="range" data-g="' + k + '" data-gk="' + key + '" min="' + mn + '" max="' + mx + '" step="' + st + '" value="' + val + '"><b>' + (key === 's' ? Math.round(val * 100) + '%' : (val > 0 ? '+' : '') + val + unit) + '</b></label>';
      const shape = g.style === 'ext' ? '読み込んだパーツ' : g.style === 'model' ? 'モデルの部品' : ((IW3.GEAR_STYLES[k].find(x => x[0] === (g.style || 'std')) || IW3.GEAR_STYLES[k][0])[1]);
      return '<details class="rgp"' + (gearOpen === k ? ' open' : '') + ' data-gp="' + k + '"><summary>' + esc(lab) + '　<i>' + (g.on ? esc(shape) + (moved ? '・動かした' : '') + (g.col && g.col !== 'def' ? '・色を変えた' : '') : 'かくした') + '</i></summary>' +
        '<span class="rseg"><button type="button" data-gon="' + k + '" data-v="1"' + (g.on ? ' class="on"' : '') + '>見せる</button><button type="button" data-gon="' + k + '" data-v="0"' + (!g.on ? ' class="on"' : '') + '>かくす</button><button type="button" data-greset="' + k + '">元の場所・角度</button></span>' +
partRows(k, g) + '<div class="rgsub">場所</div>' + sl('x', k === 'cannon' || k === 'hose' ? '外へ' : '右へ', -30, 30, 0.5, g.x, 'cm') + sl('y', '上へ', -40, 40, 0.5, g.y, 'cm') + sl('z', '前へ', -30, 30, 0.5, g.z, 'cm') +
        '<div class="rgsub">角度</div>' + sl0(k, 'rx', '前後の傾き', -180, 180, 1, g.rx || 0, '°') + sl0(k, 'ry', '左右の向き', -180, 180, 1, g.ry || 0, '°') + sl0(k, 'rz', 'ひねり', -180, 180, 1, g.rz || 0, '°') +
        (k === 'cannon' ? '<p class="rnote">キャノンは左右が鏡うつしに動く。</p>' : '') +
        '<div class="rgsub">大きさ</div>' + sl('s', '大きさ', 0.4, 2, 0.05, g.s, '') +
        (g.style === 'model' && g.pick !== 'name' ? '<div class="rgsub">部品を選ぶ網の場所</div>' + sl0(k, 'zx', k === 'cannon' || k === 'hose' ? '網を外へ' : '網を右へ', -30, 30, 0.5, g.zx || 0, 'cm') + sl0(k, 'zy', '網を上へ', -40, 40, 0.5, g.zy || 0, 'cm') + sl0(k, 'zz', '網を前へ', -30, 30, 0.5, g.zz || 0, 'cm') + '<p class="rnote">網の場所を変えると、選ぶ部品が変わる。上の「場所」は、選んだ部品そのものを動かす。</p>' : '') + '</details>';
    }).join('') + '<p class="rnote">かくしても、その部品は試合で使われる（弾は、かくした場所から出る）。</p></div>';
    // Ink89：型を切りかえたら、すぐ（一覧を待たずに）その型の欄を出す。外のモデルの一覧が読めたら、もう一度出す
    async function drawForm() {
      const my = ++formGen; await drawForm2(my, EXL || []);
      let L = EXL, P2 = PARTS; try { L = await IW3.EXT.list(); } catch (e) { } try { P2 = await IW3.EXT.listParts(); } catch (e) { }
      if (my !== formGen) return; const ch = JSON.stringify(L) !== JSON.stringify(EXL) || JSON.stringify(P2) !== JSON.stringify(PARTS); PARTS = P2 || []; if (ch) await drawForm2(my, L || []);
    }
    async function drawForm2(my, L) {
      const f = $('#rform'), fr = $('#rforms');
      if (my !== formGen) return; EXL = L;
      if (tab === 8) {
        const h = M.hero;
        f.innerHTML = extRow(h) + (h.ext ? '<p class="rnote">外のモデルのヒーローは、姿（スーツ機能停止・変身解除・スライム）が変わる代わりに、色がだんだん変わっていく。</p>' : row('髪型', sel('hair', LS.hair, h.hair)) + row('髪の色', col('hairColor', h.hairColor)) + row('顔', sel('eyeSet', EYESETS, h.eyeSet || 'rin')) + row('目の色', sel('eye', EYES, h.eye)) + row('表情', sel('base', FACES, h.base)) +
          row('スーツの色', col('pal0', h.pal[0]) + col('pal1', h.pal[1]) + col('pal2', h.pal[2]))) +
          '<p class="rnote">強化ヒーローのスーツは、金と赤のまま。スーツ機能停止・変身解除・スライムの姿も、この髪型と顔になる（左下で見られる）。</p>';
        fr.hidden = false;
        fr.innerHTML = [['hero', 'スーツ'], ['broken', 'スーツ機能停止'], ['civil', '変身解除'], ['slime', 'スライム']].map(([k, l]) => '<button type="button" data-f="' + k + '"' + (form === k ? ' class="on"' : '') + '>' + l + '</button>').join('');
        fr.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { form = b.dataset.f; drawForm(); rebuild(); });
      } else {
        const t = M.minions[tab];
        fr.hidden = true;
        const UU = IW3.usedTypes(M), on = UU.includes(tab), only = on && UU.length === 1;
        f.innerHTML = row('試合に出す', '<span class="rseg"><button type="button" data-use="1"' + (on && !only ? ' class="on"' : '') + '>出す</button><button type="button" data-use="0"' + (!on ? ' class="on"' : '') + '>出さない</button><button type="button" data-use="only"' + (only ? ' class="on"' : '') + '>この型だけ出す</button></span>') +
          '<p class="rnote">「この型だけ出す」にすると、試合の戦闘員は全員この型になる（外のモデルが効いているか、すぐわかる）。</p>' + extRow(t) + (t.ext
          ? row('スライム色に寄せる', sel('extTint', [[0, 'そのまま'], [0.2, '少し'], [0.4, 'まあまあ'], [0.6, 'しっかり']].map(([a, b]) => [String(a), b]), String(t.extTint || 0))) + row('スライムの色', sel('skin', SKINS.slice(0, 3), t.skin)) + row('インクの色', col('pal1', t.pal[1])) + '<p class="rnote">外のモデルは、髪型・服・表情はモデルのまま。装備（タンク・キャノン・ホース）は、骨の位置に合わせて自動で付く。</p>'
          : row('髪型', sel('hair', LS.hair, t.hair)) + row('髪の色', col('hairColor', t.hairColor)) + row('肌', sel('skin', SKINS, t.skin)) + row('顔', sel('eyeSet', EYESETS, t.eyeSet || 'yasashi')) + row('目の色', sel('eye', EYES, t.eye)) + row('表情', sel('base', FACES, t.base)) +
          row('服', sel('outfit', LS.outfit, t.outfit)) + row('服の色', col('pal0', t.pal[0]) + col('pal1', t.pal[1]) + col('pal2', t.pal[2])) +
          row('服・靴', '<span class="rseg"><button type="button" data-bare="0"' + (!t.bare ? ' class="on"' : '') + '>着る</button><button type="button" data-bare="1"' + (t.bare ? ' class="on"' : '') + '>ぜんぶ外す（肌の色に）</button></span>') +
          '<p class="rnote">ゲームの体の服・靴は、体にぬった色なので、外すと肌の色になる（スカート・ボタンなどの飾りはかくれる）。自分で作った服・靴に入れかえるときの下地に。服の色の2つめは、インクの色のまま。</p>') +
          (t.ext ? '<div class="rgear"><div class="rgh">服・靴などの部品</div>' +
            '<label class="rrow"><span>かくす部品</span><input type="text" data-dress="hideNames" value="' + esc(t.hideNames || '') + '" placeholder="名前（いくつかは , で区切る）"></label><div class="rnames" data-dresslist="hideNames">' + dressChips('hideNames') + '</div>' +
            '<label class="rrow"><span>肌の色にぬる部品</span><input type="text" data-dress="skinNames" value="' + esc(t.skinNames || '') + '" placeholder="名前（ペイントだけの服など）"></label><div class="rnames" data-dresslist="skinNames">' + dressChips('skinNames') + '</div>' +
            '<p class="rnote">名前に、その言葉が入っている部品（親の名前でもよい）。服や靴を外して入れかえるときに。1枚の体に絵としてかかれた服は、部品が分かれていないので、この方法では外せない。</p></div>' : '') +
          '<p class="rnote">服の色の2つめは、インクの色にもなる（個人戦）。</p>' + gearRows(t) +
          row('ヒーロー対決の服', '<span class="rseg"><button type="button" data-hc="ink"' + (M.heroModeColor === 'ink' ? ' class="on"' : '') + '>インク団の紫でおそろい</button><button type="button" data-hc="type"' + (M.heroModeColor === 'type' ? ' class="on"' : '') + '>型の色</button></span>') +
          '<p class="rnote">紅白戦では、服の色だけ組の色（赤組・白組）になる。赤組は型1・3・5・7、白組は型2・4・6・8。</p>';
        f.querySelectorAll('[data-hc]').forEach(b => b.onclick = () => { M.heroModeColor = b.dataset.hc; IW3.saveModels(M); drawForm(); });
      }
      f.querySelectorAll('[data-k]').forEach(el => el.addEventListener('change', () => {
        const o = tab === 8 ? M.hero : M.minions[tab], k = el.dataset.k;
        if (/^pal\d$/.test(k)) o.pal[+k[3]] = el.value; else if (k === 'extTint') o.extTint = +el.value; else o[k] = el.value;
        IW3.saveModels(M); if (tab !== 8) drawTabs(); rebuild();
      }));
      const xs = f.querySelector('select[data-ext]'); if (xs) xs.onchange = async () => { const o = tab === 8 ? M.hero : M.minions[tab]; o.ext = xs.value; IW3.saveModels(M); drawTabs(); await drawForm(); rebuild(); };
      f.querySelectorAll('[data-use]').forEach(b => b.onclick = () => {
        f.querySelectorAll('[data-use]').forEach(x => x.classList.toggle('on', x === b)); // 押したらすぐ光る
        const v = b.dataset.use; M.use = M.use || [true, true, true, true, true, true, true, true];
        if (v === 'only') M.use = M.use.map((x, i) => i === tab); else M.use[tab] = v === '1';
        if (!M.use.some(Boolean)) M.use[tab] = true; // ひとつは出す
        IW3.saveModels(M); drawTabs(); drawForm();
      });
      const gset = (k, fn) => { const t = M.minions[tab]; t.gear = t.gear || {}; const g = IW3.gearOf(t, k); fn(g); t.gear[k] = g; gearOpen = k; IW3.saveModels(M); };
      f.querySelectorAll('[data-gp]').forEach(d => d.addEventListener('toggle', () => { const k = d.dataset.gp, mdl = IW3.gearOf(M.minions[tab], k).style === 'model'; if (d.open) { const ch = gearOpen !== k; gearOpen = k; if (mdl && ch) rebuild(); } else if (gearOpen === k) { gearOpen = null; if (mdl) rebuild(); } }));
      f.querySelectorAll('[data-g]').forEach(el => {
        el.addEventListener('input', () => { const b = el.parentNode.querySelector('b'), v = +el.value; b.textContent = el.dataset.gk === 's' ? Math.round(v * 100) + '%' : (v > 0 && el.dataset.gk !== 'r' ? '+' : '') + v + (el.dataset.u || 'cm'); });
        el.addEventListener('change', async () => { gset(el.dataset.g, g => { g[el.dataset.gk] = +el.value; }); await drawForm(); rebuild(); });
      });
      const regear = async () => { await drawForm(); rebuild(); };
      f.querySelectorAll('[data-bare]').forEach(b => b.onclick = async () => { M.minions[tab].bare = b.dataset.bare === '1'; IW3.saveModels(M); await drawForm(); rebuild(); });
      f.querySelectorAll('[data-dress]').forEach(el => el.addEventListener('change', async () => { M.minions[tab][el.dataset.dress] = el.value.trim(); IW3.saveModels(M); await drawForm(); rebuild(); }));
      if (!f._dadd) f._dadd = true, f.addEventListener('click', async (e) => { const b = e.target.closest('[data-dressadd]'); if (!b) return; const t = M.minions[tab], k = b.dataset.dressadd, L = String(t[k] || '').split(/[,、\s]+/).filter(Boolean); if (!L.includes(b.dataset.v)) L.push(b.dataset.v); t[k] = L.join(','); IW3.saveModels(M); await drawForm(); rebuild(); });
      f.querySelectorAll('[data-gmot]').forEach(b => b.onclick = async () => { gset(b.dataset.gmot, g => { g.motion = b.dataset.v; }); await regear(); });
      f.querySelectorAll('[data-gpick]').forEach(b => b.onclick = async () => { gset(b.dataset.gpick, g => { g.pick = b.dataset.v; }); await regear(); });
      f.querySelectorAll('[data-gnames]').forEach(el => el.addEventListener('change', async () => { gset(el.dataset.gnames, g => { g.names = el.value.trim(); }); await regear(); }));
      if (!f._gadd) f._gadd = true, f.addEventListener('click', async (e) => { const b = e.target.closest('[data-gaddname]'); if (!b) return; const k = b.dataset.gaddname; gset(k, g => { const L = String(g.names || '').split(/[,、\s]+/).filter(Boolean); if (!L.includes(b.dataset.v)) L.push(b.dataset.v); g.names = L.join(','); }); await regear(); });
      const um = $('#rUseModelGear'); if (um) um.onclick = async () => { const t = M.minions[tab]; t.gear = t.gear || {}; const N = modelNames.map(n => n.toLowerCase()), DEF = { tank: ['belly', 'tank', 'タンク'], cannon: ['brast', 'breast', 'cannon', 'gun', 'キャノン'], hose: ['shaft', 'hose', 'nozzle', 'ホース'], pack: ['backpack', 'pack', 'ホールタンク'] };
        const KW = {}; for (const [k] of IW3.GEAR_PARTS) KW[k] = DEF[k].filter(w => N.some(n => n.includes(w))); const anyName = Object.values(KW).some(x => x.length);
        for (const [k] of IW3.GEAR_PARTS) { const g = IW3.gearOf(t, k); if (KW[k].length) { g.style = 'model'; g.on = true; g.pick = 'name'; g.names = KW[k].join(','); } else if (!anyName) { g.style = 'model'; g.on = true; g.pick = 'near'; } t.gear[k] = g; } /* 名前が見つかった装備だけ。1つも見つからなければ、4つとも近くの部品 */
        IW3.saveModels(M); gearOpen = 'tank'; await regear(); };
      const ug = $('#rUseGameGear'); if (ug) ug.onclick = async () => { const t = M.minions[tab]; t.gear = t.gear || {}; for (const [k] of IW3.GEAR_PARTS) { const g = IW3.gearOf(t, k); if (g.style === 'model') g.style = 'std'; t.gear[k] = g; } IW3.saveModels(M); await regear(); };
      f.querySelectorAll('[data-gstyle]').forEach(el => el.onchange = async () => { const v = el.value; gset(el.dataset.gstyle, g => { if (/^ext:/.test(v)) { g.style = 'ext'; g.ext = v.slice(4); } else { g.style = v; } }); await regear(); });
      f.querySelectorAll('[data-gload]').forEach(b => b.onclick = () => f.querySelector('[data-gfile="' + b.dataset.gload + '"]').click());
      f.querySelectorAll('[data-gfile]').forEach(inp => inp.onchange = async () => {
        const file = inp.files && inp.files[0]; if (!file) return; const k = inp.dataset.gfile, w = $('#rwait'); w.hidden = false; w.textContent = '「' + file.name + '」を読んでいます…';
        try { const buf = await file.arrayBuffer(); await IW3.EXT.parse(buf); const ref = await IW3.EXT.save(file.name.replace(/\.(glb|vrm)$/i, ''), buf, { kind: 'part' });
          gset(k, g => { g.style = 'ext'; g.ext = ref; }); w.textContent = 'パーツを読み込みました（' + file.name + '）'; await regear(); }
        catch (e) { console.error(e); w.textContent = 'パーツが読めませんでした：' + e.message; }
      });
      f.querySelectorAll('[data-gdel]').forEach(b => b.onclick = async () => { const k = b.dataset.gdel, ref = IW3.gearOf(M.minions[tab], k).ext; if (!confirm('このパーツを、ブラウザから消しますか？（使っている型は、標準の形に戻ります）')) return;
        await IW3.EXT.remove(ref); for (const t of M.minions) for (const [kk] of IW3.GEAR_PARTS) { const g = t.gear && t.gear[kk]; if (g && g.ext === ref) { g.style = 'std'; g.ext = ''; } } IW3.saveModels(M); await regear(); });
      f.querySelectorAll('[data-grot]').forEach(b => b.onclick = async () => { gset(b.dataset.grot, g => { g.rot = +b.dataset.v; }); await regear(); });
      f.querySelectorAll('[data-gcol]').forEach(b => b.onclick = async () => { gset(b.dataset.gcol, g => { g.col = b.dataset.v; }); await regear(); });
      f.querySelectorAll('[data-gcolc]').forEach(el => el.addEventListener('change', async () => { gset(el.dataset.gcolc, g => { g.col = el.value; }); await regear(); }));
      f.querySelectorAll('[data-gtube]').forEach(b => b.onclick = async () => { gset('hose', g => { g.tube = b.dataset.gtube === '1'; }); await regear(); });
      f.querySelectorAll('[data-gon]').forEach(b => b.onclick = async () => { gset(b.dataset.gon, g => { g.on = b.dataset.v === '1'; }); await drawForm(); rebuild(); });
      f.querySelectorAll('[data-greset]').forEach(b => b.onclick = async () => { gset(b.dataset.greset, g => { Object.assign(g, { on: true, x: 0, y: 0, z: 0, s: 1, rx: 0, ry: 0, rz: 0, zx: 0, zy: 0, zz: 0 }); }); await drawForm(); rebuild(); });
      f.querySelectorAll('[data-flip]').forEach(b => b.onclick = async () => { const o = tab === 8 ? M.hero : M.minions[tab]; o.extFlip = b.dataset.flip === '1'; IW3.saveModels(M); await drawForm(); rebuild(); });
      const lb = $('#rLoad'), fi = $('#rFile'); if (lb) { lb.onclick = () => fi.click(); fi.onchange = () => { if (fi.files[0]) loadFile(fi.files[0]); }; }
      const db = $('#rDel'); if (db) db.onclick = async () => { const o = tab === 8 ? M.hero : M.minions[tab]; if (!confirm('このモデルを、ブラウザから消しますか？（使っている型は、ゲームの体に戻ります）')) return; const ref = o.ext; await IW3.EXT.remove(ref); for (const t of M.minions) if (t.ext === ref) t.ext = ''; if (M.hero.ext === ref) M.hero.ext = ''; IW3.saveModels(M); await drawForm(); rebuild(); };
    }
    $('#rUseAll2').onclick = () => { M.use = [true, true, true, true, true, true, true, true]; IW3.saveModels(M); drawTabs(); drawForm(); };
    $('#rReset1').onclick = () => { const D = IW3.MODEL_DEF; if (tab === 8) M.hero = JSON.parse(JSON.stringify(D.hero)); else M.minions[tab] = JSON.parse(JSON.stringify(D.minions[tab])); IW3.saveModels(M); drawTabs(); drawForm(); rebuild(); };
    $('#rUseAll') && ($('#rUseAll').onclick = null);
    $('#rResetAll').onclick = () => { if (!confirm('戦闘員8つとヒーローを、ぜんぶ元に戻しますか？')) return; M = JSON.parse(JSON.stringify(IW3.MODEL_DEF)); IW3.saveModels(M); drawTabs(); drawForm(); rebuild(); };
    $('#rBack').onclick = () => { alive = false; removeEventListener('resize', size); R.dispose(); onBack(); };
    drawTabs(); await drawForm(); rebuild();
    IW3.roomState = () => ({ tab, form, M, ready: !!cur && $('#rwait').hidden, cur }); // テスト用
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ---- src/ui/game.js ---- */
// ---- インク戦闘員ウォーズ：画面（タイトル・対戦・ヒーローの操作・結果） ----
//   タイトル：モード（ヒーロー対決・紅白戦・個人戦）・指揮（ヒーロー／観戦）・盤（19・25・31）・40人の配置・ヒーロー（ふつう／強化）・増援・速さ。
//   ヒーローの操作：
//     動けるマス（青）を押すと動く。狙える戦闘員（赤）を押すと、攻撃の選び方が出る（ブレード・レーザーの高さ）。
//     攻撃は、移動の前と後に1回ずつ（先に動くと、後の1回だけ）。強化は3回（移動の前に2回まで）。
//     わざ（薙ぎ払い・ハレー彗星・レーザーブレイク・ホーミング）は、下のボタン。使うと3ターン休み。
//     攻撃する前なら「移動を戻す」で、動く前に戻せる。撤退中は、「端へ下がる」で自動で下がる。
(function (W) {
  'use strict';
  const IW3 = W.IW3 = W.IW3 || {};
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const OPT = { mode: 'hero', cmd: 'hero', N: 19, form: 'clump', power: false, reinforce: false, speed: 1, voice: 'file', tempo: 'slow' }; // tempo：slow じっくり（セリフで反応）／quick テンポ重視（Ink94）
  try { const o = localStorage.getItem('inkwar.opt'); if (!o && W.IW_MODELS && W.IW_MODELS.opt) Object.assign(OPT, W.IW_MODELS.opt); Object.assign(OPT, JSON.parse(o || '{}')); } catch (e) { } // 配る用フォルダの設定（このブラウザで変えるまで）
  const saveOpt = () => { try { localStorage.setItem('inkwar.opt', JSON.stringify(OPT)); } catch (e) { } };
  let GAME = null;

  // ===== タイトル =====
  // タイトル：大きなボタンは「ステージ」と「フリー対戦」だけ。フリー対戦の決めごとと、速さ・声・部屋などは、それぞれの窓にまとめる（スマホで下がつぶれないように）
  const segH = (key, L) => '<div class="seg" data-k="' + key + '">' + L.map(([v, t, dis]) => '<button type="button" data-v="' + v + '"' + (String(OPT[key]) === String(v) ? ' class="on"' : '') + (dis ? ' disabled' : '') + '>' + t + '</button>').join('') + '</div>';
  // Ink79：盤を押した指をはなした瞬間にメニューが出ると、スマホ（とくに iPhone）では、その「押した」がそのままメニューのボタンに届いて、
  //   選ぶ前に攻撃してしまう（ゴーストクリック）。メニューの上で指を置き直したときだけ、ボタンを受けつける。
  // Ink81：押せる子（戦闘員・ヒーロー・タンク・鏡）の、場所と背の高さ
  const pickList = (S) => {
    const out = [], TT = W.RING3D.THREE;
    for (const v of S.views.values()) {
      const u = v.u; if (!u || u.gone || u.stuck || !v.root || !v.root.visible || !v.root.parent) continue;
      if (!(u.kind === 'minion' || u.kind === 'hero' || u.kind === 'barrel' || u.kind === 'mirror')) continue;
      if (!v._ph) { try { const bx = new TT.Box3().setFromObject(v.root); v._ph = Math.max(0.6, Math.min(2.2, bx.max.y - Math.max(0, bx.min.y))); } catch (e) { v._ph = 1.4; } }
      out.push({ x: v.root.position.x, z: v.root.position.z, h: v._ph, gx: u.x, gy: u.y, hero: u.kind === 'hero' });
    }
    return out;
  };
  // Ink81：メニューが、ねらった子に重ならないように。子が右にいれば左へ、下にいれば上へ出す
  // Ink89：メニューが、盤の上の子（ねらった子はとくに）に、なるべく重ならない場所に出す。
  //   前は、ねらった子に重なるときだけ動かしていたので、ほかの子の上にかぶって、続けて子を押すとメニューを押してしまった
  const placeMenu = (m, u) => {
    try {
      const g = GAME; if (!g || !g.S || !g.B) return; const host = g.B.cv.getBoundingClientRect(), pts = [];
      for (const [id, v] of g.S.views) { if (!v || !v.root || v.root.visible === false) continue; const q = v.root.position.clone(); q.y = 0.8; q.project(g.B.cam); if (q.z > 1) continue;
        pts.push({ x: host.left + (q.x + 1) / 2 * host.width, y: host.top + (1 - q.y) / 2 * host.height, w: u && id === u.id ? 50 : 1 }); }
      const hudR = ['#hGoal'].map(q => document.querySelector(q)).filter(e => e && e.offsetParent).map(e => e.getBoundingClientRect()); // Ink95：目標の箱にかぶらない
      const base = { left: '', right: '', top: '', bottom: '', transform: '' };
      const C = [{}, { top: '64px', bottom: 'auto' }]; // Ink96：メニューは、いつも下のまん中。押した子にかぶるときだけ上のまん中（前は左右にも動いて、どこに出るか分からなかった）
      let best = null;
      for (const c of C) { Object.assign(m.style, base, c); const r = m.getBoundingClientRect(); let sc = 0; for (const o of hudR) if (r.left < o.right && r.right > o.left && r.top < o.bottom && r.bottom > o.top) sc += 40; for (const p of pts) if (p.x > r.left - 24 && p.x < r.right + 24 && p.y > r.top - 24 && p.y < r.bottom + 24) sc += p.w; if (!best || sc < best.sc) best = { sc, c }; if (sc === 0) break; }
      Object.assign(m.style, base, best.c);
    } catch (e) { }
  };
  const menuOk = (m) => !!(m._armed && (m._armed.ok || performance.now() - m._armed.t > 350)); // Ink96：開いてすぐ（同じ押しの続き）だけ受けない
  const armMenu = (m) => { if (!m._armed) { m._armed = { ok: false, t: performance.now() }; m.addEventListener('pointerdown', () => { if (performance.now() - m._armed.t > 120) m._armed.ok = true; }); } };
  const bindSeg = (root, after) => root.querySelectorAll('.seg').forEach(sg => sg.addEventListener('click', e => {
    const b = e.target.closest('button[data-v]'); if (!b || b.disabled) return;
    const k = sg.dataset.k, raw = b.dataset.v; OPT[k] = raw === 'true' ? true : raw === 'false' ? false : isNaN(+raw) ? raw : +raw;
    sg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); saveOpt(); after && after();
  }));
  const unlockAudio = () => { IW3.sfxInit && IW3.sfxInit(); if (W.speechSynthesis) { try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance('')); } catch (e) { } } }; // スマホは、押したときに一度声を出しておかないと、あとでしゃべれない
  function title() {
    const app = $('#app');
    IW3.voiceMode && IW3.voiceMode(OPT.voice);
    app.innerHTML = '<div class="title"><div class="logo"><div class="splat"></div><h1>インク戦闘員<br><b>ウォーズ</b></h1><p>スライム戦闘員40人 対 ヒーロー。マス目の上で、インクを撃ちあう連鎖パズルバトル</p></div>' +
      '<div class="tcard tmain">' +
      '<button type="button" class="tbig" id="tStage"><b>🗺️ ステージ</b><small>インク団のアジトを、奥へ進む</small></button>' +
      '<button type="button" class="tbig free" id="tStart"><b>⚔️ フリー対戦</b><small>ヒーロー対決・紅白戦・個人戦</small></button>' +
      '<div class="tsub"><button type="button" id="tRule">📘 遊び方</button><button type="button" id="tSet">⚙️ 設定</button><button type="button" id="tLang">' + (IW3.lang === 'en' ? '🌐 日本語' : '🌐 English') + '</button></div>' +
      '<p class="tnote tcredit" id="tCredit"></p>' +
      '</div><div class="ver">Ver. ' + IW.VERSION + '　すべて架空の作品です</div></div>';
    $('#tStart').onclick = freeDialog;
    $('#tStage').onclick = () => { unlockAudio(); stageSelect(); };
    $('#tRule').onclick = rules;
    $('#tSet').onclick = settingsDialog;
    $('#tLang').onclick = () => IW3.setLang && IW3.setLang(IW3.lang === 'en' ? 'ja' : 'en'); // 英語版（i18n.js）：言葉を切りかえて、読みなおす
    { const cr = (IW3.VSTORE && IW3.voiceCount && IW3.voiceCount() && IW3.VSTORE.credit()) || (W.IW_VOICE && W.IW_VOICE.credit) || ''; const el = $('#tCredit'); if (el) el.textContent = cr ? '声：' + cr : ''; }
  }
  // フリー対戦の決めごと → 対戦開始
  function freeDialog() {
    const m = modal('<h2>⚔️ フリー対戦</h2><div class="tform">' +
      '<label>モード</label>' + segH('mode', [['hero', '🦸 ヒーロー対決'], ['team', '🔴⚪ 紅白戦'], ['solo', '🎯 個人戦']]) +
      '<p class="tnote" id="tNote"></p>' +
      '<label>操作</label>' + segH('cmd', [['hero', '自分で操作'], ['watch', '観戦（AI どうし）']]) +
      '<label>並べ方</label>' + segH('form', [['clump', '塊'], ['rows', '整列'], ['spaced', '間隔'], ['random', 'ばらばら']]) +
      '<label>盤の広さ</label>' + segH('N', [[19, '19マス'], [25, '25マス'], [31, '31マス']]) +
      '<div id="tHeroOpt"><label>ヒーロー</label>' + segH('power', [[false, 'ふつう'], [true, '強化ヒーロー']]) +
      '<label>増援</label>' + segH('reinforce', [[false, 'なし'], [true, '四隅に毎ターン']]) + '</div>' +
      '</div><div class="tbtns"><button type="button" class="big" id="tGo">対戦開始！</button></div>');
    const note = () => {
      const t = { hero: 'ヒーロー1人 対 スライム戦闘員40人。「自分で操作」はヒーローを動かす。', team: 'ヒーローをたおすために、仲間どうしで鍛え合う。赤組20人 対 白組20人。「自分で操作」は赤組を1人ずつ指揮する。相手を全滅させた組の勝ち。', solo: '40人全員が敵どうしのバトルロイヤル。最後まで残った1人が優勝。「自分で操作」は、1人（頭の上に黄色い矢印）を動かす。動く順は、ラウンドごとにくじ引き。' }[OPT.mode];
      $('#tNote', m).textContent = t; $('#tHeroOpt', m).style.display = OPT.mode === 'hero' ? '' : 'none';
    };
    bindSeg(m, note); note();
    $('#tGo', m).onclick = () => { m.remove(); unlockAudio(); start(); };
  }
  // 設定：速さ・声・使うモデル、それと部屋や書き出し
  function settingsDialog() {
    const m = modal('<h2>⚙️ 設定</h2><div class="tform">' +
      '<label>テンポ</label>' + segH('tempo', [['slow', '💬 じっくり（セリフで反応）'], ['quick', '⚡ テンポ重視（パズルのように速く）']]) +
      '<label>速さ</label>' + segH('speed', [[0.55, '速い'], [1, 'ふつう'], [1.6, 'ゆっくり']]) +
      '<label>声</label>' + segH('voice', [['file', '声ファイル（なければ読み上げ）'], ['tts', '読み上げ'], ['off', 'なし']]) + '<p class="tnote" id="tVoice"></p>' +
      '<p class="tnote" id="tModel"></p>' +
      '</div><div class="tlist"><button type="button" id="tRoom">👗 モデルの部屋</button><button type="button" id="tVoiceRoom">' + (W.IW_WEB ? '🎙️ 声の取り込み' : '🎙️ 声づくりの部屋') + '</button><button type="button" id="tPack">📦 導入したモデル・作った声を書き出す</button><button type="button" id="tReset">🧹 はじめの状態にもどす</button></div>');
    const note = () => {
      IW3.voiceMode && IW3.voiceMode(OPT.voice);
      IW3.tempo = OPT.tempo || 'slow';
      const $ = (q) => m.querySelector(q);
      const vn = $('#tVoice'); if (vn) vn.textContent = OPT.voice === 'off' ? '' : (IW3.voiceCount && IW3.voiceCount() ? '声づくりの部屋で作った声があります（' + IW3.voiceCount() + '個）。' : W.IW_VOICE ? '声ファイルが入っています（' + Object.values(W.IW_VOICE.have || {}).reduce((a, b) => a + b.length, 0) + '個）。' : '声ファイルはまだないので、端末の読み上げでしゃべります。') + (W.speechSynthesis ? '' : '（この端末は読み上げに対応していません）');
    };
    bindSeg(m, note); note();
    IW3.modelSummary && Promise.resolve(IW3.modelsReady).then(() => IW3.modelSummary()).then(sm => { const el = m.querySelector('#tModel'); if (el) el.innerHTML = '<b>使うモデル</b>（モデルの部屋で変える）：戦闘員＝' + esc(sm.minions) + '　／　ヒーロー＝' + esc(sm.hero); }).catch(() => { });
    const go = (f) => () => { m.remove(); f(); };
    $('#tRoom', m).onclick = go(() => IW3.room(title));
    $('#tVoiceRoom', m).onclick = go(() => W.IW_WEB ? IW3.lineList(title) : IW3.voiceRoom(title)); // 投稿サイトでは、VOICEVOX につなぐ部屋は出さず、セリフ一覧（録った声の取り込み）だけ
    $('#tPack', m).onclick = go(() => IW3.packDialog(Object.assign({}, OPT)));
    $('#tReset', m).onclick = go(() => IW3.resetDialog());
  }
  function rules() {
    const credit = (IW3.voiceCount && IW3.voiceCount() && IW3.VSTORE.credit()) || (W.IW_VOICE && W.IW_VOICE.credit) || '';
    modal('<h2>遊び方</h2>' + (credit ? '<p class="tnote">声：' + esc(credit) + '</p>' : '') +
      '<p><b>ヒーロー1人</b>と、インク団の<b>スライム戦闘員40人</b>の対決です。戦闘員の正体は、女の子の姿に変身したスライム。<b>スライムインク</b>を撃って、ヒーローも自分たちと同じスライムにしようとしています。ヒーローは、戦闘員のインクタンクをはじけさせて、もとの小さなスライムに戻します。</p>' +
      '<h3>戦闘員の体</h3><ul><li><b>ツインキャノン</b>（肩）：射程は満タンのとき3、ふだん2。相手のキャノンをつぶすと1ずつ伸びる（最大4）。左右で2人まで撃てる。</li>' +
      '<li><b>ロングホース</b>（右手）：射程3。1ターンたつと4、撃つたびに1ずつ伸びる（最大5）。</li>' +
      '<li><b>ジャンプ噴射</b>（背中のホールタンク）：タンクの下の穴（ホール）からインクを噴いて跳び、自分のまわりの凸の形（前と左右）を一気にインクまみれにする。ヒーローに当たればインク5回分。<b>ジャンプ中は、どこから撃たれても即はじける</b>。はじけた相手の飛沫は、宙に浮いて離れているので、届くかは運次第（半々）。届けば自分もはじける。</li>' +
      '<li><b>ベリータンク</b>（お腹）：はじめは<b>満タン</b>（満タンは、このタンクのこと）。満タンのベリータンクに当たると、たいてい即はじけて、隣の満タンの子まで<b>連鎖</b>する。撃つと満タンは解ける。2巡撃たないと、また満タンになる。キャノンやホースに当たったときは、満タンでも、こわれてインク漏れになるだけ。</li></ul>' +
      '<h3>インク漏れ</h3><p>当たっても、満タンでなければ「インク漏れ」。当たった部分が使えなくなる。2ターンまでもつ（1ターン目の終わりにペタン座りになって動けなくなり、2ターン目の終わりにはじける）。もう1発当たると即はじける。ヒーローの隣でインク漏れになった子は、仲間に撃ってもらって自爆し、ヒーローにインク5回分を浴びせることがある。</p>' +
      '<h3>背中</h3><p>背中側からは、表のキャノン・タンク・ホースには当たらない。<b>真後ろの一直線</b>からだけ、背中のホールタンクをねらえる（半分の確率で、即はじける）。</p>' +
      '<h3>ヒーロー</h3><ul><li>移動5マス。攻撃は<b>移動の前と後に1回ずつ</b>（先に動くと、後の1回だけ）。</li><li><b>ブレード</b>：隣の1人。背中からなら一刀。表からなら両断して、その先の1人にも衝撃波。</li>' +
      '<li><b>レーザー</b>：10マス。縦か横の一直線なら<b>貫通</b>（狙った高さの部分がある子すべてに当たる）。</li><li><b>わざ</b>：薙ぎ払い（隣8マス）・ハレー彗星（一直線10マス）。強化ヒーローは、レーザーブレイク（5マス以内の全員）とホーミングも使える。使うと3ターン休み。</li>' +
      '<li>スーツの<b>よごれ</b>（浴びたスライムインク）：50をこえると肌がだんだん青くなる。55で不調（撤退を始める。端に着いて2ターンで去る）・60でスーツ機能停止・70で変身解除・80でたおれて、<b>スライムになってインク団の仲間入り</b>。</li></ul>' +
      '<h3>同士討ち</h3><p>外れた弾・かわされた弾は、ヒーローの向こうへ飛んでいき、そこにいる仲間に当たることがある。</p>' +
      '<h3>勝ち負け</h3><p>ヒーローは、戦闘員を全員はじけさせれば勝ち。戦闘員は、ヒーローを撤退させるか、たおせば勝ち。</p>' +
      '<h3>ステージ</h3><p>タイトルの「🗺️ ステージ」。ヒーローが1人で、インク団のアジトを奥へ進む。面ごとに、決まった並びの戦闘員を<b>決まったターンのうちに全員はじけさせれば</b>クリア（★1）。面ごとの目標2つを満たすと★がふえる（最大★3）。よごれは面ごとに0から。負けたら、その面をやり直す。クリアすると次の面が開く。クリアした面は、何度でも遊べる。</p>' +
      '<p><b>アジト第2層：インクのタンク置き場</b>　盤の上の<b>インクタンク</b>は、撃つ・斬る・飛沫がかかると大爆発する。まわり1マスの戦闘員は即はじけ、2マスの戦闘員には飛沫がかかる。2マス以内のほかのタンクも誘爆する。ヒーローも、1マスならよごれ6、2マスならよごれ3。後半の戦闘員は、ヒーローのそばのタンクを撃ってくる。第2層の班長は、何回か当てないとはじけない（タンクの爆発や飛沫でも1回）。</p>' +
      '<p><b>アジト第9層：首領の間</b>　これまでのしかけが全部そろう最後の層。いちばん奥には<b>首領ノワール</b>（頭に金の王冠のチビ）。<b>部下が1人でも残っているあいだは、首領に攻撃は効かない</b>。部下をみんなはじけさせると、首領が<b>覚醒</b>して大きくなり、体力が増え、2ターンに1回<b>インクの雨</b>を降らせる（よごれ+3。<b>柱や壁のかげ</b>にいれば当たらない）。覚醒した首領は、こちらに近づかずに逃げ回る。</p>' +
      '<p><b>特別ステージ：首領の間への通路</b>　この面だけ、ヒーローは<b>となりの戦闘員をつかんで、鉄柱へ放り投げる</b>（4マス以内のいちばん近い鉄柱。攻撃1回ぶん。この面は攻撃が1つの番に3回）。鉄柱につながった子は、もう動けない。全員を、はじけさせるか鉄柱につなげばクリア。</p>' +
      '<p><b>アジト第8層：ワープの実験室</b>　同じ色に光る輪は<b>ワープ床</b>（2つでひと組）。上で止まると、<b>もう一方へ飛ぶ</b>（ヒーローも戦闘員も。出口にだれかいれば飛ばない）。ワープ床にレーザーを撃つと、<b>もう一方から同じ向きに</b>出ていく（鏡と組み合わせることも）。第8層の幹部は<b>すばやい</b>（1つの番に2回動く）。</p>' +
      '<p><b>アジト第7層：鏡の回廊</b>　ななめの板は<b>鏡</b>。一直線に見えている鏡にレーザーを当てると、<b>直角に曲がって</b>つらぬく（鏡から鏡へ、全部で10マスまで）。当たり方は、曲がってきた向きで決まるので、正面を向いた子の横や、うしろ向きの子の正面からも当てられる。鏡は通れず、戦闘員の弾・流星・爆風は止まる。第7層の幹部は<b>はね返しの盾</b>（正面からのレーザー・ブレードをはね返す）。</p>' +
      '<p><b>アジト第6層：救護係の医務室</b>　頭の上に白い十字の子は<b>救護係</b>。となりのインク漏れの仲間を<b>治して</b>しまう（こわれた武器やタンクも元どおり）。先に救護係をねらおう。第6層の最後は<b>幹部</b>。幹部は班長より大きく、ピンクの印。</p>' +
      '<p><b>アジト第5層：地下水路のインクだまり</b>　床の紫の水たまりは<b>インクだまり</b>。ヒーローが通ると<b>1マスごとによごれ+1</b>（紫に光る行き先は、だまりを通る）。戦闘員がはじけた所・タンクの爆発のまわりに、新しいだまりができる。だまりの上の戦闘員は、毎ターン<b>満タン</b>になる（連鎖のチャンスにも）。</p>' +
      '<p><b>アジト第4層：インク工場のコンベア</b>　光る矢印の床は<b>ベルトコンベア</b>。戦闘員の番が終わるたびに、上にいる戦闘員・ヒーロー・タンクを1マス運ぶ。作業員は持ち場から歩かないが、コンベアには運ばれる。運ばれて一列にそろう・タンクのそばに集まるのを<b>待つのも作戦</b>。ヒーローも運ばれるので注意。</p>' +
      '<p><b>ボーナス：固定砲台部隊</b>　壁にはりついた25人。だれでもいいので一撃を……。</p>' +
      '<p><b>アジト第3層：柱の倉庫</b>　盤の上の<b>柱</b>は通れない。レーザー・戦闘員の弾・ハレー彗星は柱で止まり、タンクの爆風も柱のかげにはとどかない。柱のかげで番を終えると撃たれにくい。回りこんで、ねらいの通る場所をさがそう。</p>' +
      '<h3>紅白戦</h3><p>ヒーローをたおすために、仲間どうしで鍛え合う。<b>赤組20人 対 白組20人</b>。赤と白が<b>1人ずつ交互に</b>動く（先に動く組は、ラウンドごとに入れかわる）。相手を全員はじけさせた組の勝ち。</p><ul><li>武器で戦うが、<b>その武器が弱点</b>。キャノンの弾は相手のキャノンに、ホースの弾は相手のホース（腰）に当たる。当たった武器はこわれて、インク漏れ（満タンかどうかは関係ない）。</li><li>その武器がもうない相手には、弾はお腹の<b>ベリータンク</b>に当たる。ベリータンクはただの弱点で、満タンなら、たいてい即はじける。</li><li>背中側からは表に当たらない。真後ろの一直線からだけ、背中のホールタンクをねらえる。撃つと、相手の方を向くので、ほかの相手に背中を見せることになる。</li><li>戦闘員どうしの弾は8割当たる。それた弾は相手の向こうへ飛び、そこにいる子（味方でも）に当たることがある。</li><li>紅白戦は、赤組の子を押して選び、青いマスで動く・赤い相手を押して撃つ。「この子はおわり」「残りはおまかせ」。</li></ul>' +
      '<h3>個人戦</h3><p><b>40人全員が敵どうしのバトルロイヤル</b>。最後まで残った1人が優勝。動く順は、ラウンドごとにくじ引きで、1人ずつ。自分は、頭の上に黄色い矢印の子。ルール（武器が弱点・背中・満タン・インク漏れ）は紅白戦と同じ。</p>' +
      '<h3>カメラ</h3><p>ドラッグで盤を動かす。右ドラッグ（スマホは2本指）で角度。ホイール（スマホはピンチ）で寄る・引く。</p>');
  }
  function modal(html) {
    const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = '<div class="mbox">' + html + '<div class="mclose"><button type="button">閉じる</button></div></div>';
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('.mclose button')) m.remove(); });
    document.body.appendChild(m); return m;
  }

  // ===== 対戦 =====
  async function start(def) {
    if (!def && (OPT.mode === 'team' || OPT.mode === 'solo')) return startTeam();
    IW3.speed = OPT.speed; IW3.tempo = OPT.tempo || 'slow';
    const app = $('#app');
    app.innerHTML = '<div class="game"><div class="stage" id="stage"></div>' +
      '<div class="hud"><div class="hbox"><b id="hTurn">ターン 1</b><span id="hSide"></span></div>' +
      '<div class="hbox"><span>戦闘員</span><b id="hCount">40</b><small id="hCount0">/' + 40 + '</small></div>' +
      '<div class="hbox gauge"><span>ヒーローのよごれ <b id="hInk">0</b><small id="hLv">ふつう</small></span><div class="bar"><i id="hBar"></i><em style="left:68.75%" data-t="55撤退"></em><em style="left:75%" data-t="60"></em><em style="left:87.5%" data-t="70"></em><em style="left:100%" data-t="80"></em></div></div>' +
      '<div class="hbtns"><button type="button" id="hTempo" class="lbl' + (IW3.tempo === 'quick' ? ' on' : '') + '" title="テンポ（じっくり／テンポ重視）"><span>' + (IW3.tempo === 'quick' ? '⚡' : '💬') + '</span><small>テンポ</small></button><button type="button" id="hSpeed" class="lbl" title="速さ"><span>⏩</span><small>速さ</small></button><button type="button" id="hCam">全体</button><button type="button" id="hMenu">☰</button></div>' + (def ? '<div class="hgoal" id="hGoal"></div>' : '') + '</div>' +
      '<div class="banner" id="banner"></div><div class="panel" id="panel" hidden></div><div class="tip" id="tip" hidden></div>' +
      '<div class="loading" id="loading"><div class="spin"></div><p id="ldText">準備中…</p></div></div>';
    const G = def ? IW.newStage(def) : IW.newMatch({ seed: 'ink' + Date.now(), N: OPT.N, form: OPT.form, count: 40, power: OPT.power, reinforce: OPT.reinforce });
    const B = IW3.Board.create($('#stage'), G.N);
    const tall = innerWidth / Math.max(1, innerHeight) < 0.8; // スマホの縦長：少し引く
    B.lookAt(0, (G.N - 1) / 2 * 0.25, G.N * (tall ? 1.65 / 1.4 : 1.14), true); B.camGoal.d = B.CAM.d; // Ink81：上から見る角度にしたぶん、少し引く
    let S;
    try { S = await IW3.Stage.create(B, G, (t) => { $('#ldText').textContent = t; }); }
    catch (e) { console.error(e); $('#ldText').textContent = '3Dの準備に失敗しました：' + e.message; return; }
    $('#loading').remove();
    const hud = makeHud(G);
    if (!def) IW3.modelSummary && IW3.modelSummary().then(sm => { if (sm.ext) setTimeout(() => hud.toast('使うモデル：戦闘員＝' + sm.minions + '／ヒーロー＝' + sm.hero), 2600); });
    GAME = { G, B, S, hud, quit: false, stage: def || null, auto: !!(def && DEEP && DEEP.auto && DEEP.id === def.id), deep: !!(def && DEEP && DEEP.id === def.id) }; // deep：確認用の入口から（記録しない）
    if (def) { $('#hCount0').textContent = '/' + G.count0; hud.update(); hud.goal(); hud.turn(1, 'hero'); }
    { const tb = $('#hTempo'), show = () => { tb.querySelector('span').textContent = IW3.tempo === 'quick' ? '⚡' : '💬'; tb.classList.toggle('on', IW3.tempo === 'quick'); }; show(); let last = 0;
      tb.onclick = () => { const now = performance.now(); if (now - last < 500) return; last = now; /* Ink95：重いときの二度押しで、もどらないように */ IW3.tempo = OPT.tempo = IW3.tempo === 'quick' ? 'slow' : 'quick'; saveOpt(); show(); hud.toast(IW3.tempo === 'quick' ? '⚡ テンポ重視：連鎖を続けて速く。セリフは大事なところだけ' : '💬 じっくり：一人ひとりが、セリフで反応'); }; }
    $('#hSpeed').onclick = () => { const L = [0.55, 1, 1.6], i = (L.indexOf(IW3.speed) + 1) % L.length; IW3.speed = OPT.speed = L[i]; saveOpt(); hud.toast('速さ：' + ['速い', 'ふつう', 'ゆっくり'][i]); };
    $('#hCam').onclick = () => { B.unlock(); B.view(0, IW3.CAM_PH || 0.86, G.N * (innerWidth / Math.max(1, innerHeight) < 0.8 ? 1.7 : 1.14)); B.lookAt(0, (G.N - 1) / 2 * 0.25); B.CAM.lock = true; }; // Ink97：全体にしたら、ヒーローについていかない（前は、すぐ寄りもどっていた）。次のヒーローの番で、もとにもどる
    $('#hMenu').onclick = () => { const m = modal('<h2>メニュー</h2>' + (def ? stageCard(def) : '') + '<div class="tbtns">' + (def ? '<button type="button" id="mRetry">やり直す</button><button type="button" id="mSel">ステージ選びへ</button>' : '') + '<button type="button" id="mRule">遊び方</button><button type="button" id="mTitle">タイトルへ戻る</button></div>'); $('#mRule', m).onclick = () => { m.remove(); rules(); }; $('#mTitle', m).onclick = () => { m.remove(); GAME.quit = true; B.dispose(); title(); };
      if (def) { $('#mRetry', m).onclick = () => { m.remove(); GAME.quit = true; B.dispose(); start(def); }; $('#mSel', m).onclick = () => { m.remove(); GAME.quit = true; B.dispose(); stageSelect(); }; } };
    B.onPick((x, y) => GAME.pick && GAME.pick(x, y));
    B.pickUnits(() => pickList(S)); // Ink81：体を押しても、その子のマス
    if (def && def.bonus && IW3.pinInfo) { const c = IW3.pinInfo; B.camGoal.ty = c.h * 0.5; B.view(0, 1.28, G.N * 1.6); B.lookAt(c.x, c.z + G.N * 0.5); } // ボーナス：奥の壁ぜんたいが見えるカメラ
    if (def) { hud.banner((def.bonus ? 'ボーナス' : def.id) + '　' + def.title, IW.STAGE_LAYERS.find(L => L.layer === def.layer).name); await IW3.wait(1100); await talk(GAME, def); if (GAME.quit) return; await loop(GAME); return; }
    hud.banner('ヒーロー対決', IW.FORMS[G.opt.form] + '・' + G.N + 'マス' + (G.opt.power ? '・強化ヒーロー' : ''));
    await IW3.wait(1200);
    S.say(IW3.anyMinion(G), 'インク団、出撃ー！', 'ink');
    await IW3.wait(700);
    S.say(999, OPT.power ? '強化スーツ、起動！ 全員まとめて相手だ！' : 'インク団め、ここから先へは行かせない！', 'hero');
    await IW3.wait(900);
    await loop(GAME);
  }
  async function loop(GM) {
    const { G, B, S, hud } = GM;
    while (!G.result && !GM.quit && G.turn <= 99) {
      if (GM.stage && G.turn > GM.stage.limit) { G.result = 'timeup'; break; } // ステージ：ターン切れ
      G.side = 'hero';
      let ev = []; IW.heroTurnStart(G, ev); hud.turn(G.turn, 'hero');
      if (!(GM.stage && GM.stage.bonus)) B.follow(() => { const v = S.views.get(999); if (!v) return null;
        const rest = IW.minions(G).filter(u => !u.gone); if (rest.length && rest.length <= 4) { // Ink96：のこりが少ないときは、のこりの子とヒーローがみんな入るように（最後の子が下のパネルにかくれていた）
          let x0 = v.root.position.x, x1 = x0, z0 = v.root.position.z, z1 = z0; for (const u of rest) { const q = S.views.get(u.id); if (!q) continue; const p = q.root.position; x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
          const span = Math.max(x1 - x0, (z1 - z0) * 1.3); B.camGoal.d = Math.max(6, Math.min(G.N * 1.3, span * 1.25 + 5)) * (innerWidth / Math.max(1, innerHeight) < 0.8 ? 1.45 : 1); return { x: (x0 + x1) / 2, z: (z0 + z1) / 2 + 0.6 }; }
        return { x: v.root.position.x, z: v.root.position.z - 2.2 }; }); /* Ink81：ヒーローより少し奥を見る（上から見る角度にしたぶん、奥の子が切れないように） */ B.unlock(); // ボーナスは、壁が見える向きのまま
      await IW3.play(S, B, G, ev, hud); if (G.result || GM.quit) break;
      if (OPT.cmd === 'hero' && !GM.auto) await playerHero(GM); // auto：確認用に、コンピューターがヒーローを動かす（#stage=…&auto=1）
      else { ev = []; IW.aiHero(G, G.hero, ev); await IW3.play(S, B, G, ev, hud); }
      if (G.result || GM.quit) break;
      ev = []; IW.heroTurnEnd(G, ev); await IW3.play(S, B, G, ev, hud); if (G.result || GM.quit) break;
      G.side = 'ink'; hud.turn(G.turn, 'ink'); B.follow(null);
      try { if (IW3.speed >= 1 && !localStorage.getItem('inkwar.tipSpeed')) { localStorage.setItem('inkwar.tipSpeed', '1'); hud.toast('上の ⏩（速さ）で速く、💬（テンポ）で連鎖のテンポを変えられます'); await IW3.wait(1400); } } catch (e) { } // Ink81：速さの変え方を、はじめに1回だけ
      ev = []; IW.minionTurn(G, ev); await IW3.play(S, B, G, ev, hud);
      hud.update();
    }
    if (!GM.quit) (GM.stage ? stageResult : result)(GM);
  }
  function makeHud(G) {
    let tt = 0;
    const H = {
      banner(t, sub, cls) { const b = $('#banner'); if (!b) return; b.className = 'banner show ' + (cls || ''); b.innerHTML = '<b>' + esc(t) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : ''); clearTimeout(tt); tt = setTimeout(() => { b.classList.remove('show'); tt = setTimeout(() => { b.innerHTML = ''; }, 400); }, 1500 * Math.max(0.7, IW3.speed)); },
      toast(t) { H.banner(t, '', 'small'); },
      goal() { const el = $('#hGoal'); if (!el || !G.stage) return; const d = G.stage; el.innerHTML = '<b>' + esc(d.id) + '</b><span>全員はじけさせる（' + d.limit + 'ターンまで）</span>' + d.goals.map(g => '<span>★ ' + esc(IW.goalText(g)) + '</span>').join('') + '<i>★の条件（押すと開く）</i>'; if (!el._f) { el._f = 1; if (innerWidth < 600) el.classList.add('fold'); el.onclick = () => el.classList.toggle('fold'); W.addEventListener('resize', () => { if (innerWidth < 600) el.classList.add('fold'); }); } }, // Ink96：あとから小さくしても、たたむ // Ink81：小さい画面では、たたんでおく（盤の上の子にかぶらないように）
      turn(n, side) { const a = $('#hTurn'); if (a) a.textContent = 'ターン ' + n + (G.stage ? '/' + G.stage.limit : ''); const b = $('#hSide'); if (b) { b.textContent = side === 'hero' ? 'ヒーローの番' : '戦闘員の番'; b.className = side; } },
      count(n) { const a = $('#hCount'); if (a) a.textContent = n; },
      ink(total) { const a = $('#hInk'); if (!a) return; if (total >= 30 && !W._inkWarned && this.toast) { W._inkWarned = 1; this.toast('⚠ よごれが 55 になると撤退（負け）、80 でたおれる。上のバーの目もりを見てね'); } /* Ink97：負けるまで分からなかった */ a.textContent = total; $('#hBar').style.width = Math.min(100, total / 80 * 100) + '%'; const lv = IW.heroLevel({ ink: total }); $('#hLv').textContent = IW.HERO_LV[lv]; $('#hLv').className = 'lv' + lv; },
      update() { H.count(IW.minions(G).length); H.ink(G.hero.ink); if (G.stage) { const tot = G.units.filter(u => u.kind === 'minion').length, el = $('#hCount0'); if (el && tot > (G.count0 || 0)) el.textContent = '/' + tot; } }, // Ink81：増援が来たら、分母もふやす
    };
    return H;
  }

  // ===== プレイヤーのヒーロー =====
  function playerHero(GM) {
    const { G, B, S, hud } = GM, h = G.hero;
    return new Promise((done) => {
      const st = { atk: IW.heroStats(h).atk, pre: h.power ? 2 : 1, moved: false, afterAtk: 0, undo: null, busy: false, special: null };
      const panel = $('#panel'); panel.hidden = false;
      const finish = () => { GM.pick = null; panel.hidden = true; B.setHL([]); closeMenu(); done(); };
      const closeMenu = () => { const m = $('.tmenu'); if (m) m.remove(); };
      const canAtk = () => st.atk > 0 && (st.moved || st.pre > 0);
      const moves = () => st.moved ? null : IW.reach(G, h, IW.heroStats(h).mv);
      const atkList = () => canAtk() ? IW.heroMoves(G, h) : [];
      const act = async (fn) => { if (st.busy) return; st.busy = true; closeMenu(); B.setHL([]); const ev = []; fn(ev); IW.checkEnd(G, ev); { const pm = panel.querySelector('.pst'); if (pm) pm.innerHTML = '見せている間… 攻撃 あと<b>' + st.atk + '</b>'; panel.querySelectorAll('button').forEach(b => b.disabled = true); } /* Ink95：連鎖を見ているあいだ「攻撃 あと2」のままにしない */ await IW3.play(S, B, G, ev, hud); hud.update(); st.busy = false; if (G.result || GM.quit) { finish(); return; } refresh(); };
      const doAttack = (m) => act((ev) => { const n0 = ev.length; IW.heroAttack(G, h, m, ev); IW.noteHeroAttack(G, m, ev, n0); st.atk--; if (!st.moved) st.pre--; else st.afterAtk++; st.undo = null; });
      function refresh() {
        const L = [], R = moves(), A = atkList();
        if (R && !h.retreat) for (const [k] of R) { const x = k % G.N, y = Math.floor(k / G.N); if (x !== h.x || y !== h.y) L.push({ x, y, c: G.puddle && IW.pathTo(G, R, x, y).slice(1).some(c => G.puddle[c.y * G.N + c.x]) ? 0x9a5cff : 'move' }); } // 第5層：インクだまりを通る行き先は紫（通るとよごれる）
        const tset = new Set(); for (const m of A) if (m.t) tset.add(m.t.id);
        for (const u of G.units) if (IW.alive(u) && (u.kind === 'minion' || u.kind === 'barrel' || u.kind === 'mirror') && tset.has(u.id)) L.push({ x: u.x, y: u.y, c: 'target' });
        for (const pd of G.pads || []) if (tset.has(pd.id) && !st.moved) L.push({ x: pd.x, y: pd.y, c: 'target' }); // ワープ床（第8層）：レーザーでねらえる
        if (st.special === 'comet') for (let d = 0; d < 4; d++) { const [dx, dy] = IW.DIRS[d]; for (let i = 1; i <= 10; i++) { const x = h.x + dx * i, y = h.y + dy * i; if (!IW.inB(G, x, y)) break; L.push({ x, y, c: 'area' }); } }
        B.setHL(L);
        const S2 = IW.heroStats(h), sp = A.filter(m => !m.t);
        const sname = { sweep: '薙ぎ払い', comet: 'ハレー彗星', lbreak: 'レーザーブレイク', homing: 'ホーミング' };
        const specials = ['sweep', 'comet'].concat(h.power ? ['lbreak', 'homing'] : []).map(k => {
          const ok = sp.some(m => m.w === k), cd = h.cool[k];
          return '<button type="button" data-sp="' + k + '"' + (ok ? '' : ' disabled') + (st.special === k ? ' class="on"' : '') + '>' + sname[k] + (cd ? '<small>あと' + cd + '</small>' : '') + '</button>';
        }).join('');
        let msg;
        if (h.retreat) msg = '撤退中：攻撃してから「端へ下がる」。端に着いて2ターン待つと去る。';
        else if (!st.moved) msg = canAtk() ? '攻撃は移動の前と後。<b>先に動くと、後の1回だけ</b>。青で移動・赤で攻撃。' : '青いマスを押して移動。攻撃はあと' + st.atk + '回（移動のあと）。';
        else msg = st.atk > 0 ? '移動した。攻撃はあと' + st.atk + '回。終わったら「ターン終了」。' : '攻撃は終わり。「ターン終了」で戦闘員の番。';
        if (st.special === 'comet') msg = 'ハレー彗星：オレンジの線のどこかを押して、向きを選ぶ。';
        panel.innerHTML = '<div class="pmsg">' + msg + '　<span class="pst">攻撃 あと<b>' + st.atk + '</b>・移動 ' + (st.moved ? '済み' : S2.mv + 'マス') + '</span></div>' +
          '<div class="pbtns">' + specials + (st.undo ? '<button type="button" id="pUndo">移動を戻す</button>' : '') + (h.retreat && !st.moved ? '<button type="button" id="pRet">端へ下がる</button>' : '') + '<button type="button" class="end" id="pEnd">ターン終了</button></div>';
        panel.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => {
          const k = b.dataset.sp;
          if (k === 'comet') { st.special = st.special === 'comet' ? null : 'comet'; refresh(); return; }
          if (k === 'homing') { menuAt(null, [['キャノンをねらう', () => doAttack({ w: 'homing', part: 'cannon' })], ['タンクをねらう', () => doAttack({ w: 'homing', part: 'tank' })], ['ホースをねらう', () => doAttack({ w: 'homing', part: 'hose' })]], 'ホーミング：上から近い4人の、同じ部分に'); return; }
          doAttack({ w: k });
        });
        const u = $('#pUndo'); if (u) u.onclick = () => { if (st.busy) return; IW.place(G, h, st.undo.x, st.undo.y); h.dir = st.undo.dir; st.moved = false; st.atk = st.undo.atk; st.undo = null; S.sync(G); refresh(); };
        const rt = $('#pRet'); if (rt) rt.onclick = () => act((ev) => { const R2 = IW.reach(G, h, IW.heroStats(h).mv); let best = null; for (const [k] of R2) { const x = k % G.N, y = Math.floor(k / G.N), d = Math.min(x, y, G.N - 1 - x, G.N - 1 - y); if (!best || d < best.d) best = { x, y, d }; } if (best) IW.heroMove(G, h, best.x, best.y, ev); st.moved = true; st.atk = Math.min(st.atk, 1); });
        $('#pEnd').onclick = () => { if (!st.busy) finish(); };
      }
      function menuAt(u, items, head) {
        closeMenu();
        const m = document.createElement('div'); m.className = 'tmenu';
        m.innerHTML = (head ? '<div class="mh">' + head + '</div>' : '') + items.map((it, i) => '<button type="button" data-i="' + i + '"' + (it[2] ? ' title="' + esc(it[2]) + '"' : '') + '>' + it[0] + (it[2] ? '<small>' + esc(it[2]) + '</small>' : '') + '</button>').join('') + '<button type="button" class="x">やめる</button>';
        $('.game').appendChild(m); armMenu(m); placeMenu(m, u);
        m.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { if (menuOk(m)) items[+b.dataset.i][1](); });
        $('.x', m).onclick = () => { if (menuOk(m)) closeMenu(); };
      }
      const HG = { high: 'キャノンの高さ', mid: 'ベリータンクの高さ', low: 'ホースの高さ', valve: '背中のホールタンク（真後ろ）' };
      const PART = { high: 'cannon', mid: 'tank', low: 'hose' };
      // Ink81：レーザーの高さごとに、ねらった子に起きること
      function hitNote(u, hgt) {
        if (hgt === 'valve') return '真うしろのホールタンク：半分の確率ではじける';
        const part = PART[hgt];
        const gone = !u.parts[part] && IW.inLine(h, u); // 一直線のレーザーは、その部分がない子の上を通りすぎる
        if (u.state === 'leak' && !gone) return 'インク漏れの子：当たればはじける';
        if (gone) return (IW.PARTS[part] || 'その部分') + 'はもうない：当たらずに通りすぎる';
        if (!u.parts[part]) return (IW.PARTS[part] || 'その部分') + 'はもうない：かわりに' + (u.parts.tank ? (u.full ? '満タンのタンクに当たる（たいていはじける）' : 'タンクに当たる → インク漏れ') : 'ほかの部分に当たる');
        if (hgt === 'mid' && u.full) return '満タンのタンク：たいてい（85%）はじける。こらえるとインク漏れ';
        return (IW.PARTS[part] || '') + 'をこわす → インク漏れ（2ターン後にはじける）' + (hgt === 'high' ? '。キャノンで撃てなくなる' : hgt === 'low' ? '。ホースで撃てなくなる' : '');
      }
      function info(u) {
        const st2 = u.sit ? 'インク漏れ・ペタン座り：動けない。次の戦闘員の番の終わりに、はじける' : u.state === 'leak' ? 'インク漏れ：もう1回当てるとはじける。2ターンたつと、ひとりでにはじける' : u.full ? '満タン：ベリータンクに当てると、たいていはじける' : 'ふつう'; // Ink81：ようすの名前を、何が起きるかで
        const parts = ['cannon', 'tank', 'hose', 'valve'].filter(k => u.parts[k]).map(k => IW.PARTS[k]).join('・') || 'なし';
        return u.name + (u.chief ? (u.awake ? '【首領・覚醒：2ターンに1回インクの雨（柱のかげなら防げる）】' : '【首領：部下が残っているあいだは攻撃が効かない】') : '') + (u.exec ? '【幹部】' : '') + (u.fast ? '【すばやい：1つの番に2回動く】' : '') + (u.reflect ? '【はね返しの盾：正面からのレーザー・ブレードは効かない。鏡で横やうしろから、タンクの爆発・連鎖でも】' : '') + (u.medic ? '【救護係：となりのインク漏れの仲間を治す】' : '') + (u.healer ? '【治しの号令：まわり' + u.healer + 'マスのインク漏れの仲間を、毎ターン治す】' : '') + (u.hp ? '【体力 ' + u.hp + '/' + u.hp0 + '・あと' + u.hp + '回当てるとはじける】' : '') + '（' + st2 + '）　使える：' + parts + '　キャノン射程' + IW.cannonRange(u) + '・ホース射程' + IW.hoseRange(u);
      }
      GM.pick = (x, y) => {
        if (st.busy || x < 0) return;
        const u = IW.at(G, x, y);
        if (st.special === 'comet') {
          if (x !== h.x || y !== h.y) { // Ink96：線の上でなくても、押した向き（たて・よこの近いほう）で撃つ。ヒーローを押したら、やめる
            const ddx = x - h.x, ddy = y - h.y, ux = Math.abs(ddx) >= Math.abs(ddy) ? Math.sign(ddx) : 0, uy = ux ? 0 : Math.sign(ddy);
            const d = IW.DIRS.findIndex(([a, b]) => a === ux && b === uy); st.special = null; if (d >= 0) doAttack({ w: 'comet', dir: d }); else refresh(); }
          else { st.special = null; refresh(); }
          return;
        }
        if (!u && G.puddle && G.puddle[y * G.N + x] && !(moves() && moves().has(y * G.N + x))) { hud.toast('インクだまり：ヒーローが通ると、1マスごとによごれ+1。上にいる戦闘員は、毎ターン満タン'); return; }
        if (!u && IW.beltAt && IW.beltAt(G, x, y) >= 0 && !(moves() && moves().has(y * G.N + x))) { hud.toast('ベルトコンベア（' + ['奥', '右', '手前', '左'][IW.beltAt(G, x, y)] + 'へ）：ターンの終わりに、上にいる子・ヒーロー・タンクを1マス運ぶ'); return; }
        const pad = !u && (G.pads || []).find(p => p.x === x && p.y === y);
        if (pad) { // 第8層：ワープ床。レーザーを撃つか、上で止まって飛ぶか
          const A = atkList().filter(m => m.t === pad), R = moves(), canMove = R && !h.retreat && R.has(y * G.N + x);
          const to = IW.warpTo(G, x, y), cnt = () => { const P = IW.laserPath(G, h, IW.sgn(x - h.x), IW.sgn(y - h.y), IW.heroStats(h).laser); let n = 0; for (const c of P.cells) { const w = IW.at(G, c.x, c.y); if (w && w.kind === 'minion') n++; } return n; };
          const head = 'ワープ床：上で止まると、もう一方（' + (to ? to.x + ',' + to.y : '') + '）へ飛ぶ。レーザーは、もう一方から同じ向きに出る';
          const items = A.map(m => ['🔫 ワープへレーザー：' + HG[m.hgt], () => doAttack(m), 'もう一方から出て、戦闘員' + cnt() + '人の上を通る']);
          if (canMove) items.push(['🌀 ワープ床へ動いて、飛ぶ', () => { const und = { x: h.x, y: h.y, dir: h.dir, atk: st.atk }; act((ev) => { IW.heroMove(G, h, x, y, ev); st.moved = true; st.atk = Math.min(st.atk, 1); st.undo = und; }); }, IW.at(G, to.x, to.y) ? '出口がふさがっているので、飛ばない' : '']);
          if (!items.length) { hud.toast(head); return; }
          menuAt(null, items, head); return;
        }
        if (u && u.kind === 'pole') { hud.toast('鉄柱：いま ' + u.stack.length + '人。12人ではじけ、同じ列（たて・よこ）で6人以上の柱も連鎖する。となりの戦闘員を選ぶと、全員まとめてここへ投げられる（4マス以内）'); return; }
        if (u && u.kind === 'mirror') { // 第7層：鏡に向けてレーザー → 曲がる
          const A = atkList().filter(m => m.t === u), cnt = (m) => { const P = IW.laserPath(G, h, IW.sgn(u.x - h.x), IW.sgn(u.y - h.y), IW.heroStats(h).laser); let n = 0; for (const c of P.cells) { const w = IW.at(G, c.x, c.y); if (w && w.kind === 'minion') n++; } return n; };
          const head = '鏡（' + u.mirror + '）：レーザーを当てると、直角に曲がる。通れない。戦闘員の弾・流星・爆風は止まる';
          if (!A.length) { hud.toast(head + '（一直線に見えている鏡だけ、ねらえる）'); return; }
          menuAt(u, A.map(m => ['🔫 鏡へレーザー：' + HG[m.hgt], () => doAttack(m), '曲がった先で、戦闘員' + cnt(m) + '人の上を通る']), head);
          return;
        }
        if (u && u.kind === 'wall') { hud.toast('柱：通れない。レーザー・弾・流星は柱で止まり、タンクの爆風も柱のかげにはとどかない'); return; }
        if (u && u.kind === 'barrel') { // インクタンク：撃つ・斬ると大爆発
          const A = atkList().filter(m => m.t === u);
          let n = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const w = IW.inB(G, u.x + dx, u.y + dy) && IW.at(G, u.x + dx, u.y + dy); if (w && w.kind === 'minion') n++; }
          const hd = IW.dist(h, u), warn = hd <= 2 ? '　⚠ ヒーローもよごれ' + IW.BARREL_INK[hd] : '';
          const head = 'インクタンク（撃つと大爆発。まわり2マスの' + n + '人を巻きこむ。1マスの子は即はじける）';
          if (!A.length) { hud.toast(head); return; }
          menuAt(u, A.map(m => m.w === 'blade' ? ['⚔ ブレードで斬る', () => doAttack(m), 'すぐ横で爆発！' + warn] : ['🔫 レーザーで撃つ', () => doAttack(m), (IW.inLine(h, u) ? '一直線：手前の子にも当たる' : 'タンクだけをねらう') + warn]), head);
          return;
        }
        if (u && u.kind === 'minion') {
          const A = atkList().filter(m => m.t === u);
          const S0 = IW.heroStats(h), noBlade = IW.dist(h, u) === 1 && S0.bladeLeakOnly && u.state !== 'leak' && canAtk(); // 変身解除（よごれ70〜）：ブレードは、インク漏れの子だけ
          const whyNo = '⚔ ブレードは使えない（変身解除中：インク漏れの子だけ斬れる）';
          if (!A.length) { hud.toast(info(u) + (noBlade ? '　' + whyNo : '')); return; }
          const items = [];
          if (noBlade) items.push(['<span class="no">' + whyNo + '</span>', () => {}, 'よごれが70をこえると、変身がとけて力が弱まる']);
          for (const m of A) {
            if (m.w === 'pole') { const n = (m.all || [m.t]).length, aft = m.pole.stack.length + n; items.unshift(['🪝 となりの' + n + '人を、鉄柱（' + m.pole.x + ',' + m.pole.y + '）へ', () => doAttack(m), 'いま' + m.pole.stack.length + '人 → ' + Math.min(13, aft) + '人' + (aft >= 12 ? '　💥 12人をこえて、はじける！（同じ列で6人以上の柱も連鎖）' : '')]); continue; }
            if (m.w === 'blade') items.push(['⚔ ブレード', () => doAttack(m), IW.sideOf(u, h) === 'behind' || IW.sideOf(u, h) === 'back' ? '背中から一刀' : '両断＋その先に衝撃波']);
            else {
              let note = '';
              const eff = hitNote(u, m.hgt); // Ink81：その高さに当てると、この子がどうなるか
              if (IW.inLine(h, u)) { const dx = IW.sgn(u.x - h.x), dy = IW.sgn(u.y - h.y); let n = 0, nb = 0; for (const c of IW.laserPath(G, h, dx, dy, IW.heroStats(h).laser).cells) { const w = IW.at(G, c.x, c.y); if (w && w.kind === 'minion') { const sd = IW.sideOf(w, h); if (m.hgt === 'valve' ? sd === 'behind' : (sd === 'front' || sd === 'side') && w.parts[PART[m.hgt]]) n++; } else if (w && w.kind === 'barrel') nb++; } note = eff + '｜一直線：この高さで当たるのは' + n + '人' + (nb ? '・タンク' + nb + 'つも爆発' : ''); }
              else note = eff + '｜この子だけ';
              items.push(['🔫 レーザー：' + HG[m.hgt], () => doAttack(m), note]);
            }
          }
          menuAt(u, items, info(u));
          return;
        }
        const R = moves();
        if (R && !h.retreat && R.has(y * G.N + x) && !(x === h.x && y === h.y)) {
          const und = { x: h.x, y: h.y, dir: h.dir, atk: st.atk };
          act((ev) => { IW.heroMove(G, h, x, y, ev); st.moved = true; st.atk = Math.min(st.atk, 1); st.undo = und; });
        }
      };
      refresh();
    });
  }

  // ===== 紅白戦・個人戦 =====
  async function startTeam() {
    IW3.speed = OPT.speed; IW3.tempo = OPT.tempo || 'slow';
    const app = $('#app'), solo = OPT.mode === 'solo';
    app.innerHTML = '<div class="game"><div class="stage" id="stage"></div>' +
      '<div class="hud"><div class="hbox"><b id="hTurn">ラウンド 1</b><span id="hSide"></span></div>' +
      (solo ? '<div class="hbox"><span>残り</span><b id="hLeft">40</b><small>人</small></div><div class="hbox"><span>自分</span><b id="hMine">-</b></div>' : '<div class="hbox"><span class="tr">赤組</span><b id="hRed">20</b><span class="tw">白組</span><b id="hWhite">20</b></div>') +
      '<div class="hbtns"><button type="button" id="hTempo" class="lbl' + (IW3.tempo === 'quick' ? ' on' : '') + '" title="テンポ（じっくり／テンポ重視）"><span>' + (IW3.tempo === 'quick' ? '⚡' : '💬') + '</span><small>テンポ</small></button><button type="button" id="hSpeed" class="lbl" title="速さ"><span>⏩</span><small>速さ</small></button><button type="button" id="hCam">全体</button><button type="button" id="hMenu">☰</button></div></div>' +
      '<div class="banner" id="banner"></div><div class="panel" id="panel" hidden></div>' +
      '<div class="loading" id="loading"><div class="spin"></div><p id="ldText">準備中…</p></div></div>';
    const G = IW.newTeamMatch({ seed: 'team' + Date.now(), N: OPT.N, form: OPT.form, mode: OPT.mode, count: 20 });
    const B = IW3.Board.create($('#stage'), G.N);
    const tall = innerWidth / Math.max(1, innerHeight) < 0.8;
    B.lookAt(0, G.N * 0.1, G.N * (tall ? 1.65 / 1.4 : 1.12), true); B.camGoal.d = B.CAM.d; // 手前の赤組が、下の操作パネルにかくれないように
    let S;
    try { S = await IW3.Stage.create(B, G, (t) => { $('#ldText').textContent = t; }); }
    catch (e) { console.error(e); $('#ldText').textContent = '3Dの準備に失敗しました：' + e.message; return; }
    $('#loading').remove();
    const hud = makeTeamHud(G);
    IW3.modelSummary && IW3.modelSummary().then(sm => { if (sm.ext) setTimeout(() => hud.toast('使うモデル：戦闘員＝' + sm.minions), 2600); });
    GAME = { G, B, S, hud, quit: false };
    { const tb = $('#hTempo'), show = () => { tb.querySelector('span').textContent = IW3.tempo === 'quick' ? '⚡' : '💬'; tb.classList.toggle('on', IW3.tempo === 'quick'); }; show(); let last = 0;
      tb.onclick = () => { const now = performance.now(); if (now - last < 500) return; last = now; /* Ink95：重いときの二度押しで、もどらないように */ IW3.tempo = OPT.tempo = IW3.tempo === 'quick' ? 'slow' : 'quick'; saveOpt(); show(); hud.toast(IW3.tempo === 'quick' ? '⚡ テンポ重視：連鎖を続けて速く。セリフは大事なところだけ' : '💬 じっくり：一人ひとりが、セリフで反応'); }; }
    $('#hSpeed').onclick = () => { const L = [0.55, 1, 1.6], i = (L.indexOf(IW3.speed) + 1) % L.length; IW3.speed = OPT.speed = L[i]; saveOpt(); hud.toast('速さ：' + ['速い', 'ふつう', 'ゆっくり'][i]); };
    $('#hCam').onclick = () => { B.unlock(); B.view(0, IW3.CAM_PH || 0.86, G.N * (innerWidth / Math.max(1, innerHeight) < 0.8 ? 1.6 : 1.05)); B.lookAt(0, 0); };
    $('#hMenu').onclick = () => { const m = modal('<h2>メニュー</h2><div class="tbtns"><button type="button" id="mRule">遊び方</button><button type="button" id="mTitle">タイトルへ戻る</button></div>'); $('#mRule', m).onclick = () => { m.remove(); rules(); }; $('#mTitle', m).onclick = () => { m.remove(); GAME.quit = true; B.dispose(); title(); }; };
    B.onPick((x, y) => GAME.pick && GAME.pick(x, y));
    B.pickUnits(() => pickList(S)); // Ink81：体を押しても、その子のマス
    hud.banner(solo ? '個人戦' : '紅白戦', solo ? '40人のバトルロイヤル・' + G.N + 'マス' : '赤組20人 対 白組20人・' + IW.FORMS[G.opt.form] + '・' + G.N + 'マス');
    await IW3.wait(1200);
    if (solo) {
      const A = G.units.filter(u => u.kind === 'minion' && !u.mine);
      S.say(A[3].id, '今日は、みんなライバルだよ！', 'ink'); await IW3.wait(600);
      S.say(A[11].id, '最後まで残るのは、わたし！', 'red'); await IW3.wait(600);
      S.say(G.mine, 'ヒーローに勝つために……優勝する！', 'pop');
    } else {
      const R0 = IW.teamUnits(G, 'red'), W0 = IW.teamUnits(G, 'white');
      S.say(R0[Math.floor(R0.length / 2)].id, 'ヒーローに勝つために、鍛えるよ！ 赤組、いくよー！', 'red');
      await IW3.wait(700);
      S.say(W0[Math.floor(W0.length / 2)].id, '白組だって、負けないもん！', 'ink');
    }
    await IW3.wait(900);
    await teamLoop(GAME);
  }
  async function teamLoop(GM) {
    const { G, B, S, hud } = GM, solo = G.mode === 'solo', play = OPT.cmd === 'hero';
    while (!G.result && !GM.quit && G.turn <= 200) {
      let ev = []; IW.roundStart(G, ev); hud.turn(G.turn, G.first);
      await IW3.play(S, B, G, ev, hud); if (GM.quit) break;
      let t;
      while (!G.result && !GM.quit && (t = IW.whoNext(G))) {
        hud.side(t); ev = [];
        const me = solo ? G.units.find(u => u.id === G.mine && IW.alive(u) && !u.acted) : null;
        if (play && (solo ? me && t === me.team : t === 'red')) {
          const done = await playerPick(GM, solo ? me : null); // 自分で1人動かす（紅白戦は「残りはおまかせ」で、赤組の残りを AI に）
          if (done === 'auto') { GM.auto = true; IW.teamAIStep(G, 'red', ev); await IW3.play(S, B, G, ev, hud); }
        } else if (play && t === 'red' && GM.auto && !solo) { IW.teamAIStep(G, 'red', ev); await IW3.play(S, B, G, ev, hud); }
        else { IW.teamAIStep(G, t, ev); await IW3.play(S, B, G, ev, hud); }
        ev = []; IW.afterAct(G, t, ev); if (ev.length) await IW3.play(S, B, G, ev, hud);
        hud.update();
      }
      GM.auto = false;
      ev = []; IW.roundEnd(G, ev); await IW3.play(S, B, G, ev, hud); hud.update();
    }
    if (!GM.quit) teamResult(GM);
  }
  function makeTeamHud(G) {
    let tt = 0;
    const H = {
      banner(t, sub, cls) { const b = $('#banner'); if (!b) return; b.className = 'banner show ' + (cls || ''); b.innerHTML = '<b>' + esc(t) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : ''); clearTimeout(tt); tt = setTimeout(() => { b.classList.remove('show'); tt = setTimeout(() => { b.innerHTML = ''; }, 400); }, 1500 * Math.max(0.7, IW3.speed)); },
      toast(t) { H.banner(t, '', 'small'); },
      turn(n) { const a = $('#hTurn'); if (a) a.textContent = 'ラウンド ' + n; },
      side(t) { const b = $('#hSide'); if (!b) return; if (G.mode === 'solo') { const u = G.units.find(v => v.team === t); b.textContent = (u ? u.name : '') + 'の番'; b.className = u && u.mine ? 'red' : ''; return; } b.textContent = (t === 'red' ? '赤組' : '白組') + 'の番'; b.className = t; },
      count() { H.update(); }, ink() { },
      update() {
        const lf = $('#hLeft'); if (lf) lf.textContent = G.units.filter(v => IW.alive(v) && v.kind === 'minion').length;
        const a = $('#hRed'), b = $('#hWhite'); if (a) a.textContent = IW.teamUnits(G, 'red').length; if (b) b.textContent = IW.teamUnits(G, 'white').length;
        const m = $('#hMine'); if (m) { const u = G.units.find(x => x.id === G.mine); m.textContent = !u || u.gone ? 'はじけた' + (u && u.rank ? '（' + u.rank + '位）' : '') : u.sit ? '爆発寸前（座りこみ）' : u.state === 'leak' ? 'インク漏れ' : u.full ? '満タン' : '元気'; }
      },
    };
    return H;
  }
  // 自分の番：赤組の子を1人選んで、動く・撃つ（only があれば、その子だけ）
  //   返り値：'done'（1人動かした）・'auto'（残りはおまかせ）
  function playerPick(GM, only) {
    const { G, B, S, hud } = GM;
    return new Promise((resolve) => {
      const panel = $('#panel'); panel.hidden = false;
      const st = { u: only || null, moved: false, busy: false, ox: 0, oy: 0, odir: 0 };
      const closeMenu = () => { const m = $('.tmenu'); if (m) m.remove(); };
      const finish = (r) => { GM.pick = null; panel.hidden = true; B.setHL([]); closeMenu(); if (st.u) st.u.acted = true; resolve(r); };
      const my = only ? only.team : 'red', solo = G.mode === 'solo';
      const mine = () => IW.teamUnits(G, my).filter(u => !u.acted);
      const act = async (fn) => { if (st.busy) return; st.busy = true; closeMenu(); B.setHL([]); const ev = []; fn(ev); IW.checkTeamEnd(G, ev); await IW3.play(S, B, G, ev, hud); hud.update(); st.busy = false; };
      const infoU = (u) => {
        const s2 = u.sit ? '爆発寸前（座りこみ）' : u.state === 'leak' ? 'インク漏れ' : u.full ? '満タン' : 'ふつう';
        const parts = ['cannon', 'hose', 'valve'].filter(k => u.parts[k]).map(k => IW.PARTS[k]).join('・') || 'なし';
        return (solo ? (u.mine ? '自分' : 'ライバル') : u.team === 'red' ? '赤組' : '白組') + '・' + u.name + '（' + s2 + '）　武器：' + parts + '　キャノン射程' + (u.parts.cannon ? IW.cannonRange(u) : '-') + '・ホース射程' + (u.parts.hose ? IW.hoseRange(u) : '-');
      };
      function refresh() {
        const L = [];
        if (!st.u) { for (const u of mine()) L.push({ x: u.x, y: u.y, c: 'pick' }); }
        else {
          const u = st.u;
          if (!st.moved) { const R = IW.reach(G, u, u.sit ? 0 : u.state === 'leak' ? 1 : 4); for (const [k] of R) { const x = k % G.N, y = Math.floor(k / G.N); if (x !== u.x || y !== u.y) L.push({ x, y, c: 'move' }); } }
          const P = IW.playerShots(G, u), seen = new Set();
          for (const o of P.L) if (!seen.has(o.t.id)) { seen.add(o.t.id); L.push({ x: o.t.x, y: o.t.y, c: 'target' }); }
          for (const j of P.J) for (const c of j.cells) if (!seen.has(c.x + ',' + c.y)) { seen.add(c.x + ',' + c.y); L.push({ x: c.x, y: c.y, c: IW.at(G, c.x, c.y) ? 'target' : 'area' }); }
          L.push({ x: u.x, y: u.y, c: 'pick' });
        }
        B.setHL(L);
        let msg;
        if (!st.u) msg = '赤組の番：<b>動かす子</b>を選ぶ（黄色く光る子）。';
        if (solo && st.u) msg = '<b>自分の番</b>（' + esc(st.u.name) + '）：' + (st.moved ? '' : '青いマスで動く（1回）。') + 'まわりは全員ライバル。赤い相手を押して撃つ。撃つと、その相手の方を向く（背中に気をつけて）。';
        else if (!solo) msg = '<b>' + esc(st.u.name) + '</b>：' + (st.moved ? '' : '青いマスで動く（1回）。') + '赤い相手を押して撃つ。撃つと、その相手の方を向く（背中に気をつけて）。';
        panel.innerHTML = '<div class="pmsg">' + msg + (st.u ? '　<span class="pst">' + esc(infoU(st.u)) + '</span>' : '') + '</div><div class="pbtns">' +
          (st.u && st.moved ? '<button type="button" id="pUndo">移動を戻す</button>' : '') +
          (st.u ? '<button type="button" id="pTurn">向きを変える</button><button type="button" class="end" id="pDone">この子はおわり</button>' : '') +
          (st.u && !only ? '<button type="button" id="pBack">ほかの子にする</button>' : '') +
          (!only ? '<button type="button" id="pAuto">残りはおまかせ</button>' : '') + '</div>';
        const q = (id, f) => { const b = $('#' + id); if (b) b.onclick = f; };
        q('pDone', () => { if (!st.busy) finish('done'); });
        q('pAuto', () => { if (st.busy) return; if (st.u && st.moved) { finish('done'); GM.auto = true; return; } st.u = null; finish('auto'); });
        q('pBack', () => { if (st.busy || st.moved) { hud.toast('動いたあとは、ほかの子にできない'); return; } st.u = null; refresh(); });
        q('pUndo', () => { if (st.busy) return; IW.place(G, st.u, st.ox, st.oy); st.u.dir = st.odir; st.moved = false; S.sync(G); refresh(); });
        q('pTurn', () => { if (st.busy) return; menu([0, 1, 2, 3].map(d => [['⬆ 奥へ', '➡ 右へ', '⬇ 手前へ', '⬅ 左へ'][d], () => { closeMenu(); st.u.dir = d; S.faceDir(st.u.id, d); }]), '向き（背中を見せる方向に気をつけて）'); });
      }
      function menu(items, head) {
        closeMenu();
        const m = document.createElement('div'); m.className = 'tmenu';
        m.innerHTML = (head ? '<div class="mh">' + esc(head) + '</div>' : '') + items.map((it, i) => '<button type="button" data-i="' + i + '">' + it[0] + (it[2] ? '<small>' + esc(it[2]) + '</small>' : '') + '</button>').join('') + '<button type="button" class="x">やめる</button>';
        $('.game').appendChild(m); armMenu(m); placeMenu(m, u);
        m.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { if (menuOk(m)) items[+b.dataset.i][1](); });
        $('.x', m).onclick = () => { if (menuOk(m)) closeMenu(); };
      }
      const fire = (exit, targets) => act((ev) => { IW.fire(G, st.u, exit, targets, ev); }).then(() => { if (!G.result) finish('done'); else finish('done'); });
      GM.pick = (x, y) => {
        if (st.busy || x < 0) return;
        const v = IW.at(G, x, y);
        if (!st.u) { if (v && v.kind === 'minion' && v.team === my && !v.acted) { st.u = v; refresh(); } else if (v && v.kind === 'minion') hud.toast(infoU(v)); return; }
        const u = st.u;
        if (v === u) return;
        if (v && v.kind === 'minion' && v.team === my && !v.acted && !st.moved && !only) { st.u = v; refresh(); return; }
        const P = IW.playerShots(G, u);
        const items = [];
        if (v && v.kind === 'minion' && v.team !== my) {
          for (const o of P.L.filter(o => o.t === v)) {
            if (o.exit === 'cannon') {
              items.push(['💥 キャノン', () => fire('cannon', [v]), o.hp.note]);
              const others = P.L.filter(w => w.exit === 'cannon' && w.t !== v).map(w => w.t);
              for (const w of others.slice(0, 3)) items.push(['💥 キャノン2発：' + w.name + 'にも', () => fire('cannon', [v, w]), '左右で2人まで']);
            } else items.push(['💧 ホース', () => fire('hose', [v]), o.hp.note]);
          }
        }
        for (const j of P.J) if (j.cells.some(c => c.x === x && c.y === y)) { const n = j.cells.filter(c => { const w = IW.at(G, c.x, c.y); return w && w.kind === 'minion' && w.team !== my; }).length; items.push(['🚀 ジャンプ噴射（' + ['奥', '右', '手前', '左'][j.dir] + '）', () => act((ev) => IW.fire(G, u, 'valve', { dir: j.dir }, ev)).then(() => finish('done')), '前と左右の3マス：相手' + n + '人が即はじける']); }
        if (items.length) { menu(items, v ? infoU(v) : 'ジャンプ噴射'); return; }
        if (v && v.kind === 'minion') { hud.toast(infoU(v) + (v.team !== my ? '　（ここからは当たらない）' : '')); return; }
        if (!st.moved) {
          const R = IW.reach(G, u, u.sit ? 0 : u.state === 'leak' ? 1 : 4);
          if (R.has(y * G.N + x)) { st.ox = u.x; st.oy = u.y; st.odir = u.dir; act((ev) => { const Pth = IW.pathTo(G, R, x, y); IW.place(G, u, x, y); u.dir = IW.dirTo(Pth[Pth.length - 2], Pth[Pth.length - 1]); ev.push({ k: 'move', id: u.id, path: Pth }); }).then(() => { st.moved = true; refresh(); }); }
        }
      };
      refresh();
    });
  }
  function teamResult(GM) {
    const { G, S } = GM, r = G.result, solo = G.mode === 'solo';
    if (solo) return soloResult(GM);
    const T = { red: ['赤組の勝ち！', '白組を全員はじけさせた'], white: ['白組の勝ち！', '赤組を全員はじけさせた'], draw: ['引き分け', '最後は、両方の組がいっしょにはじけた'] }[r] || ['おしまい', ''];
    const W = r === 'red' || r === 'white' ? IW.teamUnits(G, r) : [];
    for (const u of W) S.setMode(u.id, 'cheer');
    if (W.length && S.salute) S.salute(W.map(u => u.id)); // 勝利の祝砲
    if (W.length) S.say(W[0].id, r === 'red' ? '赤組の勝ちー！ これでヒーローにも勝てるかも！' : '白組の勝ちー！ もっと強くなれたね！', r === 'red' ? 'red' : 'ink');
    const me = solo ? G.units.find(u => u.id === G.mine) : null;
    const st = (t) => G.stat[t] ? G.stat[t].burst : 0;
    setTimeout(() => {
      const m = modal('<h2 class="res ' + r + '">' + T[0] + '</h2><p>' + T[1] + '</p><table class="rt"><tr><th>ラウンド</th><td>' + (G.turn - 1) + '</td></tr><tr><th>残った赤組</th><td>' + IW.teamUnits(G, 'red').length + '人</td></tr><tr><th>残った白組</th><td>' + IW.teamUnits(G, 'white').length + '人</td></tr>' +
        (me ? '<tr><th>自分（' + esc(me.name) + '）</th><td>' + (me.gone ? 'はじけた' : '最後まで残った') + '・はじけさせた ' + (me.kills || 0) + '人</td></tr>' : '') + '</table>' +
        '<div class="tbtns"><button type="button" class="big" id="rAgain">もう一度</button><button type="button" id="rTitle">タイトルへ</button></div>');
      $('#rAgain', m).onclick = () => { m.remove(); S.stopSalute && S.stopSalute(); GM.B.dispose(); start(); };
      $('#rTitle', m).onclick = () => { m.remove(); S.stopSalute && S.stopSalute(); GM.B.dispose(); title(); };
    }, 1600);
  }

  function soloResult(GM) {
    const { G, S } = GM, me = G.units.find(u => u.id === G.mine), w = G.units.find(u => u.id === G.winner);
    const mineWon = w && w.mine;
    if (w) { S.setMode(w.id, 'cheer'); if (S.salute) S.salute([w.id]); S.say(w.id, mineWon ? 'やったー！ 優勝！ これで、ヒーローにも負けない！' : '優勝ー！ わたしが、いちばん！', 'pop'); }
    const top = G.units.filter(u => u.kind === 'minion').sort((a, b) => (a.rank || 99) - (b.rank || 99)).slice(0, 5);
    setTimeout(() => {
      const m = modal('<h2 class="res ' + (mineWon ? 'red' : 'white') + '">' + (G.result === 'draw' ? '引き分け' : mineWon ? '優勝！' : esc(w ? w.name : '') + 'の優勝') + '</h2><p>' + (G.result === 'draw' ? '最後の2人が、いっしょにはじけた' : '40人のバトルロイヤルを、最後まで残った') + '</p><table class="rt">' +
        '<tr><th>ラウンド</th><td>' + (G.turn - 1) + '</td></tr>' + (me ? '<tr><th>自分（' + esc(me.name) + '）</th><td>' + (me.rank || '-') + '位・はじけさせた ' + (me.kills || 0) + '人</td></tr>' : '') +
        top.map(u => '<tr><th>' + (u.rank || '-') + '位</th><td>' + esc(u.name) + (u.mine ? '（自分）' : '') + '・' + (u.kills || 0) + '人</td></tr>').join('') + '</table>' +
        '<div class="tbtns"><button type="button" class="big" id="rAgain">もう一度</button><button type="button" id="rTitle">タイトルへ</button></div>');
      $('#rAgain', m).onclick = () => { m.remove(); S.stopSalute && S.stopSalute(); GM.B.dispose(); start(); };
      $('#rTitle', m).onclick = () => { m.remove(); S.stopSalute && S.stopSalute(); GM.B.dispose(); title(); };
    }, 1600);
  }

  // ===== ステージ（単騎でアジトを奥へ） =====
  //   進み具合：localStorage 'inkwar.stage' = { '1-1': { stars, turns, ink }, … }（ブラウザごと。投稿サイトでも残る）
  const PROG_KEY = 'inkwar.stage';
  const progress = () => { try { return JSON.parse(localStorage.getItem(PROG_KEY) || '{}') || {}; } catch (e) { return {}; } };
  const saveProgress = (P) => { try { localStorage.setItem(PROG_KEY, JSON.stringify(P)); } catch (e) { } };
  // おはなしの場面：見たかどうか（localStorage 'inkwar.story'）。見ていない場面は、その面の前（後）に自動で見せる
  const STORY_KEY = 'inkwar.story';
  const storySeen = () => { try { return JSON.parse(localStorage.getItem(STORY_KEY) || '{}') || {}; } catch (e) { return {}; } };
  const markSeen = (id) => { try { const o = storySeen(); o[id] = 1; localStorage.setItem(STORY_KEY, JSON.stringify(o)); } catch (e) { } };
  const storyOpen = (id, P) => { const st = IW.STORY[id], k = st.before ? IW.STAGES[IW.stageById(st.before).idx - 1] : IW.stageById(st.after); return id === 'opening' || !!(k && P[k.id] && P[k.id].stars); };
  async function playStory(id) { if (!IW3.Story) return; await IW3.Story.play(id, {}); markSeen(id); }
  // 面を始める：まだ見ていない「その面の前の場面」があれば、先に見せる
  async function goStage(def) {
    const sid = Object.keys(IW.STORY || {}).find(k => IW.STORY[k].before === def.id);
    if (sid && !storySeen()[sid]) await playStory(sid);
    return start(def);
  }
  const starStr = (n, max) => { let t = ''; for (let i = 0; i < (max || 3); i++) t += i < n ? '★' : '☆'; return t; };
  const unlocked = (def, P) => def.idx === 0 || !!(P[IW.STAGES[def.idx - 1].id] && P[IW.STAGES[def.idx - 1].id].stars);
  IW3.stageProgress = progress; // テスト用
  function stageCard(def) {
    const P = progress(), rec = P[def.id];
    return '<div class="scard"><div class="sch"><b>' + esc(def.id) + '</b> ' + esc(def.title) + '<span class="sstar">' + starStr(rec ? rec.stars : 0) + '</span></div>' +
      '<ul class="sgoal"><li>★ 全員はじけさせる（' + def.limit + 'ターンまで）</li>' + def.goals.map(g => '<li>★ ' + esc(IW.goalText(g)) + '</li>').join('') + '</ul>' +
      (def.tip ? '<p class="stip">💡 ' + def.tip + '</p>' : '') +
      (rec && rec.stars ? '<p class="rnote">いちばんよかった記録：' + rec.turns + 'ターン・よごれ ' + rec.ink + '</p>' : '') + '</div>';
  }
  function stageSelect() {
    const app = $('#app'), P = progress();
    const total = IW.STAGES.reduce((a, d) => a + (P[d.id] ? P[d.id].stars : 0), 0);
    app.innerHTML = '<div class="ssel"><div class="ssh"><button type="button" id="sBack">← タイトル</button><h2>🗺️ ステージ</h2><span class="stot">★ ' + total + ' / ' + IW.STAGES.length * 3 + '</span></div>' +
      '<p class="tnote">ヒーローが1人で、インク団のアジトを奥へ進む。よごれは面ごとに0から。負けても、その面からやり直せる。</p>' +
      '<h3 class="slayer">📖 おはなし<small>見た場面は、ここからもう一度見られる</small></h3><div class="sstory">' + Object.keys(IW.STORY || {}).map(k => '<button type="button" data-story="' + k + '"' + (storyOpen(k, P) ? '' : ' disabled') + '>' + (storyOpen(k, P) ? esc(IW.STORY[k].title) : '🔒 ？？？') + '</button>').join('') + '</div>' +
      IW.STAGE_LAYERS.map(L => '<h3 class="slayer">' + esc(L.name) + '<small>' + esc(L.sub) + '</small></h3><div class="sgrid">' +
        IW.STAGES.filter(d => d.layer === L.layer).map(d => { const ok = unlocked(d, P), r = P[d.id];
          return '<button type="button" class="sbtn' + (r && r.stars ? ' clear' : '') + '" data-id="' + d.id + '"' + (ok ? '' : ' disabled') + '><b>' + d.no + '</b><span>' + (ok ? esc(d.title) : '？？？') + '</span><i>' + (ok ? starStr(r ? r.stars : 0) : '🔒') + '</i></button>'; }).join('') + '</div>').join('') +
      '</div>';
    $('#sBack').onclick = title;
    app.querySelectorAll('.sbtn[data-id]').forEach(b => b.onclick = () => {
      const def = IW.stageById(b.dataset.id);
      const m = modal(stageCard(def) + '<div class="tbtns"><button type="button" class="big" id="sGo">出撃！</button></div>');
      $('#sGo', m).onclick = () => { m.remove(); goStage(def); };
    });
    app.querySelectorAll('[data-story]').forEach(b => b.onclick = async () => { await playStory(b.dataset.story); stageSelect(); });
  }
  // 面のはじまりの会話：吹き出し（声つき）と、下の会話の枠。押すと次へ
  function talk(GM, def) {
    const { G, S } = GM, h = G.hero;
    const minions = IW.minions(G).filter(u => !u.boss).sort((a, b) => IW.dist(a, h) - IW.dist(b, h)), boss = IW.minions(G).find(u => u.boss);
    let ki = 0;
    const lines = (def.talk || []).map(([who, t]) => {
      if (who === 'hero') return { id: 999, name: h.name, t, cls: 'hero' };
      const u = who === 'boss' && boss ? boss : minions[(ki++) % Math.max(1, minions.length)] || boss;
      return { id: u ? u.id : 0, name: u ? u.name : 'インク団', t, cls: 'ink' };
    });
    if (def.volley) { lines.push({ volley: true }); for (const [who, t] of def.volley) { if (who === 'hero') lines.push({ id: 999, name: h.name, t, cls: 'hero' }); else { const u = minions[(ki++) % Math.max(1, minions.length)]; lines.push({ id: u ? u.id : 0, name: u ? u.name : 'インク団', t, cls: 'ink' }); } } } // ボーナス：会話のとちゅうで、一斉噴射
    return new Promise(done => {
      const box = document.createElement('div'); box.className = 'talk'; $('.game').appendChild(box);
      let i = 0;
      const end = () => { box.remove(); done(); };
      const show = () => {
        if (GM.quit) return end();
        if (i >= lines.length) {
          if (!def.tip) return end();
          box.innerHTML = '<div class="tname">💡 ヒント</div><div class="ttext">' + def.tip + '</div><div class="tnav"><button type="button" class="big" id="tkGo">はじめる</button></div>';
          $('#tkGo', box).onclick = (e) => { e.stopPropagation(); end(); }; i++; return;
        }
        if (i > lines.length) return end();
        const L = lines[i];
        if (L.volley) { box.innerHTML = '<div class="tname ink">固定砲台部隊</div><div class="ttext">いっせい噴射ー！</div>'; volley(GM).then(() => { i++; show(); }); return; }
        if (L.id) S.say(L.id, L.t, L.cls, 2600);
        if (L.id && GM.B && GM.B.punch) { const v = S.views.get(L.id); if (v) GM.B.punch(v.root.position.x, v.root.position.z, 0.62, 2600); } // Ink96：話している子へ、カメラを寄せる（名前と顔が結びつくように）
        box.innerHTML = '<div class="tname ' + L.cls + '">' + esc(L.name) + '</div><div class="ttext">' + esc(L.t) + '</div><div class="tnav"><button type="button" id="tkSkip">とばす</button><button type="button" class="big" id="tkNext">▶ つぎへ</button></div>';
        $('#tkSkip', box).onclick = (e) => { e.stopPropagation(); i = lines.length; show(); };
        $('#tkNext', box).onclick = (e) => { e.stopPropagation(); i++; show(); };
      };
      box.addEventListener('click', () => { if (i < lines.length && !lines[i].volley) { i++; show(); } }); // 一斉噴射のあいだは、押しても進まない
      show();
    });
  }
  // ボーナス：壁の子たちが、いっせいにインクを撃つ（でも壁にはりついているので、とどかない）
  async function volley(GM) {
    const { G, S, B } = GM, M = IW.minions(G).filter(u => u.pinned);
    if (B.shake) B.shake(0.04);
    await Promise.all(M.map((u, i) => IW3.wait(i * 70).then(() => { if (i % 6 === 0) S.say(u.id, IW3.pick(IW3.LINES.go), 'ink', 900); return S.shoot(u.id, 999, i % 2 ? 'cannon' : 'hose', S.inkOf(u.id), false, { short: true, noWind: i % 3 !== 0 }); })));
    S.say(999, '……', 'hero', 900); await IW3.wait(500);
  }
  function stageResult(GM) {
    const { G, S } = GM, def = GM.stage, r = G.result;
    const { stars, met } = IW.stageStars(G), P = progress(), old = P[def.id], best = old ? old.stars : 0;
    if (stars) {
      const rec = { stars: Math.max(stars, best), turns: Math.min(G.turn, old && old.turns || 99), ink: Math.min(G.hero.ink, old && old.ink != null ? old.ink : 999) };
      if (!GM.deep) { P[def.id] = rec; saveProgress(P); } // 確認用の入口から遊んだときは、★を記録しない（まだ開いていない面が開かないように）
      S.say(999, def.win || IW3.LINES.heroWin[0], 'hero', 3000);
    } else {
      for (const u of IW.minions(G).slice(0, 6)) S.setMode(u.id, 'cheer');
      if (r === 'repelled' || r === 'defeated') S.salute(IW.minions(G).map(u => u.id).concat(r === 'defeated' ? [999] : []));
      if (IW.minions(G).length) S.say(IW3.anyMinion(G), r === 'timeup' ? 'ヒーロー、時間切れ〜！ また来てね！' : IW3.LINES.win[Math.floor(Math.random() * 2)], 'ink');
    }
    const why = { repelled: 'よごれが55をこえて、撤退した', defeated: 'ヒーローはスライムになって、インク団の仲間入り…', timeup: def.limit + 'ターンのうちに、全員をはじけさせられなかった' }[r] || '';
    const next = IW.STAGES[def.idx + 1];
    const lastOfLayer = !next || next.layer !== def.layer;
    setTimeout(() => {
      const m = modal('<h2 class="res ' + (stars ? 'cleared' : 'repelled') + '">' + (stars ? 'ステージクリア！' : 'しっぱい…') + '</h2>' +
        '<p>' + esc(def.id + '　' + def.title) + (stars ? '' : '<br>' + esc(why)) + '</p>' +
        (stars ? '<div class="sbig">' + starStr(stars) + '</div>' + (stars > best && best ? '<p class="rnote">記録更新！（前は' + starStr(best) + '）</p>' : '') : '') +
        '<ul class="sgoal res"><li class="' + (stars ? 'ok' : 'ng') + '">' + (stars ? '✓' : '✗') + ' 全員はじけさせる（' + def.limit + 'ターンまで）</li>' + def.goals.map((g, i) => '<li class="' + (met[i] ? 'ok' : 'ng') + '">' + (met[i] ? '✓' : '✗') + ' ' + esc(IW.goalText(g)) + '</li>').join('') + '</ul>' +
        '<table class="rt"><tr><th>ターン</th><td>' + G.turn + '</td></tr><tr><th>はじけた戦闘員</th><td>' + ((G.stat.ink && G.stat.ink.burst) || 0) + '人</td></tr><tr><th>1回の攻撃でいちばん多く</th><td>' + ((G.stat.hero && G.stat.hero.combo) || 0) + '人</td></tr><tr><th>ヒーローのよごれ</th><td>' + G.hero.ink + '</td></tr></table>' +
        (stars && def.final ? '<p class="stip">🏆 <b>アジト完全制圧！</b> 首領ノワールをたおして、インク団のアジトを最後まで進みきった！ おつかれさまでした。<br>★を集めなおすのも、ボーナス・特別ステージで遊ぶのも自由です。</p>' : '') +
        (stars && lastOfLayer ? '<p class="stip">🎉 ' + esc(IW.STAGE_LAYERS.find(L => L.layer === def.layer).name) + '、クリア！ ' + (next || def.final ? '' : 'この先の層は、これから作ります。') + '</p>' : '') +
        '<div class="tbtns">' + (stars && def.final ? '<button type="button" class="big" id="rEnd">🎬 エンディングへ</button>' : '') + (stars && next ? '<button type="button" class="big" id="rNext">次の面へ</button>' : '') + '<button type="button"' + (stars || def.final ? '' : ' class="big"') + ' id="rAgain">' + (stars ? 'もう一度' : 'やり直す') + '</button><button type="button" id="rSel">ステージ選び</button></div>');
      const leave = () => { m.remove(); S.stopSalute && S.stopSalute(); GM.B.dispose(); };
      const nb = $('#rNext', m); if (nb) nb.onclick = () => { leave(); goStage(next); };
      const eb = $('#rEnd', m); if (eb) eb.onclick = async () => { leave(); await playStory('ending'); stageSelect(); };
      $('#rAgain', m).onclick = () => { leave(); start(def); };
      $('#rSel', m).onclick = () => { leave(); stageSelect(); };
    }, 1800);
  }

  // ===== 結果 =====
  function result(GM) {
    const { G, S } = GM, r = G.result;
    const T = { cleared: ['ヒーローの勝ち！', '戦闘員を全員はじけさせた'], repelled: ['インク団の勝ち！', 'ヒーローを撤退させた'], defeated: ['インク団の大勝利！', 'ヒーローはスライムになって、インク団の仲間入り！'], timeup: ['時間切れ', '決着がつかなかった'] }[r] || ['おしまい', ''];
    if (r === 'cleared') S.say(999, IW3.LINES.heroWin[0], 'hero');
    else { for (const u of IW.minions(G).slice(0, 6)) { S.setMode(u.id, 'cheer'); } if (r === 'defeated') S.setMode(999, 'cheer');
      if (r === 'repelled' || r === 'defeated') S.salute(IW.minions(G).map(u => u.id).concat(r === 'defeated' ? [999] : [])); } // インク団の勝利の祝砲
    if (r !== 'cleared' && IW.minions(G).length) S.say(IW3.anyMinion(G), IW3.LINES.win[Math.floor(Math.random() * 2)], 'ink');
    const burst = (G.stat.ink && G.stat.ink.burst) || 0;
    setTimeout(() => {
      const m = modal('<h2 class="res ' + r + '">' + T[0] + '</h2><p>' + T[1] + '</p><table class="rt"><tr><th>ターン</th><td>' + (G.turn - (r === 'cleared' || r === 'repelled' ? 0 : 0)) + '</td></tr><tr><th>はじけた戦闘員</th><td>' + burst + '人</td></tr><tr><th>残った戦闘員</th><td>' + IW.minions(G).length + '人</td></tr><tr><th>ヒーローのよごれ</th><td>' + G.hero.ink + '</td></tr></table>' +
        '<div class="tbtns"><button type="button" class="big" id="rAgain">もう一度</button><button type="button" id="rTitle">タイトルへ</button></div>');
      $('#rAgain', m).onclick = () => { m.remove(); S.stopSalute && S.stopSalute(); GM.B.dispose(); start(); };
      $('#rTitle', m).onclick = () => { m.remove(); S.stopSalute && S.stopSalute(); GM.B.dispose(); title(); };
    }, 1600);
  }
  IW3.title = title;
  IW3.stageSelect = stageSelect; IW3.startStage = (id) => start(IW.stageById(id)); // テスト用
  IW3.game = () => GAME; // テスト用
  IW3.playStory = playStory; // テスト用
  // 確認用の入口：InkWar.html#stage=B-1（その面から直接はじめる。まだ開いていない面でも）・&auto=1（コンピューターがヒーローを動かして、見るだけ）
  //   声と音は、ブラウザが「一度押す」まで鳴らせないので、はじめに「▶ はじめる」を押してもらう。進み具合（★）は、ふつうどおり残る
  const DEEP = (() => { try { const q = new URLSearchParams(String(W.location.hash || '').replace(/^#/, '')); const id = q.get('stage'); return id && IW.stageById(id) ? { id, auto: q.get('auto') === '1' } : null; } catch (e) { return null; } })();
  function deepStart() {
    title();
    const sq = (() => { try { const q = new URLSearchParams(String(W.location.hash || '').replace(/^#/, '')); return { id: q.get('story'), auto: q.get('auto') === '1' }; } catch (e) { return {}; } })();
    if (sq.id && IW.STORY && IW.STORY[sq.id]) { const m = modal('<h2>確認用：おはなし「' + esc(IW.STORY[sq.id].title) + '」</h2><div class="tbtns"><button type="button" class="big" id="dGo">▶ 見る</button><button type="button" id="dNo">やめる</button></div>');
      $('#dGo', m).onclick = () => { m.remove(); IW3.sfxInit && IW3.sfxInit(); IW3.Story.play(sq.id, { auto: sq.auto }).then(() => title()); };
      $('#dNo', m).onclick = () => m.remove(); return; }
    if (!DEEP) return;
    const def = IW.stageById(DEEP.id), m = modal('<h2>確認用：' + esc((def.bonus ? 'ボーナス' : def.id) + '　' + def.title) + '</h2><p>' + (DEEP.auto ? 'コンピューターがヒーローを動かします（見るだけ）。' : 'この面から、ヒーローを動かして遊べます。') + '<br>確認用なので、クリアしても★は記録しません。</p><div class="tbtns"><button type="button" class="big" id="dGo">▶ はじめる</button><button type="button" id="dNo">タイトルへ</button></div>');
    $('#dGo', m).onclick = () => { m.remove(); IW3.sfxInit && IW3.sfxInit(); if (W.speechSynthesis) { try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance('')); } catch (e) { } } start(def).catch(e => console.error(e)); };
    $('#dNo', m).onclick = () => { m.remove(); try { history.replaceState(null, '', W.location.pathname); } catch (e) { } };
  }
  W.addEventListener('DOMContentLoaded', deepStart);
})(typeof window !== 'undefined' ? window : globalThis);
