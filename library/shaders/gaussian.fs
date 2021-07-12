float gaussian(vec2 v, float sd) {
  return 1./(tau * sd * sd) * exp(-(v.x * v.x + v.y * v.y) / (2. * sd * sd));
}

vec4 gaussianBlur(int range, float sd) {
  vec4 s, n;
  vec2 uv = gl_FragCoord.xy / size;
  float d, ds;
  int i, j;
  i = j = -range;
  while (i <= range) {
    while (j <= range) {
      vec2 v = vec2(i, j);
      d = gaussian(v, sd);
      ds += d;
      n = texture(bufferImage, uv + v / size / 2.);
      s += n * d;
      j ++;
    }
    i ++;
  }
  s /= ds;
  return s;
}
