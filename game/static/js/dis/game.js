class AcGameMenu{
    constructor(root){
       
        this.root=root;
        this.$menu=$(`
<div class="ac-game-menu">
    <div class="ac-game-menu-field">
        <div class="ac-game-menu-field-item ac-game-menu-field-item-single-mode">
            solo
        </div>
        <br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-multi-mode">
            多人
        </div>
        <br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-settings">
            退出
        </div>
    </div>
</div>
            `);
        this.hide();
        this.root.$ac_game.append(this.$menu);
        this.$single_mode=this.$menu.find('.ac-game-menu-field-item-single-mode');
        this.$multi_mode = this.$menu.find('.ac-game-menu-field-item-multi-mode');
        this.$settings = this.$menu.find('.ac-game-menu-field-item-settings');
        

        this.start();
    }
    start(){
        this.add_listening_events();

    }

    add_listening_events(){
        let outer=this;
        this.$single_mode.click(function(){
            outer.hide();
            outer.root.playground.show("single mode");
        });
        this.$multi_mode.click(function(){
            
            outer.hide();
            outer.root.playground.show("multi mode");
        });
        this.$settings.click(function(){

            outer.root.settings.logout_on_remote();
        });
    }
    show() {  // 显示menu界面
        this.$menu.show();
    }

    hide() {  // 关闭menu界面
        this.$menu.hide();
    }

}
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
class ChatField {
    constructor(playground){
        this.playground =playground;

        this.$history=$(`<div class="ac-game-chat-field-history">好消息</div>`);
        this.$input=$(`<input type="text" class="ac-game-chat-field-input">`);

        this.$history.hide();
        this.$input.hide();
        
        this.func_id=null;
        this.playground.$playground.append(this.$history);
        this.playground.$playground.append(this.$input);
        this.start();
    }

    start(){
        this.add_listening_events();
    }

    add_listening_events(){
        let outer =this;

        this.$input.keydown(function(e){
            if(e.which===27){
                outer.hide_input();
                return false;
            } else if(e.which===13){
                let username= outer.playground.root.settings.username;
                let text=outer.$input.val();
                if(text) {
                    outer.$input.val("");

                    outer.add_message(username,text);
                    outer.playground.mps.send_message(text);
                }
                return false;
            }
        });
    }
    
    render_message(message){
        return $(`<div>${message}</div>`);
    }

    //在历史中添加信息
    add_message(username,text){
        let message=`[${username}]${text}`;
        this.show_history();
        this.$history.append(this.render_message(message));
        this.$history.scrollTop(this.$history[0].scrollHeight);
    }

    show_history(){
        this.$history.fadeIn();
        let outer =this;
        if(this.func_id) clearTimeout(this.func_id);

        this.func_id=setTimeout(function(){
            outer.$history.fadeOut();
            outer.func_id=null;
        },3000);

    }
    hide_history(){
        this.$history.hide();
    }

    show_input(){
        this.show_history();
        this.$input.show();
        this.$input.focus();
    }

    hide_input(){
        this.$input.hide();
        this.playground.game_map.$canvas.focus();
    }


}
class GameMap extends AcGameObject {
    constructor(playground){
        super();
        this.playground=playground;
        this.$canvas = $(`
        <canvas width="600" height="300" tabindex=0></canvas>
            `);
        this.ctx=this.$canvas[0].getContext('2d');
        this.ctx.canvas.width=this.playground.width;
        
        this.ctx.canvas.height=this.playground.height;
        this.playground.$playground.append(this.$canvas);
    }
    start(){
        this.$canvas.focus();
    }

    resize(){
        this.ctx.canvas.width=this.playground.width;
        this.ctx.canvas.height=this.playground.height;
        this.ctx.fillStyle="rgba(0,0,0,1)";
        this.ctx.fillRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height);
    }

    update(){
        this.render();
    }
    render(){
        this.ctx.fillStyle="rgba(0, 0, 0, 0.5)";
        this.ctx.fillRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height);
    }
}
class NoticeBoard extends AcGameObject{
    constructor(playground){
        super();
        this.playground=playground;
        this.ctx=this.playground.game_map.ctx;
        this.text="已就绪：0人";
        this.start();
    }
    start(){
    }

