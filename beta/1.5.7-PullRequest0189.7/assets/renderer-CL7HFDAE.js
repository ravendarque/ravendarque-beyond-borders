const Ce={chrome:268435456,firefox:1073676289,safari:16777216,default:16777216};function me(){const e=navigator.userAgent.toLowerCase();return e.includes("chrome")||e.includes("edge")?"chrome":e.includes("firefox")?"firefox":e.includes("safari")&&!e.includes("chrome")?"safari":"default"}function pe(){const e=me();return Ce[e]}function ve(e,a){const t=pe(),n=e*a;if(n>t){const i=me(),s=Math.floor(Math.sqrt(t));throw new Error(`Canvas size ${e}x${a} (${n.toLocaleString()} pixels) exceeds ${i} limit of ${Math.floor(Math.sqrt(t))}x${Math.floor(Math.sqrt(t))} (${t.toLocaleString()} pixels). Maximum dimension: ${s}px.`)}}function Ie(){try{const a=(typeof globalThis<"u"?globalThis:window).OffscreenCanvas;return typeof a=="function"&&typeof a.prototype.convertToBlob=="function"?a:void 0}catch{return}}function ee(e,a){ve(e,a);const t=Ie();if(t){const n=new t(e,a),i=n.getContext("2d");if(!i)throw new Error("Failed to get 2D context from OffscreenCanvas");return{canvas:n,ctx:i}}else{const n=document.createElement("canvas");n.width=e,n.height=a;const i=n.getContext("2d");if(!i)throw new Error("Failed to get 2D context from Canvas");return{canvas:n,ctx:i}}}async function ge(e,a="image/png",t){if(typeof e.convertToBlob=="function")return e.convertToBlob({type:a,quality:t});const n=e;return new Promise((i,s)=>{n.toBlob(o=>{o?i(o):s(new Error("Failed to convert canvas to blob"))},a,t)})}const Oe={HIGH_RES:1024},De={DEFAULT_CIRCLE_SIZE:250},Re={BYTES_PER_KB:1024};class Ae{startTime=0;marks=new Map;start(){this.startTime=performance.now(),this.marks.clear()}mark(a){this.marks.set(a,performance.now())}elapsed(){return performance.now()-this.startTime}duration(a,t){const n=this.marks.get(a),i=this.marks.get(t);return n===void 0||i===void 0?0:i-n}complete(a,t,n,i){const s=this.elapsed(),o=this.duration("start","imageLoaded"),h=this.duration("imageLoaded","renderComplete"),C=this.duration("renderComplete","exportComplete"),B=a.width*a.height*4,l=t.width*t.height*4,u=B+l;return{totalTime:s,imageLoadTime:o,renderTime:h,exportTime:C,inputSize:a,outputSize:t,wasDownsampled:n,downsampleRatio:i,estimatedMemory:u}}}function Ee(e,a,t,n=2){const i=t*n;if(e<=i&&a<=i)return{width:e,height:a,scale:1};const s=Math.min(i/e,i/a);return{width:Math.round(e*s),height:Math.round(a*s),scale:s}}async function Me(e,a,t){if(e.width===a&&e.height===t)return e;const{canvas:n,ctx:i}=ee(a,t);return i.imageSmoothingEnabled=!0,i.imageSmoothingQuality="high",i.drawImage(e,0,0,a,t),createImageBitmap(n)}function we(e,a,t,n=2){return Math.max(e,a)>t*n}async function Le(e,a,t){const n=new Ae,i=t.enablePerformanceTracking??!1;i&&(n.start(),n.mark("start"));const s=t.enableDownsampling??!0;let o=e,h=!1,C=1;if(s&&we(e.width,e.height,t.size)){const f=Ee(e.width,e.height,t.size);o=await Me(e,f.width,f.height),h=!0,C=f.scale,i&&n.mark("imageDownsampled")}i&&n.mark("imageLoaded"),t.onProgress?.(.2);const B=t.size,l=B,u=B,P=Math.min(l,u),z=Math.round(t.thicknessPct/100*P),j=Math.round((t.paddingPct??0)/100*P),{canvas:G,ctx:r}=ee(l,u);r.imageSmoothingEnabled=!0,r.imageSmoothingQuality="high",t.backgroundColor&&(r.save(),r.fillStyle=t.backgroundColor,r.fillRect(0,0,l,u),r.restore());const F=Math.min(l,u)/2,p=F-Math.max(1,j),v=Math.max(0,p-z),Y=v+1,A=(a.modes?.ring?.colors??[]).map(f=>({color:f,weight:1})),T=A.length,g=t.presentation;let c;if(g==="ring"?c="concentric":g==="segment"?c="angular":g==="cutout"?c="cutout":c="concentric",c==="cutout"){r.save();const f=o.width,W=o.height,y=Y*2,k=1+(t.imageZoom??0)/100,O=t.originalImageDimensions?.width??f,H=t.originalImageDimensions?.height??W;let m;if(t.circleSize&&t.circleSize>0){const w=Math.max(t.circleSize/O,t.circleSize/H)*k,K=y/t.circleSize;m=w*K}else m=Math.max(y/O,y/H)*k;const N=h&&C>0?m/C:m,V=f*N,X=W*N,D=l/2,$=u/2,te=t.imageOffsetPx?.x??0,J=t.imageOffsetPx?.y??0;r.drawImage(o,D-V/2+te,$-X/2+J,V,X),r.globalCompositeOperation="destination-in",r.fillStyle="#ffffff",r.beginPath(),r.arc(D,$,Y,0,Math.PI*2),r.closePath(),r.fill(),r.globalCompositeOperation="source-over",r.restore(),t.onProgress?.(.4);const _=t.flagOffsetPct?.x??0,x=l,L=Math.abs(_/50)*x*3,{canvas:U,ctx:d}=ee(l+L,u);d.imageSmoothingEnabled=!0,d.imageSmoothingQuality="high";const Q=L/2+F;if(t.borderImageBitmap){const R=p*2,w=R,K=a.aspectRatio??2,Z=w*K,oe=(Z-R)/2,ae=-(_/50)*oe,re=Q-Z/2+ae,ne=F-w/2;d.drawImage(t.borderImageBitmap,re,ne,Z,w)}else{let R=0;for(const w of A){const Z=w.weight/T*u;d.fillStyle=w.color,d.fillRect(0,R,U.width,Z),R+=Z}}d.globalCompositeOperation="destination-in",d.fillStyle="white",d.beginPath(),d.arc(Q,F,p,0,Math.PI*2),d.arc(Q,F,v,Math.PI*2,0,!0),d.fill(),r.drawImage(U,-L/2,0)}else{r.save();const f=o.width,W=o.height,y=Y*2,k=1+(t.imageZoom??0)/100,O=t.originalImageDimensions?.width??f,H=t.originalImageDimensions?.height??W;let m;if(t.circleSize&&t.circleSize>0){const x=Math.max(t.circleSize/O,t.circleSize/H)*k,L=y/t.circleSize;m=x*L}else m=Math.max(y/O,y/H)*k;const N=h&&C>0?m/C:m,V=f*N,X=W*N,D=l/2,$=u/2,te=t.imageOffsetPx?.x??0,J=t.imageOffsetPx?.y??0;if(r.drawImage(o,D-V/2+te,$-X/2+J,V,X),r.globalCompositeOperation="destination-in",r.fillStyle="#ffffff",r.beginPath(),r.arc(D,$,Y,0,Math.PI*2),r.closePath(),r.fill(),r.globalCompositeOperation="source-over",r.restore(),t.onProgress?.(.5),t.borderImageBitmap&&g!=="cutout"){const _=Math.max(1,Math.round(p-v)),x=(v+p)/2,U=Math.max(2,Math.round(2*Math.PI*x)),d=_;try{const{canvas:Q,ctx:R}=ee(U,d),w=t.borderImageBitmap.width,K=t.borderImageBitmap.height,Z=Math.max(U/w,d/K),oe=Math.round(w*Z),ae=Math.round(K*Z),re=Math.round((U-oe)/2),ne=Math.round((d-ae)/2);R.clearRect(0,0,U,d),R.drawImage(t.borderImageBitmap,0,0,w,K,re,ne,oe,ae);const he=await createImageBitmap(Q),_e=t.segmentRotation!==void 0?t.segmentRotation*Math.PI/180:0,xe=-Math.PI/2+_e;le(r,D,v,p,he,xe,"normal")}catch{try{le(r,D,v,p,t.borderImageBitmap)}catch{r.save(),r.globalAlpha=.64,ce(r,D,v,p,A,T),r.restore()}}}else if(c==="concentric")ce(r,D,v,p,A,T);else{const _=t.segmentRotation!==void 0?t.segmentRotation*Math.PI/180:0;let x=-Math.PI/2+_;for(const L of A){const U=L.weight/T,d=Math.PI*2*U,Q=x+d;Pe(r,D,v,p,x,Q,L.color),x=Q}}}i&&n.mark("renderComplete"),t.onProgress?.(.8),t.outerStroke&&(r.beginPath(),r.arc(l/2,u/2,p,0,Math.PI*2),r.strokeStyle=t.outerStroke.color,r.lineWidth=t.outerStroke.widthPx,r.stroke());const S=t.pngQuality??.92,E=await ge(G,"image/png",S),b=E.size,I=(b/Re.BYTES_PER_KB).toFixed(2);if(i){n.mark("exportComplete");const f=n.complete({width:e.width,height:e.height},{width:l,height:u},h,C);return t.onProgress?.(1),{blob:E,sizeBytes:b,sizeKB:I,metrics:f}}return t.onProgress?.(1),{blob:E,sizeBytes:b,sizeKB:I}}function ce(e,a,t,n,i,s){const o=n-t;let h=n;for(const C of i){const l=C.weight/s*o,u=Math.max(t,h-l);if(e.beginPath(),e.arc(a,a,h,0,Math.PI*2),e.arc(a,a,u,Math.PI*2,0,!0),e.closePath(),e.fillStyle=C.color,e.fill(),h=u,h<=t+.5)break}h>t+.5&&(e.beginPath(),e.arc(a,a,h,0,Math.PI*2),e.arc(a,a,t,Math.PI*2,0,!0),e.closePath(),e.fillStyle=i[i.length-1]?.color??"#000000",e.fill())}function Pe(e,a,t,n,i,s,o){e.beginPath(),e.arc(a,a,n,i,s),e.arc(a,a,t,s,i,!0),e.closePath(),e.fillStyle=o,e.fill()}function le(e,a,t,n,i,s=0,o="normal"){const h=n-t;if(h<=0)return;const C=(t+n)/2,B=Math.max(1,Math.round(2*Math.PI*C)),l=Math.max(1,B),u=Math.max(1,Math.round(h)),{ctx:P}=ee(l,u),z=i.width,j=i.height,G=Math.max(l/z,u/j),r=Math.round(z*G),F=Math.round(j*G),p=Math.round((l-r)/2),v=Math.round((u-F)/2);P.clearRect(0,0,l,u),P.drawImage(i,0,0,z,j,p,v,r,F);const M=P.getImageData(0,0,l,u).data,A=Math.floor(a-n),T=Math.floor(a-n),g=Math.ceil(n*2),c=g,{canvas:S,ctx:E}=ee(g,c),b=E.createImageData(g,c),I=b.data,f=Math.PI*2,W=1/f;for(let m=0;m<c;m++){const V=T+m+.5-a;for(let X=0;X<g;X++){const $=A+X+.5-a,te=$*$+V*V,J=Math.sqrt(te),_=(m*g+X)*4;if(J<t||J>n){I[_+0]=0,I[_+1]=0,I[_+2]=0,I[_+3]=0;continue}let x=Math.atan2(V,$);for(x-=s;x<0;)x+=f;for(;x>=f;)x-=f;const L=x*W*l,U=(J-t)/h*u,d=Math.min(l-1,Math.max(0,Math.floor(L))),R=(Math.min(u-1,Math.max(0,Math.floor(U)))*l+d)*4;I[_+0]=M[R+0],I[_+1]=M[R+1],I[_+2]=M[R+2],I[_+3]=M[R+3]}}if(E.putImageData(b,0,0),o==="normal"){e.save(),e.drawImage(S,A,T),e.restore();return}const{canvas:y,ctx:q}=ee(g,c);q.clearRect(0,0,g,c),q.drawImage(e.canvas,A,T,g,c,0,0,g,c);const k=q.getImageData(0,0,g,c),O=k.data,H=E.getImageData(0,0,g,c).data;for(let m=0;m<O.length;m+=4)H[m+3]>8&&(O[m+3]=0);q.putImageData(k,0,0),e.save(),e.drawImage(y,A,T),e.restore()}function de(e){const a={alpha:!0,premultipliedAlpha:!1,preserveDrawingBuffer:!1,antialias:!0};let t=e.getContext("webgl2",a);return t||(t=e.getContext("webgl",a),t)?t:e instanceof HTMLCanvasElement?e.getContext("experimental-webgl",a):null}function ue(e,a,t){const n=e.createShader(t);if(!n)throw new Error(`Failed to create shader of type ${t}`);if(e.shaderSource(n,a),e.compileShader(n),!e.getShaderParameter(n,e.COMPILE_STATUS)){const i=e.getShaderInfoLog(n);throw e.deleteShader(n),new Error(`Shader compilation failed: ${i}`)}return n}function ie(e,a,t){const n=ue(e,a,e.VERTEX_SHADER),i=ue(e,t,e.FRAGMENT_SHADER),s=e.createProgram();if(!s)throw new Error("Failed to create program");if(e.attachShader(s,n),e.attachShader(s,i),e.linkProgram(s),!e.getProgramParameter(s,e.LINK_STATUS)){const o=e.getProgramInfoLog(s);throw e.deleteProgram(s),new Error(`Program linking failed: ${o}`)}return e.deleteShader(n),e.deleteShader(i),s}function fe(e,a){const t=e.createTexture();if(!t)throw new Error("Failed to create texture");return e.bindTexture(e.TEXTURE_2D,t),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,a),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),t}function Te(e){const a=e.createBuffer();if(!a)throw new Error("Failed to create quad buffer");const t=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);return e.bindBuffer(e.ARRAY_BUFFER,a),e.bufferData(e.ARRAY_BUFFER,t,e.STATIC_DRAW),a}const se=`
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
  // Pass through position
  gl_Position = vec4(a_position, 0.0, 1.0);
  
  // Convert from -1..1 to 0..1 for texture coordinates
  v_texCoord = a_position * 0.5 + 0.5;
}
`;function Ue(){try{const e=document.createElement("canvas");return de(e)!==null}catch{return!1}}const Se=`
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
  float ringOuterAlpha = 1.0 - smoothstep(u_ringOuterRadius - 2.0, u_ringOuterRadius + 2.0, radius);
  float ringAlpha = ringInnerAlpha * ringOuterAlpha;
  
  vec3 ringColor = vec3(0.0);
  if (ringAlpha > 0.001) {
    // Concentric gradient
    float thickness = u_ringOuterRadius - u_ringInnerRadius;
    float ringPos = clamp((radius - u_ringInnerRadius) / thickness, 0.0, 1.0);
    
    float colorRange = float(u_colorCount - 1);
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
`,be=`
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
  float angle = atan(pos.y, pos.x);
  
  // === IMAGE LAYER ===
  vec4 imageColor = texture2D(u_image, v_texCoord);
  float imageAlpha = 1.0 - smoothstep(u_imageRadius - 2.0, u_imageRadius + 2.0, radius);
  imageColor.a *= imageAlpha;
  
  // === SEGMENT LAYER ===
  float ringInnerAlpha = smoothstep(u_ringInnerRadius - 2.0, u_ringInnerRadius + 2.0, radius);
  float ringOuterAlpha = 1.0 - smoothstep(u_ringOuterRadius - 2.0, u_ringOuterRadius + 2.0, radius);
  float ringAlpha = ringInnerAlpha * ringOuterAlpha;
  
  vec3 ringColor = vec3(0.0);
  if (ringAlpha > 0.001) {
    // Apply rotation
    float rotatedAngle = angle - u_rotation + PI;
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
`;async function Be(e,a,t){const n=t.size,i=t.size,s=new OffscreenCanvas(n,i),o=de(s);if(!o)throw new Error("Failed to create WebGL context");const h=Math.max(1,(t.paddingPct??0)*t.size/100),C=Math.max(1,t.thicknessPct*t.size/100),B=n/2,l=i/2,P=Math.min(n,i)/2-Math.max(1,h),z=Math.max(0,P-C),j=z;o.viewport(0,0,n,i);const G=t.presentation??"ring";let r;G==="segment"?r=ie(o,se,be):G==="cutout"&&t.borderImageBitmap?r=ie(o,se,ye):r=ie(o,se,Se);const F=Te(o),p=fe(o,e),v=a.modes?.ring?.colors??[],Y=[];for(const c of v){const S=parseInt(c.slice(1,3),16)/255,E=parseInt(c.slice(3,5),16)/255,b=parseInt(c.slice(5,7),16)/255;Y.push(S,E,b)}o.bindFramebuffer(o.FRAMEBUFFER,null),o.clear(o.COLOR_BUFFER_BIT),o.useProgram(r);const M={u_image:o.getUniformLocation(r,"u_image"),u_center:o.getUniformLocation(r,"u_center"),u_imageRadius:o.getUniformLocation(r,"u_imageRadius"),u_ringInnerRadius:o.getUniformLocation(r,"u_ringInnerRadius"),u_ringOuterRadius:o.getUniformLocation(r,"u_ringOuterRadius"),u_resolution:o.getUniformLocation(r,"u_resolution")};if(o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,p),o.uniform1i(M.u_image,0),o.uniform2f(M.u_center,B,l),o.uniform1f(M.u_imageRadius,j),o.uniform1f(M.u_ringInnerRadius,z),o.uniform1f(M.u_ringOuterRadius,P),o.uniform2f(M.u_resolution,n,i),G==="segment"){const c=(t.segmentRotation??0)*Math.PI/180,S=o.getUniformLocation(r,"u_rotation"),E=o.getUniformLocation(r,"u_colorCount"),b=o.getUniformLocation(r,"u_colors");o.uniform1f(S,c),o.uniform1i(E,v.length),o.uniform3fv(b,new Float32Array(Y))}else if(G==="cutout"&&t.borderImageBitmap){const c=t.flagOffsetPct??{x:0,y:0},S=P-z,E=(z+P)/2,I=2*Math.PI*E,f=S,W=c.x/100*I,y=c.y/100*f,q=B-I/2+W,k=l-f/2+y,O=fe(o,t.borderImageBitmap);o.activeTexture(o.TEXTURE1),o.bindTexture(o.TEXTURE_2D,O);const H=o.getUniformLocation(r,"u_flagTexture"),m=o.getUniformLocation(r,"u_flagSize"),N=o.getUniformLocation(r,"u_flagPos");o.uniform1i(H,1),o.uniform2f(m,I,f),o.uniform2f(N,q,k),o.deleteTexture(O)}else{const c=o.getUniformLocation(r,"u_colorCount"),S=o.getUniformLocation(r,"u_colors");o.uniform1i(c,v.length),o.uniform3fv(S,new Float32Array(Y))}const A=o.getAttribLocation(r,"a_position");o.bindBuffer(o.ARRAY_BUFFER,F),o.enableVertexAttribArray(A),o.vertexAttribPointer(A,2,o.FLOAT,!1,0,0),o.drawArrays(o.TRIANGLES,0,6);const T=t.pngQuality??.92,g=await ge(s,"image/png",T);return{blob:g,sizeBytes:g.size,sizeKB:(g.size/1024).toFixed(2)}}export{De as I,Oe as R,Le as a,ee as b,ge as c,Ue as i,Be as r};
