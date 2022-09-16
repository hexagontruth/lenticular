#version 300 es
#ifdef GL_ES
  precision highp float;
  precision highp sampler2D;
#endif

// #version 300 es
uniform float counter;
uniform vec2 size;
uniform sampler2D lastFrame;
uniform sampler2D buffer;
uniform float duration;
uniform float time;
uniform float cursor;
uniform vec2 cursorPos;
uniform vec2 cursorLast;
uniform float clock;
uniform float programIdx;
uniform float pi;
uniform float tau;
uniform float phi;
uniform float sr2;
uniform float sr3;
uniform float ap;
uniform float inap;
uniform vec3 unit;

uniform sampler2D inputTexture;
uniform sampler2D lastTexture;

uniform sampler2D bufferImage;
uniform sampler2D lastBuffer;
uniform sampler2D sBuffer;
uniform sampler2D tBuffer;
uniform sampler2D dBuffer;
uniform sampler2D sNew;
uniform sampler2D tNew;
uniform sampler2D dNew;
uniform sampler2D[4] images;
uniform sampler2D inputImage;
uniform sampler2D streamImage;

uniform sampler2D[8] lastTextures;
uniform sampler2D[8] nextTextures;

uniform sampler2D lastTexture0;
uniform sampler2D lastTexture1;
uniform sampler2D lastTexture2;
uniform sampler2D lastTexture3;
uniform sampler2D lastTexture4;
uniform sampler2D lastTexture5;
uniform sampler2D lastTexture6;
uniform sampler2D lastTexture7;

uniform sampler2D nextTexture0;
uniform sampler2D nextTexture1;
uniform sampler2D nextTexture2;
uniform sampler2D nextTexture3;
uniform sampler2D nextTexture4;
uniform sampler2D nextTexture5;
uniform sampler2D nextTexture6;
uniform sampler2D nextTexture7;

out highp vec4 fragColor;

vec3 col_b = vec3(1./24., 1./48., 1./72.);
vec3 col_w = 1. - vec3(1./36., 1./24., 1./12.);
