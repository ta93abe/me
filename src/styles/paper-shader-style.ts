/**
 * Paper Shaders `ShaderMount` が実行時に注入する固定 CSS。
 * `style[data-paper-shader]` を HTML に先置きすると注入をスキップする。
 * 中身は `@paper-design/shaders` の defaultStyle と一致させる。
 */
export const PAPER_SHADER_STYLE = `@layer paper-shaders {
  :where([data-paper-shader]) {
    isolation: isolate;
    position: relative;

    & canvas {
      contain: strict;
      display: block;
      position: absolute;
      inset: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      corner-shape: inherit;
    }
  }
}`;
