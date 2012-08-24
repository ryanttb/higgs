$(function() {
  /* game engine */
  var currentScreen = null,
      prevScreen = null,
      timeoutTick = null;

  function changeScreen( id ) {
    clearTimeout( timeoutTick );

    prevScreen = currentScreen;

    if ( prevScreen ) {
      prevScreen.hide( );
    }

    currentScreen = $( id );
    
    // init
    switch ( currentScreen.prop( "id" ) ) {
      case "splash": initSplash( ); break;
      case "world-select": initWorldSelect( ); break;
    }

    currentScreen.show( );

    tick( );
  }

  function tick( ) {
    if ( currentScreen ) {
      switch ( currentScreen.prop( "id" ) ) {
        case "title": tickTitle( ); break;
        case "world-select": tickWorldSelect( ); break;
        default: break;
      }

      timeoutTick = setTimeout( tick, 500 );
    }
  }

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

  function initSplash( ) {
    setTimeout( function() {
      changeScreen( "#title" );
    }, 1000 );
  }

  /* title */

  function tickTitle( ) {
  }

  /* world-select */

  function initWorldSelect( ) {
  }

  function tickWorldSelect( ) {
  }

  /*
  $( ".world-option a" ).click( function( e ) {
    currentWorld = $( this ).data( "world" );
    changeScreen( "#level-select" );
  } );
  */

  /* let's get going! */

  // pick a starting page
  changeScreen( "#splash" );
});
