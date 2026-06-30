  /* ==============================================================================================
   * render/Symbols.tsx
   * ============================================================================================== */

  // Render function for single plus SVG symbol
  export function plus({
    size,
    gap,
    stroke
  }: {
    size: number;
    gap: number;
    stroke: number;
  }) {
    return (
      <g
        stroke="white"
        stroke-width={stroke}
        stroke-linecap="round"
        pointer-events="none"
      >
        {/* horizontal line */}
        <line
          x1={-size / 2}
          y1={-gap}
          x2={size / 2}
          y2={-gap}
        />
        {/* vertical line */}
        <line
          x1={0}
          y1={-gap - size / 2}
          x2={0}
          y2={-gap + size / 2}
        />
      </g>
    );
  }

  // Render function for single minus SVG symbol
  export function minus({
    size,
    gap,
    stroke
  }: {
    size: number;
    gap: number;
    stroke: number;
  }) {
    return (
      <g
        stroke="white"
        stroke-width={stroke}
        stroke-linecap="round"
        pointer-events="none"
      >
        {/* horizontal line */}
        <line
          x1={-size / 2}
          y1={gap}
          x2={size / 2}
          y2={gap}
        />
      </g>
    );
  }

  // Render function for plus/minus SVG symbol
  // Render function for double minus SVG symbol (used for sphere 3)
  export function minusMinus({
    size,
    gap,
    stroke
  }: {
    size: number;
    gap: number;
    stroke: number;
  }) {
    return (
      <g
        stroke="white"
        stroke-width={stroke}
        stroke-linecap="round"
        pointer-events="none"
      >
        {/* top minus */}
        <line
          x1={-size / 2}
          y1={-gap}
          x2={size / 2}
          y2={-gap}
        />

        {/* bottom minus */}
        <line
          x1={-size / 2}
          y1={gap}
          x2={size / 2}
          y2={gap}
        />
      </g>
    );
  }


  export function plusMinus({
    size,
    gap,
    stroke
  }: {
    size: number;
    gap: number;
    stroke: number;
  }) {
    return (
      <g
        stroke="white"
        stroke-width={stroke}
        stroke-linecap="round"
        pointer-events="none"
      >
        {/* plus */}
        <line
          x1={-size / 2}
          y1={-gap}
          x2={size / 2}
          y2={-gap}
        />
        <line
          x1={0}
          y1={-gap - size / 2}
          x2={0}
          y2={-gap + size / 2}
        />

        {/* minus */}
        <line
          x1={-size / 2}
          y1={gap}
          x2={size / 2}
          y2={gap}
        />
      </g>
    );
  }