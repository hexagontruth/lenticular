#include std-header

uniform float hexelSize;
uniform float hexelBorder;
uniform float updateCoef;

void main() {
  vec3 c, hex, pix, cel;
  vec2 uv, cv;
  float q;
  uv = gl_FragCoord.xy / size;
  cv = uv * 2. - 1.;

  q = 1./360. / hexelSize;


  hex = cart2hex(cv);
  pix = roundCubic(hex / hexelSize) * hexelSize;
  cel = hex2hex(hex - pix) / hexelSize * ap * 2.;

  cv = hex2cart(pix);


  c = texture(streamImage, cv * 0.5 + 0.5).rgb;

  c = c * smoothstep(hexelBorder - q, hexelBorder, 1. - amax(cel));

  c = mix(c, texture(lastFrame, uv).rgb, updateCoef);
  fragColor = vec4(c, 1);
}