    write(text){
        this.text=text;
    }

    update(){
        this.render();
    }

    render(){
        
        this.ctx.font = "20px serif";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.text, this.playground.width/2, 20);
    }


}
class Particle extends AcGameObject{
    constructor(playground,x,y,r,vx,vy,color,speed,move_length){
        super();
        this.playground=playground;
        this.ctx=this.playground.game_map.ctx;
        this.x=x;
        this.y=y;
        this.r=r;
        this.vx=vx;
        this.vy=vy;
        this.color=color;
        this.speed=speed;
        this.friction=0.9;
        this.eps=0.01;
        this.move_length=move_length;
    }
    start(){
    }

    update(){
        if(this.speed<this.eps||this.move_length<this.eps){
            this.destroy();
            return false;
        }
        let moved=Math.min(this.move_length,this.speed*this.timedelta/1000);
        this.x+=this.vx*moved;
        this.y+=this.vy*moved;
        this.speed*=this.friction;
        this.move_length-=moved;
        this.render();
    }

    render(){
        let scale=this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x*scale,this.y*scale,this.r*scale,0,2*Math.PI,false);
        this.ctx.fillStyle=this.color;
        this.ctx.fill();
    }

}

class Player extends AcGameObject{
    constructor(playground,x,y,r,color,speed,type,username,photo){
        super();
        
        //console.log(character,username,photo);

        this.playground=playground;
        this.ctx=this.playground.game_map.ctx;
        this.x=x;
        this.y=y;
        this.vx=0;//x方向速度
        this.vy=0;//y方向速度
        this.damage_x=0;
        this.damage_y=0;
        this.damage_speed=0;
        this.r=r;
        this.color=color;
        this.speed=speed;
        this.type=type;
        this.eps=0.01;
        this.move_length=0; //移动的距离
        this.cur_skill=null; //当前选择的技能
        this.friction=0.9;
        this.spend_time=0; //冷静期
        this.fireballs=[];
        this.username=username;
        this.photo=photo;
        //头像
        if(this.type!=="robot"){
            this.img= new Image();
            this.img.src=this.photo;
        }

        if(this.type==="me"){
            this.fireball_coldtime =3; //秒
            this.fireball_img=new Image();
            this.fireball_img.src="https://cdn.acwing.com/media/article/image/2021/12/02/1_9340c86053-fireball.png";

            this.blink_coldtime=5;
            this.blink_img=new Image();
            this.blink_img.src="https://cdn.acwing.com/media/article/image/2021/12/02/1_daccabdc53-blink.png";
        }
    }

