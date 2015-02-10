var Util = require( 'findhit-util' ),

    debug = require( 'debug' )( 'emvici-router:route' ),
    Stack = require( 'stack-queue' );

// -----------------------------------------------------------------------------

function Route () {
    throw new Error([

        "You can't use Router directly to construct a new Route.",
        "Please use Route.construct method or [Type]Route.construct instead"

    ].join(" "));
};

// Export Route
module.exports = Route;

/* class methods */

Route.construct = function ( options ) {

    options = Util.is.Object( options ) && Util.extend( {}, options ) || {};
    options.__proto__ = Route.construct.defaultOptions;

    /*
        This method will try to detect options for routes and then proxy
        arguments into a specific route type's constructor.

        If this can't gather a route type, it will default as 'stack'.
    */

    options.url =
        Util.is.Array( options.url ) && options.url ||
        (
            Util.is.String( options.url ) ||
            Util.is.RegExp( options.url )
        ) && [ options.url ] ||
        [];

    if( options.url.length === 0 ) {
        throw new TypeError( "It seems that options.url doesn't have urls..." );
    }

    var TypeRoute = Route.TYPES[
        options.type = ( Util.is.String( options.type ) && options.type.toLowerCase() ) || 'stack'
    ];

    if( ! TypeRoute ) {
        throw new TypeError( "options.type provided doesn't exist!" );
    }

    // Before constructing a new Route, proto options by default Type
    options.__proto__ = TypeRoute.construct.defaultOptions || Route.construct.defaultOptions;

    function ConstructedRoute ( router, nextRoute, matchedPath, req, res ) {
        var url = this.url = req.path || req.url;
        debug('executing url',url);
        this.options = Object.create( ConstructedRoute.options );

        // Router
        this.router = router;

        // Current path filtering
        this.path = matchedPath;

        // Link things to route
        this.req = req;
        this.res = res;
        this.nextRoute = nextRoute;

        // Link route into things
        req.route = this;

        // Parse params from path
        this.params = req.params = matchedPath.Url2Params( url );

        this.prerequisites =
            new Stack().queue( parsePrerequisites( this.options.prerequisites ));

        // Force constructor to be this
        // Don't know why but constructor isn't being defined as ConstructedRoute
        this.constructor = ConstructedRoute;
    };

    // define id
    ConstructedRoute.id = Util.uniqId();

    // define methods
    ConstructedRoute.methods =
        Util.is.Array( options.methods ) && options.methods ||
        Util.is.String( options.methods ) && [ options.methods ] ||
        Util.is.String( options.method ) && [ options.method ] ||
        Route.METHODS;

    ConstructedRoute.paths = [];
    ConstructedRoute.match = TypeRoute.match || Route.match;
    ConstructedRoute.options = options;

    ConstructedRoute.prototype = Object.create( TypeRoute.prototype );

    // Allow TypeRoute to manipulate ConstructedRoute
    TypeRoute.construct( ConstructedRoute );

    if( ConstructedRoute.paths.length === 0 ) {
        throw new TypeError( "It seems that there is not a valid path on this route" );
    }

    return ConstructedRoute;
};

function parsePrerequisites(preq) {

    var prerequisites = [];
    var keys = Object.keys(Route.PREREQUISITES);

    function testAndPushPreq( value ){

        if( Util.is.Function(value) ){

            prerequisites.push(value);

        } else if( Util.is.Array(value) || Util.is.Object(value) ){

            parsePrerequisites(value);

        }

    }

    if( Util.is.String(preq) && keys.indexOf(preq) !== -1 ){

        prerequisites.push(Route.PREREQUISITES[preq]);

    } else if(Util.is.String(preq)) {

        debug( 'Prerequisite is not in the default Prerequisites List. (' + preq + ')' );
        return prerequisites;

    }


    if( Util.is.Object(preq) ){

        Util.Object.forEach(preq,function( value, key ){
            testAndPushPreq( value );
        });

    } else if( Util.is.Array(preq) ){

        Util.Array.forEach(preq, function( value, key ){
            testAndPushPreq( value );
        });

    }
    debug( 'build prerequisites',prerequisites );
    return prerequisites;
}

Route.construct.defaultOptions = {
    type: 'stack',
    method: undefined,
    prerequisites: []
};

Route.match = function ( url, method ) {

    // Check if req.method is a valid one
    if( this.methods.indexOf( method ) === -1 ) {
        return false;
    }

    // Now, since we only need a path to match this route
    // Return the first valid path we found
    for( var i in this.paths ) {
        if( this.paths[ i ].match( url ) ) {
            return this.paths[ i ];
        }
    }

    // Otherwise, sorry...
    return false;
};

/* constants */

Route.TYPES = require( './type' );
Route.METHODS = [ 'GET', 'POST', 'PUT', 'DELETE' ];

// @todo add customer prerequisite
Route.PREREQUISITES = {
    logged : function(req, res){
        debug('prerequisites: logged');
        if( req && res && !req.me ) {
            debug('not logged in');
            var redirectUrl = req.redirectUrl || '/';
            res.redirect(redirectUrl);
            return;
        }
        debug('logged: fulfilled');
        return true;
    },
    unlogged   : function(req, res){
        debug('prerequisites: unlogged');
        if( req && res && req.me ) {
            debug('logged in' );
            var redirectUrl = req.redirectUrl || '/';
            res.redirect(redirectUrl);
            return;
        }
        debug('unlogged: fulfilled');
        return true;
    }
};

/* instance methods */

Route.prototype.dispatch = function () {
    throw new Error([
        "Are you constructing a new Router Type?",
        "It seems that you didn't placed .dispatch on it's prototype..."
    ].join(" "));
};

/* private methods */
