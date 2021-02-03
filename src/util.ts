import { number } from "mathjs"
import Vector2 from "./Vector2"

export function* range( stop, start = 0 ) {
    for ( let i = start; i < stop; i++ ) yield i
}

export function tuplemin( a: [ number, any ], b: [ number, any ] ) {
    return a[ 0 ] < b[ 0 ] ? a : b
}

export function tuplemax( a: [ number, any ], b: [ number, any ] ) {
    return a[ 0 ] < b[ 0 ] ? a : b
}

export function clamp( x, low, high ) {
    return Math.min( high, Math.max( low, x ) )
}

export function pointLineDistance( p: Vector2, a: Vector2, b: Vector2 ) {
    let diff = b.subtract( a )
    let length = diff.length
    let unit = diff.unit()
    let aToP = p.subtract( a )
    let proj = clamp( aToP.dot( unit ), 0, length )
    let projPt = unit.multiply( proj ).add( a )
    return projPt.subtract( p ).length
}

export function removeFromArray( element: any, array: any[] ) {
    let i = array.indexOf( element )
    array.splice( i, 1 )
}

export function findMin<T>( array: T[], f: ( T ) => number ) {
    let best: T | undefined = undefined
    let bestF = Infinity
    for ( let element of array ) {
        let fe = f( element )
        if ( fe < bestF ) {
            best = element
            bestF = fe
        }
    }
    return best
}