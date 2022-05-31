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
        this.username=username;
        this.photo=photo;
        //头像
        if(this.type!=="robot"){
            this.img= new Image();
            this.img.src=this.photo;
        }
    }
    start(){
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
            const rect=outer.ctx.canvas.getBoundingClientRect();
            if(e.which===3){
                outer.move_to((e.clientX-rect.left)/outer.playground.scale,(e.clientY-rect.top)/outer.playground.scale);
            }else if(e.which===1){
                if(outer.cur_skill==="fireball"){
                  
                    outer.shoot_fireball((e.clientX-rect.left)/outer.playground.scale,(e.clientY-rect.top)/outer.playground.scale);
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
        let r=0.01;
        let angle=Math.atan2(ty-this.y,tx-this.x);
        let vx=Math.cos(angle);
        let vy=Math.sin(angle);
        let color="orange";
        let speed=0.5;
        let move_length=1;
        let damage=0.01;
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
        if(this.r<this.eps){
            this.destroy();
            return false;
        }
        this.damage_x=Math.cos(angle);
        this.damage_y=Math.sin(angle);
        this.damage_speed=damage*100;



        this.render();

    }

    update(){
        this.update_move();
        this.render();
    }

    update_move(){
        this.spend_time+=this.timedelta/1000;
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

