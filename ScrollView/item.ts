const { ccclass, property } = cc._decorator;

@ccclass
export default class Item extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;
    itemData: any;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    updateData(itemData) {
        this.itemData = itemData;
        this.updateView();
    }

    updateView() {
        // cc.log('=============排行榜数据===========')
        // cc.log(this.itemData);
        this.label.string=this.itemData.value;



        // set nickName
        // let userName = this.node.getChildByName('userName').getComponent(cc.Label);
        // userName.string = this.itemData.name;

        // cc.loader.load({ url: this.itemData.headUrl, type: 'png' }, (err, texture) => {
        //     if (err) console.error(err);
        //     let userIcon = this.node.getChildByName('mask').children[0].getComponent(cc.Sprite);
        //     userIcon.spriteFrame = new cc.SpriteFrame(texture);
        // });
    }

    // update (dt) {}
}
