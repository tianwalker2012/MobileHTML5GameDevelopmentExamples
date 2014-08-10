Quintus.Sprites = function(Q) {
 
  // Create a new sprite sheet
  // Options:
  //  tilew - tile width
  //  tileh - tile height
  //  w     - width of the sprite block
  //  h     - height of the sprite block
  //  sx    - start x
  //  sy    - start y
  //  cols  - number of columns per row
  Q.SpriteSheet = Class.extend({
    init: function(name, asset,options) {
      _.extend(this,{
        name: name,
        asset: asset,
        w: Q.asset(asset).width,
        h: Q.asset(asset).height,
        tilew: 64,
        tileh: 64,
        sx: 0,
        sy: 0
        },options);
      this.cols = this.cols || 
                  Math.floor(this.w / this.tilew);
    },

    fx: function(frame) {
      return (frame % this.cols) * this.tilew + this.sx;
    },

    fy: function(frame) {
      return Math.floor(frame / this.cols) * this.tileh + this.sy;
    },

    draw: function(ctx, x, y, frame) {
      if(!ctx) { ctx = Q.ctx; }
      ctx.drawImage(Q.asset(this.asset),
                    this.fx(frame),this.fy(frame),
                    this.tilew, this.tileh,
                    Math.floor(x),Math.floor(y),
                    this.tilew, this.tileh);

    }

  });


  Q.sheets = {};
  Q.sheet = function(name,asset,options) {
    if(asset) {
      Q.sheets[name] = new Q.SpriteSheet(name,asset,options);
    } else {
      return Q.sheets[name];
    }
  };

  Q.compileSheets = function(imageAsset,spriteDataAsset) {
    var data = Q.asset(spriteDataAsset);
    _(data).each(function(spriteData,name) {
      Q.sheet(name,imageAsset,spriteData);
    });
  };


// Properties:
  //    x
  //    y
  //    z - sort order
  //    sheet or asset
  //    frame
  Q.Sprite = Q.GameObject.extend({
    init: function(props) {
      this.p = _({ 
        x: 0,
        y: 0,
        z: 0,
        frame: 0,
        type: 0
      }).extend(props||{});
      if((!this.p.w || !this.p.h)) {
        if(this.asset()) {
          this.p.w = this.p.w || this.asset().width;
          this.p.h = this.p.h || this.asset().height;
        } else if(this.sheet()) {
          this.p.w = this.p.w || this.sheet().tilew;
          this.p.h = this.p.h || this.sheet().tileh;
        }
      }
      this.p.id = this.p.id || _.uniqueId();
    },

    asset: function() {
      return Q.asset(this.p.asset);
    },

    sheet: function() {
      return Q.sheet(this.p.sheet);
    },

    draw: function(ctx) {
      if(!ctx) { ctx = Q.ctx; }
      var p = this.p;
      if(p.sheet) {
        this.sheet().draw(ctx, p.x, p.y, p.frame);
      } else if(p.asset) {
        ctx.drawImage(Q.asset(p.asset), 
        0, 
        0,
        p.w, p.h, 
        p.x, p.y,
        p.w/Q.pixelRatio,
        p.h/Q.pixelRatio
        );
      }
      this.trigger('draw',ctx);
    },

    step: function(dt) {
      this.trigger('step',dt);
    }
  });

  

  Q.MovingSprite = Q.Sprite.extend({
    init: function(props) {
      this._super(_({
        vx: 0,
        vy: 0,
        ax: 0,
        ay: 0
        }).extend(props));
      },

      step: function(dt) {
        var p = this.p;

        p.vx += p.ax * dt;
        p.vy += p.ay * dt;

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        this._super(dt);
      }
    });

  Q.StaticFollowSprite = Q.Sprite.extend({
    init: function(props) {
      this._super(_({
        movedY:0,
        movedX:0,
        visibleW:Q.width,
        visibleH:Q.height,
        removePassed:true
        }).extend(props));
      },
      step: function(dt) {
        //this._super(dt);
        var gapY = Q.leader.p.movedY - this.p.movedY;
        if(gapY > (Q.height + this.p.h) && this.p.removePassed){
            //console.log('Will destroy');
            this.destroy();
        }
        this._super(dt);
      },
      draw: function(ctx) {
        var gapY = Math.abs(Q.leader.p.movedY - this.p.movedY);
        var gapX = Math.abs(Q.leader.p.movedX - this.p.movedX);
        //console.log('show icon:'+gapX+", gapY:"+gapY);
        if(gapX < this.p.visibleW && gapY < this.p.visibleH){
           //this.play('run_left');
           this.p.y = (Q.leader.p.y < Q.leader.p.centerY?Q.leader.p.y:Q.leader.p.centerY) + (this.p.movedY - Q.leader.p.movedY);
           this._super(ctx);
        }
      }
    });



  Q.TitleScreen = Q.Sprite.extend({
  init: function(props) {
      this._super(_({
          //title:"目标高度:40000",
          //subTitle:"当前高度:0"
        }).extend(props));
  },
  step: function(dt) {
    //if(!Game.keys['fire']) up = true;
    //if(up && Game.keys['fire'] && callback) callback();
  },

  draw: function(ctx) {
    ctx.fillStyle = "#E0E0E0";
    ctx.font = "bold 14px arial";
    var measure = ctx.measureText(this.p.title);  
    var textPos = Q.width - measure.width - 10;
    ctx.fillText(this.p.title, textPos, 20);

    ctx.font = "bold 14px arial";
    //var measure2 = ctx.measureText(this.p.Subtitle);
    ctx.fillText(this.p.subTitle, textPos, 20 + 21);

    if(this.p.thirdTitle){
      ctx.font = "bold 14px arial";
      //var measure3 = ctx.measureText(this.p.Subtitle);
      ctx.fillText(this.p.thirdTitle, textPos, 41 + 21 );
    }
  }
});

Q.StarSprite = Q.Sprite.extend({
    init: function(props) {
      this._super(_({
        movedY:0,
        movedX:0,
        bottomColor:[229, 158, 111],
        startColor:[113, 160, 188],
        endColor:[12, 27, 99],
        bottomHeight:Q.height,
        speed:1.0,
        numStars:80,
        }).extend(props));

         // Set up the offscreen canvas
        var stars = document.createElement("canvas");
        stars.width = Q.width; 
        stars.height = Q.height;
        var starCtx = stars.getContext("2d");
        //var offset = 0;
        this.p.stars = stars;
        // If the clear option is set, 
        // make the background black instead of transparent
        //if(clear) {
        //   starCtx.fillStyle = "#000";
        //   starCtx.fillRect(0,0,stars.width,stars.height);
        //}

        // Now draw a bunch of random 2 pixel
        // rectangles onto the offscreen canvas
        //starCtx.fillStyle = "#FFF";
        starCtx.globalAlpha = 0.5;
        for(var i=0;i<this.p.numStars;i++) {
            var rand = Math.random();
            var rand2 = Math.random();
            starCtx.fillStyle = "rgb("+Math.floor(180+75*rand2)+","+Math.floor(180+75*rand2)+","+Math.floor(180+75*rand2)+")";
            starCtx.fillRect(Math.floor(Math.random()*stars.width),
                     Math.floor(Math.random()*stars.height),
                     1+3*rand,
                     1+3*rand);
        }
        this.p.x = 0;
        this.p.y = 0
        this.p.w = Q.width;
        this.p.h = Q.height;
      },

  // This method is called every frame
  // to draw the starfield onto the canvas
    arrayToRGB:function(arr){
      return "rgb("+arr[0]+","+arr[1]+","+arr[2]+")";
    },
    interpolate:function(begin, end, ratio){
      return "rgb("+Math.floor(begin[0]+(end[0]-begin[0])*ratio)+","
                   +Math.floor(begin[1]+(end[1]-begin[1])*ratio)+","
                   +Math.floor(begin[2]+(end[2]-begin[2])*ratio)+")";
    },
    draw:function(ctx) {
      var stars = this.p.stars;
      // Draw the top half of the starfield
      var curMovedY = -Q.leader.p.movedY;
      var image =  stars;
      var imageHeight = stars.height;
      var yGap = curMovedY % imageHeight;
      var p = this.p;

      var leadPos = Math.abs(Q.leader.p.movedY);
      var bottomColor = this.p.bottomColor
      var startColor = this.p.startColor;
      var endColor = this.p.endColor;
      if(leadPos < this.p.bottomHeight){
        var finalPos = Math.abs(this.p.bottomHeight);
        var ratio = leadPos/finalPos;
        var grd=ctx.createLinearGradient(0,0,0,Q.height);
        grd.addColorStop(0, this.arrayToRGB(startColor));
        grd.addColorStop(1, this.interpolate(bottomColor, startColor, ratio));
        ctx.fillStyle = grd;
      }else{
        var finalPos = Math.abs(Q.endHeight);
        var ratio = leadPos/finalPos;

        ctx.fillStyle = "rgb("+Math.floor(startColor[0]+(endColor[0]-startColor[0])*ratio)+","
                   +Math.floor(startColor[1]+(endColor[1]-startColor[1])*ratio)+","
                   +Math.floor(startColor[2]+(endColor[2]-startColor[2])*ratio)+")";
      }
      ctx.fillRect(0, 0, Q.width, Q.height);  
      if(yGap > 0){
          var sourcePos = imageHeight - yGap;
          var sourceLength = yGap - p.h;
          if(sourceLength >= 0){
            ctx.drawImage(image, 0, sourcePos, p.w, p.h, p.x, p.y, p.w, p.h);
          }else{
            ctx.drawImage(image, 0, sourcePos, p.w, yGap, p.x, p.y, p.w, yGap);
            ctx.drawImage(image, 0, 0, p.w, p.h - yGap, p.x, p.y + yGap, p.w, p.h - yGap);
          } 
      }else{
          var upGoing = Math.abs(yGap);
          var remain =p.h - (imageHeight - upGoing); 
          if(remain <= 0){
            ctx.drawImage(image, 0, upGoing, p.w, p.h, p.x, p.y, p.w, p.h);
          }else{
            ctx.drawImage(image, 0, upGoing, p.w, (imageHeight - upGoing),p.x, p.y, p.w, (imageHeight - upGoing));
            ctx.drawImage(image, 0, 0, p.w, remain, p.x,p.y +(imageHeight - upGoing), p.w, remain);
          }
      }
      }
  });

  Q.CenterSprite = Q.Sprite.extend({
    init: function(props) {
      this._super(_({
        vx: 0,
        vy: 0,
        ax: 0,
        ay: 0,
        movedY:0,
        movedX:0,
        stationY:0,
        stationX:0,
        centerY:0
        }).extend(props));
      },

      step: function(dt) {
        this._super(dt);
        var p = this.p;

        /**
        if(p.movedY > p.stationY && p.vy > 0){
          console.log('movedY:'+p.movedY+", ay:"+p.ay+", vy:"+p.vy);
          
        }
        **/
        p.vx += p.ax * dt;
        p.vy += p.ay * dt;
        p.movedX += p.vx * dt;
        p.movedY += p.vy * dt;
        p.x = p.movedX;
        //console.log("moved y:"+Math.floor(p.movedY)+",p.h:"+p.h+",Q.height:"+Q.height+",y:"+p.y+" vy:"+p.vy+", ay:"+p.ay+", dt:"+dt);

        if(p.movedY >= 0){
          var curMovedY = p.movedY;
          p.movedY = 0;
          p.y +=curMovedY; 
          if(p.y + p.h > Q.height){
            p.y = Q.height - p.h;
            //console.log("vy is:"+p.vy);
            if(p.vy > 100){
              this.p.isCrashed = true;
            }else{
              p.vy = -p.vy * 0.3;
            } 
          }
        }else if(p.y > p.centerY){
          //if(p.y <  p.centerY
            var curMovedY = p.movedY;
            p.movedY = 0;
            p.y += curMovedY;
        }
       
      }
    });

  
  Q.MovingBackground = Q.Sprite.extend({
    init: function(props) {
      this._super(_({
          movedX:0,
          movedY:0
        }).extend(props));
      },

     step: function(dt) {
        //do nothing.
        //console.log("background dt:"+dt);
      },

     drawold:function(ctx){
        //console.log('super draw');
        //this.trigger('draw', ctx);
        console.log("leader:"+this.p.leader);
        this._super(ctx);
     },
     draw: function(ctx) {
      if(!ctx) { ctx = Q.ctx; }
      var p = this.p;
      //if(p.sheet) {
      //  this.sheet().draw(ctx, p.x, p.y, p.frame);
      //} else if(p.asset) {
      var curMovedY = -Q.leader.p.movedY;
      var image =  Q.asset(p.asset);
      var imageHeight = image.height;
      var yGap = curMovedY % imageHeight;
      if(yGap > 0){
          var sourcePos = imageHeight - yGap;
          var sourceLength = yGap - p.h;
          if(sourceLength >= 0){
            ctx.drawImage(image, 0, sourcePos, p.w, p.h, p.x, p.y, p.w, p.h);
          }else{
            ctx.drawImage(image, 0, sourcePos, p.w, yGap, p.x, p.y, p.w, yGap);
            ctx.drawImage(image, 0, 0, p.w, p.h - yGap, p.x, p.y + yGap, p.w, p.h - yGap);
          } 
      }else{
          var upGoing = Math.abs(yGap);
          var remain =p.h - (imageHeight - upGoing); 
          if(remain <= 0){
            ctx.drawImage(image, 0, upGoing, p.w, p.h, p.x, p.y, p.w, p.h);
          }else{
            ctx.drawImage(image, 0, upGoing, p.w, (imageHeight - upGoing),p.x, p.y, p.w, (imageHeight - upGoing));
            ctx.drawImage(image, 0, 0, p.w, remain, p.x,p.y +(imageHeight - upGoing), p.w, remain);
          }
      }
      //this.trigger('draw',ctx);
    }
    });


  return Q;
};

