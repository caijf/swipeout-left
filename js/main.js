require.config({
    baseUrl: '../',
    paths: {
        zepto: 'third/zepto'
        flip: 'js/flip'
    }
});


require(['zepto', 'flip'], function($, Flip){

    // 调用左滑删除
    Flip({
        wrapper: '#list-flip',
        itemSelector: 'li',
        maxLimit: -80,
        toggleLimit: -40,
        animateTime: 300,
        disabledHandle: function(){
            return window.screen.width > 768;
        }
    })

});