var Util = require( 'findhit-util' ),
    Promise = require( 'bluebird' ),

    Router = require( '../../../lib/router' ),
    Route = require( '../../../lib/route' ),

    sinon = require( 'sinon' ),
    chai = require( 'chai' ),
    expect = chai.expect;

describe( "WizardRoute", function () {
    var router = new Router();
    var route;

    before(function () {
        route = Route.construct({
            router: router,
            url: '/buy/breakfast',
            type: 'wizard',
            steps: [
                { // step
                    name: 'menu',
                    prepare: sinon.spy(),
                },
                { // step
                    name: 'drink',
                    prepare: sinon.spy(),
                },

                { // branch
                    name: 'snacks',
                    steps: [

                        { // branch
                            name: 'chicken',
                            steps: [

                                { // step
                                    name: 'wings',
                                    prepare: sinon.spy(),
                                },

                                { // step
                                    name: 'peitinho',
                                    prepare: sinon.spy(),
                                },

                            ],

                        },

                        { // step
                            name: 'fromage',
                            prepare: sinon.spy(),
                        },

                    ],
                },
                { // step
                    name: 'delivery',
                    prepare: sinon.spy(),
                }
            ],
        });
    });

    it( "should have 6 steps", function () {
        expect( route.steps ).to.have.length( 6 );
    });

    it( "should have 2 branches", function () {
        expect( route.branches ).to.have.length( 2 );
    });

    describe( ".match", function () {
        var shouldBe = function ( match, url ) {
            it( "should" + ( match ? " NOT " : " " ) + "work with " + url, function () {
                var ex = expect( route.match( url, 'GET' ) );
                if ( match ) ex.to.be.ok; else ex.to.not.be.ok;
            });
        };

        shouldBe( 1, '/buy/breakfast' );
        shouldBe( 1, '/buy/breakfast/menu' );
        shouldBe( 0, '/buy/breakfast/snacks' );
        shouldBe( 0, '/buy/breakfast/snacks/chicken' );
        shouldBe( 1, '/buy/breakfast/snacks/chicken/wings' );
        shouldBe( 1, '/buy/breakfast/snacks/fromage' );
        shouldBe( 0, '/buy/breakfast/free' );
        shouldBe( 0, '/buy/breakfast/something' );
    });

});
