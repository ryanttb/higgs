$(function() {
  /* game engine */
  var currentScreen = null,
      prevScreen = null,
      timeoutTick = null,

      startDown = false,
      bDown = false,

      gameContext = null;

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

      timeoutTick = setTimeout( tick, 128 );
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
    setTimeout( function() {
      changeScreen( "#game" );
    }, 1000 );
  } );

  /* game */

  $( "#game" ).on( "beforeshow", function ( ) {
    var gameScreen = $( this );

    if ( !gameContext ) {
      gameScreen.append( '<canvas width="' + gameScreen.width( ) + '" height="' + gameScreen.height( ) + '"></canvas>' );
      gameContext = gameScreen.find( "canvas" )[ 0 ].getContext( "2d" );
    } else {
      // recreate?
    }

    gameContext.fill = "#0000ff";
    gameContext.fillRect( 0, 0, 100, 100 ); //gameScreen.width( ), gameScreen.height( ) );
  } );

  $( "#game" ).on( "tick", function ( ) {
    if ( startDown || bDown ) {
      changeScreen( "#pause" );
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
