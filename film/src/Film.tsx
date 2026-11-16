import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { loadVariableFont } from "@remotion/google-fonts/BricolageGrotesque";

const { fontFamily } = loadVariableFont("normal", { subsets: ["latin"] });

const C = {
  soil: "#1E130D",
  field: "#0F2A1E",
  packhouse: "#F2F4EE",
  sea: "#0A2A3A",
  flesh: "#F07A1A",
  gold: "#D9B45A",
  goldDeep: "#B4892B", // the gold line on the light ground
  fleshDeep: "#C95A08", // the numbers on the light ground
  text: "#F4EFE6",
  ink: "#14201A",
};

const W = 1920;
const H = 1080;
const FPS = 30;
const STEM_X = 140; // the line as root and stem
const TEXT_X = 260;
const LINE_Y = 800; // the line as timeline
const RULE_Y = 700; // the line as rule in the last scene
const RULE_X1 = 1040;

// ---------- timing (frames) ----------
const T = {
  wipeField: [84, 104],
  corner: [206, 232],
  wipePack: [226, 246],
  wipeSea: [352, 372],
  coast: [366, 388],
  toRule: [472, 490],
  wipeFlesh: [484, 502],
} as const;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const out = Easing.bezier(0.22, 1, 0.36, 1);
const inn = Easing.bezier(0.64, 0, 0.78, 0);

const prog = (f: number, range: readonly [number, number], easing = inOut) =>
  interpolate(f, [range[0], range[1]], [0, 1], { ...clamp, easing });
const settle = (f: number, start: number, dur = 28) =>
  spring({ frame: f - start, fps: FPS, config: { damping: 200 }, durationInFrames: dur });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const display: React.CSSProperties = {
  fontFamily,
  fontWeight: 800,
  fontStretch: "75%",
  fontVariationSettings: '"wght" 800, "wdth" 75',
  lineHeight: 0.92,
  letterSpacing: "-0.005em",
};
const body = (wght: number): React.CSSProperties => ({
  fontFamily,
  fontWeight: wght,
  fontStretch: "100%",
  fontVariationSettings: `"wght" ${wght}, "wdth" 100`,
  lineHeight: 1.2,
});

// ---------- masked text line ----------
const Line: React.FC<{ at: number; exit?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  at,
  exit,
  children,
  style,
}) => {
  const f = useCurrentFrame();
  const a = settle(f, at);
  const b = exit === undefined ? 0 : prog(f, [exit, exit + 14], inn);
  const y = (1 - a) * 135 - b * 135;
  return (
    <div style={{ overflow: "hidden", padding: "0.16em 0.06em", margin: "-0.16em -0.06em", ...style }}>
      <div style={{ transform: `translateY(${y}%)`, whiteSpace: "nowrap" }}>{children}</div>
    </div>
  );
};

// ---------- the coast: the line as the Egyptian shore ----------
const COAST: [number, number][] = [
  [-40, 1054],
  [600, 1014],
  [1200, 866],
  [1480, 790],
  [1730, 836],
  [1930, 822],
];
const coastY = (x: number) => {
  const p = COAST;
  if (x <= p[0][0]) return p[0][1] + ((p[1][1] - p[0][1]) / (p[1][0] - p[0][0])) * (x - p[0][0]);
  if (x >= p[p.length - 1][0]) return p[p.length - 1][1];
  let i = 0;
  while (x > p[i + 1][0]) i++;
  const slope = (k: number) => {
    const a = p[Math.max(0, k - 1)];
    const b = p[Math.min(p.length - 1, k + 1)];
    return (b[1] - a[1]) / (b[0] - a[0]);
  };
  const h = p[i + 1][0] - p[i][0];
  const t = (x - p[i][0]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * p[i][1] +
    (t3 - 2 * t2 + t) * h * slope(i) +
    (-2 * t3 + 3 * t2) * p[i + 1][1] +
    (t3 - t2) * h * slope(i + 1)
  );
};
const PORTS = [
  { name: "Alexandria", x: 1200, d: "C 980 580, 560 290, -60 130" },
  { name: "Damietta", x: 1480, d: "C 1200 500, 700 190, -60 -20" },
  { name: "Port Said", x: 1730, d: "C 1500 470, 1000 120, 640 -60" },
].map((p) => ({ ...p, y: coastY(p.x) }));

