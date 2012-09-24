$(function() {
  /* box2d defines */
  var b2Settings = Box2D.Common.b2Settings,
      b2Vec2 = Box2D.Common.Math.b2Vec2,
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
      bodyDef = new b2BodyDef( ), //< bodyDef used to create all particles
      fixDef = new b2FixtureDef( ), //< fixure definition used while creating particles
      curBody, //< body iterator
      nextBody, //< body iterator

      higgsBody = null, //< body just for higgs
      higgsOffscreenPos = new b2Vec2( 320, 480 ),

      gameCanvas = null,
      gameContext = null,

      resources = { },
      bgGradLeft = null, //< canvas gradient object for left half
      bgGradRight = null, //< canvas gradient object for right half

      defaultGameState = {
        couplerY: 0 //< current position of a coupler segment (they move fast)
      },

      gameState = { }, //< state of active game play

      currentLevel = ""; //< level currently being played

  // create a generic particle circle shape
  // we only need to do this once at the beginning
  // until we get more intricate particle shapes
  fixDef.shape = new b2CircleShape( 32 );

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

      timeoutTick = setTimeout( tick, 1000 / 30 );
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
                new b2Vec2( 0, 0 ), //< gravity
                true //< allow sleep
              );

      // setup debug draw
      var debugDraw = new b2DebugDraw();
      debugDraw.SetSprite(gameContext);
      debugDraw.SetFillAlpha(0.5);
      debugDraw.SetLineThickness(1.0);
      debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
      world.SetDebugDraw(debugDraw);
    } else {
      // recreate?
    }

    // init current game state
    $.extend( gameState, defaultGameState );

    // set default position
    gameState.higgsPos = new b2Vec2( gameCanvas.width / 2, gameCanvas.height - 128 );

    // create level objects

    // eventually we will create bodies in tick
    // when we need them depending on frame
    bodyDef.type = b2Body.b2_dynamicBody;
    
    fixDef.density = 1.0;
    fixDef.friction = 0;
    fixDef.restitution = 0.2;

    // create higgs
    bodyDef.position.Set( 320, 480 );
    bodyDef.linearVelocity.Set( 0, 0 );
    bodyDef.angle = b2Settings.b2_pi / -2;

    higgsBody = world.CreateBody( bodyDef );
    higgsBody.CreateFixture( fixDef );

    // create everyone else
    bodyDef.position.Set( 128, -64 );
    bodyDef.linearVelocity.Set( 0, 128 );
    bodyDef.angle = b2Settings.b2_pi / 2;

    world.CreateBody( bodyDef ).CreateFixture( fixDef );

    // start the game
    setTimeout( function() {
      changeScreen( "#game" );
    }, 1000 );
  } );

  /* game */

  $( "#game" ).mousemove( function( e ) {
    gameState.higgsPos.x = e.offsetX;
  } );

  $( "#game" ).on( "tick", function ( ) {
    if ( startDown || bDown ) {
      changeScreen( "#pause" );
    } else {
      //
      // process input, tick state, step physics
      //

      // draw the tube coupler
      gameState.couplerY = ( gameState.couplerY + 96 ) % ( gameCanvas.height * 3 );

      if ( aDown ) {
        // move the higgs body back onto the screen
        higgsBody.SetPosition( gameState.higgsPos );
      } else {
        // move higgs back offscreen
        higgsBody.SetPosition( higgsOffscreenPos );
      }

      world.Step(
        1 / 30, //< frame-rate
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

      // run through the body list
      curBody = world.GetBodyList( );
      while ( curBody ) {
        nextBody = curBody.GetNext( );

        if ( curBody.m_type === b2Body.b2_dynamicBody && curBody !== higgsBody ) {
          // only draw dynamic bodies that are not higgs
          if ( curBody.m_xf.position.y > gameCanvas.height + 32 ) {
            // if the body has gone too far, delete it here instead of drawing it
            world.DestroyBody( curBody );
          } else {
            // draw the particle
            // the particle image to draw will eventually be part of userData on the body
            gameContext.drawImage( resources.topQuark, curBody.m_xf.position.x - 32, curBody.m_xf.position.y - 32 );
          }
        }

        curBody = nextBody;
      }

      // draw higgs
      gameContext.drawImage( aDown ? resources.higgs : resources.photon, gameState.higgsPos.x - 32, gameState.higgsPos.y - 32 );

      // draw physics debug
      //world.DrawDebugData();
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
