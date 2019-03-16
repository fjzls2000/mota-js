"use strict";

function events() {
    this._init();
}

////// 初始化 //////
events.prototype._init = function () {
    this.eventdata = functions_d6ad677b_427a_4623_b50f_a445a3b0ef8a.events;
    this.commonEvent = events_c12a15a8_c380_4b28_8144_256cba95f760.commonEvent;
    this.systemEvents = {};
    this.actions = {};
}

// ------ 初始化，开始和结束 ------ //

/// 初始化游戏
events.prototype.initGame = function () {
    return this.eventdata.initGame();
}

////// 游戏开始事件 //////
events.prototype.startGame = function (hard, seed, route, callback) {
    main.dom.levelChooseButtons.style.display='none';
    main.dom.startButtonGroup.style.display='none';

    if (main.mode!='play') return;

    // 无动画的开始游戏
    if (core.flags.startUsingCanvas || core.isset(route)) {
        core.dom.startPanel.style.display = 'none';
        this._startGame_start(hard, seed, route, callback);
    }
    else {
        core.hideStartAnimate(function () {
            core.events._startGame_start(hard, seed, route, callback);
        });
    }
}

events.prototype._startGame_start = function (hard, seed, route, callback) {
    console.log('开始游戏');
    core.resetStatus(core.firstData.hero, hard, null, null, core.initStatus.maps);
    var nowLoc = core.clone(core.getHeroLoc());
    core.setHeroLoc('x', -1);
    core.setHeroLoc('y', -1);

    if (core.isset(seed)) {
        core.setFlag('__seed__', seed);
        core.setFlag('__rand__', seed);
    }
    else core.utils.__init_seed();
    this.setInitData();

    core.clearMap('all');
    core.deleteAllCanvas();
    core.clearStatusBar();

    var todo = [];
    if (core.flags.startUsingCanvas) {
        core.control.triggerStatusBar('hide');
        core.dom.musicBtn.style.display = 'block';
        core.push(todo, core.firstData.startCanvas);
    }
    core.push(todo, core.firstData.startText);
    this.insertAction(todo, null, null, function () {
        core.events._startGame_afterStart(nowLoc, callback);
    });

    if (core.isset(route)) core.startReplay(route);
}

events.prototype._startGame_afterStart = function (nowLoc, callback) {
    core.ui.closePanel();
    core.control.triggerStatusBar('show');
    core.dom.musicBtn.style.display = 'none';
    core.changeFloor(core.firstData.floorId, null, nowLoc, null, callback);
    this._startGame_upload();
}

events.prototype._startGame_upload = function () {
    // Upload
    var formData = new FormData();
    formData.append('type', 'people');
    formData.append('name', core.firstData.name);
    formData.append('version', core.firstData.version);
    formData.append('platform', core.platform.isPC?"PC":core.platform.isAndroid?"Android":core.platform.isIOS?"iOS":"");
    formData.append('hard', core.encodeBase64(core.status.hard));
    formData.append('hardCode', core.getFlag('hard', 0));
    formData.append('base64', 1);

    core.utils.http("POST", "/games/upload.php", formData);
}

////// 不同难度分别设置初始属性 //////
events.prototype.setInitData = function () {
    return this.eventdata.setInitData();
}

////// 游戏获胜事件 //////
events.prototype.win = function (reason, norank) {
    core.status.gameOver = true;
    return this.eventdata.win(reason, norank);
}

////// 游戏失败事件 //////
events.prototype.lose = function (reason) {
    core.status.gameOver = true;
    return this.eventdata.lose(reason);
}

////// 游戏结束 //////
events.prototype.gameOver = function (ending, fromReplay, norank) {
    core.clearMap('all');
    core.deleteAllCanvas();
    core.dom.gif2.innerHTML = "";
    core.setWeather();
    core.ui.closePanel();

    if (main.isCompetition && core.isset(ending)) {
        if (ending == "") ending = "恭喜通关";
        ending += "[比赛]";
    }

    var reason = null;
    if (fromReplay) reason = "录像回放完毕！";
    else if (core.hasFlag("debug")) reason = "\t[系统提示]调试模式下无法上传成绩";
    else if (core.hasFlag("__consoleOpened__")) reason = "\t[系统提示]本存档开启过控制台，无法上传成绩";

    if (reason != null)
        core.drawText(reason, core.restart);
    else
        this._gameOver_confirmUpload(ending, norank);
}

events.prototype._gameOver_confirmUpload = function (ending, norank) {
    core.ui.closePanel();

    if (!core.isset(ending)) {
        this._gameOver_confirmDownload(ending);
        return;
    }
    core.ui.drawConfirmBox("你想记录你的ID和成绩吗？", function () {
        var username = main.isCompetition?"":prompt("请输入你的ID：", core.getCookie('id')||"");
        core.events._gameOver_doUpload(username, ending, norank);
    }, function () {
        if (main.isCompetition)
            core.events._gameOver_confirmDownload(ending);
        else
            core.events._gameOver_doUpload(null, ending, norank);
    })
}

events.prototype._gameOver_doUpload = function (username, ending, norank) {
    var hp = core.status.hero.hp;
    if (!core.isset(username)) hp = 1;
    core.ui.closePanel();
    // upload
    var formData = new FormData();
    formData.append('type', 'score');
    formData.append('name', core.firstData.name);
    formData.append('version', core.firstData.version);
    formData.append('platform', core.platform.isPC?"PC":core.platform.isAndroid?"Android":core.platform.isIOS?"iOS":"");
    formData.append('hard', core.encodeBase64(core.status.hard));
    formData.append('username', core.encodeBase64(username||""));
    formData.append('ending', core.encodeBase64(ending));
    formData.append('lv', core.status.hero.lv);
    formData.append('hp', Math.min(hp, Math.pow(2, 63)));
    formData.append('atk', core.status.hero.atk);
    formData.append('def', core.status.hero.def);
    formData.append('mdef', core.status.hero.mdef);
    formData.append('money', core.status.hero.money);
    formData.append('experience', core.status.hero.experience);
    formData.append('steps', core.status.hero.steps);
    formData.append('norank', norank||0);
    formData.append('seed', core.getFlag('__seed__'));
    formData.append('totalTime', Math.floor(core.status.hero.statistics.totalTime/1000));
    formData.append('route', core.encodeRoute(core.status.route));
    formData.append('base64', 1);

    if (main.isCompetition)
        core.http("POST", "/games/competition/upload.php", formData);
    else
        core.http("POST", "/games/upload.php", formData);

    setTimeout(function() {
        core.events._gameOver_confirmDownload(ending);
    }, 200);
}

events.prototype._gameOver_confirmDownload = function (ending) {
    core.ui.closePanel();
    core.ui.drawConfirmBox("你想下载录像吗？", function () {
        var obj = {
            'name': core.firstData.name,
            'version': core.firstData.version,
            'hard': core.status.hard,
            'seed': core.getFlag('__seed__'),
            'route': core.encodeRoute(core.status.route)
        }
        core.download(core.firstData.name+"_"+core.formatDate2(new Date())+".h5route", JSON.stringify(obj));
        core.events._gameOver_askRate(ending);
    }, function () {
        core.events._gameOver_askRate(ending);
    });
}

events.prototype._gameOver_askRate = function (ending) {
    if (!core.isset(ending)) {
        core.restart();
        return;
    }

    core.ui.closePanel();
    core.ui.drawConfirmBox("恭喜通关本塔，你想进行评分吗？", function () {
        if (core.platform.isPC) {
            window.open("/score.php?name="+core.firstData.name+"&num=10", "_blank");
            core.restart();
        }
        else {
            window.location.href = "/score.php?name="+core.firstData.name+"&num=10";
        }
    }, function () {
        core.restart();
    });
}

// ------ 系统事件的处理 ------ //

////// 注册一个系统事件 //////
// type为事件名，func为事件的处理函数，可接受(data, callback)参数
events.prototype.registerSystemEvent = function (type, func) {
    this.systemEvents[type] = func;
}

////// 注销一个系统事件 //////
events.prototype.unregisterSystemEvent = function (type) {
    delete this.systemEvents[type];
}

////// 执行一个系统事件 //////
events.prototype.doSystemEvent = function (type, data, callback) {
    if (this.systemEvents[type]) this.systemEvents[type](data, callback);
    else if (this["_sys_"+type]) this["_sys_"+type](data, callback);
    else {
        main.log("未知的系统事件: "+type+"！");
        if (callback) callback();
    }
}

////// 触发(x,y)点的事件 //////
events.prototype._trigger = function (x, y) {
    // 如果正在自定义事件中，忽略
    if (core.status.event.id == 'action') return;

    core.status.isSkiing = false;
    var block = core.getBlock(x, y);
    if (block == null) return;
    block = block.block;
    if (block.event.trigger) {
        var noPass = block.event.noPass, trigger = block.event.trigger;
        if (noPass) core.clearAutomaticRouteNode(x, y);
        if (trigger == 'ski') core.status.isSkiing = true;

        // 转换楼层能否穿透
        if (trigger=='changeFloor' && !noPass && this._trigger_ignoreChangeFloor(block))
            return;
        core.status.automaticRoute.moveDirectly = false;
        this.doSystemEvent(trigger, block, function () {
            if (trigger == 'openDoor' || trigger == 'changeFloor')
                core.replay();
        })
    }
}

