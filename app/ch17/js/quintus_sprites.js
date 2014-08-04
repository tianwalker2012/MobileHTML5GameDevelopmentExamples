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
        Math.floor(p.x), 
        Math.floor(p.y));
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

  Q.CenterSprite = Q.Sprite.extend({
    init: function(props) {
      this._super(_({
        vx: 0,
        vy: 0,
        ax: 0,
        ay: 0,
        movedY:0,
        movedX:0
        }).extend(props));
      },

      step: function(dt) {
        this._super(dt);
        var p = this.p;
        p.vx += p.ax * dt;
        p.vy += p.ay * dt;
        p.movedX += p.vx * dt;
        p.movedY += p.vy * dt;
        //if(p.background){
        //   p.background.p.movedX = p.movedX;
        //   p.background.p.movedY = p.movedY; 
        //}
        //console.log("moved y:"+Math.floor(p.movedY)+" vy:"+p.vy+", ay:"+p.ay+", dt:"+dt);
        //this._super(dt);
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
        console.log("background dt:"+dt);
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
      var curMovedY = -p.leader.p.movedY;
      var image =  Q.asset(p.asset);
      var imageHeight = image.height;
      var yGap = curMovedY % imageHeight;
      //var yViewGap = yFi
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
          //console.log("remain:"+remain+",movedY:"+curMovedY+", gap:"+yGap+", imageHeight:"+imageHeight+"sx:"+p.sx+",h:"+p.h+",");
     
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

