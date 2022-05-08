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
            设置
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
            outer.root.playground.show();
        });
        this.$multi_mode.click(function(){
            console.log("click multi mode");
        });
        this.$settings.click(function(){
            console.log("click settings");
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
class GameMap extends AcGameObject {
    constructor(playground){
        super();
        this.playground=playground;
        this.$canvas = $(`
        <canvas width="600" height="300"></canvas>
            `);
        this.ctx=this.$canvas[0].getContext('2d');
        this.ctx.canvas.width=this.playground.width;
        
        this.ctx.canvas.height=this.playground.height;
        this.playground.$playground.append(this.$canvas);
    }
    start(){
    }

    update(){
        this.render();
    }
    render(){
        this.ctx.fillStyle="rgba(0, 0, 0, 0.5)";
        this.ctx.fillRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height);
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
        this.eps=1;
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
        this.ctx.beginPath();
        this.ctx.arc(this.x,this.y,this.r,0,2*Math.PI,false);
        this.ctx.fillStyle=this.color;
        this.ctx.fill();
    }

}

class Player extends AcGameObject{
    constructor(playground,x,y,r,color,speed,is_me){
        super();
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
        this.is_me=is_me;
        this.eps=0.1;
        this.move_length=0; //移动的距离
        this.cur_skill=null; //当前选择的技能
        this.friction=0.9;
        this.spend_time=0; //冷静期
        //头像
        if(this.is_me){
            this.img= new Image();
            this.img.src=this.playground.root.settings.photo;
        }
    }
    start(){
        if(this.is_me){
            this.add_listening_events();
        }else{
            let tx=Math.random()*this.playground.width;
            let ty=Math.random()*this.playground.height;
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
            const rect=outer.ctx.canvas.getBoundingClientRect();
            if(e.which===3){
                outer.move_to(e.clientX-rect.left,e.clientY-rect.top);
            }else if(e.which===1){
                if(outer.cur_skill==="fireball"){
                    outer.shoot_fireball(e.clientX-rect.left,e.clientY-rect.top);
                }
                outer.cur_skill=null;
            }
        });
        $(window).keydown(function(e){
            if(e.which===81){   //q
                outer.cur_skill="fireball";
                return false;
            }
        });
    }
    //发射火球
    shoot_fireball(tx,ty){
        let x=this.x,y=this.y;
        let r=this.playground.height*0.01;
        let angle=Math.atan2(ty-this.y,tx-this.x);
        let vx=Math.cos(angle);
        let vy=Math.sin(angle);
        let color="orange";
        let speed=this.playground.height*0.5;
        let move_length=this.playground.height*1;
        let damage=this.playground.height*0.01;
        new FireBall(this.playground,this,x,y,r,vx,vy,color,speed,move_length,damage);


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
        if(this.r<10){
            this.destroy();
            return false;
        }
        this.damage_x=Math.cos(angle);
        this.damage_y=Math.sin(angle);
        this.damage_speed=damage*100;



        this.render();

    }

    update(){
        this.spend_time+=this.timedelta/1000;
        //敌人发射火球
        if(Math.random()<1/180.0&&!this.is_me&&this.spend_time>5){
            let obj=this.playground.players[0];
            this.shoot_fireball(obj.x,obj.y);
        }

        //被撞击
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
                if(!this.is_me){
                    let tx=Math.random()*this.playground.width;
                    let ty=Math.random()*this.playground.height;
                    this.move_to(tx,ty);
                }

            }else{//自己移动
                let moved=Math.min(this.move_length,this.speed*this.timedelta /1000);
                this.x+=this.vx*moved;
                this.y+=this.vy*moved;
                this.move_length-=moved;
            }
        }
        this.render();
    }
    render(){
        if(this.is_me){
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);
            this.ctx.restore();
        }else{
            this.ctx.beginPath();
            this.ctx.arc(this.x,this.y,this.r,0,2*Math.PI,false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }
    }

    on_destroy(){
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
        this.eps=0.1;
        this.damage=damage;
    }
    start(){
    }

    update(){
        if(this.move_length<5){
            this.destroy();
            return false;
        }
        let moved=Math.min(this.move_length,this.speed*this.timedelta /1000);
        this.x+=this.vx*moved;
        this.y+=this.vy*moved;
        this.move_length-=moved;

        for(let i=0;i<this.playground.players.length;i++){
            let obj=this.playground.players[i];
            if(this.player!==obj && this.is_collision(obj)){
                this.attack(obj);
            }
        }

        this.render();
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
        this.destroy();
        
    }
    
    render(){
        this.ctx.beginPath();
        this.ctx.arc(this.x,this.y,this.r,0,2*Math.PI,false);
        this.ctx.fillStyle=this.color;
        this.ctx.fill();
    }

}
class AcGamePlayground {
    constructor(root){
        this.root=root;
        this.$playground=$(`
        <div class="ac-game-playground"></div>
            `);
        this.hide();

        this.start();
    }

    get_random_color(){
        let colors=["blue","red","pink","yellow","green"];
        return colors[Math.floor(Math.random()*5)];
    }
    
    start() {


    }

    show(){  // 打开playground界面
        this.$playground.show();
        this.root.$ac_game.append(this.$playground);
        this.width=this.$playground.width();
        this.height=this.$playground.height();

        this.game_map= new GameMap(this);
        this.players=[];
        this.players.push(new Player(this,this.width/2,this.height/2,this.height*0.05,"white",this.height*0.15,true));

        for(let i=0;i<5;i++){
            this.players.push(new Player(this,this.width/2,this.height/2,this.height*0.05,this.get_random_color(),this.height*0.15,false));
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

        this.$register_username = this.$register.find(".ac-game-settings-register input"); 
        this.$register_password = this.$register.find(".ac-game-settings-password-first input"); 
        this.$register_password_confirm = this.$register.find(".ac-game-settings-password-second input"); // 确认密码输入框
        this.$register_submit = this.$register.find(".ac-game-settings-submit button");
        this.$register_error_message = this.$register.find(".ac-game-settings-error-message");
        this.$register_login = this.$register.find(".ac-game-settings-option"); // 登陆选项



        this.$register.hide();
        this.root.$ac_game.append(this.$settings);
        this.start();
    }

    start(){
        this.getinfo();
        this.add_listening_events();
    }
    
    add_listening_events(){
        this.add_listening_events_login();
        this.add_listening_events_register();
    }
    add_listening_events_login(){
        let outer=this;
        this.$login_register.click(function(){
            outer.register();
        });
    }
    
    add_listening_events_register(){
        let outer=this;
        this.$register_login.click(function(){
            outer.login();
        });
    }

    getinfo(){
        let outer=this;

        $.ajax({
            url:"https://app2295.acapp.acwing.com.cn/settings/getinfo/",
            type:"GET",
            data:{
                platform:outer.platform,
            },
            success:function(resp){
                console.log(resp);
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
