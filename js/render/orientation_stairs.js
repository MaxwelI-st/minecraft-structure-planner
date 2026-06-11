import { OPPOSITE, ROT_CCW } from './orientation.js';

const perpendicular = (a, b) =>
  a !== b && a !== OPPOSITE[b] &&
  ['north', 'south', 'east', 'west'].includes(a) &&
  ['north', 'south', 'east', 'west'].includes(b);

const sameStair = (neighbor, facing, half) =>
  !!neighbor && neighbor.isStairs && neighbor.facing === facing && neighbor.half === half;

export function computeStairsShape(facing, half, getNeighbor) {
  const front = getNeighbor(facing);
  if (front?.isStairs && front.half === half && perpendicular(front.facing, facing)) {
    const side = getNeighbor(OPPOSITE[front.facing]);
    if (!sameStair(side, facing, half)) {
      return front.facing === ROT_CCW[facing] ? 'outer_left' : 'outer_right';
    }
  }

  const back = getNeighbor(OPPOSITE[facing]);
  if (back?.isStairs && back.half === half && perpendicular(back.facing, facing)) {
    const side = getNeighbor(back.facing);
    if (!sameStair(side, facing, half)) {
      return back.facing === ROT_CCW[facing] ? 'inner_left' : 'inner_right';
    }
  }
  return 'straight';
}
