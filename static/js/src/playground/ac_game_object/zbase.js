let AC_GAME_OBJECT=[];

class AcGameObject{
    constructor(){
        AC_GAME_OBJECT.push(this);
        this.has_called_start=false;//是否执行过start
        this.timedelta=0;     //帧调用的时间间隔
        this.uuid=this.create_uuid();

        
    }

    create_uuid(){
        let res="";
        for(let i=0;i<8;i++){
            let x=parseInt(Math.floor(Math.random()*10));
            res+=x;
        }
        return res;
    }


    start(){     //只在第一帧执行
    }
    update(){   //一直更新
    }
    
    on_destroy(){   //删除之前的操作
    }

    destroy(){  //摧毁对象
        this.on_destroy();
        
        for(let i=0;i<AC_GAME_OBJECT.length;i++){
            if(AC_GAME_OBJECT[i]===this){
                AC_GAME_OBJECT.splice(i,1);
                break;
            }
        }

    }

}

let last_timestamp;

let AC_GAME_ANIMATION = function(timestamp){
    for(let i=0;i<AC_GAME_OBJECT.length;i++){
        let obj=AC_GAME_OBJECT[i];
        if(!obj.has_called_start){
            obj.start();
            obj.has_called_start=true;
        }else{
            obj.timedelta=timestamp-last_timestamp;
            obj.update();
        }
    }

    last_timestamp=timestamp;

    requestAnimationFrame(AC_GAME_ANIMATION);
}

requestAnimationFrame(AC_GAME_ANIMATION);
