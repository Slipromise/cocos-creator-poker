import {
  _decorator,
  Component,
  Node,
  Sprite,
  SpriteFrame,
  CCString,
  Button,
  Mask,
  Animation,
  CCBoolean,
  CCFloat,
  Vec2,
  Size,
  sys,
  EventTouch,
  EventMouse,
  Vec3,
  UITransform,
  v3,
  v2,
  size,
  Graphics,
  log,
} from "cc";
import getFoldGraphic from "./FoldFormula";

const { ccclass, property } = _decorator;

@ccclass("Cardkind")
class Cardkind {
  @property({ type: CCString })
  key: string = "";
  @property({ type: SpriteFrame })
  frame: SpriteFrame | null = null;
}

export const SQUEEZING_EVENT = "PokerCardSqueezing";

export const RESETTING_EVENT = "PokerCardResetting";

@ccclass("PokerCard")
export class PokerCard extends Component {
  @property({ type: Node })
  valueNode: Node | null = null;

  @property({ type: Sprite })
  valuePointSprite: Sprite = null;

  @property({ type: [Cardkind] })
  valueKinds: { key: string; frame: SpriteFrame }[] = [];

  @property({ type: [Node] })
  fingerPrintNodes: Node[] = [];

  @property({ type: Node })
  shadowNode: Node = null;

  @property({ type: Button })
  touchArea: Button = null;

  @property
  private get _mask() {
    return this.node.getComponent(Mask);
  }

  @property
  private get _animation() {
    return this.node.getComponent(Animation);
  }

  @property
  private get _UITransform() {
    return this.node.getComponent(UITransform);
  }

  @property
  private get _maskGraphics() {
    return this.node.getComponent(Graphics);
  }

  @property
  private get _currentSpriteFrame() {
    let result = null;
    if (this.value.length < 1) return null;
    for (let i = 0; i < this.valueKinds.length; i++) {
      const cardkind = this.valueKinds[i];
      const isFound = cardkind.key == this.value;
      result = isFound ? cardkind.frame : null;
      if (isFound) break;
    }
    return result;
  }

  @property
  private get _valueNodeUITransform() {
    return this.valueNode.getComponent(UITransform);
  }

  @property({ type: CCString })
  value = "";

  @property
  private _value = "";

  @property({ type: CCBoolean })
  isAuto = false;

  @property({ type: CCBoolean })
  isSqueezable = false;

  @property
  get isOpened() {
    return this._isOpened && this._currentSpriteFrame != null;
  }

  @property
  _isOpened = false;

  @property({ type: CCFloat })
  squeezingRange = 0.25;

  @property
  private get TOP() {
    return this._UITransform.height / 2;
  }

  @property
  private get RIGHT() {
    return this._UITransform.width / 2;
  }

  @property
  private get BOTTOM() {
    return -this._UITransform.height / 2;
  }

  @property
  private get LEFT() {
    return -this._UITransform.width / 2;
  }

  @property
  private _startDragPosition = v2(0, 0);

  @property
  private _currentDragPosition = v2(0, 0);

  @property
  private get _cornerRange() {
    return this.fingerPrintNodes[0] === undefined ||
      this.fingerPrintNodes[0] === null
      ? size(0, 0)
      : this.fingerPrintNodes[0].getComponent(UITransform).contentSize;
  }

  protected onLoad(): void {
    const {
      TOUCH_START,
      TOUCH_MOVE,
      TOUCH_CANCEL,
      TOUCH_END,
      MOUSE_DOWN,
      MOUSE_MOVE,
      MOUSE_LEAVE,
      MOUSE_UP,
    } = Node.EventType;

    if (sys.isMobile) {
      this.node.on(TOUCH_START, this._onStartDragging, this);
      this.node.on(TOUCH_MOVE, this._onDragging, this);
      this.node.on(TOUCH_END, this._onEndDragging, this);
      this.node.on(TOUCH_CANCEL, this._onEndDragging, this);
    } else {
      this.node.on(MOUSE_DOWN, this._onStartDragging, this);
      this.node.on(MOUSE_MOVE, this._onDragging, this);
      this.node.on(MOUSE_LEAVE, this._onEndDragging, this);
      this.node.on(MOUSE_UP, this._onEndDragging, this);
    }
  }

