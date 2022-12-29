const UPDATE_STEPS_PER_SECOND = 10;
let FRAMECOUNT = 0;
let UPDATECOUNT = 0;
let MODE = 'lit';

/**** CONFIGURABLE GAME WEIGHTS */

/*

Change these to change the balance of the game

*/

// run setCostPerSecond(0.3) for example in the console to update the two values together
let COST_PER_SECOND = 0.05;
let COST_PER_UPDATE = COST_PER_SECOND / UPDATE_STEPS_PER_SECOND;

const setCostPerSecond = function( to ){
    COST_PER_SECOND = to;
    COST_PER_UPDATE = COST_PER_SECOND / UPDATE_STEPS_PER_SECOND;
}

// these variables can be set directly because they don't require calculation
let COST_PER_CAPTURE = -0.1;

let MOOD_PER_ITEM_LOST = -0.2;
let MOOD_PER_COMPONENT_LOST = -0.05;
let MOOD_PER_ITEM_COMBINED = 0.1;

/**** END CONFIGURABLE GAME WEIGHTS */

/**** ADD MORE VARIETY BY ADDING TO THIS ARRAY. NAMES MUST BE CSS COLOR NAMES */
const itemNames = ["red", "green", "blue", "orange", "magenta"];

const Item = function( $parent ){
    this.$parent = $parent;
    this.name = itemNames[ Math.floor( Math.random()* itemNames.length ) ];
    this.$ele = document.createElement( 'div' );
    this.$ele.classList.add('store-item');
    this.$ele.innerHTML = this.name;
    this.$ele.style.color = this.name;
    this.$ele.style.background = this.name;

    this.position = {
        x: 1,
        y: 0.25 + (Math.random() * 0.5)
    }
    this.speed = {
        x: -0.0075,
        y: 0
    }
    this.shouldDestroy = false;
    this.$ele.addEventListener('click', () => {
        this.capture();
    })
    $parent.appendChild( this.$ele );
}

Item.prototype = {
    move: function( multiplier ){
        this.position.x += this.speed.x * multiplier;
        this.position.y += this.speed.y * multiplier;
        if( this.position.x < 0 ){
            this.shouldDestroy = true;
        }
    },
    render: function(){
        const bounds = this.$parent.getBoundingClientRect();
        this.$ele.style.transform = `translateX(${ this.position.x * bounds.width  }px) translateY(${ this.position.y * bounds.height  }px)`;
    },
    capture: function(){
        this.shouldDestroy = true;
        this.onCapture( this );
    },
    runDestroy: function(){
        if( this.shouldDestroy ){
            this.$parent.removeChild( this.$ele );
        }
    },
    onCapture: function(){}
}

const CombinedItem = function( name ){
    this.name = name;
    this.type = "item";
}

const Memory = function( $parent ){
    this.$parent = $parent;
    this.list = [];
    this.$slots = [];
    this.size = 16;
    this.clickTracking = [];
    for( let i = 0; i < this.size; i++ ){
        const $slot = document.createElement('div');
        $slot.classList.add('memory-slot');
        $slot.addEventListener('click', (e) => {
            this.onSlotClick( i );
        });
        this.$parent.appendChild( $slot );
        this.$slots.push( $slot );
        this.list.push({
            type: "empty",
            name: ""
        })
    }
}

Memory.prototype = {
    render: function(){
        for( let i = 0; i < this.list.length; i++ ){
            const $slot = this.$slots[i];
            const item = this.list[i];
            if( item.type === 'label' ){
                $slot.innerHTML = item.name;
                $slot.style.color = item.name;
            } else {
                $slot.innerHTML = '';
                $slot.style.color = 'black';
            }
            if( item.type === 'texture' ){
                $slot.style.color = 'black';
                $slot.style.background = item.name;
            } else {
                $slot.style.background = 'transparent';
            }
            if( item.type === 'item' ){
                $slot.style.color = 'black';
                $slot.style.background = item.name;
                $slot.innerHTML = item.name.toUpperCase() + ' [COMPLETE]';
            }
        }
    },
    add: function( item, mode ){
        item.type = mode;
        if( this.list[this.list.length - 1].type === 'empty' ){
            this.list[this.list.length - 1] = item
        } else {
            const lostItem = this.list.shift();
            this.onLostItem( lostItem );
            this.list.push( item );
        }
        
        this.render();
    },
    onSlotClick: function( index ){
        if( this.clickTracking.indexOf( index ) != -1 ){
            this.clickTracking.splice( this.clickTracking.indexOf( index ), 1 );
        } else {
            this.clickTracking.push( index );
        }
        if( this.clickTracking.length > 2 ){
            this.clickTracking.shift();
        }

        this.$slots.forEach(($slot, i )=> {
            if( this.clickTracking.indexOf(i) !== -1 ){
                $slot.setAttribute('data-clicked', this.clickTracking.indexOf(i) );
            } else {
                $slot.setAttribute('data-clicked', 'false')
            }
        });

        if( this.clickTracking.length == 2 ){
            const item1 = this.list[this.clickTracking[0]];
            const item2 = this.list[this.clickTracking[1]];
            if( item1.name === item2.name ){
                if( item1.type === 'label' && item2.type === 'texture' || item1.type === 'texture' && item2.type === 'label' ){
                    this.runCombine( this.clickTracking[0], this.clickTracking[1] );
                    
                }
            }
            this.clickTracking = [];
        }
    },
    runCombine: function( slot1, slot2 ){
        const item1 = this.list[slot1];
        const item2 = this.list[slot2];
        const newItem = new CombinedItem( item1.name );
        this.list[slot2] = newItem;
        this.list.splice( slot1, 1 );
        this.list.unshift({
            type: "empty",
            name: ""
        })
        this.onCombineItem( newItem );
        this.render();
    },
    onCombineItem: function( item ){},
    onLostItem: function( item ){}
}

