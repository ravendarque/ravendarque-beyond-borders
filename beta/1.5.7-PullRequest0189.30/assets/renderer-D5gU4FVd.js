const Pe={chrome:268435456,firefox:1073676289,safari:16777216,default:16777216};function he(){const e=navigator.userAgent.toLowerCase();return e.includes("chrome")||e.includes("edge")?"chrome":e.includes("firefox")?"firefox":e.includes("safari")&&!e.includes("chrome")?"safari":"default"}function Te(){const e=he();return Pe[e]}function be(e,r){const t=Te(),a=e*r;if(a>t){const o=he(),s=Math.floor(Math.sqrt(t));throw new Error(`Canvas size ${e}x${r} (${a.toLocaleString()} pixels) exceeds ${o} limit of ${Math.floor(Math.sqrt(t))}x${Math.floor(Math.sqrt(t))} (${t.toLocaleString()} pixels). Maximum dimension: ${s}px.`)}}function xe(){try{const r=(typeof globalThis<"u"?globalThis:window).OffscreenCanvas;return typeof r=="function"&&typeof r.prototype.convertToBlob=="function"?r:void 0}catch{return}}function fe(){return xe()!==void 0}function ie(e,r){be(e,r);const t=xe();if(t)return new t(e,r);const a=document.createElement("canvas");return a.width=e,a.height=r,a}function j(e,r){const t=ie(e,r),a=t.getContext("2d");if(!a)throw new Error("Failed to get 2D context from canvas");return{canvas:t,ctx:a}}function pe(e,r,t,a){const o=e.width,s=e.height,n=t*2,u=1+(a.imageZoom??0)/100,g=a.originalImageDimensions?.width??o,w=a.originalImageDimensions?.height??s;let c;a.circleSize&&a.circleSize>0?c=Math.max(a.circleSize/g,a.circleSize/w)*u*n/a.circleSize:c=Math.max(n/g,n/w)*u;const l=o*c,A=s*c,F=r/2+(a.imageOffsetPx?.x??0),O=r/2+(a.imageOffsetPx?.y??0);return{dx:F-l/2,dy:O-A/2,dw:l,dh:A}}async function _e(e,r="image/png",t){if(typeof e.convertToBlob=="function")return e.convertToBlob({type:r,quality:t});const a=e;return new Promise((o,s)=>{a.toBlob(n=>{n?o(n):s(new Error("Failed to convert canvas to blob"))},r,t)})}const Be={STANDARD:512,PREVIEW:512,HIGH_RES:1024},Fe={DEFAULT_CIRCLE_SIZE:250},Se={BYTES_PER_KB:1024};class Me{startTime=0;marks=new Map;start(){this.startTime=performance.now(),this.marks.clear()}mark(r){this.marks.set(r,performance.now())}elapsed(){return performance.now()-this.startTime}duration(r,t){const a=this.marks.get(r),o=this.marks.get(t);return a===void 0||o===void 0?0:o-a}complete(r,t,a,o){const s=this.elapsed(),n=this.duration("start","imageLoaded"),u=this.duration("imageLoaded","renderComplete"),g=this.duration("renderComplete","exportComplete"),w=r.width*r.height*4,c=t.width*t.height*4,l=w+c;return{totalTime:s,imageLoadTime:n,renderTime:u,exportTime:g,inputSize:r,outputSize:t,wasDownsampled:a,downsampleRatio:o,estimatedMemory:l}}}function ye(e,r,t,a=2){const o=t*a;if(e<=o&&r<=o)return{width:e,height:r,scale:1};const s=Math.min(o/e,o/r);return{width:Math.round(e*s),height:Math.round(r*s),scale:s}}async function Le(e,r,t){if(e.width===r&&e.height===t)return e;const{canvas:a,ctx:o}=j(r,t);return o.imageSmoothingEnabled=!0,o.imageSmoothingQuality="high",o.drawImage(e,0,0,r,t),createImageBitmap(a)}function De(e,r,t,a=2){return Math.max(e,r)>t*a}async function ze(e,r,t){const a=new Me,o=t.enablePerformanceTracking??!1;o&&(a.start(),a.mark("start"));const s=t.enableDownsampling??!0;let n=e,u=!1,g=1;if(s&&De(e.width,e.height,t.size)){const h=ye(e.width,e.height,t.size);n=await Le(e,h.width,h.height),u=!0,g=h.scale,o&&a.mark("imageDownsampled")}o&&a.mark("imageLoaded"),t.onProgress?.(.2);const w=t.size,c=w,l=w,A=Math.min(c,l),F=Math.round(t.thicknessPct/100*A),O=Math.round((t.paddingPct??0)/100*A),{canvas:b,ctx:i}=j(c,l);i.imageSmoothingEnabled=!0,i.imageSmoothingQuality="high",t.backgroundColor&&(i.save(),i.fillStyle=t.backgroundColor,i.fillRect(0,0,c,l),i.restore());const S=Math.min(c,l)/2,p=S-Math.max(1,O),_=Math.max(0,p-F),W=_+1,v=(r.modes?.ring?.colors??[]).map(h=>({color:h,weight:1})),U=v.length,f=t.presentation;let m;if(f==="ring"?m="concentric":f==="segment"?m="angular":f==="cutout"?m="cutout":m="concentric",m==="cutout"){i.save();const h=n.width,k=n.height,C=W*2,D=1+(t.imageZoom??0)/100,P=t.originalImageDimensions?.width??h,q=t.originalImageDimensions?.height??k;let d;if(t.circleSize&&t.circleSize>0){const z=Math.max(t.circleSize/P,t.circleSize/q)*D,J=C/t.circleSize;d=z*J}else d=Math.max(C/P,C/q)*D;const $=u&&g>0?d/g:d,G=h*$,H=k*$,Y=c/2,Q=l/2,ae=t.imageOffsetPx?.x??0,ee=t.imageOffsetPx?.y??0;i.drawImage(n,Y-G/2+ae,Q-H/2+ee,G,H),i.globalCompositeOperation="destination-in",i.fillStyle="#ffffff",i.beginPath(),i.arc(Y,Q,W,0,Math.PI*2),i.closePath(),i.fill(),i.globalCompositeOperation="source-over",i.restore(),t.onProgress?.(.4);const I=t.flagOffsetPct?.x??0,T=c,X=Math.abs(I/50)*T*3,{canvas:N,ctx:x}=j(c+X,l);x.imageSmoothingEnabled=!0,x.imageSmoothingQuality="high";const Z=X/2+S;if(t.borderImageBitmap){const y=p*2,z=y,J=r.aspectRatio??2,K=z*J,re=(K-y)/2,ne=-(I/50)*re,ce=Z-K/2+ne,le=S-z/2;x.drawImage(t.borderImageBitmap,ce,le,K,z)}else{let y=0;for(const z of v){const K=z.weight/U*l;x.fillStyle=z.color,x.fillRect(0,y,N.width,K),y+=K}}x.globalCompositeOperation="destination-in",x.fillStyle="white",x.beginPath(),x.arc(Z,S,p,0,Math.PI*2),x.arc(Z,S,_,Math.PI*2,0,!0),x.fill(),i.drawImage(N,-X/2,0)}else{i.save();const h=n.width,k=n.height,C=W*2,D=1+(t.imageZoom??0)/100,P=t.originalImageDimensions?.width??h,q=t.originalImageDimensions?.height??k;let d;if(t.circleSize&&t.circleSize>0){const T=Math.max(t.circleSize/P,t.circleSize/q)*D,X=C/t.circleSize;d=T*X}else d=Math.max(C/P,C/q)*D;const $=u&&g>0?d/g:d,G=h*$,H=k*$,Y=c/2,Q=l/2,ae=t.imageOffsetPx?.x??0,ee=t.imageOffsetPx?.y??0;if(i.drawImage(n,Y-G/2+ae,Q-H/2+ee,G,H),i.globalCompositeOperation="destination-in",i.fillStyle="#ffffff",i.beginPath(),i.arc(Y,Q,W,0,Math.PI*2),i.closePath(),i.fill(),i.globalCompositeOperation="source-over",i.restore(),t.onProgress?.(.5),t.borderImageBitmap&&f!=="cutout"){const I=Math.max(1,Math.round(p-_)),T=(_+p)/2,N=Math.max(2,Math.round(2*Math.PI*T)),x=I;try{const{canvas:Z,ctx:y}=j(N,x),z=t.borderImageBitmap.width,J=t.borderImageBitmap.height,K=Math.max(N/z,x/J),re=Math.round(z*K),ne=Math.round(J*K),ce=Math.round((N-re)/2),le=Math.round((x-ne)/2);y.clearRect(0,0,N,x),y.drawImage(t.borderImageBitmap,0,0,z,J,ce,le,re,ne);const we=await createImageBitmap(Z),Ae=t.segmentRotation!==void 0?t.segmentRotation*Math.PI/180:0,Ee=-Math.PI/2+Ae;me(i,Y,_,p,we,Ee,"normal")}catch{try{me(i,Y,_,p,t.borderImageBitmap)}catch{i.save(),i.globalAlpha=.64,ge(i,Y,_,p,v,U),i.restore()}}}else if(m==="concentric")ge(i,Y,_,p,v,U);else{const I=t.segmentRotation!==void 0?t.segmentRotation*Math.PI/180:0;let T=-Math.PI/2+I;for(const X of v){const N=X.weight/U,x=Math.PI*2*N,Z=T+x;Oe(i,Y,_,p,T,Z,X.color),T=Z}}}o&&a.mark("renderComplete"),t.onProgress?.(.8),t.outerStroke&&(i.beginPath(),i.arc(c/2,l/2,p,0,Math.PI*2),i.strokeStyle=t.outerStroke.color,i.lineWidth=t.outerStroke.widthPx,i.stroke());const V=t.pngQuality??.92,E=await _e(b,"image/png",V),B=E.size,L=(B/Se.BYTES_PER_KB).toFixed(2);if(o){a.mark("exportComplete");const h=a.complete({width:e.width,height:e.height},{width:c,height:l},u,g);return t.onProgress?.(1),{blob:E,sizeBytes:B,sizeKB:L,metrics:h}}return t.onProgress?.(1),{blob:E,sizeBytes:B,sizeKB:L}}function ge(e,r,t,a,o,s){const n=a-t;let u=a;for(const g of o){const c=g.weight/s*n,l=Math.max(t,u-c);if(e.beginPath(),e.arc(r,r,u,0,Math.PI*2),e.arc(r,r,l,Math.PI*2,0,!0),e.closePath(),e.fillStyle=g.color,e.fill(),u=l,u<=t+.5)break}u>t+.5&&(e.beginPath(),e.arc(r,r,u,0,Math.PI*2),e.arc(r,r,t,Math.PI*2,0,!0),e.closePath(),e.fillStyle=o[o.length-1]?.color??"#000000",e.fill())}function Oe(e,r,t,a,o,s,n){e.beginPath(),e.arc(r,r,a,o,s),e.arc(r,r,t,s,o,!0),e.closePath(),e.fillStyle=n,e.fill()}function me(e,r,t,a,o,s=0,n="normal"){const u=a-t;if(u<=0)return;const g=(t+a)/2,w=Math.max(1,Math.round(2*Math.PI*g)),c=Math.max(1,w),l=Math.max(1,Math.round(u)),{ctx:A}=j(c,l),F=o.width,O=o.height,b=Math.max(c/F,l/O),i=Math.round(F*b),S=Math.round(O*b),p=Math.round((c-i)/2),_=Math.round((l-S)/2);A.clearRect(0,0,c,l),A.drawImage(o,0,0,F,O,p,_,i,S);const M=A.getImageData(0,0,c,l).data,v=Math.floor(r-a),U=Math.floor(r-a),f=Math.ceil(a*2),m=f,{canvas:V,ctx:E}=j(f,m),B=E.createImageData(f,m),L=B.data,h=Math.PI*2,k=1/h;for(let d=0;d<m;d++){const G=U+d+.5-r;for(let H=0;H<f;H++){const Q=v+H+.5-r,ae=Q*Q+G*G,ee=Math.sqrt(ae),I=(d*f+H)*4;if(ee<t||ee>a){L[I+0]=0,L[I+1]=0,L[I+2]=0,L[I+3]=0;continue}let T=Math.atan2(G,Q);for(T-=s;T<0;)T+=h;for(;T>=h;)T-=h;const X=T*k*c,N=(ee-t)/u*l,x=Math.min(c-1,Math.max(0,Math.floor(X))),y=(Math.min(l-1,Math.max(0,Math.floor(N)))*c+x)*4;L[I+0]=M[y+0],L[I+1]=M[y+1],L[I+2]=M[y+2],L[I+3]=M[y+3]}}if(E.putImageData(B,0,0),n==="normal"){e.save(),e.drawImage(V,v,U),e.restore();return}const{canvas:C,ctx:R}=j(f,m);R.clearRect(0,0,f,m),R.drawImage(e.canvas,v,U,f,m,0,0,f,m);const D=R.getImageData(0,0,f,m),P=D.data,q=E.getImageData(0,0,f,m).data;for(let d=0;d<P.length;d+=4)q[d+3]>8&&(P[d+3]=0);R.putImageData(D,0,0),e.save(),e.drawImage(C,v,U),e.restore()}function ue(e){const r={alpha:!0,premultipliedAlpha:!1,preserveDrawingBuffer:!1,antialias:!0};let t=e.getContext("webgl2",r);return t||(t=e.getContext("webgl",r),t)?t:e instanceof HTMLCanvasElement?e.getContext("experimental-webgl",r):null}function de(e,r,t){const a=e.createShader(t);if(!a)throw new Error(`Failed to create shader of type ${t}`);if(e.shaderSource(a,r),e.compileShader(a),!e.getShaderParameter(a,e.COMPILE_STATUS)){const o=e.getShaderInfoLog(a);throw e.deleteShader(a),new Error(`Shader compilation failed: ${o}`)}return a}function te(e,r,t){const a=de(e,r,e.VERTEX_SHADER),o=de(e,t,e.FRAGMENT_SHADER),s=e.createProgram();if(!s)throw new Error("Failed to create program");if(e.attachShader(s,a),e.attachShader(s,o),e.linkProgram(s),!e.getProgramParameter(s,e.LINK_STATUS)){const n=e.getProgramInfoLog(s);throw e.deleteProgram(s),new Error(`Program linking failed: ${n}`)}return e.deleteShader(a),e.deleteShader(o),s}function se(e,r){const t=e.createTexture();if(!t)throw new Error("Failed to create texture");return e.bindTexture(e.TEXTURE_2D,t),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,r),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),t}function Ce(e){const r=e.createBuffer();if(!r)throw new Error("Failed to create quad buffer");const t=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);return e.bindBuffer(e.ARRAY_BUFFER,r),e.bufferData(e.ARRAY_BUFFER,t,e.STATIC_DRAW),r}const oe=`
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
  // Pass through position
  gl_Position = vec4(a_position, 0.0, 1.0);
  
  // Convert from -1..1 to 0..1 for texture coordinates
  v_texCoord = a_position * 0.5 + 0.5;
}
`;function Ue(){try{const e=document.createElement("canvas");return ue(e)!==null}catch{return!1}}const ve=`
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
`;async function ke(e,r,t){const a=t.size,o=t.size,s=ie(a,o),n=ue(s);if(!n)throw new Error("Failed to create WebGL context");const u=Math.max(1,(t.paddingPct??0)*t.size/100),g=Math.max(1,t.thicknessPct*t.size/100),w=a/2,c=o/2,A=Math.min(a,o)/2-Math.max(1,u),F=Math.max(0,A-g),O=F;n.viewport(0,0,a,o);const b=t.presentation??"ring";let i;b==="segment"?i=te(n,oe,Re):b==="cutout"&&t.borderImageBitmap?i=te(n,oe,Ie):i=te(n,oe,ve);const S=Ce(n),{canvas:p,ctx:_}=j(a,o),{dx:W,dy:M,dw:v,dh:U}=pe(e,a,O,t);_.clearRect(0,0,a,o),_.drawImage(e,W,M,v,U);const f=se(n,p),m=r.modes?.ring?.colors??[],V=[];for(const C of m){const R=parseInt(C.slice(1,3),16)/255,D=parseInt(C.slice(3,5),16)/255,P=parseInt(C.slice(5,7),16)/255;V.push(R,D,P)}n.bindFramebuffer(n.FRAMEBUFFER,null),n.clear(n.COLOR_BUFFER_BIT),n.useProgram(i);const E={u_image:n.getUniformLocation(i,"u_image"),u_center:n.getUniformLocation(i,"u_center"),u_imageRadius:n.getUniformLocation(i,"u_imageRadius"),u_ringInnerRadius:n.getUniformLocation(i,"u_ringInnerRadius"),u_ringOuterRadius:n.getUniformLocation(i,"u_ringOuterRadius"),u_resolution:n.getUniformLocation(i,"u_resolution")};n.activeTexture(n.TEXTURE0),n.bindTexture(n.TEXTURE_2D,f),n.uniform1i(E.u_image,0),n.uniform2f(E.u_center,w,c),n.uniform1f(E.u_imageRadius,O),n.uniform1f(E.u_ringInnerRadius,F),n.uniform1f(E.u_ringOuterRadius,A),n.uniform2f(E.u_resolution,a,o);let B=null;if(b==="segment"){const C=(t.segmentRotation??0)*Math.PI/180,R=n.getUniformLocation(i,"u_rotation"),D=n.getUniformLocation(i,"u_colorCount"),P=n.getUniformLocation(i,"u_colors");n.uniform1f(R,C),n.uniform1i(D,m.length),n.uniform3fv(P,new Float32Array(V))}else if(b==="cutout"&&t.borderImageBitmap){const C=t.flagOffsetPct??{x:0},R=A*2,D=t.borderImageBitmap.width/t.borderImageBitmap.height,P=R*D,q=Math.max(0,(P-R)/2),d=-(C.x/50)*q,$=w-P/2+d,G=c-R/2;n.activeTexture(n.TEXTURE1),B=se(n,t.borderImageBitmap),n.bindTexture(n.TEXTURE_2D,B),n.uniform1i(n.getUniformLocation(i,"u_flagTexture"),1),n.uniform2f(n.getUniformLocation(i,"u_flagSize"),P,R),n.uniform2f(n.getUniformLocation(i,"u_flagPos"),$,G)}else{const C=n.getUniformLocation(i,"u_colorCount"),R=n.getUniformLocation(i,"u_colors");n.uniform1i(C,m.length),n.uniform3fv(R,new Float32Array(V))}const L=n.getAttribLocation(i,"a_position");n.bindBuffer(n.ARRAY_BUFFER,S),n.enableVertexAttribArray(L),n.vertexAttribPointer(L,2,n.FLOAT,!1,0,0),n.drawArrays(n.TRIANGLES,0,6);const h=t.pngQuality??.92,k=await _e(s,"image/png",h);return B&&n.deleteTexture(B),n.deleteTexture(f),n.deleteBuffer(S),n.deleteProgram(i),{blob:k,sizeBytes:k.size,sizeKB:(k.size/1024).toFixed(2)}}class Ge{offscreen;imageCanvas;imageCtx;gl;programs;quadBuffer;size;constructor(r){if(this.size=r,!fe())throw new Error("OffscreenCanvas not supported — required for LiveAvatarRenderer");this.offscreen=ie(r,r),this.imageCanvas=ie(r,r);const t=this.imageCanvas.getContext("2d");if(!t)throw new Error("Failed to create 2D context for image pre-processing");this.imageCtx=t;const a=ue(this.offscreen);if(!a)throw new Error("WebGL not supported");this.gl=a,this.programs={ring:te(a,oe,ve),segment:te(a,oe,Re),cutout:te(a,oe,Ie)},this.quadBuffer=Ce(a)}render(r,t,a){const o=this.gl,s=this.size,n=s/2,u=s/2,g=Math.max(1,a.thicknessPct*s/100),c=s/2,l=Math.max(0,c-g),A=l;o.viewport(0,0,s,s),o.clearColor(0,0,0,0),o.clear(o.COLOR_BUFFER_BIT);const F=this.preRenderImage(r,A,a);o.activeTexture(o.TEXTURE0);const O=se(o,F),b=a.presentation??"ring";let i;b==="segment"?i=this.programs.segment:b==="cutout"&&a.borderImageBitmap?i=this.programs.cutout:i=this.programs.ring,o.useProgram(i),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,O),o.uniform1i(o.getUniformLocation(i,"u_image"),0),o.uniform2f(o.getUniformLocation(i,"u_center"),n,u),o.uniform1f(o.getUniformLocation(i,"u_imageRadius"),A),o.uniform1f(o.getUniformLocation(i,"u_ringInnerRadius"),l),o.uniform1f(o.getUniformLocation(i,"u_ringOuterRadius"),c),o.uniform2f(o.getUniformLocation(i,"u_resolution"),s,s);const S=t.modes?.ring?.colors??[],p=[];for(const M of S)p.push(parseInt(M.slice(1,3),16)/255,parseInt(M.slice(3,5),16)/255,parseInt(M.slice(5,7),16)/255);let _=null;if(b==="segment"){const M=(a.segmentRotation??0)*Math.PI/180;o.uniform1f(o.getUniformLocation(i,"u_rotation"),M),o.uniform1i(o.getUniformLocation(i,"u_colorCount"),S.length),o.uniform3fv(o.getUniformLocation(i,"u_colors"),new Float32Array(p))}else if(b==="cutout"&&a.borderImageBitmap){const M=a.flagOffsetPct??{x:0},v=c*2,U=a.borderImageBitmap.width/a.borderImageBitmap.height,f=v*U,m=Math.max(0,(f-v)/2),V=-(M.x/50)*m,E=n-f/2+V,B=u-v/2;o.activeTexture(o.TEXTURE1),_=se(o,a.borderImageBitmap),o.bindTexture(o.TEXTURE_2D,_),o.uniform1i(o.getUniformLocation(i,"u_flagTexture"),1),o.uniform2f(o.getUniformLocation(i,"u_flagSize"),f,v),o.uniform2f(o.getUniformLocation(i,"u_flagPos"),E,B)}else o.uniform1i(o.getUniformLocation(i,"u_colorCount"),S.length),o.uniform3fv(o.getUniformLocation(i,"u_colors"),new Float32Array(p));const W=o.getAttribLocation(i,"a_position");return o.bindBuffer(o.ARRAY_BUFFER,this.quadBuffer),o.enableVertexAttribArray(W),o.vertexAttribPointer(W,2,o.FLOAT,!1,0,0),o.drawArrays(o.TRIANGLES,0,6),o.deleteTexture(O),_&&o.deleteTexture(_),this.offscreen.transferToImageBitmap()}preRenderImage(r,t,a){const o=this.size,s=this.imageCtx;s.clearRect(0,0,o,o);const{dx:n,dy:u,dw:g,dh:w}=pe(r,o,t,a);return s.drawImage(r,n,u,g,w),this.imageCanvas}static isSupported(){return Ue()&&fe()}destroy(){const r=this.gl;r.deleteProgram(this.programs.ring),r.deleteProgram(this.programs.segment),r.deleteProgram(this.programs.cutout),r.deleteBuffer(this.quadBuffer)}}export{Fe as I,Ge as L,Be as R,ze as a,j as b,_e as c,Ue as i,ke as r};
