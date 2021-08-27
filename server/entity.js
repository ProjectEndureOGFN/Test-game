
var PF = require('pathfinding');

addToChat = function(color,message,debug){
    var d = new Date();
    var m = '' + d.getMinutes();
    var h = d.getHours() + 24;
    if(SERVER !== 'localhost'){
        h -= 4;
    }
    h = h % 24;
    h = '' + h;
    if(m.length === 1){
        m = '' + 0 + m;
    }
    if(m === '0'){
        m = '00';
    }
    console.error("[" + h + ":" + m + "] " + message);
    for(var i in Player.list){
        SOCKET_LIST[i].emit('addToChat',{
            color:color,
            message:message,
        });
    }
}

var playerMap = {};

tiles = [];

var monsterData = require('./../client/data/monsters.json');
var projectileData = require('./../client/data/projectiles.json');

require('./../client/inventory.js');

spawnMonster = function(spawner,spawnId){
    var monster = new Monster({
        spawnId:spawnId,
        x:spawner.x,
        y:spawner.y,
        map:spawner.map,
        monsterType:spawner.spawnId,
        onDeath:function(pt){
            if(pt.spawnId){
                Spawner.list[pt.spawnId].spawned = false;
            }
            for(var i in Projectile.list){
                if(Projectile.list[i].parent === pt.id){
                    Projectile.list[i].toRemove = true;
                }
            }
        },
    });
    spawner.spawned = true;
}

Entity = function(param){
    var self = {};
    self.id = Math.random();
    self.x = 0;
    self.y = 0;
    self.width = 0;
    self.heigth = 0;
    self.direction = 0;
    self.spdX = 0;
    self.spdY = 0;
    self.map = 'World';
    self.toRemove = false;
    self.type = 'Entity';
    if(param){
        if(param.id){
            self.id = param.id;
        }
        if(param.x){
            self.x = param.x;
        }
        if(param.y){
            self.y = param.y;
        }
        if(param.spdX){
            self.spdX = param.spdX;
        }
        if(param.spdY){
            self.spdY = param.spdY;
        }
        if(param.width){
            self.width = param.width;
        }
        if(param.height){
            self.height = param.height;
        }
        if(param.direction){
            self.direction = param.direction;
        }
        if(param.map){
            self.map = param.map;
        }
    }
    self.update = function(){
        self.updatePosition();
        self.x = Math.round(self.x);
        self.y = Math.round(self.y);
    }
    self.updatePosition = function(){
        self.x += self.spdX;
        self.y += self.spdY;
    }
	self.getDistance = function(pt){
		return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
    }
    self.isColliding = function(pt){
        if(pt.map !== self.map){
            return false;
        }
        if(self.type !== 'Projectile' && pt.type !== 'Projectile'){
            if(pt.x + pt.width / 2 <= self.x - self.width / 2){
                return false;
            }
            if(pt.x - pt.width / 2 >= self.x + self.width / 2){
                return false;
            }
            if(pt.y + pt.height / 2 <= self.y - self.height / 2){
                return false;
            }
            if(pt.y - pt.height / 2 >= self.y + self.height / 2){
                return false;
            }
            return true;
        }
        else{
            var vertices = [
                {x:(self.width / 2) * Math.cos(self.direction / 180 * Math.PI) - (self.height / 2) * Math.sin(self.direction / 180 * Math.PI) + self.x,y:(self.width / 2) * Math.sin(self.direction / 180 * Math.PI) + (self.height / 2) * Math.cos(self.direction / 180 * Math.PI) + self.y},
                {x:(self.width / 2) * Math.cos(self.direction / 180 * Math.PI) - (-self.height / 2) * Math.sin(self.direction / 180 * Math.PI) + self.x,y:(self.width / 2) * Math.sin(self.direction / 180 * Math.PI) + (-self.height / 2) * Math.cos(self.direction / 180 * Math.PI) + self.y},
                {x:(-self.width / 2) * Math.cos(self.direction / 180 * Math.PI) - (-self.height / 2) * Math.sin(self.direction / 180 * Math.PI) + self.x,y:(-self.width / 2) * Math.sin(self.direction / 180 * Math.PI) + (-self.height / 2) * Math.cos(self.direction / 180 * Math.PI) + self.y},
                {x:(-self.width / 2) * Math.cos(self.direction / 180 * Math.PI) - (self.height / 2) * Math.sin(self.direction / 180 * Math.PI) + self.x,y:(-self.width / 2) * Math.sin(self.direction / 180 * Math.PI) + (self.height / 2) * Math.cos(self.direction / 180 * Math.PI) + self.y},
                {x:self.x,y:self.y},
            ];
            var vertices2 = [
                {x:pt.x + pt.width / 2,y:pt.y + pt.height / 2},
                {x:pt.x + pt.width / 2,y:pt.y - pt.height / 2},
                {x:pt.x - pt.width / 2,y:pt.y - pt.height / 2},
                {x:pt.x - pt.width / 2,y:pt.y + pt.height / 2},
            ];
            var getSlope = function(pt1,pt2){
                return (pt2.y - pt1.y) / (pt2.x - pt1.x);
            }
            for(var i = 0;i < 4;i++){
                if(vertices2[i].y - vertices[0].y < getSlope(vertices[0],vertices[1]) * (vertices2[i].x - vertices[0].x)){
                    if(vertices2[i].y - vertices[1].y > getSlope(vertices[1],vertices[2]) * (vertices2[i].x - vertices[1].x)){
                        if(vertices2[i].y - vertices[2].y > getSlope(vertices[2],vertices[3]) * (vertices2[i].x - vertices[2].x)){
                            if(vertices2[i].y - vertices[3].y < getSlope(vertices[3],vertices[0]) * (vertices2[i].x - vertices[3].x)){
                                return true;
                            }
                        }
                    }
                }
                if(vertices[i].x > vertices2[2].x && vertices[i].x < vertices2[0].x && vertices[i].y > vertices2[2].y && vertices[i].y < vertices2[0].y){
                    return true;
                }
            }
            if(vertices[4].x > vertices2[2].x && vertices[4].x < vertices2[0].x && vertices[4].y > vertices2[2].y && vertices[4].y < vertices2[0].y){
                return true;
            }
            return false;
        }
    }
    return self;
}

require('./collision');

