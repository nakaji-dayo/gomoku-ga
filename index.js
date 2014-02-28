//GAっぽいので五目AI
//しかし初期で遺伝子を持っていないので、これはなんなのか
window.onload = function() {
    var canvases = document.getElementsByTagName('canvas');
    //初期個体
    var ais = [];
    for (var i=0;i<8;i++) {
	var ai=new GAAI();
	ai.name = "ai-"+i;
	ais.push(ai);
    }
    var pairs = [];
    for (var i=0;i<8;i++) {
	for (var j=0;j<8;j++) {
	    if (i != j && i<j) {
		pairs.push([i,j]);
	    }
	}
    }
    var canvas = canvases[0];

    //pairs = [[0,1]];
    var wait = 10;
    var sedai =0;    
    var select=function() {
	for(var i=0;i<8;i++) {
	    ais[i].score=0;
	}
	async.eachSeries(pairs, function(pair,cb) {
	    var ai1 = ais[pair[0]];
	    var ai2 = ais[pair[1]];
	    ai1.game = ai2.game = new Game(canvas);
	    ai1.player = 1;
	    ai2.player = 2;
	    battle(ai1, ai2, function(r) {
		if (r==1) 
		    ai1.score+=1;
		else if (r==2)
		    ai2.score+=1;
		cb();
	    }, wait);
	}, function(err) {
	    for(var i=0;i<8;i++) {
		console.log(ais[i].name,"score", ais[i].score);
	    }
	    var nexts = best2(ais);
	    console.log('nexts',nexts[0].name,nexts[1].name);
console.log('----世代',sedai);
	    ais = [];
	    ais.push(nexts[0]);
	    ais.push(nexts[1]);
	    ais.push(cross(nexts[0], nexts[1]));
	    ais.push(cross(nexts[0], nexts[1]));
	    ais.push(cross(nexts[0], nexts[1]));
	    ais.push(cross(nexts[0], nexts[1]));
	    ais.push(mutation(nexts[0]));
	    ais.push(mutation(nexts[1]));
	    sedai++;
	    select();
	});
    };
    select();

    document.getElementById('speedDown').addEventListener('click', function() {
	wait+=10;
	console.log('wait time', wait);
    });
    document.getElementById('speedUp').addEventListener('click', function() {
	if (wait >= 10)
	    wait-=10;
	console.log('wait time', wait);
    });
};

var battle = function(ai1,ai2, cb, wait) {
    var exec = function() {
	ai1.action();
	ai2.action();
	ai1.game.draw();
	r = ai1.game.check();
	if (r != 0) {
	    //console.log('winner: ', r);
	    cb(r);
	} else {
	    setTimeout(exec, wait);
	}
    };
    var timer = setTimeout(exec, 10);
}
//交配
var cross = function(ai1,ai2) {
    var n = new GAAI();
    var keys = []
    for(var k in ai1.genes) {
	keys.push(k);
    }
    for(var k in ai2.genes) {
	keys.push(k);
    }
//範囲設定
//    var s,e;
    //var toggle = true;
//todo キーは重複しているので無駄
var c1=0,c2=0;
    for(var k in keys) {
	var key = keys[k];
	var v1 = ai1.genes[key];
	var v2 = ai2.genes[key];
	if (v1 && !v2) {
	    n.genes[key] = v1;
	    c1++;
	}
	else if (!v1 && v2) {
	    n.genes[key] = v2;
	    c2++;
	}
	else if (v1 && v2) {//一様
	    if (Math.floor(Math.random()*2) == 0) {
		n.genes[key] = v1;
c1++;
	    } else {
		n.genes[key] = v2;
c2++;
	    }
	    //toggle = !toggle;
	}
    }
    console.log('遺伝した遺伝子数',c1, c2);
    n.name = ai1.name.substr(ai1.name.length/2)+ai2.name.substr(ai2.name.length/2);
    return n;

}
//突然変異
var mutation = function(ai) {
    var n = new GAAI();
    var count = 0;
    for(var k in ai.genes) {
	if (Math.floor(Math.random()*10) != 0) {
	    n.genes[k] = ai.genes[k];
	} else {
	    count++;
	}
    }
    console.log('変異させる遺伝子',count);
    n.name = ai.name.substr(1)+appendName();
    return n;
}

var appendName = function() {
    return Math.floor(Math.random()*10);
}

