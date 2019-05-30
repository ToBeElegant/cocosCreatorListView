
import Item from "./item"; // 根据需求自定义类容
const { ccclass, property } = cc._decorator;
// const orientation: Enum({
//     X: 0,
//     Y: 1,
// });
enum Orientation {
    X = 0,
    Y = 1,
}

@ccclass
export default class ScrollView extends cc.Component {

    @property(cc.ScrollView)
    scrollView: cc.ScrollView = null;

    @property(cc.Prefab)
    listOfItem: cc.Prefab[] = [null];

    @property({
        type: cc.Enum(Orientation),
        tooltip: '列表滚动方向 X：水平滚动 Y：垂直滚动'
    })
    orientation: Orientation = Orientation.X

    @property({
        type: cc.Integer,
        tooltip: '相邻子节点的水平间距'
    })
    spacingX: number = 0;

    @property({
        type: cc.Integer,
        tooltip: '相邻子节点的垂直间距'
    })
    spacingY: number = 0;

    private nodePool: Map<number, Item[]> = null;

    private listOfitemData: ItemData[] = [];

    /**
     * listOfitemData 起点
     */
    private startIndex: number = -1;

    /**
     * listOfitemData 终点
     */
    private stopIndex: number = -1;

    /**
     * 容器默认高度
     */
    private defaultHeight: number;

    /**
     * 容器默认宽度
     */
    private defaultWidth: number;

    /**
     * 初始化
     */
    init() {
        this.defaultHeight = this.scrollView.content.height;
        this.defaultWidth = this.scrollView.content.width;
        this.nodePool = new Map();
        this.scrollView.node.on('scrolling', this.onScrolling, this);
    }

    /**
     * 更新索引
     */
    onScrolling() {
        if (!this.listOfitemData.length) {
            return
        }
        switch (this.orientation) {
            case Orientation.X:

                let X = this.scrollView.content.x;

                if (X < this.defaultWidth - this.scrollView.content.width) {
                    X = this.defaultWidth - this.scrollView.content.width;
                }

                var start = 0;
                var stop = this.listOfitemData.length - 1;
                while (this.listOfitemData[start].x + this.listOfitemData[start].width < -X) {
                    start++;
                }

                while (this.listOfitemData[stop].x > -X + this.defaultWidth) {
                    stop--;
                }

                if (start != this.startIndex && stop != this.stopIndex) {
                    this.startIndex = start;
                    this.stopIndex = stop;

                    this.updateView();
                }
                break;

            case Orientation.Y:
                let Y = this.scrollView.content.y;
                Y = Y < 0 ? 0 : Y;
                if (Y > this.scrollView.content.height - this.defaultHeight) {
                    Y = this.scrollView.content.height - this.defaultHeight;
                }

                var start = 0;
                var stop = this.listOfitemData.length - 1;

                while (this.listOfitemData[start].y - this.listOfitemData[start].height > -Y) {
                    start++;
                }

                while (this.listOfitemData[stop].y < -Y - this.defaultHeight - 50) {
                    stop--;
                }

                if (start != this.startIndex && stop != this.stopIndex) {
                    this.startIndex = start;
                    this.stopIndex = stop;

                    this.updateView();
                }
                break;
        }
    }

    /**
     * 更新类容
     */
    updateView() {

        let itemData: ItemData = null;
        for (let i = 0; i < this.startIndex; i++) {
            itemData = this.listOfitemData[i];
            if (itemData.item) {
                this.putItem(itemData);
            }
        }

        for (let i = this.listOfitemData.length - 1; i > this.stopIndex; i--) {
            itemData = this.listOfitemData[i];
            if (itemData.item) {
                this.putItem(itemData);
            }
        }
        for (let i = this.startIndex; i <= this.stopIndex + 1; i++) {
            if (!this.listOfitemData[i]) {
                return
            }
            itemData = this.listOfitemData[i];
            if (!itemData.item) {
                itemData.item = this.getItem(itemData.key);
                itemData.item.updateData(itemData.data);
            }

            itemData.item.node.setPosition(itemData.x, itemData.y);
        }


    }

    /**
     * 得到内容node
     * @param key 
     * @return Item
     */
    getItem(key): Item {
        let list = this.nodePool.get(key);
        let item: Item = null;
        if (list && list.length) {
            item = list.pop()
        } else {
            cc.log('生成item')
            item = cc.instantiate(this.listOfItem[key]).getComponent(Item)
        }
        // let item = list && list.length ? list.pop() : cc.instantiate(this.listOfItem[key]).getComponent(Item);
        this.scrollView.content.addChild(item.node);

        return item
    }