Actor = function(param){
    var self = Entity(param);
    self.hp = 0;
    self.hpMax = 0;
    self.stats = {
        damage:0,
        defense:0,
        hpRegen:0,
        manaRegen:0,
        critChance:0,
    };

    self.animate = true;
    self.animation = 0;
    self.animationDirection = "down";

    self.invincible = false;
    self.mapChange = 11;
    self.transporter = null;
    self.canMove = true;

    self.trackingEntity = null;
    self.trackingPos = {x:null,y:null};
    self.trackingPath = [];
    self.trackDistance = 0;
    self.trackCircleDirection = 1;
    self.trackTime = 100;

    self.drawSize = 'medium';

    self.name = param.name || 'null';

    self.maxSpeed = 10;
    self.moveSpeed = 10;

    self.randomPos = {
        walking:false,
        x:0,
        y:0,
        directionX:0,
        directionY:0,
        timeX:0,
        timeY:0,
        walkTimeX:100,
        walkTimeY:100,
        waitTimeX:60,
        waitTimeY:60,
    };

    self.justCollided = false;

    if(param.onDeath){
        self.onDeath = param.onDeath;
    }
    else{
        self.onDeath = function(pt){
            for(var i in Projectile.list){
                if(Projectile.list[i].parent === pt.id){
                    Projectile.list[i].toRemove = true;
                }
            }
        }
    }
    self.updateMove = function(){
        self.lastX = self.x;
        self.lastY = self.y;
        if(self.trackingEntity){
            self.spdX = 0;
            self.spdY = 0;
            if(self.getDistance(self.trackingEntity) > self.trackDistance * 1.2){
                var size = 33;
                var dx = Math.floor(self.x / 64) - size / 2 + 0.5;
                var dy = Math.floor(self.y / 64) - size / 2 + 0.5;
                var trackX = Math.floor(self.trackingEntity.x / 64) - dx;
                var trackY = Math.floor(self.trackingEntity.y / 64) - dy;
                self.trackTime += 1;
                if(trackX !== self.trackingPos.x || trackY !== self.trackingPos.y){
                    if(self.trackTime > 50 + 50 * Math.random()){
                        self.trackTime = 0;
                        self.trackingPos.x = trackX;
                        self.trackingPos.y = trackY;
                        var finder = new PF.BiAStarFinder({
                            allowDiagonal:true,
                            dontCrossCorners:true,
                        });
                        var grid = new PF.Grid(size,size);
                        for(var i = 0;i < size;i++){
                            for(var j = 0;j < size;j++){
                                var x = dx * 64 + i * 64;
                                var y = dy * 64 + j * 64;
                                if(Collision.list[self.map + ':' + x + ':' + y + ':']){
                                    grid.setWalkableAt(i,j,false);
                                }
                            }
                        }
                        var nx = Math.floor(self.x / 64) - dx;
                        var ny = Math.floor(self.y / 64) - dy;
                        if(nx < size && nx > 0 && ny < size && ny > 0 && trackX < size && trackX > 0 && trackY < size && trackY > 0){
                            var path = finder.findPath(nx,ny,trackX,trackY,grid);
                            if(path[0]){
                                self.trackingPath = PF.Util.compressPath(path);
                                for(var i in self.trackingPath){
                                    self.trackingPath[i][0] += dx;
                                    self.trackingPath[i][1] += dy;
                                }
                                self.trackingPath.shift();
                            }
                        }
                    }
                }
                if(self.trackingPath[0]){
                    if(self.x / 64 < self.trackingPath[0][0] + 0.5){
                        self.spdX = 1;
                    }
                    if(self.x / 64 > self.trackingPath[0][0] + 0.5){
                        self.spdX = -1;
                    }
                    if(self.y / 64 < self.trackingPath[0][1] + 0.5){
                        self.spdY = 1;
                    }
                    if(self.y / 64 > self.trackingPath[0][1] + 0.5){
                        self.spdY = -1;
                    }
                    if(64 * Math.abs(self.x / 64 - self.trackingPath[0][0] - 0.5) < 2 && 64 * Math.abs(self.y / 64 - self.trackingPath[0][1] - 0.5) < 2){
                        self.trackingPath.shift();
                    }
                }
            }
            else if(self.trackDistance !== 0){
                var angle = Math.atan2(self.y - self.trackingEntity.y,self.x - self.trackingEntity.x);
                self.spdX = -Math.sin(angle);
                self.spdY = Math.cos(angle);
                if(self.justCollided === true){
                    self.trackCircleDirection *= -1;
                }
                self.spdX *= self.trackCircleDirection;
                self.spdY *= self.trackCircleDirection;
                self.spdX += Math.cos(angle) * (self.trackDistance - self.getDistance(self.trackingEntity)) / self.trackDistance * 2;
                self.spdY += Math.sin(angle) * (self.trackDistance - self.getDistance(self.trackingEntity)) / self.trackDistance * 2;
            }
        }
        else if(self.randomPos.walking){
            if(self.spdX === 0 && self.randomPos.timeX > self.randomPos.walkTimeX){
                self.spdX = Math.round(Math.random() * 2 - 1);
                self.randomPos.timeX = 0;
                self.randomPos.waitTimeX = 100 * Math.random() + 100;
            }
            else if(self.spdX !== 0 && self.randomPos.timeX > self.randomPos.waitTimeX){
                self.spdX = 0;
                self.randomPos.timeX = 0;
                self.randomPos.walkTimeX = 200 * Math.random() + 200;
            }
            if(self.spdY === 0 && self.randomPos.timeY > self.randomPos.walkTimeY){
                self.spdY = Math.round(Math.random() * 2 - 1);
                self.randomPos.timeY = 0;
                self.randomPos.waitTimeY = 100 * Math.random() + 100;
            }
            else if(self.spdY !== 0 && self.randomPos.timeY > self.randomPos.waitTimeY){
                self.spdY = 0;
                self.randomPos.timeY = 0;
                self.randomPos.walkTimeY = 200 * Math.random() + 200;
            }
            self.randomPos.timeX += 1;
            self.randomPos.timeY += 1;
            if(Math.abs(self.x - self.randomPos.x) > 256){
                self.spdX = -1 * Math.abs(self.x - self.randomPos.x) / (self.x - self.randomPos.x);
            }
            if(Math.abs(self.y - self.randomPos.y) > 256){
                self.spdY = -1 * Math.abs(self.y - self.randomPos.y) / (self.y - self.randomPos.y);
            }
        }
        // if(self.pushPt !== null && self.invincible === false){
        //     var pushPower = self.pushPt.pushPower * (Math.random() + 1);
        //     if(pushPower !== 0){
        //         self.moveSpeed = pushPower * 5 * (1 - self.pushResist);
        //         self.spdX += self.pushPt.spdX / 6 * (1 - self.pushResist);
        //         self.spdY += self.pushPt.spdY / 6 * (1 - self.pushResist);
        //         if(self.x > self.pushPt.x){
        //             self.spdX += 1 * (1 - self.pushResist);
        //         }
        //         else if(self.x < self.pushPt.x){
        //             self.spdX += -1 * (1 - self.pushResist);
        //         }
        //         else{
        //             self.spdX += 0;
        //         }
        //         if(self.y > self.pushPt.y){
        //             self.spdY += 1 * (1 - self.pushResist);
        //         }
        //         else if(self.y < self.pushPt.y){
        //             self.spdY += -1 * (1 - self.pushResist);
        //         }
        //         else{
        //             self.spdY += 0;
        //         }
        //         if(self.pushResist === 1){
        //             self.moveSpeed = self.maxSpeed;
        //         }
        //     }
        //     if(pushPower === 0){
        //         self.dazed = 0;
        //     }
        // }
        self.justCollided = false;
    }
    self.trackEntity = function(pt,distance){
        self.trackingEntity = pt;
        self.trackingPath = [];
        self.trackDistance = distance;
        self.trackingPos = {x:null,y:null};
        self.trackCircleDirection = 1;
    }
    self.randomWalk = function(walking){
        self.randomPos.walking = walking;
        self.randomPos.x = self.x;
        self.randomPos.y = self.y;
    }
    self.updateAnimation = function(){
        if(!self.animate){
            return;
        }
        if(self.spdY >= 0.1){
            self.animationDirection = "down";
        }
        else if(self.spdY <= -0.1){
            self.animationDirection = "up";
        }
        else if(self.spdX >= 0.1){
            self.animationDirection = "right";
        }
        else if(self.spdX <= -0.1){
            self.animationDirection = "left";
        }
        else{
            self.animation = -1;
        }
        if(self.animation === -1){
            self.animation = 0;
        }
        else{
            self.animation += 0.5;
            if(self.animation >= 4){
                self.animation = 0;
            }
        }
    }
    self.updateCollisions = function(){
        for(var i = -1;i < 2;i++){
            for(var j = -1;j < 2;j++){
                if(Transporter.list[self.map + ":" + Math.round((self.x - 64) / 64 + i) * 64 + ":" + Math.round((self.y - 64) / 64 + j) * 64 + ":"] && self.canMove){
                    var direction = Transporter.list[self.map + ":" + Math.round((self.x - 64) / 64 + i) * 64 + ":" + Math.round((self.y - 64) / 64 + j) * 64 + ":"].teleportdirection;
                    if(direction === "up" && self.spdY < 0){
                        self.doTransport(Transporter.list[self.map + ":" + Math.round((self.x - 64) / 64 + i) * 64 + ":" + Math.round((self.y - 64) / 64 + j) * 64 + ":"]);
                    }
                    if(direction === "down" && self.spdY > 0){
                        self.doTransport(Transporter.list[self.map + ":" + Math.round((self.x - 64) / 64 + i) * 64 + ":" + Math.round((self.y - 64) / 64 + j) * 64 + ":"]);
                    }
                    if(direction === "left" && self.spdX < 0){
                        self.doTransport(Transporter.list[self.map + ":" + Math.round((self.x - 64) / 64 + i) * 64 + ":" + Math.round((self.y - 64) / 64 + j) * 64 + ":"]);
                    }
                    if(direction === "right" && self.spdX > 0){
                        self.doTransport(Transporter.list[self.map + ":" + Math.round((self.x - 64) / 64 + i) * 64 + ":" + Math.round((self.y - 64) / 64 + j) * 64 + ":"]);
                    }
                }
            }
        }
        if(self.canCollide === false){
            return;
        }
        for(var i = -1;i < 2;i++){
            for(var j = -1;j < 2;j++){
                if(Collision.list[self.map + ':' + (Math.round((self.x + i * 64) / 64) * 64) + ':' + (Math.round((self.y + j * 64) / 64) * 64) + ':'] !== undefined){
                    for(var k in Collision.list[self.map + ':' + (Math.round((self.x + i * 64) / 64) * 64) + ':' + (Math.round((self.y + j * 64) / 64) * 64) + ':']){
                        if(Collision.list[self.map + ':' + (Math.round((self.x + i * 64) / 64) * 64) + ':' + (Math.round((self.y + j * 64) / 64) * 64) + ':'] !== undefined){
                            self.doCollision(Collision.list[self.map + ':' + (Math.round((self.x + i * 64) / 64) * 64) + ':' + (Math.round((self.y + j * 64) / 64) * 64) + ':'][k]);
                        }
                    }
                }
            }
        }
    }
    self.doCollision = function(collision){
        if(!collision){
            return;
        }
        if(self.isColliding(collision)){
            self.justCollided = true;
            var x1 = self.lastX + self.spdX;
            self.x = self.lastX;
            if(self.isColliding(collision)){
                self.x = x1;
                self.y = self.lastY;
                if(self.isColliding(collision)){
                    self.x = self.lastX;
                    self.y = self.lastY;
                }
                else{
                    var colliding = false;
                    for(var i in Collision.list[collision.map + ':' + (Math.round((collision.x) / 64) * 64) + ':' + (Math.round((collision.y) / 64) * 64) + ':']){
                        if(Collision.list[collision.map + ':' + (Math.round((collision.x) / 64) * 64) + ':' + (Math.round((collision.y) / 64) * 64) + ':'][i] !== undefined){
                            if(self.isColliding(Collision.list[collision.map + ':' + (Math.round((collision.x) / 64) * 64) + ':' + (Math.round((collision.y) / 64) * 64) + ':'][i])){
                                colliding = true;
                            }
                        }
                    }
                    if(colliding){
                        self.x = self.lastX;
                        self.y = self.lastY;
                    }
                }
            }
            else{
                var colliding = false;
                for(var i in Collision.list[collision.map + ':' + (Math.round((collision.x) / 64) * 64) + ':' + (Math.round((collision.y) / 64) * 64) + ':']){
                    if(Collision.list[collision.map + ':' + (Math.round((collision.x) / 64) * 64) + ':' + (Math.round((collision.y) / 64) * 64) + ':'][i] !== undefined){
                        if(self.isColliding(Collision.list[collision.map + ':' + (Math.round((collision.x) / 64) * 64) + ':' + (Math.round((collision.y) / 64) * 64) + ':'][i])){
                            colliding = true;
                        }
                    }
                }
                if(colliding){
                    self.x = x1;
                    self.y = self.lastY;
                    if(self.isColliding(collision)){
                        self.x = self.lastX;
                        self.y = self.lastY;
                    }
                    else{
                        var colliding = false;
                        for(var i in Collision.list[collision.map + ':' + (Math.round((collision.x) / 64) * 64) + ':' + (Math.round((collision.y) / 64) * 64) + ':']){
                            if(Collision.list[collision.map + ':' + (Math.round((collision.x) / 64) * 64) + ':' + (Math.round((collision.y) / 64) * 64) + ':'][i] !== undefined){
                                if(self.isColliding(Collision.list[collision.map + ':' + (Math.round((collision.x) / 64) * 64) + ':' + (Math.round((collision.y) / 64) * 64) + ':'][i])){
                                    colliding = true;
                                }
                            }
                        }
                        if(colliding){
                            self.x = self.lastX;
                            self.y = self.lastY;
                        }
                    }
                }
            }
        }
    }
    self.teleport = function(x,y,map){
        if(playerMap[map] === undefined){
            return;
        }
        if(self.mapChange > 10){
            self.invincible = true;
            self.mapChange = -1;
            self.transporter = {
                teleport:map,
                teleportx:x,
                teleporty:y,
            };
        }
    }
    self.doTransport = function(transporter){
        if(self.toRemove){
            return;
        }
        if(self.hp < 1){
            return;
        }
        if(self.isColliding(transporter)){
            self.teleport(transporter.teleportx,transporter.teleporty,transporter.teleport);
        }
    }
    self.onHit = function(pt){

    }
    self.dropItems = function(pt){
        if(!Player.list[pt]){
            return;
        }
        for(var i in self.itemDrops){
            if(Math.random() < self.itemDrops[i].chance * Player.list[pt].luck){
                var amount = self.itemDrops[i].amount;
                while(amount !== 0){
                    var amountDropped = Math.ceil(Math.random() * amount);
                    amount -= amountDropped;
                    new DroppedItem({
                        x:self.x,
                        y:self.y,
                        map:self.map,
                        item:i,
                        amount:amountDropped,
                        parent:pt,
                        allPlayers:false,
                    });
                }
            }
        }
    }
    self.onDamage = function(pt){
        var hp = self.hp;
        self.hp -= Math.max(Math.floor(pt.stats.damage - self.stats.defense),0);
        self.hp = Math.round(self.hp);
        if(self.hp < 1 && hp > 0){
            self.onDeath(self);
            if(self.type === 'Player'){
                SOCKET_LIST[self.id].emit('death');
                addToChat('#ff0000',self.name + ' died.');
            }
            else{
                if(self.type === 'Monster'){
                    self.dropItems(pt.parent);
                }
                self.toRemove = true;
            }
        }
        self.onHit(pt);
        if(pt.type === 'Projectile'){
            pt.onHit(self);
        }
    }
    self.shootProjectile = function(projectileType,param){
        var direction = param.direction / 180 * Math.PI || self.direction / 180 * Math.PI;
        var stats = Object.create(self.stats);
        if(param.stats){
            for(var i in param.stats){
                if(stats[i]){
                    stats[i] *= param.stats[i];
                }
            }
        }
        var projectile = new Projectile({
            parent:param.id || self.id,
            x:param.x || self.x + Math.cos(direction) * (param.distance + projectileData[projectileType].width * 2) || self.x + Math.cos(direction) * projectileData[projectileType].width * 2,
            y:param.x || self.y + Math.sin(direction) * (param.distance + projectileData[projectileType].width * 2) || self.y + Math.sin(direction) * projectileData[projectileType].width * 2,
            spdX:Math.cos(direction) * param.speed || Math.cos(direction) * 10,
            spdY:Math.sin(direction) * param.speed || Math.sin(direction) * 10,
            direction:self.direction || param.direction,
            spin:param.spin || 0,
            map:self.map,
            stats:stats,
            projectileType:projectileType || 'arrow',
            pierce:param.pierce || 1,
            timer:param.timer || 40,
            canCollide:param.canCollide || true,
            relativeToParent:param.relativeToParent || false,
            parentType:param.parentType || self.type,
            projectilePattern:param.projectilePattern || false,
        });
    }
    self.changeSize = function(){
        if(self.drawSize === 'small'){
            self.width = 56;
            self.height = 64;
        }
        else if(self.drawSize === 'medium'){
            self.width = 56;
            self.height = 56;
        }
        else{
            self.width = 112;
            self.height = 112;
        }
    }
    self.updateHp = function(){
        if(self.hp < 1){
            return;
        }
        self.hp += self.stats.hpRegen / 20;
        self.hp = Math.min(self.hpMax,self.hp);
    }
    return self;
}

