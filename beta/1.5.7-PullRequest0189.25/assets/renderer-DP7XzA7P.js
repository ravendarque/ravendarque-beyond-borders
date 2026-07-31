const we={chrome:268435456,firefox:1073676289,safari:16777216,default:16777216};function he(){const e=navigator.userAgent.toLowerCase();return e.includes("chrome")||e.includes("edge")?"chrome":e.includes("firefox")?"firefox":e.includes("safari")&&!e.includes("chrome")?"safari":"default"}function Pe(){const e=he();return we[e]}function Te(e,r){const t=Pe(),a=e*r;if(a>t){const o=he(),s=Math.floor(Math.sqrt(t));throw new Error(`Canvas size ${e}x${r} (${a.toLocaleString()} pixels) exceeds ${o} limit of ${Math.floor(Math.sqrt(t))}x${Math.floor(Math.sqrt(t))} (${t.toLocaleString()} pixels). Maximum dimension: ${s}px.`)}}function xe(){try{const r=(typeof globalThis<"u"?globalThis:window).OffscreenCanvas;return typeof r=="function"&&typeof r.prototype.convertToBlob=="function"?r:void 0}catch{return}}function fe(){return xe()!==void 0}function ie(e,r){Te(e,r);const t=xe();if(t)return new t(e,r);const a=document.createElement("canvas");return a.width=e,a.height=r,a}function ee(e,r){const t=ie(e,r),a=t.getContext("2d");if(!a)throw new Error("Failed to get 2D context from canvas");return{canvas:t,ctx:a}}async function _e(e,r="image/png",t){if(typeof e.convertToBlob=="function")return e.convertToBlob({type:r,quality:t});const a=e;return new Promise((o,s)=>{a.toBlob(n=>{n?o(n):s(new Error("Failed to convert canvas to blob"))},r,t)})}const Ue={STANDARD:512,PREVIEW:512,HIGH_RES:1024},Be={DEFAULT_CIRCLE_SIZE:250},be={BYTES_PER_KB:1024};class Se{startTime=0;marks=new Map;start(){this.startTime=performance.now(),this.marks.clear()}mark(r){this.marks.set(r,performance.now())}elapsed(){return performance.now()-this.startTime}duration(r,t){const a=this.marks.get(r),o=this.marks.get(t);return a===void 0||o===void 0?0:o-a}complete(r,t,a,o){const s=this.elapsed(),n=this.duration("start","imageLoaded"),u=this.duration("imageLoaded","renderComplete"),m=this.duration("renderComplete","exportComplete"),M=r.width*r.height*4,c=t.width*t.height*4,l=M+c;return{totalTime:s,imageLoadTime:n,renderTime:u,exportTime:m,inputSize:r,outputSize:t,wasDownsampled:a,downsampleRatio:o,estimatedMemory:l}}}function Me(e,r,t,a=2){const o=t*a;if(e<=o&&r<=o)return{width:e,height:r,scale:1};const s=Math.min(o/e,o/r);return{width:Math.round(e*s),height:Math.round(r*s),scale:s}}async function ye(e,r,t){if(e.width===r&&e.height===t)return e;const{canvas:a,ctx:o}=ee(r,t);return o.imageSmoothingEnabled=!0,o.imageSmoothingQuality="high",o.drawImage(e,0,0,r,t),createImageBitmap(a)}function Le(e,r,t,a=2){return Math.max(e,r)>t*a}async function ze(e,r,t){const a=new Se,o=t.enablePerformanceTracking??!1;o&&(a.start(),a.mark("start"));const s=t.enableDownsampling??!0;let n=e,u=!1,m=1;if(s&&Le(e.width,e.height,t.size)){const C=Me(e.width,e.height,t.size);n=await ye(e,C.width,C.height),u=!0,m=C.scale,o&&a.mark("imageDownsampled")}o&&a.mark("imageLoaded"),t.onProgress?.(.2);const M=t.size,c=M,l=M,A=Math.min(c,l),O=Math.round(t.thicknessPct/100*A),D=Math.round((t.paddingPct??0)/100*A),{canvas:w,ctx:i}=ee(c,l);i.imageSmoothingEnabled=!0,i.imageSmoothingQuality="high",t.backgroundColor&&(i.save(),i.fillStyle=t.backgroundColor,i.fillRect(0,0,c,l),i.restore());const P=Math.min(c,l)/2,d=P-Math.max(1,D),h=Math.max(0,d-O),U=h+1,_=(r.modes?.ring?.colors??[]).map(C=>({color:C,weight:1})),y=_.length,f=t.presentation;let g;if(f==="ring"?g="concentric":f==="segment"?g="angular":f==="cutout"?g="cutout":g="concentric",g==="cutout"){i.save();const C=n.width,N=n.height,z=U*2,$=1+(t.imageZoom??0)/100,Q=t.originalImageDimensions?.width??C,K=t.originalImageDimensions?.height??N;let I;if(t.circleSize&&t.circleSize>0){const B=Math.max(t.circleSize/Q,t.circleSize/K)*$,Z=z/t.circleSize;I=B*Z}else I=Math.max(z/Q,z/K)*$;const j=u&&m>0?I/m:I,W=C*j,G=N*j,F=c/2,Y=l/2,re=t.imageOffsetPx?.x??0,J=t.imageOffsetPx?.y??0;i.drawImage(n,F-W/2+re,Y-G/2+J,W,G),i.globalCompositeOperation="destination-in",i.fillStyle="#ffffff",i.beginPath(),i.arc(F,Y,U,0,Math.PI*2),i.closePath(),i.fill(),i.globalCompositeOperation="source-over",i.restore(),t.onProgress?.(.4);const E=t.flagOffsetPct?.x??0,T=c,k=Math.abs(E/50)*T*3,{canvas:X,ctx:v}=ee(c+k,l);v.imageSmoothingEnabled=!0,v.imageSmoothingQuality="high";const H=k/2+P;if(t.borderImageBitmap){const S=d*2,B=S,Z=r.aspectRatio??2,V=B*Z,ae=(V-S)/2,ne=-(E/50)*ae,ce=H-V/2+ne,le=P-B/2;v.drawImage(t.borderImageBitmap,ce,le,V,B)}else{let S=0;for(const B of _){const V=B.weight/y*l;v.fillStyle=B.color,v.fillRect(0,S,X.width,V),S+=V}}v.globalCompositeOperation="destination-in",v.fillStyle="white",v.beginPath(),v.arc(H,P,d,0,Math.PI*2),v.arc(H,P,h,Math.PI*2,0,!0),v.fill(),i.drawImage(X,-k/2,0)}else{i.save();const C=n.width,N=n.height,z=U*2,$=1+(t.imageZoom??0)/100,Q=t.originalImageDimensions?.width??C,K=t.originalImageDimensions?.height??N;let I;if(t.circleSize&&t.circleSize>0){const T=Math.max(t.circleSize/Q,t.circleSize/K)*$,k=z/t.circleSize;I=T*k}else I=Math.max(z/Q,z/K)*$;const j=u&&m>0?I/m:I,W=C*j,G=N*j,F=c/2,Y=l/2,re=t.imageOffsetPx?.x??0,J=t.imageOffsetPx?.y??0;if(i.drawImage(n,F-W/2+re,Y-G/2+J,W,G),i.globalCompositeOperation="destination-in",i.fillStyle="#ffffff",i.beginPath(),i.arc(F,Y,U,0,Math.PI*2),i.closePath(),i.fill(),i.globalCompositeOperation="source-over",i.restore(),t.onProgress?.(.5),t.borderImageBitmap&&f!=="cutout"){const E=Math.max(1,Math.round(d-h)),T=(h+d)/2,X=Math.max(2,Math.round(2*Math.PI*T)),v=E;try{const{canvas:H,ctx:S}=ee(X,v),B=t.borderImageBitmap.width,Z=t.borderImageBitmap.height,V=Math.max(X/B,v/Z),ae=Math.round(B*V),ne=Math.round(Z*V),ce=Math.round((X-ae)/2),le=Math.round((v-ne)/2);S.clearRect(0,0,X,v),S.drawImage(t.borderImageBitmap,0,0,B,Z,ce,le,ae,ne);const Ie=await createImageBitmap(H),Ae=t.segmentRotation!==void 0?t.segmentRotation*Math.PI/180:0,Ee=-Math.PI/2+Ae;me(i,F,h,d,Ie,Ee,"normal")}catch{try{me(i,F,h,d,t.borderImageBitmap)}catch{i.save(),i.globalAlpha=.64,ge(i,F,h,d,_,y),i.restore()}}}else if(g==="concentric")ge(i,F,h,d,_,y);else{const E=t.segmentRotation!==void 0?t.segmentRotation*Math.PI/180:0;let T=-Math.PI/2+E;for(const k of _){const X=k.weight/y,v=Math.PI*2*X,H=T+v;Oe(i,F,h,d,T,H,k.color),T=H}}}o&&a.mark("renderComplete"),t.onProgress?.(.8),t.outerStroke&&(i.beginPath(),i.arc(c/2,l/2,d,0,Math.PI*2),i.strokeStyle=t.outerStroke.color,i.lineWidth=t.outerStroke.widthPx,i.stroke());const b=t.pngQuality??.92,p=await _e(w,"image/png",b),L=p.size,R=(L/be.BYTES_PER_KB).toFixed(2);if(o){a.mark("exportComplete");const C=a.complete({width:e.width,height:e.height},{width:c,height:l},u,m);return t.onProgress?.(1),{blob:p,sizeBytes:L,sizeKB:R,metrics:C}}return t.onProgress?.(1),{blob:p,sizeBytes:L,sizeKB:R}}function ge(e,r,t,a,o,s){const n=a-t;let u=a;for(const m of o){const c=m.weight/s*n,l=Math.max(t,u-c);if(e.beginPath(),e.arc(r,r,u,0,Math.PI*2),e.arc(r,r,l,Math.PI*2,0,!0),e.closePath(),e.fillStyle=m.color,e.fill(),u=l,u<=t+.5)break}u>t+.5&&(e.beginPath(),e.arc(r,r,u,0,Math.PI*2),e.arc(r,r,t,Math.PI*2,0,!0),e.closePath(),e.fillStyle=o[o.length-1]?.color??"#000000",e.fill())}function Oe(e,r,t,a,o,s,n){e.beginPath(),e.arc(r,r,a,o,s),e.arc(r,r,t,s,o,!0),e.closePath(),e.fillStyle=n,e.fill()}function me(e,r,t,a,o,s=0,n="normal"){const u=a-t;if(u<=0)return;const m=(t+a)/2,M=Math.max(1,Math.round(2*Math.PI*m)),c=Math.max(1,M),l=Math.max(1,Math.round(u)),{ctx:A}=ee(c,l),O=o.width,D=o.height,w=Math.max(c/O,l/D),i=Math.round(O*w),P=Math.round(D*w),d=Math.round((c-i)/2),h=Math.round((l-P)/2);A.clearRect(0,0,c,l),A.drawImage(o,0,0,O,D,d,h,i,P);const x=A.getImageData(0,0,c,l).data,_=Math.floor(r-a),y=Math.floor(r-a),f=Math.ceil(a*2),g=f,{canvas:b,ctx:p}=ee(f,g),L=p.createImageData(f,g),R=L.data,C=Math.PI*2,N=1/C;for(let I=0;I<g;I++){const W=y+I+.5-r;for(let G=0;G<f;G++){const Y=_+G+.5-r,re=Y*Y+W*W,J=Math.sqrt(re),E=(I*f+G)*4;if(J<t||J>a){R[E+0]=0,R[E+1]=0,R[E+2]=0,R[E+3]=0;continue}let T=Math.atan2(W,Y);for(T-=s;T<0;)T+=C;for(;T>=C;)T-=C;const k=T*N*c,X=(J-t)/u*l,v=Math.min(c-1,Math.max(0,Math.floor(k))),S=(Math.min(l-1,Math.max(0,Math.floor(X)))*c+v)*4;R[E+0]=x[S+0],R[E+1]=x[S+1],R[E+2]=x[S+2],R[E+3]=x[S+3]}}if(p.putImageData(L,0,0),n==="normal"){e.save(),e.drawImage(b,_,y),e.restore();return}const{canvas:z,ctx:q}=ee(f,g);q.clearRect(0,0,f,g),q.drawImage(e.canvas,_,y,f,g,0,0,f,g);const $=q.getImageData(0,0,f,g),Q=$.data,K=p.getImageData(0,0,f,g).data;for(let I=0;I<Q.length;I+=4)K[I+3]>8&&(Q[I+3]=0);q.putImageData($,0,0),e.save(),e.drawImage(z,_,y),e.restore()}function ue(e){const r={alpha:!0,premultipliedAlpha:!1,preserveDrawingBuffer:!1,antialias:!0};let t=e.getContext("webgl2",r);return t||(t=e.getContext("webgl",r),t)?t:e instanceof HTMLCanvasElement?e.getContext("experimental-webgl",r):null}function de(e,r,t){const a=e.createShader(t);if(!a)throw new Error(`Failed to create shader of type ${t}`);if(e.shaderSource(a,r),e.compileShader(a),!e.getShaderParameter(a,e.COMPILE_STATUS)){const o=e.getShaderInfoLog(a);throw e.deleteShader(a),new Error(`Shader compilation failed: ${o}`)}return a}function te(e,r,t){const a=de(e,r,e.VERTEX_SHADER),o=de(e,t,e.FRAGMENT_SHADER),s=e.createProgram();if(!s)throw new Error("Failed to create program");if(e.attachShader(s,a),e.attachShader(s,o),e.linkProgram(s),!e.getProgramParameter(s,e.LINK_STATUS)){const n=e.getProgramInfoLog(s);throw e.deleteProgram(s),new Error(`Program linking failed: ${n}`)}return e.deleteShader(a),e.deleteShader(o),s}function se(e,r){const t=e.createTexture();if(!t)throw new Error("Failed to create texture");return e.bindTexture(e.TEXTURE_2D,t),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,r),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),t}function pe(e){const r=e.createBuffer();if(!r)throw new Error("Failed to create quad buffer");const t=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);return e.bindBuffer(e.ARRAY_BUFFER,r),e.bufferData(e.ARRAY_BUFFER,t,e.STATIC_DRAW),r}const oe=`
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
  // Pass through position
  gl_Position = vec4(a_position, 0.0, 1.0);
  
  // Convert from -1..1 to 0..1 for texture coordinates
  v_texCoord = a_position * 0.5 + 0.5;
}
`;function De(){try{const e=document.createElement("canvas");return ue(e)!==null}catch{return!1}}const Ce=`
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
  vec2 pixelCoord = v_texCoord * u_resolution;
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
`,ve=`
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
  vec2 pixelCoord = v_texCoord * u_resolution;
  vec2 pos = pixelCoord - u_center;
  float radius = length(pos);
  // Negate pos.y so angles increase clockwise, matching Canvas 2D convention
  // (Canvas 2D has y increasing downward; WebGL has y increasing upward in NDC).
  // Use PI/2 offset so segment 0 starts at 12 o'clock (North), matching the
  // Canvas 2D renderer which uses start = -PI/2 + rotationRad.
  float angle = atan(-pos.y, pos.x);
  
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
`,Re=`
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
  vec2 pixelCoord = v_texCoord * u_resolution;
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
`;async function Fe(e,r,t){const a=t.size,o=t.size,s=ie(a,o),n=ue(s);if(!n)throw new Error("Failed to create WebGL context");const u=Math.max(1,(t.paddingPct??0)*t.size/100),m=Math.max(1,t.thicknessPct*t.size/100),M=a/2,c=o/2,A=Math.min(a,o)/2-Math.max(1,u),O=Math.max(0,A-m),D=O;n.viewport(0,0,a,o);const w=t.presentation??"ring";let i;w==="segment"?i=te(n,oe,ve):w==="cutout"&&t.borderImageBitmap?i=te(n,oe,Re):i=te(n,oe,Ce);const P=pe(n),d=se(n,e),h=r.modes?.ring?.colors??[],U=[];for(const b of h){const p=parseInt(b.slice(1,3),16)/255,L=parseInt(b.slice(3,5),16)/255,R=parseInt(b.slice(5,7),16)/255;U.push(p,L,R)}n.bindFramebuffer(n.FRAMEBUFFER,null),n.clear(n.COLOR_BUFFER_BIT),n.useProgram(i);const x={u_image:n.getUniformLocation(i,"u_image"),u_center:n.getUniformLocation(i,"u_center"),u_imageRadius:n.getUniformLocation(i,"u_imageRadius"),u_ringInnerRadius:n.getUniformLocation(i,"u_ringInnerRadius"),u_ringOuterRadius:n.getUniformLocation(i,"u_ringOuterRadius"),u_resolution:n.getUniformLocation(i,"u_resolution")};n.activeTexture(n.TEXTURE0),n.bindTexture(n.TEXTURE_2D,d),n.uniform1i(x.u_image,0),n.uniform2f(x.u_center,M,c),n.uniform1f(x.u_imageRadius,D),n.uniform1f(x.u_ringInnerRadius,O),n.uniform1f(x.u_ringOuterRadius,A),n.uniform2f(x.u_resolution,a,o);let _=null;if(w==="segment"){const b=(t.segmentRotation??0)*Math.PI/180,p=n.getUniformLocation(i,"u_rotation"),L=n.getUniformLocation(i,"u_colorCount"),R=n.getUniformLocation(i,"u_colors");n.uniform1f(p,b),n.uniform1i(L,h.length),n.uniform3fv(R,new Float32Array(U))}else if(w==="cutout"&&t.borderImageBitmap){const b=t.flagOffsetPct??{x:0},p=A*2,L=t.borderImageBitmap.width/t.borderImageBitmap.height,R=p*L,C=Math.max(0,(R-p)/2),N=-(b.x/50)*C,z=M-R/2+N,q=c-p/2;n.activeTexture(n.TEXTURE1),_=se(n,t.borderImageBitmap),n.bindTexture(n.TEXTURE_2D,_),n.uniform1i(n.getUniformLocation(i,"u_flagTexture"),1),n.uniform2f(n.getUniformLocation(i,"u_flagSize"),R,p),n.uniform2f(n.getUniformLocation(i,"u_flagPos"),z,q)}else{const b=n.getUniformLocation(i,"u_colorCount"),p=n.getUniformLocation(i,"u_colors");n.uniform1i(b,h.length),n.uniform3fv(p,new Float32Array(U))}const y=n.getAttribLocation(i,"a_position");n.bindBuffer(n.ARRAY_BUFFER,P),n.enableVertexAttribArray(y),n.vertexAttribPointer(y,2,n.FLOAT,!1,0,0),n.drawArrays(n.TRIANGLES,0,6);const f=t.pngQuality??.92,g=await _e(s,"image/png",f);return _&&n.deleteTexture(_),n.deleteTexture(d),n.deleteBuffer(P),n.deleteProgram(i),{blob:g,sizeBytes:g.size,sizeKB:(g.size/1024).toFixed(2)}}class ke{offscreen;imageCanvas;imageCtx;gl;programs;quadBuffer;size;constructor(r){if(this.size=r,!fe())throw new Error("OffscreenCanvas not supported — required for LiveAvatarRenderer");this.offscreen=ie(r,r),this.imageCanvas=ie(r,r);const t=this.imageCanvas.getContext("2d");if(!t)throw new Error("Failed to create 2D context for image pre-processing");this.imageCtx=t;const a=ue(this.offscreen);if(!a)throw new Error("WebGL not supported");this.gl=a,this.programs={ring:te(a,oe,Ce),segment:te(a,oe,ve),cutout:te(a,oe,Re)},this.quadBuffer=pe(a)}render(r,t,a){const o=this.gl,s=this.size,n=s/2,u=s/2,m=Math.max(1,a.thicknessPct*s/100),c=s/2,l=Math.max(0,c-m),A=l;o.viewport(0,0,s,s),o.clearColor(0,0,0,0),o.clear(o.COLOR_BUFFER_BIT);const O=this.preRenderImage(r,A,a);o.activeTexture(o.TEXTURE0);const D=se(o,O),w=a.presentation??"ring";let i;w==="segment"?i=this.programs.segment:w==="cutout"&&a.borderImageBitmap?i=this.programs.cutout:i=this.programs.ring,o.useProgram(i),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,D),o.uniform1i(o.getUniformLocation(i,"u_image"),0),o.uniform2f(o.getUniformLocation(i,"u_center"),n,u),o.uniform1f(o.getUniformLocation(i,"u_imageRadius"),A),o.uniform1f(o.getUniformLocation(i,"u_ringInnerRadius"),l),o.uniform1f(o.getUniformLocation(i,"u_ringOuterRadius"),c),o.uniform2f(o.getUniformLocation(i,"u_resolution"),s,s);const P=t.modes?.ring?.colors??[],d=[];for(const x of P)d.push(parseInt(x.slice(1,3),16)/255,parseInt(x.slice(3,5),16)/255,parseInt(x.slice(5,7),16)/255);let h=null;if(w==="segment"){const x=(a.segmentRotation??0)*Math.PI/180;o.uniform1f(o.getUniformLocation(i,"u_rotation"),x),o.uniform1i(o.getUniformLocation(i,"u_colorCount"),P.length),o.uniform3fv(o.getUniformLocation(i,"u_colors"),new Float32Array(d))}else if(w==="cutout"&&a.borderImageBitmap){const x=a.flagOffsetPct??{x:0},_=c*2,y=a.borderImageBitmap.width/a.borderImageBitmap.height,f=_*y,g=Math.max(0,(f-_)/2),b=-(x.x/50)*g,p=n-f/2+b,L=u-_/2;o.activeTexture(o.TEXTURE1),h=se(o,a.borderImageBitmap),o.bindTexture(o.TEXTURE_2D,h),o.uniform1i(o.getUniformLocation(i,"u_flagTexture"),1),o.uniform2f(o.getUniformLocation(i,"u_flagSize"),f,_),o.uniform2f(o.getUniformLocation(i,"u_flagPos"),p,L)}else o.uniform1i(o.getUniformLocation(i,"u_colorCount"),P.length),o.uniform3fv(o.getUniformLocation(i,"u_colors"),new Float32Array(d));const U=o.getAttribLocation(i,"a_position");return o.bindBuffer(o.ARRAY_BUFFER,this.quadBuffer),o.enableVertexAttribArray(U),o.vertexAttribPointer(U,2,o.FLOAT,!1,0,0),o.drawArrays(o.TRIANGLES,0,6),o.deleteTexture(D),h&&o.deleteTexture(h),this.offscreen.transferToImageBitmap()}preRenderImage(r,t,a){const o=this.size,s=this.imageCtx;s.clearRect(0,0,o,o);const n=r.width,u=r.height,m=t*2,M=1+(a.imageZoom??0)/100,c=a.originalImageDimensions?.width??n,l=a.originalImageDimensions?.height??u;let A;a.circleSize&&a.circleSize>0?A=Math.max(a.circleSize/c,a.circleSize/l)*M*m/a.circleSize:A=Math.max(m/c,m/l)*M;const O=n*A,D=u*A,w=o/2+(a.imageOffsetPx?.x??0),i=o/2+(a.imageOffsetPx?.y??0);return s.save(),s.translate(0,o),s.scale(1,-1),s.drawImage(r,w-O/2,i-D/2,O,D),s.restore(),this.imageCanvas}static isSupported(){return De()&&fe()}destroy(){const r=this.gl;r.deleteProgram(this.programs.ring),r.deleteProgram(this.programs.segment),r.deleteProgram(this.programs.cutout),r.deleteBuffer(this.quadBuffer)}}export{Be as I,ke as L,Ue as R,ze as a,ee as b,_e as c,De as i,Fe as r};
