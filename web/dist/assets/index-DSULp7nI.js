(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function e(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=e(s);fetch(s.href,r)}})();const Ns=["#168b78","#4676b7","#b17c36","#8e68ad","#be6578","#6c8f42","#398eac","#a17358"],vi=Math.PI*2,Us=i=>structuredClone(i),as=i=>i*Math.PI/180,eu=(i,t,e)=>Math.max(t,Math.min(e,i)),dn=(i,t)=>Math.hypot(i[0]-t[0],i[1]-t[1]),Ua=(i,t)=>[i[0]*Math.cos(t)-i[1]*Math.sin(t),i[0]*Math.sin(t)+i[1]*Math.cos(t)];function Fs(i){return i.type==="polygon"?i.vertices:i.type!=="rectangle"?[]:[[-1,-1],[1,-1],[1,1],[-1,1]].map(([t,e])=>{const n=Ua([t*i.width/2,e*i.height/2],as(i.rotation_deg||0));return[i.center[0]+n[0],i.center[1]+n[1]]})}function nu(i,t){let e=!1;for(let n=0,s=t.length-1;n<t.length;s=n++){const[r,a]=t[n],[o,c]=t[s];a>i[1]!=c>i[1]&&i[0]<(o-r)*(i[1]-a)/(c-a)+r&&(e=!e)}return e}function Dc(i,t){if(!i?.length)return null;if(t<=i[0].time)return i[0];if(t>=i.at(-1).time)return i.at(-1);let e=0,n=i.length-1;for(;n-e>1;){const _=e+n>>1;i[_].time<=t?e=_:n=_}const s=i[e],r=i[n],a=(t-s.time)/Math.max(1e-9,r.time-s.time),o=Math.atan2(Math.sin(r.yaw-s.yaw),Math.cos(r.yaw-s.yaw)),c=r.s-s.s,l=c*a,u=c>1e-9?o/c:0,f=s.yaw+o*a,h=c>1e-9?Math.abs(u)<1e-12?s.x+l*Math.cos(s.yaw):s.x+(Math.sin(f)-Math.sin(s.yaw))/u:s.x+(r.x-s.x)*a,d=c>1e-9?Math.abs(u)<1e-12?s.y+l*Math.sin(s.yaw):s.y+(Math.cos(s.yaw)-Math.cos(f))/u:s.y+(r.y-s.y)*a;return{x:h,y:d,alt:s.alt+(r.alt-s.alt)*a,yaw:f,time:t,s:s.s+(r.s-s.s)*a,phase:r.phase}}class iu{constructor(t,{onChange:e,onSelect:n,onStatus:s,onDraftChange:r}={}){this.container=t,this.canvas=document.createElement("canvas"),this.canvas.className="map-canvas",this.canvas.tabIndex=0,this.canvas.setAttribute("aria-label","二维航迹与障碍物编辑画布，滚轮缩放，空格拖动平移"),t.append(this.canvas),this.context=this.canvas.getContext("2d"),this.onChange=e||(()=>{}),this.onSelect=n||(()=>{}),this.onStatus=s||(()=>{}),this.onDraftChange=r||(()=>{}),this.camera={x:4e4,y:4e4,scale:.005},this.tool="select",this.scene=null,this.result=null,this.options={},this.time=0,this.pointer=null,this.draft=null,this.drag=null,this.spacePressed=!1,this.frame=0,this.abort=new AbortController;const a={signal:this.abort.signal};this.canvas.addEventListener("pointerdown",o=>this.pointerDown(o),a),this.canvas.addEventListener("pointermove",o=>this.pointerMove(o),a),this.canvas.addEventListener("pointerup",o=>this.pointerUp(o),a),this.canvas.addEventListener("pointercancel",()=>this.cancelDrag(),a),this.canvas.addEventListener("dblclick",o=>this.doubleClick(o),a),this.canvas.addEventListener("wheel",o=>this.wheel(o),{...a,passive:!1}),this.canvas.addEventListener("contextmenu",o=>o.preventDefault(),a),window.addEventListener("keydown",o=>this.keyDown(o),a),window.addEventListener("keyup",o=>{o.code==="Space"&&(this.spacePressed=!1,this.setCursor())},a),this.resizeObserver=new ResizeObserver(()=>this.resize()),this.resizeObserver.observe(t),this.resize()}update(t,e,n={}){const s=!this.scene;this.scene=t,this.result=e,this.options=n,s&&this.fit(),this.drawSoon()}setTool(t){this.tool=t,this.draft=null,this.cancelDrag(),this.onDraftChange(!1),this.setCursor(),this.drawSoon()}setTime(t){this.time=t,this.drawSoon()}resize(){const{width:t,height:e}=this.container.getBoundingClientRect();this.width=Math.max(1,t),this.height=Math.max(1,e);const n=Math.min(2,window.devicePixelRatio||1);this.canvas.width=Math.round(this.width*n),this.canvas.height=Math.round(this.height*n),this.canvas.style.width=`${this.width}px`,this.canvas.style.height=`${this.height}px`,this.ratio=n,this.drawSoon()}fit(){if(!this.scene)return;const{min:t,max:e}=this.scene.world;this.camera={x:(t+e)/2,y:(t+e)/2,scale:Math.min((this.width-100)/(e-t),(this.height-80)/(e-t))},this.camera.scale=Math.max(5e-5,this.camera.scale),this.drawSoon()}zoom(t,e=[this.width/2,this.height/2]){const n=this.toWorld(e);this.camera.scale=eu(this.camera.scale*t,3e-5,5);const s=this.toWorld(e);this.camera.x+=n[0]-s[0],this.camera.y+=n[1]-s[1],this.drawSoon()}toScreen([t,e]){return[(t-this.camera.x)*this.camera.scale+this.width/2,this.height/2-(e-this.camera.y)*this.camera.scale]}toWorld([t,e]){return[(t-this.width/2)/this.camera.scale+this.camera.x,(this.height/2-e)/this.camera.scale+this.camera.y]}eventPoint(t){const e=this.canvas.getBoundingClientRect();return[t.clientX-e.left,t.clientY-e.top]}setCursor(){this.canvas.style.cursor=this.drag?.mode==="pan"?"grabbing":this.tool==="pan"||this.spacePressed?"grab":this.tool!=="select"?"crosshair":"default"}selected(t=this.scene){if(!t)return null;if(this.options.selectedId==="sweep")return{kind:"sweep",item:t.sweep};const e=t.aircraft.find(s=>s.id===this.options.selectedId);if(e)return{kind:"aircraft",item:e};const n=t.obstacles.find(s=>s.id===this.options.selectedId);return n?{kind:"obstacle",item:n}:null}handles(t=this.scene){const e=this.selected(t);if(!e)return[];const{kind:n,item:s}=e;if(n==="aircraft"){const r=as(s.heading_deg);return[{kind:"heading",point:[s.x+Math.cos(r)*46/this.camera.scale,s.y+Math.sin(r)*46/this.camera.scale]}]}if(n==="sweep"){const[r,a]=s.center,o=s.size/2;return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([c,l])=>({kind:"sweep-size",point:[r+c*o,a+l*o]}))}if(s.type==="circle")return[{kind:"radius",point:[s.center[0]+s.radius,s.center[1]]}];if(s.type==="rectangle"){const r=Fs(s),a=Ua([0,s.height/2+28/this.camera.scale],as(s.rotation_deg||0));return[...r.map((o,c)=>({kind:"rectangle-size",index:c,point:o})),{kind:"rotation",point:[s.center[0]+a[0],s.center[1]+a[1]]}]}return s.vertices.map((r,a)=>({kind:"vertex",index:a,point:r}))}hitTest(t){if(!this.scene)return null;for(const r of this.handles())if(dn(this.toScreen(r.point),this.toScreen(t))<11)return{id:this.options.selectedId,handle:r};for(const r of[...this.scene.aircraft].reverse())if(dn(this.toScreen([r.x,r.y]),this.toScreen(t))<18)return{id:r.id};for(const r of[...this.scene.obstacles].reverse())if(r.type==="circle"?dn(t,r.center)<=r.radius+5/this.camera.scale:nu(t,Fs(r)))return{id:r.id};const e=this.scene.sweep.size/2,[n,s]=this.scene.sweep.center;return Math.abs(t[0]-n)<=e&&Math.abs(t[1]-s)<=e?{id:"sweep"}:null}pointerDown(t){if(!this.scene||this.options.locked)return;this.canvas.focus({preventScroll:!0});const e=this.eventPoint(t),n=this.toWorld(e);if(this.pointer=n,t.button===1||t.button===2||this.spacePressed||this.tool==="pan")this.drag={mode:"pan",screen:e,camera:{...this.camera}};else if(this.tool!=="select"){this.drawClick(n,e,t);return}else{const s=this.hitTest(n);s?(this.onSelect(s.id),this.options.selectedId=s.id,this.drag={mode:"edit",id:s.id,handle:s.handle,world:n,screen:e,original:Us(this.scene),scene:Us(this.scene),moved:!1}):(this.onSelect(null),this.drag={mode:"pan",screen:e,camera:{...this.camera}})}this.canvas.setPointerCapture(t.pointerId),this.setCursor()}pointerMove(t){const e=this.eventPoint(t),n=this.toWorld(e);this.pointer=n,this.onStatus({x:n[0],y:n[1],scale:this.camera.scale}),this.drag?.mode==="pan"?(this.camera.x=this.drag.camera.x-(e[0]-this.drag.screen[0])/this.camera.scale,this.camera.y=this.drag.camera.y+(e[1]-this.drag.screen[1])/this.camera.scale):this.drag?.mode==="edit"&&(dn(e,this.drag.screen)>3&&(this.drag.moved=!0),this.drag.moved&&this.editDrag(n,t.shiftKey)),this.draft&&(this.draft.pointer=n),this.drawSoon()}editDrag(t,e){const n=this.drag,s=Us(n.original),r=this.selected(s);if(!r)return;const{kind:a,item:o}=r,c=[t[0]-n.world[0],t[1]-n.world[1]],l=e?500:1,u=h=>Math.round(h/l)*l,f=n.handle?.kind;if(a==="aircraft")if(f==="heading"){let h=Math.atan2(t[1]-o.y,t[0]-o.x)*180/Math.PI;o.heading_deg=Math.round(h/(e?15:1))*(e?15:1)}else o.x=u(o.x+c[0]),o.y=u(o.y+c[1]);else if(a==="sweep")f==="sweep-size"?o.size=Math.max(100,u(2*Math.max(Math.abs(t[0]-o.center[0]),Math.abs(t[1]-o.center[1])))):o.center=o.center.map((h,d)=>u(h+c[d]));else if(o.type==="circle"&&f==="radius")o.radius=Math.max(50,u(dn(t,o.center)));else if(o.type==="rectangle"&&f==="rotation"){const h=Math.atan2(t[1]-o.center[1],t[0]-o.center[0])*180/Math.PI-90;o.rotation_deg=Math.round(h/(e?15:1))*(e?15:1)}else if(o.type==="rectangle"&&f==="rectangle-size"){const h=Ua([t[0]-o.center[0],t[1]-o.center[1]],-as(o.rotation_deg||0));o.width=Math.max(100,u(Math.abs(h[0])*2)),o.height=Math.max(100,u(Math.abs(h[1])*2))}else o.type==="polygon"&&f==="vertex"?o.vertices[n.handle.index]=t.map(u):o.type==="polygon"?o.vertices=o.vertices.map(h=>h.map((d,_)=>u(d+c[_]))):o.center=o.center.map((h,d)=>u(h+c[d]));n.scene=s,this.onDraftChange(!0)}pointerUp(t){this.drag?.mode==="edit"&&this.drag.moved&&this.onChange(this.drag.scene,"调整对象几何"),this.drag=null,this.onDraftChange(!1),this.canvas.hasPointerCapture(t.pointerId)&&this.canvas.releasePointerCapture(t.pointerId),this.setCursor(),this.drawSoon()}cancelDrag(){this.drag=null,this.onDraftChange(!1),this.drawSoon()}drawClick(t,e,n){const s=t.map(r=>Math.round(r));if(this.tool==="circle")this.draft?dn(this.draft.center,s)>50&&this.commitObstacle({type:"circle",center:this.draft.center,radius:Math.round(dn(this.draft.center,s))}):this.draft={type:"circle",center:s,pointer:s};else if(this.tool==="rectangle")if(!this.draft)this.draft={type:"rectangle",first:s,pointer:s,phase:"size"};else if(this.draft.phase==="size"){const r=this.draft.first;if(Math.abs(r[0]-s[0])<100||Math.abs(r[1]-s[1])<100)return;this.draft={type:"rectangle",center:[(r[0]+s[0])/2,(r[1]+s[1])/2],width:Math.abs(r[0]-s[0]),height:Math.abs(r[1]-s[1]),phase:"rotation",initialAngle:Math.atan2(s[1]-r[1],s[0]-r[0]),pointer:s}}else this.commitObstacle(this.draftRectangle(n.shiftKey));else this.tool==="polygon"&&(this.draft?this.draft.vertices.length>=3&&dn(e,this.toScreen(this.draft.vertices[0]))<13?this.finishPolygon():n.detail<2&&this.draft.vertices.length<100&&dn(s,this.draft.vertices.at(-1))*this.camera.scale>3&&this.draft.vertices.push(s):this.draft={type:"polygon",vertices:[s],pointer:s});this.onDraftChange(!!this.draft),this.drawSoon()}draftRectangle(t=!1){const e=this.draft,s=(Math.atan2(e.pointer[1]-e.center[1],e.pointer[0]-e.center[0])-e.initialAngle)*180/Math.PI;return{type:"rectangle",center:e.center,width:e.width,height:e.height,rotation_deg:Math.round(s/(t?15:1))*(t?15:1)}}finishPolygon(){this.draft?.type!=="polygon"||this.draft.vertices.length<3||this.commitObstacle({type:"polygon",vertices:this.draft.vertices})}commitObstacle(t){if(this.scene.obstacles.length>=100){this.onStatus({message:"最多配置100个障碍物。"});return}const e=Us(this.scene);t.id=`obstacle_${crypto.randomUUID().slice(0,8)}`,e.obstacles.push(t),this.draft=null,this.onDraftChange(!1),this.onChange(e,"绘制障碍物"),this.onSelect(t.id),this.tool="select",this.container.dispatchEvent(new CustomEvent("toolchange",{detail:"select"})),this.setCursor()}doubleClick(t){this.tool==="polygon"&&(t.preventDefault(),this.finishPolygon())}keyDown(t){["INPUT","TEXTAREA","SELECT"].includes(t.target.tagName)||t.target.isContentEditable||(t.code==="Space"&&(this.spacePressed=!0,this.setCursor(),t.preventDefault()),t.key==="Escape"&&(this.draft=null,this.cancelDrag(),this.onDraftChange(!1),this.drawSoon()),t.key==="Enter"&&this.finishPolygon())}wheel(t){t.preventDefault(),this.zoom(Math.exp(-t.deltaY*.0012),this.eventPoint(t))}capture(){return this.draw(),this.canvas.toDataURL("image/png")}dispose(){this.abort.abort(),this.resizeObserver.disconnect(),cancelAnimationFrame(this.frame),this.canvas.remove()}drawSoon(){this.frame||(this.frame=requestAnimationFrame(()=>{this.frame=0,this.draw()}))}trace(t,e=!1){const n=this.context;n.beginPath(),t.forEach((s,r)=>{const[a,o]=this.toScreen(s);r?n.lineTo(a,o):n.moveTo(a,o)}),e&&n.closePath()}draw(){const t=this.context;if(!t||!this.width||(t.setTransform(this.ratio,0,0,this.ratio,0,0),t.clearRect(0,0,this.width,this.height),t.fillStyle="#f5f8f5",t.fillRect(0,0,this.width,this.height),!this.scene))return;this.drawGrid();const e=this.drag?.scene||this.scene;this.drawWorld(e),this.drawSweep(e),this.drawObstacles(e),this.drawRoutes(),this.drawAircraft(e),this.drawHandles(e),this.drawDraft(),this.drawScale()}drawGrid(){const t=this.context,e=90/this.camera.scale,n=10**Math.floor(Math.log10(e)),s=[1,2,5,10].map(l=>l*n).find(l=>l>=e);this.gridSpacing=s;const[r,a]=this.toWorld([0,0]),[o,c]=this.toWorld([this.width,this.height]);t.font='13px "Segoe UI", sans-serif',t.textAlign="left";for(let l=Math.floor(r/s)*s;l<=o;l+=s/5){const[u]=this.toScreen([l,0]),f=Math.abs(l/s-Math.round(l/s))<1e-5;t.strokeStyle=f?"#dfe7df":"#edf1eb",t.lineWidth=1,t.beginPath(),t.moveTo(u,0),t.lineTo(u,this.height),t.stroke(),f&&(t.fillStyle="#93a397",t.fillText(`${+(l/1e3).toFixed(1)}`,u+5,this.height-10))}for(let l=Math.floor(c/s)*s;l<=a;l+=s/5){const[,u]=this.toScreen([0,l]),f=Math.abs(l/s-Math.round(l/s))<1e-5;t.strokeStyle=f?"#dfe7df":"#edf1eb",t.beginPath(),t.moveTo(0,u),t.lineTo(this.width,u),t.stroke(),f&&(t.fillStyle="#93a397",t.fillText(`${+(l/1e3).toFixed(1)}`,7,u-6))}}drawWorld(t){const{min:e,max:n}=t.world;this.trace([[e,e],[n,e],[n,n],[e,n]],!0),this.context.strokeStyle="#b8c8bc",this.context.lineWidth=1,this.context.setLineDash([5,5]),this.context.stroke(),this.context.setLineDash([])}drawSweep(t){const e=this.context,n=t.sweep,[s,r]=n.center,a=n.size/2;if(this.trace([[s-a,r-a],[s+a,r-a],[s+a,r+a],[s-a,r+a]],!0),e.fillStyle="#20a3890d",e.fill(),e.strokeStyle=this.options.selectedId==="sweep"?"#098a74":"#59a58f",e.lineWidth=this.options.selectedId==="sweep"?2:1.2,e.stroke(),this.options.showSweep!==!1){const l=Math.min(200,Math.max(1,Math.ceil(n.size/n.spacing)));for(let u=0;u<l;u++){const f=-a+n.size*(u+.5)/l,h=n.orientation==="horizontal";this.trace(h?[[s-a,r+f],[s+a,r+f]]:[[s+f,r-a],[s+f,r+a]]),e.strokeStyle="#8bbba75c",e.setLineDash([3,5]),e.lineWidth=1,e.stroke(),e.setLineDash([])}}const[o,c]=this.toScreen([s-a,r+a]);e.font='600 13px "Segoe UI", "Microsoft YaHei", sans-serif',e.fillStyle="#458775",e.fillText(`扫掠区  ${(n.size/1e3).toFixed(0)} × ${(n.size/1e3).toFixed(0)} km`,o+5,c-9)}drawObstacles(t){const e=this.context;for(const n of t.obstacles){const s=this.options.selectedId===n.id,r=a=>{if(n.type==="circle"){const[o,c]=this.toScreen(n.center);e.beginPath(),e.arc(o,c,Math.max(1,(n.radius+a)*this.camera.scale),0,vi)}else this.trace(Fs(n),!0)};if(this.options.showClearance){const o=t.aircraft.find(c=>c.id===this.options.selectedId)?.overrides?.obstacle_margin??t.defaults.obstacle_margin;r(n.type==="circle"?o:0),e.strokeStyle="#d9995b80",e.lineWidth=n.type==="circle"?1:o*this.camera.scale*2,e.lineJoin="round",e.setLineDash(n.type==="circle"?[4,4]:[]),e.stroke(),e.setLineDash([])}if(r(0),e.fillStyle=s?"#e4a17c99":"#ddae9063",e.fill(),e.strokeStyle=s?"#b76b3f":"#bf9172",e.lineWidth=s?2:1.1,e.stroke(),n.type==="circle"&&n.radius*this.camera.scale>15){const[a,o]=this.toScreen(n.center);e.strokeStyle="#ba8e7480",e.lineWidth=1,e.beginPath(),e.moveTo(a-3,o),e.lineTo(a+3,o),e.moveTo(a,o-3),e.lineTo(a,o+3),e.stroke()}}}drawRoutes(){if(!this.result)return;const t=this.context;this.result.aircraft.forEach((e,n)=>{if(e.status!=="success"||!e.path?.length||this.options.hiddenAircraftIds?.has(e.id))return;const s=Ns[n%Ns.length],r=this.options.selectedId===e.id,a=e.trajectory?.length?e.trajectory:e.path.map(([c,l,u])=>({x:c,y:l,yaw:u,phase:"sweep"}));t.lineCap="round",t.lineJoin="round",t.globalAlpha=this.options.resultStale?.47:this.options.selectedId&&!r?.48:.9;for(let c=1;c<a.length;c++){const l=a[c].phase;l==="approach_layer"&&this.options.showApproach===!1||l==="sweep"&&this.options.showSweep===!1||["turn_layer","entry_transition","exit_transition"].includes(l)&&this.options.showTurns===!1||(this.trace([[a[c-1].x,a[c-1].y],[a[c].x,a[c].y]]),t.strokeStyle=s,t.lineWidth=r?2.8:1.7,t.stroke())}if(this.options.showPoints){t.fillStyle="#fff",t.strokeStyle=s,t.lineWidth=1.5;for(const[c,l]of e.path){const u=this.toScreen([c,l]);t.beginPath(),t.arc(...u,4,0,vi),t.fill(),t.stroke()}}const o=Dc(e.trajectory,this.time);o&&this.plane(o.x,o.y,o.yaw,s,9,!0),t.globalAlpha=1})}plane(t,e,n,s,r=10,a=!0){const o=this.context,c=this.toScreen([t,e]);o.save(),o.translate(...c),o.rotate(-n),o.beginPath(),o.moveTo(r,0),o.lineTo(-r*.75,-r*.62),o.lineTo(-r*.35,0),o.lineTo(-r*.75,r*.62),o.closePath(),o.fillStyle=a?s:"#fff",o.strokeStyle=s,o.lineWidth=1.7,o.fill(),o.stroke(),o.restore()}drawAircraft(t){const e=this.context;t.aircraft.forEach((n,s)=>{const r=this.options.selectedId===n.id,a=n.enabled?Ns[s%Ns.length]:"#a4afa6",[o,c]=this.toScreen([n.x,n.y]);if(r&&(e.beginPath(),e.arc(o,c,20,0,vi),e.fillStyle="#fff9",e.fill(),e.strokeStyle=a,e.setLineDash([3,3]),e.stroke(),e.setLineDash([])),this.plane(n.x,n.y,as(n.heading_deg),a,10,!1),r||this.camera.scale>.005){e.fillStyle="#fffE";const l=n.name||n.id;e.font='600 13px "Segoe UI", "Microsoft YaHei", sans-serif';const u=e.measureText(l).width+10;e.fillRect(o+12,c-17,u,17),e.fillStyle="#4a6156",e.fillText(l,o+17,c-5)}})}drawHandles(t){const e=this.context;for(const n of this.handles(t)){const[s,r]=this.toScreen(n.point);e.fillStyle="#fff",e.strokeStyle="#168b78",e.lineWidth=1.7,e.beginPath(),n.kind==="rotation"||n.kind==="heading"?e.arc(s,r,5,0,vi):e.rect(s-4,r-4,8,8),e.fill(),e.stroke()}}drawDraft(){const t=this.draft,e=this.context;if(t){if(e.strokeStyle="#ba7449",e.fillStyle="#dca67830",e.lineWidth=1.5,e.setLineDash([5,4]),t.type==="circle"){const[n,s]=this.toScreen(t.center);e.beginPath(),e.arc(n,s,Math.max(1,dn(t.center,t.pointer)*this.camera.scale),0,vi)}else if(t.type==="rectangle"){const n=t.phase==="rotation"?this.draftRectangle():{type:"polygon",vertices:[t.first,[t.pointer[0],t.first[1]],t.pointer,[t.first[0],t.pointer[1]]]};this.trace(Fs(n),!0)}else this.trace([...t.vertices,t.pointer],!0);if(e.fill(),e.stroke(),e.setLineDash([]),t.type==="polygon")for(const n of t.vertices){const[s,r]=this.toScreen(n);e.beginPath(),e.arc(s,r,3.5,0,vi),e.fillStyle="#ba7449",e.fill()}}}drawScale(){const t=this.context,e=this.gridSpacing||1e4,n=e*this.camera.scale,s=this.width-n-25,r=this.height-32;t.fillStyle="#f5f8f5e8",t.fillRect(s-10,r-20,n+20,35),t.strokeStyle="#6e8577",t.lineWidth=1.2,t.beginPath(),t.moveTo(s,r-4),t.lineTo(s,r),t.lineTo(s+n,r),t.lineTo(s+n,r-4),t.stroke(),t.fillStyle="#6e8577",t.font='13px "Segoe UI", sans-serif',t.textAlign="center",t.fillText(`${e>=1e3?`${e/1e3} km`:`${e} m`}`,s+n/2,r-7),t.textAlign="left"}}/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const No="186",ki={ROTATE:0,DOLLY:1,PAN:2},Oi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},su=0,gl=1,ru=2,Sr=1,au=2,os=3,li=0,Ve=1,Je=2,Fn=0,hs=1,_l=2,vl=3,xl=4,ou=5,Fi=100,lu=101,cu=102,hu=103,uu=104,du=200,fu=201,pu=202,mu=203,Ic=204,Nc=205,gu=206,_u=207,vu=208,xu=209,Su=210,Mu=211,yu=212,bu=213,Eu=214,Fa=0,Oa=1,Ba=2,vs=3,za=4,ka=5,Ha=6,Ga=7,Uc=0,Tu=1,Au=2,xn=0,Fc=1,Oc=2,Bc=3,zc=4,kc=5,Hc=6,Gc=7,Vc=300,ci=301,Vi=302,Kr=303,Jr=304,Gr=306,Va=1e3,In=1001,Wa=1002,Le=1003,wu=1004,Os=1005,Fe=1006,Qr=1007,ai=1008,Qe=1009,Wc=1010,Xc=1011,xs=1012,Uo=1013,Mn=1014,_n=1015,yn=1016,Fo=1017,Oo=1018,Ss=1020,$c=35902,Yc=35899,qc=1021,Zc=1022,ln=1023,zn=1026,oi=1027,Kc=1028,Bo=1029,hi=1030,zo=1031,ko=1033,Mr=33776,yr=33777,br=33778,Er=33779,Xa=35840,$a=35841,Ya=35842,qa=35843,Za=36196,Ka=37492,Ja=37496,Qa=37488,ja=37489,Ar=37490,to=37491,eo=37808,no=37809,io=37810,so=37811,ro=37812,ao=37813,oo=37814,lo=37815,co=37816,ho=37817,uo=37818,fo=37819,po=37820,mo=37821,go=36492,_o=36494,vo=36495,xo=36283,So=36284,wr=36285,Mo=36286,Ru=3200,Sl=0,Cu=1,qn="",Ke="srgb",Rr="srgb-linear",Cr="linear",le="srgb",jr=7680,Pu=519,Lu=512,Du=513,Iu=514,Ho=515,Nu=516,Uu=517,Go=518,Fu=519,Jc=35044,Ml="300 es",vn=2e3,Pr=2001;function Ou(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Lr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Bu(){const i=Lr("canvas");return i.style.display="block",i}const yl={};function Dr(...i){const t="THREE."+i.shift();console.log(t,...i)}function Qc(i){const t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){const e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function zt(...i){i=Qc(i);const t="THREE."+i.shift();{const e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function Jt(...i){i=Qc(i);const t="THREE."+i.shift();{const e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function Hi(...i){const t=i.join(" ");t in yl||(yl[t]=!0,zt(...i))}function zu(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}const ku={[Fa]:Oa,[Ba]:Ha,[za]:Ga,[vs]:ka,[Oa]:Fa,[Ha]:Ba,[Ga]:za,[ka]:vs};class jn{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){const n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){const n=this._listeners;if(n===void 0)return;const s=n[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const n=e[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}}const Ne=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],us=Math.PI/180,yo=180/Math.PI;function On(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ne[i&255]+Ne[i>>8&255]+Ne[i>>16&255]+Ne[i>>24&255]+"-"+Ne[t&255]+Ne[t>>8&255]+"-"+Ne[t>>16&15|64]+Ne[t>>24&255]+"-"+Ne[e&63|128]+Ne[e>>8&255]+"-"+Ne[e>>16&255]+Ne[e>>24&255]+Ne[n&255]+Ne[n>>8&255]+Ne[n>>16&255]+Ne[n>>24&255]).toLowerCase()}function Yt(i,t,e){return Math.max(t,Math.min(e,i))}function Hu(i,t){return(i%t+t)%t}function ta(i,t,e){return(1-e)*i+e*t}function gn(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function ue(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const Gu={DEG2RAD:us},el=class el{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Yt(this.x,t.x,e.x),this.y=Yt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=Yt(this.x,t,e),this.y=Yt(this.y,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Yt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Yt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};el.prototype.isVector2=!0;let at=el;class Zn{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let c=n[s+0],l=n[s+1],u=n[s+2],f=n[s+3],h=r[a+0],d=r[a+1],_=r[a+2],S=r[a+3];if(f!==S||c!==h||l!==d||u!==_){let m=c*h+l*d+u*_+f*S;m<0&&(h=-h,d=-d,_=-_,S=-S,m=-m);let p=1-o;if(m<.9995){const y=Math.acos(m),w=Math.sin(y);p=Math.sin(p*y)/w,o=Math.sin(o*y)/w,c=c*p+h*o,l=l*p+d*o,u=u*p+_*o,f=f*p+S*o}else{c=c*p+h*o,l=l*p+d*o,u=u*p+_*o,f=f*p+S*o;const y=1/Math.sqrt(c*c+l*l+u*u+f*f);c*=y,l*=y,u*=y,f*=y}}t[e]=c,t[e+1]=l,t[e+2]=u,t[e+3]=f}static multiplyQuaternionsFlat(t,e,n,s,r,a){const o=n[s],c=n[s+1],l=n[s+2],u=n[s+3],f=r[a],h=r[a+1],d=r[a+2],_=r[a+3];return t[e]=o*_+u*f+c*d-l*h,t[e+1]=c*_+u*h+l*f-o*d,t[e+2]=l*_+u*d+o*h-c*f,t[e+3]=u*_-o*f-c*h-l*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,c=Math.sin,l=o(n/2),u=o(s/2),f=o(r/2),h=c(n/2),d=c(s/2),_=c(r/2);switch(a){case"XYZ":this._x=h*u*f+l*d*_,this._y=l*d*f-h*u*_,this._z=l*u*_+h*d*f,this._w=l*u*f-h*d*_;break;case"YXZ":this._x=h*u*f+l*d*_,this._y=l*d*f-h*u*_,this._z=l*u*_-h*d*f,this._w=l*u*f+h*d*_;break;case"ZXY":this._x=h*u*f-l*d*_,this._y=l*d*f+h*u*_,this._z=l*u*_+h*d*f,this._w=l*u*f-h*d*_;break;case"ZYX":this._x=h*u*f-l*d*_,this._y=l*d*f+h*u*_,this._z=l*u*_-h*d*f,this._w=l*u*f+h*d*_;break;case"YZX":this._x=h*u*f+l*d*_,this._y=l*d*f+h*u*_,this._z=l*u*_-h*d*f,this._w=l*u*f-h*d*_;break;case"XZY":this._x=h*u*f-l*d*_,this._y=l*d*f-h*u*_,this._z=l*u*_+h*d*f,this._w=l*u*f+h*d*_;break;default:zt("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],c=e[9],l=e[2],u=e[6],f=e[10],h=n+o+f;if(h>0){const d=.5/Math.sqrt(h+1);this._w=.25/d,this._x=(u-c)*d,this._y=(r-l)*d,this._z=(a-s)*d}else if(n>o&&n>f){const d=2*Math.sqrt(1+n-o-f);this._w=(u-c)/d,this._x=.25*d,this._y=(s+a)/d,this._z=(r+l)/d}else if(o>f){const d=2*Math.sqrt(1+o-n-f);this._w=(r-l)/d,this._x=(s+a)/d,this._y=.25*d,this._z=(c+u)/d}else{const d=2*Math.sqrt(1+f-n-o);this._w=(a-s)/d,this._x=(r+l)/d,this._y=(c+u)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Yt(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,c=e._y,l=e._z,u=e._w;return this._x=n*u+a*o+s*l-r*c,this._y=s*u+a*c+r*o-n*l,this._z=r*u+a*l+n*c-s*o,this._w=a*u-n*o-s*c-r*l,this._onChangeCallback(),this}slerp(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let c=1-e;if(o<.9995){const l=Math.acos(o),u=Math.sin(l);c=Math.sin(c*l)/u,e=Math.sin(e*l)/u,this._x=this._x*c+n*e,this._y=this._y*c+s*e,this._z=this._z*c+r*e,this._w=this._w*c+a*e,this._onChangeCallback()}else this._x=this._x*c+n*e,this._y=this._y*c+s*e,this._z=this._z*c+r*e,this._w=this._w*c+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const nl=class nl{constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(bl.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(bl.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,c=t.w,l=2*(a*s-o*n),u=2*(o*e-r*s),f=2*(r*n-a*e);return this.x=e+c*l+a*f-o*u,this.y=n+c*u+o*l-r*f,this.z=s+c*f+r*u-a*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Yt(this.x,t.x,e.x),this.y=Yt(this.y,t.y,e.y),this.z=Yt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=Yt(this.x,t,e),this.y=Yt(this.y,t,e),this.z=Yt(this.z,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Yt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,c=e.z;return this.x=s*c-r*o,this.y=r*a-n*c,this.z=n*o-s*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return ea.copy(this).projectOnVector(t),this.sub(ea)}reflect(t){return this.sub(ea.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Yt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};nl.prototype.isVector3=!0;let L=nl;const ea=new L,bl=new Zn,il=class il{constructor(t,e,n,s,r,a,o,c,l){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,c,l)}set(t,e,n,s,r,a,o,c,l){const u=this.elements;return u[0]=t,u[1]=s,u[2]=o,u[3]=e,u[4]=r,u[5]=c,u[6]=n,u[7]=a,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],c=n[6],l=n[1],u=n[4],f=n[7],h=n[2],d=n[5],_=n[8],S=s[0],m=s[3],p=s[6],y=s[1],w=s[4],M=s[7],b=s[2],T=s[5],R=s[8];return r[0]=a*S+o*y+c*b,r[3]=a*m+o*w+c*T,r[6]=a*p+o*M+c*R,r[1]=l*S+u*y+f*b,r[4]=l*m+u*w+f*T,r[7]=l*p+u*M+f*R,r[2]=h*S+d*y+_*b,r[5]=h*m+d*w+_*T,r[8]=h*p+d*M+_*R,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],u=t[8];return e*a*u-e*o*l-n*r*u+n*o*c+s*r*l-s*a*c}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],u=t[8],f=u*a-o*l,h=o*c-u*r,d=l*r-a*c,_=e*f+n*h+s*d;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);const S=1/_;return t[0]=f*S,t[1]=(s*l-u*n)*S,t[2]=(o*n-s*a)*S,t[3]=h*S,t[4]=(u*e-s*c)*S,t[5]=(s*r-o*e)*S,t[6]=d*S,t[7]=(n*c-l*e)*S,t[8]=(a*e-n*r)*S,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){const c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*a+l*o)+a+t,-s*l,s*c,-s*(-l*a+c*o)+o+e,0,0,1),this}scale(t,e){return Hi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(na.makeScale(t,e)),this}rotate(t){return Hi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(na.makeRotation(-t)),this}translate(t,e){return Hi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(na.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}};il.prototype.isMatrix3=!0;let Vt=il;const na=new Vt,El=new Vt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Tl=new Vt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Vu(){const i={enabled:!0,workingColorSpace:Rr,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===le&&(s.r=Bn(s.r),s.g=Bn(s.g),s.b=Bn(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===le&&(s.r=Gi(s.r),s.g=Gi(s.g),s.b=Gi(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===qn?Cr:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Hi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Hi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Rr]:{primaries:t,whitePoint:n,transfer:Cr,toXYZ:El,fromXYZ:Tl,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Ke},outputColorSpaceConfig:{drawingBufferColorSpace:Ke}},[Ke]:{primaries:t,whitePoint:n,transfer:le,toXYZ:El,fromXYZ:Tl,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Ke}}}),i}const Qt=Vu();function Bn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Gi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let xi;class Wu{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{xi===void 0&&(xi=Lr("canvas")),xi.width=t.width,xi.height=t.height;const s=xi.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=xi}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Lr("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=Bn(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Bn(e[n]/255)*255):e[n]=Bn(e[n]);return{data:e,width:t.width,height:t.height}}else return zt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Xu=0;class Vo{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Xu++}),this.uuid=On(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(ia(s[a].image)):r.push(ia(s[a]))}else r=ia(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function ia(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Wu.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(zt("Texture: Unable to serialize Texture."),{})}let $u=0;const sa=new L;class Oe extends jn{constructor(t=Oe.DEFAULT_IMAGE,e=Oe.DEFAULT_MAPPING,n=In,s=In,r=Fe,a=ai,o=ln,c=Qe,l=Oe.DEFAULT_ANISOTROPY,u=qn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:$u++}),this.uuid=On(),this.name="",this.source=new Vo(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new at(0,0),this.repeat=new at(1,1),this.center=new at(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Vt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(sa).x}get height(){return this.source.getSize(sa).y}get depth(){return this.source.getSize(sa).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const n=t[e];if(n===void 0){zt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){zt(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Vc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Va:t.x=t.x-Math.floor(t.x);break;case In:t.x=t.x<0?0:1;break;case Wa:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Va:t.y=t.y-Math.floor(t.y);break;case In:t.y=t.y<0?0:1;break;case Wa:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Oe.DEFAULT_IMAGE=null;Oe.DEFAULT_MAPPING=Vc;Oe.DEFAULT_ANISOTROPY=1;const sl=class sl{constructor(t=0,e=0,n=0,s=1){this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const c=t.elements,l=c[0],u=c[4],f=c[8],h=c[1],d=c[5],_=c[9],S=c[2],m=c[6],p=c[10];if(Math.abs(u-h)<.01&&Math.abs(f-S)<.01&&Math.abs(_-m)<.01){if(Math.abs(u+h)<.1&&Math.abs(f+S)<.1&&Math.abs(_+m)<.1&&Math.abs(l+d+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const w=(l+1)/2,M=(d+1)/2,b=(p+1)/2,T=(u+h)/4,R=(f+S)/4,v=(_+m)/4;return w>M&&w>b?w<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(w),s=T/n,r=R/n):M>b?M<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(M),n=T/s,r=v/s):b<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(b),n=R/r,s=v/r),this.set(n,s,r,e),this}let y=Math.sqrt((m-_)*(m-_)+(f-S)*(f-S)+(h-u)*(h-u));return Math.abs(y)<.001&&(y=1),this.x=(m-_)/y,this.y=(f-S)/y,this.z=(h-u)/y,this.w=Math.acos((l+d+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Yt(this.x,t.x,e.x),this.y=Yt(this.y,t.y,e.y),this.z=Yt(this.z,t.z,e.z),this.w=Yt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=Yt(this.x,t,e),this.y=Yt(this.y,t,e),this.z=Yt(this.z,t,e),this.w=Yt(this.w,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Yt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};sl.prototype.isVector4=!0;let Me=sl;class Yu extends jn{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Fe,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new Me(0,0,t,e),this.scissorTest=!1,this.viewport=new Me(0,0,t,e),this.textures=[];const s={width:t,height:e,depth:n.depth},r=new Oe(s),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){const e={minFilter:Fe,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const s=Object.assign({},t.textures[e].image);this.textures[e].source=new Vo(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){const e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class cn extends Yu{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class jc extends Oe{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Le,this.minFilter=Le,this.wrapR=In,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class qu extends Oe{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Le,this.minFilter=Le,this.wrapR=In,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}}const Hr=class Hr{constructor(t,e,n,s,r,a,o,c,l,u,f,h,d,_,S,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,c,l,u,f,h,d,_,S,m)}set(t,e,n,s,r,a,o,c,l,u,f,h,d,_,S,m){const p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=s,p[1]=r,p[5]=a,p[9]=o,p[13]=c,p[2]=l,p[6]=u,p[10]=f,p[14]=h,p[3]=d,p[7]=_,p[11]=S,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Hr().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const e=this.elements,n=t.elements,s=1/Si.setFromMatrixColumn(t,0).length(),r=1/Si.setFromMatrixColumn(t,1).length(),a=1/Si.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),c=Math.cos(s),l=Math.sin(s),u=Math.cos(r),f=Math.sin(r);if(t.order==="XYZ"){const h=a*u,d=a*f,_=o*u,S=o*f;e[0]=c*u,e[4]=-c*f,e[8]=l,e[1]=d+_*l,e[5]=h-S*l,e[9]=-o*c,e[2]=S-h*l,e[6]=_+d*l,e[10]=a*c}else if(t.order==="YXZ"){const h=c*u,d=c*f,_=l*u,S=l*f;e[0]=h+S*o,e[4]=_*o-d,e[8]=a*l,e[1]=a*f,e[5]=a*u,e[9]=-o,e[2]=d*o-_,e[6]=S+h*o,e[10]=a*c}else if(t.order==="ZXY"){const h=c*u,d=c*f,_=l*u,S=l*f;e[0]=h-S*o,e[4]=-a*f,e[8]=_+d*o,e[1]=d+_*o,e[5]=a*u,e[9]=S-h*o,e[2]=-a*l,e[6]=o,e[10]=a*c}else if(t.order==="ZYX"){const h=a*u,d=a*f,_=o*u,S=o*f;e[0]=c*u,e[4]=_*l-d,e[8]=h*l+S,e[1]=c*f,e[5]=S*l+h,e[9]=d*l-_,e[2]=-l,e[6]=o*c,e[10]=a*c}else if(t.order==="YZX"){const h=a*c,d=a*l,_=o*c,S=o*l;e[0]=c*u,e[4]=S-h*f,e[8]=_*f+d,e[1]=f,e[5]=a*u,e[9]=-o*u,e[2]=-l*u,e[6]=d*f+_,e[10]=h-S*f}else if(t.order==="XZY"){const h=a*c,d=a*l,_=o*c,S=o*l;e[0]=c*u,e[4]=-f,e[8]=l*u,e[1]=h*f+S,e[5]=a*u,e[9]=d*f-_,e[2]=_*f-d,e[6]=o*u,e[10]=S*f+h}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Zu,t,Ku)}lookAt(t,e,n){const s=this.elements;return We.subVectors(t,e),We.lengthSq()===0&&(We.z=1),We.normalize(),Vn.crossVectors(n,We),Vn.lengthSq()===0&&(Math.abs(n.z)===1?We.x+=1e-4:We.z+=1e-4,We.normalize(),Vn.crossVectors(n,We)),Vn.normalize(),Bs.crossVectors(We,Vn),s[0]=Vn.x,s[4]=Bs.x,s[8]=We.x,s[1]=Vn.y,s[5]=Bs.y,s[9]=We.y,s[2]=Vn.z,s[6]=Bs.z,s[10]=We.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],c=n[8],l=n[12],u=n[1],f=n[5],h=n[9],d=n[13],_=n[2],S=n[6],m=n[10],p=n[14],y=n[3],w=n[7],M=n[11],b=n[15],T=s[0],R=s[4],v=s[8],A=s[12],P=s[1],U=s[5],G=s[9],X=s[13],F=s[2],B=s[6],J=s[10],V=s[14],rt=s[3],$=s[7],tt=s[11],it=s[15];return r[0]=a*T+o*P+c*F+l*rt,r[4]=a*R+o*U+c*B+l*$,r[8]=a*v+o*G+c*J+l*tt,r[12]=a*A+o*X+c*V+l*it,r[1]=u*T+f*P+h*F+d*rt,r[5]=u*R+f*U+h*B+d*$,r[9]=u*v+f*G+h*J+d*tt,r[13]=u*A+f*X+h*V+d*it,r[2]=_*T+S*P+m*F+p*rt,r[6]=_*R+S*U+m*B+p*$,r[10]=_*v+S*G+m*J+p*tt,r[14]=_*A+S*X+m*V+p*it,r[3]=y*T+w*P+M*F+b*rt,r[7]=y*R+w*U+M*B+b*$,r[11]=y*v+w*G+M*J+b*tt,r[15]=y*A+w*X+M*V+b*it,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],c=t[9],l=t[13],u=t[2],f=t[6],h=t[10],d=t[14],_=t[3],S=t[7],m=t[11],p=t[15],y=c*d-l*h,w=o*d-l*f,M=o*h-c*f,b=a*d-l*u,T=a*h-c*u,R=a*f-o*u;return e*(S*y-m*w+p*M)-n*(_*y-m*b+p*T)+s*(_*w-S*b+p*R)-r*(_*M-S*T+m*R)}determinantAffine(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[1],a=t[5],o=t[9],c=t[2],l=t[6],u=t[10];return e*(a*u-o*l)-n*(r*u-o*c)+s*(r*l-a*c)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],u=t[8],f=t[9],h=t[10],d=t[11],_=t[12],S=t[13],m=t[14],p=t[15],y=e*o-n*a,w=e*c-s*a,M=e*l-r*a,b=n*c-s*o,T=n*l-r*o,R=s*l-r*c,v=u*S-f*_,A=u*m-h*_,P=u*p-d*_,U=f*m-h*S,G=f*p-d*S,X=h*p-d*m,F=y*X-w*G+M*U+b*P-T*A+R*v;if(F===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const B=1/F;return t[0]=(o*X-c*G+l*U)*B,t[1]=(s*G-n*X-r*U)*B,t[2]=(S*R-m*T+p*b)*B,t[3]=(h*T-f*R-d*b)*B,t[4]=(c*P-a*X-l*A)*B,t[5]=(e*X-s*P+r*A)*B,t[6]=(m*M-_*R-p*w)*B,t[7]=(u*R-h*M+d*w)*B,t[8]=(a*G-o*P+l*v)*B,t[9]=(n*P-e*G-r*v)*B,t[10]=(_*T-S*M+p*y)*B,t[11]=(f*M-u*T-d*y)*B,t[12]=(o*A-a*U-c*v)*B,t[13]=(e*U-n*A+s*v)*B,t[14]=(S*w-_*b-m*y)*B,t[15]=(u*b-f*w+h*y)*B,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,c=t.z,l=r*a,u=r*o;return this.set(l*a+n,l*o-s*c,l*c+s*o,0,l*o+s*c,u*o+n,u*c-s*a,0,l*c-s*o,u*c+s*a,r*c*c+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,a=e._y,o=e._z,c=e._w,l=r+r,u=a+a,f=o+o,h=r*l,d=r*u,_=r*f,S=a*u,m=a*f,p=o*f,y=c*l,w=c*u,M=c*f,b=n.x,T=n.y,R=n.z;return s[0]=(1-(S+p))*b,s[1]=(d+M)*b,s[2]=(_-w)*b,s[3]=0,s[4]=(d-M)*T,s[5]=(1-(h+p))*T,s[6]=(m+y)*T,s[7]=0,s[8]=(_+w)*R,s[9]=(m-y)*R,s[10]=(1-(h+S))*R,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];const r=this.determinantAffine();if(r===0)return n.set(1,1,1),e.identity(),this;let a=Si.set(s[0],s[1],s[2]).length();const o=Si.set(s[4],s[5],s[6]).length(),c=Si.set(s[8],s[9],s[10]).length();r<0&&(a=-a),sn.copy(this);const l=1/a,u=1/o,f=1/c;return sn.elements[0]*=l,sn.elements[1]*=l,sn.elements[2]*=l,sn.elements[4]*=u,sn.elements[5]*=u,sn.elements[6]*=u,sn.elements[8]*=f,sn.elements[9]*=f,sn.elements[10]*=f,e.setFromRotationMatrix(sn),n.x=a,n.y=o,n.z=c,this}makePerspective(t,e,n,s,r,a,o=vn,c=!1){const l=this.elements,u=2*r/(e-t),f=2*r/(n-s),h=(e+t)/(e-t),d=(n+s)/(n-s);let _,S;if(c)_=r/(a-r),S=a*r/(a-r);else if(o===vn)_=-(a+r)/(a-r),S=-2*a*r/(a-r);else if(o===Pr)_=-a/(a-r),S=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=u,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=f,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=_,l[14]=S,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=vn,c=!1){const l=this.elements,u=2/(e-t),f=2/(n-s),h=-(e+t)/(e-t),d=-(n+s)/(n-s);let _,S;if(c)_=1/(a-r),S=a/(a-r);else if(o===vn)_=-2/(a-r),S=-(a+r)/(a-r);else if(o===Pr)_=-1/(a-r),S=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=u,l[4]=0,l[8]=0,l[12]=h,l[1]=0,l[5]=f,l[9]=0,l[13]=d,l[2]=0,l[6]=0,l[10]=_,l[14]=S,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}};Hr.prototype.isMatrix4=!0;let _e=Hr;const Si=new L,sn=new _e,Zu=new L(0,0,0),Ku=new L(1,1,1),Vn=new L,Bs=new L,We=new L,Al=new _e,wl=new Zn;class ui{constructor(t=0,e=0,n=0,s=ui.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],a=s[4],o=s[8],c=s[1],l=s[5],u=s[9],f=s[2],h=s[6],d=s[10];switch(e){case"XYZ":this._y=Math.asin(Yt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,d),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(h,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Yt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin(Yt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-f,d),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Yt(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(h,d),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin(Yt(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-Yt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,l),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-u,d),this._y=0);break;default:zt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Al.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Al,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return wl.setFromEuler(this),this.setFromQuaternion(wl,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}ui.DEFAULT_ORDER="XYZ";class Wo{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Ju=0;const Rl=new L,Mi=new Zn,wn=new _e,zs=new L,Ki=new L,Qu=new L,ju=new Zn,Cl=new L(1,0,0),Pl=new L(0,1,0),Ll=new L(0,0,1),Dl={type:"added"},td={type:"removed"},yi={type:"childadded",child:null},ra={type:"childremoved",child:null};class Be extends jn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Ju++}),this.uuid=On(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Be.DEFAULT_UP.clone();const t=new L,e=new ui,n=new Zn,s=new L(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new _e},normalMatrix:{value:new Vt}}),this.matrix=new _e,this.matrixWorld=new _e,this.matrixAutoUpdate=Be.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Be.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Wo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Mi.setFromAxisAngle(t,e),this.quaternion.multiply(Mi),this}rotateOnWorldAxis(t,e){return Mi.setFromAxisAngle(t,e),this.quaternion.premultiply(Mi),this}rotateX(t){return this.rotateOnAxis(Cl,t)}rotateY(t){return this.rotateOnAxis(Pl,t)}rotateZ(t){return this.rotateOnAxis(Ll,t)}translateOnAxis(t,e){return Rl.copy(t).applyQuaternion(this.quaternion),this.position.add(Rl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Cl,t)}translateY(t){return this.translateOnAxis(Pl,t)}translateZ(t){return this.translateOnAxis(Ll,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(wn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?zs.copy(t):zs.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),Ki.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?wn.lookAt(Ki,zs,this.up):wn.lookAt(zs,Ki,this.up),this.quaternion.setFromRotationMatrix(wn),s&&(wn.extractRotation(s.matrixWorld),Mi.setFromRotationMatrix(wn),this.quaternion.premultiply(Mi.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Jt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Dl),yi.child=t,this.dispatchEvent(yi),yi.child=null):Jt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(td),ra.child=t,this.dispatchEvent(ra),ra.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),wn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),wn.multiply(t.parent.matrixWorld)),t.applyMatrix4(wn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Dl),yi.child=t,this.dispatchEvent(yi),yi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ki,t,Qu),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ki,ju,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const t=this.pivot;if(t!==null){const e=t.x,n=t.y,s=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*s,r[13]+=n-r[1]*e-r[5]*n-r[9]*s,r[14]+=s-r[2]*e-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){const s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){const r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const c=o.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){const f=c[l];r(t.shapes,f)}else r(t.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(r(t.materials,this.material[c]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){const c=this.animations[o];s.animations.push(r(t.animations,c))}}if(e){const o=a(t.geometries),c=a(t.materials),l=a(t.textures),u=a(t.images),f=a(t.shapes),h=a(t.skeletons),d=a(t.animations),_=a(t.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),u.length>0&&(n.images=u),f.length>0&&(n.shapes=f),h.length>0&&(n.skeletons=h),d.length>0&&(n.animations=d),_.length>0&&(n.nodes=_)}return n.object=s,n;function a(o){const c=[];for(const l in o){const u=o[l];delete u.metadata,c.push(u)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}Be.DEFAULT_UP=new L(0,1,0);Be.DEFAULT_MATRIX_AUTO_UPDATE=!0;Be.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Bi extends Be{constructor(){super(),this.isGroup=!0,this.type="Group"}}const ed={type:"move"};class aa{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Bi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Bi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Bi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null;const o=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){a=!0;for(const S of t.hand.values()){const m=e.getJointPose(S,n),p=this._getHandJoint(l,S);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const u=l.joints["index-finger-tip"],f=l.joints["thumb-tip"],h=u.position.distanceTo(f.position),d=.02,_=.005;l.inputState.pinching&&h>d+_?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&h<=d-_&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(ed)))}return o!==null&&(o.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new Bi;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const th={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Wn={h:0,s:0,l:0},ks={h:0,s:0,l:0};function oa(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class jt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ke){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Qt.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=Qt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Qt.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=Qt.workingColorSpace){if(t=Hu(t,1),e=Yt(e,0,1),n=Yt(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=oa(a,r,t+1/3),this.g=oa(a,r,t),this.b=oa(a,r,t-1/3)}return Qt.colorSpaceToWorking(this,s),this}setStyle(t,e=Ke){function n(r){r!==void 0&&parseFloat(r)<1&&zt("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:zt("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);zt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ke){const n=th[t.toLowerCase()];return n!==void 0?this.setHex(n,e):zt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Bn(t.r),this.g=Bn(t.g),this.b=Bn(t.b),this}copyLinearToSRGB(t){return this.r=Gi(t.r),this.g=Gi(t.g),this.b=Gi(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ke){return Qt.workingToColorSpace(Ue.copy(this),t),Math.round(Yt(Ue.r*255,0,255))*65536+Math.round(Yt(Ue.g*255,0,255))*256+Math.round(Yt(Ue.b*255,0,255))}getHexString(t=Ke){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Qt.workingColorSpace){Qt.workingToColorSpace(Ue.copy(this),e);const n=Ue.r,s=Ue.g,r=Ue.b,a=Math.max(n,s,r),o=Math.min(n,s,r);let c,l;const u=(o+a)/2;if(o===a)c=0,l=0;else{const f=a-o;switch(l=u<=.5?f/(a+o):f/(2-a-o),a){case n:c=(s-r)/f+(s<r?6:0);break;case s:c=(r-n)/f+2;break;case r:c=(n-s)/f+4;break}c/=6}return t.h=c,t.s=l,t.l=u,t}getRGB(t,e=Qt.workingColorSpace){return Qt.workingToColorSpace(Ue.copy(this),e),t.r=Ue.r,t.g=Ue.g,t.b=Ue.b,t}getStyle(t=Ke){Qt.workingToColorSpace(Ue.copy(this),t);const e=Ue.r,n=Ue.g,s=Ue.b;return t!==Ke?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Wn),this.setHSL(Wn.h+t,Wn.s+e,Wn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Wn),t.getHSL(ks);const n=ta(Wn.h,ks.h,e),s=ta(Wn.s,ks.s,e),r=ta(Wn.l,ks.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ue=new jt;jt.NAMES=th;class nd extends Be{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ui,this.environmentIntensity=1,this.environmentRotation=new ui,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}}const rn=new L,Rn=new L,la=new L,Cn=new L,bi=new L,Ei=new L,Il=new L,ca=new L,ha=new L,ua=new L,da=new Me,fa=new Me,pa=new Me;class $e{constructor(t=new L,e=new L,n=new L){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),rn.subVectors(t,e),s.cross(rn);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){rn.subVectors(s,e),Rn.subVectors(n,e),la.subVectors(t,e);const a=rn.dot(rn),o=rn.dot(Rn),c=rn.dot(la),l=Rn.dot(Rn),u=Rn.dot(la),f=a*l-o*o;if(f===0)return r.set(0,0,0),null;const h=1/f,d=(l*c-o*u)*h,_=(a*u-o*c)*h;return r.set(1-d-_,_,d)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Cn)===null?!1:Cn.x>=0&&Cn.y>=0&&Cn.x+Cn.y<=1}static getInterpolation(t,e,n,s,r,a,o,c){return this.getBarycoord(t,e,n,s,Cn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,Cn.x),c.addScaledVector(a,Cn.y),c.addScaledVector(o,Cn.z),c)}static getInterpolatedAttribute(t,e,n,s,r,a){return da.setScalar(0),fa.setScalar(0),pa.setScalar(0),da.fromBufferAttribute(t,e),fa.fromBufferAttribute(t,n),pa.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(da,r.x),a.addScaledVector(fa,r.y),a.addScaledVector(pa,r.z),a}static isFrontFacing(t,e,n,s){return rn.subVectors(n,e),Rn.subVectors(t,e),rn.cross(Rn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return rn.subVectors(this.c,this.b),Rn.subVectors(this.a,this.b),rn.cross(Rn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return $e.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return $e.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return $e.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return $e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return $e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let a,o;bi.subVectors(s,n),Ei.subVectors(r,n),ca.subVectors(t,n);const c=bi.dot(ca),l=Ei.dot(ca);if(c<=0&&l<=0)return e.copy(n);ha.subVectors(t,s);const u=bi.dot(ha),f=Ei.dot(ha);if(u>=0&&f<=u)return e.copy(s);const h=c*f-u*l;if(h<=0&&c>=0&&u<=0)return a=c/(c-u),e.copy(n).addScaledVector(bi,a);ua.subVectors(t,r);const d=bi.dot(ua),_=Ei.dot(ua);if(_>=0&&d<=_)return e.copy(r);const S=d*l-c*_;if(S<=0&&l>=0&&_<=0)return o=l/(l-_),e.copy(n).addScaledVector(Ei,o);const m=u*_-d*f;if(m<=0&&f-u>=0&&d-_>=0)return Il.subVectors(r,s),o=(f-u)/(f-u+(d-_)),e.copy(s).addScaledVector(Il,o);const p=1/(m+S+h);return a=S*p,o=h*p,e.copy(n).addScaledVector(bi,a).addScaledVector(Ei,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}class ws{constructor(t=new L(1/0,1/0,1/0),e=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(an.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(an.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=an.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,an):an.fromBufferAttribute(r,a),an.applyMatrix4(t.matrixWorld),this.expandByPoint(an);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Hs.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Hs.copy(n.boundingBox)),Hs.applyMatrix4(t.matrixWorld),this.union(Hs)}const s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,an),an.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Ji),Gs.subVectors(this.max,Ji),Ti.subVectors(t.a,Ji),Ai.subVectors(t.b,Ji),wi.subVectors(t.c,Ji),Xn.subVectors(Ai,Ti),$n.subVectors(wi,Ai),ei.subVectors(Ti,wi);let e=[0,-Xn.z,Xn.y,0,-$n.z,$n.y,0,-ei.z,ei.y,Xn.z,0,-Xn.x,$n.z,0,-$n.x,ei.z,0,-ei.x,-Xn.y,Xn.x,0,-$n.y,$n.x,0,-ei.y,ei.x,0];return!ma(e,Ti,Ai,wi,Gs)||(e=[1,0,0,0,1,0,0,0,1],!ma(e,Ti,Ai,wi,Gs))?!1:(Vs.crossVectors(Xn,$n),e=[Vs.x,Vs.y,Vs.z],ma(e,Ti,Ai,wi,Gs))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,an).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(an).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Pn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Pn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Pn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Pn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Pn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Pn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Pn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Pn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Pn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const Pn=[new L,new L,new L,new L,new L,new L,new L,new L],an=new L,Hs=new ws,Ti=new L,Ai=new L,wi=new L,Xn=new L,$n=new L,ei=new L,Ji=new L,Gs=new L,Vs=new L,ni=new L;function ma(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){ni.fromArray(i,r);const o=s.x*Math.abs(ni.x)+s.y*Math.abs(ni.y)+s.z*Math.abs(ni.z),c=t.dot(ni),l=e.dot(ni),u=n.dot(ni);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>o)return!1}return!0}const Te=new L,Ws=new at;let id=0;class Sn extends jn{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:id++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Jc,this.updateRanges=[],this.gpuType=_n,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Ws.fromBufferAttribute(this,e),Ws.applyMatrix3(t),this.setXY(e,Ws.x,Ws.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Te.fromBufferAttribute(this,e),Te.applyMatrix3(t),this.setXYZ(e,Te.x,Te.y,Te.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Te.fromBufferAttribute(this,e),Te.applyMatrix4(t),this.setXYZ(e,Te.x,Te.y,Te.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Te.fromBufferAttribute(this,e),Te.applyNormalMatrix(t),this.setXYZ(e,Te.x,Te.y,Te.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Te.fromBufferAttribute(this,e),Te.transformDirection(t),this.setXYZ(e,Te.x,Te.y,Te.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=gn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=ue(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=gn(e,this.array)),e}setX(t,e){return this.normalized&&(e=ue(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=gn(e,this.array)),e}setY(t,e){return this.normalized&&(e=ue(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=gn(e,this.array)),e}setZ(t,e){return this.normalized&&(e=ue(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=gn(e,this.array)),e}setW(t,e){return this.normalized&&(e=ue(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=ue(e,this.array),n=ue(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=ue(e,this.array),n=ue(n,this.array),s=ue(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=ue(e,this.array),n=ue(n,this.array),s=ue(s,this.array),r=ue(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}}class eh extends Sn{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class nh extends Sn{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class De extends Sn{constructor(t,e,n){super(new Float32Array(t),e,n)}}const sd=new ws,Qi=new L,ga=new L;class Rs{constructor(t=new L,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):sd.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Qi.subVectors(t,this.center);const e=Qi.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(Qi,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(ga.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Qi.copy(t.center).add(ga)),this.expandByPoint(Qi.copy(t.center).sub(ga))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}let rd=0;const Ze=new _e,_a=new Be,Ri=new L,Xe=new ws,ji=new ws,Ce=new L;class Pe extends jn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:rd++}),this.uuid=On(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Ou(t)?nh:eh)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Vt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return Ze.makeRotationFromQuaternion(t),this.applyMatrix4(Ze),this}rotateX(t){return Ze.makeRotationX(t),this.applyMatrix4(Ze),this}rotateY(t){return Ze.makeRotationY(t),this.applyMatrix4(Ze),this}rotateZ(t){return Ze.makeRotationZ(t),this.applyMatrix4(Ze),this}translate(t,e,n){return Ze.makeTranslation(t,e,n),this.applyMatrix4(Ze),this}scale(t,e,n){return Ze.makeScale(t,e,n),this.applyMatrix4(Ze),this}lookAt(t){return _a.lookAt(t),_a.updateMatrix(),this.applyMatrix4(_a.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ri).negate(),this.translate(Ri.x,Ri.y,Ri.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let s=0,r=t.length;s<r;s++){const a=t[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new De(n,3))}else{const n=Math.min(t.length,e.count);for(let s=0;s<n;s++){const r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&zt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ws);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Jt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];Xe.setFromBufferAttribute(r),this.morphTargetsRelative?(Ce.addVectors(this.boundingBox.min,Xe.min),this.boundingBox.expandByPoint(Ce),Ce.addVectors(this.boundingBox.max,Xe.max),this.boundingBox.expandByPoint(Ce)):(this.boundingBox.expandByPoint(Xe.min),this.boundingBox.expandByPoint(Xe.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Jt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Rs);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Jt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new L,1/0);return}if(t){const n=this.boundingSphere.center;if(Xe.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){const o=e[r];ji.setFromBufferAttribute(o),this.morphTargetsRelative?(Ce.addVectors(Xe.min,ji.min),Xe.expandByPoint(Ce),Ce.addVectors(Xe.max,ji.max),Xe.expandByPoint(Ce)):(Xe.expandByPoint(ji.min),Xe.expandByPoint(ji.max))}Xe.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)Ce.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Ce));if(e)for(let r=0,a=e.length;r<a;r++){const o=e[r],c=this.morphTargetsRelative;for(let l=0,u=o.count;l<u;l++)Ce.fromBufferAttribute(o,l),c&&(Ri.fromBufferAttribute(t,l),Ce.add(Ri)),s=Math.max(s,n.distanceToSquared(Ce))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Jt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Jt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new Sn(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));const o=[],c=[];for(let v=0;v<n.count;v++)o[v]=new L,c[v]=new L;const l=new L,u=new L,f=new L,h=new at,d=new at,_=new at,S=new L,m=new L;function p(v,A,P){l.fromBufferAttribute(n,v),u.fromBufferAttribute(n,A),f.fromBufferAttribute(n,P),h.fromBufferAttribute(r,v),d.fromBufferAttribute(r,A),_.fromBufferAttribute(r,P),u.sub(l),f.sub(l),d.sub(h),_.sub(h);const U=1/(d.x*_.y-_.x*d.y);isFinite(U)&&(S.copy(u).multiplyScalar(_.y).addScaledVector(f,-d.y).multiplyScalar(U),m.copy(f).multiplyScalar(d.x).addScaledVector(u,-_.x).multiplyScalar(U),o[v].add(S),o[A].add(S),o[P].add(S),c[v].add(m),c[A].add(m),c[P].add(m))}let y=this.groups;y.length===0&&(y=[{start:0,count:t.count}]);for(let v=0,A=y.length;v<A;++v){const P=y[v],U=P.start,G=P.count;for(let X=U,F=U+G;X<F;X+=3)p(t.getX(X+0),t.getX(X+1),t.getX(X+2))}const w=new L,M=new L,b=new L,T=new L;function R(v){b.fromBufferAttribute(s,v),T.copy(b);const A=o[v];w.copy(A),w.sub(b.multiplyScalar(b.dot(A))).normalize(),M.crossVectors(T,A);const U=M.dot(c[v])<0?-1:1;a.setXYZW(v,w.x,w.y,w.z,U)}for(let v=0,A=y.length;v<A;++v){const P=y[v],U=P.start,G=P.count;for(let X=U,F=U+G;X<F;X+=3)R(t.getX(X+0)),R(t.getX(X+1)),R(t.getX(X+2))}this._transformed=!0}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new Sn(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let h=0,d=n.count;h<d;h++)n.setXYZ(h,0,0,0);const s=new L,r=new L,a=new L,o=new L,c=new L,l=new L,u=new L,f=new L;if(t)for(let h=0,d=t.count;h<d;h+=3){const _=t.getX(h+0),S=t.getX(h+1),m=t.getX(h+2);s.fromBufferAttribute(e,_),r.fromBufferAttribute(e,S),a.fromBufferAttribute(e,m),u.subVectors(a,r),f.subVectors(s,r),u.cross(f),o.fromBufferAttribute(n,_),c.fromBufferAttribute(n,S),l.fromBufferAttribute(n,m),o.add(u),c.add(u),l.add(u),n.setXYZ(_,o.x,o.y,o.z),n.setXYZ(S,c.x,c.y,c.z),n.setXYZ(m,l.x,l.y,l.z)}else for(let h=0,d=e.count;h<d;h+=3)s.fromBufferAttribute(e,h+0),r.fromBufferAttribute(e,h+1),a.fromBufferAttribute(e,h+2),u.subVectors(a,r),f.subVectors(s,r),u.cross(f),n.setXYZ(h+0,u.x,u.y,u.z),n.setXYZ(h+1,u.x,u.y,u.z),n.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Ce.fromBufferAttribute(t,e),Ce.normalize(),t.setXYZ(e,Ce.x,Ce.y,Ce.z)}toNonIndexed(){function t(o,c){const l=o.array,u=o.itemSize,f=o.normalized,h=new l.constructor(c.length*u);let d=0,_=0;for(let S=0,m=c.length;S<m;S++){o.isInterleavedBufferAttribute?d=c[S]*o.data.stride+o.offset:d=c[S]*u;for(let p=0;p<u;p++)h[_++]=l[d++]}return new Sn(h,u,f)}if(this.index===null)return zt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new Pe,n=this.index.array,s=this.attributes;for(const o in s){const c=s[o],l=t(c,n);e.setAttribute(o,l)}const r=this.morphAttributes;for(const o in r){const c=[],l=r[o];for(let u=0,f=l.length;u<f;u++){const h=l[u],d=t(h,n);c.push(d)}e.morphAttributes[o]=c}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,c=a.length;o<c;o++){const l=a[o];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const c in n){const l=n[c];t.data.attributes[c]=l.toJSON(t.data)}const s={};let r=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],u=[];for(let f=0,h=l.length;f<h;f++){const d=l[f];u.push(d.toJSON(t.data))}u.length>0&&(s[c]=u,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone());const s=t.attributes;for(const l in s){const u=s[l];this.setAttribute(l,u.clone(e))}const r=t.morphAttributes;for(const l in r){const u=[],f=r[l];for(let h=0,d=f.length;h<d;h++)u.push(f[h].clone(e));this.morphAttributes[l]=u}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let l=0,u=a.length;l<u;l++){const f=a[l];this.addGroup(f.start,f.count,f.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}class ad{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=Jc,this.updateRanges=[],this.version=0,this.uuid=On()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,n){t*=this.stride,n*=e.stride;for(let s=0,r=this.stride;s<r;s++)this.array[t+s]=e.array[n+s];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=On()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(e,this.stride);return n.setUsage(this.usage),n}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=On()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));const e={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return e.usage=this.usage,e}}const ke=new L;class Ir{constructor(t,e,n,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=n,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,n=this.data.count;e<n;e++)ke.fromBufferAttribute(this,e),ke.applyMatrix4(t),this.setXYZ(e,ke.x,ke.y,ke.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)ke.fromBufferAttribute(this,e),ke.applyNormalMatrix(t),this.setXYZ(e,ke.x,ke.y,ke.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)ke.fromBufferAttribute(this,e),ke.transformDirection(t),this.setXYZ(e,ke.x,ke.y,ke.z);return this}getComponent(t,e){let n=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(n=gn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=ue(n,this.array)),this.data.array[t*this.data.stride+this.offset+e]=n,this}setX(t,e){return this.normalized&&(e=ue(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=ue(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=ue(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=ue(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=gn(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=gn(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=gn(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=gn(e,this.array)),e}setXY(t,e,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=ue(e,this.array),n=ue(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this}setXYZ(t,e,n,s){return t=t*this.data.stride+this.offset,this.normalized&&(e=ue(e,this.array),n=ue(n,this.array),s=ue(s,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t=t*this.data.stride+this.offset,this.normalized&&(e=ue(e,this.array),n=ue(n,this.array),s=ue(s,this.array),r=ue(r,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=s,this.data.array[t+3]=r,this}clone(t){if(t===void 0){Dr("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[s+r])}return new Sn(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new Ir(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){Dr("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[s+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}const va=new L,od=new L,ld=new Vt;class Dn{constructor(t=new L(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=va.subVectors(n,e).cross(od.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){const s=t.delta(va),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const a=-(t.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(s,a)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||ld.getNormalMatrix(t),s=this.coplanarPoint(va).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}}let cd=0;class fi extends jn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:cd++}),this.uuid=On(),this.name="",this.type="Material",this.blending=hs,this.side=li,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ic,this.blendDst=Nc,this.blendEquation=Fi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new jt(0,0,0),this.blendAlpha=0,this.depthFunc=vs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Pu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=jr,this.stencilZFail=jr,this.stencilZPass=jr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){zt(`Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){zt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const a=[];for(const o in r){const c=r[o];delete c.metadata,a.push(c)}return a}if(e){const r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new jt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new Dn().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new at().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new at().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}class ih extends fi{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new jt(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}let Ci;const ts=new L,Pi=new L,Li=new L,Di=new at,es=new at,sh=new _e,Xs=new L,ns=new L,$s=new L,Nl=new at,xa=new at,Ul=new at;class hd extends Be{constructor(t=new ih){if(super(),this.isSprite=!0,this.type="Sprite",Ci===void 0){Ci=new Pe;const e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new ad(e,5);Ci.setIndex([0,1,2,0,2,3]),Ci.setAttribute("position",new Ir(n,3,0,!1)),Ci.setAttribute("uv",new Ir(n,2,3,!1))}this.geometry=Ci,this.material=t,this.center=new at(.5,.5),this.count=1}intersectsFrustum(t){return t.intersectsSprite(this)}raycast(t,e){t.camera===null&&Jt('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Pi.setFromMatrixScale(this.matrixWorld),sh.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),Li.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Pi.multiplyScalar(-Li.z);const n=this.material.rotation;let s,r;n!==0&&(r=Math.cos(n),s=Math.sin(n));const a=this.center;Ys(Xs.set(-.5,-.5,0),Li,a,Pi,s,r),Ys(ns.set(.5,-.5,0),Li,a,Pi,s,r),Ys($s.set(.5,.5,0),Li,a,Pi,s,r),Nl.set(0,0),xa.set(1,0),Ul.set(1,1);let o=t.ray.intersectTriangle(Xs,ns,$s,!1,ts);if(o===null&&(Ys(ns.set(-.5,.5,0),Li,a,Pi,s,r),xa.set(0,1),o=t.ray.intersectTriangle(Xs,$s,ns,!1,ts),o===null))return;const c=t.ray.origin.distanceTo(ts);c<t.near||c>t.far||e.push({distance:c,point:ts.clone(),uv:$e.getInterpolation(ts,Xs,ns,$s,Nl,xa,Ul,new at),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}}function Ys(i,t,e,n,s,r){Di.subVectors(i,e).addScalar(.5).multiply(n),s!==void 0?(es.x=r*Di.x-s*Di.y,es.y=s*Di.x+r*Di.y):es.copy(Di),i.copy(t),i.x+=es.x,i.y+=es.y,i.applyMatrix4(sh)}const Ln=new L,Sa=new L,qs=new L,Zs=new L;class Cs{constructor(t=new L,e=new L(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Ln)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=Ln.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Ln.copy(this.origin).addScaledVector(this.direction,e),Ln.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Sa.copy(t).add(e).multiplyScalar(.5),qs.copy(e).sub(t).normalize(),Zs.copy(this.origin).sub(Sa);const r=t.distanceTo(e)*.5,a=-this.direction.dot(qs),o=Zs.dot(this.direction),c=-Zs.dot(qs),l=Zs.lengthSq(),u=Math.abs(1-a*a);let f,h,d,_;if(u>0)if(f=a*c-o,h=a*o-c,_=r*u,f>=0)if(h>=-_)if(h<=_){const S=1/u;f*=S,h*=S,d=f*(f+a*h+2*o)+h*(a*f+h+2*c)+l}else h=r,f=Math.max(0,-(a*h+o)),d=-f*f+h*(h+2*c)+l;else h=-r,f=Math.max(0,-(a*h+o)),d=-f*f+h*(h+2*c)+l;else h<=-_?(f=Math.max(0,-(-a*r+o)),h=f>0?-r:Math.min(Math.max(-r,-c),r),d=-f*f+h*(h+2*c)+l):h<=_?(f=0,h=Math.min(Math.max(-r,-c),r),d=h*(h+2*c)+l):(f=Math.max(0,-(a*r+o)),h=f>0?r:Math.min(Math.max(-r,-c),r),d=-f*f+h*(h+2*c)+l);else h=a>0?-r:r,f=Math.max(0,-(a*h+o)),d=-f*f+h*(h+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(Sa).addScaledVector(qs,h),d}intersectSphere(t,e){if(t.radius<0)return null;Ln.subVectors(t.center,this.origin);const n=Ln.dot(this.direction),s=Ln.dot(Ln)-n*n,r=t.radius*t.radius;if(s>r)return null;const a=Math.sqrt(r-s),o=n-a,c=n+a;return c<0?null:o<0?this.at(c,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,c;const l=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,h=this.origin;return l>=0?(n=(t.min.x-h.x)*l,s=(t.max.x-h.x)*l):(n=(t.max.x-h.x)*l,s=(t.min.x-h.x)*l),u>=0?(r=(t.min.y-h.y)*u,a=(t.max.y-h.y)*u):(r=(t.max.y-h.y)*u,a=(t.min.y-h.y)*u),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),f>=0?(o=(t.min.z-h.z)*f,c=(t.max.z-h.z)*f):(o=(t.max.z-h.z)*f,c=(t.min.z-h.z)*f),n>c||o>s)||((o>n||n!==n)&&(n=o),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,Ln)!==null}intersectTriangle(t,e,n,s,r){const a=this.origin,o=this.direction,c=o.x,l=o.y,u=o.z,f=t.x-a.x,h=t.y-a.y,d=t.z-a.z,_=e.x-a.x,S=e.y-a.y,m=e.z-a.z,p=n.x-a.x,y=n.y-a.y,w=n.z-a.z,M=Math.abs(c),b=Math.abs(l),T=Math.abs(u);let R,v,A,P,U,G,X,F,B,J,V,rt;if(M>=b&&M>=T?(A=c,G=f,B=_,rt=p,c>=0?(R=l,v=u,P=h,U=d,X=S,F=m,J=y,V=w):(R=u,v=l,P=d,U=h,X=m,F=S,J=w,V=y)):b>=T?(A=l,G=h,B=S,rt=y,l>=0?(R=u,v=c,P=d,U=f,X=m,F=_,J=w,V=p):(R=c,v=u,P=f,U=d,X=_,F=m,J=p,V=w)):(A=u,G=d,B=m,rt=w,u>=0?(R=c,v=l,P=f,U=h,X=_,F=S,J=p,V=y):(R=l,v=c,P=h,U=f,X=S,F=_,J=y,V=p)),A===0)return null;const $=R/A,tt=v/A,it=1/A,Lt=P-$*G,At=U-tt*G,ne=X-$*B,qt=F-tt*B,te=J-$*rt,K=V-tt*rt,et=te*qt-K*ne,xt=Lt*K-At*te,Bt=ne*At-qt*Lt;if(s){if(et<0||xt<0||Bt<0)return null}else if((et<0||xt<0||Bt<0)&&(et>0||xt>0||Bt>0))return null;const bt=et+xt+Bt;if(bt===0)return null;const kt=it*(et*G+xt*B+Bt*rt);return(bt>0?kt<0:kt>0)?null:this.at(kt/bt,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class ds extends fi{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new jt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ui,this.combine=Uc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const Fl=new _e,ii=new Cs,Ks=new Rs,Ol=new L,Js=new L,Qs=new L,js=new L,Ma=new L,tr=new L,Bl=new L,er=new L;class tn extends Be{constructor(t=new Pe,e=new ds){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const o=this.morphTargetInfluences;if(r&&o){tr.set(0,0,0);for(let c=0,l=r.length;c<l;c++){const u=o[c],f=r[c];u!==0&&(Ma.fromBufferAttribute(f,t),a?tr.addScaledVector(Ma,u):tr.addScaledVector(Ma.sub(e),u))}e.add(tr)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ks.copy(n.boundingSphere),Ks.applyMatrix4(r),ii.copy(t.ray).recast(t.near),!(Ks.containsPoint(ii.origin)===!1&&(ii.intersectSphere(Ks,Ol)===null||ii.origin.distanceToSquared(Ol)>(t.far-t.near)**2))&&(Fl.copy(r).invert(),ii.copy(t.ray).applyMatrix4(Fl),!(n.boundingBox!==null&&ii.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,ii)))}_computeIntersections(t,e,n){let s;const r=this.geometry,a=this.material,o=r.index,c=r.attributes.position,l=r.attributes.uv,u=r.attributes.uv1,f=r.attributes.normal,h=r.groups,d=r.drawRange;if(o!==null)if(Array.isArray(a))for(let _=0,S=h.length;_<S;_++){const m=h[_],p=a[m.materialIndex],y=Math.max(m.start,d.start),w=Math.min(o.count,Math.min(m.start+m.count,d.start+d.count));for(let M=y,b=w;M<b;M+=3){const T=o.getX(M),R=o.getX(M+1),v=o.getX(M+2);s=nr(this,p,t,n,l,u,f,T,R,v),s&&(s.faceIndex=Math.floor(M/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const _=Math.max(0,d.start),S=Math.min(o.count,d.start+d.count);for(let m=_,p=S;m<p;m+=3){const y=o.getX(m),w=o.getX(m+1),M=o.getX(m+2);s=nr(this,a,t,n,l,u,f,y,w,M),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}else if(c!==void 0)if(Array.isArray(a))for(let _=0,S=h.length;_<S;_++){const m=h[_],p=a[m.materialIndex],y=Math.max(m.start,d.start),w=Math.min(c.count,Math.min(m.start+m.count,d.start+d.count));for(let M=y,b=w;M<b;M+=3){const T=M,R=M+1,v=M+2;s=nr(this,p,t,n,l,u,f,T,R,v),s&&(s.faceIndex=Math.floor(M/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const _=Math.max(0,d.start),S=Math.min(c.count,d.start+d.count);for(let m=_,p=S;m<p;m+=3){const y=m,w=m+1,M=m+2;s=nr(this,a,t,n,l,u,f,y,w,M),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}}}function ud(i,t,e,n,s,r,a,o){let c;if(t.side===Ve?c=n.intersectTriangle(a,r,s,!0,o):c=n.intersectTriangle(s,r,a,t.side===li,o),c===null)return null;er.copy(o),er.applyMatrix4(i.matrixWorld);const l=e.ray.origin.distanceTo(er);return l<e.near||l>e.far?null:{distance:l,point:er.clone(),object:i}}function nr(i,t,e,n,s,r,a,o,c,l){i.getVertexPosition(o,Js),i.getVertexPosition(c,Qs),i.getVertexPosition(l,js);const u=ud(i,t,e,n,Js,Qs,js,Bl);if(u){const f=new L;$e.getBarycoord(Bl,Js,Qs,js,f),s&&(u.uv=$e.getInterpolatedAttribute(s,o,c,l,f,new at)),r&&(u.uv1=$e.getInterpolatedAttribute(r,o,c,l,f,new at)),a&&(u.normal=$e.getInterpolatedAttribute(a,o,c,l,f,new L),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const h={a:o,b:c,c:l,normal:new L,materialIndex:0};$e.getNormal(Js,Qs,js,h.normal),u.face=h,u.barycoord=f}return u}class dd extends Oe{constructor(t=null,e=1,n=1,s,r,a,o,c,l=Le,u=Le,f,h){super(null,a,o,c,l,u,s,r,f,h),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const si=new Rs,fd=new at(.5,.5),ir=new L;class rh{constructor(t=new Dn,e=new Dn,n=new Dn,s=new Dn,r=new Dn,a=new Dn){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=vn,n=!1){const s=this.planes,r=t.elements,a=r[0],o=r[1],c=r[2],l=r[3],u=r[4],f=r[5],h=r[6],d=r[7],_=r[8],S=r[9],m=r[10],p=r[11],y=r[12],w=r[13],M=r[14],b=r[15];if(s[0].setComponents(l-a,d-u,p-_,b-y).normalize(),s[1].setComponents(l+a,d+u,p+_,b+y).normalize(),s[2].setComponents(l+o,d+f,p+S,b+w).normalize(),s[3].setComponents(l-o,d-f,p-S,b-w).normalize(),n)s[4].setComponents(c,h,m,M).normalize(),s[5].setComponents(l-c,d-h,p-m,b-M).normalize();else if(s[4].setComponents(l-c,d-h,p-m,b-M).normalize(),e===vn)s[5].setComponents(l+c,d+h,p+m,b+M).normalize();else if(e===Pr)s[5].setComponents(c,h,m,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),si.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),si.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(si)}intersectsSprite(t){si.center.set(0,0,0);const e=fd.distanceTo(t.center);return si.radius=.7071067811865476+e,si.applyMatrix4(t.matrixWorld),this.intersectsSphere(si)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(ir.x=s.normal.x>0?t.max.x:t.min.x,ir.y=s.normal.y>0?t.max.y:t.min.y,ir.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(ir)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class fs extends fi{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new jt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const Nr=new L,Ur=new L,zl=new _e,is=new Cs,sr=new Rs,ya=new L,kl=new L;class ah extends Be{constructor(t=new Pe,e=new fs){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let s=1,r=e.count;s<r;s++)Nr.fromBufferAttribute(e,s-1),Ur.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=Nr.distanceTo(Ur);t.setAttribute("lineDistance",new De(n,1))}else zt("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),sr.copy(n.boundingSphere),sr.applyMatrix4(s),sr.radius+=r,t.ray.intersectsSphere(sr)===!1)return;zl.copy(s).invert(),is.copy(t.ray).applyMatrix4(zl);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=this.isLineSegments?2:1,u=n.index,h=n.attributes.position;if(u!==null){const d=Math.max(0,a.start),_=Math.min(u.count,a.start+a.count);for(let S=d,m=_-1;S<m;S+=l){const p=u.getX(S),y=u.getX(S+1),w=rr(this,t,is,c,p,y,S);w&&e.push(w)}if(this.isLineLoop){const S=u.getX(_-1),m=u.getX(d),p=rr(this,t,is,c,S,m,_-1);p&&e.push(p)}}else{const d=Math.max(0,a.start),_=Math.min(h.count,a.start+a.count);for(let S=d,m=_-1;S<m;S+=l){const p=rr(this,t,is,c,S,S+1,S);p&&e.push(p)}if(this.isLineLoop){const S=rr(this,t,is,c,_-1,d,_-1);S&&e.push(S)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function rr(i,t,e,n,s,r,a){const o=i.geometry.attributes.position;if(Nr.fromBufferAttribute(o,s),Ur.fromBufferAttribute(o,r),e.distanceSqToSegment(Nr,Ur,ya,kl)>n)return;ya.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(ya);if(!(l<t.near||l>t.far))return{distance:l,point:kl.clone().applyMatrix4(i.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:i}}const Hl=new L,Gl=new L;class Vl extends ah{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[];for(let s=0,r=e.count;s<r;s+=2)Hl.fromBufferAttribute(e,s),Gl.fromBufferAttribute(e,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+Hl.distanceTo(Gl);t.setAttribute("lineDistance",new De(n,1))}else zt("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class oh extends fi{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new jt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const Wl=new _e,bo=new Cs,ar=new Rs,or=new L;class pd extends Be{constructor(t=new Pe,e=new oh){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ar.copy(n.boundingSphere),ar.applyMatrix4(s),ar.radius+=r,t.ray.intersectsSphere(ar)===!1)return;Wl.copy(s).invert(),bo.copy(t.ray).applyMatrix4(Wl);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=n.index,f=n.attributes.position;if(l!==null){const h=Math.max(0,a.start),d=Math.min(l.count,a.start+a.count);for(let _=h,S=d;_<S;_++){const m=l.getX(_);or.fromBufferAttribute(f,m),Xl(or,m,c,s,t,e,this)}}else{const h=Math.max(0,a.start),d=Math.min(f.count,a.start+a.count);for(let _=h,S=d;_<S;_++)or.fromBufferAttribute(f,_),Xl(or,_,c,s,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function Xl(i,t,e,n,s,r,a){const o=bo.distanceSqToPoint(i);if(o<e){const c=new L;bo.closestPointToPoint(i,c),c.applyMatrix4(n);const l=s.ray.origin.distanceTo(c);if(l<s.near||l>s.far)return;r.push({distance:l,distanceToRay:Math.sqrt(o),point:c,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}class lh extends Oe{constructor(t=[],e=ci,n,s,r,a,o,c,l,u){super(t,e,n,s,r,a,o,c,l,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class md extends Oe{constructor(t,e,n,s,r,a,o,c,l){super(t,e,n,s,r,a,o,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Ms extends Oe{constructor(t,e,n=Mn,s,r,a,o=Le,c=Le,l,u=zn,f=1){if(u!==zn&&u!==oi)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const h={width:t,height:e,depth:f};super(h,s,r,a,o,c,u,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Vo(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}}class gd extends Ms{constructor(t,e=Mn,n=ci,s,r,a=Le,o=Le,c,l=zn){const u={width:t,height:t,depth:1},f=[u,u,u,u,u,u];super(t,t,e,n,s,r,a,o,c,l),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}}class ch extends Oe{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class Ps extends Pe{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};const o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);const c=[],l=[],u=[],f=[];let h=0,d=0;_("z","y","x",-1,-1,n,e,t,a,r,0),_("z","y","x",1,-1,n,e,-t,a,r,1),_("x","z","y",1,1,t,n,e,s,a,2),_("x","z","y",1,-1,t,n,-e,s,a,3),_("x","y","z",1,-1,t,e,n,s,r,4),_("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new De(l,3)),this.setAttribute("normal",new De(u,3)),this.setAttribute("uv",new De(f,2));function _(S,m,p,y,w,M,b,T,R,v,A){const P=M/R,U=b/v,G=M/2,X=b/2,F=T/2,B=R+1,J=v+1;let V=0,rt=0;const $=new L;for(let tt=0;tt<J;tt++){const it=tt*U-X;for(let Lt=0;Lt<B;Lt++){const At=Lt*P-G;$[S]=At*y,$[m]=it*w,$[p]=F,l.push($.x,$.y,$.z),$[S]=0,$[m]=0,$[p]=T>0?1:-1,u.push($.x,$.y,$.z),f.push(Lt/R),f.push(1-tt/v),V+=1}}for(let tt=0;tt<v;tt++)for(let it=0;it<R;it++){const Lt=h+it+B*tt,At=h+it+B*(tt+1),ne=h+(it+1)+B*(tt+1),qt=h+(it+1)+B*tt;c.push(Lt,At,qt),c.push(At,ne,qt),rt+=6}o.addGroup(d,rt,A),d+=rt,h+=V}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ps(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}const lr=new L,cr=new L,ba=new L,hr=new $e;class _d extends Pe{constructor(t=null,e=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:t,thresholdAngle:e},t!==null){const s=Math.pow(10,4),r=Math.cos(us*e),a=t.getIndex(),o=t.getAttribute("position"),c=a?a.count:o.count,l=[0,0,0],u=["a","b","c"],f=new Array(3),h={},d=[];for(let _=0;_<c;_+=3){a?(l[0]=a.getX(_),l[1]=a.getX(_+1),l[2]=a.getX(_+2)):(l[0]=_,l[1]=_+1,l[2]=_+2);const{a:S,b:m,c:p}=hr;if(S.fromBufferAttribute(o,l[0]),m.fromBufferAttribute(o,l[1]),p.fromBufferAttribute(o,l[2]),hr.getNormal(ba),f[0]=`${Math.round(S.x*s)},${Math.round(S.y*s)},${Math.round(S.z*s)}`,f[1]=`${Math.round(m.x*s)},${Math.round(m.y*s)},${Math.round(m.z*s)}`,f[2]=`${Math.round(p.x*s)},${Math.round(p.y*s)},${Math.round(p.z*s)}`,!(f[0]===f[1]||f[1]===f[2]||f[2]===f[0]))for(let y=0;y<3;y++){const w=(y+1)%3,M=f[y],b=f[w],T=hr[u[y]],R=hr[u[w]],v=`${M}_${b}`,A=`${b}_${M}`;A in h&&h[A]?(ba.dot(h[A].normal)<=r&&(d.push(T.x,T.y,T.z),d.push(R.x,R.y,R.z)),h[A]=null):v in h||(h[v]={index0:l[y],index1:l[w],normal:ba.clone()})}}for(const _ in h)if(h[_]){const{index0:S,index1:m}=h[_];lr.fromBufferAttribute(o,S),cr.fromBufferAttribute(o,m),d.push(lr.x,lr.y,lr.z),d.push(cr.x,cr.y,cr.z)}this.setAttribute("position",new De(d,3))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}}class An{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){zt("Curve: .getPoint() not implemented.")}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,s=this.getPoint(0),r=0;e.push(0);for(let a=1;a<=t;a++)n=this.getPoint(a/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e=null){const n=this.getLengths();let s=0;const r=n.length;let a;e?a=e:a=t*n[r-1];let o=0,c=r-1,l;for(;o<=c;)if(s=Math.floor(o+(c-o)/2),l=n[s]-a,l<0)o=s+1;else if(l>0)c=s-1;else{c=s;break}if(s=c,n[s]===a)return s/(r-1);const u=n[s],h=n[s+1]-u,d=(a-u)/h;return(s+d)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);const a=this.getPoint(s),o=this.getPoint(r),c=e||(a.isVector2?new at:new L);return c.copy(o).sub(a).normalize(),c}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e=!1){const n=new L,s=[],r=[],a=[],o=new L,c=new _e;for(let d=0;d<=t;d++){const _=d/t;s[d]=this.getTangentAt(_,new L)}r[0]=new L,a[0]=new L;let l=Number.MAX_VALUE;const u=Math.abs(s[0].x),f=Math.abs(s[0].y),h=Math.abs(s[0].z);u<=l&&(l=u,n.set(1,0,0)),f<=l&&(l=f,n.set(0,1,0)),h<=l&&n.set(0,0,1),o.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],o),a[0].crossVectors(s[0],r[0]);for(let d=1;d<=t;d++){if(r[d]=r[d-1].clone(),a[d]=a[d-1].clone(),o.crossVectors(s[d-1],s[d]),o.length()>Number.EPSILON){o.normalize();const _=Math.acos(Yt(s[d-1].dot(s[d]),-1,1));r[d].applyMatrix4(c.makeRotationAxis(o,_))}a[d].crossVectors(s[d],r[d])}if(e===!0){let d=Math.acos(Yt(r[0].dot(r[t]),-1,1));d/=t,s[0].dot(o.crossVectors(r[0],r[t]))>0&&(d=-d);for(let _=1;_<=t;_++)r[_].applyMatrix4(c.makeRotationAxis(s[_],d*_)),a[_].crossVectors(s[_],r[_])}return{tangents:s,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class Xo extends An{constructor(t=0,e=0,n=1,s=1,r=0,a=Math.PI*2,o=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=c}getPoint(t,e=new at){const n=e,s=Math.PI*2;let r=this.aEndAngle-this.aStartAngle;const a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(a?r=0:r=s),this.aClockwise===!0&&!a&&(r===s?r=-s:r=r-s);const o=this.aStartAngle+t*r;let c=this.aX+this.xRadius*Math.cos(o),l=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const u=Math.cos(this.aRotation),f=Math.sin(this.aRotation),h=c-this.aX,d=l-this.aY;c=h*u-d*f+this.aX,l=h*f+d*u+this.aY}return n.set(c,l)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class vd extends Xo{constructor(t,e,n,s,r,a){super(t,e,n,n,s,r,a),this.isArcCurve=!0,this.type="ArcCurve"}}function $o(){let i=0,t=0,e=0,n=0;function s(r,a,o,c){i=r,t=o,e=-3*r+3*a-2*o-c,n=2*r-2*a+o+c}return{initCatmullRom:function(r,a,o,c,l){s(a,o,l*(o-r),l*(c-a))},initNonuniformCatmullRom:function(r,a,o,c,l,u,f){let h=(a-r)/l-(o-r)/(l+u)+(o-a)/u,d=(o-a)/u-(c-a)/(u+f)+(c-o)/f;h*=u,d*=u,s(a,o,h,d)},calc:function(r){const a=r*r,o=a*r;return i+t*r+e*a+n*o}}}const $l=new L,Yl=new L,Ea=new $o,Ta=new $o,Aa=new $o;class xd extends An{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new L){const n=e,s=this.points,r=s.length,a=(r-(this.closed?0:1))*t;let o=Math.floor(a),c=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:c===0&&o===r-1&&(o=r-2,c=1);let l,u;this.closed||o>0?l=s[(o-1)%r]:(Yl.subVectors(s[0],s[1]).add(s[0]),l=Yl);const f=s[o%r],h=s[(o+1)%r];if(this.closed||o+2<r?u=s[(o+2)%r]:($l.subVectors(s[r-1],s[r-2]).add(s[r-1]),u=$l),this.curveType==="centripetal"||this.curveType==="chordal"){const d=this.curveType==="chordal"?.5:.25;let _=Math.pow(l.distanceToSquared(f),d),S=Math.pow(f.distanceToSquared(h),d),m=Math.pow(h.distanceToSquared(u),d);S<1e-4&&(S=1),_<1e-4&&(_=S),m<1e-4&&(m=S),Ea.initNonuniformCatmullRom(l.x,f.x,h.x,u.x,_,S,m),Ta.initNonuniformCatmullRom(l.y,f.y,h.y,u.y,_,S,m),Aa.initNonuniformCatmullRom(l.z,f.z,h.z,u.z,_,S,m)}else this.curveType==="catmullrom"&&(Ea.initCatmullRom(l.x,f.x,h.x,u.x,this.tension),Ta.initCatmullRom(l.y,f.y,h.y,u.y,this.tension),Aa.initCatmullRom(l.z,f.z,h.z,u.z,this.tension));return n.set(Ea.calc(c),Ta.calc(c),Aa.calc(c)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new L().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function ql(i,t,e,n,s){const r=(n-t)*.5,a=(s-e)*.5,o=i*i,c=i*o;return(2*e-2*n+r+a)*c+(-3*e+3*n-2*r-a)*o+r*i+e}function Sd(i,t){const e=1-i;return e*e*t}function Md(i,t){return 2*(1-i)*i*t}function yd(i,t){return i*i*t}function ps(i,t,e,n){return Sd(i,t)+Md(i,e)+yd(i,n)}function bd(i,t){const e=1-i;return e*e*e*t}function Ed(i,t){const e=1-i;return 3*e*e*i*t}function Td(i,t){return 3*(1-i)*i*i*t}function Ad(i,t){return i*i*i*t}function ms(i,t,e,n,s){return bd(i,t)+Ed(i,e)+Td(i,n)+Ad(i,s)}class hh extends An{constructor(t=new at,e=new at,n=new at,s=new at){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new at){const n=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(ms(t,s.x,r.x,a.x,o.x),ms(t,s.y,r.y,a.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class wd extends An{constructor(t=new L,e=new L,n=new L,s=new L){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new L){const n=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(ms(t,s.x,r.x,a.x,o.x),ms(t,s.y,r.y,a.y,o.y),ms(t,s.z,r.z,a.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class uh extends An{constructor(t=new at,e=new at){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new at){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new at){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Rd extends An{constructor(t=new L,e=new L){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new L){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new L){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class dh extends An{constructor(t=new at,e=new at,n=new at){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new at){const n=e,s=this.v0,r=this.v1,a=this.v2;return n.set(ps(t,s.x,r.x,a.x),ps(t,s.y,r.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Cd extends An{constructor(t=new L,e=new L,n=new L){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new L){const n=e,s=this.v0,r=this.v1,a=this.v2;return n.set(ps(t,s.x,r.x,a.x),ps(t,s.y,r.y,a.y),ps(t,s.z,r.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class fh extends An{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new at){const n=e,s=this.points,r=(s.length-1)*t,a=Math.floor(r),o=r-a,c=s[a===0?a:a-1],l=s[a],u=s[a>s.length-2?s.length-1:a+1],f=s[a>s.length-3?s.length-1:a+2];return n.set(ql(o,c.x,l.x,u.x,f.x),ql(o,c.y,l.y,u.y,f.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new at().fromArray(s))}return this}}var Eo=Object.freeze({__proto__:null,ArcCurve:vd,CatmullRomCurve3:xd,CubicBezierCurve:hh,CubicBezierCurve3:wd,EllipseCurve:Xo,LineCurve:uh,LineCurve3:Rd,QuadraticBezierCurve:dh,QuadraticBezierCurve3:Cd,SplineCurve:fh});class Pd extends An{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Eo[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),s=this.getCurveLengths();let r=0;for(;r<s.length;){if(s[r]>=n){const a=s[r]-n,o=this.curves[r],c=o.getLength(),l=c===0?0:1-a/c;return o.getPointAt(l,e)}r++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,s=this.curves.length;n<s;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let s=0,r=this.curves;s<r.length;s++){const a=r[s],o=a.isEllipseCurve?t*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?t*a.points.length:t,c=a.getPoints(o);for(let l=0;l<c.length;l++){const u=c[l];n&&n.equals(u)||(e.push(u),n=u)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(new Eo[s.type]().fromJSON(s))}return this}}class Zl extends Pd{constructor(t){super(),this.type="Path",this.currentPoint=new at,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new uh(this.currentPoint.clone(),new at(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,s){const r=new dh(this.currentPoint.clone(),new at(t,e),new at(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(t,e,n,s,r,a){const o=new hh(this.currentPoint.clone(),new at(t,e),new at(n,s),new at(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new fh(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,s,r,a){const o=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(t+o,e+c,n,s,r,a),this}absarc(t,e,n,s,r,a){return this.absellipse(t,e,n,n,s,r,a),this}ellipse(t,e,n,s,r,a,o,c){const l=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(t+l,e+u,n,s,r,a,o,c),this}absellipse(t,e,n,s,r,a,o,c){const l=new Xo(t,e,n,s,r,a,o,c);if(this.curves.length>0){const f=l.getPoint(0);f.equals(this.currentPoint)||this.lineTo(f.x,f.y)}this.curves.push(l);const u=l.getPoint(1);return this.currentPoint.copy(u),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class gs extends Zl{constructor(t){super(t),this.uuid=On(),this.type="Shape",this.holes=[]}getPointsHoles(t){const e=[];for(let n=0,s=this.holes.length;n<s;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){const s=this.holes[e];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(new Zl().fromJSON(s))}return this}}function Ld(i,t,e=2){const n=t&&t.length,s=n?t[0]*e:i.length;let r=ph(i,0,s,e,!0);const a=[];if(!r||r.next===r.prev)return a;let o,c,l;if(n&&(r=Fd(i,t,r,e)),i.length>80*e){o=i[0],c=i[1];let u=o,f=c;for(let h=e;h<s;h+=e){const d=i[h],_=i[h+1];d<o&&(o=d),_<c&&(c=_),d>u&&(u=d),_>f&&(f=_)}l=Math.max(u-o,f-c),l=l!==0?32767/l:0}return ys(r,a,e,o,c,l,0),a}function ph(i,t,e,n,s){let r;if(s===Yd(i,t,e,n)>0)for(let a=t;a<e;a+=n)r=Kl(a/n|0,i[a],i[a+1],r);else for(let a=e-n;a>=t;a-=n)r=Kl(a/n|0,i[a],i[a+1],r);return r&&Wi(r,r.next)&&(Es(r),r=r.next),r}function di(i,t){if(!i)return i;t||(t=i);let e=i,n;do if(n=!1,!e.steiner&&(Wi(e,e.next)||Se(e.prev,e,e.next)===0)){if(Es(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function ys(i,t,e,n,s,r,a){if(!i)return;!a&&r&&Hd(i,n,s,r);let o=i;for(;i.prev!==i.next;){const c=i.prev,l=i.next;if(r?Id(i,n,s,r):Dd(i)){t.push(c.i,i.i,l.i),Es(i),i=l.next,o=l.next;continue}if(i=l,i===o){a?a===1?(i=Nd(di(i),t),ys(i,t,e,n,s,r,2)):a===2&&Ud(i,t,e,n,s,r):ys(di(i),t,e,n,s,r,1);break}}}function Dd(i){const t=i.prev,e=i,n=i.next;if(Se(t,e,n)>=0)return!1;const s=t.x,r=e.x,a=n.x,o=t.y,c=e.y,l=n.y,u=Math.min(s,r,a),f=Math.min(o,c,l),h=Math.max(s,r,a),d=Math.max(o,c,l);let _=n.next;for(;_!==t;){if(_.x>=u&&_.x<=h&&_.y>=f&&_.y<=d&&ls(s,o,r,c,a,l,_.x,_.y)&&Se(_.prev,_,_.next)>=0)return!1;_=_.next}return!0}function Id(i,t,e,n){const s=i.prev,r=i,a=i.next;if(Se(s,r,a)>=0)return!1;const o=s.x,c=r.x,l=a.x,u=s.y,f=r.y,h=a.y,d=Math.min(o,c,l),_=Math.min(u,f,h),S=Math.max(o,c,l),m=Math.max(u,f,h),p=To(d,_,t,e,n),y=To(S,m,t,e,n);let w=i.prevZ,M=i.nextZ;for(;w&&w.z>=p&&M&&M.z<=y;){if(w.x>=d&&w.x<=S&&w.y>=_&&w.y<=m&&w!==s&&w!==a&&ls(o,u,c,f,l,h,w.x,w.y)&&Se(w.prev,w,w.next)>=0||(w=w.prevZ,M.x>=d&&M.x<=S&&M.y>=_&&M.y<=m&&M!==s&&M!==a&&ls(o,u,c,f,l,h,M.x,M.y)&&Se(M.prev,M,M.next)>=0))return!1;M=M.nextZ}for(;w&&w.z>=p;){if(w.x>=d&&w.x<=S&&w.y>=_&&w.y<=m&&w!==s&&w!==a&&ls(o,u,c,f,l,h,w.x,w.y)&&Se(w.prev,w,w.next)>=0)return!1;w=w.prevZ}for(;M&&M.z<=y;){if(M.x>=d&&M.x<=S&&M.y>=_&&M.y<=m&&M!==s&&M!==a&&ls(o,u,c,f,l,h,M.x,M.y)&&Se(M.prev,M,M.next)>=0)return!1;M=M.nextZ}return!0}function Nd(i,t){let e=i;do{const n=e.prev,s=e.next.next;!Wi(n,s)&&gh(n,e,e.next,s)&&bs(n,s)&&bs(s,n)&&(t.push(n.i,e.i,s.i),Es(e),Es(e.next),e=i=s),e=e.next}while(e!==i);return di(e)}function Ud(i,t,e,n,s,r){let a=i;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&Wd(a,o)){let c=_h(a,o);a=di(a,a.next),c=di(c,c.next),ys(a,t,e,n,s,r,0),ys(c,t,e,n,s,r,0);return}o=o.next}a=a.next}while(a!==i)}function Fd(i,t,e,n){const s=[];for(let r=0,a=t.length;r<a;r++){const o=t[r]*n,c=r<a-1?t[r+1]*n:i.length,l=ph(i,o,c,n,!1);l===l.next&&(l.steiner=!0),s.push(Vd(l))}s.sort(Od);for(let r=0;r<s.length;r++)e=Bd(s[r],e);return e}function Od(i,t){let e=i.x-t.x;if(e===0&&(e=i.y-t.y,e===0)){const n=(i.next.y-i.y)/(i.next.x-i.x),s=(t.next.y-t.y)/(t.next.x-t.x);e=n-s}return e}function Bd(i,t){const e=zd(i,t);if(!e)return t;const n=_h(e,i);return di(n,n.next),di(e,e.next)}function zd(i,t){let e=t;const n=i.x,s=i.y;let r=-1/0,a;if(Wi(i,e))return e;do{if(Wi(i,e.next))return e.next;if(s<=e.y&&s>=e.next.y&&e.next.y!==e.y){const f=e.x+(s-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(f<=n&&f>r&&(r=f,a=e.x<e.next.x?e:e.next,f===n))return a}e=e.next}while(e!==t);if(!a)return null;const o=a,c=a.x,l=a.y;let u=1/0;e=a;do{if(n>=e.x&&e.x>=c&&n!==e.x&&mh(s<l?n:r,s,c,l,s<l?r:n,s,e.x,e.y)){const f=Math.abs(s-e.y)/(n-e.x);bs(e,i)&&(f<u||f===u&&(e.x>a.x||e.x===a.x&&kd(a,e)))&&(a=e,u=f)}e=e.next}while(e!==o);return a}function kd(i,t){return Se(i.prev,i,t.prev)<0&&Se(t.next,i,i.next)<0}function Hd(i,t,e,n){let s=i;do s.z===0&&(s.z=To(s.x,s.y,t,e,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,Gd(s)}function Gd(i){let t,e=1;do{let n=i,s;i=null;let r=null;for(t=0;n;){t++;let a=n,o=0;for(let l=0;l<e&&(o++,a=a.nextZ,!!a);l++);let c=e;for(;o>0||c>0&&a;)o!==0&&(c===0||!a||n.z<=a.z)?(s=n,n=n.nextZ,o--):(s=a,a=a.nextZ,c--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;n=a}r.nextZ=null,e*=2}while(t>1);return i}function To(i,t,e,n,s){return i=(i-e)*s|0,t=(t-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,i|t<<1}function Vd(i){let t=i,e=i;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==i);return e}function mh(i,t,e,n,s,r,a,o){return(s-a)*(t-o)>=(i-a)*(r-o)&&(i-a)*(n-o)>=(e-a)*(t-o)&&(e-a)*(r-o)>=(s-a)*(n-o)}function ls(i,t,e,n,s,r,a,o){return!(i===a&&t===o)&&mh(i,t,e,n,s,r,a,o)}function Wd(i,t){return i.next.i!==t.i&&i.prev.i!==t.i&&!Xd(i,t)&&(bs(i,t)&&bs(t,i)&&$d(i,t)&&(Se(i.prev,i,t.prev)||Se(i,t.prev,t))||Wi(i,t)&&Se(i.prev,i,i.next)>0&&Se(t.prev,t,t.next)>0)}function Se(i,t,e){return(t.y-i.y)*(e.x-t.x)-(t.x-i.x)*(e.y-t.y)}function Wi(i,t){return i.x===t.x&&i.y===t.y}function gh(i,t,e,n){const s=dr(Se(i,t,e)),r=dr(Se(i,t,n)),a=dr(Se(e,n,i)),o=dr(Se(e,n,t));return!!(s!==r&&a!==o||s===0&&ur(i,e,t)||r===0&&ur(i,n,t)||a===0&&ur(e,i,n)||o===0&&ur(e,t,n))}function ur(i,t,e){return t.x<=Math.max(i.x,e.x)&&t.x>=Math.min(i.x,e.x)&&t.y<=Math.max(i.y,e.y)&&t.y>=Math.min(i.y,e.y)}function dr(i){return i>0?1:i<0?-1:0}function Xd(i,t){let e=i;do{if(e.i!==i.i&&e.next.i!==i.i&&e.i!==t.i&&e.next.i!==t.i&&gh(e,e.next,i,t))return!0;e=e.next}while(e!==i);return!1}function bs(i,t){return Se(i.prev,i,i.next)<0?Se(i,t,i.next)>=0&&Se(i,i.prev,t)>=0:Se(i,t,i.prev)<0||Se(i,i.next,t)<0}function $d(i,t){let e=i,n=!1;const s=(i.x+t.x)/2,r=(i.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&s<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==i);return n}function _h(i,t){const e=Ao(i.i,i.x,i.y),n=Ao(t.i,t.x,t.y),s=i.next,r=t.prev;return i.next=t,t.prev=i,e.next=s,s.prev=e,n.next=e,e.prev=n,r.next=n,n.prev=r,n}function Kl(i,t,e,n){const s=Ao(i,t,e);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function Es(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function Ao(i,t,e){return{i,x:t,y:e,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Yd(i,t,e,n){let s=0;for(let r=t,a=e-n;r<e;r+=n)s+=(i[a]-i[r])*(i[r+1]+i[a+1]),a=r;return s}class qd{static triangulate(t,e,n=2){return Ld(t,e,n)}}class Nn{static area(t){const e=t.length;let n=0;for(let s=e-1,r=0;r<e;s=r++)n+=t[s].x*t[r].y-t[r].x*t[s].y;return n*.5}static isClockWise(t){return Nn.area(t)<0}static triangulateShape(t,e){const n=[],s=[],r=[];Jl(t),Ql(n,t);let a=t.length;e.forEach(Jl);for(let c=0;c<e.length;c++)s.push(a),a+=e[c].length,Ql(n,e[c]);const o=qd.triangulate(n,s);for(let c=0;c<o.length;c+=3)r.push(o.slice(c,c+3));return r}}function Jl(i){const t=i.length;t>2&&i[t-1].equals(i[0])&&i.pop()}function Ql(i,t){for(let e=0;e<t.length;e++)i.push(t[e].x),i.push(t[e].y)}class Yo extends Pe{constructor(t=new gs([new at(.5,.5),new at(-.5,.5),new at(-.5,-.5),new at(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];const n=this,s=[],r=[];for(let o=0,c=t.length;o<c;o++){const l=t[o];a(l)}this.setAttribute("position",new De(s,3)),this.setAttribute("uv",new De(r,2)),this.computeVertexNormals();function a(o){const c=[],l=e.curveSegments!==void 0?e.curveSegments:12,u=e.steps!==void 0?e.steps:1,f=e.depth!==void 0?e.depth:1;let h=e.bevelEnabled!==void 0?e.bevelEnabled:!0,d=e.bevelThickness!==void 0?e.bevelThickness:.2,_=e.bevelSize!==void 0?e.bevelSize:d-.1,S=e.bevelOffset!==void 0?e.bevelOffset:0,m=e.bevelSegments!==void 0?e.bevelSegments:3;const p=e.extrudePath,y=e.UVGenerator!==void 0?e.UVGenerator:Zd;let w,M=!1,b,T,R,v;if(p){w=p.getSpacedPoints(u),M=!0,h=!1;const nt=p.isCatmullRomCurve3?p.closed:!1;b=p.computeFrenetFrames(u,nt),T=new L,R=new L,v=new L}h||(m=0,d=0,_=0,S=0);const A=o.extractPoints(l);let P=A.shape;const U=A.holes;if(!Nn.isClockWise(P)){P=P.reverse();for(let nt=0,ot=U.length;nt<ot;nt++){const lt=U[nt];Nn.isClockWise(lt)&&(U[nt]=lt.reverse())}}function X(nt){const lt=10000000000000001e-36;let ct=nt[0];for(let dt=1;dt<=nt.length;dt++){const Ft=dt%nt.length,Ut=nt[Ft],Ht=Ut.x-ct.x,Gt=Ut.y-ct.y,C=Ht*Ht+Gt*Gt,se=Math.max(Math.abs(Ut.x),Math.abs(Ut.y),Math.abs(ct.x),Math.abs(ct.y)),Zt=lt*se*se;if(C<=Zt){nt.splice(Ft,1),dt--;continue}ct=Ut}}X(P),U.forEach(X);const F=U.length,B=P;for(let nt=0;nt<F;nt++){const ot=U[nt];P=P.concat(ot)}function J(nt,ot,lt){return ot||Jt("ExtrudeGeometry: vec does not exist"),nt.clone().addScaledVector(ot,lt)}const V=P.length;function rt(nt,ot,lt){let ct,dt,Ft;const Ut=nt.x-ot.x,Ht=nt.y-ot.y,Gt=lt.x-nt.x,C=lt.y-nt.y,se=Ut*Ut+Ht*Ht,Zt=Ut*C-Ht*Gt;if(Math.abs(Zt)>Number.EPSILON){const E=Math.sqrt(se),g=Math.sqrt(Gt*Gt+C*C),O=ot.x-Ht/E,H=ot.y+Ut/E,Y=lt.x-C/g,ht=lt.y+Gt/g,ut=((Y-O)*C-(ht-H)*Gt)/(Ut*C-Ht*Gt);ct=O+Ut*ut-nt.x,dt=H+Ht*ut-nt.y;const q=ct*ct+dt*dt;if(q<=2)return new at(ct,dt);Ft=Math.sqrt(q/2)}else{let E=!1;Ut>Number.EPSILON?Gt>Number.EPSILON&&(E=!0):Ut<-Number.EPSILON?Gt<-Number.EPSILON&&(E=!0):Math.sign(Ht)===Math.sign(C)&&(E=!0),E?(ct=-Ht,dt=Ut,Ft=Math.sqrt(se)):(ct=Ut,dt=Ht,Ft=Math.sqrt(se/2))}return new at(ct/Ft,dt/Ft)}const $=[];for(let nt=0,ot=B.length,lt=ot-1,ct=nt+1;nt<ot;nt++,lt++,ct++)lt===ot&&(lt=0),ct===ot&&(ct=0),$[nt]=rt(B[nt],B[lt],B[ct]);const tt=[];let it,Lt=$.concat();for(let nt=0,ot=F;nt<ot;nt++){const lt=U[nt];it=[];for(let ct=0,dt=lt.length,Ft=dt-1,Ut=ct+1;ct<dt;ct++,Ft++,Ut++)Ft===dt&&(Ft=0),Ut===dt&&(Ut=0),it[ct]=rt(lt[ct],lt[Ft],lt[Ut]);tt.push(it),Lt=Lt.concat(it)}let At;if(m===0)At=Nn.triangulateShape(B,U);else{const nt=[],ot=[];for(let lt=0;lt<m;lt++){const ct=lt/m,dt=d*Math.cos(ct*Math.PI/2),Ft=_*Math.sin(ct*Math.PI/2)+S;for(let Ut=0,Ht=B.length;Ut<Ht;Ut++){const Gt=J(B[Ut],$[Ut],Ft);xt(Gt.x,Gt.y,-dt),ct===0&&nt.push(Gt)}for(let Ut=0,Ht=F;Ut<Ht;Ut++){const Gt=U[Ut];it=tt[Ut];const C=[];for(let se=0,Zt=Gt.length;se<Zt;se++){const E=J(Gt[se],it[se],Ft);xt(E.x,E.y,-dt),ct===0&&C.push(E)}ct===0&&ot.push(C)}}At=Nn.triangulateShape(nt,ot)}const ne=At.length,qt=_+S;for(let nt=0;nt<V;nt++){const ot=h?J(P[nt],Lt[nt],qt):P[nt];M?(R.copy(b.normals[0]).multiplyScalar(ot.x),T.copy(b.binormals[0]).multiplyScalar(ot.y),v.copy(w[0]).add(R).add(T),xt(v.x,v.y,v.z)):xt(ot.x,ot.y,0)}for(let nt=1;nt<=u;nt++)for(let ot=0;ot<V;ot++){const lt=h?J(P[ot],Lt[ot],qt):P[ot];M?(R.copy(b.normals[nt]).multiplyScalar(lt.x),T.copy(b.binormals[nt]).multiplyScalar(lt.y),v.copy(w[nt]).add(R).add(T),xt(v.x,v.y,v.z)):xt(lt.x,lt.y,f/u*nt)}for(let nt=m-1;nt>=0;nt--){const ot=nt/m,lt=d*Math.cos(ot*Math.PI/2),ct=_*Math.sin(ot*Math.PI/2)+S;for(let dt=0,Ft=B.length;dt<Ft;dt++){const Ut=J(B[dt],$[dt],ct);xt(Ut.x,Ut.y,f+lt)}for(let dt=0,Ft=U.length;dt<Ft;dt++){const Ut=U[dt];it=tt[dt];for(let Ht=0,Gt=Ut.length;Ht<Gt;Ht++){const C=J(Ut[Ht],it[Ht],ct);M?xt(C.x,C.y+w[u-1].y,w[u-1].x+lt):xt(C.x,C.y,f+lt)}}}te(),K();function te(){const nt=s.length/3;if(h){let ot=0,lt=V*ot;for(let ct=0;ct<ne;ct++){const dt=At[ct];Bt(dt[2]+lt,dt[1]+lt,dt[0]+lt)}ot=u+m*2,lt=V*ot;for(let ct=0;ct<ne;ct++){const dt=At[ct];Bt(dt[0]+lt,dt[1]+lt,dt[2]+lt)}}else{for(let ot=0;ot<ne;ot++){const lt=At[ot];Bt(lt[2],lt[1],lt[0])}for(let ot=0;ot<ne;ot++){const lt=At[ot];Bt(lt[0]+V*u,lt[1]+V*u,lt[2]+V*u)}}n.addGroup(nt,s.length/3-nt,0)}function K(){const nt=s.length/3;let ot=0;et(B,ot),ot+=B.length;for(let lt=0,ct=U.length;lt<ct;lt++){const dt=U[lt];et(dt,ot),ot+=dt.length}n.addGroup(nt,s.length/3-nt,1)}function et(nt,ot){let lt=nt.length;for(;--lt>=0;){const ct=lt;let dt=lt-1;dt<0&&(dt=nt.length-1);for(let Ft=0,Ut=u+m*2;Ft<Ut;Ft++){const Ht=V*Ft,Gt=V*(Ft+1),C=ot+ct+Ht,se=ot+dt+Ht,Zt=ot+dt+Gt,E=ot+ct+Gt;bt(C,se,Zt,E)}}}function xt(nt,ot,lt){c.push(nt),c.push(ot),c.push(lt)}function Bt(nt,ot,lt){kt(nt),kt(ot),kt(lt);const ct=s.length/3,dt=y.generateTopUV(n,s,ct-3,ct-2,ct-1);oe(dt[0]),oe(dt[1]),oe(dt[2])}function bt(nt,ot,lt,ct){kt(nt),kt(ot),kt(ct),kt(ot),kt(lt),kt(ct);const dt=s.length/3,Ft=y.generateSideWallUV(n,s,dt-6,dt-3,dt-2,dt-1);oe(Ft[0]),oe(Ft[1]),oe(Ft[3]),oe(Ft[1]),oe(Ft[2]),oe(Ft[3])}function kt(nt){s.push(c[nt*3+0]),s.push(c[nt*3+1]),s.push(c[nt*3+2])}function oe(nt){r.push(nt.x),r.push(nt.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return Kd(e,n,t)}static fromJSON(t,e){const n=[];for(let r=0,a=t.shapes.length;r<a;r++){const o=e[t.shapes[r]];n.push(o)}const s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new Eo[s.type]().fromJSON(s)),new Yo(n,t.options)}}const Zd={generateTopUV:function(i,t,e,n,s){const r=t[e*3],a=t[e*3+1],o=t[n*3],c=t[n*3+1],l=t[s*3],u=t[s*3+1];return[new at(r,a),new at(o,c),new at(l,u)]},generateSideWallUV:function(i,t,e,n,s,r){const a=t[e*3],o=t[e*3+1],c=t[e*3+2],l=t[n*3],u=t[n*3+1],f=t[n*3+2],h=t[s*3],d=t[s*3+1],_=t[s*3+2],S=t[r*3],m=t[r*3+1],p=t[r*3+2];return Math.abs(o-u)<Math.abs(a-l)?[new at(a,1-c),new at(l,1-f),new at(h,1-_),new at(S,1-p)]:[new at(o,1-c),new at(u,1-f),new at(d,1-_),new at(m,1-p)]}};function Kd(i,t,e){if(e.shapes=[],Array.isArray(i))for(let n=0,s=i.length;n<s;n++){const r=i[n];e.shapes.push(r.uuid)}else e.shapes.push(i.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}class Vr extends Pe{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,a=e/2,o=Math.floor(n),c=Math.floor(s),l=o+1,u=c+1,f=t/o,h=e/c,d=[],_=[],S=[],m=[];for(let p=0;p<u;p++){const y=p*h-a;for(let w=0;w<l;w++){const M=w*f-r;_.push(M,-y,0),S.push(0,0,1),m.push(w/o),m.push(1-p/c)}}for(let p=0;p<c;p++)for(let y=0;y<o;y++){const w=y+l*p,M=y+l*(p+1),b=y+1+l*(p+1),T=y+1+l*p;d.push(w,M,T),d.push(M,b,T)}this.setIndex(d),this.setAttribute("position",new De(_,3)),this.setAttribute("normal",new De(S,3)),this.setAttribute("uv",new De(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Vr(t.width,t.height,t.widthSegments,t.heightSegments)}}class Fr extends Pe{constructor(t=new gs([new at(0,.5),new at(-.5,-.5),new at(.5,-.5)]),e=12){super(),this.type="ShapeGeometry",this.parameters={shapes:t,curveSegments:e};const n=[],s=[],r=[],a=[];let o=0,c=0;if(Array.isArray(t)===!1)l(t);else for(let u=0;u<t.length;u++)l(t[u]),this.addGroup(o,c,u),o+=c,c=0;this.setIndex(n),this.setAttribute("position",new De(s,3)),this.setAttribute("normal",new De(r,3)),this.setAttribute("uv",new De(a,2));function l(u){const f=s.length/3,h=u.extractPoints(e);let d=h.shape;const _=h.holes;Nn.isClockWise(d)===!1&&(d=d.reverse());for(let m=0,p=_.length;m<p;m++){const y=_[m];Nn.isClockWise(y)===!0&&(_[m]=y.reverse())}const S=Nn.triangulateShape(d,_);for(let m=0,p=_.length;m<p;m++){const y=_[m];d=d.concat(y)}for(let m=0,p=d.length;m<p;m++){const y=d[m];s.push(y.x,y.y,0),r.push(0,0,1),a.push(y.x,y.y)}for(let m=0,p=S.length;m<p;m++){const y=S[m],w=y[0]+f,M=y[1]+f,b=y[2]+f;n.push(w,M,b),c+=3}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes;return Jd(e,t)}static fromJSON(t,e){const n=[];for(let s=0,r=t.shapes.length;s<r;s++){const a=e[t.shapes[s]];n.push(a)}return new Fr(n,t.curveSegments)}}function Jd(i,t){if(t.shapes=[],Array.isArray(i))for(let e=0,n=i.length;e<n;e++){const s=i[e];t.shapes.push(s.uuid)}else t.shapes.push(i.uuid);return t}function Xi(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];if(jl(s))s.isRenderTargetTexture?(zt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone();else if(Array.isArray(s))if(jl(s[0])){const r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();t[e][n]=r}else t[e][n]=s.slice();else t[e][n]=s}}return t}function He(i){const t={};for(let e=0;e<i.length;e++){const n=Xi(i[e]);for(const s in n)t[s]=n[s]}return t}function jl(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function Qd(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function vh(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Qt.workingColorSpace}const jd={clone:Xi,merge:He};var tf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ef=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class bn extends fi{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=tf,this.fragmentShader=ef,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Xi(t.uniforms),this.uniformsGroups=Qd(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(const n in t.uniforms){const s=t.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=e[s.value]||null;break;case"c":this.uniforms[n].value=new jt().setHex(s.value);break;case"v2":this.uniforms[n].value=new at().fromArray(s.value);break;case"v3":this.uniforms[n].value=new L().fromArray(s.value);break;case"v4":this.uniforms[n].value=new Me().fromArray(s.value);break;case"m3":this.uniforms[n].value=new Vt().fromArray(s.value);break;case"m4":this.uniforms[n].value=new _e().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(const n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}}class nf extends bn{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class sf extends fi{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Ru,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class rf extends fi{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class af extends fs{constructor(t){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(t)}copy(t){return super.copy(t),this.scale=t.scale,this.dashSize=t.dashSize,this.gapSize=t.gapSize,this}}const fr=new L,pr=new Zn,fn=new L;class xh extends Be{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new _e,this.projectionMatrix=new _e,this.projectionMatrixInverse=new _e,this.coordinateSystem=vn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(fr,pr,fn),fn.x===1&&fn.y===1&&fn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(fr,pr,fn.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(fr,pr,fn),fn.x===1&&fn.y===1&&fn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(fr,pr,fn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Yn=new L,tc=new at,ec=new at;class on extends xh{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=yo*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(us*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return yo*2*Math.atan(Math.tan(us*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Yn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Yn.x,Yn.y).multiplyScalar(-t/Yn.z),Yn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Yn.x,Yn.y).multiplyScalar(-t/Yn.z)}getViewSize(t,e){return this.getViewBounds(t,tc,ec),e.subVectors(ec,tc)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(us*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const a=this.view;if(this.view!==null&&this.view.enabled){const c=a.fullWidth,l=a.fullHeight;r+=a.offsetX*s/c,e-=a.offsetY*n/l,s*=a.width/c,n*=a.height/l}const o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}class qo extends xh{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,a=n+t,o=s+e,c=s-e;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,a=r+l*this.view.width,o-=u*this.view.offsetY,c=o-u*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const Ii=-90,Ni=1;class of extends Be{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new on(Ii,Ni,t,e);s.layers=this.layers,this.add(s);const r=new on(Ii,Ni,t,e);r.layers=this.layers,this.add(r);const a=new on(Ii,Ni,t,e);a.layers=this.layers,this.add(a);const o=new on(Ii,Ni,t,e);o.layers=this.layers,this.add(o);const c=new on(Ii,Ni,t,e);c.layers=this.layers,this.add(c);const l=new on(Ii,Ni,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,c]=e;for(const l of e)this.remove(l);if(t===vn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===Pr)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,c,l,u]=this.children,f=t.getRenderTarget(),h=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),_=t.xr.enabled;t.xr.enabled=!1;const S=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let m=!1;t.isWebGLRenderer===!0?m=t.state.buffers.depth.getReversed():m=t.reversedDepthBuffer,t.setRenderTarget(n,0,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),t.setRenderTarget(n,4,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),n.texture.generateMipmaps=S,t.setRenderTarget(n,5,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,u),t.setRenderTarget(f,h,d),t.xr.enabled=_,n.texture.needsPMREMUpdate=!0}}class lf extends on{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}}const nc=new _e;class cf{constructor(t,e,n=0,s=1/0){this.ray=new Cs(t,e),this.near=n,this.far=s,this.camera=null,this.layers=new Wo,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,e.projectionMatrix.elements[14]).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):Jt("Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return nc.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(nc),this}intersectObject(t,e=!0,n=[]){return wo(t,this,n,e),n.sort(ic),n}intersectObjects(t,e=!0,n=[]){for(let s=0,r=t.length;s<r;s++)wo(t[s],this,n,e);return n.sort(ic),n}}function ic(i,t){return i.distance-t.distance}function wo(i,t,e,n){let s=!0;if(i.layers.test(t.layers)&&i.raycast(t,e)===!1&&(s=!1),s===!0&&n===!0){const r=i.children;for(let a=0,o=r.length;a<o;a++)wo(r[a],t,e,!0)}}class sc{constructor(t=1,e=0,n=0){this.radius=t,this.phi=e,this.theta=n}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Yt(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos(Yt(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}const rl=class rl{constructor(t,e,n,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,s){const r=this.elements;return r[0]=t,r[2]=e,r[1]=n,r[3]=s,this}};rl.prototype.isMatrix2=!0;let rc=rl;class hf extends jn{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(t){this.domElement!==null&&this.disconnect(),this.domElement=t}disconnect(){}dispose(){}update(){}}function ac(i,t,e,n){const s=uf(n);switch(e){case qc:return i*t;case Kc:return i*t/s.components*s.byteLength;case Bo:return i*t/s.components*s.byteLength;case hi:return i*t*2/s.components*s.byteLength;case zo:return i*t*2/s.components*s.byteLength;case Zc:return i*t*3/s.components*s.byteLength;case ln:return i*t*4/s.components*s.byteLength;case ko:return i*t*4/s.components*s.byteLength;case Mr:case yr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case br:case Er:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case $a:case qa:return Math.max(i,16)*Math.max(t,8)/4;case Xa:case Ya:return Math.max(i,8)*Math.max(t,8)/2;case Za:case Ka:case Qa:case ja:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Ja:case Ar:case to:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case eo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case no:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case io:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case so:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case ro:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case ao:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case oo:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case lo:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case co:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case ho:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case uo:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case fo:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case po:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case mo:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case go:case _o:case vo:return Math.ceil(i/4)*Math.ceil(t/4)*16;case xo:case So:return Math.ceil(i/4)*Math.ceil(t/4)*8;case wr:case Mo:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function uf(i){switch(i){case Qe:case Wc:return{byteLength:1,components:1};case xs:case Xc:case yn:return{byteLength:2,components:1};case Fo:case Oo:return{byteLength:2,components:4};case Mn:case Uo:case _n:return{byteLength:4,components:1};case $c:case Yc:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:No}}));typeof window<"u"&&(window.__THREE__?zt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=No);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Sh(){let i=null,t=!1,e=null,n=null;function s(r,a){n=i.requestAnimationFrame(s),e(r,a)}return{start:function(){t!==!0&&e!==null&&i!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function df(i){const t=new WeakMap;function e(o,c){const l=o.array,u=o.usage,f=l.byteLength,h=i.createBuffer();i.bindBuffer(c,h),i.bufferData(c,l,u),o.onUploadCallback();let d;if(l instanceof Float32Array)d=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)d=i.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?d=i.HALF_FLOAT:d=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)d=i.SHORT;else if(l instanceof Uint32Array)d=i.UNSIGNED_INT;else if(l instanceof Int32Array)d=i.INT;else if(l instanceof Int8Array)d=i.BYTE;else if(l instanceof Uint8Array)d=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)d=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:h,type:d,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,c,l){const u=c.array,f=c.updateRanges;if(i.bindBuffer(l,o),f.length===0)i.bufferSubData(l,0,u);else{f.sort((d,_)=>d.start-_.start);let h=0;for(let d=1;d<f.length;d++){const _=f[h],S=f[d];S.start<=_.start+_.count+1?_.count=Math.max(_.count,S.start+S.count-_.start):(++h,f[h]=S)}f.length=h+1;for(let d=0,_=f.length;d<_;d++){const S=f[d];i.bufferSubData(l,S.start*u.BYTES_PER_ELEMENT,u,S.start,S.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const c=t.get(o);c&&(i.deleteBuffer(c.buffer),t.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const u=t.get(o);(!u||u.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const l=t.get(o);if(l===void 0)t.set(o,e(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,o,c),l.version=o.version}}return{get:s,remove:r,update:a}}var ff=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,pf=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,mf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,gf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,_f=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,vf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,xf=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Sf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Mf=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,yf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,bf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Ef=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Tf=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Af=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,wf=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Rf=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Cf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Pf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Lf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Df=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,If=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Nf=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Uf=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Ff=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Of=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Bf=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,zf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,kf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Hf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Gf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Vf="gl_FragColor = linearToOutputTexel( gl_FragColor );",Wf=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Xf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,$f=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Yf=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,qf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Zf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Kf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Jf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Qf=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,jf=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,tp=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,ep=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,np=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,ip=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,sp=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,rp=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,ap=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,op=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,cp=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,hp=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,up=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,dp=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,fp=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,pp=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,mp=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,gp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,_p=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,vp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,xp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Sp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Mp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,yp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,bp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Ep=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Tp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Ap=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,wp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Rp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Cp=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Pp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Lp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Dp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Ip=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Np=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Up=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Fp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Op=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Bp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,zp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,kp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Hp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Gp=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Vp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Wp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Xp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,$p=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Yp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,qp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Zp=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Kp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Jp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Qp=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,jp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,tm=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,em=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,nm=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,im=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,sm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,rm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,am=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,om=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,lm=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,cm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,hm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,um=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,dm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const fm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,pm=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,mm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,gm=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,_m=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,vm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,xm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Sm=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Mm=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,ym=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,bm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Em=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Tm=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Am=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,wm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Rm=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Cm=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Pm=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Lm=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Dm=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Im=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Nm=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Um=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Fm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Om=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Bm=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zm=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,km=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Hm=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Gm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Vm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Wm=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Xm=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,$m=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,$t={alphahash_fragment:ff,alphahash_pars_fragment:pf,alphamap_fragment:mf,alphamap_pars_fragment:gf,alphatest_fragment:_f,alphatest_pars_fragment:vf,aomap_fragment:xf,aomap_pars_fragment:Sf,batching_pars_vertex:Mf,batching_vertex:yf,begin_vertex:bf,beginnormal_vertex:Ef,bsdfs:Tf,iridescence_fragment:Af,bumpmap_pars_fragment:wf,clipping_planes_fragment:Rf,clipping_planes_pars_fragment:Cf,clipping_planes_pars_vertex:Pf,clipping_planes_vertex:Lf,color_fragment:Df,color_pars_fragment:If,color_pars_vertex:Nf,color_vertex:Uf,common:Ff,cube_uv_reflection_fragment:Of,defaultnormal_vertex:Bf,displacementmap_pars_vertex:zf,displacementmap_vertex:kf,emissivemap_fragment:Hf,emissivemap_pars_fragment:Gf,colorspace_fragment:Vf,colorspace_pars_fragment:Wf,envmap_fragment:Xf,envmap_common_pars_fragment:$f,envmap_pars_fragment:Yf,envmap_pars_vertex:qf,envmap_physical_pars_fragment:rp,envmap_vertex:Zf,fog_vertex:Kf,fog_pars_vertex:Jf,fog_fragment:Qf,fog_pars_fragment:jf,gradientmap_pars_fragment:tp,lightmap_pars_fragment:ep,lights_lambert_fragment:np,lights_lambert_pars_fragment:ip,lights_pars_begin:sp,lights_toon_fragment:ap,lights_toon_pars_fragment:op,lights_phong_fragment:lp,lights_phong_pars_fragment:cp,lights_physical_fragment:hp,lights_physical_pars_fragment:up,lights_fragment_begin:dp,lights_fragment_maps:fp,lights_fragment_end:pp,lightprobes_pars_fragment:mp,logdepthbuf_fragment:gp,logdepthbuf_pars_fragment:_p,logdepthbuf_pars_vertex:vp,logdepthbuf_vertex:xp,map_fragment:Sp,map_pars_fragment:Mp,map_particle_fragment:yp,map_particle_pars_fragment:bp,metalnessmap_fragment:Ep,metalnessmap_pars_fragment:Tp,morphinstance_vertex:Ap,morphcolor_vertex:wp,morphnormal_vertex:Rp,morphtarget_pars_vertex:Cp,morphtarget_vertex:Pp,normal_fragment_begin:Lp,normal_fragment_maps:Dp,normal_pars_fragment:Ip,normal_pars_vertex:Np,normal_vertex:Up,normalmap_pars_fragment:Fp,clearcoat_normal_fragment_begin:Op,clearcoat_normal_fragment_maps:Bp,clearcoat_pars_fragment:zp,iridescence_pars_fragment:kp,opaque_fragment:Hp,packing:Gp,premultiplied_alpha_fragment:Vp,project_vertex:Wp,dithering_fragment:Xp,dithering_pars_fragment:$p,roughnessmap_fragment:Yp,roughnessmap_pars_fragment:qp,shadowmap_pars_fragment:Zp,shadowmap_pars_vertex:Kp,shadowmap_vertex:Jp,shadowmask_pars_fragment:Qp,skinbase_vertex:jp,skinning_pars_vertex:tm,skinning_vertex:em,skinnormal_vertex:nm,specularmap_fragment:im,specularmap_pars_fragment:sm,tonemapping_fragment:rm,tonemapping_pars_fragment:am,transmission_fragment:om,transmission_pars_fragment:lm,uv_pars_fragment:cm,uv_pars_vertex:hm,uv_vertex:um,worldpos_vertex:dm,background_vert:fm,background_frag:pm,backgroundCube_vert:mm,backgroundCube_frag:gm,cube_vert:_m,cube_frag:vm,depth_vert:xm,depth_frag:Sm,distance_vert:Mm,distance_frag:ym,equirect_vert:bm,equirect_frag:Em,linedashed_vert:Tm,linedashed_frag:Am,meshbasic_vert:wm,meshbasic_frag:Rm,meshlambert_vert:Cm,meshlambert_frag:Pm,meshmatcap_vert:Lm,meshmatcap_frag:Dm,meshnormal_vert:Im,meshnormal_frag:Nm,meshphong_vert:Um,meshphong_frag:Fm,meshphysical_vert:Om,meshphysical_frag:Bm,meshtoon_vert:zm,meshtoon_frag:km,points_vert:Hm,points_frag:Gm,shadow_vert:Vm,shadow_frag:Wm,sprite_vert:Xm,sprite_frag:$m},vt={common:{diffuse:{value:new jt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Vt},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Vt}},envmap:{envMap:{value:null},envMapRotation:{value:new Vt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Vt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Vt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Vt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Vt},normalScale:{value:new at(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Vt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Vt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Vt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Vt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new jt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new L},probesMax:{value:new L},probesResolution:{value:new L}},points:{diffuse:{value:new jt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0},uvTransform:{value:new Vt}},sprite:{diffuse:{value:new jt(16777215)},opacity:{value:1},center:{value:new at(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Vt},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0}}},mn={basic:{uniforms:He([vt.common,vt.specularmap,vt.envmap,vt.aomap,vt.lightmap,vt.fog]),vertexShader:$t.meshbasic_vert,fragmentShader:$t.meshbasic_frag},lambert:{uniforms:He([vt.common,vt.specularmap,vt.envmap,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.fog,vt.lights,{emissive:{value:new jt(0)},envMapIntensity:{value:1}}]),vertexShader:$t.meshlambert_vert,fragmentShader:$t.meshlambert_frag},phong:{uniforms:He([vt.common,vt.specularmap,vt.envmap,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.fog,vt.lights,{emissive:{value:new jt(0)},specular:{value:new jt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:$t.meshphong_vert,fragmentShader:$t.meshphong_frag},standard:{uniforms:He([vt.common,vt.envmap,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.roughnessmap,vt.metalnessmap,vt.fog,vt.lights,{emissive:{value:new jt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:$t.meshphysical_vert,fragmentShader:$t.meshphysical_frag},toon:{uniforms:He([vt.common,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.gradientmap,vt.fog,vt.lights,{emissive:{value:new jt(0)}}]),vertexShader:$t.meshtoon_vert,fragmentShader:$t.meshtoon_frag},matcap:{uniforms:He([vt.common,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.fog,{matcap:{value:null}}]),vertexShader:$t.meshmatcap_vert,fragmentShader:$t.meshmatcap_frag},points:{uniforms:He([vt.points,vt.fog]),vertexShader:$t.points_vert,fragmentShader:$t.points_frag},dashed:{uniforms:He([vt.common,vt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:$t.linedashed_vert,fragmentShader:$t.linedashed_frag},depth:{uniforms:He([vt.common,vt.displacementmap]),vertexShader:$t.depth_vert,fragmentShader:$t.depth_frag},normal:{uniforms:He([vt.common,vt.bumpmap,vt.normalmap,vt.displacementmap,{opacity:{value:1}}]),vertexShader:$t.meshnormal_vert,fragmentShader:$t.meshnormal_frag},sprite:{uniforms:He([vt.sprite,vt.fog]),vertexShader:$t.sprite_vert,fragmentShader:$t.sprite_frag},background:{uniforms:{uvTransform:{value:new Vt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:$t.background_vert,fragmentShader:$t.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Vt}},vertexShader:$t.backgroundCube_vert,fragmentShader:$t.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:$t.cube_vert,fragmentShader:$t.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:$t.equirect_vert,fragmentShader:$t.equirect_frag},distance:{uniforms:He([vt.common,vt.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:$t.distance_vert,fragmentShader:$t.distance_frag},shadow:{uniforms:He([vt.lights,vt.fog,{color:{value:new jt(0)},opacity:{value:1}}]),vertexShader:$t.shadow_vert,fragmentShader:$t.shadow_frag}};mn.physical={uniforms:He([mn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Vt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Vt},clearcoatNormalScale:{value:new at(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Vt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Vt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Vt},sheen:{value:0},sheenColor:{value:new jt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Vt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Vt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Vt},transmissionSamplerSize:{value:new at},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Vt},attenuationDistance:{value:0},attenuationColor:{value:new jt(0)},specularColor:{value:new jt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Vt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Vt},anisotropyVector:{value:new at},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Vt}}]),vertexShader:$t.meshphysical_vert,fragmentShader:$t.meshphysical_frag};const mr={r:0,b:0,g:0},Ym=new _e,Mh=new Vt;Mh.set(-1,0,0,0,1,0,0,0,1);function qm(i,t,e,n,s,r){const a=new jt(0);let o=s===!0?0:1,c,l,u=null,f=0,h=null;function d(y){let w=y.isScene===!0?y.background:null;if(w&&w.isTexture){const M=y.backgroundBlurriness>0;w=t.get(w,M)}return w}function _(y){let w=!1;const M=d(y);M===null?m(a,o):M&&M.isColor&&(m(M,1),w=!0);const b=i.xr.getEnvironmentBlendMode();b==="additive"?e.buffers.color.setClear(0,0,0,1,r):b==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(i.autoClear||w)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function S(y,w){const M=d(w);M&&(M.isCubeTexture||M.mapping===Gr)?(l===void 0&&(l=new tn(new Ps(1,1,1),new bn({name:"BackgroundCubeMaterial",uniforms:Xi(mn.backgroundCube.uniforms),vertexShader:mn.backgroundCube.vertexShader,fragmentShader:mn.backgroundCube.fragmentShader,side:Ve,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(b,T,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(l)),l.material.uniforms.envMap.value=M,l.material.uniforms.backgroundBlurriness.value=w.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Ym.makeRotationFromEuler(w.backgroundRotation)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Mh),l.material.toneMapped=Qt.getTransfer(M.colorSpace)!==le,(u!==M||f!==M.version||h!==i.toneMapping)&&(l.material.needsUpdate=!0,u=M,f=M.version,h=i.toneMapping),l.layers.enableAll(),y.unshift(l,l.geometry,l.material,0,0,null)):M&&M.isTexture&&(c===void 0&&(c=new tn(new Vr(2,2),new bn({name:"BackgroundMaterial",uniforms:Xi(mn.background.uniforms),vertexShader:mn.background.vertexShader,fragmentShader:mn.background.fragmentShader,side:li,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=M,c.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,c.material.toneMapped=Qt.getTransfer(M.colorSpace)!==le,M.matrixAutoUpdate===!0&&M.updateMatrix(),c.material.uniforms.uvTransform.value.copy(M.matrix),(u!==M||f!==M.version||h!==i.toneMapping)&&(c.material.needsUpdate=!0,u=M,f=M.version,h=i.toneMapping),c.layers.enableAll(),y.unshift(c,c.geometry,c.material,0,0,null))}function m(y,w){y.getRGB(mr,vh(i)),e.buffers.color.setClear(mr.r,mr.g,mr.b,w,r)}function p(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(y,w=1){a.set(y),o=w,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(y){o=y,m(a,o)},render:_,addToRenderList:S,dispose:p}}function Zm(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=h(null);let r=s,a=!1;function o(U,G,X,F,B){let J=!1;const V=f(U,F,X,G);r!==V&&(r=V,l(r.object)),J=d(U,F,X,B),J&&_(U,F,X,B),B!==null&&t.update(B,i.ELEMENT_ARRAY_BUFFER),(J||a)&&(a=!1,M(U,G,X,F),B!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(B).buffer))}function c(){return i.createVertexArray()}function l(U){return i.bindVertexArray(U)}function u(U){return i.deleteVertexArray(U)}function f(U,G,X,F){const B=F.wireframe===!0;let J=n[G.id];J===void 0&&(J={},n[G.id]=J);const V=U.isInstancedMesh===!0?U.id:0;let rt=J[V];rt===void 0&&(rt={},J[V]=rt);let $=rt[X.id];$===void 0&&($={},rt[X.id]=$);let tt=$[B];return tt===void 0&&(tt=h(c()),$[B]=tt),tt}function h(U){const G=[],X=[],F=[];for(let B=0;B<e;B++)G[B]=0,X[B]=0,F[B]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:G,enabledAttributes:X,attributeDivisors:F,object:U,attributes:{},index:null}}function d(U,G,X,F){const B=r.attributes,J=G.attributes;let V=0;const rt=X.getAttributes();for(const $ in rt)if(rt[$].location>=0){const it=B[$];let Lt=J[$];if(Lt===void 0&&($==="instanceMatrix"&&U.instanceMatrix&&(Lt=U.instanceMatrix),$==="instanceColor"&&U.instanceColor&&(Lt=U.instanceColor)),it===void 0||it.attribute!==Lt||Lt&&it.data!==Lt.data)return!0;V++}return r.attributesNum!==V||r.index!==F}function _(U,G,X,F){const B={},J=G.attributes;let V=0;const rt=X.getAttributes();for(const $ in rt)if(rt[$].location>=0){let it=J[$];it===void 0&&($==="instanceMatrix"&&U.instanceMatrix&&(it=U.instanceMatrix),$==="instanceColor"&&U.instanceColor&&(it=U.instanceColor));const Lt={};Lt.attribute=it,it&&it.data&&(Lt.data=it.data),B[$]=Lt,V++}r.attributes=B,r.attributesNum=V,r.index=F}function S(){const U=r.newAttributes;for(let G=0,X=U.length;G<X;G++)U[G]=0}function m(U){p(U,0)}function p(U,G){const X=r.newAttributes,F=r.enabledAttributes,B=r.attributeDivisors;X[U]=1,F[U]===0&&(i.enableVertexAttribArray(U),F[U]=1),B[U]!==G&&(i.vertexAttribDivisor(U,G),B[U]=G)}function y(){const U=r.newAttributes,G=r.enabledAttributes;for(let X=0,F=G.length;X<F;X++)G[X]!==U[X]&&(i.disableVertexAttribArray(X),G[X]=0)}function w(U,G,X,F,B,J,V){V===!0?i.vertexAttribIPointer(U,G,X,B,J):i.vertexAttribPointer(U,G,X,F,B,J)}function M(U,G,X,F){S();const B=F.attributes,J=X.getAttributes(),V=G.defaultAttributeValues;for(const rt in J){const $=J[rt];if($.location>=0){let tt=B[rt];if(tt===void 0&&(rt==="instanceMatrix"&&U.instanceMatrix&&(tt=U.instanceMatrix),rt==="instanceColor"&&U.instanceColor&&(tt=U.instanceColor)),tt!==void 0){const it=tt.normalized,Lt=tt.itemSize,At=t.get(tt);if(At===void 0)continue;const ne=At.buffer,qt=At.type,te=At.bytesPerElement,K=qt===i.INT||qt===i.UNSIGNED_INT||tt.gpuType===Uo;if(tt.isInterleavedBufferAttribute){const et=tt.data,xt=et.stride,Bt=tt.offset;if(et.isInstancedInterleavedBuffer){for(let bt=0;bt<$.locationSize;bt++)p($.location+bt,et.meshPerAttribute);U.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=et.meshPerAttribute*et.count)}else for(let bt=0;bt<$.locationSize;bt++)m($.location+bt);i.bindBuffer(i.ARRAY_BUFFER,ne);for(let bt=0;bt<$.locationSize;bt++)w($.location+bt,Lt/$.locationSize,qt,it,xt*te,(Bt+Lt/$.locationSize*bt)*te,K)}else{if(tt.isInstancedBufferAttribute){for(let et=0;et<$.locationSize;et++)p($.location+et,tt.meshPerAttribute);U.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=tt.meshPerAttribute*tt.count)}else for(let et=0;et<$.locationSize;et++)m($.location+et);i.bindBuffer(i.ARRAY_BUFFER,ne);for(let et=0;et<$.locationSize;et++)w($.location+et,Lt/$.locationSize,qt,it,Lt*te,Lt/$.locationSize*et*te,K)}}else if(V!==void 0){const it=V[rt];if(it!==void 0)switch(it.length){case 2:i.vertexAttrib2fv($.location,it);break;case 3:i.vertexAttrib3fv($.location,it);break;case 4:i.vertexAttrib4fv($.location,it);break;default:i.vertexAttrib1fv($.location,it)}}}}y()}function b(){A();for(const U in n){const G=n[U];for(const X in G){const F=G[X];for(const B in F){const J=F[B];for(const V in J)u(J[V].object),delete J[V];delete F[B]}}delete n[U]}}function T(U){if(n[U.id]===void 0)return;const G=n[U.id];for(const X in G){const F=G[X];for(const B in F){const J=F[B];for(const V in J)u(J[V].object),delete J[V];delete F[B]}}delete n[U.id]}function R(U){for(const G in n){const X=n[G];for(const F in X){const B=X[F];if(B[U.id]===void 0)continue;const J=B[U.id];for(const V in J)u(J[V].object),delete J[V];delete B[U.id]}}}function v(U){for(const G in n){const X=n[G],F=U.isInstancedMesh===!0?U.id:0,B=X[F];if(B!==void 0){for(const J in B){const V=B[J];for(const rt in V)u(V[rt].object),delete V[rt];delete B[J]}delete X[F],Object.keys(X).length===0&&delete n[G]}}}function A(){P(),a=!0,r!==s&&(r=s,l(r.object))}function P(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:A,resetDefaultState:P,dispose:b,releaseStatesOfGeometry:T,releaseStatesOfObject:v,releaseStatesOfProgram:R,initAttributes:S,enableAttribute:m,disableUnusedAttributes:y}}function Km(i,t,e){let n;function s(c){n=c}function r(c,l){i.drawArrays(n,c,l),e.update(l,n,1)}function a(c,l,u){u!==0&&(i.drawArraysInstanced(n,c,l,u),e.update(l,n,u))}function o(c,l,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,l,0,u);let h=0;for(let d=0;d<u;d++)h+=l[d];e.update(h,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function Jm(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const R=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(R){return!(R!==ln&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(R){const v=R===yn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(R!==Qe&&R!==_n&&!v&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function c(R){if(R==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=e.precision!==void 0?e.precision:"highp";const u=c(l);u!==l&&(zt("WebGLRenderer:",l,"not supported, using",u,"instead."),l=u);const f=e.logarithmicDepthBuffer===!0,h=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control");e.reversedDepthBuffer===!0&&h===!1&&zt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const d=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),y=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),w=i.getParameter(i.MAX_VARYING_VECTORS),M=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),b=i.getParameter(i.MAX_SAMPLES),T=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:h,maxTextures:d,maxVertexTextures:_,maxTextureSize:S,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:y,maxVaryings:w,maxFragmentUniforms:M,maxSamples:b,samples:T}}function Qm(i){const t=this;let e=null,n=0,s=!1,r=!1;const a=new Dn,o=new Vt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(f,h){const d=f.length!==0||h||n!==0||s;return s=h,n=f.length,d},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,h){e=u(f,h,0)},this.setState=function(f,h,d){const _=f.clippingPlanes,S=f.clipIntersection,m=f.clipShadows,p=i.get(f);if(!s||_===null||_.length===0||r&&!m)r?u(null):l();else{const y=r?0:n,w=y*4;let M=p.clippingState||null;c.value=M,M=u(_,h,w,d);for(let b=0;b!==w;++b)M[b]=e[b];p.clippingState=M,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=y}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(f,h,d,_){const S=f!==null?f.length:0;let m=null;if(S!==0){if(m=c.value,_!==!0||m===null){const p=d+S*4,y=h.matrixWorldInverse;o.getNormalMatrix(y),(m===null||m.length<p)&&(m=new Float32Array(p));for(let w=0,M=d;w!==S;++w,M+=4)a.copy(f[w]).applyMatrix4(y,o),a.normal.toArray(m,M),m[M+3]=a.constant}c.value=m,c.needsUpdate=!0}return t.numPlanes=S,t.numIntersection=0,m}}const zi=4,jm=6,tg=20,eg=256,ss=new qo,oc=new jt;let wa=null,Ra=0,Ca=0,Pa=!1;const ng=new L,ri=new L;class lc{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,n=.1,s=100,r={}){const{size:a=256,position:o=ng}=r;wa=this._renderer.getRenderTarget(),Ra=this._renderer.getActiveCubeFace(),Ca=this._renderer.getActiveMipmapLevel(),Pa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(t,n,s,c,o),e>0&&this._blur(c,0,0,e),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=uc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=hc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(wa,Ra,Ca),this._renderer.xr.enabled=Pa,t.scissorTest=!1,Ui(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===ci||t.mapping===Vi?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),wa=this._renderer.getRenderTarget(),Ra=this._renderer.getActiveCubeFace(),Ca=this._renderer.getActiveMipmapLevel(),Pa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Fe,minFilter:Fe,generateMipmaps:!1,type:yn,format:ln,colorSpace:Rr,depthBuffer:!1},s=cc(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=cc(t,e,n);const{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=ig(r)),this._blurMaterial=rg(r,t,e),this._ggxMaterial=sg(r,t,e)}return s}_compileMaterial(t){const e=new tn(new Pe,t);this._renderer.compile(e,ss)}_sceneToCubeUV(t,e,n,s,r){const c=new on(90,1,e,n),l=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],f=this._renderer,h=f.autoClear,d=f.toneMapping;f.getClearColor(oc),f.toneMapping=xn,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(s),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new tn(new Ps,new ds({name:"PMREM.Background",side:Ve,depthWrite:!1,depthTest:!1})));const S=this._backgroundBox,m=S.material;let p=!1;const y=t.background;y?y.isColor&&(m.color.copy(y),t.background=null,p=!0):(m.color.copy(oc),p=!0);for(let w=0;w<6;w++){const M=w%3;M===0?(c.up.set(0,l[w],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x+u[w],r.y,r.z)):M===1?(c.up.set(0,0,l[w]),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y+u[w],r.z)):(c.up.set(0,l[w],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y,r.z+u[w]));const b=this._cubeSize;Ui(s,M*b,w>2?b:0,b,b),f.setRenderTarget(s),p&&f.render(S,c),f.render(t,c)}f.toneMapping=d,f.autoClear=h,t.background=y}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===ci||t.mapping===Vi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=uc()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=hc());const r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;const o=r.uniforms;o.envMap.value=t;const c=this._cubeSize;Ui(e,0,0,3*c,2*c),n.setRenderTarget(e),n.render(a,ss)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(t,r-1,r);e.autoClear=n}_applyGGXFilter(t,e,n){const s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;const c=a.uniforms,l=n/(this._lodMeshes.length-1),u=e/(this._lodMeshes.length-1),f=Math.sqrt(l*l-u*u),h=l*1.25,d=f*h,{_lodMax:_}=this,S=this._sizeLods[n],m=3*S*(n>_-zi?n-_+zi:0),p=4*(this._cubeSize-S);c.envMap.value=t.texture,c.roughness.value=d,c.mipInt.value=_-e,Ui(r,m,p,3*S,2*S),s.setRenderTarget(r),s.render(o,ss),c.envMap.value=r.texture,c.roughness.value=0,c.mipInt.value=_-n,Ui(t,m,p,3*S,2*S),s.setRenderTarget(t),s.render(o,ss)}_blur(t,e,n,s){const r=this._pingPongRenderTarget,a=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(t,r,e,n,a),this._blurPass(r,t,n,n,a)}_blurPass(t,e,n,s,r){const a=this._renderer,o=this._blurMaterial,c=this._lodMeshes[s];c.material=o;const l=o.uniforms;l.envMap.value=t.texture,l.sigma.value=r,l.mipInt.value=this._lodMax-n;const u=this._sizeLods[s],f=3*u*(s>this._lodMax-zi?s-this._lodMax+zi:0),h=4*(this._cubeSize-u);Ui(e,f,h,3*u,2*u),a.setRenderTarget(e),a.render(c,ss)}}function ig(i){const t=[],e=[];let n=i;const s=i-zi+1+jm;for(let r=0;r<s;r++){const a=Math.pow(2,n);t.push(a);const o=1/(a-2),c=-o,l=1+o,u=[c,c,l,c,l,l,c,c,l,l,c,l],f=6,h=6,d=3,_=new Float32Array(d*h*f),S=new Float32Array(d*h*f);for(let p=0;p<f;p++){const y=p%3*2/3-1,w=p>2?0:-1,M=[y,w,0,y+2/3,w,0,y+2/3,w+1,0,y,w,0,y+2/3,w+1,0,y,w+1,0];_.set(M,d*h*p);for(let b=0;b<h;b++){const T=u[b*2]*2-1,R=u[b*2+1]*2-1;p===0?ri.set(1,R,T):p===1?ri.set(-T,1,-R):p===2?ri.set(-T,R,1):p===3?ri.set(-1,R,-T):p===4?ri.set(-T,-1,R):ri.set(T,R,-1),ri.toArray(S,(p*h+b)*d)}}const m=new Pe;m.setAttribute("position",new Sn(_,d)),m.setAttribute("outputDirection",new Sn(S,d)),e.push(new tn(m,null)),n>zi&&n--}return{lodMeshes:e,sizeLods:t}}function cc(i,t,e){const n=new cn(i,t,e);return n.texture.mapping=Gr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ui(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function sg(i,t,e){return new bn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:eg,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Wr(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function rg(i,t,e){return new bn({name:"SphericalGaussianBlur",defines:{SAMPLES:tg,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Wr(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function hc(){return new bn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Wr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function uc(){return new bn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Wr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function Wr(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class yh extends cn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new lh(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Ps(5,5,5),r=new bn({name:"CubemapFromEquirect",uniforms:Xi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ve,blending:Fn});r.uniforms.tEquirect.value=e;const a=new tn(s,r),o=e.minFilter;return e.minFilter===ai&&(e.minFilter=Fe),new of(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){const r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}}function ag(i){let t=new WeakMap,e=new WeakMap,n=null;function s(h,d=!1){return h==null?null:d?a(h):r(h)}function r(h){if(h&&h.isTexture){const d=h.mapping;if(d===Kr||d===Jr)if(t.has(h)){const _=t.get(h).texture;return o(_,h.mapping)}else{const _=h.image;if(_&&_.height>0){const S=new yh(_.height);return S.fromEquirectangularTexture(i,h),t.set(h,S),h.addEventListener("dispose",l),o(S.texture,h.mapping)}else return null}}return h}function a(h){if(h&&h.isTexture){const d=h.mapping,_=d===Kr||d===Jr,S=d===ci||d===Vi;if(_||S){let m=e.get(h);const p=m!==void 0?m.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==p)return n===null&&(n=new lc(i)),m=_?n.fromEquirectangular(h,m):n.fromCubemap(h,m),m.texture.pmremVersion=h.pmremVersion,e.set(h,m),m.texture;if(m!==void 0)return m.texture;{const y=h.image;return _&&y&&y.height>0||S&&y&&c(y)?(n===null&&(n=new lc(i)),m=_?n.fromEquirectangular(h):n.fromCubemap(h),m.texture.pmremVersion=h.pmremVersion,e.set(h,m),h.addEventListener("dispose",u),m.texture):null}}}return h}function o(h,d){return d===Kr?h.mapping=ci:d===Jr&&(h.mapping=Vi),h}function c(h){let d=0;const _=6;for(let S=0;S<_;S++)h[S]!==void 0&&d++;return d===_}function l(h){const d=h.target;d.removeEventListener("dispose",l);const _=t.get(d);_!==void 0&&(t.delete(d),_.dispose())}function u(h){const d=h.target;d.removeEventListener("dispose",u);const _=e.get(d);_!==void 0&&(e.delete(d),_.dispose())}function f(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:f}}function og(i){const t={};function e(n){if(t[n]!==void 0)return t[n];const s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&Hi("WebGLRenderer: "+n+" extension not supported."),s}}}function lg(i,t,e,n){const s={},r=new WeakMap;function a(f){const h=f.target;h.index!==null&&t.remove(h.index);for(const _ in h.attributes)t.remove(h.attributes[_]);h.removeEventListener("dispose",a),delete s[h.id];const d=r.get(h);d&&(t.remove(d),r.delete(h)),n.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,e.memory.geometries--}function o(f,h){return s[h.id]===!0||(h.addEventListener("dispose",a),s[h.id]=!0,e.memory.geometries++),h}function c(f){const h=f.attributes;for(const d in h)t.update(h[d],i.ARRAY_BUFFER)}function l(f){const h=[],d=f.index,_=f.attributes.position;let S=0;if(_===void 0)return;if(d!==null){const y=d.array;S=d.version;for(let w=0,M=y.length;w<M;w+=3){const b=y[w+0],T=y[w+1],R=y[w+2];h.push(b,T,T,R,R,b)}}else{const y=_.array;S=_.version;for(let w=0,M=y.length/3-1;w<M;w+=3){const b=w+0,T=w+1,R=w+2;h.push(b,T,T,R,R,b)}}const m=new(_.count>=65535?nh:eh)(h,1);m.version=S;const p=r.get(f);p&&t.remove(p),r.set(f,m)}function u(f){const h=r.get(f);if(h){const d=f.index;d!==null&&h.version<d.version&&l(f)}else l(f);return r.get(f)}return{get:o,update:c,getWireframeAttribute:u}}function cg(i,t,e){let n;function s(f){n=f}let r,a;function o(f){r=f.type,a=f.bytesPerElement}function c(f,h){i.drawElements(n,h,r,f*a),e.update(h,n,1)}function l(f,h,d){d!==0&&(i.drawElementsInstanced(n,h,r,f*a,d),e.update(h,n,d))}function u(f,h,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,h,0,r,f,0,d);let S=0;for(let m=0;m<d;m++)S+=h[m];e.update(S,n,1)}this.setMode=s,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function hg(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:Jt("WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function ug(i,t,e){const n=new WeakMap,s=new Me;function r(a,o,c){const l=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=u!==void 0?u.length:0;let h=n.get(o);if(h===void 0||h.count!==f){let P=function(){v.dispose(),n.delete(o),o.removeEventListener("dispose",P)};var d=P;h!==void 0&&h.texture.dispose();const _=o.morphAttributes.position!==void 0,S=o.morphAttributes.normal!==void 0,m=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],y=o.morphAttributes.normal||[],w=o.morphAttributes.color||[];let M=0;_===!0&&(M=1),S===!0&&(M=2),m===!0&&(M=3);let b=o.attributes.position.count*M,T=1;b>t.maxTextureSize&&(T=Math.ceil(b/t.maxTextureSize),b=t.maxTextureSize);const R=new Float32Array(b*T*4*f),v=new jc(R,b,T,f);v.type=_n,v.needsUpdate=!0;const A=M*4;for(let U=0;U<f;U++){const G=p[U],X=y[U],F=w[U],B=b*T*4*U;for(let J=0;J<G.count;J++){const V=J*A;_===!0&&(s.fromBufferAttribute(G,J),R[B+V+0]=s.x,R[B+V+1]=s.y,R[B+V+2]=s.z,R[B+V+3]=0),S===!0&&(s.fromBufferAttribute(X,J),R[B+V+4]=s.x,R[B+V+5]=s.y,R[B+V+6]=s.z,R[B+V+7]=0),m===!0&&(s.fromBufferAttribute(F,J),R[B+V+8]=s.x,R[B+V+9]=s.y,R[B+V+10]=s.z,R[B+V+11]=F.itemSize===4?s.w:1)}}h={count:f,texture:v,size:new at(b,T)},n.set(o,h),o.addEventListener("dispose",P)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let _=0;for(let m=0;m<l.length;m++)_+=l[m];const S=o.morphTargetsRelative?1:1-_;c.getUniforms().setValue(i,"morphTargetBaseInfluence",S),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",h.texture,e),c.getUniforms().setValue(i,"morphTargetsTextureSize",h.size)}return{update:r}}function dg(i,t,e,n,s){let r=new WeakMap;function a(l){const u=s.render.frame,f=l.geometry,h=t.get(l,f);if(r.get(h)!==u&&(t.update(h),r.set(h,u)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),r.get(l)!==u&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,u))),l.isSkinnedMesh){const d=l.skeleton;r.get(d)!==u&&(d.update(),r.set(d,u))}return h}function o(){r=new WeakMap}function c(l){const u=l.target;u.removeEventListener("dispose",c),n.releaseStatesOfObject(u),e.remove(u.instanceMatrix),u.instanceColor!==null&&e.remove(u.instanceColor)}return{update:a,dispose:o}}const fg={[Fc]:"LINEAR_TONE_MAPPING",[Oc]:"REINHARD_TONE_MAPPING",[Bc]:"CINEON_TONE_MAPPING",[zc]:"ACES_FILMIC_TONE_MAPPING",[Hc]:"AGX_TONE_MAPPING",[Gc]:"NEUTRAL_TONE_MAPPING",[kc]:"CUSTOM_TONE_MAPPING"};function pg(i,t,e,n,s,r){const a=new cn(t,e,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,c=null;const l=new Pe;l.setAttribute("position",new De([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new De([0,2,0,0,2,0],2));const u=new nf({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new tn(l,u),h=new qo(-1,1,1,-1,0,1);let d=null,_=null,S=!1,m,p=null,y=[],w=!1;this.setSize=function(M,b){a.setSize(M,b),o!==null&&o.setSize(M,b),c!==null&&c.setSize(M,b);for(let T=0;T<y.length;T++){const R=y[T];R.setSize&&R.setSize(M,b)}},this.setEffects=function(M){y=M,w=y.length>0&&y[0].isRenderPass===!0;const b=a.width,T=a.height;y.length>0&&o===null&&(o=new cn(b,T,{type:yn,depthBuffer:!1,stencilBuffer:!1}),c=new cn(b,T,{type:yn,depthBuffer:!1,stencilBuffer:!1}));for(let R=0;R<y.length;R++){const v=y[R];v.setSize&&v.setSize(b,T)}},this.begin=function(M,b){if(S||M.toneMapping===xn&&y.length===0)return!1;if(p=b,b!==null){const T=b.width,R=b.height;(a.width!==T||a.height!==R)&&this.setSize(T,R)}return w===!1&&M.setRenderTarget(a),m=M.toneMapping,M.toneMapping=xn,!0},this.hasRenderPass=function(){return w},this.end=function(M,b){M.toneMapping=m,S=!0;let T=a,R=o;for(let v=0;v<y.length;v++){const A=y[v];A.enabled!==!1&&(A.render(M,R,T,b),A.needsSwap!==!1&&(T=R,R=R===o?c:o))}if(d!==M.outputColorSpace||_!==M.toneMapping){d=M.outputColorSpace,_=M.toneMapping,u.defines={},Qt.getTransfer(d)===le&&(u.defines.SRGB_TRANSFER="");const v=fg[_];v&&(u.defines[v]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=T.texture,M.setRenderTarget(p),M.render(f,h),p=null,S=!1},this.isCompositing=function(){return S},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),c!==null&&c.dispose(),l.dispose(),u.dispose()}}const bh=new Oe,Ro=new Ms(1,1),Eh=new jc,Th=new qu,Ah=new lh,dc=[],fc=[],pc=new Float32Array(16),mc=new Float32Array(9),gc=new Float32Array(4);function qi(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=dc[s];if(r===void 0&&(r=new Float32Array(s),dc[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function we(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Re(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Xr(i,t){let e=fc[t];e===void 0&&(e=new Int32Array(t),fc[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function mg(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function gg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(we(e,t))return;i.uniform2fv(this.addr,t),Re(e,t)}}function _g(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(we(e,t))return;i.uniform3fv(this.addr,t),Re(e,t)}}function vg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(we(e,t))return;i.uniform4fv(this.addr,t),Re(e,t)}}function xg(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(we(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Re(e,t)}else{if(we(e,n))return;gc.set(n),i.uniformMatrix2fv(this.addr,!1,gc),Re(e,n)}}function Sg(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(we(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Re(e,t)}else{if(we(e,n))return;mc.set(n),i.uniformMatrix3fv(this.addr,!1,mc),Re(e,n)}}function Mg(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(we(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Re(e,t)}else{if(we(e,n))return;pc.set(n),i.uniformMatrix4fv(this.addr,!1,pc),Re(e,n)}}function yg(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function bg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(we(e,t))return;i.uniform2iv(this.addr,t),Re(e,t)}}function Eg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(we(e,t))return;i.uniform3iv(this.addr,t),Re(e,t)}}function Tg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(we(e,t))return;i.uniform4iv(this.addr,t),Re(e,t)}}function Ag(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function wg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(we(e,t))return;i.uniform2uiv(this.addr,t),Re(e,t)}}function Rg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(we(e,t))return;i.uniform3uiv(this.addr,t),Re(e,t)}}function Cg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(we(e,t))return;i.uniform4uiv(this.addr,t),Re(e,t)}}function Pg(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Ro.compareFunction=e.isReversedDepthBuffer()?Go:Ho,r=Ro):r=bh,e.setTexture2D(t||r,s)}function Lg(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Th,s)}function Dg(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||Ah,s)}function Ig(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Eh,s)}function Ng(i){switch(i){case 5126:return mg;case 35664:return gg;case 35665:return _g;case 35666:return vg;case 35674:return xg;case 35675:return Sg;case 35676:return Mg;case 5124:case 35670:return yg;case 35667:case 35671:return bg;case 35668:case 35672:return Eg;case 35669:case 35673:return Tg;case 5125:return Ag;case 36294:return wg;case 36295:return Rg;case 36296:return Cg;case 35678:case 36198:case 36298:case 36306:case 35682:return Pg;case 35679:case 36299:case 36307:return Lg;case 35680:case 36300:case 36308:case 36293:return Dg;case 36289:case 36303:case 36311:case 36292:return Ig}}function Ug(i,t){i.uniform1fv(this.addr,t)}function Fg(i,t){const e=qi(t,this.size,2);i.uniform2fv(this.addr,e)}function Og(i,t){const e=qi(t,this.size,3);i.uniform3fv(this.addr,e)}function Bg(i,t){const e=qi(t,this.size,4);i.uniform4fv(this.addr,e)}function zg(i,t){const e=qi(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function kg(i,t){const e=qi(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Hg(i,t){const e=qi(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Gg(i,t){i.uniform1iv(this.addr,t)}function Vg(i,t){i.uniform2iv(this.addr,t)}function Wg(i,t){i.uniform3iv(this.addr,t)}function Xg(i,t){i.uniform4iv(this.addr,t)}function $g(i,t){i.uniform1uiv(this.addr,t)}function Yg(i,t){i.uniform2uiv(this.addr,t)}function qg(i,t){i.uniform3uiv(this.addr,t)}function Zg(i,t){i.uniform4uiv(this.addr,t)}function Kg(i,t,e){const n=this.cache,s=t.length,r=Xr(e,s);we(n,r)||(i.uniform1iv(this.addr,r),Re(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=Ro:a=bh;for(let o=0;o!==s;++o)e.setTexture2D(t[o]||a,r[o])}function Jg(i,t,e){const n=this.cache,s=t.length,r=Xr(e,s);we(n,r)||(i.uniform1iv(this.addr,r),Re(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||Th,r[a])}function Qg(i,t,e){const n=this.cache,s=t.length,r=Xr(e,s);we(n,r)||(i.uniform1iv(this.addr,r),Re(n,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||Ah,r[a])}function jg(i,t,e){const n=this.cache,s=t.length,r=Xr(e,s);we(n,r)||(i.uniform1iv(this.addr,r),Re(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||Eh,r[a])}function t_(i){switch(i){case 5126:return Ug;case 35664:return Fg;case 35665:return Og;case 35666:return Bg;case 35674:return zg;case 35675:return kg;case 35676:return Hg;case 5124:case 35670:return Gg;case 35667:case 35671:return Vg;case 35668:case 35672:return Wg;case 35669:case 35673:return Xg;case 5125:return $g;case 36294:return Yg;case 36295:return qg;case 36296:return Zg;case 35678:case 36198:case 36298:case 36306:case 35682:return Kg;case 35679:case 36299:case 36307:return Jg;case 35680:case 36300:case 36308:case 36293:return Qg;case 36289:case 36303:case 36311:case 36292:return jg}}class e_{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Ng(e.type)}}class n_{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=t_(e.type)}}class i_{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,a=s.length;r!==a;++r){const o=s[r];o.setValue(t,e[o.id],n)}}}const La=/(\w+)(\])?(\[|\.)?/g;function _c(i,t){i.seq.push(t),i.map[t.id]=t}function s_(i,t,e){const n=i.name,s=n.length;for(La.lastIndex=0;;){const r=La.exec(n),a=La.lastIndex;let o=r[1];const c=r[2]==="]",l=r[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===s){_c(e,l===void 0?new e_(o,i,t):new n_(o,i,t));break}else{let f=e.map[o];f===void 0&&(f=new i_(o),_c(e,f)),e=f}}}class Tr{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){const o=t.getActiveUniform(e,a),c=t.getUniformLocation(e,o.name);s_(o,c,this)}const s=[],r=[];for(const a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){const o=e[r],c=n[o.id];c.needsUpdate!==!1&&o.setValue(t,c.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const a=t[s];a.id in e&&n.push(a)}return n}}function vc(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const r_=37297;let a_=0;function o_(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){const o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}const xc=new Vt;function l_(i){Qt._getMatrix(xc,Qt.workingColorSpace,i);const t=`mat3( ${xc.elements.map(e=>e.toFixed(4))} )`;switch(Qt.getTransfer(i)){case Cr:return[t,"LinearTransferOETF"];case le:return[t,"sRGBTransferOETF"];default:return zt("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Sc(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),r=(i.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const o=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+o_(i.getShaderSource(t),o)}else return r}function c_(i,t){const e=l_(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}const h_={[Fc]:"Linear",[Oc]:"Reinhard",[Bc]:"Cineon",[zc]:"ACESFilmic",[Hc]:"AgX",[Gc]:"Neutral",[kc]:"Custom"};function u_(i,t){const e=h_[t];return e===void 0?(zt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const gr=new L;function d_(){Qt.getLuminanceCoefficients(gr);const i=gr.x.toFixed(4),t=gr.y.toFixed(4),e=gr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function f_(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(cs).join(`
`)}function p_(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function m_(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),a=r.name;let o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function cs(i){return i!==""}function Mc(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function yc(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const g_=/^[ \t]*#include +<([\w\d./]+)>/gm;function Co(i){return i.replace(g_,v_)}const __=new Map;function v_(i,t){let e=$t[t];if(e===void 0){const n=__.get(t);if(n!==void 0)e=$t[n],zt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return Co(e)}const x_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function bc(i){return i.replace(x_,S_)}function S_(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Ec(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}const M_={[Sr]:"SHADOWMAP_TYPE_PCF",[os]:"SHADOWMAP_TYPE_VSM"};function y_(i){return M_[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const b_={[ci]:"ENVMAP_TYPE_CUBE",[Vi]:"ENVMAP_TYPE_CUBE",[Gr]:"ENVMAP_TYPE_CUBE_UV"};function E_(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":b_[i.envMapMode]||"ENVMAP_TYPE_CUBE"}const T_={[Vi]:"ENVMAP_MODE_REFRACTION"};function A_(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":T_[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}const w_={[Uc]:"ENVMAP_BLENDING_MULTIPLY",[Tu]:"ENVMAP_BLENDING_MIX",[Au]:"ENVMAP_BLENDING_ADD"};function R_(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":w_[i.combine]||"ENVMAP_BLENDING_NONE"}function C_(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function P_(i,t,e,n){const s=i.getContext(),r=e.defines;let a=e.vertexShader,o=e.fragmentShader;const c=y_(e),l=E_(e),u=A_(e),f=R_(e),h=C_(e),d=f_(e),_=p_(r),S=s.createProgram();let m,p,y=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(cs).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(cs).join(`
`),p.length>0&&(p+=`
`)):(m=[Ec(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(cs).join(`
`),p=[Ec(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+u:"",e.envMap?"#define "+f:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==xn?"#define TONE_MAPPING":"",e.toneMapping!==xn?$t.tonemapping_pars_fragment:"",e.toneMapping!==xn?u_("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",$t.colorspace_pars_fragment,c_("linearToOutputTexel",e.outputColorSpace),d_(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(cs).join(`
`)),a=Co(a),a=Mc(a,e),a=yc(a,e),o=Co(o),o=Mc(o,e),o=yc(o,e),a=bc(a),o=bc(o),e.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,m=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",e.glslVersion===Ml?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Ml?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const w=y+m+a,M=y+p+o,b=vc(s,s.VERTEX_SHADER,w),T=vc(s,s.FRAGMENT_SHADER,M);s.attachShader(S,b),s.attachShader(S,T),e.index0AttributeName!==void 0?s.bindAttribLocation(S,0,e.index0AttributeName):e.hasPositionAttribute===!0&&s.bindAttribLocation(S,0,"position"),s.linkProgram(S);function R(U){if(i.debug.checkShaderErrors){const G=s.getProgramInfoLog(S)||"",X=s.getShaderInfoLog(b)||"",F=s.getShaderInfoLog(T)||"",B=G.trim(),J=X.trim(),V=F.trim();let rt=!0,$=!0;if(s.getProgramParameter(S,s.LINK_STATUS)===!1)if(rt=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,S,b,T);else{const tt=Sc(s,b,"vertex"),it=Sc(s,T,"fragment");Jt("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(S,s.VALIDATE_STATUS)+`

Material Name: `+U.name+`
Material Type: `+U.type+`

Program Info Log: `+B+`
`+tt+`
`+it)}else B!==""?zt("WebGLProgram: Program Info Log:",B):(J===""||V==="")&&($=!1);$&&(U.diagnostics={runnable:rt,programLog:B,vertexShader:{log:J,prefix:m},fragmentShader:{log:V,prefix:p}})}s.deleteShader(b),s.deleteShader(T),v=new Tr(s,S),A=m_(s,S)}let v;this.getUniforms=function(){return v===void 0&&R(this),v};let A;this.getAttributes=function(){return A===void 0&&R(this),A};let P=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return P===!1&&(P=s.getProgramParameter(S,r_)),P},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(S),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=a_++,this.cacheKey=t,this.usedTimes=1,this.program=S,this.vertexShader=b,this.fragmentShader=T,this}let L_=0;class D_{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){const s=this._getShaderCacheForMaterial(t);return s.has(e)===!1&&(s.add(e),e.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new I_(t),e.set(t,n)),n}}class I_{constructor(t){this.id=L_++,this.code=t,this.usedTimes=0}}function N_(i){return i===hi||i===Ar||i===wr}function U_(i,t,e,n,s,r){const a=new Wo,o=new D_,c=new Set,l=[],u=new Map,f=n.logarithmicDepthBuffer;let h=n.precision;const d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(v){return c.add(v),v===0?"uv":`uv${v}`}function S(v,A,P,U,G,X){const F=U.fog,B=G.geometry,J=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?U.environment:null,V=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap,rt=t.get(v.envMap||J,V),$=rt&&rt.mapping===Gr?rt.image.height:null,tt=d[v.type];v.precision!==null&&(h=n.getMaxPrecision(v.precision),h!==v.precision&&zt("WebGLProgram.getParameters:",v.precision,"not supported, using",h,"instead."));const it=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,Lt=it!==void 0?it.length:0;let At=0;B.morphAttributes.position!==void 0&&(At=1),B.morphAttributes.normal!==void 0&&(At=2),B.morphAttributes.color!==void 0&&(At=3);let ne,qt,te,K;if(tt){const pe=mn[tt];ne=pe.vertexShader,qt=pe.fragmentShader}else{ne=v.vertexShader,qt=v.fragmentShader;const pe=o.getVertexShaderStage(v),re=o.getFragmentShaderStage(v);o.update(v,pe,re),te=pe.id,K=re.id}const et=i.getRenderTarget(),xt=i.state.buffers.depth.getReversed(),Bt=G.isInstancedMesh===!0,bt=G.isBatchedMesh===!0,kt=!!v.map,oe=!!v.matcap,nt=!!rt,ot=!!v.aoMap,lt=!!v.lightMap,ct=!!v.bumpMap&&v.wireframe===!1,dt=!!v.normalMap,Ft=!!v.displacementMap,Ut=!!v.emissiveMap,Ht=!!v.metalnessMap,Gt=!!v.roughnessMap,C=v.anisotropy>0,se=v.clearcoat>0,Zt=v.dispersion>0,E=v.retroreflectivity>0,g=v.iridescence>0,O=v.sheen>0,H=v.transmission>0,Y=C&&!!v.anisotropyMap,ht=se&&!!v.clearcoatMap,ut=se&&!!v.clearcoatNormalMap,q=se&&!!v.clearcoatRoughnessMap,j=g&&!!v.iridescenceMap,ft=g&&!!v.iridescenceThicknessMap,Dt=O&&!!v.sheenColorMap,_t=O&&!!v.sheenRoughnessMap,pt=!!v.specularMap,It=!!v.specularColorMap,Ot=!!v.specularIntensityMap,Wt=H&&!!v.transmissionMap,N=H&&!!v.thicknessMap,mt=!!v.gradientMap,Q=!!v.alphaMap,gt=v.alphaTest>0,yt=!!v.alphaHash,st=!!v.extensions;let Nt=xn;v.toneMapped&&(et===null||et.isXRRenderTarget===!0)&&(Nt=i.toneMapping);const Ct={shaderID:tt,shaderType:v.type,shaderName:v.name,vertexShader:ne,fragmentShader:qt,defines:v.defines,customVertexShaderID:te,customFragmentShaderID:K,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:h,batching:bt,batchingColor:bt&&G._colorsTexture!==null,instancing:Bt,instancingColor:Bt&&G.instanceColor!==null,instancingMorph:Bt&&G.morphTexture!==null,outputColorSpace:et===null?i.outputColorSpace:et.isXRRenderTarget===!0?et.texture.colorSpace:Qt.workingColorSpace,alphaToCoverage:!!v.alphaToCoverage,map:kt,matcap:oe,envMap:nt,envMapMode:nt&&rt.mapping,envMapCubeUVHeight:$,aoMap:ot,lightMap:lt,bumpMap:ct,normalMap:dt,displacementMap:Ft,emissiveMap:Ut,normalMapObjectSpace:dt&&v.normalMapType===Cu,normalMapTangentSpace:dt&&v.normalMapType===Sl,packedNormalMap:dt&&v.normalMapType===Sl&&N_(v.normalMap.format),metalnessMap:Ht,roughnessMap:Gt,anisotropy:C,anisotropyMap:Y,clearcoat:se,clearcoatMap:ht,clearcoatNormalMap:ut,clearcoatRoughnessMap:q,dispersion:Zt,retroreflection:E,iridescence:g,iridescenceMap:j,iridescenceThicknessMap:ft,sheen:O,sheenColorMap:Dt,sheenRoughnessMap:_t,specularMap:pt,specularColorMap:It,specularIntensityMap:Ot,transmission:H,transmissionMap:Wt,thicknessMap:N,gradientMap:mt,opaque:v.transparent===!1&&v.blending===hs&&v.alphaToCoverage===!1,alphaMap:Q,alphaTest:gt,alphaHash:yt,combine:v.combine,mapUv:kt&&_(v.map.channel),aoMapUv:ot&&_(v.aoMap.channel),lightMapUv:lt&&_(v.lightMap.channel),bumpMapUv:ct&&_(v.bumpMap.channel),normalMapUv:dt&&_(v.normalMap.channel),displacementMapUv:Ft&&_(v.displacementMap.channel),emissiveMapUv:Ut&&_(v.emissiveMap.channel),metalnessMapUv:Ht&&_(v.metalnessMap.channel),roughnessMapUv:Gt&&_(v.roughnessMap.channel),anisotropyMapUv:Y&&_(v.anisotropyMap.channel),clearcoatMapUv:ht&&_(v.clearcoatMap.channel),clearcoatNormalMapUv:ut&&_(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:q&&_(v.clearcoatRoughnessMap.channel),iridescenceMapUv:j&&_(v.iridescenceMap.channel),iridescenceThicknessMapUv:ft&&_(v.iridescenceThicknessMap.channel),sheenColorMapUv:Dt&&_(v.sheenColorMap.channel),sheenRoughnessMapUv:_t&&_(v.sheenRoughnessMap.channel),specularMapUv:pt&&_(v.specularMap.channel),specularColorMapUv:It&&_(v.specularColorMap.channel),specularIntensityMapUv:Ot&&_(v.specularIntensityMap.channel),transmissionMapUv:Wt&&_(v.transmissionMap.channel),thicknessMapUv:N&&_(v.thicknessMap.channel),alphaMapUv:Q&&_(v.alphaMap.channel),vertexTangents:!!B.attributes.tangent&&(dt||C),vertexNormals:!!B.attributes.normal,vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,pointsUvs:G.isPoints===!0&&!!B.attributes.uv&&(kt||Q),fog:!!F,useFog:v.fog===!0,fogExp2:!!F&&F.isFogExp2,flatShading:v.wireframe===!1&&(v.flatShading===!0||B.attributes.normal===void 0&&dt===!1&&(v.isMeshLambertMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isMeshPhysicalMaterial)),sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:xt,skinning:G.isSkinnedMesh===!0,hasPositionAttribute:B.attributes.position!==void 0,morphTargets:B.morphAttributes.position!==void 0,morphNormals:B.morphAttributes.normal!==void 0,morphColors:B.morphAttributes.color!==void 0,morphTargetsCount:Lt,morphTextureStride:At,numSunLights:A.sun.length,numDirLights:A.directional.length,numPointLights:A.point.length,numSpotLights:A.spot.length,numSpotLightMaps:A.spotLightMap.length,numRectAreaLights:A.rectArea.length,numHemiLights:A.hemi.length,numSunLightShadows:A.sunShadowMap.length,numDirLightShadows:A.directionalShadowMap.length,numPointLightShadows:A.pointShadowMap.length,numSpotLightShadows:A.spotShadowMap.length,numSpotLightShadowsWithMaps:A.numSpotLightShadowsWithMaps,numLightProbes:A.numLightProbes,numLightProbeGrids:X.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:v.dithering,shadowMapEnabled:i.shadowMap.enabled&&P.length>0,shadowMapType:i.shadowMap.type,toneMapping:Nt,decodeVideoTexture:kt&&v.map.isVideoTexture===!0&&Qt.getTransfer(v.map.colorSpace)===le,decodeVideoTextureEmissive:Ut&&v.emissiveMap.isVideoTexture===!0&&Qt.getTransfer(v.emissiveMap.colorSpace)===le,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===Je,flipSided:v.side===Ve,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:st&&v.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(st&&v.extensions.multiDraw===!0||bt)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return Ct.vertexUv1s=c.has(1),Ct.vertexUv2s=c.has(2),Ct.vertexUv3s=c.has(3),c.clear(),Ct}function m(v){const A=[];if(v.shaderID?A.push(v.shaderID):(A.push(v.customVertexShaderID),A.push(v.customFragmentShaderID)),v.defines!==void 0)for(const P in v.defines)A.push(P),A.push(v.defines[P]);return v.isRawShaderMaterial===!1&&(p(A,v),y(A,v),A.push(i.outputColorSpace)),A.push(v.customProgramCacheKey),A.join()}function p(v,A){v.push(A.precision),v.push(A.outputColorSpace),v.push(A.envMapMode),v.push(A.envMapCubeUVHeight),v.push(A.mapUv),v.push(A.alphaMapUv),v.push(A.lightMapUv),v.push(A.aoMapUv),v.push(A.bumpMapUv),v.push(A.normalMapUv),v.push(A.displacementMapUv),v.push(A.emissiveMapUv),v.push(A.metalnessMapUv),v.push(A.roughnessMapUv),v.push(A.anisotropyMapUv),v.push(A.clearcoatMapUv),v.push(A.clearcoatNormalMapUv),v.push(A.clearcoatRoughnessMapUv),v.push(A.iridescenceMapUv),v.push(A.iridescenceThicknessMapUv),v.push(A.sheenColorMapUv),v.push(A.sheenRoughnessMapUv),v.push(A.specularMapUv),v.push(A.specularColorMapUv),v.push(A.specularIntensityMapUv),v.push(A.transmissionMapUv),v.push(A.thicknessMapUv),v.push(A.combine),v.push(A.fogExp2),v.push(A.sizeAttenuation),v.push(A.morphTargetsCount),v.push(A.morphAttributeCount),v.push(A.numSunLights),v.push(A.numDirLights),v.push(A.numPointLights),v.push(A.numSpotLights),v.push(A.numSpotLightMaps),v.push(A.numHemiLights),v.push(A.numRectAreaLights),v.push(A.numSunLightShadows),v.push(A.numDirLightShadows),v.push(A.numPointLightShadows),v.push(A.numSpotLightShadows),v.push(A.numSpotLightShadowsWithMaps),v.push(A.numLightProbes),v.push(A.shadowMapType),v.push(A.toneMapping),v.push(A.numClippingPlanes),v.push(A.numClipIntersection),v.push(A.depthPacking)}function y(v,A){a.disableAll(),A.instancing&&a.enable(0),A.instancingColor&&a.enable(1),A.instancingMorph&&a.enable(2),A.matcap&&a.enable(3),A.envMap&&a.enable(4),A.normalMapObjectSpace&&a.enable(5),A.normalMapTangentSpace&&a.enable(6),A.clearcoat&&a.enable(7),A.iridescence&&a.enable(8),A.alphaTest&&a.enable(9),A.vertexColors&&a.enable(10),A.vertexAlphas&&a.enable(11),A.vertexUv1s&&a.enable(12),A.vertexUv2s&&a.enable(13),A.vertexUv3s&&a.enable(14),A.vertexTangents&&a.enable(15),A.anisotropy&&a.enable(16),A.alphaHash&&a.enable(17),A.batching&&a.enable(18),A.dispersion&&a.enable(19),A.retroreflection&&a.enable(24),A.batchingColor&&a.enable(20),A.gradientMap&&a.enable(21),A.packedNormalMap&&a.enable(22),A.vertexNormals&&a.enable(23),v.push(a.mask),a.disableAll(),A.fog&&a.enable(0),A.useFog&&a.enable(1),A.flatShading&&a.enable(2),A.logarithmicDepthBuffer&&a.enable(3),A.reversedDepthBuffer&&a.enable(4),A.skinning&&a.enable(5),A.morphTargets&&a.enable(6),A.morphNormals&&a.enable(7),A.morphColors&&a.enable(8),A.premultipliedAlpha&&a.enable(9),A.shadowMapEnabled&&a.enable(10),A.doubleSided&&a.enable(11),A.flipSided&&a.enable(12),A.useDepthPacking&&a.enable(13),A.dithering&&a.enable(14),A.transmission&&a.enable(15),A.sheen&&a.enable(16),A.opaque&&a.enable(17),A.pointsUvs&&a.enable(18),A.decodeVideoTexture&&a.enable(19),A.decodeVideoTextureEmissive&&a.enable(20),A.alphaToCoverage&&a.enable(21),A.numLightProbeGrids>0&&a.enable(22),A.hasPositionAttribute&&a.enable(23),v.push(a.mask)}function w(v){const A=d[v.type];let P;if(A){const U=mn[A];P=jd.clone(U.uniforms)}else P=v.uniforms;return P}function M(v,A){let P=u.get(A);return P!==void 0?++P.usedTimes:(P=new P_(i,A,v,s),l.push(P),u.set(A,P)),P}function b(v){if(--v.usedTimes===0){const A=l.indexOf(v);l[A]=l[l.length-1],l.pop(),u.delete(v.cacheKey),v.destroy()}}function T(v){o.remove(v)}function R(){o.dispose()}return{getParameters:S,getProgramCacheKey:m,getUniforms:w,acquireProgram:M,releaseProgram:b,releaseShaderCache:T,programs:l,dispose:R}}function F_(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,c){i.get(a)[o]=c}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function O_(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function Tc(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Ac(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(h){let d=0;return h.isInstancedMesh&&(d+=2),h.isSkinnedMesh&&(d+=1),d}function o(h,d,_,S,m,p){let y=i[t];return y===void 0?(y={id:h.id,object:h,geometry:d,material:_,materialVariant:a(h),groupOrder:S,renderOrder:h.renderOrder,z:m,group:p},i[t]=y):(y.id=h.id,y.object=h,y.geometry=d,y.material=_,y.materialVariant=a(h),y.groupOrder=S,y.renderOrder=h.renderOrder,y.z=m,y.group=p),t++,y}function c(h,d,_,S,m,p,y){y.reversedDepth===!0&&(m=-m);const w=o(h,d,_,S,m,p);_.transmission>0?n.push(w):_.transparent===!0?s.push(w):e.push(w)}function l(h,d,_,S,m,p){const y=o(h,d,_,S,m,p);_.transmission>0?n.unshift(y):_.transparent===!0?s.unshift(y):e.unshift(y)}function u(h,d){e.length>1&&e.sort(h||O_),n.length>1&&n.sort(d||Tc),s.length>1&&s.sort(d||Tc)}function f(){for(let h=t,d=i.length;h<d;h++){const _=i[h];if(_.id===null)break;_.id=null,_.object=null,_.geometry=null,_.material=null,_.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:c,unshift:l,finish:f,sort:u}}function B_(){let i=new WeakMap;function t(n,s){const r=i.get(n);let a;return r===void 0?(a=new Ac,i.set(n,[a])):s>=r.length?(a=new Ac,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function z_(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new L,color:new jt};break;case"SpotLight":e={position:new L,direction:new L,color:new jt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new L,color:new jt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new L,skyColor:new jt,groundColor:new jt};break;case"RectAreaLight":e={color:new jt,position:new L,halfWidth:new L,halfHeight:new L};break}return i[t.id]=e,e}}}function k_(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new at};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new at};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new at,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let H_=0;function G_(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function V_(i){const t=new z_,e=k_(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new L);const s=new L,r=new _e,a=new _e;function o(l){let u=0,f=0,h=0;for(let G=0;G<9;G++)n.probe[G].set(0,0,0);let d=0,_=0,S=0,m=0,p=0,y=0,w=0,M=0,b=0,T=0,R=0,v=0,A=0,P=0;l.sort(G_);for(let G=0,X=l.length;G<X;G++){const F=l[G],B=F.color,J=F.intensity,V=F.distance;let rt=null;if(F.shadow&&F.shadow.map&&(F.shadow.map.texture.format===hi?rt=F.shadow.map.texture:rt=F.shadow.map.depthTexture||F.shadow.map.texture),F.isAmbientLight)u+=B.r*J,f+=B.g*J,h+=B.b*J;else if(F.isLightProbe){for(let $=0;$<9;$++)n.probe[$].addScaledVector(F.sh.coefficients[$],J);P++}else if(F.isSunLight){const $=t.get(F);if($.color.copy(F.color).multiplyScalar(F.intensity),F.castShadow){const tt=F.shadow,it=e.get(F);it.shadowIntensity=tt.intensity,it.shadowBias=tt.bias,it.shadowNormalBias=tt.normalBias,it.shadowRadius=tt.radius,it.shadowMapSize.copy(tt.mapSize).multiply(tt.getFrameExtents()),n.sunShadow[_]=it,n.sunShadowMap[_]=rt;const Lt=tt.getViewportCount();for(let At=0;At<Lt;At++)n.sunShadowMatrix[S+At]=tt.getMatrix(At),n.sunShadowCascade[S+At]=tt._cascadeData[At];S+=Lt,_++}n.sun[d]=$,d++}else if(F.isDirectionalLight){const $=t.get(F);if($.color.copy(F.color).multiplyScalar(F.intensity),F.castShadow){const tt=F.shadow,it=e.get(F);it.shadowIntensity=tt.intensity,it.shadowBias=tt.bias,it.shadowNormalBias=tt.normalBias,it.shadowRadius=tt.radius,it.shadowMapSize=tt.mapSize,n.directionalShadow[m]=it,n.directionalShadowMap[m]=rt,n.directionalShadowMatrix[m]=F.shadow.matrix,b++}n.directional[m]=$,m++}else if(F.isSpotLight){const $=t.get(F);$.position.setFromMatrixPosition(F.matrixWorld),$.color.copy(B).multiplyScalar(J),$.distance=V,$.coneCos=Math.cos(F.angle),$.penumbraCos=Math.cos(F.angle*(1-F.penumbra)),$.decay=F.decay,n.spot[y]=$;const tt=F.shadow;if(F.map&&(n.spotLightMap[v]=F.map,v++,tt.updateMatrices(F),F.castShadow&&A++),n.spotLightMatrix[y]=tt.matrix,F.castShadow){const it=e.get(F);it.shadowIntensity=tt.intensity,it.shadowBias=tt.bias,it.shadowNormalBias=tt.normalBias,it.shadowRadius=tt.radius,it.shadowMapSize=tt.mapSize,n.spotShadow[y]=it,n.spotShadowMap[y]=rt,R++}y++}else if(F.isRectAreaLight){const $=t.get(F);$.color.copy(B).multiplyScalar(J),$.halfWidth.set(F.width*.5,0,0),$.halfHeight.set(0,F.height*.5,0),n.rectArea[w]=$,w++}else if(F.isPointLight){const $=t.get(F);if($.color.copy(F.color).multiplyScalar(F.intensity),$.distance=F.distance,$.decay=F.decay,F.castShadow){const tt=F.shadow,it=e.get(F);it.shadowIntensity=tt.intensity,it.shadowBias=tt.bias,it.shadowNormalBias=tt.normalBias,it.shadowRadius=tt.radius,it.shadowMapSize=tt.mapSize,it.shadowCameraNear=tt.camera.near,it.shadowCameraFar=tt.camera.far,n.pointShadow[p]=it,n.pointShadowMap[p]=rt,n.pointShadowMatrix[p]=F.shadow.matrix,T++}n.point[p]=$,p++}else if(F.isHemisphereLight){const $=t.get(F);$.skyColor.copy(F.color).multiplyScalar(J),$.groundColor.copy(F.groundColor).multiplyScalar(J),n.hemi[M]=$,M++}}w>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=vt.LTC_FLOAT_1,n.rectAreaLTC2=vt.LTC_FLOAT_2):(n.rectAreaLTC1=vt.LTC_HALF_1,n.rectAreaLTC2=vt.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=f,n.ambient[2]=h;const U=n.hash;(U.sunLength!==d||U.directionalLength!==m||U.pointLength!==p||U.spotLength!==y||U.rectAreaLength!==w||U.hemiLength!==M||U.numSunShadows!==_||U.numDirectionalShadows!==b||U.numPointShadows!==T||U.numSpotShadows!==R||U.numSpotMaps!==v||U.numLightProbes!==P)&&(n.sun.length=d,n.directional.length=m,n.spot.length=y,n.rectArea.length=w,n.point.length=p,n.hemi.length=M,n.sunShadow.length=_,n.sunShadowMap.length=_,n.sunShadowMatrix.length=S,n.sunShadowCascade.length=S,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.directionalShadowMatrix.length=b,n.pointShadow.length=T,n.pointShadowMap.length=T,n.pointShadowMatrix.length=T,n.spotShadow.length=R,n.spotShadowMap.length=R,n.spotLightMatrix.length=R+v-A,n.spotLightMap.length=v,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=P,U.sunLength=d,U.directionalLength=m,U.pointLength=p,U.spotLength=y,U.rectAreaLength=w,U.hemiLength=M,U.numSunShadows=_,U.numDirectionalShadows=b,U.numPointShadows=T,U.numSpotShadows=R,U.numSpotMaps=v,U.numLightProbes=P,n.version=H_++)}function c(l,u){let f=0,h=0,d=0,_=0,S=0,m=0;const p=u.matrixWorldInverse;for(let y=0,w=l.length;y<w;y++){const M=l[y];if(M.isSunLight){const b=n.sun[f];b.direction.setFromMatrixPosition(M.matrixWorld),b.direction.transformDirection(p),f++}else if(M.isDirectionalLight){const b=n.directional[h];b.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(p),h++}else if(M.isSpotLight){const b=n.spot[_];b.position.setFromMatrixPosition(M.matrixWorld),b.position.applyMatrix4(p),b.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(p),_++}else if(M.isRectAreaLight){const b=n.rectArea[S];b.position.setFromMatrixPosition(M.matrixWorld),b.position.applyMatrix4(p),a.identity(),r.copy(M.matrixWorld),r.premultiply(p),a.extractRotation(r),b.halfWidth.set(M.width*.5,0,0),b.halfHeight.set(0,M.height*.5,0),b.halfWidth.applyMatrix4(a),b.halfHeight.applyMatrix4(a),S++}else if(M.isPointLight){const b=n.point[d];b.position.setFromMatrixPosition(M.matrixWorld),b.position.applyMatrix4(p),d++}else if(M.isHemisphereLight){const b=n.hemi[m];b.direction.setFromMatrixPosition(M.matrixWorld),b.direction.transformDirection(p),m++}}}return{setup:o,setupView:c,state:n}}function wc(i){const t=new V_(i),e=[],n=[],s=[];function r(h){f.camera=h,e.length=0,n.length=0,s.length=0}function a(h){e.push(h)}function o(h){n.push(h)}function c(h){s.push(h)}function l(){t.setup(e)}function u(h){t.setupView(e,h)}const f={lightsArray:e,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:f,setupLights:l,setupLightsView:u,pushLight:a,pushShadow:o,pushLightProbeGrid:c}}function W_(i){let t=new WeakMap;function e(s,r=0){const a=t.get(s);let o;return a===void 0?(o=new wc(i),t.set(s,[o])):r>=a.length?(o=new wc(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}const X_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,$_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Y_=[new L(1,0,0),new L(-1,0,0),new L(0,1,0),new L(0,-1,0),new L(0,0,1),new L(0,0,-1)],q_=[new L(0,-1,0),new L(0,-1,0),new L(0,0,1),new L(0,0,-1),new L(0,-1,0),new L(0,-1,0)],Rc=new _e,rs=new L,Da=new L;function Z_(i,t,e){let n=new rh;const s=new at,r=new at,a=new Me,o=new sf,c=new rf,l={},u=e.maxTextureSize,f={[li]:Ve,[Ve]:li,[Je]:Je},h=new bn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new at},radius:{value:4}},vertexShader:X_,fragmentShader:$_}),d=h.clone();d.defines.HORIZONTAL_PASS=1;const _=new Pe;_.setAttribute("position",new Sn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const S=new tn(_,h),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Sr;let p=this.type;this.render=function(T,R,v){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||T.length===0)return;this.type===au&&(zt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Sr);const A=i.getRenderTarget(),P=i.getActiveCubeFace(),U=i.getActiveMipmapLevel(),G=i.state;G.setBlending(Fn),G.buffers.depth.getReversed()===!0?G.buffers.color.setClear(0,0,0,0):G.buffers.color.setClear(1,1,1,1),G.buffers.depth.setTest(!0),G.setScissorTest(!1);const X=p!==this.type;X&&R.traverse(function(F){F.material&&(Array.isArray(F.material)?F.material.forEach(B=>B.needsUpdate=!0):F.material.needsUpdate=!0)});for(let F=0,B=T.length;F<B;F++){const J=T[F],V=J.shadow;if(V===void 0){zt("WebGLShadowMap:",J,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;s.copy(V.mapSize);const rt=V.getFrameExtents();s.multiply(rt),r.copy(V.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/rt.x),s.x=r.x*rt.x,V.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/rt.y),s.y=r.y*rt.y,V.mapSize.y=r.y));const $=i.state.buffers.depth.getReversed();if(V.camera._reversedDepth=$,V.map===null||X===!0){if(V.map!==null&&(V.map.depthTexture!==null&&(V.map.depthTexture.dispose(),V.map.depthTexture=null),V.map.dispose()),this.type===os){if(J.isPointLight){zt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}V.map=new cn(s.x,s.y,{format:hi,type:yn,minFilter:Fe,magFilter:Fe,generateMipmaps:!1}),V.map.texture.name=J.name+".shadowMap",V.map.depthTexture=new Ms(s.x,s.y,_n),V.map.depthTexture.name=J.name+".shadowMapDepth",V.map.depthTexture.format=zn,V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=Le,V.map.depthTexture.magFilter=Le}else J.isPointLight?(V.map=new yh(s.x),V.map.depthTexture=new gd(s.x,Mn)):(V.map=new cn(s.x,s.y),V.map.depthTexture=new Ms(s.x,s.y,Mn)),V.map.depthTexture.name=J.name+".shadowMap",V.map.depthTexture.format=zn,this.type===Sr?(V.map.depthTexture.compareFunction=$?Go:Ho,V.map.depthTexture.minFilter=Fe,V.map.depthTexture.magFilter=Fe):(V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=Le,V.map.depthTexture.magFilter=Le);V.camera.updateProjectionMatrix()}V.map.isWebGLCubeRenderTarget!==!0&&(V.map.width!==s.x||V.map.height!==s.y)&&V.map.setSize(s.x,s.y);const tt=V.map.isWebGLCubeRenderTarget?6:V.getViewportCount();J.isPointLight!==!0&&V.updateMatrices(J,v);for(let it=0;it<tt;it++){const Lt=V.getCamera(it);if(J.isPointLight){const At=V.camera,ne=V.matrix,qt=J.distance||At.far;qt!==At.far&&(At.far=qt,At.updateProjectionMatrix()),rs.setFromMatrixPosition(J.matrixWorld),At.position.copy(rs),Da.copy(At.position),Da.add(Y_[it]),At.up.copy(q_[it]),At.lookAt(Da),At.updateMatrixWorld(),ne.makeTranslation(-rs.x,-rs.y,-rs.z),Rc.multiplyMatrices(At.projectionMatrix,At.matrixWorldInverse),V._frustum.setFromProjectionMatrix(Rc,At.coordinateSystem,At.reversedDepth)}if(V.map.isWebGLCubeRenderTarget)i.setRenderTarget(V.map,it),i.clear();else{it===0&&(i.setRenderTarget(V.map),i.clear());const At=V.getViewport(it);a.set(r.x*At.x,r.y*At.y,r.x*At.z,r.y*At.w),G.viewport(a)}n=V.getFrustum(it),M(R,v,Lt,J,this.type)}V.isPointLightShadow!==!0&&this.type===os&&y(V,v),V.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(A,P,U)};function y(T,R){const v=t.update(S);h.defines.VSM_SAMPLES!==T.blurSamples&&(h.defines.VSM_SAMPLES=T.blurSamples,d.defines.VSM_SAMPLES=T.blurSamples,h.needsUpdate=!0,d.needsUpdate=!0),T.mapPass===null?T.mapPass=new cn(s.x,s.y,{format:hi,type:yn}):(T.mapPass.width!==T.map.width||T.mapPass.height!==T.map.height)&&T.mapPass.setSize(T.map.width,T.map.height),h.uniforms.shadow_pass.value=T.map.depthTexture,h.uniforms.resolution.value.set(T.map.width,T.map.height),h.uniforms.radius.value=T.radius,i.setRenderTarget(T.mapPass),i.clear(),i.renderBufferDirect(R,null,v,h,S,null),d.uniforms.shadow_pass.value=T.mapPass.texture,d.uniforms.resolution.value.set(T.map.width,T.map.height),d.uniforms.radius.value=T.radius,i.setRenderTarget(T.map),i.clear(),i.renderBufferDirect(R,null,v,d,S,null)}function w(T,R,v,A){let P=null;const U=v.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(U!==void 0)P=U;else if(P=v.isPointLight===!0?c:o,i.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){const G=P.uuid,X=R.uuid;let F=l[G];F===void 0&&(F={},l[G]=F);let B=F[X];B===void 0&&(B=P.clone(),F[X]=B,R.addEventListener("dispose",b)),P=B}if(P.visible=R.visible,P.wireframe=R.wireframe,A===os?P.side=R.shadowSide!==null?R.shadowSide:R.side:P.side=R.shadowSide!==null?R.shadowSide:f[R.side],P.alphaMap=R.alphaMap,P.alphaTest=R.alphaToCoverage===!0?.5:R.alphaTest,P.map=R.map,P.clipShadows=R.clipShadows,P.clippingPlanes=R.clippingPlanes,P.clipIntersection=R.clipIntersection,P.displacementMap=R.displacementMap,P.displacementScale=R.displacementScale,P.displacementBias=R.displacementBias,P.wireframeLinewidth=R.wireframeLinewidth,P.linewidth=R.linewidth,v.isPointLight===!0&&P.isMeshDistanceMaterial===!0){const G=i.properties.get(P);G.light=v}return P}function M(T,R,v,A,P){if(T.visible===!1)return;if(T.layers.test(R.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&P===os)&&(!T.frustumCulled||T.intersectsFrustum(n))){T.modelViewMatrix.multiplyMatrices(v.matrixWorldInverse,T.matrixWorld);const X=t.update(T),F=T.material;if(Array.isArray(F)){const B=X.groups;for(let J=0,V=B.length;J<V;J++){const rt=B[J],$=F[rt.materialIndex];if($&&$.visible){const tt=w(T,$,A,P);T.onBeforeShadow(i,T,R,v,X,tt,rt),i.renderBufferDirect(v,null,X,tt,T,rt),T.onAfterShadow(i,T,R,v,X,tt,rt)}}}else if(F.visible){const B=w(T,F,A,P);T.onBeforeShadow(i,T,R,v,X,B,null),i.renderBufferDirect(v,null,X,B,T,null),T.onAfterShadow(i,T,R,v,X,B,null)}}const G=T.children;for(let X=0,F=G.length;X<F;X++)M(G[X],R,v,A,P)}function b(T){T.target.removeEventListener("dispose",b);for(const v in l){const A=l[v],P=T.target.uuid;P in A&&(A[P].dispose(),delete A[P])}}}function K_(i,t){function e(){let N=!1;const mt=new Me;let Q=null;const gt=new Me(0,0,0,0);return{setMask:function(yt){Q!==yt&&!N&&(i.colorMask(yt,yt,yt,yt),Q=yt)},setLocked:function(yt){N=yt},setClear:function(yt,st,Nt,Ct,pe){pe===!0&&(yt*=Ct,st*=Ct,Nt*=Ct),mt.set(yt,st,Nt,Ct),gt.equals(mt)===!1&&(i.clearColor(yt,st,Nt,Ct),gt.copy(mt))},reset:function(){N=!1,Q=null,gt.set(-1,0,0,0)}}}function n(){let N=!1,mt=!1,Q=null,gt=null,yt=null;return{setReversed:function(st){if(mt!==st){const Nt=t.get("EXT_clip_control");st?Nt.clipControlEXT(Nt.LOWER_LEFT_EXT,Nt.ZERO_TO_ONE_EXT):Nt.clipControlEXT(Nt.LOWER_LEFT_EXT,Nt.NEGATIVE_ONE_TO_ONE_EXT),mt=st;const Ct=yt;yt=null,this.setClear(Ct)}},getReversed:function(){return mt},setTest:function(st){st?et(i.DEPTH_TEST):xt(i.DEPTH_TEST)},setMask:function(st){Q!==st&&!N&&(i.depthMask(st),Q=st)},setFunc:function(st){if(mt&&(st=ku[st]),gt!==st){switch(st){case Fa:i.depthFunc(i.NEVER);break;case Oa:i.depthFunc(i.ALWAYS);break;case Ba:i.depthFunc(i.LESS);break;case vs:i.depthFunc(i.LEQUAL);break;case za:i.depthFunc(i.EQUAL);break;case ka:i.depthFunc(i.GEQUAL);break;case Ha:i.depthFunc(i.GREATER);break;case Ga:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}gt=st}},setLocked:function(st){N=st},setClear:function(st){yt!==st&&(yt=st,mt&&(st=1-st),i.clearDepth(st))},reset:function(){N=!1,Q=null,gt=null,yt=null,mt=!1}}}function s(){let N=!1,mt=null,Q=null,gt=null,yt=null,st=null,Nt=null,Ct=null,pe=null;return{setTest:function(re){N||(re?et(i.STENCIL_TEST):xt(i.STENCIL_TEST))},setMask:function(re){mt!==re&&!N&&(i.stencilMask(re),mt=re)},setFunc:function(re,nn,hn){(Q!==re||gt!==nn||yt!==hn)&&(i.stencilFunc(re,nn,hn),Q=re,gt=nn,yt=hn)},setOp:function(re,nn,hn){(st!==re||Nt!==nn||Ct!==hn)&&(i.stencilOp(re,nn,hn),st=re,Nt=nn,Ct=hn)},setLocked:function(re){N=re},setClear:function(re){pe!==re&&(i.clearStencil(re),pe=re)},reset:function(){N=!1,mt=null,Q=null,gt=null,yt=null,st=null,Nt=null,Ct=null,pe=null}}}const r=new e,a=new n,o=new s,c=new WeakMap,l=new WeakMap;let u={},f={},h={},d=new WeakMap,_=[],S=null,m=!1,p=null,y=null,w=null,M=null,b=null,T=null,R=null,v=new jt(0,0,0),A=0,P=!1,U=null,G=null,X=null,F=null,B=null;const J=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let V=!1,rt=0;const $=i.getParameter(i.VERSION);$.indexOf("WebGL")!==-1?(rt=parseFloat(/^WebGL (\d)/.exec($)[1]),V=rt>=1):$.indexOf("OpenGL ES")!==-1&&(rt=parseFloat(/^OpenGL ES (\d)/.exec($)[1]),V=rt>=2);let tt=null,it={};const Lt=i.getParameter(i.SCISSOR_BOX),At=i.getParameter(i.VIEWPORT),ne=new Me().fromArray(Lt),qt=new Me().fromArray(At);function te(N,mt,Q,gt){const yt=new Uint8Array(4),st=i.createTexture();i.bindTexture(N,st),i.texParameteri(N,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(N,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Nt=0;Nt<Q;Nt++)N===i.TEXTURE_3D||N===i.TEXTURE_2D_ARRAY?i.texImage3D(mt,0,i.RGBA,1,1,gt,0,i.RGBA,i.UNSIGNED_BYTE,yt):i.texImage2D(mt+Nt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,yt);return st}const K={};K[i.TEXTURE_2D]=te(i.TEXTURE_2D,i.TEXTURE_2D,1),K[i.TEXTURE_CUBE_MAP]=te(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),K[i.TEXTURE_2D_ARRAY]=te(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),K[i.TEXTURE_3D]=te(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),et(i.DEPTH_TEST),a.setFunc(vs),ct(!1),dt(gl),et(i.CULL_FACE),ot(Fn);function et(N){u[N]!==!0&&(i.enable(N),u[N]=!0)}function xt(N){u[N]!==!1&&(i.disable(N),u[N]=!1)}function Bt(N,mt){return h[N]!==mt?(i.bindFramebuffer(N,mt),h[N]=mt,N===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=mt),N===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=mt),!0):!1}function bt(N,mt){let Q=_,gt=!1;if(N){Q=d.get(mt),Q===void 0&&(Q=[],d.set(mt,Q));const yt=N.textures;if(Q.length!==yt.length||Q[0]!==i.COLOR_ATTACHMENT0){for(let st=0,Nt=yt.length;st<Nt;st++)Q[st]=i.COLOR_ATTACHMENT0+st;Q.length=yt.length,gt=!0}}else Q[0]!==i.BACK&&(Q[0]=i.BACK,gt=!0);gt&&i.drawBuffers(Q)}function kt(N){return S!==N?(i.useProgram(N),S=N,!0):!1}const oe={[Fi]:i.FUNC_ADD,[lu]:i.FUNC_SUBTRACT,[cu]:i.FUNC_REVERSE_SUBTRACT};oe[hu]=i.MIN,oe[uu]=i.MAX;const nt={[du]:i.ZERO,[fu]:i.ONE,[pu]:i.SRC_COLOR,[Ic]:i.SRC_ALPHA,[Su]:i.SRC_ALPHA_SATURATE,[vu]:i.DST_COLOR,[gu]:i.DST_ALPHA,[mu]:i.ONE_MINUS_SRC_COLOR,[Nc]:i.ONE_MINUS_SRC_ALPHA,[xu]:i.ONE_MINUS_DST_COLOR,[_u]:i.ONE_MINUS_DST_ALPHA,[Mu]:i.CONSTANT_COLOR,[yu]:i.ONE_MINUS_CONSTANT_COLOR,[bu]:i.CONSTANT_ALPHA,[Eu]:i.ONE_MINUS_CONSTANT_ALPHA};function ot(N,mt,Q,gt,yt,st,Nt,Ct,pe,re){if(N===Fn){m===!0&&(xt(i.BLEND),m=!1);return}if(m===!1&&(et(i.BLEND),m=!0),N!==ou){if(N!==p||re!==P){if((y!==Fi||b!==Fi)&&(i.blendEquation(i.FUNC_ADD),y=Fi,b=Fi),re)switch(N){case hs:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case _l:i.blendFunc(i.ONE,i.ONE);break;case vl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case xl:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Jt("WebGLState: Invalid blending: ",N);break}else switch(N){case hs:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case _l:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case vl:Jt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case xl:Jt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Jt("WebGLState: Invalid blending: ",N);break}w=null,M=null,T=null,R=null,v.set(0,0,0),A=0,p=N,P=re}return}yt=yt||mt,st=st||Q,Nt=Nt||gt,(mt!==y||yt!==b)&&(i.blendEquationSeparate(oe[mt],oe[yt]),y=mt,b=yt),(Q!==w||gt!==M||st!==T||Nt!==R)&&(i.blendFuncSeparate(nt[Q],nt[gt],nt[st],nt[Nt]),w=Q,M=gt,T=st,R=Nt),(Ct.equals(v)===!1||pe!==A)&&(i.blendColor(Ct.r,Ct.g,Ct.b,pe),v.copy(Ct),A=pe),p=N,P=!1}function lt(N,mt){N.side===Je?xt(i.CULL_FACE):et(i.CULL_FACE);let Q=N.side===Ve;mt&&(Q=!Q),ct(Q),N.blending===hs&&N.transparent===!1?ot(Fn):ot(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),a.setFunc(N.depthFunc),a.setTest(N.depthTest),a.setMask(N.depthWrite),r.setMask(N.colorWrite);const gt=N.stencilWrite;o.setTest(gt),gt&&(o.setMask(N.stencilWriteMask),o.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),o.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),Ut(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?et(i.SAMPLE_ALPHA_TO_COVERAGE):xt(i.SAMPLE_ALPHA_TO_COVERAGE)}function ct(N){U!==N&&(N?i.frontFace(i.CW):i.frontFace(i.CCW),U=N)}function dt(N){N!==su?(et(i.CULL_FACE),N!==G&&(N===gl?i.cullFace(i.BACK):N===ru?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):xt(i.CULL_FACE),G=N}function Ft(N){N!==X&&(V&&i.lineWidth(N),X=N)}function Ut(N,mt,Q){N?(et(i.POLYGON_OFFSET_FILL),(F!==mt||B!==Q)&&(F=mt,B=Q,a.getReversed()&&(mt=-mt),i.polygonOffset(mt,Q))):xt(i.POLYGON_OFFSET_FILL)}function Ht(N){N?et(i.SCISSOR_TEST):xt(i.SCISSOR_TEST)}function Gt(N){N===void 0&&(N=i.TEXTURE0+J-1),tt!==N&&(i.activeTexture(N),tt=N)}function C(N,mt,Q){Q===void 0&&(tt===null?Q=i.TEXTURE0+J-1:Q=tt);let gt=it[Q];gt===void 0&&(gt={type:void 0,texture:void 0},it[Q]=gt),(gt.type!==N||gt.texture!==mt)&&(tt!==Q&&(i.activeTexture(Q),tt=Q),i.bindTexture(N,mt||K[N]),gt.type=N,gt.texture=mt)}function se(){const N=it[tt];N!==void 0&&N.type!==void 0&&(i.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function Zt(){try{i.compressedTexImage2D(...arguments)}catch(N){Jt("WebGLState:",N)}}function E(){try{i.compressedTexImage3D(...arguments)}catch(N){Jt("WebGLState:",N)}}function g(){try{i.texSubImage2D(...arguments)}catch(N){Jt("WebGLState:",N)}}function O(){try{i.texSubImage3D(...arguments)}catch(N){Jt("WebGLState:",N)}}function H(){try{i.compressedTexSubImage2D(...arguments)}catch(N){Jt("WebGLState:",N)}}function Y(){try{i.compressedTexSubImage3D(...arguments)}catch(N){Jt("WebGLState:",N)}}function ht(){try{i.texStorage2D(...arguments)}catch(N){Jt("WebGLState:",N)}}function ut(){try{i.texStorage3D(...arguments)}catch(N){Jt("WebGLState:",N)}}function q(){try{i.texImage2D(...arguments)}catch(N){Jt("WebGLState:",N)}}function j(){try{i.texImage3D(...arguments)}catch(N){Jt("WebGLState:",N)}}function ft(N){return f[N]!==void 0?f[N]:i.getParameter(N)}function Dt(N,mt){f[N]!==mt&&(i.pixelStorei(N,mt),f[N]=mt)}function _t(N){ne.equals(N)===!1&&(i.scissor(N.x,N.y,N.z,N.w),ne.copy(N))}function pt(N){qt.equals(N)===!1&&(i.viewport(N.x,N.y,N.z,N.w),qt.copy(N))}function It(N,mt){let Q=l.get(mt);Q===void 0&&(Q=new WeakMap,l.set(mt,Q));let gt=Q.get(N);gt===void 0&&(gt=i.getUniformBlockIndex(mt,N.name),Q.set(N,gt))}function Ot(N,mt){const gt=l.get(mt).get(N);c.get(mt)!==gt&&(i.uniformBlockBinding(mt,gt,N.__bindingPointIndex),c.set(mt,gt))}function Wt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),u={},f={},tt=null,it={},h={},d=new WeakMap,_=[],S=null,m=!1,p=null,y=null,w=null,M=null,b=null,T=null,R=null,v=new jt(0,0,0),A=0,P=!1,U=null,G=null,X=null,F=null,B=null,ne.set(0,0,i.canvas.width,i.canvas.height),qt.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:et,disable:xt,bindFramebuffer:Bt,drawBuffers:bt,useProgram:kt,setBlending:ot,setMaterial:lt,setFlipSided:ct,setCullFace:dt,setLineWidth:Ft,setPolygonOffset:Ut,setScissorTest:Ht,activeTexture:Gt,bindTexture:C,unbindTexture:se,compressedTexImage2D:Zt,compressedTexImage3D:E,texImage2D:q,texImage3D:j,pixelStorei:Dt,getParameter:ft,updateUBOMapping:It,uniformBlockBinding:Ot,texStorage2D:ht,texStorage3D:ut,texSubImage2D:g,texSubImage3D:O,compressedTexSubImage2D:H,compressedTexSubImage3D:Y,scissor:_t,viewport:pt,reset:Wt}}function J_(i,t,e,n,s,r,a){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new at,u=new WeakMap,f=new Set;let h;const d=new WeakMap;let _=!1;try{_=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(E,g){return _?new OffscreenCanvas(E,g):Lr("canvas")}function m(E,g,O){let H=1;const Y=Zt(E);if((Y.width>O||Y.height>O)&&(H=O/Math.max(Y.width,Y.height)),H<1)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap||typeof VideoFrame<"u"&&E instanceof VideoFrame){const ht=Math.floor(H*Y.width),ut=Math.floor(H*Y.height);h===void 0&&(h=S(ht,ut));const q=g?S(ht,ut):h;return q.width=ht,q.height=ut,q.getContext("2d").drawImage(E,0,0,ht,ut),zt("WebGLRenderer: Texture has been resized from ("+Y.width+"x"+Y.height+") to ("+ht+"x"+ut+")."),q}else return"data"in E&&zt("WebGLRenderer: Image in DataTexture is too big ("+Y.width+"x"+Y.height+")."),E;return E}function p(E){return E.generateMipmaps}function y(E){i.generateMipmap(E)}function w(E){return E.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:E.isWebGL3DRenderTarget?i.TEXTURE_3D:E.isWebGLArrayRenderTarget||E.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function M(E,g,O,H,Y,ht=!1){if(E!==null){if(i[E]!==void 0)return i[E];zt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let ut;H&&(ut=t.get("EXT_texture_norm16"),ut||zt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let q=g;if(g===i.RED&&(O===i.FLOAT&&(q=i.R32F),O===i.HALF_FLOAT&&(q=i.R16F),O===i.UNSIGNED_BYTE&&(q=i.R8),O===i.UNSIGNED_SHORT&&ut&&(q=ut.R16_EXT),O===i.SHORT&&ut&&(q=ut.R16_SNORM_EXT)),g===i.RED_INTEGER&&(O===i.UNSIGNED_BYTE&&(q=i.R8UI),O===i.UNSIGNED_SHORT&&(q=i.R16UI),O===i.UNSIGNED_INT&&(q=i.R32UI),O===i.BYTE&&(q=i.R8I),O===i.SHORT&&(q=i.R16I),O===i.INT&&(q=i.R32I)),g===i.RG&&(O===i.FLOAT&&(q=i.RG32F),O===i.HALF_FLOAT&&(q=i.RG16F),O===i.UNSIGNED_BYTE&&(q=i.RG8),O===i.UNSIGNED_SHORT&&ut&&(q=ut.RG16_EXT),O===i.SHORT&&ut&&(q=ut.RG16_SNORM_EXT)),g===i.RG_INTEGER&&(O===i.UNSIGNED_BYTE&&(q=i.RG8UI),O===i.UNSIGNED_SHORT&&(q=i.RG16UI),O===i.UNSIGNED_INT&&(q=i.RG32UI),O===i.BYTE&&(q=i.RG8I),O===i.SHORT&&(q=i.RG16I),O===i.INT&&(q=i.RG32I)),g===i.RGB_INTEGER&&(O===i.UNSIGNED_BYTE&&(q=i.RGB8UI),O===i.UNSIGNED_SHORT&&(q=i.RGB16UI),O===i.UNSIGNED_INT&&(q=i.RGB32UI),O===i.BYTE&&(q=i.RGB8I),O===i.SHORT&&(q=i.RGB16I),O===i.INT&&(q=i.RGB32I)),g===i.RGBA_INTEGER&&(O===i.UNSIGNED_BYTE&&(q=i.RGBA8UI),O===i.UNSIGNED_SHORT&&(q=i.RGBA16UI),O===i.UNSIGNED_INT&&(q=i.RGBA32UI),O===i.BYTE&&(q=i.RGBA8I),O===i.SHORT&&(q=i.RGBA16I),O===i.INT&&(q=i.RGBA32I)),g===i.RGB&&(O===i.UNSIGNED_SHORT&&ut&&(q=ut.RGB16_EXT),O===i.SHORT&&ut&&(q=ut.RGB16_SNORM_EXT),O===i.UNSIGNED_INT_5_9_9_9_REV&&(q=i.RGB9_E5),O===i.UNSIGNED_INT_10F_11F_11F_REV&&(q=i.R11F_G11F_B10F)),g===i.RGBA){const j=ht?Cr:Qt.getTransfer(Y);O===i.FLOAT&&(q=i.RGBA32F),O===i.HALF_FLOAT&&(q=i.RGBA16F),O===i.UNSIGNED_BYTE&&(q=j===le?i.SRGB8_ALPHA8:i.RGBA8),O===i.UNSIGNED_SHORT&&ut&&(q=ut.RGBA16_EXT),O===i.SHORT&&ut&&(q=ut.RGBA16_SNORM_EXT),O===i.UNSIGNED_SHORT_4_4_4_4&&(q=i.RGBA4),O===i.UNSIGNED_SHORT_5_5_5_1&&(q=i.RGB5_A1)}return(q===i.R16F||q===i.R32F||q===i.RG16F||q===i.RG32F||q===i.RGBA16F||q===i.RGBA32F)&&t.get("EXT_color_buffer_float"),q}function b(E,g){let O;return E?g===null||g===Mn||g===Ss?O=i.DEPTH24_STENCIL8:g===_n?O=i.DEPTH32F_STENCIL8:g===xs&&(O=i.DEPTH24_STENCIL8,zt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):g===null||g===Mn||g===Ss?O=i.DEPTH_COMPONENT24:g===_n?O=i.DEPTH_COMPONENT32F:g===xs&&(O=i.DEPTH_COMPONENT16),O}function T(E,g){return p(E)===!0||E.isFramebufferTexture&&E.minFilter!==Le&&E.minFilter!==Fe?Math.log2(Math.max(g.width,g.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?g.mipmaps.length:1}function R(E){const g=E.target;g.removeEventListener("dispose",R),A(g),g.isVideoTexture&&u.delete(g),g.isHTMLTexture&&f.delete(g)}function v(E){const g=E.target;g.removeEventListener("dispose",v),U(g)}function A(E){const g=n.get(E);if(g.__webglInit===void 0)return;const O=E.source,H=d.get(O);if(H){const Y=H[g.__cacheKey];Y.usedTimes--,Y.usedTimes===0&&P(E),Object.keys(H).length===0&&d.delete(O)}n.remove(E)}function P(E){const g=n.get(E);i.deleteTexture(g.__webglTexture);const O=E.source,H=d.get(O);delete H[g.__cacheKey],a.memory.textures--}function U(E){const g=n.get(E);if(E.depthTexture&&(E.depthTexture.dispose(),n.remove(E.depthTexture)),E.isWebGLCubeRenderTarget)for(let H=0;H<6;H++){if(Array.isArray(g.__webglFramebuffer[H]))for(let Y=0;Y<g.__webglFramebuffer[H].length;Y++)i.deleteFramebuffer(g.__webglFramebuffer[H][Y]);else i.deleteFramebuffer(g.__webglFramebuffer[H]);g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer[H])}else{if(Array.isArray(g.__webglFramebuffer))for(let H=0;H<g.__webglFramebuffer.length;H++)i.deleteFramebuffer(g.__webglFramebuffer[H]);else i.deleteFramebuffer(g.__webglFramebuffer);if(g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer),g.__webglMultisampledFramebuffer&&i.deleteFramebuffer(g.__webglMultisampledFramebuffer),g.__webglColorRenderbuffer)for(let H=0;H<g.__webglColorRenderbuffer.length;H++)g.__webglColorRenderbuffer[H]&&i.deleteRenderbuffer(g.__webglColorRenderbuffer[H]);g.__webglDepthRenderbuffer&&i.deleteRenderbuffer(g.__webglDepthRenderbuffer)}const O=E.textures;for(let H=0,Y=O.length;H<Y;H++){const ht=n.get(O[H]);ht.__webglTexture&&(i.deleteTexture(ht.__webglTexture),a.memory.textures--),n.remove(O[H])}n.remove(E)}let G=0;function X(){G=0}function F(){return G}function B(E){G=E}function J(){const E=G;return E>=s.maxTextures&&zt("WebGLTextures: Trying to use "+(E+1)+" texture units while this GPU supports only "+s.maxTextures),G+=1,E}function V(E){const g=[];return g.push(E.wrapS),g.push(E.wrapT),g.push(E.wrapR||0),g.push(E.magFilter),g.push(E.minFilter),g.push(E.anisotropy),g.push(E.internalFormat),g.push(E.format),g.push(E.type),g.push(E.generateMipmaps),g.push(E.premultiplyAlpha),g.push(E.flipY),g.push(E.unpackAlignment),g.push(E.colorSpace),g.join()}function rt(E,g){const O=n.get(E);if(E.isVideoTexture&&C(E),E.isRenderTargetTexture===!1&&E.isExternalTexture!==!0&&E.version>0&&O.__version!==E.version){const H=E.image;if(H===null)zt("WebGLRenderer: Texture marked for update but no image data found.");else if(H.complete===!1)zt("WebGLRenderer: Texture marked for update but image is incomplete");else{xt(O,E,g);return}}else E.isExternalTexture&&(O.__webglTexture=E.sourceTexture?E.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,O.__webglTexture,i.TEXTURE0+g)}function $(E,g){const O=n.get(E);if(E.isRenderTargetTexture===!1&&E.version>0&&O.__version!==E.version){xt(O,E,g);return}else E.isExternalTexture&&(O.__webglTexture=E.sourceTexture?E.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,O.__webglTexture,i.TEXTURE0+g)}function tt(E,g){const O=n.get(E);if(E.isRenderTargetTexture===!1&&E.version>0&&O.__version!==E.version){xt(O,E,g);return}e.bindTexture(i.TEXTURE_3D,O.__webglTexture,i.TEXTURE0+g)}function it(E,g){const O=n.get(E);if(E.isCubeDepthTexture!==!0&&E.version>0&&O.__version!==E.version){Bt(O,E,g);return}e.bindTexture(i.TEXTURE_CUBE_MAP,O.__webglTexture,i.TEXTURE0+g)}const Lt={[Va]:i.REPEAT,[In]:i.CLAMP_TO_EDGE,[Wa]:i.MIRRORED_REPEAT},At={[Le]:i.NEAREST,[wu]:i.NEAREST_MIPMAP_NEAREST,[Os]:i.NEAREST_MIPMAP_LINEAR,[Fe]:i.LINEAR,[Qr]:i.LINEAR_MIPMAP_NEAREST,[ai]:i.LINEAR_MIPMAP_LINEAR},ne={[Lu]:i.NEVER,[Fu]:i.ALWAYS,[Du]:i.LESS,[Ho]:i.LEQUAL,[Iu]:i.EQUAL,[Go]:i.GEQUAL,[Nu]:i.GREATER,[Uu]:i.NOTEQUAL};function qt(E,g){if(g.type===_n&&t.has("OES_texture_float_linear")===!1&&(g.magFilter===Fe||g.magFilter===Qr||g.magFilter===Os||g.magFilter===ai||g.minFilter===Fe||g.minFilter===Qr||g.minFilter===Os||g.minFilter===ai)&&zt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(E,i.TEXTURE_WRAP_S,Lt[g.wrapS]),i.texParameteri(E,i.TEXTURE_WRAP_T,Lt[g.wrapT]),(E===i.TEXTURE_3D||E===i.TEXTURE_2D_ARRAY)&&i.texParameteri(E,i.TEXTURE_WRAP_R,Lt[g.wrapR]),i.texParameteri(E,i.TEXTURE_MAG_FILTER,At[g.magFilter]),i.texParameteri(E,i.TEXTURE_MIN_FILTER,At[g.minFilter]),g.compareFunction&&(i.texParameteri(E,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(E,i.TEXTURE_COMPARE_FUNC,ne[g.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(g.magFilter===Le||g.minFilter!==Os&&g.minFilter!==ai||g.type===_n&&t.has("OES_texture_float_linear")===!1)return;if(g.anisotropy>1||n.get(g).__currentAnisotropy){const O=t.get("EXT_texture_filter_anisotropic");i.texParameterf(E,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(g.anisotropy,s.getMaxAnisotropy())),n.get(g).__currentAnisotropy=g.anisotropy}}}function te(E,g){let O=!1;E.__webglInit===void 0&&(E.__webglInit=!0,g.addEventListener("dispose",R));const H=g.source;let Y=d.get(H);Y===void 0&&(Y={},d.set(H,Y));const ht=V(g);if(ht!==E.__cacheKey){Y[ht]===void 0&&(Y[ht]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,O=!0),Y[ht].usedTimes++;const ut=Y[E.__cacheKey];ut!==void 0&&(Y[E.__cacheKey].usedTimes--,ut.usedTimes===0&&P(g)),E.__cacheKey=ht,E.__webglTexture=Y[ht].texture}return O}function K(E,g,O){return Math.floor(Math.floor(E/O)/g)}function et(E,g,O,H){const ht=E.updateRanges;if(ht.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,g.width,g.height,O,H,g.data);else{ht.sort((Dt,_t)=>Dt.start-_t.start);let ut=0;for(let Dt=1;Dt<ht.length;Dt++){const _t=ht[ut],pt=ht[Dt],It=_t.start+_t.count,Ot=K(pt.start,g.width,4),Wt=K(_t.start,g.width,4);pt.start<=It+1&&Ot===Wt&&K(pt.start+pt.count-1,g.width,4)===Ot?_t.count=Math.max(_t.count,pt.start+pt.count-_t.start):(++ut,ht[ut]=pt)}ht.length=ut+1;const q=e.getParameter(i.UNPACK_ROW_LENGTH),j=e.getParameter(i.UNPACK_SKIP_PIXELS),ft=e.getParameter(i.UNPACK_SKIP_ROWS);e.pixelStorei(i.UNPACK_ROW_LENGTH,g.width);for(let Dt=0,_t=ht.length;Dt<_t;Dt++){const pt=ht[Dt],It=Math.floor(pt.start/4),Ot=Math.ceil(pt.count/4),Wt=It%g.width,N=Math.floor(It/g.width),mt=Ot,Q=1;e.pixelStorei(i.UNPACK_SKIP_PIXELS,Wt),e.pixelStorei(i.UNPACK_SKIP_ROWS,N),e.texSubImage2D(i.TEXTURE_2D,0,Wt,N,mt,Q,O,H,g.data)}E.clearUpdateRanges(),e.pixelStorei(i.UNPACK_ROW_LENGTH,q),e.pixelStorei(i.UNPACK_SKIP_PIXELS,j),e.pixelStorei(i.UNPACK_SKIP_ROWS,ft)}}function xt(E,g,O){let H=i.TEXTURE_2D;(g.isDataArrayTexture||g.isCompressedArrayTexture)&&(H=i.TEXTURE_2D_ARRAY),g.isData3DTexture&&(H=i.TEXTURE_3D);const Y=te(E,g),ht=g.source;e.bindTexture(H,E.__webglTexture,i.TEXTURE0+O);const ut=n.get(ht);if(ht.version!==ut.__version||Y===!0){if(e.activeTexture(i.TEXTURE0+O),(typeof ImageBitmap<"u"&&g.image instanceof ImageBitmap)===!1){const Q=Qt.getPrimaries(Qt.workingColorSpace),gt=g.colorSpace===qn?null:Qt.getPrimaries(g.colorSpace),yt=g.colorSpace===qn||Q===gt?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,yt)}e.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment);let j=m(g.image,!1,s.maxTextureSize);j=se(g,j);const ft=r.convert(g.format,g.colorSpace),Dt=r.convert(g.type);let _t=M(g.internalFormat,ft,Dt,g.normalized,g.colorSpace,g.isVideoTexture);qt(H,g);let pt;const It=g.mipmaps,Ot=g.isVideoTexture!==!0,Wt=ut.__version===void 0||Y===!0,N=ht.dataReady,mt=T(g,j);if(g.isDepthTexture)_t=b(g.format===oi,g.type),Wt&&(Ot?e.texStorage2D(i.TEXTURE_2D,1,_t,j.width,j.height):e.texImage2D(i.TEXTURE_2D,0,_t,j.width,j.height,0,ft,Dt,null));else if(g.isDataTexture)if(It.length>0){Ot&&Wt&&e.texStorage2D(i.TEXTURE_2D,mt,_t,It[0].width,It[0].height);for(let Q=0,gt=It.length;Q<gt;Q++)pt=It[Q],Ot?N&&e.texSubImage2D(i.TEXTURE_2D,Q,0,0,pt.width,pt.height,ft,Dt,pt.data):e.texImage2D(i.TEXTURE_2D,Q,_t,pt.width,pt.height,0,ft,Dt,pt.data);g.generateMipmaps=!1}else Ot?(Wt&&e.texStorage2D(i.TEXTURE_2D,mt,_t,j.width,j.height),N&&et(g,j,ft,Dt)):e.texImage2D(i.TEXTURE_2D,0,_t,j.width,j.height,0,ft,Dt,j.data);else if(g.isCompressedTexture)if(g.isCompressedArrayTexture){Ot&&Wt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,mt,_t,It[0].width,It[0].height,j.depth);for(let Q=0,gt=It.length;Q<gt;Q++)if(pt=It[Q],g.format!==ln)if(ft!==null)if(Ot){if(N)if(g.layerUpdates.size>0){const yt=ac(pt.width,pt.height,g.format,g.type);for(const st of g.layerUpdates){const Nt=pt.data.subarray(st*yt/pt.data.BYTES_PER_ELEMENT,(st+1)*yt/pt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Q,0,0,st,pt.width,pt.height,1,ft,Nt)}}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Q,0,0,0,pt.width,pt.height,j.depth,ft,pt.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,Q,_t,pt.width,pt.height,j.depth,0,pt.data,0,0);else zt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ot?N&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,Q,0,0,0,pt.width,pt.height,j.depth,ft,Dt,pt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,Q,_t,pt.width,pt.height,j.depth,0,ft,Dt,pt.data);g.layerUpdates.size>0&&g.clearLayerUpdates()}else{Ot&&Wt&&e.texStorage2D(i.TEXTURE_2D,mt,_t,It[0].width,It[0].height);for(let Q=0,gt=It.length;Q<gt;Q++)pt=It[Q],g.format!==ln?ft!==null?Ot?N&&e.compressedTexSubImage2D(i.TEXTURE_2D,Q,0,0,pt.width,pt.height,ft,pt.data):e.compressedTexImage2D(i.TEXTURE_2D,Q,_t,pt.width,pt.height,0,pt.data):zt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ot?N&&e.texSubImage2D(i.TEXTURE_2D,Q,0,0,pt.width,pt.height,ft,Dt,pt.data):e.texImage2D(i.TEXTURE_2D,Q,_t,pt.width,pt.height,0,ft,Dt,pt.data)}else if(g.isDataArrayTexture)if(Ot){if(Wt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,mt,_t,j.width,j.height,j.depth),N)if(g.layerUpdates.size>0){const Q=ac(j.width,j.height,g.format,g.type);for(const gt of g.layerUpdates){const yt=j.data.subarray(gt*Q/j.data.BYTES_PER_ELEMENT,(gt+1)*Q/j.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,gt,j.width,j.height,1,ft,Dt,yt)}g.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,j.width,j.height,j.depth,ft,Dt,j.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,_t,j.width,j.height,j.depth,0,ft,Dt,j.data);else if(g.isData3DTexture)Ot?(Wt&&e.texStorage3D(i.TEXTURE_3D,mt,_t,j.width,j.height,j.depth),N&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,j.width,j.height,j.depth,ft,Dt,j.data)):e.texImage3D(i.TEXTURE_3D,0,_t,j.width,j.height,j.depth,0,ft,Dt,j.data);else if(g.isFramebufferTexture){if(Wt)if(Ot)e.texStorage2D(i.TEXTURE_2D,mt,_t,j.width,j.height);else{let Q=j.width,gt=j.height;for(let yt=0;yt<mt;yt++)e.texImage2D(i.TEXTURE_2D,yt,_t,Q,gt,0,ft,Dt,null),Q>>=1,gt>>=1}}else if(g.isHTMLTexture){if("texElementImage2D"in i){const Q=i.canvas;if(Q.hasAttribute("layoutsubtree")||Q.setAttribute("layoutsubtree","true"),j.parentNode!==Q){Q.appendChild(j),f.add(g),Q.onpaint=gt=>{const yt=gt.changedElements;for(const st of f)yt.includes(st.image)&&(st.needsUpdate=!0)},Q.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,j);else{const yt=i.RGBA,st=i.RGBA,Nt=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,yt,st,Nt,j)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(It.length>0){if(Ot&&Wt){const Q=Zt(It[0]);e.texStorage2D(i.TEXTURE_2D,mt,_t,Q.width,Q.height)}for(let Q=0,gt=It.length;Q<gt;Q++)pt=It[Q],Ot?N&&e.texSubImage2D(i.TEXTURE_2D,Q,0,0,ft,Dt,pt):e.texImage2D(i.TEXTURE_2D,Q,_t,ft,Dt,pt);g.generateMipmaps=!1}else if(Ot){if(Wt){const Q=Zt(j);e.texStorage2D(i.TEXTURE_2D,mt,_t,Q.width,Q.height)}N&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ft,Dt,j)}else e.texImage2D(i.TEXTURE_2D,0,_t,ft,Dt,j);p(g)&&y(H),ut.__version=ht.version,g.onUpdate&&g.onUpdate(g)}E.__version=g.version}function Bt(E,g,O){if(g.image.length!==6)return;const H=te(E,g),Y=g.source;e.bindTexture(i.TEXTURE_CUBE_MAP,E.__webglTexture,i.TEXTURE0+O);const ht=n.get(Y);if(Y.version!==ht.__version||H===!0){e.activeTexture(i.TEXTURE0+O);const ut=Qt.getPrimaries(Qt.workingColorSpace),q=g.colorSpace===qn?null:Qt.getPrimaries(g.colorSpace),j=g.colorSpace===qn||ut===q?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),e.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,j);const ft=g.isCompressedTexture||g.image[0].isCompressedTexture,Dt=g.image[0]&&g.image[0].isDataTexture,_t=[];for(let st=0;st<6;st++)!ft&&!Dt?_t[st]=m(g.image[st],!0,s.maxCubemapSize):_t[st]=Dt?g.image[st].image:g.image[st],_t[st]=se(g,_t[st]);const pt=_t[0],It=r.convert(g.format,g.colorSpace),Ot=r.convert(g.type),Wt=M(g.internalFormat,It,Ot,g.normalized,g.colorSpace),N=g.isVideoTexture!==!0,mt=ht.__version===void 0||H===!0,Q=Y.dataReady;let gt=T(g,pt);qt(i.TEXTURE_CUBE_MAP,g);let yt;if(ft){N&&mt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,gt,Wt,pt.width,pt.height);for(let st=0;st<6;st++){yt=_t[st].mipmaps;for(let Nt=0;Nt<yt.length;Nt++){const Ct=yt[Nt];g.format!==ln?It!==null?N?Q&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,Nt,0,0,Ct.width,Ct.height,It,Ct.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,Nt,Wt,Ct.width,Ct.height,0,Ct.data):zt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):N?Q&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,Nt,0,0,Ct.width,Ct.height,It,Ot,Ct.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,Nt,Wt,Ct.width,Ct.height,0,It,Ot,Ct.data)}}}else{if(yt=g.mipmaps,N&&mt){yt.length>0&&gt++;const st=Zt(_t[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,gt,Wt,st.width,st.height)}for(let st=0;st<6;st++)if(Dt){N?Q&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,0,0,0,_t[st].width,_t[st].height,It,Ot,_t[st].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,0,Wt,_t[st].width,_t[st].height,0,It,Ot,_t[st].data);for(let Nt=0;Nt<yt.length;Nt++){const pe=yt[Nt].image[st].image;N?Q&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,Nt+1,0,0,pe.width,pe.height,It,Ot,pe.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,Nt+1,Wt,pe.width,pe.height,0,It,Ot,pe.data)}}else{N?Q&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,0,0,0,It,Ot,_t[st]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,0,Wt,It,Ot,_t[st]);for(let Nt=0;Nt<yt.length;Nt++){const Ct=yt[Nt];N?Q&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,Nt+1,0,0,It,Ot,Ct.image[st]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,Nt+1,Wt,It,Ot,Ct.image[st])}}}p(g)&&y(i.TEXTURE_CUBE_MAP),ht.__version=Y.version,g.onUpdate&&g.onUpdate(g)}E.__version=g.version}function bt(E,g,O,H,Y,ht){const ut=r.convert(O.format,O.colorSpace),q=r.convert(O.type),j=M(O.internalFormat,ut,q,O.normalized,O.colorSpace),ft=n.get(g),Dt=n.get(O);if(Dt.__renderTarget=g,!ft.__hasExternalTextures){const _t=Math.max(1,g.width>>ht),pt=Math.max(1,g.height>>ht);Y===i.TEXTURE_3D||Y===i.TEXTURE_2D_ARRAY?e.texImage3D(Y,ht,j,_t,pt,g.depth,0,ut,q,null):e.texImage2D(Y,ht,j,_t,pt,0,ut,q,null)}e.bindFramebuffer(i.FRAMEBUFFER,E),Gt(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,H,Y,Dt.__webglTexture,0,Ht(g)):(Y===i.TEXTURE_2D||Y>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Y<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,H,Y,Dt.__webglTexture,ht),e.bindFramebuffer(i.FRAMEBUFFER,null)}function kt(E,g,O){if(i.bindRenderbuffer(i.RENDERBUFFER,E),g.depthBuffer){const H=g.depthTexture,Y=H&&H.isDepthTexture?H.type:null,ht=b(g.stencilBuffer,Y),ut=g.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;Gt(g)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Ht(g),ht,g.width,g.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,Ht(g),ht,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,ht,g.width,g.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,ut,i.RENDERBUFFER,E)}else{const H=g.textures;for(let Y=0;Y<H.length;Y++){const ht=H[Y],ut=r.convert(ht.format,ht.colorSpace),q=r.convert(ht.type),j=M(ht.internalFormat,ut,q,ht.normalized,ht.colorSpace);Gt(g)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Ht(g),j,g.width,g.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,Ht(g),j,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,j,g.width,g.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function oe(E,g,O){const H=g.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,E),!(g.depthTexture&&g.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const Y=n.get(g.depthTexture);if(Y.__renderTarget=g,(!Y.__webglTexture||g.depthTexture.image.width!==g.width||g.depthTexture.image.height!==g.height)&&(g.depthTexture.image.width=g.width,g.depthTexture.image.height=g.height,g.depthTexture.needsUpdate=!0),H){if(Y.__webglInit===void 0&&(Y.__webglInit=!0,g.depthTexture.addEventListener("dispose",R)),Y.__webglTexture===void 0){Y.__webglTexture=i.createTexture(),e.bindTexture(i.TEXTURE_CUBE_MAP,Y.__webglTexture),qt(i.TEXTURE_CUBE_MAP,g.depthTexture);const ft=r.convert(g.depthTexture.format),Dt=r.convert(g.depthTexture.type);let _t;g.depthTexture.format===zn?_t=i.DEPTH_COMPONENT24:g.depthTexture.format===oi&&(_t=i.DEPTH24_STENCIL8);for(let pt=0;pt<6;pt++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pt,0,_t,g.width,g.height,0,ft,Dt,null)}}else rt(g.depthTexture,0);const ht=Y.__webglTexture,ut=Ht(g),q=H?i.TEXTURE_CUBE_MAP_POSITIVE_X+O:i.TEXTURE_2D,j=g.depthTexture.format===oi?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(g.depthTexture.format===zn)Gt(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,j,q,ht,0,ut):i.framebufferTexture2D(i.FRAMEBUFFER,j,q,ht,0);else if(g.depthTexture.format===oi)Gt(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,j,q,ht,0,ut):i.framebufferTexture2D(i.FRAMEBUFFER,j,q,ht,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function nt(E){const g=n.get(E),O=E.isWebGLCubeRenderTarget===!0;if(g.__boundDepthTexture!==E.depthTexture){const H=E.depthTexture;if(g.__depthDisposeCallback&&g.__depthDisposeCallback(),H){const Y=()=>{delete g.__boundDepthTexture,delete g.__depthDisposeCallback,H.removeEventListener("dispose",Y)};H.addEventListener("dispose",Y),g.__depthDisposeCallback=Y}g.__boundDepthTexture=H}if(E.depthTexture&&!g.__autoAllocateDepthBuffer)if(O)for(let H=0;H<6;H++)oe(g.__webglFramebuffer[H],E,H);else{const H=E.texture.mipmaps;H&&H.length>0?oe(g.__webglFramebuffer[0],E,0):oe(g.__webglFramebuffer,E,0)}else if(O){g.__webglDepthbuffer=[];for(let H=0;H<6;H++)if(e.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[H]),g.__webglDepthbuffer[H]===void 0)g.__webglDepthbuffer[H]=i.createRenderbuffer(),kt(g.__webglDepthbuffer[H],E,!1);else{const Y=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ht=g.__webglDepthbuffer[H];i.bindRenderbuffer(i.RENDERBUFFER,ht),i.framebufferRenderbuffer(i.FRAMEBUFFER,Y,i.RENDERBUFFER,ht)}}else{const H=E.texture.mipmaps;if(H&&H.length>0?e.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer),g.__webglDepthbuffer===void 0)g.__webglDepthbuffer=i.createRenderbuffer(),kt(g.__webglDepthbuffer,E,!1);else{const Y=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ht=g.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,ht),i.framebufferRenderbuffer(i.FRAMEBUFFER,Y,i.RENDERBUFFER,ht)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}function ot(E,g,O){const H=n.get(E);g!==void 0&&bt(H.__webglFramebuffer,E,E.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),O!==void 0&&nt(E)}function lt(E){const g=E.texture,O=n.get(E),H=n.get(g);E.addEventListener("dispose",v);const Y=E.textures,ht=E.isWebGLCubeRenderTarget===!0,ut=Y.length>1;if(ut||(H.__webglTexture===void 0&&(H.__webglTexture=i.createTexture()),H.__version=g.version,a.memory.textures++),ht){O.__webglFramebuffer=[];for(let q=0;q<6;q++)if(g.mipmaps&&g.mipmaps.length>0){O.__webglFramebuffer[q]=[];for(let j=0;j<g.mipmaps.length;j++)O.__webglFramebuffer[q][j]=i.createFramebuffer()}else O.__webglFramebuffer[q]=i.createFramebuffer()}else{if(g.mipmaps&&g.mipmaps.length>0){O.__webglFramebuffer=[];for(let q=0;q<g.mipmaps.length;q++)O.__webglFramebuffer[q]=i.createFramebuffer()}else O.__webglFramebuffer=i.createFramebuffer();if(ut)for(let q=0,j=Y.length;q<j;q++){const ft=n.get(Y[q]);ft.__webglTexture===void 0&&(ft.__webglTexture=i.createTexture(),a.memory.textures++)}if(E.samples>0&&Gt(E)===!1){O.__webglMultisampledFramebuffer=i.createFramebuffer(),O.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let q=0;q<Y.length;q++){const j=Y[q];O.__webglColorRenderbuffer[q]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,O.__webglColorRenderbuffer[q]);const ft=r.convert(j.format,j.colorSpace),Dt=r.convert(j.type),_t=M(j.internalFormat,ft,Dt,j.normalized,j.colorSpace,E.isXRRenderTarget===!0),pt=Ht(E);i.renderbufferStorageMultisample(i.RENDERBUFFER,pt,_t,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+q,i.RENDERBUFFER,O.__webglColorRenderbuffer[q])}i.bindRenderbuffer(i.RENDERBUFFER,null),E.depthBuffer&&(O.__webglDepthRenderbuffer=i.createRenderbuffer(),kt(O.__webglDepthRenderbuffer,E,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(ht){e.bindTexture(i.TEXTURE_CUBE_MAP,H.__webglTexture),qt(i.TEXTURE_CUBE_MAP,g);for(let q=0;q<6;q++)if(g.mipmaps&&g.mipmaps.length>0)for(let j=0;j<g.mipmaps.length;j++)bt(O.__webglFramebuffer[q][j],E,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+q,j);else bt(O.__webglFramebuffer[q],E,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0);p(g)&&y(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(ut){for(let q=0,j=Y.length;q<j;q++){const ft=Y[q],Dt=n.get(ft);let _t=i.TEXTURE_2D;(E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(_t=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(_t,Dt.__webglTexture),qt(_t,ft),bt(O.__webglFramebuffer,E,ft,i.COLOR_ATTACHMENT0+q,_t,0),p(ft)&&y(_t)}e.unbindTexture()}else{let q=i.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(q=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(q,H.__webglTexture),qt(q,g),g.mipmaps&&g.mipmaps.length>0)for(let j=0;j<g.mipmaps.length;j++)bt(O.__webglFramebuffer[j],E,g,i.COLOR_ATTACHMENT0,q,j);else bt(O.__webglFramebuffer,E,g,i.COLOR_ATTACHMENT0,q,0);p(g)&&y(q),e.unbindTexture()}E.depthBuffer&&nt(E)}function ct(E){const g=E.textures;for(let O=0,H=g.length;O<H;O++){const Y=g[O];if(p(Y)){const ht=w(E),ut=n.get(Y).__webglTexture;e.bindTexture(ht,ut),y(ht),e.unbindTexture()}}}const dt=[],Ft=[];function Ut(E){if(E.samples>0){if(Gt(E)===!1){const g=E.textures,O=E.width,H=E.height;let Y=i.COLOR_BUFFER_BIT;const ht=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ut=n.get(E),q=g.length>1;if(q)for(let ft=0;ft<g.length;ft++)e.bindFramebuffer(i.FRAMEBUFFER,ut.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,ut.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,ut.__webglMultisampledFramebuffer);const j=E.texture.mipmaps;j&&j.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,ut.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,ut.__webglFramebuffer);for(let ft=0;ft<g.length;ft++){if(E.resolveDepthBuffer&&(E.depthBuffer&&(Y|=i.DEPTH_BUFFER_BIT),E.stencilBuffer&&E.resolveStencilBuffer&&(Y|=i.STENCIL_BUFFER_BIT)),q){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ut.__webglColorRenderbuffer[ft]);const Dt=n.get(g[ft]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Dt,0)}i.blitFramebuffer(0,0,O,H,0,0,O,H,Y,i.NEAREST),c===!0&&(dt.length=0,Ft.length=0,dt.push(i.COLOR_ATTACHMENT0+ft),E.depthBuffer&&E.storeMultisampledDepthBuffer===!1&&(dt.push(ht),Ft.push(ht),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Ft)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,dt))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),q)for(let ft=0;ft<g.length;ft++){e.bindFramebuffer(i.FRAMEBUFFER,ut.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.RENDERBUFFER,ut.__webglColorRenderbuffer[ft]);const Dt=n.get(g[ft]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,ut.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.TEXTURE_2D,Dt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,ut.__webglMultisampledFramebuffer)}else if(E.depthBuffer&&E.storeMultisampledDepthBuffer===!1&&c){const g=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[g])}}}function Ht(E){return Math.min(s.maxSamples,E.samples)}function Gt(E){const g=n.get(E);return E.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&g.__useRenderToTexture!==!1}function C(E){const g=a.render.frame;u.get(E)!==g&&(u.set(E,g),E.update())}function se(E,g){const O=E.colorSpace,H=E.format,Y=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||O!==Rr&&O!==qn&&(Qt.getTransfer(O)===le?(H!==ln||Y!==Qe)&&zt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Jt("WebGLTextures: Unsupported texture color space:",O)),g}function Zt(E){return typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement?(l.width=E.naturalWidth||E.width,l.height=E.naturalHeight||E.height):typeof VideoFrame<"u"&&E instanceof VideoFrame?(l.width=E.displayWidth,l.height=E.displayHeight):(l.width=E.width,l.height=E.height),l}this.allocateTextureUnit=J,this.resetTextureUnits=X,this.getTextureUnits=F,this.setTextureUnits=B,this.setTexture2D=rt,this.setTexture2DArray=$,this.setTexture3D=tt,this.setTextureCube=it,this.rebindTextures=ot,this.setupRenderTarget=lt,this.updateRenderTargetMipmap=ct,this.updateMultisampleRenderTarget=Ut,this.setupDepthRenderbuffer=nt,this.setupFrameBufferTexture=bt,this.useMultisampledRTT=Gt,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function Q_(i,t){function e(n,s=qn){let r;const a=Qt.getTransfer(s);if(n===Qe)return i.UNSIGNED_BYTE;if(n===Fo)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Oo)return i.UNSIGNED_SHORT_5_5_5_1;if(n===$c)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Yc)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Wc)return i.BYTE;if(n===Xc)return i.SHORT;if(n===xs)return i.UNSIGNED_SHORT;if(n===Uo)return i.INT;if(n===Mn)return i.UNSIGNED_INT;if(n===_n)return i.FLOAT;if(n===yn)return i.HALF_FLOAT;if(n===qc)return i.ALPHA;if(n===Zc)return i.RGB;if(n===ln)return i.RGBA;if(n===zn)return i.DEPTH_COMPONENT;if(n===oi)return i.DEPTH_STENCIL;if(n===Kc)return i.RED;if(n===Bo)return i.RED_INTEGER;if(n===hi)return i.RG;if(n===zo)return i.RG_INTEGER;if(n===ko)return i.RGBA_INTEGER;if(n===Mr||n===yr||n===br||n===Er)if(a===le)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Mr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===yr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===br)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Er)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Mr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===yr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===br)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Er)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Xa||n===$a||n===Ya||n===qa)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Xa)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===$a)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ya)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===qa)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Za||n===Ka||n===Ja||n===Qa||n===ja||n===Ar||n===to)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Za||n===Ka)return a===le?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Ja)return a===le?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Qa)return r.COMPRESSED_R11_EAC;if(n===ja)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Ar)return r.COMPRESSED_RG11_EAC;if(n===to)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===eo||n===no||n===io||n===so||n===ro||n===ao||n===oo||n===lo||n===co||n===ho||n===uo||n===fo||n===po||n===mo)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===eo)return a===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===no)return a===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===io)return a===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===so)return a===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===ro)return a===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ao)return a===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===oo)return a===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===lo)return a===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===co)return a===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===ho)return a===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===uo)return a===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===fo)return a===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===po)return a===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===mo)return a===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===go||n===_o||n===vo)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===go)return a===le?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===_o)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===vo)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===xo||n===So||n===wr||n===Mo)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===xo)return r.COMPRESSED_RED_RGTC1_EXT;if(n===So)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===wr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Mo)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Ss?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}const j_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,t0=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class e0{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const n=new ch(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new bn({vertexShader:j_,fragmentShader:t0,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new tn(new Vr(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class n0 extends jn{constructor(t,e){super();const n=this;let s=null,r=1,a=null,o="local-floor",c=1,l=null,u=null,f=null,h=null,d=null,_=null;const S=typeof XRWebGLBinding<"u",m=new e0,p={},y=e.getContextAttributes();let w=null,M=null;const b=[],T=[],R=new at;let v=null,A=null;const P=new on;P.viewport=new Me;const U=new on;U.viewport=new Me;const G=[P,U],X=new lf;let F=null,B=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let et=b[K];return et===void 0&&(et=new aa,b[K]=et),et.getTargetRaySpace()},this.getControllerGrip=function(K){let et=b[K];return et===void 0&&(et=new aa,b[K]=et),et.getGripSpace()},this.getHand=function(K){let et=b[K];return et===void 0&&(et=new aa,b[K]=et),et.getHandSpace()};function J(K){const et=T.indexOf(K.inputSource);if(et===-1)return;const xt=b[et];xt!==void 0&&(xt.update(K.inputSource,K.frame,l||a),xt.dispatchEvent({type:K.type,data:K.inputSource}))}function V(){s.removeEventListener("select",J),s.removeEventListener("selectstart",J),s.removeEventListener("selectend",J),s.removeEventListener("squeeze",J),s.removeEventListener("squeezestart",J),s.removeEventListener("squeezeend",J),s.removeEventListener("end",V),s.removeEventListener("inputsourceschange",rt);for(let K=0;K<b.length;K++){const et=T[K];et!==null&&(T[K]=null,b[K].disconnect(et))}F=null,B=null,m.reset();for(const K in p)delete p[K];if(t.setRenderTarget(w),d=null,h=null,f=null,s=null,M=null,te.stop(),n.isPresenting=!1,t.setPixelRatio(v),t.setSize(R.width,R.height,!1),A!==null){const K=A.camera;K.fov=A.fov,K.zoom=A.zoom,K.updateProjectionMatrix(),A=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){r=K,n.isPresenting===!0&&zt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){o=K,n.isPresenting===!0&&zt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function(K){l=K},this.getBaseLayer=function(){return h!==null?h:d},this.getBinding=function(){return f===null&&S&&(f=new XRWebGLBinding(s,e)),f},this.getFrame=function(){return _},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(w=t.getRenderTarget(),s.addEventListener("select",J),s.addEventListener("selectstart",J),s.addEventListener("selectend",J),s.addEventListener("squeeze",J),s.addEventListener("squeezestart",J),s.addEventListener("squeezeend",J),s.addEventListener("end",V),s.addEventListener("inputsourceschange",rt),y.xrCompatible!==!0&&await e.makeXRCompatible(),v=t.getPixelRatio(),t.getSize(R),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let xt=null,Bt=null,bt=null;y.depth&&(bt=y.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,xt=y.stencil?oi:zn,Bt=y.stencil?Ss:Mn);const kt={colorFormat:e.RGBA8,depthFormat:bt,scaleFactor:r};f=this.getBinding(),h=f.createProjectionLayer(kt),s.updateRenderState({layers:[h]}),t.setPixelRatio(1),t.setSize(h.textureWidth,h.textureHeight,!1),M=new cn(h.textureWidth,h.textureHeight,{format:ln,type:Qe,depthTexture:new Ms(h.textureWidth,h.textureHeight,Bt,void 0,void 0,void 0,void 0,void 0,void 0,xt),stencilBuffer:y.stencil,colorSpace:t.outputColorSpace,samples:y.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}else{const xt={antialias:y.antialias,alpha:!0,depth:y.depth,stencil:y.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(s,e,xt),s.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),M=new cn(d.framebufferWidth,d.framebufferHeight,{format:ln,type:Qe,colorSpace:t.outputColorSpace,stencilBuffer:y.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await s.requestReferenceSpace(o),te.setContext(s),te.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function rt(K){for(let et=0;et<K.removed.length;et++){const xt=K.removed[et],Bt=T.indexOf(xt);Bt>=0&&(T[Bt]=null,b[Bt].disconnect(xt))}for(let et=0;et<K.added.length;et++){const xt=K.added[et];let Bt=T.indexOf(xt);if(Bt===-1){for(let kt=0;kt<b.length;kt++)if(kt>=T.length){T.push(xt),Bt=kt;break}else if(T[kt]===null){T[kt]=xt,Bt=kt;break}if(Bt===-1)break}const bt=b[Bt];bt&&bt.connect(xt)}}const $=new L,tt=new L;function it(K,et,xt){$.setFromMatrixPosition(et.matrixWorld),tt.setFromMatrixPosition(xt.matrixWorld);const Bt=$.distanceTo(tt),bt=et.projectionMatrix.elements,kt=xt.projectionMatrix.elements,oe=bt[14]/(bt[10]-1),nt=bt[14]/(bt[10]+1),ot=(bt[9]+1)/bt[5],lt=(bt[9]-1)/bt[5],ct=(bt[8]-1)/bt[0],dt=(kt[8]+1)/kt[0],Ft=oe*ct,Ut=oe*dt,Ht=Bt/(-ct+dt),Gt=Ht*-ct;if(et.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(Gt),K.translateZ(Ht),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),bt[10]===-1)K.projectionMatrix.copy(et.projectionMatrix),K.projectionMatrixInverse.copy(et.projectionMatrixInverse);else{const C=oe+Ht,se=nt+Ht,Zt=Ft-Gt,E=Ut+(Bt-Gt),g=ot*nt/se*C,O=lt*nt/se*C;K.projectionMatrix.makePerspective(Zt,E,g,O,C,se),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function Lt(K,et){et===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(et.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let et=K.near,xt=K.far;m.texture!==null&&(m.depthNear>0&&(et=m.depthNear),m.depthFar>0&&(xt=m.depthFar)),X.near=U.near=P.near=et,X.far=U.far=P.far=xt,(F!==X.near||B!==X.far)&&(s.updateRenderState({depthNear:X.near,depthFar:X.far}),F=X.near,B=X.far),X.layers.mask=K.layers.mask|6,P.layers.mask=X.layers.mask&-5,U.layers.mask=X.layers.mask&-3;const Bt=K.parent,bt=X.cameras;Lt(X,Bt);for(let kt=0;kt<bt.length;kt++)Lt(bt[kt],Bt);bt.length===2?it(X,P,U):X.projectionMatrix.copy(P.projectionMatrix),A===null&&K.isPerspectiveCamera&&(A={camera:K,fov:K.fov,zoom:K.zoom}),At(K,X,Bt)};function At(K,et,xt){xt===null?K.matrix.copy(et.matrixWorld):(K.matrix.copy(xt.matrixWorld),K.matrix.invert(),K.matrix.multiply(et.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(et.projectionMatrix),K.projectionMatrixInverse.copy(et.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=yo*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return X},this.getFoveation=function(){if(!(h===null&&d===null))return c},this.setFoveation=function(K){c=K,h!==null&&(h.fixedFoveation=K),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=K)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(X)},this.getCameraTexture=function(K){return p[K]};let ne=null;function qt(K,et){if(u=et.getViewerPose(l||a),_=et,u!==null){const xt=u.views;d!==null&&(t.setRenderTargetFramebuffer(M,d.framebuffer),t.setRenderTarget(M));let Bt=!1;xt.length!==X.cameras.length&&(X.cameras.length=0,Bt=!0);for(let nt=0;nt<xt.length;nt++){const ot=xt[nt];let lt=null;if(d!==null)lt=d.getViewport(ot);else{const dt=f.getViewSubImage(h,ot);lt=dt.viewport,nt===0&&(t.setRenderTargetTextures(M,dt.colorTexture,dt.depthStencilTexture),t.setRenderTarget(M))}let ct=G[nt];ct===void 0&&(ct=new on,ct.layers.enable(nt),ct.viewport=new Me,G[nt]=ct),ct.matrix.fromArray(ot.transform.matrix),ct.matrix.decompose(ct.position,ct.quaternion,ct.scale),ct.projectionMatrix.fromArray(ot.projectionMatrix),ct.projectionMatrixInverse.copy(ct.projectionMatrix).invert(),ct.viewport.set(lt.x,lt.y,lt.width,lt.height),nt===0&&(X.matrix.copy(ct.matrix),X.matrix.decompose(X.position,X.quaternion,X.scale)),Bt===!0&&X.cameras.push(ct)}const bt=s.enabledFeatures;if(bt&&bt.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&S){f=n.getBinding();const nt=f.getDepthInformation(xt[0]);nt&&nt.isValid&&nt.texture&&m.init(nt,s.renderState)}if(bt&&bt.includes("camera-access")&&S){t.state.unbindTexture(),f=n.getBinding();for(let nt=0;nt<xt.length;nt++){const ot=xt[nt].camera;if(ot){let lt=p[ot];lt||(lt=new ch,p[ot]=lt);const ct=f.getCameraImage(ot);lt.sourceTexture=ct}}}}for(let xt=0;xt<b.length;xt++){const Bt=T[xt],bt=b[xt];Bt!==null&&bt!==void 0&&bt.update(Bt,et,l||a)}ne&&ne(K,et),et.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:et}),_=null}const te=new Sh;te.setAnimationLoop(qt),this.setAnimationLoop=function(K){ne=K},this.dispose=function(){}}}const i0=new _e,wh=new Vt;wh.set(-1,0,0,0,1,0,0,0,1);function s0(i,t){function e(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,vh(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,y,w,M){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?r(m,p):p.isMeshLambertMaterial?(r(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(r(m,p),f(m,p)):p.isMeshPhongMaterial?(r(m,p),u(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(r(m,p),h(m,p),p.isMeshPhysicalMaterial&&d(m,p,M)):p.isMeshMatcapMaterial?(r(m,p),_(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),S(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?c(m,p,y,w):p.isSpriteMaterial?l(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,e(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Ve&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,e(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Ve&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,e(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,e(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const y=t.get(p),w=y.envMap,M=y.envMapRotation;w&&(m.envMap.value=w,m.envMapRotation.value.setFromMatrix4(i0.makeRotationFromEuler(M)).transpose(),w.isCubeTexture&&w.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(wh),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function c(m,p,y,w){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*y,m.scale.value=w*.5,p.map&&(m.map.value=p.map,e(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function l(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function u(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function f(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function h(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function d(m,p,y){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ve&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.retroreflectivity>0&&(m.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=y.texture,m.transmissionSamplerSize.value.set(y.width,y.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,m.specularIntensityMapTransform))}function _(m,p){p.matcap&&(m.matcap.value=p.matcap)}function S(m,p){const y=t.get(p).light;m.referencePosition.value.setFromMatrixPosition(y.matrixWorld),m.nearDistance.value=y.shadow.camera.near,m.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function r0(i,t,e,n){let s={},r={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(M,b){const T=b.program;n.uniformBlockBinding(M,T)}function l(M,b){let T=s[M.id];T===void 0&&(m(M),T=u(M),s[M.id]=T,M.addEventListener("dispose",y));const R=b.program;n.updateUBOMapping(M,R);const v=t.render.frame;r[M.id]!==v&&(h(M),r[M.id]=v)}function u(M){const b=f();M.__bindingPointIndex=b;const T=i.createBuffer(),R=M.__size,v=M.usage;return i.bindBuffer(i.UNIFORM_BUFFER,T),i.bufferData(i.UNIFORM_BUFFER,R,v),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,b,T),T}function f(){for(let M=0;M<o;M++)if(a.indexOf(M)===-1)return a.push(M),M;return Jt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(M){const b=s[M.id],T=M.uniforms,R=M.__cache;i.bindBuffer(i.UNIFORM_BUFFER,b);for(let v=0,A=T.length;v<A;v++){const P=T[v];if(Array.isArray(P))for(let U=0,G=P.length;U<G;U++)d(P[U],v,U,R);else d(P,v,0,R)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(M,b,T,R){if(S(M,b,T,R)===!0){const v=M.__offset,A=M.value;if(Array.isArray(A)){let P=0;for(let U=0;U<A.length;U++){const G=A[U],X=p(G);_(G,M.__data,P),typeof G!="number"&&typeof G!="boolean"&&!G.isMatrix3&&!ArrayBuffer.isView(G)&&(P+=X.storage/Float32Array.BYTES_PER_ELEMENT)}}else _(A,M.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,v,M.__data)}}function _(M,b,T){typeof M=="number"||typeof M=="boolean"?b[0]=M:M.isMatrix3?(b[0]=M.elements[0],b[1]=M.elements[1],b[2]=M.elements[2],b[3]=0,b[4]=M.elements[3],b[5]=M.elements[4],b[6]=M.elements[5],b[7]=0,b[8]=M.elements[6],b[9]=M.elements[7],b[10]=M.elements[8],b[11]=0):ArrayBuffer.isView(M)?b.set(new M.constructor(M.buffer,M.byteOffset,b.length)):M.toArray(b,T)}function S(M,b,T,R){const v=M.value,A=b+"_"+T;if(R[A]===void 0)return typeof v=="number"||typeof v=="boolean"?R[A]=v:ArrayBuffer.isView(v)?R[A]=v.slice():R[A]=v.clone(),!0;{const P=R[A];if(typeof v=="number"||typeof v=="boolean"){if(P!==v)return R[A]=v,!0}else{if(ArrayBuffer.isView(v))return!0;if(P.equals(v)===!1)return P.copy(v),!0}}return!1}function m(M){const b=M.uniforms;let T=0;const R=16;for(let A=0,P=b.length;A<P;A++){const U=Array.isArray(b[A])?b[A]:[b[A]];for(let G=0,X=U.length;G<X;G++){const F=U[G],B=Array.isArray(F.value)?F.value:[F.value];for(let J=0,V=B.length;J<V;J++){const rt=B[J],$=p(rt),tt=T%R,it=tt%$.boundary,Lt=tt+it;T+=it,Lt!==0&&R-Lt<$.storage&&(T+=R-Lt),F.__data=new Float32Array($.storage/Float32Array.BYTES_PER_ELEMENT),F.__offset=T,T+=$.storage}}}const v=T%R;return v>0&&(T+=R-v),M.__size=T,M.__cache={},this}function p(M){const b={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(b.boundary=4,b.storage=4):M.isVector2?(b.boundary=8,b.storage=8):M.isVector3||M.isColor?(b.boundary=16,b.storage=12):M.isVector4?(b.boundary=16,b.storage=16):M.isMatrix3?(b.boundary=48,b.storage=48):M.isMatrix4?(b.boundary=64,b.storage=64):M.isTexture?zt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(M)?(b.boundary=16,b.storage=M.byteLength):zt("WebGLRenderer: Unsupported uniform value type.",M),b}function y(M){const b=M.target;b.removeEventListener("dispose",y);const T=a.indexOf(b.__bindingPointIndex);a.splice(T,1),i.deleteBuffer(s[b.id]),delete s[b.id],delete r[b.id]}function w(){for(const M in s)i.deleteBuffer(s[M]);a=[],s={},r={}}return{bind:c,update:l,dispose:w}}const a0=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let pn=null;function o0(){return pn===null&&(pn=new dd(a0,16,16,hi,yn),pn.name="DFG_LUT",pn.minFilter=Fe,pn.magFilter=Fe,pn.wrapS=In,pn.wrapT=In,pn.generateMipmaps=!1,pn.needsUpdate=!0),pn}class l0{constructor(t={}){const{canvas:e=Bu(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:h=!1,outputBufferType:d=Qe}=t;this.isWebGLRenderer=!0;let _;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");_=n.getContextAttributes().alpha}else _=a;const S=d,m=new Set([ko,zo,Bo]),p=new Set([Qe,Mn,xs,Ss,Fo,Oo]),y=new Uint32Array(4),w=new Int32Array(4),M=new L;let b=null,T=null;const R=[],v=[];let A=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=xn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const P=this;let U=!1,G=null,X=null,F=null,B=null;this._outputColorSpace=Ke;let J=0,V=0,rt=null,$=-1,tt=null;const it=new Me,Lt=new Me;let At=null;const ne=new jt(0);let qt=0,te=e.width,K=e.height,et=1,xt=null,Bt=null;const bt=new Me(0,0,te,K),kt=new Me(0,0,te,K);let oe=!1;const nt=new rh;let ot=!1,lt=!1;const ct=new _e,dt=new L,Ft=new Me,Ut={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Ht=!1;function Gt(){return rt===null?et:1}let C=n;function se(x,I){return e.getContext(x,I)}let Zt,E,g,O,H,Y,ht,ut,q,j,ft,Dt,_t,pt,It,Ot,Wt,N,mt,Q,gt,yt,st;try{const x={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${No}`),e.addEventListener("webglcontextlost",pe,!1),e.addEventListener("webglcontextrestored",re,!1),e.addEventListener("webglcontextcreationerror",nn,!1),C===null){const I="webgl2";if(C=se(I,x),C===null)throw se(I)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Nt()}catch(x){throw e.removeEventListener("webglcontextlost",pe,!1),e.removeEventListener("webglcontextrestored",re,!1),e.removeEventListener("webglcontextcreationerror",nn,!1),Jt("WebGLRenderer: "+x.message),x}function Nt(){Zt=new og(C),Zt.init(),gt=new Q_(C,Zt),E=new Jm(C,Zt,t,gt),g=new K_(C,Zt),E.reversedDepthBuffer&&h&&g.buffers.depth.setReversed(!0),X=C.createFramebuffer(),F=C.createFramebuffer(),B=C.createFramebuffer(),O=new hg(C),H=new F_,Y=new J_(C,Zt,g,H,E,gt,O),ht=new ag(P),ut=new df(C),yt=new Zm(C,ut),q=new lg(C,ut,O,yt),j=new dg(C,q,ut,yt,O),N=new ug(C,E,Y),It=new Qm(H),ft=new U_(P,ht,Zt,E,yt,It),Dt=new s0(P,H),_t=new B_,pt=new W_(Zt),Wt=new qm(P,ht,g,j,_,c),Ot=new Z_(P,j,E),st=new r0(C,O,E,g),mt=new Km(C,Zt,O),Q=new cg(C,Zt,O),O.programs=ft.programs,P.capabilities=E,P.extensions=Zt,P.properties=H,P.renderLists=_t,P.shadowMap=Ot,P.state=g,P.info=O}S!==Qe&&(A=new pg(S,e.width,e.height,o,s,r));const Ct=new n0(P,C);this.xr=Ct,this.getContext=function(){return C},this.getContextAttributes=function(){return C.getContextAttributes()},this.forceContextLoss=function(){const x=Zt.get("WEBGL_lose_context");x&&x.loseContext()},this.forceContextRestore=function(){const x=Zt.get("WEBGL_lose_context");x&&x.restoreContext()},this.getPixelRatio=function(){return et},this.setPixelRatio=function(x){x!==void 0&&(et=x,this.setSize(te,K,!1))},this.getSize=function(x){return x.set(te,K)},this.setSize=function(x,I,W=!0){if(Ct.isPresenting){zt("WebGLRenderer: Can't change size while VR device is presenting.");return}te=x,K=I,e.width=Math.floor(x*et),e.height=Math.floor(I*et),W===!0&&(e.style.width=x+"px",e.style.height=I+"px"),A!==null&&A.setSize(e.width,e.height),this.setViewport(0,0,x,I)},this.getDrawingBufferSize=function(x){return x.set(te*et,K*et).floor()},this.setDrawingBufferSize=function(x,I,W){te=x,K=I,et=W,e.width=Math.floor(x*W),e.height=Math.floor(I*W),this.setViewport(0,0,x,I)},this.setEffects=function(x){if(S===Qe){Jt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(x){for(let I=0;I<x.length;I++)if(x[I].isOutputPass===!0){zt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}A.setEffects(x||[])},this.getCurrentViewport=function(x){return x.copy(it)},this.getViewport=function(x){return x.copy(bt)},this.setViewport=function(x,I,W,z){x.isVector4?bt.set(x.x,x.y,x.z,x.w):bt.set(x,I,W,z),g.viewport(it.copy(bt).multiplyScalar(et).round())},this.getScissor=function(x){return x.copy(kt)},this.setScissor=function(x,I,W,z){x.isVector4?kt.set(x.x,x.y,x.z,x.w):kt.set(x,I,W,z),g.scissor(Lt.copy(kt).multiplyScalar(et).round())},this.getScissorTest=function(){return oe},this.setScissorTest=function(x){g.setScissorTest(oe=x)},this.setOpaqueSort=function(x){xt=x},this.setTransparentSort=function(x){Bt=x},this.getClearColor=function(x){return x.copy(Wt.getClearColor())},this.setClearColor=function(){Wt.setClearColor(...arguments)},this.getClearAlpha=function(){return Wt.getClearAlpha()},this.setClearAlpha=function(){Wt.setClearAlpha(...arguments)},this.clear=function(x=!0,I=!0,W=!0){let z=0;if(x){let k=!1;if(rt!==null){const Mt=rt.texture.format;k=m.has(Mt)}if(k){const Mt=rt.texture.type,Tt=p.has(Mt),St=Wt.getClearColor(),wt=Wt.getClearAlpha(),Pt=St.r,Xt=St.g,Kt=St.b;Tt?(y[0]=Pt,y[1]=Xt,y[2]=Kt,y[3]=wt,C.clearBufferuiv(C.COLOR,0,y)):(w[0]=Pt,w[1]=Xt,w[2]=Kt,w[3]=wt,C.clearBufferiv(C.COLOR,0,w))}else z|=C.COLOR_BUFFER_BIT}I&&(z|=C.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),W&&(z|=C.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),z!==0&&C.clear(z)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(x){x.setRenderer(this),G=x},this.dispose=function(){e.removeEventListener("webglcontextlost",pe,!1),e.removeEventListener("webglcontextrestored",re,!1),e.removeEventListener("webglcontextcreationerror",nn,!1),Wt.dispose(),_t.dispose(),pt.dispose(),H.dispose(),ht.dispose(),j.dispose(),yt.dispose(),st.dispose(),ft.dispose(),Ct.dispose(),Ct.removeEventListener("sessionstart",ol),Ct.removeEventListener("sessionend",ll),ti.stop()};function pe(x){x.preventDefault(),Dr("WebGLRenderer: Context Lost."),U=!0}function re(){Dr("WebGLRenderer: Context Restored."),U=!1;const x=O.autoReset,I=Ot.enabled,W=Ot.autoUpdate,z=Ot.needsUpdate,k=Ot.type;Nt(),O.autoReset=x,Ot.enabled=I,Ot.autoUpdate=W,Ot.needsUpdate=z,Ot.type=k}function nn(x){Jt("WebGLRenderer: A WebGL context could not be created. Reason: ",x.statusMessage)}function hn(x){const I=x.target;I.removeEventListener("dispose",hn),qh(I)}function qh(x){Zh(x),H.remove(x)}function Zh(x){const I=H.get(x).programs;I!==void 0&&(I.forEach(function(W){ft.releaseProgram(W)}),x.isShaderMaterial&&ft.releaseShaderCache(x))}this.renderBufferDirect=function(x,I,W,z,k,Mt){I===null&&(I=Ut);const Tt=k.isMesh&&k.matrixWorld.determinantAffine()<0,St=Qh(x,I,W,z,k);g.setMaterial(z,Tt);let wt=W.index,Pt=1;if(z.wireframe===!0){if(wt=q.getWireframeAttribute(W),wt===void 0)return;Pt=2}const Xt=W.drawRange,Kt=W.attributes.position;let Rt=Xt.start*Pt,ae=(Xt.start+Xt.count)*Pt;Mt!==null&&(Rt=Math.max(Rt,Mt.start*Pt),ae=Math.min(ae,(Mt.start+Mt.count)*Pt)),wt!==null?(Rt=Math.max(Rt,0),ae=Math.min(ae,wt.count)):Kt!=null&&(Rt=Math.max(Rt,0),ae=Math.min(ae,Kt.count));const Ee=ae-Rt;if(Ee<0||Ee===1/0)return;yt.setup(k,z,St,W,wt);let ge,de=mt;if(wt!==null&&(ge=ut.get(wt),de=Q,de.setIndex(ge)),k.isMesh)z.wireframe===!0?(g.setLineWidth(z.wireframeLinewidth*Gt()),de.setMode(C.LINES)):de.setMode(C.TRIANGLES);else if(k.isLine){let Ie=z.linewidth;Ie===void 0&&(Ie=1),g.setLineWidth(Ie*Gt()),k.isLineSegments?de.setMode(C.LINES):k.isLineLoop?de.setMode(C.LINE_LOOP):de.setMode(C.LINE_STRIP)}else k.isPoints?de.setMode(C.POINTS):k.isSprite&&de.setMode(C.TRIANGLES);if(k.isBatchedMesh)if(Zt.get("WEBGL_multi_draw"))de.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{const Ie=k._multiDrawStarts,Et=k._multiDrawCounts,ze=k._multiDrawCount,ee=wt?ut.get(wt).bytesPerElement:1,qe=H.get(z).currentProgram.getUniforms();for(let un=0;un<ze;un++)qe.setValue(C,"_gl_DrawID",un),de.render(Ie[un]/ee,Et[un])}else if(k.isInstancedMesh)de.renderInstances(Rt,Ee,k.count);else if(W.isInstancedBufferGeometry){const Ie=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,Et=Math.min(W.instanceCount,Ie);de.renderInstances(Rt,Ee,Et)}else de.render(Rt,Ee)};function al(x,I,W,z){G!==null&&x.isNodeMaterial&&G.setObject(z,x),ot===!0&&It.setState(x,W,!1),x.transparent===!0&&x.side===Je&&x.forceSinglePass===!1?(x.side=Ve,x.needsUpdate=!0,Is(x,I,z),x.side=li,x.needsUpdate=!0,Is(x,I,z),x.side=Je):Is(x,I,z)}this.compile=function(x,I,W=null){W===null&&(W=x),G!==null&&G.renderStart(x,I,W),T=pt.get(W),T.init(I),v.push(T),W.traverseVisible(function(k){k.isLight&&k.layers.test(I.layers)&&(T.pushLight(k),k.castShadow&&T.pushShadow(k))}),x!==W&&x.traverseVisible(function(k){k.isLight&&k.layers.test(I.layers)&&(T.pushLight(k),k.castShadow&&T.pushShadow(k))}),T.setupLights(),G!==null&&G.updateLights(T.state.lightsArray),lt=this.localClippingEnabled,ot=It.init(this.clippingPlanes,lt),ot===!0&&It.setGlobalState(this.clippingPlanes,I),G!==null&&Ot.render(T.state.shadowsArray,W,I);const z=new Set;return x.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;const Mt=k.material;if(Mt)if(Array.isArray(Mt))for(let Tt=0;Tt<Mt.length;Tt++){const St=Mt[Tt];al(St,W,I,k),z.add(St)}else al(Mt,W,I,k),z.add(Mt)}),T=v.pop(),G!==null&&G.renderEnd(),z},this.compileAsync=function(x,I,W=null){const z=this.compile(x,I,W);return new Promise(k=>{function Mt(){if(z.forEach(function(Tt){const wt=H.get(Tt).currentProgram;(wt===void 0||wt.isReady())&&z.delete(Tt)}),z.size===0){k(x);return}setTimeout(Mt,10)}Zt.get("KHR_parallel_shader_compile")!==null?Mt():setTimeout(Mt,10)})};let qr=null;function Kh(x){qr&&qr(x)}function ol(){ti.stop()}function ll(){ti.start()}const ti=new Sh;ti.setAnimationLoop(Kh),typeof self<"u"&&ti.setContext(self),this.setAnimationLoop=function(x){qr=x,Ct.setAnimationLoop(x),x===null?ti.stop():ti.start()},Ct.addEventListener("sessionstart",ol),Ct.addEventListener("sessionend",ll),this.render=function(x,I){if(I!==void 0&&I.isCamera!==!0){Jt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(U===!0)return;G!==null&&G.renderStart(x,I);const W=Ct.enabled===!0&&Ct.isPresenting===!0,z=A!==null&&(rt===null||W)&&A.begin(P,rt);if(x.matrixWorldAutoUpdate===!0&&x.updateMatrixWorld(),I.parent===null&&I.matrixWorldAutoUpdate===!0&&I.updateMatrixWorld(),Ct.enabled===!0&&Ct.isPresenting===!0&&(A===null||A.isCompositing()===!1)&&(Ct.cameraAutoUpdate===!0&&Ct.updateCamera(I),I=Ct.getCamera()),x.isScene===!0&&x.onBeforeRender(P,x,I,rt),T=pt.get(x,v.length),T.init(I),T.state.textureUnits=Y.getTextureUnits(),v.push(T),ct.multiplyMatrices(I.projectionMatrix,I.matrixWorldInverse),nt.setFromProjectionMatrix(ct,vn,I.reversedDepth),lt=this.localClippingEnabled,ot=It.init(this.clippingPlanes,lt),b=_t.get(x,R.length),b.init(),R.push(b),Ct.enabled===!0&&Ct.isPresenting===!0){const Tt=P.xr.getDepthSensingMesh();Tt!==null&&Zr(Tt,I,-1/0,P.sortObjects)}Zr(x,I,0,P.sortObjects),b.finish(),G!==null&&G.updateLights(T.state.lightsArray),P.sortObjects===!0&&b.sort(xt,Bt),Ht=Ct.enabled===!1||Ct.isPresenting===!1||Ct.hasDepthSensing()===!1,Ht&&Wt.addToRenderList(b,x),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),ot===!0&&It.beginShadows();const k=T.state.shadowsArray;if(Ot.render(k,x,I),ot===!0&&It.endShadows(),(z&&A.hasRenderPass())===!1){const Tt=b.opaque,St=b.transmissive;if(T.setupLights(),I.isArrayCamera){const wt=I.cameras;if(St.length>0)for(let Pt=0,Xt=wt.length;Pt<Xt;Pt++){const Kt=wt[Pt];hl(Tt,St,x,Kt)}Ht&&Wt.render(x);for(let Pt=0,Xt=wt.length;Pt<Xt;Pt++){const Kt=wt[Pt];cl(b,x,Kt,Kt.viewport)}}else St.length>0&&hl(Tt,St,x,I),Ht&&Wt.render(x),cl(b,x,I)}rt!==null&&V===0&&(Y.updateMultisampleRenderTarget(rt),Y.updateRenderTargetMipmap(rt)),z&&A.end(P),x.isScene===!0&&x.onAfterRender(P,x,I),yt.resetDefaultState(),$=-1,tt=null,v.pop(),v.length>0?(T=v[v.length-1],Y.setTextureUnits(T.state.textureUnits),ot===!0&&It.setGlobalState(P.clippingPlanes,T.state.camera)):T=null,R.pop(),R.length>0?b=R[R.length-1]:b=null,G!==null&&G.renderEnd()};function Zr(x,I,W,z){if(x.visible===!1)return;if(x.layers.test(I.layers)){if(x.isGroup)W=x.renderOrder;else if(x.isLOD)x.autoUpdate===!0&&x.update(I);else if(x.isLightProbeGrid)T.pushLightProbeGrid(x);else if(x.isLight)T.pushLight(x),x.castShadow&&T.pushShadow(x);else if(x.isSprite){if(!x.frustumCulled||x.intersectsFrustum(nt)){z&&Ft.setFromMatrixPosition(x.matrixWorld).applyMatrix4(ct);const Tt=j.update(x),St=x.material;St.visible&&b.push(x,Tt,St,W,Ft.z,null,I)}}else if((x.isMesh||x.isLine||x.isPoints)&&(!x.frustumCulled||x.intersectsFrustum(nt))){const Tt=j.update(x),St=x.material;if(z&&(x.boundingSphere!==void 0?(x.boundingSphere===null&&x.computeBoundingSphere(),Ft.copy(x.boundingSphere.center)):(Tt.boundingSphere===null&&Tt.computeBoundingSphere(),Ft.copy(Tt.boundingSphere.center)),Ft.applyMatrix4(x.matrixWorld).applyMatrix4(ct)),Array.isArray(St)){const wt=Tt.groups;for(let Pt=0,Xt=wt.length;Pt<Xt;Pt++){const Kt=wt[Pt],Rt=St[Kt.materialIndex];Rt&&Rt.visible&&b.push(x,Tt,Rt,W,Ft.z,Kt,I)}}else St.visible&&b.push(x,Tt,St,W,Ft.z,null,I)}}const Mt=x.children;for(let Tt=0,St=Mt.length;Tt<St;Tt++)Zr(Mt[Tt],I,W,z)}function cl(x,I,W,z){const{opaque:k,transmissive:Mt,transparent:Tt}=x;T.setupLightsView(W),ot===!0&&It.setGlobalState(P.clippingPlanes,W),z&&g.viewport(it.copy(z)),k.length>0&&Ds(k,I,W),Mt.length>0&&Ds(Mt,I,W),Tt.length>0&&Ds(Tt,I,W),g.buffers.depth.setTest(!0),g.buffers.depth.setMask(!0),g.buffers.color.setMask(!0),g.setPolygonOffset(!1)}function hl(x,I,W,z){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;if(T.state.transmissionRenderTarget[z.id]===void 0){const Rt=Zt.has("EXT_color_buffer_half_float")||Zt.has("EXT_color_buffer_float");T.state.transmissionRenderTarget[z.id]=new cn(1,1,{generateMipmaps:!0,type:Rt?yn:Qe,minFilter:ai,samples:Math.max(4,E.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Qt.workingColorSpace})}const Mt=T.state.transmissionRenderTarget[z.id],Tt=z.viewport||it;Mt.setSize(Tt.z*P.transmissionResolutionScale,Tt.w*P.transmissionResolutionScale);const St=P.getRenderTarget(),wt=P.getActiveCubeFace(),Pt=P.getActiveMipmapLevel();P.setRenderTarget(Mt),P.getClearColor(ne),qt=P.getClearAlpha(),qt<1&&P.setClearColor(16777215,.5),P.clear(),Ht&&Wt.render(W);const Xt=P.toneMapping;P.toneMapping=xn;const Kt=z.viewport;if(z.viewport!==void 0&&(z.viewport=void 0),T.setupLightsView(z),ot===!0&&It.setGlobalState(P.clippingPlanes,z),Ds(x,W,z),Y.updateMultisampleRenderTarget(Mt),Y.updateRenderTargetMipmap(Mt),Zt.has("WEBGL_multisampled_render_to_texture")===!1){let Rt=!1;for(let ae=0,Ee=I.length;ae<Ee;ae++){const ge=I[ae],{object:de,geometry:Ie,material:Et,group:ze}=ge;if(Et.side===Je&&de.layers.test(z.layers)){const ee=Et.side;Et.side=Ve,Et.needsUpdate=!0,ul(de,W,z,Ie,Et,ze),Et.side=ee,Et.needsUpdate=!0,Rt=!0}}Rt===!0&&(Y.updateMultisampleRenderTarget(Mt),Y.updateRenderTargetMipmap(Mt))}P.setRenderTarget(St,wt,Pt),P.setClearColor(ne,qt),Kt!==void 0&&(z.viewport=Kt),P.toneMapping=Xt}function Ds(x,I,W){const z=I.isScene===!0?I.overrideMaterial:null;for(let k=0,Mt=x.length;k<Mt;k++){const Tt=x[k],{object:St,geometry:wt,group:Pt}=Tt;let Xt=Tt.material;Xt.allowOverride===!0&&z!==null&&(Xt=z),St.layers.test(W.layers)&&ul(St,I,W,wt,Xt,Pt)}}function ul(x,I,W,z,k,Mt){G!==null&&k.isNodeMaterial&&G.setObject(x,k),x.onBeforeRender(P,I,W,z,k,Mt),x.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,x.matrixWorld),x.normalMatrix.getNormalMatrix(x.modelViewMatrix),k.onBeforeRender(P,I,W,z,x,Mt),k.transparent===!0&&k.side===Je&&k.forceSinglePass===!1?(k.side=Ve,k.needsUpdate=!0,P.renderBufferDirect(W,I,z,k,x,Mt),k.side=li,k.needsUpdate=!0,P.renderBufferDirect(W,I,z,k,x,Mt),k.side=Je):P.renderBufferDirect(W,I,z,k,x,Mt),x.onAfterRender(P,I,W,z,k,Mt)}function Is(x,I,W){I.isScene!==!0&&(I=Ut);const z=H.get(x),k=T.state.lights,Mt=T.state.shadowsArray,Tt=k.state.version,St=ft.getParameters(x,k.state,Mt,I,W,T.state.lightProbeGridArray),wt=ft.getProgramCacheKey(St);let Pt=z.programs;z.environment=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?I.environment:null,z.fog=I.fog;const Xt=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap;z.envMap=ht.get(x.envMap||z.environment,Xt),z.envMapRotation=z.environment!==null&&x.envMap===null?I.environmentRotation:x.envMapRotation,Pt===void 0&&(x.addEventListener("dispose",hn),Pt=new Map,z.programs=Pt);let Kt=Pt.get(wt);if(Kt!==void 0){if(z.currentProgram===Kt&&z.lightsStateVersion===Tt)return fl(x,St),Kt}else St.uniforms=ft.getUniforms(x),G!==null&&x.isNodeMaterial&&G.build(x,W,St),x.onBeforeCompile(St,P),Kt=ft.acquireProgram(St,wt),Pt.set(wt,Kt),z.uniforms=St.uniforms;const Rt=z.uniforms;return(!x.isShaderMaterial&&!x.isRawShaderMaterial||x.clipping===!0)&&(Rt.clippingPlanes=It.uniform),fl(x,St),z.needsLights=tu(x),z.lightsStateVersion=Tt,z.needsLights&&(Rt.ambientLightColor.value=k.state.ambient,Rt.lightProbe.value=k.state.probe,Rt.sunLights.value=k.state.sun,Rt.sunLightShadows.value=k.state.sunShadow,Rt.directionalLights.value=k.state.directional,Rt.directionalLightShadows.value=k.state.directionalShadow,Rt.spotLights.value=k.state.spot,Rt.spotLightShadows.value=k.state.spotShadow,Rt.rectAreaLights.value=k.state.rectArea,Rt.ltc_1.value=k.state.rectAreaLTC1,Rt.ltc_2.value=k.state.rectAreaLTC2,Rt.pointLights.value=k.state.point,Rt.pointLightShadows.value=k.state.pointShadow,Rt.hemisphereLights.value=k.state.hemi,Rt.sunShadowMatrix.value=k.state.sunShadowMatrix,Rt.sunShadowCascade.value=k.state.sunShadowCascade,Rt.directionalShadowMatrix.value=k.state.directionalShadowMatrix,Rt.spotLightMatrix.value=k.state.spotLightMatrix,Rt.spotLightMap.value=k.state.spotLightMap,Rt.pointShadowMatrix.value=k.state.pointShadowMatrix),z.lightProbeGrid=T.state.lightProbeGridArray.length>0,z.currentProgram=Kt,z.uniformsList=null,Kt}function dl(x){if(x.uniformsList===null){const I=x.currentProgram.getUniforms();x.uniformsList=Tr.seqWithValue(I.seq,x.uniforms)}return x.uniformsList}function fl(x,I){const W=H.get(x);W.outputColorSpace=I.outputColorSpace,W.batching=I.batching,W.batchingColor=I.batchingColor,W.instancing=I.instancing,W.instancingColor=I.instancingColor,W.instancingMorph=I.instancingMorph,W.skinning=I.skinning,W.morphTargets=I.morphTargets,W.morphNormals=I.morphNormals,W.morphColors=I.morphColors,W.morphTargetsCount=I.morphTargetsCount,W.numClippingPlanes=I.numClippingPlanes,W.numIntersection=I.numClipIntersection,W.vertexAlphas=I.vertexAlphas,W.vertexTangents=I.vertexTangents,W.toneMapping=I.toneMapping}function Jh(x,I){if(x.length===0)return null;if(x.length===1)return x[0].texture!==null?x[0]:null;M.setFromMatrixPosition(I.matrixWorld);for(let W=0,z=x.length;W<z;W++){const k=x[W];if(k.texture!==null&&k.boundingBox.containsPoint(M))return k}return null}function Qh(x,I,W,z,k){I.isScene!==!0&&(I=Ut),Y.resetTextureUnits();const Mt=I.fog,Tt=z.isMeshStandardMaterial||z.isMeshLambertMaterial||z.isMeshPhongMaterial?I.environment:null,St=rt===null?P.outputColorSpace:rt.isXRRenderTarget===!0?rt.texture.colorSpace:Qt.workingColorSpace,wt=z.isMeshStandardMaterial||z.isMeshLambertMaterial&&!z.envMap||z.isMeshPhongMaterial&&!z.envMap,Pt=ht.get(z.envMap||Tt,wt),Xt=z.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Kt=!!W.attributes.tangent&&(!!z.normalMap||z.anisotropy>0),Rt=!!W.morphAttributes.position,ae=!!W.morphAttributes.normal,Ee=!!W.morphAttributes.color;let ge=xn;z.toneMapped&&(rt===null||rt.isXRRenderTarget===!0)&&(ge=P.toneMapping);const de=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,Ie=de!==void 0?de.length:0,Et=H.get(z),ze=T.state.lights;if(ot===!0&&(lt===!0||x!==tt)){const me=x===tt&&z.id===$;It.setState(z,x,me)}let ee=!1;z.version===Et.__version?(Et.needsLights&&Et.lightsStateVersion!==ze.state.version||Et.outputColorSpace!==St||k.isBatchedMesh&&Et.batching===!1||!k.isBatchedMesh&&Et.batching===!0||k.isBatchedMesh&&Et.batchingColor===!0&&k._colorsTexture===null||k.isBatchedMesh&&Et.batchingColor===!1&&k._colorsTexture!==null||k.isInstancedMesh&&Et.instancing===!1||!k.isInstancedMesh&&Et.instancing===!0||k.isSkinnedMesh&&Et.skinning===!1||!k.isSkinnedMesh&&Et.skinning===!0||k.isInstancedMesh&&Et.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&Et.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&Et.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&Et.instancingMorph===!1&&k.morphTexture!==null||Et.envMap!==Pt||z.fog===!0&&Et.fog!==Mt||Et.numClippingPlanes!==void 0&&(Et.numClippingPlanes!==It.numPlanes||Et.numIntersection!==It.numIntersection)||Et.vertexAlphas!==Xt||Et.vertexTangents!==Kt||Et.morphTargets!==Rt||Et.morphNormals!==ae||Et.morphColors!==Ee||Et.toneMapping!==ge||Et.morphTargetsCount!==Ie||!!Et.lightProbeGrid!=T.state.lightProbeGridArray.length>0)&&(ee=!0):(ee=!0,Et.__version=z.version);let qe=Et.currentProgram;ee===!0&&(qe=Is(z,I,k),G&&z.isNodeMaterial&&G.onUpdateProgram(z,qe,Et));let un=!1,kn=!1,gi=!1;const he=qe.getUniforms(),ye=Et.uniforms;if(g.useProgram(qe.program)&&(un=!0,kn=!0,gi=!0),z.id!==$&&($=z.id,kn=!0),Et.needsLights){const me=Jh(T.state.lightProbeGridArray,k);Et.lightProbeGrid!==me&&(Et.lightProbeGrid=me,kn=!0)}if(un||tt!==x){g.buffers.depth.getReversed()&&x.reversedDepth!==!0&&(x._reversedDepth=!0,x.updateProjectionMatrix()),he.setValue(C,"projectionMatrix",x.projectionMatrix),he.setValue(C,"viewMatrix",x.matrixWorldInverse);const Gn=he.map.cameraPosition;Gn!==void 0&&Gn.setValue(C,dt.setFromMatrixPosition(x.matrixWorld)),E.logarithmicDepthBuffer&&he.setValue(C,"logDepthBufFC",2/(Math.log(x.far+1)/Math.LN2)),(z.isMeshPhongMaterial||z.isMeshToonMaterial||z.isMeshLambertMaterial||z.isMeshBasicMaterial||z.isMeshStandardMaterial||z.isShaderMaterial)&&he.setValue(C,"isOrthographic",x.isOrthographicCamera===!0),tt!==x&&(tt=x,kn=!0,gi=!0)}if(Et.needsLights&&(ze.state.sunShadowMap.length>0&&he.setValue(C,"sunShadowMap",ze.state.sunShadowMap,Y),ze.state.directionalShadowMap.length>0&&he.setValue(C,"directionalShadowMap",ze.state.directionalShadowMap,Y),ze.state.spotShadowMap.length>0&&he.setValue(C,"spotShadowMap",ze.state.spotShadowMap,Y),ze.state.pointShadowMap.length>0&&he.setValue(C,"pointShadowMap",ze.state.pointShadowMap,Y)),k.isSkinnedMesh){he.setOptional(C,k,"bindMatrix"),he.setOptional(C,k,"bindMatrixInverse");const me=k.skeleton;me&&(me.boneTexture===null&&me.computeBoneTexture(),he.setValue(C,"boneTexture",me.boneTexture,Y))}k.isBatchedMesh&&(he.setOptional(C,k,"batchingTexture"),he.setValue(C,"batchingTexture",k._matricesTexture,Y),he.setOptional(C,k,"batchingIdTexture"),he.setValue(C,"batchingIdTexture",k._indirectTexture,Y),he.setOptional(C,k,"batchingColorTexture"),k._colorsTexture!==null&&he.setValue(C,"batchingColorTexture",k._colorsTexture,Y));const Hn=W.morphAttributes;if((Hn.position!==void 0||Hn.normal!==void 0||Hn.color!==void 0)&&N.update(k,W,qe),(kn||Et.receiveShadow!==k.receiveShadow)&&(Et.receiveShadow=k.receiveShadow,he.setValue(C,"receiveShadow",k.receiveShadow)),(z.isMeshStandardMaterial||z.isMeshLambertMaterial||z.isMeshPhongMaterial)&&z.envMap===null&&I.environment!==null&&(ye.envMapIntensity.value=I.environmentIntensity),ye.dfgLUT!==void 0&&(ye.dfgLUT.value=o0()),kn){if(he.setValue(C,"toneMappingExposure",P.toneMappingExposure),Et.needsLights&&jh(ye,gi),Mt&&z.fog===!0&&Dt.refreshFogUniforms(ye,Mt),Dt.refreshMaterialUniforms(ye,z,et,K,T.state.transmissionRenderTarget[x.id]),Et.needsLights&&Et.lightProbeGrid){const me=Et.lightProbeGrid;ye.probesSH.value=me.texture,ye.probesMin.value.copy(me.boundingBox.min),ye.probesMax.value.copy(me.boundingBox.max),ye.probesResolution.value.copy(me.resolution)}Tr.upload(C,dl(Et),ye,Y)}if(z.isShaderMaterial&&z.uniformsNeedUpdate===!0&&(Tr.upload(C,dl(Et),ye,Y),z.uniformsNeedUpdate=!1),z.isSpriteMaterial&&he.setValue(C,"center",k.center),he.setValue(C,"modelViewMatrix",k.modelViewMatrix),he.setValue(C,"normalMatrix",k.normalMatrix),he.setValue(C,"modelMatrix",k.matrixWorld),z.uniformsGroups!==void 0){const me=z.uniformsGroups;for(let Gn=0,_i=me.length;Gn<_i;Gn++){const ml=me[Gn];st.update(ml,qe),st.bind(ml,qe)}}return qe}function jh(x,I){x.ambientLightColor.needsUpdate=I,x.lightProbe.needsUpdate=I,x.sunLights.needsUpdate=I,x.sunLightShadows.needsUpdate=I,x.directionalLights.needsUpdate=I,x.directionalLightShadows.needsUpdate=I,x.pointLights.needsUpdate=I,x.pointLightShadows.needsUpdate=I,x.spotLights.needsUpdate=I,x.spotLightShadows.needsUpdate=I,x.rectAreaLights.needsUpdate=I,x.hemisphereLights.needsUpdate=I}function tu(x){return x.isMeshLambertMaterial||x.isMeshToonMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isShadowMaterial||x.isShaderMaterial&&x.lights===!0}this.getActiveCubeFace=function(){return J},this.getActiveMipmapLevel=function(){return V},this.getRenderTarget=function(){return rt},this.setRenderTargetTextures=function(x,I,W){const z=H.get(x);z.__autoAllocateDepthBuffer=x.resolveDepthBuffer===!1,z.__autoAllocateDepthBuffer===!1&&(z.__useRenderToTexture=!1),H.get(x.texture).__webglTexture=I,H.get(x.depthTexture).__webglTexture=z.__autoAllocateDepthBuffer?void 0:W,z.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(x,I){const W=H.get(x);W.__webglFramebuffer=I,W.__useDefaultFramebuffer=I===void 0},this.setRenderTarget=function(x,I=0,W=0){rt=x,J=I,V=W;let z=null,k=!1,Mt=!1;if(x){const St=H.get(x);if(St.__useDefaultFramebuffer!==void 0){g.bindFramebuffer(C.FRAMEBUFFER,St.__webglFramebuffer),it.copy(x.viewport),Lt.copy(x.scissor),At=x.scissorTest,g.viewport(it),g.scissor(Lt),g.setScissorTest(At),$=-1;return}else if(St.__webglFramebuffer===void 0)Y.setupRenderTarget(x);else if(St.__hasExternalTextures)Y.rebindTextures(x,H.get(x.texture).__webglTexture,H.get(x.depthTexture).__webglTexture);else if(x.depthBuffer){const Xt=x.depthTexture;if(St.__boundDepthTexture!==Xt){if(Xt!==null&&H.has(Xt)&&(x.width!==Xt.image.width||x.height!==Xt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Y.setupDepthRenderbuffer(x)}}const wt=x.texture;(wt.isData3DTexture||wt.isDataArrayTexture||wt.isCompressedArrayTexture)&&(Mt=!0);const Pt=H.get(x).__webglFramebuffer;x.isWebGLCubeRenderTarget?(Array.isArray(Pt[I])?z=Pt[I][W]:z=Pt[I],k=!0):x.samples>0&&Y.useMultisampledRTT(x)===!1?z=H.get(x).__webglMultisampledFramebuffer:Array.isArray(Pt)?z=Pt[W]:z=Pt,it.copy(x.viewport),Lt.copy(x.scissor),At=x.scissorTest}else it.copy(bt).multiplyScalar(et).floor(),Lt.copy(kt).multiplyScalar(et).floor(),At=oe;if(W!==0&&(z=X),g.bindFramebuffer(C.FRAMEBUFFER,z)&&g.drawBuffers(x,z),g.viewport(it),g.scissor(Lt),g.setScissorTest(At),k){const St=H.get(x.texture);C.framebufferTexture2D(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_CUBE_MAP_POSITIVE_X+I,St.__webglTexture,W)}else if(Mt){const St=I;for(let wt=0;wt<x.textures.length;wt++){const Pt=H.get(x.textures[wt]);C.framebufferTextureLayer(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0+wt,Pt.__webglTexture,W,St)}}else if(x!==null&&W!==0){const St=H.get(x.texture);C.framebufferTexture2D(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,St.__webglTexture,W)}$=-1};function pl(x){const I=H.get(x);return(I.__readFormat!==x.format||I.__readType!==x.type)&&(I.__readFormat=x.format,I.__readType=x.type,I.__formatReadable=E.textureFormatReadable(x.format),I.__typeReadable=E.textureTypeReadable(x.type)),I}this.readRenderTargetPixels=function(x,I,W,z,k,Mt,Tt,St=0){if(!(x&&x.isWebGLRenderTarget)){Jt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let wt=H.get(x).__webglFramebuffer;if(x.isWebGLCubeRenderTarget&&Tt!==void 0&&(wt=wt[Tt]),wt){g.bindFramebuffer(C.FRAMEBUFFER,wt);try{const Pt=x.textures[St],Xt=Pt.format,Kt=Pt.type;x.textures.length>1&&C.readBuffer(C.COLOR_ATTACHMENT0+St);const Rt=pl(Pt);if(Rt.__formatReadable===!1){Jt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Rt.__typeReadable===!1){Jt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}I>=0&&I<=x.width-z&&W>=0&&W<=x.height-k&&C.readPixels(I,W,z,k,gt.convert(Xt),gt.convert(Kt),Mt)}finally{const Pt=rt!==null?H.get(rt).__webglFramebuffer:null;g.bindFramebuffer(C.FRAMEBUFFER,Pt)}}},this.readRenderTargetPixelsAsync=async function(x,I,W,z,k,Mt,Tt,St=0){if(!(x&&x.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let wt=H.get(x).__webglFramebuffer;if(x.isWebGLCubeRenderTarget&&Tt!==void 0&&(wt=wt[Tt]),wt)if(I>=0&&I<=x.width-z&&W>=0&&W<=x.height-k){g.bindFramebuffer(C.FRAMEBUFFER,wt);const Pt=x.textures[St],Xt=Pt.format,Kt=Pt.type;x.textures.length>1&&C.readBuffer(C.COLOR_ATTACHMENT0+St);const Rt=pl(Pt);if(Rt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Rt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const ae=C.createBuffer();C.bindBuffer(C.PIXEL_PACK_BUFFER,ae),C.bufferData(C.PIXEL_PACK_BUFFER,Mt.byteLength,C.STREAM_READ),C.readPixels(I,W,z,k,gt.convert(Xt),gt.convert(Kt),0),C.bindBuffer(C.PIXEL_PACK_BUFFER,null);const Ee=rt!==null?H.get(rt).__webglFramebuffer:null;g.bindFramebuffer(C.FRAMEBUFFER,Ee);const ge=C.fenceSync(C.SYNC_GPU_COMMANDS_COMPLETE,0);return C.flush(),await zu(C,ge,4),C.bindBuffer(C.PIXEL_PACK_BUFFER,ae),C.getBufferSubData(C.PIXEL_PACK_BUFFER,0,Mt),C.bindBuffer(C.PIXEL_PACK_BUFFER,null),C.deleteBuffer(ae),C.deleteSync(ge),Mt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(x,I=null,W=0){const z=Math.pow(2,-W),k=Math.floor(x.image.width*z),Mt=Math.floor(x.image.height*z),Tt=I!==null?I.x:0,St=I!==null?I.y:0;Y.setTexture2D(x,0),C.copyTexSubImage2D(C.TEXTURE_2D,W,0,0,Tt,St,k,Mt),g.unbindTexture()},this.copyTextureToTexture=function(x,I,W=null,z=null,k=0,Mt=0){let Tt,St,wt,Pt,Xt,Kt,Rt,ae,Ee;const ge=x.isCompressedTexture?x.mipmaps[Mt]:x.image;if(W!==null)Tt=W.max.x-W.min.x,St=W.max.y-W.min.y,wt=W.isBox3?W.max.z-W.min.z:1,Pt=W.min.x,Xt=W.min.y,Kt=W.isBox3?W.min.z:0;else{const ye=Math.pow(2,-k);Tt=Math.floor(ge.width*ye),St=Math.floor(ge.height*ye),x.isDataArrayTexture?wt=ge.depth:x.isData3DTexture?wt=Math.floor(ge.depth*ye):wt=1,Pt=0,Xt=0,Kt=0}z!==null?(Rt=z.x,ae=z.y,Ee=z.z):(Rt=0,ae=0,Ee=0);const de=gt.convert(I.format),Ie=gt.convert(I.type);let Et;I.isData3DTexture?(Y.setTexture3D(I,0),Et=C.TEXTURE_3D):I.isDataArrayTexture||I.isCompressedArrayTexture?(Y.setTexture2DArray(I,0),Et=C.TEXTURE_2D_ARRAY):(Y.setTexture2D(I,0),Et=C.TEXTURE_2D),g.activeTexture(C.TEXTURE0),g.pixelStorei(C.UNPACK_FLIP_Y_WEBGL,I.flipY),g.pixelStorei(C.UNPACK_PREMULTIPLY_ALPHA_WEBGL,I.premultiplyAlpha),g.pixelStorei(C.UNPACK_ALIGNMENT,I.unpackAlignment);const ze=g.getParameter(C.UNPACK_ROW_LENGTH),ee=g.getParameter(C.UNPACK_IMAGE_HEIGHT),qe=g.getParameter(C.UNPACK_SKIP_PIXELS),un=g.getParameter(C.UNPACK_SKIP_ROWS),kn=g.getParameter(C.UNPACK_SKIP_IMAGES);g.pixelStorei(C.UNPACK_ROW_LENGTH,ge.width),g.pixelStorei(C.UNPACK_IMAGE_HEIGHT,ge.height),g.pixelStorei(C.UNPACK_SKIP_PIXELS,Pt),g.pixelStorei(C.UNPACK_SKIP_ROWS,Xt),g.pixelStorei(C.UNPACK_SKIP_IMAGES,Kt);const gi=x.isDataArrayTexture||x.isData3DTexture,he=I.isDataArrayTexture||I.isData3DTexture;if(x.isDepthTexture){const ye=H.get(x),Hn=H.get(I),me=H.get(ye.__renderTarget),Gn=H.get(Hn.__renderTarget);g.bindFramebuffer(C.READ_FRAMEBUFFER,me.__webglFramebuffer),g.bindFramebuffer(C.DRAW_FRAMEBUFFER,Gn.__webglFramebuffer);for(let _i=0;_i<wt;_i++)gi&&(C.framebufferTextureLayer(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,H.get(x).__webglTexture,k,Kt+_i),C.framebufferTextureLayer(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,H.get(I).__webglTexture,Mt,Ee+_i)),C.blitFramebuffer(Pt,Xt,Tt,St,Rt,ae,Tt,St,C.DEPTH_BUFFER_BIT,C.NEAREST);g.bindFramebuffer(C.READ_FRAMEBUFFER,null),g.bindFramebuffer(C.DRAW_FRAMEBUFFER,null)}else if(k!==0||x.isRenderTargetTexture||H.has(x)){const ye=H.get(x),Hn=H.get(I);g.bindFramebuffer(C.READ_FRAMEBUFFER,F),g.bindFramebuffer(C.DRAW_FRAMEBUFFER,B);for(let me=0;me<wt;me++)gi?C.framebufferTextureLayer(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,ye.__webglTexture,k,Kt+me):C.framebufferTexture2D(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,ye.__webglTexture,k),he?C.framebufferTextureLayer(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,Hn.__webglTexture,Mt,Ee+me):C.framebufferTexture2D(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,Hn.__webglTexture,Mt),k!==0?C.blitFramebuffer(Pt,Xt,Tt,St,Rt,ae,Tt,St,C.COLOR_BUFFER_BIT,C.NEAREST):he?C.copyTexSubImage3D(Et,Mt,Rt,ae,Ee+me,Pt,Xt,Tt,St):C.copyTexSubImage2D(Et,Mt,Rt,ae,Pt,Xt,Tt,St);g.bindFramebuffer(C.READ_FRAMEBUFFER,null),g.bindFramebuffer(C.DRAW_FRAMEBUFFER,null)}else he?x.isDataTexture||x.isData3DTexture?C.texSubImage3D(Et,Mt,Rt,ae,Ee,Tt,St,wt,de,Ie,ge.data):I.isCompressedArrayTexture?C.compressedTexSubImage3D(Et,Mt,Rt,ae,Ee,Tt,St,wt,de,ge.data):C.texSubImage3D(Et,Mt,Rt,ae,Ee,Tt,St,wt,de,Ie,ge):x.isDataTexture?C.texSubImage2D(C.TEXTURE_2D,Mt,Rt,ae,Tt,St,de,Ie,ge.data):x.isCompressedTexture?C.compressedTexSubImage2D(C.TEXTURE_2D,Mt,Rt,ae,ge.width,ge.height,de,ge.data):C.texSubImage2D(C.TEXTURE_2D,Mt,Rt,ae,Tt,St,de,Ie,ge);g.pixelStorei(C.UNPACK_ROW_LENGTH,ze),g.pixelStorei(C.UNPACK_IMAGE_HEIGHT,ee),g.pixelStorei(C.UNPACK_SKIP_PIXELS,qe),g.pixelStorei(C.UNPACK_SKIP_ROWS,un),g.pixelStorei(C.UNPACK_SKIP_IMAGES,kn),Mt===0&&I.generateMipmaps&&C.generateMipmap(Et),g.unbindTexture()},this.initRenderTarget=function(x){H.get(x).__webglFramebuffer===void 0&&Y.setupRenderTarget(x)},this.initTexture=function(x){x.isCubeTexture?Y.setTextureCube(x,0):x.isData3DTexture?Y.setTexture3D(x,0):x.isDataArrayTexture||x.isCompressedArrayTexture?Y.setTexture2DArray(x,0):Y.setTexture2D(x,0),g.unbindTexture()},this.resetState=function(){J=0,V=0,rt=null,g.reset(),yt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return vn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=Qt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Qt._getUnpackColorSpace()}}const Cc={type:"change"},Zo={type:"start"},Rh={type:"end"},_r=new Cs,Pc=new Dn,c0=Math.cos(70*Gu.DEG2RAD),Ae=new L,Ge=2*Math.PI,ce={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Ia=1e-6;class h0 extends hf{constructor(t,e=null){super(t,e),this.state=ce.NONE,this.target=new L,this.cursor=new L,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:ki.ROTATE,MIDDLE:ki.DOLLY,RIGHT:ki.PAN},this.touches={ONE:Oi.ROTATE,TWO:Oi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new L,this._lastQuaternion=new Zn,this._lastTargetPosition=new L,this._quat=new Zn().setFromUnitVectors(t.up,new L(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new sc,this._sphericalDelta=new sc,this._scale=1,this._panOffset=new L,this._rotateStart=new at,this._rotateEnd=new at,this._rotateDelta=new at,this._panStart=new at,this._panEnd=new at,this._panDelta=new at,this._dollyStart=new at,this._dollyEnd=new at,this._dollyDelta=new at,this._dollyDirection=new L,this._mouse=new at,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=d0.bind(this),this._onPointerDown=u0.bind(this),this._onPointerUp=f0.bind(this),this._onContextMenu=S0.bind(this),this._onMouseWheel=g0.bind(this),this._onKeyDown=_0.bind(this),this._onTouchStart=v0.bind(this),this._onTouchMove=x0.bind(this),this._onMouseDown=p0.bind(this),this._onMouseMove=m0.bind(this),this._interceptControlDown=M0.bind(this),this._interceptControlUp=y0.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(t){this._cursorStyle=t,t==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(t){super.connect(t),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=ce.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();const t=this.domElement.getRootNode();t.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),t.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Cc),this.update(),this.state=ce.NONE}pan(t,e){this._pan(t,e),this.update()}dollyIn(t){this._dollyIn(t),this.update()}dollyOut(t){this._dollyOut(t),this.update()}rotateLeft(t){this._rotateLeft(t),this.update()}rotateUp(t){this._rotateUp(t),this.update()}update(t=null){const e=this.object.position;Ae.copy(e).sub(this.target),Ae.applyQuaternion(this._quat),this._spherical.setFromVector3(Ae),this.autoRotate&&this.state===ce.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=Ge:n>Math.PI&&(n-=Ge),s<-Math.PI?s+=Ge:s>Math.PI&&(s-=Ge),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=a!=this._spherical.radius}if(Ae.setFromSpherical(this._spherical),Ae.applyQuaternion(this._quatInverse),e.copy(this.target).add(Ae),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){const o=Ae.length();a=this._clampDistance(o*this._scale);const c=o-a;this.object.position.addScaledVector(this._dollyDirection,c),this.object.updateMatrixWorld(),r=!!c}else if(this.object.isOrthographicCamera){const o=new L(this._mouse.x,this._mouse.y,0);o.unproject(this.object);const c=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=c!==this.object.zoom;const l=new L(this._mouse.x,this._mouse.y,0);l.unproject(this.object),this.object.position.sub(l).add(o),this.object.updateMatrixWorld(),a=Ae.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(_r.origin.copy(this.object.position),_r.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(_r.direction))<c0?this.object.lookAt(this.target):(Pc.setFromNormalAndCoplanarPoint(this.object.up,this.target),_r.intersectPlane(Pc,this.target))))}else if(this.object.isOrthographicCamera){const a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>Ia||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Ia||this._lastTargetPosition.distanceToSquared(this.target)>Ia?(this.dispatchEvent(Cc),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?Ge/60*this.autoRotateSpeed*t:Ge/60/60*this.autoRotateSpeed}_getZoomScale(t){const e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){Ae.setFromMatrixColumn(e,0),Ae.multiplyScalar(-t),this._panOffset.add(Ae)}_panUp(t,e){this.screenSpacePanning===!0?Ae.setFromMatrixColumn(e,1):(Ae.setFromMatrixColumn(e,0),Ae.crossVectors(this.object.up,Ae)),Ae.multiplyScalar(t),this._panOffset.add(Ae)}_pan(t,e){const n=this.domElement;if(this.object.isPerspectiveCamera){const s=this.object.position;Ae.copy(s).sub(this.target);let r=Ae.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*r/n.clientHeight,this.object.matrix),this._panUp(2*e*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const n=this.domElement.getBoundingClientRect(),s=t-n.left,r=e-n.top,a=n.width,o=n.height;this._mouse.x=s/a*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(Ge*this._rotateDelta.x/e.clientHeight),this._rotateUp(Ge*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(Ge*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(-Ge*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(Ge*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(-Ge*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panStart.set(n,s)}}_handleTouchStartDolly(t){const e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{const n=this._getSecondPointerPosition(t),s=.5*(t.pageX+n.x),r=.5*(t.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(Ge*this._rotateDelta.x/e.clientHeight),this._rotateUp(Ge*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){const e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const a=(t.pageX+e.x)*.5,o=(t.pageY+e.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new at,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){const e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){const e=t.deltaMode,n={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}}function u0(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function d0(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function f0(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Rh),this.state=ce.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:const t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function p0(i){let t;switch(i.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case ki.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=ce.DOLLY;break;case ki.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=ce.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=ce.ROTATE}break;case ki.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=ce.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=ce.PAN}break;default:this.state=ce.NONE}this.state!==ce.NONE&&this.dispatchEvent(Zo)}function m0(i){switch(this.state){case ce.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case ce.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case ce.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function g0(i){this.enabled===!1||this.enableZoom===!1||this.state!==ce.NONE||(i.preventDefault(),this.dispatchEvent(Zo),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(Rh))}function _0(i){this.enabled!==!1&&this._handleKeyDown(i)}function v0(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case Oi.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=ce.TOUCH_ROTATE;break;case Oi.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=ce.TOUCH_PAN;break;default:this.state=ce.NONE}break;case 2:switch(this.touches.TWO){case Oi.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=ce.TOUCH_DOLLY_PAN;break;case Oi.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=ce.TOUCH_DOLLY_ROTATE;break;default:this.state=ce.NONE}break;default:this.state=ce.NONE}this.state!==ce.NONE&&this.dispatchEvent(Zo)}function x0(i){switch(this._trackPointer(i),this.state){case ce.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case ce.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case ce.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case ce.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=ce.NONE}}function S0(i){this.enabled!==!1&&i.preventDefault()}function M0(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function y0(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const Lc=["#168b78","#4676b7","#b17c36","#8e68ad","#be6578","#6c8f42","#398eac","#a17358"],Un=Math.PI*2,vr=2e3,b0=(i,t)=>((i-t+Math.PI)%Un+Un)%Un-Math.PI;function Ch(i,t){const e=i.yaw+i.curvature*t;return Math.abs(i.curvature)<1e-12?[i.x+t*Math.cos(i.yaw),i.y+t*Math.sin(i.yaw),e]:[i.x+(Math.sin(e)-Math.sin(i.yaw))/i.curvature,i.y+(Math.cos(i.yaw)-Math.cos(e))/i.curvature,e]}function Ko(i,t){if(!i?.length)return{alt:0,phase:"approach_layer"};if(t<=i[0].s)return i[0];if(t>=i.at(-1).s)return i.at(-1);let e=0,n=i.length-1;for(;n-e>1;){const o=e+n>>1;i[o].s<=t?e=o:n=o}const s=i[e],r=i[n],a=(t-s.s)/(r.s-s.s);return{alt:s.alt+(r.alt-s.alt)*a,phase:a<.5?s.phase:r.phase}}function Jo(i){if(i.motions?.length)return i.motions;let t=0;return(i.path||[]).slice(1).map((e,n)=>{const s=i.path[n],r=b0(e[2],s[2]),a=Math.hypot(e[0]-s[0],e[1]-s[1]),o=a>1e-9?2*Math.sin(r/2)/a:0,c=Math.abs(r)<1e-10?a:r/o,l={x:s[0],y:s[1],yaw:s[2],length:c,curvature:o,s_start:t};return t+=c,l})}function Ph(i){const t=i.path||[],e=Jo({path:t});let n=0;return t.map(([s,r,a],o)=>{o&&(n+=e[o-1].length);const c=Ko(i.trajectory,n);return{x:s,y:r,yaw:a,s:n,z:c.alt,phase:c.phase}})}function E0(i,t){const e=Math.max(1,Math.ceil(Math.abs(i.curvature*i.length)/.025)),n=new Set(Array.from({length:e+1},(s,r)=>i.length*r/e));for(const s of t||[]){const r=s.s-i.s_start;r>1e-7&&r<i.length-1e-7&&n.add(r)}return[...n].sort((s,r)=>s-r).map(s=>{const[r,a]=Ch(i,s),o=Ko(t,i.s_start+s);return{x:r,y:a,z:o.alt,phase:o.phase}})}function T0(i,t){if(!i.trajectory?.length)return null;const e=i.trajectory,n=e.at(-1).time;if(t>=n){const d=e.at(-1);return{x:d.x,y:d.y,z:d.alt,yaw:d.yaw,finished:!0}}const s=n>0?e.at(-1).s/n:0,r=Math.max(0,t*s),a=Jo(i);let o=0,c=a.length;for(;o<c;){const d=o+c>>1;a[d].s_start+a[d].length<r?o=d+1:c=d}const l=a[Math.min(o,a.length-1)];if(!l)return{x:e[0].x,y:e[0].y,z:e[0].alt,yaw:e[0].yaw,finished:!0};const[u,f,h]=Ch(l,Math.min(l.length,Math.max(0,r-l.s_start)));return{x:u,y:f,z:Ko(e,r).alt,yaw:h,finished:!1}}function A0(i){if(i.type==="polygon")return i.vertices;if(i.type==="circle")return Array.from({length:80},(e,n)=>[i.center[0]+i.radius*Math.cos(Un*n/80),i.center[1]+i.radius*Math.sin(Un*n/80)]);const t=(i.rotation_deg||0)*Math.PI/180;return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([e,n])=>{const s=e*i.width/2,r=n*i.height/2;return[i.center[0]+s*Math.cos(t)-r*Math.sin(t),i.center[1]+s*Math.sin(t)+r*Math.cos(t)]})}function w0(i){const t=10**Math.floor(Math.log10(Math.max(1,i))),e=i/t;return(e<=1?1:e<=2?2:e<=5?5:10)*t}class R0{constructor(t,{onSelect:e}={}){this.container=t,this.onSelect=e,this.offset=[0,0],this.markers=[],this.labels=[],this.time=0,this.scene=new nd,this.scene.background=new jt("#f6f8f7"),this.camera=new qo(-1,1,1,-1,1,2e7),this.camera.up.set(0,0,1),this.renderer=new l0({antialias:!0,preserveDrawingBuffer:!0}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.domElement.dataset.spatialScale="1,1,1",this.renderer.domElement.dataset.verticalExaggeration="1",this.renderer.domElement.setAttribute("aria-label","真实等比例三维航迹，XYZ空间尺度一比一比一"),this.renderer.domElement.style.cssText="display:block;width:100%;height:100%;outline:none",this.renderer.domElement.tabIndex=0,t.appendChild(this.renderer.domElement),this.controls=new h0(this.camera,this.renderer.domElement),this.controls.enableDamping=!0,this.controls.dampingFactor=.12,this.controls.maxPolarAngle=Math.PI*.495,this.controls.minDistance=1,this.controls.addEventListener("change",()=>this.resizeLabels()),this.group=new Bi,this.scene.add(this.group),this.raycaster=new cf,this.pointerStart=null,this.renderer.domElement.addEventListener("pointerdown",n=>{this.pointerStart=[n.clientX,n.clientY]}),this.renderer.domElement.addEventListener("pointerup",n=>{if(!this.pointerStart||Math.hypot(n.clientX-this.pointerStart[0],n.clientY-this.pointerStart[1])>5)return;const s=this.renderer.domElement.getBoundingClientRect();this.raycaster.setFromCamera(new at((n.clientX-s.left)/s.width*2-1,-(n.clientY-s.top)/s.height*2+1),this.camera);const r=this.raycaster.intersectObjects(this.group.children,!0).find(a=>a.object.userData.id);r&&this.onSelect?.(r.object.userData.id)}),this.observer=new ResizeObserver(()=>this.resize()),this.observer.observe(t),this.animate=()=>{this.frame=requestAnimationFrame(this.animate),t.clientWidth&&t.clientHeight&&(this.controls.update(),this.renderer.render(this.scene,this.camera))},this.animate()}vector(t,e,n=0){return new L(t-this.offset[0],e-this.offset[1],n)}line(t,e,n=1,s=!1){const r=new Pe().setFromPoints(t),a=s?new af({color:e,transparent:!0,opacity:n,dashSize:this.gridStep/12,gapSize:this.gridStep/20}):new fs({color:e,transparent:!0,opacity:n}),o=new ah(r,a);return s&&o.computeLineDistances(),this.group.add(o),o}label(t,e,n="#75847f",s=1){const r=document.createElement("canvas");r.width=512,r.height=96;const a=r.getContext("2d");a.font='500 39px "Segoe UI", "Microsoft YaHei", sans-serif',a.textAlign="center",a.textBaseline="middle",a.fillStyle=n,a.fillText(t,256,48);const o=new md(r),c=new hd(new ih({map:o,transparent:!0,depthTest:!1}));c.position.copy(e),c.userData.labelFontSize=Math.max(12,14*s),this.labels.push(c),this.group.add(c)}resizeLabels(){const t=this.container.clientHeight;if(!t)return;const e=(this.camera.top-this.camera.bottom)/this.camera.zoom/t;for(const n of this.labels){const s=n.userData.labelFontSize*96/39*e;n.scale.set(s*512/96,s,1)}}footprint(t,e="#d36d68",n=.13,s){if(!t?.length)return;const r=new gs(t.map(([o,c])=>new at(o-this.offset[0],c-this.offset[1]))),a=new tn(new Fr(r),new ds({color:e,transparent:!0,opacity:n,side:Je,depthWrite:!1}));return a.position.z=this.span*3e-5,s&&(a.userData.id=s),this.group.add(a),a}obstacleVolume(t,e,n=!1){if(!t?.length)return;const s=new gs(t.map(([l,u])=>new at(l-this.offset[0],u-this.offset[1]))),r=new Yo(s,{depth:vr,bevelEnabled:!1,steps:1}),a=l=>new ds({color:"#c67b67",transparent:!0,opacity:l,side:Je,depthWrite:!1}),o=new tn(r,[a(n?.46:.28),a(n?.32:.18)]);o.userData={id:e,obstacleHeightMeters:vr},this.group.add(o);const c=new Vl(new _d(r,30),new fs({color:n?"#a75d45":"#bc826d",transparent:!0,opacity:.8}));return c.userData.id=e,this.group.add(c),o}drawGrid(t,e){const{min:n,max:s}=t.world,r=this.gridStep,a=Math.max(r,Math.ceil(e/r)*r);this.renderer.domElement.dataset.gridStepMeters=String(r);const o=[];for(let l=Math.ceil(n/r)*r;l<=s;l+=r)o.push(this.vector(l,n),this.vector(l,s),this.vector(n,l),this.vector(s,l)),this.label(`${l/1e3}`,this.vector(l,n-r*.23),"#81908a",.78),this.label(`${l/1e3}`,this.vector(n-r*.23,l),"#81908a",.78);const c=new Vl(new Pe().setFromPoints(o),new fs({color:"#dce4df",transparent:!0,opacity:.8}));this.group.add(c),this.line([this.vector(n,n),this.vector(s,n)],"#9caaa2"),this.line([this.vector(n,n),this.vector(n,s)],"#9caaa2"),this.line([this.vector(n,n),this.vector(n,n,a)],"#9caaa2");for(let l=r;l<=a;l+=r)this.line([this.vector(n,n,l),this.vector(n+r*.07,n,l)],"#9caaa2"),this.label(`${l/1e3}`,this.vector(n-r*.25,n,l),"#81908a",.78);this.label("X / km",this.vector(s+r*.28,n)),this.label("Y / km",this.vector(n,s+r*.28)),this.label("Z / km",this.vector(n,n,a+r*.2))}update(t,e,n={}){if(!t)return;this.currentScene=t,this.currentResult=e,this.options=n,this.clear();const{min:s,max:r}=t.world;this.span=Math.max(r-s,1),this.offset=[(s+r)/2,(s+r)/2],this.gridStep=w0(this.span/7);const a=Math.max(t.sweep.altitude,...t.aircraft.map(h=>h.altitude),vr);this.renderer.domElement.dataset.obstacleHeightMeters=String(vr),this.drawGrid(t,a);const[o,c]=t.sweep.center,l=t.sweep.size/2,u=[[o-l,c-l],[o+l,c-l],[o+l,c+l],[o-l,c+l]];this.footprint(u,"#138c7c",.08),this.line([...u,u[0]].map(([h,d])=>this.vector(h,d)),"#208c7e",.6,!0),this.line([...u,u[0]].map(([h,d])=>this.vector(h,d,t.sweep.altitude)),"#208c7e",.65,!0);for(const h of t.obstacles){const d=A0(h);if(this.obstacleVolume(d,h.id,n.selectedId===h.id),n.showClearance){const S=t.aircraft.find(m=>m.id===n.selectedId)?.overrides?.obstacle_margin??t.defaults.obstacle_margin;if(h.type==="circle"){const m=Array.from({length:81},(p,y)=>this.vector(h.center[0]+(h.radius+S)*Math.cos(Un*y/80),h.center[1]+(h.radius+S)*Math.sin(Un*y/80),2));this.line(m,"#cf9c86",.55,!0)}else for(let m=0;m<d.length;m++){const p=d[m],y=d[(m+1)%d.length],w=Math.hypot(y[0]-p[0],y[1]-p[1]);if(!w)continue;const M=-(y[1]-p[1])/w*S,b=(y[0]-p[0])/w*S;this.footprint([[p[0]+M,p[1]+b],[y[0]+M,y[1]+b],[y[0]-M,y[1]-b],[p[0]-M,p[1]-b]],"#d9aa93",.025),this.footprint(Array.from({length:40},(T,R)=>[p[0]+S*Math.cos(Un*R/40),p[1]+S*Math.sin(Un*R/40)]),"#d9aa93",.025)}}}const f=new Map((e?.aircraft||[]).map(h=>[h.id,h]));t.aircraft.forEach((h,d)=>{if(!h.enabled)return;const _=f.get(h.id),S=Lc[d%Lc.length],m=!n.selectedId||n.selectedId===h.id,p=m?1:.27,y=!n.hiddenAircraftIds?.has(h.id),w=y&&_?.status==="success"?Jo(_):[];for(const v of w){const A=E0(v,_.trajectory).map(P=>({position:this.vector(P.x,P.y,P.z),phase:P.phase}));for(let P=1;P<A.length;P++){const U=A[P-1].phase;n.showApproach===!1&&U==="approach_layer"||n.showSweep===!1&&U==="sweep"||n.showTurns===!1&&["turn_layer","entry_transition","exit_transition"].includes(U)||this.line([A[P-1].position,A[P].position],S,p)}}if(y&&n.showPoints&&_?.status==="success"&&_.path?.length){const v=new Pe().setFromPoints(Ph(_).map(P=>this.vector(P.x,P.y,P.z))),A=new pd(v,new oh({color:S,size:m?9:8,sizeAttenuation:!1,transparent:!0,opacity:Math.max(p,.7),depthTest:!1,depthWrite:!1}));A.userData={id:h.id,outputWaypoints:!0},this.group.add(A)}const M=new Bi,b=this.span*(n.selectedId===h.id?.006:.0045),T=new gs([new at(b*1.5,0),new at(-b,b*.72),new at(-b*.65,0),new at(-b,-b*.72)]),R=new tn(new Fr(T),new ds({color:S,side:Je,transparent:!0,opacity:m?1:.45,depthTest:!1}));R.userData.id=h.id,M.add(R),M.userData={aircraft:h,route:y?_:null,id:h.id},this.group.add(M),this.markers.push(M)}),this.setTime(this.time),this.hasFit||(this.fit(),this.hasFit=!0),this.resize()}setTime(t){this.time=t;for(const e of this.markers){const{aircraft:n,route:s}=e.userData,r=s?.status==="success"?T0(s,t):null;e.position.copy(this.vector(r?.x??n.x,r?.y??n.y,r?.z??n.altitude)),e.rotation.z=r?.yaw??n.heading_deg*Math.PI/180}}fit(){if(!this.currentScene)return;const t=this.span;this.viewHeight=t*1.15;const e=new L(0,0,this.currentScene.sweep.altitude/2);this.controls.target.copy(e),this.camera.position.copy(e.clone().add(new L(t*.9,-t*1.05,t*.8))),this.camera.zoom=1,this.camera.lookAt(e),this.controls.update(),this.resize()}zoom(t){this.camera.zoom=Math.max(.02,Math.min(100,this.camera.zoom*t)),this.camera.updateProjectionMatrix(),this.resizeLabels()}resize(){const t=this.container.clientWidth,e=this.container.clientHeight;if(!t||!e)return;const n=(this.viewHeight||1e5)/2,s=t/e;this.camera.left=-n*s,this.camera.right=n*s,this.camera.top=n,this.camera.bottom=-n,this.camera.updateProjectionMatrix(),this.renderer.setSize(t,e,!1),this.resizeLabels()}capture(){return this.renderer.render(this.scene,this.camera),this.renderer.domElement.toDataURL("image/png")}clear(){this.markers=[],this.labels=[];for(const t of[...this.group.children])t.traverse(e=>{e.geometry?.dispose();const n=Array.isArray(e.material)?e.material:e.material?[e.material]:[];for(const s of n)s.map?.dispose(),s.dispose()}),this.group.remove(t)}dispose(){cancelAnimationFrame(this.frame),this.observer.disconnect(),this.controls.dispose(),this.clear(),this.renderer.dispose(),this.renderer.domElement.remove()}}const Z=i=>document.querySelector(i),Kn=i=>[...document.querySelectorAll(i)],En=i=>structuredClone(i),Tn=["#168b78","#4676b7","#b17c36","#8e68ad","#be6578","#6c8f42","#398eac","#a17358"],fe=i=>String(i??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]),ie=i=>`<svg class="icon" aria-hidden="true"><use href="#i-${i}"/></svg>`,xe=(i,t=1)=>Number.isFinite(Number(i))?Number(i).toLocaleString("zh-CN",{maximumFractionDigits:t,minimumFractionDigits:t}):"—",_s=i=>{const t=Math.max(0,Math.floor(Number(i)||0)),e=Math.floor(t/3600);return`${e?`${String(e).padStart(2,"0")}:`:""}${String(Math.floor(t/60)%60).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`},Qo=i=>`${i}_${crypto.randomUUID().slice(0,8)}`,D={scene:null,presets:[],result:null,resultSignature:"",selectedId:null,hiddenAircraftIds:new Set,panel:"scene",view:"2d",tool:"select",history:[],future:[],job:null,running:!1,cancelling:!1,time:0,duration:0,playing:!1,display:{showPoints:!1,showClearance:!0,showApproach:!0,showSweep:!0,showTurns:!0}};let en=null,Po=0,Na=0,Lh=0;const Ye=new iu(Z("#map-pane"),{onChange:Yi,onSelect:pi,onStatus:({x:i,y:t,message:e})=>{if(e){be(e);return}Z("#pointer-coordinates").textContent=`X ${xe(i/1e3,2)}   Y ${xe(t/1e3,2)} km`},onDraftChange:()=>{Z("#draw-hint").hidden=["select","pan"].includes(D.tool)}}),C0=new ResizeObserver(()=>{const i=Z(".main-stage").clientHeight-Z(".stage-toolbar").clientHeight-12;Z("#view-settings").style.setProperty("--layer-menu-height",`${Math.max(80,i)}px`)});C0.observe(Z(".main-stage"));const Or=i=>JSON.stringify(i),Jn=()=>!!(D.result&&Or(D.scene)!==D.resultSignature),Dh=(i,t)=>t.split(".").reduce((e,n)=>e?.[n],i);function P0(i,t,e){const n=t.split("."),s=n.pop();let r=i;for(const a of n)r[a]??={},r=r[a];e===void 0?delete r[s]:r[s]=e}function be(i,t="info"){const e=document.createElement("div");e.className=`toast ${t}`,e.innerHTML=`${ie(t==="success"?"check":"info")}<span>${fe(i)}</span><button class="icon-button small" aria-label="关闭提示">${ie("close")}</button>`,e.querySelector("button").onclick=()=>e.remove(),Z("#toast-stack").append(e),setTimeout(()=>e.remove(),t==="error"?9e3:4500)}async function $i(i,t){const e=await fetch(i,t),n=await e.text();let s;try{s=n?JSON.parse(n):{}}catch{throw Error("规划服务返回了无法识别的数据。")}if(!e.ok){const r=s.detail||s.error||s;throw Error(typeof r=="string"?r:r.message||s.message||`请求失败（${e.status}）`)}return s}function $r(i){if(!i||i.version!==1)throw Error("场景文件版本应为1。");if(!i.world||![i.world.min,i.world.max].every(Number.isFinite)||i.world.max<=i.world.min)throw Error("世界边界无效。");if(!i.sweep||!Array.isArray(i.sweep.center)||i.sweep.center.length!==2||!i.sweep.center.every(Number.isFinite)||!(i.sweep.size>0)||!(i.sweep.spacing>0))throw Error("任务区域或扫掠间距无效。");if(!Array.isArray(i.aircraft)||!i.aircraft.length||i.aircraft.length>30)throw Error("场景应包含1–30架无人机。");if(!Array.isArray(i.obstacles)||i.obstacles.length>100)throw Error("障碍物列表无效或超过100个。");const t=new Set;for(const e of i.aircraft){if(!e.id||t.has(e.id)||![e.x,e.y,e.heading_deg,e.altitude].every(Number.isFinite))throw Error("无人机编号应唯一，初始状态应为有效数字。");t.add(e.id),e.overrides||={},e.enabled=e.enabled!==!1}for(const e of i.obstacles){if(!e.id||t.has(e.id))throw Error("所有对象的编号应唯一。");if(t.add(e.id),e.type==="polygon"){if(!Array.isArray(e.vertices)||e.vertices.length<3||e.vertices.length>100||!e.vertices.every(n=>Array.isArray(n)&&n.length===2&&n.every(Number.isFinite)))throw Error("多边形至少需要三个有效顶点。")}else if(["circle","rectangle"].includes(e.type)){if(!Array.isArray(e.center)||e.center.length!==2||!e.center.every(Number.isFinite))throw Error("障碍物中心无效。");if(e.type==="circle"?!(e.radius>0):!(e.width>0&&e.height>0&&Number.isFinite(e.rotation_deg||0)))throw Error("障碍物尺寸无效。")}else throw Error("未知障碍物类型。")}if(!i.defaults||![i.defaults.speed,i.defaults.min_turn_radius,i.defaults.climb_rate].every(e=>Number.isFinite(e)&&e>0)||![i.defaults.obstacle_margin,i.defaults.layer_hold_time].every(e=>Number.isFinite(e)&&e>=0))throw Error("飞行性能参数缺失或无效。");if(!i.sampling||!(i.sampling.sample_step>0)||!(i.sampling.max_arc_angle_deg>0&&i.sampling.max_arc_angle_deg<=90)||!i.search||!(i.search.timeout_s>0&&i.search.timeout_s<=30)||!(i.search.max_expansions>0&&i.search.max_expansions<=1e5)||!(i.search.shortcut_attempts>=0&&i.search.shortcut_attempts<=500))throw Error("输出参数或搜索预算无效。");if(i.sweep.size/i.sweep.spacing>200)throw Error("扫掠线数量不能超过200条，请增大扫掠间距。");i.name||="未命名场景",i.assignment||="distance",i.sweep.orientation||="auto"}async function Ih(){Z("#connection-error").hidden=!0;try{const[i,t]=await Promise.all([$i("/api/default-scene"),$i("/api/presets")]);$r(i),D.scene=i,D.presets=t.presets||[],D.history=[],D.future=[],D.selectedId=null,Z("#scene-name").disabled=!1,Zi(),Ye.fit(),Z("#footer-status").textContent="本地服务已连接"}catch(i){Z("#connection-error").hidden=!1,Z("#connection-error span").textContent=`无法连接本地规划服务：${i.message}`,Z("#configuration-body").innerHTML=`<div class="panel-empty">${ie("info")}<strong>等待规划服务</strong><p>启动本地服务后重试连接。</p></div>`,Z("#footer-status").textContent="规划服务未连接"}}function jo(){D.selectedId!=="sweep"&&![...D.scene.aircraft,...D.scene.obstacles].some(i=>i.id===D.selectedId)&&(D.selectedId=null)}function Yi(i,t="修改场景"){!D.scene||Or(i)===Or(D.scene)||(D.history.push(En(D.scene)),D.history.length>80&&D.history.shift(),D.future=[],D.scene=i,jo(),Qn(),Zi(),Z("#footer-status").textContent=t)}function je(i,t){const e=En(D.scene);i(e),Yi(e,t)}function Nh(){D.history.length&&(D.future.push(En(D.scene)),D.scene=D.history.pop(),jo(),Qn(),Zi())}function Lo(){D.future.length&&(D.history.push(En(D.scene)),D.scene=D.future.pop(),jo(),Qn(),Zi())}function pi(i){D.selectedId=typeof i=="object"?i?.id||null:i,kh(),Kn("[data-object-id]").forEach(t=>t.classList.toggle("selected",t.dataset.objectId===D.selectedId)),Kn("#result-rows tr").forEach(t=>t.classList.toggle("selected",t.dataset.aircraftId===D.selectedId)),mi()}function ve(i,t,{unit:e="",scale:n=1,min:s,max:r,step:a="any",type:o="number",disabled:c=!1,value:l=Dh(D.scene,t)}={}){return a=t.endsWith("max_expansions")||t.endsWith("shortcut_attempts")?1:"any",`<label class="field"><span>${fe(i)}${e?`<small>${e}</small>`:""}</span><input type="${o}" data-edit="${t}" data-scale="${n}" value="${fe(l==null?"":o==="number"?+(Number(l)/n).toFixed(5):l)}" ${s==null?"":`min="${s}"`} ${r==null?"":`max="${r}"`} step="${a}" ${c?"disabled":""} required></label>`}function Uh(i,t,e){return`<label class="field full-width"><span>${i}</span><select data-edit="${t}">${e.map(([n,s])=>`<option value="${n}" ${Dh(D.scene,t)===n?"selected":""}>${s}</option>`).join("")}</select></label>`}function xr(i,t,e=!0){return`<details class="configuration-section" ${e?"open":""}><summary><span>${i}</span>${ie("chevron")}</summary><div class="section-content">${t}</div></details>`}const Fh=[["speed","巡航速度","m/s",1,1],["min_turn_radius","最小转弯半径","km",1e3,.05],["climb_rate","升降率","m/s",1,.1],["obstacle_margin","障碍净空","km",1e3,0],["layer_hold_time","本机高度保持","s",1,0]],L0=[["auto","自动选择"],["horizontal","水平扫掠"],["vertical","垂直扫掠"]];function Oh(){return`<div class="form-grid">${ve("中心 X","sweep.center.0",{unit:"km",scale:1e3,step:.1})}${ve("中心 Y","sweep.center.1",{unit:"km",scale:1e3,step:.1})}${ve("区域边长","sweep.size",{unit:"km",scale:1e3,min:.1,step:.5})}${ve("扫掠间距","sweep.spacing",{unit:"km",scale:1e3,min:.05,step:.1})}${ve("目标高度","sweep.altitude",{unit:"m",min:0,step:100})}${Uh("扫掠方向","sweep.orientation",L0)}</div>`}function Bh(i){return{circle:"圆形障碍",rectangle:"旋转矩形",polygon:"多边形障碍"}[i.type]}function D0(i){return i.type==="circle"?`半径 ${xe(i.radius/1e3)} km`:i.type==="rectangle"?`${xe(i.width/1e3)} × ${xe(i.height/1e3)} km · ${xe(i.rotation_deg||0,0)}°`:`${i.vertices.length} 个顶点`}function zh(){if(!D.scene)return;const i=D.scene;Kn(".configuration-tabs button").forEach(t=>t.classList.toggle("active",t.dataset.panel===D.panel)),Z("#fleet-count").textContent=i.aircraft.filter(t=>t.enabled).length,D.panel==="scene"?Z("#configuration-body").innerHTML=`<div class="presets-block"><label class="field"><span>预置场景</span><select id="preset-select"><option value="">选择预置场景…</option>${D.presets.map(t=>`<option value="${fe(t.id)}">${fe(t.name)}</option>`).join("")}</select></label><p class="preset-description">从预置场景开始，或直接在画布中编辑。</p></div>${xr("任务区域",`<div class="section-subheading"><span>方形覆盖区域</span><button class="text-button" data-select="sweep">选择区域 ${ie("target")}</button></div>${Oh()}${Uh("任务分配依据","assignment",[["distance","航程均衡"],["time","飞行时间均衡"]])}`)}${xr("统一飞行性能",`<div class="form-grid">${Fh.map(([t,e,n,s,r])=>ve(e,`defaults.${t}`,{unit:n,scale:s,min:r})).join("")}</div><p class="field-note">各机默认继承，可在对象属性中单独覆盖。</p>`)}${xr("航点输出",`<div class="segmented sampling-presets">${[["fine","精细"],["standard","标准"],["sparse","稀疏"]].map(([t,e])=>`<button data-sampling="${t}" class="${i.sampling.preset===t?"active":""}">${e}</button>`).join("")}</div><div class="form-grid">${ve("最大弧长间隔","sampling.sample_step",{unit:"m",min:1,step:10})}${ve("最大转角间隔","sampling.max_arc_angle_deg",{unit:"°",min:.1,max:90,step:.5})}</div><p class="field-note">直线只保留端点；圆弧按上述间隔采样。</p>`)}${xr("世界与搜索预算",`<div class="form-grid">${ve("世界下界","world.min",{unit:"km",scale:1e3,step:10})}${ve("世界上界","world.max",{unit:"km",scale:1e3,step:10})}${ve("搜索时间预算","search.timeout_s",{unit:"s",min:.1,max:30,step:1})}${ve("最大扩展状态","search.max_expansions",{min:1,max:1e5,step:1e3})}${ve("捷径优化次数","search.shortcut_attempts",{min:0,max:500,step:10})}</div>`,!1)}`:D.panel==="fleet"?Z("#configuration-body").innerHTML=`<div class="list-panel-intro"><div><h3>无人机编组</h3><p>启用的无人机参与任务分配。</p></div><button class="icon-button" data-action="add-aircraft" title="添加无人机">${ie("plus")}</button></div><div class="fleet-count-control"><label for="aircraft-count">配置数量</label><input id="aircraft-count" type="number" min="1" max="30" step="1" value="${i.aircraft.length}"><span>架</span></div><div class="object-list">${i.aircraft.map((t,e)=>`<div class="object-row ${D.selectedId===t.id?"selected":""}" data-object-id="${fe(t.id)}"><label class="enable-check" title="参与规划"><input type="checkbox" data-enable="${fe(t.id)}" ${t.enabled?"checked":""} aria-label="启用${fe(t.name)}"></label><button class="object-select" data-select="${fe(t.id)}"><span class="aircraft-mini" style="--aircraft-color:${Tn[e%Tn.length]}">${ie("plane")}</span><span><strong>${fe(t.name)}</strong><small>${xe(t.altitude,0)} m · ${xe(t.heading_deg,0)}°${Object.keys(t.overrides||{}).length?" · 独立参数":""}</small></span>${ie("chevron")}</button></div>`).join("")}</div><button class="button full-width add-object" data-action="add-aircraft">${ie("plus")}添加无人机</button>`:Z("#configuration-body").innerHTML=`<div class="list-panel-intro"><div><h3>障碍物场</h3><p>选择对象调整几何属性。</p></div><span class="count-badge">${i.obstacles.length}</span></div><div class="obstacle-actions"><button class="button" data-action="random-obstacles">${ie("refresh")}随机生成</button><button class="button quiet" data-action="clear-obstacles" ${i.obstacles.length?"":"disabled"}>${ie("trash")}清空</button></div><div class="drawing-cards"><button data-set-tool="circle">${ie("circle")}圆形</button><button data-set-tool="rectangle">${ie("rectangle")}矩形</button><button data-set-tool="polygon">${ie("polygon")}多边形</button></div><div class="object-list obstacle-list">${i.obstacles.map((t,e)=>`<button class="object-row obstacle-select ${D.selectedId===t.id?"selected":""}" data-select="${fe(t.id)}" data-object-id="${fe(t.id)}"><span class="obstacle-mini">${ie(t.type)}</span><span><strong>${Bh(t)} ${String(e+1).padStart(2,"0")}</strong><small>${D0(t)}</small></span>${ie("chevron")}</button>`).join("")||'<div class="inline-empty">暂无障碍物。使用上方工具在画布中绘制。</div>'}</div>`}function I0(i){return i.status==="failed"?`<div class="inspector-section failure-detail"><span class="status-badge failed">规划失败</span><strong>规划未完成</strong><p>${fe(i.error?.message||"未找到可行航迹。")}</p><small>发生阶段：${fe(Do(i.error?.stage))}</small>${i.error?.details?`<details><summary>详细信息</summary><pre>${fe(typeof i.error.details=="string"?i.error.details:JSON.stringify(i.error.details,null,2))}</pre></details>`:""}</div>`:i.status!=="success"?'<div class="inspector-section"><span class="status-badge idle">未参与规划</span></div>':`<div class="inspector-section"><div class="section-subheading"><h3>规划统计</h3><span class="status-badge ${Jn()?"outdated":"success"}">${Jn()?"已过期":"完成"}</span></div><dl class="stat-list"><div><dt>任务航程</dt><dd>${xe(i.stats?.path_length_m/1e3)} km</dd></div><div><dt>飞行时间</dt><dd>${_s(i.stats?.flight_time_s)}</dd></div><div><dt>输出航点</dt><dd>${xe(i.stats?.output_points,0)}</dd></div><div><dt title="参考接近与实际接入搜索，不包含扫掠连接内部搜索">接近扩展</dt><dd>${xe(i.stats?.expanded_nodes,0)}</dd></div><div><dt>规划耗时</dt><dd>${xe(i.stats?.planning_time_s,2)} s</dd></div></dl></div>`}function kh(){if(!D.scene)return;const i=D.scene,t=i.aircraft.findIndex(r=>r.id===D.selectedId),e=i.obstacles.findIndex(r=>r.id===D.selectedId);let n="任务概览",s="";if(Z("#clear-selection").hidden=!D.selectedId,t>=0){const r=i.aircraft[t],a=`aircraft.${t}`;n=r.name,s=`<div class="selection-type"><span class="aircraft-mini" style="--aircraft-color:${Tn[t%Tn.length]}">${ie("plane")}</span><span>无人机 / ${fe(r.id)}</span></div><div class="inspector-section"><h3>初始状态</h3>${ve("名称",`${a}.name`,{type:"text"})}<div class="form-grid">${ve("位置 X",`${a}.x`,{unit:"km",scale:1e3,step:.1})}${ve("位置 Y",`${a}.y`,{unit:"km",scale:1e3,step:.1})}${ve("初始高度",`${a}.altitude`,{unit:"m",min:0,step:100})}${ve("起始航向",`${a}.heading_deg`,{unit:"°",step:5})}</div><label class="check-row"><input type="checkbox" data-enable="${fe(r.id)}" ${r.enabled?"checked":""}>参与本次规划</label></div><div class="inspector-section"><div class="section-subheading"><h3>逐机性能覆盖</h3><button class="text-button" data-action="reset-overrides">全部继承</button></div><p class="field-note">勾选后使用独立值，其余继承统一配置。</p>${Fh.map(([c,l,u,f,h])=>{const d=Object.hasOwn(r.overrides||{},c);return`<div class="override-field"><label class="override-toggle"><input type="checkbox" data-override="${c}" ${d?"checked":""}><span>${l}</span></label><label class="override-value"><input type="number" aria-label="${l}独立值（${u}）" data-edit="${a}.overrides.${c}" data-scale="${f}" value="${+(Number(d?r.overrides[c]:i.defaults[c])/f).toFixed(4)}" min="${h}" step="any" ${d?"":"disabled"} required><small>${u}</small></label></div>`}).join("")}</div>`;const o=D.result?.aircraft.find(c=>c.id===r.id);o&&(s+=I0(o)),s+=`<div class="inspector-object-actions"><button class="button" data-action="duplicate-selection">${ie("copy")}复制</button><button class="button quiet danger-text" data-action="delete-selection" ${i.aircraft.length<=1?"disabled":""}>${ie("trash")}删除</button></div>`}else if(e>=0){const r=i.obstacles[e],a=`obstacles.${e}`;n=Bh(r),s=`<div class="selection-type obstacle">${ie(r.type)}<span>${fe(r.id)}</span></div><div class="inspector-section"><h3>几何属性</h3>`,r.type!=="polygon"?s+=`<div class="form-grid">${ve("中心 X",`${a}.center.0`,{unit:"km",scale:1e3,step:.1})}${ve("中心 Y",`${a}.center.1`,{unit:"km",scale:1e3,step:.1})}${r.type==="circle"?ve("障碍半径",`${a}.radius`,{unit:"km",scale:1e3,min:.05,step:.1}):`${ve("宽度",`${a}.width`,{unit:"km",scale:1e3,min:.1,step:.1})}${ve("高度",`${a}.height`,{unit:"km",scale:1e3,min:.1,step:.1})}${ve("旋转角",`${a}.rotation_deg`,{unit:"°",step:5,value:r.rotation_deg||0})}`}</div>`:s+=`<p class="field-note">按边界顺序排列，坐标单位为 km。</p><div class="vertices-table"><div class="vertices-heading"><span>顶点</span><span>X</span><span>Y</span><span></span></div>${r.vertices.map((o,c)=>`<div class="vertex-row"><span>${String(c+1).padStart(2,"0")}</span><input aria-label="顶点${c+1} X" type="number" data-edit="${a}.vertices.${c}.0" data-scale="1000" value="${+(o[0]/1e3).toFixed(3)}" step="any" required><input aria-label="顶点${c+1} Y" type="number" data-edit="${a}.vertices.${c}.1" data-scale="1000" value="${+(o[1]/1e3).toFixed(3)}" step="any" required><button class="icon-button small" data-remove-vertex="${c}" title="删除顶点" ${r.vertices.length<=3?"disabled":""}>${ie("close")}</button></div>`).join("")}</div><button class="button full-width add-object" data-action="add-vertex">${ie("plus")}在闭合边插入顶点</button>`,s+=`</div><div class="inspector-note">${ie("info")}<span>净空按当前选中飞机显示；未选飞机时显示统一默认值。拖动控制点可调整尺寸、旋转角或顶点。</span></div><div class="inspector-object-actions"><button class="button" data-action="duplicate-selection">${ie("copy")}复制</button><button class="button quiet danger-text" data-action="delete-selection">${ie("trash")}删除</button></div>`}else if(D.selectedId==="sweep")n="扫掠任务区域",s=`<div class="selection-type">${ie("target")}<span>正方形覆盖任务</span></div><div class="inspector-section"><h3>任务区几何</h3>${Oh()}</div><div class="inspector-note">${ie("info")}<span>拖动区域调整中心，拖动角点改变边长。升降和掉头均在任务区外完成。</span></div>`;else{const r=i.aircraft.filter(a=>a.enabled).length;s=`<div class="overview-emblem">${ie("target")}</div><div class="overview-title">从任务区域<br>到完整飞行航迹</div><p class="overview-copy">配置区域与机队，在画布中编辑环境，生成满足转弯半径、净空及高度约束的航迹。</p><div class="overview-stats"><div><strong>${r}<small> / ${i.aircraft.length}</small></strong><span>参与规划的无人机</span></div><div><strong>${xe((i.sweep.size/1e3)**2,0)}<small> km²</small></strong><span>任务区域面积</span></div><div><strong>${i.obstacles.length}</strong><span>静态障碍物</span></div></div><div class="inspector-note">${ie("cursor")}<span>点击画布中的无人机、任务区或障碍物，查看并精确编辑其属性。</span></div><div class="phase-key"><h3>任务高度阶段</h3><span><i style="--phase:#829b87"></i>保持本机高度接近任务区</span><span><i style="--phase:#c19a59"></i>区外直线升降</span><span><i style="--phase:#168b78"></i>目标高度扫掠</span><span><i style="--phase:#7d75a5"></i>本机高度转弯与离场</span></div>`}Z("#selection-title").textContent=n,Z("#inspector-body").innerHTML=s}function Zi(){D.scene&&(Z("#scene-name").value=D.scene.name,zh(),kh(),N0(),Yr(),Ts(),mi())}function Ts(){const i=Jn(),t=D.scene.aircraft.filter(e=>e.enabled).length;Z("#plan-button").disabled=D.running||!t,Z("#plan-button").hidden=D.running,Z("#plan-button").classList.toggle("needs-planning",!D.result||i),Z("#plan-button span").textContent=D.result?i?"重新生成航迹":"再次规划":"生成航迹",Z("#cancel-plan").hidden=!D.running,Z("#cancel-plan").disabled=D.cancelling,Z("#cancel-plan").textContent=D.cancelling?"正在取消…":"取消规划",Z("#scene-state").className=`state-pill ${D.running?"working":i?"warning":D.result?"success":"neutral"}`,Z("#scene-state").textContent=D.running?"计算中":i?"待重新规划":D.result?"结果已更新":"尚未规划",Z("#stale-badge").hidden=!i,Z("#undo-button").disabled=!D.history.length,Z("#redo-button").disabled=!D.future.length,Z("#scene-statistics").textContent=`${t} 架无人机 · ${D.scene.obstacles.length} 个障碍物 · ${(D.scene.world.max-D.scene.world.min)/1e3} km 世界范围`}function mi(){if(!D.scene)return;const i={...D.display,hiddenAircraftIds:D.hiddenAircraftIds,selectedId:D.selectedId,resultStale:Jn()};if(Ye.update(D.scene,D.result,i),en)try{en.update(D.scene,D.result,i),en.setTime(D.time)}catch(t){console.error(t)}D.view==="altitude"&&Ls()}function Hh(){const i=new Map((D.scene?.aircraft||[]).map(t=>[t.id,t]));for(const t of D.result?.aircraft||[])i.set(t.id,t);return[...i.values()]}function Yr(){Z("#path-visibility-list").innerHTML=Hh().map((i,t)=>`<label><input type="checkbox" data-path-visibility="${fe(i.id)}" ${D.hiddenAircraftIds.has(i.id)?"":"checked"}><span class="color-dot" style="background:${Tn[t%Tn.length]}"></span><span>${fe(i.name||i.id)}</span></label>`).join(""),Kn("[data-path-visibility]").forEach(i=>{i.checked=!D.hiddenAircraftIds.has(i.dataset.pathVisibility)})}function Gh(i,t){t?D.hiddenAircraftIds.delete(i):D.hiddenAircraftIds.add(i),Yr(),mi()}function Vh(i){if(D.view=i,Kn(".view-tabs button").forEach(t=>{t.classList.toggle("active",t.dataset.view===i),t.setAttribute("aria-selected",String(t.dataset.view===i))}),Z("#map-pane").hidden=i!=="2d",Z("#three-pane").hidden=i!=="3d",Z("#altitude-pane").hidden=i!=="altitude",Z("#drawing-toolbar").hidden=i!=="2d",Z("#viewport-caption").hidden=i==="altitude",Z("#zoom-in").hidden=i!=="2d",Z("#zoom-out").hidden=i!=="2d",Z("#viewport-caption span:nth-child(2)").textContent=i==="3d"?"等比例三维空间":"平面任务空间",Z("#viewport-caption span:last-child").textContent=i==="3d"?"XYZ · km":"XY · km",Z("#editor-hint").textContent=i==="2d"?"滚轮缩放 · 空格平移 · 选择后拖动控制点":i==="3d"?"拖动旋转 · 右键平移 · 滚轮缩放 · XYZ 等比例":"横轴真实航程 · 纵轴实际高度 · 点击曲线选机",i==="3d"&&!en)try{en=new R0(Z("#three-pane"),{onSelect:pi})}catch(t){be(`三维视图初始化失败：${t.message}`,"error")}i!=="2d"&&(Ye.setTool("select"),D.tool="select",Kn("#drawing-toolbar [data-tool]").forEach(t=>t.classList.toggle("active",t.dataset.tool==="select")),Z("#draw-hint").hidden=!0),requestAnimationFrame(()=>{Ye.resize(),en?.resize(),mi()})}function Br(i){D.view!=="2d"&&Vh("2d"),D.tool=i,Ye.setTool(i),Kn("#drawing-toolbar [data-tool]").forEach(e=>e.classList.toggle("active",e.dataset.tool===i));const t={circle:"点选圆心 → 移动确定半径 → 再次点击完成 · Esc 取消",rectangle:"点选两个对角 → 移动调整旋转角 → 点击完成 · Shift 吸附",polygon:"连续点选顶点 → 点击起点、双击或 Enter 闭合 · Esc 取消"};Z("#draw-hint").textContent=t[i]||"",Z("#draw-hint").hidden=!t[i]}function N0(){const i=D.result;if(Z("#export-results").disabled=!i,!i)return;const t=i.aircraft.filter(r=>r.status==="success"),e=i.aircraft.filter(r=>r.status==="failed"),n=t.reduce((r,a)=>r+(a.stats?.path_length_m||0),0),s=t.reduce((r,a)=>r+(a.stats?.output_points||0),0);Z("#result-summary").textContent=`${t.length} 架完成${e.length?` · ${e.length} 架失败`:""}`,Z("#result-status").innerHTML=`<span class="status-badge ${Jn()?"outdated":e.length?"failed":"success"}">${Jn()?"快照已过期":e.length?t.length?"部分完成":"规划失败":"全部完成"}</span>`,Z("#result-metrics").hidden=!1,Z("#result-metrics").innerHTML=`<div><span>总航程</span><strong>${xe(n/1e3)}<small>km</small></strong></div><div><span>任务时长</span><strong>${_s(D.duration)}</strong></div><div><span>输出航点</span><strong>${xe(s,0)}</strong></div><div><span>总规划耗时</span><strong>${xe(i.planning_time_s,2)}<small>s</small></strong></div>`,Z("#result-rows").innerHTML=i.aircraft.map((r,a)=>{const o=r.status==="success",c=r.status==="failed",l=r.stats||{};return`<tr data-aircraft-id="${fe(r.id)}" class="${D.selectedId===r.id?"selected":""}"><td><button class="result-aircraft" data-select="${fe(r.id)}"><span class="color-dot" style="background:${Tn[a%Tn.length]}"></span>${fe(r.name||r.id)}</button></td><td><label class="result-path-toggle"><input type="checkbox" data-path-visibility="${fe(r.id)}" aria-label="显示${fe(r.name||r.id)}的路径" ${D.hiddenAircraftIds.has(r.id)?"":"checked"} ${o?"":"disabled"}><span>显示</span></label></td><td><span class="status-badge ${r.status}">${o?"规划完成":c?"规划失败":"未参与"}</span></td><td>${o?`${xe(l.path_length_m/1e3)} <small>km</small>`:"—"}</td><td>${o?_s(l.flight_time_s):"—"}</td><td>${o?`${xe(l.output_points,0)} <span class="muted">/ ${xe(l.trajectory_points??r.trajectory?.length,0)}</span>`:"—"}</td><td>${o?xe(l.expanded_nodes,0):"—"}</td><td>${l.planning_time_s!=null?`${xe(l.planning_time_s,2)} <small>s</small>`:"—"}</td><td>${c?`<button class="error-link" data-select="${fe(r.id)}">${fe(r.error?.message||"查看失败信息")}</button>`:o?'<span class="result-valid">几何与高度校验通过</span>':"—"}</td></tr>`}).join(""),Z("#altitude-empty").hidden=t.length>0,Z("#play-button").disabled=!D.duration,Z("#reset-playback").disabled=!D.duration,Z("#time-slider").disabled=!D.duration,Z("#time-slider").max=D.duration||1,Z("#playback-duration").textContent=_s(D.duration)}function Do(i){return{reference:"参考接近",validation:"航迹校验",idle:"未分配",success:"本机完成",failed:"本机失败",finished:"任务结束",preparing:"准备任务",queued:"等待计算",validating:"校验场景",planning:"规划航迹",approach:"规划接近航迹",sweep:"连接扫掠航迹",altitude:"生成高度剖面",completed:"规划完成",cancelled:"规划已取消",assigning:"分配扫掠任务",searching:"混合搜索"}[i]||i||"正在规划"}async function Wh(){if(!D.scene||D.running)return;try{$r(En(D.scene))}catch(t){be(t.message,"error");return}Qn(),D.running=!0,D.cancelling=!1,Z("#planning-overlay").hidden=!1,Z("#planning-stage").textContent="提交规划任务",Z("#planning-progress").textContent="",Z("#planning-progress-bar").style.width="2%",Ts();const i=En(D.scene);try{const t=await $i("/api/plan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({scene:i})});D.job={id:t.job_id,snapshot:i},D.cancelling&&await $i(`/api/jobs/${encodeURIComponent(D.job.id)}`,{method:"DELETE"}),await Xh()}catch(t){Io(),be(`无法启动规划：${t.message}`,"error")}}async function Xh(){if(D.job)try{const i=await $i(`/api/jobs/${encodeURIComponent(D.job.id)}`),t=i.progress||{};Z("#planning-stage").textContent=Do(t.stage);const e=D.job.snapshot.aircraft.find(n=>n.id===t.aircraft_id)?.name||t.aircraft_id;if(Z("#planning-progress").textContent=`${e?`${e} · `:""}${t.completed||0} / ${t.total||D.scene.aircraft.filter(n=>n.enabled).length}`,Z("#planning-progress-bar").style.width=`${Math.max(4,Math.min(100,(t.completed||0)/Math.max(1,t.total||1)*100))}%`,Z("#footer-status").textContent=Do(t.stage),["running","queued"].includes(i.status)){Lh=setTimeout(Xh,500);return}if(i.result){D.result=i.result,D.resultSignature=Or(D.job.snapshot),D.duration=Math.max(Number(i.result.duration_s)||0,...i.result.aircraft.map(s=>s.trajectory?.at(-1)?.time||0)),D.time=0;const n=i.result.aircraft.filter(s=>s.status==="failed");be(n.length?`规划结束：${n.length} 架未完成，请查看失败详情。`:"航迹规划完成，几何与高度约束已校验。",n.length?"info":"success")}else i.status==="failed"?be(`规划失败：${i.error?.message||i.error||"请检查配置。"}`,"error"):i.status==="cancelled"&&be("规划任务已取消。");Io(),As(D.time),Zi()}catch(i){Io(),be(`读取规划状态失败：${i.message}`,"error")}}function Io(){clearTimeout(Lh),D.running=!1,D.cancelling=!1,D.job=null,Z("#planning-overlay").hidden=!0,D.scene&&Ts(),Z("#footer-status").textContent="本地服务已连接"}async function U0(){if(!(!D.running||D.cancelling)&&(D.cancelling=!0,Ts(),!!D.job))try{await $i(`/api/jobs/${encodeURIComponent(D.job.id)}`,{method:"DELETE"})}catch(i){D.cancelling=!1,Ts(),be(`取消失败：${i.message}`,"error")}}function As(i){D.time=Math.max(0,Math.min(D.duration,i)),Z("#time-slider").value=D.time,Z("#playback-time").textContent=_s(D.time),Ye.setTime(D.time),en?.setTime(D.time),D.view==="altitude"&&Ls()}function Qn(){D.playing=!1,cancelAnimationFrame(Po),Z("#play-button").innerHTML=ie("play"),Z("#play-button").setAttribute("aria-label","播放任务")}function F0(){if(!D.duration)return;if(D.playing){Qn();return}D.time>=D.duration&&As(0),D.playing=!0,Na=performance.now(),Z("#play-button").innerHTML=ie("pause"),Z("#play-button").setAttribute("aria-label","暂停播放");const i=t=>{D.playing&&(As(D.time+(t-Na)/1e3*Number(Z("#playback-speed").value)),Na=t,D.time>=D.duration?Qn():Po=requestAnimationFrame(i))};Po=requestAnimationFrame(i)}function Ls(){const i=Z("#altitude-canvas"),t=Z("#altitude-pane").getBoundingClientRect();if(!t.width||!t.height)return;const e=Math.min(devicePixelRatio||1,2);i.width=Math.round(t.width*e),i.height=Math.round(t.height*e),i.style.width=`${t.width}px`,i.style.height=`${t.height}px`;const n=i.getContext("2d");i.chartGeometry=null,n.setTransform(e,0,0,e,0,0),n.fillStyle="#fbfcf9",n.fillRect(0,0,t.width,t.height);const s=D.result?.aircraft.filter(y=>y.status==="success"&&y.trajectory?.length&&!D.hiddenAircraftIds.has(y.id))||[];if(!s.length){D.result?.aircraft.some(y=>y.status==="success")&&(n.font='15px "Segoe UI","Microsoft YaHei",sans-serif',n.fillStyle="#6c8172",n.textAlign="center",n.fillText("路径已隐藏，可在图层显示中重新勾选。",t.width/2,t.height/2));return}const r=s.flatMap(y=>y.trajectory),a=D.result.scene?.sweep?.altitude??D.scene.sweep.altitude,o=Math.max(1,...s.map(y=>y.trajectory.at(-1).s));let c=a,l=a;for(const y of r)c=Math.min(c,y.alt),l=Math.max(l,y.alt);const u=Math.max(100,(l-c)*.18);c=Math.floor((c-u)/100)*100,l=Math.ceil((l+u)/100)*100;const f=Math.max(1,Math.min(4,Math.floor((t.width-100)/125))),h=Math.max(1,Math.floor((t.height-180)/22)),d=Math.min(s.length,f*h),_=Math.ceil(d/f),S={left:72,top:Math.max(72,_*22+40),width:Math.max(100,t.width-100),height:Math.max(80,t.height-Math.max(125,_*22+95))},m=y=>S.left+y/o*S.width,p=y=>S.top+(l-y)/(l-c)*S.height;n.font='13px "Segoe UI","Microsoft YaHei",sans-serif',n.fillStyle="#8a9a90";for(let y=0;y<=5;y++){const w=S.top+S.height*y/5,M=l-(l-c)*y/5;n.strokeStyle="#e5ebe4",n.beginPath(),n.moveTo(S.left,w),n.lineTo(S.left+S.width,w),n.stroke(),n.textAlign="right",n.fillText(xe(M,0),S.left-10,w+4);const b=S.left+S.width*y/5;n.beginPath(),n.moveTo(b,S.top),n.lineTo(b,S.top+S.height),n.stroke(),n.textAlign="center",n.fillText(xe(o/1e3*y/5,0),b,S.top+S.height+20)}n.textAlign="left",n.fillStyle="#678173",n.fillText("高度 / m",S.left,S.top-15),n.textAlign="right",n.fillText("真实航程 / km",S.left+S.width,t.height-15),n.setLineDash([5,4]),n.strokeStyle="#97aaa0",n.beginPath(),n.moveTo(S.left,p(a)),n.lineTo(S.left+S.width,p(a)),n.stroke(),n.setLineDash([]),n.textAlign="left",n.fillStyle="#81978a",n.fillText(`任务高度 ${xe(a,0)} m`,S.left+8,p(a)-7),s.forEach((y,w)=>{const M=Tn[D.result.aircraft.findIndex(T=>T.id===y.id)%Tn.length];if(n.globalAlpha=D.selectedId&&D.selectedId!==y.id?.25:Jn()?.55:.9,n.strokeStyle=M,n.lineWidth=D.selectedId===y.id?2.8:1.8,n.beginPath(),y.trajectory.forEach((T,R)=>R?n.lineTo(m(T.s),p(T.alt)):n.moveTo(m(T.s),p(T.alt))),n.stroke(),D.display.showPoints){n.fillStyle="#fff",n.strokeStyle=M,n.lineWidth=1.5;for(const T of Ph(y))n.beginPath(),n.arc(m(T.s),p(T.z),4,0,Math.PI*2),n.fill(),n.stroke()}const b=Dc(y.trajectory,D.time);if(b&&(n.beginPath(),n.arc(m(b.s),p(b.alt),4,0,Math.PI*2),n.fillStyle=M,n.fill(),n.strokeStyle="#fff",n.lineWidth=1.5,n.stroke()),n.globalAlpha=1,w<d){const T=S.width/f,R=S.left+w%f*T,v=22+Math.floor(w/f)*22;n.fillStyle=M,n.fillRect(R,v-5,13,2),n.fillStyle="#597062";let A=w===d-1&&s.length>d?`另${s.length-d+1}架`:y.name||y.id;for(;A.length>2&&n.measureText(A).width>T-24;)A=A.slice(0,-2)+"…";n.fillText(A,R+18,v)}}),i.chartGeometry={bounds:S,y:p,aircraft:s,maxDistance:o}}function zr(i,t,e){const n=URL.createObjectURL(new Blob([t],{type:e})),s=document.createElement("a");s.href=n,s.download=i,s.click(),setTimeout(()=>URL.revokeObjectURL(n),1e3)}const kr=(i=D.scene)=>String(i?.name||"HybridSweep").replace(/[<>:"/\\|?*]/g,"_");function O0(){D.scene&&zr(`${kr()}-场景.json`,JSON.stringify(D.scene,null,2)+`
`,"application/json;charset=utf-8")}function B0(i){if(D.result){if(i==="json")zr(`${kr(D.result.scene)}-规划结果.json`,JSON.stringify(D.result,null,2)+`
`,"application/json;charset=utf-8");else{const t=n=>`"${String(n??"").replaceAll('"','""')}"`,e=[["aircraft_id","aircraft_name","x_m","y_m","altitude_m","yaw_rad","distance_m","time_s","phase"]];for(const n of D.result.aircraft)for(const s of n.trajectory||[])e.push([n.id,n.name,s.x,s.y,s.alt,s.yaw,s.s,s.time,s.phase]);zr(`${kr(D.result.scene)}-高度轨迹.csv`,"\uFEFF"+e.map(n=>n.map(t).join(",")).join(`\r
`)+`\r
`,"text/csv;charset=utf-8")}Z("#export-dialog").close()}}function z0(){try{const i=D.view==="3d"?en?.capture():D.view==="altitude"?Z("#altitude-canvas").toDataURL("image/png"):Ye.capture();if(!i)return;if(!i.startsWith("data:image/png;base64,"))throw Error("视图尚未准备好，请稍后重试。");const t=atob(i.slice(i.indexOf(",")+1)),e=Uint8Array.from(t,n=>n.charCodeAt(0));zr(`${kr()}-${D.view}-${Math.round(D.time)}s.png`,e,"image/png"),be("当前视图已导出为PNG。","success")}catch(i){be(`截图失败：${i.message}`,"error")}}function $h(i){const t=i.aircraft.length,e=i.aircraft.at(-1)||{x:1e4,y:1e4,altitude:2e3,heading_deg:45};return{id:Qo("aircraft"),name:`无人机 ${String(t+1).padStart(2,"0")}`,x:e.x+1e3,y:e.y+1e3,heading_deg:e.heading_deg,altitude:e.altitude+200,enabled:!0,overrides:{}}}function k0(){if(D.scene.aircraft.length>=30){be("最多配置30架无人机。");return}let i;je(t=>{const e=$h(t);t.aircraft.push(e),i=e.id},"添加无人机"),pi(i)}function Yh(){if(!D.selectedId||D.selectedId==="sweep")return;if(D.scene.aircraft.find(t=>t.id===D.selectedId)&&D.scene.aircraft.length<=1){be("至少保留一架无人机。");return}je(t=>{t.aircraft=t.aircraft.filter(e=>e.id!==D.selectedId),t.obstacles=t.obstacles.filter(e=>e.id!==D.selectedId)},"删除对象")}function H0(){const i=D.scene.aircraft.find(n=>n.id===D.selectedId),t=D.scene.obstacles.find(n=>n.id===D.selectedId);if(!i&&!t)return;if(i&&D.scene.aircraft.length>=30||t&&D.scene.obstacles.length>=100){be("对象数量已达上限。");return}let e;je(n=>{const s=En(i||t);s.id=Qo(i?"aircraft":"obstacle"),e=s.id,i?(s.name+=" 副本",s.x+=2e3,s.y+=2e3,n.aircraft.push(s)):(s.type==="polygon"?s.vertices=s.vertices.map(r=>r.map(a=>a+2e3)):s.center=s.center.map(r=>r+2e3),n.obstacles.push(s))},"复制对象"),pi(e)}function G0(i){const t=new FormData(i),e=Number(t.get("count")),n=Number(t.get("seed")),s=Number(t.get("minRadius"))*1e3,r=Number(t.get("maxRadius"))*1e3;if(s>r){be("最小半径不能大于最大半径。","error");return}let a=n>>>0;const o=()=>{a=a+1831565813>>>0;let S=Math.imul(a^a>>>15,1|a);return S^=S+Math.imul(S^S>>>7,61|S),((S^S>>>14)>>>0)/4294967296},c=[],l=En(D.scene),u=l.defaults.obstacle_margin,[f,h]=l.sweep.center,d=l.sweep.size/2,_=Math.min(e,100-(t.has("replace")?0:l.obstacles.length));for(let S=0;c.length<_&&S<e*1e3;S++){const m=s+o()*(r-s),p=l.world.min+m+u,y=l.world.max-m-u;if(p>=y)break;const w=p+o()*(y-p),M=p+o()*(y-p),b=Math.max(f-d,Math.min(f+d,w)),T=Math.max(h-d,Math.min(h+d,M));Math.hypot(w-b,M-T)<m+u+l.defaults.min_turn_radius||l.aircraft.some(R=>Math.hypot(w-R.x,M-R.y)<m+u+2e3)||c.some(R=>Math.hypot(w-R.center[0],M-R.center[1])<m+R.radius+u)||c.push({id:`random_${n}_${c.length+1}_${t.has("replace")?"r":Qo("a").slice(-5)}`,type:"circle",center:[Math.round(w),Math.round(M)],radius:Math.round(m)})}l.obstacles=t.has("replace")?c:[...l.obstacles,...c],Yi(l,`随机生成障碍物，种子${n}`),Z("#random-dialog").close(),be(c.length===e?`已生成${e}个障碍物，随机种子${n}。`:`可用空间或数量受限，已生成${c.length}/${e}个障碍物。`,c.length===e?"success":"info")}function tl(i){const t=i.target;if(t.dataset.pathVisibility)Gh(t.dataset.pathVisibility,t.checked);else if(t.dataset.edit){if(t.type==="number"&&!t.checkValidity()){t.reportValidity();return}const e=t.dataset.edit;let n=t.type==="number"?Number(t.value)*Number(t.dataset.scale||1):t.value;if(t.type==="number"&&!Number.isFinite(n))return;t.type==="text"&&(n=n.trim()||"未命名"),je(s=>{P0(s,e,n),e.startsWith("sampling.")&&(s.sampling.preset="custom")},"修改任务参数")}else if(t.dataset.enable)je(e=>{e.aircraft.find(n=>n.id===t.dataset.enable).enabled=t.checked},"调整参与规划的无人机");else if(t.dataset.override){const e=t.dataset.override;je(n=>{const s=n.aircraft.find(r=>r.id===D.selectedId);s.overrides||={},t.checked?s.overrides[e]=n.defaults[e]:delete s.overrides[e]},"调整逐机性能覆盖")}else if(t.id==="aircraft-count"){if(!t.checkValidity()){t.reportValidity();return}const e=Number(t.value),n=En(D.scene);for(e<n.aircraft.length&&(n.aircraft=n.aircraft.slice(0,e));n.aircraft.length<e;)n.aircraft.push($h(n));Yi(n,"调整无人机数量")}else if(t.id==="preset-select"){const e=D.presets.find(n=>n.id===t.value);if(e)try{const n=En(e.scene);$r(n),Yi(n,`载入预置场景：${e.name}`),Ye.fit(),en?.fit(),be(e.description||`已载入${e.name}。`)}catch(n){be(n.message,"error")}}}function V0(i){const t=i.target.closest("button");if(!(!t||t.disabled))if(t.hasAttribute("data-select"))pi(t.dataset.select);else if(t.dataset.panel)D.panel=t.dataset.panel,zh();else if(t.dataset.view)Vh(t.dataset.view);else if(t.dataset.tool||t.dataset.setTool)Br(t.dataset.tool||t.dataset.setTool);else if(t.dataset.sampling){const e={fine:{sample_step:60,max_arc_angle_deg:3},standard:{sample_step:150,max_arc_angle_deg:7.5},sparse:{sample_step:400,max_arc_angle_deg:12}};je(n=>{n.sampling={preset:t.dataset.sampling,...e[t.dataset.sampling]}},"调整航点采样密度")}else t.hasAttribute("data-remove-vertex")?je(e=>{e.obstacles.find(n=>n.id===D.selectedId).vertices.splice(Number(t.dataset.removeVertex),1)},"删除多边形顶点"):t.dataset.export?B0(t.dataset.export):t.hasAttribute("data-close-dialog")?t.closest("dialog").close():t.dataset.action&&{"add-aircraft":k0,"delete-selection":Yh,"duplicate-selection":H0,"random-obstacles":()=>Z("#random-dialog").showModal(),"clear-obstacles":()=>je(n=>{n.obstacles=[]},"清空障碍物"),"reset-overrides":()=>je(n=>{n.aircraft.find(s=>s.id===D.selectedId).overrides={}},"恢复统一飞行性能"),"add-vertex":()=>je(n=>{const s=n.obstacles.find(o=>o.id===D.selectedId).vertices;if(s.length>=100){be("多边形最多100个顶点。");return}const r=s[0],a=s.at(-1);s.push([(r[0]+a[0])/2,(r[1]+a[1])/2])},"添加多边形顶点")}[t.dataset.action]?.()}document.addEventListener("click",V0);Z("#configuration-body").addEventListener("change",tl);Z("#inspector-body").addEventListener("change",tl);Z("#result-rows").addEventListener("change",tl);Z("#scene-name").addEventListener("change",i=>{D.scene&&je(t=>{t.name=i.target.value.trim()||"未命名场景"},"修改场景名称")});Z("#plan-button").addEventListener("click",Wh);Z("#cancel-plan").addEventListener("click",U0);Z("#undo-button").addEventListener("click",Nh);Z("#redo-button").addEventListener("click",Lo);Z("#clear-selection").addEventListener("click",()=>pi(null));Z("#zoom-in").addEventListener("click",()=>Ye.zoom(1.4));Z("#zoom-out").addEventListener("click",()=>Ye.zoom(1/1.4));Z("#fit-view").addEventListener("click",()=>D.view==="3d"?en?.fit():D.view==="altitude"?Ls():Ye.fit());Z("#capture-button").addEventListener("click",z0);Z("#help-button").addEventListener("click",()=>Z("#help-dialog").showModal());Z("#retry-connection").addEventListener("click",Ih);Z("#view-settings-button").addEventListener("click",()=>{const i=Z("#view-settings").hidden;Z("#view-settings").hidden=!i,Z("#view-settings-button").setAttribute("aria-expanded",String(i))});Z("#view-settings").addEventListener("change",i=>{if(i.target.dataset.pathVisibility){Gh(i.target.dataset.pathVisibility,i.target.checked);return}const t=i.target.dataset.display;t&&(D.display[t]=i.target.checked,mi())});Z("#show-all-paths").addEventListener("click",()=>{D.hiddenAircraftIds.clear(),Yr(),mi()});Z("#hide-all-paths").addEventListener("click",()=>{for(const i of Hh())D.hiddenAircraftIds.add(i.id);Yr(),mi()});Z("#map-pane").addEventListener("toolchange",i=>Br(i.detail));Z("#export-scene").addEventListener("click",O0);Z("#export-results").addEventListener("click",()=>{Z("#export-description").textContent=Jn()?"当前结果对应旧场景快照；导出保留计算时的场景和轨迹。":"导出当前结果对应的场景快照及各机轨迹。",Z("#export-dialog").showModal()});Z("#import-scene").addEventListener("click",()=>Z("#scene-file").click());Z("#scene-file").addEventListener("change",async i=>{const t=i.target.files[0];if(t){try{const e=JSON.parse(await t.text());$r(e),D.scene?Yi(e,"导入场景JSON"):(D.scene=e,Z("#scene-name").disabled=!1,Zi()),Ye.fit(),en?.fit(),be("场景已导入，坐标与逐机配置已恢复。","success")}catch(e){be(`场景导入失败：${e.message}`,"error")}i.target.value=""}});Z("#random-form").addEventListener("submit",i=>{i.preventDefault(),i.target.reportValidity()&&G0(i.target)});Z("#play-button").addEventListener("click",F0);Z("#reset-playback").addEventListener("click",()=>{Qn(),As(0)});Z("#time-slider").addEventListener("input",i=>{Qn(),As(Number(i.target.value))});Z("#toggle-results").addEventListener("click",()=>{Z("#results-dock").classList.toggle("collapsed"),Z("#toggle-results").setAttribute("aria-label",Z("#results-dock").classList.contains("collapsed")?"展开结果面板":"收起结果面板"),requestAnimationFrame(()=>{Ye.resize(),en?.resize(),Ls()})});Z("#altitude-canvas").addEventListener("click",i=>{const t=i.currentTarget,e=t.chartGeometry;if(!e)return;const n=t.getBoundingClientRect(),s=i.clientX-n.left,r=i.clientY-n.top,a=(s-e.bounds.left)/e.bounds.width*e.maxDistance;let o=null;for(const c of e.aircraft){const l=c.trajectory;let u=0,f=l.length-1;for(;f-u>1;){const m=u+f>>1;l[m].s<a?u=m:f=m}const h=l[u],d=l[f],_=Math.max(0,Math.min(1,(a-h.s)/Math.max(1e-9,d.s-h.s))),S=Math.abs(e.y(h.alt+(d.alt-h.alt)*_)-r);(!o||S<o.gap)&&(o={id:c.id,gap:S})}o?.gap<24&&pi(o.id)});window.addEventListener("keydown",i=>{if(!(i.target.closest("dialog[open]")||["INPUT","TEXTAREA","SELECT"].includes(i.target.tagName)||i.target.isContentEditable)){if((i.ctrlKey||i.metaKey)&&i.key==="Enter")i.preventDefault(),Wh();else if((i.ctrlKey||i.metaKey)&&i.key.toLowerCase()==="z")i.preventDefault(),i.shiftKey?Lo():Nh();else if((i.ctrlKey||i.metaKey)&&i.key.toLowerCase()==="y")i.preventDefault(),Lo();else if(i.key==="Delete"||i.key==="Backspace")i.preventDefault(),D.scene&&Yh();else if(!i.ctrlKey&&!i.metaKey){const t={v:"select",h:"pan",c:"circle",r:"rectangle",p:"polygon"};t[i.key.toLowerCase()]&&D.scene&&Br(t[i.key.toLowerCase()]),i.key==="Escape"&&Br("select")}}});window.addEventListener("resize",()=>{D.view==="altitude"&&Ls()});document.addEventListener("click",i=>{i.target.closest("#view-settings,#view-settings-button")||(Z("#view-settings").hidden=!0,Z("#view-settings-button").setAttribute("aria-expanded","false"))});for(const i of Kn("dialog"))i.addEventListener("click",t=>{if(t.target===i){const e=i.getBoundingClientRect();(t.clientX<e.left||t.clientX>e.right||t.clientY<e.top||t.clientY>e.bottom)&&i.close()}});Ih();
