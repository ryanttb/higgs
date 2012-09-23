$(function() {
  /* game engine */
  var currentScreen = null,
      prevScreen = null,
      timeoutTick = null,

      startDown = false,
      bDown = false,
      aDown = false,

      gameCanvas = null,
      gameContext = null,

      resources = { },

      defaultGameState = {
        higgsX: 0, //< current x location, set to have screen width on game start
        higgsY: 0, //< current y location, set to bottom of screen on game start

        couplerY: 0 //< current position of a coupler segment (they move fast)
      },

      gameState = { };

  /* game-specific state */

  var currentLevel = "";

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

      // set default state
      defaultGameState.higgsX = gameCanvas.width / 2;
      defaultGameState.higgsY = gameCanvas.height - 128;

      // load resources
      resources.higgs = $( '<img src="img/higgs.png" />' )[ 0 ];
      resources.photon = $( '<img src="img/photon.png" />' )[ 0 ];
    } else {
      // recreate?
    }

    // init current game state

    $.extend( gameState, defaultGameState );

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
      // process input, tick state
      //

      gameState.couplerY += 96;
      if ( gameState.couplerY > gameCanvas.height * 3 ) {
        gameState.couplerY = 0;
      }

      //
      // render
      //

      // clear
      gameContext.fillStyle = "#b09999";
      gameContext.fillRect( 0, 0, gameCanvas.width, gameCanvas.height );

      // draw coupler
      gameContext.save( );
      gameContext.fillStyle = "#222222";
      gameContext.globalAlpha = .2;
      gameContext.fillRect( 0, gameState.couplerY, gameCanvas.width, 32 );
      gameContext.restore( );

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
