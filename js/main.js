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

    // 测试 左滑删除1
    window.test_flip_1 = new Flip({
        wrapper: '#test-flip1',
        itemSelector: 'li',
        transClass: 'li-inner',
        actionClass: 'li-action',
        overstepLimit: -30,
        disabledHandle: disabledHandle
    });

    // 测试 左滑删除 2
    window.test_flip_2 = new Flip({
        wrapper: '#test-flip2',
        itemSelector: 'li',
        transClass: 'li-inner',
        actionClass: 'li-action',
        overstepLimit: -30,
        disabledHandle: disabledHandle
    });

    // 测试 左滑删除 3
    window.test_flip_3 = new Flip({
        wrapper: '#test-flip3',
        itemSelector: 'li',
        transClass: 'li-inner',
        actionClass: 'li-action',
        dynamicLimit: true,
        overstepLimit: -30,
        disabledHandle: disabledHandle
    });

    // li子元素的事件，不能在li父节点去委托，在滑动中冒泡被阻止
    // $('#test-flip').on('click', function(e){

    //     var $target = $(e.target);

    //     if($target.hasClass('attention') || $target.parents('.attention').length > 0){
    //         e.preventDefault();
    //         console.log('click attention');
    //     }else if($target.hasClass('delete') || $target.parents('.delete').length > 0){
    //         e.preventDefault();
    //         console.log('click delete');
    //     }else{
    //         console.log('click li');
    //     }
    // });


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
            test_flip_1.reset();
            test_flip_2.reset();
        }
    });

    function disabledHandle(){
        // dom宽度大于 768px 返回false
        return $(document).width() > 768;
    }

});