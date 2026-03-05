"use client";

const RAINBOW_GRADIENT =
  "linear-gradient(90deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF";

function getBorderWidth(size: number): number {
  return size >= 96 ? 3 : size >= 48 ? 2.5 : 2;
}

type Props = {
  size: number;
  characterSrc?: string;
  background?: string;
  frame?: string;
  frameStyle?: "solid" | "animated";
  alt?: string;
  className?: string;
};

export default function PlayerAvatar({
  size,
  characterSrc = "/characters/rupsik.png",
  background = "#D3D3D3",
  frame = "#C0C0C0",
  frameStyle = "solid",
  alt = "",
  className = "",
}: Props) {
  const borderWidth = getBorderWidth(size);
  const innerSize = size - borderWidth * 2;
  const charSize = Math.ceil(innerSize * 1.02);

  const frameVisual = frameStyle === "animated" ? RAINBOW_GRADIENT : frame;

  const outerStyle: React.CSSProperties =
    frameStyle === "animated"
      ? {
          width: size,
          height: size,
          padding: borderWidth,
          background: frameVisual,
          boxSizing: "border-box",
        }
      : {
          width: size,
          height: size,
          border: `${borderWidth}px solid ${frameVisual}`,
          boxSizing: "border-box",
        };

  return (
    <div
      className={`rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center ${className}`}
      style={outerStyle}
    >
      <div
        className="rounded-full overflow-hidden flex items-center justify-center w-full h-full"
        style={{
          background,
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <img
          src={characterSrc}
          alt={alt}
          className="rounded-full object-cover"
          style={{
            width: charSize,
            height: charSize,
            objectPosition: "center 48%",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/characters/rupsik.png";
          }}
        />
      </div>
    </div>
  );
}
