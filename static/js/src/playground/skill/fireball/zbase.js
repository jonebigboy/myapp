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