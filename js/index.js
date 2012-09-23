$(function() {
  /* box2d defines */
  var b2Vec2 = Box2D.Common.Math.b2Vec2,
      b2BodyDef = Box2D.Dynamics.b2BodyDef,
      b2Body = Box2D.Dynamics.b2Body,
      b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
      b2Fixture = Box2D.Dynamics.b2Fixture,
      b2World = Box2D.Dynamics.b2World,
      b2MassData = Box2D.Collision.Shapes.b2MassData,
      b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
      b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
      b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

  /* game engine */
  var currentScreen = null,
      prevScreen = null,
      timeoutTick = null,

      startDown = false,
      bDown = false,
      aDown = false,

      world = null, //< box2d world
      bodyDef = new b2BodyDef, //< bodyDef used to create all particles
      fixDef = null, //< fixure definition used while creating particles
      worldBodies = [ ], //< array of bodies created for the current level

      gameCanvas = null,
      gameContext = null,

      resources = { },
      bgGradLeft = null, //< canvas gradient object for left half
      bgGradRight = null, //< canvas gradient object for right half

      defaultGameState = {
        higgsX: 0, //< current x location, set to have screen width on game start
        higgsY: 0, //< current y location, set to bottom of screen on game start

        couplerY: 0 //< current position of a coupler segment (they move fast)
      },

      gameState = { }, //< state of active game play

      currentLevel = ""; //< level currently being played

  function changeScreen( id ) {
    clearTimeout( timeoutTick );

    prevScreen = currentScreen;

    if ( prevScreen ) {
      prevScreen.trigger( "beforehide" );
      prevScreen.hide( );
      prevScreen.trigger( "hide" );
    }

    // clear buttons
    startDown = false;
    bDown = false;
    aDown = false;

    currentScreen = $( id );
    
    currentScreen.trigger( "beforeshow" );
    currentScreen.show( );

    if ( currentScreen.hasClass( "menu" ) ) {
      currentScreen.find( "a" ).first().focus( );
    }

    currentScreen.trigger( "show" );

    tick( );
  }

  function tick( ) {
    if ( currentScreen ) {
      currentScreen.trigger( "tick" );

      timeoutTick = setTimeout( tick, 32 );
    }
  }

  // hook into button/key events to manage our button state
  $( "body" ).on( "keydown keyup", function( e ) {
    if ( e.keyCode === 13 && currentScreen && !currentScreen.hasClass( "menu" ) ) {
      e.preventDefault( );
      startDown = e.type === "keydown";
      return false;
    } else if ( e.keyCode === 27 ) {
      e.preventDefault( );
      bDown = e.type === "keydown";
      return false;
    } else if ( e.keyCode === 32 ) {
      e.preventDefault( );
      aDown = e.type === "keydown";
      return false;
    }
  } );

  // hook up generic screen change links
  $( "a[href^='#']" ).click( function( e ) {
    e.preventDefault( );

    var target = $( this ).attr( "href" );

    if ( target !== "#" ) {
      changeScreen( target );
    }

    return false;
  } );

  /* splash */

  $( "#splash" ).on( "show", function ( ) {
    setTimeout( function() {
      changeScreen( "#title" );
    }, 1000 );
  } );

  /* title */

  $( "#title" ).on( "show", function( ) {
    // reset the level
    currentLevel = "";
  } );

  $( ".title-arcade" ).click( function( ) {
    $( "#level-loading-tip" ).html( $( this ).data( "tip" ) || "" );
  } );

  $( "#title" ).on( "tick", function( ) {
  } );

  /* world-select */

  /* level-select */

  $( ".level-option a" ).click( function( ) {
    var levelOption = $( this );
    currentLevel = levelOption.data( "level" ) || "";
    $( "#level-loading-tip" ).html( levelOption.data( "tip" ) || "" );
  } );

  /* level-loading */

  $( "#level-loading" ).on( "show", function ( ) {
    var gameScreen = $( "#game" );

    if ( !gameContext ) {
      // create game canvas & load resources the first time
      gameScreen.append( '<canvas width="' + gameScreen.width( ) + '" height="' + gameScreen.height( ) + '"></canvas>' );
      gameCanvas = gameScreen.find( "canvas" )[ 0 ];
      gameContext = gameCanvas.getContext( "2d" );

      // create gradients
      bgGradLeft = gameContext.createLinearGradient( 0, 0, gameCanvas.width / 2, 0 );
      bgGradLeft.addColorStop( 0, "#222222" );
      bgGradLeft.addColorStop( 1, "#676767" );

      bgGradRight = gameContext.createLinearGradient( gameCanvas.width / 2, 0, gameCanvas.width, 0 );
      bgGradRight.addColorStop( 0, "#676767" );
      bgGradRight.addColorStop( 1, "#222222" );

      // load resources
      resources.higgs = $( '<img src="img/higgs.png" />' )[ 0 ];
      resources.photon = $( '<img src="img/photon.png" />' )[ 0 ];
      resources.topQuark = $( '<img src="img/top-quark.png" />' )[ 0 ];

      // create box2d world
      world = new b2World(
                new b2Vec2( 0, 32 ), //< gravity
                true //< allow sleep
              );

      // set default state
      defaultGameState.higgsX = gameCanvas.width / 2;
      defaultGameState.higgsY = gameCanvas.height - 128;
    } else {
      // recreate?
    }

    // init current game state
    $.extend( gameState, defaultGameState );

    // create level objects
    bodyDef.type = b2Body.b2_dynamicBody;
    
    fixDef = new b2FixtureDef;
    fixDef.density = 1.0;
    fixDef.friction = 0;
    fixDef.restitution = 0.2;
    fixDef.shape = new b2CircleShape( 32 );

    bodyDef.position.x = 128;
    bodyDef.position.y = -64;

    worldBodies.push( world.CreateBody( bodyDef ) );
    worldBodies[ 0 ].CreateFixture( fixDef );

    // start the game
    setTimeout( function() {
      changeScreen( "#game" );
    }, 1000 );
  } );

  /* game */

  $( "#game" ).mousemove( function( e ) {
    gameState.higgsX = e.offsetX;
  } );

  $( "#game" ).on( "tick", function ( ) {
    if ( startDown || bDown ) {
      changeScreen( "#pause" );
    } else {

      //
      // process input, tick state, step physics
      //

      gameState.couplerY = ( gameState.couplerY + 96 ) % ( gameCanvas.height * 3 );

      world.Step(
        1 / 31.25, //< frame-rate
        10, //< velocity iterations
        10 //< position iterations
      );

      //
      // render
      //

      // draw tube
      gameContext.save( );
      gameContext.fillStyle = bgGradLeft;
      gameContext.fillRect( 0, 0, gameCanvas.width / 2, gameCanvas.height );
      gameContext.fillStyle = bgGradRight;
      gameContext.fillRect( gameCanvas.width / 2, 0, gameCanvas.width / 2, gameCanvas.height );
      gameContext.restore( );


      // draw coupler
      gameContext.save( );
      gameContext.fillStyle = "#222222";
      gameContext.globalAlpha = .3;
      gameContext.fillRect( 0, gameState.couplerY, gameCanvas.width, 32 );
      gameContext.restore( );

      // draw particles
      gameContext.drawImage( resources.topQuark, worldBodies[ 0 ].m_xf.position.x - 32, worldBodies[ 0 ].m_xf.position.y - 32 );

      // draw higgs
      var higgsResource = aDown ? resources.higgs : resources.photon;
      gameContext.drawImage( higgsResource, gameState.higgsX - 32, gameState.higgsY - 32 );
    }
  } );

  /* pause */

  $( "#pause" ).on( "show", function ( ) {
  } );

  $( "#pause" ).on( "tick", function ( ) {
  } );

  /* quit-level */

  $( "#quit-level-yes" ).click( function( ) {
    if ( currentLevel === "" ) {
      // in arcade mode, quit to main mainue
      changeScreen( "#title" );
    } else {
      changeScreen( "#world-" + currentLevel[ 0 ] + "-level-select" );
    }
  } );

  /* let's get going! */

  // pick a starting page
  changeScreen( "#splash" );
});