events.prototype._trigger_ignoreChangeFloor = function (block) {
    var able = core.flags.ignoreChangeFloor;
    if (core.isset(block.event.data) && core.isset(block.event.data.ignoreChangeFloor))
        able=block.event.data.ignoreChangeFloor;
    if (able) {
        if (core.isReplaying()) {
            if (core.status.replay.toReplay[0]=='no') {
                core.status.replay.toReplay.shift();
                core.status.route.push("no");
                return true;
            }
        }
        else if (core.status.automaticRoute.autoHeroMove
            || core.status.automaticRoute.autoStep<core.status.automaticRoute.autoStepRoutes.length) {
            core.status.route.push("no");
            return true;
        }
    }
    return false;
}

events.prototype._sys_battle = function (data, callback) {
    this.battle(data.event.id, data.x, data.y, false, callback);
}

////// 战斗 //////
events.prototype.battle = function (id, x, y, force, callback) {
    core.saveAndStopAutomaticRoute();
    id = id || core.getBlockId(x, y);
    if (!core.isset(id)) return core.clearContinueAutomaticRoute(callback);
    // 非强制战斗
    if (!core.enemys.canBattle(id, x, y) && !force && !core.isset(core.status.event.id)) {
        core.drawTip("你打不过此怪物！");
        return core.clearContinueAutomaticRoute(callback);
    }
    // 自动存档
    if (!core.isset(core.status.event.id)) core.autosave(true);
    // 战前事件
    if (!this.beforeBattle(id, x, y))
        return core.clearContinueAutomaticRoute(callback);
    // 战后事件
    this.afterBattle(id, x, y, callback);
}

////// 战斗前触发的事件 //////
events.prototype.beforeBattle = function (enemyId, x, y) {
    return this.eventdata.beforeBattle(enemyId, x, y)
}

////// 战斗结束后触发的事件 //////
events.prototype.afterBattle = function (enemyId, x , y,callback) {
    return this.eventdata.afterBattle(enemyId, x, y, callback);
}

events.prototype._sys_openDoor = function (data, callback) {
    this.openDoor(data.event.id, data.x, data.y, true, callback);
}

////// 开门 //////
events.prototype.openDoor = function (id, x, y, needKey, callback) {
    id = id || core.getBlockId(x, y);
    core.saveAndStopAutomaticRoute();
    if (!this._openDoor_check(id, x, y, needKey)) return false;
    core.playSound("door.mp3");
    this._openDoor_animate(id, x, y, callback);
    return true;
}

events.prototype._openDoor_check = function (id, x, y, needKey) {
    // 是否存在门或暗墙
    if (!core.terrainExists(x, y, id) || !(id.endsWith("Door") || id.endsWith("Wall"))
        || !core.isset(core.material.icons.animates[id])) {
        core.clearContinueAutomaticRoute();
        return false;
    }

    if (needKey && id.endsWith("Door")) {
        var key = id.replace("Door", "Key");
        if (!core.hasItem(key)) {
            if (key != "specialKey")
                core.drawTip("你没有" + ((core.material.items[key]||{}).name||"钥匙"));
            else core.drawTip("无法开启此门");
            core.clearContinueAutomaticRoute();
            return false;
        }
        core.autosave(true);
        core.removeItem(key);
    }
    return true;
}

events.prototype._openDoor_animate = function (id, x, y, callback) {
    var door = core.material.icons.animates[id];
    var speed = id.endsWith("Door") ? 30 : 70;

    core.lockControl();
    core.status.replay.animate = true;
    var state = 0;
    var animate = window.setInterval(function () {
        state++;
        if (state == 4) {
            clearInterval(animate);
            core.removeBlock(x, y);
            core.unLockControl();
            core.status.replay.animate = false;
            core.events.afterOpenDoor(id, x, y, callback);
            return;
        }
        core.clearMap('event', 32 * x, 32 * y, 32, 32);
        core.drawImage('event', core.material.images.animates, 32 * state, 32 * door, 32, 32, 32 * x, 32 * y, 32, 32);
    }, speed / core.status.replay.speed);
}

////// 开一个门后触发的事件 //////
events.prototype.afterOpenDoor = function (doorId, x, y, callback) {
    return this.eventdata.afterOpenDoor(doorId,x,y,callback);
}

events.prototype._sys_getItem = function (data, callback) {
    this.getItem(data.event.id, 1, data.x, data.y, callback);
}

////// 获得某个物品 //////
events.prototype.getItem = function (itemId, itemNum, itemX, itemY, callback) {
    itemNum = itemNum || 1;
    var itemCls = core.material.items[itemId].cls;
    core.items.getItemEffect(itemId, itemNum);
    core.removeBlock(itemX, itemY);
    var text = '获得 ' + core.material.items[itemId].name;
    if (itemNum > 1) text += "x" + itemNum;
    if (itemCls === 'items') text += core.items.getItemEffectTip(itemId);
    core.drawTip(text, core.material.icons.items[itemId]);
    core.updateStatusBar();

    this.eventdata.afterGetItem(itemId, itemX, itemY, callback);
}

////// 获得面前的物品（轻按） //////
events.prototype.getNextItem = function() {
    if (core.isMoving() || !core.canMoveHero() || !core.flags.enableGentleClick) return false;

    var nextX = core.nextX(), nextY = core.nextY();
    var block = core.getBlock(nextX, nextY);
    if (block==null) return false;
    if (block.block.event.trigger=='getItem') {
        core.status.route.push("getNext");
        this.getItem(block.block.event.id, 1, nextX, nextY);
        return true;
    }
    return false;
}

events.prototype._sys_changeFloor = function (data, callback) {
    data = data.event.data;
    var heroLoc = {};
    if (core.isset(data.loc))
        heroLoc = {'x': data.loc[0], 'y': data.loc[1]};
    if (core.isset(data.direction))
        heroLoc.direction = data.direction;
    if (core.status.event.id!='action') core.status.event.id=null;
    core.changeFloor(data.floorId, data.stair, heroLoc, data.time, callback);
}

////// 楼层切换 //////
events.prototype.changeFloor = function (floorId, stair, heroLoc, time, callback, fromLoad) {
    var info = this._changeFloor_getInfo(floorId, stair, heroLoc, time);
    if (info == null) {
        if (callback) callback();
        return;
    }
    info.fromLoad = fromLoad;
    floorId = info.floorId;

    core.dom.floorNameLabel.innerHTML = core.status.maps[floorId].title;
    core.lockControl();
    core.stopAutomaticRoute();
    core.clearContinueAutomaticRoute();
    core.status.replay.animate=true;

    this._changeFloor_beforeChange(info, callback);
}

events.prototype._changeFloor_getInfo = function (floorId, stair, heroLoc, time) {
    floorId = floorId || core.status.floorId;
    if (floorId == ':before') {
        var index=core.floorIds.indexOf(core.status.floorId);
        if (index>0) floorId = core.floorIds[index-1];
        else floorId=core.status.floorId;
    }
    else if (floorId == ':next') {
        var index=core.floorIds.indexOf(core.status.floorId);
        if (index<core.floorIds.length-1) floorId = core.floorIds[index+1];
        else floorId=core.status.floorId;
    }
    if (!core.status.maps[floorId]) {
        main.log("不存在的楼层："+floorId);
        return null;
    }

    if (main.mode != 'play' || core.isReplaying()) time = 0;
    if (!core.isset(time)) time = core.values.floorChangeTime;
    if (!core.isset(time)) time = 800;
    if (time<100) time = 0;
    time /= 20;

    return {
        floorId: floorId,
        time: time,
        heroLoc: core.clone(this._changeFloor_getHeroLoc(floorId, stair, heroLoc))
    };
}

events.prototype._changeFloor_getHeroLoc = function (floorId, stair, heroLoc) {
    if (!core.isset(heroLoc))
        heroLoc = core.clone(core.status.hero.loc);
    if (core.isset(stair)) {
        // 检查该层地图的 upFloor & downFloor
        if (core.isset(core.status.maps[floorId][stair])) {
            heroLoc.x = core.status.maps[floorId][stair][0];
            heroLoc.y = core.status.maps[floorId][stair][1];
        }
        else {
            var blocks = core.status.maps[floorId].blocks;
            for (var i in blocks) {
                if (!blocks[i].disable && blocks[i].event.id === stair) {
                    heroLoc.x = blocks[i].x;
                    heroLoc.y = blocks[i].y;
                    break;
                }
            }
        }
    }
    ['x', 'y', 'direction'].forEach(function (name) {
        if (!core.isset(heroLoc[name]))
            heroLoc[name] = core.getHeroLoc(name);
    });
    return heroLoc;
}