    /**
      * 回收
      * @param item 
      */
    putItem(itemData) {
        if (!itemData.item) return
        let node = itemData.item.node;
        if (node && cc.isValid(node)) {
            let list = this.nodePool.get(itemData.key);
            if (!list) {
                list = [];
                this.nodePool.set(itemData.key, []);
            }
            this.nodePool.get(itemData.key).push(itemData.item);
            node.removeFromParent();
            itemData.item = null;
        }
    }

    /**
     * 包装item
     * @param data 
     * @param key 
     * @returns 
     */
    setItemValue(data, key): ItemData {

        let item = this.getItem(key);
        item.updateData(data);
        let itemData = {
            height: item.node.height,
            width: item.node.width,
            data: data,
            item: item,
            key: key,
            x: 0,
            y: 0
        };
        this.putItem(itemData);
        return itemData;
    }

    /**
     * 清除items
     */
    resetItemData() {
        this.listOfitemData.forEach((itemData) => {
            this.putItem(itemData);
        });
    }

    /**
     * 设置类容数据
     * @param listOfData 要做展示的数据列表
     */
    setItemData(listOfData) {

        cc.log(listOfData);
        this.resetItemData();
        this.listOfitemData = [];

        listOfData.forEach((data) => {
            this.listOfitemData.push(this.setItemValue(data, data.key));
        });
        this.layoutItem(0);
        this.resizeContent();

        switch (this.orientation) {
            case Orientation.X:
                this.scrollView.content.x = 0;
                break;

            case Orientation.Y:
                this.scrollView.content.y = 0;
                break;
        }
    }

    /**
   * 插入数据
   * @param index 位置
   * @param data 
   */
    insertData(index: number, data) {
        if (index < 0 || index > this.listOfitemData.length) {
            console.warn("无效的index", index);
            return;
        }
        let itemData = this.setItemValue(data, data.key);
        this.listOfitemData.splice(index, 0, itemData);
        this.layoutItem(index);
        this.resizeContent();
        this.startIndex = -1;
        this.stopIndex = -1;
        this.onScrolling();
    }

    /**
     * 底部添加数据
     * @param data 
     */
    bottomInsertData(data) {
        this.insertData(this.listOfitemData.length, data);

        switch (this.orientation) {
            case Orientation.X:
                this.scrollView.scrollToRight(2);
                break;
            case Orientation.Y:
                this.scrollView.scrollToBottom(2);
                break;
        }
    }

    /**
     * 调整容器大小
     */
    resizeContent() {
        if (this.listOfitemData.length) {
            let itemData = this.listOfitemData[this.listOfitemData.length - 1];
            switch (this.orientation) {
                case Orientation.X:
                    this.scrollView.content.width = Math.max(this.defaultWidth, itemData.width + itemData.x);
                    break;
                case Orientation.Y:
                    this.scrollView.content.height = Math.max(this.defaultHeight, itemData.height - itemData.y);
                    break;
            }
            this.onScrolling();
        } else {
            this.scrollView.content.width = 0;
            this.scrollView.content.height = 0;
        }
    }

    /**
     * 刷新布局
     * @param start 起点
     */
    layoutItem(start) {
        if (this.listOfitemData.length <= 0) {
            return;
        }
        let startPos = 0;
        if (start > 0) {
            let itemData = this.listOfitemData[start - 1];
            switch (this.orientation) {
                case Orientation.X:
                    startPos = itemData.x + itemData.width + this.spacingX;
                    break;
                case Orientation.Y:
                    startPos = itemData.y - itemData.height - this.spacingY;
                    break;
            }
        }
        for (let i = start; i < this.listOfitemData.length; i++) {
            let itemData = this.listOfitemData[i];
            switch (this.orientation) {
                case Orientation.X:
                    itemData.y = 0;
                    itemData.x = startPos;
                    startPos += itemData.width + this.spacingX;
                    break;
                case Orientation.Y:
                    itemData.x = 0;
                    itemData.y = startPos;
                    startPos -= itemData.height + this.spacingY;
                    break;
            }
        }
    }

    /**
     * 清除
     */
    clearData() {
        this.resetItemData();
        this.nodePool.forEach((list) => {
            list.forEach((item) => {
                item.node.destroy();
            });
        });
        this.nodePool = null;
        this.listOfitemData = [];
        this.startIndex=-1;
        this.stopIndex=-1;
        this.scrollView.node.off('scrolling', this.onScrolling);
    }

    // 测试用
    onClickAddItem() {
        this.bottomInsertData({ value: '我是刚刚插入的', key: 0 });
    }

}

// 类型声明约束
interface ItemData {
    height: number,
    width: number
    data: any,
    item: Item,
    key: number,
    x: number,
    y: number
}