    start(){

        this.playground.player_count++;
        this.playground.notice_board.write("已就绪："+this.playground.player_count+"人");

        if(this.playground.player_count>=3){
            this.playground.state="fighting";
            this.playground.notice_board.write("fighting");

        }

        if(this.type==="me"){
            this.add_listening_events();
        }else if(this.type==="robot"){
            let tx=Math.random()*this.playground.width/this.playground.scale;
            let ty=Math.random()*this.playground.height/this.playground.scale;
            this.move_to(tx,ty);
        }

    }
    //监听
    add_listening_events(){
        let outer=this;
        this.playground.game_map.$canvas.on("contextmenu",function(){
            return false;
        });

        this.playground.game_map.$canvas.mousedown(function(e){

            if(outer.playground.state!=="fighting")
                return true;


            const rect=outer.ctx.canvas.getBoundingClientRect();
            if(e.which===3){
                let tx=(e.clientX-rect.left)/outer.playground.scale;
                let ty=(e.clientY-rect.top)/outer.playground.scale;
                outer.move_to(tx,ty);
                if(outer.playground.mode==="multi mode"){
                    outer.playground.mps.send_move_to(tx,ty);
                }

            }else if(e.which===1){

                let tx=(e.clientX-rect.left)/outer.playground.scale;
                let ty=(e.clientY-rect.top)/outer.playground.scale;
                if(outer.cur_skill==="fireball"){
                    if(outer.fireball_coldtime>outer.eps)
                        return false;

                    let fireball=outer.shoot_fireball(tx,ty);
                    if(outer.playground.mode==="multi mode"){
                       outer.playground.mps.send_shoot_fireball(tx,ty,fireball.uuid);
                    }
                } else if(outer.cur_skill==="blink"){

                    if(outer.blink_coldtime>outer.eps)
                        return false;
                    if(outer.playground.mode==="multi mode"){
                        outer.playground.mps.send_blink(tx,ty);
                    }

                    outer.blink(tx,ty);

                }
                outer.cur_skill=null;
            }
        });
        this.playground.game_map.$canvas.keydown(function(e){
            if(e.which===13){ //回车
                if(outer.playground.mode==="multi mode"){
                    outer.playground.chat_field.show_input();
                    return false;
                }
            } else if(e.which===27){//esc
                if(outer.playground.mode==="multi mode"){
                    outer.playground.chat_field.hide_input();
                    return false;
                }
            }

            if(outer.playground.state!=="fighting")
                return true;
           
            if(e.which===81){   //q
                if(outer.fireball_coldtime>outer.eps)
                    return true;
                outer.cur_skill="fireball";
                return false;
            }
            if(e.which===70){
                if(outer.blink_coldtime>outer.eps)
                    return true;

                outer.cur_skill="blink";
                return false;
            }

        });
    }
    //发射火球
    shoot_fireball(tx,ty){
        let x=this.x,y=this.y;
        let r=0.01;
        let angle=Math.atan2(ty-this.y,tx-this.x);
        let vx=Math.cos(angle);
        let vy=Math.sin(angle);
        let color="orange";
        let speed=0.5;
        let move_length=1;
        let damage=0.01;
        let fireball=new FireBall(this.playground,this,x,y,r,vx,vy,color,speed,move_length,damage);
        this.fireballs.push(fireball);

        this.fireball_coldtime=3;
        return fireball;
    }

    destroy_fireball(uuid){
        for(let i=0;i<this.fireballs.length;i++){
            let fireball=this.fireballs[i];
            if(fireball.uuid===uuid){
                fireball.destroy();

                break;
            }
        }
    }

    blink(tx,ty){
        let d=this.get_dist(this.x,this.y,tx,ty);
        d=Math.min(d,0.8);
        let angle=Math.atan2(ty-this.y,tx-this.x);
        this.x+=d*Math.cos(angle);
        this.y+=d*Math.sin(angle);

        this.blink_coldtime=5;
        this.move_length =0;//闪现完毕停下来
    }

    get_dist(x1,y1,x2,y2){
        let dx=(x2-x1);
        let dy=(y2-y1);
        return Math.sqrt(dx*dx+dy*dy);
    }
    //移动
    move_to(tx,ty){
        this.move_length=this.get_dist(this.x,this.y,tx,ty);
        let angle=Math.atan2(ty-this.y,tx-this.x);
        this.vx=Math.cos(angle);
        this.vy=Math.sin(angle);


    }
    //被攻击的方向和角度
    is_attacked(angle,damage){
        for(let i=0;i<10+Math.random()*5;i++){
            let x=this.x,y=this.y;
            let r=this.r*Math.random()*0.1;
            let angle=Math.PI*2*Math.random();
            let vx=Math.cos(angle);
            let vy=Math.sin(angle);
            let color=this.color
            let speed=this.speed*10;
            let move_length=this.r*Math.random()*5;
            //栗子效果
            new Particle(this.playground,x,y,r,vx,vy,color,speed,move_length);
        }

        this.r-=damage;
        if(this.r<this.eps){
            this.destroy();
            return false;
        }
        this.damage_x=Math.cos(angle);
        this.damage_y=Math.sin(angle);
        this.damage_speed=damage*100;



        this.render();

    }