  start() {
    this._value = this.value;
    this.reset();
  }

  _onStartDragging(event: EventTouch | EventMouse) {
    if (!this.isSqueezable || this.isAuto) return;
    if (this._isOpened) return;
    if (this._currentSpriteFrame == null) return;
    const { TOP, RIGHT, BOTTOM, LEFT } = this;

    let _startVector: Vec3 | Vec2 = event.getLocation();
    _startVector = this._UITransform.convertToNodeSpaceAR(
      v3(_startVector.x, _startVector.y, 0)
    );
    if (
      _startVector.x > (LEFT * 2) / 3 &&
      _startVector.x < (RIGHT * 2) / 3 &&
      _startVector.y > (BOTTOM * 2) / 3 &&
      _startVector.y < (TOP * 2) / 3
    )
      return;

    _startVector.x =
      LEFT + this._cornerRange.width < _startVector.x &&
      RIGHT - this._cornerRange.width > _startVector.x
        ? 0
        : _startVector.x;

    _startVector.y =
      TOP - this._cornerRange.height > _startVector.y &&
      BOTTOM + this._cornerRange.height < _startVector.y
        ? 0
        : _startVector.y;

    this._startDragPosition = v2(_startVector.x / RIGHT, _startVector.y / TOP);
  }

  _onDragging(event: EventTouch | EventMouse) {
    if (!this.isSqueezable || this.isAuto) return;
    if (this._isOpened) return;
    if (this._currentSpriteFrame == null) return;
    if (this._startDragPosition.x == 0 && this._startDragPosition.y == 0)
      return;

    const { TOP, RIGHT, BOTTOM, LEFT } = this;
    let _draggingVector: Vec2 | Vec3 = event.getLocation();
    let offsetX: number;
    let offsetY: number;
    let graphicVectors: Vec2[];
    _draggingVector = this._UITransform.convertToNodeSpaceAR(
      v3(_draggingVector.x, _draggingVector.y, 0)
    );
    _draggingVector.x = this._startDragPosition.x == 0 ? 0 : _draggingVector.x;
    _draggingVector.y = this._startDragPosition.y == 0 ? 0 : _draggingVector.y;

    if (
      Math.abs(this._startDragPosition.x * RIGHT) <
        Math.abs(_draggingVector.x) ||
      Math.abs(this._startDragPosition.y * TOP) < Math.abs(_draggingVector.y)
    )
      return;

    offsetX = Math.abs(_draggingVector.x - this._startDragPosition.x * RIGHT);
    offsetY = Math.abs(_draggingVector.y - this._startDragPosition.y * TOP);

    if (offsetX == 0 && offsetY == 0) return;

    // log(offsetX);
    // log(RIGHT);
    // log(this.squeezingRange);

    if (
      offsetX > RIGHT * 4 * this.squeezingRange ||
      offsetY > TOP * 4 * this.squeezingRange
    ) {
      //   this.reset();
      //   this.flipUp();
      return;
    }

    _draggingVector.x =
      this._startDragPosition.x > 0
        ? RIGHT - offsetX
        : this._startDragPosition.x < 0
        ? LEFT + offsetX
        : 0;

    _draggingVector.y =
      this._startDragPosition.y > 0
        ? TOP - offsetY
        : this._startDragPosition.y < 0
        ? BOTTOM + offsetY
        : 0;

    this._currentDragPosition = v2(
      _draggingVector.x / RIGHT,
      _draggingVector.y / TOP
    );

    graphicVectors = getFoldGraphic(
      v2(this._startDragPosition.x * RIGHT, this._startDragPosition.y * TOP),
      v2(_draggingVector.x, _draggingVector.y),
      size(this._UITransform.width, this._UITransform.height)
    );

    this.node.emit(
      SQUEEZING_EVENT,
      this._startDragPosition,
      this._currentDragPosition
    );

    this._setMaskGraghic(graphicVectors);
    this._setValueNodeByGraphic(graphicVectors);
  }