const N = 72;
const poly = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
const wiggle = (y: number) => 15 * Math.sin(y / 96) + 7 * Math.sin(y / 43 + 1.3);
const rootX = (y: number, amp = 1) => STEM_X + amp * wiggle(y);
const coastPts = (xl: number, m: number): [number, number][] =>
  Array.from({ length: N + 1 }, (_, i) => {
    const x = lerp(xl, 1930, i / N);
    return [x, lerp(LINE_Y, coastY(x), m)];
  });

// One path. It is on screen in every frame.
const mainLine = (f: number): string => {
  if (f < T.corner[0]) {
    const amp = 1 - prog(f, T.wipeField);
    const head =
      f < T.wipeField[0]
        ? interpolate(f, [0, 60], [-10, 930], { ...clamp, easing: out })
        : lerp(930, H + 10, prog(f, T.wipeField));
    const pts: [number, number][] = [];
    for (let y = -10; y < head; y += 10) pts.push([rootX(y, amp), y]);
    pts.push([rootX(head, amp), head]);
    return poly(pts);
  }
  if (f < T.corner[1]) {
    const p = prog(f, T.corner);
    const top = lerp(-10, LINE_Y, p);
    const bottom = lerp(H + 10, LINE_Y, p);
    const right = lerp(STEM_X, W + 10, p);
    return `M${STEM_X} ${top} L${STEM_X} ${LINE_Y} L${right} ${LINE_Y} M${STEM_X} ${LINE_Y} L${STEM_X} ${bottom}`;
  }
  if (f < T.coast[0]) return `M${STEM_X} ${LINE_Y} L${W + 10} ${LINE_Y}`;
  if (f < T.toRule[0]) {
    const p = prog(f, T.coast);
    return poly(coastPts(lerp(STEM_X, COAST[0][0], p), p));
  }
  const p = prog(f, T.toRule);
  return poly(
    coastPts(COAST[0][0], 1).map(([x, y], i) => [
      lerp(x, lerp(STEM_X, RULE_X1, i / N), p),
      lerp(y, RULE_Y, p),
    ]),
  );
};

const lineColour = (f: number) =>
  interpolateColors(
    f,
    [T.wipePack[0], T.wipePack[0] + 10, T.wipeSea[0], T.wipeSea[0] + 10, T.wipeFlesh[0], T.wipeFlesh[0] + 10],
    [C.gold, C.goldDeep, C.goldDeep, C.gold, C.gold, C.soil],
  );

// A part of a path, from s to e (0..1).
const Draw: React.FC<{ d: string; s?: number; e: number; stroke: string; width: number }> = ({
  d,
  s = 0,
  e,
  stroke,
  width,
}) =>
  e - s < 0.002 ? null : (
    <path
      d={d}
      pathLength={1}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={`${e - s} 2`}
      strokeDashoffset={-s}
    />
  );

const SIDE_ROOTS = [
  { y: 330, d: "q 34 26 52 104", at: 10 },
  { y: 548, d: "q -44 34 -60 124", at: 18 },
  { y: 760, d: "q 30 28 46 92", at: 26 },
];

const TheLine: React.FC = () => {
  const f = useCurrentFrame();
  const stroke = lineColour(f);
  // The coast is dim where it passes the text block of scene 4.
  const dim = 1 - 0.6 * (prog(f, T.coast) - prog(f, [462, 476]));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="line" gradientUnits="userSpaceOnUse" x1={860} y1={0} x2={1100} y2={0}>
          <stop offset={0} stopColor={stroke} stopOpacity={dim} />
          <stop offset={1} stopColor={stroke} />
        </linearGradient>
      </defs>
      {SIDE_ROOTS.map((r) => (
        <Draw
          key={r.y}
          d={`M${rootX(r.y)} ${r.y} ${r.d}`}
          e={prog(f, [r.at, r.at + 30], out) - prog(f, [72, 86], inn)}
          stroke={stroke}
          width={3}
        />
      ))}
      {PORTS.map((p, i) => (
        <Draw
          key={p.name}
          d={`M${p.x} ${p.y} ${p.d}`}
          e={prog(f, [392 + i * 7, 440 + i * 7])}
          s={prog(f, [458 + i * 3, 478 + i * 3], inn)}
          stroke={stroke}
          width={4}
        />
      ))}
      <path d={mainLine(f)} fill="none" stroke={dim < 0.999 ? "url(#line)" : stroke} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      {PORTS.map((p, i) => {
        const r = 11 * (settle(f, 382 + i * 6, 20) - prog(f, [468, 478], inn));
        return r > 0.1 ? <circle key={p.name} cx={p.x} cy={p.y} r={r} fill={stroke} /> : null;
      })}
    </svg>
  );
};

