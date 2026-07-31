const Ce={chrome:268435456,firefox:1073676289,safari:16777216,default:16777216};function ge(){const e=navigator.userAgent.toLowerCase();return e.includes("chrome")||e.includes("edge")?"chrome":e.includes("firefox")?"firefox":e.includes("safari")&&!e.includes("chrome")?"safari":"default"}function pe(){const e=ge();return Ce[e]}function ve(e,o){const t=pe(),r=e*o;if(r>t){const a=ge(),i=Math.floor(Math.sqrt(t));throw new Error(`Canvas size ${e}x${o} (${r.toLocaleString()} pixels) exceeds ${a} limit of ${Math.floor(Math.sqrt(t))}x${Math.floor(Math.sqrt(t))} (${t.toLocaleString()} pixels). Maximum dimension: ${i}px.`)}}function _e(){try{const o=(typeof globalThis<"u"?globalThis:window).OffscreenCanvas;return typeof o=="function"&&typeof o.prototype.convertToBlob=="function"?o:void 0}catch{return}}function j(e,o){ve(e,o);const t=_e();if(t){const r=new t(e,o),a=r.getContext("2d");if(!a)throw new Error("Failed to get 2D context from OffscreenCanvas");return{canvas:r,ctx:a}}else{const r=document.createElement("canvas");r.width=e,r.height=o;const a=r.getContext("2d");if(!a)throw new Error("Failed to get 2D context from Canvas");return{canvas:r,ctx:a}}}async function Ie(e,o="image/png",t){if(typeof e.convertToBlob=="function")return e.convertToBlob({type:o,quality:t});const r=e;return new Promise((a,i)=>{r.toBlob(l=>{l?a(l):i(new Error("Failed to convert canvas to blob"))},o,t)})}const Oe={STANDARD:512,PREVIEW:512,HIGH_RES:1024},Le={DEFAULT_CIRCLE_SIZE:250},Re={BYTES_PER_KB:1024};class Ae{startTime=0;marks=new Map;start(){this.startTime=performance.now(),this.marks.clear()}mark(o){this.marks.set(o,performance.now())}elapsed(){return performance.now()-this.startTime}duration(o,t){const r=this.marks.get(o),a=this.marks.get(t);return r===void 0||a===void 0?0:a-r}complete(o,t,r,a){const i=this.elapsed(),l=this.duration("start","imageLoaded"),f=this.duration("imageLoaded","renderComplete"),m=this.duration("renderComplete","exportComplete"),S=o.width*o.height*4,s=t.width*t.height*4,c=S+s;return{totalTime:i,imageLoadTime:l,renderTime:f,exportTime:m,inputSize:o,outputSize:t,wasDownsampled:r,downsampleRatio:a,estimatedMemory:c}}}function we(e,o,t,r=2){const a=t*r;if(e<=a&&o<=a)return{width:e,height:o,scale:1};const i=Math.min(a/e,a/o);return{width:Math.round(e*i),height:Math.round(o*i),scale:i}}async function Ee(e,o,t){if(e.width===o&&e.height===t)return e;const{canvas:r,ctx:a}=j(o,t);return a.imageSmoothingEnabled=!0,a.imageSmoothingQuality="high",a.drawImage(e,0,0,o,t),createImageBitmap(r)}function Pe(e,o,t,r=2){return Math.max(e,o)>t*r}async function Ue(e,o,t){const r=new Ae,a=t.enablePerformanceTracking??!1;a&&(r.start(),r.mark("start"));const i=t.enableDownsampling??!0;let l=e,f=!1,m=1;if(i&&Pe(e.width,e.height,t.size)){const x=we(e.width,e.height,t.size);l=await Ee(e,x.width,x.height),f=!0,m=x.scale,a&&r.mark("imageDownsampled")}a&&r.mark("imageLoaded"),t.onProgress?.(.2);const S=t.size,s=S,c=S,A=Math.min(s,c),U=Math.round(t.thicknessPct/100*A),M=Math.round((t.paddingPct??0)/100*A),{canvas:T,ctx:n}=j(s,c);n.imageSmoothingEnabled=!0,n.imageSmoothingQuality="high",t.backgroundColor&&(n.save(),n.fillStyle=t.backgroundColor,n.fillRect(0,0,s,c),n.restore());const w=Math.min(s,c)/2,C=w-Math.max(1,M),v=Math.max(0,C-U),W=v+1,I=(o.modes?.ring?.colors??[]).map(x=>({color:x,weight:1})),b=I.length,u=t.presentation;let h;if(u==="ring"?h="concentric":u==="segment"?h="angular":u==="cutout"?h="cutout":h="concentric",h==="cutout"){n.save();const x=l.width,q=l.height,z=W*2,H=1+(t.imageZoom??0)/100,V=t.originalImageDimensions?.width??x,Z=t.originalImageDimensions?.height??q;let d;if(t.circleSize&&t.circleSize>0){const P=Math.max(t.circleSize/V,t.circleSize/Z)*H,$=z/t.circleSize;d=P*$}else d=Math.max(z/V,z/Z)*H;const Q=f&&m>0?d/m:d,F=x*Q,B=q*Q,y=s/2,X=c/2,te=t.imageOffsetPx?.x??0,K=t.imageOffsetPx?.y??0;n.drawImage(l,y-F/2+te,X-B/2+K,F,B),n.globalCompositeOperation="destination-in",n.fillStyle="#ffffff",n.beginPath(),n.arc(y,X,W,0,Math.PI*2),n.closePath(),n.fill(),n.globalCompositeOperation="source-over",n.restore(),t.onProgress?.(.4);const p=t.flagOffsetPct?.x??0,_=s,O=Math.abs(p/50)*_*3,{canvas:L,ctx:g}=j(s+O,c);g.imageSmoothingEnabled=!0,g.imageSmoothingQuality="high";const G=O/2+w;if(t.borderImageBitmap){const R=C*2,P=R,$=o.aspectRatio??2,N=P*$,ae=(N-R)/2,oe=-(p/50)*ae,re=G-N/2+oe,ne=w-P/2;g.drawImage(t.borderImageBitmap,re,ne,N,P)}else{let R=0;for(const P of I){const N=P.weight/b*c;g.fillStyle=P.color,g.fillRect(0,R,L.width,N),R+=N}}g.globalCompositeOperation="destination-in",g.fillStyle="white",g.beginPath(),g.arc(G,w,C,0,Math.PI*2),g.arc(G,w,v,Math.PI*2,0,!0),g.fill(),n.drawImage(L,-O/2,0)}else{n.save();const x=l.width,q=l.height,z=W*2,H=1+(t.imageZoom??0)/100,V=t.originalImageDimensions?.width??x,Z=t.originalImageDimensions?.height??q;let d;if(t.circleSize&&t.circleSize>0){const _=Math.max(t.circleSize/V,t.circleSize/Z)*H,O=z/t.circleSize;d=_*O}else d=Math.max(z/V,z/Z)*H;const Q=f&&m>0?d/m:d,F=x*Q,B=q*Q,y=s/2,X=c/2,te=t.imageOffsetPx?.x??0,K=t.imageOffsetPx?.y??0;if(n.drawImage(l,y-F/2+te,X-B/2+K,F,B),n.globalCompositeOperation="destination-in",n.fillStyle="#ffffff",n.beginPath(),n.arc(y,X,W,0,Math.PI*2),n.closePath(),n.fill(),n.globalCompositeOperation="source-over",n.restore(),t.onProgress?.(.5),t.borderImageBitmap&&u!=="cutout"){const p=Math.max(1,Math.round(C-v)),_=(v+C)/2,L=Math.max(2,Math.round(2*Math.PI*_)),g=p;try{const{canvas:G,ctx:R}=j(L,g),P=t.borderImageBitmap.width,$=t.borderImageBitmap.height,N=Math.max(L/P,g/$),ae=Math.round(P*N),oe=Math.round($*N),re=Math.round((L-ae)/2),ne=Math.round((g-oe)/2);R.clearRect(0,0,L,g),R.drawImage(t.borderImageBitmap,0,0,P,$,re,ne,ae,oe);const de=await createImageBitmap(G),he=t.segmentRotation!==void 0?t.segmentRotation*Math.PI/180:0,xe=-Math.PI/2+he;le(n,y,v,C,de,xe,"normal")}catch{try{le(n,y,v,C,t.borderImageBitmap)}catch{n.save(),n.globalAlpha=.64,ce(n,y,v,C,I,b),n.restore()}}}else if(h==="concentric")ce(n,y,v,C,I,b);else{const p=t.segmentRotation!==void 0?t.segmentRotation*Math.PI/180:0;let _=-Math.PI/2+p;for(const O of I){const L=O.weight/b,g=Math.PI*2*L,G=_+g;Se(n,y,v,C,_,G,O.color),_=G}}}a&&r.mark("renderComplete"),t.onProgress?.(.8),t.outerStroke&&(n.beginPath(),n.arc(s/2,c/2,C,0,Math.PI*2),n.strokeStyle=t.outerStroke.color,n.lineWidth=t.outerStroke.widthPx,n.stroke());const ee=t.pngQuality??.92,k=await Ie(T,"image/png",ee),Y=k.size,D=(Y/Re.BYTES_PER_KB).toFixed(2);if(a){r.mark("exportComplete");const x=r.complete({width:e.width,height:e.height},{width:s,height:c},f,m);return t.onProgress?.(1),{blob:k,sizeBytes:Y,sizeKB:D,metrics:x}}return t.onProgress?.(1),{blob:k,sizeBytes:Y,sizeKB:D}}function ce(e,o,t,r,a,i){const l=r-t;let f=r;for(const m of a){const s=m.weight/i*l,c=Math.max(t,f-s);if(e.beginPath(),e.arc(o,o,f,0,Math.PI*2),e.arc(o,o,c,Math.PI*2,0,!0),e.closePath(),e.fillStyle=m.color,e.fill(),f=c,f<=t+.5)break}f>t+.5&&(e.beginPath(),e.arc(o,o,f,0,Math.PI*2),e.arc(o,o,t,Math.PI*2,0,!0),e.closePath(),e.fillStyle=a[a.length-1]?.color??"#000000",e.fill())}function Se(e,o,t,r,a,i,l){e.beginPath(),e.arc(o,o,r,a,i),e.arc(o,o,t,i,a,!0),e.closePath(),e.fillStyle=l,e.fill()}function le(e,o,t,r,a,i=0,l="normal"){const f=r-t;if(f<=0)return;const m=(t+r)/2,S=Math.max(1,Math.round(2*Math.PI*m)),s=Math.max(1,S),c=Math.max(1,Math.round(f)),{ctx:A}=j(s,c),U=a.width,M=a.height,T=Math.max(s/U,c/M),n=Math.round(U*T),w=Math.round(M*T),C=Math.round((s-n)/2),v=Math.round((c-w)/2);A.clearRect(0,0,s,c),A.drawImage(a,0,0,U,M,C,v,n,w);const E=A.getImageData(0,0,s,c).data,I=Math.floor(o-r),b=Math.floor(o-r),u=Math.ceil(r*2),h=u,{canvas:ee,ctx:k}=j(u,h),Y=k.createImageData(u,h),D=Y.data,x=Math.PI*2,q=1/x;for(let d=0;d<h;d++){const F=b+d+.5-o;for(let B=0;B<u;B++){const X=I+B+.5-o,te=X*X+F*F,K=Math.sqrt(te),p=(d*u+B)*4;if(K<t||K>r){D[p+0]=0,D[p+1]=0,D[p+2]=0,D[p+3]=0;continue}let _=Math.atan2(F,X);for(_-=i;_<0;)_+=x;for(;_>=x;)_-=x;const O=_*q*s,L=(K-t)/f*c,g=Math.min(s-1,Math.max(0,Math.floor(O))),R=(Math.min(c-1,Math.max(0,Math.floor(L)))*s+g)*4;D[p+0]=E[R+0],D[p+1]=E[R+1],D[p+2]=E[R+2],D[p+3]=E[R+3]}}if(k.putImageData(Y,0,0),l==="normal"){e.save(),e.drawImage(ee,I,b),e.restore();return}const{canvas:z,ctx:J}=j(u,h);J.clearRect(0,0,u,h),J.drawImage(e.canvas,I,b,u,h,0,0,u,h);const H=J.getImageData(0,0,u,h),V=H.data,Z=k.getImageData(0,0,u,h).data;for(let d=0;d<V.length;d+=4)Z[d+3]>8&&(V[d+3]=0);J.putImageData(H,0,0),e.save(),e.drawImage(z,I,b),e.restore()}function me(e){const o={alpha:!0,premultipliedAlpha:!1,preserveDrawingBuffer:!1,antialias:!0};let t=e.getContext("webgl2",o);return t||(t=e.getContext("webgl",o),t)?t:e instanceof HTMLCanvasElement?e.getContext("experimental-webgl",o):null}function fe(e,o,t){const r=e.createShader(t);if(!r)throw new Error(`Failed to create shader of type ${t}`);if(e.shaderSource(r,o),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){const a=e.getShaderInfoLog(r);throw e.deleteShader(r),new Error(`Shader compilation failed: ${a}`)}return r}function ie(e,o,t){const r=fe(e,o,e.VERTEX_SHADER),a=fe(e,t,e.FRAGMENT_SHADER),i=e.createProgram();if(!i)throw new Error("Failed to create program");if(e.attachShader(i,r),e.attachShader(i,a),e.linkProgram(i),!e.getProgramParameter(i,e.LINK_STATUS)){const l=e.getProgramInfoLog(i);throw e.deleteProgram(i),new Error(`Program linking failed: ${l}`)}return e.deleteShader(r),e.deleteShader(a),i}function ue(e,o){const t=e.createTexture();if(!t)throw new Error("Failed to create texture");return e.bindTexture(e.TEXTURE_2D,t),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,o),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),t}function Me(e){const o=e.createBuffer();if(!o)throw new Error("Failed to create quad buffer");const t=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);return e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,t,e.STATIC_DRAW),o}const se=`
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
  // Pass through position
  gl_Position = vec4(a_position, 0.0, 1.0);
  
  // Convert from -1..1 to 0..1 for texture coordinates
  v_texCoord = a_position * 0.5 + 0.5;
}
`;function Te(){try{const e=document.createElement("canvas");return me(e)!==null}catch{return!1}}const be=`
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
  // Hard cutoff at the outer boundary — CSS border-radius on the canvas element provides
  // the circular anti-aliased clip, so shader AA here only adds a semi-transparent colour halo.
  float ringOuterAlpha = 1.0 - step(u_ringOuterRadius, radius);
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
`,De=`
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
  float ringOuterAlpha = 1.0 - step(u_ringOuterRadius, radius);
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
`,ye=`
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
  float ringOuterAlpha = 1.0 - step(u_ringOuterRadius, radius);
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
`;class Be{offscreen;imageCanvas;imageCtx;gl;programs;quadBuffer;size;constructor(o){this.size=o,this.offscreen=new OffscreenCanvas(o,o),this.imageCanvas=new OffscreenCanvas(o,o);const t=this.imageCanvas.getContext("2d");if(!t)throw new Error("Failed to create 2D context for image pre-processing");this.imageCtx=t;const r=me(this.offscreen);if(!r)throw new Error("WebGL not supported");this.gl=r,this.programs={ring:ie(r,se,be),segment:ie(r,se,De),cutout:ie(r,se,ye)},this.quadBuffer=Me(r)}render(o,t,r){const a=this.gl,i=this.size,l=i/2,f=i/2,m=Math.max(1,r.thicknessPct*i/100),s=i/2,c=Math.max(0,s-m),A=c;a.viewport(0,0,i,i),a.clearColor(0,0,0,0),a.clear(a.COLOR_BUFFER_BIT);const U=this.preRenderImage(o,A,r);a.activeTexture(a.TEXTURE0);const M=ue(a,U),T=r.presentation??"ring";let n;T==="segment"?n=this.programs.segment:T==="cutout"&&r.borderImageBitmap?n=this.programs.cutout:n=this.programs.ring,a.useProgram(n),a.activeTexture(a.TEXTURE0),a.bindTexture(a.TEXTURE_2D,M),a.uniform1i(a.getUniformLocation(n,"u_image"),0),a.uniform2f(a.getUniformLocation(n,"u_center"),l,f),a.uniform1f(a.getUniformLocation(n,"u_imageRadius"),A),a.uniform1f(a.getUniformLocation(n,"u_ringInnerRadius"),c),a.uniform1f(a.getUniformLocation(n,"u_ringOuterRadius"),s),a.uniform2f(a.getUniformLocation(n,"u_resolution"),i,i);const w=t.modes?.ring?.colors??[],C=[];for(const E of w)C.push(parseInt(E.slice(1,3),16)/255,parseInt(E.slice(3,5),16)/255,parseInt(E.slice(5,7),16)/255);let v=null;if(T==="segment"){const E=(r.segmentRotation??0)*Math.PI/180;a.uniform1f(a.getUniformLocation(n,"u_rotation"),E),a.uniform1i(a.getUniformLocation(n,"u_colorCount"),w.length),a.uniform3fv(a.getUniformLocation(n,"u_colors"),new Float32Array(C))}else if(T==="cutout"&&r.borderImageBitmap){const E=r.flagOffsetPct??{x:0},I=s*2,b=r.borderImageBitmap.width/r.borderImageBitmap.height,u=I*b,h=Math.max(0,(u-I)/2),ee=-(E.x/50)*h,k=l-u/2+ee,Y=f-I/2;a.activeTexture(a.TEXTURE1),v=ue(a,r.borderImageBitmap),a.bindTexture(a.TEXTURE_2D,v),a.uniform1i(a.getUniformLocation(n,"u_flagTexture"),1),a.uniform2f(a.getUniformLocation(n,"u_flagSize"),u,I),a.uniform2f(a.getUniformLocation(n,"u_flagPos"),k,Y)}else a.uniform1i(a.getUniformLocation(n,"u_colorCount"),w.length),a.uniform3fv(a.getUniformLocation(n,"u_colors"),new Float32Array(C));const W=a.getAttribLocation(n,"a_position");return a.bindBuffer(a.ARRAY_BUFFER,this.quadBuffer),a.enableVertexAttribArray(W),a.vertexAttribPointer(W,2,a.FLOAT,!1,0,0),a.drawArrays(a.TRIANGLES,0,6),a.deleteTexture(M),v&&a.deleteTexture(v),this.offscreen.transferToImageBitmap()}preRenderImage(o,t,r){const a=this.size,i=this.imageCtx;i.clearRect(0,0,a,a);const l=o.width,f=o.height,m=t*2,S=1+(r.imageZoom??0)/100,s=r.originalImageDimensions?.width??l,c=r.originalImageDimensions?.height??f;let A;r.circleSize&&r.circleSize>0?A=Math.max(r.circleSize/s,r.circleSize/c)*S*m/r.circleSize:A=Math.max(m/s,m/c)*S;const U=l*A,M=f*A,T=a/2+(r.imageOffsetPx?.x??0),n=a/2+(r.imageOffsetPx?.y??0);return i.save(),i.translate(0,a),i.scale(1,-1),i.drawImage(o,T-U/2,n-M/2,U,M),i.restore(),this.imageCanvas}static isSupported(){return Te()}destroy(){const o=this.gl;o.deleteProgram(this.programs.ring),o.deleteProgram(this.programs.segment),o.deleteProgram(this.programs.cutout),o.deleteBuffer(this.quadBuffer)}}export{Le as I,Be as L,Oe as R,j as a,Ie as c,Ue as r};
