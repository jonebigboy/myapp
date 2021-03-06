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
        console.log(damage);
        this.r-=damage;
        console.log(this.r);
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
        //this.destroy_fireball(ball_uuid);
    }

    update(){
        this.spend_time+=this.timedelta/1000;
        this.update_win();
        if(this.type==="me"&&this.playground.state==="fighting"){
            this.update_coldtime();
        }

        this.update_move();
        this.render();
    }
    //判断是否胜利
    update_win(){
        if(this.playground.state==="fighting" && this.type==="me" && this.playground.players.length ===1){
            this.playground.state="over";
            this.playground.score_board.win();
        }
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
            this.playground.state="over";//自己被删除了失败了
            this.playground.score_board.lose();

        }

        for(let i=0;i<this.playground.players.length;i++){
            if(this.playground.players[i]===this){
                this.playground.players.splice(i,1);
                break;
            }
        }
    }
}

