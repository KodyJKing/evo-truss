export function* range( stop, start = 0 ) {
    for ( let i = start; i < stop; i++ ) yield i
}

export function tuplemin( a: [ number, any ], b: [ number, any ] ) {
    return a[ 0 ] < b[ 0 ] ? a : b
}

export function tuplemax( a: [ number, any ], b: [ number, any ] ) {
    return a[ 0 ] < b[ 0 ] ? a : b
}