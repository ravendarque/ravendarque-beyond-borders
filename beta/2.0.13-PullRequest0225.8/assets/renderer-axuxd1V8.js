const Pe={chrome:268435456,firefox:1073676289,safari:16777216,default:16777216};function he(){const e=navigator.userAgent.toLowerCase();return e.includes("chrome")||e.includes("edge")?"chrome":e.includes("firefox")?"firefox":e.includes("safari")&&!e.includes("chrome")?"safari":"default"}function Se(){const e=he();return Pe[e]}function Te(e,r){const t=Se(),a=e*r;if(a>t){const o=he(),s=Math.floor(Math.sqrt(t));throw new Error(`Canvas size ${e}x${r} (${a.toLocaleString()} pixels) exceeds ${o} limit of ${Math.floor(Math.sqrt(t))}x${Math.floor(Math.sqrt(t))} (${t.toLocaleString()} pixels). Maximum dimension: ${s}px.`)}}function xe(){try{const r=(typeof globalThis<"u"?globalThis:window).OffscreenCanvas;return typeof r=="function"&&typeof r.prototype.convertToBlob=="function"?r:void 0}catch{return}}function fe(){return xe()!==void 0}function ie(e,r){Te(e,r);const t=xe();if(t)return new t(e,r);const a=document.createElement("canvas");return a.width=e,a.height=r,a}function K(e,r){const t=ie(e,r),a=t.getContext("2d");if(!a)throw new Error("Failed to get 2D context from canvas");return{canvas:t,ctx:a}}function pe(e,r,t,a){const o=e.width,s=e.height,c=t*2,g=1+(a.imageZoom??0)/100,h=a.originalImageDimensions?.width??o,n=a.originalImageDimensions?.height??s;let u;a.circleSize&&a.circleSize>0?u=Math.max(a.circleSize/h,a.circleSize/n)*g*c/a.circleSize:u=Math.max(c/h,c/n)*g;const m=o*u,E=s*u,O=r/2+(a.imageOffsetPx?.x??0),X=r/2+(a.imageOffsetPx?.y??0);return{dx:O-m/2,dy:X-E/2,dw:m,dh:E}}async function _e(e,r="image/png",t){if(typeof e.convertToBlob=="function")return e.convertToBlob({type:r,quality:t});const a=e;return new Promise((o,s)=>{a.toBlob(c=>{c?o(c):s(new Error("Failed to convert canvas to blob"))},r,t)})}const be={STANDARD:512,PREVIEW:512,HIGH_RES:1024},Fe={DEFAULT_CIRCLE_SIZE:250},Me={BYTES_PER_KB:1024};class ye{startTime=0;marks=new Map;start(){this.startTime=performance.now(),this.marks.clear()}mark(r){this.marks.set(r,performance.now())}elapsed(){return performance.now()-this.startTime}duration(r,t){const a=this.marks.get(r),o=this.marks.get(t);return a===void 0||o===void 0?0:o-a}complete(r,t,a,o){const s=this.elapsed(),c=this.duration("start","imageLoaded"),g=this.duration("imageLoaded","renderComplete"),h=this.duration("renderComplete","exportComplete"),n=r.width*r.height*4,u=t.width*t.height*4,m=n+u;return{totalTime:s,imageLoadTime:c,renderTime:g,exportTime:h,inputSize:r,outputSize:t,wasDownsampled:a,downsampleRatio:o,estimatedMemory:m}}}function De(e,r,t,a=2){const o=t*a;if(e<=o&&r<=o)return{width:e,height:r,scale:1};const s=Math.min(o/e,o/r);return{width:Math.round(e*s),height:Math.round(r*s),scale:s}}async function Le(e,r,t){if(e.width===r&&e.height===t)return e;const{canvas:a,ctx:o}=K(r,t);return o.imageSmoothingEnabled=!0,o.imageSmoothingQuality="high",o.drawImage(e,0,0,r,t),createImageBitmap(a)}function Oe(e,r,t,a=2){return Math.max(e,r)>t*a}async function ze(e,r,t){const a=new ye,o=t.enablePerformanceTracking??!1;o&&(a.start(),a.mark("start"));const s=t.enableDownsampling??!0;let c=e,g=!1,h=1;if(s&&Oe(e.width,e.height,t.size)){const d=De(e.width,e.height,t.size);c=await Le(e,d.width,d.height),g=!0,h=d.scale,o&&a.mark("imageDownsampled")}o&&a.mark("imageLoaded"),t.onProgress?.(.2);const n=t.size,u=n,m=n,E=Math.min(u,m),O=Math.round(t.thicknessPct/100*E),X=Math.round((t.paddingPct??0)/100*E),{canvas:M,ctx:i}=K(u,m);i.imageSmoothingEnabled=!0,i.imageSmoothingQuality="high",t.backgroundColor&&(i.save(),i.fillStyle=t.backgroundColor,i.fillRect(0,0,u,m),i.restore());const P=Math.min(u,m)/2,x=P-Math.max(1,X),l=Math.max(0,x-O),N=l+1,R=(r.modes?.ring?.colors??[]).map(d=>({color:d,weight:1})),y=R.length,p=t.presentation;let _;if(p==="ring"?_="concentric":p==="segment"?_="angular":p==="cutout"?_="cutout":_="concentric",_==="cutout"){i.save();const d=c.width,F=c.height,z=N*2,q=1+(t.imageZoom??0)/100,k=t.originalImageDimensions?.width??d,v=t.originalImageDimensions?.height??F;let f;if(t.circleSize&&t.circleSize>0){const Y=Math.max(t.circleSize/k,t.circleSize/v)*q,J=z/t.circleSize;f=Y*J}else f=Math.max(z/k,z/v)*q;const D=g&&h>0?f/h:f,I=d*D,G=F*D,L=u/2,W=m/2,ee=t.imageOffsetPx?.x??0,te=t.imageOffsetPx?.y??0;i.drawImage(c,L-I/2+ee,W-G/2+te,I,G),i.globalCompositeOperation="destination-in",i.fillStyle="#ffffff",i.beginPath(),i.arc(L,W,N,0,Math.PI*2),i.closePath(),i.fill(),i.globalCompositeOperation="source-over",i.restore(),t.onProgress?.(.4);const w=t.flagOffsetPct?.x??0,A=u,H=Math.abs(w/50)*A*3,{canvas:V,ctx:C}=K(u+H,m);C.imageSmoothingEnabled=!0,C.imageSmoothingQuality="high";const Q=H/2+P;if(t.borderImageBitmap){const b=x*2,Y=b,J=r.aspectRatio??2,Z=Y*J,re=(Z-b)/2,ne=-(w/50)*re,ce=Q-Z/2+ne,le=P-Y/2;C.drawImage(t.borderImageBitmap,ce,le,Z,Y)}else{let b=0;for(const Y of R){const Z=Y.weight/y*m;C.fillStyle=Y.color,C.fillRect(0,b,V.width,Z),b+=Z}}C.globalCompositeOperation="destination-in",C.fillStyle="white",C.beginPath(),C.arc(Q,P,x,0,Math.PI*2),C.arc(Q,P,l,Math.PI*2,0,!0),C.fill(),i.drawImage(V,-H/2,0)}else{i.save();const d=c.width,F=c.height,z=N*2,q=1+(t.imageZoom??0)/100,k=t.originalImageDimensions?.width??d,v=t.originalImageDimensions?.height??F;let f;if(t.circleSize&&t.circleSize>0){const A=Math.max(t.circleSize/k,t.circleSize/v)*q,H=z/t.circleSize;f=A*H}else f=Math.max(z/k,z/v)*q;const D=g&&h>0?f/h:f,I=d*D,G=F*D,L=u/2,W=m/2,ee=t.imageOffsetPx?.x??0,te=t.imageOffsetPx?.y??0;if(i.drawImage(c,L-I/2+ee,W-G/2+te,I,G),i.globalCompositeOperation="destination-in",i.fillStyle="#ffffff",i.beginPath(),i.arc(L,W,N,0,Math.PI*2),i.closePath(),i.fill(),i.globalCompositeOperation="source-over",i.restore(),t.onProgress?.(.5),t.borderImageBitmap&&p!=="cutout"){const w=Math.max(1,Math.round(x-l)),A=(l+x)/2,V=Math.max(2,Math.round(2*Math.PI*A)),C=w;try{const{canvas:Q,ctx:b}=K(V,C),Y=t.borderImageBitmap.width,J=t.borderImageBitmap.height,Z=Math.max(V/Y,C/J),re=Math.round(Y*Z),ne=Math.round(J*Z),ce=Math.round((V-re)/2),le=Math.round((C-ne)/2);b.clearRect(0,0,V,C),b.drawImage(t.borderImageBitmap,0,0,Y,J,ce,le,re,ne);const we=await createImageBitmap(Q),Ae=t.segmentRotation!==void 0?t.segmentRotation*Math.PI/180:0,Ee=-Math.PI/2+Ae;me(i,L,l,x,we,Ee,"normal")}catch{try{me(i,L,l,x,t.borderImageBitmap)}catch{i.save(),i.globalAlpha=.64,ge(i,L,l,x,R,y),i.restore()}}}else if(_==="concentric")ge(i,L,l,x,R,y);else{const w=t.segmentRotation!==void 0?t.segmentRotation*Math.PI/180:0;let A=-Math.PI/2+w;for(const H of R){const V=H.weight/y,C=Math.PI*2*V,Q=A+C;Ue(i,L,l,x,A,Q,H.color),A=Q}}}o&&a.mark("renderComplete"),t.onProgress?.(.8),t.outerStroke&&(i.beginPath(),i.arc(u/2,m/2,x,0,Math.PI*2),i.strokeStyle=t.outerStroke.color,i.lineWidth=t.outerStroke.widthPx,i.stroke());const j=t.pngQuality??.92,U=await _e(M,"image/png",j),B=U.size,T=(B/Me.BYTES_PER_KB).toFixed(2);if(o){a.mark("exportComplete");const d=a.complete({width:e.width,height:e.height},{width:u,height:m},g,h);return t.onProgress?.(1),{blob:U,sizeBytes:B,sizeKB:T,metrics:d}}return t.onProgress?.(1),{blob:U,sizeBytes:B,sizeKB:T}}function ge(e,r,t,a,o,s){const c=a-t;let g=a;for(const h of o){const u=h.weight/s*c,m=Math.max(t,g-u);if(e.beginPath(),e.arc(r,r,g,0,Math.PI*2),e.arc(r,r,m,Math.PI*2,0,!0),e.closePath(),e.fillStyle=h.color,e.fill(),g=m,g<=t+.5)break}g>t+.5&&(e.beginPath(),e.arc(r,r,g,0,Math.PI*2),e.arc(r,r,t,Math.PI*2,0,!0),e.closePath(),e.fillStyle=o[o.length-1]?.color??"#000000",e.fill())}function Ue(e,r,t,a,o,s,c){e.beginPath(),e.arc(r,r,a,o,s),e.arc(r,r,t,s,o,!0),e.closePath(),e.fillStyle=c,e.fill()}function me(e,r,t,a,o,s=0,c="normal"){const g=a-t;if(g<=0)return;const h=(t+a)/2,n=Math.max(1,Math.round(2*Math.PI*h)),u=Math.max(1,n),m=Math.max(1,Math.round(g)),{ctx:E}=K(u,m),O=o.width,X=o.height,M=Math.max(u/O,m/X),i=Math.round(O*M),P=Math.round(X*M),x=Math.round((u-i)/2),l=Math.round((m-P)/2);E.clearRect(0,0,u,m),E.drawImage(o,0,0,O,X,x,l,i,P);const S=E.getImageData(0,0,u,m).data,R=Math.floor(r-a),y=Math.floor(r-a),p=Math.ceil(a*2),_=p,{canvas:j,ctx:U}=K(p,_),B=U.createImageData(p,_),T=B.data,d=Math.PI*2,F=1/d;for(let f=0;f<_;f++){const I=y+f+.5-r;for(let G=0;G<p;G++){const W=R+G+.5-r,ee=W*W+I*I,te=Math.sqrt(ee),w=(f*p+G)*4;if(te<t||te>a){T[w+0]=0,T[w+1]=0,T[w+2]=0,T[w+3]=0;continue}let A=Math.atan2(I,W);for(A-=s;A<0;)A+=d;for(;A>=d;)A-=d;const H=A*F*u,V=(te-t)/g*m,C=Math.min(u-1,Math.max(0,Math.floor(H))),b=(Math.min(m-1,Math.max(0,Math.floor(V)))*u+C)*4;T[w+0]=S[b+0],T[w+1]=S[b+1],T[w+2]=S[b+2],T[w+3]=S[b+3]}}if(U.putImageData(B,0,0),c==="normal"){e.save(),e.drawImage(j,R,y),e.restore();return}const{canvas:z,ctx:$}=K(p,_);$.clearRect(0,0,p,_),$.drawImage(e.canvas,R,y,p,_,0,0,p,_);const q=$.getImageData(0,0,p,_),k=q.data,v=U.getImageData(0,0,p,_).data;for(let f=0;f<k.length;f+=4)v[f+3]>8&&(k[f+3]=0);$.putImageData(q,0,0),e.save(),e.drawImage(z,R,y),e.restore()}function ue(e,r=!1){const t={alpha:!0,premultipliedAlpha:!1,preserveDrawingBuffer:r,antialias:!0};let a=e.getContext("webgl2",t);return a||(a=e.getContext("webgl",t),a)?a:e instanceof HTMLCanvasElement?e.getContext("experimental-webgl",t):null}function de(e,r,t){const a=e.createShader(t);if(!a)throw new Error(`Failed to create shader of type ${t}`);if(e.shaderSource(a,r),e.compileShader(a),!e.getShaderParameter(a,e.COMPILE_STATUS)){const o=e.getShaderInfoLog(a);throw e.deleteShader(a),new Error(`Shader compilation failed: ${o}`)}return a}function oe(e,r,t){const a=de(e,r,e.VERTEX_SHADER),o=de(e,t,e.FRAGMENT_SHADER),s=e.createProgram();if(!s)throw new Error("Failed to create program");if(e.attachShader(s,a),e.attachShader(s,o),e.linkProgram(s),!e.getProgramParameter(s,e.LINK_STATUS)){const c=e.getProgramInfoLog(s);throw e.deleteProgram(s),new Error(`Program linking failed: ${c}`)}return e.deleteShader(a),e.deleteShader(o),s}function se(e,r){const t=e.createTexture();if(!t)throw new Error("Failed to create texture");return e.bindTexture(e.TEXTURE_2D,t),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,r),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),t}function Ce(e){const r=e.createBuffer();if(!r)throw new Error("Failed to create quad buffer");const t=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);return e.bindBuffer(e.ARRAY_BUFFER,r),e.bufferData(e.ARRAY_BUFFER,t,e.STATIC_DRAW),r}const ae=`
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
  // Pass through position
  gl_Position = vec4(a_position, 0.0, 1.0);
  
  // Convert from -1..1 to 0..1 for texture coordinates
  v_texCoord = a_position * 0.5 + 0.5;
}
`;function Be(){try{const e=document.createElement("canvas");return ue(e)!==null}catch{return!1}}const ve=`
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_center;
uniform float u_imageRadius;
uniform float u_ringInnerRadius;
uniform float u_ringOuterRadius;
uniform vec2 u_resolution;
uniform int u_colorCount;
uniform vec3 u_colors[16]; // Max 16 colors

varying vec2 v_texCoord;

vec3 getColor(float index, int count) {
  int idx = int(clamp(index, 0.0, float(count - 1)));
  
  for (int i = 0; i < 16; i++) {
    if (i == idx && i < count) {
      return u_colors[i];
    }
  }
  
  return vec3(0.0);
}

void main() {
  // Flip Y so pixelCoord matches standard top-down canvas convention (WebGL's v_texCoord/NDC
  // has Y increasing upward; all position uniforms from JS assume Y increasing downward, same
  // as Canvas 2D and every other coordinate the app computes).
  vec2 pixelCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y) * u_resolution;
  vec2 pos = pixelCoord - u_center;
  float radius = length(pos);
  
  // === IMAGE LAYER ===
  vec4 imageColor = texture2D(u_image, v_texCoord);
  float imageAlpha = 1.0 - smoothstep(u_imageRadius - 2.0, u_imageRadius + 2.0, radius);
  imageColor.a *= imageAlpha;
  
  // === RING LAYER ===
  float ringInnerAlpha = smoothstep(u_ringInnerRadius - 2.0, u_ringInnerRadius + 2.0, radius);
  // Smoothstep on both edges — the outer edge must be anti-aliased here rather than relying
  // on CSS clipping, since this shader also renders to a bare OffscreenCanvas for PNG export.
  float ringOuterAlpha = 1.0 - smoothstep(u_ringOuterRadius - 2.0, u_ringOuterRadius + 2.0, radius);
  float ringAlpha = ringInnerAlpha * ringOuterAlpha;
  
  vec3 ringColor = vec3(0.0);
  if (ringAlpha > 0.001) {
    // Concentric gradient — reversed so color[0] is outermost, matching Canvas 2D renderer
    // which draws "outer->inner to preserve stripe order (top => outer)".
    float thickness = u_ringOuterRadius - u_ringInnerRadius;
    float ringPos = 1.0 - clamp((radius - u_ringInnerRadius) / thickness, 0.0, 1.0);
    
    // Divide ring into u_colorCount equal bands (not u_colorCount-1).
    // Using colorCount-1 shrinks the last band to a single anti-aliased pixel at the outer edge.
    float colorRange = float(u_colorCount);
    float colorIndex = ringPos * colorRange;
    float idx = floor(colorIndex);
    float localPos = fract(colorIndex);
    
    // 10% transition zone
    float t = smoothstep(0.9, 1.0, localPos);
    
    vec3 color1 = getColor(idx, u_colorCount);
    vec3 color2 = getColor(idx + 1.0, u_colorCount);
    ringColor = mix(color1, color2, t);
  }
  
  // === COMPOSITE ===
  // Ring on top of image (standard over operation)
  vec3 finalColor = imageColor.rgb * imageColor.a * (1.0 - ringAlpha) + ringColor * ringAlpha;
  float finalAlpha = imageColor.a + ringAlpha * (1.0 - imageColor.a);
  
  // Early exit if fully transparent
  if (finalAlpha < 0.001) {
    discard;
  }
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
`,Re=`
precision mediump float;

#define PI 3.14159265359

uniform sampler2D u_image;
uniform vec2 u_center;
uniform float u_imageRadius;
uniform float u_ringInnerRadius;
uniform float u_ringOuterRadius;
uniform vec2 u_resolution;
uniform float u_rotation;
uniform int u_colorCount;
uniform vec3 u_colors[16]; // Max 16 colors

varying vec2 v_texCoord;

vec3 getColor(float index, int count) {
  int idx = int(clamp(index, 0.0, float(count - 1)));
  
  for (int i = 0; i < 16; i++) {
    if (i == idx && i < count) {
      return u_colors[i];
    }
  }
  
  return vec3(0.0);
}

void main() {
  // Flip Y so pixelCoord matches standard top-down canvas convention (WebGL's v_texCoord/NDC
  // has Y increasing upward; all position uniforms from JS assume Y increasing downward, same
  // as Canvas 2D and every other coordinate the app computes).
  vec2 pixelCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y) * u_resolution;
  vec2 pos = pixelCoord - u_center;
  float radius = length(pos);
  // pos.y now increases downward (top-down convention, same as pixelCoord above), so angles
  // increase clockwise from the positive-x axis, matching Canvas 2D's atan2(y, x) convention.
  // Use PI/2 offset so segment 0 starts at 12 o'clock (North), matching the
  // Canvas 2D renderer which uses start = -PI/2 + rotationRad.
  float angle = atan(pos.y, pos.x);
  
  // === IMAGE LAYER ===
  vec4 imageColor = texture2D(u_image, v_texCoord);
  float imageAlpha = 1.0 - smoothstep(u_imageRadius - 2.0, u_imageRadius + 2.0, radius);
  imageColor.a *= imageAlpha;
  
  // === SEGMENT LAYER ===
  float ringInnerAlpha = smoothstep(u_ringInnerRadius - 2.0, u_ringInnerRadius + 2.0, radius);
  // Smoothstep on both edges — the outer edge must be anti-aliased here rather than relying
  // on CSS clipping, since this shader also renders to a bare OffscreenCanvas for PNG export.
  float ringOuterAlpha = 1.0 - smoothstep(u_ringOuterRadius - 2.0, u_ringOuterRadius + 2.0, radius);
  float ringAlpha = ringInnerAlpha * ringOuterAlpha;
  
  vec3 ringColor = vec3(0.0);
  if (ringAlpha > 0.001) {
    // +PI/2 shifts segment 0 to start at top (12 o'clock), matching Canvas 2D's -PI/2 start.
    // Subtracting u_rotation rotates clockwise, matching Canvas 2D's +rotationRad offset.
    float rotatedAngle = angle + (PI / 2.0) - u_rotation;
    if (rotatedAngle < 0.0) rotatedAngle += 2.0 * PI;
    if (rotatedAngle >= 2.0 * PI) rotatedAngle -= 2.0 * PI;
    
    // Calculate segment
    float segmentAngle = 2.0 * PI / float(u_colorCount);
    float segmentIndex = floor(rotatedAngle / segmentAngle);
    
    ringColor = getColor(segmentIndex, u_colorCount);
  }
  
  // === COMPOSITE ===
  // Ring on top of image
  vec3 finalColor = imageColor.rgb * imageColor.a * (1.0 - ringAlpha) + ringColor * ringAlpha;
  float finalAlpha = imageColor.a + ringAlpha * (1.0 - imageColor.a);
  
  // Early exit if fully transparent
  if (finalAlpha < 0.001) {
    discard;
  }
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
`,Ie=`
precision mediump float;

uniform sampler2D u_image;
uniform sampler2D u_flagTexture;
uniform vec2 u_center;
uniform float u_imageRadius;
uniform float u_ringInnerRadius;
uniform float u_ringOuterRadius;
uniform vec2 u_resolution;
uniform vec2 u_flagSize;
uniform vec2 u_flagPos;

varying vec2 v_texCoord;

void main() {
  // Flip Y so pixelCoord matches standard top-down canvas convention (WebGL's v_texCoord/NDC
  // has Y increasing upward; all position uniforms from JS, including u_flagPos, assume Y
  // increasing downward, same as Canvas 2D and every other coordinate the app computes).
  vec2 pixelCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y) * u_resolution;
  vec2 pos = pixelCoord - u_center;
  float radius = length(pos);
  
  // === IMAGE LAYER ===
  vec4 imageColor = texture2D(u_image, v_texCoord);
  float imageAlpha = 1.0 - smoothstep(u_imageRadius - 2.0, u_imageRadius + 2.0, radius);
  imageColor.a *= imageAlpha;
  
  // === FLAG LAYER ===
  float ringInnerAlpha = smoothstep(u_ringInnerRadius - 2.0, u_ringInnerRadius + 2.0, radius);
  // Smoothstep on both edges — the outer edge must be anti-aliased here rather than relying
  // on CSS clipping, since this shader also renders to a bare OffscreenCanvas for PNG export.
  float ringOuterAlpha = 1.0 - smoothstep(u_ringOuterRadius - 2.0, u_ringOuterRadius + 2.0, radius);
  float ringAlpha = ringInnerAlpha * ringOuterAlpha;
  
  vec4 flagColor = vec4(0.0);
  if (ringAlpha > 0.001) {
    // Map to flag rectangle UV
    vec2 flagUV = (pixelCoord - u_flagPos) / u_flagSize;
    
    // Sample flag texture if within bounds
    if (flagUV.x >= 0.0 && flagUV.x <= 1.0 && flagUV.y >= 0.0 && flagUV.y <= 1.0) {
      flagColor = texture2D(u_flagTexture, flagUV);
      flagColor.a *= ringAlpha;
    }
  }
  
  // === COMPOSITE ===
  // Flag on top of image
  vec3 finalColor = imageColor.rgb * imageColor.a * (1.0 - flagColor.a) + flagColor.rgb * flagColor.a;
  float finalAlpha = imageColor.a + flagColor.a * (1.0 - imageColor.a);
  
  // Early exit if fully transparent
  if (finalAlpha < 0.001) {
    discard;
  }
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;async function ke(e,r,t){const a=t.size,o=t.size,s=Math.min(a,be.STANDARD),c=s,g=s,h=ie(c,g),n=ue(h,!0);if(!n)throw new Error("Failed to create WebGL context");const u=Math.max(1,(t.paddingPct??0)*c/100),m=Math.max(1,t.thicknessPct*c/100),E=c/2,O=g/2,M=Math.min(c,g)/2-Math.max(1,u),i=Math.max(0,M-m),P=i;n.viewport(0,0,c,g);const x=t.presentation??"ring";let l;x==="segment"?l=oe(n,ae,Re):x==="cutout"&&t.borderImageBitmap?l=oe(n,ae,Ie):l=oe(n,ae,ve);const N=Ce(n),{canvas:S,ctx:R}=K(c,g),{dx:y,dy:p,dw:_,dh:j}=pe(e,c,P,t);R.clearRect(0,0,c,g),R.drawImage(e,y,p,_,j);const U=se(n,S),B=r.modes?.ring?.colors??[],T=[];for(const v of B){const f=parseInt(v.slice(1,3),16)/255,D=parseInt(v.slice(3,5),16)/255,I=parseInt(v.slice(5,7),16)/255;T.push(f,D,I)}n.bindFramebuffer(n.FRAMEBUFFER,null),n.clear(n.COLOR_BUFFER_BIT),n.useProgram(l);const d={u_image:n.getUniformLocation(l,"u_image"),u_center:n.getUniformLocation(l,"u_center"),u_imageRadius:n.getUniformLocation(l,"u_imageRadius"),u_ringInnerRadius:n.getUniformLocation(l,"u_ringInnerRadius"),u_ringOuterRadius:n.getUniformLocation(l,"u_ringOuterRadius"),u_resolution:n.getUniformLocation(l,"u_resolution")};n.activeTexture(n.TEXTURE0),n.bindTexture(n.TEXTURE_2D,U),n.uniform1i(d.u_image,0),n.uniform2f(d.u_center,E,O),n.uniform1f(d.u_imageRadius,P),n.uniform1f(d.u_ringInnerRadius,i),n.uniform1f(d.u_ringOuterRadius,M),n.uniform2f(d.u_resolution,c,g);let F=null;if(x==="segment"){const v=(t.segmentRotation??0)*Math.PI/180,f=n.getUniformLocation(l,"u_rotation"),D=n.getUniformLocation(l,"u_colorCount"),I=n.getUniformLocation(l,"u_colors");n.uniform1f(f,v),n.uniform1i(D,B.length),n.uniform3fv(I,new Float32Array(T))}else if(x==="cutout"&&t.borderImageBitmap){const v=t.flagOffsetPct??{x:0},f=M*2,D=t.borderImageBitmap.width/t.borderImageBitmap.height,I=f*D,G=Math.max(0,(I-f)/2),L=-(v.x/50)*G,W=E-I/2+L,ee=O-f/2;n.activeTexture(n.TEXTURE1),F=se(n,t.borderImageBitmap),n.bindTexture(n.TEXTURE_2D,F),n.uniform1i(n.getUniformLocation(l,"u_flagTexture"),1),n.uniform2f(n.getUniformLocation(l,"u_flagSize"),I,f),n.uniform2f(n.getUniformLocation(l,"u_flagPos"),W,ee)}else{const v=n.getUniformLocation(l,"u_colorCount"),f=n.getUniformLocation(l,"u_colors");n.uniform1i(v,B.length),n.uniform3fv(f,new Float32Array(T))}const z=n.getAttribLocation(l,"a_position");n.bindBuffer(n.ARRAY_BUFFER,N),n.enableVertexAttribArray(z),n.vertexAttribPointer(z,2,n.FLOAT,!1,0,0),n.drawArrays(n.TRIANGLES,0,6),n.finish();let $=h;if(a!==s){const{canvas:v,ctx:f}=K(a,o);f.imageSmoothingEnabled=!0,f.imageSmoothingQuality="high",f.drawImage(h,0,0,a,o),$=v}const q=t.pngQuality??.92,k=await _e($,"image/png",q);return F&&n.deleteTexture(F),n.deleteTexture(U),n.deleteBuffer(N),n.deleteProgram(l),{blob:k,sizeBytes:k.size,sizeKB:(k.size/1024).toFixed(2)}}class Ge{offscreen;imageCanvas;imageCtx;gl;programs;quadBuffer;size;constructor(r){if(this.size=r,!fe())throw new Error("OffscreenCanvas not supported — required for LiveAvatarRenderer");this.offscreen=ie(r,r),this.imageCanvas=ie(r,r);const t=this.imageCanvas.getContext("2d");if(!t)throw new Error("Failed to create 2D context for image pre-processing");this.imageCtx=t;const a=ue(this.offscreen);if(!a)throw new Error("WebGL not supported");this.gl=a,this.programs={ring:oe(a,ae,ve),segment:oe(a,ae,Re),cutout:oe(a,ae,Ie)},this.quadBuffer=Ce(a)}render(r,t,a){const o=this.gl,s=this.size,c=s/2,g=s/2,h=Math.max(1,a.thicknessPct*s/100),u=s/2,m=Math.max(0,u-h),E=m;o.viewport(0,0,s,s),o.clearColor(0,0,0,0),o.clear(o.COLOR_BUFFER_BIT);const O=this.preRenderImage(r,E,a);o.activeTexture(o.TEXTURE0);const X=se(o,O),M=a.presentation??"ring";let i;M==="segment"?i=this.programs.segment:M==="cutout"&&a.borderImageBitmap?i=this.programs.cutout:i=this.programs.ring,o.useProgram(i),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,X),o.uniform1i(o.getUniformLocation(i,"u_image"),0),o.uniform2f(o.getUniformLocation(i,"u_center"),c,g),o.uniform1f(o.getUniformLocation(i,"u_imageRadius"),E),o.uniform1f(o.getUniformLocation(i,"u_ringInnerRadius"),m),o.uniform1f(o.getUniformLocation(i,"u_ringOuterRadius"),u),o.uniform2f(o.getUniformLocation(i,"u_resolution"),s,s);const P=t.modes?.ring?.colors??[],x=[];for(const S of P)x.push(parseInt(S.slice(1,3),16)/255,parseInt(S.slice(3,5),16)/255,parseInt(S.slice(5,7),16)/255);let l=null;if(M==="segment"){const S=(a.segmentRotation??0)*Math.PI/180;o.uniform1f(o.getUniformLocation(i,"u_rotation"),S),o.uniform1i(o.getUniformLocation(i,"u_colorCount"),P.length),o.uniform3fv(o.getUniformLocation(i,"u_colors"),new Float32Array(x))}else if(M==="cutout"&&a.borderImageBitmap){const S=a.flagOffsetPct??{x:0},R=u*2,y=a.borderImageBitmap.width/a.borderImageBitmap.height,p=R*y,_=Math.max(0,(p-R)/2),j=-(S.x/50)*_,U=c-p/2+j,B=g-R/2;o.activeTexture(o.TEXTURE1),l=se(o,a.borderImageBitmap),o.bindTexture(o.TEXTURE_2D,l),o.uniform1i(o.getUniformLocation(i,"u_flagTexture"),1),o.uniform2f(o.getUniformLocation(i,"u_flagSize"),p,R),o.uniform2f(o.getUniformLocation(i,"u_flagPos"),U,B)}else o.uniform1i(o.getUniformLocation(i,"u_colorCount"),P.length),o.uniform3fv(o.getUniformLocation(i,"u_colors"),new Float32Array(x));const N=o.getAttribLocation(i,"a_position");return o.bindBuffer(o.ARRAY_BUFFER,this.quadBuffer),o.enableVertexAttribArray(N),o.vertexAttribPointer(N,2,o.FLOAT,!1,0,0),o.drawArrays(o.TRIANGLES,0,6),o.deleteTexture(X),l&&o.deleteTexture(l),this.offscreen.transferToImageBitmap()}preRenderImage(r,t,a){const o=this.size,s=this.imageCtx;s.clearRect(0,0,o,o);const{dx:c,dy:g,dw:h,dh:n}=pe(r,o,t,a);return s.drawImage(r,c,g,h,n),this.imageCanvas}static isSupported(){return Be()&&fe()}destroy(){const r=this.gl;r.deleteProgram(this.programs.ring),r.deleteProgram(this.programs.segment),r.deleteProgram(this.programs.cutout),r.deleteBuffer(this.quadBuffer)}}export{Fe as I,Ge as L,be as R,ze as a,K as b,_e as c,Be as i,ke as r};