    //接收被攻击信息
    receive_attack(x,y,angle,damage,ball_uuid,attacker){
        attacker.destroy_fireball(ball_uuid);
        this.x=x;
        this.y=y;
        this.is_attacked(angle,damage);
        this.destroy_fireball(ball_uuid);
    }

    update(){
        this.spend_time+=this.timedelta/1000;
        if(this.type==="me"&&this.playground.state==="fighting"){
            this.update_coldtime();
        }

        this.update_move();
        this.render();
    }

    update_coldtime(){
        this.fireball_coldtime-=this.timedelta/1000;
        this.fireball_coldtime=Math.max(0,this.fireball_coldtime);
        this.blink_coldtime-=this.timedelta/1000;
        this.blink_coldtime=Math.max(0,this.blink_coldtime);

    }

    update_move(){

        //随机发射
        if(Math.random()<1/180.0&&this.type==="robot"&&this.spend_time>5){
            let obj=this.playground.players[0];
            this.shoot_fireball(obj.x,obj.y);
        }
        //被攻击
        if(this.damage_speed>this.eps){
            this.vx=this.vy=0;
            this.move_length=0;
            this.x+=this.damage_x*this.damage_speed*this.timedelta/1000;
            this.y+=this.damage_y*this.damage_speed*this.timedelta/1000;
            this.damage_speed*=this.friction;
        }else{//移动
            if(this.move_length<this.eps){
                this.move_length=0;
                this.vx=this.vy=0;
                if(this.type==="robot"){
                    let tx=Math.random()*this.playground.width/this.playground.scale;
                    let ty=Math.random()*this.playground.height/this.playground.scale;
                    this.move_to(tx,ty);
                }

            }else{//自己移动
                let moved=Math.min(this.move_length,this.speed*this.timedelta /1000);
                this.x+=this.vx*moved;
                this.y+=this.vy*moved;
                this.move_length-=moved;
            }
        }
    }

    render(){
        let scale=this.playground.scale;
        if(this.type!=="robot"){
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.r * scale, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, this.x * scale - this.r * scale, this.y * scale - this.r * scale, this.r * 2 * scale, this.r * 2 * scale);
            this.ctx.restore();
        }else if(this.type==="robot"){
            this.ctx.beginPath();
            this.ctx.arc(this.x*scale,this.y*scale,this.r*scale,0,2*Math.PI,false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }

        if(this.type==="me" && this.playground.state==="fighting"){

            this.render_skill_coldtime();
        }
    }

    render_skill_coldtime(){
        this.render_skill_fireball_coldtime();
        this.render_skill_blink_coldtime();


    }

    render_skill_fireball_coldtime(){
        let x=1.5,y=0.9,r=0.05;
        let scale =this.playground.scale;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2 , false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.fireball_img, x * scale - r * scale, y * scale - r * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();
        if(this.fireball_coldtime>0){
            this.ctx.beginPath();
            this.ctx.moveTo(x*scale,y*scale);
            this.ctx.arc(x*scale,y*scale,r*scale,0-Math.PI/2,2*Math.PI*(1-this.fireball_coldtime/3)-Math.PI/2,true);
            this.ctx.lineTo(x*scale,y*scale);
            this.ctx.fillStyle = "rgba(0,0,255,0.5)";
            this.ctx.fill();
        }  
    }

    render_skill_blink_coldtime(){
        let x=1.62,y=0.9,r=0.05;
        let scale =this.playground.scale;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2 , false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.blink_img, x * scale - r * scale, y * scale - r * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();
        if(this.blink_coldtime>0){
            this.ctx.beginPath();
            this.ctx.moveTo(x*scale,y*scale);
            this.ctx.arc(x*scale,y*scale,r*scale,0-Math.PI/2,2*Math.PI*(1-this.blink_coldtime/5)-Math.PI/2,true);
            this.ctx.lineTo(x*scale,y*scale);
            this.ctx.fillStyle = "rgba(0,0,255,0.5)";
            this.ctx.fill();
        }  

    }