events.prototype._changeFloor_beforeChange = function (info, callback) {
    core.playSound('floor.mp3');
    // 需要 setTimeout 执行，不然会出错
    window.setTimeout(function () {
        if (info.time == 0)
            core.events._changeFloor_changing(info, callback);
        else
            core.show(core.dom.floorMsgGroup, info.time / 2, function () {
                core.events._changeFloor_changing(info, callback);
            });
    }, 25)
}

events.prototype._changeFloor_changing = function (info, callback) {
    this.changingFloor(info.floorId, info.heroLoc, info.fromLoad);

    if (info.time == 0)
        this._changeFloor_afterChange(info, callback);
    else
        core.hide(core.dom.floorMsgGroup, info.time / 4, function () {
            core.events._changeFloor_afterChange(info, callback);
        });
}

events.prototype._changeFloor_afterChange = function (info, callback) {
    core.unLockControl();
    core.status.replay.animate=false;
    core.events.afterChangeFloor(info.floorId, info.fromLoad);

    if (callback) callback();
}

events.prototype.changingFloor = function (floorId, heroLoc, fromLoad) {
    this.eventdata.changingFloor(floorId, heroLoc, fromLoad);
}

////// 转换楼层结束的事件 //////
events.prototype.afterChangeFloor = function (floorId, fromLoad) {
    if (main.mode!='play') return;
    return this.eventdata.afterChangeFloor(floorId, fromLoad);
}

////// 是否到达过某个楼层 //////
events.prototype.hasVisitedFloor = function (floorId) {
    return core.getFlag("__visited__")[floorId] || false;
}

////// 到达某楼层 //////
events.prototype.visitFloor = function (floorId) {
    core.getFlag("__visited__")[floorId] = true;
}

events.prototype._sys_passNet = function (data, callback) {
    this.passNet(data);
    if (callback) callback();
}

////// 经过一个路障 //////
events.prototype.passNet = function (data) {
    if (core.hasItem('shoes')) return;
    // 血网 lavaNet 移动到 checkBlock 中处理
    if (data.event.id=='poisonNet') { // 毒网
        core.setFlag('debuff', 'poison');
        core.insertAction('毒衰咒处理');
    }
    else if (data.event.id=='weakNet') { // 衰网
        core.setFlag('debuff', 'weak');
        core.insertAction('毒衰咒处理');
    }
    else if (data.event.id=='curseNet') { // 咒网
        core.setFlag('debuff', 'curse');
        core.insertAction('毒衰咒处理');
    }
    core.updateStatusBar();
}

events.prototype._sys_pushBox = function (data, callback) {
    this.pushBox(data);
    if (callback) callback();
}

////// 推箱子 //////
events.prototype.pushBox = function (data) {
    if (data.event.id!='box' && data.event.id!='boxed') return;

    // 判断还能否前进，看看是否存在事件
    var direction = core.getHeroLoc('direction'),
        nx = data.x + core.utils.scan[direction].x, ny = data.y + core.utils.scan[direction].y;

    // 检测能否推上去
    if (!core.canMoveHero() || !core.canMoveHero(data.x, data.y, direction)) return;
    var nextId = core.getBlockId(nx, ny);
    if (nextId != null && nextId != 'flower') return;

    core.setBlock(nextId==null?169:170, nx, ny);

    if (data.event.id=='box')
        core.removeBlock(data.x, data.y);
    else
        core.setBlock(168, data.x, data.y);

    core.updateStatusBar();
    this._pushBox_moveHero(direction);
}

events.prototype._pushBox_moveHero = function (direction) {
    core.status.replay.animate = true;
    core.lockControl();
    setTimeout(function () {
        core.moveHero(direction, function() {
            core.status.replay.animate = false;
            core.status.route.pop();
            core.events.afterPushBox();
            // 可能有阻击...
            if (core.status.event.id == null) {
                core.unLockControl();
                core.replay();
            }
        });
    });
}

////// 推箱子后的事件 //////
events.prototype.afterPushBox = function () {
    return this.eventdata.afterPushBox();
}

events.prototype._sys_changeLight = function (data, callback) {
    core.events.changeLight(data.event.id, data.x, data.y);
    if (callback) callback();
}

////// 改变亮灯（感叹号）的事件 //////
events.prototype.changeLight = function(id, x, y) {
    if (id != null && id != 'light') return;
    core.setBlock(core.getNumberById('darkLight'), x, y);
    this.afterChangeLight(x,y);
}

////// 改变亮灯之后，可以触发的事件 //////
events.prototype.afterChangeLight = function (x,y) {
    return this.eventdata.afterChangeLight(x,y);
}

events.prototype._sys_ski = function (data, callback) {
    this.ski();
    if (callback) callback();
}

////// 滑冰 //////
events.prototype.ski = function (direction) {
    if (!core.isset(direction))
        direction = core.status.automaticRoute.lastDirection || core.getHeroLoc('direction');
    if (core.status.event.id!='ski') {
        core.waitHeroToStop(function () {
            core.status.event.id='ski';
            core.events.ski(direction);
        });
    }
    else {
        core.moveHero(direction, function () {
            if (core.status.event.id=='ski' && !core.status.isSkiing) {
                core.status.event.id=null;
                core.unLockControl();
                core.replay();
            }
        })
    }
}

events.prototype._sys_action = function (data, callback) {
    var ev = core.clone(data.event.data), ex = data.x, ey = data.y;
    // 检查是否需要改变朝向
    if (ex == core.nextX() && ey == core.nextY()) {
        var dir = {"up":"down","down":"up","left":"right","right":"left"}[core.getHeroLoc('direction')];
        var id = data.event.id, toId = (data.event.faceIds||{})[dir];
        if (core.isset(toId) && id!=toId) {
            var number = core.icons.getNumberById(toId);
            if (number>0)
                core.setBlock(number, ex, ey);
        }
    }
    this.insertAction(ev, ex, ey, callback);
}

// ------ 自定义事件的处理 ------ //

////// 注册一个自定义事件 //////
// type为事件名，func为事件的处理函数，可接受(data, x, y, prefix)参数
// data为事件内容，x和y为当前点坐标（可为null），prefix为当前点前缀
events.prototype.registerEvent = function (type, func) {
    this.actions[type] = func;
}

////// 注销一个自定义事件
events.prototype.unregisterEvent = function (type) {
    delete this.actions[type];
}

////// 执行一个自定义事件
events.prototype.doEvent = function (data, x, y, prefix) {
    var type = data.type;
    if (this.actions[type]) this.actions[type](data, x, y, prefix);
    else if (this["_action_"+type]) this["_action_"+type](data, x, y, prefix);
    else {
        core.insertAction("未知的自定义事件: "+type+"！");
        core.doAction();
    }
}

////// 开始执行一系列自定义事件 //////
events.prototype.doEvents = function (list, x, y, callback) {
    if (!core.isset(list)) return;
    if (!(list instanceof Array)) {
        list = [list];
    }
    this.setEvents(list, x, y, callback);
    // 停止勇士
    core.waitHeroToStop(function() {
        core.lockControl();
        core.doAction();
    });
}

events.prototype.setEvents = function (list, x, y, callback) {
    var data = core.status.event.data || {};
    if (core.isset(list))
        data.list = [{todo: core.clone(list), total: core.clone(list), condition: "false"}];
    if (core.isset(x)) data.x = x;
    if (core.isset(y)) data.y = y;
    if (core.isset(callback)) data.callback = callback;
    core.status.event = {id: 'action', data: data};
}

////// 执行当前自定义事件列表中的下一个事件 //////
events.prototype.doAction = function() {
    // 清空boxAnimate和UI层
    core.status.boxAnimateObjs = [];
    clearInterval(core.status.event.interval);
    core.status.event.interval = null;
    core.clearLastEvent();
    // 判定是否执行完毕
    if (this._doAction_finishEvents()) return;
    // 当前点坐标和前缀
    var x = core.status.event.data.x, y = core.status.event.data.y;
    var prefix = [core.status.floorId||"f", core.isset(x)?x:"x", core.isset(y)?y:"y"].join("@");
    var current = core.status.event.data.list[0];
    if (this._popEvents(current, prefix)) return;
    // 当前要执行的事件
    var data = current.todo.shift();
    core.status.event.data.current = data;
    if (typeof data == "string")
        data = {"type": "text", "text": data};
    core.status.event.data.type = data.type;
    this.doEvent(data, x, y, prefix);
    return;
}

events.prototype._doAction_finishEvents = function () {
    // 事件处理完毕
    if (core.status.event.data.list.length==0) {
        var callback = core.status.event.data.callback;
        core.ui.closePanel();
        if (core.isset(callback))
            callback();
        core.replay();
        return true;
    }
    return false;
}

events.prototype._popEvents = function (current, prefix) {
    if (current.todo.length == 0) { // current list is empty
        if (core.calValue(current.condition, prefix)) { // check condition
            current.todo = core.clone(current.total);
        }
        else {
            core.status.event.data.list.shift(); // remove stack
        }
        core.doAction();
        return true;
    }
    return false;
}

