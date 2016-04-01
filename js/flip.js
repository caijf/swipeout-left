define([], function(){

    /**
     * 标准化位置信息
     * @param e
     * @returns {Object}
     */
    function getStandEvent(e){
        var touches = e;
        if(e.touches && e.touches.length){
            touches = e.touches[0];
        }
        if(e.changedTouches && e.changedTouches.length){
            touches = e.changedTouches[0];
        }
        return _.extend({
            origin: {
                x: touches.pageX,
                y: touches.pageY
            }
        },e);
    }

    //处理事件兼容问题
     var EVENT;
     if ('ontouchstart' in window) {
         EVENT = {
             START: 'touchstart',
             MOVE: 'touchmove',
             END: 'touchend'
         };
     } else {
         EVENT = {
             START: 'mousedown',
             MOVE: 'mousemove',
             END: 'mouseup'
         };
     }

     // 缓存dom
     var $dom = $(document);


    function Flip(options){

        //去除new字符串
        if (this instanceof flip) return new flip(options);

        var self = this;

        // 参数覆盖
        var opt = $.extend({
            wrapper: 'body',
            itemSelector: 'li',
            maxLimit: -80,
            preventClick: true,
            animateClass: 'transition',
            animateTime: 200,
            disabledHandle: null // 禁用条件函数
        }, options);

        // 偏移界限值
        opt.toggleLimit = opt.toggleLimit || opt.maxLimit / 2;

        // 局部变量
        var currentTarget = null, // 当前操作的dom对象
            origin = {
                x: 0, // 开始x轴坐标
                y: 0 // 开始y轴坐标
            },
            dir = '', // 判断touch方向，v为垂直，h为水平
            startTime; // 开始触发时间

        // 偏移量
        function transform(x){
            currentTarget.css({
                '-webkit-transform': 'translateX('+ x +'px)',
                'transform': 'translateX('+ x +'px)'
            });
        }

        // 偏移动画
        function slide(x){
            currentTarget.addClass(opt.animateClass).attr('data-translateX', x);
            transform(x);
            setTimeout(function(){
                currentTarget && currentTarget.removeClass(opt.animateClass);
            }, opt.animateTime);
        }

        function start(e){
            if(opt.disabledHandle && disabledHandle()){
                return;
            }

            var e = getStandEvent(e),
                origin.x = e.origin.x,
                origin.y = e.origin.y,
                startTime = Date.now();

            var target = $(e.target).parents(opt.itemSelector);

            // 初始化
            sdOpts.dir = '';

            // 存在删除状态
            if(self.isHasDelete){
                // 如果触摸的是删除，保留当前状态
                if(e.target.textContent.toString() !== '删除'){
                    self.sdHideDelete();
                    return;
                }else{
                    sdOpts.currentTarget.removeClass('transition');
                }
            }else{
                // 不存在删除状态则重新获取currentTarget
                sdOpts.currentTarget = $target.parents("dd").length > 0 ? $target.parents("dd") : null;
                sdOpts.currentTarget && sdOpts.currentTarget.removeClass('transition');
            }

        }

        function move(e){
            if(opt.disabledHandle && disabledHandle()){
                return;
            }
        }

        function end(e){
            if(opt.disabledHandle && disabledHandle()){
                return;
            }
        }

        // 初始化，事件绑定
        this.init = function(){
            $(opt.wrapper).on(EVENT.START, start);
        }

        // 存在滑出状态
        this.hasSlide = false;

        // 隐藏滑出dom
        this.hideSlide = function(){
            slide(0);
            setTimeout(function(){
                currentTarget = null;
                self.hasSlide = false;
            }, opt.animateTime);
        }

        // 销毁
        this.destroy = function(){
            $(opt.wrapper).off(EVENT.START);
        }

        // 如果处于滑出状态，则重置
        this.reset = function(){
            if(self.hasSlide){
                self.hideSlide();
            }
        }

        this.init();

    }

    return Filp;

});

