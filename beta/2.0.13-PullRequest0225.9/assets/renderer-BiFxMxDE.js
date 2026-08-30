const Pe={chrome:268435456,firefox:1073676289,safari:16777216,default:16777216};function he(){const e=navigator.userAgent.toLowerCase();return e.includes("chrome")||e.includes("edge")?"chrome":e.includes("firefox")?"firefox":e.includes("safari")&&!e.includes("chrome")?"safari":"default"}function Se(){const e=he();return Pe[e]}function Te(e,r){const t=Se(),a=e*r;if(a>t){const o=he(),s=Math.floor(Math.sqrt(t));throw new Error(`Canvas size ${e}x${r} (${a.toLocaleString()} pixels) exceeds ${o} limit of ${Math.floor(Math.sqrt(t))}x${Math.floor(Math.sqrt(t))} (${t.toLocaleString()} pixels). Maximum dimension: ${s}px.`)}}function xe(){try{const r=(typeof globalThis<"u"?globalThis:window).OffscreenCanvas;return typeof r=="function"&&typeof r.prototype.convertToBlob=="function"?r:void 0}catch{return}}function fe(){return xe()!==void 0}function ie(e,r){Te(e,r);const t=xe();if(t)return new t(e,r);const a=document.createElement("canvas");return a.width=e,a.height=r,a}function J(e,r){const t=ie(e,r),a=t.getContext("2d");if(!a)throw new Error("Failed to get 2D context from canvas");return{canvas:t,ctx:a}}function pe(e,r,t,a){const o=e.width,s=e.height,c=t*2,f=1+(a.imageZoom??0)/100,m=a.originalImageDimensions?.width??o,n=a.originalImageDimensions?.height??s;let u;a.circleSize&&a.circleSize>0?u=Math.max(a.circleSize/m,a.circleSize/n)*f*c/a.circleSize:u=Math.max(c/m,c/n)*f;const g=o*u,b=s*u,U=r/2+(a.imageOffsetPx?.x??0),F=r/2+(a.imageOffsetPx?.y??0);return{dx:U-g/2,dy:F-b/2,dw:g,dh:b}}async function _e(e,r="image/png",t){if(typeof e.convertToBlob=="function")return e.convertToBlob({type:r,quality:t});const a=e;return new Promise((o,s)=>{a.toBlob(c=>{c?o(c):s(new Error("Failed to convert canvas to blob"))},r,t)})}const be={STANDARD:512,PREVIEW:512,HIGH_RES:1024},Fe={DEFAULT_CIRCLE_SIZE:250},Me={BYTES_PER_KB:1024};class ye{startTime=0;marks=new Map;start(){this.startTime=performance.now(),this.marks.clear()}mark(r){this.marks.set(r,performance.now())}elapsed(){return performance.now()-this.startTime}duration(r,t){const a=this.marks.get(r),o=this.marks.get(t);return a===void 0||o===void 0?0:o-a}complete(r,t,a,o){const s=this.elapsed(),c=this.duration("start","imageLoaded"),f=this.duration("imageLoaded","renderComplete"),m=this.duration("renderComplete","exportComplete"),n=r.width*r.height*4,u=t.width*t.height*4,g=n+u;return{totalTime:s,imageLoadTime:c,renderTime:f,exportTime:m,inputSize:r,outputSize:t,wasDownsampled:a,downsampleRatio:o,estimatedMemory:g}}}function De(e,r,t,a=2){const o=t*a;if(e<=o&&r<=o)return{width:e,height:r,scale:1};const s=Math.min(o/e,o/r);return{width:Math.round(e*s),height:Math.round(r*s),scale:s}}async function Le(e,r,t){if(e.width===r&&e.height===t)return e;const{canvas:a,ctx:o}=J(r,t);return o.imageSmoothingEnabled=!0,o.imageSmoothingQuality="high",o.drawImage(e,0,0,r,t),createImageBitmap(a)}function Oe(e,r,t,a=2){return Math.max(e,r)>t*a}async function ze(e,r,t){const a=new ye,o=t.enablePerformanceTracking??!1;o&&(a.start(),a.mark("start"));const s=t.enableDownsampling??!0;let c=e,f=!1,m=1;if(s&&Oe(e.width,e.height,t.size)){const _=De(e.width,e.height,t.size);c=await Le(e,_.width,_.height),f=!0,m=_.scale,o&&a.mark("imageDownsampled")}o&&a.mark("imageLoaded"),t.onProgress?.(.2);const n=t.size,u=n,g=n,b=Math.min(u,g),U=Math.round(t.thicknessPct/100*b),F=Math.round((t.paddingPct??0)/100*b),{canvas:D,ctx:i}=J(u,g);i.imageSmoothingEnabled=!0,i.imageSmoothingQuality="high",t.backgroundColor&&(i.save(),i.fillStyle=t.backgroundColor,i.fillRect(0,0,u,g),i.restore());const M=Math.min(u,g)/2,p=M-Math.max(1,F),l=Math.max(0,p-U),z=l+1,E=(r.modes?.ring?.colors??[]).map(_=>({color:_,weight:1})),O=E.length,h=t.presentation;let C;if(h==="ring"?C="concentric":h==="segment"?C="angular":h==="cutout"?C="cutout":C="concentric",C==="cutout"){i.save();const _=c.width,G=c.height,P=z*2,X=1+(t.imageZoom??0)/100,N=t.originalImageDimensions?.width??_,$=t.originalImageDimensions?.height??G;let x;if(t.circleSize&&t.circleSize>0){const B=Math.max(t.circleSize/N,t.circleSize/$)*X,j=P/t.circleSize;x=B*j}else x=Math.max(P/N,P/$)*X;const R=f&&m>0?x/m:x,d=_*R,S=G*R,I=u/2,W=g/2,te=t.imageOffsetPx?.x??0,Q=t.imageOffsetPx?.y??0;i.drawImage(c,I-d/2+te,W-S/2+Q,d,S),i.globalCompositeOperation="destination-in",i.fillStyle="#ffffff",i.beginPath(),i.arc(I,W,z,0,Math.PI*2),i.closePath(),i.fill(),i.globalCompositeOperation="source-over",i.restore(),t.onProgress?.(.4);const w=t.flagOffsetPct?.x??0,T=u,H=Math.abs(w/50)*T*3,{canvas:V,ctx:v}=J(u+H,g);v.imageSmoothingEnabled=!0,v.imageSmoothingQuality="high";const Z=H/2+M;if(t.borderImageBitmap){const y=p*2,B=y,j=r.aspectRatio??2,K=B*j,re=(K-y)/2,ne=-(w/50)*re,ce=Z-K/2+ne,le=M-B/2;v.drawImage(t.borderImageBitmap,ce,le,K,B)}else{let y=0;for(const B of E){const K=B.weight/O*g;v.fillStyle=B.color,v.fillRect(0,y,V.width,K),y+=K}}v.globalCompositeOperation="destination-in",v.fillStyle="white",v.beginPath(),v.arc(Z,M,p,0,Math.PI*2),v.arc(Z,M,l,Math.PI*2,0,!0),v.fill(),i.drawImage(V,-H/2,0)}else{i.save();const _=c.width,G=c.height,P=z*2,X=1+(t.imageZoom??0)/100,N=t.originalImageDimensions?.width??_,$=t.originalImageDimensions?.height??G;let x;if(t.circleSize&&t.circleSize>0){const T=Math.max(t.circleSize/N,t.circleSize/$)*X,H=P/t.circleSize;x=T*H}else x=Math.max(P/N,P/$)*X;const R=f&&m>0?x/m:x,d=_*R,S=G*R,I=u/2,W=g/2,te=t.imageOffsetPx?.x??0,Q=t.imageOffsetPx?.y??0;if(i.drawImage(c,I-d/2+te,W-S/2+Q,d,S),i.globalCompositeOperation="destination-in",i.fillStyle="#ffffff",i.beginPath(),i.arc(I,W,z,0,Math.PI*2),i.closePath(),i.fill(),i.globalCompositeOperation="source-over",i.restore(),t.onProgress?.(.5),t.borderImageBitmap&&h!=="cutout"){const w=Math.max(1,Math.round(p-l)),T=(l+p)/2,V=Math.max(2,Math.round(2*Math.PI*T)),v=w;try{const{canvas:Z,ctx:y}=J(V,v),B=t.borderImageBitmap.width,j=t.borderImageBitmap.height,K=Math.max(V/B,v/j),re=Math.round(B*K),ne=Math.round(j*K),ce=Math.round((V-re)/2),le=Math.round((v-ne)/2);y.clearRect(0,0,V,v),y.drawImage(t.borderImageBitmap,0,0,B,j,ce,le,re,ne);const we=await createImageBitmap(Z),Ae=t.segmentRotation!==void 0?t.segmentRotation*Math.PI/180:0,Ee=-Math.PI/2+Ae;me(i,I,l,p,we,Ee,"normal")}catch{try{me(i,I,l,p,t.borderImageBitmap)}catch{i.save(),i.globalAlpha=.64,ge(i,I,l,p,E,O),i.restore()}}}else if(C==="concentric")ge(i,I,l,p,E,O);else{const w=t.segmentRotation!==void 0?t.segmentRotation*Math.PI/180:0;let T=-Math.PI/2+w;for(const H of E){const V=H.weight/O,v=Math.PI*2*V,Z=T+v;Ue(i,I,l,p,T,Z,H.color),T=Z}}}o&&a.mark("renderComplete"),t.onProgress?.(.8),t.outerStroke&&(i.beginPath(),i.arc(u/2,g/2,p,0,Math.PI*2),i.strokeStyle=t.outerStroke.color,i.lineWidth=t.outerStroke.widthPx,i.stroke());const ee=t.pngQuality??.92,k=await _e(D,"image/png",ee),q=k.size,L=(q/Me.BYTES_PER_KB).toFixed(2);if(o){a.mark("exportComplete");const _=a.complete({width:e.width,height:e.height},{width:u,height:g},f,m);return t.onProgress?.(1),{blob:k,sizeBytes:q,sizeKB:L,metrics:_}}return t.onProgress?.(1),{blob:k,sizeBytes:q,sizeKB:L}}function ge(e,r,t,a,o,s){const c=a-t;let f=a;for(const m of o){const u=m.weight/s*c,g=Math.max(t,f-u);if(e.beginPath(),e.arc(r,r,f,0,Math.PI*2),e.arc(r,r,g,Math.PI*2,0,!0),e.closePath(),e.fillStyle=m.color,e.fill(),f=g,f<=t+.5)break}f>t+.5&&(e.beginPath(),e.arc(r,r,f,0,Math.PI*2),e.arc(r,r,t,Math.PI*2,0,!0),e.closePath(),e.fillStyle=o[o.length-1]?.color??"#000000",e.fill())}function Ue(e,r,t,a,o,s,c){e.beginPath(),e.arc(r,r,a,o,s),e.arc(r,r,t,s,o,!0),e.closePath(),e.fillStyle=c,e.fill()}function me(e,r,t,a,o,s=0,c="normal"){const f=a-t;if(f<=0)return;const m=(t+a)/2,n=Math.max(1,Math.round(2*Math.PI*m)),u=Math.max(1,n),g=Math.max(1,Math.round(f)),{ctx:b}=J(u,g),U=o.width,F=o.height,D=Math.max(u/U,g/F),i=Math.round(U*D),M=Math.round(F*D),p=Math.round((u-i)/2),l=Math.round((g-M)/2);b.clearRect(0,0,u,g),b.drawImage(o,0,0,U,F,p,l,i,M);const A=b.getImageData(0,0,u,g).data,E=Math.floor(r-a),O=Math.floor(r-a),h=Math.ceil(a*2),C=h,{canvas:ee,ctx:k}=J(h,C),q=k.createImageData(h,C),L=q.data,_=Math.PI*2,G=1/_;for(let x=0;x<C;x++){const d=O+x+.5-r;for(let S=0;S<h;S++){const W=E+S+.5-r,te=W*W+d*d,Q=Math.sqrt(te),w=(x*h+S)*4;if(Q<t||Q>a){L[w+0]=0,L[w+1]=0,L[w+2]=0,L[w+3]=0;continue}let T=Math.atan2(d,W);for(T-=s;T<0;)T+=_;for(;T>=_;)T-=_;const H=T*G*u,V=(Q-t)/f*g,v=Math.min(u-1,Math.max(0,Math.floor(H))),y=(Math.min(g-1,Math.max(0,Math.floor(V)))*u+v)*4;L[w+0]=A[y+0],L[w+1]=A[y+1],L[w+2]=A[y+2],L[w+3]=A[y+3]}}if(k.putImageData(q,0,0),c==="normal"){e.save(),e.drawImage(ee,E,O),e.restore();return}const{canvas:P,ctx:Y}=J(h,C);Y.clearRect(0,0,h,C),Y.drawImage(e.canvas,E,O,h,C,0,0,h,C);const X=Y.getImageData(0,0,h,C),N=X.data,$=k.getImageData(0,0,h,C).data;for(let x=0;x<N.length;x+=4)$[x+3]>8&&(N[x+3]=0);Y.putImageData(X,0,0),e.save(),e.drawImage(P,E,O),e.restore()}function ue(e,r=!1){const t={alpha:!0,premultipliedAlpha:!1,preserveDrawingBuffer:r,antialias:!0};let a=e.getContext("webgl2",t);return a||(a=e.getContext("webgl",t),a)?a:e instanceof HTMLCanvasElement?e.getContext("experimental-webgl",t):null}function de(e,r,t){const a=e.createShader(t);if(!a)throw new Error(`Failed to create shader of type ${t}`);if(e.shaderSource(a,r),e.compileShader(a),!e.getShaderParameter(a,e.COMPILE_STATUS)){const o=e.getShaderInfoLog(a);throw e.deleteShader(a),new Error(`Shader compilation failed: ${o}`)}return a}function oe(e,r,t){const a=de(e,r,e.VERTEX_SHADER),o=de(e,t,e.FRAGMENT_SHADER),s=e.createProgram();if(!s)throw new Error("Failed to create program");if(e.attachShader(s,a),e.attachShader(s,o),e.linkProgram(s),!e.getProgramParameter(s,e.LINK_STATUS)){const c=e.getProgramInfoLog(s);throw e.deleteProgram(s),new Error(`Program linking failed: ${c}`)}return e.deleteShader(a),e.deleteShader(o),s}function se(e,r){const t=e.createTexture();if(!t)throw new Error("Failed to create texture");return e.bindTexture(e.TEXTURE_2D,t),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,r),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),t}function Ce(e){const r=e.createBuffer();if(!r)throw new Error("Failed to create quad buffer");const t=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);return e.bindBuffer(e.ARRAY_BUFFER,r),e.bufferData(e.ARRAY_BUFFER,t,e.STATIC_DRAW),r}const ae=`
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
`;async function ke(e,r,t){const a=t.size,o=t.size,s=Math.min(a,be.STANDARD),c=s,f=s,m=ie(c,f),n=ue(m,!0);if(!n)throw new Error("Failed to create WebGL context");const u=Math.max(1,(t.paddingPct??0)*c/100),g=Math.max(1,t.thicknessPct*c/100),b=c/2,U=f/2,D=Math.min(c,f)/2-Math.max(1,u),i=Math.max(0,D-g),M=i;n.viewport(0,0,c,f);const p=t.presentation??"ring";let l;p==="segment"?l=oe(n,ae,Re):p==="cutout"&&t.borderImageBitmap?l=oe(n,ae,Ie):l=oe(n,ae,ve);const z=Ce(n),A=c/a,E=A===1?t:{...t,imageOffsetPx:{x:(t.imageOffsetPx?.x??0)*A,y:(t.imageOffsetPx?.y??0)*A}},{canvas:O,ctx:h}=J(c,f),{dx:C,dy:ee,dw:k,dh:q}=pe(e,c,M,E);h.clearRect(0,0,c,f),h.drawImage(e,C,ee,k,q);const L=se(n,O),_=r.modes?.ring?.colors??[],G=[];for(const R of _){const d=parseInt(R.slice(1,3),16)/255,S=parseInt(R.slice(3,5),16)/255,I=parseInt(R.slice(5,7),16)/255;G.push(d,S,I)}n.bindFramebuffer(n.FRAMEBUFFER,null),n.clear(n.COLOR_BUFFER_BIT),n.useProgram(l);const P={u_image:n.getUniformLocation(l,"u_image"),u_center:n.getUniformLocation(l,"u_center"),u_imageRadius:n.getUniformLocation(l,"u_imageRadius"),u_ringInnerRadius:n.getUniformLocation(l,"u_ringInnerRadius"),u_ringOuterRadius:n.getUniformLocation(l,"u_ringOuterRadius"),u_resolution:n.getUniformLocation(l,"u_resolution")};n.activeTexture(n.TEXTURE0),n.bindTexture(n.TEXTURE_2D,L),n.uniform1i(P.u_image,0),n.uniform2f(P.u_center,b,U),n.uniform1f(P.u_imageRadius,M),n.uniform1f(P.u_ringInnerRadius,i),n.uniform1f(P.u_ringOuterRadius,D),n.uniform2f(P.u_resolution,c,f);let Y=null;if(p==="segment"){const R=(t.segmentRotation??0)*Math.PI/180,d=n.getUniformLocation(l,"u_rotation"),S=n.getUniformLocation(l,"u_colorCount"),I=n.getUniformLocation(l,"u_colors");n.uniform1f(d,R),n.uniform1i(S,_.length),n.uniform3fv(I,new Float32Array(G))}else if(p==="cutout"&&t.borderImageBitmap){const R=t.flagOffsetPct??{x:0},d=D*2,S=t.borderImageBitmap.width/t.borderImageBitmap.height,I=d*S,W=Math.max(0,(I-d)/2),te=-(R.x/50)*W,Q=b-I/2+te,w=U-d/2;n.activeTexture(n.TEXTURE1),Y=se(n,t.borderImageBitmap),n.bindTexture(n.TEXTURE_2D,Y),n.uniform1i(n.getUniformLocation(l,"u_flagTexture"),1),n.uniform2f(n.getUniformLocation(l,"u_flagSize"),I,d),n.uniform2f(n.getUniformLocation(l,"u_flagPos"),Q,w)}else{const R=n.getUniformLocation(l,"u_colorCount"),d=n.getUniformLocation(l,"u_colors");n.uniform1i(R,_.length),n.uniform3fv(d,new Float32Array(G))}const X=n.getAttribLocation(l,"a_position");n.bindBuffer(n.ARRAY_BUFFER,z),n.enableVertexAttribArray(X),n.vertexAttribPointer(X,2,n.FLOAT,!1,0,0),n.drawArrays(n.TRIANGLES,0,6),n.finish();let N=m;if(a!==s){const{canvas:R,ctx:d}=J(a,o);d.imageSmoothingEnabled=!0,d.imageSmoothingQuality="high",d.drawImage(m,0,0,a,o),N=R}const $=t.pngQuality??.92,x=await _e(N,"image/png",$);return Y&&n.deleteTexture(Y),n.deleteTexture(L),n.deleteBuffer(z),n.deleteProgram(l),{blob:x,sizeBytes:x.size,sizeKB:(x.size/1024).toFixed(2)}}class Ge{offscreen;imageCanvas;imageCtx;gl;programs;quadBuffer;size;constructor(r){if(this.size=r,!fe())throw new Error("OffscreenCanvas not supported — required for LiveAvatarRenderer");this.offscreen=ie(r,r),this.imageCanvas=ie(r,r);const t=this.imageCanvas.getContext("2d");if(!t)throw new Error("Failed to create 2D context for image pre-processing");this.imageCtx=t;const a=ue(this.offscreen);if(!a)throw new Error("WebGL not supported");this.gl=a,this.programs={ring:oe(a,ae,ve),segment:oe(a,ae,Re),cutout:oe(a,ae,Ie)},this.quadBuffer=Ce(a)}render(r,t,a){const o=this.gl,s=this.size,c=s/2,f=s/2,m=Math.max(1,a.thicknessPct*s/100),u=s/2,g=Math.max(0,u-m),b=g;o.viewport(0,0,s,s),o.clearColor(0,0,0,0),o.clear(o.COLOR_BUFFER_BIT);const U=this.preRenderImage(r,b,a);o.activeTexture(o.TEXTURE0);const F=se(o,U),D=a.presentation??"ring";let i;D==="segment"?i=this.programs.segment:D==="cutout"&&a.borderImageBitmap?i=this.programs.cutout:i=this.programs.ring,o.useProgram(i),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,F),o.uniform1i(o.getUniformLocation(i,"u_image"),0),o.uniform2f(o.getUniformLocation(i,"u_center"),c,f),o.uniform1f(o.getUniformLocation(i,"u_imageRadius"),b),o.uniform1f(o.getUniformLocation(i,"u_ringInnerRadius"),g),o.uniform1f(o.getUniformLocation(i,"u_ringOuterRadius"),u),o.uniform2f(o.getUniformLocation(i,"u_resolution"),s,s);const M=t.modes?.ring?.colors??[],p=[];for(const A of M)p.push(parseInt(A.slice(1,3),16)/255,parseInt(A.slice(3,5),16)/255,parseInt(A.slice(5,7),16)/255);let l=null;if(D==="segment"){const A=(a.segmentRotation??0)*Math.PI/180;o.uniform1f(o.getUniformLocation(i,"u_rotation"),A),o.uniform1i(o.getUniformLocation(i,"u_colorCount"),M.length),o.uniform3fv(o.getUniformLocation(i,"u_colors"),new Float32Array(p))}else if(D==="cutout"&&a.borderImageBitmap){const A=a.flagOffsetPct??{x:0},E=u*2,O=a.borderImageBitmap.width/a.borderImageBitmap.height,h=E*O,C=Math.max(0,(h-E)/2),ee=-(A.x/50)*C,k=c-h/2+ee,q=f-E/2;o.activeTexture(o.TEXTURE1),l=se(o,a.borderImageBitmap),o.bindTexture(o.TEXTURE_2D,l),o.uniform1i(o.getUniformLocation(i,"u_flagTexture"),1),o.uniform2f(o.getUniformLocation(i,"u_flagSize"),h,E),o.uniform2f(o.getUniformLocation(i,"u_flagPos"),k,q)}else o.uniform1i(o.getUniformLocation(i,"u_colorCount"),M.length),o.uniform3fv(o.getUniformLocation(i,"u_colors"),new Float32Array(p));const z=o.getAttribLocation(i,"a_position");return o.bindBuffer(o.ARRAY_BUFFER,this.quadBuffer),o.enableVertexAttribArray(z),o.vertexAttribPointer(z,2,o.FLOAT,!1,0,0),o.drawArrays(o.TRIANGLES,0,6),o.deleteTexture(F),l&&o.deleteTexture(l),this.offscreen.transferToImageBitmap()}preRenderImage(r,t,a){const o=this.size,s=this.imageCtx;s.clearRect(0,0,o,o);const{dx:c,dy:f,dw:m,dh:n}=pe(r,o,t,a);return s.drawImage(r,c,f,m,n),this.imageCanvas}static isSupported(){return Be()&&fe()}destroy(){const r=this.gl;r.deleteProgram(this.programs.ring),r.deleteProgram(this.programs.segment),r.deleteProgram(this.programs.cutout),r.deleteBuffer(this.quadBuffer)}}export{Fe as I,Ge as L,be as R,ze as a,J as b,_e as c,Be as i,ke as r};
