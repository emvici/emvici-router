var Util = require( 'findhit-util' ),
    Promise = require( 'bluebird' ),

    Route = require( '../../lib/route' ),
    Router = require( '../../lib/router' ),

    sinon = require( 'sinon' ),
    chai = require( 'chai' ),
    expect = chai.expect;

describe( "StackRoute", function () {
    var router = new Router();
    var route;

    before(function () {
        route = Route.construct({
            router: router,
            url: '/wtf',
            type: 'stack',
            stack: [
                sinon.stub().returns( true ),
                sinon.stub().returns( 40 ),
                sinon.stub().callsArg( 2 ),
            ]
        });
    });

    it( "stack should have a length of 3", function () {
        expect( route.stack ).to.have.length( 3 );
    });

});