    on_destroy(){
        if(this.type==="me"){
            this.playground.state="over";
        }

        for(let i=0;i<this.playground.players.length;i++){
            if(this.playground.players[i]===this){
                this.playground.players.splice(i,1);
                break;
            }
        }
    }
}

class FireBall extends AcGameObject{
    constructor(playground,player,x,y,r,vx,vy,color,speed,move_length,damage){
        super();
        this.playground=playground;
        this.player=player;
        this.ctx=this.playground.game_map.ctx;
        this.x=x;
        this.y=y;
        this.r=r;
        this.vx=vx;
        this.vy=vy;
        this.color=color;
        this.speed=speed;
        this.move_length=move_length;
        this.eps=0.01;
        this.damage=damage;
    }
    start(){
    }

    update(){
        if(this.move_length<this.eps){
            this.destroy();
            return false;
        }
        this.updata_move();
        if(this.player.type!=="enemy"){
            //每个人都只在自己的端口判断是否击中
            this.updata_attack();
        }
        this.render();
    }

    updata_move(){
        let moved=Math.min(this.move_length,this.speed*this.timedelta /1000);
        this.x+=this.vx*moved;
        this.y+=this.vy*moved;
        this.move_length-=moved;
    }
    
    updata_attack(){
        for(let i=0;i<this.playground.players.length;i++){
            let obj=this.playground.players[i];
            if(this.player!==obj && this.is_collision(obj)){
                this.attack(obj);
                break;
            }
        }
    }

    get_dist(x1,y1,x2,y2){
        let dx=x2-x1;
        let dy=y2-y1;
        return Math.sqrt(dx*dx+dy*dy);
    }

    is_collision(player){
        let distance=this.get_dist(this.x,this.y,player.x,player.y);
        if(distance<this.r+player.r){
           return true;
        }
        return false;
    }

    attack(player){
        let angle=Math.atan2(player.y-this.y,player.y-this.x);
        player.is_attacked(angle,this.damage);

        if(this.playground.mode==="multi mode"){
            this.playground.mps.send_attack(player.uuid,player.x,player.y,angle,this.damage,this.uuid);
        }

        this.destroy();
        
    }
    
    render(){
        let scale=this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x*scale,this.y*scale,this.r*scale,0,2*Math.PI,false);
        this.ctx.fillStyle=this.color;
        this.ctx.fill();
    }

    on_destroy(){
        let fireballs=this.player.fireballs;
        for(let i=0;i<fireballs.length;i++){
            if(fireballs[i]===this){
                fireballs.splice(i,1);
                break;
            }
        }
    }

}
class MultiPlayerSocket{
    constructor(playground){
        this.playground=playground;
        this.ws=new WebSocket("wss://app2295.acapp.acwing.com.cn/wss/multiplayer/");

        this.start();
    }
    start(){
        this.receive();
        
    }
    get_player(uuid){
        let players=this.playground.players;
        for(let i=0;i<players.length;i++){
            let player=players[i];
            if(player.uuid===uuid){
                return player;
            }
        }
        return null;
    }

    send_create_player(username,photo){
        let outer= this;
        this.ws.send(JSON.stringify({
            'event':"create_player",
            'uuid':outer.uuid,
            'username':username,
            'photo':photo,
        }));
    }

    send_move_to(tx,ty){
        let outer=this;
        
        this.ws.send(JSON.stringify({
            'event':"move_to",
            'uuid':outer.uuid,
            'tx':tx,
            'ty':ty,
        }));
    }

    send_shoot_fireball(tx,ty,ball_uuid){

        let outer=this;

        this.ws.send(JSON.stringify({
            'event':"shoot_fireball",
            'uuid':outer.uuid,
            'tx':tx,
            'ty':ty,
            'ball_uuid':ball_uuid,
        }));
    }