// 左滑删除：touchstart
sdStart: function(e, self){

    // pad不做任何操作
    if(cUtilCommon.isIpad || document.body.clientWidth > 768){
        return;
    }

    var self = self,
        touch = e.touches[0],
        $target = $(e.target),
        sdOpts = self.sdOpts;

    // 编辑状态
    if(modify.getModifyStatus()){
        return;
    }

    // 初始化
    sdOpts.startX = touch.pageX;
    sdOpts.startY = touch.pageY;
    sdOpts.moveX = 0;
    sdOpts.moveY = 0;
    sdOpts.dir = '';

    // 存在删除状态
    if(self.isHasDelete){
        // 如果触摸的是删除，保留当前状态
        if(e.target.textContent.toString() !== '删除'){
            self.sdHideDelete();
            return;
        }else{
            sdOpts.currentTarget.removeClass('transition');
        }
    }else{
        // 不存在删除状态则重新获取currentTarget
        sdOpts.currentTarget = $target.parents("dd").length > 0 ? $target.parents("dd") : null;
        sdOpts.currentTarget && sdOpts.currentTarget.removeClass('transition');
    }
},

// 左滑删除：touchmove
sdMove: function(e, self){
    // pad不做任何操作
    if(cUtilCommon.isIpad || document.body.clientWidth > 768){
        return;
    }

    var self = self,
        touch = e.touches[0],
        sdOpts = self.sdOpts;

    // 编辑状态 或 没有currentTarget的情况
    if(modify.getModifyStatus() || !sdOpts.currentTarget){
        return;
    }

    // 存在删除状态，并且触点是删除区域，阻止滚动
    if(self.isHasDelete){
        if(e.target.textContent.toString() === '删除'){
            // 阻止冒泡，bug：会触发click事件
            e.stopPropagation();
            // e.preventDefault(); // 开启这个触点是删除区域，不可滚动
        }
        return;
    }

    sdOpts.moveX = touch.pageX - sdOpts.startX,
    sdOpts.moveY = touch.pageY - sdOpts.startY;

    var absDistX = Math.abs(sdOpts.moveX),
        absDistY = Math.abs(sdOpts.moveY);

    // 取点判断方向
    if(!sdOpts.dir){
        if(absDistX > absDistY){
            sdOpts.dir = 'h';
        }else{
            sdOpts.dir = 'v';
        }
    }

    // 水平滑动处理
    if(sdOpts.dir === 'h'){

        // 跟随移动
        var translateX = parseInt(sdOpts.currentTarget.attr('data-translateX'), 10) || 0;
        translateX += sdOpts.moveX;

        // 边界值限定
        if(translateX < -sdOpts.deleteWidth){
            translateX = -sdOpts.deleteWidth;
        }else if(translateX > 0){
            translateX = 0;
        }

        self.sdTransform(translateX);

        // 阻止冒泡，产生bug：会触发click事件
        e.stopPropagation();

        // 阻止默认行为（滚动）
        e.preventDefault();
    }
},

// 左滑删除：touchend
sdEnd: function(e, self){
    // pad不做任何操作
    if(cUtilCommon.isIpad || document.body.clientWidth > 768){
        return;
    }

    var self = this,
        touch = e.touches[0],
        sdOpts = self.sdOpts;

    // 编辑状态 或 没有currentTarget的情况
    if(modify.getModifyStatus() || !sdOpts.currentTarget){
        return;
    }

    // 滑动方向
    if(sdOpts.dir !== 'h'){
        return;
    }

    var translateX = 0;

    // 滑动判定
    if(sdOpts.moveX < -sdOpts.deleteWidth/2){
        self.isHasDelete = true;
        translateX = -sdOpts.deleteWidth;
    }else{
        self.isHasDelete = false;
    }

    self.sdSlide(translateX);

    e.stopPropagation();
    e.preventDefault();
},

// 左滑删除：偏移量
sdTransform: function(x){
    this.sdOpts.currentTarget.css({
        '-webkit-transform': 'translateX('+ x +'px)',
        'transform': 'translateX('+ x +'px)'
    })
},

// 左滑删除：偏移动画
sdSlide: function(x){

    var self = this
        sdOpts = self.sdOpts;

    sdOpts.currentTarget.addClass('transition').attr('data-translateX', x);
    sdOpts.currentTarget.css({
        '-webkit-transform': 'translateX('+ x +'px)',
        'transform': 'translateX('+ x +'px)'
    });
    setTimeout(function(){
        sdOpts.currentTarget && sdOpts.currentTarget.removeClass('transition');
    }, 150);
},

// 左滑删除：隐藏删除状态
sdHideDelete: function(){
    var self = this,
        sdOpts = self.sdOpts;

    self.sdSlide(0);

    setTimeout(function(){
        sdOpts.currentTarget = null;
        self.isHasDelete = false;
    }, 200);
},

// 左滑删除：重置
sdReset: function(){
    var self = this;
    if(self.isHasDelete){
        self.sdHideDelete();
    }
},