  _setMaskGraghic(vectors = []) {
    if (vectors.length < 1) return;

    this._maskGraphics.clear();
    this._maskGraphics.moveTo(vectors[0].x, vectors[0].y);
    for (const key in vectors) {
      const { x, y } = vectors[key];
      this._maskGraphics.lineTo(x, y);
    }
    this._maskGraphics.fill();
  }

  _setValueNodeByGraphic(vectors = []) {
    if (vectors.length < 2) return;
    const { TOP, RIGHT, BOTTOM, LEFT } = this;
    let shadowPosition: Vec3;

    this.valueNode.setScale(v3(1, 1, 0));
    this._valueNodeUITransform.anchorX =
      this._startDragPosition.x == 0
        ? 0.5
        : this._startDragPosition.y == 0 && this._startDragPosition.x > 0
        ? 0
        : this._startDragPosition.y == 0 && this._startDragPosition.x < 0
        ? 1
        : this._startDragPosition.y != 0 && this._startDragPosition.x > 0
        ? 1
        : 0;
    this._valueNodeUITransform.anchorY =
      this._startDragPosition.y == 0
        ? 0.5
        : this._startDragPosition.y > 0
        ? 0
        : 1;

    // log(
    //   "this._valueNodeUITransform.anchorX",
    //   this._valueNodeUITransform.anchorX
    // );
    // log(
    //   "this._valueNodeUITransform.anchorY",
    //   this._valueNodeUITransform.anchorY
    // );

    this.valueNode.position = v3(
      this._currentDragPosition.x * RIGHT,
      this._currentDragPosition.y * TOP,
      0
    );

    // log("this._currentDragPosition", this._currentDragPosition);

    this.valueNode.angle =
      this._startDragPosition.x == 0 || this._startDragPosition.y == 0
        ? 0
        : ((Math.atan(
            (vectors[0].y - vectors[1].y) / (vectors[0].x - vectors[1].x)
          ) *
            180) /
            Math.PI) *
          2;

    shadowPosition = v3(
      (vectors[0].x + vectors[1].x) / 2,
      (vectors[0].y + vectors[1].y) / 2,
      0
    );

    // log("shadowPosition", shadowPosition);
    // // TODO: 陰影有問題
    // shadowPosition = this._UITransform.convertToWorldSpaceAR(shadowPosition);
    // log("shadowPosition", shadowPosition);
    // shadowPosition =
    //   this._valueNodeUITransform.convertToNodeSpaceAR(shadowPosition);
    this.shadowNode.angle =
      this._startDragPosition.y == 0
        ? 90
        : this._startDragPosition.x == 0
        ? 0
        : 180 - this.valueNode.angle / 2;
    log("shadowPosition", shadowPosition);
    this.shadowNode.setPosition(shadowPosition);
  }

  update(deltaTime: number) {
    for (let i = 0; i < this.fingerPrintNodes.length; i++) {
      const node = this.fingerPrintNodes[i];
      node.active =
        !this._isOpened &&
        (this._currentDragPosition.x != 0 || this._currentDragPosition.y != 0);
    }

    this.touchArea.enabled = !this.isAuto && !this.isSqueezable;

    this.shadowNode.active =
      !this._isOpened &&
      (this._currentDragPosition.x != 0 || this._currentDragPosition.y != 0);

    if (this._value != this.value) {
      this._value = this.value;
      this.valuePointSprite.spriteFrame = this._currentSpriteFrame;
    }

    if (this.isAuto && this._currentSpriteFrame == null && this._isOpened) {
      this._isOpened = false;
      this._animation.play(this._animation.clips[1].name);
    } else if (
      this.isAuto &&
      this._currentSpriteFrame != null &&
      !this._isOpened &&
      !this.isSqueezable
    ) {
      this._isOpened = true;
      this._animation.play(this._animation.clips[0].name);
    }
  }