// ---------- grounds: each new ground opens from the line ----------
const Grounds: React.FC = () => {
  const f = useCurrentFrame();
  const fromX = (p: number, x: number) => `inset(0 ${(1 - p) * (W - x)}px 0 ${(1 - p) * x}px)`;
  const fromY = (p: number, y: number) => `inset(${(1 - p) * y}px 0 ${(1 - p) * (H - y)}px 0)`;
  const layers = [
    { c: C.field, clip: fromX(prog(f, T.wipeField), STEM_X) },
    { c: C.packhouse, clip: fromY(prog(f, T.wipePack), LINE_Y) },
    { c: C.sea, clip: fromY(prog(f, T.wipeSea), LINE_Y) },
    { c: C.flesh, clip: fromY(prog(f, T.wipeFlesh), RULE_Y) },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: C.soil }}>
      {layers.map((l) => (
        <AbsoluteFill key={l.c} style={{ backgroundColor: l.c, clipPath: l.clip }} />
      ))}
    </AbsoluteFill>
  );
};

// ---------- scene 1: soil ----------
const Soil: React.FC = () => (
  <div style={{ position: "absolute", left: 300, top: 112, color: C.text, fontSize: 300, ...display }}>
    <Line at={16} exit={68}>
      From
    </Line>
    <Line at={22} exit={71}>
      Egyptian
    </Line>
    <Line at={28} exit={74}>
      soils
    </Line>
  </div>
);

// ---------- scene 2: field ----------
const POTATO = { cx: 1300, cy: 672, a: 504, t: 270, tilt: -20 };
const potatoPath = (open: number, scale: number) => {
  const { cx, cy, a, t, tilt } = POTATO;
  const r = (tilt * Math.PI) / 180;
  const pt = (x: number, y: number) => {
    const X = x * scale;
    const Y = y * scale * open;
    return `${(cx + X * Math.cos(r) - Y * Math.sin(r)).toFixed(1)} ${(cy + X * Math.sin(r) + Y * Math.cos(r)).toFixed(1)}`;
  };
  // A sweet potato: blunt round ends, the left end fatter, a slight curve, an uneven outline.
  const K = 56;
  const side = (top: boolean) =>
    Array.from({ length: K + 1 }, (_, i) => {
      const u = -Math.cos((Math.PI * i) / K) * (top ? 1 : -1);
      const body = Math.pow(1 - Math.pow(Math.abs(u), 2.3), 0.56) * (0.8 - 0.22 * u);
      const bumps = top
        ? 9 * Math.sin(3.1 * u + 0.6) + 5 * Math.sin(7 * u)
        : 8 * Math.sin(2.3 * u - 1) - 5 * Math.sin(5.7 * u + 2);
      const half = t * 0.92 * body + bumps * (1 - u * u);
      const spine = -46 * (1 - u * u) + 14;
      return pt(a * u, spine + (top ? -half : half));
    });
  return `M${[...side(true), ...side(false)].join(" L")} Z`;
};

const Field: React.FC = () => {
  const f = useCurrentFrame();
  const open = settle(f, 100, 36) - prog(f, [194, 210], inn);
  const push = interpolate(f, [100, 212], [0.95, 1.02], clamp);
  const w = 1062; // never above the 1085 px of the source
  return (
    <>
      {open > 0.001 && (
        <AbsoluteFill style={{ clipPath: `path('${potatoPath(open, lerp(0.94, 1, open))}')` }}>
          <Img
            src={staticFile("field-rows.png")}
            style={{
              position: "absolute",
              width: w,
              left: POTATO.cx - w / 2,
              top: POTATO.cy - (w * 850) / 1085 / 2,
              transform: `scale(${push})`,
            }}
          />
        </AbsoluteFill>
      )}
      <div style={{ position: "absolute", left: TEXT_X, top: 150, color: C.text }}>
        <div style={{ fontSize: 150, ...display }}>
          <Line at={108} exit={192}>
            We grow what
          </Line>
          <Line at={115} exit={195}>
            we ship.
          </Line>
        </div>
        <div style={{ marginTop: 44, fontSize: 46, opacity: 0.85, ...body(400) }}>
          <Line at={130} exit={198}>
            Sweet potatoes
          </Line>
          <Line at={135} exit={200}>
            from our own farms.
          </Line>
        </div>
      </div>
    </>
  );
};

// ---------- scene 3: packhouse ----------
const STEPS = ["Harvest", "Grading", "Curing", "Washing", "Packing", "Loading"];
const STEP_W = 288;