////// 往当前事件列表之前添加一个或多个事件 //////
events.prototype.insertAction = function (action, x, y, callback) {
    if (core.hasFlag("__statistics__")) return;

    // ------ 判定commonEvent
    var commonEvent = this.getCommonEvent(action);
    if (commonEvent instanceof Array) action = commonEvent;
    if (!core.isset(action)) return;

    if (core.status.event.id != 'action') {
        this.doEvents(action, x, y, callback);
    }
    else {
        core.unshift(core.status.event.data.list[0].todo, action);
        this.setEvents(null, x, y, callback);
    }
}

////// 获得一个公共事件 //////
events.prototype.getCommonEvent = function (name) {
    if (!core.isset(name) || typeof name !== 'string') return null;
    return this.commonEvent[name] || null;
}

////// 恢复一个事件 //////
events.prototype.recoverEvents = function (data) {
    if (core.isset(data)) {
        core.ui.closePanel();
        core.lockControl();
        core.status.event.id = 'action';
        core.status.event.data = data;
        setTimeout(function () {
            core.doAction();
        }, 30);
        return true;
    }
    return false;
}

// ------ 样板提供的的自定义事件 ------ //

events.prototype.__action_checkReplaying = function () {
    if (core.isReplaying()) {
        core.doAction();
        return true;
    }
    return false;
}

events.prototype.__action_getLoc = function (loc, x, y, prefix) {
    if (loc) {
        x = core.calValue(loc[0], prefix);
        y = core.calValue(loc[1], prefix);
    }
    return [x,y];
}

events.prototype.__action_getHeroLoc = function (loc, prefix) {
    return this.__action_getLoc(loc, core.getHeroLoc('x'), core.getHeroLoc('y'), prefix);
}

events.prototype.__action_getLoc2D = function (loc, x, y, prefix) {
    if (!(loc && loc[0] instanceof Array))
        loc = [this.__action_getLoc(data.loc, x, y, prefix)];
    return loc;
}

events.prototype.__action_doAsyncFunc = function (isAsync, func) {
    var parameters = Array.prototype.slice.call(arguments, 2);
    if (isAsync) {
        func.apply(this, parameters);
        core.doAction();
    }
    else {
        func.apply(this, parameters.concat(core.doAction));
    }
}

events.prototype._action_text = function (data, x, y, prefix) {
    if (this.__action_checkReplaying()) return;
    core.ui.drawTextBox(data.text, data.showAll);
}

events.prototype._action_autoText = function (data, x, y, prefix) {
    if (this.__action_checkReplaying()) return;
    core.ui.drawTextBox(data.text);
    setTimeout(core.doAction, data.time || 3000);
}

events.prototype._action_scrollText = function (data, x, y, prefix) {
    if (this.__action_checkReplaying()) return;
    this.__action_doAsyncFunc(data.async, core.ui.drawScrollText, data.text, data.time || 5000);
}

events.prototype._action_comment = function (data, x, y, prefix) {
    core.doAction();
}

events.prototype._action_setText = function (data, x, y, prefix) {
    ["position", "offset", "bold", "titlefont", "textfont", "time"].forEach(function (t) {
        if (core.isset(data[t])) core.status.textAttribute[t]=data[t];
    });
    ["background", "title", "text"].forEach(function (t) {
        if (core.isset(data[t]) && (data[t] instanceof Array) && data[t].length>=3) {
            if (data[t].length==3) data[t].push(1);
            core.status.textAttribute[t]=data[t];
        }
        if (t=='background' && core.isset(data[t])) {
            var img = core.material.images.images[data[t]];
            if (core.isset(img) && img.width==192 && img.height==128) {
                core.status.textAttribute[t]=data[t];
            }
        }
    });
    core.setFlag('textAttribute', core.status.textAttribute);
    core.doAction();
}

events.prototype._action_tip = function (data, x, y, prefix) {
    core.drawTip(core.replaceText(data.text));
    core.doAction();
}

events.prototype._action_show = function (data, x, y, prefix) {
    data.loc = this.__action_getLoc2D(data.loc, x, y, prefix);
    if (data.time>0 && !(data.floorId && data.floorId != core.status.floorId)) {
        this.__action_doAsyncFunc(data.async, core.animateBlock, data.loc, 'show', data.time);
    }
    else {
        data.loc.forEach(function (t) {
            core.showBlock(t[0], t[1], data.floorId);
        });
        core.doAction();
    }
}

events.prototype._action_hide = function (data, x, y, prefix) {
    data.loc = this.__action_getLoc2D(data.loc, x, y, prefix);
    if (data.time>0 && !(data.floorId && data.floorId != core.status.floorId)) {
        data.loc.forEach(function (t) {
            core.hideBlock(t[0], t[1], data.floorId);
        });
        this.__action_doAsyncFunc(data.async, core.animateBlock, data.loc, 'hide', data.time);
    }
    else {
        data.loc.forEach(function (t) {
            core.removeBlock(t[0],t[1],data.floorId)
        });
        core.doAction();
    }
}

events.prototype._action_setBlock = function (data, x, y, prefix) {
    var loc = this.__action_getLoc(data.loc, x, y, prefix);
    core.setBlock(data.number, loc[0], loc[1], data.floorId);
    core.doAction();
}

events.prototype._action_showFloorImg = function (data, x, y, prefix) {
    core.maps.showFloorImage(this.__action_getLoc2D(data.loc, x, y, prefix), data.floorId, core.doAction);
}

events.prototype._action_hideFloorImg = function (data, x, y, prefix) {
    core.maps.hideFloorImage(this.__action_getLoc2D(data.loc, x, y, prefix), data.floorId, core.doAction);
}

events.prototype._action_showBgFgMap = function (data, x, y, prefix) {
    core.maps.showBgFgMap(data.name, this.__action_getLoc2D(data.loc, x, y, prefix), data.floorId, core.doAction)
}

events.prototype._action_hideBgFgMap = function (data, x, y, prefix) {
    core.maps.hideBgFgMap(data.name, this.__action_getLoc2D(data.loc, x, y, prefix), data.floorId, core.doAction);
}

events.prototype._action_setBgFgBlock = function (data, x, y, prefix) {
    var loc = this.__action_getLoc(data.loc, x, y, prefix);
    core.setBgFgBlock(data.name, data.number, loc[0], loc[1], data.floorId);
    core.doAction();
}

events.prototype._action_follow = function (data, x, y, prefix) {
    this.follow(data.name);
    core.doAction();
}

events.prototype._action_unfollow = function (data, x, y, prefix) {
    this.unfollow(data.name);
    core.doAction();
}

events.prototype._action_animate = function (data, x, y, prefix) {
    if (data.loc == 'hero') data.loc = [core.getHeroLoc('x'), core.getHeroLoc('y')];
    else data.loc = this.__action_getLoc(data.loc, x, y, prefix);
    this.__action_doAsyncFunc(data.async, core.drawAnimate, data.name, data.loc[0], data.loc[1]);
}

events.prototype._action_move = function (data, x, y, prefix) {
    var loc = this.__action_getLoc(data.loc, x, y, prefix);
    this.__action_doAsyncFunc(data.async, core.moveBlock, loc[0], loc[1], data.steps, data.time, data.keep);
}

events.prototype._action_moveHero = function (data, x, y, prefix) {
    this.__action_doAsyncFunc(data.async, core.eventMoveHero, data.steps, data.time);
}

events.prototype._action_jump = function (data, x, y, prefix) {
    var from = this.__action_getLoc(data.from, x, y, prefix),
        to = this.__action_getLoc(data.to, x, y, prefix);
    this.__action_doAsyncFunc(data.async, core.jumpBlock, from[0], from[1], to[0], to[1], data.time, data.keep);
}

events.prototype._action_jumpHero = function (data, x, y, prefix) {
    var loc = this.__action_getHeroLoc(data.loc, prefix);
    this.__action_doAsyncFunc(data.async, core.jumpHero, loc[0], loc[1], data.time);
}

events.prototype._action_changeFloor = function (data, x, y, prefix) {
    var loc = this.__action_getHeroLoc(data.loc, prefix);
    var heroLoc = {x: loc[0], y: loc[1], direction: data.direction};
    core.changeFloor(data.floorId || core.status.floorId, null, heroLoc, data.time, function() {
        core.lockControl();
        core.doAction();
    });
}

events.prototype._action_changePos = function (data, x, y, prefix) {
    core.clearMap('hero');
    var loc = this.__action_getHeroLoc(data.loc, prefix);
    core.setHeroLoc('x', loc[0]);
    core.setHeroLoc('y', loc[1]);
    if (data.direction) core.setHeroLoc('direction', data.direction);
    core.drawHero();
    core.doAction();
}

events.prototype._action_showImage = function (data, x, y, prefix) {
    var loc = this.__action_getLoc(data.loc, 0, 0, prefix);
    if (core.isReplaying()) data.time = 0;
    var image = core.material.images.images[data.image];
    if (!core.isset(image)) return core.doAction();
    this.__action_doAsyncFunc(data.async || data.time == 0, this.showImage,
        data.code, image, loc[0], loc[1], data.dw, data.dh, data.opacity, data.time);
}

