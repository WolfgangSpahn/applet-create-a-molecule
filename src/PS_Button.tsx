
import { Component } from "solid-js";

interface PSButtonProps {
  index: number;
  number: number;
  symbol: string;
  name: string;
  mass: number;
  electronegativity: number | null;
  width: number;
  height: number;
  activeAtom: () => number;
  setActiveAtom: (index: number) => void;
  isDimmed?: boolean;
  background?: string;
  onClick?: () => void;
}


export const PS_Button: Component<PSButtonProps> = (props) => {
  const isHighlighted = () => props.activeAtom() === props.number;

  const base = "grid grid-rows-[1fr_2fr_1fr] grid-cols-1 border border-gray-300 rounded-lg shadow text-[6pt] font-mono p-0 relative overflow-hidden select-none transition-colors focus:outline-none";
  const normalBg = "bg-gray-50 hover:bg-blue-100 hover:border-blue-400";
  const highlightBg = "bg-gray-200 text-white border-blue-700 hover:bg-gray-300";

  const onClickHdlr = () => {
      props.setActiveAtom(props.number);
      if (props.onClick) {
        props.onClick();
      }
  };

  return (
    <button
      class={[
        base,
        isHighlighted() ? highlightBg : normalBg,
        props.isDimmed ? "opacity-30 grayscale" : "",
      ].join(" ")}
      style={{
        width: `${props.width}px`,
        height: `${props.height}px`,
        background: props.background,
      }}
      tabIndex={-1}
      onClick={onClickHdlr}
    >
      {/* Atom number top left */}
      <span class="row-start-1 col-start-1 justify-self-start self-start font-bold text-gray-500 ml-1 mt-0.5">
        {props.number}
      </span>
      {/* Atom electronegativity top right */}
      <span class="row-start-1 col-start-1 justify-self-end self-start text-blue-400 font-bold mr-1 mt-0.5">
        {props.electronegativity !== null ? props.electronegativity.toFixed(2) : "--"}
      </span>
      {/* Atom symbol center */}
      <span class="row-start-2 col-start-1 justify-self-center self-center font-bold text-gray-800 text-[8pt]">
        {props.symbol}
      </span>
      {/* Atom name below symbol */}
      <span class="row-start-3 col-start-1 justify-self-center self-center px-1 pb-1 text-gray-600">
        {props.name}
      </span>
    </button>
  );
};
