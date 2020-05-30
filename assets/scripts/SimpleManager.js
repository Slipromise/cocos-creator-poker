import PokerCard,{PEEKING_EVENT,RESETING_EVENT} from './PokerCard'

cc.Class({
    extends: cc.Component,

    properties: {
        leftPoker:{
            default:null,
            type:PokerCard
        },
        rightPoker:{
            default:null,
            type:PokerCard
        },
        isOpendedToggle:{
            default:null,
            type:cc.Toggle
        }
    },

    start () {
        this.leftPoker.node.on(PEEKING_EVENT,this.onPeeking.bind(this));
        this.leftPoker.node.on(RESETING_EVENT,this.onReset.bind(this));
    },

    update(){
        if(this.leftPoker.isOpened != this.isOpendedToggle.isChecked){
            this.isOpendedToggle.isChecked = this.leftPoker.isOpened;
        }
        if(this.leftPoker.isOpened != this.rightPoker.isOpened && this.leftPoker.isOpened){
            this.rightPoker.reset();
            this.rightPoker.flipUp();
        }else if(this.leftPoker.isOpened != this.rightPoker.isOpened && !this.leftPoker.isOpened){
            this.rightPoker.flipDown();
        }
    },

    onChangeValue (editbox){
        this.leftPoker.value = this.rightPoker.value = editbox.string;
    },

    onChangeIsAuto(toggle){
        this.leftPoker.isAuto = toggle.isChecked;
    },

    onChangeIsPeekable(toggle){
        this.leftPoker.isPeekable = toggle.isChecked;
    },

    onPeeking(startPosition,dargPostion){
        this.rightPoker.synchronizePeeking(startPosition,dargPostion);
    },

    onReset(){
        this.rightPoker.reset();
    }

});