events.prototype._action_showTextImage = function (data, x, y, prefix) {
    var loc = this.__action_getLoc(data.loc, 0, 0, prefix);
    if (core.isReplaying()) data.time = 0;
    this.__action_doAsyncFunc(data.async || data.time == 0, this.showImage,
        data.code, this.textImage(data.text), loc[0], loc[1], 100, 100, data.opacity, data.time);
}

events.prototype._action_hideImage = function (data, x, y, prefix) {
    if (core.isReplaying()) data.time = 0;
    this.__action_doAsyncFunc(data.async || data.time == 0, this.hideImage, data.code, data.time);
}

events.prototype._action_showGif = function (data, x, y, prefix) {
    var loc = this.__action_getLoc(data.loc, 0, 0, prefix);
    this.showGif(data.name, loc[0], loc[1]);
    core.doAction();
}

events.prototype._action_moveImage = function (data, x, y, prefix) {
    if (this.__action_checkReplaying()) return;
    this.__action_doAsyncFunc(data.async, this.moveImage, data.code, data.to, data.opacity, data.time);
}

events.prototype._action_setFg = function (data, x, y, prefix) {
    if (data.async) {
        core.setFg(data.color, data.time);
        core.setFlag('__color__', data.color || null);
        core.doAction();
    }
    else {
        core.setFg(data.color, data.time, function() {
            core.setFlag('__color__', data.color || null);
            core.doAction();
        });
    }
}

events.prototype._action_screenFlash = function (data, x, y, prefix) {
    this.__action_doAsyncFunc(data.async, core.screenFlash, data.color, data.time, data.times);
}

events.prototype._action_setWeather = function (data, x, y, prefix) {
    core.setWeather(data.name, data.level);
    if (data.name == 'rain' || data.name == 'snow' || data.name == 'fog')
        core.setFlag('__weather__', [data.name, data.level]);
    else core.removeFlag('__weather__');
    core.doAction();
}

events.prototype._action_openDoor = function (data, x, y, prefix) {
    var loc = this.__action_getLoc(data.loc, x, y, prefix);
    var floorId = data.floorId || core.status.floorId;
    if (floorId == core.status.floorId) {
        var _callback = function () {
            core.lockControl();
            core.doAction();
        }
        if (!core.openDoor(null, loc[0], loc[1], data.needKey, _callback))
            _callback();
    }
    else {
        core.removeBlock(loc[0], loc[1], floorId);
        core.doAction();
    }
}

events.prototype._action_useItem = function (data, x, y, prefix) {
    // 考虑到可能覆盖楼传事件的问题，这里不对fly进行检查。
    if (data.id != 'book' && core.canUseItem(data.id)) {
        core.useItem(data.id, true, core.doAction);
    }
    else {
        core.drawTip("当前无法使用"+((core.material.items[data.id]||{}).name||"未知道具"));
        core.doAction();
    }
}

events.prototype._action_openShop = function (data, x, y, prefix) {
    if (core.isReplaying()) { // 正在播放录像，简单将visited置为true
        core.status.shops[data.id].visited = true;
        this.setEvents([]);
        core.doAction();
    }
    else
        this.openShop(data.id);
}

events.prototype._action_disableShop = function (data, x, y, prefix) {
    this.disableQuickShop(data.id);
    core.doAction();
}

events.prototype._action_battle = function (data, x, y, prefix) {
    this.battle(data.id, null, null, true, core.doAction);
}

events.prototype._action_trigger = function (data, x, y, prefix) {
    var loc = this.__action_getLoc(data.loc, x, y, prefix);
    var block = core.getBlock(loc[0], loc[1]);
    if (block != null && block.block.event.trigger) {
        block = block.block;
        this.setEvents([], block.x, block.y);
        if (block.event.trigger == 'action')
            this.setEvents(block.event.data);
        else {
            core.doSystemEvent(block.event.trigger, block, function () {
                core.lockControl();
                core.doAction();
            });
            return;
        }
    }
    core.doAction();
}

events.prototype._action_insert = function (data, x, y, prefix) {
    if (core.isset(data.name)) { // 公共事件
        core.insertAction(this.getCommonEvent(data.name));
    }
    else {
        var loc = this.__action_getLoc(data.loc, x, y, prefix);
        var floorId = data.floorId || core.status.floorId;
        var event = core.floors[floorId].events[loc[0]+","+loc[1]];
        if (core.isset(event)) {
            if (core.isset(event.data)) event = event.data;
            this.insertAction(event);
        }
    }
    core.doAction();
}

events.prototype._action_playBgm = function (data, x, y, prefix) {
    core.playBgm(data.name);
    core.doAction();
}

events.prototype._action_pauseBgm = function (data, x, y, prefix) {
    core.pauseBgm();
    core.doAction();
}

events.prototype._action_resumeBgm = function (data, x, y, prefix) {
    core.resumeBgm();
    core.doAction();
}

events.prototype._action_loadBgm = function (data, x, y, prefix) {
    core.loadBgm(data.name);
    core.doAction();
}

events.prototype._action_freeBgm = function (data, x, y, prefix) {
    core.freeBgm(data.name);
    core.doAction();
}

events.prototype._action_playSound = function (data, x, y, prefix) {
    core.playSound(data.name);
    core.doAction();
}

events.prototype._action_stopSound = function (data, x, y, prefix) {
    core.stopSound();
    core.doAction();
}

events.prototype._action_setVolume = function (data, x, y, prefix) {
    data.value = core.clamp(parseInt(data.value)/100, 0, 1);
    core.setFlag("__volume__", data.value);
    this.__action_doAsyncFunc(data.async, this.setVolume, data.value, data.time || 0);
}

events.prototype._action_setValue = function (data, x, y, prefix) {
    this.setValue(data.name, data.value, prefix);
    core.doAction();
}

events.prototype._action_setValue2 = function (data, x, y, prefix) {
    this.setValue2(data.name, data.value, prefix);
    core.doAction();
}

events.prototype._action_setFloor = function (data, x, y, prefix) {
    this.setFloorInfo(data.name, data.value, data.floorId, prefix);
    core.doAction();
}

events.prototype._action_setGlobalAttribute = function (data, x, y, prefix) {
    this.setGlobalAttribute(data.name, data.value);
    core.doAction();
}

events.prototype._action_setGlobalValue = function (data, x, y, prefix) {
    core.values[data.name] = data.value;
    core.doAction();
}

events.prototype._action_setGlobalFlag = function (data, x, y, prefix) {
    this.setGlobalFlag(data.name, data.value);
    core.doAction();
}

events.prototype._action_setHeroIcon = function (data, x, y, prefix) {
    this.setHeroIcon(data.name);
    core.doAction();
}

events.prototype._action_input = function (data, x, y, prefix) {
    var value = this.__action_getInput(data.text, false);
    if (value == null) return;
    value = Math.abs(parseInt(value)||0);
    core.status.route.push("input:" + value);
    core.setFlag("input", value);
    core.doAction();
}

events.prototype._action_input2 = function (data, x, y, prefix) {
    var value = this.__action_getInput(data.text, true);
    if (value == null) return;
    core.status.route.push("input2:" + core.encodeBase64(value));
    core.setFlag("input", value);
    core.doAction();
}

events.prototype.__action_getInput = function (hint, isText) {
    var value, prefix = isText?"input2:":"input:";
    if (core.isReplaying()) {
        var action = core.status.replay.toReplay.shift();
        try {
            if (action.indexOf(prefix)!=0)
                throw new Error("录像文件出错！当前需要一个 "+prefix+" 项，实际为 "+action);
            if (isText) value = core.decodeBase64(action.substring(7));
            else value = parseInt(action.substring(6));
        }
        catch (e) {
            main.log(e);
            core.stopReplay();
            core.insertAction(["录像文件出错，请在控制台查看报错信息。", {"type":"exit"}]);
            core.doAction();
            return null;
        }
    }
    else {
        core.interval.onDownInterval = 'tmp';
        value = prompt(core.replaceText(hint));
        if (!core.isset(value)) value="";
    }
    return value;
}

events.prototype._action_if = function (data, x, y, prefix) {
    if (core.calValue(data.condition, prefix))
        core.events.insertAction(data["true"])
    else
        core.events.insertAction(data["false"])
    core.doAction();
}

events.prototype._action_switch = function (data, x, y, prefix) {
    var key = core.calValue(data.condition, prefix)
    for (var i = 0; i < data.caseList.length; i++) {
        var condition = data.caseList[i]["case"];
        if (condition == "default" || core.calValue(condition, prefix) == key) {
            this.insertAction(data.caseList[i].action);
            break;
        }
    }
    core.doAction();
}