const Packhouse: React.FC = () => {
  const f = useCurrentFrame();
  const openP = prog(f, [240, 266], out) - prog(f, [340, 354], inn);
  const push = interpolate(f, [240, 354], [1.02, 1.1], clamp);
  const pw = 488;
  const ph = 526;
  return (
    <>
      {openP > 0.001 && (
        <div
          style={{
            position: "absolute",
            left: STEM_X + 4 * STEP_W,
            top: 72,
            width: pw,
            height: ph,
            clipPath: `inset(0 0 ${(1 - openP) * 100}% 0)`,
          }}
        >
          <div style={{ width: "100%", height: "100%", borderRadius: "210px 36px", overflow: "hidden" }}>
            <Img
              src={staticFile("sweet-potato-pile.png")}
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${push})` }}
            />
          </div>
        </div>
      )}
      <div style={{ position: "absolute", left: STEM_X, top: 96, color: C.ink, fontSize: 150, ...display }}>
        <Line at={242} exit={338}>
          Six steps from
        </Line>
        <Line at={248} exit={341}>
          field to container.
        </Line>
      </div>
      {STEPS.map((name, i) => {
        const at = 252 + i * 9;
        const x = STEM_X + i * STEP_W;
        const node = 9 * (settle(f, at, 18) - prog(f, [344, 354], inn));
        return (
          <React.Fragment key={name}>
            <div style={{ position: "absolute", left: x, bottom: H - LINE_Y + 22, fontSize: 176, color: C.fleshDeep, ...display }}>
              <Line at={at} exit={342}>
                {`0${i + 1}`}
              </Line>
            </div>
            <div style={{ position: "absolute", left: x, top: LINE_Y + 30, fontSize: 46, color: C.ink, ...body(600) }}>
              <Line at={at + 5} exit={344}>
                {name}
              </Line>
            </div>
            {node > 0.1 && (
              <div
                style={{
                  position: "absolute",
                  left: x - node,
                  top: LINE_Y - node,
                  width: node * 2,
                  height: node * 2,
                  borderRadius: "50%",
                  backgroundColor: C.ink,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

// ---------- scene 4: sea ----------
const Sea: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      {PORTS.map((p, i) => {
        const o = prog(f, [388 + i * 6, 402 + i * 6], out) - prog(f, [462, 474], inn);
        return (
          <div
            key={p.name}
            style={{
              position: "absolute",
              left: p.x - 150,
              width: 300,
              top: p.y + 26,
              textAlign: "center",
              fontSize: 34,
              color: C.text,
              opacity: o,
              ...body(600),
            }}
          >
            {p.name}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: STEM_X, top: 492, color: C.text }}>
        <div style={{ fontSize: 213, ...display }}>
          <Line at={398} exit={458}>
            to global
          </Line>
          <Line at={405} exit={461}>
            markets.
          </Line>
        </div>
        <Line at={432} exit={464} style={{ marginTop: 20, fontSize: 44, ...body(600) }}>
          FOB, CFR, CIF
        </Line>
      </div>
    </>
  );
};

// ---------- scene 5: contact ----------
const Contact: React.FC = () => {
  const f = useCurrentFrame();
  const logo = settle(f, 496, 30);
  const size = 540;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 1470 - size / 2,
          top: H / 2 - size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: C.soil,
          opacity: logo,
          transform: `scale(${lerp(0.9, 1, logo)})`,
        }}
      >
        <Img src={staticFile("logo.png")} style={{ width: "100%", height: "100%" }} />
      </div>
      <div style={{ position: "absolute", left: STEM_X, bottom: H - RULE_Y + 34, color: C.soil, fontSize: 250, ...display }}>
        <Line at={506}>Fresh 4 U</Line>
      </div>
      <div style={{ position: "absolute", left: STEM_X, top: RULE_Y + 44, color: C.soil }}>
        <Line at={518} style={{ fontSize: 66, ...body(700) }}>
          Request a quote
        </Line>
        <Line at={525} style={{ marginTop: 16, fontSize: 50, ...body(500) }}>
          info@fresh4ueg.com
        </Line>
      </div>
    </>
  );
};

const Grain: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundImage: `url(${staticFile("grain.png")})`,
      backgroundSize: "960px 540px",
      mixBlendMode: "overlay",
      opacity: 0.16,
    }}
  />
);

export const Film: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Grounds />
      <TheLine />
      {f < 100 && <Soil />}
      {f >= 96 && f < 220 && <Field />}
      {f >= 236 && f < 362 && <Packhouse />}
      {f >= 376 && f < 484 && <Sea />}
      {f >= 490 && <Contact />}
      <Grain />
    </AbsoluteFill>
  );
};
