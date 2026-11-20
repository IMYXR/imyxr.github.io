'use client';

import { useEffect, type CSSProperties, type ReactNode } from 'react';
import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from 'framer-motion';

export interface LensRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface LiquidGlassLensProps {
  /** The element the lens rests on, in the coordinate space of the lens's offset parent. */
  rect: LensRect;
  /** True while the pointer is steering the lens, like a finger holding it down. */
  lifted: boolean;
  /** Size of the offset parent (the track the lens slides in). It is re-drawn under the glass. */
  surface: { width: number; height: number };
  /**
   * A copy of the content on the surface, positioned in the same coordinate space as `rect`.
   * It is drawn twice: at normal size on the solid knob, and magnified under the glass.
   */
  children: ReactNode;
}

// --- Motion ------------------------------------------------------------------

// Slightly underdamped so the lens overshoots a touch and settles, like a drop of liquid.
const GLIDE = { stiffness: 240, damping: 24, mass: 1 };
const SETTLE = { stiffness: 260, damping: 26 };
const SPEED_SMOOTHING = { stiffness: 380, damping: 38 };

/** Horizontal speed (px/s) at which the motion effects reach full strength. */
const FULL_SPEED = 1100;
/** How readily movement alone turns the knob to glass (it also does so whenever it is lifted). */
const GLASS_FROM_SPEED = 1.8;

// As glass, the lens is bigger than the knob it grew from and spills over the edge of the track.
const GROW_X = 10;
const GROW_Y = 9;

const LIFT_MAGNIFY = 0.14; // magnification of the view under the glass
const SPEED_MAGNIFY = 0.14; // added at full speed
const SPEED_STRETCH = 0.1; // widening at full speed
const SPEED_SQUASH = 0.06; // flattening at full speed

// --- Optics --------------------------------------------------------------------
// All lengths are CSS pixels, and every step of the filter is defined in them, so the glass
// looks the same at any display scaling or browser zoom. The SVG lighting primitives are
// avoided for that reason: they measure slope per device pixel, so a rim built on them is
// twice as strong on a 100% display as on a 200% one.

const OPTICS_ID = 'liquid-lens-optics';

const BEVEL = 4.5; // the glass curves within about 12px of its rim (this is the blur that rounds it)
// Slope = the difference in height between points this far either side. 4px is a whole
// number of device pixels at every common display scaling (100%, 125%, 150%, 175%, 200%…);
// a step that lands on half a pixel is rounded either way and can leave a visible seam.
const SLOPE_STEP = 4;
// Right on the rim those two heights differ by about 0.63 (of 1). This gain brings that to
// 0.46, just inside the ±0.5 that a displacement map can hold.
const SLOPE_GAIN = 0.735;
const PEAK_SLOPE = 0.46;
// At the very rim the view comes from this much further in, the way the edge of a convex
// lens shows what is inside it. That is what paints the ring of "inside" colour round the rim.
const RIM_REACH = 4.6;
const RIM_BLUR = 1.2; // the view is slightly out of focus where the glass curves
const SHADOW_STRENGTH = 0.4; // 0 = no shading on the side away from the light, 1 = full

// Colour matrices: rows are the R, G, B, A of the result; columns the R, G, B, A of the
// input and a constant.
const HEIGHT_AS_RED = '0 0 0 1 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1';
const HEIGHT_AS_GREEN = '0 0 0 0 0  0 0 0 1 0  0 0 0 0 0  0 0 0 0 1';
const SLOPE_AS_RED = `${SLOPE_GAIN} ${-SLOPE_GAIN} 0 0 0.5  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1`;
const SLOPE_AS_GREEN = `0 0 0 0 0  ${SLOPE_GAIN} ${-SLOPE_GAIN} 0 0 0.5  0 0 0 0 0  0 0 0 0 1`;
// White where the glass is flat or tilts towards the light (upper left), darker the more
// it tilts away from it.
const SHADE_ROW = `${SHADOW_STRENGTH} ${SHADOW_STRENGTH} 0 0 ${1 - SHADOW_STRENGTH}`;
const SHADE = `${SHADE_ROW}  ${SHADE_ROW}  ${SHADE_ROW}  0 0 0 0 1`;