events.prototype._action_choices = function (data, x, y, prefix) {
    if (core.isReplaying()) {
        var action = core.status.replay.toReplay.shift(), index;
        // --- 忽略可能的turn事件
        if (action == 'turn') action = core.status.replay.toReplay.shift();
        if (action.indexOf("choices:")==0 && ((index=parseInt(action.substring(8)))>=0) && index<data.choices.length) {
            core.status.event.selection=index;
            setTimeout(function () {
                core.status.route.push("choices:"+index);
                core.insertAction(data.choices[index].action);
                core.doAction();
            }, 750 / Math.max(1, core.status.replay.speed))
        }
        else {
            main.log("录像文件出错！当前需要一个 choices: 项，实际为 "+action);
            core.stopReplay();
            core.insertAction(["录像文件出错，请在控制台查看报错信息。", {"type":"exit"}]);
            core.doAction();
            return;
        }
    }
    core.ui.drawChoices(data.text, data.choices);
}

events.prototype._action_while = function (data, x, y, prefix) {
    if (core.calValue(data.condition, prefix)) {
        core.unshift(core.status.event.data.list,
            {"todo": core.clone(data.data), "total": core.clone(data.data), "condition": data.condition}
        );
    }
    core.doAction();
}

events.prototype._action_break = function (data, x, y, prefix) {
    core.status.event.data.list.shift();
    core.doAction();
}

events.prototype._action_continue = function (data, x, y, prefix) {
    if (core.calValue(core.status.event.data.list[0].condition, prefix)) {
        core.status.event.data.list[0].todo = core.clone(core.status.event.data.list[0].total);
    }
    else {
        core.status.event.data.list.shift();
    }
    core.doAction();
}

events.prototype._action_win = function (data, x, y, prefix) {
    this.win(data.reason, data.norank);
}

events.prototype._action_lose = function (data, x, y, prefix) {
    this.lose(data.reason);
}

events.prototype._action_function = function (data, x, y, prefix) {
    var func = data["function"];
    try {
        if (typeof func == "string" && func.indexOf("function")==0) {
            eval('('+func+')()');
        }
    } catch (e) {
        main.log(e);
    }
    if (!data.async)
        core.doAction();
}

events.prototype._action_update = function (data, x, y, prefix) {
    core.updateStatusBar();
    core.doAction();
}

events.prototype._action_showStatusBar = function (data, x, y, prefix) {
    core.control.triggerStatusBar("show");
    core.doAction();
}

events.prototype._action_hideStatusBar = function (data, x, y, prefix) {
    core.control.triggerStatusBar("hide", data.toolbox);
    core.doAction();
}

events.prototype._action_updateEnemys = function (data, x, y, prefix) {
    core.enemys.updateEnemys();
    core.updateStatusBar();
    core.doAction();
}

events.prototype._action_vibrate = function (data, x, y, prefix) {
    this.__action_doAsyncFunc(data.async, this.vibrate, data.time);
}

events.prototype._action_sleep = function (data, x, y, prefix) {
    core.timeout.sleepTimeout = setTimeout(function() {
        core.timeout.sleepTimeout = null;
        core.doAction();
    }, core.isReplaying()?Math.min(data.time, 20):data.time);
}

events.prototype._action_wait = function (data, x, y, prefix) {
    if (core.isReplaying()) {
        var code = core.status.replay.toReplay.shift();
        if (code.indexOf("input:")==0) {
            var value = parseInt(code.substring(6));
            core.status.route.push("input:"+value);
            this.__action_wait_getValue(value);
        }
        else {
            main.log("录像文件出错！当前需要一个 input: 项，实际为 "+code);
            core.stopReplay();
            core.insertAction(["录像文件出错，请在控制台查看报错信息。", {"type":"exit"}]);
        }
        core.doAction();
        return;
    }
}

events.prototype.__action_wait_getValue = function (value) {
    if (value >= 1000000) {
        core.setFlag('type', 1);
        var px = parseInt((value - 1000000) / 1000), py = value % 1000;
        core.setFlag('px', px);
        core.setFlag('py', py);
        core.setFlag('x', parseInt(px / 32));
        core.setFlag('y', parseInt(py / 32));
    }
    else if (value >= 10000) {
        core.setFlag('type', 1);
        var x = parseInt((value - 10000) / 100), y = value % 100;
        core.setFlag('px', 32 * x + 16);
        core.setFlag('py', 32 * y + 16);
        core.setFlag('x', x);
        core.setFlag('y', y);
    }
    else if (value > 0) {
        core.setFlag('type', 0);
        core.setFlag('keycode', value);
    }
}

events.prototype._action_waitAsync = function (data, x, y, prefix) {
    var test = window.setInterval(function () {
        if (Object.keys(core.animateFrame.asyncId).length == 0) {
            clearInterval(test);
            core.doAction();
        }
    }, 50);
}

events.prototype._action_revisit = function (data, x, y, prefix) {
    var block = core.getBlock(x, y);
    if (block != null && block.block.event.trigger == 'action')
        this.setEvents(block.block.event.data);
    core.doAction();
}

events.prototype._action_callBook = function (data, x, y, prefix) {
    if (core.isReplaying() || !core.hasItem('book')) {
        core.doAction();
    }
    else {
        var e = core.clone(core.status.event.data);
        core.ui.closePanel();
        core.openBook();
        core.status.event.interval = e;
    }
}

events.prototype._action_callSave = function (data, x, y, prefix) {
    if (core.isReplaying() || core.hasFlag("__events__")) {
        core.removeFlag("__events__");
        core.doAction();
    }
    else {
        var e = core.clone(core.status.event.data);
        core.ui.closePanel();
        core.save();
        core.status.event.interval = e;
    }
}

events.prototype._action_callLoad = function (data, x, y, prefix) {
    if (this.__action_checkReplaying()) return;
    var e = core.clone(core.status.event.data);
    core.ui.closePanel();
    core.load();
    core.status.event.interval = e;
}

events.prototype._action_exit = function (data, x, y, prefix) {
    this.setEvents([]);
    core.doAction();
}

// ------ 样板提供的的自定义事件 END ------ //

events.prototype.follow = function (name) {
    core.status.hero.followers = core.status.hero.followers || [];
    if (core.isset(core.material.images.images[name])
        && core.material.images.images[name].width==128) {
        core.status.hero.followers.push({"img": name});
        core.control.gatherFollowers();
        core.clearMap('hero');
        core.drawHero();
    }
}

events.prototype.unfollow = function (name) {
    core.status.hero.followers = core.status.hero.followers || [];
    if (!core.isset(name)) {
        core.status.heroMoving.followers = [];
    }
    else {
        for (var i = 0; i < core.status.hero.followers.length; i++) {
            if (core.status.hero.followers[i].img == name) {
                core.status.hero.followers.splice(i, 1);
                break;
            }
        }
    }
    core.control.gatherFollowers();
    core.clearMap('hero');
    core.drawHero();
}

events.prototype.showGif = function (name, x, y) {
    var image = core.material.images.images[name];
    if (image) {
        var gif = new Image();
        gif.src = image.src;
        gif.style.position = 'absolute';
        gif.style.left = x * core.domStyle.scale + "px";
        gif.style.top = y * core.domStyle.scale + "px";
        gif.style.width = image.width * core.domStyle.scale + "px";
        gif.style.height = image.height * core.domStyle.scale + "px";
        core.dom.gif2.appendChild(gif);
    }
    else {
        core.dom.gif2.innerHTML = "";
    }
}

events.prototype.setValue = function (name, value, prefix, add) {
    var value = core.calValue(value, prefix);
    if (add) value += core.calValue(name, prefix);
    this._setValue_setStatus(name, value);
    this._setValue_setItem(name, value);
    this._setValue_setFlag(name, value);
    this._setValue_setSwitch(name, value);
    core.updateStatusBar();
}

events.prototype._setValue_setStatus = function (name, value) {
    if (name.indexOf("status:") !== 0) return;
    core.setStatus(name.substring(7), value);
    if (core.status.hero.hp <= 0) {
        core.status.hero.hp = 0;
        core.updateStatusBar();
        core.events.lose();
    }
}

events.prototype._setValue_setItem = function (name, value) {
    if (name.indexOf("item:") !== 0) return;
    var itemId = name.substring(5), count = core.itemCount(itemId);
    if (value > count) core.getItem(itemId, value - count);
    else core.setItem(itemId, value);
}

events.prototype._setValue_setFlag = function (name, value) {
    if (name.indexOf("flag:") !== 0) return;
    core.setFlag(name.substring(5), value);
}

events.prototype._setValue_setSwitch = function (name, value, prefix) {
    if (name.indexOf("switch:") !==0 ) return;
    core.setFlag((prefix||"f@x@y")+"@"+data.name.substring(7), value);
}

events.prototype.setValue2 = function (name, value, prefix) {
    this.setValue(name, value, prefix, true);
}

events.prototype.setFloorInfo = function (name, value, floorId, prefix) {
    floorId = floorId || data.floorId;
    core.status.maps[floorId][name] = core.calValue(value, prefix);
    core.updateStatusBar();
}