Player = function(param,socket){
    var self = Actor(param);

    self.keyPress = {
        left:false,
        right:false,
        up:false,
        down:false,
        attack:false,
        second:false,
        heal:false,
    }
    self.keyMap = {
        up:'w',
        down:'s',
        left:'a',
        right:'d',
        attack:'attack',
        second:'second',
        heal:' ',
    };
    self.secondKeyMap = {
        up:'ArrowUp',
        down:'ArrowDown',
        left:'ArrowLeft',
        right:'ArrowRight',
        attack:'attack',
        second:'second',
        heal:'Shift',
    };
    self.thirdKeyMap = {
        up:'W',
        down:'S',
        left:'A',
        right:'D',
        attack:'attack',
        second:'second',
        heal:' ',
    };
    self.img = {
        body:[-1,-1,-1,0.5],
        shirt:[Math.random() * 255,Math.random() * 255,Math.random() * 255,0.5],
        shirtType:'shirtNecklace',
        pants:[Math.random() * 255,Math.random() * 255,Math.random() * 255,0.6],
        hair:[Math.random() * 255,Math.random() * 255,Math.random() * 255,0.5],
        hairType:'vikingHat',
    };

    self.username = param.username;
    self.name = param.username;

    self.changeSize();

    self.x = 32;
    self.y = 32;

    self.type = 'Player';

    self.hp = 100;
    self.hpMax = 100;
    self.xp = 0;
    self.xpMax = 100;
    self.mana = 100;
    self.manaMax = 100;

    self.stats = {
        damage:0,
        defense:0,
        hpRegen:2,
        manaRegen:0,
        critChance:0,
    }
    self.luck = 1;

    self.reload = 0;
    self.useTime = 0;
    self.weaponState = 0;
    self.weaponData = {};

    self.lastChat = 0;
    self.chatWarnings = 0;
    self.textColor = '#000000';

    self.inventory = new Inventory(socket,true);

    playerMap[self.map] += 1;
    self.onDeath = function(pt){
        for(var i in Projectile.list){
            if(Projectile.list[i].parent === pt.id){
                Projectile.list[i].toRemove = true;
            }
        }
        pt.canMove = false;
        pt.keyPress = {
            left:false,
            right:false,
            up:false,
            down:false,
            attack:false,
            second:false,
            heal:false,
        }
    }
    var lastSelf = {};
    self.update = function(){
        self.mapChange += 1;
        self.moveSpeed = self.maxSpeed;
        for(var i = 0;i < self.moveSpeed;i++){
            self.updateSpd();
            self.updateMove();
            if(self.canMove){
                self.updatePosition();
            }
            self.updateCollisions();
        }
        self.x = Math.round(self.x);
        self.y = Math.round(self.y);
        self.updateStats();
        self.updateAttack();
        self.updateHp();
        self.updateAnimation();
        if(self.mapChange === 0){
            self.canMove = false;
            socket.emit('changeMap',self.transporter);
        }
        if(self.mapChange === 5){
            var map = self.map;
            playerMap[self.map] -= 1;
            self.map = self.transporter.teleport;
            if(self.transporter.teleportx !== -1){
                self.x = self.transporter.teleportx;
            }
            if(self.transporter.teleporty !== -1){
                self.y = self.transporter.teleporty;
            }
            playerMap[self.map] += 1;
            if(map !== self.map){
                for(var i in Spawner.list){
                    if(Spawner.list[i].map === self.map && Spawner.list[i].spawned === false){
                        spawnMonster(Spawner.list[i],i);
                    }
                }
            }
            Player.getAllInitPack(socket);
            for(var i in Player.list){
                if(Player.list[i].map === self.map){
                    SOCKET_LIST[i].emit('initEntity',self.getInitPack());
                }
            }
        }
        if(self.mapChange === 10){
            self.canMove = true;
            self.invincible = false;
        }
        self.lastChat -= 1;
    }
    self.updateSpd = function(){
        self.spdX = 0;
        self.spdY = 0;
        self.lastX = self.x;
        self.lastY = self.y;
        if(self.keyPress.up){
            self.spdY = -1;
        }
        if(self.keyPress.down){
            self.spdY = 1;
        }
        if(self.keyPress.left){
            self.spdX = -1;
        }
        if(self.keyPress.right){
            self.spdX = 1;
        }
        if(self.isDead){
            self.spdX = 0;
            self.spdY = 0;
        }
    }
    self.updateAttack = function(){
        self.reload += 1;
        if(self.keyPress.attack){
            if(self.reload % self.useTime === 0){
                self.weaponState += 1;
                for(var i in self.weaponData){
                    if(self.weaponState % parseInt(i) === 0){
                        for(var j = 0;j < self.weaponData[i].length;j++){
                            if(self.weaponData[i][j]){
                                switch(self.weaponData[i][j].id){
                                    case "projectile":
                                        self.shootProjectile(self.weaponData[i][j].projectileType,self.weaponData[i][j].param);
                                        break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    self.updateStats = function(){
        if(self.inventory.updateStats){
            self.inventory.updateStats = false;

            self.hp = 100;
            self.hpMax = 100;
            self.mana = 100;
            self.manaMax = 100;
            
            self.stats = {
                damage:0,
                defense:0,
                hpRegen:2,
                manaRegen:0,
                critChance:0,
            }
            self.luck = 1;

            self.maxSpeed = 10;

            self.weaponState = 0;
            self.weaponData = {};

            var maxSlots = self.inventory.maxSlots;
            self.inventory.maxSlots = 10;

            for(var i in self.inventory.items){
                if(i >= 0){
                    if(i + '' === self.inventory.hotbarSelectedItem + ''){
                        if(self.inventory.items[i].id){
                            var item = Item.list[self.inventory.items[i].id];
                            if(item.equip !== 'hotbar'){
                                continue;
                            }
                            if(item.damage){
                                self.stats.damage += item.damage;
                            }
                            if(item.critChance !== undefined){
                                self.stats.critChance += item.critChance;
                            }
                            if(item.useTime){
                                self.useTime = item.useTime;
                            }
                            if(item.weaponData){
                                for(var j in item.weaponData){
                                    if(self.weaponData[j]){
                                        for(var k in item.weaponData[j]){
                                            self.weaponData[j].push(item.weaponData[k]);
                                        }
                                    }
                                    else{
                                        self.weaponData[j] = item.weaponData[j];
                                    }
                                }
                            }
                            try{
                                eval(item.event);
                            }
                            catch(err){
                                console.log(err);
                            }
                        }
                    }
                }
                else{
                    if(self.inventory.items[i].id){
                        var item = Item.list[self.inventory.items[i].id];
                        if(item.defense !== undefined){
                            self.stats.defense += item.defense;
                        }
                        if(item.extraHp !== undefined){
                            self.hpMax += item.extraHp;
                        }
                        if(item.extraMana !== undefined){
                            self.manaMax += item.extraMana;
                        }
                        if(item.extraHpRegen !== undefined){
                            self.hpRegen += item.extraHpRegen;
                        }
                        if(item.extraManaRegen !== undefined){
                            self.manaRegen += item.extraManaRegen;
                        }
                        if(item.extraMovementSpeed !== undefined){
                            self.maxSpeed += item.extraMovementSpeed;
                        }
                        if(item.weaponData){
                            for(var j in item.weaponData){
                                if(self.weaponData[j]){
                                    for(var k in item.weaponData[j]){
                                        self.weaponData[j].push(item.weaponData[k]);
                                    }
                                }
                                else{
                                    self.weaponData[j] = item.weaponData[j];
                                }
                            }
                        }
                        try{
                            eval(item.event);
                        }
                        catch(err){
                            console.log(err);
                        }
                    }
                }
            }
        }
    }
    self.getUpdatePack = function(){
        var pack = {};
        pack.id = self.id;
        if(lastSelf.x !== self.x){
            pack.x = self.x;
            lastSelf.x = self.x;
        }
        if(lastSelf.y !== self.y){
            pack.y = self.y;
            lastSelf.y = self.y;
        }
        if(lastSelf.map !== self.map){
            pack.map = self.map;
            lastSelf.map = self.map;
        }
        if(lastSelf.name !== self.name){
            pack.name = self.name;
            lastSelf.name = self.name;
        }
        for(var i in self.img){
            if(lastSelf.img){
                if(lastSelf.img[i]){
                    if(Array.isArray(lastSelf.img[i])){
                        for(var j in lastSelf.img[i]){
                            if(self.img[i][j] !== lastSelf.img[i][j]){
                                pack.img = self.img;
                                lastSelf.img = Object.create(self.img);
                            }
                        }
                    }
                    else{
                        pack.img = self.img;
                        lastSelf.img = Object.create(self.img);
                    }
                }
                else{
                    pack.img = self.img;
                    lastSelf.img = Object.create(self.img);
                }
            }
            else{
                pack.img = self.img;
                lastSelf.img = Object.create(self.img);
            }
        }
        if(lastSelf.animationDirection !== self.animationDirection){
            pack.animationDirection = self.animationDirection;
            lastSelf.animationDirection = self.animationDirection;
        }
        if(lastSelf.animation !== self.animation){
            pack.animation = self.animation;
            lastSelf.animation = self.animation;
        }
        if(lastSelf.direction !== self.direction){
            pack.direction = self.direction;
            lastSelf.direction = self.direction;
        }
        if(lastSelf.hp !== self.hp){
            pack.hp = self.hp;
            lastSelf.hp = self.hp;
        }
        if(lastSelf.hpMax !== self.hpMax){
            pack.hpMax = self.hpMax;
            lastSelf.hpMax = self.hpMax;
        }
        if(lastSelf.xp !== self.xp){
            pack.xp = self.xp;
            lastSelf.xp = self.xp;
        }
        if(lastSelf.xpMax !== self.xpMax){
            pack.xpMax = self.xpMax;
            lastSelf.xpMax = self.xpMax;
        }
        if(lastSelf.mana !== self.mana){
            pack.mana = self.mana;
            lastSelf.mana = self.mana;
        }
        if(lastSelf.manaMax !== self.manaMax){
            pack.manaMax = self.manaMax;
            lastSelf.manaMax = self.manaMax;
        }
        if(lastSelf.drawSize !== self.drawSize){
            pack.drawSize = self.drawSize;
            lastSelf.drawSize = self.drawSize;
        }
        for(var i in self.stats){
            if(lastSelf.stats !== undefined){
                if(lastSelf.stats[i] !== undefined){
                    if(self.stats[i] !== lastSelf.stats[i]){
                        pack.stats = self.stats;
                        lastSelf.stats = Object.create(self.stats);
                    }
                }
                else{
                    pack.stats = self.stats;
                    lastSelf.stats = Object.create(self.stats);
                }
            }
            else{
                pack.stats = self.stats;
                lastSelf.stats = Object.create(self.stats);
            }
        }
        return pack;
    }
    self.getInitPack = function(){
        var pack = {};
        pack.id = self.id;
        pack.x = self.x;
        pack.y = self.y;
        pack.map = self.map;
        pack.name = self.name;
        pack.img = self.img;
        pack.animation = self.animation;
        pack.animationDirection = self.animationDirection;
        pack.direction = self.direction;
        pack.hp = self.hp;
        pack.hpMax = self.hpMax;
        pack.xp = self.xp;
        pack.xpMax = self.xpMax;
        pack.mana = self.mana;
        pack.manaMax = self.manaMax;
        pack.drawSize = self.drawSize;
        pack.stats = self.stats;
        pack.type = self.type;
        return pack;
    }
    Player.list[self.id] = self;
    return self;
}


Player.list = {};

Player.onConnect = function(socket,username){
    getDatabase(username,function(param){
        var player = Player({
            id:socket.id,
            username:username,
            param:param,
        },socket);

        for(var i in SOCKET_LIST){
            if(Player.list[i]){
                if(Player.list[i].map === player.map){
                    SOCKET_LIST[i].emit('initEntity',player.getInitPack());
                }
            }
        }
        socket.emit('selfId',{id:socket.id});

        socket.on('keyPress',function(data){
            if(data.inputId === 'releaseAll'){
                player.keyPress = {
                    up:false,
                    down:false,
                    left:false,
                    right:false,
                    attack:false,
                    second:false,
                    heal:false,
                };
            }
            if(player.hp < 1){
                return;
            }
            if(data.inputId === player.keyMap.left || data.inputId === player.secondKeyMap.left || data.inputId === player.thirdKeyMap.left){
                player.keyPress.left = data.state;
            }
            if(data.inputId === player.keyMap.right || data.inputId === player.secondKeyMap.right || data.inputId === player.thirdKeyMap.right){
                player.keyPress.right = data.state;
            }
            if(data.inputId === player.keyMap.up || data.inputId === player.secondKeyMap.up || data.inputId === player.thirdKeyMap.up){
                player.keyPress.up = data.state;
            }
            if(data.inputId === player.keyMap.down || data.inputId === player.secondKeyMap.down || data.inputId === player.thirdKeyMap.down){
                player.keyPress.down = data.state;
            }
            if(data.inputId === player.keyMap.attack || data.inputId === player.secondKeyMap.attack || data.inputId === player.thirdKeyMap.attack){
                player.keyPress.attack = data.state;
            }
            if(data.inputId === player.keyMap.second || data.inputId === player.secondKeyMap.second || data.inputId === player.thirdKeyMap.second){
                player.keyPress.second = data.state;
            }
            if(data.inputId === player.keyMap.heal || data.inputId === player.secondKeyMap.heal || data.inputId === player.thirdKeyMap.heal){
                player.keyPress.heal = data.state;
            }
            if(data.inputId === 'direction'){
                player.direction = (Math.atan2(data.state.y,data.state.x) / Math.PI * 180);
                player.mouseX = data.state.x + player.x;
                player.mouseY = data.state.y + player.y;
            }
        });

        socket.on('respawn',function(data){
            if(player.hp > 0){
                addToChat('#ff0000',player.name + ' cheated using respawn.');
                Player.onDisconnect(SOCKET_LIST[player.id]);
                return;
            }
            player.canMove = true;
            player.hp = Math.round(player.hpMax / 2);
            // player.teleport(ENV.Spawnpoint.x,ENV.Spawnpoint.y,ENV.Spawnpoint.map);
            addToChat('#00ff00',player.name + ' respawned.');
        });

        socket.on('init',function(data){
            Player.getAllInitPack(socket);
        });
        Player.getAllInitPack(socket);
        addToChat('#00ff00',player.name + " just logged on.");
    });
}
Player.onDisconnect = function(socket){
    for(var i in Projectile.list){
        if(socket && Projectile.list[i].parent === socket.id){
            delete Projectile.list[i];
        }
    }
    if(!socket){
        return;
    }
    storeDatabase(Player.list);
    if(Player.list[socket.id]){
        playerMap[Player.list[socket.id].map] -= 1;
        addToChat('#ff0000',Player.list[socket.id].name + " logged off.");
        delete Player.list[socket.id];
    }
}
Player.getAllInitPack = function(socket){
    try{
        var player = Player.list[socket.id];
        if(player){
            var pack = {player:[],projectile:[],monster:[],npc:[],droppedItem:[]};
            for(var i in Player.list){
                if(Player.list[i].map === player.map){
                    pack.player.push(Player.list[i].getInitPack());
                }
            }
            for(var i in Projectile.list){
                if(Projectile.list[i].map === player.map){
                    pack.projectile.push(Projectile.list[i].getInitPack());
                }
            }
            for(var i in Monster.list){
                if(Monster.list[i].map === player.map){
                    pack.monster.push(Monster.list[i].getInitPack());
                }
            }
            for(var i in Npc.list){
                if(Npc.list[i].map === player.map){
                    pack.npc.push(Npc.list[i].getInitPack());
                }
            }
            for(var i in DroppedItem.list){
                if(DroppedItem.list[i].map === player.map){
                    pack.droppedItem.push(DroppedItem.list[i].getInitPack());
                }
            }
            socket.emit('update',pack);
        }
    }
    catch(err){
        console.error(err);
    }
}

Projectile = function(param){
    var self = Entity(param);
    self.projectileType = param.projectileType;
    self.canCollide = param.canCollide;
    self.relativeToParent = false;
    if(param.relativeToParent === true){
        self.relativeToParent = param.parent;
    }
    self.spin = param.spin;
    self.projectilePattern = param.projectilePattern;
    self.timer = param.timer;
    self.parent = param.parent;
    self.parentType = param.parentType;
    self.type = 'Projectile';
    self.animations = 1;
    self.animation = 0;
    for(var i in projectileData[self.projectileType]){
        self[i] = projectileData[self.projectileType][i];
    }
    self.width *= 4;
    self.height *= 4;
    self.stats = param.stats;
    self.pierce = param.pierce;
    self.onHit = function(pt){
        self.pierce -= 1;
        if(self.pierce === 0){
            self.toRemove = true;
        }
    }
    var lastSelf = {};
    self.update = function(){
        self.updatePattern();
        self.updatePosition();
        self.x = Math.round(self.x);
        self.y = Math.round(self.y);
        self.updateCollisions();
        self.animation += 0.5;
        if(self.animation >= self.animations){
            self.animation = 0;
        }
        self.direction += self.spin;
        if(self.timer === 0){
            self.toRemove = true;
        }
        self.timer -= 1;
    }
    self.updatePattern = function(){
        if(self.relativeToParent && !Player.list[self.relativeToParent]){
            self.toRemove = true;
            return;
        }
        if(self.projectilePattern === 'swordSlash'){
            self.x = Player.list[self.relativeToParent].x;
            self.y = Player.list[self.relativeToParent].y;
            self.direction += 20;
            self.spdX = -Math.sin(self.direction / 180 * Math.PI) * 1;
            self.spdY = Math.cos(self.direction / 180 * Math.PI) * 1;
        }
        if(self.projectilePattern === 'shiv'){
            self.x = Player.list[self.relativeToParent].x;
            self.y = Player.list[self.relativeToParent].y;
            self.direction = Player.list[self.relativeToParent].direction + 135;
            self.spdX = Math.cos(Player.list[self.relativeToParent].direction / 180 * Math.PI) * 28 * Math.sqrt(2);
            self.spdY = Math.sin(Player.list[self.relativeToParent].direction / 180 * Math.PI) * 28 * Math.sqrt(2);
        }
        if(self.projectilePattern === 'sword'){
            self.x = Player.list[self.relativeToParent].x;
            self.y = Player.list[self.relativeToParent].y;
            self.direction = Player.list[self.relativeToParent].direction + 135;
            self.spdX = Math.cos(Player.list[self.relativeToParent].direction / 180 * Math.PI) * 48 * Math.sqrt(2);
            self.spdY = Math.sin(Player.list[self.relativeToParent].direction / 180 * Math.PI) * 48 * Math.sqrt(2);
        }
    }
    self.updateCollisions = function(){
        if(self.canCollide === false){
            return;
        }
        for(var i = -2;i < 3;i++){
            for(var j = -2;j < 3;j++){
                if(Collision.list[self.map + ':' + (Math.round((self.x + i * 64) / 64) * 64) + ':' + (Math.round((self.y + j * 64) / 64) * 64) + ':']){
                    for(var k in Collision.list[self.map + ':' + (Math.round((self.x + i * 64) / 64) * 64) + ':' + (Math.round((self.y + j * 64) / 64) * 64) + ':']){
                        if(Collision.list[self.map + ':' + (Math.round((self.x + i * 64) / 64) * 64) + ':' + (Math.round((self.y + j * 64) / 64) * 64) + ':'] !== undefined){
                            self.doCollision(Collision.list[self.map + ':' + (Math.round((self.x + i * 64) / 64) * 64) + ':' + (Math.round((self.y + j * 64) / 64) * 64) + ':'][k]);
                        }
                    }
                }
            }
        }
    }
    self.doCollision = function(collision){
        if(!collision){
            return;
        }
        if(collision.info === 'noProjectileCollision'){
            return;
        }
        if(self.isColliding(collision)){
            self.spdX = 0;
            self.spdY = 0;
        }
    }
    self.getUpdatePack = function(){
        var pack = {};
        pack.id = self.id;
        if(lastSelf.x !== self.x){
            if(Player.list[self.relativeToParent]){
                pack.x = self.x - Player.list[self.relativeToParent].x;
                lastSelf.x = self.x - Player.list[self.relativeToParent].x;
            }
            else{
                pack.x = self.x;
                lastSelf.x = self.x;
            }
        }
        if(lastSelf.y !== self.y){
            if(Player.list[self.relativeToParent]){
                pack.y = self.y - Player.list[self.relativeToParent].y;
                lastSelf.y = self.y - Player.list[self.relativeToParent].y;
            }
            else{
                pack.y = self.y;
                lastSelf.y = self.y;
            }
        }
        if(lastSelf.map !== self.map){
            pack.map = self.map;
            lastSelf.map = self.map;
        }
        if(lastSelf.width !== self.width){
            pack.width = self.width;
            lastSelf.width = self.width;
        }
        if(lastSelf.height !== self.height){
            pack.height = self.height;
            lastSelf.height = self.height;
        }
        if(lastSelf.direction !== self.direction){
            pack.direction = self.direction;
            lastSelf.direction = self.direction;
        }
        if(lastSelf.projectileType !== self.projectileType){
            pack.projectileType = self.projectileType;
            lastSelf.projectileType = self.projectileType;
        }
        if(lastSelf.canCollide !== self.canCollide){
            pack.canCollide = self.canCollide;
            lastSelf.canCollide = self.canCollide;
        }
        if(lastSelf.relativeToParent !== self.relativeToParent){
            pack.relativeToParent = self.relativeToParent;
            lastSelf.relativeToParent = self.relativeToParent;
        }
        if(lastSelf.parentType !== self.parentType){
            pack.parentType = self.parentType;
            lastSelf.parentType = self.parentType;
        }
        if(lastSelf.animations !== self.animations){
            pack.animations = self.animations;
            lastSelf.animations = self.animations;
        }
        if(lastSelf.animation !== self.animation){
            pack.animation = self.animation;
            lastSelf.animation = self.animation;
        }
        return pack;
    }
    self.getInitPack = function(){
        var pack = {};
        pack.id = self.id;
        if(Player.list[self.relativeToParent]){
            pack.x = self.x - Player.list[self.relativeToParent].x;
            pack.y = self.y - Player.list[self.relativeToParent].y;
        }
        else{
            pack.x = self.x;
            pack.y = self.y;
        }
        pack.map = self.map;
        pack.width = self.width;
        pack.height = self.height;
        pack.direction = self.direction;
        pack.projectileType = self.projectileType;
        pack.canCollide = self.canCollide;
        pack.relativeToParent = self.relativeToParent;
        pack.parentType = self.parentType;
        pack.animations = self.animations;
        pack.animation = self.animation;
        return pack;
    }
    Projectile.list[self.id] = self;
    return self;
}
Projectile.list = {};

Monster = function(param){
    var self = Actor(param);
    self.monsterType = param.monsterType;
    for(var i in monsterData[self.monsterType]){
        if(i === 'stats'){
            for(var j in monsterData[self.monsterType][i]){
                self.stats[j] = monsterData[self.monsterType][i][j];
            }
        }
        else if(i === 'itemDrops'){
            self[i] = Object.create(monsterData[self.monsterType][i]);
        }
        else{
            self[i] = monsterData[self.monsterType][i];
        }
    }
    self.changeSize();
    self.hp = self.hpMax;
    self.target = null;
    self.damaged = false;
    self.type = 'Monster';
    self.aggro = 6;
    self.attackState = 'passive';
    self.attackPhase = 1;
    self.spawnId = param.spawnId;
    self.reload = 0;
    self.randomWalk(true);
    self.onHit = function(pt){
        if(self.target === null){
            self.target = pt.parent;
            self.trackEntity(Player.list[pt.parent],0);
            self.damaged = true;
        }
    }
    var lastSelf = {};
    self.update = function(){
        self.moveSpeed = self.maxSpeed;
        for(var i = 0;i < self.moveSpeed;i++){
            self.updateMove();
            if(self.canMove){
                self.updatePosition();
            }
            self.updateCollisions();
        }
        self.x = Math.round(self.x);
        self.y = Math.round(self.y);
        self.updateHp();
        self.updateAnimation();
        self.updateTarget();
        self.updateAttack();
    }
    self.updateTarget = function(){
        if(self.target){
            if(Player.list[self.target]){
                if(Player.list[self.target].hp < 1){
                    self.target = null;
                    self.trackingEntity = null;
                    self.spdX = 0;
                    self.spdY = 0;
                }
                else if(Player.list[self.target].map !== self.map){
                    self.target = null;
                    self.trackingEntity = null;
                    self.spdX = 0;
                    self.spdY = 0;
                }
                else{
                    if(self.getDistance(Player.list[self.target]) > self.aggro * 64 * 2 && self.damaged === false){
                        self.target = null;
                        self.trackingEntity = null;
                        self.spdX = 0;
                        self.spdY = 0;
                    }
                }
            }
            else{
                self.target = null;
                self.trackingEntity = null;
                self.spdX = 0;
                self.spdY = 0;
            }
        }
        if(self.target === null){
            for(var i in Player.list){
                if(Player.list[i].map === self.map){
                    if(Player.list[i].hp > 0){
                        if(self.getDistance(Player.list[i]) < self.aggro * 64){
                            self.target = i;
                            self.trackEntity(Player.list[i],0);
                            self.damaged = false;
                        }
                    }
                }
            }
        }
    }
    self.updateAttack = function(){
        if(!self.target){
            self.reload = 0;
            return;
        }
        self.reload += 1;
        self.direction = Math.atan2(Player.list[self.target].y - self.y,Player.list[self.target].x - self.x) / Math.PI * 180;
        switch(self.monsterType){
            case 'skeleton':
                if(self.reload % 20 === 19){
                    self.shootProjectile('bone',{
                        speed:20,
                    });
                }
                break;
            case 'snake':
                if(self.reload % 5 === 4){
                    self.shootProjectile('snakeSpit',{
                        speed:20,
                    });
                }
                break;
            case 'jellyeye':
                if(self.reload % 2 === 0){
                    self.shootProjectile('eye',{
                        direction:Math.floor(Math.random() * 10) * 36 + Math.random() * 10 - 5,
                        speed:15,
                    });
                }
                break;
        }
    }
    self.getUpdatePack = function(){
        var pack = {};
        pack.id = self.id;
        if(lastSelf.x !== self.x){
            pack.x = self.x;
            lastSelf.x = self.x;
        }
        if(lastSelf.y !== self.y){
            pack.y = self.y;
            lastSelf.y = self.y;
        }
        if(lastSelf.width !== self.width){
            pack.width = self.width;
            lastSelf.width = self.width;
        }
        if(lastSelf.height !== self.height){
            pack.height = self.height;
            lastSelf.height = self.height;
        }
        if(lastSelf.map !== self.map){
            pack.map = self.map;
            lastSelf.map = self.map;
        }
        if(lastSelf.animationDirection !== self.animationDirection){
            pack.animationDirection = self.animationDirection;
            lastSelf.animationDirection = self.animationDirection;
        }
        if(lastSelf.animation !== self.animation){
            pack.animation = self.animation;
            lastSelf.animation = self.animation;
        }
        if(lastSelf.direction !== self.direction){
            pack.direction = self.direction;
            lastSelf.direction = self.direction;
        }
        if(lastSelf.hp !== self.hp){
            pack.hp = self.hp;
            lastSelf.hp = self.hp;
        }
        if(lastSelf.hpMax !== self.hpMax){
            pack.hpMax = self.hpMax;
            lastSelf.hpMax = self.hpMax;
        }
        if(lastSelf.drawSize !== self.drawSize){
            pack.drawSize = self.drawSize;
            lastSelf.drawSize = self.drawSize;
        }
        if(lastSelf.name !== self.name){
            pack.name = self.name;
            lastSelf.name = self.name;
        }
        if(lastSelf.monsterType !== self.monsterType){
            pack.monsterType = self.monsterType;
            lastSelf.monsterType = self.monsterType;
        }
        return pack;
    }
    self.getInitPack = function(){
        var pack = {};
        pack.id = self.id;
        pack.x = self.x;
        pack.y = self.y;
        pack.width = self.width;
        pack.height = self.height;
        pack.map = self.map;
        pack.animation = self.animation;
        pack.animationDirection = self.animationDirection;
        pack.direction = self.direction;
        pack.hp = self.hp;
        pack.hpMax = self.hpMax;
        pack.drawSize = self.drawSize;
        pack.name = self.name;
        pack.monsterType = self.monsterType;
        pack.type = self.type;
        return pack;
    }
    Monster.list[self.id] = self;
    return self;
}
Monster.list = {};

Npc = function(param){
    var self = Actor(param);
    self.randomWalk(true);
    var lastSelf = {};
    self.update = function(){
        self.mapChange += 1;
        self.moveSpeed = self.maxSpeed;
        for(var i = 0;i < self.moveSpeed;i++){
            self.updateMove();
            if(self.canMove){
                self.updatePosition();
            }
            self.updateCollisions();
        }
        self.x = Math.round(self.x);
        self.y = Math.round(self.y);
        self.updateAnimation();
        if(self.mapChange === 0){
            self.canMove = false;
        }
        if(self.mapChange === 5){
            var map = self.map;
            self.map = self.transporter.teleport;
            if(self.transporter.teleportx !== -1){
                self.x = self.transporter.teleportx;
            }
            if(self.transporter.teleporty !== -1){
                self.y = self.transporter.teleporty;
            }
            for(var i in Player.list){
                if(Player.list[i].map === self.map){
                    SOCKET_LIST[i].emit('initEntity',self.getInitPack());
                }
            }
        }
        if(self.mapChange === 10){
            self.canMove = true;
            self.invincible = false;
        }
    }
    self.getUpdatePack = function(){
        var pack = {};
        pack.id = self.id;
        if(lastSelf.x !== self.x){
            pack.x = self.x;
            lastSelf.x = self.x;
        }
        if(lastSelf.y !== self.y){
            pack.y = self.y;
            lastSelf.y = self.y;
        }
        if(lastSelf.map !== self.map){
            pack.map = self.map;
            lastSelf.map = self.map;
        }
        if(lastSelf.name !== self.name){
            pack.name = self.name;
            lastSelf.name = self.name;
        }
        for(var i in self.img){
            if(lastSelf.img){
                if(lastSelf.img[i]){
                    if(Array.isArray(lastSelf.img[i])){
                        for(var j in lastSelf.img[i]){
                            if(self.img[i][j] !== lastSelf.img[i][j]){
                                pack.img = self.img;
                                lastSelf.img = Object.create(self.img);
                            }
                        }
                    }
                    else{
                        pack.img = self.img;
                        lastSelf.img = Object.create(self.img);
                    }
                }
                else{
                    pack.img = self.img;
                    lastSelf.img = Object.create(self.img);
                }
            }
            else{
                pack.img = self.img;
                lastSelf.img = Object.create(self.img);
            }
        }
        if(lastSelf.animationDirection !== self.animationDirection){
            pack.animationDirection = self.animationDirection;
            lastSelf.animationDirection = self.animationDirection;
        }
        if(lastSelf.animation !== self.animation){
            pack.animation = self.animation;
            lastSelf.animation = self.animation;
        }
        if(lastSelf.direction !== self.direction){
            pack.direction = self.direction;
            lastSelf.direction = self.direction;
        }
        if(lastSelf.hp !== self.hp){
            pack.hp = self.hp;
            lastSelf.hp = self.hp;
        }
        if(lastSelf.hpMax !== self.hpMax){
            pack.hpMax = self.hpMax;
            lastSelf.hpMax = self.hpMax;
        }
        if(lastSelf.drawSize !== self.drawSize){
            pack.drawSize = self.drawSize;
            lastSelf.drawSize = self.drawSize;
        }
        return pack;
    }
    self.getInitPack = function(){
        var pack = {};
        pack.id = self.id;
        pack.x = self.x;
        pack.y = self.y;
        pack.map = self.map;
        pack.name = self.name;
        pack.img = self.img;
        pack.animation = self.animation;
        pack.animationDirection = self.animationDirection;
        pack.direction = self.direction;
        pack.hp = self.hp;
        pack.hpMax = self.hpMax;
        pack.drawSize = self.drawSize;
        pack.type = self.type;
        return pack;
    }
    Npc.list[self.id] = self;
    return self;
}
Npc.list = {};

DroppedItem = function(param){
	var self = Entity(param);
	self.id = Math.random();
    self.parent = param.parent;
    self.width = 72;
    self.height = 72;
    self.x += 128 * Math.random() - 64;
    self.y += 128 * Math.random() - 64;
    self.allPlayers = param.allPlayers;
    self.timer = 6000;
    self.item = param.item;
    self.amount = param.amount;
    self.toRemove = false;
    self.type = 'DroppedItem';
    var lastSelf = {};
	var super_update = self.update;
	self.update = function(){
        super_update();
        self.timer -= 1;
        if(self.timer <= 0){
            self.toRemove = true;
        }
        // if(Player.list[self.parent]){

        // }
        // else{
        //     self.toRemove = true;
        // }
    }
	self.getUpdatePack = function(){
        var pack = {};
        pack.id = self.id;
        if(lastSelf.x !== self.x){
            pack.x = self.x;
            lastSelf.x = self.x;
        }
        if(lastSelf.y !== self.y){
            pack.y = self.y;
            lastSelf.y = self.y;
        }
        if(lastSelf.map !== self.map){
            pack.map = self.map;
            lastSelf.map = self.map;
        }
        if(lastSelf.item !== self.item){
            pack.item = self.item;
            lastSelf.item = self.item;
        }
        if(lastSelf.direction !== self.direction){
            pack.direction = self.direction;
            lastSelf.direction = self.direction;
        }
        if(lastSelf.parent !== self.parent){
            pack.parent = self.parent;
            lastSelf.parent = self.parent;
        }
        if(lastSelf.allPlayers !== self.allPlayers){
            pack.allPlayers = self.allPlayers;
            lastSelf.allPlayers = self.allPlayers;
        }
        if(lastSelf.type !== self.type){
            pack.type = self.type;
            lastSelf.type = self.type;
        }
        return pack;
	}
    self.getInitPack = function(){
        var pack = {};
        pack.id = self.id;
        pack.x = self.x;
        pack.y = self.y;
        pack.map = self.map;
        pack.item = self.item;
        pack.parent = self.parent;
        pack.direction = self.direction;
        pack.allPlayers = self.allPlayers;
        pack.type = self.type;
        return pack;
    }
	DroppedItem.list[self.id] = self;
	return self;
}
DroppedItem.list = {};

var renderWorld = function(json,name){
    playerMap[name] = 0;
    for(var i = 0;i < json.layers.length;i++){
        if(json.layers[i].type === "tilelayer"){
            for(var j = 0;j < json.layers[i].chunks.length;j++){
                for(var k = 0;k < json.layers[i].chunks[j].data.length;k++){
                    tile_idx = json.layers[i].chunks[j].data[k];
                    if(tile_idx !== 0){
                        var s_x, s_y;
                        tile_idx -= 1;
                        var size = 64;
                        s_x = (k % 16) * size;
                        s_y = ~~(k / 16) * size;
                        s_x += json.layers[i].chunks[j].x * 64;
                        s_y += json.layers[i].chunks[j].y * 64;
                        for(var l in json.tilesets[0].tiles){
                            if(json.tilesets[0].tiles[l].id === tile_idx && json.tilesets[0].tiles[l].objectgroup){
                                for(var m in json.tilesets[0].tiles[l].objectgroup.objects){
                                    new Collision({
                                        x:s_x + json.tilesets[0].tiles[l].objectgroup.objects[m].x * 4 + json.tilesets[0].tiles[l].objectgroup.objects[m].width * 2,
                                        y:s_y + json.tilesets[0].tiles[l].objectgroup.objects[m].y * 4 + json.tilesets[0].tiles[l].objectgroup.objects[m].height * 2,
                                        width:json.tilesets[0].tiles[l].objectgroup.objects[m].width * 4,
                                        height:json.tilesets[0].tiles[l].objectgroup.objects[m].height * 4,
                                        map:name,
                                        info:json.tilesets[0].tiles[l].type,
                                    });
                                }
                            }
                        }
                        if(tile_idx + 1 === json.tilesets[1].firstgid){
                            spawnId = json.layers[i].name.substr(8,json.layers[i].name.length - 9);
                            var spawner = new Spawner({
                                x:s_x + 32,
                                y:s_y + 32,
                                width:64,
                                height:64,
                                spawnId:spawnId,
                                map:name,
                            });
                        }
                        else if(tile_idx + 1 === json.tilesets[1].firstgid + 1){
                            var teleport = "";
                            var teleportj = 0;
                            var teleportx = "";
                            var teleportxj = 0;
                            var teleporty = "";
                            var teleportyj = 0;
                            var teleportdirection = "";
                            for(var l = 0;l < json.layers[i].name.length;l++){
                                if(json.layers[i].name[l] === ':'){
                                    if(teleport === ""){
                                        teleport = json.layers[i].name.substr(0,l);
                                        teleportj = l;
                                    }
                                    else if(teleportx === ""){
                                        teleportx = json.layers[i].name.substr(teleportj + 1,l - teleportj - 1);
                                        teleportxj = l;
                                    }
                                    else if(teleporty === ""){
                                        teleporty = json.layers[i].name.substr(teleportxj + 1,l - teleportxj - 1);
                                        teleportyj = l;
                                    }
                                    else if(teleportdirection === ""){
                                        teleportdirection = json.layers[i].name.substr(teleportyj + 1,l - teleportyj - 1);
                                    }
                                }
                            }
                            var transporter = new Transporter({
                                x:s_x + 32,
                                y:s_y + 32,
                                width:64,
                                height:64,
                                teleport:teleport,
                                teleportx:teleportx,
                                teleporty:teleporty,
                                teleportdirection:teleportdirection,
                                map:name,
                            });
                        }
                        else if(tile_idx + 1 === json.tilesets[1].firstgid + 2){
                            npcName = json.layers[i].name.substr(4,json.layers[i].name.length - 5);
                            var npc = new Npc({
                                x:s_x + 32,
                                y:s_y + 32,
                                map:name,
                                name:npcName,
                            });
                        }
                    }
                }
            }
        }
    }
}
var loadMap = function(name){
    renderWorld(require('./../client/maps/' + name + '.json'),name);
}
loadMap('World');
loadMap('House');