import { Size, Vec2 } from "cc";

export default function getFoldGraphic(
  startVector = new Vec2(0, 0),
  draggingVector = new Vec2(0, 0),
  size = new Size(0, 0)
) {
  if (startVector.x == 0 && startVector.y == 0) return [];
  const TOP = size.height / 2,
    RIGHT = size.width / 2,
    BOTTOM = -size.height / 2,
    LEFT = -size.width / 2;
  const isConer = startVector.x != 0 && startVector.y != 0;
  let result: Vec2[] = [];
  let fold_A, fold_B;
  if (!isConer) {
    let com_A, com_B;
    let midX, midY;
    midY =
      startVector.y > 0
        ? draggingVector.y + (TOP - draggingVector.y) / 2
        : draggingVector.y + (BOTTOM - draggingVector.y) / 2;

    midX =
      startVector.x > 0
        ? draggingVector.x + (RIGHT - draggingVector.x) / 2
        : draggingVector.x + (LEFT - draggingVector.x) / 2;

    fold_A = startVector.x == 0 ? new Vec2(RIGHT, midY) : new Vec2(midX, TOP);

    fold_B = startVector.x == 0 ? new Vec2(LEFT, midY) : new Vec2(midX, BOTTOM);

    com_A =
      startVector.y > 0
        ? new Vec2(LEFT, BOTTOM)
        : startVector.y < 0
        ? new Vec2(LEFT, TOP)
        : startVector.x > 0
        ? new Vec2(LEFT, BOTTOM)
        : startVector.x < 0
        ? new Vec2(RIGHT, BOTTOM)
        : new Vec2(0, 0);

    com_B =
      startVector.y > 0
        ? new Vec2(RIGHT, BOTTOM)
        : startVector.y < 0
        ? new Vec2(RIGHT, TOP)
        : startVector.x > 0
        ? new Vec2(LEFT, TOP)
        : startVector.x < 0
        ? new Vec2(RIGHT, TOP)
        : new Vec2(0, 0);

    result = [fold_A, fold_B, com_A, com_B];
  } else {
    const conerVector = new Vec2(
      startVector.x > 0 ? RIGHT : LEFT,
      startVector.y > 0 ? TOP : BOTTOM
    );
    const k =
      (conerVector.y * conerVector.y -
        draggingVector.y * draggingVector.y +
        conerVector.x * conerVector.x -
        draggingVector.x * draggingVector.x) /
      2;
    const diffVector = new Vec2(
      conerVector.x - draggingVector.x,
      conerVector.y - draggingVector.y
    );

    let isFoldNearSild;

    isFoldNearSild =
      -(diffVector.x / diffVector.y) * conerVector.x + k / diffVector.y < TOP &&
      -(diffVector.x / diffVector.y) * conerVector.x + k / diffVector.y >
        BOTTOM;
    fold_A = isFoldNearSild
      ? new Vec2(
          conerVector.x,
          -(diffVector.x / diffVector.y) * conerVector.x + k / diffVector.y
        )
      : new Vec2(
          k / diffVector.x + (diffVector.y / diffVector.x) * conerVector.y,
          -conerVector.y
        );

    isFoldNearSild =
      k / diffVector.x - (diffVector.y / diffVector.x) * conerVector.y <
        RIGHT &&
      k / diffVector.x - (diffVector.y / diffVector.x) * conerVector.y > LEFT;
    fold_B = isFoldNearSild
      ? new Vec2(
          k / diffVector.x - (diffVector.y / diffVector.x) * conerVector.y,
          conerVector.y
        )
      : new Vec2(
          -conerVector.x,
          (diffVector.x / diffVector.y) * conerVector.x + k / diffVector.y
        );

    result = [fold_A, fold_B];
    result.push(new Vec2(-conerVector.x * 2, conerVector.y));
    result.push(new Vec2(-conerVector.x * 2, -conerVector.y * 2));
    result.push(new Vec2(conerVector.x, -conerVector.y * 2));
  }
  return result;
}