events.prototype.setGlobalAttribute = function (name, value) {
    if (typeof value == 'string') {
        if ((value.charAt(0)=='"' && value.charAt(value.length-1)=='"')
            || (value.charAt(0)=="'" && value.charAt(value.length-1)=="'"))
            value = value.substring(1, value.length-1);
        // --- 检查 []
        if (value.charAt(0) == '[' && value.charAt(value.length-1)==']')
            value = eval(value);
    }
    core.status.globalAttribute[name] = value;
    core.control.updateGlobalAttribute(name);
    core.setFlag('globalAttribute', core.status.globalAttribute);
}

events.prototype.setGlobalFlag = function (name, value) {
    var flags = core.getFlag("globalFlags", {});
    flags[name] = value;
    core.flags[name] = value;
    core.setFlag("globalFlags", flags);
    core.resize();
}

events.prototype.setFloorName = function (floorId) {
    floorId = floorId || core.status.floorId;
    if (!core.isset(floorId)) return;
    // 根据文字判断是否斜体
    var floorName = core.status.maps[floorId].name || "";
    if (typeof floorName == 'number') floorName = ""+floorName;
    if (!core.isset(floorName) || floorName=="") floorName="&nbsp;"
    if (core.statusBar.floor.innerHTML == floorName) return;
    core.statusBar.floor.innerHTML = floorName;
    if (/^[+-]?\d+$/.test(floorName)) {
        core.statusBar.floor.style.fontStyle = 'italic';
        core.statusBar.floor.style.fontSize = '1.1em';
    }
    else {
        core.statusBar.floor.style.fontStyle = 'normal';
        if (floorName.length<=5)
            core.statusBar.floor.style.fontSize = '1.1em';
        else if (floorName.length==6)
            core.statusBar.floor.style.fontSize = '0.9em';
        else
            core.statusBar.floor.style.fontSize = '0.7em';
    }
}

////// 显示图片 //////
events.prototype.showImage = function (code, image, x, y, dw, dh, opacityVal, time, callback) {
    dw /= 100;
    dh /= 100;
    x = core.calValue(x) || 0;
    y = core.calValue(y) || 0;
    var zIndex = code + 100;
    time = time || 0;
    var name = "image"+ zIndex;
    var ctx = core.createCanvas(name, x, y, image.width * dw, image.height * dh, zIndex);

    ctx.drawImage(image, 0, 0, image.width * dw, image.height * dh);
    if (time == 0)
        core.setOpacity(name, opacityVal);
    else {
        var per_time = 10, steps = parseInt(time / per_time), per_add = opacityVal / steps;
        var opacity = 0;
        core.setOpacity(name, 0);
        var animate = setInterval(function () {
            opacity += per_add;
            core.setOpacity(name, opacity);
            if (opacity >= opacityVal) {
                delete core.animateFrame.asyncId[animate];
                clearInterval(animate);
                core.setOpacity(name, opacityVal);
                if (core.isset(callback)) callback();
            }
        }, per_time);

        core.animateFrame.asyncId[animate] = true;
    }
}

////// 隐藏图片 //////
events.prototype.hideImage = function (code, time, callback) {
    time = time || 0;
    var name = "image"+ (code+100);
    if (!core.isset(core.dymCanvas[name])) {
        if (core.isset(callback)) callback();
        return;
    }
    if (time == 0)
        core.deleteCanvas(name);
    else {
        var opacityVal = parseFloat(core.dymCanvas[name].canvas.style.opacity);
        var per_time = 10, steps = parseInt(time / per_time), per_add = opacityVal / steps;
        var animate = setInterval(function () {
            opacityVal -= per_add;
            core.setOpacity(name, opacityVal);
            if (opacityVal < 0) {
                delete core.animateFrame.asyncId[animate];
                clearInterval(animate);
                core.deleteCanvas(name);
                if (core.isset(callback)) callback();
            }
        }, per_time);

        core.animateFrame.asyncId[animate] = true;
    }
}

////// 文本图片化 //////
events.prototype.textImage = function (content) {
    content = content || "";

    // 获得颜色的盒子等信息
    var textAttribute = core.status.textAttribute || core.initStatus.textAttribute;
    var textfont = textAttribute.textfont || 16;
    var offset = textAttribute.offset || 15;
    var textColor = core.arrayToRGBA(textAttribute.text);

    var font = textfont+"px "+core.status.globalAttribute.font;
    if (textAttribute.bold) font = "bold "+font;
    var contents = core.splitLines('ui', content), lines = contents.length;

    // 计算总高度，按1.4倍行距计算
    var width = 416, height = textfont * 1.4 * lines;
    var tempCanvas = core.bigmap.tempCanvas;
    tempCanvas.canvas.width = width;
    tempCanvas.canvas.height = height;
    tempCanvas.clearRect(0, 0, width, height);
    tempCanvas.font = font;
    tempCanvas.fillStyle = textColor;

    // 全部绘制
    var currH = textfont;
    for (var i = 0; i < lines; ++i) {
        var text = contents[i];
        tempCanvas.fillText(text, offset, currH);
        currH += 1.4 * textfont;
    }
    
    return tempCanvas.canvas;
}

////// 移动图片 //////
events.prototype.moveImage = function (code, to, opacityVal, time, callback) {
    time = time || 1000;

    var name = "image"+ (code+100);
    if (!core.isset(core.dymCanvas[name])) {
        if (core.isset(callback)) callback();
        return;
    }
    var fromX = parseFloat(core.dymCanvas[name].canvas.getAttribute("_left")),
        fromY = parseFloat(core.dymCanvas[name].canvas.getAttribute("_top")),
        preX = fromX, preY = fromY, toX = fromX, toY = fromY;

    if (core.isset(to)) {
        toX = core.calValue(to[0]);
        toY = core.calValue(to[1]);
        if (!core.isset(toX)) toX = fromX;
        if (!core.isset(toY)) toY = fromY;
    }

    var step = 0;
    var per_time = 10, steps = parseInt(time / per_time);
    var preOpac = parseFloat(core.dymCanvas[name].canvas.style.opacity), opacStep = 0;
    if (core.isset(opacityVal)) {
        opacityVal = core.calValue(opacityVal);
        opacStep = (opacityVal - preOpac) / steps;
    }
    
    var moveStep = function () {
        preOpac += opacStep;
        core.setOpacity(name, preOpac);
        preX = parseInt(fromX + (toX-fromX)*step/steps);
        preY = parseInt(fromY + (toY-fromY)*step/steps);
        core.relocateCanvas(name, preX, preY);
    }
    var animate = setInterval(function () {
        step++;
        moveStep();
        if (step == steps) {
            if (core.isset(opacityVal))
                core.setOpacity(name, opacityVal);
            delete core.animateFrame.asyncId[animate];
            clearInterval(animate);
            if (core.isset(callback)) callback();
        }
    }, per_time);

    core.animateFrame.asyncId[animate] = true;
}

////// 淡入淡出音乐 //////
events.prototype.setVolume = function (value, time, callback) {

    var set = function (value) {
        core.musicStatus.volume = value;
        if (core.isset(core.musicStatus.playingBgm)) {
            core.material.bgms[core.musicStatus.playingBgm].volume = value;
        }
        // core.musicStatus.gainNode.gain.value = value;
    }

    if (!core.isset(time) || time<100) {
        set(value);
        if (core.isset(callback)) callback();
        return;
    }

    var currVolume = core.musicStatus.volume;
    var per_time = 10, step = 0, steps = parseInt(time / per_time);
    var fade = setInterval(function () {
        step++;
        var nowVolume = currVolume+(value-currVolume)*step/steps;
        set(nowVolume);
        if (step>=steps) {
            delete core.animateFrame.asyncId[fade];
            clearInterval(fade);
            if (core.isset(callback))
                callback();
        }
    }, per_time);

    core.animateFrame.asyncId[fade] = true;
}

////// 画面震动 //////
events.prototype.vibrate = function(time, callback) {

    if (core.isReplaying()) {
        if (core.isset(callback)) callback();
        return;
    }

    // core.status.replay.animate=true;

    var addGameCanvasTranslate=function(x,y){
        for(var ii=0,canvas;canvas=core.dom.gameCanvas[ii];ii++){
            var id = canvas.getAttribute('id');
            if (id=='ui' || id=='data') continue;
            var offsetX = x, offsetY = y;
            if (core.bigmap.canvas.indexOf(id)>=0) {
                offsetX-=core.bigmap.offsetX;
                offsetY-=core.bigmap.offsetY;
            }
            core.control.setGameCanvasTranslate(id, offsetX, offsetY);
        }
    }

    if (!core.isset(time) || time<1000) time=1000;

    var shake_duration = time*3/50;
    var shake_speed = 5;
    var shake_power = 5;
    var shake_direction = 1;
    var shake = 0;

    var update = function() {
        if(shake_duration >= 1 || shake != 0){
            var delta = (shake_power * shake_speed * shake_direction) / 10.0;
            if(shake_duration <= 1 && shake * (shake + delta) < 0){
                shake = 0;
            }else{
                shake += delta;
            }
            if(shake > shake_power * 2){
                shake_direction = -1;
            }
            if(shake < - shake_power * 2){
                shake_direction = 1;
            }
            if(shake_duration >= 1){
                shake_duration -= 1
            }
        }
    }

    var animate=setInterval(function(){
        update();
        addGameCanvasTranslate(shake, 0);
        if(shake_duration===0) {
            delete core.animateFrame.asyncId[animate];
            clearInterval(animate);
            // core.status.replay.animate=false;
            if (core.isset(callback)) callback();
        }
    }, 50/3);

    core.animateFrame.asyncId[animate] = true;
}

