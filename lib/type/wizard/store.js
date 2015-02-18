var Util = require( 'findhit-util' ),

    debug = require( 'debug' )( 'emvici-router:route:type:wizard:store' );

// -----------------------------------------------------------------------------
// Store handles wizard session store

function Store ( route ) {

    // If req doesn't have a session, this route type should NOT work, throw Error!
    if( ! route.req[ route.router.options.reqSessionKey ] ) {
        throw new TypeError([
            "emvici-router/lib/type/wizard needs some kind of session.",
            "You should use some session middleware before `.use` emvici-router.",
            "In case you have one and it doesn't place it at `req.session`, please",
            "specify in which key it sits by giving `reqSessionKey` option to",
            "emvici-router constructor options.",

            "Example: `var router = require( 'emvici-router' )({ reqSessionKey: 'YOLO' })`"
            ].join( " " ));
    }

    // Save route on this instance
    Object.defineProperty( this, 'route', {
        enumerable: false,
        writable: false,
        value: route,
    });

    this.useOrAppend();

    // Check for steps data object
    this.data = Util.is.Object( this.data ) && this.data || {};

    // Active branches
    this.activeBranches = Util.is.Array( this.activeBranches ) && this.activeBranches || [];

    // Processed steps
    this.processedSteps = Util.is.Array( this.processedSteps ) && this.processedSteps || [];

    // Current step
    this.current = Util.is.String( this.current ) && this.current || null;

};

// Export Store
module.exports = Store;

/* instance methods */


Store.prototype.branched = function( branch ) {
    return this.activeBranches.indexOf( branch ) !== -1;
};

Store.prototype.branch = function( branch ) {
    if( this.activeBranches.indexOf( branch ) !== -1 ) {
        return false;
    }

    this.activeBranches.push( branch );

    return true;
};

Store.prototype.unbranch = function( branch ) {
    var i;

    if( ( i = this.activeBranches.indexOf( branch ) ) === -1 ) {
        return false;
    }

    this.activeBranches.splice( i, 1 );

    return true;
};

Store.prototype.processed = function( step ) {
    return this.processedSteps.indexOf( step ) !== -1;
};

Store.prototype.process = function ( step ) {
    if( this.processedSteps.indexOf( step ) !== -1 ) {
        return false;
    }

    this.processedSteps.push( step );

    return true;
};

Store.prototype.unprocess = function( step ) {
    var i;

    if( ( i = this.processedSteps.indexOf( step ) ) === -1 ) {
        return false;
    }

    this.processedSteps.splice( i, 1 );

    return true;
};

Store.prototype.currentStep = function ( step ) {

    // If there is no `step` provided, it means that we wan't to get it!
    if( ! step ) {
        return this.current;
    }

    // Otherwise, lets set it!
    this.current = step;

};

Store.prototype.useOrAppend = function () {

    var route = this.route,
        req = route.req,
        session = req[ route.router.options.reqSessionKey ],
        wizardsOnThisSession =
            Util.is.Object( session.wizards ) && session.wizards ||
            ( session.wizards = {} ),
        wizardKey = route.constructor.paths[0].pattern;

    debug( wizardsOnThisSession[ wizardKey ] );

    // If there is already a session for this wizard route
    if( wizardsOnThisSession[ wizardKey ] ) {
        // Extend this store with it
        Util.extend( this, wizardsOnThisSession[ wizardKey ] );
    }

    // Then, ALWAYS, wither if it exists or not, bind this store into session
    wizardsOnThisSession[ wizardKey ] = this;


};

Store.prototype.destroy = function () {

    var route = this.route,
        req = route.req,
        session = req[ route.router.options.reqSessionKey ],
        wizardsOnThisSession =
            Util.is.Object( session.wizards ) && session.wizards ||
            ( session.wizards = {} ),
        wizardKey = route.constructor.paths[0].pattern;


    delete wizardsOnThisSession[ wizardKey ];

};

Store.prototype.get = function ( key, defaultValue ) {
    if( ! key ) {
        throw new Error( "You must provide a key for getting the value" );
    }

    return this.data[ key ] || defaultValue;
};

Store.prototype.set = function ( key, value ) {
    if( ! key ) {
        throw new Error( "You must provide a key for store the value" );
    }

    this.data[ key ] = value;

    return this;
};

Store.prototype.clear = function ( key ) {
    if( ! key ) {
        throw new Error( "You must provide a key to clear" );
    }

    delete this.data[ key ];

    return this;
};
