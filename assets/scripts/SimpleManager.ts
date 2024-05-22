import { _decorator, Component, EditBox, Node, Toggle, Vec2 } from "cc";
import { PokerCard, SQUEEZING_EVENT, RESETTING_EVENT } from "./PokerCard";
const { ccclass, property } = _decorator;

@ccclass("SimpleManager")
export class SimpleManager extends Component {
  @property({ type: PokerCard })
  rightPoker: PokerCard | null = null;

  @property({ type: PokerCard })
  leftPoker: PokerCard | null = null;

  @property({ type: Toggle })
  isOpenedToggle: Toggle = null;

  start() {
    this.leftPoker.node.on(SQUEEZING_EVENT, this.onSqueeze, this);
    this.rightPoker.node.on(RESETTING_EVENT, this.onReset, this);
  }

  update(deltaTime: number) {
    if (this.leftPoker.isOpened != this.isOpenedToggle.isChecked) {
      this.isOpenedToggle.isChecked = this.leftPoker.isOpened;
    }
    if (
      this.leftPoker.isOpened != this.rightPoker.isOpened &&
      this.leftPoker.isOpened
    ) {
      this.rightPoker.reset();
      this.rightPoker.flipUp();
    } else if (
      this.leftPoker.isOpened != this.rightPoker.isOpened &&
      !this.leftPoker.isOpened
    ) {
      this.rightPoker.flipDown();
    }
  }

  onChangeValue(editbox: EditBox) {
    this.leftPoker.value = this.rightPoker.value = editbox.string;
  }

  onChangeIsAuto(toggle: Toggle) {
    this.leftPoker.isAuto = toggle.isChecked;
  }

  onChangeIsPeekable(toggle: Toggle) {
    this.leftPoker.isSqueezable = toggle.isChecked;
  }

  onSqueeze(startPosition: Vec2, dargPosition: Vec2) {
    this.rightPoker.synchronizePeeking(startPosition, dargPosition);
  }

  onReset() {
    this.rightPoker.reset();
  }
}
