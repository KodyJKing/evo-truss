import { Delaunay } from "d3-delaunay"
import { lusolve } from "mathjs"
import * as truss from "./truss"
import { range, tuplemin } from "./util"
import Vector2 from "./Vector2"
import * as math from "mathjs"


declare const canvas: HTMLCanvasElement
let c: CanvasRenderingContext2D

window.onload = ( ev ) => {
    resizeCanvas( 800, 800, 1 )
    c = canvas.getContext( "2d" ) as CanvasRenderingContext2D
    mainLoop()
}

function mainLoop() {
    // for ( let i = 0; i < 10; i++ )
    update()
    requestAnimationFrame( mainLoop )
}

let bestRating: number = Infinity
let bestSolution: [ number, number ][] = []
function update() {
    let points = bestRating == Infinity ? generatePoints() : mutatePoints( bestSolution, 10 )
    const delaunay = Delaunay.from( points )
    let edges = Array.from( delaunayEdges( delaunay ) ) as [ number, number ][]
    let rating = analyzeAndRate( points, edges )
    if ( rating < bestRating ) {
        bestRating = rating
        bestSolution = points
        // console.log( rating )
        c.clearRect( 0, 0, canvas.width, canvas.height )
        drawSln( points, edges )
    }
}

function* delaunayEdges( delaunay ) {
    const { halfedges, triangles } = delaunay;
    for ( let i = 0, n = halfedges.length; i < n; ++i ) {
        const j = halfedges[ i ];
        if ( j < i ) continue;
        const ti = triangles[ i ];
        const tj = triangles[ j ];
        yield [ ti, tj ]
    }
}

const margin = 100
function generatePoints() {
    let points: [ number, number ][] = []
    for ( let i of range( 3 ) )
        points.push( [
            Math.random() * ( canvas.width - margin * 2 ) + margin,
            Math.random() * ( canvas.height - margin * 2 ) + margin
        ] )
    points.push( [ 50, 200 ] )
    points.push( [ 50, 600 ] )
    points.push( [ 750, 400 ] )
    return points
}

function mutatePoints( points: [ number, number ][], mutationRate ) {
    let copy = JSON.parse( JSON.stringify( points ) ) as [ number, number ][]
    for ( let i = 0; i < copy.length - 3; i++ ) {
        let pt = copy[ i ]
        pt[ 0 ] += ( Math.random() - .5 ) * mutationRate
        pt[ 1 ] += ( Math.random() - .5 ) * mutationRate
    }
    if ( copy.length > 3 && Math.random() < .1 ) {
        let index = Math.floor( Math.random() * ( copy.length - 3 ) )
        copy.splice( index, 1 )
    }
    if ( copy.length < 20 && Math.random() < .1 ) {
        for ( let i = 0; i < 3; i++ )
            copy.unshift( [
                Math.random() * ( canvas.width - margin * 2 ) + margin,
                Math.random() * ( canvas.height - margin * 2 ) + margin
            ] )
    }
    return copy
}

function analyze( points, edges, upperMountIndex, lowerMountIndex, endpointIndex, endpointLoad ) {
    let vertices = points.map( p => new Vector2( p[ 0 ], p[ 1 ] ) )
    let reactions = [
        [ upperMountIndex, new Vector2( 1, 0 ) ],
        [ upperMountIndex, new Vector2( 0, 1 ) ],
        [ lowerMountIndex, new Vector2( 1, 0 ) ],
    ] as [ number, Vector2 ][]
    let trussMat = truss.trussMatrix( vertices, edges, reactions )
    let trussLoad = truss.trussLoad( vertices.length, [ [ endpointIndex, endpointLoad ] ] )
    let forces: any = null
    try {
        forces = math.lusolve( trussMat, trussLoad )
        // forces = truss.minNormSolve( trussMat, trussLoad )
        // forces = truss.leastSquaresSolve( trussMat, trussLoad )
        // forces = truss.solveTruss( trussMat, trussLoad )
    } catch ( e ) {
        // console.log( "matrix is singular" )
    }
    return [ forces, trussMat, trussLoad ]
}

function rateSln( points, edges, forces, trussMat, trussLoad ) {
    if ( !forces ) return Infinity

    let maxForce = 0
    for ( let term of forces ) maxForce = Math.max( maxForce, Math.abs( term[ 0 ] ) )

    let maxLength = 0
    let totalLength = 0
    for ( let [ i, j ] of edges ) {
        let a = points[ i ]
        let b = points[ j ]
        let length = Math.hypot( a[ 0 ] - b[ 0 ], a[ 1 ] - b[ 1 ] )
        totalLength += length
        maxLength = Math.max( length, maxLength )
    }

    return maxForce + maxLength * 2 + totalLength * .01 //+ points.length * 2
}

function analyzeAndRate( points, edges ) {
    let [ forces, trussMat, trussLoad ] = analyze(
        points, edges,
        points.length - 3,
        points.length - 2,
        points.length - 1,
        new Vector2( 0, 100 )
    )
    return rateSln( points, edges, forces, trussMat, trussLoad )
}

function drawSln( points: [ number, number ][], edges ) {
    for ( let pt of points ) {
        c.beginPath()
        c.arc( pt[ 0 ], pt[ 1 ], 4, 0, Math.PI * 2 )
        c.fill()
    }
    for ( let [ i, j ] of edges ) {
        c.beginPath()
        c.moveTo( ...points[ i ] )
        c.lineTo( ...points[ j ] )
        c.stroke()
    }
}

function resizeCanvas( height, width, pixelDensity ) {
    canvas.style.width = width + "px"
    canvas.style.height = height + "px"
    canvas.width = width * pixelDensity
    canvas.height = height * pixelDensity
    canvas.getContext( "2d" )?.scale( pixelDensity, pixelDensity )
}