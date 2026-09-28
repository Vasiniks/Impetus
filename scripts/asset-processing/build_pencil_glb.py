#!/usr/bin/env python3
"""
Parametric builder for the Impetus mechanical pencil.

This file is the single source of truth for the product geometry. Every part is
built from math primitives (hex lathes, round lathes, helices, swept strips,
extruded prisms) and written to:

  public/models/mechanical-pencil.glb          desktop tier
  public/models/mechanical-pencil-mobile.glb   mobile tier (fewer segments)
  public/models/mechanical-pencil.parts.json   part manifest

Coordinate system: glTF Y-up. The pencil axis is +Y, running from the lead
tip (~ -7.1) to the button crown (~ +7.9). One unit is roughly 10 mm.

All geometry is non-indexed triangles. Machined round parts get analytic
normals around the axis (smooth) while every profile break stays crisp; hex
parts are true 6-sided prisms with flat faces.

Usage:
  python3 scripts/asset-processing/build_pencil_glb.py
"""
from __future__ import annotations

import json
import math
import struct
import sys
from contextlib import contextmanager
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

import numpy as np
import pygltflib as g

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public" / "models"

TAU = math.tau
# Hex vertices sit at 30deg + k*60deg, so flat faces are centred on 0, 60, ... 300deg.
# The 180deg face (normal -X) carries the clip.
HEX_ROT = math.pi / 6
CLIP_ANGLE = math.pi


# ---------------------------------------------------------------------------
# Tier settings
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Tier:
    name: str
    round_segs: int       # segments for large machined round parts
    small_segs: int       # segments for thin rods / tubes
    spring_steps: int     # centreline steps per coil turn
    wire_sides: int       # sides of a spring wire cross-section
    lattice_rows: int     # knurl rows per hex face (odd)
    suffix: str


DESKTOP = Tier("desktop", 48, 16, 13, 6, 21, "")
MOBILE = Tier("mobile", 30, 10, 8, 5, 13, "-mobile")


# ---------------------------------------------------------------------------
# Mesh builder
# ---------------------------------------------------------------------------

def _v(p) -> np.ndarray:
    return np.asarray(p, dtype=np.float64)


def _norm(v: np.ndarray) -> np.ndarray:
    l = float(np.linalg.norm(v))
    return v / l if l > 1e-12 else v


class MeshBuilder:
    """Collects triangles. `quad` auto-flips winding so its face normal points
    away from `out_ref`, which removes almost every inside-out face bug."""

    def __init__(self) -> None:
        self.pos: list[np.ndarray] = []
        self.nrm: list[np.ndarray] = []
        self._M = np.eye(3)
        self._t = np.zeros(3)

    @contextmanager
    def transform(self, M=None, t=None):
        oldM, oldt = self._M, self._t
        M = np.eye(3) if M is None else _v(M)
        t = np.zeros(3) if t is None else _v(t)
        self._M = oldM @ M
        self._t = oldM @ t + oldt
        try:
            yield
        finally:
            self._M, self._t = oldM, oldt

    def _emit(self, pts, nrms) -> None:
        for p, n in zip(pts, nrms):
            self.pos.append(self._M @ p + self._t)
            self.nrm.append(_norm(self._M @ n))

    def tri(self, a, b, c, na=None, nb=None, nc=None) -> None:
        a, b, c = _v(a), _v(b), _v(c)
        fn = np.cross(b - a, c - a)
        if np.linalg.norm(fn) < 1e-14:
            return
        fn = _norm(fn)
        self._emit(
            [a, b, c],
            [fn if na is None else _v(na), fn if nb is None else _v(nb), fn if nc is None else _v(nc)],
        )

    def quad(self, a, b, c, d, out_ref=None, normals=None) -> None:
        a, b, c, d = _v(a), _v(b), _v(c), _v(d)
        if out_ref is not None:
            fn = np.cross(c - a, d - b)
            cen = (a + b + c + d) / 4.0
            if np.dot(fn, cen - _v(out_ref)) < 0:
                a, b, c, d = a, d, c, b
                if normals is not None:
                    normals = [normals[0], normals[3], normals[2], normals[1]]
        na, nb, nc, nd = normals if normals is not None else (None,) * 4
        self.tri(a, b, c, na, nb, nc)
        self.tri(a, c, d, na, nc, nd)

    def fan(self, ring: list, centre, out_ref) -> None:
        """Triangle fan over a convex ring, oriented away from out_ref."""
        centre = _v(centre)
        n = len(ring)
        for i in range(n):
            a, b = _v(ring[i]), _v(ring[(i + 1) % n])
            fn = np.cross(a - centre, b - centre)
            cen = (a + b + centre) / 3.0
            if np.dot(fn, cen - _v(out_ref)) < 0:
                self.tri(centre, b, a)
            else:
                self.tri(centre, a, b)

    @property
    def tri_count(self) -> int:
        return len(self.pos) // 3

    def finish(self, uv_scale: float = 1.6):
        P = np.array(self.pos, dtype=np.float32).reshape(-1, 3)
        N = np.array(self.nrm, dtype=np.float32).reshape(-1, 3)
        UV = np.zeros((len(P), 2), dtype=np.float32)
        # Box-projected UVs: dominant axis of each face normal.
        for i in range(0, len(P), 3):
            a, b, c = P[i], P[i + 1], P[i + 2]
            fn = np.abs(np.cross(b - a, c - a))
            ax = int(np.argmax(fn))
            keep = [k for k in range(3) if k != ax]
            for j in range(3):
                UV[i + j] = P[i + j][keep] * uv_scale
        return P, N, UV


# ---------------------------------------------------------------------------
# Primitives
# ---------------------------------------------------------------------------

def _pt(r: float, y: float, t: float) -> np.ndarray:
    return np.array([r * math.cos(t), y, r * math.sin(t)])


def _rn(nr: float, ny: float, t: float) -> np.ndarray:
    return np.array([nr * math.cos(t), ny, nr * math.sin(t)])


