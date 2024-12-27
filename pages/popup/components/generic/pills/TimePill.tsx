import Pill from "./Pill";

export default function TimePill({ text }: { text: string }) {
  return (
    <Pill
      classes={`${transparent && "bg-white/15 text-white"} ${size === "small" ? "text-xs" : ""}`}
      msg="Pending"
      glyphSize={size === "small" ? 16 : 20}
      glyph="clock"
    ></Pill>
  );
}