/**
 * The SVG filter that turns a flat picture of the surface into the view through a glass lens.
 *
 * The lens's own outline, blurred, serves as a dome: flat across the middle and falling
 * away towards the rim, steepest right on it. (Using the outline means the dome follows
 * the lens as it grows and stretches.) The slope of that dome bends the view at the rim,
 * and shades the side facing away from the light.
 *
 * The slope is measured the plain way, as the difference between the dome's height a
 * step to either side of each point. The two heights travel in separate colour channels
 * of one image because filter arithmetic cannot hold a negative number: a colour matrix
 * then subtracts them around mid-grey, which is the form a displacement map takes.
 *
 * Highlights are not drawn here. They are plain CSS on .liquid-lens__edge, which keeps
 * them crisp and lets each theme set its own strength.
 */
function LensOptics() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id={OPTICS_ID} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
          {/* The dome, as opacity: 0.5 on the rim, rising to 1 across the middle. */}
          <feGaussianBlur in="SourceAlpha" stdDeviation={BEVEL} result="dome" />
          <feColorMatrix in="dome" type="matrix" values={HEIGHT_AS_RED} result="heightR" />
          <feColorMatrix in="dome" type="matrix" values={HEIGHT_AS_GREEN} result="heightG" />

          {/* Slope along x, in red: height to the right minus height to the left. */}
          <feOffset in="heightR" dx={-SLOPE_STEP} dy={0} result="toRight" />
          <feOffset in="heightG" dx={SLOPE_STEP} dy={0} result="toLeft" />
          <feComposite in="toRight" in2="toLeft" operator="arithmetic" k1={0} k2={1} k3={1} k4={0} result="acrossX" />
          <feColorMatrix in="acrossX" type="matrix" values={SLOPE_AS_RED} result="slopeX" />

          {/* Slope along y, in green: height below minus height above. */}
          <feOffset in="heightR" dx={0} dy={-SLOPE_STEP} result="below" />
          <feOffset in="heightG" dx={0} dy={SLOPE_STEP} result="above" />
          <feComposite in="below" in2="above" operator="arithmetic" k1={0} k2={1} k3={1} k4={0} result="acrossY" />
          <feColorMatrix in="acrossY" type="matrix" values={SLOPE_AS_GREEN} result="slopeY" />

          <feComposite in="slopeX" in2="slopeY" operator="arithmetic" k1={0} k2={1} k3={1} k4={0} result="slope" />

          {/* Refraction: every point shows what lies up the slope from it, towards the middle. */}
          <feDisplacementMap in="SourceGraphic" in2="slope" scale={RIM_REACH / PEAK_SLOPE} xChannelSelector="R" yChannelSelector="G" result="refracted" />

          {/* Sharp through the flat middle, soft where the glass curves. */}
          <feGaussianBlur in="refracted" stdDeviation={RIM_BLUR} result="soft" />
          <feComponentTransfer in="dome" result="flat">
            <feFuncA type="linear" slope={2} intercept={-1} />
          </feComponentTransfer>
          <feComposite in="refracted" in2="flat" operator="in" result="sharpMiddle" />
          <feComposite in="sharpMiddle" in2="soft" operator="over" result="view" />

          {/* Shade the side of the rim that faces away from the light. */}
          <feColorMatrix in="slope" type="matrix" values={SHADE} result="shade" />
          <feBlend in="view" in2="shade" mode="multiply" result="shaded" />

          <feComposite in="shaded" in2="SourceAlpha" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * The selection knob of a segmented control, in the manner of Apple's Liquid Glass.
 *
 * At rest it is a plain solid knob. Held or in motion, it swells into a clear glass lens
 * that spills over the track: what is underneath shows through magnified, the rim bends
 * the view and catches the light, and the lens stretches along its path before settling
 * back into a knob.
 *
 * The glass is not actually transparent. What shows "through" it is a re-drawn copy of the
 * track and its content (the `children`), with refraction and shading applied by an SVG
 * filter and the highlights on its rim drawn in CSS. A real backdrop filter cannot do this
 * outside Chromium, and a copy keeps text sharp.
 */