def lathe(mb: MeshBuilder, profile, segs: int, *, rot: float = 0.0, theta0: float = 0.0,
          theta1: float = TAU, closed: bool = False, smooth: bool | None = None,
          side_caps: bool = False) -> None:
    """Revolve a profile of (r, y[, 's']) points around +Y.

    The profile is traversed with the solid on the LEFT, so the outward 2D
    normal of a segment (dr, dy) is (dy, -dr): outer walls go up, top caps go
    inward, inner walls go down, bottom caps go outward. A point tagged 's'
    gets an averaged normal so curved profiles shade smoothly.
    """
    if smooth is None:
        smooth = segs >= 12
    pts = [(p[0], p[1], len(p) > 2 and p[2] == "s") for p in profile]
    if closed:
        pts = pts + [pts[0]]
    seg_n = []
    for i in range(len(pts) - 1):
        (r0, y0, _), (r1, y1, _) = pts[i], pts[i + 1]
        dr, dy = r1 - r0, y1 - y0
        L = math.hypot(dr, dy)
        seg_n.append((dy / L, -dr / L) if L > 1e-12 else None)

    def vert_n(i_seg: int, end: int):
        idx = i_seg + end
        own = seg_n[i_seg]
        if not pts[idx][2]:
            return own
        other_i = i_seg + (1 if end else -1)
        if closed:
            other_i %= len(seg_n)
        if 0 <= other_i < len(seg_n) and seg_n[other_i] is not None:
            o = seg_n[other_i]
            nr, ny = own[0] + o[0], own[1] + o[1]
            l = math.hypot(nr, ny)
            return (nr / l, ny / l)
        return own

    ths = [theta0 + (theta1 - theta0) * j / segs + rot for j in range(segs + 1)]
    for i in range(len(pts) - 1):
        if seg_n[i] is None:
            continue
        (r0, y0, _), (r1, y1, _) = pts[i], pts[i + 1]
        n0, n1 = vert_n(i, 0), vert_n(i, 1)
        for j in range(segs):
            ta, tb = ths[j], ths[j + 1]
            A, B = _pt(r0, y0, ta), _pt(r0, y0, tb)
            C, D = _pt(r1, y1, tb), _pt(r1, y1, ta)
            tm = 0.5 * (ta + tb)
            expect = _rn(seg_n[i][0], seg_n[i][1], tm)
            cen = (A + B + C + D) / 4
            if smooth:
                nrm = [_rn(*n0, ta), _rn(*n0, tb), _rn(*n1, tb), _rn(*n1, ta)]
                mb.quad(A, B, C, D, out_ref=cen - expect, normals=nrm)
            else:
                mb.quad(A, B, C, D, out_ref=cen - expect)

    if side_caps:
        ring_pts = [(p[0], p[1]) for p in (pts[:-1] if closed else pts)]
        for t, sgn in ((theta0 + rot, -1.0), (theta1 + rot, 1.0)):
            ring = [_pt(r, y, t) for r, y in ring_pts]
            c = sum(ring) / len(ring)
            tangent = np.array([-math.sin(t), 0.0, math.cos(t)]) * sgn
            mb.fan(ring, c, c - tangent)


def tube(mb: MeshBuilder, y0: float, y1: float, ro: float, ri: float, segs: int,
         ch: float = 0.0) -> None:
    """Round tube with optional outer chamfers."""
    if ri <= 1e-6:
        prof = [(0, y0), (ro - ch, y0), (ro, y0 + ch), (ro, y1 - ch), (ro - ch, y1), (0, y1)]
        lathe(mb, prof, segs)
    else:
        prof = [(ri, y0), (ro - ch, y0), (ro, y0 + ch), (ro, y1 - ch), (ro - ch, y1), (ri, y1)]
        lathe(mb, prof, segs, closed=True)


def hex_round_annulus(mb: MeshBuilder, y: float, R: float, ri: float, segs: int, up: bool) -> None:
    """Flat cap between a hex outline (circumradius R) and a round bore."""
    a = R * math.cos(math.pi / 6)
    ref_dy = -1.0 if up else 1.0
    for j in range(segs):
        ta = HEX_ROT + TAU * j / segs
        tb = HEX_ROT + TAU * (j + 1) / segs

        def hx(t):
            psi = round(t / (math.pi / 3)) * (math.pi / 3)
            return _pt(a / math.cos(t - psi), y, t)

        # Hex corners sit exactly on sample angles because segs % 6 == 0.
        mb.quad(_pt(ri, y, ta), _pt(ri, y, tb), hx(tb), hx(ta),
                out_ref=np.array([0.0, y + ref_dy, 0.0]))


def hex_tube(mb: MeshBuilder, y0: float, y1: float, R: float, ri: float, segs_in: int,
             ch: float = 0.012, grooves: tuple = ()) -> None:
    """Hexagonal prism with a round bore. `grooves` = ((ya, yb, depth), ...)."""
    prof: list = [(R - ch, y0), (R, y0 + ch)]
    for ya, yb, d in grooves:
        prof += [(R, ya), (R - d, ya), (R - d, yb), (R, yb)]
    prof += [(R, y1 - ch), (R - ch, y1)]
    lathe(mb, prof, 6, rot=HEX_ROT, smooth=False)
    if ri > 1e-6:
        lathe(mb, [(ri, y1), (ri, y0)], segs_in)
        hex_round_annulus(mb, y0, R - ch, ri, segs_in, up=False)
        hex_round_annulus(mb, y1, R - ch, ri, segs_in, up=True)
    else:
        lathe(mb, [(0, y0), (R - ch, y0)], 6, rot=HEX_ROT, smooth=False)
        lathe(mb, [(R - ch, y1), (0, y1)], 6, rot=HEX_ROT, smooth=False)


