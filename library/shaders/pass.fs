#version 300 es
#ifdef GL_ES
  precision highp float;
#endif

uniform vec2 size;
uniform sampler2D bufferImage;
out vec4 fragColor;

void main()
{
  vec2 uv = gl_FragCoord.xy / size;
  fragColor = texture(bufferImage, uv);
}