export default function LiquidGlassLens({ rect, lifted, surface, children }: LiquidGlassLensProps) {
  const reduceMotion = useReducedMotion();

  const x = useSpring(rect.left, GLIDE);
  const y = useSpring(rect.top, GLIDE);
  const width = useSpring(rect.width, GLIDE);
  const height = useSpring(rect.height, GLIDE);
  const lift = useSpring(0, SETTLE);

  useEffect(() => {
    if (reduceMotion) {
      x.jump(rect.left);
      y.jump(rect.top);
      width.jump(rect.width);
      height.jump(rect.height);
    } else {
      x.set(rect.left);
      y.set(rect.top);
      width.set(rect.width);
      height.set(rect.height);
    }
  }, [rect.left, rect.top, rect.width, rect.height, reduceMotion, x, y, width, height]);

  useEffect(() => {
    lift.set(lifted && !reduceMotion ? 1 : 0);
  }, [lifted, reduceMotion, lift]);

  const velocity = useVelocity(x);
  const rawSpeed = useTransform(velocity, (v) => Math.min(Math.abs(v) / FULL_SPEED, 1));
  const speed = useSpring(rawSpeed, SPEED_SMOOTHING);

  // 0 = solid knob, 1 = clear glass. Held, or simply moving fast enough, makes it glass.
  const glass = useTransform<number, number>(
    [lift, speed],
    ([l, s]) => Math.min(1, Math.max(0, l, s * GLASS_FROM_SPEED))
  );

  // The lens swells around the knob as it turns to glass, and stretches along its path.
  const lensX = useTransform<number, number>([x, glass], ([left, g]) => left - GROW_X * g);
  const lensY = useTransform<number, number>([y, glass], ([top, g]) => top - GROW_Y * g);
  const lensWidth = useTransform<number, number>([width, glass], ([w, g]) => w + GROW_X * 2 * g);
  const lensHeight = useTransform<number, number>([height, glass], ([h, g]) => h + GROW_Y * 2 * g);
  const scaleX = useTransform(speed, (s) => 1 + SPEED_STRETCH * s);
  const scaleY = useTransform(speed, (s) => 1 - SPEED_SQUASH * s);

  // The view under the glass is scaled about the lens centre, so the point directly under
  // the middle of the lens stays put while everything around it spreads out.
  const magnify = useTransform<number, number>(
    [glass, speed],
    ([g, s]) => 1 + LIFT_MAGNIFY * g + SPEED_MAGNIFY * s
  );
  const sceneX = useTransform<number, number>(
    [lensX, lensWidth, magnify],
    ([left, w, m]) => w / 2 - m * (left + w / 2)
  );
  const sceneY = useTransform<number, number>(
    [lensY, lensHeight, magnify],
    ([top, h, m]) => h / 2 - m * (top + h / 2)
  );

  // On the knob the content is drawn where it really is, at its real size.
  const knobX = useTransform(lensX, (left) => -left);
  const knobY = useTransform(lensY, (top) => -top);
  const knobOpacity = useTransform(glass, (g) => 1 - g);

  // CSS reads this to cross-fade the knob's shadow into the lens's.
  const glassVariable = { '--lens-glass': glass } as unknown as Record<string, MotionValue<number>>;

  return (
    <>
      <LensOptics />
      <motion.div
        aria-hidden="true"
        className="liquid-lens"
        style={{ x: lensX, y: lensY, width: lensWidth, height: lensHeight, scaleX, scaleY, ...glassVariable }}
      >
        {/* Inline so the fragment URL always resolves against this document. */}
        <div className="liquid-lens__view" style={{ filter: `url(#${OPTICS_ID})` }}>
          <motion.div
            className="liquid-lens__scene"
            style={{ x: sceneX, y: sceneY, scale: magnify, originX: 0, originY: 0 }}
          >
            <span className="liquid-lens__track" style={surfaceStyle(surface)} />
            {children}
          </motion.div>
        </div>
        <motion.div className="liquid-lens__knob" style={{ opacity: knobOpacity }}>
          <motion.div className="liquid-lens__scene" style={{ x: knobX, y: knobY }}>
            {children}
          </motion.div>
        </motion.div>
        <motion.span className="liquid-lens__edge" style={{ opacity: glass }} />
      </motion.div>
    </>
  );
}

function surfaceStyle(surface: { width: number; height: number }): CSSProperties {
  return { left: 0, top: 0, width: surface.width, height: surface.height };
}
