import { Delaunay } from "d3-delaunay"
import { lusolve } from "mathjs"
import * as truss from "./truss"
import { range, tuplemin } from "./util"
import Vector2 from "./Vector2"

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

let bestRating = Infinity
let bestSolution: [ number, number ][] = []
function update() {
    let pts = bestRating == Infinity ? generatePoints() : mutatePoints( bestSolution )
    let [ rating, delaunay ] = analyzeAndRate( pts )
    if ( rating < bestRating ) {
        bestRating = rating
        bestSolution = pts
        console.log( rating )
        c.clearRect( 0, 0, canvas.width, canvas.height )
        drawSln( pts, delaunay )
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

function generatePoints() {
    const margin = 100
    let pts: [ number, number ][] = []
    for ( let i of range( 3 ) )
        pts.push( [
            Math.random() * ( canvas.width - margin * 2 ) + margin,
            Math.random() * ( canvas.height - margin * 2 ) + margin
        ] )
    pts.push( [ 50, 200 ] )
    pts.push( [ 50, 600 ] )
    pts.push( [ 750, 400 ] )
    return pts
}

function mutatePoints( pts: [ number, number ][] ) {
    let copy = JSON.parse( JSON.stringify( pts ) ) as [ number, number ][]
    for ( let i = 0; i < copy.length - 3; i++ ) {
        let pt = copy[ i ]
        pt[ 0 ] += ( Math.random() - .5 ) * 10
        pt[ 1 ] += ( Math.random() - .5 ) * 10
    }
    if ( copy.length > 3 && Math.random() < .1 ) {
        let index = Math.floor( Math.random() * ( copy.length - 3 ) )
        copy.splice( index, 1 )
    }
    if ( copy.length < 20 && Math.random() < .1 ) {
        const margin = 100
        copy.unshift( [
            Math.random() * ( canvas.width - margin * 2 ) + margin,
            Math.random() * ( canvas.height - margin * 2 ) + margin
        ] )
    }
    return copy
}

function analyze( pts, delaunay, upperMountIndex, lowerMountIndex, endpointIndex, endpointLoad ) {
    let edges = Array.from( delaunayEdges( delaunay ) ) as [ number, number ][]
    let vertices = pts.map( p => new Vector2( p[ 0 ], p[ 1 ] ) )
    let reactions = [
        [ upperMountIndex, new Vector2( 1, 0 ) ],
        [ upperMountIndex, new Vector2( 0, 1 ) ],
        [ lowerMountIndex, new Vector2( 1, 0 ) ],
    ] as [ number, Vector2 ][]
    let trussMat = truss.trussMatrix( vertices, edges, reactions )
    let trussLoad = truss.trussLoad( vertices.length, [ [ endpointIndex, endpointLoad ] ] )
    let trussSln: any = null
    try {
        // trussSln = truss.minNormSolve( trussMat, trussLoad )
        trussSln = lusolve( trussMat, trussLoad ) //truss.minNormSolve( trussMat, trussLoad )
    } catch ( e ) {
        // console.log( "matrix is singular" )
    }
    return trussSln
}

function rateSln( forces ) {
    if ( !forces ) return Infinity
    let rating = 0
    for ( let term of forces ) rating += term[ 0 ] ** 2
    return Math.sqrt( rating )
}

function analyzeAndRate( pts ) {
    // console.time( "analyze" )
    const delaunay = Delaunay.from( pts )
    let forces = analyze(
        pts, delaunay,
        pts.length - 3,
        pts.length - 2,
        pts.length - 1,
        new Vector2( 0, 100 )
    )
    // console.timeEnd( "analyze" )
    return [ rateSln( forces ), delaunay ]
}

function drawSln( pts: [ number, number ][], delaunay ) {
    for ( let pt of pts ) {
        c.beginPath()
        c.arc( ...pt, 4, 0, Math.PI * 2 )
        c.fill()
    }
    for ( let [ i, j ] of delaunayEdges( delaunay ) ) {
        c.beginPath()
        c.moveTo( ...pts[ i ] )
        c.lineTo( ...pts[ j ] )
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