def helix_tube(mb: MeshBuilder, r: float, wire: float, y0: float, y1: float, turns: float,
               steps_per_turn: int, sides: int, closed_turns: float = 0.9) -> None:
    """Coil spring: a round wire swept along a helix with parallel-transport
    frames. The first/last `closed_turns` are wound flat (closed & ground ends)."""
    n = max(8, int(turns * steps_per_turn))
    total = turns * TAU
    ts = np.linspace(0.0, total, n + 1)
    # Pitch weight: nearly zero on the closed end turns, 1 in the active body.
    ct = closed_turns * TAU
    w = np.where((ts < ct) | (ts > total - ct), 0.08, 1.0)
    cum = np.concatenate([[0.0], np.cumsum(0.5 * (w[1:] + w[:-1]) * np.diff(ts))])
    cum /= cum[-1]
    ys = y0 + wire + cum * (y1 - y0 - 2 * wire)
    C = np.stack([r * np.cos(ts), ys, r * np.sin(ts)], axis=1)
    T = np.zeros_like(C)
    T[1:-1] = C[2:] - C[:-2]
    T[0] = C[1] - C[0]
    T[-1] = C[-1] - C[-2]
    T = np.array([_norm(t) for t in T])
    N = np.zeros_like(C)
    N0 = np.array([math.cos(ts[0]), 0.0, math.sin(ts[0])])
    N[0] = _norm(N0 - np.dot(N0, T[0]) * T[0])
    for i in range(1, len(C)):
        v = N[i - 1] - np.dot(N[i - 1], T[i]) * T[i]
        N[i] = _norm(v)
    B = np.cross(T, N)
    rings = []
    dirs = []
    for i in range(len(C)):
        ring, dr = [], []
        for k in range(sides):
            ph = TAU * k / sides
            d = math.cos(ph) * N[i] + math.sin(ph) * B[i]
            ring.append(C[i] + wire * d)
            dr.append(d)
        rings.append(ring)
        dirs.append(dr)
    for i in range(len(C) - 1):
        for k in range(sides):
            k2 = (k + 1) % sides
            mb.quad(rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k],
                    out_ref=(C[i] + C[i + 1]) / 2,
                    normals=[dirs[i][k], dirs[i][k2], dirs[i + 1][k2], dirs[i + 1][k]])
    mb.fan(rings[0], C[0], C[0] + T[0])
    mb.fan(rings[-1], C[-1], C[-1] - T[-1])


def prism(mb: MeshBuilder, poly2d, origin, u, v, w, w0: float, w1: float) -> None:
    """Extrude a convex 2D polygon (in the u/v plane) from w0 to w1 along w."""
    origin, u, v, w = _v(origin), _v(u), _v(v), _v(w)
    bot = [origin + p[0] * u + p[1] * v + w0 * w for p in poly2d]
    top = [origin + p[0] * u + p[1] * v + w1 * w for p in poly2d]
    centre = origin + 0.5 * (w0 + w1) * w
    n = len(poly2d)
    for i in range(n):
        j = (i + 1) % n
        mb.quad(bot[i], bot[j], top[j], top[i], out_ref=centre)
    cb, ct = sum(bot) / n, sum(top) / n
    mb.fan(bot, cb, centre)
    mb.fan(top, ct, centre)


def chamfer_rect(hu: float, hv: float, c: float):
    return [(-hu + c, -hv), (hu - c, -hv), (hu, -hv + c), (hu, hv - c),
            (hu - c, hv), (-hu + c, hv), (-hu, hv - c), (-hu, -hv + c)]


def sweep(mb: MeshBuilder, path, poly2d, side_axis) -> None:
    """Sweep a convex section along a planar polyline. `side_axis` is the
    constant in-section axis perpendicular to the path plane."""
    path = [_v(p) for p in path]
    s = _norm(_v(side_axis))
    rings, cents = [], []
    for i, p in enumerate(path):
        if i == 0:
            t = path[1] - path[0]
        elif i == len(path) - 1:
            t = path[-1] - path[-2]
        else:
            t = path[i + 1] - path[i - 1]
        t = _norm(t)
        nrm = _norm(np.cross(s, t))
        rings.append([p + q[0] * s + q[1] * nrm for q in poly2d])
        cents.append(p)
    for i in range(len(path) - 1):
        for k in range(len(poly2d)):
            k2 = (k + 1) % len(poly2d)
            mb.quad(rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k],
                    out_ref=(cents[i] + cents[i + 1]) / 2)
    mb.fan(rings[0], cents[0], cents[0] + _norm(path[1] - path[0]))
    mb.fan(rings[-1], cents[-1], cents[-1] - _norm(path[-1] - path[-2]))


def face_frame(psi: float):
    """Outward normal and tangent of the hex face centred at angle psi."""
    n = np.array([math.cos(psi), 0.0, math.sin(psi)])
    t = np.array([-math.sin(psi), 0.0, math.cos(psi)])
    return n, t


def rot_to_axis(axis) -> np.ndarray:
    """Rotation matrix taking +Y onto `axis`."""
    a = _norm(_v(axis))
    y = np.array([0.0, 1.0, 0.0])
    v = np.cross(y, a)
    c = float(np.dot(y, a))
    if np.linalg.norm(v) < 1e-9:
        return np.eye(3) if c > 0 else np.diag([1.0, -1.0, -1.0])
    vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + vx + vx @ vx * (1.0 / (1.0 + c))


# ---------------------------------------------------------------------------
# Dimensions (units ~ 10 mm)
# ---------------------------------------------------------------------------

R_BARREL = 0.42            # hex circumradius (8.4 mm across corners)
A_BARREL = R_BARREL * math.cos(math.pi / 6)
BORE = 0.26

Y_TIP_LEAD = -7.12
Y_SLEEVE = (-7.0, -6.18)
Y_NOSE_TIP = (-6.24, -5.86)
Y_NOSE = (-5.92, -4.30)
Y_GRIP_RING_LO = (-4.30, -4.12)
Y_GRIP = (-4.12, -1.95)
Y_GRIP_RING_HI = (-1.95, -1.78)
Y_BARREL = (-1.78, 6.10)
Y_COLLAR = (6.08, 6.62)
Y_BUTTON = (6.52, 7.92)
GROOVES = ((4.86, 4.93, 0.014), (5.06, 5.13, 0.014))


# ---------------------------------------------------------------------------
# Part geometry
# ---------------------------------------------------------------------------

def g_lead(mb, T: Tier):
    # Graphite with a slightly worn conical point.
    lathe(mb, [(0, Y_TIP_LEAD), (0.018, Y_TIP_LEAD + 0.02, "s"), (0.025, Y_TIP_LEAD + 0.06),
               (0.025, 0.25), (0, 0.25)], 12)


def g_lead_sleeve(mb, T):
    y0, y1 = Y_SLEEVE
    prof = [(0.03, y0), (0.044, y0), (0.048, y0 + 0.02), (0.048, y1), (0.03, y1)]
    lathe(mb, prof, T.small_segs, closed=True)


