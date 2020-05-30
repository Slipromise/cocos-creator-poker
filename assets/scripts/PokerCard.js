import getFoldGraphic from "./FoldFormula";

const Cardkind = cc.Class({
  name: "Cardkind",
  properties: {
    key: "",
    frame: cc.SpriteFrame,
  },
});

export const PEEKING_EVENT = "PokerCardPeeking";
export const RESETING_EVENT = "PokerCardReseting";

export default cc.Class({
  extends: cc.Component,

  properties: {
    // 參照
    valueNode: {
      default: null,
      type: cc.Node,
    },
    valuePointSprite: {
      default: null,
      type: cc.Sprite,
    },
    valueKinds: {
      default: [],
      type: [Cardkind],
    },
    fingerPrintNodes: {
      default: [],
      type: [cc.Node],
    },
    shadowNode: {
      default: null,
      type: cc.Node,
    },
    opendButton:{
      default:null,
      type:cc.Button
    },
    _mask: {
      get() {
        return this.node.getComponent(cc.Mask);
      },
    },
    _animation: {
      get() {
        return this.node.getComponent(cc.Animation);
      },
    },
    _currentSpriteFrame: {
      get() {
        let result = null;
        if (this.value.length < 1) return null;
        for (let i = 0; i < this.valueKinds.length; i++) {
          const cardkind = this.valueKinds[i];
          const isFound = cardkind.key == this.value;
          result = isFound ? cardkind.frame : null;
          if (isFound) break;
        }
        return result;
      },
    },
    // 資料
    value: "",
    isAuto: false,
    isPeekable: false,
    isOpened: {
      get() {
        return this._isOpened && this._currentSpriteFrame != null;
      },
    },
    _isOpened: false,
    peekingRange: 0.25,
    TOP: {
      get() {
        return this.node.height / 2;
      },
      visible: false,
    },
    RIGHT: {
      get() {
        return this.node.width / 2;
      },
      visible: false,
    },
    BOTTOM: {
      get() {
        return -this.node.height / 2;
      },
      visible: false,
    },
    LEFT: {
      get() {
        return -this.node.width / 2;
      },
      visible: false,
    },
    _startDragPosition: {
      default: cc.v2(0, 0),
    },
    _currentDragPosition: {
      default: cc.v2(0, 0),
    },
    _conerRange: {
      get() {
        if (
          this.fingerPrintNodes[0] == undefined ||
          this.fingerPrintNodes[0] == null
        )
          return new cc.size(0, 0);
        return new cc.size(
          this.fingerPrintNodes[0].width,
          this.fingerPrintNodes[0].height
        );
      },
    },
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    const {
      TOUCH_START,
      TOUCH_MOVE,
      TOUCH_CANCEL,
      TOUCH_END,
      MOUSE_DOWN,
      MOUSE_MOVE,
      MOUSE_LEAVE,
      MOUSE_UP,
    } = cc.Node.EventType;
    if (cc.sys.isMobile) {
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
  },

  start() {
    this._value = this.value;
    this.reset();
  },

  update(dt) {
    for (let i = 0; i < this.fingerPrintNodes.length; i++) {
      const node = this.fingerPrintNodes[i];
      node.active =
        !this._isOpened &&
        (this._currentDragPosition.x != 0 || this._currentDragPosition.y != 0);
    }

    this.opendButton.enabled = !this.isAuto && !this.isPeekable;

    this.shadowNode.active =
      !this._isOpened &&
      (this._currentDragPosition.x != 0 || this._currentDragPosition.y != 0);

    if (this._value != this.value) {
      this._value = this.value;
      this.valuePointSprite.spriteFrame = this._currentSpriteFrame;
    }

    if (
      this.isAuto &&
      this._currentSpriteFrame == null &&
      this._isOpened 
    ) {
      this._isOpened = false;
      this._animation.play(this._animation.getClips()[1].name);
    } else if (
      this.isAuto &&
      this._currentSpriteFrame != null &&
      !this._isOpened &&
      !this.isPeekable
    ) {
      this._isOpened = true;
      this._animation.play(this._animation.getClips()[0].name);
    }
  },

  flipUp() {
    if (this._isOpened && this._currentSpriteFrame != null) return;
    if (this.isAuto && !this.isPeekable) return;
    if (this._currentSpriteFrame == null) return;
    this._isOpened = true;
    this._animation.play(this._animation.getClips()[0].name);
  },
  flipDown() {
    if (!this._isOpened) return;
    if (this.isAuto && !this.isPeekable) return;
    this._isOpened = false;
    this._animation.play(this._animation.getClips()[1].name);
  },

  synchronizePeeking(
    startDraggingPosition = cc.v2(0, 0),
    draggingPosition = cc.v2(0, 0)
  ) {
    if(!this.isPeekable && !this.isAuto) return ;
    const { TOP, RIGHT } = this;
    let graphicVectors;

    this._startDragPosition = startDraggingPosition;
    this._currentDragPosition = draggingPosition;

    graphicVectors = getFoldGraphic(
      cc.v2(this._startDragPosition.x * RIGHT, this._startDragPosition.y * TOP),
      cc.v2(
        this._currentDragPosition.x * RIGHT,
        this._currentDragPosition.y * TOP
      ),
      new cc.Size(this.node.width, this.node.height)
    );

    this._setMaskGraghic(graphicVectors);
    this._setValueNodeByGraphic(graphicVectors);
  },

  reset() {
    const { TOP, RIGHT, BOTTOM, LEFT } = this;
    const graphicVectors = [
      cc.v2(RIGHT, TOP),
      cc.v2(RIGHT, BOTTOM),
      cc.v2(LEFT, BOTTOM),
      cc.v2(LEFT, TOP),
    ];
    this._value = "";
    this._isOpened = false;
    this._startDragPosition = cc.v2(0, 0);
    this._currentDragPosition = cc.v2(0, 0);
    this._setMaskGraghic(graphicVectors);
    this.valuePointSprite.spriteFrame = this._currentSpriteFrame;
    this.valueNode.anchorX = this.valueNode.anchorY = 0.5;
    this.valueNode.scaleX = 0;
    this.valueNode.position = cc.v2(0, 0);
    this.valueNode.angle = 0;
    this.node.emit( RESETING_EVENT );
  },

  _onStartDragging(event) {
    if (!this.isPeekable || this.isAuto) return;
    if (this._isOpened) return;
    if (this._currentSpriteFrame == null) return;
    const { TOP, RIGHT, BOTTOM, LEFT } = this;

    let _startVector = event.getLocation();
    _startVector = this.node.convertToNodeSpaceAR(_startVector);
    if (
      _startVector.x > (LEFT * 2) / 3 &&
      _startVector.x < (RIGHT * 2) / 3 &&
      _startVector.y > (BOTTOM * 2) / 3 &&
      _startVector.y < (TOP * 2) / 3
    )
      return;

    _startVector.x =
      LEFT + this._conerRange.width < _startVector.x &&
      RIGHT - this._conerRange.width > _startVector.x
        ? 0
        : _startVector.x;

    _startVector.y =
      TOP - this._conerRange.height > _startVector.y &&
      BOTTOM + this._conerRange.height < _startVector.y
        ? 0
        : _startVector.y;

    this._startDragPosition = cc.v2(
      _startVector.x / RIGHT,
      _startVector.y / TOP
    );
  },

  _onDragging(event) {
    if (!this.isPeekable || this.isAuto) return;
    if (this._isOpened) return;
    if (this._currentSpriteFrame == null) return;
    if (this._startDragPosition.x == 0 && this._startDragPosition.y == 0)
      return;

    const { TOP, RIGHT, BOTTOM, LEFT } = this;
    let _draggingVector = event.getLocation();
    let offsetX, offsetY;
    let graphicVectors;
    _draggingVector = this.node.convertToNodeSpaceAR(_draggingVector);
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

    if (
      offsetX > RIGHT * 4 * this.peekingRange ||
      offsetY > TOP * 4 * this.peekingRange
    ) {
      this.reset();
      this.flipUp();
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

    this._currentDragPosition = cc.v2(
      _draggingVector.x / RIGHT,
      _draggingVector.y / TOP
    );

    graphicVectors = getFoldGraphic(
      cc.v2(this._startDragPosition.x * RIGHT, this._startDragPosition.y * TOP),
      cc.v2(_draggingVector.x, _draggingVector.y),
      new cc.Size(this.node.width, this.node.height)
    );

    this.node.emit(
      PEEKING_EVENT,
      this._startDragPosition,
      this._currentDragPosition
    );

    this._setMaskGraghic(graphicVectors);
    this._setValueNodeByGraphic(graphicVectors);
  },

  _onEndDragging() {
    if (!this.isPeekable || this.isAuto) return;
    if (this._isOpened) return;
    if (this._currentSpriteFrame == null) return;
    if (this._startDragPosition.x == 0 && this._startDragPosition.y == 0)
      return;

    this.reset();
  },

  _setMaskGraghic(vectors = []) {
    if (vectors.length < 1) return;

    this._mask._graphics.clear(false);
    this._mask._graphics.moveTo(vectors[0].x, vectors[0].y);
    for (const key in vectors) {
      const { x, y } = vectors[key];
      this._mask._graphics.lineTo(x, y);
    }
    this._mask._graphics.fill();
  },

  _setValueNodeByGraphic(vectors = []) {
    if (vectors.length < 2) return;
    const { TOP, RIGHT, BOTTOM, LEFT } = this;
    let shodowPostion;
    this.valueNode.scaleX = 1;
    this.valueNode.anchorX =
      this._startDragPosition.x == 0
        ? 0.5
        : this._startDragPosition.y == 0 && this._startDragPosition.x > 0
        ? 0
        : this._startDragPosition.y == 0 && this._startDragPosition.x < 0
        ? 1
        : this._startDragPosition.y != 0 && this._startDragPosition.x > 0
        ? 1
        : 0;
    this.valueNode.anchorY =
      this._startDragPosition.y == 0
        ? 0.5
        : this._startDragPosition.y > 0
        ? 0
        : 1;

    this.valueNode.position = cc.v2(
      this._currentDragPosition.x * RIGHT,
      this._currentDragPosition.y * TOP
    );

    this.valueNode.angle =
      this._startDragPosition.x == 0 || this._startDragPosition.y == 0
        ? 0
        : ((Math.atan(
            (vectors[0].y - vectors[1].y) / (vectors[0].x - vectors[1].x)
          ) *
            180) /
            Math.PI) *
          2;

    shodowPostion = cc.v2(
      (vectors[0].x + vectors[1].x) / 2,
      (vectors[0].y + vectors[1].y) / 2
    );
    shodowPostion = this.node.convertToWorldSpaceAR(shodowPostion);
    shodowPostion = this.valueNode.convertToNodeSpaceAR(shodowPostion);
    this.shadowNode.angle =
      this._startDragPosition.y == 0
        ? 90
        : this._startDragPosition.x == 0
        ? 0
        : 180 - this.valueNode.angle / 2;
    this.shadowNode.position = shodowPostion;
  },

  onDestroy() {
    if (cc.sys.isMobile) {
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
  },
});
