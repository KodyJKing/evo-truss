export function vector( x, y ) { return new Vector2( x, y ) }
export default class Vector2 {

    readonly x: number
    readonly y: number

    static ZERO = new Vector2( 0, 0 )
    static ONE = new Vector2( 1, 1 )
    static RIGHT = new Vector2( 1, 0 )
    static LEFT = new Vector2( -1, 0 )
    static DOWN = new Vector2( 0, 1 )
    static UP = new Vector2( 0, -1 )

    constructor( x: number, y: number ) {
        this.x = x
        this.y = y
    }

    get length() { return Math.sqrt( this.x * this.x + this.y * this.y ) }
    get lengthSquared() { return this.x * this.x + this.y * this.y }
    get angle() { return Math.atan2( this.y, this.x ) }

    distance( other: Vector2 ) { return Math.hypot( this.x - other.x, this.y - other.y ) }

    unit() { return this.multiply( 1 / this.length ) }
    leftNormal() { return new Vector2( -this.y, this.x ) }
    rightNormal() { return new Vector2( this.y, -this.x ) }
    negate() { return new Vector2( -this.x, -this.y ) }
    half() { return new Vector2( this.x * 0.5, this.y * 0.5 ) }
    copy() { return new Vector2( this.x, this.y ) }

    floor( scale = 1 ) { return new Vector2( Math.floor( this.x / scale ) * scale, Math.floor( this.y / scale ) * scale ) }

    add( other: Vector2 ) { return new Vector2( this.x + other.x, this.y + other.y ) }
    addXY( x: number, y: number ) { return new Vector2( this.x + x, this.y + y ) }
    addX( x: number ) { return new Vector2( this.x + x, this.y ) }
    addY( y: number ) { return new Vector2( this.x, this.y + y ) }
    subtract( other: Vector2 ) { return new Vector2( this.x - other.x, this.y - other.y ) }
    dot( other: Vector2 ) { return this.x * other.x + this.y * other.y }
    cross( other: Vector2 ) { return this.x * other.y - this.y * other.x }
    multiply( scale: number ) { return new Vector2( this.x * scale, this.y * scale ) }
    stretch( x: number, y: number ) { return new Vector2( this.x * x, this.y * y ) }
    divide( divisor: number ) { return new Vector2( this.x / divisor, this.y / divisor ) }
    lerp( other: Vector2, t: number ) { return this.multiply( 1 - t ).add( other.multiply( t ) ) }

    rotated( angle: number ) {
        return this.complexProduct( Vector2.polar( angle, 1 ) )
    }

    isRightOf( other: Vector2 ) {
        return this.cross( other ) > 0
    }

    normalOnSide( side: Vector2 ) {
        if ( side.isRightOf( this ) )
            return this.rightNormal()
        return this.leftNormal()
    }

    *[ Symbol.iterator ]() {
        yield this.x
        yield this.y
    }

    complexProduct( other: Vector2 ) {
        let x = this.x * other.x - this.y * other.y
        let y = this.x * other.y + this.y * other.x
        return new Vector2( x, y )
    }

    complexQuotient( other: Vector2 ) {
        let lengthSquared = other.lengthSquared
        let x = this.x * other.x + this.y * other.y
        let y = this.y * other.x - this.x * other.y
        return new Vector2( x / lengthSquared, y / lengthSquared )
    }

    complexExponential() {
        let magnitude = Math.exp( this.x )
        return new Vector2( magnitude * Math.cos( this.y ), magnitude * Math.sin( this.y ) )
    }

    projection( other: Vector2 ) {
        return other.multiply( other.dot( this ) / other.lengthSquared )
    }

    static polar( angle, length ) {
        return new Vector2( Math.cos( angle ) * length, Math.sin( angle ) * length )
    }

    static random( length ) {
        let angle = Math.random() * 2 * Math.PI
        return Vector2.polar( angle, length )
    }

}