$(function() {
  /* game engine */
  var currentScreen = null,
      prevScreen = null,
      timeoutTick = null;

  function changeScreen( id ) {
    clearTimeout( timeoutTick );

    prevScreen = currentScreen;

    if ( prevScreen ) {
      prevScreen.trigger( "beforehide" );
      prevScreen.hide( );
      prevScreen.trigger( "hide" );
    }

    currentScreen = $( id );
    
    currentScreen.trigger( "beforeshow" );
    currentScreen.show( );
    currentScreen.trigger( "show" );

    tick( );
  }

  function tick( ) {
    if ( currentScreen ) {
      currentScreen.trigger( "tick" );

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

  $( "#splash" ).on( "show", function ( ) {
    setTimeout( function() {
      changeScreen( "#title" );
    }, 1000 );
  } );

  /* title */

  $( "#title" ).on( "beforeshow", function( ) {
  } );

  $( "#title" ).on( "tick", function( ) {
  } );

  /* world-select */

  /* level-select */

  $( ".level-option a" ).click( function( ) {
    $( "#level-loading-tip" ).html( $( this ).data( "tip" ) || "" );
  } );

  /* let's get going! */

  // pick a starting page
  changeScreen( "#splash" );
});