////// 打开一个全局商店 //////
events.prototype.openShop = function(shopId, needVisited) {
    var shop = core.status.shops[shopId];
    shop.times = shop.times || 0;
    if (shop.commonTimes)
        shop.times = core.getFlag('commonTimes', 0);
    shop.visited = shop.visited || false;

    if (needVisited && !shop.visited) {
        if (!core.flags.enableDisabledShop) {
            if (shop.times==0) core.drawTip("该商店尚未开启");
            else core.drawTip("该商店已失效");
            return;
        }
        else {
            core.drawTip("该商店尚未开启，只能浏览不可使用");
        }
    }
    else shop.visited = true;

    var selection = core.status.event.selection;
    var actions = [];
    if (core.isset(core.status.event.data) && core.isset(core.status.event.data.actions))
        actions=core.status.event.data.actions;
    var fromList;
    if (core.isset(core.status.event.data) && core.isset(core.status.event.data.fromList))
        fromList = core.status.event.data.fromList;

    core.ui.closePanel();
    core.lockControl();
    // core.status.event = {'id': 'shop', 'data': {'id': shopId, 'shop': shop}};
    core.status.event.id = 'shop';
    core.status.event.data = {'id': shopId, 'shop': shop, 'actions': actions, 'fromList': fromList};
    core.status.event.selection = selection;

    // 拼词
    var content = "\t["+shop.name+","+shop.icon+"]";
    var times = shop.times, need=core.calValue(shop.need, null, null, times);

    content += core.replaceText(shop.text, need, times);

    var use = shop.use=='experience'?'经验':'金币';

    var choices = [];
    for (var i=0;i<shop.choices.length;i++) {
        var choice = shop.choices[i];
        var text = core.replaceText(choice.text, need, times);
        if (core.isset(choice.need))
            text += "（"+core.calValue(choice.need, null, null, times)+use+"）";
        choices.push({"text": text, "color":shop.visited?null:"#999999"});
    }
    choices.push("离开");
    core.ui.drawChoices(content, choices);
}

events.prototype._useShop = function (shop, index) {
    // 检查能否使用快捷商店
    var reason = core.events.canUseQuickShop(shop.id);
    if (core.isset(reason)) {
        core.drawText(reason);
        return false;
    }
    if (!shop.visited) {
        if (shop.times==0) core.drawTip("该商店尚未开启");
        else core.drawTip("该商店已失效");
        return false;
    }

    var money = core.getStatus('money'), experience = core.getStatus('experience');
    var times = shop.times, need = core.calValue(shop.need, null, null, times);
    var use = shop.use;
    var use_text = use=='money'?"金币":"经验";

    var choice = shop.choices[index];
    if (core.isset(choice.need))
        need = core.calValue(choice.need, null, null, times);

    if (need > eval(use)) {
        core.drawTip("你的"+use_text+"不足");
        return false;
    }

    core.status.event.selection = index;
    core.status.event.data.actions.push(index);

    eval(use+'-='+need);
    core.setStatus('money', money);
    core.setStatus('experience', experience);

    // 更新属性
    choice.effect.split(";").forEach(function (t) {
        core.doEffect(t, need, times);
    });
    core.updateStatusBar();
    shop.times++;
    if (shop.commonTimes)
        core.setFlag('commonTimes', shop.times);
    core.events.openShop(shop.id);
    return true;
}

events.prototype._exitShop = function () {
    if (core.status.event.data.actions.length>0) {
        core.status.route.push("shop:"+core.status.event.data.id+":"+core.status.event.data.actions.join(""));
    }
    core.status.event.data.actions = [];
    core.status.boxAnimateObjs = [];
    if (core.status.event.data.fromList)
        core.ui.drawQuickShop();
    else
        core.ui.closePanel();
}

////// 禁用一个全局商店 //////
events.prototype.disableQuickShop = function (shopId) {
    core.status.shops[shopId].visited = false;
}

////// 能否使用快捷商店 //////
events.prototype.canUseQuickShop = function(shopId) {
    return this.eventdata.canUseQuickShop(shopId);
}

////// 设置角色行走图 //////
events.prototype.setHeroIcon = function (name, noDraw) {
    if (core.isset(core.material.images.images[name]) && core.material.images.images[name].width==128) {
        core.setFlag("heroIcon", name);
        core.material.images.hero.onload = function () {
            core.material.icons.hero.height = core.material.images.images[name].height/4;
            core.control.updateHeroIcon(name);
            if (!noDraw) core.drawHero();
        }
        core.material.images.hero.src = core.material.images.images[name].src;
    }
}

////// 检查升级事件 //////
events.prototype.checkLvUp = function () {
    var check = function () {
        if (!core.flags.enableLevelUp || !core.isset(core.firstData.levelUp)
            || core.status.hero.lv>=core.firstData.levelUp.length) return null;
        // 计算下一个所需要的数值
        var next = (core.firstData.levelUp[core.status.hero.lv]||{});
        var need = core.calValue(next.need);
        if (!core.isset(need)) return null;
        if (core.status.hero.experience>=need) {
            // 升级
            core.status.hero.lv++;
            if (next.clear) core.status.hero.experience -= need;
            return next.action||[];
        }
        return null;
    }
    var actions = [];
    while (true) {
        var next = check();
        if (next == null) break;
        actions = actions.concat(next);
    }
    if (actions.length>0) core.insertAction(actions);
}

////// 尝试使用道具 //////
events.prototype.tryUseItem = function(itemId) {
    core.ui.closePanel();

    if (itemId=='book') {
        core.openBook(false);
        return;
    }
    if (itemId=='fly') {
        core.useFly(false);
        return;
    }
    if (itemId=='centerFly') {
        core.lockControl();
        core.status.event.id = 'centerFly';
        var fillstyle = 'rgba(255,0,0,0.5)';
        if (core.canUseItem('centerFly')) fillstyle = 'rgba(0,255,0,0.5)';
        var toX = core.bigmap.width-1 - core.getHeroLoc('x'), toY = core.bigmap.height-1-core.getHeroLoc('y');
        core.drawThumbnail(null, null, {heroLoc: core.status.hero.loc, heroIcon: core.getFlag('heroIcon', "hero.png")},
            {ctx: 'ui', centerX: toX, centerY: toY});
        var offsetX = core.clamp(toX-6, 0, core.bigmap.width-13), offsetY = core.clamp(toY-6, 0, core.bigmap.height-13);
        core.fillRect('ui',(toX-offsetX)*32,(toY-offsetY)*32,32,32,fillstyle);
        core.status.event.data = {"x": toX, "y": toY, "posX": toX-offsetX, "posY": toY-offsetY};
        core.drawTip("请确认当前中心对称飞行器的位置");
        return;
    }

    if (core.canUseItem(itemId))core.useItem(itemId);
    else core.drawTip("当前无法使用"+core.material.items[itemId].name);
}

////// 加点事件 //////
events.prototype.addPoint = function (enemy) {
    return this.eventdata.addPoint(enemy);
}

////// 使用炸弹/圣锤后的事件 //////
events.prototype.afterUseBomb = function () {
    return this.eventdata.afterUseBomb();
}

////// 即将存档前可以执行的操作 //////
events.prototype.beforeSaveData = function (data) {
    return this.eventdata.beforeSaveData(data);
}

////// 读档事件后，载入事件前，可以执行的操作 //////
events.prototype.afterLoadData = function (data) {
    return this.eventdata.afterLoadData(data);
}

////// 上传当前数据 //////
events.prototype.uploadCurrent = function (username) {
    var formData = new FormData();

    formData.append('type', 'score');
    formData.append('name', core.firstData.name);
    formData.append('version', core.firstData.version);
    formData.append('platform', core.platform.isPC?"PC":core.platform.isAndroid?"Android":core.platform.isIOS?"iOS":"");
    formData.append('hard', core.encodeBase64(core.status.hard));
    formData.append('username', core.encodeBase64(username||"current"));
    formData.append('lv', core.status.hero.lv);
    formData.append('hp', Math.min(core.status.hero.hp, Math.pow(2, 63)));
    formData.append('atk', core.status.hero.atk);
    formData.append('def', core.status.hero.def);
    formData.append('mdef', core.status.hero.mdef);
    formData.append('money', core.status.hero.money);
    formData.append('experience', core.status.hero.experience);
    formData.append('steps', core.status.hero.steps);
    formData.append('seed', core.getFlag('__seed__'));
    formData.append('totalTime', Math.floor(core.status.hero.statistics.totalTime/1000));
    formData.append('route', core.encodeRoute(core.status.route));
    formData.append('deler', 'current');
    formData.append('base64', 1);

    core.http("POST", "/games/upload.php", formData);
}