    send_attack(attacked_uuid,x,y,angle,damage,ball_uuid){
        let outer=this;

        this.ws.send(JSON.stringify({
            'event':"attack",
            'uuid':outer.uuid,
            'attacked_uuid':attacked_uuid,
            'x':x,
            'y':y,
            'angle':angle,
            'damage':damage,
            'ball_uuid':ball_uuid,
        }));
    }

    send_blink(tx,ty){
        let outer=this;

        this.ws.send(JSON.stringify({
            'event':"blink",
            'uuid':outer.uuid,
            'tx':tx,
            'ty':ty,
        }));
    }

    send_message(text){
        let outer=this;
        this.ws.send(JSON.stringify({
            'event':"message",
            'uuid':outer.uuid,
            'text':text,
        }));
    }
    receive(){
        let outer =this;
        this.ws.onmessage = function(e){
            let data=JSON.parse(e.data);
            let uuid =data.uuid;
            if(uuid===outer.uuid) return false;

            let event=data.event;
            if(event==="create_player"){
                outer.receive_create_player(uuid,data.username,data.photo);
            } else if(event==="move_to"){
                outer.receive_move_to(uuid,data.tx,data.ty);
            } else if(event==="shoot_fireball"){
                outer.receive_shoot_fireball(uuid,data.tx,data.ty,data.ball_uuid);
            } else if(event==="attack"){
                outer.receive_attack(uuid,data.attacked_uuid,data.x,data.y,data.angle,data.damage,data.ball_uuid);
            } else if(event==="blink"){
                outer.receive_blink(uuid,data.tx,data.ty);
            } else if(event==="message"){
                outer.receive_message(uuid,data.text);
            }
        };
    }

    receive_move_to(uuid,tx,ty){

        let player=this.get_player(uuid);

        if(player) {
            player.move_to(tx,ty);
        }

    }
    receive_shoot_fireball(uuid,tx,ty,ball_uuid){
        let player=this.get_player(uuid);
        if(player){
            let fireball=player.shoot_fireball(tx,ty);
            fireball.uuid=ball_uuid;
        }
    }

    receive_create_player(uuid,username,photo){
        let player=new Player(
            this.playground,
            this.playground.width/2/this.playground.scale,
            0.5,
            0.05,
            "white",
            0.15,
            "enemy",
            username,
            photo,
        );
        player.uuid=uuid;
        this.playground.players.push(player);
        
    }

    receive_attack(uuid,attacked_uuid,x,y,angle,damage,ball_uuid){
        let attacker=this.get_player(uuid);
        let attacked=this.get_player(attacked_uuid);
        if(attacker && attacked){
            attacked.receive_attack(x,y,angle,damage,ball_uuid,attacker);
        }
    }
    receive_blink(uuid,tx,ty){
        let player=this.get_player(uuid);
        if(player){
            player.blink(tx,ty);
        }

    }
    receive_message(uuid,text){
        let player=this.get_player(uuid);
        if(player){
            this.playground.chat_field.add_message(player.username,text);
        }
    }

}
class AcGamePlayground {
    constructor(root){
        this.root=root;
        this.$playground=$(`
        <div class="ac-game-playground"></div>
            `);
        this.hide();
        this.root.$ac_game.append(this.$playground);
        this.start();
    }

    get_random_color(){
        let colors=["blue","red","pink","yellow","green"];
        return colors[Math.floor(Math.random()*5)];
    }

    start() {
        let outer=this;
        $(window).resize(function(){
            outer.resize();
        });
    }


    resize(){
        this.width=this.$playground.width();
        this.height=this.$playground.height();
        let unit =Math.min(this.width/16,this.height/9);
        this.width=unit*16;
        this.height=unit*9;
        this.scale=this.height;//基准 随着窗口变化

        if(this.game_map) this.game_map.resize();

    }