def g_nose_tip(mb, T):
    y0, y1 = Y_NOSE_TIP
    prof = [(0.05, y0), (0.066, y0), (0.072, y0 + 0.012), (0.118, y1 - 0.05, "s"),
            (0.132, y1), (0.05, y1)]
    lathe(mb, prof, T.round_segs, closed=True)


def g_nose_cone(mb, T):
    y0, y1 = Y_NOSE
    # Concave machined taper, polished shoulder, stepped internal cavity.
    outer = []
    k = 7
    for i in range(k + 1):
        u = i / k
        y = y0 + u * (y1 - 0.26 - y0)
        r = 0.13 + (0.345 - 0.13) * (u ** 1.35)
        outer.append((r, y, "s" if 0 < i < k else ""))
    prof = [(0.05, y0), (0.118, y0), (0.13, y0 + 0.012)] + outer[1:] + [
        (0.358, y1 - 0.2), (0.362, y1 - 0.02), (0.345, y1),
        (0.205, y1), (0.205, -5.2), (0.05, -5.2)]
    lathe(mb, prof, T.round_segs, closed=True)


def g_lead_guide(mb, T):
    prof = [(0.03, -5.84), (0.045, -5.84), (0.045, -4.74), (0.03, -4.74)]
    lathe(mb, prof, T.small_segs, closed=True)


def g_spring_stab(mb, T):
    helix_tube(mb, 0.085, 0.011, -5.18, -4.76, 5.5, T.spring_steps, T.wire_sides)


def g_brass_insert(mb, T):
    prof = [(0.05, -4.74), (0.16, -4.74), (0.172, -4.72), (0.172, -4.46), (0.16, -4.44),
            (0.12, -4.44), (0.12, -4.36), (0.05, -4.36)]
    lathe(mb, prof, T.round_segs, closed=True)


def g_thread_ring(mb, T):
    prof = [(0.14, -4.46), (0.24, -4.46), (0.25, -4.45), (0.25, -4.1), (0.24, -4.09),
            (0.14, -4.09)]
    lathe(mb, prof, T.round_segs, closed=True)


def g_thread_ridges(mb, T):
    helix_tube(mb, 0.255, 0.013, -4.44, -4.14, 6.0, T.spring_steps + 4, max(4, T.wire_sides - 2),
               closed_turns=0.0)


def g_grip_ring(y0, y1):
    def build(mb, T):
        hex_tube(mb, y0, y1, 0.412, BORE, T.round_segs - T.round_segs % 6, ch=0.018)
    return build


R_UNDER = 0.392


def g_grip_underlay(mb, T):
    y0, y1 = Y_GRIP
    hex_tube(mb, y0 + 0.1, y1 - 0.1, R_UNDER, BORE, T.round_segs - T.round_segs % 6, ch=0.0)


def g_grip_sleeve(mb, T):
    # Plain bands top/bottom: the lattice terminates against them.
    y0, y1 = Y_GRIP
    segs = T.round_segs - T.round_segs % 6
    hex_tube(mb, y0, y0 + 0.12, R_BARREL, BORE, segs, ch=0.01)
    hex_tube(mb, y1 - 0.12, y1, R_BARREL, BORE, segs, ch=0.01)


def g_grip_lattice(mb, T):
    """Raised diamond ribs over the six hex faces plus corner rails so every
    face terminates in a full diamond (no chopped diamonds at boundaries)."""
    y0, y1 = Y_GRIP[0] + 0.12, Y_GRIP[1] - 0.12
    a_u = R_UNDER * math.cos(math.pi / 6)
    a_top = A_BARREL - 0.002
    h = a_top - a_u
    half_w = R_UNDER / 2.0
    rows = T.lattice_rows
    pitch = (y1 - y0) / (rows + 1)
    hh = pitch * 0.94
    hw = half_w * 0.5 * 0.86
    for k in range(6):
        psi = k * math.pi / 3
        n, t = face_frame(psi)
        for row in range(rows):
            yc = y0 + pitch * (row + 1)
            cols = (-half_w / 2, half_w / 2) if row % 2 == 0 else (0.0,)
            for uc in cols:
                base = [a_u * n + (uc + du) * t + np.array([0, yc + dy, 0])
                        for du, dy in ((-hw, 0), (0, -hh), (hw, 0), (0, hh))]
                s = 0.42
                top = [a_top * n + (uc + du * s) * t + np.array([0, yc + dy * s, 0])
                       for du, dy in ((-hw, 0), (0, -hh), (hw, 0), (0, hh))]
                inside = a_u * n + uc * t + np.array([0, yc, 0]) - n * 0.05
                for i in range(4):
                    j = (i + 1) % 4
                    mb.quad(base[i], base[j], top[j], top[i], out_ref=inside)
                mb.quad(top[0], top[1], top[2], top[3], out_ref=inside)
    # Corner rails: narrow chamfered strips standing on every hex edge.
    for k in range(6):
        phi = HEX_ROT + k * math.pi / 3
        rad = np.array([math.cos(phi), 0.0, math.sin(phi)])
        tan = np.array([-math.sin(phi), 0.0, math.cos(phi)])
        origin = rad * (R_UNDER - 0.01)
        poly = chamfer_rect(0.03, (R_BARREL - R_UNDER + 0.004) / 2 + 0.005, 0.009)
        poly = [(p[0], p[1] + (R_BARREL - R_UNDER) / 2 - 0.004) for p in poly]
        prism(mb, poly, origin, tan, rad, np.array([0, 1.0, 0]), y0, y1)