const renderCost = function(){
    $costAmount.style.width = cost * 100 + '%';
}

const updateMood = function( by ){
    mood += by;
    if( mood > 1 ){
        mood = 0;
        alert( "FULL JOY: memory");
    }
    if( mood < -1 ){
        mood = 0;
        alert( "FULL FRUSTRATION: memory");
    }
}
const renderMood = function(){
    
    if( mood >= 0 ){
        $frustration.style.width = 0;
        $joy.style.width = mood * 100 + '%';
    } else {
        $joy.style.width = 0;
        $frustration.style.width = Math.abs(mood) * 100 + '%';
        }
}
const addNewItemToStore = function(){
    const item = new Item( $store );
    item.onCapture = function( item ){
        memory.add( 
            item, 
            (MODE === 'memory') ? 'label' : 'texture'
        );
        cost += COST_PER_CAPTURE;
    }
    items.push( item );
}



const $wrap = document.querySelector('#wrap');
const $game = document.querySelector('#game');
const $store = document.querySelector('#store');
const $memory = document.querySelector('#memory');
const $costAmount = document.querySelector('#cost .amount');
const $frustration = document.querySelector('#frustration');
const $joy = document.querySelector('#joy');
const memory = new Memory( $memory );
const items = [];
let cost = 0;
let mood = 0;
/*
    {
        type: label | texture | item  | empty,
        name: "grissini",
    }
*/

const update = function(){
    if( cost < 0 ){
        cost = 0;
    }
    cost += COST_PER_UPDATE;
    renderCost();
    if( cost >= 1 ){
        alert('GAME OVER: cost too high');
    }
    if( UPDATECOUNT % UPDATE_STEPS_PER_SECOND === 0 ){
        addNewItemToStore();
    }
    UPDATECOUNT++;
}
const frame = function(){
    items.forEach(( item ) => {
        item.move( 1-cost );
        item.render();
    });
    for( let i = items.length -1; i >= 0; i-- ){
        if( items[i].shouldDestroy ){
            items[i].runDestroy();
            items.splice(i, 1);
        }
    }
    FRAMECOUNT++;
}
let frameInterval, updateInterval, IS_PLAYING;
const play = function(){
    frameInterval = setInterval( frame, 1000/60 );
    updateInterval = setInterval( update, 1000/UPDATE_STEPS_PER_SECOND );
    IS_PLAYING = true;
}
const pause = function(){
    clearInterval( frameInterval );
    clearInterval( updateInterval );
    IS_PLAYING = false;
}

window.addEventListener( 'keyup', function( e ){
    console.log( 'keyup: ', e.which );
    if( e.which === 80 ){ //p
        if( IS_PLAYING ){
            pause();
        } else {
            play();
        }
    }
});

document.querySelector('#change-mode').addEventListener('click', function(){
    if( MODE === 'lit'){
        MODE = 'memory';
    } else {
        MODE = 'lit';
    }
    $wrap.setAttribute('data-view-mode', MODE );
});

memory.onLostItem = function( item ){
    if( item.type === 'item' ){
        updateMood( MOOD_PER_ITEM_LOST );
    } 
    if( item.type === 'label' || item.type === 'texture' ){
        updateMood( MOOD_PER_COMPONENT_LOST );
    }
    renderMood();
}

memory.onCombineItem = function( item ){
    updateMood( MOOD_PER_ITEM_COMBINED );
    renderMood();
}


play();