    show(mode){  // 打开playground界面
        let outer=this;
        this.$playground.show();
        this.width=this.$playground.width();
        this.height=this.$playground.height();
        this.scale=this.height;
        this.game_map= new GameMap(this);
        this.resize();
        this.players=[];
        this.players.push(new Player(this,this.width/2/this.scale,0.5,0.05,"white",0.15,"me",this.root.settings.username,this.root.settings.photo));
        this.mode=mode;
        this.state="waiting"; //等待-开始-结束
        this.notice_board=new NoticeBoard(this);
        this.player_count =0;

        if(this.mode==="single mode"){
            for(let i=0;i<5;i++){
                this.players.push(new Player(this,this.width/2/this.scale,0.5,0.05,this.get_random_color(),0.15,"robot"));
            }
        }else if(this.mode==="multi mode"){
            this.chat_field= new ChatField(this);
            this.mps=new MultiPlayerSocket(this);
            this.mps.uuid=this.players[0].uuid;

            this.mps.ws.onopen = function(){
                outer.mps.send_create_player(outer.root.settings.username,outer.root.settings.photo);
            };
        }
    }

    hide() {  // 关闭playground界面
        this.$playground.hide();
    }

}
class Settings{
    constructor(root){
        this.root=root;
        this.platform="WEB";
        if(this.root.AcWingOS) this.platform="ACAPP";
        this.username="";
        this.photo="";

        this.$settings=$(`
<div class="ac-game-settings">
    <div class="ac-game-settings-login">
        <div class="ac-game-settings-title">
            登录
        </div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>登录</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message">
        </div>
        <div class="ac-game-settings-option">
            注册
        </div>
        <br>
        <div class="ac-game-settings-acwing">
            <img width="20" src="https://app2295.acapp.acwing.com.cn/static/image/settings/acwing_logo.png">
            <br>

            <div class="ac-game-settings-acwing-item">
                ac登录
            </div>

        </div>
    </div>

    <div class="ac-game-settings-register">
        <div class="ac-game-settings-title">
            注册
        </div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-first">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-second">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="确认密码">
            </div>
        </div>

        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>注册</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message">
        </div>
        <div class="ac-game-settings-option">
            登录
        </div>
        <br>
        <div class="ac-game-settings-acwing">
            <img width="20" src="https://app2295.acapp.acwing.com.cn/static/image/settings/acwing_logo.png">
            <br>
            <div class="ac-game-settings-acwing-item">
                ac登录
            </div>
        </div>
    </div>
</div>
`);
        this.$login=this.$settings.find(".ac-game-settings-login");
        this.$login_username=this.$settings.find(".ac-game-settings-username input");
        this.$login_password=this.$settings.find(".ac-game-settings-password input");
        this.$login_submit = this.$login.find(".ac-game-settings-submit button"); // 提交按钮
        this.$login_error_message = this.$login.find(".ac-game-settings-error-message"); // 错误信息
        this.$login_register = this.$login.find(".ac-game-settings-option"); // 注册选项
        

        this.$login.hide();

        this.$register=this.$settings.find(".ac-game-settings-register");

        this.$register_username = this.$register.find(".ac-game-settings-username input"); 
        this.$register_password = this.$register.find(".ac-game-settings-password-first input"); 
        this.$register_password_confirm = this.$register.find(".ac-game-settings-password-second input"); // 确认密码输入框
        this.$register_submit = this.$register.find(".ac-game-settings-submit button");
        this.$register_error_message = this.$register.find(".ac-game-settings-error-message");
        this.$register_login = this.$register.find(".ac-game-settings-option"); // 登陆选项

        this.$acwing_login=this.$settings.find(".ac-game-settings-acwing img"); //第三方登录

        this.$register.hide();
        this.root.$ac_game.append(this.$settings);
        this.start();
    }

    start(){
        if(this.platform==="WEB"){
            this.getinfo_web();
            this.add_listening_events();
        }else{
            this.getinfo_acapp();
        }
    }

    
    add_listening_events(){
        let outer =this;
        this.add_listening_events_login();
        this.add_listening_events_register();
        this.$acwing_login.click(function(){
            outer.acwing_login();
        });
    }
    add_listening_events_login(){
        let outer=this;
        this.$login_register.click(function(){
            outer.register();
        });
        this.$login_submit.click(function(){
            outer.login_on_remote();
        });
    }
     