def g_clutch_jaw(angle: float):
    def build(mb, T):
        span = TAU / 3 - 0.2
        segs = max(6, T.round_segs // 5)
        t0, t1 = angle - span / 2, angle + span / 2
        head = [(0.028, -4.04), (0.105, -4.04), (0.116, -4.0), (0.08, -3.76), (0.028, -3.76)]
        neck = [(0.028, -3.76), (0.058, -3.76), (0.058, -3.44), (0.028, -3.44)]
        lathe(mb, head, segs, theta0=t0, theta1=t1, closed=True, smooth=True, side_caps=True)
        lathe(mb, neck, segs, theta0=t0, theta1=t1, closed=True, smooth=True, side_caps=True)
    return build


def g_clutch_ring(mb, T):
    prof = [(0.1, -3.96), (0.128, -3.96), (0.136, -3.95), (0.136, -3.84), (0.128, -3.83),
            (0.1, -3.83)]
    lathe(mb, prof, T.round_segs, closed=True)


def g_clutch_body(mb, T):
    prof = [(0.058, -3.72), (0.078, -3.72), (0.086, -3.7), (0.086, -3.52), (0.078, -3.5),
            (0.058, -3.5)]
    lathe(mb, prof, T.round_segs, closed=True)


def g_actuator_cone(mb, T):
    prof = [(0.056, -3.46), (0.084, -3.46), (0.118, -3.28), (0.118, -3.2), (0.056, -3.2)]
    lathe(mb, prof, T.round_segs, closed=True)


def g_spring_seat(mb, T):
    tube(mb, -3.76, -3.72, 0.2, 0.09, T.round_segs)


def g_actuator_sleeve(mb, T):
    prof = [(0.056, -3.2), (0.076, -3.2), (0.082, -3.19), (0.082, -2.62), (0.076, -2.6),
            (0.056, -2.6)]
    lathe(mb, prof, T.small_segs, closed=True)


def g_spring_main(mb, T):
    helix_tube(mb, 0.15, 0.019, -3.72, -2.0, 12.0, T.spring_steps, T.wire_sides)


def g_spring_stop(mb, T):
    tube(mb, -2.0, -1.95, 0.2, 0.06, T.round_segs, ch=0.006)


def g_mid_shaft(mb, T):
    prof = [(0.032, -3.5), (0.054, -3.5), (0.054, -1.2), (0.032, -1.2)]
    lathe(mb, prof, T.small_segs, closed=True)


def g_feed_rod(mb, T):
    prof = [(0.032, -1.3), (0.06, -1.3), (0.074, -1.26), (0.074, -0.42), (0.1, -0.42),
            (0.1, -0.34), (0.032, -0.34)]
    lathe(mb, prof, T.small_segs, closed=True)


def g_reservoir(mb, T):
    prof = [(0.09, -0.4), (0.115, -0.4), (0.115, 5.55), (0.09, 5.55)]
    lathe(mb, prof, T.round_segs // 2, closed=True)


def g_spare_leads(mb, T):
    for k, (dx, dz) in enumerate(((0.05, 0.0), (-0.025, 0.043), (-0.025, -0.043), (0.0, 0.0))):
        y0 = 0.4 + 0.18 * k
        with mb.transform(t=(dx, 0, dz)):
            lathe(mb, [(0, y0), (0.025, y0), (0.025, y0 + 4.6), (0, y0 + 4.6)], 8)


def g_reservoir_plug(mb, T):
    prof = [(0, 5.48), (0.088, 5.48), (0.088, 5.56), (0.124, 5.56), (0.124, 5.74),
            (0.052, 5.76), (0, 5.76)]
    lathe(mb, prof, T.small_segs)


def g_washer_top(mb, T):
    tube(mb, 5.8, 5.86, 0.255, 0.07, T.round_segs)


def g_stem(mb, T):
    lathe(mb, [(0, 5.72), (0.048, 5.72), (0.048, 6.92), (0, 6.92)], T.small_segs)


def g_spring_btn(mb, T):
    helix_tube(mb, 0.1, 0.013, 5.86, 6.46, 6.0, T.spring_steps, T.wire_sides)


def g_eraser_sleeve(mb, T):
    prof = [(0.05, 6.46), (0.14, 6.46), (0.146, 6.47), (0.146, 6.52), (0.106, 6.53),
            (0.106, 7.2), (0.09, 7.2), (0.09, 6.56), (0.05, 6.56)]
    lathe(mb, prof, T.round_segs, closed=True)


def g_eraser(mb, T):
    prof = [(0, 6.56), (0.088, 6.56), (0.088, 7.44, "s"), (0.07, 7.52, "s"), (0, 7.55)]
    lathe(mb, prof, T.round_segs // 2)


def g_button(mb, T):
    # Cap with a spherical crown; the bore houses eraser + sleeve.
    y0, y1 = Y_BUTTON
    crown = []
    k = 8
    for i in range(k + 1):
        u = i / k
        ang = u * math.pi / 2
        r = 0.2 * math.cos(ang) * 0.98 + 0.004
        y = y1 - 0.2 + 0.2 * math.sin(ang)
        crown.append((r if i < k else 0.0, y, "s" if 0 < i < k else ""))
    prof = [(0.0, 7.62), (0.12, 7.62), (0.12, y0), (0.19, y0), (0.204, y0 + 0.014),
            (0.204, y1 - 0.24), (0.2, y1 - 0.2)] + crown[1:]
    lathe(mb, prof, T.round_segs, closed=True)


def g_barrel(mb, T):
    y0, y1 = Y_BARREL
    hex_tube(mb, y0, y1, R_BARREL, BORE, T.round_segs - T.round_segs % 6, ch=0.014,
             grooves=GROOVES)


def g_groove_rings(mb, T):
    for ya, yb, d in GROOVES:
        hex_tube(mb, ya + 0.004, yb - 0.004, R_BARREL - d + 0.004, R_BARREL - d - 0.02,
                 T.round_segs - T.round_segs % 6, ch=0.0)


def g_top_collar(mb, T):
    y0, y1 = Y_COLLAR
    prof = [(0.215, y0), (0.356, y0), (0.356, y0 + 0.06), (0.34, y0 + 0.1, "s"),
            (0.26, y1 - 0.08, "s"), (0.25, y1 - 0.02), (0.235, y1), (0.215, y1)]
    lathe(mb, prof, T.round_segs, closed=True)


def g_clip_ring(mb, T):
    prof = [(0.34, 6.2), (0.372, 6.2), (0.378, 6.21), (0.378, 6.36), (0.372, 6.37), (0.33, 6.37)]
    lathe(mb, prof, T.round_segs, closed=True)


CLIP_N, CLIP_T = face_frame(CLIP_ANGLE)


def _clip_path():
    """Clip blade centreline in (normal distance, y): leaves the ring, arcs out,
    runs down parallel to the face and dips inward to the foot."""
    pts = []
    for d, y in ((0.38, 6.3), (0.43, 6.26), (0.46, 6.14), (0.47, 5.9), (0.472, 5.2),
                 (0.47, 4.4), (0.462, 3.8), (0.44, 3.52), (0.418, 3.42)):
        pts.append(CLIP_N * d + np.array([0, y, 0]))
    return pts


def g_clip_blade(mb, T):
    sweep(mb, _clip_path(), chamfer_rect(0.062, 0.016, 0.008), CLIP_T)


def g_clip_foot(mb, T):
    origin = CLIP_N * 0.405 + np.array([0, 3.4, 0])
    lathe_pts = [(0, -0.012), (0.05, -0.012), (0.058, 0.0, "s"), (0.05, 0.014), (0, 0.016)]
    with mb.transform(rot_to_axis(CLIP_N), origin):
        lathe(mb, lathe_pts, T.small_segs)


def g_clip_screw(mb, T):
    origin = CLIP_N * 0.372 + np.array([0, 6.285, 0])
    prof = [(0, -0.02), (0.042, -0.02), (0.042, 0.03), (0.036, 0.045, "s"), (0.015, 0.052),
            (0.015, 0.038), (0, 0.038)]
    with mb.transform(rot_to_axis(CLIP_N), origin):
        lathe(mb, prof, T.small_segs)


# ---------------------------------------------------------------------------
# Assembly registry
# ---------------------------------------------------------------------------

@dataclass
class Part:
    name: str
    parent: str
    baseY: float
    explode: float          # axial offset at full explode (filled by layout)
    kind: str               # shell | inner
    mech: str
    build: Callable
    material: str
    label: str
    extra: dict = field(default_factory=dict)


def define_assembly() -> list[Part]:
    P = []

    def part(name, parent, baseY, explode, kind, mech, build, material, label, **extra):
        P.append(Part(name, parent, baseY, explode, kind, mech, build, material, label, dict(extra)))

    R = "Impetus"
    # ---- tip ----
    part("lead", R, -3.4, 0, "inner", "lead", g_lead, "graphite", "0.5 mm lead", lane=2)
    part("leadSleeve", R, -6.6, 0, "inner", "static", g_lead_sleeve, "polished_steel",
         "Lead sleeve", lane=1)
    part("noseTip", R, -6.05, 0, "shell", "static", g_nose_tip, "polished_steel", "Nose tip")
    part("noseCone", R, -5.1, 0, "shell", "static", g_nose_cone, "polished_steel", "Nose cone")
    part("leadGuide", R, -5.3, 0, "inner", "static", g_lead_guide, "polymer", "Lead retainer",
         lane=1)
    part("springStab", R, -5.18, 0, "inner", "springStab", g_spring_stab, "spring_steel",
         "Stabiliser spring", lane=1, length=0.42)
    part("brassInsert", R, -4.55, 0, "inner", "static", g_brass_insert, "brass", "Brass bushing",
         lane=1)
    part("threadRing", R, -4.27, 0, "inner", "static", g_thread_ring, "brushed_steel",
         "Thread ring", lane=1)
    part("threadRidges", "threadRing", -4.29, 0, "inner", "static", g_thread_ridges,
         "brushed_steel", "Thread ring", lane=1, follow="threadRing")
    # ---- grip ----
    part("gripRingLower", R, -4.21, 0, "shell", "static", g_grip_ring(*Y_GRIP_RING_LO),
         "polished_steel", "Grip ring")
    part("gripUnderlay", R, -3.03, 0, "shell", "static", g_grip_underlay, "recess", "Grip core")
    part("gripSleeve", R, -3.03, 0, "shell", "static", g_grip_sleeve, "dlc", "Grip sleeve",
         follow="gripUnderlay")
    part("gripLattice", R, -3.03, 0, "shell", "static", g_grip_lattice, "dlc",
         "Diamond lattice", follow="gripUnderlay")
    part("gripRingUpper", R, -1.86, 0, "shell", "static", g_grip_ring(*Y_GRIP_RING_HI),
         "polished_steel", "Grip ring")
    # ---- clutch ----
    for i, ang in enumerate((0.0, 2.0944, 4.1888)):
        part(f"clutchJaw{i}", R, -3.74, 0, "inner", "jaw", g_clutch_jaw(ang), "brushed_steel",
             "Clutch jaws", lane=1, jawAngle=ang, follow=None if i == 0 else "clutchJaw0")
    part("clutchRing", R, -3.9, 0, "inner", "clutch", g_clutch_ring, "brass", "Clutch ring",
         lane=1)
    part("clutchBody", R, -3.61, 0, "inner", "rod", g_clutch_body, "brushed_steel",
         "Clutch collar", lane=1)
    part("actuatorCone", R, -3.33, 0, "inner", "actuator", g_actuator_cone, "dark_mech",
         "Actuator cone", lane=1)
    part("springSeat", R, -3.74, 0, "inner", "static", g_spring_seat, "brushed_steel",
         "Spring seat", lane=1)
    part("actuatorSleeve", R, -2.9, 0, "inner", "actuator", g_actuator_sleeve, "brushed_steel",
         "Actuator sleeve", lane=1)
    part("springMain", R, -3.72, 0, "inner", "springMain", g_spring_main, "spring_steel",
         "Return spring", lane=1, length=1.72)
    part("springStop", R, -1.975, 0, "inner", "rod", g_spring_stop, "brushed_steel",
         "Spring stop", lane=1)
    part("midShaft", R, -2.35, 0, "inner", "rod", g_mid_shaft, "brushed_steel", "Mid shaft",
         lane=1)
    part("feedRod", R, -0.82, 0, "inner", "rod", g_feed_rod, "polymer", "Feed rod", lane=1)
    # ---- reservoir / button ----
    part("reservoir", R, 2.58, 0, "inner", "rod", g_reservoir, "reservoir", "Lead reservoir",
         lane=2)
    part("spareLeads", R, 2.58, 0, "inner", "rod", g_spare_leads, "graphite", "Spare leads",
         lane=2, follow="reservoir")
    part("reservoirPlug", R, 5.62, 0, "inner", "rod", g_reservoir_plug, "polymer",
         "Reservoir plug", lane=2, follow="reservoir")
    part("washerTop", R, 5.83, 0, "inner", "static", g_washer_top, "brushed_steel",
         "Stop washer", lane=1)
    part("stem", R, 6.32, 0, "inner", "stem", g_stem, "brushed_steel", "Button stem", lane=1)
    part("springBtn", R, 5.86, 0, "inner", "springBtn", g_spring_btn, "spring_steel",
         "Button spring", lane=1, length=0.6)
    part("eraserSleeve", R, 6.83, 0, "inner", "button", g_eraser_sleeve, "brushed_steel",
         "Eraser holder", lane=1)
    part("eraser", R, 7.05, 0, "inner", "button", g_eraser, "eraser", "Eraser", lane=1)
    part("button", R, 7.22, 0, "shell", "button", g_button, "brushed_steel", "Button cap")
    # ---- body ----
    part("barrel", R, 2.16, 0, "shell", "static", g_barrel, "anodized", "Hex barrel")
    part("grooveRings", R, 5.0, 0, "shell", "static", g_groove_rings, "recess", "Index grooves",
         follow="barrel")
    part("topCollar", R, 6.35, 0, "shell", "static", g_top_collar, "polished_steel", "Top collar")
    part("clipRing", R, 6.285, 0, "shell", "static", g_clip_ring, "brushed_steel", "Clip")
    part("clipBlade", R, 4.9, 0, "shell", "static", g_clip_blade, "brushed_steel", "Clip",
         follow="clipRing")
    part("clipFoot", R, 3.4, 0, "shell", "static", g_clip_foot, "polished_steel", "Clip",
         follow="clipRing")
    part("clipScrew", R, 6.285, 0, "shell", "static", g_clip_screw, "polished_steel", "Clip",
         follow="clipRing")
    return P


# Exploded layout: parts packed along the axis in two lanes. The shell lane stays
# on the pencil axis; the mechanism lane sits beside it (lane 1) with the long
# lead on its own lane (lane 2). "follow" parts move with their leader.
SHELL_ORDER = ["noseTip", "noseCone", "gripRingLower", "gripUnderlay", "gripRingUpper",
               "barrel", "topCollar", "button"]
INNER_ORDER = ["leadSleeve", "leadGuide", "springStab", "brassInsert", "threadRing",
               "clutchRing", "clutchJaw0", "clutchBody", "actuatorCone", "springSeat",
               "actuatorSleeve", "springMain", "springStop", "midShaft", "feedRod",
               "washerTop", "springBtn", "stem", "eraserSleeve", "eraser"]
LEAD_ORDER = ["lead", "reservoir"]
SHELL_GAP = 0.34
INNER_GAP = 0.16
LEAD_GAP = 1.2


def layout_explode(parts: list[Part], extents: dict) -> None:
    by = {p.name: p for p in parts}

    def group_extent(leader):
        names = [leader] + [p.name for p in parts if p.extra.get("follow") == leader]
        lo = min(extents[n][0] for n in names)
        hi = max(extents[n][1] for n in names)
        return lo, hi

    def pack(order, gap):
        cur = 0.0
        out = {}
        for name in order:
            lo, hi = group_extent(name)
            if name == "barrel":
                # the clip assembly overlaps the barrel; pack the barrel alone
                lo, hi = extents["barrel"]
            out[name] = cur - lo
            cur += (hi - lo) + gap
        span = cur - gap
        return out, span

    shell, s_span = pack(SHELL_ORDER, SHELL_GAP)
    inner, i_span = pack(INNER_ORDER, INNER_GAP)
    leadl, l_span = pack(LEAD_ORDER, LEAD_GAP)
    # centre both lanes on the assembled centre of the pencil
    lo_all = min(e[0] for e in extents.values())
    hi_all = max(e[1] for e in extents.values())
    mid = 0.5 * (lo_all + hi_all)
    for table, span in ((shell, s_span), (inner, i_span), (leadl, l_span)):
        shift = mid - span / 2
        for k in table:
            table[k] += shift
    # The clip lifts off the barrel radially instead of sliding along it.
    shell["clipRing"] = shell["barrel"] + 0.35
    for p in parts:
        leader = p.extra.get("follow") or p.name
        if leader in shell:
            p.explode = round(shell[leader], 4)
        elif leader in inner:
            p.explode = round(inner[leader], 4)
        elif leader in leadl:
            p.explode = round(leadl[leader], 4)
        else:
            raise SystemExit(f"part {p.name} missing from explode layout")
    for p in parts:
        if p.name.startswith("clip"):
            p.extra["radial"] = 0.55
            p.extra["radialAngle"] = CLIP_ANGLE
        if p.name.startswith("clutchJaw"):
            p.extra["radial"] = 0.16
            p.extra["radialAngle"] = p.extra["jawAngle"]


# ---------------------------------------------------------------------------
# Materials
# ---------------------------------------------------------------------------

MATERIALS = {
    # name: (baseColor linear RGBA, metallic, roughness, alphaMode)
    "anodized":       ((0.030, 0.032, 0.036, 1.0), 1.0, 0.34, "OPAQUE"),
    "dlc":            ((0.028, 0.028, 0.030, 1.0), 1.0, 0.36, "OPAQUE"),
    "brushed_steel":  ((0.56, 0.56, 0.57, 1.0), 1.0, 0.32, "OPAQUE"),
    "polished_steel": ((0.72, 0.72, 0.73, 1.0), 1.0, 0.22, "OPAQUE"),
    "brass":          ((0.74, 0.54, 0.27, 1.0), 1.0, 0.3, "OPAQUE"),
    "spring_steel":   ((0.46, 0.47, 0.49, 1.0), 1.0, 0.28, "OPAQUE"),
    "polymer":        ((0.045, 0.045, 0.05, 1.0), 0.0, 0.48, "OPAQUE"),
    "dark_mech":      ((0.12, 0.12, 0.125, 1.0), 0.7, 0.4, "OPAQUE"),
    "reservoir":      ((0.78, 0.8, 0.83, 0.45), 0.0, 0.16, "BLEND"),
    "eraser":         ((0.82, 0.82, 0.78, 1.0), 0.0, 0.86, "OPAQUE"),
    "graphite":       ((0.05, 0.05, 0.055, 1.0), 0.35, 0.42, "OPAQUE"),
    "recess":         ((0.012, 0.012, 0.014, 1.0), 0.6, 0.55, "OPAQUE"),
}


# ---------------------------------------------------------------------------
# GLB writer
# ---------------------------------------------------------------------------

def write_glb(parts: list[Part], meshes: dict, path: Path) -> None:
    gltf = g.GLTF2()
    gltf.asset = g.Asset(generator="Impetus build_pencil_glb.py", version="2.0")
    gltf.scene = 0
    blob = bytearray()

    mat_index = {}
    for name, (col, met, rough, alpha) in MATERIALS.items():
        mat_index[name] = len(gltf.materials)
        gltf.materials.append(g.Material(
            name=name,
            pbrMetallicRoughness=g.PbrMetallicRoughness(
                baseColorFactor=list(col), metallicFactor=met, roughnessFactor=rough),
            alphaMode=alpha,
            doubleSided=False,
        ))

    def add_accessor(arr: np.ndarray, typ: str, with_bounds: bool) -> int:
        nonlocal blob
        while len(blob) % 4:
            blob.append(0)
        off = len(blob)
        data = arr.astype(np.float32).tobytes()
        blob += data
        bv = len(gltf.bufferViews)
        gltf.bufferViews.append(g.BufferView(buffer=0, byteOffset=off, byteLength=len(data),
                                             target=g.ARRAY_BUFFER))
        acc = g.Accessor(bufferView=bv, componentType=g.FLOAT, count=len(arr), type=typ)
        if with_bounds:
            acc.min = arr.min(axis=0).astype(float).tolist()
            acc.max = arr.max(axis=0).astype(float).tolist()
        gltf.accessors.append(acc)
        return len(gltf.accessors) - 1

    root = g.Node(name="Impetus", children=[])
    gltf.nodes.append(root)
    for p in parts:
        P, N, UV = meshes[p.name]
        P = P - np.array([0.0, p.baseY, 0.0], dtype=np.float32)
        prim = g.Primitive(
            attributes=g.Attributes(
                POSITION=add_accessor(P, g.VEC3, True),
                NORMAL=add_accessor(N, g.VEC3, False),
                TEXCOORD_0=add_accessor(UV, g.VEC2, False),
            ),
            material=mat_index[p.material],
        )
        gltf.meshes.append(g.Mesh(name=f"{p.name}_mesh", primitives=[prim]))
        mesh_node = len(gltf.nodes)
        gltf.nodes.append(g.Node(name=f"{p.name}_mesh", mesh=len(gltf.meshes) - 1))
        extras = {"part": p.name, "parent": p.parent, "kind": p.kind, "mech": p.mech,
                  "baseY": p.baseY, "explode": p.explode, "label": p.label,
                  "material": p.material, "tris": int(len(P) // 3)}
        extras.update({k: v for k, v in p.extra.items() if v is not None})
        part_node = len(gltf.nodes)
        gltf.nodes.append(g.Node(name=p.name, translation=[0.0, p.baseY, 0.0],
                                 children=[mesh_node], extras=extras))
        root.children.append(part_node)
    gltf.scenes.append(g.Scene(name="Scene", nodes=[0]))
    while len(blob) % 4:
        blob.append(0)
    gltf.buffers.append(g.Buffer(byteLength=len(blob)))
    gltf.set_binary_blob(bytes(blob))
    path.parent.mkdir(parents=True, exist_ok=True)
    gltf.save_binary(str(path))


def validate(path: Path, parts: list[Part]) -> None:
    gl = g.GLTF2().load_binary(str(path))
    meshes = [n for n in gl.nodes if n.mesh is not None]
    extras = [n for n in gl.nodes if isinstance(n.extras, dict) and "part" in n.extras]
    assert len(parts) == 42, f"registry has {len(parts)} parts, expected 42"
    assert len(meshes) == 42, f"{path.name}: {len(meshes)} mesh nodes"
    assert len(extras) == 42, f"{path.name}: {len(extras)} extras nodes"
    names = sorted(n.name for n in extras)
    assert names == sorted(p.name for p in parts), "manifest/name mismatch"
    for n in extras:
        child = gl.nodes[n.children[0]]
        assert child.mesh is not None and child.name == f"{n.name}_mesh"


# ---------------------------------------------------------------------------

def build_tier(tier: Tier, parts: list[Part]):
    meshes, tris, extents = {}, {}, {}
    for p in parts:
        mb = MeshBuilder()
        p.build(mb, tier)
        P, N, UV = mb.finish()
        if not np.all(np.isfinite(P)) or not np.all(np.isfinite(N)):
            raise SystemExit(f"non-finite geometry in {p.name}")
        meshes[p.name] = (P, N, UV)
        tris[p.name] = mb.tri_count
        extents[p.name] = (float(P[:, 1].min()), float(P[:, 1].max()))
    return meshes, tris, extents


def main() -> int:
    parts = define_assembly()
    report = {}
    for tier in (DESKTOP, MOBILE):
        meshes, tris, extents = build_tier(tier, parts)
        layout_explode(parts, extents)
        path = OUT_DIR / f"mechanical-pencil{tier.suffix}.glb"
        write_glb(parts, meshes, path)
        validate(path, parts)
        total = sum(tris.values())
        size = path.stat().st_size
        print(f"[{tier.name}] {path.relative_to(ROOT)}  parts={len(parts)}  tris={total}  "
              f"size={size / 1024:.0f} KiB")
        report[tier.name] = {"tris": total, "bytes": size, "perPart": tris, "extents": extents}
    for name in sorted(report["desktop"]["perPart"], key=lambda n: -report["desktop"]["perPart"][n])[:8]:
        print(f"    {name:16s} {report['desktop']['perPart'][name]:6d} tris")
    manifest = {
        "product": "Impetus",
        "axis": "+Y (tip -> button)",
        "tiers": {k: {"tris": v["tris"], "bytes": v["bytes"]} for k, v in report.items()},
        "parts": [
            {"name": p.name, "parent": p.parent, "kind": p.kind, "mech": p.mech,
             "baseY": p.baseY, "explode": p.explode, "label": p.label, "material": p.material,
             "extent": [round(x, 4) for x in report["desktop"]["extents"][p.name]],
             "tris": report["desktop"]["perPart"][p.name],
             **{k: v for k, v in p.extra.items() if v is not None}}
            for p in parts
        ],
    }
    (OUT_DIR / "mechanical-pencil.parts.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
