require.config({
    baseUrl: '../static',
    shim:{
        zepto: {
            exports: '$'
        }
    },
    paths: {
        zepto: 'third/zepto',
        swipeout: 'js/swipeout'
    }
});


require(['zepto', 'swipeout'], function($, Swipeout){

    // 测试 左滑删除1
    var testSwipeout_1 = new Swipeout({
        wrapper: '#test-swipeout1',
        itemSelector: 'li',
        transClass: 'li-inner',
        actionClass: 'li-action',
        overstepLimit: -30,
        disabledHandle: disabledHandle
    });

    // 测试 左滑删除 2
    var testSwipeout_2 = new Swipeout({
        wrapper: '#test-swipeout2',
        itemSelector: 'li',
        transClass: 'li-inner',
        actionClass: 'li-action',
        overstepLimit: -30,
        disabledHandle: disabledHandle
    });

    // 测试 左滑删除 3
    var testSwipeout_3 = new Swipeout({
        wrapper: '#test-swipeout3',
        itemSelector: 'li',
        transClass: 'li-inner',
        actionClass: 'li-action',
        dynamicLimit: true,
        overstepLimit: -30,
        disabledHandle: disabledHandle
    });


    $('.attention').on('click', function(e){
        console.log('click attention');
    });

    $('.delete').on('click', function(e){
        console.log('click delete');
    });

    $('body').on('click', 'li', function(e){
        console.log('click li');
    })

    $(window).on('resize', function(e){
        if($(document).width() > 768){
            testSwipeout_1.close();
            testSwipeout_2.close();
            testSwipeout_3.close();
        }
    });

    function disabledHandle(){
        // dom宽度大于 768px 返回false
        return $(document).width() > 768;
    }

});