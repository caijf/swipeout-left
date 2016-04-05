require.config({
    baseUrl: '../static',
    shim:{
        zepto: {
            exports: '$'
        }
    },
    paths: {
        zepto: 'third/zepto',
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
            return $(document).width() > 768;
        }
    });

    $('#list-flip').on('click', 'li', function(){
        console.log('click li');
    })

});