    add_listening_events_register(){
        let outer=this;
        this.$register_login.click(function(){
            outer.login();
        });
        this.$register_submit.click(function(){
            outer.register_on_remote();
        });
      
    }
    
    acwing_login(){
        $.ajax({
            url:"https://app2295.acapp.acwing.com.cn/settings/acwing/web/apply_code",
            type:"GET",
            success:function(resp){
                if(resp.result==="success"){
                    window.location.replace(resp.apply_code_url);
                }
            },
        });

    }

    login_on_remote(){ //登录
        let username=this.$login_username.val();
        let password=this.$login_password.val();
        this.$login_error_message.empty();
        let outer=this;
        $.ajax({
            url:"https://app2295.acapp.acwing.com.cn/settings/login/",
            type:"GET",
            data:{
                username:username,
                password:password,
            },
            success:function(resp){
                
                if(resp.result==="success"){
                    location.reload();
                }else{
                    outer.$login_error_message.html(resp.result);
                }
            },
        });
    }

    register_on_remote(){ //注册
        let outer=this;
        let username=this.$register_username.val();
        let password=this.$register_password.val();
        let password_confirm=this.$register_password_confirm.val();
        this.$register_error_message.empty();
        
        $.ajax({
            url:"https://app2295.acapp.acwing.com.cn/settings/register/",
            type:"GET",
            data:{
                username:username,
                password:password,
                password_confirm:password_confirm,
            },
            success:function(resp){

                if(resp.result==="success"){
                    location.reload();
                }else{
                    outer.$register_error_message.html(resp.result);
                }
            }
        });
    }
    logout_on_remote(){ //登出
        if(this.platform==="ACAPP"){
            this.root.AcWingOS.api.window.close();
        } else {
            $.ajax({
                url:"https://app2295.acapp.acwing.com.cn/settings/logout/",
                type:"GET",
                success:function(resp){
                
                    if(resp.result==="success"){
                        location.reload();
                    }
                },
            });
        }
    }

    acapp_login(appid,redirect_uri,scope,state){
        let outer=this;
        this.root.AcWingOS.api.oauth2.authorize(appid, redirect_uri, scope, state, function(resp){
            
            if(resp.result==="success"){
                outer.username=resp.username;
                outer.photo=resp.photo;
                outer.hide();
                outer.root.menu.show();
            }
        
        });
    }

    getinfo_acapp(){
        let outer=this;
        $.ajax({
            url:"https://app2295.acapp.acwing.com.cn/settings/acwing/acapp/apply_code",
            type:"GET",
            success:function(resp){
                
                if(resp.result==="success"){
                    outer.acapp_login(resp.appid,resp.redirect_uri,resp.scope,resp.state);
                }
            },
        });
    }

    getinfo_web(){
        let outer=this;

        $.ajax({
            url:"https://app2295.acapp.acwing.com.cn/settings/getinfo/",
            type:"GET",
            data:{
                platform:outer.platform,
            },
            success:function(resp){
           
                if(resp.result==="success"){
                    outer.username=resp.username;
                    outer.photo=resp.photo;
                    outer.hide();
                    outer.root.menu.show();
                }else{
                    outer.login();
                }
            },
        })
    }
    register(){ //注册界面
        this.$login.hide();
        this.$register.show();
    }

    login(){//打开登录页面
        this.$register.hide();
        this.$login.show();
    }
    hide(){
        this.$settings.hide();
    }

    show(){
        this.$settings.show();
    }
}
export class AcGame {
        constructor(id,AcWingOS) {
            this.id = id;
            this.AcWingOS=AcWingOS;
            this.$ac_game = $('#' + id);
            this.settings = new Settings(this);
            this.menu = new AcGameMenu(this);
            this.playground = new AcGamePlayground(this);
            this.start();
        }

        start() {


        }
}
