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