var best2 = function(ais) {
    var a,b;
    for (var i=0;i<ais.length;i++) {
	var ai = ais[i];
	if (!a) {
	    a = ai;
	} else if (!b) {
	    b = ai;
	} else if (b.score < ai.score) {
	    b = ai;
	} else if (a.score < ai.score) {
	    b = a;
	    a = ai;
	}
    }
    return [a,b];
}

var Game = function(canvas) {
    this.name = canvas.id;

    this.size = 13;
    this.tile = [this.size*this.size];

    this.emps = []
    for (var i=0; i<this.size*this.size;i++) {
	this.tile[i] = 0;
	this.emps.push(i);
    }
    this.cx = canvas.getContext('2d');
}

Game.prototype.put = function(i,p) {
    this.tile[i] = p;
    var index = this.emps.indexOf(i);
    this.emps.splice(index, 1);
}

Game.prototype.check = function() {
    if (this.emps.length == 0) {
	return -1;//draw
    }
    var that = this;

    var r =  this.checkWaker(0,0,function(x,y,reset) {
	if (x+1 >= that.size) {
	    reset();
	    if (y+1 >= that.size) {
		return null;
	    }
	    return {x:0, y:y+1};
	}
	return {x:x+1, y:y};
    });
    if (r != 0) {
	return r;
    }
    r =  this.checkWaker(0,0,function(x,y,reset) {
	if (y+1 >= that.size) {
	    reset();
	    if (x+1 >= that.size) {
		return null;
	    }
	    return {x:x+1, y:0};
	}
	return {x:x, y:y+1};
    });
    if (r != 0) {
	return r;
    }

    var sx=0,sy=0, turn=0;
    r = this.checkWaker(sx, sy, function(x,y,reset) {
	var nx,ny;
	if (turn <= 1) {
	    nx = x+1;
	} else {
	    nx = x-1;
	}
	ny = y+1;
	if (nx >= that.size || ny >= that.size || nx <0 || ny <0) {
	    reset();
	    if(turn == 0) {
		sy++;
		if (sy >= that.size) {
		    sy=0;
		    turn = 1;
		    sx=1;
		}
	    } else if (turn == 1){
		sx++;
		if (sx >= that.size) {
		    sx = that.size-1;
		    sy = that.size-1;
		    turn = 2;
		}
	    } else if (turn == 2) {
		sy--;
		if (sy < 0) {
		    sx = that.size-2;
		    sy = 0;
		    turn = 3;
		}
	    } else if (turn == 3) {
		sx--;
		if (sx < 0) {
		    return null;
		}
	    }
	    return {x:sx,y:sy};
	}
	return {x:nx, y:ny}
    });

    return r;
}

//iterate = function(x, y, reset);
// reset: function 
// return next check .x .y
Game.prototype.checkWaker = function (x,y,iterate) {
    var prev = 0;
    var count = 0;
    var r = {x:x, y:y};
    while(true) {
	r = iterate(r.x,r.y,function() {
	    prev = 0;
	    count = 0;
	});
	if (!r) {
	    return 0;
	}
	var v = this.tile[r.y*this.size+r.x];
	if (!v) {
	    count = 0;
	} else if (v == prev) {
	    count++;
	} else {
	    count = 0;
	}
	prev = v;
	if (count >= 4) {
	    //console.log('checled', r.x, r.y);
	    return v;
	}
    }
}

Game.prototype.draw = function() {
    this.cx.clearRect(0,0,300,300);
    for(var y = 0;y < this.size;y++) {
	for (var x = 0; x< this.size;x++) {
	    var v = this.tile[y*this.size+x];
	    if (v == "1") {
		this.cx.fillText("@", x*10, y*10+10);
	    } else if (v == "2") {
		this.cx.fillText("+", x*10, y*10+10);
	    }
	}
    }
}

var GAAI = function() {
    this.game = null;
    this.player = null;
    this.genes = {};
}

GAAI.prototype.rand = function() {
    var r = Math.floor(Math.random()*(this.game.emps.length));
    var s =this.game.emps[r];
    //記憶
    this.genes[this.game.tile.join()] = s;
    //設置
    this.game.put(s , this.player);
}

GAAI.prototype.action = function() {
    var gene = this.genes[this.game.tile.join()];

    if (typeof gene == "undefined") {
	this.rand();
    } else {
	//	console.log('action by gene', gene);
	this.game.put(gene, this.player);
    }
}

