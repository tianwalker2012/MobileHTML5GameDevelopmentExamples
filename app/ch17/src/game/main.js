game.module(
    'game.main'
)
.require(
    'game.assets',
    'game.objects'
)
.body(function() {

SceneGame = game.Scene.extend({
    init: function() {
    }
});

game.start();

});