  onDestroy() {
    const {
      TOUCH_START,
      TOUCH_MOVE,
      TOUCH_CANCEL,
      TOUCH_END,
      MOUSE_DOWN,
      MOUSE_MOVE,
      MOUSE_LEAVE,
      MOUSE_UP,
    } = Node.EventType;
    if (sys.isMobile) {
      this.node.off(TOUCH_START, this._onStartDragging, this);
      this.node.off(TOUCH_MOVE, this._onDragging, this);
      this.node.off(TOUCH_END, this._onEndDragging, this);
      this.node.off(TOUCH_CANCEL, this._onEndDragging, this);
    } else {
      this.node.off(MOUSE_DOWN, this._onStartDragging, this);
      this.node.off(MOUSE_MOVE, this._onDragging, this);
      this.node.off(MOUSE_LEAVE, this._onEndDragging, this);
      this.node.off(MOUSE_UP, this._onEndDragging, this);
    }
  }

  flipUp() {
    // log("flipUp");
    if (this._isOpened && this._currentSpriteFrame != null) return;
    // log("flipUp-1");
    if (this.isAuto && !this.isSqueezable) return;
    // log("flipUp-2");
    if (this._currentSpriteFrame == null) return;
    // log("flipUp---");
    this._isOpened = true;
    this._animation.play(this._animation.clips[0].name);
  }
  flipDown() {
    if (!this._isOpened) return;
    if (this.isAuto && !this.isSqueezable) return;
    this._isOpened = false;
    this._animation.play(this._animation.clips[1].name);
  }

  synchronizePeeking(
    startDraggingPosition = v2(0, 0),
    draggingPosition = v2(0, 0)
  ) {
    if (!this.isSqueezable && !this.isAuto) return;
    const { TOP, RIGHT } = this;
    let graphicVectors;

    this._startDragPosition = startDraggingPosition;
    this._currentDragPosition = draggingPosition;

    graphicVectors = getFoldGraphic(
      v2(this._startDragPosition.x * RIGHT, this._startDragPosition.y * TOP),
      v2(
        this._currentDragPosition.x * RIGHT,
        this._currentDragPosition.y * TOP
      ),
      size(this._UITransform.width, this._UITransform.height)
    );

    this._setMaskGraghic(graphicVectors);
    this._setValueNodeByGraphic(graphicVectors);
  }

  reset() {
    const { TOP, RIGHT, BOTTOM, LEFT } = this;
    const graphicVectors = [
      v2(RIGHT, TOP),
      v2(RIGHT, BOTTOM),
      v2(LEFT, BOTTOM),
      v2(LEFT, TOP),
    ];
    this._value = "";
    this._isOpened = false;
    this._startDragPosition = v2(0, 0);
    this._currentDragPosition = v2(0, 0);
    this._setMaskGraghic(graphicVectors);
    this.valuePointSprite.spriteFrame = this._currentSpriteFrame;
    this._valueNodeUITransform.anchorX =
      this._valueNodeUITransform.anchorY = 0.5;
    this.valueNode.setScale(v3(0, 1, 0));
    this.valueNode.position = v3(0, 0, 0);
    this.valueNode.angle = 0;
    this.node.emit(RESETTING_EVENT);
  }

  _onEndDragging() {
    if (!this.isSqueezable || this.isAuto) return;
    if (this._isOpened) return;
    if (this._currentSpriteFrame == null) return;
    if (this._startDragPosition.x == 0 && this._startDragPosition.y == 0)
      return;

    this.reset();
  }
}
