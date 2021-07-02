#version 300 es
#ifdef GL_ES
  precision highp float;
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
uniform float pi;
uniform float tau;
uniform float phi;
uniform float sr2;
uniform float sr3;
uniform vec3 unit;

uniform sampler2D bufferImage;
uniform sampler2D sBuffer;
uniform sampler2D tBuffer;
uniform sampler2D dBuffer;
uniform sampler2D[4] images;

out vec4 fragColor;

vec3 col_b = vec3(1./24., 1./48., 1./72.);
vec3 col_w = 1. - vec3(1./36., 1./24., 1./12.);
