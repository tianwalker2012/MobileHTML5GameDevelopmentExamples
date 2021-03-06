var Game = new function() {                                                                  
  var boards = [];

  // Game Initialization
  this.initialize = function(canvasElementId,sprite_data,callback) {
    this.canvas = document.getElementById(canvasElementId)
    this.width = this.canvas.width;
    this.height= this.canvas.height;

    this.ctx = this.canvas.getContext && this.canvas.getContext('2d');
    if(!this.ctx) { return alert("Please upgrade your browser to play"); }

    this.setupInput();

    this.loop(); 

    SpriteSheet.load(sprite_data,callback);
  };

  // Handle Input
  var KEY_CODES = { 37:'left', 39:'right', 32 :'fire', 38:'forth', 40:'back'};
  this.keys = {};

  this.setupInput = function() {
    window.addEventListener('keydown',function(e) {
      if(KEY_CODES[event.keyCode]) {
       Game.keys[KEY_CODES[event.keyCode]] = true;
       e.preventDefault();
      }
    },false);

    window.addEventListener('keyup',function(e) {
      if(KEY_CODES[event.keyCode]) {
       Game.keys[KEY_CODES[event.keyCode]] = false; 
       e.preventDefault();
      }
    },false);

    this.canvas.addEventListener('touchstart', function (e) {
       //alert('touch start');
       var midWidth = Game.canvas.width/2.0;
       var midHeight = Game.canvas.height/2.0;
      //document.getElementById("debug").innerHTML ="width:"+midWidth+","+midHeight+"game started:"+Game.started+",touch:"+e.touches[0].clientX+","+e.touches[0].clientY+",pageX:"+e.touches[0].pageX+","+e.touches[0].pageY;
      
       if(Game.started){
          if(e.touches[0].pageX < midWidth){
              Game.keys[KEY_CODES[37]] = true;
          }else{
              Game.keys[KEY_CODES[39]] = true;
          }

          if(e.touches[0].pageY < midHeight){
              Game.keys[KEY_CODES[38]] = true;
          }else{
              Game.keys[KEY_CODES[40]] = true;
          }


        }
        
       Game.keys[KEY_CODES[32]] = true;
       //alert('end start');
    });

    this.canvas.addEventListener('touchend', function(e){
      //alert('touch end');
      //alert('touch end begin');
      //document.getElementById("debug").innerHTML = "touch:"+e.touches[0].clientX+","+e.touches[0].clientY+",pageX:"+e.touches[0].pageX+","+e.touches[0].pageY;
      //document.getElementById("debug").innerHTML = "touch up";
      Game.keys[KEY_CODES[32]] = false;
      Game.keys[KEY_CODES[37]] = false;
      Game.keys[KEY_CODES[39]] = false;

      Game.keys[KEY_CODES[38]] = false;
      Game.keys[KEY_CODES[40]] = false;
      //alert('touch end');
    });

  }

  // Game Loop
  this.loop = function() { 
    var dt = 30 / 1000;
    setTimeout(Game.loop,30);

    for(var i=0,len = boards.length;i<len;i++) {
      if(boards[i]) { 
        boards[i].step(dt);
        boards[i].draw(Game.ctx);
      }
    }

  };
  
  // Change an active game board
  this.setBoard = function(num,board) { boards[num] = board; };
};


var SpriteSheet = new function() {
  this.map = { }; 

  this.load = function(spriteData,callback) { 
    this.map = spriteData;
    this.image = new Image();
    this.image.onload = callback;
    this.image.src = 'images/sprites.png';
  };

  this.draw = function(ctx,sprite,x,y,frame) {
    var s = this.map[sprite];
    if(!frame) frame = 0;
    ctx.drawImage(this.image,
                     s.sx + frame * s.w, 
                     s.sy, 
                     s.w, s.h, 
                     Math.floor(x), Math.floor(y),
                     s.w, s.h);
  };
}

var TitleScreen = function TitleScreen(title,subtitle,callback) {
  var up = false;
  this.step = function(dt) {
    if(!Game.keys['fire']) up = true;
    if(up && Game.keys['fire'] && callback) callback();
  };

  this.draw = function(ctx) {
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";

    ctx.font = "bold 40px bangers";
    ctx.fillText(title,Game.width/2,Game.height/2);

    ctx.font = "bold 20px bangers";
    ctx.fillText(subtitle,Game.width/2,Game.height/2 + 40);
  };

};

var GameBoard = function() {
  var board = this;

  // The current list of objects
  this.objects = [];

  // Add a new object to the object list
  this.add = function(obj) { 
    obj.board=this; 
    this.objects.push(obj); 
    return obj; 
  };

  // Mark an object for removal
  this.remove = function(obj) { 
    this.removed.push(obj); 
  };

  // Reset the list of removed objects
  this.resetRemoved = function() { this.removed = []; }

  // Removed an objects marked for removal from the list
  this.finalizeRemoved = function() {
    for(var i=0,len=this.removed.length;i<len;i++) {
      var idx = this.objects.indexOf(this.removed[i]);
      if(idx != -1) this.objects.splice(idx,1);
    }
  }


  // Call the same method on all current objects 
  this.iterate = function(funcName) {
     var args = Array.prototype.slice.call(arguments,1);
     for(var i=0,len=this.objects.length;i<len;i++) {
       var obj = this.objects[i];
       obj[funcName].apply(obj,args)
     }
  };

  // Find the first object for which func is true
  this.detect = function(func) {
    for(var i = 0,val=null, len=this.objects.length; i < len; i++) {
      if(func.call(this.objects[i])) return this.objects[i];
    }
    return false;
  };

  // Call step on all objects and them delete
  // any object that have been marked for removal
  this.step = function(dt) { 
    this.resetRemoved();
    this.iterate('step',dt);
    this.finalizeRemoved();
  };

  // Draw all the objects
  this.draw= function(ctx) {
    this.iterate('draw',ctx);
  };

  // Check for a collision between the 
  // bounding rects of two objects
  this.overlap = function(o1,o2) {
    return !((o1.y+o1.h-1<o2.y) || (o1.y>o2.y+o2.h-1) ||
             (o1.x+o1.w-1<o2.x) || (o1.x>o2.x+o2.w-1));
  };

  // Find the first object that collides with obj
  // match against an optional type
  this.collide = function(obj,type) {
    return this.detect(function() {
      if(obj != this) {
       var col = (!type || this.type & type) && board.overlap(obj,this)
       return col ? this : false;
      }
    });
  };


};

var Sprite = function() { }

Sprite.prototype.setup = function(sprite,props) {
  this.sprite = sprite;
  this.merge(props);
  this.frame = this.frame || 0;
  this.w =  SpriteSheet.map[sprite].w;
  this.h =  SpriteSheet.map[sprite].h;
}

Sprite.prototype.merge = function(props) {
  if(props) {
    for (var prop in props) {
      this[prop] = props[prop];
    }
  }
}

Sprite.prototype.draw = function(ctx) {
  SpriteSheet.draw(ctx,this.sprite,this.x,this.y,this.frame);
}

Sprite.prototype.hit = function(damage) {
  this.board.remove(this);
}
