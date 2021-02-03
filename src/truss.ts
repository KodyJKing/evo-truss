import * as math from "mathjs"
import Vector2 from "./Vector2"

export type TrussEdge = [ number, number ]
export type TrussReaction = [ number, Vector2 ]
export type TrussLoad = [ number, Vector2 ]
export type TrussProblem = { vertices: Vector2[], reactions: TrussReaction[], edges: TrussEdge[], loads: TrussLoad[] }

export function minNormSolve( A, b ) {
    let At = math.transpose( A )
    let gramMatrix = math.multiply( A, At )
    let w = math.lusolve( gramMatrix, b )
    return math.multiply( At, w )
}

export function leastSquaresSolve( A, b ) {
    let At = math.transpose( A )
    let AtAInv = math.inv( math.multiply( At, A ) )
    let Atb = math.multiply( At, b )
    return math.multiply( AtAInv, Atb )
}

export function solveRectangular( A, b ) {
    let r0 = A[ 0 ]
    let width = r0.length
    let height = A.length
    if ( width > height )
        return minNormSolve( A, b )
    return math.lusolve( A, b )
}

export function trussMatrix( vertices: Vector2[], edges: TrussEdge[], reactions: TrussReaction[] ) {
    let height = 2 * vertices.length
    let width = edges.length + reactions.length
    let matrix = math.zeros( [ height, width ] )

    function setComponent( verti, compi, column, value ) {
        let row = 2 * verti + compi
        matrix[ row ][ column ] = value
    }

    for ( let [ column, edge ] of enumerate( edges ) ) {
        let [ ai, bi ] = edge
        let a = vertices[ ai ]
        let b = vertices[ bi ]
        let unit = b.subtract( a ).unit()

        setComponent( ai, 0, column, unit.x )
        setComponent( ai, 1, column, unit.y )

        setComponent( bi, 0, column, -unit.x )
        setComponent( bi, 1, column, -unit.y )
    }

    for ( let [ reactionInd, reaction ] of enumerate( reactions ) ) {
        let column = edges.length + reactionInd
        let [ i, unit ] = reaction
        setComponent( i, 0, column, unit.x )
        setComponent( i, 1, column, unit.y )
    }

    return matrix
}

export function trussLoad( numVerts, loads: TrussLoad[] ) {
    let matrix = math.zeros( [ numVerts * 2, 1 ] )
    for ( let load of loads ) {
        let [ i, force ] = load
        matrix[ i * 2 + 0 ][ 0 ] += -force.x
        matrix[ i * 2 + 1 ][ 0 ] += -force.y
    }
    return matrix
}

export function solveTruss( problem: TrussProblem ) {
    let { vertices, reactions, edges, loads } = problem
    let mat = trussMatrix( vertices, edges, reactions )
    let ld = trussLoad( vertices.length, loads )
    return math.lusolve( mat, ld )
}

function* enumerate( a ) {
    for ( let i = 0; i < a.length; i++ )
        yield [ i, a[ i ] ]
}

function printMat( mat ) {
    let truncate = x => parseFloat( x.toFixed( 3 ) )
    console.log(
        mat.map(
            row => row.map( x => truncate( x ).toString().padStart( 10 ) ).join( ", " )
        ).join( "\n" )
    )
}

// @ts-ignore
if ( require.main === module ) {
    let vec = ( x, y ) => new Vector2( x, y )
    let trussMat = trussMatrix(
        [
            vec( 0, 0 ),
            vec( 1, 0 ),
            vec( 1, 1 ),
        ],
        [ [ 0, 1 ], [ 1, 2 ], [ 2, 0 ] ],
        [
            [ 0, vec( 1, 0 ) ],
            [ 0, vec( 0, 1 ) ],
            [ 1, vec( 0, 1 ) ],
        ]
    )
    let trussLd = trussLoad(
        3,
        [
            [ 2, vec( 100, 0 ) ]
        ]
    )
    let trussSln = minNormSolve( trussMat, trussLd )
    console.log( "Matrix:" )
    printMat( trussMat )
    console.log( "Load:" )
    printMat( math.transpose( trussLd ) )
    console.log( "Solution" )
    printMat( math.transpose( trussSln ) )
}